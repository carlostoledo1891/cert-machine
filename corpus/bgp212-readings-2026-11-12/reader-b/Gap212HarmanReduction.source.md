# Gap212HarmanReduction — what the cited source states (step 1, Lean not read)

Cited (per the task): [2] Proposition 2 and Definition 9. Definitions used: `definitions.source.md`
(Definitions 1, 2, 3, 6 of [2]).

## [2] Stadlmann, Definition 9 (Decomposition), verbatim

> Let ϵ = 10^{−10} and let ξ₁, ξ₂, ξ₃ ∈ (0,1). Then H(ξ₁,ξ₂,ξ₃) denotes the set of functions
> f: ℕ × (1,∞) → ℂ which satisfy one of the following three conditions:
> (I) f(n;x) = (α ⋆ β)(n;x), where α is a coefficient sequence at scale M and β is a smooth coefficient sequence at
> scale N with M(x)N(x) ≍ x. Additionally, N(x) = x^{γ(x)} with γ(x) ≥ ξ₁ − ϵ.
> (II) f(n;x) = (α ⋆ β)(n;x), where α is a coefficient sequence at scale M, β is a coefficient sequence at scale N
> with M(x)N(x) ≍ x, and α and β both have the Siegel–Walfisz property. Additionally, N = x^{γ(x)} with
> ξ₂ − ϵ ≤ γ(x) ≤ 1 − ξ₂ + ϵ.
> (III) f(n;x) = (α ⋆ ψ₁ ⋆ ψ₂ ⋆ ψ₃)(n;x), where α is a coefficient sequence at scale M and ψ₁, ψ₂ and ψ₃ are smooth
> coefficient sequences at scales N₁, N₂ and N₃ with M(x)N₁(x)N₂(x)N₃(x) ≍ x. Additionally,
> x^{1−2ξ₃−ϵ} ≤ N₁(x), N₂(x), N₃(x) ≤ x^{ξ₃+ϵ} and N_i(x)N_j(x) ≥ x^{1−ξ₃−ϵ} for i ≠ j.

### Conventions (my words)
- ϵ (\epsilon) = 10^{−10} is a fixed number, distinct from the ε (\varepsilon) of Definitions 1, 2, 7.
- γ(x) is explicitly allowed to depend on x here.
- (I): β smooth; lower bound only on N (γ(x) ≥ ξ₁ − ϵ); no upper bound; α arbitrary located sequence.
- (II): BOTH α and β Siegel–Walfisz; N in [x^{ξ₂−ϵ}, x^{1−ξ₂+ϵ}] (symmetric in the roles of α and β).
- (III): exact (not ≪) inequalities x^{1−2ξ₃−ϵ} ≤ N_i ≤ x^{ξ₃+ϵ}, N_iN_j ≥ x^{1−ξ₃−ϵ}; α arbitrary.

## [2] Stadlmann, Proposition 2, verbatim

> Let T_k(δ,A,B,ε) be as given in Definition 1, let Q*(x;δ,A,B,ε,ε₀) be as given in Definition 2 and let
> H(ξ₁,ξ₂,ξ₃) be as given in Definition 9.
> Suppose ξ₁, ξ₂, ξ₃ ∈ (0,1) satisfy all of the following inequalities:
> 2ξ₁ + 3ξ₂ < 2,   ξ₂ ≤ ξ₃,   ξ₁ + 9ξ₂ < 4,   2ξ₁ + ξ₂ > 1,   17ξ₂ < 7.
> Suppose further that for every f ∈ H(ξ₁,ξ₂,ξ₃), x > 1, ε₀ > 0, A > 0 and a ∈ ℤ with (a, P(x)) = 1,
> Σ_{q ∈ Q*(x;δ,A,B,ε,ε₀), q squarefree} | Σ_{n ∈ [x,2x], n ≡ a (q)} f(n;x) − (1/φ(q)) Σ_{n ∈ [x,2x], (n,q)=1} f(n;x) |
>   ≪_{A,ε₀} x / log(x)^A.
> We then write p_j = x^{α_j} and define the minorant
> ρ(n;x) = 1_P(n) − Σ_{n = p₁p₂p₃p₄p₅; 1−2ξ₂ < α₄ < α₃ < α₂ < α₁ < ξ₂; α₁+α₂ < ξ₂; α₂+α₃+α₄ > 1−ξ₂; α₅ > α₄} 1
>                 − Σ_{n = p₂p₃p₄p₅p₆; 1−2ξ₂ < α₂,α₃,α₄,α₅,α₆ < 8ξ₂−3; α₂,α₄ > α₃; α₂+α₄ < ξ₂;
>                       α₃+α₄+α₅ > 1−ξ₂; α₆ > α₅} 1.
> Furthermore, we choose the constants
> c₁ = ∫_{1−2ξ₂}^{ξ₂} ∫_{1−2ξ₂}^{min{α₁, ξ₂−α₁}} ∫_{1−2ξ₂}^{α₂} ∫_{max{1−2ξ₂, 1−ξ₂−α₂−α₃}}^{min{α₃,(1−α₁−α₂−α₃)/2}}
>        dα / (α₁α₂α₃α₄(1−Σ_{i≤4}α_i))
>    + ∫_{1−2ξ₂}^{8ξ₂−3} ∫_{1−2ξ₂}^{min{8ξ₂−3, α₂}} ∫_{max{α₃,1−2ξ₂}}^{min{8ξ₂−3, ξ₂−α₂}}
>        ∫_{max{1−2ξ₂, 1−ξ₂−α₃−α₄}}^{min{8ξ₂−3,(1−Σ_{i=2}^4 α_i)/2}} dα / (Π_{i=2}^5 α_i (1−Σ_{i=2}^5 α_i)),
> c₂ = 24 if ξ₂ > 4/10, c₂ = 0 if ξ₂ ≤ 4/10.
> Then ρ(n;x) has the following properties:
> (1) Prime minorant: −c₂ ≤ ρ(n;x) ≤ 1_P(n) for all large x and n ∈ [x,2x].
> (2) ρ has equidistribution properties for moduli corresponding to T_k(δ,A,B,ε). (See Definition 3.)
> (3) If ρ(n;x) ≠ 0, then all prime factors of n exceed x^{1−2ξ₂}.
> (4) The sum of ρ(n;x) over [x,2x] satisfies Σ_{n ∈ [x,2x]} ρ(n;x) = (1 − c₁ + o(1)) x/log(x).

(Followed by: "Note: If ξ₂ ≤ 4/10, then ρ(n;x) is simply 1_P(n).")

### Every quantifier, range, convention (my words)
- **Fixed data:** a region T_k(δ, A, B, ε) (Def. 1: k, δ > 0, ε > 0, the A_j chain −ε = A₀ < … < A_n < 1/2 − ε, the
  n × ⌊1/δ⌋ matrix B with δ < B_{j,m} ≤ B_{j,m+1} ≤ B_{j,m} + δ); ξ₁, ξ₂, ξ₃ ∈ (0,1).
- **Five parameter conditions:** 2ξ₁ + 3ξ₂ < 2; ξ₂ ≤ ξ₃ (non-strict); ξ₁ + 9ξ₂ < 4; 2ξ₁ + ξ₂ > 1; 17ξ₂ < 7.
- **Equidistribution hypothesis:** for EVERY f in H(ξ₁,ξ₂,ξ₃) (all three types), every x > 1, every ε₀ > 0, every
  A > 0, every integer a with (a, P(x)) = 1 — note P(x) = Π_{p < x} p (strict; Definition 3 instead says (a,p)=1
  for p ≤ x, a harmless difference only when x is itself prime) — the sum over squarefree q ∈ Q*(x; …, ε₀) of the
  [x, 2x]-restricted discrepancy is ≪_{A,ε₀} x/log(x)^A. Moduli: the squarefree elements of Q* (Def. 2), which
  depend on (δ, A, B, ε, ε₀) and x. n-range [x, 2x]; one residue a; main term (1/φ(q)) Σ over n ∈ [x,2x] coprime to q.
- **Conclusion:** the explicitly defined ρ satisfies (1)–(4) with the explicitly defined c₁, c₂. In particular (2)
  is Def. 3 for ρ, and (4) is an asymptotic with main term (1 − c₁) x/log x. The conclusion is about THIS ρ (the
  explicit Buchstab/Harman minorant) and THESE constants, not merely the existence of some ρ.
- **Proof-only conditions:** the proof also uses 7ξ₂ < 3 and 12ξ₂ < 5 (both implied by 17ξ₂ < 7) and
  2(1 − ξ₁ − ξ₂) > ξ₂ (= the first condition). These are not separate hypotheses of the statement.
- **What "Gap212" could mean is not in [2]:** [2] Theorem 1 states H₁ ≤ 240 (k = 49). Nothing in Prop. 2 or Def. 9
  mentions 212; Prop. 2 is stated for an arbitrary region T_k and does not by itself conclude any bound on H₁
  (that is Prop. 1, which needs (1)–(4) together with an integral inequality).
