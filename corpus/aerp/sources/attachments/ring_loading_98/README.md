# Ring Loading constant: lower bound C ≥ 9/8

AlphaEvolve repository, Problem 61 (Section 6.41 of arXiv:2511.02864).

Previous lower bound: 47/42 ≈ 1.1190476 (AlphaEvolve found an instance with value 1.1190475…, 2025; exact rational certificate for 47/42 by Vividh Yadav in issue #11 of the repository, 2026). Before that: 11/10 (Skutella 2016), 101/100 (Schrijver–Seymour–Winkler 1998).
Best upper bound: 13/10 (Däubel, SIAM J. Discrete Math. 2022).

## Certificate (m = 14, all values are multiples of 1/16)

| i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|----|----|----|----|----|
| 16·u_i | 6 | 3 | 12 | 8 | 2 | 11 | 4 | 5 | 12 | 8 | 2 | 13 | 2 | 12 |
| 16·v_i | 2 | 13 | 2 | 8 | 12 | 5 | 4 | 11 | 2 | 8 | 12 | 3 | 6 | 4 |
| 16·(u_i+v_i) | 8 | 16 | 14 | 16 | 14 | 16 | 8 | 16 | 14 | 16 | 14 | 16 | 8 | 16 |

All u_i, v_i ≥ 0 and u_i + v_i ≤ 1. For every one of the 2^14 choices z_i ∈ {v_i, −u_i} there is
a k ∈ {1,…,m} with |Σ_{i≤k} z_i − Σ_{i>k} z_i| ≥ 18/16 = 9/8, and 52 choices attain exactly 9/8.
Hence C ≥ 9/8 = 1.125.

The notebook in the AlphaEvolve repository uses k = 1..m−1; under that convention the unpadded instance has value only 3/4.
Adding a (0,0) pair at both ends (`min98_m14_D16_pad.txt`, m = 16) makes the two conventions agree; its value is again 9/8.
(One `get_score` version in the notebook also has search heuristics such as `min(u) < 0.05 → −1` that reject the padded instance; `compute_alpha_exact` is the actual evaluation.)

## Files

| File | What it is |
|---|---|
| `ring_loading_9_8.pdf`, `.tex` | Short note: statement, certificate, proof, how it was found |
| `verify_9_8.py` | Self-contained check with exact fractions, both conventions (~4 s) |
| `indep_check.py` | Independent brute force: `python3 indep_check.py min98_m14_D16.txt 16` |
| `deepmind_check.py` | `compute_alpha_exact` copied verbatim from the AlphaEvolve notebook: `python3 deepmind_check.py min98_m14_D16_pad.txt 16` → 1.125 |
| `min98_m14_D16.txt` | The certificate, integer pairs `16u 16v`, one per line |
| `min98_m14_D16_pad.txt` | Same with (0,0) at both ends |
| `rec98_D16.txt`, `rec98_D16_pad.txt`, `A17_exact_D560.txt` | Earlier, larger certificates of 9/8 (m = 15 on 1/16; m = 17 on 1/560) |
| `github_issue.md` | Text for a GitHub issue in the AlphaEvolve repository |
| `pr_problem61.patch` | Optional patch for a pull request (status + bounds table on problem 61) |
| `code/` | C checker (`check.c` + `dp.c`: DP and brute force, both conventions) and the search code; see `code/BUILD.md` |

## Verification

The value 9/8 was confirmed by four independent methods: exact rational enumeration (Python),
integer enumeration (C), an exact dynamic program (C), and DeepMind's own
`compute_alpha_exact` on the padded instance.

    gcc -O2 code/check.c code/dp.c -o check && ./check min98_m14_D16.txt 16

## How it was found

Simulated annealing on the grid 1/84 over palindromic instances with full pairs at alternating
positions (exact DP evaluation) reached 47/42 for m = 17–21. Continuous sequential-LP refinement
of the best annealing outputs then lifted several of them to exactly 9/8 (9/8 = 94.5/84 is not on
that grid). Rationalization and deletion of redundant pairs gave the m = 14 instance; its first 13
pairs are palindromic. A trust-region MILP suggests (numerically, not a proof) that no instance within
ℓ∞-distance 0.02 exceeds 9/8. Deleting any single pair drops the value to ≤ 1; the best value found
by re-optimizing those 13-pair instances was about 1.094.
