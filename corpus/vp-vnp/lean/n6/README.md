# Phase 3 (Remark N.6) — the state at the parking, 2026-11-24T03:15Z

The lane was parked on the operator's word on 2026-11-24 at about 02:57 UTC. This folder holds what phase 3 had
reached. Row N6 is NOT passed: the unconditional theorem `RemarkN6` has not been stated against the release's proof.

## What is here

- `N6Statement.lean` — the statements, written by the control room and sealed before any proof (SEAL-2).
- `N6B/` — GPT-6.2-astra's proof that the determinant has circuits of polynomial size in the release's model:
  `det_has_small_circuits : DetHasSmallCircuits`, with exponent a = 12, by Bird's division-free algorithm. The
  algorithm's correctness is Mathlib's own theorem `BirdDet.det_eq_birdDet` at the release's Mathlib pin; the new part
  is the count of gates (n² inputs, n − 1 layers of at most n²(3n + 6) gates, two more).
- `N6R/` — GPT-6.2-astra's derivations FROM that fact: `remarkN6_of` (determinant circuits and the release's
  `MainTheoremApprox` give `RemarkN6`), `permCharTwo_of` (the control in characteristic 2), and three tests of the
  definition `ApproxByDet` (the determinant itself is approximated at its own size; padding; a determinant of an
  affine matrix is an approximating circuit of polynomial size).
- `N6/Local.lean` — the control room's five lines putting the two together: `remarkN6_of_main : MainTheoremApprox →
  RemarkN6` and `permCharTwo : PermCharTwo`.
- `BUILD.sh`, `n6lean.sh`, `build-2026-11-24.log`, `SHA256SUMS`.

## What was checked, and by what

The control room copied the files to an empty folder and compiled all twelve with Lean v4.33.1 against Mathlib
0df444a3 (the release's pins) on one machine, a Mac: exit 0, no `sorry`, and `#print axioms` gives propext,
Classical.choice and Quot.sound for all six theorems (the log). That is Lean's own kernel, once, on one machine.

## What is NOT done

- `RemarkN6` itself. `remarkN6_of_main` still takes the release's main theorem as a hypothesis. The last step,
  `remarkN6 : RemarkN6 := remarkN6_of_main Solution.mainTheoremApprox`, needs the whole release built (a pod).
- No second checker (nanoda, con-leche), no Comparator run against a challenge file, no second machine, no
  `leanchecker --fresh`: everything phase 2 did for the blind statements is still owed here.
- The reader's tests N-1, N-4 and N-6 of PANEL-LEDGER.md that are not among the theorems above (in characteristic 2
  the permanent is approximated at size m; `ApproxByDet f n → f.totalDegree ≤ n`).
- A second prover (a Claude agent, another route) was stopped at the parking, unfinished; nothing of it is here.
  GPT-6.2-astra's second session was stopped before it wrote its report; its files are here as it left them, and the
  rebuild above is the control room's.
- Deviation D5: the pre-registration named Berkowitz or Mahajan–Vinay; the proof uses Bird's algorithm.
