# P5, fourth reading: the closing theorem on the production records (PRIVATE; 2026-11-22, 14:43–15:10 UTC)

Checked here: the Astra track's report "the closing theorem now applies to the actual production records". One agent of the control room read the files, once. Nothing left this machine.
Short names, in `codex-r7-scout/`: **Cl** = `R7Closing.lean`, **PE** = `R7ProductionEmbed.lean`, **PD** = `R7ProductionData.lean`, **PC** = `R7ProductionClosing.lean`, **Ex** = `R7ExportProduction.lean`, **N** = `R7-CNF-BRIDGE.txt`, **log** = `r7-production-closing-replay.log`. RM, Br, Cat, Co as in the third reading. `PD:9` is line 9 of PD.
Verdict words as in the third reading: **CERTIFIED**, **READ**, **REFUSED**.

## What is NOT established (read first)
1. **Lean does not prove that `cfg` is `configs.bin`, nor that `level` is the ledger's column.** Both are constants. Their values were read from two files while PD was being compiled (PE:22–26, PE:56; used at PD:9, PD:21). No theorem states a hash or one entry of either.
   - That they equal the pinned files is an **evaluation**: theirs (Ex), and ours here, two ways. It uses Lean's interpreter and the runtime's C code, not the kernel.
2. **The hashes of PD and PE do not pin the data.** Our mutant A: the same three source files, one byte of the records and two levels changed. PD and PC build and replay, exit 0, same axioms. The two compiled data modules differ (0d71aed2… and 7fc605a4…); the sources do not.
3. **The two size theorems say nothing about the file.** `cfg_size` (PD:16) and `num_records` (PD:19) follow from `Array.ofFn` over `Fin (10 * recordCount)` (PD:13). They hold for any literal. Mutant A has them too.
4. **The embedding reads two columns of the ledger: `idx` and `level`** (PE:40). It does not read K, the outcome, the two checker lines or the hashes. Mutant A carried a row marked `TIMEOUT` / `c NOT VERIFIED` and a row with K = 10; it was embedded without complaint.
5. **`no_r7_production` is a conditional.** P1, P2, C1, `cover` and `unsat` are hypotheses. The census is still a free variable. Lean holds no instance of `cover` or of `unsat`.
6. **The swap test has no transcript.** The report cites the log for it. The log has 124 lines and one comparison, a passing one (117–123). The two negative controls are prose in N:98–100.
7. **The graph is on `Fin 40`** (PC:16), not on any 40 vertices. The transport is trivial and is in no file.
8. **Unchanged from the third reading:** per-module replay, no `--fresh`, one Lean, one Mathlib, one kernel; Chen's library not rebuilt; T2, DIMACS and the checkers outside Lean; D5's count, the two converses and graph6 in general not formalised.
9. **The log has no times and no memory figures, and not the hash of the script that wrote it.** `check-r7-p5.sh` changed since round three (4f32a6e6… to 91e392b3…).

## Files
- **New (7):** Cl `a185e0fd597c85c4b2a69cf94683fb7c98d31e1c6bd9eb2e9d67c3292855df1b`; PE `90956e22ecb6f1c83d3d4c9d8bec5363481d31d7ab12e51355cddb1719f118a2`; PD `ff9101e1b7e49a80d0c35a1760467d4d58602257901d7c05d282fe7da5970190`; PC `5e68ec471e5011b86f56ad575f6618213b0b8b9bbc3061896cfe442890b2aad7`; Ex `6fd70dd4a8044a80f5a0c495b39214b8a11a69fd1b77ed3d456a6c3cd3cb77f6`; `check_r7_production.py` 506b1a2d…; log aba2205c….
- **Changed (2):** N 2f5ce8e1… to ba03fd6a…; `check-r7-p5.sh`. **Unchanged:** the other 44 files of `p5c-build/INPUTS.sha256`, the 13 older Lean files, `configs.bin` (76c2666b…) and both of Claude's Lean files among them. The ledger: ba545601…. Full list: `p5d-build/INPUTS.sha256`.
- **"All 15 modules"** = round three's 11 (R7Independence, R7SideChoices, R7Exchanges, R7Layout, Co, CT, Cat, R7Cnf, R7CnfSound, Br, RM) plus Cl, PE, PD, PC (N:143). They are exactly the track's and Claude's modules under the theorem (read from the environment). Ex is not one of them: it is run, not built. R7X0 and the three control modules are not in this log.
- **The data files the Lean reads:** `claude-r7/configs.bin` and `claude-r7/prod-out/prod.tsv`, found from the source file's own folder (PE:8–11). No other data file. The script and the Python comparison read the same two.

## How `cfg` and `level` are fixed
- **Mechanism: two term elaborators of their own** (`elab`, PE:22 and PE:56). Not `include_str`, not typed in, not computed. Each reads a file during the compilation of PD and returns ONE string literal (`Lean.mkStrLit`).
- **Records.** PE:23 reads `configs.bin`. PE:24–25 refuses any size but 9,770,080. PE:15–20 writes each byte as two letters, `'A'` + high half, `'A'` + low half. PD:9 names the literal `packedConfig` (private). PD:11–14: `cfg` is the byte array whose byte i is `((t[2i] − 65) <<< 4) ||| (t[2i+1] − 65)`, for i below 10 × 977,008. That inverts the packing on letters A..P.
- **Levels.** PE:30–54. The header's first four names must be idx, K, outcome, level (PE:32). Per row it takes fields 1 and 4 (PE:40). idx must be a number below 977,008 (PE:41–42) not seen before (PE:43). The level must be exactly `3`, `4` or `7` (PE:44–48). There must be 977,008 rows (PE:52). The level's digit goes to position idx, so the row order does not matter. PD:21 names the literal `levelCodes`. PD:23–24: `level idx` is byte idx of it, minus 48.
- **Types.** `recordCount : Nat := 977008` (PE:6). `cfg : ByteArray` (PD:11). `level : Fin (cfg.size / 10) → Nat` (PD:23). `RecordIndex cfg` is `Fin (cfg.size / 10)` (Br:102). `num_records : cfg.size / 10 = recordCount` (PD:19) is kernel-checked. So **`RecordIndex cfg` is exactly the numbers 0..977,007.**
- **Could the elaborator embed something other than the file's bytes?** Its encoding is faithful (read line by line; see the comparison). But it embeds whatever the two paths hold when PD is compiled. No hash is taken inside Lean. Their script hashes the two files first (`check-r7-p5.sh` 45–54), and only when the script is the builder. And see item 4.
- **Planted errors, ours** (`scratch/mutate.py`, `logs/mut-*`). Refused, exit 1: a level 5 ("unexpected level at record 12"); a repeated idx ("duplicate record: 7"); a file one record short ("expected 9770080 configuration bytes, read 9770070"); a row removed ("expected 977008 unique records, read 977007"). Accepted: mutant A.

## What was done, by our route (not by `check-r7-p5.sh`)
`lean` 4.35.0 (eb6cafb7), `-DwarningAsError=true`, byte copies in `p5d-build/src/`, equal to the originals at the end. `LEAN_PATH` = `p5d-build/olean`, then `p5c-build/olean`, `p5b-build/olean`, `p4-lean-build/olean`, `audit/chen-23678020/build`, then the lane's string (equal to round three's by `cmp`). The toolchain folder first in `PATH`. One Lean process at a time; none other alive at any poll. Byte copies of the two data files sit where the elaborator looks (`p5d-build/claude-r7/`), equal by `cmp` before and after. GB = 2³⁰ bytes.

| Module | Compile: wall, user, max resident | `leanchecker -v`: wall, max resident | Exit |
|---|---|---|---|
| Cl | 71.5 s, 2.7 s, 4.18 GB | 43.8 s, 4.28 GB | 0, 0 |
| PE | 3.9 s, 0.5 s, 1.25 GB | 9.9 s, 1.02 GB | 0, 0 |
| PD | 8.2 s, 7.6 s, 1.30 GB | 7.3 s, 1.03 GB | 0, 0 |
| PC | 64.5 s, 2.6 s, 4.19 GB | 57.5 s, 3.86 GB | 0, 0 |

- Nothing came near 45 minutes or 12 GB. `R7ProductionData.olean` is 20,558,184 bytes: the two literals.
- **Axioms** (`scratch/P5dInspect.lean`, `logs/inspect.log`). `no_r7_of_all_unsat`, `no_r7_plain`, `no_r7_production`: `propext`, `Classical.choice`, `Quot.sound`. `cfg_size`, `num_records`, and the definitions `cfg` and `level`: `propext`, `Quot.sound`.
- **Census of the four modules: 25 constants.** Cl: 2 theorems. PC: 1 theorem. PD: 4 definitions (`cfg`, `level`, the two literals) and 3 theorems (the two above and the unfolding lemma `cfg.eq_1`). PE: 15 definitions (`recordCount`, the two elaborators and their helpers). No axiom, opaque, unsafe, partial, `extern` or `implemented_by` among them.
- **Under the theorem, through every proof: 12,169 constants.** Three axioms. Two opaque constants, both in Lean's core and named by no constant of the track, of Claude or of Chen: `Lean.opaqueId` (inside core's own recursive definitions) and `String.Internal.append` (the text of panic messages, reached through `]!`). 96 constants are Chen's. Of PE only `recordCount`: the elaborators are not under the theorem.

## Does the kernel see the data as a checked literal?
- **Yes, as a literal; no, not as a checked fact.** `packedConfig` and `levelCodes` are ordinary safe definitions of type `String`. The value of each is one string literal: 19,540,160 and 977,008 bytes (read from the compiled environment). `cfg` and `level` are ordinary definitions over them. `leanchecker` replays all four.
- No `opaque`, `implemented_by`, `extern`, `native_decide`, and no file read when the theorem is used. The file read happens once, in the elaborator, when PD is compiled.
- The kernel accepts a literal as a `String` and carries it. It compares it with nothing. **No kernel-checked statement in their files pins the content:** only the size, and see item 3.

## Our own comparison with the pinned files (`logs/compare.log`)
1. **The literals as terms** (`P5dInspect.lean`). Every byte of the records literal is a letter A..P. Decoded with our own lines: 9,770,080 bytes; `cmp` against `claude-r7/configs.bin`: equal. Every byte of the levels literal is `3`, `4` or `7`; `cmp` against our column: equal.
2. **The definitions evaluated** (`scratch/P5dEval.lean`, 92 s). `cfg.size` = 9770080. The bytes of `cfg`, written to a file: **`cmp` exit 0, 0 positions differ.** `level i` for i = 0..977,007, one per line, against the ledger's level column ordered by idx: **0 of 977,008 differ.** Tally 879,379 / 97,627 / 2; level 7 at 332942 and 745446.
   - The column is ours (`scratch/ledger_levels.py`, `python3 -I`, no csv module): the bytes read hash to ba545601…; 977,008 rows; each idx once; the rows are not in idx order.
3. **This uses the evaluator, not the kernel.** The definitions of `cfg` and `level` reach 42 library functions that the evaluator replaces by C code (`String.toByteArray`, `ByteArray.get!`, `UInt8.sub`, `UInt8.shiftLeft`, `UInt8.lor`, `UInt8.toNat`, `Nat.sub` among them). None by `implemented_by`. Path 1 does not run `cfg` at all and agrees.
4. **The comparison can say "different".** Mutant A: 1 position differs (byte 5,000,003, record 500,000); 2 indices differ (12 and 745446); the tally is unchanged.
5. **The records as the theorem reads them** (`R7Cnf.record cfg`): record 89694 is (0, 220, 1604, 827, 2433), as round three read from the file. Core tags: 261,824; 261,586; 226,943; 226,655. Those are the cover run's counts per core. So `CoreRecord cfg j` is inhabited for each j, by evaluation.
6. **The ledger itself, our read.** Every row: K = 9, `CERTIFIED-UNSAT`, `c VERIFIED`, `s VERIFIED UNSAT`, and the last step of `trail` is `<level>:UNSAT`. 97,627 rows say `3:SAT,4:UNSAT` and 2 say `3:SAT,4:SAT,7:UNSAT`. So a lower level at those indices would make `unsat` false there, by the ledger's own account. The match by index is needed.

## The closing theorem, as a referee
**`no_r7_production` (PC:10–19).** `cfg` and `level` are `R7ProductionData.cfg` and `R7ProductionData.level` (printed with full names; they enter through `open` at PC:8). Hypotheses:
- `p1 : EdgeLowerBound 8 27 85` (PC:11): every triangle-free graph on `Fin 27` with independence number below 8 has at least 85 edges (Chen's `EdgeBound.lean` 18–20).
- `census`, implicit, any; `p2 : P2 census`; `slice : C1 census` (PC:11). As in round three (Cat:40–42, Cat:46–48).
- `cover` (PC:12–13): for each core j of four and each ordered 4-tuple T with `Section3 (graph j) T`, some record r of the embedded buffer tagged j and one of 8 images `im` give T = `recordSides cfg r ∘ source im`. **This is the form our cover run established**, RM:68–69 with the buffer now the constant.
- `unsat` (PC:14–15): for every index of `RecordIndex cfg`, no τ : ℕ → Bool satisfies `(R7Cnf.F (R7Cnf.inputOf coreLines cfg idx).2 (level idx)).1`. **Exactly "F of the decoded input at that record's level has no satisfying assignment".** `F`, `inputOf`, `record` are declared in module `R7Cnf`, `Sat` in `R7CnfSound`: Claude's, our compiled copies, unchanged hashes.
- **Conclusion (PC:16–18):** there is no graph G on `Fin 40` with vertices p ≠ q, not adjacent, every vertex with exactly 9 neighbours (`(G.neighborSet v).ncard = 9`), exactly 7 common neighbours (`(G.neighborSet p ∩ G.neighborSet q).ncard = 7`), no triangle (`G.CliqueFree 3`) and `G.indepNum ≤ 9`. **That is the graph statement asked for.**
  - No decidability and no finiteness instance is among the binders. `ncard` is a count of a set; its junk value 0 arises only for infinite sets, and `Fin 40` has none. `indepNum` takes no instance (Mathlib `Clique.lean` 1045).
- **Proof:** one line (PC:19), `no_r7_plain` applied to the two constants.

**`R7Closing.no_r7_plain` (Cl:22–43)** and `no_r7_of_all_unsat` (Cl:9–19): the same with `cfg` any byte buffer and `level` any function (Cl:11, Cl:24). They are our scratch `P5cContra.lean` word for word; `diff` shows two doc comments changed and nothing else. Cl:32 takes decidability by choice. Cl:35–43 turn the two `ncard`s into the `card` and `degree` of `Hypotheses` (Co:15–21).
**Assumed that earlier readings did not list: nothing.** The five premises are round three's. What is new sits outside the statement: items 1–4.

## What stands between the ledger and "no such graph", after this theorem
1. **P1, lower half.** The literature. A hypothesis (PC:11). Not checked by us.
2. **P2.** The literature, for a census Lean does not know. That the census is McKay's file (gz 9a2e9723…, unpacked f64e710e…, which we confirm) is an identification outside Lean.
3. **C1.** Two scans of that file: theirs (log line 4) and ours of round three. They agree.
4. **`cover` as a fact.** Our cover run on the four cores, two checkers each. Two readings: the cover CNF's models are the `Section3` tuples; the 6-set numbering (evaluated equal on all four cores). New: the run's records (its bundle's `configs.bin`, 76c2666b…) are the embedded buffer, by bytes and by counts per core.
5. **`cfg` is `configs.bin` and `level` is the ledger's column.** Evaluation, theirs and ours. Not the kernel.
6. **T2.** The bytes of F at each record and level hash to the row's `cnf_sha256`. A pod run in progress. Not checked here.
7. **The checkers.** That they read those bytes as the clause list F, and that their acceptance means no model. No DIMACS theorem.
8. **The ledger as the pod's account** that every row was refuted, with both checkers, at the level it names.
9. **Chen's compiled library:** `r7_count`, `indepNum_le_of_embedding`, and the definition `EdgeLowerBound`. As compiled by our audit.
10. **The Lean kernel, one of them, per module; Mathlib as compiled; the three axioms.**
11. **A graph on any 40 vertices is one on `Fin 40`.** Trivial.

## Weakening search (the five new files)
No hit for `sorry`, `admit`, `native_decide`, `unsafe`, `partial`, `implemented_by`, `extern`, `set_option`, `opaque`, `Fact`, `instance`, `macro`, `syntax`, `notation`, `attribute`, `noncomputable`, `decide`, `cbv`, `include_str`, `]!`, `getD`.
- **`elab`, two, the new mechanism:** PE:22 `elab "r7_config_literal%" : term => do`; PE:56 `elab "r7_ledger_levels%" : term => return Lean.mkStrLit (← readLevels (← dataDir))`. Used at PD:9 and PD:21.
- **File I/O:** PE:23 `IO.FS.readBinFile`; PE:30 `IO.FS.withFile … .read`. Ex:13–14 `IO.FS.writeBinFile` (the export only).
- **`axiom`:** only the five `#print axioms` lines (Cl:45, Cl:46, PD:26, PD:27, PC:21).
- **`get!`, a default of 0 on a bad index:** PD:14 twice, PD:24. Never reached: the literals have exactly the lengths read. PE:43 is in the elaborator.
- **Truncating subtraction:** PD:14 `- 65` on bytes, PD:24 `- 48` on ℕ. No byte of either literal is below `'A'` or `'0'`.
- **`private`:** PD:9, PD:21 (the two literals); PE:8, PE:15, PE:30; Ex:5. The kernel sees them like any other.
- **`repeat`:** PE:36, in the elaborator. **`classical`:** Cl:32. **`inferInstance`:** Cl:34.
- Ex is imported by nothing and proves nothing.

## The track's replay log
15 × `build exit 0`, 15 × `leanchecker exit 0`, `production export exit 0`, `production comparison exit 0`, last line `replay script exit 0`. The codes are printed by the script itself. The 15 source hashes equal today's files; so do Ex's and the Python's (lines 115–116). Reproduced here by our route for the four new modules; the other 11 in rounds two and three. Its comparison lines (120–122) agree with ours: all bytes, all indices, the tally, the two level-7 indices, and the hash of the level column as one byte per index (6d342507…, recomputed from our column).

## The revised note against round three's list of what the report left out
- **Now stated:** the contrapositive (N:47–51). P1 and P2 as literature, and the census as McKay's file with its hash (N:104–110). C1 as scans (N:111–114). The cover certificates and the two identifications (N:115–124). T2 (N:125–130). The checkers' parsing, their soundness, the ledger (N:131–137). `include_str` (N:69). `cbv` and its three settings (N:70–71). Chen's two theorems (N:72–73). The three input hashes (N:62–67). That the tie to the files is "elaborator I/O, the Lean runtime, and external SHA-256" (N:84–91). T1 gives existence (N:14).
- **Still missing:** that the size theorems hold for any literal (N:79–80 gives them as facts about the data). A transcript of the two negative controls. That no instance exists and the K = 10 control cannot pass through the theorem. No `--fresh`, one kernel. The earlier `decide +kernel` proofs and `]!` defaults. That `EdgeLowerBound` is Chen's definition. `Fin 40` against any 40 vertices. What is still not formalised (D5's count, the two converses, graph6 in general). That the embedding ignores every column but two.

## Where the report says more than the files do
1. "Caught at the first changed index (`r7-production-closing-replay.log`)": the log holds no negative control (item 6).
2. "Both `cfg` and `level` are fixed in the theorem": fixed as two named constants. Which bytes they hold is settled by a file read at compile time. Lean knows neither file (items 1–3).
3. "Applies to the actual production records": true by evaluation, theirs and ours. Not by proof.
4. "On 40 vertices": on `Fin 40`. "(PC:10)": the theorem starts there; the constants appear at PC:13–15.
5. "Independently matched": their export is their Lean file in the interpreter; the match is their Python. A fair description. Ours is a second one, and it agrees.
6. Not said: the embedding is a custom elaborator doing file I/O; it reads two columns; the script changed.
7. **True as said:** 15 builds and 15 replays; the axioms; every byte and every level equal; the note names the premises, the core-file hash and the three settings.

## One line per new public theorem
- `no_r7_of_all_unsat` Cl:9 and `no_r7_plain` Cl:22: **CERTIFIED.** Our scratch; REDUCTION.md 7–8 and 116–117, as a conditional on any buffer.
- `cfg_size` PD:16, `num_records` PD:19: **CERTIFIED.** True by construction; nothing about the file.
- `no_r7_production` PC:10: **CERTIFIED as a conditional about the two constants.** That the constants are the pinned files: evaluated equal by two parties, **not proved**.
- **REFUSED:** `leanchecker --fresh`; a rebuild of Chen's library and of the 13 older modules (hashes unchanged, our compiled copies used); a second kernel; a run of their script; their swap test; a kernel-checked entry of the data; T2.

## Later items, not acted on
- The embedding could refuse a row whose K, outcome or checker lines are not the expected ones (PE:40). Today only the two Python reads do.
- A kernel-checked pin of the data was not tried. The cheap course keeps it outside: the two hashes beside the theorem, and the evaluation as a registered step with a planted error.
- N should say that the size theorems are by construction, and carry a transcript of its negative controls.
- Files: `p5d-build/SHA256SUMS` lists every file of the build folder. The mutants' large inputs were deleted after their runs; `scratch/mutate.py` rebuilds them.
