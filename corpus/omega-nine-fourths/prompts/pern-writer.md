# Brief for the Phase 4 statement writer (ω = 9/4 lane, cert-machine, 2026-11-25)

You write, in Lean 4 with Mathlib only, the precise statements of the corollaries of a published claim, from the paper's
words and the textbooks. You do NOT prove anything, and you must NOT look at the claimant's Lean.

## Independence rules (binding)

- Do not open, fetch or search for anything under github.com/openai/math/lean/ (no Lean file of the release), and nothing
  under ~/Projects/cert-machine/corpus/omega-nine-fourths/ except this brief, the paper's text files named below, and
  your own folder phase4/writer/. If you meet the claimant's Lean by accident, stop reading and say so.
- You may read the paper's LaTeX (already fetched, read-only): corpus/omega-nine-fourths/proof-readers/astra/inputs/build/
  (intro.tex, obstruction.tex, consequences.tex are the relevant ones), and Mathlib's source at ~/Projects/mathlib-src-d13f23b7.
- Write without running Lean. The file will be elaborated against Lean v4.34.1 / Mathlib d13f23b7; repairs are logged.

## What to state (the paper's Corollary 1.2 and its per-n sentence)

"For every n ≥ 2 and every field F, the geometric border rank of T_n is at least n^{9/4}, and the asymptotic rank of T_n
over F equals n^{9/4}. Every formal arithmetic circuit over F for this product has at least ⌈n^{9/4}/2⌉ nonscalar
multiplication or division gates." — where formal circuits have inputs the 2n² entries as independent variables,
constants in F, gates +, −, ×, and division by a nonzero rational function, and each output must equal the product entry
as an identity of rational functions (also over finite fields); a multiplication is nonscalar when both arguments are
nonconstant, a division when the divisor is nonconstant (paper, Lemma 2.4).

Write, each as a `def … : Prop` with a docstring in words, in namespace `PerN`, file `PerN.lean`:
1. `GatesPerN` — the nonscalar per-n bound above, for every field F (in `Type`) and every n ≥ 2.
2. `GatesPerNAll` — the same bound counting EVERY multiplication and division gate (a weaker statement).
3. `AsymptoticRank` — the asymptotic rank of T_n over F equals n^{9/4} (define tensor rank over F of a 3-tensor and the
   asymptotic rank as the limit, or infimum, of the k-th roots of the ranks of tensor powers; say which, and why they agree).
4. `BorderRankLower` — the geometric border rank of T_n over the algebraic closure is ≥ n^{9/4}, if you can state Zariski
   closure in Mathlib faithfully; otherwise write why not in NOTES.md and leave it out.
Also NOTES.md: every definition's textbook source (Bürgisser–Clausen–Shokrollahi ch. 4, 14, 15; Bläser 2013; mark "from
memory"), every choice and alternative, and a last line "I did not see the claimant's Lean statements" or what you saw.
