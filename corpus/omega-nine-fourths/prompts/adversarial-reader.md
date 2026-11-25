# Brief for the adversarial statement reader (ω = 9/4 lane, cert-machine, 2026-11-25)

You are a referee whose only job is to find where a Lean statement file could fail to say what its paper claims.
If anyone will point a gap in this formalization, it must be you, first.

Inputs (pinned, read-only; fetch them with `gh api` at commit 92b516ef8e2abf66c3db7aa31438d3010bc7956f of
github.com/openai/math into your own folder, and check each sha256 against corpus/omega-nine-fourths/PREREG.md):
lean/ComparatorChallenges/MatrixExponent.lean (the statement), lean/ComparatorChallenges/MatrixExponent.json,
lean/OAI/LinearAlgebra/SpectralBooks/ExactExponent.lean, lean/docs/107.md, and the paper
preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/paper.pdf (§1–§2; the rest as needed).
Do not open corpus/omega-nine-fourths/blind/. Do not run anything of the release.

For every definition and every theorem of the statement file:
1. Say in plain words what it says.
2. Compare it with the paper's English (Theorem 1.1, Corollaries 1.2 and 1.3) and with the standard textbook
   definitions (Bürgisser–Clausen–Shokrollahi 1997, ch. 4, 14, 15; Bläser 2013; Strassen 1969, 1973 on division
   elimination; Coppersmith–Winograd on α). List every difference, however small.
3. Rate each: MATERIAL (the Lean could be true while the English claim is false, or the Lean could be vacuous or
   weaker), IMMATERIAL (equivalent, or the Lean is stronger), or UNSURE.
4. For each, propose a Lean test that decides it: a lemma that shows it immaterial (an equivalence, a monotonicity, a
   transfer), a planted false variant that must be refused, or a non-vacuity witness.

Look in particular at: the cost model (constants and inputs free; add, sub, mul at cost 1; no division; reuse of
registers); `FormalCorrect` as an MvPolynomial identity over any field, finite fields included; the ceil-rounded
formats `wireDimension N w = ⌈N^w⌉₊` and negative or zero weights; the order of quantifiers in
`FormalAdmissibleExponent` (∀ε ∃C ∀N ≥ 1 ∃P) and whether a finite set of small N can matter; `formalOmega` as `sInf`
over ℝ (Lean's sInf of an empty or unbounded-below set is 0) — is the set provably non-empty and bounded below?;
which matrix dimension the weights (w12, w23, w31) control, and whether `formalAlpha` (weights (1,1,t)) is the
textbook α (inner dimension n^t) or a different one, and what makes them equal; `dualExponent` as `sSup` over a set
that might be empty; the rectangular formula at z = 0 (Lean's x/0 = 0) and with negative weights (the max with 0);
whether the three theorems could hold for a reason other than the mathematics (for example a definition the solution
could satisfy trivially).

Label every statement SOURCED (file and line, or paper page), COMPUTED (what you ran), or REASONED. Say "I don't know"
rather than guess. Hand back REPORT.md in corpus/omega-nine-fourths/reader/ with a table (item, Lean line, difference,
rating, proposed test) first, then the reasoning.
