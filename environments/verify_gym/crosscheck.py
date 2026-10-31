"""crosscheck.py: send answers to the second decider (check.js, JavaScript BigInt) and compare field by field.

Repository-side, not in the wheel: it needs node. The JSON extraction from a reply is the Python layer's (the
format is the environment's, not the arithmetic's); everything from the endpoint TEXT on, reading, reducing,
the size limit, both sides, the decimals and the progress, is decided again by check.js with no shared code.
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
FIELDS = ("verdict", "sides", "decimals", "progress")


def item(iid, row, lo, hi):
    return {"id": iid, "family": row["family"], "inst": row["instance"], "lo": lo, "hi": hi,
            "limit_digits": row["limit_digits"], "cap": row["cap"], "d0": row["d0"]}


def js(items):
    """{id: result} from check.js, and the families it decides."""
    p = subprocess.run(["node", os.path.join(HERE, "check.js")], input=json.dumps({"items": items}),
                       capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("check.js failed: " + p.stderr[-500:])
    out = json.loads(p.stdout)
    return out["results"], out["families"]


def compare(py, items):
    """py: {id: the Python grade}. Returns (compared, [disagreements]). A parse failure on the Python side is
    compared too: check.js must also find the endpoint texts unreadable or the bracket malformed."""
    res, _ = js(items)
    bad = []
    for it in items:
        a, b = py[it["id"]], res.get(it["id"])
        if b is None or any(a[f] != b[f] for f in FIELDS):
            bad.append({"id": it["id"], "python": {f: a[f] for f in FIELDS}, "js": b})
    return len(items), bad
