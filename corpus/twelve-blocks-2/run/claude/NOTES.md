# Claude track, run twelve-blocks-2: what is in this folder

Sites and colours are labelled throughout; nothing is quotiented by reflection or colour exchange.
M(s) = number of monochromatic triples (a, a+d, a+2d), d ≥ 1, in 1..n. V(n) = min M. f(n) = 117n²/2192 − n/2.
A(n) = (117n² + c_r)/2192 − n/2, r = n mod 1096, c_r from run 1's table (`inherited/run1/gpt/optimum-residues.json`).

## 1. Exact values of V(n), with certificates (part 2) — COMPUTED, exact, unconditional

**Method.** 4M(x) = T + Σ_{i<j} w(i,j) x_i x_j, x ∈ {±1}ⁿ, w(i,j) = number of triples containing i and j, T = ⌊(n−1)²/4⌋.
On a cube (some sites fixed, the rest free) this is c0 + b·x + Σ w x x in the free signs; if the integer matrix A
(A₀₀ = U₀, A₀ₖ = D·b_k, A_kk = U_k, A_kl = D·w) is positive semidefinite then 4M ≥ T + c0 − ΣU/(2D) on the cube.
A certificate is a list of cubes that fills {R,B}ⁿ with one integer vector U per cube. Format and proof of soundness:
`CERT-FORMAT-V.md` (one page; addendum: the field `within` for a lower bound on a sub-cube).

**Results.** `V-table.json`: V(n) for every n = 1..95 (TABLE88, TABLE92, TABLE94: CERTIFIED by the control room; V(95) proposed last); lower bound `certs/V{n}-ge-{V}.json`, upper bound a colouring
(`upper-1-95.json`). New: V(46..95) = 90, 95, 100, 104, 110, 114, 119, 124, 130, 135, 140, 146, 151, 157, 163, 169, 174,
181, 187, 194, 200, 207, 214, 220, 228, 234, 241, 248, 256, 263, 270, 278, 286, 294, 302, 310, 318, 326, 335, 343, 352,
361, 370, 379, 388, 397, 406, 416, 425, 435. For n ≤ 45 the same method reproduces OEIS A121385. Nothing is used but the definition: no October result, no
earlier V(k), no symmetry.

**Every one of these values equals A(n).** (Part 3, third bullet, in value, as far as an unconditional method reaches.)

**How far the method goes.** Cubes per file: 32 at n = 46, ~200 at 60, ~400 at 70, ~900 at 87, ~2,000 at 89-93 (15-18 minutes each on one core). The root
gap of the plain diagonal bound is about 0.0012 n² (87.1 against 90 at n = 46; 15,384.39 against 15,756 at n = 548,
gpt's SDP548ROOT / ROOTLIMIT, which my solver confirms in floats). It will not reach n = 548 by branching alone.

Files: `gen_cert.py` (search in floats, every leaf pre-checked in integers), `check_cert.py` (standalone exact checker,
standard library), `make_table.py`, `planted/` (seven wrong versions of the n = 46 file, all refused), `lpmodel.py`
(the LP plan that failed: root bound V(n−1)), `dfs1.c` (plain search with a forced-triple bound: ~10⁹ nodes at 46).

## 2. Unconditional pieces at n = 548 (sub-cube certificates) — COMPUTED, exact

- `certs/W-unit-final-ge-15756.json` (UNITFINAL, CERTIFIED): every colouring of 1..548 that agrees with B₁ outside
  the eleven windows (b−2, b+2] and the sites 31, 32, 517, 518 has M ≥ 15,756 = M(B₁). 48 free sites, 82 cubes.
- `certs/W-m1-R2-ge-15756.json`: the same for the 44 window sites alone, 79 cubes.
- `certs/W-unit-count.json` (UNITCOUNT, CERTIFIED): in that same cube exactly 51 colourings have 15,756 and every other one has
  at least 15,757 (2,260 cubes + 51 listed colourings, `unit-51.json`; format addendum 2, `exceptions`).
These decide the last step of gpt's UNIT, value and count, by a method that shares nothing with the 22-charge enumeration.
With the exclusion of the exterior (gpt's UNIT / FINITE548): V(548) = 15,756 with 102 labelled minimisers.

## 3. Reviews of gpt's localisation (part 1 and part 3) — what I recomputed

All "exact" items use run 1's claude-track rebuild of the October inner file (`inner_model.py`), never gpt's code.

| gpt claim | my check | file |
|---|---|---|
| LOCAL75 Lemma 3: E ≥ μ²/C for μ ≤ 1/D, five rows | exact: linear identity, P ≻ 0, five tangent values | `review_local75.py` |
| LOCAL75 Lemmas 6, 7, 9 arithmetic | exact, from the text | `review_arith.py` |
| field envelope, local formula, distances 6 and 3 | exact | `review_geometry.py` |
| inequality (1) + Lemma 3 on real colourings, n ≥ 20,700 | bit counts, 180 adversarial colourings, 0 violations | `ineq1_scale_test.py` |
| M(C_n) − f(n) periodic, max 1453/137 | bit counts at 1,096 lengths 20,700..21,795 | `rounded_scale_test.py` |
| JUMPS: translation and reflection of jumps | bit counts: 0 failures in 1,160; fails outside the hypotheses | `jump_test.py` |
| ALL-SCALES-EXCEPT-ONE (m ≥ 2): three rounds of box bounds | exact replay, H ≻ 0, g from the definition of R_n | `review_scale.py` |
| UNIT (m = 1): 120 box operations | exact replay: only {31,32}, {517,518} survive, ≤ 1 flip each | `review_unit.py` |
| FINITE548: the bridge without the paper lemmas | exact: (F1), (F2) on both grids, identity for 16M | `review_finite548.py` |
| FORMULA15756 arithmetic and maps at W = 115/2, 5/2 | exact arithmetic; bit counts, 0 failures in 720 | `review_15756.py` |

**Weakest steps, as I see them.**
1. One object carries everything conditional: the October inner identity together with E ≥ L₀. gpt's new rows use the
   multipliers λ as information, not slack. At n = 548 the bridge E ≥ L₀ is now a finite fact (F1, F2); for general
   n it is still a paper lemma (bathtub + cut rectangles), read by both tracks, checked by no machine.
2. The four slab certificates are used only to force μ < 1/5 (or k < 283); I did not replay them in this run.
3. Not touched by any check of mine: the numbers of minimisers other than the 51 at n = 548 (the 2 at even m, the
   table's counts) and run 1's all-m window classification, on which V(548m), m ≥ 2, still rests.
4. The true local constant is 1/81.79 (`local_constant.py`), against 1/166 from the certificate; the −k from R_n and
   this constant are what keep the general-n cutoff at 15,756.

## 4. Where the question stands (my reading)

- V(n) ≤ A(n) for every n ≥ 1: unconditional (gpt ALLUPPER; I recounted n ≤ 112).
- V(n) = A(n): unconditional for n ≤ 95 (TABLE94 and V(95)) and n = 548 (FINITE548, read once); conditional on the October
  certificates for n = 548m, m ≥ 2, and for every n ≥ 15,756.
- OPEN: the lower bound V(n) ≥ A(n) for 96 ≤ n ≤ 15,755 off the multiples of 548.
- An attack on that range that failed (`attack_formula.py`, `anneal.c`; a heuristic, no bound): simulated annealing
  from the table's colouring and from random colourings, every n = 93..700 and 40 sampled lengths up to 1,776 (`logs/attack-*.txt`):
  never below A(n), and a random start lands exactly on A(n) at every one of the 648 lengths.
