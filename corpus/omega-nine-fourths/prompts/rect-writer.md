# Brief for the Phase 5 statement writer (ω = 9/4 lane, cert-machine, 2026-11-25)

You write, in Lean 4 with Mathlib only, the precise statements of the paper's Corollary 1.3 and of its exponent claim in
the paper's own model (with division gates), from the paper's words and the textbooks. You do NOT prove anything, and you
must NOT look at the claimant's Lean.

## Independence rules (binding)

- Do not open, fetch or search for anything under github.com/openai/math/lean/ (no Lean file of the release), and nothing
  under ~/Projects/cert-machine/corpus/omega-nine-fourths/ except this brief, the paper's text files named below, our own
  Phase 4 statements (phase4/writer/PerN.lean and phase4/writer/NOTES.md — ours, sealed in A14, not the claimant's), and
  your own folder phase5/writer/. If you meet the claimant's Lean by accident, stop reading and say so.
- You may read the paper's LaTeX (already fetched, read-only): corpus/omega-nine-fourths/proof-readers/astra/inputs/build/
  (intro.tex, consequences.tex, obstruction.tex), and Mathlib's source at ~/Projects/mathlib-src-d13f23b7.
- Write without running Lean. The file will be elaborated against Lean v4.34.1 / Mathlib d13f23b7; repairs are logged.
- Reuse PerN.lean's definitions where they fit (import nothing from it — copy them into your file under namespace Rect, so
  the file stands alone), and say in NOTES.md which ones you copied unchanged and which you generalised.

## What to state (intro.tex, Corollary 1.3, and its proof in consequences.tex)

"For all positive integers a, b, c, the geometric border rank of T_{a,b,c} and its asymptotic rank over F are at least
max{ab, bc, ca, (abc)^{3/4}}. Over every field, 1/2 ≤ α_F ≤ 2/3." — T_{a,b,c} is the multiplication tensor of an a×b
matrix by a b×c matrix; α_F is the supremum of the β ≥ 0 for which multiplying an n×⌊n^β⌋ matrix by a ⌊n^β⌋×n matrix has
exponent two in n, where cost is counted in the paper's formal arithmetic circuits (inputs independent variables,
constants in F, gates +, −, ×, and division by a nonzero rational function; each output equal to the product entry as an
identity of rational functions, also over finite fields; intro.tex lines 17–23).

Write, each as a `def … : Prop` with a docstring in words, in namespace `Rect`, file `phase5/writer/Rect.lean`:
1. `BorderRankRect` — for every field F (in `Type`) and all a, b, c ≥ 1, the geometric border rank of T_{a,b,c} over the
   algebraic closure of F is ≥ max{ab, bc, ca, (abc)^{3/4}} (as reals).
2. `AsymptoticRankRect` — for every field F and all a, b, c ≥ 1, the asymptotic rank of T_{a,b,c} over F (the limit of the
   k-th roots of the ranks of the k-th tensor powers; say whether you state the limit, the infimum, or both, and why they
   agree) is ≥ max{ab, bc, ca, (abc)^{3/4}}.
3. `AlphaBounds` — for every field F, 1/2 ≤ α_F ≤ 2/3, with α_F defined exactly as above in the paper's circuit model WITH
   division gates (define the cost of a circuit, the exponent of a family of products as the infimum of the s with cost
   O(n^s), and α_F as the supremum; say how you handle the floor and an empty set).
4. `DualExponentDiv` — the stronger statement α_F = 1/2 in the same model (the release states it for division-free
   programs; the paper does not claim it). State it so that it can be proved or reported NOT PROVED on its own.
Also NOTES.md: every definition's textbook source (Bürgisser–Clausen–Shokrollahi ch. 4, 7, 14, 15; Bläser 2013; mark "from
memory"), every choice and alternative, and a last line "I did not see the claimant's Lean statements" or what you saw.
