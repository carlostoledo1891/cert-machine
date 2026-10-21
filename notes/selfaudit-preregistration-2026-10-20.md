# Benchmarking cert-machine — pre-registration, 2026-10-20

> **Amendment 2026-10-21 (the name only; no definition moved).** On the operator's "decide \"bench\"" this session named
> it **selfaudit** — the self-audit of cert-machine: the instrument measured by its own rules, same author, which is
> what the measurement is and what it is not (an outside rerun). One spelling everywhere: `selfaudit` in folders,
> files, ids and records; "the self-audit" in prose. This file was renamed from bench-preregistration-2026-10-20.md
> (git mv, history kept); every "bench" placeholder below is replaced by the name.


Written before any run, on the operator's word "start" (2026-10-20 night), after "Hold any change on the paper
and other fronts. I do not know yet if they are really valuable. Let's focus on benchmark cert-machine." Nothing
in this note is a result. Every count below is read from a record on disk at commit e2cab5b4 and is a pin, not a
finding. The name is selfaudit (the amendment above).

## The question

On a frozen set of decided claims, under declared resource limits: how sound, how concordant, how covered, how
costly and how reproducible is this instrument's decision procedure — and how does a conventional float check fare
on the same false claims?

This is a SELF-MEASUREMENT. It is not a comparison of verification systems. The 2026-10-20 scouting (targets row
`bench-cert-machine-2026-10` (id kept; the name is selfaudit)) found no public system that audits external published claims with exact certificates,
published refusals and a build-gated ledger, so the only comparators are this repository's own second
implementations, the Lean kernel on the formal rows, and a conventional float checker written for the purpose.

## The cases, fixed now

- The 132 rows of `certs/claims-ledger.json` (sha256 270094aa3c9218fa…, meta 2026-10-06 @ a310e6e), derived from
  25 records. By verdict: CERTIFIED 107, PARTIAL 9, REPAIRED 6, MIXED 5, REFUTED 2, NEEDS DATA 2, QUEUED 1. By
  origin: 132 self-initiated.
- The rerun kit, `corpus/rerun-kit.json` (8d276e9c3ec889d7…): 25 entries, one per record; 23 name a one-command
  re-derivation, 7 a standard-library verifier (erdos852, strassen, sumdiff, gnnw, the three mc100 tensor pools),
  1 a second implementation (gnnw). Its last run, `certs/rerun-kit-run.json` (2119a24b35429031…, 2026-10-02 @
  916d077, when the register had 88 rows), timed 18 records; 5 took more than 60 s (hseva 379 s, gnnw 320 s,
  ledger.json 302 s, horizon 116 s, polymaps 84 s); 7 kit entries have never been timed (ai-claims-summary,
  navier-stokes/audit, the five mc100 records).
- The selection rule is the register's own: a row exists only when a record decided it. No row is added or removed
  for the benchmark.
- OUT of v0, by rule: the 54 undecided rows of `corpus/machine-claims-100.json` (deciding them is another front);
  the replays that are not register rows — C_1a–C_1d, C_82, C_86 (HANDOFF's register gap; they enter when that
  register change is made on the operator's word); the readings.
- CARRIED IN for M4 only: the 416 kernel challenges of `certs/openai-math-kernel.json` (3e41d20228fb965d…; 398
  CERTIFIED, 18 REFUSED for resources; per challenge: seconds, cache seconds, peak RSS, two kernels), with their
  machine stated (GitHub-hosted ubuntu-24.04 runners), never merged into a laptop table, never re-run.

## The measurements — definitions fixed before counting

**M1 Soundness under mutation.** A mutant is a case derived from a register row's pinned input by ONE named
transformation from the class table below. Its truth is fixed by construction:
- FALSE requires a WITNESS — a violated condition computed and printed by a witness script that shares no code with
  the decider under test (standard library, exact rationals). A FALSE-class mutant for which the witness script finds
  no violated condition is DISCARDED and the discard counted; it is never relabelled TRUE.
- TRUE requires an INVARIANCE stated in the class (a permutation, a negation, a translation the problem admits).
- MALFORMED is a shape the input's schema forbids.
The decider under test is the row's own re-derive path with the mutant's bytes in place of the pinned bytes.
Required words: FALSE → REFUTED; TRUE → CERTIFIED; MALFORMED → REFUSED. A REFUSED on a FALSE or TRUE mutant is a
refusal with its reason, not an error. Counted per family and in total: false certifications (CERTIFIED on FALSE),
false refutations (REFUTED on TRUE), refusals, discards. A false certification is a defect: fixed, the fix recorded
beside the mutant, the mutant kept, the count reported — never deleted.
Today's baseline: 23 planted claims in two families (`certs/method-eval.json` 6235d574fdc579a4…: kissing 14 on
E8/D4, entropy 9; 11 FALSE, 7 TRUE, 5 MALFORMED; all decided as required) and the 24 δ₃ mutants (23 caught, 1
equivalent; outside the register, not re-run).

**M2 Concordance.** For every row whose kit entry names a second implementation, or whose record was decided by two
programs: the same word; the same witness (first violating index or pair) where one exists; enclosures that overlap,
each printed outward. Counted: rows with two implementations; rows where both agree on every field; every
disagreement listed one by one. Today: 1 kit entry (gnnw); the kernel rows are decided by two kernels.

**M3 Coverage and refusal.** Counted from the kit and the register, nothing run: rows whose record re-derives with
one command; rows with a standard-library verifier; rows with a second implementation; every refusal by the
register's kinds (data-not-public 2, the QUEUED row, …) with what would convert it, as the grammar requires.

**M4 Cost and reproducibility.** Per record, and per row where the record carries per-row timing (kissing ms, easota
ms, countex seconds, the mc100 pools ms): wall seconds, user+sys CPU seconds, peak resident set in bytes
(`/usr/bin/time -l`), the record's bytes, exit status, the word, the record's sha256 after the run. Two runs per
record; the second is "warm". Reproducible = the sha256 after both runs equals the pin, or differs only in fields the
record declares as stamps (generated, seconds, git) — the rerun kit's rowsMoved rule. Cold and warm are reported
separately, never averaged.

**M5 The conventional check on the mutants.** A float checker written for the benchmark (double precision, no exact
arithmetic, a tolerance τ) run on every original and every mutant of the families where a float check is meaningful
(tensor decompositions, kissing, shapes, entropy bars, erdos852): the accept rate on FALSE mutants at τ = 1e-6,
1e-9, 1e-12. This generalises `certs/method-eval.json`'s tolerance-grader row (0.8955 absolute, 0.9035 relative, 0
enclosure, on 4,000 numerical canaries) from numbers to constructions. It measures a tolerance, not any named grader.

## The profiles

| profile | machine | limit | how |
|---|---|---|---|
| portable | this laptop (Apple M2, Darwin 27.0.0; node and python versions stamped per run) | one re-derive process at a time; wall 60 s ENFORCED by the runner → over the cap is REFUSED: resources and the row is not covered under portable; memory 4 GB MEASURED as peak RSS and reported, not enforced (macOS does not honour ulimit -v) | the 5 records the kit timed over 60 s are expected to be REFUSED here |
| extended | the same laptop | no cap | every record |
| hosted | GitHub ubuntu-24.04 runners | as recorded | the 416 kernel rows, carried in, never re-run |

## Mutation classes per record

A class that cannot be implemented without copying the decider is EXCLUDED and the exclusion recorded. Every FALSE
class has a witness script named here; the script is written in Phase 3 under the rule above.

| record | rows | FALSE (witness) | TRUE (invariance) | MALFORMED |
|---|---|---|---|---|
| strassen-certificate, mc100-alphatensor-q, mc100-alphatensor-f2, mc100-alphaevolve-nb-matmul | 45 | one coefficient +1; one coefficient × (1 + 10⁻⁹) written as the exact decimal it means; one rank-1 term dropped; one term duplicated; an F₂ decomposition asserted over Q (FALSE only when the witness finds a violated entry over Z, else DISCARDED) — witness: the violated entry of the tensor equation, exact over the declared ring | the three factor matrices' columns permuted by one permutation; one term's (u, v) signs flipped together | a factor matrix with a short row |
| kissing-ledger | 11 | a row duplicated; a row doubled; a 30° sum of two contact vectors added; the zero vector added — witness: the violating pair and its exact inner product (the 7 classes of method-eval, applied to the register's own configurations instead of E8/D4) | the configuration negated; the coordinates permuted | rows of different dimension |
| easota-ledger, mc100-einstein-arena | 28 | the printed value moved one unit in its last printed digit past the bytes; one coordinate perturbed by 10⁻¹² (FALSE only with a witness: a violated constraint or a changed exact score, else DISCARDED) — witness: the exact score from the bytes against the printed bar | a rigid motion the problem admits, stated per problem | a coordinate missing |
| erdos852-certificate | 1 | the published digit string (already REFUTED); the corrected enclosure's upper end raised by one unit — witness: digits against the enclosure | the enclosure widened outward | a non-numeric digit |
| polymaps 8, countex 14, sumdiff 3, fei 1, turan 2, horizonmath 3, gnnw 1, sumproduct 1, mc100-station-v2 1 | 34 | classes written per family in Phase 3 under the same rule; a family with no admissible class is reported as not mutated | | |
| NOT MUTATED in v0 — aggregates and readings, no object to mutate: ai-claims-summary 6, navier-stokes/audit 1, ecbench 1, gsm8k 1, horizon 1, hseva 1, design-table 1, ledger.json (ramanujan) 1 | 13 | listed with the reason | | |

Mutable rows: 132 − 13 = 119.

## Kill switches, declared now

- Phase 1 (inventory): none; it is a count.
- Phase 2 (runner): a record whose sha256 differs between the two runs outside its declared stamps is a FINDING and
  is reported; it is not re-run until it matches.
- Phase 3 (mutations): a family whose witness script cannot be written without copying the decider is excluded, not
  faked. If fewer than half of the 119 mutable rows end up with at least one FALSE mutant carrying a witness, M1 is
  published as a partial with the count, and the plan stops there.
- Phase 4 (concordance, the hosted rows): no new pod, no new hosted run.
- Phase 5 (freeze): no edit to the paper, no Zenodo release, no send; the page is built from the template and gated
  like every other page.
- Any false certification found in Phase 3 is fixed and kept on the record; nothing is deleted to make a table green.

## What is claimed, and what is not

- Claimed, where the records hold it: the counts above, per family, on this frozen set, on this machine.
- Not claimed: a ranking of verification systems; independence from the author (every decider and every witness
  script is written here — a mutant's truth is by construction, not by a second author); anything about the
  readings (the 13 unmutated rows, the Navier–Stokes fidelity); that passing M1 shows soundness beyond the classes
  listed.

## Holds (the operator's)

The LLM-judge baseline (a spend); outside reruns (a send); the claim-to-statement track (needs two outside reviewers
who did not build the benchmark); the register gap (a register change); the 54 undecided pre-registered claims
(another front); the name; every change to the paper and to every other front.

## Outputs, names fixed now

| phase | build | output |
|---|---|---|
| 0 | this note; the targets row | `notes/selfaudit-preregistration-2026-10-20.md`, `corpus/targets.json` |
| 1 | the rerun kit's run brought to the 132-row register; the inventory derived from the register and the kit, never typed | `tools/run-selfaudit-inventory.js` → `certs/selfaudit-inventory.json` (+ `--check` in make test) |
| 2 | the runner: one re-derive command per record under `/usr/bin/time -l`, the wall cap, two runs | `tools/run-selfaudit.js`, `certs/selfaudit-run.json` (+ battery) |
| 3 | the mutation generator per family + the witness scripts + the float checker | `instruments/selfaudit/`, `certs/selfaudit-mutations.json` |
| 4 | concordance on every row with two implementations; the kernel rows carried in | `certs/selfaudit-concord.json` |
| 5 | every input pinned by sha256, the records, the page, a git tag, a make test row | `reports/selfaudit.html` (via the template) |

Every record carries the git commit, the machine, and the sha256 of every input it read. About six sessions. No
spend, no send, no paper edit.

## Pins

HEAD e2cab5b4 · certs/claims-ledger.json 270094aa3c9218fa… · corpus/rerun-kit.json 8d276e9c3ec889d7… ·
certs/rerun-kit-run.json 2119a24b35429031… · certs/method-eval.json 6235d574fdc579a4… ·
certs/openai-math-kernel.json 3e41d20228fb965d…
