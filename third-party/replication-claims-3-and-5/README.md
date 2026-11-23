# Third-party replication of claims #3 and #5

**Status:** Independent replication. Exact rational arithmetic on the stored witness, tolereance read from each claim.

## Claims

- #3: the entry `AlphaEvolve` of `ypwang61/ThetaEvolve@7c12898` `Results/CirclePacking/data.json`. 26 circles in the closed unit square, no overlaps at zero tolerance, radii sum rounds to `2.63586276`.
- #5: the entry `8B-w_RL@65` of the same file. Radii sum rounds to `2.6359857` with overlap tolerance `1e-6`.

The file hash recomputes to `c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8`, the value stated in both issues.

## Result

| Claim | Radii sum | Overlap | Containment at zero tolerance | Verdict at claim tolerance |
| --- | --- | --- | --- | --- |
| #3 `AlphaEvolve` | 2.63586276 (exact `189933928441351991/72057594037927936`) | 0 violations, smallest gap 2.375e-09 | inside, worst margin 7.852e-09 | PASS |
| #5 `8B-w_RL@65` | 2.6359857 (exact `189942784667495741/72057594037927936`) | max penetration 1.004e-07 | **one circle outside by 1.293e-12** | PASS at 1e-6 |

## The one discrepancy worth recording

The `8B-w_RL@65` witness is not inside the closed square at zero tolerance. One circle exceeds the boundary by `46605/36028797018963968` = 1.293e-12, which is a last-bit quantity of the stored doubles. Under the 1e-6 tolerance the claim carries, this changes nothing, and the radii sum matches the printed digits. A reader who wants a packing inside the closed square at zero tolerance should use the `8B-w_RL@65-Formal` entry instead, which this desk decided in issue #7.

## Method

The file stores two shapes, a list of 26 `(x, y, r)` triples and a pair of lists. Both are normalized to triples. Every stored decimal is read as the exact rational value of its IEEE-754 double, and containment, the 325 pair gaps, and the radii sum are then decided with `Fraction` arithmetic. The verdict records both the zero-tolerance and the claim-tolerance containment readings so the two do not get merged.

## Reproduce

```bash
curl -O https://raw.githubusercontent.com/ypwang61/ThetaEvolve/7c12898/Results/CirclePacking/data.json
python3 verify_two.py
```

`verdict.json` in this directory is the output of that run.
