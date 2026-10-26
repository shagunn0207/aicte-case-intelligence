"""
Precision and Regression Unit Test Suite for AICTE Matching Engine.
Problem Statement: SIH26264 (Person 5 Module)

Validates:
1. Genuinely related cross-bureau pairs score >= 0.65 and generate alerts.
2. Unrelated complaints at the same institution across different bureaus are filtered out (< 0.50).
3. Similar descriptions at different institutions are filtered out.
4. Same-bureau cases without corroboration are filtered out.
5. Generic educational boilerplate words alone do not trigger false positive matches.
6. None, empty, missing, and whitespace-only descriptions are safely handled.
7. Duplicate input cases and duplicate-pair suppression work correctly.
8. Reversed input order yields identical canonical overlap IDs and scores.
9. Preservation of complete output contract and 'Pending Review' status.
"""

import pytest
from backend.matching import detect_overlaps, derive_stable_overlap_id, _safe_text, _tokenize


# ---------------------------------------------------------------------------
# 1. Genuinely Related Cross-Bureau Pair
# ---------------------------------------------------------------------------
def test_related_cross_bureau_pair_matched():
    """Genuinely related complaints sharing institution and substantive keywords score >= 0.65."""
    cases = [
        {
            "case_id": "PGRC-001",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "PGRC",
            "category": "Faculty Salaries",
            "description": "Faculty petition regarding unpaid salary arrears, withholding 7th CPC scale, and ghost professors",
            "status": "Pending"
        },
        {
            "case_id": "RB-002",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise regulatory inspection revealed salary fraud and absentee ghost professors",
            "status": "Under Process"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 1
    match = results[0]
    assert match["id"] == "OVL-PGRC-001-RB-002"
    assert match["similarity_score"] >= 0.65
    assert match["match_score"] >= 65
    assert match["status"] == "Pending Review"
    assert any("Institution Permanent ID" in s for s in match["key_signals"])
    assert any("Cross-Bureau" in s for s in match["key_signals"])


# ---------------------------------------------------------------------------
# 2. Unrelated Complaints at Same Institution Across Different Bureaus
# ---------------------------------------------------------------------------
def test_unrelated_complaints_same_institution_not_matched():
    """Unrelated complaints at the same institution must NOT trigger candidate match (< 0.50)."""
    cases = [
        {
            "case_id": "PGRC-101",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "PGRC",
            "category": "Cafeteria Food",
            "description": "Hostel mess hygiene and unhygienic water supply issues",
            "status": "Pending"
        },
        {
            "case_id": "AB-102",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "AB",
            "category": "Land Title",
            "description": "Deficiency in cadastral land survey lease deed boundaries for expansion wing",
            "status": "Under Process"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0, "Unrelated complaints at same institution must not produce an overlap"


# ---------------------------------------------------------------------------
# 3. Similar Descriptions at Different Institutions
# ---------------------------------------------------------------------------
def test_similar_descriptions_different_institutions_not_matched():
    """Complaints with similar text at different institutions must not be linked."""
    cases = [
        {
            "case_id": "PGRC-201",
            "institution_id": "INST-A",
            "institution_name": "College Alpha",
            "bureau": "PGRC",
            "category": "Ragging",
            "description": "Severe ragging incident in senior boys hostel block",
            "status": "Pending"
        },
        {
            "case_id": "PGRC-202",
            "institution_id": "INST-B",
            "institution_name": "College Beta",
            "bureau": "PGRC",
            "category": "Ragging",
            "description": "Severe ragging incident in senior boys hostel block",
            "status": "Pending"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0, "Distinct institutions must not produce candidate overlaps"


# ---------------------------------------------------------------------------
# 4. Same-Bureau Cases
# ---------------------------------------------------------------------------
def test_same_bureau_unrelated_cases_not_matched():
    """Same-bureau cases without corroboration must not produce candidate overlaps."""
    cases = [
        {
            "case_id": "PGRC-301",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "PGRC",
            "category": "Library",
            "description": "Shortage of reference textbooks in reading room",
            "status": "Pending"
        },
        {
            "case_id": "PGRC-302",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "PGRC",
            "category": "Transportation",
            "description": "College bus route delay and transportation surcharge",
            "status": "Pending"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0


# ---------------------------------------------------------------------------
# 5. Generic Educational & Administrative Boilerplate Words Alone
# ---------------------------------------------------------------------------
def test_generic_boilerplate_words_alone_do_not_match():
    """Generic words like student, college, department, report must not trigger false matches."""
    cases = [
        {
            "case_id": "PGRC-401",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "PGRC",
            "category": "Student Matter",
            "description": "Student submitted formal report to department office regarding academic campus process",
            "status": "Pending"
        },
        {
            "case_id": "RB-402",
            "institution_id": "INST-100",
            "institution_name": "Apex Engineering College",
            "bureau": "RB",
            "category": "Official Notice",
            "description": "Notice issued to college officer details regarding student cases action",
            "status": "Pending"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0, "Generic boilerplate terms alone must not create a candidate overlap"


# ---------------------------------------------------------------------------
# 6. None, Empty, Missing, and Whitespace-Only Text Handling
# ---------------------------------------------------------------------------
def test_none_and_empty_text_handled_safely():
    """Missing or None-valued fields must not crash or inject 'none' tokens."""
    assert _safe_text(None) == ""
    assert _safe_text("none") == ""
    assert _safe_text("None") == ""
    assert _safe_text("   ") == ""
    assert _safe_text(123) == "123"

    # Ensure _tokenize never generates 'none' from missing text
    assert "none" not in _tokenize(None)
    assert "none" not in _tokenize("none")

    cases = [
        {
            "case_id": "CASE-501",
            "institution_id": "INST-100",
            "bureau": "PGRC",
            "category": None,
            "description": None,
            "status": "Pending"
        },
        {
            "case_id": "CASE-502",
            "institution_id": "INST-100",
            "bureau": "RB",
            "category": "",
            "description": "   ",
            "status": "Pending"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 0, "Empty/None descriptions must never trigger an overlap match"


# ---------------------------------------------------------------------------
# 7. Duplicate Input Cases & Suppression
# ---------------------------------------------------------------------------
def test_duplicate_cases_and_duplicate_pairs_suppressed():
    """Duplicate cases in input list must not yield duplicate overlap pairs."""
    case_a = {
        "case_id": "DUP-A",
        "institution_id": "INST-100",
        "bureau": "PGRC",
        "category": "Fee Refund",
        "description": "Withholding refundable security deposit caution money upon transfer",
        "status": "Pending"
    }
    case_b = {
        "case_id": "DUP-B",
        "institution_id": "INST-100",
        "bureau": "RB",
        "category": "Financial Inspection",
        "description": "Financial inspection found illegal retention of refundable security deposit",
        "status": "Under Process"
    }

    # Pass case_a and case_b twice in the list
    cases = [case_a, case_b, case_a, case_b]
    results = detect_overlaps(cases)
    assert len(results) == 1, "Duplicate pairs must be strictly deduplicated"
    assert results[0]["id"] == "OVL-DUP-A-DUP-B"


# ---------------------------------------------------------------------------
# 8. Reversed Input Order and Stable Overlap Identifiers
# ---------------------------------------------------------------------------
def test_reversed_input_order_preserves_canonical_id_and_score():
    """Order of input cases must not change the canonical ID or match score."""
    case_1 = {
        "case_id": "REV-001",
        "institution_id": "INST-100",
        "bureau": "PGRC",
        "category": "Admission Fraud",
        "description": "Unapproved management quota admissions beyond sanctioned intake seats",
        "status": "Pending"
    }
    case_2 = {
        "case_id": "REV-002",
        "institution_id": "INST-100",
        "bureau": "AB",
        "category": "Approval Compliance",
        "description": "Excess intake violation unapproved management admissions verified",
        "status": "Pending"
    }

    results_forward = detect_overlaps([case_1, case_2])
    results_reverse = detect_overlaps([case_2, case_1])

    assert len(results_forward) == 1
    assert len(results_reverse) == 1
    assert results_forward[0]["id"] == results_reverse[0]["id"] == "OVL-REV-001-REV-002"
    assert results_forward[0]["match_score"] == results_reverse[0]["match_score"]
    assert results_forward[0]["similarity_score"] == results_reverse[0]["similarity_score"]


# ---------------------------------------------------------------------------
# 9. Output Contract & Schema Field Preservation
# ---------------------------------------------------------------------------
def test_output_contract_fields_and_pending_review_status():
    """All 21 required schema fields must be present and correctly typed."""
    cases = [
        {
            "case_id": "CONTRACT-01",
            "institution_id": "INST-999",
            "institution_name": "Test Engineering Institute",
            "region": "Northern Region",
            "bureau": "PGRC",
            "category": "Faculty Irregularities",
            "description": "Fake faculty certificates biometric evasion and ghost teachers",
            "status": "Pending"
        },
        {
            "case_id": "CONTRACT-02",
            "institution_id": "INST-999",
            "institution_name": "Test Engineering Institute",
            "region": "Northern Region",
            "bureau": "RB",
            "category": "Cadre Audit",
            "description": "Biometric inspection confirmed fake faculty certificates and ghost teachers",
            "status": "Under Process"
        }
    ]
    results = detect_overlaps(cases)
    assert len(results) == 1
    item = results[0]

    required_keys = [
        "id", "overlap_id", "primary_case_id", "secondary_case_id",
        "case_a_id", "case_b_id", "institution_id", "institution_name",
        "institution_region", "case_a_bureau", "case_b_bureau",
        "case_a_status", "case_b_status", "similarity_score", "match_score",
        "overlap_reason", "summary", "key_signals", "match_reasons",
        "status", "detected_date", "last_updated"
    ]

    for key in required_keys:
        assert key in item, f"Missing required output contract key '{key}'"

    assert isinstance(item["similarity_score"], float)
    assert isinstance(item["match_score"], int)
    assert isinstance(item["key_signals"], list)
    assert isinstance(item["match_reasons"], list)
    assert item["status"] == "Pending Review", "New detections must default to Pending Review"
    assert item["primary_case_id"] == "CONTRACT-01"
    assert item["secondary_case_id"] == "CONTRACT-02"
