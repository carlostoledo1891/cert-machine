# The dissection — OpenAI, *Finite time blowup for Navier–Stokes* (2026-09-08), read to the last hypothesis

Record of 2026-09-09. Five section memos (§3+§10, §4+App B, §5+App A, §6+§7, §8+§9+App C) and
one Lean map, written the same day by six independent readers from the pinned PDF
(`papers/openai-navier-stokes.pdf`, sha256 0e779481…) and the pinned repository (@ 8937a8f4),
then consolidated here. The rule of this record: **the Lean certificate is the claim; the paper
is its human-readable evidence.** A gap in the paper is a gap in the writeup unless the Lean
shows the same; nothing below is a refutation.

## 1 · What the argument is, in one chain

```
Appendix A   reference profiles with a purely azimuthal tail; the exact radial-heat exterior
             K = c∞ (r²/2)^{-A} H(4τ/r²);  moment identities  ∫r²R_θ = ∫rR_z = 0        (A.4, A.6–A.8)
Appendix B   analytic inner profiles near the axis (a sideways Cauchy problem in Y = ΛX, η);
             joining; five cumulative radial integrals matched                          (B.2, B.5, B.8, B.10)
Appendix C   the admissible stress cone realized on the annulus by a radial modulation with
             phase N log X, amplitude O(1/N); a loop with prescribed mean (C.1); moments restored (C.2, C.3)
Section 4    the leading profile theorem: E, U, Π; stress T supported in Xa < X < Xb; cone condition (4.6)
Section 5    corrections at every order q^{2nh}; Borel-type summation with cutoffs χ(c_n q);
             base field with residual = −div(annular stress) + flat remainder               (5.1–5.5)
Section 6    the auxiliary torus T²: extended fields w̃(x,t,Y), physical field w = w̃(·,Y(r,t));
             disjoint supports for distinct labels (6.1); the class algebra (6.31)
Section 7    two pulse families; the pulse ODE (growth from shear, then viscous decay);
             covariance ⟨w̃_r w̃_θ⟩, ⟨w̃_r w̃_z⟩ = T + h.o.t. as a DOUBLE average;
             positive representation T = c1 v1 + c2 v2                                     (7.1–7.8)
Section 8    compactly supported mean corrections; the 5×5 radial-moment system; the
             fast-time inverse N⁻¹ on zero-mean functions                                   (8.1–8.8)
Section 9    the correction cycle: σ_{j+1} = σ_j + 1/10 on ONE common domain; summation;
             flatness by comparison with a finite stage; the local field                   (9.1–9.9, Thm 3.1)
Section 10   cutoffs (10.1); limits of every force derivative at t = 1 (10.2); smooth extension
             past t = 1 (10.3); energy (10.4); uniqueness with no growth condition on P (10.5);
             Theorem 1.1; viscosity rescaling (10.22); the torus (10.6)
```

Parameter order, as read off the proof (no circularity found by any reader):
profiles and cone margin (§4, App. A–C: M_d → T_d → P_* → λ → h → X_R; then Λ, σ_*, δ_*, j0, ε_m,
C, T_sh, κ0, t1) → background (Prop 5.5) → charts, ℓ0, q_big, Δ_max, colours, r0 (Lemma 6.1) →
u_* → per band k, B_s, s(v), p, p_z (Lemma 7.1, one q_*) → amplitudes y_σ (Prop 7.5, one more
decrease of q_*) → cycle constants C_{j,m} → summation cutoffs a_j (after all finite-stage
constants) → q_* := q_big (Thm 3.1) → τ0, z0, r0, χ_x, χ_t → F_j, b_j → ν → λ, t0 (Cor 10.6).

## 2 · What was verified by hand or by computer

| where | what | how | result |
|---|---|---|---|
| §10 (memo 1) | (10.3) with C0 = 2^{1/(2D)}; Lemma 10.5's difference equation, local energy identity, commutator kernel ‖K_R‖_{4/3}^{4/3} = 16π/R, the H⁻³ tempered-pressure step, the Hölder/Young chain; (10.12); (10.22)–(10.23); the competitor rescaling; the λ³ periodic rescaling; disjoint translates; smoothness across t0 and t=1; Clay (5) and (9) | re-derived term by term | all hold as printed |
| §4 (memo 2) | the leading tangential equations re-derived from axisymmetric NS in (X,η,q): (4.14), Sn of (4.9), T0 of (4.11), the vanishing-stress equations (4.13); Prop 4.2 an exact identity; Lemma 4.3's closed forms (4.16); Lemma 4.5; (4.23); (A.25); B.2 remainders; Φ0 = √(2/z)J1(√(2z)); (B.11), (B.19) | symbolic and numeric | all hold; the only dropped tangential term is axial viscosity at relative order q^{2h}; the radial equation is deferred to §5 as stated |
| App A (memo 3) | K solves the swirl heat equation iff (A.37); H of (A.32) solves (A.37); H'(0) = −h(1+h); H(Z) = Z^{−1−h}U(1+h,2,1/Z); conservative forms of r²R_θ, rR_z; nondegeneracy of (q,η) ↦ (z,t) at η = ±1; pulse numerics of A.4; Lemma A.1 Vandermonde determinants; (A.17) factors | symbolic and numeric | all hold; (5.51) pressure line misses a 1/R (E1, harmless) |
| §6–7 (memo 4) | (6.4) chain rule; Lemma 6.1's lattice-avoidance; (7.1)⟺(4.22); λ0² = 2aF0²(1−2/v_s); the reference-matrix eigenstructure; (7.13), (7.18)–(7.19), (7.27)–(7.30), (7.38)–(7.40) | symbolic | all hold; no error found |
| §8–9, App C (memo 5) | the 5×5 moment system decouples into a 3×3 and a 2×2 generalized Vandermonde with explicit nonzero determinants; Lemma C.1's loop on 371 random relaxed-cone data (mean/period identities exact, strict admissibility at every point); the exponent table of the cycle with corrected κ_s bookkeeping | numeric | holds; the ordering "δ_L after μ_max, uniformly" is load-bearing — choosing δ_L from the base point alone breaks the cone in ~7 % of cases |
| this battery | `instruments/navierstokes/battery.py`: (A.37) from the heat equation by substitution; the integral H against (A.37) and (A.35) to 25 digits; Lemma 4.1's derivatives; 16π/R; (10.12); (10.22)–(10.23); the λ³ rescaling; the exterior q-cancellation; (10.3) on a grid and by the two-case proof | sympy / mpmath | PASS — `probes.json` |

## 3 · The weak points, ranked (page numbers from the pinned PDF)

Ranked by how much rests on them. None is an error; each is a place where the paper asserts
what a referee would want displayed. Whether the Lean discharges each is the question the
certificate answers — the build and the axiom print are the arbiter, not this list.

1. **Prop 9.9, pp. 114–116 — the local field's endpoint regularity up to τ = 0 for q ≥ c
   (Step 3).** One paragraph: labels, frequencies and torus rectangles "chosen from the closed
   τ ≥ 0 range … differentiating its fixed linear ODE gives the bounds at every derivative
   order". No estimate displayed. This is the single assertion Lemma 10.2 region (a) rests on,
   and through it the smoothness of the force at t = 1 away from the origin.
2. **Uniformity in η of the flatness (3.4), p. 15 → (10.9), p. 119.** (3.4) is stated for
   0 ≤ X ≤ X1 as q ↓ 0; (10.9) needs it on a full neighbourhood of (0,1) including η → ±1.
   Prop 5.5 states η-uniformity for E_B; Prop 9.9 says "uniform on the whole local domain";
   Lemma 5.4's (5.36) is a q-statement. Plausible, not displayed.
3. **Prop 9.3(i), pp. 103–105 — admissibility of next-cycle sources for the pulse inverse** after
   temporal inverses that spread over the torus: "the pulse cutoff ψ restores the fixed
   enlarged local torus rectangle support" is asserted; the tails are declared flat via the
   envelope P_v. The only unstated induction hypothesis in §9.
4. **The size of the smallness parameter.** The paper fixes 0 < h < 1/100, but Lemma 4.8 needs
   h < min{λ, e^{−T_d}} with T_d = e^{M_d} + 10 (triple-exponentially small, unquantified); the
   derivative scale of §6 exceeds 1 only for dyadic level ℓ ≳ 3×10⁸ (q ≲ 2^{−3×10⁸}); Lemma 7.1's
   own smallness needs ℓ ≳ 10⁴; flatness to order N needs J ≈ 10(N+K_m)/h > 1000(N+K_m) cycles;
   Lemma 8.2's cutoff flatness costs ~N/(hκ_s) ≈ 10⁷N integrations by parts. Every constant is
   "sufficiently small/large" and none is numeric. Not a gap in logic; the proof is entirely
   asymptotic.
5. **Prop B.2, p. 147 — the Lipschitz bounds of (Φ,u) ↦ J_νR_i** on the weighted analytic space
   are asserted in one sentence; every constant of the inner construction descends from them.
   Hidden: the analyticity radius in η is O(σ_*), so Λ0 ∝ 1/σ_*, never said.
6. **Lemma 4.9, pp. 36/44 — "2 + h < a" on the terminal collar.** With a = 2 + 2h + 2Z𝓗'/𝓗,
   Z = 2d/X, the inequality holds for Z ≲ 1.5 and fails for Z ≥ 3 at h = 0.01. It holds on the
   collar only because X_tail ≫ 1; that dependence belongs in Appendix A's choice of X_tail.
7. **Prop B.5, p. 153 — continuation to X_i = 110** is a prose sketch with unspecified
   interpolation lengths and "p1 > 2 by continuity".
8. **Lemma 5.1 and the analyticity region (E4).** Lemma 5.1 needs the leading profiles η-analytic
   on [0, a²] with a² > X_cut; Theorem 4.6(i) gives analyticity on [0, X_an]. That a² ≤ X_an and
   that the non-analytic leading-order edits (B.8 bumps, C.2/C.3 patch, A.7 patch) lie beyond X_an
   is never stated where needed. A cross-section dependency, not a contradiction.
9. **The coefficient equations (5.3)–(5.6), pp. 46–47** are stated with sample terms derived;
   sparsity of A1, divisibility of Ω_k by X and the residual coefficients depend on their being
   complete. Verifiable by computer algebra (the one substantive check not yet run).
10. **§7 → §8: the zero-Haar-mean part of the covariance is LARGER than its mean** by
    ≍ S_*^{1/2}/(4r0²(1+b_g²)); §6–7 never quantify it; its cancellation is §8.5's fast-time
    inverse N⁻¹. Coherent; the two correction routes (H⁻¹ at cost S_*^{1/2}, N⁻¹ at cost S_* and
    four derivatives) are never tabulated together (W8 of memo 4).
11. **The signed-amplitude map's class preservation** at every cycle needs |T0| ≥ cζ on the
    MODULATED profile ((C.19), p. 164); proved in Prop C.3, never cited in §9.
12. **q_* overloading, pp. 111/114.** Lemma 9.7 "chooses q_big ≤ q_*" with an earlier q_*;
    Theorem 3.1 then defines q_* := q_big. Not circular; the reader supplies the disambiguation.

Bookkeeping slips found (harmless, each with a positive margin): the −κ_s dropped from the zero
harmonic of two-wave products in Prop 9.5 and Steps 1–2 (margins 0.08 and 0.4 against 10⁻⁵);
"axial transport gains one through D_z" false for the phase (conclusion unaffected); (5.51)
missing a 1/R; "powers of A_R at most 3/2" is 7/4 as displayed (Young still closes).

**A trap for anyone auditing from extracted text, p. 122:** the cutoff family in Lemma 10.5
reads φ_{4R}, φ_{8R} in text extraction (dilations), under which three inequalities are FALSE;
the PDF glyphs are φ_R⁴, φ_R⁸ (powers of one bump), under which every step is exact.

## 4 · What the Lean proves, against the paper

- The two Comparator theorems are Clay (C) and (D) with DeepMind's definitions, byte-identical
  on the challenge and solution sides (`fidelity-clay-vs-lean.md`, `lean-map.md`).
- The uniqueness lemma (`R3/WholeSpaceUniqueness.lean:30`) covers every competitor Clay admits:
  smooth, L^∞_t L²_x, divergence-free, with a merely smooth pressure; the pressure is recovered
  from the equation (`R3/PressureRecovery.lean:419`) and the flux bounded uniformly in the radius
  (`R3/PressureFlux.lean:576`) — the paper's Lemma 10.5, formalized.
- The viscosity is rescaled in TIME in Lean (`f_ν(x,t) = ν² f(νt, x)`, singular time 1/ν) and in
  SPACE in the paper ((10.22), singular time 1). Equivalent; the formal statement names no time.
- **The candidate's uniform energy bound on [0,1) — Theorem 1.1's `sup_{t<1} ‖u(t)‖_{L²} < ∞`,
  the announcement's "energy remains finite through the entire dynamics" — is NOT among the
  formal conclusions.** `R3/CompactEnergy.lean:343` proves the lemma in general (for a smooth,
  compactly supported force) and nothing uses it; the structure carrying `energy_bounded`
  (`R3/ProblemStatement.lean:108`) has no producer; `breakdownStatement`, the file's own "full
  assertion of Theorem 1.1", is never proved. Clay (C) does not need it: the candidate's energy
  on each [0,T], T < 1, follows from compact support alone. So the Millennium alternatives are
  formally proved and the physically striking clause of Theorem 1.1 rests on the paper's
  Lemma 10.4 (verified by hand above: (10.14) is exact for smooth compactly supported fields).
- Also weaker in Lean than in the paper: `f ∈ C_c^∞(R³×(0,∞))` becomes "smooth on t ≥ 0, spatial
  support in a compact K', zero for t ≥ T" — no field states f = 0 near t = 0. The growth path
  (10.20)–(10.21) is not a Lean statement; L^∞ divergence is the pointwise `SpeedUnboundedAtOne`.
- Hygiene (grep, whole repo): no sorry outside the challenge placeholders, no axiom,
  native_decide, unsafe, opaque, partial def, #exit, custom macro/elab/syntax, or search tactics;
  five `maxHeartbeats` (max 3.2 M); the NavierStokes library sets neither `autoImplicit = false`
  nor `warningAsError` while the Euler library sets both; `Euler/Solution.lean:41` installs a
  local `CompletePartialOrder.toSupSet` instance so the final statement elaborates like the
  reference; docstrings cite a manuscript numbering (Lemma 3.3, Prop 11.4, …) that is not the
  published paper's — the section-to-Lean map is by content.

## 5 · Refusals

- No verdict is issued on the theorem by this record. The verdict is the Lean build's, and it is
  recorded separately when it finishes (`build.json`).
- No numerical solution of the profile equations was attempted; the paper contains no numerics
  and none of its constants is a number a computer could test.
- The Euler paper is a separate record (`euler.md`).
