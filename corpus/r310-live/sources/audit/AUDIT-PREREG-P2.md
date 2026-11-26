# Audit pre-registration, part 2 (PRIVATE; registered by the control room, 2026-11-22 09:40 UTC)

**Status: registered. This file is timestamped before any row runs.** It is the scoping agent's draft (kept beside it as
`AUDIT-PREREG-P2-draft.md`, sha256 in the block below) with the control room's rulings added here and two paths corrected.
The text of the rows is the draft's, unchanged.

## Control room rulings (they bind where they differ from the draft below)
1. **Scope now, on the operator's word (about 09:30 UTC): rows S1 and G1 only.** S1 is the 14 Cayley groups. G1 is the
   one-hour measurement of our own gluing rate on the reviewer samples in the clone. After them the control room reports,
   and nothing longer runs without a further word.
2. **Rows S2, S3 and G2 are registered and not run.** Each needs the operator's word, and S2 needs a ruling on its
   lex-leader premise first (the draft's question 5).
3. **Rows G3 and K stay REFUSED** as the draft states them: G3 on resources, K for lack of artifacts.
4. **The author is not contacted** (the operator: "Not yet"). So the "their files" half of every row is REFUSED for lack
   of artifacts, and that is stated in the result, first.
5. **House of Graphs is not fetched now.** G1 uses only the three sample files in the clone.
6. **The checkers** were copied from the session scratchpad to `../tools-bin/` with their hashes (`../tools-bin/SHA256SUMS`):
   `../tools-bin/lrat-check` (4aeadfcf…3ce794) and `../tools-bin/cake_lpr/cake_lpr` (eeba1fea…f8352). The rows use those
   paths. The scratchpad paths in the draft's text below are the same bytes.
7. **Two corrections to the scoping brief, which the draft already carries:** the author is Zhiyang Chen; §5's
   certificates are DRAT files checked by drat-trim, not by cake_lpr.
8. **A verdict of this part is private** like part 1's, and goes into `AUDIT-RESULT.md` with what is not established first.

---

# The draft, as registered


**Status: a draft. Not timestamped. Nothing here has run, except the two measurements under "What was run".** Written 2026-11-22 ~09:25 UTC by a
scoping agent (Claude Fable 5.2) for the control room to review, correct and timestamp. It covers the three items that `AUDIT-PREREG.md` (sha256
60869e93…f614b) lines 60–61 left for later. "l." is a line of `chen-23678020/chen-v2.txt` (sha256 1187d5a7…); "the clone" is `chen-23678020/repo` at
1473adf8. Part 1's rules carry over: gaps first, dated at the pin; PRIVATE; no author is contacted without the operator's word.

## What is not known (read first)
1. **No proof file of the author's is on this Mac, or in any public place I found.** The clone holds 0 files ending .cnf, .drat, .lrat, .lpr or
   .cubes. Zenodo 23678020 v2 holds two files: the PDF (606,585 bytes) and a LaTeX zip (44,062 bytes). GitHub's head is still 1473adf8 (26 Oct), with
   0 releases (API, read 2026-11-22). The report says they are "available from the author on request" (l.1022–1024).
2. **The missing files have no published size or hash.** `MANIFEST.tsv` (2,150 files) and `LARGE_FILES.tsv` (138 paths) name nothing under `runs/`,
   `symsat/certs/`, `sms/cnf/`, `sms/cubes/` or `gluing/cls/`. A file sent later cannot be tied to the 26 October state.
3. **Whether the proofs still exist.** `sms/rc7_cover2.sh` line 12 deletes a cover's proof log after a VERIFIED line. `symsat/verify_cert.py` writes
   its DRAT into a work folder on each run. `symsat/certjob.sh` keeps the nine automorphism DRAT files as .xz.
4. **Our rate for gluing with proofs.** No solver ran here. Part 1's eager route took 907 s a graph, on a formula 1.8 to 3.4 times smaller (row G).
5. **Whether House of Graphs still serves GR's lists.** GR 2013 says all (3,≤9; n, ≤e(3,k,n)+1)-graphs are there (`gr2013/gr2013.txt` l.476–479). That
   would cover both gluing classes. The listing page is a 2,476-byte script shell, and a reply saved earlier in the scratchpad's `hog/` folder reads
   "Unauthorized".
6. **Whether a plain lazy loop finishes the nine automorphism cases.** The author's notes say PySAT CEGAR left 25 of 139 calibration cases undecided
   at 900 s (n ≤ 35), and that n = 40 used a propagator solver (`notes/symsat.md` l.136, l.208).
7. **Whether their t9 ≤ 88 gluing run ended** (l.1047–1051, expected 29 Oct). There is no commit after 26 Oct.
8. **Three points of my brief differ from the record. Correct me if the brief is right.**
   - The report and Zenodo name the author Zhiyang Chen. The brief said Zhonghao.
   - §5's certificates are DRAT files checked by drat-trim (l.437–439, l.490), not by cake_lpr, which is §7's checker. No drat-trim is here.
   - The two checkers are not under `../cert-machine-r1/`. They are in a session scratchpad (paths below), which a reboot can clear.

## The new fact, and the ranking it gives
Our own run closed R(7) tonight under six premises (`../claude-r7/PROD-RESULT.md`): 977,008 configurations, all CERTIFIED-UNSAT.
- A model of the author's formula PRc7 (l.810–812) is a 9-regular (3,10;40)-graph with a non-adjacent pair of codegree 7. Given P1–P6 there is none.
  So all 464 cubes are unsatisfiable, the 99 open ones too.
- **So an audit of the 365 cubes now tests the author's certificates, not the mathematics. It has lower value than the other two items.** It also
  costs the most and has no files. What it would still give: a partial cross-check of our encoding, since their chain has a Lean link from statement
  to formula (`R7.no_codeg7`, built here in A3) and ours leaves P4 and P5 unformalised.
- **Rank on this Mac: (1) Cayley and automorphisms, (2) gluing, (3) cubes.** By weight in the author's argument, gluing is first: it is the only one
  of the three that other results use. But its full row cannot finish here.

## Tools on this Mac (path, bytes, sha256)
- lrat-check, from drat-trim@2e3b2dc0 (`lrat-check.c` bf07c2ac…4a95). 36,552 bytes, 4aeadfcf05c3dd56d47fa1a9423cc3d0747fb3c448b6dd3af3a0a3197f3ce794:
  `/private/tmp/claude-501/-Users-carlostoledo-Projects-cert-machine/c023a269-07c9-4e3b-86a9-7a5bd283b137/scratchpad/bundle/lrat-check`
- cake_lpr, ARMv8 build of tanyongkiam/cake_lpr@033aad53. 773,960 bytes, eeba1fea28955124403d4e6614efa5ff3a365f16820e21b5830814c0b7ff8352:
  `/private/tmp/claude-501/-Users-carlostoledo-Projects-cert-machine/c023a269-07c9-4e3b-86a9-7a5bd283b137/scratchpad/cakelpr-src/cake_lpr`
- CaDiCaL 3.0.1, the `cadical` that `run_all.py` and `cake_pass.py` call: `/opt/homebrew/bin/cadical`, a link to
  `/opt/homebrew/Cellar/cadical/3.0.1/bin/cadical`. 1,254,120 bytes, 3f43a01a40ed865a1babc7ac46b80bc0b2ce6ec0d9f129b9d84674eca9c1500a.
- Also here: `/opt/homebrew/Cellar/cadical/3.0.1/lib/libcadical.a` (2,556,440 bytes); nauty's labelg, shortg, geng, dreadnaut in `/opt/homebrew/bin`.
  Not on this Mac: drat-trim, VeriPB, CakePB, GAP, PySAT.
- McKay's (3,8;27) list: `../claude-r7/src-mckay/r38_27.g6.gz`, 2,185,201 bytes, 9a2e9723…5cc7b5 (477,142 graphs).
- Machine: Apple M2, 8 cores, 16 GB, 27 GiB free. Part 1's measured rates (`mccrea-23928054/ours/*.json`, 39 graphs): solves 35,360 s; LRAT 19.35 GB
  in all; lrat-check 669 s; cake_lpr 2,131 s.

## What was run for this draft, and the run rules
- **The one feasibility run.** `cake_lpr example.cnf example.lpr`, with full paths, on the example shipped beside the binary (200 and 454 bytes). It
  printed `s VERIFIED UNSAT`; exit 0, 0.00 s. It shows only that the binary works at that path today. There is no file of the author's to check.
- **Counting, not solving.** This script counted independent sets in sample graphs of the clone, and from them the size of row G's formula:
  `/private/tmp/claude-501/-Users-carlostoledo-Projects-cert-machine/c023a269-07c9-4e3b-86a9-7a5bd283b137/scratchpad/p2-scope/size_cnf.py`
- **Rules for every row.** One worker, one caffeinate, stop at 20% battery. Each script hashed before its run. Big files deleted once checked and
  hashed. A verdict is read from the checker's line, never its exit code. A REFUTED needs a reproduced, traced failure. A satisfiable answer is
  decoded and decided twice before anything is said, and goes to the operator only.
- **Hashes in the rows** are the first 16 hex digits. Each full value is that file's row in the clone's `MANIFEST.tsv` (255,936 bytes, sha256
  2833191dc5047d090dfc32d11da1c2a044c1d8dcedcca2250ab21326db1cefd6). I recomputed each one: equal.

## S1. No (3,10;40)-graph is a Cayley graph
1. **Claim.** "Theorem 5.1. No (3, 10, 40)-graph is a Cayley graph." (§5.2, l.472). Method A, enumeration: minimum α is 10 for 12 groups and 11 for G1
   and G13 (l.474–477). Method B, "certified": "14/14 DRAT VERIFIED" (l.478–480). **Place:** §5 stands alone; no other result uses it. If wrong, a
   Cayley (3,10;40)-graph could exist: that bears on R(3,10) = 41, not on the case split.
2. **Artifacts in the clone.** `symsat/groups/G0.txt`…`G13.txt` (14 × 4,403 bytes; all equal their manifest rows), `symsat/groups/index.txt` (1,452,
   001eaa8e46105ef4), `symsat/groups.py` (7,490, 7be04aba8a351651), `symsat/cayley.c` (4,758, 705f839ff1a422a3), `symsat/test_cayley_sat.py` (1,031,
   0d9daabc331c52e9), `symsat/orbsat.py` (11,548, a8b37684989b28c4), `symsat/verify_cert.py` (4,348, 9c8984b5d1076558), `notes/symsat.md` (15,327,
   3ed54a60b39b5201), `notes/critic.md` (66,030, 1fd945a0c238334f; Review 33). **Missing:** `symsat/certs/cayley_G{0..13}_K10.json` (the 14
   certificates), `runs/symsat/cayley_verify.log`, `cayley_all.log`. No DRAT file is named anywhere.
3. **Re-check,** written from the statement. The 14 tables are data, not code.
   - Groups. Each table is checked as a group (64,000 triples). The 14 are told apart by element-order profile. Our own build of the 28 products Z5 ⋊
     P (4 + 8 + 8 + 4 + 4 homomorphisms) maps each onto one of the 14 by an isomorphism that our code finds and checks. Named premises: every group of
     order 40 is Z5 ⋊ P with |P| = 8 (Sylow, Schur–Zassenhaus); there are five groups of order 8.
   - Formula per group. One variable per class {g, g⁻¹}, g ≠ e: 20 to 31 variables. Clauses: no s, t, st all in S; and, for each listed 10-set I, some
     a⁻¹b with a, b in I is in S. Our own lazy loop finds the 10-sets; a separate checker accepts only these two shapes.
   - Proof. `cadical --lrat --binary=false`, then lrat-check and cake_lpr, recorded as in `run_all.py` and `cake_pass.py`. Not reusable:
     `census_check.py`, `cm_deg7.py`, the claimant-CNF comparison (no graph list, no fixed H, no claimant CNF). Their files: none exist.
   - Second leg, no SAT. Enumerate every symmetric product-free S with |S| ≤ 9 and compute α exactly. It must agree. It is also compared with the
     author's minimum-α table; a difference there is a gap, reported first with its S.
4. **Verdict.** CERTIFIED: all 14 formulas unsatisfiable, both checkers accept all 14 proofs, the group checks and the controls pass; premises named.
   REFUTED: a model that decodes to a Cayley graph passing our own (3,10;40) check. REFUSED: anything else, gap named.
5. **Controls.** (a) Z35, K = 9: satisfiable, decoding to a (3,9;35)-graph (C35(1,7,11,16) is a circulant). (b) A 10-set clause with a repeated
   vertex: refused. (c) Each proof cut to its first half: refused by both checkers. (d) G5's table with two entries swapped: fails the group check.
6. **Cost.** Under 0.2 CPU-h. Basis: 20–31 variables (my count from `index.txt`'s involutions); the author reports under 1 s a group
   (`notes/symsat.md` l.113).

## S2. Theorem 5.2: nine prime-order automorphism types
1. **Claim.** "Theorem 5.2 (certified). A (3, 10, 40)-graph has no automorphism of order 7. It has no automorphism of order 5 with f ∈ {10, 15} fixed
   points. It has no automorphism of order 3 with f ∈ {13, 16, 19, 22, 25, 28}." "(9 cases. Each case was solved UNSAT by satcore in 5–110 s, and each
   is DRAT VERIFIED.)" (§5.4, l.502–506). **Place:** stands alone, as S1. Not in this row: (5,5), enumeration only (l.1052); the 59 open subcases.
2. **Artifacts in the clone.** `symsat/cyclic.py` (11,555, 6791023cf5ce7403), `symsat/orbsat.py` (above), `symsat/verify_sc.py` (9,491,
   e78dfb5bf5d9a335), `symsat/certjob.sh` (810, 32051c80e538ff03), `symsat/certjob2.sh` (919, 4f49b2386afa002d), `satcore/src/satcore.cpp` (18,069,
   7068986e95526235), `satcore/src/ramsey.hpp` (20,922, 91901d96381d893d), `satcore/src/core.hpp` (10,462, f03b4959ac517b17), `notes/symsat.md` (table
   TABLE_N40: times 5.25–110.1 s, 120–512 orbit variables). **Missing:** for the nine cases,
   `symsat/certs/n40/p{p}_f{f}.{spec.json,map,full.cnf,drat.xz}`; `runs/symsat/certs.log`, `n40_satcore.jsonl`, `certs_status.txt`.
3. **Re-check,** written from the statement.
   - σ is fixed as k p-cycles and f fixed points; every such automorphism is conjugate to it. One variable per σ-orbit of pairs: 120 to 512.
   - Clauses: projected triangles; 10-set clauses from our own lazy loop; our own lex-leader clauses, each for a permutation that our code checks to
     map pair-orbits onto pair-orbits. Symmetry breaking is needed: (3,28) has 28 fixed points. Named premise: the lex-leader lemma for a formula
     invariant under those permutations (the author's Lean has it as `Gen.lexleader_inv`, built here in A3).
   - Then as S1: form checker, `cadical --lrat`, lrat-check, cake_lpr, records. If a case passes its cap: our own IPASIR-UP propagator on
     `libcadical.a`, by amendment; the proof step stays a plain CaDiCaL run on the final static formula.
   - Their files, if the nine `full.cnf` and `drat.xz` arrive: our form check of each clause; drat-trim (2e3b2dc0) to make LRAT; then both checkers.
4. **Verdict.** A case is CERTIFIED when its formula is unsatisfiable, both checkers accept and every clause passes the form check; the row, when all
   nine are. REFUTED: a model that decodes to a graph passing our (3,10;40) check and having that automorphism. REFUSED: a case over its cap, named.
5. **Controls.** (a) n = 35, K = 9, types (7,0), (5,0), (3,5): satisfiable, decoding to a (3,9;35)-graph with that automorphism (`notes/symsat.md` §4:
   these types occur in C35(1,7,11,16)). (b) A lex clause from a permutation that does not normalise ⟨σ⟩: refused. (c) A triangle clause with one
   flipped literal: refused. (d) Each proof cut to its first half: refused by both checkers.
6. **Cost.** The author's nine solves sum to 374 s with a propagator (TABLE_N40); ours is slower, factor unmeasured. Cap: 1 CPU-h a case, 9 in all.

## S3 (optional). The 2,557 order-2 extensions
1. **Claim.** "Certificates: 2557/2557 DRAT VERIFIED, 0 failed (symsat/ext27_verify.py: own CNF rebuild, CaDiCaL 3.0.1 + drat-trim …)" (§5.5,
   l.575–580). **Place:** it closes six subcases (2, f, 7). It closes no case (p, f): all 18 order-2 cases stay open (l.561–562).
2. **Artifacts in the clone.** `symsat/ext27.py` (8,866, 65055b8cb552fb4c), `symsat/ext27_verify.py` (5,213, c7a6a4918164b68b), `symsat/autcycles.py`
   (3,683, 9addd93d9f6d0a2a), `symsat/ext27_cert.sh` (643, 21340e5fd030477e), `symsat/ext27_cert2.sh` (895, d6e65b7b1b45b943). **Missing:**
   `symsat/certs/ext27/*.json` (2,557), `runs/symsat/ext27_verify.log`, `ext27_verify2.log`.
3. **Re-check.** McKay's list by `census_check.py`'s code (27 vertices, no triangle, α ≤ 7; 477,142 graphs). Every involution of every Aut(H), not
   class representatives: no conjugacy argument (generators from dreadnaut, each checked by us). Per (H, s): the formula of Lemma 5.3's fixed part,
   σ-orbit variables, lazy 10-sets, proofs as S1. Premises: R(3,8) = 28; McKay's list complete; Lemma 5.3 (hand proof, read in full first).
4. **Verdict.** As S2, per (H, s). 5. **Controls.** An H with one edge removed must fail the input check; a non-automorphism must be refused; cut
   proofs must be refused. 6. **Cost.** The author: about 45 CPU-min of solves (`notes/symsat.md` l.72). Ours: 2–6 CPU-h, cap 6.

## G. Theorem 6.1: the gluing bounds
1. **Claim.** "Theorem 6.1 (enumeration-only). In a (3, 10; 40)-graph, every vertex v of degree 8 has e(Gv) ≥ 97 and every vertex v of degree 9 has
   e(Gv) ≥ 88." (§6.2, l.663–664). Table l.636–652: inputs 560; 35,154; 1,800; 147,335; outputs 0; CPU 121 s; 6,962 s; 879 s; 64,481 s. The author
   claims no certificate. **Place:** the only one of the three items that other results use. It closes cube S8 (l.286–287, l.857) and 20 of the 545
   MTF distributions (l.36–37, l.667). It makes e ≥ 161 unnecessary for the MTF table (l.251–253). It enters the Lean only as the hypothesis
   `Glue U G` (l.387, l.424). If wrong, S8 and those distributions reopen, and every t9 table that takes `Glue` loses its hypothesis.
2. **Artifacts in the clone.** `gluing/src/glue.c` (8,601, a3ea8fd2624a085a), `gluing/src/glue2.c` (11,489, 92ff19cf88bac939), `gluing/src/gutil.h`
   (3,053, 3dd25ac0cb1592fa), `gluing/src/final40.sh` (2,435, 5fac42190882a431), `gluing/src/par.sh` (974, 411298d1fee4c3c6), `gluing/src/tcheck.py`
   (3,488, d0984fade26a413d), `critic/glue/myglue.py` (5,102, 1b67ef5ff6277b3b), `critic/final40/run.sh` (656, b76773603fea5619),
   `critic/final40/run2.sh` (681, 9630dc786f6b04d3), `notes/gluing.md` (17,113, 29080f9f3fa740eb), `lean/R310/LP/Cases.lean` (11,632,
   535d13d7b6e1bf2f; `Glue` at line 51). Reviewer samples, the only inputs here: `critic/glue/e86_sample.g6` (200 graphs, 15,000, b65c884d6edac41f),
   `critic/final40/e96_sample.g6` (100, 8,000, 7212c08711b61e37), `critic/final40/e87_sample.g6` (100, 7,500, e444d3890f6bcb92). **Missing:**
   `gluing/cls/S8_in96.g6` (35,154 graphs), `gluing/cls/N_in87.g6` (147,335), the House of Graphs files `Ramseygraphs_3_9_31_e95.g6` (560) and
   `Ramseygraphs_3_9_30_e86.g6` (1,800), `runs/gluing/final40.log`, `runs/gluing/n40/*`, `runs/critic/f40_e96.log`, `f40_e87.log`.
3. **Re-check.**
   - Inputs, with `census_check.py` as it is (n and e changed): each graph has the right n and e, no triangle, α = 8; the list is pairwise
     non-isomorphic by labelg; the counts equal GR 2013 Table 14 (`gr2013/gr2013.txt` l.1123–1127). Completeness of each level is GR's enumeration, a
     named premise, as in A5. The preferred source is GR's own lists at House of Graphs, not the author's files.
   - Formula, `cm_deg7.py` with 7 → d and 32 → n: x(t,i) = [a_t ~ h_i]; triangle clauses; one clause per T ⊆ N(v) and S independent in H with |T| +
     |S| = 10. No degree bound is added. Eager sizes, counted on the first graph of each sample: 5,138,085 clauses (d = 9, e = 86), 4,915,695 (d = 9,
     e = 87), 2,780,955 (d = 8, e = 96); A5's formula had 1,519,568. So the row uses a lazy subset: our loop adds only violated 10-set clauses, and a
     form checker accepts each one. An unsatisfiable subset decides the eager formula.
   - Proofs: `run_all.py` and `cake_pass.py` as they are, minus the claimant-CNF comparison: their gluer is C code, with no CNF and no proof log.
   - **G1, the rate:** 10 graphs from each of the three samples by the lazy route and 1 by the eager formula. It gives r, our seconds per graph. An
     amendment then prices G2 and G3, as A1 did for A5. **G2, the minimum levels:** all 560 + 1,800 graphs; it decides a weaker statement only (degree
     8 ⇒ e(Gv) ≥ 96, degree 9 ⇒ e(Gv) ≥ 87). **G3, the theorem:** the other 35,154 + 147,335 graphs.
4. **Verdict.** For G3, the claim. CERTIFIED: all 184,849 inputs pass the input checks, the four counts equal GR's, every formula is unsatisfiable and
   both checkers accept. Premises: GR's four counts, e(3,9,31) = 95, e(3,9,30) = 86. REFUTED: one H whose formula has a model that decodes to a graph
   passing our (3,10;40) check, with a vertex of that degree and that e(Gv). REFUSED: inputs not obtained, or the run out of reach. A partial count
   ("400 of 184,849") is stated as a count, never as a verdict. A fault in a list the author sends (a wrong count, an isomorphic pair) is a gap,
   reported first, not a REFUTED. G2 can be CERTIFIED for its weaker statement only.
5. **Controls.** (a) One input with one edge removed: fails the input check (C-A5's control). (b) C35(1,7,11,16) minus N[v], d = 8, K = 9:
   satisfiable, rebuilding a (3,9;35)-graph. (c) A clause with |T| + |S| = 9: refused. (d) A proof cut to its first half: refused by both checkers.
6. **Cost.** G1: cap 1 CPU-h. G2: 2,360 graphs; it fits 12 CPU-h only if r ≤ 18 s. G3: 184,849 graphs; it fits only if r ≤ 0.23 s.
   - Their C gluer, no proof, took 72,443 s: 20.1 CPU-h, 0.39 s a graph (l.636–652). At r = 2 s G3 is 103 CPU-h; at 10 s, 513; at A5's eager 907 s,
     46,572. **G3 cannot be done on this Mac in under 12 CPU-h. Floor: 20 CPU-h. My estimate: 100–500.** It needs a pod and the operator's word.
   - If the lists cannot be had: their generation cost 359,866 CPU-s, 100 CPU-h (l.655–657; `notes/critic.md` l.663); ours is not estimated.

## K. The 365 of 464 cubes of R(7)
1. **Claim.** "365 of 464 cubes UNSAT and certified (each: cake_lpr + sbcheck with both block partitions + partition test + check_cnf). 99 cubes
   reached the 6 h limit (open). No cube was SAT." (§7.4, l.823–824). The cover: l.819–821. The base CNF: l.815–817. **Place:** no result uses it. The
   report says "R(7) as a whole is open" (l.835). After tonight it follows from our own result, given P1–P6.
2. **Artifacts in the clone.** `sms/gen_ramsey.py` (6,464, 9ec57600e7e9bec8), `sms/sms-patches/upstream-63958bd.diff` (9,901, cf6dbe445cbb5f3e),
   `sms/sms-patches/new/src/graphPropagators/independentSet.cpp` (3,248, 41c40aa0a444bbc3), `sms/sms-patches/new/src/proofLogTracer.hpp` (2,289,
   ebbd44c8fe428f3b), `sms/rc7_check.sh` (1,404, 2b6d0588545e732a), `sms/rc7_cover2.sh` (944, d90ed22a8af6bbec), `sms/rc7_mkcover.py` (996,
   cd910c5a4ce5180b), `sms/rc7_split.sh` (2,272, 99825ce9b8e4cb95), `sms/cubesolve.sh` (571, 82bfdbbc0e42921d), `sms/tools_src/lratlog2lrat.cpp`
   (5,886, 99c77b4c2b81839f), `cert/cube_check.sh` (2,917, 1d6af42003fb6fef), `cert/check_cnf.py` (8,603, b45d1db5d9f6d835), `cert/check_sb.py`
   (4,250, 7510fdbae07fc374), `cert/base40_cert.py` (13,208, 611625d610fc8c40), `lean/R310/R7.lean` (17,856, 945212e941ddf9e8), `lean/R310/Rc7.lean`
   (6,115, cc63c5a2775cffb7), `lean/R310/SBCheck.lean` (12,933, 3e04c4c1c6b16526), `lean/SBMain.lean` (7,856, b7e672c76c8102d6),
   `lean/scripts/EmitCubes.lean` (528, 2bc19fff735e34a2), `critic/r7ctl/r7_ctl.py` (4,925, 361a54dca324b7e4), `notes/cert_design.md` (47,520,
   4991f3a5be174f6d). **Missing:** `sms/cnf/Rc7b.cnf` (444,210 variables, 893,163 clauses, l.815); `sms/cubes/Rc7b_L300.cubes` (464 cubes);
   `runs/sms/Rc7b_cover/`; `runs/sms/Rc7b_cert/SUMMARY.txt` and `DONE.json`; `runs/cert/base_Rc7b.log`; `runs/cert/base40/Rc7b/case.opb`;
   `lean/out/cube_R.opb` (`LARGE_FILES.tsv` lists a copy: 2,927,484 bytes, no hash); the 365 proof logs and `.sym.json` witness files.
3. **Re-check.** Our own encoding exists and went further: `../claude-r7`, all of R(7). No new encoding is proposed.
   - Their files, if they arrive: (i) each lazy clause by our form check (10 vertices, 45 positive pairs); (ii) each symmetry clause by our own
     checker, written from the lex-leader definition, with its witness and the blocks {0}, {1..7}, {8,9}, {10}, {11,12}, {13..39}; (iii) each LRAT by
     lrat-check and our cake_lpr (033aad53; theirs: a36874a); (iv) the cover formula the same way; (v) the base CNF against the statement.
   - Step (v) is where part 1's pattern does not fit. A5 compared clause sets and decoded counters with 7 and 32 inputs. This CNF has 444,210
     variables, nearly all auxiliary, with a counter over 351 inputs (e({13..39}) = 85). Exhaustive decoding does not scale. The author's link is a
     VeriPB proof from a Lean-emitted OPB file; checking it needs VeriPB or CakePB and a Lean build of their emitter. Re-making the proofs here means
     building their patched SMS (CaDiCaL fork 2.1.3) and solving again.
4. **Verdict.** CERTIFIED: (i)–(v) pass for all 365 cubes and the cover. REFUTED: a cube's files, as sent, are rejected, and the rejection is
   reproduced and traced to a named step. REFUSED: today's state, no artifact.
5. **Controls,** if it ever runs: a proof cut to its first half, a lazy clause with 44 pairs and a symmetry clause with reversed literals (l.767–769)
   must each be refused; the cover with one cube's negation removed must not verify.
6. **Cost.** With their files: their checks took 5 h 43 min (l.826); about 6–12 CPU-h here, one process; the LRAT sizes are unknown. Re-making the
   proofs: 1.8·10⁵ CPU-s on the 365 solved cubes (l.886), 50 CPU-h, plus the checks: about 56 CPU-h. **Not under 12 on this Mac.**

## Ranked order to run the rows
1. **S1** Cayley: under 0.2 CPU-h. A full verdict.
2. **G1** gluing rate: cap 1 CPU-h. Its number decides whether G2 fits the Mac and what a pod for G3 costs.
3. **S2** the nine automorphism types: cap 9 CPU-h.
4. **G2** the minimum levels: only if GR's lists are in hand and r ≤ 18 s.
5. **S3** the 2,557 extensions: optional, cap 6 CPU-h.
6. **G3** the theorem: REFUSED on resources here; a pod quote after G1.
7. **K** the cubes: REFUSED on artifacts; lowest value after tonight.

## What I could not determine
- Items 2–7 of the first section. The sizes of the author's LRAT files. How many lazy rounds any row needs. No log is in the clone.
- Whether the statements of `R7.no_codeg7`, `Gen.lexleader_inv` and `Glue` say what the report says. They were built in A3, not read here.
- Whether a DRAT of theirs passes our route: no drat-trim is built here and there is no DRAT to try. Whether the last 7 of the 2,557 were checked:
  `notes/critic.md` Review 33 records 2550 with 7 pending, and the report cites a second log that is not here.

## Questions for the control room
1. Scope: is S3 in or out? It closes no (p, f) case and costs 2–6 CPU-h.
2. Gluing inputs: may GR's two lists be fetched from House of Graphs by hand (about 3 MB and 11 MB by my arithmetic)? And does row G stop at G2, or is
   a pod for G3 on the table after G1's number?
3. May the author be asked for the missing files (the 14 + 9 + 2,557 certificates, the two class files, the cube set, the base CNF, the proof logs)?
   Without them K stays REFUSED and the "their files" half of S1–S3 is empty.
4. The two checkers sit in a scratchpad that a reboot clears. Copy them, with their hashes, to a durable folder before timestamping?
5. S2: is our own lex-leader clause set, with the lemma as a named premise, acceptable for CERTIFIED? Without it I expect cases over the cap.
