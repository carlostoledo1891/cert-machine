# Gap212HarmanReduction — reading (Lean l.519–650 against `Gap212HarmanReduction.source.md`)

**READING: MISMATCH** against [2] Proposition 2 with Definition 9. **Direction: incomparable** (as implications).
On the conclusion side the Lean is also weaker: it keeps only property (2).

What the Lean says, unfolded: `HarmanReduction gap212Params (19/50) (2/5) (2/5)` is
(∀ K ∀ ε₀ > 0 ∀ A > 0 ∃ C ∀ x ≥ 3 ∀ f ∀ a: `HarmanClass K x ξ₁ ξ₂ ξ₃ f` → `CoprimeBelow a x` →
Σ_{q ∈ [1,⌊x⌋] ∩ Q*, q squarefree} ‖sumError f q a‖ ≤ C x/(log x)^A)
→ (∀ ε₀ > 0 ∀ A > 0 ∃ C ∀ x ≥ 3 ∀ a: `CoprimeBelow a x` →
Σ_{q ∈ [1,⌊x⌋] ∩ Q*, q squarefree} ‖sumError (primeInterval x) q a‖ ≤ C x/(log x)^A).

## The differing clause
**The antecedent's discrepancy.** `HasEquidistributionOverQstar p x ε₀ f a A C` (l.618–620) is `HasEquidistribution`,
that is `sumError` over **all n** (l.142–150). [2] Proposition 2's hypothesis (inequ:harmrequ) sums over
**n ∈ [x, 2x]**. The conclusion is in [2]'s convention: `primeInterval x` = 1_P · 1_{dyadic x}, and
`dyadic x` = ℕ ∩ [x, 2x] for x ≥ 3, so its all-n discrepancy is exactly the [x, 2x] discrepancy of 1_P. So the Lean
derives a [2]-convention conclusion from a [1]-convention antecedent. [2] derives it from a [2]-convention
antecedent.

Why that makes the implications incomparable: write P_R for [2]'s antecedent, P_U for the Lean's, and Q₂ for
property (2). The Lean is P_U → Q₂, while [2] gives P_R → Q₂ (and more). The Lean follows from [2] if P_U ⇒ P_R, and
[2]'s (2) follows from the Lean if P_R ⇒ P_U. Each needs the restricted and unrestricted bounds to imply one
another for every member of H. By `conventions.reading.md` §D neither holds literally: the support of f ∈ H is not
inside [x, 2x] for general K, f·1_{[x,2x]} is not in H, and moving to other y ≍ x changes Q*(y) and the H-conditions
(e.g. N ≥ y^{ξ₁−ϵ}) at the boundary. So the Lean's reduction is not Proposition 2. Its truth would rest on running
the Harman/Buchstab argument again with the all-n discrepancy for the pieces, with the [x, 2x] cut of 1_P separated
from them. That argument is not in [2].

## Clause by clause
- **H(ξ₁, ξ₂, ξ₃)** (`TypeI`, `TypeII`, `TypeIII`, `HarmanClass`, l.540–585) against Definition 9:
  - (I) f = α ⋆ β, β smooth, M N ≍ x, N ≥ x^{ξ₁−ϵ}, no upper bound, no SW on α. Match.
  - (II) both α and β SW, x^{ξ₂−ϵ} ≤ N ≤ x^{1−ξ₂+ϵ}. Match.
  - (III) α located, ψ_i smooth, product ≍ x, x^{1−2ξ₃−ϵ} ≤ N_i ≤ x^{ξ₃+ϵ}, N_iN_j ≥ x^{1−ξ₃−ϵ}, all exact (no
    constants), as in [2]. Match.

  `slack` = 10⁻¹⁰ = ϵ. Match. ℂ-valued sequences: harmless (H1). The coefficient, SW and smooth normalisations are
  harmless (H2, H3). Every SW or smooth scale is ≥ x^{1/5−ϵ}/O(1), and a small-scale α in (I) is handled by the
  log-power rescaling of H2.
- **Q\*** (`Qgen`, `Qstar`, l.598–613) against Definition 2: q = e e' Π f_i Π f'_i ∈ [1, x]; caps
  x^{(1−ε₀)B_{j,m}}, x^{(1−ε₀)B_{j',m'}}, x^{(1−ε₀)(A_j−ε)}, x^{(1−ε₀)(A_{j'}+ε)}; e e' with all primes < x^δ ([2]'s
  "y-smooth" is strict); f_i, f'_i ≥ x^δ; m, m' ∈ {0, …, ⌊1/δ⌋}. Exact. The j-index shift (`p.A j.succ`) is
  correct. B_{j,0} = 0 makes the m = 0 cap read 1 ≤ x⁰, so it imposes nothing, which matches [2] having no column 0.
  The squarefree filter matches.
- **Residue.** Antecedent and conclusion use `CoprimeBelow a x` (p ≤ x). [2]'s hypothesis says (a, P(x)) = 1 with
  P(x) = Π_{p<x} p (strict). Its Definition 3 says p ≤ x. These differ only when x is itself a prime integer. Then
  [2]'s antecedent also covers a ≡ 0 mod x, which affects only the single modulus q = x, whose term is
  O(log^{O(1)} x). Harmless. (The Lean docstring at l.113–115 equates the two forms. That is off at this boundary only.)
- **Quantifiers.** Antecedent ∀K ∀ε₀ ∀A ∃C ∀x ∀f ∀a, conclusion ∀ε₀ ∀A ∃C ∀x ∀a. This is the standard uniform
  reading of "for every f ∈ H, x, ε₀, A, a … ≪_{A,ε₀}" and of Definition 3. Match (H9).
- **Conclusion = property (2) for ρ = 1_P only.** At ξ₂ = 2/5 ≤ 4/10, [2] states ρ = 1_P, c₁ = 0, c₂ = 0. Checked:
  - the first exceptional sum needs α₁, α₂ > 1/5 and α₁ + α₂ < 2/5, so it is empty;
  - the second needs 1/5 < α_i < 8ξ₂ − 3 = 1/5, so it is empty;
  - c₁'s first integral has an α₂-range [1/5, min(α₁, 2/5 − α₁)] that is non-empty only at α₁ = 1/5, and its second
    has α₂ ∈ [1/5, 1/5], so c₁ = 0.

  So the specialisation is exact. Properties (1) (0 ≤ 1_P ≤ 1_P), (3) (a prime n ≥ x exceeds x^{1/5}) and (4)
  (Σ_{[x,2x]} 1_P = (1+o(1)) x/log x, the prime number theorem) are not stated. The Lean is weaker there.
  (Aside, outside the seven: the docstring of `Gap212Certificate`, l.511–513, argues emptiness from five exponents
  "totalling more than 1". That alone does not suffice, because n ≤ 2x allows Σα_i ∈ (1, 1 + log 2/log x]. Emptiness
  holds through α₁ + α₂ < ξ₂, respectively α_i < 8ξ₂ − 3.)
- **Instance admissible for Proposition 2.** ξ = (19/50, 2/5, 2/5) ∈ (0,1)³ satisfies all five inequalities
  exactly: 49/25 < 2, 2/5 ≤ 2/5, 199/50 < 4, 29/25 > 1, 34/5 < 7. `gap212Params` (δ = 41/2500, ε = 1/125, one band
  A = (−1/125, 257/1000), B row `gap212Cap`) meets Definition 1. The `SupportParams` fields are proved, and 257/1000 <
  1/2 − 1/125. Proposition 2 is stated for an arbitrary T_k, so a datum different from [2]'s is allowed.

## Net
The classes, the moduli and the instance match. The antecedent's n-range does not, so the Lean implication is
neither implied by nor implies Proposition 2's (2). The conclusion drops (1), (3) and (4), which makes it weaker on
that axis.
