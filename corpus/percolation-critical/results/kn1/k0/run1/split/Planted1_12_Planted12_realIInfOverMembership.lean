import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 12 — the minimum written as the REAL-valued infimum with membership as a second index:
`⨅ a ∈ A, P(a ↔ b)` in `ℝ`. This is the form a formalizer is most likely to type.

Belief: PROVABLY TRUE, and trivially so — not the conjecture. In `ℝ` (not a complete lattice) Mathlib gives the
infimum over an empty index the value 0. So `⨅ a ∈ A, f a` is the infimum over ALL vertices a of the function
that is f a for a ∈ A and 0 for a ∉ A. Since every f a = P(a ↔ b) ≥ 0 and there are finitely many vertices,
call that infimum I; then I ≥ 0 and I ≤ (the value at a = 0). If 0 ∉ A the value at 0 is 0, so I = 0 and the
statement reads P(0 ↔ b) ≥ 0. If 0 ∈ A the value at 0 is P(0 ↔ b), so P(0 ↔ A) · I ≤ 1 · I ≤ P(0 ↔ b).
In both cases the statement holds, for every graph, with no percolation argument at all.
(The correct real-valued infimum is over the subtype: `KN1Printed.Conjecture1_iInf`.)

UNVERIFIED: `⨅ a ∈ A, …` in `ℝ` is not used in the sealed files. -/
def Planted12_realIInfOverMembership : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * (⨅ a ∈ A, prob G p (connEvent G a b))

end KN1Planted
