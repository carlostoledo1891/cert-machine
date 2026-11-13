import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- `Conjecture1` with its two hypotheses on `m` packed into Mathlib's `IsLeast`: "m is the least element of the
set {P(a ↔ b) : a ∈ A}" (the set is the image of A under a ↦ P(a ↔ b)).

Belief: EQUIVALENT to `Conjecture1` by unfolding `IsLeast` and `lowerBounds` (no mathematics involved).

UNVERIFIED: the name `IsLeast` (Mathlib, `IsLeast s a ↔ a ∈ s ∧ a ∈ lowerBounds s`) is not used in the sealed
files. -/
def Conjecture1_isLeast : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    IsLeast {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x} m →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
