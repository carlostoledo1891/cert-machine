import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 4 — **Question 7** of the paper (page 36): "Let a ∈ A satisfy P(a ↔ b) ≤ P(a' ↔ b) ∀a' ∈ A, i.e.
a is the minimiser among the points of A. Is it true that in this case
P(0 ↔ b, 0 ↔ A) ≥ P(0 ↔ A, a ↔ b)? (41)"

Status: a QUESTION in the paper ("Numerical evidence points towards an answer of 'yes' … but we are rather
hesitant"). It implies `Conjecture1` by the FKG inequality. -/
def Neighbour4_Question7 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b a : V),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    prob G p (connEvent G o b ∩ connSetEvent G o A) ≥ prob G p (connSetEvent G o A ∩ connEvent G a b)

end KN1Planted
