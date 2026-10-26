"""
Automated Test Suite for Actionable In-App Alerts and Explicit Case Links.
Problem Statement: SIH26264 (Backend Developer 2)

Tests:
- GET /api/alerts: actionable alerts, ordering by urgency, overdue/approaching/pending-review.
- Overdue filtering: GET /api/cases?overdue=true and ?overdue=false.
- Computed overdue indicators on case models and schemas.
- Handling of disposed cases and missing due dates.
- GET /api/cases/{case_id}/links: both directions (primary vs secondary), 404 on unknown case,
  excluding unreviewed/unrelated overlaps, preserving original case records.
"""

from datetime import datetime, timedelta, timezone
import pytest
from backend.models import ComplaintCase, CoordinationReview, CaseAction, Institution, utcnow
from backend.services.deadlines import get_current_utc_time


# =========================================================================
# 1. ACTIONABLE ALERTS (GET /api/alerts)
# =========================================================================

def test_alerts_endpoint_structure_and_counts(client):
    """Test that GET /api/alerts returns well-structured alert items and severity counts."""
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "critical_count" in data
    assert "high_count" in data
    assert "medium_count" in data
    assert "low_count" in data
    assert data["total"] == len(data["items"])
    assert data["critical_count"] + data["high_count"] + data["medium_count"] + data["low_count"] == data["total"]


def test_alerts_ordering_by_urgency(client, db_session):
    """Test that alerts are strictly sorted by urgency: CRITICAL > HIGH > MEDIUM > LOW."""
    response = client.get("/api/alerts")
    assert response.status_code == 200
    items = response.json()["items"]
    
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    for i in range(len(items) - 1):
        curr_rank = severity_order.get(items[i]["severity"], 99)
        next_rank = severity_order.get(items[i + 1]["severity"], 99)
        assert curr_rank <= next_rank, f"Alert at index {i} ({items[i]['severity']}) ranked lower than index {i+1} ({items[i+1]['severity']})"


def test_alerts_overdue_cases(client, db_session):
    """Test that overdue non-disposed cases generate OVERDUE alerts with days_overdue."""
    now = get_current_utc_time()
    # Find or verify overdue cases
    response = client.get("/api/alerts?alert_type=OVERDUE")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] > 0
    for alert in data["items"]:
        assert alert["alert_type"] == "OVERDUE"
        assert alert["severity"] in ["CRITICAL", "HIGH"]
        assert alert["case_id"] is not None
        assert alert["days_overdue"] is not None
        assert alert["days_overdue"] >= 1
        assert alert["due_date"] is not None
        assert "past statutory deadline" in alert["message"]


def test_alerts_approaching_deadlines(client, db_session):
    """Test that cases with deadlines within 48h generate APPROACHING_DEADLINE alerts."""
    # Ensure there's a case approaching deadline
    now = get_current_utc_time()
    test_case = ComplaintCase(
        case_id="TEST-DEADLINE-APPROACHING-001",
        institution_id="DEMO-AICTE-001",
        received_date=now - timedelta(days=5),
        category="Infrastructure Deficiencies",
        description="Approaching SLA deadline test case",
        bureau="Approval Bureau",
        assigned_officer="Testing Officer",
        status="Under Process",
        due_date=now + timedelta(hours=20)
    )
    db_session.add(test_case)
    db_session.commit()

    response = client.get("/api/alerts?alert_type=APPROACHING_DEADLINE")
    assert response.status_code == 200
    data = response.json()
    
    matched = [a for a in data["items"] if a["case_id"] == "TEST-DEADLINE-APPROACHING-001"]
    assert len(matched) == 1
    alert = matched[0]
    assert alert["alert_type"] == "APPROACHING_DEADLINE"
    assert alert["severity"] == "HIGH"  # <= 24 hours
    assert alert["hours_remaining"] is not None
    assert 0 < alert["hours_remaining"] <= 24.0

    # Clean up
    db_session.delete(test_case)
    db_session.commit()


def test_alerts_disposed_cases_excluded(client, db_session):
    """Test that disposed cases are strictly excluded from overdue and approaching alerts."""
    now = get_current_utc_time()
    disposed_case = ComplaintCase(
        case_id="TEST-DISPOSED-OVERDUE-001",
        institution_id="DEMO-AICTE-001",
        received_date=now - timedelta(days=60),
        category="Academic Malpractices",
        description="Disposed case that would otherwise be overdue",
        bureau="PGRC",
        assigned_officer="Testing Officer",
        status="Disposed",
        due_date=now - timedelta(days=30)  # past due, but disposed!
    )
    db_session.add(disposed_case)
    db_session.commit()

    response = client.get("/api/alerts")
    assert response.status_code == 200
    items = response.json()["items"]

    # Verify TEST-DISPOSED-OVERDUE-001 generates NO alert
    assert not any(a["case_id"] == "TEST-DISPOSED-OVERDUE-001" for a in items)

    # Clean up
    db_session.delete(disposed_case)
    db_session.commit()


def test_alerts_missing_due_dates_excluded(client):
    """Test that cases with missing due dates are safely handled by deadline logic."""
    from backend.services.deadlines import (
        is_case_overdue,
        is_case_approaching_deadline,
        get_days_overdue,
        get_time_remaining
    )
    # Missing due dates must never be flagged as overdue or approaching deadline
    assert is_case_overdue(None, "Pending") is False
    assert is_case_overdue(None, "Under Process") is False
    assert is_case_approaching_deadline(None, "Pending") is False
    assert get_days_overdue(None, "Pending") == 0
    assert get_time_remaining(None) is None


def test_alerts_pending_overlap_reviews(client, db_session):
    """Test that candidate overlaps awaiting human review generate PENDING_REVIEW alerts."""
    response = client.get("/api/alerts?alert_type=PENDING_REVIEW")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    first_overlap_alert = data["items"][0]
    assert first_overlap_alert["alert_type"] == "PENDING_REVIEW"
    assert first_overlap_alert["overlap_id"] is not None
    assert first_overlap_alert["similarity_score"] is not None
    assert "Cross-bureau correlation detected" in first_overlap_alert["message"]


def test_alerts_suppressed_after_review(client, db_session):
    """Test that submitting a review for a pending overlap suppresses its alert."""
    # Find a pending overlap
    overlaps_resp = client.get("/api/overlaps?status=Pending Review")
    assert overlaps_resp.status_code == 200
    overlaps = overlaps_resp.json()["items"]
    if not overlaps:
        pytest.skip("No pending overlap available for suppression test")

    target_ovl = overlaps[0]
    target_id = target_ovl["id"]

    # Verify it has an alert initially
    alerts_before = client.get("/api/alerts?alert_type=PENDING_REVIEW").json()["items"]
    initial_match = [a for a in alerts_before if a["overlap_id"] == target_id]
    assert len(initial_match) == 1

    # Submit review with "Not Related"
    review_resp = client.post(
        f"/api/overlaps/{target_id}/review",
        json={
            "decision": "Not Related",
            "remarks": "Verified independent student grievance and faculty petition; no institutional correlation found."
        }
    )
    assert review_resp.status_code == 200

    # Verify the alert is now suppressed
    alerts_after = client.get("/api/alerts?alert_type=PENDING_REVIEW").json()["items"]
    assert not any(a["overlap_id"] == target_id for a in alerts_after)


def test_alerts_filters_combination(client):
    """Test combining filters on GET /api/alerts (type, severity, bureau)."""
    response = client.get("/api/alerts?alert_type=OVERDUE&severity=CRITICAL")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["alert_type"] == "OVERDUE"
        assert item["severity"] == "CRITICAL"


# =========================================================================
# 2. OVERDUE FILTERING ON CASES (GET /api/cases?overdue=true/false)
# =========================================================================

def test_cases_list_overdue_filter_true(client):
    """Test GET /api/cases?overdue=true returns only overdue non-disposed cases."""
    response = client.get("/api/cases?overdue=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0

    now = get_current_utc_time()
    for c in data["items"]:
        assert c["status"] != "Disposed"
        assert c["is_overdue"] is True
        assert c["days_overdue"] >= 1


def test_cases_list_overdue_filter_false(client):
    """Test GET /api/cases?overdue=false returns cases that are NOT overdue."""
    response = client.get("/api/cases?overdue=false")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0

    for c in data["items"]:
        assert c["is_overdue"] is False
        assert c["days_overdue"] == 0


def test_case_summary_computed_overdue_indicators(client):
    """Test that CaseSummary responses expose is_overdue, days_overdue, and is_approaching_deadline."""
    response = client.get("/api/cases/DEMO-CASE-004")
    assert response.status_code == 200
    case = response.json()
    assert "is_overdue" in case
    assert "days_overdue" in case
    assert "is_approaching_deadline" in case
    assert isinstance(case["is_overdue"], bool)
    assert isinstance(case["days_overdue"], int)
    assert isinstance(case["is_approaching_deadline"], bool)


# =========================================================================
# 3. EXPLICIT CASE-TO-CASE LINK RETRIEVAL (GET /api/cases/{case_id}/links)
# =========================================================================

def test_case_links_unknown_case_returns_404(client):
    """Test that requesting links for a non-existent case returns 404."""
    response = client.get("/api/cases/NON-EXISTENT-CASE-999/links")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_case_links_both_directions(client, db_session):
    """
    Test confirmed case-to-case link retrieval in both directions:
    Whether the queried case is the primary_case_id or secondary_case_id in CoordinationReview.
    """
    now = get_current_utc_time()
    # Create two test cases
    case_a = ComplaintCase(
        case_id="TEST-LINK-CASE-A",
        institution_id="DEMO-AICTE-001",
        received_date=now,
        category="Fee Irregularities",
        description="First link test case",
        bureau="PGRC",
        assigned_officer="Officer A",
        status="Under Process",
        due_date=now + timedelta(days=30)
    )
    case_b = ComplaintCase(
        case_id="TEST-LINK-CASE-B",
        institution_id="DEMO-AICTE-001",
        received_date=now,
        category="Fee Irregularities",
        description="Second link test case",
        bureau="Approval Bureau",
        assigned_officer="Officer B",
        status="Under Process",
        due_date=now + timedelta(days=30)
    )
    db_session.add(case_a)
    db_session.add(case_b)
    db_session.commit()

    # Create a confirmed coordination review: case_a is primary, case_b is secondary
    rev = CoordinationReview(
        primary_case_id="TEST-LINK-CASE-A",
        secondary_case_id="TEST-LINK-CASE-B",
        similarity_score=0.92,
        overlap_reason="Identical capitation fee complaints in same semester",
        status="Coordination Required",
        reviewer_decision="Coordination Required",
        reviewer_remarks="Joint inspection ordered across PGRC and Approval Bureau",
        reviewed_by="Regional Director",
        reviewed_at=now
    )
    db_session.add(rev)
    db_session.commit()

    # Direction 1: Query Case A (primary) -> should return Case B as linked_case_id
    resp_a = client.get("/api/cases/TEST-LINK-CASE-A/links")
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert data_a["case_id"] == "TEST-LINK-CASE-A"
    assert data_a["total_links"] == 1
    assert len(data_a["links"]) == 1
    link_item_a = data_a["links"][0]
    assert link_item_a["linked_case_id"] == "TEST-LINK-CASE-B"
    assert link_item_a["decision"] == "Coordination Required"
    assert link_item_a["status"] == "Coordination Required"
    assert link_item_a["reviewer"] == "Regional Director"
    assert link_item_a["similarity_score"] == 0.92
    assert link_item_a["linked_case_bureau"] == "Approval Bureau"

    # Direction 2: Query Case B (secondary) -> should return Case A as linked_case_id
    resp_b = client.get("/api/cases/TEST-LINK-CASE-B/links")
    assert resp_b.status_code == 200
    data_b = resp_b.json()
    assert data_b["case_id"] == "TEST-LINK-CASE-B"
    assert data_b["total_links"] == 1
    assert len(data_b["links"]) == 1
    link_item_b = data_b["links"][0]
    assert link_item_b["linked_case_id"] == "TEST-LINK-CASE-A"
    assert link_item_b["decision"] == "Coordination Required"
    assert link_item_b["status"] == "Coordination Required"
    assert link_item_b["reviewer"] == "Regional Director"
    assert link_item_b["similarity_score"] == 0.92
    assert link_item_b["linked_case_bureau"] == "PGRC"

    # Clean up
    db_session.delete(rev)
    db_session.commit()
    db_session.delete(case_a)
    db_session.delete(case_b)
    db_session.commit()


def test_case_links_excludes_unreviewed_or_unrelated(client, db_session):
    """
    Test that candidate overlaps with status 'Pending Review' or decided as 'Not Related'
    are NOT treated as confirmed case links.
    """
    now = get_current_utc_time()
    case_c = ComplaintCase(
        case_id="TEST-LINK-CASE-C",
        institution_id="DEMO-AICTE-002",
        received_date=now,
        category="Faculty Grievance",
        description="Third test case",
        bureau="PGRC",
        assigned_officer="Officer C",
        status="Under Process",
        due_date=now + timedelta(days=30)
    )
    case_d = ComplaintCase(
        case_id="TEST-LINK-CASE-D",
        institution_id="DEMO-AICTE-002",
        received_date=now,
        category="Ragging Allegation",
        description="Fourth test case",
        bureau="Approval Bureau",
        assigned_officer="Officer D",
        status="Under Process",
        due_date=now + timedelta(days=30)
    )
    db_session.add(case_c)
    db_session.add(case_d)
    db_session.commit()

    # 1. Unreviewed overlap
    pending_rev = CoordinationReview(
        primary_case_id="TEST-LINK-CASE-C",
        secondary_case_id="TEST-LINK-CASE-D",
        similarity_score=0.65,
        overlap_reason="Candidate overlap awaiting review",
        status="Pending Review"
    )
    db_session.add(pending_rev)
    db_session.commit()

    # Must return 0 confirmed links
    resp = client.get("/api/cases/TEST-LINK-CASE-C/links")
    assert resp.status_code == 200
    assert resp.json()["total_links"] == 0

    # 2. Update to "Not Related"
    pending_rev.status = "Not Related"
    pending_rev.reviewer_decision = "Not Related"
    pending_rev.reviewed_by = "Officer"
    pending_rev.reviewed_at = now
    db_session.commit()

    # Still must return 0 confirmed links
    resp = client.get("/api/cases/TEST-LINK-CASE-C/links")
    assert resp.status_code == 200
    assert resp.json()["total_links"] == 0

    # Clean up
    db_session.delete(pending_rev)
    db_session.commit()
    db_session.delete(case_c)
    db_session.delete(case_d)
    db_session.commit()



def test_case_links_preserves_original_cases(client):
    """Test that retrieving links never mutates, merges, or deletes the original complaint cases."""
    # Check that DEMO-CASE-001 exists before
    case_before = client.get("/api/cases/DEMO-CASE-001").json()
    assert case_before["case_id"] == "DEMO-CASE-001"

    # Call links endpoint
    links_resp = client.get("/api/cases/DEMO-CASE-001/links")
    assert links_resp.status_code == 200

    # Verify case after is completely intact
    case_after = client.get("/api/cases/DEMO-CASE-001").json()
    assert case_after["case_id"] == case_before["case_id"]
    assert case_after["status"] == case_before["status"]
    assert len(case_after["action_history"]) == len(case_before["action_history"])
