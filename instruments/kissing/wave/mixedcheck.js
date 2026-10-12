#!/usr/bin/env node
/* instruments/kissing/wave/mixedcheck.js — the kissing decision for rows of DIFFERENT lengths, in BigInt.

   Reads {rows: integer Cartesian rows} (a sample written by tools/run-kissing-configs.py) and decides every pair with
   no code shared with the Python paths: each row's squared norm is computed here; two rows of squared norms A, B and
   product p are at least 60 degrees apart iff p <= 0 or 4 p^2 <= A B, and touch iff 4 p^2 = A B with p > 0. Prints one
   JSON line: verdict, pairs, contacts, violations, the time. */
'use strict';
const fs = require('fs');
const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const t0 = Date.now();
const R = S.rows.map((r) => r.map((v) => BigInt(v)));
const N = R.map((x) => x.reduce((s, v) => s + v * v, 0n));
let pairs = 0, contacts = 0, violations = 0;
for (let i = 0; i < R.length; i++) {
  const x = R[i];
  for (let j = i + 1; j < R.length; j++) {
    const y = R[j];
    let p = 0n;
    for (let k = 0; k < x.length; k++) p += x[k] * y[k];
    pairs++;
    if (p > 0n) {
      const l = 4n * p * p, r = N[i] * N[j];
      if (l > r) violations++;
      else if (l === r) contacts++;
    }
  }
}
console.log(JSON.stringify({ verdict: violations ? 'REFUTED' : 'CERTIFIED', n: R.length, pairs, contacts, violations, ms: Date.now() - t0 }));
