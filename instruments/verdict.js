/* verdict.js — ONE place for the three words and the one predicate that decides them.

   Before 2026-10-09 the verdict vocabulary was declared instrument by instrument
   (CERTIFIED/REFUTED/REFUSED, HIT/REJECT/REFUSED, PROVED/REFUSED/NOT_CHECKED,
   PROVADO/REFUTADO/RECUSADO, DECIDED/REFUSED …) and the predicate that turns an
   enclosure and a bar into a word was written in every family. Two of those
   copies were wrong in the same way: `families/cosine.js` and `families/newman.js`
   said REJECT whenever the enclosure failed to clear the bar, which includes the
   case where the enclosure STRADDLES the bar and nothing is proved either way;
   and `families/newman.js` compared the candidate's lower end with the champion's
   LOWER end, which does not prove the candidate exceeds the champion. The method
   paper's Proposition 1 is a theorem about three verdicts; the code did not
   implement those three. This module does, once.

   THE THREE WORDS. A claim is a predicate over a box. CERTIFIED: finitely many
   exact or outward-rounded computations show the predicate at every point.
   REFUTED: they show its negation, with the falsifying object. REFUSED:
   otherwise — the enclosure straddles the bar, a budget ran out, the instrument
   declined, or the claim carried a word this module does not know. There is no
   fourth. The register's composed words (PARTIAL, MIXED, REPAIRED, NEEDS DATA,
   QUEUED) are compositions of these three and are listed here so the closed
   vocabulary lives in one file; they are never emitted by a certifier.

   THE ONE PREDICATE. decide(enclosure, bar, relation) decides "value REL bar"
   where value is known only to lie in `enclosure` = [lo, hi] (doubles, outward-
   rounded) and `bar` is a number or itself an enclosure [blo, bhi]:

     'lt'  value <  bar   CERTIFIED iff hi <  blo    REFUTED iff lo >= bhi
     'le'  value <= bar   CERTIFIED iff hi <= blo    REFUTED iff lo >  bhi
     'gt'  value >  bar   CERTIFIED iff lo >  bhi    REFUTED iff hi <= blo
     'ge'  value >= bar   CERTIFIED iff lo >= bhi    REFUTED iff hi <  blo

   and REFUSED otherwise. Each line is the inclusion property read once: every
   point of [lo, hi] satisfies the relation against every point of [blo, bhi],
   or every point violates it. A malformed enclosure (NaN, lo > hi, not a pair of
   numbers) is refused by THROW, never decided: a consumer written as
   `if (!(hi > c)) certified` would otherwise certify on NaN.

   COMPOSITION. compose(verdicts) for a conjunction of checks: REFUTED if any is
   refuted, else REFUSED if any is refused, else CERTIFIED (method paper §2.5).

   MIT licensed. Part of cert-machine. */
'use strict';

const CERTIFIED = 'CERTIFIED';
const REFUTED = 'REFUTED';
const REFUSED = 'REFUSED';
const WORDS = Object.freeze([CERTIFIED, REFUTED, REFUSED]);

/* the register's compositions — read by the ledger builder, emitted by no certifier */
const COMPOSITIONS = Object.freeze(['PARTIAL', 'MIXED', 'REPAIRED', 'NEEDS DATA', 'QUEUED']);

const isVerdict = (w) => WORDS.indexOf(w) >= 0;

function assertVerdict(w, where) {
  if (!isVerdict(w)) throw new Error('verdict: unknown word ' + JSON.stringify(w) + (where ? ' in ' + where : '') + ' — the vocabulary is ' + WORDS.join(' / '));
  return w;
}

/* well-formed: a pair of non-NaN numbers with lo <= hi; infinities are sound bounds */
function wellFormed(e) {
  return Array.isArray(e) && e.length === 2 && typeof e[0] === 'number' && typeof e[1] === 'number'
    && !Number.isNaN(e[0]) && !Number.isNaN(e[1]) && e[0] <= e[1];
}
function asEnclosure(x, what) {
  if (typeof x === 'number') {
    if (Number.isNaN(x)) throw new Error('verdict: ' + what + ' is NaN — refused, not decided');
    return [x, x];
  }
  if (!wellFormed(x)) throw new Error('verdict: ' + what + ' is not a well-formed enclosure (a pair of non-NaN numbers, lo <= hi): ' + JSON.stringify(x) + ' — refused, not decided');
  return x;
}

const RELATIONS = Object.freeze(['lt', 'le', 'gt', 'ge']);

function decide(enclosure, bar, relation) {
  const E = asEnclosure(enclosure, 'enclosure');
  const B = asEnclosure(bar, 'bar');
  const [lo, hi] = E, [blo, bhi] = B;
  let verdict;
  switch (relation) {
    case 'lt': verdict = hi < blo ? CERTIFIED : lo >= bhi ? REFUTED : REFUSED; break;
    case 'le': verdict = hi <= blo ? CERTIFIED : lo > bhi ? REFUTED : REFUSED; break;
    case 'gt': verdict = lo > bhi ? CERTIFIED : hi <= blo ? REFUTED : REFUSED; break;
    case 'ge': verdict = lo >= bhi ? CERTIFIED : hi < blo ? REFUTED : REFUSED; break;
    default: throw new Error('verdict: unknown relation ' + JSON.stringify(relation) + ' — one of ' + RELATIONS.join(' / '));
  }
  const out = { verdict, enclosure: E, bar: B, relation };
  if (verdict === REFUSED) out.why = 'the enclosure [' + lo + ', ' + hi + '] straddles the bar [' + blo + ', ' + bhi + '] under ' + relation + ' — nothing is proved either way';
  return out;
}

/* a conjunction of checks: one REFUTED refutes it, else one REFUSED refuses it, else CERTIFIED */
function compose(verdicts) {
  let refused = false;
  for (const v of verdicts) {
    assertVerdict(v, 'compose');
    if (v === REFUTED) return REFUTED;
    if (v === REFUSED) refused = true;
  }
  return refused ? REFUSED : CERTIFIED;
}

module.exports = { CERTIFIED, REFUTED, REFUSED, WORDS, COMPOSITIONS, RELATIONS, isVerdict, assertVerdict, wellFormed, decide, compose };
