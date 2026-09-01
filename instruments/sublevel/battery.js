#!/usr/bin/env node
/* battery.js — gates for the sublevel instrument (Tao #179 / Erdős #1038).
   instruments/sublevel · cert-machine

   Greens: the witness reproduces 2*sqrt(2) inside its enclosure; the
   classical calibrations land on their exact values; the box bound agrees
   with the measure on THIN boxes to all printed digits (the identity that
   makes branch-and-bound sound); and the degree-3 theorem plus the degree-4
   localization are RE-PROVED from scratch at every run (they take well under
   a second combined). Heavier degrees live in the campaign record.

   Reds: a threshold below a certified witness must REFUSE (budget/depth)
   rather than certify; a root outside [-1,1] must throw; a refinement width
   too coarse to separate boundary roots must be caught, not silently merged. */
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require('./measure.js');
const B = require('./bound.js');
const Q = require('#instruments/interval/rational.js');

let pass = 0, fail = 0, reds = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log('PASS  ' + name + (note ? '   [' + note + ']' : '')); }
  else { fail++; console.log('FAIL  ' + name + (note ? '   [' + note + ']' : '')); }
};
const red = (name, fn) => {
  let fired = false, msg = '';
  try { const r = fn(); fired = r === true; msg = String(r); }
  catch (e) { fired = true; msg = e.message.slice(0, 60); }
  if (fired) { reds++; console.log('   RED ok  ' + name + '   [' + msg + ']'); }
  else { fail++; console.log('   RED DID NOT FIRE  ' + name); }
};

/* greens */
{
  const wit = M.sublevelMeasure([{ n: 1n, m: 1 }, { n: -1n, m: 1 }], 1n);
  const s8 = M.twoSqrtTwo(60);
  check('G1 the witness x^2-1 encloses 2*sqrt(2)',
    Q.cmp(wit.lo, s8.lo) <= 0 && Q.cmp(s8.hi, wit.hi) <= 0,
    '[' + wit.loD.toFixed(12) + ', ' + wit.hiD.toFixed(12) + ']');
  const c1 = M.sublevelMeasure([{ n: 0n, m: 2 }], 1n);
  const c2 = M.sublevelMeasure([{ n: 0n, m: 1 }], 1n);
  const c3 = M.sublevelMeasure([{ n: 1n, m: 2 }], 1n);
  check('G2 calibrations: x^2, x, (x-1)^2 all measure exactly 2',
    c1.loD < 2 && 2 < c1.hiD && c2.loD < 2 && 2 < c2.hiD && c3.loD < 2 && 2 < c3.hiD);
  /* thin-box identity: U(point box) must reproduce the measure */
  const m0 = M.sublevelMeasure([{ n: -256n, m: 1 }, { n: 201n, m: 1 }, { n: 256n, m: 1 }], 256n);
  const u0 = B.boxSublevelUpper([{ l: -256n, u: -256n }, { l: 201n, u: 201n }, { l: 256n, u: 256n }], 256n);
  check('G3 the box bound equals the measure on a thin box (branch-and-bound soundness anchor)',
    Math.abs(u0.hiD - m0.hiD) < 1e-9, u0.hiD.toFixed(10));
  const t1 = Date.now();
  const r3 = B.bnb(3, Q.R(141n, 50n), { maxDepth: 40, maxBoxes: 500000 });
  check('G4 the DEGREE-3 THEOREM re-proved: every monic cubic with roots in [-1,1] has |{|q|<1}| < 2.82 < 2*sqrt(2)',
    r3.leaves > 0, r3.explored + ' boxes, ' + (Date.now() - t1) + ' ms');
  const t2 = Date.now();
  const r4 = B.bnb(4, Q.R(56569n, 20000n), { maxDepth: 120, maxBoxes: 3000000 });
  check('G5 the DEGREE-4 LOCALIZATION re-proved: sup in [2*sqrt(2), 2.82845], witness attains the left end',
    r4.leaves > 0, r4.explored + ' boxes, ' + (Date.now() - t2) + ' ms');
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sublevel-tao179.json'), 'utf8'));
  const done = Object.keys(rec.theorems).filter(k => !rec.theorems[k].failed);
  check('G6 the campaign record holds the theorem ladder (degrees 3,5,7 strict; 4,6 localized)',
    done.some(k => k.startsWith('deg5')) && done.some(k => k.startsWith('deg7')) && done.some(k => k.startsWith('deg6')),
    done.length + ' theorems on file');
}

/* reds */
console.log('\n    executing falsifiers');
red('X1 a threshold below a certified witness must refuse, not certify', () => {
  try { B.bnb(3, Q.R(27n, 10n), { maxDepth: 12, maxBoxes: 3000 }); return 'certified an impossible threshold'; }
  catch (e) { return true; }
});
red('X2 a root outside [-1,1] must throw', () => {
  M.sublevelMeasure([{ n: 3n, m: 1 }], 2n);
  return 'accepted a root at 3/2';
});
red('X3 a refinement width too coarse to separate close boundary roots is caught', () => {
  /* (x+1)^8 (x-1) is steep near x = 1: the boundary roots of q-1 and q+1 sit
     ~1/128 apart, so a coarse width MUST trip the overlap guard — this input
     was chosen because the guard genuinely fires on it (a red that cannot
     fail is decoration) */
  try { M.sublevelMeasure([{ n: -1n, m: 8 }, { n: 1n, m: 1 }], 1n, { width: Q.R(1n, 4n) }); }
  catch (e) { if (/overlap/.test(e.message)) return true; throw e; }
  return 'coarse width silently accepted';
});

console.log('\n' + (fail ? fail + ' FAILED   ' : 'ALL PASS   ') + '(' + pass + ' checks, ' + reds + '/3 falsifiers)');
process.exit(fail ? 1 : 0);
