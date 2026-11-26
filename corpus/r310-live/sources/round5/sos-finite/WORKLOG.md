# round5/sos-finite — row N11, gate S1 (PRIVATE). Work log, a Claude agent.

Times from `date -u`.

## Gate S1, as given before any work (copied verbatim from the brief, 2026-11-24 23:36 UTC)

PASS when the method closes the twin (7,23) — or anything harder — with a checkable certificate and the controls
intact. FAIL otherwise: the reach table (k = 3, 6, 7, 8 against levels), the time and memory per level, and where it
stops and why (memory, numerical trouble, a feasible point — give the point's nature if you can).

Budget: one heavy process at a time, `nice -n 10`, at most 4 core-hours, at most 6 GB of memory, installs < 4 GB.

## Log

- 23:36 UTC — folder created. Read: round5/PATHS.md (row N11), round5/lit-methods/PATHS.md (PATH 2),
  round1/LEDGER.md (G9 block 17:31, second ladder table 19:02), dl/flagsos-readme.md, dl/flagsos-docs.html.
  Machine: arm64, 8 cores, 16 GB, load about 6 (other jobs running). No Julia on the machine.
- 23:42 UTC — INSTALLED: Julia 1.10.10 (macaarch64 release tarball, sha256 52d3f82c…18be = the published checksum
  file) unpacked to ~/.juliaup/julia-1.10.10 (483 MB; no shell profile touched). Environment env/ (Project.toml +
  Manifest.toml, Manifest sha256 bff02f6c…acb before Combinatorics was added): FlagSOS 0.1.2 at commit
  39caac2e4f751e96602d316a8a5497d1663c41e8 (13 Dec 2024, the head of github.com/DanielBrosch/FlagSOS.jl), Hypatia 0.11.1,
  JuMP 1.32.1, MathOptInterface 1.54.0, GenericLinearAlgebra 0.3.19, ClusteredLowRankSolver 2.2.1 (pulled in by FlagSOS),
  AbstractAlgebra 0.44.13, Arblib 1.4.1, Combinatorics 1.1.0. Depot ~/.julia 404 MB after precompilation.
- 23:50–00:01 — FlagSOS finite-n works, after two of my errors: (1) objective must be written at the top level;
  (2) FlagSOS's induced variable for H is the LABELLED density p(H)|Aut H|/|H|!, so hand-made coefficients were wrong
  (bounds fell with the level); fixed by building the objective with FlagSOS's own product e_k·v^(m−k). After the fix,
  (6,3): level 3 0.0625, level 4 0.0625, level 5 0.085, level 6 0.1000 (= the true minimum 2/20, K_{3,3}); limit
  model 0.25 at levels 3 and 5 (Goodman's 1/4, correct). Controls (5,3) levels 3 and 5: −3e−9, −4e−9 (no proof).
  FlagSOS (18,6) level 6: −8e−9 (open). (18,6) level 7 running since 00:02, slow (dual SOS form in Hypatia).
- 00:05–00:12 — SECOND PROGRAM written: own/SosFin.jl + own/solve.jl (no FlagSOS code; nauty geng for the graph
  lists; coefficients counted by brute force; exact finite-n overlap law). own/selftest.jl: M_sigma(G) computed
  directly from three random triangle-free graphs (n = 9, 10, 11) equals sum_H p(H;G) C^H exactly in 36 of 36 tests.
  Moment-form SDP in Hypatia; certificate = dual rounded to Q = R R^T with R rational (denominator 10^9), exact
  minimum residual b over all graphs H in Rational{BigInt}. Same values as FlagSOS: (6,3) m=3 0.0625, m=4 0.0625,
  m=5 0.0850, m=6 0.1000; exact certificates b > 0 at m = 3, 4, 5.
- 00:15 UTC — FlagSOS (18,6) level 7 KILLED by me after 12 min wall / 26.5 CPU-min still inside Hypatia (FlagSOS
  hands Hypatia the SOS side: one variable per Gram-matrix entry). My moment form of the same level solves in 0.8 s.
  Block sizes of the hierarchy (own count): level 7 sum dim^2 = 8,609 (max 50); level 8 98,068 (max 177, 410 graphs);
  level 9 1,337,120 (max 650, 1,897 graphs); level 10 24,440,479 (max 2,445, 12,172 graphs).
- 00:16–00:21 — own program, (18,6): level 6 OPEN (−5e−10); level 7 CLOSED, all graphs, float 2.5344e−6, exact
  b = 2.5225e−6 > 0; 5-regular level 7 CLOSED b = 5.023e−5; with the rooted caps (all type sizes, degree-1
  multipliers) level 7 the relaxation is INFEASIBLE (dual ray; exact b = 1.8e8). Controls all OPEN as they must be:
  (17,6) levels 6, 7 plain and rooted; (16,6) 5-regular levels 6, 7 (+ rooted) — 11 real 5-regular graphs with
  alpha = 5 exist at 16 (round5/c4-claude/regular-analogues.g6); no 5-regular graph on 17 vertices exists (parity),
  so 16 is the regular control. (23,7) level 7: OPEN in all four variants (plain, 6-regular, rooted, both);
  (22,7) controls OPEN. Level 8 for (23,7) running.
- 00:22–00:36 — (23,7) level 8 (410 graphs, 48 blocks): OPEN in every variant — plain −4.1e−9; 6-regular −6.2e−9;
  rooted caps (degree-1 multipliers, 2,732 kept of 238,063 rows) −6.2e−10; both −1.7e−9; mixed parity (blocks of
  level 7 added) −2.3e−9. Controls (22,7) level 8 plain, reg+root, root: all OPEN. Peak 4.4 GB (row generation).
- PSD-localizing caps added (cap × square of flags, triple products; own/selftest3.jl: 0 mismatches whenever
  m >= t + f0 + 2f, as the formula requires): (18,6) now closes at level 6 (the minimum level for k = 6) — the
  relaxation is infeasible, exact dual ray; control (17,6) level 6 same program OPEN. (23,7) level 7 + loc: OPEN;
  control OPEN.
- 00:43 — THIRD PROGRAM: check/verify_cert.py (Python Fractions, own graph6 decoder, own canonical form, geng for
  the graph list) re-derives every coefficient of the (18,6) level-7 certificate and finds the minimum residual
  EXACTLY equal to the claim, 73752280777963376131/29238300000000000000000000 ≈ 2.5225e−6 > 0.
  sha256 runs/n18_k6_m7/cert.json a40d8b5b…bd92; check/verify_cert.py 3e70f319…a254.
- Symmetry: own/SosSym.jl counts one ordering per t-subset and sums over Aut(sigma) (own/test_sym.jl: exact
  equality with the per-ordering counts at levels 6, 7, 8, every (t,f)); numerical isotypic decomposition for the
  solve only (a closure-capture bug of mine made it degenerate at first; fixed, plus a cross-component check).
  Level 7 reduced sum m_i^2 2,849 (from 8,609); level 8 23,350 (from 98,068). solve_sym.jl (Hypatia native API)
  reproduces (18,6) level 7: exact b = 2.5494e−6 (CLOSED), control (17,6) OPEN.
- 00:48–00:55 — FlagSOS again, with Dualization.jl 0.7.7 (installed; Hypatia then sees the moment side): (18,6)
  level 7 OPTIMAL, lower bound 1.843e−6 > 0 (build 135 s, solve 34 s, 1.2 GB) — positive like mine, but below my
  exact 2.52e−6; tolerance suspected (FlagSOS's labelled normalisation scales the data); rerun with tight tolerances
  running. Calibration where both are cheap, (9,4): level 4 both ≈ 0; level 5 FlagSOS 0.0044806 / mine 0.0044806
  (exact 0.0044806); level 6 0.0067578 / 0.0067591 (exact 0.0067591); control (8,4) level 6 mine OPEN.
  Level 9 sizes (own count, symmetric): 1,897 graphs, 125 blocks, reduced sum m_i^2 = 245,470 (from 1,337,120),
  largest reduced block 133; counting + decomposition 115 s, 2.7 GB. A full dense solve would need ~2 GB per copy of
  G (125k x 1,897), too close to the 6 GB cap; so an active-set (cutting-plane) solve: start with the largest-t
  components, add the components whose reduced matrix at the current point has a negative eigenvalue.
- 00:58 UTC — FlagSOS (18,6) level 7 with tight tolerances (tol_rel_opt 1e−11, tol_feas 1e−11): ALMOST_OPTIMAL,
  lower bound 2.5687e−6 — agrees with my 2.5494e−6 (exact) / 2.5566e−6 (float) to 0.5%. The earlier 1.84e−6 was the
  default tolerance. TWO PROGRAMS AGREE on the (18,6) level-7 value; the bound is certified by two exact checkers.
- 01:00 — (23,7) level 9 active-set run started (guard 5.8 GB). Phantom test written (own/phantom.jl): is the
  level-m profile of a REAL (3,k;n−1)-graph feasible in the relaxation written for n? Data: data/r37_22_reg6.g6
  (the 10 six-regular (3,7;22)-graphs, from testbed/mckay/r37_22.g6, sha256 228d886e…e8c5), data/r36_17.g6.
- 01:07 UTC — (23,7) level 9, iteration 1: 388 of 443 reduced components active (31,897 svec rows), solve 392 s
  wall, Optimal, primal −1.48e−8, dual −2.84e−8 (≈ 0, OPEN on this subset); 51 inactive components violated at the
  point (worst eigenvalue −1.27e−5). Iteration 2 adds the most violated within 60,000 rows. CPU so far ≈ 1.6 h.
- 01:27 UTC — (23,7) level 9, iteration 2: 404 of 443 components (61,869 rows, 6.5e7 nonzeros), solve 1,042 s,
  Optimal, primal −1.23e−8, dual −2.40e−8: the relaxation has a point of independent-7-set density ≈ 0. At that point
  the 39 components left out are PSD except 13 with smallest eigenvalue ≥ −5.4e−9 (solver-noise level; they no longer
  fit the 60,000-row budget). VERDICT LEVEL 9: OPEN (no certificate: objective ≤ 0 at a near-feasible point of the full
  level-9 system). The exact check was stopped by me at 01:33 (futile with a negative objective). 50.5 CPU-min,
  peak 4.0 GB. The full level 9 in one piece (125,875 rows) does not fit 6 GB with a dense interior-point solver.
- Phantom nature at level 8 (own/point.jl, from the saved optimal points): (23,7) plain — edge density 0.26895,
  average degree 5.917, degree variance 0.118, independent 6-sets 349 per 23 vertices, mass on 394 of 410 graphs;
  6-regular — 69 edges, 328 independent 6-sets; rooted caps (degree-1) — average degree 5.900, variance 0.105.
  The variance exceeds (d̄−5)(6−d̄) = 0.08: a "degree" spread that no integer degrees in [5,6] give (integrality rows
  added as option int=1, queued).
- 01:34–01:38 UTC (batch7) — (28,8) level 8 (the lowest level that sees an independent 8-set): plain OPEN
  (float −4.3e−10, exact −4.0e−9); 7-regular OPEN (−6.1e−10); control (27,8) plain OPEN. No 7-regular graph with
  alpha <= 7 is on disk at 26 vertices, none exists at 27 (parity): the 7-regular program has no real control.
  Cap ablation at (18,6) level 6 with PSD localizing: degree caps alone OPEN; caps of one size j alone (nodeg) OPEN for
  each of j = 1, 2, 3, 4, 5; ALL caps with j <= 4 plus the degree caps CLOSED (infeasible, exact ray b = 2.1e5);
  the same set at the control (17,6) OPEN. So at k = 6 the exact small Ramsey numbers, jointly, buy one level.
- 01:38–01:52 UTC (batch8, batch9) — degree INTEGRALITY rows (int=1: (D−j)(D−j−1) >= 0 and (D−lo)(hi−D) >= 0 for
  the outside degree of every labelled vertex, times every flag; D^2 exact at finite n): (18,6) level 6 + caps + int
  OPEN; control OPEN. (23,7) level 7 + caps + int + PSD caps OPEN; level 8 + caps + int OPEN (−2.4e−10); level 8 +
  PSD-localizing caps (419 blocks) OPEN (−9.8e−10, exact −1.7e−8), 3.6 GB peak. Finer ablation at (18,6) level 6:
  caps j <= 1, j <= 2, j <= 3 (each with the degree caps) OPEN; j <= 4 without the degree caps OPEN; j <= 3 without
  OPEN. Closing level 6 needs the degree caps AND the caps up to j = 4 together.
- 01:52 UTC — PHANTOM TEST (own/phantom.jl; m-subsets identified with nauty labelg): the exact level-m profile of
  every real graph tested is FEASIBLE at its own order (smallest block eigenvalue −8e−17 at worst: 7 of 7
  (3,6;17)-graphs at 17, level 6; 2 of 2 six-regular (3,7;22)-graphs at 22, level 8) and INFEASIBLE one order up
  (7 of 7 at 18, level 6 — although level 6 is OPEN at 18 — and level 7; 10 of 10 six-regular (3,7;22)-graphs at 23,
  level 8, eigenvalue −1.4e−4 in the block t=2, f=3). So the open points are NOT real graphs on n−1 vertices seen at
  n; the overlap law does see the order. They are pseudo-densities: at (23,7) level 8, average degree 5.92 with a
  degree variance (0.118) no integer degree sequence in [5,6] has, mass on 394 of the 410 eight-vertex graphs.
- CPU in all ≈ 2.7 core-hours (FlagSOS ≈ 40 min including the killed 26.5 min; level 9 50.5 min; the rest my
  level <= 8 runs and tests). Peak memory 4.4 GB. Disk: ~/.juliaup 483 MB, ~/.julia 404 MB, this folder 27 MB.

## Reach table (COMPUTED; exact b from the certificate checker; "open" = exact b <= 0 at a near-feasible point)

| rung | level 6 | level 7 | level 8 | level 9 | controls |
|---|---|---|---|---|---|
| (6,3) | closed at levels 3–6 (b = 1/16 at level 3; 0.1000 at level 6) | | | | (5,3) open |
| (9,4) | level 4 open; level 5 closed 0.00448; level 6 closed 0.00676 | | | | (8,4) level 6 open |
| (18,6) all graphs | open; CLOSED with degree + j<=4 PSD caps | CLOSED, b = 2.5225e−6 (Julia exact, Python exact, FlagSOS 2.5687e−6) | — | — | (17,6) open at 6, 7, with every cap set |
| (18,6) 5-regular | open | CLOSED b = 5.02e−5 | — | — | (16,6) 5-regular open |
| (23,7) | — | open (plain, 6-reg, caps, caps+reg, PSD caps, int, mix) | open (plain, 6-reg, caps, caps+reg, mix, int, PSD caps) | open (404 of 443 components; rest violated <= 5.4e−9) | (22,7) open at 7, 8 |
| (28,8) | — | — | open (plain, 7-regular) | not run | (27,8) open at 8 |

- 2026-11-25 01:55 UTC — DONE. Verdict line: "S1: FAIL k=3 closes at level 3; k=6 at 7 (6 with PSD caps); k=7 open at 7, 8, 9; k=8 open at 8; all controls open". Report sent as the final message. Nothing committed, nothing sent.
