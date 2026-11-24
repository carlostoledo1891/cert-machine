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
