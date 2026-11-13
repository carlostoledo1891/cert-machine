import Mathlib

/-!
# θ(p_c) = 0 for Bernoulli bond percolation on ℤ^d: a statement written by hand

The textbook statement, from Grimmett, *Percolation*, 2nd ed. (Springer, 1999), §1.3–1.4:

* ℤ^d has the integer vectors as vertices; x and y are joined by an edge when |x − y| = 1 (the ℓ¹ distance);
* each edge is open with probability p and closed otherwise, independently: the product measure P_p;
* C(x) is the open cluster of x: the vertices joined to x by a path of open edges;
* θ(p) := P_p(|C(0)| = ∞), and p_c := sup {p : θ(p) = 0} (Grimmett (1.11));
* the claim: θ(p_c) = 0 in every dimension d ≥ 2.

Written for the bridge check of 2026-11-12, after reading the statement files of Anthropic's development
(anthropics/formal-math 795efb86, `percolation/Challenge.lean`) and of OpenAI's (openai/math 4eaee875,
`lean/ComparatorChallenges/CriticalZ3.lean`) and NOT their proofs. The encoding differs from both on purpose: an edge is
an unordered pair at ℓ¹ distance one (a subtype of `Sym2`, no graph library); a configuration is a `Bool` on each edge;
the measure is `Measure.infinitePi` of `bernoulliMeasure` on `Bool`, indexed by our edges; p_c is Grimmett's supremum,
not an infimum. A bridge from either lab's theorem to `Statement` therefore has to show that the encodings agree,
including that θ is monotone in p. Mathlib only.
-/

namespace TextbookPercolation

open MeasureTheory

/-- A vertex of ℤ^d: an integer vector with d coordinates. -/
abbrev Vertex (d : ℕ) : Type := Fin d → ℤ

/-- x and y are nearest neighbours: their ℓ¹ distance is one. -/
def Adjacent {d : ℕ} (x y : Vertex d) : Prop := ∑ i, |x i - y i| = 1

theorem adjacent_comm {d : ℕ} (x y : Vertex d) : Adjacent x y = Adjacent y x := by
  unfold Adjacent
  exact congrArg (· = (1 : ℤ)) (Finset.sum_congr rfl fun i _ => abs_sub_comm (x i) (y i))

/-- An edge of ℤ^d: an unordered pair {x, y} of nearest neighbours. -/
def Edge (d : ℕ) : Type :=
  {e : Sym2 (Vertex d) // Sym2.lift ⟨fun x y => Adjacent x y, adjacent_comm⟩ e}

/-- The product measure P_p on configurations: each edge is open (`true`) with probability p, independently.
Mathlib's `bernoulliMeasure true false p` is p • δ_true + (1 − p) • δ_false. -/
noncomputable def P (d : ℕ) (p : unitInterval) : Measure (Edge d → Bool) :=
  Measure.infinitePi fun _ : Edge d => ProbabilityTheory.bernoulliMeasure true false p

/-- x and y are joined by an edge that is open in ω. -/
def OpenEdge {d : ℕ} (ω : Edge d → Bool) (x y : Vertex d) : Prop :=
  ∃ h : Adjacent x y, ω ⟨s(x, y), h⟩ = true

/-- The open cluster C(x) of x in ω: the vertices joined to x by a path of open edges (x itself included). -/
def cluster {d : ℕ} (ω : Edge d → Bool) (x : Vertex d) : Set (Vertex d) :=
  {y | Relation.ReflTransGen (OpenEdge ω) x y}

/-- θ(p) = P_p(|C(0)| = ∞). -/
noncomputable def θ (d : ℕ) (p : unitInterval) : ℝ :=
  (P d p {ω | (cluster ω 0).Infinite}).toReal

/-- p_c = sup {p ∈ [0, 1] : θ(p) = 0}, Grimmett's (1.11). -/
noncomputable def pc (d : ℕ) : ℝ :=
  sSup {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, θ d ⟨p, h⟩ = 0}

/-- **θ(p_c) = 0 in every dimension d ≥ 2**: p_c lies in [0, 1], and at p_c the origin's open cluster is almost
surely finite. -/
def Statement : Prop :=
  ∀ d : ℕ, 2 ≤ d → ∃ h : pc d ∈ Set.Icc (0 : ℝ) 1, θ d ⟨pc d, h⟩ = 0

/-- The same at d = 3 alone, the form OpenAI's ℤ³ theorem is bridged to. -/
def Statement3 : Prop :=
  ∃ h : pc 3 ∈ Set.Icc (0 : ℝ) 1, θ 3 ⟨pc 3, h⟩ = 0

end TextbookPercolation
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

open TextbookPercolation in
#check (ContinuityStatement : Prop)
open TextbookPercolation in
#check (ContinuityIffCritical : Prop)
