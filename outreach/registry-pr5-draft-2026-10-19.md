# T-PR5 — DRAFT, NOT SENT (2026-10-19)

To teorth/optimizationproblems, in the form of #216 / #230 / #232. **Send only on the operator's word.** It edits the
82a page (the [Epi26] and [Pin26] rows), the README row 82 and the end of Recent progress; it touches no line that
#232 (open), T-PR3 or T-PR4 (drafted) edit, so it can go in any order. The reference label is [T2026d] if T-PR4
([T2026c]) is sent first, otherwise [T2026c] — the edit script takes the label as an argument. When sending: branch from
the current upstream main, run
`python3 outreach/registry-pr5-edit-2026-10-19.py <clone> certs/c82-replay.json <commit> "<d Mon 2026>" <label>` with
the cert-machine commit that holds `certs/c82-replay.json`, re-read the 82a page and README for changes since the
2026-10-19 pin (`corpus/optconst-queue/c82-2026-10-19/upstream/`, registry 46dbf036), then open the PR with the body
below.

Evidence: `certs/c82-replay.json` (tools/replay-c82.js + instruments/optq/c82.py; battery `--check` in make test), page
https://carlostoledo.co/reports/optconst-queue.html#c82 (§9).

---

**Title:** C82: the [Pin26] certificate and the [Epi26] construction independently replayed; asterisks removed

**Body:**

#216, #230 and #232 applied the CONTRIBUTING rule that the marker "is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed." This PR offers the same replay for the two asterisked $C_{82}$ upper bounds, decided from the bytes each row cites, with no code shared with the claimants' checkers (kept as text, never run). Markdown only.

**What was replayed.** Both rows are Doche's limit-point construction [Doc01b]: integer polynomials $R_j$ with multiplicities $m_j$ and $S_i$ with rational exponents $q_i$ give, with $T(z) = z(1-z)$, $Q = \prod R_j^{m_j}$ and $\log\lvert A\rvert = \sum q_i \log\lvert S_i\rvert$,

$$B = \frac{1}{\deg Q}\Big(\log M(Q\circ T) + \int_0^1 \max\big(0, \log\lvert A\circ T(e^{2\pi i t})\rvert - \log\lvert Q\circ T(e^{2\pi i t})\rvert\big)\,dt\Big), \qquad C_{82} \le B.$$

$B$ was decided by two implementations sharing no code with each other (JavaScript: Gaussian integers for the roots and an outward-rounded interval library; Python: integers, and doubles with a priori rounding-error bounds):

| | check | how |
|---|---|---|
| X1–X3 | integer factors; denominators monic up to sign with positive integer multiplicities; exponents rational $\ge 0$; $\deg A < \deg Q$; every numerator coprime to every denominator | exact (gcd 1 modulo a prime dividing neither leading coefficient) |
| X4 | every root of every composed factor $P\circ T$ enclosed | approximations refined in Gaussian integers at $2^{-192}$ / $2^{-200}$, then Gershgorin's theorem on the Weierstrass matrix with the corrections computed exactly: every disk isolated |
| X5 | $\log M(Q\circ T) = \sum_j m_j \sum_r \log\max(1, \lvert r\rvert)$ | enclosure |
| X6 | the integral on $[0, 1/2]$, doubled (real coefficients) | dyadic panels: a zeroth-order bound from $\lvert u(t) - u(t_c)\rvert \le \pi w$, and a second-order Taylor form with $\lvert g''\rvert \le 4\pi^2 \sum \lvert w_k\rvert \lvert r_k\rvert / \mathrm{dist}^2$ |

| row | construction | $B$ (JavaScript) | $B$ (Python) | printed |
|---|---|---|---|---|
| [Pin26] | `certificate.json` @ `69d8964` (sha256 `b33626f3…`), 2,058 roots | $[0.2534446872487,\ 0.2534446875146]$ | $[0.2534446872487,\ 0.2534446875146]$ | 0.2534449 |
| [Epi26] | `construction.json` @ BakeLab/Epi-results `97fa6a42` (sha256 `e85e26fa…`, the digest its result file names) | $[0.2535689301873,\ 0.2535689304235]$ | the same to 13 digits | 0.2535744749068227 |

Both bounds hold. The [Pin26] row's own certified value $0.25344468733\ldots$ lies inside both enclosures. The [Epi26] construction gives $0.2535689\ldots$, about $5.5\times10^{-6}$ below the printed bound — the printed number is valid and weaker than its construction gives, as the row's comment already says.

**Controls**, decided the same way: Doche (2001b)'s and Grinsztajn's constructions (as transcribed in the [Pin26] repository) give $0.2544362\ldots < 0.25444$ and $0.2536269\ldots < 0.2536331090204145$; the [Pin26] repository's own planted failure (a multiplicity doubled) is refuted. **Red controls**, which must come out wrong in both: a bar below $B$ (refuted); a numerator equal to a denominator, a non-monic denominator, $\deg A \ge \deg Q$, a squared factor (repeated roots) and an exponent written as a float (each refused at its check).

**What was not re-derived.** Doche's theorem — that $B$ bounds $C_{82}$ — is read, not re-proved; the [Pin26] README also proves it directly, and its hypotheses are the exact checks above.

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `<COMMIT>`:

```
node tools/replay-c82.js --check   # the JavaScript decider against the record (~1 min)
node tools/replay-c82.js           # both implementations, every control (~4 min)
```

Write-up: https://carlostoledo.co/reports/optconst-queue.html#c82 (§9).

**What changes:**
- The README cell for 82 reads 0.2534449 (no asterisk); the Recent-progress line of 16 Oct 2026 drops "(unverified)" and the asterisk, and one line is added in the form the earlier replays were recorded.
- On the 82a page: the [Epi26] and [Pin26] rows lose the asterisk and their last sentence says the construction was independently replayed [label]; a reference and a contribution note are added.

*AI-assisted: prepared with Claude (Anthropic) in a certified-arithmetic setting: the replay code, the record and this pull request. Every number above is read from the pinned record at the commit cited, and was re-checked against the upstream files before sending.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
