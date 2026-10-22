# T-PR6 — DRAFT, NOT SENT (2026-10-22)

To teorth/optimizationproblems, in the form of #216 / #230 / #232 / #242. **Send only on the operator's word.** The claimant
(Leandre Jack, leandrejack-afk) asked for this replay by e-mail on 2026-10-21; the operator answers him separately.

When sending: branch from the new upstream main, run
`python3 outreach/registry-pr6-edit-2026-10-22.py <clone> certs/lueker-replay.json <commit> "<d Mon 2026>" T2026`
with the cert-machine commit that holds `certs/lueker-replay.json` (the script refuses unless both rows are CERTIFIED, the
calibration reproduces Lueker's table and every red control fired; every digit it prints is read from the record's
outward-rounded fields). The label: no [T2026] reference exists on 31a.md, so [T2026] is free there; pass another letter only
if one appears. Dry run on 2026-10-22: all edits apply on 46dbf036, still upstream HEAD that morning; re-read
`constants/31a.md` and the README for changes since the pin (`corpus/optconst-queue/c31-2026-10-21/`). Our open #242 and
#243 edit the README's Recent-progress list too; if they merge first, rebase (the C31 line sits in the middle of the list,
the edit script matches each anchor exactly once and refuses otherwise). Then open the PR with the body below.

Evidence: `certs/lueker-replay.json` (tools/run-lueker.py; battery `--check` in make test), page
https://carlostoledo.co/reports/chvatal-sankoff.html. The tables (3.6 GB and 29.5 GB), key files and witness vectors
(0.4 GB and 3.2 GB) are not in the repository; the record pins their sha256 and sizes.

---

**Title:** C31: the h = 9 and h = 10 Lueker bounds of #231 independently replayed; asterisks removed

**Body:**

#216, #230 and #232 applied the CONTRIBUTING rule that the marker "is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed." This PR offers that replay for the two C31 rows merged in #231, with no code shared with the claimant. Markdown only.

**What was replayed.** [J2026] runs Lueker's upper-bound method ([L2009], Theorem 3.3): an automaton $M_h$ over pairs of binary strings with history length $h$, a weight matrix $A_z$, and a positive vector $v$ with $A_z v \le \lambda v$, which gives $\gamma_2 \le 2\log(2z)/\log\lambda$. Lueker computed $h \le 8$; the two rows take $h = 9$ and $h = 10$.

| row | states (ours = [J2026]) | $z$ | our certified $\lambda$ | [J2026]'s $\lambda$ | our bound | printed |
|---|---|---|---|---|---|---|
| $h = 9$ | 51,425,006 | 0.3298 | $\le 0.364708361168896$ | 0.364708361184292 | $\gamma_2 \le 0.8251002730$ | $0.825101$ ✓ |
| $h = 10$ | 400,253,317 | 0.3376 | $\le 0.385532597279844$ | 0.385532705434511 | $\gamma_2 \le 0.8241195407$ | $0.824120$ ✓ |

Beside each certificate a certified **lower** bound on the spectral radius of $A_z$, $\rho \ge 0.364708361168863$ at $h = 9$ and $\rho \ge 0.385532597279807$ at $h = 10$ (the minimum ratio under downward rounding): no certificate for these automata can print a $\lambda$ below it, and both of [J2026]'s sit above it, by $1.5 \times 10^{-11}$ and $1.1 \times 10^{-7}$. Any positive vector certifies, so those are valid, less converged certificates, not errors; both printed bounds hold with room.

**How.** The automaton was written from [L2009] alone (the 2008 extended version, whose Figure 8 and Theorem 2 are the journal's Figure 7 and Theorem 3.3), twice: a Python reference in the standard library and a C builder, which share no code with each other or with [J2026] (its `src/` and `review/` were never fetched). The two give identical tables for $h \le 5$; at $h = 8$, $9$ and $10$ the C table was checked by re-deriving the transitions of 2,000, 2,000 and 1,000 random states in the reference, 0 mismatches; the complement symmetry of the state set was checked. Calibration on Lueker's own Table II for $h = 2 \ldots 8$: every state count (7, 98, 1,020, 10,160, 89,960, 780,368, 6,419,109), every $\lambda$ to his nine digits and every bound to his six; at $h = 8$ the accepted-transition count, 91,508,397, is the one [J2026] publishes. The witness vectors are our own, from power iteration (294 and 338 passes); the certificate $\max_s (A_z v)_s / v_s$ is taken with the rounding mode set upward in every thread (self-tested) and the weights rounded up, once more in round-to-nearest with an explicit inflation; the bound $2\log(2z)/\log\lambda$ is evaluated outward in 60-digit decimal arithmetic. Every printed upper bound above is rounded up at its last digit, every lower bound down.

**Red controls**, which must come out wrong: the weights off by one power of $z$ and the truncation weight not summed both miss Lueker's $\lambda$ at $h = 8$; a claim below the certificate, $z = 1/2$, $\lambda = 1$, a vector with a zero entry, a vector of the wrong length and the all-ones vector are refused; a claimant $\lambda$ below the certified lower bound on $\rho$ is refuted. 9 of 9 fired.

**Re-derive** from https://github.com/carlostoledo1891/cert-machine at `61aae8eb42f1967e16d37d78cfe8a5c1be6d0d72` (the C31 commit of 2026-10-22; pass it to the edit script):

```
python3 tools/run-lueker.py --check     # seconds: the reference automaton at h <= 4, every decision re-derived from the record's hex values, the pins, the red controls
python3 tools/run-lueker.py DATA_DIR    # the full run against stored tables and vectors (h = 10: 3.8 h to build the 29.5 GB table and 3.4 h of iteration on an M2 laptop)
```

Write-up: https://carlostoledo.co/reports/chvatal-sankoff.html.

**What changes:**
- The README cell for 31 reads 0.824120 without the asterisk; its "(unverified)" Recent-progress line is updated, and one line is added in the form the earlier replays were recorded.
- The two page rows lose the asterisk and get a one-sentence replay note, a [T2026] reference and a contribution note.

*AI-assisted: prepared with Claude (Anthropic) in a certified-arithmetic setting: the replay code, the record and this pull request. Every number above is read from the pinned record at the commit cited, and was re-checked against the upstream files before sending.*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
