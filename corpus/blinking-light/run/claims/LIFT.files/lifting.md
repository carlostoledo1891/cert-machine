# The convex lifting: the least dissipation is a convex program, and lower bounds are dual certificates

Units: r = 1 (so g = sigma). A network is a finite set of states with stationary masses p_i > 0 and fluxes
Q_ij = p_i k_ij >= 0 (i != j); put Q_ii = -sum_j Q_ij. Stationarity is: Q has zero column sums (row sums are zero
by definition). f_i = +-1 is the lamp. K = (1 - L)^-1, K* its stationary adjoint, w = K f, v = K* f.

## 1. Three facts about any network (PROVED; each is one line)

(F1) sum_j Q_ij (w_j - w_i) = p_i (w_i - f_i)       [this is (1 - L) w = f]
(F2) sum_i Q_ij (v_i - v_j) = p_j (v_j - f_j)       [this is (1 - L*) v = f; L*_ji = Q_ij / p_j]
(F3) C1 = sum p_i f_i w_i = sum p_i f_i v_i,   C2 = sum p_i v_i w_i,   |w_i| <= 1, |v_i| <= 1.

In words: w(X_t) is the discounted prediction of the future lamp, v(X_t) the discounted average of its past
(given the present state); C2 is their covariance.

## 2. The lifting (PROVED)

Label every state by z_i = (w_i, v_i, f_i) in Omega = [-1,1]^2 x {-1,+1}.

**Theorem L (the problem is a convex program).** g(c, q) is the infimum of

    Sigma(Q) = sum over unordered pairs {z, z'} of (Q(z,z') - Q(z',z)) ln(Q(z,z') / Q(z',z))

over finitely supported nonnegative measures nu on Omega and Q on Omega x Omega (off the diagonal) with

    (a) sum_z' Q(z,z') = sum_z' Q(z',z)                         for every z      (stationarity)
    (b) sum_z' Q(z,z') (w' - w) = nu(z) (w - f)                 for every z
    (c) sum_z' Q(z',z) (v' - v) = nu(z) (v - f)                 for every z
    (d) sum nu = 1,  sum nu f w = c,  sum nu w v = q.

All constraints are linear in (nu, Q) and Sigma is convex (and 1-homogeneous).

Proof. (=>) Given a network, push p and Q forward by i -> z_i (states with equal labels are merged). (a) holds,
(b), (c) are F1, F2 (the label is constant on merged states), (d) is F3, and merging can only lower Sigma (log-sum
inequality). (<=) Given a feasible (nu, Q), take the support as state space with rates Q(z,z')/nu(z). By (a), nu
is stationary. (b) says that the coordinate function z -> w solves (1 - L) w = f, and (c) that z -> v solves
(1 - L*) v = f. These equations have unique solutions, so the coordinates ARE K f and K* f, and (d) gives
C1 = c, C2 = q. (Points with nu(z) = 0 that carry flux are instantaneous states and can be eliminated; a
reducible feasible point is a limit of irreducible ones with a vanishing equilibrium link.) QED

**Corollaries.**
1. g(c, q) is a convex function of (c, q) (it is the value function of a convex program in the right-hand sides).
   It vanishes exactly on the equilibrium region.
2. In a minimiser all states may be taken with distinct labels (w, v, f).
3. Every lower bound is a dual certificate, and there is one format for all of them (section 3).

## 3. Weak duality: the certificate format for lower bounds (PROVED)

Let K0 be the set of pairs (t, t') with  e^u t + t' <= (e^u - 1) u  for every real u; equivalently
a t + b t' <= (a - b) ln(a/b) for all a, b > 0. Its boundary is the curve (u + 1 - e^-u, -u + 1 - e^u).
A sufficient condition for (t, t') in K0 is  (t + t')/2 <= -((t - t')/2)^2 / 8   [from
(a-b) ln(a/b) >= 2 (a-b)^2/(a+b)].

**Theorem D.** Let psi, beta, gamma be real functions on Omega and l1, l2, mu real numbers such that

    (D1)  beta(z)(w - f) + gamma(z)(v - f) - l1 f (w + v)/2 - l2 w v - mu >= 0        for every z = (w,v,f) in Omega,
    (D2)  (tau(z,z'), tau(z',z)) in K0                                               for every pair z, z' in Omega,
          where tau(z,z') = psi(z) - psi(z') + beta(z)(w' - w) + gamma(z')(v - v').

Then every finite network has  sigma/r >= l1 C1 + l2 C2 + mu.

Proof. sigma = sum_{i<j} (Q_ij - Q_ji) ln(Q_ij/Q_ji) >= sum_{i != j} Q_ij tau(z_i, z_j) by (D2).
The psi terms cancel (zero row and column sums). By F1 the beta terms sum to sum_i p_i beta_i (w_i - f_i); by F2 the
gamma terms sum to sum_j p_j gamma_j (v_j - f_j). By (D1) and F3 the total is at least l1 C1 + l2 C2 + mu. QED

Useful form of (D2). With D = (primed) - (unprimed):
    tau + tau' = -(D beta)(D w) - (D gamma)(D v)
    tau - tau' = -2 D psi + (beta + beta') D w - (gamma + gamma') D v.
So (beta, gamma) must be a monotone field on each lamp sheet, and the sufficient quadratic form of (D2) reads
    (D beta)(D w) + (D gamma)(D v) >= (1/16) [ (beta + beta') D w - (gamma + gamma') D v - 2 D psi ]^2.

Symmetries one may impose without loss: gamma(w,v,f) = beta(v,w,f), psi(w,v,f) = -psi(v,w,f) (time reversal);
beta, gamma odd and psi even under (w,v,f) -> (-w,-v,-f) (lamp flip).

## 4. What this buys

- The upper-bound side: any feasible point of the program on a finite subset of Omega is a network.
- The lower-bound side: a certificate (psi, beta, gamma, l1, l2, mu) is a universal theorem; it never mentions
  the network. Solving the dual numerically on a grid shows what the best certificate looks like.
- If the ring limit is the answer, its KKT multipliers along the ring's image curve in Omega must extend to a
  dual-feasible triple on all of Omega; if they cannot, some non-ring network is better.
