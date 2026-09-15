/* instruments/breaking/decide.js — sixteen thousand breaking waves, decided
   in exact arithmetic.

   THE OBJECT. corpus/blacksea-breaking/blacksea_data.csv: one row per breaking
   event (16,369), every number the shortest decimal that round-trips the
   double the record holds. Each literal is read as the rational its digits
   denote and every quantity below is a rational function of them — a ratio,
   a comparison with a stated constant, an order statistic, a rank
   correlation — computed in BigInt rationals with no float anywhere, except
   where π enters (cm/cp), and there the value is an ENCLOSURE from the
   certified π of instruments/interval/transcendental.js.

   WHAT IS DECIDED, per event and in total:
     · Duncan's angle band: theta ∈ [10, 14.7] degrees — INSIDE / ON / OUTSIDE.
     · Duncan's aspect ratio: Ab_max / LD81² against 0.11 — ABOVE / EQUAL / BELOW,
       and the distance as a factor.
     · the three self-similarity ratios a = cm²/(g·Lb), b = Ab/Lb², c = Ab/LD81²
       with Lb = Pb_max/2 and g = 9.81 exactly as the scripts define them: their
       order statistics (the k-th smallest, k = ⌈p·n⌉, no interpolation — a
       value that occurs in the table, never an average of two) and the spread
       factors q75/q25 and q95/q05 as exact rationals.
     · rank correlations between speed and each geometric property, and
       between geometric properties: Spearman's ρ = Pearson's r on average
       ranks (ties get the mean rank; doubled ranks are integers, so the whole
       computation is in BigInt), returned as an exact r² and an enclosure
       of r by integer square roots.
   Nothing here is a fit: the scripts' RANSAC and least-squares lines are float
   procedures and are reported as such by the page, not re-derived. */
'use strict';
const path = require('path');
const Q = require(path.join(__dirname, '..', 'interval', 'rational.js'));
const L = require('./lib.js');

const r = (s) => L.parseDecimal(s);
const half = Q.R(1n, 2n);

/* ---- order statistics of exact rationals ---- */
function sortQ(xs) { return xs.slice().sort((a, b) => Q.cmp(a, b)); }
function orderStat(sorted, p) {                 /* the k-th smallest, k = ceil(p·n), p in (0,1] */
  const n = sorted.length; const k = Math.max(1, Math.ceil(p * n));
  return sorted[k - 1];
}
function quantiles(xs) {
  const s = sortQ(xs);
  const q = {}; for (const p of [0.05, 0.25, 0.5, 0.75, 0.95]) q[String(p)] = orderStat(s, p);
  return { q, n: s.length, min: s[0], max: s[s.length - 1], spreadIQ: Q.div(q['0.75'], q['0.25']), spread90: Q.div(q['0.95'], q['0.05']) };
}
/* order statistics of enclosures [lo, hi]: the k-th smallest lies in [k-th smallest lo, k-th smallest hi] */
function quantilesIv(pairs) {
  const los = sortQ(pairs.map((p) => p[0])), his = sortQ(pairs.map((p) => p[1]));
  const q = {}; for (const p of [0.05, 0.25, 0.5, 0.75, 0.95]) q[String(p)] = [orderStat(los, p), orderStat(his, p)];
  return { q, n: pairs.length };
}

/* ---- average ranks, doubled so they are integers ---- */
function doubledRanks(xs) {
  const idx = xs.map((x, i) => i).sort((i, j) => Q.cmp(xs[i], xs[j]));
  const out = new Array(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i; while (j + 1 < idx.length && Q.cmp(xs[idx[j + 1]], xs[idx[i]]) === 0) j++;
    const two = BigInt(i + 1 + j + 1);                     /* 2 × mean of ranks i+1 … j+1 */
    for (let k = i; k <= j; k++) out[idx[k]] = two;
    i = j + 1;
  }
  return out;
}
/* Pearson r on integer sequences: exact r² and an enclosure of r to 12 decimals */
function pearsonInt(x, y) {
  const n = BigInt(x.length);
  let sx = 0n, sy = 0n, sxx = 0n, syy = 0n, sxy = 0n;
  for (let i = 0; i < x.length; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; syy += y[i] * y[i]; sxy += x[i] * y[i]; }
  const cov = n * sxy - sx * sy, vx = n * sxx - sx * sx, vy = n * syy - sy * sy;
  if (vx === 0n || vy === 0n) return null;
  const r2 = Q.R(cov * cov, vx * vy);
  return { r2, r: sqrtEnclosure(r2, cov < 0n), sign: cov < 0n ? -1 : cov > 0n ? 1 : 0 };
}
/* Pearson r on rationals: multiply out to a common denominator per series */
function pearsonQ(xs, ys) {
  const lcmOf = (qs) => qs.reduce((l, q) => { const g = gcd(l, q.d); return (l / g) * q.d; }, 1n);
  const dx = lcmOf(xs), dy = lcmOf(ys);
  return pearsonInt(xs.map((q) => q.n * (dx / q.d)), ys.map((q) => q.n * (dy / q.d)));
}
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }
const isqrt = (v) => { if (v < 2n) return v; let x = 1n << BigInt(Math.ceil(v.toString(2).length / 2)); for (;;) { const y = (x + v / x) >> 1n; if (y >= x) return x; x = y; } };
/* sqrt of a rational as [lo, hi] to 12 decimals, with the sign */
function sqrtEnclosure(q, negative) {
  const S = 10n ** 12n;
  const t = (q.n * S * S) / q.d;                          /* floor(q·10^24) */
  const lo = isqrt(t), hi = lo + 1n;                      /* lo² ≤ t ≤ q·10^24 < (lo+1)², so √q·10^12 ∈ [lo, lo+1] */
  const a = Q.R(lo, S), b = Q.R(hi, S);
  return negative ? [Q.neg(b), Q.neg(a)] : [a, b];
}

/* ---- the deciders over the table ---- */
function decide(T, refs, PI) {
  const n = T.rows.length;
  const g = r(refs.g.value), aLo = r(refs.duncanAngle.lo), aHi = r(refs.duncanAngle.hi), aspect = r(refs.duncanAspect.value);
  const col = (c) => T.rows.map((row) => row[c]);
  const cm = col('cm'), Ab = col('Ab_max'), Pb = col('Pb_max'), LD = col('LD81'), th = col('theta'), Dz = col('Dz_max'), DT = col('DT'), fp = col('sv_fp');
  const Lb = Pb.map((p) => Q.mul(p, half));
  /* Duncan's angle band */
  const angle = { inside: 0, on: 0, outside: 0, below: 0, above: 0 };
  for (const t of th) {
    const lo = Q.cmp(t, aLo), hi = Q.cmp(t, aHi);
    if (lo === 0 || hi === 0) angle.on++;
    else if (lo > 0 && hi < 0) angle.inside++;
    else { angle.outside++; if (lo < 0) angle.below++; else angle.above++; }
  }
  /* Duncan's aspect ratio */
  const D = Ab.map((a, i) => Q.div(a, Q.mul(LD[i], LD[i])));
  const asp = { above: 0, equal: 0, below: 0, within25pc: 0, within50pc: 0 };
  const lo25 = Q.mul(aspect, Q.R(3n, 4n)), hi25 = Q.mul(aspect, Q.R(5n, 4n)), lo50 = Q.mul(aspect, half), hi50 = Q.mul(aspect, Q.R(3n, 2n));
  for (const d of D) {
    const c = Q.cmp(d, aspect); if (c > 0) asp.above++; else if (c < 0) asp.below++; else asp.equal++;
    if (Q.cmp(d, lo25) >= 0 && Q.cmp(d, hi25) <= 0) asp.within25pc++;
    if (Q.cmp(d, lo50) >= 0 && Q.cmp(d, hi50) <= 0) asp.within50pc++;
  }
  const Dq = quantiles(D);
  asp.medianOverDuncan = Q.div(Dq.q['0.5'], aspect);
  /* self-similarity ratios */
  const a = cm.map((c, i) => Q.div(Q.mul(c, c), Q.mul(g, Lb[i])));
  const b = Ab.map((x, i) => Q.div(x, Q.mul(Lb[i], Lb[i])));
  const ratios = { a: quantiles(a), b: quantiles(b), c: Dq };
  /* cm / cp = 2π·fp·cm/g, π enclosed */
  const piLo = Q.fromDouble(PI[0]), piHi = Q.fromDouble(PI[1]);
  const twoOverG = Q.div(Q.R(2n), g);
  const cmcp = cm.map((c, i) => { const k = Q.mul(Q.mul(twoOverG, fp[i]), c); return [Q.mul(k, piLo), Q.mul(k, piHi)]; });
  const cmcpQ = quantilesIv(cmcp);
  let halfCp = 0;                                            /* events certainly faster than half the peak phase speed */
  for (const p of cmcp) if (Q.cmp(p[0], half) > 0) halfCp++;
  /* rank correlations */
  const series = { cm, Lb, Ab_max: Ab, Dz_max: Dz, DT, LD81: LD, theta: th };
  const ranks = {}; for (const k of Object.keys(series)) ranks[k] = doubledRanks(series[k]);
  const corr = {};
  for (const [x, y] of refs.speedGeometry.pairs.concat(refs.geometryGeometry.pairs)) corr[x + '~' + y] = { spearman: pearsonInt(ranks[x], ranks[y]), pearson: pearsonQ(series[x], series[y]) };
  /* per-record facts */
  const recs = {};
  for (const row of T.rows) { const k = row.Rec; if (!recs[k]) recs[k] = { n: 0, wnd: row.wnd, Hs: row.Hs, fp: row.sv_fp, constant: true }; recs[k].n++; if (Q.cmp(recs[k].wnd, row.wnd) || Q.cmp(recs[k].Hs, row.Hs) || Q.cmp(recs[k].fp, row.sv_fp)) recs[k].constant = false; }
  return { n, angle, aspect: asp, ratios, cmcp: cmcpQ, fasterThanHalfCp: halfCp, corr, records: recs, distinct: { cm: new Set(cm.map(Q.toString)).size, theta: new Set(th.map(Q.toString)).size, DT: new Set(DT.map(Q.toString)).size } };
}

module.exports = { decide, quantiles, quantilesIv, orderStat, sortQ, doubledRanks, pearsonInt, pearsonQ, sqrtEnclosure, isqrt };
