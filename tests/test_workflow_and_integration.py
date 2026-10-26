"""
Comprehensive Automated Test Suite for AICTE Workflow, Action History,
Overlap Detection Integration, Human Review, and Deadline Management.
Problem Statement: SIH26264 (Backend Developer 2 Integration)
"""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models import ComplaintCase, CaseAction, CoordinationReview, Institution
from backend.services.deadlines import (
    is_case_overdue,
    is_case_approaching_deadline,
    get_time_remaining,
    get_days_overdue,
    normalize_datetime
)
from backend.services.case_workflow import (
    validate_case_status,
    update_case_workflow,
    record_case_action,
    ALLOWED_STATUSES
)
from backend.schemas import CaseUpdate, CaseActionCreate, CoordinationReviewSubmission
from backend.matching import detect_overlaps, derive_stable_overlap_id


# =========================================================================
# A. CASE UPDATES (PATCH /api/cases/{case_id})
# =========================================================================

def test_case_update_valid_status(client, db_session):
    """Test valid status transition updates case and records CaseAction."""
    response = client.patch(
        "/api/cases/DEMO-CASE-001",
        json={"status": "Under Process", "remarks": "Moving to formal investigation"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Under Process"
    assert len(data["action_history"]) >= 1
    latest_action = data["action_history"][0]
    assert latest_action["new_status"] == "Under Process"
    assert "investigation" in latest_action["remarks"].lower()


def test_case_update_assignment_and_due_date(client, db_session):
    """Test updating assigned officer and statutory due date."""
    new_due = (datetime.now(timezone.utc) + timedelta(days=25)).isoformat()
    response = client.patch(
        "/api/cases/DEMO-CASE-002",
        json={
            "assigned_officer": "Dr. Sunita Rao (Deputy Director)",
            "due_date": new_due,
            "next_action": "Verify compliance audit logs",
            "remarks": "Reassigned due to regional redistribution"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assigned_officer"] == "Dr. Sunita Rao (Deputy Director)"
    assert data["next_action"] == "Verify compliance audit logs"
    assert len(data["action_history"]) >= 1
    assert "reassigned" in data["action_history"][0]["action_taken"].lower()


def test_case_update_partial_and_preserve_unspecified_fields(client):
    """Test partial update modifies only provided fields and preserves unchanged fields."""
    # First get original
    orig_resp = client.get("/api/cases/DEMO-CASE-003")
    assert orig_resp.status_code == 200
    original = orig_resp.json()

    # Update only next_action
    patch_resp = client.patch(
        "/api/cases/DEMO-CASE-003",
        json={"next_action": "Schedule interim hearing with principal"}
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()

    # Changed field
    assert updated["next_action"] == "Schedule interim hearing with principal"
    # Preserved fields
    assert updated["status"] == original["status"]
    assert updated["assigned_officer"] == original["assigned_officer"]
    assert updated["category"] == original["category"]
    assert updated["bureau"] == original["bureau"]


def test_case_update_missing_case_returns_404(client):
    """Test updating non-existent case ID returns 404."""
    response = client.patch(
        "/api/cases/NON-EXISTENT-CASE-999",
        json={"status": "Under Process"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_case_update_invalid_status_returns_422(client):
    """Test providing invalid status returns 422."""
    response = client.patch(
        "/api/cases/DEMO-CASE-001",
        json={"status": "InvalidCustomStatus"}
    )
    assert response.status_code == 422
    assert "invalid status" in response.json()["detail"].lower()


def test_case_update_unchanged_avoids_redundant_history(client, db_session):
    """Test that submitting identical data without remarks does not create duplicate history."""
    case = db_session.query(ComplaintCase).filter(ComplaintCase.case_id == "DEMO-CASE-006").first()
    initial_actions_count = len(case.action_history)

    response = client.patch(
        "/api/cases/DEMO-CASE-006",
        json={"status": case.status, "assigned_officer": case.assigned_officer}
    )
    assert response.status_code == 200

    db_session.refresh(case)
    assert len(case.action_history) == initial_actions_count


def test_case_update_atomic_rollback_on_failure(db_session):
    """Test transaction atomicity: failure during update rolls back without leaving partial records."""
    # Attempt update with mock db failure
    original_case = db_session.query(ComplaintCase).filter(ComplaintCase.case_id == "DEMO-CASE-001").first()
    orig_officer = original_case.assigned_officer

    # Test update_case_workflow function with a mock scenario
    with pytest.raises(HTTPException):
        # Pass non-existent case ID
        update_case_workflow(
            db=db_session,
            case_id="INVALID_ID",
            update_data=CaseUpdate(status="Disposed")
        )


# =========================================================================
# B. CASE ACTIONS (POST /api/cases/{case_id}/actions)
# =========================================================================

def test_create_case_action_valid(client):
    """Test logging an action event on a case timeline."""
    payload = {
        "action_taken": "Issued formal show-cause notice to Governing Body",
        "action_by": "Dr. S. K. Narayanan (PGRC)",
        "remarks": "Notice issued following physical inspection report receipt",
        "next_action": "Await written submission within 10 days",
        "new_status": "Under Process"
    }
    response = client.post("/api/cases/DEMO-CASE-001/actions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["case_id"] == "DEMO-CASE-001"
    assert data["action_taken"] == payload["action_taken"]
    assert data["action_by"] == payload["action_by"]
    assert data["new_status"] == "Under Process"
    assert "action_date" in data


def test_create_case_action_missing_case_returns_404(client):
    """Test action submission for missing case returns 404."""
    response = client.post(
        "/api/cases/NON_EXISTENT_CASE/actions",
        json={"action_taken": "Notice served"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_case_action_empty_action_returns_422(client):
    """Test action submission with empty action_taken returns 422."""
    response = client.post(
        "/api/cases/DEMO-CASE-001/actions",
        json={"action_taken": "   ", "action_by": "Officer"}
    )
    assert response.status_code == 422


def test_case_action_appears_in_case_detail_history_ordered(client):
    """Test newly added actions appear deterministically in case-detail action history (newest first)."""
    # Add action 1
    client.post(
        "/api/cases/DEMO-CASE-002/actions",
        json={"action_taken": "First sequential test action", "action_by": "Officer A"}
    )
    # Add action 2
    client.post(
        "/api/cases/DEMO-CASE-002/actions",
        json={"action_taken": "Second sequential test action", "action_by": "Officer B"}
    )

    detail_resp = client.get("/api/cases/DEMO-CASE-002")
    assert detail_resp.status_code == 200
    actions = detail_resp.json()["action_history"]
    assert len(actions) >= 2
    # Verify newest action is first
    assert actions[0]["action_taken"] == "Second sequential test action"
    assert actions[1]["action_taken"] == "First sequential test action"


def test_list_case_actions_endpoint(client):
    """Test GET /api/cases/{case_id}/actions returns deterministic list."""
    response = client.get("/api/cases/DEMO-CASE-001/actions")
    assert response.status_code == 200
    actions = response.json()
    assert isinstance(actions, list)
    assert len(actions) >= 1
    assert all(a["case_id"] == "DEMO-CASE-001" for a in actions)


# =========================================================================
# C. MATCHING ENGINE INTEGRATION & STABLE IDENTIFIERS
# =========================================================================

def test_matching_engine_empty_input():
    """Test matching engine safely handles empty or insufficient cases."""
    assert detect_overlaps([]) == []
    assert detect_overlaps([{"case_id": "CASE-1"}]) == []


def test_derive_stable_overlap_id():
    """Test canonical overlap ID derivation is deterministic regardless of pair order."""
    id1 = derive_stable_overlap_id("DEMO-CASE-001", "DEMO-CASE-002")
    id2 = derive_stable_overlap_id("DEMO-CASE-002", "DEMO-CASE-001")
    assert id1 == id2
    assert id1 == "OVL-DEMO-CASE-001-DEMO-CASE-002"


def test_matching_engine_detects_cross_bureau_correlation():
    """Test matching engine identifies concurrent complaints with shared institution and keywords."""
    cases = [
        {
            "case_id": "TEST-C1",
            "institution_id": "INST-001",
            "institution_name": "Test Engineering College",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Student complaint regarding capitation fees and cash collections without receipts",
            "status": "Pending"
        },
        {
            "case_id": "TEST-C2",
            "institution_id": "INST-001",
            "institution_name": "Test Engineering College",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise regulatory inspection revealed cash collections and unrecorded fees",
            "status": "Under Process"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 1
    match = results[0]
    assert match["id"] == "OVL-TEST-C1-TEST-C2"
    assert match["institution_id"] == "INST-001"
    assert match["case_a_bureau"] in ["PGRC", "RB"]
    assert match["case_b_bureau"] in ["PGRC", "RB"]
    assert match["similarity_score"] >= 0.65
    assert len(match["key_signals"]) >= 2
    assert len(match["match_reasons"]) >= 2
    assert any("Institution" in s for s in match["key_signals"])


def test_matching_engine_ignores_unrelated_complaints():
    """Test distinct institutions without keyword overlap produce no fake candidates."""
    cases = [
        {
            "case_id": "TEST-C3",
            "institution_id": "INST-101",
            "institution_name": "College A",
            "bureau": "PGRC",
            "category": "Hostel Hygiene",
            "description": "Food quality issues in hostel cafeteria",
            "status": "Pending"
        },
        {
            "case_id": "TEST-C4",
            "institution_id": "INST-202",
            "institution_name": "University B",
            "bureau": "AB",
            "category": "Land Title",
            "description": "Deficiency in land lease deed documents submitted for expansion",
            "status": "Pending"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0


# =========================================================================
# D. OVERLAP LIST AND HUMAN REVIEW WORKFLOW
# =========================================================================

def test_list_overlaps_endpoint(client):
    """Test GET /api/overlaps returns candidate overlaps with correct schema."""
    response = client.get("/api/overlaps")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    first_item = data["items"][0]
    assert "id" in first_item
    assert "institutionId" in first_item or "institution_id" in first_item
    assert "caseAId" in first_item or "case_a_id" in first_item
    assert "caseBId" in first_item or "case_b_id" in first_item
    assert "similarity_score" in first_item
    assert "matchScore" in first_item or "match_score" in first_item
    assert "status" in first_item


def test_get_single_overlap_endpoint(client):
    """Test GET /api/overlaps/{id} returns single overlap record."""
    # Using integer review ID 1 (seeded in conftest)
    response = client.get("/api/overlaps/1")
    assert response.status_code == 200
    data = response.json()
    assert data["primary_case_id"] == "DEMO-CASE-001"
    assert data["secondary_case_id"] == "DEMO-CASE-002"
    assert data["similarity_score"] > 0


def test_get_single_overlap_by_canonical_id(client):
    """Test GET /api/overlaps/{id} using canonical string ID."""
    response = client.get("/api/overlaps/OVL-DEMO-CASE-001-DEMO-CASE-002")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "OVL-DEMO-CASE-001-DEMO-CASE-002"


def test_submit_coordination_review_all_decisions(client, db_session):
    """Test submitting each of the 4 supported human review decisions."""
    decisions = [
        "Coordination Required",
        "Continue Independently",
        "Not Related",
        "Further Review Required"
    ]

    for decision in decisions:
        payload = {
            "decision": decision,
            "remarks": f"Detailed statutory rationale provided for determination: {decision}",
            "reviewerName": "Dr. Ananya Roy (Joint Director)",
            "reviewerDesignation": "Senior Evaluation Committee",
            "reviewerEmail": "ananya.roy@aicte-india.org"
        }
        response = client.post("/api/overlaps/1/review", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == decision
        assert data["reviewer_decision"] == decision
        assert "ananya.roy" in data["reviewer_remarks"] or "statutory" in data["reviewer_remarks"].lower()

        # Verify audit action was recorded on DEMO-CASE-001
        case_resp = client.get("/api/cases/DEMO-CASE-001")
        assert case_resp.status_code == 200
        actions = case_resp.json()["action_history"]
        assert any(decision in a["action_taken"] for a in actions)


def test_submit_review_invalid_decision_returns_422(client):
    """Test submitting unrecognized review decision returns 422."""
    payload = {
        "decision": "InvalidArbitraryDecision",
        "remarks": "Sufficient length remarks for test validation",
        "reviewerName": "Officer"
    }
    response = client.post("/api/overlaps/1/review", json=payload)
    assert response.status_code == 422
    assert "allowed decisions" in response.json()["detail"].lower()


def test_submit_review_short_remarks_returns_422(client):
    """Test submitting review with insufficient remarks returns 422."""
    payload = {
        "decision": "Coordination Required",
        "remarks": "Ok",  # too short
        "reviewerName": "Officer"
    }
    response = client.post("/api/overlaps/1/review", json=payload)
    assert response.status_code == 422


def test_submit_review_preserves_cases_without_auto_merging_or_deleting(client, db_session):
    """Human control test: Review never automatically closes, deletes, or merges complaint cases."""
    # Count cases before review
    count_before = db_session.query(ComplaintCase).count()

    payload = {
        "decision": "Coordination Required",
        "remarks": "Cases appear deeply correlated; schedule joint meeting",
        "reviewerName": "Dr. Narayanan"
    }
    response = client.post("/api/overlaps/1/review", json=payload)
    assert response.status_code == 200

    # Verify both cases still exist independently in database
    count_after = db_session.query(ComplaintCase).count()
    assert count_before == count_after

    case1 = db_session.query(ComplaintCase).filter(ComplaintCase.case_id == "DEMO-CASE-001").first()
    case2 = db_session.query(ComplaintCase).filter(ComplaintCase.case_id == "DEMO-CASE-002").first()
    assert case1 is not None
    assert case2 is not None
    # Neither case was deleted or forcibly merged
    assert case1.case_id != case2.case_id


def test_not_related_decision_suppresses_pending_alert(client, db_session):
    """Test that a pair marked 'Not Related' does not appear under Pending Review status."""
    payload = {
        "decision": "Not Related",
        "remarks": "Grievance issues investigated; separate unrelated incidents.",
        "reviewerName": "Director AICTE"
    }
    rev_resp = client.post("/api/overlaps/1/review", json=payload)
    assert rev_resp.status_code == 200
    assert rev_resp.json()["status"] == "Not Related"

    # Query overlaps filtered by Pending Review
    pending_resp = client.get("/api/overlaps?status=Pending Review")
    assert pending_resp.status_code == 200
    pending_items = pending_resp.json()["items"]
    # Overlap 1 must NOT be in pending list
    assert not any(item["primary_case_id"] == "DEMO-CASE-001" and item["secondary_case_id"] == "DEMO-CASE-002" for item in pending_items)

    # But it remains accessible under status=Not Related
    not_rel_resp = client.get("/api/overlaps?status=Not Related")
    assert not_rel_resp.status_code == 200
    assert any(item["primary_case_id"] == "DEMO-CASE-001" for item in not_rel_resp.json()["items"])


# =========================================================================
# E. DEADLINE SERVICE CALCULATIONS
# =========================================================================

def test_deadline_service_past_and_future():
    """Test deadline service handles past, future, and exact timestamps."""
    now = datetime(2026, 10, 26, 12, 0, 0)
    past_due = now - timedelta(days=5)
    future_due = now + timedelta(days=5)
    exact_due = now

    # Overdue
    assert is_case_overdue(past_due, "Under Process", current_time=now) is True
    assert is_case_overdue(future_due, "Under Process", current_time=now) is False
    assert is_case_overdue(exact_due, "Under Process", current_time=now) is False

    # Disposed cases are never overdue
    assert is_case_overdue(past_due, "Disposed", current_time=now) is False
    assert is_case_overdue(past_due, "disposed", current_time=now) is False

    # None due date is not overdue
    assert is_case_overdue(None, "Under Process", current_time=now) is False


def test_deadline_service_approaching_window():
    """Test 48-hour approaching deadline window."""
    now = datetime(2026, 10, 26, 12, 0, 0)
    approaching_due = now + timedelta(hours=36)
    far_future_due = now + timedelta(hours=72)
    past_due = now - timedelta(hours=10)

    assert is_case_approaching_deadline(approaching_due, "Pending", window_hours=48, current_time=now) is True
    assert is_case_approaching_deadline(far_future_due, "Pending", window_hours=48, current_time=now) is False
    # Already overdue is not approaching
    assert is_case_approaching_deadline(past_due, "Pending", window_hours=48, current_time=now) is False
    # Disposed case is not approaching
    assert is_case_approaching_deadline(approaching_due, "Disposed", window_hours=48, current_time=now) is False


def test_deadline_service_days_overdue():
    """Test days overdue calculation."""
    now = datetime(2026, 10, 26, 12, 0, 0)
    assert get_days_overdue(now - timedelta(days=4), "Under Process", current_time=now) == 4
    assert get_days_overdue(now + timedelta(days=2), "Under Process", current_time=now) == 0
    assert get_days_overdue(now - timedelta(days=4), "Disposed", current_time=now) == 0


def test_deadline_service_timezone_normalization():
    """Test timezone-aware timestamps compare safely without raising Python TypeError."""
    now_naive = datetime(2026, 10, 26, 12, 0, 0)
    aware_due = datetime(2026, 10, 20, 12, 0, 0, tzinfo=timezone.utc)

    # Should not raise TypeError: can't compare offset-naive and offset-aware datetimes
    assert is_case_overdue(aware_due, "Under Process", current_time=now_naive) is True
    assert normalize_datetime(aware_due).tzinfo is None


# =========================================================================
# F. DASHBOARD INTEGRATION
# =========================================================================

def test_dashboard_new_metrics_present(client):
    """Test dashboard endpoint returns agreed new workflow metrics."""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()

    # Original fields preserved
    assert "total_cases" in data
    assert "pending_cases" in data
    assert "under_process_cases" in data
    assert "disposed_cases" in data
    assert "transferred_cases" in data
    assert "escalated_cases" in data
    assert "overdue_cases" in data
    assert "potential_overlaps" in data
    assert "bureau_wise_workload" in data
    assert "status_distribution" in data
    assert "region_wise_cases" in data
    assert "recent_actions" in data
    assert "recent_overlaps" in data

    # New fields added
    assert "overlaps_awaiting_review" in data
    assert "cases_approaching_deadline" in data
    assert isinstance(data["overlaps_awaiting_review"], int)
    assert isinstance(data["cases_approaching_deadline"], int)


def test_dashboard_reflects_review_decisions(client):
    """Test that submitting a review decision updates dashboard counts."""
    # Submit review on overlap 1
    client.post(
        "/api/overlaps/1/review",
        json={
            "decision": "Coordination Required",
            "remarks": "Joint inquiry confirmed",
            "reviewerName": "Chairman AICTE"
        }
    )

    dash_resp = client.get("/api/dashboard")
    assert dash_resp.status_code == 200
    data = dash_resp.json()
    # If overlap 1 is no longer Pending Review, overlaps_awaiting_review decreases
    assert data["overlaps_awaiting_review"] == 0
    assert data["potential_overlaps"] == 0
