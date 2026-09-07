# instruments/regatlas — findings against Ferreira–Gomes–Üçer arXiv:2506.21212

Written 2026-09-07 while building reports/regatlas.html. Numbers from
certs/regatlas.json, re-derived at every build.

## 1. The instance and why it is polynomial

Problem 1 with the power-growth Hamiltonian H = a|p|^α − b m^β, a = ½, b = 1,
α = 2, β = 1, on 𝕋¹, V = A cos 2πx. The regularized operator (3.1) adds
ε(|Du|^{γ̄−2}Du·Dν + |u|^{γ̄−2}u ν) in the transport slot with γ̄ = α(β+1)/β = 4,
i.e. ε(u′³)′ and ε u³: polynomial, hence within reach of an ℓ¹_ν Fourier
radii polynomial. The plan's feasibility worry ("non-analytic nonlinearity")
does not arise for this instance.

## 2. Elliptic after eliminating m

The HJ equation gives m = u + u′²/2 − V; the transport equation becomes
F_ε(u) = m − (m u′ + ε u′³)′ + ε u³ − 1 = 0, whose linearization is
DF(ū)h = −(c h′)′ + e h with c = m̄ + (1+3ε)ū′² ≥ m̄ and e = 1 − ū″ + 3εū².
So the first-order game (ε = 0) is a second-order elliptic equation for u
wherever m > 0. The certifier needs no ε; the paper's ε makes the abstract
operator coercive on L^β̄ × W^{1,γ̄}, which is a different thing.

## 3. The kernel (new; this machine's)

Space X_s = even cosine sequences with ‖u‖_s = |u_0| + 2Σ|u_k|(1+k)^s ν^k,
ν = 1.05, a Banach algebra for every s ≥ 0 with ‖h′‖_{s−1} ≤ 2π‖h‖_s.
F: X_2 → X_0. A = dense inverse of the N-mode Galerkin Jacobian ⊕ diagonal
1/λ_k, λ_k = c_0(2πk)² + e_0 (e_0 = 1 + 3ε(u²)_0 > 0 always). Y0 explicit
(F(ū) has bandwidth 3N). Z1: explicit columns k ≤ 6N; for k > 6N the
column entries are (2π)²k(k+n)c_n + e_n at rows k+n (|n| ≤ 2N), bounded by
Σ_{n≠0} (|c_n|/c_0)ρ_nω_nν^{n⁺} + |e_n|ω_nν^{n⁺}/λ_{k₀+n} with every
k-dependent factor at its worst case k₀ = 6N+1. Z2(r) = ‖A‖_{0→2}(4π²Γ(r) +
H(r)) with Γ ≥ ‖c(x) − c(ū)‖_1, H ≥ ‖e(x) − e(ū)‖_0 from the algebra
property; the radius cap makes Z2 a scalar. Density on the ball: min m̄ over
512 interval cells minus r + 2π‖ū′‖_0 r + 2π²r².

Checks: the constant solution at A = 0 (the cubic εu³ + u = 1 changes sign
across the ball); a finite-difference Newton solve on 96 periodic points
agrees with certified candidates to 2.8e−5 (O(h²)); five red controls.

## 4. The atlas

10 amplitudes × 5 strengths: 34 PROVED (r from 9e−16 to 7e−8), 16 REFUSED —
15 by Z1 ≥ 1, one by Z1 = 0.997 with no radius closing. Frontier (last
proved A): ε = 0 → 0.7; 0.01 → 0.7; 0.1 → 0.6; 0.3 → 0.5; 1 → 0.4. Every row
proved-then-refused. The certified density floor at (0.7, 0) is 0.32; the
float density at the first refused cell (0.8, 0) is still ≈ 0.22: the void
is the certificate's (a diagonal tail against a varying c), not the
density's. Z1 at ε = 0 along A: 0.10, 0.21, 0.32, 0.44, 0.58, 0.74, 0.94,
1.22, 1.64 — roughly linear in A, the explicit column at k = N+1 worst.

## 5. The regularization measured

‖u_ε − u_0‖_2 decided at every doubly-proved cell (brackets < 1e−5 wide):
at A = 0.4: ε = 0.01 → 1.04e−2, 0.1 → 8.47e−2, 0.3 → 0.187, 1 → 0.358 —
≈ ε at small ε, sublinear beyond (the ratio 1.04, 0.85, 0.62, 0.36). At
A = 0 exactly 1 − u_ε with u_ε the cubic's root (u_1 = 0.6823). Profiles at
A = 0.6: the regularized u sits lower by ≈ ε (the εu³ term acts as extra
discount); the density is slightly flatter.

## 6. Not done

Higher dimensions; the congestion (Theorem 1.5) and weak-growth (1.6)
cases; a banded tail inverse that would push the frontier; uniqueness
beyond the ball or the even subspace; the m = 0 free-boundary regime.
