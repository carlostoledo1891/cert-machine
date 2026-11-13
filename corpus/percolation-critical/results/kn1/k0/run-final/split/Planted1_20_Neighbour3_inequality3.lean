import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 3 — inequality (3) of the paper (page 3), "the following formally stronger version of
conjecture 2": P(0 ↔ b, 0 ↔ A) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}.

Status: UNKNOWN in general; the paper proves it for |A| = 2 (Theorem 1) and in some cases with |A| = 3
(Theorems 2 and 3). It implies `Neighbour2_Conjecture2_preFKG` at once (the left side only got smaller). -/
def Neighbour3_inequality3 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connSetEvent G o A ∩ connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connSetEvent G o A ∩ connEvent G a b)) →
    prob G p (connEvent G o b ∩ connSetEvent G o A) ≥ m

end KN1Planted
