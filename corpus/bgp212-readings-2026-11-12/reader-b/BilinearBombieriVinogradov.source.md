# BilinearBombieriVinogradov — what the cited source states (step 1, Lean not read)

Cited (per the task): [1] Theorem 2.9. Definitions used: `definitions.source.md` ([1] Def. 1.2, Def. 2.5, the
discrepancy Δ).

## [1] Polymath v3, Theorem 2.9 (Bombieri–Vinogradov theorem), verbatim

> Let N, M ≫ 1 be such that NM ~ x and N ≥ x^ε for some fixed ε > 0. Let α, β be coefficient sequences at scale
> M, N respectively such that β has the Siegel-Walfisz property. Then for any fixed A > 0 there exists a fixed B > 0
> such that
>   Σ_{q ≤ x^{1/2} log^{−B} x} sup_{a ∈ (ℤ/qℤ)^×} |Δ(α ⋆ β; a (q))| ≪ x log^{−A} x.

(Followed by: "See [BFI, Theorem 0] for the proof.")

### Every quantifier, range, convention (my words)
- **Asymptotic frame ([1] Def. 1.2):** x is a large real parameter; M, N, α, β may depend on x; "fixed" = independent
  of x; ≪ has a fixed implied constant; the estimate is asserted for x sufficiently large, uniformly over all
  admissible non-fixed data.
- **Scales:** M, N ≫ 1; N M ~ x means x ≪ NM ≪ x (two-sided, fixed constants — NOT asymptotic equality); N ≥ x^ε
  for some fixed ε > 0 (a lower bound on the scale of the Siegel–Walfisz factor; no upper bound on N).
- **Sequences:** coefficient sequences ([1] Def. 2.5): finitely supported α, β: ℕ → ℝ (may depend on x),
  |·| ≪ τ^{O(1)}(n) log^{O(1)} x; α located at scale M (support in [cM, CM], 1 ≪ c < C ≪ 1), β located at scale N.
  β has the Siegel–Walfisz property: |Δ(β 1_{(·,r)=1}; a (q))| ≪ τ(qr)^{O(1)} N log^{−A} x for all q, r ≥ 1, every
  fixed A, every primitive a (q). No hypothesis on α beyond being a located coefficient sequence.
- **Order of quantifiers in the conclusion:** for every fixed A > 0 there EXISTS a fixed B = B(A) > 0 (B may depend
  on A and on the other fixed data, e.g. ε and the implied constants in the sequence bounds).
- **Moduli:** ALL q with 1 ≤ q ≤ x^{1/2} (log x)^{−B} (no squarefree, smoothness or dense-divisibility condition).
- **Residue:** **sup over all primitive classes a mod q**, separately for each q (the worst residue per modulus) —
  stronger than a fixed a.
- **Discrepancy:** Δ(α ⋆ β; a (q)) = Σ_{n ≡ a (q)} (α ⋆ β)(n) − (1/φ(q)) Σ_{(n,q)=1} (α ⋆ β)(n), sums over ALL n ∈ ℕ
  (α ⋆ β has finite support ⊂ [cc′x, CC′x] roughly); no cut to [x, 2x].
- **Bound:** ≪ x (log x)^{−A}.
