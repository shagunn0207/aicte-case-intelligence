"""
AICTE Cross-Bureau Overlap Intelligence and Human Review Router.
Problem Statement: SIH26264

Endpoints:
- GET  /api/overlaps            List candidate overlaps with search/filter/sort
- GET  /api/overlaps/{id}       Retrieve single overlap dossier
- POST /api/overlaps/{id}/review Submit human review determination
"""

import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import ComplaintCase, CoordinationReview, CaseAction, Institution, utcnow
from backend.schemas import (
    OverlapListResponse,
    OverlapDetailResponse,
    CoordinationReviewSubmission
)
from backend.matching import detect_overlaps, derive_stable_overlap_id

router = APIRouter(prefix="/api/overlaps", tags=["Overlap Intelligence"])

ALLOWED_REVIEW_DECISIONS = [
    "Coordination Required",
    "Continue Independently",
    "Not Related",
    "Further Review Required"
]


def _build_cases_dicts(cases: List[ComplaintCase]) -> List[Dict[str, Any]]:
    """Serializes ComplaintCase models into plain dicts for the matching engine."""
    result = []
    for c in cases:
        inst_name = c.institution.name if c.institution else "AICTE Approved Institution"
        inst_region = c.institution.region if c.institution else None
        result.append({
            "case_id": c.case_id,
            "institution_id": c.institution_id,
            "institution_name": inst_name,
            "region": inst_region,
            "category": c.category,
            "description": c.description,
            "bureau": c.bureau,
            "status": c.status,
            "assigned_officer": c.assigned_officer,
            "received_date": c.received_date.isoformat() if c.received_date else None,
            "due_date": c.due_date.isoformat() if c.due_date else None,
        })
    return result


def _resolve_overlap_pair(overlap_id_param: str, db: Session) -> Tuple[str, str]:
    """
    Resolves a pair of case IDs from either an integer review ID
    or a canonical string ID (e.g. 'OVL-DEMO-CASE-001-DEMO-CASE-002').
    """
    clean_param = overlap_id_param.strip()

    # 1. Try integer database primary key
    if clean_param.isdigit():
        rev = db.query(CoordinationReview).filter(CoordinationReview.id == int(clean_param)).first()
        if rev:
            return rev.primary_case_id, rev.secondary_case_id

    # 2. Check if string starts with OVL- and extract case IDs
    if clean_param.startswith("OVL-"):
        parts = clean_param[4:].split("-")
        # Handle cases formatted like DEMO-CASE-001-DEMO-CASE-002
        if len(parts) >= 6:
            case_a = "-".join(parts[:3])
            case_b = "-".join(parts[3:])
            return case_a, case_b
        elif len(parts) == 2:
            return parts[0], parts[1]

    # 3. Check CoordinationReview table for exact overlap_reason match or review
    rev = (
        db.query(CoordinationReview)
        .filter(
            or_(
                CoordinationReview.primary_case_id == clean_param,
                CoordinationReview.secondary_case_id == clean_param
            )
        )
        .first()
    )
    if rev:
        return rev.primary_case_id, rev.secondary_case_id

    raise HTTPException(
        status_code=http_status.HTTP_404_NOT_FOUND,
        detail=f"Overlap identifier '{clean_param}' could not be resolved to any candidate case pair."
    )


def _get_all_reconciled_overlaps(db: Session) -> List[Dict[str, Any]]:
    """
    Pulls complaint cases and persisted CoordinationReview records from SQLite,
    runs Person 5's matching engine, and merges persisted review decisions.
    Historical reviews survive refreshes; 'Not Related' decisions retain state.
    """
    cases = (
        db.query(ComplaintCase)
        .options(joinedload(ComplaintCase.institution))
        .all()
    )
    case_map = {c.case_id: c for c in cases}
    cases_dicts = _build_cases_dicts(cases)

    # 1. Run detection engine
    try:
        detected = detect_overlaps(cases_dicts)
    except Exception as e:
        print(f"[Matching Engine Warning] detect_overlaps raised: {e}")
        detected = []

    # 2. Load all persisted CoordinationReviews from SQLite
    saved_reviews = db.query(CoordinationReview).all()
    review_map: Dict[Tuple[str, str], CoordinationReview] = {}
    for r in saved_reviews:
        key = tuple(sorted([r.primary_case_id, r.secondary_case_id]))
        review_map[key] = r

    reconciled: List[Dict[str, Any]] = []
    seen_keys = set()

    for item in detected:
        case_a = item["case_a_id"]
        case_b = item["case_b_id"]
        pair_key = tuple(sorted([case_a, case_b]))
        seen_keys.add(pair_key)

        matched_rev = review_map.get(pair_key)
        if matched_rev:
            item["review_id"] = matched_rev.id
            item["status"] = matched_rev.status
            item["reviewer_decision"] = matched_rev.reviewer_decision
            item["reviewer_remarks"] = matched_rev.reviewer_remarks
            item["reviewed_by"] = matched_rev.reviewed_by
            item["reviewed_at"] = matched_rev.reviewed_at
            if matched_rev.similarity_score:
                item["similarity_score"] = matched_rev.similarity_score
                item["match_score"] = int(round(matched_rev.similarity_score * 100))
            if matched_rev.overlap_reason:
                item["overlap_reason"] = matched_rev.overlap_reason
                item["summary"] = matched_rev.overlap_reason

            if matched_rev.reviewed_at and matched_rev.reviewer_decision:
                item["review_history"] = [
                    {
                        "id": f"rev-{matched_rev.id}",
                        "timestamp": matched_rev.reviewed_at.isoformat(),
                        "reviewerName": matched_rev.reviewed_by or "Reviewing Officer",
                        "decision": matched_rev.reviewer_decision,
                        "remarks": matched_rev.reviewer_remarks or ""
                    }
                ]
        else:
            item["status"] = "Pending Review"

        reconciled.append(item)

    # 3. Add any persisted reviews from DB not produced by current detection run (historical preservation)
    for pair_key, rev in review_map.items():
        if pair_key not in seen_keys:
            c1_id, c2_id = pair_key
            c1 = case_map.get(c1_id)
            c2 = case_map.get(c2_id)
            if not c1 or not c2:
                continue

            ovl_id = derive_stable_overlap_id(c1_id, c2_id)
            sim_score = rev.similarity_score or 0.85
            match_pct = int(round(sim_score * 100))
            inst_name = c1.institution.name if c1.institution else "AICTE Approved Institution"
            inst_region = c1.institution.region if c1.institution else None
            summary = rev.overlap_reason or f"Historical cross-bureau review between {c1.bureau} and {c2.bureau}."

            review_hist = []
            if rev.reviewed_at and rev.reviewer_decision:
                review_hist.append({
                    "id": f"rev-{rev.id}",
                    "timestamp": rev.reviewed_at.isoformat(),
                    "reviewerName": rev.reviewed_by or "Reviewing Officer",
                    "decision": rev.reviewer_decision,
                    "remarks": rev.reviewer_remarks or ""
                })

            reconciled.append({
                "id": ovl_id,
                "overlap_id": ovl_id,
                "review_id": rev.id,
                "institution_id": c1.institution_id,
                "institution_name": inst_name,
                "institution_region": inst_region,
                "primary_case_id": c1_id,
                "secondary_case_id": c2_id,
                "case_a_id": c1_id,
                "case_b_id": c2_id,
                "case_a_bureau": c1.bureau,
                "case_b_bureau": c2.bureau,
                "case_a_status": c1.status,
                "case_b_status": c2.status,
                "similarity_score": sim_score,
                "match_score": match_pct,
                "overlap_reason": summary,
                "summary": summary,
                "key_signals": [f"Persisted Review Decision: {rev.status}"],
                "match_reasons": [],
                "status": rev.status,
                "detected_date": rev.created_at.strftime("%Y-%m-%d") if rev.created_at else None,
                "last_updated": rev.reviewed_at.strftime("%Y-%m-%d") if rev.reviewed_at else None,
                "reviewer_decision": rev.reviewer_decision,
                "reviewer_remarks": rev.reviewer_remarks,
                "reviewed_by": rev.reviewed_by,
                "reviewed_at": rev.reviewed_at,
                "review_history": review_hist
            })

    return reconciled


@router.get("", response_model=OverlapListResponse)
def list_overlaps(
    search: Optional[str] = Query(None, description="Search by institution name/ID, case IDs, or keywords"),
    bureau: Optional[str] = Query(None, description="Filter by Bureau involved in either case"),
    status: Optional[str] = Query(None, description="Filter by review status (Pending Review, Coordination Required, Not Related, Further Review Required)"),
    min_score: Optional[float] = Query(None, description="Minimum matching score (0-100 or 0.0-1.0)"),
    sort_by: Optional[str] = Query(None, description="Sorting method (score_desc, score_asc, date_desc, date_asc, institution)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve candidate cross-bureau overlaps reconciled with persisted human review decisions.
    Supports search, bureau filter, review status filter, and sorting.
    """
    overlaps = _get_all_reconciled_overlaps(db)

    # 1. Search Filter
    if search and search.strip():
        term = search.lower().strip()
        overlaps = [
            o for o in overlaps
            if term in o["id"].lower()
            or term in o["institution_name"].lower()
            or term in o["institution_id"].lower()
            or term in o["case_a_id"].lower()
            or term in o["case_b_id"].lower()
            or term in (o.get("summary") or "").lower()
            or any(term in s.lower() for s in o.get("key_signals", []))
        ]

    # 2. Bureau Filter
    if bureau and bureau.strip() and bureau.upper() != "ALL":
        b_term = bureau.strip().lower()
        overlaps = [
            o for o in overlaps
            if o["case_a_bureau"].lower() == b_term or o["case_b_bureau"].lower() == b_term
        ]

    # 3. Status Filter
    if status and status.strip() and status.upper() != "ALL":
        s_term = status.strip().lower()
        overlaps = [
            o for o in overlaps
            if o["status"].lower() == s_term
        ]

    # 4. Minimum Score Filter
    if min_score is not None:
        threshold = min_score if min_score > 1.0 else min_score * 100
        overlaps = [
            o for o in overlaps
            if o["match_score"] >= threshold
        ]

    # 5. Sorting
    if sort_by == "score_asc":
        overlaps.sort(key=lambda o: (o["match_score"], o["id"]))
    elif sort_by == "score_desc":
        overlaps.sort(key=lambda o: (o["match_score"], o["id"]), reverse=True)
    elif sort_by == "date_asc":
        overlaps.sort(key=lambda o: str(o.get("detected_date") or ""))
    elif sort_by == "institution":
        overlaps.sort(key=lambda o: o["institution_name"].lower())
    else:
        # Default: score_desc then date_desc
        overlaps.sort(key=lambda o: (o["match_score"], str(o.get("detected_date") or "")), reverse=True)

    pending_count = sum(1 for o in overlaps if o["status"] == "Pending Review")
    coordinated_count = sum(1 for o in overlaps if o["status"] == "Coordination Required")

    items = [OverlapDetailResponse.model_validate(o) for o in overlaps]

    return OverlapListResponse(
        items=items,
        total=len(items),
        pending_count=pending_count,
        coordinated_count=coordinated_count
    )


@router.get("/{overlap_id}", response_model=OverlapDetailResponse)
def get_overlap_detail(
    overlap_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve single overlap dossier by overlap ID or review ID.
    """
    case_a_id, case_b_id = _resolve_overlap_pair(overlap_id, db)
    target_stable_id = derive_stable_overlap_id(case_a_id, case_b_id)

    all_overlaps = _get_all_reconciled_overlaps(db)
    found = next((o for o in all_overlaps if o["id"] == target_stable_id), None)

    if not found:
        # If both cases exist, build default candidate
        c1 = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_a_id).first()
        c2 = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_b_id).first()
        if not c1 or not c2:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Overlap record '{overlap_id}' not found."
            )
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        found = {
            "id": target_stable_id,
            "overlap_id": target_stable_id,
            "primary_case_id": case_a_id,
            "secondary_case_id": case_b_id,
            "case_a_id": case_a_id,
            "case_b_id": case_b_id,
            "institution_id": c1.institution_id,
            "institution_name": c1.institution.name if c1.institution else "AICTE Approved Institution",
            "institution_region": c1.institution.region if c1.institution else None,
            "case_a_bureau": c1.bureau,
            "case_b_bureau": c2.bureau,
            "case_a_status": c1.status,
            "case_b_status": c2.status,
            "similarity_score": 0.80,
            "match_score": 80,
            "overlap_reason": f"Correlated proceedings between {c1.bureau} and {c2.bureau}.",
            "summary": f"Correlated proceedings between {c1.bureau} and {c2.bureau}.",
            "status": "Pending Review",
            "detected_date": now_iso,
            "last_updated": now_iso,
            "key_signals": [],
            "match_reasons": [],
            "review_history": []
        }

    return OverlapDetailResponse.model_validate(found)


@router.post("/{overlap_id}/review", response_model=OverlapDetailResponse)
def submit_coordination_review(
    overlap_id: str,
    submission: CoordinationReviewSubmission,
    db: Session = Depends(get_db)
):
    """
    Submits a statutory human review determination for a detected cross-bureau overlap.
    Validates decision options, persists reviewer identity and justification remarks,
    and records an audit action on each case without deleting or merging complaint cases.
    """
    # 1. Validate decision
    matched_decision = None
    for d in ALLOWED_REVIEW_DECISIONS:
        if d.lower() == submission.decision.strip().lower():
            matched_decision = d
            break

    if not matched_decision:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid review decision '{submission.decision}'. Allowed decisions: {', '.join(ALLOWED_REVIEW_DECISIONS)}"
        )

    # 2. Validate remarks
    if not submission.remarks or len(submission.remarks.strip()) < 5:
        raise HTTPException(
            status_code=422,
            detail="Reviewer remarks must be provided and contain sufficient audit justification (minimum 5 characters)."
        )

    # 3. Resolve case pair
    case_a_id, case_b_id = _resolve_overlap_pair(overlap_id, db)

    case_a = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_a_id).first()
    case_b = db.query(ComplaintCase).filter(ComplaintCase.case_id == case_b_id).first()

    if not case_a or not case_b:
        missing = case_a_id if not case_a else case_b_id
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Associated complaint case '{missing}' referenced in overlap review was not found in the database."
        )

    reviewer_name = submission.reviewer_name.strip() if submission.reviewer_name else "Senior Reviewing Officer"
    now_dt = utcnow()
    stable_id = derive_stable_overlap_id(case_a_id, case_b_id)

    # 4. Check for existing CoordinationReview record
    existing_review = (
        db.query(CoordinationReview)
        .filter(
            or_(
                (CoordinationReview.primary_case_id == case_a_id) & (CoordinationReview.secondary_case_id == case_b_id),
                (CoordinationReview.primary_case_id == case_b_id) & (CoordinationReview.secondary_case_id == case_a_id)
            )
        )
        .first()
    )

    try:
        if existing_review:
            existing_review.status = matched_decision
            existing_review.reviewer_decision = matched_decision
            existing_review.reviewer_remarks = submission.remarks.strip()
            existing_review.reviewed_by = reviewer_name
            existing_review.reviewed_at = now_dt
            db_rev = existing_review
        else:
            db_rev = CoordinationReview(
                primary_case_id=case_a_id,
                secondary_case_id=case_b_id,
                similarity_score=0.89,
                overlap_reason=f"Cross-bureau correlation between {case_a.bureau} and {case_b.bureau}.",
                status=matched_decision,
                reviewer_decision=matched_decision,
                reviewer_remarks=submission.remarks.strip(),
                reviewed_by=reviewer_name,
                reviewed_at=now_dt
            )
            db.add(db_rev)

        # 5. Record CaseAction on both cases for transparent audit history
        action_note_a = f"Cross-Bureau Coordination Review: Determination '{matched_decision}' recorded."
        action_note_b = f"Cross-Bureau Coordination Review: Determination '{matched_decision}' recorded."

        act_a = CaseAction(
            case_id=case_a.case_id,
            action_taken=action_note_a,
            action_by=reviewer_name,
            action_date=now_dt,
            remarks=f"Review of potential overlap with {case_b.case_id} ({case_b.bureau}): {submission.remarks.strip()}",
            previous_status=case_a.status,
            new_status=case_a.status
        )
        act_b = CaseAction(
            case_id=case_b.case_id,
            action_taken=action_note_b,
            action_by=reviewer_name,
            action_date=now_dt,
            remarks=f"Review of potential overlap with {case_a.case_id} ({case_a.bureau}): {submission.remarks.strip()}",
            previous_status=case_b.status,
            new_status=case_b.status
        )

        db.add(act_a)
        db.add(act_b)

        # Update last action on cases
        case_a.last_action = action_note_a
        case_a.last_action_at = now_dt
        case_a.updated_at = now_dt

        case_b.last_action = action_note_b
        case_b.last_action_at = now_dt
        case_b.updated_at = now_dt

        db.commit()
        db.refresh(db_rev)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving coordination review: {str(e)}"
        )

    # Reload reconciled overlap to return complete dossier
    all_overlaps = _get_all_reconciled_overlaps(db)
    found = next((o for o in all_overlaps if o["id"] == stable_id), None)
    if not found:
        # Fallback response
        found = {
            "id": stable_id,
            "overlap_id": stable_id,
            "review_id": db_rev.id,
            "institution_id": case_a.institution_id,
            "institution_name": case_a.institution.name if case_a.institution else "AICTE Approved Institution",
            "institution_region": case_a.institution.region if case_a.institution else None,
            "primary_case_id": case_a_id,
            "secondary_case_id": case_b_id,
            "case_a_id": case_a_id,
            "case_b_id": case_b_id,
            "case_a_bureau": case_a.bureau,
            "case_b_bureau": case_b.bureau,
            "case_a_status": case_a.status,
            "case_b_status": case_b.status,
            "similarity_score": db_rev.similarity_score or 0.89,
            "match_score": int(round((db_rev.similarity_score or 0.89) * 100)),
            "overlap_reason": db_rev.overlap_reason,
            "summary": db_rev.overlap_reason,
            "status": matched_decision,
            "reviewer_decision": matched_decision,
            "reviewer_remarks": db_rev.reviewer_remarks,
            "reviewed_by": db_rev.reviewed_by,
            "reviewed_at": db_rev.reviewed_at,
            "key_signals": [],
            "match_reasons": [],
            "review_history": [
                {
                    "id": f"rev-{db_rev.id}",
                    "timestamp": now_dt.isoformat(),
                    "reviewerName": reviewer_name,
                    "decision": matched_decision,
                    "remarks": submission.remarks.strip()
                }
            ]
        }

    return OverlapDetailResponse.model_validate(found)
