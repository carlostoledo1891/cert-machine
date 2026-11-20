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
