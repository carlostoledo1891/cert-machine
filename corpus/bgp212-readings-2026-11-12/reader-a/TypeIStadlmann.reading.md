# TypeIStadlmann — the Lean statement read against the source

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `TypeIStadlmann.source.md` (commit `c777708`).
A reading, not a decision.

## The Lean statement (lines 277-294), quoted

```lean
/-- **Stadlmann Type I**, corresponding to [2, Lemma 6]. The coefficient, scale and SW
hypotheses are as in `TypeIIPolymath`, with `0 < γ₁ ≤ γ₂ ≤ 1/2`. The inequalities here are
`8ω + 4δ + 2γ + θ ≤ 1`, `32ω + 10δ - γ + θ ≤ 0` and `48ω + 16δ - 4γ + θ ≤ -1`.
The conclusion is equidistribution over `moduliIIc`. -/
def TypeIStadlmann : Prop :=
  ∀ K : ConstantBundle, ∀ ω ∈ Set.Ioo (0 : ℝ) (1 / 4), ∀ θ > (0 : ℝ),
  ∀ γ₁ γ₂ : ℝ, 0 < γ₁ → γ₁ ≤ γ₂ → γ₂ ≤ 1 / 2 →
  ∃ ε₀ > (0 : ℝ), ∀ ε ∈ Set.Ioo 0 ε₀, ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ δ > (0 : ℝ), ∀ x ≥ (3 : ℝ), ∀ α β : ℕ → ℂ, ∀ M ≥ (1 : ℝ), ∀ N ≥ (1 : ℝ), ∀ a : ℕ,
  K.IsCoefficientSequence α → K.IsCoefficientSequence β →
  K.LocatedAtScale α M → K.LocatedAtScale β N →
  K.asympEq (M * N) x → K.HasSiegelWalfisz β N →
  x ^ γ₁ ≤ N → N ≤ x ^ γ₂ →
  8 * ω + 4 * δ + 2 * (log N / log x) + θ ≤ 1 →
  32 * ω + 10 * δ - (log N / log x) + θ ≤ 0 →
  48 * ω + 16 * δ - 4 * (log N / log x) + θ ≤ -1 →
  CoprimeBelow a x →
  HasEquidistribution x (moduliIIc x ω N δ ε) (dconv α β) a A C
```

Unfolds to (lines 195-200):

```lean
noncomputable def moduliIIc (x ω N δ ε : ℝ) : Finset ℕ :=
  {d ∈ moduliRange x ω | ∃ r u d₁ : ℕ, r ∣ d ∧ u ∣ d / r ∧ d₁ ∣ r ∧
    N * x ^ (- 3 * ε - δ) < (r : ℝ) ∧ (r : ℝ) < N * x ^ (- 3 * ε) ∧
    N⁻¹ * x ^ (1 - 6 * ε - δ) / (d : ℝ) < (u : ℝ) ∧ (u : ℝ) < N⁻¹ * x ^ (1 - 6 * ε) / (d : ℝ) ∧
    (r : ℝ) ^ 2 * N⁻¹ * x ^ (2 - 52 * ε - δ) / (d : ℝ) ^ 4 < (d₁ : ℝ) ∧
      (d₁ : ℝ) < (r : ℝ) ^ 2 * N⁻¹ * x ^ (2 - 52 * ε) / (d : ℝ) ^ 4}
```

## READING against [2] Lemma 6: MISMATCH

**Clause that differs: the range of $n$ in the discrepancy** — unrestricted `sumError` instead of Def. 7's $n\in[x,2x]$
(see `lean-common.reading.md`). **Judgement: incomparable as stated.** It is the only difference found.

Clauses that match (as read): $D_{IIc}$ exactly, including the $d$-relative windows and the constants $6\varepsilon$,
$52\varepsilon$ ($N^{-1}x^{1-6\varepsilon-\delta}/d=x^{1-\gamma-6\varepsilon-\delta}d^{-1}$;
$r^2N^{-1}x^{2-52\varepsilon-\delta}/d^4=r^2x^{2-\gamma-52\varepsilon-\delta}d^{-4}$); the three inequalities with room `θ`;
$N\le x^{1/2}$; Siegel-Walfisz on $\beta$; quantifier order as for `TypeIIPolymath`; residue; squarefree filter.

Harmless differences (my reasoning): `ω ∈ (0, 1/4)` — $\omega$ enters only the level and the (monotone) inequalities, so
$\omega\le0$ follows by inclusion, and the first inequality forces $\omega<1/8$; `x ≥ 3`; complex coefficients; the
`log` conventions. Stadlmann's earlier Theorem 1 was not pinned or read.
