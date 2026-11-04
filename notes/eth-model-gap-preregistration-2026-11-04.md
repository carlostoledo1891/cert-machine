# ETH: the machine-model gap — pre-registration, 2026-11-04

Written before any build. The operator's word (2026-11-04): "Push claimbox + AI to the limit and verify the claims …
something that closes the gap, and if not close the full gap, is honest about what's missing"; rented compute allowed,
the budget reported. Roles: claimbox and its AI agents author any new proof (the claimant); cert-machine decides it
from pinned bytes. The same operator owns both, so a decision here is a separation of roles, not a second party.

## Where the gap stands today (the scouts of 2026-11-04, with sources)
- Both labs' proofs check against their own statements (certs/eth-kernel.json: two kernels each).
- OpenAI's `exact_count_and_sat` ⇒ Anthropic's `MainResults.ETHIsFalse` is kernel-checked inside OpenAI's Lean 4.34.1
  / Mathlib d13f23b7 (Hawkley's chain, certs/eth-hawkley-bridge.json + certs/eth-hawkley-heavy.json, nanoda on). The
  seam to Anthropic's environment (Lean 4.33.1, Mathlib 0df444a3) is READ, not decided (certs/eth-seam.json).
- So both statements reach ONE model: Mathlib's `FinTM2` on Anthropic's `encClauses`. What stays prose (B1′, B2′):
  that a textbook machine runs a FinTM2 machine with polynomial overhead, and that a textbook 3-CNF is written as
  `encClauses` in polynomial time.
- CSLib's complexitylib (Lean v4.36.0-rc2; built by AI agents, reviewed by an AI reviewer) re-proved OpenAI's
  Proposition 6.4 route natively: ¬ETH on cslib's deterministic multitape Turing machine with the binary encoding
  `encCNF` (PR #1338, merged 2026-10-27, 6789daf6), and separately "word RAMs simulate multi-tape Turing machines in
  linear time" (PR #2027, merged 2026-10-31, 1b7d62a8). Nobody has composed them (their issue #739 is open), and
  neither starts from either lab's own statement.
- Mathlib's machine reductions (TM2to1, TM1to0) prove correctness only, with no step counts.

## What is attempted, in order
- D1. DECIDE complexitylib's ¬ETH (#1338) at its merge commit: build, our own `#print axioms` file, nanoda on a
  lean4export of the headline theorems, leanchecker; and a statement reading of cslib's machine, time measure and
  `encCNF` against the textbook (Impagliazzo–Paturi; Garey–Johnson reasonable encodings). Expected: CERTIFIED with a
  reading. A non-standard axiom (their audit names "two foundations") is reported as found.
- C1. COMPOSE (claimbox): ¬ETH on cslib's word RAM, from #1338 and #2027, inside complexitylib's environment.
  Expected: small; it closes the model step for the RAM reading of "algorithm".
- C2. BRIDGE (claimbox): a FinTM2 machine on `encClauses` is simulated by a cslib multitape TM on `encCNF` with
  polynomial overhead, and the transfer theorem over our generic `Model` (s in the target ≤ s in the source), giving
  Anthropic's `ETHIsFalse` ⇒ cslib ¬ETH. With Hawkley's chain, both labs' own statements then reach cslib's standard
  machine and, with C1, a word RAM. Expected: the hard part; partial progress is reported as the exact lemma left.
  Reusable pieces named by the scout: Anthropic's `PolyT` library (eth/proof/machines/ToTuring), OpenAI's
  StackAdapter (FinTM2 → PrimitiveMachine, the other direction), RBarish-UTokyo/NPCompleteness-Lean4's counted
  stack↔tape simulations.
- S. THE SEAMS: every cross-version step names the definitions its statement depends on and measures them across the
  versions (the eth-seam method). A seam not decided is printed as read.

## What cannot be closed, said in advance
That a formal definition of ETH (ours, cslib's, a lab's) is the textbook ETH is a reading of a definition and stays one.
The best outcome makes it a reading of a standard multitape machine and a word RAM with a reasonable binary encoding.

## Decision and stop rules
- cert-machine decides every new theorem with Lean's kernel at build, Comparator where a challenge file exists, nanoda
  and leanchecker --fresh; axioms exactly propext, Classical.choice, Quot.sound or the finding is printed.
- Every claimbox theorem ships with planted wrong variants (a weakened bound, a swapped encoding, an extra hypothesis)
  that cert-machine must refuse (claimbox commitment 7).
- No result is re-run to change it; a platform failure is re-run and recorded as such.
- Budget: CPU pods (RunPod cpu3m) for builds, reported as they bill; a soft cap of US$80 for this effort before asking.
- Nothing is posted without the operator's word. The outcome goes to /eth/ and to the census report, gaps first.
