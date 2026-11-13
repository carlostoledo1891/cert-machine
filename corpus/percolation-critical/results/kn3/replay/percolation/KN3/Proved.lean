import Percolation.Continuity.MainTheorem
import KN3.Compare

/-!
# Proved.lean — K3: Kozma–Nitzan's Conjecture 3 as printed (our statement), from the lab's theorem

`Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds` is the lab's proof of its own statement; `lab_to_R0`
and `lab_to_RB` (K2, transport only) carry it to the sealed statements of `Printed.lean`.
-/

/-- **Conjecture 3 of arXiv:2401.12397v1 as written in `Printed.lean` (reading R0: finite graphs).** -/
theorem conjecture3_as_printed : KN3Printed.Conjecture3 :=
  KN3Compare.lab_to_R0 Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds

/-- **The same sentence under reading B (countable graphs).** -/
theorem conjecture3_readingB_as_printed : KN3Printed.Conjecture3_readingB :=
  KN3Compare.lab_to_RB Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
