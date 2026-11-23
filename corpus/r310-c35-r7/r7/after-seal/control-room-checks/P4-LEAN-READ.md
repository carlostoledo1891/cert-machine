# P4 Lean read: the two modules, the program and page v2 (control room, 2026-11-22 12:40 UTC; PRIVATE)

Checked: the report of the track called Claude on `claude-r7/p4-lean/` and `p4-statement/P4-STATEMENT-v2.md`. Short names:
C = `R7Cnf.lean`, S = `R7CnfSound.lean`, M = `R7CnfMain.lean`, v2 = the page; `C:60` is line 60 of C. In one line: both modules build and
replay here, the theorems say what the report says, F is the page's list, 12 of 12 rows are byte-equal. What is missing lies around the theorems.

## What is NOT established
1. **T2 is not run.** The Lean definition's bytes have met the ledger on 88 distinct rows of 977,008 (0.009%): the author's 77
   (the same 77 idx as our page test, so no new row), 10 new rows here, and idx 3 (native only).
2. **No theorem joins T1 to the other track.** (a), (b), (c) are hypotheses; nothing derives them from a graph completion.
   The types differ: here `Fin 27` and `Fin 7 → Finset (Fin 27)`; there `X ⊕ Fixed` and rows indexed by fixed vertices.
3. **The reading of the inputs is not proved.** `adjOfGraph6` (C:122–128), `record` (C:131–133), `inputOf` (C:136–144) have no theorem.
   Nothing says the table is the core's graph or that the sides are the record's 6-sets. Not even `T1_input`'s two table hypotheses
   (S:844–845) are proved for `inputOf`. My `scratch/P4Decode.lean` proves both for `adjOfGraph6`; the lookup table (C:139–140) is not done.
4. **No theorem is about bytes.** `clauseLine` (C:108) and `bytes` (C:111–117) are printers without a statement. There is no
   DIMACS reader. "The file, read back, is F" stays a premise.
5. **T1 gives existence only** (`∃ τ`, S:689). It does not say τ's x variables are the rows (`core` drops that at S:644), nor that the
   variables lie in 1..N as the page's T1 does (v2:59): the bound is proved per gadget (`Good`, S:63–65) and dropped by `run_sat` (S:87–89).
   No theorem says no literal is 0. On my 16 files a script found none, with largest variable = header N = 6,777.
6. **T1 is never applied.** No (X, S, R) is shown to satisfy (a), (b), (c). The K = 10 control cannot serve: 9 and 10 are
   literals in F (C:52, C:60) and in T1 (S:685, S:688).
7. **T0 is about F, not about files or records.** B carries `cfg=<idx>`. No theorem takes a swapped record through `inputOf`.
8. **One Lean, one Mathlib, one kernel.** Same toolchain and compiled Mathlib as the author; our two `.olean` files are byte-equal to
   theirs. `leanchecker` replays a module on top of its imports; `--fresh` was not run. One of the three controls was reproduced.
9. **The bytes rest on the compiler.** From `F`, through definitions only, one reaches 12 `csimp` rules, 35 `extern` functions and 1
   `implemented_by`, all Lean core's (`List.map`, `filter`, `flatMap`, `append`; `Nat`, `Int`). The three files add none.
10. **The program does not stop on bad input.** `]!`, `get!`, `toNat!` (C:124, 132, 138–144; M:13–14) yield a default and exit 0.
11. **Branches no hash can test.** AtMost's "k ≥ n" and "k = 0" (C:21–22) and (I) with k = 0 never occur on a ledger row: there Lean and
    page agree by reading only (T1's proof covers them, S:188–210). `r7cnf.c` was not opened: the page's guard (v2:37–40) is unchecked.
12. **The folder changed during the read.** `T2-COMMANDS.md` appeared at 12:15:57 UTC and `artifacts-p4-lean.sha256` went from
    707c0217… (10 lines) to 5cc1ce2b… (11 lines, each OK). C, S, M and P4-LEAN.md did not change (hashed before and after).

## Hashes, build, replay, axioms (items 1–3). Lean 4.35.0 (eb6cafb7), `-DwarningAsError=true`, one process of ours at a time
- v2 `e15fdd1fdeb5079c6c69ac7d6bbfea588fda9448a16f263d70cfc7d65a61cd87`; v1 8a09d883… beside it; P4-LEAN.md 7f79b0ae…; M 85d48e64….
  C `3ec2b8ca9fa14b00327fd1c7ac527294b81ccf0d256f21fc6b3e9031e4452a03` (146 lines); S `519b96e24c7ad1cc7b1fa5378761736469c01f6390392480653b33dbf5b651d5` (900).
  All as reported. The hash list: every line OK at both readings. Not in it: `t2_sample.time`, `build/`, `build-strict/`. Built from byte copies in `src/`.

| Step | `LEAN_PATH` | Wall, user | Max resident | Exit |
|---|---|---|---|---|
| compile C | our folder only (no Mathlib) | 1.0 s, 0.3 s | 0.40 GB | 0 |
| compile S | our folder + the lane's Mathlib | 20.2 s, 4.1 s | 2.90 GB | 0 |
| compile M | our folder only | 1.8 s, 0.1 s | 0.39 GB | 0 |
| `leanchecker -v R7Cnf`, then `R7CnfSound` | with Mathlib | 6.7 s, 0.9 s; 19.3 s, 1.8 s | 0.36 GB; 2.35 GB | 0; 0 |
- **C imports nothing:** no `import` line, and it compiles with no Mathlib on the path. M imports `R7Cnf` only. **S imports**
  `Mathlib.Tactic`, `…SimpleGraph.Finite`, `…SimpleGraph.Clique`, `Mathlib.Data.Fin.Tuple.Sort`, `Mathlib.Order.PiLex`, `R7Cnf` (S:1–6).
- **Axioms of all 48 named theorems** (all in S, all public; C has none), from `scratch/P4Axioms.lean`:
  - none: `lit_agree`, `Sat.agree`, `Bdd.mono`. `propext` only: `natAbs_pos'`, `natAbs_neg'`, `foldl_run`, `run_cons`, `Sat.append`,
    `getD_lt`, `getD_mem`, `cnt_zero`, `cnt_succ`, `atMost_count`, `exactly_eq`, `maxMiss_mk4`.
  - `propext`, `Quot.sound`: **`T0`**, `lit_neg`, `lit_negv`, `run_sat`, `cnt_le`, `atMost_clauses`, `sinz_bound`, `sinz_s`, `sinz_agree`,
    `xv_le`, `xv_pos`, `xv_inj`, `tau0_x`, `IsRows.agree`, `good_T`, `subsets7_nodup`, `agreeBelow_succ`, `indepSubs_spec`, `F_congr`,
    `sidesAt_mk4`, `F_mk4_congr`. The three standard: **`T1`**, **`T1_input`**, `lit_pos`, `atMost_good`, `exactly_good`, `good_row`,
    `good_col`, `good_I`, `good_lex`, `core`, `finRange_countP`, `eq_mk4`.
- **Census of every constant:** C 51 (4 theorems, generated), S 202 (183 theorems: the 48 and 135 auxiliary), M 6. None uses an axiom
  outside the three. No `sorryAx`, axiom or opaque declaration. One flag: `indepSubs._unsafe_rec`, the compiler's copy of C:40–44.
  `F` and `bytes` use `propext` only; `inputOf` and `main` show the three through core functions (`String.splitOn`, `IO.FS.readFile`, …): erased proofs.

## Weakening search and the control (items 4, 8)
- **No hit** in C, S, M for `sorry`, `admit`, `axiom`, `native_decide`, `unsafe`, `partial`, `implemented_by`, `extern`,
  `set_option`, `opaque`, `csimp`, `noncomputable`, `macro`, `notation`, `attribute`, `open Classical`, `private`.
- `classical` (tactic): S:690 in T1's proof, S:854 in T1_input's proof; both conclusions are propositions. No constant of the
  three modules names a `Classical.*` constant in a statement or a definition's value. `missF` (S:677) uses `Finset.decidableDisjoint`.
- `instance`: one, S:516–517, `Decidable (agreeBelow …)` by `unfold; infer_instance`; used by `lexTau` (S:520) only; no axioms.
- `decide` (tactic): S:776 (`false < true`), S:798 (`List.finRange 4 = [0, 1, 2, 3]`). `by_contra`: S:207, 755, 771. `@[simp]`: S:56–57. `getD … 0`: C:25–30.
- **The bytes come from the proved definition.** M:15–16 calls `inputOf` and writes `bytes inp core idx lvl`; `bytes` calls `F` at C:112.
  No second implementation. The statements of T0, T1, T1_input each reach every constant under `F`.
- **The threshold control, reproduced.** `mut-threshold/src/R7Cnf.lean` differs from C in line 60 only (`9 - I.length` for `10 - I.length`).
  It compiles. S then fails, exit 1; first error `R7CnfSound.lean:752:117: error: unsolved goals`. T1 and T1_input list `sorryAx`; T0 not.

## The statements, as a referee reads them (item 5)
- **"A model of F" is the standard notion.** `Sat τ cs` (S:16): every clause has a literal true under τ : ℕ → Bool; a negative
  literal is the negation of its variable (S:13); an empty clause cannot be satisfied.
- **`T1` (S:681–689).** For every simple graph X on `Fin 27`, every four finite subsets S 0..S 3 (no size, independence or disjointness
  assumed), every natural ℓ and every seven finite subsets R 0..R 6 (repeats allowed). These are the page's quantifiers (v2:54–60).
  - (a) S:683: each R c is independent in X and has exactly 7 members;
  - (b) S:684–685: for each y, degree(y) + #{j : Fin 4 | y ∈ S j} + #{c : Fin 7 | y ∈ R c} = 9. Every count here and in (c) is
    `Finset.univ.filter` over `Fin 4` or `Fin 7`: over indices, equal sets counted once per index;
  - (c) S:686–688: for each nonempty independent I, #{c | R c ∩ I = ∅} < 10 − |I| − max(m(S 0) + m(S 1), m(S 2) + m(S 3)),
    with truncated subtraction and m(T) = 1 if T ∩ I = ∅, else 0 (S:677);
  - then some τ satisfies every clause of `(F (inputOfGraph X S) ℓ).1`. `inputOfGraph` (S:673–674) is the two truth tables.
- **`T1_input` (S:844–853).** The same for any `Input` whose table is symmetric (S:844) and loopless (S:845); (a) S:846,
  (b) S:847–848, (c) S:849–852 on the table, the sides being `sideSet inp j` (S:841). Conclusion: `∃ τ, Sat τ (F inp ℓ).1`.
- **`T0` (S:815–822).** For every table (symmetry not needed), four Boolean functions s0..s3 and ℓ: `F` of the orders
  (s1 s0 s2 s3), (s0 s1 s3 s2), (s1 s0 s3 s2), (s2 s3 s0 s1), (s2 s3 s1 s0), (s3 s2 s0 s1), (s3 s2 s1 s0) equals `F` of
  (s0 s1 s2 s3), as pairs (clause list, final N). `eq_mk4` (S:830): every input has that form.
- **The level is a real parameter and T1 holds for every level.** ℓ enters F at C:72 only; (c) has no level. On idx 4011 the
  (I) clauses number 0, 15,730, 87,333, 228,838, 345,255 at levels 0, 3, 4, 5, 7 (level 8 = level 7).
- **The row order is proved, not assumed.** T1 sorts the seven rows (`Tuple.sort`, S:691–693; `false < true`), shows the sorted
  rows meet (S) (S:769–777), and carries (a), (b), (c) across the permutation (S:695–768).
- **What T1 would not give** for "this completion yields a model of the file the solver read": the completion itself (item 2);
  the record and the core (item 3); the bytes (item 4); that the solver's file is those bytes (item 1); 1..N (item 5).

## F against page v2, and the page itself (items 5, 6)
- **The Lean `F` is the page's clause list**, read line by line: x(c, y) (C:14, v2:20); N from 189 (C:104); AtMost with its three
  cases, `base`, s(i, j), the j loop in pairs (C:20–31, v2:22–26); Exactly (C:34–37, v2:27); (T) (C:66–68, v2:28); (D) rows then
  columns (C:95–96, v2:29); (I) with c outer, y inner, subsets by Σ 2^c (C:63, 71–77, v2:30–32); (S) (C:80–88, v2:33–34);
  order T, D, I, S (C:93–98); IS (C:40–47, v2:14); r′ and k by truncated subtraction (C:52, C:60, v2:13, v2:30).
- **Where the Lean says more:** `Input.adj` is any Boolean table, not only a graph. (T) and IS read it for y < z only; `deg`
  (C:49) reads the whole row. `bytes` (C:111–117) follows v2:48–50.
- **The five open choices are closed:** `base` = N on entry (v2:23); the two j-loop clauses in turn (v2:25–26); c outer, y inner
  (v2:31–32); counts over indices (v2:9–12); k and r′ by ∸ (v2:13, v2:30), so F is defined for every input (v2:19).
- **The undefined terms are closed:** ¬v is −v, independent (v2:7); A and B sides (v2:8); the 8 images (v2:16–17); ℓ is the `level` column
  (v2:15); records from 0, unsigned (v2:43–44); graph6, lines from 0 (v2:45–46); the `p` line's numbers (v2:49); `-` for a negative literal (v2:50).
- **Nothing in v2 changes the bytes of a ledger row.** Our builder, written from v1, equals the Lean bytes on 16 pairs. Three v2 sentences
  it does not follow, none met on the ledger: it refuses under the guard (v2:36–40: not part of F); it stops when Exactly's n − k is
  negative (v2:27: n ∸ k); for k below 0 in (I) it writes no clause (v2:30: k = 0, one empty clause, which v2 does not spell out).

## Bytes, on our rows (item 7)
Draw: `random.Random(20261124)`, `scratch/draw_rows.py`, fixed before any byte was built. The two level-7 rows are the ledger's only ones
and are among the 77; the other 10 are new. Lean = `lean --run src/R7CnfMain.lean cores configs OUT idx:level` (usage at M:4).
**On each of the 12 rows the Lean file and the Python file are equal by `cmp`, and `shasum -a 256` of each equals the ledger's `cnf_sha256`.**
| idx | level | bytes | Lean user s | Python s | idx | level | bytes | Lean user s | Python s |
|---|---|---|---|---|---|---|---|---|---|
| 4011 | 3 | 1,089,797 | 1.84 | 0.1 | 888439 | 4 | 5,953,542 | 6.02 | 0.4 |
| 200100 | 3 | 1,056,042 | 1.85 | 0.1 | 915555 | 4 | 5,814,443 | 5.91 | 0.5 |
| 786132 | 3 | 1,113,092 | 1.85 | 0.1 | 332942 | 7 | 23,618,970 | 18.39 | 1.5 |
| 959119 | 3 | 1,095,145 | 1.86 | 0.1 | 745446 | 7 | 23,519,932 | 18.81 | 1.5 |
| 68118 | 4 | 5,905,285 | 5.91 | 0.4 | 635569 | 3 | 1,117,849 | 1.83 | 0.1 |
| 197094 | 4 | 5,893,367 | 5.95 | 0.5 | 920201 | 3 | 1,145,971 | 1.81 | 0.1 |
- Wall 2.2 to 20.2 s, under other sessions' load; no row came near 10 minutes. Memory 0.39 to 0.50 GB. Off the ledger, Lean = Python byte for byte
  on 4011 at levels 0 and 4 and on 68118 at levels 3 and 8.
- **Native, not asked:** C and M compiled here (`lean -c`, `leanc -O3`). 14 rows (the report's 3, 93029, 332942 and our 12): all
  byte-equal to Python and equal to the ledger. 0.15 to 0.72 s at level 3, 0.5 to 0.6 s at level 4, 1.8 to 2.2 s at level 7.

## The report against the files, and a second kernel (item 9)
- **Holds:** the hashes and line counts; "core only"; no `sorry`; the axioms of T1, T1_input, T0; the replay; the 77 rows
  (`t2_sample.out`, by `shasum`); the three controls (`controls.out`); every v2 change it lists; "no faster variant".
- **Not supported by a file:** the native "3 of 3". No log, script, C file or binary is in the folder; P4-LEAN.md and the new
  `T2-COMMANDS.md` state it in words. Reproduced here all the same (above).
- **Worth knowing:** their 77 rows are our 77 rows, so their sample adds no row to the page test. P4-LEAN.md's "the form the run
  program's input has" (of `T1_input`) is asserted (item 3). Their strict build (`build-strict/`) has no script or log.
- **A second kernel, described, not run.** The pinned toolchain's `bin/` on this Mac holds `leanexport`, `nanoda_bin`, `con-leche`, `con-ron`,
  `lean4lean`, `leanchecker-paranoid`, dated like `lean` itself: no install is needed. The route (from the lane's pod scripts and the binaries'
  usage strings, read with `strings`, never executed): export the cone of `R7Cnf.T1`, `R7Cnf.T1_input`, `R7Cnf.T0` from `R7CnfSound` with `leanexport`;
  give the file to `nanoda_bin` (a config naming the three axioms) and to `con-leche FILE.ndjson`; the threshold mutant is the control to reject.

## Slips of mine, and files
- The first row run waited 9 minutes for an idle machine and built nothing. I stopped it and changed `run_one.py` to wait at most 45 s, then start
  and record the foreign Lean processes alive (0 to 2). The builds and replays ran alone. Two scratch files failed once on my own code and were rerun.
- Inputs: `configs.bin` 76c2666b7f2c4de5…, `cores_e85.g6` 6b2373618c34d588…, `prod.tsv` ba545601b42d7796….

| file (all in `control-room-checks/p4-lean-build/`) | sha256 |
|---|---|
| SHA256SUMS (the list of all 58 files) | 491a11ffb448a69d72695fdd289ac9a4f551e64dee38c0025a55132e688fe14b |
| scratch/run_one.py | bd8d9b4e433ad9d1e02e37815a3f38a5d0adaa77fe93b0e5dbadc2bec63a7f3a |
| scratch/P4Axioms.lean, P4Extra.lean, P4Compiler.lean, P4Decode.lean | 9778683402ff4faf…, 09c6a42e990884c4…, 4660806d255cc443…, 608215c37bee25ce… |
| scratch/draw_rows.py, run_rows.py, run_native.py | aced30ca92638510…, 53e6cc2761ace66e…, 28e29b6104278f57… |
| bytes/rows.tsv, bytes/results.tsv, native/results.tsv | 573fa640350677d2…, c5ecd7aff4249bcd…, 1daac0913fcf832c… |
| logs/axioms.log, logs/mut-threshold-R7CnfSound.log, mut-threshold/src/R7Cnf.lean | b158dc1703d98eb5…, a661cd2b6fec11c9…, 0e70af945e40c130… |
| olean/R7Cnf.olean, olean/R7CnfSound.olean (equal to the author's `build/`) | d37d7132b384e29e…, fe27fda23f4a4ea6… |
