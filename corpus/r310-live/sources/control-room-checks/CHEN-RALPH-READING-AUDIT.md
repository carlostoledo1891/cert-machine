# Audit of the Astra reading of Chen's `r310_ralph` run (control room, PRIVATE, written 2026-11-23 04:39–04:41 UTC)

Checked here: `astra-runs/a5-chen-overlap/work/CHEN-RALPH-READING.md` (beb6341a…61c5), its `REPORT.md` (59061c9c…) and
`TASK.md` (08ae9473…), against Chen's clone `audit/chen-ralph-2026-11-23/repo/` at 055ae277 (read as text, nothing of
it executed; read-only `git log` only) and our own files. Five items, as briefed. One agent of the control room, once.
No network, no pods, no git writes, no Lean (one Lean build of another session was running). Python with `python3 -I`,
my own code in `chen-ralph-audit/`, about 6 CPU-minutes in all. Paths below: `C/` = Chen's clone, others relative to
the lane folder.

## What is NOT established (read first)
1. **Chen's filters were re-implemented, not run.** Item 1's set equality uses my Python reading of
   `C/ralph/lanes/C/pair_packages.py`. That my package counts equal his logged ones on all four cores
   (142,843 / 142,703 / 139,630 / 139,565, `C/review/r7_independent.log:1,3,5,7`) is the evidence that the reading is
   right. His trace files and pair lists (`scratch/`) are not in the repository (`C/ralph/FINAL_REPORT.md:45–46`).
2. **Chen's round-24 R(6) pilot is a report, not a result.** Nothing of `C/review/ideas/r024_R.md` was replayed: its
   inputs, logs and code are under `scratch/ideas/r024_R/`, not published. Its 16 "pilot residues" cannot be matched
   to our catalogue lines, it does not say the two groups of eight are disjoint, and its filters assume codegree at
   most six everywhere (lines 11, 19, 20).
3. **Times.** Chen's are committer dates in his clone (self-declared; push times not checked, no network). Ours before
   18:07 UTC 11-22 are this Mac's clocks only. Our 18:07 registration's receipt was upgraded **during this audit**
   by another session (`r6-full/R6-FULL-PREREG.md.ots` rewritten 04:37:42 UTC; the pending original kept as
   `.ots.bak`, 816424e5…). I parsed it: it commits to b23f918c… (the registration's sha256) and now carries Bitcoin
   attestations at heights 977085, 977089 and 977131. **I did not verify them** (no header of 977085 on disk, no
   network), so the block time is not established here.
4. **The 5 → 6 deduction (item 3) is two lines of prose, not Lean,** and stands on two premises: Theorem C35 (ours,
   private, its novelty resting on one agent's prior-art reading, `reveal-draft/REVEAL-DRAFT.md:32–34`) and the
   uniqueness of the (3,9;35)-graph (Goedgebeur–Radziszowski 2013, Theorem 3, a computer enumeration nobody here
   checked, `cert-machine-r1/P1-RESULT.md:95–97`).
5. **The bound it raises is in an idea-scout note of Chen's run** (`C/review/ideas/fable_G.md`, a Fable 5.2 scout,
   round 6), unnumbered and not in `C/ralph/CLAIMS.md`. Calling it "his" lower bound in an e-mail overstates its
   standing; "the lemma in your run's scout note fable_G.md" is exact.
6. Nothing here bears on whether R(3,10) is 40 or 41.

## 1. R(7): same 977,008 pairs, same cores, filters, per-core counts

**Definitions, both sides.**
- Ours: "A **side choice** is an unordered pair {S₁, S₂} of independent 6-sets of X whose union meets every independent
  7-set of X. A **configuration** is an unordered pair of side choices whose unions are disjoint."
  (`claude-r7/REDUCTION.md:67–68`). No automorphism quotient (`:75`).
- Chen's (code, `C/ralph/lanes/C/pair_packages.py`): masks are the independent (d−3)-sets avoiding deficit-≤1
  vertices (`:22,24,31`); a package is a pair i ≤ j whose overlap avoids deficit-≤2 vertices and has at most cap−3
  vertices (`:23,43–45`), whose union meets every independent (d−2)-set (`:29–30,37,46–47`), and whose need set misses
  its union (`:34–36,48–51`); two packages are compatible iff each need set lies in the other union and the unions are
  disjoint (`:72–85`); unordered (`:103,107`); run with d = 9, cap 7 (`:168–170`). Prose: `C/ralph/lanes/C/proofs/pair_packing.md:42–47`.
- So every compatible pair of Chen's, forgetting U and D, is a configuration of ours on the same labelled core
  (cap−3 = 4 < 6 excludes S₁ = S₂). **"Chen's pair filters imply ours": true.**

**Cores.** Our `claude-r7/cores_e85.g6` and `r7-scout/r38_27_e85.g6` both hash to
6b2373618c34d588dfbf073e28794dab68400a15ef6e06d96bc618b490c8ce57; Chen pins the same digest for his
`r38_27_e85.g6` (`C/ralph/lanes/A/R7_INPUTS.sha256:1`; `C/ralph/lanes/C/RESULTS.md:5–6`). It is one hash of the
four-core file, not four per-core hashes; same bytes means same labelling and order. **True.**

**Per-core counts.**

| Core | Ours (`claude-r7/r7count.out:6,13,20,27`; `REDUCTION.md:76–77`) | Chen (`C/ralph/lanes/C/RESULTS.md:13–16`; `C/review/r7_independent.log:2,4,6,8`; `C/ralph/critic/round_008.md:12`) | Recount here |
|---|---:|---:|---:|
| X0 | 261,824 | 261,824 | 261,824 |
| X1 | 261,586 | 261,586 | 261,586 |
| X2 | 226,943 | 226,943 | 226,943 |
| X3 | 226,655 | 226,655 | 226,655 |

(Chen's RESULTS.md:11 heads that column "side packages"; it holds pairs. His own mislabel, not Astra's.)

**Recount, my own code** (`chen-ralph-audit/r7_pairs.py` → `r7_pairs.out`, 3.9 CPU-min): on each core, both
definitions computed from the graph; side choices 185,911 / 185,850 / 177,187 / 177,090 (= `r7count.out:4,11,18,25`);
Chen packages 142,843 / 142,703 / 139,630 / 139,565 (= his log); pairs as in the table; **Chen's set ⊆ ours and equal,
as explicit sets of canonical keys, on every core**; 0 configurations with r′(x) < 1.
**Our production list itself** (`chen-ralph-audit/r7_configs_check.py` → `r7_configs_check.out`, 1.9 CPU-min): all
977,008 records of `claude-r7/configs.bin` (76c2666b…) decoded with r7count.c's own set order (`r7count.c:28–31`): all
distinct, all configurations in our sense, **all pass every filter of Chen's**, per core 261,824 / 261,586 / 226,943 /
226,655. So the list our production refuted is exactly Chen's compatible-pair set, core by core.

Priority (not re-litigated; the reading has it right): Chen's C-004 (`C/ralph/CLAIMS.md:22`) is in commit 3248382
(committer date 2026-11-21T17:50:52+01:00 = 16:50:52 UTC); our R(7) rules were stamped 02:13 UTC 11-22
(`claude-r7/PROD-RESULT.md:8`).

## 2. R(6), three cross-edges

**Same branch: yes, with one premise more on Chen's side.**
- Chen: "Let nonadjacent roots `u,w` have six common neighbours `C`; let `A,B` be their private triples. By Lemmas
  P/F, at `f=3` the private graph is exactly `3K2` … The untouched `X` is a triangle-free 26-vertex, 75-edge graph of
  independence number at most seven." (`C/review/ideas/r024_R.md:9`). Case R is 9-regular (`C/notes/cases_local.md:127`).
- Ours: "a 9-regular triangle-free graph on 40 vertices with no independent 10-set, a nonadjacent pair with six common
  neighbours and exactly three cross-edges. Its core is one of the 23,409 graphs of `catalogue.g6` (26 vertices, 75
  edges, no triangle, no independent 8-set)" (`control-room-checks/r6-full/R6-FULL-PREREG.md:6–8`).
- Difference: Chen's split is "choose (0,10) among the codeg-c* pairs with the LEAST f; call it f*"
  (`C/notes/cases_local.md:148`), inside c* = 6, and the scout's filters use that cap: "A pair on one shore overlaps in
  at most five" (`r024_R.md:11`), "any mask overlapping a wing row in more than five places" (`:19`), "Two common masks
  can intersect in at most four" (`:20`). Ours uses no codegree bound (`R6-TIGHT-AUDIT.md:25`). Since f ≥ 3 always and
  R(7) is excluded (C-004, and ours), a marked pair with c = 6, f = 3 is the same thing as Chen's R(6), f* = 3. The
  scout's negatives are therefore conditional on R(7) being excluded; ours are not.

**Both tight witnesses: yes.**
- Ours (i): "|I| + (6 − h) + (3 − d) ≤ 9, that is h ≥ |I| − d … the tight cases are |I| = 6, d = 0 and |I| = 7, d = 1"
  (`R6-TIGHT-AUDIT.md:23`). Chen: "An independent nine in H is either a seven in X plus two nonadjacent wings, or a six
  in X plus a transversal. Every common mask must hit its X part" (`r024_R.md:17`). Same sets.
- Ours (ii): "If rem(x) = rem(y) = 1, both adjacent to the common vertex c, and a transversal T misses both … and a
  transversal misses at most six of them" (`R6-TIGHT-AUDIT.md:24`). Chen: "two `q=1` sites avoiding T cannot share their
  one common neighbour … Thus at most six such sites avoid T" (`r024_R.md:15`), with q_x = our rem(x) (`:14`).

**"16 pilot residues with no surviving common-row assignment": Chen's words, correctly quoted** — "No common-neighbour
assignment survived on 16 pilot residues" (`r024_R.md:47`): eight development inputs, "only **60** passed the pointwise
supply check, requiring 277 DFS nodes, zero terminals" (`:29`), and eight hash-selected ones, "1,004 passed point
supply, 11,710 DFS nodes, zero terminals" (`:30`). Labels "enum", "There is no production certificate" (`:5`). Not
replayed by anyone (Chen's next step 1, `:41`); limits in "not established" 2.

**"23,037 of 23,409": correct.** "`shortg -u` found **23,037 distinct classes**. GR Table 13 gives 23,409 … The graph6
file is an input inventory, **not** a list of obstructions." (`r024_R.md:35`); "372 are missing, and no Ramsey case is
closed" (`:49`). Our catalogue has all 23,409 (`R6-FULL-PREREG.md:36`), its completeness resting on Table 13 (`:17`).

**Completed result: none, on either side.** Chen: no claim ID (no `r024` anywhere in `C/ralph/CLAIMS.md`), no critic
round (round 24 "was cut", `C/ralph/FINAL_REPORT.md:9–10`), "This proposal doesn't change the status of any Ramsey
case" (`r024_R.md:3`). Ours: the pod run is in progress (about 7,300 of 23,409 at 03:33 UTC, `TASK.md:13`).

**Who had what, when** (commit times from `git log --format=%cI` in the clone, converted to UTC):

| When (UTC) | Whose | What | Source |
|---|---|---|---|
| 2026-10-26 22:42:55 | Chen, commit 3299508 (sec3/sec6 again 22:51:35, b4ad7ee) | The branch: c* = 6, e(X) = 72 + f, "R(6, f* <= 5): X in R(3,8;26,75..77)"; 23,409 at e75 and 216,151 at e76 quoted from GR Table 13; selector SAT timed out on all 9 sampled X; gluing ~40 min/X; parked | `C/notes/cases_local.md:135–160`, `C/paper/latex/sec3.tex:229–233`, `C/notes/critic.md:537,726`; byte-identical in our 27 Oct copy (sha256 55789818… both) |
| 2026-11-21 22:27:45 | Chen, round 6 (873007e) | fable_R idea 5 on an isolated codegree-six pair (row bounds); TESTED.md line on the old gluing estimate | `C/review/ideas/fable_R.md:180–193`, `C/review/ideas/TESTED.md:20` |
| 2026-11-21 23:38:02 | Chen, round 7 (a194a30) | Isolated f = 3, side level only: "no independent seven-set can miss two of those masks and no independent six-set can miss all three"; eight constructed e75 cores left 56,773–93,666 side triples | `C/review/ideas/astra_R.md:59`, `TESTED.md:61`; critic: "The fixed-X sampled side-triple reduction remains too large for a full scan" (`C/ralph/critic/round_007.md:26`) |
| 2026-11-22 03:13:46 → 18:07 | Ours (local clocks) | `claude-r6/R6-DERIVATION.md` born 03:13:46; tests (i), (ii) in `tight-blind75/complete.cpp` born 15:45:47; pilot frozen 15:54:18 (`FREEZE.txt`); four cores excluded 15:54–15:58; audited 16:06–16:42 (`R6-TIGHT-AUDIT.md:1`) | file birth times on this Mac |
| 2026-11-22 18:07 | Ours | Full-run rules `R6-FULL-PREREG.md` (b23f918c…), pinning `tight_own.c` through the bundle hash (`:31–38`); receipt now upgraded, attestations 977085 / 977089 / 977131, unverified here | `R6-FULL-PREREG.md:1`, `.ots` (af20baab…) |
| 2026-11-22 22:49:53 | Chen, final commit 055ae27 | First appearance of `r024_R.md`: both witnesses, 16 pilot zeros, 23,037 inventory, 58.6 core-hour forecast | `git log -- review/ideas/r024_R.md` |

When Chen's scout was written inside his run is not recorded. Scouts ran every three rounds (`FINAL_REPORT.md:12–13`)
and each earlier one first appears in its round's commit (r021_R in round 21, 3dbd066), so r024_R most likely dates
from round 24, after round 23's commit at 21:19:14 UTC. That is an inference. Nothing suggests either side saw the
other's work: ours was private and Chen's file was not public before 22:49 UTC. If the 977085 attestation verifies,
our registration is externally dated about 30 blocks before block 977115, whose header time is 22:42:48Z
(`R6-ROUND38-TOY-DRAWS-AUDIT.md:31`). **Not checked here** ("not established" 3).

## 3. C35: the 5 → 6 deduction holds

**Chen's bound and its proof.** "tau9(G) = least |W| such that G − W has no independent 9-set. Lemma (proved):
5 <= tau9(G) <= 10 (R(3,9) = 36; W = N[v] works). tau9 = m means that G is an induced (3,9;40−m)-graph plus m
vertices. For m = 5 the core is the unique C35(1,7,11,16)." (`C/review/ideas/fable_G.md:112–114`; G a hypothetical
(3,10;40)-graph; committed 873007e, 2026-11-21 22:27:45 UTC). The proof is the parenthesis: if |W| ≤ 4, G − W is
triangle-free on ≥ 36 vertices, so it has an independent 9-set; and G − N[v] has none (v would make ten). His C35 + 5
SAT run: "**TIMEOUT at 13 min; no answer**" (`:125`).

**Our theorem.** "Any finite triangle-free simple graph with no independent set of size 10 that contains an induced
copy of the circulant C35(1,7,11,16) … has at most 39 vertices, and any four distinct vertices outside the copy induce a
4-cycle." (`reveal-draft/REVEAL-DRAFT.md:50–52`; Lean `order_at_most_39`, `cert-machine-r1/P1-RESULT.md:24`).

**The deduction, stated exactly.** *Let G be a triangle-free graph on 40 vertices with no independent set of size 10.
Assume that every triangle-free graph on 35 vertices with no independent set of size 9 is isomorphic to C35(1,7,11,16)
(Goedgebeur–Radziszowski 2013, Theorem 3). Then for every set W of five vertices, G − W contains an independent set of
size 9. Hence τ₉(G) ≥ 6, and with the scout's upper bound, 6 ≤ τ₉(G) ≤ 10.*

*Proof.* Suppose |W| = 5 and G − W has no independent 9-set. G − W is triangle-free on 35 vertices, so by the premise
it is isomorphic to C35(1,7,11,16). A subgraph induced on a vertex set is an induced copy, so G is a finite
triangle-free graph with no independent 10-set containing an induced C35(1,7,11,16), and by Theorem C35 it has at most
39 vertices, not 40. If |W| < 5, choose W′ ⊇ W with |W′| = 5: an independent 9-set of G − W′ is one of G − W.
So every W with |W| ≤ 5 leaves an independent 9-set, that is, τ₉(G) ≥ 6. ∎

Checks on it: (a) uses only the two premises, not even R(3,9) = 36; (b) the degree-four corollary is the case
W = N[v] (`cert-machine-r1/lean/NoDegreeFour.lean:13–17,58–59`), so this is the same proof with an arbitrary 5-set;
(c) it says the scout's m = 5 family (C35 + 5 vertices, `fable_G.md:114,122–127`) is empty, and the formula he timed
out on has no graph model (if it encodes what `:117` says); (d) it says nothing about m = 6 (a (3,9;34) core), and it
does not raise δ: τ₉ ≤ δ + 1 is an upper bound. Not formalised: a Lean statement would be NoDegreeFour.lean with W in
place of N[v], about 30 lines; not built here.

## 4. Four cross-edges: what Chen did
- **216,151** is Goedgebeur–Radziszowski Table 13's count of R(3,8;26,76), quoted by Chen as D-C8d
  (`C/paper/latex/sec2.tex:48`, `C/notes/cases_local.md:137`, `C/cases/r6f_check_input.py:13`). He did not count it.
- **The selector timeout** is October's: "X -> G by selector SAT (cases/r6f_enc.py, smsg --no-SMS) times out on all
  sampled X (e=75: >1 h x2, e=76: >2 h, e=77: >1 h x6)" (`C/notes/cases_local.md:155–156`; `C/paper/latex/sec3.tex:231–232`;
  the critic: "2+1+6 = 9 X, all rc 124", `C/notes/critic.md:726`). One e76 core, one batched-selector SAT run, timeout
  at 2 h, in the R(6, f* ≤ 5) sample, committed 2026-10-26.
- **In the November run, nothing on f = 4**: no claim (CLAIMS has no e76 or low-f R(6) row), and the scout excludes it:
  "This is not an estimate for the other 1.74 million 26/76 and 26/77 inputs: their private graphs are not matchings."
  (`r024_R.md:31`; 216,151 + 1,526,296 = 1,742,447).
- So REPORT.md's "Chen identified the 216,151-core population and reported a selector timeout" is true in substance
  but misdated: both are from October, and the timeout is one sampled core.

## 5. Misquotes
- **Quotations: 39 of 39 occur at their cited lines; 148 of 148 citations point at existing files and lines**
  (`chen-ralph-audit/check_quotes.py` → `check_quotes.out`). No misquote of either side found.
- Imprecisions (none changes a conclusion):
  1. The per-core counts are cited partly to `C/ralph/lanes/A/R7_REPLAY.md:40–50`, which has no counts; they are at
     `C/review/r7_independent.log:2,4,6,8`, `C/ralph/lanes/C/RESULTS.md:13–16`, `C/ralph/critic/round_008.md:12`.
  2. "The labelled core hashes match": one hash of the four-core file (true; not per-core hashes).
  3. REPORT.md, four edges: no date and no sample size (item 4).
  4. REPORT.md and the reading call the τ₉ bound "his"; it is an unnumbered scout lemma ("not established" 5).
  5. "Zero surviving common-row assignments on 16 pilot residues" omits that the scout uses the global cap six and that
     the 16 need not be distinct. The reading does say "cap-six overlap bounds" and "different premises at some cuts"
     (line 33).
  6. Our side: the reading's "the private run … relies on the published class count" and "no end-to-end Lean
     certificate" match `R6-FULL-PREREG.md:11–17`.

## Verdicts
| Claim | Verdict |
|---|---|
| 1a. R(7): the same 977,008 unordered package pairs | **CERTIFIED** (explicit set equality on each core; every configs.bin record passes Chen's filters) |
| 1b. The labelled core hashes match | **CERTIFIED** (one file hash, 6b237361…, both sides) |
| 1c. Chen's pair filters imply ours | **CERTIFIED** (code read and recomputed) |
| 1d. The counts agree on each core | **CERTIFIED** (261,824 / 261,586 / 226,943 / 226,655) |
| 2a. r024_R is the same branch (c = 6 nonadjacent pair, three cross-edges, X in R(3,8;26,75)) | **CERTIFIED**, with Chen's extra cap-six premise |
| 2b. It derived both of our tight witnesses | **CERTIFIED** |
| 2c. "16 pilot residues with no surviving common-row assignment" | **CERTIFIED as Chen's report**; as a result: **REFUSED** (not replayed, inputs unpublished) |
| 2d. 23,037 of 23,409 classes, 372 missing, an input inventory | **CERTIFIED** |
| 2e. None of it is a completed result | **CERTIFIED** |
| 2f. Our registration (18:07 UTC) precedes Chen's file (22:49:53 UTC) | Local clock and committer date: yes. Externally: **REFUSED** here (attestation not verified offline) |
| 3. Theorem C35 + the uniqueness premise raise the scout's lower bound on τ₉ from 5 to 6 | **CERTIFIED** (proof above; prose, conditional on both premises) |
| 4. Four edges: 216,151 and a selector timeout | **CERTIFIED** in substance; the number is GR's and both are October's, one core |
| 5. The reading misquotes neither side | **CERTIFIED** (39/39 quotes, 148/148 citations; six imprecisions listed) |

Nothing REFUTED.

## Files
Written here (`control-room-checks/chen-ralph-audit/`):

| File | sha256 |
|---|---|
| r7_pairs.py | 439f7940fd07676788a71a17fe10c9cba0afa357631293412d3b63d2a4d391ee |
| r7_pairs.out | c7c82c2ad01b5f85d800f6484e59060aa7375478dfe7075cae0c5e184f83cb7a |
| r7_configs_check.py | eedeb00d81ef4ec1ea83235930c7ee76fe6c24a933ffb1063711aa81b2acd202 |
| r7_configs_check.out | 8039984bbbb548e820b3643269089efda1509aa436e850def416a80f45fadbe8 |
| check_quotes.py | 21482d43bfeee25bd08c3725cde6eada18eaea152ec879f3ab23d909c8320be7 |
| check_quotes.out | 1b8620e1de897866dd239d8689c05849b4f5a6ec6d147bea1f25711437c6747f |

Run: `python3 -I r7_pairs.py ../../claude-r7/cores_e85.g6`; `python3 -I r7_configs_check.py ../../claude-r7/cores_e85.g6
../../claude-r7/configs.bin`; from the lane folder, `python3 -I control-room-checks/chen-ralph-audit/check_quotes.py
astra-runs/a5-chen-overlap/work/CHEN-RALPH-READING.md .`

Read, by sha256: CHEN-RALPH-READING.md beb6341a…61c5; REPORT.md 59061c9c…20e2; TASK.md 08ae9473…af2;
`C/ralph/lanes/C/pair_packages.py` e15d29bf…0f70; `C/ralph/lanes/C/RESULTS.md` 4d26ddcc…dd5e;
`C/review/r7_independent.log` 697e3eea…af33; `C/review/R7_CLAUDE_REVIEW.md` 914234d1…e7e1;
`C/ralph/lanes/A/R7_INPUTS.sha256` 66561965…6a79; `C/review/ideas/r024_R.md` 35db1310…f0f2;
`C/review/ideas/fable_G.md` 2343243e…c995;
`C/review/ideas/astra_R.md` 35a9e94c…50e5; `C/review/ideas/TESTED.md` 893cb8fa…03ea; `C/notes/cases_local.md`
55789818…cf3a; `C/notes/critic.md` 1fd945a0…629b; `C/paper/latex/sec3.tex` 394083e0…0e82; `C/ralph/FINAL_REPORT.md`
e4fc9a55…6709; `C/ralph/CLAIMS.md` 58fb834b…aaa; `C/ralph/lanes/C/proofs/codegree_six_paths.md` 773249cb…2a1b;
`claude-r7/cores_e85.g6` 6b237361…ce57; `claude-r7/configs.bin` 76c2666b…ed9e; `claude-r7/r7count.out` 21c6610c…6124;
`claude-r7/REDUCTION.md` dd29496a…b05a; `r6-full/R6-FULL-PREREG.md` b23f918c…767f; `r6-full/R6-FULL-PREREG.md.ots`
af20baab…fde5 (upgraded 04:37:42 UTC; `.ots.bak` 816424e5…510e); `R6-TIGHT-AUDIT.md` bdf698d1…fce1;
`R6-ROUND38-TOY-DRAWS-AUDIT.md` 3078c832…e18b; `tight-blind75/FREEZE.txt` 781c7219…9567; `tight-blind75/complete.cpp`
30b1494d…a594; `cert-machine-r1/P1-RESULT.md` f9c264b9…5e92; `cert-machine-r1/lean/NoDegreeFour.lean` 8c8e9c96…25ca5;
`reveal-draft/REVEAL-DRAFT.md` f6b5b5ee…714c.
