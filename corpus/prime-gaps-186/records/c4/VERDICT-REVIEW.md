# Prime gaps 186 — the review of the hand derivations: the record (2026-11-10)

The brief: pg186/c4/BRIEF-REVIEW.md, committed before the reviewer started. The reviewer: a fresh session, told to be
adversarial, given the Lean file, the note, the paper and the five clean-room programs — never the claimant's
program. **A review by one more session is a second reading, not a proof. Nothing here is formalized.**

## Gaps first

1. **The reviewer is another session of the same model family as the three authors**, under the same orchestrator.
   It re-derived the links itself and ran its own checks (a transcription of the Lean geometry compared on all 61
   low rows; six million random points against the P-row envelopes; Monte Carlo of the Dickman density and of two
   kernels; the Dickman cells against an independent quadrature), but it is not a human referee and not a kernel.
2. **Two links are NOT VERIFIED**: the fixed-point error propagation of the cap program (its §5) and the
   monotone relative-width enclosure of the L-row program. The reviewer read both, found them sound in outline and
   did not re-derive them in full. The programs were not run by it and their records not read.
3. The main paper was not read by the reviewer (whether the axiom suffices for the paper's proposition is outside
   the brief; phase B settled that the Lean proof follows from the axiom).

## The verdict of the review

**No link was found WRONG OR INCOMPLETE in a way that could change a number.** No place was found where a computed
form can be smaller than the Lean integral it bounds, and no "equals" in the caps that is one-sided. Of 33 links:
28 HOLD (re-derived), 3 HOLD WITH A CONDITION that the reviewer then checked and found true (the measurability
assumption; r(q) ≤ q on all 30 P-row bins; the cap condition on the radial window of all 61 L rows, which the L-row
program asserts in its comment and never checks in code), 2 NOT VERIFIED (gap 2).

Findings in its order:

1. **A zero default would make the axiom false, not weaker.** If the fragment law degenerated to Lean's zero
   convention, the 149 row inequalities would read 0 ≤ bound and be harmless, but the two LOWER bounds of the axiom
   (on `trialIH` and `trialJLambdaH`) would be false. The measurability assumption is load-bearing for the cap
   conjuncts, and through them for the consistency of the axiom.
2. The L-row program's cap condition is asserted in a comment and not in code. True on all 61 rows.
3. The delay/renewal choice of the L rows does not affect VALIDITY: both sequences are majorants unconditionally.
   For the two rows that would exceed the printed integer under the renewal branch, the bound rests on the delay
   run alone.
4. The edge conventions all match Lean (left-closed cells, non-strict caps, inclusive thresholds, half-open bins,
   the strict split of the H rows, the windows, the row-to-table mapping).
5. Rigor only: two programs rely on the note for a step that re-derives; one assert is a cell weaker than its
   sentence; the modular re-check of products is a sanity check — exactness rests on `decimal`'s Inexact trap.

## The orchestrator's addition: what the claimant's own Lean already proves (finding 1)

Reading the proof file `PrimeGaps186.lean` (the orchestrator may; the clean-room authors and the reviewer were not
given it), which phase B built and three kernels accept:

- `fragmentLaw_isProbabilityMeasure (ζ : ℝ) : IsProbabilityMeasure (fragmentLaw ζ)` (line 3436), with
  `measurable_weightedEmpirical`, `finitePoissonLaw_isProbabilityMeasure`, `measurable_finiteFragments` before it.
  **The fragment law is not the zero default: that is a theorem of the claimant's Lean.**
- `normalized_fragmentLaw_mass_eq_dickman` (line 45045): e^γ·κ times the law of the total mass has density
  ρ(t/κ) on [0, ∞) — the Dickman identity our authors proved by hand "in sketch" is machine-checked there.
- The combination the margin's author re-derived blind is in the Lean proof too: `ledger / trialIH ≤ 696075110 /
  10^12` (line 195655), ρ* = 2624989/10⁷ and 500103/500000 in the final chain (lines 199654–199770).

Kept honest: these three theorems were READ in the file today, by name and statement; phase B's axiom audit covered
the three main theorems, not these lemmas one by one (they are in the main theorems' dependency closure only if
used; that was not checked per lemma). What they do not cover: the integrability, in Lean's sense, of the specific
integrands of `trialIH`, `trialMarginal` and the 149 forms. For bounded measurable integrands against a finite
measure that is routine, and the Lean proof manipulates these integrals throughout, but nobody here pointed at the
lemma for each.

## What stays open after the review

The chain "Lean integral ≤ the note's form" is now: argued by the note, re-derived by three authors, re-derived
again by a reviewer with numerical spot checks, with its measure-theoretic base (the law, its Dickman density)
machine-checked in the claimant's own Lean. It is still not formalized end to end, and two error-propagation
arguments are not independently re-derived.
