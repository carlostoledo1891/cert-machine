# P5, third reading: the bridge from a completion to F (PRIVATE; 2026-11-22, 13:05–13:40 UTC)

Checked here: the Astra track's report "Lean now proves the requested bridge". One agent of the control room read the files, once. Nothing left this machine.
Short names, in `codex-r7-scout/`: **RM** = `R7RecordModel.lean`, **Br** = `R7CnfBridge.lean`, **Cat** = `R7Catalogue.lean`, **Co** = `R7Composition.lean`, **CT** = `R7CoreTransport.lean`, **X0f** = `R7X0.lean`; **E**, **L** as in the second reading. In `claude-r7/p4-lean/`: **C** = `R7Cnf.lean`, **Cs** = `R7CnfSound.lean`. **R** = `REDUCTION.md`, **v2** = `P4-STATEMENT-v2.md`. `RM:64` is line 64 of RM.
Verdict words: **CERTIFIED** = builds here, kernel replay passes, only the three standard axioms, statement read and tied to a sentence of R or v2. **READ** = statement read, not tied. **REFUSED** = not done.

## What is NOT established (read first)
1. **No theorem concludes R(7), and none has the shape the inference needs.** Both headline theorems are conditionals. `r7_record_file_model` (RM:64) goes from a graph to a model. "If F has no model for every record at its level, then no graph exists" is not in their files.
   - It is three tactic lines away. My `p5c-build/scratch/P5cContra.lean` states it twice and compiles (warnings as errors, three axioms). It is still not in their files.
2. **Lean never sees `configs.bin`.** `cfg` is any byte buffer (RM:55, RM:67). No hypothesis says it is the file, and no hash is in Lean. The script's `configs.bin: OK` (`check-r7-p5.sh` lines 36–41) touches no Lean object.
3. **P3 is still a hypothesis** (`cover`, RM:68–69). It now speaks of the four numbered cores and of records decoded from `cfg`. For the real file it rests, outside Lean, on: the four refutations and their checkers (P6); that the cover CNF's models are the `Section3` tuples (read in `P3-X0-CHECK.md`, not Lean); that the cover generators read the cores and the 6-set numbers as this Lean does.
4. **P1, P2 and C1 are hypotheses.** The census is a free variable: any 477,142 byte strings (Cat:35; implicit at RM:66). Nothing says it is McKay's file. C1 as a fact is a Python scan: theirs (read, not run), and mine (agrees).
5. **T2 is not in Lean and not run.** `t2-pod/` holds the registration and the bundle, and no result (13:35 UTC).
6. **No theorem is about bytes, DIMACS or the checkers.** The endpoint is the clause list `(F …).1`. `P4-LEAN-READ.md` items 4, 5 and 9 stand.
7. **The per-record theorem has no instance, and none is expected.** 9 is a literal in `Completes … 9` (Br:49, Br:108, RM:56), in T1 (Cs:685, Cs:688) and in F (C:52, C:60). The K = 10 control cannot go through it. It serves by contraposition only.
8. **The tie to `cores_e85.g6` is `include_str`, not a hash** (Cat:10). The compiled module holds what the file held at compile time. The sha256 of `R7Catalogue.lean` does not pin it.
9. **Chen's library is still under it:** `r7_count` through `layout_of_r7` (L:34), `indepNum_le_of_embedding` (Co:30, E:147). As compiled by our audit; not rebuilt.
10. **Still not formalised:** D5's own count (R:19–23); the triangle converse (R:47); the converse in R:88; that `adjOfGraph6` is graph6 in general (two decoders agree on the four lines, RM:25, no more); a graph on any 40 vertices (`Fin 40` is literal, Co:15).
11. **T1 gives existence only** (`∃ τ`, τ any assignment of ℕ). **Per-module replay.** No `--fresh`. One Lean, one Mathlib, one kernel.

## What round two asked for, and where it is now
- The three transports: **proved.** `transport_graph` (Co:24–30), our three lines. Used at Co:64 and CT:58.
- The modules compose: **yes.** `r7_gives_record` (Co:50–61) gives, in one labelling: the core is triangle-free, α ≤ 7, 85 edges; `Completes` and `Section3` for the graph's own rows.
- D7: **in Lean as a conditional.** `catalogue_iso_of_85` (Cat:50–57): P2 and C1 give an isomorphism to one of four graphs. No isomorphism is assumed.
- The core's relabelling: **carried, not assumed.** `completes_core_iso` (CT:77–80) and `section3_core_iso` (CT:45–48), both ways, for any isomorphism of cores.
- `Completes` to the CNF, with the row order: **proved.** `completion_model` (Br:47–76) derives (a) at Br:55–58, (b) at Br:59–66, (c) at Br:67–76, then applies T1 (Br:54). T1 sorts the rows (Cs:691–693).
- The inputs' reading: **partly.** `decoded_adjacency` (Br:88) removes the lookup table. `recordSides_eq` (RM:46) says each side is the table entry at the record's word. `lineGraph_eq` (RM:25): Claude's decoder and Astra's agree on the four lines, 2,916 entries, by the kernel.

## What was done, by our route (not by `check-r7-p5.sh`)
**Files.** 15 Lean files in `codex-r7-scout/`. Full sha256 of everything read: `p5c-build/INPUTS.sha256`.
- **Unchanged since round two (7), equal to `p5b-build/INPUTS.sha256`:** R7Independence 7aebf6ad, R7SideChoices c7f2cd9c, R7ControlData 18aa022c, R7Control 634e964e, R7Layout 4835303b, R7Exchanges 243a51f1, R7ExchangeControl 546626dc.
- **New (6):**
  - Co `4dac23740f2d548e4998741825e8b95f8f740f4f704593228aae2ad1926135b2`; CT `9cf2ecad5547c16f4ae8cd0230d8033a2721d78ec9f20ab7bd46f61b75a39277`
  - Cat `5c380265b8e8af64fec74274e478202875ef7112de877c2fc5a8a03f50c0b721`; X0f `33c58656a877ceaf2a9023fe62fe5d2ddd3f4c8c76e20974c83a7fae0ff00923`
  - Br `88b1cba29453f89671082a21eb1422bb639ba8c336aeb0470042cbecaa83e5bf`; RM `16de5ad7264d7ccb905c84429113cd822c7197482cf76118884e9a9fcbb1597a`
- **Older, in no replay list, not built here (2):** PrivateNeighbor c1cbee95, TripleSlots 6bd2d43c (both of 11-21).
- **"All 11 modules"** = R7Independence, R7SideChoices, R7Exchanges, R7Layout, Co, CT, Cat, **C**, **Cs**, Br, RM (`R7-CNF-BRIDGE.txt` line 50). Nine are Astra's. C and Cs are the Claude track's. X0f, R7Control, R7ControlData, R7ExchangeControl are not among them.
- **"Unchanged F", by hash: yes.** The folder holds no copy of C or Cs. Their script checks the two pins, then compiles the files in `claude-r7/p4-lean/` (lines 30–35, 52). Those files today: C 3ec2b8ca9fa14b00…, Cs 519b96e24c7ad1cc…, the hashes of `P4-LEAN-READ.md`. Our build imports our own compiled copies (`p4-lean-build/olean`, d37d7132…, fe27fda2…), made from byte copies with those hashes. In the statements Lean prints `R7Cnf.F`, `inputOf`, `record` from module `R7Cnf` and `Sat` from `R7CnfSound`.
  - The six modules add three constants inside the namespace `R7Cnf`: `inputOf.eq_1`, `missF.eq_1`, `adjOfGraph6.eq_1`. They are unfolding lemmas made by `simp`, theorems, not redefinitions.

**Build.** `lean` 4.35.0 (eb6cafb7), `-DwarningAsError=true`, byte copies in `p5c-build/src/`, equal to the originals at the end. `LEAN_PATH` = `p5c-build/olean`, `p5b-build/olean`, `p4-lean-build/olean`, `audit/chen-23678020/build`, then the lane's string (equal to round two's by `cmp`). The toolchain folder first in `PATH`. One Lean process at a time; no other was alive at any poll. A byte copy of `cores_e85.g6` (6b237361…) sits where `include_str` looks. GB = 2³⁰ bytes.

| Module | Compile: wall, user, max resident | `leanchecker -v`: wall, max resident | Exit |
|---|---|---|---|
| Co | 54.7 s, 2.7 s, 4.80 GB | 18.8 s, 4.77 GB | 0, 0 |
| CT | 59.6 s, 2.7 s, 4.50 GB | 25.8 s, 4.77 GB | 0, 0 |
| Cat | 50.1 s, 21.5 s, 5.00 GB | 47.2 s, 5.12 GB | 0, 0 |
| Br | 45.6 s, 3.0 s, 4.52 GB | 24.3 s, 4.72 GB | 0, 0 |
| RM | 76.1 s, 30.2 s, 5.14 GB | 65.4 s, 5.38 GB | 0, 0 |
| X0f | 31.6 s, 4.9 s, 5.14 GB | 16.1 s, 5.40 GB | 0, 0 |

- C and Cs replayed again on this path: exit 0, 0. No step came near 30 minutes or 10 GB. `RM.olean` is 46.6 MB: the `cbv` proof.
- **Axioms, every theorem** (`scratch/P5cAxioms.lean`, `logs/axioms.log`). The 17 public ones: `propext`, `Classical.choice`, `Quot.sound` each, except `R7X0.control_core_X0`: `propext`, `Quot.sound`.
  - Co: `transport_graph`, `r7_gives_record`. CT: `section3_core_iso`, `completes_core_iso`. Cat: `catalogue_iso_of_85`, `marker_catalogue`, `identify_X0`. Br: `completion_model`, `decoded_adjacency`, `record_file_model`. RM: `lineGraph_eq`, `recordSides_eq`, `catalogue_record_model`, `r7_record_file_model`. X0f: `r7_X0_branch`, `control_core_X0`, `control_changes_labelling`.
  - The 16 private ones, three axioms each: `core_edge_count` (Co); `undo_rows`, `move_ind`, `move_pair`, `move_section3`, `move_completion` (CT); `six_count_iso`, `marker_map`, `degree_checked`, `six_checked` (Cat); `count_slots`, `core_degree`, `missed`, `miss_pair`, `input_tables` (Br); `coreLines_value` (RM).
  - Census: 137 constants, 97 theorems (33 named, 64 auxiliary). None outside the three. No axiom, opaque, unsafe or partial declaration.
- **A planted error is caught.** With 10 for 9 at Br:49 the file fails (exit 1, first error 70:45); `completion_model` then lists `sorryAx`.

## Weakening search (six new files)
No hit for `sorry`, `admit`, `native_decide`, `unsafe`, `implemented_by`, `extern`, `opaque`, `Fact`, `macro`, `attribute`, `notation`, `noncomputable`. `axiom` only in the 17 `#print axioms` lines. `partial` only as a word in the comment at Br:101.
- **`set_option`, three, all on one private theorem:** RM:15 `cbv.maxSteps 1000000`, RM:16 `maxRecDepth 8192`, RM:17 `maxHeartbeats 1000000`. They raise limits for `coreLines_value` (RM:18–22, proof `by cbv`). They do not change the logic. The report does not mention them.
- **`include_str`:** Cat:10. See item 8. **`cbv`:** RM:22. Kernel-checked; three axioms.
- **`instance`, twice:** Br:84–85 and Cat:30–31. Each says adjacency is decidable because it is a Boolean test. Honest. **`classical`:** Br:34, inside a proof. **`inferInstance`:** Co:76, CT:74, X0f:60, the decidability slot of `Completes`.
- **Defaults on a bad index:** `]!` at Br:90, Br:108, Br:112, RM:25, RM:49; `getD … 0` at Cat:20. On the real files none is reached: my scan finds core words 0..3 and side words at most 2,832 of 2,833 on all 977,008 records.
- **Typed-in data:** the four graph6 lines, 240 characters (RM:19–22; checked against the embedded file by RM:18); four positions and 477,142 (Cat:35, Cat:37); two tables of 108 numbers (Cat:91–101; checked at Cat:103, Cat:111; used by X0f only).
- **Plain `decide`:** Br:51, Br:52, Br:53 (three filters over `Fin 13`); Br:74 and Br:75, twice each (two labels differ; the A labels are {8, 9}, the B labels {11, 12}).
- **`decide +kernel`:** Br:12, Br:13 (two label maps are injective); Cat:103 (108 degrees); Cat:111 (108 counts); Cat:118 (the marker on four graphs, 27 × 27 pairs each); **RM:29, the largest: 4 × 27 × 27 entries decoded two ways**; X0f:44 (27 × 27); X0f:65, X0f:69 (one witness each).

## The two headline theorems
**`catalogue_record_model` (RM:55–57).** Hypotheses, in order:
- `cfg`: any byte buffer (RM:55). `j`: one of 0..3 (RM:55).
- `r : CoreRecord cfg j` (RM:55; defined RM:33–34): an index below `cfg.size / 10` whose first 16-bit word, as `R7Cnf.record` reads it, equals j.
- `R`: any seven finite subsets of `Fin 27`, in any order, repeats allowed (RM:56). `level`: any natural number (RM:56).
- `done` (RM:56): `Completes (graph j) 9 R (recordSides cfg r)`. That is: some graph on `Fin 27 ⊕ Fin 13` has `Layout`, core equal to `graph j`, no triangle, every degree 9, `indepNum ≤ 9`, C rows R, and as side rows the four sets decoded for record r (E:131–134).
- **Conclusion (RM:57):** `∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg r).2 level).1`.

**`r7_record_file_model` (RM:64–71).** Hypotheses:
- G on `Fin 40` with decidable adjacency, p, q (RM:64). `h : Hypotheses G p q` (RM:65; Co:15–21): p ≠ q; not adjacent; exactly 7 common neighbours; every degree 9; no triangle; `indepNum ≤ 9`. These are R:7–8.
- `p1 : EdgeLowerBound 8 27 85` (RM:65): every triangle-free graph on `Fin 27` with independence number below 8 has at least 85 edges.
- `census`, with `p2 : P2 census` and `slice : C1 census` (RM:66). `cfg`: any byte buffer; `level`: any function from its record indices to ℕ (RM:67).
- `cover` (RM:68–69): for every j and every 4-tuple T with `Section3 (graph j) T`, some `r : CoreRecord cfg j` and some image `im` have T = `recordSides cfg r ∘ source im`.
- **Conclusion (RM:70–71):** there are j, a record `r : CoreRecord cfg j` and τ with `R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg r).2 (level r)).1`. It names no particular record.

## The questions
- **"A decoded record"** is `(R7Cnf.inputOf coreLines cfg idx).2`: the Claude track's `inputOf` and `record`, unchanged.
  - `coreLines` (RM:12–13) is the content of `cores_e85.g6`, embedded at compile time (Cat:10), split and filtered as `R7CnfMain.lean` line 8 does. Not a hypothesis. Tied to the file by content: the embedded string printed back equals the file (`cmp`), and RM:18 fixes it to the four typed lines.
  - `cfg` is not embedded, not typed in and not assumed equal to anything. It is a universally quantified variable. Nothing ties it to 76c2666b…. The only tie to 6b237361… is our hash of the copy the build read.
- **P1's lower bound** is `EdgeLowerBound 8 27 85` (Chen's `EdgeBound.lean`:18–20), as in round two. The lower half of R:24.
- **P2** (Cat:40–42): every triangle-free graph on `Fin 27` with `indepNum ≤ 7` is isomorphic to `readGraph (lines i)` for some i below 477,142. `readGraph` (Cat:18–28) is graph6 without a check of the first byte.
- **C1** (Cat:46–48): an entry with exactly 85 edges sits at position 49240, 49288, 49914 or 49938; and the entries there are bytes 61j..61j+59 of the embedded file. "None with fewer" and the trivial automorphism group (R:28–30) are not in it, and are not needed.
  - As a fact, on McKay's file (9a2e9723…), my own scan (`scratch/c1_scan.py`): 477,142 entries, fewest edges 85, the four positions, the four lines. Both halves hold.
- **Do P2 and C1 amount to D7? Yes** (Cat:50–57), given the three properties of the core from Co:57. The relabelling is then carried through `Completes` (CT:77, applied at RM:75). `Section3` is not moved in this proof: `representative_completion` derives it from `Completes` (E:171–174).
- **Does `cover` have the form our cover run established? Yes, with `cfg` set to the file.** Per core j; ordered 4-tuples with `Section3`; a record of that core; one of the 8 images by `source`. That is `P3-RESULT.md`'s verdict sentence. Two of round two's three gaps of instantiation are now closed in Lean (X is `Fin 27`; the core is a line of `cores_e85.g6`). The third (`records`) is closed up to `cfg`.
  - The numbering, evaluated: Lean's table of 6-sets equals ours (increasing tuples, sorted) on all four cores, 2,833 each (`scratch/P5cTable.lean`, `table_check.py`). Each core: 12,462 independent sets, 750 of size 7, 85 edges.
- **The conclusion is literally `∃ τ, Sat τ (R7Cnf.F … ℓ).1`,** with the imported `F`. In RM:57 the level is a free natural number. In RM:71 "that record's assigned level" is `level r`, with `level` a free function: a variable, to be set to the ledger's column. F takes no index; the index enters only through the decoded input.

## What an R(7) counterexample now implies in Lean
1. G, p, q with `Hypotheses` (Co:15–21).
2. With P1's lower half: a relabelling with `Layout`, and 85 edges in the core (L:34, by Chen's `r7_count`; Co:32–46).
3. The relabelled graph is triangle-free, 9-regular, α ≤ 9 (Co:24–30). Its core H is triangle-free with α ≤ 7 (Co:67–74). `Completes H 9 R S` for its own rows (Co:75–76).
4. With P2 and C1: H is isomorphic to `graph j` for some j (Cat:50–57).
5. The completion moves to `graph j`, rows and sides mapped (CT:77; RM:75).
6. With `cover`: a record r of core j with `Completes (graph j) 9 R′ (recordSides cfg r)`, R′ the same seven rows (E:166–176; RM:74).
7. T1's (a), (b), (c) hold; T1 sorts the rows and gives a model of F on `inputOfGraph` (Br:47–76; Cs:681).
8. That input is the decoded one (Br:88–99, Br:106–118; RM:25, RM:59). So: a model of F for record r at `level r` (RM:76–77).

**Not in Lean, and what each rests on:**
- (i) The contrapositive: one line of logic (item 1; my scratch file).
- (ii) `cfg` = the bytes of `configs.bin`; `level` = the ledger's column: an instantiation nobody has made.
- (iii) `cover` for that buffer: item 3. (iv) P1 and P2: the literature. C1: the scans. The census = McKay's file.
- (v) T2: each row's bytes hash to the ledger's `cnf_sha256`. Computed on 88 rows so far; the all-rows run is registered.
- (vi) The checkers read those bytes as the list F and accept a refutation: P6, and no DIMACS theorem.
- (vii) The ledger: the pod's own account that all 977,008 rows are certified, at levels 3, 4, 7.
- (viii) A graph on any 40 vertices is one on `Fin 40`; decidability by choice. Trivial; my second scratch theorem covers the second.
- Not needed any more: "a reduced CNF is a subset" (R:106–108), since T1 holds at every level; and T0, since step 6 lands on the record itself.

## Non-vacuity
- **No instance of either headline theorem exists in the files** (item 7). `completion_model`, `record_file_model`, `catalogue_iso_of_85`, P2, C1 and `cover` are never applied to data. `cfg` and `census` are never concrete. `CoreRecord` is never shown inhabited.
- **Instantiated, at K = 10, in X0f** (not one of the 11): `control_core_X0` (X0f:42), the control's core is `graph 0`, by the kernel; `control_changes_labelling` (X0f:52), the core transport applied to the control under the swap of 0 and 1.
- **My evaluation** (`scratch/P5cControl.lean`; Lean's interpreter, not the kernel): on the real `configs.bin`, record 89694 is (0, 220, 1604, 827, 2433), and `recordSides` gives exactly the control graph's four side rows, in order. Record 89695 does not. So `Completes (graph 0) 10 R (recordSides cfg r)` is true for that record, by the control graph. It says nothing at 9.

## The track's replay log
`r7-record-file-replay.log` (e274616e…, the hash quoted in `R7-CNF-BRIDGE.txt` lines 57–58). This time it has exit codes: 11 × `build exit 0`, 11 × `leanchecker exit 0`, last line `replay script exit 0`. Its 11 source hashes equal today's files. The codes are printed by the script itself. Reproduced here by our route. X0f is in their other log (`r7-composition-x0-replay.log`, exit 0, same hash as today).

## Where the report says more than the files do
1. "The production inference still needs T2 and the checkers' interpretation": the list is short. It also needs (i)–(iv) and (vii). Their own note has (ii) and (iii) (`R7-CNF-BRIDGE.txt` lines 39–41); the report does not.
2. "A decoded record": decoded from any buffer. The words suggest `configs.bin`; Lean never reads it (item 2).
3. "Derives all three T1 hypotheses from `Completes` (RM:55)": the derivation is `completion_model`, Br:47–76. RM:55 reaches it through Br:106.
4. "At that record's index and level": at every level; F has no index.
5. "P2, C1": about an abstract census, not McKay's file. "P1's lower bound": exact.
6. Not said: three `set_option`s and `cbv` (RM:15–22); `include_str` (Cat:10); Chen's library under the second theorem.
7. True as said: unchanged F; the row order; the 11 builds and replays; the axioms of the seven theorems; the exit code.

## One line per new public theorem
- `completion_model` Br:47: **CERTIFIED.** v2:54–60 and v2:70–71; R:84–86 forward.
- `decoded_adjacency` Br:88: **CERTIFIED.** v2:45–46 (the table is the decoder's value).
- `record_file_model` Br:106: **CERTIFIED.** v2:43–47 with v2:54–60, for any lines and any buffer.
- `lineGraph_eq` RM:25: **CERTIFIED.** v2:45–46 on the four lines of R:28–29.
- `recordSides_eq` RM:46: **CERTIFIED.** v2:47; R:77.
- `catalogue_record_model` RM:55: **CERTIFIED as a conditional** (R:84–88 forward, with R:92–105). **READ** as a statement about `configs.bin`. No instance.
- `r7_record_file_model` RM:64: **CERTIFIED as a conditional** (R:80). **READ** as R:116–117, which needs (i)–(vii).
- **The ten other new public theorems.** CERTIFIED: `transport_graph` Co:24 and `section3_core_iso` CT:45, `completes_core_iso` CT:77 (R:31, the identification made explicit); `r7_gives_record` Co:50 (R:11–26, R:70–74); `control_core_X0` X0f:42 (R:112–113, core 0).
  - CERTIFIED as conditionals: `catalogue_iso_of_85` Cat:50 (R:27–31); `r7_X0_branch` X0f:14 (R:31 and R:80 on X0; superseded by RM:64). READ: `marker_catalogue` Cat:114, `identify_X0` Cat:120 (no sentence of R; used by X0f only); `control_changes_labelling` X0f:52 (a positive control at K = 10).
- **REFUSED:** `leanchecker --fresh`; a rebuild of Chen's library; a rebuild of the seven earlier modules (hashes unchanged, our compiled copies used); a second kernel; any instance at K = 9.

## Later items, not acted on
- The contrapositive could go into RM as written in `P5cContra.lean`. `cfg` could be tied to the file by a hash stated outside Lean and one sentence in the final statement; Lean cannot embed 9.7 MB sensibly.
- The numbering (sorted tuples) and "the cover CNF's models are `Section3`" are the two readings left between `cover` and the P3 run.
- Files: `p5c-build/SHA256SUMS` lists every file of the build folder.
