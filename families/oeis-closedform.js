/* oeis-closedform.js — audit every published OEIS decimal-expansion constant
   for small closed forms.

   The engine's first family that does not generate its own objects: it reads a
   corpus somebody else published and asks, of each constant, which small closed
   forms are RULED OUT and which survive.

   MANTISSA COMPARISON, and why it is the right test here.
   OEIS's bulk file stripped.gz carries the digit stream but NOT the offset, so
   the decimal point cannot be placed from it. Rather than guess, this compares
   MANTISSAS: the constant's digits as m in [1,10), against each candidate
   form's own mantissa. The verdict then reads "not equal to this form UP TO ANY
   POWER OF TEN", which is a strictly STRONGER refutation than the placed
   comparison would give — it rules out 1/3 and 1/30 and 10/3 together.

   The asymmetry is deliberate and it is what makes the two-stage design work:
   refutations get stronger for free, and only the survivors — a handful out of
   fourteen thousand — need one confirming fetch each to place the point.

   THE ASSUMPTION, stated in every verdict: the enclosure is rigorous CONDITIONAL
   ON THE PUBLISHED DIGITS BEING CORRECT. A refutation here is "proved, given
   OEIS's digits", which is weaker and more honest than "proved".

   Enclosure soundness: capped at 17 significant digits and padded outward 4
   ulps. The first version used 25 digits — a mathematical width of 1e-24 in
   doubles whose spacing near 1.4 is 2.2e-16 — so the interval collapsed to a
   single double and REFUTED sqrt(2) as a closed form for the decimal expansion
   of sqrt(2). Calibration caught it; tools/test-engine.js now keeps it caught. */
'use strict';

const path = require('path');
const fs = require('fs');
const IV = require('#instruments/interval/interval.js');

const CORPUS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'oeis-constants.json'), 'utf8')).entries;

const DIGITS = 17;
function padOut(lo, hi) {
  let a = lo, b = hi;
  for (let i = 0; i < 4; i++) { a = IV.nextDown(a); b = IV.nextUp(b); }
  return [a, b];
}

/* digits -> mantissa enclosure in [1,10) */
function mantissaOf(e) {
  const d = e.digits;
  if (!d.length || d.some(x => x < 0 || x > 9)) return null;
  let i = 0; while (i < d.length && d[i] === 0) i++;          /* skip leading zeros */
  if (i >= d.length) return null;
  const use = Math.min(d.length - i, DIGITS);
  let s = '';
  for (let k = 0; k < use; k++) s += d[i + k];
  const lo = Number(s) * Math.pow(10, 1 - use);
  if (!isFinite(lo) || lo < 1 || lo >= 10) return null;
  return padOut(lo, lo + Math.pow(10, 1 - use));
}

function mant(v) {
  if (!isFinite(v) || v <= 0) return NaN;
  return v / Math.pow(10, Math.floor(Math.log10(v)));
}

/* ---- the closed-form vocabulary --------------------------------------------
   Wider than the first pass, because a refutation is only as interesting as the
   space it rules out. Every form is generated, never listed. */
const K = {
  pi: Math.PI, e: Math.E, ln2: Math.LN2, ln10: Math.LN10,
  sqrt2: Math.SQRT2, sqrt3: Math.sqrt(3), sqrt5: Math.sqrt(5),
  phi: (1 + Math.sqrt(5)) / 2, euler: 0.5772156649015329
};
const KN = Object.keys(K);

function forms(emit) {
  /* rationals p/q */
  for (let q = 1; q <= 32; q++) for (let p = 1; p <= 32; p++) emit(p + '/' + q, p / q);
  /* square and cube roots of small rationals — degree-2 and -3 algebraics */
  for (let q = 1; q <= 16; q++) for (let p = 1; p <= 32; p++) {
    emit('sqrt(' + p + '/' + q + ')', Math.sqrt(p / q));
    emit('cbrt(' + p + '/' + q + ')', Math.cbrt(p / q));
  }
  /* (a + b*sqrt(d))/c — the quadratic irrationals */
  for (const d of [2, 3, 5, 6, 7, 10, 13]) for (let a = 0; a <= 6; a++)
    for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++)
      emit('(' + a + '+' + b + 'sqrt' + d + ')/' + c, (a + b * Math.sqrt(d)) / c);
  /* rational multiples and rational powers of each named constant */
  for (const n of KN) for (let q = 1; q <= 8; q++) for (let p = 1; p <= 8; p++) {
    emit('(' + p + '/' + q + ')' + n, (p / q) * K[n]);
    emit(n + '^(' + p + '/' + q + ')', Math.pow(K[n], p / q));
  }
  /* products and quotients of two named constants */
  for (let i = 0; i < KN.length; i++) for (let j = 0; j < KN.length; j++) {
    if (i === j) continue;
    emit(KN[i] + '*' + KN[j], K[KN[i]] * K[KN[j]]);
    emit(KN[i] + '/' + KN[j], K[KN[i]] / K[KN[j]]);
  }
  /* log and exp of small rationals */
  for (let q = 1; q <= 8; q++) for (let p = 1; p <= 16; p++) {
    if (p === q) continue;
    emit('log(' + p + '/' + q + ')', Math.log(p / q));
    emit('exp(' + p + '/' + q + ')', Math.exp(p / q));
  }
}

/* count the vocabulary once, so the page can report what a refutation ruled out */
let VOCAB = 0; forms(() => { VOCAB++; });

/* ---- EXACT refutation, at the full published precision ---------------------
   The double-precision test caps at 17 digits, and that is not always enough.
   A271880 — the probability a random real is "evil" — agrees with 1/5 to
   SIXTY-THREE digits before diverging (OEIS records the difference separately in
   A271881, about 2.17e-64). At 17 digits the enclosure genuinely contains 1/5
   and the engine is right not to refute; the honest verdict there is UNDECIDED,
   not MATCH.

   For rational forms the decision can be made exactly at the full published
   length, in BigInt, with no floating point anywhere. Write the constant's
   digits as an integer D of k digits, so its mantissa lies in
   [D, D+1)/10^(k-1); write the form's mantissa as an exact P/Q in [1,10). Then

       the form is possible  <=>  D*Q <= P*10^(k-1) < (D+1)*Q

   and everything in that line is an integer comparison. */
function mantissaRational(p, q) {
  let P = BigInt(p), Q = BigInt(q);
  if (P <= 0n || Q <= 0n) return null;
  while (P * 1n < Q) P *= 10n;                 /* scale up into [1,10) */
  while (P >= 10n * Q) Q *= 10n;
  return [P, Q];
}
function exactlyPossible(digits, p, q) {
  const mr = mantissaRational(p, q);
  if (!mr) return null;
  const [P, Q] = mr;
  let i = 0; while (i < digits.length && digits[i] === 0) i++;
  const ds = digits.slice(i).join('');
  if (!ds.length) return null;
  const D = BigInt(ds), k = BigInt(ds.length);
  const lhs = D * Q;
  const mid = P * (10n ** (k - 1n));
  const rhs = (D + 1n) * Q;
  return lhs <= mid && mid < rhs;
}

/* A radical can be a rational in disguise: sqrt(4/1) and cbrt(8/1) are both 2,
   and the first exact pass let them through because it only matched "p/q". A
   form is routed to the exact test whenever its value is rational — which for
   sqrt(p/q) means p and q are both perfect squares after reduction, and for
   cbrt both perfect cubes. */
function gcdI(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
function nthRootExact(n, r) {
  if (n <= 0) return null;
  const x = Math.round(Math.pow(n, 1 / r));
  for (const c of [x - 1, x, x + 1]) { if (c > 0 && Math.pow(c, r) === n) return c; }
  return null;
}
/* Whether a form is rational is a question about its VALUE, not its spelling.
   Matching label shapes was whack-a-mole: sqrt(4/1) got caught, then
   sqrt2^(2/1) walked through, and the next disguise would have too. This asks
   the value directly — a continued-fraction expansion finds any rational with a
   small denominator — so every spelling of 2 is routed to the exact test at
   once. */
function asRational(label, value) {
  const m = /^(\d+)\/(\d+)$/.exec(label);
  if (m) return [Number(m[1]), Number(m[2])];
  if (!isFinite(value) || value <= 0) return null;
  let x = value, h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (let i = 0; i < 12; i++) {
    const a = Math.floor(x);
    const h = a * h1 + h0, k = a * k1 + k0;
    h0 = h1; h1 = h; k0 = k1; k1 = k;
    if (k > 4096) break;
    if (Math.abs(value - h / k) <= 1e-13 * value) return [h, k];   /* rational in disguise */
    const frac = x - a;
    if (frac < 1e-13) break;
    x = 1 / frac;
  }
  return null;                                        /* genuinely irrational */
}

const NOT_A_CONSTANT = /all \d's sequence|constant sequence|characteristic function|period \d|simplest sequence|repeat/i;

module.exports = {
  name: 'oeis-closedform',
  statement: 'a published OEIS constant whose name states no closed form, but whose digits are consistent with a small closed form while every other form in the vocabulary is refuted',
  vocabulary: VOCAB,
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  value: (e) => { const m = mantissaOf(e); return m ? m[0] : NaN; },
  interesting: (e) => !NOT_A_CONSTANT.test(e.name) && !!mantissaOf(e),
  key: (e) => e.id,
  certify(e) {
    const encl = mantissaOf(e);
    if (!encl) return { verdict: 'REFUSED', why: 'no usable digit stream' };
    const [lo, hi] = encl;
    let tested = 0, refuted = 0;
    const survivors = [];
    forms((label, v) => {
      const m = mant(v);
      if (!isFinite(m)) return;
      tested++;
      if (m >= lo && m <= hi) survivors.push({ label, value: v, mantissa: m });
      else refuted++;
    });

    /* Does the entry's own name already give the form? Conservative in the one
       direction that matters: it must not call something unnamed when the name
       names it. */
    const named = /=|sqrt|log|exp|Pi\b|pi\b|zeta|Gamma|gamma|\^|\/|root|sum|product|integral|Li_|e\^|constant of|number$/i
      .test(e.name.replace(/^Decimal expansion of\s*/i, ''));

    /* Every rational survivor gets re-decided EXACTLY at the full published
       length. A survivor that the exact test kills was never a match — it was a
       constant too close to the form for 17 digits to separate. */
    const exactRefuted = [];
    const stillPossible = [];
    for (const s of survivors) {
      const rq = asRational(s.label, s.value); /* rational, however it is spelled */
      if (!rq) { stillPossible.push(s); continue; }
      const poss = exactlyPossible(e.digits, rq[0], rq[1]);
      if (poss === false) exactRefuted.push(s.label); else stillPossible.push(s);
    }

    const hit = !named && stillPossible.length > 0;
    return {
      verdict: hit ? 'HIT' : 'REJECT',
      enclosure: encl,
      text: hit
        ? e.id + ' — "' + e.name.slice(0, 64) + '" states no closed form, yet its digits match '
          + stillPossible.slice(0, 3).map(s => s.label).join(' / ') + ' up to a power of ten; '
          + refuted + ' other forms refuted in double, ' + exactRefuted.length + ' more refuted EXACTLY'
        : e.id + ': ' + refuted + ' of ' + tested + ' forms refuted, ' + survivors.length + ' surviving',
      extra: {
        id: e.id, name: e.name, nameStatesForm: named,
        digitsUsed: Math.min(e.digits.length, DIGITS),
        tested, refuted,
        exactRefuted, exactDigits: e.digits.length,
        survivors: stillPossible.slice(0, 6).map(s => ({ label: s.label, value: s.value })),
        assumption: 'mantissa comparison, conditional on the OEIS published digits; a survivor still needs its offset confirmed before the decimal point is placed'
      }
    };
  }
};
