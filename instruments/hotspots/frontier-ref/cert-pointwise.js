/* EMBER P2c-1 — pointwise machinery + the CORE-ZONE certificate.

   φ̂ := c₁φ₁ (an eigenfunction; extrema locations are scale-invariant),
   e := u − φ̂,  ‖e‖_{L²(Ω)} ≤ E = 6.5353e-5   [cert-assemble.js]
   −Δe = μ₁e + g,  g = (λ̃−μ₁)u,  |λ̃−μ₁| ≤ 7.12e-4  [ibid.]

   SOLID-MEAN LEMMA (2-D, explicit): for −Δw = f on B_R(x₀) ⊂ Ω:
     w(x₀) = avg_{B_R} w + ∫_{B_R} G_R f,
     G_R(r) = (1/2π)(ln(R/r) − (R²−r²)/(2R²)),
     ‖G_R‖_{L²(B_R)} = R·√(I₀/2π),  I₀ = ∫₀¹(−ln t −(1−t²)/2)² t dt = 5/48
   (exact; verified numerically below). Hence
     |e(x₀)| ≤ E/(√π R) + R√(I₀/2π)·(μ₁up·E + δλ·‖u‖_{L²(B_R)}).

   CORE-ZONE LOGIC (no boundary pointwise values needed): an interior max
   x* of φ̂ lies in the CORE (depth ≥ 0.08) or the COLLAR (depth < 0.08).
   This file kills the CORE: certified sup_{core} φ̂ < φ̂(w) for a WITNESS w
   at depth 0.04 near the boundary max — both interior points, both sides
   (±φ̂). The collar (gradient zone + corner disks) is P2c-2.

   Certified sup over the core: adaptive branch-and-bound cell cover with
   sup_cell u ≤ u(center) + mag(∇u over cell)·halfdiag; cells classified
   by conservative depth (any cell possibly touching depth ≥ 0.075 is
   included — a superset of the core only strengthens the claim). */
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

/* ---------- specimen + frozen trial (as cert-assemble) ---------- */
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

/* certified inputs (provenance: this session's certificates) */
const E_L2 = 6.5353e-5;           // cert-assemble: ‖u − c1φ1‖_L2, rounded up
const DLAM = 7.12e-4;             // cert-assemble: |λ̃ − μ1| upper
const MU1_UP = 12.022398359;      // cert-assemble μ1 enclosure

function uEval(x, y, needGrad) {
  let val = I.ZERO, gx = I.ZERO, gy = I.ZERO;
  for (let c = 0; c < 4; c++) {
    const C = CORN[c];
    const dx = sub(x, C.V[0]), dy = sub(y, C.V[1]);
    const r2raw = add(I.sqr(dx), I.sqr(dy));
    const r2 = [Math.max(0, r2raw[0]), r2raw[1]];    // outward rounding can push a square-sum to −5e-324; clamping only tightens
    const r = S.sqrtIv(r2);
    const xB = mul(sqlamIv, r);
    // angle: if neither component is sign-definite (cell contains this
    // corner), fall back to the full sector — VALUES stay enclosed
    // (cos(νθ) over the sector), gradients are not requested there.
    let th, phi = null;
    const definite = dx[0] > 0 || dx[1] < 0 || dy[0] > 0 || dy[1] < 0;
    if (definite) {
      phi = angleOfIv(dx, dy);
      th = sub(phi, C.a1);
      if (th[1] < 0) th = add(th, T.TWO_PI);
      if (th[0] > C.om[1] + 0.02) th = sub(th, T.TWO_PI);
    } else {
      if (needGrad) throw new Error('gradient requested on a corner-containing cell');
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

/* certified UPPER bound on ‖u‖_{L²(B_R(x0))} via value-only cells over the
   bounding square (u² ≥ 0, square ⊇ ball ⇒ conservative) */
function ballNormUp(x0, y0, R) {
  const k = 10;
  const h = 2 * R / k;
  let s2 = 0;
  for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) {
    const cx0 = x0 - R + a * h, cy0 = y0 - R + b * h;
    const cell = uEval(iv(cx0, cx0 + h), iv(cy0, cy0 + h), false);
    const sup = Math.max(Math.abs(cell.val[0]), Math.abs(cell.val[1]));
    s2 = I.nextUp(s2 + sup * sup * h * h);
  }
  return Math.sqrt(s2);
}

/* ---------- I0 = 5/48 verification + gamma_G ---------- */
{
  let num = 0;
  const n = 20000;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const a = -Math.log(t) - (1 - t * t) / 2;
    num += a * a * t / n;
  }
  check('I0 = 5/48 (numeric vs exact)', Math.abs(num - 5 / 48) < 1e-4, `num=${num.toFixed(6)} exact=${(5 / 48).toFixed(6)}`);
}
const GAMMA_G = S.sqrtIv(div(ratToIv(r_(5, 48)), T.TWO_PI));

/* certified pointwise-e bound on an interior ball B_R(x0) ⊂ Ω */
function eBound(x0, y0, R) {
  const gn = I.nextUp(DLAM * ballNormUp(x0, y0, R));
  const t1 = I.nextUp(E_L2 / (Math.sqrt(Math.PI) * R));
  const t2 = I.nextUp(GAMMA_G[1] * R * (MU1_UP * E_L2 + gn));
  return I.nextUp(t1 + t2);
}

/* ---------- float landscape ---------- */
const csF = MPS.corners();
function uFloat(x, y) {
  const bv = MPS.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, false);
  let s2 = 0;
  for (let i = 0; i < A_COEF.length; i++) s2 += A_COEF[i] * bv.vals[i];
  return s2;
}
function distToBoundary(x, y) {
  let d = Infinity;
  for (let e = 0; e < 4; e++) {
    const A = VF[e], B = VF[(e + 1) % 4];
    const vx = B[0] - A[0], vy = B[1] - A[1];
    const t = Math.max(0, Math.min(1, ((x - A[0]) * vx + (y - A[1]) * vy) / (vx * vx + vy * vy)));
    d = Math.min(d, Math.hypot(x - A[0] - t * vx, y - A[1] - t * vy));
  }
  return d;
}
function insideQ(x, y) {
  for (let e = 0; e < 4; e++) {
    const A = VF[e], B = VF[(e + 1) % 4];
    if ((B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]) < 0) return false;
  }
  return true;
}
// boundary scan
let bMax = { v: -Infinity }, bMin = { v: Infinity };
for (let e = 0; e < 4; e++) {
  const A = VF[e], B = VF[(e + 1) % 4];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t;
    const v = uFloat(x, y);
    if (v > bMax.v) bMax = { v, x, y, e, t };
    if (v < bMin.v) bMin = { v, x, y, e, t };
  }
}
console.log('float boundary max:', JSON.stringify({ v: +bMax.v.toFixed(6), x: +bMax.x.toFixed(4), y: +bMax.y.toFixed(4), edge: bMax.e, t: +bMax.t.toFixed(3) }));
console.log('float boundary min:', JSON.stringify({ v: +bMin.v.toFixed(6), x: +bMin.x.toFixed(4), y: +bMin.y.toFixed(4), edge: bMin.e, t: +bMin.t.toFixed(3) }));

/* witnesses: from the boundary extremum, step inward along the normal (or
   bisector at a vertex) to depth 0.04 */
function inwardPoint(hit, depth) {
  const A = VF[hit.e], B = VF[(hit.e + 1) % 4];
  const ex = B[0] - A[0], ey = B[1] - A[1], L = Math.hypot(ex, ey);
  let nx = -ey / L, ny = ex / L; // inward for CCW
  let x = hit.x + nx * depth, y = hit.y + ny * depth;
  if (!insideQ(x, y) || distToBoundary(x, y) < depth * 0.9) {
    // vertex-adjacent: pull toward centroid instead
    const cx = 0.525, cy = 0.45;
    const dx2 = cx - hit.x, dy2 = cy - hit.y, dd = Math.hypot(dx2, dy2);
    x = hit.x + dx2 / dd * depth * 1.5; y = hit.y + dy2 / dd * depth * 1.5;
  }
  return { x, y, depth: distToBoundary(x, y) };
}
const DEPTH_W = 0.04, DEPTH_CORE = 0.08;
const wMax = inwardPoint(bMax, DEPTH_W), wMin = inwardPoint(bMin, DEPTH_W);
console.log('witness(+):', JSON.stringify({ ...wMax, u: +uFloat(wMax.x, wMax.y).toFixed(6) }));
console.log('witness(−):', JSON.stringify({ ...wMin, u: +uFloat(wMin.x, wMin.y).toFixed(6) }));

/* ---------- certified adaptive sup cover of the core ---------- */
function supCover() {
  const t0 = Date.now();
  // queue of cells [x0,x1,y0,y1]; start with bounding box of the core region
  let queue = [];
  const H0 = 0.04;
  for (let x = 0; x < 1.0; x += H0) for (let y = 0; y < 0.9; y += H0) queue.push([x, x + H0, y, y + H0]);
  let supP = -Infinity, supM = -Infinity;   // certified UPPER bounds for +u, −u over core
  let lowP = -Infinity, lowM = -Infinity;   // certain lower bounds (from centers) to steer refinement
  let evals = 0, kept = 0;
  while (queue.length) {
    const next = [];
    for (const [x0, x1, y0, y1] of queue) {
      // only cells that could contain CORE points (depth ≥ 0.075) matter;
      // these are far from every vertex, so gradient evaluation is safe
      const cs2 = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
      const dmax = Math.max(...cs2.map(p => distToBoundary(p[0], p[1])));
      const anyInside = cs2.some(p => insideQ(p[0], p[1])) || insideQ((x0 + x1) / 2, (y0 + y1) / 2);
      if (!anyInside || dmax < 0.075) continue;
      const cell = uEval(iv(x0, x1), iv(y0, y1), true);
      evals++;
      const gmag = Math.sqrt(I.mag(cell.gx) ** 2 + I.mag(cell.gy) ** 2);
      const half = Math.hypot(x1 - x0, y1 - y0) / 2;
      const ctr = uEval(iv((x0 + x1) / 2), iv((y0 + y1) / 2), false);
      const upP = I.nextUp(ctr.val[1] + gmag * half);
      const upM = I.nextUp(-ctr.val[0] + gmag * half);
      kept++;
      // refinement: if this cell could beat the running certified-lower by
      // more than the target slack, split it (down to h ≈ 0.005)
      const slack = 2.5e-3;
      const needP = upP > lowP + slack && (x1 - x0) > 0.006;
      const needM = upM > lowM + slack && (x1 - x0) > 0.006;
      lowP = Math.max(lowP, ctr.val[0]); lowM = Math.max(lowM, -ctr.val[1]);
      if (needP || needM) {
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        next.push([x0, mx, y0, my], [mx, x1, y0, my], [x0, mx, my, y1], [mx, x1, my, y1]);
      } else {
        supP = Math.max(supP, upP); supM = Math.max(supM, upM);
      }
    }
    queue = next;
  }
  return { supP, supM, lowP, lowM, evals, secs: +((Date.now() - t0) / 1000).toFixed(1) };
}
const cover = supCover();
console.log('core sup cover:', JSON.stringify(cover));

/* ---------- assemble the core-zone verdict ----------
   ball radii: actual float depths padded down 5% + 1e-6 (rational-vs-float
   boundary discrepancy ~1e-17, safety 1e-6); core points depth ≥ 0.075 */
const R_CORE = 0.07;
const RwMax = wMax.depth * 0.95 - 1e-6, RwMin = wMin.depth * 0.95 - 1e-6;
// certified GLOBAL ‖u‖_{L²(Ω)} upper bound: value-only cells over the
// bounding box ⊇ Ω (u² ≥ 0 ⇒ conservative); valid for EVERY ball at once
let nuUp2 = 0;
{
  const H = 0.0125;
  for (let x = 0; x < 1.0; x += H) for (let y = 0; y < 0.9; y += H) {
    const cell = uEval(iv(x, x + H), iv(y, y + H), false);
    const sup = Math.max(Math.abs(cell.val[0]), Math.abs(cell.val[1]));
    nuUp2 = I.nextUp(nuUp2 + sup * sup * H * H);
  }
}
const NU_UP = Math.sqrt(nuUp2);
console.log(JSON.stringify({ NuUpGlobal: +NU_UP.toFixed(4) }));
function eBoundGlobal(R) {
  return I.nextUp(E_L2 / (Math.sqrt(Math.PI) * R)
    + GAMMA_G[1] * R * (MU1_UP * E_L2 + DLAM * NU_UP));
}
const eCoreWorst = eBoundGlobal(R_CORE);
const eWitP = eBoundGlobal(RwMax);
const eWitM = eBoundGlobal(RwMin);
console.log(JSON.stringify({ eBoundCore: +eCoreWorst.toExponential(3), eWitnessMax: +eWitP.toExponential(3), eWitnessMin: +eWitM.toExponential(3), RwMax: +RwMax.toFixed(4), RwMin: +RwMin.toFixed(4) }));

const wMaxIv = uEval(iv(wMax.x), iv(wMax.y), false).val;
const wMinIv = uEval(iv(wMin.x), iv(wMin.y), false).val;
// + side: φ̂(w) ≥ u(w)lo − eWit  must exceed  sup_core φ̂ ≤ supP + eCore
const lhsP = I.nextDown(wMaxIv[0] - eWitP), rhsP = I.nextUp(cover.supP + eCoreWorst);
// − side (for the minimum of φ̂ = max of −φ̂):
const lhsM = I.nextDown(-wMinIv[1] - eWitM), rhsM = I.nextUp(cover.supM + eCoreWorst);
console.log('\n===== CORE-ZONE CERTIFICATE =====');
console.log(JSON.stringify({
  maxSide: { witness: +lhsP.toFixed(6), coreSup: +rhsP.toFixed(6), margin: +(lhsP - rhsP).toExponential(3) },
  minSide: { witness: +lhsM.toFixed(6), coreSup: +rhsM.toFixed(6), margin: +(lhsM - rhsM).toExponential(3) },
}));
check('CORE ZONE (max side): φ̂(witness) > sup_core φ̂', lhsP > rhsP, `margin ${(lhsP - rhsP).toExponential(2)}`);
check('CORE ZONE (min side): −φ̂(witness) > sup_core(−φ̂)', lhsM > rhsM, `margin ${(lhsM - rhsM).toExponential(2)}`);

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
