# Prime gaps 186 — C3, the six H rows, clean-room: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14) with amendment A; the brief pg186/c3/BRIEF-H.md, committed before the author
started. The author: a second clean-room session, given the three spec files and, read-only, the first author's two
programs. **This decides 8 of the 149 row bounds, for the note's MAJORANT, not for the Lean integral. It does not
prove the axiom and does not verify the bound 186.**

## Gaps first

1. **The object** is the ideal value of the note's computational form ((2.17), (2.19), (2.21) with (2.8), (2.16)).
   The links from the Lean integral to it are proved by the author BY HAND (its table: face weights, the single cap,
   prefix marginals, the Vandermonde step, the one-coordinate arrays re-derived, the set-partition identity from C2);
   none is machine-checked and nobody reviewed them. The measurability assumption of C2 stands.
2. **Not replayed by the orchestrator.** The cross-check below against the claimant's intervals stands in its place.
3. Shared machine: the author's listing of the pod's top folder showed the NAMES of the other authors' folders and of
   the replay's files; it reports opening none. It copied one of its own files there with a direct rsync, not the
   helper. The independence rests on its own list of what it read.
4. The author added a routine (`mul_wide`) to the first author's product engine, with a different overflow guard;
   it is covered by the modular re-check of every product and by its brute-force self-test, not by a separate review.

## Verdict: AGREES — 8 of 8

| row | integer | enclosure (table units) | printed | margin |
|---|---|---|---|---|
| O₂ H | root | 631278925.529111… | 631278927 | 1.47 |
| O₂ H | face | 133008003.831036… | 133008010 | 6.17 |
| O₅⸝₂ H | root | 15056954287476.717581… | 15056954296612 | 9135.28 |
| O₅⸝₂ H | face | 2833062482789.095549… | 2833062492447 | 9657.90 |
| I₂ old H | mass | 23946431.957961… | 23946432 | 0.042 |
| I₅⸝₂ old H | mass | 686922192412.960090… | 686922192553 | 140.04 |
| I₂ new H | mass | 18106117.708189… | 18106118 | 0.292 |
| I₅⸝₂ new H | mass | 737132501645.391280… | 737132501820 | 174.61 |

Widths under 10⁻²⁷; the smallest margin (0.042) is decided by an enclosure about 10⁻³⁶ wide. Program `pg186_h.py`
sha256 `214ff9c2…4d83`; Python 3.12 standard library on the shared pod; results `pg186/c3h/work/results.json`.

**Against the claimant's own run (C1), `crosscheck-c1-h.txt`:** all 8 values lie inside the raw interval the
replayed certificate prints for the same form — seven of them at its exact midpoint (position 0.500) — and each
printed integer is the ceiling of that interval's upper end.

## Red control (two-sided, stated in the program before running)

The split moved one cell down: both O₂ integers rise ABOVE the printed ones (+0.28%, +0.29%) — as predicted. One cell
up: both fall below (−0.27%, −0.29%) — as predicted.

## Findings worth keeping

- **Which radial set the table uses.** The note's "intersect the appropriate rows of (1.5)" can be read two ways; the
  author took Lean's set (written down before any run). The other reading gives values 3.6–3.9% BELOW the printed
  ones on three rows — so the printed table corresponds to Lean's set, and the note's sentence is ambiguous there.
- **The O₂ face bound is about twice what exact layering would give** (two complete squares are added, one for a layer
  that is empty on this row). Slack, not an error; the printed number confirms the reading.
- For the three order-two groups the arrays are rational: the Dickman function does not enter at all.
- A variant with the note's own recurrence for the Dickman values (unrounded, enclosed) gives the same 8 words.
