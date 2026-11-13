import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "min as an indexed infimum over the points of A": `⨅ a : A, P(a ↔ b)`, the index being the SUBTYPE
of the points of A.

For A nonempty (finite) this infimum is the minimum. For A = ∅ the index type is empty and Mathlib's real `⨅`
over an empty index is 0; the statement then reads P(0 ↔ b) ≥ P(0 ↔ ∅) · 0 = 0: true.

Belief: EQUIVALENT to `Conjecture1`.

Warning: this is NOT the same as the real-valued `⨅ a ∈ A, P(a ↔ b)` (membership as a second index). In `ℝ` that
expression takes the value 0 at every a ∉ A, so it is 0 whenever A is not the whole vertex set; the statement
written with it is trivially true and is recorded as `KN1Planted.Planted12_realIInfOverMembership`.

UNVERIFIED: `⨅ a : A, …` with `A : Set V` used as a type, and the coercion `(a : V)`, are not used in the
sealed files. -/
def Conjecture1_iInf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * (⨅ a : A, prob G p (connEvent G (a : V) b))

end KN1Printed
