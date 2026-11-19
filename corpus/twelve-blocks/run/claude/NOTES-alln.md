# V(n) to within a bounded error at every length (claude track)

Write f(n) = 117 n²/2192 − n/2. V(n) is the least number of monochromatic triples (a, a+d, a+2d), d ≥ 1, over
the 2-colourings of 1..n. B_m is the twelve-block colouring of 1..548m.

**Theorem A (every length).** For every n ≥ 1,  f(n) − 281/16 ≤ V(n) ≤ f(n) + 54.

**Theorem B (every scale of the twelve blocks).** For every m ≥ 1 and n = 548m,
M(B_m) − 14 ≤ V(n) ≤ M(B_m) if m is even, M(B_m) − 16 ≤ V(n) ≤ M(B_m) if m is odd, and M(B_m) = f(n) + (m mod 2).

So V(n) = (117/2192) n² − n/2 + O(1) with explicit constants, at every n and not only at multiples of 548; and at
the scales m < 118 (even) and m < 123 (odd), where exact optimality of B_m is open, B_m is within 14 (16) of
optimal. The truth looks much tighter: for the 45 lengths where V(n) is known (OEIS A121385), V(n) − f(n) lies in
[−0.294, 1.374].

Both theorems rest on the delta-three certificates (not refereed), on two paper lemmas (the centring identity and
E ≥ L, section 1) and on one exact lattice identity (section 2). Nothing here is first-order exact near the
minimiser and nothing is extrapolated from small n. Replay: `python3 -B core_alln.py` (10 s, alone, standard
library); planted errors: `python3 -B alln_falsifiers.py`.

## 1. The continuum input

R = {(a,b) ∈ [0,1]² : a/2 ≤ b ≤ (1+a)/2}, Q(φ) = ∬_R φ(a)φ(b), φ* the twelve blocks on [0,1], Q(φ*) = −5/137.
For measurable φ: [0,1] → [−1,1] put σ = (1 − φφ*)/2 ∈ [0,1] and μ = ∫σ.

**Centring identity.** φ = φ*(1 − 2σ), so Q(φ) = Q(φ*) − 2∬_R φ*(a)φ*(b)(σ(a) + σ(b)) + 4Q(φ*σ). The middle term
is −4∫σ φ* g*, with g*(x) = ½(∫_{x/2}^{(1+x)/2} φ* + ∫_{[2x−1,2x]∩[0,1]} φ*) (the two sections of R through x). Hence
E(σ) := (Q(φ) − Q(φ*))/4 = ∫hσ + Q(φ*σ), h = −φ*g*. The core recomputes h at the 1097 nodes x/1096; h is linear
between nodes, h ≥ 0, h = 0 exactly at the 11 breakpoints, and its largest slope is 3/2.

**E ≥ L₀ (discretisation).** Take cells I_i whose ends contain every breakpoint; s_i the sign of φ* on I_i, w_i
its length, y_i the mean of σ on it.
- On a cell, m(v) = |{x ∈ I_i : h(x) < v}| is piecewise linear and continuous (no flat piece of h; checked), with
  derivative the sum of 1/|slope| over the pieces of h crossing the level v. If d bounds that sum,
  m(v) ≤ d (v − min h). For σ with mass u = w_i y_i on the cell, the layer-cake formula gives
  ∫_{I_i} hσ ≥ u min h + ∫_0^∞ (u − m(min h + t))₊ dt ≥ u min h + u²/(2d) = a_i y_i + b_i y_i².
- A pair I_i × I_j inside R contributes exactly s_i s_j w_i w_j y_i y_j; a pair outside contributes 0.
- A pair cut by ∂R contributes s_i s_j ∬_{in} σσ, and 0 ≤ ∬_{in} σσ ≤ w_i w_j y_i y_j, ∬_{in} σσ ≤ A_in,
  ∬_{in} σσ ≥ w_i w_j y_i y_j − A_out, because 0 ≤ σ ≤ 1.
So E(σ) ≥ L₀(y) (inner form: cut pairs bounded by 0 or −w_i w_j y_i y_j) and E(σ) ≥ L_θ(y) (slab form) for every
measurable σ. No alignment of σ with the grid is needed: y is just the vector of cell means.

**The strengthened inner certificate.** On {μ ≤ 1/5} the inner file gives the polynomial identity
L₀(y) = yᵀPy + Σλ_ij y_i(1−y_j) + Σν_j y_j(1/5 − μ) + κμ(1/5 − μ) + yᵀNy + Σc_i y_i with all multipliers ≥ 0.
Since μ = wᵀy, yᵀPy = yᵀ(P − wwᵀ/948)y + μ²/948. The core proves P − wwᵀ/948 positive definite exactly (947 fails:
1/(wᵀP⁻¹w) ≈ 1/947.3). Hence E ≥ μ²/948 for μ ≤ 1/5. (gpt found the same device with 1/1024, chat g8.)

**The slabs.** On μ ∈ [1/5, 1/2] the four slab certificates give E ≥ 2.7470548·10⁻⁴ > 1/3792 ≥ μ²/948.

**Conclusion [1].** E(σ) ≥ μ²/948 whenever μ ≤ 1/2. Replacing φ by −φ changes neither Q nor the set of
competitors, and replaces μ by 1 − μ; so for every φ, with μ := min over the two orientations,
Q(φ) − Q(φ*) ≥ 4μ²/948 = μ²/237.

## 2. The lattice identity, for every n ≥ 2

For s ∈ {±1}ⁿ let φ_s be the step function equal to s_p on ((p−1)/n, p/n], S_e and S_o the sums of s over even and
odd sites, T_n = ⌊(n−1)²/4⌋ the number of triples, and
R_n(s) = ¼ Σ_{p,q} s_p s_q ([2p−q = 1] − [2p−q = 0] + [2p−q = n] − [2p−q = n+1]) (p, q in 1..n).

**Identity.**  4M(s) = T_n − 3n/2 + (S_e² + S_o²)/2 + n²Q(φ_s) + R_n(s).

Proof. The indicator of a monochromatic triple is (1 + ab + ac + bc)/4, so 4M = T_n + Σ_{p<q} w(p,q) s_p s_q with
w(p,q) = [p ≡ q mod 2] + [1 ≤ 2p−q ≤ n] + [1 ≤ 2q−p ≤ n] (the third site between, beyond p, beyond q). The parity
part sums to (S_e² + S_o² − n)/2. The other two parts sum to N(s) − n, N(s) = Σ_{p,q} s_p s_q [1 ≤ 2p−q ≤ n] over
ordered pairs with the diagonal. And n²Q(φ_s) = Σ_{p,q} s_p s_q α(2p−q), α(t) the area of
{(a,b) ∈ (q−1,q] × (p−1,p] : 0 ≤ 2b−a ≤ n}: α = 1 for 2 ≤ t ≤ n−1, 3/4 for t ∈ {1, n}, 1/4 for t ∈ {0, n+1}, 0
otherwise (for n ≥ 2 the two boundary lines never meet one cell). Subtracting, N(s) − n²Q(φ_s) = R_n(s). ∎
(The core recomputes α by integration and checks the identity on every colouring for n = 2..12.)

**R_n is small.** Let J₁ (J₂) be the number of p odd (even) with s_p ≠ s_{p+1}.
- n even, r = n/2: R_n = ¼ Σ_{i=1}^{r} (s_i − s_{r+i})(s_{2i−1} − s_{2i}), each term in {−1, 0, 1} and 0 unless
  s_{2i−1} ≠ s_{2i}. So |R_n| ≤ J₁.
- n odd, c = (n+1)/2: R_n = ¼[Σ_{i=1}^{c−1} s_i(s_{2i−1} − s_{2i}) + Σ_{j=1}^{c−1} s_{c+j}(s_{2j+1} − s_{2j}) + s_c(s_1 + s_n)],
  each term in {−½, 0, ½}. So |R_n| ≤ (J₁ + J₂)/2 + ½.

**Splits cost distance.** Let k = nμ, μ the distance ∫σ of φ_s to the nearer of ±φ*. The J₁ pairs of cells
(2i−1, 2i) with different colours occupy disjoint intervals ((2i−2)/n, 2i/n). If such an open interval contains
no breakpoint of φ*, then ±φ* is constant on it and φ_s differs from it on one whole cell: these pairs contribute
at least their number to k. At most 11 of the disjoint intervals contain a breakpoint. So J₁ ≤ k + 11, and in the
same way J₂ ≤ k + 11.

## 3. The lower bound of Theorem A

Let s be any colouring of 1..n, n ≥ 2, k = nμ ≥ 0. By the identity, section 1 (n²(Q(φ_s) − Q(φ*)) ≥ k²/237) and
the two lemmas,
4M(s) ≥ T_n − 3n/2 − 5n²/137 + (S_e² + S_o²)/2 + k²/237 − k − c_n,  c_n = 11 (n even), 23/2 (n odd).
k²/237 − k ≥ −237/4 for real k. For n odd S_e + S_o is odd, so (S_e² + S_o²)/2 ≥ ½. With T_n = n²/4 − n/2 (even),
n²/4 − n/2 + ¼ (odd), and 1/16 − 5/548 = 117/2192: M(s) ≥ f(n) − 281/16 (even), M(s) ≥ f(n) − 35/2 (odd). n = 1 is
trivial. ∎

## 4. The upper bound of Theorem A

Let s be φ* sampled at the cell centres. If φ_s(x) ≠ φ*(x), a breakpoint lies between x and the centre of its
cell: so the wrong set lies in the cells that contain a breakpoint, has measure ≤ 11/(2n), and every wrong point
is within 1/(2n) of a breakpoint, where h ≤ (3/2)/(2n) (h vanishes at breakpoints, slope ≤ 3/2). Therefore
∫hσ ≤ (3/(4n))(11/(2n)), Q(φ*σ) ≤ (∫σ)² ≤ (11/(2n))², 4n²E(σ) ≤ 33/2 + 121.
|S_e + S_o| = n|∫(φ_s − φ*)| ≤ 2n∫σ ≤ 11 (∫φ* = 0); s has at most 12 runs and each run contributes −1, 0 or 1 to
S_e − S_o; so (S_e² + S_o²)/2 = ((S_e+S_o)² + (S_e−S_o)²)/4 ≤ 265/4. s has at most 11 colour changes, so R_n ≤ 11
(n even), ≤ 6 (n odd). The identity gives M(s) ≤ f(n) + (33/2 + 121 + 265/4 + 11)/4 = f(n) + 859/16 < f(n) + 54. ∎
(Measured: M(s) − f(n) ≤ 10.61 for every n ≤ 1200, and this s attains V(n) at 29 of the 45 known lengths.)

## 5. Theorem B

n = 548m, o = m mod 2. φ* is the step function of B_m exactly, so its breakpoints are lattice points and
Q(φ_{B_m}) = −5/137. A pair (2i−1, 2i) straddles a breakpoint only if the breakpoint is odd: never for even m,
twice for odd m (at 99m and 449m), and there s_i = s_{r+i} (checked at unit scale), so R_n(B_m) = 0. The parity
sums of B_m are (0,0) for even m and (2,−2) for odd m. The identity gives M(B_m) = f(n) + o.
For any other colouring, choose the nearer orientation, k flips, a and b the sums of the old signs of the flipped
even and odd sites. New parity sums 2o − 2a and −2o − 2b; split pairs at most k + 2o; so
4(M(s) − M(B_m)) ≥ k²/237 + 2(a−o)² + 2(b+o)² − k − 6o ≥ min_{k ∈ ℤ}(k²/237 − k) − 6o = −14042/237 − 6o.
M(s) − M(B_m) is an integer, hence ≥ −14 (even), ≥ −16 (odd). ∎

## 6. What a machine checked and what is on paper

| item | status |
|---|---|
| h, its zeros and slope, Q(φ*) = −5/137, ∫φ* = 0 | exact, core Part 4 |
| inner identity; P − wwᵀ/948 ≻ 0; four slabs; cover | exact, core Part 1 (fixed-point Cholesky proposes, exact remainder strictly diagonally dominant) |
| centring identity, E ≥ L | paper (section 1); the first also tested through Part 3 |
| lattice identity | paper proof; every colouring for n ≤ 12, random to n = 61, Part 2 |
| bounds on R_n | paper; every colouring for n ≤ 12, Part 2 |
| splits ≤ k + 11 | paper; tested Part 3 (and "≤ k" shown false in the falsifiers) |
| n²(Q − Q*) ≥ k²/237 on lattice colourings of 16 lengths | tested, Part 3: a direct falsifier of [1] |
| arithmetic of A and B | exact, Part 4 |
| V(n), n ≤ 14, by exhaustion; n ≤ 45 from OEIS A121385 (cited, not recomputed beyond 14) | Part 5 |

## 7. Corollary for the exact theorem (a build on SHARP)

With 1/237 in place of 1/256 the maxima of SHARP become G = 237 (even, at k = 236, a = b = 0) and G = 244 (odd, at
k = 242, (a,b) = (1,−1)), so the classification of GLOBAL / SHARP holds for every even m ≥ 118 and odd m ≥ 123
(2m + 2 − o ≥ G, then the last-deletion step unchanged). Open: even m ≤ 116, odd m ≤ 121.
