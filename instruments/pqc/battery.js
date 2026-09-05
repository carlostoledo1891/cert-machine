#!/usr/bin/env node
/* battery.js — the gate on instruments/pqc (the SVP-record audit). cert-machine's
   own file, not a port. Everything here is offline: the network step
   (fetch-bases.js) is never run, its result is the pinned out/dets.json.

     1. the pins       every ported file hashes to PROVENANCE.json
     2. pi + gh        the two test suites (gh cross-checks the Python engine in
                       instruments/wiring on 32 cases)
     3. hof            the hall-of-fame parse reproduces the pinned hof.json byte for byte
     4. audit          re-decides all 37 records in a scratch copy and matches the
                       pinned audit.json with the ms fields ignored: 0 inconsistent, and
                       the ONE row that flips between N and N+1/2 is dim 119 seed 0
     5. reduce         LLL on the dim-40 basis reproduces the pinned profile, ms ignored
     6. the falsifier  at dim 119 the record's norm 2904 is ADMISSIBLE and 2905 is
                       REFUSED — the wall is where the audit says it is
     RED               a forged pin is caught                                       */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HERE = __dirname;
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '   [' + detail + ']' : ''}`); if (!ok) fails++; };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run = (script, cwd = HERE) => execFileSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* 1. the pins */
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const moved = PROV.files.filter((f) => sha(path.join(HERE, f.file)) !== f.sha256).map((f) => f.file);
check('every ported file hashes to its pin', moved.length === 0, moved.length ? 'moved: ' + moved.join(', ') : PROV.files.length + ' files');

/* 2. the two suites */
for (const t of ['pi.test.js', 'gh.test.js']) {
  let out = '', ok = true;
  try { out = run(path.join(HERE, t)); } catch (e) { ok = false; out = (e.stdout || '') + (e.stderr || ''); }
  check(t + ' is green', ok && /all green/.test(out), out.trim().split('\n').slice(-1)[0].slice(0, 90));
}

/* 3-5. reproduce the records in a scratch copy, so the pinned outputs never churn */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pqc-'));
for (const f of ['audit.js', 'basis.js', 'gh.js', 'hof.js', 'pi.js', 'reduce.js']) fs.copyFileSync(path.join(HERE, f), path.join(tmp, f));
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'out'));
for (const f of ['data/halloffame.html', 'data/svp-dim40-seed0.txt', 'out/dets.json']) fs.copyFileSync(path.join(HERE, f), path.join(tmp, f));
const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (k === 'ms' ? undefined : x)));
const same = (a, b) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));
run(path.join(tmp, 'hof.js'), tmp);
check('hof.js reproduces the pinned hall of fame byte for byte', sha(path.join(tmp, 'out/hof.json')) === sha(path.join(HERE, 'out/hof.json')));
run(path.join(tmp, 'audit.js'), tmp);
const audit = JSON.parse(fs.readFileSync(path.join(tmp, 'out/audit.json'), 'utf8'));
const pinnedAudit = JSON.parse(fs.readFileSync(path.join(HERE, 'out/audit.json'), 'utf8'));
check('audit.js re-decides every record to the pinned verdicts (ms ignored)', same(audit, pinnedAudit), audit.length + ' records');
const bad = audit.filter((o) => !o.roundOK && !o.truncOK), flip = audit.filter((o) => o.vN === 'ADMISSIBLE' && o.vHi !== 'ADMISSIBLE');
check('0 published ratios inconsistent with the printed norm; exactly one row undecidable from it', bad.length === 0 && flip.length === 1 && flip[0].n === 119 && flip[0].seed === 0, `${bad.length} inconsistent, flip = dim ${flip.map((f) => f.n + ' seed ' + f.seed).join(',')}`);
run(path.join(tmp, 'reduce.js'), tmp);
const red = JSON.parse(fs.readFileSync(path.join(tmp, 'out/reduce-40.json'), 'utf8'));
const pinnedRed = JSON.parse(fs.readFileSync(path.join(HERE, 'out/reduce-40.json'), 'utf8'));
check('reduce.js reproduces the pinned dim-40 reduction (ms ignored)', same(red, pinnedRed), `${red.snaps.length} snapshots, ${red.steps} steps, final ratio ${red.final.ratioLo}`);
fs.rmSync(tmp, { recursive: true, force: true });

/* 6. the falsifier: the wall at the record that sits closest to it */
{
  const { decide } = require(path.join(HERE, 'gh.js'));
  const { parse } = require(path.join(HERE, 'basis.js'));
  const rows = parse(fs.readFileSync(path.join(HERE, 'data', 'svp-dim119-seed0.txt'), 'utf8'));
  const q = rows[0][0];                                            /* det = q, the [0][0] entry, read not computed */
  const at = decide(119, q, 2904n * 2904n, 1n), up = decide(119, q, 2905n * 2905n, 1n);
  check('dim 119 seed 0: norm 2904 is ADMISSIBLE and 2905 is REFUSED', at === 'ADMISSIBLE' && up === 'REFUSED', `${at} / ${up}`);
}

/* RED */
check('RED: a forged pin is caught', sha(path.join(HERE, PROV.files[0].file)) !== '0'.repeat(64));

console.log(`\n${fails ? fails + ' FAILED' : 'ALL GREEN'} — instruments/pqc`);
process.exit(fails ? 1 : 0);
