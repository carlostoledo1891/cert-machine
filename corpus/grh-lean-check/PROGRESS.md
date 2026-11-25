# grh-lean — progress (one line per row event; times from date -u on the machine that ran it)

- 2026-11-25 22:59 — CHAR passed. On pod alt1te1i1gsnpy (amendment A2), Lean v4.35.0 with Mathlib 56a005855ea1 (the
  release's pins; runs/char-alt1te1i1gsnpy/mathlib-rev.txt), the four files UNCHANGED from cert-machine
  (inputs.sha256 = the instruments' sha256: Textbook.lean 5310cb6f…, Spec.lean a15f6d86…, TextbookAx.lean cbf610a2…,
  Challenge.lean 8c1e5e1d…): Spec, Challenge, Textbook, TextbookAx each exit 0 (CHAR.log); the eight theorems
  (Mathlib's ζ and L meet the textbook characterisations; the characterisations determine them on ℂ ∖ {1}; RH and
  GRH in textbook form equivalent to the release's definitions) each depend on [propext, Classical.choice, Quot.sound]
  (TextbookAx.out). Only deprecation warnings (push_neg, Set.mem_setOf_eq); Challenge's five sorry theorems are not
  used by any of the eight, as the axiom lists show.
