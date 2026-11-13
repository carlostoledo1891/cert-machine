import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "a finite graph" as a graph on the vertex set {0, …, n − 1}: the same statement with `Fin n` in
place of an arbitrary finite type `V : Type`.

Belief: EQUIVALENT to `Conjecture1`. `Conjecture1 → Conjecture1_onFin` is a special case. The converse holds
because every finite type is in bijection with some `Fin n` and every ingredient (graph, probabilities, events,
measure) is carried along the bijection; that is a proof (routine, long), not a reading. The same argument
shows that the universe of the vertex type does not matter. -/
def Conjecture1_onFin : Prop :=
  ∀ (n : ℕ) (G : SimpleGraph (Fin n)) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set (Fin n)) (o b : Fin n) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

end KN1Printed
