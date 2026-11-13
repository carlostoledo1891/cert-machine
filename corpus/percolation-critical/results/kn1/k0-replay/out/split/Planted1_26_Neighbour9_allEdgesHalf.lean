import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 9 — every edge has probability 1/2: the paper's first "simple reduction" (§5.6, item 1, page 36),
"It is possible to assume that all edges have probability 1/2 … This allows to reformulate the problem as a
counting problem."

Status: a special case of `Conjecture1`; the paper sketches the converse (gadget graphs and a limit). -/
def Neighbour9_allEdgesHalf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ e : G.edgeSet, (p e : ℝ) = 1 / 2) →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
