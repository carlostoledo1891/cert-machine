import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 13 — P(0 ↔ A) replaced by P(0 ↔ a) for the same a: "for some a ∈ A, P(0 ↔ b) ≥ P(0 ↔ a) P(a ↔ b)".

Belief: TRUE-BUT-DIFFERENT. It is the Harris–FKG inequality and holds for EVERY vertex a
(`Neighbour1_HarrisFKG`): {0 ↔ a} and {a ↔ b} are increasing events and their intersection is inside {0 ↔ b}.
It is weaker than the conjecture because P(0 ↔ a) ≤ P(0 ↔ A) for a ∈ A; the whole content of Conjecture 1 is the
replacement of the point a by the set A in the first factor. -/
def Planted13_pointInPlaceOfSet : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connEvent G o a) * prob G p (connEvent G a b)

end KN1Planted
