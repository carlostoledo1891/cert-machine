# TypeIIPolymath — what the cited sources state (step 1, Lean not read)

Cited (per the task): [2] Lemma 3; [1] Theorem 2.8(iv). Definitions used: `definitions.source.md`.

## [2] Stadlmann, Lemma 3 (Polymath Type II), verbatim

> Suppose f(n;x) = (α ⋆ β)(n;x), where α is coefficient sequence at scale M and β is a coefficient sequence at
> scale N with M(x)N(x) ≍ x and N(x) ≤ x^{1/2}. Suppose also that β has the Siegel-Walfisz property. Write
> N(x) = x^γ. Define the set of moduli
> D_IIa(x;ω,γ,δ;ε) = { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : There exists a divisor r | d with x^{γ−3ε−δ} < r < x^{γ−3ε} }.
> Consider triples (ω,γ,δ) which satisfy the following inequalities:
> 24ω + 7δ − 5γ < −2,   8ω + 3δ − γ < 0.
> For such triples (ω,γ,δ), convolution f has equidistribution properties for moduli in D_IIa(x;ω,γ,δ;ε).

Followed by: "This lemma is a variant of Theorem 2.8(iv) of Polymath, and serves as replacement for Theorem 2.8(i)."
And the note: permissible triples are defined by strict inequalities; with room to spare ε can be chosen uniformly.

### Every quantifier, range, convention (my words)
- **Sequences:** α, β: ℕ × (1,∞) → ℝ, divisor-bounded (|·| ≪ τ(n)^{O(1)} log(x)^{O(1)}); α located at scale M(x),
  β located at scale N(x) (fixed constants c, C; support in [cN, CN] for every x > 1). No hypothesis on α beyond
  being a located coefficient sequence. β has the Siegel–Walfisz property of Def. 6(ii) (all n, every x > 1, every
  q, r ≥ 1, every A > 1, every a coprime to q).
- **Scales:** M(x)N(x) ≍ x (two-sided, fixed constants); N(x) ≤ x^{1/2} (exact inequality, no x^{o(1)}).
- **γ:** defined by N(x) = x^γ. The lemma does not say whether γ is a constant or may vary with x; the
  conditions are on (ω, γ, δ) as numbers. (So γ ≤ 1/2 follows from N ≤ x^{1/2}.)
- **Parameter conditions:** 24ω + 7δ − 5γ < −2 AND 8ω + 3δ − γ < 0 (both strict). No sign or size constraint on ω, δ
  is stated (δ > 0 implicit in "x^δ").
- **Moduli:** the squarefree d with 1 ≤ d ≤ x^{1/2+2ω} having SOME divisor r in the open interval
  (x^{γ−3ε−δ}, x^{γ−3ε}). No smoothness, no dense divisibility, no restriction of prime factors to a set I.
- **Conclusion (Def. 7):** there is ε₀(ω,γ,δ) > 0 such that for every ε ∈ (0, ε₀), every A > 0, there is C(A,ε)
  with, for every real x > 1 and every integer a coprime to every prime ≤ x:
  Σ_{d ∈ D_IIa, d squarefree} | Σ_{n ∈ [x,2x], n ≡ a (d)} f(n;x) − (1/φ(d)) Σ_{n ∈ [x,2x], (n,d)=1} f(n;x) | ≤ C x / log(x)^A.
  n runs over the closed interval [x, 2x]; one residue a (no sup); absolute value per modulus; sum over moduli.
- **ε appears twice:** inside D_IIa (the window for r shifts by x^{−3ε}) and in the "sufficiently small ε"
  quantifier of Def. 7 — it is the same ε.

## [1] Polymath v3, Theorem 2.8(iv), verbatim

> Let ϖ, δ, σ > 0 be fixed quantities. ... (iv) If 68ϖ + 14δ < 1, then Type_II^{(1)}[ϖ, δ] holds.

With Definition 2.6(ii): for any bounded I ⊂ ℝ and primitive a (P_I), any M, N ≫ 1 with MN ~ x and
x^{1/2−2ϖ−c} ≲ N ≲ x^{1/2} for some sufficiently small fixed c > 0, any Q ≲ x^{1/2+2ϖ}, any coefficient sequences
α, β located at scales M, N with β Siegel–Walfisz:
Σ_{q ≤ Q, q ∈ D_I^{(1)}(x^δ)} |Δ(α ⋆ β; a (q))| ≪ x log^{−A} x for every fixed A > 0.

### Every quantifier, range, convention (my words)
- **Parameters:** fixed ϖ, δ > 0 with 68ϖ + 14δ < 1 (and the Def. 2.6 preamble 0 < ϖ < 1/4, 0 < δ < 1/4 + ϖ, both
  implied). Single linear condition; no γ.
- **Scales:** MN ~ x (two-sided ≪); N between x^{1/2−2ϖ−c} and x^{1/2}, each up to an x^{o(1)} factor; c > 0 a
  sufficiently small fixed constant (I read: there is c₀ > 0 such that the claim holds for every fixed c ∈ (0, c₀]).
- **Moduli:** q ≤ Q with Q ≤ x^{1/2+2ϖ+o(1)}; q squarefree, all prime factors in I; q (1-tuply) x^δ-densely divisible
  (for every 1 ≤ R ≤ x^δ q there is r | q with x^{−δ}R ≤ r ≤ R).
- **Residue:** one a, coprime to P_I (primitive mod every such q).
- **Discrepancy:** Δ over ALL n (α ⋆ β is supported near x at scale ≍ x; not cut to [x, 2x]).
- **Bound:** for every fixed A, ≪ x log^{−A} x for x sufficiently large, constant depending on fixed data only.

## The two cited statements are not the same statement
[2] Lemma 3 is presented as a *variant* of [1] 2.8(iv): different parameter conditions (two conditions involving
γ vs. 68ϖ + 14δ < 1), different N-range (N ≤ x^{1/2} with γ in the conditions vs. a window just below x^{1/2}),
different moduli (one divisor in a window of width x^δ vs. squarefree-in-I and densely divisible), different
residue condition (coprime to all p ≤ x vs. coprime to P_I), different n-range ([x, 2x] vs. all n). A single Lean
hypothesis can match at most one of them literally.
