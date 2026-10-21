/* instruments/selfaudit/gnnw.js — the self-audit of cert-machine, Phase 3: the GNNW family, NOT MUTATED in this
   campaign, with the reason recorded per row (the pre-registration: "a family with no admissible class is reported as not
   mutated"; a class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded).

   The certificate is the sextic q and the nodes of M; the decided fact is Theorem 14's slack > 0 on all of (0, 1] in
   intervals. A FALSE class (a coefficient of q moved) has a witness only by enclosing slack(l) at some l — X(l), Y_f(X(l)),
   the logs — which is the verifier's computation; the second implementation (instruments/gnnw/second.js, no shared code)
   could serve as that witness, but it is a concordance partner (Phase 4: the one kit entry with a second implementation),
   not a mutation witness under M1's rule; a TRUE class (a redundant node added to M) is exact but decides nothing new.
   Excluded here, recorded; the row's second implementation is Phase 4's.                                                                                                              MIT */
'use strict';
const RECORDS = ['certs/gnnw-certificate.json'];
const ROWS = [
    [
      "gnnw-gai-3782",
      "a FALSE witness would enclose Theorem 14's slack — the verifier's own computation; the second implementation is Phase 4's concordance partner, not a mutation witness"
    ]
  ];
function rows(register) {
  return ROWS.map(([id, reason]) => {
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('gnnw: no register row ' + id);
    return { rowId: id, record: r.decidedFrom.split(' ')[0], entryId: id, verdict: r.verdict, entry: null, noObject: reason };
  });
}
module.exports = { family: 'gnnw', records: RECORDS, decider: 'tools/verify_gnnw_gai.py (Decimal intervals on GNNW Theorem 14 over (0, 1], the certificate\'s q and m), the path of tools/run-gnnw-ledger.py --check; instruments/gnnw/second.js is its second implementation', witness: null, floatcheck: null, redControl: null, classes: { FALSE: [], TRUE: [], MALFORMED: [] }, rows, claimOf: () => null, mutants: () => [], decide: () => ({ verdict: 'REFUSED', why: 'not mutated', ms: 0 }), describe: () => 'not mutated' };
