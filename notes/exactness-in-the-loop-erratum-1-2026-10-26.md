# Exactness in the loop — erratum 1

**2026-10-26, written after the analysis's first and only reading. It changes no definition.** It corrects how
tools/exactness.py computed §6's interval, so that the tool computes what §6 defines: "the exact two-sided 90% interval
for the mean shift, inverting the same test". The protocol (sha256 ac38172e…) and amendment 1 (sha256 7c8eeaa4…) do
not change, and no run is repeated.

## What happened

The first reading (strata/exactness-analysis.first-read.json, kept as written) gave, for the self-checking founder
PM-1, the primary verdict "exactness helps" with the interval [−7.157 × 10⁻⁷, −1.4 × 10⁻¹⁵].

Fifteen of the sixteen differences panel(T repaired) − panel(X) are exactly 0. The sixteenth (exactness-2) is
−4.294 × 10⁻⁶: there, T's champion was false and the repair cost it that much. For these differences, θ = 0 is
accepted by both one-sided sign-flip tests (p = 1 and p = 1/2), and every θ > 0 is rejected. So the exact interval is
[−7.157 × 10⁻⁷, 0]. It contains 0.

The tool computed the interval with tools/analyze2.py's bisection. A bisection keeps its inside point strictly inside,
so it returned the endpoint as −1.4 × 10⁻¹⁵, just below 0, and the verdict table read "below 0". That is the tool's
artifact, not the interval §6 defines.

## The correction

tools/exactness.py now decides the verdict's own thresholds (0, −δ, +δ) exactly. If the test accepts one of them, it
belongs to the interval. tests/test_exactness.py gains a red control for exactly this case (15 zeros and one
−4.294 × 10⁻⁶ must read "equivalent"). Re-read under §6 as written:

- **PM-1 (self-checking):** the interval is [−7.157 × 10⁻⁷, 0], inside ±δ, and the arms gained 0.0082 over the founder
  on average, more than δ. The verdict is **equivalent**.
- **PM-1u (unchecked):** the first reading gave "inconclusive", and so does the corrected one. The interval is
  [−0.00486, +0.00486], wider than ±δ.

Both readings are published. The analysis was run twice: once as frozen, once after this erratum. Nothing else was
re-run or re-read.

## Beyond this measurement

tools/analyze2.py is era 2's analysis and computes its interval the same way. A difference vector with exact zeros at
an endpoint would be misread there too. This was reported to the era 2 session before any era 2 data existed.
