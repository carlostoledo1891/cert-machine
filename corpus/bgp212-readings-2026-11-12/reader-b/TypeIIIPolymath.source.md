# TypeIIIPolymath — what the cited sources state (step 1, Lean not read)

Cited (per the task): [2] Lemma 7; [1] Theorem 2.8(v). Definitions used: `definitions.source.md`.

## [2] Stadlmann, Lemma 7 (Polymath Type III), verbatim

> Suppose f(n;x) = (α ⋆ ψ₁ ⋆ ψ₂ ⋆ ψ₃)(n;x), where α is coefficient sequence at scale M and ψ₁, ψ₂ and ψ₃ are
> smooth coefficient sequences at scales N₁, N₂ and N₃ with
> M(x)N₁(x)N₂(x)N₃(x) ≍ x,
> N₁(x)N₂(x), N₁(x)N₃(x), N₂(x)N₃(x) ≫ x^{1−γ},
> x^{1−2γ} ≪ N₁(x), N₂(x), N₃(x) ≪ x^γ.
> Define the set of moduli
> D_III(x;ω,γ,δ;ε) = { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : ∃ r | d with x^{1/3+4δ/3−4ω/3−δ} < r < x^{1/3+4δ/3−4ω/3} }.
> Consider triples (ω,γ,δ) which satisfy the following inequality:
> 28ω + 9γ + 8δ < 4.
> For such triples (ω,γ,δ), convolution f has equidistribution properties for moduli in D_III(x;ω,γ,δ;ε).

Followed by: "This lemma is a variant of Theorem 2.8(v) of Polymath."

### Every quantifier, range, convention (my words)
- **Sequences:** α any located coefficient sequence at scale M (no Siegel–Walfisz). ψ₁, ψ₂, ψ₃ smooth at scales
  N₁, N₂, N₃ (Def. 6(iii)).
- **Scales:** M N₁ N₂ N₃ ≍ x; each pairwise product ≫ x^{1−γ}; each N_i between x^{1−2γ} and x^γ up to fixed
  constants (≪, not ≲: no x^{o(1)} slack). Here γ is a parameter in the scale conditions (not log_x of a scale).
- **Parameter condition:** 28ω + 9γ + 8δ < 4 (single, strict). No separate ω < 1/12.
- **Moduli:** squarefree d ≤ x^{1/2+2ω} with a divisor r in the open window (x^{1/3+δ/3−4ω/3}, x^{1/3+4δ/3−4ω/3})
  (lower exponent 1/3 + 4δ/3 − 4ω/3 − δ = 1/3 + δ/3 − 4ω/3). The window does NOT depend on ε or γ. ε still appears via
  Def. 7's "sufficiently small ε" (here only in the implied constant).
- **Conclusion:** Def. 7 — n ∈ [x, 2x], one residue a coprime to every prime ≤ x, main term over n ∈ [x,2x] coprime
  to d, ≪_{A,ε} x/log(x)^A for every x > 1, every A > 0.

## [1] Polymath v3, Theorem 2.8(v), verbatim

> Let ϖ, δ, σ > 0 be fixed quantities. ... (v) If σ > 1/18 + 28ϖ/9 + 2δ/9 and ϖ < 1/12, then
> Type_III^{(1)}[ϖ, δ, σ] holds.

With Definition 2.6(iii) at i = 1: for any bounded I, primitive a (P_I), any M, N₁, N₂, N₃ ≫ 1 with M N₁ N₂ N₃ ~ x,
N_iN_j ≳ x^{1/2+σ}, x^{2σ} ≲ N_i ≲ x^{1/2−σ}, coefficient sequences α, ψ₁, ψ₂, ψ₃ located at M, N₁, N₂, N₃ with ψ_i
smooth, any Q ≲ x^{1/2+2ϖ}: Σ_{q ≤ Q, q ∈ D_I^{(1)}(x^δ)} |Δ(α ⋆ ψ₁ ⋆ ψ₂ ⋆ ψ₃; a (q))| ≪ x log^{−A} x, every fixed A.

### Every quantifier, range, convention (my words)
- **Parameters:** fixed ϖ, δ, σ > 0, σ > 1/18 + 28ϖ/9 + 2δ/9, ϖ < 1/12; preamble σ < 1/2, δ < 1/4 + ϖ.
- **Scales:** with x^{o(1)} slack on every scale inequality (≲, ≳).
- **Moduli:** q ≤ Q ≲ x^{1/2+2ϖ}, squarefree with prime factors in I, x^δ-densely divisible (1-tuply).
- **Residue / n-range / bound:** a coprime to P_I; Δ over all n; ≪ x log^{−A} x, x large.

## Relation between the two
Substituting σ = 1/2 − γ maps the scale conditions onto each other (x^{1/2+σ} = x^{1−γ}, x^{2σ} = x^{1−2γ},
x^{1/2−σ} = x^γ) and turns [1]'s condition into 28ϖ + 9γ + 2δ < 4 — [2] has 8δ, a stronger requirement, and drops
ϖ < 1/12. Moduli (one divisor in a fixed window vs. densely divisible, squarefree in I), residue condition and
n-range differ. A Lean hypothesis can match at most one literally.
