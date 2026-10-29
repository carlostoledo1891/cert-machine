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
   node tools/check-measure.js --accept, check-render.js --accept, check-style.js --accept.

   ONLY WHAT CHANGED (2026-10-28). Render and the ruler drove all ~134 pages in Chrome on every loop, ~4 minutes to check
   one edited page. Now they drive only the pages whose bytes moved since the last time this loop saw both gates green:
   a green run writes the hash of every site/ file to .gated-pages.json (git-ignored, this checkout's memory), and the
   next run drives a page when its own bytes differ from that record, or a file beside it or named in it does (a
   script, a style, a data file). A change to either gate, its baseline or the Chrome client drives every page, and so
   does a missing record. Nothing moved: the two Chrome gates do not run. Their full runs stay where they were: `make
   control`, `make site`, every --accept; ALL=1 drives every page here too. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const GATED = path.join(ROOT, '.gated-pages.json');
const GATES = ['tools/check-render.js', 'tools/check-measure.js', 'design/render-baseline.json', 'design/measure-baseline.json', 'design/cdp.js'];
const { skipDir } = require(path.join(ROOT, 'design', 'zones.js'));

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function hashes() {
  const out = {};
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!skipDir(SITE, p)) walk(p); }
      else out[path.relative(ROOT, p)] = sha(p);
    }
  })(SITE);
  for (const g of GATES) out[g] = sha(path.join(ROOT, g));
  return out;
}
/* the pages a change can reach: its own page, the pages beside a changed asset, the pages that name it; null = all */
function reached(before, after) {
  if (!before || GATES.some((g) => before[g] !== after[g])) return null;
  const moved = Object.keys(after).filter((f) => before[f] !== after[f]);
  const pages = Object.keys(after).filter((f) => f.endsWith('.html'));
  const hit = new Set(moved.filter((f) => f.endsWith('.html')));
  for (const f of moved.filter((m) => !m.endsWith('.html'))) {
    const dir = path.dirname(f), base = path.basename(f);
    for (const p of pages) if (path.dirname(p) === dir || fs.readFileSync(path.join(ROOT, p), 'utf8').includes(base)) hit.add(p);
  }
  return [...hit].sort();
}

const names = (process.env.R || '').split(/\s+/).filter(Boolean);
const builders = names.map((n) => n === 'playground' ? 'playground/build.js'
  : n.startsWith('apps/') ? n.replace(/\/$/, '') + '/build.js' : 'tools/build-report-' + n + '.js');
const missing = builders.filter((b) => !fs.existsSync(path.join(ROOT, b)));
if (missing.length) { console.error('make page: no builder ' + missing.join(', ')); process.exit(2); }

const t0 = Date.now();
const secs = (t) => ((Date.now() - t) / 1000).toFixed(0) + ' s';
/* a step prints its last lines when green and everything when red — a gate's verdict is its exit status, never a grep */
function step(label, file, args = [], tail = 2, env = {}) {
  const t = Date.now();
  const r = cp.spawnSync(process.execPath, [file, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: Object.assign({}, process.env, env) });
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
step('marks (pointed numbers re-read)', 'tools/check-marks.js', [], 1);
const now = hashes();
const last = (() => { try { return JSON.parse(fs.readFileSync(GATED, 'utf8')); } catch (e) { return null; } })();
const scope = process.env.ALL === '1' ? null : reached(last, now);
const env = scope ? { GATE_PAGES: scope.join(' ') } : {};
console.log('       ' + (!scope ? 'every page driven' + (process.env.ALL === '1' ? ' (ALL=1)' : ' (no green record, or a gate or baseline moved)')
  : scope.length ? scope.length + ' page(s) moved since the last green gates: ' + scope.slice(0, 6).map((p) => p.replace(/^site\//, '')).join(', ') + (scope.length > 6 ? ' …' : '')
  : 'no page moved since the last green gates'));
if (scope && !scope.length) console.log('  --   render and measure not run');
else {
  step('render', 'tools/check-render.js', [], 1, env);
  if (process.env.MEASURE !== '0') { step('measure (the ruler)', 'tools/check-measure.js', [], 1, env); fs.writeFileSync(GATED, JSON.stringify(now) + '\n'); }
  else console.log('  --   measure skipped (MEASURE=0) — run it before the commit that ships the page');
}
console.log('make page: ' + (names.length ? names.join(' ') : 'sync only') + ' — green in ' + secs(t0) + '; no battery ran (make test / make site run them)');
