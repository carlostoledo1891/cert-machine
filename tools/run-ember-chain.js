#!/usr/bin/env node
/* run-ember-chain.js — drive the ember certificate chain, one record per
   stage. usage: node tools/run-ember-chain.js [stage ...]
   stages: spectrum defect eigenpair pointwise collar corner cross theorem
   (no args = the full chain in order, ~3-4 min). Each stage writes
   certs/ember-<stage>.json; a stage REFUSES if an upstream record is
   missing or unverified. */
'use strict';

const REC = require('../instruments/hotspots/record.js');

const ORDER = ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross', 'theorem'];
const args = process.argv.slice(2);
const stages = args.length ? args : ORDER;

for (const st of stages) {
  if (!ORDER.includes(st)) { console.error('unknown stage: ' + st + ' (' + ORDER.join(' ') + ')'); process.exit(2); }
}

let anyRefused = false;
for (const st of stages) {
  const t0 = Date.now();
  process.stdout.write('── stage ' + st + ' ');
  const mod = require('../instruments/hotspots/stage-' + st + '.js');
  const body = mod.run();
  const file = REC.write(st, body);
  const bad = (body.checks || []).filter(c => !c.ok);
  console.log(`→ ${body.verdict} (${((Date.now() - t0) / 1000).toFixed(1)}s, ${(body.checks || []).length} checks) → ${file.replace(process.cwd() + '/', '')}`);
  for (const c of bad) console.log('   FAIL ' + c.name + (c.detail ? ' — ' + c.detail : ''));
  if (body.verdict !== 'VERIFIED') { anyRefused = true; break; }
}
process.exit(anyRefused ? 1 : 0);
