# RESULTS — K2 and K3 on the pod (2026-11-13), for the orchestrator's replay

Pod working tree `/root/kn3/percolation` (a copy of the K1 build; K1: exit 0, 521 s). Lean v4.32.0, Mathlib 81a5d257,
the lab at 795efb86. Final from-scratch build of our ten modules: `logs/fresh-final.log`, exit 0, 226 s, 0 warnings.
Nothing below was replayed by anyone but the author; every line names the file where the orchestrator can re-read it.

## K2 — reading × direction

`Lab` = `Percolation.Literature.KozmaNitzan2024_conjecture3`. File:line are in `Compare.lean` (the theorem) and, in
brackets, where the proof is. All proofs are Mathlib-only and about the mirror `KN3Transport.LabForm`;
`Compare.lean:41 lab_iff_labForm : Lab ↔ LabForm := Iff.rfl` is the one step that touches the lab's library.

| reading X | Lab → X | X → Lab | walk |
|---|---|---|---|
| **R0** `Conjecture3` | **PROVED (transport only)** `Compare.lean:46 lab_to_R0` [`Transport.lean:469 conjecture3_of_labForm`] | **PROVED (transport only)** `Compare.lean:49 R0_to_lab` [`Transport.lean:489 labForm_of_conjecture3`] | both CLEAN |
| **RB** `Conjecture3_readingB` | **PROVED (transport only — by an exhaustion, not an encoding change)** `Compare.lean:54 lab_to_RB` [`Exhaustion.lean:184 readingB_of_conjecture3` after `lab_to_R0`] | **PROVED (transport only)** `Compare.lean:57 RB_to_lab` [sealed `Check.lean:207 conjecture3_of_readingB`, then `R0_to_lab`] | both CLEAN |
| **N2** `Neighbour2_constantProbability` | **PROVED (transport only)** `Compare.lean:62 lab_to_N2` [sealed `PlantedCheck.lean:78`, after `lab_to_R0`] | **NOT PROVED — not attempted, not stated.** Stops at: the lab's `w : Sym2 (Fin n) → unitInterval` is one weight per pair; an instance of N2 is, under any relabelling, an instance of Lab whose off-diagonal weights take at most the two values 0 and q. No encoding change produces a weight function with two different nonzero values. | CLEAN / — |
| **N3** `Neighbour3_properSubset` | **PROVED (transport only)** `Compare.lean:67 lab_to_N3` [sealed `PlantedCheck.lean:84`, after `lab_to_R0`] | **PROVED (transport only — with one isolated vertex added)** `Compare.lean:70 N3_to_lab` [`Transport.lean:503 labForm_of_neighbour3`] | both CLEAN |
| **N4** `Neighbour4_nonemptyA` | **PROVED (transport only)** `Compare.lean:75 lab_to_N4` [sealed `PlantedCheck.lean:90`, after `lab_to_R0`] | **PROVED (transport only)** `Compare.lean:78 N4_to_lab` [sealed `PlantedCheck.lean:90` (δ ↦ min δ 1), then `R0_to_lab`] | both CLEAN |

Also `Compare.lean:27 lab_iff_nearOneGluing : NearOneGluing ↔ Lab := Iff.rfl` (ours; the lab's own lemma is not imported),
`Compare.lean:32 prodBernoulli_eq_setLaw` and `Compare.lean:37 openConn_eq_conn` (both `rfl`).

Nine of ten implications PROVED; one NOT PROVED (N2 → Lab), as predicted in STATEMENT-DIFF.md before any proof.

**In the rule's words:** both implications between `Lab` and R0 are proved by transport, the walks are clean, the red
controls are refused: **CERTIFIED, as printed under reading R0** — pending the orchestrator's replay, KR4, leanchecker and
Comparator, which are not mine. The same holds for RB, N3, N4; for RB and N3 one direction is more than an encoding
change (an exhaustion; one isolated vertex), which the rule admits and which is said here so that nobody reads
"the same statement, letter for letter" into it. Not for N2.

What separates the lab's text from R0, none of it by proof: vertices are `Fin n`; there is no graph, only weights on
all pairs with 0 for "no edge"; the weight function also has inert diagonal entries; A is a `Finset`; and "finite"
is built in (reading A1's choice).

## The dependency walks (`logs/walk-final-output.txt`, 5,122 lines; the `Walk.lean` source lists the forbidden names)

| theorem | constants reached | in `Percolation.*` modules | of which theorems | verdict |
|---|---|---|---|---|
| `lab_iff_nearOneGluing` | 28,717 | 7 | 1 | CLEAN |
| `lab_iff_labForm` | 28,720 | 6 | 1 | CLEAN |
| `lab_to_R0` | 29,014 | 6 | 1 | CLEAN |
| `R0_to_lab` | 28,972 | 6 | 1 | CLEAN |
| `lab_to_RB` | 29,073 | 6 | 1 | CLEAN |
| `RB_to_lab` | 28,975 | 6 | 1 | CLEAN |
| `lab_to_N2` | 29,017 | 6 | 1 | CLEAN |
| `lab_to_N3` | 29,017 | 6 | 1 | CLEAN |
| `N3_to_lab` | 28,976 | 6 | 1 | CLEAN |
| `lab_to_N4` | 29,017 | 6 | 1 | CLEAN |
| `N4_to_lab` | 28,975 | 6 | 1 | CLEAN |
| `KN3Cheat.cheat_R0_to_lab` (KR2) | 32,810 | 1,213 | 984 | FLAGGED |
| `KN3Cheat.cheat_N2_to_lab` (KR2) | 32,810 | 1,213 | 984 | FLAGGED |
| `KN3Cheat.cheat_via_additive` (KR2) | 32,809 | 1,211 | 982 | FLAGGED |
| `conjecture3_as_printed` (K3; expected) | 32,920 | 1,213 | 984 | FLAGGED |

The six constants of the lab reached by every K2 implication: the definitions `KozmaNitzan2024_conjecture3`,
`prodBernoulli`, `openConn`, `openGraph`, `BondConfig`, and `prodBernoulli._proof_1`, which is the auxiliary
`IsScalarTower ENNReal ENNReal ENNReal := IsScalarTower.right` that Lean abstracts out of the BODY of the
definition `prodBernoulli` (checked with `#print`); it is the one "theorem" in the count. `lab_iff_nearOneGluing`
adds the definition `NearOneGluing`. **No lemma of the lab is used by any K2 implication.** The walk looks inside
Mathlib's proofs (20,832 theorems reached for `lab_to_R0`; the self-test in `DepWalk.lean` shows it), reaches the
three standard axioms and no other constant presented as an axiom.

Forbidden names (17) and forbidden statements (3, any constant whose TYPE is one of them): see the head of
`Walk.lean`. The lab states none of the paper's Conjectures 1, 2, 4, 6 as a general theorem; the nearest is
`Percolation.Continuity.CovTau.kn_conj1_three` (Conjecture 1 for three relays), which is on the list.

## K3

`Proved.lean:12 conjecture3_as_printed : KN3Printed.Conjecture3` and
`Proved.lean:16 conjecture3_readingB_as_printed : KN3Printed.Conjecture3_readingB`: **PROVED** (built, exit 0), each
one line from `Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds` through K2.
`#print axioms` (`logs/axioms-final.out`, 13 lines, the two K3 theorems and the eleven of K2): every one exactly
`[propext, Classical.choice, Quot.sound]`.
Not done here, the orchestrator's: `leanchecker --fresh`, Comparator, KR4.

## Red controls (`red/summary.txt`; run 2 of `red.sh`, exit 0; run 1 in `red-run1/`, see LOG.md)

| control | what | result |
|---|---|---|
| KR1 (b) plant 3 | the bridge's proof script (Transport.lean, `Conjecture3` ↦ `Planted3_conclusionReversed`) | REFUSED: exit 1, 2 errors, both in the two implications (`Red3.lean:480` and `:498`, "Type mismatch"); nothing before them fails |
| KR1 (b) plant 4 | the same with `Planted4_hypothesisDropped` | REFUSED: exit 1, 3 errors (`Red4.lean:475` `intro` has nothing to introduce; `:498`, `:499`) |
| KR1 (b) plant 5 | the same with `Planted5_existsInsteadOfForall` | REFUSED: exit 1, 2 errors (`Red5.lean:485`, `:500`) |
| KR1 (a) plants 3, 4, 5 | the letter of the rule: the planted BODY swapped into `Printed.lean` in place, `lake build KN3.Compare` | REFUSED: exit 1 each. The planted `Printed.lean` builds; the build then stops at `KN3/Frag.lean:213` — the sealed `conjecture3_of_readingB` of Check.lean — BEFORE it reaches the bridge. So (a) shows the sealed sanity lemmas refuse the plants; (b) is the control that tests the bridge. Diffs: `red/KR1a-R*.diff` (one line each) |
| KR2 | the walk on three cheating proofs (`Cheat.lean`) | FLAGGED, all three, by name and by type; and a walk file that expects the cheat to be CLEAN fails to compile (exit 1, `red/KR2-WalkRed.log`) |
| KR3 | `grep -nE "sorry\|axiom\|native_decide\|implemented_by\|unsafe\|extern\|admit"` | Transport, Exhaustion, Compare, Proved, Cheat, Printed: **no match**. Over the rest (Frag = the sealed Check/Planted/PlantedCheck, Axioms, Walk, DepWalk): 44 matches, all in `red/KR3-other-files.txt`: 30 `#print axioms` commands, 13 lines of the walk's own source (it handles `axiomInfo`), 1 line of prose in the sealed Check.lean's docstring ("all without `sorry`, axioms printed at the end"). **The rule says "nothing": read literally over every file, the grep is not empty.** No match is a use of any of the seven things |
| restore | `Printed.lean` back to the sealed bytes; sha256 of `Printed.lean`, `KN3/*.lean`, `lakefile.toml` identical before and after; rebuild exit 0; the 13 axiom lines unchanged | OK |
| lab's tree | `diff -rq --exclude=.lake` pristine vs working | 3 lines: `KN3/` and `Printed.lean` only in the working tree; `lakefile.toml` differs by the 9 appended lines (`red/lakefile.diff`) |

## Where things are

- Sources: this folder (`Transport.lean`, `Exhaustion.lean`, `Compare.lean`, `Proved.lean`, `Cheat.lean`, `Walk.lean`,
  `Axioms.lean`, `DepWalk.lean`, `red.sh`, `pod-setup.sh`, `pod-build.sh`).
- `pod-record/tree/`: the modules exactly as built on the pod (`Printed.lean` = the sealed bytes; `KN3/Frag.lean` =
  an import header + the sealed Check ++ Planted ++ PlantedCheck; `KN3/Transport.lean`, `KN3/Exhaustion.lean` = an
  import header + the fragment), with their SHA256SUMS and the working `lakefile.toml`.
- `pod-record/logs/`: every build (log, exit, seconds), `walk-final-output.txt`, `axioms-final.out`.
- `pod-record/red/`, `pod-record/red-run1/`: the red controls.
- On the pod, untouched after the last build: `/root/kn3/{percolation,src,logs,red,red-run1,tree}`.
  Replay: `cd /root/kn3/percolation && lake build Printed KN3.Frag KN3.Transport KN3.Exhaustion KN3.Compare KN3.Proved KN3.Cheat KN3.Axioms KN3.DepWalk KN3.Walk`
  (up to date; from scratch 226 s, of which the walks 174 s), then `/root/kn3/src/red.sh` (about 130 s).
