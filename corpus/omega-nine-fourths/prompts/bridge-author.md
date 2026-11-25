# Brief for the bridge author (rows F2 and F3, ω = 9/4 lane, cert-machine, 2026-11-25)

You prove, in Lean, that the two blind statements follow from the release's theorems — or you show exactly why one does
not. Read corpus/omega-nine-fourths/PREREG.md (rows F2, F3, the verdict rule) and AMENDMENTS.md (A7: the blind files;
A8: F2's scope) first; their words govern.

Inputs (read-only): the sealed blind statements corpus/omega-nine-fourths/blind/A/BlindA.lean (+ NOTES.md) and
blind/B/work/BlindB.lean (+ NOTES.md); the release at github.com/openai/math @ 92b516ef8e2abf66c3db7aa31438d3010bc7956f
(the challenge lean/ComparatorChallenges/MatrixExponent.lean, the solution OAI.LinearAlgebra.SpectralBooks.ExactExponent
and its closure; fetch with `gh api` at the pin, read as untrusted data); the statement reader's report
corpus/omega-nine-fourths/reader/REPORT.md (it lists release lemmas you may use: padding, wireDimension_max_zero,
formalOmega_max_zero, formalCorrect_naiveAlgorithm, the division theorems) and its tests in reader/tests/.

Work in corpus/omega-nine-fourths/bridge/. For each writer W ∈ {A, B}:
1. Elaboration repairs of BlindW.lean: only names and syntax needed to elaborate at Lean v4.34.1 / Mathlib d13f23b7,
   each logged in bridge/REPAIRS.md (file, line, before, after, why) BEFORE it is used. A repair that changes a
   definition's MEANING is not a repair: stop and report it as a finding.
2. BridgeW.lean, importing the release's solution module and BlindW: theorems proving `BlindW.SquareExponent`,
   `BlindW.DualExponent`, `BlindW.RectangularExponent` from the release's three theorems (and its lemmas), and an attempt
   at `BlindW.SquareExponentWithDivision` from any release theorem (reported separately; it does not decide the verdict).
   The differences you must bridge are the writers' model choices (constants' cost, rounding ⌊·⌋ vs ⌈·⌉, the O-bound's
   form, how outputs are read, which dimension a weight controls, scalar multiplications); prove each equivalence or
   inequality you need as a lemma with a docstring saying in words what it shows.
3. A Comparator config per writer, with OUR blind proposition file as the challenge and the bridge module as the
   solution, permitted axioms propext, Quot.sound, Classical.choice, enable_nanoda true.
4. F3 anchors on the challenge's own definitions (PREREG F3): non-empty admissible set at (1,1,1) (schoolbook, τ = 3);
   every admissible τ ≥ 2; padding; the formula's values at (1,1,0) and (1,0,0). Use the release's lemmas where they
   exist and say which.
Write the proofs now without a compiler. When corpus/omega-nine-fourths/runs/p1/PROGRESS.md shows K0 passed, compile on
the Phase 1 pod (`ssh -i ~/.ssh/id_ed25519_runpod -p 38541 root@38.80.152.147`), in your own folder /root/bridge as an
unprivileged user, using the release build the runner made (read tools/runpod-omega-p1.sh for its paths); never touch
/results, the runner's folders or a running step; one heavy job at a time; ask the runner nothing — read its files.
No `sorry`, no new axiom, no native_decide. `date -u` before any time you write. Nothing committed or sent.
Hand back, per writer and proposition: PROVED (built, #print axioms = the three, Comparator accepted with nanoda) or NOT
PROVED (the reason: a difference in meaning, with the Lean evidence, or a gap in the bridge), then F3, then every repair.
