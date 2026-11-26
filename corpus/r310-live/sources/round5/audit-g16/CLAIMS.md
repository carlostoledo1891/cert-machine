# G16 audit — the claims in my own words (written 2026-11-24 from 23:20 UTC, from the TEXT of REPORT-3.md,
# work/g16/REPORT.md, FLOOR-FREE-CERTIFICATE.md, FLOOR-FREE.md, LOW-PROOF.md, ODD-PROOF.md, triplet.md and
# work/low_matching.md, before opening any program source or receipt of the claimant).

Standing hypotheses H0: G is a graph on n = 40 vertices, triangle-free, MAXIMAL triangle-free (every non-adjacent
pair has a common neighbour), alpha(G) <= a = 9. "low" = degree 6. Degrees lie in 6..9 (private-cell count
S_v >= d^2 - 11 d + 78 > 9 d for d <= 5; Delta <= 9 because N(v) is independent).
S_v = sum of the degrees of the neighbours of v;  sigma_v = S_v - 48 for a low v (sigma_v >= 0 by the private-cell count).
Published inputs that may enter: R(3,6)=18, R(3,7)=23, R(3,8)=28, R(3,9)=36 (orders); McKay's list of all
(3,8;27)-graphs (477,142; testbed/mckay/r38_27.g6) = "the pair catalogue"; McKay's list of all (3,7;22)-graphs
(191; r37_22.g6), said to be dispensable; e(3,8,27) = 85 (the minimum of that list).

## Claim 1 — n6 <= 2 under H0, with NO single-root floor, no P66, no Chen roster.

1a (L1, already confirmed in G8b): a low vertex has at most one low neighbour.            [H0 only]
1b (L2): two non-adjacent lows have exactly one common neighbour, and it is high.          [H0 + R(3,8)=28]
     (their common exterior has 26 + c vertices and alpha <= 7.)
1c Hence three lows induce either one edge plus an isolated vertex ("adjacent case") or no edge ("independent case").
1d ADJACENT CASE is impossible: u ~ h low, w low adjacent to neither. s = common neighbour of u, w; t = common
   neighbour of h, w (in N(w)); K = V - N[u] - N[w], a (3,8;27) card; A = N(u) - s = {h} + four labels; U = N(h) ∩ K,
   |U| = 4. Claimed necessary conditions on the four other rows R_a = N(a) ∩ K (4 <= |R_a| <= 7, independent):
     - every independent 7-set of K is avoided by at most one of the five A-rows; every independent 6-set by at most
       two (the labels plus the set are independent in G - N[w], alpha <= 8);
     - D = K - N_K[U] lies in N(t), hence is independent (maximality at the non-edge h–y);
     - sigma_u <= 3 and sigma_h <= 3 (u, h have a low neighbour), giving "any two A-rows meet in at most four points",
       "no two identical 4-rows", and slack lower bounds L(U) + max(0, F' - 1) <= sigma_h;
     - the four rows pairwise "compatible": jointly hit every independent 7-set of K and every independent 6-set of
       K - U, obey shared-point and slack bounds; need a 4-clique.
   COMPUTED by the claimant: 1,512,239 marks, 12,427,661 compatible pairs, ZERO 4-cliques on all 477,142 cards,
   two programs.
1e INDEPENDENT CASE is impossible: three independent lows u_1,u_2,u_3; centres c_i = common neighbour of the other
   two; all distinct (|A_i| = 4, T = common exterior of all three, |T| = 22) or all equal (|A_i| = 5, |T| = 21).
   K_i = T + A_i + u_i is a (3,8;27) card (common exterior of u_j, u_k) with u_i of degree 4 (or 5) whose puncture is
   the SAME labelled T in all three views. Q_i = N(c_i) ∩ K_i is a maximal independent set of K_i, |Q_i| = d(c_i) - 2;
   u_i not in Q_i (distinct) / Q_i - u_i = W the same subset of T (common). Degree equation at each z in T:
   d_G(z) = d_T(z) + sum_i (|N(z) ∩ A_i| + 1[z in Q_i])   (distinct centres).
   Counting: E_i = e(K_i) = e - S_j - S_k + d(c_i) + F with F >= 5; E_i + 33 <= min(e - S_j, e - S_k) (private-row
   count); with E_i >= 85: e >= 166; handshake with three lows: e <= 175.
   COMPUTED by the claimant: 166 "handshaking keys"; a scalar step excludes 127; 671 labelled states for 39 keys, all
   distinct centres and E_i <= 89; degree joins leave 6 states / 512 ordered alignments; in each alignment the
   supergraph of the exterior of one root (all A_i–A_j edges with disjoint T-neighbourhoods added) still has an
   independent 9-set, so G has an independent 10-set.
   Hypotheses I must check: (i) the case split (adjacent / independent; distinct / common centre) is complete;
   (ii) every inequality used is a valid consequence of H0 (in particular "h_i <= 2 + s_i" and "the lower slack
   charge on the four private labels"); (iii) maximality enters only where stated; (iv) no floor enters
   (E_i >= 85 is the catalogue minimum, not a floor).
1f Consequence on the roster: of the 281 survivors at floors (122,108,97,87), the 34 with n6 >= 3 fall; also the
   off-roster key (8,0,0,32).

## Claim 2 — the key (2,7,0,31) (n6=2, n7=7, n8=0, n9=31; e = 170) is excluded at floor f6 = 122.
   S_v <= e - 122 = 48 at each low, with S_v >= 48: S_v = 48 at both lows (tight stars: four private points per
   label, every other exterior point sees exactly two labels, each pair at most once). Parity: the six labels have
   total deficiency 6; if the lows were adjacent one label has deficiency 3 and the others even — impossible
   (claimed). So the lows u, w are non-adjacent with a unique common neighbour s and a 27-vertex common exterior K.
   At each star exactly three neighbours of degree 7 and three of degree 9 (so q = d(s) - 2 is 5 or 7). Parity then
   fixes the opposite-shore multiplicity at each K point. COMPUTED by the claimant: 66,188 eligible cards, zero
   admissible shores, two programs. Premises: H0, L1, R(3,8), the (3,8;27) list, floor 122 (which itself rests on
   Angeltveit's count 14,395 at 33/120-121 and GR Table 14).

## Claim 3 — the count: 238 + 35 = 273 of 519 excluded at floors (122,108,97,87); 108 + 1 = 109 of the 355 small;
   survivors 246 = 166 + 45 + 35 at n6 = 0, 1, 2.

## Claim 4 — the incidence-moment programme L6 (low_design_proof.md): 6 keys excluded with all single-root floors
   withheld (the previous audit had 1) and 17 at the published minima (118,104,95,86) (audit: 15). The extra seven:
   withheld: (7,0,1,32), (8,0,2,30), (8,0,4,28), (8,1,0,31), (8,1,2,29); at the minima: (7,1,3,29), (7,2,1,30).
   "20 integer contradictions" for these seven. Note: all seven have n6 >= 7, so IF claim 1 holds floor-free they
   are excluded floor-free anyway; claim 4 then matters only as a statement about the L6 programme itself.

## What would refute
- a graph that exists (n, a general) violating any general statement used (controls: exoo39 (39 v, 172 e),
  exoo-candidate (39 v, 167 e), C35, McKay's lists, maximalized);
- a gap in the case split; an inequality that does not follow from H0; a computational result I cannot reproduce.
