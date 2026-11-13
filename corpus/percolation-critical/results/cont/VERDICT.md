# VERDICT — θ is continuous on [0, 1], in Lean, on top of the lab's library (2026-11-13)

Rules: PREREG-CONT.md, sealed as seal 27 (registry cb1364e1) before a line of the proof was written; no amendment.
Everything below is the ORCHESTRATOR'S replay (C5) on a fresh copy of the pristine K1 build (results/cont/replay;
script perc/cont/replay/pod-creplay.sh): the sealed statement bytes and our earlier files from the desk originals,
the author's three proof files as brought home (same bytes as the author's), the statement wrapper and the
Comparator challenges written by the replay itself.

## The word: PROVED

| statement (ours, sealed) | theorem | |
|---|---|---|
| `ContinuityStatement`: ∀ d ≥ 2, θ d is continuous on [0, 1] | `theta_continuous` | PROVED |
| `RightContinuity` (every d) | `theta_right_continuous` | PROVED |
| `LeftContinuityAbovePc` (every d; van den Berg–Keane) | `theta_left_continuous_above_pc` | PROVED |
| `ContinuityIffCritical` (d ≥ 1): continuous ⇔ θ(p_c) = 0 | `theta_continuous_iff_critical` | PROVED |

- **C1.** `lake build` of our eight modules on the lab's library: exit 0, 49 s, no warning. `Textbook.lean` is the
  sealed bytes (4dc732f5…); `ContStatement.lean` is `import Textbook` plus the sealed `Continuity.lean` bytes
  (d012845f…); `Bridge.lean` is bridge A as sealed on 2026-11-12 (ab8be23f…). The proof file is 340 lines
  (`ContProof.lean`, 629738ef…), with a 29-line Mathlib-only helper.
- **C2.** `#print axioms` of the four theorems and of the two planted refutations: exactly
  [propext, Classical.choice, Quot.sound]. The same three for the lab's uniqueness theorem
  (`Grimmett1999_numInfiniteClusters_le_one_holds`) and its zero–one law, which the lab's own listing does not cover.
- **C3.** `leanchecker --fresh ContProof`: exit 0 (1,778 s). Comparator through the LAB'S OWN script and pins
  (comparator 57567492, lean4export at v4.32.0, nanoda 68d5ca9d, landrun), our statement file as the challenge, all
  four theorems named: both kernels accept, "Your solution is okay!" (246 s).
- **C4.** `¬ Planted_dimOne` and `¬ Planted_constant` PROVED (Mathlib, the statement and our anchors only; nothing of
  the lab imported). The proof pointed at each planted statement, in two forms each: exit 1 four times; the positive
  control exit 0. Comparator with the challenge changed to `Planted_dimOne`: exit 1, "Challenge and solution theorem
  statement do not match: 'theta_continuous'". The forbidden-token grep over the proof files and our statement and
  bridge files: empty.
- The lab's tree differs from the pristine one only by our added files and the appended lakefile entries.

## Whose it is

The mathematics is classical (Grimmett, *Percolation*, §8.3; van den Berg and Keane 1984). The heavy ingredients are
the LAB'S theorems: uniqueness of the infinite cluster for every d and p, the zero–one law, the uniform-label
coupling, θ as a limit of finite-box probabilities and their continuity in p, monotonicity, and θ(p_c) = 0 itself
(used through `BondPercolation.percolation_continuity` and `BondPercolation.bridge`). OURS: the statement, bridge A,
and the joining lemmas (upper semicontinuity; the finite-path argument, an induction on `ReflTransGen`; the measure
step; the glue at and below p_c). The proof was written by an agent (Claude) under the orchestrator's sealed rules,
in two compile attempts; the orchestrator replayed it.

## What this does NOT say

Not "first": the prior-art search was partial (the scout's code search of openai/math ran out; Mathlib, Isabelle AFP,
Coq, formal-conjectures and the lab's own README were read, and none has it). Not new mathematics. Not independent of
the lab: it stands on their library at one pin (795efb86) and on the kernels. Nothing about d = 1 except that the
statement is false there (proved).

## Money
The same pod as the Conjecture 3 item. See POD.txt.
