import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 10 — P(0 ↔ A) replaced by the SUM Σ_{a ∈ A} P(0 ↔ a) (the union bound, used as if it were an
equality). (A is a `Finset` here so that the sum can be written.)

Belief: PROVABLY FALSE. On graphs with no edge this variant agrees with the conjecture, so the counterexample
needs an edge: two vertices joined by one edge that is open with probability 1; o = b = `false`,
A = both vertices. Σ = P(false ↔ false) + P(false ↔ true) = 1 + 1 = 2; m = min{1, 1} = 1.
Left side P(o ↔ b) = 1. Right side 2 · 1 = 2. 1 ≥ 2 fails.
(The same with edge probability 3/4: Σ = 1 + 3/4 = 7/4, m = min{1, 3/4} = 3/4, right side 21/16 > 1.)

UNVERIFIED: `Finset`, its coercion to `Set` (in `a ∈ A` below, membership in the `Finset`), `∑ a ∈ A, …`. -/
def Planted10_sumInPlaceOfSetEvent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ (∑ a ∈ A, prob G p (connEvent G o a)) * m

end KN1Planted
