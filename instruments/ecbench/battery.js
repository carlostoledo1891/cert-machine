#!/usr/bin/env node
/* instruments/ecbench/battery.js — the exact plane geometry calibrated, red
   controls that must fire, Table 1's enclosure checked against known values,
   and the shipped ledger walked: pins re-hashed, invariants held, and a set
   of rows re-decided live from the bytes.

   Prints: "ecbench battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('./lib.js');
const D = require('./decide.js');
const X = require('./expected.js');
const ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const throws = (f) => { try { f(); return false; } catch (e) { return true; } };
const l = (s) => L.lit(String(s));
const pt = (u, h) => ({ u: l(u), h: l(h) });
const where = (P, u, h) => D.classify(P, l(u), l(h)).where;

/* ---- the reader ---- */
ok(L.scaled('0.2845', 6) === 284500n && L.scaled('-1.5e-3', 6) === -1500n && L.scaled('4.283446918632201', 15) === 4283446918632201n, 'literals scale to exact integers');
red(throws(() => L.scaled('0.1234567', 6)), 'a literal with more digits than the scale is refused, not rounded');
red(throws(() => L.lit('nan')), 'a NaN token is not a literal and is refused');
red(throws(() => L.lit('1,5')), 'a comma decimal is refused');
ok(L.isHs('significant wave height (m)') && L.isHs('Hs') && L.isHs('hs') && L.isHs('significant wave heigth(m)') && !L.isHs('zero-up-crossing period (s)') && !L.isHs('wind speed (m/s)'), 'the header reader knows every spelling of Hs the benchmark used');
ok(L.isPeriod('zero-upcrossing period [s]') && L.isPeriod('tz') && L.isWind('wind speed (m s$^{-1}$)') && L.isWind('U10') && L.isWind('ws'), 'and every spelling of the second variable');

/* ---- the predicates ---- */
ok(D.cmpLit(l('1.0000000000000001'), l('1')) < 0 && D.cmpLit(l('1'), l('1.0000000000000001')) > 0, 'two literals that share a double are still ordered exactly');
ok(D.cmpLit(l('0.1'), l('0.10')) === 0, '0.1 and 0.10 are the same literal');
/* a case found by search where float64 gives the WRONG sign (+3.55e-15) for a point exactly below an edge:
   every literal is the exact decimal of a double, so the float path sees exactly these numbers */
{
  const W = { xi: '14.3256021564417768132670971681363880634307861328125', yi: '1.530869889471018208126906756660901010036468505859375', xj: '10.16669842962360092997187166474759578704833984375', yj: '-3.230462383788379465698881176649592816829681396484375', px: '10.2765866114352917293217615224421024322509765625', py: '-3.1046565991687646857144500245340168476104736328125' };
  const F = (Number(W.xj) - Number(W.xi)) * (Number(W.py) - Number(W.yi)) - (Number(W.yj) - Number(W.yi)) * (Number(W.px) - Number(W.xi));
  ok(F > 0, 'the float determinant of the planted case is positive (' + F.toExponential(2) + ')');
  red(D.orient(l(W.xi), l(W.yi), l(W.xj), l(W.yj), l(W.px), l(W.py)) < 0, 'and the decided sign is NEGATIVE: the filter sent it to exact arithmetic instead of trusting the float');
}
ok(D.orient(l('0'), l('0'), l('1'), l('0'), l('0.5'), l('1e-20')) > 0 && D.orient(l('0'), l('0'), l('1'), l('0'), l('0.5'), l('-1e-20')) < 0 && D.orient(l('0'), l('0'), l('1'), l('0'), l('0.5'), l('0')) === 0, 'orientation decides a point 1e-20 off a line, on either side, and exactly on it');

/* ---- a square, its edges and its corners ---- */
{
  const S = D.polygon([pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2)]);
  ok(where(S, 1, 1) === 'IN' && where(S, 3, 1) === 'OUT' && where(S, 1, -1) === 'OUT', 'inside and outside a square');
  ok(where(S, 2, 1) === 'ON' && where(S, 1, 0) === 'ON' && where(S, 1, 2) === 'ON' && where(S, 0, 1) === 'ON', 'every edge, including the horizontal ones, is ON');
  ok(where(S, 0, 0) === 'ON' && where(S, 2, 2) === 'ON' && where(S, 2, 0) === 'ON', 'every corner is ON');
  ok(where(S, '1.9999999999999999', 1) === 'IN' && where(S, '2.0000000000000001', 1) === 'OUT', 'a point closer to the edge than a double can tell is decided exactly');
  red(where(S, '2.00000000000000000001', 1) !== 'ON', 'a point 1e-20 outside is not ON');
  const d = D.diagnostics(S);
  ok(d.simple && d.orientation === 'CCW' && d.signedArea === '4.000000' && d.maxHs === '2' && d.minU === '0' && d.maxU === '2' && !d.closed, 'diagnostics: simple, counter-clockwise, area 4, maxima at the vertices, not explicitly closed');
  const C = D.polygon([pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2), pt(0, 0)]);
  ok(C.closedExplicitly && C.n === 4 && D.diagnostics(C).closed && D.diagnostics(C).simple, 'a file that repeats its first vertex is the same polygon, marked closed, still simple');
  const Dp = D.polygon([pt(0, 0), pt(2, 0), pt(2, 0), pt(2, 2), pt(0, 2)]);
  ok(Dp.duplicates === 1 && Dp.n === 4 && D.diagnostics(Dp).simple, 'a consecutive duplicate vertex is removed and counted');
}
/* ---- a concave shape: the ray crosses more than once ---- */
{
  const U = D.polygon([pt(0, 0), pt(6, 0), pt(6, 4), pt(4, 4), pt(4, 1), pt(2, 1), pt(2, 4), pt(0, 4)]);
  ok(where(U, 1, 3) === 'IN' && where(U, 5, 3) === 'IN' && where(U, 3, 3) === 'OUT' && where(U, 3, 0.5) === 'IN', 'a U: both arms inside, the notch outside');
  ok(where(U, 3, 1) === 'ON' && where(U, 4, 2) === 'ON', 'the notch\'s floor and wall are ON');
  /* a data point at the height of a vertex (the classic half-open case) */
  ok(where(U, 1, 1) === 'IN' && where(U, 7, 1) === 'OUT' && where(U, 3, 1.5) === 'OUT', 'points on the horizontal line through a vertex are counted once, not twice');
}
/* ---- reds on the geometry ---- */
{
  const bow = D.polygon([pt(0, 0), pt(2, 2), pt(2, 0), pt(0, 2)]);
  const db = D.diagnostics(bow);
  red(!db.simple && db.selfCrossings === 1, 'a bowtie is NOT simple: one self-crossing');
  const twice = D.polygon([pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2), pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2)]);
  const c = D.classify(twice, l(1), l(1));
  red(c.where === 'OUT' && c.winding === 2, 'a square traced twice: even-odd says OUT, winding says 2 — the two rules part company exactly where a contour crosses itself');
  red(throws(() => D.polygon([pt(0, 0), pt(1, 1)])), 'two vertices are not a polygon');
  const fold = D.polygon([pt(0, 0), pt(4, 0), pt(2, 0), pt(2, 2)]);
  red(D.diagnostics(fold).backtracks >= 1, 'a contour that folds back along itself is caught as a backtrack');
}
/* ---- count() on a small dataset, with the threshold ---- */
{
  const S = D.polygon([pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2)]);
  const ds = { n: 5, u: Float64Array.from([1, 3, 2, 1, 5]), h: Float64Array.from([1, 1, 1, 3, 0.5]), us: ['1', '3', '2', '1', '5'], hs: ['1', '1', '1', '3', '0.5'] };
  const r = D.count(S, ds, {});
  ok(r.in === 1 && r.on === 1 && r.out === 3 && r.outAboveThreshold === 1, 'five points: one in, one on, three out, one of them above Hs = 1');
  const rw = D.count(S, ds, { windThreshold: true });
  ok(rw.outAboveThreshold === 0, 'with the wind threshold (u > 1 and Hs > 1) none of the three qualifies (the Hs = 3 point has u = 1, not > 1)');
  red(D.count(S, { n: 1, u: Float64Array.from([2]), h: Float64Array.from([1]), us: ['2.00000000000000000000001'], hs: ['1'] }, {}).out === 1
    && D.count(S, { n: 1, u: Float64Array.from([2]), h: Float64Array.from([1]), us: ['1.99999999999999999999999'], hs: ['1'] }, {}).in === 1, 'a data literal 1e-23 either side of an edge lands on that side — the float image is the same double for both');
}
/* ---- a column swap changes the count: the reason the header is read, not assumed ---- */
{
  const tri = D.polygon([pt(0, 0), pt(10, 0), pt(0, 3)]);
  const swapped = D.polygon([pt(0, 0), pt(0, 10), pt(3, 0)]);
  red(where(tri, 8, 0.5) === 'IN' && where(swapped, 8, 0.5) === 'OUT', 'reading (Hs, Tz) as (Tz, Hs) moves a point across the contour');
}

/* ---- Table 1's enclosure ---- */
{
  const within = (iv, v) => iv[0] <= v && v <= iv[1];
  ok(within(X.erfc(1), 0.15729920705028513) && within(X.erfc(2), 0.004677734981047266) && within(X.erfc(3), 2.209049699858544e-05), 'erfc(1), erfc(2), erfc(3) lie in their enclosures (reference values from the literature)');
  ok(X.erfc(2)[1] - X.erfc(2)[0] < 1e-16, 'the erfc enclosure at 2 is narrower than 1e-16');
  red(!within(X.erfc(2), 0.004677734981047266 * (1 + 1e-12)), 'a value 1e-12 relative off erfc(2) is outside the enclosure');
  const e = X.expectedOutside(175320, 1);
  ok(e.total.exact === '20' && Number(e.iform.lo) <= 196.87 && Number(e.iform.hi) >= 196.85, '20 years of hours × 1/8766 is exactly 20; the IFORM expectation encloses 196.86');
  red(!(Number(e.iform.lo) <= 195 && 195 <= Number(e.iform.hi)), '195 is outside the IFORM enclosure');
  const e50 = X.expectedOutside(438288, 50);
  ok(e50.total.exact === '36524/36525' && Number(e50.iform.lo) <= 12.0 && Number(e50.iform.hi) >= 11.99, 'D–F: 438,288 hours over 50 × 8766 is 36524/36525, and the IFORM expectation encloses 11.99');
}

/* ---- the shipped ledger ---- */
{
  const led = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ecbench-ledger.json'), 'utf8'));
  const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
  const fetched = L.ensureCorpus();
  ok(fetched === 0 || fetched > 0, 'the corpus is present (' + fetched + ' file(s) fetched now)');
  let pins = 0, absent = 0;
  for (const [rel, m] of Object.entries(meta.files)) {
    const p = path.join(L.CORPUS, rel);
    if (!fs.existsSync(p)) { absent++; continue; }
    ok(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') === m.sha256, 'pin ' + rel); pins++;
  }
  ok(absent === 0, 'every pinned file is present after the fetch (' + absent + ' absent)');
  ok(led.rows.length === 150 && led.comparisons.length === 176, 'the ledger holds 150 contours and 176 printed numbers');
  ok(led.summary.agree === 174 && led.summary.exactlyEqual === 173 && led.summary.disagree === 2, '174 of 176 printed numbers agree with the exact count, 173 to the integer, 2 do not');
  const dis = led.comparisons.filter((c) => !c.agrees);
  ok(dis.every((c) => c.contribution === '3' && c.returnPeriod === 1), 'both disagreements are contribution 3\'s 1-yr row');
  ok(led.summary.columnOrderDisagreements === 0, 'the header-read column order agrees with the organizers\' hand-made lists on every file');
  ok(led.summary.rulesDisagreeTotal === 0, 'no observation changes side between even-odd and nonzero winding');
  ok(led.summary.boundaryPointsTotal === 2 && led.summary.withBoundaryPoints === 2, 'exactly two observations lie ON a submitted contour');
  ok(led.summary.notSimple === 30, '30 of 150 submitted contours are not simple polygons');
  /* live re-decision: three rows of different kinds, from the bytes */
  if (absent === 0) {
    const data = {};
    const need = ['A', 'F'];
    for (const ch of need) { const p = L.readDataset('datasets/' + ch + '.txt'), r = L.readDataset('datasets-retained/' + ch + 'r.txt'); data[ch] = { kind: p.kind, n: p.n + r.n, u: Float64Array.from([...p.u, ...r.u]), h: Float64Array.from([...p.h, ...r.h]), us: p.us.concat(r.us), hs: p.hs.concat(r.hs) }; }
    for (const id of ['haselsteiner_andreas/A/20', 'vanem_DirectSampling/A/20', 'GC_CGS/F/1', 'BV/A/20']) {
      const row = led.rows.find((r) => r.id === id);
      const K = L.readContour(row.file);
      const P = D.polygon(K.pts), dg = D.diagnostics(P);
      const c = D.count(P, data[row.dataset], { windThreshold: row.dataset === 'F' });
      ok(c.out === row.counts.full.out && c.on === row.counts.full.on && c.outAboveThreshold === row.counts.full.outAboveThreshold && dg.selfCrossings === row.polygon.selfCrossings && dg.simple === row.polygon.simple, 'live re-decision of ' + id + ' reproduces the ledger');
    }
    /* the two boundary points, named */
    const g = led.rows.find((r) => r.id === 'GC_CGS/F/1');
    const P = D.polygon(L.readContour(g.file).pts);
    ok(g.counts.full.onSample.length === 1 && D.classify(P, l(g.counts.full.onSample[0].u), l(g.counts.full.onSample[0].h)).where === 'ON', 'the observation the ledger names as ON the GC_CGS F 1-yr contour is ON');
    red(D.classify(P, l(g.counts.full.onSample[0].u), l(String(g.counts.full.onSample[0].h) + '1')).where !== 'ON', 'one more digit on that observation and it is no longer ON');
  }
}

console.log('ecbench battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
