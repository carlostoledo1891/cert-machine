#!/usr/bin/env node
/* import-runpod-openai-math.js — bring a RunPod lane-K run (tools/runpod-openai-math.sh, pre-registration amendment
   14) into the ledger's run store: the facts the pod serves read-only on port 8000 (result.json per challenge, no
   verdict) are written to corpus/openai-math/kernel-runs/runpod-<pod>/<challenge>.json beside a _run.json, exactly
   as tools/record-openai-math-kernel.js writes a GitHub run, and the ledger is then re-decided from disk.

   usage: node tools/import-runpod-openai-math.js <pod-id> [--partial]
          (without --partial it refuses until the pod reports complete) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-openai-math.js <pod-id> [--partial]'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '60', BASE + rel], { encoding: 'utf8' }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('the pod serves no _status.json at ' + BASE); process.exit(1); }
const complete = st._phase === 'complete';
if (!complete && !process.argv.includes('--partial')) { console.error('the pod is at "' + st._phase + '"; import it when complete, or pass --partial'); process.exit(1); }
const dir = path.join(ROOT, 'corpus', 'openai-math', 'kernel-runs', 'runpod-' + pod);
fs.mkdirSync(dir, { recursive: true });
let n = 0;
for (const [ch, state] of Object.entries(st)) {
  if (ch.startsWith('_') || !/^done/.test(state)) continue;
  const res = get(encodeURIComponent(ch) + '/result.json');
  if (!res) { console.error(ch + ': done, but no result.json is served'); continue; }
  const f = JSON.parse(res);
  if (f.challenge !== ch) { console.error(ch + ': result.json names ' + f.challenge); process.exit(1); }
  fs.writeFileSync(path.join(dir, ch + '.json'), JSON.stringify(f, null, 1) + '\n');
  n++;
}
fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({ run: 'runpod-' + pod, workflowSha: st._audit, createdAt: st._started, updatedAt: st._updated,
  status: complete ? 'completed' : 'in_progress', conclusion: complete ? 'success' : '', url: BASE, jobs: n,
  host: 'RunPod CPU pod ' + pod + ': ' + st._machine, nanodaBuild: st._nanodaBuild }, null, 1) + '\n');
console.log('runpod-' + pod + ': ' + n + ' challenge results (' + (complete ? 'complete' : 'partial: ' + st._phase) + ')');
cp.execFileSync('node', [path.join(ROOT, 'tools', 'record-openai-math-kernel.js'), '--rebuild'], { stdio: 'inherit' });
