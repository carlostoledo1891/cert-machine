/* bound.js — a certified UPPER bound for the sublevel measure over a whole
   BOX of root configurations, and the branch-and-bound that turns it into
   per-degree theorems.
   instruments/sublevel · cert-machine

   THE BOUND. For a box B = I_1 x ... x I_n of root intervals inside [-1,1],
   and any configuration r in B, every factor satisfies
   |x - r_i| >= dist(x, I_i), so |q_r(x)| >= g_B(x) := prod dist(x, I_i) and

       sup_{r in B} |{ x : |q_r(x)| < 1 }|  <=  |{ x : g_B(x) < 1 }| =: U(B).

   g_B is piecewise polynomial: zero on every I_i, and on each maximal region
   between/outside the intervals it is the product of (x - u_i) over intervals
   fully to the left and (l_i - x) over intervals fully to the right — a
   polynomial with rational coefficients, handled by the same certified Sturm
   machinery as measure.js. U(B) is computed as a true outward enclosure and
   the branch-and-bound uses its UPPER endpoint, so every pruning decision is
   conservative.

   THE THEOREM SHAPE. bnb(n, T) subdivides [-1,1]^n (ordered boxes r_1 <= ...
   <= r_n, mirror-reduced) until every leaf has U(B) < T. If it terminates,
   then EVERY monic degree-n polynomial with all roots in [-1,1] has
   |{|q| < 1}| < T — a theorem with an explicit certificate tree. With
   T < 2*sqrt(2) this decides the degree-n case of the conjecture of Tao
   (teorth/erdosproblems#179) that the supremum over all root-constrained
   monic polynomials — equivalently all rational-weight discrete measures —
   is 2*sqrt(2): for odd n the whole degree falls strictly below; for even n
   the champion (x^2-1)^{n/2} attains 2*sqrt(2) exactly, so T is taken just
   above it and the b&b certifies nothing in the degree exceeds it... which
   for even n requires the equality manifold to be handled separately and is
   NOT attempted here. This file's theorems are the odd degrees.

   MIT licensed. Part of cert-machine. */
'use strict';

const CM = require('#instruments/trigmin/certify-min.js');
const Q = require('#instruments/interval/rational.js');
const M = require('./measure.js');

const { squarefreePart, isolateAll, refineRoot } = CM;

const trim = (p) => { const r = p.slice(); while (r.length > 1 && r[r.length - 1] === 0n) r.pop(); return r; };
const derivPoly = (p) => { const r = []; for (let i = 1; i < p.length; i++) r.push(p[i] * BigInt(i)); return r.length ? r : [0n]; };

/* U(B): certified upper enclosure of |{x : prod dist(x, I_i) < 1}|.
   Intervals come as {l, u} with BigInt numerators over one denominator d. */
function boxSublevelUpper(intervals, d, opts) {
  const n = intervals.length;
  for (const I of intervals) if (I.l > I.u) throw new Error('bound: bad interval');
  /* walls: all interval endpoints, sorted and deduplicated (as BigInt/d) */
  const walls = [...new Set(intervals.flatMap(I => [I.l, I.u]).map(String))].map(BigInt).sort((a, b) => a < b ? -1 : 1);
  /* the sublevel set contains the hull piece of every I_i; outside the
     intervals it is bounded by roots of the per-region polynomial = 1.
     All of it lives in (-3, 3). */
  const lo3 = -3n * d, hi3 = 3n * d;
  const regions = [];
  let prev = lo3;
  for (const w of walls) { if (w > prev) regions.push([prev, w]); prev = w; }
  regions.push([prev, hi3]);

  /* segments of the sublevel set, as [lo enclosure, hi enclosure] with
     rational (Q) endpoints; interval interiors are inside by definition */
  const segs = [];
  for (const I of intervals) if (I.u > I.l)
    segs.push({ L: { lo: Q.R(I.l, d), hi: Q.R(I.l, d) }, R: { lo: Q.R(I.u, d), hi: Q.R(I.u, d) } });

  const width = (opts && opts.width) || Q.R(1n, 1n << 30n);
  for (const [a, b] of regions) {
    /* intervals fully left / right of this region; any interval COVERING the
       region makes g = 0 there (already counted as an interval segment) */
    const left = intervals.filter(I => I.u <= a), right = intervals.filter(I => I.l >= b);
    if (left.length + right.length < n) {
      /* some interval covers this region: it is inside the sublevel and its
         span is already among segs (regions are between walls, so a covering
         interval covers the whole region) */
      segs.push({ L: { lo: Q.R(a, d), hi: Q.R(a, d) }, R: { lo: Q.R(b, d), hi: Q.R(b, d) } });
      continue;
    }
    /* g(x) = prod_{left} (x - u_i) * prod_{right} (l_i - x): scale to integer
       coefficients over denominator d: G(x) = prod (d x - u_i) * prod (l_i - d x) */
    let G = [1n];
    for (const I of left) G = M.mulPoly(G, [-I.u, d]);
    for (const I of right) G = M.mulPoly(G, [I.l, -d]);
    G = trim(G);
    const dN = d ** BigInt(n);
    const P = trim(G.map((c, i) => i === 0 ? c - dN : c));     /* g - 1 = 0 */
    const aQ = Q.R(a, d), bQ = Q.R(b, d);
    const sf = squarefreePart(P);
    const iso = isolateAll(sf, aQ, bQ);
    const sfd = derivPoly(sf);
    const enc = iso.intervals.map(([l, r]) => { const e = refineRoot(sf, sfd, null, l, r, width); return { lo: e[0], hi: e[1] }; })
      .sort((x, y) => Q.cmp(x.lo, y.lo));
    /* decide sub-gaps of this region exactly at rational test points */
    const pts = [{ lo: aQ, hi: aQ }, ...enc, { lo: bQ, hi: bQ }];
    for (let g2 = 0; g2 + 1 < pts.length; g2++) {
      const Lp = pts[g2], Rp = pts[g2 + 1];
      const t = Q.div(Q.add(Lp.hi, Rp.lo), Q.R(2n));
      if (Q.cmp(Lp.hi, Rp.lo) >= 0) continue;
      const val = M.evalQ(G, t);
      const absNum = val.n < 0n ? -val.n : val.n;
      if (absNum < dN * val.d) segs.push({ L: Lp, R: Rp });
    }
  }
  /* merge overlapping/adjacent segments (outer measure: sort by left, sweep) */
  segs.sort((x, y) => Q.cmp(x.L.lo, y.L.lo));
  let total = Q.R(0n);
  let curL = null, curR = null;
  const flush = () => { if (curL) total = Q.add(total, Q.sub(curR.hi, curL.lo)); };
  for (const s of segs) {
    if (!curL) { curL = s.L; curR = s.R; continue; }
    if (Q.cmp(s.L.lo, curR.hi) <= 0) { if (Q.cmp(s.R.hi, curR.hi) > 0) curR = s.R; }
    else { flush(); curL = s.L; curR = s.R; }
  }
  flush();
  return { hi: total, hiD: Q.toDouble(total) };
}

/* branch and bound over ordered root boxes in [-1,1]^n: certifies that EVERY
   configuration has sublevel measure < T (T rational). Returns the leaf count
   or throws if maxBoxes is exhausted. Symmetry: only ordered boxes with
   sum of centers >= 0 are explored; the mirror r -> -r preserves the measure. */
function bnb(n, T, opts) {
  const depthCap = (opts && opts.maxDepth) || 9;
  const maxBoxes = (opts && opts.maxBoxes) || 2000000;
  let leaves = 0, explored = 0, maxDepthSeen = 0;
  /* box: per-coordinate [l, u] as BigInt over denominator d = 2^depth */
  const rec = (ls, us, d, depth) => {
    if (++explored > maxBoxes) throw new Error('bnb: box budget exhausted');
    if (depth > maxDepthSeen) maxDepthSeen = depth;
    /* ordered-box pruning: box empty if some l_i > u_{i+1} */
    for (let i = 0; i + 1 < n; i++) if (ls[i] > us[i + 1]) return;
    /* mirror pruning: skip boxes whose every configuration has negative sum
       (the mirrored box is explored instead) */
    if (ls.reduce((s, v) => s + v, 0n) + us.reduce((s, v) => s + v, 0n) < 0n) {
      let strict = us.reduce((s, v) => s + v, 0n) < 0n;
      if (strict) return;
    }
    const U = boxSublevelUpper(ls.map((l, i) => ({ l, u: us[i] })), d, opts);
    if (Q.cmp(U.hi, T) < 0) { leaves++; return; }
    if (depth >= depthCap) throw new Error('bnb: depth cap hit with U = ' + U.hiD.toFixed(6)
      + ' at box ' + ls.map((l, i) => '[' + l + ',' + us[i] + ']/' + d).join(' '));
    /* split the widest coordinate */
    let wi = 0, ww = -1n;
    for (let i = 0; i < n; i++) { const w = us[i] - ls[i]; if (w > ww) { ww = w; wi = i; } }
    const l2 = ls.map(v => 2n * v), u2 = us.map(v => 2n * v), m = ls[wi] + us[wi];
    const A1 = l2.slice(), B1 = u2.slice(); B1[wi] = m;
    const A2 = l2.slice(), B2 = u2.slice(); A2[wi] = m;
    rec(A1, B1, 2n * d, depth + 1);
    rec(A2, B2, 2n * d, depth + 1);
  };
  rec(new Array(n).fill(-1n), new Array(n).fill(1n), 1n, 0);
  return { leaves, explored, maxDepthSeen };
}

module.exports = { boxSublevelUpper, bnb };
