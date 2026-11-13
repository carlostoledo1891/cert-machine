import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "probabilities in [0, ∞], min ∅ = +∞": the inequality between the measures themselves, as extended
nonnegative reals, with the infimum of the complete lattice `ℝ≥0∞`. There `⨅ a ∈ A, …` is the true infimum over
the points of A; for A = ∅ it is `⊤` (= +∞), and the statement reads P(0 ↔ b) ≥ 0 · ∞ = 0 (Mathlib: 0 · ⊤ = 0):
true.

Belief: EQUIVALENT to `Conjecture1`: all three measures are at most 1, so nothing is lost in passing to real
numbers, and for A nonempty (finite) the infimum is attained.

UNVERIFIED: `⨅ a ∈ A, …` and the comparison in `ℝ≥0∞` are not used in the sealed files. -/
def Conjecture1_ennreal : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    percolationMeasure G p (connEvent G o b) ≥
      percolationMeasure G p (connSetEvent G o A) * (⨅ a ∈ A, percolationMeasure G p (connEvent G a b))

end KN1Printed
