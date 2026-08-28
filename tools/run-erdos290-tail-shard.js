#!/usr/bin/env node
/* run-erdos290-tail-shard.js — the l≈310 campaign's parallel form of
   run-erdos290-tail-ext.js. Per-degree time grows ~l^4 (measured 116 s at
   l = 91, 212 s at l = 105), so the push from 120 to ~310 is days of
   single-threaded compute; degrees are independent, so shard them.

   Each shard processes l in (from, maxL] with l % shards == shard, writing
   its OWN file certs/erdos290-tail-shard-<shard>.json — no two writers
   ever share a file. `merge` folds every shard into the main record
   certs/erdos290-tail-ext.json with the same acceptance rule the serial
   runner enforces, adds only degrees the main record lacks, and refuses a
   shard entry that disagrees with an existing one (drift is a refusal,
   never a merge choice).

   usage: node tools/run-erdos290-tail-shard.js run <shard> <shards> <maxL> [fromL]
          node tools/run-erdos290-tail-shard.js merge
   e.g. 6 shards on an 8-core machine:
          for i in 0 1 2 3 4 5; do
            node tools/run-erdos290-tail-shard.js run $i 6 310 &
          done                                                              */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const { analyze } = require(path.join(ROOT, 'tools', 'galois-exceptions-lean.js'));
const MAIN = path.join(ROOT, 'certs', 'erdos290-tail-ext.json');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const [cmd, shardArg, shardsArg, maxArg, fromArg] = process.argv.slice(2);

if (cmd === 'run') {
  const shard = Number(shardArg), shards = Number(shardsArg), maxL = Number(maxArg), fromL = Number(fromArg || 120);
  if (!(shard >= 0 && shard < shards && maxL > fromL)) { console.log('bad shard spec'); process.exit(2); }
  const OUT = path.join(ROOT, 'certs', 'erdos290-tail-shard-' + shard + '.json');
  const rec = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8'))
    : { what: 'shard ' + shard + '/' + shards + ' of the tail extension (see certs/erdos290-tail-ext.json)',
        deltas: {}, open: [], generatedBy: 'tools/run-erdos290-tail-shard.js @ git ' + git };
  for (let l = fromL + 1; l <= maxL; l++) {
    if (l % shards !== shard) continue;
    if (rec.deltas[l] || rec.open.includes(2 * l)) continue;
    const d = 2 * l;
    const t0 = Date.now();
    let r = null;
    try { r = analyze(d, { nPrimes: 400, earlyExit: true }); } catch (e) { r = { error: e.message }; }
    if (r && r.certsOk && r.alive && r.alive.length === 1) {
      const dl = r.alive[0].delta;
      rec.deltas[l] = { name: r.alive[0].name, n: dl.n.toString(), d: dl.d.toString() };
      console.log('shard ' + shard + ' · l=' + l + ' (d=' + d + ')  CLOSED: ' + r.alive[0].name + '  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
    } else {
      rec.open.push(d);
      console.log('shard ' + shard + ' · l=' + l + ' (d=' + d + ')  OPEN (' + (r && r.error ? r.error : 'no unique certified survivor') + ')  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
    fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  }
  console.log('shard ' + shard + ' done: ' + Object.keys(rec.deltas).length + ' closed, ' + rec.open.length + ' open');

} else if (cmd === 'merge') {
  const main = JSON.parse(fs.readFileSync(MAIN, 'utf8'));
  let added = 0, openAdded = 0;
  for (const f of fs.readdirSync(path.join(ROOT, 'certs')).filter((x) => /^erdos290-tail-shard-\d+\.json$/.test(x))) {
    const sh = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', f), 'utf8'));
    for (const [l, v] of Object.entries(sh.deltas)) {
      if (main.deltas[l]) {
        if (main.deltas[l].n !== v.n || main.deltas[l].d !== v.d || main.deltas[l].name !== v.name) {
          console.error('REFUSED: shard ' + f + ' disagrees with the main record at l=' + l);
          process.exit(1);
        }
        continue;
      }
      main.deltas[l] = v; added++;
    }
    for (const d of sh.open) if (!main.open.includes(d) && !main.deltas[d / 2]) { main.open.push(d); openAdded++; }
  }
  main.open.sort((a, b) => a - b);
  main.generatedBy = 'tools/run-erdos290-tail-ext.js + tail-shard merge @ git ' + git;
  fs.writeFileSync(MAIN, JSON.stringify(main, null, 1) + '\n');
  console.log('merged: +' + added + ' closed, +' + openAdded + ' open -> ' + Object.keys(main.deltas).length
    + ' closed, ' + main.open.length + ' open in the main record');

} else {
  console.log('usage: run <shard> <shards> <maxL> [fromL] · merge');
  process.exit(2);
}
