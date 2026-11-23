# T2, the all-rows comparison of premise P4 — pre-registration (control room, PRIVATE, 2026-11-22 12:49 UTC)

Timestamped before the pod exists. The operator's word: the run goes on a pod when our own build of the Lean passes
(the session dialog, about 11:55 UTC). It passed: `../P4-LEAN-READ.md`.

## What is not established, whatever the run returns
1. **T2 is a computation, not a proof.** It is called computed wherever it is stated.
2. **The compiled program rests on the Lean compiler and runtime** (from `R7Cnf.F` one reaches 12 `csimp` rules, 35
   `extern` functions and 1 `implemented_by`, all in Lean core), and the hashing on coreutils `sha256sum`.
3. **The ledger is the pod's own account** of what the production run solved. T2 compares with it; it does not check it.
4. **The decoding of the inputs is not proved** (graph6, the records, the 6-set numbers). Two programs written
   separately agree on it; that is agreement.
5. **No theorem yet joins T1 to the other track's modules,** and T1 has never been applied to an example.
6. **Known before this registration:** the Lean definition's bytes equal the ledger on 88 rows (`../P4-LEAN-READ.md`),
   and this run's own script passed its controls on the Mac on the 200 rows it draws (seed 20261125): 200 of 200 equal.

## Pins (`bundle/T2-PINS.sha256`)
`R7Cnf.lean` 3ec2b8ca…, `R7CnfMain.lean` 85d48e64… (the Claude track's, unchanged since our reading), our builder
`build_bytes.py` 1e4b1d46… (written from the page alone, before any hash was compared), `configs.bin` 76c2666b…,
`cores_e85.g6` 6b237361…, the ledger's four columns `ledger-slim.tsv.gz` 301cf149… (idx, level, cnf_sha256, cnf_bytes
of `prod.tsv`, sha256 ba545601…), and the two run scripts. Toolchain: Lean 4.35.0, commit eb6cafb7…, checked on the pod.

## The run (`t2_pod_run.sh`, `t2_run.py`)
- The native program is built on the pod with the Claude track's three commands (`T2-COMMANDS.md` 9b93500b…).
- For each of the 977,008 rows, at the ledger's level: the program writes the file; `sha256sum` hashes it; our builder
  builds the bytes; the two byte strings are compared directly; both hashes and the size are compared with the ledger.
- The script checks each record number and level before it calls the program, which checks nothing by itself.
- Nothing is kept but one result line per row.

## Controls, before the run; it does not start unless all pass
On 200 rows drawn by `random.Random(20261125).sample(range(977008), 200)`:
- baseline: all 200 equal the ledger by both programs;
- A: a program built from the same sources with the threshold 10 replaced by 9 must differ from the ledger on all 200;
- B: the wrong level for each row must differ from the ledger on all 200, by both programs;
- C: a ledger hash with one digit changed must be reported unequal.

## Outcome
- **COMPUTED, all equal:** every row present once, the two programs' bytes equal, both hashes and the size equal to
  the ledger's, on all 977,008.
- **Any unequal row** is listed and reported first. It would mean the file the solver read is not F for that row. It
  goes to the operator and nowhere else.
- **Incomplete:** a count, never a verdict.

## Cost
A CPU pod with 32 vCPU (cpu5c, about US$1.12 an hour). Measured on the Mac on the 200 control rows: about 0.48 CPU-seconds
a row for both programs together, so about 130 CPU-hours: 6 to 12 hours, US$7 to 13. That is above the US$5–8 quoted to
the operator; they are told when the run starts. Deleted after the pull.
