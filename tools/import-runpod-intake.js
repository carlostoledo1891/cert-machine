#!/usr/bin/env node
/* import-runpod-intake.js — bring a Lean intake run made on a RunPod pod (tools/runpod-lean-intake.sh) onto the desk:
   the run's facts, served read-only on the pod's port 8000 as <id>.tar.gz with its sha256, are unpacked into
   corpus/lean-intake/<id>/runs/<day>/ exactly as the tool wrote them. Nothing is decided here: `record` decides from
   the facts, on the desk. An existing day's folder is never overwritten.

   usage: node tools/import-runpod-intake.js <pod-id> <id> [--partial]
          LEAN_INTAKE_ROOT=<dir> reads and writes under another root (a spec not yet public, or a trial)

   then:  delete the pod, confirm it is gone, and write what it cost —
          node tools/lean-intake.js cost <id> --usd <billed> --what "<instance>, <minutes> min at US$<rate>/h, pod <pod-id>"
          node tools/lean-intake.js record <id>                                                                  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = process.env.LEAN_INTAKE_ROOT ? path.resolve(process.env.LEAN_INTAKE_ROOT) : path.resolve(__dirname, '..');
const [pod, id] = process.argv.slice(2);
const die = (m) => { console.error('import-runpod-intake: ' + m); process.exit(1); };
if (!pod || !/^[a-z0-9]+$/.test(pod) || !id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) die('usage: import-runpod-intake.js <pod-id> <id> [--partial]');
const BASE = 'https://' + pod + '-8000.proxy.runpod.net/';
const get = (rel, enc) => { const r = cp.spawnSync('curl', ['-fsS', '--retry', '3', '--max-time', '600', BASE + rel], { encoding: enc || 'utf8', maxBuffer: 1 << 30 }); return r.status === 0 ? r.stdout : null; };
const st = JSON.parse(get('_status.json') || 'null');
if (!st) die('the pod serves no _status.json at ' + BASE);
if (st._phase !== 'complete' && !process.argv.includes('--partial')) die('the pod is at "' + st._phase + '"; import when complete, or pass --partial');
if (!String(st._ids || '').split(/\s+/).includes(id)) die('the pod ran ' + st._ids + ', not ' + id);
const tgz = get(id + '.tar.gz', 'buffer'), shaLine = get(id + '.tar.gz.sha256');
if (!tgz || !shaLine) die('the pod serves no ' + id + '.tar.gz (did the run reach its facts? see ' + BASE + id + '.err)');
const sha = crypto.createHash('sha256').update(tgz).digest('hex');
if (sha !== shaLine.trim().split(/\s+/)[0]) die('the archive is not the bytes the pod hashed');
const runs = path.join(ROOT, 'corpus', 'lean-intake', id, 'runs');
if (!fs.existsSync(path.join(ROOT, 'corpus', 'lean-intake', id, 'spec.json'))) die('no spec for ' + id + ' under ' + ROOT);
const day = st._day;
if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) die('the pod names no day');
if (fs.existsSync(path.join(runs, day))) die(path.relative(ROOT, path.join(runs, day)) + ' exists: a run\'s facts are never overwritten');
fs.mkdirSync(runs, { recursive: true });
const tmp = path.join(runs, '.' + id + '.tar.gz'); fs.writeFileSync(tmp, tgz);
const names = cp.spawnSync('tar', ['-tzf', tmp], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
if (!names.length || names.some((n) => n.startsWith('/') || n.split('/').includes('..') || n.split('/')[0] !== day)) { fs.rmSync(tmp); die('the archive holds a path outside ' + day + '/'); }
const x = cp.spawnSync('tar', ['-xzf', tmp, '-C', runs]); fs.rmSync(tmp);
if (x.status !== 0) die('tar failed');
fs.writeFileSync(path.join(runs, day, '_pod.json'), JSON.stringify({ pod, base: BASE, audit: st._audit, machine: st._machine, cache: st._cache, started: st._started, finished: st._finished || null, run: st[id] || null, archiveSha256: sha, importedAt: new Date().toISOString() }, null, 1) + '\n');
console.log(`imported ${names.filter((n) => !n.endsWith('/')).length} files into ${path.relative(ROOT, path.join(runs, day))} (${st[id] || 'no run line'}; pod ${pod})`);
console.log('next: delete the pod, confirm it is gone, then `cost` and `record` (see the head of this file)');
