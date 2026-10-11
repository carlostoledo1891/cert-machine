#!/usr/bin/env node
/* import-runpod-lonely-runner.js — bring the gate records a RunPod pod decided (tools/runpod-lonely-runner.sh) into
   corpus/lonely-runner/runs/runpod-<pod>/, with the pod's build line (sha256 of lr.c, gate.py and the binary).
   usage: node tools/import-runpod-lonely-runner.js <pod-id> */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pod = process.argv[2];
if (!pod || !/^[a-z0-9]+$/.test(pod)) { console.error('usage: import-runpod-lonely-runner.js <pod-id>'); process.exit(2); }
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel) => { const r = cp.spawnSync('curl', ['-fsS', '--max-time', '120', BASE + rel], { encoding: 'utf8' }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) { console.error('no _status.json at ' + BASE); process.exit(1); }
const dir = path.join(__dirname, '..', 'corpus', 'lonely-runner', 'runs', 'runpod-' + pod);
fs.mkdirSync(dir, { recursive: true });
const build = get('_build.txt'); if (build) fs.writeFileSync(path.join(dir, '_build.txt'), build);
let n = 0;
for (const tag of (st.done || '').split(/\s+/).filter(Boolean)) {
  const body = get(encodeURIComponent(tag.replace(/--no-neargcd$/, '-no-neargcd')) + '.json');
  if (!body) { console.error(tag + ': no record served'); continue; }
  const rec = JSON.parse(body); rec.pod = pod;
  fs.writeFileSync(path.join(dir, tag.replace(/--no-neargcd$/, '-no-neargcd') + '.json'), JSON.stringify(rec, null, 1) + '\n');
  n++; console.log(tag + ': ' + rec.verdict + ' J=' + rec.jEmpty + ' survivors=' + rec.survivingOrbits + ' cpu=' + rec.cpuSeconds + 's');
}
console.log('runpod-' + pod + ': ' + n + ' records (' + st.phase + ')');
