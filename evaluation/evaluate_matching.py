"""
AICTE Case Intelligence — Matching & Evaluation Benchmark Harness.
Compares the Baseline Matcher vs Taxonomy-Enhanced Matcher across the
35-pair curated ground-truth benchmark (held_out_test and dev_calibration).

Calculates:
- Precision, Recall, F1-Score, and Accuracy on binary-labelled pairs
- False Positives and False Negatives breakdown by evaluation bucket
- Separate accounting for 'Further Review Required' ambiguous pairs
- Side-by-side comparative performance matrix
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.matching import baseline_detect_overlaps, detect_overlaps


def load_benchmark(path: Path) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_matcher(
    matcher_fn,
    pairs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates a matcher function on a list of benchmark pairs.
    Separates binary-labelled pairs from ambiguous pairs.
    """
    tp = 0
    fp = 0
    tn = 0
    fn = 0

    bucket_stats: Dict[str, Dict[str, int]] = {}
    ambiguous_results: List[Dict[str, Any]] = []

    for pair in pairs:
        pair_id = pair["pair_id"]
        bucket = pair["bucket"]
        gt_label = pair["ground_truth_label"]
        case_a = pair["case_a"]
        case_b = pair["case_b"]

        if bucket not in bucket_stats:
            bucket_stats[bucket] = {"total": 0, "tp": 0, "fp": 0, "tn": 0, "fn": 0, "flagged": 0}
        bucket_stats[bucket]["total"] += 1

        # Run matcher
        results = matcher_fn([case_a, case_b])
        is_matched = len(results) > 0
        match_score = results[0]["similarity_score"] if is_matched else 0.0

        if is_matched:
            bucket_stats[bucket]["flagged"] += 1

        if gt_label == "Related":
            if is_matched:
                tp += 1
                bucket_stats[bucket]["tp"] += 1
            else:
                fn += 1
                bucket_stats[bucket]["fn"] += 1
        elif gt_label == "Not Related":
            if is_matched:
                fp += 1
                bucket_stats[bucket]["fp"] += 1
            else:
                tn += 1
                bucket_stats[bucket]["tn"] += 1
        elif gt_label == "Further Review Required":
            ambiguous_results.append({
                "pair_id": pair_id,
                "is_flagged": is_matched,
                "score": match_score,
                "rationale": pair["rationale"]
            })

    total_binary = tp + fp + tn + fn
    precision = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    accuracy = ((tp + tn) / total_binary) if total_binary > 0 else 0.0

    return {
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "total_binary": total_binary,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "bucket_stats": bucket_stats,
        "ambiguous_results": ambiguous_results
    }


def print_comparison_report(
    benchmark_data: Dict[str, Any],
    baseline_metrics: Dict[str, Any],
    enhanced_metrics: Dict[str, Any],
    split_name: str
):
    print("=" * 80)
    print(f"AICTE CASE INTELLIGENCE — EVALUATION REPORT ({split_name.upper()})")
    print(f"Benchmark Version: {benchmark_data.get('benchmark_version')} | Total Binary Pairs: {baseline_metrics['total_binary']}")
    print("=" * 80)

    # 1. High-Level Metrics Comparison
    print("\n--- 1. OVERALL METRICS COMPARISON (BINARY-LABELLED PAIRS) ---")
    headers = f"{'Metric':<22} | {'Baseline (Lexical)':<22} | {'Enhanced (Taxonomy)':<22} | {'Improvement':<12}"
    print(headers)
    print("-" * len(headers))

    metrics_rows = [
        ("Precision", f"{baseline_metrics['precision']:.1%}", f"{enhanced_metrics['precision']:.1%}", f"{enhanced_metrics['precision'] - baseline_metrics['precision']:+.1%}"),
        ("Recall", f"{baseline_metrics['recall']:.1%}", f"{enhanced_metrics['recall']:.1%}", f"{enhanced_metrics['recall'] - baseline_metrics['recall']:+.1%}"),
        ("F1-Score", f"{baseline_metrics['f1']:.1%}", f"{enhanced_metrics['f1']:.1%}", f"{enhanced_metrics['f1'] - baseline_metrics['f1']:+.1%}"),
        ("Accuracy", f"{baseline_metrics['accuracy']:.1%}", f"{enhanced_metrics['accuracy']:.1%}", f"{enhanced_metrics['accuracy'] - baseline_metrics['accuracy']:+.1%}"),
        ("True Positives (TP)", f"{baseline_metrics['tp']}", f"{enhanced_metrics['tp']}", f"{enhanced_metrics['tp'] - baseline_metrics['tp']:+d}"),
        ("False Positives (FP)", f"{baseline_metrics['fp']}", f"{enhanced_metrics['fp']}", f"{enhanced_metrics['fp'] - baseline_metrics['fp']:+d}"),
        ("True Negatives (TN)", f"{baseline_metrics['tn']}", f"{enhanced_metrics['tn']}", f"{enhanced_metrics['tn'] - baseline_metrics['tn']:+d}"),
        ("False Negatives (FN)", f"{baseline_metrics['fn']}", f"{enhanced_metrics['fn']}", f"{enhanced_metrics['fn'] - baseline_metrics['fn']:+d}"),
    ]

    for label, base_v, enh_v, diff in metrics_rows:
        print(f"{label:<22} | {base_v:<22} | {enh_v:<22} | {diff:<12}")

    # 2. Bucket-by-Bucket Breakdown
    print("\n--- 2. PERFORMANCE BREAKDOWN BY CASE-PAIR BUCKET ---")
    b_header = f"{'Bucket Name':<38} | {'N':<4} | {'Baseline (TP/FP)':<18} | {'Enhanced (TP/FP)':<18}"
    print(b_header)
    print("-" * len(b_header))

    all_buckets = sorted(list(set(list(baseline_metrics["bucket_stats"].keys()) + list(enhanced_metrics["bucket_stats"].keys()))))
    for b in all_buckets:
        if b == "borderline_ambiguous":
            continue
        base_b = baseline_metrics["bucket_stats"].get(b, {})
        enh_b = enhanced_metrics["bucket_stats"].get(b, {})
        n = base_b.get("total", 0)

        base_res = f"TP:{base_b.get('tp',0)} FP:{base_b.get('fp',0)} FN:{base_b.get('fn',0)}"
        enh_res = f"TP:{enh_b.get('tp',0)} FP:{enh_b.get('fp',0)} FN:{enh_b.get('fn',0)}"
        print(f"{b:<38} | {n:<4} | {base_res:<18} | {enh_res:<18}")

    # 3. Ambiguous / Further Review Required Cases
    print("\n--- 3. BORDERLINE & AMBIGUOUS CASES (FURTHER REVIEW REQUIRED) ---")
    print(f"Total Ambiguous Cases Evaluated: {len(enhanced_metrics['ambiguous_results'])}")
    for item in enhanced_metrics["ambiguous_results"]:
        flag_status = "FLAGGED FOR REVIEW (>= 0.50)" if item["is_flagged"] else "HELD BELOW CANDIDATE THRESHOLD (< 0.50)"
        print(f"  [{item['pair_id']}] Score: {item['score']:.2f} -> {flag_status}")
        print(f"       Rationale: {item['rationale']}")

    print("=" * 80)


def main():
    benchmark_path = Path("evaluation/ground_truth_benchmark.json")
    if not benchmark_path.exists():
        print(f"Error: {benchmark_path} does not exist. Run generate_benchmark.py first.")
        sys.exit(1)

    data = load_benchmark(benchmark_path)
    all_pairs = data["pairs"]

    # 1. Evaluate on HELD-OUT TEST split (25 pairs)
    held_out_pairs = [p for p in all_pairs if p["split"] == "held_out_test"]
    base_held_out = evaluate_matcher(baseline_detect_overlaps, held_out_pairs)
    enh_held_out = evaluate_matcher(detect_overlaps, held_out_pairs)
    print_comparison_report(data, base_held_out, enh_held_out, "Held-Out Test Split (N=25)")

    # 2. Evaluate on ALL pairs (35 pairs)
    base_all = evaluate_matcher(baseline_detect_overlaps, all_pairs)
    enh_all = evaluate_matcher(detect_overlaps, all_pairs)
    print_comparison_report(data, base_all, enh_all, "All Benchmark Pairs (N=35)")


if __name__ == "__main__":
    main()
