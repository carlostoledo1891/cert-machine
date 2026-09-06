/* enclose.test.js — node experiments/transit/enclose.test.js
   Known answers for the enclosure machinery. The kernel has its own file; this
   one is about the certificate, the witness, and the two ladders. */
'use strict';
const E = require('./enclose.js');
const T = require('./transit.js');
let fail = 0;
const ok = (n, c, got) => { if (!c) fail++; console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${c ? '' : '   got ' + JSON.stringify(got)}`); };
const near = (a, b, t) => Math.abs(a - b) <= t;
const inIv = (A, x) => A[0] <= x && x <= A[1];

/* ---- the monotone rung's kernel, from a different derivation ------------- */
{
  const quad = (s, z, k, N) => { let a = 0; for (let i = 0; i < N; i++) { const r = s * (i + 0.5) / N; a += T.arcFrac(r, z, k) * 2 * Math.PI * r * (s / N); } return a; };
  let worst = 0;
  for (const k of [0.05, 0.125, 0.3]) for (const z of [0, 0.3, 0.85, 1.0, 1.1]) for (const s of [0.2, 0.5, 0.9, 1.0])
    worst = Math.max(worst, Math.abs(quad(s, z, k, 500000) - E.lensAreaG(s, z, k)));
  ok('lensAreaG = integral of the arc kernel, 60 cases', worst < 2e-6, worst);
  ok('lensAreaG(1, z, k) = lensArea(z, k)',
    near(E.lensAreaG(1, 0.9, 0.2), T.lensArea(0.9, 0.2), 1e-12) && near(E.lensAreaG(1, 1.05, 0.2), T.lensArea(1.05, 0.2), 1e-12));
  ok('planet inside a disk of radius s -> pi k^2', near(E.lensAreaG(0.9, 0.3, 0.1), Math.PI * 0.01, 1e-12));
  ok('disks apart -> 0', E.lensAreaG(0.4, 1.0, 0.1) === 0);
  ok('disk inside the planet -> pi s^2', near(E.lensAreaG(0.05, 0.02, 0.3), Math.PI * 0.0025, 1e-12));
  let all = true, s = 7;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 3000; i++) {
    const k = 0.02 + 0.3 * rnd(), z = 0.15 + 1.1 * rnd(), x = 0.02 + 0.97 * rnd();
    if (!inIv(E.lensAreaGIv([x, x], [z, z], k), E.lensAreaG(x, z, k))) all = false;
  }
  ok('lensAreaGIv encloses lensAreaG at 3000 points', all);
  const P = E.lensAreaGIv([0.7, 0.8], [0.85, 0.95], 0.125);
  ok('a fat cell encloses its interior', inIv(P, E.lensAreaG(0.74, 0.91, 0.125)) && inIv(P, E.lensAreaG(0.79, 0.86, 0.125)));

  /* the monotone kernel IS the depth of a uniform disk of radius s */
  const R = E.RUNGS.monotone;
  ok('monotone kernel at s=1 is the uniform-star depth',
    near(R.f(1, 0.85, 0.125), T.uniformDepth(0.85, 0.125), 1e-12), R.f(1, 0.85, 0.125));
  ok('monotone kernel is 0 where the disk cannot reach the planet', R.f(0.3, 0.9, 0.125) === 0);
  ok('  and its interval form agrees', JSON.stringify(R.iv([0.1, 0.3], [0.9, 0.95], 0.125)) === '[0,0]');
}

/* ---- a hand-sized problem with an answer known by inspection ------------- *
 * One bin, kernel w(r) rising with r. The reachable depths are exactly the
 * range of w over [0,1], so the box [l,u] is met iff it meets that range. */
{
  const mkbin = (t, f, sg) => ({ tmin: t, tmax: t, tmid: t, f, sigma: sg, n: 9, stated: sg, measured: sg });
  const geom = { aR: [10, 10], b: [0.2, 0.2], t0: [0, 0], P: 3 };
  const k = 0.1;
  const z0 = T.zOf(0, 10, 0.2, 3);
  const wmax = Math.max(...Array.from({ length: 400 }, (_, i) => T.arcFrac((i + 0.5) / 400, z0, k)));
  /* a depth ABOVE anything the kernel can reach is refutable at any budget */
  const tooDeep = E.decide([mkbin(0, 1 - (wmax + 0.2), 1e-6)], k, 'none', geom, { nsig: 3, sys: 0 }, { grid: 400, iters: 120, inner: 30, maxCells: 40000 });
  ok('a depth deeper than the kernel can reach is refuted', tooDeep.verdict === 'refuted', tooDeep.verdict);
  /* a depth inside the reachable range is admitted, and the witness is an atom */
  const okDepth = E.decide([mkbin(0, 1 - 0.5 * wmax, 1e-4)], k, 'none', geom, { nsig: 3, sys: 0 }, { grid: 400, iters: 120, inner: 30, maxCells: 40000 });
  ok('a reachable depth is admitted with an atomic witness',
    okDepth.verdict === 'admitted' && okDepth.atoms.length >= 1, okDepth.verdict);
  ok('  the witness has unit mass', okDepth.verdict === 'admitted' && near(okDepth.atoms.reduce((a, x) => a + x.w, 0), 1, 1e-9));
  /* a NEGATIVE depth cannot be produced by a nonnegative measure at all */
  const neg = E.decide([mkbin(0, 1 + 0.01, 1e-6)], k, 'none', geom, { nsig: 3, sys: 0 }, { grid: 400, iters: 120, inner: 30, maxCells: 40000 });
  ok('a brightening cannot come from a nonnegative measure', neg.verdict === 'refuted', neg.verdict);
}

/* ---- boxMax and certifiedMin, exactly ----------------------------------- */
{
  const P = { m: 2, lo: [1, 2], hi: [3, 4], single: false, shape: 'box' };
  ok('boxMax picks u on the upper block and l on the lower',
    E.boxMax(P, Float64Array.from([2, 0, -1, 0])) === 2 * 3 + (-1) * 1, E.boxMax(P, Float64Array.from([2, 0, -1, 0])));
  ok('boxMax refuses a multiplier with the wrong sign',
    E.boxMax(P, Float64Array.from([-1, 0, 0, 0])) === Infinity);
}

/* ---- the ladders are NESTED, which is the whole point of a ladder -------- */
{
  const T2 = require('./transit.js');
  const P = 2.4706, aR = 8.4, b = 0.55, kT = 0.1;
  const prof = r => { const mu = Math.sqrt(Math.max(0, 1 - r * r)); return 1 - 0.4 * (1 - mu) - 0.2 * (1 - mu) ** 2; };
  const NR = 3000, w = []; let n = 0;
  for (let i = 0; i < NR; i++) { const r = (i + 0.5) / NR, dm = 2 * Math.PI * r * prof(r) / NR; w.push([r, dm]); n += dm; }
  for (const x of w) x[1] /= n;
  const dep = (z, k) => { let s = 0; for (const [r, m] of w) s += T2.arcFrac(r, z, k) * m; return s; };
  const bins = [];
  for (let i = -60; i <= 60; i++) { const t = i * 0.0012; bins.push({ tmin: t, tmax: t, tmid: t, f: 1 - dep(T2.zOf(t, aR, b, P), kT), sigma: 80e-6, stated: 80e-6, measured: 80e-6, n: 9 }); }
  const geom = { aR: [aR, aR], b: [b, b], t0: [0, 0], P };
  const O = { grid: 500, iters: 200, inner: 35, maxCells: 60000 };
  const v = (k, rung, ns) => E.decide(bins, k, rung, geom, { nsig: ns, sys: 0 }, O).verdict;

  ok('the truth is admitted under both rungs',
    v(kT, 'none', 3) === 'admitted' && v(kT, 'monotone', 3) === 'admitted');
  /* monotone is a SUBSET of nonnegative, so it can only refute more */
  let nested = true;
  for (const k of [0.06, 0.08, 0.1, 0.14, 0.2]) {
    if (v(k, 'none', 3) === 'refuted' && v(k, 'monotone', 3) === 'admitted') nested = false;
  }
  ok('monotone never admits what nonnegativity refutes', nested);
  /* a wider budget is a larger set, so it can only admit more */
  let mono = true;
  for (const k of [0.07, 0.09, 0.13, 0.17]) {
    if (v(k, 'none', 1) === 'admitted' && v(k, 'none', 6) === 'refuted') mono = false;
  }
  ok('widening the error budget never refutes what a tighter one admitted', mono);
  ok('a k far below the truth is refuted', v(0.03, 'monotone', 3) === 'refuted');
}

/* ---- the witness re-check must catch a bad witness ---------------------- */
{
  const bins = [{ tmin: 0, tmax: 0, tmid: 0, f: 0.99, sigma: 1e-4, stated: 1e-4, measured: 1e-4, n: 9 }];
  const P = E.makeProblem(bins, 0.12, 'none', { aR: [9, 9], b: [0.3, 0.3], t0: [0, 0], P: 3 }, { nsig: 3, sys: 0 });
  const grid = new Float64Array([0.2, 0.5, 0.9]);
  ok('a witness with negative mass is refused', E.verifyWitness(P, [{ g: 0, w: -0.1 }, { g: 1, w: 1.1 }], grid).ok === false);
  ok('a witness that does not sum to one is refused', E.verifyWitness(P, [{ g: 0, w: 0.5 }], grid).ok === false);
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
