#!/usr/bin/env node
/* pin-eth-refutation.js — corpus/eth-refutation/pins.json: the bytes of the two claimed refutations of the Exponential
   Time Hypothesis, pinned before anything is run.

     OpenAI     github.com/openai/math, family 378: lean/ComparatorChallenges/SubexponentialSAT.{lean,json}, the scope
                note lean/docs/378.md, the proof lean/OAI/Algorithms/SubexponentialSAT/**, the preprint folder
                preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/**, and the four files that fix the
                build (lean-toolchain, lakefile.lean, lake-manifest.json, OAI.lean).
     Anthropic  github.com/anthropics/formal-math, the folder eth/** whole, and .github/** (the CI script its README
                names as "the fuller check").

   Each file is pinned by sha256, and its git blob hash is compared with the tree GitHub serves for the commit (gh api,
   read at run time), so the record says these are the commit's bytes, not a local checkout's. Refuses if a clone is
   missing, is not at its pin, a file differs from GitHub's tree, or the two file sets differ.

   The clones live OUTSIDE this repository and are untrusted data: this tool reads their bytes and never runs anything
   from them. Make them with a blobless sparse clone:
     git clone --filter=blob:none --no-checkout https://github.com/openai/math.git <oai>; (cd <oai> && git sparse-checkout
       set --no-cone '/lean/ComparatorChallenges/SubexponentialSAT.*' '/lean/ComparatorChallenges/README.md'
       '/lean/docs/378.md' '/lean/OAI/Algorithms/SubexponentialSAT/**' '/lean/lean-toolchain' '/lean/lakefile.lean'
       '/lean/lake-manifest.json' '/lean/OAI.lean' '/preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/**'
       && git checkout <pin>)
     git clone --filter=blob:none --no-checkout https://github.com/anthropics/formal-math.git <ant>; (cd <ant> && git
       sparse-checkout set --no-cone '/eth/**' '/.github/**' && git checkout <pin>)

   usage: node tools/pin-eth-refutation.js <oai-clone> <ant-clone> */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json');
const die = (m) => { console.error('ETH PIN REFUSED: ' + m); process.exit(1); };
const [oaiClone, antClone] = process.argv.slice(2);
if (!oaiClone || !antClone) die('usage: pin-eth-refutation.js <oai-clone> <ant-clone>');

const CLAIMS = {
  openai: {
    repository: 'https://github.com/openai/math', api: 'repos/openai/math', clone: oaiClone,
    commit: '7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a',
    // [folder in the repository, recursive?] — a file entry names one blob
    folders: ['lean/OAI/Algorithms/SubexponentialSAT', 'preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026'],
    files: ['lean/ComparatorChallenges/SubexponentialSAT.lean', 'lean/ComparatorChallenges/SubexponentialSAT.json',
      'lean/ComparatorChallenges/README.md', 'lean/docs/378.md', 'lean/lean-toolchain', 'lean/lakefile.lean',
      'lean/lake-manifest.json', 'lean/OAI.lean'],
    project: 'lean', config: 'lean/ComparatorChallenges/SubexponentialSAT.json',
  },
  anthropic: {
    repository: 'https://github.com/anthropics/formal-math', api: 'repos/anthropics/formal-math', clone: antClone,
    commit: '16a5ce41304fcdaea4e0be7c132e1c361dc26da5',
    folders: ['eth', '.github'], files: [],
    project: 'eth', config: 'eth/comparator.json',
  },
};

const gh = (p) => {
  const r = cp.spawnSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) die('gh api ' + p + ': ' + (r.stderr || '').trim());
  return JSON.parse(r.stdout);
};
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gitBlob = (b) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + b.length + '\0'), b])).digest('hex');
const headOf = (clone) => {
  const h = fs.readFileSync(path.join(clone, '.git', 'HEAD'), 'utf8').trim();
  return /^[0-9a-f]{40}$/.test(h) ? h : null;   // a detached checkout at the pin; a branch name is refused
};
/* the tree GitHub serves for <dir> at the commit, walked from the root tree one name at a time */
function remoteTree(c, dir) {
  const root = gh(c.api + '/commits/' + c.commit).commit.tree.sha;
  let sha = root;
  for (const name of dir ? dir.split('/') : []) {
    const t = gh(c.api + '/git/trees/' + sha);
    const e = t.tree.find((x) => x.path === name);
    if (!e) die(c.repository + ' has no ' + dir + ' at ' + c.commit);
    sha = e.sha;
  }
  return sha;
}
function remoteBlobs(c) {
  const want = new Map();
  for (const f of c.folders) {
    const t = gh(c.api + '/git/trees/' + remoteTree(c, f) + '?recursive=1');
    if (t.truncated) die('GitHub truncated the tree of ' + f);
    for (const e of t.tree) if (e.type === 'blob') want.set(f + '/' + e.path, e.sha);
  }
  const byDir = new Map();
  for (const f of c.files) { const d = path.posix.dirname(f); if (!byDir.has(d)) byDir.set(d, []); byDir.get(d).push(f); }
  for (const [d, fs_] of byDir) {
    const t = gh(c.api + '/git/trees/' + remoteTree(c, d));
    for (const f of fs_) {
      const e = t.tree.find((x) => x.path === path.posix.basename(f) && x.type === 'blob');
      if (!e) die(c.repository + ' has no ' + f + ' at ' + c.commit);
      want.set(f, e.sha);
    }
  }
  return want;
}
function walk(dir, rel, out) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(dir, r, out); else if (e.isFile()) out.push(r);
  }
  return out;
}

const record = {
  what: 'The bytes of the two claimed refutations of the Exponential Time Hypothesis, pinned by sha256 before any run (tools/pin-eth-refutation.js). Every file\'s git blob hash was compared with the tree GitHub serves for the commit. No verdict lives here: the kernel lane writes certs/eth-kernel.json.',
  pinnedAt: new Date().toISOString().slice(0, 10),
  claims: {},
};
for (const [name, c] of Object.entries(CLAIMS)) {
  if (!fs.existsSync(path.join(c.clone, '.git'))) die('no clone at ' + c.clone);
  const head = headOf(c.clone);
  if (head !== c.commit) die(name + ': the clone is at ' + head + ', not the pinned ' + c.commit);
  const want = remoteBlobs(c);
  const local = [];
  for (const f of c.folders) walk(c.clone, f, []).forEach((p) => local.push(p));
  for (const f of c.files) local.push(f);
  const files = {};
  let bytes = 0;
  for (const p of [...new Set(local)].sort()) {
    const b = fs.readFileSync(path.join(c.clone, p));
    if (!want.has(p)) die(name + ': ' + p + ' is in the clone but not in GitHub\'s tree');
    if (gitBlob(b) !== want.get(p)) die(name + ': ' + p + ' differs from GitHub\'s blob ' + want.get(p));
    files[p] = sha256(b);
    bytes += b.length;
  }
  const missing = [...want.keys()].filter((p) => !(p in files));
  if (missing.length) die(name + ': GitHub lists ' + missing.length + ' files the clone lacks, e.g. ' + missing[0]);
  const rd = (p) => fs.readFileSync(path.join(c.clone, p), 'utf8');
  const manifest = JSON.parse(rd(c.project + '/lake-manifest.json'));
  const commitInfo = gh(c.api + '/commits/' + c.commit);
  const counts = {};
  for (const p of Object.keys(files)) {
    const top = c.folders.find((f) => p.startsWith(f + '/')) || 'files';
    const k = top + (p.endsWith('.lean') ? ' (.lean)' : ' (other)');
    counts[k] = (counts[k] || 0) + 1;
  }
  record.claims[name] = {
    repository: c.repository,
    commit: c.commit,
    commitDate: commitInfo.commit.committer.date,
    commitMessage: commitInfo.commit.message.split('\n')[0],
    tree: commitInfo.commit.tree.sha,
    project: c.project,
    toolchain: rd(c.project + '/lean-toolchain').trim(),
    mathlib: (manifest.packages.find((p) => p.name === 'mathlib') || {}).rev || null,
    dependencies: manifest.packages.map((p) => ({ name: p.name, rev: p.rev })).sort((a, b) => a.name.localeCompare(b.name)),
    comparatorConfig: { path: c.config, sha256: files[c.config], content: JSON.parse(rd(c.config)) },
    folders: c.folders, singleFiles: c.files,
    counts, fileCount: Object.keys(files).length, bytes,
    // one hash over the sorted "sha256  path" lines (sha256sum's format): the pod recomputes it before it builds
    listSha256: sha256(Object.keys(files).sort().map((p) => files[p] + '  ' + p + '\n').join('')),
    files,
  };
  console.log(name + ': ' + Object.keys(files).length + ' files, ' + bytes + ' bytes, every blob equal to GitHub\'s at ' + c.commit.slice(0, 8));
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeStable(OUT, record, ['pinnedAt']);
console.log('wrote ' + path.relative(ROOT, OUT));
