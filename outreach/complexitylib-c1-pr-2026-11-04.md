# DRAFT — complexitylib PR: TM → word RAM at logarithmic word size, bounded by space (C1)

Status: DRAFT, not sent. Sending is the operator's word (one PR from carlostoledo1891 to cslib-community/complexitylib).
The source is claimbox lean/eth-bridge at 68a063bb (EthBridge/WordRAM/*), decided in cert-machine certs/eth-c1.json.

---

**Title:** WordRAM: simulate a space-bounded multitape TM at logarithmic word size; ¬ETH on the word RAM

**Body:**

This PR adds three results to the TM → RAM direction of #739 and one corollary.

1. `executes_simProgram_of_space`. The simulator theorem from #2027, with the work-tape addresses bounded by a space
   bound `s` instead of the running time `t`. The proof is #2027's with that one step changed. At word size
   `k · (⌊log₂ L⌋ + 1)`, a machine with polynomial work space can therefore run for super-polynomial time and still be
   simulated.
2. `uniformDecidable_of_timeSpace`. A multitape machine deciding `A` in time `t` and work space `poly(L)` gives one fixed
   additive-basis program that decides `A` within `C·t + C` instructions, under `UniformDecidableInTimeLogWord`.
3. `exists_ksat3_decider`. A 3-SAT decider on `encCNF`, built from `CountingNativeEndpoint.exists_modelCounter`. It runs
   in time `c·⌈2^(A·n(log log n)²/√log n)⌉·(L+1)^E` and work space `c·(L+1)^E`.
4. Corollary `not_eth_ram`. ETH is false on the word RAM with `O(log L)`-bit words, with input read one bit of `encCNF`
   per word.

Why this is needed: the existing inclusions at logarithmic word size (#2028, #2066) assume polynomially bounded running
time, because #2027 bounds addresses by time. So the 2^{o(n)} decider behind #1338 did not reach the word RAM through
them.

Checks. The build is from source at complexitylib 7c66eb71. `#print axioms` shows `propext`, `Classical.choice` and
`Quot.sound` only. nanoda (8de7e0c, through lean4export) accepts every declaration beneath `not_eth_ram`. `leanchecker
--fresh` passes. Three planted wrong variants were refused: `sorry`, a new axiom, and the statement with the exponential
factor dropped. Record:
https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c1.json

Disclosure: the statement was written by hand. The proofs were written by an AI agent (Claude, Anthropic) and decided in
a separate repository by the same operator. That separates author from checker, but it is not an independent second
party. Names and placement follow claimbox's layout; I'm glad to move them into `WordRAM/` and rename to the
library's conventions.

---

Notes for the operator (not sent):
- Before sending: rebase onto complexitylib main and rebuild. The pin 7c66eb71 may be behind.
- Their contribution rules: check CONTRIBUTING / UPSTREAM.md for the AI-agent PR format (their PRs carry a
  coordinator line).
