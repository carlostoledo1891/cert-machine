# Round 3 — the direction and the gate (PRIVATE; written 2026-11-24 02:59 UTC, before any round-3 run)

Operator, 2026-11-24 ~02:57 UTC: "Let's focus on 40." His answers in the dialog: start four streams (the solver
benchmark with two Astras; the second P66 stage-1 sweep on the Mac; the R(6) second-program join; a Grok question on
solver design); NO TOP-UP, Mac only (the RH judge keeps the RunPod balance); the R(6) box opens after the join; the
VP ≠ VNP lane is parked.

## The bottleneck, as measured
Astra's pilot 2 (round2/astra/work/pilot2, SPEC.txt frozen before the run): 10 full 40-vertex jobs (3 boards with
c* = 3, 3 with c* = 4, 2 with c* = 5, 2 X4 refinements), 900 CPU-seconds each, one core: 10 of 10 timed out, no
certified exclusion, no witness. No completion time can be inferred. About 4,443 boards remain in the cover.

## The benchmark
The same 10 jobs, by the same SPEC.txt (sha256 of the file recorded below). No job may be swapped or dropped.

## Gate G3 (decides whether anything is rented later; nothing is rented in this round)
PASS when at least 5 of the 10 jobs end with a CERTIFIED verdict, each within 2 CPU-hours summed over all its
workers (cubes included, generation and proof checking included):
  - an exclusion counts only with a certificate checked by a program the solver's author did not use to produce it:
    LRAT replayed by tools-bin/lrat-check AND tools-bin/cake_lpr/cake_lpr on the final CNF (every lazily added clause
    in it, each named by its ten vertices), and, when the job was split, a checked proof that the cubes cover the
    parent; or integer Farkas multipliers re-checked by the control room's own checker;
  - a witness counts only as a 40-vertex graph6 string that the control room's checker accepts (triangle-free, no
    independent 10-set).
AND the 5 include at least one job from each of c* = 3, 4, 5.
FAIL otherwise. A FAIL names the strata with no completion and the last measured progress.
Either way the report gives the per-job table and, on a PASS only, a projected cost range for the 4,443 boards with
its assumptions. A capped, unverified or symmetry-reduced-without-proof result is censored, not finished.

## Budget (the Mac: 8 cores, no fan, shared)
Solver Astra: at most 3 processes at once, 16 core-hours in all, 8 hours of wall time. Screen re-check Astra: 1 process,
2 core-hours. The P66 sweep: at most 3 processes. No pod.

## What is NOT claimed by passing
That the cover is exhaustive (the root-cover lemma is prose); that Chen's floors 97/88 hold; anything about boards
with c* = 2, 6, 7 or the X4 family beyond its two sampled jobs.
f9a9b797daa36d2ad7c38847e9a3f27cb240d7f898a3b2b4af5d1352ce2c19b3  round2/astra/work/pilot2/SPEC.txt
d478b5e699984a73de672677ad77a7198ae93fe3f9cffae9ceec04eef4052098  round2/astra/work/pilot2/frozen.json
