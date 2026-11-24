Thank you — your round-1 answer checked out: every passage you quoted is in the paper where you said. Round 2 is computation only. Same sources (commit 918c8e2778aee18b0283dc5a33ed39ab3cd63a96, paper.pdf).

Task 1 — the crossing identity, Proposition B.2 (you named it the second most likely place for an error). Section B.3 defines, for four symbols s_a, s_b, s_c, s_d (Frobenius symbols: Σ1 at a and c with size n1 and energy e1, Σ2 at b and d with size n2 and energy e2), a square matrix M with entries in Z[X] built from the polynomials B(r, n) and C(r, n) (coefficients of t^n in (1+t)^r/(1+yt)^(r+1) and (1+yt)^r/(1+t)^(r+1), y = X²), and its determinant Ψ, whose coefficients give the tensors Ψ_N.
For every small case you can reach (at least (n1, e1, n2, e2) with n1, n2 ∈ {1, 2} and e1, e2 up to 6, all four sets nonempty), compute exactly, with integer arithmetic:
 (a) Σ_N Ψ_N as a tensor on (s_a, s_b, s_c, s_d), and whether it equals ⟨|Σ1|⟩_ac ⟨|Σ2|⟩_bd, that is [s_a = s_c]·[s_b = s_d];
 (b) for each N, the rank of Ψ_N flattened across {a, d} | {b, c}, against the bound (N + 1)·P(N);
 (c) for each N, the rank of Ψ_N flattened across {a, b} | {c, d}, against the bound (N′ + 1)·P(N′), N′ = 2(e1 + e2) − N.
P(E) is the number of symbols of energy at most E (Section B.1). State exactly how you read the sign convention ("up to a sign") and the order of rows and columns from the paper.

Task 2 — Theorem D.2, Steps 3–7, an exact linear-algebra check. Let d(x, y) be unknowns on pairs of μ×μ matrices over F_2, symmetric, d(x, x) = 0. For every matrix a and every transversal pair (W, W′) (column spaces independent, row spaces independent, both nonzero) impose (D.1) d(a+W′, a+W′+W) = d(a, a+W) and d(a+W, a+W+W′) = d(a, a+W′), and (D.2) d(a+W, a+W′) = 2d(a, a+W) + 2d(a, a+W′) − d(a, a+W+W′). Compute the exact dimension of the solution space for μ = 2 and μ = 3, and whether for μ = 3 it is spanned by d(x, y) = rk(x − y), as Steps 4–7 claim.

For both tasks: give the complete, self-contained Python code (standard library or sympy only, exact arithmetic, no floating point) and its complete output, so we can re-run it and get the same numbers. If a case does not finish, say which and why. Label anything not computed REASONED. Do not report a result you did not compute.
