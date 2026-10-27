# Verification code and data for Optimization Constants contributions

This repository holds only the certificates, checkers and data that back contributions to Terence Tao's
[Optimization Constants in Mathematics](https://github.com/teorth/optimizationproblems) repository, following its
CONTRIBUTING rule that supporting code and data live outside that repository. Each folder is self-contained, and each
pull request there links a pinned commit here.

| Folder | Constant | What it supports |
|---|---|---|
| `c5b-erdos757-small-n/` | C_5b (Erdős problem #757) | Exact values f(n) for 6 ≤ n ≤ 15 and n = 17, 19, 21: explicit (4,5)-sets plus an exact checker |
| `c31-chvatal-sankoff-replay/` | C_31 (Chvátal–Sankoff, binary) | Independent replay of Lueker-automaton upper bounds (h = 8, 9, 10, all certified) |
| `c84b-sum-product-check/` | C_84b (sum-product exponent, Erdős #52) | Interval-arithmetic recheck of the [Al26] constant: c ≈ 0.000706 at the note's parameters, below 0.000714 at the regulator limit, so 0.000719 is not reached |

Related: the Ramsey certificate for R(3,33) ≥ 241 is archived separately on Zenodo, doi:10.5281/zenodo.23552014.

## AI use

The code, checkers and notes here were developed with Claude Code (Anthropic) under the direction of Satyajeeth
(Jeetu) Suresh Kannan. Every claim rests on finite data that the included checkers re-verify from the definitions.

Code: MIT. Data and text: CC BY 4.0.
