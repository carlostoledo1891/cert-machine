#!/usr/bin/env node
/* import-runpod-graphon-k4.js — bring the first implementation's run of the C_89 (K4) replay from a RunPod pod
   (tools/runpod-graphon-k4.sh: instruments/optq/graphon_k4.c on every block, nine primes) into
   certs/graphon-k4-blocks.txt (the kernel's output, verbatim) and certs/graphon-k4-pod.json (the pod, the commit, the
   build line, the selftest, the time). It checks the output's shape only — one line per block, the same primes and
   matrix fingerprint throughout; tools/replay-graphon-k4.js decides what the residues say.
   usage: node tools/import-runpod-graphon-k4.js <pod-id> */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-graphon-k4.js <pod-id>'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '300', BASE + rel], { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('no _status.json at ' + BASE); process.exit(1); }
console.log('pod ' + pod + ': ' + st.phase + ' (commit ' + st.commit + ', ' + st.threads + ' threads, ' + st.updated + ')');
const body = get('blocks.txt');
const lines = (body || '').split('\n').filter(Boolean);
const heads = lines.filter((l) => l[0] === 'M'), primes = lines.filter((l) => l[0] === 'P'), times = lines.filter((l) => l[0] === 'T');
const blocks = new Map();
for (const l of lines.filter((x) => x[0] === 'B')) { const i = Number(l.split(' ')[1]); if (blocks.has(i) && blocks.get(i) !== l) { console.error('block ' + i + ' twice with different residues'); process.exit(1); } blocks.set(i, l); }
const m = heads.length ? Number(heads[0].split(' ')[1]) : NaN;
console.log('  ' + blocks.size + ' of ' + m + ' blocks; ' + times.map((t) => t.slice(2) + ' s').join(' + '));
if (st.phase !== 'complete') process.exit(st.phase.startsWith('FAILED') ? 1 : 3);
if (new Set(heads).size !== 1 || new Set(primes).size !== 1) { console.error('the runs disagree on the matrix fingerprint or the primes'); process.exit(1); }
for (let i = 0; i < m; i++) if (!blocks.has(i)) { console.error('block ' + i + ' missing'); process.exit(1); }
const out = [heads[0], primes[0], ...Array.from({ length: m }, (_, i) => blocks.get(i)), ...times].join('\n') + '\n';
const C = path.join(__dirname, '..', 'certs');
fs.writeFileSync(path.join(C, 'graphon-k4-blocks.txt'), out);
const secs = times.reduce((a, t) => a + Number(t.split(' ')[1]), 0);
fs.writeFileSync(path.join(C, 'graphon-k4-pod.json'), JSON.stringify({ pod, commit: st.commit, threads: st.threads, finished: st.updated, kernelSeconds: secs,
  build: (get('_build.txt') || '').trim().split('\n'), selftest: (get('selftest.txt') || '').trim(), imported: new Date().toISOString() }, null, 1) + '\n');
console.log('certs/graphon-k4-blocks.txt and certs/graphon-k4-pod.json written (' + m + ' blocks, ' + secs.toFixed(0) + ' s of kernel time)');
