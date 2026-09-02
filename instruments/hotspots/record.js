/* record.js — the ember chain's record envelope.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   One writer, one reader. Every stage writes certs/ember-<stage>.json with
   the same envelope; downstream stages READ their inputs from upstream
   records (the bench hand-copied constants across files — the drift the
   machine doctrine forbids). require() of an upstream record REFUSES if
   the record is missing or its verdict is not VERIFIED. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CERTS = path.join(__dirname, '..', '..', 'certs');

const TRUST_BASE = [
  'instruments/interval rigor model (outward-rounded IEEE doubles; exact BigInt rationals)',
  'instruments/ivspecial (interval Γ Spouge + Bessel J_ν; battery: closed-form falsifiers + bigfloat/exact-rational cross-gates)',
  'Liu framework Thm 2.4 (Appl. Math. Comput. 2015), as quoted in You–Xie–Liu arXiv:1808.08148 §2 — LITERATURE INPUT, assumed not certified; pinned at corpus/sources/liu2018_arxiv-1808-08148.pdf (sha256 fb867aa5…), transcription beside the pin',
  'Liu Lemma 3.2 CR interpolation constant 0.1893·h_K, arXiv:1808.08148 p.8 (Lemma 3.2 quoting Liu 2015) — LITERATURE INPUT, assumed not certified; same pin',
  'classical facts: Neumann separation in a sector + H¹ regularity (excludes the singular Bessel family), Green identity, spectral theorem, Courant',
];

function write(stage, body) {
  const rec = {
    record: 'ember-' + stage,
    campaign: 'ember — certified hot spots for a trapezoid outside every proven class',
    specimen: {
      vertices: ['(0, 0)', '(1, 0)', '(17/20, 9/10)', '(1/4, 9/10)'],
      note: 'vertices are EXACT RATIONALS; convex; side slopes 6 and 18/5; no symmetry axis; not a lip domain',
    },
    generated: new Date().toISOString(),
    trustBase: TRUST_BASE,
    source: {
      bench: '/Users/carlostoledo/Documents/frontier-apps/experiments/ember/',
      note: 'frontier-apps has NO git and is NOT a lift source; the bench scripts are pinned byte-for-byte in instruments/hotspots/frontier-ref/ and every proof-bearing quantity is recomputed HERE on instruments/interval + instruments/ivspecial',
    },
    ...body,
  };
  const file = path.join(CERTS, 'ember-' + stage + '.json');
  fs.writeFileSync(file, JSON.stringify(rec, null, 1));
  return file;
}

function read(stage) {
  const file = path.join(CERTS, 'ember-' + stage + '.json');
  if (!fs.existsSync(file)) {
    throw new Error('ember record missing: ' + file + ' — run the upstream stage first (node tools/run-ember-chain.js ' + stage + ')');
  }
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (rec.verdict !== 'VERIFIED') throw new Error('ember record ' + stage + ' verdict is ' + rec.verdict + ', refusing to build on it');
  return rec;
}

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

module.exports = { write, read, sha256, CERTS, TRUST_BASE };
