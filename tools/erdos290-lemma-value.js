#!/usr/bin/env node
/* erdos290-lemma-value.js — what is each unproved lemma WORTH, in digits?

   The #290 bracket is exact and monotone: its width is nothing but the sum of
   what we charge for degrees we have not determined. That has an unusual
   consequence. A lemma that narrows the charge can be PRICED BEFORE IT IS
   PROVED — state the bound, re-assemble the bracket under it, and read off
   how many digits it buys.

   So this tool answers the question a research plan actually turns on: not
   "is this true?" but "if it were true, would it be worth my month?" It
   ranks candidate theorems by digits-per-lemma, and it inverts the question
   too — given a target digit, it solves for the weakest bound that reaches it.

   Nothing here proves anything, and the tool says so on every line: these are
   CONDITIONAL brackets, valid if and only if their stated lemma is. The
   unconditional row is the one labelled "nothing assumed".

   usage: node tools/erdos290-lemma-value.js */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const LEG = path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290');
const T = require(path.join(ROOT, 'machine', 'erdos290', 'tail.js'));

const I = T.loadInputs(ROOT, LEG);
const Q = I.Q, C = T.constraints(Q);
const bracket = T.makeBracket(I);
const ONE = Q.R(1n, 1n);

const dec = (a, kd, up) => { const sc = 10n ** BigInt(kd);
  let q = a.n * sc / a.d; if (up && a.n * sc % a.d !== 0n) q += 1n; return Number(q) / Number(sc); };
/* exact decimal string — dec() goes through a double and caps out near 15
   digits, which silently truncated the strongest row when this tool first ran */
const decStr = (a, kd) => {
  const sc = 10n ** BigInt(kd);
  const q = (a.n * sc) / a.d;
  const s = q.toString().padStart(kd + 1, '0');
  return s.slice(0, s.length - kd) + '.' + s.slice(s.length - kd);
};
const agreed = (lo, hi, kd) => {
  const a = decStr(lo, kd), b = decStr(hi, kd);
  let n = 0;
  for (let i = 2; i < a.length; i++) { if (a[i] !== b[i]) break; n++; }
  return n;
};
/* 1/(1+c) — decreasing, so the endpoints swap */
const inv = (b) => ({ lo: Q.div(ONE, Q.add(ONE, b.hi)), hi: Q.div(ONE, Q.add(ONE, b.lo)) });

function evaluate(con) {
  const chk = T.consistentWithPinned(Q, con, I.EXACT, 31);
  const b = bracket(I.Lmax, con);
  const v = inv(b);
  return {
    id: con.id, label: con.label, needs: con.needs,
    cDig: agreed(b.lo, b.hi, 60),
    vStr: decStr(v.lo, 60), vDig: agreed(v.lo, v.hi, 60),
    width: Q.toDouble(Q.sub(b.hi, b.lo)),
    consistent: chk.ok, violation: chk.ok ? null : chk
  };
}

const base = evaluate(C.full);

/* ---- ASK MODE: price one lemma, stated on the command line ---------------
   node tools/erdos290-lemma-value.js --ask 0.3,0.5
   means "suppose someone proves δ always lies between 0.3 and 0.5". The tool
   answers three things and nothing else: is that consistent with what we have
   already computed, what would it be worth, and is it worth more than doing
   nothing. This is the whole instrument in one command. */
{
  const i = process.argv.indexOf('--ask');
  if (i > 0 && process.argv[i + 1]) {
    const [a, b] = process.argv[i + 1].split(',').map(Number);
    if (!(a >= 0 && b <= 1 && a < b)) {
      console.error('--ask wants lo,hi with 0 <= lo < hi <= 1');
      process.exit(1);
    }
    const den = 1000000;
    const con = {
      id: 'ask:' + a + ',' + b,
      label: 'δ ∈ [' + a + ', ' + b + ']',
      needs: 'a proof that δ(f_d) ∈ [' + a + ', ' + b + '] for every large even d',
      bounds: () => ({ A: Q.R(BigInt(Math.round(a * den)), BigInt(den)),
                       B: Q.R(BigInt(Math.round(b * den)), BigInt(den)) })
    };
    const chk = T.consistentWithPinned(Q, con, I.EXACT, 31);
    console.log('');
    console.log('  YOU ASKED:  suppose δ(f_d) ∈ [' + a + ', ' + b + '] for every large even d.');
    console.log('');
    if (!chk.ok) {
      console.log('  ALREADY FALSE. ' + chk.why + ':');
      console.log('               δ(f_' + chk.d + ') = ' + Q.toDouble(chk.delta).toFixed(12)
        + ', which this project computed exactly.');
      console.log('  Do not spend a day on it. Checked against ' + I.EXACT.size + ' densities on file.');
      console.log('');
      process.exit(0);
    }
    const r = evaluate(con);
    const gain = r.vDig - base.vDig;
    console.log('  CONSISTENT with all ' + chk.checked + ' densities already computed. Not refuted.');
    console.log('');
    console.log('  WORTH:      c₀ known to ' + r.vDig + ' digits  (today, assuming nothing: ' + base.vDig + ')');
    console.log('              ' + r.vStr.slice(0, 2 + r.vDig) + '…');
    console.log('              bracket width ' + base.width.toExponential(2) + '  ->  ' + r.width.toExponential(2));
    console.log('');
    console.log(gain > 0
      ? '  VERDICT:    WORTH PROVING — it buys ' + gain + ' digit' + (gain > 1 ? 's' : '') + '.'
      : '  VERDICT:    TRUE BUT WORTHLESS — it narrows the bracket and buys no digit.');
    console.log('');
    process.exit(0);
  }
}

console.log('');
console.log('ERDŐS #290 — WHAT EACH LEMMA WOULD BE WORTH');
console.log('horizon l <= ' + I.Lmax + ' (every even d <= ' + 2 * I.Lmax + ' pinned exactly, '
  + I.EXACT.size + ' densities on file)');
console.log('the limit the true density approaches: 1 - e^(-1/2) = 0.3934693402873666...');
console.log('');
console.log('  ' + 'assumption'.padEnd(34) + 'width of c'.padStart(11) + '   1/(1+c), known unconditionally-if-true   gain');
console.log('  ' + '-'.repeat(34) + ' ' + '-'.repeat(10) + '   ' + '-'.repeat(20) + '   ' + '-'.repeat(4));

const menu = [
  C.full,
  C.ceiling(9, 10), C.ceiling(1, 2),
  C.floor(1, 10), C.floor(3, 10),
  C.window(5, 10), C.window(2, 10), C.window(1, 10),
  C.window(1, 100), C.window(1, 1000),
  C.hyperoct
];
for (const con of menu) {
  const r = evaluate(con);
  const gain = r.vDig - base.vDig;
  if (!r.consistent) {
    console.log('  ' + r.label.slice(0, 34).padEnd(34) + '  REFUTED BY DATA — '
      + r.violation.why + ' (this lemma is false; it was not priced)');
    continue;
  }
  console.log('  ' + r.label.slice(0, 34).padEnd(34)
    + r.width.toExponential(2).padStart(11)
    + '   ' + (r.vStr.slice(0, 2 + r.vDig) + '…').padEnd(20)
    + '   ' + (gain > 0 ? '+' + gain : String(gain)));
}

/* ---- the inverse question ------------------------------------------------
   Given a target number of digits, what is the WEAKEST two-sided window that
   reaches it? Bisection on the window width in exact rationals — the answer
   is the strength of lemma a person would actually have to prove. */
console.log('');
console.log('INVERTED — the weakest lemma that buys each digit:');
for (const target of [base.vDig + 1, base.vDig + 2, base.vDig + 3]) {
  let loD = 1n, hiD = 1000000n, found = null;      /* window width = 1/D, search D */
  for (let it = 0; it < 40 && loD <= hiD; it++) {
    const mid = (loD + hiD) / 2n;
    const r = evaluate(C.window(1, Number(mid)));
    if (r.vDig >= target) { found = { D: mid, r }; hiD = mid - 1n; } else { loD = mid + 1n; }
  }
  if (found) {
    console.log('  ' + target + ' digits  <-  prove δ lies within ±' + (0.5 / Number(found.D)).toExponential(2)
      + ' of 1-e^(-1/2)   (a window of width ' + (1 / Number(found.D)).toExponential(2) + ')');
  } else {
    console.log('  ' + target + ' digits  <-  not reachable by a window alone at this horizon');
  }
}

/* ---- (b) FAMILY ARGUMENTS, priced exactly --------------------------------
   Closing a residue class l ≡ r (mod m) cannot be written as one interval
   valid for every degree, so it needs the tail weight SPLIT across the class.
   That split is computed here in fixed-point integer arithmetic with outward
   rounding — floor for the low end, ceil for the high end — so it is an
   enclosure, not an estimate. Terms past the cutoff are bounded by
   Sum_{l>N} 1/(2l(2l+1)) < 1/(4N) and charged in full to the uncertain side. */
function familySplit(m, r, N) {
  const S = 10n ** 50n;
  let lo = 0n, hi = 0n;
  for (let l = I.Lmax + 1; l <= N; l++) {
    if (l % m !== r % m) continue;
    const den = BigInt(2 * l) * BigInt(2 * l + 1);
    lo += S / den;
    hi += S / den + (S % den === 0n ? 0n : 1n);
  }
  return { lo: Q.R(lo, S), hi: Q.R(hi, S), rem: Q.R(1n, BigInt(4 * N)) };
}

{
  const N = 300000;
  const T = Q.sub(Q.sub(ONE, I.L2.lo), (() => {
    let p = Q.R(0n, 1n); for (let l = 1; l <= I.Lmax; l++) p = Q.add(p, I.W(l)); return p;
  })());
  console.log('');
  console.log('(b) FAMILY ARGUMENTS — closing one residue class of degrees, priced exactly');
  console.log('    (tail weight split by fixed-point interval summation to l = ' + N.toLocaleString('en-US')
    + ', remainder < ' + Q.toDouble(Q.R(1n, BigInt(4 * N))).toExponential(1) + ' charged to the uncertain side)');
  console.log('');
  for (const m of [2, 3, 4]) {
    const sp = familySplit(m, 0, N);
    /* closing the class removes its weight from the uncertain part; the class
       itself then contributes a point, so only the COMPLEMENT keeps width */
    const removedLo = sp.lo;                       /* certainly at least this much removed */
    const widthAfterHi = Q.add(Q.sub(T, removedLo), sp.rem);
    const wAfter = Q.toDouble(widthAfterHi);
    const before = Q.toDouble(T);
    console.log('    1 class in ' + m + '  (density 1/' + m + ')   tail width '
      + before.toExponential(2) + ' -> ' + wAfter.toExponential(2)
      + '   (' + (100 * (1 - wAfter / before)).toFixed(1) + '% removed)');
  }
  console.log('');
  console.log('    So a family argument is worth almost exactly its density: closing half the');
  console.log('    degrees removes about half the remaining width. It buys a digit only when the');
  console.log('    class is nearly everything — which is why (c), the theorem covering EVERY');
  console.log('    degree, is a different kind of object and not just more of the same.');
}

console.log('');
console.log('Every row except the first is CONDITIONAL on its own lemma. The unconditional');
console.log('bracket is the first row, and it is the only one this project may state as fact.');
