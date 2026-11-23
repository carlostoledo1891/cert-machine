"""Exact verification of a 26-circle packing claim (cert-machine issue #7).

Reads the witness entry from ThetaEvolve Results/CirclePacking/data.json and checks,
in exact rational arithmetic (Fraction of the stored IEEE-754 double, so no
rounding error is introduced):
  1. there are 26 circles;
  2. every circle is inside the closed unit square [0,1]^2;
  3. no two circles overlap, with zero tolerance: d(i,j)^2 >= (r_i + r_j)^2 exactly;
  4. the sum of radii, printed to 8 decimals, equals the claim 2.63598308.
"""
import hashlib
import json
import os
import sys
from fractions import Fraction as F
from itertools import combinations

WITNESS_URL = (
    "https://raw.githubusercontent.com/ypwang61/ThetaEvolve/7c12898"
    "/Results/CirclePacking/data.json"
)
PATH = sys.argv[1] if len(sys.argv) > 1 else "data.json"
ENTRY = "8B-w_RL@65-Formal"
CLAIM = "2.63598308"
EXPECTED_SHA256 = (
    "c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8"
)


def frac(value):
    return F(value)  # exact value of the stored double


def load_bytes(path: str) -> bytes:
    if path == "data.json" and not os.path.exists(path):
        from urllib.request import urlopen

        return urlopen(WITNESS_URL, timeout=30).read()
    with open(path, "rb") as handle:
        return handle.read()


def main() -> int:
    raw = load_bytes(PATH)
    digest = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw)
    entry = next(e for e in data if e["name"] == ENTRY)
    centers, radii = entry["list"][0], entry["list"][1]
    n = len(centers)
    if not n == len(radii) == 26:
        print(f"expected 26 circles, got {n}/{len(radii)}")
        return 1

    cx = [frac(point[0]) for point in centers]
    cy = [frac(point[1]) for point in centers]
    r = [frac(value) for value in radii]

    inside = [
        (
            cx[i] - r[i] >= 0,
            cx[i] + r[i] <= 1,
            cy[i] - r[i] >= 0,
            cy[i] + r[i] <= 1,
        )
        for i in range(n)
    ]
    worst_margin = min(
        min(cx[i] - r[i], 1 - (cx[i] + r[i]), cy[i] - r[i], 1 - (cy[i] + r[i]))
        for i in range(n)
    )

    overlaps = []
    min_gap = None
    for i, j in combinations(range(n), 2):
        dx, dy = cx[i] - cx[j], cy[i] - cy[j]
        gap = dx * dx + dy * dy - (r[i] + r[j]) ** 2
        if gap < 0:
            overlaps.append((i, j, float(gap)))
        min_gap = gap if min_gap is None else min(min_gap, gap)

    total = sum(r)
    total_str = f"{float(total):.8f}"

    passed = all(all(flags) for flags in inside) and not overlaps
    passed = passed and total_str == CLAIM
    report = {
        "witness": {
            "file": PATH,
            "sha256": digest,
            "entry": ENTRY,
            "matches_expected_sha256": digest == EXPECTED_SHA256,
        },
        "n_circles": n,
        "unit_square": {
            "all_inside": all(all(flags) for flags in inside),
            "worst_margin_exact": str(worst_margin),
            "worst_margin_float": float(worst_margin),
        },
        "non_overlap_zero_tolerance": {
            "violations": len(overlaps),
            "first_violations": [
                {"i": i, "j": j, "gap": gap} for i, j, gap in overlaps[:5]
            ],
            "smallest_exact_gap": str(min_gap),
            "smallest_gap_float": float(min_gap),
        },
        "sum_of_radii": {
            "exact": str(total),
            "to_8dp": total_str,
            "claim": CLAIM,
            "difference_float": float(total) - float(CLAIM),
        },
        "verdict": "PASS" if passed else "FAIL",
    }
    with open("verdict.json", "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
