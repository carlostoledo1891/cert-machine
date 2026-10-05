# Reply on gmDevi/zeta-7-21-lean issue #1 (Anand's ζ(7) preprint) — DRAFT, NOT SENT

STATUS: DRAFT (2026-10-05).
- **It is a SEND:** it goes out only on the operator's word, from carlostoledo1891 (the only account that is ours). The issue's author, huntrontrakkr, is a third party.
- **Where:** a comment on https://github.com/gmDevi/zeta-7-21-lean/issues/1. That repository's README cites the paper; it is not the author's. An email to the author is a separate decision, the operator's.
- **Before sending:** re-fetch the issue. If the author has posted a v2 on Zenodo, the comment must address v2, not v1.

---

An independent check of the points in this issue, for the record. Everything below was recomputed in exact rational arithmetic from the preprint's printed formulas (Zenodo 22920911 v1), with code that shares nothing with the paper or with the script referenced here.

- **I_out from the paper's formulas.** Integrating (54), (58), (59) and (62) gives I_out = 453803/288000 ≈ +1.5757 under the reading that matches the exponents (61) actually uses. Under the literal reading of (71) and (73), which subtracts d twice and is the more favourable to the paper, it is 445163/288000 ≈ +1.5457. The printed −11002997/720000 in (122) is exactly the integral of Table 5, so the discrepancy is the table.
- **The last row of Table 5.** On [1, 37/20] the integrand is 37/20 − y under every reading, not −239/20 − 2y. That row alone moves I_out by +10353/800.
- **The margin.** With the paper's printed A0 and U, A₂₀₀ + U = +0.9484 after correcting that row only, and +4.865 with I_out from the formulas. (118) needs it below −11.
- **Can it be repaired?** It stays positive in every one of 24 combinations of readings and author-favourable corrections we could decide; the smallest is +2.256. No cutoff M helps, because A_M > B0 for every M.
- **Calibration.** The same integrator reproduces Fauzan's printed outer integral, 127751/96000, three independent ways.
- **The family itself.** Measured exactly at n = 1, 2, 3, log P_K(ζ(7))/K² = +0.797, +0.871, +0.884, where Theorem 1.2 needs less than −11.87. This is a measurement at small n, not a statement about the limit.
- **What is right.** The local p-adic bound, Proposition 4.6, holds at every prime tested, often with equality; the error is in integrating it.

This breaks the proof route of Theorem 1.2 as written in v1. It does not show that ζ(7) is rational. The full record, every enclosure and a battery with planted errors: https://carlostoledo.co/reports/zeta7-anand.html

(AI-assisted: the computation was done with Claude in a certified-arithmetic setting; the numbers above are exact rationals or outward-rounded balls, and the record re-derives them at every build.)
