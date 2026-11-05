<!-- PR https://github.com/cslib-community/complexitylib/pull/2509, opened 2026-11-05 on Carlos's word; branch wordram-space-bounded-sim f2f244cb on carlostoledo1891/complexitylib, base main b28df563 -->
## Change

This adds a TM ⇒ RAM inclusion to #739 that does not need a polynomial bound on the running time, and uses it for k-SAT.

`Cslib.WordRAM.OfTuring.executes_simProgram` (#2027) bounds the simulated tape addresses by the running time `t`. So `DTIME_subset_RAMTIME_additive` (#2028) needs a polynomially bounded `t` to keep the words logarithmic. A run that visits at most `s` work cells keeps its heads within `[-s, s]`. That means the same simulator works when the words hold `simBound k m |x| s` instead of `simBound k m |x| t`. With polynomial work space, any running time works.

New in `Complexity/Computability/WordRAM/OfTuring/Space.lean`:

- `Turing.MultiTapeTM.natAbs_workTapePos_runFrom_le_of_runsInSpace`: a run in space `s` keeps every work head within distance `s` of the origin (from cslib's `RunPath.inWindow_of_space_le`).
- `Cslib.WordRAM.OfTuring.executes_simProgram_of_runsInSpace`: `executes_simProgram` with the word bound taken from the space bound. The proof is #2027's, with that one step changed, so the file's Authors line names Samuel Schlesinger first, with me; the copyright header does the same.
- `Cslib.WordRAM.uniformDecidableInTimeLogWord_of_decidableInTimeAndSpace`: if `A` is decided in time `t` and work space `s ≤ D (L + 1)^e`, then one fixed `Basis.additive` program decides `A` within `C·t + C` instructions under `UniformDecidableInTimeLogWord`. The input convention is the one `RAMTIME` uses.

New in `Complexity/Computability/Complexity/FineGrained/WordRAM.lean`:

- `Cslib.Complexity.CountingNativeEndpoint.exists_decidableInTimeAndSpace_KSAT k`: one machine decides `KSAT k` in time `c·⌈2^(A·interpolationScale n)⌉·(L+1)^E` and work space `c·(L+1)^E`. It is built from `exists_modelCounter`, whose `ComputableInO` contract keeps the work space. `decidableInSubexpTime_KSAT` goes through `DecidableInTimeO`, which drops it.
- `Cslib.WordRAM.uniformDecidableInTimeLogWord_KSAT k hδ`: for every `δ > 0`, one fixed additive program decides `KSAT k` on the bits of `encCNF φ` within `c·(⌈2^(δ n)⌉·(L+1)^e) + c` instructions, at every word size `w ≥ k'·(⌊log₂ L⌋ + 1)`.

At `k = 3` this says ETH fails on the word RAM with `O(log L)`-bit words. I did not add a word-RAM `ETH` definition or a `¬ETH` corollary. The library has one ETH, on multi-tape machines, and a second hypothesis for one model seemed like a parallel notion. I can add it if you want it.

`OfTuring.length_output_runFrom_mono` was private. It is now public, so the new module uses it instead of proving it again.

This is new formalization of a standard argument (addresses bounded by space), not a port of a cited source. There is no abstract impact: no catalogue entry changes, and this is not proposed as a headline.

## Manual impact

- Operator's Manual: `manual/algorithms-and-memory/wordram-and-bridges.md` gets a bridge-table row for the space-bounded simulation, and a paragraph on when to use it instead of `DTIME_subset_RAMTIME_additive`, with the k-SAT client.
- Agent Operator's Manual: no edit. Roles, delegation and review procedures do not change.

## Validation

Local, at base b28df563e:

- `lake build --wfail --iofail` (whole library, cache restored by `scripts/cache/ensure.sh`): passed
- `lake test --wfail --iofail`, including `ComplexityTests.Axioms`: passed
- `lake exe mk_all --check`, `lake lint`, `lake exe lint-style`, `lake exe checkInitImports`: passed
- `python3 scripts/check_hygiene.py --check-simp`, `check_tidy_surface.py`, `check_changed_files.py`, `check_operator_manual.py`, `test_operator_manual.py`: passed
- `#print axioms` on each new theorem: `[propext, Classical.choice, Quot.sound]`

Hosted CI: runs on this pull request.

Limitations. The answer is the decision bit only; I did not add a function-output version. The word size is the transdichotomous `logWidth k' L` of `UniformDecidableInTimeLogWord`, and the input is one bit of `encCNF φ` per word. There is no new test file. The k-SAT theorem is itself a client of the inclusion, and the inclusion is a client of the simulator.

## AI assistance

I wrote the statements by hand. The proofs were written by Claude (Anthropic) agents, first in my repository [claimbox](https://github.com/carlostoledo1891/claimbox) (`lean/eth-bridge`, built on complexitylib 7c66eb71). A Claude agent ported them to this tree: names, module layout and docstrings, the k-SAT result generalized from `k = 3` to every `k`, and the statements in library terms (`DecidableInTimeAndSpace`, `KSAT`, `encCNF`) instead of the abstracts layer. The claimbox version was checked in a separate repository that I also run: `#print axioms`, nanoda, `leanchecker --fresh`, and three planted wrong variants that were refused. Records: [eth-c1.json](https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c1.json), [eth-comparator.json](https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-comparator.json). The author is the same on both sides, so this is not independent review, and those records cover the claimbox version, not this port. No human or independent review of this revision has happened. Coordinator review is requested.

Addresses #739 (TM ⇒ RAM direction), offered there first.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
