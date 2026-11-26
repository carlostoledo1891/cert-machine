# AUD-2 — the two single-source exclusions of Astra D, in my own words (written 2026-11-25 from 07:43 UTC, from the TEXT of
# REPORT-5.md, REPORT-6.md, work/g22/ROOT-AGREEMENT.md and work/g24/LOW-ROOT-PROOF.md only; no program, receipt, tsv or
# out file of the claimant opened before this file was frozen)

H0: G maximal triangle-free (MTF), 40 vertices, alpha(G) <= 9. Keys (n6, n7, n8, n9). For a vertex x, S_x = sum of the
degrees of its neighbours, and (triangle-free) e(G - N[x]) = e - S_x. A single-root floor f_d means e(G - N[x]) >= f_d
for every vertex x of degree d.

## Claim A (G22): the key (0,16,0,24) is impossible.
A1 e = 164. Floors used: f7 = 108 (supported, G8) and the PUBLISHED minimum e(3,9,30) = 86 at degree 9 (not 87, not 88).
   A degree-7 vertex with r degree-9 neighbours has S = 49 + 2r <= 164 - 108 = 56, so r <= 3; a degree-9 vertex with t
   degree-7 neighbours has S = 81 - 2t <= 164 - 86 = 78, so t >= 2. Counting the 7–9 cut both ways (16 * 3 = 48 = 24 * 2)
   forces r = 3 and t = 2 everywhere.
A2 So the 16 "lows" (degree 7) induce a 4-regular triangle-free graph L; each "high" (degree 9) has exactly two low
   neighbours, which are non-adjacent in L; the highs are the edges of a cubic loopless multigraph M on V(L) supported on
   non-edges of L; each high has exactly 7 high neighbours (its "row").
A3 Views: for an independent low set S, B = lows outside N_L[S], U = highs with no endpoint in S; G[B ∪ U] = G - N[S] is
   triangle-free with alpha <= a = 9 - |S|. For every high h: |Y_h ∩ U| + |e_h ∩ B| <= a; for h in U also
   >= |B| + |U| - 1 - m(a - 1), m(k) = R(3, k+1) - 1. Rows have 7 bits, avoid labels meeting either endpoint of h;
   reciprocity (j in Y_h iff h in Y_j); adjacent highs have disjoint rows (triangle-free).
A4 COMPUTED by the claimant: "541 low templates" (from a "double-generated low-template census", earlier 16,829 candidate L
   reduced to 541 in G16), all admissible cubic incidences; two programs; the second visits 670,973 leaves/orbit
   representatives; 5 pass the row tests; none passes reciprocity + triangle compatibility. Premises claimed: maximality,
   the independence bound, small Ramsey orders, the low-template census, f7 = 108, the published minimum 86. Not P66, not f6,
   not f8. "With the single-root floors removed, this round certifies zero new whole keys."
   Points to check: is the 541-template census complete (how was it generated; what conditions cut 16,829 to 541)? Is every
   condition used necessary (does any use criticality or a minimum-edge assumption)? Is the cubic-incidence enumeration
   complete under the symmetry reduction?

## Claim B (G24): the key (0,4,28,8) is impossible.
B1 e = 162. Floors used: f7 = 108, f8 = 97, f9 = 87 (supported, G8). S_x <= 54, 65, 75 for degrees 7, 8, 9; sum of S_x =
   sum of d^2 = 2636 = 4*54 + 28*65 + 8*75, so every bound is attained. With S = 8d + b - a (a = degree-7 neighbours,
   b = degree-9 neighbours): lows a - b = 2, middles b - a = 1, highs b - a = 3; hence the 4 lows form a 4-cycle and see no
   high; highs see no low and form a cubic graph on 8; each middle sees one more high than low.
B2 Low v, opposite low w, R = G - N[v]: 32 vertices, 108 edges, alpha <= 8 (a (3,9;32,108)-graph). d_R(w) = 5 - p (p =
   middles adjacent to both v and w), so d = d_R(w) <= 5. By maximality every vertex of R loses at least one neighbour to
   N(v); degree-8 vertices of R are highs losing exactly one; the 5 middle neighbours of v carry 10 + p high incidences =
   total loss of the 8 highs; hence k = #degree-8 vertices of R satisfies d + 1 <= k <= 7, and no degree-8 vertex of R is
   adjacent to w (w sees no high).
B3 K = R - N_R[w] contains the 5 other neighbours of a common low neighbour b of v and w; they are independent and, by
   maximality, dominate K: K has an independent dominating (= maximal independent) 5-set.
B4 COMPUTED by the claimant: the complete 32/108 layer = 2,104,151 isomorphism classes (GR2013 Table 14 count), from two
   private files l32up.g6 and waveDall.g6, validated (order, size, triangle-free, no independent 9-set, pairwise distinct
   Traces canonical forms). The degree test leaves 12 root choices in 10 classes (4 punctures with 76 edges, 8 with 77);
   in each, the best independent 5-set leaves exactly 2 vertices undominated: no admissible root. Premises claimed:
   H0, f7 = 108, f8 = 97, f9 = 87 (and their published layer counts), the published count 2,104,151 for 32/108. Not P66,
   not f6, not 88, not the 27-list.
   Points to check: the derivation B1-B3 (in particular "every bound attained", the low 4-cycle, the loss count); the
   completeness of the 32/108 catalogue (can I obtain it and verify count, validity and distinctness myself?); whether
   R's degrees can exceed 8 (no: alpha(R) <= 8 bounds them); and my own flag test.

## ADDENDUM (written 2026-11-25 from 09:19 UTC from the TEXT of REPORT-7.md, work/g27/ATTACHMENT.md and KEY-PROOFS.md only;
## the part above was frozen at 07:43 with sha256 928b0e9f...a3f, CLAIMS-AUD2.freeze.sha256)

## Claim C (G27): the degree-7 floor rises to f7 >= 109, and 8 more keys fall.
C1 Root v of degree d in a maximal triangle-free G (order n, alpha <= a); H = G - N[v]. For y in N(v), the row S_y = N(y) ∩ H
   is independent and DOMINATES H (a vertex x of H off S_y has a common neighbour with y, which lies in H). Every x in H
   lies in some row (common neighbour with v). A "hole" = non-adjacent x, z in H with no common neighbour in H; some row
   contains both. x lies in at most a - deg_H(x) rows (its ambient neighbourhood is independent). Distinct rows suffice.
   So H must admit a cover of its vertices and holes by at most d maximal independent sets with these capacities.
C2 n = 40, a = 9, d = 7: H has 32 vertices, alpha <= 8, and (floor 108 known) e(H) >= 108. If no card of the complete 32/108
   layer (2,104,151 classes) admits such a cover, then e(H) >= 109: f7 >= 109. Premises: H0, the earlier floor 108 (GR layer
   counts 32/104-107 and their attachment exclusions), the published count 2,104,151 at 32/108. No other floor, no P66.
   COMPUTED by the claimant: two programs reject all 2,104,151 cards; controls on real graphs accept their roots; a planted
   card at the target parameters is accepted.
C3 Transfers (REASONED, hand proofs): with f7 = 109 alone: (0,1,30,9), (0,2,30,8), (0,3,28,9); with f7 = 109, f8 = 97, f9 = 87:
   (0,10,14,16), (0,11,12,17), (0,12,10,18) (sum of neighbourhood bounds 2700 - 2k vs sum of squares 2662 + 2k at 163 edges),
   (0,15,0,25) (incidence count 110 > 105), (0,15,2,23) (incidence count plus R(3,8) = 28 on the two degree-8 vertices).
   Total claimed 283 of 519.
