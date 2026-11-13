# Pre-registration — Kozma–Nitzan's Conjecture 1 as printed, against a third party's Lean statement (2026-11-13)

Sealed before any statement of the conjecture in the third party's repository is opened by the orchestrator, by the
statement's author or by the bridge's author, and before any pod of this item exists. The operator's words of
2026-11-13: "Stay private; Conjecture 1 next" (~09:00 UTC), then, asked in the chat at ~12:45 UTC, "Conjecture 1
scout" and a new money line "Up to US$20 now" for this item's pod. Every change after the seal is a dated amendment
at the end.

## The claim under test

`nitromannitol/percolation-after-anthropic` (Ahmed Bou-Rabee; Apache-2.0, read in full) at commit
a5cc72bd7627f313abbb00bcb47616678abbeb35 (2026-11-12T17:51:47Z; tarball sha256
7bb1df4cb7c5572e6279f5bdbc3007ef59ce1ff111c7afb989e393368d89adab, 1,810,415 bytes), Lean v4.32.0, with the lab's
development (anthropics/formal-math 795efb86, tarball sha256 10f3e6b9…, Mathlib 81a5d257; PINS-PERCOLATION.txt) as
its one dependency, declares `KNAll.conjecture1_holds` (KNConjectures/Conjectures.lean, line 211) and audits its
axioms. The repository's account is that this proves Kozma–Nitzan's Conjecture 1 (arXiv:2401.12397v1, page 3).

The question: **is the sentence that theorem proves the printed sentence, by proof**, for a statement of the
printed sentence written by us from the paper alone and sealed here first; and is the conjecture as we wrote it
proved.

## What the scout found, and what it does to the claim we may make

scout/KN1-SCOUT-2026-11-13.md (in the seal). The repository already holds, since its first commit (2026-09-05), a
Mathlib-only statement of its own and a bridge: `KNConjectures/KN1Statement.lean` (44 lines, four definitions, the
last `KN1Statement.MultiplicativeGluing`), `KN1Bridge.lean` (`KN1Statement.multiplicativeGluing_holds`), and
`KozmaNitzanConjecture1.lean` (`KN1Corollary.kozmaNitzan_conjecture1`). So a restatement of Conjecture 1 exists; it
is the same author's. No check by anyone else of a Lean statement of Conjecture 1 against the printed sentence was
found (GitHub, formal-conjectures, Palomar, arXiv, the Lean Zulip's public channels, Kalai's thread).

Independence, as it is: the third party's Lean files say they were produced with Claude Fable 5.1 and ChatGPT; the
repository is recorded as built with the lab's participation. Our statement's author, our bridge's author and the
orchestrator are Claude models. Ours is independent BY PROCEDURE (written from the paper, theirs unread, sealed
first), not by who wrote it. Every text about this item says so.

## The three targets (chosen here, before anyone reads them)

- **T1, the item's target:** the proposition proved by `KNAll.conjecture1_holds` (its type; if the type is a named
  definition applied to nothing, that definition).
- T2: `KN1Statement.MultiplicativeGluing` (their Mathlib-only statement).
- T3: the proposition proved by `KN1Corollary.kozmaNitzan_conjecture1`.

The item's word is decided on T1 alone. T2 and T3 are decided by the same rules and reported apart.

## What stays closed

Until this seal: every file of the third party's `KNConjectures/`, and everything below.
Until the RESULTS are sealed (the blind control, K4), for the orchestrator and both authors: the third party's
README lines 100–179 (the correspondence with the sources, the words "not literal" at line 138, and the
qualifications in its Guarantees section), `docs/` (kn-results.tex and .pdf), `formalization.yaml`, `verification/`,
the kn1-verification web page, arXiv:2611.01490, 2609.03492, 2610.30063, 2610.10502. Mechanically: the orchestrator
removes README.md, docs/, formalization.yaml and verification/ from the pod's working tree before the bridge's
author is given the pod (the tarball's hash is checked first; the tarball itself stays outside the tree).
What leaked, and to whom: the scout read README lines 151–158 (a Guarantees passage the scout's rule allowed) and
reports that it qualifies the audited results "in a word or two", Conjecture 1's among them, and withheld the words;
the scout also saw declaration NAMES in the three KN1 files and withheld six. The orchestrator knows only what this
paragraph says. The scout is not used again in this lane.

## Our statement (written first, from the paper alone)

By a clean-room author (no network; the paper's text and TeX and our five sealed Conjecture 3 files only):

| file | sha256 | what |
|---|---|---|
| perc/kn1/Printed1.lean | f168a013573ae665753ee73ce2adf5192a03bb5bd14b8d4c00b5e75f7df6aacb | 12 definitions, no proof |
| perc/kn1/Planted1.lean | 2ea564dab87cd7dbdac03370a42aad48e49370cc1657951261cf776e9e6a55b1 | 17 planted variants, 12 neighbours, no proof |
| perc/kn1/READING1.md | 913e3ba0975b59903742e3ab1e647f0add8703f28859de62af80e9b11a1ef7f5 | the printed sentence, choices B1–B18 |
| perc/kn1/OBLIGATIONS1.md | c18cd2b830ff37143408da623f40de640b340fbc18763c01c1a5f1d8dc80dab7 | relations to prove, with the instances |

They import the sealed `perc/kn3/Printed.lean` (sha256 161411bd…, seal 26) for the measure and the events.
**None of the four was ever elaborated**: there is no Lean on the desk. This is the item's first risk and K0 is its
answer.

- **R0, the primary: `KN1Printed.Conjecture1`.** Every finite simple graph, every p : E(G) → [0, 1], every set A of
  vertices, every two vertices o, b, every real m: if m is the least element of {P(a ↔ b) : a ∈ A} then
  P(o ↔ b) ≥ P(o ↔ A) · m. Empty A: vacuous.
- The required readings: RE `Conjecture1_existsForm` (word for word the neighbour N1 sealed in seal 26), RL
  `Conjecture1_lowerBound`, RF `Conjecture1_onFin`.
- The other sealed readings (`_minimiser`, `_emptyMinIs c`, `_distinct`, `_properSubset`, `_isLeast`, `_sInf`,
  `_iInf`, `_ennreal`): each ends as PROVED equivalent to R0, or NOT PROVED in the budget, or DID NOT ELABORATE.
  None of them decides the word.

## K0 — our own files, before anything of theirs is on the pod

In the lab's environment built from its pinned tarball (K1 of PREREG-KN3: `lake exe cache get`, `lake build
Percolation`), with the THIRD PARTY'S TARBALL NOT YET ON THE POD:

1. Elaboration. `Printed.lean`, `Printed1.lean`, `Planted1.lean` with the sealed bytes; one line per definition:
   ELABORATES or FAILS (the error kept). If a definition FAILS, the repair is a dated amendment that shows the diff
   and says why the meaning is unchanged, written before step K1; a definition that cannot be repaired without
   changing what it says is dropped and named. If R0 itself needs any repair, the orchestrator reads the diff
   before K1 and the record carries it in its first paragraph.
2. Proofs, Mathlib only (OBLIGATIONS1.md): REQUIRED — R0 ↔ RE, R0 ↔ RL, R0 → RF; RE is the sealed N1 by `Iff.rfl`
   (the sealed fragment pasted into a module); at least THREE of Planted1 … Planted11 proved false; Planted12
   (the real-valued `⨅ a ∈ A`) decided, true or false, by proof. The others of OBLIGATIONS1.md §1–§4: attempted
   for at most 40 minutes in all, each PROVED or NOT PROVED.
3. The K0 files and logs are hashed (SHA256SUMS) and copied to the desk. Only then does the orchestrator put the
   third party's tarball on the pod.

If fewer than three planted variants are proved false, or R0 ↔ RE is not proved, the item is REFUSED at K0 (our
controls or our own readings do not stand) and nothing of theirs is opened.

## K1 — the third party's environment

The tarball, checked by sha256; the lab's commit fetched by sha as their `scripts/bootstrap.sh` does (the commit is
on no branch; a failure to fetch is answered from our pinned tarball of the same tree, and said); `lake exe cache
get`; `lake build KNConjectures.Conjectures KNConjectures.KN1Statement KNConjectures.KN1Bridge
KNConjectures.KozmaNitzanConjecture1`. Log, exit code and seconds of each step; `#print axioms` of the three
theorems. Then the closed files are removed from the working tree (above).

## K2 — the comparison, by transport only

For each target T in {T1, T2, T3}: `T → R0` and `R0 → T`, directly or through a sealed reading whose equivalence
with R0 was PROVED in K0. If a target is plainly another sealed statement (a planted variant or a neighbour of
Planted1.lean), both implications with THAT statement are attempted instead, and that is the finding.

**Transport only**: a proof of an implication may use definitions and lemmas about measures, graphs and
connectivity from Mathlib or from either library, and nothing that rests on the truth of any of the paper's
conjectures. Mechanically, for each proved implication a dependency walk (the metaprogram of perc/kn3/bridge,
reused) lists every constant reached outside Mathlib and our own files, with its kind. The list must not contain:
`KNAll.conjecture1_holds`, `KNAll.conjecture3_holds`, any other `KNAll.*_holds`,
`KN1Statement.multiplicativeGluing_holds`, `KN1Corollary.kozmaNitzan_conjecture1`,
`Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds`, nor any theorem whose statement is, or unfolds to, one
of T1, T2, T3, the lab's Conjecture 3 forms, or the paper's Conjectures 1–4 and 6. After the seal the bridge's
author reads both libraries and EXTENDS this list with every such theorem found (two routes to the inequality are
known to exist); the orchestrator checks the extension. Every THEOREM of either library that a transport proof
reaches is named in the record with its own walk.

Each implication ends as PROVED (transport only) or NOT PROVED in the budget. No third value.

## K3 — the conjecture as printed, proved

`theorem conjecture1_as_printed : KN1Printed.Conjecture1`, in the third party's environment, from anything in it.
When proved: `#print axioms` is exactly [propext, Classical.choice, Quot.sound]; `leanchecker --fresh` accepts its
module; Comparator (lane K's pins, nanoda on) accepts with OUR statement files as the challenge. May end NOT PROVED.

## K4 — the blind control (after the results of K0–K3 are sealed)

The closed passages are opened and compared with what K2 found about T1. FOUND BLIND: K2's record names the same
divergences. MISSED: a passage names a divergence between T1 and the printed sentence that K2's record does not
(K2 is re-read; the miss is the finding). NOTHING TO FIND: the passages name no divergence for Conjecture 1.
A reading, and called one.

## Red controls (each must be refused, or the item is void)

- KR0. The planted variants proved false in K0 (at least three), each with the instance of OBLIGATIONS1.md.
- KR1. THE PROOF SCRIPT AGAINST THE PLANTED STATEMENT: the K2 and K3 proof scripts for T1, with the name
  `Conjecture1` replaced by each planted definition proved false in K0: must fail to compile. (Worded this way
  because the sibling item's form, "swap the planted text into the statement file", stopped in our own sanity
  lemmas.)
- KR2. A deliberately cheating transport proof (`R0 → T1` proved from `KNAll.conjecture1_holds`): the walk must
  flag it.
- KR3. `grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit"` over every file of ours THAT
  CARRIES A PROOF: nothing. Over our other files (the walk's source, `#print axioms` commands, prose) the matches
  are listed and classified.
- KR4. Comparator with our challenge changed to a planted variant proved false: refused.

## The words (for T1; the same words, apart, for T2 and T3)

- **CERTIFIED, as printed**: `T1 → R0` and `R0 → T1` are both PROVED by transport, the walks are clean, the red
  controls are refused. If the equivalence passes through a sealed reading, the record names it.
- **THE PRINTED SENTENCE FOLLOWS, NOT SHOWN THE SAME**: `T1 → R0` is PROVED (so K3 is) and `R0 → T1` is NOT PROVED.
  The record names the feature of T1 that blocks the converse.
- **MISMATCH: THE TARGET IS THE SEALED STATEMENT X**: both implications between T1 and a sealed planted variant or
  neighbour X are PROVED, and X is not equivalent to R0 by K0. If X is proved false or trivially true in K0, the
  record says what `conjecture1_holds` then proves. This is the one outcome that says the Lean sentence is not
  the printed one, and it is said only with these proofs.
- **NOT SHOWN THE SAME AS ANY SEALED STATEMENT**: none of the above closed. NOT "refuted": the record names which
  implications were proved and where the others stop.
- **REFUSED**: K0 fails as said there, the environment cannot be built, or a red control is not refused.
- K3 is reported apart: PROVED (with its kernels) or NOT PROVED.

## What the result will NOT say

Not "first": a restatement by the third party exists, and the search for others was a search. Not that the
conjecture is ours or newly proved (the third party proved its statement; two human notes prove the conjecture).
Not that the paper's authors endorse any formal statement. Not that the third party's proof is wrong in any
outcome: every outcome is about which sentence was proved. Not independence beyond procedure (above). Nothing
about Conjecture 3, continuity of θ, or θ(p_c) = 0: each is another item.

## Money, machines, people

One pod, the runpod image, 32 vCPU / 128 GB, 80 GB disk (16 vCPU / 64 GB the floor); its hourly price read from the
catalogue and written in the chat and in POD.txt before it is created; **this item stops at US$15 of the operator's
US$20**, and the latest deletion time that follows from the price is written at creation; deleted with 404
confirmed; the desk's guard: import and delete at 20% of battery. Order on the pod: K0 (the bridge's author, the
third party's tarball absent) → the orchestrator imports K0 and uploads the tarball → K1 (the orchestrator's
script) → K2, K3, red controls (the bridge's author, who may now open the third party's Lean files and the lab's,
never the closed passages) → the orchestrator's replay of every claimed check in a fresh copy → the word → results
sealed → K4. The bridge's author is an agent; it does not create or delete pods. Private until the operator says
reveal; nothing of this item is named in any public file.

## Amendments

(none at the seal)

### A1 (2026-11-13 ~13:58 UTC, after K0 was imported and hash-checked, before the third party's tarball was put on the pod)

The closed list is WIDENED, before any of its files was opened by the orchestrator or either author. The sealed text
closes README.md lines 100–179, docs/, formalization.yaml and verification/. The tarball's file list (names only) also
holds VERIFICATION.md, CONTRIBUTING.md, CITATION.cff, source-layout.json and tests/, which may describe the
statements. The K1 script (perc/kn1/pod/pod-k1.sh) removes from the pod, before anything is built: README.md (whole),
VERIFICATION.md, CONTRIBUTING.md, CITATION.cff, formalization.yaml, source-layout.json, docs/, verification/, tests/,
and the tarball itself (it stays on the desk). What this does NOT close: comments and docstrings inside the third
party's Lean files, which the bridge's author reads with the statements; if one of them names a divergence from the
printed sentence, the blind control K4 is weaker by that much, and the record says which.

K0, for the record (results/kn1/k0, 398 files, SHA256SUMS sha256 841b286a…, re-checked on the desk): all 41 sealed
definitions elaborate with the sealed bytes, no repair, no drop; the required proofs a–f closed (R0 ↔ RE, R0 ↔ RL,
R0 → RF, RE is the sealed N1 by Iff.rfl; Planted1–11 proved false; Planted12 proved TRUE); RF → R0 not attempted, so
RF is not a reading with a K0-proved equivalence. K0 ran 13:23–13:57 UTC with no file of the third party on the pod
(checked by a search of the pod's file system at 13:58 UTC). Not yet replayed by the orchestrator.
