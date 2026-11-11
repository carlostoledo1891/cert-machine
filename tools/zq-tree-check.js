#!/usr/bin/env node
/* zq-tree-check.js — whether the parts of Glazer et al.'s 11/5 release decided here are still the same bytes at a later
   head of their repository: every file under construction/ and lean/, compared by git blob id at the pin (git ls-tree in
   the read-only clone, ~/Projects/zq-scout/diophantine-z-q, never fetched into) and at the head (GitHub's git/trees API),
   plus the sha256 of the frozen Lean target at the head; and, once the Version 4 quartic is decided (certs/zq-v4.json), its
   package quartics/quartic-4973/ compared the same way between that record's pin and the head. Writes the record
   apps/z-in-q/build.js reads.

   Since 2026-11-11 the record also says what the head calls itself (the first "## Version N" heading of its README, with
   the README's sha256) and, with --since <the head of the previous check>, what is NEW at the head and so not decided
   here: the files added, changed and removed across the whole tree since that head, the added ones counted by folder.
   A `reading` field, where a record has one (Versions 3, 15, 16), is prose added by hand after the run; a re-run drops it.

   usage: node tools/zq-tree-check.js --head <sha> --label "Version 4" --out corpus/zq/version4-tree-check.json [--since <sha>]   MIT */
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
const HEAD = arg('--head'), LABEL = arg('--label'), OUT = arg('--out'), SINCE = arg('--since');
if (!/^[0-9a-f]{40}$/.test(HEAD || '') || !LABEL || !OUT) die('usage: --head <40-hex sha> --label <words> --out <path> [--since <40-hex sha>]');
if (SINCE !== null && !/^[0-9a-f]{40}$/.test(SINCE)) die('--since takes a 40-hex sha');

const PIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs/zq-recount.json'), 'utf8')).pins.commit;
const decided = (p) => p.startsWith('construction/') || p.startsWith('lean/');
const at = {};
for (const line of execFileSync('git', ['-C', CLONE, 'ls-tree', '-r', PIN], { encoding: 'utf8' }).trim().split('\n')) {
  const [meta, p] = line.split('\t'); const [, type, blob] = meta.split(' ');
  if (type === 'blob' && decided(p)) at[p] = blob;
}
const treeAt = (c) => { const t = JSON.parse(execFileSync('gh', ['api', 'repos/' + REPO + '/git/trees/' + c + '?recursive=1'], { encoding: 'utf8', maxBuffer: 1 << 28 })); if (t.truncated) die('the tree at ' + c + ' came back truncated'); return t.tree.filter((e) => e.type === 'blob'); };
const tree = treeAt(HEAD);
const head = {};
for (const e of tree) if (decided(e.path)) head[e.path] = e.sha;
/* the Version 4 quartic's package, from the pin of its decision to the head */
const V4REC = path.join(ROOT, 'certs/zq-v4.json');
let quartic4973 = null;
if (fs.existsSync(V4REC)) {
  const base = JSON.parse(fs.readFileSync(V4REC, 'utf8')).pins.commit, PKG = 'quartics/quartic-4973/';
  const pick = (blobs) => Object.fromEntries(blobs.filter((e) => e.path.startsWith(PKG)).map((e) => [e.path, e.sha]));
  const a = pick(treeAt(base)), b = pick(tree);
  const ks = Object.keys(a);
  quartic4973 = { base, files: ks.length, unchanged: ks.filter((k) => b[k] === a[k]).length, changed: ks.filter((k) => k in b && b[k] !== a[k]), removed: ks.filter((k) => !(k in b)), added: Object.keys(b).filter((k) => !(k in a)) };
}

const files = Object.keys(at).sort();
const changed = files.filter((p) => p in head && head[p] !== at[p]);
const removed = files.filter((p) => !(p in head));
const added = Object.keys(head).filter((p) => !(p in at)).sort();
const raw = execFileSync('curl', ['-sfL', 'https://raw.githubusercontent.com/' + REPO + '/' + HEAD + '/' + FROZEN]);
/* what the head calls itself: its README's first "## Version N" heading */
const readmeRaw = execFileSync('curl', ['-sfL', 'https://raw.githubusercontent.com/' + REPO + '/' + HEAD + '/README.md'], { maxBuffer: 1 << 26 });
const heading = /^## (Version \d+)\s*$/m.exec(readmeRaw.toString('utf8'));
/* what is new since the previous check's head, over the whole tree (none of it decided here) */
let since = null;
if (SINCE) {
  const a = new Map(treeAt(SINCE).map((e) => [e.path, e])), b = new Map(tree.map((e) => [e.path, e]));
  const addedAll = [...b.keys()].filter((p) => !a.has(p));
  const folder = (p) => { const q = p.split('/'); return q.length === 1 ? '(top level)' : ['research', 'docs', 'quartics', 'manuscripts'].includes(q[0]) && q.length > 2 ? q[0] + '/' + q[1] : q[0]; };
  const by = {};
  for (const p of addedAll) by[folder(p)] = (by[folder(p)] || 0) + 1;
  since = { head: SINCE, filesThen: a.size, filesNow: b.size, added: addedAll.length, addedBytes: addedAll.reduce((n, p) => n + (b.get(p).size || 0), 0),
    changed: [...b.keys()].filter((p) => a.has(p) && a.get(p).sha !== b.get(p).sha).length, removed: [...a.keys()].filter((p) => !b.has(p)).length,
    addedByFolder: Object.fromEntries(Object.entries(by).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))),
    addedUnderDecidedParts: addedAll.filter((p) => decided(p) || p.startsWith('quartics/quartic-4973/')).length };
}
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
  frozenTarget: { path: FROZEN, blobPin: at[FROZEN], blobHead: head[FROZEN], sha256Head: crypto.createHash('sha256').update(raw).digest('hex') },
  ...(quartic4973 ? { quartic4973 } : {}),
  readme: { sha256Head: crypto.createHash('sha256').update(readmeRaw).digest('hex'), heading: heading ? heading[1] : null },
  ...(since ? { since } : {})
};
fs.writeFileSync(path.resolve(ROOT, OUT), JSON.stringify(rec, null, 1) + '\n');
console.log(OUT + ': ' + rec.unchanged + ' of ' + rec.files + ' unchanged; changed ' + (changed.join(', ') || 'none') + '; removed ' + removed.length + '; added ' + added.length + '; frozen target ' + (rec.frozenTarget.blobPin === rec.frozenTarget.blobHead ? 'the same blob' : 'CHANGED') + (quartic4973 ? '; the Version 4 package ' + quartic4973.unchanged + ' of ' + quartic4973.files + ' unchanged' : '')
  + '; the head\'s README says ' + (rec.readme.heading || 'no version') + (since ? '; since ' + SINCE.slice(0, 8) + ': ' + since.added + ' files added, ' + since.changed + ' changed, ' + since.removed + ' removed' : ''));
