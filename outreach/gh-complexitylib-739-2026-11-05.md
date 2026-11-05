# Comment on cslib-community/complexitylib#739 — before the two PRs (2026-11-05). Send on the operator's word for this text.

---- PASTE ----
I'd like to offer two small PRs for the TM ⇒ RAM direction here, and ask first whether you want them.

1. **Space-bounded TM ⇒ word RAM at logarithmic word size.** #2027's simulator bounds simulated addresses by the running time, so the logarithmic-word inclusions need polynomial time. A variant bounds them by the work space instead (`executes_simProgram_of_runsInSpace`; #2027's proof with that one step changed, credited to Samuel Schlesinger in the file). With it, `uniformDecidableInTimeLogWord_of_decidableInTimeAndSpace` turns any multitape decider with polynomial work space into one fixed additive-basis program at logarithmic word size. Applied to the native model counter, `uniformDecidableInTimeLogWord_KSAT k` follows: for every δ > 0, k-SAT runs in c·⌈2^(δn)⌉·(L+1)^e + c instructions on the log-word RAM. For k = 3 this is ETH failing on the word RAM; I left out a separate ETH-on-RAM definition, since the library has one ETH.
2. **TM2 steps in a degree that does not depend on the program.** `Turing.TM2.stepTotal_computableInDegree` gives one step of any TM2 program in degree one, uniformly in the program. `runBit_computableInDegree` gives the clocked run as a degree-two fold. These are stated in the plain `ComputableInDegree` calculus. The existing `stepTotal_polyTime` has a program-dependent degree, which is circular when the program is chosen after δ.

Both are built on main at b28df563, and pass `lake build --wfail`, `lake test`, `lake lint`, `lint-style`, `mk_all --check` and your hygiene, tidy-surface and duplicate-definition scripts. Axioms: propext, Classical.choice and Quot.sound only.

Disclosure: I wrote the statements; the proofs were written by AI agents (Claude, Anthropic) under my direction, first in my own repository, where my own tooling checked them with nanoda, leanchecker --fresh and lake comparator --paranoid (https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-c1.json, eth-c2.json, eth-comparator.json). That is the same author on both sides, not an independent review. The code in the PRs is renamed and generalized from those versions, and I re-checked the exact branches before opening anything.

If this fits the plan for #739, I'll open them as two separate PRs; if you'd rather place or name things differently, I'm glad to follow.
