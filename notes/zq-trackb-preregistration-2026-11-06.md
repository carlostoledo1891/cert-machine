# ℤ is Diophantine in ℚ (Glazer et al., 2026-11-05): deciding claimbox's Track B proposal — pre-registration, 2026-11-06

Written and committed BEFORE any code of ours runs on claimbox's `lean/zinq`. The operator's word: "Yes" (2026-11-06),
to "write and run the Track B decision" (a pinned decision script and a short pod run), under the US$50 cap of
"push to the limits" (≈US$3.0 spent before this).

## What every artifact of this decision says first

"The theorem (ℤ is Diophantine in ℚ) is undecided here. This decides that Glazer's frozen statement follows in Lean
from eight named hypotheses; it does not decide that any of them is true, nor that they say what the manuscript's
premises say. If one is false, the conditional theorem is vacuous."

## The proposal, at its pins

- **claimbox** commit `125509a1fbb307ed4b80faef216b701a9165ccf2` (branch `zinq-2026-11-06`), folder `lean/zinq`, tree
  `bf5111756795bbdb47935e2981f5d62414821a8a` (23 files). The branch is not public when this is written; the commit is
  transferred to the pod as a git bundle and the pod checks the commit id, which pins the tree. A replay from outside
  needs the branch on GitHub (the operator's word).
- **Glazer's repository** as claimbox's lake dependency `z_in_q`: github.com/elliotglazer/diophantine-z-q at
  `97cec7fdd757d9a8e4f468151a47a6d3610fb2f2`, subDir `lean`; the frozen file
  `lean/Frozen/BoundedIntegerPolynomial.lean` sha256 `0889579ae56e75eca811af520eb4e18c9f697e163db408771b93fdbc651a95b9`
  (the pin of Track A lane 4). Nothing of his leaves the pod.
- **Toolchain** `leanprover/lean4:v4.35.0` (commit `eb6cafb7…`), Mathlib `v4.35.0` at rev `56a00585…`, every package at
  claimbox's committed `lake-manifest.json`. **No `lake update`**: the manifest as committed is the input.
- **The claims decided.**
  - **T8** `CondZQ.exists_bounded_integer_polynomial_defining_integers_of_eight_hypotheses : HypM → HypH → HypPC → HypC
    → HypLT → HypCC → HypH1 → HypH2 → F`, where F is the type of Glazer's frozen
    `ZInQ.exists_bounded_integer_polynomial_defining_integers`. The headline.
  - **T9** `CondZQ.exists_bounded_integer_polynomial_defining_integers_of_hypotheses`, the same with `HypG` first.
  - **G** `CondZQ.hypG_holds : CondZQ.HypG`, and that `HypG` is the first clause of the manuscript's `prop:generator`
    (TeX 257–270, "the point P₀ has infinite order") about the manuscript's own curve and point.

## What is not decided (stated before anything else, in every artifact)

The theorem. Each of the eight hypotheses that remain (M, H, PC, C, LT, CC, H1, H2): whether it is true, and whether it
says what the manuscript's premise says, is a reading recorded beside it, not a decision. Their joint consistency. That
the polynomial T8 asserts is Glazer's saved `P_*` (T8 is existential in P). claimbox and cert-machine have the same
operator: this decision separates the roles of author and checker; it is not a second party.

## Procedure

Pod script `tools/runpod-zq-trackb.sh`, run over SSH (never as the pod's start command), under `/root/zq-trackb/$RUN`.
Every step writes `<step>.log`, `.exit`, `.time` (GNU time -v), `.start`, `.end`, `.code` (the sha256 of our files) into
`$RUN/out`, the only directory the desk copies back, into `corpus/zq/runs/trackb-2026-11-06/`. The desk recorder
`tools/record-zq-trackb.js` writes `certs/zq-trackb.json`; `--check` re-derives it from the facts and refuses on any
difference, including a change to any of our pod-side files after the run. The recorder reads the facts, our files and
the pinned TeX (`~/Projects/zq-scout`, sha256 `cb1148cd…`); it reads nothing of claimbox.

- **B1 source.** The bundle cloned; `HEAD` = the commit; the tree id of `lean/zinq` = the pin; the sha256 of every file
  under it. Dependencies materialized from the manifest by `lake exe cache get`; each checkout's `HEAD` = its manifest
  rev, tracked sources clean; Glazer's frozen file in the checkout hashes to its pin.
- **B2 build.** `lake build CondZQ Frozen`: exit 0, no error, and the warnings "declaration uses `sorry`" exactly one, in
  the frozen file. Then each of the ten sources (`CondZQ.lean`, `CondZQ/*.lean`) re-elaborated alone with
  `lake env lean -Ddebug.skipKernelTC=false`: exit 0, no error, no `sorry` warning.
- **B3 our axiom audit** (`tools/zq-lean-audit.lean`, Track A lane 4's, unchanged but for the import line, with
  `ZQ_AUDIT_ROOT=CondZQ`): every constant whose defining module is `CondZQ` or `CondZQ.*`, selected by module, never by
  name: by our fresh traversal AND by `Lean.collectAxioms`, only `propext`, `Quot.sound`, `Classical.choice`; no
  declaration of kind axiom; no `implementedBy`/`extern`; `unsafe`/`partial` only on compiler-generated `._unsafe_rec`
  auxiliaries. A difference between the traversals inside the three is listed, not a refusal (lane 4, amendment C).
- **B4 our statement module.** In a COPY of the project whose lakefile gains one `lean_lib CertMachineZQ` (claimbox's
  bytes otherwise identical), our file `tools/zq-trackb-statement.lean`: four theorems stated by us, the conclusion
  written as `type_of% @ZInQ.exists_bounded_integer_polynomial_defining_integers` (Glazer's statement, not retyped) —
  `trackB_eight` from the eight hypotheses (proved by T8), `trackB_nine` from the nine (T9), `trackB_G : CondZQ.HypG`
  (G), `trackB_G_infinite : ¬ IsOfFinAddOrder CondZQ.P0` (G through Mathlib's `addOrderOf_eq_zero_iff`). Built;
  audited (`ZQ_AUDIT_ROOT=CertMachineZQ`): all four on the three standard axioms by both traversals, so the frozen
  theorem's `sorry` is not used.
- **B5 our checks** (`tools/zq-trackb-check.lean`, run with `lake env lean` in the copy; syntactic, never unfolding a
  tower):
  - (a) T8's type, peeled by exactly eight binders: the domains are exactly the constants `CondZQ.HypM`, `HypH`, `HypPC`,
    `HypC`, `HypLT`, `HypCC`, `HypH1`, `HypH2` in that order with no universe levels, the body has no loose bound
    variable, and the body is alpha-equivalent to F (Lean's `Expr.eqv`; `Expr.equal`, binder names included, recorded).
    T9 the same with `CondZQ.HypG` first. G's type is exactly the constant `CondZQ.HypG`. All three theorems, no
    universe parameters.
  - (b) F's constants: none defined in a `CondZQ*` or `CertMachineZQ*` module (each listed with its module).
  - (c) the hypotheses, a screen: each is a definition (not an axiom or opaque) of type `Prop`; neither its value nor
    the value of any definition of a `CondZQ*` module it reaches through definition values contains F as a subterm or
    mentions the frozen theorem's constant; its value is not `False`. Recorded: the constants each value uses, grouped
    by defining module. A screen against circularity, not a decision of meaning.
  - (d) G's meaning: `HypG`'s value is alpha-equivalent to our elaboration of `addOrderOf CondZQ.P0 = 0`; `P0`'s value
    is `Point.some` applied to the constants `CondZQ.P0x`, `CondZQ.P0y` (and a proof); `CondZQ.Pt`, `CondZQ.E` and
    `CondZQ.K0` are alpha-equivalent to our elaborations of `CondZQ.E.toAffine.Point`,
    `{ a₁ := 0, a₂ := 0, a₃ := 0, a₄ := -(CondZQ.dco * CondZQ.dco), a₆ := 0 }` and `QuadraticAlgebra ℚ 2 0`; and the
    six rationals of `dco`, `P0x`, `P0y` (re, im), computed by Lean, equal on the desk the manuscript's `d = 75 − 53s`,
    `x = (1641 − 1160s)/8`, `y = (−123720 + 87483s)/32`, parsed by the recorder from the pinned TeX (lines 257–262),
    in the basis 1, s with s² = 2 (the `2 0` of `QuadraticAlgebra ℚ 2 0`: s² = 2 + 0·s).
- **B6 kernel replays.** `leanchecker CondZQ` (pristine) and `leanchecker CertMachineZQ` (copy), the same with
  `leanchecker-paranoid`, and `leanchecker --fresh CertMachineZQ` (every constant of the closure, core, Mathlib, Glazer's
  modules and claimbox's included, into an empty environment). A name-restricted export
  `leanexport CertMachineZQ -- <the four theorems> <the comparator's built-in list>` (the list of
  `tools/runpod-conleche-master.sh`), given to: nanoda v0.4.31 (nanoda_lib `8de7e0c4`, built on the pod, 1 GiB stack)
  and the bundled `nanoda_bin`, permitted axioms exactly the three; `con-ron` and `con-leche` as bundled with v4.35.0;
  `con-ron` master `97eead2d…` (cargo) and `con-leche` master `dc8ca857…` (lake), built on the pod. Lane 4 saw nanoda
  overflow inside num-bigint's `pow` on `ZInQ.ExplicitCutoffBounds`, which T8 uses, so nanoda is expected to stop here.
- **B7 controls**, predictions fixed here; a control whose outcome differs makes the decision REFUSED:
  - **C1** claimbox's `Planted.Conclusion` (`CondZQ.Planted.planted_conclusion_changed`, degree bound 2↑↑7 → 2↑↑8,
    proved): builds; on standard axioms; B5(a) with nine hypotheses REFUSES it (body not alpha-equivalent to F).
  - **C2** `Planted.Sorry` (`planted_sorry`): B5(a) passes (its statement is the right one); the audit
    (`ZQ_AUDIT_ROOT=Planted`) flags `sorryAx` by both traversals; nanoda refuses its export.
  - **C3** `Planted.Axiom` (`planted_axiom`): B5(a) passes; the audit lists `planted_zinq_axiom` (kind axiom) and flags
    `planted_axiom`; nanoda refuses its export.
  - **Q1** (ours) an extra first hypothesis `(1 : Nat) = 0`, the theorem proved by `absurd`: B5(a) with eight REFUSES.
  - **Q2** (ours) `HypH2` replaced by `HypCirc := F` (by `type_of%`), proved by that hypothesis: B5(a) REFUSES (the
    eighth domain is not `HypH2`) and the B5(c) screen flags `HypCirc`.
  - **Q3** (ours) a theorem with T8's exact type and value `True.intro`, added by `run_cmd` under
    `set_option debug.skipKernelTC true`: B5(a) PASSES and the audit sees no axiom (both blind spots, recorded as such);
    `leanchecker` on its module exits non-zero; nanoda refuses its export.
  - **Q4** one byte appended to `CondZQ/Main.lean` in a copy: B1's re-hash flags exactly that file.
- **Recorded, never a verdict input:** claimbox's own `Checks` library built (its statement check and its
  `#print_axioms_all` summary); the 355-byte conclusion span claimed byte-identical, hashed in `CondZQ/Main.lean`,
  `CondZQ/Discharged.lean` and the frozen file.

## Verdicts

- **CERTIFIED** (each of T8, T9, G, and G's meaning, as its own row; T8 is the headline): B1–B5 as stated for it,
  `leanchecker` (both builds) and `leanchecker --fresh` accept, no replay rejects a constant of `CondZQ*` or
  `CertMachineZQ`, every control as predicted. A second kernel's acceptance is recorded per row; a tool stop (overflow,
  fuel, memory, an unbuildable master) makes that row REFUSED (tool), not the decision.
- **REFUTED**: a kernel rejects a constant of `CondZQ*` or `CertMachineZQ`; a non-standard axiom reaches T8, T9 or G;
  or B5(a)/(b) fails on the proposal (it does not prove the frozen statement from the named hypotheses). For G's
  meaning: a number or a structure differs from the manuscript's.
- **REFUSED**: the source, toolchain or dependencies cannot be reproduced at the pins; a control misbehaves; or the
  B5(c) screen flags one of the proposal's hypotheses (named in the record).

## Passes

A first pass may run to find faults of our own files (a compile error, a path). Nothing of it is imported. A change to a
check's logic after seeing its outcome is written below as an amendment before the recorded pass, which is a fresh run of
the final files in a fresh directory, their sha256s recorded by every step.

## Pod

RunPod CPU, cpu3m 16 vCPU / 128 GB (≈US$0.88/h) or the closest shape that places, SSH direct, the runpod image.
Deleted after the import (delete-pod, then get-pod → 404); `corpus/zq/POD.txt` gets its lines.

## Amendment A, 2026-11-06, written AFTER a first pass and BEFORE the pass that is recorded

**The first pass.** The files as first committed (pre-registration 6406f546; `tools/runpod-zq-trackb.sh`,
`tools/zq-trackb-check.lean`, `tools/zq-trackb-plants.txt` as they were then) ran 11:05–11:14 UTC on the pod under
`/root/zq-trackb/pass1`, every stage up to the toolchain kernel's replays. Nothing of it is imported. It showed two faults
of ours and nothing of claimbox's:

1. **Q3 did not compile** (`unexpected identifier; expected '}'`): the structure instance of its `addDecl` continued on
   a line indented left of its `{`. The text is now one line; what Q3 plants is unchanged.
2. **B5(d)'s comparison of `HypG` came out false for a reason that is not about meaning.** Every other structural check
   passed (T8, T9, G and our three theorems under B5(a); F under B5(b); the nine screens; `Pt`, `E`, `K0`; P0 is
   `Point.some P0x P0y _`; the six rationals are 75, −53; 1641/8, −145; −15465/4, 87483/32, which are the manuscript's
   numbers in the basis 1, s). `HypG`'s value and our `ourG` differ in exactly one constant: the elaborator abstracts a
   proof inside the instance arguments into an auxiliary constant named after the definition, `CondZQ.HypG._proof_1` in
   theirs and `ZqTrackBCheck.ourG._proof_1` in ours. **The comparison is refined to:** alpha-equivalence after each
   auxiliary proof constant (a constant whose last name component begins `_proof_`) is replaced by a marker applied to
   its own statement, so two elaborations compare equal when they differ only in the names of abstracted proofs of
   alpha-equivalent statements. It stays syntactic (no unfolding). Plain `Expr.eqv` and both lists of auxiliary
   constants are still recorded. This rule was written after seeing the first pass; the record says so.

A deprecation (`levelZero` → `Level.zero`) is fixed with no change of meaning, and each screen line also carries the
hypothesis as Lean prints it (informational: what the record names, the page may quote; nothing is decided from it). A continuation of the first pass in the
same directory, with these fixes, ran the remaining stages to learn their output formats; it is not imported either.
What the continuation showed, written here before the recorded pass: `leanchecker --fresh CertMachineZQ` accepts (33 min,
8.8 GB); every second kernel stops on a resource limit — nanoda (both builds) on num-bigint's `pow` overflow, con-ron and
con-leche as bundled on `fuel exhausted: whnfCore` at `CondZQ.t_body`, con-ron master on a worker stack overflow, con-leche
master killed by the 64 GB pod's memory limit (exit 137). On the planted exports nanoda's reason differs by plant (C2:
`depends on sorryAx which was not found`); the record states the reason of each refusal, and a refusal by overflow
carries no weight for its control (C2 and C3 rest on the audit, Q3 on leanchecker). No rule changes for this.

The recorded pass is a fresh run of the final files in `/root/zq-trackb/final`, every step recording their sha256s.
claimbox's branch `zinq-2026-11-06` was pushed to GitHub at the operator's word (2026-11-06) before the recorded pass, so
the commit is public.

## Amendment B, 2026-11-06, before the recorded pass (an order and one omission, no rule)

The recorded pass runs `leanchecker --fresh` (33 min, 8.8 GB in the continuation) at the same time as the second
kernels on the export, after the toolchain kernel's other replays (49–51 GB each) have finished, so that no two
memory-heavy steps overlap on the 64 GB pod. con-leche master is NOT run in the recorded pass: on this pod it can only be
killed by the memory limit again (the continuation: exit 137 after 18 min, 62 GB peak at `--jobs=8`). Its row is REFUSED
(tool, not run here), the continuation's measurement is quoted as a note, not imported, and it waits for a larger pod. The
pod script's `con-masters` stage is split into `con-ron-master` and `con-leche-master` for this; nothing else changes.
