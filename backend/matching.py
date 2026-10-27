"""
AICTE Cross-Bureau Overlap Detection & Explainable Relationship Intelligence Engine.
Version: 2.0.0 (Taxonomy & Action-Corroborated Multi-Signal Matcher)

Implements:
1. Candidate Generation:
   - Evaluates case pairs, institutional identity, and cross-bureau jurisdiction.
2. Domain Understanding:
   - Multi-label hierarchical taxonomy classification (8 parent categories, subcategories, canonical concepts).
   - Distinguishes issue similarity from incident relationship.
3. Relationship Evidence:
   - Lexical Jaccard narrative convergence.
   - Investigation findings and recorded action history corroboration.
   - Temporal proximity and incident continuity context.
   - Department/program entity matching vs incident divergence.
   - Explicit cross-category systemic nexus rules.
4. Explainable Decision Support:
   - Stable canonical overlap IDs (OVL-CASEA-CASEB).
   - Structured explainability cards with evidence extracts and recommended verification actions.
   - Transparent counter-evidence and human review recommendations.
   - Preserves all output schemas, types, and 'Pending Review' defaults.
"""

import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Set, Tuple, Optional

from backend.taxonomy import (
    classify_case,
    evaluate_issue_similarity,
    CaseDomainProfile,
    IssueSimilarityAssessment,
    CANONICAL_CONCEPTS,
    TAXONOMY_VERSION,
)


# Extended stop words: grammatical and generic administrative/educational boilerplate
STOP_WORDS = {
    # Grammatical & functional:
    "the", "and", "for", "with", "from", "this", "that", "were", "been", "have",
    "has", "had", "under", "per", "regarding", "alleging", "against", "all", "was",
    "are", "will", "submitted", "lodged", "formal", "complaint", "institution",
    # Generic administrative/educational:
    "student", "students", "college", "campus", "department", "academic",
    "office", "officer", "report", "reported", "notice", "issued", "portal",
    "process", "action", "matter", "case", "cases", "details", "request"
}


def _safe_text(val: Any) -> str:
    """Safely normalizes optional text fields."""
    if val is None:
        return ""
    if not isinstance(val, str):
        val = str(val)
    trimmed = val.strip()
    if trimmed.lower() == "none":
        return ""
    return trimmed


def _tokenize(text: str) -> Set[str]:
    """Extracts alphanumeric lowercase word tokens of length >= 3 excluding stop words."""
    cleaned_text = _safe_text(text)
    if not cleaned_text:
        return set()
    words = re.findall(r"\b[a-zA-Z]{3,}\b", cleaned_text.lower())
    return {w for w in words if w not in STOP_WORDS}


def _parse_iso_date(date_str: Any) -> Optional[datetime]:
    """Safely parses ISO format dates or timestamps."""
    if not date_str or not isinstance(date_str, str):
        return None
    try:
        clean = date_str.replace("Z", "+00:00").split("+")[0]
        if "T" in clean:
            return datetime.fromisoformat(clean)
        return datetime.strptime(clean, "%Y-%m-%d")
    except Exception:
        return None


def derive_stable_overlap_id(case_a_id: str, case_b_id: str) -> str:
    """
    Derives a deterministic, canonical overlap ID for a pair of case IDs.
    Order-invariant: (case1, case2) == (case2, case1).
    """
    sorted_pair = sorted([case_a_id.strip(), case_b_id.strip()])
    return f"OVL-{sorted_pair[0]}-{sorted_pair[1]}"


# ---------------------------------------------------------------------------
# Baseline Matcher (Retained verbatim for empirical evaluation benchmarking)
# ---------------------------------------------------------------------------

def baseline_detect_overlaps(cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Baseline matching engine (lexical Jaccard + exact institution ID + stop-word guard).
    Retained to measure empirical progress against the taxonomy-enhanced matcher.
    """
    if not cases or len(cases) < 2:
        return []

    overlaps = []
    seen_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(cases)):
        case1 = cases[i]
        id1 = case1.get("case_id")
        inst1 = case1.get("institution_id")
        bureau1 = case1.get("bureau")

        if not id1 or not inst1:
            continue

        for j in range(i + 1, len(cases)):
            case2 = cases[j]
            id2 = case2.get("case_id")
            inst2 = case2.get("institution_id")
            bureau2 = case2.get("bureau")

            if not id2 or not inst2:
                continue

            pair_key = tuple(sorted([id1, id2]))
            if id1 == id2 or pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            is_same_institution = (inst1 == inst2)
            is_cross_bureau = (bureau1 != bureau2)

            cat1 = _safe_text(case1.get("category"))
            cat2 = _safe_text(case2.get("category"))
            desc1 = _safe_text(case1.get("description"))
            desc2 = _safe_text(case2.get("description"))

            tokens1 = _tokenize(f"{cat1} {desc1}")
            tokens2 = _tokenize(f"{cat2} {desc2}")

            shared_tokens = sorted(list(tokens1.intersection(tokens2)))
            union_len = len(tokens1.union(tokens2))
            jaccard = (len(shared_tokens) / union_len) if union_len > 0 else 0.0

            has_topical_evidence = (len(shared_tokens) >= 2) or (len(shared_tokens) >= 1 and jaccard >= 0.15)

            score = 0.0
            if is_same_institution:
                if has_topical_evidence:
                    score += 0.40
                    if is_cross_bureau:
                        score += 0.15
                else:
                    score += 0.25

            if shared_tokens:
                token_bonus = min(0.35, len(shared_tokens) * 0.06 + jaccard * 0.15)
                score += token_bonus

            if score >= 0.50:
                final_score = min(0.99, round(score, 2))
                match_percentage = int(round(final_score * 100))
                case_a_id, case_b_id = pair_key
                first_case = case1 if case1["case_id"] == case_a_id else case2
                second_case = case2 if case2["case_id"] == case_b_id else case1

                overlap_id = derive_stable_overlap_id(case_a_id, case_b_id)
                summary = (
                    f"Cross-bureau correlation ({match_percentage}%) detected between {first_case.get('bureau')} "
                    f"({case_a_id}) and {second_case.get('bureau')} ({case_b_id})."
                )
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")

                overlaps.append({
                    "id": overlap_id,
                    "overlap_id": overlap_id,
                    "primary_case_id": case_a_id,
                    "secondary_case_id": case_b_id,
                    "case_a_id": case_a_id,
                    "case_b_id": case_b_id,
                    "institution_id": first_case.get("institution_id"),
                    "institution_name": first_case.get("institution_name", "AICTE Approved Institution"),
                    "institution_region": first_case.get("region"),
                    "case_a_bureau": first_case.get("bureau"),
                    "case_b_bureau": second_case.get("bureau"),
                    "case_a_status": first_case.get("status"),
                    "case_b_status": second_case.get("status"),
                    "similarity_score": final_score,
                    "match_score": match_percentage,
                    "overlap_reason": summary,
                    "summary": summary,
                    "key_signals": [f"Permanent Institution ID ({inst1})", f"Shared Tokens: {', '.join(shared_tokens[:5])}"],
                    "match_reasons": [],
                    "status": "Pending Review",
                    "detected_date": now_iso,
                    "last_updated": now_iso
                })

    overlaps.sort(key=lambda o: (o["match_score"], o["id"]), reverse=True)
    return overlaps


# ---------------------------------------------------------------------------
# Enhanced Matcher (Taxonomy, Multi-Signal Evidence, Action Corroboration)
# ---------------------------------------------------------------------------

def detect_overlaps(cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enhanced matching engine combining hierarchical taxonomy, canonical concepts,
    action history findings, temporal context, and explainable decision support.
    """
    if not cases or len(cases) < 2:
        return []

    overlaps = []
    seen_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(cases)):
        case1 = cases[i]
        id1 = case1.get("case_id")
        inst1 = case1.get("institution_id")
        bureau1 = case1.get("bureau")

        if not id1 or not inst1:
            continue

        for j in range(i + 1, len(cases)):
            case2 = cases[j]
            id2 = case2.get("case_id")
            inst2 = case2.get("institution_id")
            bureau2 = case2.get("bureau")

            if not id2 or not inst2:
                continue

            pair_key = tuple(sorted([id1, id2]))
            if id1 == id2 or pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            # Order consistently by pair_key
            case_a = case1 if case1["case_id"] == pair_key[0] else case2
            case_b = case2 if case2["case_id"] == pair_key[1] else case1

            # -----------------------------------------------------------------
            # 1. Candidate Generation & Institutional Guard
            # -----------------------------------------------------------------
            is_same_institution = (case_a.get("institution_id") == case_b.get("institution_id"))
            is_cross_bureau = (case_a.get("bureau") != case_b.get("bureau"))

            # Guard: Distinct institutions are never flagged as the same incident
            if not is_same_institution:
                continue

            # -----------------------------------------------------------------
            # 2. Domain Understanding (Taxonomy & Canonical Concepts)
            # -----------------------------------------------------------------
            profile_a = classify_case(case_a)
            profile_b = classify_case(case_b)
            issue_sim = evaluate_issue_similarity(profile_a, profile_b)

            # -----------------------------------------------------------------
            # 3. Relationship Evidence: Lexical & Narrative Signals
            # -----------------------------------------------------------------
            cat_a = _safe_text(case_a.get("category"))
            cat_b = _safe_text(case_b.get("category"))
            desc_a = _safe_text(case_a.get("description"))
            desc_b = _safe_text(case_b.get("description"))
            act_a = _safe_text(case_a.get("last_action"))
            act_b = _safe_text(case_b.get("last_action"))

            tokens_a = _tokenize(f"{cat_a} {desc_a} {act_a}")
            tokens_b = _tokenize(f"{cat_b} {desc_b} {act_b}")
            shared_tokens = sorted(list(tokens_a.intersection(tokens_b)))
            union_len = len(tokens_a.union(tokens_b))
            jaccard = (len(shared_tokens) / union_len) if union_len > 0 else 0.0

            # -----------------------------------------------------------------
            # 4. Action-History & Procedural Corroboration
            # -----------------------------------------------------------------
            actions_text_a = f"{act_a} {_safe_text(case_a.get('next_action'))}".lower()
            actions_text_b = f"{act_b} {_safe_text(case_b.get('next_action'))}".lower()

            has_corroborating_action = False
            corroborating_action_note = ""

            # Check if action findings explicitly align on verified facts
            action_clues = [
                ("salary arrears", "unpaid salary", "Confirmed non-payment / salary arrears"),
                ("biometric", "ghost", "Impounded biometric / ghost faculty records"),
                ("capitation", "cash collection", "Seized unofficial cash receipts / fee collection"),
                ("hall ticket", "admit card", "Withholding examination hall tickets"),
                ("unapproved intake", "excess intake", "Confirmed admissions beyond sanctioned intake"),
                ("forged", "unapproved course", "Confirmed unapproved course / forged approval"),
            ]
            for clue1, clue2, label in action_clues:
                in_a = clue1 in actions_text_a or clue2 in actions_text_a
                in_b = clue1 in actions_text_b or clue2 in actions_text_b
                desc_match = (clue1 in desc_a.lower() and clue2 in actions_text_b) or (clue1 in desc_b.lower() and clue2 in actions_text_a)
                if (in_a and in_b) or desc_match:
                    has_corroborating_action = True
                    corroborating_action_note = label
                    break

            # -----------------------------------------------------------------
            # 5. Counter-Evidence & Incident Separation Detection
            # -----------------------------------------------------------------
            counter_evidence: List[str] = []
            has_contradiction = False

            # Check for explicit action contradictions (distinct wings, personal damage, lawful rejection)
            combined_actions = f"{actions_text_a} {actions_text_b}"
            if re.search(r"\b(distinct from degree|separate budget|polytechnic wing|separate trust)\b", combined_actions):
                has_contradiction = True
                counter_evidence.append("Action reports explicitly establish distinct legal/academic entities (Diploma vs Degree College).")

            if re.search(r"\b(hostel damages?|personal damage deduction|legally upheld)\b", combined_actions):
                has_contradiction = True
                counter_evidence.append("Action findings confirm personal damage dispute, not an institutional systemic fee policy.")

            if re.search(r"\b(lacked minimum qualifying|statutory and lawful|lawful student rejection)\b", combined_actions):
                has_contradiction = True
                counter_evidence.append("Action reports confirmed lawful student rejection due to ineligibility.")

            # Temporal Separation Context:
            date_a = _parse_iso_date(case_a.get("received_date"))
            date_b = _parse_iso_date(case_b.get("received_date"))
            temporal_gap_days = None
            if date_a and date_b:
                temporal_gap_days = abs((date_b - date_a).days)

            status_a = str(case_a.get("status") or "")
            status_b = str(case_b.get("status") or "")
            one_is_disposed = (status_a.lower() == "disposed" or status_b.lower() == "disposed")

            if temporal_gap_days is not None and temporal_gap_days > 730 and one_is_disposed:
                has_contradiction = True
                counter_evidence.append(
                    f"Substantial temporal separation ({temporal_gap_days} days / >2 years) and one case is already disposed."
                )

            # Department / Program Entity Divergence:
            depts_a = set(profile_a.specific_entities.get("departments", []))
            depts_b = set(profile_b.specific_entities.get("departments", []))
            years_a = set(profile_a.specific_entities.get("years", []))
            years_b = set(profile_b.specific_entities.get("years", []))

            # If both explicitly specify different engineering departments (e.g., civil vs computer science)
            if depts_a and depts_b and not depts_a.intersection(depts_b):
                if temporal_gap_days and temporal_gap_days > 365:
                    has_contradiction = True
                    counter_evidence.append(
                        f"Distinct academic departments ({', '.join(depts_a)} vs {', '.join(depts_b)}) across different years."
                    )

            # -----------------------------------------------------------------
            # 6. Multi-Signal Scoring Pipeline
            # -----------------------------------------------------------------
            score = 0.0
            reasons = []
            key_signals = []

            # A. Entity Identity Signal (Baseline: same permanent institution)
            score += 0.30
            inst_name = case_a.get("institution_name", "AICTE Approved Institution")
            key_signals.append(f"Identical Institution Permanent ID ({case_a.get('institution_id')})")
            reasons.append({
                "id": f"sig-inst-{case_a['case_id']}-{case_b['case_id']}",
                "signal_name": "Permanent Institution ID Match",
                "category": "Entity Identity",
                "score": 100.0,
                "weight": "Primary Identifier",
                "description": f"Both complaints are registered against institution permanent ID '{case_a.get('institution_id')}'.",
                "evidence_extract": f"Institution: {inst_name} (ID: {case_a.get('institution_id')})",
                "verification_action": "Confirmed identical institution record in AICTE database."
            })

            # B. Cross-Bureau Jurisdiction Nexus
            if is_cross_bureau:
                score += 0.15
                key_signals.append(f"Cross-Bureau Concurrent Proceedings ({case_a.get('bureau')} vs {case_b.get('bureau')})")
                reasons.append({
                    "id": f"sig-bur-{case_a['case_id']}-{case_b['case_id']}",
                    "signal_name": "Cross-Bureau Activity Correlation",
                    "category": "Inter-Cell Nexus",
                    "score": 85.0,
                    "weight": "Jurisdictional Nexus",
                    "description": f"Proceedings are lodged concurrently across '{case_a.get('bureau')}' and '{case_b.get('bureau')}'.",
                    "evidence_extract": f"Bureau A: {case_a.get('bureau')} | Bureau B: {case_b.get('bureau')}",
                    "verification_action": "Coordinate findings between handling officers across respective bureaus."
                })

            # C. Domain Taxonomy & Canonical Concept Signals
            if issue_sim.is_same_concept:
                score += 0.30
                concept_names = ", ".join(issue_sim.shared_concept_names)
                key_signals.append(f"Shared Canonical Issue: {concept_names}")
                reasons.append({
                    "id": f"sig-tax-{case_a['case_id']}-{case_b['case_id']}",
                    "signal_name": "Canonical Regulatory Concept Alignment",
                    "category": "Regulatory Taxonomy",
                    "score": 95.0,
                    "weight": "Taxonomy Core",
                    "description": f"Both cases represent the canonical concept '{concept_names}' despite phrasing differences.",
                    "evidence_extract": f"Concepts: {', '.join(issue_sim.shared_concept_ids)}",
                    "verification_action": "Verify if complaints arise from the same institutional policy or incident."
                })
            elif issue_sim.is_cross_category_nexus and issue_sim.systemic_nexus:
                score += 0.25
                nexus = issue_sim.systemic_nexus
                key_signals.append(f"Cross-Category Systemic Nexus: {nexus.nexus_name}")
                reasons.append({
                    "id": f"sig-nex-{case_a['case_id']}-{case_b['case_id']}",
                    "signal_name": "Systemic Multi-Domain Nexus",
                    "category": "Systemic Nexus",
                    "score": 88.0,
                    "weight": "Regulatory Nexus",
                    "description": f"{nexus.nexus_name}: {nexus.rationale}",
                    "evidence_extract": f"Nexus Rule: {nexus.nexus_id}",
                    "verification_action": "Joint financial/operational audit recommended across both bureaus."
                })
            elif len(issue_sim.shared_subcategories) > 0:
                score += 0.12
                sub_names = ", ".join(issue_sim.shared_subcategories)
                key_signals.append(f"Aligned Subcategory: {sub_names}")
            elif issue_sim.is_same_parent_category:
                # Same broad category alone is weak evidence
                score += 0.05

            # D. Action-History Corroboration Signal
            if has_corroborating_action:
                score += 0.15
                key_signals.append(f"Action History Corroboration: {corroborating_action_note}")
                reasons.append({
                    "id": f"sig-act-{case_a['case_id']}-{case_b['case_id']}",
                    "signal_name": "Action History & Investigation Corroboration",
                    "category": "Procedural Evidence",
                    "score": 92.0,
                    "weight": "Investigative Findings",
                    "description": f"Recorded procedural actions corroborate the relationship: {corroborating_action_note}.",
                    "evidence_extract": f"Action A: {act_a[:80]} | Action B: {act_b[:80]}",
                    "verification_action": "Examine seized inspection logs and inquiry testimony."
                })

            # E. Lexical Narrative Token Bonus
            if shared_tokens:
                token_bonus = min(0.20, len(shared_tokens) * 0.04 + jaccard * 0.10)
                score += token_bonus
                sample_tokens = ", ".join(shared_tokens[:5])
                key_signals.append(f"Correlated Narrative Keywords: {sample_tokens}")
                reasons.append({
                    "id": f"sig-kw-{case_a['case_id']}-{case_b['case_id']}",
                    "signal_name": "Textual Narrative Convergence",
                    "category": "Semantic Correlation",
                    "score": round(min(98.0, 50.0 + len(shared_tokens) * 10), 1),
                    "weight": "Grievance Content",
                    "description": f"Narrative descriptions share relevant grievance terminology ({sample_tokens}).",
                    "evidence_extract": f"Shared Keywords: {sample_tokens}",
                    "verification_action": "Evaluate whether complaints represent isolated or systemic grievances."
                })

            # F. Contradiction & Incident Attenuation Penalty
            if has_contradiction:
                score = min(score - 0.40, 0.45)
                key_signals.append("Contradictory / Distinct Incident Evidence Detected")

            # G. Disparate Domain Suppression:
            # Suppress score below 0.50 if cases share no concepts, no systemic nexus,
            # no subcategories, AND lack substantive narrative topical evidence.
            has_topical_evidence = (len(shared_tokens) >= 2) or (len(shared_tokens) >= 1 and jaccard >= 0.15)
            if not issue_sim.is_same_concept and not issue_sim.is_cross_category_nexus and len(issue_sim.shared_subcategories) == 0:
                if not has_topical_evidence:
                    score = min(score, 0.45)

            # -----------------------------------------------------------------
            # 7. Candidate Match Threshold & Decision Support Output
            # -----------------------------------------------------------------
            if score >= 0.50:
                final_score = min(0.99, max(0.50, round(score, 2)))
                match_percentage = int(round(final_score * 100))

                overlap_id = derive_stable_overlap_id(case_a["case_id"], case_b["case_id"])
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")

                # Relationship assessment description
                if has_corroborating_action or (issue_sim.is_same_concept and (temporal_gap_days is None or temporal_gap_days < 180)):
                    incident_assessment = "Likely Same Incident / Connected Misconduct"
                elif issue_sim.is_cross_category_nexus:
                    incident_assessment = "Systemic Cross-Domain Nexus"
                else:
                    incident_assessment = "Related Issue / Review Required for Incident Confirmation"

                summary = (
                    f"Cross-bureau correlation ({match_percentage}%) detected between {case_a.get('bureau')} "
                    f"({case_a['case_id']}) and {case_b.get('bureau')} ({case_b['case_id']}). "
                    f"{issue_sim.summary_explanation}"
                )

                review_recommendation = (
                    "Authorised official verification required. Original complaint files and action logs "
                    "remain intact and unmerged."
                )

                overlaps.append({
                    "id": overlap_id,
                    "overlap_id": overlap_id,
                    "primary_case_id": case_a["case_id"],
                    "secondary_case_id": case_b["case_id"],
                    "case_a_id": case_a["case_id"],
                    "case_b_id": case_b["case_id"],
                    "institution_id": case_a.get("institution_id"),
                    "institution_name": inst_name,
                    "institution_region": case_a.get("region"),
                    "case_a_bureau": case_a.get("bureau"),
                    "case_b_bureau": case_b.get("bureau"),
                    "case_a_status": case_a.get("status"),
                    "case_b_status": case_b.get("status"),
                    "similarity_score": final_score,
                    "match_score": match_percentage,
                    "overlap_reason": summary,
                    "summary": summary,
                    "key_signals": key_signals,
                    "match_reasons": reasons,
                    "counter_evidence": counter_evidence,
                    "issue_similarity": {
                        "score": issue_sim.issue_similarity_score,
                        "shared_concepts": issue_sim.shared_concept_names,
                        "shared_parent_categories": issue_sim.shared_parent_categories,
                        "systemic_nexus": issue_sim.systemic_nexus.nexus_name if issue_sim.systemic_nexus else None,
                    },
                    "incident_relationship": incident_assessment,
                    "review_recommendation": review_recommendation,
                    "status": "Pending Review",
                    "detected_date": now_iso,
                    "last_updated": now_iso,
                    "taxonomy_version": TAXONOMY_VERSION,
                })

    overlaps.sort(key=lambda o: (o["match_score"], o["id"]), reverse=True)
    return overlaps
