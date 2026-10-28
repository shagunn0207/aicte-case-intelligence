from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_, exists
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Institution, ComplaintCase
from backend.schemas import (
    InstitutionListResponse,
    InstitutionListItem,
    InstitutionProfileResponse,
    CaseSummary
)

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

# Statuses that are considered "pending" (active / not resolved)
PENDING_STATUSES = {"Pending", "Under Process", "Escalated", "Transferred"}


@router.get("", response_model=InstitutionListResponse)
def list_institutions(
    q: Optional[str] = Query(None, description="Case-insensitive partial search against institution names and IDs"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter institutions by case status. Use 'pending' to show only institutions with at least one active (non-disposed) case."),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db)
):
    """
    Search and list institutions with pagination and complaint case counts.
    Supports case-insensitive partial search across institution names and IDs.
    Supports optional status filter: 'pending' returns only institutions with at least one
    active (Pending, Under Process, Escalated, or Transferred) complaint case.
    """
    # Subquery for counting cases per institution
    case_count_subq = (
        select(
            ComplaintCase.institution_id,
            func.count(ComplaintCase.case_id).label("case_count")
        )
        .group_by(ComplaintCase.institution_id)
        .subquery()
    )

    # Base query joining institution with case count
    stmt = (
        select(
            Institution,
            func.coalesce(case_count_subq.c.case_count, 0).label("case_count")
        )
        .outerjoin(case_count_subq, Institution.institution_id == case_count_subq.c.institution_id)
    )

    # Filter by search term if provided
    count_stmt = select(func.count(Institution.institution_id))
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        filter_clause = or_(
            Institution.name.ilike(search_term),
            Institution.institution_id.ilike(search_term)
        )
        stmt = stmt.where(filter_clause)
        count_stmt = count_stmt.where(filter_clause)

    # Filter by status if provided
    # 'pending' means institutions with at least one active (non-disposed) case
    # Other values (under_process, disposed, transferred, escalated, overdue) filter
    # institutions that have at least one case matching that exact status.
    if status_filter and status_filter.strip():
        sf_lower = status_filter.strip().lower()
        if sf_lower == "pending":
            pending_inst_subq = (
                select(ComplaintCase.institution_id)
                .where(ComplaintCase.status.in_(list(PENDING_STATUSES)))
                .distinct()
                .subquery()
            )
            stmt = stmt.where(Institution.institution_id.in_(select(pending_inst_subq)))
            count_stmt = count_stmt.where(
                Institution.institution_id.in_(select(pending_inst_subq))
            )
        elif sf_lower == "overdue":
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            overdue_inst_subq = (
                select(ComplaintCase.institution_id)
                .where(
                    ComplaintCase.status != "Disposed",
                    ComplaintCase.due_date.isnot(None),
                    ComplaintCase.due_date < now
                )
                .distinct()
                .subquery()
            )
            stmt = stmt.where(Institution.institution_id.in_(select(overdue_inst_subq)))
            count_stmt = count_stmt.where(
                Institution.institution_id.in_(select(overdue_inst_subq))
            )
        else:
            # Map URL-friendly slug back to the exact DB status string
            STATUS_SLUG_MAP = {
                "under_process": "Under Process",
                "disposed": "Disposed",
                "transferred": "Transferred",
                "escalated": "Escalated",
            }
            db_status = STATUS_SLUG_MAP.get(sf_lower, status_filter.strip())
            specific_inst_subq = (
                select(ComplaintCase.institution_id)
                .where(ComplaintCase.status == db_status)
                .distinct()
                .subquery()
            )
            stmt = stmt.where(Institution.institution_id.in_(select(specific_inst_subq)))
            count_stmt = count_stmt.where(
                Institution.institution_id.in_(select(specific_inst_subq))
            )

    total = db.scalar(count_stmt) or 0

    # Deterministic sorting & pagination
    stmt = stmt.order_by(Institution.name.asc(), Institution.institution_id.asc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    results = db.execute(stmt).all()

    items = [
        InstitutionListItem(
            institution_id=inst.institution_id,
            name=inst.name,
            region=inst.region,
            case_count=count
        )
        for inst, count in results
    ]

    return InstitutionListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.get("/{institution_id}", response_model=InstitutionProfileResponse)
def get_institution_profile(
    institution_id: str,
    db: Session = Depends(get_db)
):
    """
    Institution 360° Profile:
    Returns complete institution details and all associated complaint cases across AICTE Bureaus/Cells.
    """
    institution = db.query(Institution).filter(Institution.institution_id == institution_id).first()
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' was not found."
        )

    # Deterministic ordering for associated cases: newest received_date first, tie-breaker case_id
    cases = (
        db.query(ComplaintCase)
        .filter(ComplaintCase.institution_id == institution_id)
        .order_by(ComplaintCase.received_date.desc(), ComplaintCase.case_id.desc())
        .all()
    )

    associated_cases = [CaseSummary.model_validate(c) for c in cases]

    return InstitutionProfileResponse(
        institution_id=institution.institution_id,
        name=institution.name,
        address=institution.address,
        region=institution.region,
        institution_type=institution.institution_type,
        case_count=len(associated_cases),
        created_at=institution.created_at,
        associated_cases=associated_cases
    )
