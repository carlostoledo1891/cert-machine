#!/usr/bin/env node
/* run-sublevel-campaign.js — the Tao #179 sublevel campaign, executed in full.
   tools/ · cert-machine

   Target: teorth/erdosproblems#179 (on Erdős #1038). Over discrete
   probability measures on [-1,1], Tao conjectures sup |{U_mu < 0}| =
   2*sqrt(2), attained by the uniform measure on {-1,+1}. Rational-weight
   measures with denominator N are exactly monic degree-N polynomials with
   roots in [-1,1] via |q| < 1. This campaign:

     - certifies the witness and the classical calibrations;
     - sweeps root-configuration grids for certified LOWER-bound records,
       including the interior cubic champion and the quintic family peak at
       the topological transition;
     - proves PER-DEGREE THEOREMS by branch-and-bound with the certified
       min-product box bound: for odd degrees the whole degree falls
       strictly below 2*sqrt(2); for even degrees the supremum is localized
       to [2*sqrt(2), 2.82845] with the attaining witness (x^2-1)^{N/2}.

   Writes certs/sublevel-tao179.json. Every number is an enclosure or an
   exact rational; the branch-and-bound certificates state their box counts.

   usage: node tools/run-sublevel-campaign.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'instruments/sublevel/measure.js'));
const B = require(path.join(ROOT, 'instruments/sublevel/bound.js'));
const Q = require(path.join(ROOT, 'instruments/interval/rational.js'));

const t0 = Date.now();
const die = (m) => { console.error('SUBLEVEL CAMPAIGN REFUSED: ' + m); process.exit(1); };
const enc = (r) => ({ lo: r.lo.n + '/' + r.lo.d, hi: r.hi.n + '/' + r.hi.d, loD: r.loD, hiD: r.hiD });

/* ---- calibrations --------------------------------------------------------- */
const wit = M.sublevelMeasure([{ n: 1n, m: 1 }, { n: -1n, m: 1 }], 1n);
const s8 = M.twoSqrtTwo(60);
if (!(Q.cmp(wit.lo, s8.lo) <= 0 && Q.cmp(s8.hi, wit.hi) <= 0)) die('the witness does not enclose 2*sqrt(2)');
const cal2 = M.sublevelMeasure([{ n: 0n, m: 2 }], 1n);
if (!(cal2.loD < 2 && 2 < cal2.hiD)) die('x^2 calibration moved');

/* ---- grid sweeps: certified lower-bound records --------------------------- */
function sweep(n, dNum) {
  const d = BigInt(dNum);
  const vals = []; for (let v = -dNum; v <= dNum; v++) vals.push(BigInt(v));
  let best = null, count = 0;
  const rec = (idx, start) => {
    if (idx.length === n) {
      if (idx.reduce((s, i) => s + vals[i], 0n) < 0n) return;
      const mm = new Map();
      for (const i of idx) mm.set(vals[i], (mm.get(vals[i]) || 0) + 1);
      const r = M.sublevelMeasure([...mm.entries()].map(([nn, m2]) => ({ n: nn, m: m2 })), d);
      count++;
      if (!best || r.hiD > best.hiD) best = { ...enc(r), roots: idx.map(i => String(vals[i])).join(','), d: dNum };
      return;
    }
    for (let i = start; i < vals.length; i++) { idx.push(i); rec(idx, i); idx.pop(); }
  };
  rec([], 0);
  return { count, best };
}
const sweeps = { 'n=3 d=8': sweep(3, 8), 'n=4 d=4': sweep(4, 4), 'n=5 d=2': sweep(5, 2) };

/* refinements: the interior cubic champion and the quintic transition peak */
const cubicChampion = enc(M.sublevelMeasure([{ n: -256n, m: 1 }, { n: 201n, m: 1 }, { n: 256n, m: 1 }], 256n));
const quinticPeak = enc(M.sublevelMeasure([{ n: -1024n, m: 2 }, { n: 1024n, m: 2 }, { n: 905n, m: 1 }], 1024n));

/* ---- the incremental record writer ---------------------------------------- */
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
function writeRecord() {
  const done = Object.keys(theorems).filter(k => !theorems[k].failed);
  const oddDone = done.filter(k => theorems[k].n % 2 === 1).map(k => theorems[k].n).sort();
  const evenDone = done.filter(k => theorems[k].n % 2 === 0).map(k => theorems[k].n).sort();
  const record = {
    what: 'The Tao #179 sublevel campaign (Erdős #1038, supremum side). Rational-weight discrete measures '
      + 'on [-1,1] with denominator N are monic degree-N polynomials with roots in [-1,1]; this record holds '
      + 'certified sublevel measures |{|q|<1}| (lower-bound witnesses for the conjectured sup 2*sqrt(2)), '
      + 'certified grid champions, and per-degree branch-and-bound THEOREMS: odd degrees ' + oddDone.join(', ')
      + ' fall strictly below 2.82 < 2*sqrt(2); even degrees ' + evenDone.join(', ')
      + ' have supremum in [2*sqrt(2), 2.82845], the left end attained by (x^2-1)^{N/2}. A degree marked '
      + 'failed was ATTEMPTED and is open, not silently dropped. Every measure is an exact outward enclosure '
      + 'from BigInt Sturm root isolation; every branch-and-bound pruning uses the certified min-product box '
      + 'bound (calibrated: thin boxes reproduce measures to all printed digits).',
    provenance: 'Conjecture and framing: T. Tao, teorth/erdosproblems#179 (Dec 2025), on erdosproblems.com #1038. '
      + 'The infimum side was resolved by Darvas-Peng-Tao (2026); this campaign addresses the supremum side only.',
    witness: { config: '(x^2-1): uniform measure on {-1,+1}', measure: enc(wit), equals: '2*sqrt(2), certified' },
    sweeps: Object.fromEntries(Object.entries(sweeps).map(([k, v]) => [k, { configs: v.count, champion: v.best }])),
    cubicChampion: { config: '(-1, 201/256, 1)', measure: cubicChampion, note: 'interior critical root — the degree-3 supremum is NOT at a lattice point and sits near 2.7542' },
    quinticPeak: { config: '(-1 dbl, 905/1024, 1 dbl)', measure: quinticPeak, note: 'the family (x^2-1)^2(x-r) peaks at a topological transition of the sublevel set near r = 905/1024, then drops discontinuously' },
    theorems,
    meta: { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0 }
  };
  fs.writeFileSync(path.join(ROOT, 'certs', 'sublevel-tao179.json'), JSON.stringify(record, null, 1) + '\n');
}

/* ---- the theorems ---------------------------------------------------------
   INCREMENTAL AND FAILURE-TOLERANT (lesson from the first monolithic run,
   which spent 90 minutes in a heavy degree with nothing written): the record
   is (re)written after EVERY stage, every degree is caught, and every budget
   is bounded — a degree that exhausts its budget is recorded as attempted
   and open, and the campaign moves on. */
const T_ODD = Q.R(141n, 50n);           /* 2.82  < 2*sqrt(2) = 2.8284271... */
const T_EVEN = Q.R(56569n, 20000n);     /* 2.82845, just above 2*sqrt(2)   */
const theorems = {};
const run = (n, T, tag, opts) => {
  const t = Date.now();
  try {
    const r = B.bnb(n, T, opts);
    theorems[tag] = { n, T: T.n + '/' + T.d, TD: Q.toDouble(T), leaves: r.leaves, explored: r.explored, maxDepth: r.maxDepthSeen, ms: Date.now() - t };
    console.log('  ' + tag + ': CERTIFIED (' + r.explored + ' boxes, ' + (Date.now() - t) + ' ms)');
  } catch (e) {
    theorems['deg' + n] = { n, failed: e.message.slice(0, 140), ms: Date.now() - t };
    console.log('  deg' + n + ': OPEN (' + e.message.slice(0, 60) + ')');
  }
  writeRecord();
};
run(3, T_ODD, 'deg3 < 2.82', { maxDepth: 40, maxBoxes: 500000 });
run(5, T_ODD, 'deg5 < 2.82', { maxDepth: 70, maxBoxes: 3000000 });
run(7, T_ODD, 'deg7 < 2.82', { maxDepth: 100, maxBoxes: 5000000 });
run(4, T_EVEN, 'deg4 sup in [2sqrt2, 2.82845]', { maxDepth: 120, maxBoxes: 3000000 });
run(6, T_EVEN, 'deg6 sup in [2sqrt2, 2.82845]', { maxDepth: 160, maxBoxes: 3000000 });
run(8, T_EVEN, 'deg8 sup in [2sqrt2, 2.82845]', { maxDepth: 200, maxBoxes: 1500000 });
run(9, T_ODD, 'deg9 < 2.82', { maxDepth: 160, maxBoxes: 1500000 });
const deg8ok = Object.keys(theorems).some(k => k.startsWith('deg8') && !theorems[k].failed);
const deg9ok = Object.keys(theorems).some(k => k.startsWith('deg9') && !theorems[k].failed);

/* ---- the record (final rewrite; writeRecord ran after every stage) -------- */
writeRecord();
console.log('certs/sublevel-tao179.json written');
console.log('  witness 2*sqrt(2) certified; sweeps: ' + Object.values(sweeps).map(s => s.count).reduce((a, b) => a + b, 0) + ' configs');
console.log('  theorems: ' + Object.keys(theorems).filter(k => !theorems[k].failed).join(' · '));
console.log('  ' + (Date.now() - t0) + ' ms');
