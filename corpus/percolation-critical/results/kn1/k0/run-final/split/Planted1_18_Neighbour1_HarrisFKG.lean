import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 1 — the Harris–FKG inequality for connections: P(0 ↔ b) ≥ P(0 ↔ a) · P(a ↔ b) for every three
vertices. The paper: "The Fortuin-Kasteleyn-Ginibre inequality (… also known as 'the Harris inequality') states
that for any two increasing functions f and g one has E(fg) ≥ E(f)E(g)" (§2.1, page 5).

Status: TRUE (a classical fact). It is Conjecture 1 for A = {a}. -/
def Neighbour1_HarrisFKG : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (o a b : V),
    prob G p (connEvent G o b) ≥ prob G p (connEvent G o a) * prob G p (connEvent G a b)

end KN1Planted
