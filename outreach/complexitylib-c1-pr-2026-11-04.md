# DRAFT — complexitylib PR: TM → word RAM at logarithmic word size, bounded by space (C1), and the TM2 bridge (C2)

Status: DRAFT, not sent. Sending is the operator's word (one PR from carlostoledo1891 to cslib-community/complexitylib).
The source is claimbox lean/eth-bridge at 235fbfa (EthBridge/WordRAM/* for C1, EthBridge/Anthropic/* for C2), decided in
cert-machine certs/eth-c1.json and certs/eth-c2.json. The operator chose on 11-04 to send C1 and C2 together. One PR or
two is their call; the body below is one PR in two parts. C2's MainResults.lean is Anthropic's file. anthropics/formal-math is Apache-2.0,
and so is complexitylib (both checked 11-04), so vendoring it is licence-compatible with its NOTICE kept. Their maintainers may still prefer
the TM2 pieces (5–7) alone, with the Anthropic corollary left in claimbox.

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

**Part 2 (C2): a uniform one-step certificate for TM2, and a bridge from Mathlib's FinTM2 statements**

5. `DegreeStep.stepTotalD`. One step of any TM2 program is `ComputableTidilyInDegree … 1 1`: a degree-one certificate,
   the same for every program. The existing `stepTotal_polyTime` / `run_polyTime` give a polynomial whose degree depends on
   the program, which is circular when the program is chosen after δ (as in any 2^{δn} argument).
6. `DegreeRun.runBitD`. A t-step run as a degree-two fold over a unary clock `(w, t)`, with `runBit_eq` tying it to
   `TM2OutputsInTime`.
7. `Prep.prep` / `Words.prep_polyTime` / `Prep.prep_spec`. `encCNF` → (dense relabel, `eraseDupsBy`) → `encClauses 3`,
   in polynomial time, preserving satisfiability and Nodup.
8. Corollary `not_eth_of_ethIsFalse`. Anthropic's `MainResults.ETHIsFalse` (FinTM2 on `encClauses`) implies
   `SubexponentialSATAbstract.ETH` is false.

Checks for part 2: `#print axioms` shows the three standard axioms only. nanoda accepts all 23,430 declarations beneath
the corollary. `leanchecker --fresh` passes. Three planted variants were refused: `sorry`, a new axiom, and the hypothesis
replaced by the conclusion. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c2.json

Disclosure: the statements were written by hand. The proofs were written by an AI agent (Claude, Anthropic) and decided in
a separate repository by the same operator. That separates author from checker, but it is not an independent second
party. Names and placement follow claimbox's layout; I'm glad to move them into `WordRAM/` and rename to the
library's conventions.

---

Notes for the operator (not sent):
- Before sending: rebase onto complexitylib main and rebuild. The pin 7c66eb71 may be behind.
- Their contribution rules: check CONTRIBUTING / UPSTREAM.md for the AI-agent PR format (their PRs carry a
  coordinator line).
