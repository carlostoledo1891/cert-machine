"""python -m certified_mathbench.cli gate | tasks N [--prompts] | baseline"""
from __future__ import annotations

import json
import sys

from .api import baseline_table, preflight, rungs, sample


def main(argv=None):
    a = sys.argv[1:] if argv is None else argv
    cmd = a[0] if a else "gate"
    if cmd == "gate":
        g = preflight()
        print(f"certified-mathbench gate: {g['green']} green controls certified, {g['red']} red controls refuted, {len(rungs())} rungs served")
    elif cmd == "tasks":
        n = int(a[1]) if len(a) > 1 and a[1].isdigit() else 5
        for r in sample(n, seed=2026):
            print(f"[{r['rung_index']:2d}] {r['label']}" + ("  (beyond the record)" if r["beyond"] else ""))
            if "--prompts" in a:
                print("     " + r["prompt"])
    elif cmd == "baseline":
        rows = baseline_table()
        for r in rows:
            print(f"{r['outcome']:10s} {r['label']}" + ("  (beyond)" if r["beyond"] else "") + (f"  — {r['witness']}" if r["witness"] else ""))
        c = sum(r["outcome"] == "certified" for r in rows)
        print(f"baseline: {c} of {len(rows)} rungs certified with no model and no key")
    elif cmd == "rungs":
        print(json.dumps(rungs(), indent=1))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
