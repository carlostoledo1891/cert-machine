#!/usr/bin/env node
/* test-engine.js — the engine's gate. Red controls only where a wrong answer
   would be invisible: a screen that admits, a certifier that can be forged, a
   refutation that cannot fail. Nothing else is gated. */
'use strict';
const path = require('path'); const ROOT = path.resolve(__dirname, '..');
const { run, relations } = require(path.join(ROOT, 'machine/engine.js'));
const NEW = require(path.join(ROOT, 'families/newman.js'));
const COS = require(path.join(ROOT, 'families/cosine.js'));
const N = require(path.join(ROOT, 'instruments/trigmin/newman.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* the screen may prune, never admit: everything it prunes must really fail */
{
  let checked = 0, leaked = 0;
  for (let i = 0; i < 4000 && checked < 60; i++) {
    const A = NEW.enumerate(i); const v = NEW.value(A);
    if (NEW.interesting(A, v)) continue;
    checked++;
    if (NEW.certify(A).verdict === 'HIT') leaked++;
  }
  ok(checked > 0 && leaked === 0, 'newman screen: ' + checked + ' pruned candidates, ' + leaked + ' would have certified HIT (must be 0)');
}
/* the certifier reproduces the literature */
{
  const c = N.certifyNewman([0,1,2,6,9], { bar: 0 });
  ok(c.modSq[0] === 1 && c.modSq[1] === 1, 'M(0,1,2,6,9) certified as exactly [1,1] (Mercer 2019)');
  const b = N.certifyNewman([0,1,2,3,4,7,8,10,12], { bar: 0 });
  ok(Math.abs(b.modulus[0] - 1.362373178133324) < 1e-14, 'Boyd degree-12 witness reproduces at 1.36237 (' + b.modulus[0].toFixed(12) + ')');
}
/* RED: a forged certificate must be refused by the independent recompute */
{
  const A = [0,6,9,10,17,24];
  const c = N.certifyNewman(A, { bar: 0 });
  ok(N.recheckNewman(A, c) === true, 'RED control: the honest certificate passes the recompute');
  const forged = JSON.parse(JSON.stringify(c)); forged.modSq = [9, 9.001];
  ok(N.recheckNewman(A, forged) === false, 'RED: a certificate with its floor forged to 9 is REFUSED');
  const sab = N.certifyNewman(A, { bar: 0, sabotage: 'narrow' });
  ok(N.recheckNewman(A, sab) === false, 'RED: an enclosure narrowed to its own midpoint is REFUSED (only dense sampling catches this)');
}
/* RED: a refutation must be able to fail — a form INSIDE the enclosure survives */
{
  const r = relations([0.4999999, 0.5000001], { maxDen: 8 });
  const half = r.candidates.find(x => x.label === '1/2');
  ok(!!half, 'RED control: 1/2 inside a wide enclosure SURVIVES as a candidate (the test can fail to refute)');
  const tight = relations([0.5100000000001, 0.5100000000002], { maxDen: 8 });
  ok(tight.candidates.length === 0 && tight.refuted > 0, 'RED: against a tight enclosure at 0.51, all ' + tight.refuted + ' forms are refuted exactly');
}
/* the engine loop itself */
{
  const r = run(COS, { limit: 3000, maxCertify: 8 });
  ok(r.counts.generated === 3000, 'engine generated every index it was given');
  ok(r.counts.certified <= 8, 'engine honoured the certify cap (' + r.counts.certified + ')');
  ok(r.counts.screened >= r.counts.certified, 'nothing was certified that the screen did not pass');
  const r2 = run(COS, { limit: 3000, maxCertify: 8 });
  ok(JSON.stringify(r.hits.map(h => h.key)) === JSON.stringify(r2.hits.map(h => h.key)), 'two runs at the same limit give identical hits — the enumeration is deterministic');
}
/* CALIBRATION against ground truth. This is not decoration: its first run
   caught the engine REFUTING sqrt(2) as a closed form for the decimal expansion
   of sqrt(2), because the enclosure was built narrower than a double can
   represent and excluded the true value. A refutation engine that can refute a
   truth is worse than no engine. Zero false refutations is the bar. */
{
  const OE = require(path.join(ROOT, 'families/oeis-closedform.js'));
  const truth = [['A000796','pi'],['A001113','e'],['A002193','sqrt2'],['A001622','phi'],
                 ['A002162','ln2'],['A002194','sqrt3'],['A003881','pi'],['A019692','pi']];
  const byId = {};
  for (let i = 0; ; i++) { const e = OE.enumerate(i); if (!e) break;
    if (!OE.interesting(e)) continue; const c = OE.certify(e);
    if (c.extra && c.extra.survivors) byId[c.extra.id] = c.extra.survivors.map(s => s.label); }
  let falseRefutations = 0, checked = 0;
  for (const [id, form] of truth) {
    if (!byId[id]) continue;
    checked++;
    if (!byId[id].some(l => l.includes(form))) falseRefutations++;
  }
  ok(checked >= 6, 'calibration reached ' + checked + ' ground-truth constants in the corpus');
  ok(falseRefutations === 0, 'ZERO false refutations: every constant whose closed form we know keeps it (' + falseRefutations + ' failures)');

  /* RED: the check must be able to fail — a deliberately over-narrow enclosure
     must refute a truth, which is exactly the bug it was written for. */
  const { relations } = require(path.join(ROOT, 'machine/engine.js'));
  const thin = relations([Math.SQRT2 * (1 + 1e-15), Math.SQRT2 * (1 + 1.1e-15)], { maxDen: 8 });
  const kept = thin.candidates.some(c => c.label.includes('sqrt'));
  ok(!kept && thin.refuted > 0, 'RED: an enclosure shifted off sqrt(2) refutes it — the calibration can fail');
}

console.log('');
console.log('engine battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
