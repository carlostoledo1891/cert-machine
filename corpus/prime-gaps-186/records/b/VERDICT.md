# Prime gaps 186 — phase B, the Lean proof: the record (2026-11-10)

The bound liminf (p_{n+1} − p_n) ≤ 186 and its proof are OpenAI's (GPT-6 Astra; `openai/PrimeGaps186` at `61340d0b`).
The Lean proof is CONDITIONAL on three axioms it declares. Phase B checked the proof as a Lean object. **It does not
verify the bound 186. It proves none of the three axioms.** Every CERTIFIED below reads: the theorem follows from the
three axioms, in Lean.

Rules: PREREG-PG186-B.md, sealed as seal 12 (registry `b1ef7f66`) before any pod existed and before any Lean of the
release was built; amendments A and B, each written before the run it changed. One pod (POD.txt), 16 vCPU / 128 GB, 12:25–13:35 UTC, about US$1.20; deleted, 404 confirmed.

## Gaps first

1. The three axioms are assumed, not proved: two finite-field bounds "for every prime" (phases A and A′ decided
   every instance below 2,000 and nothing above) and 152 numerical bounds (untouched: the certificate cannot be
   replayed from the published stack — B8).
2. Whether `Challenge.lean` says what the paper says is a reading. Phase A compared the tuple and the printed
   numbers; the three theorem statements are short and were read, not decided.
3. Comparator ran in a container: landrun applied Landlock in best-effort mode at ABI v4 (it asks for v9), and the
   `systemd-run` wrapper its README asks for was not used. The comparison and both kernel replays ran; the isolation
   is weaker than the README's.
4. con-ron and con-leche said nothing: both decline any stream that declares a non-standard axiom, in both of their
   modes. The toolchain ships no `leanchecker-paranoid`.
5. `leanchecker --fresh` accepts, but it and the module replay print nothing beyond "replaying PrimeGaps186": the
   evidence is the exit code 0 and 26 minutes of one thread, not a count of declarations.
6. The statement layer's tool had one defect found during the run (amendment B) and one found by its recorded case
   an hour earlier; both were fixed in public and are named below. The tool was built the same day.
7. One orchestrator wrote every script, spec addition and anchor proof, with Claude.

## Verdicts

| | question | verdict | numbers |
|---|---|---|---|
| B1 | the build as shipped | **CERTIFIED (builds)** | `lake build PrimeGaps186`: exit 0, no warning, 669 s, 28.1 GB peak; both files' bytes as pinned |
| B2 | Comparator as shipped | **CONCORDANT** with the claimant's report | a second fresh clone; exit 0, 1,542 s: the three theorems and the three axioms match `Challenge.lean`; nanoda and Lean's kernel accept (inside Comparator) |
| B2 | Comparator's red controls (ours) | **both rejected** | K1 (186 made 185): "theorem statement do not match: primeGapLiminf_le_186"; K2 (the constant 3 made 2 in axiom 1): "…do not match: kloosterman3_bound" |
| B3 | our axiom audit | **CERTIFIED** | each theorem rests on exactly propext, Classical.choice, Quot.sound and the three declared axioms, by two computations that agree; closures of 98,116 / 98,111 / 98,213 constants in 2,813–2,814 modules, 6,272–6,284 of them the release's; no forbidden constant, no `implemented_by` or `extern` on a constant of the release; the audit's eight planted controls all as required |
| B4 | leanchecker | **accepts, both** | the module replay: exit 0, 143 s; `--fresh` (every import replayed from an empty environment): exit 0, 1,548 s, 10.6 GB |
| B5 | the other kernels, on one export (1,240,113,250 bytes, sha256 `5c5b6eee…`, 22,871,510 lines) | nanoda **accepts** (99,189 declarations, 69 s); lean4lean **accepts** (96,354 declarations, 511 s); con-ron and con-leche: **tool stop** ("non-standard axiom … not supported at the moment"), in `--verified` and in `--trusted` |
| B6 | the statement layer, six ids | **CERTIFIED ×6**, each conditional on the three axioms | below |
| B7 | Lean anchors at p = 2 and 3 | **PROVED, all five** | nine theorems, standard axioms only, in a small tree and again in the release's own tree; the deciders' values confirmed |
| B8 | C0a on Linux x86-64 | **RAISES on both wheels** | python-flint 0.9.0 (FLINT 3.6.0) and 0.8.0 (FLINT 3.3.1), Python 3.12.3, glibc 2.39; on 0.9.0 the same wrong coefficient 15 as on macOS arm64, right at 480 bits, wrong at 509 |

### B6, id by id (`pg186/intake/root/certs/`; each re-derived by `lean-intake.js record --check`)

| id | F1 (the kernel, against the copy) | the copy is `Challenge.lean` | axioms name for name | planted statements | planted defects | kernels |
|---|---|---|---|---|---|---|
| pg186-dhl | CERTIFIED; the two types equal as written | 1 + 3 + 3 + 105 constants identical | 3 of 3 identical | 2 rewordings accepted; 7 changed refused; 2 retyped do not elaborate; the swapped binders refused | 2 of 2 caught | Lean, leanchecker, nanoda accept |
| pg186-tuple | CERTIFIED, after unfolding | 2 + 3 + 3 + 105 | 3 of 3 | 2 accepted; 3 changed refused | 2 of 2 | the same three |
| pg186-liminf | CERTIFIED, after unfolding | 2 + 3 + 3 + 105 | 3 of 3 | 1 accepted; 3 changed refused (≤ made <, 187, 185) | 2 of 2 | the same three |
| pg186-ax1 | CERTIFIED | 3 | 1 of 1 | 2 accepted; 5 wrong refused (among them phase A's R1 and R3); ℕ made ℤ does not elaborate | none planted | the same three |
| pg186-ax2 | CERTIFIED | 3 | 1 of 1 | 2 accepted; 6 wrong refused (among them R2 and R4); ℕ made ℤ does not elaborate | none planted | the same three |
| pg186-tuple-x | CERTIFIED | 2 + 3 + 3 + 105 | 3 of 3 | the forty numbers written out ACCEPTED; 2 → 4, 98 → 96 and the swapped pair refused by type mismatch; 186 → 188 and the dropped number NOT ACCEPTED, but by "maximum recursion depth" in the elaborator, not by a mismatch | none planted | the same three |

- Every certain prediction of every spec was met (claimbox's three: 7 of 7; the hand-written ones: 19 of 19). Every
  "kernel decides" statement was refused or did not elaborate; none was accepted.
- `physical_integral_bounds`: the claimant's axiom is the statement file's through 105 constants — the 152 printed
  bounds and every definition they mention — compared structurally, so no numerical definition was unfolded.
- The six planted defects each rebuilt the 10 MB file (636–880 s); `sorryAx` or the added axiom appeared in the axioms
  every time.
- F3 for the general theorem: the release's own 40-tuple, cast to ℤ, is a model of its hypotheses, by the claimant's
  lemma `admissibleTuple_admissible`. The authored tactic elaborated as written before the run.

## Amendments and deviations, all of them

1. **Amendment A** (before any re-run): con-ron `--verified` declined the declared axioms by design; one labelled
   `--trusted` run of con-ron and of con-leche was added. Both declined too.
2. **Amendment B** (after the first runs of ax1 and ax2, before any record): a tool defect. The release's lakefile
   sets `linter.mathlibStandardSet` for every module; the tool's two generated meta-programs imported only Lean, so
   they did not build, and the copy check, the F1 report, the axiom comparison and F3 could not start. Fixed in public
   (cert-machine `4274b7e7`, `intakeImports`), the six specs amended with that field only, `assemble,f1,f3` re-run per
   id; the first attempt's logs kept as `*-try1`; the generated files of the first run and the re-run differ in
   `Meta.lean` alone, for all six ids. The planted statements, the planted defects and the kernels stand as first run.
3. The tool's recorded case (AlphaProof Nexus's Erdős #12 (ii)) finished after the seal: CERTIFIED, and it found a
   defect unrelated to the new mode (an absent leanchecker counted as a kernel that did not accept; cert-machine
   `921bcbe5`). Records here were derived on the Mac with `4274b7e7`.
4. The anchors were developed on the pod, in a third small tree (`Challenge.lean` and Mathlib at the pins), not on
   the Mac: lake crashed there twice (exit 133) while fetching packages for v4.34.0-rc2. Three compiles; only proof
   lines changed from the sealed draft, no statement (the diff is plumb commit 0f9ec6c).
5. Before the general theorem's id ran, the logic of its authored witness was compiled once in that small tree with the
   claimant's lemma as a hypothesis. The spec's tactic was not changed.
6. `b2.sh` wrote its environment line before PATH was set, so `b2-env.txt` says "landrun: command not found"; the run
   itself found landrun (the step runner sets PATH), and the probe log shows Landlock ABI v4, best effort.
7. The pod's cgroup file was not readable (cgroup v1), so only the per-step watchdog limited memory. Nothing was killed.
8. All six planted defects ran (B1 took 11 minutes, under the rule's 150).

## Predictions, graded

B1 builds (90%) — yes. B2 concordant (85%) — yes; K1 rejected (certain) — yes; K2 rejected (95%) — yes. B3 CERTIFIED
(90%) — yes. B4 module replay accepts (90%) — yes; `--fresh` finishes (70%) — yes, in 26 minutes. B5 nanoda accepts (90%) —
yes; at least one further checker stops (60%) — yes, two, and for a reason I had not predicted (declared axioms, not
resources or format). B6 F1 CERTIFIED for the three theorems (85%) — yes; the axioms identical (85%) — yes; every
certain expectation met (90%) — yes; tuple-x S1 accepted (90%) — yes. B7 all five proved (70%) — yes; none refuted
(97%) — none. B8 raises on Linux (60%) — yes. TARGET-PG186's stage line for B: "passes Lean's kernel and nanoda as
the claimant reports (90%)" — yes; "at least one further checker stops on resources for a 10 MB file (60%)" — two
stopped, not on resources.
What I got wrong: the cost. I planned for a build of hours and a pod day; the build takes 11 minutes on 7–11 cores.

## What is new here, beyond the claimant's own report

- Comparator's result reproduced by a second party, with two red controls showing it does compare the axioms.
- A third kernel, lean4lean, accepts the three proofs; leanchecker replays the module, and with `--fresh` every import.
- The proof's axioms are exactly the six, by an audit that does not use Comparator.
- The statement layer by a route that shares no code with Comparator: the kernel's own check against the statement
  file, 45 planted statements, six planted defects, the axioms compared through every definition.
- The finite-field definitions evaluated in Lean at p = 2, 3, agreeing with both exact deciders of phase A.
- The numerical certificate's startup check fails on stock FLINT on two platforms.

## Files

`runs/` the pod's facts (command, log, exit, time, peak per step; `_status.txt`); `../../../pg186/intake/root/` the six
specs, their facts and records; `../../../pg186/pod/` the scripts as run; `../../../pg186/anchors/Anchors.lean`.
The exports (1.24 GB each) and the oleans were not kept: they rebuild from the pins in 11 minutes.

## Correction (2026-11-10, after seal 13; nothing above is edited)

Gap 1 and "What is new" say the certificate "cannot be replayed from the published stack". Read that as: not on any
RELEASED FLINT. The defect is a known FLINT bug in `fmpz_poly_mul_SS`, fixed on FLINT's main branch on 2026-08-10
(`7ad753d5`, flintlib/flint#2790) and in no release; a FLINT built from main should run the certificate. See
results/pg186/c0/VERDICT.md (addendum) and reveal/flint/FLINT-REPORT-DRAFT.md.
