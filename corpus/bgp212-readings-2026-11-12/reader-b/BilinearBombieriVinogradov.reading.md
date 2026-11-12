# BilinearBombieriVinogradov — reading (Lean l.654–679 against `BilinearBombieriVinogradov.source.md`)

**READING: MISMATCH** against [1] Theorem 2.9 (v3). **Direction: Lean weaker** (a proper special case).

## The differing clause
`x ^ ξ ≤ M →` (l.675) is an added hypothesis. [1] Theorem 2.9 asks only M ≫ 1, together with N ≥ x^ε for the
Siegel–Walfisz factor. Instances with M < x^ξ for every fixed ξ > 0 (e.g. M ≍ 1 or M ≍ log x) are covered by [1]
and not by the Lean. This cannot be undone by a short argument. With M ≍ 1 the statement becomes a
Bombieri–Vinogradov bound for a single SW sequence at scale ≍ x, which does not follow from the bilinear case with
both factors long.

## The SW disjunction is harmless given that clause
`(K.HasSiegelWalfisz α M ∨ K.HasSiegelWalfisz β N)` looks like a relaxation of [1]'s "β has SW". Under the Lean's
symmetric scale conditions (x^ξ ≤ M and x^ξ ≤ N) it is not: if α is the SW factor, apply [1] to (α', β') = (β, α).
Then β' = α has SW at scale M ≥ x^ξ, and α' ⋆ β' = α ⋆ β because `dconv` is commutative on n ≥ 1 and both sides are
0 at n = 0. So every Lean instance is a [1] instance.

## Everything else matches
- Moduli: `Finset.Icc 1 ⌊x^{1/2} / (log x)^B⌋₊`, i.e. every q with 1 ≤ q ≤ x^{1/2} log^{−B} x. No squarefree
  filter, no `CoprimeBelow`. Exact.
- Residue: `{a ∈ range q | Coprime a q}.sup (‖sumError (dconv α β) q a‖₊)`. This is the maximum over a full set of
  representatives of the primitive classes (for q = 1 the set is {0}, matching (ℤ/1ℤ)^× = {0}), placed inside the
  q-sum. Exact.
- Discrepancy: `sumError`, over all n. That is [1]'s Δ(α ⋆ β; a (q)). Exact. Unlike the other six, the n-range here
  is the cited source's own.
- Quantifiers: ∀ K ∀ ξ > 0 ∀ A > 0 ∃ B > 0 ∃ C ∀ x ≥ 3 ∀ data, which is [1]'s "for any fixed A there exists a fixed B"
  with the implied constant uniform over the non-fixed data. B may depend on K and ξ, which are [1]'s fixed
  quantities (ξ plays [1]'s ε). Match (H5, H9).
- NM ~ x is [1]'s two-sided ~, encoded by `K.asympEq (M * N) x`. Match.
- Coefficient sequences, location, SW normalisation (both scales ≥ x^ξ), ℂ-valued, M, N ≥ 1: harmless (H1–H6).
  The triangle inequality also passes through the sup.

## Net
The Lean is [1] Theorem 2.9 restricted to M ≥ x^ξ. It is a weaker statement, in the safe direction for a
hypothesis.
