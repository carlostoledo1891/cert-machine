#!/usr/bin/env node
/* make-page.js — the edit loop: rebuild the named pages, sync site/, then run the page gates on what was just synced.

   WHY (2026-10-17). `make site` is playground + the control build's 137 batteries + the sync + six app builds: 10–15
   minutes on a free machine, 25 under load. On 10-16/17 four refused site builds cost about an hour of waiting for a
   one-paragraph change. The control build also ran the ruler BEFORE the sync, so it measured the stale copy of the page
   it had just been asked to check. Here the sync comes first and the gates measure the synced bytes. The batteries are
   not skipped: they still run in `make test`, in `make site` and at the end of a session. This loop runs none of them.

   usage: make page R="curveseeds pu"     each name is a builder: tools/build-report-<name>.js, `playground` for
                                          /instruments, or apps/<name> for an app (apps/<name>/build.js)
          make page                       sync only (the hubs and /about/ are written by the sync itself)
          make page R=pu MEASURE=0        skip the ruler (every page in Chrome at two widths; the slow gate)

   A NEW PAGE fails the gates until its baselines are accepted, in this order and with every page present:
   node tools/check-measure.js --accept, check-render.js --accept, check-style.js --accept. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const names = (process.env.R || '').split(/\s+/).filter(Boolean);
const builders = names.map((n) => n === 'playground' ? 'playground/build.js'
  : n.startsWith('apps/') ? n.replace(/\/$/, '') + '/build.js' : 'tools/build-report-' + n + '.js');
const missing = builders.filter((b) => !fs.existsSync(path.join(ROOT, b)));
if (missing.length) { console.error('make page: no builder ' + missing.join(', ')); process.exit(2); }

const t0 = Date.now();
const secs = (t) => ((Date.now() - t) / 1000).toFixed(0) + ' s';
/* a step prints its last lines when green and everything when red — a gate's verdict is its exit status, never a grep */
function step(label, file, args = [], tail = 2) {
  const t = Date.now();
  const r = cp.spawnSync(process.execPath, [file, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n');
  if (r.status !== 0) {
    console.error('  RED  ' + label + '  (exit ' + r.status + ', ' + secs(t) + ')\n      ' + out.slice(-30).join('\n      '));
    if (/check-(measure|render|style)/.test(file)) console.error('  a new page? accept its baselines in this order: check-measure, check-render, check-style (each --accept)');
    process.exit(1);
  }
  console.log('  ok   ' + label + '  (' + secs(t) + ')' + (tail ? '\n       ' + out.slice(-tail).join('\n       ') : ''));
}

for (const b of builders) step('build ' + b, b, [], 1);
step('sync site/', 'tools/build-site.js', [], 1);
step('copy census', 'tools/check-copy.js', [], 1);
step('style', 'tools/check-style.js', [], 1);
step('render', 'tools/check-render.js', [], 1);
if (process.env.MEASURE !== '0') step('measure (the ruler)', 'tools/check-measure.js', [], 1);
else console.log('  --   measure skipped (MEASURE=0) — run it before the commit that ships the page');
console.log('make page: ' + (names.length ? names.join(' ') : 'sync only') + ' — green in ' + secs(t0) + '; no battery ran (make test / make site run them)');
