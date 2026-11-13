import Mathlib

/-!
# Kozma–Nitzan, Conjecture 3, written by hand from the printed text

Source: Gady Kozma and Shahaf Nitzan, *A reduction of the θ(p_c) = 0 problem to a conjectured inequality*,
arXiv:2401.12397v1 (22 Jan 2024; the only arXiv version), §4 "θ(p_c)", page 15 of the PDF:

> **Conjecture 3.** For every ε > 0 there exists δ > 0 such that for any graph G, any A ⊂ G, and any 0, b ∈ G
> which satisfy P(0 ↔ A) > 1 − δ and P(a ↔ b) > 1 − δ for all a ∈ A, we have P(0 ↔ b) > 1 − ε.

Everything below is written from that paper alone (its §1 and §2.1 for the definitions), with Mathlib only.
Clean room: written without ever seeing any other formalization of this conjecture. See `READING.md` for the
phrase-by-phrase table and for every place where the printed text leaves a choice.

Reading encoded as `Conjecture3`: "graph" is what Conjecture 1 of the same paper spells out and what the paper's
later statements abbreviate — "a finite graph with arbitrary probabilities on its edges" — and δ depends on ε only.
The one other reading judged defensible (the word "finite" is not printed in Conjecture 3 itself) is
`Conjecture3_readingB`.
-/

namespace KN3Printed

open MeasureTheory

/-! ## The percolation measure (§2.1 "Notation", second paragraph, page 4) -/

/-- "we will not distinguish between {0,1}^{E(G)} and the set of subsets of E(G), considering each element
ω ∈ {0,1}^{E(G)} as the subset {e : ω(e) = 1}" (§2.1, pages 4–5).

A configuration ω gives to every edge e of G the value `true` ("e ∈ ω", the edge is *open*) or `false` (*closed*).
"The set of edges of G will be denoted by E(G)" (§2.1, first paragraph): E(G) is Mathlib's `G.edgeSet`, the set of
unordered pairs {v, w} of neighbours. A graph is Mathlib's `SimpleGraph V`: the paper writes edges as two-element
sets {v, w} and writes v ∼ w for "v and w are neighbours (or {v, w} ∈ E(G))". -/
abbrev Config {V : Type} (G : SimpleGraph V) : Type := G.edgeSet → Bool

/-- The law of one edge: open (`true`) with probability q, closed (`false`) with probability 1 − q.
"for every edge e the probability that e ∈ ω is p(e)" (§2.1, page 4), with q = p(e) ∈ [0, 1]. -/
noncomputable def coin (q : Set.Icc (0 : ℝ) 1) : Measure Bool :=
  ENNReal.ofReal q • Measure.dirac true + ENNReal.ofReal (1 - q) • Measure.dirac false

/-- The law of one edge is a probability measure: q + (1 − q) = 1. (Needed to form the product measure.) -/
instance coin_isProbabilityMeasure (q : Set.Icc (0 : ℝ) 1) : IsProbabilityMeasure (coin q) := by
  constructor
  have h0 : (0 : ℝ) ≤ q := q.2.1
  have h1 : (0 : ℝ) ≤ 1 - q := sub_nonneg.mpr q.2.2
  simp only [coin, Measure.coe_add, Measure.coe_smul, Pi.add_apply, Pi.smul_apply, measure_univ,
    smul_eq_mul, mul_one]
  rw [← ENNReal.ofReal_add h0 h1]
  simp

/-- "For a graph G and a function p : E(G) → [0,1] we will consider the measure on subsets ω of E(G) such that for
every edge e the probability that e ∈ ω is p(e), and these events are independent. We call such measures
*percolation measures*." (§2.1, page 4.)

The product, over the edges e of G, of the laws `coin (p e)`. Mathlib's `Measure.infinitePi` is the product of an
arbitrary family of probability measures; when G has finitely many edges it is the finite product `Measure.pi`
(`Measure.infinitePi_eq_pi`; checked for this definition in `Check.lean`). -/
noncomputable def percolationMeasure {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) :
    Measure (Config G) :=
  Measure.infinitePi fun e : G.edgeSet => coin (p e)

/-! ## Connection events (§2.1, page 4) -/

/-- "For two vertices v and w we denote by v ↔_ω w the event that v and w are connected in ω, namely, that there
exist v = x₁ ∼ x₂ ∼ ⋯ ∼ x_k = w such that {x_i, x_{i+1}} ∈ ω for all i ∈ {1, …, k−1}." (§2.1, page 4.)

The paper's x₁, …, x_k (k ≥ 1) are here x 0, …, x n with n = k − 1 ≥ 0; so every vertex is connected to itself
(k = 1, no edge needed). `∃ h : s(x i, x (i+1)) ∈ G.edgeSet` says x_i ∼ x_{i+1}, and `ω ⟨_, h⟩ = true` says that
this edge is in ω. -/
def Joined {V : Type} (G : SimpleGraph V) (ω : Config G) (v w : V) : Prop :=
  ∃ (n : ℕ) (x : Fin (n + 1) → V), x 0 = v ∧ x (Fin.last n) = w ∧
    ∀ i : Fin n, ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet, ω ⟨s(x i.castSucc, x i.succ), h⟩ = true

/-- The event {v ↔ w}, as a set of configurations. -/
def connEvent {V : Type} (G : SimpleGraph V) (v w : V) : Set (Config G) :=
  {ω | Joined G ω v w}

/-- The event {v ↔ A} for a set of vertices A: v is connected to at least one vertex of A.

The paper uses "0 ↔ A" without a displayed definition; its neighbouring definitions fix the meaning:
"For a set of vertices A we denote C(A) = ⋃_{a ∈ A} C(a)" and "C(A; B) = {x ∈ B : ∃ y ∈ A s.t. x ↔ y}" (§2.1,
page 4). So {0 ↔ A} is {∃ a ∈ A, 0 ↔ a}; it is the whole space when 0 ∈ A and empty when A is empty. -/
def connSetEvent {V : Type} (G : SimpleGraph V) (v : V) (A : Set V) : Set (Config G) :=
  {ω | ∃ a ∈ A, Joined G ω v a}

/-- "P(v ↔ w) is the probability that v ↔_ω w for ω given by some percolation measure, which is assumed to be clear
from the context" (§2.1, page 4): the probability of an event, as a real number. -/
noncomputable def prob {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (S : Set (Config G)) : ℝ :=
  (percolationMeasure G p S).toReal

/-! ## The conjecture (§4, page 15) -/

/-- **Conjecture 3** of arXiv:2401.12397v1 (§4, page 15), as printed:

"For every ε > 0 there exists δ > 0 such that for any graph G, any A ⊂ G, and any 0, b ∈ G which satisfy
P(0 ↔ A) > 1 − δ and P(a ↔ b) > 1 − δ for all a ∈ A, we have P(0 ↔ b) > 1 − ε."

* `∀ ε > 0, ∃ δ > 0, ∀ graph …`: the order printed; δ may depend on ε and on nothing else.
* "any graph G": a finite graph `G` on a vertex type `V`, "with arbitrary probabilities on its edges"
  `p : E(G) → [0,1]` (Conjecture 1's wording, page 3; Conjecture 3 is introduced as "a weaker version of
  conjecture 1").
* "any A ⊂ G": any set of vertices (the paper: "A ⊆ G stands for 'A is a subset of vertices'"; it writes ⊂ and ⊆
  interchangeably), the empty set and the whole vertex set included.
* "any 0, b ∈ G": any two vertices `o b`, not assumed distinct, not assumed outside A.
* the three inequalities are strict, as printed. -/
def Conjecture3 : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      prob G p (connEvent G o b) > 1 - ε

/-- **Reading B** of the same sentence: "any graph G" taken without Conjecture 1's word "finite" (Conjecture 3 does
not print it), so that infinite graphs such as ℤ^d — which §2.1 also calls a graph and equips with percolation
measures — are included. The vertex set is taken countable: the paper's infinite graphs are ℤ^d and its subgraphs,
and on an uncountable graph the connection events need not be measurable for the product σ-algebra.

`Conjecture3_readingB → Conjecture3` is immediate (a finite type is countable). The converse is true by a standard
exhaustion argument (connection events are increasing unions of the same events in finite subgraphs), but that is a
proof, not a reading; the two are kept apart here. -/
def Conjecture3_readingB : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Countable V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

end KN3Printed
