"""Independent replication of cert-machine claims #3 and #5.

Reads entries from ThetaEvolve Results/CirclePacking/data.json (sha256 pinned) and
decides each claim in exact rational arithmetic on the stored IEEE-754 doubles.

The file stores two shapes: a list of 26 (x, y, r) triples, or a pair of lists
(26 centers, 26 radii). Both are normalized here.

#3 entry AlphaEvolve: 26 circles in the closed unit square, no overlaps at zero
tolerance, radii sum rounds to 2.63586276.
#5 entry 8B-w_RL@65: radii sum rounds to 2.6359857 with overlap tolerance 1e-6,
read here as max over pairs of the penetration excess (r_i + r_j)^2 - d^2 <= 1e-6.
"""
import hashlib
import json
from fractions import Fraction as F
from itertools import combinations
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data.json"
EXPECTED = "c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8"


def normalize(entry):
    payload = entry["list"]
    if len(payload) == 2 and all(isinstance(part, list) and len(part) == 26 for part in payload):
        centers, radii = payload[0], payload[1]
        return [(c[0], c[1], radii[i]) for i, c in enumerate(centers)]
    return [(item[0], item[1], item[2]) for item in payload]


def decide(entry, claim, decimals, tolerance):
    circles = normalize(entry)
    n = len(circles)
    cx = [F(c[0]) for c in circles]
    cy = [F(c[1]) for c in circles]
    r = [F(c[2]) for c in circles]

    inside = all(
        cx[i] - r[i] >= 0 and cx[i] + r[i] <= 1 and cy[i] - r[i] >= 0 and cy[i] + r[i] <= 1
        for i in range(n)
    )
    worst_margin = min(
        min(cx[i] - r[i], 1 - (cx[i] + r[i]), cy[i] - r[i], 1 - (cy[i] + r[i]))
        for i in range(n)
    )

    worst_penetration = F(0)
    min_gap = None
    for i, j in combinations(range(n), 2):
        dx, dy = cx[i] - cx[j], cy[i] - cy[j]
        d2 = dx * dx + dy * dy
        gap = d2 - (r[i] + r[j]) ** 2
        min_gap = gap if min_gap is None else min(min_gap, gap)
        worst_penetration = max(worst_penetration, -gap)

    total = sum(r)
    shown = f"{float(total):.{decimals}f}"
    containment_at_tolerance = worst_margin >= -F(tolerance)
    passed = containment_at_tolerance and worst_penetration <= F(tolerance) and shown == claim
    return {
        "entry": entry["name"],
        "n_circles": n,
        "inside_zero_tolerance": inside,
        "inside_at_claim_tolerance": containment_at_tolerance,
        "worst_margin_exact": str(worst_margin),
        "worst_margin_float": float(worst_margin),
        "worst_penetration_squared_exact": str(worst_penetration),
        "worst_penetration_squared_float": float(worst_penetration),
        "smallest_gap_squared_float": float(min_gap),
        "sum_exact": str(total),
        "sum_shown": shown,
        "claim": claim,
        "tolerance_applied": str(F(tolerance)),
        "verdict": "PASS" if passed else "FAIL",
    }


def main():
    raw = DATA.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw)
    by_name = {e["name"]: e for e in data}
    out = {
        "witness": {"sha256": digest, "matches_published": digest == EXPECTED},
        "claims": [
            decide(by_name["AlphaEvolve"], "2.63586276", 8, 0),
            decide(by_name["8B-w_RL@65"], "2.6359857", 7, F(1, 10**6)),
        ],
    }
    (Path(__file__).resolve().parent / "verdict.json").write_text(
        json.dumps(out, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
