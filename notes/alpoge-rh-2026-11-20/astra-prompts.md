# Prompts for Astra 6.2 (an independent reader from another model family) — 2026-11-20

Paste each into its own Astra chat. Paste Astra's whole answer back here. Every file below is public at a pinned commit.

---

## AS1 — second reading of the statements (fidelity)

You are an independent reader. Do not trust anything below; check it.

Levent Alpöge's Lean release (alpo.ge, 20 Nov 2026) states five theorems. One uses Mathlib's definition, at Mathlib commit
0df444a360eaa60ab8c11dca51a86af692955474 (file Mathlib/NumberTheory/LSeries/RiemannZeta.lean):

    def RiemannHypothesis : Prop :=
      ∀ (s : ℂ) (_ : riemannZeta s = 0) (_ : ¬∃ n : ℕ, s = -2 * (n + 1)) (_ : s ≠ 1), s.re = 1 / 2

The other four are defined in the release's Statements.lean (it imports Mathlib only):

    def RiemannZetaZerosOnLine : Prop :=
      ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 2
    def DirichletLNonvanishingRightOfHalf : Prop :=
      ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
        1 / 2 < s.re → (χ ≠ 1 ∨ s ≠ 1) → DirichletCharacter.LFunction χ s ≠ 0
    def DirichletLZerosOnLine : Prop :=
      ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
        0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2
    def PrimitiveDirichletLZerosOnLine : Prop :=
      ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
        ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

Questions, answer each with OK or GAP plus one paragraph:
1. Is `RiemannHypothesis` exactly the classical Riemann Hypothesis? Check the quantifier, the excluded points, what
   Mathlib's `riemannZeta` is (including its value at s = 1) and the conclusion. Could the statement be vacuous or weaker?
2. Is each Dirichlet statement exactly what it should be? Mind imprimitive and principal characters, modulus 1, the
   condition χ ≠ 1 ∨ s ≠ 1, the strip 0 < Re s < 1, and what `DirichletCharacter.LFunction` is at s = 1.
3. "Generalized Riemann Hypothesis" usually means which L-functions? Which of those do these four statements cover,
   and which not (Dedekind zeta functions, Hecke L-functions of other number fields, automorphic L-functions)?
4. Anything else a careful number theorist would object to in these statements.
End with one line: FIDELITY: OK, or FIDELITY: GAP — <the gap in one sentence>.

---

## AS2 — check a claim about Masullo's draft before it is published

Alessandro Maria Masullo, "The Music of the Primes", 940-page draft posted 20 Nov 2026:
https://math216.wordpress.com/wp-content/uploads/2026/11/the-music-of-the-primes.pdf (sha256 e039d3f6cf0a4b14f03c7edb85097752dd65c0a2fe543c76fe992be234f97bf5)

We intend to state publicly: "The draft's main theorem on the zeros, Theorem 13.3.1.2 (page 522), is not yet stated: its
footnotes read 'Insert statement.' and 'State and prove the Main Theorems, also explaining how to deduce them by
approximation φ → e^{-s|log(t)|} as Re(s) > 1', the Trace Formula above it carries the footnote 'Correct statement.', and the
deduction cites a 'Theorem ??'. Its content is described in §14.1.2 (page 532, marked 'Correct this subsection'): if ρ is a
non-trivial zero of L(s, χ), then ρ ∈ 1/2 + iℝ, and if ρ ≠ 1/2 then N(ρ) ≤ [F : Q], for every number field F and every
unitary Hecke character."

Questions:
1. Is every part of that sentence accurate to the PDF (quote the exact text and page for each)? Correct anything wrong.
2. Search the WHOLE draft (introduction §1.4, the letters to Sarnak §1.7–1.8, Chapter 12, anywhere): is the main theorem
   on the location of the zeros (GRH) stated as a theorem anywhere else? Quote it with its page if so.
3. Our reading at F = ℚ, in Lean (Mathlib):
       ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
         ∀ ρ : ℂ, 0 < ρ.re → ρ.re < 1 → DirichletCharacter.LFunction χ ρ = 0 →
           ρ.re = 1 / 2 ∧ (ρ ≠ 1 / 2 → analyticOrderAt (DirichletCharacter.LFunction χ) ρ ≤ 1)
   Is this a faithful reading of the draft's description at F = ℚ? (Hecke characters of ℚ vs primitive Dirichlet
   characters; the twists |·|^{it}; "non-trivial zero"; what N(ρ) is.) Say what you would change.
End with one line: CLAIM: ACCURATE, or CLAIM: CORRECT IT — <how>.

---

## AS3 — red-team our verification plan

Our pre-registered plan for checking Alpöge's Lean release is public:
https://github.com/carlostoledo1891/cert-machine/blob/dde91825590803bd8c3632f94f34f259b7f2fb55/notes/alpoge-grh-preregistration-2026-11-20.md
(the challenge statement file: https://github.com/carlostoledo1891/cert-machine/blob/dde91825590803bd8c3632f94f34f259b7f2fb55/instruments/alpoge-grh/Challenge.lean;
the deviations: https://github.com/carlostoledo1891/cert-machine/blob/dde91825590803bd8c3632f94f34f259b7f2fb55/corpus/alpoge-grh/DEVIATIONS.md)

Assume the release is WRONG but its authors (or an error) made it pass. List every way it could pass all our checks
(build, #print axioms, Comparator against our challenge, the nanoda kernel on the export, leanchecker --fresh, the
fidelity readings), ranked by plausibility, and for each the cheapest additional check that would catch it. Include
Lean/Mathlib-level loopholes (definitions, instances, junk values, elaborator or kernel issues, the toolchain, the
Mathlib pin), process loopholes (our own challenge, our sandbox mode, the build-disk deviations), and anything we
overclaim in wording. Be concrete; no generic advice.
End with one line: TOP RISK: <one sentence>.
