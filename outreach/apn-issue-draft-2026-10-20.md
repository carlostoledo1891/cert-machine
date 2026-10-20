# AlphaProof Nexus — issue draft, NOT SENT (2026-10-20)

To google-deepmind/alphaproof-nexus-results (an issue). **Send only on the operator's word.** Evidence:
https://carlostoledo.co/reports/alphaproof-nexus.html and certs/apn-statements.json, certs/apn-kernel.json, certs/apn-oeis.json
at cert-machine `<COMMIT>`.

---

**Title:** Independent replay of the published proofs (all hold) — and four notes on the OEIS results

Thank you for publishing the Lean proofs. We replayed every published Erdős proof, and the corrected #741(i) that formal-conjectures links (PR #3778's commit), with Comparator against formal-conjectures' own statement at the commit this repository builds against (7862bf6a), and through both Lean's kernel and nanoda. All ten pass: each proves exactly that statement, with propext, Quot.sound and Classical.choice only. A weakened challenge and a `sorry`-ed solution were rejected, as they must be. Details and re-run commands: https://carlostoledo.co/reports/alphaproof-nexus.html.

Four notes on the OEIS results, offered for checking:

1. **A382590.** `kth_prime_factor` reads `primeFactorsList`, so it counts prime factors with multiplicity. The conjecture's source (MathOverflow 490330) counts distinct primes: its example for the second prime factor is the cycle (3, 5, 7). With multiplicity the statement is degenerate: from the file's own recurrence, the 2-adic valuation of a(n) is 7, 6, 10, 21, 27, 44, … for n = 7, 8, 9, …, so the k-th prime factor is eventually the constant 2.
2. **Earlier proofs on record.** OEIS records a proof of A325046's conjecture by Sela Fried (edit approved 17 Dec 2025), Terence Tao's accepted MathOverflow answer for A382590 (31 Mar 2025), and, for A237271, the equivalent A384149 conjecture proved by Hartmut Hoft (11 Jan 2026) — all before the preprint.
3. **A237271.** The file defines `a` by Conjecture 1's characterization (OEIS: proved Jan 2025) rather than the parts of the symmetric representation of σ; given that, the theorem reduces to an elementary divisor fact (for consecutive divisors d < d′, d′ > 2d forces d′ odd).
4. **Count.** The paper counts 44 OEIS proofs; the repository publishes 38. If the other six can be published, we would replay them the same way.

*Prepared with AI assistance (Claude); every number is read from the pinned records at the commit cited.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
