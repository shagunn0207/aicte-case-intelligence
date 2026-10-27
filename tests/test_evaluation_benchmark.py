"""
Automated Regression Test for the 35-Pair Evaluation Benchmark.
Ensures that:
1. Benchmark JSON loads and conforms to schema with valid ground-truth labels and splits.
2. The enhanced matcher achieves >= 85% precision, recall, and F1 on held-out test split.
3. Hard negative pairs (same institution, different incidents) produce zero false positives.
4. Ambiguous cases are handled separately without leaking into binary accuracy.
"""

import json
from pathlib import Path
import pytest

from backend.matching import baseline_detect_overlaps, detect_overlaps
from evaluation.evaluate_matching import evaluate_matcher, load_benchmark


BENCHMARK_PATH = Path("evaluation/ground_truth_benchmark.json")


def test_benchmark_file_exists_and_valid():
    assert BENCHMARK_PATH.exists()
    data = load_benchmark(BENCHMARK_PATH)
    assert data["total_pairs"] == 35
    assert data["split_summary"]["held_out_test"] >= 20
    assert data["split_summary"]["dev_calibration"] >= 10


def test_enhanced_matcher_outperforms_baseline_on_held_out():
    data = load_benchmark(BENCHMARK_PATH)
    held_out_pairs = [p for p in data["pairs"] if p["split"] == "held_out_test"]

    base = evaluate_matcher(baseline_detect_overlaps, held_out_pairs)
    enh = evaluate_matcher(detect_overlaps, held_out_pairs)

    # Ensure enhanced matcher beats baseline
    assert enh["f1"] > base["f1"]
    assert enh["precision"] >= 0.85
    assert enh["recall"] >= 0.85
    assert enh["fp"] == 0, "No false positives on held-out test pairs"


def test_hard_negatives_suppressed():
    data = load_benchmark(BENCHMARK_PATH)
    hard_negatives = [
        p for p in data["pairs"]
        if p["bucket"] == "same_inst_same_category_hard_negative"
    ]
    assert len(hard_negatives) >= 4
    enh = evaluate_matcher(detect_overlaps, hard_negatives)
    assert enh["fp"] == 0, "Hard negative pairs at same institution must not produce matches"


def test_ambiguous_pairs_isolated():
    data = load_benchmark(BENCHMARK_PATH)
    ambiguous = [
        p for p in data["pairs"]
        if p["ground_truth_label"] == "Further Review Required"
    ]
    assert len(ambiguous) == 3
    enh = evaluate_matcher(detect_overlaps, ambiguous)
    # Binary counts should be 0 because ambiguous pairs are accounted separately
    assert enh["tp"] == 0
    assert enh["fp"] == 0
    assert len(enh["ambiguous_results"]) == 3
