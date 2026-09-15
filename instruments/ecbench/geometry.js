/* instruments/ecbench/geometry.js — exact plane geometry for the benchmark.

   ONE SOURCE, TWO HOSTS. This file has no require() and no node in it: the
   ledger runner loads it through decide.js, and the instrument page inlines
   these same bytes so the verdict a reader gets in the tab is decided by the
   code that decided the ledger, not a port of it.

   THE DECISION. The benchmark counted "points outside a contour" with
   matplotlib's Path.contains_points — a float64 crossing-number test on a
   polygon closed implicitly from its last vertex to its first, with no defined
   answer for a point on the boundary. Here the same question is decided
   exactly: every hourly observation is INSIDE, OUTSIDE or ON the polygon the
   submitted vertices define, under the even-odd rule the benchmark used, with
   the nonzero-winding count kept beside it (they differ only where a contour
   crosses itself, which is itself reported).

   RIGOR MODEL. Every predicate is a sign: of a 2×2 determinant or of a
   difference of two literals. Each is first evaluated in float64 on the
   double images of the literals; the result is trusted only when it clears a
   PROVED forward-error bound (derived in the comment on `orient`), and is
   otherwise re-decided in BigInt at a fixed decimal scale, where it is exact.
   The battery plants points on edges and at vertices and requires ON. */
'use strict';
/* ---- decimal literals (duplicated from lib.js by design: lib.js reads files and is node-only) ---- */
const DEC_RE = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;
function lit(s) {
  s = String(s).trim();
  if (!DEC_RE.test(s)) throw new Error('not a decimal literal: "' + s + '"');
  const v = Number(s);
  if (!Number.isFinite(v)) throw new Error('literal does not fit a double: ' + s);
  return { s, v };
}
function scaledLit(s, K) {
  const m = DEC_RE.exec(s);
  const neg = m[1] === '-', frac = m[3] || '';
  let num = BigInt(m[2] + frac), k = BigInt(frac.length);
  if (m[4]) { const e = BigInt(m[4]); if (e >= 0n) num *= 10n ** e; else k += -e; }
  const KK = BigInt(K);
  if (k > KK) {
    if (num % (10n ** (k - KK)) !== 0n) throw new Error('literal ' + s + ' needs more than ' + K + ' decimals');
    num /= 10n ** (k - KK);
  } else num *= 10n ** (KK - k);
  return neg ? -num : num;
}


/* ---- the filter ----
   Inputs are decimal literals a with double images A = fl(a), |A − a| ≤ u|a|,
   u = 2^-53. For the determinant
       det = (xj − xi)(py − yi) − (yj − yi)(px − xi)
   with every |coordinate| ≤ M: each difference carries error ≤ 2uM (inputs)
   + u·2M (its rounding) = 4uM and magnitude ≤ 2M; each product then carries
   ≤ 2M·4uM + 2M·4uM + u·4M² = 20uM²; the final subtraction adds ≤ u·8M².
   Total ≤ 48uM². At M = 128 that is 8.7e-11, so a computed |det| > 1e-10
   fixes the sign. For a difference of two literals the same accounting gives
   ≤ 4uM = 5.7e-14 at M = 128; a computed |A − B| > 1e-12 fixes its sign. */
const MAXMAG = 128, DET_EPS = 1e-10, CMP_EPS = 1e-12, K = 64;   /* K: decimals the exact path carries; the benchmark needs 17, the battery plants 52 */
const scaled = (s) => scaledLit(s, K);

/* sign of (b − a) for two literals */
function cmpLit(a, b) {
  predicates++;
  const d = b.v - a.v;
  if (Math.abs(a.v) <= MAXMAG && Math.abs(b.v) <= MAXMAG && Math.abs(d) > CMP_EPS) return d > 0 ? 1 : -1;
  exactOrients++;
  const A = scaled(a.s), B = scaled(b.s);
  return B > A ? 1 : B < A ? -1 : 0;
}
/* sign of det for edge (i -> j) and point p; each argument a literal {s, v} */
let exactOrients = 0, predicates = 0;
function orient(xi, yi, xj, yj, px, py) {
  predicates++;
  const det = (xj.v - xi.v) * (py.v - yi.v) - (yj.v - yi.v) * (px.v - xi.v);
  const inRange = Math.max(Math.abs(xi.v), Math.abs(yi.v), Math.abs(xj.v), Math.abs(yj.v), Math.abs(px.v), Math.abs(py.v)) <= MAXMAG;
  if (inRange && Math.abs(det) > DET_EPS) return det > 0 ? 1 : -1;
  exactOrients++;
  const XI = scaled(xi.s), YI = scaled(yi.s), XJ = scaled(xj.s), YJ = scaled(yj.s), PX = scaled(px.s), PY = scaled(py.s);
  const D = (XJ - XI) * (PY - YI) - (YJ - YI) * (PX - XI);
  return D > 0n ? 1 : D < 0n ? -1 : 0;
}
const between = (x, a, b) => (cmpLit(a, x) >= 0 && cmpLit(x, b) >= 0) || (cmpLit(b, x) >= 0 && cmpLit(x, a) >= 0);

/* ---- the polygon: vertices in the canonical frame (u, h); closed implicitly ----
   A file that repeats its first vertex at the end, or repeats any vertex
   consecutively, describes the same polygon with a zero-length edge in it;
   those are removed here and COUNTED, so the geometry below never sees a
   degenerate edge and the ledger still says the file carried one. */
function polygon(raw) {
  const same = (a, b) => cmpLit(a.u, b.u) === 0 && cmpLit(a.h, b.h) === 0;
  const pts = [];
  let duplicates = 0;
  for (const p of raw) { if (pts.length && same(pts[pts.length - 1], p)) duplicates++; else pts.push(p); }
  const closedExplicitly = pts.length > 1 && same(pts[0], pts[pts.length - 1]);
  if (closedExplicitly) pts.pop();
  const n = pts.length;
  if (n < 3) throw new Error('polygon: fewer than three distinct vertices');
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    edges.push({ i, ax: a.u, ay: a.h, bx: b.u, by: b.h });
  }
  let ymin = Infinity, ymax = -Infinity, xmin = Infinity, xmax = -Infinity;
  for (const p of pts) { ymin = Math.min(ymin, p.h.v); ymax = Math.max(ymax, p.h.v); xmin = Math.min(xmin, p.u.v); xmax = Math.max(xmax, p.u.v); }
  /* y-buckets: an edge sits in every bucket its (padded) y-range touches, so
     the candidate set for a point is a SUPERSET of the edges that can touch
     its horizontal line — the exactness lives in the predicates, not here */
  const B = 1024, span = Math.max(ymax - ymin, 1e-9), hgt = span / B;
  const buckets = Array.from({ length: B }, () => []);
  for (const e of edges) {
    const lo = Math.min(e.ay.v, e.by.v) - 1e-9, hi = Math.max(e.ay.v, e.by.v) + 1e-9;
    const b0 = Math.max(0, Math.floor((lo - ymin) / hgt)), b1 = Math.min(B - 1, Math.floor((hi - ymin) / hgt));
    for (let b = b0; b <= b1; b++) buckets[b].push(e);
  }
  return { pts, n, edges, ymin, ymax, xmin, xmax, B, hgt, buckets, rawVertices: raw.length, duplicates, closedExplicitly };
}

/* classify one point: returns { where: 'IN'|'OUT'|'ON', winding } */
function classify(P, px, py) {
  if (py.v < P.ymin - 1e-9 || py.v > P.ymax + 1e-9 || px.v < P.xmin - 1e-9 || px.v > P.xmax + 1e-9) return { where: 'OUT', winding: 0 };
  const b = Math.min(P.B - 1, Math.max(0, Math.floor((py.v - P.ymin) / P.hgt)));
  let crossings = 0, winding = 0;
  for (const e of P.buckets[b]) {
    const ci = cmpLit(py, e.ay), cj = cmpLit(py, e.by);      /* sign(yi − py), sign(yj − py) */
    if (ci === 0 && cj === 0) {                                /* horizontal edge on the line */
      if (between(px, e.ax, e.bx)) return { where: 'ON', winding: null };
      continue;
    }
    if (ci === 0 || cj === 0 || (ci > 0) !== (cj > 0)) {
      const d = orient(e.ax, e.ay, e.bx, e.by, px, py);
      if (d === 0 && between(px, e.ax, e.bx)) return { where: 'ON', winding: null };
      if ((ci > 0) !== (cj > 0)) {                             /* half-open straddle: yi > py xor yj > py */
        const up = cj > ci;                                    /* edge rises through the line */
        if ((up && d > 0) || (!up && d < 0)) { crossings++; winding += up ? 1 : -1; }
      }
    }
  }
  return { where: crossings % 2 === 1 ? 'IN' : 'OUT', winding };
}

/* every point of a dataset against a polygon. Even-odd is the rule the
   benchmark used; the nonzero-winding count is kept beside it, and the two
   can differ only where the contour crosses itself. Threshold counts follow
   the paper: Hs > 1 m (and, for the wind-wave sets, also u10 > 1 m/s). */
function count(P, D, opts) {
  const one = lit('1');
  const res = { n: D.n, in: 0, out: 0, on: 0, outAboveThreshold: 0, outWinding: 0, rulesDisagree: 0, onIdx: [], outIdx: [] };
  const needU = !!(opts && opts.windThreshold);
  const px = { s: '', v: 0 }, py = { s: '', v: 0 };
  for (let i = 0; i < D.n; i++) {
    px.s = D.us[i]; px.v = D.u[i]; py.s = D.hs[i]; py.v = D.h[i];
    const c = classify(P, px, py);
    if (c.where === 'ON') { res.on++; if (res.onIdx.length < 10000) res.onIdx.push(i); continue; }
    const evenOddIn = c.where === 'IN', windingIn = c.winding !== 0;
    if (evenOddIn !== windingIn) res.rulesDisagree++;
    if (!windingIn) res.outWinding++;
    if (evenOddIn) { res.in++; continue; }
    res.out++;
    if (res.outIdx.length < 10000) res.outIdx.push(i);
    if (cmpLit(one, py) > 0 && (!needU || cmpLit(one, px) > 0)) res.outAboveThreshold++;
  }
  return res;
}

/* ---- polygon diagnostics ---- */
function segmentsCross(e, f) {
  /* proper crossing: each segment's endpoints on opposite strict sides of the other */
  const d1 = orient(e.ax, e.ay, e.bx, e.by, f.ax, f.ay), d2 = orient(e.ax, e.ay, e.bx, e.by, f.bx, f.by);
  if (d1 * d2 > 0) return 'NONE';
  const d3 = orient(f.ax, f.ay, f.bx, f.by, e.ax, e.ay), d4 = orient(f.ax, f.ay, f.bx, f.by, e.bx, e.by);
  if (d3 * d4 > 0) return 'NONE';
  if (d1 * d2 < 0 && d3 * d4 < 0) return 'CROSS';
  /* some collinear/touching configuration: touching if any endpoint lies on the other segment */
  const on = (p, q, g) => orient(g.ax, g.ay, g.bx, g.by, p, q) === 0 && between(p, g.ax, g.bx) && between(q, g.ay, g.by);
  if (on(f.ax, f.ay, e) || on(f.bx, f.by, e) || on(e.ax, e.ay, f) || on(e.bx, e.by, f)) return 'TOUCH';
  return 'NONE';
}
function diagnostics(P) {
  const n = P.n, pts = P.pts;
  const closed = P.closedExplicitly, duplicates = P.duplicates;
  let cross = 0, touch = 0, backtrack = 0;
  const crossingPairs = [];                                    /* the first eight, as edge indices; edge n−1 is the implicit closing edge */
  const E = P.edges;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;                    /* adjacent through the closure */
      const e = E[i], f = E[j];
      /* cheap bbox reject in float with the same padding logic (a superset filter) */
      if (Math.max(e.ax.v, e.bx.v) + 1e-9 < Math.min(f.ax.v, f.bx.v) || Math.max(f.ax.v, f.bx.v) + 1e-9 < Math.min(e.ax.v, e.bx.v)) continue;
      if (Math.max(e.ay.v, e.by.v) + 1e-9 < Math.min(f.ay.v, f.by.v) || Math.max(f.ay.v, f.by.v) + 1e-9 < Math.min(e.ay.v, e.by.v)) continue;
      const r = segmentsCross(e, f);
      if (r === 'CROSS') { cross++; if (crossingPairs.length < 8) crossingPairs.push([i, j]); } else if (r === 'TOUCH') touch++;
    }
    /* adjacent pair (i, i+1): a backtrack is a collinear fold */
    const e = E[i], f = E[(i + 1) % n];
    if (orient(e.ax, e.ay, e.bx, e.by, f.bx, f.by) === 0) {
      /* collinear: fold if f.b lies back along e (dot < 0) */
      const dx1 = scaled(e.ax.s) - scaled(e.bx.s), dy1 = scaled(e.ay.s) - scaled(e.by.s);
      const dx2 = scaled(f.bx.s) - scaled(e.bx.s), dy2 = scaled(f.by.s) - scaled(e.by.s);
      if (dx1 * dx2 + dy1 * dy2 > 0n) backtrack++;
    }
  }
  /* exact signed area (shoelace) at scale K: area = A / (2·10^(2K)); printed as a
     decimal truncated to six places by integer division, so the record does not
     depend on K or on a double's rounding */
  let A = 0n;
  for (const e of E) A += scaled(e.ax.s) * scaled(e.by.s) - scaled(e.bx.s) * scaled(e.ay.s);
  const S2K = 10n ** BigInt(2 * K);
  const decOf = (num, den, d) => { const neg = num < 0n; if (neg) num = -num; const t = (num * 10n ** BigInt(d)) / den; const str = t.toString().padStart(d + 1, '0'); return (neg ? '-' : '') + str.slice(0, -d) + '.' + str.slice(-d); };
  /* floor(sqrt(v)) by Newton's iteration from above — a float seed is 1e54 off at these sizes */
  const isqrt = (v) => { if (v < 0n) throw new Error('isqrt of a negative'); if (v < 2n) return v; let x = 1n << BigInt(Math.ceil(v.toString(2).length / 2)); for (;;) { const y = (x + v / x) >> 1n; if (y >= x) return x; x = y; } };
  const area = decOf(A, 2n * S2K, 6);
  /* edge lengths: sqrt of an exact len², floored to six decimals */
  const len2 = (e) => { const dx = scaled(e.ax.s) - scaled(e.bx.s), dy = scaled(e.ay.s) - scaled(e.by.s); return dx * dx + dy * dy; };
  const lenStr = (l2) => decOf(isqrt(l2 * 10n ** 12n), 10n ** BigInt(K + 6), 6);
  const closing = E[n - 1];
  const closingLen2 = len2(closing);
  let longest = 0n, longestIdx = -1;
  for (const e of E) { const l = len2(e); if (l > longest) { longest = l; longestIdx = e.i; } }
  /* maxima along the contour: linear functions of position peak at vertices */
  let maxH = pts[0], minU = pts[0], maxU = pts[0];
  for (const p of pts) { if (cmpLit(maxH.h, p.h) > 0) maxH = p; if (cmpLit(p.u, minU.u) > 0) minU = p; if (cmpLit(maxU.u, p.u) > 0) maxU = p; }
  return {
    vertices: P.rawVertices, distinctVertices: n, closed, duplicates, selfCrossings: cross, touches: touch, backtracks: backtrack,
    simple: cross === 0 && touch === 0 && backtrack === 0,
    crossingPairs, closingEdgeCrosses: crossingPairs.some((pr) => pr[1] === n - 1),
    signedArea: area, orientation: A > 0n ? 'CCW' : A < 0n ? 'CW' : 'DEGENERATE',
    closingEdgeLength: lenStr(closingLen2),
    closingEdgeIsLongest: longestIdx === n - 1 && closingLen2 > 0n,
    longestEdgeLength: lenStr(longest),
    maxHs: maxH.h.s, atMaxHs: { u: maxH.u.s }, minU: minU.u.s, maxU: maxU.u.s,
  };
}

const ECGEO = { lit, scaledLit, polygon, classify, count, diagnostics, cmpLit, orient, segmentsCross, exactCount: () => exactOrients, predicateCount: () => predicates, K, DET_EPS, CMP_EPS, MAXMAG };
if (typeof module !== 'undefined' && module.exports) module.exports = ECGEO;
else if (typeof window !== 'undefined') window.ECGEO = ECGEO;
