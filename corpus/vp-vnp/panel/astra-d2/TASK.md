# Astra task: an exact check of Steps 3–7 of Theorem D.2 at μ = 2 and μ = 3 (VP ≠ VNP lane, cert-machine, 2026-11-24)

Context. Anthropic's paper "VP ≠ VNP over every field" (pinned; its text, extracted, is at
/private/tmp/claude-501/-Users-carlostoledo-Projects-cert-machine/c023a269-07c9-4e3b-86a9-7a5bd283b137/scratchpad/vpvnp-paper.txt,
Appendix D at lines 1662–1792; read it) proves Theorem D.2 by assuming a "price" on the group Mat_μ(F_2) of μ × μ
matrices over F_2 with equality in every quadrilateral of Figure 6, and deducing in Steps 3–7 that the squared
distance is the rank: |a, a'|² = rk(a − a'). The Lean development proves this theorem; this task is an independent,
human-readable shadow of its linear-algebra core, proposed by an outside reader (Grok).

The question. Let d(x, y) = |x, y|² be unknown reals on pairs of matrices of Mat_μ(F_2), with d(x, y) = d(y, x) and
d(x, x) = 0. Impose, for every matrix a and every transversal pair (W, W') (column spaces independent and row spaces
independent, both nonzero), the relations the proof derives from equality in Lemma C.4(b):
  (opposite sides) d(a + W', a + W' + W) = d(a, a + W)  and  d(a + W, a + W + W') = d(a, a + W')   [this is (D.1)]
  (D.2)            d(a + W, a + W') = 2 d(a, a + W) + 2 d(a, a + W') − d(a, a + W + W').
Compute EXACTLY the dimension of the space of solutions of this homogeneous linear system, for μ = 2 and μ = 3.
The proof's Steps 4–7 claim that for μ ≥ 3 every solution is a multiple of d(x, y) = rk(x − y) (Step 5 uses μ ≥ 3).
So the expected outcome: μ = 3 dimension exactly 1 (spanned by the rank); μ = 2 possibly larger (if so, list a basis
or its structure). Check also that d = rk(x − y) satisfies every relation.

Method: your choice, but EXACT (rational arithmetic, or a rank computation modulo a large prime p plus the argument
that nullity over Q ≤ nullity mod p, made explicit, plus the rank solution itself). For μ = 3 there are 512 matrices
and 130,816 unknowns; exploit sparsity or the symmetry group (translations, GL_3 × GL_3, transpose) only if you can
justify that the result is the dimension of the FULL solution space, not of the invariant part. Stopping rule: at most
2 CPU-hours on this Mac; if μ = 3 does not finish, report μ = 2 and how far μ = 3 got.

Hand back in work/: the code, its full output, and REPORT.md (the system you built, how many equations, the exact
dimensions, and whether the outcome agrees with Steps 4–7). Label everything COMPUTED (code + output) or REASONED.
