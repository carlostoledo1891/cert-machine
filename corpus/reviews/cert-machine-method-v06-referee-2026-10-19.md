<!-- An AI referee read of the method paper v0.6 (a fresh agent, 2026-10-19; not told the author's view). Kept as the record of what v0.7 acted on; HANDOFF lists what was not applied. Line numbers are of the v0.6 .tex. -->

# Referee report: cert-machine method paper, draft v0.6

Manuscript: `paper/tex/cert-machine-method.tex` (v0.6, numbers generated at 7c3b736d21ec; PDF `paper/cert-machine-method.pdf`, 55 pp). Line numbers below are .tex lines. The v0.5→v0.6 changes (`git diff 97323271 HEAD`) are marked **[v0.6]**. Every claim here was checked against the record, code or bib entry named. Where the repository can't settle a point, I say so.

I recompiled the paper with `tectonic --keep-logs` in a scratch copy. It compiles cleanly with no undefined references, and the text matches the committed PDF.

Counts: **Errors 24 · Overclaims 11 · Structure/clarity 15 · Typography/LaTeX 8.**

---

## 1. ERRORS (ranked by severity)

**E1. Records issue CERTIFIED on readings, which contradicts the paper's semantics.** l.96 ("A *reading* … is recorded and issues no verdict"), l.222 (Table 3: "a formal statement, read … no verdict"), l.341 ("The queue was decided wherever a finite exact object exists"), l.351 ("Of the queue's 10 rows, 9 are \vC").
*Evidence:* In `certs/optq-ledger.json`, row `optq-226-23b` has verdict `CERTIFIED`, scope "BY READING, not computed … A reading, held as such", and how "the five sentences of the PR text read against the definition; no number is computed". Row `optq-217-28a` is `CERTIFIED`, "nothing new computed: the certificate is the Lean development already decided", which rests on the earlier reading "the statement read MATCHES". So one of the nine CERTIFIED rows rests on a reading alone and another rests partly on one. Neither has a finite exact object.
*Fix:* Either re-word 23b under the grammar (a reading, or REFUSED) and recount the queue as "7 decided by computation, 1 by a prior kernel record plus a reading, 1 by reading, 1 REFUSED", or add "certified by reading" as its own, separately counted pathway in Tables 3, 4 and 10. The decision paragraph must also say how 23b and 28a were decided.

**E2. [v0.6] Table 7 says C71 was decided by "one program" while the v0.6 text says two.** The PDF p.21 row reads "$C_{71}>6.52…$ | Numaro | $2^{18}$-entry truth table | **\vC, one program**". Lines 341, 288 (Table 5), 428 (Table 9), 459 (Table 10 level 2) and 560 (Table A.1) all say two implementations.
*Evidence:* `tools/paper-numbers/cert-machine-method.js:249` hard-codes `'\\vC, one program'`. `certs/fei-second.json` → `claims[registry-bound]` has `js.verdict = CERTIFIED` and `py.word = CERTIFIED`.
*Fix:* Derive the cell from `fei-second.json`, e.g. `\vC, two programs` when both certify, and regenerate. This is the clearest instance of O1.

**E3. "never runs the claimant's program" (l.70) is contradicted by l.351 and l.414,** where the 147-point certificate's own checker "printed OK on all 4 claims it was given".
*Evidence:* `certs/sumdiff-ledger.json` → `observed.what`: "check_cert.py at the pinned gist revision … run on 2026-09-29 with mpmath 1.3.0"; `observed.runs` lists 4 runs that printed OK. l.279 ("the script was not executed") covers a different case.
*Fix:* "never relies on the claimant's program for a verdict; one claimant checker was run outside any decision, to measure it, and the record says so."

**E4. Comparator is attributed to the wrong party.** l.363 says "Comparator, the claimant's judging tool".
*Evidence:* The bib entry `Comparator` has author `{Lean FRO}` and URL `github.com/leanprover/comparator`, verified in `corpus/bib/cert-machine-method.json`.
*Fix:* "Comparator, the Lean FRO's judging tool, which the claimant used". l.359 ("Comparator challenges") is fine.

**E5. The caption says "seven" untabled queue rows; there are eight.** l.348 reads "The queue's other seven rows are \vC and are not tabled."
*Evidence:* `certs/optq-ledger.json` has 10 rows. Two are tabled (`optq-221-3c` and `optq-210-lambda`). The other eight (`225-1a`, `225-1b`, `226-20a/20c/23b/16a/70a`, `217-28a`) are all CERTIFIED. The word is typed by hand.
*Fix:* "eight", generated from `\MtRqRows` minus the tabled rows.

**E6. The rerun kit's execution did not come "before the exercises".** l.298 says it ran "on 2026-10-02, before the exercises of Section 3". l.341 itself quotes "the rerun kit's timing of 2026-10-02" for the registry replays.
*Evidence:* `certs/rerun-kit-run.json` (date 2026-10-02) includes `node tools/run-sumdiff-ledger.js --check` (1.1 s), `python3 tools/verify_sumdiff.py` (0.2 s) and `python3 tools/run-fei-ledger.py --check` (1.4 s). Git shows `certs/sumdiff-ledger.json` added in c82d5483 on 2026-09-29. Since then `certs/fei-ledger.json` was regenerated (generated 2026-10-19), so the 10-02 timings are of earlier records.
*Fix:* "before the kissing and Navier–Stokes decisions; it included the registry's first three replays, whose records have since been corrected (Section 5.5)."

**E7. [v0.6] Table 10 and the text that introduces it ignore the new Arb comparison of the entropy deciders.** l.453 says "two reach the third, … the kernels' claim and the interval kernel's arithmetic". The level-3 row (l.460) lists only the Lean kernels, Arb for the interval kernel, and λ(4).
*Evidence:* `certs/entropy-arb-audit.json` is a comparison of the entropy deciders with Arb, an implementation by another party. It is new in v0.6 (l.402).
*Fix:* Add "Arb for the entropy deciders' arithmetic, on sampled inputs" to level 3 and change "two reach" to "three reach".

**E8. "Every result reaches the first level" (l.453) contradicts Table 10's own level-1 cell**, which says "the kissing pairs not re-derived at build".
*Evidence:* The seven GPU rows were computed once, on pod `89rlhjinp2h01r` (`corpus/kissing/wave/qiushi-gpu-2026-10-12/pod.json`). The readings are not "the same code, rerun".
*Fix:* "Every computed result except the kissing pairs reaches the first level; the readings are not on this scale."

**E9. "No bound was found false" (l.443) contradicts the refuted C1d bound.**
*Evidence:* l.414 and l.494 report the registry's printed $C_{1d}\le 1.463071582607559$ as REFUTED. `certs/autocorr-replay.json` row `1d-cert2026` has verdict `REFUTED`.
*Fix:* "No bound of the three exercises was found false; one registry bound (C1d) is printed on the wrong side of its own certificate."

**E10. "In every case the claimant had a checker, and in every case it stopped where the claim exceeded it" (l.445) is contradicted by the record.**
*Evidence:* `certs/sumdiff-ledger.json` → `observed.note`: "The Mosaic Intelligence checkers set mp.dps = 80 before comparing and do not have this weakness." So the C3b claimant's checker did not stop short, and the paper reports no defect in the C71 checker.
*Fix:* Restrict the claim to the cases shown: the kissing release, the 147-point checker, the Λ package and the NS statement.

**E11. The three-way kissing agreement is stated more uniformly than the record supports.** l.314 says "In every dimension a seeded sample … the three agree on every contact count". Table 5 (l.286) says "every sample's contact count equal in all three, in all 19 configurations".
*Evidence:* In `certs/kissing-wave.json`, `qiushi-25.jsCheck.excludedFamilies` is `["rational caps","repair points"]`. Those are the 88 `object`-path rows that make the d25 bound new. For 25, 27, 43 and 45 the JS sample (`jsCheck`, 664–672 rows) and the plain-Python check (`engine.spotCheck`, e.g. 13,194 pairs for d25) are different samples. For 43 and 45, `jsCheck.how` names only "basis.js … and the bulk path".
*Fix:* State per dimension what was sampled and by whom. Add the 88 d25 object rows to the JS sample; they are few.

**E12. The span check is misdescribed, and it is missing for d25 and d27.** l.314 says "the rank over $\mathbb Q$ of the exact Gram matrix $XX^{\mathsf T}$", and l.327 says "every configuration spans exactly $d$ dimensions".
*Evidence:* `tools/run-kissing-configs.py:13` computes the rank of $X^{\mathsf T}X$ ($d\times d$); $XX^{\mathsf T}$ would be 53M×53M. `kissing-wave.json` holds `spanDimension` for 32–39, 43, 45 and 49–55, but none for `qiushi-25` or `qiushi-27`. Dims 43 and 45 use a different method (`sampleRankOverQ` plus `allRowsInTheSpan`). In addition, `qiushi-25.counts` is `null`, which bears on "counts per squared norm … checked against the claimant's".
*Fix:* Write $X^{\mathsf T}X$, record the span for 25 and 27 (or qualify the sentence), and name the 43/45 method.

**E13. Leech and E8 are not "re-derived at the start of every kissing run" (l.275).**
*Evidence:* Only `tools/run-kissing-wave.py:18–19, 61–79` re-derives them, and that runner covers d25 and d27. `run-kissing-configs.py`, `run-kissing-sections.py`, `run-kissing-config38.py` and `runpod-qiushi-lifting.sh` do not; the GPU script calibrates on 32 and 39 instead.
*Fix:* "at the start of every run of the wave runner; the other runners calibrate on configurations already decided".

**E14. Several records do not name a machine or a Node version.** l.92 says "Every machine that decided a record is named in it with its platform and software". l.94 says records hold "the machine". l.191 says "the Node version that produced every record is written into the record".
*Evidence:* `certs/sumdiff-ledger.json`, `certs/optq-ledger.json` and `certs/method-eval.json` have no machine, platform or node field (checked by key search).
*Fix:* Add those fields, or soften the three sentences.

**E15. [v0.6] The Data availability statement omits the v0.6 records.** The title note (l.41) says the numbers are read "from the records named in the Data availability statement".
*Evidence:* `certs/fei-second.json` and `certs/c86-replay.json` are named nowhere in the paper. `certs/entropy-arb-audit.json` and `certs/reading-recall.json` are named in the text only. `certs/erratum-2026-10-09.json` is likewise missing from l.533.
*Fix:* List all five in l.533.

**E16. [v0.6] The entropy-audit case count includes the red-control runs.** l.402 says "were run on 298,746 cases".
*Evidence:* `certs/entropy-arb-audit.json` counts arithmetic 264,031, printed 2,715, beyondTheDoor 4,000, and seven `red:*` ops of 4,000 each. These sum to 298,746 (`tools/audit-entropy-arb.py:755` sums every `byOp`). So 28,000 cases are planted wrong functions, not the deciders' real functions. The kernel audit's 946,146 excludes its red controls, so the two audits count differently.
*Fix:* "270,746 cases (and 28,000 runs of the seven planted wrong functions)". Also name the 2,715 printed and 4,000 out-of-domain cases.

**E17. The GPU cost does not add up against the pod record.** l.92 and l.329 say "\$8.15 billed for the pod's whole life … about 1.3 h idle … included".
*Evidence:* `pod.json` gives createdAt 13:03:13Z, the last result at 20:02:59Z (`55.json`), and termination at "21:2x". That is about 8.3 h at \$1.09, roughly \$9.1. `billedUSD` 8.15 is "gpu 8.08 + disk 0.06", read at about 21:25, which is about 7.4 GPU-hours. Either the billing lagged or the rate differed.
*Fix:* Re-read the final invoice, or write "as billed at 21:25 UTC".

**E18. The Λ claim and its label are mis-transcribed.** l.337 and Table 7 write "$\Lambda < 0.1595$ (the registry's $C_{21}$)".
*Evidence:* `optq-ledger.json` row `optq-210-lambda` has claim "Λ <= 319/2000 = 0.1595" and constant "registry 21a". `tools/paper-numbers/cert-machine-method.js:251` hard-codes `<`.
*Fix:* Use $\le$ and "21a".

**E19. The registry's prior Λ row is omitted.** l.337 says "against the recorded $0\le\Lambda\le0.2$".
*Evidence:* The same row's `registryBefore` reads "0.2 (PT2021); 0.1875* (Mosaic, merged 2026-07-17)".
*Fix:* Mention the asterisked 0.1875 row.

**E20. [v0.6] The second-decision date uses the wrong macro.** l.341 says "On \MtFeiFound{} it was decided a second time".
*Evidence:* `\MtFeiFound` is `findingsAtPin.found`, the date the defect was found. The decision date is `fei-second.json.generated` (2026-10-19T23:04Z). The values coincide today, but the source is wrong.
*Fix:* Add a `\MtFeiDecided` macro.

**E21. The d25 rebuild is not only from the claimant's repository.** l.90 says the two configurations were "rebuilt here exactly from the construction files and closed forms in that repository".
*Evidence:* `kissing-wave.json` → `qiushi-25.bytes` pins four files from A. Kravatskiy's repository (`kravatsky:verifications/improved/dim25-lens-heads/data/*`), and its `facts` check the heads against Kravatskiy's.
*Fix:* Name the second source.

**E22. Two passages disagree on what can be re-checked without the system's code.** l.141 says "an interval certificate can be re-checked by any arithmetic that rounds outward at the precision it states". l.516 says "only the exact-class certificates are in a form a program other than this system's can check".
*Fix:* Reconcile the two, probably by keeping l.516 and softening l.141 to "could be, once exported".

**E23. [v0.6] One sentence is stale after the new audit.** l.242 says "neither is the double-precision kernel that Section 4 compares with Arb". Section 4 now also compares these deciders with Arb (l.402).
*Fix:* "… and Section 4 compares both with Arb".

**E24. The tail margin is overstated (l.514, and l.572 "many orders").** The paper says the transcendental tails are "safe by a margin of twenty orders".
*Evidence:* `instruments/interval/transcendental.js:114–134`. The guard is $|r|<1$, and the tail $|r|^{25}/25!\approx6\times10^{-26}$ is only about 9 orders below an ulp of $e^{r}$. Twenty orders holds only for $|r|\lesssim\ln2/2$.
*Fix:* State the margin as a function of $|r|$, or tighten the guard.

---

## 2. OVERCLAIMS (ranked)

**O1. "Every measured number and count … is read at build time … a record that no longer supports a sentence stops the build"** (l.41; repeated at l.94, l.300 and l.544).
*Evidence:* Many counts are typed in prose or hard-coded in the generator: "seven" (l.348), "\vC, one program" (generator l.249), "Seventeen" (l.312/447), "the twelfth" and "Twelve of twelve" (l.416), "six finite conditions" (l.355), "six files" (l.510/572), "three Zenodo deposits", "166-page", "five section memos", "196,560"/"240", "Node v24.14.1 (V8 13.6)", "at most seventy lines". Two of them (E2, E5) have already drifted without stopping the build.
*Fix:* Either turn these into macros with `need()` checks, or weaken the claim to "the numbers set as macros are read…; counts typed in prose are checked by hand".

**O2. The Navier–Stokes statement fidelity is an unconfirmed AI reading, but the abstract presents it as a finding.** The abstract (l.49) says the system "found that OpenAI's Lean development proves Clay's Navier–Stokes alternatives". l.368 says "the formal statement proves Clay's alternatives (C) and (D)". Highlight 4 (l.56) says "lacked one clause".
*Evidence:* The kernels decide acceptance. That the statement *is* Clay's (C)/(D) is `fidelityVerdict` in `corpus/navier-stokes/audit.json`, a reading by AI agents. Table 10 level 4 says "none: the readings were made by AI agents and no specialist has confirmed them". As written, the abstract endorses a Millennium-problem alternative as formally proved on the strength of an unconfirmed reading.
*Fix:* "Lean's kernel and a second kernel accept a proof of a formal statement that our AI-agent reading, not confirmed by a specialist, found to be Clay's (C) and (D) …". Do the same for highlight 4.

**O3. [v0.6] The 12/12 reading recall counts a catch that the audit itself would not count.** l.416 says "all 12 plants were flagged … Twelve of twelve bounds the recall below by 0.735", and l.493 repeats it.
*Evidence:* In `certs/reading-recall.json`, plant P01 was recorded `NARROWER — DECLARED` in both pipelines. The audit does not count DECLARED as a gap: `\MtOaShort` = DIFFERENT + NARROWER—UNDECLARED (generator). At the audit's own threshold, recall is 11/12, with a two-sided 95% Clopper–Pearson lower bound of about 0.62. In pipeline B the first reader had the right word (UNDECLARED), and the "record the less severe word" rule downgraded it. The record's `limits` also says two plants left a clue (156, 328) and that readers were "asked to be careful". The paper mentions neither.
*Fix:* Report 11/12 at the audit's threshold, name the interval as two-sided Clopper–Pearson, and mention the clues and the downgrade.

**O4. [v0.6] The FEI defect was an unsound REFUTED, not just a "two-word" problem.** l.508 says the decider "had two words … its one published row was \vC, which two words get right, and it is unchanged". This understates the failure.
*Evidence:* `certs/fei-second.json` → `findingsAtPin.pyWordRefutesATrueClaim` = `["e2-bar-1e-75-below-the-value"]`, i.e. an unsound REFUTED on a true claim. `entropy-arb-audit.json` → `foundAtPin` shows that `verify_sumdiff` and `verify_twolaw` returned "[-1, -1], REFUTED" for a one-point law. This is the failure mode the grammar rules out.
*Fix:* Say plainly that two deciders could print an unsound REFUTED until 2026-10-19, and that no published REFUTED came from them.

**O5. [v0.6] The C86 bound is CERTIFIED although its analytic step was only read.** l.355 calls it CERTIFIED while "the chain from those conditions to the bound is the claimant's published one, read and not re-derived".
*Evidence:* `certs/c86-replay.json` has claim "C_86 <= 1.8117251" with verdict CERTIFIED, and `limits` says "the extension to C is the claimant's minimum-principle argument, read". By the paper's own grammar (l.147 and Table 2: PARTIAL = "which fragment certified and which core was not reached"), this is PARTIAL, or at least needs the scope sentence beside the word.
*Fix:* Use PARTIAL, or "\vC on the six finite conditions" with that scope.

**O6. The abstract and highlight 5 overstate the kernel audit.** They say "no violation in 946,146 cases checked".
*Evidence:* 1,504 of those cases were refused, so they were not checked for containment (`certs/kernel-arb-audit.json` → `counts`). The kernel is also barely used by the three exercises; only the C86 JS side touches it. The v0.6 entropy-decider audit is the one that covers the exercises.
*Fix:* "contained the exact value in all 944,642 enclosures it returned (1,504 refused)". Consider naming the entropy audit in the abstract.

**O7. The abstract and l.449 select the four removed marks from a larger set.** The abstract says "replayed the certificates behind four unverified bounds … which then removed the marks".
*Evidence:* Nine asterisked rows were replayed: three, the two-law certificate, four step-function rows, and C86. Four marks came off. PR 232 is "filed, no reply" (`corpus/outreach.json` → `gh-optq-232`), and C86 was not offered.
*Fix:* Give the denominator.

**O8. "Incompleteness has a size, and it is reported" (l.418), but the 71 cosine straddles have no denominator.**
*Evidence:* `certs/method-eval.json` → `incompleteness` holds `cosineStraddles: 71` and nothing else.
*Fix:* Give the number of cosine-minimum decisions.

**O9. "a battery whose red controls do not all fire fails" (l.273, l.420) cannot apply to 56 batteries.**
*Evidence:* `method-eval.json` → `redControls.batteriesWithACount = 91` of 147. 56 batteries state no red-control count.
*Fix:* Say that the rule is enforced on 91 batteries, and how many have no red control.

**O10. The second-implementation table (Table 5) is called "independent" in effect, but some rows are not.** The "Hankel-determinant wall" row is mostly level 1 ("51 rows re-run bit-identical"); only the 6 cross-checks are a second implementation. The "three engineering decisions" row lost its numbers in v0.6 ("agreement recorded in each \citep{Register}").
*Evidence:* The v0.5 rows carried `\GRefPoints`, `\MtAbatVersions` and `\MtAbatInterior` (diff hunk @@ -300).
*Fix:* Restore the numbers or drop the row. Also, Table 10 level 2 omits the Hankel row that Table 5 lists.

**O11. The "README" link sentence has no pin.** l.331 and l.449 say the claimant "linked the check from both of its READMEs".
*Evidence:* No pinned README with the link exists. `corpus/kissing/wave/qiushi/README.md` was fetched on 2026-10-05, before the link. Only `HANDOFF.md:660` and the `outreach.json` note say so.
*Fix:* Pin the README at the commit that added the link, or soften the sentence. It can't be checked from the repository today.

---

## 3. STRUCTURE AND CLARITY (ranked)

**S1. The public register does not hold the paper's exercises.** l.90 and l.386 describe the register (132 rows, last decided 2026-10-05; `register-numbers.tex` was generated at 3420b752). Of the exercises it holds the NS row and three registry bounds. None of the 19 kissing rows, the queue, openai/math, C86 or the step functions is in it, and the rerun kit covers the register as of 10-02. A reader cannot tell which "record" each result lives in or what reruns it. Either add the exercises to the register and rerun kit, or state the gap in §2.6 and Table 10.

**S2. "Benchmark exercises" is a misnomer** (the title and §3). These are case studies: nothing is compared with another tool on the same objects. A referee will ask for either a comparison (for example, an outside checker on one kissing configuration or one entropy certificate) or the word "case studies".

**S3. Main-text material is unused by the exercises.** This includes the Krawczyk theorem and the radii-polynomial sibling (§2.4.2, l.244–250), the Thresholds subsubsection (l.143–144, "None of the three exercises needs them"), the mean-field/lemniscate code-reuse detail (l.279), the browser re-run material (l.298), and the δ3, Hankel and engineering rows of Table 5. l.259 already moves the other unused certifiers to Appendix B; Krawczyk should go with them.

**S4. Heavy reliance on the author's own unrefereed sources.** There are 29 citations to six of the author's own items: Register ×9, CMArchive ×7, P1 ×7, P2 ×4, Delta3, Lambda4. The motivating list of public failures (l.68) rests only on `\citep{Register}`. "The positioning notes" (l.279) and "the methods note" are cited as evidence. Give primary sources for l.68 and drop the citations to internal notes.

**S5. Undefined jargon, much of it in v0.6 text:** "a Python door decided" (l.402), "pipelines", "the key's word", "definition hole" (l.416), "two words" (l.508), "six-lane audit" and "reward signal" (l.273; v0.6 deleted the baseline sentence that gave this context, l.271), "bank" (l.341/351), "Hankel-determinant wall" (l.292), and "the laboratory this system grew out of" (l.277, unnamed).

**S6. The meaning of REFUTED for certificate-backed bounds is never stated.** For C1d (l.414) and the C86 red controls (for example "tampered-bound" → REFUTED in `c86-replay.json`), the claim decided is "the cited object establishes the printed bound", not "the constant violates the bound", since the constant may be smaller. The paper uses "bound" for both. Define this in §2.2.

**S7. The second-reading statistic is uninformative as written.** l.380 and l.493 say "changed the word of 40 of the 77".
*Evidence:* `certs/openai-math-statements.json` → `counts.disagreementsOnTheReading` = `["261"]`, and `firstPassWords` has no UNLINKED category. 39 of the 40 changes moved UNDECLARED → UNLINKED, a category the first pass didn't use, and only one was a disagreement on the reading itself. As written, the readings look far less consistent than the record says.

**S8. Statements, families and challenges are used inconsistently.** l.370 says "Of 242 [statements]", Table 8 row 6 says "34 of 242 formalized families", and there are 416 challenges. Say that the unit is the family (`release.json` → `familiesWithScopeNote = 242`).

**S9. l.359 says "one of the four alternatives", then l.363/368 say "(C) and (D)".** Explain that the Lean development states both, for R³ and the periodic case.

**S10. Table A.1 lacks several v0.6 results.** It has no row for the reading recall (`tools/score-reading-recall.py --check`), the NS head decision, or how 23b and 28a were decided. The "Navier–Stokes" row gives a record, not a command.

**S11. The third exercise has no cost.** l.380 and Table 9 give no dollar figure for the rented challenge machines; only "within a pre-registered cap" (also in Funding, l.539).

**S12. Several passages are redundant.** l.493 and l.504 repeat the recall sentence. l.351 and l.414 both tell the 147-point checker story. l.370 and l.382 both say the gaps are pinned.

**S13. Wording at l.138 conflicts with the next sentence.** "a refusal is terminal" is followed by "The only path from \vF to \vC …". Say "never downgraded" instead of "terminal".

**S14. Definition 1's terminology is non-standard.** Moore's "interval extension" also requires $G([x,x])=g(x)$. The inclusion-only property is what Neumaier calls an inclusion function. Use the standard term, or say the definition is weaker.

**S15. Appendix C, Proposition 9(a) mixes two kinds of monotonicity.** Monotonicity is assumed of the procedure's verdicts, but l.634 calls it "a property of the model … proved in each use". If it is a property of the model, the conclusion should be about $\varphi$ over $B(p)$, not about the verdict the procedure returns. This text was moved verbatim in v0.6.

---

## 4. TYPOGRAPHY AND LaTeX

**T1. Highlight 4 is 86 characters,** over Elsevier's 85-character limit: "OpenAI's Navier–Stokes Lean lacked one clause of its theorem; the next commit adds it."

**T2. Two overfull boxes.** One is 1.06 pt in Table 1 (l.78, "Sections 2.3–2.4, Appendix B" in a 0.14\linewidth column). The other is 2.43 pt at l.64 during output (front matter).

**T3. Severe underfull boxes.** The Table 7 caption has 16 badness-10000 warnings (l.348, from long `\texttt` paths); PDF p.21 shows "Table 7:  Five  bounds  of  the …". The Data availability statement has more than 12 (l.534, from `\url`). Move the paths to a footnote or the data statement.

**T4. One record path is not set like the others.** l.414 writes "(certs/autocorr-replay.json)" without `\texttt`.

**T5. Verdict-word styling is inconsistent.** l.416 uses "MATCHES" in capitals and "declared" in lowercase, while verdicts elsewhere are small caps and l.370 uses lowercase "match".

**T6. Λ is mislabelled.** It is "$<$" and "$C_{21}$" in the text but "$\le$" and 21a in the record (see E18).

**T7. Appendix A.2, l.572: "twenty-four Taylor terms"** is the constant term plus 24 (`EXP_TERMS = 24`, terms of order 0..24). Write "terms through order 24".

**T8. Eight bib entries are uncited** (Cobbe21, Hendrycks21, Immler18, LMEval, MartinDorel16, MathVerify, OberkampfRoy10, RevolRouillier05). This is harmless under BibTeX, but they should be removed from the submission .bib. Two factual claims at l.191 have no citation: "a 2017 proposal … closed without adoption" and "V8 moved these functions to a correctly rounded library in May 2026". The repository can't check either.

(Repository note, not a paper issue: the commit message of 842b527e says "52 pp", but the committed PDF has 55 pages.)

---

## Recommendation

**Major revision.** The core is sound and the honesty apparatus is unusually strong: the soundness proposition, the ulp proposition, the exact kissing test, the verdict grammar, and disclosure of its own defects. The quantitative claims I spot-checked against the records mostly hold. But v0.6 has introduced internal drift that the "numbers stop the build" guarantee did not catch (E2, E5, E7, E15). The records contradict the paper's central semantic rule that readings issue no verdicts (E1, O5). The headline Navier–Stokes sentence states an unconfirmed AI reading as a finding (O2). And several statements of method and independence are stated more absolutely than the code and records support (E3, E11–E14, O3).

**The five changes that matter most:**
1. **Make the records and the semantics agree on readings** (E1, O5). `optq-226-23b` is CERTIFIED "BY READING", `optq-217-28a` rests on a reading, and C86 certifies a bound whose analytic step was only read. Fix the records or the grammar, and recount.
2. **Remove the v0.6 drift and weaken O1.** Table 7's "\vC, one program" for C71 (generator l.249, E2), "seven" → "eight" (l.348, E5), the missing entropy-Arb entry in Table 10 level 3 and l.453 (E7), the four records missing from Data availability (E15), and the "every number … stops the build" claim (l.41, O1).
3. **Re-scope the Navier–Stokes claims** in the abstract (l.49), highlight 4 (l.56) and l.368 as kernel acceptance plus an unconfirmed AI reading (O2). Fix the Comparator attribution (l.363, E4).
4. **Report the reading recall at the audit's own threshold** as 11/12, two-sided Clopper–Pearson, with the clue and downgrade caveats (l.416, l.493, O3). Explain that 39 of the 40 second-reading changes were a re-categorization (l.380, S7).
5. **Correct the absolute method claims:** "never runs the claimant's program" (l.70, E3); "every machine/Node version in every record" (l.92/94/191, E14); Leech/E8 "every kissing run" (l.275, E13); the kissing three-way agreement and span (l.286/314/327, E11/E12); "before the exercises" (l.298, E6); and "No bound was found false" and "in every case" (l.443/445, E9/E10).
