# TypeIBakerIrving — the Lean statement read against the source

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `TypeIBakerIrving.source.md` (commit
`c777708`). A reading, not a decision.

## The Lean statement (lines 258-275), quoted

```lean
/-- **[2, Lemma 5] (Baker–Irving Type I)**. Both factors are located coefficient sequences,
`K.asympEq (M * N) x` holds, and `β` is smooth; no SW hypothesis is imposed on either, and
`0 < γ₁ ≤ γ₂` with no upper restriction on `γ₂`. When `N ≤ √x`, require `3γ - 12ω - 3δ ≥ 1 + θ`;
when `√x < N ≤ x^(1/2+2ω+ε)`, require `68ω + 14δ ≤ 1 - θ`; above that range neither is
required. The conclusion uses the corresponding branch of `moduliI`. -/
def TypeIBakerIrving : Prop :=
  ∀ K : ConstantBundle, ∀ ω ∈ Set.Ioo (0 : ℝ) (1 / 4), ∀ θ > (0 : ℝ),
  ∀ γ₁ γ₂ : ℝ, 0 < γ₁ → γ₁ ≤ γ₂ →
  ∃ ε₀ > (0 : ℝ), ∀ ε ∈ Set.Ioo 0 ε₀, ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ δ > (0 : ℝ), ∀ x ≥ (3 : ℝ), ∀ α β : ℕ → ℂ, ∀ M ≥ (1 : ℝ), ∀ N ≥ (1 : ℝ), ∀ a : ℕ,
  K.IsCoefficientSequence α → K.IsCoefficientSequence β →
  K.LocatedAtScale α M → K.LocatedAtScale β N →
  K.asympEq (M * N) x → K.IsSmoothAtScale β N →
  x ^ γ₁ ≤ N → N ≤ x ^ γ₂ →
  (N ≤ √x → 3 * (log N / log x) - 12 * ω - 3 * δ ≥ 1 + θ) →
  (√x < N → N ≤ x ^ (1 / 2 + 2 * ω + ε) → 68 * ω + 14 * δ ≤ 1 - θ) →
  CoprimeBelow a x →
  HasEquidistribution x (moduliI x ω N δ ε) (dconv α β) a A C
```

Unfolds to (lines 181-188):

```lean
noncomputable def moduliI (x ω N δ ε : ℝ) : Finset ℕ :=
  if N ≤ √x then
    {d ∈ moduliRange x ω | ∃ r : ℕ, r ∣ d ∧ N * x ^ (- δ - 3 * ε) < r ∧ r < N * x ^ (- 3 * ε)}
  else if N ≤ x ^ (1 / 2 + 2 * ω + ε) then
    {d ∈ moduliRange x ω |
      ∃ r : ℕ, r ∣ d ∧ N⁻¹ * x ^ (1 - δ - 3 * ε) < r ∧ r < N⁻¹ * x ^ (1 - 3 * ε)}
  else
    moduliRange x ω
```

## READING against [2] Lemma 5: MISMATCH

**Clause 1 (main): the range of $n$ in the discrepancy** — unrestricted `sumError` instead of Def. 7's $n\in[x,2x]$.
Judgement: incomparable as stated.

**Clause 2 (minor): `ω ∈ Set.Ioo 0 (1/4)`.** [2] Lemma 5 states no sign condition on $\omega$; here $\omega$ moves the
boundary between the middle case and the "all moduli" case ($x^{1/2+2\omega+\varepsilon}$), so $\omega\le0$ is not recovered
by inclusion. Judgement: on this clause the Lean is weaker.

Clauses that match (as read): $\beta$ smooth, $\alpha$ any coefficient sequence, no Siegel-Walfisz, no $N\le x^{1/2}$ (no
upper bound on `γ₂`); the three cases with the same boundaries, including the $\varepsilon$ in
$\gamma\le\frac12+2\omega+\varepsilon$ (`N ≤ x ^ (1/2 + 2ω + ε)`, the same `ε` as in the windows); the three moduli sets
($N^{-1}x^{1-\delta-3\varepsilon}=x^{1-\gamma-\delta-3\varepsilon}$); the case conditions $3\gamma-12\omega-3\delta>1$ and
$68\omega+14\delta<1$ with room `θ`, and no condition in the third case; residue; squarefree filter. The Lean's uniformity
in $N$ across the case boundary (one `ε₀`, one `C` for the whole band $[x^{\gamma_1},x^{\gamma_2}]$) reads as the source's
note applied to the third case, which has no inequality and so has room to spare by default.

**Overall judgement vs [2] Lemma 5: incomparable** (Clause 1), and weaker in $\omega$'s sign (Clause 2). Baker-Irving's own
Lemma 5 was not pinned or read.
