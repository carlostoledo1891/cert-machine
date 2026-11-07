# H1 and H4(i) — verdict (2026-11-07)

Two clean-room symbolic deciders, written apart from the pinned TeX only (sha256 681c953f…, PINS-HEPTAGON.txt):
A = sympy 1.14 (h1/decider-a, 97 identities + 11 negative controls, 212 s); B = Python standard library with its own
sparse polynomial ring and normal forms (h1/decider-b, 152 identities + 3 mutants, 8 s). Neither read the other, nor
any third-party checker.

**H1 (Theorem 1, the heptagon): CERTIFIED.** Both deciders agree on every identity they share: Σλ = 0; Σλp = 0; Σλppᵀ = 0;
ΣλD(p) = 0; M = ΣλD(p)pᵀ = 0; the energy Σλ‖D(p)‖² = −4/(2r−1) + 12/(2r−3) − 8/(2r−4) = −24/R, R = (2r−1)(2r−3)(2r−4);
the invariance ΣλF(p') = −24 for every rotation, reflection (and B: the ℝ³ tilt) with D(c), D(s), D(t) free under
c² + s² = 1; which moment kills which cross term (T0 by Σλ, T1 by the first moments, T2 by Σλppᵀ, T3 by M, T4 by
isometry); the twelve-colouring's arithmetic (Σλθ in the open interval (−6, 6) leaves no multiple of 12). 0 REFUTED.

**H4(i) (Theorem A.3, the generic seven points): every finite identity CERTIFIED by both** (A 34/34, B the same set and
more): the interpolation identities (A.2), the weights λ_i = (1+t_i²)²/H'(t_i), six ordinary moments, the derivative
moments, M symmetric, E = Σλ_i b_i² = 4 ≠ 0, the invariance. A.3's finite content holds for ALL distinct t₁..t₇; algebraic
independence enters only in the non-finite step. This is, to our knowledge, the first exact check of A.3's finite content.

**Finding (both deciders, independently):** the main text's Equation (2) states ΣλD(p)pᵀ = 0, which is STRONGER than
Lemma A.1's condition (M symmetric). For the heptagon both hold (M = 0). For A.3's generic set M is symmetric but NOT
zero (A: t = (0,1,−1,2,3,1/2,5) gives M = [[−32/325, −56/325],[−56/325, 32/325]]; B: t = (0,1,2,3,5,7,11) gives
[[92,−86],[−86,−92]]/19825). The proof of A.3 goes through Lemma A.1, so it is correct as printed; a Lean proof of A.3
must carry the symmetric form, not Equation (2).

**Non-finite steps of A.3, quoted by both, not decided here (H4(ii)):** .tex 412–414 "Choose a derivation vanishing on
K with D(t_i) = g(t_i) for 4 ≤ i ≤ 7. Algebraic independence allows these prescriptions; extend to a transcendence basis
and then algebraically to ℝ"; Lemma A.1's use of EGMRSS Lemma 15 and "adding zero coordinates" (.tex 285–292); the
measure-zero clause (.tex 439–443); compactness (.tex 1189–1191). Also D(r) = 1 via a transcendence basis (.tex 81–83)
for Theorem 1 — in OpenAI's chain as `exists_real_derivation`.

Red controls: A's 11 (weight flipped, point off circle, wrong D(y₃), non-monic g, k = 7 in (A.2), six colours) and B's 3
mutants all refused at the expected rows.
