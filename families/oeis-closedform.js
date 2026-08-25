/* oeis-closedform.js — audit published constants for small closed forms.

   The engine's first family that does not generate its own objects: it reads a
   corpus somebody else published (OEIS decimal expansions) and asks, of each,
   which small closed forms are RULED OUT and which survive.

   THE ENCLOSURE, and the one assumption it rests on. OEIS publishes exact
   decimal digits. If the listed digits are d_1..d_k with the decimal point after
   `offset` of them, the constant V satisfies

       D  <=  V  <  D + 10^(offset-k)

   with D the truncated decimal — a rigorous enclosure CONDITIONAL ON THE
   PUBLISHED DIGITS BEING CORRECT. That assumption is stated in every verdict
   this family emits and is not hidden: a refutation here is "proved, given
   OEIS's digits", which is a weaker and more honest thing than "proved".

   A HIT is the interesting case: a constant whose OEIS name states no closed
   form, for which a small closed form nevertheless survives every digit. That is
   the Ramanujan-Machine move — but with everything else refuted exactly rather
   than merely not matched. */
'use strict';

const path = require('path');
const fs = require('fs');
const { relations } = require('../machine/engine.js');

const CORPUS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'oeis-constants.json'), 'utf8')).entries;

/* digits -> a SOUND double enclosure.

   The first version of this function was WRONG and the calibration caught it:
   it took 25 digits, giving a mathematical width of 1e-24, and expressed that
   in doubles whose spacing near 1.4 is ~2.2e-16. The interval collapsed to a
   single double and then excluded the true value, so the engine REFUTED
   sqrt(2) as a closed form for A002193 (the decimal expansion of sqrt(2)) and
   phi for A001622. A false refutation is the one failure a refutation engine
   must not have.

   Two corrections, both required:
     1. Use at most 17 significant digits, so the decimal width the digits
        justify is not far below what a double can represent.
     2. Pad OUTWARD by 4 ulps, absorbing the two roundings between the digit
        string and the double: the Number() parse and the scaling multiply.

   The result is wider than the digits strictly justify, which is the correct
   direction to be wrong in: it costs refutations, never soundness. */
const IV = require('#instruments/interval/interval.js');
function padOut(lo, hi) {
  let a = lo, b = hi;
  for (let i = 0; i < 4; i++) { a = IV.nextDown(a); b = IV.nextUp(b); }
  return [a, b];
}
function enclosureOf(e) {
  const d = e.digits;
  if (!d.length) return null;
  if (d.some(x => x < 0 || x > 9)) return null;          /* not a digit stream */
  const use = Math.min(d.length, 17);
  let s = '';
  for (let i = 0; i < use; i++) s += d[i];
  const scale = Math.pow(10, e.offset - use);
  const lo = Number(s) * scale;
  if (!isFinite(lo) || lo <= 0) return null;
  return padOut(lo, lo + scale);
}

/* Does the entry's own NAME already give a closed form? Crude on purpose: it
   only has to be conservative in the direction that matters, i.e. it must not
   call something unnamed when the name does name it. */
const NAMES_A_FORM = /=|sqrt|log|exp|Pi\b|pi\b|zeta|Gamma|gamma|\^|\/|root|sum|product|integral|Li_|e\^/i;

/* Entries that are not constants at all: OEIS carries constant and periodic
   SEQUENCES under the same keyword, and their "decimal expansion" is a repeating
   digit, so every one of them trivially matches a rational. The first audit
   returned two such rows as hits (the all-1s sequence as 1/9, the all-3s as 1/3)
   — artifacts of the corpus, not findings, and excluded by name rather than
   quietly dropped. */
const NOT_A_CONSTANT = /all \d's sequence|constant sequence|characteristic function|period \d|simplest sequence|repeat/i;

module.exports = {
  name: 'oeis-closedform',
  statement: 'a published constant whose OEIS name states no closed form, but for which a small closed form survives every published digit while all others are refuted',
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  value: (e) => { const x = enclosureOf(e); return x ? x[0] : NaN; },
  interesting: (e) => {
    if (NOT_A_CONSTANT.test(e.name)) return false;
    const x = enclosureOf(e);
    return !!x && x[1] - x[0] < 1e-6;                    /* enough digits to decide anything */
  },
  key: (e) => e.id,
  certify(e) {
    const encl = enclosureOf(e);
    if (!encl) return { verdict: 'REFUSED', why: 'no usable digit stream' };
    const r = relations(encl, { maxDen: 32 });
    const named = NAMES_A_FORM.test(e.name);
    const survivors = r.candidates;

    /* HIT: the name gives no form, and exactly one small form survives. */
    const hit = !named && survivors.length > 0;
    return {
      verdict: hit ? 'HIT' : 'REJECT',
      enclosure: encl,
      text: hit
        ? e.id + ' (' + e.name.slice(0, 70) + ') matches ' + survivors.map(s => s.label).join(' or ')
          + ' to all ' + Math.min(e.digits.length, 17) + ' published digits; ' + r.refuted + ' other forms refuted'
        : e.id + ': ' + r.refuted + ' of ' + r.tested + ' small closed forms refuted exactly, '
          + survivors.length + ' surviving' + (named ? ' (name already states a form)' : ''),
      extra: {
        id: e.id, name: e.name, nameStatesForm: named,
        digitsUsed: Math.min(e.digits.length, 17),
        tested: r.tested, refuted: r.refuted,
        survivors: survivors.map(s => ({ label: s.label, value: s.value })),
        assumption: 'enclosure is conditional on the OEIS published digits being correct'
      }
    };
  }
};
