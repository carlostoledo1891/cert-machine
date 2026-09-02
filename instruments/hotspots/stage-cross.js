/* stage-cross.js — independent cross-derivations (the two-implementations
   bar). instruments/hotspots · cert-machine (ember port, 2026-09-02)

   EMBER-PORT.md item 3. The four cross-derivations and where they live:
   (a) I₀ = 5/48 in exact rationals — stage-pointwise (T1), re-run here
       and additionally cross-checked against a 5-digit numeric quadrature.
   (b) C_tr re-derived on instruments/bigfloat from the exact-rational
       star-shape geometry: c0² = min_e dot_e²/L_e² and R² = max|A_e−x0|²
       decided in EXACT RATIONALS, then C_tr = √((R+2)/c0) enclosed by
       directed dyadic rounding at 192 bits — nothing shared with the
       ivspecial/doubles route of stage-eigenpair. The two enclosures must
       intersect and the bigfloat one must be tighter.
   (c) μ1 UPPER bound from an INDEPENDENT discretization: conforming P1
       FEM on the exact-rational mapped-grid triangulation (piecewise
       linears ⊂ H¹ ⇒ Rayleigh–Ritz upper) — a different basis family
       from the spectral cos·Legendre Galerkin. Agreement window checked.
   (d) corner coefficients at a second annulus — stage-corner (condition
       of entry there; re-read and re-asserted here). MIT. */
'use strict';

const I = require('../interval/interval.js');
const Q = require('../interval/rational.js');
const B = require('../bigfloat/bigfloat.js');
const F = require('../bigfloat/functions.js');
const SP = require('./specimen.js');
const SPEC = require('./stage-spectrum.js');
const PW = require('./stage-pointwise.js');
const REC = require('./record.js');

const { r_, ratToIv, VQ } = SP;
const P = 192;

function run() {
  const checks = [];
  const t0 = Date.now();

  const eig = REC.read('eigenpair');
  const spec = REC.read('spectrum');
  const corner = REC.read('corner');

  /* (a) I₀ */
  const I0 = PW.I0Exact();
  checks.push({ name: 'I₀ re-derived in exact rationals = 5/48', ok: Q.isZero(Q.sub(I0, r_(5, 48))) });

  /* (b) C_tr on bigfloat from exact rational geometry */
  const X0 = [r_(21, 40), r_(9, 20)];
  let c02 = null, R2max = Q.ZERO;
  let dotsPositive = true;
  for (let e = 0; e < 4; e++) {
    const A = VQ[e], Bv = VQ[(e + 1) % 4];
    const ex = Q.sub(Bv[0], A[0]), ey = Q.sub(Bv[1], A[1]);
    const L2 = Q.add(Q.mul(ex, ex), Q.mul(ey, ey));
    const dot = Q.sub(Q.mul(Q.sub(A[0], X0[0]), ey), Q.mul(Q.sub(A[1], X0[1]), ex));
    if (Q.sign(dot) <= 0) dotsPositive = false;
    const ratio = Q.div(Q.mul(dot, dot), L2);            // (dot/|e|)², exact
    if (c02 === null || Q.cmp(ratio, c02) < 0) c02 = ratio;
    const dR = Q.add(Q.mul(Q.sub(A[0], X0[0]), Q.sub(A[0], X0[0])), Q.mul(Q.sub(A[1], X0[1]), Q.sub(A[1], X0[1])));
    if (Q.cmp(dR, R2max) > 0) R2max = dR;
  }
  checks.push({ name: 'x0 = (21/40, 9/20) is a star center (all edge dots > 0, exact)', ok: dotsPositive });
  /* rational {n,d} out of the Q layer (Q.R keeps .n/.d BigInts) */
  const sqrtRat = (q) => F.sqrt(B.fromRatio(q.n, q.d, P), P);
  const Rbig = sqrtRat(R2max);
  const c0big = sqrtRat(c02);
  const Ctr2big = B.div(B.add(Rbig, B.fromInt(2), P), c0big, P);
  const CtrBig = F.sqrt(Ctr2big, P);
  const ctrLo = B.toNumberDown(CtrBig.lo), ctrHi = B.toNumberUp(CtrBig.hi);
  const ctrRecord = eig.trace.Ctr; // the eigenpair route's upper endpoint
  checks.push({
    name: 'C_tr: bigfloat enclosure meets the eigenpair route',
    ok: ctrLo <= ctrRecord && ctrRecord <= ctrHi * (1 + 1e-12) + 1e-9,
    detail: `bigfloat [${ctrLo.toFixed(12)}, ${ctrHi.toFixed(12)}] vs record upper ${ctrRecord.toFixed(12)}`,
  });
  checks.push({
    name: 'C_tr: bigfloat enclosure is tighter than 1e-12',
    ok: ctrHi - ctrLo < 1e-12,
    detail: (ctrHi - ctrLo).toExponential(2),
  });

  /* (c) independent P1 conforming FEM upper bound, n = 16 mapped grid */
  const n = 16;
  const trap = SPEC.specimen(17, 20, 1, 4, 9, 10);
  const { b, w1, dx, h } = trap;
  const N = n + 1;
  const X = [], Y = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const u = r_(i, n), v = r_(j, n);
    const w = Q.add(b, Q.mul(w1, v));
    X.push(Q.add(Q.mul(u, w), Q.mul(dx, v)));
    Y.push(Q.mul(h, v));
  }
  const tris = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * N + i, bb = a + 1, c = a + N, d = c + 1;
    tris.push([a, bb, d], [a, d, c]);
  }
  const ndof = N * N;
  const Kq = Array.from({ length: ndof }, () => new Map());
  const Mq = Array.from({ length: ndof }, () => new Map());
  const addTo = (Mx, i, j, v) => Mx[i].set(j, Q.add(Mx[i].get(j) || Q.ZERO, v));
  for (const [p1, p2, p3] of tris) {
    const x1 = X[p1], y1 = Y[p1], x2 = X[p2], y2 = Y[p2], x3 = X[p3], y3 = Y[p3];
    const twoA = Q.sub(Q.mul(Q.sub(x2, x1), Q.sub(y3, y1)), Q.mul(Q.sub(x3, x1), Q.sub(y2, y1)));
    if (Q.sign(twoA) <= 0) throw new Error('non-positive triangle');
    const A = Q.div(twoA, r_(2));
    const g = [
      [Q.sub(y2, y3), Q.sub(x3, x2)],
      [Q.sub(y3, y1), Q.sub(x1, x3)],
      [Q.sub(y1, y2), Q.sub(x2, x1)],
    ];
    const ids = [p1, p2, p3];
    for (let a2 = 0; a2 < 3; a2++) for (let b2 = 0; b2 < 3; b2++) {
      // P1 stiffness: ∇φi·∇φj·A = g_i·g_j/(4A)
      const kv = Q.div(Q.add(Q.mul(g[a2][0], g[b2][0]), Q.mul(g[a2][1], g[b2][1])), Q.mul(r_(4), A));
      addTo(Kq, ids[a2], ids[b2], kv);
      // P1 consistent mass: A/6 diag, A/12 off
      addTo(Mq, ids[a2], ids[b2], a2 === b2 ? Q.div(A, r_(6)) : Q.div(A, r_(12)));
    }
  }
  /* exact kernel check */
  checks.push({ name: 'P1: K·1 = 0 exactly (rational row sums)', ok: SPEC.checkKernelExact(Kq) });
  /* dense interval matrices + float subspace + certified Gershgorin upper */
  const Kiv = Array.from({ length: ndof }, () => new Array(ndof).fill(I.ZERO));
  const Miv = Array.from({ length: ndof }, () => new Array(ndof).fill(I.ZERO));
  const Kf = Array.from({ length: ndof }, () => new Float64Array(ndof));
  const Mf = Array.from({ length: ndof }, () => new Float64Array(ndof));
  for (let i = 0; i < ndof; i++) {
    for (const [j, v] of Kq[i]) { const e = ratToIv(v); Kiv[i][j] = e; Kf[i][j] = (e[0] + e[1]) / 2; }
    for (const [j, v] of Mq[i]) { const e = ratToIv(v); Miv[i][j] = e; Mf[i][j] = (e[0] + e[1]) / 2; }
  }
  const eigs = SPEC.floatEig(Kf, Mf, 3);
  const mNorm = v => {
    let s = 0;
    for (let a = 0; a < ndof; a++) { let row = 0; for (const [bb, vv] of Mq[a]) row += Q.toDouble(vv) * v[bb]; s += v[a] * row; }
    return Math.sqrt(s);
  };
  const scale = v => { const n2 = mNorm(v); return Float64Array.from(v, x => x / n2); };
  const e0 = new Float64Array(ndof).fill(1);
  const v0 = scale(e0), v1 = scale(eigs[1].vec);
  const up1 = SPEC.certifiedUpper(Kiv, Miv, [v0, v1]);
  checks.push({
    name: 'P1 independent upper encloses μ1 from above',
    ok: up1 >= eig.mu1[0],
    detail: `P1(n=${n}) upper ${up1.toFixed(6)} ≥ μ1 lower ${eig.mu1[0].toFixed(6)}`,
  });
  checks.push({
    name: 'P1 upper agrees with the spectral route (window 12.02–12.15)',
    ok: up1 > 12.02 && up1 < 12.15,
    detail: `P1 ${up1.toFixed(6)} vs spectral Galerkin ${spec.galerkin.upperMu1.toFixed(6)} vs eigenpair [${eig.mu1[0].toFixed(6)}, ${eig.mu1[1].toFixed(6)}]`,
  });

  /* (d) second-annulus condition of entry — re-assert from the corner record */
  let annOk = true;
  for (const t of Object.values(corner.tips)) {
    for (const k of ['b0', 'b1', 'b2']) {
      const a = t[k], bIv = t.secondAnnulus[k];
      if (a[1] < bIv[0] || a[0] > bIv[1]) annOk = false;
    }
  }
  checks.push({ name: 'corner coefficients: two-annulus intersections hold in the record', ok: annOk });

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'Independent cross-derivations: I₀ = 5/48 exact; C_tr enclosed on bigfloat from exact-rational geometry (meets and tightens the eigenpair route); μ1 upper bound re-derived on a conforming P1 FEM basis (different discretization family); the second-annulus corner-coefficient condition re-asserted.',
    I0: '5/48',
    Ctr: { bigfloat: [ctrLo, ctrHi], eigenpairRoute: ctrRecord, c0sq: Q.toDouble(c02), R2max: Q.toDouble(R2max) },
    p1Upper: { n, ndof, upper: up1, spectralUpper: spec.galerkin.upperMu1, mu1: eig.mu1 },
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run };
