import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 1 — `max` in place of `min`: m is the GREATEST element of {P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = both vertices.
The set of values is {P(false ↔ true), P(true ↔ true)} = {0, 1}, its greatest element is m = 1.
Left side P(o ↔ b) = 0. Right side P(o ↔ A) · m = 1 · 1 = 1 (o ∈ A). 0 ≥ 1 fails.
(With the minimum, m = 0 and the inequality 0 ≥ 0 holds.)

A second counterexample, with no vertex of {o, b} in A: four vertices o, a₁, a₂, b; edges {o, a₁}, {a₁, b},
{o, a₂}, each open with probability 1/2; A = {a₁, a₂}. P(o ↔ b) = 1/4, P(o ↔ A) = 3/4, P(a₁ ↔ b) = 1/2,
P(a₂ ↔ b) = 1/8. With the maximum: 3/4 · 1/2 = 3/8 > 1/4. (With the minimum: 3/4 · 1/8 = 3/32 ≤ 1/4.) -/
def Planted1_maxInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, prob G p (connEvent G a b) ≤ m) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
