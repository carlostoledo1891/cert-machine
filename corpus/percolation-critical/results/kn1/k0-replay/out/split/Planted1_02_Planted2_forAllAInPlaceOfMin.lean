import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 2 — "for all a ∈ A" where the minimum needs "for some a ∈ A": the inequality with P(a ↔ b) asserted
for EVERY point a of A.

Belief: PROVABLY FALSE (it says the same as Planted 1). The paper itself: "in any graph G, any A and any a ∈ A
we have (42). This is clearly false" (proof of Theorem 13, page 37). Counterexample: two vertices, no edge;
o = `false`, b = `true`, A = both vertices; a = `true`: P(o ↔ b) = 0, P(o ↔ A) · P(a ↔ b) = 1 · 1 = 1.
0 ≥ 1 fails. -/
def Planted2_forAllAInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    ∀ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

end KN1Planted
