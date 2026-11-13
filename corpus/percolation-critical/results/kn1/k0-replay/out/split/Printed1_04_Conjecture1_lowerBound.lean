import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "min as infimum, said with lower bounds": P(0 ↔ b) ≥ P(0 ↔ A) · m for EVERY lower bound m of
{P(a ↔ b) : a ∈ A} (the infimum is the greatest lower bound, and P(0 ↔ A) ≥ 0, so this is the inequality with
the infimum). No attainment is asked, and negative m are allowed.

For A = ∅ every real m is a lower bound, and the statement reads P(0 ↔ b) ≥ P(0 ↔ ∅) · m = 0 · m = 0: true.

Belief: EQUIVALENT to `Conjecture1`. (→) for A = ∅ as just said; for A nonempty take the least element m₀ of
the finite set: m ≤ m₀ and P(0 ↔ A) ≥ 0 give P(0 ↔ A) · m ≤ P(0 ↔ A) · m₀ ≤ P(0 ↔ b). (←) a least element is
a lower bound. -/
def Conjecture1_lowerBound : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
