#!/usr/bin/env node
/* zq-tree-check.js — whether the parts of Glazer et al.'s 11/5 release decided here are still the same bytes at a later
   head of their repository: every file under construction/ and lean/, compared by git blob id at the pin (git ls-tree in
   the read-only clone, ~/Projects/zq-scout/diophantine-z-q, never fetched into) and at the head (GitHub's git/trees API),
   plus the sha256 of the frozen Lean target at the head. Writes the record apps/z-in-q/build.js reads.

   usage: node tools/zq-tree-check.js --head <sha> --label "Version 4" --out corpus/zq/version4-tree-check.json   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CLONE = path.join(process.env.HOME, 'Projects', 'zq-scout', 'diophantine-z-q');
const REPO = 'elliotglazer/diophantine-z-q';
const FROZEN = 'lean/Frozen/BoundedIntegerPolynomial.lean';
const die = (m) => { console.error('zq-tree-check: ' + m); process.exit(1); };
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const HEAD = arg('--head'), LABEL = arg('--label'), OUT = arg('--out');
if (!/^[0-9a-f]{40}$/.test(HEAD || '') || !LABEL || !OUT) die('usage: --head <40-hex sha> --label <words> --out <path>');

const PIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs/zq-recount.json'), 'utf8')).pins.commit;
const decided = (p) => p.startsWith('construction/') || p.startsWith('lean/');
const at = {};
for (const line of execFileSync('git', ['-C', CLONE, 'ls-tree', '-r', PIN], { encoding: 'utf8' }).trim().split('\n')) {
  const [meta, p] = line.split('\t'); const [, type, blob] = meta.split(' ');
  if (type === 'blob' && decided(p)) at[p] = blob;
}
const tree = JSON.parse(execFileSync('gh', ['api', 'repos/' + REPO + '/git/trees/' + HEAD + '?recursive=1'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
if (tree.truncated) die('the head tree came back truncated');
const head = {};
for (const e of tree.tree) if (e.type === 'blob' && decided(e.path)) head[e.path] = e.sha;

const files = Object.keys(at).sort();
const changed = files.filter((p) => p in head && head[p] !== at[p]);
const removed = files.filter((p) => !(p in head));
const added = Object.keys(head).filter((p) => !(p in at)).sort();
const raw = execFileSync('curl', ['-sfL', 'https://raw.githubusercontent.com/' + REPO + '/' + HEAD + '/' + FROZEN]);
const rec = {
  what: 'Whether the parts of the 11/5 release decided here are unchanged in Glazer et al.\'s repository after ' + LABEL + ': every file under construction/ and lean/, compared by git blob id at the pin and at the head.',
  checked: new Date().toISOString().slice(0, 10),
  repository: 'github.com/' + REPO,
  pin: PIN,
  head: HEAD,
  method: 'node tools/zq-tree-check.js: git ls-tree -r at the pin in the read-only clone; GitHub API git/trees/<head>?recursive=1 at the head; blob ids compared path by path',
  files: files.length,
  unchanged: files.length - changed.length - removed.length,
  changed, removed, added,
  frozenTarget: { path: FROZEN, blobPin: at[FROZEN], blobHead: head[FROZEN], sha256Head: crypto.createHash('sha256').update(raw).digest('hex') }
};
fs.writeFileSync(path.resolve(ROOT, OUT), JSON.stringify(rec, null, 1) + '\n');
console.log(OUT + ': ' + rec.unchanged + ' of ' + rec.files + ' unchanged; changed ' + (changed.join(', ') || 'none') + '; removed ' + removed.length + '; added ' + added.length + '; frozen target ' + (rec.frozenTarget.blobPin === rec.frozenTarget.blobHead ? 'the same blob' : 'CHANGED'));
