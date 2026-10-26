from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ComplaintCase, Institution, CaseAction, CoordinationReview
from backend.schemas import (
    DashboardStatsResponse,
    BureauWorkload,
    StatusDistribution,
    RegionWiseCases,
    CaseActionSchema,
    OverlapItem
)
from backend.services.deadlines import (
    is_case_overdue,
    is_case_approaching_deadline,
    get_current_utc_time
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

ALL_STATUSES = ["Pending", "Under Process", "Disposed", "Transferred", "Escalated"]


@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """
    Retrieve comprehensive aggregate metrics and workload statistics
    for AICTE complaint monitoring across all bureaus and cells.
    All figures are derived directly from SQLite database records.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Total cases
    total_cases = db.scalar(select(func.count(ComplaintCase.case_id))) or 0

    # Status distribution counts
    status_counts_raw = (
        db.query(ComplaintCase.status, func.count(ComplaintCase.case_id))
        .group_by(ComplaintCase.status)
        .all()
    )
    status_map = {status_val: count for status_val, count in status_counts_raw}

    pending_cases = status_map.get("Pending", 0)
    under_process_cases = status_map.get("Under Process", 0)
    disposed_cases = status_map.get("Disposed", 0)
    transferred_cases = status_map.get("Transferred", 0)
    escalated_cases = status_map.get("Escalated", 0)

    # Status distribution list (guarantee all 5 official statuses are present)
    status_distribution = [
        StatusDistribution(status=st, count=status_map.get(st, 0))
        for st in ALL_STATUSES
    ]
    # Include any custom statuses if present
    for st, count in status_map.items():
        if st not in ALL_STATUSES:
            status_distribution.append(StatusDistribution(status=st, count=count))

    now = get_current_utc_time()

    # Active (non-disposed) cases for deadline service calculations
    active_cases = (
        db.query(ComplaintCase)
        .filter(ComplaintCase.status != "Disposed")
        .all()
    )
    overdue_cases = sum(
        1 for c in active_cases if is_case_overdue(c.due_date, c.status, current_time=now)
    )
    cases_approaching_deadline = sum(
        1 for c in active_cases if is_case_approaching_deadline(c.due_date, c.status, window_hours=48, current_time=now)
    )

    # Overlaps awaiting review
    overlaps_awaiting_review = (
        db.scalar(
            select(func.count(CoordinationReview.id))
            .where(CoordinationReview.status == "Pending Review")
        )
        or 0
    )
    potential_overlaps = overlaps_awaiting_review

    # Bureau-wise workload
    bureau_workload_raw = (
        db.query(ComplaintCase.bureau, func.count(ComplaintCase.case_id).label("cnt"))
        .group_by(ComplaintCase.bureau)
        .order_by(func.count(ComplaintCase.case_id).desc())
        .all()
    )
    bureau_wise_workload = [
        BureauWorkload(bureau=bureau, case_count=count)
        for bureau, count in bureau_workload_raw
    ]

    # Region-wise cases (joining with Institution)
    region_cases_raw = (
        db.query(Institution.region, func.count(ComplaintCase.case_id).label("cnt"))
        .join(ComplaintCase, ComplaintCase.institution_id == Institution.institution_id)
        .group_by(Institution.region)
        .order_by(func.count(ComplaintCase.case_id).desc())
        .all()
    )
    region_wise_cases = [
        RegionWiseCases(region=region, case_count=count)
        for region, count in region_cases_raw
    ]

    # Recent actions (audit trail)
    recent_actions_raw = (
        db.query(CaseAction)
        .order_by(CaseAction.action_date.desc(), CaseAction.id.desc())
        .limit(10)
        .all()
    )
    recent_actions = [CaseActionSchema.model_validate(act) for act in recent_actions_raw]

    # Recent potential overlaps
    recent_overlaps_raw = (
        db.query(CoordinationReview)
        .order_by(CoordinationReview.created_at.desc(), CoordinationReview.id.desc())
        .limit(5)
        .all()
    )
    recent_overlaps = [
        OverlapItem(
            review_id=rev.id,
            primary_case_id=rev.primary_case_id,
            secondary_case_id=rev.secondary_case_id,
            similarity_score=rev.similarity_score,
            overlap_reason=rev.overlap_reason,
            status=rev.status,
            detected_at=rev.created_at
        )
        for rev in recent_overlaps_raw
    ]

    return DashboardStatsResponse(
        total_cases=total_cases,
        pending_cases=pending_cases,
        under_process_cases=under_process_cases,
        disposed_cases=disposed_cases,
        transferred_cases=transferred_cases,
        escalated_cases=escalated_cases,
        overdue_cases=overdue_cases,
        potential_overlaps=potential_overlaps,
        overlaps_awaiting_review=overlaps_awaiting_review,
        cases_approaching_deadline=cases_approaching_deadline,
        bureau_wise_workload=bureau_wise_workload,
        status_distribution=status_distribution,
        region_wise_cases=region_wise_cases,
        recent_actions=recent_actions,
        recent_overlaps=recent_overlaps
    )
