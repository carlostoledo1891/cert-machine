# The definitions the seven premises unfold to — quoted, and read against the sources' conventions

Lean: github.com/AxiomMath/BGP212 at `6641780bb6bab050fd400a348ba759d233e34fad`, `Gap212Challenge/Basic.lean`
(Apache-2.0), 718 lines, sha256 `0658163beaefecd4a851565d9e9ee7a2a8065ae5a3eb9a003091436c93b242fb`, git blob
`428215260c5baf99fa07b1202cf99a0de6a966c8` (re-hashed: the fetched bytes are that blob). Opened only after commit
`c777708` (the seven source readings). Line numbers below are this file's. A reading, not a decision.

## What the Lean file itself says about its sources

- Lines 22-24: "The declarations, rather than their source descriptions, specify the exact hypotheses of the challenge."
- Lines 26-29: sources "1. Polymath, *New equidistribution estimates of Zhang type*, https://arxiv.org/abs/1402.0811" and
  "2. Julia Stadlmann, *Bounded gaps between primes*, https://arxiv.org/abs/2608.31126". **No arXiv version is named**,
  so the readings use v3 of [1] (the only version with the cited numbering) and v1 of [2] (the only version). The Lean
  titles [1] correctly; the title "Variants of the Selberg sieve..." in the brief is a mislabel of the brief, not of the file.
- Lines 697 (`thm_main`): "The bound `212` does not appear in [1] or [2]; [2, Theorem 1] states `H₁ ≤ 240` at `k = 49`."
- Line 514 (`Gap212Certificate`): "The dimension `k = 45` is specific to this certificate; [2, Theorem 1] is proved at `k = 49`."
- Lines 443-445 (`gap212Cap`): "These values are specific to this datum; [2] instead takes `B_{1,1} = B_{1,2} = 0.15` and
  `B_{1,m} = 0.17` for `m ≥ 3` at `δ = 0.028`, `ε = 0.0075` and `k = 49`." (Agrees with my reading of [2]'s proof of Theorem 1.)
- Lines 402-403 (`Kregion`, out of scope here): "unlike the printed region in [2, Definition 5]" — a declared departure.
- Lines 113-115 (`CoprimeBelow`): "the `(a, p) = 1` for all primes `p ≤ x` of [2, Definition 3], written `(a, P(x)) = 1`
  in [2, Notation]". As read, [2]'s Notation defines $P(y)=\prod_{p<y}p$ (strict), so $(a,P(x))=1$ is $p<x$, not $p\le x$;
  and "`a (P_I)` primitive in [1, Definition 2.2]" — the primitive class is introduced in [1] Definition 2.6, not 2.2.
  Two small citation slips in docstrings; the definitions themselves are what is read.

## The shared definitions, quoted

```lean
structure ConstantBundle : Type where            -- lines 44-59
  coeffConst : ℝ;  coeffFstPow : ℕ;  coeffSndPow : ℕ
  scaleLo : ℝ;  scaleHi : ℝ;  asympLo : ℝ;  asympHi : ℝ
  smoothConst (j : ℕ) : ℝ;  smoothPow (j : ℕ) : ℕ
  siegelWalfiszConst (B : ℝ) : ℝ;  siegelWalfiszPow (B : ℝ) : ℕ
  scaleLo_pos : 0 < scaleLo;  scaleLo_lt_scaleHi : scaleLo < scaleHi
  asympLo_pos : 0 < asympLo;  asympLo_lt_asympHi : asympLo < asympHi

def ConstantBundle.asympEq (K : ConstantBundle) (x y : ℝ) : Prop :=          -- line 62
  K.asympLo * y ≤ x ∧ x ≤ K.asympHi * y

def IsCoefficientSequence (C : ℝ) (k l : ℕ) (α : ℕ → ℂ) : Prop :=             -- line 75
  ∀ n ≥ (1 : ℕ), ‖α n‖ ≤ C * (n.divisors.card : ℝ) ^ k * (1 + log n) ^ l

def LocatedAtScale (c₀ c₁ : ℝ) (α : ℕ → ℂ) (N : ℝ) : Prop :=                  -- line 84
  ∀ n ≥ (1 : ℕ), α n ≠ 0 → c₀ * N ≤ (n : ℝ) ∧ (n : ℝ) ≤ c₁ * N

def IsSmoothAtScale (c C : ℝ) (b : ℕ → ℝ) (m : ℕ → ℕ) (α : ℕ → ℂ) (N : ℝ) : Prop :=   -- line 95
  ∃ ψ : ℝ → ℂ, open scoped ContDiff in ContDiff ℝ (∞ : ℕ∞ω) ψ ∧
  (∀ t : ℝ, ψ t ≠ 0 → t ∈ Set.Icc c C) ∧
  (∀ (j : ℕ) (t : ℝ), ‖iteratedDeriv j ψ t‖ ≤ b j * (log N) ^ m j) ∧
  ∀ n : ℕ, α n = ψ ((n : ℝ) / N)

def dconv (α β : ℕ → ℂ) : ℕ → ℂ := fun n ↦ ∑ d ∈ n.divisors, α d * β (n / d)   -- line 106

noncomputable def dyadic (x : ℝ) : Finset ℕ := Finset.Icc ⌈x⌉₊ ⌊2 * x⌋₊          -- line 111

def CoprimeBelow (a : ℕ) (x : ℝ) : Prop := ∀ p : ℕ, p.Prime → (p : ℝ) ≤ x → Nat.Coprime a p   -- line 116

def HasSiegelWalfisz (S : ℝ → ℝ) (E : ℝ → ℕ) (α : ℕ → ℂ) (N : ℝ) : Prop :=    -- line 123
  ∀ B > (0 : ℝ), ∀ q ≥ (1 : ℕ), ∀ r ≥ (1 : ℕ), ∀ a : ℕ, Nat.Coprime a q →
    ‖(∑ᶠ n ∈ {n : ℕ | n ≡ a [MOD q] ∧ Nat.Coprime n r}, α n) -
      (1 / (Nat.totient q : ℂ)) * ∑ᶠ n ∈ {n : ℕ | Nat.Coprime n (q * r)}, α n‖ ≤
    S B * ((q * r).divisors.card : ℝ) ^ E B * N / (1 + log N) ^ B

noncomputable def sumErrorDyadic (x : ℝ) (f : ℕ → ℂ) (d a : ℕ) : ℂ :=          -- line 135  (NEVER USED)
  ∑ n ∈ dyadic x with n ≡ a [MOD d], f n -
  (1 / (Nat.totient d : ℂ)) * ∑ n ∈ dyadic x with Nat.Coprime n d, f n

noncomputable def sumError (f : ℕ → ℂ) (d a : ℕ) : ℂ :=                         -- line 142
  (∑ᶠ n ∈ {n : ℕ | n ≡ a [MOD d]}, f n) -
  (1 / (Nat.totient d : ℂ)) * ∑ᶠ n ∈ {n : ℕ | Nat.Coprime n d}, f n

def HasEquidistribution (x : ℝ) (D : Finset ℕ) (f : ℕ → ℂ) (a : ℕ) (A C : ℝ) : Prop :=   -- line 149
  ∑ d ∈ D with Squarefree d, ‖sumError f d a‖ ≤ C * x / (log x) ^ A

noncomputable def moduliRange (x ω : ℝ) : Finset ℕ := Finset.Icc 1 ⌊x ^ (1 / 2 + 2 * ω)⌋₊   -- line 159
```

(The five moduli sets, lines 164-207, are quoted in the premise files that use them.)

## The shared clauses, read against [2] Definitions 6-7 and [1] Definitions 1.2, 2.5, (1.1)

| Clause | Source | Lean | Reading |
|---|---|---|---|
| **The sum over $n$ in the discrepancy** | [2] Def. 7: $\sum_{n\in[x,2x],\,n\equiv a(d)}f(n;x)-\frac1{\phi(d)}\sum_{n\in[x,2x],(n,d)=1}f(n;x)$. [1] (1.1): over all $n$. | `sumError`: `∑ᶠ` over all `n` (lines 142-144); `HasEquidistribution` uses `sumError`; `sumErrorDyadic` (the `[x,2x]` version) is defined and never used (grep: lines 135-137 only). | **Differs from [2]; agrees with [1].** The five type estimates bound the unrestricted discrepancy of $\alpha\star\beta$, whose support is $\approx[\text{scaleLo}^2MN,\text{scaleHi}^2MN]$, not $[x,2x]$. Neither literal form implies the other: cutting $n$ to $[x,2x]$ does not produce a convolution of sequences with the same hypotheses (a short-interval piece of a Siegel-Walfisz sequence need not be Siegel-Walfisz). |
| Coefficient bound | $\ll\tau^{O(1)}\log(x)^{O(1)}$, real-valued | $\le C\tau(n)^k(1+\log n)^l$ for $n\ge1$, complex-valued, constants in `K` | Equivalent up to constants on supports $n\ge x^{c}$, $c>0$ fixed (all bilinear estimates have $N\ge x^{\gamma_1}$, $M\gtrsim x^{1/2}$; BV has $M,N\ge x^\xi$). Complex vs real: harmless by splitting into real and imaginary parts (my reasoning). |
| Located at scale | support in $[cN,CN]$, fixed $c,C$ | `LocatedAtScale K.scaleLo K.scaleHi`, `n ≥ 1` only | Match (`α 0` never enters `dconv`, since `Nat.divisors 0 = ∅` and divisors are $\ge1$). |
| Smooth at scale | $\psi$ smooth on $[c,C]$, $|\psi^{(j)}|\ll_j\log(x)^{O_j(1)}$ | `ContDiff ℝ ∞ ψ`, support in `Icc c C`, `‖ψ^(j)‖ ≤ b j (log N)^(m j)` | Match up to constants where $N\ge x^{c}$, $c>0$ fixed (true in every use). |
| Siegel-Walfisz | $\ll_A\tau(qr)^{O(1)}N/\log(x)^A$, any $A>1$ | `S B * τ(qr)^(E B) * N / (1 + log N)^B`, any `B > 0`; the $\tau$-exponent may depend on `B` | Match where $N\ge x^c$; letting the exponent depend on $B$ is within the source's $O(1)$ (read as $A$-dependent under [1] Def. 1.2). |
| Residue | [2]: $a\in\mathbb Z$, $(a,p)=1$ for all primes $p\le x$; [1]: $a$ primitive mod $P_I$, any bounded $I$ | `a : ℕ`, `CoprimeBelow a x` ($p\le x$) | Match with [2] ($a\in\mathbb Z$ vs $\mathbb N$ harmless: shift $a$ by a multiple of $\prod_{p\le x}p$). Differs from [1] (one $I$ instead of every bounded $I$). |
| Squarefree moduli | [2]: in Def. 7's sum | `Squarefree d` filter | Match. |
| Range of $x$ | [2]: all $x>1$; [1]: $x$ large | `x ≥ 3` | Harmless: on a bounded range both sides are bounded and the constant absorbs it. |
| Constant | $\ll_{A,\varepsilon}$, implicitly also on the sequences' constants | `∃ C` after `K`, `ε`, `A` | Match (makes the implicit dependence on the sequences' constants explicit through `K`). |
| $\gamma$ | a fixed coordinate of the triple, $N(x)=x^\gamma$ | `log N / log x`, with `x^γ₁ ≤ N ≤ x^γ₂`, `0 < γ₁` | Match the source together with its uniformity note (one $\varepsilon$, one constant for triples with room to spare), which the Lean renders as `θ` and the band `[γ₁, γ₂]`. |
| Strict inequalities | strict, "with room to spare" for uniformity | `… + θ ≤ …`, `θ > 0` chosen first | Match (room $\theta$). |
| `moduliRange` | $[1,x^{1/2+2\omega}]\cap\mathbb N$ | `Icc 1 ⌊x^(1/2+2ω)⌋₊` | Match. |
