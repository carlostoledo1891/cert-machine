# Round 1 digest: the ideas on the table (control room, 2026-11-23 ~21:50 UTC)

Full reports (read them; quote them when you criticise them):
- Astra (GPT-6.2): round1/astra/REPORT.md, code in round1/astra/work/
- Claude A (counting angle): round1/claude-a/REPORT.md, code in round1/claude-a/ (index: NOTES.txt)
- Claude B (structure angle): round1/claude-b/REPORT.md, code in round1/claude-b/
- Grok (first version; a revision is coming): round1/grok/REPORT.md (no code shipped)

Base folder: /Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/

| id | who | idea (one line) | their own status |
|---|---|---|---|
| A1 | Claude A | P66: no two non-adjacent degree-6 vertices with exactly one common neighbour, so n6 ≤ 2; removes ~166 of Chen's 524 near-regular distributions | survives tests; stage 1 ≈ 21 CPU-h, ~40 survivors to glue |
| B1 | Claude B | the same lemma (L(6,6)), and its general form "no tight pair of any type" | very likely true; cost the risk |
| A2 | Claude A | saturation ladder: no saturated pair (L2) / triple (L3); empirical law U (every R−1 graph has a saturated (k−4)-set) | mixed: true at k=9, false at k=7,8; (6,·),(7,·) pairs cheap |
| A3 | Claude A | codegree rigidity in the 9-regular case | REFUTED (C35 has c* = 4; counting passes all profiles) |
| A4 | Claude A | a (3,10;40)-graph is asymmetric; do not pay for involutions | conjecture; (5,0) orbit SAT timed out |
| A5 | Claude A | near-miss scores do not predict extendability | statistical |
| B2 | Claude B | 9-regular ⇒ c* ≥ 4 (no "codegree-flat" extremal graph); mass at c* = 5 | conjecture, 0 of 21,821 MTF R−1 graphs flat |
| B3 | Claude B | symmetry: target fixed-point-free involutions in the 9-regular case | redirect only |
| B4 | Claude B | C35 minus 1–2 vertices lemmas | REFUTED as useful (removes ~0.02%); by-product: C35 contains no induced (3,8;27) |
| B5 | Claude B | reduce to 9-regular by edge-raising switches | REFUTED (95.6% of non-max-edge MTF (3,8;27) have none) |
| X1 | Astra | order-5 automorphisms WITH fixed points excluded in 9-regular c* ≤ 5 (fixed counts 5, 10, 15) | SAT + LRAT for the 10-fixed case |
| X2 | Astra | G − N[v] is never C35 minus (d−4) vertices, d = 6..9 | exhaustive gluing, 0 gluable |
| X3 | Astra | max-codegree rooting: c = 5 → 5,740 starting graphs; c = 6 → 42 | counts computed; SAT cost unknown |
| X4 | Astra | c* = 3 → 111 edge-neighbourhood types after Farkas certificates | computed |
| X5 | Astra | near-misses: 40-vertex triangle-free graphs with 24 (degrees 8⁴9³⁶) and 30 (9-regular) independent 10-sets | counts CHECKED by the control room |
| G1 | Grok | 9-regular ⇒ c* ≥ 5 | itself rates it likely false (C35 has c* = 4) |
| G2 | Grok | fixed-point-free order-5 orbit reduction (8 orbits) | reasoned only |
| G3 | Grok | a subset of the (3,8;27)-graphs whose induced copy forbids 40 | reasoned only |
| G4 | Grok | ILP bounds on independent 9-set counts | reasoned only |
| G5 | Grok | no codegree-regular realisation in near-regular cases | reasoned only |

Agreements already visible: A1 = B1 (found independently); B2, X4 and G1 all point at "c* = 3 is empty or tiny";
X1 (fixed points) and G2 (no fixed points) together would cover order 5 in the cases they treat; A4 and B3 agree that
non-regular G are almost surely asymmetric.

Running now (control room): the full P66 stage-1 sweep over all 477,142 (3,8;27)-graphs with Claude A's glue
(round1/control/p66-stage1/), 6 processes, several hours.
