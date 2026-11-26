# AUD-2b worklog (gate written by the coordinator, received 11:26 UTC 2026-11-25). Own code only. Times from date -u.
- 11:26 UTC task received: finish claim A on the 362 undecided templates (a_undecided_final.txt) with the per-high row bound
  of A3 added as clauses; controls first (200 decided UNSAT L, Petersen + brute-force small cases, planted positives).
  Budget 3 core-hours, 4 h wall (to 15:26 UTC), one heavy process at nice 10. New file names only (prefix a_sat4 / AUD2b-).
- 11:28-11:30 UTC AUD2b-CONDITIONS.md (row bound re-derived: R1 general, R2 specialisation, R3 clauses), a_sat4.py (a_sat3 +
  row bound; parameterised; ROWS static/lazy/both), a_sat4_controls.py written. Smoke test: Petersen parameters SAT with a
  valid model (alpha 4) and UNSAT at alpha <= 3 in every row mode.
- 11:30-11:41 UTC mode timing on template 9172 (a_sat3: 224 s): both/SMIN 5 UNSAT in 34.8 s with 0 models (2,448 static rows);
  lazy 122.5 s; both/SMIN 3 > 240 s; both/SMIN 6 75.4 s (a_sat4_timing1.out, a_sat4_timing2.out).
- 11:41-13:12 UTC THE MAC SLEPT (no caffeinate on my runs): the SMIN 7 timing used 105 s CPU over 1 h 36 min wall. No
  worklog entries in that window for that reason. From now on every run is wrapped in caffeinate -i. Wall budget left:
  to 15:26 UTC. CPU used in AUD-2b so far about 0.15 core-hours.
- 13:14 UTC CORRECTION of the entry above: the coordinator reports the control room SIGSTOPPED every compute process on this Mac
  from 11:39:11 to 13:13:11 UTC (state kept); the Mac did not sleep. That window is excluded from my budget: wall now to
  17:00 UTC (4 h + 1 h 34 m), core-hours unaffected. Profile of 9172 in mode both/SMIN 5 (a_sat4_profile.out): build 0.6 s,
  solve 37.5 s (UNSAT at the root, no model). Mode chosen for the run: both, SMIN 5 (static rows for |S| >= 5, lazy below).
- 13:14 UTC controls (a_sat4_controls.out, 8.4 s CPU): Petersen parameters SAT with a valid model (alpha 4) and UNSAT at
  alpha <= 3 in all four row modes (static/1, lazy, both/2, both/5); the 70 small cases agree with brute force in all four
  modes (3 positive, each with an independently valid model); planted positives at the real size (3 graphs G0, maximal
  triangle-free, alpha 11, 12, 12, planted by assumptions with AMAX = alpha(G0)): SAT in modes both/5, lazy, static/5, the
  returned graph = G0 (9 of 9). Tightness (a_sat4_tight.out): on the alpha-11 G0, 52 (S, j) pairs attain the row bound with
  equality (s = 3..6), 0 violate it; the planted runs therefore exercise tight row clauses.
- 13:21 UTC agreement (a_sat4_agree.out): 200 L already decided UNSAT by a_sat3 (40 templates + 160 non-templates, seed
  20261125): 200 UNSAT with a_sat4 both/5, all at the root (0 models); templates 4.1 s mean, 41 s max; 317 s CPU.
- 13:21 UTC pass 1 on the 362 undecided templates (a_sat4_pass1_in.txt = a_undecided_final.txt with 9282 moved last), one
  subprocess per L, 300 s wall limit each, caffeinate -i, nice 10 (a_sat4_pass1.out).
- 13:31 UTC pass 1 stopped by me after 22 of 362 (21 UNSAT, 1 TIMEOUT at 300 s: 9518; times 0.9-97 s, a_sat4_pass1.out) to
  test faster encodings: on 9294 (97 s) totalizer 90 s, kmtotalizer 89 s, SMIN 4 > 150 s (a_sat4_timing3.out); mixed views R4
  (AUD2b-CONDITIONS.md R4, written 13:35 before use) from |S| >= 6: 54 s (a_sat4_mix6.out; 9518 still > 150 s).
- 13:41 UTC controls with R4 on (a_sat4_controls_mix.out): Petersen and the 70 brute-force cases with MIX = 1 in all four row
  modes: all agree, positives keep valid models; planted positives at the real size with MIX = 6: 9 of 9 SAT, returned = G0.
- 13:42 UTC boundary test (a_sat4_negplant.out), only the family under test active: rows at AMAX 11 (52 equalities) SAT, at
  AMAX 10 UNSAT; R4 at s = 6 with the bound = largest actual order 7 SAT, with 6 UNSAT. Both encodings cut exactly at the bound.
  Next: the 200-L agreement with R4 on (MIX = 6), then the remaining 341 templates.
- 13:47 UTC agreement with R4 on (a_sat4_agree_mix.out): the same 200 L, 200 UNSAT (templates 97 s total, max 10 s; 270 s CPU).
- 13:47 UTC pass 2: the 341 templates not yet decided (a_sat4_pass2_in.txt; 9518 and 9282 last), ROWS both, SMIN 5, MIX 6, one
  subprocess per L, 200 s wall limit, caffeinate -i, nice 10 (a_sat4_pass2.out). CPU used in AUD-2b before it: about 0.7 core-h.
- 14:13 UTC pass 2 at 241 of 341: all UNSAT so far (a_sat4_pass2.out), no TIMEOUT yet; the two known hard ones (9518, 9282) are last.
- 14:34 UTC pass 2 at 309 of 341: 306 UNSAT, 3 TIMEOUT (16233, 16236, 16237). a_sat4.py edited while pass 2 runs (each L is a
  fresh subprocess, so later L use the edited file): a SOLVER switch (default cadical153, the solver used so far) for a test
  of other pysat solvers on the hard templates; with the default the clause set and the solve calls are unchanged (blocking
  and lazy row clauses are now collected first and then added; the solve call omits an empty assumption list).
- 15:05 UTC pass 2 finished (a_sat4_pass2.out; 3,784 s CPU): 335 UNSAT incl. 9282 (the AUD-2 stuck one), 6 TIMEOUT at 200 s.
  a_tally2.py: 356 of the 362 templates decided UNSAT; open: 9518, 16233, 16236, 16237, 16238, 16826. Claim A: 16,823 of 16,829
  low graphs excluded. CPU used in AUD-2b about 1.7 core-hours. Next: a solver test (kissat404 via pysat) on 16233, then
  pass 3 on the six with the longest limit the budget allows.
- 15:10 UTC kissat404 on 16233 (MIX 6, both/5): TIMEOUT at 300 s (a_sat4_kissat_test.out); not used further.
- 15:10 UTC pass 3: the six open templates (a_sat4_open6.txt), cadical153, both/5, MIX 6 (the configuration the controls and the
  200-L agreement ran with), 650 s wall limit each (a_sat4_pass3.out). CPU used before it about 1.75 core-hours; pass 3 at most
  1.08 core-hours, so the budget holds whatever happens.
- 15:33 UTC pass 3: 9518 TIMEOUT at 650 s (15:21), 16233 TIMEOUT at 650 s (15:32). Four left (16236, 16237, 16238, 16826),
  at most 650 s each; the run ends by about 16:17 UTC. Automorphism groups of the six open templates (nauty countg --a):
  9518: 8, 16233: 4, 16236: 16, 16237: 96, 16238: 12, 16826: 2 (symmetry is not what makes them hard).
- 15:56 UTC pass 3: 16236 TIMEOUT with 1,416 s of wall for a 650 s wall limit: the driver and its child were not running for
  about 766 s of that window (an external stop or a sleep; the Mac moved from battery to AC in the same period). The limit is
  wall time, so 16236 received AT MOST 650 s of CPU, possibly less (the exact amount was not recorded). 16237 started 15:56.
- 16:17 UTC pass 3 finished (a_sat4_pass3.out; 2,686 s CPU for the six): 16237 UNSAT 546 s, 16238 UNSAT 561 s, 16826 UNSAT 164 s;
  9518 and 16233 TIMEOUT at 650 s of CPU each; 16236 TIMEOUT but its CPU was only about 115 s (2,686 - 2,571 for the other
  five), the rest of its window lost to the stop noted at 15:56. a_tally2.py: 359 of 362 decided; open 9518, 16233, 16236.
  CPU used in AUD-2b about 2.5 core-hours. Last run: 16236 again, same configuration, 900 s wall limit (a_sat4_pass4.out).
- 16:30 UTC 16236 UNSAT in 763 s (a_sat4_pass4.out; 747 s CPU). 360 of 362 decided; open 9518, 16233. CPU used in AUD-2b about
  2.71 core-hours. Last attempt within the budget: 16233, same configuration, 880 s limit (a_sat4_pass5.out); then the report.
- 16:35 UTC 16233 UNSAT in 297 s (a_sat4_pass5.out; 294 s CPU). CORRECTION of the 16:17 entry: CaDiCaL is deterministic on the
  same clause list, so 16233's pass-3 TIMEOUT at 650 s of wall means it had < 297 s of CPU there; the external stop fell (at
  least partly) in its window, not only in 16236's. Measured: the three pass-3 timeouts together had about 1,415 s of CPU
  (2,686 - 1,271), split unknown; bounds: 16233 < 297, 16236 <= 650, hence 9518 >= about 450 s. 361 of 362 decided; open: 9518.
  CPU used in AUD-2b about 2.79 core-hours. Last attempt: 9518, same configuration, 690 s limit (a_sat4_pass6.out).
- 16:47 UTC 9518 TIMEOUT at 690 s (a_sat4_pass6.out; 667 s CPU, no stop in its window). Budget reached (about 2.98 core-hours of
  3). Final (AUD2b-tally.out): 361 of the 362 templates UNSAT, all at the root (0 models: neither alpha blocking nor lazy rows
  ever fired); open: 9518 (O??CAAoIaXJOeOx?Ai@M?). Claim A: 16,828 of 16,829 low graphs excluded by my code. AUD2b-SHA256SUMS
  written; hand-back.
