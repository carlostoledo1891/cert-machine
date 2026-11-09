# Cameron Freer's conditional quartic stack (elliotglazer/diophantine-z-q #8, #9, #11, #12): the finite facts — pre-registration, 2026-11-08

Written and committed, alone, BEFORE any code of ours computes anything from the values in these pull requests. The
operator's word (2026-11-08): scout, pre-register and decide Cameron Freer's open pull requests on
github.com/elliotglazer/diophantine-z-q as the independent reviewer that repository's new review protocol asks for; draft
the reviews; post nothing.

## What every artifact of this decision says first

"The theorem (ℤ is Diophantine in ℚ) is undecided here, and so is the conditional claim of each pull request (that the
rational zero projection of its quartic is ℤ, given the inherited arithmetic inputs). This decides finite facts only:
what the published coefficient tables are, a necessary condition for each to be a sum of squares, the finite integer
inequalities and polynomial identities the proofs display, and how the published bytes are bound to the pull requests.
The 357/353/353/352 quadratic residuals whose squares are said to give each table are not among the published bytes, so
that the table is their sum of squares, and that they are the compiled source system, is not decided."

## Who reviews, and in what role

Carlos Toledo (GitHub carlostoledo1891), reviewing with Claude agents: Anthropic's Claude Opus 5.5 (model id
claude-opus-5-5) in Claude Code, one agent session in a worktree of cert-machine; tools: git, gh (read-only), Node.js
(BigInt), Python standard library for inspection only. A non-author of every application in these pull requests, with no
code shared with the authors. This is a contributor-written review: under the repository's PROTOCOL.md v1.2 (main
9c0b3aba, blob 11f574a2) it can be a non-author review decision; it is not, and cannot authorize, the
`Protocol / independent agent audit` check from the designated App that ruleset 26781429 requires.

## The claims, at their pins

Repository github.com/elliotglazer/diophantine-z-q, base `main` = `9c0b3aba60d90fdcac82115f0582a6f52f1054f7` (protocol
v1.2 merged). Read from a bare clone outside cert-machine (`~/Projects/zq-scout/freer-2026-11-08/zq.git`, with
`refs/pull/N/head` fetched as `prN`; a scratch copy in the session's scratchpad). The repository has no licence: nothing
of it is copied into cert-machine; every file is read in place by commit and path and its sha256 recorded.

| PR | head | claim (PR body and package README) | table |
| --- | --- | --- | --- |
| #8 | `ad7fc75610fb325313a1afd73b2bfbc4ba5a0d71` | 389 variables, 357 residuals, 26,295 monomials, max `28902*3^1576` (757 digits, 2,513 bits), content 1, x0^4 coefficient 1, all variables occur | committed: `research/conditional-quartic-reduction/tables/quartic-389-balanced-decimal.txt` (blob c8dca16c), 1,050,826 bytes, sha256 `1c612d20915667dfd81a7895f8d93231d5efeaf86ecfaa15194408d298d35573` |
| #9 | `51111cc97d0f42d50338ae378268700c457497f9` | 385, 353, 26,235, max `28902*3^1576` (757 / 2,513) | NOT committed; CI artifact only. sha256 `47da004230ff7a20c7a0824738422eb9c29c4a6e6de92455e3d956e979161ecf`, 1,048,785 bytes (PR body; `research/factored-pole-reduction/EXPECTED.json`, blob 4aed6182) |
| #11 | `e8654b2ca24a424cead6b62f3f790136a170d953` | 385, 353, 26,200, max `28902*3^1420` (682 / 2,266) | NOT committed; CI artifact only. sha256 `c9e3e65c64c360c1cbf22c44704776c000294a1a7028e6f3f80bbe500243bdfb`, 1,038,398 bytes (`research/scalar-chain-reduction/EXPECTED.json`, blob 524bb6cd) |
| #12 | `772fe96a0e65bee76db500d8ef3a7a6b5e884d1f` | 383, 352, 26,019, max `28902*3^1420` (682 / 2,266) | NOT committed; CI artifact only. sha256 `8faea54ef4a9d8cf155205a50c956df20d36e3eec4183b50b39b2c0b87183b0d`, 1,025,272 bytes (`research/scalar-preparation-zero/EXPECTED.json`, blob ba08cc7a) |

The CI artifacts (fork cameronfreer/diophantine-z-q, GitHub Actions; their CI ran their code, we read the output bytes
as data; metadata saved with `gh api`, all expire 2027-02-06):

| run | head_sha (event) | artifact id, name, GitHub zip digest | table read from it |
| --- | --- | --- | --- |
| 42500725633 | 51111cc9 (push) | 13625113430 conditional-quartic-389-385-receipts, `sha256:08d5314b…` | #9: `quartic-385/candidate385/quartic-385-balanced-decimal.txt` |
| 42440965320 | 6fd131e7 (pull_request) | 13600674808 conditional-quartic-389-385-receipts, `sha256:e056ae06…` | #9 (pre-protocol commit) |
| 42500730137 | e8654b2c (pull_request) | 13624594135 conditional-quartic-389-385-chain-receipts, `sha256:3b2e816e…` | #9 (same path) and #11: `scalar-chain/factored/quartic-385-balanced-decimal.txt` |
| 42500725279 | e8654b2c (push) | 13624668724 …-chain-receipts, `sha256:ae787830…` | #9 and #11 |
| 42446323061 | e3444641 (push) | 13604070400 …-chain-receipts, `sha256:5290a080…` | #9 and #11 (pre-protocol commit) |
| 42500728544 | 772fe96a (pull_request) | 13625203191 …-chain-receipts, `sha256:089a26e0…` | #9 and #11 |
| 42500725217 | 772fe96a (push) | 13625182045 scalar-preparation-zero-receipts, `sha256:96197cca…` | #12: `factored/quartic-383-balanced-decimal.txt` |
| 42500728630 | 772fe96a (pull_request) | 13624639044 scalar-preparation-zero-receipts, `sha256:20053d2c…` | #12 |
| 42447547426 | a1f92330 (pull_request) | 13603872835 scalar-preparation-zero-receipts, `sha256:0f406cee…` | #12 (pre-protocol commit) |
| 42500725092 | ad7fc756 (push) | 13625392573 conditional-quartic-389-receipts, `sha256:6c1f06c1…` | none (receipts only; #8's table is committed) |

Proof texts read for the finite statements: #8 `research/conditional-quartic-reduction/proofs/arithmetic_round8.tex`
(blob c4eb2de5) and `PR_DEPENDENCIES.md` (blob f6820169); #9 `research/factored-pole-reduction/PROOF.md` (blob
28e87fbf); #11 `research/scalar-chain-reduction/PROOF.md` (blob 3b3bf7b6); #12
`research/scalar-preparation-zero/PROOF.md` (blob be91a93e). #8's comparison rows name main's Version 13 tables:
`docs/manuscript-revisions/version13/evidence/30d039965a0c90c2-quartic-411-ordinary-coefficients.txt` (blob 66a47ec9) and
`…/652b594a94f6f7e8-quartic-394-symbolic-coefficients.txt` (blob 0e208a75).

## What was looked at before this note (structure inspection, stated exactly)

- `gh pr list` and `gh pr view` of #8, #9, #11, #12, #13 (bodies, commit lists, reviews: none, comments: none, upstream
  checks: none; every upstream run of these heads is `action_required`) and #14's body; the ruleset 26781429 by `gh api`.
- At main: `.github/pull_request_template.md`, `docs/research-review/README.md`, `docs/research-review/PROTOCOL.md`.
- `git diff --name-status` main..#8 (directory counts), #8..#9, #9..#11, #11..#12, #12..#13; `git ls-tree -l` of #8's
  package (file sizes: the table's 1,050,826 bytes was seen there).
- Read in full or in the stated parts: #8's package `README.md`; `PR_DEPENDENCIES.md` lines 1–41, 285–400 and its
  headings; `arithmetic_round8.tex` lines 20–180 and 285–400; #9's README, EXPECTED.json, PROOF.md; #11's README,
  EXPECTED.json, PROOF.md lines 150–231 and a grep; #12's README, EXPECTED.json, PROOF.md lines 110–150 and a grep.
- The first four lines of #8's committed table and of the #12 CI table (header comments, first data row); for #8, the
  monomial column and the coefficient lengths of about fifteen data rows (the monomial syntax).
- Main's Version 13 tables: their first five comment lines, and the field lengths of six data rows of the 411 table. That
  inspection printed the 411 table's data-row count, 6,388, so the Version 13 monomial count is not a blind prediction.
- The fork's Actions run list and artifact lists; the artifacts above downloaded and their file names and sizes listed
  (so the three CI tables' byte counts, 1,048,785, 1,038,398 and 1,025,272, were seen; their sha256s were not computed).

No code of ours has parsed a table, hashed a table, or evaluated any stated inequality or identity.

## What is not decided (stated before anything else, in every artifact)

The theorem. The conditional claim of each pull request. The eleven inherited inputs of `PR_DEPENDENCIES.md` (G_curve,
G_formal, G_quaternion, G_height_geometry, G_pole, G_one_place, G_product_height, G_prime_pattern, G_reductions,
G_progression, G_lucas). The local proofs (detector promotion, height reapplication, factored poles, scalar chain,
preparation zero) beyond the finite statements listed below; the application contracts and their nine obligations. That
each table is the sum of the squares of its quadratic residuals, that those residuals are the compiled source system,
that the compiler and the diagonal change preserve the input projection, that the source system expresses the arithmetic
predicate: the residuals (`balanced/integer-ir.json`, pinned by sha256 in #9's EXPECTED.json but published nowhere) are
neither committed nor uploaded, and we do not run the authors' generator to obtain them. The 391/392/393-variable variants
and #13.

## Independence

Our code is written from the PR texts, the TeX/Markdown proofs and the tables as they stand. None of the repository's
`.py` or `.cjs` (construction, audit, review_tools, reproduce, check_*, *_patch) is run, read or ported; their receipts
and logs are not relied on. Node.js with BigInt and exact rationals on the Mac; floats never decide. git reads blobs and
trees by commit (git is not their code).

## Procedure

One decider, `tools/zq-freer.js`, writes `certs/zq-freer-2026-11-08.json`; `--check` re-derives it from the pinned inputs
and refuses on any difference, including a change to the decider. Per pull request, these questions, each its own
verdict:

- **T, the table.** Read under the format its header states: comment lines start with `#`; each data line is a signed
  decimal integer, a TAB, and a monomial, `1` or factors `x<i>` / `x<i>^<e>` joined by `*`; all data rows are summed.
  From the summed polynomial: the sha256 and byte count as stated; the header's `Variables`, `degree`, `monomials`
  agree; nonzero monomials m; total degree exactly 4; the indices that occur are exactly 0…n−1; the largest |coefficient|
  equals the stated exact expression, with the stated decimal digits and bits; the gcd of the coefficients is 1; the
  coefficient of x0^4 is 1. Values as in the table above. CERTIFIED, or REFUTED with the number that differs.
- **N, a necessary condition for a sum of squares.** If P = Σ Rⱼ² with each Rⱼ of degree ≤ 2 over ℚ, then for every
  variable xᵢ that occurs: deg_{xᵢ} P is 2 or 4; if 4, the x_i^4 coefficient is positive; if 2, the coefficient of xᵢ² (a
  polynomial of degree ≤ 2 in the other variables, equal to Σ Lⱼ² for affine Lⱼ) has a positive semidefinite Gram
  matrix over (1, y). Checked for every variable by exact rational symmetric elimination. CERTIFIED means the table
  passes this condition, not that it is a sum of squares. REFUTED carries an exact rational point where P < 0.
- **A, the finite statements the proofs display**, each an exact integer or rational comparison or a polynomial identity:
  - #8 (arithmetic_round8.tex): the displayed list is exactly the 15 primes below 53; (p+1)^192 > p^193 for each;
    54^192 < 53^193; (9·Π(p+1))^192 < 32^192·(Πp)^193; 13000000/6 + 2 < 2^22; 2^32·46410 < 3^32; with
    C = 2^32·3^9 and H = 3·2^106·C^6·46410^18 + 128: H has bit length 665 and H < 3·2^663; 247520·(H − 128) + 128 has 683
    bits (the stated relation to the preceding constant H7); 3^53 > 2^84; 319 + (319·1181 − 896)·84/53 − 665·896 = 8199/53
    > 0; with c* = 2·3^1181: c*^319 > (4H)^896; (143·1181 − 720)·84/53 − 666·360 = 1418412/53 > 0; with b* = c* − 1:
    b*^143 > (24H)^360; 24H < 9·2^666; 7H·2^(α/12) + 6 < 40H with α = 577/32 (as 2^577·(7H)^384 < (40H − 6)^384);
    40H < 2^670; 100·670 < b*; 12/(24−α) < 12/5 and α/(24−α) < 19/5; (12/5)/100 + (19/5)/4 = 487/500 and
    (19/5)·(1/4) = 19/20; 487/500·a + 19/20 < a − 3 for every real a > 152; α = 18 + 1/32; 1 − α/28 = 319/896;
    2 − 4α/45 = 143/360; 11016 = 2^3·3^4·17; 2401 + 2754(2X+1)² = 11016X² + 11016X + 5155; 3^2364 = (3^394)^6.
  - #9 (PROOF.md), polynomial identities in b, E, T, s, v, Q, Q2, q, q2, s2, H, F: with C_old = 17bq2 + 3H² − 2s2·H − s2²
    and C_new = 17bQ2 + 3v² − 2sv − s²: C_old(H=sv, q2=s²Q2, s2=s²) = s²·C_new; (q2 − q²)(q=sQ, q2=s²Q2) = s²(Q2 − Q²);
    (s2 − s²)(s2=s²) = 0; (H − E(17−T))(H=sv) = −(E(17−T) − sv); C_old(s2=0, q2=q²) = 17bq² + 3H²;
    C_old(H=17F) = 17bq2 + 867F² − 34s2·F − s2² (the Version 13 normalization).
  - #11 (PROOF.md): with c* = 2·3^1064, b* = 3^1064 and the same H: c*^415 > (4H)^992; b*^143 > (24H)^360;
    100·670 < b*; b* > 152; c* − 1 ≥ b*; 1 − α/31 = 415/992; 2 − 4α/45 = 143/360; 963/32 = 30 + 3/32; 40H < 2^670;
    2130 = 6·355 and 3^2130 = (3^355)^6; (A² + r^−15·J1²)/r = A²/r + r^−16·J1²; the β identity above.
  - #12 (PROOF.md): with β = 2401 + 2754(2X+1)², r = β(β−1)(32β+343), ρ = 42r: for every integer X, ρ ≡ 4 (mod 32),
    ρ ≡ 81 (mod 243), ρ ≡ 13 (mod 17), by complete residue systems; hence v₂(ρ) = 2 with ρ/4 ≡ 1 (mod 8) and v₃(ρ) = 4
    with ρ/81 ≡ 1 (mod 3) for every integer X; 13 ≡ 8² (mod 17). (#11's margins carry over: the anchor is unchanged.)
  CERTIFIED when every statement holds; REFUTED naming the first that fails.
- **B, the bindings.** #8: base 9c0b3aba is an ancestor of the head; the diff base..head touches only
  `research/conditional-quartic-reduction/`, `docs/reviews/quartic389-import/`, `docs/reviews/quartic-stack-2026-11-08/`
  and `.github/workflows/research-checks.yml`, deleting no line; the package holds exactly 156 files ("imports exactly
  156 files"); the package tree and `docs/reviews/quartic389-import/` are identical at 490d14ef (before the protocol
  merge) and at the head; the committed table has the stated sha256. #9, #11, #12: the parent PR's head is an ancestor
  of the head; the diff parent..head touches only the layer's packet directory and its workflow file
  (`research-checks.yml` for #9 and #11, `scalar-preparation-zero.yml` for #12); the packet tree is identical at the
  pre-protocol commit (6fd131e7, e3444641, a1f92330) and at the head; EXPECTED.json states the same table sha256 and bytes
  as the PR body; every CI copy listed above has exactly those bytes; the saved run metadata names the head_sha listed.
  CERTIFIED, or REFUTED naming the binding that fails.
- **V13 (#8's comparison rows only).** Main's two Version 13 tables read under their header (`coefficient | C exponent |
  variable indices`, 1-based, comma-separated; C = 3^(2^25) in the symbolic one, every C exponent zero in the ordinary
  one; rows summed): ordinary: 411 variables 1…411, 6,388 monomials, largest |coefficient| of bit length 3,247, 214,957
  bytes; symbolic: 394 variables, 6,338 monomials, largest |coefficient| 16·C² = 16·3^(2^26) (compared as polynomials
  in C, every integer coefficient far below C). The residual counts 381 and 364 are not decided.

Verdict words: CERTIFIED (the stated property holds, exactly), REFUTED (it fails; the record names the witness), REFUSED
(a field cannot be read, or a needed byte is absent; the record names it). A PR's decided scope is CERTIFIED when each
of its questions is, REFUTED when any is, REFUSED otherwise. The record's verdict is CERTIFIED when all four scopes are
and every control came out as pre-registered.

In the protocol's words, each draft review will say "Incomplete review" for the pull request as a whole (the proofs,
contracts and inherited inputs are not reviewed), with the finite scope above decided; a REFUTED would make it "Changes
required", naming the finding.

## Controls (each must be refused by the same code that decides)

- **CT** on #8's table: one coefficient changed by one (refused by the sha256); with the sha256 check off, the x0^4
  coefficient set to 2, every coefficient doubled (content 2), the data row of the largest coefficient removed, a row
  `1<TAB>x389` added (a 390th variable), a row `1<TAB>x1^5` added (degree 5): each refused by T.
- **CN** on #8's table: the x_i^4 coefficient negated for one variable of degree 4; a term x_i^3·x_j planted for one
  variable of degree 2; −10^800·x_i²·x_j² added for one variable of degree 2: each refused by N with an exact point
  where P < 0, evaluated by the same code.
- **CA**: b* := 2 in #8's Lucas margin; the bit length of H claimed to be 10; (9·Π(p+1))^192 < 9^192·(Πp)^192; #9's
  conic with 3H² replaced by 4H²; ρ + 1 ≡ 4 (mod 32); 13 ≡ 7² (mod 17): each refused by A.
- **CB**: one hex digit of #9's stated table sha256 changed; #12's head offered as an ancestor of #8's; #9's file rule
  applied to the diff #8..#11: each refused by B.
- **CR**: our arithmetic against a red list: the PSD test on four small symmetric matrices of known status, digit and bit
  counts of known integers, a gcd, and two polynomial identities with a planted non-identity.

## Predictions, written down now

T CERTIFIED for all four tables (their own checkers report these numbers; the byte counts were seen). N CERTIFIED (the
tables are said to be sums of squares). A CERTIFIED (their finite checkers are said to verify these). B CERTIFIED,
including "byte-identical to the earlier reviewed version". V13 CERTIFIED. Seconds to a minute on the Mac. The main
finding is expected to be a gap, not a refutation: the residuals behind "sum of squares of 357 quadratics" are not
published, and the tables of #9, #11 and #12 live only in CI artifacts that expire on 2027-02-06. A REFUTED would be a
finding, sent to the author on the operator's word only.

## Amendment A (2026-11-08, after the first run, before any change to a question or a reading)

The first run (about 2 s on the Mac) gave T, N and B CERTIFIED for all four pull requests, A CERTIFIED for #8, #9 and
#12, V13 CERTIFIED, and two stops: #11's A REFUTED at q8, `(A² + r^−15·J1²)/r = A²/r + r^−16·J1²`, and the red-list
control CR not refused. Both had one cause, in our arithmetic: the Laurent-polynomial power of a negative exponent inverted
the monomial but ignored the exponent's size, so r^−15 was computed as r^−1; CR's planted identity r^−3·r^3 = 1 failed for
the same reason, which is what the red list is for. The power is now the inverse monomial raised to |e|. That REFUTED was
ours, not the claim's; q8 holds. No question, reading, value or control changed.

Three checks were added beyond the procedure above, written before the first run; each can only add a refusal, never
turn one into CERTIFIED: B's b0, that the saved PR metadata (`gh pr view`) names the pinned head and base and that its body states the table sha256;
in B's b4, that EXPECTED.json also states the coordinates, monomials and residual count of the PR body; and an input
guard, that each proof still contains the displayed statements A decides, verbatim (the decider stops otherwise).
