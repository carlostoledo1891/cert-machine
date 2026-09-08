#!/usr/bin/env node
/* instruments/easota/battery.js — calibrations that must decide exactly,
   red controls that must fire, and a walk of the shipped ledger. */
'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const L = require('./lib.js');
const D = require('./decide.js');
const Q = L.Q;
const ROOT = path.resolve(__dirname, '..', '..');
const r = (s) => L.parseDecimal(s);
const eq = (a, b) => Q.cmp(a, b) === 0;

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) { pass++; } else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };

/* ---- the reader ---- */
ok(eq(r('0.1'), Q.R(1n, 10n)) && eq(r('2.5e-3'), Q.R(1n, 400n)) && eq(r('-1.5955187211993326e-19'), Q.R(-15955187211993326n, 10n ** 35n)), 'decimal literals read as the exact rationals they denote');
ok(JSON.stringify(L.pyLiteral('x = np.array([[1.0, 2], [3e-2,\n 4]])', 'x')) === '[["1.0","2"],["3e-2","4"]]', 'a nested Python literal parses to its tokens');
red((() => { try { L.pyLiteral('x = np.array([1, 2', 'x'); return false; } catch (e) { return true; } })(), 'an unbalanced Python literal is refused');

/* ---- circles ---- */
{
  const a = D.circles([[r('0.25'), r('0.25'), r('0.25')], [r('0.75'), r('0.25'), r('0.25')]]);
  ok(a.witnessed && eq(a.sumR, Q.R(1n, 2n)) && eq(a.boxSlack, Q.R(1n, 2n)), 'two touching quarter-circles in a 1 × ½ box: WITNESSED, Σr = ½, box slack ½ — the touch is an exact zero, not an overlap');
  const b = D.circles([[r('0'), r('0'), r('0.3')], [r('0.5'), r('0'), r('0.3')]]);
  red(!b.witnessed && b.overlaps === 1 && b.repair && Q.cmp(b.repair.lambda, Q.R(5n, 6n)) <= 0, 'two overlapping circles are UNWITNESSED with a repair λ ≤ 5/6');
  const c = D.circles([[r('0'), r('0'), r('0.3')], [r('0.5'), r('0'), r('0.3')]].map((x) => [x[0], x[1], Q.mul(x[2], b.repair.lambda)]));
  ok(c.witnessed, 'the repaired radii re-decide as WITNESSED');
  const d = D.circles([[r('0'), r('0'), r('0.5')], [r('3'), r('0'), r('0.5')]]);
  red(!d.witnessed && d.overlaps === 0 && Q.sign(d.boxSlack) < 0 && d.repair === null, 'centres 3 apart in a perimeter of 4: UNWITNESSED, and no shrinking of radii repairs it — the repair is refused');
  const e = D.circles([[r('0'), r('0'), r('0.6')], [r('1.2'), r('0'), r('0.6')]]);   /* w + h = 2.4 + 1.2: the box overflows through the radii only */
  red(!e.witnessed && e.repair && Q.sign(e.repair.boxSlack) >= 0 && Q.cmp(e.repair.lambda, Q.R(1n)) < 0, 'a box that overflows through the radii is repaired by shrinking them until it fits');
}

/* ---- Heilbronn ---- */
{
  const sq = D.heilbronn([[r('0'), r('0')], [r('1'), r('0')], [r('1'), r('1')], [r('0'), r('1')]]);
  ok(sq.witnessed && eq(sq.score, Q.R(1n, 2n)) && sq.hullVertices === 4, 'the unit square: min triangle / hull = 1/2 exactly');
  const col = D.heilbronn([[r('0'), r('0')], [r('1'), r('0')], [r('2'), r('0')], [r('0'), r('1')]]);
  red(!col.witnessed && Q.sign(col.minArea) === 0, 'a collinear triple gives a zero triangle and is UNWITNESSED');
}

/* ---- min distance ratio ---- */
{
  const t = D.mindist([[r('0'), r('0')], [r('1'), r('0')], [r('0'), r('1')]]);
  ok(t.witnessed && eq(t.score, Q.R(2n)), 'a right isosceles triangle: (max/min)² = 2 exactly');
  const dup = D.mindist([[r('0'), r('0')], [r('0'), r('0')], [r('1'), r('1')]]);
  red(!dup.witnessed && dup.score === null, 'a repeated point is refused, not scored');
}

/* ---- minimum overlap ---- */
{
  const a = D.overlap([r('1'), r('0')]);
  ok(a.witnessed && eq(a.bound, Q.R(1n)), 'h = (1, 0): Σh = n/2 exactly, bound 1');
  const b = D.overlap([r('1.5'), r('0')]);
  red(!b.inRange && !b.witnessed && !b.repair, 'a value above 1 is out of range and not repaired');
  const c = D.overlap([r('0.6'), r('0.6')]);
  red(!c.witnessed && c.repair && eq(c.repair.bound, Q.R(1n, 2n)), 'Σh ≠ n/2 is REPAIRED by renormalisation (bound ½ after scaling to (½, ½))');
}

/* ---- edges vs triangles ---- */
{
  const one = D.edges([[r('1')].concat(Array(19).fill(r('0')))]);
  ok(eq(one.score, Q.R(-65n, 6n)), 'a single degenerate row reproduces the platform\'s closed-form −(5/6 + 10)');
  red((() => { try { D.edges([Array(20).fill(r('0'))]); return false; } catch (e) { return true; } })(), 'a row summing to zero is refused');
}

/* ---- the first autocorrelation inequality ---- */
{
  const a = D.autocorr([r('1'), r('1')]);
  ok(a.witnessed && eq(a.C1, Q.R(2n)) && a.argmax === 1, 'f ≡ 1 on two steps: C₁ = 2 exactly, the peak at the middle');
  const n = 2000; const ones = Array(n).fill(r('1'));
  const b = D.autocorr(ones);
  ok(b.witnessed && b.argmax === n - 1 && eq(b.C1, Q.R(2n)), 'f ≡ 1 on 2,000 steps: the screen finds the peak and the exact value is 2');
  red(!D.autocorr([r('1'), r('-0.5')]).witnessed, 'a negative value is refused');
  /* the screen must keep every index within the error bound: a flat plateau of equal peaks */
  const c = D.autocorr([r('1'), r('0'), r('1')]);
  ok(c.candidates >= 1 && eq(c.C1, Q.R(6n * 2n, 4n)), 'a two-peak autoconvolution: the exact maximum is decided among the candidates');
}

/* ---- flat polynomials: the supremum certified ---- */
{
  const g = D.flat([1n, 1n]);                                  /* 1 + z: |g|² = 2 + 2cosθ, sup 4, C⁺ = 2/√3 */
  ok(g.witnessed && Q.cmp(g.maxSq[0], Q.R(4n)) <= 0 && Q.cmp(g.maxSq[1], Q.R(4n)) >= 0, '1 + z: the certified sup of |g|² encloses 4');
  ok(Q.cmp(Q.mul(g.Cplus[0], g.Cplus[0]), Q.R(4n, 3n)) <= 0 && Q.cmp(Q.mul(g.Cplus[1], g.Cplus[1]), Q.R(4n, 3n)) >= 0, '1 + z: the C⁺ enclosure contains 2/√3');
  red(!D.flat([1n, 2n]).witnessed, 'a coefficient that is not ±1 is refused');
}

/* ---- the shipped record ---- */
const CERT = path.join(ROOT, 'certs', 'easota-ledger.json');
if (fs.existsSync(CERT)) {
  const led = JSON.parse(fs.readFileSync(CERT, 'utf8'));
  ok(Array.isArray(led.rows) && led.rows.length === 18, 'ledger has its 18 rows');
  const tally = {}; for (const x of led.rows) tally[x.verdict] = (tally[x.verdict] || 0) + 1;
  ok(tally.WITNESSED === 14 && tally.REPAIRED === 4 && !tally.UNWITNESSED, 'ledger: 14 WITNESSED, 4 REPAIRED, none UNWITNESSED');
  ok(led.improvements.length === 7 && led.improvements.every((i) => i.sign > 0), 'ledger: all seven improvements over the previous best are real (exact positive signs)');
  const flt = led.rows.filter((x) => x.problem === 'flat-polynomials');
  ok(flt.length === 2 && flt.every((x) => Number(x.detail.gridShortfall) > 0 && x.printedAgrees), 'ledger: both flat-polynomial grid scores fall short of the certified supremum, and both printed roundings stand');
  const cir = led.rows.find((x) => x.id === 'circles/ours_2026');
  ok(cir && cir.verdict === 'REPAIRED' && cir.repair && cir.printedAgrees === false && cir.asPublished.overlappingPairs > 0, 'ledger: the Together circles are REPAIRED and their printed tenth digit is not the exact witness\'s');
  ok(led.rows.filter((x) => x.printed).every((x) => x.id === 'circles/ours_2026' || x.printedAgrees === true), 'ledger: every other printed value is the exact value\'s rounding or ceiling');
  /* the pins */
  const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
  ok(Object.entries(meta.files).every(([rel, m]) => crypto.createHash('sha256').update(fs.readFileSync(path.join(L.CORPUS, rel))).digest('hex') === m.sha256), 'every pinned file hashes to its digest');
  /* one row re-decided live from the pinned bytes */
  const live = D.heilbronn(L.loaders.points('heilbronn-convex/ours_2026.json', 'points'));
  const hei = led.rows.find((x) => x.id === 'heilbronn/ours_2026');
  ok(Q.toString(live.score) === hei.exactRational, 'live: the Together Heilbronn score re-decides to the recorded rational');
} else {
  console.error('note: certs/easota-ledger.json not present yet (pre-ledger run)');
}

console.log(`easota battery: ${pass} pass, ${fail} fail, ${redsFired}/${reds} red controls fired`);
process.exit(fail ? 1 : 0);
