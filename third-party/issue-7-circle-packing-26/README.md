# Third-party recheck: 26 circles in the unit square

**Status:** Independent recheck. Exact rational arithmetic on the stored witness, zero tolerance, code that shares nothing with the claimant.

## Claim under test

Issue #7 of this desk asks for a decision on a packing of 26 non-overlapping circles inside the closed unit square whose radii sum to `2.63598308`. The witness is the entry `8B-w_RL@65-Formal` in `Results/CirclePacking/data.json` of `ypwang61/ThetaEvolve` at commit `7c12898`, with `sha256 = c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8`.

## Verdict

**PASS.** All four checks hold in exact arithmetic, with no tolerance applied anywhere.

| Check | Result | Exact quantity |
| --- | --- | --- |
| Circle count | 26 centers, 26 radii | 26 |
| Inside the closed unit square | every circle inside | worst margin `22346689/72057594037927936` (3.101e-10) |
| Pairwise non-overlap, zero tolerance | 0 violations over 325 pairs | smallest exact gap `2573821953147952160727/5192296858534827628530496329220096` (4.957e-13) |
| Radius sum to 8 decimals | 2.63598308 | exact `23742824810160135/9007199254740992`, difference to the claim -2.612e-09 |

The witness byte hash matches the value published in the issue, so the object being checked is the object named.

## Method

Each stored decimal is read as the exact rational value of its IEEE-754 double. Comparisons then run in `Fraction` arithmetic, so a PASS or a refutation at this precision is decided, not estimated. The overlap test compares `dx^2 + dy^2` against `(r_i + r_j)^2` for all 325 pairs with no epsilon.

## What this covers

The stored witness, at the precision its doubles encode, is a genuine packing of 26 circles inside the closed square, and its radius sum rounds to the printed claim at 8 decimals.

## What this leaves open

Precision finer than the stored doubles is outside the record, and a sum correct to 8 decimals is an exhibit rather than a statement about optimality. A tighter claim needs a witness stored at higher precision.

## Reproduce

```bash
python3 verify_circles.py
```

The script fetches the witness from the pinned commit when no local copy is present, verifies the byte hash against the published value, prints the four checks, and writes `verdict.json`. A local file can be passed as the first argument.
