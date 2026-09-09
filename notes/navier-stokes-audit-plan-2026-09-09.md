# The Navier–Stokes audit — plan, 2026-09-09

Operator's instruction (2026-09-09): *"focus the next big effort on verifying the
Navier-Stokes resolution from OpenAI … approach the solutions and dissect the math
and try to find gaps or counter-examples. Visually, mathematically, process."*

This note is the plan and the running record. `corpus/navier-stokes/MANIFEST.json`
pins every byte read; `corpus/targets.json` row `navier-stokes-openai-audit` is the
memory; the memos live in the session scratchpad until they are records.

## 0 · What is actually claimed (read 2026-09-09)

| artifact | what it says | pinned |
|---|---|---|
| openai.com/index/navier-stokes-solution (2026-09-08) | "resolves the Navier–Stokes Millennium Prize problem by establishing statement C (and also D)"; an internal model "significantly more capable than GPT-6 Astra"; ~10,000 agents, 88 h, 130 B output tokens; Lean formalization 17 h via GPT-6 Astra; "We do not intend to claim the Millennium Prize"; effort began 2026-09-01 on a rumour later traced to Alpöge–Buckmaster | posts/openai-announcement-2026-09-08.txt |
| *Finite time blowup for Navier–Stokes*, 166 pp | **Theorem 1.1.** ∀ν>0 ∃ f ∈ C_c^∞(R³×(0,∞)), compact K, smooth (u,p) on R³×[0,1), supp ⊂ K, NS from rest, sup_{t<1}‖u‖₂ < ∞, limsup_{t↑1}‖u‖_∞ = ∞. Consequently no global smooth bounded-energy solution. Clay (C); Cor. 10.6 gives (D). | papers/openai-navier-stokes.pdf |
| *Finite time blowup for the Euler equation*, 57 pp | **Theorem 1.1.** ∃ u₀ ∈ C^∞_{c,σ}(R³) with 0 < T*(u₀) < ∞; limsup‖∇u‖_∞ = ∞ and ∫₀^{T*}‖curl u‖_∞ dt = ∞. Unforced. | papers/openai-euler.pdf |
| github.com/openai/NavierStokesAndEuler @ 8937a8f4 | Lean 4.34.0-rc2, Mathlib 85e3a25; 2,486 files, 616,276 lines; challenge statements are DeepMind's Formal Conjectures (C),(D) at rev 8bf45ed, adapted only in imports/attributes/namespace/notation (diffed); `#print axioms` declared as propext, Classical.choice, Quot.sound; formalization.yaml: review "self-assessed", automation "agent, GPT-6 Astra, Codex" | lean/ |
| Clay statement (Fefferman) | (C): ∃ smooth div-free u° with (4) and smooth f with (5) such that no (p,u) satisfies (1)(2)(3)(6)(7). (D): periodic, (8)(9), no (p,u) with (10)(11); errata adds periodic pressure | statements/clay-fefferman-navierstokes.pdf |
| Alpöge–Buckmaster 2026-09-08 | IPM, Boussinesq, forced 3D Euler with smooth forcing; Lean at tristanbuckmaster/fluid_lean; the statement about OpenAI | papers/alpoge-buckmaster-*.pdf, posts/buckmaster-statement |
| Córdoba–Martínez-Zoroa | the program both build on: arXiv:2410.22920 (IPM, smooth source), [6] forced Euler, [8] hypodissipative NS | papers/cordoba-martinez-zoroa-2410.22920v3.pdf |
| Tao, 2026-09-03/05 (Mathstodon), 09-07 (blog) | the field's consensus is negative (blowup expected); the four-step ansatz route; the opportunity-cost argument; the A–B mechanism explained | posts/tao-*.json |

The mechanism, in one paragraph. A self-similar axisymmetric core: radial scale
τ^{1/2}, axial scale τ^{1/2−h}, azimuthal and axial speeds τ^{−1/2−h}, radial speed
O(τ^{−1/2}), 0 < h < 1/100. Its momentum residual is unbounded in an annulus; two
families of shear-amplified oscillatory pulses (Craik–Criminale-type exact waves on
an auxiliary torus) supply the missing stress through their averaged quadratic flux
(Daneri–Székelyhidi-type realization); corrections to every order in q^{2h} leave a
flat remainder; an exact radial-heat exterior; cutoffs. The force is *defined* as the
residual and shown to extend smoothly through t = 1. Then uniqueness (Lemma 10.5)
transfers the growth to any smooth bounded-energy competitor.

Scaling self-check done by hand on 09-09 (all consistent): energy τ^{1/2−3h} → 0;
dissipation rate τ^{−1/2−3h}, integrable iff h < 1/6; ∫‖u‖_∞² dt = ∞ (Serrin);
‖u‖_{L³}³ ≍ τ^{−4h} → ∞ (ESS); one singular point (CKN); Re_θ ≍ τ^{−h} → ∞, Re_r = O(1);
nonlinear term τ^{−3/2−2h} vs ∂_t u, νΔu at τ^{−3/2−h} (the centrifugal term is balanced
by pressure; the tangential transport terms are all τ^{−3/2−h}); (10.22)–(10.23)
rescalings verified; the periodic λ-rescaling preserves ν.

## 1 · Where a gap could live — the audit surfaces, ranked

1. **Statement fidelity** (the only place a gap survives a passing Lean build).
   Clay prose → Formal Conjectures (DeepMind, 2026-05-15, third party, before the
   proof) → OpenAI's copy → Mathlib definitions at 85e3a25. Per hypothesis: `Δ`
   (Mathlib Laplacian: trace of the second derivative, junk 0), `gradient`,
   `derivWithin … (Ici 0)`, `fderiv … (v x t)` for (v·∇)v, `ContDiffOn ℝ ∞ (↿v)
   (univ ×ˢ Ici 0)` for C^∞ up to t = 0, `MemLp (‖v · t‖) 2`, the Bochner integral
   (junk 0 when not integrable — covered by `integrable`), `iteratedFDerivWithin` on
   the half-space for (5), `∃ C` with `K : ℝ` real powers, pressure only smooth (Clay's
   (6)), periodic pressure (errata). Direction rule: the theorem is a NEGATION, so a
   solution notion weaker than Clay's makes the theorem stronger; only a notion
   *stronger* than Clay's (extra hypotheses on (v,p)) would be a gap. Output: a
   table, every row with the Mathlib source line.
2. **Build and axioms**: reproduce `lake build` here (started 11:02 -03, 8 cores,
   16 GB, -j4, log at ~/Projects/navier-stokes-lean/build.log); `#print axioms` on
   the two NS theorems and the two Euler theorems. Comparator's `landrun` is
   Linux-only; `lean4export` + `nanoda` can run without it — try; a Linux box (Runpod)
   is a paid option the operator decides.
3. **Challenge vs solution definitions**: ComparatorDefinitions.lean must re-declare
   the challenge's definitions exactly (Comparator compares by name and type across
   two separate roots). Any drift is the whole game.
4. **Paper vs Lean**: the paper is an LLM writeup; the Lean is the claim. Find the
   Lean statements for the constructive content of Theorem 1.1 (compact support,
   energy bound, (10.21) divergence along the path) and the uniqueness lemma's exact
   competitor class (no growth condition on P — how is spatial infinity handled?).
5. **The mathematics, section by section** (seven memos commissioned 09-09): §3+§10,
   §4+App B, §5+App A, §6+§7, §8+§9+App C, the Lean map, the Euler paper. Each memo:
   statements, dependency chain, parameter order and circularities, asserted-not-proved
   steps, computable checks transcribed, suspected gaps with page numbers.
6. **Numerical and symbolic probes** of the paper's own description (a probe of the
   writeup, not of the theorem): the exact radial-heat exterior (4.29); the two moment
   identities (Lemma A.8); the leading profile equations (4.3)/(4.13) and the
   asymptotics E = c∞X^{−1/2−h}(1+O(1/X)); the admissible stress cone (Lemma 4.5, App C)
   — solve the profile ODE/PDE numerically and test the cone inequalities; the pulse
   amplitude ODE (growth then viscous decay, §7.2); the 5×5 moment system (8.25);
   (10.22)–(10.23) and the periodic rescaling symbolically. Exact where possible
   (rational/interval), float where it is illustration. Figures from formulas.
7. **Process facts**: one commit; repo created 10:53 UTC 09-08; the Formal Conjectures
   pin; the toolchain; the announcement's timeline (09-01 start, 09-05 result, 09-06
   Lean); Alpöge–Buckmaster's dates (08-15 result, 08-22 Lean, 09-08 release). Stated
   as dates, never adjudicated.
8. **The Euler paper**: the unforced smooth compactly supported Euler blowup is, on
   its own, the larger mathematical event; same treatment, second pass.

## 2 · Phases

- **Phase 0 (09-09, running)** — corpus pinned (23 files); build started; memos
  commissioned; targets row OPEN; this plan.
- **Phase 1** — statement-fidelity table (surface 1) + definitions diff (surface 3).
- **Phase 2** — build result + axioms + alignment map (surfaces 2, 4).
- **Phase 3** — synthesis of the memos: the dependency graph, the weak points ranked,
  every computable check listed with its formula.
- **Phase 4** — the probes (surface 6), each a record with its formula, method, result
  and a verdict in the machine's grammar: an identity that fails exactly is a
  REFUTED *of the writeup's formula*, never of the theorem, until the Lean says the same.
- **Phase 5** — the Euler paper.
- **Phase 6** — `/reports/navier-stokes.html` from the records: the fidelity table,
  the build record, the alignment, the dissection, the probes, the refusals. Title
  candidate: *Their theorem, read to the last hypothesis.*

## 3 · Rules for this audit

- SLIP ≠ REFUTATION: a writeup gap is a writeup gap; the Lean is the claim.
- Every count computed from the pinned commit; never retyped.
- The controversy is dates; the page prints dates.
- No send is proposed. Anything addressed to OpenAI, Buckmaster, Tao or Clay is
  operator-gated.
- sin-mfg read-only; its 2026-07-28 Navier note is prior art on OUR building a
  blowup, not on auditing one.
