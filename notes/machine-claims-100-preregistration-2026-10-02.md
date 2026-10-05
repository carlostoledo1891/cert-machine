# One hundred machine claims — pre-registration, 2026-10-02

The rerun program's phase 4 (HANDOFF, top). Written and committed BEFORE any of the hundred is decided. The
manifest is `corpus/machine-claims-100.json`, built by `tools/run-machine-claims.js --write` from the pinned
sources and checked at every build (`node tools/run-machine-claims.js`): 100 rows, unique ids, every pin
re-hashed, the declared pool sizes, no verdict field anywhere, and the manifest equal to what the rules rebuild.
The census per pool is in `corpus/targets.json` (`node tools/targets.js machine-claims`).

## Why pre-register

The claims register holds 88 decided rows (63 CERTIFIED, 10 PARTIAL, 5 REPAIRED, 5 MIXED, 2 REFUTED, 2 NEEDS
DATA, 1 queued), accumulated claim by claim as each was chosen. Its defect rate is therefore a fact about what was
chosen. A hundred claims named by rule before any is decided give a defect rate that is a measurement of the
claims, and that number, with its breakdown by the register's closed vocabulary of kinds, is the register paper's
second edition.

## What is in, and the rule that put it there

| pool | rule | rows |
|---|---|---|
| alphatensor-q | the 12 keys of `alphatensor_r.npz` with the smallest n·m·p not already in the register | 12 |
| alphatensor-f2 | the 8 keys of `alphatensor_f2.npz` with the smallest n·m·p not already in the register | 8 |
| alphaevolve-nb-matmul | every decomposition in the results notebook's part A not already decided | 15 |
| alphaevolve-nb-b | every part-B section whose construction is not already decided | 6 |
| einstein-arena | the current best of EVERY problem the platform's API lists, as returned on 2026-10-02 | 29 |
| station-v2 | ten exact constructions from the Station's artifacts, one per folder, three Kakeya sets | 10 |
| funsearch | every construction file the repository publishes | 6 |
| optconst | the three asterisked registry entries a finite certificate could decide (1a, 3a, 84a) | 3 |
| alphaevolve-repo | the first ten of the repository's 19 "world record" problems, in its own numbering | 10 |
| erdos-513 | the one AI-attributed Erdős entry with a number and no object | 1 |

Witness-type only: every row asks whether an exhibited object has the property its claimant printed, decided in
exact arithmetic. Prose proofs, Lean proofs and statement fidelity are not in this corpus (they are K3(a)'s).

The two tensor pools are CAPPED because one checker decides them all and a hundred rows through one checker
would be padding; the EinsteinArena pool is not capped because its 29 problems are 29 different decisions.

## What is pinned

Every row carries the sha256 of the bytes that carry the claim: the two npz archives and the notebook (already in
`corpus/sources`), the 29 EinsteinArena bests (`corpus/einstein-arena`, one gzip, the hash of the JSON), the
Station files (`corpus/station-v2`; the 14.6 MB sign-uncertainty witness by hash and commit URL only), the
FunSearch files (`corpus/funsearch`; the two large admissible sets by hash and commit URL only), the three registry
entries (`corpus/optimization-constants/registry`), the ten AlphaEvolve problem pages (`corpus/alphaevolve-problems`,
with the experiments listing at the pinned commit) and the Erdős #513 page. A source that moves after today does
not move the corpus.

## What is decided, and what is not

Each row gets one of the register's verdicts — CERTIFIED, REFUTED, REFUSED and their compositions PARTIAL, MIXED,
REPAIRED, NEEDS DATA — with the defect kind from the closed vocabulary, through the deciding run's own ledger and
`tools/run-claims-ledger.js`. The claimant's code is never run: a record published only as a program that
produces the object is NEEDS DATA, and the share of such rows is itself a finding about how machine records are
published. A row is never dropped; a row whose bytes cannot be read is NEEDS DATA with the reason.

Three EinsteinArena rows (605 and 842 kissing spheres, the unsolved targets) carry a current best whose platform
score says it is infeasible; deciding that the object is NOT a solution is the expected verdict and counts as a
decision, not a refutation of the platform.

## What is measured

Per pool and overall: the count by verdict; the count by defect kind; the NEEDS DATA share; the time to decide
per row; which deciders existed and which were written for the corpus. The pre-registered comparison: the
corpus's "not whole" share (everything but CERTIFIED and NEEDS DATA) beside the register's 88-row share.

## Order of work (not a promise of dates)

Pools with an existing decider first (the two tensor pools, the notebook's part A, the kissing and easota-shaped
EinsteinArena rows, the Station's Jacobian), then the finite exact checks that need a new instrument (Kakeya sets,
difference bases, cap and admissible sets, the cyclic independent set, Hadamard, sorting network, Shannon capacity,
no-three-in-line, deletion code, snake), then the exact-rational scoring of printed constructions (autocorrelation,
uncertainty, Heilbronn, packings), then the three registry entries, then the AlphaEvolve repository rows.

## Deviations

None yet. Any change to a rule, a cap or a pin after today is written here, dated, with the reason, and the
manifest's check refuses until the rules in the tool and the manifest agree again.

**2026-10-04 — a reading, not a change (found while deciding the tensor pools).** The alphatensor-f2 rule says
"the 8 keys of `alphatensor_f2.npz` with the smallest n·m·p not already in the register". The register holds F2
keys 4,4,4 and 5,5,5 only, so read literally the rule names 2,2,2 and 3,3,3 (n·m·p 8 and 27) among the eight; the
manifest instead skipped them, applying the alphatensor-q exclusion (2,2,2 and 3,3,3 are in the register over Q) by
dimensions, and took 2,4,4 and 3,3,4 in their place. The rows stand as pinned — the manifest is the
pre-registration, and its check refuses any re-choice — and nothing is re-chosen; F2 2,2,2 and 3,3,3 are simply
outside the hundred. The rule's words should have said "whose dimensions are not already in the register".

**2026-10-04 — one row printed only as prose.** `ae-nb-4x4x8-r96`: the notebook prints no factors for <4,4,8>
rank 96, only "This decomposition can be obtained by doubling the rank-48 decomposition of <4,4,4> provided
above." A recipe is not a program, so the row is not NEEDS DATA: the object is rebuilt from the printed rank-48
(one copy per 4-column block of B) and the rebuild is decided like a printed object, the row saying so (the
precedent is the register's `polymaps-gao-f6`, rebuilt from a printed construction).
