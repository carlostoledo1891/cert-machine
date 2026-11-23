# Theorem C35 (sealed 2026-11-22)

Any finite triangle-free simple graph with no independent set of size 10 that contains an induced copy of the
circulant C35(1,7,11,16) (vertices 0..34, u ~ v iff v − u ≡ ±1, ±7, ±11 or ±16 mod 35) has at most 39 vertices, and
any four distinct vertices outside the copy induce a 4-cycle. Exoo's 39-vertex (3,10)-graph attains the bound.

Corollary, given the uniqueness of the (3,9;35)-graph (Goedgebeur–Radziszowski 2013, Theorem 3): a triangle-free
graph on 40 vertices with no independent set of size 10 has no vertex of degree 4.

Lean 4.35.0, Mathlib 56a005855ea17e0b0958f73ec801ae140b0a1679. `RamseyScout.PathLemma.order_at_most_39`,
`four_outside_C4`, `lemma_P` and `no_degree_four` rest on propext, Classical.choice and Quot.sound only; Lemma P is
checked by the kernel (`decide +kernel`) on a 32,529-node certificate, with no native code.

Work of: the operator's scout with Astra 6.2 (Codex) and Claude (the statement, the bridge, the first SAT proofs and
the first enumeration), and cert-machine (the kernel-checked Lemma P, the independent deciders, the controls). The
record is P1-RESULT.md against P1-PREREG.md; every file's sha256 is in P1-SHA256SUMS.
