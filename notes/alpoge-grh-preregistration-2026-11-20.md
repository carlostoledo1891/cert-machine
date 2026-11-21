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
