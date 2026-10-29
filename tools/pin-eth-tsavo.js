#!/usr/bin/env node
/* pin-eth-tsavo.js — corpus/eth-refutation/tsavo/pins.json: the bytes of TSavo's ETH bridge (github.com/TSavo/eth-bridge
   @ 34f9ca20, Apache-2.0), pinned before anything is run, and the Anthropic project it is built inside checked again
   against corpus/eth-refutation/pins.json.

     TSavo      every file of the commit's tree, by sha256, each git blob hash compared with the tree GitHub serves for
                the commit (gh api, read at run time), so the record says these are the commit's bytes; the verified
                tree is copied to corpus/eth-refutation/tsavo/src/ (LICENSE and NOTICE included) so the statement checks
                and their red controls run on the desk without a network
     Anthropic  the clone's eth/** and .github/** against the sha256 of every file pins.json pins for 16a5ce41 (none
                missing, none extra); nothing new is pinned for it here

   The clones live OUTSIDE this repository and are untrusted data: this tool reads their bytes and never runs anything
   from them:
     git clone https://github.com/TSavo/eth-bridge.git <tsavo>; (cd <tsavo> && git checkout <pin>)
     git clone --filter=blob:none --no-checkout https://github.com/anthropics/formal-math.git <ant>; (cd <ant> && git
       sparse-checkout set --no-cone '/eth/**' '/.github/**' && git checkout <pin>)

   usage: node tools/pin-eth-tsavo.js <tsavo-clone> <ant-clone> */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'corpus', 'eth-refutation', 'tsavo');
const OUT = path.join(DIR, 'pins.json');
const SRC = path.join(DIR, 'src');
const REPO = 'https://github.com/TSavo/eth-bridge';
const API = 'repos/TSavo/eth-bridge';
const COMMIT = '34f9ca204bed7fa6c595e56966773726e98dd3fd';
const die = (m) => { console.error('TSAVO PIN REFUSED: ' + m); process.exit(1); };
const [tsavoClone, antClone] = process.argv.slice(2);
if (!tsavoClone || !antClone) die('usage: pin-eth-tsavo.js <tsavo-clone> <ant-clone>');

const gh = (p) => {
  const r = cp.spawnSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) die('gh api ' + p + ': ' + (r.stderr || '').trim());
  return JSON.parse(r.stdout);
};
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gitBlob = (b) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + b.length + '\0'), b])).digest('hex');
const headOf = (clone) => {
  const h = fs.readFileSync(path.join(clone, '.git', 'HEAD'), 'utf8').trim();
  return /^[0-9a-f]{40}$/.test(h) ? h : null;
};
function walk(dir, rel = '', out = []) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(dir, r, out); else if (e.isFile()) out.push(r);
  }
  return out;
}

/* TSavo: the whole tree of the commit */
if (!fs.existsSync(path.join(tsavoClone, '.git'))) die('no clone at ' + tsavoClone);
if (headOf(tsavoClone) !== COMMIT) die('the TSavo clone is at ' + headOf(tsavoClone) + ', not the pinned ' + COMMIT);
const info = gh(API + '/commits/' + COMMIT);
const tree = gh(API + '/git/trees/' + info.commit.tree.sha + '?recursive=1');
if (tree.truncated) die('GitHub truncated the tree');
const remote = new Map(tree.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
const local = walk(tsavoClone).sort();
const files = {};
let bytes = 0;
for (const p of local) {
  const b = fs.readFileSync(path.join(tsavoClone, p));
  if (!remote.has(p)) die(p + ' is in the clone but not in GitHub\'s tree');
  if (gitBlob(b) !== remote.get(p)) die(p + ' differs from GitHub\'s blob ' + remote.get(p));
  files[p] = sha256(b);
  bytes += b.length;
}
const missing = [...remote.keys()].filter((p) => !(p in files));
if (missing.length) die('GitHub lists ' + missing.length + ' files the clone lacks, e.g. ' + missing[0]);

/* Anthropic: the clone against pins.json, nothing new pinned */
const ethPins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json'), 'utf8'));
const ant = ethPins.claims.anthropic;
if (headOf(antClone) !== ant.commit) die('the Anthropic clone is at ' + headOf(antClone) + ', not ' + ant.commit);
const antLocal = ant.folders.flatMap((f) => walk(antClone, f));
const antBad = [];
for (const [p, s] of Object.entries(ant.files)) {
  const f = path.join(antClone, p);
  if (!fs.existsSync(f)) antBad.push(p + ': missing');
  else if (sha256(fs.readFileSync(f)) !== s) antBad.push(p + ': sha256 differs');
}
const antExtra = antLocal.filter((p) => !(p in ant.files));
if (antBad.length || antExtra.length) die('the Anthropic clone differs from pins.json: ' + antBad.concat(antExtra.map((p) => p + ': unpinned')).slice(0, 5).join('; '));
const antList = sha256(Object.keys(ant.files).sort().map((p) => ant.files[p] + '  ' + p + '\n').join(''));
if (antList !== ant.listSha256) die('the pinned list hash does not recompute');

/* the copy on the desk: exactly the verified bytes */
fs.rmSync(SRC, { recursive: true, force: true });
for (const p of Object.keys(files)) {
  fs.mkdirSync(path.dirname(path.join(SRC, p)), { recursive: true });
  fs.copyFileSync(path.join(tsavoClone, p), path.join(SRC, p));
}
const rd = (p) => fs.readFileSync(path.join(tsavoClone, p), 'utf8');
const record = {
  what: 'The bytes of TSavo\'s ETH bridge (Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse), pinned by sha256 before any run (tools/pin-eth-tsavo.js); every file\'s git blob hash was compared with the tree GitHub serves for the commit. The Anthropic project it is built inside is anthropics/formal-math@16a5ce41, whose files corpus/eth-refutation/pins.json already pins; this tool checked a fresh clone against those pins again. No verdict lives here: tools/record-eth-tsavo.js writes certs/eth-tsavo-bridge.json.',
  pinnedAt: new Date().toISOString().slice(0, 10),
  tsavo: {
    repository: REPO,
    commit: COMMIT,
    commitDate: info.commit.committer.date,
    commitMessage: info.commit.message.split('\n')[0],
    tree: info.commit.tree.sha,
    license: 'Apache-2.0 (LICENSE, NOTICE; copied beside the bytes in src/)',
    fileCount: Object.keys(files).length,
    bytes,
    listSha256: sha256(Object.keys(files).sort().map((p) => files[p] + '  ' + p + '\n').join('')),
    comparatorConfig: { path: 'comparator_bridge.json', sha256: files['comparator_bridge.json'], content: JSON.parse(rd('comparator_bridge.json')) },
    files,
  },
  anthropic: {
    repository: ant.repository,
    commit: ant.commit,
    checkedAgainst: 'corpus/eth-refutation/pins.json',
    folders: ant.folders,
    fileCount: ant.fileCount,
    listSha256: ant.listSha256,
    result: 'every pinned file present with its sha256, no unpinned file in ' + ant.folders.join(' or '),
  },
  statementPins: {
    openaiChallenge: { repository: ethPins.claims.openai.repository, commit: ethPins.claims.openai.commit, path: 'lean/ComparatorChallenges/SubexponentialSAT.lean', sha256: ethPins.claims.openai.files['lean/ComparatorChallenges/SubexponentialSAT.lean'] },
    mainResults: { path: 'eth/MainResults.lean', sha256: ant.files['eth/MainResults.lean'] },
    lakefile: { path: 'eth/lakefile.toml', sha256: ant.files['eth/lakefile.toml'] },
  },
};
fs.mkdirSync(DIR, { recursive: true });
writeStable(OUT, record, ['pinnedAt']);
console.log('TSavo: ' + Object.keys(files).length + ' files, ' + bytes + ' bytes, every blob equal to GitHub\'s at ' + COMMIT.slice(0, 8) + '; copied to ' + path.relative(ROOT, SRC));
console.log('Anthropic: ' + Object.keys(ant.files).length + ' files equal to pins.json at ' + ant.commit.slice(0, 8));
console.log('wrote ' + path.relative(ROOT, OUT));
