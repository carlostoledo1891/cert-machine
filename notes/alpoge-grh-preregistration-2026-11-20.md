# Pre-registration — Alpöge's Lean release of the (Generalized) Riemann Hypothesis, decided by cert-machine

Written 2026-11-20, before any build, replay or judge run of the release. Committed before the first pod starts;
any later change is an amendment, dated and committed before the code or run it changes.

## The claim, pinned

- Levent Alpöge, "Remark", https://alpo.ge/remark.pdf (sha256 3fc97784…cfeb8d): "I believe I have, working with
  Claude, discovered a proof of the Riemann Hypothesis. In fact, the method easily extends much further, resolving
  the so-called Generalized Riemann Hypothesis … Claude and I have also formalized the arguments without
  assumptions." Footnote 1: the proof is https://alpo.ge/lean.tar.gz.part01 … part14.
- The archive: 14 parts, joined 239,275,554 bytes, sha256 9631b4f0…49c7fc; 175,187 Lean files, 17,374,215 lines;
  `leanprover/lean4:v4.33.1`; Mathlib at the tag `v4.33.1` (0df444a3), fetched by Lake, not vendored. Every pin:
  `corpus/alpoge-grh/PINS.json`. The third-party GitHub mirror is compared, never used.
- The five theorems of `Main.lean`: `riemannHypothesis : RiemannHypothesis` (Mathlib's definition) and four
  statements defined in the release's `Statements.lean` (which imports Mathlib only): ζ's zeros off the trivial
  ones on the line; Dirichlet L-functions nonvanishing for Re s > 1/2; their zeros in 0 < Re s < 1 on the line; the
  same for primitive characters.

## What is decided, and the verdict rules

Each check ends CERTIFIED, REFUTED or REFUSED (cannot be decided here, with the reason). The release is decided
claim by claim; there is no single overall stamp beyond the table.

| id | check | CERTIFIED iff | REFUTED iff | REFUSED iff |
|---|---|---|---|---|
| I1 | integrity | the 14 parts fetched on the pod match the pins; the archive extracts to the pinned file list | a part differs from its pin (then the claim's bytes are unstable; we stop) | — |
| I2 | the mirror | — (a comparison, reported as identical or with the list of differences; never a verdict on the claim) | | |
| B1 | build | a clean `lake build` of the default targets, official toolchain binary, Mathlib from `lake exe cache get` at the pin, exits 0, every module built, no `declaration uses 'sorry'` | the build fails at the pin | resources (time or memory) stop it |
| A1 | axioms | `#print axioms` of each of the five theorems ⊆ {propext, Classical.choice, Quot.sound} | any other axiom (sorryAx, Lean.ofReduceBool, Lean.trustCompiler, a declared axiom) | — |
| S1 | statement identity | Comparator (standalone, tag v4.33.0, with lean4export v4.33.0) accepts the release's `Main` against cert-machine's `instruments/alpoge-grh/Challenge.lean` (Mathlib alone + the four definitions + the five theorems with `sorry`), permitted axioms the three above; the challenge is built before the release is compiled on that machine; sandbox mode recorded | Comparator rejects (a statement or axiom mismatch) | the tool cannot run at this toolchain |
| K1 | Lean's kernel | implied by B1 | | |
| K2 | an independent kernel | nanoda accepts the lean4export export of the closure of the five theorems | an independent kernel rejects a declaration AND the rejection is reproduced and traced to an ill-typed term (otherwise: a disagreement, reported REFUSED until traced) | resources, or no export/kernel at this toolchain |
| K3 | further kernels | each further checker that can read the export (lean4lean; the checkers bundled with newer Lean, if the export format is compatible) is run and its result recorded | as K2 | as K2 |
| M1 | metaprogramming | every `run_cmd`, command elaborator and tactic macro in the release read and classified; none writes declarations or the environment beyond the five `run_cmd` that add library-suggestion deny-list entries (`BuildAid/D1–D5`) | one adds or alters declarations outside the kernel (K2 is the backstop either way) | — |
| F1 | fidelity of RH | a reading, with the checklist below, finds Mathlib's `RiemannHypothesis` at the pin equal to the classical statement | the reading finds a gap (stated) | — |
| F2 | fidelity of the four L-function statements | the same, for each; what "Generalized" covers here is stated (Dirichlet L-functions of every modulus; the Extended RH is not claimed by the Lean) | a gap | — |
| F3 | the remark's sentences | "a proof of the Riemann Hypothesis" ↔ F1 ∧ A1 ∧ B1; "resolving the … Generalized Riemann Hypothesis" ↔ F2 ∧ …; "formalized … without assumptions" ↔ A1 | a sentence the record contradicts | a sentence about the process (who found what, 250,000 pages) — not decidable from the bytes |

COMPUTED, not verdicts (reported, labelled dashed): P1, declarations of type `False` (and the syntactic forms
¬True, 0 = 1 in ℕ) anywhere in the closure; D1, the closure census (constants and modules the five theorems
depend on, Mathlib vs new, the top-level route), mapped to the remark's twenty dated steps where the names allow.

**F1 checklist** (Mathlib at 0df444a3): (a) the quantifier is over every s : ℂ with `riemannZeta s = 0`; (b) the
exclusions are exactly the trivial zeros −2(n+1), n ≥ 0, and s = 1; (c) `riemannZeta` agrees with Σ n^{−s} for
Re s > 1 and is differentiable on ℂ ∖ {1} (cited Mathlib theorems), so it is the classical ζ there by the identity
theorem; its value at s = 1 is a convention and s = 1 is excluded; (d) the conclusion is `s.re = 1 / 2` in ℝ.
**F2 checklist**: the same four points for `DirichletCharacter.LFunction` (every modulus N ≥ 1 via `NeZero`, every
character including imprimitive and principal; the pole handled by `χ ≠ 1 ∨ s ≠ 1`; the strip 0 < Re s < 1 for
the zero statements; a statement about imprimitive characters is not weaker than the primitive one).

## Controls (each must be refused, its falsity known by construction, not by the verdict)

- C1: the challenge with `1 / 2` replaced by `1 / 3` in `RiemannZetaZerosOnLine` → Comparator must reject.
- C2: a copy of `Main.lean` with `axiom cheat : RiemannHypothesis` used for `riemannHypothesis` → A1 and
  Comparator must reject.
- C3: a copy with `riemannHypothesis := sorry` → A1 and Comparator must reject.
- C4: a copy of `Statements.lean` with `def RiemannZetaZerosOnLine : Prop := True` → Comparator must reject.
- C5: the export with one proof term corrupted → nanoda must reject.

## Out of scope, stated before any result

Whether the mathematics is right as human mathematics (only the kernels' acceptance is decided); the
250,000-page document (not released); novelty and priority; the process narrative; anything about the Extended
Riemann Hypothesis. A kernel acceptance is as strong as the kernels: K2/K3 reduce that to "at least one of the
kernels is correct".

## Release rule

The record `certs/alpoge-grh-lean.json` is written only from pulled pod logs, with a `--check` that re-derives
every verdict from them; the report page leads with the gaps (every REFUSED and every reading); it goes out when
every row above has a verdict. Nothing is sent or posted without the operator's word for that item.

## Amendment A1 — the bridge between the two releases (2026-11-20 ~23:15 UTC, before any bridge code runs)

On the operator's "A bridge between both? Let's push!!": the August release (Anthropic's `formal-math/zeta23`, the Lean
of "More than two thirds of the zeros … are simple and on the critical line", Lean v4.33.0-rc2, Mathlib 51e6992e) and
today's release state theorems about the SAME Mathlib objects (`riemannZeta`, `DirichletCharacter.LFunction`), on
Mathlib commits 95 apart. The bridge puts both in one environment and composes them.

- **P0 (port).** zeta23 at formal-math 16a5ce41 is rebuilt on today's toolchain v4.33.1 and Mathlib 0df444a3. Every
  source change is listed file by file (expected: none or a few); its own Comparator configuration (17 statements,
  nanoda on) is re-run there. CERTIFIED iff its Comparator accepts; otherwise the port's failure is reported (a port
  failure says nothing against either release).
- **BRc (the conditional bridge, Mathlib + zeta23's Mathlib-only definitions, no proof from either release):**
  `RiemannHypothesis → N0star T₁ T₂ = Ndist T₁ T₂` for all windows, hence RH turns zeta23's distinct-zero bounds
  (5/6, and (3 − 1/c₁*)/2 with the Montgomery–Taylor window; dyadic and cumulative) into the same bounds for distinct
  zeros ON the critical line; and the primitive-character zero statement turns Theorem E's distinct bounds likewise.
- **BRu (the unconditional bridge):** in one environment holding both releases, the six statements above with the
  hypotheses discharged by `riemannHypothesis`, `LFunction_eq_zero_re_of_isPrimitive` (today's) and
  `five_sixths_distinct`, `five_sixths_distinct_cumulative`, `montgomery_taylor_distinct_mult(_cumulative)`,
  `dirichlet_five_sixths_distinct`, `dirichlet_montgomery_taylor_distinct_mult` (August's).
- **Judge and controls.** Comparator against cert-machine's bridge challenge (zeta23's Mathlib-only definitions
  verbatim + the six statements with `sorry`), the three standard axioms. Control BC1: the challenge with 5/6 replaced
  by 6/7 must be rejected. Axioms of each bridge theorem printed. CERTIFIED / REFUTED / REFUSED as in the table above.
- **What the bridge is and is not.** Mathematically it is a composition: given RH, "distinct and on the line" equals
  "distinct". Its value is the interlock: the two releases' statements refer to the same Mathlib constants and compose
  without a seam. It adds no mathematics beyond the two releases and claims no novelty (conditional results under RH
  are stronger in the literature); the page will say so.

## Amendment A2 — the statement bridge to Masullo's draft (2026-11-20 ~23:40 UTC, before the bridge file is compiled)

On the operator's "Both bridges": Alessandro Maria Masullo's all-human draft "The Music of the Primes" (940 pp.,
posted 2026-11-20 by Ravi Vakil, math216.wordpress.com; PDF sha256 e039d3f6cf0a4b14f03c7edb85097752dd65c0a2fe543c76fe992be234f97bf5)
claims GRH for all number fields and all unitary Hecke characters. Its main zero theorem (Theorem 13.3.1.2, p. 522)
is not stated in the draft ("Insert statement.", "State and prove the Main Theorems"; the trace formula above it
carries "Correct statement."; it cites a "Theorem ??"). §14.1.2 (p. 532, itself marked "Correct this subsection")
describes it: non-trivial zeros on 1/2 + iℝ and, off the centre, multiplicity ≤ [F : ℚ].

- **MR (READ ONCE, a reading):** `CertMachine.Masullo.ReadingQ` (instruments/alpoge-grh/bridge/CertMachine/MasulloReading.lean)
  is cert-machine's reading of that description at F = ℚ. It is re-checked against Theorem 13.3.1.2 when the draft
  states it; until then the record calls it a reading of a description, never Masullo's theorem.
- **MB (decided by Lean, Mathlib + zeta23's Mathlib-only layer):** ReadingQ ⇒ the zero statement of Alpöge's release
  for primitive characters; ReadingQ ⇒ every nontrivial zero of ζ off the real axis is on the line and simple; and
  what the reading adds (simplicity off the centre) is stated separately. Axioms printed. Nothing about the truth of
  Masullo's claim is decided: no Lean of it exists.

## Amendment A3 — after an outside red-team reading (2026-11-21 ~00:10 UTC, before phase 2 starts)

An independent reader from another model family red-teamed this plan at 0201d71c-era files (dde91825) and read the
statements a second time. Its findings were checked here against the sources before acting; every one below was
confirmed or adopted.

- **S1 configuration (confirmed defect, fixed).** The runner passed the four release-defined propositions to
  Comparator as `definition_names`. In Comparator v4.33.0 those are definition HOLES: name, type, universes and
  safety are compared, the bodies are not (README "Definition Holes"; Compare.lean `definitionHoleMatches`). S1 as
  configured could not have certified the four Dirichlet statements' bodies, and C1 and C4 (which change exactly such
  a body) would have been accepted. Fixed before any run: no `definition_names` in S1, C1–C4; the five theorem names
  stay, and Comparator then compares every constant their statements use, bodies included.
- **Host hygiene (adopted).** B1 ran release code as `tester`, the owner of the toolchain (~/.elan), the judges, the
  Mathlib packages and /results. Phase 2 now: makes /results and the export root-owned before any judge runs; rebuilds
  the judges as root in /opt/judges; runs every step with the official v4.33.1 release unpacked by root in
  /opt/toolchain (tester's copy hashed against it); compares the workspace's Mathlib .olean files with a clean
  root-owned cache download of the same revision; keeps the challenge-build hash check (exact list equality).
- **B1's exit status (confirmed defect, fixed).** B1's status was `tee`'s. B1V re-runs `lake build` with its own exit
  status, and the release's .olean set is reconciled with its 175,187 sources. The record reads B1 from B1V.
- **Controls (adopted).** C1–C4 count only with the expected diagnostic, after their builds succeed; A1 also runs on
  C2 (`cheat` must appear) and C3 (`sorryAx` must appear); C5 now runs on the release's own export (the theorem
  `riemannHypothesis` re-typed as `False`, its proof unchanged, must be rejected by nanoda); the toy C5 of the dry run
  is kept as a dry run only.
- **The recorder (adopted).** nanoda's success line at the pinned commit is "Checked N declarations with no errors";
  K2 also requires EXP's exit 0 and records the export's sha256; the run directory is named, not chosen by sort.
- **Wording (adopted).** "Without assumptions" is replaced by the exact axioms of each theorem; the claim is named
  "the Riemann Hypothesis and GRH for Dirichlet L-functions"; M1 reads "no declaration inserted outside the kernel's
  check was found" (`cpt_copy_thms` adds declarations through `addDecl`, which the kernel checks); P1 checks
  syntactically `False` and `¬True` (no more is claimed); K3 attempts are reported one by one.
- **Still open, planned:** a second, clean verifier (a fresh pod that never compiled release code: clean Mathlib,
  clean judges, the challenge built there) running Comparator and nanoda on the release's compiled modules, and an
  independently written specification of RH proved equivalent to Mathlib's in a Mathlib-only workspace.

**Correction to amendment A2 (Masullo).** The description of Theorem 13.3.1.2 opens §14.1.2 on page **528** (not
532), where the footnote "Correct this subsection." sits; page 529 places the central point at s = 1/2 − i·x₀ in the
draft's unnormalized coordinate, so the multiplicity bound is for non-central zeros; the location claim also appears in
prose on pages 30 and 55; Proposition 14.1.2.3 (page 531) states both conclusions conditionally on Conjectures
14.1.2.1–2. `ReadingQ` is the normalized (t = 0) primitive-Dirichlet specialization; twists |·|^{it} follow by
translation.

## Amendment A4 — the operator's answers (2026-11-21 ~00:20 UTC), before the checks they add run

- **Provenance of A3.** The outside reader of amendment A3 is **Astra 6.2**, prompted by cert-machine through the
  operator, named on the operator's word. Its answers were checked here against the sources before any change.
- **V (clean second verifier), added.** A fresh pod that never compiles release code (tools/runpod-alpoge-grh-verifier.sh):
  the official toolchain and the judges built there by root; the 14 parts fetched again and checked; its own clean
  Mathlib cache; the challenge built there BEFORE the release's compiled artifacts are copied in from the build pod;
  `lake build --no-build` must succeed (nothing of the release compiled there); then #print axioms, Comparator with
  nanoda ON against the challenge (no definition_names) and control C1. CERTIFIED for V iff Comparator accepts with both
  kernels and C1 is rejected with its diagnostic; REFUSED if Lake would rebuild or resources stop it.
- **SPEC (an independently written RH), added.** instruments/alpoge-grh/spec/Spec.lean, Mathlib only at the pin:
  `RHStrip` (every zero of ζ in the open critical strip has real part 1/2) proved equivalent to Mathlib's
  `RiemannHypothesis`, through `re_mem_strip_of_nontrivial` (a zero that is neither trivial nor 1 lies in the open
  strip: the zero-free region Re s ≥ 1 and the functional equation). CERTIFIED iff it compiles with the three standard
  axioms; it turns the RH fidelity row from two readings into a proof about the statement.
- **Release.** No private heads-up to Alpöge (the operator: skip it); public channels on the operator's word for each
  text: the Lean Zulip thread Tao's post names, a comment on Tao's post, one X post. Masullo: a short neutral section
  (what the draft claims; that Theorem 13.3.1.2 is not yet stated, with the page; our ℚ reading and its relation to
  the release's statements; no judgement of the mathematics).

## Amendment A5 — after Astra 6.2's second-round red team (2026-11-21 ~02:00 UTC), before phase 2 starts

Astra 6.2 reviewed the fixes at 59cc5699 (finding 1 closed; 2–11 partly closed or open) and named new holes. Adopted:
- **Gates.** The verifier stops (STOPPED) on any failed step its verdict depends on; its challenge build must be
  unchanged and non-empty after the copy; C1 must be rejected with a statement or definition mismatch; S1 must show
  both kernels' acceptance; nothing in .lake/build may change during V4 (manifest before/after). The bridge phase
  starts only after phase 2's export and only if S1 passed; each of its steps is a gate; the release's artifacts must
  be unchanged across the bridge build; the zeta23 source check is fatal.
- **Executables and toolchain.** The toolchain archive must match GitHub's published digest
  (sha256 890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235) on both pods; a `.lake/build/bin` in the
  release workspace (which `lake env` would put first on PATH) stops phase 2 and the verifier.
- **The copy.** tools/runpod-alpoge-grh-verifier-copy.sh copies only the release's compiled artifacts (no
  CertMachine/*, no bridge modules, no bin), and both ends' sha256 lists must be equal.
- **The recorder.** S1 counts as CERTIFIED only in sandbox mode; B1 requires exactly the pinned 175,187 sources, no
  missing and no extra .olean; MI requires no differing and no one-sided files (now .olean, .olean.* and .ilean);
  A1 on the controls requires the report's own exit 0; C5 requires a typechecker diagnostic and excludes OOM (137);
  K2 accepts only nanoda's plain success line; rows V, SPEC, P0, BRc+MB, BRu are added; `--check` prints which rows
  are not CERTIFIED.
- **Wording.** SPEC proves two formal statements equivalent over the same Mathlib `riemannZeta`; that the function is
  the classical ζ stays a reading (F1). The bridge's bounds read "for every ε > 0, eventually N₀* ≥ (c − ε)·N", N with
  multiplicity, N₀* counting each distinct zero once; dyadic and cumulative for ζ, dyadic for each fixed primitive χ mod
  q > 1 with no threshold uniform in χ; no simplicity bound follows.
- **Not adopted (stated):** an independent formal equivalence for the three Dirichlet statements (they are read twice);
  a separate positive control of nanoda through the stdin path (K2 is the positive control, through the file path).

## Amendment A6 — Astra 6.2's third reading, and the record already published at MIT (2026-11-21 ~02:30 UTC, before phase 2)

**Prior and parallel work, cited first.** Andrew Sutherland (MIT) published a verification record on 2026-11-20
(math.mit.edu/~drew/grh/, checks run with Claude Code; snapshot 22:05 UTC): all 175,187 modules compiled with zero errors
(direct `lean` calls, unsandboxed cloud machines); `#print axioms` standard for the five theorems; Mathlib .olean files
identical to the official cache; `leanchecker` replay 175,187/175,187; nanoda (full export) accepts; con-leche
(`--verified`) accepts 1,468,418 declarations; con-leche `--compare` matches all five challenge statements; lean4lean
module by module 175,187/175,187; `lake comparator` (Lean v4.36.0) statement and axiom check passed, kernels still
running. His export and olean manifest are published with SHA256SUMS. This record is a second, independent replication;
it adds what his does not state: planted-defect controls (C1–C5), a root-owned judge setup with the Mathlib check, a
Lean proof that the statement is the textbook RH (SPEC), the two bridges, and the route reading.

Adopted from the third reading (each confirmed in the code here):
- **K2** counts only with a positive declaration count, the export's digest present, and all five roots found in the
  export as theorems with a value (`export-roots.txt`, written by root after the export).
- **I1**: an absent or incomplete observation is REFUSED; REFUTED needs an observed digest mismatch.
- **The bridge** starts only on a completion record `EXPORT-OK` written after the export succeeded, was hashed, holds
  the five roots, and S1 met every condition (exit 0, acceptance line, sandbox, challenge build unchanged). The release
  artifacts are compared by sha256 (not size and time) before and after; the final comparison and BC1 (non-zero exit AND
  its diagnostic) are gates; BRu requires them.
- **RB (COMPUTED, new):** our release .olean files hashed in Sutherland's format and compared with his published
  manifest (sha256 375cbee2…, pinned by his SHA256SUMS): equality of compiled bytes across two independent compilations
  is measured, not required (independent compilations are reported to differ for some modules).
- **Wording corrections.** (1) A5's "no simplicity bound follows" is wrong: with N counted with multiplicity, D distinct
  and S simple zeros in a window, N ≥ S + 2(D − S), so S ≥ 2D − N; under RH the bridge's 5/6 − ε for distinct zeros on the
  line gives 2/3 − 2ε for simple zeros on the line — the constants the August release already states. Replacement: "The
  bridge improves the stated bound for distinct zeros on the line; the simplicity bounds it implies recover the August
  release's constants." (2) The percentages are not vacuous: the August release proves the zero counts diverge
  (`tendsto_Ncount_zero_atTop`, Zeta23/Main.lean). (3) Masullo: ReadingQ would give, on every window with
  0 ≤ T₁ < T₂, N₀ˢ = N_d = N for each normalized primitive character — one double zero at a positive ordinate would
  refute the reading while remaining compatible with RH and the bridge.

## Amendment A7 — the operator's answers after MIT's record (2026-11-21 ~02:40 UTC)

- **V is dropped** (the operator: "Drop it"). Sutherland's record and this run are two independent replications; RB
  (our compiled bytes against his published manifest) takes V's place as the cross-host evidence. The V row reads
  REFUSED with the reason "not run: dropped on the operator's word (A7)"; tools/runpod-alpoge-grh-verifier*.sh stay in
  the repository, unused.
- **Positioning** (the operator: "Second replication + extras"): the page leads with Sutherland's record, then what
  this one adds that his does not state — the planted-defect controls, SPEC, the two bridges, the route reading and RB.

## Amendment A8 — the public text (the operator, 2026-11-21 ~02:50 UTC)

The page and every post announce this work as it is — the checks run here, the controls, SPEC, the two bridges, the
route reading, RB — and do NOT call it a "second replication" or frame it against anyone else's record. A credits
section names everyone whose work the record uses or compares against: Levent Alpöge (the claim); Andrew Sutherland
(MIT's published manifest, used by RB); Astra 6.2 (the second readings and three red-team rounds); the August release
(Anthropic's formal-math/zeta23: Alpöge and Furman, Claude, the Lean by Eric Easley's team) for P0 and the bridges;
Alessandro Masullo, Ravi Vakil and Brian Conrad (the draft and its posting) for the Masullo section; Terence Tao's post
(the venue); the tools (Lean and Lake, Mathlib, Comparator and lean4export by the Lean FRO, nanoda by ammkrn, landrun).
A7's positioning sentence is superseded.

## Amendment A9 — the build moves to a larger machine (the operator, 2026-11-21 ~02:05 UTC), before it is created

On the operator's "Big pod builds, small pod checks": B1 is run again, from scratch, by the same phase-1 script
(tools/runpod-alpoge-grh-p1.sh, same pins, same paths, same user, same toolchain) on an 8×H100 SXM pod (224 vCPU,
~2 TB RAM; the GPUs are unused) — the largest machine in stock; the setup-file cleanup of DEVIATIONS item 5 runs there
too. When it finishes, the release's compiled files are copied to the checking pod phden71h9yeked (its own B1, running
since 22:09 UTC, is stopped first; its pre-B1 challenge build is kept), both ends' sha256 lists must be equal, and phase 2
runs there unchanged: B1V (`lake build` with its own exit status, which must not recompile anything copied) decides B1.
The record names the host of every step. If the large pod cannot be created or its build fails, the checking pod's own
B1 continues and nothing else changes.

## Amendment A10 — J. L. Nielsen's paper (2026-11-21 ~02:20 UTC), before phase 2

J. L. Nielsen, "The Invalidity of Alpöge's Proposed Proof of the Riemann Hypothesis" (PhilArchive NIEIOT-2,
20 Nov 2026), reads the source and argues that the geometric and lattice witnesses on the route are vacuously true
(`anyGeometry := True`, the degenerate model `divXFl` with the zero map `iMj` and `iMj_mem := Submodule.mem_top`, the
height `ht := hExpl6 …` assigned so the height equation holds by `rfl`), concluding the proposed proof is invalid; her
Appendix A grants that the paper does not show the term fails to typecheck. Checked here against the pinned archive:
`anyGeometry`, `divXFl`'s zero map and `ht := DV.hExpl6 …` are as she quotes. Added, COMPUTED (her check 2,
"Dependency walk"): the census lists which of the constants her paper names lie in the compiled closure of the five
theorems (NIELSEN lines of CEN.out). Her check 1 (independent kernel replay) is K2 here and is in Sutherland's record.
The record's reading: the degenerate witnesses are a confirmed finding about the route's named structure; that the
release "has not been shown to contain any proof of the Riemann Hypothesis" is not what a kernel acceptance of a closed
term of Mathlib's `RiemannHypothesis` on the three standard axioms says — the record reports both, and her paper is
credited.

## Amendment A11 (2026-11-21 ~02:25 UTC)

- **A9's larger pod abandoned.** The 4×H100 pod (uhsel7c0ri69nn, 112 vCPU; 8×H100 was out of stock) built 1,267 modules
  in its first 14 minutes, ~95 per minute, against the checking pod's ~170 per minute; it would have finished later, not
  sooner. It was deleted at 02:21 UTC (~US$6). Its first fetch from alpo.ge matched the pins (I1 PASS, a third time) and
  its challenge build hashed equal to the checking pod's (one file built on two machines, equal bytes). B1 stays on the
  checking pod, unchanged; the move script stays in the repository, unused.
- **WORDFACTS (COMPUTED, added on the operator's word):** the census traces, in the compiled closure, the constants named
  wordFacts_of / divClausesR_of / linkDIV_at_words / slope_bound_of_word_facts and every producer of a `DivInputsR` value:
  for each, its direct release-side dependencies and the size of its release-only dependency closure — a map of where the
  two inequalities of the divisor link come from, for readers; not a verdict.
- **Nielsen, the wording (the operator's choice):** "The geometric interpretation of this step remains unverified." Her
  findings about the code are confirmed here; her title goes beyond what her analysis establishes; the formal theorem
  is decided by the kernels, not by the names.

## Amendment A12 — four checks that make the decision stronger (the operator, 2026-11-21 ~12:30 UTC), before any of them runs

The operator's answers to "what is yet doable to make this verification stronger?": a clean-machine re-check (quote
first), the two statement readings turned into proofs, a third kernel planned now, and four cheap extras (a rerun kit,
a second reader for M1, a reading of the census, a Bitcoin timestamp). Each row below is fixed here before its code
runs; a statement change is a new amendment, a proof edit is recorded in DEVIATIONS.md.

| id | check | CERTIFIED iff | REFUTED iff | REFUSED iff |
|---|---|---|---|---|
| CHAR | the textbook statements, proved | `instruments/alpoge-grh/spec/Textbook.lean` (statements below) compiles in the root-owned Mathlib-only workspace of SPEC (`/root/specws`, Mathlib 0df444a3 from a clean cache, no release code), with `instruments/alpoge-grh/Challenge.lean` beside it for its definitions only; no `sorry`; `#print axioms` of its eight theorems ⊆ {propext, Classical.choice, Quot.sound} | — (a failed proof is not a refutation) | it cannot be proved here (the reason stated) |
| K3 | a third kernel, and a second statement judge | con-leche (leanprover/con-leche @ 5ea446d5c79d23ef1f954215d094db2162f1ab6f, its own toolchain v4.36.0, built from source by root on the build pod after phase 2) accepts phase 2's export (`/data/export.ndjson`, sha256 equal to `export.sha256`) in its default verified mode, AND `con-leche --compare` accepts that export against the challenge's own export (lean4export of `CertMachine.Challenge`, the five theorems as roots), AND both controls are rejected: K3C1 (`--compare` against the export of control C1's challenge, `1 / 3`) and K3C5 (C5's export, `riemannHypothesis` re-typed as `False`) | as K2 | resources, or the export format unreadable by con-leche (lean4lean is not run on the whole closure: with default fuel it times out on single modules, as MIT's record shows) |
| CR | a clean machine agrees | on a fresh RunPod CPU pod that never ran the release's code, created only on the operator's word after a price quote (once EXP has produced the export and its size is known): the official toolchain (digest 890afd18… enforced), Mathlib 0df444a3 from `lake exe cache get`, `Challenge.lean` and control C1's challenge built there, lean4export v4.33.0, nanoda 0da9f98f and con-leche 5ea446d5 built there by root from source; the ONLY input from the build pod is the export file, accepted only if its sha256 equals the value already in the committed record. Then: nanoda accepts it (CRK); `con-leche --compare` accepts it against the challenge exported THERE (CRS); and the controls are rejected there: C5's re-typed export by nanoda (CRC5) and by con-leche (CRC5c), C1's challenge by `con-leche --compare` (CRC1) | as K2 | not run (the operator declines the quote: "not run: on the operator's word"), or resources |

COMPUTED on the clean pod (not a verdict): the sha256 of the challenge's `.olean` files built there, against the build
pod's (one file built on two machines). The rejections of the controls count only with a diagnostic naming the
planted declaration; an exit by kill or timeout (137, 124) is not a rejection.

**CHAR's statements** (Mathlib only; namespace `CertMachine.Textbook`). ζ and L(·, χ) are characterised WITHOUT
Mathlib's `riemannZeta` and `LFunction`: a function holomorphic on ℂ ∖ {1} that equals the Dirichlet series
Σ_{n≥1} n^{−s} (resp. Σ_{n≥1} χ(n) n^{−s}) for Re s > 1, the series summed as `HasSum` (unconditional convergence,
no junk value).

```lean
def IsTextbookZeta (f : ℂ → ℂ) : Prop :=
  DifferentiableOn ℂ f {1}ᶜ ∧
    ∀ s : ℂ, 1 < s.re → HasSum (fun n : ℕ => 1 / ((n + 1 : ℕ) : ℂ) ^ s) (f s)
def IsTextbookL {N : ℕ} (χ : DirichletCharacter ℂ N) (f : ℂ → ℂ) : Prop :=
  DifferentiableOn ℂ f {1}ᶜ ∧
    ∀ s : ℂ, 1 < s.re → HasSum (fun n : ℕ => χ ((n + 1 : ℕ) : ZMod N) / ((n + 1 : ℕ) : ℂ) ^ s) (f s)
def TextbookRH : Prop :=
  ∀ f : ℂ → ℂ, IsTextbookZeta f → ∀ s : ℂ, 0 < s.re → s.re < 1 → f s = 0 → s.re = 1 / 2
def TextbookGRH : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (f : ℂ → ℂ), IsTextbookL χ f →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → f s = 0 → s.re = 1 / 2
theorem isTextbookZeta_riemannZeta : IsTextbookZeta riemannZeta
theorem isTextbookL_LFunction (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) :
    IsTextbookL χ (DirichletCharacter.LFunction χ)
theorem eqOn_riemannZeta {f : ℂ → ℂ} (hf : IsTextbookZeta f) : Set.EqOn f riemannZeta {1}ᶜ
theorem eqOn_LFunction {N : ℕ} [NeZero N] {χ : DirichletCharacter ℂ N} {f : ℂ → ℂ} (hf : IsTextbookL χ f) :
    Set.EqOn f (DirichletCharacter.LFunction χ) {1}ᶜ
theorem textbookRH_of_riemannHypothesis (h : RiemannHypothesis) : TextbookRH
theorem textbookGRH_of (h : DirichletLZerosOnLine) : TextbookGRH
theorem riemannHypothesis_of_textbookRH (h : TextbookRH) : RiemannHypothesis
theorem dirichletLZerosOnLine_of_textbookGRH (h : TextbookGRH) : DirichletLZerosOnLine
```

The first two say the characterisations are met (the statements are not vacuous); the next two that they determine
the function on ℂ ∖ {1} (identity theorem); the last four that the release's statements, as the challenge defines them
(`RiemannHypothesis` is Mathlib's; `DirichletLZerosOnLine` is the challenge's definition, the constant S1 matches),
are EQUIVALENT to the textbook ones. With S1, the record can then say the release proves RH and GRH for Dirichlet
L-functions with ζ and L defined by their series, resting on Mathlib's complex numbers, powers, sums, derivatives and
characters, not on its definitions of ζ or L. F1 and F2 stay readings (read twice); CHAR is the proof beside them.

**Where they run, and in what order.** CHAR: now, in `/root/specws` on the build pod (root, Mathlib only, as SPEC).
K3: a new script `tools/runpod-alpoge-grh-p4.sh`, started on the build pod now, waiting until "phase 2 done" and the
bridge has finished (done, not started, or stopped), so it never competes with KR or the bridge for memory. CR:
`tools/runpod-alpoge-grh-clean.sh`, on the operator's word after the quote.

**The extras (not verdicts).**
- *Rerun kit* (`instruments/alpoge-grh/rerun/`): the scripts at their commit, the pins, and the expected values of
  every row taken from the final record, so that anyone can reproduce each number on a Linux machine of their own.
- *M1, a second reading*: Astra 6.2 reads the release's metaprogramming from the pinned archive's file list, with the
  prompt recorded; M1 becomes READ TWICE if the readings agree, and a disagreement is reported as found.
- *The census, read*: Astra 6.2 reads the NIELSEN and WORDFACTS lines when CEN lands; a reading, labelled as one.
- *A Bitcoin timestamp*: an OpenTimestamps proof of this file (with this amendment), `PINS.json` and the scripts at
  the A12 commit, made before S1 and K2 report; the `.ots` files go to `corpus/alpoge-grh/timestamps/`.

**Budget.** K3 adds well under an hour of the build pod (MIT's record: con-leche checked this closure in 3 min 15 s on
64 workers, 46 GiB peak). CR is quoted before it is created (MIT's record: nanoda 28 min, 89 GB peak; the pod needs
≥ 128 GB of memory). The lane's ceiling stays US$150.

## Amendment A13 — the challenge-unchanged gate reads the compiled files only (2026-11-21 ~17:10 UTC), before S1 runs

B1 ended at 16:55:08 UTC: exit 0, "Build completed successfully (183903 jobs)", 175,188 .olean files, no `sorry`.
Phase 1 then logged "WARNING: challenge build CHANGED during B1". The difference, file by file, against
`challenge-build.sha256` (taken before B1):
- `ir/CertMachine/Challenge.c` is now empty (sha256 e3b0c442…), emptied by the loop of DEVIATIONS item 4
  (22:42–22:47 UTC on 11-20);
- `ir/CertMachine/Challenge.setup.json` is gone, removed by the setup-file loop of DEVIATIONS item 5.
- The compiled challenge is unchanged: `lib/lean/CertMachine/Challenge.olean`, `.ilean`, their `.hash` files and the
  `.trace`. `ir/…/Challenge.c.hash` is unchanged too.

Both changes are this run's own disk-saving steps, logged when they were made. Neither file is read by Comparator,
lean4export, the kernels or `#print axioms`, all of which read the `.olean` files. Phase 2's gate before S1, and the
recorder, compared every `CertMachine/Challenge.*` file. Left as written, the gate would fail S1's precondition for a
reason that says nothing about the challenge's meaning.

Changed, before S1 runs: the gate, in `tools/runpod-alpoge-grh-p2.sh` and in `tools/check-alpoge-grh.py`, compares
the challenge's files under `lib/lean/` only: the `.olean`, the `.ilean`, their `.hash` files and the `.trace`.

Phase 2 was in its first step (the judges rebuilt by root) when this was found. It is stopped, `/opt/judges` is moved
aside, and phase 2 is restarted from the corrected script, from its start. No judge, gate or check of phase 2 had
reported. The full before/after lists stay in the run (`challenge-build.sha256`, `challenge-build.after-B1.sha256`).

**Correction to amendment A13 (17:10 UTC).** Phase 2 had gone further than A13 says when it was halted. It had rebuilt the judges (exit 0), run B1V (exit 0 after 140 s) and the reconcile (175,187 sources, 175,187 oleans, none missing or extra), and had begun the Mathlib integrity download. None of these depends on the challenge gate; all are run again by the restart.

The control room's halt line in `_phase.log` contained the word the scripts use as their stop signal. It made the restarted phase 2 refuse to start ("phase 2 not started"). It would have made the bridge and con-leche waiters give up at their next poll. Those two waiters were stopped before they polled (their logs show nothing). Then:
- the log was kept verbatim as `_phase.log.part1` (sha256 737f65a5…);
- a continuation `_phase.log` was started: part 1's lines up to "phase 1 done", plus one line naming part 1 and its sha256;
- phase 2, the bridge (its script unchanged, sha256 ba6ae330…, audit 9ce3c598) and con-leche (unchanged, 52800ebc…, audit 59bd80fc) were restarted at 17:01 UTC.
The recorder reads the continuation; part 1 stays in the run.

## Amendment A14 — MI compares the compiled artifacts A5 names (2026-11-21 ~17:20 UTC), AFTER MI reported — disclosed as such

MI ran at 17:05 UTC and reported 60,860 files in common, 0 only on one side, and 2 differing. Both differing files are Lake's `.hash` sidecars (`Mathlib/Tactic/FastInstance.olean.hash`, `Mathlib/Topology/Category/TopCat/ULift.olean.server.hash`). Each holds the same number on both sides, with and without leading zeros: `0033606662060955` vs `33606662060955`, and `0192040428878591` vs `192040428878591`. The `.olean` files they describe are byte-identical (`mathlib-hash-sidecars.txt`).

Amendment A5 defines the compared set as ".olean and its .private/.server parts, .ilean". The script's test, `'.olean' in f`, also took in the `.hash` sidecars, which are not compiled artifacts. The recorder now applies A5's set. A difference confined to `.hash` sidecars, with the whole difference list present, does not count, and the row says how many sidecars differed. This change was made after the result was seen. It is marked here and in DEVIATIONS item 10 so a reader can weigh it.

## Amendment A15 — a parallel pod for KR, the export, K2 and C5 (the operator, 2026-11-22 ~02:10 UTC), before any of them runs

**Why.** The operator asked for the check to finish as soon as possible. Phase 2 runs its steps one after another on the build pod, and two of them are long single-process runs: S1 (Comparator v4.33.0 takes the whole export into memory, parses it, and replays it in Lean's kernel on one thread) and KR. At 01:50 UTC S1 was still in its export, 3.4 h in, with the pod at its memory limit (187 of 238 GB in use by the two processes; no out-of-memory event).

**What changes.**
- A second pod of the same shape (32 vCPU, 256 GB) is set up with `tools/runpod-alpoge-grh-verifier.sh setup`, unchanged: the official toolchain by its published digest, the judges built by root, the 14 parts fetched again against the pins, the challenge built before any release artifact arrives.
- The release's compiled artifacts are copied from the build pod with `tools/runpod-alpoge-grh-verifier-copy.sh`, unchanged: both ends hash every copied file, and the copy is refused unless the two lists are equal.
- `tools/runpod-alpoge-grh-parallel.sh` (new, at this commit) then runs there: KR, and separately EXP, K2 and C5. Its roots check and its C5 rewriter are phase 2's own blocks, byte for byte; nanoda's configuration is phase 2's.
- Row V stays dropped (A7). None of its checks runs.

**Verdict rules, fixed now.**
- **KR** is read from the parallel pod. CERTIFIED: `leanchecker --fresh Main` exits 0 there, the copy's lists are equal, and the challenge is unchanged by the copy. REFUSED: a timeout or an out-of-memory kill. REFUTED: any other exit. The row says where it ran. When the build pod's own phase 2 reaches its KR step, the control room stops that step; it is recorded as stopped under this amendment, not as a verdict.
- **K2 and C5** keep their registered meaning and are read from the build pod's own export. The parallel pod's K2 and C5 are reported beside them as a second run, with both exports' sha256.
- **S1, C1–C4, the bridge, K3 and CR** are unchanged. The bridge still starts only after the build pod's export and only if S1 passed.
- If the parallel pod cannot be set up, or the copy is refused, nothing changes and phase 2 continues as registered.
- The recorder (`tools/check-alpoge-grh.py`) will read KR from `corpus/alpoge-grh/runs-parallel/`; that change is committed before KR reports.

**Disclosed side effect.** Hashing and reading the build's files for the copy competes with S1 for the build pod's file cache, because that pod is at its memory limit. S1 may slow while the copy runs.

**Cost.** US$1.76 an hour (the catalog's price for this shape, read at 02:00 UTC), expected US$35–45. Spent so far: US$54.51 (billing read, 01:57 UTC). The lane's ceiling stays US$150.

## Amendment A16 — a second run of S1 on the parallel pod, as a backup (the operator, 2026-11-22 ~03:45 UTC), before it runs

**Why.** At 03:38 UTC the build pod's S1 was still in its export, 5.2 hours in. The same export on the parallel pod wrote 46.8 GB in its first hour. The build pod is at its memory limit (188 of 238 GB in use, no out-of-memory event), so its file cache is squeezed and the export crawls; the parse and the kernel replay that follow need more memory still. The run may be killed for memory, which would leave the statement check REFUSED on resources.

**What changes.**
- `tools/runpod-alpoge-grh-parallel-s1.sh` (new, at this commit) runs S1 a second time on the parallel pod, once that pod's export, K2 and C5 have ended, so the judge has the memory to itself.
- It is the same judge with the same settings: Comparator at tag v4.33.0 rebuilt on v4.33.1 by root, phase 2's `s1.json` (no definition names, nanoda off), the same sandbox test, and the same challenge-unchanged gate on the compiled challenge files (A13).
- The challenge is the one the parallel pod built at its setup, from the same `Challenge.lean`, before any release artifact arrived there.
- One gate is added, taken from the dropped row V: `lake build --no-build` must succeed first, so nothing of the release is compiled on that pod.
- The build pod's S1 is left running, untouched.

**Verdict rule, fixed now.**
- S1 is CERTIFIED if either run passes every gate of S1: exit 0, both acceptance lines, sandbox mode, the challenge unchanged. For the parallel pod's run, the copy's two sha256 lists must also be equal. The row says which pod.
- If one run accepts and the other REJECTS, S1 is REFUSED until the disagreement is explained.
- If the parallel pod's run rejects before the build pod's has a verdict, S1 is REFUSED until that rejection is traced.
- A run stopped on resources decides nothing. If both stop on resources, S1 is REFUSED on resources.
- The controls C1–C4, the bridge's gate and everything else on the build pod are unchanged. If S1 is certified only by the parallel pod's run, the bridge's start (which reads the build pod's own S1) is settled by a further dated amendment before it is touched.

**Cost.** The parallel pod stays up for the length of this run, perhaps 10–20 hours at US$1.76 an hour.

## Amendment A17 — S1 and its control C1 on a machine with more memory (the operator, 2026-11-22 ~04:39 UTC), before either runs there

**Why.** Measured on the pods, 04:17–04:35 UTC:
- The export of the five theorems' closure is 61,571,290,481 bytes. The parallel pod wrote it in 5,988 s with memory free.
- Comparator v4.33.0 reads that whole text into memory before it parses it, while lean4export, its child, still holds its own data. On the build pod Comparator held 126.5 GB and lean4export 80.9 GB.
- The build pod stood at its limit: 255,998,107,648 of 256,000,000,000 bytes, 201.8 GB of it anonymous. The limit had been hit 2,488,490 times, with no out-of-memory kill.
- At the limit the kernel keeps evicting the compiled proof files the export reads. In 20 seconds lean4export got 0.07 s of user time and 10.2 s of system time. S1 was 6 h 6 min in and still exporting.
- The parallel pod has the same limit, so A16's backup run would have met the same wall, beside KR. It was cancelled at 04:27 UTC, before it started (the line is in that pod's `_parallel.log`). There is no A16 run to report.
- The parse and the kernel replay that follow the export need more memory still. How much is not known.

**What changes.**
- A third pod, "the larger machine" (RunPod `bmwjdc3l37zuwh`, four RTX PRO 4500 cards rented for the memory that comes with them), has a limit of 376,000,000,000 bytes and Landlock ABI 4.
- It is set up with the dropped row V's own setup script at this commit, as the parallel pod was: the official toolchain by its published digest, the judges built by root, the 14 parts fetched again against the pins, `Challenge.lean` and control C1's challenge built there before any release artifact arrives.
- It receives the compiled release by `tools/runpod-alpoge-grh-verifier-copy.sh`: both ends' sha256 lists equal, or the copy is refused.
- `tools/runpod-alpoge-grh-judge.sh` (new, at this commit) then runs, in order: the copy's gates; `lake build --no-build`, which must succeed, so nothing of the release is compiled there; S1 with phase 2's `s1.json`; C1 with phase 2's `c1.json`.
- The build pod's S1 is stopped by the control room once this amendment is public: its Comparator and lean4export processes are killed. A marker file `/results/S1.stopped` records the time, the reason and the measurements above. The stopped run decides nothing.
- The build pod's C1 is the same judge on the same closure and would meet the same wall. It is stopped the same way when it starts, with `/results/C1.stopped`.
- Everything else on the build pod runs as registered: C2, C3 and C4 (their closures are small), EXP, K2, C5. Its own KR is stopped when it starts, as A15 fixed.

**Verdict rules, fixed now.**
- S1 is CERTIFIED if the larger machine's run passes every gate of S1: exit 0, both acceptance lines, sandbox mode, the compiled challenge unchanged since that machine's setup, the copy's two lists equal. The row says where it ran.
- A rejection there makes S1 REFUSED until it is traced. If the trace shows the release's statements or axioms differ from the challenge's, S1 becomes REFUTED by a dated amendment that names the diagnostic. If it shows a fault of the copy or the setup, the run is repeated.
- A run stopped on resources decides nothing. If the larger machine's run stops on resources, S1 is REFUSED on resources.
- C1 is read from the larger machine. It counts as rejected only with its diagnostic naming the planted statement, with an exit that is not 0, 124 or 137, and with the control challenge built there at setup.
- C2, C3 and C4 are read from the build pod, as before.

**What this does to the other rows.**
- *The bridge (BRu).* Its gate reads the build pod's own S1, so the build pod will log EXPORT-NOT-OK and the bridge will not start there. Its own Comparator step judges the same closure and would need the same memory. Whether and where it runs is settled by a further dated amendment, after the larger machine's S1 has a verdict. Until then BRu has no verdict.
- *K3.* It needs the build pod's export, not its S1. It starts by itself when phase 2 and the bridge's wait are over. Its `--compare` is the second statement judge of A12 and is untouched.
- *CR.* Its only input is the build pod's export. The clean pod is created once that export has its digest and its five roots (A12's own condition, "once EXP has produced the export"), on the operator's word of 2026-11-21 to recreate it then.

**Cost.** US$2.88 an hour (the catalog's price, read at 04:20 UTC) for an estimated 15–20 hours: US$45–60. Spent on this lane so far: about US$62 (billing read, 04:36 UTC; the last hour is not in it yet). With three pods running, the lane's total is now expected to reach about US$170, above the US$150 ceiling. The operator chose this machine at its hourly price; the estimate is put to him in the next report, and the ceiling is his to raise or hold.

**Correction (04:40 UTC).** The first commit of this amendment (d6db39e7, made at 04:39 UTC) gave its own time as ~04:55, the billing read as 04:45, and S1's age as 6 h 9 min. All three were written ahead of the clock. The times above are the corrected ones; nothing else changed. S1 was still running on the build pod at this correction.

**Done (04:41 UTC).** The build pod's S1 was stopped at 04:41:14 UTC (exit 137 after 22,414 s) and its C1 at 04:41:18 UTC, each with its marker file. The larger machine's setup had finished at 04:41:51 UTC, at commit d6db39e7.

**The ceiling (the operator, 2026-11-22 04:58 UTC).** Asked with the estimate above (about US$170), the operator raised the lane's ceiling from US$150 to US$200.

## Amendment A18 — nanoda's acceptance line, read as nanoda prints it (2026-11-22 05:05 UTC), before the registered K2 reports

**What was found.** The parallel pod's nanoda run ended at 04:59 UTC with exit 0 and this output:

```
Checked 1484729 declarations with no typechecker errors, 1 pretty printer errors: [
    "Unable to print axioms",
]
```

The recorder looked for the words `with no errors` and would have read this acceptance as "a disagreement". The registered K2, on the build pod's own export, has not started: that export is still being written.

**Why nanoda prints it.** nanoda's `print_axioms` option is on by default, and this run's configuration names no pretty-printer destination. nanoda then checks every declaration, cannot print the axioms, and reports that as a pretty-printer error beside its count (`src/main.rs` and `src/pretty_printer.rs` at 0da9f98f). The note says nothing about the type check. The small-export test in the committed record, made before phase 2 (`derisk.txt`), shows the same line on acceptance and exit 101 on a planted wrong literal. I did not adapt the reader then; that was my miss.

**What changes.**
- The recorder reads nanoda's acceptance with one function, `nanoda_accepts`. It takes either `Checked N declarations with no errors`, or `Checked N declarations with no typechecker errors, 1 pretty printer errors: ["Unable to print axioms"]`. Exit 0 is still required, and so are the export's digest and its five roots.
- Any other pretty-printer error, a second one, or any other text is not an acceptance: REFUSED until read.
- The clean-machine gate (`tools/runpod-alpoge-grh-clean.sh`, rows CRK and CRC5) uses the same two patterns. That script has not run its check step.
- K2's rule is unchanged: nanoda accepts the export of the closure of the five theorems. The configuration of the registered run is unchanged.

**One thing this form does not say.** With the plain form, nanoda also names any axiom it skipped as not permitted; in this form it does not. Two facts cover that. First, the export is the closure of the five roots, so every axiom in it is used, and a skipped axiom would leave its users without a constant they need. Second, COMPUTED on the parallel pod's export (sha256 4301ce48…): a scan of all 61,571,290,481 bytes finds exactly three axiom records, and their names resolve to `propext`, `Quot.sound` and `Classical.choice`. The same scan is run on the build pod's export when it exists, and reported beside K2.

**Disclosure.** This amendment is written after the parallel pod's K2 reported, and before the registered K2 has run. The parallel pod's K2 is reported beside the registered one (A15), not as its verdict.

## Amendment A19 — what follows the larger machine's S1, either way (the operator, 2026-11-22 ~09:00 UTC; written 09:39 UTC), before S1 has a verdict

**State when this is written.** S1 has been running on the larger machine since 05:02 UTC. Its memory reached 356 GB of the 376 GB limit at 07:21 UTC and has stayed there while it works; nothing has been killed. No result of S1 is known.

**The operator's two answers** (asked in the session, about 09:00 UTC):
1. If S1 runs out of memory there, it is recorded as refused on resources. No larger machine is rented.
2. The bridge (BRu) runs on the larger machine only if S1 passes there.

**If S1 stops on resources.**
- S1 is REFUSED on resources, as A17 already fixed.
- C1 is not run. It is the same judge on the same proof and needs the same memory. The row C1–C5 is then REFUSED on resources, with each control that ran reported one by one (C2, C3, C4 and C5 were each rejected on the build pod).
- BRu is REFUSED on resources. Its two Comparator runs read a slightly larger proof.
- The larger machine is deleted once its results are home.
- The statement is still judged by the second statement judge of A12: con-leche's comparison, CERTIFIED on the build pod (K3) and repeated on the clean machine (CR). The record says which judge decided what.

**If S1 passes.**
- C1 runs next on the larger machine, as A17 fixed.
- Then the bridge runs there, with `tools/runpod-alpoge-grh-judge-bridge.sh` (new, at this commit). From its `gate()` helper to its last step it is the build pod's bridge script line for line; one comment line names this file. What differs is above that: the unprivileged user, the log file (`_bridge.log`), and the start condition.
- Start condition: the judge script has ended, and S1 passed there with every condition of A17 (exit 0, both acceptance lines, the sandbox, the compiled challenge unchanged, the copy's lists equal, `lake build --no-build` exit 0).
- The bridge build compiles the August release's 326 sources and cert-machine's bridge files on that machine. It compiles nothing of the release under test: the release's artifacts are listed before and after, and any change stops the bridge.
- BRu's rule is unchanged: the build exits 0, no release artifact changed, the six bridge theorems rest on the three standard axioms, the control BC1 is rejected with its diagnostic, and Comparator accepts the six statements against the bridge challenge. The row says where it ran.
- A bridge Comparator run that stops on resources makes BRu REFUSED on resources.

**If S1 rejects the release.** A17's rule stands: REFUSED until traced. The bridge does not run.

**Cost.** If S1 passes: about 10–14 more hours at US$2.88 an hour, US$30–40. Spent on this lane so far: about US$93 of the US$200 ceiling.

## Amendment A20 — the clean machine's gate line misread one rejection (2026-11-22 10:43 UTC), AFTER CR reported — disclosed as such

**What happened.** The clean machine ran its five steps and ended at 10:41 UTC. Its own script then logged "CR: 4 of 5 gates held", with "CRC1 was not rejected with its diagnostic".

**What CRC1's output says.** Exit 1, and this line: `con-leche: invalid: axiom riemannZeta_eq_zero_re is not justified by the solution: its type reads RiemannZetaZerosOnLine, which the solution does not declare alike`. By A12's rule that is a rejection with a diagnostic that names the planted declaration.

**The fault, mine.** The script's gate for CRC1 had a third test, meant to exclude an acceptance: no line containing the words "justified by the solution". con-leche's rejection line contains those words after "is not". So the gate refused a correct rejection. The same control with the same wording had already been read correctly on the build pod (K3), where the recorder's test is "no line `accepted N declarations`".

**What changes.**
- The recorder decides CR from the clean machine's five outputs, by A12's rule and with K3's tests. A control counts as rejected when its exit is not 0, 124 or 137, its output names the planted declaration, and it has no acceptance line (`accepted N declarations`, or `theorem X justified by the solution`).
- The pod's gate line stays in the record exactly as it was logged, and the row says the verdict was decided from the outputs.
- `tools/runpod-alpoge-grh-clean.sh` gets the corrected test, for anyone who reruns it.
- Nothing was rerun, and no output was edited.

**Disclosure.** This changes how a result is read, and it was made after the result was seen. It can be checked against the five output files in `corpus/alpoge-grh/runs-clean/pzyamyxbl8ncom/` and against A12's rule. The recorder's new reading was tested on six altered copies of the run (the control accepted, the control killed, C5 exiting 0, one theorem not justified, a nanoda line that is not an acceptance, a wrong export digest): each is refused.

## Amendment A21 — the unconditional bridge is dropped on cost; a guard on the larger machine (the operator, 2026-11-22 about 22:25 UTC; written 22:41 UTC), before S1 has a verdict

**State when this is written.** S1 has been running on the larger machine for 17.6 hours, at about 345 GB of the 376 GB limit; nothing has been killed. No result of S1 is known. The judge's source compares the statements before it replays the proof, so a run still alive should be in the replay; that is a reading of the code, not a result.

**Why.** A19 estimated the bridge at 10 to 14 hours and US$30 to 40 after S1. S1's own length now puts it at about 20 hours and US$58: the bridge's judge reads a slightly larger proof than S1 does. That would take this lane to about US$205, above the operator's ceiling of US$200, and delay the last row by about a day. Asked in the session, the operator answered: drop it now, add it later.

**What changes.**
- The unconditional bridge (BRu) is not run on the larger machine. Its row is REFUSED, with the reason "not run: dropped on cost before S1 had a verdict". The waiter that would have started it (A19) is stopped, and the marker `BRu.dropped` is written on the machine and in the record.
- Nothing else about S1 or C1 changes. If S1 passes, C1 runs next, as A17 fixed.
- The conditional bridge and the Masullo reading (BRc+MB) and the August release's own rebuild (P0) were CERTIFIED earlier and do not depend on this.
- The bridge can be run later as its own follow-up, with its own budget and its own registration. A later result would be added to the page as a dated addition; this record keeps the row as REFUSED at the time of the release.

**A guard on the machine.** A19 fixed that C1 is not run if S1 stops on resources. Until now that was enforced from the operator's Mac. `tools/runpod-alpoge-grh-judge-guard.sh` (new, at this commit) enforces it on the machine: if S1 is killed, times out, or exits non-zero with the kernel's out-of-memory counter above zero, it stops the judge script and writes `C1.not-run`. On any other exit, 0 included, it does nothing.

**Disclosure.** This changes which rows are run, for a reason of cost. It is written and published before S1 has reported, and it cannot depend on S1's result.

## Amendment A22 — how S1's and C1's outputs are carried home (written 04:11 UTC on 2026-11-23), before S1 has a verdict

**State when this is written.** S1 has run on the larger machine since 2026-11-22 05:02:50 UTC; no exit, nothing killed.
Its stdout, `S1.out`, is the replay of the build plus Comparator's own lines, about 168.6 MB (its file time is the end of
the build replay; Comparator has written nothing since). No result of S1 is known.

**Why.** A red-team of the release texts (Astra 6.2, 2026-11-23) found that the closing checklist pulls `/results` with
`--max-size=5m --exclude S1.out`, while the recorder looks for Comparator's two acceptance lines in `S1.out`. Followed as
written, an accepted run would have been recorded as a rejection. The file is too large for the repository (GitHub
refuses files over 100 MB).

**What changes.** The recorder reads `S1.out` if present, else `S1.tail`; and `C1.out` if present, else `C1.tail`
(`tools/check-alpoge-grh.py`, at this commit). Each tail is made on the machine after its step exits, as the last 400
lines of the full file (`tail -n 400`), and the full file's sha256 and byte count are recorded beside it in the machine's
hash list, which the pull checks. This is the rule `B1V.tail` and `NOBUILD.tail.txt` already follow. The acceptance and
rejection criteria are unchanged. No other row is affected; `--check` re-derives the record unchanged at this commit.

**Disclosure.** This changes how evidence is carried, not what counts as a pass. It is written and published before S1
has reported, and it cannot depend on S1's result.

## Amendment A23 — how the larger machine's S1 stop and C1 are read (written 05:05 UTC on 2026-11-23), before S1 has a verdict and before C1 has run

**State when this is written.** S1 has run on the larger machine since 2026-11-22 05:02:50 UTC; no exit. C1 has not
started there. No result of either is known.

**Why.** Astra 6.2's red-team of the release texts (2026-11-23) found three ways the recorder could read the end of the
run more loosely than the registration intends. (1) A17 says C1 on the larger machine counts as rejected when its
diagnostic names the planted statement; the recorder used the generic pattern `do not match|does not match`, which a
rejection naming another declaration would also meet. (2) Exit 137 is also a manual kill, so it does not by itself
establish a stop on resources. (3) The A19 reading ("C1 not run") did not require the guard's own marker.

**What changes** (`tools/check-alpoge-grh.py`, at this commit; criteria for a pass are unchanged):
- C1 on the larger machine counts as rejected only if its diagnostic names `RiemannZetaZerosOnLine` or
  `riemannZeta_eq_zero_re` and Comparator did not print its acceptance — the test K3C1 and CRC1 already use. A C1 that
  stops without such a diagnostic makes the controls row REFUSED until traced (not REFUTED, which stays for a control
  that is accepted).
- On the larger machine, S1 reads "resources" from exit 124, or from exit 137 with the guard's `oom_kill` above 0 or an
  out-of-memory line in S1's output. Exit 137 with neither reads "killed, cause not established". S1 is REFUSED either
  way; only the stated reason differs.
- The A19 branch of the controls row requires the guard's marker `C1.not-run` in the larger machine's run, and records
  `C1.start` when present (the guard stops the judge script within seconds of S1's exit, so C1 can have started).
- Tested on a copy of the record with planted endings: exit 137 with `oom_kill` 0 reads "killed"; with `oom_kill` 3,
  "resources"; an accepted S1 with a C1 naming the plant gives S1 and C1–C5 CERTIFIED; a C1 naming something else
  gives C1–C5 REFUSED. `--check` re-derives the current record unchanged.

**Disclosure.** Written and published before S1 or C1 has a result; it tightens how they are read and cannot depend on
either.

## Amendment A24 — B1's sorry tally re-counted in both spellings (written 05:05 UTC on 2026-11-23), AFTER the result it re-reads — disclosed as such

**Why.** The same red-team found that B1's `sorry` tally (`B1-sorry.txt`, and the recorder's fallback) counted
`declaration uses 'sorry'` with straight quotes, while this Lean prints the warning with backticks (`C2.out`). The tally
could therefore not have seen a warning. B1 was CERTIFIED on 21 Nov; this re-reads that result after it was seen.

**What was done.** The archived full logs (`notes/alpoge-rh-2026-11-20/pod-logs/podA-large-logs.tar.zst`, sha256
30bf02be2e5c540efd695ec5f00995e7e25fcfdb2cefb0aca964e33a4aca05db, the file named in
`corpus/alpoge-grh/runs/podA-phden71h9yeked/LARGE-LOGS.txt`) were re-counted on the Mac for both spellings and for any
line holding both "declaration uses" and "sorry": `B1.out` 0, 0, 0; `B1.progress` 0, 0, 0; `B1V.out` 0, 0, 0. B1's
verdict stands. The page rests "no sorry" on the source scan and the axiom report A1 as well as on this count.

## Amendment A25 — the statement judge is stopped on cost, with no verdict (the operator, 2026-11-24 10:08 UTC; written 10:17 UTC), AFTER the stop — disclosed as such

**What happened.** S1, the statement judge Comparator, had been running on the larger machine (RunPod `bmwjdc3l37zuwh`,
US$2.88 an hour, amendment A17) since 2026-11-22 05:02:50 UTC. On 2026-11-24 the operator was asked in the session
what to do with the run. His answer: "Stop it now". The option he chose read: pull its result files, delete the
pod, record the statement check as "refused on resources", make the RH page final. At 10:08:32 UTC the control room
killed the judge script, the guard and Comparator on that machine. This is the second time a check of this audit is
closed on cost; the first was the unconditional bridge (A21).

**Measured at the stop** (the marker `S1.stopped-by-operator`, written on the machine, and the files beside it in
`corpus/alpoge-grh/runs-judge/podD-bmwjdc3l37zuwh/`):
- Comparator had run for 2 days 05:05:41 of wall time (53 hours 5 minutes; 191,141 s) and used 2 days 03:24:52 of
  processor time (185,092 s).
- Its resident memory was 348,861,876 kB: 357.2 GB in the unit of the machine's 376 GB limit (376,000,000,000 bytes).
- Its own time limit was 259,200 s (72 hours). 68,059 s of it, about 18.9 hours, were left.
- The container's `memory.events` read `max 8083`, `oom 0`, `oom_kill 0`. Nothing had been killed for memory.
- It had printed nothing of its own. `S1.out` (168,588,615 bytes) was last written at 05:03 UTC on 22 November and ends
  with the build replay's last line, "Build completed successfully (183893 jobs)." Counted over the whole file at home:
  no acceptance line, no mismatch line, no illegal-axiom line, no exception, no out-of-memory line.
- There is no `S1.exit` and no `S1.end`: the step never ended by itself.
- C1, the control queued behind S1, never started: there is no `C1.start`, and the stop wrote `C1.not-run`.
- A17 had estimated this run at 15 to 20 hours. No billing figure was read for this amendment.

**What it means.**
- **S1 has no verdict.** Comparator neither accepted nor rejected the release against the challenge. A17 fixed that a
  run stopped on resources decides nothing and leaves S1 REFUSED on resources. A17 and A19 had memory and time in mind;
  this amendment applies the same rule to a stop for cost, on the operator's word. S1 is REFUSED on resources (cost).
- **C1 was not run, and the row C1–C5 is REFUSED with it**, as A19 fixed for a stop of S1: C1 is the same judge on the
  same proof. The controls that ran are reported one by one, as before: C2, C3 and C4 were each rejected by Comparator
  on the build pod, C5 by nanoda, and Lean's axiom report named the plants of C2 and C3.
- **BRu stays REFUSED for cost** (A21). Three of the 24 checks are therefore refused, and none is pending.
- The statements are compared with the challenge by one tool only: con-leche's comparison, the second statement judge
  of A12, CERTIFIED on the build pod (K3) and on the clean machine (CR). Comparator, the tool this registration named
  for the statement check, gave no verdict.

**What it does not mean.**
- It is not evidence against the proof. Comparator reported no mismatch, no illegal axiom and no error. It reported
  nothing.
- It is not evidence for it either. Nothing in S1 may be read as an acceptance.
- It was not a stop for memory, and not a timeout. Whether the run would have ended inside its 72 hours is not known.
- It changes no other row. The three kernels (K2, KR, K3), the clean machine (CR), the axiom report, the build and the
  rest stand exactly as recorded. Nothing was rerun, and no output was edited.

**What changes** (`tools/check-alpoge-grh.py`, `tools/build-report-alpoge-grh.js`, with this amendment):
- The recorder reads the marker `S1.stopped-by-operator` in the larger machine's run as the state "stopped on cost":
  S1 REFUSED, with the measurements above in the row. The marker means "no verdict" and nothing else. If an exit
  status, an end time, a verdict line of Comparator or an out-of-memory kill stands beside it, or if neither `S1.out`
  nor `S1.tail` is there to be read, the recorder stops and writes no record.
- With that state and the marker `C1.not-run`, the row C1–C5 reads REFUSED: C1 has no result, the others each rejected.
- `S1.tail` (the last 400 lines of `S1.out`) was cut at home from the pulled file, after its sha256 was checked against
  the machine's own list. A22 has the tail made on the machine after the step exits; here the step never exited. The
  full file stays outside the repository, with the three other files over 100 MB; `LARGE-LOGS.txt` in the run names
  each with its sha256.
- Two logs had grown on the machine since the previous pull (`_judge.log`, by the line of the stop; `S1.err`, by the
  shell's line of the kill). The earlier copies are kept; the final ones are saved beside them as `_judge.log.at-stop`
  and `S1.err.at-stop`.
- The page had two closing states, both registered before S1 could report: a pass, or a stop on resources recorded by
  the guard. This ending is neither. The page now closes in a third state, the one this amendment describes, and says
  that it was not registered in advance. Its first paragraph says that the central check gave no verdict.
- Tested on altered copies of the record: the marker with an exit 0 and Comparator's two acceptance lines, with a
  mismatch line, with an exit 137, with `oom_kill 3`, and without any output file: each time the recorder stops and
  writes nothing. Without the marker, S1 reads PENDING as before. Without `C1.not-run`, the controls row stays PENDING.

**Disclosure.** This amendment is written after the stop it describes, and it changes how a state of the record is
read, from pending to REFUSED, after that state was seen. The decision to stop was made on cost, with no result of S1
known to anyone: Comparator had printed nothing. No row becomes CERTIFIED by it, and it cannot make one so. The
results were pulled before the machine was deleted, at about 10:10 UTC: 40 files, each matching the machine's own
sha256 list, in one archive (sha256 523c2ac7dacb1febc7a83f8727e1553e6d949e93657191db2234fa50a705d8cd).

