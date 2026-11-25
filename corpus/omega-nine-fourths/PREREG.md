# ω = 9/4 — pre-registration (cert-machine, sealed before any run)

Written by the control room (Claude Opus 5.5, for Carlos Toledo) on 2026-11-25 at about 02:52 UTC, before any build,
any check, any blind statement, and before any reader has seen the proof. Timestamped on Bitcoin with OpenTimestamps
(PREREG.md.ots). Changes after the seal are amendments (A1, A2, …), each dated and sealed, never edits of this file.
The operator's instruction: "a super rigorous verification. If someone will point gaps, will be us first!" — so the
release leads with every gap found, dated at the pin, before any verdict.

## The target

OpenAI's claim "The matrix multiplication exponent is nine fourths" (paper, November 24, 2026 edition, and a Lean 4
formalization), github.com/openai/math at commit 92b516ef8e2abf66c3db7aa31438d3010bc7956f
(2026-11-25 00:04:41 UTC, "Add November 24 mathematics manuscripts and Lean formalizations"). The new part is the
LOWER bound: ω_F ≥ 9/4, with "for every n ≥ 2 a circuit for two n × n matrices requires at least ⌈n^{9/4}/2⌉
multiplication or division gates" (paper, §1). The paper credits the upper bound ω_F ≤ 9/4 to an OpenAI preprint
(over ℂ) and to Amanov, van den Berg and Zuiddam (every field).

The three theorems under the release's Comparator config `lean/ComparatorChallenges/MatrixExponent.json`
(challenge module `ComparatorChallenges.MatrixExponent`, solution module `OAI.LinearAlgebra.SpectralBooks.ExactExponent`):
`OAI.LinearAlgebra.SpectralBooks.square_exponent` (formalOmega F 1 1 1 = 9/4), `…dual_exponent` (formalAlpha F = 1/2),
`…rectangular_exponent` (an exact formula for formalOmega F a b c). Permitted axioms propext, Quot.sound,
Classical.choice; `definition_names` empty; `enable_nanoda` FALSE.

| file (paths in the repository) | sha256 |
|---|---|
| lean/ComparatorChallenges/MatrixExponent.lean (136 lines, imports Mathlib only) | a56cd2267e261903bb62e18eaa4f4663c81dfea83510f20eb19617a42e640534 |
| lean/OAI/LinearAlgebra/SpectralBooks/ExactExponent.lean | a0e2433ae4939e469e866c683499ea8b6e370ffd892a145c24120d2933a6c962 |
| lean/ComparatorChallenges/MatrixExponent.json | bf7bd1e681b75f1664d93eaaeefa583024b0133f436f59c4a179d84b1b6a3699 |
| lean/lakefile.lean (post-update hook applying 28 compatibility patches) | ee45fe3b2f1ecf8fbdb0513b00fc6ed9195a612db9327cd76fc9b792de63190f |
| lean/lake-manifest.json (Mathlib d13f23b723b8a846827a245b89c10fc7d3f11612) | b0848e3682e0e50761a717d4ea92a40321db8d695a22d3790b3e8b8b13814168 |
| lean/lean-toolchain (leanprover/lean4:v4.34.1) | d5edba4e4b8faad9c1baeadb265716d20d03be4d1a2647dc5e35b0c0325bea7b |
| lean/formalization.yaml | b56e17872e392e8985abaf669102ba2805719e682ee732a490d81b65ea01bc69 |
| preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/paper.pdf | ddde9ab7755596c6f0210c148985f9761f2c291582e4d0a045987ad1766e5a01 |
| …/README.md | c83864717e5f42acbbef76c7a17a4a8a9ead8df9d07f7701e4a70eb97e127834 |
| lean/docs/107.md (the formalization scope note) | 31d88810902fccb13f04d0e60e992cc5e2726d36379d4c4806391b96156ec01d |

The full file list of the closure is pinned by sha256 at the first step of Phase 1 (target-SHA256SUMS, amendment A1)
before anything is built.

## What the control room had read before this seal (disclosed)

The challenge file in full; ExactExponent.lean; MatrixExponent.json; the preprint's README; docs/107.md; the paper's
abstract and §1–§1.2 (pages 1–3); the lakefile's patch section; the package list of lake-manifest.json; lean/README.md;
formalization.yaml's MatrixExponent rows; and, for the literature, DeepMind's AlphaEvolve notebook
(google-deepmind/alphaevolve @ aafb1e26, omega/verification.ipynb). No reader, writer or auditor is briefed beyond
the prompt files in corpus/omega-nine-fourths/prompts/, each hashed and sealed (amendment) before its agent starts.

## Gaps as of the pin

- G1 ONE KERNEL in their bar: MatrixExponent.json has `enable_nanoda: false`.
- G2 The Lean model is DIVISION-FREE (gates: constant, input, add, sub, mul); the paper's Theorem 1.1 and its per-n
  bound allow division gates. A lower bound for division-free programs is weaker than one with divisions.
- G3 The per-n headline (⌈n^{9/4}/2⌉ gates at EVERY n ≥ 2) and Corollary 1.2 (geometric border rank of T_n ≥ n^{9/4};
  asymptotic rank = n^{9/4}) are NOT in the challenge, which states exponents only.
- G4 The paper claims 1/2 ≤ α_F ≤ 2/3; the Lean states α = 1/2 and an exact rectangular formula, i.e. more than this
  paper claims; docs/107.md attributes the extra to three other manuscripts (two of 2026-09-24, one companion of
  2026-11-24).
- G5 The literature as read disagrees on the upper bound: DeepMind's notebook of 2026-11-04 says "The current best bound
  is ω < 2.371339" and claims ω < 2.371177; the paper calls ω ≤ 9/4 known. The Lean, if it checks, proves both
  directions.
- G6 The build applies 28 compatibility patches to dependencies (lean/patches/); whether Mathlib or any patched
  dependency is in the closure of the three theorems is unmeasured.
- G7 `formalOmega` is an `sInf` of real numbers; Lean's `sInf` of an empty or unbounded-below set is 0. The control
  room's reading: the set is non-empty (schoolbook) and bounded below (N² degree-2 outputs) — to be PROVED (F3).

## Rows

Phase 1 — does the proof check? (pod P1: RunPod cpu3m, 32 vCPU, 256 GB; a second, fresh pod for CR)
- PIN  sparse clone at 92b516ef; every file above matches; target-SHA256SUMS of the closure written and sealed (A1).
- K0   `lake update` (log every patch applied), `lake exe cache get`, `lake build` of the solution and challenge
       modules: exit 0; `#print axioms` for the three theorems names only the three axioms; grep of every closure file
       for native_decide, implemented_by, @[extern], axiom declarations, `opaque`, `unsafe`, `@[csimp]`: listed.
- K1   their bar: Comparator with MatrixExponent.json as released (Lean's kernel only), at the Comparator pin of our
       October openai-math lane (d03acab1, v4.34.0 tag, toolchain v4.34.1; lean4export 076e8e57; landrun 811cfff5):
       accepted.
- K1N  the same config with enable_nanoda true (nanoda 3a240721): accepted.
- EXP  lean4export of the three theorems' closure, and of the challenge.
- K2   nanoda at a second pin (d0a02cc5, v0.4.30) on that export: no error.
- K3   con-leche 5ea446d5c79d23ef1f954215d094db2162f1ab6f: --verified accepts the export; --compare justifies the
       three theorems against the challenge exported separately.
- KR   `lake env leanchecker --fresh OAI.LinearAlgebra.SpectralBooks.ExactExponent`: exit 0.
- CR   a second pod that never ran the release's code: nanoda and con-leche --compare accept the export pulled from P1
       (sha256 equal to P1's record) against a challenge built there.
- C1   controls that must be REFUSED by Comparator and con-leche --compare: the challenge with 9/4 → 2.24 in
       square_exponent; with 1/2 → 0.49 in dual_exponent. C2 the export with square_exponent re-typed as False:
       nanoda and con-leche must refuse. C3 the challenge with ONE definition body changed (Gate.cost of `mul` from 1
       to 2): Comparator must refuse (it checks definition bodies, not only names).
- CEN  census: modules, files, constants and declarations the three theorems reach; which dependencies (and which
       patched files) are on the route; whether any theorem of the per-n bound, border rank or divisions (G2, G3)
       exists anywhere in OAI.

Phase 2 — does the statement say what the headline says?
- F1   two blind statements of "ω_F = 9/4, α_F = 1/2, and the rectangular formula", written from textbook definitions
       (Bürgisser–Clausen–Shokrollahi, Algebraic Complexity Theory, ch. 4 and 15; Bläser, Fast Matrix
       Multiplication, ToC Graduate Surveys 5, 2013) WITHOUT seeing the challenge: writer A a Claude agent, writer B
       GPT-6.2-astra. Each file hashed and sealed (amendment) before it is first elaborated; repairs logged one by one.
- F2   bridge: each blind proposition proved from the release's theorems in the release's environment (Lean v4.34.1,
       Mathlib d13f23b7); then Comparator with OUR blind file as the challenge, Lean's kernel + nanoda, and con-leche
       --compare. A blind proposition that cannot be proved is reported with the reason, never dropped.
- F3   anchors, proved in Lean on the challenge's own definitions: the admissible set at (1,1,1) is non-empty (the
       schoolbook program, τ = 3) and every admissible τ is ≥ 2 (so formalOmega is not Lean's junk 0); padding (an
       algorithm at a larger size gives one at a smaller size of no greater cost); the formula's values at (1,1,0)
       and (1,0,0) equal the trivial exponents 2 and 1.
- F4   the adversarial reader (a separate Claude agent) lists every difference between the challenge and the
       textbooks (cost model, constants, formal identity over finite fields, ceil-rounded formats, the ∀ε∃C order of
       quantifiers, sInf vs inf, negative weights, z = 0 division-by-zero conventions in the formula); each decided by a
       Lean test or left OPEN, by name.

Phase 3 — the paper beyond the Lean (READ rows; no kernel verdict)
- P1   two independent readings of the lower-bound proof (a Claude agent and GPT-6.2-astra, separately): the
       load-bearing steps in order, each step's source (paper, Lean name, or citation), and every step neither the Lean
       nor a citation covers.
- P2   G2 and G3 settled by reading: is the per-n bound, the division case or Corollary 1.2 proved anywhere in the
       release (CEN), and if not, what the paper's argument for them rests on.
- U    provenance of the upper bound (the OpenAI preprint; Amanov–van den Berg–Zuiddam: where published, by whom
       checked) and every public reaction to this release found by the release date, verbatim with links.

Panel and independence: Claude agents (writer A, the adversarial reader, the bridge's author, reader 1), GPT-6.2-astra
(writer B, reader 2). The claim was made by OpenAI models and GPT-6.2-astra is an OpenAI model: independence is by
procedure (separate prompts, sealed outputs, no shared files), not by vendor, and the release says so.

## Verdict rule

CERTIFIED (the formal claim, as the textbooks define ω for division-free straight-line programs): K0, K1, K1N, K2, K3,
KR and CR pass; C1, C2 and C3 are refused; F2 proves BOTH blind statements' propositions with Comparator accepting our
challenge; F3 holds; every MATERIAL item of F4 is decided. Otherwise the verdict names the first failing row: REFUTED (a
proved defect in meaning: the Lean is weaker than, vacuous for, or different from the English claim), REFUSED (a row
could not be run within the pod ceiling or the time it needs), or OPEN (undecided, with the reason).
What CERTIFIED would NOT say: that any human has checked the mathematics; anything about divisions, the per-n bound,
border rank or asymptotic rank unless CEN finds them proved; anything beyond the trusted base (the kernels, the three
axioms, the Mathlib definitions the statements use).

## Ceiling, sends, release

Pods: US$50 (the account holds US$51.99 at the seal); raising it is an amendment on the operator's word. The page is
built only from records, gaps first. Every outside send (OpenAI, the authors credited, any post) is the operator's word,
one item at a time.
