A new technical note, paper/eth-chain.pdf (v0.1, 4 pp): "A formal bridge from Anthropic's refutation of the Exponential Time Hypothesis to a standard multitape Turing machine". Every number in it is a macro read from the records.

The ETH model-gap lane, decided from pinned bytes:
- C2: Anthropic's ETHIsFalse (Mathlib FinTM2 on encClauses) implies ETH is false as complexitylib states it, on cslib's deterministic multitape Turing machine with the binary encoding of every formula (certs/eth-c2.json).
- The chain: Anthropic's eth/ proof, ported to complexitylib's Lean v4.36.0-rc2 (809 files, 762 unchanged, 47 edited, each listed), proves ETHIsFalse in the same environment, so no step from the proof to the standard machine crosses a version boundary (certs/eth-chain.json). nanoda accepts 77,276 declarations; leanchecker --fresh passes; lake comparator --paranoid accepts with six checkers; three planted variants refused.
- C1: ETH is false on the word RAM with O(log L)-bit words, from complexitylib's proof (certs/eth-c1.json).
- C1 and C2 judged by lake comparator --paranoid as well (certs/eth-comparator.json). D1: complexitylib's native proof, decided (certs/eth-cslib-d1.json).

What stays open: that complexitylib's ETH is the textbook ETH is a reading of a definition (the clause-by-clause reading is on the report); OpenAI's side crosses one Lean version boundary; the judge ran without its sandbox; the statements, the proofs (written with AI agents) and the checker have one author, so this is not an independent review.

Also: the FlashProve check (reports/flashprove.html, certs/flashprove-check.json), the census of public AI math claims (reports/ai-math-claims.html), and a security pass on the repository.

Machine-derived with Claude (Anthropic); not peer-reviewed. Report: https://carlostoledo.co/reports/eth-anthropic-chain.html
