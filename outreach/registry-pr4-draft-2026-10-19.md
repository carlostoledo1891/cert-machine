# T-PR4 — DRAFT, NOT SENT (2026-10-19)

To teorth/optimizationproblems, in the form of #216 / #230 / #232. **Send only on the operator's word.** It edits the
86a page, the README row 86 and the end of Recent progress; it does not touch the family-1 rows that #232 (open) and
T-PR3 (drafted) edit, so it can go before or after them. When sending: branch from the current upstream main, run
`python3 outreach/registry-pr4-edit-2026-10-19.py <clone> certs/c86-replay.json <commit> "<d Mon 2026>"` with the
cert-machine commit that holds `certs/c86-replay.json`, re-read the 86a page and README for changes since the
2026-10-19 pin (`corpus/optconst-queue/c86-2026-10-19/upstream/`, registry 46dbf036), then open the PR with the body
below.

Evidence: `certs/c86-replay.json` (tools/replay-c86.js + instruments/optq/c86.py; battery `--check` in make test), page
https://carlostoledo.co/reports/optconst-queue.html#c86 (§8).

---

**Title:** C86: the trace-constant certificate independently replayed; asterisk removed

**Body:**

#216, #230 and #232 applied the CONTRIBUTING rule that the marker "is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed." This PR offers the same replay for the $C_{86}$ row [Pin26], decided from the bytes the row cites, with no code shared with the claimant's checker (kept as text, never run). Markdown only.

**What was replayed.** The certificate `cert_n1200_A11.json` at rpinho/c86-trace-certificate commit `116a58f` (sha256 `722a287b74a9…`): a step measure $\mu$ on the cells of width $1/200$ (629 nonzero cells, support $[1/20, 1037/200]$) and eleven integer polynomials $Q$ with rational weights $b_Q$. The six finite conditions the row states — the hypotheses of Smith's sufficiency criterion [Smi24] and the arithmetic of the bound — were decided by two implementations sharing no code with each other (Python: `Fraction` and its own outward-rounded series logarithm; JavaScript: BigInt rationals and an interval library):

| | condition | how | result |
|---|---|---|---|
| E1 | $d_i \ge 0$, edges increasing, support inside $[1/20, 1037/200]$ | exact | holds |
| E2 | each $Q$ primitive, irreducible over $\mathbb{Z}$, totally real; the $Q$ distinct | exact (integer roots and monic quadratic factors within the Mignotte bound; Sturm counts) | holds for all eleven |
| E3 | $\sum_Q b_Q \deg Q < m$ | exact | $0.82978\,m$ |
| E4 | $\int \log\lvert Q\rvert\,d\mu > 0$ for each $Q$ | closed form in $g(u) = u\ln\lvert u\rvert - u$ at the edges, roots enclosed to $2^{-80}$, outward rounding | every lower end $> 0$ (each $\approx 10^{-4}$) |
| E5 | $U_\mu - \sum_Q b_Q \log\lvert Q\rvert \ge 0$ on the support | adaptive bisection; cell-edge terms by their exact monotone ranges, the smooth rest by a second-order Taylor form | proved on 3,658 boxes in both implementations, smallest certified lower bound $2.3 \times 10^{-8}$ |
| E6 | $\int x\,d\mu / m$ equals the certificate's bound and is $\le 1.8117251$ | exact | $144938007612277893/79999999999994000 = 1.81172509515360954\ldots$ |

**What was not re-derived.** The extension of E5 from the support to $\mathbb{C}$ (the minimum principle), the resultant argument that makes $\mu/m$ arithmetic, and Smith's theorem [Smi24] — published mathematics, cited by the row and read, not re-proved. The replay is of the certificate's finite conditions, which is what the asterisk is about.

**Red controls**, which must come out wrong in both implementations: the densities scaled by 0.98 (a box with $f < 0$ is found), the weights scaled by 1.3 (E3), extra mass in the first cell of the support (E4 and E6), the bound lowered by $10^{-12}$ (E6), $x^2 - 3x + 1$ replaced by $(x-1)(x-2)$ and by $x^2 + 1$ (E2).

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `<COMMIT>`:

```
node tools/replay-c86.js --check   # the JavaScript decider against the record (~2 min); the red controls must fire
node tools/replay-c86.js           # both implementations (~10 min; the Python bisection dominates)
```

Write-up: https://carlostoledo.co/reports/optconst-queue.html#c86 (§8).

**What changes:**
- The README cell for 86 reads 1.8117251 (no asterisk); the Recent-progress line of 15 Oct 2026 drops "(unverified)" and the asterisk, and one line is added in the form the earlier replays were recorded.
- On the 86a page: the summary inequality's note no longer says the bound is asterisked; the [Pin26] row loses the asterisk, its last sentence says the certificate was independently replayed [T2026c], a [T2026c] reference is added, and a contribution note.

*AI-assisted: prepared with Claude (Anthropic) in a certified-arithmetic setting: the replay code, the record and this pull request. Every number above is read from the pinned record at the commit cited, and was re-checked against the upstream files before sending.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
