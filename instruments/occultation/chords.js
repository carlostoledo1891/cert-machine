/* chords.js — the sizes an occultation allows, from the chords alone.
 *
 * THE ONE FACT THAT MAKES THIS ONE-DIMENSIONAL. Occultation chords are
 * parallel: the shadow sweeps in one direction and every station cuts the
 * silhouette along that direction. Put the chord direction along x and let y be
 * the cross-track coordinate. A convex silhouette K has slices
 * [L(y), R(y)] with R concave and L convex, so the CHORD LENGTH
 *
 *     w(y) = R(y) - L(y)
 *
 * is CONCAVE on the body's support and zero outside it. Every measured chord is
 * a value of w, every negative station is a y where w = 0, and the area of the
 * silhouette is INT w. So the whole question — what sizes does this occultation
 * allow — is the curveset envelope again, with `concave` where that one had
 * `monotone with a slope band`, and the answer is closed form.
 *
 * WHAT IS ASSUMED, AND IT IS ONLY THIS: the silhouette is convex. That is
 * weaker than the ellipse every occultation paper fits, and it is the reason a
 * single ingress and a single egress per station is the whole light curve.
 *
 * THE TWO BOUNDS.
 *
 *   LOWER. w is concave between the outermost positive chords and at least
 *   lo_i at each of them, so w is at least the CONCAVE HULL of the points
 *   (y_i, lo_i) there, and at least zero outside. Nothing else is needed — the
 *   negatives play no part in the lower bound at all.
 *
 *   UPPER. Concavity read backwards. For y beyond two samples y_i < y_j,
 *       w(y) <= w(y_j) + [w(y_j) - w(y_i)] (y - y_j)/(y_j - y_i)
 *   and the coefficient of w(y_i) is negative, so the bound is taken with
 *   hi_j and lo_i — an upper value at the near sample and a LOWER value at the
 *   far one. The envelope is the minimum of those lines over every ordered
 *   pair, clipped at zero and at the nearest negative station on each side.
 *
 * THE ASYMMETRY IS THE POINT AND IT IS STRUCTURAL: the lower bound is bought by
 * the positive chords, the upper bound by the stations that saw NOTHING.
 *
 * Everything is exact. The published numbers are decimals, so they are exact
 * rationals, and every area below is an exact rational too — there is no
 * optimiser here and nothing to converge.
 */
'use strict';
const Q = require('../interval/rational.js');

/* a decimal string or number to an exact rational */
function q(x) {
  const s = String(x).trim();
  const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m) throw new Error(`not a decimal: ${s}`);
  const sign = m[1] === '-' ? -1n : 1n;
  const int = m[2] || '0', frac = m[3] || '';
  return Q.R(sign * BigInt(int + frac), 10n ** BigInt(frac.length));
}
const qs = a => Q.toString(a);
const qn = a => Q.toDouble(a);

/* ---- the problem ---------------------------------------------------------- */
/* chords: [{y, len, err}] measured; negatives: [y]; all decimals or numbers */
function prepare(chords, negatives, opt = {}) {
  const nsig = q(opt.nsig === undefined ? 1 : opt.nsig);
  const pts = chords.map(c => {
    const y = q(c.y), len = q(c.len), e = Q.mul(nsig, q(c.err || 0));
    let lo = Q.sub(len, e);
    if (Q.sign(lo) < 0) lo = Q.ZERO;
    return { y, len, lo, hi: Q.add(len, e), site: c.site };
  }).sort((a, b) => Q.cmp(a.y, b.y));
  const negs = negatives.map(q).sort((a, b) => Q.cmp(a, b));
  /* the nearest negative on each side of the positive chords */
  const yLo = pts[0].y, yHi = pts[pts.length - 1].y;
  let capLo = null, capHi = null;
  for (const n of negs) {
    if (Q.cmp(n, yLo) < 0 && (capLo === null || Q.cmp(n, capLo) > 0)) capLo = n;
    if (Q.cmp(n, yHi) > 0 && (capHi === null || Q.cmp(n, capHi) < 0)) capHi = n;
  }
  return { pts, negs, capLo, capHi };
}

/* ---- piecewise-linear helpers, exact -------------------------------------- */
/* a line through (x1,y1),(x2,y2) evaluated at x */
function lineAt(x1, y1, x2, y2, x) {
  const m = Q.div(Q.sub(y2, y1), Q.sub(x2, x1));
  return Q.add(y1, Q.mul(m, Q.sub(x, x1)));
}
/* area under the polyline given as [[x,y],...] with x increasing */
function areaUnder(poly) {
  let a = Q.ZERO;
  for (let i = 0; i + 1 < poly.length; i++) {
    const dx = Q.sub(poly[i + 1][0], poly[i][0]);
    const avg = Q.div(Q.add(poly[i][1], poly[i + 1][1]), q(2));
    a = Q.add(a, Q.mul(dx, avg));
  }
  return a;
}

/* ---- LOWER: the concave hull of the lower values -------------------------- */
/* upper convex hull of (y_i, lo_i) — the smallest concave function through
   points that are each at least lo_i. Monotone chain, exact comparisons. */
function concaveHull(points) {
  const P = points.slice().sort((a, b) => Q.cmp(a[0], b[0]));
  const H = [];
  for (const p of P) {
    while (H.length >= 2) {
      const a = H[H.length - 2], b = H[H.length - 1];
      /* keep b only if a->b->p turns clockwise (concave from above) */
      const cross = Q.sub(
        Q.mul(Q.sub(b[0], a[0]), Q.sub(p[1], a[1])),
        Q.mul(Q.sub(b[1], a[1]), Q.sub(p[0], a[0])));
      if (Q.sign(cross) < 0) break;         /* strictly clockwise: keep */
      H.pop();
    }
    H.push(p);
  }
  return H;
}

function lowerBound(C) {
  const hull = concaveHull(C.pts.map(p => [p.y, p.lo]));
  return { poly: hull, area: areaUnder(hull) };
}

/* ---- UPPER: the minimum of the backward-concavity lines ------------------- */
/* every ordered pair (near, far) gives a line valid BEYOND `near`:
     w(y) <= hi_near + (hi_near - lo_far) (y - y_near)/(y_near - y_far)      */
function upperLines(C) {
  /* ONLY THE POSITIVE CHORDS MAY CARRY A CONCAVITY CONSTRAINT.
   *
   * w is concave ON ITS SUPPORT and zero outside it, which is not the same as
   * concave on the domain — a function that is zero on two rays and concave in
   * between is not concave anywhere except trivially. So a negative station is
   * a point where w VANISHES, not a sample through which concavity may be
   * applied. Treating it as an ordinary sample of value 0 was tried here and is
   * unsound: on a triangular silhouette it produced a ceiling of 7529 against a
   * true area of 9000, because the far cap dragged the envelope down through
   * the real body. The negatives clip the DOMAIN of integration and nothing
   * else, and that is already the whole of what they buy.
   */
  const P = C.pts;
  const out = [];
  for (let i = 0; i < P.length; i++) for (let j = 0; j < P.length; j++) {
    if (i === j) continue;
    const near = P[i], far = P[j];
    if (Q.cmp(near.y, far.y) === 0) continue;
    const m = Q.div(Q.sub(near.hi, far.lo), Q.sub(near.y, far.y));
    /* valid for y on the far side of `near` from `far` */
    out.push({ side: Q.cmp(near.y, far.y) > 0 ? +1 : -1, yA: near.y, c: near.hi, m });
  }
  return out;
}

/* evaluate the upper envelope at y (exact), clipped at 0 and at the negatives */
function upperAt(C, lines, y) {
  if (C.capLo !== null && Q.cmp(y, C.capLo) <= 0) return Q.ZERO;
  if (C.capHi !== null && Q.cmp(y, C.capHi) >= 0) return Q.ZERO;
  let best = null;
  for (const L of lines) {
    const beyond = L.side > 0 ? Q.cmp(y, L.yA) >= 0 : Q.cmp(y, L.yA) <= 0;
    if (!beyond) continue;
    const v = Q.add(L.c, Q.mul(L.m, Q.sub(y, L.yA)));
    if (best === null || Q.cmp(v, best) < 0) best = v;
  }
  if (best === null) return null;          /* unconstrained here */
  return Q.sign(best) < 0 ? Q.ZERO : best;
}

/* The envelope is piecewise linear; its breakpoints can only be the samples,
   the negative caps, pairwise line intersections and the zero crossings. Collect
   them all, keep those inside the domain, and integrate exactly. */
function upperBound(C) {
  if (C.capLo === null || C.capHi === null)
    throw new Error('upperBound: needs a negative station on each side (see the log)');
  const lines = upperLines(C);
  const xs = [C.capLo, C.capHi, ...C.pts.map(p => p.y)];
  for (let a = 0; a < lines.length; a++) for (let b = a + 1; b < lines.length; b++) {
    const d = Q.sub(lines[a].m, lines[b].m);
    if (Q.isZero(d)) continue;
    const ca = Q.sub(lines[a].c, Q.mul(lines[a].m, lines[a].yA));
    const cb = Q.sub(lines[b].c, Q.mul(lines[b].m, lines[b].yA));
    xs.push(Q.div(Q.sub(cb, ca), d));
  }
  for (const L of lines) {                  /* zero crossings */
    if (Q.isZero(L.m)) continue;
    xs.push(Q.sub(L.yA, Q.div(L.c, L.m)));
  }
  const inside = xs.filter(x => Q.cmp(x, C.capLo) >= 0 && Q.cmp(x, C.capHi) <= 0);
  inside.sort((a, b) => Q.cmp(a, b));
  const brk = [];
  for (const x of inside) if (!brk.length || Q.cmp(x, brk[brk.length - 1]) !== 0) brk.push(x);

  /* THE ENVELOPE IS DISCONTINUOUS AT EVERY SAMPLE, and integrating it as a
     polyline is wrong. The lines anchored at a sample are valid only up to that
     sample, so they drop out the moment y passes it and the bound jumps up to
     whatever the outside pairs allow. On a circle that error understated the
     ceiling by 16% and made it fall when chords were REMOVED. Between two
     breakpoints U is affine, so the midpoint rule is exact and blind to the
     jumps, which are a set of measure zero. */
  const half = q(2);
  let area = Q.ZERO;
  const poly = [];
  for (let i = 0; i + 1 < brk.length; i++) {
    const a = brk[i], b = brk[i + 1];
    const wdt = Q.sub(b, a);
    if (Q.isZero(wdt)) continue;
    const mid = Q.div(Q.add(a, b), half);
    const um = upperAt(C, lines, mid);
    if (um === null) throw new Error('upperBound: unconstrained interval');
    area = Q.add(area, Q.mul(wdt, um));
    /* for drawing: the affine piece, recovered from its midpoint and slope */
    const q1 = upperAt(C, lines, Q.div(Q.add(a, mid), half));
    const m = Q.div(Q.sub(um, q1), Q.sub(mid, Q.div(Q.add(a, mid), half)));
    poly.push([a, Q.add(um, Q.mul(m, Q.sub(a, mid)))], [b, Q.add(um, Q.mul(m, Q.sub(b, mid)))]);
  }
  return { poly, brk, area };
}

/* ---- the middle rung: join the dots -------------------------------------- */
/* the body whose chord-length function is the linear interpolation of the
   measured lengths, falling to zero at the nearest negative station. It is
   admissible whenever that polyline is concave; when it is not, the data
   themselves are inconsistent with a convex body at zero error, which is worth
   knowing and is reported rather than smoothed over. */
function joinTheDots(C) {
  const poly = [];
  if (C.capLo !== null) poly.push([C.capLo, Q.ZERO]);
  for (const p of C.pts) poly.push([p.y, p.len]);
  if (C.capHi !== null) poly.push([C.capHi, Q.ZERO]);
  let concave = true, worst = null;
  for (let i = 1; i + 1 < poly.length; i++) {
    const a = poly[i - 1], b = poly[i], c = poly[i + 1];
    const cross = Q.sub(
      Q.mul(Q.sub(b[0], a[0]), Q.sub(c[1], a[1])),
      Q.mul(Q.sub(b[1], a[1]), Q.sub(c[0], a[0])));
    if (Q.sign(cross) > 0) { concave = false; if (worst === null) worst = i; }
  }
  return { poly, area: areaUnder(poly), concave, kinkAt: worst };
}

/* ---- readouts ------------------------------------------------------------- */
/* the area-equivalent diameter, the quantity occultation papers report */
const equivDiameter = area => 2 * Math.sqrt(qn(area) / Math.PI);
const ellipseArea = (a, b) => Math.PI * a * b;

module.exports = {
  q, qs, qn, prepare, lineAt, areaUnder, concaveHull,
  lowerBound, upperBound, upperLines, upperAt, joinTheDots,
  equivDiameter, ellipseArea
};
