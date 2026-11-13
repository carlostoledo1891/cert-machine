import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- NEIGHBOUR 12 — A a level set of a ↦ P(a ↔ b): the paper's fourth "simple reduction" (§5.6, item 4, page 37),
"It is possible to restrict to sets A of the sort {a ∈ G : P(a ↔ b) > p} for some p ∈ [0, 1]" (the level is
called `t` here; the paper gives no argument).

Status: a special case of `Conjecture1`; the converse is asserted by the paper without proof. -/
def Neighbour12_levelSets : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (o b : V) (t m : ℝ), 0 ≤ t → t ≤ 1 →
    (∃ a ∈ {x : V | prob G p (connEvent G x b) > t}, prob G p (connEvent G a b) = m) →
    (∀ a ∈ {x : V | prob G p (connEvent G x b) > t}, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o {x : V | prob G p (connEvent G x b) > t}) * m

end KN1Planted
