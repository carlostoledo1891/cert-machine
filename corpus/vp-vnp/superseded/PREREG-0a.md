# VP ≠ VNP — pre-registration (cert-machine, sealed before any run)

Written by the control room (Claude Opus 5.5, for Carlos Toledo) on 2026-11-24 around 00:05 UTC, before any build,
any check, and before either blind statement exists. Timestamped on Bitcoin with OpenTimestamps (PREREG.md.ots).
Changes after the seal are amendments (A1, A2, …), each dated and sealed, never edits of this file.

## The target

Anthropic's claim "VP ≠ VNP over every field" (paper and Lean 4 formalization; "discovered by an internal research
Claude model … no human mathematician has checked the proof"), folder `vp-vnp` of github.com/anthropics/formal-math,
last changed at commit 918c8e2778aee18b0283dc5a33ed39ab3cd63a96 (2026-11-23 20:04 UTC); fetched at repository head
11b6c7e3c927df2658f513b6b68ea7f8929c62c5. All 333 files hashed in target-SHA256SUMS
(sha256 9ca1036c16384f6fa6dfb4a5e2808a547ada9ac059e76f5b8714f3bd9bbcce17). Key files:

| file | sha256 |
|---|---|
| Statement.lean | f090345dafa13c7629ff0c0737bb1c2fe5d60e8b2d08372281cbb2e65b506ffd |
| Challenge.lean | 808337bc2f4bc2a60d3a1971c9caa1da11ce22bcd7ad5da94a663387a9540912 |
| Solution.lean | 97bdfbf83eb1f84b9791d0c525a324c5bf1cbbda5e253efb0b536022eadb4c85 |
| comparator.json | e52c3c8a04ee33f7583ab9dd583a322bea5668841e2226c30f963078b6b3eceb |
| lean-toolchain (leanprover/lean4:v4.33.1) | 3aac669c7a910ec2389f4e4f921b605adf6ebf2d1e0c9b9cd0be4d33f3f5db71 |
| lake-manifest.json (Mathlib 0df444a3…) | e802752382ed2eddb4ed3b430caea1ebe13f9973225b349c234bb3cb289cb9a5 |
| paper.pdf (70 pages) | 882f5eefb1e067cc8c99ddfe660c10d1d67f9fcee7b69364bd0bab06c0c1f97c |
| ../.github/scripts/comparator-check.sh (their CI bar) | 44e52bf00470eafe1b8c1b24d32ac28c2912b8151ae5d9a8ce57bd6f1be7bc3a |

The five theorems under their Comparator: Solution.mainTheorem, mainTheoremApprox, separation, separationClosure,
permanent_over_real; permitted axioms propext, Quot.sound, Classical.choice.

## What the control room had read before this seal (disclosed)

Statement.lean, Challenge.lean, Solution.lean, comparator.json, README.md, the CI script, the paper's Sections 1–2.2
and Appendix Q. The control room does not write either blind statement and does not brief their authors beyond the
two prompt files below.

## Gaps as of the pin (from the claimant's own text)

G1 the statement file's fidelity was judged by AI readers only (Appendix Q.1; README: "no machine checks that this file
says what is claimed"). G2 Remark N.6 (the permanent is not approximated by determinants of polynomial size) is the one
numbered statement without a Lean theorem. G3 their check is two kernels (Lean's, nanoda) on one machine. G4 the proof
gives no value for m₀ (paper §2.2: the contracting case depends on an integer μ "for which the proof gives no value").
G5 relativization and algebrization not analysed (paper §1.2). G6 no human mathematician has checked the development,
the statement file or the proofs (Appendix Q.1).

## Rows

Phase 1 — does the proof check? (one Linux pod; a second, fresh pod for CR)
- K0  `lake exe cache get`, `lake build`: exit 0, sorry warnings from Challenge.lean only; `lake env lean
      scripts/PrintAxioms.lean` names no axiom beyond the three; no `native_decide`, `implemented_by`, `extern` or
      `axiom` declaration in the 324 .lean files (grep, listed).
- K1  their own bar: `bash ../.github/scripts/comparator-check.sh` at their pins (Comparator 57567492, nanoda
      robsimmons/68d5ca9d, landrun 811cfff5, lean4export at the v4.33.x tag): "Your solution is okay!".
- K2  nanoda at a second pin (ammkrn/nanoda_lib 0da9f98f, the one used in our RH audit) on our own export of the five
      theorems' closure: no error.
- K3  con-leche 5ea446d5c79d23ef1f954215d094db2162f1ab6f: `--verified` accepts the export; `--compare` justifies the
      five theorems against Challenge.lean exported separately.
- KR  `lake env leanchecker --fresh Solution`: exit 0.
- CR  a second pod that never ran the release's code: nanoda and con-leche --compare accept the export pulled from the
      first (its sha256 equal to the first pod's record) against a Challenge built there.
- C1  a control challenge with one symbol changed (the exponent 1/3 → 1/2 in `Beyond`): Comparator and con-leche
      --compare must refuse it. C2 the export with `Solution.mainTheorem` re-typed as `False`: nanoda and con-leche
      must refuse it.
- CEN census: files, modules and constants the five theorems reach; which `Paper.*` theorems lie on the route.
- T3  Table 3 of Appendix Q checked mechanically: every Lean name it lists exists; each Solution theorem uses the
      Paper theorem Solution.lean names; Theorem L.2, Corollary L.3, Proposition E.5 and Theorem E.6 are off the route
      (Q.3) — reported either way.

Phase 2 — does the statement say VP ≠ VNP?
- F1  two blind statements (prompts/blind-writer.md): writer A a Claude agent (straight-line programs, Bürgisser),
      writer B GPT-6.2-astra (circuits as DAGs, Shpilka–Yehudayoff / Saptharishi). Each file is hashed and sealed
      (amendment) before it is first elaborated; repairs to make it elaborate are logged one by one.
- F2  bridge: each blind proposition proved from the Solution theorems inside the release's environment (Lean v4.33.1,
      Mathlib 0df444a3); then Comparator with OUR blind file as the challenge, Lean kernel + nanoda, and con-leche
      --compare. A blind proposition that cannot be proved is reported with the reason (a difference in meaning, or
      a gap in the bridge), never dropped.
- F3  anchors, Mathlib-only, proved on the release's definitions and on each blind file's: every polynomial has a
      circuit (the hypothesis is satisfiable, so the bound is not vacuous); padding (a circuit of size s gives one of
      size s + 1, so the bound is about the smallest circuit); reuse (X^(2^k) has a circuit of k + 1 gates: circuits,
      not formulas); an exact circuit is an approximating one; m^(c·log₂(m)^(1/3)) eventually exceeds every m^k
      (superpolynomial); from MainTheorem alone, the permanent family (p ≠ 2) and the Hamiltonian-cycle family are not
      in VP.
- F4  red controls, each PROVED FALSE in Lean: R1 the main bound for the dense power (Σ_{i,j} x_{i,j})^m (repeated
      squaring gives circuits of size about 2m² + log₂ m); R2 (after Phase 3) the main bound for the permanent in
      characteristic 2.
- F5  the adversarial reader (prompts/adversarial-reader.md, a separate Claude agent) lists every difference between
      Statement.lean and the textbooks; each is decided by a Lean test or left OPEN, by name.

Phase 3 — the gap nobody filled (operator's choice: after Phase 2)
- N6  a division-free polynomial-size circuit for the determinant (Berkowitz or Mahajan–Vinay), proved in Lean; then
      Remark N.6 from mainTheoremApprox; R2 from it (perm = det in characteristic 2).
- NC  the constant: c of the flat case read from the Lean; the plain statement that no m₀ is given.

Phase 4 — human readability (no verdicts): a proof map generated from the Lean (the Paper.* dependency graph, each
node a numbered statement in words, the load-bearing route marked); the idea on one page; what the theorem does not
say; the trusted base.

Panel: Claude agents (writer A, the adversarial reader, the bridge's author), GPT-6.2-astra (writer B), Grok and Gemini
(pasted by the operator; their claims enter the ledger only as checks someone else re-ran). Independence is by
procedure: the claim was made by a Claude model, and Claude models are on this panel.

## Verdict rule

CERTIFIED (the formal claim, as the textbooks define it): K0, K1, K3, KR and CR pass, C1 and C2 are refused, F2 proves
BOTH blind statements' five propositions with Comparator accepting our challenge, F3 holds, R1 is proved false, and
every MATERIAL item of F5 is decided. Otherwise the verdict names the first failing row: REFUTED (a proved defect in
meaning: the Lean is weaker than, vacuous for, or different from the English claim), REFUSED (a row could not be run
within US$25 of pods or the time it needs), or OPEN (undecided, with the reason). What CERTIFIED would not say: that
any human has checked the mathematics; anything beyond the trusted base (the kernels, the three axioms, the Mathlib
definitions our statements use).
