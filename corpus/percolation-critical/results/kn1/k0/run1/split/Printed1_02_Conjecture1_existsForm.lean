import Mathlib
import Printed

namespace KN1Printed

open KN3Printed

/-- Reading "for some a ∈ A": the paper's own working form of the conjecture. §5.6, item 3 (page 36): "Our
assumption is that the conjecture holds for G₀ (for some a ∈ A). At G₁, though, the conjecture holds trivially,
for all a ∈ A"; and the proof of Lemma 13 (page 34) concludes "conjecture 1 for G" from the inequality
P(v ↔ b) ≥ P(v ↔ A) P(a ↔ b) for one a ∈ A that is the minimiser in another graph.

This definition is, word for word, `KN3Planted.Neighbour1_Conjecture1` of the sealed `Planted.lean` (which, being
a fragment and not a module, cannot be imported here).

Belief: EQUIVALENT to `Conjecture1`. (→) A is nonempty and finite, so the set {P(a ↔ b) : a ∈ A} has a least
element m = P(a₀ ↔ b), and `Conjecture1` for that m gives the witness a₀. (←) if m is the least element then A
is nonempty; the witness a has m ≤ P(a ↔ b), and P(0 ↔ A) ≥ 0, so P(0 ↔ A) · m ≤ P(0 ↔ A) · P(a ↔ b) ≤
P(0 ↔ b). The hypothesis `A.Nonempty` is not printed; it is needed in this form, because for A = ∅ there is no
witness (without it the statement is false: `KN1Planted.Planted6_existsWithoutNonempty`). -/
def Conjecture1_existsForm : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

end KN1Printed
