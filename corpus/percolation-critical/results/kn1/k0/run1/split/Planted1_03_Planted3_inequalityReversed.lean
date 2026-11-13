import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 3 — the inequality reversed: `≤` in place of the printed `≥`.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = b = `false`, A = {`true`}.
m = P(true ↔ false) = 0 (the only value). Left side P(o ↔ b) = P(false ↔ false) = 1.
Right side P(o ↔ A) · m = 0 · 0 = 0. 1 ≤ 0 fails. -/
def Planted3_inequalityReversed : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≤ prob G p (connSetEvent G o A) * m

end KN1Planted
