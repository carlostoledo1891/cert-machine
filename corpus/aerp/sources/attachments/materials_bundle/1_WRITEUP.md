# The sum-difference constant is 2, and toward a dichotomy at 1.29381537

**STATUS: machine-generated and machine-refereed only.** Every claim below has been re-derived and/or rebuilt-and-counted by adversarial verifier agents, and the main construction and its proof were independently re-derived by two different model lineages (see Verification). NO human mathematician has reviewed any of it. The headline resolves a stated open problem and therefore requires expert human review before any public statement. This document is a draft for that review.

## Summary

For a finite non-empty set of integers $A$, write $g(A) := \ln(|A+A|/|A|)/\ln(|A-A|/|A|)$ (defined when $|A-A| > |A|$), and let $C := \sup_A g(A)$ — the least constant such that $|A+A|/|A| \le (|A-A|/|A|)^C$ for all finite $A$. In Staps's notation ($\sigma = |A+A|/|A|$, $\delta = |A-A|/|A|$) the classical chain is $\sigma^{1/2} \le \delta \le \sigma^2$; the right-hand exponent 2 is known to be sharp, while for the left-hand exponent $1/2$ (equivalently, whether $\sigma \le \delta^C$ holds for some $C < 2$) Staps (INTEGERS 15 (2015) A42) writes that "this is unknown." The best published lower bound was $C \ge \ln(32/5)/\ln(26/5) \approx 1.126$ (Penman–Wells 2013). We report:

1. **$C = 2$.** The exponent 2 in Ruzsa's inequality $|A||A+A| \le |A-A|^2$ is sharp. Proof: a construction (the "one-ghost" set, §1) achieving $g(A) \to 2$, using as input the recent unconditional proposition of Kravitz (arXiv:2606.27087, Prop. 2.1) that for every $\varepsilon>0$ there exist $q$ and $S \subseteq \mathbb{Z}/q\mathbb{Z}$ with $S+S = \mathbb{Z}/q\mathbb{Z}$ and $|S-S| \le \varepsilon q$.
2. **A concrete unconditional certificate $C \ge 1.6269$**, computed from a fixed 43-gadget product with an 86-digit modulus (the "hollow bridge", §2), independent of Kravitz's proposition.
3. **A refereed ceiling theorem** (§3): any set whose missing differences all exceed half its diameter satisfies $|A-A| \ge \mathrm{diam}(A) + |A|$, which caps every "single-scale" construction at exactly $\sup_\kappa \ln(2+4\kappa)/\ln(2+2\kappa) = 1.2938153733\ldots$ This explains why all previously known mechanisms — and our own earlier ones, and every one of ten blind machine searches — converged to that value.
4. **Toward a dichotomy (§4).** Every construction attaining $g > 1.2938$ misses a vanishing but positive fraction of sums. We conjecture (H-exact): if $A+A = [0, 2\,\mathrm{diam}]$ *exactly*, then $|A-A| \ge \mathrm{diam} + |A|$, so exact-all-sums sets are capped at $1.2938$ while general sets reach $2$. We prove H-exact in two of its three natural cases and reduce the third to a sharply characterized configuration; it holds by exhaustive/exact search through diameter 59.
5. **An explicit finite counterexample** (§5) to the natural strengthening of H-exact that permits missing sums: a set of 23,646 integers, counted independently five ways, on disk.

## 1. Main theorem: the one-ghost construction ($g \to 2$)

**Ingredients.** A residue gadget: $q$ and $S \subseteq \mathbb{Z}_q$ with $S+S = \mathbb{Z}_q$, translated so $0 \in S \subseteq [0, q-1]$; deficiency $x := |(S-S) \bmod q|/q$. An integer $m \ge 4$, $N := m^2$, and the interval basis $B := [0, m-1] \cup m\{0,\ldots,m\} \cup [N-m+1, N]$, with $|B| = 3m-1$ and $B+B = [0, 2N]$.

**The set.** Let $w := 2q$, $K := \bigcup_{\beta \in B} [\beta w, \beta w + w - 1]$, and $G := \{v \in K : v \bmod q \in S\}$ (the "ghost"). Between the clusters at $\beta = jm$ and $\beta = (j+1)m$ (with $j = \lfloor m/2 \rfloor$) there is an empty gap of length $2q(m-1) \ge 4q$; let $F := [f_0, f_0 + 4q - 1]$ be the exactly-centred interval of $4q$ integers in it, $f_0 = q(2jm + m - 1)$. Define $A := G \cup F$. Then $F \cap K = \emptyset$, $|A| = 4q + 2(3m-1)|S|$ exactly, and $\mathrm{diam}(A) = (2N+1)q + \max S$.

**Lemma 1 (sums).** $G + G \supseteq [q-1,\, 2(N+1)w - 1 - q]$. *Proof.* A target $t = \gamma w + u$ with $\gamma = \beta_1 + \beta_2 \in B+B$: choose $s_1, s_2 \in S$ with $s_1 + s_2 \equiv u \pmod q$ (possible since $S+S = \mathbb{Z}_q$); seek $v_1 = \beta_1 w + a$, $v_2 = \beta_2 w + (u-a)$ with $a$ in the positional window $W_u = [\max(0, u-w+1), \min(w-1, u)]$ and $a \equiv s_1 \pmod q$ (note $\beta w \equiv 0 \pmod q$). $W_u$ contains a full residue system iff $|W_u| \ge q$ iff $q-1 \le u \le 3q-1$, and consecutive $\gamma$-blocks connect since $w = 2q \ge 2q-1$. Hence
$$|A+A| \ge (4N+2)q + 1.$$

**Lemma 2 (differences).** $|F-F| \le 8q-1$; the mixed differences $F - K_\beta$ and $K_\beta - F$ for each of the $3m-1$ clusters together number at most $2(3m-1)(6q-1)$; and $(G-G) \bmod q \subseteq S-S$, so, $G$ having diameter $< (2N+2)q$, $|G-G| \le 2 \cdot 2(N+1)|S-S| = 4xq(N+1)$. Hence
$$|A-A| \le 8q - 1 + 2(3m-1)(6q-1) + 4xq(N+1) = 36qm(1+o(1)) + 4xq(N+1).$$

**Theorem.** Choose gadgets (from Kravitz Prop. 2.1) with $x \le m^{-4}$. Then $|G| \le 2(3m-1)|S| \le 6m x q \le 6q/m^3 = o(q)$ (using $|S| \le |S-S| = xq$), so $|A| = 4q(1+o(1))$, whence $\sigma = |A+A|/|A| \ge m^2(1+o(1)) = N(1+o(1))$ and $\delta = |A-A|/|A| \le 9m(1+o(1)) = 9\sqrt{N}(1+o(1))$. Therefore
$$g(A) \ge \frac{\ln N}{\ln(9\sqrt N)} = 2 - \frac{4 \ln 9}{\ln N + 2\ln 9} \longrightarrow 2 .$$
With Ruzsa's $C \le 2$, $C = 2$. (Optimizing the core length $|F| = tq$ at $t = 2$ gives the rate coefficient $\ln 5184 \approx 8.553$; a two-ghost "hollow bridge" variant achieves $2\ln(16/3) \approx 3.348$.) The requirement $x \le m^{-4}$ silently forces $q \ge m^8$ (indeed $\gtrsim m^{16}$ for Kravitz's $|S| \asymp q^{3/4}$), a size constraint that obstructs nothing since $q$ cancels from $\sigma$ and $\delta$.

**Enumerable sanity instance** ($q = 12$, $S = \{0,1,2,4,5,9\}$, $m = 4$; here $x = 11/12$ so $g$ is near 1 — this tests the lemmas, not the value): $N = 16$, $w = 24$, $B = \{0,1,2,3,4,8,12,13,14,15,16\}$, $F = [228, 275]$, $\mathrm{diam} = 405$, and $|A| = 180$, $|A+A| = 807$, $|A-A| = 789$ — computed identically by two independent methods in each of two independent verifications; Lemmas 1–2 hold as inequalities.

## 2. A concrete unconditional certificate: $C \ge 1.6268626$

The "hollow bridge" $A = G_{\mathrm{bot}} \cup F \cup G_{\mathrm{top}}$: two positionally-sparse ghost skeletons (a thin additive basis $B \subset [0,N]$ of $|B| \approx 2.83\sqrt N$ blown up by cluster width $w = 2M$ and restricted to residues in $S$), with $G_{\mathrm{top}} = G_{\mathrm{bot}} + D_0$, $D_0 = (4N+2)M$ exactly, and a dense core interval $F$ of length $\ell$ centred between them. Certified lemmas: (C1) $|A| \ge \ell + 1$; (C2) $|A+A| \ge 2\bar D + 3 - 2M$ (all sums except $\le 2M$ seam values); (C3) $|A-A| \le 2(\ell + |((F-K)\cup \text{mirror})^+ \setminus [1,\ell]| + (\lfloor \bar D/M\rfloor + 1)|S-S|) + 1$; (C4) $g \ge \ln(s_{LB}/n_{LB})/\ln(d_{UB}/n_{LB})$ (monotone in $|A|$). With the CRT product of 43 pairwise-coprime deficient sum-bases (moduli $\le 199$; $M$ an 86-digit integer; $x = |S-S|/M = 0.005741184090625251\ldots$), the symmetric two-scale basis with $N = kQ$, $k = 69$, $Q = 10^{12}$, and core length $tM$, $t = 57{,}933{,}464{,}594$, one gets $|A+A|/|A| = 14292.257\ldots$, $|A-A|/|A| \le 358.1439\ldots$, hence
$$C \;\ge\; 1.62686262387801575\ldots$$
(The symmetry $N = kQ$ makes the top and bottom interval families coincide exactly, $J_\beta = I_{N-\beta}$, which is what the count exploits; the earlier, geometrically simpler instance $N = 20000$ gave $1.5623948614589$, reproduced independently to 40 digits by three verifiers.)

## 3. The single-scale ceiling theorem

**Theorem.** Let $A \subseteq [0, D]$ with $0, D \in A$, holes $B_h = [0,D] \setminus A$, and $M$ the missing positive differences. For every $0 \le j < D/2$: $\#\{d \in M : d \ge D-j\} \le \tfrac12 \#(B_h \cap ([0,j] \cup [D-j, D]))$. *Proof sketch.* A present difference $\delta \ge D-j$ forces $a \le j$ and $a' \ge D-j$; then $(A-A) \cap [D-j, D] = \{D - t : t \in (L + \hat H) \cap [0,j]\}$ with $L = A \cap [0,j]$, $\hat H = D - (A \cap [D-j, D])$; since $0 \in L \cap \hat H$, $|(L+\hat H) \cap [0,j]| \ge |L \cup \hat H| \ge (|L|+|H|)/2$.

**Corollary.** If every missing difference exceeds $D/2$, then $|A-A| \ge D + |A|$; and for such $A$ with all sums present, $g(A) \le \ln((2D+1)/n)/\ln((D+n)/n)$, whose supremum is $\sup_\delta \ln(2/\delta)/\ln((1+\delta)/\delta) = \sup_\kappa \ln(2+4\kappa)/\ln(2+2\kappa) = 1.2938153733\ldots$ (the same function under $\delta = 1/(1+2\kappa)$). The constant $\tfrac12$ is sharp. This is why every single-scale mechanism — including two independent constructions of ours and the best result of a ten-agent blind survey — converges to exactly $1.29381537$.

## 4. Toward the dichotomy: the exact-all-sums conjecture

**Conjecture (H-exact).** $A \subseteq [0,D]$, $0, D \in A$, $A + A = [0, 2D]$ $\Longrightarrow$ $|A - A| \ge D + |A|$; equivalently $2|M| \le b$ with $b := D+1-|A|$ the number of holes. If true, exact-all-sums sets are capped at $1.29381537$ while $C = 2$: a dichotomy.

**Proved cases.**
- *(Top deletions.)* If $\min M > D/2$: by §3. (No sum hypothesis needed.)
- *(Dense sets — Theorem D.)* If $|A| \ge (D+3)/2$ then $|A-A| \ge D + |A|$, no sum hypothesis needed. *Proof.* With $R(A) := D - A$, one has $A + R(A) = D + (A-A)$, so $|A-A|$ is a sumset of two distinct equal-diameter sets; the Lev–Smeliansky theorem then gives $|A-A| \ge \min(D+|A|, 3|A|-3)$ whenever $\gcd(A) = 1$, and density $\ge (D+3)/2$ selects the first branch. (Consequence $(\star)$ $|A-A| \ge \min(D+|A|, 3|A|-3)$ verified exhaustively for all $A$, $D \le 26$; the frontier is exactly "least odd integer $\ge \min(D+n, 3n-3)$", tight in both branches.)
- *(No adjacent missing differences.)* Under all-sums, each $d \in M$ certifies double holes at $d$ and at $d+1$ (both $d$ and $D-d$ absent from $A$, using the forced elements $1, D-1 \in A$), so $M \cup (M+1)$ consists of "double holes." Hence if no two consecutive integers are both missing differences, $b \ge |M \cup (M+1)| = 2|M|$ and H-exact holds.

**The residual open case.** Sparse sets ($|A| \le (D+2)/2$) with some missing difference $d \le D/2$. A counterexample must simultaneously exhibit: long runs of *consecutive* missing differences, near reflection-symmetry ($|A \triangle R(A)|$ small), almost no double holes beyond the forced ones, and a Hall-deficient collision pattern among the representations of the corresponding sums. No computed example comes remotely close.

**Certification.** H-exact holds by exhaustive enumeration for all $D \le 37$ (over $3.9 \times 10^9$ sets at $D = 37$), by exact MILP/CP-SAT optimization through $D = 59$, with the interval $[0,D]$ the *unique* extremal set in every checked case; in the residual open case the certified margin is linear ($\max(2|M|-b) \approx -(D/3+2)$ for $D = 30, \ldots, 60$). Known dead ends: the interior "window" analogue of §3 is false among all-sums sets from $D = 20$; the complementary-pair lemma ($d, D-d$ not both missing) is false under all-sums from $D = 35$ (though pairs always come with $\approx D/2$ slack); a lift-type set with an end-cap graft can achieve exact all-sums but only with linear H-slack (the caps' new differences consume the savings).

## 5. Counterexample to the strong form (explicit, finite)

The strengthening $|A+A| + |A| \le |A-A| + \mathrm{diam}(A) + 1$ (which tolerates missing sums) is false: with $q = 3\cdot13\cdot17\cdot19\cdot23 = 289{,}731$ and $S$ the union of six residue classes ($|S| = 1915$, $S+S = \mathbb{Z}_q$ exactly, $|S-S| = 137{,}667$), the set $A = \{v \in [0, 3{,}577{,}327] : v \bmod q \in S\}$ has $|A| = 23{,}646$, $|A+A| = 6{,}924{,}316$, $|A-A| = 3{,}370{,}545$, violating the inequality by exactly $89$. This is the smallest violator in its family (13 full periods first violate; 12 periods plus the truncated top period is minimal), the gadget is minimal of its type (no such gadget with $\le 4$ CRT coordinates exists, SAT-certified), and the counts were confirmed by five independent methods across two model lineages. The strong form holds for all sets of diameter $\le 24$ exhaustively.

## Verification (all machine, adversarial, two model lineages)

- **§1 one-ghost proof:** proved by one model (gpt-5.6-sol); independently re-derived from the bare definition by a blind Claude clean-room, which matched every lemma, reproduced the sanity instance bit-for-bit, and found only a favorable slack (a valid but doubled term in the difference bound; the corrected rate is stated above).
- **§2 bridge:** hostile Claude referee independently derived the sum-coverage lemma, built 22 instances from scratch across a parameter sweep with zero unexplained differences, verified all 43 gadgets and coprimality by brute force, confirmed the deficiency scaling is linear and nearly tight, and reproduced $1.5623948614589$; the improved $N = kQ$ instance's exact interval union was computed in exact integers by gpt-5.6-sol and its key coincidence identity checked independently.
- **§3 ceiling theorem:** proved, independently re-derived (via a "half-price law"), and refereed valid with proof audit plus exhaustive check over 4.19M sets (constant $\tfrac12$ shown sharp).
- **§4:** Theorem D's reflection reduction is elementary; its consequence $(\star)$ exhaustively verified to $D = 26$; the double-hole lemma is a short elementary argument; the certifications are exact enumeration and CP-SAT/MILP optimality proofs, arrived at independently by both lineages ($D = 58, 59$).
- **§5:** five independent counters, plus a family-minimality proof.
- **Prior art / consistency:** literature search found none of the constructions, the ceiling theorem, or a claim of $C = 2$ anywhere; Staps's own text confirms the left exponent open; the bridge certificate's exact integers satisfy Freiman–Pigarev (margin $e^{48}$) and Ruzsa ($22\times$), and no other unconditional inequality on $(|A|, |A+A|, |A-A|)$ exists to contradict; Kravitz Prop. 2.1 confirmed stated and proven unconditionally as used, its paper drawing no conclusion about $C$.

## Sharp open problem

Prove or refute H-exact in the residual case: an exact-all-sums set $A \subseteq [0,D]$ with $|A| \le (D+2)/2$ and a missing difference $\le D/2$ satisfies $2|M| \le b$. By the reductions above this is equivalent to the full conjecture, and it is precisely the case that must use the sum hypothesis.

## Reproducing

Working directory `~/Documents/Claude Code/record-hunt/`. One-ghost proof: `reviews/` (gpt-5.6-sol rounds) and `oneghost/cleanroom/` (Claude clean-room). Bridge and certificate: `explore/strike/gadget_recursion/` with referee rebuild in `.../referee/`. Ceiling theorem: `explore/strike/extremal_theory/` (+ `referee/`, and the independent `nested_residues/` derivation). Dichotomy work: `dichotomy/` (Claude strike) and `reviews/` (gpt-5.6-sol rounds 4–5). Counterexample: `explore/strike/H_violator/STRONG_violator_D3577327.txt`. Prior art: `explore/strike/reconcile/`. Blind survey: `explore/LANDSCAPE.md`. Earlier single-scale records: `t42_sumdiff/`. Elementary enumerable certificate for $C \ge 1.163$: `CERTIFICATE.py`. External-review packet: `EXTERNAL_REVIEW_PACKET.md`.
