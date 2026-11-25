# grh-lean — pre-registration (cert-machine, sealed before any run)

Written by the control room (Claude Opus 5.5, for Carlos Toledo) on 2026-11-25 at about 22:51 UTC, before any build,
any check or any run, on the operator's word: "start a new lane to contribute with useful things we can." Timestamped on
Bitcoin with OpenTimestamps (PREREG.md.ots). Changes after the seal are amendments (A1, A2, …), dated and sealed, never
edits of this file. The lane leads with every gap, dated at the pin, before any verdict.

## The target

github.com/lsernau/grh-lean at commit 72fead102f663d5c7a407964a13dc0cf9d977207 (2026-11-25 20:38:07 UTC, "Lean proof
of GRH"): a Lean 4 proof of the Riemann Hypothesis and of GRH for Dirichlet L-functions, "Levent Alpöge's, with Claude",
in two editions, `grh/` (readable, ~300,000 lines) and `grh-compact/` (~76,000 lines), on Lean v4.35.0 and Mathlib
56a005855ea17e0b0958f73ec801ae140b0a1679. The main branch of leanprover-community/riemann-hypothesis is a copy of
`grh/` at that commit. The five theorems of `src/Main.lean`: `riemannHypothesis` (Mathlib's `RiemannHypothesis`),
`riemannZeta_eq_zero_re`, `LFunction_ne_zero_of_half_lt_re`, `LFunction_eq_zero_re`, `LFunction_eq_zero_re_of_isPrimitive`.

| file (both editions; read through the GitHub API at the commit) | sha256 |
|---|---|
| `src/Statements.lean` (byte-identical to the original Alpöge release's, pinned in corpus/alpoge-grh/PINS.json) | 79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf |
| `Challenge.lean` (imports `Statements`) | b729a3ccbc3290cf9d9356d8dd8009ad19b5bad10bb50d5a4711ff3d5133b055 |
| `comparator.json` (the five names, the three axioms, `enable_nanoda: true`, `definition_names: []`) | af227d4d6a09bd1449d297a745a7a28d1ecd22ecf85ec62deb2825bd0f164304 |

The full file list of both editions is pinned by sha256 at step I1, before anything is built.

## What the authors claim (their README, read 2026-11-25), which this lane checks rather than repeats

Every file compiles without errors or `sorry`; the five theorems have the stated types and depend only on propext,
Classical.choice, Quot.sound; an export of the closure is accepted by nanoda, con-leche and con-ron; Comparator v4.35.0
accepted the proofs "with a stand-in for its sandbox and `ulimit -s unlimited`" (64 GB, a few hours); "several hundred of
the more than 20,000 declarations are not used by the five theorems".

## What the control room had read before this seal (disclosed)

The README, the three files above, the community repository's README, issue #5578 and its three comments. No proof file.
Our earlier lane on the original release (notes/alpoge-grh-preregistration-2026-11-20.md, certs/alpoge-grh-lean.json):
its kernels, census and textbook bridge (instruments/alpoge-grh/spec/Textbook.lean) are reused as instruments here.

## The rows (each gets its own verdict; there is no single overall stamp beyond the table)

| id | what | passes when | refuses when |
|---|---|---|---|
| I1 | integrity | the clone at 72fead10 hashes to one file list, pinned before any build | — |
| B1, B2 | the build, readable / compact | `lake build` exits 0 from source (Mathlib's official cache only; NOT the authors' shared build cache), no `sorry` warning | an error, or a `sorry` |
| A1 | axioms | `#print axioms` of each of the five, in both editions, ⊆ {propext, Classical.choice, Quot.sound} | any other axiom |
| S1 | the judge, our challenge | Comparator (tag v4.35.0, its real Landlock sandbox) accepts `Main` against cert-machine's challenge, which writes the four definitions from Mathlib alone and imports nothing of the release | a rejection; a run stopped on resources is REFUSED on resources, with the measurement |
| S2 | the judge, their challenge | the same with the release's own `Challenge.lean` and `comparator.json` | as S1 |
| K1 | nanoda | accepts the lean4export export of the closure of the five | a rejection traced to an ill-typed term |
| K2 | con-leche | `--verified` accepts the export; `--compare` justifies the five against our challenge | as K1 |
| KR | Lean's replay | `leanchecker --fresh Main` exits 0 | non-zero |
| C1–C3 | planted controls | each REFUSED by S1 and K2: C1 a fifth theorem proved by an added axiom; C2 a proof replaced by `sorry`; C3 the challenge's `DirichletLZerosOnLine` with `1/2` changed to `1/3` | a control is accepted (then the instrument, not the release, is broken) |
| E1 | the two editions | the compact edition's `Main` passes S1's check against the same challenge | as S1 |
| CHAR | the textbook bridge | instruments/alpoge-grh/spec/Textbook.lean (ζ and L characterised by their series and holomorphy) re-run at Mathlib 56a00585 proves the textbook RH/GRH equivalent to the four definitions, on the three axioms | a failure (stated) |
| D1 | the unused declarations | the list of the release's declarations outside the closure of the five theorems, by name and file, from the export (a list, never a verdict; offered to the community as a cleanup aid) | — |

**Verdict rule.** The formal claim (Lean accepts proofs of the five stated theorems from the three axioms) is CERTIFIED
when B1, A1, S1, K1, K2 and KR pass and C1–C3 are refused; REFUTED only by a reproduced rejection traced to an
ill-typed term or an extra axiom; otherwise OPEN or REFUSED with the row it rests on. No row says anything about the
mathematics beyond what the kernels check; no person reads the proof. The fidelity of the statements is carried from
the earlier lane's reading (F1, F2), because `Statements.lean` is byte-identical; CHAR is re-run because Mathlib moved.

## Machines and money

One build/check machine, cpu3m 16 vCPU / 128 GB (catalog price US$0.88/h on 2026-11-25), sized to the authors' stated
64 GB for Comparator. A larger machine only by amendment. Ceiling: set by the operator before the first pod (amendment
A1 records it). Every pod is deleted when its rows are pulled home.

## What is published

Records under corpus/grh-lean-check/, a certificate when every row has a verdict, a report page from the records.
Texts to the Lean community are facts sheets the operator writes in his own words (the community's rule against
LLM-written comments). Nothing is sent without his word.
