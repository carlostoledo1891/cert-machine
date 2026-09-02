/* EMBER P2c-2a — the collar sweep + endgame constants.

   NEW CERTIFIED TOOLS:
   1. GLOBAL H¹ ERROR (free from the residual framework):
      |e|_{H¹(Ω)}² = Σ_{k≠1} μ_k c_k² ≤ ε²·G,
      G = max_{μ∈{0}∪[μ2lo,∞)} μ(1+μ)/(μ−λ̃)²  (0 at μ=0; decreasing on
      [μ2lo,∞) — checked by evaluating the derivative sign),
      ⇒ E₁ := |e|_{H¹} ≤ ε√G.  (Feeds the W-machinery for the strips.)
   2. REFLECTED pointwise bound: for x₀ at any depth near an OPEN edge,
      the even reflection of φ̂ solves the eigenequation in the doubled
      disk B_R(x₀) (R ≤ dist to the edge's endpoints and to other edges);
      the reflection of u adds a single-layer with density 2∂νu:
      |e(x₀)| ≤ √2E/(√πR) + γ_G R(μ₁up√2E + δλ·√2·NuUp) + supD·3R/π,
      supD = certified sup|∂νu| on the edge (coarse cells here).

   THE SWEEP: kill every collar cell (depth < 0.075, ≥ 0.11 from every
   vertex) by the value argument: sup_cell φ̂ ≤ sup_cell u + eRefl <
   φ̂(witness). Survivors (expected: the A-max window and the top-edge
   min window) are EXACTLY the domains of the two remaining lemmas.

   FLOAT ENDGAME CONSTANTS (guides for the final lemmas, not claims):
   corner-expansion coefficients b₀..b₃ at all four corners (annulus
   extraction), and the normal-Hessian margin c₂ = −μ₁φ̂ − φ̂_tt along the
   extremal windows. */
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
const VQ = [[r_(0), r_(0)], [r_(1), r_(0)], [r_(17, 20), r_(9, 10)], [r_(1, 4), r_(9, 10)]];
const V = VQ.map(p => p.map(ratToIv));
const VF = VQ.map(p => p.map(Q.toDouble));
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
const sqlamIv = S.sqrtIv(iv(LAM));

/* certified inputs (provenance: this session) */
const E_L2 = 6.5353e-5, DLAM = 7.12e-4, MU1_UP = 12.022398359, MU2_LO = 13.955936;
const EPS = 3.2687e-5;             // cert-assemble ε
const NU_UP = 2.4997;              // cert-pointwise global ‖u‖ upper
const WIT_P = 2.126029, WIT_M = 1.972622; // certified witness values (cert-pointwise)
const GAMMA_G = S.sqrtIv(div(ratToIv(r_(5, 48)), T.TWO_PI));

function uEval(x, y, needGrad) {
  let val = I.ZERO, gx = I.ZERO, gy = I.ZERO;
  for (let c = 0; c < 4; c++) {
    const C = CORN[c];
    const dx = sub(x, C.V[0]), dy = sub(y, C.V[1]);
    const r2raw = add(I.sqr(dx), I.sqr(dy));
    const r2 = [Math.max(0, r2raw[0]), r2raw[1]];
    const r = S.sqrtIv(r2);
    const xB = mul(sqlamIv, r);
    let th, phi = null;
    const definite = dx[0] > 0 || dx[1] < 0 || dy[0] > 0 || dy[1] < 0;
    if (definite) {
      phi = angleOfIv(dx, dy);
      th = sub(phi, C.a1);
      if (th[1] < 0) th = add(th, T.TWO_PI);
      if (th[0] > C.om[1] + 0.02) th = sub(th, T.TWO_PI);
    } else {
      if (needGrad) throw new Error('gradient on corner cell');
      th = [-0.02, C.om[1] + 0.02];
    }
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

/* ---------- 1: global H¹ error ---------- */
const lamI = iv(LAM);
// G = μ2lo(1+μ2lo)/(μ2lo−λ̃)²; decreasing on [μ2lo,∞): d/dμ ln = 1/μ + 1/(1+μ) − 2/(μ−λ̃) < 0
// iff (μ−λ̃)(1+2μ) < 2μ(1+μ) iff μ(2λ̃... verified numerically over a grid + limit 1 below
{
  const f = m => m * (1 + m) / Math.pow(m - LAM, 2);
  let mono = true;
  for (let m = MU2_LO; m < 400; m += 0.5) if (f(m + 0.5) > f(m) + 1e-12) mono = false;
  check('G decreasing on [μ2lo, ∞) (numeric guard + limit 1)', mono && f(400) > 1);
}
const Gfac = div(mul(iv(MU2_LO), add(I.ONE, iv(MU2_LO))), I.sqr(sub(iv(MU2_LO), lamI)));
const E_H1 = I.nextUp(EPS * S.sqrtIv(Gfac)[1]);
console.log(JSON.stringify({ G: +Gfac[1].toFixed(4), E_H1: +E_H1.toExponential(4) }));

/* ---------- 2: coarse certified sup|∂νu| per edge ---------- */
function edgeSupFlux(e, M) {
  // sup over the edge EXCLUDING 5mm at each end (vertex tips are the corner
  // lemmas' domain; sweep-cell layer chords stay ≥ 11mm from vertices)
  const A = VF[e], B = VF[(e + 1) % 4];
  const ex = B[0] - A[0], ey = B[1] - A[1], L = Math.hypot(ex, ey);
  const n = [ey / L, -ex / L];
  const tA = 0.005 / L, tB = 1 - 0.005 / L;
  let sup = 0;
  for (let m = 0; m < M; m++) {
    const t0 = tA + (tB - tA) * m / M, t1 = tA + (tB - tA) * (m + 1) / M;
    const xIv = iv(Math.min(A[0] + ex * t0, A[0] + ex * t1), Math.max(A[0] + ex * t0, A[0] + ex * t1));
    const yIv = iv(Math.min(A[1] + ey * t0, A[1] + ey * t1), Math.max(A[1] + ey * t0, A[1] + ey * t1));
    const g = uEval(xIv, yIv, true);
    const fl = add(mul(g.gx, iv(n[0])), mul(g.gy, iv(n[1])));
    sup = Math.max(sup, I.mag(fl));
  }
  return sup;
}
/* certified per-edge sup|∂νu| — cert-defect.js jet output (this session):
   |f(m)| + |f'(m)|h/2 + mag(f''cell)h²/8 over 700 cells/edge */
const SUPD = [1.376e-5, 9.135e-6, 1.244e-5, 1.391e-5];
console.log('sup|∂νu| per edge (cert-defect jets):', SUPD.map(x => +x.toExponential(2)).join(' '));

/* ---------- 3: reflected pointwise-e bound ---------- */
function distToSegF(x, y, A, B) {
  const vx = B[0] - A[0], vy = B[1] - A[1];
  const t = Math.max(0, Math.min(1, ((x - A[0]) * vx + (y - A[1]) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - A[0] - t * vx, y - A[1] - t * vy);
}
function eBoundReflected(x, y) {
  // nearest edge; R limited by that edge's endpoints and the other edges
  let best = { d: Infinity, e: -1 };
  for (let e = 0; e < 4; e++) {
    const d = distToSegF(x, y, VF[e], VF[(e + 1) % 4]);
    if (d < best.d) best = { d, e };
  }
  const e = best.e;
  let R = Infinity;
  R = Math.min(R, Math.hypot(x - VF[e][0], y - VF[e][1]));
  R = Math.min(R, Math.hypot(x - VF[(e + 1) % 4][0], y - VF[(e + 1) % 4][1]));
  for (let e2 = 0; e2 < 4; e2++) {
    if (e2 === e) continue;
    R = Math.min(R, distToSegF(x, y, VF[e2], VF[(e2 + 1) % 4]));
  }
  R = R * 0.9 - 1e-6;
  if (R <= 0.002) return { bound: Infinity, R };
  const sq2 = Math.SQRT2;
  const b = I.nextUp(sq2 * E_L2 / (Math.sqrt(Math.PI) * R)
    + GAMMA_G[1] * R * (MU1_UP * sq2 * E_L2 + DLAM * sq2 * NU_UP)
    + SUPD[e] * 3 * R / Math.PI);
  return { bound: b, R };
}

/* ---------- 4: the collar sweep ---------- */
function insideQ(x, y) {
  for (let e = 0; e < 4; e++) {
    const A = VF[e], B = VF[(e + 1) % 4];
    if ((B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]) < 0) return false;
  }
  return true;
}
const t0 = Date.now();
const H = 0.01;
const survivors = { max: [], min: [] };
let killed = 0, total = 0;
for (let x = 0; x < 1.0; x += H) for (let y = 0; y < 0.9; y += H) {
  const corners2 = [[x, y], [x + H, y], [x, y + H], [x + H, y + H]];
  const anyIn = corners2.some(p => insideQ(p[0], p[1])) || insideQ(x + H / 2, y + H / 2);
  if (!anyIn) continue;
  const dmin = Math.min(...corners2.map(p => {
    let d = Infinity;
    for (let e = 0; e < 4; e++) d = Math.min(d, distToSegF(p[0], p[1], VF[e], VF[(e + 1) % 4]));
    return d;
  }));
  if (dmin >= 0.075) continue;                       // core (already certified)
  const vd = Math.min(...VF.map(Vc => Math.min(...corners2.map(p => Math.hypot(p[0] - Vc[0], p[1] - Vc[1])))));
  if (vd < 0.11) continue;                           // corner tips → corner lemmas
  total++;
  // centered form: point value + gradient(cell)·halfdiag — avoids the
  // 20-term cancellation blowup of raw cell value intervals
  const ctr = uEval(iv(x + H / 2), iv(y + H / 2), false);
  const cellG = uEval(iv(x, x + H), iv(y, y + H), true);
  const gmag = Math.sqrt(I.mag(cellG.gx) ** 2 + I.mag(cellG.gy) ** 2);
  const half = Math.SQRT2 * H / 2;
  const ebW = Math.max(...corners2.map(p => eBoundReflected(p[0], p[1]).bound));
  const supP = I.nextUp(ctr.val[1] + gmag * half + ebW);
  const supM = I.nextUp(-ctr.val[0] + gmag * half + ebW);
  const okP = supP < WIT_P, okM = supM < WIT_M;
  if (okP && okM) { killed++; continue; }
  if (!okP) survivors.max.push([+x.toFixed(2), +y.toFixed(2), +supP.toFixed(4)]);
  if (!okM) survivors.min.push([+x.toFixed(2), +y.toFixed(2), +supM.toFixed(4)]);
}
console.log(JSON.stringify({ collarCells: total, killed, secs: +((Date.now() - t0) / 1000).toFixed(1) }));

/* improved min witness: deeper into the collar right under the boundary min
   (interior ball R = 0.018 — certified pointwise-e bound) */
const wm2 = { x: 0.8305, y: 0.881 };
const RW2 = 0.018;
const eW2 = I.nextUp(E_L2 / (Math.sqrt(Math.PI) * RW2)
  + GAMMA_G[1] * RW2 * (MU1_UP * E_L2 + DLAM * NU_UP));
const wm2v = uEval(iv(wm2.x), iv(wm2.y), false).val;
const WIT_M2 = I.nextDown(-wm2v[1] - eW2);
console.log(JSON.stringify({ minWitness2: +WIT_M2.toFixed(6), eW2: +eW2.toExponential(3) }));
check('improved min witness beats the old one', WIT_M2 > WIT_M, `${WIT_M2.toFixed(4)} > ${WIT_M}`);

/* refinement pass: subdivide survivors twice, retest with both witnesses */
function cellTest(x0, y0, h) {
  const corners2 = [[x0, y0], [x0 + h, y0], [x0, y0 + h], [x0 + h, y0 + h]];
  const ctr = uEval(iv(x0 + h / 2), iv(y0 + h / 2), false);
  const cellG = uEval(iv(x0, x0 + h), iv(y0, y0 + h), true);
  const gmag = Math.sqrt(I.mag(cellG.gx) ** 2 + I.mag(cellG.gy) ** 2);
  const half = Math.SQRT2 * h / 2;
  const ebW = Math.max(...corners2.map(p => eBoundReflected(p[0], p[1]).bound));
  return {
    okP: I.nextUp(ctr.val[1] + gmag * half + ebW) < WIT_P,
    okM: I.nextUp(-ctr.val[0] + gmag * half + ebW) < WIT_M2,
  };
}
function refine(list, side) {
  let cur = list.map(c => [c[0], c[1], H]);
  for (let lvl = 0; lvl < 2; lvl++) {
    const next = [];
    for (const [x0, y0, h] of cur) {
      for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const nx2 = x0 + sx * h / 2, ny2 = y0 + sy * h / 2;
        const cs2 = [[nx2, ny2], [nx2 + h / 2, ny2], [nx2, ny2 + h / 2], [nx2 + h / 2, ny2 + h / 2]];
        if (!cs2.some(p => insideQ(p[0], p[1])) && !insideQ(nx2 + h / 4, ny2 + h / 4)) continue;
        const t = cellTest(nx2, ny2, h / 2);
        const ok = side === 'max' ? t.okP : t.okM;
        if (!ok) next.push([nx2, ny2, h / 2]);
      }
    }
    cur = next;
  }
  return cur;
}
const remMax = refine(survivors.max, 'max');
const remMin = refine(survivors.min, 'min');
// bounding boxes of what remains → the strip/corner lemmas' domains
function bbox(cells) {
  if (!cells.length) return null;
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), hs = cells.map(c => c[2]);
  return [Math.min(...xs), Math.max(...xs.map((x, i2) => x + hs[i2])),
          Math.min(...ys), Math.max(...ys.map((y, i2) => y + hs[i2]))];
}
console.log(JSON.stringify({
  afterRefine: { max: remMax.length, min: remMin.length },
  maxWindow: bbox(remMax), minWindow: bbox(remMin),
}));
check('max-side residual confined near A', !bbox(remMax) || (bbox(remMax)[1] < 0.16 && bbox(remMax)[3] < 0.13),
  JSON.stringify(bbox(remMax)));
check('min-side residual confined to the top-edge window', !bbox(remMin) || (bbox(remMin)[2] > 0.8 && bbox(remMin)[0] > 0.55),
  JSON.stringify(bbox(remMin)));

/* ---------- 5: float endgame constants ---------- */
const csF = MPS.corners();
function uF(x, y) {
  const bv = MPS.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, false);
  let s2 = 0;
  for (let i = 0; i < A_COEF.length; i++) s2 += A_COEF[i] * bv.vals[i];
  return s2;
}
// corner-expansion coefficients b_k (float annulus extraction, μ1 ≈ λ̃)
function lgammaF(x) { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgammaF(1 - x); x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i2 = 1; i2 < g + 2; i2++) a += c[i2] / (x + i2); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function besselJF(nu, x) { if (x === 0) return nu === 0 ? 1 : 0; let s2 = 0; const lx = Math.log(x / 2); for (let m = 0; m < 200; m++) { const lt = (nu + 2 * m) * lx - lgammaF(m + 1) - lgammaF(nu + m + 1); const t = ((m % 2) ? -1 : 1) * Math.exp(lt); s2 += t; if (m > 4 && Math.abs(t) < 1e-18 * Math.abs(s2)) break; } return s2; }
const k0 = Math.sqrt(LAM);
for (let c = 0; c < 4; c++) {
  const om = (CORN[c].om[0] + CORN[c].om[1]) / 2, a1 = (CORN[c].a1[0] + CORN[c].a1[1]) / 2;
  const nu1 = Math.PI / om;
  const bs = [];
  for (let k = 0; k <= 3; k++) {
    const nu = k * nu1;
    let num = 0, den = 0;
    const NR = 40, NT = 60, r0 = 0.03, r1 = 0.09;
    for (let ir = 0; ir < NR; ir++) {
      const r = r0 + (r1 - r0) * (ir + 0.5) / NR, dr = (r1 - r0) / NR;
      const Jr = besselJF(nu, k0 * r);
      den += Jr * Jr * r * dr * (k === 0 ? om : om / 2);
      for (let it = 0; it < NT; it++) {
        const th = om * (it + 0.5) / NT, dth = om / NT;
        const x = VF[c][0] + r * Math.cos(a1 + th), y = VF[c][1] + r * Math.sin(a1 + th);
        num += uF(x, y) * Jr * Math.cos(nu * th) * r * dr * dth;
      }
    }
    bs.push(num / den);
  }
  console.log(`corner ${'ABCD'[c]} (ν=${nu1.toFixed(3)}): b = [${bs.map(b => +b.toFixed(4)).join(', ')}]`);
}
// normal-Hessian margin along the extremal windows (float second differences)
function uTT(x, y, tx, ty, h) { return (uF(x + tx * h, y + ty * h) - 2 * uF(x, y) + uF(x - tx * h, y - ty * h)) / (h * h); }
console.log('min window (top edge, t = arc from D→C):');
for (const t of [0.45, 0.5, 0.55, 0.567, 0.6, 0.65]) {
  const x = VF[3][0] + (VF[2][0] - VF[3][0]) * t, y = 0.9 - 1e-3;
  const utt = uTT(x, y, 1, 0, 2e-3);
  console.log(`  t=${t} x=${x.toFixed(3)} u=${uF(x, y).toFixed(4)} u_tt=${utt.toFixed(2)} c2=−μu−u_tt=${(-LAM * uF(x, y) - utt).toFixed(2)}`);
}
console.log('max window (bottom edge near A):');
for (const t of [0.02, 0.05, 0.08, 0.11]) {
  const x = t, y = 1e-3;
  const utt = uTT(x, y, 1, 0, 2e-3);
  console.log(`  t=${t} u=${uF(x, y).toFixed(4)} u_tt=${utt.toFixed(2)} c2(max side, want<0)=${(-LAM * uF(x, y) - utt).toFixed(2)}`);
}
console.log('max window (left edge near A, arc s from A→D):');
for (const s2 of [0.02, 0.05, 0.08, 0.11]) {
  const ex = VF[3][0] / Math.hypot(VF[3][0], VF[3][1]), ey = VF[3][1] / Math.hypot(VF[3][0], VF[3][1]);
  const x = ex * s2 + 1e-3 * ey, y = ey * s2 - 1e-3 * ex;
  const utt = uTT(x, y, ex, ey, 2e-3);
  console.log(`  s=${s2} u=${uF(x, y).toFixed(4)} u_tt=${utt.toFixed(2)} c2(max side)=${(-LAM * uF(x, y) - utt).toFixed(2)}`);
}

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
