# Brief for a blind statement writer (ω = 9/4 lane, cert-machine, 2026-11-25)

You will write, in Lean 4 with Mathlib, the precise statement of a published claim in algebraic complexity theory, from
the standard textbook definitions. You are NOT asked to prove anything. Your file will later be compared with the
claimant's own Lean statement by proving one from the other; your value is that you have not seen it.

## Independence rules (binding)

- Do not open, fetch or search for: the repository github.com/openai/math (any folder of it), any paper or page titled
  or about "The matrix multiplication exponent is nine fourths", "Euclidean geometry in the asymptotic spectrum of
  tensors", "Complex Matrix Multiplication Below 2.258", "Staggered extraction", any post that discusses them, and any
  file under ~/Projects/cert-machine/corpus/omega-nine-fourths/ other than this brief and your own output folder.
- If you meet such material by accident, stop reading it and say so in your report (what, where, how much).
- You may read Mathlib's own source to get names right (where: see your section below). Nothing else of Lean.
- Write without running Lean. The file will be elaborated later against Lean v4.34.1 and Mathlib at commit
  d13f23b723b8a846827a245b89c10fc7d3f11612; name repairs will be logged as deviations, never hidden.

## The claim, in words (the claimant's own sentences)

1. "Over every field F, the exponent of square matrix multiplication is ω_F = 9/4. Here ω_F is the infimum of the real
   numbers s for which two n × n matrices can be multiplied in O_{F,s}(n^s) scalar operations." The claimant's
   formalization (not its paper) restricts to programs WITHOUT division: "The model counts additions, subtractions,
   and multiplications in division-free programs and requires formal polynomial identities even over finite fields."
   State the division-free version as your main proposition. If you can, state the version with division gates
   too (each output equal to the product's entry as an identity of rational functions), as a second proposition.
2. "The dual exponent, the supremum of t ∈ [0,1] with ω(F;1,1,t) = 2, is α(F) = 1/2." The textbook dual exponent is
   about multiplying an n × ⌊n^t⌋ matrix by an ⌊n^t⌋ × n matrix. Say which dimension your ω(F;a,b,c) gives weight to.
3. Rectangular: for positive weights a, b, c, the exponent of multiplying an n^a × n^b matrix by an n^b × n^c matrix
   (rounded to integers as your textbook does) is, with the weights sorted as x ≥ y ≥ z > 0,
   ω(F;a,b,c) = x + y + [max(0, (x + y)z − xy)]² / (4xyz).

The claim does not fix every convention. Where textbooks differ (what is counted, constants, rounding n^a, the form of
the O(·) bound, whether ω is defined by total arithmetic cost or by tensor rank), choose one and list the alternatives
you know in your notes.

## What to hand back

1. One Lean file, `import Mathlib` only, in your namespace (below), with your program model, its cost, correctness as a
   formal polynomial identity, your exponent ω(F;a,b,c) and α(F), and three or four propositions, each a
   `def … : Prop` (no proofs): `SquareExponent` (claim 1, division-free), `DualExponent` (claim 2),
   `RectangularExponent` (claim 3), and if you wrote it, `SquareExponentWithDivision`. Fields may live in `Type`.
   Every definition gets a docstring saying what it is in words.
2. NOTES.md: for every definition, the textbook definition it follows (book or survey, chapter or definition number —
   mark "from memory" when it is), every choice where textbooks differ and why, and anything ambiguous in the claim.
3. A last line in NOTES.md: "I did not see the claimant's Lean statement" — or exactly what you did see.

## Writer A (a Claude agent)

Follow Bürgisser–Clausen–Shokrollahi, *Algebraic Complexity Theory* (1997), chapters 4 (straight-line programs) and 15
(the exponent of matrix multiplication). Namespace `BlindA`, file `BlindA.lean`, in corpus/omega-nine-fourths/blind/A/.
You may read Mathlib's source at that exact commit in ~/Projects/mathlib-src-d13f23b7 (a checkout of
d13f23b723b8a846827a245b89c10fc7d3f11612) or on GitHub at that commit, only.

## Writer B (GPT-6.2-astra, Codex CLI, no network)

Follow Bläser, *Fast Matrix Multiplication*, Theory of Computing Graduate Surveys 5 (2013), and the arithmetic-circuit
tradition (circuits as directed acyclic graphs). Namespace `BlindB`, file `BlindB.lean`, in your task folder. You may
read the local Mathlib source at ~/Projects/mathlib-src-d13f23b7 (the exact commit d13f23b7).

## Your role and folders

You are WRITER B. Write BlindB.lean and NOTES.md in your work/ folder (the only folder you can write). You have no network. The Mathlib source is at ~/Projects/mathlib-src-d13f23b7. Other files on this disk about the claim exist (for example under ~/Projects/cert-machine/corpus/omega-nine-fourths/ and in temporary folders); the independence rules forbid opening them. Your final message: the propositions you wrote and the independence line of NOTES.md verbatim.
