# Locality of the dual constraint: (D2) only has to be checked infinitesimally

Notation as in lifting.md (r = 1). A certificate is (psi, beta, gamma, l1, l2, mu) on the square
Omega0 = [-1,1]^2 of labels (w, v) (the functions need not depend on the lamp). For two labels z, z' put

    tau(z,z') = psi(z) - psi(z') + beta(z)(w' - w) + gamma(z')(v - v').

(D2) asks, for every pair z, z' and all a, b > 0:   a tau(z,z') + b tau(z',z) <= (a - b) ln(a/b).

## Lemma S (an edge can be subdivided for free). PROVED

Let z_0, z_n be two labels, a, b > 0, n >= 2. Put J = a - b and choose a_k, b_k > 0 (k = 0..n-1) with
a_k - b_k = J and prod (a_k/b_k) = a/b  (equal ratios rho = (a/b)^(1/n): a_k = J rho/(rho-1), b_k = J/(rho-1);
if a = b take a_k = b_k = n a). Define intermediate labels z_k = (w_k, v_k), 0 < k < n, by

    a_k (w_{k+1} - w_k) + b_{k-1} (w_{k-1} - w_k) = 0,        a_{k-1} (v_{k-1} - v_k) + b_k (v_{k+1} - v_k) = 0.

(These are F1 and F2 of lifting.md at a state of zero mass with neighbours k-1, k+1.) Then, for ANY functions
psi, beta, gamma:

    sum_{k=0}^{n-1} [ a_k tau(z_k, z_{k+1}) + b_k tau(z_{k+1}, z_k) ]  =  a tau(z_0, z_n) + b tau(z_n, z_0),      (*)
    sum_{k=0}^{n-1} (a_k - b_k) ln(a_k/b_k)  =  (a - b) ln(a/b).

Proof. The second line is J times the sum of the logarithms. In (*): the psi terms telescope to J (psi_0 - psi_n).
The coefficient of beta(z_k), 0 < k < n, is a_k (w_{k+1} - w_k) + b_{k-1} (w_{k-1} - w_k) = 0; the coefficient of
gamma(z_k) is a_{k-1}(v_{k-1} - v_k) + b_k (v_{k+1} - v_k) = 0. What is left is
beta(z_0) a_0 (w_1 - w_0) + beta(z_n) b_{n-1} (w_{n-1} - w_n) + gamma(z_n) a_{n-1} (v_{n-1} - v_n) + gamma(z_0) b_0 (v_1 - v_0).
With equal ratios the solutions are w_k = w_0 + (w_n - w_0)(1 - rho^-k)/(1 - rho^-n) and
v_k = v_0 + (v_n - v_0)(rho^k - 1)/(rho^n - 1), so a_0 (w_1 - w_0) = J (w_n - w_0)/(1 - rho^-n) = a (w_n - w_0),
b_{n-1}(w_{n-1} - w_n) = b (w_0 - w_n), a_{n-1}(v_{n-1} - v_n) = a (v_0 - v_n), b_0 (v_1 - v_0) = b (v_n - v_0)
(for a = b: linear interpolation, same identities). These are the four terms of a tau(z_0,z_n) + b tau(z_n,z_0). QED

The intermediate labels lie in the rectangle spanned by z_0 and z_n (w_k and v_k are monotone in k), hence in the
square, and consecutive labels are at distance O(1/n). The path is the arc w = A + B e^-x, v = A' + B' e^x that a
ring's labels follow across a mass-free gap.

Consequence: if (D2) holds for all pairs at distance < eps (any eps > 0), it holds for all pairs.

## Theorem C (locality). PROVED

Let psi, beta, gamma be continuous on the square and C^3 up to the boundary (for instance polynomial) on each cell of a finite partition of
the square by straight lines. Write p = (beta+gamma)/2, q = (beta-gamma)/2, h = (w+v)/2, d = (w-v)/2, and suppose
that at every interior point of every cell the symmetric matrix

    4 [[2 p_h, p_d + q_h], [p_d + q_h, 2 q_d]]  -  xi xi^T,        xi = (2 q - psi_h, 2 p - psi_d),

is positive semidefinite (in the original coordinates: Delta^T D(beta,gamma) Delta >= (1/4)(xi0 . Delta)^2 with
Delta^T D(beta,gamma) Delta = (grad beta . Delta) Dw + (grad gamma . Delta) Dv and xi0 = (beta - psi_w, -gamma - psi_v)).
Then (D2) holds for every pair of labels, and so Theorem D applies with (D1) alone left to check pointwise.

Proof. Fix z_0, z_n, a, b and apply Lemma S with n large; J != 0 first. For an edge k whose segment lies in one
closed cell, Taylor's formula at the midpoint gives, with Delta = z_{k+1} - z_k,
    tau + tau' = -(D beta Dw + D gamma Dv) = -Delta^T D(beta,gamma) Delta + O(|Delta|^3),
    tau - tau' = 2 xi0 . Delta + O(|Delta|^3),
so  a_k tau + b_k tau' = (a_k+b_k)(tau+tau')/2 + J (tau-tau')/2
                      <= -(a_k+b_k) x^2/8 + J x + (a_k + b_k + |J|) O(|Delta|^3)        (x = xi0 . Delta)
                      <= 2 J^2/(a_k+b_k) + O(n) O(n^-3)  <=  J ln(a_k/b_k) + O(n^-2),
using the hypothesis, then max_x, then (a-b) ln(a/b) >= 2 (a-b)^2/(a+b); here a_k + b_k = O(n), |Delta| = O(1/n).
An edge whose segment crosses a line of the partition contributes at most (a_k+b_k)|tau+tau'|/2 + |J||tau-tau'|/2
= O(n) O(n^-2) + O(n^-1) = O(1/n), by continuity and the Lipschitz bound. The coordinates of the path are
A + B rho^-k and A' + B' rho^k, so a fixed line is crossed at most twice: there are at most 2 x (number of lines)
such edges. Summing, (*) gives a tau(z_0,z_n) + b tau(z_n,z_0) <= J ln(a/b) + O(1/n); let n -> infinity.
For a = b the same computation with J = 0 gives a (tau + tau') <= O(1/n). QED

Remarks.
1. Kinks are harmless, of either sign, as long as the three functions are continuous: an edge straddling a kink can
   always be replaced by a finer chain in which only one tiny edge straddles it.
2. The hypothesis is a 3 x 3 linear matrix inequality in (beta, gamma, psi):
   [[4 M, xi], [xi^T, 1]] >= 0. So the whole dual is a convex program over three functions on a square with
   POINTWISE constraints, and a piecewise-polynomial certificate is checked by polynomial inequalities in two
   variables (not four).
3. In the family p = sum A_k(h) d^(2k), q = sum K_k(h) d^(2k+1), psi = sum P_k(h) d^(2k+1) the matrix entries are
   polynomials in d whose coefficients are the knot data; gpt's g16 is the case p = a(h)/2 (times 4/Gamma),
   q = d/2, psi = (h - b(h)) d, and the local LP in that family (f6loc.py, family 111) returns 0.26244, matching
   gpt's globally verified 0.26122 and their estimate 0.26147 of that family's best. COMPUTED.
