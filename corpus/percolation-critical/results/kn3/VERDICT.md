# VERDICT — Kozma–Nitzan's Conjecture 3 as printed, against the lab's Lean statement (2026-11-13)

Rules: PREREG-KN3.md, sealed as seal 26 (registry 13a09d7f) before the lab's statement was opened; amendments A1, A2
(the two red controls whose sealed wording did not fit, said in full there). Everything below is the ORCHESTRATOR'S
replay on a fresh copy of the pristine K1 build (results/kn3/replay; replay script perc/kn3/replay/pod-replay.sh),
from the sealed statement bytes and the bridge sources as the author brought them home (ten inputs by sha256,
identical to the author's). The blind control K4 had NOT been opened when this was written.

## K1 — the lab's environment
The pinned tarball (sha256 10f3e6b9…) matched; `lake exe cache get` 114 s, `lake build Percolation Solution` exit 0,
521 s, 8,905 jobs; Challenge.lean 5578f9b4…, Solution.lean a915e2df… (the same as in the θ(p_c) check).

## K2 — the comparison, by transport only

`Lab` = `Percolation.Literature.KozmaNitzan2024_conjecture3` (Percolation/Literature/KozmaNitzanReduction.lean:91–96);
`NearOneGluing ↔ Lab` re-checked by our own `Iff.rfl`. The lab's statement has NO graph: for every n, a weight in
[0, 1] on every unordered pair of `Fin n` (the diagonal pairs included, where it changes nothing), weight 0 meaning
"no edge", A a `Finset`, the same quantifier order and the same three strict inequalities as the printed sentence.

The method: `Transport.lean` (Mathlib only) writes a MIRROR of the lab's definitions (`setLaw`, `conn`, `LabForm`)
and proves `LabForm ↔ Conjecture3`; in the lab's environment `Lab ↔ LabForm` is `Iff.rfl`. `Compare.lean` imports two
of the lab's modules (the two that state the conjecture) and nothing on the path of its proof.

| sealed reading | Lab → X | X → Lab |
|---|---|---|
| **R0** `Conjecture3` (finite graphs, per-edge p) | PROVED, transport only | PROVED, transport only |
| RB `Conjecture3_readingB` (countable graphs) | PROVED (an exhaustion over finite subgraphs: more than a re-encoding) | PROVED |
| N2 one common p | PROVED | NOT PROVED (not attempted: one p cannot give two different nonzero weights) |
| N3 A a proper subset | PROVED | PROVED (one isolated vertex added) |
| N4 A nonempty | PROVED | PROVED |

- Build of our modules on the lab's library: exit 0, 63 s. Axioms of all 13 theorems: exactly
  [propext, Classical.choice, Quot.sound].
- Dependency walks (177 s): the 11 comparison theorems CLEAN (each reaches about 29,000 constants; of the lab's, only
  the definitions `KozmaNitzan2024_conjecture3`, `prodBernoulli`, `openConn`, `openGraph`, `BondConfig`,
  `NearOneGluing`, and one auxiliary instance Lean abstracts from the body of `prodBernoulli`; no lemma of the lab).
  The three cheating proofs FLAGGED; `conjecture3_as_printed` FLAGGED, as it must be.

## K3 — the conjecture as printed, proved
`conjecture3_as_printed : KN3Printed.Conjecture3` and `conjecture3_readingB_as_printed` build from the lab's
`kozmaNitzan_conjecture3_holds`. `leanchecker --fresh KN3.Proved`: exit 0 (1,764 s). Comparator (the lab's own
script and pins: comparator 57567492, lean4export at the v4.32.0 release, nanoda 68d5ca9d, landrun) with OUR
statement file as the challenge and both theorems named: "nanoda kernel accepts the solution", "Lean default kernel
accepts the solution", "Your solution is okay!" (196 s).

## Red controls
- KR1 to the letter: refused three times (exit 1), in our own sanity lemmas, before the bridge (A1).
- KR1b (added after the seal, A1): the bridge's proof script against Planted3, 4, 5: refused (exit 1), every error
  inside the two implications.
- KR2: the three cheats FLAGGED; a walk file expecting a cheat to be CLEAN does not compile.
- KR3: empty over the proof files; 44 classified lines over the others (A2); the rule's letter is not met.
- KR4: Comparator with the challenge changed to the planted, proved-false Planted3: exit 1, "Challenge and solution
  theorem statement do not match: 'conjecture3_as_printed'".
- Restore: sha256 of every file identical before and after; `Printed.lean` the sealed bytes; the lab's tree differs
  from the pristine one only by our added files and the appended lakefile entries.

## The word

**CERTIFIED, as printed under reading R0** (and under RB, N3, N4): both implications between the lab's statement and
our hand-written one are proved by transport, the walks are clean, the red controls are refused, with the two
departures from the sealed wording stated in A1 and A2. **K3: PROVED**, two kernels and `leanchecker --fresh`.

In plain words: the lab's "verbatim" holds for the reading in which "any graph G" means any FINITE graph with a
probability on each edge. The lab's sentence is not the printed one letter for letter (it has weights on all pairs of
`Fin n` in place of a graph, and inert diagonal weights); it is the same statement, by a proof that does not use the
conjecture's truth. For the literal "any graph" (countable), equivalence also holds, one direction by a real argument.

## What this does NOT say
Not that the conjecture is ours or newly proved. Not that the paper's authors endorse any formal statement. Nothing
about Conjecture 1. Not "the one-common-p version is the same statement": that direction was not attempted. The
reading of the printed sentence (READING.md, choices A1–A9) is ours; another reader may choose otherwise.

## Money
Pod awmetpkks84h6o (32 vCPU / 128 GB, US$1.28/h), created 02:21Z; K1–K3 and this replay ended 03:55Z: about
94 minutes, about US$2.0 by the clock. The pod is kept for the continuity item (PREREG-CONT.md).

## K4 — the blind control (opened 2026-11-13 ~03:57Z, AFTER the results above were sealed as seal 28, registry 1db4e4be)

Read: nitromannitol/percolation-after-anthropic as the kill scout downloaded it on 2026-11-13 (README.md sha256
96646598…, lines 130–143; docs/kn-results.tex sha256 ce907388…, section "Lean Verification", line 2242 on).
The passage, in the manuscript's words: "Three of the correspondences are not literal. … The formal Conjecture 3
quantifies over the empty set A as well, and the formal Conjecture 6 also covers the degenerate pair v = w, whereas
the statements above take A nonempty and the two endpoints of e distinct."

So the one published "not literal" point about Conjecture 3 is: **the Lean statement allows A = ∅, the manuscript's
own restatement takes A nonempty.**

**FOUND BLIND.** The same point is in our sealed files, written before anyone here had seen the passage:
READING.md, choice A4 ("Empty A. Not excluded in print …"), and the sealed neighbour `Neighbour4_nonemptyA`
(Planted.lean). And K2 DECIDED it: `lab_to_N4` and `N4_to_lab` are both proved by transport (the second with
δ ↦ min δ 1), so with A nonempty or not the statement is the same. Two things the passage does not have and our
record does: a proof that the point is immaterial, and the other places where the lab's sentence departs from the
printed letter (no graph, weights on all pairs of `Fin n`, inert diagonal weights, `Finset` A, "finite").

A caution on what "found blind" means here: under our primary reading R0 the point is not a divergence at all (the
printed sentence does not exclude A = ∅; "nonempty" is the third party's restatement, also MathWorld's and
Gouéré's per the kill review). It is a divergence only against the nonempty reading, which was one of our sealed
neighbours. The comparison of the passage with our record is a reading, not a decision. The third party's
remark and priority on that point are theirs (in the manuscript since 2026-09-05 per the kill review).
