# Cameron Freer's published rows (elliotglazer/diophantine-z-q #23): the sum of squares of each table — pre-registration, 2026-11-11

Written and committed, alone, BEFORE any code of ours expands a row or compares a coefficient. The operator's word
(2026-11-11): re-check the rows Cameron Freer published in pull request #23 with a program of our own, from the published
data and the statement of what a row is; record it; draft a reply; post nothing.

What had been looked at when this was written: the pull request's description, the packet's `README.md` and `FORMATS.md`
(read in full), the keys and first entries of `INDEX.json` and `MANIFEST.json`, the first lines of one rows file and one
table, the keys of one rows JSON and one diagonal certificate. No sum of squares, no count and no hash comparison had
been computed. `check_evidence.py` and `tools/*.py` were not downloaded, read or run, and stay that way; `CHECK_OUTPUT.txt`
(the output of his checker) is not used.

## What every artifact of this decision says first

"The theorem (ℤ is Diophantine in ℚ) is undecided here, and so is the conditional claim of each pull request of the
stack (that the rational zero projection of its quartic is ℤ, given the inherited arithmetic inputs). This decides one
finite identity per table: that the published decimal table is, coefficient by coefficient, the sum of the squares of
the published balanced integer rows, with the counts the packet states. That the rows are the compiled source system,
and every arithmetic argument, are not decided."

## Who, and in what role

Carlos Toledo (GitHub carlostoledo1891) with Claude agents (Anthropic, model id claude-fable-5-2, in Claude Code; one
agent session in a worktree of cert-machine). Tools: gh (read-only), Node.js (BigInt, zlib, crypto). A non-author of the
stack, no code shared with its author. A non-author check of published rows: it is not, and does not stand in for, the
`Protocol / independent agent audit` check of that repository's protocol, and it is not a review of #23 under it.

## The claim, at its pin

Pull request #23 of github.com/elliotglazer/diophantine-z-q, "Publish quadratic rows and durable tables for the quartic
stack (evidence above #20)", open, head `a4502814c0a1b8c6f2fb31b97ba9e6ea7b5322ea` (fork branch
`proposal/quartic-stack-public-evidence`), directory `research/stack-public-evidence/`. The repository has no licence:
nothing of it is copied into cert-machine. The bytes are fetched by commit and path into a folder outside the
repository (`tools/zq-freer-rows-fetch.js`), and every file read is recorded with its sha256, its size and its git blob
id, the blob id compared with the tree GitHub lists for that commit.

The packet states (README, "The 12 tables"), for each of twelve tables — pr08-389, pr09-385, pr11-385, pr12-383,
pr13-380, pr13-383-order47, pr16-380, pr16-383-order47, pr17-380, pr18-379, pr19-376, pr20-377 — the number of
variables, rows and monomials, the number of decimal digits of the largest coefficient, and that "the balanced integer
quadratic rows whose sum of squares is the table" are published as JSON and as plain text.

What a row is, from `FORMATS.md` (the only source of the definition; his checker's source is not read):

- the table: three header lines, then `<integer> TAB <monomial>` lines; a monomial is `1` or factors `xi` / `xi^e`
  (e in 2..4) joined by `*`, indices strictly increasing; no monomial repeated, no zero coefficient; the polynomial is
  the sum of the lines;
- the rows text: `#` comments; `V TAB k TAB id TAB name` for k = 0..n−1; `R TAB k TAB id TAB name` starts row k; each
  following `<integer> TAB <monomial>` line is a term of that row, of degree at most 2; "the table equals sum over rows
  k of (sum of the terms of row k)^2, exactly over the integers"; every row integral and primitive;
- the rows JSON (`diagonally-scaled-integer-quadratic-ir-v2`): `coordinates` with ids, `residuals` with `terms`
  `{monomial: [ids], coefficient: "rational string", sPower}`, every `sPower` 0; the table's `xk` is the coordinate
  with the k-th smallest id.

## The questions, and what fails each

For each table:

- **F, the files.** The table, the rows text, the rows JSON, the diagonal certificate and the balanced summary are the
  blobs the commit's tree lists; their stored sha256 and size are MANIFEST.json's, their decompressed sha256 and size
  INDEX.json's; the README's shortened hashes of the table and of the rows text are those of these bytes; the diagonal
  certificate's `newIrSha256` is the rows JSON's. For the eight tables of #8 to #16 the table's sha256 is the one
  `certs/zq-freer-2026-11-08.json` pinned (the tables T and N were decided on). A difference: REFUSED (the bytes are not
  the ones stated), naming the file.
- **T, the table and its counts.** The table parses under the format above; degree 4; every variable x0..x(n−1) occurs;
  content 1; the coefficient of x0^4 is 1; variables, monomials, largest-coefficient digits (and bits) are the README's
  row and INDEX.json's `publishedSummary`; where the summary gives a `cExponent`, the largest |coefficient| is
  28902·3^(4·cExponent). A difference: REFUTED, naming the number.
- **R, the rows.** The text parses under the format above: n `V` lines with increasing ids, the stated number of rows,
  every term of degree at most 2 with indices below n, no monomial repeated within a row, no zero coefficient, every row
  primitive. The JSON rows, compacted by increasing id, are the same rows in the same order, term for term (as maps from
  monomial to coefficient), every coefficient an integer and every `sPower` 0. A difference: REFUTED, naming the row.
- **S, the sum of squares.** Σ_k (row k)², expanded in exact integers (BigInt) from the text, has exactly the table's
  monomials with exactly the table's coefficients; the same expansion from the JSON rows, in exact rationals, likewise.
  A difference: REFUTED, naming the first monomial and both coefficients.

A table is CERTIFIED when F, T, R and S hold; the record's verdict is CERTIFIED when all twelve are and every control
below comes out as written. No floating point decides anything.

The packet-level numbers the pull request states are read and recorded, not decided beyond a count: 12 tables; the
packet's size ("5.9 MB") against the tree; "216 copied files, 132 bound, 84 not" as a count of INDEX.json's own flags.

## Controls (ours; each run on every table, in memory)

- **C1** one coefficient of one row raised by one (row ⌊r/2⌋, its first term): S must fail.
- **C2** one coefficient of the table raised by one (data line ⌊m/2⌋): S must fail.
- **C3** one row dropped (row ⌊r/2⌋): S must fail.
- **C4** two neighbouring rows of the text exchanged (the first pair from ⌊r/2⌋ on that differ): S must STILL hold (a
  sum does not see order), and R must fail (the text no longer matches the JSON row by row).
- **C5** one row of the text multiplied by −1 (row ⌊r/2⌋): S must still hold (a square does not see sign), and R must
  fail.
- **C6** one byte of the stored table changed: F must refuse.
- **C7** the stated number of variables raised by one: T must fail.

A control that does not come out this way makes the record REFUSED.

## Not decided

- The step from the raw representation to the compiled one (the gate identities, `reduction-certificate.json`), which
  the pull request itself says is not replayed.
- The diagonal maps, the factored-pole transports, the compiled-to-next comparisons and the exact-rewrite certificates
  of #13 and #18 (his checker's items 5 to 8): not replayed here.
- The bindings of the packet's files to hashes published at other commits (`75e76303`, `452c8620`).
- Whether the rows are a faithful encoding of each PROOF.md; every positivity, domain, zero-branch, valuation,
  completeness, height or prime-selection argument; the eleven inherited inputs.
- Anything in #30 (the 214-variable family opened on 2026-11-11, when #8 to #20 were closed "as archived research,
  with their branches retained", #23 staying open), and the Version 14 to 16 material.
- The conditional claim of any pull request, and the theorem.

## Amendment A (2026-11-11, written with the recorder and before its first run)

"The packet is 5.9 MB" is read as the manifest's total: every file of the directory but `MANIFEST.json` itself
(`totalBytes` 5,945,487; the tree's listing gives the same sum). With the manifest the directory holds 5,985,911 bytes,
which would print as 6.0. A reading of his sentence, not a result.

## The run (2026-11-11)

First run of `tools/zq-freer-rows.js`, no rule changed after it: CERTIFIED, twelve of twelve tables on F, T, R and S,
312,874 coefficients compared, the seven controls as written on every table; `certs/zq-freer-rows-2026-11-11.json`.
