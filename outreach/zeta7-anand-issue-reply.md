# Reply on gmDevi/zeta-7-21-lean issue #1 (Anand's ζ(7) preprint)

STATUS: POSTED 2026-10-05 22:09 UTC on the operator's word ("Fix all and proceed, I approve"):
https://github.com/gmDevi/zeta-7-21-lean/issues/1#issuecomment-6004122031 — the thread after posting is pinned at
corpus/sources/zeta7-anand/github-gmDevi-zeta-7-21-lean-issue-1-comments_after-reply_2026-10-05.json; tools/sweep-claims.js
watches the issue and Zenodo 22920911 for a reply or a v2.
- **Posting:** from carlostoledo1891, the operator's only GitHub account. The issue's author, huntrontrakkr, is a third party.
- **Re-checked before posting (2026-10-05):** the issue is open with 0 comments; Zenodo 22920911 has no v2.
- **Numbers:** checked against certs/zeta7-anand-audit.json.
- **A correction to the earlier draft:** it said "positive in every one of 24 combinations". That was wrong: the printed scenarios and the last-row-only scenarios are not readings of the paper. The text below states it exactly.

---

An independent check of the points in this issue, for the record. Everything below was recomputed in exact rational arithmetic from the preprint's printed formulas (Zenodo 22920911 v1), with code that shares nothing with the paper or with the script referenced above.

- **I_out from the paper's formulas.** Integrating (54), (58), (59) and (62) gives I_out = 453803/288000 ≈ +1.5757. That is the reading that matches the exponents (61) actually uses. The literal reading of (71) and (73), which subtracts d twice and is the more favourable to the paper, gives 445163/288000 ≈ +1.5457. The printed −11002997/720000 in (122) is exactly the integral of Table 5, so the discrepancy is in the table.
- **Table 5's last row.** On [1, 37/20] the integrand is 37/20 − y under every reading, not −239/20 − 2y. That row alone moves I_out by +10353/800, and with the printed A0 and U it moves A₂₀₀ + U to +0.9484.
- **The margin.** With I_out from the formulas and the printed A0 and U, A₂₀₀ + U = +4.865 (+4.835 under the literal reading); (118) needs it below −11.
  - Replacing A0 by the paper's own (85) bound, and U by the variants we could decide, it stays positive under both readings. The smallest decided value is +2.256.
  - No cutoff M helps, since A_M > B0 for every M.
- **To be fair to the paper.** Correcting only the last row, keeping the other rows as printed, and correcting A0 and U as well would give a negative value (−1.63). But the other rows do not follow from the formulas either, and the formulas decide every row.
- **Calibration.** The same integrator reproduces Fauzan's printed outer integral, 127751/96000, three independent ways.
- **The family itself.** At n = 1, 2, 3, log P_K(ζ(7))/K² = +0.797, +0.871, +0.884, where Theorem 1.2 needs less than −11.87. This is a measurement at small n, not a statement about the limit.
- **What holds.** The local p-adic bound, Proposition 4.6, holds at every prime tested, often with equality; the error is in integrating it. One slip goes against the paper: (110) mis-sums I(ρ) (−3.1433 printed, −1.9482 recomputed), and (96) still holds.

This breaks the proof route of Theorem 1.2 as written in v1. It does not show that ζ(7) is rational.

The record, with every enclosure, both readings, all the margin scenarios and a battery with planted errors: https://carlostoledo.co/reports/zeta7-anand.html (archived at https://doi.org/10.5281/zenodo.23171167).

*AI-assisted: computed with Claude (Anthropic) in a certified-arithmetic setting. Every number above is an exact rational or an outward-rounded ball, and the record re-derives them at every build.*
