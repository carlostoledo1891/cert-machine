# ETH bridge: OpenAI's claim implies Anthropic's `ETHIsFalse`

Two labs published machine-checked refutations of the Exponential Time Hypothesis on 2026-10-26, on
different machine models with different formal statements. This library joins them on one statement.

**The one file to read:** Anthropic's trusted statement
[`eth/MainResults.lean`](https://github.com/anthropics/formal-math/blob/main/eth/MainResults.lean)
(150 lines, imports only Mathlib, defines `ETH` and `ETHIsFalse`). OpenAI's trusted statement is
[`bridge/Bridge/OpenAIStatement.lean`](bridge/Bridge/OpenAIStatement.lean), their comparator file verbatim.
The bridge theorem's challenge file is [`bridge/BridgeChallenge.lean`](bridge/BridgeChallenge.lean).

- `Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse`
- `Bridge.two_proofs_one_statement : MainResults.ETHIsFalse ∧ (Claim → MainResults.ETHIsFalse)`
  (Anthropic's proof beside the bridge from OpenAI's claim)

Checked 2026-10-27 with Lean 4.33.1 and Anthropic's pinned Mathlib; both theorems depend only on
`propext`, `Classical.choice`, `Quot.sound`.

## Files (`bridge/Bridge/`)
- `OpenAIStatement.lean` — OpenAI's comparator statement verbatim, with its sorry'd theorem turned into `def ClaimAt k` / `def Claim`.
- `Main.lean` — the bridge. OpenAI's `PrimitiveMachine` as a `Groundwork.Stepped` machine (`CfgRep`), `IsPolyT` by `fun_prop`, soundness of the step against `Turing.Tape`, the span invariant `Rel` against OpenAI's `LocatedCfg` (so OpenAI's space bound bounds state size), compile via Anthropic's `Groundwork.exists_tm`, analysis, assembly into `Sat3.SubexpTM`, then `WidthThree.ethFails_of_subexpTM`.
- `BitLength.lean` — OpenAI's encoding is polynomial in n at width k.
- `FrontEnd.lean` — a `PolyT` map from Anthropic's plain 3-CNF code to OpenAI's canonical sorted code (insertion sort and lexicographic order in combinator form), proved equal to `Finset.sort`.
- `Joint.lean` — the two-proofs theorem.

## Build
Place `bridge/` inside Anthropic's `eth` project (github.com/anthropics/formal-math, rev of 2026-10-27), append
```
[[lean_lib]]
name = "Bridge"
srcDir = "bridge"
globs = ["Bridge.+"]
```
to its `lakefile.toml`, then `lake exe cache get && lake build Bridge`. On WSL2 set `UV_USE_IO_URING=0`.
`instrument.sh <build log>` prints R, the number of declarations still using `sorry` (0).

## Comparator
`comparator_bridge.json` + `bridge/BridgeChallenge.lean`: Anthropic's CI script (`.github/scripts/comparator-check.sh`) accepted the bridge on 2026-10-27: statement identical to the trusted challenge, standard axioms only, replayed by both the Lean kernel and nanoda ("Your solution is okay!").
