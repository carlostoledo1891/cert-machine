# P4 round three: the bytes theorem and the join (control room, 2026-11-22 20:21 UTC; PRIVATE)
Checked: A = `claude-r7/p4-read/` (P4-READ.md 1284b189…; Rd = `R7CnfReader.lean` 67ed9485…, 63 lines; Rp = `R7CnfRead.lean` 91d04c62…, 404 lines);
B = `codex-r7-scout/R7ProductionP4.lean` (57fdf82c…, 52 lines). C, S, M as before. Built by our route on our own compiled files. In one line:
both build and replay here and say what the reports say; the reader theorem pins what the reader returns, not what it refuses; B restates a hypothesis.

## What is NOT established (read first)
1. **The theorem does not pin the reader's strictness.** Our mutant reader with the clause-count check removed compiles Rp unchanged (exit 0,
   the same three axioms). Every "it refuses …" rests on reading 63 lines and on 35 small strings (ours), not on the theorem.
2. **The other readers are outside Lean** (theirs, item 1). One is on disk: `tools-bin/lrat-check.c` reads numbers with `%i` (C notation: a
   leading 0 is octal, `+` is taken) and skips comment lines before any clause. It differs from `readCnf` only on files `bytes` never writes.
3. **The variable bound is open** (theirs, item 4). Computed here on three files: the largest variable is 6,777 = V. No proof.
4. **The theorem is about a Lean string** (theirs, item 2): the file on disk rests on the compiler and on T2. **The reader never reads the
   comment line**: `core` and `idx` are not read back, and the theorem holds for any `core`, `idx`.
5. **No theorem joins A to B.** Nothing says "a refutation of what `readCnf` returns gives `Refuted (F …).1`". It would be one rewrite.
6. **B is a restatement, not an instance.** No Lean fact says any F is unsatisfiable. `cover`, P1, P2, C1 stay hypotheses too.
7. **The level is not load-bearing inside Lean.** Our `any_level` compiles: the same conclusion from `Refuted` at ANY level function (their
   `no_r7_plain` takes the level as an argument); the ledger and T2 tie a level to a record. So our level control refuses only the proof
   term, and by a resource limit, not a type mismatch: "maximum recursion depth has been reached" (B:38).
8. **An axioms line does not show a failure.** After a failed proof Lean printed the theorem's own name as its axiom (three writer controls)
   and "does not depend on any axioms" (the level control). The exit code and the error lines are the signal, never a search for `sorryAx`.
9. **`leanchecker --fresh` was run on neither part** (B by rule; A not asked); nanoda and con-leche not on B. Same Mac, toolchain, Mathlib;
   our `.olean` files equal theirs, so an equal export was expected. Three files in the file test. The chain below B was not rebuilt.

## Part A. Build and replay (Lean 4.35.0, `-DwarningAsError=true`, network denied, one process at a time)
- `artifacts-p4-read.sha256`: 11 of 11 OK. C, S, M still 3ec2b8ca…, 519b96e2…, 85d48e64…. Rd imports `R7Cnf` only; Rp imports `Mathlib.Tactic`,
  `Std.Data.String.ToInt`, `R7CnfSound`, `R7CnfReader`. Built on `p4-lean-build/olean` (d37d7132…, fe27fda2…); nothing written there.
- No hit in Rd, Rp for `sorry`, `admit`, `axiom`, `native_decide`, `unsafe`, `partial`, `implemented_by`, `extern`, `opaque`, `set_option`, `macro`,
  `notation`, `syntax`, `elab`, `attribute`, `instance`, `private`, `csimp`. `decide` (tactic) on character and string facts only. 122 constants.

| | Theirs (`build.out`) | Ours (`steps.tsv`) |
|---|---|---|
| compile Rd; Rp | exit 0; exit 0 | exit 0, 1.7 s, 0.39 GiB; exit 0, 19.8 s wall, 2.4 s user, 2.86 GiB; no warning |
| `.olean` Rd; Rp | f1ce32c1…; ec6eaf38… | f1ce32c1c77c9006…; ec6eaf384aaf6ac0… (equal) |
| axioms | `readCnf_bytes`: the three; `F_nz`: `propext`, `Quot.sound` | the same; `readCnf_bytes_clauses`: the three |
| export of the three roots | 34,150,135 bytes, ea4a1202… | 34,150,135 bytes, ea4a1202e091a7be…1633 (equal); 3 axioms declared; by program, its 138 constants of C, S, Rd, Rp (`bytes`, `F`, `readCnf` among them) equal our `.olean` in kind, type and value |
| nanoda, three axioms permitted; con-leche `--verified` | exit 0, 6,216; exit 0, 5,748 | exit 0, 6,216 (its printing of the statements equals theirs); exit 0, 5,748 |
| Lean's kernel: `leanchecker R7CnfReader R7CnfRead`; on the export file | exit 0; not run | exit 0 (18.3 s, 2.36 GiB); exit 0 |

## Part A. The statement
- **`readCnf_bytes` (Rp:355–356)**: for every `inp : Input` (any two Boolean tables, no condition), every natural `core`, `idx`, `ℓ`:
  `readCnf (bytes inp core idx ℓ) = some ((F inp ℓ).2, (F inp ℓ).1.length, (F inp ℓ).1)`. No hypothesis. As reported.
- **`bytes` is the function T2 hashed.** It is `R7Cnf.bytes` (C:111–117), the constant M:16 calls with the same four arguments
  (`bytes inp core idx lvl`); the all-rows run compiled C and M with these hashes (`t2-pod/bundle/`). Rp restates nothing: `bytes_eq` is `rfl`.
- **`Clause` is `List Int`** (C:6), the type F returns. Nonzero is not in the type; it is `F_nz` (Rp:143). Signs: the reader returns the
  integers as written; the theorem is an equality of lists of integers, so the convention is F's (`neg v = -v`, C:17; `lit`, S:13).
- **The reader, in plain words (Rd:20–61).** Four structural recursions on lists, total. `skipComments`: while the next character is `c`, drop
  up to and including the next newline. `toks`: cut at space, newline, tab, carriage return. `ints`: every token through `String.toInt?`;
  one failure gives `none`. `clausesOf`: a 0 closes a clause; integers after the last 0 give `none`. `readCnf` returns `some` in ONE branch
  (Rd:57), with clauses made only of the parsed integers. Of the writer's module it reaches one constant, `Clause`: not `F`, not `bytes`.

| Point | DIMACS as usually described | `readCnf` (checked by `#eval`, `logs/A.eval.out`) | Stated by the track |
|---|---|---|---|
| comments | lines starting with `c` before the `p` line | the same; after the `p` line: `none` | yes, real |
| comment block | most readers skip blank lines | a blank line or a space before or between comment lines: `none` | **no** |
| `p` line | `p cnf V C` on one line | four tokens, over any lines; a clause may start on that line | by implication |
| numbers | decimal, optional `-` | also `1_0` = 10, `007` = 7, `-0` and `00` = 0 (end the clause); `+1`, `1_`, `1__0`, `--1`: `none` | yes, real |
| size of a number | a machine integer | any size (2⁶⁴ + 1 accepted) | **no** |
| variable above V | an error | accepted (`p cnf 1 1`, `5 -99 0`) | yes, real |
| clause count | C clauses (readers differ) | exactly C, else `none`; a last clause with no 0: `none` | yes, real |
| `%` end marker of old files | accepted by some readers | `none` | **no** |
| white space | blanks and line ends | space, newline, tab, carriage return; a form feed: `none` | yes, real |
- **Every stated difference is real.** Three real ones are not stated (the comment block, the size, `%`). None is met in a file of `bytes`.
- **What another reader must share for the theorem to transfer.** A file of `bytes` is one comment line from character 0, `p cnf N M` on its
  own line, then M lines of nonzero decimals without `+`, `_` or leading zero, a space after each, `0` and a newline. Another reader gives the
  same clauses if it drops that first line, reads decimals cut at blanks and line ends, closes a clause at each 0, and keeps every clause.
  It may still REFUSE the file, on a variable above V (item 3) or on its own limits. A refusal is safe; a different reading would not be.
## Part A. Controls and the file test
| Control (one site changed; S and Rd compile each time) | Rp | First error |
|---|---|---|
| theirs: W-zero; W-space; W-header; W-minus | exit 1 each | Rp:197:31; 197:28; 175:0; 197:28 (the positions in their `controls.out`) |
| ours: clauses written last to first; last clause not written, header count kept | exit 1; exit 1 | Rp:175:0 both, `bytes_eq`: "Not a definitional equality" |
| ours, READER drops every sign (`Int.ofNat a.natAbs`) | exit 1 | Rp:287:17, unsolved goals in `ints_tok` |
| ours, READER without the count check | **exit 0** | none: see item 1 |
| kernels: export with `readCnf_bytes` made an axiom | nanoda exit 1, `Error: export file declares unpermitted axiom "R7Cnf.readCnf_bytes"`; con-leche exit 2, `not implemented yet: non-standard axiom (R7Cnf.readCnf_bytes) [at axiom R7Cnf.readCnf_bytes, fold position 5747]` | Lean's kernel exit 0: it does not police axioms |
| kernels: our compiled Rp beside the W-minus `R7Cnf.olean` (one declaration differs, `clauseLine`) | nanoda exit 101, `assertion failed: self.def_eq(u, v)`; con-leche exit 1, `application type mismatch [at theorem R7Cnf.clauseLine_toList, fold position 4123]` | Lean's kernel exit 1, at `clauseLine_toList` |
- **File test, ours** (their script not run). Files rebuilt by our builder `p4/build_bytes.py` (1e4b1d46…): idx 3 level 3, 93029 level 4, 332942 level 7,
  each with the ledger's `cnf_sha256` and size. The clause list is taken from the builder at each `emit` call, before any character is written.
  The reader, compiled natively with our own small `main`, writes what it returns; `cmp` against the builder's list: **equal on 3 of 3**.
  V = 6,777 and C = 29,599, 98,468, 354,830: the builder's counters and the ledger's `clauses` column. Control: one literal negated: different.

## Part B. Build, statements, control
- The sources of the 17 modules compiled in `p5b/p5c/p5d-build` are unchanged (`cmp`); the four hash lists are all OK. Nothing rebuilt.
- Compile: exit 0, 45.6 s wall, 2.6 s user, 4.71 GiB; `.olean` a31aa43f… (44,144 bytes). `leanchecker -v R7ProductionP4` (named): exit 0, 40.7 s, 4.63 GiB.
  Axioms of the three theorems: `propext`, `Classical.choice`, `Quot.sound`. The module holds 4 constants: 1 definition, 3 theorems. No weakening word.
- **`Refuted cs` (B:12–13)**: every assignment τ has a clause of `cs` all of whose literals are false under τ, with `R7Cnf.lit` (S:13).
- **`refuted_iff_no_model` (B:15–16)**: for every clause list, `Refuted cs ↔ ¬ ∃ τ, R7Cnf.Sat τ cs`. An iff, both directions proved (B:19–22,
  B:23–29; the second by contradiction). `Sat` and `lit` are the Claude track's constants from `R7CnfSound`; only `Refuted` is new.
  **`production_refutations_iff` (B:32–36)**: the same iff under `∀ i : RecordIndex cfg`, at `(F (inputOf coreLines cfg i.val).2 (level i)).1`.
- **`no_r7_of_production_refutations` (B:38–46)**: from P1, P2 of a census, C1, `cover`, and "for every record index, `Refuted` of F of that
  record at its own level": no graph on `Fin 40` with p ≠ q not adjacent, all degrees 9, 7 common neighbours, no triangle, independence ≤ 9.
- **Beside `no_r7_production`, by program** (`logs/B.inspect.out`): `p1`, `census`, `p2`, `slice`, `cover` identical; the conclusion identical; the
  last hypothesis differs, and the two sides of `production_refutations_iff` are exactly the new hypothesis and the old `unsat`. The proof
  is the old theorem applied to `.mp bad` (B:46). Nothing is weaker or stronger than "supplies exactly the premise".
- **Controls.** Level `level i + 1` in the hypothesis, proof unchanged: exit 1 (item 7). "Falsifies" turned into "all literals true": exit 1,
  B:19:2 unsolved goals and B:29:21 type mismatch; the equivalence is what breaks. And `any_level` (item 7): exit 0, the three axioms.
- **What B adds:** the hypothesis in the words a refutation checker uses. **What it does not:** an instance, a link to DIMACS or LRAT, a link
  to A's reader, any fact that some F has no model. Not supported by a file: "`leanchecker --fresh` passed" (their log has no such line).
## Verdicts
- **Part A: CERTIFIED.** It builds, three kernels accept, the numbers are theirs, seven wrong proofs fail to compile, the stale proof and the
  planted axiom are refused by both second kernels, the statement is as reported. Item 1 and the three unstated differences are additions.
- **Part B: CERTIFIED** for the module, the equivalence and the otherwise identical closing statement. **REFUSED** (not decided) for the one
  sentence "`leanchecker --fresh` passed": not run by us on the rule, and no log line of theirs shows it.
- **Battery:** 54% at the start, 52% at the end; nothing was stopped. CPU: 3.6 minutes in `steps.tsv`, about 0.6 in Python; the limit was 20.

| File (in `control-room-checks/p4-round3/`) | sha256 |
|---|---|
| `SHA256SUMS` (273 files); `steps.tsv`; `hashes.tsv` (bytes and sha256 of what was deleted at the end: three exports, the CNF files and lists, the native reader) | 2052d84a3532c2a0…; 8339f811d2e7788d…; b4b36da5df3753ec… |
| `scripts/run_one.py`, `mutate.py`, `A5_expected.py`; `scratch/A_Eval.lean`, `ReadDump.lean`, `B_Inspect.lean`, `B_AnyLevel.lean` | 3c24eb5e87d78c41…, a585595bf6670936…, e493a3a16fcdc923…; 209a17ef26f2f4e8…, 856f9d2c5aa0e934…, d6f60f986a3a2982…, a460abfbd72c8e41… |
| `logs/A.eval.out`, `logs/B.inspect.out`, `logs/A.census.txt`, `logs/A.stmt-hash.compare.txt` | 836f3f925d518fff…, 2ddb0777834e05c4…, d9181e3f9221c367…, b491c38ef9544999… |
