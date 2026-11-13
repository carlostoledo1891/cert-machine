import Textbook
/-!
# Continuity.lean — θ is continuous on [0, 1]: the statement, written by hand (a FRAGMENT of `Textbook.lean`)

No `import` line: it is compiled appended to `perc/Textbook.lean` (the sealed bytes, sha256 4dc732f5…) and uses only
its definitions. `θ d : unitInterval → ℝ`, and `unitInterval` carries the topology of [0, 1] as a subspace of ℝ, so
`Continuous (θ d)` is "θ is a continuous function on the closed interval [0, 1]" (Grimmett, *Percolation*, 2nd ed.,
§8.3: θ is continuous on [0, 1] except possibly at p_c; with θ(p_c) = 0 it is continuous everywhere).

The stages are the classical pieces of that proof, each a statement in its own right:
right-continuity (every d), left-continuity above p_c (van den Berg–Keane 1984; every d), and the equivalence
"continuous ⇔ θ(p_c) = 0" (every d ≥ 1).
-/

namespace TextbookPercolation

/-- **θ is continuous on [0, 1] in every dimension d ≥ 2.** -/
def ContinuityStatement : Prop :=
  ∀ d : ℕ, 2 ≤ d → Continuous (θ d)

/-- Stage 1: θ is right-continuous at every p, in every dimension. -/
def RightContinuity : Prop :=
  ∀ (d : ℕ) (p : unitInterval), ContinuousWithinAt (θ d) (Set.Ici p) p

/-- Stage 2 (van den Berg–Keane): θ is left-continuous at every p above p_c, in every dimension. -/
def LeftContinuityAbovePc : Prop :=
  ∀ (d : ℕ) (p : unitInterval), pc d < (p : ℝ) → ContinuousWithinAt (θ d) (Set.Iic p) p

/-- Stage 3: for d ≥ 1, θ is continuous on [0, 1] exactly when θ(p_c) = 0. -/
def ContinuityIffCritical : Prop :=
  ∀ d : ℕ, 1 ≤ d → (Continuous (θ d) ↔ ∃ h : pc d ∈ Set.Icc (0 : ℝ) 1, θ d ⟨pc d, h⟩ = 0)

/-! ## Planted false variants (red controls: each is to be PROVED false, and the bridge must refuse each) -/

/-- PLANTED 1: the hypothesis weakened to d ≥ 1. False: in dimension one θ = 0 on [0, 1) and θ(1) = 1. -/
def Planted_dimOne : Prop :=
  ∀ d : ℕ, 1 ≤ d → Continuous (θ d)

/-- PLANTED 2: the conclusion strengthened to "θ is constant". False: θ(0) = 0 and θ(1) = 1. -/
def Planted_constant : Prop :=
  ∀ d : ℕ, 2 ≤ d → ∀ p q : unitInterval, θ d p = θ d q

end TextbookPercolation
