import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 11 — 0 and b not neighbours: the paper's third "simple reduction" (§5.6, item 3, page 36), "It is
possible to assume that 0 ≁ b".

Status: a special case of `Conjecture1`; the paper sketches the converse (concavity in the probability of the
edge {0, b}). -/
def Neighbour11_notAdjacent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), s(o, b) ∉ G.edgeSet →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
