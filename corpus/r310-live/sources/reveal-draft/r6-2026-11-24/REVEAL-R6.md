# Reveal: Case R(6), the three-edge branch (PRIVATE DRAFT, 2026-11-24)

The source of truth for the opened box 3 of https://carlostoledo.co/r310/, for the record `corpus/r310-r6/` and for
the note to Zhiyang Chen. Written 03:29–03:55 UTC on 24 November 2026 by a control-room subagent (Claude Fable 5.2),
on the operator's decision of 24 November (his dialog answers, as given in this subagent's brief): "Open now, limits
first"; the reveal is "Page + note to Chen"; the package is shown to him before anything is published. Nothing was
staged, committed, pushed or posted. No existing file was edited; four redacted copies and two scan tools were written
inside this folder.

Paths are relative to `notes/ramsey-r310-scout-2026-11-21/`. Short names used below:

| Short | File |
|---|---|
| LOG | `control-room-2026-11-22.md` (1,551 lines when read; it grew from 1,533 while this was written) |
| PREREG | `control-room-checks/r6-full/R6-FULL-PREREG.md` |
| DEV | `control-room-checks/r6-full/R6-FULL-DEVIATIONS.md` |
| FINAL | `control-room-checks/r6-full/pod-final-resumed/` (`FINAL.sha256`, `VERIFIED.txt`, `run.log`, `out/`) |
| TALLY | `FINAL/out/TALLY.txt` |
| LEDGER | `FINAL/out/cores.jsonl` |
| JOIN | `control-room-checks/emit-join-final/WORKLOG.md` |
| HALL | `control-room-checks/HALL-DISAGREEMENT-2026-11-23.md` |
| TIGHT | `control-room-checks/R6-TIGHT-AUDIT.md` |
| PROSE | `control-room-checks/R6-PROSE-ITEMS-AUDIT.md` |
| CHENAUD | `control-room-checks/CHEN-RALPH-READING-AUDIT.md` (never published; cite its verdicts only) |
| r024 | Chen's clone `audit/chen-ralph-2026-11-23/repo/review/ideas/r024_R.md` at commit 055ae277 |

"Computed here" marks a number this subagent computed today from LEDGER with its own few lines of Python (no file
keeps that program; the commands are in the session only). Every other number has its file and line.

Companion files in this folder: `ALLOWLIST-R6.tsv`, `LEAK-SCAN-R6.txt`, `PAGE-SPEC-R6.md`, `CHEN-NOTE-R6.md`,
`OPEN-QUESTIONS.md`, `redacted/` (four copies), `tools/` (the two scanners and their raw output).

## 1. What is not established (read first)

**It does not decide R(3,10), and it does not close Case R(6).** 40 ≤ R(3,10) ≤ 41 stands as before.

1. **One branch of the case, not the case.** Chen splits Case R(6) by the number f of cross-edges of a marked pair:
   "For c* = 6: e(X) = 72 + f*, f* in 3..9" (Chen's clone, `notes/cases_local.md:152`). What finished is f = 3 only
   (PREREG:6–8, 22–23). **The four-edge branch has not been run** (on these words: OPEN-QUESTIONS 1). Nothing in this lane
   touches five to nine cross-edges. PREREG said it before the run: "that branch is removed under items 1 to 5. That does not decide R(6),
   and it does not decide R(3,10)" (PREREG:22–23). **NEW relative to the brief:** the brief names the four-edge branch
   as what is left; by Chen's own split the branches left are four, five, six, seven, eight and nine.
2. **No single version of the second counting program agrees with ours on every core.** Version 1 ran on all 23,409
   cores and differs from ours on 32. The corrected version 2 agrees with ours on those 32, and was run on 129 cores
   in all, on one Mac, never on x86-64, never in a registered run (JOIN:295–308; LOG:1529–1530). What the files
   support: v1 on 23,377 cores, v2 on the 32, and v2 = v1 on the 97 unaffected cores tried (JOIN:297–298). For the
   other 23,280 cores, "v2 would equal v1" rests on a reading of the patch and on a scanner written by the control
   room after reading both programs (JOIN:300–305). A full v2 run was priced at about 2.1 machine-hours and not done
   (JOIN:299; LOG:1532–1533).
3. **The join covers the enumeration only.** The second program has no verdict; it is a counter. It was compared
   with ours on five things per core: the graph's identity, the baseline count, the number of Hall survivors, the
   stream's length and the stream's sha256 (JOIN:20–31). Our 23,409 EXCLUDED verdicts come from our tests applied to
   those survivors, and **no second program touched the tests** (JOIN:37–41, 326–329; LOG:1530–1531). The baseline is
   compared as a number only: neither program writes the baseline records (JOIN:330).
4. **The second program was not written blind.** Its baseline path was written after its track had read and patched
   our `count.c` ("Separately written, not blind", `control-room-checks/R6-ROUND38-EMIT-AUDIT.md:11`; JOIN:318–320;
   LOG:1531–1532). Both programs implement one written baseline definition and one Hall screen, and read the same
   catalogue file: agreement checks code against code (JOIN:314–317). **A shared omission is invisible**: a survivor
   dropped by both, a baseline record missed by both, a graph missing from the catalogue (JOIN:331, 315).
5. **The correction of the second program is ours, not its author's.** The patch that makes v2 was written by the
   control room, modelled on our own `enum_own.c`, to make the second program reproduce our stream; "v2 = ours" on
   the 32 shows the patch does what it was written to do (JOIN:309–313). That the 14,895 dropped records are rightly
   dropped rests on three readings of one Lean definition, none of them a Lean check on those records (HALL:7), and
   on our own tests refuting all 14,895 (HALL:59–66). One clause of the patch is exercised by no run (JOIN:335;
   HALL:11). Of the 32 predicted differences only 16 were forecasts, and their priority rests on local file times
   and our ledger's own clock (JOIN:146–155, 336–337). The join program is new and was read by nobody else
   (JOIN:338). Two builds of v2 from the same source differ in 465 bytes, cause not found (JOIN:209–211, 339).
6. **The chain from a graph to a verdict is partly prose.** By premise (numbers as in section 2):
   - **In Lean** (P3): the fixed part, the 26 vertices and 75 edges of the core, the bound α(X) ≤ 7, the ten-set
     bound behind test (i), the separation behind test (ii), the four Hall conditions for the true rows on both
     sides, and the uniqueness of the written record (LOG:711–723, 910–913, 1175–1180).
   - **Prose, read by control-room agents, with samples** (P4): that the C programs compute those conditions; the
     enumeration loops, the hash table, the Hall matching routine, the tables' sizes; the direct decider's search and
     its pruning; the step from a graph's core to its catalogue line. "Not in Lean: the C matching routine, the
     tables" (LOG:913); "the C program itself … the catalogue (row 25)" (LOG:1179–1180); "there is no refinement
     proof and no second complete enumeration of any core" (PROSE, "not established" 3). The one-page proof's "if"
     has three of the run's four clauses, and "accounted for" is met by counts, not by records (LOG:847–848).
   - **No proof file per record** (PREREG:11–13). The Hall streams were not kept; the ledger keeps each one's count
     and sha256.
7. **Limits of the Lean part.** The theorems are about a graph on `Fin 40` satisfying `Branch`; no such graph is
   exhibited, and on 40 vertices none may exist, so every graph theorem could be vacuous (the readings tested them at
   36 vertices with four numbers changed, and on 309 real 36-vertex graphs) (`control-room-checks/R6-LEAN-READ.md`,
   "not established" 2; `R6-SYMMETRY-LEAN-READ.md`, 4). `leanchecker --fresh` was not run on any R(6) module
   (LOG:723; `R6-HALL-LEAN-READ.md`, 6; `R6-SYMMETRY-LEAN-READ.md`, 6). One export, one exporter, one Mac. Mathlib and **Chen's Lean library**
   (`R310.Pair`, imported by `R6ThreeEdge.lean:1`) were used as compiled, not rebuilt (`R6-LEAN-READ.md`, 5). Each
   file had one reader, an agent of the control room.
8. **Imported facts, none checked here.**
   - **The census** (P1): 23,409 graphs in R(3,8;26,75), Goedgebeur and Radziszowski 2013, Table 13 (our copy
     `audit/gr2013/gr2013.txt:1074`). Nobody here re-derived it (PREREG:17). The paper says its (3,8;26,≤76) sets were
     obtained by two methods in agreement (`gr2013.txt:1228–1232`): that is the paper's own check, not ours.
   - **Chen's case split** (Lemma Mc, Lemma F: `notes/cases_local.md:125–152` in his clone) is what makes this
     "a branch of R(6)". The statement of section 2 does not need it; the place of the statement on the map does.
     His report and his run are unrefereed.
   - **Chen's Lean library**, under every Lean theorem (item 7).
   - **R(3,k) values:** none is a premise. R(3,8) = 28 appears only in an erratum's remark that codegree 8 and 9 are
     impossible on 40 vertices (`control-room-checks/R6-TIGHT-AUDIT-ERRATUM-2026-11-23.md`). The tests use no codegree
     bound (TIGHT:25), so the result does not rest on R(7) being excluded (CHENAUD:89–91).
   - **Seeds of the catalogue:** the 62 graphs with 73 edges from the House of Graphs and McKay's 27-vertex file
     (`codex-r6-scout/row-capacity/blind75/catalogue-source/PROVENANCE.md:8–18`). They are seeds, not premises: each
     catalogue line was checked by itself.
9. **The catalogue's completeness has no independent check of ours.** The file was checked: 23,409 lines, each with
   26 vertices, 75 edges, no triangle and no independent 8-set, no two isomorphic (the control room's own invariant
   without nauty, and nauty three ways) (`control-room-checks/R6-BLIND-AUDIT.md:38–40`; LOG:451–452, 1102). It was
   built by three traversals that are not exhaustive and were "repeated until the count reached the published
   number. If the true count were larger, the gate would pass just the same" (`R6-BLIND-AUDIT.md:9`). So complete
   means: 23,409 distinct valid graphs, and Table 13 says 23,409. An exhaustive route was planned (21,493 jobs) and
   not run (LOG:1102–1103).
10. **Deviations from the registration.**
    - **In DEV, one item:** the time and cost estimate was wrong (9 to 11 hours registered; 125 s of wall per core
      measured after 115 cores); the operator was asked early and said go on; "No rule, limit or program changes"
      (DEV:3–11).
    - **NEW, not in DEV (found in LOG and the files):**
      a. The run was stopped at 16,927 cores when the account's balance reached the operator's limit (16:25 UTC, 23
         November) and resumed on a second machine (LOG:1360–1368, 1380–1384). PREREG:92 allows a resume ("that is
         recorded"); it is recorded in LOG and in the run logs, not in DEV. PREREG:20 says "One machine, one run".
      b. The resumed run was started by hand: the resume script reported ALREADY-RUNNING because it matched its own
         command line (LOG:1383–1384).
      c. **The registered Mac recheck of 12 cores has no record.** PREREG:97–99 registers it; LOG:520–521 lists its
         twelve lines; the string of its rule occurs in no other file of the lane. Partial substitutes exist: the
         Mac's full Hall streams equal the machines' on four cores of another draw (PROSE:43) and on line 1389
         (LOG:1283), and v2 of the second program reproduces our stream hashes on 129 cores on the Mac (JOIN:332–334).
      d. **The machine's own `OUT.sha256` is not at home.** PREREG:95 says the pull is re-hashed against it;
         `pod_run.sh:61` writes it; FINAL holds `pod-side.sha256`, a list of another shape (it includes `run.log`).
      e. **The separate tally has no saved program.** PREREG:96 registers "our own tally, written separately";
         `VERIFIED.txt:4–5` reports a recount but keeps no script. The join's own reading of our ledger gives the
         same rows and sums (JOIN:77, 102), and so does this subagent's recount (section 3).
      f. The seven cores decided before registration (PREREG:24–28) are in the catalogue and were run again; four of
         them are the gate's pinned controls.
11. **Two machines.** The first (AMD EPYC 7713) wrote 16,927 rows, 22 November 18:10:23 UTC to 23 November 16:25 UTC;
    the second (AMD EPYC 7713P) wrote 6,482, 23 November 16:35:29 UTC to 24 November 00:45:09 UTC
    (`FINAL/out/RUN-MACHINE.txt.first-machine:1,16`, `RUN-MACHINE.txt:1,16`, `progress.log:1`, TALLY:1; computed here
    from LEDGER: 16,927 rows end before 16:30 UTC on 23 November, 6,482 after). Line 16926 was in flight at the stop
    and was computed whole on the second machine (LOG:1366; computed here: its row starts 16:35:29 UTC). Both ran
    the same bundle; the four binaries have the same sha256 on both (`RUN-MACHINE.txt:6–9` in both files). The gate
    passed on each. Same provider, same compiler, same architecture: not two independent machines.
12. **The ledger is the machines' own account.** Independent of it: the gate's controls, the second program's
    enumeration (items 2 to 5), the recounts of the ledger. The cross-check inside the run is by our own direct
    decider and is a sample: 5,992,486 records of 92,080,292,598 Hall survivors (TALLY:7, 10), 0.0065% (computed
    here). "It can catch an unsound test. It cannot find one false refutation among millions" (PREREG:18–19).
13. **What the anchors prove** (section 3 has the table). The rules were stamped at 18:07 UTC by our clock, before the
    first machine was created (18:07:42 UTC). Bitcoin confirms the stamp only from block 977085, 18:17:27 UTC, seven
    minutes after the run began at 18:10:23 UTC (LOG:1541, 1104–1106). **By then 87 cores had ended and 119 had
    started** (computed here from LEDGER, the machine's clock). PREREG:3 says "Timestamped before the pod exists":
    the chain does not show that; our own clock and the calendars' pending receipt do. The final record's anchor
    (block 977301) proves the final hashes existed by 01:10:46 UTC on 24 November, 25 minutes after the run ended,
    and nothing about before. This subagent read both receipts offline (`ots info`: the file hashes and the
    heights); it did not check a block header or a block time (no network): those are the control room's readings.
14. **Most of the record carries no outside timestamp.** Unlike boxes 1 and 2 there is no salted seal and no registry
    line for this box (`~/Projects/seals/` holds no R(6) bundle). Two files are stamped: the rules, which pin the
    bundle and the catalogue by hash, and the final hash list, which pins the ledger. The Lean files, the prose
    proofs, the Hall note, the join and the audits are dated by local clocks only (unless a stamp exists that this
    subagent did not find: OPEN-QUESTIONS 9).
15. **The controls are not the real thing.** The 309 real graphs of the gate are 36-vertex graphs with 22-vertex
    cores; no real completion on a 26-vertex core exists to test against (TIGHT:13). Some corners were never tight on
    any control (LOG:551–552). Three of the tests' five reasons never fired: over all 23,409 cores the refutations
    are 41,559,075,592 "no row" and 50,521,188,666 "uncovered"; degree, pigeon and saturated are 0 (computed here;
    their sum equals TALLY:8).
16. **Who checked.** One operator. Models of two families (Claude; GPT-6.2-astra). Every audit named here is one
    agent of the control room, once. The audit of the prose items read a 4,731-row snapshot of the ledger, not the
    final one (PROSE, "not established" 2). Nobody outside has read any of it: no referee, no outside replay.
17. **Sentences already public that the files no longer support (NEW).**
    - The page's corrections ledger calls the second program "An independent second program"
      (`tools/r310-live-records.js:412`, in the public `corpus/r310-live/corrections.json`). See item 4.
    - Its resolution says the second program "is being corrected and will be compared again over every input when
      the sealed run ends" (`tools/r310-live-records.js:416`). The corrected program was compared on 129 cores; the
      uncorrected one on every core (item 2).
    Both need a correction row when the box opens (PAGE-SPEC-R6.md).
18. **A sentence in a file proposed for the record is out of date.** `claude-r6/R6-DERIVATION.md:68` says "that is
    R(7), not yet closed". Chen's run closed R(7) on 21 November (box 2). The record's README must say so beside it.
19. **About Chen's side** (section 6): our last reading of his repository is of 23 November, 04:02–04:41 UTC, at commit
    055ae277. Nothing is known here of what he has done since.

## 2. The statement, exactly as it may be said

> **If premises P1–P6 hold:** no 9-regular triangle-free graph on 40 vertices with no independent set of size 10
> has two non-adjacent vertices with exactly six common neighbours and exactly three edges between their other
> neighbours (the three other neighbours of the one, and the three of the other).

It is PREREG:6–7 ("a nonadjacent pair with six common neighbours and exactly three cross-edges") with the
cross-edges written out (A = N(u) − C, B = N(w) − C, e(A,B) = 3: `claude-r6/R6-DERIVATION.md:10–11`). It holds for
every such pair, not only for a pair chosen by Chen's rule. It says nothing about a pair with four or more cross-edges.

The premises, each with its status:

| | Premise | Status |
|---|---|---|
| **P1** | There are exactly 23,409 triangle-free graphs on 26 vertices with 75 edges and no independent 8-set, up to isomorphism. | **Imported**: Goedgebeur–Radziszowski 2013, Table 13 (`gr2013.txt:1074`). Not re-derived (PREREG:17). |
| **P2** | The catalogue file holds 23,409 such graphs, no two isomorphic. | **Computed**, by the control room's own code without nauty and by nauty three ways (`R6-BLIND-AUDIT.md:38–40`; LOG:1102). With P1 the file is complete. |
| **P3** | In a graph of the branch, the 26 vertices adjacent to neither marked vertex induce a graph of P1's class; the twelve rows, the bound behind test (i), the separation behind test (ii), the Hall conditions and the uniqueness of the written record hold. | **Lean 4.35.0**, Mathlib, the three standard axioms; built and read by the control room; nanoda, con-leche and Lean's kernel on one export (LOG:711–716, 910–913, 1175–1178). Rests on Chen's Lean library as compiled. `--fresh` not run. |
| **P4** | The programs test exactly those conditions and drop no completion: the enumeration, the Hall screen's matching routine, tests (i) and (ii), the direct decider, the step to a catalogue line. | **Prose**, certified by control-room agents by reading (25 conditions, LOG:544–548, 840–844); a second implementation agrees on 477 + 30 records (LOG:1100–1101). No Lean about the C. |
| **P5** | The two machines ran the pinned programs and the ledger says what they computed. | **The run itself.** Pins checked at each start; the gate passed on each; the second program gives the same enumeration, with the limits of section 1, items 2 to 5. |
| **P6** | The tools: gcc 13.3.0, Python 3.12.3, Lean's kernel and Mathlib, nauty. | Trusted as tools. |

Words:
- **Branch**: G is 9-regular, triangle-free, on 40 vertices, α(G) ≤ 9; u, w non-adjacent with exactly six common
  neighbours C; A and B the three other neighbours of u and of w; exactly three edges between A and B
  (`R6-DERIVATION.md:10–11`). Then the three edges are a perfect matching a₁b₁, a₂b₂, a₃b₃ (`:20–22`; Lean
  `fixed_part`).
- **Core**: X, the 26 vertices adjacent to neither u nor w. It is triangle-free, has 75 edges and no independent
  8-set (`:14, 17–23`). The **catalogue** is the list of all such graphs up to isomorphism: 23,409 (P1, P2).
- **Rows**: each of the twelve vertices of A, B, C has exactly seven neighbours in X, an independent 7-set
  (`:23–34`). A **record** is the six rows of A and B, mates aligned (24 bytes: six 32-bit masks; JOIN:28).
- **The tests that decide a core** (PREREG:47–59):
  1. `enum_own` lists every record that meets the **baseline** conditions, then keeps those passing the **Hall
     screen** in both directions (the Hall survivors);
  2. `tight_own` applies **test (i)** (for every independent set I of the core, the common rows meeting I and the
     pairs meeting I twice must number at least |I|; at equality every common row must meet I) and **test (ii)**
     (core vertices with one common neighbour left that a transversal misses need distinct common neighbours)
     (TIGHT:23–24), and refutes the record or leaves it open;
  3. `direct_own`, an exhaustive search for the six common rows that uses neither test, decides every record left
     open, and also a sample of 256 records per core whatever the tests said (the cross-check).
- **EXCLUDED** (a core): "every program that ran exited 0; the counts agree with each other; every Hall survivor was
  refuted by the tests or found infeasible by `direct_own`; the cross-check sample has no completion" (PREREG:62–64).
  The audit of the verdict function found no path to a false EXCLUDED beyond the premises (LOG:1095–1099).

## 3. The computation

**Inputs** (PREREG:31–43; all pinned by the stamped rules):
- the catalogue: 23,409 lines, sha256 `0d3d2caf830c9d5af9ad64ce6da120c83cd12600bc0acf70ae90f747dfab208d`;
- the bundle: sha256 `3c3e0b08b1a2c6b411dd43aa86a65de02adf8e56b64320fd82b2061016c26dd2` (four C programs,
  `full_run.py`, `pod_run.sh`, the gate's pinned values, six control files); the C sources are the ones audited on
  the four-core pilot (PREREG:45).
- Limits, unchanged: 2,000 search nodes per record, 3,600 s of wall per core, a sample of 256 (PREREG:58–59;
  `FINAL/run.log:17`).

**The gate** ran on each machine before any core and passed (LOG:529, 1383; `FINAL/out/CONTROLS.txt`,
`CONTROLS.txt.first-machine`): the four pilot cores whole, the 309 real graphs (none refuted; four wrong variants
caught), 309 completions found on the open path, 100 development records infeasible, the two limits, the sample, and
the cross-check catching an unsound test (PREREG:69–80).

**The run.** Two rented machines, 32 vCPU each, x86-64, gcc 13.3.0, Python 3.12.3, 32 workers (section 1, item 11).
CPU time: enumeration 1,669,011 s, tests 1,764,836 s, direct decider 403 s, cross-check 26,179 s (TALLY:19), together
3,460,429 CPU-seconds, about 961 CPU-hours (computed here: the sum). Per core: median 138.3 s of wall, at most 914.2 s
(TALLY:19); the 3,600 s limit was never reached (computed here: no row is timed out).

**The tally** (TALLY:2–21; recounted here from LEDGER, every figure equal):

| | |
|---|---:|
| catalogue lines present, each once | 23,409 of 23,409 (missing 0, repeated 0) |
| baseline records | 101,564,232,221 |
| Hall survivors | 92,080,292,598 |
| refuted by tests (i) and (ii) | 92,080,264,258 |
| left open by the tests | 28,340, on 4,192 cores (the core count computed here) |
| of those, infeasible by the direct decider | 28,340 (at the node limit 0, completions 0) |
| cross-check sample | 5,992,486 records, all infeasible (undecided 0, completions 0) |
| cores with a contradiction between tests and decider | 0 |
| cores with no Hall survivor (excluded by the enumeration alone) | 0 |
| records fixed by the symmetry | 0 |
| **verdicts** | **EXCLUDED 23,409 · OPEN 0 · WITNESS 0** |

**The final record** (`FINAL/FINAL.sha256`, nine lines, all checked here with `shasum -c`: OK):
- the ledger `out/cores.jsonl`: 36,581,874 bytes, sha256
  `34a673241985acea10af966013674de834ff89295303621f2d0ac43f8b6a5d7b`;
- `out/TALLY.txt`: `2f85c5a29d16d19dfb29618c9ec5c5abc67f44f4f78492531d24f6ddd06be00e`;
- `FINAL.sha256` itself: `e77693016f554bfdd407b6a0d2b3803cdd1e0beb9cd3fd5dc93b52630e45fb0a` (this is what the
  final receipt commits to; LOG:1523 writes "34a67324…5d7b = FINAL.sha256", meaning the ledger's line in it).
- The first machine's 16,927 rows (`pod-final/out/cores.jsonl`, e29c277c…9d9f, LOG:1363) are in the final ledger
  unchanged (`VERIFIED.txt:5`).

**The anchors.** Heights and file hashes read here offline from the two receipts; block times from LOG.

| What | sha256 the receipt commits to | Stamp submitted (our clock) | Bitcoin block | Block time (UTC) | Source |
|---|---|---|---|---|---|
| the rules, `R6-FULL-PREREG.md` | b23f918c…767f | 22 Nov 18:07 | **977085** | 22 Nov 18:17:27 | LOG:1104–1106 |
| the same receipt, two more attestations | the same | the same | 977089, 977131 | 22 Nov 19:03:33; 23 Nov 02:08:25 | LOG:1085–1088, 1105 |
| the final record, `FINAL.sha256` | e7769301…fb0a | 24 Nov 00:48:07 | **977301** | 24 Nov 01:10:46 | `VERIFIED.txt:8`; LOG:1493–1495 |

What they prove about order, exactly:
- The run began at 18:10:23 UTC on 22 November. The first block is seven minutes later. **The chain shows the rules
  existed by 18:17:27 UTC, when 87 of the 23,409 cores had a result; it shows the rules existed before the other
  23,322 results and before the end. It does not show that they existed before the run began or before the machine
  was created.** That order (stamp 18:07, machine 18:07:42, run 18:10:23) rests on our own clocks and on the pending
  receipt, kept privately as `R6-FULL-PREREG.md.ots.bak`.
- The run ended at 00:45:10 UTC on 24 November (`FINAL/run.log`, last line). **The chain shows the final hash list
  existed by 01:10:46 UTC**, so the ledger was not changed after that: in particular not by the join (03:01–03:24 UTC)
  nor by this opening. It shows nothing about the 25 minutes between.
- A stamp proves that bytes existed by a block's time. It says nothing about who had an idea first or whether the
  content is right.
- The page has shown two more blocks for this box while sealed: 977089 as "further derivations" and 977108 as "a draw
  registration" (`tools/r310-live-records.js:342–343`). Neither is a stamp of this run's rules or results (977089
  also carries a second attestation of the rules). They belong to work that stays sealed (PAGE-SPEC-R6.md).

## 4. The second program and the join

- **The second program** ("emit") is the GPT-6.2-astra track's own C++ counter of the same enumeration: the baseline
  count and the Hall survivors of a core, no tests, no verdict (JOIN:37–41). Its run on all 23,409 cores: one rented
  x86-64 machine, g++ 13.3.0, 23 November, gate passed, 23,409 attempted, 0 errors (LOG:1277–1279); ledger sha256
  f5be47c0…cf0b (JOIN:69).
- **The first join** (07:31 UTC, 23 November, our ledger then at 10,425 rows): 10,409 equal, 16 different, the second
  program having more Hall survivors (LOG:1277–1283). Section 5 has the resolution.
- **The final join** (03:01–03:24 UTC, 24 November, one control-room agent, its own program `join_final.py`, on the
  Mac; JOIN:1–6, 87–103):

| | Cores |
|---|---:|
| equal on all five comparisons | **23,377** |
| different, each by the amount predicted on 23 November | **32** (14,895 records in all) |
| different and not predicted | 0 |
| invalid, missing or repeated rows | 0 |

- Sums over all cores: baseline 101,564,232,221 in both; Hall survivors ours 92,080,292,598, the second program's
  92,080,307,493; difference 14,895 (JOIN:102–103).
- **Version 2** (the pinned source plus the control room's patch, built on the Mac): equal to ours on 32 of 32
  affected cores; equal to version 1 and to ours on 20 controls chosen by hash and on 77 controls where the patch
  acts; 129 cores in all (JOIN:236–237, 275, 286–291).
- 19 planted cases behaved as expected; a slip in the agent's first tally was caught by four of them and fixed, the
  first pass kept (JOIN:160–164, 193).
- **What the join establishes:** on 23,377 cores two programs, written by different model families from one
  definition, wrote the same Hall survivors, record for record; on the other 32 the difference is exactly the
  second program's known omission. **What it does not:** section 1, items 2 to 5.

## 5. Corrections made along the way that concern this branch

1. **The Hall disagreement (07:31–08:01 UTC, 23 November). Ours was right.** The second program applied only the
   first of three side-level conditions of the Hall screen (the conditions of the Lean `Pass`), an omission
   inherited from its pilot version; ours applies all three (HALL:38–41; LOG:1303–1306). Across the catalogue: 32
   affected cores, 14,895 extra records; our tests refute all 14,895 and the direct decider finds all infeasible, so
   no verdict would change even if they were counted (HALL:59–66; LOG:1307–1310). Between 07:31 and 08:01 UTC the
   lane's rule was that nothing about the box may say "all excluded" (LOG:1286). An earlier audit could not have
   caught the omission: none of its 49 cores has such a side (HALL:13; LOG:1314).
2. **The estimate** of time and cost was wrong (DEV:3–11; section 1, item 10).
3. **A receipt read in part.** At 04:38 UTC on 23 November the control room "corrected" the registration's Bitcoin
   time to 02:08 UTC, 23 November; the whole receipt holds three attestations, the earliest at 18:17:27 UTC, 22
   November. The correction was withdrawn (LOG:1084–1091, 1104–1108).
4. **"Timestamped before the pod existed."** Corrected on the page at 03:31 UTC, 24 November, for box 2 and for this
   box's line (LOG:1535–1544). PREREG:3 keeps the old words; it is a stamped file.
5. **A wrong reason in our own audit.** TIGHT:30 said only an R(7)-type premise forbids two equal common rows. Wrong:
   they cannot occur on 40 vertices at all. Found by the Claude track; an erratum was filed; no verdict changed
   (LOG:984–985; `R6-TIGHT-AUDIT-ERRATUM-2026-11-23.md`).
6. **Two statements of the Claude track refuted** by the control room, one of them that a certain test can fire on a
   Hall survivor (it cannot; in the final ledger that reason is 0 everywhere) (LOG:978–983; section 1, item 15).
7. **Two pilots' claims of registration before the outcome were refused**: local clocks only (LOG:448–450, 480).
   A "separate verifier" was the same track's, written three minutes later (LOG:483).
8. **A machine presented as independent was a virtual machine on the same Mac**: refused as independent
   (LOG:961–962).
9. **A join program shipped with the second program was refused** as the tool to cite agreement from: given one
   ledger as both inputs it reported full agreement. Both joins were done with the control room's own code
   (LOG:1117–1119).
10. **Audited files were edited in place** by a track twice; restored, and a rule made: an audited file is never
    overwritten (LOG:574–577, 663–664, 684–686, 845–846).
11. **This package** adds section 1, items 1 (five to nine), 10 a–f, 13 (the 87 cores), 14 and 17.
12. **The page's ledger for this box.** The public corrections ledger holds 23 one-line rows for the sealed box
    (`corpus/r310-live/corrections.json`, `counts.sealed`). By this subagent's reading of LOG, 12 are wholly about
    this branch, 1 is about this branch's records but was found in a reading of other work, and 10 concern the rest
    of the case or the tools around it (PAGE-SPEC-R6.md, section 5). The records tool's line hashes were not
    resolved to check that sorting.
13. **Redacted copies.** Three files proposed for the record are copies with lines reworded (a fourth in the
    optional audit tier): the join's worklog, the first machine's run log and the note of the pull
    (`LEAK-SCAN-R6.txt`, items 1a–1d). The originals are untouched.

## 6. Chen

**As of our last reading: 23 November 2026, 04:02–04:41 UTC, his repository at commit 055ae277 (his committer date
22 November 22:49:53 UTC)** (LOG:1013–1016, 1031; CHENAUD:1–8). Read as text, never run. Nothing after that is known
here; his repository must be read again before the note is posted.

- **The branch is his.** His notes define Case R(6), its split by cross-edges and the class of cores, and on 26
  October 2026 record that a SAT approach timed out on every sampled core and the branch was parked
  (`notes/cases_local.md:148–161` in his clone; CHENAUD:119).
- **His run `r310_ralph`** (21–22 November) has, on this branch: a side-level filter on 21 November (CHENAUD:121);
  and, in its final commit, an idea-scout note from an interrupted round, `review/ideas/r024_R.md`. That note
  targets the same branch with the same two tests in other words (CHENAUD:79–99), and reports: "No common-neighbour
  assignment survived on 16 pilot residues" (r024:47); "There is no production certificate" (r024:5); an inventory
  of "23,037 of 23,409 input classes; 372 are missing, and no Ramsey case is closed" (r024:49); a forecast of 58.6
  core-hours for the block (r024:31); "This proposal doesn't change the status of any Ramsey case" (r024:3); and its
  own bar: "Require 23,409 independently validated inequivalent inputs **and** complete audited negative receipts
  before drawing a conclusion about `f*=3`. No deduction about the rest of R(6)" (r024:43).
- **No claim of his run covers the branch**: no claim ID for it in `ralph/CLAIMS.md`; his final report lists Case
  R(6) as open (`ralph/FINAL_REPORT.md:22, 40`; CHENAUD:111–113).
- His scout's filters assume codegree at most six everywhere, so its negatives are conditional on R(7) being
  excluded; ours use no codegree bound (CHENAUD:86–91). His 16 pilot inputs were not replayed by anyone and cannot
  be matched to our catalogue lines (CHENAUD:15–18).
- **Order, without a claim.** Our rules are in Bitcoin from 18:17:27 UTC on 22 November; his note first appears in a
  commit dated 22:49:53 UTC the same day, by his clock (CHENAUD:124). When it was written inside his run is not
  recorded; nothing suggests either side saw the other's work (CHENAUD:126–129). Both worked on a branch he defined.

**What ours adds, as facts:** a run over all 23,409 cores, where his note has 16 pilot inputs and no production; a
catalogue file with all 23,409 classes, each checked valid and pairwise non-isomorphic, where his inventory has
23,037; rules stamped during the run's first minutes; tests that do not assume R(7); Lean proofs of the conditions
the tests rest on; a second program's enumeration compared on every core.
**What it does not add:** a certificate per record; a verdict from a second program; a check of Table 13; anything on
four to nine cross-edges; a human reader.

**Never to be said:** "first" in any form; "closes R(6)", "excludes R(6)", "R(6) is decided"; "confirms" or
"verifies" his scout (we did not run it); "independent of Chen" (the branch, the split and the Lean library are
his); "independently verified" or "a second program agrees on every core" without section 1, items 2 to 5; anything
that moves the value of R(3,10).

## 7. Credits

From LOG, the audits and the credits table of the 23 November reveal (`reveal-draft/REVEAL-v2-2026-11-23.md:190–198`,
which read the models from the session transcripts). **The model of each R(6) file was not re-read from the
transcripts for this package** (OPEN-QUESTIONS 20).

| Who | Model | What, on this branch |
|---|---|---|
| The operator | — | The target, the tracks, every go and every cost; "Whole branch on a pod" (PREREG:3). |
| The Claude track (Claude Code) | Claude Fable 5.2 at the time of these files, by the 23 November table (from 01:22 UTC, 22 November) | The derivation of the completion conditions (`claude-r6/R6-DERIVATION.md`, 03:13 UTC, 22 November); the written baseline definition both programs implement (`claude-r6/r6sides.c` header; JOIN:316); the first probe (LOG:196–209); the correction of our audit's wrong reason (LOG:984). |
| The Astra track (Codex chats, then the Codex command line) | GPT-6.2-astra | The Hall rule (LOG:217–228); tests (i) and (ii) and the four-core pilot (LOG:457–459, 466–468); the catalogue's reconstruction (`PROVENANCE.md`); the one-page proof, versions 1 to 4; the Lean files `R6ThreeEdge.lean`, `R6Hall.lean` and the five symmetry modules; the prose proofs of the symmetry and of the decider, and the map of the 25 conditions; the second counting program; the reading of Chen's run. |
| cert-machine, the control room (Claude Code) | Claude Fable 5.2 to 23:13 UTC, 22 November; Claude Opus 5.5 after, by the 23 November table; this package: Claude Fable 5.2 | The programs of the run (`enum_own.c`, `tight_own.c`, `direct_own.c`, `alpha_check.c`, `full_run.py`), the gate and the bundle; the registration and both stamps; the two machines; the tally; every audit; the scanner, the patch and the note of the Hall disagreement; both joins; the audit of the reading of Chen's run. |
| Grok | — | Nothing on this branch (it enters the lane in rounds that are not part of this box). |

Cited, not credited: **Zhiyang Chen** (Case R(6), Lemma Mc, Lemma F, the Lean library `R310`, the report and the
run); Goedgebeur and Radziszowski (2013: Table 13); McKay (the (3,8;27) list used as a seed; nauty, with Piperno);
the House of Graphs (the 62 graphs with 73 edges). Tools: gcc 13.3.0; Python 3.12.3; Lean 4.35.0 and Mathlib; nanoda;
con-leche; nauty 2.9.3; OpenTimestamps; on the four-core pilot only, CaDiCaL 3.0.1, lrat-check and cake_lpr (76
records, TIGHT:63).
