# R(7) production run — pre-registration (Claude, drafted 2026-11-22; PRIVATE)

The control room pins and timestamps this file. No pod starts, and no production record is written, before that.

## The theorem the run supports
If every one of the 977,008 configurations ends `CERTIFIED-UNSAT`, then **no 9-regular triangle-free graph on 40 vertices with
independence number at most 9 has two non-adjacent vertices with exactly 7 common neighbours**, under these premises:
- **P1.** e(3,8,27) = 85 (Goedgebeur–Radziszowski).
- **P2.** McKay's list of (3,8;27)-graphs is complete.
- **P3.** `configs.bin` is the complete list of configurations (three agreeing enumerations, one byte-identical; not a checked proof).
- **P4.** `r7cnf.c` writes the CNF that `REDUCTION.md` §5 describes.
- **P5.** The derivation in `REDUCTION.md` (not formalised).
- **P6.** The checkers cake_lpr and lrat-check.

Anything less than all 977,008 certified supports no theorem; it is reported as a count with the open configurations listed.

## Pinned inputs and tools (`PROD-PINS.sha256`)
- **The list:** `configs.bin`, sha256 76c2666b…, 977,008 records. **The cores:** `cores_e85.g6`, sha256 6b237361….
- **The generator:** `r7cnf.c` (e9a4e759…), compiled on the pod. **The pipeline:** `prod.py`, `check_controls.py`, `pod_run.sh`.
- **CaDiCaL** 3.0.1, built from github.com/arminbiere/cadical at commit c60730422e758ef1cebe7aeddf2dda31c996bf04.
- **lrat-check:** `lrat-check.c` from drat-trim at commit 2e3b2dc0 (source sha256 bf07c2ac…, in the bundle).
- **cake_lpr:** the sources pinned in the C35 record (`cert-machine-r1/cake_lpr/cake_lpr.sha256`; x64 file d20ceae0…), in the bundle.
- The sha256 of each built binary, the machine and the core count are written to `out/RUN-MACHINE.txt` before any record.

## The pipeline, per configuration (`prod.py`)
1. **Level 3.** `r7cnf` writes the CNF with the lexicographic row order and the independence clauses for |I| ≤ 3. CaDiCaL solves it and
   writes a text LRAT proof.
2. **UNSAT:** lrat-check and cake_lpr both read that CNF and that proof. If both accept, the outcome is `CERTIFIED-UNSAT`.
3. **SAT below the full CNF:** the kept clauses were too few. The configuration moves to level 4 (|I| ≤ 4), then to level 7 (the full
   CNF). A reduced CNF is a subset of the full CNF's clauses, so its refutation refutes the full CNF.
4. **The record** (one TSV line per configuration): idx, level reached, the trail of levels tried, the sha256 of the CNF and of the
   proof at the deciding level, each checker's verdict line verbatim (or `REFUSED`), sizes and CPU.
5. **Proofs and CNFs are deleted** after both checks; about 2.5 TB would not fit otherwise. CaDiCaL is deterministic, so a proof can be
   regenerated from the pinned tools and compared by its sha256.

## Caps and outcomes
| Event | Outcome |
|---|---|
| Both checkers accept | `CERTIFIED-UNSAT` |
| CaDiCaL passes 300 s, or its proof passes 4 GB, at a level | next level; after level 7, `OPEN(timeout)` |
| A checker refuses, or passes 300 s | `OPEN(checker)` |
| The generator fails | `OPEN(gen-fail)` |
| SAT on the full CNF at K = 9 | the model is decoded and the 40-vertex graph checked directly (9-regular, triangle-free, α by branch and bound); the run **stops** and the graph is reported, whether it passes (`SAT-GRAPH-VERIFIED`) or not (`SAT-GRAPH-REJECTED`) |
| Budget reached | no new configuration starts; the rest are `OPEN (not run)` in the tally |

- **Budget:** 1,440,000 CPU-s (400 CPU-hours; the projection is about 154). The driver stops submitting when the recorded CPU reaches
  the budget minus a margin for every running worker at all its caps, so live workers are counted.
- **OPEN is never read as UNSAT.** Open configurations are listed and can be rerun with larger caps under a dated amendment.
- **A verified graph at K = 9** would be a 9-regular (3,10)-graph on 40 vertices. It would go to the control room at once with its row
  list, and nothing would be said outside before an independent check.

## Controls, through the identical pipeline, before production (`check_controls.py`)
Production does not start unless all four pass.
- **C-SAT.** The 10 configurations known to have completions when the bound is 10 (`control_k10_sat.txt`), run with K = 10. Every one
  must end SAT on the full CNF with a graph that passes the direct check.
- **C-CORES.** Those 10 all lie on core X0. So 45 more configurations on cores X1–X3 run with K = 10 (`control_k10_cores123.txt`). No
  decoded graph may be rejected, and each of the three cores must give at least one verified graph.
- **C-TRUNC.** 24 configurations (two per stratum), run with the proof cut to its first half before checking. Both checkers must
  refuse all 24.
- **C-IDENTITY.** The 1,200 sampled configurations. Each must be certified at the same level as on the Mac, with the same CNF sha256.
  Whether the proof sha256 also matches across machines is recorded as a measurement.

## Cross-check by the control room
- `xcheck_1000.txt`: 1,000 configurations drawn with seed 20261122 from all 977,008 (`random.Random(20261122).sample`, sorted).
- The control room's own decider (own CNF, own solver run, own checks) decides them. Any disagreement with this run's records voids
  the run until explained.

## Disclosure: what ran before this registration
- The pilot and two benchmarks (`PILOT-RESULT.md`): every one of the 1,200 sampled configurations was already certified on the Mac by
  this pipeline's steps.
- A dry run of the four controls on the Mac with `prod.py`: all four pass. In C-CORES the cores gave 10, 9 and 2 verified graphs.
  - The control lists were fixed before the dry run and were not changed after it.
- No configuration outside the samples has been solved.

## After the run
- `prod.py tally` prints the counts and `ALL CERTIFIED-UNSAT` only if all 977,008 records are present, unique and certified.
- The ledgers and their sha256 come back from the pod before it is deleted.
- The derivation for Astra to read is `REDUCTION.md`.
