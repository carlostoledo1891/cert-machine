# R(3,10) rounds 1–2: the ledger (control room, 2026-11-23 ~22:50 UTC)

Participants: Claude A, Claude B (subagents), GPT-6.2 Astra (Codex CLI), Grok (pasted by the operator). Every entry says
how many independent checks stand behind it. "Independent" = code written separately, sharing none.

## Confirmed (at least two independent checks)

| result | checks | where |
|---|---|---|
| A (3,9;33)-graph with minimum degree 5 exists (refutes "Lemma D"); its degree-5 vertex's non-neighbourhood is line 65,887 of r38_27 | 4: Claude A, control room, Grok, Astra | claude-a/lemmaD_counterexample.g6 |
| Triangle-free 40-vertex graphs with 24 (degrees 8⁴9³⁶) and 30 (9-regular, not maximal) independent 10-sets (Chen's best: 44) | 3 / 2: Astra, control room, Grok / Astra, control room | astra/work/capped24.g6, regular30.g6 |
| C35 contains no induced (3,8;27)-graph (no 8 vertices meet all 3,360 independent 8-sets) | 3: Claude B, Claude A, Astra | claude-b/c35tau_check.txt |
| X1: an order-5 automorphism with fixed points is impossible in the 9-regular c* ≤ 5 case | 3: Astra (LRAT), Claude B (LRAT re-check + hand), Claude A (own encodings) | astra/work/five.*, claude-a/critique/ |
| X2: G − N[v] is never C35 minus (d−4) vertices, d = 6 (0 of 7); orbit counts 7/36/276/1,576 | 2: Astra, Claude B — true but removes a set of measure ~0 | claude-b/critique/x2_d6.out |
| X3: rooting the 9-regular case at a max-codegree pair: 42 starting graphs cover all of c* = 6, 5,740 cover c* = 5 | 3: Astra, Claude A, Astra (re-generated) — each job still has 22–28 free vertices | claude-a/critique/x3_frames_*.out |
| X4: c* = 3 (9-regular) reduces to 119 edge-link types, 8 removed by Farkas certificates → 111 | 3: Astra, Claude B (3 certificates re-proved in integers), Claude A (catalogue); + 3 partial exclusions inside the smallest type (Astra) | claude-b/critique/x4check.out |
| Chen's 524 near-regular distributions (per e: 19 18 17 16 80 70 61 52 44 37 30 24 19 14 10 7 4 2); 709 without "n6 ≥ 1 ⇒ e ≥ 166" | 2: control room, Claude A (Grok's 1,342 omitted parity) | — |
| 21,798 maximal (3,8;27)-graphs, all with c* ∈ {4, 5} | 3: Claude B, Grok, Astra | — |
| c* = 1 impossible (every nonedge with exactly one common neighbour forces δΔ = 39); uses only maximality, n = 40, Δ ≤ 9 | 2: Astra, Claude B (by hand) | claude-b/verify-r2/claims_by_hand.txt |
| c* = 2 excluded for all 524 distributions (only 8³²9⁸ and 8³⁰9¹⁰ pass the inequality, then S_v ≥ 72 > 69) — conditional on Chen's unchecked floors 97/88 | 2: Astra, Claude B | claude-b/verify-r2/profiles524.out |
| Five distributions removed by integer rays → 519 of 524 left, 355 with n6 ≤ 2 — same floor condition | 2: Astra, Claude B (own rows; three also by hand) | claude-b/verify-r2/fivecheck.out |
| The max-codegree-pair cover for ALL degree distributions: 2 ≤ c ≤ d + f − 11 ≤ 7, link degrees 1..c, matching ≥ d + f − c − 9; boards c = 7: 3, c = 6: 17, c = 5: 159, c = 4: 1,546 (4,457 in all per Astra) | 2: Astra (two generators), Claude B (own generator, c = 4..7) | claude-b/verify-r2/boards.out |

## New, single-source so far (to be checked independently next)

- Astra round 2: a trace-LP screen with 345 integer Farkas certificates (Astra's own checker). [Its c* = 1, c* = 2,
  five-ray and cover claims were CONFIRMED by Claude B at ~23:10 UTC — moved to the table above.]
- Astra critique: a P66 counterexample needs a 33-vertex side with at most 124 edges (125 unrestricted) — a cheap gate
  for the stage-1 survivors; line 65,887 also fails an edge-budget test (LRAT, 77,385 additions).

## Measured cost (the only real timing so far)

- P66 stage 1: 0.16 s per base; full sweep of 477,142 running on the Mac (6 processes), ETA ~02:40 UTC; ~1 in 3,000 pass.
- Astra's pilot, 8 full 40-vertex root jobs, 30 CPU-s cap each: control 0 of 8 finished; with the trace-LP treatment 1 of 8
  (0.436 s vs > 30 s, ≥ 68× on that root). Its own pre-declared gate: **renting is not justified with the current solver**;
  the completion time per board is unknown (thousands of boards: c* = 3: 2,583; c* = 4: 1,546; c* = 5: 159).
- Claude A's pair-lemma cost map at 40 vertices: (6,·) ~1 s per base, (7,7) ~3 s, (7,8)/(7,9) up to 56 s, (8,·) > 90 s.

## Dead ends (refuted; nobody should pay for them again)

Codegree rigidity (A3); reduction to 9-regular by switches (B5); C35-minus-vertices lemmas as a saving (B4); near-miss
scores as a guide (A5 as phrased); c* ≥ 5 (G1); free order-5 quotient as stated (G2: partial orbits); forbidden 27-vertex
cores as stated (G3); independent-set ILP without constraints (G4); codegree-regular quotients (G5); a cheaper
"forest at a max pair" root rule (Astra: fails on 656 MTF (3,8;27), five regular (3,7;22), C35); Grok's round-2 plan
(no new tool; its "30-minute pilot" was not a run).

## Next (no pods; each measured before any spend)

1. P66: when the sweep ends, apply Astra's 124-edge gate, then stage 2 on the survivors (~1 s each), all four (6,·)
   types; a second, independent encoding for every survivor; LRAT for every UNSAT. If all close: P66 is a theorem and
   n6 ≤ 2 (166 of 524 distributions gone).
2. Check Astra's round-2 single-source claims independently (c* = 1, c* = 2, the five rays, the 4,457-board cover).
3. A real timing pilot: Astra's treatment solver on ~10 boards for up to 15 minutes each (≤ 2.5 core-hours) to get the
   distribution of completion times — this is the number that decides renting.
4. X4: bounded pilots on the 16 surviving eight-matching refinements.
5. Claude A's pair caps L2 for (6,·), (7,7) over all 477,142 bases (Mac, ~130–400 CPU-hours) — after 1.

## Added 2026-11-24 02:53 UTC — P66 after stage 2 (control room)

- Stage 1 (Mac, glue alone): 118 of 477,142 bases SAT, 477,024 UNSAT, 0 timeouts. ONE program, no proofs.
- Edge gate on the 118: 30 pass at cap 125 (13 at 124). Two encodings, 193 LRAT proofs, two checkers.
- Stage 2 on the 30, type (6,6): UNSAT 30 of 30 by glue (dmin 0, 5), by pair66 with symmetry breaking, and by pair66
  without it (every CNF audited); 60 LRAT proofs accepted by lrat-check and cake_lpr. control/p66-stage2/RESULT.txt.
- Types (6,7), (6,8), (6,9): single-source (glue), and the 30 are not their right input. Not claimed.
- P66 is NOT yet a theorem: the second, independent stage-1 sweep is owed. So "n6 ≤ 2, 166 of 524 distributions gone"
  stays conditional on it (and on the reduction's prose and McKay's catalogue).

## Added 2026-11-24 03:13 UTC — the trace-LP screen has a second program (control room)

- Astra round 3, a fresh session with its own code (round3/astra-screen-check/work/REPORT.md, 03:00–03:12 UTC): 345 of
  345 rejections reproduced in their recorded mode, 200 of 200 sampled passes reproduced (510 exact rational points),
  the first session's 345 certificates accepted against the second's own matrix, 855 trace lists equal, 0
  disagreements; two planted controls as predicted. 14 rejections hold at degree floor four, 331 only for 9-regular
  completions.
- Limits: same model family as the first; it resolved five conventions by reading the first program (logged in its
  AMBIGUITIES.md and RESOLUTION.md), so the two share a specification; the screen assumes the max-codegree cover is
  exhaustive. A Claude re-check of a sample is still owed before any of the 345 is cited.

## Added 2026-11-24 03:24 UTC — Grok, round 3 (control room)

- Dead end as answered: its "splitting rule" run omitted the independence clauses (every instance trivially SAT), sent
  no script, and its second table contradicts itself (round3/grok/ANSWER-1-ledger.md). One corrected request written
  (round3/grok/PROMPT-2.md: part A only, all 245,157 clauses, the script pasted); if that is not a real run either,
  Grok leaves this lane's computation.

## Added 2026-11-24 09:26 UTC — gate G3 (control room)

- FAIL, 0 of 10 certified within 2 CPU-hours (round2/astra/REPORT-3.md; gate round3/GATE.md, stamped before the run).
  Measured cost: 15.98 core-hours for no closed board; open cubes per board 175 to 1,104. Nothing is rented.
- Dead end as built: trace-partition cubes with lazy independent-10 cuts and Hall constraints. Not shown dead: proof
  reuse across relabelled siblings (Astra's proposal, untested).

## Added 2026-11-24 10:23 UTC — the literature scout for round 4 (round4/scout/SCOUT.md v2; papers in round4/scout/dl/)

- THE EDGE-NUMBER ROUTE IS DEAD, by exact published values: at n = 40 the counting inequality needs e(3,9,30) ≥ 100
  and e(3,9,31) ≥ 97; the true values are 86 and 95 (Goedgebeur–Radziszowski 2013, Table 4). It gives e(3,10,40) ≥ 159
  and no more. (The thresholds are the scout's own arithmetic, enumerated; single-source.)
- How 41 was proved (Angeltveit, EJC 32(4) 2025 #P4.30, alone): not by e(3,k,n) but by a pruned census and gluing —
  41 is odd, so some vertex has degree ≤ 8 and a small complement family (1,554,928,360 + 14,395 + 5 graphs); about 3
  CPU-years. Why not 40, in his words: a (3,10;40)-graph "might be regular of degree 9 and then the dual
  neighbourhood of any vertex will be in R(3, 9, 30, e = 99). This contains many orders of magnitude more graphs".
- So the whole difficulty of 40 sits in the (3,9;30)-graphs with 88 to 99 edges under a degree-9 vertex; the 99-edge
  layer is exactly the 9-regular case. Published counts stop at 87 edges (1,800 and 147,335). Degree-8 roots are
  cheap (35,714 graphs).
- Dead by printed numbers: flag algebras (R(3,10) ≤ 54 from Lidický–Pfender's table); direct SAT+CAS above 28 vertices
  (R(3,9) went through a 27-vertex instance: 128 CPUs, 26 hours, 289 GiB of proofs); linear edge invariants.
- Two computations the scout thinks worth one bounded try each: (1) MEASURE the size of the degree-9 window before
  anything enumerates it (calibrate on 86/87 edges, 88 exactly, 89–99 by random rejection); expected answer: dead, with
  a number. (2) the 9-regular case by two-sided gluing with an exact-degree hash join instead of SAT, tried on one
  c = 5 root. Note (control room): at c = 6 the shared part is a (3,8;26)-graph with 73–81 edges — the lane's R(6)
  three-edge run was this route at 75 edges, 23,409 cores, 961 CPU-hours.
- Nothing found, refereed or not, claiming R(3,10) = 40 or a (3,10;40)-graph (survey revision of 24 April 2026: 40–41).

## Added 2026-11-24 10:52 UTC — gate G4b ruled, and the regular case priced (control room)

- G4b: Astra's report says PASS; BY THE GATE'S OWN TERMS IT IS A FAIL (the control room's ruling). The gate asked for
  a route that would decide all remaining cases, or name exactly what it leaves, with a finite projected total under
  5,000 core-hours. The report's own first line: "No complete argument for all graphs on 40 vertices has a defensible
  price here"; what its route leaves is every graph that avoids its 563 hosts, with no argument forcing one.
- BY-PRODUCT, single-source, to be audited before it is cited: a triangle-free graph with independence number ≤ 9
  that contains an induced 35-vertex subgraph with an automorphism of seven 5-orbits, at least six independent, has
  at most 37 vertices (563 classes → 88 → 6 → 0 at orders 35–38; 657 LRAT certificates, both checkers; 89.5 CPU-s).
  A wider screen (six independent orbits on 30 vertices) excludes 2,008 of 2,180 hosts; 172 named remain. This
  generalises Theorem C35's kind of statement; it does not shrink the open cases.
- CONFIRMED BY A SECOND COMPUTATION: the edge thresholds 100 (order 30) and 97 (order 31) against exact minima 86
  and 95 — Astra's integer sweep (6,181 distributions) agrees with the scout's. The edge-number route is dead.
- THE 9-REGULAR CASE PRICED BY PUBLISHED COUNTS (control room; Goedgebeur–Radziszowski 2013, Table 13; per-core cost
  from our own R(6) three-edge run: 961 CPU-hours for 23,409 cores = 148 CPU-s a core). For a non-adjacent pair with c
  common neighbours and f cross-edges the shared part is a (3,8;20+c)-graph with 9c + 18 + f edges:
    c = 7: 27 vertices, 85 edges: 4 graphs — done (R(7)).
    c = 6: 26 vertices, 75..81 edges: 75: 23,409 (done) · 76: 216,151 (≈ 8,900 CPU-h) · 77: 1,526,296
           (≈ 63,000 CPU-h) · 78–81: counts unpublished, each several times the last.
    c = 5: 25 vertices, 65..79 edges: 65: 396 · 66: 21,493 · 67: 613,285 · 68: 11,946,369 · 69–79 unpublished.
    c = 4: 24 vertices, 56..79 edges: 56: 51 · 57: 3,419 · 58: 129,347 · 59: 3,288,695 · 60: 64,233,886 · 61+ unpublished.
    c = 3: 23 vertices, 49..81 edges: more than 10,691,100 already at ≤ 52 edges.
  So finishing even c = 6 by this method costs more than 70,000 CPU-hours for the two next layers alone, and c ≤ 5
  has no finite price: ENUMERATING THE SHARED PART IS DEAD for the regular case at laptop or small-pod scale. The
  dual (fix the small part, SAT the rest) is what gate G3 measured: no board closed. What is left is a structural
  argument for the regular case; none is known.

## Added 2026-11-24 11:51 UTC — gate G5 (line B, second attempt): FAIL, with a reduction (control room)

- G5: FAIL as reported (round4/astra-workarounds/REPORT-2.md). Single-source until the audit lands
  (round4/audit-cover7/, a Claude agent, own code):
  1. THE c* = 3 STRATUM OF THE 9-REGULAR CASE IS COVERED BY SEVEN ROOTED CONFIGURATIONS: every candidate contains an
     induced K_{3,3} minus an edge whose six vertices can be chosen with one of seven adjacency profiles (integer
     Farkas certificate, right side −46,080; columns regenerated by a second program of the same session; the 16- and
     22-vertex regular codegree-three graphs pass the controls). All seven are open: 1,817 branches after fixing two
     further neighbourhoods; no completion method closed one.
  2. At least 60 codegree-three pairs have at most 16 cross-edges; the shared-core window narrows to 52–61 edges; the
     52-edge layer alone holds 10,326,716 graphs — no cheap layer.
  3. Lower bounds on cross-edges f at c = 1, 2, 3 are 12, 9, 7; a codegree-five pair needs f ≥ 4 in every regular
     stratum — so rooting at a lower-codegree pair reaches no published cheap layer.
- What broke: the global counts have an integer solution with every codegree-three pair at exactly 16 cross-edges;
  it passes the spectral and Schur-product checks tried. A frozen assignment shows what degree counts miss: three
  bipartite blocks each realizable, 0 of 2,065,024 combinations triangle-free (LRAT, both checkers).
- NEXT (started 11:51 UTC, gate G6 stamped, round4/FOLLOWUP-B3.md): close the seven profiles by compatibility across
  triples of cells; PASS(7) would exclude c* = 3 for 9-regular graphs.

## Added 2026-11-24 12:08 UTC — the seven-configuration cover is CONFIRMED by a second family (control room)

- round4/audit-cover7/ (a Claude agent, own code, written from the text before opening any program of the claimant;
  verdict line "COVER7: CONFIRMED"). The lemma, as the auditor states it: G with 40 vertices, every degree 9, no
  triangle, no independent 10-set, at most 3 common neighbours for every non-adjacent pair, contains six vertices
  inducing K_{3,3} minus one edge whose profile (i, j, t) is one of (1,1,2), (1,1,3), (1,2,2), (1,2,3), (2,2,1),
  (2,2,2), (2,2,3). The fifteen multipliers give nonnegative coefficients on every column of the auditor's regenerated
  system (generator checked complete by a mass formula), right side −46,080; the certificate fails as soon as any one
  of the seven is admitted; 28 of 30 one-step alterations refused on a negative column, the other two as predicted.
- Limits the audit adds: the claimant's "second program" does not read the certificate (signs only); the controls
  test the identities, not the sign (no 40-vertex control exists); the fifteen identities are a hand derivation plus
  numerical tests on 145 graphs, nothing formalised; "cover" means AT LEAST ONE occurrence — four other profiles are
  locally consistent and may occur beside it, so closing a profile must hold in every graph with the hypotheses,
  without assuming the other profiles absent; "no independent 10-set" carries weight (through the matchings).
- Two checks now stand behind the cover (Astra; a Claude agent). All seven profiles are open.

## Added 2026-11-24 16:35 UTC — gate G4a (line A, one whole board): FAIL, stopped by the control room (control room)

- Stopped at 16:31:59 UTC (exit 143, the control room's kill; no closing report from the session), at 50,056.83
  charged CPU-seconds (13.9 of 20 core-hours) on ONE board (job 10): 303 leaves certified, 242 open, the open count
  flat since 13:40 UTC (229 → 246 → 242) and identical at the 15:35 and 16:05 checkpoints
  (round2/astra/work/solver4/WORKLOG.md). The gate's FAIL condition was "the budget ends with no board closed"; the
  budget had 6.1 core-hours left when the control room stopped it, on the operator's word of about 16:25 UTC ("Brute
  force is not an option"). Read as FAIL, with that deviation said.
- What it prices: one board is not closed in 13.9 CPU-hours; 4,443 boards at that rate is more than 60,000 CPU-hours.
  COMPLETING BOARDS BY SAT IS DEAD at this lane's scale, with or without proof reuse across relabelled siblings
  (451 image receipts did not close the board). Single-source numbers (Astra's own log); nothing here is cited as a
  result about graphs.
- The path ledger from here on: round5/PATHS.md.

## Added 2026-11-24 16:54 UTC — ALL FOUR ASTRA SESSIONS ENDED BY THE USAGE LIMIT at 16:52 UTC (control room)

- The Codex CLI's message, in every log: "You've hit your usage limit … try again at Nov 25th, 2026 1:53 PM" (the Mac's
  local time, UTC−3: about 16:53 UTC on 25 Nov). No session wrote a final report (REPORT-3.md and the three REPORT.md
  are empty, exit 1). Nothing below is a result until re-derived.
- G6 (line B, third attempt): FAIL by interruption. At the stop: 655 of 3,631 assignments refuted with both checkers,
  0 of 7 profiles closed, unchanged since about 14:30 UTC; the session had moved from splitting to LP relaxations with
  Gram cuts (work/g6/). The session can be resumed when the limit resets.
- Line C (c* = 4), one hour in, single-source (round4/astra-c4/work/PROOFS.md, WORKLOG.md): a routing into 13 B + 56 P
  = 69 six-row cases, 670 assignments; zero slack at an induced K_{3,4} (all seven neighbourhoods forced); nine of the
  69 cases with elementary certificates; a further family of 2,215 configurations with one common integer ray.
- Line D (non-regular), one hour in, single-source (round4/astra-nonregular/work/CHECKPOINT-A.md): with floors
  (120, 108, 97, 87) — the first two HIGHER than Chen's unchecked 118 and 104 — 140 of 519 distributions excluded,
  68 of the 355 with n6 ≤ 2, without P66. Would pass G8 if the floors and the certificates survive an audit.
- Line E (the ladder), 18 minutes in, single-source (round5/astra-reach/work/REACH.md): reach at k = 6..10 of the
  one-level edge recursion 19, 24, 30, 36, 43; a degree potential 19, 25, 31, 39, 46; an independent-set profile
  19, 25, 31, 37, 45; several richer local-counting programs "all attain the baseline row".
- Taken over by Claude agents at about 16:54 UTC (own folders, own code, re-derive first): round5/audit-nonregular/ (rules
  G8), round5/c4-claude/ (rules G7), round5/reach-claude/ (rules G9). Still running from 16:35: round5/miner/,
  round5/lit-methods/, round5/lit-structure/. The P66 sweep resumed at 16:52 UTC.

## Added 2026-11-24 17:31 UTC — gate G9 (line E, the ladder of methods): FAIL, as reported (control room)

- round5/astra-reach/REPORT-2.md (Astra, 31 minutes after the resume; single-source — a Claude agent builds a second
  table in round5/reach-claude/). Fourteen methods measured at k = 6..10. At k = 10 every one that needs no catalogue
  of the level below stops at 43 or worse (the literature's 2013 bound is 42, with a census): one-level edge counting,
  all residual-edge levels, residual independence polynomials, integer profiles, a degree potential (46),
  independent-set counts with domination (45), finite spectral moments (45; 43 with the edge recursion), a rich-root
  split, three trace-subset systems. The only method that reaches the TRUE values at k = 6..9 (18, 23, 28, 36) is the
  deletion test, which needs the complete list of graphs one vertex below: at k = 10 that is at least 43,225,241
  classes short of the published partial census (and the true shortage is unknown).
- WHY THEY STOP (its phantom): take ONE real triangle-free graph H on 30 vertices with 99 edges and give each of 40
  formal vertices a copy of H as its non-neighbourhood; every statistic rooted at an independent j-set is then
  consistent at every level tested, with 4,720 formal independent 9-sets and no 10-set. What all these systems forget
  is whether the copies seen from two different vertices AGREE on their shared vertices. So single-root counting at
  any depth is dead; the next substantive input is agreement between labelled neighbourhoods (pairs) — the family
  lines B and C work in, and what row N10 couples to SAT.
- Gains worth keeping (to be re-derived): integrality alone closes (6,18) (5·i_5 = 612 is not divisible by 5);
  a homomorphism lemma (REASONED): every homomorphism from a (3,10;40)-graph to a triangle-free graph is injective
  (two vertices in one fibre give n ≤ 10 + R(3,8) = 38), so no blow-up of a smaller template is a candidate;
  a "coverage price": in a regular candidate the nine neighbours of a root supply nine independent 8-sets of H covering
  each x exactly 9 − d_H(x) times, and on its phantom H an exact dual price shows no such cover exists.
- NOTE on a control file: round1/claude-b/critique/exoo39.g6 has 172 edges (degrees 8⁷9³², checked by the control
  room). The class identified as Exoo's in control-room-checks/C35-REVIEW-CHECK.md has 167 edges (class 112 of
  claude-r1/out/swap1_classes.g6). Both are valid 39-vertex controls; the file's NAME is not a claim that it is
  Exoo's graph. Say "a 39-vertex graph with no independent 10-set (172 edges)" for that file.

## Added 2026-11-24 17:33 UTC — gate G7 (line C, the regular case at c* = 4): PASS by its own terms, single-source (control room)

- round4/astra-c4/REPORT-2.md (Astra; ended 17:32:47 UTC). The gate asked for a cover, its price and one closed
  configuration, with controls. Reported: every 9-regular candidate with c* = 4 contains one of 69 six-row profiles
  (13 at an induced K_{3,3}, 56 at a codegree-4 pair), 670 assignments (two enumerators of the SAME session agree,
  list sha256 9efe5f05…4244); NINE whole profiles closed by short arguments (a trace cell too small ×4; an independent
  ten-set ×4; eighteen vertices anticomplete to four independent anchors against R(3,6) = 18 ×1); 177 of 670
  assignments refuted, 60 profiles and 493 assignments OPEN; one level deeper 1,828,238 of 2,127,881 open. A bound
  18 ≤ L ≤ 29 at every induced K_{3,4}. Controls: 228 planted roots accepted (102 on the 172-edge 39-vertex graph).
  434 CPU-seconds in all.
- WHAT IT IS AND IS NOT: the first gate of the attack on 40 to pass, and the bar was low on purpose (one closed).
  The stratum is NOT excluded and not close: 87% of the profiles and 74% of the assignments are open. What is new is the
  KIND of closure — arguments a person can read, using exact small Ramsey numbers, no search.
- NOT CITED until round5/c4-claude (a Claude agent, own derivation first) reports on it.
- Counts one and two strata up (single-source): c* = 5: 1,839 + 118 profiles before exclusion, K_{4,5} impossible;
  c* = 6: 12,854 + 628, K_{3,6} impossible.
- NEXT, started in the same turn: round5/RESUME-C2.md, gate G11 (stamped, round5/GATE-5d.sha256): one systematic tool
  from the three kinds of argument — Ramsey pressure with the equality cases read off the complete catalogues — run
  over all 493 open assignments, then c* = 5 and 6; PASS = at least 30 of the 60 open profiles closed entirely.

## Added 2026-11-24 17:46 UTC — G7 CONFIRMED by a second derivation (control room)

- round5/c4-claude/REPORT.md, AUDIT.md (a Claude agent; PROOFS.md read as text, own enumerators and hand checks before
  opening any output of the claimant, its programs never opened; verdict line "G7: PASS"). CONFIRMED: 69 profiles
  (13 + 56; 56 also by Burnside by hand), 670 words, the canonical list byte-identical; the same 177 exclusions and
  the same nine closed cases, an explicit certificate rebuilt for each of the 177 (144 ten-sets, 22 words against
  R(3,6) = 18, 11 integer rows); at every induced K_{3,4}: rigidity, L ≥ 18 with independent doubles, L ≤ 29 always
  (64 tournaments, 32 by a forced independent 7-set, 32 by LRAT accepted by both checkers). No error found.
- The statement that now stands on two derivations: G with 40 vertices, every degree 9, no triangle, no independent
  10-set, at most 4 common neighbours for every non-adjacent pair with 4 attained, contains one of 60 six-row cases
  with one of 493 words. Premises: R(3,6) = 18 as published; two LRAT checkers for the upper bound on L.
- Which hypothesis each rule uses (the auditor's separation): the triple-vertex rule and the K_{3,4} rigidity use
  n = 40, regularity and the codegree cap, not α; the ten-set rule uses α and regularity; the R(3,6) rule uses n,
  regularity, α and R(3,6) = 18; L ≤ 29 needs the cap on a singleton–anchor pair (without it a solution exists).
- STILL SINGLE-SOURCE (not examined by the auditor): the deeper price (1,828,238 of 2,127,881), the sector census
  (201,873 / 14,868 / 14,715), the claimant's checker tallies, its c* = 5 and 6 counts.
- The auditor's negative findings, all COMPUTED: the elementary rules are EXHAUSTED at this level (no further
  independent set has a Ramsey-large anticomplete set; no further vertex lacks a row); 21 of the 51 open P patterns
  occur in graphs that exist at other parameters, so no argument reading only the pattern removes them; SAT per
  placement is not a seconds-instance (2 of 2 undecided in 60 s; the shifted control at 35 vertices undecided in
  90 s). Controls: all 357 regular analogues extracted by its own code (the scout's count reproduced; 309 with cap 4),
  37,468 maximum independent sets, 1,524,776 Hall pairs, 0 failures.
- NEXT, started in the same turn (the same agent, gate G12 in the message sent to it): the counting certificate
  across roots for c* = 4 — exact identities tying the 60 cases over all codegree-4 pairs, an exact LP at (40, 9);
  PASS = infeasible, or a certified cover of at most 20 cases; FAIL = the feasible point exhibited. Report
  round5/c4-claude/REPORT-2.md.

## Added 2026-11-24 17:48 UTC — the structure scout's four statements, tested by a second program (control room)

- round5/structure-tests/ (a Claude agent; programs written from the definitions; its report came as a message at
  17:47 UTC and is NOT on disk as REPORT.md — the outputs are in item1/ … item4/ and WORKLOG.md). Verdict line:
  "STRUCTURE: 1 statements survive".
- N13, THE TAIL LAW — REPRODUCED, every cell equal to the scout's: in every complete top catalogue ((3,5;13), all 7
  (3,6;17), all 191 (3,7;22), all 477,142 (3,8;27), the (3,9;35)-graph) and in 245 graphs on 39 vertices the profile of
  largest outside graphs ends 8, 5, 2, 0; one level below the top it fails in 194 of 1,118,436 and 28 of 2,576. The
  first rung (an independent 8-set with an edge outside) is a theorem for n ≥ 37, derivation checked line by line; it
  rests on the published computation R(K3, K10 − e) = 37. NEW and proved (REASONED): the rungs as traces on a maximum
  independent set (Lemma A), and Lemma B — with the edge rung, n > 2k − 2 + (k − 2)²/2 forces the 5-cycle rung; that
  applies at (5,13) only and at k = 10 would need n ≥ 51 (the strongest integer form of the count: n ≥ 45). So THE
  5-CYCLE RUNG AT 40 IS NOT PROVABLE BY COUNTING, and the same count cannot separate 21 from 22 at k = 7. In real
  graphs some edge rungs do not extend (2,243 of 17,098 on the 167-edge 39-vertex graph), so an argument would have to
  choose the rung. "α = degree" alone does not force the rung: 20 of Sidorenko's 28 small circulants have the edge
  rung and no 5-cycle rung, S_{32,5} among them.
- What a proved tail would buy (REASONED + measured on real roots): a root with 14 fixed and 26 free vertices that
  fixes 91 pairs — a pair board at codegree 6 fixes 134 — so it is LOOSER than a dead board; discharging from the
  8-vertex core onto the middle layer has demand 48–52 against capacity 78, and real graphs sit inside that slack.
  Its only advantage: three roots instead of 4,443, covering every degree distribution. One measurement decides it
  (started 17:48 UTC, the same agent): tail roots against a pair board on the twin (8, 28); line "N13: KEEP / CLOSE".
- N15, PENTAGON INTEGRALITY — DEAD. The identities are true (proved; 0 failures on 359 regular catalogue graphs and
  2,833 others), but line B's integer solution (240 pairs (2,15), 120 pairs (2,16), 240 pairs (3,16), 4,512
  pentagons) passes all three, and the global I1 and the mod-5 row already lie in the row space of that session's
  identities (45 rows, rank 33). Only the per-vertex form is new, and it removes nothing here.
- N14, ONE STRATUM'S CORES — DEAD as a filter. Calibration one level down, exhaustive: 10,910 (3,6;15)-graphs with 30
  edges; degree and codegree filters keep 0.82 of them in the lowest stratum; the cut comes only from the pair tests
  on the attachment sets (×30) and the final independence test (×29), i.e. from the gluing itself; survivors = the
  real cores exactly (10 and 9). At 40: about 10^14 cores pass the filters applicable to a core alone (REASONED, three
  orders either way), above the 10^11 line. What the measurement shows: THE PAIR TESTS are where the 1992 method got
  its power — the same conclusion as the ladder's (agreement between two roots).

## Added 2026-11-24 17:59 UTC — gate G12 (counting across roots at c* = 4): FAIL, with the point (control room)

- round5/c4-claude/REPORT-2.md (a Claude agent). The case-level system (300 integer variables, 35 rows: pair counts by
  codegree, crossings of 4-cycle diagonals with parities, the K_{3,3}/K_{3,4} facts, the pentagon row, vertex types)
  is FEASIBLE IN INTEGERS at (40, 9, cap 4) and forces nothing: each of the 60 open cases can be the only case
  present and each can be absent. Every identity holds on all 357 regular analogues (309 with cap 4), 0 failures.
- A point, exactly: every vertex with 1, 20, 5, 4 non-neighbours of codegree 1, 2, 3, 4; N = (20, 400, 100, 80); all
  80 codegree-4 pairs of pattern 0,2,2,2,2,0 (the single pattern of the real 35-vertex graph); no K_{3,3}.
- What the points are: PAIR-LEVEL PHANTOMS — counts with no graph behind them; pairs are never asked to agree on
  triples, nothing is said about edges among the 24 outside vertices. The same kind as the ladder's one-vertex
  phantom, one level up. Single-source; nothing cited.
- Its calibration "feasible at (36, 8) too" is true but (36, 8) is excluded by the one-level count alone, so that
  bench is the trap the methods scout named. NEXT, same agent, same turn (gate G13 in the message sent to it): the
  SEPARATOR BENCH on the regular twins — every ingredient must keep the ten real 6-regular graphs on 22 vertices
  feasible and make (23, 6) infeasible without the catalogue below; then the same set at (40, 9). Report
  round5/c4-claude/REPORT-3.md. Three independent attacks now aim at the same question, "what closes the regular twin
  (7,23) without the catalogue below": this one, Astra E's two-root system (G10), the SAT-rows LP (round5/rows-sat).

## Added 2026-11-24 18:06 UTC — gate G13 (the separator bench on the regular twins): FAIL (control room)

- round5/c4-claude/REPORT-3.md (a Claude agent). Controls intact (63 plantings of the 21 real graphs at (16,5) and
  (22,6), 0 rows violated). Target met only at (23, 6) cap 2, by a parity row (N2 = 161 is odd; codegree-2 pairs come
  in crossing couples); (23, 6) at caps 3 and 4 and (18, 5) keep an integer point under every ingredient built:
  S0 base, S1 Ramsey at the root, S2 second-level edge counts, EQ equality cases. Ingredients (1) and (3) were NOT built.
- What the ingredients did: S1 cuts the admissible profiles at (23,6,4) from 120 to 7; S2 pins f = 5 at every
  codegree-4 pair of (23,6) and f at its minimum at every pair of (18,5); EQ then makes each outside graph ONE known
  extremal graph — and the root embeds every time. No contradiction.
- THE (18, 5) POINT, the cleanest object so far: one admissible cap (2), one profile, one forced count vector
  (N1 = 36, N2 = 72; every vertex with 4 non-neighbours of codegree 1 and 8 of codegree 2), every outside graph an
  extremal graph that exists — and no 18-vertex graph exists. What the rows never ask: that the extremal graphs seen
  from two different pairs be the SAME graph on the vertices they share. At (40, 9) the same sets are feasible at
  caps 3 and 4, and the second-level ingredient is slack there (as the +13 predicts).
- NEXT, same agent, same turn (gate G14 in the message sent to it): the agreement of two crossing roots at (18, 5)
  as a finite check; if two roots embed, three; "G14: PASS at r roots" / "G14: FAIL through r roots";
  round5/c4-claude/REPORT-4.md. The number of roots at which (18, 5) dies is the number this lane needs.

## Added 2026-11-24 18:12 UTC — gate G8 (the non-regular case): PASS 108 of 355, audited (control room)

- The audit: round5/audit-nonregular/ (a Claude agent; CLAIMS.md written from the mathematics as text before opening
  any program or output of the claimant; own joint program joint.py, a second column-wise checker check_cert.py, and a
  THIRD method for the floors, a SAT encoding of the cover condition, cover.cpp). Its report came as a message at
  18:10 UTC and is NOT on disk as REPORT.md; the outputs are in lp/, floors/, controls/, with SHA256SUMS (107 files).
- THE RESULT, in three tiers, none using P66 or Chen's unchecked gluing, all resting on PUBLISHED GRAPH COUNTS:
    floors (degree 6, 7, 8, 9) = (120, 108, 95, 86): 53 of the 355 small keys excluded (125 of 519);
    (120, 108, 97, 87): 68 of 355 (140 of 519) — the claimant's checkpoint, confirmed exactly, same key sets;
    (122, 108, 97, 87): 108 of 355 (228 of 519). 291 distributions survive (247 small), all inside the 519.
  Every exclusion is an integer certificate accepted by the auditor's checker on its own columns; the claimant's 213
  certificates are accepted by the auditor's checker and the auditor's by the claimant's.
- THE FLOORS, each "every graph of a published-count-complete list is rejected as G − N[v]":
    f6 ≥ 120: lists 33/118 (5) and 33/119 (69) = Goedgebeur–Radziszowski Table 14;
    f6 ≥ 122: 33/120 (1,223) and 33/121 (13,098), total 14,395 = Angeltveit 2025 §3.3 (ONE publication for the last 17);
    f7 ≥ 108: 32/104..107 (39; 952; 18,598; 234,681) = GR;   f8 ≥ 97: 31/95 (560), 31/96 (35,154) = GR;
    f9 ≥ 87: 30/86 (1,800) = GR.   18,444 UNSAT answers with LRAT proofs accepted by lrat-check (cake_lpr NOT run).
  NOT ESTABLISHED: f9 ≥ 88 (the list on disk has 147,322 of the published 147,335); f6 ≥ 123 (no published count).
  So CHEN'S FLOOR 88 IS NOT CONFIRMED, and the lane's "118, 104" were the published minima, not Chen's enumerations.
- A HOLE FOUND IN OUR OWN ROSTER: the 519 was built with Chen's floors. Run over all 6,180 non-regular distributions
  without it: at (120,108,97,87) one more key survives, (8,0,0,32) — one of the "five removed by rays", whose removal
  needs floor 88 at degree 9 or ≥ 121 at degree 6; at (122,108,97,87) the survivors are exactly 291, all in the 519,
  so the hole closes at that tier. At the published minima alone 567 survive, 49 of them outside the roster.
- Controls: cover test and pressure on graphs that exist (the 172-edge 39-vertex graph, C35, samples of (3,8;27),
  all 191 (3,7;22), …) 0 failures; every inequality of the joint program on 46,225 roots, 0 violations; negative
  controls refused. Weak spot named by the auditor: sign-flipped certificates are often still accepted (724 of 2,265).
- What it also shows: DEGREE-CLASS STATISTICS ARE EXHAUSTED at this level — all 291 survivors are integer-feasible, and
  counting per neighbourhood type adds 0. The unit table (what one more unit of each floor buys) is in
  lp/unit_table_122_108_97_87.tsv: f9 = 88 would give 116 of 355.
- The claimant (Astra D, still running since 16:59) now claims 238 of 519 through a degree-six matching lemma and
  rooted certificates: NOT audited yet. NEXT, same agent, same turn (gate G8b in the message sent to it): audit those
  lemmas; bounded attempt at floor 88; one worked two-root example on the nearest survivors.

## Added 2026-11-24 18:28 UTC — proof mining (row N7): 0 lemmas survive (control room)

- round5/miner/ (a Claude agent; 16:34–18:26 UTC; 2.76 core-hours; SUMMARY.json holds every number; its report came as
  a message and is NOT on disk as REPORT.md). Single-source. Verdict line: "MINER: 0 lemmas survive".
- THE ANSWER: the finished exclusions are of two kinds and neither yields a lemma. "Where the reason is small it is
  already a screen; where the cost is, the reason is not small."
  SHALLOW — line B's 655 refuted assignments (all of them re-derived with the agent's own constraint system): 552 are
  ONE free vertex against at most seven of the eight fixed rows (three arithmetic patterns, no solver needed, α ≤ 9
  not used), 15 are two free vertices, 88 are one forced independent 10-set. Five patterns explain 655 of 655 and are
  that line's own screens restated; they reach none of the 2,976 open assignments: the pair-level system (degree 9,
  codegree ≤ 3, a common neighbour for every non-adjacent pair, no triangle through a centre) HAS A MODEL on 24 of 30
  sampled open assignments (6 undecided at 4 s). No coarse rule separates closed from open (0 of 23 cells).
  DIFFUSE — the R(6) three-edge cores: a configuration is refuted about 165–185 times over by independent 6- and
  7-sets spread across the 26 core vertices (each vertex carries 2–5% of the reason; ignoring the sets through one
  vertex un-refutes 33 of 39,678 and 4 of 54,047 sampled configurations). For every one of 16 sampled cores there is
  a 9-regular triangle-free completion whose independent 10-sets all pass through 7 random core vertices, so the
  frame plus 19 core vertices is NOT an explanation; on one core every explanation needs sets through at least 8 core
  vertices. Neither the six common rows alone nor the six side rows alone is the obstruction (6 of 6 each).
  P66 stage 2: 6 of 6 proofs read touch all 27 base vertices and all 10 private neighbours; dropping the clauses
  through 3 random base vertices makes the formula satisfiable in 8 of 10 trials. One observation: stage 2 never uses
  that the two degree-6 vertices have a common neighbour.
- Counts worth keeping from the pod's ledger: 101,564,232,221 configurations enumerated over the 23,409 cores;
  92,080,292,598 after the Hall screen; 28,340 left to the direct search.
- ITS NEXT EXPERIMENT, queued for line B's follow-up (row N22): for each of the seven profiles, does the LOCAL system
  alone (six rows fixed, 40 vertices, every degree 9, no triangle, codegree 1 to 3, no K_{3,3}, NO independent-set
  condition) have a model? A model is the 40-vertex control the lane lacks and proves that only independent 10-sets
  can close that profile; a checked UNSAT is the first whole-profile exclusion. Seven naive runs timed out; needs
  symmetry breaking and about a core-hour a profile. Not started now: the Mac has nine heavy jobs on eight cores.

## Added 2026-11-24 18:36 UTC — gate G14 (two roots must agree at the twin (18, 5)): PASS at 0 roots (control room)

- round5/c4-claude/REPORT-4.md (a Claude agent). Single-source: two encodings written differently by the SAME agent,
  LRAT proofs accepted by lrat-check and cake_lpr. Verdict line: "G14: PASS at 0 roots".
- LEMMA (18, 5): there is no 5-regular graph on 18 vertices with no triangle in which every two vertices have at most
  2 common neighbours. Proofs: the second encoding (5-regular, no triangle, codegree ≤ 2, one 4-cycle named, nothing
  else) UNSAT, LRAT 325,764 lines, both checkers; the first encoding with no root UNSAT, 30,278 lines, both checkers.
  With the hand step "cap 2 is forced at (18, 5) by R(3,4) = 9, and a codegree-2 pair exists" (REASONED) this
  EXCLUDES THE REGULAR TWIN (18, 5) WITH NO INDEPENDENCE CLAUSE AND NO CATALOGUE. Dropping the cap row makes it
  satisfiable (model re-checked: codegrees 1: 44, 2: 56, 3: 8).
- What it says: the G13 point at (18, 5) — one forced count vector made of real extremal pieces — is a phantom at the
  level of the graph itself; what pair counting forgot there is NOT independence but THE ASSEMBLY OF THE PAIRS INTO
  ONE GRAPH.
- It does NOT carry up as it stands. The general statement W(n, d, cap) = "a d-regular triangle-free graph on n
  vertices with every non-adjacent pair having between 1 and cap common neighbours exists": TRUE at (16,5,2),
  (22,6,3), (22,6,4) (real graphs), TRUE at (23,6,3) and (23,6,4) (witnesses in a second, with α = 8 and 9 — so at 23
  independence IS needed; 7 and 10 greedy roots still leave a graph), FALSE at (18,5,2), and
  UNDECIDED at (40, 9, 4) and (40, 9, 3) (400,000 conflicts each).
- Controls: the identical construction at (16, 5) is SAT with 0, 1, 2 and all roots, every model with α = 5; the 357
  regular analogues are not touched by the lemma.
- NEXT, same agent, same turn (gate G15 in the message sent to it): DECIDE W(40, 9, 3) and W(40, 9, 4) — a witness is
  the first 40-vertex control at the exact parameters and proves degrees, triangles and codegrees alone cannot close
  that stratum; a checked UNSAT excludes a whole stratum with no Ramsey input. Then the number of roots at which
  (23, 6) dies. This IS row N22 (the miner's proposal) in its general form; N22 no longer waits for line B.

## Added 2026-11-24 18:42 UTC — G8b: the non-regular count is now 238 of 519, audited (108 of 355 unchanged) (control room)

- round5/audit-nonregular/g8b/ (the same Claude agent; LEMMAS.md written before opening the claimant's receipts; own
  program low.py with a separate integer checker; report as a message, not on disk). "G8b: 108 of 355 confirmed".
- CONFIRMED key by key: 238 of 519 at floors (122, 108, 97, 87) — the claimant's later claim — and 246 / 116 if floor
  88 held. The ten keys beyond 228 all have n6 ≥ 3. 281 survive, 247 of them small.
- The low-vertex lemmas (G maximal triangle-free, 40 vertices, no independent 10-set), each proved by hand by the
  auditor and controlled on the two 39-vertex graphs, C35 and the catalogues (0 violations):
    L1 a degree-6 vertex has at most one degree-6 neighbour (no floor needed);
    L2 two non-adjacent degree-6 vertices have exactly one common neighbour, of higher degree; a vertex has at most 5
       degree-6 neighbours (4 if its degree is 7) — needs R(3,8) = 28;
    L3 among degree-6 vertices no 7 are independent; n6 ≤ 8 — by hand only; none of the 238 depends on it;
    L4 with f6 = 122: n6 ≤ 4;   L5 three hand proofs at e = 170.
  NOT CONFIRMED: L6 (the claimant's "n6 ≤ 7 with no floor, n6 ≤ 6 at the published minima"); nothing at the verified
  floors depends on it.
- FLOOR 88 AT DEGREE 9: NOT ESTABLISHED, and not a small job. The 30/87 list on disk is a walk of local moves, now
  147,331 of the published 147,335. Every 87-edge graph with a removable edge is known (133,434 classes from the 1,800
  graphs at 86 edges), so the 4 missing are edge-critical. The eight small keys floor 88 would close each survive only
  if one of those 4 unlisted graphs is the exterior of a degree-9 vertex (the 491 known graphs that fit the budget are
  all refuted, LRAT). House of Graphs does NOT offer the 87-edge list (checked by the control room at 18:41 UTC): it
  holds minimum-edge lists only. Those were downloaded to round5/hog-lists/ (30/86: 1,800; 31/95: 560; 32/104: 39;
  33/118: 5 "some"; (3,8;27;85): 4; (3,9;35): 1) and the agent is matching them against the lists the floors used
  (gate G8c).
- Two-root worked example: the key (0,4,28,8), e = 162, is forced to one shape (four degree-7 vertices in a 4-cycle,
  the eight degree-9 vertices inducing a cubic graph, every vertex exactly at its floor) and no Ramsey bound on a set
  anticomplete to a pair contradicts it. Where a second root DOES bite: the set anticomplete to TWO NEIGHBOURS of a
  low vertex has no independent 8-set — that condition takes the 33/121 layer from 11 survivors to 0 and the known
  33/122 layer from 7,384 to 0. So in the non-regular case the useful two-root object is a pair of neighbours of a
  low vertex, not an edge.

## Added 2026-11-24 18:44 UTC — G8c: four layers now rest on a published LIST (control room)

- round5/audit-nonregular/g8c/. The published minimum-edge lists (House of Graphs, fetched 18:41 UTC,
  round5/hog-lists/) equal the lists the floors used, up to isomorphism: 30/86 1,800 = 1,800; 31/95 560 = 560;
  32/104 39 = 39; 33/118 5 = 5; nothing only on one side; every published graph valid and rejected by the cover test.
  The four (3,8;27;85) graphs and the (3,9;35)-graph equal the lane's McKay copies.
- Footing after this: the degree-9 floor 87 rests wholly on a published list. On LISTS ALONE the floors are
  (119, 105, 96, 87): 26 of 355 (66 of 519; 75 with the low-vertex lemmas). The other 82 of the 108 small keys need
  at least one count-only layer (31/96, 32/105..107, 33/119..121). Counts 108 / 238 unchanged.
- No cheap exact route to the 4 missing 87-edge graphs: it would need the 29-vertex layers at 79, 80, 81 edges (none
  published), the list from the authors, or a gluing generator with its own completeness check.

## Added 2026-11-24 18:56 UTC — Astra D's own final report on G8 agrees with its audit (control room)

- round4/astra-nonregular/REPORT-2.md (ended 18:56:07 UTC): "G8: PASS 108 of 355", 238 of 519, floors (122,108,97,87),
  no P66, no Chen gluing — the numbers the audit had already re-derived (the two blocks above). Its floor table and
  its "88 NOT ESTABLISHED (147,331 of 147,335)" match the auditor's.
- New in it, single-source, adding ZERO to the count: in 58 survivors (42 small) a root must attain a verified floor
  and every edge at such a root is CRITICAL (deleting it creates an independent 10-set); in 41 of them every edge of
  the root's exterior is critical too; in five of the eight profiles sensitive to floor 88 EVERY edge of the graph is
  critical; in (0,16,0,24) all 24 degree-9 roots attain 87 and three pairwise non-adjacent ones must have isomorphic
  edge-critical exteriors. Rejected by it with numbers: integrality alone (0), transfers of the regular-case pair
  lemmas (0), three-private-cell refinements (0).
- NEXT, same turn: resumed on round5/RESUME-D2.md, gate G16 (stamped, round5/GATE-5e.sha256): the 281 survivors by
  two-root arguments (two tight degree-9 exteriors must overlap; the pair of neighbours of a low root as rows;
  criticality); PASS = at least 7 further profiles excluded with second-program certificates. Report
  round4/astra-nonregular/REPORT-3.md, last line "G16: PASS k more …" / "G16: FAIL k more".

## Added 2026-11-24 19:02 UTC — the SECOND ladder table: G9 FAIL confirmed, with one correction and one strong lead (control room)

- round5/reach-claude/ (a Claude agent; own programs; REACH.md, out/, SHA256SUMS of 166 files; its report came as a
  message and is not on disk as REPORT.md). Verdict "G9: FAIL".
- CONFIRMED by a second program: the one-level row 19, 24, 30, 36, 43 and the degree-potential row 19, 25, 31, 39, 46;
  the twin terms 0, +1, +5, −5, +4, +8.5, +13 (the methods scout's table re-derived); 5,002 degree sequences pass the
  count at n = 40, 489 at 41, 24 at 42, none at 43. CORRECTION: with neighbours' degrees per vertex (row B+) the true
  one-level row is 19, 24, 29, 36, 43 — parity buys 29 at k = 8; it does not exclude 41.
- THE SCALE WITNESS CONFIRMED: S_{32,5} layered five times is 320 vertices, 72-regular, triangle-free, α = 72
  (computed through a reduction that matched brute force on ten small layered graphs), 320/72 = 40/9. It defeats ONLY
  the homogeneous family (Hoffman, χ_f, densities); the exact-data programs are defeated by a different phantom:
- WHY LOCAL COUNTING COLLAPSES, in three layers each with a witness: (1) programs that read outside graphs through
  RANGES are filled by one real card repeated (such cards exist at every twin and at 40: 800 real (3,9;30,99)-graphs
  in hand); (2) a repeated card CAN be caught by EQUALITIES between roots (subgraph-count identities): with the
  catalogue they close (6,18) at 5-vertex types and (7,23) at 7-vertex types; (3) without the list, or with many
  cards, the equalities are satisfied by MIXTURES: at (8,28) and (10,40) seven real cards already mix to an exact
  feasible point. "A local-counting program is a relaxation whose feasible set contains every consistent mixture of
  real outside graphs." So row N12 (higher subgraph identities) is DEAD from k = 8 on at ≤ 7-vertex types, with or
  without the catalogue.
- A COUNTING PROOF OF R(3,6) ≤ 18 from the lists of (3,4;7..8)-graphs alone (row S1, exact Farkas, 0.1 s) — closes
  the twin (6,18) without the catalogue below; it does NOT close (7,23). Single-source; worth an audit.
- THE LEAD — "fractional gluing" (its row O1; the same object as Astra E's "coverage price", found independently):
  for ONE card H = G_v, weights on the independent (d−1)-sets of H summing to d, covering each vertex d − deg_H(w)
  times, and such that every maximum independent set of H is missed by at most one neighbour of v. No search.
  INFEASIBLE on the card of (6,18) and on each of the 39 cards of (7,23) (exact), on 333 of 333 sampled real cards at
  (8,28) and on 4 of 4 real (3,9;30,99) cards at 40 (floats; margins 0.08 to 1.0); FEASIBLE on the cards of the
  (3,5;13)- and (3,9;35)-graphs, as it must be. It needs the card, but it is not a mixture of cards.
  If it were UNIFORM over all admissible cards at 40, the regular case would be closed without strata.
  NEXT, same agent, same turn (gate G17 in the message sent to it): hunt a card at 40 on which it is feasible (then
  dead) or extract a uniform inequality from the duals that holds at all three levels and spares the controls.
- A ROW THE PAIR SYSTEMS LACKED (from this agent and the structure tests, proved in three lines): every vertex has at
  most d non-neighbours with exactly one common neighbour (two of them at the same neighbour j would extend
  N(w) − j to an independent (d+1)-set), and at most three vertices have their trace inside a pair of neighbours.
  The surviving points of gate G13 at (23, 6) violate it (vertex types with 8 and 9 such partners, d = 6; N1 = 70 >
  69). Sent to round5/c4-claude as an addendum ("G13b"), to rerun the twin table with these rows.
- Also: the rich root is forced at R − 1 everywhere but is rare (0.04% of 6-sets one rung down) and not hereditary;
  no averaging argument can prove it. Plain SAT, naive encoding, does not decide the twin (6,18) in 300 s.

## Added 2026-11-24 19:13 UTC — gate G10 (a two-root system on the regular twins): PASS by its letter, single-source (control room)

- round5/astra-reach/REPORT-3.md and work/g10/ (Astra; ended 19:11:48 UTC). Verdict "G10: PASS".
- THE EDGE CHARGE (new): for a vertex v with residual H_v, c_v(x) = d − deg_{H_v}(x), z_v(x) = the sum of residual
  degrees of x's neighbours in H_v, D(v,u) = Σ_x (d·[x ~ u] − c_v(x))·z_v(x). Summed over the neighbours u of v it is
  zero, so the edge charge s = D(v,u) + D(u,v) averages zero over edges. Two more rows tie edges and non-edges.
- THE TWINS: the complete set of admissible edge charges is {−32} at (18, 5) and {−44, −32, −8} at (23, 6): all
  negative, so both twins are EXCLUDED. The standalone verifier (Python standard library) takes no catalogue as input.
- THE CONTROL ROOM'S READING OF THE PASS: by the gate's letter yes; but the verifier "regenerates the narrow residual
  layers internally", i.e. the exclusion needs the COMPLETE set of admissible charts, which is the census of the level
  below done inside the verifier — feasible where the layer is 0 or 1 edge above the minimum, not at 40 (13 above).
  AT (10, 40) THE SYSTEM IS FEASIBLE: masses 1/8, 5/6, 1/24 on charges +110, −10, −130; the five supporting charts
  contain 72 to 228 independent 10-sets (they are not graphs we are looking for; the requirement is relaxed there).
  So this answers "what closes (7,23)" only in the weak sense. An audit is running (round5/audit-g10/).
- COVERAGE, measured (agrees with the Claude ladder agent's numbers): coverage ALONE lets 37 of 39 residuals pass at
  (7,23) and 278 of 324 sampled residuals at 40; so the force of the per-card lead is NOT in coverage but in the rows
  "each maximum independent set is missed by at most one neighbour" (the other agent's O1: 0 of 39 pass). A bounded
  price inequality detects all 46 coverage failures at 40.
- THE HOMOMORPHISM LEMMA, proved (row N19; the control room read the proof and agrees): α(G) ≤ k − 1 and a
  non-injective homomorphism to a triangle-free graph give |V(G)| ≤ k + R(3, k−2); at k = 10: 38. So no (3,10;40)-graph
  folds onto a smaller triangle-free graph. Tight: 376 foldable graphs at k = 7, n = 21.
- SMALL SCALE PHANTOMS EXIST (row N17 done, single-source): Cayley graphs with degree = α on all five abelian groups
  of order 80 (degree 18) and all three of order 120 (degree 27); e.g. Z_80 with ±1, 3, 5, 7, 9, 11, 24, 26, 39.
- NEXT, same turn: Astra E resumed on round5/RESUME-E3.md, gate G18 (stamped, round5/GATE-5f.sha256) — to be the
  SECOND PROGRAM for the per-card lead (fractional gluing with the independent-set rows) on its own samples, an
  adversary for a feasible residual at 40, the uniform inequality; report round5/astra-reach/REPORT-4.md
  ("G18: PASS DEAD" / "PASS UNIFORM …" / "FAIL"). The Claude ladder agent runs the same question as G17.

## Added 2026-11-24 19:30 UTC — G10 AUDITED: confirmed as arithmetic, and the edge charge is DEAD as a route to 40 (control room)

- round5/audit-g10/ (a Claude agent; own proofs from SYSTEM.md as text, own enumeration with its own generator, the
  claimant's verifier run in an empty directory; about 3 CPU-minutes; report as a message, not on disk).
  Verdict "G10: CONFIRMED" — for exactly what was claimed, which is narrow.
- CONFIRMED: the three identities (proved; exact on all 357 regular analogues, 0 failures; the edge-charge identity
  uses regularity only and holds for ANY weight, so it carries no Ramsey content by itself); the twins' residuals
  regenerated independently (1 on 12 vertices; 39 on 16 vertices by a four-level extension from 244,865 graphs —
  identical to McKay's after canonical labelling); covers 26 and 8,816; chart supports exactly {−32} and
  {−44, −32, −8}; the standalone verifier (16 s, standard library, exits 0); the point at 40 (exact fractions).
- WHAT THE AUDIT ADDS: (1) THE ONE-ROOT ENUMERATION ALONE ALREADY EXCLUDES BOTH TWINS — every one of the 26 and 8,816
  assembled candidates has an independent set that is too large; the two-root charge is not what kills them.
  (2) "No catalogue as input" is literally true and substantively empty: the verifier regenerates the complete lists
  of the two levels below inside itself. (3) The all-negative support depends on the chosen weight: six of eight
  natural weights give mixed signs at (23, 6). (4) THE FIVE CHARTS AT 40 ARE GENUINE in the same sense as the twins':
  9-regular triangle-free graphs on 40 vertices in which both roots are "good" (no independent 10-set through them);
  they have 30 to 228 independent 10-sets elsewhere and only 2 to 4 good vertices. Genuine charts with charges +110,
  −10 and −130 exist, so NO SIGN ARGUMENT IS AVAILABLE and more enumeration cannot help: row N24 is DEAD for 40.
- A chart constrains 2 of 40 vertices; "all neighbours of a good vertex good" is already the full problem.
- Also CONFIRMED by the auditor's own code: the homomorphism lemma (line by line; 0 foldable graphs above the cap in
  all catalogues; 376 exactly at the cap; 0 violations on all 1,381,901 triangle-free graphs with 2–12 vertices) and
  the Z_80 control (18-regular, triangle-free, α = 18 by exact branch and bound, 5,720 maximum independent sets — the
  claimant's number by another method). The other eight Cayley controls: regular and triangle-free checked, α not.
- A measure this suggests (row N25): the number of GOOD vertices (those in no independent 10-set) of a 9-regular
  triangle-free graph on 40 vertices. A (3,10;40)-graph has 40; the best in hand has 4.

## Added 2026-11-24 19:45 UTC — row N10 (SAT proves rows, an LP sums them): PASS by its letter on two twins, DEAD at 40 in this form (control room)

- round5/rows-sat/ (a Claude agent; src/, out/, inst/, WORKLOG.md; 117.6 CPU-minutes; its report came as a message and
  is not on disk as REPORT.md). Verdict line "ROWS: PASS at (6,18), (7,23)", which the agent itself tells us not to
  read as force. Single-source; its soundness rests on three REASONED steps (symmetry breaking, the case cover, the
  encoder) controlled against the catalogues in 183 of 183 two-sided tests.
- THE MEASUREMENT: at (7,23) four proof-checked rows make the pair LP infeasible in 11.1 CPU-s — plain SAT on the same
  instance takes 9.3 CPU-s. At (8,28) NEITHER closes: 36 rows proved (35 checked by both checkers) in 1,578 CPU-s and
  the LP is still feasible at the same point; plain SAT times out at 1,869 CPU-s. The cost of consecutive rows near
  the stall grows by a factor 3 to 6 per step at 28 and 6 to 37 per step at 40.
- THE RULE IT FOUND (data COMPUTED, rule REASONED): a row is cheap exactly while its pair type does NOT occur one
  vertex below; once the type occurs at n − 1, proving it absent at n costs about as much as the whole problem. And
  the pair LP restricted to the pair types that occur one vertex below STAYS FEASIBLE at 23 (14 types), 28 (30) and
  40 (45 types, all from the single 172-edge 39-vertex graph). So every certificate of this LP must contain a row
  that is false one vertex below: the identities cannot tell n from n − 1, and SAT has to, at full price.
  Why the R(3,3,3,3) paper escapes this and we do not: there a mark brings a rigid template; here a mark brings an
  independent set, and rigidity appears only where the outside graph is extremal — the rows that were cheap.
- A CHEAP FILTER FOR EVERY COUNTING LP (row N26, no solver, minutes): compute the LP's statistics on the degree-9
  vertices of the 39-vertex graphs on disk, restrict the 40-vertex LP to what occurs there, solve exactly. Feasible
  = that LP is dead before any SAT is spent on it. To be run on lines B, C, D's systems.
- BY-PRODUCT, five rows at 40 checked by both proof checkers: in a 9-regular candidate the outside graph of a
  non-adjacent pair with 2, 3, 4 common neighbours has at least 43, 51, 58 edges (published minima 42, 49, 56);
  44, 52, 58 with two unchecked solver verdicts. Symmetry breaking is indispensable: without it the 18-vertex twin
  times out at 300 s; with it, 0.04 s.
- At 19:34 UTC the battery guard paused every heavy process (30%, on battery); this agent ended its queue; lost: the
  last part of its 40-vertex loop and the (8,28) continuation.

## Added 2026-11-24 20:10 UTC — row N13, the last test (tail roots against a pair board): UNDECIDED; not pursued as a root (control room)

- round5/structure-tests/item5/ (results.tsv, TABLE.txt; 6,600 CPU-s). By the rule written before the runs: at (8, 28)
  NONE of the three tail roots and NOT the pair board at c = 5 finished within 1,343 CPU-s each → "N13: UNDECIDED".
- Where both finish (all 14 UNSAT proofs accepted by lrat-check and cake_lpr): at (6,18) the three tails together cost
  1,338 conflicts against 5,724 for the board (4.3 times cheaper); at (7,23) 387,759 against 27,274 (14 times dearer);
  from 18 to 23 the tails' cost grows by a factor 290, the board's by 4.8. At 23 a single fixed neighbourhood (9.7 s)
  beats the three tails together (15.8 s). The largest-codegree board is the cheap one; boards at c = 2 and c = 1 do
  not finish in 240 s at 23.
- Encoding checks against known facts, all as they must be: at 17 vertices the cubic 8-vertex core never occurs
  (UNSAT, proof checked), the other two do; R(3,6) = 18; the 6-regular 22-vertex controls SAT with models that are
  lines 185 and 186 of r37_22.g6; codegree 5 at 22 UNSAT.
- THE CONTROL ROOM'S RULING: the tail law stays in the ledger as a fact about the catalogues with its first rung a
  theorem; AS A ROOT FOR SEARCH it is not pursued — nothing rooted this way closes at 28, which is the family F1
  again, and the one clean trend runs against it. item5/run/ holds 409 MB of proofs and may be deleted.

## Added 2026-11-24 20:17 UTC — gate G17 (fractional gluing: uniform or dead at 40): FAIL — neither (control room)

- round5/reach-claude/ (g17_*.py, gfast.py, out/g17_*, SHA256SUMS-G17; about 1 core-hour). All verdicts in floats.
- THE ADVERSARY found no real card (a triangle-free graph on 30 vertices, 99 edges, no independent 9-set) on which
  the gluing LP is feasible, in about 2,200 evaluations: minimum excess 0.186 in the stratum with degrees {6,7,8}
  (1,321 cards, around cyclic-derived cards only) and 0.0505 with degrees {5..8} (the lowest card is the 172-edge
  39-vertex graph minus N[v] plus one neighbour). The margin shrinks with the level: 0.19–1.0 at (8,28),
  0.05–1.0 at (10,40). The search was slow (1–3 cards a second) and near two sources only.
- NO UNIFORM INEQUALITY: seven fixed shapes of dual weighting tested; none excludes every card at any level (the
  best fixed shape excludes 26 of 39 at (7,23), 26 of 333 at (8,28), 1 of 40 at 40). "Rows of maximum independent
  sets only" excludes 39 of 39 and 333 of 333 below, but at 40 it is FEASIBLE on 12 of the 24 hardest cards: there
  7-sets carry part of the weight. Rows of sizes 7 and 8 together still exclude 12 of the 12 hardest.
  The only statement true on every card tested at every level is the LP itself, with card-specific weights.
- Controls: 421 cards of graphs that exist, none excluded by any class, full LP feasible on all.
- Why it is not a mixture relaxation (the agent's paragraph, REASONED): the LP is posed on one actual card — its own
  vertices, its own maximum independent sets as columns, its own independent sets as rows with exact right sides;
  it relaxes the nine neighbours to weights, not the catalogue. What it lacks is the quantifier "for every card".
- NEXT, same agent, same turn (gate G17b in the message sent to it): the adversary ported to C, both strata, at least
  10^5 distinct cards, wider moves; PASS DEAD needs an exactly feasible card AND the answer whether that card has an
  integer gluing; PASS FLOOR needs the floor's histogram. Astra E runs the same question as G18 with its own code.

## Added 2026-11-24 20:40 UTC — gate G15 (the local window at 40): PASS — both windows are NON-EMPTY (control room)

- round5/c4-claude/REPORT-5.md (a Claude agent; each witness re-checked from the saved graph by a second program of
  the same agent). Verdict "G15: PASS 4: WITNESS, 3: WITNESS". The cap-4 circulant ALSO CHECKED BY THE CONTROL ROOM
  with its own short program (scratchpad w40.py): Z_40 with connection set {±1, ±5, ±9, ±12, 20} is 9-regular,
  triangle-free, its 600 non-adjacent pairs have 1, 2, 3, 4 common neighbours 120, 280, 40, 160 times, α = 11.
- CAP 4: that circulant (round5/c4-claude/witness40-cap4.g6): 1,048 independent 10-sets, 80 independent 11-sets; it
  contains two of the 60 open cases (P012210 and B33) and none of the nine closed ones; every inequality of gates G7
  and G12 holds on it (with its own α). Not alone: 4 such connection sets on Z_40, 220 on three non-abelian groups,
  and an asymmetric one found by local search in 129 s.
- CAP 3: a graph invariant under a permutation with four 10-cycles (witness40-cap3-sym10_10_10_10.g6): 9-regular,
  triangle-free, 30 / 300 / 270 non-adjacent pairs with 1 / 2 / 3 common neighbours, α = 10, 281 independent 10-sets
  (every vertex in one; 6 vertices meet them all), no induced K_{3,3}. It contains four of the seven profiles of the
  c* = 3 cover — (1,2,2), (1,2,3), (2,2,2), (2,2,3). Plain CDCL did NOT decide this window in 2,400 CPU-s; the witness
  came from a symmetric search. Not a Cayley graph of any of ten groups of order 40.
- WHAT THIS SETTLES: these are the FIRST 40-VERTEX CONTROLS AT THE EXACT PARAMETERS of the two strata, and they prove
  that NO ARGUMENT MADE ONLY OF DEGREES, TRIANGLES AND CODEGREES CAN CLOSE c* = 3 OR c* = 4. Only independent 10-sets
  can. (Row N22 answered: the local system has models.) For line B: the four profiles the cap-3 witness contains
  cannot be closed without the independence bound, and the witness is the positive control its pipeline lacked (run
  with bound 10, it must not be refuted).
- THE (23, 6) CURVE: imposing roots (pairs in no independent 7-set) one at a time, a window graph still exists after 6
  roots at cap 4 and after 15 at cap 3; the next solves were undecided. The witnesses never drop below α = 7.
  (A correction by the agent to its G14 report: 6 and 9 roots there, not 7 and 10.)
- G13b: FAIL — the two maximum-independent-set rows (n1 ≤ d; at most three vertices with trace inside a pair) hold
  exactly (0 failures in 44,358 and 110,551 tests on the 357 analogues) and remove the old surviving points at
  (23, 6); others take their place; (40, 9) stays feasible at both caps.
- N26: DEAD for this system too — restricted to the pair types that occur one vertex below, it stays feasible at
  (23, 6) on the ten real graphs and at (40, 9) on 243 graphs with 39 vertices.
- Its proposed next experiment (NOT started: see the pause question put to the operator at 20:40): a local search INSIDE
  the cap-3 window minimising the number of independent 10-sets (a window graph with none is a (3,10;40)-graph), and
  the root-by-root curve at (40, 9, 3).

## Added 2026-11-24 20:57 UTC — gate G6 (close the seven configurations of c* = 3): FAIL (control room)

- round4/astra-workarounds/REPORT-4.md (Astra; ended 20:55:50 UTC; 18,055 metered CPU-s over both periods). All seven
  profiles remain open: 655 of 3,631 assignments certified, 2,976 open, the same counts as at 14:30 UTC.
- New, single-source: in every occurrence of profile (1,1,3) the link between the two tips' private neighbourhoods
  has at most 16 edges (a counting proof: 23 outside vertices supply at most 29 incidences where 30 are needed); 606
  of 4,406 canonical (1,1,3) panels excluded by integer Farkas certificates; every original assignment lost its
  highest link size. For (1,1,2): the three assignments keep 460, 439, 439 of 715 overlap graphs. For (2,2,1): 16 of
  31 matching shapes excluded. 175 formula/proof pairs replayed through both checkers.
- THE CONTROL ROOM'S RULING: closing the seven profiles by local structure is NOT pursued further in this form. Gate
  G15 showed a real 9-regular triangle-free graph on 40 vertices with every codegree in 1..3 that contains four of
  the seven profiles — those four cannot be closed without independent 10-sets — and after about five CPU-hours none
  of the other three closed either. The cover (two sources) and the bounds stay in the ledger.
[line 698 withheld from the public copy: another private project or private correspondence]
[line 699 withheld from the public copy: another private project or private correspondence]

## Added 2026-11-24 21:09 UTC — gate G18 (the cover test, second program): part 1 PASSED in exact arithmetic; no fixed inequality (control room)

- round5/astra-reach/REPORT-4.md (Astra; ended 21:08:16 UTC). Its verdict line says "PASS UNIFORM" with an inequality
  whose weights w, z "can differ by host". THE CONTROL ROOM'S RULING: that is the LP's dual in one form, not ONE
  inequality; by the gate's words part 3 is NOT met (the Claude agent on G17 reached the same object and called it
  "not a fixed inequality"). Part 1 is met and is the strongest evidence of the day.
- PART 1, EXACT (every classification has an exact rational feasible point or a strict integer separation):
    (6,18): 1 residual, 0 feasible.   (7,23): 39, 0.   (8,28): 256 fresh, 0.
    (10,40): 9,182 DISTINCT hosts across all samples — coverage alone leaves 9,129 feasible, coverage + rows of
    maximum independent sets leaves 179, ALL ROWS leave 0.
  Controls: 1,722 of 1,722 roots of graphs that exist are feasible (orders 13, 16, 22, 35, the two 39-vertex graphs,
  the 80- and 120-vertex Cayley controls, the 320-vertex layered graph). The closest host in the degree windows
  misses by 1558708649670961/37957223814085697 (between 1/25 and 1/24); a minimum-degree-4 host by about 0.039.
  TWO PROGRAMS NOW AGREE (round5/reach-claude in floats on about 2,200 cards; this one exact on 9,182): no residual
  tried at 40 admits a fractional gluing, and at 40 the maximum-set rows alone do not suffice.
- What a census-free proof would need (its analysis): after pruning, the hardest host passes every subset row with at
  most two deletions from a maximum set; three deletions exclude it and suffice across the whole sample; every one of
  451,725 PAIRS of marked maximum sets can be satisfied together; an explicit collection of 11 marks fails, minimally.
- ONE FIXED OBSTRUCTION already transfers: a 40-edge partial graph with one inequality (a vertex of residual degree
  ≤ 7 that no independent 8-set joins to a marked independent 8-set: 2 + 8 > 9) excludes 134 pairwise non-isomorphic
  hosts, 133 outside the earlier sample.
- Edge charge, closed: 23,205 control edges, mean zero on every graph; the +110 chart has no independent 10-set
  through either root, so endpoint avoidance alone admits it.
- A correction to a control file by Astra: the file it had called control167.g6 has 168 edges; the audited 167-edge
  graph was used for the reported control.
- CAUTION (control room): if a 9-regular (3,10;40)-graph existed, its 40 residuals would be feasible hosts that no
  sample near known graphs can see. "Every host tried is infeasible" is evidence about the neighbourhood of what
  exists, not a proof. What a sample can measure is whether infeasibility has a FINITE CAUSE.
- NEXT, same turn: resumed on round5/RESUME-E4.md, gate G20 (stamped, round5/GATE-5g.sha256): THE TRANSFER RATE — a
  dictionary of fixed partial-graph obstructions, greedy cover of the 9,182, and coverage of at least 2,000 fresh
  held-out hosts; PASS = at most 200 obstructions cover at least 90% of them and none embeds in a control.
  Report round5/astra-reach/REPORT-5.md.

## Added 2026-11-24 21:35 UTC — gate G19 (the search inside the window): FAIL by its letter; the cap-3 window looks rigid (control room)

- round5/c4-claude/REPORT-6.md (a Claude agent; 52 CPU-minutes). Single-source.
- CAP 3: the search cannot move inside the window. 0 of 18,696,115 single switches stay in it; 198 switch-and-repair
  walks all returned to the SAME graph (706 failed); lazy-clause searches in two symmetric families produced 757
  window graphs, EVERY ONE with exactly 281 independent 10-sets, and the three compared canonically are one graph
  (automorphism group of order 10). That graph: codegrees 1, 2, 3 on 30, 300, 270 pairs; α = 10; NO good vertex (each
  vertex in 69 or 74 of the 10-sets); 6 vertices meet all of them. No asymmetric member is known and none is excluded.
- CAP 4: a large window. Floor 84 independent 10-sets over 58,098 evaluations (56,865 walk visits + 1,233 distinct
  graphs); best graph has α = 10, no good vertex, 6 vertices meet all 10-sets. The lane's records outside any window
  are 24 and 30. No graph without an independent 10-set was found.
- Vertex-root curves end on time limits: at (23,6) two good vertices can be forced (the audit's exact maximum is 5);
  at (40,9,3) no window graph with even ONE good vertex was found (10 good by an orbit: not found in 304 s).
- THE IDEA THIS RAISES (the agent's, and the control room agrees it is worth a gate): every 9-regular candidate with
  largest codegree 3 lies in W(40,9,3). If that window is finitely small and each member has an independent 10-set,
  the stratum c* = 3 is EXCLUDED with no independence clause in the proof. Tightness t = d(d−1)/((n−1−d)·cap):
  (16,5,2) 1.00 (strongly regular); (18,5,2) 0.83 EMPTY; (40,9,3) 0.80 one graph seen; (22,6,3) 0.67 and
  (23,6,3) 0.625 hundreds. Algebra to use: (A + I)² = 8I + 2J + E with E in {−1,0,1}, every row sum 12.
- NEXT, same agent, same turn (gate G21 in the message sent to it; 3 more core-hours): classify W(40,9,3) —
  calibration of the tightness trend, the algebra (does an eigenvalue bound give α ≥ 10 for EVERY member?), the
  enumeration. "G21: PASS c* = 3 excluded …" / "PARTIAL …" / "FAIL"; round5/c4-claude/REPORT-7.md.

## Added 2026-11-24 21:37 UTC — row N25 (good vertices): measured; no argument caps the count; not pursued (control room)

- round5/good-vertices/ (a Claude agent; out/SUMMARY.json; about 41 CPU-minutes; report as a message, not on disk).
- THE TWINS, SECOND SOURCE, EXACT: the audit's numbers reproduced — maximum g = 2 of 18 and 5 of 23 (26 and 8,816
  labelled covers; up to isomorphism 7 and 5,504 classes). Below the threshold every value occurs: at (22,6) the
  220,123 classes with a good vertex have g from 1 to 15 and then 22 (the ten real graphs); at (16,5) 41 classes.
- THE CLIFF IS NOT GENERAL: at (28, 7) there are 7-regular graphs with 11 good vertices. At (20,5), (24,6), (36,8)
  the maximum is 0 (the residual cannot exist).
- AT (40, 9), by search (lower bounds, a weak instrument): g ≥ 9 for regular graphs — ten classes, each with ONE
  vertex x lying in every independent 10-set (160 to 246 sets), so G − x is a 39-vertex graph with no independent
  10-set and the good set is N(x); g ≥ 21 with degrees ≤ 9 (178 edges, 50 independent 10-sets inside 19 vertices).
  Few independent 10-sets does not mean many good vertices: the 24-set graph has g = 6, the 30-set one g = 2.
- NO ARGUMENT that g must be small. "Every good vertex has two bad neighbours" is true for a trivial reason and
  bounds nothing (g ≤ 45). The pattern "good set = a matching plus isolated vertices" holds at 18, 23 and in the
  regular classes at 40 but fails at 28. The link to the gluing test: "some independent 10-set meets N(v) in exactly
  2" holds at every good vertex of every regular graph in hand — consistent with the infeasibility seen in G17/G18.
- By-product, unchecked against any record: 39-vertex triangle-free graphs with no independent 10-set and 167 or 169
  edges (round5/good-vertices/seeds/seeds39.g6).
- RULING: a useful measure for the mental model, not a route. Its proposed next experiment (two-vertex cores) is a
  near-miss search and is not started.

## Added 2026-11-24 21:54 UTC — P66 stage 1: THE SECOND SWEEP IS COMPLETE, 0 disagreements (control room)

- round1/control/p66-stage1b/sweep/SUMMARY-MERGED.txt and pod-2026-11-24/ (a Claude agent drove the pod; the control
  room re-counted at home before deleting it). All 477,142 lines of McKay's r38_27.g6 re-decided by the second program
  s1b.py: SAT 118, UNSAT 477,024, agreement with stage 1 on every line (the control room's own count over the 33
  results files: 477,142 distinct lines, agree=1 on all, 0 with agree=0; "lrat=VERIFIED cake=VERIFIED" on 477,024;
  33 of 33 file hashes OK). The 118 SAT lines are stage 1's 118.
- How it was run: 157,773 lines on the Mac (3 workers), 319,369 on a rented 32-vCPU pod (30 workers, 1 h 37 min,
  47.7 CPU-hours), the code files byte-identical (CODE.sha256), kissat 4.0.4 and cadical 3.0.1 built from the public
  tags, both proof checkers from the pinned sources; before the sweep the lane's controls passed on the pod and a
  300-line cross-machine check agreed field by field (verdict, CNF sha256, both checkers; the proof bytes differ on
  18 of 300 lines, both accepted), plus all 78 SAT lines the Mac had decided.
- WHAT P66 NOW RESTS ON: stage 1 by two programs sharing no code (glue.c; s1b.py with LRAT proofs through two
  checkers); the edge gate on the 118 (30 pass); stage 2 on the 30 by two encodings with 60 LRAT proofs; and, still
  PROSE: the reduction (ENCODING.md and the lemma's statement) and the completeness of McKay's catalogue. Each new
  pod line was decided once, on one machine.
- Consequence for the non-regular case (the audit's table): with P66 the excluded count is 273 of 519 (109 of the 355
  small keys) at the verified floors, against 238 without it; 246 survive.
- The pod 6h6at1q11jnxbp was deleted at about 21:55 UTC (get-pod 404; list-pods empty). Both pods of the evening cost
  US$2.28 in all: balance US$14.63.

## Added 2026-11-24 21:59 UTC — gate G17b (the faster adversary on the gluing test): FAIL on the count; no feasible card (control room)

- round5/reach-claude/ (gadv.c, gadv2.c, gfast2.py, out/g17b_*; about 1.8 core-hours; report by message). Floats.
- 6,194 DISTINCT cards (canonical forms by nauty) instead of the 10^5 the gate asked: no LP library links on this Mac
  and the agent's own simplex is too slow (about 1.4 cards per CPU-second with HiGHS through Python).
- NONE at or below zero. Lowest excess 0.047619 (about 1/21), a strict local minimum at radius 1 in the stratum
  {5..8} (all 349 valid neighbours higher); in {6,7,8} the floor was still descending slowly, 0.186 → 0.124 over 45
  minutes. Histogram: 1 card below 0.05, 25 below 0.08, median 0.231. Complete re-rooting of the 242 re-checked
  39-vertex graphs: 281 distinct cards with degrees ≥ 5, all positive, none with degrees ≥ 6.
- Rows of sizes 7 and 8 alone exclude 6,192 of the 6,194.
- With Astra's exact 9,182 (gate G18) and the earlier 2,200: about 17,000 card evaluations by two programs, no
  feasible card, closest about 1/25. The control room does NOT continue this adversary: the question that decides the
  lead is the transfer rate (gate G20, running), not a larger sample from the same neighbourhood.

## Added 2026-11-24 23:12 UTC — three reports: G16 PASS (non-regular, 35 more), G11 FAIL (c* = 4), G21 FAIL (classification) (control room)

- G16 (Astra D, round4/astra-nonregular/REPORT-3.md, ended 22:36 UTC): "PASS 35 more (total 273 of 519, 109 of
  355)" at floors (122,108,97,87). SINGLE-SOURCE until audited (a Claude agent starts now, round5/audit-g16/).
  Its main new theorem: THREE DEGREE-6 VERTICES ARE IMPOSSIBLE — n6 ≤ 2 — with NO single-root floor and NO P66
  (adjacent case: a four-clique of compatible private neighbourhoods, zero found on all 477,142 order-27 cards by two
  programs; independent case: in every labelled alignment of the three views an independent 9-set remains in one
  exterior). That alone excludes 34 of the 281 and also the off-roster key (8,0,0,32). Plus one key, (2,7,0,31), by
  parity and 66,188 cards with zero admissible shores. The same count P66 would give (273), by an independent route.
  Also: it says its incidence-moment counts (6 and 17) are right and the auditor's (1 and 15) came from a relaxation
  missing the low-incidence geometry, with 20 integer contradictions for the seven keys — for the audit to settle.
  Neighbour-pair rows and criticality exclude zero profiles. 246 survive (166, 45, 35 at n6 = 0, 1, 2).
- G11 (Astra C, round4/astra-c4/REPORT-3.md, ended 22:30 UTC): "FAIL 0 of 60". Ramsey pressure with the catalogue
  equality cases closes 188 more DEEPER placements (89,428 excluded, 1,738,810 open) but no whole profile. New,
  single-source: at c* = 4, every vertex of a maximum-codegree pair lies in an independent 7-set whose whole
  antineighbourhood is two disjoint edges (2K_2) — the tail law's next rung, proved for this stratum using a
  published edge threshold. The closure fraction FALLS upward (110/1,957 at c* = 5, 311/13,482 at c* = 6).
- G21 (round5/c4-claude/REPORT-7.md): FAIL — W(40,9,3) not classified. Every probe returns the same single graph;
  complete (no member) for circulants, two 20-cycles, 13+13+13+1 and ten Cayley groups; inside "four 10-cycles"
  undecided after blocking the graph's 96,000 images (3,000,000 conflicts). Calibration (window graphs up to
  isomorphism): (14,5,2) 0 and (16,5,2) exactly 1, both exhaustive by geng; (18,5,2) 0; (20,5,2) ≥ 1; (22,6,3) ≥ 25;
  (23,6,3) ≥ 63 — the count collapses as the tightness rises. NO eigenvalue argument forces α ≥ 10 (Hoffman and
  inertia are upper bounds). Spectrum of the one graph recorded (integral characteristic polynomial).
- SLOTS (operator: equal weight): R(3,10) keeps Astra E (G20) and Astra D (next: the 246 survivors); C's next
  experiment and G21's (split the 80-variable UNSAT by orbit rows) wait for a free R(3,10) slot.

## Added 2026-11-25 01:01 UTC — gate W1 (the rigid window, symmetric classes): PASS (control room)

- round5/window3/ (a Claude agent; about 1 core-hour; report by message; summary.tsv, parts-*.tsv, complete.out).
  Every SAT step has an LRAT proof accepted by lrat-check AND cake_lpr; the completeness of each split is checked two
  ways (a separate C enumerator of the rows, and a SAT completeness check with its own LRAT proof; negative controls
  SAT); calibration exact at (16,5,2) [the Clebsch graph alone], (18,5,2) [empty], (20,5,2) [its one graph],
  (22,6,3) [the known 11^2 graph], and at (40,9,3) itself in the 5^8 family [G found].
- PROVED (with REASONED steps: the canonical-form reduction for all; lex-leader for 5^8 and 4^10; "least class" for
  4^10): in W(40,9,3) — 9-regular, triangle-free, 40 vertices, every non-adjacent codegree in 1..3 — every graph
  invariant under a permutation of cycle type 10^4 or 5^8 is isomorphic to G (α = 10, 281 independent 10-sets), and
  NO graph is invariant under one of type 8^5 or 4^10. Since α(G) = 10: NO 9-REGULAR (3,10;40)-GRAPH WITH LARGEST
  CODEGREE 3 HAS AN AUTOMORPHISM OF CYCLE TYPE 10^4, 5^8, 8^5 OR 4^10.
- Open: 2^20 (part 0 undecided at 600 s; part 1 UNSAT), mixed cycle types, and the asymmetric case — the real question.
  NEXT, same agent (gate W2): 2^20 by a second split; the prime-order types; then the asymmetric case by a split on one
  vertex's 2-neighbourhood, calibrated where members are known (all 25 classes at (22,6,3) must come back). PASS =
  W(40,9,3) = {G}, which would EXCLUDE the stratum c* = 3.

## Added 2026-11-25 01:09 UTC — gate G20 (the cover test's transfer rate): FAIL — no small finite cause (control room)

- round5/astra-reach/REPORT-5.md (Astra; ended 01:09 UTC). The 9,182 training hosts gave 9,084 canonical FIXED
  obstructions (partial graphs with one fixed inequality, inclusion-minimal); THE TYPICAL OBSTRUCTION COVERS ONE HOST
  (5,078 entries have a single possible host up to isomorphism). On 4,160 FRESH held-out hosts (every one exactly
  infeasible): the best 200 entries cover 1,859 (44.7%), the whole dictionary 1,972 (47.4%); the gate needed 90%.
  The leading entry alone covers 1,251 held-out hosts (a 30-vertex, 16-edge signed pattern with five marked sets);
  coverage RISES with distance from the training set. A smaller local family (19 minimal obstructions on the
  vertices anticomplete to a priced vertex's neighbourhood, plus one rule) caught 2,087 of 4,096 further hosts
  prospectively. Controls: 1,722 of 1,722 roots of graphs that exist, zero false exclusions.
- The universal containment statement for the 9,084 entries is FALSE: host 3740 (30 vertices, 99 edges, α = 8,
  minimum degree 6) contains none, yet is itself infeasible.
- RULING: the per-card gluing test stays the strongest evidence of the day (no feasible card among about 17,000 by
  two programs; every held-out host infeasible), but it has NOT been reduced to a short list of causes: as a ROUTE it
  is the census again unless a structural lemma replaces the dictionary. Not continued in this form; Astra E's slot
  moves to the second program for W1 (the lane's rule: nothing is cited before a second program).

## Added 2026-11-25 01:50 UTC — two second programs: G16 audit CONFIRMED 35 of 35; W1b CONFIRMED 4 of 4 (control room)

- G16 AUDIT (round5/audit-g16/, an Opus agent with its own code; claims frozen in CLAIMS.md at 23:19 UTC from the
  report's text before any claimant program or receipt was opened; about 1.7 core-hours; CLAIMANT-INPUTS.sha256 pins
  the 20 claimant files read, SHA256SUMS its 92). "G16: CONFIRMED 35 of 35", by its own routes, not the claimant's steps.
- THEOREM, NOW ON TWO PROGRAMS: a maximal triangle-free graph on 40 vertices with α ≤ 9 has AT MOST TWO VERTICES OF
  DEGREE 6. Premises: R(3,7) = 23, R(3,8) = 28, and the completeness of McKay's (3,8;27) list (477,142 graphs). No
  single-root floor, no P66, no Chen roster, no (3,7;22) list. Maximality is needed (degree range, S ≥ 48, L1, L2's
  existence half, the private-cell identity, the T-to-root condition); at 39 vertices the count gives S ≥ 46 and L1
  fails, so it is not a general (n, a) statement.
  - Adjacent case (src/adjcase.c, all 477,142 cards, 173 s): 1,511,107 marks, 12,426,161 compatible pairs, 0
    four-cliques; the claimant's 1,512,239 / 12,427,661 / 0 reconcile exactly (the audit adds the valid slack filter
    L_U ≤ 3). Positive control: without the pair 7-set test the same code finds 24,995 four-cliques on 300 cards.
  - Independent case, distinct centres (src/ijoin.c): 625 cards have a degree-4 vertex (one each; 71 puncture
    classes, all among the 191 published (3,7;22)-graphs); 747 labelled extensions, 262,964 marks, 160 triples under
    d ≤ 9 on T; all 160 die by maximality (a vertex of T with no neighbour in N(u_i)); a Python re-check agrees.
  - Common centre: one degree sum (2t + X1 + X2 + X3 + |W| ≤ 189, |W| ≥ 4 by L1) against 3X + 2t ≥ 186 on every
    degree-5 vertex of every card — MARGIN ONE, and it needs L1; the full join agrees (0 pairs).
- (2,7,0,31): CONFIRMED with f6 = 122 (Angeltveit's 14,395, GR Table 14, the G8 certificates): parity at both lows;
  e(K) ≤ 89 by a re-proved matching bound; exactly 66,188 cards with 86–89 edges; src/oddkey5.c searched 957,650,688
  nodes, ZERO shores (none completes five rows); completeness checked against a nested-loop brute force on 4 cards
  (0 of 3,519 / 1,150,266 / 2,263,504 / 2,782,924 missed). Two bugs in the audit's own search were caught by these
  checks and fixed before the full run.
- TOTALS CONFIRMED: 273 of 519 (109 of 355); survivors 246 = 166/45/35 at n6 = 0/1/2, key sets equal to the
  claimant's (compare_keys.out). Sensitivity: without (2,7,0,31) 272; without n6 ≤ 2 (G8b alone) 238; all four floors
  withheld 164; at the published minima (118,104,95,86) 164.
- Incidence moments: the seven keys have n6 ≥ 7 and fall to n6 ≤ 2 with no floor; L6 itself is NOT AUDITED; the
  earlier audit's 1 and 15 were a weaker system, not a counter-claim.
- Not audited (by the report's own account none excludes a key): the claimant's independent-case pipeline, h_i ≤ 2 +
  s_i, the lower slack charge, E_i ≤ 89 for three-root banks, the tight degree-9 pairs, the 546 shores, the 541 cubic
  templates, the neighbour-pair LP, criticality. Single sources: McKay's 27-list (all 35), Angeltveit (the 35th and
  the 238). The audit's programs carry no LRAT-type certificates; they are validated by controls and brute force.
- Controls: 24 general statements on 1,787 graphs (both 39-vertex graphs, C35, (3,9;35), all (3,7;22), (3,6;17),
  (3,5;13), (3,5;12), (3,4;8), 590 of (3,8;27), 596 of (3,7;21), maximalized where needed): 0 violations. A random
  walk on maximal (3,10;39)-graphs (about 1.1 million steps) never reached a degree-6 vertex; its 4 new 169-edge
  graphs pass all 24 statements.
- RULING: n6 ≤ 2 is now computed by TWO DISTINCT ROUTES — P66 (stage 1 swept twice, stage 2 two encodings; its
  reduction still prose) and the three-lows theorem (two programs). F7 at 273 of 519 is CONFIRMED. NEXT, same agent,
  now a CLAIMANT (gate G23, round5/G23-BRIEF.md, stamped round5/GATE-5k.sha256): the 35 n6 = 2 survivors, first the
  seven tight keys at e = 170; independent of Astra D's G22 until frozen.

- W1b (Astra E, round5/astra-reach/REPORT-6.md, ended about 01:45 UTC; work/w1b/): "CONFIRMED 4 of 4" with its own
  encoding (integer degree signatures, weighted decision diagrams, a separate root-only coverage formula), frozen
  (INDEPENDENT.freeze) before reading the claimant's programs. 10^4: 3,942,400 labelled root neighbourhoods, 14 parts,
  G alone; 5^8: 52,306,250, 12 parts, G alone; 8^5: 10,661,888, 18 parts, none; 4^10: 49,618,944, 9 parts, none. 57
  target LRAT proofs, 115 overall, every one "c VERIFIED" (lrat-check) AND "s VERIFIED UNSAT" (cake_lpr).
  Calibration with NO symmetry assumed: W(16,5,2) = {Clebsch}, W(18,5,2) empty, W(20,5,2) one graph; the 11^2 family
  of W(22,6,3) its known graph. α(G) = 10 and 281 ten-sets by a deletion recurrence and a direct enumeration.
- RULING: W1 is on two programs and is CITED within the lane from now on: no 9-regular (3,10;40)-graph with largest
  codegree 3 has an automorphism of cycle type 10^4, 5^8, 8^5 or 4^10. Open: 2^20, the types with fixed points, and the
  asymmetric case. NEXT, Astra E (gate W1c, round5/RESUME-E6.md, stamped round5/GATE-5j.sha256): every admissible
  prime-order type with at most 10 fixed points, 2^20 first (it must return G: Aut(G) contains the 10^4 permutation,
  so it is cyclic of order 10 with a fixed-point-free involution), independently of the window3 agent's W2 until
  frozen. Every graph with a nontrivial automorphism has one of prime order, so W1c + W2 together aim at "every
  symmetric member of W(40,9,3) is G".

## Added 2026-11-25 01:56 UTC — gate S1 (row N11, the finite-n sum-of-squares ladder): FAIL — DEAD for 40 (control room)

- round5/sos-finite/ (a Claude agent; WORKLOG.md, results-own.tsv, fs/results.txt, SHA256SUMS over 154 files; about
  2.7 core-hours, peak 4.4 GB). Julia 1.10.10 (tarball sha256 matches the published one), FlagSOS 0.1.2 at 39caac2e,
  Hypatia 0.11.1 in Float64; certificates rounded (Q = RR^T/10^18, PSD by construction) and checked in exact
  rationals; a third program (check/verify_cert.py, pure Python Fractions, its own decoder and canonical form)
  re-derives the pure-SOS certificates. The level-m hierarchy uses the exact finite-n overlap law.
- LADDER: (6,3) closes at level 3 (FlagSOS and the agent's program agree, to 0.1 = K3,3 at level 6; (5,3) open).
  (18,6) CLOSES at level 7 (exact b = 73752280777963376131/29238300000000000000000000 ≈ 2.52e-6, reproduced exactly
  by the Python checker; FlagSOS 2.57e-6 at tight tolerances), at level 6 only with the rooted caps as PSD
  localizing matrices (degree caps AND all caps j ≤ 4 together; no single family does it); (17,6) stays open with the
  same caps. (23,7) OPEN at levels 7, 8 and 9 in every variant (plain, 6-regular, caps, PSD caps, integrality, mixed
  parity); level 9 solved on 404 of 443 reduced components, the rest PSD to −5.4e-9. (28,8) open at level 8. Every
  control open ((22,7), (27,8), (16,6) with its 11 real 5-regular graphs).
- Not established: no result at 40 or 41; level 10 (the first that can see an independent 10-set: 12,172 graphs, 24.4M
  block entries) not attempted; every "open" is floating-point evidence (objective |value| ≤ 2e-8), feasibility never
  certified; three certificates checked by the Julia checker only; the 7-regular program has no real control.
- Why it fails: the (23,7) level-8 open point has average degree 5.917 with variance 0.118 (impossible for integer
  degrees in [5,6] at that mean) — and it is NOT a real graph one level down: the exact profiles of all 10 six-regular
  (3,7;22)-graphs are infeasible at n = 23 (eigenvalue −1.4e-4) and feasible at 22. A pseudo-density, a fourth phantom.
- RULING: S1 FAIL; N11 DEAD for 40 — through level 9 with every rooted, regular and integrality constraint stated it
  fails the twin (7,23), three rungs easier, and the lowest level that states the 40-vertex problem is beyond the Mac.
  The freed Claude slot is NOT refilled with an R(3,10) job now (the Mac's load is about 14 on 8 cores); it is kept
[line 951 withheld from the public copy: another private project or private correspondence]

## Added 2026-11-25 02:08 UTC — LANE 41 OPENED (the search for a (3,10;40)-graph) on the operator's word (control room)

- "let's open a lane on 41" (operator, ~02:05 UTC). Folder lane41/ (PRIVATE); its own rows A1–A5 in lane41/LANE.md.
  R(3,10) <= 41 is published, so ONE (3,10;40)-graph makes R(3,10) = 41. Every gate there is a search whose PASS is a
  witness checked by two alpha programs; a FAIL returns its nearest miss and any class it excludes with LRAT (which
  counts for the 40 side as well).
- STARTED: A1 the scout (a Claude agent with web access, lane41/SCOUT.md); A2 (a Claude agent, gate lane41/A2-BRIEF.md
  stamped lane41/GATE-A2.sha256 at 02:08 UTC): one-vertex extension of every 39-vertex Ramsey graph on disk and a grown
  pool, all circulants and Cayley graphs of order 40, SAT under each fixed-point-free permutation type; calibrated at
  (3,9;35) and (3,8;27). QUEUED: A3 (the windows at caps 4-6), A4 (inside the 246 patterns), A5 (a learned proposer).

## Added 2026-11-25 02:21 UTC — row N29 (the probabilistic method) DEAD by arithmetic; gate M1 (the switching monovariant) started (control room)

- N29: lower bounds on the independence number of triangle-free graphs (Shearer). At 40 vertices, degree 9:
  Shearer's recursion f(0) = 1, f(d) = (1 + (d^2 - d) f(d-1)) / (d^2 + 1) gives 40 f(9) = 7.850 (the closed form
  (d ln d - d + 1)/(d - 1)^2 gives 7.359). So alpha >= 8; the proof needs 10. DEAD with a margin above 2 (COMPUTED here,
  one line of Python; the hard-core occupancy refinements are asymptotic and no stronger at d = 9 — REASONED, not checked).
- M1 (operator: "start monovariant", ~02:17 UTC): row N16 attacked as a monovariant. Round 1's B5 is the dead special
  case (edge count + one-vertex switch: no raising move for 8 of 8 non-max (3,7;22) and 2,867 of 3,000 (3,8;27)).
  M1 measures, exactly on McKay's complete catalogues ((3,6;16), (3,7;21), (3,7;22), (3,8;27)): plateau reachability
  of the vertex-switch graph, and the local maxima of four potentials x four move families. PASS = a pair with zero
  local maxima everywhere. Brief round5/M1-BRIEF.md, stamped round5/GATE-5l.sha256 at 02:20 UTC; a Claude agent in
  round5/monovariant/.

## Added 2026-11-25 02:28 UTC — gate W2 FAIL (cut by the battery guard); lane-41 scout A1 DONE (control room)

- POWER: the Mac went on battery; guard 3 stopped every heavy process at 02:15:32 UTC (30%); at 02:27 UTC 22%, about
  35 min left. Everything continues by itself on mains. Pods unaffected.
- W2 (round5/window3/, report 02:26 UTC): FAIL by its letter — 2^20 not closed (part 0 reduces to ONE sub-part by an
  explicit group element, checked by SAT with LRAT; that sub-part UNKNOWN at 1,200 s), the order-2 and order-3 types
  with fixed points not closed (3^13 1 and 2^19 1^2 UNKNOWN at 300 s), the asymmetric split at (40,9,3) never counted.
  PROVED on the way (REASONED lemmas, LRAT where computed): in W(40,9,3) no automorphism of prime order >= 11; NONE of
  order 7 (7^5 1^5 UNSAT, 2,451,770 lines, both checkers); every order-5 automorphism is fixed-point-free, so with W1
  every member with an automorphism of order divisible by 5 is G; hence every member other than G has |Aut| = 2^i 3^j.
  Calibration of the asymmetric split: (16,5,2) Clebsch, (18,5,2) empty, (20,5,2) exactly its one graph (now EXACT by
  both completeness checks); (22,6,3) 18,400 of 32,426 configurations decided, exactly the 25 known classes so far.
  Single-source until W1c (Astra E, independent) reports on the same prime orders.
- A1 SCOUT (lane41/SCOUT.md, 02:23 UTC; 15 searches): extending known 39s is PUBLISHED AND NEGATIVE (Goedgebeur-
  Radziszowski 2012: 37M+ (3,10;39)-graphs, none extends; Angeltveit 2025: >= 43,225,483, none extends; a 2026 public
  agent repo: 18.4M, none). Circulants settled (Harborth-Krause 2003; survey DS1.18 of 24 Apr 2026). Cayley graphs of
  order 40: excluded in that repo, unrefereed. OPEN in print: the fixed-point-free classes (2,0) = 2^20 (which closes
  40^1, 20^2, 10^4, 8^5, 4^10 as powers) and (5,0) = 5^8 (124 cubes open after about 105 core-hours elsewhere).
  Nearest published misses: Exoo's 810 forty-vertex graphs with exactly ONE triangle and no independent 10-set
  (EJC 2013, data not public); on the independent-set scale 23-24 ten-sets (the repo), against our window's 281.
  Angeltveit: "The obvious conjecture is that R(3, 10) = 40. But ... we are not confident in this prediction."
- RULING: A2 is redirected off the duplicates (mass extension, pool growth, circulants) to the open classes in a NEW
  restriction: 9-REGULAR witnesses (any codegree) with a fixed-point-free involution or order-5 automorphism. A3 and A4
  are new in scope; A5 only inside unsearched classes.

## Added 2026-11-25 02:28 UTC — gate P4 (the 2K_2 root at c* = 4): PARTIAL 10 of 120; the theorem CONFIRMED; the placement route DEAD as stated (control room)

- round5/c4-2k2/ (a Claude agent; about 2.7 core-hours; SHA256SUMS 149 files; none of the claimant's programs opened).
- THEOREM CONFIRMED by a second derivation (REASONED; one premise e(3, K9-2K2, 24) = 72, Goedgebeur-Radziszowski EJC
  20(4) #P19 Table 14, read on the rendered page — and NOT the R(3,k) paper's Table 14, a citation trap noted): in a
  9-regular (3,10;40)-graph with largest non-adjacent codegree exactly 4, every codegree-4 pair {u,w} gives an
  independent 7-set J containing w and a codegree-4 partner of w whose antineighbourhood induces 2K_2. The general
  (n,d,a,c) form FAILS on Clebsch, C13 and a (3,5;12) graph, so the result rests on the threshold 72. Threshold
  falsification on 477,160 graphs on 24 vertices: 0 lack the 9-set.
- PLACEMENT: 120 private-multiplicity decks (two programs, byte-identical lists); 10 REFUTED with LRAT through both
  checkers (every deck with five 3s; 3333333 also by hand) — in a RELAXATION (codegree cap only on pairs meeting J u D).
- THE KILL: a REAL 40-vertex graph (local-model-deck0000000.g6; 9-regular, triangle-free, codegrees 0..4, alpha = 11)
  has a 2K_2 root J whose one-point and two-point cards are ALL legal. So "all one- and two-point deletion constraints
  at once" has a model and CANNOT exclude c* = 4 — the local-rules wall (N22) again, one level up.
- RULING: N28 PARTIAL; the placement with 1- and 2-point cards is DEAD as stated; the 3- and 4-point extension
  (more than 1,500 s per deck, 120 decks) is QUEUED, not started — the Mac is on battery and it is the census shape.

## Added 2026-11-25 02:32 UTC — outside suggestions on the monovariant (Grok, Neon, GPT, pasted by the operator): screened; M1 amended (control room)

- ALREADY IN THE LANE: counting the degree patterns with residual floors (Angeltveit's weighted-deficit method) = F7,
  273 of 519; mining the catalogues = M1; one-neighbourhood replacement (independent S hitting every independent 9-set
  of G - v) = round 1 B5, dead (95.6%); plateau paths and two-vertex replacement = M1 (1)-(2); WLOG maximal + degrees
  6..9 (stronger than the suggested delta >= 5).
- WRONG: "Hoffman forces alpha >= 10 above a variance threshold" (Hoffman bounds alpha from ABOVE; G21: no eigenvalue
  argument forces alpha >= 10); "generate only regular graphs, non-regular patterns ignored by construction" (valid
  only after the reduction is proved); "the successful switch sequences are known from the catalogues" (the catalogues
  show max-edge members exist, not paths; round 1 found single switches stuck 95.6%).
- NEW, ADOPTED into M1 by message (02:32 UTC): tables split by deficit D, the D = 2 levels first (both D = 2 keys
  (0,0,2,38) and (0,1,0,39) survive at 40; 13 survivors have 177-179 edges; survivors span 162-179 edges); the
  critical-edge lemma (one deleted critical edge cannot be repaired by additions in a saturated graph; argument checked
  by the control room, to be verified on the catalogues); the slide G - uw + uv with Delta(sum d^2) = 2(d(v) - d(w) + 1);
  the partial target "no vertex of degree <= k - 3"; alternating slide chains (Kempe style) as T(iv).
- NOTED for lane 41: tunnelling through ONE-TRIANGLE graphs (Exoo's 810 forty-vertex graphs with exactly one triangle
  and no independent 10-set are the nearest published miss) — row A6, queued.

## Added 2026-11-25 02:50 UTC — gate M1 (the switching monovariant): FAIL; THE R(3,10) LANE IS FROZEN (control room)

- round5/monovariant/ (a Claude agent, frozen 02:48 UTC on the operator's freeze; FROZEN-M1-2026-11-25.md). Controls
  PASS (the switch generator lands only inside the catalogues; B5 re-derived: 8 of 8, 2,867 of 3,000; the amendment's
  critical-edge lemma and slide claim hold with 0 violations on millions of tests).
- KILL (COMPUTED): in (3,7;22) six members cannot reach a 66-edge member by ANY sequence of two-vertex switches and
  edge moves removing <= 3 edges, in either direction — so NO potential has zero local maxima for T(i), T(ii),
  T(iii)_{r<=3} or their union. Nearest miss: Phi(d) = (e, -#critical edges) with T(iii)_3: 0 local maxima on
  (3,6;16), 4 on (3,7;22), 57 on the first 1,129 of (3,8;27). Plateau reachability under one-vertex switches fails at
  scale: (3,8;27) has 26,672 members that cannot reach the top. Local maxima sit at D = 2-3, where ~94% of edges are
  critical; low degrees are NOT the obstacle (Phi_low has 0 local maxima on (3,6;16) and (3,7;22)).
- RULING: M1 FAIL; N16 as a bounded-move monovariant is DEAD (six closed (3,7;22)-graphs). Not run (frozen): r = 4 moves
  from the six, the big classes under T(ii)/T(iv). The partial target "no degree <= k-3" survives as a lead (Phi_low).
- FREEZE (operator, ~02:46 UTC: "freeze other fronts and focus full power" on the openai/math nine-fourths audit):
  every R(3,10) and lane-41 agent and both Astra runs stopped at clean points with FROZEN-*.md resume notes.

## Added 2026-11-25 05:27 UTC — gate G22 (the 246 non-regular survivors): FAIL 1 more (control room)

- Astra D (round4/astra-nonregular/REPORT-5.md, resumed after the freeze, ended 05:26:59 UTC; work/g22/). "G22: FAIL 1
  more". The one new exclusion: (0,16,0,24), by agreement between views — the floors f7 = 108 and f9 = 86 force exactly
  48 edges between the degree classes, each high vertex has two low neighbours, and two programs of Astra's own exhaust
  all 541 low templates and their cubic incidences (670,973 leaves; five pass the single-row tests; none admits reciprocal
  rows). Premises: maximality, alpha <= 9, small Ramsey orders, the double-generated low-template census; no P66, no
  degree-6 or degree-8 floor. SINGLE-SOURCE (both programs are Astra's) until a second program re-derives it.
  Cumulative 274 of 519; 245 survive (165/45/35 at n6 = 0/1/2).
- Also, at the supported floors f7 = 108, f9 = 87: n7 <= 15 globally (1,469 parity-admissible keys with >= 16 sevens:
  1,427 by degree-class cuts, 41 by exact integer certificates, 1 by the shared-row proof); at f9 = 86 two keys outside
  the roster stay open. With the single-root floors removed, zero new whole keys.
- What each candidate statement would remove (computed before searching): n7 <= c for c = 0..16 removes 211, 180, 151,
  125, 101, 81, 64, 51, 40, 31, 23, 16, 10, 6, 3, 1, 0 of the 246; "no two sixes with one seven" removes 27.
- RULING: FAIL as stated (1 < 10). NEXT (G24, Astra's own proposal): the (0,4,28,8) profile by marked 26-vertex
  exteriors in edge layers 76–81 whose opposite exteriors agree on their 16 shared vertices.

## Added 2026-11-25 06:07 UTC — M1's last experiment (r = 4 moves): the six closed (3,7;22)-graphs stay closed (control room)

- round5/monovariant/R4-RESULT-2026-11-25.md (the M1 agent, 05:02–06:04 UTC, ~32 CPU-min). Every edge move removing
  <= 4 and adding <= 5 edges that stays in the class: 212 valid moves (36 arcs, 0 bugs), all landing inside the six; the
  r <= 3 part matches the earlier run exactly. So none of the six is freed up to r = 4, whether or not e may fall on the
  way. In (3,8;27): of the 57 local maxima of Phi(d) among the first 1,129 members, 40 have a raising move at r = 4 (31 by
  adding edges), 17 have none up to r = 4 (local sense only; the class's move graph was not built).
- RULING: M1 stays FAIL; N16 as a bounded-move monovariant is DEAD through r = 4 on (3,7;22).

## Added 2026-11-25 07:27 UTC — gate G23 (the 35 n6 = 2 keys): FAIL 0 more (control room)

- round5/audit-g16/ (the auditor turned claimant; G23.freeze 07:26 UTC; ~2 core-hours). No key excluded. The tight
  NON-ADJACENT case of the seven e = 170 keys is searched on 15,000 of 66,188 eligible cards (cards 1–55,056): 0 shores,
  1.29e9 nodes, (2,7,0,31) staying at 0 as regression; completeness against two brute forces on sample cards (0 missed in
  6 jobs), positive controls fire; nearest miss a 4-row partial shore (21 of 24 points) at q = 6. Premises: H0, L1, L2,
  R(3,7), R(3,8), McKay's (3,8;27) list, f6 = 122 (no other floor, no P66). The tight ADJACENT case has no 27-vertex frame
  (e.g. (2,0,14,24) has no degree-7 vertex; e(3,9,28) = 68 < 86 does not close it). Slack keys not started. Background QoS
  ran ~5.6x slower than foreground (0.32 vs 0.057 s per card).
- RULING: FAIL as stated. NEXT (G25): find a frame for the adjacent case first (the remaining 51,188 non-adjacent cards,
  ~50 min at normal priority, are run only once the adjacent case has a frame).

## Added 2026-11-25 07:33 UTC — gate G25 (a frame for the tight adjacent case): FAIL 0 more (control room)

- round5/audit-g16/G25-CONDITIONS.md (under a minute of CPU). For no key does every adjacent configuration force a
  27-vertex frame. New lemma (REASONED, degree sequences checked over all 1,024 graphs on 5 vertices): d(a0) != 7 and
  d(b0) != 7, so a0, b0 never give a frame. A frame from a degree-7 double is impossible for (2,0,14,24), possible but never
  forced for the others. Missing: a lemma forcing a degree-7 double, or complete (3,8;25) / (3,8;26) lists at the needed
  edge counts (GR2013 Table 13 is complete only to (3,8;26,77), (3,8;25,68)).
- RULING: FAIL. NEXT (G26, the agent's proposal): prove that the adjacent tight case of (2,6,2,30) forces a degree-7
  double (its only configuration: 4 degree-7 and 24 degree-9 vertices in X); 1 hour.

## Added 2026-11-25 07:36 UTC — gate G26 (force a degree-7 double in (2,6,2,30)'s adjacent case): FAIL; the n6 = 2 line PARKED (control room)

- round5/audit-g16/G26-CONDITIONS.md (seconds of CPU). Neither proved nor refuted. Computed: the doubles graph on A is
  unique (degrees (2,3,3,4,4), one labelled realisation), so the 8 doubles at u and at w are fixed; every count (n22 = 0..8;
  ~79 incidences needed against 220 - n22 available) leaves room for all four degree-7 vertices of X to have one A- and
  one B-neighbour; everything further depends on the edges of a 28-vertex graph (alpha <= 8, 86 edges) no catalogue lists.
  The residual configuration is written out exactly in the report.
- RULING: FAIL. Three gates in a row on this line (G23, G25, G26) ended with "not forced"; the residual is, in the
  agent's words, "essentially a (3,10;40)-graph". The n6 = 2 line is PARKED with its next experiment named (an exhaustive
  search over trace types of X's four degree-7 vertices for a non-adjacent pair with 3 common neighbours; no catalogue
  needed). Reopen only with a new idea or spare capacity.

## Added 2026-11-25 07:41 UTC — gate G24 ((0,4,28,8)): PASS 1 more, 275 of 519 (control room)

- Astra D (round4/astra-nonregular/REPORT-6.md, 05:27–07:40 UTC; work/g24/). (0,4,28,8) EXCLUDED: for opposite degree-7
  vertices v, w on the low four-cycle, the exterior R = G - N[v] (32 vertices, 108 edges) must leave an independent
  dominating five-set after deleting N_R[w]; over the complete 32/108 layer (2,104,151 classes, verified by membership and
  Traces, matching the published count) the degree test leaves 12 root choices in 10 classes, and in every puncture the
  best independent five-set leaves exactly two vertices undominated (two programs agree) — so no exterior even reaches the
  overlap test. Premises: floors 108, 97, 87 (supported), maximality; no P66, no floor 88. SINGLE-SOURCE (both programs
  Astra's) until re-derived by another author. 244 survive.
- NEXT: (G27, Astra's proposal) the general degree-7 attachment test on the complete 32/108 catalogue — if no card admits
  the seven neighbourhood rows, the degree-7 floor rises from 108 to 109; and an AUDIT (a Claude agent, its own code) of
  the two single-source exclusions (0,16,0,24) and (0,4,28,8).

## Added 2026-11-25 08:25 UTC — lane 41, gate A2 (as amended): FAIL — no witness; Cayley graphs of order 40 EXCLUDED with LRAT (control room)

- lane41/a2/ (a Claude agent; 4 h 06 min wall incl. the freeze). No (3,10;40)-graph found. CERTIFIED NEGATIVES: (1) none
  of the 258 distinct 39-vertex Ramsey graphs on disk (165–172 edges) extends by one vertex — 258 UNSAT, each LRAT through
  lrat-check and cake_lpr, the CNFs checked clause by clause; nearest miss 50 unhit 9-sets (published best 23);
  (2) no Cayley graph on any of the 14 groups of order 40 (C40, i.e. circulants, included), any degree, is a
  (3,10;40)-graph — LRAT through both checkers for all 14, plus exhaustive enumeration. Calibrations: (3,9;35) and all
  477,142 (3,8;27) graphs do not extend; 1000/1000 deleted (3,8;27) graphs re-extend; C35 recovered; K2 (the five
  6-regular (3,7;22) graphs with a fixed-point-free involution) and K3 ((3,9;35) under 5^7) PASS.
- UNDECIDED at the 60-min cap: 9-regular witnesses invariant under 5^8 and under 2^20 (no model, no UNSAT); the 2^20
  engine FAILED its calibration K1 ((3,9;35) under 2^17 1^1 not found in 3 tries) — a speed problem (Python callbacks for
  the independence check), not an encoding error (the planted graph satisfies the CNF).
- RULING: FAIL by the letter (0 types excluded); the Cayley LRAT result and the pool LRAT result stand. NEXT (A2b): a C
  propagator for the independence check, K1 within 10 min, then the two 40-vertex classes from the saved CNFs.

## Added 2026-11-25 09:04 UTC — gate W1c (the remaining symmetric types of W(40,9,3)): FAIL 8 of 12 types decided (control room)

- Astra E (round5/astra-reach/REPORT-8.md, resumed after the freeze, ended 09:04 UTC; w1c/, frozen independently of W2).
  Proved (REASONED, with the computations named): primes >= 11 impossible; for p = 5, 7 all fixed degrees are 9 - p, so
  order 5 acts freely and order 7 leaves only a pentagon fixed graph; admissible fixed-point counts f even 0..20 for
  involutions, f = 1, 4, 7, 10, 13, 16, 19 for order 3. Aut(G) = C_10 by exhaustive search; G's only prime types are 2^20
  and 5^8. DECIDED (LRAT): 5^8 = {G}; EMPTY: 3^13 1, 3^12 1^4, 3^11 1^7, 3^10 1^10, 3^9 1^13, 7^5 1^5, 2^16 1^8, 2^15 1^10.
  OPEN: 2^20 (contains G; in its all-double branch 2,764 of 2,787 skeletons excluded, 23 left; other branches open),
  2^19 1^2, 2^18 1^4, 2^17 1^6 (and below the gate, 2^14 1^12, 2^13 1^14).
- With W2 (single program; order 7 and the order-5 / prime >= 11 lemmas agree with W1c): every member of W(40,9,3) other
  than G has an automorphism group whose prime orders are 2 and possibly 3 (order 3 only with 16 or 19 fixed points).
  The involutions are the remaining symmetric core.
- RULING: FAIL by the letter (8 < 12); the decided types are cited after the comparison with W2 (both programs agree on
  5^8 and 7^5 1^5). NEXT (Astra E's proposal): the 23 all-double skeletons of 2^20, keeping the actual matching phase
  shared by overlapping charts; for the asymmetric case, root at an edge on the most squares (128 patterns with >= 13,
  else 25 more) — W2b's count decides whether that is affordable.

## Added 2026-11-25 09:14 UTC — lane 41, gate A2b: FAIL (K1 not found in 10 min); the symmetric-SAT line PARKED (control room)

- lane41/a2/b/ (08:26–09:14 UTC, < 1 core-hour). A C++ CaDiCaL external propagator for the independence check
  (src/symprop.cpp; 8,300–25,700 checks/s, 3–5x the Python engine; the profile puts the time in CaDiCaL's own
  propagation). K2 reproduced in 2.7 s (116 models, exactly the 5 classes); K3 reproduced (44 s); K1 ((3,9;35) under
  2^17 1^1) NOT found in two 600 s runs nor in cube probes — search power, not encoding (the planted graph satisfies the
  CNFs). No 40-vertex run started (the brief's gate held).
- RULING: FAIL. With the 35-vertex calibration out of reach, the 9-regular 5^8 / 2^20 classes at 40 are PARKED; the next
  experiment is named (deeper cube-and-conquer: the root and its first neighbour cycle; K1 counts only when the cube holding
  a known labelling is solved within 10 min; cover CNF with LRAT). Lane 41's standing results: the 258-graph pool and all
  14 Cayley groups of order 40 excluded with LRAT.

## Added 2026-11-25 09:16 UTC — gate G27 (raise the degree-7 floor): PASS — f7 >= 109, 8 more keys, 283 of 519 (control room)

- Astra D (round4/astra-nonregular/REPORT-7.md, 07:41–09:16 UTC; work/g27/). NEW FLOOR: in a maximal triangle-free
  40-vertex graph with alpha <= 9, a degree-7 vertex's exterior (32 vertices) has at least 109 edges. Each neighbour of the
  root gives an independent dominating row in the exterior; maximality forces the rows to cover every vertex and every
  non-adjacent pair with no common neighbour in the exterior; a vertex can be in at most 9 - deg_H(x) rows; this relaxed
  cover is impossible on every one of the 2,104,151 cards of the 32/108 layer (rejected by two programs, C++ and C; a
  dense-nauty replay verifies the catalogue against the published count). Controls: all 36,415,821 roots of the
  maximalized real graphs accepted; both order-39 graphs and C35 accepted; a planted 32-vertex card at the target
  parameters accepted, its seven rows giving a 40-vertex graph with an exhibited independent 10-set. No P66, no other
  single-root floor.
- STAKES (computed before the search): at f7 = 109 with the supported floors 8 keys fall — (0,1,30,9), (0,2,30,8),
  (0,3,28,9), (0,10,14,16), (0,11,12,17), (0,12,10,18), (0,15,0,25), (0,15,2,23); each transfer has a hand proof needing
  no f6. Cumulative 283 of 519; 236 survive. SINGLE-SOURCE (both programs Astra's) until AUD-2 re-derives it.
- NEXT (G28, Astra's proposal): f7 >= 110 — the 109-edge cards containing a degree-4 vertex reduce to the common
  exterior of two roots, of order 27, so McKay's complete (3,8;27) list gives the starting point.

## Added 2026-11-25 09:37 UTC — gate W2b (measure the asymmetric case of W(40,9,3)): FAIL; the asymmetric classification PARKED (control room)

- round5/window3/ (W2b, report 09:37 UTC). DECIDED IN FULL by the asymmetric split (every batch UNSAT with both
  checkers; two enumerators give the same canonical forms): W(22,6,3) = exactly the 25 known classes; W(23,6,3) = 91
  classes — the 63 known plus 28 NEW (all 6-regular, triangle-free, codegrees in {1,2,3}; alpha 8: 38, alpha 7: 53; none
  with alpha <= 6, consistent with R(3,7) = 23). Single program for the SAT part; completeness rests on the two
  enumerators agreeing and on a REASONED relabelling step.
- (40,9,3): NOT countable by two programs (genbg refuses n1 = 30; genbgL emitted nothing in 30 s). Certified LOWER bound:
  119,753 configurations (cfgenum, re-checked independently); a biased 50-part sample costs 8.96 s per part, so at
  least ~298 core-hours, probably far more. Coarser split C1 (the codegree profile inside N(v)) is 6.5–8x smaller at
  22/23; its count and part cost at 40 unmeasured.
- RULING: FAIL. The asymmetric classification of W(40,9,3) by these splits is a census (>= 298 core-hours, likely much
  more) — PARKED under the lane's rule. Kept: W(23,6,3) = 91 classes (28 new) as a calibration fact, single-source until a
  second program; the C1 split named for a future attempt.

## Added 2026-11-25 11:26 UTC — audit AUD-2 (a Claude agent's own code, no shared code with Astra): CONFIRMED 2 of 3 (control room)

- round5/audit-aud2/ (report 11:09 UTC; SHA256SUMS 534908a4…, 97 files). Premises: H0 everywhere; f7 = 108, f8 = 97,
  f9 = 87 (G8, supported, not re-derived); the published 2,104,151 count at 32/108 (GR2013 Table 14); no P66, no f6.
- **B, G24 (0,4,28,8): CONFIRMED by a second program** (src/b_check.c over all 2,104,151 cards: 12 roots pass the
  degree test, in 10 graphs, 0 with the dominating 5-set — the same 12 roots as Astra's root_flags.tsv).
- **C, G27 f7 >= 109 and its 8 keys: CONFIRMED by a second program** (src/c_cover2.c, MRV exact cover: 0 covers on
  2,104,151 cards, 213 s CPU; all 8 transfers re-derived by hand; the 244-key roster rebuilt from its own G16 verdicts
  equals Astra's, minus the 8 = Astra's 236).
- **A, G22 (0,16,0,24): NOT CONFIRMED in budget — stays SINGLE-SOURCE.** 16,467 of 16,829 low graphs L excluded by its
  own route (all 16,288 non-template L; 179 of 541 templates); 362 templates undecided (a_undecided_final.txt), one ran
  ~2,790 s without a verdict. Every finished L UNSAT; nothing SAT. Its proposal: encode A3's per-high row bound
  |N(h) ∩ (G − N[S])| <= 9 − |S| directly (G6, 0 violations on real graphs).
- Gaps it names: the SAT verdicts carry no DRAT; the 32/108 layer was obtained from Astra's files (verified: 2,104,151
  pairwise non-isomorphic, triangle-free, alpha <= 8), not rebuilt (~5.5 CPU-years per GR2013).
- STANDING: 283 of 519 excluded; of the 10 beyond G16's 273, 9 (G24's 1, G27's 8) by two programs, 1 (G22) single-source.

## Added 2026-11-25 13:18 UTC — gate G28 (f7 >= 110): FAIL (control room)

- round4/astra-nonregular/REPORT-8.md (end 13:17:28 UTC). The DEGREE-FOUR branch of the 32/109 layer is CLOSED
  (REASONED reduction to the common exterior of order 27 → McKay's complete (3,8;27) list; COMPUTED: two generators
  agree on 477,142 cores, 16 unrooted cards, needing 57 or 58 incidences; nearest miss one incidence; 512 vertex
  witnesses checked by a separate checker). Deletable-edge cards: 14,123,432 classes from the published 32/108
  population, all rejected by the primary attachment scan; the independent full replay stopped at 700,000 parents
  BEFORE its final equality check (so this half is single-program). Critical cards: 6,570 classes rejected; the
  five-valent inner-root constructions over the 26/73 and 26/74 layers give 0 and 71 classes, all among the 6,570.
- OPEN: the edge-critical cards of minimum degree 5 or 6 — 59 root types over 11 published seed layers, 80,245,284 seed
  classes, a certified upper bound of ~2.98e34 padded records. No key credited; 283 of 519 stand, 236 survive.
- STAKES (computed first): f7 = 110 removes 6 keys alone — (0,1,28,11), (0,2,28,10), (0,3,26,11), (0,4,26,10),
  (0,5,24,11), (0,6,22,12) — and 10 with f6 = 122, f8 = 97, f9 = 87 (adds (0,8,18,14), (0,9,16,15), (0,13,6,21),
  (0,14,4,22)).
- The missing hourly checkpoint its report names is the control room's pause (every process SIGSTOPped 11:39–13:13 UTC).
- NEXT (G29, Astra's proposal): fix a largest private row and the disjoint independent 7-set witnessing its root edge's
  criticality; enumerate the matchings of that row and the other private centres into the labelled 7-set first, then
  require both outer views to agree there; every remaining root type leaves at most 12 vertices outside row + witness.

## Added 2026-11-25 13:21 UTC — gate W1d (the fixed-point-free involution 2^20, which contains G): FAIL 6 of 11 branches (control room)

- round5/astra-reach/REPORT-9.md. Decided EMPTY (LRAT through lrat-check AND cake_lpr): internal-fibre counts 0 (all 23
  outstanding all-double skeletons exhausted; 2,854 in all), 12 (265 skeletons), and 14, 16, 18, 20 (inherited). OPEN:
  2 (2/2 skeletons), 4 (7/7), 6 (24/24), 8 (80/83), 10 (28 of 208 for the gate; contains G: 179 certified empty,
  skeleton 206 yields only G; skeleton 117's last subchart excluded by the solver but both checker lines arrived after
  the deadline). Control: the normalized unsigned quotient of G returns exactly one lift, isomorphic to G (alpha 10,
  281 independent 10-sets). REASONED step (fibre pairing and the shared matching sign across overlapping charts) in
  work/w1d (method file). The checkpoint gap it reports is the control room's pause (11:39–13:13 UTC).
- NEXT (W1e, Astra's proposal): close skeleton 8 by fixing the exterior ports of a third internally adjacent fibre in
  its last open root subchart (8 choices; the first exhausted in 2.5 CPU s with both checkers), then the same refinement
  across the open branches.

## Added 2026-11-25 16:48 UTC — audit AUD-2b (claim A, G22 (0,16,0,24), second program): OPEN, 1 template remains (control room)

- round5/audit-aud2/ (AUD2b-*; 11:26–16:47 UTC minus the 11:39–13:13 pause; ~2.98 core-hours). With the per-high row bound
  |N(j) − N[S]| <= 9 − |S| (R1–R3, re-derived) and mixed views R4 (derived 13:35 before use): 361 of the 362 templates
  UNSAT by the auditor's own code (all at the root; 0 models); template 9518 (O??CAAoIaXJOeOx?Ai@M?) undecided (longest run
  667 s CPU). Claim A stands at 16,828 of 16,829 low graphs excluded by a second program. Nothing SAT; no disagreement.
- Controls: Petersen SAT/UNSAT boundary; 70 small brute-force cases; three planted positives at full size returned
  exactly; each clause family's boundary (rows SAT at alpha <= 11, UNSAT at 10; R4 SAT at 7, UNSAT at 6); 200 earlier
  verdicts reproduced. Not established: no DRAT certificates; premises f7 = 108, e(3,9,30) = 86, R(3,k<=8), geng.
- NEXT (AUD-2c): template 9518 alone, no wall limit, 2 core-hours cap; if it does not finish, cubes on the three high
  slots of one low.

## Added 2026-11-25 17:17 UTC — gate G29 (f7 >= 110, the matching route): FAIL (control room)

- round4/astra-nonregular/REPORT-9.md (13:18–17:17 UTC). The DELETABLE-EDGE branch of 32/109 is now CLOSED by two programs
  (the independent replay reached equality: 2,104,151 parents, 14,123,432 distinct children; of 57 children left by the
  first screen, 31 excluded by direct row checks and 26 by LRAT-checked proofs; premise: GR's published 32/108 count).
  Of the 59 root types of the edge-critical branch (minimum degree 5 or 6), 5 excluded (types 23, 28, 39, 54, 56; two row
  enumerators agree, zero complete row tuples), 54 OPEN (80,245,233 seed classes; upper bound ~2.98e34 padded records).
  New facts (COMPUTED): in such a critical card every degree-7 vertex leaves >= 57 edges outside its closed neighbourhood;
  if a degree-8 vertex leaves 49, every adjacent degree-8 vertex leaves >= 51. The requested matching test does not
  separate the types (every one of 34,698 required-edge patterns embeds). Controls intact. 283 of 519 stand; 236 open.
- NEXT (G30, Astra's proposal): type 52 first — per seed and private incidence graph, maximum matchings (König) give the
  exact largest independent set meeting the seed in a stable set T; each violation excludes a trace assignment.

## Added 2026-11-25 17:20 UTC — audit AUD-2c: CONFIRMED — G22 (0,16,0,24) now rests on two programs (control room)

- round5/audit-aud2/ (AUD2c-*). Template 9518 UNSAT (one run, 16:48:58–17:19:14 UTC, 1,796 s CPU, at the root; a_sat4.py
  unchanged, pinned in AUD2b-SHA256SUMS). The auditor's own code now excludes all 16,829 low graphs of (0,16,0,24).
- STANDING: **283 of 519 excluded, every one of the ten beyond G16's 273 now re-derived by a second program** (G22 by
  AUD-2/2b/2c; G24 and G27 by AUD-2). Not established: no DRAT for the SAT parts; premises f7 = 108 (G8), e(3,9,30) = 86,
  R(3,k<=8), geng's completeness; the claimant's 541-template census not used.

## Added 2026-11-25 17:21 UTC — gate W1e (2^20, the third-root refinement): FAIL 8 of 11 branches (control room)

- round5/astra-reach/REPORT-10.md (to 17:21 UTC). NEW: the 2- and 4-internal-fibre branches EMPTY (130 + 3,442 dual-checked
  LRAT packs; an independent labelled enumeration recovers all 41 skeletons, 7 classes, each closed); skeleton 117's late
  checker lines credited; skeleton 8 closed (all 8 third-root port choices, two generators agree). OPEN: 6 fibres (17 of
  24 skeletons), 8 (56 of 83), 10 (2 of 208: skeletons 174 and 200; G recovered, exactly one normalized lift, alpha 10,
  281 independent 10-sets). Controls exact.
- NEXT (W1f, Astra's proposal): skeleton 174 first — impose the third root's full SIGNED trace per representative and keep
  only compatible port choices (the current join checks an unsigned histogram).

## Added 2026-11-25 20:52 UTC — gate W1f (2^20, the signed trace): **PASS — 2^20 = {G}** (control room)

- round5/astra-reach/REPORT-12.md (to 20:45 UTC; work/w1f-live/). Every member of W(40,9,3) invariant under a
  fixed-point-free involution is G (alpha 10): skeleton 174 closed by the third root's full signed trace (137
  representatives), skeleton 200 by shared physical matchings (618 → 16 charts, each failing its signing test), skeleton
  206 returns exactly G (one normalized lift; blocking it gives a dual-checked exhaustion); the last 42 eight-fibre
  skeletons replayed by a second program written differently (7,182 four-root seeds → the same 77 unsigned tables, every
  one with contradictory sign equations). LRAT through lrat-check and cake_lpr throughout; 281 independent 10-sets of G
  counted two ways. With W1c (5^8 = {G}): the involution type 2^20 is DECIDED. Open types of order 2: 2^19 1^2,
  2^18 1^4, 2^17 1^6 (W1c's list). The existence of a (3,10;40)-graph stays open.
- NEXT (W1g, Astra's proposal): 2^19 1^2 — the two fixed vertices adjacent by degree parity, each meeting four moving
  fibres with disjoint lists; fix those lists, enumerate the double partners, sign the surviving tables.

## Added 2026-11-25 21:19 UTC — gate G30 (f7 >= 110, the König trace test): FAIL, 15 of 59 root types closed (control room)

- round4/astra-nonregular/REPORT-10.md (to 21:19 UTC; work/g30/). Ten new root types closed by the exact trace test
  (the largest independent set avoiding both roots and meeting the seed in exactly T is |T| + a + b + c − ν, by König;
  a second implementation maximises directly; fixed-chart certificates); with the five of G29, 15 of 59 closed; 44 types
  and 625,599,936 seed–type pairs open (two tallies agree). No new key; 283 of 519 stand, 236 survive.
- NEXT (G31, Astra's proposal): type 58 — group its 7,241 open seeds by one-edge-deleted parents (6,038 admit it through
  6,489 marked deletions into the complete 102-parent layer; 1,203 have none); intersect the parent's witnessed nine-sets
  before expanding any child.

## Added 2026-11-26 00:21 UTC — gate W1g (the involution type 2^19 1^2): **PASS — 2^19 1^2 = ∅** (control room)

- round5/astra-reach/REPORT-13.md (to 00:20 UTC 26 Nov; work/w1g/). No member of W(40,9,3) admits an involution fixing
  exactly two vertices (no independence-number assumption used): the fixed pair is adjacent by degree parity, each meets
  four moving fibres with disjoint lists, the cross matrix is simple of maximum degree two; 7,343 matrices in 32
  branches (two enumerations agree), all 262,241 starting charts closed (2,764 by unsigned constraints; 259,477 gave
  4,859,207 signed stars and zero graphs), an independent reconstruction found zero uncovered charts. lrat-check and
  cake_lpr accepted all 1,915 primary proofs ("s VERIFIED UNSAT" read), 32 branch joins checked, every chart-to-proof link
  read independently; a separate physical-adjacency SAT encoding excluded 52 whole charts. Controls: the planted
  free-involution quotient returns G exactly once (explicit isomorphism to cap3-canon.g6), the mixed Petersen plant and
  four rooted circulant completions return exactly. 7,310 CPU-s; 28,652 files checksummed. Open types of order 2:
  2^18 1^4, 2^17 1^6. The existence of a (3,10;40)-graph stays open.
- NEXT (W1h, Astra's proposal): 2^18 1^4 with two disjoint fixed edges — endpoints on different fixed edges share
  exactly one moving fibre, forcing one fixed-list orbit (four shared, eight private, six neutral fibres); pin it and
  enumerate its double partners.

## Added 2026-11-26 01:12 UTC — gate G31 (f7 >= 110, the repair criterion): FAIL, 30 of 59 root types closed (control room)

- round4/astra-nonregular/REPORT-11.md (to 01:11 UTC 26 Nov; work/g31/). Fifteen more root types closed (1, 4, 8, 14,
  17, 25, 30, 34, 41, 44, 51, 53, 55, 57, 58; type 58 by the repair criterion: every independent nine-set of a
  one-edge-deleted parent must contain both endpoints of the inserted edge — of 8,241 seeds, 1,000 already closed, 4,946
  with no compatible maximal-row family, 1,092 with no row tuple; zero tuples on the 1,203 without a deletion, both
  programs). 30 of 59 closed, 29 open; 1,510,189 more kernel-class/type pairs excluded, 624,089,747 remain (two tallies).
  No new key: 283 of 519 stand, 236 survive. Side results (REASONED, scoped in work/g31/SCOPE.md): internal edge floors
  75/67/59/51 at degrees 5–8 in any ambient lift of a 109-edge card; two degree-five neighbours with one common
  neighbour of degree 6 or 7 have a common exterior of at most 60 edges (McKay's order-21 list). Controls: both order-39
  graphs, C35, McKay catalogues; positive lifts recovered.
- NEXT (G32, Astra's proposal): group the 102,110 one-shore-feasible 60-edge common exteriors by one-edge-deleted parent;
  fix the cheaper shore and the common neighbour's row, intersect the compulsory independent-set hits before generating
  the opposite shore (the direct two-shore pilot rejected all 2,048 classes tested).

## Added 2026-11-26 02:07 UTC — gate W1h (the involution type 2^18 1^4): **PASS — 2^18 1^4 = ∅** (control room)

- round5/astra-reach/REPORT-14.md (to 02:06 UTC 26 Nov; work/w1h/). No member of W(40,9,3) has an involution fixing
  exactly four vertices (no independence-number assumption). Degree parity leaves two fixed graphs: two disjoint edges
  (one list orbit) and the three-leaf star (five list orbits, by the leaves' overlaps); double partners form a matching.
  All 4,536 double-partner skeletons excluded (223 two-edge, 4,313 star; the triple-overlap branch closed by a direct
  counting proof before signing); 41,191 partial sign rejections and 8 full tables, every one failing its signing; zero
  members. Two matching recurrences, a labelled count and a Burnside count agree; all 304 quotient CNFs and LRATs
  regenerated byte for byte; lrat-check and cake_lpr ("s VERIFIED UNSAT") on the 34 expanded parts and every branch
  conclusion. Controls: G's fixed-point-free quotient returns exactly one signing (isomorphic to cap3-canon.g6); 32
  Clebsch and 4 Petersen completions recovered. 11,920 files checksummed. Open type of order 2: 2^17 1^6 only.
- NEXT (W1i, Astra's proposal): 2^17 1^6 — enumerate the fixed graphs and list orbits; first test whether each fibre
  meeting three fixed vertices has six eligible moving contacts (the triple-overlap argument), before double partners.

## Added 2026-11-26 02:22 UTC — triage of an external note; gates X1 and H1 opened (control room)

- round6/TRIAGE-2026-11-26.md (the operator: "on the suggestions decide what is valuable for the research and keep").
  The note (round6/external-note-2026-11-25/, a ChatGPT chat with the operator, unverified proposals) offers four
  routes. KEPT: Route C (five roots pairwise at codegree 5 force a 13-vertex exterior isomorphic to C13(1,5); H5 is
  K6-free; under c* <= 5 the remaining choice falls into 7 orbits) and Route B (three small trace obstructions).
  PARKED: Route A (perfect matching + 2-SAT form; reopen after W1i) and Route D (uniform R(6) oracle; reopen only as a
  pilot against the decided 3-edge records).
- X1 (a fresh Claude agent, round6/claude-recheck/): re-derive Routes B and C independently of the note's code.
- H1 (Astra line F, round6/astra-h5k5/, from 02:22 UTC 26 Nov): re-derive §4's premises, then decide the 7 orbits'
  joint problem by SAT with LRAT through two checkers; PASS when all 7 are decided; a false premise ends it as a result.

## Added 2026-11-26 02:31 UTC — gate X1 (independent re-derivation of the external note's Routes B and C): **PASS, 7 of 7 items** (control room)

- round6/claude-recheck/X1.md (a fresh Claude agent; own proofs and own exhaustive checks; the note's code neither read
  nor run). Trace patterns A, B, C: 2,048/624/1,424, 8,192/3,136/5,056 and 1,024/128/896 reproduced, zero survivors
  after padding to nine roots; each minimal under single removals (C too); 4,536 distinct A/B images in S9; scanner
  controls Clebsch (16 roots) and r39_35 (3,360 roots) clean. Codegree-5 classification by exact enumeration: four
  roots 5 labelled rows (types A and B), five roots one solution (p = 2, union 22, exterior 13), six roots none (H5 is
  K6-free); K3,6 and K4,5 excluded without regularity (3+6+22+8 = 39 and 4+5+17+13 = 39 < 40). r35_13.g6 is one graph,
  explicitly isomorphic to C13(1,5) (cross-checked by gluing the three r34_8 graphs); 39 independent 4-sets, 221
  disjoint pairs, Aut = the 52 affine maps (found by backtracking), 7 orbits 26,26,52,52,13,26,26 in the note's order.
  Gaps: catalogues and R(3,k), k <= 9, cited not re-proved; the note's order-22 control unnamed; K3,6 not needed in
  §4.2 (the classification needs only K4,5 and the four-root exterior bound). H1's premises therefore stand.
- NEXT: Route B's cuts go to line D as input to G33 (after G32 reports), measured on a fixed batch.

## Added 2026-11-26 02:43 UTC — gate H1 (the K5 of codegree five): **PASS — H5 is K5-free in every 9-regular candidate, with no codegree cap** (control room)

- round6/astra-h5k5/REPORT.md (Astra line F, 02:22–02:42 UTC 26 Nov; work/). Stronger than the gate asked. The short
  argument: five roots pairwise at codegree 5 have the unique profile (X1); for any four of them the exterior has 17
  vertices and alpha <= 5, so it is one of McKay's seven (3,6;17)-graphs; the fifth root lies in that exterior and its
  only neighbours there are its three unit-trace vertices — degree 3 — but every (3,6;17)-graph has minimum degree 4.
  The control room re-checked the catalogue fact independently: r36_17.g6 holds 7 graphs, each 17 vertices, triangle-free,
  alpha 5, minimum degree 4, maximum 5. Machine side: the seven orbits' joint SAT problems (365 shared edge variables,
  exact degrees, triangles, codegree bounds, 195 global ten-set clauses) are each UNSAT, LRAT accepted by lrat-check and
  cake_lpr; a separate 39-variable proof certifies the uncapped obstruction directly. Controls: a planted 24-vertex
  7-regular graph with a genuine codegree-5 K5 recovered; a soluble 16-vertex control solved after 8 separations.
  Premises: X1 (independent) and Astra's own re-derivation agree; catalogue completeness taken as input. Uses
  regularity (degree 9 at the fifth root). The existence of a (3,10;40)-graph stays open.
- NEXT (H2, Astra's proposal): a K4 in H5 — can either four-root type extend its 17-vertex exterior to all four
  overlapping three-root exteriors, every physical edge shared?

## Added 2026-11-26 03:35 UTC — gate H2 (a K4 in H5): **PASS — H5 is K4-free in every 9-regular candidate** (control room)

- round6/astra-h5k5/REPORT-2.md (Astra line F, 02:43–03:34 UTC 26 Nov; work/h2/). Accepted as reported. All 14
  (four-root type × (3,6;17)-exterior) pairs UNSAT: 11 closed on the overlapping three-root exteriors alone; the other
  3 (E3 type A, E3 type B, E5 type A) left 55 assignments, each UNSAT in full-graph SAT (51 of them already show an
  independent ten-set on fixed two-edge paths). Key constraints: in type A exact degrees force the unit graph to be a
  maximal triangle-free subgraph of the allowed cross-class edges; in type B the three normal roots' twelve private
  neighbours induce a catalogue graph with alpha <= 4. 66 primary proofs, lrat-check and cake_lpr on replay;
  independent enumerators agree on the split leaves; a planted 24-vertex regular graph with all six root pairs at
  codegree 5 recovered. Uses regularity; no codegree cap. With H1: H5 has no K4 and so no K5. Open: triangles in H5.
- NEXT (H3): triangles in H5 — Astra's proposed case first (three roots sharing all five common neighbours), then every
  other intersection pattern of a codegree-5 triangle.

## Added 2026-11-26 07:12 UTC — gate W1i (the involution type 2^17 1^6): **PASS — 2^17 1^6 = ∅**; and a correction to the gate's own text (control room)

- round5/astra-reach/REPORT-15.md (02:07–07:11 UTC 26 Nov; work/w1i/). No member of W(40,9,3) admits an involution
  fixing exactly six vertices. 181 labelled fixed graphs (two generators agree) in five shapes, 2,153 named lists, 113
  list orbits (canonical representatives and Burnside agree); the contact test (a fibre meeting three fixed vertices
  needs six eligible moving contacts) cut 35 orbits before matching; 15,882 partner skeletons, zero members. lrat-check
  and cake_lpr accepted all 1,103 CNF/LRAT pairs; 201 quotient packets replayed independently; 10,770 of 10,776
  skeletons also refuted directly. Controls: G's quotient returns one signing (isomorphism back to G); six-fixed Cayley
  (4 completions), Clebsch (32), Petersen (4). Over budget: the proofs and both checkers finished in time, the report
  index was rebuilt from saved outputs after the 4-hour wall deadline (work/w1i/DELIVERY.md); a checkpoint gap of
  unverified cause is recorded there.
- CORRECTION (ours, caught by Astra): the W1i gate text said a PASS would mean "every involution type of W(40,9,3) is
  decided". That was wrong: the W1c table (work/w1c/W1c-table.tsv) leaves 2^14 1^12 and the loopless case of
  2^13 1^14 open, and no later certificate closes them. Decided now: 2^20 = {G} (with 5^8 = {G}), 2^19 1^2, 2^18 1^4,
  2^17 1^6 empty. Open involution types: 2^14 1^12 and 2^13 1^14 (loopless). The existence question stays open.
- NEXT (W1j, Astra's proposal): the loopless 2^13 1^14 branch — pin a moving fibre of maximum support degree, enumerate
  its neighbours' fixed-neighbour masks, test mask intersections and the codegree sum before signing; then 2^14 1^12.

## Added 2026-11-26 07:14 UTC — gate H3 (triangles in H5): FAIL, 0 of 3 patterns decided (control room)

- round6/astra-h5k5/REPORT-3.md (03:35–07:12 UTC 26 Nov; work/h3/). Exactly three patterns for a codegree-5 triangle,
  by the triple intersection t (R(3,7) = 23 gives t >= 3; codegree 5 gives t <= 5; two counts agree): t = 5 (private
  cells 4, exterior 20), t = 4 (3, 1, exterior 21), t = 3 (2, 2, exterior 22). None decided. Partial: t = 3 — all ten
  66-edge exteriors excluded, 8,796 of 9,078 matched pairs left; t = 4 — all 331 63-edge exteriors excluded, and the
  (3,3,3) private-row widths reduced by a scan of all 1,118,436 exterior graphs to six row triples in six graphs, each
  refuted by physical SAT (the independent replay of that scan unfinished, so the split's completeness is provisional);
  t = 5 — 28,833 of 69,290 base/profile cells left, both full SAT trials timed out. 35 refutations verified by
  lrat-check and cake_lpr; planted Clebsch control recovered exactly. Two generators agree on 917 (t = 3) and 83,753
  (t = 4) internal bases.
- The Mac slept: the run's clock jumped 04:19:50 → 07:08:21 UTC (pmset shows maintenance sleep and dark wakes in that
  window despite run-astra's caffeinate), which is also why lines D and E ran past their wall budgets. Not Astra's fault.
- NEXT (H4): finish the independent replay for t = 4, widths (3,3,3) (Astra's proposal), then extend the same
  pairwise/triple row-hitting test to the other t = 4 width profiles, measuring the frontier.

## Added 2026-11-26 07:15 UTC — gate G32 (f7 >= 110, the 60-edge exteriors): FAIL, 30 of 59 root types closed (control room)

- round4/astra-nonregular/REPORT-12.md (01:12–07:14 UTC 26 Nov, the Mac's sleep inside; work/g32/). No new type or
  degree distribution closed (283 of 519 stand); 788,911 type/kernel pairs excluded, 623,300,836 left over 29 types.
  The requested parent intersection closed every 60-edge boundary assignment before branching (102,110 exteriors under
  44,943 parents → 1,853 children → zero graphs, independently regenerated); at 59 edges 6,670 child joins, 19
  branches, all failed. New bound (REASONED, scoped in work/g32/INTRINSIC.md): in a triangle-free 32/109 graph with
  minimum degree >= 5 and alpha <= 8, two non-adjacent five-valent vertices with a unique common neighbour of degree
  6–8 have a common exterior of at most 58 edges (attained 54 by real cards). Controls passed (both order-39 graphs,
  C35, 1,598,368 maximalized inputs, planted witnesses recovered).
- NEXT (G33): the external note's Route B cuts (X1-verified) on a fixed batch of the open types' cells, measured
  (cells removed by single cards vs by overlap); then Astra's proposal — the 24/60 kernels marked at a degree-three
  vertex with a 49-edge exterior, rows (2,2,4)/(2,3,3) or the thirteen-miss case, joined on one labelled core.

## Added 2026-11-26 09:07 UTC — ALL ASTRA LINES STOPPED: the ChatGPT account's usage limit (control room)

- Lines D (G33) and F (H4) ended with exit 1 at 09:07 UTC 26 Nov; line E (W1j) shows the same error in its log since
  08:44 UTC. Codex's message: "You've hit your usage limit … try again at Dec 1st, 2026 1:59 PM". No verdict for G33,
  H4 or W1j; their partial work stays in work/g33 (round4/astra-nonregular), work/h4 (round6/astra-h5k5) and work/w1j
  (round5/astra-reach), with checkpoints. Nothing is accepted from them until a line reports. Resume each with its own
  FOLLOWUP (the gate texts stand) after the limit resets, or move the gates to Claude agents on the operator's word.
