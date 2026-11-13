import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "A ⊂ G" as a PROPER subset (Lean's `⊂` is strict; the paper's is not: §2.1 defines "A ⊆ G stands for
'A is a subset of vertices'" and then writes "A ⊂ G").

Belief: EQUIVALENT to `Conjecture1`. The case A = everything is true outright: then 0 ∈ A, so P(0 ↔ A) = 1 and
m ≤ P(0 ↔ b). -/
def Conjecture1_properSubset : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), A ≠ Set.univ →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
