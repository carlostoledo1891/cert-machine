/* lab-fixtures.js — the kernels the Lab batteries study.

   Shared rather than copied. Two batteries need a solver with a real,
   linearly-converging iteration, and two copies of one would drift in exactly
   the way `core/interval/tests/test-single-source.js` exists to prevent one level
   down. One implementation, parameterised.

   WHY JACOBI AND NOT CONJUGATE GRADIENTS — a fixture mistake worth keeping.
   CG has FINITE TERMINATION: on an m-unknown system it reaches the exact
   answer in m steps, so at m=15 the residual fell from 4e-2 to 2e-16 in a
   single iteration and every tolerance below that returned bit-identical
   output. The tolerance knob was inert, so the order study's contamination
   test had nothing to detect and passed trivially — a green check measuring
   nothing. Jacobi converges linearly (spectral radius cos(pi h) for the
   Laplacian), so the error moves continuously with the tolerance. It is also
   the honest fixture for this lab's domain: fictitious play, Picard and
   fixed-point MFG solvers converge linearly and none terminate finitely.

   MIT licensed. Part of the MFG Lab. */
'use strict';

/* Jacobi for the shifted 1D Dirichlet operator  -u'' - k2 u = f  on (0,1),
   discretised by central differences on n intervals (m = n-1 interior nodes).

   k2 = 0 is the Laplacian. k2 > 0 is Helmholtz, whose Jacobi iteration matrix
   has spectral radius 2cos(pi h)/(2 - h^2 k2): it crosses 1 at k2 = 4 sin^2(pi h/2)/h^2,
   which tends to pi^2. So this one parameter carries a genuine, derivable
   failure boundary at k ~ pi — the first eigenvalue — which is what makes it
   a fixture for the failure map rather than an invented one.

   Bails out on non-finite iterates: a real solver does, and it keeps a
   divergent point from spending its whole iteration budget on NaN. */
function jacobi(m, h, f, k2, tol, maxit) {
  const h2 = h * h, diag = 2 - h2 * k2;
  const u = new Float64Array(m), v = new Float64Array(m);
  let nf = 0;
  for (let i = 0; i < m; i++) nf += f[i] * f[i];
  nf = Math.sqrt(nf);

  const relres = w => {
    let s = 0;
    for (let i = 0; i < m; i++) {
      const l = i > 0 ? w[i - 1] : 0, r = i < m - 1 ? w[i + 1] : 0;
      const Aw = (2 * w[i] - l - r) / h2 - k2 * w[i];
      s += (f[i] - Aw) * (f[i] - Aw);
    }
    return Math.sqrt(s) / nf;
  };

  let iters = 0, rel = 1;
  while (iters < maxit) {
    rel = relres(u);
    if (rel < tol) break;
    if (!Number.isFinite(rel)) break;
    for (let i = 0; i < m; i++) {
      const l = i > 0 ? u[i - 1] : 0, r = i < m - 1 ? u[i + 1] : 0;
      v[i] = (l + r + h2 * f[i]) / diag;
    }
    u.set(v); iters++;
  }
  return { u: Array.from(u), iters, residual: rel };
}

/* The manufactured solution, shared by every kernel below: u = x(1-x)e^x, so
   -u'' = x(3+x)e^x and u vanishes at both ends.

   IT IS DELIBERATELY NOT sin(pi x). That was the first draft and it is an
   EIGENVECTOR of the discrete Laplacian, so an iterative solver lands on the
   exact answer almost immediately and the iteration tolerance stops mattering.
   A fixture that cannot exhibit the phenomenon under test is the same species
   of defect as a certificate that cannot go red. x(1-x)e^x has broad spectral
   content. */
const uExact = x => x * (1 - x) * Math.exp(x);
const minusUpp = x => x * (3 + x) * Math.exp(x);

function interior(n, fn) {
  const h = 1 / n, m = n - 1, out = new Array(m);
  for (let i = 0; i < m; i++) out[i] = fn((i + 1) * h);
  return out;
}

/* -u'' = f. Central differences: truncation O(h^2), so order 2. */
const poisson1d = {
  name: 'poisson1d (central differences, Jacobi)',
  levels: [16, 32, 64, 128],
  h: n => 1 / n,
  solve({ n, tol }) {
    const f = Float64Array.from(interior(n, minusUpp));
    return jacobi(n - 1, 1 / n, f, 0, tol, 400000);
  },
  exact({ n }) { return interior(n, uExact); }
};

/* -u'' - k^2 u = f, same manufactured u, so f picks up the -k^2 u term.
   params.k selects the shift; Jacobi fails past k ~ pi. */
const helmholtz1d = {
  name: 'helmholtz1d (shifted Laplacian, Jacobi)',
  levels: [16, 32, 64],
  h: n => 1 / n,
  solve({ n, tol, params }) {
    const k = (params && params.k) || 0, k2 = k * k;
    const f = Float64Array.from(interior(n, x => minusUpp(x) - k2 * uExact(x)));
    return jacobi(n - 1, 1 / n, f, k2, tol, 50000);
  },
  exact({ n }) { return interior(n, uExact); }
};

/* u' = pi cos(pi x), u(0) = 0, exact u = sin(pi x). Explicit Euler, DIRECT —
   global error O(h), and exactly zero iteration movement, which makes it the
   control for the order study's contamination test. */
const euler1d = {
  name: 'euler1d (explicit Euler, direct)',
  levels: [16, 32, 64, 128],
  h: n => 1 / n,
  solve({ n }) {
    const h = 1 / n, u = new Array(n + 1);
    u[0] = 0;
    for (let i = 0; i < n; i++) u[i + 1] = u[i] + h * Math.PI * Math.cos(Math.PI * i * h);
    return { u, iters: 1, residual: null };
  },
  exact({ n }) {
    const h = 1 / n, u = new Array(n + 1);
    for (let i = 0; i <= n; i++) u[i] = Math.sin(Math.PI * i * h);
    return u;
  }
};

/* poisson1d carrying a fixed modelling error — the shape of a dropped term or
   a wrong boundary condition. Converges beautifully to the wrong thing: the
   errors keep falling and the spread stays narrow, so only a DECLARED order
   catches it. */
const stalled = Object.assign({}, poisson1d, {
  name: 'stalled (poisson1d + a dropped term)',
  solve(args) {
    const out = poisson1d.solve(args);
    const h = 1 / args.n;
    for (let i = 0; i < out.u.length; i++) out.u[i] += 1e-3 * Math.sin(2 * Math.PI * (i + 1) * h);
    return out;
  }
});

/* A synthetic fixture with a PRESCRIBED error sequence — no PDE is solved. Its
   errors fall monotonically and its solver is direct, so it clears both the
   monotonicity and contamination rules and lands on the interval-width rule,
   which no physical kernel here reaches. Written because a correct-but-untested
   branch is one refactor from wrong. */
const PRESCRIBED = { 16: 1e-2, 32: 1e-3, 64: 5e-4, 128: 4.9e-4 };
const preAsymptotic = {
  name: 'preAsymptotic (synthetic fixture, prescribed errors)',
  levels: [16, 32, 64, 128],
  h: n => 1 / n,
  solve({ n }) {
    /* h-weighted L2 of sin(2 pi x) over the interior nodes is ~1/sqrt(2). */
    const amp = PRESCRIBED[n] * Math.SQRT2;
    return { u: interior(n, x => amp * Math.sin(2 * Math.PI * x)), iters: 1, residual: null };
  },
  exact({ n }) { return new Array(n - 1).fill(0); }
};

/* Raises on a parameter value, so the failure map has a `threw` point to
   classify rather than to die on. */
const explodes = Object.assign({}, helmholtz1d, {
  name: 'explodes (throws above k=4)',
  solve(args) {
    if (args.params && args.params.k > 4) throw new Error('unsupported regime k=' + args.params.k);
    return helmholtz1d.solve(args);
  }
});

module.exports = { jacobi, poisson1d, helmholtz1d, euler1d, stalled, preAsymptotic, explodes, uExact, minusUpp, interior };
