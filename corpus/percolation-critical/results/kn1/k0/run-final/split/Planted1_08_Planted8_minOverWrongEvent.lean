import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 8 — the wrong event under the minimum: min{P(0 ↔ a) : a ∈ A} in place of min{P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = {`false`}.
m = P(o ↔ o) = 1. Left side P(o ↔ b) = 0. Right side P(o ↔ A) · m = 1 · 1 = 1. 0 ≥ 1 fails. -/
def Planted8_minOverWrongEvent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G o a) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G o a)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Planted
