# DECIDER A — H1 and H4(i), 2026-11-07

Clean room: `decide_a.py` was written from the text of the pinned paper alone (arXiv:2609.23327v1, TeX source
`spherical_non_ramsey.tex`, sha256 `681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1`, matching
PINS-HEPTAGON.txt), stdlib + sympy 1.14.0 on python 3.9; no third-party checker read, copied or run; the other decider not
read. Run: `python3 decide_a.py` (212 s on the Mac); log in `run-a.log`, records in `result-a.json`.

## What did not match the paper — stated first

**Nothing failed. All 97 finite identities hold exactly, with r (resp. t1..t7) symbolic. All 11 negative controls (a weight
flipped, a point off the circle, a wrong D(y), a non-monic g, k = 7 in (A.2), 6 colours) were refuted by the same tests.**

Four observations, none a defect:

1. **Which matrix must be "symmetric".** Lemma A.1 (lines 264–270) requires the quadratic moment Σλ p pᵀ to be the ZERO
   matrix (line 267); its "symmetric" condition is on M = Σλ D(p) pᵀ (line 270). For the heptagon BOTH are the zero
   matrix (eq. (2), lines 101–103 — decided). For Theorem A.3's data M is symmetric but NOT zero: at the exact rational
   point t = (0, 1, −1, 2, 3, 1/2, 5), M = [[−32/325, −56/325], [−56/325, 32/325]]. So A.3 genuinely needs Lemma A.1's general
   form, while the main theorem uses the stronger eq. (2). (H2's Lean route through the "symmetric" form must carry M ≠ 0.)
2. **Lowest terms of the energy.** Σλ‖D(p)‖² = −12/((r−2)(2r−3)(2r−1)) in lowest terms = −24/R exactly (the common factor 2
   of −24 and 2r−4 cancels). In the paper's normalisation: numerator −24, denominator R = 8r³ − 32r² + 38r − 12.
3. **Sign convention of the colouring.** The paper's general recipe ⌊L F/E⌋ mod 2L (line 1188) with E = −24, L = 6 gives
   ⌊−F/4⌋ mod 12; its explicit colouring is ⌊F/4⌋ mod 12 (line 1174). Both exclude a monochromatic copy (decided: the
   interval argument is symmetric under F → −F). Cosmetic.
4. **Where algebraic independence enters A.3.** Every finite identity of A.3's proof holds for ALL distinct t1..t7 (they are
   polynomial identities after multiplying by the Vandermonde V ≠ 0). The independence over K = Q(t1,t2,t3) is used only
   for the existence of the derivation (lines 412–414, quoted below) — the non-finite step H4(ii) must match to Mathlib/OpenAI.

## What the paper states (with .tex line numbers) and what was decided

Heptagon, Theorem 1 (lines 48–148). Points (0,0) and (j, ±√(j(2r−j))), j ∈ {1,3,4} (line 51–52), on (x−r)²+y² = r²
(line 54). Weights (line 93): 2 at the origin, −2 at each x=1 point, 2 at each x=3 point, −1 at each x=4 point — as the task
stated; confirmed. Derivation (lines 77–91): D(1)=0 so D(j)=0; D(r)=1; 2y D(y) = D(j(2r−j)) = 2j so D(p) = (0, j/y).
Eq. (2) (lines 97–105): Σλ=0, Σλp=0, Σλppᵀ=0, ΣλD(p)=0, ΣλD(p)pᵀ=0. Eq. (3) (lines 107–112):
Σλ‖D(p)‖² = −4/(2r−1) + 12/(2r−3) − 8/(2r−4) = −24/R, R = (2r−1)(2r−3)(2r−4). F(q) = R‖D(q)‖² (line 116). Expansion for
p' = t + Ap (lines 119–147): D(p') = D(t) + D(A)p + AD(p), five grouped terms, all but the last vanish by eq. (2), the last
is E by AᵀA = I, so ΣλF(p') = −24.

Decided (Part 1, 56 records): circle membership; D(j(2r−j)) = 2j and D(y) = j/y = y/(2r−j); D respects y² = j(2r−j);
D(p) = (0, j/y); the multiset remark {0,3,3}/{1,1,4} (lines 94–96); all five moments of eq. (2) with the full 2×2
matrices reported (both zero); the three-term energy and −24/R; R·E = −24. Invariance, for the rotation A = [[c,−s],[s,c]]
and the reflection A = [[c,s],[s,−c]], with D(c)=u, D(s)=v, D(t)=(w1,w2) FREE and only c²+s²=1 and the derived cu+sv=0
imposed (lex Gröbner basis {cu+sv, s²u−csv−u, c²+s²−1}): AᵀA = I; D(A)ᵀA + AᵀD(A) = 0; the product rule; the grouping
into T0..T4 with no relation used; which moment kills which term — T0 by Σλ=0 (line 129), T1 by Σλp=0 and ΣλD(p)=0
(130–131), T2 = tr(D(A)ᵀD(A)·Σλppᵀ) by the quadratic moment (132), T3 = 2tr(D(A)ᵀA·M) by the mixed moment (133; Lemma
A.1's line 279–280), T4 = (AᵀA)₂₂·E = E (134); the whole R·Σλ‖D(p')‖² + 24 reduces to 0 modulo the relations; the
cross-check with D(A) = AωJ (line 366). Also with a FREE n×2 matrix A and free D(A), n = 2, 3: T1 = T2 = T3 = 0 with NO
relation on A (the moments are zero matrices), T4 = (AᵀA)₂₂·E.

Theorem A.3 (lines 390–444). Statement: p(t) = ((1−t²)/(1+t²), 2t/(1+t²)); t1,t2,t3 distinct reals, t4..t7 algebraically
independent over K = Q(t1,t2,t3) ⇒ not Ramsey; hence almost every seven-point subset of a circle. Proof: H(T) = Π(T−t_i),
g(T) = (T−t1)(T−t2)(T−t3); (A.2) Σ t_i^k/H'(t_i) = 0 (k ≤ 5), = 1 (k = 6) (lines 407–411); derivation with D|K = 0,
D(t_i) = g(t_i) for i ≥ 4, hence for all i (412–415); D(p(t_i)) = b_i J p(t_i), b_i = 2g(t_i)/(1+t_i²) (416–420);
λ_i = (1+t_i²)²/H'(t_i) (421); ordinary moments vanish, numerators of degree ≤ 4 (422–425); Σλ_i b_i(1, x_i, y_i) =
2Σ g(t_i)/H'(t_i)·(1+t_i², 1−t_i², 2t_i) = 0, degree ≤ 5 (426–430); E = Σλ_i b_i² = 4Σ g(t_i)²/H'(t_i) = 4 (430–435);
then (A.4) and Lemma A.1 (436–437); the measure-zero clause (439–443).

Decided (Part 2, 34 records, t1..t7 symbolic): the seven (A.2) identities; g(t_i) = 0 for i ≤ 3; g monic cubic; the chain
rule D(p(t)) = (2D(t)/(1+t²)) J p(t) and ‖p(t)‖² = 1; the six ordinary moments (degrees of the numerators 4,4,3,4,3,2,
within the stated bound 4); the three (A.4) conditions (degrees 5,5,4, within the stated 5); E = 4 (degree 6); Lemma A.1's
conditions directly on A.3's data: ΣλD(p) = 0 (both coordinates), M symmetric (M₂₁ − M₁₂ = Σλ_i b_i = 0, line 314),
tr M = 0, Σλ‖D(p)‖² = 4 ≠ 0; and an exact rational-point evaluation (M symmetric, M ≠ 0, all conditions hold, E = 4).

Colouring (lines 1168–1191). ⌊F(q)/4⌋ mod 12 avoids every copy: write F(p')/4 = 12k_p + c + θ_p, 0 ≤ θ_p < 1; then
−6 = 12Σλk_p + Σλθ_p with −6 < Σλθ_p < 6 (lines 1177–1183). Decided (Part 3, 7 records): |positive| = |negative| = 6;
c cancels since Σλ = 0; Σλθ ∈ (−6, 6) strictly; 12Σλk ∈ (−12, 0) contains no multiple of 12 — contradiction, no gap;
the general 2L-colour bound by the same argument; both sign conventions.

## Non-finite steps (quoted, not decided)

- Lines 81–83: "To obtain D(r)=1, include r in a transcendence basis of R/Q, differentiate formally with respect to r on
  the resulting rational function field, and extend uniquely to its algebraic extension R."
- Lines 69–73 and 288–292: the inhomogeneous Rado theorem / [EGMRSS, Lemma 15] colouring of R (the finite part, "Σλz = −24
  has no constant solution", is decided).
- Lines 412–414 (A.3): "Choose a derivation vanishing on K with D(t_i)=g(t_i) for 4 ≤ i ≤ 7. Algebraic independence
  allows these prescriptions; extend to a transcendence basis and then algebraically to R."
- Lines 439–443 (A.3): "Algebraic independence of all seven parameters over Q holds outside a countable union of polynomial
  zero sets, a set of Lebesgue measure zero. Stereographic parametrization transfers this conclusion to arc-length measure
  on the circle; similarities give the statement for any fixed circle."
- Lines 1189–1191: the compactness remark for infinite-dimensional spaces.

## Verdict table (decider A)

| Item | Identity | Verdict |
|---|---|---|
| (1) | Σλ = 0 | CERTIFIED |
| (2) | Σλp = (0,0) | CERTIFIED |
| (3) | Σλppᵀ = [[0,0],[0,0]] (paper requires zero; symmetric a fortiori) | CERTIFIED |
| (4) | ΣλD(p) = (0,0) [l.102]; M = ΣλD(p)pᵀ = [[0,0],[0,0]] [l.103] | CERTIFIED |
| (5) | Σλ‖D(p)‖² = −4/(2r−1)+12/(2r−3)−8/(2r−4) = −24/R; numerator −24, denominator 8r³−32r²+38r−12 | CERTIFIED |
| (6) | ΣλF(p') = −24 identically, rotation and reflection, u,v,w free under c²+s²=1, cu+sv=0; each term killed as the paper says | CERTIFIED |
| (7) | A.3: (A.2) ×7, b_i, λ_i, six moments, three (A.4) conditions, E = 4, Lemma A.1's form (M symmetric, ≠ 0) | CERTIFIED (34/34) |
| 12-col | ⌊F/4⌋ mod 12: the arithmetic closes, no gap | CERTIFIED |
| controls | 11 mutants | all refuted |

Lane verdict from this side: every identity CERTIFIED; H1 / H4(i) close only when decider B agrees on every one.
