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
  ∀ d : ℕ, 1 ≤ d → ∃ h : pc d ∈ Set.Icc (0 : ℝ) 1, θ d ⟨pc d, h⟩ = 0

/-- The same at d = 3 alone, the form OpenAI's ℤ³ theorem is bridged to. -/
def Statement3 : Prop :=
  ∃ h : pc 3 ∈ Set.Icc (0 : ℝ) 1, θ 3 ⟨pc 3, h⟩ = 0

end TextbookPercolation
