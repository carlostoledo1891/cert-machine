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

## Amendment B (2026-11-08 local, 2026-11-09 UTC): #13 and #16, written before any code reads their values

The operator's word: before anything is posted, extend this review to Cameron Freer's two newest pull requests, #13
("Reduce the conditional quartic to 380 variables (above #12)") and #16 ("Sharpen conditional quartic coefficients to
679/644 digits (above #13)"), by the same method; then post ONE COMMENT review on #8 covering the whole stack, with a
one-line pointer on each of the others. Nothing is posted by this session.

### The heads, re-checked

`gh pr list` and `git ls-remote` (about 01:00Z on 2026-11-09): main `9c0b3aba60d90fdcac82115f0582a6f52f1054f7`, #8
`ad7fc756`, #9 `51111cc9`, #11 `e8654b2c`, #12 `772fe96a`, #13 `31563264ba3dfbc3f00b4b08c099e9380caacd42`: **none
moved**, so the decisions above bind the same heads. New: #16 `59c59e5589d86036ee41994c82a2b900fce85c2d` (base main
9c0b3aba, parent #13). Also observed and NOT in scope: #17 (cameronfreer, `eb00b7c9`, "Reach 380 variables with 644-digit
coefficients (above #16)", opened 00:16:54Z); only its title, head, base and date were read. No PR of the six has a review
or a comment; every upstream run of #8's, #13's and #16's heads is `action_required`.

### The claims, at their pins

Both PRs carry two tables each, an order-45 default and an order-47 optional route. All four are CI artifacts only (not
committed; their packets commit a generator and EXPECTED.json).

| PR | head, parent | packet, workflow | table: variables, residuals, monomials, max (digits / bits), bytes, sha256 |
| --- | --- | --- | --- |
| #13 | `31563264`, #12 `772fe96a` | `research/detector-cube-reuse/`, `.github/workflows/detector-cube-reuse.yml` | order 45: 380, 349, 26,025, `28902*3^1420` (682 / 2,266), 1,025,480, `373c624d3b1293809e521ab8113052ff473f1b14ea1cde2facb361979515f6e5`; order 47: 383, 352, 26,043, `28902*3^1344` (646 / 2,146), 1,022,041, `8ac84ab634f1636110d9c33df9613612110b44b6e9a044469873b51ef0e91ebc` |
| #16 | `59c59e55`, #13 `31563264` | `research/height-consumer-refinement/`, `.github/workflows/height-consumer-refinement.yml` | order 45: 380, 349, 26,025, `28902*3^1412` (679 / 2,253), 1,025,094, `a194dd94682d4e458d0e03407e39aea056a6626014210c384b3a9c80f19a43e6`; order 47: 383, 352, 26,043, `28902*3^1340` (644 / 2,139), 1,021,849, `d2e9856dcbd752a156548e37545f48ed8e1e8d263c5b374aad5a19f44f8eab6f` |

Values from the PR bodies, the READMEs, the PROOF.md tables and EXPECTED.json (#13 blob a07ec459, #16 blob 6914d708; the
byte counts are EXPECTED.json's `tableBytes`). Each table: degree 4, content 1, x0^4 coefficient 1, every variable occurs.
Proof texts: #13 `research/detector-cube-reuse/PROOF.md` (blob ad66650d) and its retained order-47 argument
`references/precision51_PROOF.md` (blob 1adf0ca5) with `references/ORIGIN.json` (blob abe76e7f: fork commit
`bc51100fd3ada82df0dac55d6f1d235219430c74`, path `research/higher-detector-precision/PROOF.md`, a sha256); #16
`research/height-consumer-refinement/PROOF.md` (blob 1a435aa2). Source manifests: #13 `SOURCE_BINDINGS.json` (blob
fd4201d7) with `SOURCE_BINDINGS_SHA256.txt` (blob 0400ed29); #16 `SOURCE_BINDINGS.json` (blob c5e41a42) with
`SOURCE_BINDINGS_SHA256.txt` (blob d8334f07), whose value the PR body states with "binds 85 files".

The CI artifacts (fork cameronfreer/diophantine-z-q; every one expires 2027-02-06; metadata saved with `gh api`):

| run (event) at head | artifacts read (id, name, zip digest prefix) | tables read from them |
| --- | --- | --- |
| 42501591301 (push) at #13 | 13625523752 cubic-reuse-order-45 `9449925e`; 13625249620 cubic-reuse-order-47 `b64df95e` | #13: `quartic-380-balanced-decimal.txt`, `quartic-383-balanced-decimal.txt` |
| 42502112522 (pull_request) at #13 | 13625698927 order-45 `acf6d65c`; 13626330627 order-47 `2d1b2e26` | #13, both |
| 42537804191 (push) at #16 | 13639254217 cubic-reuse-order-45 `f7329436`; 13639793760 order-47 `ad6b9f8f` | #13, both (the parent's tables at #16's head) |
| 42537807736 (pull_request) at #16 | 13639747706 order-45 `c00b3fb4`; 13639624776 order-47 `28d6f631` | #13, both |
| 42537804182 (push) at #16 | 13639782567 height-consumers-order-45 `a55ef08e`; 13640605459 height-consumers-order-47 `010a219b` | #16: `quartic-380-balanced-decimal.txt`, `quartic-383-balanced-decimal.txt` |
| 42537807726 (pull_request) at #16 | 13640360615 order-45 `c1694af9`; 13640171921 order-47 `74d6212e` | #16, both |
| 42501591246 (push) and 42502112489 (pull_request) at #13; 42537804236 (push) and 42537807727 (pull_request) at #16 | conditional-quartic-389-385-chain-receipts 13626170175 `5941f62a`, 13625971972 `b110809d`, 13640750036 `e4ea3d0a`, 13640431221 `0270b826` | #9 (`quartic-385/candidate385/…`) and #11 (`scalar-chain/factored/…`), the same paths as before |
| 42501591237 (push) and 42502112560 (pull_request) at #13; 42537804187 (push) and 42537807728 (pull_request) at #16 | scalar-preparation-zero-receipts 13625548867 `0aac1852`, 13625812996 `38f6185d`, 13639903235 `7f5e8ca4`, 13640386140 `cd0c40ae` | #12 (`factored/quartic-383-balanced-decimal.txt`) |

The full digests go into the decider's pins. No artifact carries the residuals: each new one holds the table,
`balanced/summary.json`, `MEASURED.json`, check JSONs and a replay log; EXPECTED.json pins `balanced/polynomial.json`,
`final/integer-candidate-ir.json` and `raw-translated-ir.json` by hash, and none is committed or uploaded.

### What was looked at before this amendment (structure inspection, stated exactly)

- `gh pr list` (all PRs: numbers, authors, heads, dates, titles); `gh pr view` of #13 (body, commit list, file list with
  line counts, reviews, comments) and #16 (body, commit list, reviews, comments); #17's head, base, date and title; reviews
  and comments of #8, #9, #11, #12; the upstream run lists at #8's, #13's and #16's heads (`action_required`).
- `git ls-remote` of main and the PR heads; fetches of the six heads and of the fork commit bc51100f into the bare clone;
  `git ls-tree -l` of bc51100f's `research/higher-detector-precision/`, which showed its PROOF.md with git blob id
  1adf0ca5, the same blob id as #13's `references/precision51_PROOF.md` (so the byte equality B decides was visible at the
  git-object level; no sha256 was computed).
- `git diff --name-status` #12..#13 (14 paths, every one added) and #13..#16 (19 paths, every one added); `git ls-tree -l`
  of both packets (sizes).
- Read in full: #13's README.md, EXPECTED.json, PROOF.md, references/precision51_PROOF.md, references/ORIGIN.json,
  SOURCE_BINDINGS_SHA256.txt; #16's README.md, EXPECTED.json, PROOF.md, SOURCE_BINDINGS_SHA256.txt. The first 700 bytes
  of #13's and 1,500 bytes of #16's SOURCE_BINDINGS.json (the format: `files`, a list of `{path, sha256}`). PROTOCOL.md
  lines 150–200, 280–310 and a grep (main).
- The fork's run lists at both heads and their artifact lists (ids, names, sizes, digests, expiry); the twenty artifacts
  above downloaded into the scout folder and their file names and sizes listed: so the four new tables' byte counts
  (1,025,480, 1,022,041, 1,025,094, 1,021,849, equal to EXPECTED.json's) and the parent tables' byte counts at the new heads
  were seen; no sha256 was computed. The three header comment lines of the four new tables (same format as before:
  `# Variables: <n>; input: x0; degree: 4; monomials: <m>.`); no data row was printed.
- A timing check of BigInt powers on unrelated numbers (a 4.85-million-bit power: 0.07 s).
- By hand, while fixing the readings below (no code): the reduced denominator of a13 under the reading stated in A, which
  agrees with the displayed one; the triangle bound P(B) and the coefficients 4712/4775 and 4616/4775 of #16; rough
  base-2 logarithms of the anchor margins (the order-47 scalar margins at anchors 2004/2010 looked tight). No code of ours
  has parsed, hashed or evaluated anything of #13 or #16.

### The questions for #13 and #16 (the same T, N, A, B; nothing above changes)

- **T** and **N**, exactly as above, on each of the four tables (two per PR), against the values in the table above. A
  PR's T (N) is CERTIFIED when both its tables are.
- **A, #13** (`PROOF.md`), each an exact identity over ℚ (Laurent polynomials in named symbols) or an integer statement:
  c1 F(t) = t(t−1/49)(t−1/50)(t−1/2450)(t−32/1225) is a monic quintic with c0 = 0 (its c4…c1 recorded); c2 with t2 = t²,
  M = t2(t+c4) + c3·t + c2 = t³ + c4t² + c3t + c2 and t3 = M − c4·t2 − c3·t − c2 = t³, for F's actual coefficients;
  c3 delta3 = 98³·t3 − 3·98²·t2 + 3·98·t − 1 = (98t − 1)³; c4 the old segment, with q1 = e/delta and E = q1·delta²:
  E = e·delta, mixC = E³q1³ = e⁶, mixD = mixC² = e¹², q12 = mixD²/E = e²³/delta; c5 the new segment, with
  q1cube = q1³ and delta3 = delta³: e3 = q1cube·delta3 = e³, e6 = e3² = e⁶, e12 = e6² = e¹², q12 = e12²/E, the same
  q12 as c4; c6 the reverse map: the restored mixC = E³q1³ and mixD = mixC² equal e6 and e12; c7 downstream, in both
  chains: mixedHigh = q12² and q45 = mixedHigh²/q1cube agree, and the optional highLift = mixedHigh·E,
  q47 = highLift²/q1 agree; c8 the stated counts agree: three detectors × (four old gate rows deleted, three new added,
  one q12 row changed) = 12, 9, 3, and 12 − 9 = 3 = 383 − 380 = 352 − 349 (the residual rows themselves are unpublished,
  so only the arithmetic of the stated counts is decided); and the retained reference's 386 − 3 = 383, 355 − 3 = 352;
  c9 EXPECTED.json's anchor and c exponents: 2130 = 6·355, 2016 = 6·336.
- **A, #13's retained order-47 argument** (`references/precision51_PROOF.md`): d1 with a0 = 1, a1 = −2/5 and
  a_j/a_(j−1) = (4j−5)/(4j+1) **for j ≥ 2** (the reading under which the three are consistent: at j = 1 the ratio would
  give −1/5), the reduced denominator of a13 is 5²·7·17·29·37·41·53; d2 hence v_p(a13) ≥ −1 for every prime p outside
  {2,3,5,7,13,17}; d3 for every integer j ≥ 14, 4j − 51 − ⌊(4j+1)/10⌋ ≥ 0, with 0 at j = 14 and each step adding at
  least three (the step decided over a complete residue system j mod 5); d4 at p = 53: v_53(a13) = −1, so the j = 13 term
  has valuation 4·13 − 1 = 51, and 4j − ⌊(4j+1)/52⌋ ≥ 55 for every j ≥ 14 (base case and steps, j mod 13); d5 with
  E = q1·delta²: q12 = E¹¹q1¹², mixedHigh = E²²q1²⁴, q46 = (mixedHigh·delta)²/q1 = E⁴⁵q1⁴⁶,
  q47 = (mixedHigh·E)²/q1 = E⁴⁶q1⁴⁷, and E^(m−1)q1^m = e^(2m−1)/delta with e = q1·delta for m = 12, 46, 47; d6 with
  c* = 2·3^1007, b* = 3^1007 and the same H: c*^415 > (4H)^992; b*^(16m−577) > (24H)^(8m) for every 46 ≤ m ≤ 51;
  40H < 2^670; b* > 67000; b* > 152; d7 for 46 ≤ m ≤ 51: α/m < 1/2, 2 − 4α/m = (16m−577)/(8m), and
  7H·5^(α/m) + 6 < 24H (as 5^577·(7H)^(32m) < (24H − 6)^(32m)); d8 the two stated failures: at anchor 2010
  (c* = 2·3^1004) c*^415 ≤ (4H)^992, and at anchor 2016 for order 45 (3^1007)^143 ≤ (24H)^360.
- **A, #16** (`PROOF.md`): h1 β = 2401 + 2754(2X+1)² has β − 2401 = 2754(2X+1)², so β ≥ 2401 for real X with equality
  only at X = −1/2, and 2401 > 1 > 0 > −343/32; h2 with U = C0 + C1: C0 + C1·ρ = (1 − ρ)C0 + ρU; h3 at ρ = √2 and
  ρ = −√2, |1 − ρ| + |ρ| is 2√2 − 1 and 2√2 + 1 (signs decided exactly in ℚ(√2)), and their product is 7; h4 log 50 < 4,
  log 7 < 2 and log 2 < 1 (natural logarithms), decided as 50 < e⁴, 7 < e², 2 < e with the rational lower bound
  Σ_{k≤12} 1/k! < e; h5 K0 = (3H + 14)/2 < 7H and (3/2)(H + 4) + 2/2 = (3H + 14)/2; h6 c* = 2·3^(E/2−1): 1058 for E = 2118,
  1004 for E = 2010, 1064 for 2130, 1007 for 2016; 1058 ≤ 1064 and 1004 ≤ 1007; 2118 = 6·353 and 2010 = 6·335 (EXPECTED.json's
  c exponents); h7 the triangle bound: B² + B(B+2)·B·B + (B+2)²B² + 1 = 2B⁴ + 6B³ + 5B² + 1 = P(B); h8
  P(B) = B⁴(2 + 6B⁻¹ + 5B⁻² + B⁻⁴), B² − 6 = B²(1 − 6B⁻²), 4·577 = 2308, 64m − 2308 > 0 for m = 45, 47, 32α = 577,
  2K0 = 3H + 14, and b*² > 6 (the monotonicity of the three factors for B > √6 is read, not decided); h9 the endpoint test
  [2(b*² − 6)]^(32m) > (3H + 14)^(32m)·P(b*)^577 at (E, m) = (2118, 45) and (2010, 47), b* = c* − 1; h10 order 45 at
  E = 2118: c*^415 > (4H)^992 and 1 − α/31 = 415/992; order 47 at E = 2010: 8^992·c*^415 > (25H)^992; 1/4 < 8/25; h11 the
  final input: 24 − α = 191/32, 12/(24−α) = 384/191, α/(24−α) = 577/191, α/12 < 2, 7H·2^(α/12) + 6 < 40H (as a15),
  40H < 2^670, b* > 67000 at both anchors, (384/191)/100 + (577/191)(8/25) = 4712/4775 with (577/191)(8/25) = 4616/4775,
  and (4712/4775)x + 4616/4775 < x − 3 for every real x ≥ 301, with 301 ≤ b*; h12 11016 = 2³·3⁴·17; h13 the two stated
  failures: the endpoint test fails at (2112, 45), [2(b*² − 6)]^1440 ≤ (3H+14)^1440·P(b*)^577 with b* = 2·3^1055 − 1, and
  the order-47 scalar test fails at E = 2004, 8^992·c*^415 ≤ (25H)^992 with c* = 2·3^1001.
- **New kinds of displayed statement**, each decided exactly: stated failures (decided as the non-strict reverse
  inequality); inequalities with log (through a rational lower bound for e, so they can only be confirmed, never accepted
  falsely); signs in ℚ(√2) (a + b√2 > 0 decided by squares); statements over every integer j ≥ 14 (a base case and a
  complete residue system for the step); the reduced denominator of a recurrence-defined rational; comparisons of up to
  about 4.9 million bits; and the arithmetic of stated row counts. Before the run the decider checks that each proof
  still contains, verbatim, a phrase of each statement group it decides (as amendment A's input guard).
- **B, #13 and #16:** b0 the saved PR metadata names the head and base 9c0b3aba and the body states both table sha256s;
  b1 the parent's head is an ancestor of the head; b2 the diff parent..head only adds files, all under the packet or its
  workflow; b3 for #13, `references/precision51_PROOF.md` has the sha256 ORIGIN.json states and is byte-identical to
  `research/higher-detector-precision/PROOF.md` at bc51100f; for both, `SOURCE_BINDINGS.json` has the sha256 its
  `SOURCE_BINDINGS_SHA256.txt` states (and, for #16, the PR body; #16's lists 85 files), and every file it lists has its
  listed sha256 at the head; b4 EXPECTED.json states, for orders 45 and 47, the PR body's table sha256s and the stated
  coordinates, residuals, monomials, digits and bits; b5 every CI copy listed above has exactly the stated bytes, its
  artifact the pinned digest, its run's metadata the listed head_sha and a success conclusion. With b2 along the chain
  #8 → #9 → #11 → #12 → #13 → #16, every earlier packet is unchanged at #16's head.
- **#9, #11, #12's b5 is extended** to the copies at #13's and #16's heads listed above (four each). Their other questions
  and every value are unchanged; the record of #8–#12 changes only by these copies, by the texts that name the scope, and
  by the decider's hash.
- **Not decided, added:** for #13 and #16, the 349/352 residuals and the compiled IR (unpublished), the gate and raw-row
  comparisons, the cubic's presence as affine aliases in the actual builder, the omission of the two unused preparation
  slots, the four conic transports, the diagonal maps; the valuation, CRT, completeness and pole arguments of the order-47
  reference; #16's projective-height transfer and varying-anchor equivalence beyond the displayed finite statements, its
  monotonicity step, the reevaluated private anchor gate and its conic witnesses; the application contracts; #17.

Verdict rule unchanged: a PR's scope is CERTIFIED when each of its questions is; the record's verdict is CERTIFIED when all
six scopes are and every control came out as pre-registered.

### Controls added (each must be refused by the same code)

- **CT7** #13's order-45 table offered as #16's order-45 claim, sha256 off (same variables and monomials; refused by the
  maximum); **CT8** #16's order-47 table offered as #13's order-47 claim, sha256 off (refused by the maximum).
- **CN4** on #13's order-45 table, −10^800·x_i²·x_j² added for a degree-2 variable: refused by N with an exact point.
- **CA7** #13's delta3 with 3·98 replaced by 2·98; **CA8** the a-recurrence applied from j = 1 (a1 := −1/5); **CA9** the
  j ≥ 14 base case moved to j = 13; **CA10** #16's endpoint test offered as passing at (2112, 45); **CA11** the order-47
  scalar test offered as passing at E = 2004; **CA12** log 50 < 3.9; **CA13** the ℚ(√2) operator bound at ρ = √2 offered
  as 2√2 + 1: each refused by A.
- **CB4** #16's order-47 CI copy checked against #13's stated order-47 sha256; **CB5** #13's file rule applied to the diff
  #12..#16; **CB6** one hex digit of ORIGIN.json's sha256 changed: each refused by B.
- **CR** extended: e-bounds (2 < e and 7 < e² accepted, e³ > 21 refused as unproved), ℚ(√2) signs (√2 − 1 > 0 and
  3/2 − √2 > 0 accepted, 7/5 − √2 > 0 refused), a residue-system step on a known false case refused.

### Predictions

T CERTIFIED for the four new tables (their byte counts were seen and equal EXPECTED.json's). N CERTIFIED. A CERTIFIED for
#13, its retained reference and #16, including the four stated failures holding as failures; the order-47 scalar margins
are expected to be tight. B CERTIFIED, including #13's verbatim retention and both source manifests. #9, #11, #12's extra
copies byte-identical. All controls refused. A few seconds on the Mac. The main finding is still a gap: the residuals of
every table, now six PRs deep, are unpublished, and #9 through #16's tables exist only in CI artifacts that expire on
2027-02-06.

## Amendment C (2026-11-08 local, 2026-11-09 UTC): after amendment B's first run, one control replaced

The first run with amendment B (8.6 s on the Mac, not "a few seconds") gave every question of all six pull requests
CERTIFIED: #13's and #16's T (all four tables), N, A (c1–c9, d1–d8, h1–h13, the four stated failures failing) and B (both
source manifests, #13's verbatim retention), and #8–#12 as before, with #9, #11 and #12's extra CI copies byte-identical.
31 of the 32 controls were refused. **CA8 was not.** The fault is in that control's design, not in the arithmetic or the
claim: replacing a1 = −2/5 by −1/5 only halves a13 (−54756974/6936596275 becomes −27378487/6936596275), and a13's reduced
denominator is odd, so the denominator, which is all d1 decides, does not move. CA8 could never be refused by d1. The
same fact settles the reading amendment B fixed: d1 holds whether the ratio is read from j ≥ 2 or from j ≥ 1, so its
verdict does not depend on that reading.

CA8 is withdrawn as a control and kept in the record as a reading check (d1 holds with a1 := −1/5, computed by the same
code). A new control takes its place: **CA14**, the displayed denominator with the factor 53 dropped (5²·7·17·29·37·41),
must be refused by d1. No question, reading, value or other control changes. The re-run must give the same verdicts,
with CA14 refused.
