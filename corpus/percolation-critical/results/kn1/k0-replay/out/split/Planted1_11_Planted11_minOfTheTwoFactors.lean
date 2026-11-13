import Mathlib
import Printed

namespace KN1Planted

open KN3Printed

/-- PLANTED 11 — the product of the two factors replaced by the smaller of the two:
P(0 ↔ b) ≥ min(P(0 ↔ A), min{P(a ↔ b) : a ∈ A}).

Belief: PROVABLY FALSE. With all probabilities 0 or 1 this variant agrees with the conjecture, so the
counterexample needs a fractional probability: three vertices o, a, b; edges {o, a} and {a, b}, each open with
probability 1/2 (no edge {o, b}, or one with probability 0); A = {a}. P(o ↔ A) = P(o ↔ a) = 1/2;
m = P(a ↔ b) = 1/2. Left side P(o ↔ b) = 1/2 · 1/2 = 1/4. Right side min(1/2, 1/2) = 1/2. 1/4 ≥ 1/2 fails.
(The conjecture's own right side is 1/2 · 1/2 = 1/4: equality.)

UNVERIFIED: `min` of two real numbers is not used in the sealed `Printed.lean` / `Planted.lean` (it is used in
a proof in `PlantedCheck.lean`). -/
def Planted11_minOfTheTwoFactors : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ min (prob G p (connSetEvent G o A)) m

end KN1Planted
