# C51 ≥ 0.5850788196744 (PR #184, [R2026b]): an independent exact replay — pre-registration, 2026-11-07

Written and committed BEFORE any code of ours computes anything from the claimant's data. The operator approved one
independent exact replay of this one published bound, to be offered as a second-party check on the public pull
request. Nothing is posted and nothing is pushed by the session that writes this; the orchestrating session reviews the
record and posts. Later changes are dated amendments appended at the end, never edits above them.

## What every artifact of this decision says first

The reduction β(f_{K,ε}) = 1/max_{|z|=1}|k_{K,ε}(z)| (He–Tang, Theorem 2.8, with Lemma 3.1) is READ, not decided or
formalized here. What is decided is the finite statement under it: for the exact parameters K and α the claimant
publishes, max_θ |P(θ)| ≤ 1/0.5850788196744, where P is the full infinite series (tail included), on the whole circle.

## The claim, verbatim, at its pins

- teorth/optimizationproblems pull request #184 (AndreRoehrig, "Improve C42 and C51 bounds with verification
  certificates"), head `f7003e2e1893a522593fc8072ad072672168cff3`, base `9d57db86c8564cb623ec9f9e41429a34efd819fb`,
  state OPEN at reading. `constants/51a.md` at the head, sha256
  `ee27509994f3f7e967d21f9fb0206fcf57cec8c22febb13400dc153fddc41c01`, line 35, the new row, verbatim:

  > | $0.5850788196744$\* | [R2026b] | Exact parameters $K=3.5681854310698435$, $\alpha=3.9615431126097391$,
  > $\varepsilon=e^{i\alpha}$ in the family of [HT2026], Theorem 2.8. Truncation through $n=9$ reduces the squared
  > modulus to a degree-19 polynomial in $x=\cos^2\theta$. Rational Bernstein subdivision covers $[0,1]$ with 19 leaves
  > (37 nodes, depth 18); adding the uniform infinite-series tail gives
  > $\max\_\theta\lvert P(\theta)\rvert\le1.709171425067816128872617735945$. Its reciprocal exceeds the recorded bound.
  > The full [S2026] paper bound is $0.585078819653$; the gain over a certified upper bound for that paper's actual
  > specified function is greater than $2.1047\times10^{-11}$. [Proof and verification, pinned commit](…) |

  and lines 58–72 (the identity β = 1/max|P|, P(θ) = 2 Σ_{n≥0} K^{-T_n} e^{iαT_n} cos((2n+1)θ), T_n = n(n+1)/2; the
  tail after n = 9 at most 2K^{-55}/(1−K^{-11}); the old parameters K = 3.568182317714, α = 3.961543335688 with
  β(f_old) < 0.585078819653352950854632621542). `README.md` at the head, sha256
  `ad3bb1a42b4a0d89b645a451f28b77d2508795b5b70efad6bced0161de966e75`, row 51: `0.5850788 (0.5850788196744\*)`.
- AndreRoehrig/optimization-constants-certificates at `ed6387399cf6de02eaa4cf10c43787633496619a` (tag `v1.0.2`, tag
  object `4720bf7cf7ed68203567d6508a4cd97f426d1745`). Files READ, each sha256 equal to the repository's
  `MANIFEST.sha256` (itself `ff8af05cdbe590ea8c75f9c451760281ff19fa9628dbf79b9a62413ee06b5368`):
  - `certificates/maximum_term.json` `dcf9d1bc0f6d7b295e0eff548cf73faf092efd8d038829e4d19755f07df33683` (177 bytes):
    K = "3.5681854310698435", alpha = "3.9615431126097391", lower_bound = "0.5850788196744", N = 9,
    baseline_paper_bound = "0.585078819653";
  - `certificates/maximum_term_verification.json` `eedcf8168f2d22befc2fd307c735b21b0714a03641ea12e7429a6802c211bb5f`
    (the claimant's transcript: numbers only);
  - `notes/maximum_term.md` `f81bb57a98a8daec96837224b7a5d0f5ce108c645c205cd693ca928bb8a9fe41` (the proof note);
  - `README.md` `3361478c4f1bcd4e0432af77325f319395d35fc39a4517cb4a35e88425e1274c`.
  The repository carries no licence file: nothing of it is copied into cert-machine. The data file's two parameters are
  also printed verbatim in the registry row above; the tools carry them as literals and, when the record is written,
  fetch the data file at the pinned commit and refuse unless its sha256 and its fields equal the pin and the literals.
- He, Tang, *Generalizing the Clunie–Hayman construction in an Erdős maximum-term problem*, arXiv:2602.12217v1
  (12 Feb 2026), PDF sha256 `d61ee288717d1a7b436d270d10b88bcf9c95049814d8cdc897a9f5346f08bce9`: §2 (Lemmas 2.1–2.7,
  Theorem 2.8), Lemma 3.1, Lemmas 3.2–3.4, Proposition 3.5, Appendix A.

## The mathematics, checked symbol by symbol against the paper

f_{K,ε}(z) = Σ_{n≥0} A_n z^n, k_{K,ε}(z) = Σ_{n∈ℤ} A_n z^n, A_n = ε^{n(n−1)/2}/K^{T_n}, T_n = n(n+1)/2, K > 1, |ε| = 1.
Theorem 2.8: β(f_{K,ε}) = 1/A(K,ε), A(K,ε) = max_{|z|=1}|k_{K,ε}(z)|. Lemma 3.1: e^{iθ}k(εe^{2iθ}) =
2 Σ_{n≥0} ε^{T_n} K^{-T_n} cos((2n+1)θ), so A = max_θ |P(θ)|. I re-derived the pairing of the indices n and −n−1
(T_{−n−1} = T_n; the ε-exponents (n(n−1)/2 + n) and ((n+1)(n+2)/2 − (n+1)) both equal T_n). With ε = e^{iα},
ε^{T_n} = e^{iαT_n}: the PR's formula and the note's are the paper's, with T_n = n(n+1)/2 in both places.
Used here, each proved in the record's prose: |P(−θ)| = |P(θ)| (cos even), P(π−θ) = −P(θ) (cos((2n+1)(π−θ)) =
−cos((2n+1)θ)), period 2π; so max over ℝ = max over [0, π/2], and any cover [0, U] with U ≥ π/2 suffices. The tail:
|P − P_N| ≤ 2 Σ_{n>N} K^{-T_n} ≤ τ_N := 2K^{-T_{N+1}}/(1 − K^{-(N+2)}), since T_{n+1} − T_n = n + 1 ≥ N + 2 for n ≥ N + 1.
τ_N is an exact rational. With F_N = |P_N|²:
- CERTIFIED (A ≤ a): every cell's upper bound for F_N is ≤ (a − τ_N)², exact comparison, and the accepted cells cover
  [0, U] with 2U ≥ (upper end of a rigorous π enclosure).
- REFUTED (A > a): some θ with (lower end of F_N(θ)) > (a + τ_N)², a witness, so A ≥ |P_N(θ)| − τ_N > a.
A claim β ≥ b is the claim A ≤ 1/b.

## Independence (what was read, what was not)

Read before this note: the PR body, its diff and its three conversation comments — ours of 2026-10-06 (the C42 half),
maximusrufus's of 2026-11-04, and arhancanli's of 2026-11-07 10:36:28 UTC (issuecomment-6705699711), read in full,
numbers included. That comment reports A = max|P| ∈ [1.709171425067672530527823486722,
1.709171425067672530527824486723], β ∈ [0.585078819674513477028433803123, 0.585078819674513477028434145442], an
interior maximum at θ ≈ 0.6455415545 exceeding |P(0)| by ≈ 1.16·10⁻¹⁵, the old parameters' maximum at θ = 0, and He and
Tang's mesh value at j = 1794536 reproduced to 25 digits. So this replay is NOT blind to the expected numbers; it is
independent in code and method. Also read: the certificate repository's README, MANIFEST, note and two JSON files
above, and the paper.
Never read, never fetched, never run: the certificate repository's `scripts/certify_maximum_term.py`,
`scripts/certify_turan.py`, `scripts/audit.py` (their sha256s are known only from the MANIFEST), arhancanli's
repository (github.com/arhancanli/quantavane-replays), He and Tang's code repository (QuanyuTang/ep513-arb-certification),
and Sothanaphan's note (only its parameters, as the PR prints them, are used).

## Method — different from the three already used

The note bounds a degree-19 polynomial in x = cos²θ by rational Bernstein subdivision; He and Tang evaluate a
2,000,000-point mesh plus a global Lipschitz constant; arhancanli bounds F on 1,050 cells by the quadratic Taylor
polynomial at the midpoint plus a global cubic remainder. Ours is an adaptive interval branch-and-bound on θ itself,
done twice, by two implementations that share no code with each other, with the claimant, or with arhancanli:

- **Python** `tools/c51-replay.py` (standard library only, run with `python3 -I`): binary fixed-point intervals, 2⁻³²⁰,
  outward rounding (floor/ceil on Python integers); K^{-T_n} exact rationals rounded outward; cos, sin by Taylor series
  at the point with a Lagrange remainder; e^{iαT_n} as products of powers of e^{iα}; e^{i(2n+1)θ} as powers of e^{iθ},
  so nothing is reduced modulo 2π; π from Euler's arctan(1/2) + arctan(1/3) by alternating partial sums in Fraction;
  truncation N = 14; cover [0, 1609/1024]. Cell bound: the **mean-value form** with the natural interval extension of
  F_N' over the cell (cos((2n+1)θ), sin((2n+1)θ) on the cell enclosed as the midpoint value ± (2n+1)r): upper =
  F(m) + r·max|F'(cell)|; and the **monotonicity test**: if F'(cell) excludes 0, the cell's maximum is at an endpoint,
  evaluated there.
- **JavaScript** `tools/c51-replay.js` (Node, BigInt only): decimal fixed-point intervals, 10⁻¹⁰⁰, outward rounding;
  K^{-T_n} by repeated outward-rounded multiplication; e^{ix} by Taylor series at x/2¹² and twelve squarings; π from
  Strassnitzky's arctan(1/2) + arctan(1/5) + arctan(1/8); truncation N = 13; cover [0, 3927/2500]. Cell bound: the
  **first-order Taylor form with a global second-derivative bound**, F(θ) ≤ F(m) + |F'(m)|·r + G₂r²/2 with the exact
  rational G₂ = 2(g₀g₂ + g₁²) ≥ sup|F_N''|, g_k = Σ_{n≤N} 2(2n+1)^k K^{-T_n}; and the monotonicity test |F'(m)| > G₂r.
- Both: a **decision** run (depth-first; split until every cell is accepted, a witness refutes, or a budget ends:
  depth 64, 400,000 cells → REFUSED), followed by the coverage check (the accepted cells, sorted, are contiguous
  from 0 to U, and 2U ≥ π_hi); and an **enclosure** run (best-first; stop when every surviving cell's upper bound is
  within 10⁻³² of the best lower bound found; budget 400,000 cells), giving A, β, and the set of θ where the maximum can
  lie. Every comparison is between integers (exact). The JavaScript also writes the record, `certs/c51-replay.json`,
  runs the Python as a child, and `--check` re-derives and compares.
cert-machine's own interval instrument (instruments/interval) is float64 with outward rounding: its ~10⁻¹⁶ would decide
the claim (margin ~3·10⁻¹³ in A) but cannot resolve the two maxima (gap ~10⁻¹⁵), so both implementations carry their
own high-precision intervals.

## Rows decided (each CERTIFIED / REFUTED / REFUSED)

- **R1** the registry row: β(f_{K,ε}) ≥ 0.5850788196744, i.e. A ≤ 1/0.5850788196744, at the pinned K, α.
- **R2** the claimant's printed maximum: A ≤ 1.709171425067816128872617735945.
- **E** (information, not a verdict): A and β enclosed to ~10⁻³⁰; the localization of the maximizer; |P(0)| enclosed;
  whether the global maximum is interior (sign of max − |P(0)| decided by enclosures).

## Verdict words

CERTIFIED: proved by the procedure above, both implementations agreeing. REFUTED: a witness θ proves the bound false,
both agreeing. REFUSED: neither proved within the budget, or the coverage or pin checks fail, or the implementations
disagree. The verdict of a row is CERTIFIED or REFUTED only when both implementations reach it.

## Controls (predicted now)

- **C1** the least 13-decimal claim above our β-enclosure (expected 0.5850788196746): REFUTED. And the greatest
  13-decimal claim below it (expected 0.5850788196745): CERTIFIED — the printed bound is not the tightest.
- **C2** α + 10⁻⁶ (K unchanged), the claim 0.5850788196744: REFUTED.
- **C3** [S2026]'s parameters K = 3.568182317714, α = 3.961543335688: the claim 0.5850788196744 REFUTED; [S2026]'s own
  0.585078819653 CERTIFIED; our enclosure of β_old below the note's upper bound 0.585078819653352950854632621542;
  the maximum at θ = 0.
- **C4** He and Tang's K₀ = 7137/2000, α₀ = 198074929/50000000: 0.58507 CERTIFIED, and the registry's printed
  0.5850724 CERTIFIED; their mesh value |P₅(θ_j)| at j = 1794536 (θ_j = 2πj/2,000,000, N = 5) agrees with all 25 digits
  of their printed `1.709176397414741464507875`.
- **C5** the cover [0, 3/2] only: REFUSED by the coverage check; and a certified cover with one accepted cell removed:
  REFUSED by the coverage check.
- **C6** truncation N = 2 (τ₂ ≈ 0.0099): R1 REFUSED.
- **C7** working precision starved (Python 2⁻³², JavaScript 10⁻¹⁰): R1 REFUSED.
- **C8** sharpness: A ≤ (our lower end − 10⁻²⁵) REFUTED; A ≤ (our upper end + 10⁻²⁵) CERTIFIED.
- Self-tests: π against both formulas; cos, sin against exact identities (cos² + sin² ∋ 1) and published digits;
  the symmetries at random points; the cell bound above sampled values in random cells; the tail bound against the next
  terms; the two implementations' enclosures intersect.

## Prior

P(R1 CERTIFIED) ≈ 0.97 (two published certificates: the note's, and arhancanli's replay, reaching the same
A to 1.4·10⁻¹³); P(REFUTED) ≈ 0.01; P(REFUSED, a bug or budget of ours) ≈ 0.02. If our numbers disagree with
arhancanli's or the note's, our code is suspected first; the disagreement is then reported exactly as found.

## Not decided (stated in the record before anything else)

Theorem 2.8 and Lemma 3.1 (read, the pairing re-derived, nothing formalized); whether the parameters are optimal;
the note's Bernstein certificate itself (not run); anything about C42; Sothanaphan's note beyond its two parameters.
