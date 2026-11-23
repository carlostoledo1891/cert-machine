# P4 in Lean: T0 and T1 proved, T2 computed on every row (Claude; first written 2026-11-22 11:47 UTC, this version 19:13 UTC; PRIVATE)

Against `../p4-statement/P4-STATEMENT-v2.md` (e15fdd1f…). Lean 4.35.0 with the lane's built Mathlib. The 11:47 text is kept as
`P4-LEAN.v1-1147.md` (7f79b0ae…). The 18:51 text is `P4-LEAN.v2-1851.md` (6f8fa005…). The three modules have not changed since 11:47 (3ec2b8ca…, 519b96e2…, 85d48e64…).
Lines written into this note by another session were removed on the control room's ruling (round 24) and are kept verbatim in
`../FOREIGN-BLOCKS-2026-11-22.md`.

## What is not established (read first)
The first three answer the control room's open items of round 17 (17:55 UTC); it withdrew the first in round 23.
1. **No instance of "every F is unsatisfiable" is a Lean fact.** The join itself exists (the control room's correction, round 23): `R7CnfBridge.completion_model` applies `R7Cnf.T1`,
   and the closing hypothesis `unsat` is written with this folder's own constants (`R7Cnf.Sat`, `R7Cnf.F`, `R7Cnf.inputOf`), so the
   two tracks mean the same proposition. What stands between a checker's verdict on a file and that proposition:
   - T2 (computed, item 4);
   - the reading of the bytes as a clause list: there is no DIMACS theorem, here or there;
   - that the embedded `cfg` and `level` are the pinned files: an evaluation, not a kernel fact (`control-room-checks/P5-READ-4.md`).
2. **The decoding of the inputs is not proved in these modules** (graph6, the records, the 6-set numbers). `inputOf` has no
   theorem here. Two programs written separately agree on it on every row.
3. **T1 has never been applied to an example inside Lean.** No (X, S, R) is shown to satisfy (a), (b), (c). At this bound no
   completion exists on the four cores, so no example comes from the run.
4. **T2 is computed, not proved.** It rests on the Lean compiler and runtime, on the hashing tools, on one pod and one run, and
   on the ledger as the production pod's own account.
5. **T1 gives existence only.** It does not say the model's x variables are the rows, nor that its variables lie in 1..N.
6. **T0 says only that F ignores the order of the sides.** It does not notice a change of the counter or of the row order
   (`control-room-checks/P4-KERNEL2-CHECK.md`, item 3), and Astra's chain does not use it: the 8 images are handled on her side.
7. **The program does not stop on bad input** (a record number past the end, a core number above 3). The all-rows run had its
   own index check.
8. **One Mac, one exporter, one compiled Mathlib; the two extra kernels are the toolchain's bundled binaries.** The page, the
   reference script and the Lean have the same author.

## What is proved (`R7CnfSound.lean`, 900 lines, no `sorry`)
- **`R7Cnf.T1`** (axioms: propext, Classical.choice, Quot.sound). For every graph X on `Fin 27`, every four finite subsets S, every
  level ℓ and every seven finite subsets R: (a), (b) and (c) of the page give an assignment satisfying every clause of
  `F (inputOfGraph X S) ℓ`. The rows may come in any order: the proof sorts them.
- **`R7Cnf.T1_input`** (the same axioms). The same for any executable input whose adjacency table is symmetric and loopless.
- **`R7Cnf.T0`** (axioms: propext, Quot.sound). For every adjacency table, every four sides and every level, F is the same list
  for the 7 other labelled images. `eq_mk4` says every input has the form T0 speaks of. **T0 says F ignores the order of the
  sides and nothing about what F is:** beside a changed counter or row order it is still a theorem, and all three kernels
  accept it there, correctly. Only the threshold reaches it, through `F_congr`.
- **Used by the other track:** `T1`, once, with the definitions `F`, `Sat`, `inputOf`, `inputOfGraph`, `sideSet`, `missF`, `record`,
  `adjOfGraph6`, `indepSets`. Not used there: `T1_input`, `T0`, `eq_mk4`.

## The definition (`R7Cnf.lean`, 146 lines, Lean core only)
`R7Cnf.F` is the clause list of the page, written as an executable function. `R7Cnf.bytes` prints the file. The same `F` is the
subject of T0 and T1 and is what `R7CnfMain.lean` runs.

## T2: computed on all 977,008 rows
| Run | Rows | Result |
|---|---|---|
| **The control room's pod run** (`control-room-checks/t2-pod/T2-RESULT.md`, 17:52 UTC): the program compiled from `R7Cnf.F` beside its own builder | **977,008** | the same bytes from both, with the ledger's hash and size, on every row; 0 missing, 0 repeated, 0 unequal; its controls passed first |
| `lean --run` here, the 77 rows of the page test (`t2_sample.out`) | 77 | 77 with the ledger's sha256 |
| The native program here, one call (`native.out`) | 39 | 39 with the ledger's sha256 (each line of the log holds the hash) |

## Kernels
- **Here** (`P4-LEAN-2.md`, `kernel2.out`): leanchecker, nanoda_bin 0.4.19 and con-leche `--verified` accept T1, T1_input and T0;
  each refuses the compiled proofs beside a definition with the threshold changed.
- **The control room's own run** (`control-room-checks/P4-KERNEL2-CHECK.md`, 18:50 UTC): the same export, both kernels and
  Lean's kernel on the export file accept; `leanchecker --fresh` exits 0 on both modules; nine wrong files are refused by both
  extra kernels, the counter and row-order mutations among them. Its verdict on each kernel: CERTIFIED.

## Controls: each mutated definition must break the proof (`controls.sh`, `controls.out`)
| Control | Mutation of `R7Cnf.lean` | `R7CnfSound.lean` |
|---|---|---|
| C-threshold | k = 9 ∸ m ∸ max in place of 10 ∸ m ∸ max | fails to compile |
| C-counter | the last counter clause with s(i−1, k−1) positive | fails to compile |
| C-order | the first row-order clause with its two x literals' signs exchanged | fails to compile |

## Files
`R7Cnf.lean`, `R7CnfSound.lean`, `R7CnfMain.lean`, `build.sh`, `t2_sample.sh`, `t2_sample.out`, `controls.sh`, `controls.out`,
`leanchecker.log`, `T2-COMMANDS.md`, `P4-LEAN.v1-1147.md`; hashes in `artifacts-p4-lean.sha256`. The second note's files are in
`artifacts-p4-lean-2.sha256`.
