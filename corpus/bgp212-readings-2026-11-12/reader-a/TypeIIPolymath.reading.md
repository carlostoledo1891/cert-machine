# TypeIIPolymath — the Lean statement read against the sources

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `TypeIIPolymath.source.md` (commit `c777708`,
written before the Lean file was opened). A reading, not a decision.

## The Lean statement (lines 222-238), quoted

```lean
/-- **Polymath Type II**, corresponding to [2, Lemma 3] and [1, Theorem 2.8(iv)]. Both factors
are coefficient sequences at scales `M, N`, with `K.asympEq (M * N) x` and SW on `β`.
Here `0 < γ₁ ≤ γ₂ ≤ 1/2`, `24ω + 7δ - 5γ + θ ≤ -2` and `8ω + 3δ - γ + θ ≤ 0`.
The conclusion is equidistribution over `moduliIIa`. -/
def TypeIIPolymath : Prop :=
  ∀ K : ConstantBundle, ∀ ω ∈ Set.Ioo (0 : ℝ) (1 / 4), ∀ θ > (0 : ℝ),
  ∀ γ₁ γ₂ : ℝ, 0 < γ₁ → γ₁ ≤ γ₂ → γ₂ ≤ 1 / 2 →
  ∃ ε₀ > (0 : ℝ), ∀ ε ∈ Set.Ioo 0 ε₀, ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ δ > (0 : ℝ), ∀ x ≥ (3 : ℝ), ∀ α β : ℕ → ℂ, ∀ M ≥ (1 : ℝ), ∀ N ≥ (1 : ℝ), ∀ a : ℕ,
  K.IsCoefficientSequence α → K.IsCoefficientSequence β →
  K.LocatedAtScale α M → K.LocatedAtScale β N →
  K.asympEq (M * N) x → K.HasSiegelWalfisz β N →
  x ^ γ₁ ≤ N → N ≤ x ^ γ₂ →
  24 * ω + 7 * δ - 5 * (log N / log x) + θ ≤ -2 →
  8 * ω + 3 * δ - (log N / log x) + θ ≤ 0 →
  CoprimeBelow a x →
  HasEquidistribution x (moduliIIa x ω N δ ε) (dconv α β) a A C
```

Unfolds to (lines 164-165):

```lean
noncomputable def moduliIIa (x ω N δ ε : ℝ) : Finset ℕ :=
  {d ∈ moduliRange x ω | ∃ r : ℕ, r ∣ d ∧ N * x ^ (- δ - 3 * ε) < r ∧ r < N * x ^ (-3 * ε)}
```

and `HasEquidistribution`, `sumError`, `ConstantBundle` and the coefficient predicates (quoted in `lean-common.reading.md`).

## READING against [2] Lemma 3: MISMATCH

**Clause that differs: the range of $n$ in the discrepancy.** [2] Lemma 3 concludes Def. 7, whose inner sums run over
$n\in[x,2x]$; the Lean concludes `HasEquidistribution … (dconv α β)`, whose `sumError` runs over all $n$ (the support of
$\alpha\star\beta$). **Judgement: neither stronger nor weaker — incomparable as stated**; the Lean takes [1]'s discrepancy
(1.1), not [2]'s Def. 7, and no clause of the file bridges the two for the type estimates.

Clauses that match (as read): the objects ($\alpha$ at $M$, $\beta$ at $N$ with Siegel-Walfisz, $MN\asymp x$,
$N\le x^{1/2}$ via `γ₂ ≤ 1/2`); the moduli `moduliIIa` = $D_{IIa}$ with $N=x^\gamma$
($Nx^{-\delta-3\varepsilon}=x^{\gamma-3\varepsilon-\delta}$); the two inequalities, with room `θ`; the quantifier order
`θ, γ-band → ε₀ → ε, A → C → δ, x, sequences, a`, which is [2]'s lemma together with its uniformity note (one $\varepsilon$
and one constant for triples with room to spare); the residue `CoprimeBelow`; the squarefree filter.

Clauses that differ but are harmless (my reasoning): `ω ∈ (0, 1/4)` where [2] states no sign condition — here $\omega$
enters only the level $x^{1/2+2\omega}$ and the inequalities, both monotone, so $\omega\le0$ follows from a small positive
$\omega$ by inclusion of moduli sets, and the inequalities already force $\omega<1/48$; `x ≥ 3`; complex coefficients;
`1 + log n` / `log N` in place of `log x` (equivalent since $N\ge x^{\gamma_1}$, $M\gtrsim x^{1/2}$).

## READING against [1] Theorem 2.8(iv): MISMATCH

The Lean states [2]'s variant, not [1]'s theorem. Clauses that differ: (a) moduli — `moduliIIa` (any $d\le x^{1/2+2\omega}$
with one divisor in a width-$x^\delta$ window) instead of squarefree $x^\delta$-densely divisible $q$ with primes in $I$;
(b) range of $N$ — any $x^{\gamma_1}\le N\le x^{1/2}$ meeting the inequalities, instead of only
$x^{1/2-2\varpi-c}\lessapprox N\lessapprox x^{1/2}$; (c) numerics — $24\omega+7\delta-5\gamma<-2$ and $8\omega+3\delta-\gamma<0$
instead of $68\varpi+14\delta<1$ (at $\gamma=\frac12$ the first is $48\omega+14\delta<1$, weaker than [1]'s condition);
(d) level $x^{1/2+2\omega}$ exactly instead of $Q\lessapprox x^{1/2+2\varpi}$; (e) residue for one $I$ (primes $\le x$)
instead of every bounded $I$. The discrepancy (unrestricted) agrees with [1].
**Judgement: the Lean is stronger than [1] Thm 2.8(iv) on the decisive clauses** (moduli without dense divisibility, a
wider $N$-range, weaker numerics near $\gamma=\frac12$) and weaker only on the level's $x^{o(1)}$ and the choice of $I$; it is
[2]'s Lemma 3 (proved in [2] by a sketch of changes to [1]), not [1]'s theorem.
