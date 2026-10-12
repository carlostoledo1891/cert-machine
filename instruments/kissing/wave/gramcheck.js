#!/usr/bin/env node
/* instruments/kissing/wave/gramcheck.js — the Gram-form kissing decision in a second language.

   Reads a JSON file {gram: m x m integers (the numerators of G), normInteger: N, rows: integer coefficient rows}
   written by gram.py from a sample, and decides the sample whole in BigInt — no bound to argue, no code shared with
   the Python bulk path: G symmetric, every row's z G z^T equal to N, and for every pair 2 z G z'^T <= N (angle >= 60
   degrees), counting contacts (2P = N). Prints one JSON line: verdict, pairs, contacts, violations, the largest
   inner product, the time. Positive definiteness is gram.py's exact LDL^T; this program reads the same matrix. */
'use strict';
const fs = require('fs');
const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const t0 = Date.now();
const G = S.gram.map((r) => r.map((v) => BigInt(v)));
const m = G.length;
const N = BigInt(S.normInteger);
const Z = S.rows.map((r) => r.map((v) => BigInt(v)));
let verdict = 'CERTIFIED', reason = null;
for (let i = 0; i < m && !reason; i++) for (let j = 0; j < i; j++) if (G[i][j] !== G[j][i]) { reason = 'the Gram matrix is not symmetric'; break; }
/* w = z G, once per row */
const W = Z.map((z) => { const w = new Array(m).fill(0n); for (let l = 0; l < m; l++) if (z[l] !== 0n) for (let k = 0; k < m; k++) w[k] += z[l] * G[l][k]; return w; });
const dot = (a, b) => { let s = 0n; for (let k = 0; k < m; k++) s += a[k] * b[k]; return s; };
for (let i = 0; i < Z.length && !reason; i++) if (dot(W[i], Z[i]) !== N) reason = 'row ' + i + ' has z G z^T != ' + N;
let pairs = 0, contacts = 0, violations = 0, maxDot = null;
if (!reason) {
  for (let i = 0; i < Z.length; i++) {
    for (let j = i + 1; j < Z.length; j++) {
      const p = dot(W[i], Z[j]);
      pairs++;
      if (2n * p > N) violations++;
      else if (2n * p === N) contacts++;
      if (maxDot === null || p > maxDot) maxDot = p;
    }
  }
  if (violations) verdict = 'REFUTED';
} else verdict = 'REFUSED';
console.log(JSON.stringify({ verdict, n: Z.length, pairs, contacts, violations, maxDot: maxDot === null ? null : maxDot.toString(), reason, ms: Date.now() - t0 }));
