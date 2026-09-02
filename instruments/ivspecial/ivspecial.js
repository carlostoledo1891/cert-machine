/* ivspecial.js — interval special functions: Γ (Spouge) and Bessel J_ν at
   real order, including fractional and negative order. The missing instrument
   for the spectral-geometry lane (MPS / Fourier-Bessel certificates).

   PROVENANCE (ember port, 2026-09-02). Copy-with-sha of the operator's own
   MIT ivspecial.js from frontier-apps/experiments/ember (no git there; the
   source bytes are pinned in frontier-ref/):
     ivspecial.js       sha256 e4163b62c0b8ca245c6a6f37e7091523516551e8936262b43ef85dd9a634b960
     test-ivspecial.js  sha256 348fa511e4af3b9566b08f6ae0b7589704db39aa06436c10a9afb20f11aacada
   Declared deltas from the pinned source, found in the port's line-by-line
   review (everything else is verbatim apart from require paths):
     D1  besselJdIv tail bar tightened q < 1 → q <= 0.9: the ×2 tail factor
         covers the coefficient-ratio growth only while 2(1−1.025q) ≥ 1−q,
         i.e. q ≤ 0.95; the source threw only at q ≥ 1, leaving a marginal
         zone (0.95, 1) where the bound was unproved. Unreachable in the ember
         chain (q ~ 0.02 there), closed on principle here.
     D2  besselJIv guards the effective Γ domain explicitly: the source
         advertises ν > −1 but gammaIv refuses below ν+1 ≤ 0.4, so orders
         ν ≤ −0.6 threw from inside Γ; the port refuses them at the door
         with the honest message. (Ember needs ν−2 ≈ −0.19 at corner C —
         well inside.)
     D3  dead duplicated branch in besselJdIv (both arms identical) folded.
     D4  (2026-09-02, for the band program's fat-interval ORDERS) gammaIv
         splits wide arguments by unimodality: Spouge over a wide interval
         loses the bracket cancellation (Γ([0.5, 1.25]) enclosed to width
         ~1700, an interval containing 0, refusing the Bessel series). Γ is
         log-convex hence unimodal on (0,∞) with its unique minimum in
         [1.4616, 1.4617], so for width > 1e-3 the enclosure is the hull of
         POINT evaluations at the endpoints, plus the enclosure over
         [1.4616, 1.4617] when the argument straddles the minimum. The
         battery's fat-order falsifiers cover both regimes.

   Exports (all take/return instruments/interval [lo,hi] intervals unless
   noted): sqrtIv, atanIv, angleOf (interval angle in [0,2π) of a float
   vector), powIv (x>0, real interval exponent), gammaIv (Spouge a=20,
   z > 0.4), besselJIv (ν > −0.6, x ≥ 0), besselJdIv (d/dx J_ν).

   Rigor notes (from the source, verified in review):
   - The Bessel series terms use ONE Γ(ν+1); successive terms via the exact
     ratio −(x/2)²/(m(ν+m)), so Γ never re-enters.
   - Tail: once |t_{m+1}| ≤ q·|t_m| with certified q < 1, the remainder is
     bounded geometrically by |t_{M+1}|/(1−q).
   - Spouge coefficients c_k = (−1)^{k−1}(a−k)^{k−1}√(a−k)·e^{a−k}/(k−1)!
     are built from exact integers × interval sqrt/exp; the analytic error
     bound a^{−1/2}(2π)^{−(a+1/2)} is applied ×10 defensively. The
     bracket-sum cancellation (Σ|c_k| ~ 1e9) limits Γ widths to ~1e-7
     relative — ample for defect certification.
   The battery cross-checks every claim against instruments/bigfloat and
   exact rationals — two implementations, one gate. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');

const { iv, add, sub, mul, div, neg } = I;

function sqrtIv(a) {
  if (a[0] < 0) throw new Error('sqrtIv: negative interval');
  return [I.nextDown(Math.sqrt(a[0])), I.nextUp(Math.sqrt(a[1]))];
}

/* arctan for a POINT double t ≥ 0 (returns interval); halve until small */
function atanPos(t) {
  if (t === 0) return I.ZERO;
  let x = iv(t), halvings = 0;
  while (x[1] > 0.1) {
    // atan(x) = 2 atan( x / (1 + sqrt(1+x²)) )
    const d = add(I.ONE, sqrtIv(add(I.ONE, mul(x, x))));
    x = div(x, d);
    halvings++;
    if (halvings > 80) throw new Error('atanPos: no convergence');
  }
  // alternating series Σ (−1)^k x^{2k+1}/(2k+1), |x| ≤ 0.1
  let s = I.ZERO, xp = x;
  const x2 = mul(x, x);
  for (let k = 0; k < 12; k++) {
    const term = div(xp, iv(2 * k + 1));
    s = k % 2 === 0 ? add(s, term) : sub(s, term);
    xp = mul(xp, x2);
  }
  // tail ≤ first omitted term magnitude
  const tail = I.mag(div(xp, iv(25)));
  s = [I.nextDown(s[0] - tail), I.nextUp(s[1] + tail)];
  return mul(iv(Math.pow(2, halvings)), s);
}
function atanIv(x) { // x any interval
  const lo = x[0] >= 0 ? atanPos(x[0]) : neg(atanPos(-x[0]));
  const hi = x[1] >= 0 ? atanPos(x[1]) : neg(atanPos(-x[1]));
  return [Math.min(lo[0], hi[0]), Math.max(lo[1], hi[1])];
}

/* interval angle of (dx,dy) in [0,2π); dx,dy exact doubles */
function angleOf(dxv, dyv) {
  const PI = T.PI, TWO_PI = T.TWO_PI, HALF_PI = T.HALF_PI;
  if (dxv === 0 && dyv === 0) throw new Error('angleOf: zero vector');
  if (dxv === 0) return dyv > 0 ? HALF_PI : add(PI, HALF_PI);
  if (dxv > 0 && dyv >= 0) return atanIv(div(iv(dyv), iv(dxv)));
  if (dxv < 0 && dyv > 0) return sub(PI, atanIv(div(iv(dyv), iv(-dxv))));
  if (dxv < 0 && dyv <= 0) return add(PI, atanIv(div(iv(-dyv), iv(-dxv))));
  return sub(TWO_PI, atanIv(div(iv(-dyv), iv(dxv)))); // dx>0, dy<0
}

/* x^p, x > 0 */
function powIv(x, p) {
  if (x[0] <= 0) throw new Error('powIv: base must be positive');
  return T.exp(mul(p, T.log(x)));
}

/* ---------- Γ via Spouge, a = 20 ---------- */
const SPOUGE_A = 20;
let spougeC = null;
function spougeCoeffs() {
  if (spougeC) return spougeC;
  const a = SPOUGE_A;
  const cs = [sqrtIv(T.TWO_PI)]; // c0 = √(2π)
  let fact = 1;
  for (let k = 1; k < a; k++) {
    if (k > 1) fact *= (k - 1);
    const ak = a - k; // positive integer
    let t = I.ONE;
    for (let e = 0; e < k - 1; e++) t = mul(t, iv(ak));    // (a−k)^{k−1}
    t = mul(t, sqrtIv(iv(ak)));                             // ×√(a−k)
    t = mul(t, T.exp(iv(ak)));                              // ×e^{a−k}
    t = div(t, iv(fact));                                   // /(k−1)!
    cs.push(k % 2 === 1 ? t : neg(t));
  }
  spougeC = cs;
  return cs;
}
const gammaMemo = new Map();
function gammaIv(z) { // Γ(z) for z > 0.4 (below 1: via Γ(z) = Γ(z+1)/z); memoized
  const key = z[0] + ',' + z[1];
  const hit = gammaMemo.get(key);
  if (hit) return hit;
  const out = z[1] - z[0] > 1e-3 ? gammaIvWide(z) : gammaIvRaw(z);
  if (gammaMemo.size < 4096) gammaMemo.set(key, out);
  return out;
}
/* D4: wide arguments by unimodality — Γ is log-convex on (0,∞) with its
   unique minimum inside [1.4616, 1.4617], so on [a,b] the maximum is at an
   endpoint and the minimum is at the interior minimum when straddled,
   else at the nearer endpoint. Point evaluations keep Spouge tight. */
function gammaIvWide(z) {
  if (z[0] <= 0.4) throw new Error('gammaIv: z > 0.4 required');
  const ga = gammaIvRaw([z[0], z[0]]);
  const gb = gammaIvRaw([z[1], z[1]]);
  let lo = Math.min(ga[0], gb[0]);
  if (z[0] < 1.4617 && z[1] > 1.4616) lo = Math.min(lo, gammaIvRaw([1.4616, 1.4617])[0]);
  return [lo, Math.max(ga[1], gb[1])];
}
function gammaIvRaw(z) {
  if (z[0] <= 0.4) throw new Error('gammaIv: z > 0.4 required');
  if (z[0] < 1) return div(gammaIv(add(z, I.ONE)), z);
  // Spouge computes Γ(w+1); use w = z − 1 ≥ 0
  const w = sub(z, I.ONE);
  const a = SPOUGE_A;
  const cs = spougeCoeffs();
  let s = cs[0];
  for (let k = 1; k < a; k++) s = add(s, div(cs[k], add(w, iv(k))));
  // defensively widened Spouge error: |ε| ≤ 10 · a^{-1/2} (2π)^{-(a+1/2)}
  const epsBound = 10 * Math.pow(2 * Math.PI, -(a + 0.5)) / Math.sqrt(a);
  s = [I.nextDown(s[0] - epsBound), I.nextUp(s[1] + epsBound)];
  const wpa = add(w, iv(a));
  const pref = mul(powIv(wpa, add(w, iv(0.5))), T.exp(neg(wpa)));
  return mul(pref, s);
}

/* ---------- Bessel J_ν(x), ν > −0.6, x ≥ 0, x below ~30 ---------- */
function besselJIv(nu, x, terms) {
  const M = terms || 40;
  // D2: gammaIv refuses ν+1 ≤ 0.4, so the honest domain is ν > −0.6.
  if (nu[0] <= -0.6) throw new Error('besselJIv: nu > -0.6 required (gammaIv domain)');
  if (x[0] < -1e-300) throw new Error('besselJIv: x >= 0 required');
  x = [Math.max(0, x[0]), x[1]];
  if (x[1] === 0) return nu[0] > 0 ? I.ZERO : I.ONE;
  if (nu[1] < 0 && x[0] === 0) throw new Error('besselJIv: negative order needs x > 0');
  if (x[0] === 0) {
    // 0-containing interval (corner cells): rigorous hull from the
    // alternating series with decreasing terms — needs x ≤ √(4(ν+1)) which
    // x ≤ 1 guarantees for every ν ≥ 0.
    if (x[1] > 1) throw new Error('besselJIv: 0-containing x wider than 1');
    if (nu[1] === 0) {
      const lo2 = I.nextDown(1 - x[1] * x[1] / 4);  // J0 ≥ 1 − x²/4
      return [Math.max(0, lo2), 1];
    }
    if (nu[0] <= 0) throw new Error('besselJIv: 0-containing x with 0-containing nu');
    // 0 ≤ J_ν(t) ≤ (t/2)^ν/Γ(ν+1) ≤ (x1/2)^{νlo}/Γ(ν+1)lo for x1 ≤ 1 (so (x1/2)<1)
    const up = div(powIv(iv(x[1] / 2), [nu[0], nu[0]]), gammaIv(add(nu, I.ONE)));
    return [0, up[1]];
  }
  const xh = div(x, iv(2));
  // t0 = (x/2)^ν / Γ(ν+1)
  const t0 = div(powIv(xh, nu), gammaIv(add(nu, I.ONE)));
  const x2 = mul(xh, xh); // (x/2)²
  let s = t0, t = t0;
  for (let m = 1; m <= M; m++) {
    t = neg(div(mul(t, x2), mul(iv(m), add(nu, iv(m)))));
    s = add(s, t);
  }
  // next-term ratio q must be certified < 1; alternating tail |t_{M+1}|/(1−q)
  const tn = div(mul(t, x2), mul(iv(M + 1), add(nu, iv(M + 1))));
  const q = I.mag(div(x2, mul(iv(M + 2), add(nu, iv(M + 2)))));
  if (!(q < 1)) throw new Error('besselJIv: tail ratio not < 1, raise terms');
  const tail = I.nextUp(I.mag(tn) / (1 - q));
  return [I.nextDown(s[0] - tail), I.nextUp(s[1] + tail)];
}
/* d/dx J_ν(x) = Σ (−1)^m (2m+ν) (x/2)^{2m+ν−1} / (2 · m! Γ(m+ν+1)) */
function besselJdIv(nu, x, terms) {
  const M = terms || 40;
  if (x[0] <= 0) throw new Error('besselJdIv: x > 0 required');
  const xh = div(x, iv(2));
  const g = gammaIv(add(nu, I.ONE));
  const x2 = mul(xh, xh);
  let s = I.ZERO;
  // base for term m: b_m = (x/2)^{2m+ν−1}/(m! Γ(m+ν+1)); build recursively
  let bm = div(powIv(xh, sub(nu, I.ONE)), g); // b_0; powIv handles any real exponent, x>0 (D3)
  let t = null;
  for (let m = 0; m <= M; m++) {
    const coef = div(add(iv(2 * m), nu), iv(2));
    t = mul(coef, bm);
    s = m % 2 === 0 ? add(s, t) : sub(s, t);
    bm = div(mul(bm, x2), mul(iv(m + 1), add(nu, iv(m + 1))));
  }
  const tNext = mul(div(add(iv(2 * (M + 1)), nu), iv(2)), bm);
  const q = I.mag(div(x2, mul(iv(M + 2), add(nu, iv(M + 2)))));
  // D1: the ×2 tail factor is proved sufficient only for q ≤ 0.95; bar at 0.9.
  if (!(q <= 0.9)) throw new Error('besselJdIv: tail ratio not <= 0.9, raise terms');
  const tail = I.nextUp(I.mag(tNext) / (1 - q) * 2); // extra factor: coef growth
  return [I.nextDown(s[0] - tail), I.nextUp(s[1] + tail)];
}

module.exports = { sqrtIv, atanIv, angleOf, powIv, gammaIv, besselJIv, besselJdIv };
