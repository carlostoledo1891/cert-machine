# AUD-2c worklog (gate written by the coordinator; received after the AUD-2b hand-back at 16:47 UTC 2026-11-25). Own code only.
- 16:48 UTC start: decide template 9518 (O??CAAoIaXJOeOx?Ai@M?) with a_sat4.py in the AUD-2b configuration (ROWS both, SMIN 5, MIX 6,
  cadical153): one run with no wall limit; stop at 1 core-hour of CPU if unfinished, then cubes on the three high slots of one
  low. nice -n 19, caffeinate -i, one process. Budget 2 core-hours. New file names (prefix a_sat4c / AUD2c-).
  a_sat4.py unchanged since AUD-2b (sha256 e8e9258c...0e60, pinned in AUD2b-SHA256SUMS).
- 16:48 UTC full run of 9518 started (a_sat4c_full.out), nice 19, caffeinate; a watchdog stops it at 3,600 s of process CPU.
- 16:51 UTC cube design written before any cube run (AUD2c-CONDITIONS.md: low X = 2 and why, soundness of the split, the two
  coverage checks); a_sat4c_cubes.py (cube clauses on a_sat4's own variables), a_sat4c_cover.py (coverage), a_sat4c_run.py
  (driver, CPU-time limit per cube via RLIMIT_CPU) written; none run yet (one process at a time).
- 17:19 UTC 9518 UNSAT (a_sat4c_full.out): at the root (0 models; neither alpha blocking nor lazy rows fired), 1,791.6 s user +
  4.6 s system CPU (a_sat4c_full.time), wall 16:48:58-17:19:14 UTC (a_sat4c_full.start), under the 1 core-hour stop, so no
  cubes were needed: a_sat4c_cubes.py, a_sat4c_cover.py and a_sat4c_run.py were written (16:51) but NOT run.
  AUD2c-tally.out: all 362 templates UNSAT; claim A: 16,829 of 16,829 low graphs excluded by my code (16,467 in AUD-2 by
  a_sat2/a_sat3, 362 in AUD-2b/AUD-2c by a_sat4). a_sat4.py unchanged (sha256 e8e9258c...0e60). CPU used in AUD-2c about
  0.50 core-hours of 2. AUD2c-SHA256SUMS written; hand-back.
