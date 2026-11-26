# Lane 41 — look for the graph that would make R(3,10) = 41

Opened 2026-11-25 ~02:10 UTC on the operator's word ("let's open a lane on 41"). PRIVATE, like the whole R(3,10) lane:
nothing from here goes into a tracked file, a public page or a message without his word.

R(3,10) ≤ 41 is published (2025), so R(3,10) = 41 exactly when ONE (3,10;40)-graph exists: 40 vertices, no
triangle, no independent 10-set. A witness is checked in under a second by two programs; finding one is the hard part.
Every gate in this lane is a SEARCH whose PASS is a witness; a FAIL must still return its nearest miss and any class it
EXCLUDES with a checked certificate (those exclusions count for the 40 side too).

What a witness must look like (lane records, each on two programs): WLOG maximal triangle-free (diameter 2);
degrees 6..9; at most two vertices of degree 6 (G16 + audit); if non-regular, its degree pattern is one of the 246
survivors; if 9-regular, largest non-adjacent codegree c* ∈ {3,4,5,6}, each 30-vertex residual has 99 edges and α ≤ 8,
and with c* = 3 it has no automorphism of type 10^4, 5^8, 8^5, 4^10 (W1 + W1b). Deleting any vertex leaves a
(3,10;39)-graph, so a witness contains 40 of them.

Rows (the path ledger for this side; same rules as round5/PATHS.md: a row before any work, dead only with its number):

| Id | Idea | Status | Where |
|---|---|---|---|
| A1 | Scout: who searched for a (3,10;40)-graph, how, what near misses are published, which classes are already excluded | DONE 02:23 UTC: extending known 39s published and negative (37M+ in 2012, >= 43M in 2025, 18.4M in a 2026 repo); circulants settled; Cayley excluded unrefereed; OPEN: fixed-point-free 2^20 and 5^8; nearest published misses: 810 graphs with ONE triangle (Exoo 2013), 23-24 ten-sets | lane41/SCOUT.md |
| A2 | DONE 08:25 UTC: no witness; 258-graph pool and all 14 Cayley groups of order 40 EXCLUDED with LRAT; 5^8, 2^20 (9-regular) undecided at 60 min, engine too slow (K1 failed); NEXT A2b. Was: One-vertex extension of every (3,10;39)-graph on disk and of a grown pool; all circulants and Cayley graphs of order 40; SAT for witnesses invariant under each fixed-point-free permutation type | RUNNING, REDIRECTED 02:28 UTC after A1: duplicates dropped (mass extension, pool growth; circulants and Cayley only as cheap calibration); the open classes 2^20 and 5^8 restricted to 9-REGULAR witnesses (new) | lane41/a2/ |
| A3 | Minimise the number of independent 10-sets inside the windows W(40,9,4), W(40,9,5), W(40,9,6) (N27 did cap 3: the minimum found is 281, one rigid graph) | QUEUED | — |
| A4 | Search inside the 246 non-regular patterns: local search with the degree pattern fixed, energy = number of independent 10-sets | QUEUED | — |
| A5 | A learned proposer (Astra writes and tunes search heuristics; the exact α check is the only judge; FunSearch / PatternBoost style) | QUEUED, after A1 | — |
| A6 | Start from 40-vertex graphs with exactly ONE triangle and no independent 10-set (Exoo 2013 found 810; data not public) and search for a move that removes the triangle without creating a 10-set | QUEUED (an outside suggestion, 25 Nov) | — |
| A2b | 9-regular 5^8 / 2^20 at 40 with a C++ propagator | FAIL 09:14 UTC: calibration K1 not found in 10 min; PARKED with the next experiment (deeper cube-and-conquer) named | lane41/a2/b/ |
