# VERDICT — Kozma–Nitzan's Conjecture 1 as printed, against a third party's Lean statement (2026-11-13)

Rules: PREREG-KN1.md, sealed as seal 30 (registry eb94af99, committed 13:18:59Z, 35 seconds before the pod existed)
before any statement of the third party was opened; amendment A1 (the closed list widened before any closed file was
opened). Everything below is the ORCHESTRATOR'S replay (results/kn1/k0-replay, 178 files; results/kn1/replay, 208
files; both hash-checked on the desk), in fresh copies of the pristine builds, from the sealed statement bytes and
the sources as the author brought them home (29 inputs by sha256, identical to the author's copy on the pod). The
author's own run is results/kn1/k0 (398 files) and results/kn1/bridge (338 files). The blind control K4 had NOT
been opened when this was written.

## What was compared

Ours, sealed first: `KN1Printed.Conjecture1` (R0), written from arXiv:2401.12397v1 page 3 by a clean-room author
without a compiler. For every finite simple graph, every p : E(G) → [0, 1], every set A of vertices, every o, b and
every real m: if m is the least element of {P(a ↔ b) : a ∈ A} then P(o ↔ b) ≥ P(o ↔ A) · m.

Theirs, nitromannitol/percolation-after-anthropic at a5cc72bd (tarball sha256 7bb1df4c…), Lean v4.32.0, on the
lab's development at 795efb86. The three targets fixed in the seal turned out to be ONE sentence written three
times (`Targets.lean`: three `rfl`, and a syntactic check):

    ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
      (prodBernoulli w).real (⋃ a ∈ A, openConn o a) * A.inf' hA (fun a => (prodBernoulli w).real (openConn a b)) ≤
        (prodBernoulli w).real (openConn o b)

T1 = `KNAll.Conjecture1` (the type of `KNAll.conjecture1_holds`), T3 = the type of
`KN1Corollary.kozmaNitzan_conjecture1` (the same body), T2 = `KN1Statement.MultiplicativeGluing` (the same text over
that file's Mathlib-only copies of the lab's three definitions).

What separates it from R0, none of it a difference of truth value, each bridged by proof: vertices are `Fin n`;
there is NO graph, only a weight on every unordered pair, 0 meaning "no edge"; the weight function also has inert
diagonal entries; the measure lives on sets of pairs; A is a `Finset` with the hypothesis `A.Nonempty` (R0 admits
the empty set, vacuously); the minimum is `Finset.inf'` where R0 has a number m with two hypotheses.

## K0 — our own files, the third party's bytes absent from the pod
All 41 sealed definitions (12 readings, 17 planted variants, 12 neighbours) ELABORATE with the sealed bytes: no
repair, no drop. Mathlib only, 58 theorems, every one within [propext, Classical.choice, Quot.sound], no forbidden
token in the proof files: R0 ↔ RE (and RE is the neighbour N1 sealed in seal 26, by `Iff.rfl` against the byte-exact
paste), R0 ↔ RL, R0 → RF; R0 ↔ each of the eight other sealed readings (the optional set); Planted1 … Planted11
each PROVED FALSE on the instance the clean-room author gave; Planted12 (the real-valued `⨅ a ∈ A`, the spelling a
formalizer is most likely to type) PROVED TRUE without percolation. NOT proved: RF → R0 (not attempted); the truth of
Planted 13–15 (they need Harris–FKG). K0 ran 13:23–13:57Z; the third party's tarball reached the pod at 13:58Z.

## K1 — the third party's environment
Tarball matched; the closed files and the tarball removed from the pod before the build (A1); the lab's commit
fetched by sha as their bootstrap does, and the fetched tree is our pinned tarball's (diff empty); `lake exe cache
get` 79 s; the narrow build exit 0, 543 s, 8,914 jobs. `KNAll.conjecture1_holds`,
`KN1Statement.multiplicativeGluing_holds`, `KN1Corollary.kozmaNitzan_conjecture1`: each on
[propext, Classical.choice, Quot.sound].

## K2 — the comparison, by transport only

| target | T → R0 | R0 → T |
|---|---|---|
| **T1** | PROVED, transport only (`KN1Compare.T1_to_R0`) | PROVED, transport only (`KN1Compare.R0_to_T1`) |
| T2 | PROVED, transport only | PROVED, transport only |
| T3 | PROVED, transport only | PROVED, transport only |

Both directions are direct; no sealed reading stands in between. The method is the sibling item's: a Mathlib-only
mirror (`LabForm1`) of their sentence, proved equivalent to R0 with Mathlib alone (`Transport1.lean`, on the
sibling's `Transport.lean`, byte for byte); in their environment three `Iff.rfl` say the mirror is each target.
- Build of our modules in a fresh copy of their tree: exit 0, 70 s. Axioms of the 22 bridge theorems: within the
  three standard ones (two use only propext and Quot.sound).
- Dependency walks (401 s): the six implications, the three `Iff.rfl`, the three type checks and the three
  corollaries through K0's readings are all CLEAN. Each reaches about 29,000 constants; the one theorem of either
  library any of them reaches is `prodBernoulli._proof_1` (the lab's, or the third party's copy), an auxiliary
  proof Lean abstracts from the body of the measure's definition; its own walk is CLEAN. The forbidden list has 44
  names and 22 statements; it was extended by the author by reading and by search, not by reading every theorem of
  the two libraries, and the walk's statement test does not depend on names.

## K3 — the conjecture as printed, proved
`conjecture1_as_printed : KN1Printed.Conjecture1 := KN1Compare.T1_to_R0 KNAll.conjecture1_holds`. Axioms: exactly
[propext, Classical.choice, Quot.sound]. `leanchecker --fresh KN1.Proved`: exit 0 (1,712 s). Comparator (the lab's
script and pins, nanoda on) with OUR statement file as the challenge: "Your solution is okay!" (96 s).

## Red controls
- KR0: eleven planted variants proved false (three were required).
- KR1, the proof scripts against the planted statement: Planted1 … Planted11 each REFUSED (the K2 scripts and the
  K3 script both fail to compile); the harness control (the name replaced by itself) compiles. The same scripts
  against Planted12, which is true and not part of KR1, also fail to compile.
- KR2: five cheating proofs FLAGGED by the walk; a walk file that expects a cheat to be CLEAN does not compile.
- KR3: nothing over the 13 proof files; over the other files the matches are `#print axioms` commands, the walk's
  own source and prose, listed.
- KR4: Comparator with the challenge changed to Planted3, Planted1, Planted4: refused three times ("Challenge and
  solution theorem statement do not match").
- Restore: the third party's files identical to the pristine tree; their lakefile's bytes unchanged, our entries
  appended.

## The word

**CERTIFIED, as printed** (T1, and apart, T2 and T3): `T1 → R0` and `R0 → T1` are both proved by transport, the
walks are clean, the red controls are refused. **K3: PROVED**, two kernels and `leanchecker --fresh`.

In plain words: the sentence that `KNAll.conjecture1_holds` proves is Kozma–Nitzan's Conjecture 1 as we wrote it
from the printed page, by a proof that does not use the conjecture's truth. It is not the printed sentence letter
for letter (no graph, weights on all pairs of `Fin n`, a nonempty finset A, `inf'`); it is the same statement.

## What this does NOT say
Not "first": the third party's repository holds its own Mathlib-only restatement (T2) since 2026-09-05, and the
search for other checks was a search. Not that the conjecture is ours or newly proved. Not that the paper's authors
endorse any formal statement. Not independence beyond procedure: the third party's Lean was produced with Claude
and ChatGPT, and our statement's author, bridge's author and orchestrator are Claude models; what is independent is
that ours was written from the paper, with theirs unread, and sealed first. The reading of the printed sentence
(READING1.md, choices B1–B18) is ours; another reader may choose otherwise. Nothing about the third party's proof
beyond its axioms and that two kernels accept the theorem built on it.

## Departures and accidents
- A1 (above). Not closed by it: comments inside their Lean files, which the bridge's author read with the
  statements. Those comments name the encoding (`Fin n`, weights on all pairs, weight 0 = absent edge) and the
  nonempty A; the list of differences in K2 is therefore NOT blind with respect to those points (the author's
  RESULTS.md, "SEEN IN THEIR LEAN FILES"). Found by K2 and named in no comment the author read: the inert diagonal
  weights, `Finset.inf'` as the form of the minimum, `Finset` in place of a set, the measure on sets of pairs.
- The desk's session restarted at about 14:40Z, after the author's run had finished on the pod and before its
  hand-back: the author's RESULTS.md was left with three unfilled sections (the walks, the from-scratch check, the
  red run); the facts are in its record's logs, and this verdict rests on the orchestrator's replay, not on that
  file. The pod stood idle from about 14:41Z to 15:24Z (about US$0.90).
- An upload from the desk hung once for 19 minutes (a copy with no keep-alive); stopped and redone.

## Money
Pod 9e6yrzg3cxft6h (32 vCPU / 128 GB, US$1.28/h), 13:19:34Z–16:02:50Z: 2 h 43 min, about US$3.48 by the clock (not
a billing read), of the US$15 this item could spend. Deleted: delete-pod 204, get-pod 404, list-pods empty.

## K4 — the blind control (opened 2026-11-13 ~16:06Z, AFTER the results above were sealed as seal 31, registry 60897e26, committed 16:04:16Z)

Read, from the pinned tarball on the desk (sha256 7bb1df4c…): README.md (sha256 96646598…) lines 100–180;
docs/kn-results.tex (sha256 ce907388…), the statement of its Conjecture 1 (line 211) and the section "Lean
Verification" (line 2242 on); the `fidelity` block of formalization.yaml; VERIFICATION.md and
verification/principal-statements.txt searched for Conjecture 1.

What the passages say. The manuscript: "Three of the correspondences are not literal": `KNAll.genY_all` (a rank in
place of a real-valued order), `KNAll.setSourceFixedMin_holds` (also covers the empty source), and "the formal
Conjecture 3 quantifies over the empty set A as well, and the formal Conjecture 6 also covers the degenerate pair
v = w, whereas the statements above take A nonempty and the two endpoints of e distinct." The README (item 4 of
"Standing assumptions and scope") and the fidelity block repeat these and add Questions 5 and 8. The README's
Guarantees passage that the scout saw (lines 151–158) qualifies Conjectures 2 ("strong form") and 4 ("fixed
minimizer"), not Conjecture 1. **None of the passages names a divergence for Conjecture 1.**

**NOTHING TO FIND**, in the rule's words: the passages name no divergence between T1 and the printed sentence, so
the control could not test recall on this item. It is recorded as that, not as a pass.

What our record holds that those documents do not, for Conjecture 1 (a reading, not a decision):
- The manuscript restates Conjecture 1 with "A a nonempty set of vertices", and the Lean statement carries
  `A.Nonempty`. The printed sentence (arXiv:2401.12397v1, p. 3) says "a set of vertices" and does not print
  "nonempty". Against the printed letter this is an addition, and the documents do not list it among the
  non-literal correspondences (they list the opposite case, Conjecture 3, where the Lean statement admits the empty
  set). Our sealed READING1.md has it as choice B8, and K0 PROVED it immaterial: the primary (empty A admitted,
  vacuous) is equivalent to the nonempty form and to every sealed convention for the minimum of the empty set.
- The encoding: no graph, weights on all pairs of `Fin n`, inert diagonal weights, a `Finset`, `Finset.inf'`. Their
  Lean comments state the first two; no document reads them against the printed "finite graph". K2 bridges all of
  it by proof.
Neither point makes their statement wrong: both are proved to leave the statement the same.
