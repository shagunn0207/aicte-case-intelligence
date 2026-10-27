"""
Unit Test Suite for AICTE Hierarchical Complaint Taxonomy & Concept Engine.
Tests:
1. Multi-label categorization
2. Synonym and phrasing normalization to canonical concepts
3. Unclassified/unknown handling without forced weak classification
4. Cross-cutting attribute extraction (allegation status, temporal scope, recurrence)
5. Guard exclusions preventing spurious cross-topic matches
6. Issue similarity assessment separating topic similarity from incident relationship
"""

import pytest
from backend.taxonomy import (
    classify_case,
    evaluate_issue_similarity,
    CANONICAL_CONCEPTS,
    TAXONOMY_VERSION,
)


def test_taxonomy_version_defined():
    assert TAXONOMY_VERSION == "1.0.0"
    assert len(CANONICAL_CONCEPTS) >= 15


def test_synonym_resolution_to_canonical_concept():
    """Varied phrasing must resolve to the identical canonical concept."""
    case_1 = {
        "case_id": "TEST-01",
        "category": "Faculty Grievance",
        "description": "Faculty petition regarding unpaid salary arrears and withholding of salary for 5 months.",
    }
    case_2 = {
        "case_id": "TEST-02",
        "category": "Regulatory Audit",
        "description": "Inspection report noted outstanding remuneration withheld and delayed disbursement of 7th CPC arrears.",
    }

    profile_1 = classify_case(case_1)
    profile_2 = classify_case(case_2)

    assert "faculty.salary_arrears" in profile_1.matched_concept_ids
    assert "faculty.salary_arrears" in profile_2.matched_concept_ids

    sim = evaluate_issue_similarity(profile_1, profile_2)
    assert sim.is_same_concept is True
    assert sim.issue_similarity_score >= 0.90
    assert "Faculty Salary Arrears & Withholding" in sim.shared_concept_names


def test_multi_label_classification():
    """A complaint describing both excess intake and capitation fees must receive multiple labels."""
    case = {
        "case_id": "TEST-MULTI",
        "category": "Admissions & Fees",
        "description": "College admitted 60 students beyond sanctioned intake and demanded cash donations as capitation fees.",
    }
    profile = classify_case(case)

    assert "admissions.unapproved_intake" in profile.matched_concept_ids
    assert "fees.capitation_charges" in profile.matched_concept_ids
    assert len(profile.matched_concept_ids) >= 2
    assert "Admissions & Quota Compliance" in profile.parent_categories
    assert "Fees & Financial Compliance" in profile.parent_categories


def test_unclassified_concept_handling():
    """Vague or unclassified complaints must not be forced into an artificial concept."""
    case = {
        "case_id": "TEST-VAGUE",
        "category": "General Query",
        "description": "Requesting clarification on working hours during winter break.",
    }
    profile = classify_case(case)

    assert profile.is_unclassified is True
    assert len(profile.matched_concept_ids) == 0
    assert profile.confidence == 0.0


def test_cross_cutting_allegation_status():
    """Distinguish unverified allegations from confirmed findings."""
    case_alleged = {
        "case_id": "TEST-ALLEG",
        "description": "Complainant states and alleges that biometric attendance is being manipulated.",
    }
    case_confirmed = {
        "case_id": "TEST-CONF",
        "description": "Official inquiry committee conclusively established and inspection confirmed biometric tampering.",
    }

    p_alleged = classify_case(case_alleged)
    p_confirmed = classify_case(case_confirmed)

    assert p_alleged.allegation_status == "alleged"
    assert p_confirmed.allegation_status == "confirmed"


def test_guard_exclusions():
    """Student fee refund dispute must not spuriously match faculty salary arrears."""
    case = {
        "case_id": "TEST-REFUND",
        "category": "Student Account",
        "description": "Student seeking caution money refund after seat cancellation. Management withholding refundable deposit.",
    }
    profile = classify_case(case)

    assert "fees.refund_dispute" in profile.matched_concept_ids
    assert "faculty.salary_arrears" not in profile.matched_concept_ids


def test_systemic_nexus_between_capitation_and_salary():
    """Cross-category nexus recognized between student cash collection and faculty salary crunch."""
    case_a = {
        "case_id": "NEXUS-A",
        "description": "Unauthorized development fees and mandatory cash collections demanded from 3rd year students.",
    }
    case_b = {
        "case_id": "NEXUS-B",
        "description": "Faculty salaries withheld for 4 months citing institutional financial crunch and fund diversion.",
    }

    p_a = classify_case(case_a)
    p_b = classify_case(case_b)

    assert "fees.capitation_charges" in p_a.matched_concept_ids
    assert "faculty.salary_arrears" in p_b.matched_concept_ids

    sim = evaluate_issue_similarity(p_a, p_b)
    assert sim.is_same_concept is False
    assert sim.is_cross_category_nexus is True
    assert sim.systemic_nexus is not None
    assert sim.systemic_nexus.nexus_id == "NEXUS-FIN-01"
    assert sim.issue_similarity_score >= 0.85
