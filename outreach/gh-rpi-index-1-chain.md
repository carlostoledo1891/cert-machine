# Comment on thinkthoughts/rpi-index#1 (our issue on Daniel Hawkley's RPI map), 2026-11-05 — send on the operator's word

---- PASTE ----
A follow-up beyond RPI-ETH-010. Your comment on the announce page said that equivalence with textbook ETH "remains a separate question". Part of that question now has a Lean answer.

I ported Anthropic's `eth/` proof to complexitylib's Lean (v4.36.0-rc2), with AI agents. 47 of its 809 files needed edits, each listed. In that one environment, `MainResults.ethIsFalse` implies ¬ETH on cslib's deterministic multitape Turing machine with the binary `encCNF`. Lean's six-checker judge (`lake comparator --paranoid`), nanoda and `leanchecker --fresh` all accept it.

With your OpenAI → ETHIsFalse link, both labs' statements now reach that standard machine. The one version gap left is on your side, between OpenAI's Lean 4.34.1 and the standard machine's; I read it, I don't decide it. If it's useful for the map, an RPI for "ETHIsFalse → cslib ¬ETH" would point to https://carlostoledo.co/reports/eth-anthropic-chain.html. I wrote both the bridge and the checker, so it is not an independent review.
