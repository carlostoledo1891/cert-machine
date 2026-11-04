# DRAFT — comment on anthropics/formal-math#36: the FinTM2 → multitape step, now in Lean (C2)

Status: DRAFT, not sent. Send only on the operator's word for this text:
`gh issue comment 36 -R anthropics/formal-math -F <paste block>`. Then record it in SEND-QUEUE, GITHUB-OUTREACH and
corpus/outreach.json. Do not reply to frintroper's posts in the thread (blocked; never engaged).

Why here: our earlier comment in this thread (issuecomment-6484418376) named this exact step as informal: "What stays
informal is the textbook step from FinTM2 steps to word-RAM or multitape time, and writing a textbook 3-CNF as
`encClauses`." C2 closes it in Lean. Checked against certs/eth-c2.json (CERTIFIED; nanoda 23,430 declarations;
leanchecker --fresh; three planted variants refused; MainResults.lean equal to formal-math 16a5ce41's bytes).

---- PASTE ----
A follow-up to my earlier comment, which named one step as informal: going from FinTM2 steps on `encClauses` to a standard machine with a standard encoding. That step is now in Lean.

`EthBridge.Anthropic.not_eth_of_ethIsFalse : MainResults.ETHIsFalse → ¬ ETH`, where `ETH` is cslib-community/complexitylib's: a deterministic cslib multitape Turing machine deciding 3-SAT on the binary `encCNF` of every formula (any variable labels, repeated literals and clauses allowed) within c · 2^(δn) · (L+1)^e + c steps. The source is https://github.com/carlostoledo1891/claimbox/tree/235fbfa90e7e19827be462431fd822c82ccaf5fc/lean/eth-bridge. `MainResults.lean` is vendored byte for byte from this repository at 16a5ce41.

Two pieces were needed beyond complexitylib's library:
- complexitylib simulates a TM2 program in polynomial time, but the degree depends on the program, and here the program is chosen after δ. So one TM2 step gets a degree-one certificate valid for every program, and the run is a fold over a unary clock.
- A polynomial-time reduction from `encCNF` to `encClauses 3`: dense relabelling, removing duplicate clauses, and padding with n so the decider can count to 2^(n/m + c₀).

How it was checked: built from source; `#print axioms` gives only `propext`, `Classical.choice` and `Quot.sound`; nanoda accepts all 23,430 declarations beneath it; `leanchecker --fresh` passes; three planted wrong variants (`sorry`, a new axiom, a changed statement) are refused. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c2.json

What it does not settle:
- It elaborates your file against complexitylib's Mathlib (Lean v4.36.0-rc2), not yours (v4.33.1). That the two `ETHIsFalse` mean the same thing is read, not decided.
- That cslib's multitape ETH is the textbook ETH is still a reading of a definition, though now of a standard machine.

With the bridges from OpenAI's statement to yours (TSavo's, and Daniel Hawkley's inside OpenAI's Lean), both labs' statements now reach the same standard machine.

Disclosure: I wrote the statement, Claude wrote the proof, and my own checker, also built with Claude, decided it in a separate repository. The roles are separate, but this is not an independent review.
