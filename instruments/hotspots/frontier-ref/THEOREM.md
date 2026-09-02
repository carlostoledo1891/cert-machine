# THE THEOREM (certified 2026-09-01)

**Let Ω be the trapezoid with vertices A=(0,0), B=(1,0), C=(17/20, 9/10),
D=(1/4, 9/10) — convex, side slopes 6 and 18/5, no axis of symmetry, not a
lip domain; outside every class for which the hot spots conjecture was
previously proven. Let φ be a second Neumann eigenfunction of −Δ on Ω
(the eigenvalue μ₁ is simple, so φ is unique up to scale). Then φ attains
its maximum and its minimum on ∂Ω only.**

Normalization: φ̂ := c₁φ₁ = u − e as produced by the certificate chain;
extrema locations are scale-invariant. Sign fixed by φ̂(A) > 0.

## The certified chain (every number interval-certified; scripts in this
directory; foundation lib/eqcert; two literature inputs: Liu's framework
theorem and the CR constant 0.1893·h_K, quoted from arXiv:1808.08148)

1. SPECTRUM (run-p2a.js, run-p2a2.js): μ₁ ∈ [11.892663, 12.04181916],
   μ₂ ≥ 13.955936, exactly one nonzero eigenvalue below 13.955936 ⇒ μ₁
   SIMPLE. (Galerkin upper bounds; Crouzeix–Raviart + inertia lower
   bounds, exact-rational assembly.)
2. TRIAL (run-p2b-mps.js, cert-defect.js): u = Σ aᵢψᵢ over four corner
   Fourier–Bessel fans, λ̃ = 12.021687243; −Δu = λ̃u EXACTLY;
   ‖∂νu‖_{L²(∂Ω)} ≤ 1.2369e-5 (interval Taylor-jet edge quadrature);
   per-edge sup|∂νu| ≤ 1.4e-5.
3. EIGENPAIR (cert-assemble.js): with C_tr = 2.6427 (rational star-shaped
   trace constant) and the spectrum localization:
   μ₁ ∈ [12.020976127, 12.022398359] and ‖e‖_{L²} = ‖u − φ̂‖ ≤ 6.5353e-5.
   Also |e|_{H¹} ≤ 2.4415e-4 (spectral expansion, G = 55.79).
4. POINTWISE (cert-pointwise.js): solid-mean lemma with EXACT kernel norm
   (I₀ = 5/48); witnesses φ̂(w₊) ≥ 2.126029 (w₊ interior, depth 0.033,
   near A) and −φ̂(w₋′) ≥ 1.993811 (depth 0.019, under the boundary min).
   CORE (depth ≥ 0.075): sup φ̂ ≤ 2.071924, sup(−φ̂) ≤ 1.960684
   ⇒ no interior extremum in the core (margins 5.4e-2 / 1.2e-2).
5. COLLAR (cert-collar.js): all cells at depth < 0.075 and ≥ 0.11 from
   every vertex killed by the value argument with REFLECTED pointwise
   bounds (φ̂ reflects exactly across open edges; u's reflection carries a
   certified single-layer ≤ sup|∂νu|·3R/π). ZERO residual cells.
6. CORNER TIPS (cert-corner.js): in each corner sector
   φ̂ = Σ b_k J_{kν}(√μ₁ r)cos(kνθ) exactly. Certified b₀, b₁, b₂ by
   big-annulus L² extraction (own fan exact via angular orthogonality;
   far part by second-order midpoint cells); Parseval tail. On r ≤ 0.11:
   - A: value range [2.0153, 2.2195] (min-side dead); ∂rφ̂ < 0 throughout
     (worst −0.0499; factored inner disk −10.0) ⇒ no critical point ⇒ no
     interior extremum.
   - B: values [0.7566, 0.8965] — both sides dead.
   - D: values [−1.6643, −1.3515] — both sides dead.
   - C: values ≤ −1.8465 (max-side dead). Min side: |∇φ̂| > 0 on
     θ ∈ [0.35, ω] down to r = 1e-5 (c-quadratic min-form) + analytic
     limit piece below; on the wedge θ ∈ [0, 0.35]: φ̂_nn ≥ 13.04
     (ladder-identity φ̂_tt: ∂t² = (μ/4)[J_{ν+2}cos((ν+2)θ) +
     J_{ν−2}cos((ν−2)θ) − 2J_νcos(νθ)]; the b₁ < 0 singular term helps),
     inner piece c₂ ≥ 11.65 ⇒ exact second-order Taylor from the Neumann
     edge: φ̂(a,n) ≥ φ̂(a,0) + n²c₂/2 > φ̂(foot) ≥ min_∂ φ̂ — no interior
     point of the wedge can attain the minimum.

## Assembly

Suppose x* ∈ Ω (interior) attains max_{Ω̄} φ̂. Then φ̂(x*) ≥ φ̂(w₊) ≥
2.126029. But x* lies in the core (sup ≤ 2.071924 ✗), a swept collar cell
(certified sup < 2.126029 ✗), tip B/C/D (values ≤ 0.897/−1.847/−1.288 ✗),
or tip A — where an interior maximum forces ∇φ̂(x*) = 0, contradicting
∂rφ̂ < 0. Hence the maximum is attained only on ∂Ω. The minimum argument
is symmetric with w₋′ (core 1.960684 < 1.993811; swept cells; tips A/B/D
by value; tip C by the no-critical-point sector plus the monotone wedge).
∎

Partition completeness: interior = {depth ≥ 0.075} ∪ {depth < 0.075,
dist ≥ 0.11 from all vertices} ∪ {dist < 0.11 from a vertex}; by
convexity every point of the third set lies in its vertex's sector, and
the tip arguments run on the full sector r ≤ 0.11 (wedge to 0.12).

## Trust base

eqcert's rigor model (outward-rounded IEEE doubles; BigInt-rational
falsifiers); ivspecial.js special functions (44 + 3 exact-falsifier
tests, including half-integer and negative-order closed forms); the two
quoted lemmas of Liu; classical facts: Neumann separation in a sector +
H¹ regularity (excludes the second Bessel family), Green's identity on Ω,
spectral theorem, Courant. All scripts deterministic; total certificate
runtime ≈ 3 minutes single-core.
