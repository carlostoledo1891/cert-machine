# TypeIStadlmann — reading (Lean l.277–294 against `TypeIStadlmann.source.md`)

**READING: MISMATCH** against [2] Lemma 6. **Direction: incomparable.**

## The differing clause
The conclusion `HasEquidistribution x (moduliIIc x ω N δ ε) (dconv α β) a A C` sums `sumError` over **all n**, where
[2] Definition 7 sums over **n ∈ [x, 2x]** (`conventions.reading.md` §D).

## Clause by clause against [2] Lemma 6
- Sequence, scale, SW, N ≤ x^{1/2} hypotheses: as in TypeIIPolymath. Match.
- Conditions `8ω + 4δ + 2γ + θ ≤ 1`, `32ω + 10δ − γ + θ ≤ 0`, `48ω + 16δ − 4γ + θ ≤ −1` match [2]'s three strict
  inequalities with room θ.
- `moduliIIc` (l.195–200): ∃ r u d₁ : ℕ with r ∣ d, u ∣ d / r, d₁ ∣ r, and:
  - N x^{−3ε−δ} < r < N x^{−3ε}, which is x^{γ−3ε−δ} < r < x^{γ−3ε};
  - N⁻¹ x^{1−6ε−δ}/d < u < N⁻¹ x^{1−6ε}/d, which is x^{1−γ−6ε−δ} d^{−1} < u < x^{1−γ−6ε} d^{−1};
  - r² N⁻¹ x^{2−52ε−δ}/d⁴ < d₁ < r² N⁻¹ x^{2−52ε}/d⁴, which is r² x^{2−γ−52ε−δ} d^{−4} < d₁ < r² x^{2−γ−52ε} d^{−4}.

  Exact, including the d^{−1} and d^{−4} that refer to the modulus itself.
- Squarefree, residue, main term, quantifiers: match.
- n-range: **mismatch** (§D).
- ω ∈ (0, 1/4): Lean weaker (§R). [2]'s 8ω + 4δ + 2γ < 1 already gives ω < 1/8. ω ≤ 0 is excluded.

## Net
The Lean matches [2] Lemma 6 clause for clause except for the n-range. That makes it incomparable.
