#!/usr/bin/env node
/* run-hunt-batteries.js — run every hunts/<slug>/battery.js and report.

   A hunt owns its own gate; this only finds them and prints one line each. It
   reports and exits 0 by default so it can sit in `make selftest` without
   becoming a gate; pass --strict when a machine needs one bit.

   It NAMES the hunts that have no battery (C53) rather than counting only the
   ones it ran — a hunt with no gate is exactly the thing a runner must not
   silently omit. */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HUNTS = path.join(ROOT, 'hunts');
const strict = process.argv.includes('--strict');

if (!fs.existsSync(HUNTS)) { console.log('no hunts/ directory'); process.exit(0); }

let ran = 0, failed = 0;
const ungated = [];
for (const d of fs.readdirSync(HUNTS).sort()) {
  const dir = path.join(HUNTS, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  const b = path.join(dir, 'battery.js');
  if (!fs.existsSync(b)) { ungated.push(d); continue; }
  const r = cp.spawnSync(process.execPath, [b], { stdio: 'ignore', cwd: ROOT });
  const ok = r.status === 0;
  console.log('  ' + d.padEnd(32) + (ok ? 'PASS' : 'FAIL'));
  ran++; if (!ok) failed++;
}

if (ran === 0 && ungated.length === 0) console.log('  (no hunts yet)');
if (ungated.length) {
  console.log('');
  console.log('  NO BATTERY (named, not skipped): ' + ungated.join(', '));
  console.log('  A hunt with no gate is unmeasured, not passing.');
}
if (strict && (failed > 0 || ungated.length > 0)) process.exit(1);
