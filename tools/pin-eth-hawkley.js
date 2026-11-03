#!/usr/bin/env node
/* pin-eth-hawkley.js — corpus/eth-refutation/hawkley/pins.json: the bytes of Daniel Hawkley's ETH cross-formalization
   (github.com/thinkthoughts/math @ d6b79b7d1, a fork of openai/math; RPI-378.3d:
   OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse : ¬ OAI.ParityWL.Complexity.PositiveRateETH →
   MainResults.ETHIsFalse), pinned before anything is run, and the OpenAI base it sits on checked against
   corpus/eth-refutation/pins.json.

     the delta   GitHub's compare of openai/math @ 7ef5c0cc (the base pinned for the kernel lane) with the fork's commit:
                 the fork must be ahead only (behind 0), and every file of the compare is fetched at the commit, its git
                 blob hash checked against the blob GitHub's compare names, its sha256 pinned, and the verified bytes
                 copied to corpus/eth-refutation/hawkley/src/ (the repository's LICENSE, Apache-2.0, beside them) so the
                 statement checks and their red controls run on the desk without a network
     the base    lean/lakefile.lean, the one file the fork MODIFIES: the base version fetched from openai/math at the pin,
                 its sha256 checked against pins.json; the fork's version must be the base with one contiguous block
                 inserted, recorded verbatim. The three ParityLifts files the challenge slices (Machines.lean, SAT.lean,
                 SATChoice.lean) and LICENSE fetched from openai/math at the pin and checked to have the SAME blob in the
                 fork; kept in corpus/eth-refutation/hawkley/base/ for the slice check
     Anthropic   the fork's two copies of eth/MainResults.lean must carry the sha256 pins.json pins for
                 anthropics/formal-math @ 16a5ce41 (a fact for the gates; recorded here too)

   Everything fetched is untrusted data: this tool reads bytes and never runs anything from them (the claimant's
   scripts/check_rpi378_challenge.py is copied as bytes, never run).

   usage: node tools/pin-eth-hawkley.js            (needs gh, authenticated) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley');
const OUT = path.join(DIR, 'pins.json');
const SRC = path.join(DIR, 'src');
const BASE = path.join(DIR, 'base');
const FORK = 'thinkthoughts/math';
const COMMIT = 'd6b79b7d165f9e6bef6e033949e3f14e913efdaa';
const SLICE_FILES = ['lean/OAI/Combinatorics/ParityLifts/Machines.lean', 'lean/OAI/Combinatorics/ParityLifts/SAT.lean', 'lean/OAI/Combinatorics/ParityLifts/SATChoice.lean'];
const CONFIG_FILE = 'lean/ComparatorChallenges/AnthropicETHCrossFormalization.json';
const LAKEFILE = 'lean/lakefile.lean';
const die = (m) => { console.error('HAWKLEY PIN REFUSED: ' + m); process.exit(1); };

const gh = (p) => {
  const r = cp.spawnSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) die('gh api ' + p + ': ' + (r.stderr || '').trim());
  return JSON.parse(r.stdout);
};
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gitBlob = (b) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + b.length + '\0'), b])).digest('hex');
/* a file's bytes at a commit through the contents API (base64; files under 1 MB), with the blob GitHub names */
function fetchFile(repo, ref, p) {
  const c = gh('repos/' + repo + '/contents/' + p.split('/').map(encodeURIComponent).join('/') + '?ref=' + ref);
  if (c.type !== 'file' || c.encoding !== 'base64') die(p + '@' + ref.slice(0, 8) + ': not a base64 file (' + c.type + ', ' + c.encoding + ')');
  const b = Buffer.from(c.content, 'base64');
  if (gitBlob(b) !== c.sha) die(p + '@' + ref.slice(0, 8) + ': the bytes do not hash to the blob GitHub names (' + c.sha + ')');
  return { bytes: b, blob: c.sha };
}

const ethPins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json'), 'utf8'));
const oai = ethPins.claims.openai;
const ant = ethPins.claims.anthropic;
const BASE_COMMIT = oai.commit;

/* the fork and its commit */
const repo = gh('repos/' + FORK);
if (!repo.fork || !repo.parent || repo.parent.full_name !== 'openai/math') die(FORK + ' is not a fork of openai/math');
const info = gh('repos/' + FORK + '/commits/' + COMMIT);

/* the delta: GitHub's compare, base...fork */
const cmp = gh('repos/' + FORK + '/compare/openai:' + BASE_COMMIT + '...' + FORK.split('/')[0] + ':' + COMMIT);
if (cmp.behind_by !== 0) die('the fork is behind openai/math@' + BASE_COMMIT.slice(0, 8) + ' by ' + cmp.behind_by + ' commits: not a pure extension of the pinned base');
if (cmp.files.length >= 300) die('the compare lists ' + cmp.files.length + ' files (GitHub caps the list at 300)');
const commits = cmp.commits.map((c) => ({ sha: c.sha, date: c.commit.committer.date, author: c.commit.author.name, message: c.commit.message.split('\n')[0] }));
const added = cmp.files.filter((f) => f.status === 'added').map((f) => f.filename).sort();
const modified = cmp.files.filter((f) => f.status === 'modified').map((f) => f.filename).sort();
const other = cmp.files.filter((f) => f.status !== 'added' && f.status !== 'modified').map((f) => f.status + ' ' + f.filename);
if (other.length) die('the delta holds files neither added nor modified: ' + other.join(', '));
if (modified.length !== 1 || modified[0] !== LAKEFILE) die('the fork modifies ' + JSON.stringify(modified) + ', not only ' + LAKEFILE);

/* every file of the delta, at the commit, its blob against the compare's, copied to src/ */
fs.rmSync(SRC, { recursive: true, force: true });
fs.rmSync(BASE, { recursive: true, force: true });
const files = {};
const blobs = {};
let bytes = 0;
for (const f of cmp.files) {
  const { bytes: b, blob } = fetchFile(FORK, COMMIT, f.filename);
  if (blob !== f.sha) die(f.filename + ': blob ' + blob + ' at the commit, but the compare names ' + f.sha);
  files[f.filename] = sha256(b);
  blobs[f.filename] = blob;
  bytes += b.length;
  fs.mkdirSync(path.dirname(path.join(SRC, f.filename)), { recursive: true });
  fs.writeFileSync(path.join(SRC, f.filename), b);
}
/* LICENSE: the repository's (OpenAI's, unchanged), beside the bytes */
const lic = fetchFile(FORK, COMMIT, 'LICENSE');
const licBase = fetchFile('openai/math', BASE_COMMIT, 'LICENSE');
if (lic.blob !== licBase.blob) die('LICENSE differs between the fork and openai/math');
fs.writeFileSync(path.join(SRC, 'LICENSE'), lic.bytes);
files.LICENSE = sha256(lic.bytes);
blobs.LICENSE = lic.blob;

/* the base: lakefile.lean (modified), the three slice sources and LICENSE (unchanged), from openai/math at the pin */
const base = {};
for (const p of [LAKEFILE, ...SLICE_FILES, 'LICENSE']) {
  const { bytes: b, blob } = fetchFile('openai/math', BASE_COMMIT, p);
  const want = oai.files[p];
  if (want && sha256(b) !== want) die(p + '@openai/math ' + BASE_COMMIT.slice(0, 8) + ' has sha256 ' + sha256(b) + ', pins.json says ' + want);
  base[p] = { sha256: sha256(b), blob, bytes: b.length, pinnedInEthPins: Boolean(want) };
  fs.mkdirSync(path.dirname(path.join(BASE, p)), { recursive: true });
  fs.writeFileSync(path.join(BASE, p), b);
  if (p !== LAKEFILE) {
    const inFork = fetchFile(FORK, COMMIT, p);
    if (inFork.blob !== blob) die(p + ' differs between the fork at ' + COMMIT.slice(0, 8) + ' and openai/math at ' + BASE_COMMIT.slice(0, 8));
    base[p].sameBlobInFork = true;
  }
}
/* the lakefile: the base with ONE contiguous block inserted */
const baseLake = fs.readFileSync(path.join(BASE, LAKEFILE), 'utf8').split('\n');
const forkLake = fs.readFileSync(path.join(SRC, LAKEFILE), 'utf8').split('\n');
let i = 0;
while (i < baseLake.length && i < forkLake.length && baseLake[i] === forkLake[i]) i++;
const inserted = forkLake.length - baseLake.length;
if (inserted <= 0 || forkLake.slice(i + inserted).join('\n') !== baseLake.slice(i).join('\n')) die(LAKEFILE + ': the fork\'s version is not the base with one contiguous block inserted');
const lakeBlock = forkLake.slice(i, i + inserted);

/* Anthropic's statement file, twice in the fork */
const MR = ant.files['eth/MainResults.lean'];
const mrCopies = ['lean/Vendor/Anthropic/MainResults.lean', 'lean/ComparatorChallenges/AnthropicETHCrossFormalization/MainResults.lean'];
for (const p of mrCopies) if (files[p] !== MR) die(p + ' has sha256 ' + files[p] + ', Anthropic\'s pinned eth/MainResults.lean is ' + MR);

const cfg = JSON.parse(fs.readFileSync(path.join(SRC, CONFIG_FILE), 'utf8'));
const record = {
  what: 'The bytes of Daniel Hawkley\'s ETH cross-formalization RPI-378.3d (OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse : ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse) at github.com/thinkthoughts/math @ d6b79b7d1, a fork of openai/math, pinned by sha256 before any run (tools/pin-eth-hawkley.js): GitHub\'s compare of the fork with openai/math @ 7ef5c0cc (the base corpus/eth-refutation/pins.json pins for the kernel lane) lists the files the fork adds and the one it modifies; each was fetched at the commit, its git blob hash checked against the blob the compare names, and copied to src/. The base lakefile and the three ParityLifts files the challenge slices were fetched from openai/math at the pin (base/), the lakefile checked against pins.json, the three checked to carry the same blob in the fork. No verdict lives here: tools/record-eth-hawkley.js writes certs/eth-hawkley-bridge.json.',
  pinnedAt: new Date().toISOString().slice(0, 10),
  hawkley: {
    repository: 'https://github.com/' + FORK,
    forkOf: 'https://github.com/openai/math',
    commit: COMMIT,
    commitDate: info.commit.committer.date,
    commitMessage: info.commit.message.split('\n')[0],
    author: info.commit.author.name,
    license: 'Apache-2.0 (the repository\'s LICENSE, OpenAI\'s, unchanged; copied beside the bytes in src/)',
    base: { repository: 'https://github.com/openai/math', commit: BASE_COMMIT, behindBy: cmp.behind_by, aheadBy: cmp.ahead_by, totalCommits: cmp.total_commits },
    commits,
    delta: { added, modified, fileCount: cmp.files.length },
    fileCount: Object.keys(files).length,
    bytes,
    listSha256: sha256(Object.keys(files).sort().map((p) => files[p] + '  ' + p + '\n').join('')),
    comparatorConfig: { path: CONFIG_FILE, sha256: files[CONFIG_FILE], content: cfg },
    lakefile: { base: base[LAKEFILE].sha256, fork: files[LAKEFILE], insertedAfterLine: i, insertedLines: lakeBlock },
    files,
    blobs,
  },
  base,
  statementPins: {
    mainResults: { repository: ant.repository, commit: ant.commit, path: 'eth/MainResults.lean', sha256: MR, copiesInFork: mrCopies },
    parityLiftsSlices: { repository: 'https://github.com/openai/math', commit: BASE_COMMIT, files: SLICE_FILES, note: 'the challenge\'s ParityLifts.lean is checked by tools/eth-hawkley-gates.js to be exactly lines 5–69 of Machines.lean, 5–35 of SAT.lean and 24–35 of SATChoice.lean, from base/, inside a fixed namespace skeleton' },
    openaiChallenge: { path: 'lean/ComparatorChallenges/SubexponentialSAT.lean', sha256: oai.files['lean/ComparatorChallenges/SubexponentialSAT.lean'], note: 'OpenAI\'s Comparator-checked statement; NOT the hypothesis of this theorem (see the record\'s gaps)' },
  },
};
fs.mkdirSync(DIR, { recursive: true });
writeStable(OUT, record, ['pinnedAt']);
console.log('Hawkley: ' + cmp.files.length + ' files in the delta (' + added.length + ' added, ' + modified.length + ' modified), ' + bytes + ' bytes, every blob equal to the compare\'s at ' + COMMIT.slice(0, 8) + '; ' + cmp.ahead_by + ' commits ahead of openai/math@' + BASE_COMMIT.slice(0, 8) + ', 0 behind; copied to ' + path.relative(ROOT, SRC));
console.log('base: ' + Object.keys(base).length + ' files from openai/math@' + BASE_COMMIT.slice(0, 8) + ' in ' + path.relative(ROOT, BASE) + '; lakefile block of ' + lakeBlock.length + ' lines after line ' + i);
console.log('MainResults.lean: both copies carry Anthropic\'s pinned sha256');
console.log('wrote ' + path.relative(ROOT, OUT));
