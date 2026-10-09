# The method paper, made bulletproof — the plan (2026-10-09)

Object: `paper/tex/cert-machine-method.tex` (draft v0.1, 16 pp, live at /paper/cert-machine-method.pdf)
and the cert-machine capabilities it rests on; P1 (`paper/tex/p1-return-levels.tex`, v0.2) only where
the two touch. Both are to be published in Elsevier journals with the UFSC reviewing group after their
academic review; the group's names stay out of this repository until they agree to be named.

Inputs, all 2026-10-09: the outside assessment the operator received (three milestones: a correct
argument, a correct implementation, a trustworthy system; the draft has the first as a framework,
evidence toward the second, and an assurance system for the third that its own §8 shows incomplete;
advice: close the gap, do not widen the catalogue); an adversarial read of the certifier code (two
probes run); a prior-art and venue sweep (95 lookups); three measurements made in the session; two
reviews of the plan, one constructive and one adversarial, each in two rounds. Nothing here is built.
Every finding marked VERIFIED was checked against the source or by execution in the session.

## 0. The one-paragraph version

The paper's headline sentence, "a REFUTED here is proved", is not true today for the 54.6 million
closed forms the control page counts as refuted by a double comparison, and the engine's REJECT mixes
proved-below with undecided. Fix those first and publish the correction. Then re-cut the paper around
two falsifiable objects: a published certificate format whose exact-class certificates a small
standard-library checker verifies without the engine (counted by row), and the pre-registered corpus of
100 machine claims decided beside the claimants' own checkers (counted by row). Keep the three-valued
grammar as the frame, state the arithmetic's domain and trust base, make every independence sentence a
count, test the kernel against Arb and by mutation, and move the system description to a six-page
SoftwareX companion. About 26 sessions; v0.3 to the group by 2026-11-21.

## 1. What the code read found beyond §8 and DEBT.md

| # | finding | where | status |
|---|---|---|---|
| F1 | The closed-form hunt counts a FLOAT comparison as a refutation. Exact for p/q (monotone rounding); not for sqrt(p/q), (p/q)·c with c a midpoint, c^(p/q) by Math.pow, exp(p/q) by Math.exp. Published: `index.html` "closed forms refuted 54,628,296 = 54,628,275 refuted in double + 21 exactly"; the OEIS corpus path (`families/oeis-closedform.js:109-134`) is the same mechanism for 54.6 M of them. The control page says "in double"; `README.md:221`, `CLAUDE.md:13`, `HANDOFF.md:9` say "a REFUTED here is proved" without the qualifier. `tools/test-engine.js:60-64` records that this mechanism once refuted √2 and was repaired at the enclosure, not at the comparison. | `machine/engine.js` relations(); `tools/build-control.js:277-320` | VERIFIED; the mechanism is wrong, no false row exhibited |
| F2 | The engine's grammar is HIT / REJECT / REFUSED; REJECT means "did not clear the bar" and includes the STRADDLE; any unknown string lands in rejects; `strassen-audit` returns REJECT both for "does not multiply matrices" and for "certified correct, not fast"; `oeis-closedform`'s 14,593 rejects mean "not a discovery". The paper's three verdicts are sound; the engine does not implement them. | `machine/engine.js:58-60`; `families/cosine.js:48`; `families/newman.js:41`; `families/strassen-audit.js:146-160` | VERIFIED |
| M3 | Newman HIT compares the candidate's LOWER end with the champion's LOWER end; "exceeds" needs candidate.lo > champion.hi; the statement is universal, the envelope a finite list with box maxima. The four hits have gaps 0.137, 0.361, 0.026, 0.019 against widths ~5e-16: no row flips; the predicate and the sentence do. | `families/newman.js:41`; `instruments/trigmin/envelope.js` | VERIFIED |
| M1 | `pow` uses 32-bit `e & 1`, `e >>= 1`: pow([1,2], 2^31) = [1,1]. No caller passes such an exponent. | `instruments/interval/interval.js:94-99` | VERIFIED by probe |
| M2 | No NaN or infinity semantics (mul([0,∞],[0,1]) = NaN; div by NaN not refused; mig(NaN) = 0); the batteries skip non-finite results; the rounding proposition has no domain. | `interval.js:48-56`; `tests/test-eqcert.js:35` | read |
| M5 | The "second implementations" are same-author, same-specification N-version checks; Decidível's is a point value checked for containment. "Share no code" is true; "independent" is not. The one outside re-derivation (λ(4)) is recorded with `hash: null` and no pinned commit. The register's `mechanism` field is null on 131 of 132 rows, so no row records its class (exact / interval). | `apps/*/reference.py`; `corpus/external-reruns.json`; `certs/claims-ledger.json` | VERIFIED |
| M7 M8 | The platform-cosine pad helper is used by SIX live files, not "four instruments outside this paper's scope": `labs/mfg/box.js`, `labs/mfg2p/box2p.js`, `instruments/critcount`, `instruments/transit`, `apps/glide-band/kernel.js`, `reports/mfg-certify.js` — and labs/mfg IS the radii-polynomial sibling certifier the paper names in §4.1, with Math.pow in its Z2. The pad's contract (an argument carrying ≤ 2 ulp relative error) is unwritten. | `interval.js:112-122`; `labs/mfg/box.js:387-392, 447` | VERIFIED (callers) |
| M9 | The Certificate class accepts falsifier [''] and evidence {k: undefined}; toJSON emits a PROVED certificate with evidence {}; ten instruments build through it. | `instruments/interval/certificate.js:32-37, 64-65, 108-114` | VERIFIED by execution |
| m | Tails in round-to-nearest under one nextUp (safe by 20 orders); containsPhase cancellation for k < 0; radii's linear branch accepts a NEGATIVE Z2; CONSTANTS pads composite float expressions ±1 ulp without proof (inside in fact; `gamma_e` is e/π); `test-interval.js` checks nextUp ≥ x, not the immediate neighbour (the primitive IS correct on 2·10^5 doubles and every edge case); two trig tests are tautologies; "the screen may only prune" is tested on one family, 60 samples; the atlas record stores c:1 and downstream enclosures, the 3-hourly ledger the box, neither the Krawczyk data nor which Hessian test ('box' / 'point') certified the fit. | `transcendental.js`; `radii.js:66-69`; `engine.js:83-92`; `hseva/atlas.js` | read; nextUp probed |

Strong and surviving: nextUp/nextDown on every edge case; `rational.js` exact; trigmin's
`certify-min.js` (exact Sturm, interval Newton re-verified by an exact sign change, exact V. Markov
bound, outwardness verified exactly) and `minpoly.js`; `radii.js`'s two-condition fix with its R8
witness; the sin/cos box rewrite with its D3 battery; `delta3/CERT-FORMAT.md` + `verify.js` and
`tools/verify_keller.py` as formats a stranger can run; the exp/log series and the π, ln 2 constants.

Measured in the session (scratchpad only; A3 commits it): the transcendental module against Arb
(python-flint 0.9.0, present in `instruments/erdos1/.venv`) at 300 bits on 31,700 operands — random
over 60 binades, subnormals, |x| to 2^50, 800 points at and beside multiples of π/2, the specials:
0 containment failures; 24 undetermined rows were artefacts of the oracle's own precision within
10^-90 of 1 (a battery raises the oracle's precision adaptively). sin/cos widths reach 1.67 at
|x| ≈ 10^15: sound, useless there, a domain to state.

Prior art the paper must now position against (the sweep; every item carries a URL in the session
record): Moore–Kearfott–Cloud; IEEE 1788.1-2017 (active; 1788-2015 inactivated 2026-03-26) — we
implement the 1788.1 subset informally, no decorations; Rump 2010 and INTLAB; Dekker 1971 and Ogita–
Rump–Oishi 2005 with the constant used; Arb, MPFI, kv, CAPD; Tucker 2002 and Immler 2018 as the gold
standard of re-certification without shared code, one rung above us; Hales 2017 and Solovyev–Hales
2013 (certificate checking, 3000× slower formally); Krawczyk 1969 and Neumaier 1990 §5; Shewchuk 1997;
Peyrl–Parrilo 2008 and Magron–Safey El Din; the de Bruijn criterion, HOL Light's kernel, Coq-Interval,
Isabelle approximation, girving/interval and LeanCert; CORE-MATH, CR-libm, RLIBM and the Gladman–
Zimmermann accuracy tables. THE V8 FACTS, version-dependent and material: ECMA-262 leaves Math.*
implementation-approximated (TC39 PR #903 for a 1-ulp bound closed unmerged); Node 24 ships V8's
fdlibm port (≤ 1 ulp, not correctly rounded); V8 main moved Math.{sin,cos,exp,log,...} to LLVM-libc in
May 2026 and removed the glibc path in July 2026 (glibc's Math.sin had reached 1063 ulp). Neighbours:
the Ramanujan Machine in its own words ("conjecture formulas without providing proofs"; PSLQ is not a
proof; 38 proved by Yamamoto 2024; one PCF formally proved Jan 2026), FunSearch, AlphaEvolve and the
repository of problems (public verification code per problem), AlphaProof, the Erdős wave and
formal-conjectures, BrokenMath and ProofBench as the evaluation standard for proofs, Zheng 2026 and
Zhang 2026 (interval certificates with AI declarations; neither certifies another party's output). No
published independent exact re-certification of the 593 or 604 kissing configurations was found.

## 2. The thesis the revised paper defends (counted sentences)

A claim a machine produced is read as a predicate over a declared box, by a recorded reading, and
receives one of three verdicts with the object that justifies it.
(i) The verdicts are sound under the inclusion property; the arithmetic's domain (finite, non-NaN
doubles; integer exponents below 2^31; division by intervals excluding zero; stated argument ranges for
sin and cos) is stated, and a battery shows each primitive refuses at every tested boundary case,
listed.
(ii) Every CERTIFIED or REFUTED verdict in the EXACT classes — N of the register's M rows, listed by
id from a recorded `class` field, with the rows exact but beyond the checker's budget (the 14 kissing
rows, 2·10^11 pairs) listed apart — is carried by a certificate in one published format that a checker
of L lines, Python standard library only, verifies without the engine; the checker rejects a corpus of
hand-built false certificates and every result-bearing mutant generated by rule, counted. The interval
classes publish their enclosures and the proposer's choices, are differentially tested against Arb on
O operands with 0 containment failures and mutation-tested with verdict-flip counts; they are not
independently checked.
(iii) The build refuses on any red; the register's records are re-run from the same bytes on a second
platform with the run id recorded.
(iv) A corpus of 100 machine claims pre-registered on 2026-10-02 is decided; the claimants' own public
checkers, Arb, and (for rows with no public checker) the claimant's own printed formula evaluated in
float64 and labelled reconstructed, specified by a dated amendment after 46 rows had been decided and
before any baseline was run, are run beside it; the primary metric is reported over decided rows AND
over all 100 with undecided counted as REFUSED (no decider by submission), the undecided ids
enumerated.
(v) One outside party has re-derived one record (λ(4), at a pinned commit) with its own code; the
co-authors replicated R records blind (R may be 0 at submission; what they can show is stated); A
further asks were posted on named dates and K received by submission; same-author second
implementations are counted separately.
Interval arithmetic, Krawczyk, filters and SOS are cited, not claimed. Every number above is a macro
written by a generator from a record or from the file list the generator names.

## 3. Workstreams — CORE is v1.0; EXT is v1.1

### Phase 0 — HEADLINE TRUTH (first; nothing goes to the co-authors before it) — CORE

- P0.1 Closed forms refuted only on DISJOINTNESS of an interval candidate: sqrt(p/q) and (a+b√d)/c
  by rational brackets, (p/q)·C with C's enclosure, exp(p/q) by the series module, c^(p/q) refused
  unless the exponent is an integer; both paths (`engine.js` relations() and `oeis-closedform.js`).
  Re-decide every historical "refuted (double)" row (a background run); publish how many flip to
  CANDIDATE or REFUSED.
- P0.2 REJECT split by ONE predicate, `decide(enclosure, bar, direction) → CERTIFIED | REFUTED |
  REFUSED`, written once (A1) and called by every family; a `scope` flag beside the verdict carries
  "certified but not interesting" (strassen's not-fast, oeis's not-a-discovery) so the split mints no
  fourth verdict; an unknown string is REFUSED and counted; the control page's one "rejects" column
  becomes refuted / refused / out-of-scope.
- P0.3 Newman: HIT iff candidate.lo > champion.hi; the statement reworded to "exceeds the recorded
  envelope of (n−1)-term sets", the envelope's rows typed (proved value / box maximum); re-run.
- P0.4 The loaded traps: `pow` refuses exponents ≥ 2^31; well-formedness (finite, lo ≤ hi, no NaN)
  checked in mul, div, sqr and at construction, NaN refuses by throw; radii refuses Z2 < 0; the
  Certificate constructor rejects empty strings and undefined values and toJSON cannot emit what the
  constructor refuses; CONSTANTS from the series module (phi from sqrt5's enclosure; gamma_e renamed
  or removed).
- P0.5 THE ERRATUM TABLE on the control page and in §8: before/after for the closed-form counts, the
  per-family REJECT split, the Newman statement; the "before" numbers pinned to the commit sha and the
  sha256 of the `index.html` bytes that carried them; the Zenodo version that carries the old
  description cited (Zenodo re-versions, never edits); the √2 false-refutation history of
  `tools/test-engine.js:60-64` stated in the erratum's own text. The README, CLAUDE.md and HANDOFF
  sentence changed to what is then true. `make engine` + `make control` republish.
- P0.6 FREEZE `apps/abatimento` until the CPSI closes (2026-10-19 17:00): Phase 0 touches
  `machine/engine.js` and `families/` only; A1's app imports wait.

### A — The trusted kernel — CORE unless marked

- A1 ONE verdict module `instruments/verdict.js`: the words, the compositions, `decide()`, the
  flip-threshold bisection (today three copies); imported by every instrument, family and app; a grep
  gate refuses a second declaration. Apps' PROVADO/REFUTADO are display words mapped from it (after
  10-19). A `class` field (exact / interval / formal / data) written into every register row by the
  ledger builder, backfilled for the 132.
- A2 RETIRE the platform-cosine pad in `labs/mfg` (the certifier the paper names) for the series
  sin/cos and re-run its records behind `reports/mfg-certify`; replace Math.pow in its Z2 by interval
  pow. The other five callers: retired too if Phase 1 has room, otherwise given the written contract
  (an interval argument, not a thin double) and declared outside the paper's scope by name. Tails
  rounded outward; taylor2 with enclosed cell midpoints and widths; `special.js` constants derived.
  The paper's sentence corrected to six files including the §4.1 certifier.
- A3 DIFFERENTIAL TESTING as a committed battery (in `make test` and the control build): every
  interval export and every transcendental against Arb (python-flint pinned in a venv) with adaptive
  oracle precision; operand classes: random over all binades, subnormals, power-of-two boundaries, |x|
  near 2^53, near multiples of π/2, the hard-to-round cases of the Gladman–Zimmermann tables, WIDE
  interval operands, pow at 2^31 ± 1 after P0.4, and the Sum2 + Ogita–Rump–Oishi path against exact
  rationals on condition-10^30 data. Reported: operands by class, disjoint = 0, width ratio to Arb by
  binade, the sin/cos argument-reduction cliff as the stated useful domain.
- A4 The rounding battery made to show what is true: nextUp is the immediate neighbour by bit pattern
  at ±0, the subnormal boundary, MAX_VALUE, ±∞; the tautological trig tests removed.
- A5 The trust base pinned and named: `.node-version`, `.python-version`, `process.versions.v8`
  written into every record; the paper's trust-base paragraph (IEEE-754 round-to-nearest for + − × ÷ √
  in V8, V8's BigInt, Python's integers and fractions for the checker, the OS's SHA-256, one operator)
  with the V8 table; no Math.* in a verdict.

### B — ONE certificate format and a checker someone else can run

- B1 (CORE) The schema, versioned and hashed. Rules: the certificate stores the PROPOSER'S CHOICES
  (box, x̂, Y, cover, data pin, Sturm counts, Gram matrix), never the results — the checker
  recomputes; it carries a `reading` object (the quoted sentence, its location in the pinned source,
  the chosen box and predicate, reader, date) for every row decided after the schema lands (earlier
  rows backfilled where the record allows, and said); and MUTANTS ARE SPLIT IN TWO: result-bearing
  mutants generated by rule (the claimed bound tightened past the enclosure, the witness perturbed, an
  identity's coefficient or weight changed, an enclosure endpoint moved past the bar), whose rejection
  is guaranteed by the mathematics and is required; and proposer-choice perturbations (x̂, Y, a box
  endpoint, a Sturm interval), recorded as SLACK and never required to be rejected. The checker's own
  soundness is tested against a corpus of hand-built false certificates (negative SOS weight, non-PSD
  Gram, wrong tensor, point outside its polygon) and by C4-style mutation of `check.py` itself.
  `delta3/CERT-FORMAT.md` is the precedent; the generic Certificate class becomes this.
- B2 (CORE) Checker v1, `checker/check.py`, the EXACT classes only: SOS identities, multilinear
  corners, sign predicates, polynomial inequalities at rational points (kissing configurations,
  packings, autocorrelation, Heilbronn — most register rows and the EinsteinArena pool), tensor
  decompositions (strassen, mc100), δ3-style (`psd.js`: rational LDLᵀ with a NOT-PSD witness), and the
  cosine-minimum certificate of `trigmin/certify-min.js` + `minpoly.js` (rationals throughout; the
  Newman min-modulus certificate of `trigmin/newman.js` runs on double intervals and is an interval
  class). Python integers and fractions, no transcendental function, no rounding; its soundness
  proposition is one paragraph; its line count is measured and printed, not promised; it prints the
  sha256 of what it checked. Rows exact but beyond its budget are listed by id.
- B3 (CORE) The exact-class certifiers emit the format. B4 (CORE) counts into the paper: certificates
  emitted, checked, false certificates and result-bearing mutants rejected, slack recorded, by class;
  the register rows covered, listed by id.
- B5 (EXT) Checker v2 for the interval classes: rational-interval arithmetic; decimal exp/ln (CPython
  documents them correctly rounded via libmpdec) cross-checked against a Fraction series with a tail,
  refusing on disagreement; sin/cos with a rational π enclosure and a refused domain above 2^20;
  forward-mode interval AD for the Krawczyk Jacobian; the four families whose score needs exp/log/pow
  first (normal, lognormal, Weibull, Gumbel); the engine emits only when the margin is ≥ 2×; run on a
  pre-registered stratified sample of the atlas with its seed. Until then the paper says the interval
  classes are engine-checked, differentially tested (A3) and mutation-tested (C4), and names the exempt
  families.

### C — The assurance system — CORE

- C1 `make test` exits non-zero on any FAIL; the control build refuses on a red battery; the cloud
  workflows and the watchdog checked first for reliance on the zero exit.
- C2 The cheap debts: GatesN from the builder's list; drift's local side; build-site's prune; hseva's
  four positive assertions to ok(); RERUN.md from a timed run; stable-json for the three churning
  records; the λ(4) audit's commit sha pinned in `corpus/external-reruns.json`.
- C3 A RED-CONTROL CENSUS tool counting every red control from the batteries' output — what it
  forges, what must refuse it; the paper quotes the census.
- C4 MUTATION TESTING on `interval.js`, `transcendental.js`, `radii.js` and `verdict.js`, mutants
  restricted to the soundness class (dropped outward step, flipped comparison, dropped tail, shrunk
  pad, swapped min/max, skipped branch check); for every surviving mutant a PRE-DRAWN sample of the
  register's certifications is re-run and verdict flips counted; the headline is "mutants that would
  have changed a published verdict and were not caught", equivalent mutants named. Precedent:
  `certs/delta3-mutations.json`.
- C5 A SECOND PLATFORM: a GitHub Actions workflow runs the rerun kit on ubuntu-latest at every push
  and compares the register's rows — stated as "the same bytes re-run on a second platform, run id
  recorded"; ubuntu runs the same fdlibm port, so Math.* is not independently exercised there (A3 is
  the second arithmetic).
- C6 The refusal ledger by kind, read from records, never summed.
- C7 "SCREENS MAY ONLY PRUNE" as a seeded battery over all eleven families: planted answers through
  every stage; leaked (must be 0) and the false-prune fraction reported (strassen prunes on v === 0, so
  non-dyadic rational factorisations are pruned: sound, and the hit count is a lower bound).

### D — Replication and outside re-derivation

- D1 (CORE) The five asks: three posted, two the operator's; replies land in
  `corpus/external-reruns.json` with pinned commits; the paper says "A posted on <dates>, K received by
  submission".
- D2 (CORE packet; the count is what lands) CO-AUTHOR REPLICATION, BLIND: the group receives R records
  as the claim printed and the pinned data, no code of ours — an atlas fit (asking for their bound or
  likelihood value, not only a scipy point, because "their point inside our box" cannot detect a
  too-wide box or a wrong REFUTED, and the paper says what the test can show), a contour count, and one
  control drawn from the UNDECIDED 54 of the corpus, not from the register's public refutations — and
  produces their numbers BEFORE seeing ours; recorded under `kind: co-author-replication`, counted
  apart from outside. v1.0 ships at R = 0 if their clock runs out. The R5 ask already drafted is the
  first step; it goes out in week one on the operator's word.
- D3 (EXT) A Lean 4 file per exact certificate (small identities only; norm_num on a large Gram
  matrix will not terminate; native_decide adds an axiom). One sentence in §8: "the exact certificates
  are in a form a proof assistant could consume; none has been." The 2026-10-02 decision stands.
- D4 (CORE, inside A3/E2) Arb as the incumbent cross-check on the interval classes and the numerical
  benchmark rows: the two-way refusal table.

### E — The benchmark — CORE

- E1 Phase 4b under a DATED AMENDMENT to `notes/machine-claims-100-preregistration-2026-10-02.md`:
  the remaining 54 rows decided as widely as the clock allows (the benchmark is half the thesis),
  pools with an existing decider first, then new deciders by the note's order of work; the amendment
  lists the 46 decided rows, keeps the pre-registered primary metric (the "not whole" share beside the
  register's) and FIXES THE DENOMINATOR: the metric reported over decided rows AND over all 100 with
  undecided counted as REFUSED (no decider by submission), the undecided ids enumerated with that
  reason — so "k of 100 hold" cannot be read as "k of the 70 we could do".
- E2 BASELINES in the same amendment, specified before any baseline runs on any row: (a) the
  claimants' own public checkers as published, with their published tolerance (the EinsteinArena scorer
  IS a float checker with a minImprovement tolerance; FunSearch and AlphaEvolve evaluators are float);
  (b) for rows whose claimant published no checker (station-v2, optconst, erdos-513, part of
  alphaevolve-repo), the claimant's own printed formula evaluated in float64, labelled RECONSTRUCTED,
  and the count of such rows reported; (c) Arb on numerical rows; (d) naive exact brute force where it
  terminates, labelled "our own, cost only". Reported: the verdict matrix claimant-checker × exact, the
  NEEDS DATA share per pool, time-to-decide per row, the rows a tolerance accepts and exact arithmetic
  refutes or repairs (the accepted-but-wrong band 2·tol − w instantiated), and the pre-registered
  expectation written down: most rows hold, and "no disagreement" is a result. Selection disclosed: the
  "not already in the register" rule picks the smallest remaining tensors; the uncapped pool's platform
  pre-verifies every object.
- E3 The kernel on the field's hard cases (Rump's polynomial, the Muller recurrence, Ogita–Rump–Oishi
  dot products at condition 10^30, Kahan's examples) and the 175,320-term naive interval sum versus
  Sum2 width as a measured macro (the paper says "a thousand times", unmeasured).
- E4 DEPENDENCY / OVERESTIMATION, three macros: the share of atlas fits certified by the box
  Sylvester test versus the point fallback — `hseva/atlas.js` does not store `secondOrder.how`, so
  the field is added and the atlas re-run as a timed background job early in Phase 2, or the macro is
  defined over a pre-registered sample of cells re-fitted with the field; the Krawczyk inflation-round
  histogram; the width ratio to Arb by binade.

### F — The paper, v0.1 → v0.3 → v1.0 — CORE

- F1 Re-cut: §1 the problem and the two contributions; §2 the grammar as definitions (one page) with
  the reading protocol and the definition of a machine-generated claim (a pinned object plus a recorded
  reading; a disputed reading is re-decided as a new row, never edited); §3 the arithmetic with its
  domain, trust base and the V8 table; §4 the certifiers (compressed); §5 THE CERTIFICATE FORMAT AND
  CHECKER with its counts; §6 THE BENCHMARK with baselines and both denominators; §7 assurance,
  measured (A3, C3, C4, C5, D1, D2 as counted sentences); §8 limits in two tables (closed, with the
  test that holds each; open, named) plus the erratum table; §9 a WORKED EXAMPLE, one page: a register
  row with a tolerance witness from the printed sentence to the reading, the certificate JSON,
  `check.py`'s output and a rejected mutant; a COST table (seconds per decision; the budget at which
  each certifier refuses: 2^n corners, Sturm degree, bisection depth). If the group picks JCAM, §1
  leads with the arithmetic question (how a fixed-precision interval system with refusal decides
  another party's number) and the format and benchmark are its evidence.
- F2 Propositions: the rounding proposition with every IEEE-754 case and its domain; checker-v1
  soundness (Python integers are exact; the identity implies the claim); the Sum2 + Ogita–Rump–Oishi
  bound stated with its constant; the point-Sylvester inertia lemma (nonsingular over a connected set
  preserves inertia) with proof and citation; flip-threshold monotonicity only where a certificate
  field records how it was verified, else under `assumes`; the composition rule one line.
- F3 Related work against the canon and the neighbours of §1, with what each forces us to say; the
  kissing gap sentence; one sentence in §2: an enclosure is not a confidence interval, the sampling
  width is a statement of another kind, kept apart (P1 already does this; the method paper never says
  it).
- F4 Venue, with the group: the re-cut paper fits the Journal of Symbolic Computation (exact
  certificates, checker, System Descriptions) at least as well as the Journal of Computational and
  Applied Mathematics ("accuracy should be proved and illustrated with nontrivial numerical examples");
  the referees name Reliable Computing and ACM TOMS with Replicated Computational Results as the
  standard. A ≤ 6-page SoftwareX description carries the system (gold OA, a citable software DOI for
  the partner). P1: Ocean Engineering (it published the contour benchmark and the response-based
  follow-up; the group reads it).
- F5 Elsevier form: author list and CRediT; the AI declaration; data availability with a Zenodo DOI
  for the submission commit; the reproducibility appendix (kit commands, CI run id, the checker's
  sha256 and line count, the Node/V8 version). F6 every new number a macro.

### G — P1, where it touches

P1 cites the method paper for the arithmetic; its numbers do not move under Phase 0 and A (hseva and
ecbench untouched; the pad helper is not in anything P1 cites). The group's four questions stay
theirs; checker v2 (B5) answers "a Python verifier of a downloaded cell certificate" when it exists.
P1's related work gets the sentence: no prior verified-numerics treatment of return levels or
IFORM/ISORM contours was found; the nearest are robust-bound and p-box methods, which bound the model,
not the arithmetic.

## 4. Order and effort (core only; the CPSI submission closes 2026-10-19 17:00 and is the operator's)

| phase | window | items | sessions |
|---|---|---|---|
| 0 | 2026-10-10 → 10-15 | P0.1–P0.6 (engine.js and families/ only), C1, A5, the D2 packet drafted and the R5 ask ready for the operator | 4 |
| 1 | → 2026-10-24 | A1 (apps after 10-19), A2 (labs/mfg), A3, A4, C2, C3, C7 | 5 |
| 2 | 2026-10-25 → 11-07 | B1–B4 (exact classes), C4, C5, E3, E4 (atlas field + re-run as a background job) | 6 |
| 3 | 2026-11-08 → 11-18 | E1, E2 under the amendment; D4; the D1/D2 counts as they land | 6 |
| 4 | 2026-11-19 → 11-28 | F1–F6; **v0.3 to the group by 2026-11-21** (the controllable milestone); v1.0 after their review | 5 + their time |

About 26 sessions. Extensions (B5, D3, the five other pad callers) only after v1.0. Sends are the
operator's at every step; names stay out of the public repository.

## 5. Decisions taken between the two reviews (the operator may overrule)

- Thesis re-cut to two contributions (adversarial reviewer) while keeping the grammar as the frame and
  the discipline as a measured section (constructive reviewer): both, with the full system description
  moved to SoftwareX.
- Checker v1 exact-only in core; the interval checker v2 as an extension; the paper names the exempt
  classes. Both reviewers agree on the split; they differ on whether v2 is v1.0 work — it is not, at
  this budget.
- The self-written float scorer dropped as a baseline; the claimants' own checkers, Arb and a
  cost-only brute force kept; a RECONSTRUCTED float evaluation of the claimant's printed formula
  reinstated only for rows with no public checker (the constructive reviewer's reversal, accepted: it
  reproduces practice rather than inventing it, and the hole it fills is a reportable count).
- The mutant rule split (both reviewers): result-bearing mutants required to be rejected; proposer-
  choice perturbations recorded as slack; the checker's soundness tested against false certificates.
- D3 Lean out of v1.0; D2 co-author replication in as a packet, blind, named as co-author replication,
  with the count being what lands.
- A2 scoped to labs/mfg in core (the adversarial reviewer's cut); the other five callers are an
  extension with a written contract meanwhile.
- Mutation testing on four kernel files, measured as verdict flips on a pre-drawn sample.
- JSC moved level with JCAM; the choice is the co-authors'.

## 6. Not done, and the risks

- No Rust port, no Lean exporter for every certifier, no registry standard, no consortium
  (2026-10-02). B5 and D3 wait for v1.1.
- A same-author checker is still the same author; the plan says so, counts it so, and puts the weight
  on D1, D2, A3 and the false-certificate corpus — and on the format document being sufficient for a
  stranger to write their own checker, which D2 begins to test.
- D1 and D2 depend on other people's clocks; the paper reports what landed by submission; v1.0 ships
  at R = 0 if necessary.
- The erratum changes public numbers on the control page; it is the counting rule applied to ourselves,
  pinned to the bytes it corrects, and disclosed with its history.
- Scope: every item above closes a named defect, produces a number the paper quotes, or is deleted.

## 7. For the operator to decide

1. The venue, with the group: JSC or JCAM first; the SoftwareX companion yes or no.
2. The pre-registration amendment (E1, E2): the operator signs its date; nothing in Phase 3 starts
   before it.
3. The D2 packet and the R5 ask: a send, on the operator's word, in week one.
4. The erratum table on the live control page in Phase 0: a public correction of a public number.
5. Whether Phase 0 runs during the CPSI week (it touches no app) or waits until 2026-10-20.

## 8. The "claim more" ToDo list (added 2026-10-09, operator's question)

Core + rung 2 (interval checker) + rung 3 (outside-written checkers) + rung 6 (incumbents head to head),
rung 4 (a bigger corpus) in parallel at whatever size it reaches; rung 5 (a Lean-verified checker) is a
separate 2027 paper. About 45 sessions; v0.3 to the group mid-January 2027.

Phase 0 — headline truth (4 sessions, by 2026-10-15; engine.js and families/ only)
 1. `machine/engine.js` relations() and `families/oeis-closedform.js`: interval candidates, refuted only on disjointness; re-run; count the rows that flip.
 2. `instruments/verdict.js`: the words, `decide(enclosure, bar, direction)`, compositions, the flip-threshold bisection; every family calls it; `scope` flag; unknown → REFUSED.
 3. `families/newman.js`: HIT iff candidate.lo > champion.hi; statement reworded; envelope rows typed.
 4. Traps: `pow` refuses ≥ 2^31; NaN/well-formedness in mul/div/sqr; radii refuses Z2 < 0; Certificate rejects '' and undefined, toJSON consistent; CONSTANTS from the series module.
 5. Erratum table on the control page: before/after pinned to the old commit and index.html sha; the √2 history stated; README/CLAUDE.md/HANDOFF sentence changed.
 6. `make test` exits non-zero on FAIL; control build refuses on red (check the workflows first).
 7. `.node-version`, `.python-version`; `process.versions.v8` in every record.
 8. `apps/abatimento` frozen until 2026-10-19 17:00.

Phase 1 — kernel and assurance (6 sessions, by 2026-10-28)
 9. verdict.js imported by the apps (after 10-19); grep gate; `class` field (exact / interval / formal / data) on all 132 register rows.
10. Retire the platform-cosine pad in `labs/mfg` (others if time); Math.pow → interval pow; tails outward; taylor2 midpoints enclosed; `special.js` constants derived.
11. Arb differential battery (python-flint pinned in a venv; adaptive precision; all operand classes incl. wide intervals, pow at 2^31 ± 1, Sum2/ORO on condition-10^30 data); registered in make test and build-control.
12. Rounding battery: immediate neighbour by bit pattern at every boundary; tautological trig tests removed.
13. Cheap debts: GatesN, drift local side, build-site prune, hseva reds → ok, RERUN.md timed rebuild, stable-json ×3, λ(4) commit sha pinned.
14. Red-control census tool.
15. Screens-prune battery over all eleven families (leaked = 0; false-prune fraction).
16. Blind co-author packet (atlas fit asking for their bound, a contour count, one control from the undecided 54) and the R5 ask ready; the send is the operator's.
17. Rung 3: the certificate FORMAT DOCUMENT a stranger can write a checker from, ten sample certificates, an answer key held back, the open-call text; three parties asked (the group's student, one rerun party, the repository); sends the operator's.

Phase 2 — certificates and measured assurance (8 sessions, by 2026-11-14)
18. Schema v1: proposer's choices stored, never results; `reading` object; result-bearing mutants (must reject) split from proposer-choice perturbations (slack); versioned, hashed.
19. `checker/check.py` (exact classes): integers and fractions only; false-certificate corpus; mutation of check.py itself; prints sha256 and its own line count.
20. Emitters: SOS, multilinear corners, sign predicates, polynomial inequalities at rational points (kissing, packings, autocorrelation, Heilbronn), tensor decompositions (strassen, mc100), δ3 psd, certify-min + minpoly.
21. Count macros: emitted / checked / rejected / slack by class; rows covered by id; the 14 kissing rows listed as exact-beyond-budget.
22. Mutation testing on interval.js, transcendental.js, radii.js, verdict.js; soundness-class mutants; verdict flips on a pre-drawn sample; equivalent mutants named.
23. GitHub Actions: the rerun kit on ubuntu-latest at every push; run id into the record.
24. Hard-cases table (Rump, Muller, ORO 10^30, Kahan) + the 175,320-term naive sum vs Sum2 macro.
25. Atlas: store `secondOrder.how`; re-run as a background job; box-vs-point share, inflation-round histogram, width ratio to Arb by binade.

Phase 2b — rung 2, the interval checker (7 sessions, by 2026-11-28)
26. `checker/check_interval.py`: rational interval arithmetic; decimal exp/ln cross-checked against a Fraction series, refuse on disagreement; sin/cos with a rational π, domain ≤ 2^20; forward-mode interval AD; Krawczyk + Hessian minors; families normal, lognormal, Weibull, Gumbel; the P2 gate; engine emits only at margin ≥ 2×.
27. Pre-registered stratified atlas sample with its seed; run; counts; GG and EW named as exempt.
28. The Newman interval certificate emitted and checked (if time).

Phase 3 — benchmark and incumbents (10 sessions, by 2026-12-19)
29. Pre-registration amendment, dated by the operator: the 46 decided rows listed; baselines fixed; both denominators (decided rows; all 100 with undecided = REFUSED).
30. Decide the remaining 54 by the note's order of work (new deciders as needed).
31. Baselines: claimants' own checkers; RECONSTRUCTED float formula for no-checker rows (count reported); Arb; brute force (cost only). Verdict matrix, NEEDS DATA per pool, time per row, accepted-but-wrong band.
32. Rung 6: Arb scripts and Coq-Interval (opam install, one session; skip and say so if it fails) on a sample of interval-class claims; two-way refusal table; times; scripts published.
33. Rung 4 in parallel: a second pre-registration for a larger corpus (AlphaEvolve records, the full EinsteinArena table, the Ramanujan Machine sheets, the Erdős AI wiki numbers); deciders; the defect taxonomy; reported at the size reached.
34. Replies: D1 reruns and rung-3 outside checkers into `corpus/external-reruns.json` with pinned commits (`kind: outside-checker`).

Phase 4 — the paper (6 sessions, v0.3 to the group mid-January 2027)
35. Re-cut §1–§9 (plan F1): problem and the two contributions; grammar + reading protocol; arithmetic with domain, trust base, V8 table; certifiers compressed; the format and checker with counts; the benchmark with both denominators; assurance as counted sentences; limits in two tables + erratum; worked example + cost table.
36. Propositions: rounding with every IEEE-754 case; checker soundness (v1 exact; v2 with its trusted base); the ORO constant; the point-Sylvester inertia lemma; monotonicity by certificate field.
37. Related work: the canon and the neighbours; the kissing gap sentence; enclosure ≠ confidence interval.
38. Macros for every new number (extend `tools/paper-numbers/cert-machine-method.js`).
39. SoftwareX companion, ≤ 6 pages.
40. Elsevier form: CRediT, AI declaration, Zenodo DOI for the submission commit, reproducibility appendix; venue with the group (JSC or JCAM).
41. v0.3 to the group; their review; v1.0; the submission (the operator's).

The claim level at submission is whatever has landed: each rung's sentence switches on only when its number exists in a record.
