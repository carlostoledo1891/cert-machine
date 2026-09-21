/* instruments/breaking/paper.js — the paper's printed numbers, read against the
   table in exact arithmetic.

   Guimarães, Stringari, Filipot, Leckler, Benetazzo, Chapron — Geometry of
   Breaking Waves Under Natural Sea Conditions, GRL, 2026-09-16 — is the paper
   the Zenodo record waited eight months for. Its printed numbers are
   transcribed in claims.json `paper`; this file computes each one from the
   pinned table with the definitions the authors' own scripts use, and says of
   every printed value whether it is the rounding of the exact one.

   The forms, from the scripts (plot_linear_relation.py, test_self_similarity.py):
     · a fit "y = a · x²/g" is curve_fit on objective(x, a) = a·x²/g with no
       intercept: least squares through the origin on the regressor x²/g, so
       a = g · Σ(x² y) / Σ(x⁴) — an exact rational of the literals.
     · a fit "y = k · x" (Ab on L², eA on eB, Ae on Ab) is the same through
       the origin: k = Σ(x y) / Σ(x²).
     · the r printed beside a Figure-4 fit is stats.linregress(x**2, y): the
       Pearson correlation of cb² with Lb (not of cb with Lb). Both are given.
     · the self-similar subset is {ratio ≥ mean + 2·sd} with pandas' sample sd
       (ddof = 1) — the sd needs a square root, so the threshold is an
       ENCLOSURE and an event is certainly in, certainly out, or (counted
       separately) too close to say.
     · Figure 2d's "peaked at 0.46" is the mode of numpy's Freedman–Diaconis
       histogram: width 2·IQR·n^(−1/3) with numpy's linear-interpolated IQR,
       n^(1/3) enclosed by integer cube roots, the bin count ⌈range/width⌉
       decided only when both ends of the enclosure agree, then exact bins.
   Everything else — Table 1 row by row, the range of θ, the mean and sd of
   the aspect ratio, the Pearson correlations — is rational arithmetic on the
   literals, with square roots enclosed to twelve decimals.

   Also here: the STRATIFIED analysis the paper's §5 calls for and leaves
   undone — the same fits and fractions per stereo record, with each record's
   printed Hs, Tp, U10 and its wave age beside them. */
'use strict';
const path = require('path');
const Q = require(path.join(__dirname, '..', 'interval', 'rational.js'));
const L = require('./lib.js');
const D = require('./decide.js');
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));

const r = (s) => L.parseDecimal(s);
const B = (x) => BigInt(x);
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; };

/* ---- rationals to integers on one scale ---- */
function scaleOf(qs) { return qs.reduce((l, q) => { const g = gcd(l, q.d); return (l / g) * q.d; }, 1n); }
function ints(qs, S) { return qs.map((q) => q.n * (S / q.d)); }

/* least squares through the origin: y = k·x, k = Σxy/Σx² — exact */
function slopeThroughOrigin(xs, ys) {
  const Sx = scaleOf(xs), Sy = scaleOf(ys);
  const X = ints(xs, Sx), Y = ints(ys, Sy);
  let sxy = 0n, sxx = 0n;
  for (let i = 0; i < X.length; i++) { sxy += X[i] * Y[i]; sxx += X[i] * X[i]; }
  if (sxx === 0n) return null;
  return Q.R(sxy * Sx, sxx * Sy);                       /* (Σxy/(SxSy)) / (Σx²/Sx²) */
}
/* mean and variance of RATIOS — enclosed, not exact. A ratio like Ab/L² has a
   denominator of its own, and the exact mean of 16,369 of them is a rational
   whose denominator is their least common multiple: astronomically large and
   useless. So each ratio is first enclosed by two integers at scale 10^30
   (floor and ceiling), the sums are integer sums, and mean and variance come
   out as enclosures 10^-30 wide — decisive for any printed rounding. */
const FIX = 10n ** 30n;
const fixLo = (q) => { const t = (q.n * FIX) / q.d; return (q.n < 0n && t * q.d !== q.n * FIX) ? t - 1n : t; };   /* floor */
const fixHi = (q) => { const t = fixLo(q); return t * q.d === q.n * FIX ? t : t + 1n; };                          /* ceil */
function moments(xs) {
  const n = B(xs.length);
  let sLo = 0n, sHi = 0n, ssLo = 0n, ssHi = 0n;
  for (const x of xs) {
    const lo = fixLo(x), hi = fixHi(x);
    sLo += lo; sHi += hi;
    /* x² over [lo, hi]: both ends' squares, the min and max (handles a sign change) */
    const a = lo * lo, b = hi * hi;
    if (lo <= 0n && hi >= 0n) { ssLo += 0n; ssHi += (a > b ? a : b); } else { ssLo += (a < b ? a : b); ssHi += (a > b ? a : b); }
  }
  const mean = [Q.R(sLo, n * FIX), Q.R(sHi, n * FIX)];
  /* n·Σx² − (Σx)²: outward */
  const sq = (lo, hi) => { const a = lo * lo, b = hi * hi; return (lo <= 0n && hi >= 0n) ? [0n, a > b ? a : b] : [a < b ? a : b, a > b ? a : b]; };
  const s2 = sq(sLo, sHi);
  const numLo = n * ssLo - s2[1], numHi = n * ssHi - s2[0];
  const clamp = (v) => (v < 0n ? 0n : v);
  return {
    mean,
    varPop: [Q.R(clamp(numLo), n * n * FIX * FIX), Q.R(clamp(numHi), n * n * FIX * FIX)],
    varSample: [Q.R(clamp(numLo), n * (n - 1n) * FIX * FIX), Q.R(clamp(numHi), n * (n - 1n) * FIX * FIX)],
    n: xs.length,
  };
}
/* mean + 2·sd as an enclosure, sd by integer square roots of the variance's ends */
function tailThreshold(xs, ddof) {
  const m = moments(xs);
  const v = ddof === 0 ? m.varPop : m.varSample;
  const sd = [D.sqrtEnclosure(v[0], false)[0], D.sqrtEnclosure(v[1], false)[1]];
  return { mean: m.mean, sd, lo: Q.add(m.mean[0], Q.mul(Q.R(2n), sd[0])), hi: Q.add(m.mean[1], Q.mul(Q.R(2n), sd[1])) };
}
/* events certainly at or above the enclosed threshold, certainly below, and undecided */
function splitAtThreshold(xs, t) {
  const idx = { above: [], below: [], undecided: [] };
  xs.forEach((x, i) => { if (Q.cmp(x, t.hi) >= 0) idx.above.push(i); else if (Q.cmp(x, t.lo) < 0) idx.below.push(i); else idx.undecided.push(i); });
  return idx;
}
/* does the exact value round (half away from zero) to the printed literal? */
function roundsTo(exact, printed) {
  const p = r(printed);
  const places = (String(printed).split('.')[1] || '').length;
  const halfUlp = Q.R(1n, 2n * 10n ** B(places));
  const diff = Q.abs(Q.sub(exact, p));
  const c = Q.cmp(diff, halfUlp);
  if (c < 0) return 'REPRODUCED';
  if (c === 0) return 'ON_THE_BOUNDARY';
  /* not the rounding — is it the truncation? floor(exact · 10^places) / 10^places */
  const scale = 10n ** B(places);
  const t = Q.sign(exact) >= 0 ? Q.R((exact.n * scale) / exact.d, scale) : null;
  return (t && Q.cmp(t, p) === 0) ? 'TRUNCATION' : 'NOT_THE_TABLES';
}
/* the same for an enclosure [lo, hi]: both ends must round to the literal */
function roundsToIv(iv, printed) {
  const a = roundsTo(iv[0], printed), b = roundsTo(iv[1], printed);
  return a === b ? a : 'UNDECIDED_AT_THIS_WIDTH';
}
/* numpy's linear-interpolated percentile on a sorted list of rationals */
function percentileLinear(sorted, pct) {
  const n = sorted.length;
  const h = Q.mul(Q.R(B(n - 1)), Q.R(B(pct), 100n));
  const lo = Number(h.n / h.d);                          /* floor, h ≥ 0 */
  const frac = Q.sub(h, Q.R(B(lo)));
  if (lo + 1 >= n) return sorted[n - 1];
  return Q.add(sorted[lo], Q.mul(frac, Q.sub(sorted[lo + 1], sorted[lo])));
}
/* n^(1/3) enclosed to 12 decimals by integer cube roots */
function cbrtEnclosure(n) {
  const S = 10n ** 12n;
  const v = B(n) * S * S * S;
  let x = B(Math.floor(Math.cbrt(n) * 1e12));
  while (x * x * x > v) x--;
  while ((x + 1n) * (x + 1n) * (x + 1n) <= v) x++;
  return [Q.R(x, S), Q.R(x + 1n, S)];
}
/* numpy.histogram(x, bins='fd'): the mode bin, decided when the bin count is */
function fdMode(xs) {
  const s = D.sortQ(xs), n = s.length;
  const iqr = Q.sub(percentileLinear(s, 75), percentileLinear(s, 25));
  const cb = cbrtEnclosure(n);
  const range = Q.sub(s[n - 1], s[0]);
  /* nbins = ceil(range / (2·IQR·n^(−1/3))) = ceil(range · n^(1/3) / (2·IQR)) */
  const ratio = [Q.div(Q.mul(range, cb[0]), Q.mul(Q.R(2n), iqr)), Q.div(Q.mul(range, cb[1]), Q.mul(Q.R(2n), iqr))];
  const ceilQ = (q) => { const f = q.n / q.d; return (f * q.d === q.n) ? f : f + 1n; };
  const nb = [ceilQ(ratio[0]), ceilQ(ratio[1])];
  if (nb[0] !== nb[1]) return { decided: false, nbins: [Number(nb[0]), Number(nb[1])], iqr };
  const nbins = Number(nb[0]);
  const width = Q.div(range, Q.R(B(nbins)));
  const counts = new Array(nbins).fill(0);
  for (const x of s) {
    const t = Q.div(Q.sub(x, s[0]), width);
    let i = Number(t.n / t.d); if (i >= nbins) i = nbins - 1;   /* numpy: the last bin is closed */
    counts[i]++;
  }
  let best = 0; for (let i = 1; i < nbins; i++) if (counts[i] > counts[best]) best = i;
  const ties = counts.filter((c) => c === counts[best]).length;
  const lo = Q.add(s[0], Q.mul(width, Q.R(B(best)))), hi = Q.add(lo, width);
  return { decided: true, nbins, width, iqr, modeBin: best, modeLo: lo, modeHi: hi, modeCenter: Q.mul(Q.add(lo, hi), Q.R(1n, 2n)), count: counts[best], ties, edgesLo: s[0], edgesHi: s[n - 1] };
}
/* the record key → the paper's record time and frame rate */
function parseRec(k) {
  const m = /^run_(\d{4})-(\d\d)-(\d\d)_(\d\d)h(\d\d)m([\d.]+)sZ_(\d+)Hz$/.exec(k);
  if (!m) throw new Error('unparsed record key ' + k);
  return { time: m[1] + '/' + m[2] + '/' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6], fps: Number(m[7]) };
}

/* ---- the decisions ---- */
function decidePaper(T, claims) {
  const P = claims.paper.printed, g = r(claims.references.g.value);
  const col = (c) => T.rows.map((row) => row[c]);
  const cm = col('cm'), c0 = col('c0'), cB = col('cB'), cA = col('cA'), Ab = col('Ab_max'), LD = col('LD81'), Dz = col('Dz_max'), DT = col('DT'), th = col('theta'), LA = col('LA_max'), LBm = col('LB_max'), Ae = col('Ae_max');
  const Lb = col('Pb_max').map((p) => Q.mul(p, Q.R(1n, 2n)));
  const x = cm.map((c) => Q.div(Q.mul(c, c), g));                       /* cb²/g */
  const cm2 = cm.map((c) => Q.mul(c, c));
  const LD2 = LD.map((v) => Q.mul(v, v)), Lb2 = Lb.map((v) => Q.mul(v, v));
  const out = { items: [] };
  const item = (id, printed, exact, verdict, extra) => { const it = Object.assign({ id, printed, exact, verdict }, extra || {}); out.items.push(it); return it; };
  const rr = (p) => (p !== null && p !== undefined) ? p : null;

  /* Table 1, row by row */
  const byRec = {};
  T.rows.forEach((row, i) => { (byRec[row.Rec] = byRec[row.Rec] || []).push(i); });
  const t1 = [];
  let hsColumnMatches = 0;
  for (const row of claims.paper.table1.rows) {
    const [time, fps, dur, area, nb, hs, tp, u10] = row;
    const key = Object.keys(byRec).find((k) => parseRec(k).time === time);
    if (!key) { t1.push({ time, found: false }); continue; }
    const idx = byRec[key], first = T.rows[idx[0]];
    const tpQ = Q.div(Q.R(1n), first.sv_fp), durQ = Q.div(first.svT, Q.R(60n));
    const cells = {
      fps: parseRec(key).fps === fps ? 'REPRODUCED' : 'NOT_THE_TABLES',
      duration: roundsTo(durQ, String(dur)),
      area: roundsTo(first.svA, String(area)),
      events: idx.length === nb ? 'REPRODUCED' : 'NOT_THE_TABLES',
      Hs: roundsTo(first.sv_fp2, hs),
      HsNamedColumn: roundsTo(first.Hs, hs),
      Tp: roundsTo(tpQ, tp),
      U10: roundsTo(first.wnd, u10),
    };
    if (cells.HsNamedColumn === 'REPRODUCED') hsColumnMatches++;
    t1.push({ time, rec: key, found: true, printed: { fps, dur, area, nb, hs, tp, u10 }, exact: { events: idx.length, duration: L.dec(durQ, 3), area: L.dec(first.svA, 3), sv_fp2: L.dec(first.sv_fp2, 4), HsNamedColumn: L.dec(first.Hs, 4), Tp: L.dec(tpQ, 3), U10: L.dec(first.wnd, 2) }, cells });
  }
  const t1cells = t1.filter((x) => x.found).flatMap((x) => ['fps', 'duration', 'area', 'events', 'Hs', 'Tp', 'U10'].map((c) => x.cells[c]));
  const tally = (v) => t1cells.filter((c) => c === v).length;
  out.table1 = { rows: t1, cells: t1cells.length, reproduced: tally('REPRODUCED'), onTheBoundary: tally('ON_THE_BOUNDARY'), truncation: tally('TRUNCATION'), notTheTables: tally('NOT_THE_TABLES'), HsIsColumn: 'sv_fp2', HsNamedColumnMatches: hsColumnMatches, allFound: t1.every((x) => x.found) };

  /* the count */
  item('N', String(P.N.value), String(T.rows.length), T.rows.length === P.N.value ? 'REPRODUCED' : 'NOT_THE_TABLES');
  /* the range of θ */
  const ths = D.sortQ(th);
  item('thetaMin', P.thetaRange.lo, L.dec(ths[0], 6), Q.cmp(ths[0], r(P.thetaRange.lo)) === 0 ? 'REPRODUCED' : 'NOT_THE_TABLES', { unit: 'degrees', roundsTo: roundsTo(ths[0], P.thetaRange.lo) });
  item('thetaMax', P.thetaRange.hi, L.dec(ths[ths.length - 1], 6), Q.cmp(ths[ths.length - 1], r(P.thetaRange.hi)) === 0 ? 'REPRODUCED' : 'NOT_THE_TABLES', { unit: 'degrees', roundsTo: roundsTo(ths[ths.length - 1], P.thetaRange.hi), eventsAbove45: th.filter((t) => Q.cmp(t, Q.R(45n)) > 0).length });
  /* the angle the printed range is the truncation of: arctan(Dz_max / LB_max), compared through tan enclosures */
  const tanDeg = (d) => { const ang = IV.mul(TR.PI, IV.iv(d / 180)); return IV.div(TR.sin(ang), TR.cos(ang)); };
  const ratioDzLB = Dz.map((z, i) => Q.div(z, LBm[i]));
  const rs = D.sortQ(ratioDzLB);
  const inDeg = (q, d) => { const lo = tanDeg(d), hi = tanDeg(d + 1); return Q.cmp(q, Q.fromDouble(lo[1])) >= 0 && Q.cmp(q, Q.fromDouble(hi[0])) < 0; };
  const altOk = inDeg(rs[0], Number(P.thetaRange.lo)) && inDeg(rs[rs.length - 1], Number(P.thetaRange.hi));
  item('thetaRangeAlt', P.thetaRange.lo + '°..' + P.thetaRange.hi + '°', 'tan⁻¹(Dz/eB): min ' + L.dec(rs[0], 6) + ', max ' + L.dec(rs[rs.length - 1], 6) + ' (as tangents)', altOk ? 'REPRODUCED_AS_TRUNCATION' : 'NOT_THE_TABLES', { angle: 'arctan(Dz_max / LB_max), the angle whose integer parts are the printed pair', tan3: tanDeg(3)[1], tan4: tanDeg(4)[0], tan71: tanDeg(71)[1], tan72: tanDeg(72)[0] });
  /* the aspect ratio: mean, sd, cv, mode */
  const asp = Ab.map((a, i) => Q.div(a, LD2[i]));
  const am = moments(asp);
  const sdS = [D.sqrtEnclosure(am.varSample[0], false)[0], D.sqrtEnclosure(am.varSample[1], false)[1]];
  const sdP = [D.sqrtEnclosure(am.varPop[0], false)[0], D.sqrtEnclosure(am.varPop[1], false)[1]];
  const cv = [Q.div(sdS[0], am.mean[1]), Q.div(sdS[1], am.mean[0])];
  item('aspectMean', P.aspectMeanSd.mean, L.dec(am.mean[0], 6) + '..' + L.dec(am.mean[1], 6), roundsToIv(am.mean, P.aspectMeanSd.mean));
  item('aspectSd', P.aspectMeanSd.sd, L.dec(sdS[0], 6) + '..' + L.dec(sdS[1], 6), roundsToIv(sdS, P.aspectMeanSd.sd), { sdPopulation: L.dec(sdP[0], 6) + '..' + L.dec(sdP[1], 6) });
  item('aspectCV', P.aspectMeanSd.cv, L.dec(Q.mul(cv[0], Q.R(100n)), 3) + '..' + L.dec(Q.mul(cv[1], Q.R(100n)), 3), roundsToIv([Q.mul(cv[0], Q.R(100n)), Q.mul(cv[1], Q.R(100n))], P.aspectMeanSd.cv), { unit: '%' });
  const fd = fdMode(asp);
  item('aspectPeak', P.aspectPeak.value, fd.decided ? L.dec(fd.modeCenter, 6) : null, fd.decided ? roundsTo(fd.modeCenter, P.aspectPeak.value) : 'UNDECIDED_BIN_COUNT',
    fd.decided ? { nbins: fd.nbins, width: L.dec(fd.width, 6), modeBin: [L.dec(fd.modeLo, 6), L.dec(fd.modeHi, 6)], modeCount: fd.count, ties: fd.ties, iqr: L.dec(fd.iqr, 6), containsPrinted: Q.cmp(fd.modeLo, r(P.aspectPeak.value)) <= 0 && Q.cmp(r(P.aspectPeak.value), fd.modeHi) < 0 } : { nbins: fd.nbins });
  /* the three quadratic fits through the origin */
  for (const [id, ys, key] of [['fitLb', Lb, 'fitLb'], ['fitLD81', LD, 'fitLD81'], ['fitDz', Dz, 'fitDz']]) {
    const a = slopeThroughOrigin(x, ys);
    item(id, P[key].value, L.dec(a, 6), roundsTo(a, P[key].value), { pm: P[key].pm, withinPm: Q.cmp(Q.abs(Q.sub(a, r(P[key].value))), r(P[key].pm)) <= 0 });
  }
  /* Pearson r, speed against geometry: cm, c0, cB, cA against the six properties */
  const speeds = { cm, c0, cB, cA }, props = { Lb, Ab_max: Ab, Dz_max: Dz, DT, LD81: LD, theta: th, LA_max: LA, LB_max: LBm };
  const speedR = {}; let speedMax = null, speedMaxKey = null;
  for (const [sk, sv] of Object.entries(speeds)) for (const [pk, pv] of Object.entries(props)) {
    const pe = D.pearsonQ(sv, pv); if (!pe) continue;
    speedR[sk + '~' + pk] = { r2: Q.toString(pe.r2), r: [L.dec(pe.r[0], 9), L.dec(pe.r[1], 9)] };
    const hi = Q.abs(pe.r[1]);
    if (speedMax === null || Q.cmp(hi, speedMax) > 0) { speedMax = hi; speedMaxKey = sk + '~' + pk; }
  }
  item('pearsonSpeedMax', '< ' + P.pearsonSpeedMax.value, L.dec(speedMax, 6), Q.cmp(speedMax, r(P.pearsonSpeedMax.value)) < 0 ? 'REPRODUCED' : 'NOT_THE_TABLES', { pair: speedMaxKey, pairs: Object.keys(speedR).length });
  out.speedPearson = speedR;
  /* Pearson r between geometric properties */
  const geo = { rAbLb: [Ab, Lb], rAbLD81: [Ab, LD], rDzEB: [Dz, LBm], rAbDt: [Ab, DT], rLbDt: [Lb, DT], rDzDt: [Dz, DT] };
  for (const [id, [u, v]] of Object.entries(geo)) {
    const pe = D.pearsonQ(u, v);
    const extra = { r2: Q.toString(pe.r2) };
    if (id === 'rAbDt') { const ps = D.pearsonQ(col('Ab_sum'), DT); extra.withAbSum = [L.dec(ps.r[0], 6), L.dec(ps.r[1], 6)]; extra.withAbSumVerdict = roundsToIv(ps.r, P[id].value); }
    item(id, P[id].value, L.dec(pe.r[0], 6) + '..' + L.dec(pe.r[1], 6), roundsToIv(pe.r, P[id].value), extra);
  }
  /* the self-similar subsets: ratio ≥ mean + 2·sd, sample sd, per ratio */
  const ratios = { a: x.map((xi, i) => Q.div(xi, Lb[i])), b: Ab.map((v, i) => Q.div(v, Lb2[i])), c: asp };
  const tails = {};
  for (const [k, v] of Object.entries(ratios)) {
    const t = tailThreshold(v, 1), sp = splitAtThreshold(v, t);
    tails[k] = { threshold: [L.dec(t.lo, 9), L.dec(t.hi, 9)], mean: [L.dec(t.mean[0], 6), L.dec(t.mean[1], 6)], sd: [L.dec(t.sd[0], 6), L.dec(t.sd[1], 6)], above: sp.above.length, below: sp.below.length, undecided: sp.undecided.length, fractionAbove: L.dec(Q.R(B(sp.above.length), B(v.length)), 6), idx: sp };
  }
  const fr = ['a', 'b', 'c'].map((k) => Q.R(B(tails[k].above), B(T.rows.length)));
  const frLo = fr.reduce((m, q) => (Q.cmp(q, m) < 0 ? q : m)), frHi = fr.reduce((m, q) => (Q.cmp(q, m) > 0 ? q : m));
  const pmLo = Q.R(B(P.selfSimilarFraction.value) - B(P.selfSimilarFraction.pm), 100n), pmHi = Q.R(B(P.selfSimilarFraction.value) + B(P.selfSimilarFraction.pm), 100n);
  item('selfSimilarFraction', P.selfSimilarFraction.value + ' ± ' + P.selfSimilarFraction.pm + ' %', ['a', 'b', 'c'].map((k) => L.dec(Q.mul(fr[['a', 'b', 'c'].indexOf(k)], Q.R(100n)), 3) + ' %').join(' · '),
    (Q.cmp(frLo, pmLo) >= 0 && Q.cmp(frHi, pmHi) <= 0) ? 'REPRODUCED' : 'NOT_THE_TABLES', { undecided: ['a', 'b', 'c'].map((k) => tails[k].undecided), counts: ['a', 'b', 'c'].map((k) => tails[k].above) });
  /* Figure 4d: the fit on the tail and on the rest, r = Pearson(cb², Lb) */
  const pick = (arr, idx) => idx.map((i) => arr[i]);
  const fit4 = (idx) => { const a = slopeThroughOrigin(pick(x, idx), pick(Lb, idx)); const pe2 = D.pearsonQ(pick(cm2, idx), pick(Lb, idx)); const pe1 = D.pearsonQ(pick(cm, idx), pick(Lb, idx)); return { n: idx.length, a, rSq: pe2, rLin: pe1 }; };
  const ft = fit4(tails.a.idx.above), fs = fit4(tails.a.idx.below);
  item('fitLbTail', P.fitLbTail.value, L.dec(ft.a, 6), roundsTo(ft.a, P.fitLbTail.value), { n: ft.n, rPrinted: P.fitLbTail.r, rCb2Lb: [L.dec(ft.rSq.r[0], 6), L.dec(ft.rSq.r[1], 6)], rVerdict: roundsToIv(ft.rSq.r, P.fitLbTail.r), rCbLb: [L.dec(ft.rLin.r[0], 6), L.dec(ft.rLin.r[1], 6)] });
  item('fitLbRest', P.fitLbRest.value, L.dec(fs.a, 6), roundsTo(fs.a, P.fitLbRest.value), { n: fs.n, rPrinted: P.fitLbRest.r, rCb2Lb: [L.dec(fs.rSq.r[0], 6), L.dec(fs.rSq.r[1], 6)], rVerdict: roundsToIv(fs.rSq.r, P.fitLbRest.r), rCbLb: [L.dec(fs.rLin.r[0], 6), L.dec(fs.rLin.r[1], 6)] });
  out.tails = {}; for (const k of Object.keys(tails)) { const t = Object.assign({}, tails[k]); delete t.idx; out.tails[k] = t; }
  /* Figure 4e/4f: Ab = k·Lb² and Ab = k·L_D81², fitted on the tail and on the rest of THEIR ratio, and on everything */
  const all = T.rows.map((_, i) => i);
  const fitK = (xs2, ys, idx) => slopeThroughOrigin(pick(xs2, idx), pick(ys, idx));
  const kc = { all: fitK(LD2, Ab, all), rest: fitK(LD2, Ab, tails.c.idx.below), tail: fitK(LD2, Ab, tails.c.idx.above) };
  const kb = { all: fitK(Lb2, Ab, all), rest: fitK(Lb2, Ab, tails.b.idx.below), tail: fitK(Lb2, Ab, tails.b.idx.above) };
  const which = (ks, printed) => { for (const w of ['rest', 'all', 'tail']) if (roundsTo(ks[w], printed) === 'REPRODUCED') return w; return null; };
  const wc = which(kc, P.fitAbLD81.value), wb = which(kb, P.fitAbLb.value);
  const kcLmax = slopeThroughOrigin(LD2, col('Ab_Lmax'));           /* the area at the frame of maximum length, not the maximum area */
  item('fitAbLD81', P.fitAbLD81.value, Object.entries(kc).map(([w, k]) => w + ' ' + L.dec(k, 6)).join(' · '), wc ? 'REPRODUCED' : 'NOT_THE_TABLES', { subset: wc, meanRatio: L.dec(am.mean[0], 6), medianRatio: L.dec(D.quantiles(asp).q['0.5'], 6), withAreaAtMaxLength: L.dec(kcLmax, 6), withAreaAtMaxLengthVerdict: roundsTo(kcLmax, P.fitAbLD81.value) });
  item('fitAbLb', P.fitAbLb.value, Object.entries(kb).map(([w, k]) => w + ' ' + L.dec(k, 6)).join(' · '), wb ? 'REPRODUCED' : 'NOT_THE_TABLES', { subset: wb });
  /* the ellipse and the area fits: the printed coefficients are RANSAC's (a randomised robust fitter,
     reg.estimator_.coef_ in plot_linear_relation.py) and are not reproducible; the least-squares slope
     through the origin and the Pearson r — which the script prints from linregress — are decided */
  const LAmean = col('LA_mean'), LBmean = col('LB_mean');
  const kEAEB = slopeThroughOrigin(LBmean, LAmean), peEAEB = D.pearsonQ(LBmean, LAmean);
  item('fitEAEB', P.fitEAEB.value, L.dec(kEAEB, 6), 'NOT_DECIDABLE_RANSAC', { columns: 'LA_mean on LB_mean, as the script sets them', rPrinted: P.fitEAEB.r, r: [L.dec(peEAEB.r[0], 6), L.dec(peEAEB.r[1], 6)], rVerdict: roundsToIv(peEAEB.r, P.fitEAEB.r) });
  const kAeAb = slopeThroughOrigin(Ab, Ae), peAeAb = D.pearsonQ(Ab, Ae), peAeAbSum = D.pearsonQ(col('Ab_sum'), col('Ae_sum'));
  item('fitAeAb', P.fitAeAb.value, L.dec(kAeAb, 6), 'NOT_DECIDABLE_RANSAC', { columns: 'Ae_max on Ab_max, as the script sets them', rPrinted: P.fitAeAb.r, r: [L.dec(peAeAb.r[0], 6), L.dec(peAeAb.r[1], 6)], rVerdict: roundsToIv(peAeAb.r, P.fitAeAb.r), rSumColumns: [L.dec(peAeAbSum.r[0], 6), L.dec(peAeAbSum.r[1], 6)], rSumVerdict: roundsToIv(peAeAbSum.r, P.fitAeAb.r) });
  /* the pooled Pearson(cb, Lb) beside the conclusion's "r = 0.4" */
  const pool = D.pearsonQ(cm, Lb), pool2 = D.pearsonQ(cm2, Lb);
  out.pooledR = { cbLb: [L.dec(pool.r[0], 6), L.dec(pool.r[1], 6)], cb2Lb: [L.dec(pool2.r[0], 6), L.dec(pool2.r[1], 6)] };

  /* ---- the stratified analysis, per record ---- */
  const aLo = r(claims.references.duncanAngle.lo), aHi = r(claims.references.duncanAngle.hi);
  const per = [];
  for (const [key, idx] of Object.entries(byRec)) {
    const first = T.rows[idx[0]], meta = parseRec(key);
    const xs = pick(x, idx), ys = pick(Lb, idx);
    const a = slopeThroughOrigin(xs, ys);
    const pe2 = D.pearsonQ(pick(cm2, idx), ys), pe1 = D.pearsonQ(pick(cm, idx), ys);
    const inBand = idx.filter((i) => Q.cmp(th[i], aLo) > 0 && Q.cmp(th[i], aHi) < 0).length;
    const aspRec = pick(asp, idx), mRec = moments(aspRec);
    const tailFrac = {}; for (const k of ['a', 'b', 'c']) tailFrac[k] = tails[k].idx.above.filter((i) => T.rows[i].Rec === key).length;
    per.push({
      rec: key, time: meta.time, n: idx.length,
      Hs: L.dec(first.sv_fp2, 3), Tp: L.dec(Q.div(Q.R(1n), first.sv_fp), 3), U10: L.dec(first.wnd, 2),
      waveAgeQ: Q.div(g, Q.mul(first.sv_fp, first.wnd)),               /* cp/U10 = g/(2π fp U10) without the 2π: the rank is the same */
      slope: a, slopeDec: L.dec(a, 6), rCb2Lb: [L.dec(pe2.r[0], 6), L.dec(pe2.r[1], 6)], rCbLb: [L.dec(pe1.r[0], 6), L.dec(pe1.r[1], 6)],
      inBand, fractionInBand: L.dec(Q.R(B(inBand), B(idx.length)), 4),
      aspectMean: mRec.mean[0], aspectMeanDec: L.dec(mRec.mean[0], 6), aspectMeanHi: L.dec(mRec.mean[1], 6), aspectMedian: L.dec(D.quantiles(aspRec).q['0.5'], 6),
      medianA: D.quantiles(pick(ratios.a, idx)).q['0.5'], medianADec: L.dec(D.quantiles(pick(ratios.a, idx)).q['0.5'], 6),
      tailCounts: tailFrac, tailFraction: L.dec(Q.R(B(tailFrac.a), B(idx.length)), 4),
    });
  }
  per.sort((p, q) => (p.rec < q.rec ? -1 : 1));
  /* how the per-record slope ranks with the sea state: Spearman on 20 points, exact */
  const seriesRec = { U10: per.map((p) => r(p.U10)), Hs: per.map((p) => r(p.Hs)), Tp: per.map((p) => r(p.Tp)), waveAge: per.map((p) => p.waveAgeQ) };
  const targets = { slope: per.map((p) => p.slope), aspectMean: per.map((p) => p.aspectMean), medianA: per.map((p) => p.medianA), fractionInBand: per.map((p) => Q.R(B(p.inBand), B(p.n))) };
  const seaState = {};
  for (const [tk, tv] of Object.entries(targets)) for (const [sk, sv] of Object.entries(seriesRec)) {
    const sp = D.pearsonInt(D.doubledRanks(tv), D.doubledRanks(sv));
    seaState[tk + '~' + sk] = { rho: [L.dec(sp.r[0], 6), L.dec(sp.r[1], 6)], rho2: Q.toString(sp.r2), sign: sp.sign };
  }
  const slopes = per.map((p) => p.slope);
  const sMin = slopes.reduce((m, q) => (Q.cmp(q, m) < 0 ? q : m)), sMax = slopes.reduce((m, q) => (Q.cmp(q, m) > 0 ? q : m));
  out.perRecord = per.map((p) => { const o = Object.assign({}, p); delete o.slope; delete o.aspectMean; delete o.medianA; delete o.waveAgeQ; return o; });
  out.seaState = { spearman: seaState, slopeMin: L.dec(sMin, 6), slopeMax: L.dec(sMax, 6), slopeSpread: L.dec(Q.div(sMax, sMin), 6), pooledSlope: L.dec(slopeThroughOrigin(x, Lb), 6) };
  return out;
}

module.exports = { decidePaper, slopeThroughOrigin, moments, tailThreshold, splitAtThreshold, roundsTo, roundsToIv, percentileLinear, cbrtEnclosure, fdMode, parseRec };
