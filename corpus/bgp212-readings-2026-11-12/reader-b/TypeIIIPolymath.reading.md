# TypeIIIPolymath — reading (Lean l.296–322 against `TypeIIIPolymath.source.md`)

**READING: MISMATCH** against [2] Lemma 7, and a different statement from [1] Theorem 2.8(v).
**Direction: incomparable.**

## The differing clause
The conclusion `HasEquidistribution x (moduliIII x ω δ) (dconv (dconv (dconv α ψ₁) ψ₂) ψ₃) a A C` sums `sumError`
over **all n**, where [2] Definition 7 sums over **n ∈ [x, 2x]** (`conventions.reading.md` §D).

## Clause by clause against [2] Lemma 7 (κ in the Lean is [2]'s γ)
- α located at M. ψ₁, ψ₂, ψ₃ smooth at N₁, N₂, N₃. All four are coefficient sequences under K. Match (H1–H4). The
  smooth derivative bounds are equivalent because N_i ≥ asympLo·x^{1−2κ} with κ < 1/2 (H3).
- M N₁ N₂ N₃ ≍ x: `K.asympEq`. Match.
- N_iN_j ≫ x^{1−γ}: `K.asympLo * x^(1−κ) ≤ Nᵢ * Nⱼ` for all three pairs. x^{1−2γ} ≪ N_i ≪ x^γ:
  `K.asympLo * x^(1−2κ) ≤ Nᵢ ≤ K.asympHi * x^κ`. Match: the ≪ constants are K's, which is harmless by H4.
- 28ω + 9γ + 8δ < 4: `28ω + 9κ + 8δ + θ ≤ 4`. Match (H10).
- `moduliIII` (l.205–207): `moduliRange x ω`, ∃ r ∣ d, x^{1/3+4δ/3−4ω/3−δ} < r < x^{1/3+4δ/3−4ω/3}. Exact, and like
  [2] the window does not depend on ε or κ.
- Quantifier order: K, ω, κ, δ, θ, then ε₀, then ε, then A, then C, then x and data. [2] Lemma 7 lets the ε-threshold
  and constant depend on the triple, so this matches without even needing [2]'s uniformity note.
- Convolution association: harmless (H11).
- n-range: **mismatch** (§D).
- **Ranges imported from [1]:** ω ∈ (0, 1/12), κ ∈ (0, 1/2), δ ∈ (0, 1/4 + ω). [2] Lemma 7 has none of these. Lean
  weaker. For instances that are not vacuous they are implied. The scale conditions need κ ≥ 1/3 once x is large,
  because asympLo·x^{1−2κ} ≤ asympHi·x^κ. Then 28ω + 9κ + 8δ < 4 gives ω < 1/28, δ < 1/8, κ < 4/9. The one real
  exclusion is ω ≤ 0.

## Against [1] Theorem 2.8(v)
Mapping σ = 1/2 − κ sends [1]'s scale conditions (N_iN_j ≳ x^{1/2+σ}, x^{2σ} ≲ N_i ≲ x^{1/2−σ}) onto the Lean's.
[1]'s ≲ allows x^{o(1)} slack, whereas the Lean's bounds carry only constants, so the Lean asks for less there.
[1]'s condition σ > 1/18 + 28ϖ/9 + 2δ/9 becomes 28ϖ + 9κ + **2δ** < 4. The Lean has **8δ** ([2]'s), a strictly
smaller parameter region. [1]'s moduli are x^δ-densely divisible, squarefree and in I, with a coprime to P_I. The
Lean has [2]'s single-window D_III. The Lean takes only ϖ < 1/12 and δ < 1/4 + ϖ from [1]. Not a restatement of
2.8(v).

## Net
The Lean matches [2] Lemma 7 except for the n-range (incomparable) and the parameter ranges borrowed from [1]
(weaker, and harmless apart from excluding ω ≤ 0).
