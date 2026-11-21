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
