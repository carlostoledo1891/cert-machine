# Statement fidelity: Clay (C)/(D) ↔ Formal Conjectures ↔ OpenAI's Comparator challenge ↔ Mathlib

Record of 2026-09-09. Sources: `statements/clay-fefferman-navierstokes.pdf` (Fefferman's
official statement, with errata); `lean/formal-conjectures-NavierStokes-8bf45ed.lean`
(DeepMind, statement added 2026-05-15 in #1457, last touched 2026-07-27, byte-identical to
`main` on 2026-09-09); `lean/openai-ComparatorChallenges-NavierStokes.lean` (OpenAI's copy,
diffed: imports, attributes, namespace `NavierStokes.Comparator`, local notation, and the
removal of (A),(B) — nothing else); Mathlib at `85e3a25e` (the project's pin), file:line below
read from the checked-out package.

**The direction rule.** Both theorems have the shape ∃ u₀ f, H(u₀) ∧ H(f) ∧ ¬∃ v p, S(v,p).
The prover must *establish* H for the constructed data, and must *exclude* every (v,p) in S.
So a junk value or a weak definition inside S only makes the class larger and the theorem
stronger; a gap could hide only in (i) an S that is *stronger* than Clay's (6)(7)/(10)(11)
(excluding competitors Clay admits), or (ii) an H that is *weaker* than Clay's (4)(5)/(8)(9)
(admitting data Clay rejects). Every row below is checked in that direction.

## The competitor class S — Clay (1)(2)(3)(6)(7), and (10)(11) periodic

| Clay | Lean (Formal Conjectures) | Mathlib definition | direction |
|---|---|---|---|
| (1) ∂ₜu + Σⱼ uⱼ∂ⱼu = νΔu − ∇p + f on Rⁿ×[0,∞) | `derivWithin (v x ·) (Set.Ici 0) t + fderiv ℝ (v · t) x (v x t) = nu • Δ (v · t) x - gradient (p · t) x + f x t`, ∀ x, ∀ t ≥ 0 | `derivWithin f s x = fderivWithin 𝕜 f s x 1` (Deriv/Basic.lean:145) — the one-sided derivative at t = 0 within [0,∞), the two-sided one for t > 0 (Ici 0 has unique differentiability). `fderiv ℝ (v · t) x (v x t)` is the Jacobian applied to v, i.e. (v·∇)v. `Δ` is `Laplacian.laplacian` for `E → F` on a real inner-product space: the second derivative contracted with the canonical covariant tensor (InnerProductSpace/Laplacian.lean:139), equal to Σᵢ D²f(x)[eᵢ,eᵢ] for any orthonormal basis (line 173) — the ordinary Laplacian, componentwise for vector values. `gradient f x = (toDual ℝ F).symm (fderiv ℝ f x)` (Gradient/Basic.lean:82). | same equation; junk values (0 when non-differentiable) cannot arise for smooth v, p |
| (2) div u = 0 | `∇⬝ (v · t) x = 0`, `divergence v x := (fderiv ℝ v x).trace` | trace of the Jacobian | same |
| (3) u(x,0) = u° | `v x 0 = u₀ x` | — | same |
| (6) p, u ∈ C^∞(Rⁿ×[0,∞)) | `ContDiffOn ℝ ∞ (↿v) (univ ×ˢ Ici 0)` and the same for `↿p` | `∞` is `((⊤ : ℕ∞) : WithTop ℕ∞)` under `open ContDiff` (FTaylorSeries.lean:120): C^∞, **not** analytic (that is `ω`). `ContDiffWithinAt` for n < ω: ∀ m ≤ n, a formal Taylor series up to order m on a neighbourhood within `insert x s` (ContDiff/Defs.lean:131); `ContDiffOn` = at every point of the set (Defs.lean:472). On the closed half-space this is smoothness up to t = 0 in the Taylor-series sense, the standard meaning of C^∞ on a closed set with interior. | same |
| (7) ∫|u|² dx < C ∀ t | `integrable : ∀ t ≥ 0, MemLp (‖v · t‖) 2` and `globally_bounded_energy : ∃ E, ∀ t ≥ 0, (∫ x, ‖v x t‖ ^ 2) < E` | the Bochner integral of a non-integrable function is 0 (`integral_undef`, Bochner/Basic.lean:202); the `integrable` field forbids that escape, so `∫ ‖v‖² < E` is the honest energy bound | same (the pair of fields together equals (7)) |
| (10) u periodic in x | `∀ t ≥ 0, IsOnePeriodic (v · t)`, `IsOnePeriodic f := ∀ x i, f (x + EuclideanSpace.single i 1) = f x` | `EuclideanSpace.single i a = toLp 2 (Pi.single i a)` (Normed/Lp/PiLp.lean:150): the unit vectors | same |
| errata: p periodic | `∀ t ≥ 0, IsOnePeriodic (p · t)` | — | same as Clay + errata |
| (11) p, u ∈ C^∞ | as (6) | — | same |

No field of S is stronger than Clay's. There is no decay, growth, or integrability condition on p
or on ∇v anywhere in S — the Lean uniqueness argument must therefore handle a competitor whose
pressure is merely smooth (Lemma 10.5 in the paper claims exactly that; the Lean counterpart is
being located — see the Lean map memo).

## The data hypotheses H — Clay (4)(5), and (8)(9) periodic

| Clay | Lean | Mathlib | direction |
|---|---|---|---|
| u° smooth, div-free, (4) ∀α,K: |∂ᵅu°| ≤ C_{αK}(1+|x|)^{−K} | `InitialVelocityConditionDecay`: div-free, `ContDiff ℝ ∞ u₀`, `∀ m K, ∃ C, ∀ x, ‖iteratedFDeriv ℝ m u₀ x‖ ≤ C / (1 + ‖x‖) ^ K` | `iteratedFDeriv` is the m-th Fréchet derivative as a multilinear map (FTaylorSeries.lean:398 for the within-version); its operator norm is comparable to the max of the order-m partials up to dimensional constants absorbed by C; `K : ℝ` with a real power | equivalent to (4); the paper uses u° = 0 |
| f smooth on Rⁿ×[0,∞), (5) ∀α,m,K: |∂ₓᵅ∂ₜᵐf| ≤ C(1+|x|+t)^{−K} | `ForceConditionDecay`: `ContDiffOn ℝ ∞ (↿f) (univ ×ˢ Ici 0)` and `∀ m K, ∃ C, ∀ x, ∀ t ≥ 0, ‖iteratedFDerivWithin ℝ m (↿f) (univ ×ˢ Ici 0) (x,t)‖ ≤ C / (1 + ‖x‖ + t) ^ K` | one total space-time order m instead of Clay's split (α, m): equivalent, since every mixed partial of total order m is a component of the m-th derivative | equivalent to (5); a C_c^∞(R³×(0,∞)) force satisfies it trivially |
| (8) u° periodic; f periodic in x | `InitialVelocityConditionPeriodic` (smooth, div-free, `IsOnePeriodic`), `ForceConditionPeriodic.isOnePeriodic : ∀ t ≥ 0, IsOnePeriodic (f · t)` | — | same |
| (9) |∂ₓᵅ∂ₜᵐf| ≤ C(1+|t|)^{−K} | `‖iteratedFDerivWithin ℝ m (↿f) (univ ×ˢ Ici 0) (x,t)‖ ≤ C / (1 + t) ^ K` | — | same |

No hypothesis of H is weaker than Clay's. `∃ C : ℝ` cannot be gamed with a negative C (the
left side is a norm).

## What the theorem shapes say

- (C) `navier_stokes_breakdown_R3 (nu) (hnu : nu > 0) : ∃ u₀ f, InitialVelocityConditionDecay u₀ ∧ ForceConditionDecay f ∧ ¬ (∃ v p, NavierStokesExistenceAndSmoothnessRn nu u₀ f v p)` — Clay (C) verbatim: "there exist u°, f satisfying (4),(5) for which there exist no solutions (p,u) of (1),(2),(3),(6),(7)".
- (D) `navier_stokes_breakdown_periodic` likewise with (8),(9) and (10),(11)+errata.
- The dimension is `Fin 3` (ℝ³ := EuclideanSpace ℝ (Fin 3)); ν is any positive real.

## Verdict of this table

The formal statement OpenAI's Lean proof targets is Clay's (C) and (D) with no hypothesis
added to the competitor class and none dropped from the data; the definitions were written by
a third party (DeepMind's Formal Conjectures) three and a half months before the proof
existed and have not changed since. What this table does not settle, and what the rest of the
audit is for: (i) whether `ComparatorDefinitions.lean` on the solution side re-declares these
constants identically (Comparator compares every constant reachable from the theorem's type
for exact equality — see `Comparator/Compare.lean`); (ii) whether the build passes here with
only `propext`, `Classical.choice`, `Quot.sound`; (iii) whether an independent kernel (nanoda)
accepts the exported proof; (iv) the mathematics of the writeup, which is not the claim.
