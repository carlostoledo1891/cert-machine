/* instruments/easota/hexagons.js — twelve unit hexagons inside a hexagon,
   decided with certified interval arithmetic.

   The platform's verifier rotates every hexagon by a published angle in
   degrees, so each vertex is a cosine and a sine of a decimal — not a
   rational. The decision therefore runs in outward-rounded interval
   arithmetic (instruments/interval) with a certified π and certified sin/cos:
   every published literal enters as the tightest pair of doubles around the
   exact rational it denotes, and every operation widens outward, so a
   SEPARATED or INSIDE verdict holds for the exact real configuration. The
   separating-axis theorem decides a pair of convex polygons: certified
   SEPARATED when some edge normal has disjoint projections with certainty;
   certified INTERSECTING when every edge normal has overlapping projections
   with certainty; UNDECIDED otherwise, with the enclosure's width stated.
   Containment: a vertex is INSIDE the outer hexagon when every edge cross
   product is certainly non-negative, OUTSIDE when one is certainly negative.

   No tolerance anywhere. The platform separates only past 10⁻⁹ and admits
   a vertex outside by up to 10⁻⁹; both margins are reported as exact facts
   about the bytes, never applied. */
'use strict';
const path = require('path');
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { Q } = require(path.join(__dirname, 'lib.js'));

/* the tightest double interval around an exact rational */
function encloseQ(r) {
  /* Q.toDouble is a reporting conversion, not correctly rounded: walk from it
     until lo <= r <= hi holds EXACTLY, then tighten each end to the last double
     that still holds. Every comparison is exact (fromDouble is lossless). */
  let lo = Q.toDouble(r), hi = lo;
  for (let t = 0; t < 64 && Q.cmp(Q.fromDouble(lo), r) > 0; t++) lo = IV.nextDown(lo);
  for (let t = 0; t < 64 && Q.cmp(Q.fromDouble(hi), r) < 0; t++) hi = IV.nextUp(hi);
  for (let t = 0; t < 64 && Q.cmp(Q.fromDouble(IV.nextUp(lo)), r) <= 0; t++) lo = IV.nextUp(lo);
  for (let t = 0; t < 64 && Q.cmp(Q.fromDouble(IV.nextDown(hi)), r) >= 0; t++) hi = IV.nextDown(hi);
  if (Q.cmp(Q.fromDouble(lo), r) > 0 || Q.cmp(Q.fromDouble(hi), r) < 0) throw new Error('encloseQ: enclosure failed');
  return [lo, hi];
}
const DEG = IV.div(TR.PI, IV.iv(180));
const SIXTH = IV.div(TR.PI, IV.iv(3));

/* the six vertices of a hexagon of side s at (cx, cy), rotated by angleDeg, as interval points */
function vertices(cx, cy, s, angleDeg) {
  const theta = IV.mul(angleDeg, DEG);
  const out = [];
  for (let k = 0; k < 6; k++) {
    const phi = IV.add(theta, IV.mul(IV.iv(k), SIXTH));
    out.push([IV.add(cx, IV.mul(s, TR.cos(phi))), IV.add(cy, IV.mul(s, TR.sin(phi)))]);
  }
  return out;
}
/* edge normals (unnormalised: the sign tests below do not need unit length) */
const normals = (V) => V.map((p, i) => { const q = V[(i + 1) % 6]; const ex = IV.sub(q[0], p[0]), ey = IV.sub(q[1], p[1]); return [IV.neg(ey), ex]; });
/* projection of a polygon on an axis: [certain lower bound of the min, certain upper bound of the max] and
   the inner pair [certain upper bound of the min, certain lower bound of the max] */
function project(V, n) {
  let minLo = Infinity, minHi = Infinity, maxLo = -Infinity, maxHi = -Infinity;
  for (const v of V) {
    const d = IV.add(IV.mul(v[0], n[0]), IV.mul(v[1], n[1]));
    if (d[0] < minLo) minLo = d[0]; if (d[1] < minHi) minHi = d[1];
    if (d[0] > maxLo) maxLo = d[0]; if (d[1] > maxHi) maxHi = d[1];
  }
  return { minLo, minHi, maxLo, maxHi };
}
/* a pair of convex polygons: SEPARATED / INTERSECTING / UNDECIDED, certified */
function pair(V1, V2) {
  let allOverlap = true, bestGap = -Infinity, bestAxis = null;
  const axes = normals(V1).concat(normals(V2));
  for (let a = 0; a < axes.length; a++) {
    const n = axes[a];
    const p = project(V1, n), q = project(V2, n);
    const len = Math.sqrt(Math.max(0, IV.mul(n[0], n[0])[1] + IV.mul(n[1], n[1])[1]));   /* an upper bound of |n| */
    /* certified separation on this axis: the whole of one projection lies below the whole of the other */
    const gap1 = q.minLo - p.maxHi, gap2 = p.minLo - q.maxHi;     /* certain lower bounds of the gaps */
    const gap = Math.max(gap1, gap2) / IV.nextUp(len);            /* a certain lower bound of the normalised gap */
    if (gap > bestGap) { bestGap = gap; bestAxis = a; }
    if (gap1 > 0 || gap2 > 0) return { verdict: 'SEPARATED', gap, axis: a };
    /* certain overlap on this axis: each max certainly exceeds the other's min */
    if (!(p.maxLo > q.minHi && q.maxLo > p.minHi)) allOverlap = false;
  }
  return allOverlap ? { verdict: 'INTERSECTING', gap: bestGap, axis: bestAxis } : { verdict: 'UNDECIDED', gap: bestGap, axis: bestAxis };
}
/* a point against a convex polygon: INSIDE / OUTSIDE / UNDECIDED, certified; margin = the smallest certain cross product */
function inside(pt, O) {
  let worstLo = Infinity, worstHi = Infinity;
  for (let i = 0; i < 6; i++) {
    const p1 = O[i], p2 = O[(i + 1) % 6];
    const ex = IV.sub(p2[0], p1[0]), ey = IV.sub(p2[1], p1[1]);
    const px = IV.sub(pt[0], p1[0]), py = IV.sub(pt[1], p1[1]);
    const cr = IV.sub(IV.mul(ex, py), IV.mul(ey, px));
    if (cr[0] < worstLo) worstLo = cr[0];
    if (cr[1] < worstHi) worstHi = cr[1];
  }
  if (worstLo >= 0) return { verdict: 'INSIDE', marginLo: worstLo };
  if (worstHi < 0) return { verdict: 'OUTSIDE', marginHi: worstHi };
  return { verdict: 'UNDECIDED', marginLo: worstLo, marginHi: worstHi };
}

/* decide(data): data.hexagons = [[cx, cy, angleDeg] as exact rationals], outer = {center, side, angleDeg} rationals */
function decide(data) {
  const t0 = Date.now();
  const ONE = [1, 1];
  const inner = data.hexagons.map((h) => vertices(encloseQ(h[0]), encloseQ(h[1]), ONE, encloseQ(h[2])));
  const outer = vertices(encloseQ(data.outer.center[0]), encloseQ(data.outer.center[1]), encloseQ(data.outer.side), encloseQ(data.outer.angleDeg));
  const pairs = [];
  for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) pairs.push(Object.assign({ i, j }, pair(inner[i], inner[j])));
  const verts = [];
  inner.forEach((V, i) => V.forEach((v, k) => verts.push(Object.assign({ hexagon: i, vertex: k }, inside(v, outer)))));
  const tally = (arr) => arr.reduce((t, x) => { t[x.verdict] = (t[x.verdict] || 0) + 1; return t; }, {});
  const pt = tally(pairs), vt = tally(verts);
  const minGap = pairs.length ? pairs.reduce((m, p) => (p.gap < m.gap ? p : m)) : { i: null, j: null, gap: Infinity };
  const minMargin = verts.filter((v) => v.verdict !== 'OUTSIDE').reduce((m, v) => (v.marginLo < m.marginLo ? v : m), { marginLo: Infinity });
  const widthSample = inner[0][0][0][1] - inner[0][0][0][0];
  const witnessed = (pt.SEPARATED || 0) === pairs.length && (vt.INSIDE || 0) === verts.length;
  return {
    hexagons: inner.length, pairs: pairs.length, vertices: verts.length,
    pairTally: pt, vertexTally: vt,
    witnessed, verdict: witnessed ? 'WITNESSED' : ((pt.INTERSECTING || vt.OUTSIDE) ? 'UNWITNESSED' : 'UNDECIDED'),
    closestPair: { i: minGap.i, j: minGap.j, gapAtLeast: minGap.gap },
    tightestVertex: { hexagon: minMargin.hexagon, vertex: minMargin.vertex, crossAtLeast: minMargin.marginLo },
    enclosureWidth: widthSample, score: data.outer.side,
    intersecting: pairs.filter((p) => p.verdict === 'INTERSECTING').map((p) => [p.i, p.j]),
    outside: verts.filter((v) => v.verdict === 'OUTSIDE').map((v) => [v.hexagon, v.vertex]),
    undecidedPairs: pairs.filter((p) => p.verdict === 'UNDECIDED').map((p) => [p.i, p.j]),
    undecidedVertices: verts.filter((v) => v.verdict === 'UNDECIDED').map((v) => [v.hexagon, v.vertex]),
    ms: Date.now() - t0,
  };
}

module.exports = { decide, vertices, pair, inside, encloseQ };
