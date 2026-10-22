#!/usr/bin/env node
/* audit-kernel-arb.js — the interval kernel checked against Arb (an independent library), case by case.

   WHY. The soundness of every interval verdict rests on one hypothesis, the inclusion property, and on the code that is
   meant to secure it (paper/tex/cert-machine-method.tex §2.3). Second implementations written by the same author can
   share a misreading; red controls catch the failures someone thought of. This is the third kind of check: the kernel's
   output compared with an arbitrary-precision ball library written by other people (Arb, through python-flint), on
   seeded random and adversarial inputs, and the rule is containment — every enclosure the kernel returns must contain
   the exact result (for an interval input, the exact range), and every input outside its domain must be refused.

   This file runs the kernel (instruments/interval/interval.js, transcendental.js, and the special functions the
   likelihood certifier uses, from instruments/hseva/fit.js) and writes the cases; tools/audit-kernel-arb.py decides each
   one in Arb at 256 bits and writes certs/kernel-arb-audit.json. Doubles cross by their shortest round-trip decimal,
   which Python reads back to the same double.

   usage: node tools/audit-kernel-arb.js [--n 50000] [--seed 20261018]   the record (about a minute; needs instruments/zetahankel/.venv)
          node tools/audit-kernel-arb.js --check                         the battery: 1,000 cases per operation, nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const FIT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const OPS = FIT.intervalOps;
const IVS = require(path.join(ROOT, 'instruments', 'ivspecial', 'ivspecial.js'));   /* Γ by Spouge and Bessel J_ν (2026-10-21) */
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
/* --check: the battery form — a smaller seeded sample, decided the same way, written to a temporary file (the record is the full run) */
const CHECK = process.argv.includes('--check');
const OUT = CHECK ? path.join(require('os').tmpdir(), 'kernel-arb-check-' + process.pid + '.json') : path.join(ROOT, 'certs', 'kernel-arb-audit.json');
const N = arg('--n', CHECK ? 1000 : 50000), SEED = arg('--seed', 20261018);
const PY = path.join(ROOT, 'instruments', 'zetahankel', '.venv', 'bin', 'python');
const CASES = path.join(require('os').tmpdir(), 'kernel-arb-cases-' + process.pid + '.jsonl');
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const MODULES = ['instruments/interval/interval.js', 'instruments/interval/transcendental.js', 'instruments/hseva/fit.js', 'instruments/hseva/special.js',
  'instruments/hseva/families.js', 'instruments/ivspecial/ivspecial.js'];

/* ---- a seeded generator of doubles: ordinary, extreme, and adversarial ------------------------------------------ */
let s = SEED >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
/* a uniform double with a FULL 53-bit mantissa (one 32-bit draw gives ~36 significant bits after scaling, and sums of such
   doubles are exact — which is how the planted round-to-nearest addition first went uncaught, 2026-10-18) */
const u53 = () => (Math.floor(rnd() * 67108864) * 134217728 + Math.floor(rnd() * 134217728)) / 9007199254740992;
const SPECIAL = [0, -0, Number.MIN_VALUE, -Number.MIN_VALUE, 2.2250738585072014e-308, -2.2250738585072014e-308, 1, -1, 2, 0.5, 1 + 2 ** -52, 1 - 2 ** -53, 3, 10, 0.1, 1e-300, 1e300, 2 ** 1000, -(2 ** 1000)];
const logU = (lo, hi) => Math.exp(Math.log(lo) + u53() * (Math.log(hi) - Math.log(lo)));
function dbl(kind) {
  const sign = rnd() < 0.5 ? -1 : 1;
  switch (kind || pick(['unit', 'unit', 'wide', 'special', 'tiny', 'huge'])) {
    case 'unit': return sign * u53() * 10;
    case 'wide': return sign * logU(1e-12, 1e12);
    case 'tiny': return sign * logU(1e-320, 1e-290);
    case 'huge': return sign * logU(1e290, 1e306);
    default: return pick(SPECIAL);
  }
}
/* an interval around x: thin, narrow (a few ulps to 1e-8 relative), or wide */
function box(x) {
  const r = rnd();
  if (r < 0.4) return [x, x];
  let w = r < 0.8 ? Math.abs(x || 1) * logU(1e-15, 1e-6) : Math.abs(x || 1) * logU(1e-3, 3);
  const lo = x - w * u53(), hi = x + w * u53();
  return Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi ? [lo, hi] : [x, x];
}
const pos = (lo, hi) => { const a = logU(lo, hi), b = rnd() < 0.5 ? a : a * (1 + logU(1e-12, 0.5)); return [Math.min(a, b), Math.max(a, b)]; };

/* ---- run one case: the kernel's answer, or that it refused ---------------------------------------------------- */
const T0 = Date.now();
const out = fs.createWriteStream(CASES);
let n = 0;
function run(op, args, f, expectRefusal) {
  let res = null, threw = null;
  try { res = f(); } catch (e) { threw = String(e.message || e).slice(0, 120); }
  const ok = res === null || (Array.isArray(res) && res.length === 2 && typeof res[0] === 'number');
  out.write(JSON.stringify({ op, args: args.map((a) => (Array.isArray(a) ? a.map(String) : String(a))), res: ok && res ? res.map(String) : null, threw, expectRefusal: !!expectRefusal }) + '\n');
  n++;
}
const fin = (a) => Number.isFinite(a[0]) && Number.isFinite(a[1]);

for (let i = 0; i < N; i++) {
  /* the four operations, with their exact extremes at endpoint combinations */
  const A = box(dbl()), B = box(dbl());
  run('add', [A, B], () => IV.add(A, B)); run('sub', [A, B], () => IV.sub(A, B)); run('mul', [A, B], () => IV.mul(A, B));
  if (B[0] > 0 || B[1] < 0) run('div', [A, B], () => IV.div(A, B));
  run('sqr', [A], () => IV.sqr(A)); run('abs', [A], () => IV.abs(A));
  const k = 2 + Math.floor(rnd() * 8); const P = box(dbl(pick(['unit', 'unit', 'special'])));
  run('pow', [P, k], () => IV.pow(P, k));
  /* exp and log over their domains, near their edges too */
  const E = box(pick([dbl('unit') * 7, -700 - rnd() * 44, 700 + rnd() * 9.7, dbl('special') % 700]));
  if (E[1] < 709.7) run('exp', [E], () => TR.exp(E));
  const L = rnd() < 0.3 ? box(1 + (rnd() - 0.5) * 2 ** -40) : pos(1e-300, 1e300);
  if (L[0] > 0) run('log', [L], () => TR.log(L));
  /* sin, cos: the range over the box, critical points included; tanh */
  const T = box(pick([dbl('unit'), (Math.floor(rnd() * 2000) - 1000) * Math.PI / 2 + (rnd() - 0.5) * 1e-9, dbl('unit') * 300]));
  run('sin', [T], () => TR.sin(T)); run('cos', [T], () => TR.cos(T)); run('tanh', [T], () => TR.tanh(T));
  /* the older helpers that enclose the platform's cosine and sine by a derived pad (a point argument) */
  const t = T[0]; run('encloseCos', [t], () => IV.encloseCos(t)); run('encloseSin', [t], () => IV.encloseSin(t));
  /* the special functions the likelihood certifier uses */
  const G = pos(0.05, 1e5); run('lgamma', [G], () => OPS.lgamma(G)); run('digamma', [G], () => OPS.digamma(G)); run('trigamma', [G], () => OPS.trigamma(G));
  const a = pos(0.2, 60), z = pos(0.01, 120); run('gammaP', [a, z], () => OPS.gammaP(a, z));
  const ph = box((rnd() - 0.5) * 20); if (ph[0] > -12 && ph[1] < 12) run('Phi', [ph], () => OPS.Phi(ph));
  /* 2026-10-21: the functions the co-author's pending list named as outside the audit — Γ (Spouge, a = 20), Bessel J_ν, the
     inverses Φ⁻¹ and P⁻¹ (each a bisection that moves an end only on a certified sign), and the compensated sum Sum2 with
     its outward error bound; the inverses and the sums at a tenth and a fiftieth of the rate, their Arb truth costing a
     bisection and an exact rational sum */
  const g2 = pos(0.41, 160); run('gamma', [g2], () => IVS.gammaIv(g2));
  if (i % 10 === 0) {
    const nu = rnd() < 0.15 ? -logU(0.01, 0.55) : logU(0.01, 12), xb = logU(0.05, 28);
    run('besselJ', [[nu, nu], [xb, xb]], () => IVS.besselJIv([nu, nu], [xb, xb]));
    const pp = 0.001 + rnd() * 0.998; run('PhiInv', [[pp, pp]], () => OPS.PhiInv([pp, pp]));
    const aa = logU(0.3, 50), p2 = 0.001 + rnd() * 0.998; run('gammaPinv', [[aa, aa], [p2, p2]], () => OPS.gammaPinv([aa, aa], [p2, p2]));
  }
  if (i % 50 === 0) {
    const xs = Array.from({ length: 50 + Math.floor(rnd() * 950) }, () => dbl(pick(['unit', 'unit', 'wide'])));
    run('sum2', [xs], () => { const acc = OPS.acc(); for (const x of xs) acc.add([x, x]); return acc.value(); });
  }
}
/* RED CONTROLS: two planted wrong kernels the audit must catch — addition rounded to nearest with no outward step, and
   the platform's Math.exp at the ends taken as an enclosure. If neither shows a violation, the audit cannot go red. */
for (let i = 0; i < N; i++) {
  const A = [dbl('unit'), 0], B = [dbl('unit'), 0]; A[1] = A[0]; B[1] = B[0];
  run('red:add', [A, B], () => [A[0] + B[0], A[1] + B[1]]);
  const E = [dbl('unit') * 7, 0]; E[1] = E[0];
  run('red:exp', [E], () => [Math.exp(E[0]), Math.exp(E[1])]);
}
/* the domain, enforced: every one of these must be refused, never decided */
const BAD = [
  ['add', [[NaN, 1], [0, 1]], () => IV.add([NaN, 1], [0, 1])], ['mul', [[2, 1], [0, 1]], () => IV.mul([2, 1], [0, 1])],
  ['mul', [[0, 0], [-Infinity, Infinity]], () => IV.mul([0, 0], [-Infinity, Infinity])], ['div', [[1, 2], [-1, 1]], () => IV.div([1, 2], [-1, 1])],
  ['div', [[1, 2], [0, 1]], () => IV.div([1, 2], [0, 1])], ['pow', [[1, 2], 2 ** 31], () => IV.pow([1, 2], 2 ** 31)], ['pow', [[1, 2], 2.5], () => IV.pow([1, 2], 2.5)],
  ['log', [[-1, 2]], () => TR.log([-1, 2])], ['log', [[0, 2]], () => TR.log([0, 2])], ['exp', [[1, 800]], () => TR.exp([1, 800])],
  ['sin', [[NaN, 1]], () => TR.sin([NaN, 1])], ['sub', [[Infinity, Infinity], [Infinity, Infinity]], () => IV.sub([Infinity, Infinity], [Infinity, Infinity])],
];
for (const [op, args, f] of BAD) run(op, args, f, true);
out.end();
out.on('finish', () => {
  const r = cp.spawnSync(PY, ['-I', path.join(ROOT, 'tools', 'audit-kernel-arb.py'), CASES, OUT, JSON.stringify({ seed: SEED, perOp: N, node: process.version, t0: T0, modules: Object.fromEntries(MODULES.map((m) => [m, sha(m)])) })], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  fs.unlinkSync(CASES);
  if (CHECK && fs.existsSync(OUT)) fs.unlinkSync(OUT);
  process.stdout.write(r.stdout); process.stderr.write(r.stderr);
  process.exit(r.status === null ? 1 : r.status);
});
