#!/usr/bin/env node
/* run-erdos1-ledger.js — read every Erdős #1 certificate in certs/erdos1/ and
   the verifier's own logs beside them, and write certs/erdos1-ledger.json.

   THE ONE RULE, stated once: an instance (b, s, α, k) is VERIFIED iff the
   independent verifier's log for its certificate (certs/erdos1/verify-<same>.log,
   written by instruments/erdos1/verify.py on THIS machine, never the bench's
   copy) ends with `OVERALL: ALL CHECKS PASSED`, has no [FAIL] before the first
   instance block, and the instance's own block is complete (`instance done`),
   not skipped, with at least one [PASS] and no [FAIL]. Everything the page,
   the index card and the paper macros say about these sets is read from this
   ledger, so the rule cannot be applied three ways (it was, on the bench:
   siegel.py, certnumbers.py and build-page.js each carried a copy).

   Nothing here trusts the certificate's own summary fields: the ratio N/2^n is
   recomputed from the base weights in BigInt and must equal the recorded
   rational; "below Bohman" is an exact integer comparison; the Siegel bound is
   the exact rational 2^{kr}/max a, printed truncated (a printed lower bound may
   only be rounded DOWN).

   usage: node tools/run-erdos1-ledger.js            write the ledger
          node tools/run-erdos1-ledger.js --check    re-derive and compare */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'certs', 'erdos1');
const OUT = path.join(ROOT, 'certs', 'erdos1-ledger.json');
const CHECK = process.argv.includes('--check');
const die = (m) => { console.error('ERDOS1 LEDGER REFUSED: ' + m); process.exit(1); };

const BOHMAN = { p: 22002n, q: 100000n };            /* 0.22002, Bohman 1998 */

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const readCert = (p) => {
  const raw = fs.readFileSync(p);
  return JSON.parse(p.endsWith('.gz') ? zlib.gunzipSync(raw).toString('utf8') : raw.toString('utf8'));
};
const frac = (s) => { const [p, q = '1'] = String(s).split('/'); return { p: BigInt(p), q: BigInt(q) }; };
/* p/q to a decimal string with `d` places: nearest (round) or truncated (floor) */
const dec = ({ p, q }, d, mode) => {
  const scale = 10n ** BigInt(d);
  let n = p * scale;
  n = mode === 'floor' ? n / q : (2n * n + q) / (2n * q);
  const s = n.toString().padStart(d + 1, '0');
  return s.slice(0, s.length - d) + '.' + s.slice(s.length - d);
};
const lt = (a, b) => a.p * b.q < b.p * a.q;          /* exact a < b for positive fractions */

/* ---- the verifier's verdicts, parsed by the one rule ---------------------- */
function verifiedKs(logPath) {
  if (!fs.existsSync(logPath)) return { exists: false, finished: false, ks: new Set(), skipped: [], failed: [] };
  const txt = fs.readFileSync(logPath, 'utf8');
  const finished = /OVERALL: ALL CHECKS PASSED/.test(txt);
  const head = txt.split(' instance k=')[0];
  const headFail = /\[FAIL\]/.test(head);
  const ks = new Set(), skipped = [], failed = [];
  let seconds = null;
  for (const block of txt.split(' instance k=').slice(1)) {
    const k = Number(block.split(':')[0]);
    const first = block.split('\n')[0];
    if (/skipped/.test(first)) { skipped.push(k); continue; }
    const pass = (block.match(/\[PASS\]/g) || []).length, fail = (block.match(/\[FAIL\]/g) || []).length;
    const done = /instance done/.test(block);
    if (fail) failed.push(k);
    if (finished && !headFail && done && pass > 0 && fail === 0) ks.add(k);
    const t = block.match(/\[(\d+(?:\.\d+)?)s\] instance done/);
    if (t) seconds = Number(t[1]);
  }
  return { exists: true, finished: finished && !headFail, ks, skipped, failed, seconds };
}

/* ---- the certificates ------------------------------------------------------ */
const files = fs.readdirSync(DIR).filter((f) => /^cert-b\d+-s\d+(-a\d+_\d+)?(-k\d+)?\.json(\.gz)?$/.test(f)).sort();
if (!files.length) die('no certificates in certs/erdos1/');
const certificates = [], instances = [], unverified = [];
for (const f of files) {
  const p = path.join(DIR, f);
  const C = readCert(p);
  const stem = f.replace(/\.gz$/, '').replace(/^cert-/, '').replace(/\.json$/, '');
  const log = path.join(DIR, 'verify-' + stem + '.log');
  const V = verifiedKs(log);
  const bench = verifiedKs(path.join(DIR, 'logs', 'frontier-verify-' + stem + '.log'));
  const alpha = C.alpha || '1/2';
  const b = C.b, s = C.s, d = C.d, r = C.r, D = C.D;
  if (d !== b ** s || r !== d - 1) die(f + ': d, r do not match b^s');
  const K = frac(C.K), delta = frac(C.delta_formula);
  const row = {
    file: f, sha256: sha(p), bytes: fs.statSync(p).size, gzipped: f.endsWith('.gz'),
    b, s, alpha, d, r, D, gadget: C.gadget,
    K: C.K, Kfloat: Number(dec(K, 6, 'round')),
    delta: Number(dec(delta, 9, 'round')), deltaHalf: Number(dec({ p: delta.p, q: 2n * delta.q }, 9, 'round')),
    verifyLog: path.relative(ROOT, log).split(path.sep).join('/'),
    /* timing only for a finished run: a log still being written would make two consecutive derivations differ */
    verifier: { ran: V.exists, finished: V.finished, verified: [...V.ks].sort((x, y) => x - y), skipped: V.skipped, failed: V.failed, secondsToLastInstance: V.finished ? V.seconds : null },
    benchVerified: [...bench.ks].sort((x, y) => x - y),
    ks: C.instances.map((I) => I.k)
  };
  certificates.push(row);
  for (const I of C.instances) {
    const k = I.k, n = I.n;
    if (n !== d * k) die(f + ' k=' + k + ': n != d*k');
    const a = I.a.map((x) => BigInt(x));
    if (a.length !== d) die(f + ' k=' + k + ': ' + a.length + ' weights for d = ' + d);
    let amax = a[0], amin = a[0];
    for (const x of a) { if (x > amax) amax = x; if (x < amin) amin = x; }
    if (amin <= 0n) die(f + ' k=' + k + ': a weight is not positive');
    /* the ratio, recomputed: N / 2^n = 2^{k-1} max a / 2^{dk} = max a / 2^{kr+1} */
    const ratio = { p: amax, q: 1n << BigInt(k * r + 1) };
    const rec = frac(I.ratio);
    if (ratio.p * rec.q !== rec.p * ratio.q) die(f + ' k=' + k + ': the recorded ratio is not max a / 2^{kr+1}');
    const beats = lt(ratio, BOHMAN);
    const N = amax << BigInt(k - 1);
    const verified = V.ks.has(k);
    const inst = {
      file: f, b, s, alpha, d, r, D, k, n, t: I.t,
      ratio: I.ratio, ratioFloat: Number(dec(ratio, 9, 'round')), ratio6: dec(ratio, 6, 'round'),
      f: dec({ p: 2n * ratio.p, q: ratio.q }, 6, 'round'),
      belowBohman: beats,
      percentBelowBohman: beats ? Number(dec({ p: 100n * (BOHMAN.p * ratio.q - ratio.p * BOHMAN.q), q: BOHMAN.p * ratio.q }, 1, 'floor')) : null,
      Nbits: N.toString(2).length, Ndigits: N.toString().length,
      spread: Number(dec({ p: (amax - amin) * 10n ** 12n, q: amax }, 0, 'round')) / 1e12,
      /* Siegel: every nonzero integer x with a·x = 0 has ‖x‖∞ ≥ 2^k, so C_d ≥ 2^{k(d-1)}/max a = 1/f. Truncated. */
      siegel: dec({ p: 1n << BigInt(k * r), q: amax }, 6, 'floor'),
      siegelExact: (1n << BigInt(k * r)).toString().length > 40 ? null : (1n << BigInt(k * r)).toString() + '/' + amax.toString(),
      verified,
      benchVerified: bench.ks.has(k)
    };
    if (verified) instances.push(inst); else unverified.push({ file: f, k, n, ratio6: inst.ratio6, belowBohman: beats, why: !V.exists ? 'no verifier log' : !V.finished ? 'verifier run not finished' : V.skipped.includes(k) ? 'skipped by --k' : V.failed.includes(k) ? 'A CHECK FAILED' : 'block incomplete' });
  }
}
if (!instances.length) die('no verified instance');
const below = instances.filter((I) => I.belowBohman);
if (!below.length) die('no verified instance below Bohman');
const best = below.reduce((m, I) => (lt(frac(I.ratio), frac(m.ratio)) ? I : m));
const smallest = below.reduce((m, I) => (I.n < m.n ? I : m));
const siegel = {};
for (const I of instances) {
  /* the best bound per dimension is the smallest f, decided exactly through the ratio */
  const cur = siegel[I.d];
  if (!cur || lt(frac(I.ratio), frac(cur.ratio))) siegel[I.d] = { k: I.k, alpha: I.alpha, b: I.b, s: I.s, bound: I.siegel, file: I.file, ratio: I.ratio, f: I.f };
}
const ledger = {
  what: 'Erdős problem #1 made effective: every explicit sum-distinct set built here, as the independent verifier decided it. Rows enter only from certs/erdos1/verify-*.log written by instruments/erdos1/verify.py on this machine (the one rule, stated in tools/run-erdos1-ledger.js); the ratio N/2^n is recomputed from the base weights, "below Bohman" is an exact comparison against 22002/100000, and the Siegel bound is the exact rational 2^{k(d-1)}/max a, printed truncated.',
  set: 'A = { a_i · 2^j : 0 ≤ i ≤ d−1, 0 ≤ j < k } with the base weights a_i in the certificate; |A| = n = dk; N = max A = 2^{k−1} max a; dissociated (all 2^n subset sums distinct).',
  bohman: '0.22002',
  bloomNormalisation: 'f = N / 2^{n−1} = 2 · (N / 2^n); Bohman is f ≤ 0.44004',
  counts: { certificates: certificates.length, instances: instances.length + unverified.length, verified: instances.length, verifiedBelowBohman: below.length, unverified: unverified.length },
  best: { file: best.file, b: best.b, s: best.s, alpha: best.alpha, d: best.d, k: best.k, n: best.n, ratio6: best.ratio6, f: best.f, percentBelowBohman: best.percentBelowBohman, Ndigits: best.Ndigits },
  smallest: { file: smallest.file, b: smallest.b, s: smallest.s, alpha: smallest.alpha, d: smallest.d, k: smallest.k, n: smallest.n, ratio6: smallest.ratio6, f: smallest.f, percentBelowBohman: smallest.percentBelowBohman, Ndigits: smallest.Ndigits },
  siegel,
  certificates,
  instances: instances.sort((x, y) => x.d - y.d || x.alpha.localeCompare(y.alpha) || x.k - y.k),
  unverified
};
const text = JSON.stringify(ledger, null, 1) + '\n';
if (CHECK) {
  if (!fs.existsSync(OUT)) die('no ledger on disk to check against');
  if (fs.readFileSync(OUT, 'utf8') !== text) die('the ledger on disk does not re-derive — run node tools/run-erdos1-ledger.js and look at the diff');
  console.log('erdos1 ledger re-derives: ' + instances.length + ' verified instances, ' + below.length + ' below Bohman, best ' + best.ratio6 + ' at n = ' + best.n);
  process.exit(0);
}
/* siegel.json (instruments/erdos1/siegel.py, the instrument's own reading of the same logs) is regenerated with the
   ledger so the battery's cross-check compares two records written from the same evidence */
const sg = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'erdos1', 'siegel.py'), DIR], { cwd: ROOT });
if (sg.status !== 0) die('siegel.py failed:\n' + String(sg.stderr).slice(-400));
fs.writeFileSync(OUT, text);
console.log('wrote certs/erdos1-ledger.json (and certs/erdos1/siegel.json)');
for (const c of certificates) console.log('  ' + c.file.padEnd(32) + ' d=' + String(c.d).padStart(5) + ' α=' + c.alpha.padEnd(6) + ' verified k: [' + c.verifier.verified.join(',') + ']' + (c.verifier.ran && !c.verifier.finished ? '  (verifier still running or failed)' : '') + (c.ks.filter((k) => !c.verifier.verified.includes(k)).length ? '  not yet: [' + c.ks.filter((k) => !c.verifier.verified.includes(k)).join(',') + ']' : ''));
console.log('  best      ' + best.file + ' k=' + best.k + ' n=' + best.n + ' N/2^n=' + best.ratio6 + ' (' + best.percentBelowBohman + '% below Bohman)');
console.log('  smallest  ' + smallest.file + ' k=' + smallest.k + ' n=' + smallest.n + ' N/2^n=' + smallest.ratio6);
console.log('  siegel    ' + Object.keys(siegel).sort((a, b) => a - b).map((d) => 'C_' + d + ' ≥ ' + siegel[d].bound).join(' · '));
