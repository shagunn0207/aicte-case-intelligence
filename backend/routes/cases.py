from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import ComplaintCase, Institution, CaseAction, CoordinationReview
from backend.schemas import (
    CaseListResponse,
    CaseSummary,
    CaseDetailResponse,
    CaseActionSchema,
    CaseUpdate,
    InstitutionSimple,
    CaseLinksResponse,
    CaseLinkItem
)
from backend.services.case_workflow import update_case_workflow
from backend.services.deadlines import get_current_utc_time
from backend.matching import derive_stable_overlap_id

router = APIRouter(prefix="/api/cases", tags=["Complaint Cases"])


@router.get("", response_model=CaseListResponse)
def list_cases(
    institution_id: Optional[str] = Query(None, description="Filter by AICTE Institution ID"),
    bureau: Optional[str] = Query(None, description="Filter by AICTE Bureau or Cell (e.g., PGRC, RB)"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, Under Process, Disposed, Transferred, Escalated)"),
    region: Optional[str] = Query(None, description="Filter by Institution Region/State"),
    category: Optional[str] = Query(None, description="Filter by Complaint Category"),
    from_date: Optional[datetime] = Query(None, description="Filter cases received on or after this ISO-8601 timestamp"),
    to_date: Optional[datetime] = Query(None, description="Filter cases received on or before this ISO-8601 timestamp"),
    overdue: Optional[bool] = Query(None, description="Filter cases by overdue status (true/false)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated list of complaint cases with flexible multi-attribute filtering.
    Filters can be combined (institution_id, bureau, status, region, category, date range, overdue).
    Sorts deterministically by newest received_date first, with case_id as tie-breaker.
    """
    # Validate date range
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=422,
            detail="Invalid date range: 'from_date' cannot be later than 'to_date'."
        )

    # Base query for cases
    stmt = select(ComplaintCase)
    count_stmt = select(func.count(ComplaintCase.case_id))

    # If filtering by region, join Institution
    if region and region.strip():
        stmt = stmt.join(Institution, ComplaintCase.institution_id == Institution.institution_id)
        count_stmt = count_stmt.join(Institution, ComplaintCase.institution_id == Institution.institution_id)
        stmt = stmt.where(Institution.region.ilike(f"%{region.strip()}%"))
        count_stmt = count_stmt.where(Institution.region.ilike(f"%{region.strip()}%"))

    # Apply other filters
    if institution_id and institution_id.strip():
        stmt = stmt.where(ComplaintCase.institution_id == institution_id.strip())
        count_stmt = count_stmt.where(ComplaintCase.institution_id == institution_id.strip())

    if bureau and bureau.strip():
        stmt = stmt.where(ComplaintCase.bureau.ilike(bureau.strip()))
        count_stmt = count_stmt.where(ComplaintCase.bureau.ilike(bureau.strip()))

    if status and status.strip():
        stmt = stmt.where(ComplaintCase.status.ilike(status.strip()))
        count_stmt = count_stmt.where(ComplaintCase.status.ilike(status.strip()))

    if category and category.strip():
        stmt = stmt.where(ComplaintCase.category.ilike(f"%{category.strip()}%"))
        count_stmt = count_stmt.where(ComplaintCase.category.ilike(f"%{category.strip()}%"))

    # Normalize tzinfo if present for consistent SQLite comparison
    if from_date:
        normalized_from = from_date.replace(tzinfo=None) if from_date.tzinfo else from_date
        stmt = stmt.where(ComplaintCase.received_date >= normalized_from)
        count_stmt = count_stmt.where(ComplaintCase.received_date >= normalized_from)

    if to_date:
        normalized_to = to_date.replace(tzinfo=None) if to_date.tzinfo else to_date
        stmt = stmt.where(ComplaintCase.received_date <= normalized_to)
        count_stmt = count_stmt.where(ComplaintCase.received_date <= normalized_to)

    # Overdue filter: A case is overdue if due_date < current_time AND status != 'Disposed'
    # Missing due dates or disposed cases are never overdue.
    if overdue is not None:
        now = get_current_utc_time()
        if overdue is True:
            stmt = stmt.where(
                ComplaintCase.status != "Disposed",
                ComplaintCase.due_date.isnot(None),
                ComplaintCase.due_date < now
            )
            count_stmt = count_stmt.where(
                ComplaintCase.status != "Disposed",
                ComplaintCase.due_date.isnot(None),
                ComplaintCase.due_date < now
            )
        else:
            stmt = stmt.where(
                or_(
                    ComplaintCase.status == "Disposed",
                    ComplaintCase.due_date.is_(None),
                    ComplaintCase.due_date >= now
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    ComplaintCase.status == "Disposed",
                    ComplaintCase.due_date.is_(None),
                    ComplaintCase.due_date >= now
                )
            )

    total = db.scalar(count_stmt) or 0

    # Deterministic sorting: newest received_date first, tie-breaker case_id
    stmt = stmt.order_by(ComplaintCase.received_date.desc(), ComplaintCase.case_id.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    cases = db.scalars(stmt).all()

    items = [CaseSummary.model_validate(c) for c in cases]

    return CaseListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve complete case record by case_id, including institution information
    and associated action history audit trail.
    """
    case = (
        db.query(ComplaintCase)
        .options(
            joinedload(ComplaintCase.institution),
            joinedload(ComplaintCase.action_history)
        )
        .filter(ComplaintCase.case_id == case_id)
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Complaint case with ID '{case_id}' was not found."
        )

    # Sort actions deterministically: newest first
    sorted_actions = sorted(case.action_history, key=lambda a: a.action_date, reverse=True)

    institution_info = None
    if case.institution:
        institution_info = InstitutionSimple.model_validate(case.institution)

    return CaseDetailResponse(
        case_id=case.case_id,
        institution_id=case.institution_id,
        category=case.category,
        description=case.description,
        bureau=case.bureau,
        status=case.status,
        assigned_officer=case.assigned_officer,
        received_date=case.received_date,
        due_date=case.due_date,
        last_action=case.last_action,
        next_action=case.next_action,
        last_action_at=case.last_action_at,
        created_at=case.created_at,
        updated_at=case.updated_at,
        institution=institution_info,
        action_history=[CaseActionSchema.model_validate(a) for a in sorted_actions]
    )


@router.patch("/{case_id}", response_model=CaseDetailResponse)
def update_case(
    case_id: str,
    update_data: CaseUpdate,
    db: Session = Depends(get_db)
):
    """
    Apply partial updates to a complaint case (status, assignment, due date, procedural notes).
    Maintains persistent audit history in CaseAction table in a single transaction.
    """
    case = update_case_workflow(db=db, case_id=case_id, update_data=update_data)

    # Reload case with relationships
    refreshed_case = (
        db.query(ComplaintCase)
        .options(
            joinedload(ComplaintCase.institution),
            joinedload(ComplaintCase.action_history)
        )
        .filter(ComplaintCase.case_id == case.case_id)
        .first()
    )

    sorted_actions = sorted(refreshed_case.action_history, key=lambda a: a.action_date, reverse=True)

    institution_info = None
    if refreshed_case.institution:
        institution_info = InstitutionSimple.model_validate(refreshed_case.institution)

    return CaseDetailResponse(
        case_id=refreshed_case.case_id,
        institution_id=refreshed_case.institution_id,
        category=refreshed_case.category,
        description=refreshed_case.description,
        bureau=refreshed_case.bureau,
        status=refreshed_case.status,
        assigned_officer=refreshed_case.assigned_officer,
        received_date=refreshed_case.received_date,
        due_date=refreshed_case.due_date,
        last_action=refreshed_case.last_action,
        next_action=refreshed_case.next_action,
        last_action_at=refreshed_case.last_action_at,
        created_at=refreshed_case.created_at,
        updated_at=refreshed_case.updated_at,
        institution=institution_info,
        action_history=[CaseActionSchema.model_validate(a) for a in sorted_actions]
    )


@router.get("/{case_id}/links", response_model=CaseLinksResponse)
def get_case_links(
    case_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve confirmed case-to-case coordination links for a complaint case.
    Searches CoordinationReview records whether the case is primary or secondary.
    Returns 404 if the case does not exist.
    Only confirmed coordination determinations ("Coordination Required") are returned;
    unreviewed candidate overlaps and unrelated pairs are strictly excluded.
    Preserves all original cases without merging or data loss.
    """
    # 1. Verify case exists
    target_case = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_id).first()
    if not target_case:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Complaint case with ID '{case_id}' was not found."
        )

    # 2. Query CoordinationReview for confirmed coordination relationships
    # Only confirmed reviews (status or reviewer_decision == 'Coordination Required')
    confirmed_reviews = (
        db.query(CoordinationReview)
        .filter(
            or_(
                CoordinationReview.primary_case_id == case_id,
                CoordinationReview.secondary_case_id == case_id
            ),
            or_(
                CoordinationReview.status == "Coordination Required",
                CoordinationReview.reviewer_decision == "Coordination Required"
            )
        )
        .order_by(CoordinationReview.reviewed_at.desc(), CoordinationReview.id.desc())
        .all()
    )

    links = []
    for rev in confirmed_reviews:
        # Determine the counterpart linked case ID
        linked_id = rev.secondary_case_id if rev.primary_case_id == case_id else rev.primary_case_id

        # Look up counterpart case details for rich context
        linked_case = db.query(ComplaintCase).filter(ComplaintCase.case_id == linked_id).first()

        overlap_id = derive_stable_overlap_id(rev.primary_case_id, rev.secondary_case_id)

        links.append(
            CaseLinkItem(
                link_id=rev.id,
                case_id=case_id,
                linked_case_id=linked_id,
                overlap_id=overlap_id,
                primary_case_id=rev.primary_case_id,
                secondary_case_id=rev.secondary_case_id,
                decision=rev.reviewer_decision or rev.status,
                status=rev.status,
                reviewer=rev.reviewed_by,
                reviewed_at=rev.reviewed_at,
                similarity_score=rev.similarity_score,
                overlap_reason=rev.overlap_reason,
                remarks=rev.reviewer_remarks,
                created_at=rev.created_at,
                linked_case_bureau=linked_case.bureau if linked_case else None,
                linked_case_status=linked_case.status if linked_case else None,
                linked_case_category=linked_case.category if linked_case else None
            )
        )

    return CaseLinksResponse(
        case_id=case_id,
        total_links=len(links),
        links=links
    )

