# Decider B — H1 and H4(i) of PREREG-HEPTAGON (clean room), 2026-11-07

**Verdict: every finite identity the paper states for the heptagon (Theorem 1) and for the generic seven-point
set (Theorem A.3) is CERTIFIED — 152 of 152, 0 REFUTED — with r (respectively t₁..t₇) a symbol.**
Energy of the heptagon: Σλ‖D(p)‖² = −24/R exactly; reduced over ℚ it is −3 / (r³ − 4r² + 19/4·r − 3/2), i.e. −24/(8r³ − 32r² + 38r − 12).

## What did not match the paper's claim, or needs a word (none is a refutation)

1. **Equation (2) of the main text is stronger than Lemma A.1, and the stronger form is false for Theorem A.3's set.**
   The main text (.tex 103) states Σλ D(p)pᵀ = 0. Lemma A.1 (.tex 270) asks only that M = Σλ D(p)pᵀ be symmetric.
   For the heptagon both hold (M is the zero matrix). For the generic set of Theorem A.3, M is symmetric but NOT zero:
   at t = (0,1,2,3,5,7,11) it is [[92, −86], [−86, −92]]/19825 (exact). So A.3 genuinely needs Lemma A.1's symmetric
   form (via the circle criterion A.4, .tex 310–316); a reader who carried the main text's "= 0" into A.3 would find it
   false. The proof as printed is correct on this point.
2. **The quadratic moment must be zero, not merely symmetric.** The brief asked what Lemma A.1 requires of Σλ p pᵀ:
   its third condition (.tex 267) is Σλ p pᵀ = 0 (the matrix is symmetric by construction; symmetry says nothing).
   The condition that is only "symmetric" is the one on M. Both decided: Σλ p pᵀ = 0 for the heptagon and for the
   generic set; M = 0 for the heptagon, M symmetric (and ≠ 0) for the generic set.
3. **Sign in the twelve-colouring (cosmetic).** The displayed colouring is ⌊F/4⌋ mod 12 (.tex 1174); the general recipe
   ⌊L·F/E⌋ mod 2L (.tex 1188) with L = 6, E = −24 reads ⌊−F/4⌋ mod 12. Both avoid the configuration by the same
   open-interval argument; both decided. No gap.
4. **Non-finite steps, listed, not decided** (H4(ii) is someone else's stage): see "Theorem A.3" below.

## System (clean room)

Python 3.9.6, standard library only: `fractions.Fraction` and a sparse multivariate polynomial ring written in
`decider_b.py` (≈ 900 lines). The relations y_j² = j(2r−j) and c² = 1 − s² are applied as a normal form (their leading
monomials y_j², c² are pairwise coprime, so the normal form is canonical: "normal form = 0" is a decision). Rational
elements are num/den with den univariate (in r or in the stereographic parameter T); equality is decided by
cross-multiplication; a univariate gcd is used only to print the reduced energy. The derivation D is implemented from
its rules on generators by Leibniz on monomials and the quotient rule; D(y_j) = y_j/(2r−j) is DERIVED from
2y·D(y) = D(y²) = D(j(2r−j)) = 2j (so D(y) = j/y = j·y/y² = y/(2r−j)) and checked back against the relation.
No sympy, no third-party code, nothing read from any other decider or checker; the only input is the pinned TeX
(sha256 681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1, matching PINS-HEPTAGON.txt; the PDF was
consulted only to confirm that eq:moments is Equation (2) and eq:energy Equation (3)).

Self-check: three mutants (env `MUTANT=weight` — weight 1 for 2 on the j = 3 pair; `offcircle` — the j = 4 pair moved
to y₄² = 4(2r−5); `generic-weight` — λ_i = (1+t_i²)³/H′(t_i)) refuse 23, 19 and 22 identities respectively, at the
rows one expects (see `mutants/`). The clean run writes `result-b.json` and `run.log`.

Run: `python3 decider_b.py` (8 s). Mutants: `MUTANT=weight python3 decider_b.py` etc.

## The heptagon — what the paper states (with .tex lines) and the verdicts

- Points P = {(0,0)} ∪ {(j, ±√(j(2r−j))) : j ∈ {1,3,4}} on (x−r)² + y² = r², r > 2 transcendental (.tex 49–54).
  Weights: 2 at the origin, −2 / 2 / −1 at each point with first coordinate 1 / 3 / 4 (.tex 93–94) — **as in the
  brief; the paper's and the brief's weights agree.** The multisets {0,3,3}, {1,1,4} (.tex 94–96): equal cardinality,
  sums (6), sums of squares (18) — CERTIFIED.
- The derivation (.tex 77–91): D(1) = 0, D(r) = 1, D(p) = (0, j/y) — CERTIFIED (y·D(y)_2 = j, first coordinate 0, Leibniz
  consistency D(y_j²) = 2j).
- Equation (2) (.tex 97–105), five identities: Σλ = 0; Σλp = 0 (both coordinates); Σλppᵀ = 0 (full 2×2 matrix, reported
  [[0,0],[0,0]]); ΣλD(p) = 0 (both coordinates); Σλ D(p)pᵀ = 0 (full matrix, reported zero; also symmetric) — all CERTIFIED.
- Equation (3) (.tex 107–112): Σλ‖D(p)‖² = −4/(2r−1) + 12/(2r−3) − 8/(2r−4) = −24/R, R = (2r−1)(2r−3)(2r−4) — CERTIFIED;
  reduced numerator −3, monic reduced denominator r³ − 4r² + (19/4)r − 3/2 (= R/8).
- Invariance (.tex 114–147): p′ = t + Ap with t = (a₁,a₂) symbolic, D(a_i) = w_i free; A the rotation [[c,−s],[s,c]] and
  the reflection [[c,s],[s,−c]] with c² + s² = 1 a relation; D(c) = −ω·s, D(s) = ω·c with ω free (this is the general
  solution of c·D(c) + s·D(s) = 0 given c² + s² = 1: (u,v) ⊥ (c,s) ⇒ (u,v) = ω(−s,c), ω = c·v − s·u; decided).
  D is applied DIRECTLY to the coordinates of p′ (no product rule assumed), and separately the paper's five groups
  (.tex 127–135) are formed and shown to sum to the direct value:
  T0 = ‖D(t)‖²Σλ (killed by the zeroth moment), T1 = 2⟨D(t), D(A)Σλp + AΣλD(p)⟩ (killed by the first moment and the
  derivative first moment), T2 = Σλ‖D(A)p‖² = tr(D(A)ᵀD(A)·Σλppᵀ) (killed by the quadratic moment = 0),
  T3 = 2Σλ⟨D(A)p, AD(p)⟩ = 2tr(D(A)ᵀA·M) (killed by M symmetric and D(A)ᵀA skew — D(A)ᵀA + AᵀD(A) = 0 decided),
  T4 = Σλ‖AD(p)‖² = Σλ‖D(p)‖² = −24/R (A isometric). Σλ‖D(p′)‖² = −24/R identically in a₁,a₂,w₁,w₂,c,s,ω, hence
  Σλ F(p′) = R·(−24/R) = −24 — CERTIFIED for the rotation, the reflection, and (extra, .tex 337–342) the tilt
  (x,y) ↦ (cx, y, sx) into ℝ³. Also D(A) = ω·AJ for the rotation (.tex 366) — CERTIFIED.
- Extra (.tex 1291–1299): with D(r) = ρ the energy is ρ²·(−24/R), so D(r) = √R gives −24 with the unscaled F — CERTIFIED.
- Lemma A.1's expansion decided once more with every symbol abstract (λ_i, p_i, q_i = D(p_i), w, A, B = D(A) all free,
  seven points): the five-group expansion, the trace forms, tr(skew·symmetric) = 0, ‖Aq‖² = ‖q‖² for A orthogonal.

Not decided: an isometric embedding A of general shape n×2 with AᵀA = I was not parametrised beyond the 2×2 rotation,
the 2×2 reflection and the 3×2 tilt; the abstract Part 2 shows the expansion depends on A only through AᵀA, D(A)ᵀA and
tr forms, which is the paper's argument (.tex 137–146, 274–286).

## Theorem A.3 (the generic seven points, .tex 390–444) — H4(i)

Statement (.tex 390–400): p(t) = ((1−t²)/(1+t²), 2t/(1+t²)); t₁,t₂,t₃ distinct reals; t₄..t₇ algebraically independent
over K = ℚ(t₁,t₂,t₃); then {p(t₁),…,p(t₇)} is not Ramsey; consequently almost every seven-point subset of a fixed
circle is not Ramsey.

Finite identities asserted by the proof, each decided with t₁..t₇ symbolic (the sum over the seven points of a
quantity of the form N(t_i)/H′(t_i), N a polynomial with coefficients free of the index, is Σ_k N_k·e_k with
e_k = Σ_i t_i^k/H′(t_i); the e_k are decided as polynomial identities Σ_i t_i^k·cof_i = e_k·V with V the Vandermonde
determinant and cof_i = V/H′(t_i), verified by H′(t_i)·cof_i = V; the division of each per-point expression by its
(1+t_i²)-power is done exactly and raises if the remainder is nonzero — it never is):

- (A.2) interpolation (.tex 407–411): Σ t_i^k/H′(t_i) = 0 for 0 ≤ k ≤ 5, = 1 for k = 6 — CERTIFIED (and = h₁, h₂ for
  k = 7, 8, used only to bound degrees).
- p(t) on the unit circle; g(t_i) = 0 for i ≤ 3 so D(t_i) = g(t_i) holds for all seven (.tex 415) — CERTIFIED.
- D(p(t_i)) = b_i·J p(t_i) with b_i = 2g(t_i)/(1+t_i²) (.tex 416–420), from D(t_i) = g(t_i) and the chain rule of a
  derivation on rational functions over ℚ — CERTIFIED, both coordinates; ‖Jp‖² = 1.
- Weights λ_i = (1+t_i²)²/H′(t_i) (.tex 421). Ordinary moments (.tex 421–425): Σλ = 0, Σλx = 0, Σλy = 0, Σλppᵀ = 0
  (full matrix) — CERTIFIED; per-point numerator degrees 4, 4, 3, (4, 3, 2), i.e. "deg h ≤ 4" as the paper says.
- The remaining linear conditions (.tex 425–430): Σλ_i b_i(1, x_i, y_i) = 0 — CERTIFIED; numerator degrees 5, 5, 4
  ("at most five"). Lemma A.1's own form decided from the point data: Σλ_i D(p_i) = 0 (both coordinates); M symmetric
  (M₂₁ − M₁₂ = Σλ_i b_i = 0, .tex 313–314) — CERTIFIED; M ≠ 0 witnessed (item 1 above).
- Energy (.tex 430–435): E = Σλ_i b_i² = 4Σ g(t_i)²/H′(t_i) = 4 (g monic cubic ⇒ g² monic of degree 6) — CERTIFIED,
  and again directly as Σλ_i‖D(p_i)‖² = 4; E ≠ 0.
- Lemma A.1's conclusion for this set, decided directly (not in the paper as a computation): for the symbolic rotation
  and reflection plus translation, with D(t_i) = g(t_i), Σλ_i‖D(p_i′)‖² = 4 identically; the five groups as above —
  CERTIFIED. (Per-point numerators have degree ≤ 6, so only e₆ = 1 contributes, with leading coefficient 4.)

Non-finite steps in the proof of A.3 (quoted; these are H4(ii)'s business, not decided here):
- .tex 412–414: "Choose a derivation vanishing on K with D(t_i) = g(t_i) for 4 ≤ i ≤ 7. Algebraic independence allows
  these prescriptions; extend to a transcendence basis and then algebraically to ℝ." (Existence of a derivation with
  prescribed values on an algebraically independent set and its extension to ℝ — the same step as .tex 81–83 in the
  main proof.)
- .tex 436–437: "Thus the circle criterion (A.4) and Lemma A.1 apply." Lemma A.1 itself (.tex 288–292) rests on Rado's
  inhomogeneous theorem in the real-coefficient form [EGMRSS, Lemma 15]; and .tex 285–286, "the same identity holds in
  lower dimensions by adding zero coordinates".
- .tex 439–443: "Algebraic independence of all seven parameters over ℚ holds outside a countable union of polynomial
  zero sets, a set of Lebesgue measure zero. Stereographic parametrization transfers this conclusion to arc-length
  measure on the circle; similarities give the statement for any fixed circle." (The "almost every" consequence.)
- The hypothesis that t₁,t₂,t₃ are distinct and t₄..t₇ are independent over K is what makes the seven t_i distinct, so
  H′(t_i) ≠ 0 and λ_i is defined; this is used, not decided (as symbols the t_i are distinct).

## The twelve-colouring (.tex 1168–1191)

Claim: colour q by ⌊F(q)/4⌋ mod 12; no congruent copy of P is monochromatic. Finite arithmetic decided: positive
weights total 6, negative total −6 (.tex 1176); Σλ = 0 so the common class drops out; writing F(p′)/4 = 12k_p + c + θ_p
with 0 ≤ θ_p < 1, the invariant gives −6 = 12K + Σλθ with K = Σλk_p ∈ ℤ and Σλθ in the OPEN interval (−6, 6) (strict
because every weight is nonzero and every θ_p < 1), so 12K ∈ (−12, 0): no integer K — CERTIFIED. The general recipe
⌊LF/E⌋ mod 2L with L = 6, E = −24 (sign-flipped form) — CERTIFIED by the same arithmetic; 2L = 12. The compactness
remark (.tex 1189–1191) is non-finite and not decided. No gap found.

## Verdict table (all 152 rows, from result-b.json)

| # | identity | paper | verdict |
|---|---|---|---|
| 1 | on-circle O: (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 2 | on-circle (1,+y1): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 3 | on-circle (1,-y1): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 4 | on-circle (3,+y3): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 5 | on-circle (3,-y3): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 6 | on-circle (4,+y4): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 7 | on-circle (4,-y4): (x-r)^2+y^2-r^2 = 0 | .tex 54 | CERTIFIED |
| 8 | multisets {0,3,3},{1,1,4}: equal cardinality | .tex 94-96 | CERTIFIED |
| 9 | multisets {0,3,3},{1,1,4}: equal sums | .tex 94-96 | CERTIFIED |
| 10 | multisets {0,3,3},{1,1,4}: equal sums of squares | .tex 94-96 | CERTIFIED |
| 11 | D(1) = 0, hence D(j) = 0 for every integer j | .tex 79-80 | CERTIFIED |
| 12 | D(y1) = 1/y1   (decided as y1*D(y1) = 1) | .tex 85-91 | CERTIFIED |
| 13 | Leibniz consistency: D(y1^2) = D(1(2r-1)) = 2 | .tex 85-91 | CERTIFIED |
| 14 | D(y3) = 3/y3   (decided as y3*D(y3) = 3) | .tex 85-91 | CERTIFIED |
| 15 | Leibniz consistency: D(y3^2) = D(3(2r-3)) = 6 | .tex 85-91 | CERTIFIED |
| 16 | D(y4) = 4/y4   (decided as y4*D(y4) = 4) | .tex 85-91 | CERTIFIED |
| 17 | Leibniz consistency: D(y4^2) = D(4(2r-4)) = 8 | .tex 85-91 | CERTIFIED |
| 18 | D((1,+y1)) = (0, 1/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 19 | D((1,+y1)) = (0, 1/y): y * second coordinate = 1 | .tex 90 | CERTIFIED |
| 20 | D((1,-y1)) = (0, 1/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 21 | D((1,-y1)) = (0, 1/y): y * second coordinate = 1 | .tex 90 | CERTIFIED |
| 22 | D((3,+y3)) = (0, 3/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 23 | D((3,+y3)) = (0, 3/y): y * second coordinate = 3 | .tex 90 | CERTIFIED |
| 24 | D((3,-y3)) = (0, 3/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 25 | D((3,-y3)) = (0, 3/y): y * second coordinate = 3 | .tex 90 | CERTIFIED |
| 26 | D((4,+y4)) = (0, 4/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 27 | D((4,+y4)) = (0, 4/y): y * second coordinate = 4 | .tex 90 | CERTIFIED |
| 28 | D((4,-y4)) = (0, 4/y): first coordinate 0 | .tex 90 | CERTIFIED |
| 29 | D((4,-y4)) = (0, 4/y): y * second coordinate = 4 | .tex 90 | CERTIFIED |
| 30 | (1) sum lambda = 0 | .tex 99 (eq (2), first) | CERTIFIED |
| 31 | (2) sum lambda p, x-coordinate = 0 | .tex 100 (eq (2), second) | CERTIFIED |
| 32 | (2) sum lambda p, y-coordinate = 0 | .tex 100 (eq (2), second) | CERTIFIED |
| 33 | (3) sum lambda p p^T = 0 (the full 2x2 matrix) | .tex 101 (eq (2), third) | CERTIFIED |
| 34 | (4) sum lambda D(p), x-coordinate = 0 | .tex 102 (eq (2), fourth) | CERTIFIED |
| 35 | (4) sum lambda D(p), y-coordinate = 0 | .tex 102 (eq (2), fourth) | CERTIFIED |
| 36 | (4) M = sum lambda D(p) p^T = 0 (the full 2x2 matrix, as the main text states) | .tex 103 (eq (2), fifth) | CERTIFIED |
| 37 | (4) M symmetric (Lemma A.1's condition) | .tex 270 | CERTIFIED |
| 38 | (5) energy = -4/(2r-1) + 12/(2r-3) - 8/(2r-4) | .tex 109-110 (eq (3)) | CERTIFIED |
| 39 | (5) energy = -24/R with R = (2r-1)(2r-3)(2r-4) | .tex 107-111 (eq (3)) | CERTIFIED |
| 40 | (5) reduced form equals -3 / (R/8) | .tex 107-111 | CERTIFIED |
| 41 | (extra) with D(r) = rho the energy is rho^2 * (-24/R) (the common-colouring subsection's D(r) = sqrt(R) gives -24 unscaled) | .tex 1291-1299 | CERTIFIED |
| 42 | (6) c^2 + s^2 = 1 in the ring | relation c^2 -> 1 - s^2 | CERTIFIED |
| 43 | (6) c*D(c) + s*D(s) = 0 under D(c) = -om*s, D(s) = om*c | D(c^2+s^2) = D(1) = 0 | CERTIFIED |
| 44 | (6) rotation: D(A) = om * A J | .tex 365-366 | CERTIFIED |
| 45 | (6) heptagon, rotation+translation: A^T A = I | .tex 119-147 | CERTIFIED |
| 46 | (6) heptagon, rotation+translation: D(A) entrywise | .tex 119-147 | CERTIFIED |
| 47 | (6) heptagon, rotation+translation: D(A)^T A + A^T D(A) = 0 (D(A)^T A skew) | .tex 282-284 | CERTIFIED |
| 48 | (6) heptagon, rotation+translation: D(p') = D(t) + D(A)p + A D(p) (product rule, point 0) | .tex 121-123 | CERTIFIED |
| 49 | (6) heptagon, rotation+translation: sum of the five groups = direct sum lambda //D(p')//^2 | .tex 124-136 | CERTIFIED |
| 50 | (6) heptagon, rotation+translation: T0 = //D(t)//^2 * sum lambda = 0   [killed by the zeroth moment] | .tex 129, 137-138 | CERTIFIED |
| 51 | (6) heptagon, rotation+translation: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment] | .tex 130-131, 137-138 | CERTIFIED |
| 52 | (6) heptagon, rotation+translation: T2 = sum lambda //D(A)p//^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0] | .tex 132, 138-139 | CERTIFIED |
| 53 | (6) heptagon, rotation+translation: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew] | .tex 133, 138-139; A.1 278-284 | CERTIFIED |
| 54 | (6) heptagon, rotation+translation: T4 = sum lambda //A D(p)//^2 = sum lambda //D(p)//^2 (A isometric) | .tex 134, 139-146 | CERTIFIED |
| 55 | (6) heptagon, rotation+translation: sum lambda //D(p')//^2 = energy, identically in the free symbols | .tex 141-146 | CERTIFIED |
| 56 | (6) heptagon, reflection+translation: A^T A = I | .tex 119-147 | CERTIFIED |
| 57 | (6) heptagon, reflection+translation: D(A) entrywise | .tex 119-147 | CERTIFIED |
| 58 | (6) heptagon, reflection+translation: D(A)^T A + A^T D(A) = 0 (D(A)^T A skew) | .tex 282-284 | CERTIFIED |
| 59 | (6) heptagon, reflection+translation: D(p') = D(t) + D(A)p + A D(p) (product rule, point 0) | .tex 121-123 | CERTIFIED |
| 60 | (6) heptagon, reflection+translation: sum of the five groups = direct sum lambda //D(p')//^2 | .tex 124-136 | CERTIFIED |
| 61 | (6) heptagon, reflection+translation: T0 = //D(t)//^2 * sum lambda = 0   [killed by the zeroth moment] | .tex 129, 137-138 | CERTIFIED |
| 62 | (6) heptagon, reflection+translation: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment] | .tex 130-131, 137-138 | CERTIFIED |
| 63 | (6) heptagon, reflection+translation: T2 = sum lambda //D(A)p//^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0] | .tex 132, 138-139 | CERTIFIED |
| 64 | (6) heptagon, reflection+translation: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew] | .tex 133, 138-139; A.1 278-284 | CERTIFIED |
| 65 | (6) heptagon, reflection+translation: T4 = sum lambda //A D(p)//^2 = sum lambda //D(p)//^2 (A isometric) | .tex 134, 139-146 | CERTIFIED |
| 66 | (6) heptagon, reflection+translation: sum lambda //D(p')//^2 = energy, identically in the free symbols | .tex 141-146 | CERTIFIED |
| 67 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): A^T A = I | .tex 337-342 | CERTIFIED |
| 68 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): D(A) entrywise | .tex 337-342 | CERTIFIED |
| 69 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): D(A)^T A + A^T D(A) = 0 (D(A)^T A skew) | .tex 282-284 | CERTIFIED |
| 70 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): D(p') = D(t) + D(A)p + A D(p) (product rule, point 0) | .tex 121-123 | CERTIFIED |
| 71 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): sum of the five groups = direct sum lambda //D(p')//^2 | .tex 124-136 | CERTIFIED |
| 72 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): T0 = //D(t)//^2 * sum lambda = 0   [killed by the zeroth moment] | .tex 129, 137-138 | CERTIFIED |
| 73 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment] | .tex 130-131, 137-138 | CERTIFIED |
| 74 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): T2 = sum lambda //D(A)p//^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0] | .tex 132, 138-139 | CERTIFIED |
| 75 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew] | .tex 133, 138-139; A.1 278-284 | CERTIFIED |
| 76 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): T4 = sum lambda //A D(p)//^2 = sum lambda //D(p)//^2 (A isometric) | .tex 134, 139-146 | CERTIFIED |
| 77 | (6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra): sum lambda //D(p')//^2 = energy, identically in the free symbols | .tex 141-146 | CERTIFIED |
| 78 | (6) sum lambda F(p') = R * sum lambda //D(p')//^2 = -24 (rotation copy) | .tex 141-147 | CERTIFIED |
| 79 | A.1 expansion: sum lambda //w + B p + A q//^2 = the five groups (abstract symbols) | .tex 124-136, 275-277 | CERTIFIED |
| 80 | A.1: T0 = //w//^2 * (sum lambda) | .tex 129 | CERTIFIED |
| 81 | A.1: T1 = 2<w, B (sum lambda p) + A (sum lambda q)> | .tex 130-131 | CERTIFIED |
| 82 | A.1: T2 = tr(B^T B * sum lambda p p^T) | .tex 132 | CERTIFIED |
| 83 | A.1: T3 = 2 tr(B^T A M), M = sum lambda q p^T | .tex 279-280 | CERTIFIED |
| 84 | A.1: tr(S K) = 0 for S skew, K symmetric (2x2 symbols) | .tex 282-284 | CERTIFIED |
| 85 | A.1: //A q//^2 = //q//^2 for the rotation (c^2+s^2=1) | .tex 139-144 | CERTIFIED |
| 86 | A.1: //A q//^2 = //q//^2 for the reflection (c^2+s^2=1) | .tex 139-144 | CERTIFIED |
| 87 | (A.3a) Vandermonde cofactor: H'(t1) * cof_1 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 88 | (A.3a) Vandermonde cofactor: H'(t2) * cof_2 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 89 | (A.3a) Vandermonde cofactor: H'(t3) * cof_3 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 90 | (A.3a) Vandermonde cofactor: H'(t4) * cof_4 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 91 | (A.3a) Vandermonde cofactor: H'(t5) * cof_5 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 92 | (A.3a) Vandermonde cofactor: H'(t6) * cof_6 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 93 | (A.3a) Vandermonde cofactor: H'(t7) * cof_7 = V  (so cof_i = V / H'(t_i)) | .tex 404-411 | CERTIFIED |
| 94 | (A.3a) interpolation: sum_i t_i^0 / H'(t_i) = 0  (decided as sum_i t_i^0 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 95 | (A.3a) interpolation: sum_i t_i^1 / H'(t_i) = 0  (decided as sum_i t_i^1 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 96 | (A.3a) interpolation: sum_i t_i^2 / H'(t_i) = 0  (decided as sum_i t_i^2 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 97 | (A.3a) interpolation: sum_i t_i^3 / H'(t_i) = 0  (decided as sum_i t_i^3 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 98 | (A.3a) interpolation: sum_i t_i^4 / H'(t_i) = 0  (decided as sum_i t_i^4 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 99 | (A.3a) interpolation: sum_i t_i^5 / H'(t_i) = 0  (decided as sum_i t_i^5 cof_i = 0 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 100 | (A.3a) interpolation: sum_i t_i^6 / H'(t_i) = 1  (decided as sum_i t_i^6 cof_i = 1 * V) | .tex 407-411 (A.2) | CERTIFIED |
| 101 | (A.3a) interpolation: sum_i t_i^7 / H'(t_i) = h_1(t)  (decided as sum_i t_i^7 cof_i = h_1(t) * V) | classical extension (k>6, h_{k-6}); used only to bound degrees | CERTIFIED |
| 102 | (A.3a) interpolation: sum_i t_i^8 / H'(t_i) = h_2(t)  (decided as sum_i t_i^8 cof_i = h_2(t) * V) | classical extension (k>6, h_{k-6}); used only to bound degrees | CERTIFIED |
| 103 | (A.3) p(t) lies on the unit circle: x^2 + y^2 = 1 | .tex 391-394 | CERTIFIED |
| 104 | (A.3) g(t1) = 0, so D(t1) = 0 = g(t1) is consistent with D vanishing on K | .tex 412-415 | CERTIFIED |
| 105 | (A.3) g(t2) = 0, so D(t2) = 0 = g(t2) is consistent with D vanishing on K | .tex 412-415 | CERTIFIED |
| 106 | (A.3) g(t3) = 0, so D(t3) = 0 = g(t3) is consistent with D vanishing on K | .tex 412-415 | CERTIFIED |
| 107 | (A.3) D(p(t)) = b J p(t), x-coordinate, with b = 2 g(t)/(1+t^2) | .tex 416-420 | CERTIFIED |
| 108 | (A.3) D(p(t)) = b J p(t), y-coordinate | .tex 416-420 | CERTIFIED |
| 109 | (A.3) //J p//^2 = 1 hence //D(p)//^2 = b^2 | .tex 304-307 | CERTIFIED |
| 110 | (A.3b) sum lambda_i = 0 | .tex 421-425 | CERTIFIED |
| 111 | (A.3b) sum lambda_i x_i = 0 | .tex 421-425 | CERTIFIED |
| 112 | (A.3b) sum lambda_i y_i = 0 | .tex 421-425 | CERTIFIED |
| 113 | (A.3b) sum lambda_i p_i p_i^T = 0 (full 2x2 matrix) | .tex 421-425 | CERTIFIED |
| 114 | (A.3c) sum lambda_i b_i = 0        (= 2 sum g(t_i)(1+t_i^2)/H'(t_i)) | .tex 425-430 | CERTIFIED |
| 115 | (A.3c) sum lambda_i b_i x_i = 0    (= 2 sum g(t_i)(1-t_i^2)/H'(t_i)) | .tex 425-430 | CERTIFIED |
| 116 | (A.3c) sum lambda_i b_i y_i = 0    (= 2 sum g(t_i) 2t_i/H'(t_i)) | .tex 425-430 | CERTIFIED |
| 117 | (A.3c) Lemma A.1: sum lambda_i D(p_i) = 0 (both coordinates) | .tex 268 | CERTIFIED |
| 118 | (A.3c) Lemma A.1: M = sum lambda_i D(p_i) p_i^T is symmetric  (M21 - M12 = sum lambda_i b_i = 0) | .tex 270, 313-314 | CERTIFIED |
| 119 | (A.3c) witness: M evaluated at t = (0,1,2,3,5,7,11) is symmetric but NOT the zero matrix | Lemma A.1 vs eq (2) | CERTIFIED |
| 120 | (A.3d) E = sum lambda_i b_i^2 = 4 sum g(t_i)^2/H'(t_i) = 4  (g monic cubic => g^2 monic of degree 6) | .tex 430-435 | CERTIFIED |
| 121 | (A.3d) E = sum lambda_i //D(p_i)//^2 = 4 (directly from D(p)) | .tex 271, 430-435 | CERTIFIED |
| 122 | (A.3d) E != 0 (Lemma A.1's last hypothesis) | .tex 271 | CERTIFIED |
| 123 | (A.3e) generic, rotation+translation: A^T A = I | .tex 274-286 | CERTIFIED |
| 124 | (A.3e) generic, rotation+translation: D(A) entrywise | .tex 274-286 | CERTIFIED |
| 125 | (A.3e) generic, rotation+translation: D(A)^T A + A^T D(A) = 0 (D(A)^T A skew) | .tex 282-284 | CERTIFIED |
| 126 | (A.3e) generic, rotation+translation: D(p') = D(t) + D(A)p + A D(p) (product rule, point 0) | .tex 121-123 | CERTIFIED |
| 127 | (A.3e) generic, rotation+translation: sum of the five groups = direct sum lambda //D(p')//^2 | .tex 124-136 | CERTIFIED |
| 128 | (A.3e) generic, rotation+translation: T0 = //D(t)//^2 * sum lambda = 0   [killed by the zeroth moment] | .tex 129, 137-138 | CERTIFIED |
| 129 | (A.3e) generic, rotation+translation: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment] | .tex 130-131, 137-138 | CERTIFIED |
| 130 | (A.3e) generic, rotation+translation: T2 = sum lambda //D(A)p//^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0] | .tex 132, 138-139 | CERTIFIED |
| 131 | (A.3e) generic, rotation+translation: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew] | .tex 133, 138-139; A.1 278-284 | CERTIFIED |
| 132 | (A.3e) generic, rotation+translation: T4 = sum lambda //A D(p)//^2 = sum lambda //D(p)//^2 (A isometric) | .tex 134, 139-146 | CERTIFIED |
| 133 | (A.3e) generic, rotation+translation: sum lambda //D(p')//^2 = energy, identically in the free symbols | .tex 141-146 | CERTIFIED |
| 134 | (A.3e) generic, reflection+translation: A^T A = I | .tex 274-286 | CERTIFIED |
| 135 | (A.3e) generic, reflection+translation: D(A) entrywise | .tex 274-286 | CERTIFIED |
| 136 | (A.3e) generic, reflection+translation: D(A)^T A + A^T D(A) = 0 (D(A)^T A skew) | .tex 282-284 | CERTIFIED |
| 137 | (A.3e) generic, reflection+translation: D(p') = D(t) + D(A)p + A D(p) (product rule, point 0) | .tex 121-123 | CERTIFIED |
| 138 | (A.3e) generic, reflection+translation: sum of the five groups = direct sum lambda //D(p')//^2 | .tex 124-136 | CERTIFIED |
| 139 | (A.3e) generic, reflection+translation: T0 = //D(t)//^2 * sum lambda = 0   [killed by the zeroth moment] | .tex 129, 137-138 | CERTIFIED |
| 140 | (A.3e) generic, reflection+translation: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment] | .tex 130-131, 137-138 | CERTIFIED |
| 141 | (A.3e) generic, reflection+translation: T2 = sum lambda //D(A)p//^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0] | .tex 132, 138-139 | CERTIFIED |
| 142 | (A.3e) generic, reflection+translation: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew] | .tex 133, 138-139; A.1 278-284 | CERTIFIED |
| 143 | (A.3e) generic, reflection+translation: T4 = sum lambda //A D(p)//^2 = sum lambda //D(p)//^2 (A isometric) | .tex 134, 139-146 | CERTIFIED |
| 144 | (A.3e) generic, reflection+translation: sum lambda //D(p')//^2 = energy, identically in the free symbols | .tex 141-146 | CERTIFIED |
| 145 | (12) positive weights total 6 | .tex 1176 | CERTIFIED |
| 146 | (12) negative weights total -6 | .tex 1176 | CERTIFIED |
| 147 | (12) sum lambda = 0 (so the common class c drops out) | .tex 1177-1181 | CERTIFIED |
| 148 | (12) sum lambda theta lies in the open interval (-6, 6), so 12K = -6 - sum lambda theta in (-12, 0) | .tex 1177-1184 | CERTIFIED |
| 149 | (12) no integer K with -12 < 12K < 0  =>  a monochromatic copy is impossible | .tex 1177-1184 | CERTIFIED |
| 150 | (12) colouring floor(F/4) mod 12: 12K in (-12, 0) has no integer solution | .tex 1172-1188 | CERTIFIED |
| 151 | (12) colouring floor(-F/4) mod 12: 12K in (0, 12) has no integer solution | .tex 1172-1188 | CERTIFIED |
| 152 | (12) 2L = 12 colours with L = 6 | .tex 1184-1188 | CERTIFIED |

Total 152 decided, 152 CERTIFIED, 0 REFUTED. Mutant self-checks: weight 23 REFUTED, offcircle 19, generic-weight 22 (mutants/).
