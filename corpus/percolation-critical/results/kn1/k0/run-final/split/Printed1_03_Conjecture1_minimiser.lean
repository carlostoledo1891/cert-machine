import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "for the minimiser": "the point of A where the minimum of P(a ↔ b) is achieved" (page 12);
"Denote by a … the minimiser of P(a ↔ b) among the points of A" (Conjecture 6, page 34); "a is the minimiser
among the points of A" (Question 7, page 36). The inequality is asserted for every point `a` of A at which
P(a ↔ b) is least.

Belief: EQUIVALENT to `Conjecture1`, by substituting m = P(a ↔ b) (no mathematics involved). -/
def Conjecture1_minimiser : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b a : V),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

end KN1Printed
