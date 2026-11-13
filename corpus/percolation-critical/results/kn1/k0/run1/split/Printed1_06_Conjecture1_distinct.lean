import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "two vertices" as two DISTINCT vertices: "let 0, b ∈ G be two vertices".

Belief: EQUIVALENT to `Conjecture1`. The case 0 = b is true outright: P(0 ↔ 0) = 1, and P(0 ↔ A) · m ≤ 1
because both factors are probabilities (m = P(a ↔ b) for some a). -/
def Conjecture1_distinct : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), o ≠ b →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
