/* battery.js — the forecast instrument's gate: the coverage theorem
   verified by exact enumeration, hand-computed scores, reds that must
   fire. Run: node instruments/forecast/battery.js  (exit != 0 on any
   failure).  instruments/forecast · cert-machine                          */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { interval, countCoverage } = require('./conformal.js');
const L = require('./ledger.js');

let n = 0, reds = 0;
const ok = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
const red = (name, fn) => { fn(); reds++; console.log('PASS ' + name + ' (RED ok)'); };

/* ---- conformal: the rank lemma by exact enumeration ----------------------- */
ok('rank lemma enumerated: n=4 calib {10,20,30,40}, every insertion slot counted', () => {
  const cert = interval([10, 20, 30, 40], 1, 2);      /* alpha = 1/2 */
  assert.strictEqual(cert.verdict, 'CERTIFIED-COVERAGE');
  /* the five equiprobable rank slots for an exchangeable 5th value are
     represented by test points 5,15,25,35,45 — count coverage exactly */
  const got = countCoverage([5, 15, 25, 35, 45], cert.lo.map(String), cert.hi.map(String));
  assert.strictEqual(got.total, 5);
  assert.strictEqual(String(cert.coverage[0]), String(BigInt(got.inside)),
    'counted coverage ' + got.inside + '/5 must equal the certified ' + cert.coverageStr);
});

ok('known answer: n=9, alpha=1/5 -> [X_(1), X_(9)], coverage exactly 8/10', () => {
  const cert = interval([10, 20, 30, 40, 50, 60, 70, 80, 90], 1, 5);
  assert.strictEqual(cert.verdict, 'CERTIFIED-COVERAGE');
  assert.strictEqual(cert.coverageStr, '8/10');
  assert.strictEqual(cert.loStr, '10');
  assert.strictEqual(cert.hiStr, '90');
});

ok('REFUSES an unprovable claim: n=9 cannot prove miss-rate 1/10', () => {
  const cert = interval([1, 2, 3, 4, 5, 6, 7, 8, 9], 1, 10);
  assert.strictEqual(cert.verdict, 'REFUSED');
  assert.ok(/2\/\(n\+1\)|2\/10/.test(cert.why), 'the refusal names the smallest provable miss-rate');
});

ok('certified coverage is never below 1 - alpha (sweep n = 3..40, four alphas)', () => {
  for (let m = 3; m <= 40; m++) {
    const vals = Array.from({ length: m }, (_, i) => (i + 1) * 7);
    for (const [aN, aD] of [[1, 2], [1, 4], [1, 5], [1, 10]]) {
      const c = interval(vals, aN, aD);
      if (c.verdict !== 'CERTIFIED-COVERAGE') continue;
      /* (covNum/covDen) >= 1 - aN/aD  <=>  covNum*aD >= covDen*(aD-aN) */
      assert.ok(BigInt(c.coverage[0]) * BigInt(aD) >= BigInt(c.coverage[1]) * BigInt(aD - aN),
        'n=' + m + ' alpha=' + aN + '/' + aD + ' gave ' + c.coverageStr);
      assert.ok(c.l >= 1 && c.u <= m && c.l < c.u, 'order-stat indices in range');
    }
  }
});

/* ---- ledger: hand-computed scoring ---------------------------------------- */
const tmp = () => path.join(os.tmpdir(), 'forecast-battery-' + Math.random().toString(36).slice(2) + '.jsonl');

ok('Winkler score hand-computed: [10,20] alpha 1/4, y=26 -> 58; y=15 -> 10; both exact', () => {
  const p = tmp();
  const f = { lo: 10, hi: 20, alpha: [1, 4] };
  L.commit(p, { id: 'a', domain: 't', target: 'x', madeAt: 100, targetTime: 200, forecast: f });
  L.commit(p, { id: 'b', domain: 't', target: 'x', madeAt: 100, targetTime: 200, forecast: f });
  const miss = L.score(p, 'a', 26, { at: 300 });          /* 10 + 8*6 = 58 */
  assert.strictEqual(miss.winkler, '58');
  assert.strictEqual(miss.covered, false);
  const hit = L.score(p, 'b', 15, { at: 300 });
  assert.strictEqual(hit.winkler, '10');
  assert.strictEqual(hit.covered, true);
  const rec = L.record(p);
  assert.deepStrictEqual(rec, { commits: 2, scored: 2, covered: 1 });
  fs.rmSync(p);
});

red('RED: a backdated commit (madeAt >= targetTime) is REFUSED', () => {
  const p = tmp();
  assert.throws(() => L.commit(p, { id: 'x', domain: 't', target: 'x', madeAt: 200, targetTime: 200,
    forecast: { lo: 0, hi: 1, alpha: [1, 2] } }), /backdated/);
  fs.rmSync(p, { force: true });
});

red('RED: premature scoring (before targetTime) is REFUSED', () => {
  const p = tmp();
  L.commit(p, { id: 'x', domain: 't', target: 'x', madeAt: 100, targetTime: 200, forecast: { lo: 0, hi: 1, alpha: [1, 2] } });
  assert.throws(() => L.score(p, 'x', 0, { at: 199 }), /premature/);
  fs.rmSync(p);
});

red('RED: a sealed commit revealed with tampered bytes is REFUSED', () => {
  const p = tmp();
  L.commit(p, { id: 'x', domain: 't', target: 'x', madeAt: 100, targetTime: 200,
    forecast: { lo: 10, hi: 20, alpha: [1, 4] }, sealed: true });
  assert.throws(() => L.score(p, 'x', 15, { at: 300, revealedForecast: { lo: 10, hi: 21, alpha: [1, 4] } }), /tampered/);
  /* and the honest reveal scores fine */
  const s = L.score(p, 'x', 15, { at: 300, revealedForecast: { lo: 10, hi: 20, alpha: [1, 4] } });
  assert.strictEqual(s.winkler, '10');
  fs.rmSync(p);
});

red('RED: rescoring is REFUSED — the ledger never rewrites a result', () => {
  const p = tmp();
  L.commit(p, { id: 'x', domain: 't', target: 'x', madeAt: 100, targetTime: 200, forecast: { lo: 0, hi: 10, alpha: [1, 2] } });
  const before = fs.readFileSync(p, 'utf8');
  L.score(p, 'x', 5, { at: 300 });
  assert.ok(fs.readFileSync(p, 'utf8').startsWith(before), 'append-only: old bytes untouched');
  assert.throws(() => L.score(p, 'x', 6, { at: 400 }), /already scored/);
  fs.rmSync(p);
});

/* ---- admission: the prune rule, hand-computed ----------------------------- */
const A = require('./admission.js');

ok('binomial tail hand-computed: claim 1/2, 1 of 4 covered -> tail exactly 5/16', () => {
  assert.strictEqual(A.binomialTail(1, 4, 1, 2).join('/'), '5/16');   /* (C(4,0)+C(4,1))/16 */
  assert.strictEqual(A.binomialTail(0, 3, 9, 10).join('/'), '1/1000');
  assert.strictEqual(A.binomialTail(5, 5, 1, 2).join('/'), '1/1');    /* full tail = 1 */
});

ok('admission by record only: empty record ADMITTED; honest 50%-claimer with 1/4 stays', () => {
  assert.strictEqual(A.admit({ claim: [1, 2], scored: 0, covered: 0 }).status, 'ADMITTED');
  const a = A.admit({ claim: [1, 2], scored: 4, covered: 1 });        /* tail 5/16 > 1/20 */
  assert.strictEqual(a.status, 'ADMITTED');
  assert.strictEqual(a.tailStr, '5/16');
});

red('RED: a 90%-claimer covering 0 of 3 is DEADMITTED with the exact tail 1/1000', () => {
  const v = A.admit({ claim: [9, 10], scored: 3, covered: 0 });
  assert.strictEqual(v.status, 'DEADMITTED');
  assert.strictEqual(v.tailStr, '1/1000');
  assert.ok(/computed exactly/.test(v.text));
});

console.log('ALL PASS: ' + n + ' checks, ' + reds + ' reds fired');
