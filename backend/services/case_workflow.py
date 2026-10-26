"""
Case Workflow and Action History Service.
Problem Statement: SIH26264

Manages:
- Case status transitions and updates (PATCH /api/cases/{case_id})
- Audit-compliant CaseAction history logging (POST /api/cases/{case_id}/actions)
- Single-transaction atomic updates with automatic rollback on error.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from backend.models import ComplaintCase, CaseAction, utcnow
from backend.schemas import CaseUpdate, CaseActionCreate
from backend.services.deadlines import normalize_datetime

ALLOWED_STATUSES = ["Pending", "Under Process", "Disposed", "Transferred", "Escalated"]


def validate_case_status(status_val: Optional[str]) -> Optional[str]:
    """
    Validates case status string against the 5 official AICTE prototype statuses.
    Returns canonical title-cased status string, or raises HTTP 422 if invalid.
    """
    if not status_val:
        return None
    cleaned = status_val.strip()
    for allowed in ALLOWED_STATUSES:
        if cleaned.lower() == allowed.lower():
            return allowed
    raise HTTPException(
        status_code=422,
        detail=f"Invalid status '{status_val}'. Allowed statuses are: {', '.join(ALLOWED_STATUSES)}"
    )


def update_case_workflow(
    db: Session,
    case_id: str,
    update_data: CaseUpdate
) -> ComplaintCase:
    """
    Applies partial updates to a complaint case, maintains timestamps,
    and commits a persistent CaseAction audit log in a single transaction.
    Rolls back automatically on failure.
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Complaint case with ID '{case_id}' was not found."
        )

    # Validate status if provided
    canonical_status = None
    if update_data.status is not None:
        canonical_status = validate_case_status(update_data.status)

    prev_status = case.status
    prev_officer = case.assigned_officer
    prev_due_date = case.due_date

    changed_fields = []

    # Status change
    if canonical_status and canonical_status != case.status:
        case.status = canonical_status
        changed_fields.append(f"status: '{prev_status}' -> '{canonical_status}'")

    # Assignment change
    if update_data.assigned_officer is not None and update_data.assigned_officer.strip() != case.assigned_officer:
        new_officer = update_data.assigned_officer.strip()
        case.assigned_officer = new_officer
        changed_fields.append(f"reassigned officer: '{prev_officer}' -> '{new_officer}'")

    # Due date change
    if update_data.due_date is not None:
        normalized_due = normalize_datetime(update_data.due_date)
        if normalized_due != case.due_date:
            case.due_date = normalized_due
            changed_fields.append(f"due date updated to {normalized_due.strftime('%Y-%m-%d')}")

    # Last action change
    if update_data.last_action is not None and update_data.last_action.strip():
        case.last_action = update_data.last_action.strip()

    # Next action change
    if update_data.next_action is not None and update_data.next_action.strip():
        case.next_action = update_data.next_action.strip()

    # If no fields were modified and no action or remarks specified, return without creating duplicate action
    has_meaningful_update = bool(changed_fields or update_data.remarks or update_data.action_taken)

    if not has_meaningful_update:
        return case

    # Prepare action record
    action_description = update_data.action_taken
    if not action_description:
        if changed_fields:
            action_description = f"Case updated ({', '.join(changed_fields)})"
        else:
            action_description = "Case procedural details updated"

    action_by = (
        update_data.action_by.strip()
        if update_data.action_by and update_data.action_by.strip()
        else case.assigned_officer
    )

    action_record = CaseAction(
        case_id=case.case_id,
        action_taken=action_description,
        action_by=action_by,
        action_date=utcnow(),
        remarks=update_data.remarks.strip() if update_data.remarks else None,
        next_action=case.next_action,
        previous_status=prev_status,
        new_status=case.status
    )

    case.last_action = action_description
    case.last_action_at = action_record.action_date
    case.updated_at = utcnow()

    try:
        db.add(action_record)
        db.commit()
        db.refresh(case)
        return case
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update case and record action history: {str(e)}"
        )


def record_case_action(
    db: Session,
    case_id: str,
    action_data: CaseActionCreate
) -> CaseAction:
    """
    Appends a new action record to a case's timeline and updates current case state.
    Commits atomically and rolls back on failure.
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Complaint case with ID '{case_id}' was not found."
        )

    # Validate action_taken is non-empty
    if not action_data.action_taken or not action_data.action_taken.strip():
        raise HTTPException(
            status_code=422,
            detail="'action_taken' is required and cannot be empty."
        )

    prev_status = case.status
    new_status = prev_status

    if action_data.new_status is not None:
        new_status = validate_case_status(action_data.new_status)
        case.status = new_status

    if action_data.next_action is not None:
        case.next_action = action_data.next_action.strip()

    action_by = (
        action_data.action_by.strip()
        if action_data.action_by and action_data.action_by.strip()
        else case.assigned_officer
    )

    action_record = CaseAction(
        case_id=case.case_id,
        action_taken=action_data.action_taken.strip(),
        action_by=action_by,
        action_date=utcnow(),
        remarks=action_data.remarks.strip() if action_data.remarks else None,
        next_action=case.next_action,
        previous_status=action_data.previous_status or prev_status,
        new_status=new_status
    )

    case.last_action = action_record.action_taken
    case.last_action_at = action_record.action_date
    case.updated_at = utcnow()

    try:
        db.add(action_record)
        db.commit()
        db.refresh(action_record)
        return action_record
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record case action: {str(e)}"
        )
