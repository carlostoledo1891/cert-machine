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

   EVERY CANDIDATE IS AN ENCLOSURE (2026-10-09). Until this date each form was a
   DOUBLE — Math.sqrt(p/q), Math.cbrt, (a + b·Math.sqrt(d))/c, (p/q)·K with K a
   float constant, Math.pow(K, p/q), Math.log, Math.exp — and a form whose float
   mantissa fell outside the constant's enclosure was counted as refuted. That is
   exact for p/q (round-to-nearest is monotone) and NOT for the rest; the control
   page counted 54.6 million of them as "refuted in double". Now every form is an
   exact rational or a verified enclosure (instruments/interval/algebraic.js for
   roots and the decimal-given γ, transcendental.js for π, e, ln 2, ln 10, log,
   exp and rational powers), the constant's mantissa box is the exact rational
   interval [D, D+1)/10^(k−1) converted OUTWARD to doubles, and a form is refuted
   only when the two enclosures are DISJOINT. The vocabulary is unchanged, so the
   counts are comparable; the erratum record certs/erratum-2026-10-09.json pins
   the numbers before.

   Enclosure history: the first version used 25 digits — a mathematical width of
   1e-24 in doubles whose spacing near 1.4 is 2.2e-16 — so the interval collapsed
   to a single double and REFUTED sqrt(2) as a closed form for the decimal
   expansion of sqrt(2). Calibration caught it; tools/test-engine.js keeps it
   caught; the exact-then-outward construction below makes it impossible. */
'use strict';

const path = require('path');
const fs = require('fs');
const IV = require('#instruments/interval/interval.js');
const T = require('#instruments/interval/transcendental.js');
const Q = require('#instruments/interval/rational.js');
const ALG = require('#instruments/interval/algebraic.js');
const V = require('#instruments/verdict.js');

const CORPUS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'oeis-constants.json'), 'utf8')).entries;

/* The bulk corpus carries only id + name + digits; OEIS states closed forms in
   FORMULA and COMMENT fields the bulk file does not have. tools/confirm-survivors.js
   fetches the FULL record for every survivor and writes the result here. A
   discovery is only CERTIFIED if the full record was checked and states no form —
   before this file fed back in, the family certified "Decimal expansion of 2*e"
   as a discovery because the name-only regex missed the asterisk. The engine now
   decides what a hand-run script once concluded. */
const CONFIRMED = (() => {
  const m = new Map();
  try {
    for (const o of JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'survivors-confirmed.json'), 'utf8'))) {
      if (o.fetch !== 'FAILED') m.set(o.id, !!o.statesForm);
    }
  } catch (e) { /* no confirmation data — every survivor stays unconfirmed */ }
  return m;
})();

const DIGITS = 17;

/* digits -> mantissa enclosure in [1,10): the exact rational interval the first
   `use` digits allow, [D, D+1)/10^(use−1), converted outward to doubles */
function mantissaOf(e) {
  const d = e.digits;
  if (!d.length || d.some(x => x < 0 || x > 9)) return null;
  let i = 0; while (i < d.length && d[i] === 0) i++;          /* skip leading zeros */
  if (i >= d.length) return null;
  const use = Math.min(d.length - i, DIGITS);
  let s = '';
  for (let k = 0; k < use; k++) s += d[i + k];
  const D = BigInt(s), scale = 10n ** BigInt(use - 1);
  try { return ALG.qToIv(Q.R(D, scale), Q.R(D + 1n, scale)); } catch (err) { return null; }
}

/* ---- the closed-form vocabulary --------------------------------------------
   Wider than the first pass, because a refutation is only as interesting as the
   space it rules out. Every form is generated, never listed, and every form is an
   exact rational (`q`) or a double enclosure (`iv`). */
const SQRT = {};
for (const d of [2, 3, 5, 6, 7, 10, 13]) SQRT[d] = ALG.sqrtRational(d, 1).iv;
const K = {
  pi: T.PI, e: T.exp(IV.ONE), ln2: T.LN2, ln10: T.log(IV.iv(10)),
  sqrt2: SQRT[2], sqrt3: SQRT[3], sqrt5: SQRT[5],
  phi: IV.div(IV.add(IV.ONE, SQRT[5]), IV.iv(2)),
  /* Euler's γ from its published digits (OEIS A001620, forty decimals) — the box the
     digits allow, outward to doubles; conditional on OEIS, like everything here */
  euler: ALG.fromDecimalDigits('0.5772156649015328606065120900824024310421')
};
const KN = Object.keys(K);

/* REDUCED SPELLINGS ONLY. The first version emitted (2/1)e, (4/2)e, (6/3)e and
   (8/4)e as four forms, (2+1sqrt3)/1 and (4+2sqrt3)/2 as two: the refuted
   count was inflated by duplicates, and one surviving value could show up as
   four candidates. Skipping gcd > 1 loses no value — the reduced spelling is
   always emitted at the smaller parameters — it only stops the same number
   being counted twice. (Cross-shape aliases — sqrt5*phi spelling the same
   value as (5+1sqrt5)/2 — can still coincide in a survivor list; they are
   different FORMS with one value, and survivors are labels, not counts.) */
function gcd2(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

function forms(emitQ, emitIv) {
  const r = (p, q) => IV.div(IV.iv(p), IV.iv(q));
  /* rationals p/q */
  for (let q = 1; q <= 32; q++) for (let p = 1; p <= 32; p++) {
    if (gcd2(p, q) !== 1) continue;
    emitQ(p + '/' + q, Q.R(p, q));
  }
  /* square and cube roots of small rationals — degree-2 and -3 algebraics. A radical
     can be a rational in disguise (sqrt(4/1) is 2): the bracket builder says so, and
     such a form is routed to the exact test like any rational. */
  for (let q = 1; q <= 16; q++) for (let p = 1; p <= 32; p++) {
    if (gcd2(p, q) !== 1) continue;
    const s = ALG.sqrtRational(p, q), c = ALG.cbrtRational(p, q);
    if (s.exact) emitQ('sqrt(' + p + '/' + q + ')', s.exact); else emitIv('sqrt(' + p + '/' + q + ')', s.iv);
    if (c.exact) emitQ('cbrt(' + p + '/' + q + ')', c.exact); else emitIv('cbrt(' + p + '/' + q + ')', c.iv);
  }
  /* (a + b*sqrt(d))/c — the quadratic irrationals, gcd(a,b,c) = 1 */
  for (const d of [2, 3, 5, 6, 7, 10, 13]) for (let a = 0; a <= 6; a++)
    for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
      if (gcd2(gcd2(a, b), c) !== 1) continue;
      emitIv('(' + a + '+' + b + 'sqrt' + d + ')/' + c, IV.div(IV.add(IV.iv(a), IV.mul(IV.iv(b), SQRT[d])), IV.iv(c)));
    }
  /* rational multiples and rational powers of each named constant; a rational power
     K^(p/q) is exp((p/q)·log K), every factor an enclosure. A RATIONAL IN DISGUISE must
     go to the exact pass: sqrt2^(2/1) is 2, and as an ENCLOSURE it survived the 17-digit
     box of A271880 (1/5 to sixty-three digits) and was announced as a discovery on the
     first run of this rewrite (2026-10-09) — the same disguise the old continued-fraction
     detector existed for. Among the vocabulary's constants only sqrt(D)^(p/1) with p even
     is rational (D ∈ {2,3,5} is not a square; (2q) | p with gcd(p,q) = 1 forces q = 1),
     and it is emitted as the exact rational D^(p/2). */
  const ROOT_OF = { sqrt2: 2n, sqrt3: 3n, sqrt5: 5n };
  for (const n of KN) for (let q = 1; q <= 8; q++) for (let p = 1; p <= 8; p++) {
    if (gcd2(p, q) !== 1) continue;
    emitIv('(' + p + '/' + q + ')' + n, IV.mul(r(p, q), K[n]));
    if (q === 1 && ROOT_OF[n] !== undefined && p % 2 === 0) emitQ(n + '^(' + p + '/1)', Q.R(ROOT_OF[n] ** BigInt(p / 2), 1n));
    else emitIv(n + '^(' + p + '/' + q + ')', q === 1 ? IV.pow(K[n], p) : T.exp(IV.mul(T.log(K[n]), r(p, q))));
  }
  /* products of two named constants (unordered — a*b IS b*a) and quotients (ordered) */
  for (let i = 0; i < KN.length; i++) for (let j = 0; j < KN.length; j++) {
    if (i === j) continue;
    if (i < j) emitIv(KN[i] + '*' + KN[j], IV.mul(K[KN[i]], K[KN[j]]));
    emitIv(KN[i] + '/' + KN[j], IV.div(K[KN[i]], K[KN[j]]));
  }
  /* log and exp of small rationals */
  for (let q = 1; q <= 8; q++) for (let p = 1; p <= 16; p++) {
    if (p === q || gcd2(p, q) !== 1) continue;
    emitIv('log(' + p + '/' + q + ')', T.log(r(p, q)));
    emitIv('exp(' + p + '/' + q + ')', T.exp(r(p, q)));
  }
}

/* ---- mantissas, computed ONCE for the whole vocabulary ----------------------
   A rational's mantissa is exact (BigInt). An enclosure's mantissa is the enclosure
   scaled by the power of ten that puts its lower end in [1,10) — the power is proposed
   in float and the scaling is done in interval arithmetic with an exact power of ten;
   if the scaled enclosure reaches 10 it straddles a power of ten and is kept as TWO
   pieces, both of which must miss the constant for the form to be refuted. A form
   whose value is not positive has no mantissa and is not tested. */
function mantissaRational(p, q) {
  let P = BigInt(p), Qd = BigInt(q);
  if (P <= 0n || Qd <= 0n) return null;
  while (P < Qd) P *= 10n;                  /* scale up into [1,10) */
  while (P >= 10n * Qd) Qd *= 10n;
  return Q.R(P, Qd);
}
function scaleBy10(c, k) {
  return k >= 0 ? IV.mul(c, IV.iv(Math.pow(10, k))) : IV.div(c, IV.iv(Math.pow(10, -k)));
}
function mantissaPieces(c) {
  if (!(c[0] > 0) || !Number.isFinite(c[1])) return null;
  let k = -Math.floor(Math.log10(c[0]));
  let s = scaleBy10(c, k);
  for (let t = 0; t < 4 && s[0] < 1; t++) { k++; s = scaleBy10(c, k); }
  for (let t = 0; t < 4 && s[0] >= 10; t++) { k--; s = scaleBy10(c, k); }
  if (!(s[0] >= 1 && s[0] < 10)) return null;
  if (s[1] < 10) return [s];
  return [[s[0], 10], [1, IV.div(IV.iv(s[1]), IV.iv(10))[1]]];
}

const FORMS = [];
forms(
  (label, q) => { const m = mantissaRational(q.n, q.d); FORMS.push({ label, q, mq: m, display: Q.toDouble(q), skip: !m }); },
  (label, iv) => { const pieces = mantissaPieces(iv); FORMS.push({ label, iv, pieces, display: (iv[0] + iv[1]) / 2, skip: !pieces }); }
);
const VOCAB = FORMS.length;

/* ---- EXACT refutation, at the full published precision ---------------------
   The double-precision test caps at 17 digits, and that is not always enough.
   A271880 — the probability a random real is "evil" — agrees with 1/5 to
   SIXTY-THREE digits before diverging (OEIS records the difference separately in
   A271881, about 2.17e-64). At 17 digits the enclosure genuinely contains 1/5
   and the engine is right not to refute; the honest verdict there is REFUSED,
   not MATCH.

   For rational forms the decision can be made exactly at the full published
   length, in BigInt, with no floating point anywhere. Write the constant's
   digits as an integer D of k digits, so its mantissa lies in
   [D, D+1)/10^(k-1); write the form's mantissa as an exact P/Q in [1,10). Then

       the form is possible  <=>  D*Q <= P*10^(k-1) < (D+1)*Q

   and everything in that line is an integer comparison. */
function exactlyPossible(digits, mq) {
  const P = mq.n, Qd = mq.d;
  let i = 0; while (i < digits.length && digits[i] === 0) i++;
  const ds = digits.slice(i).join('');
  if (!ds.length) return null;
  const D = BigInt(ds), k = BigInt(ds.length);
  const lhs = D * Qd;
  const mid = P * (10n ** (k - 1n));
  const rhs = (D + 1n) * Qd;
  return lhs <= mid && mid < rhs;
}

const NOT_A_CONSTANT = /all \d's sequence|constant sequence|characteristic function|period \d|simplest sequence|repeat/i;

module.exports = {
  name: 'oeis-closedform',
  statement: 'a published OEIS constant whose record — name AND fetched formula/comment fields — states no closed form, while its digits are consistent with a small closed form and every other form in the vocabulary is refuted',
  vocabulary: VOCAB,
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  value: (e) => { const m = mantissaOf(e); return m ? m[0] : NaN; },
  interesting: (e) => !NOT_A_CONSTANT.test(e.name) && !!mantissaOf(e),
  key: (e) => e.id,
  certify(e) {
    const encl = mantissaOf(e);
    if (!encl) return { verdict: V.REFUSED, why: 'no usable digit stream' };
    const [lo, hi] = encl;
    let tested = 0, refuted = 0;
    const survivors = [];
    for (const f of FORMS) {
      if (f.skip) continue;
      tested++;
      const disjoint = f.mq
        ? ALG.rationalDisjoint(f.mq, lo, hi)
        : f.pieces.every(pc => pc[1] < lo || pc[0] > hi);
      if (disjoint) refuted++; else survivors.push(f);
    }

    /* Does the entry's own name already give the form? Conservative in the one
       direction that matters: it must not call something unnamed when the name
       names it. The first version missed "2*e" (an asterisk), "2 + phi",
       "square of the Euler-Mascheroni constant" and "tangent of 75 degrees" —
       all four certified as discoveries the confirmation fetch then disproved. The
       regex is widened for those shapes AND no longer trusted alone: see the
       CONFIRMED check below. */
    const named = /=|sqrt|log|exp|Pi\b|pi\b|phi\b|golden|zeta|Gamma|gamma|\^|\/|root|sum|product|integral|Li_|e\^|constant of|number$|\d\s*\*|\*\s*\d|square of|cube of|tangent|sine|cosine|\btan\b|\bsin\b|\bcos\b|degrees/i
      .test(e.name.replace(/^Decimal expansion of\s*/i, ''));

    /* Every rational survivor gets re-decided EXACTLY at the full published
       length. A survivor that the exact test kills was never a match — it was a
       constant too close to the form for 17 digits to separate. */
    const exactRefuted = [];
    const stillPossible = [];
    for (const s of survivors) {
      if (!s.mq) { stillPossible.push(s); continue; }
      const poss = exactlyPossible(e.digits, s.mq);
      if (poss === false) exactRefuted.push(s.label); else stillPossible.push(s);
    }

    /* The statement has three clauses — the record states no form; the digits are
       consistent with a small form; every other form is refuted — and the verdict is
       about the statement. The record stating the form (in the name, or in the fetched
       formula/comment fields) REFUTES it, exactly, as a fact about the record; no
       surviving form REFUTES it, every form having been refuted by disjointness or by
       the exact pass; a survivor whose full record has NOT been fetched leaves it
       REFUSED — an open candidate, because absence of a check is not absence of a form. */
    const onRecord = CONFIRMED.get(e.id) === true;
    const recordChecked = CONFIRMED.has(e.id);
    const hit = !named && !onRecord && recordChecked && stillPossible.length > 0;
    const verdict = hit ? V.CERTIFIED
      : stillPossible.length === 0 ? V.REFUTED
      : (named || onRecord) ? V.REFUTED
      : V.REFUSED;
    const first = stillPossible.length ? stillPossible[0].label : null;
    return {
      verdict,
      enclosure: encl,
      why: verdict === V.REFUSED ? e.id + ': digits match ' + first + ' but the full record has not been fetched — open candidate, not a discovery' : undefined,
      text: hit
        ? e.id + ' — "' + e.name.slice(0, 64) + '" states no closed form anywhere in its record, yet its digits match '
          + stillPossible.slice(0, 3).map(s => s.label).join(' / ') + ' up to a power of ten; '
          + refuted + ' other forms refuted by disjointness, ' + exactRefuted.length + ' more refuted EXACTLY at the full digit length'
        : stillPossible.length > 0 && (named || onRecord)
          ? e.id + ': digits match ' + first + ' — and the OEIS record already states the form ('
            + (named ? 'in the name' : 'in a formula/comment field') + '); a screen escape, not a discovery'
        : stillPossible.length > 0
          ? e.id + ': digits match ' + first + ' but the full record has not been fetched — open candidate, not a discovery'
          : e.id + ': ' + refuted + ' of ' + tested + ' forms refuted by disjointness, ' + exactRefuted.length + ' exactly, ' + stillPossible.length + ' surviving',
      extra: {
        id: e.id, name: e.name, nameStatesForm: named,
        formOnRecord: recordChecked ? onRecord : null,
        digitsUsed: Math.min(e.digits.length, DIGITS),
        tested, refuted,
        exactRefuted, exactDigits: e.digits.length,
        /* the count that closes the page's subtraction (review R1): every
           form the disjointness test could NOT refute, after the exact
           BigInt pass, ends up here — decided by the record check or left
           an open candidate, but never folded into `refuted` */
        survivorsAfterExact: stillPossible.length,
        survivors: stillPossible.slice(0, 6).map(s => ({ label: s.label, value: s.display })),
        assumption: 'mantissa comparison, conditional on the OEIS published digits; a survivor still needs its offset confirmed before the decimal point is placed'
      }
    };
  }
};
