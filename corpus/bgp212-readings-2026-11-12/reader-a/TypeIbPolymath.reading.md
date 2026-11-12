# TypeIbPolymath — the Lean statement read against the sources

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `TypeIbPolymath.source.md` (commit `c777708`).
A reading, not a decision.

## The Lean statement (lines 240-256), quoted

```lean
/-- **[2, Lemma 4] (Polymath Type I(ii))**, a variant of [1, Theorem 2.8(ii)]. The coefficient,
scale and SW hypotheses are as in `TypeIIPolymath`, with `0 < γ₁ ≤ γ₂ ≤ 1/2`.
The inequalities are `24ω + 7δ - 3γ + θ ≤ -1` and `8ω + 3δ - γ + θ ≤ 0`, and the conclusion
is equidistribution over `moduliIIb`. -/
def TypeIbPolymath : Prop :=
  ∀ K : ConstantBundle, ∀ ω ∈ Set.Ioo (0 : ℝ) (1 / 4), ∀ θ > (0 : ℝ),
  ∀ γ₁ γ₂ : ℝ, 0 < γ₁ → γ₁ ≤ γ₂ → γ₂ ≤ 1 / 2 →
  ∃ ε₀ > (0 : ℝ), ∀ ε ∈ Set.Ioo 0 ε₀, ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ δ > (0 : ℝ), ∀ x ≥ (3 : ℝ), ∀ α β : ℕ → ℂ, ∀ M ≥ (1 : ℝ), ∀ N ≥ (1 : ℝ), ∀ a : ℕ,
  K.IsCoefficientSequence α → K.IsCoefficientSequence β →
  K.LocatedAtScale α M → K.LocatedAtScale β N →
  K.asympEq (M * N) x → K.HasSiegelWalfisz β N →
  x ^ γ₁ ≤ N → N ≤ x ^ γ₂ →
  24 * ω + 7 * δ - 3 * (log N / log x) + θ ≤ -1 →
  8 * ω + 3 * δ - (log N / log x) + θ ≤ 0 →
  CoprimeBelow a x →
  HasEquidistribution x (moduliIIb x ω N δ ε) (dconv α β) a A C
```

Unfolds to (lines 171-174):

```lean
noncomputable def moduliIIb (x ω N δ ε : ℝ) : Finset ℕ :=
  {d ∈ moduliRange x ω | ∃ r u : ℕ, r ∣ d ∧ u ∣ d / r ∧
    N * x ^ (- 3 * ε - δ) < (r : ℝ) ∧ (r : ℝ) < N * x ^ (- 3 * ε) ∧
    N⁻¹ * x ^ (1 / 2 - 2 * ω - 6 * ε - δ) < u ∧ u < N⁻¹ * x ^ (1 / 2 - 2 * ω - 6 * ε)}
```

## READING against [2] Lemma 4: MISMATCH

**Clause 1 (main): the range of $n$ in the discrepancy** — unrestricted `sumError` instead of Def. 7's $n\in[x,2x]$ (see
`lean-common.reading.md`). Judgement: incomparable as stated.

**Clause 2 (minor): `ω ∈ Set.Ioo 0 (1/4)`.** [2] Lemma 4 states no sign condition on $\omega$, and here $\omega$ enters the
$u$-window $N^{-1}x^{1/2-2\omega-6\varepsilon-\delta}<u<N^{-1}x^{1/2-2\omega-6\varepsilon}$, so the case $\omega\le0$ is not
recoverable from $\omega>0$ by inclusion of moduli sets (unlike Lemmas 3 and 6). Judgement: on this clause the Lean is
weaker (it asserts the estimate for fewer $\omega$). The upper end $1/4$ is harmless (the first inequality forces
$\omega<1/48$).

Clauses that match (as read): $D_{IIb}$ exactly (with $N=x^\gamma$:
$N^{-1}x^{1/2-2\omega-6\varepsilon-\delta}=x^{1/2-\gamma-2\omega-6\varepsilon-\delta}$; `u ∣ d / r` with `r ∣ d` is exact
division); the two inequalities with room `θ`; $N\le x^{1/2}$; Siegel-Walfisz on $\beta$ only; quantifier order as for
`TypeIIPolymath`; residue; squarefree filter.

**Overall judgement vs [2] Lemma 4: incomparable** (Clause 1), and weaker in $\omega$'s sign (Clause 2).

## READING against [1] Theorem 2.8(ii): MISMATCH

The Lean's own docstring says "a variant of [1, Theorem 2.8(ii)]". Clauses that differ: (a) moduli — two divisors in
fixed windows instead of doubly $x^\delta$-densely divisible squarefree $q$ with primes in $I$; (b) numerics —
$24\omega+7\delta-3\gamma<-1$ and $8\omega+3\delta-\gamma<0$ instead of $56\varpi+16\delta+4\sigma<1$ (with
$\sigma=\frac12-\gamma$: $56\varpi+16\delta-4\gamma<-1$); neither implies the other (at $\omega=\delta=0$ [1] needs
$\gamma>\frac14$, the Lean $\gamma>\frac13$; at $\omega=0.02$, $\delta\to0$ [1]'s range is empty, the Lean's is
$\gamma>0.4933$ — my arithmetic); (c) $N\le x^{1/2}$ instead of $N\lessapprox x^{1/2-2\varpi-c}$; (d) level and residue as
for Type II. **Judgement: incomparable with [1] Thm 2.8(ii)** — a different statement ([2]'s), stronger in some ranges and
weaker in others.
