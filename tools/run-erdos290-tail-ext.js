#!/usr/bin/env node
/* run-erdos290-tail-ext.js — extend the Erdős #290 five-candidate squeeze past
   the source lab's l = 60: for l = 61..L, run the LIFTED instrument
   (legacy/research/challenges/erdos290/galois-exceptions.js, byte-identical to
   the cited page's) and record every degree that closes to a UNIQUE survivor
   with green certificates. A degree that does not close is left OPEN and keeps
   its honest [0,1] density — same rule as the original tail-sweep.js.

   Output: certs/erdos290-tail-ext.json (incremental — each degree lands as it
   closes, so a killed run loses nothing).

   usage: node tools/run-erdos290-tail-ext.js [maxL]   (default 90) */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
/* the LEAN fork: byte-identical to the lifted instrument except the
   closed-form candidateDeltas (sha-pinned splice; battery-gated by
   tools/erdos290-lean-battery.js) — the p(l)-partition array that OOMed
   l = 87 twice is gone, so the finale l = 87..90 fits the heap. */
const { analyze } = require(path.join(ROOT, 'tools', 'galois-exceptions-lean.js'));

const OUT = path.join(ROOT, 'certs', 'erdos290-tail-ext.json');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const maxL = Number(process.argv[2] || 90);

const rec = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {
  what: 'Erdős #290 tail-density extension: exact δ(f_{2l}) for l past the source lab\'s 60, by the same '
    + 'five-candidate squeeze (lifted instrument, nPrimes=400, earlyExit). A degree missing from deltas did '
    + 'not close to a unique certified survivor and stays at the honest [0,1] — recorded under open.',
  method: 'legacy/research/challenges/erdos290/galois-exceptions.js analyze(d, {nPrimes: 400, earlyExit: true}); '
    + 'accepted only when certsOk && exactly one alive candidate',
  deltas: {}, open: [], generatedBy: 'tools/run-erdos290-tail-ext.js @ git ' + git
};

for (let l = 61; l <= maxL; l++) {
  if (rec.deltas[l] || rec.open.includes(2 * l)) continue;
  const d = 2 * l;
  const t0 = Date.now();
  let r = null;
  try { r = analyze(d, { nPrimes: 400, earlyExit: true }); } catch (e) { r = { error: e.message }; }
  if (r && r.certsOk && r.alive && r.alive.length === 1) {
    const dl = r.alive[0].delta;
    rec.deltas[l] = { name: r.alive[0].name, n: dl.n.toString(), d: dl.d.toString() };
    console.log('l=' + l + ' (d=' + d + ')  CLOSED: ' + r.alive[0].name + '  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
  } else {
    rec.open.push(d);
    console.log('l=' + l + ' (d=' + d + ')  OPEN (' + (r && r.error ? r.error : 'no unique certified survivor') + ')  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  rec.generatedBy = 'tools/run-erdos290-tail-ext.js @ git ' + git;
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
}
console.log('certs/erdos290-tail-ext.json: ' + Object.keys(rec.deltas).length + ' closed, ' + rec.open.length + ' open (l <= ' + maxL + ')');
