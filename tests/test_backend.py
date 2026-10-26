from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from backend.models import Institution, ComplaintCase, CaseAction
from backend.seed import seed_data


# 1. Database and table creation
def test_database_and_table_creation(test_engine):
    inspector = inspect(test_engine)
    table_names = inspector.get_table_names()
    assert "institutions" in table_names
    assert "complaint_cases" in table_names
    assert "case_actions" in table_names
    assert "coordination_reviews" in table_names


# Health check
def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# 2. Institution search by name
def test_institution_search_by_name(client):
    response = client.get("/api/institutions?q=Apex")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Apex Institute" in item["name"] for item in data["items"])


# 3. Institution search by ID
def test_institution_search_by_id(client):
    response = client.get("/api/institutions?q=DEMO-AICTE-002")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["institution_id"] == "DEMO-AICTE-002"
    assert "Sahyadri" in data["items"][0]["name"]


# 4. Case-insensitive partial matching
def test_case_insensitive_partial_matching(client):
    # Test lowercase against uppercase name
    response_name = client.get("/api/institutions?q=sAhYaDrI")
    assert response_name.status_code == 200
    data_name = response_name.json()
    assert data_name["total"] >= 1
    assert any("Sahyadri" in item["name"] for item in data_name["items"])

    # Test lowercase against uppercase ID
    response_id = client.get("/api/institutions?q=demo-aicte-001")
    assert response_id.status_code == 200
    data_id = response_id.json()
    assert data_id["total"] == 1
    assert data_id["items"][0]["institution_id"] == "DEMO-AICTE-001"


# 5. Institution details retrieval (360° Profile)
def test_institution_details_retrieval(client):
    response = client.get("/api/institutions/DEMO-AICTE-001")
    assert response.status_code == 200
    data = response.json()
    assert data["institution_id"] == "DEMO-AICTE-001"
    assert data["name"] == "Apex Institute of Technology & Research"
    assert data["region"] == "Uttar Pradesh"
    assert "address" in data
    assert "institution_type" in data
    assert data["case_count"] == 4
    assert len(data["associated_cases"]) == 4

    # Check case properties
    first_case = data["associated_cases"][0]
    assert "case_id" in first_case
    assert "category" in first_case
    assert "description" in first_case
    assert "bureau" in first_case
    assert "status" in first_case
    assert "assigned_officer" in first_case
    assert "received_date" in first_case
    assert "due_date" in first_case


# 6. Missing institution returns 404
def test_missing_institution_returns_404(client):
    response = client.get("/api/institutions/NON_EXISTENT_INSTITUTION_ID")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# 7. Case list and individual filters
def test_case_list_and_individual_filters(client):
    # Filter by bureau
    resp_bureau = client.get("/api/cases?bureau=PGRC")
    assert resp_bureau.status_code == 200
    pgrc_data = resp_bureau.json()
    assert pgrc_data["total"] >= 1
    assert all(c["bureau"] == "PGRC" for c in pgrc_data["items"])

    # Filter by status
    resp_status = client.get("/api/cases?status=Under%20Process")
    assert resp_status.status_code == 200
    status_data = resp_status.json()
    assert status_data["total"] >= 1
    assert all(c["status"] == "Under Process" for c in status_data["items"])

    # Filter by category
    resp_category = client.get("/api/cases?category=Fee")
    assert resp_category.status_code == 200
    cat_data = resp_category.json()
    assert cat_data["total"] >= 1
    assert all("Fee" in c["category"] for c in cat_data["items"])


# 8. Combined case filters
def test_combined_case_filters(client):
    response = client.get("/api/cases?institution_id=DEMO-AICTE-001&status=Under%20Process")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    for item in data["items"]:
        assert item["institution_id"] == "DEMO-AICTE-001"
        assert item["status"] == "Under Process"


# 9. Region-based filtering
def test_region_based_filtering(client):
    # Sahyadri College is in Karnataka with DEMO-CASE-005
    response = client.get("/api/cases?region=Karnataka")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["case_id"] == "DEMO-CASE-005"
    assert data["items"][0]["institution_id"] == "DEMO-AICTE-002"


# 10. Pagination and page-size limits
def test_pagination_and_page_size_limits(client):
    # Valid pagination
    response = client.get("/api/cases?page=1&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 3
    assert data["total"] >= 9

    # Page 2
    response_p2 = client.get("/api/cases?page=2&page_size=3")
    assert response_p2.status_code == 200
    data_p2 = response_p2.json()
    assert len(data_p2["items"]) == 3
    assert data_p2["page"] == 2
    # Ensure distinct items between pages
    p1_ids = {c["case_id"] for c in data["items"]}
    p2_ids = {c["case_id"] for c in data_p2["items"]}
    assert p1_ids.isdisjoint(p2_ids)

    # Exceeding max page_size (100) returns 422
    response_overflow = client.get("/api/cases?page=1&page_size=101")
    assert response_overflow.status_code == 422


# 11. Invalid date ranges and query parameters
def test_invalid_date_ranges_and_parameters(client):
    # from_date later than to_date
    from_date = "2026-10-25T00:00:00"
    to_date = "2026-10-10T00:00:00"
    response = client.get(f"/api/cases?from_date={from_date}&to_date={to_date}")
    assert response.status_code == 422
    data = response.json()
    assert "date range" in data["detail"].lower()

    # Invalid page number (<= 0)
    resp_bad_page = client.get("/api/cases?page=0")
    assert resp_bad_page.status_code == 422


# 12. Missing case returns 404
def test_missing_case_returns_404(client):
    response = client.get("/api/cases/NON_EXISTENT_CASE_ID")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# 13. Case details and action-history response compatibility
def test_case_details_with_action_history(client):
    response = client.get("/api/cases/DEMO-CASE-001")
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "DEMO-CASE-001"
    assert data["institution_id"] == "DEMO-AICTE-001"
    assert data["institution"]["name"] == "Apex Institute of Technology & Research"
    assert "action_history" in data
    assert isinstance(data["action_history"], list)
    assert len(data["action_history"]) >= 2
    first_action = data["action_history"][0]
    assert "action_taken" in first_action
    assert "action_by" in first_action
    assert "action_date" in first_action


# 14. Dashboard counts and distributions
def test_dashboard_statistics(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()

    # Key statistics check
    assert data["total_cases"] >= 9
    assert data["pending_cases"] >= 1
    assert data["under_process_cases"] >= 1
    assert data["disposed_cases"] >= 1
    assert data["transferred_cases"] >= 1
    assert data["escalated_cases"] >= 1

    # Sum of statuses matches total_cases
    sum_statuses = (
        data["pending_cases"]
        + data["under_process_cases"]
        + data["disposed_cases"]
        + data["transferred_cases"]
        + data["escalated_cases"]
    )
    assert sum_statuses == data["total_cases"]

    # Status distribution contains all 5 official statuses
    status_names = [sd["status"] for sd in data["status_distribution"]]
    for expected_st in ["Pending", "Under Process", "Disposed", "Transferred", "Escalated"]:
        assert expected_st in status_names

    # Bureau workload present
    assert len(data["bureau_wise_workload"]) >= 2
    assert any(b["bureau"] == "PGRC" for b in data["bureau_wise_workload"])

    # Region wise cases present
    assert len(data["region_wise_cases"]) >= 2

    # Recent actions & overlaps lists present
    assert isinstance(data["recent_actions"], list)
    assert isinstance(data["recent_overlaps"], list)


# 15. Overdue-case calculation rule:
# Rule: due_date < current_time AND status != 'Disposed'
def test_overdue_case_calculation(client, db_session):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    # In seeded data:
    # DEMO-CASE-005: due_date 15 days ago, status Escalated -> OVERDUE
    # DEMO-CASE-004: due_date 20 days ago, status Disposed -> NOT overdue
    assert data["overdue_cases"] >= 1


# 16. Seed script idempotency
def test_seed_script_idempotency(db_session):
    initial_inst_count = db_session.query(Institution).count()
    initial_case_count = db_session.query(ComplaintCase).count()

    # Re-run seed
    seed_data(db_session=db_session)

    new_inst_count = db_session.query(Institution).count()
    new_case_count = db_session.query(ComplaintCase).count()

    assert initial_inst_count == new_inst_count
    assert initial_case_count == new_case_count


# 17. Foreign-key integrity enforcement
def test_foreign_key_integrity(db_session):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    invalid_case = ComplaintCase(
        case_id="INVALID-CASE-FK",
        institution_id="NON-EXISTENT-INSTITUTION-FK",
        received_date=now,
        category="Test Category",
        description="Foreign key violation test",
        bureau="PGRC",
        assigned_officer="Test Officer",
        status="Pending",
        due_date=now + timedelta(days=7),
        created_at=now,
        updated_at=now
    )
    db_session.add(invalid_case)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
