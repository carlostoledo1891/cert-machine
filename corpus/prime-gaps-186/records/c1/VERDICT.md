# Prime gaps 186 — C1, the claimant's certificate replayed: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14, before any pod, any build of FLINT, any run). **A replay of the claimant's program
is not an independent decision of anything. It does not prove the axiom, and it does not verify the bound 186.**

## Gaps first

1. The certificate bounds MAJORANTS of the 149 integrals. That each integral is at most its majorant is argued in the
   numerics note and is in no program and not in Lean.
2. Same code, same libraries (FLINT, Arb, NumPy) as the claimant's run. An error in the script or in those libraries
   that does not show at startup would be reproduced, not found. The scout notes that the startup regression tests a
   product the script itself never performs; the script's real exposure to the FLINT defect is inside Arb.
3. Python 3.12.3 here, 3.12.13 in the README. One machine (AMD EPYC 4564P, Linux x86-64).
4. The script's `passed` tests only the final margin. The equality with the printed numbers is OUR comparison.

## Verdict: REPRODUCED

| | question | result |
|---|---|---|
| C1a | the stack | FLINT `v3.6.0` + exactly `7ad753d5` (3 files, +63 −2) built from source in 39 s; python-flint 0.9.0 at `572c8a21` built against it; NumPy 2.2.6. On it the certificate's startup regression PASSES and our three-line witness is correct. On the stock wheel in a second environment on the same machine, both FAIL. The one cited commit is the whole difference. |
| C1b | the run | the pinned script (sha256 `7f71bdef…`), unmodified, `--workers 4`: exit 0, 1 h 04 min 56 s, status `PASS_FRESH_NUMERICAL_CERTIFICATE`, `passed: true`; 97 components, 149 forms; margin 69162467338708766984467/2960664736250000000000000000 ≈ 2.336·10⁻⁵ > 1/50000. Receipt sha256 `5fc6b6c0837ce9c6ea9fe8f1c4d9debe987cbc81edc6f32f4ac774b62de56ad4`. |
| C1c | the comparison (ours, written before any receipt) | **152 of 152 integers equal** to `Challenge.lean`: the three caps and the 149 row bounds. The 149 other integers of the six tables (the 52 Young parameters and the 97 budgets) are equal too. The total is 696,075,110 units. |

Cross-check with C2 (`crosscheck-c2.txt`): the receipt's own enclosures of I_H, J0, J+, Jtail and J_λ each CONTAIN the
clean-room enclosure of the same quantity, which sits at their centre to within 10⁻⁹ … 10⁻⁷ of their width's scale
(I_H: −1.54·10⁻⁹ / +1.54·10⁻⁹). Two computations that share no code and no library agree.

## Predictions, graded

The stack passes (90%) — yes. The run finishes inside the budget (65%) — yes, in 65 minutes of wall time on 16 vCPU: 4.7 CPU-hours (16,871 s of user time) and a
33.9 GB peak over all processes. The scout's "15–150 CPU-hours" and my planning for up to 20 hours were too high. `passed: true` (90%) — yes. All 152 equal (60%) — yes; the feared wobble from floating summation
order did not appear on this CPU.

## Deviations

1. The pod's self-removal guard: armed, never needed; the pod's own key answered "Unauthorized" to a read, so it is not
   shown that it could have acted. Recorded as the pre-registration asked ("when the pod can do that itself").
2. The first `guard.sh` start had no pod id (an ssh session does not carry the container's environment); re-armed
   with it two minutes later.
3. The FLINT defect's cause and the upstream fix were found before this run, while drafting a report
   (reveal/flint/); the numerics note cites the fix itself (its reference [5]).

## Files

`runs/` (the build logs, the correction's diff, the two environments, C1a's four outputs, the run's log, time and
memory samples, `fresh.json`), `compare.json`, `crosscheck-c2.txt`; `../../../pg186/c1/` the scripts.
