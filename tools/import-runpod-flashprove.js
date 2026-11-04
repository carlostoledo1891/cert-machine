#!/usr/bin/env node
/* import-runpod-flashprove.js — bring a RunPod run of the FlashProve Lean lane (tools/runpod-flashprove.sh) onto the
   desk: every file the pod serves read-only on port 8000 (per step: .exit, .out, .err, .start, .end; the nanoda
   configs; the status and the memory samples) is written to corpus/flashprove/runs/runpod-<pod>/, with each step's
   output cut to its last 2,000 lines (a full lake build log runs to tens of thousands), and a _run.json beside them.
   Nothing is decided here: certs/flashprove-check.json is written from these files by the recorder.

   usage: node tools/import-runpod-flashprove.js <pod-id> [--partial]
          (without --partial it refuses until the pod reports complete) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-flashprove.js <pod-id> [--partial]'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '300', BASE + rel], { encoding: 'utf8', maxBuffer: 1 << 30 }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('the pod serves no _status.json at ' + BASE); process.exit(1); }
const complete = st._phase === 'complete';
if (!complete && !process.argv.includes('--partial')) { console.error('the pod is at "' + st._phase + '"; import it when complete, or pass --partial'); process.exit(1); }
/* the served directory listing (python -m http.server): every file name it links */
const listing = get('') || '';
const names = [...listing.matchAll(/href="([^"?#/]+)"/g)].map((m) => decodeURIComponent(m[1])).filter((n) => /^[A-Za-z0-9_.+-]+$/.test(n));
const dir = path.join(ROOT, 'corpus', 'flashprove', 'runs', 'runpod-' + pod);
fs.mkdirSync(dir, { recursive: true });
const TAIL = 2000;
let n = 0;
for (const name of names) {
  let body = get(name);
  if (body === null) { console.error('could not read ' + name); continue; }
  if (/\.(out|err)$/.test(name)) { const lines = body.split('\n'); if (lines.length > TAIL) body = '[the first ' + (lines.length - TAIL) + ' lines cut on import]\n' + lines.slice(-TAIL).join('\n'); }
  fs.writeFileSync(path.join(dir, name), body);
  n++;
}
fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({
  run: 'runpod-' + pod, auditSha: st._audit, startedAt: st._started, updatedAt: st._updated, finishedAt: st._finished || null,
  status: complete ? 'completed' : 'in_progress (' + st._phase + ')', url: BASE, files: n,
  host: 'RunPod CPU pod ' + pod + ': ' + st._machine, leanNumThreads: st._leanNumThreads,
  steps: Object.fromEntries(Object.entries(st).filter(([k]) => !k.startsWith('_'))),
}, null, 1) + '\n');
console.log('runpod-' + pod + ': ' + n + ' files (' + (complete ? 'complete' : 'partial: ' + st._phase) + ') → ' + path.relative(ROOT, dir));
