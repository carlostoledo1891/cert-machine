import FormalConjectures.ErdosProblems.«488»
import Plumb.Erdos488

/-! P1 of PREREG-488.md: DeepMind's own statement, taken from its declaration by `type_of%` (so an edit to the entry
cannot pass unnoticed), refuted by the gist's adapter. Nothing is restated here. -/

theorem Plumb.p1 : ¬ (type_of% @Erdos488.erdos_488) := Erdos488ExactAdapter.refutation

#print axioms Plumb.p1
