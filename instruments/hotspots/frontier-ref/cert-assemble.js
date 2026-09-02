/* EMBER P2b-rigor 3 — the assembled eigenpair certificate.

   Chain (each input certified earlier this phase):
   - D  = 1.2369e-5 ≥ ‖∂νu‖_{L²(∂Ω)}          [cert-defect.js, this session]
   - C_tr: star-shaped trace constant, rational: ‖v‖²_∂ ≤ ((R+2)/c0)‖v‖²_B,
     ‖v‖²_B = |v|²_{H¹} + ‖v‖²_{L²}  (divergence identity, x0 = (21/40, 9/20))
   - Nu_lo ≤ ‖u‖_{L²(Ω)}: interior-box mean-value quadrature (this file)
   - spectrum localization [run-p2a2.js certified]:
       μ0 = 0 (exact), exactly one nonzero eigenvalue below 13.955936,
       and it lies in [11.892663, 12.04181916]; μ2 ≥ 13.955936.

   For the exact-Helmholtz trial u (−Δu = λ̃u, λ̃ = 12.021687243):
     r(v) = a(u,v) − λ̃ m(u,v) = ∫_∂Ω (∂νu) v ds   ∀v ∈ H¹(Ω),
     |r(v)| ≤ D·C_tr·‖v‖_B ⇒ Σ_k c_k²(μ_k−λ̃)²/(1+μ_k) ≤ ε² := (D·C_tr)²,
   where u = Σ c_k φ_k in the Neumann eigenbasis. With
     F := max_{μ ∈ {0} ∪ [μ2lo, ∞)} (1+μ)/(μ−λ̃)²
        = max( 1/λ̃², (1+μ2lo)/(μ2lo−λ̃)² )   [decreasing on [μ2lo,∞)]:
     Σ_{k≠1} c_k² ≤ ε²F,     c_1² ≥ Nu_lo² − ε²F,
     |μ1 − λ̃| ≤ ε·√(1+μ1up)/c_1,
     ‖u − c_1φ_1‖_{L²} ≤ ε√F   (⇒ the L² eigenfunction enclosure). */
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

/* ---------- specimen + frozen trial (deterministic regeneration) ------- */
const VQ = [[r_(0), r_(0)], [r_(1), r_(0)], [r_(17, 20), r_(9, 10)], [r_(1, 4), r_(9, 10)]];
const V = VQ.map(p => p.map(ratToIv));
function angleOfIv(dx, dy) {
  if (dx[0] > 0) return S.atanIv(div(dy, dx));
  if (dx[1] < 0) {
    if (dy[0] >= 0) return sub(T.PI, S.atanIv(div(dy, neg(dx))));
    if (dy[1] <= 0) return add(T.PI, S.atanIv(div(neg(dy), neg(dx))));
    return sub(T.PI, S.atanIv(div(dy, neg(dx))));
  }
  if (dy[0] > 0) return sub(T.HALF_PI, S.atanIv(div(dx, dy)));
  if (dy[1] < 0) return sub(neg(T.HALF_PI), S.atanIv(div(dx, neg(dy))));
  throw new Error('angleOfIv: neither component sign-definite');
}
const CORN = [];
for (let c = 0; c < 4; c++) {
  const Vv = V[c], Vn = V[(c + 1) % 4], Vp = V[(c + 3) % 4];
  const a1 = angleOfIv(sub(Vn[0], Vv[0]), sub(Vn[1], Vv[1]));
  const a2 = angleOfIv(sub(Vp[0], Vv[0]), sub(Vp[1], Vv[1]));
  let om = sub(a2, a1);
  if (om[1] <= 0) om = add(om, T.TWO_PI);
  CORN.push({ V: Vv, a1, om, nub: div(T.PI, om) });
}
const K_FAN = 10;
const LAM = 12.021687243;
const scan = MPS.defectAt(K_FAN, LAM);
const A_COEF = Array.from(scan.coef);
const lamIv = iv(LAM), sqlamIv = S.sqrtIv(lamIv);

/* certified inputs with provenance */
const D_DEFECT = 1.2369e-5;        // cert-defect.js output (this session), rounded UP
const MU1_CR = [11.892663, 12.04181916]; // run-p2a2.js certified enclosure
const MU2_LO = 13.955936;          // run-p2a2.js certified lower bound

/* ---------- u value and gradient (interval) ---------- */
function uEval(x, y, needGrad) {
  let val = I.ZERO, gx = I.ZERO, gy = I.ZERO;
  for (let c = 0; c < 4; c++) {
    const C = CORN[c];
    const dx = sub(x, C.V[0]), dy = sub(y, C.V[1]);
    const r2 = add(mul(dx, dx), mul(dy, dy));
    const r = S.sqrtIv(r2);
    const phi = angleOfIv(dx, dy);
    let th = sub(phi, C.a1);
    if (th[1] < 0) th = add(th, T.TWO_PI);
    if (th[0] > CORN[c].om[1] + 0.02) th = sub(th, T.TWO_PI); // branch normalize both ways
    const xB = mul(sqlamIv, r);
    for (let k = 0; k < K_FAN; k++) {
      const a = A_COEF[c * K_FAN + k];
      if (a === 0) continue;
      const nu = k === 0 ? I.ZERO : mul(iv(k), C.nub);
      const J = S.besselJIv(nu, xB);
      const ang = mul(nu, th);
      const ct = T.cos(ang);
      val = add(val, mul(iv(a), mul(J, ct)));
      if (needGrad) {
        const Jd = S.besselJdIv(nu, xB);
        const st = T.sin(ang);
        const dr = mul(sqlamIv, mul(Jd, ct));
        const dth = k === 0 ? I.ZERO : neg(div(mul(nu, mul(J, st)), r));
        const cp = T.cos(phi), sp = T.sin(phi);
        gx = add(gx, mul(iv(a), sub(mul(dr, cp), mul(dth, sp))));
        gy = add(gy, mul(iv(a), add(mul(dr, sp), mul(dth, cp))));
      }
    }
  }
  return { val, gx, gy };
}

/* bridge: interval u vs float basisEval at a few interior points */
const csF = MPS.corners();
for (const [x, y] of [[0.4, 0.3], [0.55, 0.5], [0.62, 0.42]]) {
  const bv = MPS.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, true);
  let fv = 0, fgx = 0, fgy = 0;
  for (let i = 0; i < A_COEF.length; i++) { fv += A_COEF[i] * bv.vals[i]; fgx += A_COEF[i] * bv.gx[i]; fgy += A_COEF[i] * bv.gy[i]; }
  const e = uEval(iv(x), iv(y), true);
  check(`bridge u(${x},${y})`, I.contains(e.val, fv) || Math.abs(fv - (e.val[0] + e.val[1]) / 2) < 1e-7,
    `float=${fv.toFixed(8)} iv=[${e.val[0].toFixed(8)},${e.val[1].toFixed(8)}]`);
  check(`bridge ∇u(${x},${y})`, Math.abs(fgx - (e.gx[0] + e.gx[1]) / 2) < 1e-6 && Math.abs(fgy - (e.gy[0] + e.gy[1]) / 2) < 1e-6);
}

/* ---------- interior-box certified ‖u‖ lower bound ---------- */
const BOX = [0.35, 0.65, 0.25, 0.6]; // [x0,x1,y0,y1] — sign-definite vs all corners
const NX = 44, NY = 44;
const t0 = Date.now();
let norm2lo = 0;
let minVal = Infinity, maxDev = 0;
for (let a = 0; a < NX; a++) {
  for (let b = 0; b < NY; b++) {
    const hx = (BOX[1] - BOX[0]) / NX, hy = (BOX[3] - BOX[2]) / NY;
    const cx = BOX[0] + (a + 0.5) * hx, cy = BOX[2] + (b + 0.5) * hy;
    const ctr = uEval(iv(cx), iv(cy), false);
    const cell = uEval(iv(BOX[0] + a * hx, BOX[0] + (a + 1) * hx), iv(BOX[2] + b * hy, BOX[2] + (b + 1) * hy), true);
    const gmag = Math.sqrt(I.mag(cell.gx) ** 2 + I.mag(cell.gy) ** 2);
    const dev = I.nextUp(gmag * Math.hypot(hx, hy) / 2 + Math.max(ctr.val[1] - ctr.val[0], 0) / 2);
    const lo = Math.max(0, Math.min(Math.abs(ctr.val[0]), Math.abs(ctr.val[1])) - dev);
    // if the value interval straddles 0, lower bound is 0 for this cell
    const cellLo = (ctr.val[0] <= 0 && ctr.val[1] >= 0) ? 0 : lo;
    norm2lo = I.nextDown(norm2lo + I.nextDown(cellLo * cellLo * I.nextDown(hx * hy)));
    minVal = Math.min(minVal, Math.abs((ctr.val[0] + ctr.val[1]) / 2));
    maxDev = Math.max(maxDev, dev);
  }
}
const NU_LO = Math.sqrt(norm2lo);
console.log(JSON.stringify({ boxNormLower: +NU_LO.toFixed(5), maxCellDev: +maxDev.toFixed(4), secs: +((Date.now() - t0) / 1000).toFixed(1) }));
check('‖u‖ lower bound positive and sane', NU_LO > 0.1 && NU_LO < 1.5, NU_LO.toFixed(4));

/* ---------- rational star-shaped trace constant ---------- */
const X0 = [r_(21, 40), r_(9, 20)];
let c0Iv = null, R2max = Q.ZERO;
for (let e = 0; e < 4; e++) {
  const A = VQ[e], B = VQ[(e + 1) % 4];
  const ex = Q.sub(B[0], A[0]), ey = Q.sub(B[1], A[1]);
  const L2 = Q.add(Q.mul(ex, ex), Q.mul(ey, ey));
  // (A−x0)·(e_y, −e_x) — constant along the edge; unit-normal value = this / |e|
  const dot = Q.sub(Q.mul(Q.sub(A[0], X0[0]), ey), Q.mul(Q.sub(A[1], X0[1]), ex));
  const val = div(ratToIv(dot), S.sqrtIv(ratToIv(L2)));
  if (!(val[0] > 0)) throw new Error('x0 not star center');
  c0Iv = c0Iv === null ? val : [Math.min(c0Iv[0], val[0]), Math.min(c0Iv[1], val[1])];
  const dR = Q.add(Q.mul(Q.sub(A[0], X0[0]), Q.sub(A[0], X0[0])), Q.mul(Q.sub(A[1], X0[1]), Q.sub(A[1], X0[1])));
  if (Q.cmp(dR, R2max) > 0) R2max = dR;
}
const Rv = S.sqrtIv(ratToIv(R2max));
const Ctr = S.sqrtIv(div(add(Rv, iv(2)), c0Iv));
console.log(JSON.stringify({ c0: +c0Iv[0].toFixed(5), R: +Rv[1].toFixed(5), Ctr: +Ctr[1].toFixed(5) }));

/* ---------- assembly ---------- */
const eps = I.nextUp(D_DEFECT * Ctr[1]);
const lamI = iv(LAM);
// F = max( 1/λ̃², (1+μ2lo)/(μ2lo−λ̃)² )
const F1 = div(I.ONE, mul(lamI, lamI));
const gap2 = sub(iv(MU2_LO), lamI);
if (!(gap2[0] > 0)) throw new Error('λ̃ not below μ2 lower bound');
const F2 = div(add(I.ONE, iv(MU2_LO)), mul(gap2, gap2));
const F = Math.max(F1[1], F2[1]);
const eps2F = I.nextUp(eps * eps * F);
const c1sq = I.nextDown(NU_LO * NU_LO - eps2F);
check('c1² > 0', c1sq > 0, c1sq.toFixed(4));
const c1lo = Math.sqrt(c1sq);
const muBound = I.nextUp(eps * Math.sqrt(1 + MU1_CR[1]) / c1lo);
const mu1new = [Math.max(MU1_CR[0], LAM - muBound), Math.min(MU1_CR[1], LAM + muBound)];
const efun = I.nextUp(eps * Math.sqrt(F));
console.log('\n===== CERTIFIED EIGENPAIR (steep non-isosceles trapezoid) =====');
console.log(JSON.stringify({
  epsilon: +eps.toExponential(4),
  F: +F.toFixed(4),
  c1_lower: +c1lo.toFixed(5),
  mu1_enclosure: [+mu1new[0].toFixed(9), +mu1new[1].toFixed(9)],
  mu1_width: +(mu1new[1] - mu1new[0]).toExponential(3),
  eigenfunction_L2_error: +efun.toExponential(4),
  relative_L2_error: +(efun / c1lo).toExponential(4),
}));
check('μ1 enclosure tightened vs CR', (mu1new[1] - mu1new[0]) < (MU1_CR[1] - MU1_CR[0]) / 50,
  `width ${(mu1new[1] - mu1new[0]).toExponential(2)} vs CR ${(MU1_CR[1] - MU1_CR[0]).toExponential(2)}`);
check('eigenfunction error below core budget', efun / c1lo < 1.9e-3 / 2,
  (efun / c1lo).toExponential(2) + ' vs budget 1.9e-3');

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
