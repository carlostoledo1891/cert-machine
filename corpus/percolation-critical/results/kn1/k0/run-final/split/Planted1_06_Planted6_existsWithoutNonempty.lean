import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 6 — the hypothesis "A is nonempty" dropped from the "for some a ∈ A" form
(`KN1Printed.Conjecture1_existsForm`): the minimum is asserted to EXIST for every A.

Belief: PROVABLY FALSE. Counterexample: one vertex, A = ∅: there is no a ∈ A at all. -/
def Planted6_existsWithoutNonempty : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

end KN1Planted
