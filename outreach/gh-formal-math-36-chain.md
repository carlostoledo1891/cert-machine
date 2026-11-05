# Comment on anthropics/formal-math#36 — the chain in one Lean (2026-11-05). Send on the operator's word for this text.

---- PASTE ----
A last update for this thread. I ported your `eth/` proof to complexitylib's Lean (v4.36.0-rc2), with AI agents (Claude), and it builds there: 762 of the 809 files in the import closure of `Solution.lean` are byte-identical, and 47 needed edits for the newer Lean and Mathlib (renames, imports, tactic repairs). Every edit is listed with both sha256s in [PORT.md](https://github.com/carlostoledo1891/claimbox/blob/c1442b12b97495e2f284cf4b92e3708bf06f07b3/lean/eth-bridge/AnthropicEth/PORT.md). `MainResults.lean` is unchanged.

So `MainResults.ethIsFalse` and the bridge from my comment above now sit in one environment:

`EthBridge.AnthropicChain.not_eth : ¬ ETH := not_eth_of_ethIsFalse MainResults.ethIsFalse`

where `ETH` is cslib's, on a deterministic multitape Turing machine with the binary `encCNF`. No step from your proof to that machine crosses a Lean version gap.

It was checked with `lake comparator --paranoid` against a challenge written from my pinned statement: Lean's kernel, leanchecker-paranoid, lean4lean, nanoda, con-leche and con-ron all accept. nanoda accepts all 77,276 declarations, `leanchecker --fresh` passes, and three planted wrong variants are refused. The judge ran without its sandbox, because bubblewrap cannot start on the rented machine. Report, gaps first: https://carlostoledo.co/reports/eth-anthropic-chain.html

Still open: that cslib's ETH is the textbook ETH is a reading of a definition; OpenAI's side reaches your statement inside OpenAI's Lean and crosses one version gap; and I am the author of both the bridge and the checker, so this is not an independent review. If the port's edits are useful for moving `eth/` to a newer toolchain, they're yours to take.
