# P1 result: Theorem C35, row by row (PRIVATE, 2026-11-21)

Against `P1-PREREG.md` (sha256 fdc44622…bc7f80, OpenTimestamps receipt `P1-PREREG.md.ots`, submitted 17:22 UTC).
Hashes of every file named here: `P1-SHA256SUMS`. All runs on the M2 (16 GB), Lean 4.35.0, Mathlib 56a00585.

## Verdicts

| Row | Verdict | What was decided |
|---|---|---|
| S statement fidelity | CERTIFIED (read once, by cert-machine) | The Lean statements say the claim; see below. |
| D1 SAT decider | CERTIFIED | Our formula = Codex's `target.cnf` up to renaming; Heule's `lrat-check` and the verified `cake_lpr` both accept both proofs. |
| D2 non-SAT decider | CERTIFIED | Our branching search closes every branch: 403,541 nodes, no configuration. |
| L Lemma P without native code | CERTIFIED | `lemma_P` checked by the kernel; axioms propext, Classical.choice, Quot.sound only. |
| B the bridge | CERTIFIED | Codex's `Outside.lean`, `OutsideSize.lean`, unchanged (sha256 equal), compile against L. |
| K second checkers | CERTIFIED by three checkers; `--fresh` not run | leanchecker replay exit 0 on all five modules; nanoda and con-leche accepted the export. |
| Corollary (not pre-registered) | CERTIFIED given one named premise | No vertex of degree 4 in a (3,10;40)-graph, from Theorem C35 + the (3,9;35) uniqueness (GR 2013 Thm 3) as a hypothesis. |

## S — statement fidelity
- `core` is `SimpleGraph.fromRel` of "(v − u) mod 35 ∈ {1, 7, 11, 16}". `fromRel` symmetrises and drops loops, so
  u ~ v iff v − u ≡ ±1, ±7, ±11 or ±16 (mod 35): the circulant C35(1,7,11,16).
- `e : core ↪g G` is a `SimpleGraph.Embedding`: injective, adjacency iff adjacency. That is an induced copy.
- `tri : G.CliqueFree 3`: triangle-free. `noTen : ∀ s, ¬ G.IsNIndepSet 10 s`: no independent set of size 10 (hence
  none larger). `[Fintype V]`: G finite.
- `order_at_most_39 : Fintype.card V ≤ 39`. `four_outside_C4 (w : Fin 4 ↪ V) (out : ∀ i j, w i ≠ e j) :
  Nonempty (cycleGraph 4 ≃g G.comap w)`: any four distinct vertices outside the copy induce a 4-cycle.
- `lemma_P (S : Fin 3 → Set K) : ¬ Feasible S`, with `Feasible` = each S t independent, pairwise disjoint, and for
  i = 0, 1 the union S i ∪ S (i+1) meets every independent 8-set: Lemma P as stated.
- Not read here: `InducedCore.lean`'s `no_induced_C35` (the direct SAT route's statement); it is not used by L or B.

## D1 — SAT
- Formula equality (`cmp_cnf.py`, earlier today): True. Heule `lrat-check` (drat-trim@2e3b2dc0): VERIFIED `path`
  (0.31 s) and `target` (4.0 s).
- Control C2: `path.lrat` without its final empty clause: `c WARNING: Verification incomplete … c NOT VERIFIED`,
  exit 1 (`d2/c2-truncated-lratcheck.out`); the full proof: VERIFIED, exit 0.
- cake_lpr, the verified checker, from tanyongkiam/cake_lpr@033aad53, its final release of 1 Nov 2026. Both
  assembly files match the released `cake_lpr.sha256`.
  - The ARMv8 build, native on this M2: `path` `s VERIFIED UNSAT` in 0.8 s; `target` `s VERIFIED UNSAT` in 13.4 s,
    4.3 GB.
  - The x64 build under Rosetta: the same verdicts, in 2.4 s and 19.4 s.
  - An earlier note here said cake_lpr was x86-only. That was wrong: the release ships an ARMv8 build. Rosetta was
    installed on the operator's word before this was seen.
- Control C2 for cake_lpr: the truncated `path.lrat` gives `c empty clause not derived at end of proof` and no
  `s VERIFIED` line. The exit code is still 0, so the verdict must be read from the `s` line, not the exit status.

## D2 — non-SAT (`d2/lp_search.c`, from the statement; no track's or Codex's search code read)
- The core: 0 triangles, 3,360 independent 8-sets.
- Full search, no symmetry: every branch closed, 403,541 nodes (191,870 closed leaves), depth 19, 14.5 s.
- With vertex 0 in A: 32,520 nodes. With A empty: 9 nodes. Both close (`d2/search-*.out`).
- Control C3: on C35 − 0 the search FINDS a configuration in 28 nodes: A = {1,5,7,11,28,34},
  B = {2,4,10,14,16,19,22,24}, C = {3,9,13,21}. `lemmap` CERTIFIED it (all 2,592 independent 8-sets of C35 − 0 met);
  the same triple on the full C35: `lemmap` REFUSED (A ∪ B misses {0,3,6,8,12,18,20,26}).
- Cross-check (`d2/lp_counts.c`, brute force, no pruning): 73,926 independent sets (1, 35, 455, 2905, 10150,
  20265, 22995, 13760, 3360), 6 multipliers {1,11,16,19,24,34}, 210 affine maps, 401 orbits, 74,895 partners summed
  over one representative per orbit, no representative with two disjoint partners. Every number equals the Claude
  track's (`claude-r2/STATUS.md`).

## L — Lemma P in Lean without native code (`lean/`)
- `PathLemma.lean` keeps Codex's statement part verbatim (K, core, its instance, Feasible, the statement of
  lemma_P) and replaces the proof.
- The proof: a 32,529-node branching certificate (`d2/certAE.txt`: the search with vertex 0 in A, then the search
  with A empty) is checked by `LemmaPCheck.lean`, a small computable checker over Nat bitmasks, with `decide +kernel`.
  Its soundness is proved in Lean: a state "covers" a configuration; each certified node passes the cover to one of
  its children; the stack ends empty. Translation by a core vertex reduces any configuration to one with 0 ∈ A or
  A = ∅.
- The kernel's caches grow about 0.9 MB per node, so the certificate is cut into 16 pieces of ≤ 2,048 nodes. Each
  piece is its own theorem `runAll cert_j stk_j = some stk_{j+1}` with the stacks written out
  (`d2/gen_pieces.py`). A Python mirror of the checker computed them and ran the whole certificate to an empty stack.
  The kernel recomputes every piece, so a wrong stack cannot pass.
- Build with `-DwarningAsError=true`: PathLemma 122.5 s, peak 2.5 GB.
  `'RamseyScout.PathLemma.lemma_P' depends on axioms: [propext, Classical.choice, Quot.sound]` (`lean/build-r1.log`).
- Control C4: piece 0 with its first closed leaf (entry 12) removed: `runAll bad stk0 = none`, proved by the kernel
  (`ControlC4.lean`). The mirror first: refused at entry 12.
- Control C5: the same certificate on C35(1,7,11,15) (`ControlC5Check.lean` = the checker with that one line
  changed): `runAll cert0 [initA, initE] = none`, proved by the kernel. The mirror first: refused at entry 0. (Lemma P
  also holds on C35(1,7,11,15): `lp_search -s 1,7,11,15`, 142,791 nodes. The refusal is the certificate meeting
  the wrong graph.)

## B — the bridge
`Outside.lean` (55fc5e99…) and `OutsideSize.lean` (24980e4a…), byte copies of Codex's, compiled against L:
`outside_fork`, `order_at_most_39`, `four_outside_C4` each depend on [propext, Classical.choice, Quot.sound].

## K — second checkers
- `leanchecker` (replay of each module's declarations against its imports): LemmaPCheck, LemmaPCert, PathLemma
  (125.7 s, 2.4 GB), Outside, OutsideSize: exit 0.
- `leanexport` of the closure of lemma_P, order_at_most_39 and four_outside_C4: 27,750,870 bytes (daf9c43c…).
- nanoda 0.4.19 (permitted axioms the three; unpermitted axiom a hard error; Nat extension on): "Checked 6535
  declarations with no typechecker errors", exit 0, 30.6 s, peak 8.8 GB. Its one "pretty printer error: Unable to
  print axioms" is the known cosmetic message (seen in the ℤ-in-ℚ lane's logs).
- con-leche (`--verified --jobs=4`): "accepted 5905 declarations", exit 0, 197 s, peak 10.1 GB. (Its count differs
  from nanoda's 6,535; the two count declarations differently. Both read the same export, sha256 daf9c43c….)
- Not run: `leanchecker --fresh` (it replays all of Mathlib's closure; earlier lanes needed a pod).

## Corollary: no degree-4 vertex (added after the pre-registration; not one of its rows)
`lean/NoDegreeFour.lean` (8c8e9c96…): `no_degree_four` — in a triangle-free graph on 40 vertices with no independent
10-set, no vertex has degree 4 — from `order_at_most_39` and ONE hypothesis, `unique35`: every triangle-free graph on
35 vertices with no independent 9-set is isomorphic to the circulant (Goedgebeur–Radziszowski 2013, Theorem 3, a
computer enumeration we have not checked). Axioms: the three. leanchecker replay exit 0. This decides, conditionally on
that premise, the "no degree-4 vertex" part of the δ ≥ 5 claims of Daugherty–Ward–Ryan, algal-lab, Unsolved Lab M09
and Chen, by a route that shares nothing with theirs. (δ ≥ 4 itself is the standard R(3,9) = 36 argument, not
formalised here.)

## What this record says, and what it does not
- Theorem C35 is proved in Lean with the standard axioms only, with Lemma P checked by the kernel, and decided
  independently twice outside Lean (our SAT encoding with Codex's LRAT; our own search), with controls that fail.
- It does not give a human-readable proof of Lemma P (the multitrack run's question), and says nothing about R(3,10).
- PRIVATE until the operator says "reveal".
