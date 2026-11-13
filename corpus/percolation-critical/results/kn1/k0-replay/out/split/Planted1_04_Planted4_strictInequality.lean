import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 4 — a strict inequality: `>` in place of the printed `≥`.

Belief: PROVABLY FALSE. Counterexample: one vertex; o = b = that vertex, A = {that vertex}. m = P(o ↔ o) = 1.
Left side 1. Right side P(o ↔ A) · m = 1 · 1 = 1. 1 > 1 fails. -/
def Planted4_strictInequality : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) > prob G p (connSetEvent G o A) * m

end KN1Planted
