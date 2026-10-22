#!/usr/bin/env node
/* check-claimbox-lift.js — the battery `claimbox lift (the Riemann records)`: every file LIFT-claimbox.json copied out of
   claimbox is byte for byte what PROVENANCE-claimbox.json recorded (no local edit, no patch), the provenance names the
   claimbox commit the copies came from, and the companion paper's numbers regenerate identically from the copies
   (tools/paper-numbers/riemann-finite-layer.js, which refuses when a record no longer supports a sentence). Exit 1 on any
   difference. `make drift` is the report on the other end — claimbox itself moving; this is the gate on ours.
   usage: node tools/check-claimbox-lift.js                                                                        MIT */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const fail = (m) => { console.error('claimbox lift: FAIL — ' + m); process.exit(1); };
const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'PROVENANCE-claimbox.json'), 'utf8'));
if (!/^[0-9a-f]{40}$/.test(prov.source_commit || '')) fail('no claimbox commit in the provenance');
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'LIFT-claimbox.json'), 'utf8'));
if (man.patches && man.patches.length) fail('the manifest declares patches; the records are read as the producer wrote them');
let held = 0;
for (const f of prov.files) {
  const p = path.join(ROOT, f.dst);
  if (!fs.existsSync(p)) fail('missing ' + f.dst);
  if (f.patched) fail('a patched copy: ' + f.dst);
  if (sha(p) !== f.local_sha256) fail('edited since the lift: ' + f.dst);
  held++;
}
const out = path.join(ROOT, 'paper', 'tex', 'riemann-finite-layer-numbers.tex');
const body = (t) => t.split('\n').slice(1).filter((l) => !/^\\newcommand\{\\RfCommit\}/.test(l)).join('\n');   /* the first line and the RfCommit macro carry the git commit and move with it */
const before = fs.existsSync(out) ? body(fs.readFileSync(out, 'utf8')) : null;
const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'tools', 'paper-numbers', 'riemann-finite-layer.js')], { encoding: 'utf8' });
if (r.status !== 0) fail('the numbers generator refused: ' + String(r.stderr || '').trim());
const after = body(fs.readFileSync(out, 'utf8'));
if (before !== null && before !== after) fail('the paper\'s numbers changed on regeneration: a lifted record moved; read the diff of paper/tex/riemann-finite-layer-numbers.tex');
console.log('claimbox lift: ' + held + ' files held to PROVENANCE-claimbox.json (claimbox ' + prov.source_commit.slice(0, 12) + '); the paper\'s ' + (after.match(/\\newcommand/g) || []).length + ' numbers regenerated identically');
