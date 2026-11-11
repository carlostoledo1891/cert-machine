# Pre-registration — prime gaps 186, phase B: the Lean proof (plumb, private), 2026-11-10

Written and committed BEFORE any pod exists and before any Lean of the release is built anywhere. Sealed as seal 12.
The operator's words: "phase B in a new chat and first there"; pod limit US$10; the FLINT report waits for the Linux
check on this pod. Everything PREREG-PG186.md says first, and its gaps, apply unchanged.

## What every artifact says first

"The bound liminf (p_{n+1} − p_n) ≤ 186 and its proof are OpenAI's (GPT-6 Astra; `openai/PrimeGaps186` at `61340d0b`).
The Lean proof is CONDITIONAL on three axioms it declares. Phase B checks the proof as a Lean object: that it builds,
that it proves the statements of the release's own `Challenge.lean` and rests on exactly that file's axioms, that the
kernels we can run accept it, and that our checks refuse planted wrong statements and planted defects. **It does not
verify the bound 186. It proves none of the three axioms.** A CERTIFIED here always reads: the theorem follows from the
three axioms, in Lean."

## Pins (beyond PINS-PG186.txt)

- `PrimeGaps186.lean` sha256 `fd7d9296871d276f7cd950ebf88d38627ff326abdf214a1facabc52fb6794d27` (git blob `a8d0b8a1…`,
  10,312,565 bytes, 210,637 lines); `Challenge.lean` sha256 `b99a403b…` as before. Lean `v4.34.0-rc2`, Mathlib `bbcd1968`.
- From the release's own manifest: Comparator `19e111e2141cf333c7daff0f64c5f24acc91dd2e`, lean4export
  `cacf989bd75f608700820f6afc595f32e7a99a4d` (= tag `v4.34.0-rc2`).
- Ours, as in the 11-07 run of the heptagon: landrun `811cfff51ceaf3d9843708aa6d22e9b84ccac8b4`; nanoda
  `8de7e0c4ed3052745a7f8725164efd9e76d84c56`; con-ron `97eead2d5b496f1017da5d11fe08bb1cb328eb7d`; con-leche
  `701d72aefbb697fbbbd4e656877931330d57cb84`; lean4lean branch `arena` `bce3448115f7819fc12d647fadd3bb090666637e`.
  A checker that cannot read a v4.34.0-rc2 export at its pin is named NOT RUN with the reason; a newer revision of a
  checker is tried only as a dated amendment.
- The statement layer's tool: cert-machine `tools/lean-intake.js` at the commit named in "Tool" below (public,
  generic, names no target). claimbox at `fb6bd34` (read only; nothing is written there).

## Stages, words, predictions

Words: CERTIFIED, REFUTED, REFUSED (with its reason: resources, environment, tool). "Accepts" for a kernel. Every stage
writes its command, log, exit code, wall time and peak memory.

**B1 · The build as shipped.** A fresh clone at the pin, both files' sha256 checked, `lake exe cache get`,
`lake build PrimeGaps186` (their default target, with their `warningAsError`), then `lake build Challenge`.
CERTIFIED (builds): exit 0, no error and no warning on the project's module. REFUSED (resources): more than 6 h of
wall time or out of memory. Anything else is reported as it is. *Prediction: builds (90%).*

**B2 · Comparator as shipped.** A SECOND fresh clone (Comparator's own rule: the solution not compiled before), cache,
then `lake exe comparator comparator/main.json` with their config untouched; Comparator and lean4export built by lake
from the release's pinned revisions; landrun and nanoda built from source at the pins above and put on PATH. Recorded
with it: the kernel's LSM list and whether Landlock is enforced (Comparator calls landrun with `--best-effort`), and
that `systemd-run` is not used (a container). CONCORDANT with the claimant's report: exit 0 and both kernels accept
the three theorems. If nanoda stops on its stack, that is REFUSED (tool) for nanoda inside Comparator and the
standalone run of B5 (1 GiB stack) stands for it.
Red controls of Comparator, ours, in a copy: **K1** `Challenge.lean` with 186 made 185 in `primeGapLiminf_le_186`;
**K2** `Challenge.lean` with `(3 : ℝ)` made `(2 : ℝ)` in the axiom `kloosterman3_bound`. *Predictions: concordant
(85%); K1 rejected (certain); K2 rejected (95%, from reading Compare.lean at the pin: the permitted axioms are
compared as targets).*

**B3 · Our axiom audit.** The audit of the 11-07 run (`lean/heptagon/h3/audit.lean`: the dependency closure over types,
values, constructors and recursor rules, and Lean's `collectAxioms` as a second computation) on the three theorems.
CERTIFIED: both computations give exactly propext, Classical.choice, Quot.sound and the three declared axioms — a
subset is reported as such, per theorem; no `sorryAx`, no `Lean.ofReduceBool`, `Lean.ofReduceNat`, `Lean.trustCompiler`,
no auxiliary `native_decide` axiom, no `implemented_by` or `extern` on a constant of the release. The audit's own
planted controls (its eight targets) are run again in this environment. *Prediction: CERTIFIED (90%).*

**B4 · leanchecker.** `leanchecker PrimeGaps186` (the module's declarations replayed) and `leanchecker --fresh
PrimeGaps186` (every import replayed; budget 4 h and a memory watchdog). Accepts / REFUSED (resources). *Prediction:
the module replay accepts (90%); --fresh finishes (70%).*

**B5 · The other kernels.** One export E of the three theorems (lean4export at the release's pin, the kernel-arena
prelude names as on 11-07), its sha256 and size recorded; then nanoda (1 GiB stack, the six axioms permitted,
`unpermitted_axiom_hard_error`), con-ron, con-leche, lean4lean `--import`. Each: accepts / rejects / tool stop (named,
never a rejection). A rejection by any kernel stops the stage for the operator. *Prediction: nanoda accepts (90%); at
least one further checker stops on resources or on the format (60%).*

**B6 · The statement layer** — `tools/lean-intake.js` in its identity mode for self-contained files, six ids, the
specs in `pg186/intake/root/corpus/lean-intake/` (sealed with this file):

| id | declaration | written by | planted statements | planted defects |
|---|---|---|---|---|
| pg186-dhl | `dhl_40_2` | claimbox, rule set 2 | 12 | 2 |
| pg186-tuple | `infinite_two_prime_translates_admissibleTuple` | claimbox, rule set 2 | 5 | 2 |
| pg186-liminf | `primeGapLiminf_le_186` | claimbox, rule set 2 | 4 | 2 |
| pg186-ax1 | the axiom `kloosterman3_bound` as a claim against the statement file's | hand | 8 | 0 |
| pg186-ax2 | the axiom `kloosterman2_correlation_bound`, likewise | hand | 9 | 0 |
| pg186-tuple-x | the tuple theorem, the forty numbers written out | hand | 7 | 0 |

claimbox's three specs are kept byte for byte (`pg186/intake/<id>/<id>-spec.json`); `compose.py` adds only
`canonical.selfContained`, `canonical.axioms`, `claim.module`, and for `dhl` an authored F3 witness (claimbox's
generated tactic cannot prove admissibility for every prime) — written without a Lean run; if it does not elaborate,
its correction is a dated amendment before the record. The hand-written axiom specs plant, among others, the four
wrong axioms phase A refuted numerically (R1–R4): here the question is whether the Lean check refuses them as
statements. What each id's CERTIFIED says: the copy of `Challenge.lean` (one line added) is `Challenge.lean`, constant
by constant; the kernel accepts the claimant's term as a proof of the statement file's own type; every axiom the proof
rests on is the statement file's, name for name through every definition under it (so for `physical_integral_bounds`
the 152 printed bounds and every definition they mention); the certain predictions are met; the planted defects are
caught. **Each such CERTIFIED is conditional on the three axioms.**
The planted defects (the theorem's proof made `sorry`; proved by an added axiom) each rebuild the 10 MB file. Rule:
the two of `pg186-liminf` are always run; the other four are run only if B1 took at most 150 minutes; a defect not run
is NOT RUN, never "caught".
*Predictions: F1 CERTIFIED for the three theorems (85%) and the axiom comparison identical for all three axioms (85%);
every `REFUSED by type mismatch` and `NOT ACCEPTED` expectation met (90%); tuple-x: S1 accepted (90%), C01–C04 not
accepted and C05 not accepted (the kernel decides: a reordered set is another term) — no prediction registered beyond
"the kernel decides"; the planted defects that run are caught (certain, by the rule that writes them).*

**B7 · Lean anchors at p = 2 and p = 3** — the gap named in phase A (the deciders' reading of Mathlib was never
anchored by a Lean evaluation). To be PROVED in Lean against the release's `Challenge.lean`, in the pinned environment,
with no axiom beyond propext, Classical.choice, Quot.sound; stated here before any Lean run, from the deciders' lines:

1. `‖normalizedKloosterman3 2 1‖ ^ 2 = 1 / 4` (and the value itself, `normalizedKloosterman3 2 1 = -1 / 2`).
2. `‖normalizedKloosterman3 3 1‖ ^ 2 = 7 / 9` and `‖normalizedKloosterman3 3 2‖ ^ 2 = 7 / 9`.
3. `unnormalizedKloosterman2 3 1 = -1` and `unnormalizedKloosterman2 3 2 = 2`.
4. At p = 2 the sum of axiom 2 is 0 for every A, B (no t survives).
5. At p = 3 the sum of axiom 2 is `unnormalizedKloosterman2 3 A * unnormalizedKloosterman2 3 (B / 2)`; its values at
   (A, B) = (1,1), (1,2), (2,1), (2,2) are −2, 1, 4, −2, so the largest square over p³ is 16/27 at (2, 1).

Deciders' lines (results/pg186/a, b): axiom 1 at p = 2: 0.25; at p = 3: 0.777…, argmax c = 1; axiom 2 at p = 3:
0.592592…, argmax (2, 1); K₂²/p maximum 4/3. Words: each anchor PROVED (the kernel accepts, axioms standard), NOT
SHOWN (I could not prove it in the session — named, never counted), or REFUTED (Lean proves another value: the
deciders' reading of Mathlib is then wrong and phases A and A′ are reopened — the finding). The proofs are authored on
the Mac against `Challenge.lean` alone (it imports Mathlib only) and checked again on the pod in the release's own
tree. *Prediction: all five PROVED (70%); none REFUTED (97%).*

**B8 · C0a on Linux x86-64.** The transcribed regression of C0 (`c0a.py`, unchanged) under a fresh virtual environment
with `python-flint==0.9.0` from PyPI, the wheel's FLINT version recorded; then `python-flint==0.8.0`. PASSES or RAISES,
per wheel. If it PASSES on 0.9.0, the certificate itself is NOT run here (phase C). *Prediction: raises on Linux too
(60%).* The upstream FLINT report stays the operator's call either way.

## Tool

`tools/lean-intake.js` at cert-machine `68dfe1b8` (sha256 written in PINS-PG186-B.txt). Its identity mode was built
today, tested on a synthetic pair (accepts the true pair; refuses a changed axiom, a changed definition, a changed
private definition under an axiom) and is being run on a recorded case (AlphaProof Nexus's Erdős #12 (ii), CERTIFIED
by Comparator on 10-20). If that run shows a defect, the fix is a new public commit, named in an amendment here BEFORE
B6 runs. A tool defect found DURING B6 (a generated file that does not elaborate for a reason that is the tool's) is
fixed in public, named in an amendment, and the id re-run; no planted statement and no expectation changes.

## What is sealed with this file

PINS-PG186-B.txt; the six specs and `compose.py`; claimbox's three specs with their targets and pins; `pg186/pod/` (the
pod's scripts and the audit program, as drafted: procedure, not rules — a script corrected during the run is listed in
the record with its reason); `pg186/anchors/Anchors.lean` as drafted (its STATEMENTS are the rules above; its proofs
were written without a Lean run and will be corrected against the compiler — a statement is never changed to fit).

## Compute and money

One RunPod CPU pod, 16 vCPU / 128 GB, at most US$1.04/h, the price stated when it is created and written in POD.txt.
Hard limit US$10 in all: every job is stopped and the pod deleted before the spend reaches US$9. What has not finished
by then is REFUSED (resources). The pod is deleted in this session and the deletion confirmed (404, empty list).
Nothing is posted. The target stays private; the tool commit in cert-machine names no target.

## What is not in phase B

The three axioms themselves. The numerical certificate (phase C). Whether `Challenge.lean` says what the paper says
(a reading: the tuple and the printed numbers were compared in phase A; the three theorem statements are short and
are read in the record, not decided). `leanchecker-paranoid`, if the toolchain has none.

## Amendments (dated; each written before the run it changes)

**A (2026-11-10 12:50 UTC, after con-ron's first run, before any re-run).** con-ron in its default mode (`--verified`)
stopped in 12 s: "declined: non-standard axiom (PrimeGap186.kloosterman3_bound); con-leche does not support such axioms
at the moment". That is a tool stop by design (the mode's theorem is about streams with the three standard axioms),
not a rejection, and it is recorded as such; con-leche `--verified` is expected to stop the same way. ADDED: one run
of each in `--trusted` mode, if the binary has it, recorded under that name and never counted as a verified-mode
accept ("an accept in this mode is outside the theorem", con-ron's own help). If `--trusted` declines too, that is the
record. Nothing else changes.

**Note on the tool (12:40 UTC).** The recorded case passed (cert-machine 921bcbe5: CERTIFIED). One defect was found by
it and fixed in public: a toolchain that ships no leanchecker (v4.27.0) was recorded as a kernel that did not accept;
it is now "not run". The `run` stages B6 uses are unchanged from 68dfe1b8, the file pushed to the pod (sha256
16edba1e…); records are derived on the Mac with 921bcbe5, whose only difference is that rule.

**B (2026-11-10 12:55 UTC, after the first runs of pg186-ax1 and pg186-ax2, before any record).** A tool defect, in
the sense the "Tool" section names. The release's `lakefile.toml` sets `linter.mathlibStandardSet` for every module
of the package; the tool's two generated meta-programs import only Lean, where that option does not exist ("invalid
-D parameter"), so the copy check, the F1 report, the axiom comparison and F3 could not start (the kernel's F1, every
planted statement and the kernels ran, and ran as predicted). Fixed in public, generically (cert-machine `4274b7e7`:
`intakeImports`), each of the six specs gains `intakeImports: ["Mathlib"]` and this amendment, and nothing else. No
planted statement and no expectation changes. For each id, once its first run has ended: the first attempt's four
logs are kept as `*-try1`, then `assemble,f1,f3` are run again with the new tool file. The planted statements, the
planted defects and the kernels do not depend on the two files and stand as first run. A red control that the fix is
only that: the generated files of the first run and of the re-run differ in `Meta.lean` alone (assemble.json).
