#!/usr/bin/env node
/* audit-entropy-arb.js — the entropy deciders' arithmetic checked against Arb (an independent library), case by case.

   WHY. tools/audit-kernel-arb.js checks the double-precision interval kernel against Arb. The registry's entropy
   certificates (C3b, C3c, the two-law C3c, C71) are decided with OTHER arithmetic, which nothing had checked against a
   library written by other people:
     (i)  instruments/bigfloat — BigInt dyadic intervals with directed rounding — as instruments/sumdiff/sumdiff.js and
          instruments/optq/twolaw.js call it, at 128 bits and up (fromRatio, add, sub, mul, div, log, ln2, the −p ln p
          sums, the ratio of entropies, the printed decimals);
     (ii) the Python standard library's decimal with directed rounding, as tools/verify_sumdiff.py and
          tools/verify_twolaw.py call it at 120 digits (outward, ln_out, the DOWN/UP contexts, entropy, ratio, the
          two-law decide) and as instruments/fei/fei.py calls it at 60 digits (ln_iv, the DN/UP contexts, decide).
   The modules' REAL functions are required or imported exactly as the deciders call them — never re-implemented — and run
   on seeded random and adversarial inputs from the domains the deciders use: rationals p in (0, 1] with numerators and
   denominators up to 10^3000 (the certificates' weights are over 10^320), p = 1, p near 0 and near 1, dyadic p, the log's
   reduction edge at 3/2, ties and unreduced fractions; random laws on Z^2 in all three certificate encodings (dominant,
   equal, symmetric, diagonal and collinear supports among them); two-law certificates; balanced Boolean functions for
   C71 (majority, bent, random). The real certificates and artifacts go through every implementation too, and the
   enclosures the ledgers RECORD (certs/sumdiff-ledger.json, certs/optq-ledger.json, certs/fei-ledger.json) are decided.

   THE RULE is containment: every enclosure an implementation returns must contain the exact value — decided in Arb
   (python-flint) at 256 bits, retried at 1024 and 4096 when Arb cannot separate, or exactly in FLINT's rationals when the
   truth is rational. Every malformed input must be refused (its unmutated baseline must decide), and planted wrong
   functions must be caught, or the audit cannot go red.

   FINDINGS the audit makes are DECLARED in tools/audit-entropy-arb.py (KNOWN), each with its cause, and recorded with a
   reproducing witness. A run is green only while every declared finding still reproduces where it is declared and no
   undeclared miss appears — when a module is fixed its entry stops reproducing and must be removed (the list only turns
   down). An arithmetic violation is never declarable. The list is EMPTY since 2026-10-19: the first run's seventeen
   findings (printed enclosures cut toward zero, Python doors deciding malformed certificates, ln_iv(0)) were fixed, and
   stay in the record as foundAtPin (tools/audit-entropy-arb-pin.json: the commit, the module digests then, each
   finding's witness and fix); the fei recorder cross-check fails the run outright instead of booking a refusal.

   THE PIPELINE. This file generates every input from one seed, runs the JavaScript implementations and writes the cases;
   `python3 -I tools/audit-entropy-arb.py impl` (the interpreter the batteries use; $PY overrides) runs the Python
   implementations on the same inputs; `instruments/zetahankel/.venv/bin/python -I tools/audit-entropy-arb.py decide`
   decides every case and writes certs/entropy-arb-audit.json.

   usage: node tools/audit-entropy-arb.js [--n 20000] [--seed 20261019]   the record (a few minutes; needs instruments/zetahankel/.venv)
          node tools/audit-entropy-arb.js --check                          the battery: a reduced sample, nothing written
          (AUDIT_OUT=file writes the record elsewhere; AUDIT_KEEP=1 keeps the intermediate case files)
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const B = require(path.join(ROOT, 'instruments', 'bigfloat', 'bigfloat.js'));
const F = require(path.join(ROOT, 'instruments', 'bigfloat', 'functions.js'));
const SD = require(path.join(ROOT, 'instruments', 'sumdiff', 'sumdiff.js'));
const TW = require(path.join(ROOT, 'instruments', 'optq', 'twolaw.js'));

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? Number(argv[i + 1]) : d; };
const CHECK = argv.includes('--check');
const N = arg('--n', CHECK ? 1200 : 20000), SEED = arg('--seed', 20261019);
const PYI = process.env.PY || 'python3';
const PYA = path.join(ROOT, 'instruments', 'zetahankel', '.venv', 'bin', 'python');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'entropy-arb-'));
const CASES = path.join(TMP, 'cases.jsonl'), CASES2 = path.join(TMP, 'cases-py.jsonl');
const OUT = process.env.AUDIT_OUT || (CHECK ? path.join(TMP, 'check.json') : path.join(ROOT, 'certs', 'entropy-arb-audit.json'));
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const MODULES = ['instruments/bigfloat/bigfloat.js', 'instruments/bigfloat/functions.js', 'instruments/sumdiff/sumdiff.js', 'instruments/optq/twolaw.js',
  'tools/verify_sumdiff.py', 'tools/verify_twolaw.py', 'instruments/fei/fei.py'];
const REAL = {
  'real:3b-13': { problem: '3b', file: 'corpus/optimization-constants/mi2026/c3b_pr92/certificate_3b_13pt.json', claim: '1.77898884' },
  'real:3c-95': { problem: '3c', file: 'corpus/optimization-constants/mi2026/c3c_pr93/certificate_3c_v3_95pt.json', claim: '1.6747338950208249' },
  'real:3c-147': { problem: '3c', file: 'corpus/optimization-constants/l2026/certificate_3c_147pt.json', claim: '1.6747338950414058' },
};
const REAL_TL = { id: 'real:twolaw-23289305', file: 'corpus/optconst-queue/sources/zenodo-23289305/certificate.json', claim: '1.674894211307116' };
const REAL_FEI = { id: 'real:c71-n18', file: 'corpus/optimization-constants/num2026/fei_c71_n18_artifact.json', threshold: '6.521845710923046575' };
const LEDGERS = ['certs/sumdiff-ledger.json', 'certs/optq-ledger.json', 'certs/fei-ledger.json'];
const INPUTS = Object.values(REAL).map((r) => r.file).concat([REAL_TL.file, REAL_FEI.file], LEDGERS);

/* ---- a seeded generator: doubles in [0, 1), integers, BigInts of any size ---------------------------------------- */
let s = SEED >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const bitLength = (x) => (x === 0n ? 0 : (x < 0n ? -x : x).toString(2).length);
function randBits(bits) { let x = 0n; for (let left = bits; left > 0; left -= 32) { const k = Math.min(32, left); x = (x << BigInt(k)) | BigInt(Math.floor(rnd() * 2 ** k)); } return x; }
function randBelow(n) { if (n <= 1n) return 0n; const b = bitLength(n - 1n); for (;;) { const x = randBits(b); if (x < n) return x; } }
const randIn = (lo, hi) => lo + randBelow(hi - lo + 1n);
/* log-uniform in [lo, hi] (lo >= 1): a bit length drawn uniformly, then a value of that length */
function logUniform(lo, hi) {
  const bl = ri(bitLength(lo), bitLength(hi));
  const a = bl <= 1 ? 1n : (1n << BigInt(bl - 1)), b = (1n << BigInt(bl)) - 1n;
  const x = randIn(a > lo ? a : lo, b < hi ? b : hi);
  return x;
}
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const pow10 = (k) => 10n ** BigInt(k);

/* the precisions the deciders run at: sumdiff and twolaw start at 128 bits and double to 1024 while a verdict straddles */
const pickP = () => pick([128, 128, 128, 128, 128, 128, 128, 128, 256, 256, 256, 512, 512, 1024]);
const pickPcheap = () => pick([128, 128, 128, 128, 128, 128, 256, 256, 512]);

/* ---- rationals p in (0, 1] like the certificates' weights, and the adversarial ones ------------------------------- */
const DEN10 = [6, 12, 20, 30, 50, 60, 100, 119, 120, 121, 200, 320, 500, 1000];
function randDen() {
  const r = rnd();
  if (r < 0.5) return pow10(pick(DEN10));
  if (r < 0.62) return 1n << BigInt(ri(1, 1100));
  if (r < 0.75) return BigInt(ri(2, 5000));
  return 2n + randBits(ri(2, 1100));
}
function randP() { const d = randDen(); return [rnd() < 0.6 ? logUniform(1n, d) : randIn(1n, d), d]; }
const ONE_OVER_E_87 = 367879441171442321595523770161460867445811131031767834507836801697461495744899803357147n;   /* ≈ 10^87/e: −p ln p is flat there */
function advP() {
  const k = pick([1, 2, 10, 50, 100, 119, 120, 121, 160, 320, 1000, 3000]), D = pow10(k), j = ri(1, 1100);
  return pick([
    () => [1n, 1n],                                                    /* p = 1: ln p = 0 exactly */
    () => [D, D],                                                      /* p = 1, unreduced */
    () => [1n, D],                                                     /* p = 10^-k, down to 10^-3000 */
    () => [D - 1n, D],                                                 /* p = 1 - 10^-k: past 120 digits the upper end rounds to 1 */
    () => { const r = BigInt(ri(2, 1000)); return [r < D ? D - r : 1n, D]; },
    () => [1n, 2n], () => [3n, 4n], () => [1n, 3n], () => [2n, 3n],
    () => [1n, 1n << BigInt(j)],                                       /* dyadic: exact in bigfloat */
    () => [3n, 1n << BigInt(ri(2, 1100))],                             /* 3/2^i: the log's reduction edge M = 3/2 (t = 1/5) */
    () => [3n * (1n << BigInt(j)) + pick([1n, -1n]), 1n << BigInt(j + ri(2, 50))],   /* one unit either side of that edge */
    () => [(1n << BigInt(j)) - 1n, 1n << BigInt(j)],                   /* 1 - 2^-j */
    () => { const m = randBits(ri(1, 60)) + 1n, f = pick([2n, 3n, 7n, 10n, 1000n]); return [m, m * f]; },   /* unreduced: ties with a reduced p */
    () => [BigInt(ri(1, 40)), pow10(320)],                             /* the certificates' smallest weights */
    () => [1n, pow10(3000) + 1n],
    () => [ONE_OVER_E_87, pow10(87)],
  ])();
}
let pKind = 'gen';                                                    /* which generator the last p came from */
const anyP = () => { const adv = rnd() < 0.25; pKind = adv ? 'adv' : 'gen'; return adv ? advP() : randP(); };

/* ---- encodings: exact numbers cross as strings ------------------------------------------------------------------- */
const dy = (v) => v.m.toString() + '*2^' + v.e;                       /* a bigfloat value m·2^e, exactly */
const iv = (x) => [dy(x.lo), dy(x.hi)];
const rat = (n, d) => n.toString() + '/' + d.toString();

/* ---- the case file ----------------------------------------------------------------------------------------------- */
const fd = fs.openSync(CASES, 'w');
let buf = [], nLines = 0;
const flush = () => { if (buf.length) { fs.writeSync(fd, buf.join('\n') + '\n'); buf = []; } };
const emit = (o) => { buf.push(JSON.stringify(o)); nLines++; if (buf.length >= 4000) flush(); };
const errMsg = (e) => String((e && e.message) || e).slice(0, 160);
/* run one JavaScript case: the enclosure it returned, or that it refused */
function js(op, kind, truth, u, f, extra) {
  let res = null, threw = null;
  try { res = f(); } catch (e) { threw = errMsg(e); }
  emit(Object.assign({ op, kind, truth, u, res, threw }, extra || {}));
}
const task = (o) => emit(Object.assign({ task: true }, o));
const T0 = Date.now();
const DIGESTS = Object.fromEntries(MODULES.map((m) => [m, sha(m)])), INPUT_DIGESTS = Object.fromEntries(INPUTS.map((m) => [m, sha(m)]));

/* ---- 1. bigfloat elementary: fromRatio, the four operations, log, ln2 --------------------------------------------- */
for (let i = 0; i < 2 * N; i++) {
  let [n, d] = anyP(); const P = pickP();
  if (rnd() < 0.08) n = -n;                                            /* claims and weights are positive; the function is general */
  if (rnd() < 0.04) { n = -n; d = -d; }                               /* a negative denominator: fromRatio flips both signs */
  js('bf.fromRatio', pKind, { t: 'rat', x: d < 0n ? rat(-n, -d) : rat(n, d) }, { b: P }, () => iv(B.fromRatio(n, d, P)));
}
/* operands as the deciders make them: p by fromRatio, ln p by log, products and sums of such; signs mixed; some wide */
function operand(P) {
  const r = rnd();
  if (r < 0.35) { const [n, d] = anyP(); return B.fromRatio(rnd() < 0.3 ? -n : n, d, P); }
  if (r < 0.55) { const [n, d] = anyP(); return F.log(B.fromRatio(n, d, P), P); }
  if (r < 0.7) { const m = randBits(ri(1, P)) * (rnd() < 0.5 ? -1n : 1n); return B.I(B.bf(m, ri(-1200, 60))); }
  if (r < 0.85) { const a = B.fromRatio(...anyP(), P), b = B.fromRatio(...anyP(), P); return B.cmp(a.lo, b.lo) <= 0 ? B.I(a.lo, b.hi) : B.I(b.lo, a.hi); }
  const [n, d] = anyP(); const p = B.fromRatio(n, d, P); return B.mul(p, F.log(p, P), P);
}
const range = (f, a, b) => ({ t: 'range', f, a: iv(a), b: iv(b) });
for (let i = 0; i < N; i++) {
  const Pin = pickPcheap(), P = pickP(), A = operand(Pin), Bv = operand(Pin);
  js('bf.add', 'gen', range('add', A, Bv), { b: P }, () => iv(B.add(A, Bv, P)));
  js('bf.sub', 'gen', range('sub', A, Bv), { b: P }, () => iv(B.sub(A, Bv, P)));
  js('bf.mul', 'gen', range('mul', A, Bv), { b: P }, () => iv(B.mul(A, Bv, P)));
  if (Bv.lo.m > 0n || Bv.hi.m < 0n) js('bf.div', 'gen', range('div', A, Bv), { b: P }, () => iv(B.div(A, Bv, P)));
}
/* log over its inputs: the decider's p = fromRatio(n, d), thin dyadics over a wide exponent range, 1 ± 2^-j, the 3/2 edge,
   wide intervals, exactly 1, powers of two */
function logInput(P) {
  const r = rnd();
  if (r < 0.45) { const p = B.fromRatio(...anyP(), P); return [p, pKind]; }
  if (r < 0.6) { const m = randBits(ri(1, P)) | 1n; return [B.I(B.bf(m, ri(-4000, 40) - bitLength(m))), 'gen']; }
  if (r < 0.7) { const j = ri(1, 3000); return [B.I(B.bf((1n << BigInt(j)) + pick([1n, -1n]), -j)), 'adv']; }
  if (r < 0.8) { const j = ri(1, 400), k = ri(-1100, 40); return [B.I(B.bf((3n << BigInt(j)) + pick([1n, -1n, 0n]), k - j)), 'adv']; }
  if (r < 0.9) { const a = B.fromRatio(...anyP(), P), b = B.fromRatio(...anyP(), P); return [B.cmp(a.lo, b.lo) <= 0 ? B.I(a.lo, b.hi) : B.I(b.lo, a.hi), 'gen']; }
  if (r < 0.95) return [B.I(B.bf(1n, 0)), 'adv'];
  return [B.I(B.bf(1n, ri(-3000, 60))), 'adv'];
}
for (let i = 0; i < N / 2; i++) {
  const P = pickP(), [X, kind] = logInput(P);
  js('bf.log', kind, { t: 'ln', x: iv(X) }, { b: P }, () => iv(F.log(X, P)));
}
for (const P of [24, 53, 64, 100, 127, 128, 129, 200, 256, 512, 1000, 1024, 2048, 4096])
  js('bf.ln2', 'adv', { t: 'ln2' }, { b: P }, () => iv(F.ln2(P)));

/* ---- 2. −p ln p as sumdiff computes it: entropy() of a one-atom sub-law, and beyond the door (p > 1) ---------------- */
const oneAtom = (n, d) => ({ pts: [[0n, 0n, n]], den: d });
for (let i = 0; i < N / 2; i++) {
  const [n, d] = anyP(), P = pickPcheap();
  js('bf.plnp', pKind, { t: 'plnp', q: rat(n, d) }, { b: P }, () => iv(SD.entropy(oneAtom(n, d), [1, 0], P)));
}
for (let i = 0; i < N / 10; i++) {
  const d = randDen(), n = d + 1n + randBelow(rnd() < 0.5 ? d : 1000n * d), P = pickPcheap();
  js('bf.plnp>1', 'beyond', { t: 'plnp', q: rat(n, d) }, { b: P }, () => iv(SD.entropy(oneAtom(n, d), [1, 0], P)));
}

/* ---- 3. laws on Z^2 in the three certificate encodings; entropies and ratios by sumdiff, the same laws to verify_sumdiff */
const FORMS5 = SD.FORMS['3c'].concat([SD.TARGET]);
function cutWeights(m, D) {                                             /* m positive integers summing to D, uniform cuts */
  for (;;) {
    const cuts = new Set();
    while (cuts.size < m - 1) cuts.add((1n + randBelow(D - 1n)).toString());
    const cs = [...cuts].map(BigInt).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const w = []; let prev = 0n;
    for (const c of cs) { w.push(c - prev); prev = c; }
    w.push(D - prev);
    if (w.every((x) => x > 0n)) return w;
  }
}
function skewWeights(m, D) {                                            /* weights spread over many orders of magnitude */
  const r = Array.from({ length: m }, () => logUniform(1n, 1n << 80n)), tot = r.reduce((a, b) => a + b, 0n);
  const w = r.map((x) => { const v = x * D / tot; return v > 0n ? v : 1n; });
  let sum = w.reduce((a, b) => a + b, 0n), big = 0;
  for (let i = 1; i < m; i++) if (w[i] > w[big]) big = i;
  w[big] += D - sum;
  return w.every((x) => x > 0n) ? w : cutWeights(m, D);
}
function randPoints(m, R, shape) {
  const seen = new Set(), pts = [];
  const add = (x, y) => { const k = x + ',' + y; if (seen.has(k)) return false; seen.add(k); pts.push([x, y]); return true; };
  const c = ri(-2, 2), b0 = ri(-3, 3);
  let guard = 0;
  while (pts.length < m && guard++ < 100000) {
    const x = ri(-R, R);
    if (shape === 'diagonal') add(x, x);
    else if (shape === 'line') add(x, c * x + b0);
    else add(x, ri(-R, R));
  }
  return pts;
}
function randLaw(id) {
  const shape = pick(['random', 'random', 'random', 'symmetric', 'diagonal', 'line', 'dominant', 'equal', 'tiny']);
  const R = pick([1, 2, 3, 5, 10, 30]);
  let m = rnd() < 0.08 ? ri(60, 150) : ri(2, 30);
  const k = pick([10, 20, 50, 100, 320]);
  let D = rnd() < 0.7 || shape === 'equal' || shape === 'symmetric' ? pow10(k) : 4n + randBits(ri(40, 400));
  let pts, w;
  if (shape === 'symmetric') {                                          /* μ(x, y) = μ(y, x): H(X) = H(Y), a tie in the max */
    const half = [], diag = [];
    const seen = new Set();
    for (let g = 0; g < 1000 && half.length + diag.length < Math.max(2, m >> 1); g++) {
      const x = ri(-R, R), y = ri(-R, R), key = Math.min(x, y) + ',' + Math.max(x, y);
      if (seen.has(key)) continue; seen.add(key);
      (x === y ? diag : half).push([x, y]);
    }
    if (half.length === 0 && diag.length < 2) half.push([0, 1]);      /* never a one-point law here (its ratio is 0/0) */
    const parts = cutWeights(half.length + diag.length, D / 2n);
    pts = []; w = [];
    half.forEach(([x, y], i) => { pts.push([x, y], [y, x]); w.push(parts[i], parts[i]); });
    diag.forEach(([x, y], i) => { pts.push([x, y]); w.push(2n * parts[half.length + i]); });
  } else {
    const sh = shape === 'diagonal' || shape === 'line' ? shape : 'random';
    if (sh !== 'random') m = Math.min(m, 2 * R + 1);
    pts = randPoints(Math.max(2, m), R, sh);
    m = pts.length;
    if (m < 2) { pts = [[0, 0], [1, 0]]; m = 2; }
    if (shape === 'equal') { D = BigInt(m) * pow10(k); w = pts.map(() => pow10(k)); }
    else if (shape === 'dominant') { w = pts.map(() => BigInt(ri(1, 9))); w[0] = D - w.slice(1).reduce((a, b) => a + b, 0n); }
    else if (shape === 'tiny') { D = pow10(pick([320, 1000])); w = pts.map(() => BigInt(ri(1, 1000))); w[0] = D - w.slice(1).reduce((a, b) => a + b, 0n); }
    else w = rnd() < 0.5 ? cutWeights(m, D) : skewWeights(m, D);
  }
  const problem = pick(['3b', '3c']);
  const isPow10 = /^10*$/.test(D.toString());
  const enc = isPow10 && rnd() < 0.5 ? 'L' : pick(['MIw', 'MIn']);
  const label = pick(problem === '3b' ? ['3b', 'C3b', 'C_3b'] : ['3c', 'C3c', 'c_3c']);
  const P3 = pts.map(([x, y], i) => [x, y, w[i]]);
  return { law: id, problem, shape, enc, pts: P3.map(([x, y, n]) => [x, y, n.toString()]), den: D.toString(), text: certText(label, enc, P3, D) };
}
function certText(label, enc, pts, D) {
  const red = (n) => { const g = gcd(n, D); return [n / g, D / g]; };
  if (enc === 'L') return '{"problem": "' + label + '", "denominator": "10^' + (D.toString().length - 1) + '", "distribution_x_y_num": [' + pts.map(([x, y, n]) => '[' + x + ', ' + y + ', ' + n + ']').join(', ') + ']}';
  if (enc === 'MIw') return '{"problem": "' + label + '", "weights": [' + pts.map(([x, y, n]) => { const [a, b] = red(n); return '{"x": ' + x + ', "y": ' + y + ', "num": ' + a + ', "den": ' + b + '}'; }).join(', ') + ']}';
  return '{"problem": "' + label + '", "distribution_x_y_numden": [' + pts.map(([x, y, n]) => { const [a, b] = red(n); return '[' + x + ', ' + y + ', [' + a + ', ' + b + ']]'; }).join(', ') + ']}';
}
const formsOf = (problem) => SD.FORMS[problem];
function lawCases(L, kind, precisions) {
  const c = SD.readCertificate(SD.parseExact(L.text));
  for (const P of precisions) {
    let R = null, threw = null;
    try { R = SD.ratio(c, P); } catch (e) { threw = errMsg(e); }
    emit({ op: 'bf.ratio', kind, truth: { t: 'rho', law: L.law }, u: { b: P }, res: R ? iv(R.rho) : null, threw });
    if (!R) continue;
    emit({ op: 'bf.entropy', kind, truth: { t: 'H', law: L.law, form: SD.TARGET }, u: { b: P }, res: iv(R.HT), threw: null });
    formsOf(L.problem).forEach((f, i) => emit({ op: 'bf.entropy', kind, truth: { t: 'H', law: L.law, form: f }, u: { b: P }, res: iv(R.Hs[i]), threw: null }));
    /* the printed decimals: sumdiff.digits (the ledger's rho and entropies) and bigfloat.toDecimal (twolaw.js's HT, Hs) */
    const k = kind === 'real' ? 40 : ri(3, 70);
    js('bf.digits', kind, { t: 'iv', x: iv(R.rho) }, { b: P }, () => SD.digits(R.rho, k));
    js('bf.digits', kind, { t: 'iv', x: iv(R.HT) }, { b: P }, () => SD.digits(R.HT, k));
    js('bf.toDecimal', kind, { t: 'iv', x: iv(R.Hs[0]) }, { b: P }, () => [B.toDecimal(R.Hs[0].lo, k, 'down'), B.toDecimal(R.Hs[0].hi, k, 'up')]);
  }
}
const nLaws = Math.max(30, Math.round(N / 30));
for (let i = 0; i < nLaws; i++) {
  const L = randLaw('g' + i);
  emit(L);
  lawCases(L, L.shape === 'random' ? 'gen' : 'adv', [pick([128, 128, 128, 128, 256, 256, 512])]);
  for (const f of formsOf(L.problem).concat([SD.TARGET])) task({ op: 'py.entropy', kind: L.shape === 'random' ? 'gen' : 'adv', law: L.law, form: f });
  task({ op: 'py.ratio', kind: L.shape === 'random' ? 'gen' : 'adv', law: L.law });
}

/* ---- 4. two-law certificates (twolaw.js; verify_twolaw.py) ------------------------------------------------------ */
function randTwoLaw(id) {
  const R = ri(1, 13), laws = [];
  for (let k = 0; k < 2; k++) {
    const shape = pick(['random', 'random', 'diagonal', 'line']);
    let pts = randPoints(ri(2, 30), R, shape);
    if (pts.length < 2) pts = [[0, 0], [1, 1]];
    const D = rnd() < 0.7 ? pow10(pick([10, 20, 50, 100])) : 4n + randBits(ri(30, 300));
    const w = rnd() < 0.5 ? cutWeights(pts.length, D) : skewWeights(pts.length, D);
    laws.push({ pts: pts.map(([x, y], i) => [x, y, w[i]]), den: D });
  }
  let maxAbs = 0;
  for (const L of laws) for (const [x, y] of L.pts) for (const [a, b] of FORMS5) maxAbs = Math.max(maxAbs, Math.abs(a * x + b * y));
  const base = 2 * maxAbs + 1 + ri(0, 20);
  const counts = [0, 1].map(() => (rnd() < 0.5 ? BigInt(ri(1, 50)) : 1n + randBits(ri(20, 70))));
  const lawText = (L) => { const red = (n) => { const g = gcd(n, L.den); return [n / g, L.den / g]; };
    return '{"points": [' + L.pts.map(([x, y]) => '[' + x + ', ' + y + ']').join(', ') + '], "weights": [' + L.pts.map(([, , n]) => { const [a, b] = red(n); return '[' + a + ', ' + b + ']'; }).join(', ') + ']}'; };
  const text = '{"problem": "C_3c two-law", "base": ' + base + ', "claimed_lower_bound": [1, 1], "counts": [' + counts.join(', ') + '], "laws": [' + laws.map(lawText).join(', ') + ']}';
  return { tl: id, laws: laws.map((L) => ({ pts: L.pts.map(([x, y, n]) => [x, y, n.toString()]), den: L.den.toString() })), counts: counts.map(String), text };
}
function twoLawCases(T, kind, precisions, claim) {
  const cert = TW.readTwoLaw(SD.parseExact(T.text));
  for (const P of precisions) {
    let r = null, threw = null;
    try { r = TW.decide(cert, claim || '0', [P]); if (!r.rho) throw new Error('no enclosure: ' + r.verdict + ' ' + (r.why || '')); } catch (e) { threw = errMsg(e); r = null; }
    emit({ op: 'bf.twolaw.rho', kind, truth: { t: 'mixRho', tl: T.tl }, u: { b: P }, res: r ? iv(r.rho) : null, threw });
    if (!r) continue;
    emit({ op: 'bf.twolaw.H', kind, truth: { t: 'mixH', tl: T.tl, form: SD.TARGET }, u: { b: P }, res: iv(r.HT), threw: null });
    SD.FORMS['3c'].forEach((f, i) => emit({ op: 'bf.twolaw.H', kind, truth: { t: 'mixH', tl: T.tl, form: f }, u: { b: P }, res: iv(r.Hs[i]), threw: null }));
  }
}
const nTwo = Math.max(12, Math.round(N / 100));
for (let i = 0; i < nTwo; i++) {
  const T = randTwoLaw('t' + i);
  emit(T);
  twoLawCases(T, 'gen', [pick([128, 128, 128, 256])]);
  task({ op: 'py.twolaw', kind: 'gen', tl: T.tl });
}

/* ---- 5. Python's decimal as the deciders call it: outward, ln_out, the contexts, −p ln p; fei's ln_iv and contexts ---- */
for (let i = 0; i < 2 * N; i++) { const [n, d] = anyP(); task({ op: 'py.outward', kind: pKind, q: rat(n, d) }); }
function randDec(maxDigits, positive) {
  const nd = ri(1, maxDigits); let t = String(ri(1, 9));
  for (let i = 1; i < nd; i++) t += String(ri(0, 9));
  const e = pick([ri(-3, 3), ri(-40, 40), ri(-400, 400), ri(-5000, 5000)]);
  return (positive || rnd() < 0.5 ? '' : '-') + t + 'E' + e;
}
for (let i = 0; i < N; i++) {
  const r = rnd();
  if (r < 0.6) { const [n, d] = anyP(); task({ op: 'py.ln_out', kind: pKind, q: rat(n, d) }); }
  else if (r < 0.85) task({ op: 'py.ln_out', kind: 'gen', x: randDec(120, true) });
  else { const j = ri(1, 119), up = rnd() < 0.5; task({ op: 'py.ln_out', kind: 'adv', x: up ? '1.' + '0'.repeat(j - 1) + String(ri(1, 9)) : '0.' + '9'.repeat(j) + String(ri(0, 9)) }); }
}
for (const [op, digits, n] of [['py.ctx', 400, N], ['fei.ctx', 200, Math.round(N / 4)]]) {
  for (let i = 0; i < n; i++) {
    const f = pick(['multiply', 'add', 'subtract', 'divide']), a = randDec(digits);
    let b = randDec(digits);
    if ((f === 'add' || f === 'subtract') && rnd() < 0.2) {           /* near-cancellation: a + b (or a − b) = ±d·10^(e−1) */
      const neg = a.startsWith('-'), [mant, ex] = (neg ? a.slice(1) : a).split('E');
      const sign = (f === 'add') !== neg ? '-' : '';
      b = sign + mant + String(ri(0, 9)) + 'E' + (Number(ex) - 1);
    }
    task({ op: op + '.' + f, kind: 'gen', f, a, b });
  }
}
for (let i = 0; i < N / 2; i++) { const [n, d] = anyP(); task({ op: 'py.plnp', kind: pKind, q: rat(n, d) }); }
for (let i = 0; i < N / 10; i++) { const d = randDen(), n = d + 1n + randBelow(rnd() < 0.5 ? d : 1000n * d); task({ op: 'py.plnp>1', kind: 'beyond', q: rat(n, d) }); }
for (let i = 0; i < N; i++) {
  const r = rnd();
  const k = r < 0.4 ? BigInt(ri(1, 1000000)) : r < 0.55 ? 1n << BigInt(ri(0, 3000)) : r < 0.65 ? pow10(ri(0, 900)) : r < 0.7 ? 1n : r < 0.75 ? pow10(ri(1, 300)) + pick([1n, -1n]) : 1n + randBits(ri(1, 4000));
  task({ op: 'fei.ln_iv', kind: r >= 0.4 && r < 0.75 ? 'adv' : 'gen', k: k.toString() });
}

/* ---- 6. Boolean functions for C71 (fei.decide) ------------------------------------------------------------------- */
const popcount = (x) => { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; };
function feiArtifact(n, t) {
  let mask = 0n;
  for (let x = 0; x < t.length; x++) if (t[x] === -1) mask |= 1n << BigInt(x);
  const a = t.slice();
  for (let h = 1; h < a.length; h *= 2) for (let i = 0; i < a.length; i += 2 * h) for (let j = i; j < i + h; j++) { const u = a[j], v = a[j + h]; a[j] = u + v; a[j + h] = u - v; }
  let num = 0n; a.forEach((v, S) => { num += BigInt(popcount(S)) * BigInt(v) * BigInt(v); });
  const den = 4n ** BigInt(n), g = gcd(num, den);
  return { n, true_hex: mask.toString(16), sha256_table: crypto.createHash('sha256').update(t.join(',')).digest('hex'), I: (num / g) + '/' + (den / g), ratio_lo_dec: '0', ratio_hi_dec: '1E+9' };
}
function feiTable(n, kind) {
  const N2 = 1 << n;
  if (kind === 'majority') return Array.from({ length: N2 }, (_, x) => (popcount(x) > n / 2 ? -1 : 1));
  if (kind === 'bent') { const h = n / 2, lo = (1 << h) - 1; return Array.from({ length: N2 }, (_, x) => (popcount((x & lo) & (x >> h)) % 2 ? -1 : 1)); }
  if (kind === 'random') return Array.from({ length: N2 }, () => (rnd() < 0.5 ? -1 : 1));
  const t = Array.from({ length: N2 }, (_, x) => (x < N2 / 2 ? -1 : 1));   /* balanced: exactly half TRUE, shuffled */
  for (let i = N2 - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
}
const nFei = Math.max(20, Math.round(N / 60));
for (let i = 0; i < nFei; i++) {
  let kind = pick(['balanced', 'balanced', 'balanced', 'majority', 'bent', 'random']), n = ri(2, 10);
  if (kind === 'majority') n = pick([3, 5, 7, 9]);
  if (kind === 'bent') n = pick([4, 6, 8, 10]);
  const t = feiTable(n, kind);
  emit({ fei: 'f' + i, n, hex: feiArtifact(n, t).true_hex, art: JSON.stringify(feiArtifact(n, t)), shape: kind });
  task({ op: 'fei.decide', kind: kind === 'balanced' || kind === 'random' ? 'gen' : 'adv', f: 'f' + i, threshold: '0' });
}

/* ---- 7. RED CONTROLS: planted wrong functions, each judged against the operation it replaces ----------------------- */
/* a log rounded to nearest with no outward step: the midpoint of a tight enclosure, rounded to P bits, as a point */
function nearestLogPoint(v, P) {
  const a = F.logPoint(v, P + 64), mid = B.addExact(a.lo, a.hi); mid.e -= 1;
  const d = B.roundDown(mid, P), u = B.roundUp(mid, P);
  return B.cmp(B.subExact(mid, d), B.subExact(u, mid)) <= 0 ? d : u;
}
const plantedLog = (X, P) => B.I(nearestLogPoint(X.lo, P), nearestLogPoint(X.hi, P));
const nRed = Math.max(240, Math.round(N / 5));
for (let i = 0; i < nRed; i++) {
  const P = pickPcheap(), [n, d] = anyP(), X = B.fromRatio(n, d, P);
  js('red:bf.log.nearest', 'red', { t: 'ln', x: iv(X) }, { b: P }, () => iv(plantedLog(X, P)));
  /* fromRatio shrunk by one unit in the last place at each end */
  js('red:bf.fromRatio.shrunk', 'red', { t: 'rat', x: rat(n, d) }, { b: P }, () => { const r = B.fromRatio(n, d, P); return [dy({ m: r.lo.m + 1n, e: r.lo.e }), dy({ m: r.hi.m - 1n, e: r.hi.e })]; });
  /* the REAL sumdiff.entropy with its log replaced by the planted one, on a one-atom law with a dyadic weight (exact p) */
  const j = ri(2, 200), m = 1n + randBelow((1n << BigInt(j)) - 1n);
  js('red:bf.entropy.lognearest', 'red', { t: 'plnp', q: rat(m, 1n << BigInt(j)) }, { b: P }, () => {
    const real = F.log; F.log = plantedLog;
    try { return iv(SD.entropy(oneAtom(m, 1n << BigInt(j)), [1, 0], P)); } finally { F.log = real; }
  });
  task({ op: 'red:py.ln_out.nearest', kind: 'red', x: randDec(120, true) });
  task({ op: 'red:py.outward.shrunk', kind: 'red', q: rat(...anyP()) });
  const jj = ri(1, 110);
  task({ op: 'red:py.entropy.lnnearest', kind: 'red', q: rat(1n + randBelow(pow10(jj) - 1n), pow10(jj)) });   /* p exact in 120 digits */
  task({ op: 'red:fei.ln_iv.nearest', kind: 'red', k: (2n + randBits(ri(1, 200))).toString() });
}

/* ---- 8. MALFORMED inputs: each must be refused; each door's unmutated baseline must decide ------------------------ */
const BAD_JS = [
  ['bigfloat.fromRatio: denominator 0', () => B.fromRatio(1n, 0n, 128)],
  ['bigfloat.fromRatio: NaN', () => B.fromRatio('NaN', 2, 128)],
  ['bigfloat.fromRatio: a non-integer numerator', () => B.fromRatio(1.5, 2, 128)],
  ['bigfloat.log: p = 0', () => F.log(B.fromRatio(0n, 1n, 128), 128)],
  ['bigfloat.log: p < 0', () => F.log(B.fromRatio(-1n, 2n, 128), 128)],
  ['bigfloat.log: an interval straddling 0', () => F.log(B.I(B.bf(-1n, 0), B.bf(1n, 0)), 128)],
  ['bigfloat.log: an inverted interval', () => F.log(B.I(B.bf(2n, 0), B.bf(1n, 0)), 128)],
  ['bigfloat.logPoint: 0', () => F.logPoint(B.bf(0n, 0), 128)],
  ['bigfloat.div: by an interval containing 0', () => B.div(B.fromRatio(1n, 3n, 128), B.I(B.bf(-1n, 0), B.bf(1n, 0)), 128)],
  ['bigfloat.div: by exactly 0', () => B.div(B.fromRatio(1n, 3n, 128), B.IZERO, 128)],
];
for (const [name, f] of BAD_JS) { let threw = null; try { f(); } catch (e) { threw = errMsg(e); } emit({ op: 'bad', impl: 'bigfloat', name, expectRefusal: true, threw, res: threw ? null : 'returned' }); }
/* certificate doors: the same texts to sumdiff (JS) and verify_sumdiff (Python); a decided verdict on a malformed one is a miss */
const W = (x, y, n, d) => ({ x, y, n, d });
const certW = (label, ws) => '{"problem": "' + label + '", "weights": [' + ws.map((w) => '{"x": ' + w.x + ', "y": ' + w.y + ', "num": ' + w.n + ', "den": ' + w.d + '}').join(', ') + ']}';
const BASE3 = [W(0, 0, 1, 2), W(1, 0, 1, 4), W(0, 1, 1, 8), W(1, 2, 1, 8)];
const BAD_CERTS = [
  ['baseline: a valid four-point law', certW('3b', BASE3), false],
  ['a weight is 0', certW('3b', [W(0, 0, 1, 2), W(1, 0, 0, 4), W(0, 1, 1, 4), W(1, 2, 1, 4)]), true],
  ['a weight is negative (p > 1 elsewhere)', certW('3b', [W(0, 0, 3, 2), W(1, 0, -1, 2)]), true],
  ['the weights sum to 1 + 10^-320', '{"problem": "3c", "denominator": "10^320", "distribution_x_y_num": [[0, 0, ' + (pow10(320) / 2n + 1n) + '], [1, 1, ' + (pow10(320) / 2n) + ']]}', true],
  ['the weights sum to 1 - 10^-320', '{"problem": "3c", "denominator": "10^320", "distribution_x_y_num": [[0, 0, ' + (pow10(320) / 2n - 1n) + '], [1, 1, ' + (pow10(320) / 2n) + ']]}', true],
  ['one weight p = 3/2 alone (p > 1)', certW('3b', [W(0, 0, 3, 2)]), true],
  ['a point listed twice', certW('3b', [W(0, 0, 1, 2), W(0, 0, 1, 4), W(1, 0, 1, 4)]), true],
  ['a non-integer weight that truncates to a law (num 1.9/2 and 1.2/2)', certW('3b', [W(0, 0, '1.9', 2), W(1, 0, '1.2', 2)]), true],
  ['a boolean weight (true/2)', certW('3b', [W(0, 0, 'true', 2), W(1, 0, 1, 2)]), true],
  ['a non-integer coordinate (x = 0.5)', certW('3b', [W('0.5', 0, 1, 2), W(1, 0, 1, 2)]), true],
  ['a NaN weight', certW('3b', [W(0, 0, 'NaN', 2), W(1, 0, 1, 2)]), true],
  ['an unknown problem (3a)', certW('3a', BASE3), true],
  ['a denominator not of the form 10^k', '{"problem": "3c", "denominator": "1000", "distribution_x_y_num": [[0, 0, 500], [1, 1, 500]]}', true],
  ['an empty law', certW('3b', []), true],
  ['a one-point law (p = 1: every entropy 0, the ratio 0/0)', certW('3b', [W(0, 0, 1, 1)]), true],
  ['a one-point law in 3c, unreduced (10^320/10^320)', '{"problem": "3c", "denominator": "10^320", "distribution_x_y_num": [[2, -1, ' + pow10(320) + ']]}', true],
];
const CLAIM_BAD = '0.25';                                             /* below every baseline's ratio, so a baseline CERTIFIES */
for (const [name, text, expectRefusal] of BAD_CERTS) {
  let threw = null, res = null;
  try { const c = SD.readCertificate(SD.parseExact(text)); const d = SD.decide(c, CLAIM_BAD, [128]); if (d.verdict === 'REFUSED') threw = 'verdict REFUSED: ' + d.why; else res = 'verdict ' + d.verdict + ', rho ' + SD.digits(d.R.rho, 12).join('..'); } catch (e) { threw = errMsg(e); }
  emit({ op: 'bad', impl: 'sumdiff', name: 'sumdiff: ' + name, expectRefusal, threw, res });
  task({ op: 'bad', impl: 'verify_sumdiff', name: 'verify_sumdiff: ' + name, expectRefusal, text, claim: CLAIM_BAD });
}
const TL_BASE = { base: 7, counts: [3, 5], laws: [{ points: [[0, 0], [1, 0], [0, 1]], weights: [[1, 2], [1, 4], [1, 4]] }, { points: [[0, 0], [1, 1]], weights: [[1, 3], [2, 3]] }] };
const tlText = (o) => JSON.stringify(Object.assign({ problem: 'C_3c two-law', claimed_lower_bound: [1, 1] }, o));
const tlMut = (f) => { const o = JSON.parse(JSON.stringify(TL_BASE)); f(o); return tlText(o); };
const BAD_TL = [
  ['baseline: a valid two-law certificate', tlText(TL_BASE), false],
  ['a count is 0', tlMut((o) => { o.counts[0] = 0; }), true],
  ['a count is negative', tlMut((o) => { o.counts[1] = -5; }), true],
  ['points and weights of unequal length', tlMut((o) => { o.laws[0].weights.pop(); }), true],
  ['a law does not sum to 1', tlMut((o) => { o.laws[1].weights[1] = [2, 5]; }), true],
  ['a point listed twice', tlMut((o) => { o.laws[0].points[2] = [1, 0]; }), true],
  ['a weight is 0', tlMut((o) => { o.laws[0].weights = [[1, 2], [0, 4], [1, 2]]; }), true],
  ['the base too small for injectivity (base 2)', tlMut((o) => { o.base = 2; }), true],
  ['a non-integer weight that truncates to a law (1.9/2 and 1.2/2)', tlMut((o) => { o.laws[1].weights = [[1.9, 2], [1.2, 2]]; }), true],
  ['a non-integer coordinate (0.5)', tlMut((o) => { o.laws[1].points[1] = [0.5, 1]; }), true],
  ['not a 3c certificate', tlMut((o) => { o.problem = 'C_3b'; }), true],
  ['two one-point laws (every entropy 0, the ratio 0/0)', tlMut((o) => { o.laws = [{ points: [[0, 0]], weights: [[1, 1]] }, { points: [[1, 1]], weights: [[1, 1]] }]; }), true],
];
for (const [name, text, expectRefusal] of BAD_TL) {
  let threw = null, res = null;
  try { const c = TW.readTwoLaw(SD.parseExact(text)); const d = TW.decide(c, CLAIM_BAD, [128]); if (d.verdict === 'REFUSED') threw = 'verdict REFUSED: ' + d.why; else res = 'verdict ' + d.verdict + ', rho ' + SD.digits(d.rho, 12).join('..'); } catch (e) { threw = errMsg(e); }
  emit({ op: 'bad', impl: 'twolaw', name: 'twolaw: ' + name, expectRefusal, threw, res });
  task({ op: 'bad', impl: 'verify_twolaw', name: 'verify_twolaw: ' + name, expectRefusal, text, claim: CLAIM_BAD });
}
/* fei: the rule needs a balanced g with H > 0 and I > 1, the table bound by its sha256 */
{
  const maj = feiTable(5, 'majority'), A0 = feiArtifact(5, maj);
  const thr = Array.from({ length: 32 }, (_, x) => (popcount(x) >= 2 ? -1 : 1));          /* monotone, unbalanced */
  const dict = Array.from({ length: 16 }, (_, x) => (x & 1 ? -1 : 1));                     /* a dictator: I = 1 */
  const par = Array.from({ length: 16 }, (_, x) => (popcount(x & 6) % 2 ? -1 : 1));        /* a parity: H = 0 */
  const FEI_BAD = [
    ['baseline: majority of 5, valid', JSON.stringify(A0), false],
    ['the table is not the one its sha256 binds', JSON.stringify(Object.assign({}, A0, { sha256_table: '0'.repeat(64) })), true],
    ['I misstated', JSON.stringify(Object.assign({}, A0, { I: '9/4' })), true],
    ['unbalanced (at-least-2-of-5, monotone)', JSON.stringify(feiArtifact(5, thr)), true],
    ['a dictator (I = 1: the rule does not apply)', JSON.stringify(feiArtifact(4, dict)), true],
    ['a parity (H = 0)', JSON.stringify(feiArtifact(4, par)), true],
    ['a mask with bits beyond 2^n inputs', JSON.stringify(Object.assign({}, A0, { true_hex: '1' + A0.true_hex.padStart(8, '0') })), true],
  ];
  for (const [name, art, expectRefusal] of FEI_BAD) task({ op: 'bad', impl: 'fei', name: 'fei.decide: ' + name, expectRefusal, art, threshold: '0' });
  for (const k of ['0', '-3']) task({ op: 'bad', impl: 'fei.ln_iv', name: 'fei.ln_iv: k = ' + k + ' (the docstring\'s domain is a positive integer)', expectRefusal: true, k });
  task({ op: 'bad', impl: 'verify_sumdiff.ln_out', name: 'verify_sumdiff.ln_out: x < 0', expectRefusal: true, x: '-0.5' });
}

/* ---- 9. the REAL inputs: the registry's certificates and artifact, through every implementation ------------------- */
const PREC_REAL = CHECK ? [128, 256] : SD.PRECISIONS;
for (const [id, r] of Object.entries(REAL)) {
  emit({ law: id, problem: r.problem, file: r.file });
  const text = fs.readFileSync(path.join(ROOT, r.file), 'utf8');
  lawCases({ law: id, problem: r.problem, text }, 'real', PREC_REAL);
  const c = SD.readCertificate(SD.parseExact(text)), d = SD.decide(c, r.claim);
  emit({ op: 'bf.ratio', kind: 'real', truth: { t: 'rho', law: id }, u: { b: d.P }, res: iv(d.R.rho), threw: null, name: 'sumdiff.decide(' + r.claim + ') -> ' + d.verdict + ' at ' + d.P + ' bits' });
  task({ op: 'real.py', kind: 'real', law: id, file: r.file });
}
{
  emit({ tl: REAL_TL.id, file: REAL_TL.file });
  const text = fs.readFileSync(path.join(ROOT, REAL_TL.file), 'utf8');
  twoLawCases({ tl: REAL_TL.id, text }, 'real', PREC_REAL, REAL_TL.claim);
  task({ op: 'real.py.twolaw', kind: 'real', tl: REAL_TL.id, file: REAL_TL.file });
  emit({ fei: REAL_FEI.id, file: REAL_FEI.file });
  task({ op: 'fei.decide', kind: 'real', f: REAL_FEI.id, file: REAL_FEI.file, threshold: REAL_FEI.threshold });
  task({ op: 'py.main', kind: 'real', laws: ['real:3b-13', 'real:3c-95', 'real:3c-147', 'real:3c-147'], tl: REAL_TL.id });
}
/* ---- 10. the enclosures the ledgers RECORD ------------------------------------------------------------------------ */
{
  const byFile = Object.fromEntries(Object.entries(REAL).map(([id, r]) => [r.file, id]));
  const sd = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sumdiff-ledger.json'), 'utf8'));
  for (const row of sd.rows) {
    const id = byFile[row.certificate.file];
    emit({ op: 'rec.sumdiff-ledger', kind: 'rec', truth: { t: 'rho', law: id }, u: null, res: row.rho, threw: null, name: row.id + ' rho' });
    emit({ op: 'rec.sumdiff-ledger', kind: 'rec', truth: { t: 'H', law: id, form: SD.TARGET }, u: null, res: row.entropies.target, threw: null, name: row.id + ' H(X-Y)' });
    row.entropies.forms.forEach((h, i) => emit({ op: 'rec.sumdiff-ledger', kind: 'rec', truth: { t: 'H', law: id, form: SD.FORMS[REAL[id].problem][i] }, u: null, res: h, threw: null, name: row.id + ' H(form ' + i + ')' }));
  }
  const oq = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'optq-ledger.json'), 'utf8')).rows.find((r) => r.id === 'optq-221-3c');
  emit({ op: 'rec.optq-ledger', kind: 'rec', truth: { t: 'mixRho', tl: REAL_TL.id }, u: null, res: oq.rho[0], threw: null, name: 'optq-221-3c rho (twolaw.js)' });
  emit({ op: 'rec.optq-ledger', kind: 'rec', truth: { t: 'mixRho', tl: REAL_TL.id }, u: null, res: oq.rhoPython, threw: null, name: 'optq-221-3c rhoPython (verify_twolaw.py)' });
  const fl = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'fei-ledger.json'), 'utf8')).rows[0];
  emit({ op: 'rec.fei-ledger', kind: 'rec', truth: { t: 'feiRho', f: REAL_FEI.id }, u: null, res: fl.ratio, threw: null, name: 'C71 ratio' });
  emit({ op: 'rec.fei-ledger', kind: 'rec', truth: { t: 'feiH', f: REAL_FEI.id }, u: null, res: fl.H, threw: null, name: 'C71 H' });
}
flush();
fs.closeSync(fd);
const T1 = Date.now();

/* ---- the Python implementations, then Arb ------------------------------------------------------------------------- */
const meta = { seed: SEED, n: N, check: CHECK, node: process.version, t0: T0, jsSeconds: (T1 - T0) / 1000, modules: DIGESTS, inputs: INPUT_DIGESTS, lines: nLines, root: ROOT };
const run = (cmd, args) => cp.spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const clean = () => { if (process.env.AUDIT_KEEP) { console.error('kept ' + TMP); return; } try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* the temporary directory is the OS's to reap */ } };
const r1 = run(PYI, ['-I', path.join(ROOT, 'tools', 'audit-entropy-arb.py'), 'impl', CASES, CASES2, ROOT]);
if (r1.status !== 0) { process.stderr.write(r1.stdout + r1.stderr); clean(); process.exit(1); }
meta.py = JSON.parse(r1.stdout.trim().split('\n').pop());
const r2 = run(PYA, ['-I', path.join(ROOT, 'tools', 'audit-entropy-arb.py'), 'decide', CASES2, OUT, JSON.stringify(meta)]);
process.stdout.write(r2.stdout); process.stderr.write(r2.stderr);
clean();
process.exit(r2.status === null ? 1 : r2.status);
