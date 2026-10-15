# A lower bound for the four-slope sums-differences constant C_3c = SD({0,1,2,∞}; −1)

**Result.** C_3c ≥ 1.674894211307116.

The certificate is an explicit pair of discrete random variables (X, Y), given by exact data in `certificate.json`;
two independent scripts recompute the bound from it.

## The constant

Problem 3c of T. Tao's optimization-constants repository (https://github.com/teorth/optimizationproblems, file
`constants/3c.md`): C_3c = SD({0,1,2,∞}; −1) is the least exponent such that
|A −_G B| ≤ max(|A|, |B|, |A +_G B|, |A +_G 2B|)^{C_3c} for all finite sets A, B of reals and G ⊂ A × B, where
A ±_G rB = {a ± rb : (a, b) ∈ G}. (The page's display writes a ∈ A, b ∈ B; the restriction (a, b) ∈ G is
intended, as the notation and Katz–Tao 1999 show.) The repository also states the entropy formulation used here (and for all listed
lower bounds): C_3c is the smallest constant such that

    H(X − Y) ≤ C_3c · max(H(X), H(Y), H(X + Y), H(X + 2Y))

for every pair of discrete random variables X, Y. So any such pair gives C_3c ≥ H(X − Y)/max(H(X), H(Y), H(X + Y),
H(X + 2Y)). Logarithms are natural (the ratio does not depend on the base of the logarithm).

## The pair (X, Y)

`certificate.json` lists a base B = 55, two laws q_1, q_2 (finite sets of points of Z² with positive rational weights
summing to 1; 51 and 47 points; every weight a multiple of 10^−50) and two counts a_1 = 39041372760532870645,
a_2 = 60958627239467129355 (n = a_1 + a_2 = 10^20). Let (x_i, y_i), 0 ≤ i < n, be independent, with law q_1 for
i < a_1 and law q_2 otherwise, and

    (X, Y) = Σ_{i<n} B^i (x_i, y_i).

**Why the entropies add up.** On each support, x − y takes distinct values, and every one of the five forms
L ∈ {x − y, x, y, x + y, x + 2y} satisfies |L(x, y)| ≤ 27 < B/2. Then L(X, Y) = Σ_i B^i L(x_i, y_i) is a balanced
base-B expansion: if Σ_i B^i d_i = Σ_i B^i d′_i with all |d_i|, |d′_i| < B/2, then at the lowest index j where the two
strings differ, B divides d_j − d′_j while 0 < |d_j − d′_j| < B, which is impossible. So L(X, Y) determines the digit
string (L(x_i, y_i))_i and is determined by it; the digits are independent, hence

    H(L(X, Y)) = a_1 H(L(q_1)) + a_2 H(L(q_2)),

where L(q) is the image of the law q under L. Since x − y is injective on each support, H(X − Y) = a_1 H(q_1) + a_2 H(q_2).
The ratio is therefore a finite computation with the entropies of the two laws and of their images.

**Values** (natural logarithm, divided by n; from `verify_flint.py`, rounded to the digits shown):

| quantity | value per digit |
| --- | --- |
| H(X − Y)/n | 1.901440925560701110457484265407282 |
| H(X)/n | 1.135260312397153687844396449540067 |
| H(Y)/n | 1.135260312397153687844592888597244 |
| H(X + Y)/n | 1.135260312397153687844257617360514 |
| H(X + 2Y)/n | 1.135260312397153687844610788463419 (the largest) |
| ratio | 1.674894211307116228764343737060957… |

The four denominators agree to about 21 digits: the construction balances them.

## How to check

Both scripts read `certificate.json` and check, in exact integer and rational arithmetic, that the points of each law
are distinct integer pairs, that the weights are positive and sum to 1, that x − y is injective on each support, that
2|L(x, y)| < B for all five forms and all points, and that the counts are positive integers; then they recompute the
five entropies and the ratio.

- Ball arithmetic (python-flint; tested with python-flint 0.8.0 and Python 3.12):
  `python3 verify_flint.py certificate.json` (optional second argument: working precision in bits, default 600).
  Every entropy is enclosed in a ball with rigorous error bounds; the lower endpoint of the ball enclosing the ratio
  exceeds the claimed value by 2.29·10⁻¹⁶ (the ball's width is below 10⁻¹⁷⁰). Expected last line:
  `RESULT: certified, C_3c >= 1.674894211307116`.
- PARI/GP (tested with PARI/GP 2.17.3): `gp -q verify.gp`, run in the folder of `certificate.json`. The script reads
  the JSON file itself (a small reader is included) and evaluates the logarithms at 250 significant digits. Expected
  last line: `RESULT: confirmed (PARI/GP, 250 digits), C_3c >= 1674894211307116/1000000000000000`.

The two scripts were written separately and share no code; their full outputs are `output_verify_flint.txt` and
`output_verify_gp.txt`. Both reject altered copies of the certificate.

## How the laws were found (not needed for the check)

For a mixture of laws, the best ratio is governed by multipliers ν = (ν_x, ν_y, ν_{x+y}, ν_{x+2y}) ≥ 0: each law
with positive weight is a stationary point of the free energy H(q) − Σ_j ν_j H(L_j q) with value 0, the four weighted
denominators are equal, and the ratio equals Σ_j ν_j. The two laws here have complementary imbalances (H(Y) and
H(X + 2Y) larger for the first, H(X) and H(X + Y) larger for the second); each is, up to its far tail, symmetric under a
point reflection, and both share their seven heaviest points after centring. We solved this system by Newton's method;
before rounding, all its equations hold to 10⁻⁴⁹. The weights were then rounded to multiples of 10⁻⁵⁰ and the counts to
integers, which is what is certified (the rounding changes the ratio by less than 10⁻²¹).

## Files

| file | content |
| --- | --- |
| `certificate.json` | the exact data: base, counts, the two laws (points and weights as integer fractions), the claimed bound |
| `verify_flint.py` | check in ball arithmetic (python-flint) |
| `verify.gp` | check in PARI/GP |
| `output_verify_flint.txt` | output of `python3 verify_flint.py certificate.json` |
| `output_verify_gp.txt` | output of `gp -q verify.gp` |
