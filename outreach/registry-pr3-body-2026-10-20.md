Stacked on #232: both edit adjacent README table rows (1a/1b and 1c/1d), so this branch carries #232's commit underneath; once #232 is merged only the second commit remains, and either order merges cleanly.

#216, #230 and #232 applied the CONTRIBUTING rule that the marker "is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed." This PR offers the same replay for the two family-1 rows that carry it, decided from the bytes the rows cite, with no code shared with the claimants. Markdown only.

| bound | bytes replayed | exact value |
|---|---|---|
| $C_{1c} \geq 0.4103287$ [R2026] | rozetyp/barnard-steinerberger-lower-bound @ `19f3971`, `certificate.json`, sha256 `62ac49ddbbfc…` ($K = 6144$, 6148 integer weights) | 21072342208353792/51354782902387969 = 0.41032871754918741449… |
| $C_{1d} \leq 1.4630715826075594$ [CERT2026] | `construction.json` from the #224 description (300 values; sha256 `44f3f2b63b0d…` with CRLF line endings and no trailing newline, the bytes the stated digest is of) | 2039224160683882663565441886346340189798400/1393796574908163689489385839036226787118881 = 1.46307158260755932746… |

**Two corrections.**
- $C_{1d}$: the certificate's exact value, 1.46307158260755932746…, is *above* the bound printed in the table and the README, 1.463071582607559 (by $3.3 \times 10^{-16}$). An upper bound has to round up, so the certificate shows $C_{1d} \leq 1.4630715826075594$, not the printed number. This PR prints 1.4630715826075594 in the row, the README cell and the Recent-progress line.
- $C_{1c}$: the page gives the fraction's decimal as 0.41030287175…; it is 0.41032871754…. The bound column (0.4103287) is right and unchanged.

**How.** For $C_{1c}$, the autocorrelation of an equal-step function is linear between multiples of $1/K$, so the minimum over $t \in [0,1]$ is $K \min_{0 \le k \le K} \sum_i w_i w_{i+k} / (\sum_i w_i)^2$. For $C_{1d}$, $f*f$ is linear between multiples of the cell width, so $\max_t |f*f| / (\int f)^2 = 2n \max_m |\sum_{i+j=m} v_i v_j| / (\sum_i v_i)^2$, with the values read as the doubles `json.load` gives (as the certificate's own verifier reads them). Two implementations compute these exactly, sharing no code with each other or with the certificates' verifiers (not run): Python summing every lag term by term (`fractions`, `int`), and JavaScript over BigInt with Kronecker products. Both give the claimants' stated fractions exactly. The earlier $K = 3072$ certificate in `previous/` was checked too (0.41030211723…, the value its row states).

**Red controls**, which must come out wrong in both implementations: a $C_{1c}$ bound $2 \times 10^{-15}$ above the exact value and a $C_{1d}$ bound $10^{-15}$ below it are refuted; a negative weight, and a $C_{1d}$ function changed to integral zero, are refused.

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `d9a3942b82f9b5dd174935584601065a4e660b68`:

```
node tools/replay-autocorr.js --check   # the JavaScript decider against the record, a few seconds; the red controls must fire
node tools/replay-autocorr.js           # both implementations (~2 min; the Python direct sums dominate)
```

Write-up: https://carlostoledo.co/reports/optconst-queue.html#autocorr (§7).

**What changes:**
- The README cells for 1c and 1d drop the asterisk; the 1d cell reads 1.4630715826075594.
- The two "(unverified)" Recent-progress lines are updated, and one line is added in the form the earlier replays were recorded.
- The two page rows lose the asterisk and get a one-sentence replay note, a [T2026] reference (no [T2026] exists on these pages) and a contribution note; on 1d the asterisk bullet says it was removed.

*AI-assisted: prepared with Claude (Anthropic) in a certified-arithmetic setting: the replay code, the records and this pull request. Every number above is read from the pinned record at the commit cited, and was re-checked against the upstream files before sending.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
