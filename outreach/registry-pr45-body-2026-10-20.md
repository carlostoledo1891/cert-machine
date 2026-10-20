#216, #230 and #232 applied the CONTRIBUTING rule that the marker "is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed." This PR offers the same replay for R. Pinho's two asterisked certificates, $C_{86}$ (#227) and $C_{82}$ (#229), and for the Épi construction the $C_{82}$ page also asterisks — each decided from the bytes the row cites, with no code shared with the claimants' checkers (kept as text, never run). Markdown only. It touches no line that #232 touches (checked by test merges in both orders).

## $C_{86}$ — the trace-constant certificate

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

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `d9a3942b82f9b5dd174935584601065a4e660b68`:

```
node tools/replay-c86.js --check   # the JavaScript decider against the record (~2 min); the red controls must fire
node tools/replay-c86.js           # both implementations (~10 min; the Python bisection dominates)
```

Write-up: https://carlostoledo.co/reports/optconst-queue.html#c86 (§8).

**What changes:**
- The README cell for 86 reads 1.8117251 (no asterisk); the Recent-progress line of 15 Oct 2026 drops "(unverified)" and the asterisk, and one line is added in the form the earlier replays were recorded.
- On the 86a page: the summary inequality's note no longer says the bound is asterisked; the [Pin26] row loses the asterisk, its last sentence says the certificate was independently replayed [T2026c], a [T2026c] reference is added, and a contribution note.

## $C_{82}$ — the [Pin26] certificate and the [Epi26] construction

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

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `d9a3942b82f9b5dd174935584601065a4e660b68`:

```
node tools/replay-c82.js --check   # the JavaScript decider against the record (~1 min)
node tools/replay-c82.js           # both implementations, every control (~4 min)
```

Write-up: https://carlostoledo.co/reports/optconst-queue.html#c82 (§9).

**What changes:**
- The README cell for 82 reads 0.2534449 (no asterisk); the Recent-progress line of 16 Oct 2026 drops "(unverified)" and the asterisk, and one line is added in the form the earlier replays were recorded.
- On the 82a page: the [Epi26] and [Pin26] rows lose the asterisk and their last sentence says the construction was independently replayed [T2026c]; a reference and a contribution note are added.

*AI-assisted: prepared with Claude (Anthropic) in a certified-arithmetic setting: the replay code, the record and this pull request. Every number above is read from the pinned record at the commit cited, and was re-checked against the upstream files before sending.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
