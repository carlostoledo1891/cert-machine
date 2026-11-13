import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 5 — the SUM over A in place of the minimum: P(0 ↔ A) · Σ_{a ∈ A} P(a ↔ b). (A is a `Finset` here so
that the sum can be written.)

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = both vertices.
Σ = P(false ↔ true) + P(true ↔ true) = 0 + 1 = 1. Left side P(o ↔ b) = 0. Right side 1 · 1 = 1. 0 ≥ 1 fails.

UNVERIFIED: `Finset`, its coercion to `Set`, and `∑ a ∈ A, …` are not used in the sealed files. -/
def Planted5_sumInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o (A : Set V)) * (∑ a ∈ A, prob G p (connEvent G a b))

end KN1Planted
