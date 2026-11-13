import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 6 — **Conjecture 3** of the same paper (§4, page 15), as sealed in `Printed.lean`: "a weaker
version of conjecture 1"; "Conjecture 3 clearly follows from conjecture 1 (by taking δ = 1 − √(1 − ε))".

Status: per the paper, open and implied by Conjecture 1; the converse is not claimed anywhere in the paper.
A statement equivalent to this one is Conjecture 3, not Conjecture 1. -/
def Neighbour6_Conjecture3 : Prop :=
  KN3Printed.Conjecture3

end KN1Planted
