'use strict';
/* d1.js — D1 and K1 of notes/twelve-blocks-preregistration-2026-11-19.md.
 * The delta-three inner certificate with N replaced by N + w wᵀ / c, given to this repository's own verifier,
 * unmodified (instruments/delta3/verify.js). Prints one JSON line. Usage: node d1.js 948 947 */
const path = require('node:path');
const Q = require('../interval/rational.js');
const V = require('../delta3/verify.js');
const original = require(path.join(V.ROOT, 'certs/delta3/inner-r20-g24_4_8.json'));
const widths = original.grid.slice(1).map((x, i) => Q.R(BigInt(x - original.grid[i]), 1096n));

function strengthened(c) {
  const cert = { ...original, N: { ...original.N } };
  for (let i = 0; i < widths.length; i++) for (let j = i; j < widths.length; j++) {
    const key = i + ',' + j;                     /* CERT-FORMAT: the upper triangle of a symmetric matrix */
    const add = Q.mul(Q.R(1n, BigInt(c)), Q.mul(widths[i], widths[j]));
    cert.N[key] = Q.toString(Q.add(V.rat(original.N[key] || '0', 'N'), add));
  }
  const r = V.verifyCertificate(cert, 'inner with N + w w^T/' + c);
  return { constant: c, verdict: r.verdict, why: r.why || null };
}

const out = { cells: widths.length, widthsSum: Q.toString(widths.reduce((a, b) => Q.add(a, b), Q.R(0n, 1n))), inner: process.argv.slice(2).map(Number).map(strengthened) };
const full = V.verifyAll(V.loadEntries(V.defaultFiles()));
out.theorem = full.theorem.verdict;
out.cover = full.cover.complete;
out.slabs = full.results.filter(x => x.kind === 'slab').map(x => ({ file: x.file, verdict: x.verdict, bound: String(x.bound), above1over3792: Q.cmp(V.rat(String(x.bound), 'slab'), Q.R(1n, 3792n)) > 0 }));
console.log(JSON.stringify(out));
