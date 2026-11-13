# Pre-registration — θ is continuous on [0, 1], in Lean, on top of the lab's library (2026-11-13)

Sealed before a line of the proof is written. The operator's word of 2026-11-13: "start with Conjecture 3 verdict,
then continuity … in parallel with the current tasks"; pods without the charger; the session's pod money stays under
US$10. Scout: scout/CONTINUITY-SCOUT-2026-11-13.md (GO; every "exists" in it is a reading with path and line, nothing
was built). Every change after the seal is a dated amendment at the end.

## What this is, and is not

PROVING, not certifying: a step beside the one description, taken knowingly. The mathematics is classical (right
continuity from finite boxes; van den Berg and Keane 1984 for left continuity above p_c; Grimmett, *Percolation*, §8.3)
and the heavy ingredients are the LAB'S: uniqueness of the infinite cluster for every d and every p
(`Grimmett1999_numInfiniteClusters_le_one_holds`), the uniform-label coupling behind `theta_mono_holds`, θ as a limit
of finite-box probabilities, and θ(p_c) = 0 itself. Anthropic's README lists "continuity of θ as a function on
[0, 1] as a formal statement" as NOT CLAIMED. Ours would be the statement and the 300–600 lines that join their
pieces (the scout's estimate).

## The statement (ours, written first)

`perc/cont/Continuity.lean`, sha256 d012845f1f04304e82a9de0059d2373ed144460b4a5171061dc6a2009cff8243: a fragment of
the sealed `perc/Textbook.lean` (sha256 4dc732f5…), using only its definitions; it elaborates at the lab's Mathlib pin
(exit 0).

- **`ContinuityStatement`**: `∀ d, 2 ≤ d → Continuous (θ d)`, with `θ d : unitInterval → ℝ`.
- Stages, each a result if the whole does not close: `RightContinuity` (every d), `LeftContinuityAbovePc` (every d),
  `ContinuityIffCritical` (d ≥ 1).
- Planted false variants: `Planted_dimOne` (`1 ≤ d`), `Planted_constant` (θ constant).

## What passes

- **C1.** In a working copy of the lab's built tree (pin 795efb86, the pod's `/root/k1` build, exit 0), with the sealed
  `Textbook.lean` and `Continuity.lean` bytes: `theorem theta_continuous : TextbookPercolation.ContinuityStatement`
  builds with no `sorry`. Any lemma of the lab's library and of our bridge A (`perc/bridgeA/Bridge.lean`, as sealed
  on 2026-11-12) may be used.
- **C2.** `#print axioms theta_continuous` is exactly [propext, Classical.choice, Quot.sound]. (The lab's own axiom
  listing does not cover its uniqueness files: this is where that is found out.)
- **C3.** `leanchecker --fresh` accepts its module; Comparator (the lab's own script and pins, nanoda on) accepts with
  OUR statement file as the challenge.
- **C4, red controls.** `¬ Planted_dimOne` and `¬ Planted_constant` are PROVED (Mathlib and our earlier anchors only);
  the proof script of `theta_continuous`, pointed at each planted statement, fails to elaborate; Comparator with the
  challenge changed to `Planted_dimOne` refuses; the forbidden-token grep over the proof files is empty.
- **C5.** The orchestrator replays C1–C4 in a fresh copy before a word is written.

## The words

- **PROVED**: C1–C5 pass. Said as: "θ is continuous on [0, 1] for every d ≥ 2, in Lean, on top of Anthropic's
  library", never "first" (the prior-art search was partial) and never without naming whose the ingredients are.
- **PROVED IN PART**: the stages that closed, each named with exactly what it does and does not claim; the stage
  that did not close, and where it stops.
- **WOUNDED**: an axiom beyond the three appears under `theta_continuous`; it is named and traced.
- **REFUSED**: the environment or a red control fails.

## Money, machines, stop

The pod of the Conjecture 3 item is kept (the library is already built on it) at US$1.28/h; a second pod only next
session. Stop and import when the session's pod money reaches US$8, or the desk's battery reaches 20%, whichever
comes first; what is unfinished then is recorded as unfinished. The author is an agent with the sealed files, who
drafts on the desk and compiles on the pod; no third party's repository is opened (the Conjecture 3 blind control is
still closed). Private until the operator says reveal.

## Amendments

(none)
