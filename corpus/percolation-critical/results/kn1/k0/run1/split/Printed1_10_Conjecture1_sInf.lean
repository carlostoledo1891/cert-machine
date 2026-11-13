import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "min as the infimum of the set of values", as a term: `sInf` of the set {P(a ↔ b) : a ∈ A} of real
numbers.

For A nonempty the set is finite and nonempty, and its `sInf` is its least element. For A = ∅ the set is empty
and Mathlib's `sInf (∅ : Set ℝ)` is 0 (a convention of Mathlib, not of the paper); the statement then reads
P(0 ↔ b) ≥ P(0 ↔ ∅) · 0 = 0: true.

Belief: EQUIVALENT to `Conjecture1`.

UNVERIFIED: `sInf` on `Set ℝ` is not used in the sealed files. -/
def Conjecture1_sInf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * sInf {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x}

end KN1Printed
