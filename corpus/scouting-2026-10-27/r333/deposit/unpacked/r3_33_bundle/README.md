# R(3,33) >= 241 and R(3,34) >= 244: certificate and checkers

**Graph.** G = Cay(Z_240, ±D) with D = {14, 34, 38, 40, 43, 50, 58, 60, 63, 67, 69, 70, 79, 87, 89, 99}.
G is 32-regular, triangle-free, and has independence number exactly 32 (every neighbourhood is an independent 32-set).
So K_240 has a 2-colouring with no K_3 in G and no K_33 in its complement, which gives **R(3,33) >= 241**.
Previous best: 230 (Coniglio, Furini, Ljubić, San Segundo, Thürauf, Traversi, arXiv:2608.18769).
By Burr–Erdős–Faudree–Schelp (Utilitas Math. 35, 1989), r(m,n) >= r(m,n-1) + 2m - 3, which gives **R(3,34) >= 244**
(previous best 239). The same certificate also gives R(3,34) >= 241 directly.

**Proof that alpha(G) <= 32.** G is vertex-transitive, and the multipliers {±1, ±13, ±37, ±71} mod 240 are
automorphisms fixing 0. Orbital branching gives 31 subproblems, each split further by its smallest next vertex,
and every piece is decided by an exact clique search. Three separately written solvers agree:
1. Search-side solver `src/clq4.c` (`results/R3_33_search_side_*`).
2. Checker `checker/check_ramsey.py` + `checker/mcq.c` (Tomita–Seki MCQ). It re-verifies triangle-freeness, the group
   table and the stabilizer, then runs 1,665 jobs. Result: VERIFIED (`results/checker_R3_33.log`).
3. `verification_main/` (bitset solver `bbmis.c` with its own orbital split, validated against brute force).
   1,665 jobs, all NO (`verification_main/k33.log`).

**Reproduce** (needs Python 3 and a C compiler):
```
clang -O3 -o mcq checker/mcq.c && mkdir -p bin && mv mcq bin/ && python3 checker/check_ramsey.py certificates/R3_33_n240_Z240.json
cd verification_main && clang -O3 -o bbmis bbmis.c && python3 drive.py 33 4
```

**Files.** `certificates/` (JSON: edge list, group table, connection set, stabilizer maps), `checker/`,
`verification_main/`, `src/` (the search code, a SAT-based search over Cayley graphs with multiplier symmetry), `results/`
(logs), and `WRITEUP.md` (the full note).

**How it was found.** The search code and the certificate were developed with Claude Code (Anthropic), an AI coding
agent, in a project directed by Satyajeeth Suresh Kannan. All claims rest on the finite certificate, which anyone can
check with independent software.

Code: MIT (LICENSE-CODE). Data and text: CC BY 4.0.
