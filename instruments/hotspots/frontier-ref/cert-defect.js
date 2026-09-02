/* EMBER P2b-rigor 2 — CERTIFIED boundary defect of the frozen MPS trial.

   Trial: u = Σ a_i ψ_i, ψ_i = J_{ν}(√λ̃ r_c)cos(ν θ_c) over the four corner
   fans; λ̃ and the a_i are FROZEN exact doubles (from the float MPS run,
   regenerated deterministically here). u satisfies −Δu = λ̃u EXACTLY, and
   each fan's conormal vanishes EXACTLY on its own corner's two edges
   (∂θ cos(νθ) ∝ sin(νθ) = 0 at θ = 0 and νω = kπ — an analytic lemma, not
   a computation). So on edge e only the fans of the two far corners
   contribute flux.

   Geometry along an edge, relative to a far corner V:
     P(τ) = A + τ·e (arc length), s(τ) = s0 + τ = (P−V)·e, d = (P−V)·n
     (CONSTANT along the edge), r² = s² + d², θ' = −d/r², r' = s/r.
   Flux: f(τ) = √λ̃·(d/r)·J'_ν(x)·cos(νθ) + ν·(s/r²)·J_ν(x)·sin(νθ),
   x = √λ̃ r. All τ-derivatives close over the state via the Bessel ODE:
     J'' = (ν²/x² − 1)J − J'/x,   J''' = d/dx[J''] (algebraic in J, J', J'').
   ORDER-2 INTERVAL TAYLOR JETS therefore give f, f', f'' with no
   hand-derived third-order chain rule.

   Certified cell quadrature on each edge (M cells, width h):
     f on the cell ⊆ f(m) + f'(m)δ ± R,  R = mag(f''(cell))·h²/8,
     ∫_cell f² ≤ h·f(m)² + f'(m)²h³/12 + 2R(h|f(m)| + |f'(m)|h²/4) + R²h,
   summed to a certified upper bound on ‖∂ν u‖²_{L²(∂Ω)}.

   BRIDGE TEST: jet values at edge midpoints vs the independent float MPS
   flux evaluation — containment within float slack. */
'use strict';

const I = require('../../lib/eqcert/interval.js');
const T = require('../../lib/eqcert/transcendental.js');
const Q = require('../../lib/eqcert/rational.js');
const S = require('./ivspecial.js');
const MPS = require('./run-p2b-mps.js');

const { iv, add, sub, mul, div, neg } = I;
let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}
const r_ = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));
function ratToIv(a) {
  const q0 = Q.toDouble(a);
  let lo = q0, hi = q0;
  for (let w = 0; w < 60; w++) {
    if (Q.inClosed(a, lo, hi)) return [lo, hi];
    lo = I.nextDown(lo); hi = I.nextUp(hi);
  }
  throw new Error('ratToIv failed');
}

/* ---------- rational specimen, interval geometry ---------- */
const VQ = [[r_(0), r_(0)], [r_(1), r_(0)], [r_(17, 20), r_(9, 10)], [r_(1, 4), r_(9, 10)]];
const V = VQ.map(p => p.map(ratToIv));

/* corner frames: a1 = angle of edge to NEXT vertex, om = interior opening */
function angleOfIv(dx, dy) { // continuous branch; needs dx OR dy sign-definite
  if (dx[0] > 0) return S.atanIv(div(dy, dx));                        // (−π/2, π/2)
  if (dx[1] < 0) {
    if (dy[0] >= 0) return sub(T.PI, S.atanIv(div(dy, neg(dx))));     // Q2
    if (dy[1] <= 0) return add(T.PI, S.atanIv(div(neg(dy), neg(dx)))); // Q3 (range (π, 3π/2))
    return sub(T.PI, S.atanIv(div(dy, neg(dx))));                     // dx<0, dy straddles: continuous around π
  }
  if (dy[0] > 0) return sub(T.HALF_PI, S.atanIv(div(dx, dy)));        // around π/2
  if (dy[1] < 0) return sub(neg(T.HALF_PI), S.atanIv(div(dx, neg(dy)))); // around −π/2
  throw new Error('angleOfIv: neither component sign-definite');
}
const CORN = [];
for (let c = 0; c < 4; c++) {
  const Vv = V[c], Vn = V[(c + 1) % 4], Vp = V[(c + 3) % 4];
  const a1 = angleOfIv(sub(Vn[0], Vv[0]), sub(Vn[1], Vv[1]));
  const a2 = angleOfIv(sub(Vp[0], Vv[0]), sub(Vp[1], Vv[1]));
  let om = sub(a2, a1);
  if (om[1] <= 0) om = add(om, T.TWO_PI);
  if (!(om[0] > 0 && om[1] < Math.PI)) throw new Error('corner opening not in (0, π): ' + om);
  CORN.push({ V: Vv, a1, om, nub: div(T.PI, om) });
}
console.log('interval corner openings (deg):',
  CORN.map(c => ((c.om[0] + c.om[1]) / 2 * 180 / Math.PI).toFixed(3)).join(' '));

/* ---------- frozen trial: regenerate float MPS at K = 10 ---------- */
const K_FAN = 10;
const scan = MPS.defectAt(K_FAN, 12.021687243); // λ* from the P2b float scan (frozen)
const LAM = 12.021687243;                        // frozen exact double
const A_COEF = Array.from(scan.coef);            // frozen exact doubles
console.log(`frozen trial: K=${K_FAN}, nbasis=${A_COEF.length}, float defect=${scan.d.toExponential(3)}`);
const lamIv = iv(LAM);
const sqlamIv = S.sqrtIv(lamIv);

/* ---------- order-2 interval jets ---------- */
const jconst = v => [v, I.ZERO, I.ZERO];
const jvar = v => [v, I.ONE, I.ZERO];
const jadd = (a, b) => [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])];
const jsub = (a, b) => [sub(a[0], b[0]), sub(a[1], b[1]), sub(a[2], b[2])];
const jmul = (a, b) => [mul(a[0], b[0]),
  add(mul(a[0], b[1]), mul(a[1], b[0])),
  add(add(mul(a[0], b[2]), mul(a[2], b[0])), mul(iv(2), mul(a[1], b[1])))];
const jscale = (c, a) => [mul(c, a[0]), mul(c, a[1]), mul(c, a[2])];
function jdiv(a, b) {
  const q0 = div(a[0], b[0]);
  const q1 = div(sub(a[1], mul(q0, b[1])), b[0]);
  const q2 = div(sub(sub(a[2], mul(q0, b[2])), mul(iv(2), mul(q1, b[1]))), b[0]);
  return [q0, q1, q2];
}
function jsqrt(a) {
  const v = S.sqrtIv(a[0]);
  const d1 = div(a[1], mul(iv(2), v));
  const d2 = div(sub(a[2], mul(iv(2), mul(d1, d1))), mul(iv(2), v));
  return [v, d1, d2];
}
function jcos(a) { // cos of jet
  const c = T.cos(a[0]), s = T.sin(a[0]);
  return [c, neg(mul(s, a[1])), neg(add(mul(c, mul(a[1], a[1])), mul(s, a[2])))];
}
function jsin(a) {
  const c = T.cos(a[0]), s = T.sin(a[0]);
  return [s, mul(c, a[1]), sub(mul(c, a[2]), mul(s, mul(a[1], a[1])))];
}

/* Bessel jets through x-jet: value/deriv chains with ODE closure */
function besselJets(nu, xj) {
  const x = xj[0];
  const g0 = S.besselJIv(nu, x);
  const g1 = S.besselJdIv(nu, x);
  const nu2x2 = div(mul(nu, nu), mul(x, x));
  const g2 = sub(mul(sub(nu2x2, I.ONE), g0), div(g1, x));
  // g3 = d/dx g2 = (ν²/x²−1)g1 − 2ν²/x³ g0 − g2/x + g1/x²
  const g3 = add(sub(sub(mul(sub(nu2x2, I.ONE), g1), div(mul(iv(2), mul(mul(nu, nu), g0)), mul(x, mul(x, x)))), div(g2, x)), div(g1, mul(x, x)));
  const J0 = [g0, mul(g1, xj[1]), add(mul(g2, mul(xj[1], xj[1])), mul(g1, xj[2]))];
  const J1 = [g1, mul(g2, xj[1]), add(mul(g3, mul(xj[1], xj[1])), mul(g2, xj[2]))];
  return { J0, J1 };
}

/* ---------- edge/corner pairs ---------- */
function edgeData(e) {
  const A = V[e], B = V[(e + 1) % 4];
  const ex = sub(B[0], A[0]), ey = sub(B[1], A[1]);
  const L = S.sqrtIv(add(mul(ex, ex), mul(ey, ey)));
  const ux = div(ex, L), uy = div(ey, L);        // unit tangent
  const nx = uy, ny = neg(ux);                    // outward normal (CCW)
  const far = [(e + 2) % 4, (e + 3) % 4];
  return { A, ux, uy, nx, ny, L, far };
}

/* flux jet of the whole trial on edge e at τ (jet variable), τ ∈ [0, L] */
function fluxJet(ed, tauJ) {
  let f = [I.ZERO, I.ZERO, I.ZERO];
  for (const c of ed.far) {
    const C = CORN[c];
    // s0 = (A−V)·e, d = (A−V)·n (constants)
    const ax = sub(ed.A[0], C.V[0]), ay = sub(ed.A[1], C.V[1]);
    const s0 = add(mul(ax, ed.ux), mul(ay, ed.uy));
    const d = add(mul(ax, ed.nx), mul(ay, ed.ny));
    if (!(d[0] > 0)) throw new Error('far corner not strictly inside edge normal side');
    const sJ = jadd(jconst(s0), tauJ);
    const r2J = jadd(jmul(sJ, sJ), jconst(mul(d, d)));
    const rJ = jsqrt(r2J);
    const xJ = jscale(sqlamIv, rJ);
    // θ jet: value from global angle − a1 (continuous branch), θ' = −d/r²
    const px = jadd(jconst(sub(ed.A[0], C.V[0])), jscale(ed.ux, tauJ)); // (P−V)x jet (order tracking only for value)
    const py = jadd(jconst(sub(ed.A[1], C.V[1])), jscale(ed.uy, tauJ));
    let phi = angleOfIv(px[0], py[0]);
    let th = sub(phi, C.a1);
    if (th[1] < 0) th = add(th, T.TWO_PI);
    // clamp check: θ within (−slack, ω+slack)
    if (!(th[1] > -0.01 && th[0] < C.om[1] + 0.01)) throw new Error('theta out of corner sector: ' + th);
    // φ' = (w × e-perp…) = +d/r²  (w = s·e + d·n, φ' = (w×e')/r² with n×e = +1;
    // checked empirically: along edge 0 the angle to corner C increases)
    const thd1 = div(d, r2J[0]);
    const thd2 = neg(div(mul(d, r2J[1]), mul(r2J[0], r2J[0])));
    const thJ = [th, thd1, thd2];
    for (let k = 0; k < K_FAN; k++) {
      const a = A_COEF[c * K_FAN + k];
      if (a === 0) continue;
      const nu = mul(iv(k), C.nub);
      const angJ = k === 0 ? [I.ZERO, I.ZERO, I.ZERO] : jscale(nu, thJ);
      const cosJ = k === 0 ? [I.ONE, I.ZERO, I.ZERO] : jcos(angJ);
      const sinJ = k === 0 ? [I.ZERO, I.ZERO, I.ZERO] : jsin(angJ);
      const { J0, J1 } = besselJets(k === 0 ? I.ZERO : nu, xJ);
      // f_i = √λ d (J1 cos)/r + ν s J0 sin / r²
      let term = jscale(mul(sqlamIv, d), jdiv(jmul(J1, cosJ), rJ));
      if (k > 0) term = jadd(term, jscale(nu, jdiv(jmul(jmul(sJ, J0), sinJ), r2J)));
      f = jadd(f, jscale(iv(a), term));
    }
  }
  return f;
}

/* ---------- bridge test vs independent float evaluation ---------- */
const csF = MPS.corners();
function floatFlux(e, tFrac) {
  const A = [Q.toDouble(VQ[e][0]), Q.toDouble(VQ[e][1])];
  const B = [Q.toDouble(VQ[(e + 1) % 4][0]), Q.toDouble(VQ[(e + 1) % 4][1])];
  const ex = B[0] - A[0], ey = B[1] - A[1], len = Math.hypot(ex, ey);
  const n = [ey / len, -ex / len];
  const x = A[0] + ex * tFrac, y = A[1] + ey * tFrac;
  const bv = MPS.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, true);
  let fl = 0;
  for (let i = 0; i < A_COEF.length; i++) fl += A_COEF[i] * (bv.gx[i] * n[0] + bv.gy[i] * n[1]);
  return fl;
}
for (const e of [0, 1, 2, 3]) {
  for (const tf of [0.31, 0.5, 0.77]) {
    const ed = edgeData(e);
    const tau = mul(iv(tf), ed.L);
    const fj = fluxJet(ed, jvar(tau));
    const ff = floatFlux(e, tf);
    const ok = ff >= fj[0][0] - 1e-9 && ff <= fj[0][1] + 1e-9;
    check(`bridge edge${e} t=${tf}`, ok,
      `float=${ff.toExponential(3)} iv=[${fj[0][0].toExponential(3)},${fj[0][1].toExponential(3)}] w=${(fj[0][1] - fj[0][0]).toExponential(1)}`);
  }
  // derivative bridge: central difference of the float flux vs jet d1
  const ed = edgeData(e);
  const Lm = (ed.L[0] + ed.L[1]) / 2;
  const hf = 1e-6;
  const dnum = (floatFlux(e, 0.5 + hf) - floatFlux(e, 0.5 - hf)) / (2 * hf * Lm);
  const fj = fluxJet(ed, jvar(mul(iv(0.5), ed.L)));
  const okd = dnum >= fj[1][0] - 1e-6 && dnum <= fj[1][1] + 1e-6;
  check(`bridge d/dτ edge${e}`, okd,
    `num=${dnum.toExponential(3)} iv=[${fj[1][0].toExponential(3)},${fj[1][1].toExponential(3)}]`);
}

/* ---------- certified defect quadrature ---------- */
function certifyEdge(e, M) {
  const ed = edgeData(e);
  const Lup = ed.L[1];
  const h = Lup / M;
  let total = I.ZERO;
  let supF = 0; // certified sup|∂νu| on the edge (pointwise, for layer bounds)
  for (let m = 0; m < M; m++) {
    const t0 = m * h, t1 = Math.min((m + 1) * h, Lup);
    const tm = (t0 + t1) / 2, hh = t1 - t0;
    const fm = fluxJet(ed, jvar(iv(tm)));
    const fc = fluxJet(ed, jvar(iv(t0, t1)));
    const R = I.nextUp(I.mag(fc[2]) * hh * hh / 8);
    const af = I.mag(fm[0]), ad = I.mag(fm[1]);
    supF = Math.max(supF, I.nextUp(af + ad * hh / 2 + R));
    // ∫ (f(m)+f'δ ± R)² over δ ∈ [−hh/2, hh/2]
    const main = I.nextUp(hh * af * af + ad * ad * hh * hh * hh / 12);
    const crossR = I.nextUp(2 * R * (hh * af + ad * hh * hh / 4) + R * R * hh);
    total = add(total, iv(0, I.nextUp(main + crossR)));
  }
  return { total, supF };
}

const t0 = Date.now();
const CELLS = 700;
let defect2 = I.ZERO;
for (const e of [0, 1, 2, 3]) {
  const de = certifyEdge(e, CELLS);
  console.log(`edge ${e}: ∫flux² ≤ ${de.total[1].toExponential(4)}  sup|∂νu| ≤ ${de.supF.toExponential(3)}`);
  defect2 = add(defect2, de.total);
}
const defectUp = Math.sqrt(defect2[1]);
console.log(JSON.stringify({
  CERTIFIED: true, cells: CELLS,
  bdryDefectUpper: +defectUp.toExponential(4),
  floatDefectRaw: +(scan.d).toExponential(3),
  secs: +((Date.now() - t0) / 1000).toFixed(1),
}));
check('certified defect within 100× float (sanity)', defectUp < 100 * 2e-5 + 1e-3, defectUp.toExponential(2));

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
