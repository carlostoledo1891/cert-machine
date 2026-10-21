/* instruments/selfaudit/horizonmath.js — the self-audit of cert-machine, Phase 3: the HORIZONMATH family, NOT MUTATED in this
   campaign, with the reason recorded per row (the pre-registration: "a family with no admissible class is reported as not
   mutated"; a class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded).

   Three rows of three kinds. ramsey-asymptotic is REFUTED with kind checker-wider-than-definition: the certificate passes the
   benchmark's checker and fails the paper's Theorem 14 as written — the decided fact is the gap between two definitions, which
   a mutation of the certificate's numbers does not touch. keich-thin-triangles-128 is CERTIFIED by the exact area of a printed
   construction below the AlphaEvolve baseline; a FALSE class (the baseline lowered under the area; an intercept moved) needs
   the exact area of the construction, which only the decider's own geometry computes — a second implementation, not a
   witness. gpt56-closed-forms is NEEDS DATA: no object. Excluded, recorded.                                                                                                              MIT */
'use strict';
const RECORDS = ['certs/horizonmath-ledger.json'];
const ROWS = [
    [
      "horizonmath-ramsey-asymptotic",
      "the decided fact is a gap between two definitions (the checker's and the theorem's); a mutation of the certificate's numbers does not touch it"
    ],
    [
      "horizonmath-keich-thin-triangles-128",
      "a FALSE witness would compute the exact area of the thin-triangle construction — the decider's own geometry, a second implementation, not a witness"
    ],
    [
      "horizonmath-gpt56-closed-forms",
      "NEEDS DATA: the closed forms are not published; no object"
    ]
  ];
function rows(register) {
  return ROWS.map(([id, reason]) => {
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('horizonmath: no register row ' + id);
    return { rowId: id, record: r.decidedFrom.split(' ')[0], entryId: id, verdict: r.verdict, entry: null, noObject: reason };
  });
}
module.exports = { family: 'horizonmath', records: RECORDS, decider: 'instruments/horizonmath/ramsey_region.py and kakeya_area.py (standard library, written from the problem statements), the path of tools/run-horizonmath-ledger.py', witness: null, floatcheck: null, redControl: null, classes: { FALSE: [], TRUE: [], MALFORMED: [] }, rows, claimOf: () => null, mutants: () => [], decide: () => ({ verdict: 'REFUSED', why: 'not mutated', ms: 0 }), describe: () => 'not mutated' };
