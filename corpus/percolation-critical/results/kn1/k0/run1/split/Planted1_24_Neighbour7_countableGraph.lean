import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 7 — the same inequality on COUNTABLE graphs, the minimum read as an infimum (every lower bound),
as in `KN1Printed.Conjecture1_lowerBound`. The printed sentence says "finite graph", so this is not a reading of
it.

Status: implies `Conjecture1` at once. I believe the converse (exhaust the graph by finite subgraphs: first let
the subgraph grow with a finite part of A fixed, then let that part grow), but that is a proof, not a
reading. -/
def Neighbour7_countableGraph : Prop :=
  ∀ (V : Type) [Countable V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
