import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- **Conjecture 1** of arXiv:2401.12397v1 (§1, page 3), as printed:

"Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two vertices and let A ⊂ G
be a set of vertices. Then P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}."

* "a finite graph": a simple graph `G` on a finite vertex type `V` (`[Finite V]`).
* "with arbitrary probabilities on its edges": any `p : E(G) → [0,1]` ("a function p : E(G) → [0, 1]", §2.1,
  page 4), the endpoints 0 and 1 included; `P` is the percolation measure of `p`.
* "0, b ∈ G two vertices": any `o b : V`, not assumed distinct, not assumed outside A.
* "A ⊂ G a set of vertices": any `A : Set V` (the paper's ⊂ is not strict), the whole vertex set and the empty
  set included.
* "min{P(a ↔ b) : a ∈ A}": the number `m` that is the least element of the set {P(a ↔ b) : a ∈ A} — it is a
  member of the set (`∃ a ∈ A, P(a ↔ b) = m`) and it is below every member (`∀ a ∈ A, m ≤ P(a ↔ b)`).
  For a nonempty A (finite, since G is) there is exactly one such `m`. For A = ∅ there is none, and the
  statement says nothing about that case; `READING1.md` (B8) shows that every convention for the minimum of the
  empty set gives a statement equivalent to this one, because P(0 ↔ ∅) = 0.
* "≥": not strict, in the direction printed; the product is the product of real numbers. -/
def Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
