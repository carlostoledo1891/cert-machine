import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 9 — a constant factor 2 on the right-hand side.

Belief: PROVABLY FALSE. Counterexample: one vertex; o = b = that vertex, A = {that vertex}; m = 1.
Left side 1. Right side 2 · (1 · 1) = 2. 1 ≥ 2 fails. -/
def Planted9_constantTwo : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ 2 * (prob G p (connSetEvent G o A) * m)

end KN1Planted
