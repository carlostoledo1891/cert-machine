# THE BAND THEOREM (P3a — certified 2026-09-02/03, sessions 8–9d)

**For every c ∈ [0.845, 0.85], let Ω_c be the trapezoid with vertices
A=(0,0), B=(1,0), C=(c, 9/10), D=(1/4, 9/10) — a one-parameter family of
convex quadrilaterals with no axis of symmetry, not lip domains, outside
every class for which the hot spots conjecture was previously proven
(including the specimen c = 17/20 = 0.85). For every such c the second
Neumann eigenvalue μ₁(c) of −Δ on Ω_c is simple, and the second Neumann
eigenfunction attains its maximum and its minimum on ∂Ω_c only.**

The first certified POSITIVE-MEASURE FAMILY of hot-spots domains beyond
the proven classes — the uniqueness wall is crossed not at a point but on
an interval.

**THE LADDER IS COMPLETE (2026-09-03, session 9d).** Certified interval:
**c ∈ [0.845, 0.85]** — the full target — as SEVENTEEN closed chunks
tiling it end to end, each carrying the full six-stage chain below:
sixteen of width 3e-4 from 0.85 down to 0.8452, plus [0.845, 0.8452] of
width 2e-4. Adjacent chunks are closed and share endpoints, so the union
is the closed interval with no gap. The source of truth for what is
certified is data/band/ledger.jsonl — a chunk counts iff a ledger row
(or its amend rows) shows all six stages pass; `node band-status.js`
prints the contiguous certified interval and per-chunk stage
completeness. The specimen c = 17/20 (THEOREM.md) is INDEPENDENTLY
covered by the band chain at the right endpoint.

BAND-WIDE CERTIFIED VALUES (worst over all 17 chunks; per-chunk numbers
in the stage JSONs):
  μ₁(c) ≥ 11.85157, μ₂(c) ≥ 13.90774 uniformly ⇒ μ₁ SIMPLE for every c
  boundary defect     D_sup ≤ 8.11e-5
  eigenvalue window   μ₁(c) ∈ [12.01166, 12.04931]
  eigenpair error     ‖u_σ − c₁φ₁,c‖_{L²} ≤ 4.39e-4
  zones margins       ≥ +2.47e-4 (max side), ≥ +6.41e-4 (min side)
  collar survivors outside the two corner windows: 0, every cell, every chunk
  corner witnesses    φ̂(w₊) ≥ 0.98692, −φ̂(w₋′) ≥ 0.92692
  tip C               b₁ ≤ −0.8791 < 0 certified on every chunk
The two thinnest zones margins (+2.47e-4, +6.41e-4) are BOTH from the
two session-7/8 chunks, which were built at the old σ-cell resolution;
all fifteen ladder chunks (BAND_NCELLS 18) run ≥ +3.4e-3, an order of
magnitude fatter — see the resolution note under Parametrization.

## Parametrization

Per chunk [c_lo, c_hi]: σ ∈ [−1, 0], c = c_hi + σH, H = c_hi − c_lo.
The trial family u(x, σ) = Σ_i a_i(σ)ψ_i(x) has FIXED c-independent modes
ψ_i (anchored at the c_hi frames) and degree-3 polynomial coefficients
a_i(σ) — so u is an EXACT CUBIC in σ at every point, and −Δu = λ̃(σ)u
EXACTLY for every σ. Point-normalized u(x₀) = 1 at x₀ = (0.05, 0.05)
(tip values ≈ 1, not the specimen's 2.15 scale; all conclusions are
scale-invariant). σ-cells: 39 per chunk for the two session-7/8 chunks, 44 for the
fifteen ladder chunks, ratio-1.3 refinement toward σ = 0.

RESOLUTION NOTE (paid, session 8). The σ-cell count is the band's
binding resource: the per-cell defect scales with cell width (D ∝ width),
so a coarse cell rides a multiple of the median defect and zones fails
first at the left end of a chunk. Chunk [0.8491, 0.8494] failed ZONES at
worstMarginP = −1.1e-6 at BAND_NCELLS 12; the model said 12 → 18 buys
≈ +4e-3 of margin and 16+ chunks of runway. It then delivered exactly
that: every one of the fifteen ladder chunks certified 6/6 on the first
pass at NCELLS 18, with zones margins +3.4e-3 … +1.4e-2 and no further
failure anywhere on the ladder.

## The certified chain (per chunk; scripts in this directory; foundation
lib/eqcert + ivspecial.js; literature inputs: Liu's framework theorem and
the CR constant 0.1893·h_K from arXiv:1808.08148, plus the classical
Γ-monotonicity facts listed in ivspecial.js)

1. FIT (band-fit.js, float tool — gate only): 46 modes = 4 corner fans
   (K = 10) + 6 C-anchor shifted-order aux modes (kν_C ± 1); polynomial
   MPS (ridge-KKT stacked least squares, point normalization at 8 σ-nodes,
   geometric near-corner sampling for the singular ν_C − 1 ≈ 0.81 flux).
   Gate: worstFloatDefect < 3e-5 (measured ≈ 1.24e-5 per chunk). Every
   certified claim below is re-derived from the frozen chunk JSON by
   interval/rational arithmetic — the fit is never trusted.
2. SPECTRUM (band-p2a2.js): exact-rational CR + interval inertia at
   c₀ = c_hi × affine-transplantation ratios ⇒ FOR EVERY c IN THE CHUNK:
   μ₁(c) ≥ 11.8516, μ₂(c) ≥ 13.9077, and exactly one nonzero Neumann
   eigenvalue below 13.9077 ⇒ μ₁(c) uniformly SIMPLE. (Both bounds are
   minimized at the right end of the band; every chunk's own pair is
   larger — the leftmost chunk certifies μ₁ ≥ 11.88527, μ₂ ≥ 13.94577.)
3. DEFECT (band-defect.js): certified sup over the σ-cell of
   ‖∂νu_σ‖_{L²(∂Ω_c)} per σ-cell; chunk-wide D_sup ≤ 8.02e-5 / 8.11e-5
   (chunks 1/2; band-wide worst 8.11e-5, best 3.49e-5 on the narrow
   leftmost chunk — D tracks chunk width as the model predicts). λ frozen per cell; total-dq/dc as SIGNED point-jet sums
   (the cancellation discipline); graded corner cells; envelope slivers
   for the singular aux flux.
4. EIGENPAIR (band-assemble.js): per σ-cell, with C_tr = 2.6427 and the
   uniform spectrum: μ₁(c) ∈ [12.0117, 12.0327] (chunk 1) /
   [12.0129, 12.0341] (chunk 2); ‖u_σ − c₁φ₁,c‖_{L²} ≤ E with
   E ≤ 4.34e-4 / 4.39e-4 (worst σ-cell). Band-wide the windows sweep
   monotonically leftward with c: μ₁(c) ∈ [12.01166, 12.04931] over the
   whole band, worst E = 4.39e-4 — every window strictly inside
   (11.85157, 13.90774), so simplicity is never in question.
5. ZONES (band-zones.js): per σ-cell core (depth ≥ 0.075) + collar
   (depth < 0.075, ≥ 0.11 from every vertex) killed by witness values
   with solid-mean/reflected e-bounds; worst margins +2.6e-4 / +2.5e-4
   (max side), +9.0e-4 / +6.4e-4 (min side); collar survivors confined
   to the two corner-lemma windows (near A, top edge near C) — exactly
   the regions the corner stage covers. Band-wide: worst +2.47e-4 (max)
   and +6.41e-4 (min), both on those two chunks; the fifteen ladder
   chunks run +3.4e-3 … +1.4e-2. `outsideWindows` = 0 on every σ-cell of
   every chunk — no collar survivor anywhere on the band escapes the two
   windows.
6. CORNER TIPS (band-corner.js): chunk-wide (single extraction per
   corner, valid for every c and σ): in each corner sector of Ω_c,
   φ̂ = Σ_k b_k J_{kν_C(c)}(√μ₁ r)cos(kν(c)θ) exactly; b₀,b₁,b₂ certified
   by annulus L² extraction (second-order midpoint cells; far-fan +
   own-fan per-mode Hessian bounds over all 46 modes; Parseval tail).
   Witnesses (chunk-wide): φ̂(w₊) ≥ 0.98692 / 0.98697, −φ̂(w₋′) ≥
   0.92692 / 0.92740 (band-wide minima 0.98692 and 0.92692). Band-wide
   tip value ranges: A [0.9558, 1.0315], B [0.3600, 0.4422],
   C [−0.9673, −0.8724], D [−0.8109, −0.6347]; tip C's b₁ ≤ −0.8791 < 0
   on every chunk. On r ≤ 0.11 (wedge to 0.12), for every c in the
   chunk — chunk-1 / chunk-2 numbers:
   - A (fixed position, fixed opening): value range [0.9558, 1.0315] /
     [0.9558, 1.0314] (min-side dead); ∂rφ̂ < 0 on r ∈ [0.008, 0.11]
     (worst −2.33e-2 / −2.32e-2); factored inner disk ∂rφ̂/r < 0 on
     r ≤ 0.008 (−4.70) ⇒ no critical point ⇒ no interior extremum.
   - B (fixed position, moving opening): values [0.3600, 0.4219] /
     [0.3614, 0.4232] — both sides dead.
   - D (fixed position, moving opening): values [−0.7909, −0.6347] /
     [−0.7923, −0.6360] — both sides dead.
   - C (moving position AND opening; ν_C(c) ∈ [1.8091, 1.8097]):
     max-side dead (values ≤ −0.8724 / −0.8729). Min side:
     b₁ ≤ −0.879 / −0.881 < 0 certified; |∇φ̂| > 0 on θ ∈ [0.35, ω(c)],
     r ∈ [1e-5, 0.11] (c-quadratic min-form; floor ≈ 1e-4) + analytic
     limit piece r ≤ 1e-5 (θ-term 2.27e-4 / 2.29e-4 dominates 5.74e-5;
     the ratio improves like r^{2−ν} as r ↓ 0); wedge θ ∈ [0, 0.35]:
     φ̂_nn ≥ c₂ ≥ 4.82 / 4.81 > 0 on r ∈ [1e-6, 0.12] via the Bessel
     LADDER identity at interval orders (the b₁ < 0 singular term
     helps), inner piece r ≤ 1e-6 (c₂ ≥ 5.52 / 5.53) ⇒ exact
     second-order Taylor from the Neumann edge: no interior point of
     the wedge attains the minimum.

## Assembly (uniform in c)

Fix c in a certified chunk and let σ be its parameter; let x* ∈ Ω_c
attain max φ̂. Then φ̂(x*) ≥ φ̂(w₊) ≥ WIT_P(σ-cell) — but x* lies in the
core (sup < WIT_P by margin), a swept collar cell, tip B/C/D (value-dead)
or tip A (∂rφ̂ < 0 forbids ∇φ̂(x*) = 0). The minimum argument is symmetric
with w₋′ (tips A/B/D by value; tip C by min-form + inner piece on
θ ∈ [0.35, ω] and the monotone wedge + inner piece on θ ∈ [0, 0.35]).
Partition completeness as in THEOREM.md: interior = core ∪ collar ∪
vertex sectors (convexity; sectors run to r ≤ 0.11, wedge to 0.12,
uniformized over c by the 2hc distance slop). ∎

## Trust base

As THEOREM.md (eqcert rigor model; ivspecial falsifier battery — now
including WIDE-argument Γ and wide-order Bessel falsifiers; Liu + CR
constant; classical sector separation, Green, spectral theorem, Courant),
plus: Γ monotonicity on [2, ∞) and the [1,2] derivative bound (classical,
documented at ivspecial.js gammaIvCore), and the affine-transplantation
argument of band-p2a2.js. All scripts deterministic; chunk certificate
≈ 45 min single-core (defect dominates), corner stage ≈ 2.5 min. The
complete 17-chunk band cost ≈ 13 h single-core end to end. Measured
stage split on the leftmost chunk: fit 49 s, spectrum 3 s, defect 1364 s,
eigenpair 120 s, zones 626 s, corner 89 s.

## Provenance note

The session-7 zone stages of chunk [0.8497, 0.85] were certified
manually (stage by stage) before the driver existed; the ladder re-ran
that chunk's full six-stage chain through band-driver.js on 2026-09-02
so that every certified chunk has uniform ledger rows. Chunk
[0.8494, 0.8497] carries its session-7 five-stage row plus a corner
amend row. Sessions 9c/9d: the fifteen remaining chunks were built by
band-driver.js autonomously at BAND_NCELLS 18. Two chunks carry a failed
row ahead of their passing rows — [0.8494, 0.8497] a fit failure and
[0.8491, 0.8494] the NCELLS-12 zones failure described above. The failed
rows are RETAINED in the ledger deliberately: band-status.js reports
them alongside the 6/6 verdict, so the record shows what was tried and
what fixed it rather than only the outcome.
