# VP ≠ VNP — the panel's ledger (control room)

What the outside readers said, and what was checked. A claim enters "checked" only when someone other than its author
re-did it (quote found at the cited place, computation re-run, or proof compiled). Round 1 brief:
prompts/grok-gemini-round1.md, pasted by the operator; answers received 2026-11-24 before 00:22 UTC.

## Round 1

### Grok (xAI)
| # | claim | label given | checked? |
|---|---|---|---|
| G-1 | The most likely place for an error is Theorem D.2 (the two cases, `thm_alt`): the equality-case analysis of Steps 1–8 (B_a, the sign flip forcing λ = 0, Lemma C.4(f) in Step 8); next most likely, the crossing identity (Proposition B.2). | REASONED | The description matches the paper: "fix μ ≥ 3" (Appendix D, proof of D.2), Steps 1–8, (D.1)–(D.3), Step 6 "λ = 0", Step 8 via Lemma C.4(f); and §D.3: "Theorem D.2 is not effective: we do not know which case occurs" — quotes found by the control room. The judgement itself is a reading. Note: D.2 is a Lean theorem (`Paper.thm_alt`); if the checkers accept the development, a mistake in the printed prose cannot make the main theorem false. |
| G-2 | Cheap test: at μ = 3 (512 matrices) check whether the equations of Steps 3–7 force the squared distance to be the rank. | proposed, not run | COMPUTED by GPT-6.2-astra (00:22–00:27 UTC, panel/astra-d2/: exact rational elimination, block by block over the translation characters; standard library only): μ = 3, 130,816 unknowns, 8,580,096 equations, rank 130,815, so the solutions are exactly the multiples of rk(x − y), as Steps 4–7 claim; μ = 2, nullity 7: the rank and six more functions, one per invertible displacement, consistent with Step 5's need for μ ≥ 3. Re-run by the control room, same code (sha256 7255c162…), identical output, 4.7 CPU-s. Same code twice is one check: an independent program is asked of Grok (round 2, task 2). The character decomposition is valid because the system is translation-invariant (REASONED); the μ = 2 result was also obtained by direct elimination on all 120 unknowns. |
| G-3 | Algebraically natural proofs: evaded (diagonalization in the contracting case; non-explicit spectral points by Zorn's lemma in the flat case). | SOURCED quotes + REASONED | Both quotes found in §1.2. Whether non-explicit functionals evade the barrier is a reading, unchecked. |
| G-4 | Rank-method barriers: the flat case uses spectral points (a variant of Strassen's asymptotic spectrum) instead of ranks. | SOURCED + REASONED | Quote found in §1.2. Whether spectral points escape the barrier "in the broad sense" Grok calls debatable; unchecked. |
| G-5 | Relativization / algebrization: not analysed by the authors. | SOURCED | Quote found in §1.2 ("We have not analysed how it relates to relativization and algebrization"). |
| G-6 | No published result is contradicted (Ryser's 2^m-type upper bound; Baur–Strassen's m² log m lower bound; perm = det in characteristic 2, excluded; HC is VNP-complete over every field and its reduction needs no division, `prop_hc_grid`). | SOURCED + REASONED | The paper's own statements found (§1.1–1.2; "the one for HC_m needs no division (prop_hc_grid)"). |
| G-7 | Statement.lean matches Valiant's and Bürgisser's definitions; no place where it is true while textbook VP ≠ VNP is false (straight-line programs, constants counted; VP bounds n^a + a; VNP as Boolean sums; ∃c ∀p ∃m₀; composite p vacuous; universe-polymorphic; Laurent-series approximation). | SOURCED lines + REASONED | Agrees with the control room's first reading (not a check). Decided only by rows F1–F5 (blind statements and bridges). One point Grok does not mention: constants from F((ε)) are more than the usual F(ε), which makes the approximate bound stronger, not weaker. |

### Gemini (Google)
| # | claim | label given | checked? |
|---|---|---|---|
| M-0 | Could not open the pinned files; every answer is general. | — | Nothing to check. A second try with paper.pdf and Statement.lean attached is suggested to the operator. |
| M-1 | The step most likely to fail would be a border-transfer (degeneration) lemma; test it on a tensor whose border rank is below its rank (e.g. x₀y₀z₁ + x₀y₁z₀ + x₁y₀z₀: rank 3, border rank 2). | REASONED, without the paper | Not tied to a numbered statement; parked until it is. |
| M-2 | Relativization and algebrization do not apply directly as formal barriers to Valiant's model. | REASONED | A reading; unchecked. |
| M-3 | No contradiction known; the bound 2^(c (log m)^(4/3)) is far below Ryser's and Held–Karp's upper bounds. | REASONED | Consistent with the paper's §1.1 (the paper's m is the matrix size; Gemini's "2^(O(√m))" uses m for the number of variables). |
| M-4 | What to check in Statement.lean: c outside the circuit quantifier; no restriction to bounded depth or multilinear circuits; the degree bound in VP; VNP as equality of polynomials, not of functions over finite fields. | REASONED | All four hold in Statement.lean as pinned (control room reading: `∃ c, 0 < c ∧ ∀ p, ∃ m₀, …`; `Computes` has no depth or multilinearity restriction; `VP` bounds `totalDegree`; `VNP` equates `MvPolynomial`s). To be decided by rows F2–F5. |

Operator, 2026-11-24 before 00:27 UTC: "Gemini is weak, lets keep grok on track." Gemini leaves the panel after round 1;
Grok continues with computation-only rounds (round 2: prompts/grok-round2.md — the crossing identity B.2 for small
cases, and an independent second computation of the D.2 check Astra is running).

## Round 2 (Grok only; computation; part 1 pasted by the operator before 01:00 UTC, "the model is working yet")

| # | claim | label given | checked? |
|---|---|---|---|
| G2-1 | Proposition B.2 (crossing identity) holds in all 14 nonempty cases with n1, n2 ∈ {1, 2} and energies up to 10: (a) the coefficients of Ψ = det M sum to the matching indicator, with sign ε = 1 in every case; (b), (c) every flattening rank is within (N + 1)P(N), resp. (N′ + 1)P(N′); P(0..12) = 1 1 2 2 4 4 7 7 12 12 19 19 30. | COMPUTED (script named, not yet pasted) | Grok's reading of the sign and of the row and column order matches the paper (§B.3, "The value at X = 1": "Ψ\|X=1 is a sign ε, which depends on n1 and n2 only, times [Jc = Ia, Ic = Ja, Jb = Id, Ib = Jd]"). Not yet re-run: the code is asked for. |
| G2-2 | D.2 at μ = 2: 120 unknowns, 1,728 equations (ordered pairs), rank 113 mod 1,000,000,007, nullity 7; the rank metric satisfies every equation. | COMPUTED (script described, not yet pasted) | Agrees with GPT-6.2-astra's exact count (rank 113, nullity 7) by a separately written program; becomes a second check once its code is re-run here. Rank mod p bounds the rational rank from below, so nullity 7 mod p with Astra's rational nullity 7 is consistent. |
| G2-3 | D.2 at μ = 3: the rank metric satisfies all 17,160,192 equations (ordered pairs; Astra counted 8,580,096 unordered); the elimination did not finish in pure Python, so the dimension was NOT computed. | COMPUTED (membership) + "not computed" (dimension) | Honest non-result. The μ = 3 dimension stays single-program (Astra) until an independent program finishes it. |

### Round 2, the rest (operator, before 01:30 UTC: "Grok done, files are in the downloads folder"; three scripts)
Scripts kept as received: panel/grok-r2/ (check_crossing.py 39f9e064…, check_d2.py b99babe6…, check_d2_chars.py bc28278e…).
Re-run here, isolated (python -I, sympy 1.14.0), 01:24–01:28 UTC:
| # | claim | checked? |
|---|---|---|
| G2-4 | D.2 at μ = 3 by translation characters: total nullity 1, all in the trivial character (rank 510 of 511); the classes rank(b) = 0, 1, 2, 3 hold 1, 49, 294, 168 characters with nullities 1, 0, 0, 0. | RE-RUN, same output (panel/grok-r2/OUTPUT-chars-rerun-control-room.txt, 200 s). Rank modulo a prime can only undercount the rational rank, and the rank metric is a solution, so the dimension is exactly 1 — a SECOND, independently written program agrees with GPT-6.2-astra's exact count (G-2). Steps 4–7 of Theorem D.2 at μ = 3: confirmed by two programs. |
| G2-1′ | B.2 (crossing identity): (a), (b), (c) hold. | RE-RUN of the script received: it computes 9 nonempty cases (energies up to 6, sizes 1), all three properties True, ε = 1 in each; it does NOT reproduce the 14 or 33 cases nor the degree check Grok reported — those came from a version we were not given. So: 9 cases checked by re-run; the rest of Grok's B.2 report stays unchecked. |
| G2-5 | the full D.2 elimination (check_d2.py) | Not re-run to the end: stopped by the control room at the pause (Grok said its μ = 3 part does not finish). |
