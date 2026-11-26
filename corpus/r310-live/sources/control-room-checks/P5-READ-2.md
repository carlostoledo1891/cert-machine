# P5, second reading: seven Lean files (PRIVATE; 2026-11-22, 10:55–11:40 UTC)

Checked here: two reports of the Astra track. First the K = 10 control and "from R(7) to Layout" (five modules). Then, added to the scope while this reading ran, the D8 exchanges (two modules). One agent of the control room read the files, once. Nothing left this machine.
Short names, all in `codex-r7-scout/`: **I** = `R7Independence.lean`, **S** = `R7SideChoices.lean`, **D** = `R7ControlData.lean`, **C** = `R7Control.lean`, **L** = `R7Layout.lean`, **E** = `R7Exchanges.lean`, **EC** = `R7ExchangeControl.lean`. **R** = `claude-r7/REDUCTION.md`. **Ch** = `audit/chen-23678020/repo/lean/R310/R7.lean`. `L:34` means line 34 of L.
Verdict words: **CERTIFIED** = builds here, kernel replay passes, only the three standard axioms, statement read and tied to a sentence of R. **READ** = statement read, not tied. **REFUSED** = not done.

## What is NOT established (read first)
1. **No theorem concludes R(7).** `layout_of_r7` (L:34–42) is one step: from a hypothetical counterexample to a relabelling with `Layout`. No file derives a contradiction. That stays with the production run, under P1–P6.
2. **The seven files do not compose.** `layout_of_r7` returns `Layout (G.comap e)` and nothing else about the relabelled graph. Every later theorem also asks that this graph be triangle-free, 9-regular and of α ≤ 9. Those three transports along `e` are in none of the files. L and E do not import each other. So no theorem of theirs says "an R(7) counterexample gives a completion".
   - My test `p5b-build/scratch/P5bCompose.lean` writes the three lines and compiles (warnings as errors, three axioms). The gap is three lines. It is still a gap in their files.
3. **Chen's library is now a dependency of the Lean part of P5.** The A–B join and e(X) = 85 are his `r7_count` (Ch:31–36, proof Ch:37–94), not a new proof. L reaches 96 constants in 8 of his modules. E uses one of his lemmas (`indepNum_le_of_embedding`, `EdgeBound.lean`:23).
   - Trust added: his source at 1473adf8 (clone clean) as compiled by our audit on 11-21 (33 modules; `AUDIT-RESULT.md` row A3: no sorry, no new axiom, no native_decide). I did not rebuild it. I replayed today the 8 modules that L reaches (`leanchecker`, 51 to 71 s each): exit 0 each.
4. **P1 stays a premise.** It enters as `EdgeLowerBound 8 27 85` (L:38). See "`layout_of_r7`".
5. **D5 as written is not formalised.** Chen counts another way: G − N[u] has 99 edges (Ch:45), then a degree sum (Ch:56–84). The conclusion is the same. R's own count (R:19–23) is in no Lean file.
6. **D7 is not in Lean.** After `layout_of_r7` the core is `Fin 27` under whatever bijection came out (it is made by choice, Ch:131–132). Nothing says the core is one of X0–X3. No theorem moves `Completes` or `Section3` along a relabelling of the core: every exchange fixes each core vertex (E:45–46). P2 and C1 are outside.
7. **P3 enters only as a hypothesis** (`cover`, E:168). No Lean object is a catalogue core, a record or `configs.bin`. That the cover CNF is unsatisfiable is not a Lean fact.
8. **"Completes" is graph existence, not the CNF** (E:131–134). No file has a clause, a literal or a variable number.
9. **Still absent:** the converse for triangles (R:47); the "exactly when" of R:88; R:80 as a statement about the list; all of §5 (row order, counters, subset of clauses). `clauses_at_cutoff` still discards its level (`fun I hI _`, I:212). The graph is on `Fin 40` literally (L:34; Ch:20).
   - New point on the row order: the exchange theorem keeps the seven C rows in one fixed order (E:154–156). The CNF sorts them (R:101–105). Permuting the C vertices is in no Lean file.
10. **The controls: Lean sees 40 typed numbers** (D:3–11). The link to ledger record 89694 is Python: theirs (`r7_control_data.py` and a `cmp`), and mine.
    - `control_row_tests` (C:98), `control_sides` (C:104) and `eight_completions` (EC:14) are instances of the general theorems on that one graph, not separate computations.
    - Computed by the kernel on the data: `layout`, `regular`, `triangle_free`, `alpha_eq_ten`, `core_bound`, `boundary_sample` (one set I), `eight_distinct`.
11. **Side-hitting has no non-vacuous instance.** At K = 10 it starts at 8 core vertices and the core has none (C:110; their own remark, C:108–109). So `side_hits_seven` and the third part of `SideChoice` are never exercised. At K = 9 no graph is in the files, and none is expected to exist.
12. **The replay is per module.** `leanchecker` replays a module's own declarations on top of its imports. `--fresh` was not run. Mathlib's and Chen's compiled files are taken as built.
13. **The folder was being edited while I read.** `check-r7-p5.sh` was a31c6269… at my first read and f0330a0e… from 08:01:08 local (UTC−3). E was rewritten then too; EC, `R7-EXCHANGES.txt` and `r7-exchanges-replay.log` appeared between 07:58 and 08:07. I built from byte copies (`p5b-build/src/`), equal to the originals when I finished (11:39 UTC).
    - Their two replay logs have no exit code and no closing line: the last line of each is `replaying <module>`. Reproduced here, with exit codes.
14. **Not checked by me, not Lean:** "the pinned C generator emitted the ledger's exact bytes for all eight images" (`R7-EXCHANGES.txt` lines 29–32).

## What was done, by our route (not by `check-r7-p5.sh`)
**sha256** of the seven Lean files, the same before the build and after it. Every other file read, with its full sha256: `p5b-build/INPUTS.sha256`.
- I `7aebf6ad6fd9c461f63d7bd4b5003d32b5bf8b2f653cf63d3c72954322bc4ebc` (changed; was 14573467…)
- S `c7f2cd9c8dcc7977afed0f84a044678331d70a1fd4e0f43e18a4bcf36c591acf` (changed; was e1cb2c88…)
- D `18aa022ca9b45bd5515215b94805a57031e53c9d5c0ef45d8dcdcba733d006da`
- C `634e964ebf2fbb24042e5d7cd6f40d6f6d54c5a9b3cb1e9b7b95e9c53658573f`
- L `4835303b6c8795f7333ccd9fe09f3b4adb27de659f48d66398d87dce568a8ce6`
- E `243a51f12ba6d25ff8d10a9a48f02fad88bfe24924c9bd47de4bec1e5e946401`
- EC `546626dcf32a9711a32084e68894a8d7e7c42e28637f4af537e8d681dfb44428`
- Others, first 8 digits: `r7-p5-replay.log` 80494f9c; `r7-exchanges-replay.log` 2c07c93d; `P5-2026-11-22.txt` 3b8039fe; `R7-EXCHANGES.txt` 134f7823; R dd29496a; `PROD-PREREG.md` 99731718; `prod-out/control_k10_sat.tsv` a582482f; `control_k10_sat.txt` 75ff1d51 (89694 is its line 4); `configs.bin` 76c2666b; `cores_e85.g6` 6b237361; Ch 945212e9.

**Build.** `lean` 4.35.0 (commit eb6cafb7), `-DwarningAsError=true`. `LEAN_PATH` = our folder, then `audit/chen-23678020/build`, then the path printed by `lake env printenv LEAN_PATH` in `instruments/rh-comparison` (the same string as in the first reading; Mathlib 56a00585). All seven exit 0. No compile came near 30 minutes or 10 GB. Logs: `p5b-build/logs/`. Below, GB means 2³⁰ bytes.

| Module | Compile: wall, max resident, footprint | `leanchecker -v`: wall, max resident | Exit |
|---|---|---|---|
| I | 4.2 s, 1.54 GB, 0.27 GB | 14.3 s, 1.24 GB | 0, 0 |
| S | 1.9 s, 1.52 GB, 0.26 GB | 6.4 s, 1.22 GB | 0, 0 |
| D | 0.4 s, 0.39 GB, 0.08 GB | 5.7 s, 0.36 GB | 0, 0 |
| C | 24.0 s, 3.58 GB, 2.39 GB | 22.2 s, 3.34 GB | 0, 0 |
| L | 68.7 s, 4.04 GB, 0.87 GB | 56.9 s, 3.95 GB | 0, 0 |
| E | 87.2 s, 3.64 GB, 0.85 GB | 46.0 s, 3.91 GB | 0, 0 |
| EC | 58.0 s, 3.81 GB, 0.83 GB | 46.4 s, 4.12 GB | 0, 0 |

- L, E and EC load the whole of Mathlib through Chen's `R310.Basic`. Their wall time is that load: under 6 s of user CPU each. C is the only real computation: 22 s of CPU.
- **Axioms.** `scratch/P5bAxioms.lean` and `scratch/P5bExchanges.lean` print the axioms of the 29 public theorems by name, then of every constant the seven modules add: 246 constants, 168 of them theorems (48 named in the files: 29 public, 19 private). Every one stays within `propext`, `Classical.choice`, `Quot.sound`. `R7Control.layout` uses only `propext` and `Quot.sound`. No axiom or opaque declaration.
  - One flag, explained: `fits._unsafe_rec`, the compiler's helper that Lean makes for the recursive `fits` (C:12). It has no axioms, and among the 173 constants of the first five modules nothing but itself mentions it.
- **Chen's part.** `r7_count`, `card_nested`, `exists_perm_partition`, `Tb_card`, `Tb_disj`, `card_outside2_add`, `mem_outside`, `mem_outside2`, `indepNum_le_of_embedding`: three standard axioms each. Among the 96 constants reached: no axiom, opaque, unsafe or partial declaration.
- **One process at a time.** My runner waits until no Lean process is alive, then starts one. It cannot stop another session from starting one. In 15 of my 26 runs a second Lean process was alive at some poll (their replay; another session's `lean --run R7CnfMain.lean`).
- **A slip of mine.** The first five `leanchecker` runs exited 1 within a second: `leanchecker` starts `lean` from `PATH`, and the elan shim has no default toolchain here. Rerun with the toolchain's folder first in `PATH`. The failed logs are kept in `logs/failed-no-path/`.

## The two first-round files: what changed
Both changed. Of their 37 named constants, 31 have the same elaborated statement as before and 6 differ (the two `signatures.log` files, compared by script). Every line the first reading cited in I and S still holds the same declaration.
- `threshold` (I:174–175): was `10 − |I| − max`, now takes K: `K + 1 − |I| − max`.
- `bound_iff_rowClauses` (I:180–186): any K. Its first part was `|I| ≤ 7`, now `|I| + 2 ≤ K`: the same at K = 9. `clauses_at_cutoff` (I:209–212): any K; the level is still idle.
- `side_hits_seven` (I:215–219): any K. Was `|I| = 7`, now `K < |I| + 3`. At K = 9 that is |I| ≥ 7: it covers the old case.
- `SideChoice` (S:55–59) and `gives_configuration` (S:61–64): any K, with the same change in the hitting part. The degree 9 and the row size 6 are still literals, rightly: K is only the independence bound.
- Each file now prints the axioms of its 5 public theorems (was 2 each).
- **Nothing got weaker.** At K = 9 each new statement is the old one or implies it.

## Weakening search (seven files)
No hit for `sorry`, `admit`, `native_decide`, `unsafe`, `partial`, `implemented_by`, `set_option`, `opaque`, `Fact`, `macro`, `attribute`, `extern`. The word `axiom` occurs only in the 29 `#print axioms` lines.
- **`instance`, twice:** C:60 (private) and C:63. Each says "adjacency in the typed graph is decidable because it is a Boolean test". Honest: they are what lets the kernel compute. `inferInstance` at E:145 and EC:15 fills the decidability slot of `Completes`.
- **`classical` / `noncomputable`:** as in the first reading (I:48–49, I:54, I:96, I:158, I:174, I:220), plus L:43. Inside proofs, or supplying decidability to a filter that `mem_missing` pins.
- **Plain `decide`**, all kernel computation over `Fin 5`, `Fin 13`, `Fin 8`, `Fin 4`, `Fin 27`:
  - I:32, I:36, I:149, I:228; S:22, S:49, S:67, S:72, S:88, S:107: as in the first reading.
  - C:128: the sample has 7 elements. L:93: each fixed label lies in Chen's block of the same role. L:99: each core label lies in his block 13..39.
  - E:30 `slot_action`; E:31 `common_fixed`; E:37 roots go to roots; E:41 each image has an inverse image; E:124 twice (the A labels are {8, 9}, the B labels {11, 12}); E:126–127 eight times (8, 9 are A labels; 11, 12 are B labels). EC:20: the 8 slot maps are distinct.
- **`decide +kernel`**: the same, with the evaluation left to the kernel alone. No compiled code, as the axiom lists show.
  - C:57, C:58: the typed relation is symmetric and has no loop. C:65 twice: the two fields of `Layout` (169 pairs; 27 × 13 pairs). C:67: each of the 40 degrees is 9. C:70: no triangle, over all triples of `Fin 40`.
  - C:76: `fits bit 40 (all 40 vertices) 10 = true`. C:112: `fits edge 27 (all 27 core vertices) 7 = true`. C:92, C:93: the listed ten is independent and has 10 elements.
  - C:129–131: the rows missing the sample number 0 (A), 0 (B), 3 (C). C:134: the sample is independent in the core.
  - E:34: each of the 8 fixed permutations preserves the 5-cycle of blocks (8 × 13 × 13 cases). EC:21: the four side rows of the control are pairwise different.
  - Not tactics: C:13 `decide (L.length ≤ k)` is the Boolean function inside `fits`; C:25 `of_decide_eq_true` is a lemma.

## `layout_of_r7` (L:34–42)
**Hypotheses.** A graph G on `Fin 40` with decidable adjacency (L:34). Two vertices p, q with: p ≠ q; p, q not adjacent (L:35); exactly 7 common neighbours (L:36); every degree 9; no triangle; `G.indepNum ≤ 9` (L:37); and `EdgeLowerBound 8 27 85` (L:38).
- **How R(7) enters.** L:34–37 are the hypotheses of R:7–8, one for one (p ≠ q is the "two" of "two vertices"). The theorem does not refute them. It draws a consequence.
- **The premise.** `EdgeLowerBound 8 27 85` (`EdgeBound.lean`:18–20): every triangle-free graph on `Fin 27` with independence number below 8 has at least 85 edges. That is the sentence after the colon in R:24. It is the lower-bound half of "e(3,8,27) = 85" (`PROD-PREREG.md` line 8). Not stronger than P1. Weaker only by the existence of an 85-edge graph, which nothing uses.
- **What Chen's `r7_count` gives** (Ch:31–36; the same hypotheses; three standard axioms). (i) For every b adjacent to q and not to p: N(p) ∩ N(b) = N(p) − N(q), so every vertex of A is adjacent to b. (ii) The graph left after deleting N[p] and then N[q] has exactly 85 edges. L also takes from him `card_nested` (Ch:98), `exists_perm_partition` (Ch:126), the blocks `Tb` (Ch:154–161) and `card_outside2_add` (`Pair.lean`:68).

**Conclusion** (L:39–42): there exists a bijection e from `Fin 27 ⊕ Fin 13` onto `Fin 40` such that
1. e sends fixed label 0 to p and fixed label 10 to q;
2. a vertex lies outside N[p] ∪ N[q] exactly when it is e of a core label, so the outside is identified with `Fin 27`;
3. G has exactly 85 edges with both ends in that outside (a statement about G itself);
4. `Layout (G.comap e)`: the original graph, read through e, has the fixed adjacency of I:42 and roots without core neighbours.

- It is an existential. It gives `Layout` for the original graph transported along e. The A–B join is now inside that `Layout`, derived and not assumed.
- It does **not** say that the transported graph is triangle-free, 9-regular or of α ≤ 9 (item 2). With those three lines added, the hypotheses of every theorem of I, S and E hold for an R(7) counterexample, with no extra assumption: my `r7_gives_everything` and `r7_gives_record` compile.

## The control: record 89694
My script `scratch/control_check.py` (log `logs/control_check.log`) reads the ledger, `configs.bin` and `cores_e85.g6` with its own code. It does not run `r7_control_data.py`.
- **Ledger row:** idx 89694, K 10, `SAT-GRAPH-VERIFIED`, level 7, core 0, 11 rows. `configs.bin` record 89694 is (0, 220, 1604, 827, 2433). Its four 6-sets, in my own enumeration, equal the last four ledger rows.
- **Is D the recorded graph? Yes, up to a relabelling of ten fixed vertices.** It is not the same labelled graph. The pipeline numbers u 27, w 28, C 29–35, A 36–37, B 38–39 (`prod.py` lines 126–127). D numbers 27 + s, with u 0, C 1–7, A 8–9, w 10, B 11–12. After that map the two are equal edge for edge. The core and the order of the rows do not move.
- **The report's numbers, on my own count:** `Layout` holds (both fields). 9-regular. No triangle. α = 10 by my own branch routine. The Lean's ten is independent: it is the sample plus the three C vertices whose rows miss it.
- **"No independent 11" in Lean** (C:75–78). `fits edge n L k` (C:12–18) is an include/exclude search. It answers true only if every independent subset of the list L has at most k vertices: leave v out and keep the bound, or take v, drop its neighbours and lower the bound by one; stop when the list is no longer than the bound. `fits_sound` (C:20–50) proves that reading for any graph. C:76 is the kernel evaluating the search on all 40 vertices with bound 10. No compiled code: its proof constant depends on `propext` alone.
- **"Exactly three C rows miss the seven core vertices":** yes. The sample {0, 1, 3, 6, 12, 14, 18} (C:115) is independent. Rows missing it: none of A, none of B, the C rows of fixed labels 3, 4, 5. The theorem states the two thresholds and the two row tests (C:121–124). The count 3 is inside its proof (C:131) and follows from the statement.
  - Thresholds: 9 + 1 − 7 − 0 = 3, and 3 < 3 fails. 10 + 1 − 7 − 0 = 4, and 3 < 4 holds. As reported.
- **All 12,462 independent core sets, my count:** at K = 10 none fails any of the four parts. At K = 9, 306 fail, every one in the row part. So both sides of `bound_iff_rowClauses` agree at 9 and at 10.
- **Vacuity, as reported:** the core has independence number 7 and no independent 8-set. At K = 10 the hitting condition has 0 sets to test. At K = 9 it has 750, and an A row and a B row meet all 750, as they must: the side rows come from `configs.bin`.
- **Citation slip in the report:** "(R7Control.lean:65)" is `layout`. The independence proof is C:75–94.

## The exchanges (E, EC): the four questions
**1. The two theorems.**
- **`completes_image_iff`** (E:154–156). For any finite type X, any graph H on X, any K, any seven finite sets R (ordered), any four finite sets S (ordered) and any image im in `Fin 8`: `Completes H K R (S ∘ source im) ↔ Completes H K R S`. No hypothesis on H, R or S. Repeated side rows are allowed, as reported.
  - `source` (E:12–14) is the table of the 8 slot maps. It equals the loop of `cover7.c` (lines 85–88) on all 8 images (my script).
  - The proof relabels the 13 fixed vertices by `fixedPerm im` (E:24–28). The side exchange (E:19–20) swaps 0 with 10 (the roots), 8 with 11, 9 with 12. Every image fixes each core vertex (E:45–46) and each C vertex (`common_fixed`, E:31). As reported.
- **`section3_of_graph`** (E:110–112). Hyp: X finite; a graph G on `X ⊕ Fin 13` with `Layout`, no triangle, every degree 9, `G.indepNum ≤ 9`. Says: `Section3` holds for the core of G and its four side rows, in the order of labels 8, 9, 11, 12.
- **`representative_completion`** (E:166–170). Hyp: X finite; H any graph on X; `records`, any family of 4-tuples of finite sets of X; the hypothesis `cover`; and `Completes H 9 R S`. Says: some record r has `Completes H 9 R (records r)`, with the same seven ordered C rows R.

**2. How P3 enters.** As the hypothesis `cover` (E:168), in this exact form: *for every 4-tuple S of finite sets of X with `Section3 H S`, there are a record r and an image im with S = `records r ∘ source im`.*
- `Section3 H S` (E:54–60): S 0 and S 1 are independent 6-sets of H and every independent 7-set of H meets S 0 or S 1; the same for S 2 and S 3; S 0 ∪ S 1 is disjoint from S 2 ∪ S 3.
- **Does that form match what the cover CNF establishes? Yes.** The header of `cover7.c` (lines 5–16) and `p3-pod/P3-RESULT.md` say: every labelled configuration on the core is one of the 8 labelled images of a record. Part by part: rows a1, a2, b1, b2 are slots 0–3; clauses (T), (M), (L) say "independent 6-set"; (R) is the hitting part; (X) is the disjointness; (B) blocks the 8 images, by the same table.
  - **Ordered or unordered:** no mismatch. Both speak of ordered tuples. The unordered records are reached through the 8 images.
  - **Repeated rows:** no mismatch. `Section3` allows S 0 = S 1, and so does the CNF (`P3-X0-CHECK.md` item 9).
- **The mismatches are in the instantiation, and none of it is in Lean:**
  - X is never set to the 27 numbered vertices, H to a line of `cores_e85.g6`, `records` to the records of `configs.bin`.
  - That the models of (T)(M)(L)(R)(X) are exactly `Section3` was read from the file in our P3 check. It is not proved in Lean.
  - **D7.** The core H of a hypothetical graph is its own labelled core (item 6). The P3 result is about the numbered catalogue cores. D7 stands between the two, and nothing here covers it.

**3. What "complete a record" means.** The predicate `Completes H K R S` (E:131–134): there exists a graph G on `X ⊕ Fin 13` with `Layout`, whose core is H (equality of graphs), with no triangle, every degree 9 and `G.indepNum ≤ K`, whose seven C rows are R and whose four side rows are S, in order. Given H, R and S, such a G is unique.
- It is the mathematical notion only. The production CNF is (T), (D), (I), the row order (S) and counters (R:92–105).
- Forward ("a completion's rows satisfy (T), (D), (I)") follows from S:36, S:24, S:82 and I:180, but no theorem states it for R and S. The row order needs a permutation of the C vertices: not in Lean. The converse (R:88) is not in Lean.
- `sideInputs_image` (E:96–97) says three quantities built from S do not change under the 8 images: how many side rows hold x; the larger count of missed rows; the disjointness. They mirror r′ (R:83) and max(m_A, m_B) (R:96; `r7cnf.c` lines 83–85). No theorem uses it. That the CNF depends on the sides only through them is P4.

**4. D1–D8 after seven modules.**

| Step | In Lean? | Where |
|---|---|---|
| D1 sizes 7, 2, 2, 27 | yes | L:79–85, visible through e (L:39–40) |
| D2 no edge inside C, A, B, C–A, C–B | yes | `role_edges` L:19–29, inside `Layout.fixed` |
| D3 roots see no core vertex | yes | L:117–123 |
| D4 α(X) ≤ 7 | yes, given the three transports | first part of I:183 at K = 9; also inside Ch:51–54 |
| D5 the edge count | conclusion only | e(X) = 85 at L:41, by Chen's other count |
| D6 A–B join; 6 neighbours in X | yes, from the lower half of P1 | L:47–52 from Ch:34–35; S:24 |
| D7 X is one of X0–X3 | **no** | — |
| D8 main sentence | yes, given the three transports | S:61, E:110 |
| D8 the three exchanges | yes | E:154 |
| D8 "the unordered pair loses nothing" | yes, given `cover` | E:166 |

- **Outside Lean still:** the three transports (item 2); D5's own count; D7; P3 as a fact; the triangle converse; R:80 and R:88; all of §5; P4.
- **On the control.** `eight_completions` (EC:14–16) is the theorem applied to the one checked graph. `eight_distinct` (EC:19–22) is a kernel computation. My direct test (`scratch/exchange_check.py`, log `logs/exchange_check.log`) builds each of the 8 relabelled graphs: `Layout`, 9-regular, 0 triangles, α = 10, the same core, the same seven C rows, side rows equal to S ∘ `source im`, on all 8. The 8 tuples are pairwise distinct. The roots move in images 4–7 only.

## The scope note (`P5-2026-11-22.txt`)
- It says what the report says: lines 3–10 put the §5 arguments under P5 and the generator under P4; lines 28–32 list what stays outside.
- **It is right about the two lines.** `PROD-PREREG.md` line 12: "P5. The derivation in `REDUCTION.md` (not formalised)." Line 11 is P4. R:124: "P5. The derivations D1–D8 and §2, as written here (not formalised)." R:124 is narrower.
- It says R:124 "omits §5". R:124 also leaves out R:80 and R:88 (§3's last line and §4). The note does not say so. Its list of what remains outside lacks the three transports.
- "Signed": `PROD-PREREG.md` equals its pin (`PROD-PREREG.sha256` line 1) and R equals its pin (line 3). An `.ots` receipt is beside it. I did not verify the receipt (no network).
- The note is the claimant's reading, written after the run. It is not an amendment. Which wording binds is the control room's call.

## Where the reports say more than the files do
1. "From R(7) to Layout" is exact. But the list of what remains outside does not have the three transports. As written, their other theorems are not yet applied to an R(7) counterexample.
2. "The A–B join is now derived from P1": derived by Chen's theorem, from the lower-bound half of P1. "Chen's checked `r7_count`": checked means built and censused by our audit, and replayed per module. Its statement was read here for the first time.
3. "Lean proved … on decoded production control 89694": Lean proved it about 40 typed numbers. The decode is Python. Mine agrees.
4. "(R7Control.lean:65)": the wrong line for the independence proof.
5. "Passed per-module leanchecker replay (r7-p5-replay.log)": the log cannot show a pass (item 13). True all the same: reproduced.
6. "Given P3's coverage statement on that core": "that core" is the hypothetical graph's own labelled core. P3 is about the numbered catalogue cores. D7 is between them, and the sentence does not say so.
7. "Lean verified that … all eight admit the same C rows": by the theorem, from one graph. Not eight checks. My script did the eight.
8. "Lean now proves the three D8 exchanges on Layout": true for `Layout`, `Section3` and `Completes`. Nothing about the CNF, as `R7-EXCHANGES.txt` lines 23–25 say themselves.
9. Neither report says that E depends on Chen's library (one lemma).

## One line per theorem
**Public, 29. All CERTIFIED unless marked.**
- `bound_iff_templates` I:92: R:50–54. `rowClauses_iff` I:156: R:97–98. Both unchanged.
- `bound_iff_rowClauses` I:180: R:55–58 with R:96; at K = 10, R:112–113.
- `clauses_at_cutoff` I:209: CERTIFIED as mathematics; **READ** as a statement about levels.
- `side_hits_seven` I:215: R:59–60. No non-vacuous instance in the files.
- `row_sizes` S:24: R:41. `rows_independent` S:36: R:44, forward. `opposite_disjoint` S:43: R:45, forward. `column_degree` S:82: R:42, R:83. All unchanged. `gives_configuration` S:61: R:70–71.
- `layout` C:65, `regular` C:67, `triangle_free` C:69, `alpha_eq_ten` C:80: R:112–113, on the graph my decode confirms.
- `control_row_tests` C:98: R:55–58 at K = 10; an instance of I:180. `control_sides` C:104: R:70–71 at K = 10; its hitting parts are vacuous.
- `core_bound` C:110: R:17–18 and R:28–30 (the core has no independent 8-set). `boundary_sample` C:121: R:96–98 at both bounds, computed.
- `layout_of_r7` L:34: R:11–26 (D1–D3, D6, the conclusion of D5). Given Chen's compiled library.
- `slot_action` E:30, `common_fixed` E:31, `layout_image` E:48, `section3_image_iff` E:68, `completes_image_iff` E:154: R:72–74.
- `sideInputs_image` E:96: CERTIFIED as mathematics (R:83, R:96); **READ** as a statement about the generator.
- `representative_completion` E:166: CERTIFIED as a conditional (R:74); **READ** as R:80, which needs D7 and P3 as a fact.
- `section3_of_graph` E:110: R:70–71 with R:67–68. `eight_completions` EC:14, `eight_distinct` EC:19: R:112–113, for the 8 images.

**Private, 19. All CERTIFIED.** I: `covers` 29, `template_ok` 34, `mem_missing` 52, `union_count` 57, `split_independent` 64, `missing_subset` 137, `root_count` 141. S: `mem_row` 15, `fixed_degree_table` 19. C: `fits_sound` 20, `upper_flat` 75. L: `role_edges` 19. E: `fixed_edges` 33, `roots` 36, `undo` 41, `validPair_comm` 62, `total_image` 88, `largerPair_image` 92, `to_image` 136.

**REFUSED:** `leanchecker --fresh`. A rebuild of Chen's library (not asked; its compiled files are present). The byte comparison of the eight CNFs (item 14). A Lean instance of the side-hitting condition (none can be built at K = 10 on these cores).

## Later items, not acted on
- The three transports could go into L as written in `P5bCompose.lean`. One theorem would then say: an R(7) counterexample and the lower half of P1 give a labelled core, seven C rows and four side rows with `Completes` and `Section3`. D7 in Lean would need the four cores as data, P2 as a hypothesis, and `Completes` moved along a relabelling of the core. The forward link from `Completes` to (T), (D), (I) in terms of R and S is a short corollary nobody has stated.
