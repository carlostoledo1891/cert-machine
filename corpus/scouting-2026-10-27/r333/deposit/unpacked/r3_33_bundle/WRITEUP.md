# New lower bounds for the Ramsey numbers R(3,33) and R(3,34)

**Results.**
- **R(3,33) ≥ 241.** Previous best: 230 (Coniglio, Furini, Ljubić, San Segundo, Thürauf, Traversi,
  arXiv:2608.18769, Aug 2026, using a 229-vertex circulant). Radziszowski's survey DS1 #18 (Apr 2026) lists 227.
- **R(3,34) ≥ 244.** Previous best: 239 (same paper; DS1 #18 lists 234). This follows from R(3,33) ≥ 241 and the
  Burr–Erdős–Faudree–Schelp inequality R(m,n) ≥ R(m,n−1) + 2m − 3 (Utilitas Math. 35, 1989), which is +3 for m = 3.
  The graph below also gives R(3,34) ≥ 241 directly.

## The construction

Let G be the circulant (Cayley) graph on Z_240 with connection set S = ±D, where

D = {14, 34, 38, 40, 43, 50, 58, 60, 63, 67, 69, 70, 79, 87, 89, 99}.

So x ~ y iff (x − y) mod 240 ∈ S. G is 32-regular with 3,840 edges.

**Claim.** G is triangle-free and α(G) = 32. Then K_240 has a 2-colouring with no blue K_3 (blue = G) and no red K_33
(red = complement), so R(3,33) > 240.

- α ≥ 32 because every neighbourhood is an independent set (G is triangle-free).
- α ≤ 32 is the computational part.

S is invariant under x ↦ 13x and x ↦ −x. So the 8 multipliers a ∈ {±1, ±13, ±37, ±71} (mod 240) fix vertex 0 and are
automorphisms. Together with the 240 translations they form an affine group of order 1,920.

## How it was found

1. **Search space.** Cayley graphs Cay(Γ, S) on many groups Γ. SAT variables are the inverse pairs {s, −s}, and
   triangle-freeness is a fixed set of clauses.
2. **CEGAR loop.** An incremental SAT solver (CaDiCaL via PySAT) proposes S. An exact bitset branch-and-bound clique
   search looks for a red K_k through vertex 0. Each clique found becomes a clause (S must contain one of the clique's
   differences), together with its images under group automorphisms. We also use lex-leader symmetry breaking and
   greedy maximal extension of S.
3. **Multiplier symmetry.** We require S = h·S for a unit h of small order. This cuts the number of variables by ord(h).
4. **Where to look.** The 2026 circulant campaign raised the order one step at a time (24 h CPLEX runs) and stopped at
   the first failure. Circulant Ramsey graphs are not monotone in the order, so we swept orders L…L+12 above each
   current bound, for every cyclic multiplier subgroup of order ≤ 12. The graph was found in the k = 34 sweep at
   order 240 with h = 13, in under 200 SAT iterations. When the k = 33 sweep reached the same order and proposed the
   same graph, the quick check failed to find an independent 33-set. That flagged it for a full proof, which showed
   α = 32.

All computation ran on a MacBook Pro (M5 Pro). No paid compute was used.

## Verification (three independent proofs that α(G) ≤ 32, plus the same for α ≤ 33)

The graph is vertex-transitive, so it suffices to rule out an independent 33-set through vertex 0. The stabilizer
{x ↦ a·x} splits the 207 non-neighbours of 0 into 31 orbits. Any such set can be moved so that it contains the
representative of the first orbit it meets and avoids all earlier orbits ("orbital branching").

1. **Search-side solver** (`src/clq4.c`: bitset branch-and-bound, greedy-colouring bound, degeneracy ordering). All 31
   subproblems: no clique. The slowest took 290 s. Log: `results/R3_33_search_side_clq4_subproblems.jsonl`.
2. **Independent checker** (`checker/check_ramsey.py` + `checker/mcq.c`: Tomita–Seki MCQ, plain arrays, no shared
   code). It re-verifies triangle-freeness, the group table, transitivity and the stabilizer maps, then recomputes the
   orbits and runs 1,665 split jobs. Result: **VERIFIED, 1,665 jobs, 1,969 s on 4 cores** (`results/checker_R3_33.log`). It passes a negative
   control (it rejects a false R(3,13) claim) and re-verifies the published R(3,13), R(3,20) and R(3,24) certificates.
3. **Third verification by a separate agent session** (`verification_main/`): its own bitset solver `bbmis.c`,
   validated against brute force on 300 random graphs, with its own orbital split. 1,665 jobs, all NO, in 1,049 s.

The earlier R(3,34) certificate (α ≤ 33) was verified by the search-side solvers, by the MCQ checker (VERIFIED, 5,433 s
on 7 cores) and by a fresh re-run of the MCQ checker in the other session (487 s).

Certificates: `certificates/R3_33_n240_Z240.json` and `certificates/R3_34_n240_Z240.json` (the same graph, different
k). Each contains the connection set, the full edge list, the Z_240 group table and the stabilizer maps.

## Negative results (exact UNSAT proofs unless noted)

- **R(3,k), k = 10…23, at the critical order:** about 200 groups (abelian, metacyclic, metacyclic × cyclic,
  generalized dihedral). All UNSAT, except some dihedral-type timeouts. For example, no Cayley (3,18)-graph exists on
  any of the 16 order-100 groups tested.
- **R(K3, Kk − e), k = 11…16,** orders L…L+3: 156 groups, all UNSAT.
- **One-vertex extensions** of the published circulants for R(3,13), R(3,16) and R(3,24): impossible.
- **Symmetric-circulant sweep:** `results/symmetric_circulants.log`. Still running; see HANDOFF.md.
- **GF(7) linear codes, k = 4:** 820 prescribed-automorphism groups, no improvement.
- **La Jolla Covering Repository:** frozen since March 2026.

## AI-use statement

This search was designed, coded and run by **Claude Code (Anthropic's AI coding agent, model Claude Opus 5.5)**,
working autonomously on Jeetu SK's computer in a project that Jeetu set up and directed: the goal, the venues and the
rules (free compute only, exact certificates, honest credit). A second Claude Code session wrote the third
verification. Jeetu should state in his own words which parts he personally checked or re-ran. The claim itself is a
finite certificate that anyone can verify with independent software.

## Credit and prior work

- Circulant search for R(3,k) and the previous records: Coniglio et al. (2026). Our graph is new; its order (240) is
  above every circulant order they report for k = 33 and k = 34.
- Multiplier-invariant circulants are a classical idea (residue graphs; Exoo; Exoo–Tatarevic).
- The step from k = 33 to k = 34 is the Burr–Erdős–Faudree–Schelp construction (1989).
