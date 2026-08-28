#!/usr/bin/env node
/* erdos290-cstar-precision.js — the conditional Erdős #290 constant at
   OEIS b-file precision, by moving the certified horizon.

   The lifted kernel's conditionalCStar caps at ~46 digits because its
   labeled assumption starts at the first degree IT cannot certify
   (d = 62): the index-2 allowance 1/(2^31·31!) times that degree's weight
   is ~1e-47, and no cutoff parameter can push past it. The tail extension
   record now certifies every degree through l = Lmax (120 tonight, the
   l≈310 campaign later), so the first assumption degree moves to
   l = Lmax+1 and the same enclosure reaches hundreds of digits.

   Sources of certified densities (exactly the report builder's map):
     l ≤ 30 non-exceptional      kernel.deltaHyperoct(l)   (paper-certified)
     exceptional l = 4, 12, 24   kernel.EXACT_DELTAS
     l = 31..60                  legacy tail-deltas.json   (incl. ES0 at 40, 60)
     l = 61..Lmax                certs/erdos290-tail-ext.json
   Beyond Lmax the LABELED ASSUMPTION (δ_l ∈ [δ_hyp − 1/(2^l l!), δ_hyp]),
   and beyond the cutoff N the δ∞ tail box — the kernel's own structure.

   Arithmetic: every term is an exact rational, accumulated in fixed-point
   BigInt at 10^SCALE with floors on the lower end and ceilings on the
   upper — outward at every step, so the printed enclosure is a theorem.

   Gates (all run before anything prints):
     1. CALIBRATION: with the horizon forced back to 60, the enclosure must
        agree with the lifted kernel's conditionalCStar(120, 80) on every
        digit the kernel certifies.
     2. CUTOFF AGREEMENT: N and N+60 must agree to the printed precision.
     3. CONTAINMENT: the enclosure must lie inside the unconditional
        certified bracket's loose bounds [0.8296, 0.8325].

   usage: node tools/erdos290-cstar-precision.js [digits]   (default 110)
   writes: outreach/b-oeis-cstar.txt, outreach/b-oeis-c0.txt              */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const K = require(path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290', 'kernel.js'));
const die = (m) => { console.error('CSTAR PRECISION REFUSED: ' + m); process.exit(1); };

const DIGITS = Number(process.argv[2] || 110);
const SCALE = 10n ** BigInt(DIGITS + 25);              /* guard digits beyond the target */

/* rationals arrive as {n, d} BigInt pairs from the kernel/records */
const floorAt = (n, d) => { const q = n * SCALE; return q >= 0n ? q / d : -((-q + d - 1n) / d); };
const ceilAt = (n, d) => { const q = n * SCALE; return q >= 0n ? (q + d - 1n) / d : -(-q / d); };

/* ---- log 2 enclosure: log 2 = Σ_{m odd} 2/(m·3^m), remainder < term·9/8 --- */
function log2At(terms) {
  let lo = 0n, hi = 0n;
  let m = 1;
  for (let k = 0; k < terms; k++, m += 2) {
    const d = BigInt(m) * 3n ** BigInt(m);
    lo += floorAt(2n, d); hi += ceilAt(2n, d);
  }
  hi += ceilAt(2n * 9n, BigInt(m) * 3n ** BigInt(m) * 8n);
  return { lo, hi };
}

/* ---- δ_hyp(l) and the index-2 allowance, as exact rationals --------------- */
function hypRat(l) {
  /* 1 − Σ_{i=0..l} (−1)^i/(2^i i!) over one common denominator 2^l·l! */
  let fact = 1n; for (let i = 2; i <= l; i++) fact *= BigInt(i);
  const D = 2n ** BigInt(l) * fact;
  let s = 0n, f = 1n;
  for (let i = 0; i <= l; i++) {
    if (i > 0) f *= BigInt(i);
    const t = D / (2n ** BigInt(i) * f);
    s += (i % 2 === 0) ? t : -t;
  }
  return { n: D - s, d: D };
}

/* ---- the certified density map, the report builder's exact sources -------- */
function certifiedMap(horizon) {
  const M = new Map();
  for (const [l, v] of K.EXACT_DELTAS) M.set(Number(l), { n: BigInt(v.n), d: BigInt(v.d) });
  const legacyTail = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290', 'tail-deltas.json'), 'utf8')).deltas;
  for (const [l, v] of Object.entries(legacyTail)) M.set(Number(l), { n: BigInt(v.n), d: BigInt(v.d) });
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos290-tail-ext.json'), 'utf8')).deltas;
  for (const [l, v] of Object.entries(ext)) M.set(Number(l), { n: BigInt(v.n), d: BigInt(v.d) });
  for (const l of M.keys()) if (l > horizon) M.delete(l);
  for (let l = 1; l <= Math.min(30, horizon); l++) {
    if (!M.has(l)) { const h = K.deltaHyperoct(l); M.set(l, { n: BigInt(h.n), d: BigInt(h.d) }); }
  }
  return M;
}

/* ---- the enclosure --------------------------------------------------------- */
function enclose({ N, horizon, logTerms }) {
  const L2 = log2At(logTerms);
  let lo = L2.lo, hi = L2.hi;                          /* the odd-d part is exactly log 2 */
  const cert = certifiedMap(horizon);
  for (let l = 1; l <= N; l++) {
    const wN = 1n, wD = BigInt(2 * l) * BigInt(2 * l + 1);
    if (cert.has(l)) {
      const d0 = cert.get(l);
      lo += floorAt(d0.n * wN, d0.d * wD); hi += ceilAt(d0.n * wN, d0.d * wD);
    } else {
      const h = hypRat(l);
      let fact = 1n; for (let i = 2; i <= l; i++) fact *= BigInt(i);
      const allowD = 2n ** BigInt(l) * fact;           /* allowance = 1/(2^l·l!) */
      /* δ ∈ [h − allowance, h] */
      lo += floorAt((h.n * allowD - h.d) * wN, h.d * allowD * wD);
      hi += ceilAt(h.n * wN, h.d * wD);
    }
  }
  /* tail l > N: weight T = Σ_{m=1..2N+1} (−1)^{m+1}/m − log 2 (exact alt sum,
     outward log 2), density box [δ∞ − dev − allow, δ∞ + dev] with δ∞ = 1 − e^{−1/2} */
  let altLo = 0n, altHi = 0n;
  for (let m = 1; m <= 2 * N + 1; m++) {
    const t = { n: 1n, d: BigInt(m) };
    if (m % 2 === 1) { altLo += floorAt(t.n, t.d); altHi += ceilAt(t.n, t.d); }
    else { altLo -= ceilAt(t.n, t.d); altHi -= floorAt(t.n, t.d); }
  }
  const TLo = altLo - L2.hi, THi = altHi - L2.lo;
  if (TLo < 0n) die('tail weight went negative — cutoff too small');
  /* δ∞ bounds by the alternating series to i = 200, bracketed by the last term */
  const inf = hypRat(200);                              /* 1 − partial(e^{−1/2}) at l = 200 */
  let f200 = 1n; for (let i = 2; i <= 201; i++) f200 *= BigInt(i);
  const lastD = 2n ** 201n * f200;
  const dInfLo = floorAt(inf.n * lastD - inf.d, inf.d * lastD);
  const dInfHi = ceilAt(inf.n * lastD + inf.d, inf.d * lastD);
  /* dev + allowance at l = N+1, where both are largest */
  let fN = 1n; for (let i = 2; i <= N + 1; i++) fN *= BigInt(i);
  const devD = 2n ** BigInt(N + 1) * fN;
  const dLoTail = dInfLo - ceilAt(2n, devD);            /* − (dev + allow) ≥ −2/(2^{N+1}(N+1)!) */
  const dHiTail = dInfHi + ceilAt(1n, devD);
  lo += (TLo * (dLoTail < 0n ? 0n : dLoTail)) / SCALE;
  hi += (THi * dHiTail) / SCALE + 1n;
  return { lo, hi };
}

const decOf = (v, digits) => {
  const s = (v * 10n ** BigInt(digits)) / SCALE;
  const t = s.toString().padStart(digits + 1, '0');
  return t.slice(0, -digits) + '.' + t.slice(-digits);
};
const agreed = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); };

/* ---- gate 1: calibration against the lifted kernel at horizon 60 ---------- */
{
  const cal = enclose({ N: 200, horizon: 60, logTerms: 400 });
  const KS = K.conditionalCStar(120, 80);
  const kLo = K.decimals(KS.lo, 44, 'floor'), kHi = K.decimals(KS.hi, 44, 'ceil');
  const mine = agreed(decOf(cal.lo, 44), decOf(cal.hi, 44));
  const kern = agreed(kLo, kHi);
  const common = Math.min(mine.length, kern.length);
  if (mine.slice(0, common) !== kern.slice(0, common))
    die('calibration failed: horizon-60 enclosure ' + mine + ' disagrees with the kernel\'s ' + kern);
  console.log('gate 1 · calibration vs lifted kernel at horizon 60: agree to ' + (common - 2) + ' digits  [ok]');
}

/* ---- the extended-horizon enclosure --------------------------------------- */
const EXT = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos290-tail-ext.json'), 'utf8'));
const Lmax = Math.max(...Object.keys(EXT.deltas).map(Number));
const N = Math.max(Lmax + 200, 320);
const A = enclose({ N, horizon: Lmax, logTerms: DIGITS * 5 });
const B = enclose({ N: N + 60, horizon: Lmax, logTerms: DIGITS * 5 + 120 });

/* gate 2: cutoff agreement */
const aStr = agreed(decOf(A.lo, DIGITS), decOf(A.hi, DIGITS));
const bStr = agreed(decOf(B.lo, DIGITS), decOf(B.hi, DIGITS));
const commonAB = Math.min(aStr.length, bStr.length);
if (aStr.slice(0, commonAB) !== bStr.slice(0, commonAB)) die('cutoff-agreement failed: N=' + N + ' vs N=' + (N + 60));
console.log('gate 2 · cutoff agreement N=' + N + ' vs ' + (N + 60) + ': ' + (commonAB - 2) + ' shared digits  [ok]');

/* gate 3: containment in the unconditional bracket's loose bounds */
const asNum = Number(decOf(A.lo, 10));
if (!(asNum > 0.8296 && asNum < 0.8325)) die('enclosure escaped the unconditional bracket');
console.log('gate 3 · containment in [0.8296, 0.8325]  [ok]');

const cstar = aStr;
console.log('\ncertified horizon l <= ' + Lmax + ' (even d <= ' + 2 * Lmax + '); assumption enters at l = ' + (Lmax + 1));
console.log('c* digits agreed: ' + (cstar.length - 2));
console.log('c* = ' + cstar);

/* 1/(1+c*): outward division of the enclosure */
const oneP = SCALE;
const invLo = (oneP * SCALE) / (oneP + A.hi);          /* floor */
const invHi = (oneP * SCALE + (oneP + A.lo) - 1n) / (oneP + A.lo);
const c0 = agreed(decOf(invLo, DIGITS), decOf(invHi, DIGITS));
console.log('1/(1+c*) digits agreed: ' + (c0.length - 2));
console.log('1/(1+c*) = ' + c0);

/* b-files: digit-per-line, OEIS shape (offset 0, digits after "0.") */
const bfile = (s) => s.slice(2).split('').map((ch, i) => (i + 1) + ' ' + ch).join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'outreach', 'b-oeis-cstar.txt'), bfile(cstar.slice(0, 2 + Math.min(DIGITS, cstar.length - 2))));
fs.writeFileSync(path.join(ROOT, 'outreach', 'b-oeis-c0.txt'), bfile(c0.slice(0, 2 + Math.min(DIGITS, c0.length - 2))));
console.log('\noutreach/b-oeis-cstar.txt + b-oeis-c0.txt written (rerun after each horizon extension)');
