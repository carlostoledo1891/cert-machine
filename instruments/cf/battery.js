#!/usr/bin/env node
/* battery.js — the continued-fraction instrument's gate.

   Calibration against identities with proofs on record (Brouncker's pi/4,
   Euler's e-1): a false refutation of a truth is the sqrt(2) lesson all
   over again, and this battery exists to keep it caught. Red controls: a
   shifted form must be refuted, a sign violation and an exactness overflow
   must be refused, and every corpus normalization is float-checked against
   its claimed value so a transcription error cannot sit quietly. */
'use strict';

const { enclose, decide } = require('#instruments/cf/cf.js');
const FAM = require('#families/ramanujan-audit.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

const brouncker = { b0: 0, a: n => (n === 1 ? 1 : (n - 1) * (n - 1)), b: n => 2 * n - 1 };

/* ---- calibration: proved identities must survive ---- */
{
  const e = enclose(brouncker, 4000);
  ok(e.ok && e.enclosure[0] <= Math.PI / 4 && Math.PI / 4 <= e.enclosure[1] && e.width < 1e-14,
    'Brouncker: pi/4 inside a rigorous enclosure of width ' + (e.ok ? e.width.toExponential(2) : '-'));
  const ecf = { b0: 1, a: n => n + 1, b: n => n + 1 };
  const ee = enclose(ecf, 60);
  ok(ee.ok && ee.enclosure[0] <= Math.E - 1 && Math.E - 1 <= ee.enclosure[1],
    'Euler: e-1 inside its enclosure (width ' + (ee.ok ? ee.width.toExponential(2) : '-') + ')');
  ok(decide(brouncker, { K: 'pi', u: [0, 1], v: [1, 4] }, 4000).verdict === 'SURVIVES',
    'the true form pi/4 SURVIVES the decision');
}

/* ---- RED: the refutation path must fire, and only on falsehood ---- */
{
  const d = decide(brouncker, { K: 'pi', u: [1, 1000000], v: [1, 4] }, 4000);
  ok(d.verdict === 'REFUTED', 'RED: pi/4 + 1e-6 is REFUTED exactly — the audit can fire');
  const sab = enclose({ b0: 0, a: n => (n === 3 ? -4 : n), b: n => n + 1 }, 100);
  ok(!sab.ok && /a_3/.test(sab.why), 'RED: a negative partial numerator is REFUSED, not iterated over (' + sab.why.slice(0, 40) + '…)');
  const big = enclose({ b0: 0, a: n => 2 ** 60, b: n => n }, 10);
  ok(!big.ok && /2\^53/.test(big.why), 'RED: a coefficient past 2^53 is REFUSED — exactness is checked, not assumed');
}

/* ---- every corpus normalization float-checks against its claimed value ---- */
{
  const target = { 'rm-e-a': Math.E / 2 - 1, 'rm-e-b': Math.E / 2 - 1, 'rm-e-c': Math.E - 1,
    'rm-pi-a': Math.PI / 4, 'rm-pi-b': Math.PI / 4 - 0.5 };
  let checked = 0, bad = 0;
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    if (o.minusCF) continue;
    checked++;
    if (Math.abs(FAM.value(o) - target[o.id]) > 1e-12) { bad++; console.log('  normalization off: ' + o.id); }
  }
  ok(checked === 5 && bad === 0, 'all ' + checked + ' sign-normalizations agree with their claimed values in float (transcription guard)');
}

/* ---- the family end-to-end: every positive entry survives, minus-CFs refuse ---- */
{
  let hits = 0, refused = 0, rejects = 0;
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    const c = FAM.certify(o);
    if (c.verdict === 'HIT') hits++;
    else if (c.verdict === 'REFUSED') refused++;
    else rejects++;
  }
  ok(hits === 5 && rejects === 0, 'all 5 positive-CF conjectures SURVIVE their audit (' + hits + ' hits, ' + rejects + ' refutations)');
  ok(refused === 4, 'the 4 zeta(3) minus-CFs are honestly REFUSED pending the tail-lemma evaluator (' + refused + ')');
}

console.log('');
console.log('cf battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
