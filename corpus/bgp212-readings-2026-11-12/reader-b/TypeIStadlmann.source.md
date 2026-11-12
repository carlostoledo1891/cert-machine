# TypeIStadlmann — what the cited source states (step 1, Lean not read)

Cited (per the task): [2] Lemma 6 only. Definitions used: `definitions.source.md`.

## [2] Stadlmann, Lemma 6 (S. Type I), verbatim

> Suppose f(n;x) = (α ⋆ β)(n;x), where α is coefficient sequence at scale M and β is a coefficient sequence at
> scale N with M(x)N(x) ≍ x and N(x) ≤ x^{1/2}. Suppose also that β has the Siegel-Walfisz property. Write
> N(x) = x^γ. Define the set of moduli
> D_IIc(x;ω,γ,δ;ε) = { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : ∃ r | d ∃ u | d/r ∃ d₁ | r with x^{γ−3ε−δ} < r < x^{γ−3ε}
>    and x^{1−γ−6ε−δ} d^{−1} < u < x^{1−γ−6ε} d^{−1}
>    and r² x^{2−γ−52ε−δ} d^{−4} < d₁ < r² x^{2−γ−52ε} d^{−4} }.
> Consider triples (ω,γ,δ) which satisfy the following inequalities:
> 8ω + 4δ + 2γ < 1,   32ω + 10δ − γ < 0,   48ω + 16δ − 4γ < −1.
> For such triples (ω,γ,δ), convolution f has equidistribution properties for moduli in D_IIc(x;ω,γ,δ;ε).

Followed by: "This lemma is a variant of Theorem 1 of [Stadlmann 2023]."

### Every quantifier, range, convention (my words)
- **Sequences and scales:** as Lemma 3: α located at M; β located at N with Siegel–Walfisz; M N ≍ x;
  N(x) ≤ x^{1/2}; γ by N = x^γ.
- **Parameter conditions (three, strict):** 8ω + 4δ + 2γ < 1; 32ω + 10δ − γ < 0; 48ω + 16δ − 4γ < −1.
- **Moduli:** squarefree d ≤ x^{1/2+2ω} with three nested divisors:
  r | d with x^{γ−3ε−δ} < r < x^{γ−3ε};
  u | d/r with x^{1−γ−6ε−δ}/d < u < x^{1−γ−6ε}/d (the window scales with 1/d, d the modulus itself);
  d₁ | r with r² x^{2−γ−52ε−δ}/d⁴ < d₁ < r² x^{2−γ−52ε}/d⁴ (window depends on r and d).
  All windows open, all of multiplicative width x^δ. ε the Def. 7 ε.
- **Conclusion:** Def. 7 — n ∈ [x, 2x], one residue a coprime to every prime ≤ x, main term over n ∈ [x,2x] coprime
  to d, ≪_{A,ε} x/log(x)^A for every x > 1, A > 0, every sufficiently small ε.
