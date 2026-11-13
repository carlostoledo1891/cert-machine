import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 7 — the factor P(0 ↔ A) dropped: P(0 ↔ b) ≥ min{P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = {`true`}.
m = P(true ↔ true) = 1. Left side P(o ↔ b) = 0. 0 ≥ 1 fails. -/
def Planted7_factorDropped : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ m

end KN1Planted
