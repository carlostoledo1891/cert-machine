# zeta-hankel — exact margins of the Hankel-determinant irrationality method (s34, 2026-10-04)

Question: can the method that proved zeta(5) irrational (Fauzan, Zenodo 22826419, 2026-09-17;
Calegari's reconstruction, galoisrepresentations.org 2026-09-24) be pushed to zeta(7) or to
Catalan's constant G?

## The instrument
- `hankel.py` — Fauzan/Calegari functional mu_{k,X} (moments from Bernoulli numbers, node values
  j^{k-1}(X - H_j^(k)) - 1/(k-1) + 1/(2j)), W = D_N^r / D_K, h x h Hankel matrix G(X) = A + X B.
  Delta(X) = det G(X) computed EXACTLY in Q[X] (det B * charpoly(-B^{-1}A), through an integer
  charpoly — fmpq_mat.charpoly is pathologically slow), content stripped (the best possible
  normalisation to a primitive integer polynomial P), P(X) evaluated in ball arithmetic.
- `hankel2.py` — general node sets (integer and half-integer poles, any numerator multiset) and two
  weights: Z (1/(e^{2 pi y}-1), Prevost/Fauzan) and E (1/sinh(pi y), alternating). E with
  half-integer poles gives X = beta(k); beta(2) = G.
- `test2.py` — every moment and node formula against quadrature (k = 2,3,5,7, both weights, both
  node types: relative error <= 1e-24); hankel2 reproduces hankel exactly on Fauzan-type data.
- `scan.py` / `scan2.py` (families K = a m, N = b m), `families_struct.py` (structural variants),
  `padic.py` (v_p of the content prime by prime), `traj.py` / `traj2.py` (log P / m^2, / h^2).

Why the measurement is the right one: the irrationality lemma needs P_n in Z[X], deg <= Cn,
0 < P_n(xi) <= exp(-c n^2). The content-normalised P_n is the smallest such multiple, so
log P_n(xi) is the TRUE margin of the family; papers prove upper bounds on the denominators.

## Results (log P / h^2 at h ~ 35, stable from h ~ 20; negative = the family proves irrationality)
| constant | best family | value |
|---|---|---|
| zeta(3) | Z int a=4 b=1 r=4 | -1.39 |
| zeta(5) | Z int a=8 b=1 r=4..6 | -0.18 (Calegari K=12n: -0.15 at h=99) |
| zeta(7) | Z int a=8 b=1 r=4 | +1.02 |
| G = beta(2) | E half a=8 b=1 r=1 | +0.43 and rising |
| zeta(3), zeta(5), zeta(7) via the alternating weight E | — | +0.15, +1.41, +2.6 (E is worse) |

Structural variants (zeros above the poles, odd poles only, staircase multiplicities, interleaved
zeros, mixed integer/half-integer poles, a window of zeros inside the poles) are all WORSE, even for
zeta(5) (+0.2 to +3). The good shape is Fauzan's: a contiguous pole block, integer zeros below it.

## The mechanism (padic.py, Z int a=12 b=1 r=6, m=5, K=60)
The content's denominators sit on primes p <= K. Going from k=5 to k=7 costs, per prime p > sqrt(K),
roughly the NAIVE price 2(K-p) of the two extra powers of p in H_j^(k) for the nodes j >= p — prime by
prime it scatters both ways (p=17: 104 vs 86 above; p=29: 34 vs 62 below; p>=41 equal), and weighted
by log p it totals 98% of the naive price (2160 vs 2200); the small primes 2,3,5,7 add ~970 more
(they lose common factors). Corrected 2026-10-05: an earlier line here said "no cancellation at all".
The real decay (log Delta at X) is nearly k-independent. So in this class the margin is linear
in k with slope ~ +0.5 h^2 per unit k: zeta(3) -1.4, zeta(5) -0.2, zeta(7) +1.0. The threshold
is k ~ 6. zeta(7) needs a structurally new idea (more decay, or savings that scale with k), not tuning.

## Side fact worth keeping
For zeta(5) the true margin (-0.15 to -0.25 h^2) is ~10x what the published normalisations prove
(Fauzan: -0.020 h^2; Calegari K=12n: gamma_5 = 3/2 per n^2 = -0.012 h^2). A better provable
irrationality exponent than 260 is available in principle, but needs the arithmetic PROVEN for the
better family (Fauzan sections 3-5, redone) — weeks.

## Context (race)
Anand's "zeta(7) is irrational" (Zenodo 22920911, Oct 2026) has an open issue (gmDevi/zeta-7-21-lean
#1: I_out sign, the constant goes -11.99 -> +0.95). Sun's Catalan proof (2609.04176) broken at the
prime 2 by Wachs (2609.22339). Fauzan says zeta(7) is ongoing work.
