# Pre-registration — Kozma–Nitzan's Conjecture 3 as printed, against the lab's Lean statement (2026-11-13)

Sealed before the lab's statement of the conjecture (any file of `Percolation/Continuity/` or
`Percolation/Literature/KozmaNitzan*` at the pin) is opened by the orchestrator or by the bridge's author, and before
any pod of this item exists. The operator's go of 2026-11-13: both fronts in parallel; this item to a bridge verdict;
pods up to US$10 in all for the session. Every change after the seal is a dated amendment at the end.

## The claim under test

Anthropic's percolation development (anthropics/formal-math at 795efb86f191735c5481675763537cfb4ff37e55, tarball
sha256 10f3e6b9…, Lean v4.32.0, Mathlib 81a5d257; PINS-PERCOLATION.txt) says in its README that its `NearOneGluing`
is Kozma–Nitzan's Conjecture 3 "verbatim" (`nearOneGluing_iff_conjecture3`, by `Iff.rfl`, to
`Percolation.Literature.KozmaNitzan2024_conjecture3`), and proves it (`kozmaNitzan_conjecture3_holds`).

The question, narrowed by the kill review (scout/KILL-KN3-2026-11-13.md, WOUNDED): not "verbatim, yes or no", but
**which readings of the printed sentence the lab's statement is the same as, by proof**, and whether the conjecture
as we wrote it from the paper is proved.

## What is already public, and what stays closed until the results are sealed

A third party's repository (nitromannitol/percolation-after-anthropic) lists a correspondence for the formal
Conjecture 3 among those that are "not literal" (its README lines 130–143; `docs/kn-results.tex`, the section "Lean
Verification"). Neither the orchestrator, nor the statement's author, nor the bridge's author has read that passage,
and none opens it before the RESULTS of K2 are sealed. It is this lane's blind control (K4). The scout that found it
is not used again in this lane.

## Our statement (written first, from the paper alone)

`perc/kn3/Printed.lean`, sha256 161411bd3a703971c05bbbe10554841612bbb97f0f23eaae9988468b1a98def8: Mathlib only,
written by a clean-room author from arXiv:2401.12397v1 (the only version; §4, p. 15), who opened no formalization;
`perc/kn3/READING.md` holds the printed sentence, every choice (A1–A9) and why. It elaborates unchanged at the lab's
pin (exit 0, no warning). One caveat, the author's own: the encoding style was taken from our `perc/Textbook.lean`,
which was written after reading the labs' θ(p_c) statement files (not this conjecture).

The sealed family of readings, all in `Printed.lean` / `Planted.lean` (sha256 70b4f0bd…):

| name | reading | relation proved by us, Mathlib only |
|---|---|---|
| **R0** `Conjecture3` | every FINITE simple graph, every per-edge p : E → [0, 1], δ depending on ε only, strict inequalities, any A, any two vertices | the primary |
| RB `Conjecture3_readingB` | the same over every COUNTABLE graph ("any graph G" taken literally) | RB → R0 |
| N2 `Neighbour2_constantProbability` | finite graphs, ONE common p | R0 → N2 |
| N3 `Neighbour3_properSubset` | A a proper subset | R0 → N3 |
| N4 `Neighbour4_nonemptyA` | A nonempty | R0 ↔ N4 |
| N1 `Neighbour1_Conjecture1` | the paper's Conjecture 1 (stronger, a different sentence) | not a reading of Conjecture 3; a neighbour |

## K1 — the lab's environment (a pod)

The pinned tarball, checked by sha256, built by its own lakefile (`lake exe cache get`, `lake build Percolation`),
log, exit code and seconds recorded. `Printed.lean` is added as one `lean_lib` with the sealed bytes.

## K2 — the comparison, by transport only

One module `KN3/Compare.lean`. For each sealed reading X in {R0, RB, N2, N3, N4} the two implications
`Lab → X` and `X → Lab`, where `Lab := Percolation.Literature.KozmaNitzan2024_conjecture3` (and, once, that
`NearOneGluing` is the same Prop, re-checked by our own `Iff.rfl`).

**Transport only** means: a proof of an implication may use definitions and lemmas about measures, graphs and
connectivity, from Mathlib or from the lab's library, but nothing that rests on the truth of the conjecture. Both
statements are theorems today, so an implication proved from `kozmaNitzan_conjecture3_holds` says nothing about the
STATEMENTS. Mechanically: for each proved implication a dependency walk (our own metaprogram, in the record) lists
every constant it reaches; the list must not contain `kozmaNitzan_conjecture3_holds`, any other proof of `Lab` or of
`NearOneGluing`, nor any theorem whose statement is one of the paper's Conjectures 1–4 or 6. The lists are kept.

Each implication ends as PROVED (transport only) or NOT PROVED in the budget. No third value.

## K3 — the conjecture as printed, proved

`theorem conjecture3_as_printed : KN3Printed.Conjecture3`, in the lab's environment, from anything in its library.
If `Lab → R0` is PROVED in K2 this is one line. If not, it is attempted directly for the budget's remainder and may
end NOT PROVED. When proved: `#print axioms` is exactly [propext, Classical.choice, Quot.sound]; `leanchecker
--fresh` accepts its module; Comparator (lane K's pins, nanoda on) accepts with OUR statement file as the challenge.
The same for RB if `Lab → RB` is proved.

## K4 — the blind control (after the results of K2 and K3 are sealed)

The passage named above is opened and compared with what K2 found. FOUND BLIND: K2's record names the same
divergence. MISSED: the passage names a divergence K2's record does not (then K2 is re-read and the miss is the
finding). NOTHING TO FIND: the passage is about something that is not a divergence between `Lab` and the printed
sentence under any sealed reading. The comparison is a reading and is called one.

## Red controls (each must be refused, or the item is void)

- KR1. The Compare script against `Printed.lean` with `Conjecture3` replaced by each of `Planted3`, `Planted4`,
  `Planted5` (each PROVED false by us, `PlantedCheck.lean`, sha256 849cf561…): must fail to elaborate.
- KR2. The dependency walk run on a deliberately cheating proof (`X → Lab` proved from
  `kozmaNitzan_conjecture3_holds`): the walk must flag it.
- KR3. `grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit"` over every file of ours: nothing.
- KR4. Comparator with our challenge changed to `Planted3`: refused.

## The words

- **CERTIFIED, as printed under reading X**: both implications between `Lab` and X are PROVED by transport, the
  walks are clean, the red controls are refused. If X = R0, the lab's "verbatim" holds for our primary reading. If
  only for another sealed X, the result says exactly that and names what separates X from R0.
- **NOT THE SAME STATEMENT AS ANY SEALED READING (a reading, backed by the implications that were proved)**: for no
  sealed X did both implications close. The record names which implications were proved, and the feature of the
  lab's statement that blocks the others. This is NOT "REFUTED": both statements are true, so no proof separates
  them; what is reported is that no transport was found, and where it stops.
- **REFUSED**: the environment cannot be built, or a red control is not refused.
- K3 is reported apart from K2: PROVED (with its kernels) or NOT PROVED.

## What the result will NOT say

Not that the conjecture is ours or newly proved (the lab proved its statement; Bou-Rabee and two human notes prove
Conjecture 1, which implies it). Not that the paper's authors endorse any formal statement. Not that the lab's
proof is wrong in any outcome. Not anything about Conjecture 1 as printed, continuity of θ, or OpenAI's
development: each is another item.

## Money, machines, people

One pod at a time, the runpod image, 32 vCPU / 128 GB (16 vCPU the floor), its price quoted in the chat before it
is created; deleted with 404 confirmed; this item stops at US$8 so the session stays under the operator's US$10.
The bridge's author is an agent with the sealed files and the pod, who may open the lab's statement only after the
seal and never the third party's repository. The orchestrator replays every claimed check before a word is written.
Private until the operator says reveal.

## Amendments

(none)

### A1 (2026-11-13, after the bridge's author handed back, before the results were sealed)

KR1 as sealed reads: "the Compare script against `Printed.lean` with `Conjecture3` replaced by each of Planted3,
Planted4, Planted5: must fail to elaborate." Run to the letter it IS refused (exit 1, three times), but the build stops
in `KN3/Frag.lean` line 213, inside our own sealed sanity lemmas of `Check.lean`, before it reaches the bridge: to the
letter, the control never tests the bridge. The author added a second form, KR1b: the bridge's own proof script
(`Transport.lean` with the namespace renamed and the word `Conjecture3` replaced by the planted definition's name)
against each planted statement. Both forms are run and both recorded. KR1b was written AFTER the seal and after the
author had seen the statements; it is an addition, not a replacement, and it is named as such wherever it is cited.

### A2 (2026-11-13, the same moment)

KR3 as sealed reads: the forbidden-token grep "over every file of ours: nothing." Over the files that carry proofs
(Transport, Exhaustion, Compare, Proved, Cheat, Printed) it is empty. Over EVERY file of ours it is not: 44 lines, of
which 30 are `#print axioms` commands, 13 are the dependency walk's own source (it must name the tokens it looks
for), and 1 is a line of prose in the sealed `Check.lean`. None is a use of a forbidden construct. The rule's wording
was wrong for its purpose and is not met to the letter; what is reported is the grep over the proof files and the
classified list over the rest.
