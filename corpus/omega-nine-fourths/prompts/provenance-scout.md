# Brief for the provenance scout (ω = 9/4 lane, cert-machine, 2026-11-25)

Find, with sources, where the claim "ω_F ≤ 9/4" (the UPPER bound) comes from and how the community has received this
release and its predecessors. Write ONE file: corpus/omega-nine-fourths/provenance/SCOUT.md. Each fact gets its URL, a
short verbatim quote and the source's date; mark READ or INFERRED. Never put any personal name, e-mail or project name
of the person you work for in a query. About 40 searches at most (other agents share the budget). `date -u` before any
time you write.

1. The OpenAI preprint(s) credited with the upper bound over ℂ (the paper's reference [41]; the scope note names
   "Complex Matrix Multiplication Below 2.258 and Rectangular Bounds" and "Staggered extraction for exact matrix
   multiplication over every field", both 2026-09-24, in github.com/openai/math/preprints): what each claims, whether
   it has a Lean formalization and Comparator config, and whether anyone outside OpenAI has checked it.
2. Amanov, van den Berg and Zuiddam (the paper's reference [5]) and Lü (reference [39]): the exact papers (arXiv ids,
   dates, venues), what each proves, refereed or not.
3. The state of the art as others state it in November 2026: DeepMind's AlphaEvolve notebook (google-deepmind/
   alphaevolve, omega/verification.ipynb) says "The current best bound is ω < 2.371339"; find any survey, blog, talk or
   paper after September 2026 that cites ω ≤ 9/4 or 2.258, or disputes it.
4. Any public reaction to the November 24 release (GitHub issues on openai/math, blogs, Mathstodon, X, Hacker News is
   NOT to be cited, mailing lists), verbatim with links, up to the time you write.
5. Known results the lower bound ω ≥ 9/4 would collide with or overturn (ω = 2 conjecture evidence, barriers for
   border-rank lower bounds, the best known lower bounds for matrix multiplication circuits), with exact references.
End with "WHAT THIS CHANGES FOR THE AUDIT" in five lines at most.
