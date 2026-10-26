"""
AICTE In-App Actionable Alert Feed Router.
Problem Statement: SIH26264

Provides a unified in-app alert stream for:
1. Overdue Cases: Statutory SLA deadline has elapsed and case is not disposed.
2. Approaching Deadlines: Deadlines expiring within the upcoming warning window (48h).
3. Cross-Bureau Overlaps Awaiting Review: High-similarity algorithm detections pending human review.

All alerts are prioritized deterministically by urgency.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import ComplaintCase
from backend.schemas import AlertItem, AlertListResponse
from backend.services.deadlines import (
    is_case_overdue,
    is_case_approaching_deadline,
    get_days_overdue,
    get_time_remaining,
    get_current_utc_time
)
from backend.routes.overlaps import _get_all_reconciled_overlaps

router = APIRouter(prefix="/api/alerts", tags=["In-App Alerts"])

SEVERITY_RANK = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3
}


def _calculate_urgency_key(alert: AlertItem):
    """
    Computes a composite sorting key for strict urgency prioritization:
    1. Primary: Severity rank (CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3).
    2. Secondary:
       - Overdue: Higher days overdue comes first.
       - Approaching deadline: Fewer hours remaining comes first.
       - Pending review: Higher similarity score comes first.
    """
    sev = SEVERITY_RANK.get(alert.severity.upper(), 99)

    if alert.alert_type == "OVERDUE":
        # More days overdue = lower sub-key = sorted first
        sub = -(alert.days_overdue or 1) * 100
    elif alert.alert_type == "APPROACHING_DEADLINE":
        # Fewer hours remaining = lower sub-key = sorted first
        sub = alert.hours_remaining if alert.hours_remaining is not None else 48.0
    elif alert.alert_type == "PENDING_REVIEW":
        # Higher similarity = lower sub-key = sorted first
        sim = alert.similarity_score if alert.similarity_score is not None else 0.5
        sub = -sim * 50
    else:
        sub = 0

    return (sev, sub)


@router.get("", response_model=AlertListResponse)
def get_alerts(
    alert_type: Optional[str] = Query(None, description="Filter by alert type: OVERDUE, APPROACHING_DEADLINE, PENDING_REVIEW"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"),
    bureau: Optional[str] = Query(None, description="Filter by AICTE Bureau or Cell"),
    case_id: Optional[str] = Query(None, description="Filter alerts by Complaint Case ID"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of alerts to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time, actionable alerts across AICTE bureaus.
    Aggregates overdue cases, approaching deadlines, and candidate cross-bureau overlaps.
    Strictly filters out disposed cases and handles missing due dates safely.
    Results are sorted deterministically by urgency.
    """
    now = get_current_utc_time()
    alerts: List[AlertItem] = []

    # -------------------------------------------------------------
    # 1. Inspect Complaint Cases for Overdue & Approaching Deadlines
    # -------------------------------------------------------------
    # Exclude disposed cases and cases without due dates from deadline alerts
    cases = (
        db.query(ComplaintCase)
        .options(joinedload(ComplaintCase.institution))
        .filter(
            ComplaintCase.status != "Disposed",
            ComplaintCase.due_date.isnot(None)
        )
        .all()
    )

    for c in cases:
        inst_name = c.institution.name if c.institution else "Institution"

        # Check Overdue
        if is_case_overdue(c.due_date, c.status, current_time=now):
            days = get_days_overdue(c.due_date, c.status, current_time=now)
            case_sev = "CRITICAL" if days > 7 else "HIGH"

            alerts.append(
                AlertItem(
                    id=f"alert-overdue-{c.case_id}",
                    alert_type="OVERDUE",
                    severity=case_sev,
                    title=f"Case {c.case_id} Overdue",
                    message=f"Case {c.case_id} ({c.bureau}) for {inst_name} is {days} day{'s' if days != 1 else ''} past statutory deadline.",
                    case_id=c.case_id,
                    bureau=c.bureau,
                    institution_id=c.institution_id,
                    institution_name=inst_name,
                    due_date=c.due_date,
                    days_overdue=days,
                    created_at=c.received_date,
                    action_url=f"/cases/{c.case_id}"
                )
            )
            continue  # A case that is overdue cannot simultaneously be approaching deadline

        # Check Approaching Deadline (default window 48h)
        if is_case_approaching_deadline(c.due_date, c.status, window_hours=48, current_time=now):
            rem = get_time_remaining(c.due_date, current_time=now)
            hours = round(rem.total_seconds() / 3600.0, 1) if rem else 0.0
            appr_sev = "HIGH" if hours <= 24.0 else "MEDIUM"

            alerts.append(
                AlertItem(
                    id=f"alert-approaching-{c.case_id}",
                    alert_type="APPROACHING_DEADLINE",
                    severity=appr_sev,
                    title=f"Case {c.case_id} Approaching Deadline",
                    message=f"Case {c.case_id} ({c.bureau}) statutory deadline expires in {hours} hours.",
                    case_id=c.case_id,
                    bureau=c.bureau,
                    institution_id=c.institution_id,
                    institution_name=inst_name,
                    due_date=c.due_date,
                    hours_remaining=hours,
                    created_at=c.received_date,
                    action_url=f"/cases/{c.case_id}"
                )
            )

    # -------------------------------------------------------------
    # 2. Inspect Overlaps Awaiting Human Review
    # -------------------------------------------------------------
    try:
        reconciled_overlaps = _get_all_reconciled_overlaps(db)
    except Exception as e:
        print(f"[Alerts Warning] Error loading reconciled overlaps: {e}")
        reconciled_overlaps = []

    for ovl in reconciled_overlaps:
        # Only surface alerts for overlaps that are pending review
        if ovl.get("status") == "Pending Review":
            sim = ovl.get("similarity_score", 0.0)
            ovl_sev = "HIGH" if sim >= 0.80 else "MEDIUM"
            ovl_id = ovl.get("id") or ovl.get("overlap_id")
            case_a = ovl.get("primary_case_id") or ovl.get("case_a_id")
            case_b = ovl.get("secondary_case_id") or ovl.get("case_b_id")
            inst_name = ovl.get("institution_name") or "Institution"
            bur_a = ovl.get("case_a_bureau") or "Bureau A"
            bur_b = ovl.get("case_b_bureau") or "Bureau B"
            pct = int(round(sim * 100))

            alerts.append(
                AlertItem(
                    id=f"alert-pending-review-{ovl_id}",
                    alert_type="PENDING_REVIEW",
                    severity=ovl_sev,
                    title=f"Overlap Awaiting Review: {ovl_id}",
                    message=f"Cross-bureau correlation detected between {case_a} ({bur_a}) and {case_b} ({bur_b}) for {inst_name} ({pct}% match).",
                    case_id=case_a,
                    overlap_id=ovl_id,
                    bureau=f"{bur_a}/{bur_b}",
                    institution_id=ovl.get("institution_id"),
                    institution_name=inst_name,
                    similarity_score=sim,
                    created_at=now,
                    action_url=f"/overlaps/{ovl_id}"
                )
            )

    # -------------------------------------------------------------
    # 3. Apply Query Parameter Filters
    # -------------------------------------------------------------
    filtered = alerts

    if alert_type and alert_type.strip():
        filtered = [a for a in filtered if a.alert_type.upper() == alert_type.strip().upper()]

    if severity and severity.strip():
        filtered = [a for a in filtered if a.severity.upper() == severity.strip().upper()]

    if bureau and bureau.strip():
        bur_query = bureau.strip().lower()
        filtered = [a for a in filtered if a.bureau and bur_query in a.bureau.lower()]

    if case_id and case_id.strip():
        cid_query = case_id.strip().upper()
        filtered = [
            a for a in filtered
            if (a.case_id and cid_query == a.case_id.upper())
            or (a.overlap_id and cid_query in a.overlap_id.upper())
        ]

    # -------------------------------------------------------------
    # 4. Sort by Urgency
    # -------------------------------------------------------------
    filtered.sort(key=_calculate_urgency_key)

    # Calculate severity counts
    critical_count = sum(1 for a in filtered if a.severity == "CRITICAL")
    high_count = sum(1 for a in filtered if a.severity == "HIGH")
    medium_count = sum(1 for a in filtered if a.severity == "MEDIUM")
    low_count = sum(1 for a in filtered if a.severity == "LOW")

    # Apply pagination/limit
    sliced = filtered[:limit]

    return AlertListResponse(
        items=sliced,
        total=len(filtered),
        critical_count=critical_count,
        high_count=high_count,
        medium_count=medium_count,
        low_count=low_count
    )
