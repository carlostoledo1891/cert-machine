import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 14 — the PRODUCT over A in place of the minimum: P(0 ↔ A) · Π_{a ∈ A} P(a ↔ b). (A is a `Finset`
here so that the product can be written.)

Belief: TRUE-BUT-DIFFERENT. By the Harris–FKG inequality for the increasing events {0 ↔ A} and {a ↔ b}, a ∈ A:
P(0 ↔ A and a ↔ b for all a ∈ A) ≥ P(0 ↔ A) · Π P(a ↔ b); and on that event 0 is joined to some a ∈ A, which is
joined to b. (For A = ∅ the right side is 0 · 1 = 0.) It is weaker than the conjecture: a product of numbers in
[0, 1] is at most the smallest of them.

UNVERIFIED: `Finset`, its coercion to `Set`, and `∏ a ∈ A, …` are not used in the sealed files. -/
def Planted14_productInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o (A : Set V)) * (∏ a ∈ A, prob G p (connEvent G a b))

end KN1Planted
