#!/usr/bin/env node
/* import-runpod-eth.js — bring a RunPod run of the ETH-refutation kernel lane (tools/runpod-eth.sh) onto the desk: the
   facts the pod serves read-only on port 8000 (result.json per claim, no verdict; the tools' diff; the memory samples)
   are written to corpus/eth-refutation/runs/runpod-<pod>/ beside a _run.json, and certs/eth-kernel.json is then
   re-decided from disk by tools/record-eth-kernel.js, the one module that holds the rule.

   usage: node tools/import-runpod-eth.js <pod-id> [--partial]
          (without --partial it refuses until the pod reports complete) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-eth.js <pod-id> [--partial]'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '120', BASE + rel], { encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('the pod serves no _status.json at ' + BASE); process.exit(1); }
const complete = st._phase === 'complete';
if (!complete && !process.argv.includes('--partial')) { console.error('the pod is at "' + st._phase + '"; import it when complete, or pass --partial'); process.exit(1); }
const dir = path.join(ROOT, 'corpus', 'eth-refutation', 'runs', 'runpod-' + pod);
fs.mkdirSync(dir, { recursive: true });
const claims = String(st._claims || 'anthropic openai').split(/\s+/).filter(Boolean);
let n = 0;
for (const c of claims) {
  if (!['anthropic', 'openai'].includes(c)) { console.error('unknown claim ' + c); process.exit(1); }
  const state = st[c] || '';
  if (/^(queued|prepare)$/.test(state)) { console.log(c + ': ' + state + ' (nothing to import)'); continue; }
  const res = get(c + '/result.json');
  if (!res) { console.error(c + ': "' + state + '", but no result.json is served'); continue; }
  const f = JSON.parse(res);
  if (f.claim !== c) { console.error(c + ': result.json names ' + f.claim); process.exit(1); }
  f.podState = state;
  fs.writeFileSync(path.join(dir, c + '.json'), JSON.stringify(f, null, 1) + '\n');
  n++;
}
for (const extra of ['_nanoda.patch', '_lean4export-433.txt', '_tools-seconds.txt', '_mem.tsv']) {
  const body = get(extra);
  if (body !== null) fs.writeFileSync(path.join(dir, extra), body);
}
fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({
  run: 'runpod-' + pod, auditSha: st._audit, createdAt: st._started, updatedAt: st._updated,
  status: complete ? 'completed' : 'in_progress (' + st._phase + ')', url: BASE, claims: n,
  host: 'RunPod CPU pod ' + pod + ': ' + st._machine, nanodaBuild: st._nanodaBuild,
  states: Object.fromEntries(claims.map((c) => [c, st[c]])),
}, null, 1) + '\n');
console.log('runpod-' + pod + ': ' + n + ' claim results (' + (complete ? 'complete' : 'partial: ' + st._phase) + ')');
cp.execFileSync('node', [path.join(ROOT, 'tools', 'record-eth-kernel.js')], { stdio: 'inherit' });
