import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 8 — every edge probability STRICTLY between 0 and 1 (the paper's are in the closed interval:
"p : E(G) → [0, 1]", and it uses both 0 and 1 — "we set their weight to ε, and otherwise to 0", page 13;
"edges with weight 1", page 32).

Status: a special case of `Conjecture1`. I believe the converse (on a fixed finite graph every probability in
the statement is a polynomial in the edge probabilities, hence continuous, and `≥` passes to the limit), but
that is a proof, not a reading. -/
def Neighbour8_probabilitiesStrictlyInside : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ e : G.edgeSet, 0 < (p e : ℝ) ∧ (p e : ℝ) < 1) →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
