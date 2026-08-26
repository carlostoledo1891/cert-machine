#!/usr/bin/env python3
"""volume_runner.py — PATH 09 Phase-4B/C high-volume dual-lane CLI (Python)."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PACK = HERE.parent
sys.path.insert(0, str(PACK / "kernels"))
sys.path.insert(0, str(HERE))

import swap_consistency as SC  # noqa: E402
from dual_client import disagreement  # noqa: E402


def load_jsonl(path: Path) -> list:
    rows = []
    for i, line in enumerate(path.read_text().splitlines()):
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows


def dispose_row(row: dict, plant: bool) -> dict:
    from fractions import Fraction

    if plant:
        probs = [p[0] for p in row.get("pairs") or [[row["p_orig"], row["p_swap"]]]]
        sample = SC.consistent_sample(probs)
        sample = SC.plant_mutant(sample, 0, Fraction(1, 5))
        return SC.dispose_sample(sample, 0)
    if "pairs" in row:
        return SC.dispose_sample(row["pairs"], 0)
    return SC.dispose_sample([[row["p_orig"], row["p_swap"]]], 0)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", required=True)
    ap.add_argument("--post-pgr", action="store_true")
    ap.add_argument("--plant-mutant", action="store_true")
    ap.add_argument("--predictions")
    ap.add_argument("--summary-out")
    args = ap.parse_args(argv)

    if args.post_pgr and not os.environ.get("W2S_EVAL_URL"):
        print("--post-pgr requires W2S_EVAL_URL (no silent fake remote)", file=sys.stderr)
        return 1
    if args.post_pgr and not args.predictions:
        print("--post-pgr requires --predictions (never invent predictions)", file=sys.stderr)
        return 1

    rows = load_jsonl(Path(args.batch))
    pgr_meta = {"mode": "skipped", "success": True}
    if os.environ.get("LABELED_DATA_REACHABLE") == "1":
        pgr_meta["illegitimate"] = True
        pgr_meta["note"] = "Mode A: labeled_data reachable — PGR lane marked illegitimate"

    if args.post_pgr:
        # Live path: require URL (checked) and real body; do not invent.
        import urllib.request

        body = json.loads(Path(args.predictions).read_text())
        url = os.environ["W2S_EVAL_URL"].rstrip("/") + "/api/evaluate-predictions"
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode())
        pgr_meta = {
            "mode": "live",
            "success": True,
            "remeasured": True,
            "raw": raw,
            "illegitimate": os.environ.get("LABELED_DATA_REACHABLE") == "1",
        }

    certified = refused = mutant_certified = 0
    results = []
    for i, row in enumerate(rows):
        disp = dispose_row(row, args.plant_mutant)
        if disp["verdict"] == "CERTIFIED":
            certified += 1
        else:
            refused += 1
        if args.plant_mutant and disp["verdict"] == "CERTIFIED":
            mutant_certified += 1
        if row.get("ground_truth_role") == "mutant" and disp["verdict"] == "CERTIFIED":
            mutant_certified += 1
        pgr_for_dj = {"mode": pgr_meta["mode"]}
        if row.get("pgr_reported") is not None:
            pgr_for_dj["chat_pgr"] = row["pgr_reported"]
        if pgr_meta.get("raw") and pgr_meta["raw"].get("pgr") is not None:
            pgr_for_dj["pgr"] = pgr_meta["raw"]["pgr"]
        results.append(
            {
                "schema": "volume-result/v0",
                "i": i,
                "id": row.get("id") or ("row-%d" % i),
                "disposition": {
                    "verdict": disp["verdict"],
                    "max_residual": disp.get("witness", {}).get("payload", {}).get("max_residual"),
                    "refuse_reason": disp.get("refuse_reason"),
                },
                "pgr": {"mode": pgr_meta["mode"]},
                "disagreement": disagreement(pgr_for_dj, disp),
            }
        )

    summary = {
        "schema": "volume-summary/v0",
        "n": len(rows),
        "certified": certified,
        "refused": refused,
        "mutant_certified": mutant_certified,
        "pgr": pgr_meta,
        "cost_refuse": {"status": "REFUSED", "re_hillclimb_usd": 18000},
        "batch": args.batch,
    }
    if mutant_certified != 0:
        print(json.dumps(summary, indent=2))
        print("mutant_certified must be 0", file=sys.stderr)
        return 1
    if args.summary_out:
        Path(args.summary_out).write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
