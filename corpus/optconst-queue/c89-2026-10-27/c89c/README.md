# Ramsey multiplicity constant of K₆: upper bound 0.7422548616 · 2⁻¹⁴

**Result.** The step graphon in `construction.json` has 1024 equal blocks indexed by the subsets x of {1,…,10},
and red probability n[|x Δ y|] / 2²⁰ between blocks x and y, where n[0] is the density inside a block:

    n = [1048576, 461327, 0, 1048576, 1048576, 13579, 0, 1048576, 1048576, 0, 799568]   (D = 2^20)

Its monochromatic-K₆ density is exactly

    180244428715156181493112659521741405180580225001966676111887908798425648907356856409 /
    3978585891278293137243057985174566720803649206378781739523711815145275976100267004264448
    = 4.530364145468903…e-5 = 0.742254861593625… · 2⁻¹⁴

so c₆ ≤ 0.7422548616 · 2⁻¹⁴. The previous best is c₆ ≤ 0.7445 · 2⁻¹⁴ (Franek, Combinatorica 22 (2002), exactly
51162598917 / 2⁵⁰ = 0.744513802303 · 2⁻¹⁴; Deza, Franek and Liu, J. Discrete Algorithms 17 (2012)). Both come from
blow-ups of Franek's Cayley graph on Z₂¹⁰ (x ~ y iff |x Δ y| ∈ {1, 3, 4, 7, 8, 10}, red inside blocks). This is 0.30%
lower.

**Construction.** Franek's graph is the case n ∈ {0, D}. Keeping its full symmetry (translations and coordinate
permutations), the red probability depends only on the Hamming weight, which leaves 11 parameters.
`opt11.py` runs L-BFGS-B over them from Franek's point, and the optimum is rounded to multiples of 2⁻²⁰.

**Exact evaluation.** Fix x₀ = 0. A 5-tuple (x₁,…,x₅) is a 10 × 5 0/1 matrix, determined up to the multinomial
count by its multiset of 32 column types; every pair weight is a count of columns. So
c₆ = Σ_multisets (10!/∏cₜ!) [∏ n(w) + ∏ (D − n(w))] / (1024⁵ D¹⁵), over C(41,10) ≈ 1.1 × 10⁹ multisets. Two separately
written C programs compute the integer numerator modulo 61-bit primes, and `certify6.py` combines them by CRT (6 primes,
plus 1 check prime):

- `c6.c` (`exact` mode): DFS over multisets, incremental weights, 4 threads.
- `check6.c`: iterates over count vectors directly and recomputes the 15 weights from scratch at each leaf. It shares
  no code with `c6.c`.

Both give the fraction above exactly (`results/cert_c6.txt`, `results/cert_check6.txt`). Both reproduce Franek's
51162598917 / 2⁵⁰ from his parameters, and give exactly 2⁻¹⁴ for n ≡ D/2.

```bash
cc -O3 -o c6 c6.c -lpthread && cc -O3 -o check6 check6.c
```

```bash
python3 certify6.py check6 1048576 1048576 461327 0 1048576 1048576 13579 0 1048576 1048576 0 799568
```

The check6 run takes about 20 min single-threaded (`c6` about 2 min).

AI use: search and checkers written with Claude Code (Anthropic) under the direction of Jeetu SK.
