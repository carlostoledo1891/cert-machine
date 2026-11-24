# Brief for a blind statement writer (VP ≠ VNP lane, cert-machine, 2026-11-23)

You will write, in Lean 4 with Mathlib, the precise statement of a published claim in algebraic complexity theory, from
the standard textbook definitions. You are NOT asked to prove anything. Your file will later be compared with the
claimant's own Lean statement by proving one from the other; your value is that you have not seen it.

## Independence rules (binding)

- Do not open, fetch or search for: the repository github.com/anthropics/formal-math (any folder of it), the paper
  "VP ≠ VNP over every field", any page, post or file that discusses that claim, and any file under
  ~/Projects/cert-machine/notes/vp-vnp-2026-11-23/ or ~/Projects/cert-machine/corpus/vp-vnp/ other than this brief.
- If you meet such material by accident, stop reading it and say so in your report (what, where, how much).
- You may read Mathlib's own source to get names right (where: see your section below). Nothing else of Lean.
- Write without running Lean (there is no compiler for you). The file will be elaborated later against Lean v4.33.1 and
  Mathlib at commit 0df444a360eaa60ab8c11dca51a86af692955474; name repairs will be logged as deviations, never hidden.

## The claim, in words (the claimant's own sentences, from its abstract and numbered statements)

1. Main theorem. There is an absolute constant c > 0 such that for every p, zero or prime, there is m₀ with the
   following property. Over every field of characteristic p and for every m ≥ m₀, every arithmetic circuit for the
   Hamiltonian cycle polynomial HC_m, and every circuit for the permanent PERM_m if p ≠ 2, has more than
   m^(c·(log₂ m)^(1/3)) gates.
2. Corollary. Over every field, VP is a proper subset of VNP.
3. Approximate computation. Let k be a field, and k((ε)) the field of formal Laurent series over k. A circuit over
   k((ε)) approximates a polynomial f over k if it computes a polynomial of the form f + ε·g, where g is a polynomial
   all of whose coefficients lie in k[[ε]]. The class VP-bar is defined like VP, with approximating circuits in place of
   circuits. The main theorem holds for circuits that approximate HC_m, respectively PERM_m.
4. In particular, over every field, VNP is not contained in VP-bar.
5. Special case. Over the real numbers there are c > 0 and m₀ such that every circuit for PERM_m with m ≥ m₀ has more
   than m^(c·(log₂ m)^(1/3)) gates.

For an m × m matrix of variables x_{i,j}: PERM_m = Σ_{σ ∈ S_m} Π_i x_{i,σ(i)}, and HC_m is the same sum restricted to
the (m − 1)! cyclic permutations (those consisting of one m-cycle).

The claim does not say what counts as a gate or which definitions of VP and VNP it uses. Use your textbook's, and say
which. Where textbooks differ (what is counted, fan-in, constants, the exact form of "polynomially bounded", the exact
definition of VNP), choose one, and list the alternatives you know in your notes.

## What to hand back

1. One Lean file, `import Mathlib` only, in your namespace (below), with:
   - your circuit model and its size, as your textbook defines them;
   - PERM_m and HC_m;
   - p-bounded functions, p-families, VP, VNP, approximating circuits, VP-bar;
   - five propositions, each a `def … : Prop` (no proofs): `MainTheorem`, `MainTheoremApprox`, `Separation`,
     `SeparationClosure`, `PermanentOverReal` — the claims 1–5 above, in that order.
   Fields may live in `Type` (universe 0). Every definition gets a docstring saying what it is in words.
2. NOTES.md: for every definition, the textbook definition it follows (book or survey, chapter or definition number —
   mark "from memory" when it is), every choice where textbooks differ and why you chose as you did, and anything in
   the claim's English you found ambiguous.
3. A last line in NOTES.md: "I did not see the claimant's Lean statement" — or exactly what you did see.

## Writer A (a Claude agent)

Follow the straight-line-program tradition (Bürgisser, *Completeness and Reduction in Algebraic Complexity Theory*,
2000; Bürgisser–Clausen–Shokrollahi, *Algebraic Complexity Theory*, 1997). Namespace `BlindA`. File
`BlindA.lean`. You may read Mathlib's source on GitHub at commit 0df444a360eaa60ab8c11dca51a86af692955474 only.

## Writer B (GPT-6.2-astra, Codex CLI, no network)

Follow the circuit-as-directed-acyclic-graph tradition (Shpilka–Yehudayoff, *Arithmetic Circuits: a survey of recent
results and open questions*, 2010; Saptharishi's survey of lower bounds; Valiant 1979). Namespace `BlindB`. File
`BlindB.lean`. You may read the local Mathlib source at ~/Projects/c35-lean/.lake/packages/mathlib (a nearby version;
names may differ slightly; that is fine).
