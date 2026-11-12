# Conventions shared by the seven readings (step 2: Lean read after step 1 was committed)

Lean: AxiomMath/BGP212 @ 6641780bb6bab050fd400a348ba759d233e34fad, `Gap212Challenge/Basic.lean`
(sha256 0658163beaefecd4a851565d9e9ee7a2a8065ae5a3eb9a003091436c93b242fb, 718 lines). Line numbers below are that
file's. A reading, not a decision.

## D. The discrepancy's n-range — the one difference that is NOT harmless

- **Lean.** Every estimate concludes `HasEquidistribution x D f a A C` (l.149–150):
  `∑ d ∈ D with Squarefree d, ‖sumError f d a‖ ≤ C * x / (log x) ^ A`, and `sumError` (l.142–144) is
  `(∑ᶠ n ∈ {n | n ≡ a [MOD d]}, f n) - (1/φ(d)) * ∑ᶠ n ∈ {n | Coprime n d}, f n` — **all n ∈ ℕ**.
  The [x, 2x] version `sumErrorDyadic` (l.135) is defined and used nowhere.
- **[2]** Definition 7 (used by Lemmas 3–7) and Definition 3 / Proposition 2: **n ∈ [x, 2x]** in both the progression
  sum and the main term.
- **[1]** Δ(α; a (q)) sums over **all n** — the Lean uses [1]'s convention with [2]'s moduli and conditions.

**Is the range made irrelevant by the support? No.** For f = α ⋆ β the Lean's hypotheses put the support in
[scaleLo²·asympLo·x, scaleHi²·asympHi·x]. That lies in [x, 2x] only when scaleLo²·asympLo ≥ 1 and
scaleHi²·asympHi ≤ 2. `ConstantBundle` (l.44–59) imposes only 0 < scaleLo < scaleHi and 0 < asympLo < asympHi, and
every estimate is `∀ K`. Example: K with (scaleLo, scaleHi, asympLo, asympHi) = (1, 2, 1, 4), α = 1_{n=M},
β = 1_{n=N} with M N = 3x. Point masses are located coefficient sequences, and they meet the Lean's SW bound once
S(B) is large, because the discrepancy is ≤ 2 and N/(1+log N)^B has a positive minimum on N ≥ 1. Then
f = 1_{n=3x}. [2]'s sum over [x, 2x] is 0, while the Lean's sum is the all-n discrepancy of a point mass at 3x, so
the two quantities differ. [2]'s own constants are equally arbitrary ("1 ≪ c ≪ C ≪ 1", "M N ≍ x"), which is why
[2] cuts to [x, 2x] explicitly.

**Neither direction follows by a short argument (incomparable):**
- *Lean ⇒ [2]:* [2]'s quantity is the all-n discrepancy of f·1_{[x,2x]}, which is not a convolution of located
  sequences in the Lean's class. Getting it needs the condition x ≤ mk ≤ 2x separated (a Perron or
  finer-than-dyadic argument that must keep the Siegel–Walfisz property of the pieces). The Lean hypothesis does
  not contain that argument.
- *[2] ⇒ Lean:* the obvious bridge splits the support into O(1) intervals [y, 2y) with y ≍ x and applies [2] at each
  y. But [2]'s moduli set D(y; ω, γ_y, δ; ε), its bound y^{1/2+2ω} and its residue condition (coprime to primes ≤ y)
  are taken at y, not x. Matching them to the Lean's sets at x means choosing (ω, δ, ε) again inside the room θ and
  changing a by CRT (that works). It also needs N ≤ y^{1/2} exactly (Lemmas 3, 4, 6). That fails for pieces with y < x
  when N is within a constant factor of x^{1/2}, which the Lean allows (γ₂ = 1/2). So the bridge is not literal.

In words: the Lean asks for the whole convolution to be equidistributed, and [2] proves the [x, 2x] slice. They
cover the same mathematics up to standard but non-trivial arguments, and neither is a restatement of the other.

## H. Differences that are harmless (each with its argument)

1. **ℂ- vs ℝ-valued sequences** (Lean `ℕ → ℂ`; [1], [2] Def. 6 real). The Lean's class is bigger. Recovered from the
   real case by linearity. Re/Im parts keep the coefficient bound (|Re α| ≤ |α|), the support, and Siegel–Walfisz,
   because the SW sum of Re β is Re of the SW sum, since the weights 1 and 1/φ(q) are real. Smoothness also passes
   to Re ψ and Im ψ (same support, derivatives bounded by |ψ^{(j)}|). α ⋆ β splits into 4 real convolutions (16 for
   Type III) and the triangle inequality finishes. The same holds under a sup over a (BV).
2. **Coefficient bound `C τ(n)^k (1+log n)^l` (l.75–76) vs `τ(n)^{O(1)} log(x)^{O(1)}`.** For a located sequence
   n ≤ scaleHi·asympHi·x, so the Lean bound implies the source bound. Conversely, a source α with
   |α| ≤ C τ^k log^l x gives α/log^l x in the Lean class. The discrepancy is linear, so apply the Lean at A + l. Equivalent.
3. **Siegel–Walfisz `S(B) τ(qr)^{E(B)} N/(1+log N)^B` (l.123–127) vs `τ(qr)^{O(1)} N/log^A x`, and smooth
   derivative bound `b j (log N)^{m j}` (l.95–99) vs `log(x)^{O_j(1)}`.** When x^c ≪ N ≤ x^{O(1)} for a fixed c > 0,
   1 + log N ≍ log x and the two bounds are equivalent up to constants. Every scale that carries SW or smoothness
   in the seven hypotheses meets that condition: N ≥ x^{γ₁} (Types II, Ib, BI, Stadlmann); N_i ≥ asympLo·x^{1−2κ} with
   κ < 1/2 (Type III); N ≥ x^{ξ₁−ϵ}, M, N ≥ x^{ξ₂−ϵ}/O(1), N_i ≥ x^{1−2ξ₃−ϵ} = x^{1/5−ϵ} (Harman classes);
   M, N ≥ x^ξ (BV). E may depend on B. That is within "≪_A τ(qr)^{O(1)}" in [2] and [1]'s fixed-quantity convention.
4. **One `ConstantBundle` for all supports, scale products and pairwise bounds.** Take minima/maxima of a family's
   own constants; every estimate is `∀ K`.
5. **x ≥ 3 instead of x > 1 / x large.** For x in a bounded range everything is bounded by a constant.
6. **M, N ≥ 1.** A nonzero located sequence at scale N has N ≥ 1/scaleHi. Rescale to scale 1 with other constants.
7. **a : ℕ with `CoprimeBelow a x` (l.116) vs a ∈ ℤ coprime to every p ≤ x.** The sums depend only on a mod each
   d. Replace a by a + tL, with L the product of the primes ≤ x and of the moduli, and t large. The coprimality
   condition is [2] Def. 7's, word for word (p ≤ x).
8. **`∑ᶠ` and the value at 0.** `dconv α β 0 = 0` (`Nat.divisors 0 = ∅`). α 0 enters a SW sum only when q = r = 1,
   where the two sums cancel. Supports are finite, so every `∑ᶠ` is a genuine finite sum.
9. **Uniformity: C chosen before δ, x, the sequences, the scales and a; γ = log N / log x free in [γ₁, γ₂].** This is
   the note after [2] Lemma 3: with room to spare, ε can be chosen uniformly and the implied constant does not
   depend on the triple. It is read together with the standard convention that constants depend only on the
   sequences' constants (a family that matches the data at one x and is zero elsewhere is admissible).
10. **Strict inequalities vs `… + θ ≤ …` for all θ > 0** is "with room θ". Every strict instance has some room.
11. **Left-associated `dconv (dconv (dconv α ψ₁) ψ₂) ψ₃`.** Dirichlet convolution is associative on n ≥ 1, and both
    sides are 0 at n = 0.
12. **`moduliRange` = `Icc 1 ⌊x^{1/2+2ω}⌋₊`** is exactly [1, x^{1/2+2ω}] ∩ ℕ.

## R. Restrictions the Lean adds (the Lean is weaker on these axes)

- ω ∈ (0, 1/4) in the four bilinear estimates, and ω ∈ (0, 1/12), κ ∈ (0, 1/2), δ ∈ (0, 1/4 + ω) in Type III. [2]'s
  lemmas state no such range. For instances that are not vacuous, the lemmas' own inequalities already force
  ω < 1/24 or smaller (Type III: κ ≥ 1/3 is needed for x^{1−2κ} ≪ x^κ, which then gives ω < 1/28, δ < 1/8,
  κ < 4/9). The one real exclusion is ω ≤ 0, which [2] does not exclude. The Lean claims less there.
