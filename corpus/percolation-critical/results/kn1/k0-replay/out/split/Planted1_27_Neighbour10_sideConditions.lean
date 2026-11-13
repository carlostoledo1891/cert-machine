import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 10 — side conditions that are not printed: 0 ≠ b, 0 ∉ A, b ∉ A.

Status: a special case of `Conjecture1`. The cases 0 = b and 0 ∈ A are true outright. The case b ∈ A is NOT
trivial (the paper treats it as the essential case of the pre-FKG form: "to prove (2) it is enough to prove it
in the case b ∈ A", page 3); I believe it reduces to b ∉ A by hanging a new vertex on b by an edge of
probability 1 and using the new vertex as b, but that is a proof, not a reading. -/
def Neighbour10_sideConditions : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), o ≠ b → o ∉ A → b ∉ A →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
