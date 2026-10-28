**Title:** I connected OpenAI's and Anthropic's ETH refutations in Lean: one theorem, two independent proofs, standard axioms only, replayed in nanoda

Two days ago OpenAI and Anthropic each said an internal model had refuted the Exponential Time Hypothesis. Both published Lean formalizations. I spent a day on them. Here is what I found and what I built.

**Reproduction.** Both proofs build from their public repos (Lean 4.33.1 and 4.34.1, their pinned Mathlib). Both main theorems depend only on `propext`, `Classical.choice`, `Quot.sound`. No `sorry` outside the intentional comparator challenge files. Anthropic's passes their own acceptance script, which diffs the theorem statement against a trusted file and replays the whole dependency closure in the independent `nanoda` kernel. I also brute-force checked the eight-square identity their recursion rests on, the rank structure of their crossing decomposition at λ = 3 and 6, and the balancing lemma at the paper's own parameters. All held.

**The gap.** The two results did not touch. OpenAI's Lean theorem says a specific tape machine counts #k-SAT within (L+1)^O(1)·2^O(n(loglog n)²/√log n) steps; the step to "ETH is false" is prose in their paper. Anthropic's Lean states ETH itself as s₃ > 0 on Mathlib's multi-stack machines, in a 150-line file that imports only Mathlib, and proves its negation.

**The bridge.** I proved, in Lean, that OpenAI's formal claim implies Anthropic's formal `ETHIsFalse`:

```
theorem Bridge.ethIsFalse_of_claim : OpenAI.Claim → MainResults.ETHIsFalse
theorem Bridge.two_proofs_one_statement :
    MainResults.ETHIsFalse ∧ (OpenAI.Claim → MainResults.ETHIsFalse)
```

Both depend only on the three standard axioms, and the bridge passes Anthropic's comparator bar: statement identical to a challenge file that imports only the two labs' statement files, replayed by Lean's kernel and by nanoda.

How: OpenAI's primitive multi-tape machine becomes one of Anthropic's "stepped" computations, written in combinator form so Anthropic's `fun_prop` library proves its steps polynomial-time. Its step is proved sound against Mathlib's `Turing.Tape`. An invariant shows my tape representation's spans equal OpenAI's own "visited cells" bookkeeping, which is exactly why OpenAI proved a polynomial space bound: it bounds the state size that Anthropic's compiler to FinTM2 needs. A polynomial-time re-encoding (insertion sort and lexicographic order, in combinator form) maps Anthropic's input code to OpenAI's canonical one. Then n(loglog n)²/√log n is o(n), the constants are chased into A·2^(δn) for every δ, and Anthropic's own theorem turns that into ¬ETH.

**What this means.** "ETH is false" now has two independent machine-checked derivations, different labs, different mathematics (tensor networks and the octonion identity on one side, polynomial interpolation through shared linear measurements on the other), ending at one formal sentence. The only thing left to trust is that file, plus the Lean kernel.

**What it does not mean.** No machine checks that `MainResults.lean` means ETH. I read it line by line and believe it does; a complexity theorist should too, and it is the most useful hour anyone can spend on this. The result is purely asymptotic: by Anthropic's own numbers, the algorithm beats brute force only past 10^10000 variables. P vs NP is untouched.

**One thing that fell out.** I tried to go further and restate OpenAI's algorithm in Anthropic's "(K, e) achievable" vocabulary, so the proofs would share a lemma rather than a conclusion. It is blocked for a formal reason: Anthropic's Lean definition of achievability requires polynomial memory with query access to the tables, and OpenAI's algorithm is polynomial-space only in its written input, which is exponential once the tables are expanded. The algorithms differ in a formal property the papers never state side by side.

Repo, build commands, and the one file to read: https://github.com/TSavo/eth-bridge
