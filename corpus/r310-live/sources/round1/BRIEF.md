# R(3,10), round 1: ideas that survive (brief, 2026-11-23)

You are one of several independent mathematicians (Claude, GPT-6.2 Astra and Grok, working separately) asked for
ideas that could settle, or cheaply shrink, the open question below. The ideas will be tested against complete data for
smaller cases and attacked by the other participants. Only what survives gets exact certificates or paid computation.
Refuted ideas are recorded as results, so a clean "this fails, here is why" is worth as much as a new idea.

## The question

R(3,10) is 40 or 41 (Exoo 1989: at least 40; Angeltveit, Electronic Journal of Combinatorics 32(4) P4.30, 2025: at most
41). It is 40 exactly when there is no (3,10;40)-graph: 40 vertices, no triangle, no independent set of 10 vertices.

## What is known about a hypothetical (3,10;40)-graph G (public sources)

- Every neighbourhood is independent, so every degree is at most 9. The non-neighbourhood of a vertex of degree d is a
  (3,9)-graph on 39 − d vertices, and R(3,9) = 36, so every degree is at least 4.
- The (3,9;35)-graph is unique: the circulant C35(1,7,11,16) (Goedgebeur and Radziszowski 2013, Theorem 3).
- Theorem C35 (proved in Lean 4 + Mathlib, github.com/carlostoledo1891/ramsey-r310-c35, doi:10.5281/zenodo.24480839): a
  triangle-free graph with no independent 10-set that contains an induced C35(1,7,11,16) has at most 39 vertices, and
  any four vertices outside the copy induce a 4-cycle. Exoo's 39-vertex graph is C35 plus four vertices in exactly one
  way. So G contains no induced C35, and (with the uniqueness above) G has no vertex of degree 4.
- Without loss of generality G is maximal triangle-free (adding an edge that creates no triangle keeps α ≤ 9); then
  every degree is 6, 7, 8 or 9 (Zhiyang Chen, progress report v2, Zenodo 10.5281/zenodo.23678020).
- Chen's case split (the public case map is at https://carlostoledo.co/r310/):
  - a degree-8 vertex v with e(G − N[v]) ≤ 96: closed by exhaustive gluing (his Theorem 6.1; floors 97 at degree 8 and 88
    at degree 9; enumerations without a published checked proof);
  - near-regular degree distributions, 162 ≤ e(G) ≤ 179: open (524 distributions in his report; 238 still open at the
    end of his AI run);
  - 9-regular (e(G) = 180): split by c*, the largest number of common neighbours of two non-adjacent vertices,
    3 ≤ c* ≤ 7. c* = 7 is closed (Chen's run, and recomputed independently); c* = 6 is being computed now; c* ≤ 5 is open.
- Symmetry: G is not a Cayley graph (all 14 groups of order 40; Chen). G has no automorphism of prime order 7 or more;
  29 of 60 (prime, fixed-points) symmetry classes are closed; G is not a "pentagon-block" graph (eight 5-cycles joined
  pairwise by perfect matchings that are translations) — Unsolved Lab, unsolvedlab.com/problems/ramsey-r310, 1 Oct 2026,
  not reviewed outside that lab.
- Constructions: none found. AlphaEvolve matched 39 vertices; the best 40-vertex attempt in Chen's run still has 44
  independent 10-sets; Lemma Park's network reached 37.
- Costs: Angeltveit's proof of R(3,10) ≤ 41 produced about 1.6 billion graphs in R(3,9,32,e ≤ 112) in about six months
  of CPU. In the 9-regular case every non-neighbourhood lies in R(3,9,30,e = 99), which he calls many orders of magnitude
  larger. Brute force on the open cases is expensive; ideas that remove cases are what we want.

## The test bed (complete lists, from Brendan McKay's Ramsey data, users.cecs.anu.edu.au/~bdm/data/ramsey.html)

graph6 files, one graph per line, in notes/ramsey-r310-scout-2026-11-21/testbed/mckay/ (sha256 in SHA256SUMS):

| file | graphs | what |
|---|---:|---|
| r34_8.g6 | 3 | all (3,4;8)-graphs (R(3,4) = 9) |
| r35_12.g6, r35_13.g6 | 12, 1 | all (3,5;12), (3,5;13) (R(3,5) = 14) |
| r36_16.g6, r36_17.g6 | 2,576, 7 | all (3,6;16), (3,6;17) (R(3,6) = 18) |
| r37_21.g6, r37_22.g6 | 1,118,436, 191 | all (3,7;21), (3,7;22) (R(3,7) = 23) |
| r38_27.g6 | 477,142 | all (3,8;27) (R(3,8) = 28) |
| r39_35.g6 | 1 | the (3,9;35)-graph, C35(1,7,11,16) (R(3,9) = 36) |

So for k = 4, …, 9 the complete set of (3,k; R(3,k) − 1)-graphs is here, and for k = 5, 6, 7 one level below too. A
statement about (3,10;40)-graphs usually has an analogue for (3,k; R(3,k) − 1) or (3,k; R(3,k) − 2); test it there first.

## Directions we think can pay (take them or bring your own)

1. Counting instead of searching: inequalities on degree distributions, edge counts, numbers of independent 8- and
   9-sets, codegree counts, that kill whole distributions or whole c* cases. Exact LP/SDP certificates can prove them.
2. Symmetry: every known extremal (3,k)-graph is highly symmetric; a (3,10;40)-graph would be nearly asymmetric. What
   does that force? Which of the remaining small-prime symmetry classes (orders 2, 3, 5) are cheap to close?
3. Lemmas like Theorem C35: "a structure S in G forces a known small graph, which cannot be extended". Find the
   structures whose analogues hold at k ≤ 9.
4. Near-misses: what do the failures (40-vertex graphs with few independent 10-sets) have in common?

## Your task

Give exactly five ideas. For each:

1. **Statement**: precise, falsifiable (a lemma, a conjecture, a reduction or an algorithmic trick).
2. **What it removes**: which open case(s) above, and why it would save work (an estimate).
3. **Cheapest kill test**: the computation that would refute it, preferably on the test bed (name the files, the
   property computed, and the expected outcome if the idea is right). If you can run code, run it and report.
4. **If it survives**: the certificate that would prove it for (3,10;40) (exact arithmetic, SAT with a checkable proof,
   LP/SOS, Lean) and its rough cost.
5. **Prior art and risk**: is it known, already used, or likely false?

Label every statement SOURCED (URL and the exact sentence), COMPUTED (code and output) or REASONED (not checked by a
machine). Say "I don't know" rather than guess. Do not claim a proof you have not checked.
