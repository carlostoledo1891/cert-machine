# TypeIBakerIrving — what the cited source states (step 1, Lean not read)

Cited (per the task): [2] Lemma 5 only. Definitions used: `definitions.source.md`.

## [2] Stadlmann, Lemma 5 (Baker-Irving Type I), verbatim

> Suppose f(n;x) = (α ⋆ β)(n;x), where α is coefficient sequence at scale M and β is a smooth coefficient sequence
> at scale N with M(x)N(x) ≍ x. Write N(x) = x^γ. Define the set of moduli
> D_I(x;ω,γ,δ;ε) =
>   { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : ∃ r | d with x^{γ−δ−3ε} < r < x^{γ−3ε} }        if γ ≤ 1/2,
>   { d ∈ [1, x^{1/2+2ω}] ∩ ℕ : ∃ r | d with x^{1−γ−δ−3ε} < r < x^{1−γ−3ε} }    if γ ∈ (1/2, 1/2+2ω+ε],
>   [1, x^{1/2+2ω}] ∩ ℕ                                                         if γ > 1/2+2ω+ε.
> Consider triples (ω,γ,δ) which satisfy the following inequalities:
> 3γ − 12ω − 3δ > 1   if γ ≤ 1/2,
> 68ω + 14δ < 1       if γ ∈ (1/2, 1/2+2ω+ε].
> For such triples (ω,γ,δ), convolution f has equidistribution properties for moduli in D_I(x;ω,γ,δ;ε).

Followed by: "This lemma is a variant of Lemma 5 of Baker and Irving."

### Every quantifier, range, convention (my words)
- **Sequences:** α any located coefficient sequence at scale M (no Siegel–Walfisz needed). β **smooth** at scale N
  (Def. 6(iii): β(n;x) = ψ(n/N) with ψ smooth, supported on [c, C], derivatives ≪_j log(x)^{O_j(1)}). No
  Siegel–Walfisz hypothesis on β is stated (none is needed for smooth β; the lemma does not mention it).
- **Scales:** M N ≍ x. **No upper bound N ≤ x^{1/2}** (unlike Lemmas 3, 4, 6). γ by N = x^γ, any size.
- **Three cases on γ** (boundaries depend on ε, the Def. 7 ε):
  - γ ≤ 1/2: moduli need a divisor r ∈ (x^{γ−δ−3ε}, x^{γ−3ε}); condition 3γ − 12ω − 3δ > 1.
  - 1/2 < γ ≤ 1/2 + 2ω + ε: divisor r ∈ (x^{1−γ−δ−3ε}, x^{1−γ−3ε}); condition 68ω + 14δ < 1.
  - γ > 1/2 + 2ω + ε: ALL d ≤ x^{1/2+2ω}; no condition on (ω, γ, δ) at all.
- **Moduli always:** d ≤ x^{1/2+2ω}, squarefree (from Def. 7), no smoothness, no set I.
- **Conclusion:** Def. 7 — n ∈ [x, 2x], one residue a coprime to every prime ≤ x, main term over n ∈ [x,2x] coprime
  to d, ≪_{A,ε} x/log(x)^A for every x > 1, A > 0, every sufficiently small ε.
- **Case boundaries with ε:** whether the middle or the last case applies to a given γ depends on ε; since the
  conclusion is for all sufficiently small ε, a γ slightly above 1/2 + 2ω falls in the last case for small ε.
