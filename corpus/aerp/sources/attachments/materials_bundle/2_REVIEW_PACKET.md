# EXTERNAL REVIEW PACKET — sum-difference constant claims

INSTRUCTIONS TO THE REVIEWER (an AI system or a mathematician):
You are being asked to act as a HOSTILE referee. Assume every claim below is wrong and try
to find the flaw. Please do NOT summarize approvingly; a confident "this looks correct"
is worth little here. What is valuable: (1) a specific mathematical error in a stated proof
or lemma; (2) a known theorem or prior paper that contradicts or anticipates a claim (cite
it precisely); (3) an independent re-derivation that arrives at a DIFFERENT formula or
constant. Where you can, actually compute: several claims below come with small buildable
instances or explicit finite objects that can be checked by direct computation. State
clearly, for each claim, whether you (a) verified it independently, (b) found a flaw
(state it exactly), or (c) could not decide.

------------------------------------------------------------------------------------

## The problem

For a finite non-empty set of integers A, write A+A = {a+b} and A-A = {a-b} for the
sets of distinct pairwise sums and differences, and |X| for cardinality. Define, for sets
with |A-A| > |A|,

    g(A) = ln(|A+A| / |A|) / ln(|A-A| / |A|).

Let C = sup_A g(A) over all finite integer sets. Equivalently C is the least constant such
that |A+A|/|A| <= (|A-A|/|A|)^C for every finite A. Ruzsa's inequality |A|*|A+A| <= |A-A|^2
gives C <= 2. Best published lower bound: roughly 1.126 (Penman & Wells, INTEGERS 13
(2013) A57, Thm 21).

*** DIRECTION WARNING — READ CAREFULLY, THIS IS THE #1 SOURCE OF REVIEWER ERROR. ***
Write sigma = |A+A|/|A| (doubling constant) and delta = |A-A|/|A| (difference constant).
The classical two-sided chain (Staps 2015, INTEGERS 15, A42; arXiv:1405.7536) is

        sigma^(1/2)  <=  delta  <=  sigma^2 .

There are TWO exponents in this chain and they belong to TWO DIFFERENT inequalities:
  * The RIGHT inequality  delta <= sigma^2  (from |A||A-A| <= |A+A|^2) governs the
    "few sums, many differences" direction. Its exponent 2 IS known to be optimal
    (attained in the limit by lattice points of simplices; Hennecart-Robert-Yudin). THIS IS
    NOT OUR QUESTION.
  * The LEFT inequality  sigma^(1/2) <= delta,  equivalently  sigma <= delta^2,  is
    EXACTLY our |A+A|/|A| <= (|A-A|/|A|)^C with C = 2. Of THIS exponent Staps writes,
    verbatim in the abstract: "for the exponent 1/2 this is unknown", and in the concluding
    remarks: "It remains unknown whether the inequality sigma(A) <= delta(A)^C is true for
    some exponent C < 2." Improving the left exponent 1/2 upward and lowering C below 2 are
    the SAME statement. OUR CLAIM CONCERNS ONLY THIS LEFT INEQUALITY.
Please state explicitly, before anything else, which of the two inequalities each of your
prior-art citations concerns. A citation about delta <= sigma^2 being sharp does not bear
on our claim.

A related caution about Kravitz (arXiv:2606.27087, June 2026): that paper studies
|A|-FREE exponents alpha(s,t,u,v) = lim log|sA - tA| / log|uA - vA| and proves that the
plain RATIO |A+A| / |A-A| can be arbitrarily large (its Cor 2.2). Neither statement is our
|A|-normalized constant C: Kravitz's own sets have |A| ~ q^(3/4), which forces g(A) -> 1,
and the paper never mentions the constant C, Ruzsa's inequality |A||A+A| <= |A-A|^2, or
Staps. We use only its Proposition 2.1 as a source of ingredients; the deduction to C = 2 is
made here. If you believe Kravitz (or anyone) has already established C = 2, please quote
the exact statement with its normalization.

QUESTION FOR YOU FIRST: with the two directions kept straight, is the LEFT-inequality
question (any C < 2 in sigma <= delta^C?) a genuinely open question with published lower
bound ~1.126, or is it settled somewhere? Cite precisely, stating each citation's
direction/normalization.

------------------------------------------------------------------------------------

## CLAIM 1 (a theorem, proof included) — the single-scale ceiling

THEOREM. Let A be a subset of {0,1,...,N} with 0 in A and N in A. Let B = {0,...,N} \ A
(the "holes"). Call d in [1,N] a "missing difference" if d is not in A-A. Then for every
integer j with 0 <= j < N/2:

    #{ missing differences d with d >= N - j }  <=  (1/2) * #{ b in B : b in [0,j] or b in [N-j, N] }.

PROOF. Let L = A ∩ [0,j], H = A ∩ [N-j, N], and Hhat = N - H = {N-h : h in H} ⊆ [0,j]. Since
j < N/2, the window E_j = [0,j] ∪ [N-j,N] is a disjoint union of two intervals, and
|B ∩ E_j| = 2(j+1) - |L| - |H|. Any present difference δ >= N-j is a' - a with a, a' in A,
0 <= a < a' <= N; from a' <= N and δ >= N-j we get a = a' - δ <= j, and from a >= 0 we get
a' = a + δ >= N-j; so a in L and a' in H are FORCED. Then a' - a = N - t where
t = a + (N - a') with a in L and N-a' in Hhat, i.e. t in (L + Hhat), and t <= j iff δ >= N-j.
Hence (A-A) ∩ [N-j, N] = { N - t : t in (L+Hhat) ∩ [0,j] }, so the number of missing
differences in [N-j,N] equals (j+1) - |(L+Hhat) ∩ [0,j]|. Since 0 in L (as 0 in A) and
0 in Hhat (as N in A), we have L ∪ Hhat ⊆ (L+Hhat) ∩ [0,j] (note L, Hhat ⊆ [0,j]), so
|(L+Hhat) ∩ [0,j]| >= |L ∪ Hhat| >= max(|L|,|Hhat|) >= (|L|+|H|)/2 (using |Hhat|=|H|).
Therefore #missing in [N-j,N] <= (j+1) - (|L|+|H|)/2 = (1/2)(2(j+1) - |L| - |H|)
= (1/2)|B ∩ E_j|.  QED.

COROLLARY. If EVERY missing difference exceeds N/2, then |A-A| >= N + |A|.
(Take j = N - (smallest missing difference), which lies in [0, N/2); all missing
differences lie in [N-j, N], so their number is <= |B|/2 by the theorem; then
|A-A| = 2N+1 - 2*(#missing) >= 2N+1-|B| = N + |A|.) If in addition A+A ⊇ [0,2N]
(all sums present), then g(A) <= ln((2N+1)/n) / ln((N+n)/n) with n = |A|, and

    sup over N, n of the right-hand side (as N -> infinity, n = δN) = sup_δ ln(2/δ)/ln((1+δ)/δ)
    = sup_κ ln(2+4κ)/ln(2+2κ)   (same function via δ = 1/(1+2κ))
    = 1.29381537334...

PLEASE VERIFY: (i) the proof of the theorem; (ii) that the two suprema are literally the
same function of a reparametrized variable and equal 1.29381537334...; (iii) the constant
1/2 — is it sharp? (Example: A = {0,14}, N=14, j=1: missing differences >= 13 are {13},
holes in [0,1]∪[13,14] are {1,13}: 1 <= (1/2)*2 with equality.)

------------------------------------------------------------------------------------

## CLAIM 2 (the main construction) — the "hollow bridge": C >= 1.5623948, limit 2

DEFINITIONS.
(a) A residue gadget: M in N and S ⊂ Z_M with S + S = Z_M (mod M). Its deficiency is
    x = |(S - S) mod M| / M. If (M1,S1),(M2,S2) are gadgets with gcd(M1,M2)=1, then the CRT
    product S = { CRT(s1,s2) : s1 in S1, s2 in S2 } ⊂ Z_(M1 M2) is a gadget with deficiency
    x1*x2 (please verify this multiplicativity claim in general; it uses the ring isomorphism
    Z_(M1M2) ≅ Z_M1 x Z_M2, under which S+S and S-S factor componentwise).
(b) B ⊂ [0,N] a thin additive basis of order 2 of the interval, i.e. B+B ⊇ [0,2N], with
    |B| about 2.83*sqrt(N) (e.g. the two-scale set {0..q-1} ∪ {multiples of q in [0,N]}
    ∪ {N-q+1..N} with q ~ sqrt(N/2), which satisfies B+B ⊇ [0,2N]; please confirm).
(c) Cluster width w = 2M. Skeleton K = union over β in B of [β*w, β*w + w). Span b = (N+1)*w.

THE SET. G_bot = { v in K : v mod M in S }. G_top = G_bot + D0 where D0 ≡ 0 (mod M) and
D0 ≈ 2b - 2M. F = the interval of ℓ = 4M consecutive integers centred between G_bot and
G_top. Define A = G_bot ∪ F ∪ G_top.

CLAIMED LEMMAS (each with the argument sketch — check them):
(C1) |A| >= ℓ + 1.
(C2) |A+A| >= 2*Dbar + 3 - 2M where Dbar = max(A)-min(A) is the diameter. I.e., ALL sums in
     the hull are present except at most ~2M "seam" values. ARGUMENT to check: a target sum
     t in [0,2b) decomposes as t = γ*w + u with γ = β+β' in B+B; a pair v1 = β*w + a,
     v2 = t - v1 = β'*w + (u-a) has v1,v2 in K iff a in the window
     W = [max(0, u-w+1), min(w-1, u)], and additionally we need a ≡ s1 with s1 in S and
     (u - s1) mod M in S — such s1 exists because S+S = Z_M. The window W contains at
     least M consecutive integers exactly when u in [M-1, 2w-1-M], hence contains every
     residue class, so t is a sum; and consecutive γ-blocks are contiguous iff w >= 2M-1.
     Conclusion: G_bot+G_bot ⊇ [M-1, 2b-1-M]; symmetrically for G_top+G_top and the mixed
     G_bot+G_top; the core F sits inside covered ranges. IS THIS ARGUMENT CORRECT AND
     EXACTLY SUFFICIENT? This is the load-bearing lemma.
(C3) |A-A| <= 2*( ℓ + |((F-K) ∪ mirror)^+ \ [1,ℓ]| + (floor(Dbar/M)+1)*|S-S| ) + 1.
     Key point to check: (G_bot - G_bot) mod M ⊆ S-S (algebra), so ghost-ghost differences
     occupy at most (2*range/M)*|S-S| ≈ Dbar * x integers — this is the term made small by
     small x; and F - K (dense core minus sparse skeleton) is a union of |B| translates of
     an interval of length ~ ℓ + w, so ~ |B|*(ℓ+w), which does NOT shrink with x.
(C4) g >= ln(s_LB/n_LB)/ln(d_UB/n_LB) using |A| ~ n_LB = ℓ+1 (monotonicity: with s > d,
     g is increasing in the lower bound used for |A| — please confirm this monotonicity
     claim, it is used to justify plugging in the LOWER bound for |A|).

THE CERTIFIED INSTANCE. Gadget: the CRT product of the following 43 pairwise-coprime
residue gadgets (each listed as modulus M_i and S_i ⊂ Z_(M_i); each is claimed to satisfy
S_i + S_i = Z_(M_i) — PLEASE VERIFY EACH BY BRUTE FORCE, and verify pairwise coprimality of
the moduli, and compute each deficiency d_i = M_i - |S_i - S_i|):

M = 29: S = {1, 5, 8, 16, 17, 21, 22, 23, 25, 28}
M = 31: S = {4, 6, 9, 10, 12, 17, 21, 23, 24, 28}
M = 37: S = {2, 7, 10, 11, 14, 15, 20, 21, 27, 28, 31, 34}
M = 41: S = {4, 7, 8, 11, 13, 14, 23, 25, 28, 29, 30, 34}
M = 43: S = {14, 15, 19, 20, 22, 24, 27, 30, 31, 32, 35, 37, 40, 42}
M = 47: S = {0, 4, 7, 13, 16, 17, 20, 23, 28, 31, 36, 37, 43, 46}
M = 49: S = {2, 6, 7, 9, 13, 16, 23, 25, 30, 34, 37, 39, 40, 41, 44}
M = 53: S = {3, 6, 19, 22, 25, 29, 32, 33, 37, 38, 43, 44, 47, 51}
M = 59: S = {2, 3, 8, 12, 15, 16, 28, 35, 45, 48, 49, 53, 54, 55, 57, 58}
M = 61: S = {1, 14, 15, 20, 25, 38, 39, 41, 43, 44, 46, 48, 49, 50, 52, 57}
M = 64: S = {2, 6, 11, 13, 16, 18, 25, 29, 40, 42, 44, 47, 53, 56, 59, 63}
M = 67: S = {7, 13, 21, 27, 31, 33, 35, 38, 40, 42, 45, 48, 53, 55, 59, 62}
M = 69: S = {1, 2, 3, 5, 6, 8, 9, 19, 22, 24, 25, 32, 40, 51, 54, 56, 64, 67}
M = 71: S = {2, 5, 7, 13, 14, 18, 20, 22, 23, 25, 30, 35, 38, 40, 45, 46, 58, 61, 63, 68}
M = 73: S = {10, 11, 15, 22, 26, 28, 29, 32, 33, 39, 43, 45, 50, 55, 56, 62, 66, 67, 69, 72}
M = 79: S = {1, 3, 12, 14, 19, 26, 27, 28, 33, 34, 35, 41, 42, 49, 60, 61, 62, 67, 69, 75}
M = 83: S = {1, 3, 6, 9, 14, 20, 22, 27, 29, 38, 43, 45, 52, 61, 66, 67, 68, 69, 75}
M = 89: S = {0, 3, 6, 9, 17, 19, 25, 28, 34, 42, 44, 46, 55, 57, 59, 67, 73, 75, 77, 86}
M = 95: S = {3, 4, 5, 10, 13, 16, 17, 18, 20, 24, 26, 33, 37, 39, 40, 52, 63, 66, 79, 85, 89}
M = 97: S = {6, 8, 10, 17, 19, 21, 24, 26, 29, 39, 40, 50, 59, 62, 69, 70, 71, 73, 74, 81, 85, 92}
M = 101: S = {1, 3, 4, 17, 18, 24, 26, 32, 33, 35, 49, 55, 61, 62, 63, 64, 70, 76, 77, 84, 90, 91, 93}
M = 103: S = {0, 6, 7, 14, 20, 24, 34, 36, 37, 38, 40, 46, 50, 58, 66, 67, 70, 76, 79, 80, 96, 97}
M = 107: S = {1, 3, 5, 10, 20, 30, 36, 38, 40, 46, 47, 51, 53, 55, 57, 59, 65, 66, 82, 94, 96, 101, 102}
M = 109: S = {1, 11, 18, 20, 44, 45, 48, 53, 55, 58, 63, 65, 68, 72, 73, 75, 76, 77, 85, 86, 95, 103, 106}
M = 113: S = {0, 4, 7, 12, 20, 23, 28, 34, 39, 47, 54, 61, 62, 68, 69, 74, 75, 82, 90, 101, 105, 106, 109, 112}
M = 121: S = {2, 5, 12, 21, 37, 38, 40, 43, 48, 49, 50, 61, 66, 67, 74, 83, 85, 90, 92, 93, 114, 115, 116}
M = 127: S = {9, 11, 16, 32, 36, 39, 42, 43, 44, 46, 47, 50, 54, 58, 64, 65, 76, 79, 81, 83, 86, 87, 106, 118}
M = 131: S = {5, 20, 30, 31, 40, 51, 58, 62, 65, 67, 74, 76, 79, 80, 89, 91, 96, 101, 102, 105, 111, 112, 116, 123, 127}
M = 137: S = {1, 5, 8, 18, 23, 25, 26, 27, 40, 48, 52, 57, 62, 67, 76, 77, 79, 80, 98, 99, 103, 108, 111, 120, 123, 133, 135}
M = 139: S = {4, 6, 8, 14, 15, 33, 37, 41, 43, 48, 58, 64, 66, 68, 75, 85, 94, 95, 100, 104, 105, 111, 115, 120, 122, 126}
M = 149: S = {0, 7, 8, 24, 34, 35, 40, 44, 46, 70, 74, 78, 83, 90, 102, 103, 108, 109, 110, 114, 115, 119, 120, 127, 136, 140, 145}
M = 151: S = {1, 2, 3, 9, 14, 16, 17, 28, 43, 46, 49, 57, 58, 62, 71, 83, 85, 90, 92, 97, 98, 101, 106, 113, 119, 120, 149}
M = 157: S = {1, 13, 17, 19, 22, 26, 42, 48, 51, 60, 67, 72, 76, 79, 83, 87, 92, 95, 111, 113, 115, 117, 123, 133, 138, 143, 146, 151, 154}
M = 163: S = {5, 7, 9, 10, 17, 23, 38, 39, 43, 51, 59, 62, 67, 70, 72, 77, 90, 105, 106, 112, 116, 120, 128, 132, 134, 139, 152, 158, 160}
M = 167: S = {7, 30, 33, 45, 46, 49, 50, 61, 63, 66, 69, 74, 75, 86, 87, 89, 90, 92, 95, 101, 104, 106, 107, 120, 125, 133, 151, 157, 162, 166}
M = 169: S = {3, 9, 10, 12, 16, 17, 20, 23, 30, 37, 44, 51, 55, 58, 59, 64, 66, 73, 103, 104, 105, 112, 132, 133, 140, 142, 147, 150, 157, 164}
M = 173: S = {7, 8, 10, 11, 14, 18, 22, 25, 26, 28, 29, 40, 47, 50, 65, 66, 84, 94, 96, 98, 100, 106, 110, 112, 118, 128, 132, 142, 143, 144, 146, 163}
M = 179: S = {12, 18, 21, 33, 34, 37, 43, 47, 61, 62, 68, 74, 80, 87, 90, 96, 97, 101, 113, 114, 123, 137, 141, 142, 147, 148, 154, 160, 163, 176}
M = 181: S = {0, 5, 13, 14, 15, 16, 24, 25, 26, 40, 41, 53, 56, 57, 61, 67, 70, 72, 73, 86, 102, 110, 118, 134, 137, 149, 150, 153, 154, 166, 169, 175}
M = 191: S = {7, 16, 23, 25, 27, 32, 38, 47, 54, 56, 70, 87, 92, 100, 101, 103, 104, 105, 112, 118, 127, 136, 138, 141, 142, 147, 149, 150, 154, 165, 167, 172, 180, 189}
M = 193: S = {0, 6, 10, 12, 17, 28, 29, 31, 34, 41, 45, 51, 65, 70, 76, 81, 84, 86, 88, 98, 104, 105, 116, 117, 118, 121, 139, 158, 164, 168, 169, 171, 187}
M = 197: S = {0, 13, 19, 20, 30, 41, 42, 48, 49, 50, 75, 83, 93, 94, 99, 106, 118, 119, 123, 127, 128, 129, 139, 147, 148, 158, 164, 168, 169, 174, 191}
M = 199: S = {11, 13, 19, 20, 24, 28, 33, 35, 39, 40, 44, 52, 59, 60, 64, 71, 77, 79, 88, 93, 97, 106, 113, 117, 131, 132, 139, 145, 170, 172, 174, 190, 191, 198}

Product modulus M = product of the M_i (an 86-digit integer); product deficiency
x = product over i of (M_i - d_i)/M_i = 5.74118409e-3 (please recompute). Geometry:
N = 20000 (so |B| = 399 for the two-scale basis), w = 2M, ℓ = 4M. The claim is that plugging
these into (C1)-(C4) yields |A+A|/|A| ≈ 60001.5 and |A-A|/|A| ≈ 1143.48, hence
g >= 1.5623948614589. Note the set A itself has about 4*10^85 elements and CANNOT be
enumerated — the claim rests entirely on the lemmas (C1)-(C4) plus the gadget data, so
those lemmas are what must be audited. However, SMALL INSTANCES ARE BUILDABLE: with a single
small gadget (e.g. M=12, S={0,1,2,4,5,9}, or the M=29 gadget above) and small N (10-60),
w in {2M, 3M}, you can build A explicitly and count |A|, |A+A|, |A-A| exactly to test
(C1)-(C3) — such small instances have g near 1 (because x is large), but they test the
STRUCTURE of the lemmas exactly. We strongly encourage doing this.

THE LIMIT. Using Kravitz, arXiv:2606.27087 (June 2026), Proposition 2.1 — claimed to state,
proven unconditionally: for every ε > 0 there exist q and A ⊆ Z/qZ with 2A = Z/qZ and
|A-A| <= εq — one gets gadgets with x <= ε; taking w = 2q and N ≈ 1/ε^2 the construction
gives g_N >= ln(3N)/ln(5 + 8.5*sqrt(N)) -> 2. Hence sup g = 2 and, with Ruzsa's C <= 2,
C = 2 exactly. QUESTIONS FOR YOU: (i) is Kravitz's Prop 2.1 stated and proven as claimed?
(ii) does the deduction to g -> 2 follow? (iii) is C = 2 (equivalently: the exponent 2 in
|A||A+A| <= |A-A|^2 is sharp) already known, conjectured, or refuted anywhere?

------------------------------------------------------------------------------------

## CLAIM 3 (secondary construction) — interior holes, liminf g >= 1.3365

A five-piece set A = LF ∪ LN ∪ [0,L] ∪ RN ∪ RF: a dense core interval [0,L]; a near
right fringe RN = L + P_N and near left fringe LN = -P_N'; a far right fringe
RF = (L+K+G) + P_F and far left fringe LF = -(K+G) - P_F', with an EMPTY gap G satisfying
L < G <= L+K between the near and far fringes. Each fringe is a lift of a residue gadget
S ⊂ Z_M (S+S = Z_M, τ = |S-S|/M) along a two-scale digit basis
B(q,j) = [0,q) ∪ q*{1,...,j} ∪ (j*q - [0,q)):
  P_N = (norm(S) + M*B(q, jN)) ∪ {K}, K = M*jN*q + M - 1;
  P_F = (norm(S) + M*B(q, q)) ∪ {K'}, K' = M*q^2 + M - 1;
with the tying L = M*q*(q - jN) so that K' = K + L, and G = K' - c*M with c >= 5. Claimed:
A+A is the full hull minus O(M) values at the two ends (because every fringe-pair sum is
residue-full, i.e. a translate of S+S = Z_M, and the intervals chain), while A-A has an
interior hole band (K+L, K+G) and a top hole zone touched only by τ-thin residue classes;
so with κ = K/L,

    liminf g >= ln(10 + 12κ) / ln(6 + 4τ + (4 + 6τ + 2ρ)κ),  where ρ in [τ, 2τ],

giving about 1.3379 at τ = 5.74e-3 (using the same 43-gadget product as above as a
ONE-set gadget) and ceiling ln(10+12κ)/ln(6+4κ) sup ≈ 1.34262 as τ -> 0. This claim is
independent of and weaker than Claim 2; buildable small instances (single gadget, small q)
have g near 1 but test the structural claims exactly.

------------------------------------------------------------------------------------

## CLAIM 4 (explicit and finite — CHECK THIS BY DIRECT COMPUTATION) — a counterexample
## to a natural conjecture

The natural conjecture "for every finite A ⊂ Z, |A+A| + |A| <= |A-A| + diam(A) + 1"
(where diam(A) = max A - min A) holds for every set of diameter <= 24 (exhaustively) but is
claimed FALSE via the following explicit set. Let q = 289731 = 3*13*17*19*23 and let

    S = union of residue classes {0 mod 969} U {0 mod 897} U {494 mod 741} U {782 mod 1173} U {442 mod 663} U {874 mod 1311}, taken mod q = 289731 = 3*13*17*19*23.

(Claimed: |S| = 1915 residue classes; S + S = Z_q exactly; |S - S| = 137667 = 0.47515*q.)
Define A = { v in [0, D] : v mod q in S } with D = 3577327 (that is, thirteen full periods
minus a partial top: D = 12*q + 100555). CLAIMED EXACT COUNTS:
    |A| = 23646, |A+A| = 6924316, |A-A| = 3370545, diam(A) = D = 3577327,
so |A+A| + |A| = 6947962 > |A-A| + D + 1 = 6947873, violating the conjecture by 89.
THIS IS DIRECTLY COMPUTABLE (a set of 23646 integers up to 3.6 million; the sumset and
difference set can be counted exactly with an FFT of the 0/1 indicator, checking the
convolution values round to integers, or with big-integer bitmask arithmetic). Please
compute it and report your exact three counts. Also please verify the gadget facts
(S+S = Z_q, |S-S| = 137667). If your counts differ from the claimed ones, that is the
single most valuable thing you could report.

------------------------------------------------------------------------------------

## What we most want from you, in order of value
1. Your own exact counts for Claim 4 (a computation, not an opinion).
2. Brute-force verification that each of the 43 gadgets satisfies S+S = Z_M, plus their
   deficiencies and pairwise coprimality of the moduli (small, mechanical, decisive).
3. A line-by-line audit of Claim 1's proof and of lemma (C2) in Claim 2.
4. Independent construction and exact counting of SMALL bridge instances (Claim 2) and
   small five-piece instances (Claim 3) to test whether the structural lemmas hold as
   stated on real, enumerable sets.
5. Prior art: any published result bearing on whether C < 2, any known additive basis of
   an interval with sublinear difference set, any inequality relating |A|, |A+A|, |A-A|
   beyond Ruzsa's / Freiman-Pigarev's that the certified numbers (|A+A|/|A| ≈ 60001.5,
   |A-A|/|A| ≈ 1143.48, |A| ≈ 4M) would violate.
Please separate clearly what you verified, what you could not, and what you dispute.
