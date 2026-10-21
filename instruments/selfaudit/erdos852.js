/* instruments/selfaudit/erdos852.js — the self-audit of cert-machine, Phase 3: the ERDOS852 family (1 register row,
   erdos852-cstar: the C* constant of Erdős #852 published in the problem thread as the bare decimal 0.0752403861777,
   REFUTED by the certified enclosure [0.0752403861783092…, 0.0752403861783095…] of certs/erdos852-certificate.json).

   THE OBJECT is the claimed digit string; the decider decides it against the instrument's enclosure under the two
   readings a bare decimal admits (truncation: [v, v + 10⁻ᵏ); rounding: [v − ½·10⁻ᵏ, v + ½·10⁻ᵏ]) — VERIFIED or
   VERIFIED_ROUNDED when the enclosure sits inside a window (CERTIFIED), REFUTED when it is disjoint from both,
   UNDECIDED otherwise (REFUSED). The original itself is a FALSE claim (the register says REFUTED), so the witness must
   find its violation. The pre-registration's classes, as written:

     FALSE   the published digit string (the original, already REFUTED) · the corrected enclosure's upper end raised by
             one unit: the certificate's 13-decimal truncation of C* moved one unit up (and, the mirror, one unit down)
             — witness: the digits against an enclosure of C* computed independently
     TRUE    the enclosure widened outward: a coarser digit string whose window contains the enclosure (the 13-decimal
             truncation itself, and the 11-decimal one)
     MALFORMED  a non-numeric digit

   THE DECIDER UNDER TEST is instruments/erdos852/constants.js decideClaimedDigits on the enclosure
   instruments/erdos852/constants.js cstar({limit: 30000000, P: 192}) computes — the path tools/export-erdos852-
   certificate.js runs for the row. THE WITNESS is instruments/selfaudit/witness_erdos852.py — standard library: the
   odd-prime product to 4,000,000 in directed-rounding Decimal at 40 digits, the tail bounded by 1 + S + S² with
   S = 1/(2(L−1)²), the claim's union window compared with that enclosure exactly in Fractions. The float check is
   instruments/selfaudit/floatcheck_erdos852.py (the naive double product, the mechanism that produced the published
   value).                                                                                                        MIT */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const E = require(path.join(ROOT, 'instruments', 'erdos852', 'constants.js'));

const RECORD = 'certs/erdos852-certificate.json';
let ENC = null;
const enclosure = () => { if (!ENC) ENC = E.cstar({ limit: 30000000, P: 192 }).enclosure; return ENC; };

function rows(register, J) {
  const c = J(RECORD);
  const r = register.rows.find((x) => x.id === 'erdos852-cstar');
  if (!r) throw new Error('erdos852: no register row erdos852-cstar');
  return [{ rowId: 'erdos852-cstar', record: RECORD, entryId: 'cstar', verdict: r.verdict, entry: { published: c.cstar.published.value, enclosure: c.cstar.enclosure, definition: c.cstar.definition } }];
}
const claimOf = (e) => ({ constant: 'cstar', digits: e.published });
const describe = (e) => 'C* = ' + e.definition + ', published as ' + e.published + '; certified enclosure [' + e.enclosure.lo + ', ' + e.enclosure.hi + ']';

/* the k-decimal truncation of a decimal string, and ± one unit in its last place */
const trunc = (s, k) => { const [i, f] = s.split('.'); return i + '.' + f.slice(0, k).padEnd(k, '0'); };
const shift = (s, units) => { const [i, f] = s.split('.'); const k = f.length; const n = BigInt(i + f) + BigInt(units); const t = n.toString().padStart(k + 1, '0'); return t.slice(0, t.length - k) + '.' + t.slice(t.length - k); };

function mutants(e) {
  const t13lo = trunc(e.enclosure.lo, 13), t13hi = trunc(e.enclosure.hi, 13);
  if (t13lo !== t13hi) throw new Error('erdos852: the enclosure ends do not agree to 13 decimals');
  const out = [];
  out.push({ class: 'truncation-plus-one-unit', truth: 'FALSE', transformation: 'the corrected 13-decimal truncation ' + t13lo + ' raised by one unit in its last place → ' + shift(t13lo, 1), claim: { constant: 'cstar', digits: shift(t13lo, 1) } });
  out.push({ class: 'truncation-minus-one-unit', truth: 'FALSE', transformation: 'the corrected 13-decimal truncation ' + t13lo + ' lowered by one unit in its last place → ' + shift(t13lo, -1), claim: { constant: 'cstar', digits: shift(t13lo, -1) } });
  out.push({ class: 'digits-coarsened-13', truth: 'TRUE', transformation: 'the enclosure widened outward to a 13-decimal window: the digits ' + t13lo + ' (whose truncation window contains the enclosure)', claim: { constant: 'cstar', digits: t13lo } });
  out.push({ class: 'digits-coarsened-11', truth: 'TRUE', transformation: 'the enclosure widened outward to an 11-decimal window: the digits ' + trunc(e.enclosure.lo, 11), claim: { constant: 'cstar', digits: trunc(e.enclosure.lo, 11) } });
  out.push({ class: 'non-numeric-digit', truth: 'MALFORMED', transformation: 'the published digits with the letter O in place of a zero', claim: { constant: 'cstar', digits: e.published.replace(/\.0/, '.O') } });
  return out;
}

function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let verdict, why;
  try {
    const d = E.decideClaimedDigits(enclosure(), claim.digits);
    verdict = d.verdict === 'VERIFIED' || d.verdict === 'VERIFIED_ROUNDED' ? 'CERTIFIED' : d.verdict === 'REFUTED' ? 'REFUTED' : 'REFUSED';
    why = d.verdict + ' (' + d.digits + ' decimals) against the instrument\'s enclosure of C* (cstar at 30,000,000, 192 bits)';
  } catch (e) { verdict = 'REFUSED'; why = 'the instrument threw: ' + (e.message || e); }
  return { verdict, why: String(why).slice(0, 300), ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10 };
}

module.exports = {
  family: 'erdos852',
  records: [RECORD],
  decider: 'instruments/erdos852/constants.js decideClaimedDigits on the enclosure cstar({limit: 30000000, P: 192}) computes (VERIFIED, VERIFIED_ROUNDED → CERTIFIED; REFUTED; UNDECIDED or a throw → REFUSED), the path of tools/export-erdos852-certificate.js',
  witness: 'instruments/selfaudit/witness_erdos852.py',
  floatcheck: 'instruments/selfaudit/floatcheck_erdos852.py',
  redControl: 'truncation-plus-one-unit',
  classes: { FALSE: ['the original (the published digits)', 'truncation-plus-one-unit', 'truncation-minus-one-unit'], TRUE: ['digits-coarsened-13', 'digits-coarsened-11'], MALFORMED: ['non-numeric-digit'] },
  rows, claimOf, mutants, decide, describe
};
