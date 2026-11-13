import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 17 — a constant factor 1/2 on the right-hand side.

Belief: UNKNOWN. It follows from `Conjecture1` (the right side is nonnegative) and is strictly weaker as a tool:
it does not give the paper's Conjecture 3. I know no proof of it. (With 1/|A| in place of 1/2 it is true: by
the union bound some a ∈ A has P(0 ↔ a) ≥ P(0 ↔ A)/|A|, then Harris–FKG.) -/
def Planted17_constantHalf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ 1 / 2 * (prob G p (connSetEvent G o A) * m)

end KN1Planted
