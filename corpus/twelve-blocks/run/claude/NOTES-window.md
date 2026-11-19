# Notes behind window_check.py (claude track): the derivation, written before reading gpt/windows.md's proof

Signs: red = +1. s_p the colour of B_m at p, n = 548 m. F(t) = sum of s_j over 1 <= j <= min(t, n) (0 for t <= 0).
P(p) = sum of s_q over the sites q of the parity of p.

**(A) flip cost of any set S.** The indicator of a monochromatic triple is (1 + ab + ac + bc)/4, so
M = T/4 + (1/4) sum_{p<q} w(p,q) s_p s_q, with w(p,q) the number of triples through both p and q:
w = [p = q mod 2] + [1 <= 2p-q <= n] + [1 <= 2q-p <= n] (third site in the middle, beyond p, beyond q; the three
are different triples). Flipping S changes the sign of s_p s_q iff exactly one of p, q is in S. With sigma_p = s_p
on S: D(S) = sum_{p in S} L_p + sum_{p<q in S} sigma_p sigma_q w(p,q), L_p = -(s_p/2) sum_{q != p} s_q w(p,q).
The same-parity part of the pair sum is (Pi_0^2 + Pi_1^2 - |S|)/2 (Pi_i = sum of sigma over S of parity i); the
two extrapolation parts are N(sigma) - |S| with N = sum over ordered (p,q) in S x S, p = q included, of
sigma_p sigma_q [1 <= 2p-q <= n]. Hence D(S) = sum_{p in S} (L_p - 3/2) + (Pi_0^2 + Pi_1^2)/2 + N(sigma).

**(B) the single-flip cost.** sum_{q != p} s_q w(p,q): the parity test gives P(p) - s_p; the test 1 <= 2p-q <= n
is q in [2p-n, 2p-1], giving F(2p-1) - F(2p-n-1) - s_p; the test 1 <= 2q-p <= n is q in [ceil((p+1)/2),
floor((n+p)/2)], giving F(floor((n+p)/2)) - F(floor(p/2)) - s_p (q = p lies in each range). So
2 L_p - 3 = -s_p ( P(p) + F(2p-1) - F(2p-n-1) + F(floor((n+p)/2)) - F(floor(p/2)) ).

**(C) inside a window.** p = b m + e, -2m < e <= 2m. F is affine on each closed block [Am, Cm]. The four
arguments stay in one closed block (checked at unit scale: [2b-4, 2b+4], [2b-552, 2b-544], [(548+b)/2 - 1,
(548+b)/2 + 1], [b/2 - 1, b/2 + 1], each inside one block or beyond an end; at b = 274 the first two are split
at e = 0 | 1 and glue because s_1 = -s_548). So each F is its value at e = "0" (m times a unit-scale number) plus
slope times displacement. The m-terms add to m (F_1(2b) - F_1(2b-548) + F_1((548+b)/2) - F_1(b/2)) = 0 (this is
g*(b) = 0, checked exactly). The displacements are 2e - 1 for the first two and (e - [p odd])/2 for the floors.
Result: 2 L_p - 3 = -s_p ( P(p) + kap_b (2e-1) + mu_b (e - [p odd])/2 ). No m in it except through parities.
P(p) = 0 for even m (every block has as many odd as even sites); for odd m the four blocks of odd length give
P(even) = +2, P(odd) = -2.

**(D) pairs.** For p, q in the windows of b_i, b_j, 2p - q = (2 b_i - b_j) m + (2e - e'), |2e - e'| < 6m, and
every 2 b_i - b_j is <= -6, or in [6, 542], or >= 554. So [1 <= 2p-q <= n] = [6 <= 2 b_i - b_j <= 542].
N(sigma) = (1/2) z^T K z with z_i the signed charge of window i, K_ij counting both orders.

**Reduction.** Split each window into four sequences (side, parity of p). In a sequence the costs 2L-3 form an
increasing arithmetic progression outward (step 2H_i, H_i = |2 kap + mu/2|). For a class (window, parity) with
l left and r right flips the cost is >= H (l^2 + r^2) + B s_R (r - l) >= H u^2 + B u, u the signed charge,
equality iff one side is empty and the other an initial segment. The script checks that the two sides glue into
one polynomial (the same B), builds q(x) = 4 D_compact on Z^22 and enumerates {q <= 0} exactly.
