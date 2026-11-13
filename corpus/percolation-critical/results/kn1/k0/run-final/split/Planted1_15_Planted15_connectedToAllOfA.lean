import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 15 — "0 ↔ A" read as "0 is connected to EVERY point of A" (the paper's "0 ↔ A" is "to SOME point of
A", by its definitions of C(A) and C(A; B), §2.1, page 4).

Belief: TRUE-BUT-DIFFERENT. If m is the least value, attained at a₀ ∈ A, then
P(0 ↔ every a ∈ A) · m ≤ P(0 ↔ a₀) · P(a₀ ↔ b) ≤ P(0 ↔ b) by the Harris–FKG inequality. -/
def Planted15_connectedToAllOfA : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p {ω : Config G | ∀ a ∈ A, Joined G ω o a} * m

end KN1Planted
