/* instruments/selfaudit/sumproduct.js — the self-audit of cert-machine, Phase 3: the SUMPRODUCT family, NOT MUTATED in this
   campaign, with the reason recorded per row (the pre-registration: "a family with no admissible class is reported as not
   mutated"; a class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded).

   The row is REPAIRED: the printed c = 0.000719 refuted, the note's own c = 0.0007 certified, over a chain of cited results
   (BSSZ2026 §5, a lattice-doubling lemma, a regulator bound). The object is a chain of constants and two sweeps; a FALSE class
   (the printed c raised further) changes nothing the row decides (it is already REPAIRED), and a witness for the sweep's bound
   would be the sweep again. No admissible class: excluded, recorded.                                                                                                              MIT */
'use strict';
const RECORDS = ['certs/sumproduct-ledger.json'];
const ROWS = [
    [
      "optconst-84b",
      "a chain of cited constants and two sweeps, already REPAIRED as printed; a FALSE witness would be the sweep again; no admissible class"
    ]
  ];
function rows(register) {
  return ROWS.map(([id, reason]) => {
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('sumproduct: no register row ' + id);
    return { rowId: id, record: r.decidedFrom.split(' ')[0], entryId: id, verdict: r.verdict, entry: null, noObject: reason };
  });
}
module.exports = { family: 'sumproduct', records: RECORDS, decider: 'instruments/sumproduct/c84b.py decide (Decimal intervals on the note\'s chain: f(s), the factors at Y = 1415, the sweep over s and Y), the path of tools/run-sumproduct-ledger.py', witness: null, floatcheck: null, redControl: null, classes: { FALSE: [], TRUE: [], MALFORMED: [] }, rows, claimOf: () => null, mutants: () => [], decide: () => ({ verdict: 'REFUSED', why: 'not mutated', ms: 0 }), describe: () => 'not mutated' };
