#!/usr/bin/env node
/* import-runpod-eth-hawkley.js — bring the heavy-link run of Hawkley's ETH bridge (tools/runpod-eth-hawkley.sh on one
   RunPod CPU pod) onto the desk: the facts the pod serves read-only on port 8000 — hawkley/result.json (steps with
   exit codes, seconds, peaks; no verdict), every step's log/err/exit, verify.json (OpenAI's files against our pins),
   extras.json (the sha256 of each of his files and the lakefile diff), head.txt, env.txt, our AuditAxioms.lean, the
   nanoda config, the export's sha256, the tools' diff and the memory samples — are written to
   corpus/eth-refutation/hawkley/runs/runpod-<pod>/ beside a _run.json. The verdict is the recorder's
   (tools/record-eth-hawkley.js), never this file's.
   usage: node tools/import-runpod-eth-hawkley.js <pod-id> [--partial]   (--partial: before _phase is "complete") */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-eth-hawkley.js <pod-id> [--partial]'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '300', BASE + rel], { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('the pod serves no _status.json at ' + BASE); process.exit(1); }
const complete = st._phase === 'complete';
if (!complete && !process.argv.includes('--partial')) { console.error('the pod is at "' + st._phase + '"; import it when complete, or pass --partial'); process.exit(1); }
const dir = path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley', 'runs', 'runpod-' + pod);
fs.mkdirSync(path.join(dir, 'hawkley'), { recursive: true });
let n = 0;
for (const f of ['_status.json', '_mem.tsv', '_nanoda.patch', '_lean4export.txt', '_tools-seconds.txt', '_done']) { const b = get(f); if (b != null) { fs.writeFileSync(path.join(dir, f), b); n++; } }
const steps = ['prepare', 'build', 'axioms', 'export', 'nanoda', 'nanoda-control', 'leanchecker'];
const files = ['result.json', 'verify.json', 'extras.json', 'head.txt', 'env.txt', 'AuditAxioms.lean', 'nanoda.json', 'export.sha256', 'order.txt', 'facts.err', 'leanchecker.cmd'];
for (const s of steps) for (const ext of ['log', 'err', 'exit', 'start', 'end']) files.push(s + '.' + ext);
for (const f of files) { const b = get('hawkley/' + f); if (b != null) { fs.writeFileSync(path.join(dir, 'hawkley', f), b); n++; } }
const res = JSON.parse(fs.existsSync(path.join(dir, 'hawkley', 'result.json')) ? fs.readFileSync(path.join(dir, 'hawkley', 'result.json'), 'utf8') : 'null');
const run = { pod, imported: new Date().toISOString(), complete, status: st, files: n, script: 'tools/runpod-eth-hawkley.sh', audit: st._audit, pin: st._pin };
fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify(run, null, 1) + '\n');
console.log('pod ' + pod + ': ' + st._phase + ' (hawkley: ' + (st.hawkley || '?') + '); ' + n + ' files → ' + path.relative(ROOT, dir));
if (res && res.steps) for (const s of Array.isArray(res.steps) ? res.steps : Object.entries(res.steps).map(([k, v]) => Object.assign({ step: k }, v))) console.log('  ' + (s.step || s.name) + ': exit ' + s.exit + ', ' + s.seconds + ' s' + (s.peakRssKb ? ', peak RSS ' + Math.round(s.peakRssKb / 1024) + ' MB' : ''));
