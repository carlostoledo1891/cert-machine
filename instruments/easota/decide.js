/* instruments/easota/decide.js — one exact decider per EinsteinArena claim.

   Each function takes the claimant's construction as exact rationals and
   returns the EXACT value of the platform's objective together with every
   constraint's exact slack. Nothing here uses a tolerance; where the
   platform's verifier does (1e-9 on an overlap, 1e-6 on a sum), the slack is
   reported and the ledger says which side of zero it fell — and where a
   construction is a witness only up to the tolerance, a REPAIR is built from
   the claimant's own bytes and its deficit printed. A failed witness never
   refutes a bound: the grammar is WITNESSED / REPAIRED / UNWITNESSED.

   The verdicts are about the bytes as published, read as the rationals their
   decimal literals denote (lib.js). */
'use strict';
const path = require('path');
const { Q } = require(path.join(__dirname, 'lib.js'));
const { R, ZERO, ONE, add, sub, mul, div, cmp, sign, abs, neg } = Q;
const sq = (a) => mul(a, a);
const min = (arr, key) => arr.reduce((m, x) => (m === null || cmp(key(x), key(m)) < 0 ? x : m), null);
const max = (arr, key) => arr.reduce((m, x) => (m === null || cmp(key(x), key(m)) > 0 ? x : m), null);
/* floor(sqrt(a/b)) to k decimals, as a rational strictly <= sqrt(a/b) */
function sqrtDown(r, k = 20) {
  if (sign(r) < 0) throw new Error('sqrtDown of a negative');
  const scale = 10n ** BigInt(k);
  const N = r.n * scale * scale / r.d;                       /* floor of r·10^2k */
  let x = BigInt(Math.floor(Math.sqrt(Number(N))));
  while (x * x > N) x--; while ((x + 1n) * (x + 1n) <= N) x++;
  return R(x, scale);
}

/* ---------------- circles in a rectangle: maximise Σ r ----------------
   The platform: bounding box of the circles has width + height <= 2 (+1e-9),
   no two circles overlap (dist >= r1 + r2 - 1e-9); score = Σ r. */
function circles(C) {
  const n = C.length;
  const sumR = C.reduce((s, c) => add(s, c[2]), ZERO);
  const box = (lam) => {
    const xs0 = C.map((c) => sub(c[0], mul(lam, c[2]))), xs1 = C.map((c) => add(c[0], mul(lam, c[2])));
    const ys0 = C.map((c) => sub(c[1], mul(lam, c[2]))), ys1 = C.map((c) => add(c[1], mul(lam, c[2])));
    const w = sub(max(xs1, (x) => x), min(xs0, (x) => x)), h = sub(max(ys1, (y) => y), min(ys0, (y) => y));
    return { w, h, slack: sub(R(2), add(w, h)) };
  };
  const b = box(ONE);
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d2 = add(sq(sub(C[i][0], C[j][0])), sq(sub(C[i][1], C[j][1])));
    const s2 = sq(add(C[i][2], C[j][2]));
    pairs.push({ i, j, d2, s2, slack: sub(d2, s2) });
  }
  const worst = min(pairs, (p) => p.slack);
  const overlaps = pairs.filter((p) => sign(p.slack) < 0).length;
  const witnessed = sign(b.slack) >= 0 && overlaps === 0;
  let repair = null;
  if (!witnessed) {
    /* scale every radius by one λ <= 1: λ² <= d²/(r_i + r_j)² for every pair, then the box */
    let lam = ONE;
    for (const p of pairs) if (sign(p.s2) > 0) { const l = sqrtDown(div(p.d2, p.s2)); if (cmp(l, lam) < 0) lam = l; }
    let lo = ZERO, hi = lam;                                    /* the box is monotone in λ */
    if (sign(box(hi).slack) < 0) { for (let t = 0; t < 80; t++) { const m = div(add(lo, hi), R(2)); if (sign(box(m).slack) >= 0) lo = m; else hi = m; } lam = lo; }
    const rb = box(lam);
    /* shrinking radii cannot move centres: a box the centres alone overflow has no repair */
    repair = (sign(rb.slack) >= 0 && sign(lam) > 0) ? { lambda: lam, sumR: mul(lam, sumR), deficit: sub(sumR, mul(lam, sumR)), boxSlack: rb.slack } : null;
  }
  return { n, sumR, boxW: b.w, boxH: b.h, boxSlack: b.slack, overlaps, worstPair: { i: worst.i, j: worst.j, slack: worst.slack }, witnessed, repair };
}

/* ---------------- Heilbronn in a convex region: maximise min triangle / hull area ---------------- */
function heilbronn(P) {
  const n = P.length;
  const cross = (o, a, b) => sub(mul(sub(a[0], o[0]), sub(b[1], o[1])), mul(sub(a[1], o[1]), sub(b[0], o[0])));
  /* Andrew's monotone chain, exact; the platform's convex_hull with <= 0 pops collinear points too */
  const pts = P.slice().sort((a, b) => cmp(a[0], b[0]) || cmp(a[1], b[1]));
  const lower = []; for (const p of pts) { while (lower.length >= 2 && sign(cross(lower[lower.length - 2], lower[lower.length - 1], p)) <= 0) lower.pop(); lower.push(p); }
  const upper = []; for (const p of pts.slice().reverse()) { while (upper.length >= 2 && sign(cross(upper[upper.length - 2], upper[upper.length - 1], p)) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  let a2 = ZERO; for (let i = 0; i < hull.length; i++) { const p = hull[i], q = hull[(i + 1) % hull.length]; a2 = add(a2, sub(mul(p[0], q[1]), mul(q[0], p[1]))); }
  const hullArea = div(abs(a2), R(2));
  let best = null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const t = div(abs(cross(P[i], P[j], P[k])), R(2));
    if (!best || cmp(t, best.area) < 0) best = { i, j, k, area: t };
  }
  const distinct = new Set(P.map((p) => Q.toString(p[0]) + ',' + Q.toString(p[1]))).size === n;
  return { n, hullVertices: hull.length, hullArea, minArea: best.area, minTriangle: [best.i, best.j, best.k], score: div(best.area, hullArea), distinct, witnessed: distinct && sign(best.area) > 0 };
}

/* ---------------- min distance ratio in 2-D: minimise (max d / min d)² ---------------- */
function mindist(P) {
  const n = P.length;
  let lo = null, hi = null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d2 = add(sq(sub(P[i][0], P[j][0])), sq(sub(P[i][1], P[j][1])));
    if (!lo || cmp(d2, lo.d2) < 0) lo = { i, j, d2 };
    if (!hi || cmp(d2, hi.d2) > 0) hi = { i, j, d2 };
  }
  const distinct = sign(lo.d2) > 0;
  return { n, minD2: lo.d2, maxD2: hi.d2, minPair: [lo.i, lo.j], maxPair: [hi.i, hi.j], score: distinct ? div(hi.d2, lo.d2) : null, distinct, witnessed: distinct };
}

/* ---------------- Erdős minimum overlap: a step function h, upper bound 2·max corr(h, 1−h)/n ----------------
   The platform requires 0 <= h <= 1 and Σh = n/2 within 1e-6. Here Σh = n/2
   exactly, or the function is renormalised (a REPAIR) and the bound re-decided. */
function overlap(h) {
  const n = h.length;
  const inRange = h.every((v) => sign(v) >= 0 && cmp(v, ONE) <= 0);
  const sum = h.reduce((s, v) => add(s, v), ZERO);
  const sumSlack = sub(sum, R(n, 2));
  /* integers over one common denominator: h_i = a_i/D, 1 − h_i = (D − a_i)/D, so the
     correlation at a lag is an integer sum over D²; exact, and fast enough for n = 600 */
  const bound = (g) => {
    let D = 1n; for (const v of g) D = D * v.d / (function gcd(x, y) { while (y) { [x, y] = [y, x % y]; } return x; })(D, v.d);
    const A = g.map((v) => v.n * (D / v.d)), B = A.map((x) => D - x);
    let best = null;
    for (let lag = -(n - 1); lag <= n - 1; lag++) {
      let s = 0n;
      const lo = Math.max(0, -lag), hi = Math.min(n - 1, n - 1 - lag);
      for (let i = lo; i <= hi; i++) s += A[i + lag] * B[i];
      if (!best || s > best.s) best = { lag, s };
    }
    return { value: R(2n * best.s, BigInt(n) * D * D), lag: best.lag };
  };
  const b = bound(h);
  const witnessed = inRange && sign(sumSlack) === 0;
  let repair = null;
  if (inRange && sign(sumSlack) !== 0) {
    const target = R(n, 2);
    const g = sign(sumSlack) > 0 ? h.map((v) => div(mul(v, target), sum))
      : h.map((v) => sub(ONE, div(mul(sub(ONE, v), sub(R(n), target)), sub(R(n), sum))));
    const rb = bound(g);
    repair = { bound: rb.value, lag: rb.lag, delta: sub(rb.value, b.value), how: sign(sumSlack) > 0 ? 'h scaled down to Σh = n/2' : '1 − h scaled down to Σh = n/2' };
  }
  return { n, inRange, sum, sumSlack, bound: b.value, lag: b.lag, witnessed, repair };
}

/* ---------------- edges vs triangles: the platform's envelope score, exactly ----------------
   Rows of 20 weights normalised to sum 1; ρ = 1 − Σw², τ = 1 − 3Σw² + 2Σw³
   (the Newton identities for pairwise and triple products); the curve is
   sorted by ρ, deduplicated on ρ, closed with (0,0) and (1,1), and the area
   under the platform's slope-3 envelope is integrated segment by segment;
   score = −(area + 10·max gap in ρ). The platform's 1e-9 branches are exact
   comparisons here; a segment narrower than 1e-9 contributes its exact area
   instead of nothing, which bounds the difference by 1e-9 per such segment. */
function edges(W) {
  const rows = W.map((r, i) => { const s = r.reduce((a, v) => add(a, v), ZERO); if (sign(s) <= 0) throw new Error('edges: row ' + i + ' sums to zero'); return r.map((v) => div(v, s)); });
  const pts = rows.map((r) => { const S2 = r.reduce((a, v) => add(a, sq(v)), ZERO), S3 = r.reduce((a, v) => add(a, mul(v, sq(v))), ZERO);
    return { x: sub(ONE, S2), y: add(sub(ONE, mul(R(3), S2)), mul(R(2), S3)) }; });
  pts.sort((a, b) => cmp(a.x, b.x));
  const full = [{ x: ZERO, y: ZERO }].concat(pts, [{ x: ONE, y: ONE }]);
  const uniq = []; for (const p of full) if (!uniq.length || cmp(p.x, uniq[uniq.length - 1].x) !== 0) uniq.push(p);
  let area = ZERO, maxGap = ZERO, skipped = 0;
  const slope = R(3);
  for (let i = 0; i + 1 < uniq.length; i++) {
    const { x: xi, y: yi } = uniq[i], { x: xn, y: yn } = uniq[i + 1];
    const w = sub(xn, xi);
    if (sign(w) <= 0) { skipped++; continue; }
    let seg;
    if (cmp(yi, yn) > 0) seg = mul(yi, w);
    else {
      const yc = add(yi, mul(slope, w));
      if (cmp(yc, yn) <= 0) seg = div(mul(add(yi, yc), w), R(2));
      else {
        let w1 = div(sub(yn, yi), slope); if (sign(w1) < 0) w1 = ZERO; if (cmp(w1, w) > 0) w1 = w;
        seg = add(div(mul(add(yi, yn), w1), R(2)), mul(yn, sub(w, w1)));
      }
    }
    area = add(area, seg);
    if (cmp(xi, ONE) < 0 && cmp(w, maxGap) > 0) maxGap = w;
  }
  return { rows: W.length, distinctRho: uniq.length - 2, area, maxGap, score: neg(add(area, mul(R(10), maxGap))), witnessed: true, skipped };
}

/* ---------------- the first autocorrelation inequality: C1 of a step function, exactly ----------------
   f >= 0 as n values on [-1/4, 1/4], dx = 1/(2n). For a step function the
   autoconvolution is piecewise linear with its breakpoints at multiples of dx,
   so the platform's max over the discrete convolution IS the sup of f*f, and
   C1 = 2n · max_k Σ_i a_i a_{k-i} / (Σ a_i)² with a_i = f_i·D integers over one
   denominator D. n² products are screened in float64 with a forward error
   bound and every candidate index is then decided exactly; the bound is
   stated in the result so the screen can be audited. */
function autocorr(f) {
  const n = f.length;
  if (!f.every((v) => sign(v) >= 0)) return { n, witnessed: false, reason: 'a negative value' };
  let D = 1n; for (const v of f) if (v.d > D) D = v.d;     /* denominators are powers of ten: the largest divides into all */
  const a = f.map((v) => v.n * (D / v.d));
  const sumA = a.reduce((s, x) => s + x, 0n);
  if (sumA === 0n) return { n, witnessed: false, reason: 'the integral is zero' };
  /* float screen */
  const fa = a.map((x) => Number(x));
  const conv = new Float64Array(2 * n - 1);
  for (let i = 0; i < n; i++) { const fi = fa[i]; if (!fi) continue; for (let j = 0; j < n; j++) conv[i + j] += fi * fa[j]; }
  let M = 0, kM = 0; for (let k = 0; k < conv.length; k++) if (conv[k] > M) { M = conv[k]; kM = k; }
  const u = Math.pow(2, -53), e = 8 * n * u, thr = M * (1 - 2 * e);
  const cand = []; for (let k = 0; k < conv.length; k++) if (conv[k] >= thr) cand.push(k);
  /* exact at every candidate */
  let best = null;
  for (const k of cand) {
    let s = 0n; const lo = Math.max(0, k - n + 1), hi = Math.min(k, n - 1);
    for (let i = lo; i <= hi; i++) s += a[i] * a[k - i];
    if (best === null || s > best.s) best = { k, s };
  }
  const C1 = R(2n * BigInt(n) * best.s, sumA * sumA);
  return { n, witnessed: true, C1, argmax: best.k, floatArgmax: kM, candidates: cand.length, errorBound: e, denominatorDigits: D.toString().length - 1 };
}

/* ceil(sqrt(a/b)) to k decimals, as a rational >= sqrt(a/b) */
function sqrtUp(r, k = 20) {
  const scale = 10n ** BigInt(k);
  const N = (r.n * scale * scale + r.d - 1n) / r.d;             /* ceil of r·10^2k */
  let x = BigInt(Math.floor(Math.sqrt(Number(N))));
  while (x * x > N) x--; while ((x + 1n) * (x + 1n) <= N) x++;
  if (x * x < N) x++;
  return R(x, scale);
}

/* ---------------- flat polynomials: the supremum of |g| on the unit circle, CERTIFIED ----------------
   g has coefficients ±1. |g(e^{iθ})|² = a₀ + 2 Σ_{k≥1} a_k cos(kθ) with a_k the
   autocorrelations of the coefficient sequence — an integer cosine polynomial,
   which is P(cos θ) for the Chebyshev reduction P. instruments/trigmin
   certifies min P on [−1,1] (Sturm chain, interval Newton, exact Taylor value
   enclosures, outward rounding); max P = −min(−P). The platform's score is the
   maximum over a grid of 10⁶ points — a LOWER bound of the supremum. The
   enclosure returned here is the supremum itself: C⁺ = √(max P / (N+1)). */
function flat(c) {
  const N = c.length;
  if (!c.every((x) => x === 1n || x === -1n)) return { N, witnessed: false, reason: 'a coefficient that is not ±1' };
  const CM = require(path.join(__dirname, '..', 'trigmin', 'certify-min.js'));
  const CHB = require(path.join(__dirname, '..', 'trigmin', 'cheb.js'));
  const a = []; for (let k = 0; k < N; k++) { let s = 0n; for (let j = 0; j + k < N; j++) s += c[j] * c[j + k]; a.push(s); }
  let P = [a[0]];
  for (let k = 1; k < N; k++) { if (a[k] === 0n) continue; const T = CHB.chebT(k); for (let i = 0; i < T.length; i++) P[i] = (P[i] || 0n) + 2n * a[k] * T[i]; }
  P = CHB.trim(P.map((x) => x || 0n));
  const t0 = Date.now();
  const res = CM.certifyPoly(P.map((x) => -x), { tol: 1e-13 });
  const [mlo, mhi] = res.minEnclosure;                          /* min(−P) ∈ [mlo, mhi], outward-rounded doubles */
  const maxLo = Q.fromDouble(-mhi), maxHi = Q.fromDouble(-mlo); /* max P ∈ [maxLo, maxHi], exactly */
  const Cplus = [sqrtDown(div(maxLo, R(N + 1))), sqrtUp(div(maxHi, R(N + 1)))];
  const arg = res.argEnclosures.filter((e) => e.value[0] <= mhi && e.value[1] >= mlo).map((e) => ({ kind: e.kind, cosTheta: e.y }));
  return { N, witnessed: true, degree: res.degree, maxSq: [maxLo, maxHi], Cplus, arg, method: res.method, counts: res.counts, ms: Date.now() - t0 };
}

module.exports = { circles, heilbronn, mindist, overlap, edges, autocorr, flat, sqrtDown, sqrtUp };
