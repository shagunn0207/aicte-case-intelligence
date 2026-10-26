"""
Case Actions and Audit History Router.
Problem Statement: SIH26264
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ComplaintCase, CaseAction
from backend.schemas import CaseActionSchema, CaseActionCreate
from backend.services.case_workflow import record_case_action

router = APIRouter(tags=["Case Actions"])


@router.post("/api/cases/{case_id}/actions", response_model=CaseActionSchema, status_code=http_status.HTTP_201_CREATED)
def create_case_action(
    case_id: str,
    action_data: CaseActionCreate,
    db: Session = Depends(get_db)
):
    """
    Record an action event on a case's timeline and persist to database.
    Updates the complaint case's last_action, next_action, and status if applicable.
    """
    action = record_case_action(db=db, case_id=case_id, action_data=action_data)
    return CaseActionSchema.model_validate(action)


@router.get("/api/cases/{case_id}/actions", response_model=List[CaseActionSchema])
def list_case_actions(
    case_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve chronological action history for a specific case (newest first).
    """
    case = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Complaint case with ID '{case_id}' was not found."
        )

    actions = (
        db.query(CaseAction)
        .filter(CaseAction.case_id == case_id)
        .order_by(CaseAction.action_date.desc(), CaseAction.id.desc())
        .all()
    )
    return [CaseActionSchema.model_validate(a) for a in actions]


@router.get("/api/actions", response_model=List[CaseActionSchema])
def list_recent_actions(
    limit: int = Query(20, ge=1, le=100, description="Max actions to retrieve"),
    db: Session = Depends(get_db)
):
    """
    Retrieve recent system-wide actions across all complaint cases for audit and oversight.
    """
    actions = (
        db.query(CaseAction)
        .order_by(CaseAction.action_date.desc(), CaseAction.id.desc())
        .limit(limit)
        .all()
    )
    return [CaseActionSchema.model_validate(a) for a in actions]
