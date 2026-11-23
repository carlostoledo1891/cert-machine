# P4 in Lean, second note: two more kernels and the missing logs (Claude, 2026-11-22 18:10 UTC; revised 19:08 UTC; PRIVATE)

Answers two lines of `control-room-checks/P4-LEAN-READ.md`: "a second kernel, described, not run" and "not supported by a file".
`R7Cnf.lean` (3ec2b8ca…), `R7CnfSound.lean` (519b96e2…) and `R7CnfMain.lean` (85d48e64…) are unchanged.
**Revised at 19:08 UTC** after the control room's own run (`control-room-checks/P4-KERNEL2-CHECK.md`, round 22): its three facts
are added below, and the four sentences it found unsupported by a file now have a file or are reworded. The 18:10 text had
sha256 f69cf8e1….

## What is not established (read first)
1. **One Mac, one exporter.** nanoda and con-leche read the file `leanexport` writes (lean4export 3.1.0). Neither reads the
   `.olean`. That the export is the module rests on two checks: each of the three roots has a theorem body in it, and nanoda prints
   the three statements back (`kernel2.statements.txt`). I read that printing against the source by eye, not by program.
2. **The two kernels are the binaries in the pinned toolchain's `bin/`.** They are named by sha256 in `kernel2.out`. I did not build
   them from source. con-leche prints no version.
3. **One mutation of three went through the new kernels here.** The control is the threshold (k = 9 ∸ m ∸ max). The control room
   put the counter and row-order mutations through all three kernels (see its three facts below).
4. **nanoda's refusal names no declaration.** It ends with exit 101 and `assertion failed: self.def_eq(u, v)`. con-leche and
   leanchecker name the declaration they refuse.
5. **`leanchecker --fresh` was not run here.** The control room ran it: exit 0 on `R7CnfMain` (36 s) and on `R7CnfSound` (332 s). The
   two new kernels check the whole cone of the three theorems, Mathlib's part included (6,005 records).
6. **The exports are not kept** (26.6 MB and three smaller ones). Their sha256 are in `kernel2.out`, which is one run. `nanoda_bare.out` is a second
   export here with the same sha256 (b7ef93e3…), and the control room's export has it too.
7. **The native log is 39 rows on macOS arm64.** It adds no row to what the control room has already run. Since the revision
   each line of `native.out` holds the sha256 of the bytes written.
8. **Still open from the control room's list:** T1 gives existence only, with no bound 1..N on the variables; the program exits 0
   on bad input; the reading of the inputs and of the bytes has no theorem. Nothing here touches those.

## Three facts from the control room's check (its run, not mine)
1. **Counter and row-order mutations.** Beside either, roots T1 and T1_input are refused by all three kernels (at `atMost_count`
   and at `good_lex`). **Root T0 is accepted by all three, and that is correct:** T0 says F ignores the order of the sides and
   nothing about what F is. Only the threshold reaches T0, through `F_congr`.
2. **Lean's kernel does not police axioms.** It accepts an export in which T1 is an axiom. The guard is nanoda's permitted list
   and con-leche's pinned set; both refuse that export. nanoda's count alone shows nothing: it stays 6,637 with T1 as an axiom.
3. **`R7CnfSound` imports Mathlib.** 5,794 of the 6,005 records are Lean core and Mathlib.

## Three kernels on T1, T1_input and T0 (`kernel2.sh`, `kernel2.out`)
The modules were compiled again from this folder's sources, with every warning an error. Both `.olean` files have the control room's
hashes (d37d7132…, fe27fda2…). The export of the three roots from `R7CnfSound`: 26,630,503 bytes, sha256 b7ef93e3…; 3,600 theorems,
2,107 definitions, 289 inductive records, 4 quotient records, 2 opaque declarations of Lean core (`Lean.opaqueId`,
`String.Internal.append`) and 3 axioms (`propext`, `Quot.sound`, `Classical.choice`).

| Kernel | The proofs as built | Control: the same compiled proofs beside the mutated definition |
|---|---|---|
| nanoda_bin 0.4.19, the three axioms permitted, any other a hard error | exit 0, "Checked 6637 declarations with no errors" | exit 101 on each of the three roots |
| con-leche `--verified` | exit 0, "accepted 6005 declarations" | exit 1 on each root: "application type mismatch" at `R7Cnf.T1` (roots T1, T1_input) and at `R7Cnf.F_congr` (root T0) |
| leanchecker (Lean's own kernel) | exit 0 | exit 1: "(kernel) application type mismatch" while replaying `R7Cnf.F_congr` |

- **The two counts are one count.** nanoda counts each inductive record as its types, constructors and recursors:
  6,005 − 289 + (289 + 341 + 291) = 6,637.
- **The control.** `R7Cnf.lean` with one line changed compiles. The unchanged `R7CnfSound.olean` is put beside it, so each kernel
  reads the proofs already built against a definition they were not built for. This differs from `controls.sh`, where the proof
  file is compiled again and fails in the elaborator.
- **T0 is refused too, under the threshold mutation only.** Its proof goes through `F_congr`, whose term spells out the 10. In `controls.sh` the proof file is elaborated again, and the control room's
  reading found that T0 does not list `sorryAx` there.
- **nanoda with no printing option at all** (no `pp_declars`, no `pp_to_stdout`) says "1 pretty printer errors: Unable to print
  axioms" with exit 0 and no type-checker error (`nanoda_bare.sh`, `nanoda_bare.out`). With the three roots named it prints them
  and the three axioms, and reports no error. The control room, with an empty list and printing to stdout, saw no error either.

## The logs that were missing
| File | What it records |
|---|---|
| `build-strict.sh`, `build-strict.log` | the three modules with `-DwarningAsError=true`: exit 0 each; the only output is the three axiom lines of `R7CnfSound`, now copied into the log; both proof `.olean` files equal the copies in `build-strict/` |
| `native.sh`, `native.out` | the commands of `T2-COMMANDS.md`, toolchain only; one call on 39 rows (idx 3 and the 38 of `../p4-statement/sample.txt`; 25 at level 3, 12 at level 4, 2 at level 7): each line holds the sha256 of the bytes; 39 equal to the ledger's `cnf_sha256`, by the script and by a separate reading of the log against `prod.tsv` |

## Files
`kernel2.sh`, `kernel2.out`, `kernel2.statements.txt`, `build-strict.sh`, `build-strict.log`, `native.sh`, `native.out`,
`nanoda_bare.sh`, `nanoda_bare.out`; hashes in
`artifacts-p4-lean-2.sha256`. `kernel2.sh`, `kernel2.out` and `kernel2.statements.txt` are as the control room read them.
