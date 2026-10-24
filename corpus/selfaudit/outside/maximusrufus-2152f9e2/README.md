# Minimal boundary mutants: cert-machine EinsteinArena rows

Source: carlostoledo1891/cert-machine at 89247979bd0d570a3eb2389ef22308acf054864a (after `git pull`).

## Scope
- In scope: circles-rectangle, both rows. The constraints are the box (w + h <= 2) and every pair (d^2 >= (r_i + r_j)^2). Both are polynomial, so an exact-rational check is possible.
- Out of scope, with the reason:
  - heilbronn and min-distance-ratio: the score is the objective and there is no feasibility inequality to violate.
  - hexagon-packing: the vertices are cos/sin of degree angles, which are irrational, so no exact-rational checker exists. His decider uses intervals. These rows are UNTESTED here.
- circles/ours_2026 fails the strict reading on 45 constraints as published (44 pairs plus the box), so "exactly one fails" cannot start from its pinned bytes. Its base is a binary64 repair: every radius times lambda, rounded down. That base is strictly feasible, and his decider also says WITNESSED for it.

## Method (gen.py)
- For each base, take the two tightest pairs and the box in x and in y. Move one coordinate or radius by k numpy.nextafter steps, where k is the smallest value that makes the target fail. At k-1 the target holds; this was checked.
- The exact checker (fractions) reads the literals as the decimals they print, which is his convention, and also as the binary64 values they round to. A mutant is kept only if exactly the intended constraint fails under both readings.
- Platform verdict uses the binary64 replica of the 1e-9 rule that applied from 2026-03-26 to 2026-08-24. Under the exact rule in force since 2026-08-24, every mutant fails.
- His decider: run_his.js calls instruments/easota/decide.js circles(), the same path run-easota-ledger.js uses, on a temp copy in WSL. run-selfaudit-mutations.js only generates its own class-table mutants and has no way to take external ones.

## Results
| row | mutants | strict | platform 1e-9 | his verdict |
|---|---|---|---|---|
| circles/alphaevolve_2025 | 4 (2 pair, 2 box) | FAIL | PASS | REPAIRED (not certified), with the failing constraint correctly located |
| circles/ours_2026 (repair base) | 3 (2 pair, 1 box; box-x had no single-failure mutant) | FAIL | PASS | REPAIRED |

Candidate findings (strict FAIL that he certifies): **0**.

## Files and re-running
- `circles__<row>__BASE.json`: the starting point, in your `{"circles": [[x, y, r], ...]}` format; `circles__<row>__mNN.json`: the mutants. `MANIFEST.json` lists each change, its nextafter step count, the slack, both readings' verdicts and the sha256.
- Regenerate: `python gen.py <cert-machine>/corpus/easota/circles-rectangle` (needs numpy); this reproduces every BASE and mutant file byte for byte (MANIFEST.json here also carries the decider results).
- Decide: `node run_his.js <cert-machine root> .`; `his.json` holds the output at 89247979.
- Step counts: ours_2026 pair mutants 2 and 3 nextafter steps, its box mutant 138,825; alphaevolve_2025 has real slack, so its mutants needed 1.1e8 to 7.8e8 steps. Each is the smallest single-value move that breaks exactly one constraint.

## Provenance and licence
BASE coordinates are copied from carlostoledo1891/cert-machine (MIT) at 89247979: corpus/easota/circles-rectangle/alphaevolve_2025.json (AlphaEvolve V2, Georgiev et al., arXiv:2511.02864, via Einstein Arena's baselines) and ours_2026.json (the cert-machine corpus packing), the latter scaled as described above. The mutants, MANIFEST.json, gen.py and run_his.js are released under CC0.
