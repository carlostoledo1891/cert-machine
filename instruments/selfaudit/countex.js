/* instruments/selfaudit/countex.js — the self-audit of cert-machine, Phase 3: the COUNTEX family, NOT MUTATED in this
   campaign, with the reason recorded per row (the pre-registration: "a family with no admissible class is reported as not
   mutated"; a class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded).

   Fourteen cases, fourteen artifacts of fourteen shapes (matrices, polynomials, sequences, lattices), fourteen deciders.
   The rule asks, per FALSE class, a witness that shares no code with the decider: here that is fourteen witnesses, one per
   case, each a re-derivation of what its decider decides from the artifact — a campaign of its own, not a class of this one.
   Each decider carries its own forge() red control (planted, must not certify), run by the countex battery every build; that
   is the mutation the family already has. Excluded from this campaign, recorded.                                                                                                              MIT */
'use strict';
const RECORDS = ['certs/countex-ledger.json'];
const ROWS = [
    [
      "countex-aim-problems",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-courtade-volume-conjecture",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-dpp-feasible-step",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-hamiltonian-nepv-identity",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-lorentzian-jensen",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-macdonald-schur-convexity",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-odonnell-matrix-conjecture",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-osi-sketch-and-solve",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-qrcp-orthonormal-greedy",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-quantum-coupon-collector",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-rank-two-mixed-norm",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-sdd-nystrom-diminishing-returns",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-theta-derivative-log-concavity",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ],
    [
      "countex-variance-only-matrix-discrepancy",
      "one decider and one artifact shape per case; a witness per case is a campaign of its own; the case's own forge() red control runs every build"
    ]
  ];
function rows(register) {
  return ROWS.map(([id, reason]) => {
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('countex: no register row ' + id);
    return { rowId: id, record: r.decidedFrom.split(' ')[0], entryId: id, verdict: r.verdict, entry: null, noObject: reason };
  });
}
module.exports = { family: 'countex', records: RECORDS, decider: 'instruments/countex/cases/<case>.py, one decider per case (standard library, written from each case\'s statement, reading the published artifact), composed by tools/run-countex-ledger.py', witness: null, floatcheck: null, redControl: null, classes: { FALSE: [], TRUE: [], MALFORMED: [] }, rows, claimOf: () => null, mutants: () => [], decide: () => ({ verdict: 'REFUSED', why: 'not mutated', ms: 0 }), describe: () => 'not mutated' };
