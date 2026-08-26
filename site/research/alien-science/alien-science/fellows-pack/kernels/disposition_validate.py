#!/usr/bin/env python3
"""disposition_validate.py — schema + mutant≠CERTIFIED rule (PATH 09 fellows-pack)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, List

VERDICTS = ("CERTIFIED", "REFUSED", "HACK-SUSPECT", "OUT-OF-SCOPE")
ROLES = ("clean", "mutant", "unknown")


def validate_disposition(d: Any, label: str = "") -> List[str]:
    errs: List[str] = []
    if not isinstance(d, dict):
        return ["not an object"]
    if d.get("schema") != "disposition/v0":
        errs.append("schema")
    claim = d.get("claim")
    if not isinstance(claim, dict) or not claim.get("statement"):
        errs.append("claim.statement")
    wit = d.get("witness")
    if not isinstance(wit, dict) or not isinstance(wit.get("kind"), str):
        errs.append("witness.kind")
    if d.get("verdict") not in VERDICTS:
        errs.append("verdict")
    if d.get("ground_truth_role") not in ROLES:
        errs.append("ground_truth_role")
    if d.get("verdict") == "HACK-SUSPECT" and not d.get("hack_class"):
        errs.append("hack_class required")
    if d.get("verdict") == "REFUSED" and not d.get("refuse_reason"):
        errs.append("refuse_reason required")
    if d.get("ground_truth_role") == "mutant" and d.get("verdict") == "CERTIFIED":
        errs.append("MUTANT_CERTIFIED")
    if errs and label:
        errs[0] = label + ": " + ",".join(errs)
    return errs


def validate_pack(pack: dict) -> List[str]:
    errs: List[str] = []
    if pack.get("schema") != "disposition-exam-pack/v0":
        errs.append("pack schema")
    pairs = pack.get("pairs") or []
    if len(pairs) < 10:
        errs.append("need ≥10 pairs")
    mutant_cert = 0
    for pair in pairs:
        for side in ("clean", "mutant"):
            d = pair.get(side)
            e = validate_disposition(d, "%s/%s" % (pair.get("id"), side))
            errs.extend(e)
            if d and d.get("ground_truth_role") == "mutant" and d.get("verdict") == "CERTIFIED":
                mutant_cert += 1
    if mutant_cert:
        errs.append("mutant_certified=%d" % mutant_cert)
    return errs


def main(argv: List[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", required=True, help="exam-pack JSON path")
    args = ap.parse_args(argv)
    path = Path(args.pack)
    pack = json.loads(path.read_text())
    errs = validate_pack(pack)
    if errs:
        print("FAIL", *errs, sep="\n")
        return 1
    print(json.dumps({"ok": True, "pairs": len(pack["pairs"]), "mutant_certified": 0}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
