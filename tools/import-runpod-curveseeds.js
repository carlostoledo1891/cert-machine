#!/usr/bin/env node
/* import-runpod-curveseeds.js — bring the point-counting lane a RunPod pod ran (tools/runpod-curveseeds.sh) into
   corpus/curveseeds/scan.json, with the pod's build line (sha256 of the decider, the published parameters and the scan
   script; the PARI and seadata versions). The lane is counted apart from the certificate; the report builder folds its
   summary into §4 when the file exists.
   usage: node tools/import-runpod-curveseeds.js <pod-id> */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-curveseeds.js <pod-id>'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '120', BASE + rel], { encoding: 'utf8' }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('no _status.json at ' + BASE); process.exit(1); }
console.log('pod ' + pod + ': ' + st.phase + ' (audit ' + st.audit + ', ' + st.cpus + ' cpus, ' + st.updated + ')');
if (st.phase !== 'complete') { const log = get('_scan.log'); if (log) console.log(log.split('\n').slice(-6).join('\n')); process.exit(st.phase.startsWith('FAILED') ? 1 : 3); }
const body = get('curveseeds-scan.json');
if (!body) { console.error('no curveseeds-scan.json served'); process.exit(1); }
const S = JSON.parse(body);
if (!S.runs || !S.summary || !S.summary.text) { console.error('the served file has no runs/summary'); process.exit(1); }
for (const [k, v] of Object.entries(S.runs)) if (v.publishedIsPrimeOrder !== true) { console.error(k + ': the published candidate did not come out prime-order — the lane disagrees with the standard; not imported'); process.exit(1); }
S.pod = { id: pod, audit: st.audit, cpus: st.cpus, build: get('_build.txt') || null, imported: new Date().toISOString() };
const dst = path.join(__dirname, '..', 'corpus', 'curveseeds', 'scan.json');
fs.writeFileSync(dst, JSON.stringify(S, null, 1) + '\n');
console.log('corpus/curveseeds/scan.json written: ' + Object.keys(S.runs).length + ' runs — ' + S.summary.text);
