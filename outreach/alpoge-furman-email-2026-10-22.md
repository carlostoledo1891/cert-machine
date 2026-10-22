# E-mail to Levent Alpöge and Ralph Furman — DROPPED 2026-10-23: E-MAILS ARE OFF (the operator: "why not github, I prefer to do the things there. An email could go to spam folder … Email's are off. We respond if we receive"). Its content went into the window issue (outreach/zeta23-window-issue-2026-10-22.md, lane Z6). Kept as written.

Replaces lane Z4's two-line courtesy note: the window result and the tail are the part they can act on, so one e-mail carries
the three things. Every number is a decision on a certificate at claimbox afd776c380318bf7b6a7949ec18d130dc64e62a1 and is
re-derived by the paper's generator here; the paper link goes in once it is live (lane Z2). Addresses: from the arXiv listing
of 2608.13637 (not looked up here; the operator has them).

Subject: Remark 7.1 of arXiv:2608.13637 — the window's family optimum, a longer tail, and one print in the abstract

Dear Professors Alpöge and Furman,

I run an independent exact-checking project (cert-machine) and have been through the finite layer of your paper and its
Lean formalization: the LawN256 certificate re-decided from its integers without Lean, and the printed constants decided
in exact rational arithmetic. Three things came out that concern your text directly, two of them improvements you may
want to use.

1. The window of Remark 7.1. For an even polynomial window v(s) = Σ c_i s^{2i}, κ₉(v) is a Rayleigh quotient cᵀMc/(bᵀc)²
   (the pair autocorrelations of monomials are polynomials in r), so its minimiser over each degree is c ∝ M⁻¹b, exactly.
   Your quartic 1 − (7/100)(2s)² − (51/200)(2s)⁴ sits 8.85·10⁻⁷ below the optimum of its own degree; from degree 6 on
   the optimum saturates at 0.868641158957… (nine-term certificate), 9.85·10⁻⁷ above your window. The degree-6 optimum
   rounded to thousandths, v₆(s) = 1 − (157/500)s² − (3763/1000)s⁴ − (122/125)s⁶, satisfies the window hypotheses by
   its coefficients and gives 0.86864115 / 0.93432057 against the formalization's 0.86864017 / 0.93432008, and no even
   polynomial window of degree ≤ 20 does better — decided from an exact certificate (M − κ*bbᵀ = LDLᵀ with D ≥ 0, one
   zero pivot), not a numerical search.

2. The tail. ε₉ = a₉·231/211 = 3.4·10⁻⁷ is more than a third of that whole gain. The formalization's route is stated for
   every K ≥ 9; at fifteen terms ε₁₅ = 4.5·10⁻¹⁴ and v₆ gives 0.86864150 / 0.93432075 — a change of 1.3·10⁻⁶ over the
   certified constants by the same window shape and three more terms of a series the files already hold. Your five
   printed digits, 0.86864 and 0.93432, do not move; the eight-digit theorems in AtOne.lean would. (The parameter
   direction is closed: at fixed λ < 1 the constant only falls.)

3. One print. The abstract says "the constants become 0.6725 and 0.8362". The exact second constant is
   0.836250351839705822…, so 0.8362 is a truncation — a rounding prints 0.8363 — true as a lower bound, as the theorem's
   0.83625… makes clear. For what it is worth, the quadratic-window optimum for the ζ functional is exactly 2 − 531/400 =
   0.6725, and the polynomial optima recover your 2 − c_MT^{-1} = 0.6725007036794116… to eighteen digits from degree 6,
   which is how I checked that the machinery is right before writing to you.

The certificates, the tool (tools/xi_window.py) and the decisions are public at
https://github.com/carlostoledo1891/claimbox (commit afd776c), with every claim and the word expected of it recorded
before each run; the Lean side — the two integrals, the closed form of v₆ ⋆ v₆, positivity, and the k ≥ 15 ratio lemma
(32/561) — is printed in the certificate for whoever formalizes it. A short write-up will follow at
<the paper, once live>. The code and the checks were built with AI assistance (Claude); every number above is a decision
of an exact program over the certificates.

I would be glad to know whether the fifteen-term constants are something you would want in the formalization, and
whether there is a reason the quartic was preferred that the exact picture misses.

With best regards,
Carlos Toledo
carlos@carlostoledo.co
