# TypeIIIPolymath — the Lean statement read against the sources

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `TypeIIIPolymath.source.md` (commit
`c777708`). A reading, not a decision.

## The Lean statement (lines 296-322), quoted

```lean
/-- **[2, Lemma 7] (Polymath Type III)**, following [1, Theorem 2.8(v)]. All four factors are
coefficient sequences controlled by `K`; `α` is located at `M`, each `ψᵢ` is smooth at `Nᵢ`, and
their scale product is comparable to `x`. The parameters satisfy `0 < ω < 1/12`, `0 < κ < 1/2`,
`0 < δ < 1/4 + ω`, `θ > 0`, with `K.asympLo * x^(1-κ) ≤ Nᵢ Nⱼ` for distinct indices,
`K.asympLo * x^(1-2κ) ≤ Nᵢ ≤ K.asympHi * x^κ` and `28ω + 9κ + 8δ + θ ≤ 4`. The conclusion uses
the left-associated convolution and `moduliIII x ω δ`. -/
def TypeIIIPolymath : Prop :=
  ∀ K : ConstantBundle,
  ∀ ω ∈ Set.Ioo (0 : ℝ) (1 / 12), ∀ κ ∈ Set.Ioo (0 : ℝ) (1 / 2), ∀ δ ∈ Set.Ioo 0 (1 / 4 + ω),
  ∀ θ > (0 : ℝ),
  ∃ ε₀ > (0 : ℝ), ∀ ε ∈ Set.Ioo 0 ε₀, ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ x ≥ (3 : ℝ), ∀ α ψ₁ ψ₂ ψ₃ : ℕ → ℂ,
  ∀ M ≥ (1 : ℝ), ∀ N₁ ≥ (1 : ℝ), ∀ N₂ ≥ (1 : ℝ), ∀ N₃ ≥ (1 : ℝ), ∀ a : ℕ,
  K.IsCoefficientSequence α →
  K.IsCoefficientSequence ψ₁ → K.IsCoefficientSequence ψ₂ → K.IsCoefficientSequence ψ₃ →
  K.LocatedAtScale α M →
  K.IsSmoothAtScale ψ₁ N₁ → K.IsSmoothAtScale ψ₂ N₂ → K.IsSmoothAtScale ψ₃ N₃ →
  K.asympEq (M * N₁ * N₂ * N₃) x →
  K.asympLo * x ^ (1 - κ) ≤ N₁ * N₂ →
  K.asympLo * x ^ (1 - κ) ≤ N₁ * N₃ →
  K.asympLo * x ^ (1 - κ) ≤ N₂ * N₃ →
  K.asympLo * x ^ (1 - 2 * κ) ≤ N₁ → N₁ ≤ K.asympHi * x ^ κ →
  K.asympLo * x ^ (1 - 2 * κ) ≤ N₂ → N₂ ≤ K.asympHi * x ^ κ →
  K.asympLo * x ^ (1 - 2 * κ) ≤ N₃ → N₃ ≤ K.asympHi * x ^ κ →
  28 * ω + 9 * κ + 8 * δ + θ ≤ 4 →
  CoprimeBelow a x →
  HasEquidistribution x (moduliIII x ω δ) (dconv (dconv (dconv α ψ₁) ψ₂) ψ₃) a A C
```

Unfolds to (lines 205-207):

```lean
noncomputable def moduliIII (x ω δ : ℝ) : Finset ℕ :=
  {d ∈ moduliRange x ω | ∃ r : ℕ, r ∣ d ∧
    x ^ (1 / 3 + 4 * δ / 3 - 4 * ω / 3 - δ) < r ∧ r < x ^ (1 / 3 + 4 * δ / 3 - 4 * ω / 3)}
```

## READING against [2] Lemma 7: MISMATCH

**Clause 1 (main): the range of $n$ in the discrepancy** — unrestricted `sumError` instead of Def. 7's $n\in[x,2x]$.
Judgement: incomparable as stated.

**Clause 2 (minor): `ω ∈ Set.Ioo 0 (1/12)`.** [2] Lemma 7 states no range for $\omega$; here $\omega$ enters the $r$-window
$x^{1/3+\delta/3-4\omega/3}<r<x^{1/3+4\delta/3-4\omega/3}$, so $\omega\le0$ is not recovered by inclusion. Judgement: on
this clause the Lean is weaker. The upper bound $1/12$, and `κ ∈ (0, 1/2)`, `δ ∈ (0, 1/4 + ω)` — the ranges of [1]
Def. 2.6 carried over (with `κ` in the place of $\frac12-\sigma$) — are harmless (my reasoning): nonempty scale ranges need
$\kappa\ge\frac13$ for large $x$, and then $28\omega+9\kappa+8\delta<4$ already forces $\omega<\frac1{28}$, $\kappa<\frac49$,
$\delta<\frac18$; $\delta\le0$ empties the window.

Clauses that match (as read): `κ` is [2]'s $\gamma$ of Lemma 7 (a bound on the smooth scales, not $\log_xN$); the scale
conditions with constant slack (`K.asympLo`, `K.asympHi` are free since `K` is universally quantified); $\alpha$ located,
$\psi_i$ smooth, no Siegel-Walfisz; the convolution (left-associated, equal to $\alpha\star\psi_1\star\psi_2\star\psi_3$ by
associativity); `moduliIII` = $D_{III}$, with no $\varepsilon$ in the window, so the Lean's `ε` is a vacuous binder exactly
as in the source; the inequality $28\omega+9\kappa+8\delta<4$ with room `θ`; quantifier order — `κ` and `δ` fixed before
`ε₀` and `C` (the docstring at lines 218-219 says so), which is the source lemma without its uniformity note, i.e. less
uniform than the note allows (harmless for a premise).

**Overall judgement vs [2] Lemma 7: incomparable** (Clause 1), and weaker in $\omega$'s sign (Clause 2).

## READING against [1] Theorem 2.8(v): MISMATCH

The Lean is a hybrid: [1]'s parameter ranges ($0<\omega<\frac1{12}$, $0<\kappa<\frac12$, $0<\delta<\frac14+\omega$) and
discrepancy, [2]'s inequality and moduli. Clauses that differ: (a) **$8\delta$ in place of $2\delta$** — under
$\kappa=\frac12-\sigma$, [1]'s $\sigma>\frac1{18}+\frac{28}9\varpi+\frac29\delta$ is $28\varpi+9\kappa+2\delta<4$; the Lean
requires $28\omega+9\kappa+8\delta<4$, a stronger hypothesis (Lean weaker on this clause); (b) moduli — one divisor in a
window at $x^{1/3+\dots}$ instead of $x^\delta$-densely divisible squarefree $q$ with primes in $I$ (Lean stronger);
(c) level $x^{1/2+2\omega}$ exactly instead of $Q\lessapprox x^{1/2+2\varpi}$ (Lean weaker); (d) scale hypotheses with
constant slack instead of $x^{o(1)}$ slack (Lean weaker: it covers fewer configurations); (e) residue for one $I$.
**Judgement: incomparable with [1] Thm 2.8(v)** — it is [2]'s variant, which [2] proves by a sketch of changes.
