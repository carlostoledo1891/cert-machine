Title: Theorem A.3 of arXiv:2609.23327, checked in Lean

@domotorp, your appendix is headed "Appendix by ChatGPT — unchecked", so this may be useful to you. I have Lean proofs of your Theorem 1 and of Theorem A.3 as printed, through OpenAI's classification; Claude (Anthropic's AI model) wrote the Lean under my direction. They are in this repository, built inside openai/math (Lean v4.34.1). They rest on the three standard axioms only, and Lean's kernel, run from scratch, and four independent kernels accept them.

- **Theorem 1.** `not_ramsey`: for every transcendental r > 2 your seven points are not Ramsey, in OpenAI's sense. `graham_false'`: formal-conjectures' statement of Graham's conjecture is false. formal-conjectures PR #7706 now links it.
- **Theorem A.3.** `generic_seven_not_ramsey`: if t₁, t₂, t₃ are distinct and t₄, …, t₇ are algebraically independent over ℚ(t₁, t₂, t₃), the seven points p(tᵢ) are not Ramsey. There is also a corollary in the shape of OpenAI's nine-point theorem.

Not covered: the "almost every" clause (no measure-zero argument is formalized), Theorems A.7 and A.12, and the rest of the appendix.

One remark on the paper, not an error. Equation (2) asks Σ λ_p D(p) pᵀ = 0, and for the heptagon it holds. For A.3's configuration it does not. At t = (0, 1, 2, 3, 5, 7, 11), with the proof's weights and derivation, the matrix is [[92, −86], [−86, −92]] / 19825: symmetric, not zero. The appendix's proof goes through Lemma A.1, which needs only symmetry, so A.3 is right as printed; it could not have been proved through Equation (2). The Lean proof carries the symmetric form (`moment_M` in `Moments.lean`).

Before any Lean, two programs written from the paper alone also decided every finite identity in the proofs of Theorem 1 and A.3 exactly: 97 and 152 identities, all hold. The full account is at https://carlostoledo.co/reports/heptagon.html.

No reply needed; close this whenever you like.
