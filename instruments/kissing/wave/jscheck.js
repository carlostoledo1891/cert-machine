#!/usr/bin/env node
/* instruments/kissing/wave/jscheck.js — the second language on a sampled block.

   Reads a JSON file of vectors (each {c1, c2, c3, c6} integer arrays, one common norm) written by
   tools/run-kissing-wave.py from a decided configuration, decides EVERY pair of the sample with
   basis.js (integers in doubles under its 2^50 guard, the BigInt tower for hard signs — no code
   shared with the Python engine), and prints one JSON line: pairs, contacts, violations, the
   largest inner product. The runner compares it with the Python engine on the same sample. */
'use strict';
const fs = require('fs');
const path = require('path');
const BS = require(path.join(__dirname, '..', 'basis.js'));
const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const V = S.vectors.map((v) => BS.vec(v[0], v[1], v[2], v[3]));
const r = BS.certify(V);
const violations = r.verdict === 'REFUTED' ? 1 : 0;
console.log(JSON.stringify({ verdict: r.verdict, n: V.length, pairs: r.pairs, contacts: r.contacts === undefined ? null : r.contacts,
  violations, maxDot: r.maxDot || null, norm: r.norm, ms: r.ms, reason: r.reason || null }));
