#!/usr/bin/env node
/* convert_alphaevolve.js — extract AlphaEvolve's rank-48 <4,4,4> decomposition
   from the pinned DeepMind notebook into corpus/alphaevolve-corpus.json.

   Source: corpus/sources/alphaevolve_mathematical_results.ipynb — the
   commit-pinned mathematical_results.ipynb of google-deepmind/
   alphaevolve_results (see notes/alphaevolve-48.md; sha256 re-checked here
   and again by pin.js at every certify).

   The published factors are complex64 with entries in (1/2)Z[i] (components
   in {-1/2, 0, 1/2} — exact in float32, so the parse is lossless). This
   converter DOUBLES them: 2U, 2V, 2W over Z[i], and the corpus claim is
     sum_t (2u)(2v)(2w) = 8*T<4,4,4>      (ring 'Zi', scale 8)
   — denominators cleared, nothing rounded. The converter PROBES the claim
   with the instrument before writing: a mis-parse cannot land in the
   corpus, because the audit refuses it here first.

   usage: node tools/convert_alphaevolve.js */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'corpus', 'sources', 'alphaevolve_mathematical_results.ipynb');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'PINS.json'), 'utf8'));
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const die = (m) => { console.error('convert_alphaevolve REFUSES: ' + m); process.exit(1); };

const raw = fs.readFileSync(SRC);
const sha = crypto.createHash('sha256').update(raw).digest('hex');
const pinned = PINS['alphaevolve_mathematical_results.ipynb'];
if (!pinned) die('no pin for alphaevolve_mathematical_results.ipynb in PINS.json');
if (sha !== pinned) die('source sha256 ' + sha + ' != pin ' + pinned);

const nb = JSON.parse(raw.toString('utf8'));
const cell = nb.cells.find((c) => c.cell_type === 'code' && c.source.join('').includes('decomposition_444 = ('));
if (!cell) die('no code cell containing decomposition_444');
const src = cell.source.join('');

/* three np.array(...) blocks, in u, v, w order; parse every complex literal
   in each, in reading order, and reshape 16 x 48 row-major */
const blocks = src.split('np.array(').slice(1);
if (blocks.length !== 3) die('expected exactly 3 np.array blocks, found ' + blocks.length);
const CPLX = /([+-]?\s*\d+\.?\d*)\s*([+-]\s*\d+\.?\d*)j/g;
const factors = blocks.map((b, bi) => {
  const body = b.split('dtype=')[0];
  const vals = [];
  for (const m of body.matchAll(CPLX)) {
    const re = 2 * parseFloat(m[1].replace(/\s+/g, ''));
    const im = 2 * parseFloat(m[2].replace(/\s+/g, ''));
    if (!Number.isInteger(re) || !Number.isInteger(im) || Math.abs(re) > 1 || Math.abs(im) > 1)
      die('doubled coefficient not in {-1,0,1}+{-1,0,1}i: ' + m[0]);
    vals.push([re, im]);
  }
  if (vals.length !== 16 * 48) die('factor ' + bi + ': parsed ' + vals.length + ' entries, expected 768');
  const M = [];
  for (let i = 0; i < 16; i++) M.push(vals.slice(i * 48, (i + 1) * 48));
  return M;
});

const claim = { dims: [4, 4, 4], rank: 48, ring: 'Zi', scale: 8, U: factors[0], V: factors[1], W: factors[2] };
const probe = T.auditZi(claim);
if (probe.verdict !== 'VERIFIED') die('the parsed decomposition does not audit: ' + JSON.stringify(probe).slice(0, 300));
const probeBig = T.auditZiBig(claim);
if (probeBig.verdict !== 'VERIFIED' || probeBig.layout !== probe.layout) die('BigInt cross-check disagrees');

const out = {
  what: 'AlphaEvolve rank-48 <4,4,4> decomposition over (1/2)Z[i], doubled to Z[i] with scale 8 - '
    + 'converted from the pinned DeepMind notebook by tools/convert_alphaevolve.js; the converter '
    + 'audits the claim before writing, so a mis-parse cannot land here.',
  entries: [{
    id: 'alphaevolve-48-4x4x4',
    dims: [4, 4, 4], rank: 48, ring: 'Zi', scale: 8,
    U: claim.U, V: claim.V, W: claim.W,
    layoutProbe: probe.layout,
    source: 'AlphaEvolve (DeepMind, 2025; arXiv:2506.13131), mathematical_results.ipynb of '
      + 'google-deepmind/alphaevolve_results @ commit 4226acb - the first-party byte source',
    pinKey: 'alphaevolve_mathematical_results.ipynb',
    sourceSha256: sha,
    transcription: 'the code cell containing "decomposition_444 = (" parsed as three 16x48 complex '
      + 'factor matrices, every entry doubled from half-Gaussian to Z[i] (components verified in {-1,0,1})',
    note: '48 < 49 (Strassen-squared) for 4x4 over C - AlphaEvolve\'s headline; over Z[i] after doubling, '
      + 'as the exact identity sum (2u)(2v)(2w) = 8*T'
  }]
};
fs.writeFileSync(path.join(ROOT, 'corpus', 'alphaevolve-corpus.json'), JSON.stringify(out) + '\n');
console.log('corpus/alphaevolve-corpus.json written: rank-48 audited (' + probe.layout + ' layout, '
  + probe.equations + ' equations, scale 8) before landing');
