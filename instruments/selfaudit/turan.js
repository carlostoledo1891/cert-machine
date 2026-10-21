/* instruments/selfaudit/turan.js — the self-audit of cert-machine, Phase 3: the TURAN family, NOT MUTATED in this
   campaign, with the reason recorded per row (the pre-registration: "a family with no admissible class is reported as not
   mutated"; a class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded).

   The two rows are PARTIAL: the register decides four exact facts and one limiting inequality |Y| < C·D of the claimant's
   note, whose series I_A, K, D, A1, A2 are summed with the note's tail bounds; the asymptotic reduction is the note's prose.
   A FALSE class (C lowered under what the limiting inequality allows; a parameter moved past |1 − α| < C) would need a
   witness that re-sums those series with tail bounds — a second implementation of the decider's whole computation, not a
   witness of a violated condition — and there is no object (a point set, a certificate) beneath the parameters to perturb
   exactly. No admissible class: excluded, recorded.                                                                                                              MIT */
'use strict';
const RECORDS = ['certs/turan-ledger.json'];
const ROWS = [
    [
      "optconst-42a",
      "a handful of real parameters whose decided conditions are the note's series inequalities; a FALSE witness would re-sum the series with tail bounds (a second implementation, not a witness); no admissible class"
    ],
    [
      "optconst-42a-pr184",
      "the same, for the open pull request's profile"
    ]
  ];
function rows(register) {
  return ROWS.map(([id, reason]) => {
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('turan: no register row ' + id);
    return { rowId: id, record: r.decidedFrom.split(' ')[0], entryId: id, verdict: r.verdict, entry: null, noObject: reason };
  });
}
module.exports = { family: 'turan', records: RECORDS, decider: 'instruments/turan/c42.py decide / decide_profile (Decimal intervals at 60 digits on the note\'s four exact facts and the limiting inequality), the path of tools/run-turan-ledger.py', witness: null, floatcheck: null, redControl: null, classes: { FALSE: [], TRUE: [], MALFORMED: [] }, rows, claimOf: () => null, mutants: () => [], decide: () => ({ verdict: 'REFUSED', why: 'not mutated', ms: 0 }), describe: () => 'not mutated' };
