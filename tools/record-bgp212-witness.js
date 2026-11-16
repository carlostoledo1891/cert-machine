#!/usr/bin/env node
/* record-bgp212-witness.js — certs/bgp212-witness.json: the certificate premise of Axiom Math's H_1 <= 212
   (Gap212Certificate, AxiomMath/BGP212 at 6641780) decided for the witness Fredrik Prüzelius published on issue #2.

   WHAT IS DECIDED. Gap212Certificate asks for a symmetric, square-integrable F supported on T_45 of gapParams212
   with 0 < Iint(F) < 45 * Jint(F). For his degree-21 F (846 terms), I(F) and J(F) were computed as exact rationals
   by code written from scratch (instruments/bgp212-witness: a decomposition of T and of the marginal of our own,
   a C kernel modulo 92 primes, CRT with a derived denominator multiple and magnitude bounds). Nothing of his code was
   opened or run; what is shared is the witness file, the coordinates in his README and the Lean definitions.

   THIS TOOL re-checks, in exact BigInt arithmetic and with no floating point, what the record states from the
   pinned outputs: I > 0; 45 J - I > 0; I = 4^-45 I~ and J = 4^-46 J~; his exact fraction equals 45 J~/I~ (so his
   fraction / 4 = 45 J/I); the session's replay from a fresh copy of the code gives the same fraction; the d20
   witness also exceeds 1. It does NOT re-run the kernel (~2 min on 4 cores): instruments/bgp212-witness/README.md
   says how. Every input is pinned by sha256 in corpus/bgp212-witness/PROVENANCE.json.

   usage: node tools/record-bgp212-witness.js            write certs/bgp212-witness.json
          node tools/record-bgp212-witness.js --check    re-derive and require byte equality (the battery)     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = (p) => path.join(ROOT, 'corpus', 'bgp212-witness', p);
const OUT = path.join(ROOT, 'certs', 'bgp212-witness.json');
const die = (m) => { console.error('BGP212 WITNESS REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/* ---- the pins */
const PROV = JSON.parse(fs.readFileSync(C('PROVENANCE.json'), 'utf8'));
for (const [f, h] of Object.entries(PROV.files)) if (sha(path.join(ROOT, f)) !== h) die(f + ' does not match its pin in corpus/bgp212-witness/PROVENANCE.json');

/* ---- exact fractions in BigInt */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { if (d === 0n) die('zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const parse = (s) => { const m = String(s).trim().match(/^(-?\d+)(?:\/(\d+))?$/); if (!m) die('not a fraction: ' + String(s).slice(0, 40)); return Q(BigInt(m[1]), BigInt(m[2] || '1')); };
const mul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const sub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const pos = (a) => a[0] > 0n;
const gt1 = (a) => a[0] > a[1];
const pow4 = (k) => [4n ** BigInt(k), 1n];
const dec = (a, digits) => {                      /* a decimal string, truncated (never rounded up) to `digits` places */
  const neg = a[0] < 0n; let n = neg ? -a[0] : a[0]; const d = a[1];
  const ip = n / d; let r = n % d, s = ip.toString() + '.';
  for (let i = 0; i < digits; i++) { r *= 10n; s += (r / d).toString(); r %= d; }
  return (neg ? '-' : '') + s;
};
const sci = (a, digits) => {                      /* d.ddd…e-NN, truncated */
  let n = a[0], d = a[1], e = 0;
  while (n * 10n < d) { n *= 10n; e--; }
  while (n >= d * 10n) { d *= 10n; e++; }
  return dec([n, d], digits) + 'e' + e;
};

/* ---- the outputs */
const R = JSON.parse(fs.readFileSync(C('out/decider-results.json'), 'utf8'));
const RP = JSON.parse(fs.readFileSync(C('out/replay-d21-crt_result.json'), 'utf8'));
const d21 = R.d21, d20 = R.d20;
const I = parse(d21.I_F_physical), J = parse(d21.J_F_physical), It = parse(d21.I_Ftilde), Jt = parse(d21.J_Ftilde);
const ratio = div(mul([45n, 1n], J), I), ratioT = div(mul([45n, 1n], Jt), It);
const hisTxt = fs.readFileSync(C('witnesses/axiom212_k45_d21_exact_ratio.txt'), 'utf8').replace(/\s+/g, '');
const his = parse(hisTxt.match(/\d+\/\d+/)[0]);
const checks = {
  I_positive: pos(I),
  margin_45J_minus_I_positive: pos(sub(mul([45n, 1n], J), I)),
  scaling_I_is_4_to_minus_45_I_tilde: eq(I, div(It, pow4(45))),
  scaling_J_is_4_to_minus_46_J_tilde: eq(J, div(Jt, pow4(46))),
  record_ratio_equals_recomputed: eq(parse(d21.ratio_45J_over_I_physical), ratio),
  his_fraction_equals_our_dilated_45J_over_I: eq(his, ratioT),
  his_fraction_over_4_equals_our_physical_45J_over_I: eq(div(his, [4n, 1n]), ratio),
  replay_from_a_fresh_copy_equals: eq(parse(RP.ratio_phys), ratio) && RP.crt_stable_with_spare_primes === true && RP.magnitude_bounds_ok === true,
  d20_ratio_exceeds_1: gt1(div(mul([45n, 1n], parse(d20.J_F_physical)), parse(d20.I_F_physical))),
  crt_stable_with_spare_primes: d21.crt.stable_with_spare_primes === true && d21.crt.magnitude_bounds_ok === true
};
for (const [k, v] of Object.entries(checks)) if (v !== true) die('check failed: ' + k);
if (sha(C('witnesses/axiom212_k45_d21.json')) !== d21.witness_sha256) die('the d21 witness is not the one the decider ran on');
const r20 = div(mul([45n, 1n], parse(d20.J_F_physical)), parse(d20.I_F_physical));

const rec = {
  what: 'The certificate premise of Axiom Math\'s Lean proof of H_1 <= 212 (Gap212Certificate), decided for the witness F published by Fredrik Prüzelius on AxiomMath/BGP212 issue #2. Computer algebra in exact rational arithmetic, by code written from scratch; not a Lean proof, and not the authors\' own F.',
  claim: {
    statement: 'there is a symmetric, square-integrable F supported on T_45 of gap212Params with 0 < Iint(F) < 45 * Jint(F)',
    lean: { repository: 'https://github.com/AxiomMath/BGP212', file: 'Gap212Challenge/Basic.lean', commit: '6641780bb6bab050fd400a348ba759d233e34fad',
      sha256: '0658163beaefecd4a851565d9e9ee7a2a8065ae5a3eb9a003091436c93b242fb', names: ['T', 'Iint', 'Jregion', 'Jint', 'Certificate', 'gap212Cap', 'gap212Params', 'Gap212Certificate'] },
    asked: { issue: 'https://github.com/AxiomMath/BGP212/issues/2', on: '2026-11-12', by: 'carlostoledo1891', question: 'is the witness F for Gap212Certificate published?' },
    witness: { by: 'Fredrik Prüzelius (pruzze)', posted: '2026-11-15', where: 'https://github.com/AxiomMath/BGP212/issues/2',
      repository: 'https://github.com/pruzze/bounded-gaps-witnesses', commit: '92000064b5e983761dd751a3e0a62ce83f6d2c7b', licence: 'CC BY 4.0 (witness files)',
      file: 'corpus/bgp212-witness/witnesses/axiom212_k45_d21.json', degree: d21.degree, terms: 846, his_value: '45 J/I = 1.00109602458365033006…, an exact fraction' }
  },
  verdict: 'CERTIFIED',
  scope: 'the inequality 0 < I(F) < 45 J(F) for his degree-21 F; Symmetric, MemLp 2 and vanishing off T are argued (F is the indicator of T times a symmetric polynomial; T is bounded, measurable and permutation-invariant), not computed',
  result: {
    I_F: sci(I, 30), J_F: sci(J, 30),
    ratio_45J_over_I: dec(ratio, 60),
    ratio_digits: { numerator: ratio[0].toString().length, denominator: ratio[1].toString().length },
    margin: 'the ratio exceeds 1 by ' + dec(sub(ratio, [1n, 1n]), 8) + '…; the cap corrections are ' + (d21.cap_correction_share.I * 100).toFixed(2) + '% of I and ' + (d21.cap_correction_share.J * 100).toFixed(2) + '% of J, larger than the margin, so the cap rule decides the verdict',
    equals_his_fraction: 'his exact fraction (a dilated value, x = 4t) equals our 45 J~/I~ digit for digit, so his fraction / 4 = our 45 J(F)/I(F)',
    d20: { witness: 'corpus/bgp212-witness/witnesses/axiom212_k45_d20.json', ratio_45J_over_I: dec(r20, 40), exceeds_1: true,
      agreement: 'all ' + d20.his_printed_digits_physical + ' digits he printed agree; our value lies inside the Arb ball in his file' }
  },
  checks,
  method: {
    code: 'instruments/bgp212-witness', written: 'from scratch, with Claude, in this session; his programs (witnesses/src/) never opened, searched or run',
    shared_with_his_work: ['the witness coefficients', 'the coordinates and the form of F~ in his README', 'the Lean definitions'],
    how: 'F~^2 expanded in monomial symmetric functions (own structure-constant counter, brute-force checked); I = I0 - I1 (plain simplex by Dirichlet, minus the cap-breaking part); J = J0 - J1 + J2 + J3 (the marginal over the simplex, the q that break their own cap, and the regions where the cap and the threshold g cut the x-range); each group of coordinates through transforms in w = 1/p and z = e^(-gp), the bound g by inclusion-exclusion; the heavy sums in C modulo 92 primes below 2^31 with scalar operations only (GMP, no FLINT); CRT with a derived denominator multiple and the bounds 0 <= I <= I0, 0 <= J <= L I; 12 spare primes reproduce the same integers; no floating point in the decision',
    crt: d21.crt,
    replay: 'the session re-ran the d21 decision from a fresh copy of the code (kernel recompiled, 6 processes, about 74 s): the same fraction (corpus/bgp212-witness/out/replay-d21-crt_result.json)'
  },
  validation: {
    exact_polytopes: 'at k = 2 and 3, for two made-up datums and the real one, I and J integrated exactly over explicitly enumerated polytopes from the pointwise definitions: 12 cases, all equal as rationals',
    monte_carlo_small_k: 'k = 2, 3, 4, 5 and 45, random F of degree <= 4, from the pointwise Lean definitions: every case within |z| <= 1.8',
    kernel_vs_reference: 'the C kernel equals the exact Fraction reference piece by piece at k = 2, 3, 5, 8, 18 and 45 (15 cases)',
    unit_invariance: 'the whole d21 run in units of 1/2500 instead of 1/1250 gives the identical fraction',
    monte_carlo_45: 'the real witness, stratified by the number of large coordinates, 2 runs: I within z = +0.8 and +1.2 (s.e. ~3.5%), J within z = -1.4 and +0.1 (s.e. 2.5-4.5%); the cap corrections alone, importance-sampled: I0 - I within z = -0.8 (s.e. 10%), J0 - J within z = +0.1 (s.e. 4.4%)',
    failed_and_not_used: 'plain uniform Monte Carlo in 45 dimensions (z = -12 for I, -903 for J: the uniform measure sits on the outer face of the simplex, where the witness has almost no mass); both failures are kept in out/decider-results.json'
  },
  gaps: [
    'Not a formal proof: the decision rests on our derivation of the decomposition and on our code.',
    'The exact cross-check that does not use the decomposition covers k <= 3; in 45 dimensions the checks are the kernel-against-reference tests, unit invariance, Monte Carlo, and the exact equality with an independently written program (his).',
    'Symmetric, MemLp 2 and vanishing off T are argued, not computed.',
    'The denominator multiple was derived by hand; had it been wrong, the reconstruction would not have been stable under the spare primes, and it was.',
    'This decides his F, not the authors\' P* of their Theorem 11.1, which is still unpublished; and it says nothing about the analytic premises of the 212 (issue #1).'
  ],
  dates: { asked: '2026-11-12', witness_posted: '2026-11-15', decided: '2026-11-16' },
  runtime: { d21_kernel_cpu_s: d21 && R.timing.d21.kernel_cpu_s_total, d21_precompute_s: R.timing.d21.exact_precompute_s, d20_kernel_cpu_s: R.timing.d20.kernel_cpu_s_total },
  provenance: { file: 'corpus/bgp212-witness/PROVENANCE.json', files: Object.keys(PROV.files).length }
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) die('certs/bgp212-witness.json differs from what corpus/bgp212-witness gives');
  console.log('certs/bgp212-witness.json re-derived: identical · ' + Object.keys(checks).length + ' exact checks pass · ' + rec.verdict);
} else {
  fs.writeFileSync(OUT, text);
  console.log('certs/bgp212-witness.json written · ' + rec.verdict + ' · 45J/I = ' + dec(ratio, 20) + '… · ' + Object.keys(checks).length + ' exact checks pass');
}
