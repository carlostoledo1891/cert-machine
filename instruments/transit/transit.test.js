/* transit.test.js — node experiments/transit/transit.test.js
   Cases with answers known before running. The kernel here decides a published
   number, so it gets the treatment align() should have had: an independent
   closed form, exact limits, and containment for every interval routine. */
'use strict';
const T = require('./transit.js');
let fail = 0;
const ok = (name, cond, got) => { if (!cond) fail++; console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '   got ' + JSON.stringify(got)}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const inIv = (A, x) => A[0] <= x && x <= A[1];

/* ---- iacos / isqrt against exact values -------------------------------- */
{
  const cases = [[1, 0], [0, Math.PI / 2], [-1, Math.PI], [0.5, Math.PI / 3], [-0.5, 2 * Math.PI / 3]];
  let all = true;
  for (const [x, want] of cases) { const A = T.iacos([x, x]); if (!inIv(A, want)) { all = false; console.log('   ', x, A, want); } }
  ok('iacos encloses acos at 1, 0, -1, +-1/2', all);
  ok('iacos of [-1,1] is [0,pi]', inIv(T.iacos([-1, 1]), 0) && inIv(T.iacos([-1, 1]), Math.PI));
  let mono = true;
  for (let i = 0; i <= 200; i++) { const x = -1 + 2 * i / 200; if (!inIv(T.iacos([x, x]), Math.acos(x))) mono = false; }
  ok('iacos encloses acos at 201 points', mono);
  ok('isqrt encloses sqrt(2), sqrt(0), sqrt(1e-30)',
    inIv(T.isqrt([2, 2]), Math.SQRT2) && inIv(T.isqrt([0, 0]), 0) && inIv(T.isqrt([1e-30, 1e-30]), 1e-15));
  let thrown = false; try { T.isqrt([-2, -1]); } catch (e) { thrown = true; }
  ok('isqrt refuses a negative interval', thrown);
}

/* ---- the kernel against a DIFFERENT derivation -------------------------
   INT_0^1 w(r;z,k) 2r dr is the area of intersection of the unit disk with the
   planet disk, over pi. lensArea is that area in closed form, derived from
   circular segments and sharing no line of code with arcFrac. */
{
  const quad = (z, k, N) => { let s = 0; for (let i = 0; i < N; i++) { const r = (i + 0.5) / N; s += T.arcFrac(r, z, k) * 2 * r / N; } return s; };
  let worst = 0, wcase = null;
  for (const k of [0.02, 0.1, 0.125, 0.3]) {
    for (const z of [0, 0.11, 0.3, 0.5, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1]) {
      const d = Math.abs(quad(z, k, 400000) - T.uniformDepth(z, k));
      if (d > worst) { worst = d; wcase = [z, k]; }
    }
  }
  ok('kernel integral = lens area for 40 (z,k), to 1e-7', worst < 1e-7, [worst, wcase]);

  let exact = true;
  for (const k of [0.02, 0.125, 0.3]) for (const z of [0, 0.2, 0.5, 1 - k - 1e-6])
    if (!near(quad(z, k, 400000), k * k, 1e-8)) { exact = false; console.log('   ', z, k, quad(z, k, 400000), k * k); }
  ok('planet fully on the disk -> depth is exactly k^2, for every z', exact);
}

/* ---- exact limits of the kernel --------------------------------------- */
{
  ok('z=0: covered inside k, bare outside',
    T.arcFrac(0.05, 0, 0.1) === 1 && T.arcFrac(0.2, 0, 0.1) === 0);
  ok('circle inside the planet (z+r<=k) -> 1', T.arcFrac(0.05, 0.04, 0.1) === 1);
  ok('disjoint (r+k<=z) -> 0', T.arcFrac(0.1, 0.5, 0.1) === 0);
  ok('planet inside the circle (r>=z+k) -> 0', T.arcFrac(0.9, 0.5, 0.1) === 0);
  const eps = 1e-9;
  ok('tangency z+r=k approaches 1', near(T.arcFrac(0.06 - eps, 0.04, 0.1), 1, 1e-4));
  ok('tangency r=z+k approaches 0', near(T.arcFrac(0.6 + eps, 0.5, 0.1), 0, 1e-4));
  ok('tangency r+k=z approaches 0', near(T.arcFrac(0.4 - eps, 0.5, 0.1), 0, 1e-4));
  ok('k=0 blocks nothing', T.arcFrac(0.5, 0.5, 0) === 0);
  /* the half-covered case has a closed form: r = z, the planet's centre sits on
     the circle, and the covered arc is 2 asin(k/2r) / (2 pi) */
  const r = 0.7, k = 0.2;
  /* planet centre ON the circle: g = 1 - k^2/2r^2 = 1 - 2 s^2 with s = k/2r,
     and acos(1 - 2 s^2) = 2 asin(s), so the covered fraction is 2 asin(s)/pi.
     Asserting asin(s)/pi here failed by exactly a factor of two and the kernel
     was right — which is the reason this file exists. */
  ok('planet centred on the circle: 2 asin(k/2r)/pi',
    near(T.arcFrac(r, r, k), 2 * Math.asin(k / (2 * r)) / Math.PI, 1e-12), T.arcFrac(r, r, k));
}

/* ---- interval kernel encloses the float kernel ------------------------- */
{
  let all = true, worstW = 0;
  let s = 12345;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 4000; i++) {
    const k = 0.02 + 0.3 * rnd(), z = 0.2 + 1.0 * rnd(), r = 0.02 + 0.97 * rnd();
    const A = T.arcFracIv([r, r], [z, z], k);
    if (!inIv(A, T.arcFrac(r, z, k))) { all = false; }
    worstW = Math.max(worstW, A[1] - A[0]);
  }
  ok('arcFracIv contains arcFrac at 4000 points', all);
  ok('  and is thin there (width < 1e-9)', worstW < 1e-9, worstW);

  /* a fat cell must contain every point inside it */
  let cover = true;
  for (let i = 0; i < 300; i++) {
    const k = 0.125, R = [0.60, 0.66], Z = [0.80, 0.90];
    const A = T.arcFracIv(R, Z, k);
    const r = R[0] + (R[1] - R[0]) * rnd(), z = Z[0] + (Z[1] - Z[0]) * rnd();
    if (!inIv(A, T.arcFrac(r, z, k))) cover = false;
  }
  ok('a fat (r,z) cell encloses every point in it', cover);

  /* refinement shrinks: the union of halves sits inside the parent */
  const P = T.arcFracIv([0.6, 0.7], [0.8, 0.9], 0.125);
  const H1 = T.arcFracIv([0.6, 0.65], [0.8, 0.9], 0.125), H2 = T.arcFracIv([0.65, 0.7], [0.8, 0.9], 0.125);
  ok('halves are inside the parent enclosure', H1[0] >= P[0] - 1e-15 && H1[1] <= P[1] + 1e-15 && H2[0] >= P[0] - 1e-15 && H2[1] <= P[1] + 1e-15);
  ok('  and together they are strictly tighter', Math.max(H1[1], H2[1]) - Math.min(H1[0], H2[0]) < P[1] - P[0]);

  /* a cell anchored at r=0 cannot be refined, so the two clean regimes must be
     exact and only an edge-crossing cell may fall back to the hull */
  ok('r=0 cell, planet far away -> exactly 0', JSON.stringify(T.arcFracIv([0, 0.1], [0.9, 0.95], 0.125)) === '[0,0]');
  ok('r=0 cell, circle inside the planet -> exactly 1', JSON.stringify(T.arcFracIv([0, 0.05], [0.05, 0.06], 0.2)) === '[1,1]');
  const hull = T.arcFracIv([0, 0.1], [0.05, 0.06], 0.125);
  ok('r=0 cell the planet edge crosses -> the sound hull', hull[0] === 0 && hull[1] === 1, hull);
}

/* ---- geometry --------------------------------------------------------- */
{
  ok('z(0) = b', near(T.zOf(0, 8.39, 0.8186, 2.4706), 0.8186, 1e-12));
  ok('z is symmetric in dt', near(T.zOf(0.03, 8.39, 0.8186, 2.4706), T.zOf(-0.03, 8.39, 0.8186, 2.4706), 1e-14));
  ok('z grows away from mid-transit', T.zOf(0.04, 8.39, 0.8186, 2.4706) > T.zOf(0.02, 8.39, 0.8186, 2.4706));
  ok('b=0 gives z = aR |sin th|', near(T.zOf(0.05, 8.39, 0, 2.4706), 8.39 * Math.abs(Math.sin(2 * Math.PI * 0.05 / 2.4706)), 1e-12));
  let all = true;
  for (let i = -40; i <= 40; i++) {
    const dt = i * 0.002;
    const Z = T.zIv([dt, dt], [8.39, 8.39], [0.8186, 0.8186], 2.4706);
    if (!inIv(Z, T.zOf(dt, 8.39, 0.8186, 2.4706))) all = false;
  }
  ok('zIv contains zOf across the transit', all);
  const Zf = T.zIv([-0.01, 0.01], [8.3, 8.5], [0.80, 0.84], 2.4706);
  ok('a fat geometry cell encloses its interior',
    inIv(Zf, T.zOf(0.004, 8.42, 0.81, 2.4706)) && inIv(Zf, T.zOf(-0.009, 8.31, 0.839, 2.4706)));
}

/* ---- binning ---------------------------------------------------------- */
{
  const pts = [];
  for (let i = 0; i < 100; i++) pts.push({ t: i / 100, f: 1 - i / 1000, e: 0.01 });
  const b = T.binCurve(pts, [0, 0.5, 1.0]);
  ok('two bins, 50 points each', b.length === 2 && b[0].n === 50 && b[1].n === 50);
  ok('bin mean is the mean of its members', near(b[0].f, 1 - (24.5 / 1000), 1e-12), b[0].f);
  ok('bin carries the propagated standard error', near(b[0].stated, 0.01 / Math.sqrt(50), 1e-12), b[0].stated);
  ok('bin sigma is the LARGER of stated and measured scatter',
    near(b[0].sigma, Math.max(b[0].stated, b[0].measured), 1e-15) && b[0].sigma >= b[0].stated, [b[0].sigma, b[0].stated, b[0].measured]);
  ok('bin carries the span of its members', near(b[0].tmin, 0, 1e-15) && near(b[0].tmax, 0.49, 1e-12));
  ok('every point lands in exactly one bin', b[0].n + b[1].n === 100);
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
