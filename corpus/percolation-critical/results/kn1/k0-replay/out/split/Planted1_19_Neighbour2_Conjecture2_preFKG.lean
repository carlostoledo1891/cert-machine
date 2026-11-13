import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 2 — **Conjecture 2** of the same paper (page 3), "the pre-FKG conjecture":
"Let G, 0, b and A be as in conjecture 1. Then P(0 ↔ b) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}."

The minimum is read as in `Conjecture1`. Status: UNKNOWN (open; "we believe the following stronger inequality …
might also be true"). The paper: "Conjecture 1 follows from conjecture 2 by an application of the FKG
inequality"; the converse is not claimed. -/
def Neighbour2_Conjecture2_preFKG : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connSetEvent G o A ∩ connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connSetEvent G o A ∩ connEvent G a b)) →
    prob G p (connEvent G o b) ≥ m

end KN1Planted
