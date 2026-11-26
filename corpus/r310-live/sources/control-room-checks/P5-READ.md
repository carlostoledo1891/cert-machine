# P5: the control room's reading of the two Lean files (PRIVATE; 2026-11-22)

Checked here: Astra's report that Lean now covers part of P5. One agent of the control room read the files, once. Nothing left this machine.
Short names: **I** = `codex-r7-scout/R7Independence.lean`, **S** = `codex-r7-scout/R7SideChoices.lean`, **R** = `claude-r7/REDUCTION.md`. `I:92` means line 92 of I.

## What is NOT established (read first)

1. **The Lean has no R(7) graph in it.** Every theorem is about any graph on `X ⊕ Fin 13` that satisfies the hypothesis `Layout` (I:41–43). Nothing derives `Layout` from the statement of R(7) (R:7–8). D1, D2, D3, D5, D6 and D7 are not in the Lean.
2. **The A–B join is assumed.** `Layout.fixed` (I:42) contains "every vertex of A is adjacent to every vertex of B". In R that is D6 (R:25–26), which needs the edge count D5 and the premise P1. The part of P5 that rests on P1 is outside these files.
3. **There is no CNF in the Lean.** No clause, no literal, no variable number, no file. `RowClauses` (I:153–154) is a statement about adjacency in G. It becomes the meaning of the (I) clauses of R:96–98 only after three steps the Lean does not have: X is the catalogue core in its numbering; the four side rows of G are the configuration's rows; `r7cnf.c` writes those clauses (P4).
4. **"Level 3, level 4, full depth" is one statement, not three.** In `clauses_at_cutoff` (I:209–212) the hypothesis `I.card ≤ level` is discarded (`fun I hI _`, I:212). It is the full-depth statement with an idle argument. Nothing about a level was checked.
5. **X is any type.** 27 never appears. Neither does 40, nor a core X0–X3. The move to a catalogue core (D7, P1–P2) and to a record of `configs.bin` (P3) is not in the Lean.
6. **Triangles: one direction.** R:43 says "if and only if". The Lean has triangle-free ⇒ rows independent (S:36) and ⇒ opposite rows disjoint (S:43). The converse (R:47) and the "exactly when" of R:88 are absent. "UNSAT, so no G" needs only the forward direction, and a SAT model is checked on the decoded graph itself (`PROD-PREREG.md` line 43), so the run does not lean on the converse. R states it all the same.
7. **The row order (S) is not covered.** R:103–105 argues that sorting the seven C rows loses nothing. That is a derivation, and no Lean theorem states it. The same holds for "the counters are harmless" (R:94–95) and for the exchanges of names and of A with B in D8 (R:72–74).
   - `PROD-PREREG.md` line 12 words P5 as "the derivation in REDUCTION.md", which includes these. R:124 words it as "D1–D8 and §2", which leaves the §5 arguments under no premise at all.
8. **The bound 9 is fixed in every main theorem but one.** The K = 10 controls cannot be passed through them.
9. **No model of the hypotheses is in the files.** No `example`, no instance of `Layout`. See Vacuity.
10. **The replay is per module.** `leanchecker` replays a module's own declarations on top of its imports. `--fresh` was not run, so Mathlib's compiled files are taken as built.

## What was done, by our route (not by `check-r7-p5.sh`)

- **sha256**, the same before and after the build:
  - I `145734670be6e954a24c1ee0caaee7e93f0598aa3ab34f8b186c269a873f2e72`
  - S `e1cb2c88d83a3f75b53de200b11838b9b25b4dcae424c974422224ec90cf458b`
  - `check-r7-p5.sh` `c90bd8ee3e6f315fbae9d000ffc374183f9c881638d21736a72ad84383d07f68`
[line 26 withheld from the public copy: another private project or private correspondence]
- **Axioms.** `p5-build/scratch/P5Axioms.lean` prints the axioms of the ten public theorems by name, then of every constant the two modules add to the environment. 72 constants, 49 of them theorems (19 named in the files; the rest are auxiliary). All stay within `propext`, `Classical.choice`, `Quot.sound`. No axiom, opaque, unsafe or partial declaration. Log: `p5-build/axioms.log`.
- **Kernel replay.** `leanchecker -v R7Independence`, then `leanchecker -v R7SideChoices`: exit 0 each.
- **Elaborated statements**, with implicit and instance arguments shown: `p5-build/signatures.log`.
- **Their script** prints the axioms of 4 of the 19 named theorems (I:233–234, S:112–113). It deletes its build folder on exit, and no log of their run is in the folder.
- **A slip of mine.** `leanchecker --help` started a replay with no module named. It ran about two minutes at 5 GB before I stopped it. It wrote nothing.

## Weakening search (both files)

No hit for `sorry`, `admit`, `native_decide`, `unsafe`, `partial`, `implemented_by`, `set_option`, `opaque`, `Fact`, `instance`, `macro`, `attribute`. The word `axiom` occurs only in the four `#print axioms` lines.
- `classical` at I:49 is inside the **definition** `missing` (`noncomputable def`, I:48). It supplies decidability for a filter. It conjures no data: `mem_missing` (I:52–55) pins which set it is.
- `classical` at I:54, I:96, I:158, I:220 and `by_contra!` at I:161, I:167, I:221 are inside proofs.
- `noncomputable def threshold` (I:174–175) is `10 - I.card - max …` with natural-number subtraction. Harmless: the first three conjuncts of I:183–185 force the value to be at least 2.
- `decide` (I:32, I:36, I:149, I:228; S:22, S:49, S:67, S:72, S:88, S:107) is the kernel's own, over `Fin 5` and `Fin 13`. The axiom lists confirm that no compiled evaluation is used.
- Instance arguments: `[Fintype X]` and `[DecidableRel G.Adj]` (S:11), `[DecidableEq X]` (S:82). "X is finite" is real content and true in the application. None of the three hides a mathematical assumption.

## The `Layout` hypothesis (I:41–43): two fields, both assumed

- **`fixed` (I:42).** For all fixed s, t: s is adjacent to t exactly when their blocks are neighbours in the 5-cycle u, A, B, w, C (I:24–25). Blocks by `block` (I:20–22): u = 0, C = 1..7, A = 8..9, w = 10, B = 11..12. By origin:
  - The labelling (the definitions of C, A, B at R:11): u–C, u–A, w–C, w–B; u not adjacent to B; w not adjacent to A.
  - The statement of R(7) (R:7–8): u not adjacent to w; |C| = 7.
  - 9-regularity, D1 (R:13): |A| = |B| = 2.
  - Triangle-freeness, D2 (R:14–15): no edge inside C, inside A, inside B, or between C and A ∪ B.
  - **Chen's structural result**, D6 (R:25–26; his `r7_count`, `r7_cover`, R:33), which needs P1: the four A–B edges.
- **`roots` (I:43).** u and w have no neighbour in X. This is D3 (R:16), true by the definition of X. Labelling.
- Built into the types, not fields: the 13 fixed vertices are distinct and lie outside X (`X ⊕ Fin 13`, I:38).

**Is 9 a parameter?** Only in `bound_iff_templates` (`K`, I:92). Fixed elsewhere: `10` in `threshold` (I:175); `9` and `7` at I:181, I:183–185, I:210, I:216–217; `G.indepNum ≤ 9` (S:62); degree 9 (S:24, S:62, S:82) with its tables (S:21, S:25).

## One line per theorem

Below, "α ≤ 9" stands for "every independent finite set of G has at most 9 vertices" (I:181), and m_Q for the number of rows of block Q that miss I (`missing`, I:48–50).

- `bound_iff_templates` I:92. **CERTIFIED.** Hyp: Layout; any K. Says: α ≤ K ⇔ for every core-independent I and each of the five pairs (C,A), (C,B), (u,B), (w,A), (u,w) of I:27, |I| plus the missing rows of both blocks is at most K. R:50–54. Stronger than R: any K.
- `rowClauses_iff` I:156. **CERTIFIED.** No hypothesis. `RowClauses G I k` ⇔ fewer than k of the C rows miss I. R:97–98.
- `bound_iff_rowClauses` I:180. **CERTIFIED.** Hyp: Layout. Says: α ≤ 9 ⇔ for every core-independent I: |I| ≤ 7; |I| + 1 + m_A ≤ 9; |I| + 1 + m_B ≤ 9; `RowClauses` at k = 10 − |I| − max(m_A, m_B). R:55–58 with R:96. Same content as R.
- `clauses_at_cutoff` I:209. **CERTIFIED** as mathematics; **READ** as a statement about the CNF's levels (items 3, 4). Hyp: Layout; α ≤ 9; any `level`; I core-independent; |I| ≤ level (unused). Says: `RowClauses G I (threshold G I)`. R:96–98, R:106–108.
- `side_hits_seven` I:215. **CERTIFIED.** Hyp: Layout; α ≤ 9; I core-independent; |I| = 7; a side A or B. Says: some row of that side meets I. R:59–60 (the root condition).
- `row_sizes` S:24. **CERTIFIED.** Hyp: X finite; Layout; every degree 9. Says: a row has 7 vertices on C, 6 on A ∪ B, 0 on u and w. R:41. It takes the A–B join from Layout, so it does not prove D6.
- `rows_independent` S:36. **CERTIFIED.** Hyp: X finite; triangle-free. Says: every row is independent in the core. R:44, forward only.
- `opposite_disjoint` S:43. **CERTIFIED.** Hyp: X finite; Layout; triangle-free; a in A; b in B. Says: the two rows are disjoint. R:45, forward only.
- `gives_configuration` S:61. **CERTIFIED.** Hyp: X finite; Layout; triangle-free; every degree 9; `G.indepNum ≤ 9`. Says: `SideChoice G A`, `SideChoice G B`, and every A row is disjoint from every B row. `SideChoice` (S:55–59): the side has two indices; each row has 6 vertices and is independent; every independent 7-set of the core meets a row of the side. R:70–71 (D8) with R:67–68.
  - Different from R: the rows are indexed by vertex, so the pair is ordered and equal rows are allowed; R has unordered pairs. It does not say that G's configuration is a record of `configs.bin`.
- `column_degree` S:82. **CERTIFIED.** Hyp: X finite; Layout; every degree 9; x in X. Says: deg_X(x) + side rows through x + C rows through x = 9. R:42, and r′ of R:83 and R:85.
- Private, all **CERTIFIED**:
  - `covers` I:29 and `template_ok` I:34: the independent sets of the fixed part are the subsets of the five pairs. R:50–51.
  - `split_independent` I:64: R:48–49. Needs no Layout.
  - `root_count` I:141: under Layout, u and w each count one missing row. R:16.
  - `fixed_degree_table` S:19: neighbours inside the fixed part are 2 for C, 3 for A and B, 9 for u and w. R:20–21.
  - `mem_missing` I:52, `union_count` I:57, `missing_subset` I:137, `mem_row` S:15: bookkeeping, with no sentence of their own in R.
- **REFUSED:** `leanchecker --fresh` (not run; it replays the whole of Mathlib's closure). A formal model of the hypotheses (not built, as instructed).

## P5, part by part (R:124: "D1–D8 and §2")

- **Checked in Lean, given `Layout`:** §2 Degrees (R:40–42). §2 Triangles, forward half (R:44–45). §2 Independence in full, as an equivalence (R:48–60). The α(X) ≤ 7 of D4 (first conjunct, I:183). The main sentence of D8 (R:70–71) on the labelled graph.
- **Assumed inside `Layout`, not checked:** the sizes of D1; D2; D3; the A–B join of D6.
- **Not in the Lean at all:** |X| = 27 (D1); the edge count D5; the derivation of D6 from P1; D7; the exchanges of D8 (R:72–74); the converse for triangles (R:47).
- **Outside R:124 but inside the derivation:** R:80, R:88, and the §5 arguments of item 7. Not in the Lean.

## Vacuity

- **In the files: no evidence either way.** There is no model of `Layout`, alone or with the other hypotheses.
- **By reading:** `Layout` with α ≤ 9 is satisfiable. Take X empty: the 13 fixed vertices alone have α = 9 (C ∪ A). That is the trivial case, and it was not built in Lean.
- **Numeric test of mine, not formal** (`p5-build/scratch/k10_numeric.py`, log `p5-build/k10_numeric.log`). The ten K = 10 control graphs of `claude-r7/prod-out/control_k10_sat.tsv`, rebuilt in the Lean's numbering:
  - All ten satisfy `Layout`, are triangle-free and are 9-regular. So three of the four hypotheses of `gives_configuration` hold together on real graphs.
  - The conclusions of `row_sizes`, `rows_independent`, `opposite_disjoint` and `column_degree` hold on all ten.
  - α = 10 by a generic routine, and the right side of `bound_iff_templates` has maximum 10 on all ten. So that equivalence agrees for every K.
  - At 9, the right side of `bound_iff_rowClauses` fails only in its row-clause conjunct (267 to 383 sets I per graph). Both sides are false, as they should be.
- **All four hypotheses of `gives_configuration` together:** with |X| = 27 that is a counterexample to R(7). `PROD-RESULT.md` says none exists, under P1–P6. So the theorem is expected to be vacuous there: it is one step of a proof by contradiction. For other sizes of X the files say nothing.
- **The smallest honest formal test.** Make K a parameter in `threshold`, `bound_iff_rowClauses`, `side_hits_seven` and `gives_configuration`. Then instantiate at K = 10 on one decoded control graph (X = `Fin 27`), with `Layout`, `CliqueFree 3` and the degrees proved by `decide`, and α ≤ 10 through the right side of `bound_iff_templates` (12,462 independent sets of the core, five pairs each).
- **Do the parameters allow it as written?** Only in part. On a K = 10 graph one can instantiate `bound_iff_templates` and the four theorems that do not use the bound. `clauses_at_cutoff`, `side_hits_seven` and `gives_configuration` cannot be instantiated: 9 is a literal.

## Where the report says more than the files do

1. "Every mathematical independence clause at level 3, level 4, and full depth": one theorem, with the level idle (item 4). The word "mathematical" is doing all the work; no clause of the CNF is in the Lean (item 3).
2. "For the labelled R(7) graph": the Lean has no such graph, only a hypothesis that a graph has the layout (items 1, 2, 5).
3. "Passed a clean build and kernel replay": true, reproduced here. The axioms of 15 of the 19 named theorems were not printed by their script; ours covers all. The replay is per module (item 10).
4. "Not yet done" lists Chen's theorem, the transport to the catalogue core, and P4. It leaves out: the converse for triangles (item 6); the row-order argument as a derivation, which the report files under P4 (item 7); the exchanges of D8 (item 7).
5. "P5 partially checked: the new proof starts after the 13 fixed vertices have been labelled" is fair, with one addition: it also starts after the A–B join is granted, and that join is the P1-dependent step (item 2).

## Later items, not acted on

- R:99 says k ≤ 0 would be a root-condition failure. At K = 9 with |I| ≤ 7, k is always at least 1. The failure is caught by the guard `m + 1 + mA > K` at `r7cnf.c` line 84, which is the second and third conjuncts of I:184–185. A wording point in R, not a soundness one.
- `r7count.c` line 67 enumerates side pairs with j ≥ i, so equal rows are on the list. That agrees with the Lean's indexed rows. Read only; it belongs to P3.
