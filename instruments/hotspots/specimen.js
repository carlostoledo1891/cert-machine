/* specimen.js — THE quadrilateral, once, plus the partition deciders.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   The specimen: the convex trapezoid A=(0,0) B=(1,0) C=(17/20,9/10)
   D=(1/4,9/10) — side slopes 6 and 18/5, no symmetry axis, not a lip
   domain; outside every class where the hot spots conjecture was
   previously proven. Vertices are EXACT RATIONALS everywhere; the floats
   VF are display/steering only.

   PROVENANCE: port of the specimen + corner-frame + partition code that
   the frontier bench duplicated across four cert scripts (pinned in
   frontier-ref/). Here it lives ONCE — a rule defined twice WILL diverge
   (the corpus.js lesson).

   THE PARTITION (the assembly's geometry), decided in EXACT RATIONALS:
     TIP(p):    min_V |p−V| ≤ RTIP (= 11/100)      → the four tip lemmas
                (by convexity p lies in its vertex's sector, r ≤ RTIP)
     CORE:      depth(p) ≥ 3/40 (= 0.075)          → the core sup cover
     COLLAR:    everything else                     → the collar sweep
   Cell rules (each sound against cell quantization, unlike the bench's —
   the port's review found two genuine quantization slivers there):
     R1 (tip skip):    a sweep cell is handed to the tips ONLY if it lies
        ENTIRELY inside one vertex's RTIP-disk: max over its 4 corners of
        |corner − V|² ≤ RTIP² for a single V. (|p−V| is convex ⇒ the max
        over the cell is at a corner.) The bench skipped on min-corner
        distance < RTIP, leaving slivers beyond r = RTIP covered by
        neither sweep nor tip.
     R2 (collar test): a cell not skipped by R1 is collar-tested iff
        min over corners of depth < 3/40. (depth is CONCAVE on a convex
        domain ⇒ its min over the cell is at a corner — exact.) The kill
        covers ALL the cell's points; depth only selects.
     R3 (core cover):  an adaptive cell (halfdiag ≤ h√2/2 ≤ 0.0283 at
        h ≤ 1/25) enters the cover iff not R1-skipped and max over
        corners of depth ≥ 9/200 (= 0.045 < 0.075 − 0.0283). depth is
        1-LIPSCHITZ, so every cell containing a core point has a corner
        of depth ≥ 0.075 − halfdiag > 0.045 ⇒ the cover is a certified
        SUPERSET of the core. The bench's corner-max ≥ 0.075 bar is
        unsound for a concave depth (max lives mid-cell).
   Coverage proof (pointwise): p interior. If min|p−V| ≤ RTIP → TIP. Else
   p's sweep cell is not R1-skipped (it contains p); if some corner has
   depth < 3/40 it is collar-tested and the value kill covers p; else all
   corners ≥ 3/40 ⇒ (concavity) depth(p) ≥ 3/40 ⇒ p is core, and p's
   adaptive cell passes R3. ∎  (The battery re-decides R1–R3 in rationals
   and fires a red on the bench's original skip rule.)

   depth(p) for p ∈ Ω (convex) = min over edges of cross_e(p)/L_e with
   cross_e = (B−A)×(p−A) ≥ 0 inside — so "depth ≥ t" is the exact rational
   statement cross_e² ≥ t²·L_e² for all four edges. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const Q = require('../interval/rational.js');
const S = require('../ivspecial/ivspecial.js');

const { iv, add, sub, mul, div, neg } = I;

const r_ = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));

/* rational → tightest verified double interval */
function ratToIv(a) {
  const q0 = Q.toDouble(a);
  let lo = q0, hi = q0;
  for (let w = 0; w < 60; w++) {
    if (Q.inClosed(a, lo, hi)) return [lo, hi];
    lo = I.nextDown(lo); hi = I.nextUp(hi);
  }
  throw new Error('ratToIv: containment never verified');
}

/* ---------- the specimen ---------- */
const VQ = [[r_(0), r_(0)], [r_(1), r_(0)], [r_(17, 20), r_(9, 10)], [r_(1, 4), r_(9, 10)]];
const V = VQ.map(p => p.map(ratToIv));
const VF = VQ.map(p => p.map(Q.toDouble));
const VERT_STR = ['(0, 0)', '(1, 0)', '(17/20, 9/10)', '(1/4, 9/10)'];

/* the frozen trial's identity */
const K_FAN = 10;
const LAM = 12.021687243;          // λ̃, a frozen exact double (the trial is DEFINED at this value)

/* partition constants, rational and float views of the same numbers */
const DEPTH_CORE = { n: 3n, d: 40n, f: 0.075 };
const RTIP = { n: 11n, d: 100n, f: 0.11 };
const CORE_BAR = { n: 9n, d: 200n, f: 0.045 };

/* ---------- corner frames (interval) ---------- */
function angleOfIv(dx, dy) { // continuous branch; needs dx OR dy sign-definite
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
  if (!(om[0] > 0 && om[1] < Math.PI)) throw new Error('corner opening not in (0, π)');
  CORN.push({ V: Vv, a1, om, nub: div(T.PI, om) });
}

/* ---------- float geometry (steering / display only) ---------- */
function insideQF(x, y) {
  for (let e = 0; e < 4; e++) {
    const A = VF[e], B = VF[(e + 1) % 4];
    if ((B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]) < 0) return false;
  }
  return true;
}
function distToSegF(x, y, A, B) {
  const vx = B[0] - A[0], vy = B[1] - A[1];
  const t = Math.max(0, Math.min(1, ((x - A[0]) * vx + (y - A[1]) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - A[0] - t * vx, y - A[1] - t * vy);
}
function depthF(x, y) {
  let d = Infinity;
  for (let e = 0; e < 4; e++) d = Math.min(d, distToSegF(x, y, VF[e], VF[(e + 1) % 4]));
  return d;
}

/* ---------- exact rational partition deciders ----------
   Points are {n, d} pairs per coordinate (BigInt). Grid corners are dyadic
   or decimal rationals, so every decision below is exact integer
   arithmetic — no float enters. */
const rat = (n, d) => ({ n: BigInt(n), d: BigInt(d) });
const rsub = (a, b) => ({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
const rmul = (a, b) => ({ n: a.n * b.n, d: a.d * b.d });
const radd = (a, b) => ({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
/* sign of a rational (denominators kept positive by construction here) */
const rsign = (a) => (a.d < 0n ? -1n : 1n) * (a.n < 0n ? -1n : a.n > 0n ? 1n : 0n);
const VQR = [[rat(0, 1), rat(0, 1)], [rat(1, 1), rat(0, 1)], [rat(17, 20), rat(9, 10)], [rat(1, 4), rat(9, 10)]];

/* cross_e(p) = (B−A)×(p−A) and L_e² for edge e, exact */
function edgeCrossL2(e, p) {
  const A = VQR[e], B = VQR[(e + 1) % 4];
  const ex = rsub(B[0], A[0]), ey = rsub(B[1], A[1]);
  const px = rsub(p[0], A[0]), py = rsub(p[1], A[1]);
  const cross = rsub(rmul(ex, py), rmul(ey, px));
  const L2 = radd(rmul(ex, ex), rmul(ey, ey));
  return { cross, L2 };
}
/* p strictly outside Ω? (some edge cross < 0) */
function outsideQR(p) {
  for (let e = 0; e < 4; e++) if (rsign(edgeCrossL2(e, p).cross) < 0n) return true;
  return false;
}
/* depth(p) >= t (t = {n,d}, n,d > 0), for p ∈ Ω̄: cross² ≥ t²L² on all edges.
   Exactly: cross.n²·t.d²·L2.d ≥ L2.n·t.n²·cross.d² (all denominators > 0). */
function depthGeQ(p, t) {
  for (let e = 0; e < 4; e++) {
    const { cross, L2 } = edgeCrossL2(e, p);
    if (rsign(cross) < 0n) return false; // outside
    if (cross.n * cross.n * t.d * t.d * L2.d < L2.n * t.n * t.n * cross.d * cross.d) return false;
  }
  return true;
}
/* |p − V_v|² ≤ t² exactly */
function distLeQ(p, v, t) {
  const dx = rsub(p[0], VQR[v][0]), dy = rsub(p[1], VQR[v][1]);
  const d2 = radd(rmul(dx, dx), rmul(dy, dy));
  // d2 ≤ t.n²/t.d²  ⇔  d2.n · t.d² ≤ d2.d · t.n²   (d2.d > 0)
  return d2.n * t.d * t.d <= d2.d * t.n * t.n;
}

/* cell corner list for a rational rect [x0,x1]×[y0,y1] ({n,d} each) */
const cellCorners = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];

/* R1: cell entirely inside one vertex's RTIP disk */
function cellInTipQ(corners) {
  for (let v = 0; v < 4; v++) {
    let all = true;
    for (const p of corners) if (!distLeQ(p, v, RTIP)) { all = false; break; }
    if (all) return true;
  }
  return false;
}
/* R2: some corner has depth < 3/40 (corner outside Ω counts as depth 0) */
function cellTouchesSubCoreQ(corners) {
  for (const p of corners) if (!depthGeQ(p, DEPTH_CORE)) return true;
  return false;
}
/* R3: some corner has depth ≥ 9/200 */
function cellCoreCoverQ(corners) {
  for (const p of corners) if (depthGeQ(p, CORE_BAR)) return true;
  return false;
}
/* does the cell meet Ω̄ at all? EXACT via the separating-axis theorem for a
   convex polygon vs an axis-aligned box: they are disjoint iff separated
   along x, along y, or along one polygon-edge normal (all 4 box corners
   strictly outside that edge). Touching counts as meeting — conservative:
   an extra swept cell costs work, a missed sliver would cost coverage.
   (A float 5-point probe can miss a sliver of Ω crossing a cell corner —
   that near-miss is why this is exact.) */
function cellMeetsDomainQ(x0, x1, y0, y1) { // rational bounds {n,d}
  // box-axis separation: every polygon vertex strictly left / right / below / above
  const lt = (a, b) => rsign(rsub(a, b)) < 0n, gt = (a, b) => rsign(rsub(a, b)) > 0n;
  if (VQR.every(v => lt(v[0], x0))) return false;
  if (VQR.every(v => gt(v[0], x1))) return false;
  if (VQR.every(v => lt(v[1], y0))) return false;
  if (VQR.every(v => gt(v[1], y1))) return false;
  // polygon-edge separation: all 4 box corners strictly outside one edge
  const corners = cellCorners(x0, x1, y0, y1);
  for (let e = 0; e < 4; e++) {
    if (corners.every(p => rsign(edgeCrossL2(e, p).cross) < 0n)) return false;
  }
  return true;
}
/* float probe (steering only — the exact decider above is the authority) */
function cellMeetsDomainF(x0, x1, y0, y1) {
  const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, (y0 + y1) / 2]];
  return cs.some(p => insideQF(p[0], p[1]));
}

module.exports = {
  r_, ratToIv, VQ, V, VF, VERT_STR, VQR, K_FAN, LAM,
  DEPTH_CORE, RTIP, CORE_BAR,
  angleOfIv, CORN,
  insideQF, distToSegF, depthF,
  rat, rsub, radd, rmul, rsign, edgeCrossL2, outsideQR, depthGeQ, distLeQ,
  cellCorners, cellInTipQ, cellTouchesSubCoreQ, cellCoreCoverQ, cellMeetsDomainQ, cellMeetsDomainF,
};
