A2 — extend the 39s, and the symmetric witnesses (a Claude agent; lane 41, PRIVATE)

ROOT = /Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21. Read ROOT/lane41/LANE.md first.
Work only in ROOT/lane41/a2/. date -u before any time. WORKLOG.md every half hour. One heavy process at a time; the
Mac is shared with five other runs (keep background QoS: taskpolicy -b or nice where it works). Nothing committed, sent
or written outside a2/. Tools: geng/labelg/shortg (nauty) and cadical in /opt/homebrew/bin; the proof checkers in
ROOT/tools-bin/lrat-check and ROOT/tools-bin/cake_lpr/cake_lpr (cake_lpr exits 0 even when it rejects: read its
"s VERIFIED UNSAT" line).

THE TARGET: a (3,10;40)-graph — 40 vertices, triangle-free, independence number at most 9. One such graph makes
R(3,10) = 41. Any candidate is checked by TWO α programs you write differently (e.g. a bitset branch-and-bound and a
SAT/clique formulation), plus a triangle check; nothing is called a witness before both agree.

(1) THE POOL. Collect every 39-vertex graph on disk that is triangle-free with α ≤ 9, verified by both programs:
    round5/good-vertices/seeds/exoo39.g6 and seeds39.g6; round5/audit-g16/walk39_min7_distinct.g6 and walk39_min7.g6;
    round4/astra-nonregular/work/planted39.g6; round5/reach-claude/out/g17b_gen39_lo5_canonical.g6; round1/claude-b/
    critique/exoo39.g6; anything else you find (say how you searched). Deduplicate up to isomorphism (labelg). An
    earlier extension of exoo39 exists (round5/reach-claude/out/ext_exoo39.txt: "39 172 0 4450"); re-derive it, do not
    cite it.
(2) EXACT ONE-VERTEX EXTENSION of every pool graph H: a new vertex v with neighbourhood S ⊆ V(H), S independent
    (no triangle) and meeting every independent 9-set of H (no independent 10-set). Decide each H exactly: a witness,
    or UNSAT with an LRAT proof through both checkers (or an exhaustive argument you check two ways). Report per H the
    NEAREST MISS: the minimum, over independent S, of the number of independent 9-sets S misses.
(3) GROW THE POOL, bounded: produce more maximal (3,10;39)-graphs by local search (you may read and reuse
    round5/audit-g16/src/walk39.c and round5/good-vertices/src/ram.c), with an energy biased toward extendability
    (the nearest-miss number of (2)), and extend each new one. Report how many distinct graphs, their edge counts and
    degree profiles, and the best nearest miss reached.
(4) SYMMETRIC WITNESSES, the full problem (NO codegree cap, any degrees): (a) every circulant on 40 vertices,
    exhaustively (connection sets up to the multiplier action); (b) Cayley graphs on every group of order 40
    (14 groups), exhaustively up to automorphisms of the group where feasible, otherwise say what was covered;
    (c) SAT for a (3,10;40)-graph invariant under a permutation of each fixed-point-free type 40^1, 20^2, 10^4, 8^5,
    5^8, 4^10, 2^20 — orbit-matrix encodings, cheapest first, a per-type cap of 40 minutes; every UNSAT with LRAT
    through both checkers. An UNSAT here is ALSO a result for the 40 side: "no (3,10;40)-graph has an automorphism of
    type t".
CALIBRATION, named before running and reported exactly:
    - extension must FAIL on every (3,9;35)-graph (ROOT/testbed/mckay/r39_35.g6) toward (3,9;36), and on a sample of at
      least 10,000 (3,8;27)-graphs toward (3,8;28) (all 477,142 if it is cheap);
    - extension must SUCCEED when a vertex is deleted from 1,000 random (3,8;27)-graphs: it recovers a (3,8;27)-graph
      every time (isomorphic to the original or not: say which);
    - the symmetric searches (a)–(c) must find the known graphs where they exist one rung down: run the same code at
      (3,9;35) and (3,8;27) and compare with the automorphism statistics on disk (round1/claude-b/aut_r39_35.txt and
      what you compute from the 477,142).

Gate A2 (written before you start): PASS when a (3,10;40)-graph is found and verified as above. FAIL otherwise; then
(i) the pool size up to isomorphism and every extension decided, with the best nearest miss; (ii) per symmetric type:
excluded (with LRAT), found, or undecided at its cap; (iii) calibration results.
Budget: 4 core-hours, 5 hours of wall time.
Final message, in this order: (1) `A2: PASS — witness <file>` or `A2: FAIL — no witness; <k> types excluded`;
(2) what is NOT established; (3) the pool and the extensions; (4) the symmetric table; (5) calibration; (6) the one
next experiment. COMPUTED / REASONED on every claim; every number from a file you name. Last line exactly the verdict line.
