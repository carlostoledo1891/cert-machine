You are an independent research agent. This single message is the whole task: no other message will follow and nothing is attached. Work for as long as you can in this one reply, then end it with the final report described at the bottom. Afterwards every fact you report will be checked by an exact, independent verifier. You propose; you never certify.

THE PROBLEM

The stationary quadratic mean-field game on the torus R/Z, with sigma = 1/2 fixed:

    -sigma u'' + (1/2) (u')^2 + rho = c m + A cos(2 pi x)
    -sigma m'' - (m u')' = 0
    int_0^1 m = 1,   int_0^1 u = 0,   m > 0

The parameters are the coupling c (any real number) and the depth A >= 0. An equilibrium at (c, A) is a triple (u, m, rho), with u and m even, 1-periodic and analytic and m > 0 everywhere, that solves these lines exactly.

Conventions, fixed: u(x) = 2 sum_{k>=1} a_k cos(2 pi k x) and m(x) = 1 + 2 sum_{k>=1} b_k cos(2 pi k x). Put p_k = 2 pi k a_k, extended as an odd sequence (p_{-k} = -p_k, p_0 = 0); extend b as an even sequence with b_0 = 1; write (f*g)_k = sum over all integers j of f_j g_{k-j}. Then the system is, for k >= 1:

    0 = -(1/2) (p*p)_0 + rho - c
    0 = sigma (2 pi k)^2 a_k - (1/2) (p*p)_k - c b_k - (A/2) [k = 1]
    0 = sigma (2 pi k)^2 b_k + 2 pi k (b*p)_k

To check your conventions: at c = -12, A = 0.5 there are three equilibria, with b_1 = -0.5919, 0.1205 and 0.5207.

WHAT IS ALREADY KNOWN (finding it again is a correct reproduction, not an advance)

- For c >= 0 the equilibrium is unique (Lasry and Lions).
- At A = 0 the constant state (u, m, rho) = (0, 1, c) is an equilibrium for every c. Its linearisation degenerates at c = -sigma^2 (2 pi k)^2, k = 1, 2, ...; the first is c = -9.8696.
- A certified map of the rectangle c in [-18, 2], A in [0, 1.2], in 19,800 cells: at least two equilibria on 31% of the area, a unique one on 10% (the part with c >= 0), undecided on 59%. Most undecided cells are cells where only one solution was found; in the others solutions were found but the proof did not close over the whole cell.
- At A = 0 and c in {-11, -12, -14, -16, -20, -24}: at least three equilibria (the constant, a non-constant branch, and its shift by 1/2).
- A plain random-restart Newton search finds three equilibria in much of the region below the first bifurcation, and at A = 0.5 down to c = -80. It has never found more than three.
- Nobody has certified four or more equilibria at one (c, A).

The map and its certifier are public: github.com/carlostoledo1891/cert-machine, folder labs/mfg. You may read them.

WHAT WOULD BE NEW, most valuable first

1. Four or more distinct equilibria at one (c, A), or over a whole box of parameters.
2. Two or more equilibria where the map is undecided, or outside the map, in places where a plain search does not already find them.
3. A statement with a proof or strong evidence: where the equilibrium is unique for c < 0; a law for how many equilibria coexist and where; fold or bifurcation curves; non-even solutions for A > 0.
4. One free claim: anything else in mathematics that you judge more valuable than the above, with an exact statement, a finite witness and what would refute it.

You choose where to spend your effort and which methods to use.

RULES

- Keep conjecture, numerical evidence, exact computation and proof apart. Never present one as another.
- State every assumption. Keep failed attempts and negative results; they are part of the answer.
- Do not invent citations, data, logs or successful runs.
- If you establish nothing, say NO RESULT. That is a legitimate answer.
- You may run code and use the web. List the pages you used. Do not post, upload or sign in anywhere, and do not use memory from other conversations.
- Do not ask questions. If something is unspecified, state the assumption you made.

FINAL REPORT (end your reply with it)

For each claim:
- the exact statement;
- its status: PROVED, COMPUTATIONALLY SUPPORTED or CONJECTURE;
- your probability that it will survive the check;
- the method and the evidence;
- what would refute it, and what you have not established.

For every equilibrium you claim, give the numbers so that it can be checked, in one JSON block or file:

    {"claims": [{"id": "name", "c": [lo, hi], "A": [lo, hi], "N": 32,
                 "candidates": [{"rho": 0.0, "a": [a_1, ..., a_N], "b": [b_1, ..., b_N]}],
                 "probability": 0.8}]}

c and A are closed intervals (lo = hi for a single point); the candidates are given at the midpoint, at full double precision, with N at most 64. One claim lists all the equilibria you say coexist there. Candidates are checked exactly as given, so the residual should be near machine precision and the modes beyond N negligible; a density that comes close to zero cannot be certified.

Then: the code that reproduces your results, your negative results, and the pages you used.
