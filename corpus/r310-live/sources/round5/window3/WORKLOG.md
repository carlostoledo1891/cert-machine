# round5/window3 — WORKLOG (a Claude agent)

Started 2026-11-24 23:37:16 UTC (date -u).

## Gate W1 (copied here before any computation)

PASS when at least one more symmetry class of W(40,9,3) is decided COMPLETELY with proofs (both checkers:
tools-bin/lrat-check and tools-bin/cake_lpr/cake_lpr, the latter read by its "s VERIFIED UNSAT" line) and a
checked completeness argument, and the calibration holds ((16,5,2): the Clebsch graph alone in its symmetric
families; (18,5,2): nothing; (20,5,2) and (22,6,3): the known members found). FAIL otherwise, with the exact
state of each class.

Rules kept: write only in this folder; one heavy process at a time, nice -n 10, <= 4 core-hours, <= ~4 GB;
no network, no git writes, no pods.

## Log

- 23:37 UTC. Read REPORT-5/6/7 of round5/c4-claude and classify.py, classify2.py, symsat40.py. Tools present:
  cadical 3.0.1 (--lrat --no-binary), lrat-check, cake_lpr, labelg, geng, pysat. Load average ~5.5 (three other
  heavy jobs on the Mac).
- 23:40–23:50 UTC. Wrote famlib.py (my own CNF for F(n,d,cap; L^k): exact totalizers both directions, tested by
  brute force in test_totalizer.py: 7,216 checks, 0 failures), rows.py (classes of rows of orbit 0), part.py
  (per part: enumerate models with exact blocking clauses, final UNSAT with LRAT, both checkers), classes.py,
  checkg.py (second program for members), rowscount.c + compare_rows.py (second program for the split: brute force
  over labelled rows), complete.py (SAT completeness check with LRAT), autcyc.py (cycle types of automorphisms).
  The witness (four 10-cycles) satisfies my CNF with and without the redundant rows (test_witness.py).
- Row classes: 10^4: 208; 8^5: 87; 4^10: 9; 5^8: 15; 2^20: 2. Calibration families: 1..6 each.
- Calibration (calib-run.out, classes.out): (16,5,2) 8^2, 4^4, 2^8 -> Clebsch alone; 16^1 -> no row at all;
  (18,5,2) 9^2, 6^3, 3^6, 2^9 -> nothing; (20,5,2) 10^2, 5^4, 4^5 -> its one known graph; (22,6,3) 11^2 -> its
  known graph. Every part UNSAT with both checkers. rowscount agrees with rows.py on all 12 calibration families.
  2^10 at (20,5,2) stopped by me (too many labelled models to enumerate one by one; not needed).
- autcyc: Clebsch has 2^8, 4^4, 8^2; the (20,5,2) graph 10^2, 2^10, 4^5, 5^4; of the 25 known (22,6,3) classes only
  one has a fixed-point-free uniform type (11^2) and the pipeline finds it; the 40-vertex graph: 10^4, 5^8, 2^20.
- 23:50 UTC. Running all 208 parts of 10^4 (run-10-4.out); ~1 s per part.
- 23:53 UTC. 10^4 DONE (run-10-4.out, parts-40-9-3-10-4.tsv): 208 parts, all UNSAT, all 208 proofs accepted by
  lrat-check AND cake_lpr; 8 labelled models in 4 parts (27: 1, 118: 2, 201: 1, 204: 4), ONE isomorphism class =
  cap3-canon.g6 (labelg). checkg: 9-regular, 0 triangles, codegrees {1: 30, 2: 300, 3: 270}, alpha 10, 281
  independent 10-sets. Proofs kept gzipped in proofs-40-9-3-10-4/ (91 MB).
- rowscount (C brute force): 3,942,400 labelled rows pass, 208 canonical forms = the 208 parts of rows.py.
- complete.py 40 9 3 10 4: base (plain) + 721 blocking clauses: UNSAT, 1,123,241 proof lines, both checkers;
  negative controls (one part with a member left unblocked) SAT at (16,5,2) 4^4, (22,6,3) 11^2, (40,9,3) 10^4 part 201.
  Calibration completeness checks: all 12 families UNSAT with both checkers (complete.out).
- 23:58 UTC. 10^4 again WITHOUT the redundant rows (--plain, parts-40-9-3-10-4-plain.tsv): 208 UNSAT, both checkers,
  the same 8 labelled models (same set as the run with redundant rows). Independent encoding (c4enc.py: the
  encoding of c4-claude/classify.py with pysat CardEnc, solver glucose4): 208 UNSAT, the same 8 labelled models.
- 00:00 UTC. 8^5 (plain, proofs kept in proofs-40-9-3-8-5-plain/, 36 MB): 87 parts, all UNSAT with 0 models, both
  checkers. rowscount: 10,661,888 labelled rows, 87 forms = rows.py. complete.py 8^5: UNSAT, 540,105 lines, both
  checkers. c4enc (glucose): 87 UNSAT, 0 models. => F(40,9,3; 8^5) is EMPTY.
- Added --lex to part.py (lex-leader constraints for generators of the row stabiliser), for the families whose
  residual symmetry makes one-by-one model enumeration too slow (2^k, 4^10). Testing it on calibration next.
- 00:02 UTC. --lex calibration (all *-plain-lex tsv): (16,5,2) 2^8 now 5 labelled models (528 without lex), 4^4, 8^2:
  Clebsch alone; (18,5,2) all four families empty; (20,5,2) 10^2, 5^4, 4^5 and NOW 2^10: its one graph; (22,6,3)
  11^2: its graph; 2^11: empty (none of the 25 known classes has an automorphism of type 2^11). rowscount and
  complete.py agree/UNSAT for 2^10 and 2^11.
- 00:03 UTC. 4^10 with --plain --lex: part 0 UNSAT (1.6 s, both checkers); part 1 ran 4 min with a 600 MB proof and
  growing: stopped by me (disk). Without proof, part 1 (with redundant rows + lex): UNKNOWN after 300 s. 4^10 needs
  a deeper split; parked while 5^8 (which contains the known graph: a calibration AT n = 40) is run with --lex.
- 00:21 UTC. 5^8 with --plain --lex (parts-40-9-3-5-8-plain-lex.tsv; proofs 178 MB): 15 parts UNSAT, both checkers;
  36 labelled models in parts 7, 8, 13, 14, ONE class = the known graph. So the pipeline FINDS the known member at
  n = 40 (calibration at the target size). rowscount: 52,306,250 labelled rows, 15 forms = rows.py. complete.py 5^8:
  UNSAT (124,381 lines), both checkers.
- 00:23 UTC. Added --minclass (orbit 0 is chosen as an orbit of least row class; every other orbit's row must lie in a
  class >= the part's; per-orbit class gadget famlib.row_class_literals). Calibration with --lex --minclass: (16,5,2)
  4^4, 2^8: Clebsch alone; (20,5,2) 4^5, 5^4, 2^10: its graph; (22,6,3) 11^2: its graph; (18,5,2) 6^3: empty.
  4^10 part 1 with --plain --lex --minclass, no proof: UNSAT in 172 s (was UNKNOWN at 300 s without --minclass).
- 00:27 UTC. Running 4^10 with --plain --lex --minclass (proofs checked, not kept: hashes only).
- 00:34 UTC. 4^10 with --plain --lex --minclass (parts-40-9-3-4-10-plain-lex-minclass.tsv): 9 parts UNSAT, 0 models,
  both checkers (part 1: 2,131,560 proof lines, 341 s; the rest <= 37 s). Gadget tests: test_gadget.py 12,956 checks on
  real members, test_gadget_random.py 26,500 checks on random rows (4^10, 10^4, 5^8): 0 failures.
  rowscount 4^10: 49,618,944 labelled rows, 9 forms = rows.py. complete.py 4^10: UNSAT (163,384 lines), both checkers.
  => F(40,9,3; 4^10) EMPTY (with the REASONED lex-leader and least-class steps).
- 00:35 UTC. Next: 5^8 again with --minclass (the known graph must still be found: calibration of the least-class
  step at n = 40), then 2^20 (contains the known graph) if the budget allows.
- 00:41 UTC (corrected: first written as 00:43, before reading the clock). stabcount.py (brute force over all 24,000 elements of H): |Stab_H(R_c)| = 1, 2, 1, 4 for the parts
  27, 118, 201, 204 of 10^4 = exactly the numbers of labelled models found there (1, 2, 1, 4); 4 x 24,000 = 96,000
  labelled copies of G, c4-claude's count of images. The enumeration missed no copy.
- 00:39 UTC started 2^20 with --plain --lex --minclass (--t 600), disk watchdog at 3 GB.
- Note: the harness refused a REPORT.md file for this agent; the report goes in the final message only.
- 00:49 UTC. 2^20 (--plain --lex --minclass): part 0 UNKNOWN at 600 s with no model (a 1.1 GB proof file, deleted);
  part 1 UNSAT, 375,312 lines, both checkers (9 s). The known graph lies in part 0 (10 of its 20 pairs are
  non-adjacent: least class 0), so 2^20 is UNDECIDED.
- 00:53–00:56 UTC. 10^4 plain rerun with --keep: all 208 CNF and proof sha256 identical to the first plain run
  (parts-40-9-3-10-4-plain.first.tsv): cadical is deterministic here. Proofs kept: proofs-40-9-3-10-4-plain/ (64 MB).
  Deleted the proofs of the 10^4 run WITH redundant rows (91 MB; their sha256 stay in parts-40-9-3-10-4.tsv), exp/
  and the work-*/ folders.
- 00:57 UTC. Closed. W1: PASS (10^4: G alone; 8^5: none; 5^8: G alone; 4^10: none). 2^20 UNDECIDED (part 0).
  About 1 core-hour of the 4 used, one heavy process at a time, all under nice -n 10. Folder 440 MB, mostly kept
  proofs (proofs-40-9-3-5-8-plain-lex 175 MB, complete/ 148 MB, proofs-40-9-3-10-4-plain 64 MB, 8^5 36 MB);
  SHA256SUMS lists every file. Report delivered as the final message (a report file was refused by the harness).

## Gate W2 (copied here before any W2 computation; control room message after W1)

1. 2^20 part 0: the second split, on the row of a second orbit, with the same two completeness checks. Then the cycle
   types with fixed points or mixed lengths that an automorphism of prime order could have (order 2, 3, 5, 7, 13 with
   fixed points): say which are possible at all for a 9-regular graph on 40 vertices (orbit-counting constraints), and
   close those you can.
2. THE REAL QUESTION, the trivial-group case, by the split on one vertex v: its 9 neighbours, its 30 non-neighbours
   with codegree profile (n1, 18-2n1, 12+n1), the traces of the non-neighbours on N(v); enumerate those
   configurations up to Sym(N(v)) (two programs, canonical forms equal), decide each part by SAT with LRAT through both
   checkers, block the members found, two completeness checks. CALIBRATE FIRST: (16,5,2) only Clebsch; (20,5,2) its one
   graph; (22,6,3) ALL 25 known classes (and whether more exist); (23,6,3) at least the 63 seen. Report the size of the
   split at (40,9,3) before deciding all parts, with a time estimate from a sample.
PASS: W(40,9,3) = {G} by the asymmetric split with proofs + completeness checks, calibration intact (report first and
alone). PARTIAL: 2^20 and the prime-order types closed, and the asymmetric split counted and calibrated with a stated
fraction decided. FAIL otherwise. Budget: 4 more core-hours, one heavy process, nice -n 10, <= ~4 GB, kept proofs
<= 1.5 GB in total (delete what is regenerable after recording hashes).
- 01:05–01:14 UTC. split2.py (second split on the row of a second orbit a; group G2 = row-0 stabiliser elements fixing
  a, u = 1; checks: explicit group element for every labelled row, and SAT "original + row 0 + row a not in V_a").
  Calibration of split2 (2^k families, both parts each): (16,5,2) 2^8: Clebsch alone; (20,5,2) 2^10: its graph
  alone; (18,5,2) 2^9 and (22,6,3) 2^11: empty; every sub-part UNSAT with both checkers, every check passes.
  2^20 part 0, a = 19 (the unique orbit with T = {0,1}): |V_a| = 42,240 labelled rows, ONE sub-part; checks: 42,240
  explicit elements, 0 failures; SAT check UNSAT (714,556 lines), both checkers. Solving the sub-part (lex for the
  double stabiliser) from 01:08 UTC; no model after 6 min.
- asym.py written (configs by genbg = program A; own enumeration = program B; solve / batch / complete).
  Counts (genbg): (16,5,2) 1, (18,5,2) 2, (20,5,2) 6, (22,6,3) 32,426, (23,6,3) 44,137 configurations.
- Prime order (fixedF.py with geng, exhaustive): 5^6 1^10 has no admissible fixed subgraph; 7^4 1^12 neither (529,473
  triangle-free graphs on 12 vertices read); 7^5 1^5: one (C5). 5^7 1^5: G[F] = K5, impossible (REASONED).
- 01:29 UTC. 2^20 part 0 sub-part 0 (rows of orbits 0 and 19 fixed, lex for 20 generators of the double stabiliser):
  UNKNOWN at 1,200 s, no model (2.4 GB proof file, deleted). 2^20 stays UNDECIDED.
- 01:29–01:39 UTC. fixedsat.py (G[F] conditions as SAT, LRAT): p=7 f=5 SAT (C5); p=5 f=10, p=7 f=12, p=5 f=15, p=7
  f=19 UNSAT, both checkers; p=5 f=20 UNKNOWN at 300 s; the loop was stopped by me after that: a counting argument
  (REASONED, in the report) kills every p=5 type with fixed points and every p=7 type except 7^5 1^5.
- 01:40–01:47 UTC. permfam.py (one permutation of any cycle type, whole family, LRAT): calibration (16,5,2): Clebsch
  found for 2^6 1^4, 3^4 1^4, 5^3 1 (its types); UNSAT for 2^7 1^2, 3^5 1, 7^2 1^2 (types it lacks), both
  checkers; (20,5,2): its graph found for 2^9 1^2 and 2^8 1^4; UNSAT for 3^6 1^2, 7^2 1^6, 5^3 1^5.
  (40,9,3) 7^5 1^5 whole: UNKNOWN at 200 s. Queue stopped; rerunning 7^5 1^5, 3^13 1, 2^19 1^2 with WLOG units
  (G[F] = C5 with one private 7-cycle each; the fixed point of 3^13 1 sees cycles 0,1,2; the two fixed points of
  2^19 1^2 are adjacent and see pairs 0-3 and 4-7). The WLOG steps are REASONED (report).
- 01:54 UTC. 7^5 1^5 with the WLOG units: UNSAT, 2,451,770 proof lines, both checkers (proof kept in proofsP/).
  With the REASONED lemmas this closes order 7 completely. 3^13 1 with WLOG units: UNKNOWN at 300 s.
- 02:01–02:04 UTC. 2^19 1^2 with WLOG units: UNKNOWN at 300 s. (Three of my own wait loops matched their own command
  line with pgrep and never ended; I killed them by pid at 02:04; the chain then started.)
- 02:04–02:05 UTC. Asymmetric split, calibration: complete-asym (SAT, LRAT, both checkers: original + N(0) = {1..d} +
  non-neighbours sorted by trace + no listed configuration under any relabelling of N(0)) UNSAT at (16,5,2) (1
  configuration), (18,5,2) (2; 45 labelled sorted sequences), (20,5,2) (6; 210). Parts: (16,5,2): Clebsch only;
  (18,5,2): none; (20,5,2): ONE class, the known graph -> W(20,5,2) is exactly that graph (new: earlier only a
  lower bound). Program B (cfgenum.c, doubly lexical matrices + labelg) = program A (genbg) at all three, and at
  (22,6,3): 1,602,471 doubly lexical matrices -> 32,426 canonical forms, the same set as genbg's 32,426.
- 02:05 UTC. (22,6,3): all 32,426 configurations in batches of 400 (one CNF per batch, selectors), running.
- 02:05–02:21 UTC. (22,6,3) batches 0..17,199 (43 batches, one cadical run per model: slow in the strata with many
  models); stopped by me at 02:21 and resumed from 17,200 with incremental model enumeration (--inc: pysat CaDiCaL
  for the models, one external CaDiCaL + LRAT for the final UNSAT): 3 more batches in 9 s.
- 02:25 UTC. The Mac is on BATTERY (24 %, 48 min left) and every heavy process on the machine, mine included, is in
  state T (stopped by a guard). I did not resume anything: I killed my own stopped processes (the batch driver and
  two cadical runs) and stop here. STATE: (22,6,3) configurations 0..18,399 decided (46 batches, all UNSAT with both
  checkers), 18,400..32,425 NOT run; 238 labelled models, 25 classes = exactly the 25 known, no new class among the
  decided 56.7 %. (23,6,3): not run. (40,9,3) split size: not counted.
