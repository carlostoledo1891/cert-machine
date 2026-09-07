# instruments/price — findings, against the literature and against the lab

Written 2026-09-07 while building reports/price.html. Numbers are from
certs/price-band.json and are re-derived at every build.

## 1. The closed form (elementary; possibly known to the authors)

Gomes–Saúde §6.2 defines Π = ∫u_x m and Ξ = ∫x m, derives Ξ̇ = Q and
Π̇ = −η(Ξ − κ), and then solves for Π through a Volterra equation with a
separable kernel and an inverse Laplace transform, leaving Π(0) to be fixed
by (35). With quadratic terminal data ū = γ(x − ζ)²/2 the OTHER end is
explicit — Π(T) = ∫ū′ m(T) = γ(Ξ(T) − ζ) — and the pair integrates directly:

    Ξ(t) = x̄₀ + ∫₀ᵗ Q,    Π(t) = γ(Ξ(T) − ζ) + η∫ₜᵀ(Ξ − κ),    ϖ = −cQ − Π.

For η = 0 this is the paper's (25)/(30) exactly; the battery decides Π_n = −Θ
as a rational identity at all 241 grid times (E1). An independent route —
the ansatz u = a x² + b x + e with a Riccati equation for a, a linear
equation for b, and Π = 2aΞ + b — agrees with the closed form to 4e−15 at
η = 0 and 7e−15 at η = 6 (E4). The closed form is not claimed as new: it is
three lines from the paper's own averaged dynamics. What it buys is the
structure — the price is affine in the supply path with non-positive
coefficients — and that is what turns a forecast box into a proved band.

## 2. The band on the lab's scenario

Supply: the source lab's scenario at its default sliders (peak cut 0.5,
midday width 0.7, adequacy 1.25, σ 0.10), ported bit-identically. Data:
c = 1, γ = 12, ζ = 17/20, T = 1, N = 240, x̄₀ = 0.301934… (the discrete
fleet's mean, a double converted losslessly). Box: Q(1 ± 3/20).

- Θ = −1.656370… (exact rational in the record), ∫Q = 0.686096…, Ξ(T) = 0.988031….
- Widest band 2.774661… at grid time 120 (noon). Of that, 2.4699 is the day
  term γ·2ρ∫Q and at most 0.305 is the instant term c·2ρQ(t): 89 % of the
  uncertainty in the price is uncertainty about the day's total energy.
- The box that would make the widest band one price unit: ρ = 5.41 %.
- η ladder (κ = 3/5): widest band 3.0235 at η = 3, 3.8292 at η = 12; the
  set-point part 0.256 and 1.108. Π(T) = 1.6564 at every η (the terminal
  identity does not see η); Π(0) rises to 1.7539 and 2.0466.

## 3. The lab's kernel, measured (report, do not repair — the lab is read-only)

The MPR module of sin-mfg research/mfg-lab/mfg-lab.html (kernel sha256
65c8909331322f85…, artifact sha256 37c0e3bd640ae4c7…, 274 157 bytes) was
extracted headlessly the way its own tests/test-mpr.js does, run at its
default sliders, and compared with the port in fd.js: the supply and the
initial fleet are bit-identical, the equilibrium price is bit-identical at
all 241 grid times, 49 iterations to residual 8.037e−10 in both.

**Finding.** The kernel clears its market in the agents' controls to 1e−14
(max |demand − Q| = 9e−16) and the fleet's mean charge ends the day at
Ξ(T) = 0.9032 where clearing requires 0.9880. The missing 0.0848 is 12.4 %
of the day's energy. The density at the wall x = 1 reaches 22.9 at T.

**Mechanism.** Two lines of the scheme. In the HJB step a missing neighbour
counts as u_x = 0 (`pp = 0 + wn` at i = NX − 1), so a wall cell may set its
control into the wall and is paid the Lagrangian for it; `demand` sums
−(u_x + ϖ) m over every cell including that one. In the Fokker–Planck step
the wall flux is zero (`ap[NX] = am[NX] = 0`). Energy is bought, counted
as cleared, and never stored. The lab's own battery (test-mpr.js) checks
the pre-update residual semantic and the clearing-in-controls; it does not
check Ξ(T) against x̄₀ + ∫Q, which is why this passed there.

**Two repairs, ours, in fd.js, as options.** (a) `walls: 'constrained'`:
forbid the wall-pointing control (vm = 0 at xa, vp = 0 at xb — the
state-constraint boundary condition). Loss falls to 0.0645; it does not
vanish because the clearing sum still counts controls at cells the flux
cannot leave. (b) `clearing: 'flux'`: clear on the discrete mean velocity of
the Fokker–Planck step itself (one bisection per time step, forward sweep).
Then Ξ(T) matches to 1e−14 and the flux demand equals Q to 1e−13.

**Convergence.** On [−1, 2], where the fleet never reaches a wall, the
constrained + flux scheme approaches the closed form at first order:
max price error 0.0816 → 0.0434 → 0.0228 for H = 0.0201, 0.0100, 0.0050
(the third mesh in the exploration only; the record carries two). With
η = 6: 0.0882 → 0.0463. The lab's wall treatment on the same domain does
not approach it — 1.6998 → 2.3615, the error growing with refinement —
because the wall cell's free purchase lowers u there and the backward
equation carries the cheaper value inward across the whole domain.

**The shadow price of the box.** With the conserving scheme on [0, 1] the
noon offset is Π ≈ 1.280 against the whole-line 1.656: a gap of 0.376 that
is the wall's own contribution to the price. The lab's kernel had it at
0.039; that number was the leak, not the wall. The 0.376 is a float at one
mesh and is stated as such.

## 4. What was NOT done

- No claim about ε > 0, about non-quadratic terminal data, about the
  realism of a 15 % box.
- The Ashrafyan–Gomes semi-Lagrangian scheme (arXiv:2403.02785) was not
  implemented or measured; it is cited as the monotone discretisation with
  a convergence proof.
- The lab was not edited. Its MPR page states a clearing residual and an
  exploitability; neither is contradicted here. What is contradicted is
  the implicit reading that a cleared market fills the batteries.
