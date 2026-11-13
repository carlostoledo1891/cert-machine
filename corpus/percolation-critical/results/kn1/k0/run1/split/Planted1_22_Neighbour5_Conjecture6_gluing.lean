import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 5 — **Conjecture 6** of the paper (§5.3, page 34), the gluing conjecture: "Let G be a graph, let
A ⊂ G and 0, b ∈ G. Denote by a … the minimiser of P(a ↔ b) among the points of A. Let {v, w} be an arbitrary
edge and assume P_G(x ↔ b) ≥ P_G(x ↔ A) P_G(a ↔ b) ∀x ∈ {v, w}. (39) Then
P_{G ⏚ {v,w}}(v ↔ b) ≥ P_{G ⏚ {v,w}}(v ↔ A) P_{G ⏚ {v,w}}(a ↔ b). (40)"

"G ⏚ e is the graph G with the probability that e is open set to 1" (page 34): here `p'` agrees with `p` off
the edge {v, w} and is 1 on it. The vertex 0 of the printed statement is not used by it. My reading choices for
THIS statement (finite graph; every minimiser a, taken in G; the edge is an edge of G) are not examined in
`READING1.md`: it is recorded as a neighbour, not adjudicated.

Status: UNKNOWN (a conjecture of the paper). The paper: "Conjecture 6 implies the post-FKG conjecture,
conjecture 1" (Lemma 13, a proof sketch).

UNVERIFIED: naming the edge `⟨s(v, w), h⟩` inside the statement, and `e ≠ …` on `G.edgeSet`. -/
def Neighbour5_Conjecture6_gluing : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p p' : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b a v w : V) (h : s(v, w) ∈ G.edgeSet),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    (∀ e : G.edgeSet, e ≠ (⟨s(v, w), h⟩ : G.edgeSet) → p' e = p e) →
    (p' ⟨s(v, w), h⟩ : ℝ) = 1 →
    prob G p (connEvent G v b) ≥ prob G p (connSetEvent G v A) * prob G p (connEvent G a b) →
    prob G p (connEvent G w b) ≥ prob G p (connSetEvent G w A) * prob G p (connEvent G a b) →
    prob G p' (connEvent G v b) ≥ prob G p' (connSetEvent G v A) * prob G p' (connEvent G a b)

end KN1Planted
