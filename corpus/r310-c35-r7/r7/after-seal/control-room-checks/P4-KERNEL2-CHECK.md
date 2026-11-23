# P4 second-kernel check: our own run on our build (control room, 2026-11-22 18:53 UTC; PRIVATE)
Checked: `claude-r7/p4-lean/P4-LEAN-2.md` (f69cf8e13e6a0909…) and its seven files, against our build in `p4-lean-build/`. C, S, M as in
`P4-LEAN-READ.md`; "the export" is the file `leanexport` writes for the roots T1, T1_input, T0. In one line: both second kernels accept
our export, every wrong file we made is refused, the claim's numbers are the files' numbers; T0 has a blind side (item 3).

## What is NOT established (read first)
Theirs, by their numbers. **1** One Mac, one exporter: still so, ours included. **2** Bundled binaries, not built from source: the same
files here. **3** One mutation of three: closed here. **4** nanoda names no declaration: still so. **5** `--fresh` not run: closed here.
**6** Exports not kept: ours neither (bytes and sha256 in `exports.tsv`). **7**, **8** The 39 macOS rows; the first reading's open items: untouched.
1. **Our run is not a second witness of the export.** Same Mac, same toolchain files (same sha256), same compiled Mathlib; our `.olean`
   files are byte-equal to theirs. An equal export was expected. Ours are the driver, the reader of the export and the controls.
2. **The two kernels read the export, not the module.** For the 213 constants of C and S in it, a program of ours finds kind, type and
   value equal to our `.olean` (64-bit hash, not cryptographic; recursor rules not compared). The other 5,794 records (core, Mathlib)
   rest on the exporter. Binder names in an export are not the source's: the exporter shares records (seen on `id`).
3. **T0 does not notice the counter or the row order.** Beside either mutation all three kernels ACCEPT root T0, and rightly: T0 is
   still a theorem there (S compiled on top of each mutant fails, yet `T0` lists `propext, Quot.sound` and no `sorryAx`). Only the
   threshold reaches T0, through `F_congr`. T0 says F ignores the order of the sides. It says nothing about what F is.
4. **Lean's kernel does not police axioms.** It accepts both planted-axiom files. The guard is nanoda's list and con-leche's pinned
   set. nanoda's count stays 6,637 when T1 is an axiom and permitted: the count shows nothing; the configuration and the census do.
5. **`leanchecker MODULE` gives one verdict per module**, never "on each root". Lean's per-root verdicts below are ours
   (`leanchecker --from-export`, on the same files the two kernels read). `--fresh` is Lean's kernel again, not a rebuild.
6. **con-leche is known to me by its help text only**: no version, and its "main theorem" is its own word. No binary was compared
   with a release hash (no network). The mutations are three single sites, the track's own; the planted axiom is one theorem and a toy.
7. **The library path is the one saved at 12:01 UTC** (`p4-lean-build/LEAN_PATH.base.txt`). `lake env` was not called: it may write under the lane's folder.

## 1. The files (read, not run)
- `artifacts-p4-lean-2.sha256`: 8 of 8 OK. `artifacts-p4-lean.sha256`: 11 of 11 OK, itself still 5cc1ce2b… as at the first reading. C, S, M
  are byte-equal to our `src/` (3ec2b8ca…, 519b96e2…, 85d48e64…). In neither list: the two lists, `t2_sample.time`, `build/`, `build-strict/`.
- **`kernel2.sh`** compiles C and S into a work folder (`-DwarningAsError=true`), exports with `leanexport R7CnfSound -- <roots>`, runs
  `nanoda_bin` on a configuration that permits `propext`, `Quot.sound`, `Classical.choice` with `unpermitted_axiom_hard_error: true`,
  then `con-leche --verified --jobs=2`, then `leanchecker`. **The control:** Python replaces the one occurrence of `10 - I.length - maxMiss`
  by `9 - …`; the mutated C is compiled alone, the good `R7CnfSound.olean` is copied beside it, each root is exported alone from that pair.
- The 36 lines of `kernel2.out` follow from the script. `build-strict.sh` and `native.sh` are as described. The work folders are not kept.
- **Binaries**, all in `~/.elan/toolchains/leanprover--lean4---v4.35.0/bin`, dated 12 Oct like `lean`: `leanexport` (lean4export 3.1.0,
  01327b83d6a69dbc…), `nanoda_bin` (0.4.19, b5a75a50d07b06a2…), `con-leche` (no version, 4dc91239adc01a07…), `leanchecker` (d70e645ea2b0e597…).
  The hashes in `kernel2.out` are these files (`tools.txt`). No other copy under `instruments/rh-comparison`, `cert-machine-r1/`, `~/.elan`.

## 2. Our run beside theirs (our `.olean` files d37d7132…, fe27fda2…; every tool with the network denied)
| | Theirs (`kernel2.out`) | Ours (`steps.tsv`, `RESULTS.tsv`) |
|---|---|---|
| Export of the three roots | 26,630,503 bytes, b7ef93e3… | 26,630,503 bytes, b7ef93e35d49b34b…fbc16: equal, as expected |
| Records; axioms declared | 3,600 thm, 2,107 def, 289 inductive, 3 axiom, 2 opaque, 4 quot; `propext`, `Quot.sound`, `Classical.choice` | the same by our reader; 289 + 341 + 291 members, so 6,637; each root a theorem with a body |
| `nanoda_bin`, three axioms permitted | exit 0, 6,637 declarations | exit 0, 6,637; its printing is byte-equal to theirs (84d4fb26…) |
| `con-leche --verified` | exit 0, 6,005 declarations | exit 0, 6,005 |
| Lean's kernel: `leanchecker R7Cnf R7CnfSound`; on the export file | exit 0; not run | exit 0; exit 0, "Lean default kernel accepts the solution" |
| Threshold exports (T1, T1_input, T0) | 1b3d595b…, 7f39e921…, 79984a34… | the same hashes and sizes; mutated C `.olean` 38cfdc68… in both |

## 3. Controls (each export differs from ours in ONE declaration, by our own diff: `kOf`, `atMost`, `lexPair`, or T1)
| File | nanoda | con-leche | Lean's kernel on the file |
|---|---|---|---|
| threshold, roots T1, T1_input | exit 101, `assertion failed: self.def_eq(u, v)` | exit 1, `application type mismatch [at theorem R7Cnf.T1, fold position 5761]` (5762) | exit 1, at `R7Cnf.T1` |
| threshold, root T0 | exit 101, the same words | exit 1, `… [at theorem R7Cnf.F_congr, fold position 623]` | exit 1, at `R7Cnf.F_congr` |
| counter, roots T1, T1_input | exit 101, the same words | exit 1, `… [at theorem R7Cnf.atMost_count, fold position 4683]` (4686) | exit 1, at `R7Cnf.atMost_count` |
| row order, roots T1, T1_input | exit 101, the same words | exit 1, `… [at theorem R7Cnf.good_lex, fold position 5469]` (5472) | exit 1, at `R7Cnf.good_lex` |
| counter, root T0; row order, root T0 | **exit 0**, 2,413 declarations | **exit 0**, 2,117 declarations | **exit 0** |
| our export with T1 made an axiom | exit 1, `Error: export file declares unpermitted axiom "R7Cnf.T1"` | exit 2, `not implemented yet: non-standard axiom (R7Cnf.T1) [at axiom R7Cnf.T1, fold position 5761]` | exit 0 |
| toy module, `axiom bad : False` used | exit 1, `… unpermitted axiom "ZBad.bad"` | exit 2, `… non-standard axiom (ZBad.bad) [at axiom ZBad.bad, fold position 15]` | exit 0 |
| its twin with no axiom | exit 0, 14 declarations | exit 0, 7 declarations | exit 0 |
- `leanchecker R7CnfSound` beside each mutant: exit 1, at `F_congr`, `atMost_count`, `lexPair.eq_1`. With the planted axiom also
  permitted nanoda accepts both files (6,637 and 17): the list is what refuses. Nine wrong files, nine refused by both second kernels.
## 4. `leanchecker --fresh`: every constant of the module and of all it imports, replayed into an empty environment
- `R7CnfMain` (C, M and Lean's `Init`; 654 imported modules by our count): exit 0, 35.7 s wall, 32.6 s user, 0.47 GiB.
- `R7CnfSound` (S with Mathlib, Lean, Std, Aesop, Batteries; about 4,800 modules): exit 0, 331.5 s wall, 284.3 s user, 2.76 GiB.
  Both printed `replaying … with --fresh`, which only that branch prints. The tool drops flags it does not know.
## 5. The 39 native rows (nothing computed again)
- `native.out` has 39 row lines: idx 3 and the 38 of `p4-statement/sample.txt`; 25, 12, 2 at levels 3, 4, 7; 39 SAME. **It holds no
  hash**: each line is idx, level, bytes and the script's word. What can be checked: level and size equal the ledger's (`prod.tsv`
  ba545601…) on 39 of 39, and on those rows our own all-rows table (`t2-pod`) has Lean's hash and our builder's equal to `cnf_sha256`.
## 6. Verdicts
- **nanoda_bin 0.4.19: CERTIFIED. con-leche: CERTIFIED.** Each accepts our export and refuses the nine wrong files. **Lean's kernel
  (`leanchecker`): CERTIFIED** on the modules, on the export file and with `--fresh`; it refuses the seven stale-proof files.
- **Controls: CERTIFIED**, with item 3: T0 beside the counter or row-order mutation is accepted, correctly. Nothing REFUTED or REFUSED.
## 7. Not supported by a file; slips; files
- "39 with the ledger's sha256" is the word SAME. "The only output is the three axiom lines": a count of 3 is logged. "Equal in every
  run": one run is on file. "nanoda with no name to print says … Unable to print axioms": no file; ours, with an empty list, printed the
  three axioms and no error. Not theirs but my brief's: leanchecker "on each root"; "no Mathlib" (true of C and M; S imports Mathlib).
- **My slip, 18:25 UTC.** I called `leanchecker --help`. There is no such flag: with no module and no manifest it replays every module
  on its path. It ran 2 min 10 s on about six cores, about 11.5 CPU-minutes, 4.4 GiB at one reading, before I stopped it. It wrote
  nothing. Every later tool ran through `run_one.py` (600 s, 6 GB, a CPU cap). Total about 20 of 25 CPU-minutes (7.6 in `steps.tsv`).
- Two first tries of my own programs were wrong: the diff counted binder names (296 false differences on one file); the statement hash
  kept the let/have flag, which the exporter sets to false (30 of 213 unequal, then 213 of 213). `p4-lean-build/` was not rebuilt or
  written (58 of 58 hashes OK); the track's and the lane's folders are unchanged. Deleted at the end: eleven exports (217 MB) and three
  copies of `R7CnfSound.olean`; their bytes and sha256 are in `exports.tsv` and `olean.tsv`.

| File (in `control-room-checks/p4-kernel2/`) | sha256 |
|---|---|
| `SHA256SUMS` (all 263 files; the steps are `scripts/01-…` to `11-…`) | 658b113182b6caf36774c6bbb7a5dea457162218ee2eb9f74b48479ddce07b95 |
| `steps.tsv`, `RESULTS.tsv`, `exports.tsv`, `olean.tsv`, `tools.txt`, `native-rows.tsv` | f2cfc11713a6da09…, 94997755c327a206…, 75ee0cb760bdad4b…, d2182de2c7919ca8…, 8c8829907da2ebaa…, 6b6cff774a550e76… |
| `scripts/run_one.py`, `ndjson_tools.py`, `stmt_hash.py`; `stmt/StmtHash.lean` | 124fa0abb1ed4bf3…, 60053813959e8e47…, dbfbd8b75840d544…; a26b8630901ecabc… |
