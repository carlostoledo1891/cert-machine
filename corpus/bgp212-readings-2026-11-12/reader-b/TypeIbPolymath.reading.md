# TypeIbPolymath — reading (Lean l.240–256 against `TypeIbPolymath.source.md`)

**READING: MISMATCH** against [2] Lemma 4, and a different statement from [1] Theorem 2.8(ii).
**Direction: incomparable.**

## The differing clause
Same as TypeIIPolymath: the conclusion `HasEquidistribution x (moduliIIb x ω N δ ε) (dconv α β) a A C` sums
`sumError` over **all n**, where [2] Definition 7 sums over **n ∈ [x, 2x]** (`conventions.reading.md` §D).

## Clause by clause against [2] Lemma 4
- Sequence, scale, SW, N ≤ x^{1/2} hypotheses: identical to TypeIIPolymath. Match (H2–H9).
- Conditions: `24ω + 7δ − 3γ + θ ≤ −1` and `8ω + 3δ − γ + θ ≤ 0` with γ = log N / log x. They match
  24ω + 7δ − 3γ < −1 and 8ω + 3δ − γ < 0 (H10).
- `moduliIIb` (l.171–174): d ∈ `moduliRange x ω`, ∃ r u : ℕ, r ∣ d, u ∣ d / r, N·x^{−3ε−δ} < r < N·x^{−3ε},
  N⁻¹·x^{1/2−2ω−6ε−δ} < u < N⁻¹·x^{1/2−2ω−6ε}. With N = x^γ this is exactly x^{γ−3ε−δ} < r < x^{γ−3ε} and
  x^{1/2−γ−2ω−6ε−δ} < u < x^{1/2−γ−2ω−6ε}. `d / r` is exact natural division because r ∣ d. Exact.
- Squarefree, residue, main term, quantifiers: as TypeIIPolymath (match).
- n-range: **mismatch** (§D).
- ω ∈ (0, 1/4): Lean weaker (§R). [2]'s conditions force ω < 1/48 because γ ≤ 1/2.

## Against [1] Theorem 2.8(ii)
2.8(ii) is Type_I^{(2)}: the condition 56ϖ + 16δ + 4σ < 1, N ∈ [x^{1/2−σ}, x^{1/2−2ϖ−c}] up to x^{o(1)}, moduli
**doubly** x^δ-densely divisible, squarefree with prime factors in I, and a coprime to P_I. Under σ = 1/2 − γ its
condition reads 56ϖ + 16δ − 4γ < −1, which is not [2]'s pair. The Lean takes [2]'s conditions and moduli. Only the
n-range is [1]'s. [1] alone does not supply the Lean statement.

## Net
The Lean matches [2] Lemma 4 except for the n-range, which makes it incomparable, and ω ≤ 0, which it excludes
(weaker).
