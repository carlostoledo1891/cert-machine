# instruments/regatlas — the regularization, measured

Ferreira–Gomes–Üçer (arXiv:2506.21212) prove existence for stationary first-
order mean-field games by adding a low-order p-Laplacian to the MFG operator
(their (3.1)) so that it becomes coercive, then sending ε → 0. On the one-
dimensional torus with H = |p|²/2 − m, a discount and V = A cos 2πx the
regularization is polynomial (γ̄ = 4), and this instrument encloses every
regularized equilibrium AND the unregularized one across an atlas in (A, ε),
then decides the distance between them.

```
node instruments/regatlas/run.js          write certs/regatlas.json (about 22 s, 50 certificates)
node instruments/regatlas/run.js --check  re-derive and compare, write nothing
node instruments/regatlas/battery.js      the gate: 17 checks, 5 red controls
```

| file | what |
|---|---|
| `kernel.js` | the new kernel: F_ε(u) = m − (m u′ + ε u′³)′ + ε u³ − 1 with m = u + u′²/2 − V; its Sturm–Liouville linearisation −(c h′)′ + e h; Newton continuation; the radii polynomial in X_2 = ℓ¹ with weight (1 + k)² ν^k (explicit columns to 6N, analytic tail, Z2 by the algebra property); the density floor on the ball |
| `derive.js` | the 10 × 5 atlas, the frontier per ε, the decided distances ‖u_ε − u_0‖_2, the profiles at A = 0.6 |

**Proved (cell by cell).** A unique zero of F_ε in a ball of X_2 about the
Galerkin candidate, in the even subspace; a classical solution with m > 0
on the ball, so a strong solution with m bounded away from zero.

**Decided.** The distances at doubly-proved cells; ellipticity (c₀ > 0,
e₀ ≥ 0) on proved cells; the cubic ε u³ + u = 1 at A = 0.

**Not claimed.** Anything on a refused cell; uniqueness beyond the ball or
the even subspace; the paper's d-dimensional and singular cases. Every
refusal is Z1 ≥ 1 from the diagonal tail against a varying principal
coefficient — the certificate's frontier, not the equation's.
