# The first four claims through the public form (cert-machine #3–#6): pre-registration, 2026-11-08

Written and committed BEFORE any code of ours computes anything from the claimants' values. Nothing is posted, commented
or pushed by the session that writes this; the orchestrating session reviews, and the operator decides each reply.
Later changes are dated amendments appended at the end, never edits above them.

The form (`.github/ISSUE_TEMPLATE/claim.yml`) promises one of three verdicts in public whichever way it falls:
CERTIFIED with a certificate that re-runs on stock Python without this engine, REFUTED with the falsifying witness
printed, or REFUSED with the reason; a claim that is not finitely many exact facts is refused; the claimant's code is
never run. All four were filed 2026-11-06 by maximusrufus.

## What was looked at before this note (and what was not)

Read: the four issue bodies in full; ThetaEvolve's `README.md` at the pin (sha256
`30246d5e1e0d22d55310c70f9a965a2395291a06a159b11444c310b067120644`) and `LICENSE` (Apache-2.0, sha256
`bf917707c1e0ffdfe653d63aebc188a48f738f3faad9acc188c346d3618694af`); arXiv:2511.23473v1 (PDF sha256
`8e74933b2a4dddbf80a063fb88438c95b62b982a5167bbb77213ce1e3839715d`) — §3.3 note (1), Table 2 and its caption, Appendix
A.1–A.3; EinsteinArena's statement of problem 7, the `description` field of `GET /api/problems/prime-number-theorem`
fetched 2026-11-08 00:3x UTC (file sha256 `5e97cd89a653836230688934cdf92681e546ade47f0e2b2fad18b79ac3d2e20d`).
Of the data files, the STRUCTURE only: entry names and list shapes (below), the 2000 keys of the PNT object (minimum 2,
maximum 127849, no key "1", all decimal integers), the first ~200 bytes of each ThetaEvolve file and the first ~1,500
of best-7.json as printed by `head` (they show f(k) ≈ ±1.0001 on the first squarefree keys). No value was computed.

Never read, never fetched, never run: ThetaEvolve's `vis.py` files, its `programs/` folders and every evaluator in that
repository; OpenEvolve's and ShinkaEvolve's evaluators; the `verifier` field of the EinsteinArena API record (its
bytes are held, unread, inside the pinned file); EinsteinArena's verifier sources for problem 7.

## The pins

- ThetaEvolve `github.com/ypwang61/ThetaEvolve` at `7c12898f5d7627af403e3aca643af76199fb5c20` (the issues' `7c12898`;
  merge of PR #7, 2026-02-27T06:07:12Z), fetched from raw.githubusercontent.com at that commit:
  - `Results/CirclePacking/data.json`, 14,296 bytes, sha256
    `c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8` — equal to the value stated in #3 and #5.
    Five entries: `AlphaEvolve` (26 × [x, y, r]), `Init` (26 × 3), `8B-w_RL@65` (26 × 3), `8B-w_RL@65-Formal`
    (2 × 26 × 2), `ShinkaEvolve` (26 × 3).
  - `Results/SecondAutoCorrIneq/data.json`, 71,625 bytes, sha256
    `3d453b729f5913e7f686e1386c5351fb90a2f434910604c6199ad39905a3cb4b` — equal to the value stated in #4.
    Four entries: `AlphaEvolve-v1` (50 values), `StrongInit` (1024), `8B-w_RL@65` (3072), `8B-wo_RL@100` (2048).
  Both are held verbatim in `corpus/claims-intake/inputs/` with the licence beside them.
- EinsteinArena solution 2506: `corpus/einstein-arena/best-7.json` (pinned 2026-10-02 by this repository), sha256
  `5382b697a7920edd92edc8c4770441925042bde3d3719456e84f248fbb8bd333` — equal to the value stated in #6. Its own fields:
  id 2506, agentName CodexProLong, score 0.9976572852677297, createdAt 2026-08-15T03:29:34.305Z.
  The statement: `corpus/claims-intake/inputs/einstein-arena-api-problems-prime-number-theorem_2026-11-08.json`.

## Exactness (all four)

Every number is read as the decimal LITERAL the file carries (a JSON reader that keeps numbers as text), and the
literal is the rational. No float decides anything; floats may only screen, and a screen may only prune. Two
implementations that share no code: `tools/record-claims-intake.js` (Node, BigInt rationals; the writer of
`certs/claims-intake-2026-11-08.json`) and one standalone checker per claim, `corpus/claims-intake/issue-<n>/check.py`
(Python standard library, run with `python3 -I`, reading its pinned input and refusing on a sha256 mismatch). A
claim's verdict is CERTIFIED or REFUTED only when both reach it; a disagreement is REFUSED and reported. A bookkeeping
failure (pin, shape, coverage) is REFUSED, never REFUTED; REFUTED needs an exact fact (an exact inequality that fails)
or disjoint intervals. Every printed upper end is rounded up and every lower end down.

## #3 — 26 circles, entry "AlphaEvolve", "no overlaps, sum of radii = 2.63586276"

The claim, verbatim: "26 circles in the unit square, no overlaps, sum of radii = 2.63586276 (the AlphaEvolve
construction as stored under key "AlphaEvolve")".

Reading (fixed now): the entry is 26 triples (x_i, y_i, r_i). Decided exactly:
- radii: r_i > 0;
- containment in [0,1]²: r_i ≤ x_i ≤ 1 − r_i and r_i ≤ y_i ≤ 1 − r_i (touching a side allowed);
- no overlaps: for every pair, (r_i + r_j)² ≤ (x_i − x_j)² + (y_i − y_j)² (tangency allowed; interiors disjoint);
- the sum: "= 2.63586276" printed to 8 decimals is read as ROUNDING: |Σr − 2.63586276| ≤ 5·10⁻⁹. The truncation
  reading (2.63586276 ≤ Σr < 2.63586277) is decided and reported beside it; it does not decide the verdict.
Verdict: CERTIFIED iff all four hold. REFUTED iff any fails, the failing fact printed exactly (the pair or side and its
exact excess). REFUSED on a pin or shape failure. A REFUTED on an overlap refutes these bytes as a packing, not the
packing bound: the record then also reports the exact repair (every radius reduced by one δ, rounded up, so that every
constraint holds exactly) and its sum, so that what the bytes do prove is stated beside what they do not.
Reported always: Σr exactly (all digits), the tightest pair in squared form, (r_i + r_j) − d_ij enclosed to 10⁻³⁰ for
the tightest pair in distance form, the tightest side slack, the count of exact tangencies.

## #5 — 26 circles, entry "8B-w_RL@65", "no overlaps up to tolerance 1e-6 as stated in the source, sum = 2.6359857"

The claim, verbatim: "26 circles in the unit square, no overlaps up to tolerance 1e-6 as stated in the source, sum of
radii = 2.6359857 (key "8B-w_RL@65")".

The source's tolerance, read in the paper: Appendix A.1, "in the official OpenEvolve implementation, the evaluation
function uses an absolute tolerance of atol = 10⁻⁶ when checking the constraints"; §3.3 note (1), "permits a tolerance of
1 × 10⁻⁶ when checking whether circles overlap or lie outside the unit square"; the README: the entry was found "with
1e-6 tolerance as OpenEvolve verification", and the zero-tolerance construction is the separate entry
`8B-w_RL@65-Formal` (not claimed, not decided here).

Readings (fixed now), t = 10⁻⁶ exactly:
- **T (the claim's reading, decides the verdict)**: r_i > 0; r_i − t ≤ x_i ≤ 1 − r_i + t and the same for y; for every
  pair, r_i + r_j − t ≤ d_ij, decided exactly as: true if r_i + r_j − t ≤ 0, else (r_i + r_j − t)² ≤ d_ij². The
  tolerance is read in distance form (an absolute tolerance on the inequality as the paper states it); the squared-form
  slack is also reported so any other reading can be checked from the record.
- **S (strict, reported as a fact, does not decide #5)**: the same with t = 0.
- the sum: "= 2.6359857" to 7 decimals read as rounding, |Σr − 2.6359857| ≤ 5·10⁻⁸; truncation reported beside it.
Verdict: CERTIFIED iff T and the sum hold. REFUTED iff T or the sum fails (the failing fact printed). S failing does not
refute #5; the worst overlap under S is reported exactly whatever happens: the pair, its exact (r_i + r_j)² − d_ij², and
(r_i + r_j) − d_ij enclosed; the worst side excess exactly.
Information row (not a claim filed, the Table 2 caption's remark): with every radius reduced by exactly 10⁻⁶, does S
hold, and is the reduced sum above #3's exact Σr? Decided exactly and reported. Also the least uniform reduction δ*
that makes S hold, enclosed.

## #4 — the second autocorrelation inequality, entry "8B-w_RL@65" (3072 cells), "C2 ≥ 0.9469"

The claim, verbatim: "Second autocorrelation inequality: the step function stored under key "8B-w_RL@65" (3072
cells) gives C2 ≥ 0.9469".

The definition decided (arXiv:2511.23473 A.3, AlphaEvolve's): C2 is the smallest constant with
‖f∗f‖₂² ≤ C2 ‖f∗f‖₁ ‖f∗f‖∞ for every non-negative f; a non-negative f with Q(f) = ‖f∗f‖₂²/(‖f∗f‖₁‖f∗f‖∞)
proves C2 ≥ Q(f). The entry's n values a_0..a_{n−1} are f on n equal cells of any width h (Q is invariant under
scaling f, scaling x, and translation, so h and the interval are immaterial). Exactly, for a step function: with
c_k = Σ_{i+j=k} a_i a_j (k = 0..2n−2) and c_{−1} = c_{2n−1} = 0, f∗f is piecewise linear with f∗f(mh) = h·c_{m−1}, so
‖f∗f‖∞ = h·max_k c_k, ‖f∗f‖₁ = h²(Σa)² (f ≥ 0), ‖f∗f‖₂² = (h³/3)·Σ_{m=0}^{2n−1}(c_{m−1}² + c_{m−1}c_m + c_m²), and
  Q = Σ_{m=0}^{2n−1}(c_{m−1}² + c_{m−1}c_m + c_m²) / (3 (Σa)² max_k c_k),
a rational computed exactly from the literals. Conditions decided first: exactly n = 3072 values; every a_i ≥ 0;
Σa > 0.
Verdict: CERTIFIED iff the conditions hold and Q ≥ 9469/10000 exactly. REFUTED iff a value is negative (the bytes are
not in the inequality's domain; Q of max(f, 0) is then reported as information) or Q < 9469/10000. Reported: Q to 30
digits (floor and ceiling), the margin Q − 0.9469, the argmax of c, whether the printed 0.9469 is Q rounded or truncated.

## #6 — EinsteinArena solution 2506, "The Prime Number Theorem"

The claim, verbatim: "EinsteinArena solution 2506 (agent "CodexProLong", created 2026-08-15) to the problem "The Prime
Number Theorem": the submitted construction satisfies the problem's stated constraint and attains the score printed
for it, 0.9976572852677297".

The statement, as the platform prints it (description field, verbatim in the pinned file): the server "1. Clips all
values to [−10, 10]; 2. Adjusts f(1) so that Σ_k f(k)/k = 0 (normalization); 3. Draws 10⁷ random samples
x ∼ Uniform(1, 10·max_k k) and checks Σ_k f(k)⌊x/k⌋ ≤ 1 + 10⁻⁴ — if any sample fails, the solution is invalid;
4. Returns S(f) = −Σ_k f(k) log(k)/k", under the banner "Approximate verifier: The constraint is checked by random
sampling (step 3), not proved. Scores are not certificates: a passing solution may exceed 1 at unsampled points,
outside the sampled range, or by up to the 10⁻⁴ tolerance."

The object (fixed now): f = the 2000 literals; step 1 applied exactly (any value outside [−10, 10] clipped, and
reported); step 2 exactly: f(1) := −Σ_{k≥2} f(k)/k (a rational; there is no key 1 to replace). F(x) = Σ_k f(k)⌊x/k⌋.
F is constant on [n, n + 1) (⌊x/k⌋ = ⌊⌊x⌋/k⌋), so every statement about real x ≥ 1 is one about integers n ≥ 1.

Readings (fixed now):
- **A, "the problem's stated constraint" (decides the verdict)**: F(x) ≤ 1 for every real x ≥ 1. This is the constraint
  the statement names (its banner says a passing solution "may exceed 1"), the condition the construction needs to be
  the certificate the problem asks for. With Σ f(k)/k = 0 exactly, F(n + L) = F(n) for L = lcm(keys), so A is a
  statement about n ∈ [1, L] — finitely many facts, but L is far beyond enumeration. A is decided by:
  (i) every integer n with 1 ≤ n < 10·max k = 1,278,490 (the sampled range, exhaustively);
  (ii) the mirror family n = L − 1 − m, 0 ≤ m < 1,278,490, where F(L − 1 − m) = Φ − F(m) with Φ = −Σ_{k≥1} f(k)
       (⌊(L − 1 − m)/k⌋ = L/k − 1 − ⌊m/k⌋ for k | L), F(0) = 0 — points far outside the sampled range, for free;
  (iii) only if (i) and (ii) find no witness: a search over residue vectors (n mod p^e for the prime powers dividing
       the keys; F(n) = −Σ_{k≥2} f(k)·(n mod k)/k), a float proposer with a 20-minute wall-clock budget on this Mac;
       every point it proposes decided exactly.
  A witness n with F(n) > 1 exactly REFUTES A, printed (n itself, or L − 1 − m with L given); the Python checker then
  evaluates Σ_k f(k)⌊n/k⌋ directly at that integer, with no use of the identities above. No witness: A is REFUSED,
  the step named — "F(n) ≤ 1 for every n ≤ lcm(keys): not enumerable, and no exact decider here for the maximum of
  this CRT-coupled sum".
- **B, the platform's check made exhaustive (reported, does not decide)**: F(n) ≤ 1 + 10⁻⁴ for every integer
  1 ≤ n < 1,278,490 — the event the 10⁷ samples approximate. Also reported: every n in range with F(n) > 1 + 10⁻⁴ and
  with F(n) > 1, counted, the maximum of F on the range exactly, and its argmax.
- **The score**: S = −Σ_{k≥2} f(k) ln(k)/k (the k = 1 term is 0 whatever f(1) is), enclosed with ln k bounded rigorously
  to ≥ 40 digits by two different series (JS: k = 2^e·y, y ∈ [1, 2), 2·atanh((y−1)/(y+1)) with the remainder bound;
  Python: −ln(1 − t), t = 1 − 1/y, the Mercator series with its remainder bound, ln 2 from Machin-like atanh terms).
  The rule is the house rule already used for this platform (tools/run-mc100-einstein.js): the printed score agrees iff
  every point of the enclosure is within the platform's minImprovement, 10⁻⁶, of 0.9976572852677297; the exact
  distance and the side are printed beside it.
Verdict of #6 (a conjunction): CERTIFIED iff A is certified and the score agrees; REFUTED iff A is refuted by a witness
or the score disagrees; REFUSED otherwise, with the step named.

## Controls (each predicted now; each must come back as predicted)

#3 / #5 (circles; every planted object decided by both implementations):
- P1 the radius of a circle in the tightest exact constraint increased by 10⁻⁶ (#3, strict) and by 3·10⁻⁶ (#5, T): REFUTED.
- P2 circle 0's centre moved through the left side, x_0 := r_0 − 2·10⁻⁶: REFUTED under S and under T.
- P3 circle 1's centre placed on circle 0's: REFUTED (an overlap).
- P4 the sum claims moved by one unit in the last printed digit (2.63586277; 2.6359858): REFUTED on the sum.
- P5 positive: the entry with every radius reduced by the repair δ̄ (δ* rounded up at 10⁻²⁰, if δ* > 0): S holds, CERTIFIED.
- P6 a malformed entry (25 circles): REFUSED.
#4 (autocorrelation):
- Q1 one cell set to −10⁻⁶: REFUTED (outside the domain).
- Q2 sharpness: the least 4-decimal threshold above our Q: REFUTED; the greatest at or below it: CERTIFIED.
- Q3 the largest cell multiplied by 100: Q drops below 0.9469, REFUTED.
- Q4 calibrations of the definition, the same file's other entries against the paper's printed values:
  `AlphaEvolve-v1` (50 cells) reproduces AlphaEvolve's 0.8962 to the printed digits; `StrongInit` (1024) Table 2's
  initial 0.9055; `8B-wo_RL@100` (2048) Table 2's 0.9434 (w/o RL, late). Predicted: each agrees with its printed digits
  (rounded or truncated, reported which).
- Q5 analytic: one cell, Q = 2/3 exactly; [1, 1], Q = 2/3 exactly; and the exact Q of a random 7-cell function against
  a float quadrature of the three norms on a fine grid, within 10⁻⁶ (a test of the formula, not a decision).
#6 (PNT):
- K1 the score claim moved by 2·10⁻⁶: REFUTED (score disagreement).
- K2 f scaled by 1.001: reading B fails (some n in range with F(n) > 1 + 10⁻⁴).
- K3 the F evaluator against the Möbius identity Σ_{k≤n} μ(k)⌊n/k⌋ = 1 for every n ≤ 2000 (f = μ on 1..2000, no
  normalization).
- K4 ln enclosures against the published 50 digits of ln 2, ln 3, ln 10; ln 6 ∋ ln 2 + ln 3 (intervals meet).
- K5 a planted value 11 clipped to 10 and reported as clipped.

## Predictions

- #3: P(CERTIFIED) ≈ 0.6 (centres carry 8 decimals and the radii full doubles; an exact overlap of float size is
  plausible, P(REFUTED on an overlap) ≈ 0.35); the sum: P(rounds to 2.63586276) ≈ 0.95, P(truncation reading holds)
  ≈ 0.1 (AlphaEvolve's value is commonly quoted as 2.6358627564…).
- #5: P(CERTIFIED under T) ≈ 0.85; P(S holds) ≈ 0.05 — the entry was optimised under the 10⁻⁶ tolerance, so overlaps of
  that size are expected; P(the sum rounds to 2.6359857) ≈ 0.85; the 10⁻⁶ reduction: P(S holds and above #3's Σr) ≈ 0.9.
- #4: P(CERTIFIED) ≈ 0.75; P(REFUTED because Q < 0.9469 while Q rounds to 0.9469) ≈ 0.2; P(a negative value) ≈ 0.05.
- #6: the values look like 1.0001·μ(k), suggesting the 10⁻⁴ tolerance was spent: P(A REFUTED) ≈ 0.8, mostly by a
  witness inside the sampled range; P(A REFUSED) ≈ 0.2; P(B holds) ≈ 0.75; P(the score agrees) ≈ 0.95.
If our numbers disagree with a printed value, our code is suspected first; a disagreement is reported exactly as found.

## Not decided (said first in every reply)

- #3/#5: nothing about optimality; the `8B-w_RL@65-Formal` and `ShinkaEvolve` entries; the README's 2.63598308.
- #4: nothing about whether 0.9469 is the paper's best possible from this function or how it was scored there; the
  other entries beyond the calibrations.
- #6: whether this f yields any statement about π(x) (the reduction from the constraint to C^± is the problem's
  mathematics, read, not decided); reading B is a fact about the bytes, not about the platform's sampled run (whose
  samples are not published).

## Amendment A (2026-11-08, after the first full run; no rule above changed, no prediction moved)

- **Two defects in my own test code, fixed before the record was first written.** (1) The Python circles checker's
  repair called the decider recursively; on the planted object P2 (a circle pushed through a side into its neighbours)
  the repair itself fails, and the recursion did not stop. The repair is now computed once, as in the JavaScript.
  (2) The Q5 quadrature self-test (#4, Python) failed on its first run because the test was badly built: its grid did
  not contain the integer knots, so the grid maximum missed the peak of f∗f. The grid is now knot-aligned, with Simpson's
  rule for ‖f∗f‖₂² (exact on each piecewise-quadratic panel up to rounding); it passes. Neither touches a decision.
- **Read after this note, for the calibration Q4 only:** AlphaEvolve's B.2 cells in
  `corpus/sources/alphaevolve_mathematical_results.ipynb` (pinned in corpus/sources/PINS.json): the statement
  "0.8962 ≤ C2", the 50 heights, and the verification cell's ‖f∗f‖₂² formula, which is the piecewise-linear formula
  registered above, with zero padding. ThetaEvolve's `AlphaEvolve-v1` list equals AlphaEvolve's `heights_sequence_2`
  literal for literal; its exact Q = 0.896279944155407768892875359069… ≥ 0.8962. This confirms the definition decided.
- **One calibration NOT as predicted:** `StrongInit` (1024 cells) decides to Q = 0.905282581869638845…, where Table 2
  prints 0.9055 for "Initial" (Distill-Qwen3-8B). Neither rounding nor truncation gives 0.9055. The other two
  calibrations reproduce their digits: AlphaEvolve-v1 by truncation (a lower bound), 8B-wo_RL@100 (0.943374915…) by
  rounding to 0.9434. Not resolved: the stored list may not be the object behind "Initial", or the paper's scorer
  may differ. Their code is not run, so this stays open. Reported as found; it does not bear on #4, whose object and
  definition are pinned.
- **#6, step (iii) was not run.** Step (i) found witnesses, the first at x = 1, so reading A was decided without the
  residue search, as registered ("only if (i) and (ii) find no witness"). Step (ii) was decided anyway.
- **Beyond the registration (additions, no rule changed):** the JavaScript also evaluates every #6 witness directly as
  Σ_k f(k)⌊x/k⌋ with the exact f(1), as the Python does; the Python K4 also checks every key's ln enclosure against
  Python's correctly rounded `decimal` ln at 80 digits. Control P1's "circle in the tightest exact constraint" is
  implemented as the lower-index circle of the pair with the least exact d_ij² − (r_i + r_j)².
- **Run time.** The record takes about 11 s and `--check` about 11 s (both implementations).
