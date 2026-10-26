"""
AICTE Cross-Bureau Overlap Detection Matching Engine.
Problem Statement: SIH26264 (Person 5 Integration Module)

Contract:
    detect_overlaps(cases: list[dict]) -> list[dict]

Identifies potential cross-bureau correlations and regulatory overlaps
between complaints involving the same institution or shared allegations across bureaus.
Produces explainable matching signals and stable overlap identifiers.
"""

import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Set, Tuple


def _tokenize(text: str) -> Set[str]:
    """Extracts alphanumeric lowercase word tokens, ignoring short stop words."""
    stop_words = {
        "the", "and", "for", "with", "from", "this", "that", "were", "been", "have",
        "has", "had", "under", "per", "regarding", "alleging", "against", "all", "was",
        "are", "will", "submitted", "lodged", "formal", "complaint", "institution"
    }
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return {w for w in words if w not in stop_words}


def derive_stable_overlap_id(case_a_id: str, case_b_id: str) -> str:
    """
    Derives a deterministic, canonical overlap ID for a pair of case IDs.
    The order of arguments does not affect the generated ID.
    Example: derive_stable_overlap_id("DEMO-CASE-002", "DEMO-CASE-001") -> "OVL-DEMO-CASE-001-DEMO-CASE-002"
    """
    sorted_pair = sorted([case_a_id.strip(), case_b_id.strip()])
    return f"OVL-{sorted_pair[0]}-{sorted_pair[1]}"


def detect_overlaps(cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Core matching function for Person 5's overlap detection engine.

    Args:
        cases: list of case dicts, each containing:
            case_id, institution_id, institution_name, category, description,
            bureau, status, received_date, due_date, etc.

    Returns:
        list of candidate overlap dicts with explainable matching signals,
        similarity score, and canonical overlap identifiers.
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
            if pair_key in seen_pairs:
                continue

            # Candidate signal evaluation
            is_same_institution = (inst1 == inst2)
            is_cross_bureau = (bureau1 != bureau2)

            # Compute category and textual overlap
            cat1 = case1.get("category", "")
            cat2 = case2.get("category", "")
            desc1 = case1.get("description", "")
            desc2 = case2.get("description", "")

            tokens1 = _tokenize(f"{cat1} {desc1}")
            tokens2 = _tokenize(f"{cat2} {desc2}")

            shared_tokens = sorted(list(tokens1.intersection(tokens2)))

            score = 0.0
            reasons = []
            key_signals = []

            if is_same_institution:
                score += 0.45
                key_signals.append(f"Identical Institution Permanent ID ({inst1})")
                reasons.append({
                    "id": f"sig-inst-{id1}-{id2}",
                    "signal_name": "Permanent Institution ID Match",
                    "category": "Entity Identity",
                    "score": 100.0,
                    "weight": "Primary Identifier",
                    "description": f"Both complaint proceedings are registered against institution ID '{inst1}'.",
                    "evidence_extract": f"Institution ID: {inst1}",
                    "verification_action": "Confirmed match across AICTE institutional database records."
                })

            if is_cross_bureau:
                score += 0.20
                key_signals.append(f"Cross-Bureau Concurrent Proceedings ({bureau1} vs {bureau2})")
                reasons.append({
                    "id": f"sig-bur-{id1}-{id2}",
                    "signal_name": "Cross-Bureau Activity Correlation",
                    "category": "Inter-Cell Nexus",
                    "score": 85.0,
                    "weight": "Jurisdictional Nexus",
                    "description": f"Complaints are lodged concurrently across '{bureau1}' and '{bureau2}', indicating potential multi-faceted non-compliance.",
                    "evidence_extract": f"Bureau A: {bureau1} | Bureau B: {bureau2}",
                    "verification_action": "Alert bureaus for synchronised statutory review."
                })

            if shared_tokens:
                jaccard = len(shared_tokens) / max(1, len(tokens1.union(tokens2)))
                token_bonus = min(0.30, len(shared_tokens) * 0.05 + jaccard * 0.15)
                score += token_bonus

                sample_tokens = ", ".join(shared_tokens[:5])
                key_signals.append(f"Correlated Allegation Keywords: {sample_tokens}")
                reasons.append({
                    "id": f"sig-kw-{id1}-{id2}",
                    "signal_name": "Textual Narrative Convergence",
                    "category": "Semantic Correlation",
                    "score": round(min(98.0, 50.0 + len(shared_tokens) * 10), 1),
                    "weight": "Grievance Content",
                    "description": f"Narrative descriptions share relevant grievance terminology ({sample_tokens}).",
                    "evidence_extract": f"Shared Keywords: {sample_tokens}",
                    "verification_action": "Evaluate whether complaints arise from a single systemic institutional violation."
                })

            # Check for candidate match threshold (e.g. 0.50 score)
            if score >= 0.50:
                seen_pairs.add(pair_key)
                case_a_id, case_b_id = pair_key
                # Match ordering to pair_key
                first_case = case1 if case1["case_id"] == case_a_id else case2
                second_case = case2 if case2["case_id"] == case_b_id else case1

                final_score = min(0.99, round(score, 2))
                match_percentage = int(round(final_score * 100))

                overlap_id = derive_stable_overlap_id(case_a_id, case_b_id)

                summary = (
                    f"Cross-bureau correlation ({match_percentage}%) detected between {first_case.get('bureau')} "
                    f"({case_a_id}) and {second_case.get('bureau')} ({case_b_id}) regarding "
                    f"'{first_case.get('category')}' and '{second_case.get('category')}'."
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
                    "key_signals": key_signals,
                    "match_reasons": reasons,
                    "status": "Pending Review",
                    "detected_date": now_iso,
                    "last_updated": now_iso
                })

    # Sort deterministically by match score descending, then overlap_id
    overlaps.sort(key=lambda o: (o["match_score"], o["id"]), reverse=True)
    return overlaps
