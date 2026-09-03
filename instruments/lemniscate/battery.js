#!/usr/bin/env node
/* instruments/lemniscate/battery.js — the Erdős #1038 infimum program's battery.

   Checks walk the shipped record; RED CONTROLS are genuine source mutations —
   a constant is moved to the wrong side, the mutant is run, and it MUST fail.
   Mutants are written beside the originals (so their relative requires still
   resolve) under .mutant-* names, redirected to throwaway outputs, and removed
   in a finally block. A mutant that PASSES is a battery failure. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const HERE = __dirname;

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('  ok   ' + n + (d ? ' — ' + d : '')); } else { fail++; console.error('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const red = (fired, n) => { reds++; if (fired) { redsFired++; pass++; console.log('  RED ok  ' + n); } else { fail++; console.error('  RED DID NOT FIRE  ' + n); } };

/* run a mutated copy; returns true if it FAILED (which is what a red wants) */
function mutantFails(src, edits, args = []) {
  const name = '.mutant-' + src;
  const p = path.join(HERE, name);
  try {
    let t = fs.readFileSync(path.join(HERE, src), 'utf8');
    for (const [from, to] of edits) {
      if (!t.includes(from)) throw new Error('mutation anchor vanished in ' + src + ': ' + from);
      t = t.split(from).join(to);
    }
    fs.writeFileSync(p, t);
    const r = cp.spawnSync('node', [p, ...args], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    const out = String(r.stdout) + String(r.stderr);
    return r.status !== 0 || /\bFAIL\b/.test(out);
  } finally {
    if (fs.existsSync(p)) fs.rmSync(p);
    for (const junk of ['.mutant-out.json']) {
      const j = path.join(HERE, junk);
      if (fs.existsSync(j)) fs.rmSync(j);
    }
  }
}

console.log('erdos1038 infimum — record walk');
const REC = path.join(ROOT, 'certs', 'erdos1038-inf.json');
if (!fs.existsSync(REC)) { console.error('no certs/erdos1038-inf.json — run tools/run-lemniscate.js'); process.exit(1); }
const R = JSON.parse(fs.readFileSync(REC, 'utf8'));

/* ---- the certified numbers ---- */
const t1 = R.theorems.T1_upper;
ok(t1.lenUp <= 1.8344304971959906 + 1e-15, 'T1: certified upper bound ≤ 1.8344304971959906', String(t1.lenUp));
ok(t1.lenLo <= t1.lenUp, 'T1: the length enclosure is ordered');
ok(t1.cLevel[0] >= 0, 'T1: the on-interval level c is certified ≥ 0 (the measure is admissible)');
ok(R.theorems.T2_thread_duals.results.length === 3 && R.theorems.T2_thread_duals.results.every((r) => r.weightsPositive && r.certifiedMin > 0),
  'T2: all three thread duals positive with U ≥ 0 certified');
ok(R.theorems.T3_family.onChunks.chunks === 624275,
  'T3: 624,275 ε-chunks certified (the script refuses to write its record on any failure)', 'Tao Problem 4.1 on [1e-12, 0.1]');
ok(R.theorems.T3_family.sliver.EPS0 === 1e-12, 'T3: the sliver closes (0, 1e-12], so the range is ALL ε ∈ (0, 0.1]');

/* ---- the bracket, and the T4 record if it has landed ---- */
if (R.bracket.lower !== null) {
  ok(R.bracket.lower < R.bracket.upper, 'the bracket is ordered', R.bracket.lower + ' ≤ inf ≤ ' + R.bracket.upper);
  ok(R.theorems.T4_forcing.independentVerify && R.theorems.T4_forcing.independentVerify.ok,
    'T4: the independent forcing verifier accepted the record');
  const F = path.join(ROOT, 'certs', 'erdos1038-forcing-1.828.json');
  ok(fs.existsSync(F), 'T4: the forcing certificate is on disk');
} else {
  console.log('  note: T4 (forcing lower bound) not yet in the record — bracket half-open');
}

/* ---- THE FENCE: the claim landscape must be stated, by name ---- */
const ind = String(R.independence || '');
for (const who of ['Darvas', 'Wang', 'Budala']) {
  ok(ind.includes(who), 'fence: the record names the claimant ' + who);
}
ok(/no guarantee of proof correctness|has examined any part/.test(ind),
  'fence: the record carries the forum\'s own "nobody has examined it" caveat');
ok(/did not audit its analytic core/.test(ind),
  'fence: the record states we did NOT audit the analytic core we confirmed the appendix of');

/* ---- red controls: real source mutations ---- */
console.log('red controls');
red(mutantFails('upper.js', [
  ['const A_PARAM = 0.82452180;', 'const A_PARAM = 0.82452100;'],
  ["path.join(__dirname, 'cert-min.json')", "path.join(__dirname, '.mutant-out.json')"],
]), 'X1 an atom mass below the exact level makes c < 0 and the upper bound is REFUSED');

red(mutantFails('upper.js', [
  ['const a = 0.804462;', 'const a = 0.70;'],
  ["path.join(__dirname, 'cert-min.json')", "path.join(__dirname, '.mutant-out.json')"],
]), 'X2 a displaced support endpoint is caught (the certificate is not insensitive to its own parameters)');

red(mutantFails('family.js', [
  ['+ Math.max(0.002 * e1, 1e-10)', '- Math.max(0.002 * e1, 1e-10)'],
  ["path.join(__dirname, 'cert-eps-family.json')", "path.join(__dirname, '.mutant-out.json')"],
], ['1e-12', '1e-8']), 'X3 THE δ-MECHANISM: the family\'s level defect put on the wrong side fails for small ε');

red(mutantFails('sliver.js', [
  ['const A_S = 1.1833541845;', 'const A_S = 0.9833541845;'],
  ["path.join(__dirname, 'cert-eps-sliver.json')", "path.join(__dirname, '.mutant-out.json')"],
]), 'X4 the sliver\'s constant below 1 breaks positivity of the density and is REFUSED');

/* X5: the independent forcing verifier must reject a tampered record */
const FJ = path.join(ROOT, 'certs', 'erdos1038-forcing-1.828.json');
if (fs.existsSync(FJ)) {
  const tmp = path.join(HERE, '.mutant-force.json');
  try {
    const J = JSON.parse(fs.readFileSync(FJ, 'utf8'));
    J.summary.cap = J.summary.cap + 0.05;     /* claim a bound the boxes do not tile */
    fs.writeFileSync(tmp, JSON.stringify(J));
    const v = cp.spawnSync('node', [path.join(HERE, 'verify-forcing.js'), tmp, '6', '600'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    const vo = String(v.stdout) + String(v.stderr);
    red(v.status !== 0 || /\bFAIL\b/.test(vo), 'X5 a forcing record whose claimed cap exceeds its boxes is REJECTED');
  } finally { if (fs.existsSync(tmp)) fs.rmSync(tmp); }
} else {
  console.log('  note: X5 skipped — no forcing record on disk yet');
}

console.log(`lemniscate battery: ${pass} pass, ${fail} fail, ${redsFired}/${reds} red controls fired`);
process.exit(fail ? 1 : 0);
