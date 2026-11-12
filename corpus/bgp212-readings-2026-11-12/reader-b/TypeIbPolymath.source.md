# TypeIbPolymath — what the cited sources state (step 1, Lean not read)

Cited (per the task): [2] Lemma 4; [1] Theorem 2.8(ii). Definitions used: `definitions.source.md`.

## [2] Stadlmann, Lemma 4 (Polymath Type I(ii)), verbatim

> Suppose f(n;x) = (α ⋆ β)(n;x), where α is coefficient sequence at scale M and β is a coefficient sequence at
> scale N with M(x)N(x) ≍ x and N(x) ≤ x^{1/2}. Suppose also that β has the Siegel-Walfisz property. Write
> N(x) = x^γ. Define the set of moduli
> D_IIb(x;ω,γ,δ;ε) = { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : ∃ r | d ∃ u | d/r with x^{γ−3ε−δ} < r < x^{γ−3ε}
>                      and x^{1/2−γ−2ω−6ε−δ} < u < x^{1/2−γ−2ω−6ε} }.
> Consider triples (ω,γ,δ) which satisfy the following inequalities:
> 24ω + 7δ − 3γ < −1,   8ω + 3δ − γ < 0.
> For such triples (ω,γ,δ), convolution f has equidistribution properties for moduli in D_IIb(x;ω,γ,δ;ε).

Followed by: "This lemma is a variant of Theorem 2.8(ii) of Polymath."

### Every quantifier, range, convention (my words)
- **Sequences and scales:** exactly as Lemma 3: α located at M; β located at N with Siegel–Walfisz; M N ≍ x;
  N(x) ≤ x^{1/2}; γ defined by N = x^γ.
- **Parameter conditions:** 24ω + 7δ − 3γ < −1 AND 8ω + 3δ − γ < 0 (strict).
- **Moduli:** squarefree d, 1 ≤ d ≤ x^{1/2+2ω}, with a divisor r of d in (x^{γ−3ε−δ}, x^{γ−3ε}) AND a divisor u of
  d/r (so r u | d, r and u coprime because d is squarefree) in (x^{1/2−γ−2ω−6ε−δ}, x^{1/2−γ−2ω−6ε}). Both intervals
  open. The same ε as in Def. 7's "sufficiently small ε".
- **Conclusion:** Def. 7 — n ∈ [x, 2x], one residue a coprime to every prime ≤ x, main term (1/φ(d)) over
  n ∈ [x, 2x] coprime to d, absolute value per modulus, ≪_{A,ε} x/log(x)^A for every x > 1, every A > 0, every
  sufficiently small ε > 0.

## [1] Polymath v3, Theorem 2.8(ii), verbatim

> Let ϖ, δ, σ > 0 be fixed quantities. ... (ii) If 56ϖ + 16δ + 4σ < 1, then Type_I^{(2)}[ϖ, δ, σ] holds.

With Definition 2.6(i) at i = 2: for any bounded I and primitive a (P_I), any M, N ≫ 1 with MN ~ x and
x^{1/2−σ} ≲ N ≲ x^{1/2−2ϖ−c} for some fixed c > 0, any Q ≲ x^{1/2+2ϖ}, coefficient sequences α, β located at
M, N with β Siegel–Walfisz: Σ_{q ≤ Q, q ∈ D_I^{(2)}(x^δ)} |Δ(α ⋆ β; a (q))| ≪ x log^{−A} x for every fixed A > 0.

### Every quantifier, range, convention (my words)
- **Parameters:** fixed ϖ, δ, σ > 0, 56ϖ + 16δ + 4σ < 1; preamble 0 < σ < 1/2 etc.
- **Scales:** N from x^{1/2−σ} up to x^{1/2−2ϖ−c}, each up to x^{o(1)}; c > 0 some fixed constant.
- **Moduli:** q ≤ Q ≲ x^{1/2+2ϖ}, squarefree with prime factors in I, **doubly** x^δ-densely divisible (Def. 2.1 with
  i = 2: for (j,k) ∈ {(1,0),(0,1)} and every 1 ≤ R ≤ x^δ q, a factorisation q = q'r with x^{−δ}R ≤ r ≤ R and the
  named factor densely divisible).
- **Residue / n-range / bound:** a coprime to P_I; Δ over all n; ≪ x log^{−A} x, x large.

## Relation between the two
Under σ = 1/2 − γ the [1] condition reads 56ϖ + 16δ − 4γ < −1, not [2]'s pair of conditions; the moduli sets
(divisor pair in windows vs. doubly densely divisible, squarefree in I), the residue condition and the n-range all
differ. [2] Lemma 4 is a variant, not a restatement; a Lean hypothesis can match at most one literally.
