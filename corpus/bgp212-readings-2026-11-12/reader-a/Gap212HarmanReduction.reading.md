# Gap212HarmanReduction — the Lean statement read against the source

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `Gap212HarmanReduction.source.md` (commit
`c777708`). A reading, not a decision.

## The Lean statement, quoted

```lean
/-- [2, Proposition 2] at the chosen parameters: the support of `gap212Params`, and the
Harman parameters `(ξ₁, ξ₂, ξ₃) = (19/50, 2/5, 2/5)`. These satisfy the five scalar inequalities
[2, Proposition 2] requires: `2ξ₁ + 3ξ₂ = 49/25 < 2`, `ξ₂ ≤ ξ₃`, `ξ₁ + 9ξ₂ = 199/50 < 4`,
`2ξ₁ + ξ₂ = 29/25 > 1`, and `17ξ₂ = 34/5 < 7`. These are the exact rational forms of
`(0.38, 0.4, 0.4)`; the support datum is the one defined in this file. -/
def Gap212HarmanReduction : Prop :=                                    -- lines 644-650
  HarmanReduction gap212Params (19 / 50) (2 / 5) (2 / 5)

def HarmanReduction (p : SupportParams) (ξ₁ ξ₂ ξ₃ : ℝ) : Prop :=          -- lines 635-642
  (∀ K : ConstantBundle, ∀ ε₀ > (0 : ℝ), ∀ A > (0 : ℝ), ∃ C : ℝ,
    ∀ x ≥ (3 : ℝ), ∀ f : ℕ → ℂ, ∀ a : ℕ,
    HarmanClass K x ξ₁ ξ₂ ξ₃ f → CoprimeBelow a x →
    HasEquidistributionOverQstar p x ε₀ f a A C) →
  ∀ ε₀ > (0 : ℝ), ∀ A > (0 : ℝ), ∃ C : ℝ,
  ∀ x ≥ (3 : ℝ), ∀ a : ℕ, CoprimeBelow a x →
  HasEquidistributionOverQstar p x ε₀ (primeInterval x) a A C
```

It unfolds to (quoted from the file): `slack := 1 / 10 ^ 10` (line 536); `TypeI`, `TypeII`, `TypeIII`, `HarmanClass`
(lines 540-585: Type I = `dconv α β`, both coefficient sequences, located, `asympEq (M*N) x`, `β` smooth,
`x ^ (ξ₁ - slack) ≤ N`; Type II = both coefficient sequences, located, `asympEq`, `HasSiegelWalfisz α M ∧ HasSiegelWalfisz β N`,
`x ^ (ξ₂ - slack) ≤ N ∧ N ≤ x ^ (1 - ξ₂ + slack)`; Type III = left-associated quadruple convolution, four coefficient
sequences, `α` located, `ψᵢ` smooth, `asympEq (M*N₁*N₂*N₃) x`, `x^(1-2ξ₃-slack) ≤ Nᵢ ≤ x^(ξ₃+slack)`,
`x^(1-ξ₃-slack) ≤ NᵢNⱼ`); `Qgen`, `Qstar` (lines 598-613: `q = e e' ∏ fᵢ ∏ f'ᵢ`, `1 ≤ q ≤ x`, `∏f ≤ x^((1-ε₀) B j m)`,
`∏f' ≤ x^((1-ε₀) B j' m')`, `e ∏f ≤ x^((1-ε₀)(A j.succ - ε))`, `e' ∏f' ≤ x^((1-ε₀)(A j'.succ + ε))`, every prime factor of
`e e'` `< x^δ`, every `fᵢ, f'ᵢ ≥ x^δ`; union over `j, j' : Fin n` and `m, m' ≤ ⌊1/δ⌋₊`); `HasEquidistributionOverQstar`
(line 620: `HasEquidistribution x {q ∈ Finset.Icc 1 ⌊x⌋₊ | q ∈ Qstar p x ε₀} f a A C`); `primeIndicator`, `primeInterval`
(lines 623-629: the prime indicator times `1_{n ∈ dyadic x}`); `gap212Params` (lines 470-508: one band, `δ = 41/2500`,
`ε = 1/125`, `A = (-1/125, 257/1000)`, cap row `gap212Cap` = `(0, 777, 794, 875, 917, 953, 983, 1016, 1042, 1063, 1081, 1081, …)/5000`).

## READING against [2] Proposition 2 and Definition 9: MISMATCH

**Clause 1 (main): the antecedent's discrepancy.** [2]'s hypothesis (4.1) bounds, for $f\in\mathcal H$, the discrepancy
over $n\in[x,2x]$; the Lean's antecedent bounds `sumError f` over all $n$ (via `HasEquidistributionOverQstar` →
`HasEquidistribution`). The conclusion, by contrast, is cut to $[x,2x]$ (`primeInterval x`), which matches Def. 3 for
$\rho=1_{\mathbb P}$. So the Lean implication is "unrestricted bounds for the class ⇒ restricted bound for the primes",
while [2]'s is "restricted ⇒ restricted". **Judgement: incomparable as stated** — the Lean premise is [2]'s Proposition 2
composed with an unstated passage between the two discrepancies, not an instance of it.

**Clause 2 (minor): only conclusion (2) is carried.** [2] concludes (1) $-c_2\le\rho\le1_{\mathbb P}$, (2) Def. 3, (3) all
prime factors $>x^{1-2\xi_2}$, (4) $\sum_{[x,2x]}\rho=(1-c_1+o(1))x/\log x$; the Lean carries only (2), for
$\rho=1_{\mathbb P}$. Judgement: weaker by omission, but the omitted ones are trivial at $\xi_2=\frac25$ — the source's own
note says $\rho=1_{\mathbb P}$ when $\xi_2\le\frac4{10}$, so (1) and (3) are immediate and (4) is the prime number theorem
with $c_1=0$. The degeneration is right as read: $\Gamma_2$ needs $\frac15<\alpha_2<\alpha_1$ with $\alpha_1+\alpha_2<\frac25$,
impossible; $\Gamma_2^*$ needs $\frac15<\alpha_i<8\cdot\frac25-3=\frac15$, an empty interval.

**Clause 3 (negligible): the antecedent's residues.** [2]'s hypothesis uses $(a,P(x))=1$ with $P(x)=\prod_{p<x}p$; the
Lean's antecedent uses `CoprimeBelow a x` ($p\le x$), so it asks for the bound for fewer residues when $x$ is itself a prime.
Judgement: on this clause the Lean is (negligibly) stronger.

Clauses that match (as read): $\mathcal H(\xi_1,\xi_2,\xi_3)$ — the three classes with $\epsilon=10^{-10}$, Type II with
Siegel-Walfisz on BOTH factors, Type I with $\beta$ smooth and no upper bound on $N$, Type III with no implied constants in
the scale bounds; $Q$ and $Q^*$ of Def. 2 including the asymmetric $A_j-\varepsilon$ / $A_{j'}+\varepsilon$ and the strict
$x^\delta$-smoothness of $ee'$ ([2] §1: "prime factors ... of size less than $y$"); the conclusion's quantifiers
`∀ ε₀ ∀ A ∃ C ∀ x ∀ a` = Def. 3; the parameters $(\xi_1,\xi_2,\xi_3)=(0.38,0.4,0.4)$ — the same as [2]'s proof of
Theorem 1 — satisfy the five inequalities (my arithmetic: $1.96<2$, $0.4\le0.4$, $3.98<4$, $1.16>1$, $6.8<7$); the support
datum differs from [2]'s, but Proposition 2 is stated for an arbitrary $T_k(\delta,\underline A,\underline B,\varepsilon)$, and the
datum satisfies Def. 1 (its cap steps are at most $0.0162\le\delta=0.0164$; the file proves the chain conditions).
`B j 0 = 0` is an addition for the $m=0$ term, consistent with the empty product.

Harmless differences (my reasoning): the antecedent's constant is uniform over the class for each `ConstantBundle`,
where [2] writes a per-$f$ bound "$\ll_{A,\varepsilon_0}$" over $x$-indexed families — equivalent by the usual diagonal
argument, since members at bounded $x$ are uniformly bounded for fixed `K`; single-scale witnesses at each $x$ instead
of $x$-indexed sequences; the `log` conventions (every class has its scales $\ge x^{c}$, $c>0$, except possibly $M$ in Type
I, where the coefficient bound `(1 + log n)^l` is narrower than $\log(x)^{O(1)}$ but recovered by rescaling with a power of
$\log x$, absorbed by $A$); `x ≥ 3`.

**Overall judgement: incomparable** (Clause 1), negligibly stronger on residues (Clause 3), weaker by omitting conclusions
that are trivial at these parameters (Clause 2). Whether the antecedent follows from the five type estimates at this datum
(the file says it "is derived from the analytic assumptions and the support data", line 530-531) is out of scope here.
