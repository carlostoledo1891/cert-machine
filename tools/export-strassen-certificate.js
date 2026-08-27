#!/usr/bin/env node
/* export-strassen-certificate.js — detach the fast-matmul certificates
   (R7 pattern): every verified algorithm as explicit integer factor
   matrices plus the exact identity a stranger's stdlib can re-derive.

   usage: node tools/export-strassen-certificate.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FAM = require(path.join(ROOT, 'families', 'strassen-audit.js'));
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };

const entries = [];
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i);
  if (!o) break;
  const c = FAM.certify(o);
  if (c.verdict !== 'HIT') continue;
  entries.push({
    id: o.id, source: o.source,
    dims: o.claim.dims, rank: c.extra.rank, naive: c.extra.naive,
    ring: c.extra.ring, layout: c.extra.layout,
    scale: c.extra.scale || undefined,
    statement: c.text,
    U: o.claim.U, V: o.claim.V, W: o.claim.W,
    overQ: c.extra.overQ || undefined,
    sourcePin: c.extra.sourcePin || undefined
  });
}

const out = {
  what: 'Detached certificates for fast matrix-multiplication algorithms. Each entry claims: the rank-r integer '
    + 'factors U (nm x r), V (mp x r), W (np x r) satisfy, over the stated ring and under the stated C-layout, '
    + 'the matmul tensor identity — for every A-index (a,b), B-index (b\',c), C-index k: '
    + 'sum_t U[ab][t]*V[b\'c][t]*W[k][t] = [b=b\']*[k=index(a,c)] (mod 2 when ring is F2). '
    + 'That makes the factors a correct algorithm for ALL matrices, in r < nmp multiplications. '
    + 'Verify with tools/verify_strassen.py — Python stdlib only, no code from this repo.',
  layoutNote: 'layout AC: k = a*p + c; layout CA: k = c*n + a.',
  generatedBy: 'tools/export-strassen-certificate.js @ git ' + (sh('git rev-parse --short HEAD') || 'unknown'),
  sourcePins: { 'alphatensor_r.npz': PIN.PINS['alphatensor_r.npz'], 'alphatensor_f2.npz': PIN.PINS['alphatensor_f2.npz'],
    'alphaevolve_mathematical_results.ipynb': PIN.PINS['alphaevolve_mathematical_results.ipynb'] },
  entries
};

fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'certs', 'strassen-certificate.json'), JSON.stringify(out) + '\n');
console.log('certs/strassen-certificate.json: ' + entries.length + ' certificates detached');
