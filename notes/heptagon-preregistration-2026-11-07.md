# Pre-registration — Pálvölgyi's heptagon in Lean through OpenAI's chain, and appendix Theorem A.3 (plumb, private), 2026-11-07

Written and committed BEFORE any Lean of ours is written against either claim. The kill review (scout/KILL-HEPTAGON.md)
found: the two labs AGREE in print (OpenAI's paper cites the heptagon and says A.3 "already implies" their nine-point
result); the heptagon's failure of the FieldCriterion is checked exactly by three parties on paper (JD Jones 10-07, pw
10-22, ours 11-07); the six-point case is CLOSED in Lean by others (JD Jones 10-07, wstrinz 10-16). Nobody has the
heptagon itself in Lean, and nobody has checked Theorem A.3. The operator (11-07): "Proceed, narrowed, 3-week clock."
The clock: 2026-11-28. Whatever the state that day, the lane stops and the record is written.

## What every artifact says first

"Graham's conjecture was refuted in September 2026 by Pálvölgyi with ChatGPT (the seven-point cyclic set) and by OpenAI
(a classification of Euclidean Ramsey configurations, in Lean, with twelve- and nine-point sets). This record decides
Pálvölgyi's set through OpenAI's theorem in Lean's kernel, transported to DeepMind's statement, and decides Theorem A.3 of
the appendix the author marked unchecked and the lab cites. The objects and theorems are theirs; the decisions are ours."

## Pins (PINS-HEPTAGON.txt; read-only copies in ~/Projects/plumb-scout/heptagon-pins)

- arXiv:2609.23327v1 (Pálvölgyi, 2026-09-20): paper.pdf and the TeX source (spherical_non_ramsey.tex).
- openai/math at 4eaee87548250b2682affda7d05d947c05554bae: lean/OAI/Combinatorics/EuclideanRamsey/ (47 files; Model.lean's
  FieldCriterion; TensorDescent.ramsey_fieldCriterion; classification), lean/OAI/Combinatorics/SphericalRamsey/ (21 files;
  exists_real_derivation, the energy identity, the floor colouring), the seven Euclidean Ramsey Comparator challenges and
  GrahamSpherical, lean/docs/172.md, lean-toolchain (v4.34.1), lakefile and manifest (Mathlib d13f23b7), the paper and
  its TeX.
- google-deepmind/formal-conjectures FormalConjectures/ErdosProblems/174.lean, identical at 2055e5a and at upstream main
  2055e5adadae0b2e392365938faa82ef6f1464f0 (2026-11-06): IsRamsey, erdos_174.variants.graham (research open).
- Provenance, not pinned as evidence: JD-Jones-ASES/six-concyclic-lean, wstrinz's four repositories, pw/byclaude (#7517),
  anxkhn (#7706) — read at the kill review, cited by commit in the record.

## Questions, verdict rules, controls

**H1 · The identities, exactly and independently.** Two clean-room symbolic deciders (sympy; a second in a different
system, no shared code) decide for the heptagon with r symbolic: the weights 2, −2, 2, −1 satisfy the three moment
conditions (Σλ = 0, Σλ p = 0, Σλ p pᵀ symmetric, in Lemma A.1's general form); the energy Σλ‖D(p)‖² = −24/R with
R = (2r−1)(2r−3)(2r−4) under D(y_j) = j/y_j; the invariance expansion for a symbolic congruent copy. CERTIFIED if both
agree on every identity; REFUTED (named) otherwise. This is the third check of what two others checked; it is stated
as such.

**H2 · The heptagon in Lean, through the other lab's theorem.** A module of ours on OpenAI's pinned toolchain and
Mathlib, importing their chain unchanged, proving `¬ FieldCriterion (heptagon r)` for a transcendental r > 2 by the
derivation pairing (their `exists_real_derivation` with D r = 1; Φ on `Coeff ⊗[ℚ] Coeff`; the expansion lemma; the
constant row by D 1 = 0; the trace against −24/R), then `¬ Ramsey (heptagon r)` by `TensorDescent.ramsey_fieldCriterion`
with `affineSpan = ⊤`, then the transport to formal-conjectures' `IsRamsey` and the negation of
`erdos_174.variants.graham`'s statement, copied byte for byte from the pin and checked by a script against the pinned
file (the #7517 pattern). No sorry, no native_decide, no new axiom. CERTIFIED when it elaborates and kernel-checks;
REFUSED, with the last proved lemma named, if the clock runs out. The route of lower risk, declared now as the
fallback: a fork of their SphericalRamsey chain for a direct ¬Ramsey, if the Φ expansion lemma resists by 2026-11-18.

**H3 · Kernels.** `lake build`, our axiom audit, `leanchecker`, `-paranoid`, `--fresh`; then nanoda, con-leche, con-ron,
lean4lean on the export; a tool stop is a named gap (the October lane saw ~7 GB RSS on this chain).

**H4 · Theorem A.3 (the unchecked appendix theorem the lab cites).** Statement as printed: p(t) = ((1−t²)/(1+t²),
2t/(1+t²)); for three distinct reals t₁, t₂, t₃ and t₄..t₇ algebraically independent over ℚ(t₁, t₂, t₃), the seven points
are not Ramsey; hence almost every seven-point subset of a circle is not Ramsey. Our decision: (i) the proof read line by
line against Lemma A.1 (the symmetric form) with every finite identity decided exactly by the two H1 deciders on symbolic
t's; (ii) the existence steps (a derivation with prescribed values on an algebraically independent set) matched to a
Mathlib or OpenAI lemma or named as a gap; (iii) if (i) and (ii) close, a Lean proof of A.3 on the same chain, inside the
clock. Words: CERTIFIED (i)+(ii)+(iii); READ-CLEAN (i)+(ii) with (iii) not reached; REFUTED (named step) if an identity
fails. Prior, stated now: A.3 is true as printed, 85%; a Lean proof inside the clock, 25%.

**H5 · Provenance.** Dated reading: fedja's 2018 MathOverflow comment (cited by the author), Pálvölgyi 09-20, OpenAI 09-23
(its citation of the heptagon and of A.3), JD Jones 10-07, wstrinz 10-13..18, pw/byclaude 10-22, anxkhn 10-31. No
verdict word.

**H6 · Red team.** Variants that must fail to compile or be refused: a weight 1 for 2 on one point; a point moved off the
circle; r algebraic (no derivation with D r = 1); the FC statement copy with one token changed (the check script).

## Predictions, stated now (graded at the reveal)

- H1 CERTIFIED: 97%. H2 CERTIFIED by 2026-11-28: 50%. Someone else's Lean proof of the heptagon appears first: 35%.
- H3: every second kernel accepts: 45%. H4 READ-CLEAN or better: 80%; CERTIFIED: 25%.

## Compute and money

A RunPod CPU pod (the runpod image; cpu3m 8 vCPU / 64 GB, about US$0.44/h) for the Lean loop, deleted at the end of each
working session and confirmed 404; GitHub runners for the kernel replays; the Mac for the symbolic deciders. Expected
US$10–20 inside the US$500 cap; nothing billing unattended.

## Reveal (decided at the reveal)

Candidates: the `formal_proof` offered on #7706 and a comment on #7517; a formal-conjectures PR; a /reports page; a
note if A.3 is REFUTED or if H2 finds a defect in either lab's text. Private until the operator says "reveal".

## Amendments

Dated, appended below, never edited above.

### Amendment A (2026-11-07 05:20 UTC) — H1, H2 and H4(i)/(ii) outcomes, recorded as they stand

- **H1: CERTIFIED** (h1/VERDICT.md): two clean-room deciders, 0 REFUTED; the Equation (2) vs Lemma A.1 finding.
- **H2: CERTIFIED at the Lean level**, 2026-11-07 05:09 UTC, replayed by the orchestrating session at 05:18 UTC on the pod:
  our oleans removed and `lake build Plumb` rebuilt green (8,943 jobs, 23.7 s, maxRSS 6.99 GB); `#print axioms` on
  not_fieldCriterion, not_ramsey, graham_false, graham_false' = [propext, Classical.choice, Quot.sound]; the toolchain's
  `leanchecker` rc = 0 on all five modules; verbatim_check.py PASS against the pinned 174.lean. 603 lines, no fallback
  needed; the expansion lemma compiled on the first build. The pre-registered risk did not materialise. The one change to
  their tree: five lines appended to lean/lakefile.lean declaring our library (lakefile-append.lean). Open for H3: the
  second kernels and `leanchecker --fresh`. Lake reports "local changes" in two of their packages (tate-curves-theta,
  iut) after `lake exe cache get`; not ours, recorded.
- **H4: READ-CLEAN** (h4/MATCHING.md): (i) finite content CERTIFIED by both deciders; (ii) every non-finite step matched;
  (iii) a Lean proof of A.3 is realistic (≈ 500–600 lines) and is started now on the same pod, inside the clock.
- Predictions updated (graded at the reveal against the sealed priors): H2 by the clock, now a fact; H3 every second
  kernel accepts 45% (unchanged); H4 CERTIFIED 40%.

### Amendment B (2026-11-07 05:55 UTC) — H4(iii) complete; H4 CERTIFIED by the pre-registered rule

- **H4(iii):** `Plumb.Generic.generic_seven_not_ramsey (t : Fin 7 → ℝ) (h3 : t₀, t₁, t₂ distinct)
  (h4 : (t₃, t₄, t₅, t₆) AlgebraicIndependent over IntermediateField.adjoin ℚ {t₀, t₁, t₂}) : ¬ Ramsey (circ t)`, with
  circ t i = OpenAI's NineGeometry.circlePoint (t i) = ((1−t²)/(1+t²), 2t/(1+t²)), the paper's p(t) exactly (read in their
  CircleExtension.lean:10–11), and Ramsey OpenAI's. 742 lines in four modules (Derivation 219, Moments 278, LemmaA1 132,
  A3 113); commits d05a169, 50a3212, 1f3923c. Replayed by the orchestrating session at 05:52 UTC on the pod: Generic
  oleans removed, `lake build Plumb.Generic.A3` green (8,938 jobs, 22.2 s, 7.0 GB); `#print axioms` = [propext,
  Classical.choice, Quot.sound]; the toolchain's leanchecker rc = 0 on all four modules; every pod file's sha256 equals
  the Mac copy. Red team (redteam/redteam-h4.sh): D t₀ = 1, λ₃ doubled, t₃ = t₀ admitted — each REFUSED, originals restored
  green. One deviation from MATCHING.md's signature: `[Fintype ι]` on the derivation lemma (A.3 uses ι = Fin 4).
- **H4 = (i) + (ii) + (iii): CERTIFIED** by the rule written in H4 above. Second kernels for these modules are added to H3.
- Not claimed: the "almost every seven-point subset" clause (needs a measure-zero lemma; out of scope as declared); a
  ℚ-independence corollary in the shape of OpenAI's nine-point theorem (≈ 50–100 lines, not done); a transport of A.3 to
  formal-conjectures' IsRamsey (not needed for A.3, which is not a formal-conjectures entry).
- Predictions graded so far (sealed priors): H1 CERTIFIED (97% → yes); H2 by the clock (50% → yes, day 0); H4 CERTIFIED
  (25% → yes, day 0). Open: H3 (45%), someone else first (35%).

### Amendment C (2026-11-07 07:20 UTC) — H3 complete; every kernel that reached a verdict accepts, on both roots

Roots: Plumb.Heptagon.Transport (the four final theorems) and Plumb.Generic.A3 (generic_seven_not_ramsey). Exports by
lean4export 076e8e57 (format 3.1.0): E1 and E1g, the dependency closures (sha256 3a980dff…, aa176ae0…; zstd copies kept
off-repo in plumb-scout/heptagon-exports, re-hashed on the Mac); E2, the whole environment of the heptagon root; E2u, the
union environment of both roots (6.19 GB, d59a22b6…). The table, one row per check and root, ends h3/LOG.md (84e74dd).

- `leanchecker --fresh`: exit 0 on both roots (22 min 40 s; 21 min 50 s). The axiom audit: PASS on all five theorems
  (propext, Classical.choice, Quot.sound), its eight planted controls behaving as required.
- nanoda 8de7e0c4: accepts E1, E1g and E2u. con-ron 97eead2d: accepts E1, E1g, E2, E2u. lean4lean `arena` bce34481:
  accepts E1, E1g, E2, E2u. con-leche 701d72ae: accepts E1, E1g, E2u. Verdict lines and exit codes re-read from the
  committed logs by the orchestrating session.
- Controls: a forged E1 (one term changed at E_ne_zero) refused by all four (con-leche, con-ron, lean4lean exit 1; nanoda
  panics, exit 101). Build-level red team W, C, T refused.
- Named gaps. (1) `-paranoid` does not exist in v4.34.1's leanchecker (its only flags are `--verbose` and `--fresh`), so
  it was not run. (2) nanoda on E2u stopped twice on our configuration before accepting: with the hard axiom error on it
  refuses Init's own `Lean.trustCompiler`; with it off it panics on that axiom's dependents. Run 2 permits exactly the
  environment's 15 axioms, every one declared in Init. The claim that the theorems use only the three standard axioms
  rests on the audit and on the closure exports, checked with the hard error on. (3) lean4lean master reads only v4.33
  .oleans, so the `arena` branch, which reads the export, was used.
- **H3: complete.** Prior graded: every second kernel accepts (45% → yes).
- Pod dabxq1rgzzamco deleted 07:18 UTC (204, get-pod 404, list-pods empty); 2 h 48 min, about US$1.23.

### Amendment D (2026-11-07 11:55 UTC) — the ℚ-independence corollary, written before any of its code

On the operator's choice (2026-11-07), one addition before any reveal, in the shape of OpenAI's nine-point statement
(OAI.EuclideanRamsey.NineStatement.nine_circle_configuration, read at the pinned 4eaee875):

    theorem seven_circle_configuration (t : Fin 7 → ℝ) (ht : AlgebraicIndependent ℚ t) :
        Function.Injective (literal t) ∧ (∀ i, dist (literal t i) 0 = 1) ∧ ¬ Ramsey (literal t)

with `literal t i = WithLp.toLp 2 ![(1 − t i²)/(1 + t i²), 2 t i/(1 + t i²)]`, their literal parametrisation verbatim,
proved FROM generic_seven_not_ramsey (no second proof of A.3). Words: CERTIFIED if it builds on the same chain, the axiom
audit gives exactly propext/Classical.choice/Quot.sound, leanchecker --fresh and the four second kernels accept a closure
export, and three planted variants are refused (hypothesis weakened to ℚ-independence of six of the seven; the
conclusion's ¬ dropped; a sorry in a helper). A tool stop is a named gap. Prior: CERTIFIED today, 80%.
Not claimed, still: the "almost every seven-point subset" clause.

### Amendment E (2026-11-07 12:55 UTC) — Amendment D complete; the corollary CERTIFIED by its own words

- `Plumb.Generic.seven_circle_configuration (t : Fin 7 → ℝ) (ht : AlgebraicIndependent ℚ t) : Function.Injective
  (literal t) ∧ (∀ i, dist (literal t i) 0 = 1) ∧ ¬ OAI.EuclideanRamsey.Ramsey (literal t)`, with `literal` OpenAI's
  literal parametrisation token for token (Fin 9 → Fin 7 and the two names the only differences, checked against
  NineStatement.lean and the Comparator challenge file at the pins). 91 lines in Plumb/Generic/Seven.lean, proved from
  generic_seven_not_ramsey; the transfer is Mathlib's AlgebraicIndependent.adjoin_of_disjoint and
  IntermediateField.algebraicIndependent_adjoin_iff (no lemma of ours). The four A.3 files unchanged. Commits 4efa516,
  44971ed, f18574e; the table in lean/heptagon/LOG-D.md.
- Every check D names passed: the build; the audit exactly propext/Classical.choice/Quot.sound; leanchecker --fresh on
  the module (exit 0, 24 min 28 s); the closure export E1s accepted by nanoda, con-ron, lean4lean and con-leche (a forged
  E1s rejected by all four; a first forged run was void, a malformed stream, and is recorded as such); V6 and VN refused
  by the build, VS refused by the audit, the originals restored green; the verbatim check PASS.
- Replayed by the orchestrating session at 12:50 UTC on the pod: the Seven olean removed and rebuilt green; `#print
  axioms` the three standard axioms; the statement as above; the pod's sources equal the Mac's by sha256.
- Named gaps: the kernels trust lean4export's closure; no whole-environment run for Seven (D asked for the closure);
  no `-paranoid` in v4.34.1; nanoda and con-ron rebuilt at the same commits with different bytes from H3's.
- Prior graded: CERTIFIED today (80% → yes). Pod r12pvlfxiiiaug deleted 12:51 UTC (204, 404); 44 min, about US$0.32.

### Amendment F (2026-11-07 13:05 UTC) — H5 provenance: one correction to what this lane said about A.3

The kill review said Theorem A.3 was "verified by nobody, formalized by nobody". Read again today: wstrinz/spherical-ramsey
(54b560f6, 2026-10-16; Zenodo 10.5281/zenodo.23366343) certifies ONE INSTANCE of A.3 exactly (J2-F7: three rational plus
four algebraically independent circle points are not Ramsey, `certificates/dual_cert.py`, [CERT]) and uses A.3 with A.7
for the non-Ramsey half of his circle phase diagram at the [HAND] level, citing them as Pálvölgyi's unchecked appendix.
Correct wording from now on: A.3 in general had no checked proof and no Lean proof; one instance was certified exactly
(wstrinz). Our Lean proof is the first of the theorem as stated; it also lifts the A.3 half of his phase diagram from
[HAND] to a kernel-checked proof. No Lean of the heptagon or of A.3 appeared anywhere as of 12:55 UTC today
(formal-conjectures #7706/#7517 unchanged since 10-31/10-22; openai/math unchanged since 10-30; JD Jones and wstrinz
unchanged since 10-12/10-16; a code search finds no other).

### Amendment G (2026-11-07 17:00 UTC) — the public repository's namespace, renamed and re-checked

- The operator chose the bundle "Lean repo + #7706 only" and "Rename, re-run checks". `Plumb` → `HeptagonRamsey`,
  mechanically: 11 Lean files, 39 substitutions; the reverse substitution gives the certified masters byte for byte
  (checked by the agent's rename_check.py, and again by the orchestrating session with sed + sha256 against
  lean/heptagon/Plumb/); the one other change is the comment line of lakefile-append.lean.
- The staging repository ~/Projects/heptagon-ramsey-lean (local, no remote): commit 914298f3 (the agent's 50ce45a3,
  amended for one README line: a guessed pronoun for wstrinz replaced by "the"). Its Lean equals the files checked below
  by sha256.
- Re-checks on pod p-hept3, by REPRODUCE.sh itself. Run A (`--kernels --variant`, 15:29–16:47 Z, every olean of ours
  deleted first) and run B (the default on a fresh HOME with elan installed by the script, 14 min 43 s) both ended
  ALL CHECKS PASSED, with byte-identical audit.json. The build green (8,949 jobs); the audit exactly
  propext/Classical.choice/Quot.sound on all six theorems with the closure sizes of the earlier runs; its 8 planted
  controls as required; `leanchecker --fresh` exit 0 on Transport, A3 and Seven (37:32, 37:37, 35:56); the closure
  export (231,046,358 B, sha256 90763eca…f1d6) accepted by nanoda (38,527 declarations, hard axiom error on) and con-ron
  `--verified` (36,840); a forged export rejected by both; both verbatim checks PASS with their mutants FAIL; variant W
  refused by the build, the originals restored green. The record is the repository's CHECKS.md; raw logs in
  ~/Projects/plumb-scout/heptagon-rename-runs/.
- Replayed by the orchestrating session at 16:50 UTC on the pod: the pod's eleven sources equal the staging commit's by
  sha256; a separate `#print axioms` of the six theorems gives the three standard axioms; `#check` of graham_false' and
  seven_circle_configuration prints the statements above.
- Named gaps: a first export attempt was void (the root file is not a lake module, so the export was empty and both
  kernels "accepted 0 declarations"); REPRODUCE.sh now exports the two leaf modules and refuses an empty export. The
  root file was never a lake module here or in Plumb, and is now elaborated with `lake env lean`. The kernels trust
  lean4export; closure only, two second kernels this time (no lean4lean, no con-leche); no `-paranoid` in v4.34.1;
  con-ron's bytes differ between builds of one commit (built without --locked); eleven OpenAI packages report "local
  changes" after the cache download, none in the closure; the transport targets IsRamsey on OpenAI's Mathlib d13f23b7,
  not formal-conjectures' 0df444a3 (Congruence.lean byte-identical at both, Cospherical the same definition); the
  docstrings keep the stage labels H1/H2/Amendment D, explained in the README.
- Two corrections to the plans: ten Lean modules plus the root file, not nine; the formal_proof line points at
  Transport.lean L98 (graham_false', the PR's statement token for token), not L93.
- The contest, re-checked 16:55 UTC: formal-conjectures #7706 and #7517 unchanged since 10-31 and 10-22 (no comments),
  174.lean last changed 10-20 (006a2ab1); openai/math at 4eaee875 (10-30); JD Jones's last push 10-19 (ob-lean);
  wstrinz's Ramsey repositories unchanged since 10-18 (his pushes since are unrelated: drift, wiskit-site, shipkit);
  pw/erdosproblemaday-verification 174/ last changed 10-25, no Lean of the heptagon (palvolgyi_check.py, credited);
  a code search for "heptagon Ramsey" in Lean finds four files, all known; a repository search finds none.
- Pod jdsvoi9ovzemoa deleted 16:51 UTC (204, get-pod 404, list-pods empty); 15:08:53–16:51 ≈ 1 h 42 min ≈ US$0.75.

### Amendment H (2026-11-07 19:26 UTC) — revealed

On the operator's word ("Reveal"), with the bundle narrowed to two items: the contest re-checked 19:24 UTC (unchanged
from amendment G: #7706 and #7517 without comments, 174.lean at 006a2ab1, openai/math at 4eaee875, no Lean of the
heptagon or A.3 anywhere); the public repository github.com/carlostoledo1891/heptagon-ramsey-lean created and 914298f3
pushed (the sealed staging commit, seal 7; GitHub's main equals it; Transport.lean L93 graham_false, L98 graham_false');
ONE comment posted on formal-conjectures PR #7706 at 19:25:37 UTC (#issuecomment-6711953944), the seal-7 draft with
`<sha>` filled and nothing else changed. Not done, on purpose: no page, no wstrinz issue, no X post. The predictions
are graded in REVEAL-HEPTAGON.md when the thread answers.
