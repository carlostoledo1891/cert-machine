<!-- PR https://github.com/cslib-community/complexitylib/pull/2510, opened 2026-11-05 on Carlos's word; branch tm2-degree-uniform fd0985df on carlostoledo1891/complexitylib, base main b28df563 -->
## Change

`Turing.TM2.stepTotal_polyTime` certifies one step of a fixed TM2 program in polynomial time. The degree of that polynomial comes out of the calculus and may depend on the program. That is a problem when the program is chosen after a parameter, for example a machine for each `δ` in a `2^(δ n)` argument: then the total exponent is not controlled. This PR gives uniform degrees.

New in `Complexity/Computability/Machines/Turing/TM2/Degree.lean`:

- `Turing.TM2.stepTotal_computableInDegree M`: `ComputableInDegree (stepTotal M) encCfg encCfg 1 1`, for every program `M`.
- `Turing.TM2.runBit M (w, t)`: start the machine of a `TM2ComputableAux Bool Bool` on `w`, run `t` steps of `stepTotal` (which stays put after halting), and read the top of the output stack.
- `Turing.TM2.runBit_computableInDegree M`: `ComputableInDegree (runBit M) (encPair (encList encBool) encUnary) encBool 2 1`, for every machine with finite stack alphabets. The run is a left fold over a unary clock (`ComputableInDegree.foldl'`), with the linear stack growth of `stepTotal_stack_bound`.
- `Turing.TM2.runBit_eq`: if the machine outputs `[b]` within `T ≤ t` steps (`TM2OutputsInTime`), then `runBit M (w, t) = b`.

The statements use the plain `ComputableInDegree`. The proofs use the plain degree calculus, apart from one tidy `mapWith` step converted with `computableInTimeAndSpace`, since there is no plain `mapWith` yet. The dependent-table rules (`encDPi` apply, update and build in degree one) and the configuration projections in degree one are private helpers. They could move to `Encodings/DPi` and `TM2/Simulation` as public API if you want them there.

This is new; it is not ported from a source. It uses Christian Reitwiessner's degree calculus, credited in the module docstring. There is no abstract impact.

## Manual impact

- Operator's Manual: `manual/machines-and-classes/intermediate-and-legacy.md`, TM2 section, gets one paragraph on when to use the uniform-degree step and run.
- Agent Operator's Manual: no edit. Roles, delegation and review procedures do not change.

## Validation

Same commands and results as PR 1, on this branch at base b28df563e. `check_tidy_surface.py` passes with no new tidy statements. Hosted CI: runs on this pull request.

Limitations. `runBit` reads one output bit, so it is a decision interface, not a general output. There is no new test file. `runBit_eq` connects it to Mathlib's `TM2OutputsInTime`.

## AI assistance

I wrote the statements by hand. The proofs were written by Claude (Anthropic) agents, first in [claimbox](https://github.com/carlostoledo1891/claimbox) (`lean/eth-bridge`, `EthBridge/Anthropic/DegreeStep.lean` and `DegreeRun.lean`, built on complexitylib 7c66eb71), where they serve a bridge from a TM2 statement of ETH to complexitylib's `ETH`. Neither file depends on that statement. A Claude agent ported them here and restated them from `ComputableTidilyInDegree` to `ComputableInDegree`, as CONTRIBUTING requires for public statements. The claimbox version was checked in a separate repository that I also run: [eth-c2.json](https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c2.json), [eth-comparator.json](https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-comparator.json). The author is the same on both sides, so this is not independent review, and those records cover the claimbox version, not this port. No human or independent review of this revision has happened. Coordinator review is requested.

Addresses #739 (TM ⇒ RAM direction), offered there first.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
