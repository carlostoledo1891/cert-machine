# Twelve blocks, the second run: exact values and the unit scale — pre-registration, 2026-11-19

Written and committed, with the pinned inputs and nothing else, BEFORE any file of this repository's judge for it exists.
The operator's words (2026-11-19, in the control-room chat): "Proceed", "Yes", "You decide"; then, asked: a pack for the
OEIS that he sends himself, a second report page, "Push when green", a pack for an outside reader.

## What every artifact of this decision says first

"Two kinds of statement are decided here, and they are kept apart. UNCONDITIONAL: exact values of V(n), the least number
of monochromatic 3-term progressions over the 2-colourings of 1..n, each by a certificate a short checker verifies in
exact arithmetic and a colouring; they use nothing but the definition. NOT DECIDED: the two models' theorems about every
large n (the exact formula from n = 15,756, every multiple of 548 beyond the first): each was read once, by the other
model, and rests on the unrefereed October result."

## What this is, honestly

This pre-registration comes AFTER the run. On 2026-11-19, 04:31 to 05:45 UTC, a GPT chat and a Claude chat (fresh; the
operator's one message; version 2 of the multitrack instrument, in which the tracks only talk, propose and review and the
control room registers their claims from their own words) worked a goal built from a reader's review of the first run's
report (`corpus/twelve-blocks-2/review.md`, `run/GOAL.md`). The run folder is pinned file by file in
`corpus/twelve-blocks-2/MANIFEST.json` (sha256 `c30263c75ec3326f7555741be36fee12c768b74152cec7dc7f4b58027cb5f08b`).

**The checkers already exist and already gave these verdicts in the run.** The control room wrote them during the run,
each from a format page or a message of a track and never from a track's program: `cubepsd` (the certificate format
`cube-psd-1`, from `run/claude/CERT-FORMAT-V.md` and its two addenda), `vtable` (a table of rows), and three tests
(`allupper_test.py`, `jumps_test.py`, `rootlimit_test.py`); `ap3`, the counter, is older. Everything below marked U was
decided once in the run (the verdicts are in `run/control/`); those are prior observations. What this file fixes is the
statements, the domains and the controls for the record this repository keeps, decided again from the pinned copies.

**A fault of the control room in the run, kept:** its test of ALLUPPER was first posted with numbers written before the
script's last run (3,267 lengths and 21 misses; the script says 3,283 and 5); corrected in the conversation (k33).
No planted false claim was posted in this run: the controls below are the only planted errors.

## Who decides, and what the judge's author has read

Carlos Toledo with Claude Fable 5.2 (claude-fable-5-2) in Claude Code, as the control room: the same session that
registered the claims. Read by it: the conversation, the format page, `gpt/Localisation.md` sections 7, 8 and 10 and the
line on the one-cube limit, the data files named below. NOT opened: any program of either track. E1 below is decided by a
separate program written by an agent of the control room under the same rule (it may open `gpt/unit_cells.py` only to
read how a data field is interpreted, and must say so).

## Definitions

As in `notes/twelve-blocks-preregistration-2026-11-19.md`: M(s), V(n), f(n) = 117n²/2192 − n/2, B_m, C_n (edges
⌊nB_j/548 + ½⌋). A(n) = (117n² + c_r)/2192 − n/2 with r = n mod 1096 and c_r from the first run's table
(`corpus/twelve-blocks/run/gpt/optimum-residues.json`). The certificate format `cube-psd-1`: cubes of partial colourings,
each with one integer matrix that must be positive semidefinite and one strict integer inequality; it rests on
4M(x) = T + Σ_{i<j} w(i,j) x_i x_j, w(i,j) the number of triples through both sites.

## What is decided

**Unconditional: only the definition of M is used.**
- **U0, the identity.** 4M(x) = T + Σ w x_i x_j with the checker's own w, against triples counted one by one: every
  colouring for n ≤ 14; 2,000 seeded random ones at each n = 15..60.
- **U1, the table.** For every n = 1..94: the row's certificate (`certificates/V{n}-ge-{V}.json.xz`) is in the format for
  exactly that n and v = V, with no sub-cube, and passes the checker; the row's colouring has exactly V monochromatic
  triples (two counting programs). Hence V(n) = V for n = 1..94. Observed, not part of the verdict: equality with OEIS
  A121385 for n ≤ 45 and with A(n) for every n ≤ 94.
- **U2.** `sdp548-root.json.xz`, one all-free cube, passes the checker for n = 548, v = 15,385: V(548) ≥ 15,385.
- **U3.** `W-unit-final-ge-15756.json.xz` passes the checker for v = 15,756 on a sub-cube, and that sub-cube is B_1 (built
  here from the block lengths) with exactly these 48 sites free: b−1..b+2 for the eleven boundaries b, and 31, 32, 517,
  518. M(B_1) = 15,756.
- **U4.** `W-unit-count.json.xz` passes the checker for v = 15,757 on the same sub-cube with 51 listed exceptions; each
  exception has exactly 15,756; as flip sets against B_1 they are the 51 minimisers of the 22-site census in
  `certs/twelve-blocks.json` (D5). Hence exactly 51 colourings of that cube attain 15,756.
- **U5.** The rational point `run/gpt/sdp548-primal.json`: 548 integer vectors of dimension five over the scale 10⁷, every
  squared norm ≤ 1, and (T + Σ w X_ij)/4 = 3076878488712142201/200000000000000 < 15,385. With U2: one all-free cube proves
  15,385 at n = 548 and cannot prove 15,386. A statement about the method, not about V.
- **U6.** For every n = 1..3288 some colouring has exactly A(n): the table row's mask on C_n (two flips on one site
  cancel) at all lengths but five, n = 23, 24, 25, 31, 33, where the track's replacement colourings
  (`run/gpt/upper-short.json`) are counted. Hence V(n) ≤ A(n) for n ≤ 3288.

**Finite tests of the conditional theorems (they decide the tests, not the theorems).**
- **T1, the two maps.** At 40 seeded lengths from 20,700 to 23,000, on C_n, on the table's witness and on a seeded random
  colouring inside the windows: moving every colour change near edge i by 2B_i changes M by exactly 117n + 63,568, and
  sending a colour change t near edge i to 2qB_i − t keeps M − f. 120 of 120 each.
- **T2.** The table's witness at the least n ≥ 20,700 of each of the 1,096 residue classes has exactly A(n).

**The exclusion at the unit scale, by a separate judge (it enters the record only if that judge certifies it).**
- **E1.** Every colouring s of 1..548 with M(s) ≤ 15,756, in its colour orientation nearer to B_1, agrees with B_1
  outside the 48 sites of U3. To be established by finite exact computation on the 548-site model, following
  `gpt/Localisation.md` section 10: no continuum theorem and no paper lemma; the October certificate files and
  `gpt/unit-tangents.json` enter as numbers whose identities are verified.
- **If E1, U3 and U4 are all CERTIFIED:** V(548) = 15,756, with exactly 102 labelled minimisers (the 51 of U4 and their
  colour exchanges; a colouring and its exchange have the same M, and a minimiser is nearer to one of ±B_1, to both only
  if it differs from each in exactly 274 sites, which the 48-site cube excludes). This would not depend on the October
  theorem or its paper lemmas; it would still use the October multipliers as numbers.

## Controls: each must be refused, or the judge is not testing the result

- K0 (U0): the identity with w missing its parity term.
- K1 (U1): a row's value raised by one against its own certificate; a colouring with one site flipped; a certificate
  with one leaf dropped; a certificate given for the wrong n.
- K2 (U2): the same file claiming 15,386.
- K3 (U3): the sub-cube with one more site freed (the cubes no longer fill it); the claim raised to 15,757 without
  exceptions.
- K4 (U4): one exception removed; one exception replaced by a colouring of count 15,757.
- K5 (U5): one vector doubled (norm above one).
- K6 (U6): the five replacements withheld (five lengths must miss).
- K7 (T1): the shift 2B_i + 1 in place of 2B_i.
- Cross-route: 40 seeded leaves of the table's certificates decided by both exact routes of the checker (fractions and
  the Gram remainder), which must agree; one tampered leaf must be refused by both.
- E1 has its own six controls (in its judge's report): the constant 947, a perturbed tangent vector, a dropped
  operation, zero charging weights on the exterior, a doubled bathtub constant, a changed baseline site.
Every control the judge fails to refuse is reported as MISSED, by name.

## What is NOT decided here, by name

Every theorem about infinitely many n: LOCAL75, the scaled result at m ≥ 2 (which also needs the first run's window
classification), JUMPS as a bijection of minimisers, the formula A(n) from 15,756 or from 20,700, ALLUPPER beyond
n = 3288. The lower bound V(n) ≥ A(n) for 95 ≤ n ≤ 15,755 off the multiples of 548, which neither model claims. That the
certificates were found correctly matters to nobody: a certificate is checked, not trusted.

## Predictions

U0–U6, T1, T2 CERTIFIED and every control refused (all were seen in the run). E1: unknown at the time of writing; the
two models' readings say it holds; its judge is not yet finished.

## Record and replay

`python3 instruments/twelve-blocks/exact/judge.py --write` writes `certs/twelve-blocks-exact.json`; `--check` re-hashes the
pins and decides the quick statements again. Changes after this commit are amendments below, dated, each committed before
the code it changes.

## Amendment A1, 2026-11-19 (inputs only; committed before any file of the judge is committed and before any record exists)

One proposal came after the Claude track's closing statement and after the first snapshot: V(95) = 435, by a
certificate of 3,146 cubes and the table's colouring (c19). The control room registered it in the run and its checker
decided it there (TABLE95, CERTIFIED). The table and U1 therefore run to n = 95: `run/claude/V-table.json` has 95 rows,
`certificates/V95-ge-435.json.xz` is added, the colourings file is `run/claude/upper-1-95.json`, and the conversation,
the claim cards, the verdicts and the final ledger are the final ones. The run folder is pinned again:
`corpus/twelve-blocks-2/MANIFEST.json` is now sha256 `475551309b38ad92c5ad7551357181985254d1540a4bfb2cb5a8cb869a5d94e0`
(the first is named inside it). The open range in "What is NOT decided" starts at 96, not 95. Nothing else changes.
