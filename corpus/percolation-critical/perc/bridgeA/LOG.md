# Bridge A log (Anthropic formal-math 795efb86 percolation -> TextbookPercolation.Statement)

- 2026-11-12T06:24:30Z start. /root/Textbook.lean sha256 4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae (checked on the pod). P1 build of Percolation + Solution under /root/p1 still running (~8894/8905); waiting for /root/p1/runs/build.exit.
- Read (read-only, under /root/p1): Challenge.lean, Solution.lean, Percolation/Literature/Basic.lean (theta, criticalProb, theta_bot), PercolationProofs.lean (measurableSet_percolatesAt_holds, theta_mono_holds), LatticeModels/LatticeGraph.lean (zdGraph_adj_iff); Mathlib SetBernoulli.lean (setBernoulli_eq_map), Bernoulli.lean (map_bernoulliMeasure'), ProductMeasure.lean (eq_infinitePi, infinitePi_pi).
- Plan: toSet w = {e | exists h, w <e,h> = true}; prove map toProp P = infinitePi nu by eq_infinitePi on boxes (split each box into edge and non-edge coordinates), then setBernoulli_eq_map; the clusters agree (fromEdgeSet adjacency = OpenEdge); theta agrees for every p; pc: sup{theta = 0} = inf({theta > 0} u {1}) from monotonicity (theirs), theta >= 0 and theta(0) = 0 (theirs), by a midpoint argument; conclude.
- First draft of Bridge.lean written (scratchpad) before the build finished.
- P1 build (/root/p1/runs/build.exit) = 0, 547 s. Copied /root/p1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/percolation (with .lake, 8.5 GB) to /root/bridgeA/percolation with `cp -a`: exit 0, 37 s. Nothing under /root/p1 was modified.
- Checked the copy against the pinned tarball /root/formal-math-795efb86.tar.gz: `diff -rq --exclude=.lake` shows only the new files (Textbook.lean, Bridge.lean, Axioms.lean) and lakefile.toml (two [[lean_lib]] entries appended: Textbook, Bridge). Challenge.lean sha256 5578f9b4d6ae573fc5443a2e236298194f3f2c4a48cd2028435ebba02bd7a19c, Solution.lean a915e2dfd066e29a652a988297859e3af5004ec3c475bc822bacd66b27454a0d, both identical to the tarball.
- `cp /root/Textbook.lean Textbook.lean`: sha256 4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae (the sealed one).
- `lake build --no-build Solution` in the copy: exit 0, 9 s, "All targets up-to-date (8903 jobs)" (the copy needs no rebuild).
- `lake build Textbook`: exit 0, 39 s.

## Bridge builds

| attempt | exit | seconds | what failed / what changed |
|---|---|---|---|
| 1 | 1 | 15 | one error: `Set.pi ↑(s.subtype IsEdge)`: `Finset (Subtype IsEdge)` is only definitionally `Finset (Edge d)`, so the coercion to `Set (Edge d)` is not found |
| 2 | 1 | 15 | a type ascription does not change the inferred type: same error |
| 3 | 1 | 17 | fixed by an opaque `s' : Finset (Edge d)` with `hs' : s' = s.subtype IsEdge` and a membership lemma; one error left: `simp only` normalised `true = true` to `True` itself, so the final `rfl` saw `Ber(True, False, p)` against an unfolded `ν` |
| 4 | 0 | 15 | `ν p e = Ber(True, False, p)` on an edge proved by `rw [hT, bernoulliMeasure_def]`; builds, no warnings |

- Forbidden tokens: `grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" Bridge.lean` matches nothing.
- Bridge.lean: 299 lines, sha256 ab8be23fcdec9c211bad2d44bc0b44ab22e26ea4bdf9111309670f2d78cae00a.
- `lake env lean Axioms.lean`: exit 0, 11 s:
  - 'bridgeA' depends on axioms: [propext, Classical.choice, Quot.sound]
  - 'statement_from_anthropic' depends on axioms: [propext, Classical.choice, Quot.sound]

## Red controls (red.sh; the same Bridge.lean, Textbook.lean swapped in place and restored)

| control | plant (one line each, diff in red/R*.diff) | exit | seconds | first error |
|---|---|---|---|---|
| R1 | `θ d ⟨pc d, h⟩ = 0` -> `= 1` in Statement | 1 | 24 | Bridge.lean:295:2: Type mismatch (`h d hd : PercolationContinuity d` against `theta … (criticalProbI d) = 1`) |
| R2 | `2 ≤ d` -> `1 ≤ d` in Statement | 1 | 24 | Bridge.lean:295:12: Application type mismatch (`hd : 1 ≤ d` where `2 ≤ d` is expected, in `h d hd`) |
| R3 | `sSup` -> `sInf` and `θ d ⟨p, h⟩ = 0` -> `0 < θ d ⟨p, h⟩` in pc | 1 | 26 | Bridge.lean:266:4: Type mismatch (in pc_eq: `sSup Z ≤ sInf Q` against `sInf {p | … 0 < f ⟨p, ⋯⟩} ≤ sInf Q`) |

- Restore: Textbook.lean sha256 4dc732f5… OK; `lake build Bridge` exit 0, 25 s; Axioms.lean re-run: the same two lines.
- Note on R3: its planted Statement is not false. θ(1) = 1 (every edge is open at p = 1), so {θ > 0} already contains 1 and inf {θ > 0} equals inf ({θ > 0} ∪ {1}). R3 checks that the bridge depends on the definition of pc; it does not check that the bridge refuses a false claim. R1 and R2 are false statements (R2 at d = 1: p_c = 1 and θ(1) = 1).
- 2026-11-12T06:38:03Z done; files copied back to /Users/carlostoledo/Projects/plumb/perc/bridgeA/.
