M1 — the switching monovariant: is the regular case the whole problem? (a Claude agent; PRIVATE)

ROOT = /Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21. Work only in ROOT/round5/monovariant/.
date -u before any time; WORKLOG.md every half hour; one heavy process at a time (the Mac is shared and loaded: use
taskpolicy -b); nothing committed or sent. nauty (geng, labelg, shortg) and cadical are in /opt/homebrew/bin.

WHY. If every (3,10;40)-graph could be moved, step by step, to a 9-regular one without leaving the class, then a
(3,10;40)-graph exists iff a 9-regular one does, and the whole non-regular half of the map (246 open degree patterns)
disappears. A proof needs a MONOVARIANT: a potential Φ and a bounded family T of moves such that every non-maximal
member of the class has a T-move to another member with Φ strictly larger, and Φ is largest exactly at ⌊n(k−1)/2⌋ edges.
The empirical law behind it: in every complete catalogue, whenever a (3,k;n)-graph exists one with ⌊n(k−1)/2⌋ edges
exists (round5/lit-structure/PATHS.md §1; Radziszowski–Kreher 1988 for small k).

WHAT IS ALREADY DEAD (do not repeat; build on it): round 1's B5 (round1/DIGEST.md; round1/astra/astra.log "Idea 5";
round1/claude-b/switch_results.txt): Φ = edge count with the SINGLE-VERTEX switch (delete v, add z adjacent to an
independent set meeting every independent (k−1)-set of G − v) has NO raising move for all 8 non-max-edge maximal
(3,7;22)-graphs and for 2,867 of the first 3,000 non-max-edge maximal (3,8;27)-graphs. Also false: "vertices of degree
< k − 1 are independent" (lowdeg_r38_27.txt). Re-derive the B5 counts on your own code as a calibration.

THE COMPLETE CATALOGUES (McKay; ROOT/testbed/mckay/, FETCHED.txt, SHA256SUMS): r36_16 (2,576), r36_17 (7), r37_21
(1,118,436), r37_22 (191), r38_27 (477,142), r39_35 (1), r35_12, r35_13, r34_8. Every member of each class is listed,
so a move from a member either leaves the class or lands on a listed member: reachability inside a class is EXACT.

THE EXPERIMENT, on every catalogue with a non-max-edge member (at least (3,6;16), (3,7;21), (3,7;22), (3,8;27)):
(1) PLATEAU REACHABILITY, exact. The vertex-switch graph: G ~ G' when G − v ≅ G' − v' for some v, v' (canonical forms
    of all one-vertex deletions with labelg; for (3,8;27) that is 477,142 × 27 deletions — sort on disk, do not hold
    it all in memory). Directed arc G → G' when e(G') ≥ e(G). Question: does EVERY non-max-edge member reach a
    max-edge member along arcs? Report per class: components, the members that cannot reach the top (count, edge
    counts, degree profiles), and the longest shortest path. Then the same with two-vertex switches on the classes
    where it is affordable (say which).
(2) STRICT MONOVARIANTS. For each pair (Φ, T) below, the number of non-max-edge members with NO strictly Φ-improving
    T-move inside the class (the "local maxima"; zero is what a proof needs):
    Φ: (a) e; (b) (e, number of vertices of degree k−1) lexicographic; (c) (e, −Σ_v (k−1−d_v)²); (d) one potential
    of your own design, written in WORKLOG.md BEFORE you measure it.
    T: (i) one-vertex switch; (ii) two-vertex switch; (iii) edge moves removing at most r and adding at most r + 1
    edges, r ≤ 3 (r + 0 allowed only for the lexicographic tie-breakers); (iv) any one move of your own design,
    declared in WORKLOG.md before it is measured.
(3) If some (Φ, T) has ZERO local maxima on every class: say so loudly, give the move in words, and state the lemma a
    proof at (3,10;40) would need ("every non-regular (3,10;40)-graph has a T-move that raises Φ"); list which known
    facts about a hypothetical (3,10;40)-graph (LANE notes: degrees 6..9, n6 ≤ 2, diameter 2 when maximal, the 246
    patterns) the proof could use. Check the lemma's analogue on the 39-vertex pool (round5/good-vertices/seeds/,
    round5/audit-g16/walk39_min7_distinct.g6, round4/astra-nonregular/work/planted39.g6,
    round5/reach-claude/out/g17b_gen39_lo5_canonical.g6): does every non-max-edge member there have the move?
CONTROLS: the move generator must reproduce known members: from every member of r37_22, the one-vertex switches must
land only on members of r37_22 (canonical forms checked against the list; any landing outside is a bug), and every
max-edge member must be reachable from itself; the B5 counts (8 of 8; 2,867 of 3,000) must come back.

Gate M1 (written before you start): PASS when some (Φ, T) with T of bounded size (at most two vertices, or at most
3 edges removed) has ZERO local maxima on every complete catalogue tested (at least the four named), with the
controls intact. FAIL otherwise; then (i) the plateau-reachability answer per class, (ii) the local-maxima table for
every (Φ, T), (iii) the nearest miss (the pair with the fewest local maxima, and what those graphs look like).
Budget: 4 core-hours, 5 hours of wall time.
Final message, in this order: (1) `M1: PASS (Φ, T) = …` or `M1: FAIL — fewest local maxima <k> for (Φ, T) = …`;
(2) what is NOT established; (3) the plateau-reachability table; (4) the local-maxima table; (5) for a PASS, the
lemma at 40 and what it may use; for a FAIL, what the local maxima have in common; (6) the one next experiment.
COMPUTED / REASONED on every claim; every number from a file you name. Last line exactly the verdict line.
