# P1 pre-registration: Theorem C35 to a cert-machine record (PRIVATE)

Written 2026-11-21 ~17:35 UTC by cert-machine (Claude Opus 5.5, the operator's repository session), before the runs
below. Earlier measurements of the same day are listed as such in "Already measured" and are not re-labelled.

## The claim
Any finite triangle-free simple graph G with no independent set of size 10 that contains an INDUCED copy of the
circulant C35(1,7,11,16) (`core ↪g G` in Lean: an embedding, adjacency iff) has at most 39 vertices, and any four
distinct vertices outside the copy induce a 4-cycle. Exoo's 39-vertex graph attains it.

It rests on Lemma P (finite, on the core): there are no three pairwise-disjoint independent sets A, B, C of the core
such that both A ∪ B and B ∪ C meet every independent 8-set of the core.

## Rows and what each verdict means
- **S (statement fidelity).** Read the Lean statements of `order_at_most_39`, `four_outside_C4`, `lemma_P` and
  `no_induced_C35` against the claim: `core` is the circulant, `↪g` is induced, `CliqueFree 3` and
  `IsNIndepSet 10` mean what they say. CERTIFIED = they state the claim; REFUTED = one states something else (named).
- **D1 (SAT decider).** cert-machine's own CNF (`cm_encode.py`, from the statement) is the same formula as Codex's
  `target.cnf` up to renaming, and Codex's LRAT for it is accepted by two checkers: Heule's `lrat-check` and the
  formally verified `cake_lpr`. CERTIFIED = equality + both checkers accept; REFUSED = a checker cannot be run here
  (named), with the other result kept.
- **D2 (non-SAT decider of Lemma P).** cert-machine's own exhaustive branching search, written from the statement
  without reading the Claude track's or Codex's search code: assign core vertices to A, B or C, always branching on an
  independent 8-set not yet met by A ∪ B (or by B ∪ C). CERTIFIED = every branch closes; REFUTED = a configuration is
  found (it would be decided by `lemmap` and examined before anything is said).
- **L (Lemma P in Lean without native code).** The search tree of D2 is written as a certificate and checked by a
  Lean function evaluated with `decide +kernel`, whose soundness is proved in Lean. CERTIFIED = it compiles with
  `-DwarningAsError=true` and `#print axioms lemma_P` lists only propext, Classical.choice and Quot.sound. If the kernel
  check proves too slow on the Mac, the row is REFUSED on resources and says so; native code is never substituted.
- **B (the bridge).** Codex's `Outside.lean` and `OutsideSize.lean`, unchanged, compiled against L's `lemma_P`.
  CERTIFIED = `order_at_most_39` and `four_outside_C4` print only the three standard axioms.
- **K (kernels).** The bridge's olean replayed by a second checker (`lean4checker`/`leanchecker --fresh`, and nanoda
  or con-leche where they run on the Mac). CERTIFIED per checker that accepts; REFUSED for a checker not available.

## Controls (each must FAIL the claim it is attached to)
- **C1 (Exoo, positive).** `cm_encode.py` with four outside vertices is SAT; the decoded graph has 39 vertices, is
  triangle-free, has α = 9 and an outside C4.
- **C2 (truncated proof).** `path.lrat` cut before its final empty clause: both LRAT checkers must reject it.
- **C3 (C35 − 0).** D2's search on the core with vertex 0 deleted must FIND a configuration (the scout's
  counterexample shows one exists), and the one it finds must pass `lemmap`.
- **C4 (perturbed certificate).** L's checker run on the certificate with one closed leaf removed (or one branch
  dropped) must return false; measured before the full run.
- **C5 (perturbed core).** L's checker on a core with one step changed (C35(1,7,11,15)) must return false or fail to
  close; its outcome is measured first and recorded.

## Pins
- Codex bundle `c35-direct-proof.tar.xz` 956b2dfb5e9acb5d28170bda603af024fc405667548d416c98226f275b7e26ff
- `path-bridge/PathLemma.lean` ccf1e82e…69ab, `Outside.lean` 55fc5e99…ad9a92afd, `OutsideSize.lean` 24980e4a…610b69ab
- `cm_encode.py` f77b25e4d7c1d1beb1579f6dbe002afb4e40b459679a70659a534f38413dc3d4, `cmp_cnf.py` 720c8dc2…1a8cb143b
- Lean 4.35.0, Mathlib 56a005855ea17e0b0958f73ec801ae140b0a1679 (the built copy in instruments/rh-comparison)
- Heule `lrat-check.c` from drat-trim@2e3b2dc0 (bf07c2ac…4a95)

## Already measured (2026-11-21, before this file)
- D1, first half: formula equality (`cmp_cnf.py`: True); Heule's `lrat-check` VERIFIED `path` (0.6 s) and `target`
  (4.0 s) on the M2.
- C1: m = 4 SAT under kissat, decoded: 39 vertices, triangle-free, α 9, outside C4.
- Our own CaDiCaL LRAT for m = 5 was stopped after 34 min (1.6 GB and growing); it is not a row.

## What this record does not decide
The value of R(3,10); anything about other 40-vertex graphs; whether a human-readable proof of Lemma P exists (that is
the multitrack run r310-lemma-p). Nothing here is public until the operator says "reveal".
