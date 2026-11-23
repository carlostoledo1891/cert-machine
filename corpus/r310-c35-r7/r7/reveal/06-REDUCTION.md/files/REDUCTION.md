# R(7): the reduction, in one file (Claude, 2026-11-22; PRIVATE; for Astra to read against)

Every step below is either a premise (marked P), a derivation given in full (marked D), or a finite fact computed by named code
(marked C). Nothing is assumed silently. Please try to break any D step.

## 0. The statement the run is about
**R(7).** No graph G has all of these: 40 vertices, 9-regular, triangle-free, independence number α(G) ≤ 9, and two non-adjacent
vertices u, w with exactly 7 common neighbours.

## 1. The fixed part
Let G be such a graph. Write C = N(u) ∩ N(w), A = N(u) − C, B = N(w) − C and X = V − N[u] − N[w].

- **D1.** |C| = 7 and |A| = |B| = 2 by 9-regularity, so |X| = 40 − 2 − 7 − 2 − 2 = 27.
- **D2.** N(u) = C ∪ A and N(w) = C ∪ B are independent, because G is triangle-free. So a vertex of C has no neighbour in C ∪ A ∪ B, the
  two vertices of A are non-adjacent, and so are the two of B.
- **D3.** u and w have no neighbour in X, by the definition of X.
- **D4.** X is triangle-free and α(X) ≤ 7: for I independent in X, {u, w} ∪ I is independent in G (D3, and u, w non-adjacent), so
  |I| + 2 ≤ 9.
- **D5. Edge count.** Each x in X has degree 9, so the number of edges between X and C ∪ A ∪ B is 243 − 2e(X).
  - Each c in C has neighbours u, w and nothing else outside X (D2), so it has exactly 7 neighbours in X: 49 edges.
  - Each a in A has neighbour u, its neighbours in B, and the rest in X. The same holds for B with w. Together A ∪ B send
    4·8 − 2e(A,B) edges to X.
  - So 243 − 2e(X) = 49 + 32 − 2e(A,B), that is, **e(X) = 81 + e(A,B) ≤ 85**.
- **P1.** e(3,8,27) = 85: every triangle-free graph on 27 vertices with α ≤ 7 has at least 85 edges (Goedgebeur–Radziszowski 2013).
- **D6.** From D4, D5 and P1: e(X) = 85 and e(A,B) = 4. So every vertex of A is adjacent to every vertex of B, and each vertex of A ∪ B
  has exactly 9 − 1 − 2 = 6 neighbours in X.
- **P2.** McKay's list r38_27.g6 of the triangle-free graphs on 27 vertices with α ≤ 7 is complete.
- **C1.** That list (sha256 9a2e9723…, 477,142 graphs) contains exactly 4 graphs with 85 edges, and none with fewer (`g6filter.py`). They
  are `cores_e85.g6` (sha256 6b237361…), named X0–X3. Each has degree sequence 7¹² 6¹¹ 5⁴, 750 independent 7-sets, 2,833 independent
  6-sets, 12,462 independent sets in all, and a trivial automorphism group (`r7count.c`; nauty).
- **D7.** So X is isomorphic to one of X0–X3. Fix an isomorphism and identify X with that core.

Chen's Lean development proves D5–D6 as Lemma R7 (`R310.R7.r7_count`, `r7_cover`); the control room built it in the audit. This file
does not depend on it beyond P1.

**The graph so far.** Vertices: X (27, edges known), u, w, C (7), A (2), B (2). Known edges: those of X; u–C, u–A, w–C, w–B; A–B
complete. Unknown: only the **rows**, row(s) = N(s) ∩ X for the 11 vertices s of C ∪ A ∪ B.

## 2. The constraints on the rows (all D)
- **Degrees.**
  - |row(c)| = 7 for c in C, and |row(s)| = 6 for s in A ∪ B (D5, D6).
  - Each x in X lies in exactly 9 − deg_X(x) rows.
- **Triangles.** G is triangle-free if and only if both conditions hold:
  1. every row is independent in X (a triangle s, x, x′);
  2. no x lies in a row of A and a row of B (a triangle a, b, x; A–B edges are the only edges inside C ∪ A ∪ B).

  There are no other triangles: the fixed part is triangle-free, and u, w have no neighbour in X.
- **Independence.** A set J = T ∪ I, with T outside X and I inside X, is independent if and only if T is independent in the fixed
  part, I is independent in X, and I meets no row of a vertex of T.
  - The independent sets of the fixed part are exactly the subsets of C ∪ A, C ∪ B, {u} ∪ B, {w} ∪ A and {u, w}. Reason: u is adjacent
    to all of C ∪ A, w to all of C ∪ B, and A is completely joined to B.
  - For a fixed independent I, write h_Q(I) for the number of rows of group Q (with multiplicity) that meet I. The largest independent J
    with J ∩ X = I has size
    max( |I| + 9 − h_C(I) − h_A(I), |I| + 9 − h_C(I) − h_B(I), |I| + 3 − h_B(I), |I| + 3 − h_A(I), |I| + 2 ).
  - So **α(G) ≤ 9 if and only if, for every independent I of X**:
    - (i) h_C(I) + h_A(I) ≥ |I| and h_C(I) + h_B(I) ≥ |I|;
    - (ii) h_A(I) ≥ |I| − 6 and h_B(I) ≥ |I| − 6;
    - (iii) |I| ≤ 7.
  - (iii) is D4. (ii) is automatic for |I| ≤ 6. For |I| = 7 it says the union of the two A rows meets every independent 7-set, and the
    same for B. Call this the **root condition**.
  - (i) must hold for every independent I, including small and non-maximal ones. It is not monotone: enlarging I can raise h by more
    than it raises |I|.
- **Tested (C2).** On 70,000 random row systems and on 942,031 nine-regular triangle-free completions met in the runs, α computed by a
  generic routine on the 40-vertex graph equals the formula above, with 0 mismatches (`r7complete.c`, `eq` mode and `EQCHECK`).

## 3. The configuration list
A **side choice** is an unordered pair {S₁, S₂} of independent 6-sets of X whose union meets every independent 7-set of X. A
**configuration** is an unordered pair of side choices whose unions are disjoint.

- **D8.** In G, the rows of A form a side choice (degrees; triangles 1; root condition), and so do the rows of B. Their unions are
  disjoint (triangles 2). So G gives a configuration on its core.
  - Exchanging the names of the two A vertices, or of the two B vertices, changes nothing.
  - Exchanging A with B (and u with w) is a symmetry of every constraint in §2. So which side is called A does not matter, and the
    unordered pair loses nothing.
  - No automorphism of X is used: there is none besides the identity (C1).
- **C3.** `configs.bin` (sha256 76c2666b…) lists every configuration on the four cores: 261,824 + 261,586 + 226,943 + 226,655 =
  **977,008**. Each record is (core, a1, a2, b1, b2), with the 6-sets indexed in the order of the recursion in `r7count.c`.
  - Three independent enumerations agree: Codex's count, `r7count.c` (two counting methods), and the control room's, which is
    byte-identical to `configs.bin`.
- **So:** if G exists, then for at least one of the 977,008 configurations, the seven C rows can be chosen to satisfy §2.

## 4. The completion problem for one configuration
Fix a configuration. Put r′(x) = 9 − deg_X(x) − (number of the four side rows containing x). The unknowns are the seven C rows.
- (T) each C row is independent in X;
- (D) each C row has exactly 7 vertices, and each x lies in exactly r′(x) C rows;
- (I) for every independent I of X: h_C(I) ≥ |I| − min(h_A(I), h_B(I)).

By §2 a completion exists exactly when G exists with this configuration. Note that (T) and (D) make each C row a maximum independent
set of X.

## 5. The CNF (`r7cnf.c`)
Variables x[c,y] for c = 0..6 and y = 0..26, with number 1 + 27c + y, plus counter variables.
- (T) the clause (¬x[c,y] ∨ ¬x[c,y′]) for every c and every edge yy′ of X.
- (D) sequential-counter encodings (Sinz 2005) of "exactly 7 of x[c,·]" for each c and "exactly r′(y) of x[·,y]" for each y. The
  counter variables are functionally harmless: any assignment of the x variables that meets the cardinalities extends to them.
- (I) for an independent I with m = |I| ≥ 1, let m_Q be the number of rows of side Q that miss I, and k = 10 − m − max(m_A, m_B).
  - (i) for this I says: at most k − 1 of the C rows miss I.
  - Encoding: for every k-subset C′ of the seven C indices, the clause ⋁ { x[c,y] : c ∈ C′, y ∈ I }.
  - If k > 7 there is nothing to say. k ≤ 0 would be a root-condition failure; the generator exits with an error, and this happens for
    no configuration in the samples.
- (S) the lexicographic order of the rows: row c ≤ row c+1 for c = 0..5, with y = 0 the most significant position (the usual
  prefix-equality encoding with fresh variables).
  - **Soundness of (S).** (T), (D) and (I) are invariant under every permutation of the seven C indices: (T) and the row sums are
    per-row and identical for each row, the column sums are symmetric, and (I) ranges over all k-subsets. So any solution can be
    permuted to one with sorted rows. Equal rows are allowed.
- **The reduced CNF (levels 3 and 4).** The same CNF with the (I) clauses kept only for |I| ≤ 3, or |I| ≤ 4. It is a **subset of the
  clauses** of the full CNF on the same variables, so a refutation of it refutes the full CNF. A SAT answer on a reduced CNF says
  nothing, and the pipeline then moves to the next level; level 7 is the full CNF.
- **Compared with Chen's builder (C4).** On 8 configurations, Chen's `cases/r7_glue.py` CNF with the side rows substituted has the same
  (T) clauses. Every (I) clause of `r7cnf` occurs in it literally, and every one of its independence clauses is subsumed by one of
  ours (`compare_chen.py`).
- **Controls (C5).** With the bound 10 in place of 9 ("K = 10"), the same generator and solver return SAT on configurations where the
  exact search finds completions. Each decoded graph is 9-regular, triangle-free and has α = 10.

## 6. What the production run adds
For each of the 977,008 configurations: a CaDiCaL LRAT refutation of the level-3, level-4 or full CNF, accepted by Heule's lrat-check
and by the verified checker cake_lpr. If every configuration is so certified, then by §3–§5 no G exists, under the premises below.

## 7. Premises of the final statement
- **P1.** e(3,8,27) = 85 (Goedgebeur–Radziszowski).
- **P2.** McKay's (3,8;27) list is complete.
- **P3.** `configs.bin` is the complete list of configurations (C3: three agreeing enumerations; not a checked proof).
- **P4.** `r7cnf.c` writes the CNF described in §5 (read by eye; C4 on 8 configurations; C5).
- **P5.** The derivations D1–D8 and §2, as written here (not formalised).
- **P6.** The checkers: cake_lpr (verified down to machine code) and lrat-check, and CaDiCaL's proofs as they accept them.
