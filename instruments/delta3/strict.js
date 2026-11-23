#!/usr/bin/env node
/* strict.js — the strictness the uniqueness step needs: the inner certificate's matrix P is positive DEFINITE.
   instruments/delta3 · cert-machine

   Why this file exists. verify.js proves every matrix it meets positive SEMIdefinite (psd.js accepts a remainder
   whose row margins are >= 0, and drops rows that are exactly zero). That is all the five lower bounds need. The
   uniqueness of the minimisers (paper, §5) needs more: y^T P y > 0 for y != 0, i.e. P strictly positive definite.
   The paper said verify.js proved it; it did not check strictness (pointed out by the Erdős Problem a Day referee
   report of 2026-11-19, received 2026-11-23). verify.js and psd.js are left byte-for-byte as they are, because
   other records pin their bytes (the twelve-blocks run); this separate check closes the gap.

   What it does.
     1. Runs verify.js on the five certificate files, capturing the one matrix P that verify.js hands to provePSD
        while it checks the inner certificate (the identity and every multiplier are verify.js's checks, unchanged;
        the run must end VERIFIED).
     2. Decides P > 0 exactly, by its own fraction-free (Bareiss) elimination on the integer matrix den·P: every
        leading principal minor must be > 0 (Sylvester's criterion). No floating point. Shares no code with psd.js.
     3. Reports, from psd.js's own run on P, the two facts that also imply strictness (no row dropped; smallest
        remainder margin > 0, so the remainder is strictly diagonally dominant).
     4. Planted controls, every run: a 2x2 positive definite matrix must be accepted; a singular PSD matrix, a
        matrix with a zero row, an indefinite matrix, and P with its last row and column set to zero (which psd.js
        still accepts as semidefinite) must each be refused.

   usage: node instruments/delta3/strict.js            check, print the verdict (exit 0 iff P > 0 and controls pass)
          node instruments/delta3/strict.js --record   also write certs/delta3-strict.json            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));

/* capture P: wrap provePSD BEFORE verify.js binds it (verify.js destructures it at load) */
const psdMod = require('./psd.js');
const provePSD0 = psdMod.provePSD;
let captured = [];
psdMod.provePSD = (A, opts) => { const r = provePSD0(A, opts); captured.push({ A, r }); return r; };
const V = require('./verify.js');

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const fileSha = (rel) => sha256(fs.readFileSync(path.join(ROOT, rel)));

/* exact: are all leading principal minors of the rational symmetric matrix A strictly positive? */
function leadingMinorsPositive(A) {
  const n = A.length;
  if (n === 0) return { ok: false, why: 'empty matrix' };
  for (let i = 0; i < n; i++) {
    if (A[i].length !== n) return { ok: false, why: 'not square' };
    for (let j = 0; j < i; j++) if (Q.cmp(A[i][j], A[j][i]) !== 0) return { ok: false, why: 'not symmetric at (' + i + ',' + j + ')' };
  }
  /* clear denominators: a positive scalar does not change the sign of any minor */
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  let den = 1n;
  for (const row of A) for (const x of row) { const d = BigInt(x.d); den = den / gcd(den, d) * d; }
  const M = A.map((row) => row.map((x) => BigInt(x.n) * (den / BigInt(x.d))));
  /* Bareiss: after step k, M[k][k] is the (k+1)-th leading principal minor (times nothing: fraction-free) */
  let prev = 1n;
  for (let k = 0; k < n; k++) {
    const piv = M[k][k];
    if (piv <= 0n) return { ok: false, why: 'leading principal minor ' + (k + 1) + ' is ' + (piv === 0n ? 'zero' : 'negative'), minors: k };
    for (let i = k + 1; i < n; i++) {
      for (let j = k + 1; j < n; j++) M[i][j] = (M[i][j] * piv - M[i][k] * M[k][j]) / prev;
      M[i][k] = 0n;
    }
    prev = piv;
  }
  return { ok: true, minors: n, detBits: prev.toString(2).length };
}

function controls(P) {
  const R = (a, b) => Q.R(BigInt(a), BigInt(b === undefined ? 1 : b));
  const mk = (rows) => rows.map((r) => r.map((x) => R(x)));
  const Pz = P.map((row, i) => row.map((x, j) => (i === P.length - 1 || j === P.length - 1) ? R(0) : x));
  const cases = [
    { name: 'positive definite 2x2 [[2,1],[1,2]]', A: mk([[2, 1], [1, 2]]), want: true },
    { name: 'singular PSD 2x2 [[1,1],[1,1]]', A: mk([[1, 1], [1, 1]]), want: false },
    { name: 'zero row 2x2 [[1,0],[0,0]]', A: mk([[1, 0], [0, 0]]), want: false },
    { name: 'indefinite 2x2 [[1,2],[2,1]]', A: mk([[1, 2], [2, 1]]), want: false },
    { name: 'P with its last row and column set to zero (singular)', A: Pz, want: false, psdStillAccepts: true },
  ];
  return cases.map((c) => {
    const got = leadingMinorsPositive(c.A);
    const out = { name: c.name, expected: c.want ? 'accept' : 'refuse', got: got.ok ? 'accept' : 'refuse', why: got.why || null, pass: got.ok === c.want };
    if (c.psdStillAccepts) {
      const p = provePSD0(c.A);
      out.psdJsVerdictOnSameMatrix = p.verdict;
      out.pass = out.pass && p.verdict === 'PSD';   /* the control shows the gap: semidefinite-only would accept it */
    }
    return out;
  });
}

function main() {
  const record = process.argv.includes('--record');
  const entries = V.loadEntries(V.defaultFiles());
  let inner = null;
  const results = [];
  for (const e of entries) {
    captured = [];
    const res = V.verifyCertificate(e.cert, e.label);
    results.push({ file: e.label, kind: res.kind, verdict: res.verdict });
    if (res.verdict !== 'VERIFIED') { console.error('STRICT REFUSED: verify.js refused ' + e.label + ': ' + res.why); process.exit(1); }
    if (res.kind === 'inner') {
      if (inner) { console.error('STRICT REFUSED: more than one inner certificate'); process.exit(1); }
      if (captured.length !== 1) { console.error('STRICT REFUSED: expected one matrix from the inner certificate, got ' + captured.length); process.exit(1); }
      inner = { file: e.label, sha256: e.sha, A: captured[0].A, psd: captured[0].r };
    }
  }
  if (!inner) { console.error('STRICT REFUSED: no inner certificate'); process.exit(1); }
  const P = inner.A;
  const canon = P.map((row) => row.map((x) => Q.toString(x)).join(',')).join('\n') + '\n';
  const t0 = Date.now();
  const dec = leadingMinorsPositive(P);
  const secs = (Date.now() - t0) / 1000;
  const ctl = controls(P);
  const ctlOk = ctl.every((c) => c.pass);
  const margin = inner.psd.minMargin;
  const rec = {
    what: 'The inner certificate\'s matrix P (the quadratic form left after verify.js\'s identity) is positive definite: every leading principal minor of den·P is > 0, by exact fraction-free elimination. The uniqueness step of the δ₃ paper uses this; verify.js itself proves P only semidefinite.',
    inner: { file: inner.file, sha256: inner.sha256, dim: P.length, matrixSha256: sha256(canon) },
    decision: { method: 'Bareiss fraction-free elimination on the integer matrix den·P; Sylvester\'s criterion', leadingMinorsPositive: dec.ok ? dec.minors : 0, refusedAt: dec.ok ? null : dec.why, determinantBits: dec.detBits || null, seconds: secs },
    psdJsOnP: { verdict: inner.psd.verdict, method: inner.psd.method, rowsDropped: inner.psd.dropped, smallestRemainderMarginPositive: margin ? Q.sign(margin) > 0 : null, smallestRemainderMarginApprox: margin ? Q.toDouble(margin) : null },
    controls: ctl,
    verifyRun: results,
    files: Object.fromEntries(['instruments/delta3/strict.js', 'instruments/delta3/verify.js', 'instruments/delta3/psd.js', 'instruments/delta3/model.js', 'instruments/interval/rational.js'].map((f) => [f, fileSha(f)])),
    verdict: dec.ok && ctlOk ? 'P POSITIVE DEFINITE' : 'REFUSED',
  };
  for (const c of ctl) console.log((c.pass ? 'PASS ' : 'FAIL ') + 'control: ' + c.name + ' -> ' + c.got + (c.psdJsVerdictOnSameMatrix ? ' (psd.js: ' + c.psdJsVerdictOnSameMatrix + ')' : ''));
  console.log('P: ' + P.length + 'x' + P.length + ', ' + (dec.ok ? 'all ' + dec.minors + ' leading principal minors > 0' : 'REFUSED: ' + dec.why) + ' (' + secs.toFixed(1) + ' s); psd.js on P: ' + inner.psd.dropped + ' rows dropped, margin ' + (margin && Q.sign(margin) > 0 ? '> 0' : 'not > 0'));
  console.log(rec.verdict);
  if (record) {
    const out = path.join(ROOT, 'certs', 'delta3-strict.json');
    fs.writeFileSync(out, JSON.stringify(rec, null, 2) + '\n');
    console.log('wrote ' + path.relative(ROOT, out));
  }
  process.exit(rec.verdict === 'P POSITIVE DEFINITE' ? 0 : 1);
}

if (require.main === module) main();
module.exports = { leadingMinorsPositive };
