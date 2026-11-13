import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "the minimum of the empty set is the number c": the family of conventions for A = ∅. The printed
sentence allows A = ∅ ("a set of vertices") and "min ∅" is not defined; this definition gives it the value `c`
and otherwise reads the minimum as `Conjecture1` does. c = 0 is Mathlib's value of a real infimum over the empty
set; c = 1 is the infimum of the empty set inside [0, 1], where probabilities live; any other real is possible.

For A = ∅ it asserts P(0 ↔ b) ≥ P(0 ↔ ∅) · c = 0 · c = 0, which is true whatever c is.

Belief: for EVERY real c, EQUIVALENT to `Conjecture1` (the extra case is true because the event {0 ↔ ∅} is
empty). The convention "min ∅ = +∞" is `Conjecture1_ennreal` below (in `ℝ≥0∞`, where 0 · ∞ = 0). -/
def Conjecture1_emptyMinIs (c : ℝ) : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (((∃ a ∈ A, prob G p (connEvent G a b) = m) ∧ (∀ a ∈ A, m ≤ prob G p (connEvent G a b))) ∨
      (A = ∅ ∧ m = c)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
