import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 16 — one common probability q on all edges (the paper's P_p, "the percolation measure with the
constant function p", page 4) in place of "arbitrary probabilities on its edges".

Belief: UNKNOWN (open). It is a special case of `Conjecture1`, hence follows from it. The paper asserts the
converse as a remark with a sketch, even for q = 1/2 (§5.6, item 1, page 36: "It is possible to assume that all
edges have probability 1/2", by replacing every edge by a gadget graph and passing to a limit); that is an
argument that changes the graph, not a reading of the sentence. A statement equivalent to this one is not shown
to be Conjecture 1 without that argument. -/
def Planted16_oneCommonProbability : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (q : Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G (fun _ => q) (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G (fun _ => q) (connEvent G a b)) →
    prob G (fun _ => q) (connEvent G o b) ≥ prob G (fun _ => q) (connSetEvent G o A) * m

end KN1Planted
