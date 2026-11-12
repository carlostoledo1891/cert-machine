# TypeIBakerIrving — reading (Lean l.258–275 against `TypeIBakerIrving.source.md`)

**READING: MISMATCH** against [2] Lemma 5. **Direction: incomparable.**

## The differing clause
The conclusion `HasEquidistribution x (moduliI x ω N δ ε) (dconv α β) a A C` sums `sumError` over **all n**, where
[2] Definition 7 sums over **n ∈ [x, 2x]** (`conventions.reading.md` §D). The support of α ⋆ β is not inside [x, 2x]
in general, and that is just as true here as for the other estimates.

## Clause by clause against [2] Lemma 5
- α a located coefficient sequence, no SW. β smooth at scale N (`K.IsSmoothAtScale β N`, plus `LocatedAtScale` and
  the coefficient bound, which smoothness implies with the same K). No SW on either. Match (H2, H3 for the
  derivative bound with N ≥ x^{γ₁}).
- M N ≍ x: `K.asympEq`. Match. No upper bound on N in [2], and γ₂ is unrestricted in the Lean. Match.
- Branch selection `N ≤ √x` ⇔ γ ≤ 1/2 (√x = x^{1/2}). Middle branch `√x < N ≤ x^{1/2+2ω+ε}` ⇔
  γ ∈ (1/2, 1/2+2ω+ε]. Else the third branch. Match, and the boundary uses the same ε as [2].
- Conditions: `N ≤ √x → 3γ − 12ω − 3δ ≥ 1 + θ`; `√x < N → N ≤ x^{1/2+2ω+ε} → 68ω + 14δ ≤ 1 − θ`; nothing in
  the third branch. They match [2]'s case conditions with room θ (H10).
- `moduliI` (l.181–188): window (N x^{−δ−3ε}, N x^{−3ε}) = (x^{γ−δ−3ε}, x^{γ−3ε}) in the first branch;
  (N⁻¹ x^{1−δ−3ε}, N⁻¹ x^{1−3ε}) = (x^{1−γ−δ−3ε}, x^{1−γ−3ε}) in the second; `moduliRange x ω` in the third. Exact.
- Squarefree, residue `CoprimeBelow`, main term, quantifiers: match (H5, H7, H9).
- n-range: **mismatch** (§D).
- ω ∈ (0, 1/4): Lean weaker (§R). In [2], ω ≥ 1/4 instances are vacuous for large x: the third branch needs
  γ > 1 + ε, impossible since M ≥ 1 forces N ≤ asympHi·x, and the other two force ω < 1/24 or ω < 1/68. ω ≤ 0 is
  excluded.

## Net
The Lean matches [2] Lemma 5 clause for clause, including the ε-dependent branch boundary, except for the n-range.
That makes it incomparable.
