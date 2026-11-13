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
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
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
/-!
# Check.lean — checks on `Printed.lean`

A FRAGMENT: it has no `import` line and is compiled appended to `Printed.lean` (single-file elaboration cannot
import a file that was never built). `combine.sh` writes `tmp/PrintedCheck.lean = Printed.lean ++ Check.lean`,
which is what is compiled. Nothing here is used by `Conjecture3`; these are sanity lemmas about its ingredients.

What is proved (all without `sorry`, axioms printed at the end):

* the percolation measure is a probability measure;
* with finitely many edges it is the finite product measure `Measure.pi`, and the weight of one configuration ω
  is ∏_e (p(e) if e ∈ ω, 1 − p(e) otherwise) — the formula a reader of the paper expects;
* `Joined` (the paper's "there exist v = x₁ ∼ ⋯ ∼ x_k = w with every {x_i, x_{i+1}} ∈ ω") is the reflexive
  transitive closure of "joined by an open edge"; it is reflexive, symmetric and transitive;
* every connection event is measurable (countable vertex set; in particular every finite graph);
* P(v ↔ v) = 1 and P(v ↔ A) = 1 when v ∈ A; 0 ≤ P ≤ 1;
* the inner implication of `Conjecture3` holds trivially when 0 = b, and for ε > 1 with any δ;
* `Conjecture3_readingB → Conjecture3`;
* the case |A| = 1 of the conjecture, with δ = ε/2 (a union bound) — a check that the three inequalities point the
  way the paper prints them.
-/

namespace KN3Printed

open MeasureTheory

#check @Config
#check @coin
#check @percolationMeasure
#check @Joined
#check @connEvent
#check @connSetEvent
#check @prob
#check (Conjecture3 : Prop)
#check (Conjecture3_readingB : Prop)

/-! ## The measure -/

/-- The percolation measure is a probability measure. -/
instance percolationMeasure_isProbabilityMeasure {V : Type} (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) : IsProbabilityMeasure (percolationMeasure G p) := by
  unfold percolationMeasure
  infer_instance

/-- With finitely many edges the percolation measure is the finite product measure. -/
theorem percolationMeasure_eq_pi {V : Type} (G : SimpleGraph V) [Fintype G.edgeSet]
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) :
    percolationMeasure G p = Measure.pi fun e : G.edgeSet => coin (p e) :=
  Measure.infinitePi_eq_pi _

theorem coin_singleton (q : Set.Icc (0 : ℝ) 1) (c : Bool) :
    coin q {c} = ENNReal.ofReal (if c then (q : ℝ) else 1 - q) := by
  cases c <;> simp [coin]

/-- The weight of one configuration: ∏ over edges of p(e) (open) or 1 − p(e) (closed). -/
theorem percolationMeasure_singleton {V : Type} (G : SimpleGraph V) [Fintype G.edgeSet]
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (ω : Config G) :
    percolationMeasure G p {ω} = ∏ e, ENNReal.ofReal (if ω e then (p e : ℝ) else 1 - p e) := by
  rw [percolationMeasure_eq_pi, Measure.pi_singleton]
  exact Finset.prod_congr rfl fun e _ => coin_singleton (p e) (ω e)

theorem prob_nonneg {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (S : Set (Config G)) : 0 ≤ prob G p S :=
  ENNReal.toReal_nonneg

theorem prob_le_one {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (S : Set (Config G)) : prob G p S ≤ 1 :=
  measureReal_le_one

theorem prob_univ {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) :
    prob G p Set.univ = 1 := by
  simp [prob]

theorem prob_mono {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    {S T : Set (Config G)} (h : S ⊆ T) : prob G p S ≤ prob G p T :=
  measureReal_mono h

/-! ## Connection -/

/-- x and y are joined by an edge of G that is open in ω. -/
def OpenStep {V : Type} (G : SimpleGraph V) (ω : Config G) (x y : V) : Prop :=
  ∃ h : s(x, y) ∈ G.edgeSet, ω ⟨s(x, y), h⟩ = true

/-- The paper's path definition is the reflexive transitive closure of "joined by an open edge". -/
theorem joined_iff_reflTransGen {V : Type} (G : SimpleGraph V) (ω : Config G) (v w : V) :
    Joined G ω v w ↔ Relation.ReflTransGen (OpenStep G ω) v w := by
  constructor
  · rintro ⟨n, x, rfl, rfl, hx⟩
    have key : ∀ (i : ℕ) (hi : i < n + 1),
        Relation.ReflTransGen (OpenStep G ω) (x 0) (x ⟨i, hi⟩) := by
      intro i
      induction i with
      | zero => intro _; exact Relation.ReflTransGen.refl
      | succ i ih =>
        intro hi
        exact (ih (by omega)).tail (hx ⟨i, by omega⟩)
    exact key n (by omega)
  · intro h
    induction h with
    | refl => exact ⟨0, fun _ => v, rfl, rfl, fun i => i.elim0⟩
    | @tail y z _ hstep ih =>
      obtain ⟨n, x, h0, hl, hx⟩ := ih
      refine ⟨n + 1, Fin.snoc x z, ?_, ?_, ?_⟩
      · rw [← Fin.castSucc_zero, Fin.snoc_castSucc]; exact h0
      · exact Fin.snoc_last _ _
      · intro i
        change OpenStep G ω (Fin.snoc (α := fun _ => V) x z i.castSucc) (Fin.snoc (α := fun _ => V) x z i.succ)
        induction i using Fin.lastCases with
        | last =>
          rw [Fin.snoc_castSucc, Fin.succ_last, Fin.snoc_last, hl]
          exact hstep
        | cast j =>
          rw [Fin.snoc_castSucc, ← Fin.castSucc_succ, Fin.snoc_castSucc]
          exact hx j

theorem joined_refl {V : Type} (G : SimpleGraph V) (ω : Config G) (v : V) : Joined G ω v v :=
  (joined_iff_reflTransGen G ω v v).mpr Relation.ReflTransGen.refl

theorem openStep_symm {V : Type} (G : SimpleGraph V) (ω : Config G) {x y : V}
    (h : OpenStep G ω x y) : OpenStep G ω y x := by
  obtain ⟨hE, hω⟩ := h
  have hE' : s(y, x) ∈ G.edgeSet := Sym2.eq_swap ▸ hE
  refine ⟨hE', ?_⟩
  have hsub : (⟨s(y, x), hE'⟩ : G.edgeSet) = ⟨s(x, y), hE⟩ := Subtype.ext Sym2.eq_swap
  rw [hsub]; exact hω

theorem joined_symm {V : Type} (G : SimpleGraph V) (ω : Config G) {v w : V}
    (h : Joined G ω v w) : Joined G ω w v := by
  rw [joined_iff_reflTransGen] at h ⊢
  induction h with
  | refl => exact Relation.ReflTransGen.refl
  | tail _ hstep ih => exact Relation.ReflTransGen.head (openStep_symm G ω hstep) ih

theorem joined_trans {V : Type} (G : SimpleGraph V) (ω : Config G) {u v w : V}
    (h₁ : Joined G ω u v) (h₂ : Joined G ω v w) : Joined G ω u w :=
  (joined_iff_reflTransGen G ω u w).mpr
    (((joined_iff_reflTransGen G ω u v).mp h₁).trans ((joined_iff_reflTransGen G ω v w).mp h₂))

/-- On a countable vertex set (in particular on a finite graph) {v ↔ w} is measurable. -/
theorem measurableSet_connEvent {V : Type} [Countable V] (G : SimpleGraph V) (v w : V) :
    MeasurableSet (connEvent G v w) := by
  have h : connEvent G v w = ⋃ (n : ℕ), ⋃ (x : Fin (n + 1) → V),
      ⋃ (_ : x 0 = v ∧ x (Fin.last n) = w), ⋂ i : Fin n,
        {ω : Config G | ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet,
          ω ⟨s(x i.castSucc, x i.succ), h⟩ = true} := by
    ext ω
    simp only [connEvent, Joined, Set.mem_setOf_eq, Set.mem_iUnion, Set.mem_iInter, exists_prop]
    constructor
    · rintro ⟨n, x, h0, hl, hx⟩; exact ⟨n, x, ⟨h0, hl⟩, hx⟩
    · rintro ⟨n, x, ⟨h0, hl⟩, hx⟩; exact ⟨n, x, h0, hl, hx⟩
  rw [h]
  refine .iUnion fun n => .iUnion fun x => .iUnion fun _ => .iInter fun i => ?_
  by_cases hE : s(x i.castSucc, x i.succ) ∈ G.edgeSet
  · have h' : {ω : Config G | ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet,
        ω ⟨s(x i.castSucc, x i.succ), h⟩ = true}
        = (fun ω : Config G => ω ⟨s(x i.castSucc, x i.succ), hE⟩) ⁻¹' {true} := by
      ext ω; simp [hE]
    rw [h']
    exact (measurable_pi_apply _) (measurableSet_singleton _)
  · have h' : {ω : Config G | ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet,
        ω ⟨s(x i.castSucc, x i.succ), h⟩ = true} = ∅ := by
      ext ω; simp [hE]
    rw [h']
    exact .empty

/-- On a countable vertex set {v ↔ A} is measurable. -/
theorem measurableSet_connSetEvent {V : Type} [Countable V] (G : SimpleGraph V) (v : V) (A : Set V) :
    MeasurableSet (connSetEvent G v A) := by
  have h : connSetEvent G v A = ⋃ a ∈ A, connEvent G v a := by
    ext ω; simp [connSetEvent, connEvent]
  rw [h]
  exact .biUnion A.to_countable fun a _ => measurableSet_connEvent G v a

/-- {v ↔ {a}} = {v ↔ a}. -/
theorem connSetEvent_singleton {V : Type} (G : SimpleGraph V) (v a : V) :
    connSetEvent G v {a} = connEvent G v a := by
  ext ω; simp [connSetEvent, connEvent]

/-- P(v ↔ v) = 1. -/
theorem prob_connEvent_of_eq {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    {v w : V} (h : v = w) : prob G p (connEvent G v w) = 1 := by
  subst h
  have : connEvent G v v = Set.univ := Set.eq_univ_of_forall fun ω => joined_refl G ω v
  rw [this, prob_univ]

/-- P(v ↔ A) = 1 when v ∈ A. -/
theorem prob_connSetEvent_of_mem {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    {v : V} {A : Set V} (h : v ∈ A) : prob G p (connSetEvent G v A) = 1 := by
  have : connSetEvent G v A = Set.univ :=
    Set.eq_univ_of_forall fun ω => ⟨v, h, joined_refl G ω v⟩
  rw [this, prob_univ]

/-! ## The statement in trivial cases -/

/-- The conclusion of Conjecture 3 holds outright when 0 = b. -/
theorem conclusion_of_eq {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (o : V) {ε : ℝ} (hε : 0 < ε) : prob G p (connEvent G o o) > 1 - ε := by
  rw [prob_connEvent_of_eq G p rfl]; linarith

/-- For ε > 1 the conclusion of Conjecture 3 holds for every graph (the paper, proof of Lemma 10, page 17: "The lemma is
obvious for ε > 1"). -/
theorem conclusion_of_one_lt {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (o b : V) {ε : ℝ} (hε : 1 < ε) : prob G p (connEvent G o b) > 1 - ε := by
  have := prob_nonneg G p (connEvent G o b); linarith

/-- Reading B (countable graphs) contains the finite-graph statement. -/
theorem conjecture3_of_readingB (h : Conjecture3_readingB) : Conjecture3 := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, fun V _ G p A o b h₁ h₂ => H V G p A o b h₁ h₂⟩

/-- The case |A| = 1 of Conjecture 3, on any countable graph, with δ = ε/2:
P(0 ↔ b) ≥ P(0 ↔ a, a ↔ b) ≥ P(0 ↔ a) + P(a ↔ b) − 1 > 1 − 2δ. -/
theorem conjecture3_singleton :
    ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
      ∀ (V : Type) [Countable V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (a o b : V),
        prob G p (connSetEvent G o {a}) > 1 - δ →
        (∀ a' ∈ ({a} : Set V), prob G p (connEvent G a' b) > 1 - δ) →
        prob G p (connEvent G o b) > 1 - ε := by
  intro ε hε
  refine ⟨ε / 2, by positivity, ?_⟩
  intro V _ G p a o b h₁ h₂
  rw [connSetEvent_singleton] at h₁
  have h₂' := h₂ a rfl
  have hsub : connEvent G o a ∩ connEvent G a b ⊆ connEvent G o b :=
    fun ω hω => joined_trans G ω hω.1 hω.2
  have hmono := prob_mono G p hsub
  have hadd := measureReal_union_add_inter (μ := percolationMeasure G p)
    (s := connEvent G o a) (measurableSet_connEvent G a b)
  have hle := prob_le_one G p (connEvent G o a ∪ connEvent G a b)
  simp only [prob] at *
  simp only [Measure.real] at hadd
  linarith

/-! ## Axioms -/

#print axioms Conjecture3
#print axioms Conjecture3_readingB
#print axioms coin_isProbabilityMeasure
#print axioms percolationMeasure_singleton
#print axioms joined_iff_reflTransGen
#print axioms joined_symm
#print axioms measurableSet_connSetEvent
#print axioms conjecture3_of_readingB
#print axioms conjecture3_singleton

end KN3Printed
/-!
# Planted.lean — planted WRONG variants of `KN3Printed.Conjecture3` (red controls), and four neighbours

A FRAGMENT: it has no `import` line and is compiled appended to `Printed.lean`
(`combine.sh` writes `tmp/PrintedPlanted.lean = Printed.lean ++ Planted.lean`). It uses only the definitions of
`Printed.lean`.

Each planted variant differs from `Conjecture3` in ONE named place. A bridge that proves "their statement ↔ one of
these" has not shown that their statement is Conjecture 3. For each: what was changed, and what I believe about it
(PROVABLY FALSE / PROVABLY TRUE, hence different from an open conjecture / UNKNOWN). Where the belief is proved in
Lean, the proof is in `PlantedCheck.lean` and is named here.

For reference, `Conjecture3` is

    ∀ ε > 0, ∃ δ > 0, ∀ V [Finite V] G p A o b,
      P(o ↔ A) > 1 − δ → (∀ a ∈ A, P(a ↔ b) > 1 − δ) → P(o ↔ b) > 1 − ε.
-/

namespace KN3Planted

open KN3Printed

/-! ## Planted wrong variants -/

/-- PLANTED 1 — quantifiers swapped: `∃ δ` moved after the graph, the probabilities, A, 0 and b, so δ may depend
on all of them (the paper: "there exists δ > 0 such that for any graph G …").

Belief: PROVABLY TRUE, and trivially so — not the conjecture. Fix G, p, A, o, b. If P(o ↔ A) < 1 take
δ = 1 − P(o ↔ A): the first hypothesis fails. If some P(a ↔ b) < 1 take δ = 1 − P(a ↔ b): the second fails.
Otherwise P(o ↔ A) = 1 and every P(a ↔ b) = 1 with A finite, so almost surely o is joined to some a ∈ A and every
a ∈ A is joined to b, hence P(o ↔ b) = 1 > 1 − ε. Not proved in Lean here. -/
def Planted1_deltaAfterGraph : Prop :=
  ∀ ε : ℝ, 0 < ε →
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      ∃ δ : ℝ, 0 < δ ∧
        (prob G p (connSetEvent G o A) > 1 - δ →
        (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
        prob G p (connEvent G o b) > 1 - ε)

/-- PLANTED 2 — a hypothesis dropped: `0 < δ` removed (the paper: "there exists δ > 0").

Belief: PROVABLY TRUE, vacuously (δ = −1 makes "P(o ↔ A) > 2" impossible).
Proved: `KN3Planted.planted2_true` in `PlantedCheck.lean`. -/
def Planted2_deltaNotPositive : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ,
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 3 — an inequality reversed: the conclusion reads `P(o ↔ b) < 1 − ε` (the paper: "> 1 − ε").

Belief: PROVABLY FALSE (one vertex, o = b, A = {o}: every probability is 1, and 1 < 1 − ε fails).
Proved: `KN3Planted.planted3_false` in `PlantedCheck.lean`. -/
def Planted3_conclusionReversed : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) < 1 - ε

/-- PLANTED 4 — a hypothesis dropped: "P(a ↔ b) > 1 − δ for all a ∈ A" removed.

Belief: PROVABLY FALSE (two vertices, no edge, A = {o}, b the other vertex: P(o ↔ A) = 1 and P(o ↔ b) = 0; take
ε = 1). Proved: `KN3Planted.planted4_false` in `PlantedCheck.lean`. -/
def Planted4_hypothesisDropped : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 5 — a quantifier changed inside the hypothesis: "for all a ∈ A" became "for some a ∈ A".

Belief: PROVABLY FALSE (two vertices, no edge, A = both vertices: P(o ↔ A) = 1 because o ∈ A, and a = b gives
P(a ↔ b) = 1, yet P(o ↔ b) = 0; take ε = 1). Proved: `KN3Planted.planted5_false` in `PlantedCheck.lean`. -/
def Planted5_existsInsteadOfForall : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∃ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 6 — a constant changed: "there exists δ" replaced by δ = ε itself.

Belief: PROVABLY FALSE. The path o — a — b with both edges open with probability 3/5 and A = {a}:
P(o ↔ A) = P(a ↔ b) = 3/5 > 1 − 1/2, while P(o ↔ b) = 9/25 < 1 − 1/2; take ε = 1/2.
(Conjecture 1 would only give δ = 1 − √(1 − ε) < ε.) Not proved in Lean here. -/
def Planted6_deltaIsEpsilon : Prop :=
  ∀ ε : ℝ, 0 < ε →
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - ε →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - ε) →
      prob G p (connEvent G o b) > 1 - ε

/-! ## Neighbours (not planted errors: statements near Conjecture 3 that are NOT it as printed) -/

/-- NEIGHBOUR 1 — **Conjecture 1** of the same paper (page 3), "the post-FKG conjecture":
"Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two vertices and let A ⊂ G be
a set of vertices. Then P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}."

The minimum over a finite nonempty A is attained, and P(0 ↔ A) ≥ 0, so the inequality says: some a ∈ A has
P(0 ↔ b) ≥ P(0 ↔ A) · P(a ↔ b). For A = ∅ the minimum is not defined and P(0 ↔ A) = 0; that case is left out.

Status: UNKNOWN (open; the paper: "We were not able to prove or disprove this conjecture"). It implies
Conjecture 3 ("clearly follows … by taking δ = 1 − √(1 − ε)", page 15); the converse is not claimed anywhere in
the paper. A statement equivalent to this one is Conjecture 1, not Conjecture 3. -/
def Neighbour1_Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- NEIGHBOUR 2 — every edge has the SAME probability q (the paper's P_p, "the percolation measure with the
constant function p", page 4), δ still depending on ε only.

Status: UNKNOWN. It follows from `Conjecture3` (a special case of p). I do not claim the converse: on simple
graphs a constant probability cannot represent the merged parallel edges that the paper's own use of Conjecture 3
produces (the contracted graph K_ξ, proof of Lemma 10, Step V, pages 20–22), so this is weaker as a tool. -/
def Neighbour2_constantProbability : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (q : Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G (fun _ => q) (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G (fun _ => q) (connEvent G a b) > 1 - δ) →
      prob G (fun _ => q) (connEvent G o b) > 1 - ε

/-- NEIGHBOUR 3 — "A ⊂ G" read as a PROPER subset (Lean's `⊂` is strict; the paper's is not: it defines the
notation as "A ⊆ G" and then writes "A ⊂ G" throughout).

Status: equivalent to `Conjecture3` by a one-line mathematical argument (add an isolated vertex to G: no
probability changes and A becomes proper), but not the same statement; the equivalence is not proved here. -/
def Neighbour3_properSubset : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V), A ≠ Set.univ →
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- NEIGHBOUR 4 — A assumed NONEMPTY (the paper does not say so; with A = ∅ the event {0 ↔ A} is empty).

Status: EQUIVALENT to `Conjecture3`, proved: `KN3Planted.conjecture3_iff_neighbour4` in `PlantedCheck.lean`
(shrink δ to at most 1; then A = ∅ contradicts "P(0 ↔ A) > 1 − δ"). So this choice does not matter. -/
def Neighbour4_nonemptyA : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V), A.Nonempty →
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

end KN3Planted
/-!
# PlantedCheck.lean — the status of four planted variants, proved

A FRAGMENT: compiled as `tmp/All.lean = Printed.lean ++ Check.lean ++ Planted.lean ++ PlantedCheck.lean`
(`combine.sh`). It uses the sanity lemmas of `Check.lean`.

Proved here: Planted 2 is TRUE (vacuously); Planted 3, 4 and 5 are FALSE. Also the easy implications
`Conjecture3 → Planted1`, `Conjecture3 → Neighbour2`, `Conjecture3 → Neighbour3`, which say only that these are
weakenings, and the equivalence `Conjecture3 ↔ Neighbour4` (A nonempty or not makes no difference).
Planted 1 (true) and Planted 6 (false) are argued in comments in `Planted.lean`, not proved.
-/

namespace KN3Planted

open KN3Printed

/-- In the graph with no edges, joined vertices are equal. -/
theorem joined_bot {V : Type} (ω : Config (⊥ : SimpleGraph V)) {v w : V}
    (h : Joined (⊥ : SimpleGraph V) ω v w) : v = w := by
  obtain ⟨n, x, rfl, rfl, hx⟩ := h
  cases n with
  | zero => rfl
  | succ n =>
    obtain ⟨hE, -⟩ := hx 0
    simp at hE

/-- In the graph with no edges, P(v ↔ w) = 0 for v ≠ w. -/
theorem prob_connEvent_bot {V : Type} (p : (⊥ : SimpleGraph V).edgeSet → Set.Icc (0 : ℝ) 1)
    {v w : V} (h : v ≠ w) : prob (⊥ : SimpleGraph V) p (connEvent ⊥ v w) = 0 := by
  have : connEvent (⊥ : SimpleGraph V) v w = ∅ :=
    Set.eq_empty_of_forall_notMem fun ω hω => h (joined_bot ω hω)
  simp [prob, this]

/-- Planted 2 (no `0 < δ`) is true: δ = −1. -/
theorem planted2_true : Planted2_deltaNotPositive := by
  intro ε _
  refine ⟨-1, ?_⟩
  intro V _ G p A o b h₁ _
  have := prob_le_one G p (connSetEvent G o A)
  linarith

/-- Planted 3 (conclusion reversed) is false: one vertex. -/
theorem planted3_false : ¬ Planted3_conclusionReversed := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Unit ⊥ (fun _ => ⟨0, by simp⟩) {()} () ()
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_singleton ())]; linarith)
    (fun a _ => by rw [prob_connEvent_of_eq _ _ rfl]; linarith)
  rw [prob_connEvent_of_eq _ _ rfl] at key
  linarith

/-- Planted 4 (the hypothesis on A ↔ b dropped) is false: two vertices, no edge, A = {o}. -/
theorem planted4_false : ¬ Planted4_hypothesisDropped := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Bool ⊥ (fun _ => ⟨0, by simp⟩) {false} false true
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_singleton false)]; linarith)
  rw [prob_connEvent_bot _ (by decide)] at key
  linarith

/-- Planted 5 ("for some a ∈ A") is false: two vertices, no edge, A = everything. -/
theorem planted5_false : ¬ Planted5_existsInsteadOfForall := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Bool ⊥ (fun _ => ⟨0, by simp⟩) Set.univ false true
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_univ false)]; linarith)
    ⟨true, Set.mem_univ true, by rw [prob_connEvent_of_eq _ _ rfl]; linarith⟩
  rw [prob_connEvent_bot _ (by decide)] at key
  linarith

/-- Planted 1 is a weakening of the conjecture (δ may be chosen after the graph). -/
theorem planted1_of_conjecture3 (h : Conjecture3) : Planted1_deltaAfterGraph := by
  intro ε hε V _ G p A o b
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, H V G p A o b⟩

/-- Neighbour 2 (constant probability) is a special case of the conjecture. -/
theorem neighbour2_of_conjecture3 (h : Conjecture3) : Neighbour2_constantProbability := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, fun V _ G q A o b => H V G (fun _ => q) A o b⟩

/-- Neighbour 3 (A a proper subset) is a special case of the conjecture. -/
theorem neighbour3_of_conjecture3 (h : Conjecture3) : Neighbour3_properSubset := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, fun V _ G p A o b _ => H V G p A o b⟩

/-- Assuming A nonempty changes nothing: Conjecture 3 ↔ Neighbour 4. -/
theorem conjecture3_iff_neighbour4 : Conjecture3 ↔ Neighbour4_nonemptyA := by
  constructor
  · intro h ε hε
    obtain ⟨δ, hδ, H⟩ := h ε hε
    exact ⟨δ, hδ, fun V _ G p A o b _ => H V G p A o b⟩
  · intro h ε hε
    obtain ⟨δ, hδ, H⟩ := h ε hε
    refine ⟨min δ 1, lt_min hδ one_pos, ?_⟩
    intro V _ G p A o b h₁ h₂
    have hδ' : min δ 1 ≤ δ := min_le_left _ _
    rcases A.eq_empty_or_nonempty with hA | hA
    · exfalso
      have h0 : prob G p (connSetEvent G o A) = 0 := by
        have : connSetEvent G o A = ∅ := by
          ext ω; simp [connSetEvent, hA]
        simp [prob, this]
      have : min δ 1 ≤ 1 := min_le_right _ _
      linarith
    · exact H V G p A o b hA (by linarith) (fun a ha => by have := h₂ a ha; linarith)

#print axioms conjecture3_iff_neighbour4
#print axioms planted2_true
#print axioms planted3_false
#print axioms planted4_false
#print axioms planted5_false
#print axioms planted1_of_conjecture3
#print axioms neighbour2_of_conjecture3
#print axioms neighbour3_of_conjecture3

end KN3Planted
/-!
# Transport.lean — everything the bridge needs that Mathlib alone can prove

A FRAGMENT: it has no `import` line and is compiled appended to
`Printed.lean ++ Check.lean ++ Planted.lean ++ PlantedCheck.lean` (`bridge/combine.sh` writes
`bridge/tmp/AllTransport.lean`). It uses the sealed definitions of `Printed.lean`, the sanity lemmas of `Check.lean`
and the sealed implications of `PlantedCheck.lean`. It imports nothing of the lab's library and mentions none of its
names.

What it contains.

1. **The mirror.** `setLaw`, `conn` and `LabForm` are the bodies of the lab's `prodBernoulli`, `openConn` (with
   `openGraph` unfolded) and `KozmaNitzan2024_conjecture3`, typed here with Mathlib only. That the mirror IS the
   lab's statement is not claimed here: it is checked in the lab's environment by `Iff.rfl` (`Compare.lean`).
2. **The measure transports**, as statements about products of two-point measures along an injection of index
   types: `map_pushProp` (our coins, read as a random set, are the set law) and `map_pull` (the set law, read on a
   sub-family of coordinates, is our coin product).
3. **The dictionary of connections**: reachability in `SimpleGraph.fromEdgeSet ω` against `Joined`.
4. **The implications**: `conjecture3_of_labForm` (Lab → R0), `labForm_of_conjecture3` (R0 → Lab),
   `labForm_of_neighbour3` (N3 → Lab, by one isolated vertex), `readingB_of_conjecture3` (R0 → RB, by exhaustion)
   and the corollaries for RB, N2, N3, N4.
-/

namespace KN3Transport

open MeasureTheory KN3Printed KN3Planted

/-! ## 1. The mirror of the lab's definitions -/

/-- The body of the lab's `prodBernoulli`: each index `i` is in the random set independently with probability
`p i`. The pullback along `s ↦ (i ↦ i ∈ s)` of the product of the two-point measures on `Prop`. -/
noncomputable def setLaw {ι : Type*} (p : ι → unitInterval) : Measure (Set ι) :=
  .comap (fun s i => i ∈ s) <| Measure.infinitePi fun i : ι =>
    unitInterval.toNNReal (p i) • Measure.dirac True +
      unitInterval.toNNReal (unitInterval.symm (p i)) • Measure.dirac False

/-- The body of the lab's `openConn`, with `openGraph ω = SimpleGraph.fromEdgeSet ω` unfolded: `x` and `y` are joined
in the simple graph whose edges are the non-diagonal pairs of `ω`. -/
def conn {V : Type*} (x y : V) : Set (Set (Sym2 V)) := {ω | (SimpleGraph.fromEdgeSet ω).Reachable x y}

/-- The body of the lab's `KozmaNitzan2024_conjecture3`, over `setLaw` and `conn`. -/
def LabForm : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧ ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n))
    (o b : Fin n),
    1 - δ < (setLaw w).real (⋃ a ∈ A, conn o a) →
      (∀ a ∈ A, 1 - δ < (setLaw w).real (conn a b)) →
        1 - ε < (setLaw w).real (conn o b)

/-! ## 2. The two-point measures -/

/-- The factor of `setLaw`: `True` with probability `q`, `False` with probability `1 − q`. -/
noncomputable def ν (q : unitInterval) : Measure Prop :=
  unitInterval.toNNReal q • Measure.dirac True + unitInterval.toNNReal (unitInterval.symm q) • Measure.dirac False

instance ν_isProbabilityMeasure (q : unitInterval) : IsProbabilityMeasure (ν q) := by
  constructor
  simp only [ν, Measure.coe_add, Measure.coe_smul, Pi.add_apply, Pi.smul_apply, measure_univ,
    ENNReal.smul_def, smul_eq_mul, mul_one]
  rw [← ENNReal.coe_add, unitInterval.toNNReal_add_toNNReal_symm, ENNReal.coe_one]

theorem setLaw_eq_map {ι : Type*} (p : ι → unitInterval) :
    setLaw p = (Measure.infinitePi fun i => ν (p i)).map (fun q : ι → Prop => {i | q i}) :=
  MeasurableEquiv.setOf.comap_symm

theorem coe_toNNReal (q : unitInterval) : ((unitInterval.toNNReal q : NNReal) : ENNReal) = ENNReal.ofReal q := by
  rw [ENNReal.ofReal_eq_coe_nnreal q.2.1]
  rfl

theorem coe_toNNReal_symm (q : unitInterval) :
    ((unitInterval.toNNReal (unitInterval.symm q) : NNReal) : ENNReal) = ENNReal.ofReal (1 - q) := by
  rw [coe_toNNReal, unitInterval.coe_symm_eq]

/-- Our coin, read as a proposition ("the edge is open"), is the factor of the set law. -/
theorem coin_map (q : Set.Icc (0 : ℝ) 1) : (coin q).map (fun b : Bool => b = true) = ν q := by
  have hT : (true = true) = True := propext ⟨fun _ => trivial, fun _ => rfl⟩
  have hF : (false = true) = False := propext ⟨Bool.false_ne_true, False.elim⟩
  have hm : Measurable (fun b : Bool => b = true) := measurable_of_countable _
  rw [coin, ν, Measure.map_add _ _ hm, Measure.map_smul, Measure.map_smul, Measure.map_dirac' hm,
    Measure.map_dirac' hm, hT, hF, ENNReal.smul_def, ENNReal.smul_def, coe_toNNReal, coe_toNNReal_symm]

/-- A proposition as a bit. -/
noncomputable def bit (P : Prop) : Bool := by classical exact decide P

theorem bit_eq_true {P : Prop} : bit P = true ↔ P := by
  classical
  simp [bit]

theorem measurable_bit : Measurable bit := Measurable.of_discrete

/-- The factor of the set law, read as a bit, is our coin. -/
theorem ν_map_bit (q : unitInterval) : (ν q).map bit = coin q := by
  have hT : bit True = true := bit_eq_true.2 trivial
  have hF : bit False = false := by
    cases h : bit False
    · rfl
    · exact (bit_eq_true.1 h).elim
  rw [coin, ν, Measure.map_add _ _ measurable_bit, Measure.map_smul, Measure.map_smul,
    Measure.map_dirac' measurable_bit, Measure.map_dirac' measurable_bit, hT, hF, ENNReal.smul_def,
    ENNReal.smul_def, coe_toNNReal, coe_toNNReal_symm]

theorem ν_zero : ν 0 = Measure.dirac False := by
  simp [ν]

/-! ## 3. Products along an injection of index types -/

/-- A sub-family of independent coordinates is independent with the same laws: the product measure, read on the
coordinates `f i` for an injective `f`, is the product of the measures `μ (f i)`. -/
theorem infinitePi_map_comp_injective {I J X : Type*} [MeasurableSpace X] (μ : J → Measure X)
    [∀ j, IsProbabilityMeasure (μ j)] (f : I → J) (hf : Function.Injective f) :
    (Measure.infinitePi μ).map (fun (x : J → X) (i : I) => x (f i)) = Measure.infinitePi fun i => μ (f i) := by
  classical
  refine Measure.eq_infinitePi _ fun s t ht => ?_
  rw [Measure.map_apply (by fun_prop) (MeasurableSet.pi s.countable_toSet fun i _ => ht i)]
  have ht' : ∀ i, {y : X | ∀ i', f i' = f i → y ∈ t i'} = t i := by
    intro i
    ext y
    constructor
    · intro h
      exact h i rfl
    · intro h _ hi'
      rw [hf hi']
      exact h
  have hpre : (fun (x : J → X) (i : I) => x (f i)) ⁻¹' (Set.pi ↑s t) =
      Set.pi ↑(s.map ⟨f, hf⟩) (fun j => {y : X | ∀ i, f i = j → y ∈ t i}) := by
    ext x
    simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Finset.mem_map, Function.Embedding.coeFn_mk,
      Set.mem_setOf_eq]
    constructor
    · rintro h j ⟨i, hi, rfl⟩ _ hi'
      rw [hf hi']
      exact h i hi
    · intro h i hi
      exact h (f i) ⟨i, hi, rfl⟩ i rfl
  rw [hpre, Measure.infinitePi_pi, Finset.prod_map]
  · refine Finset.prod_congr rfl fun i _ => ?_
    simp only [Function.Embedding.coeFn_mk]
    rw [ht']
  · intro j hj
    obtain ⟨i, -, rfl⟩ := Finset.mem_map.1 hj
    simp only [Function.Embedding.coeFn_mk]
    rw [ht']
    exact ht i

/-- The open coordinates of a Bool-valued configuration on `I`, as a predicate on `J`, along `f : I → J`. -/
def pushProp {I J : Type*} (f : I → J) (ω : I → Bool) : J → Prop := fun j => ∃ i, f i = j ∧ ω i = true

/-- The same, as a set. -/
def push {I J : Type*} (f : I → J) (ω : I → Bool) : Set J := {j | pushProp f ω j}

theorem pushProp_apply {I J : Type*} {f : I → J} (hf : Function.Injective f) (ω : I → Bool) (i : I) :
    pushProp f ω (f i) = (ω i = true) :=
  propext ⟨fun ⟨_, hi', h⟩ => hf hi' ▸ h, fun h => ⟨i, rfl, h⟩⟩

theorem pushProp_of_notMem_range {I J : Type*} {f : I → J} (ω : I → Bool) {j : J} (hj : j ∉ Set.range f) :
    pushProp f ω j = False :=
  propext ⟨fun ⟨i, hi, _⟩ => hj ⟨i, hi⟩, False.elim⟩

theorem measurable_pushProp {I J : Type*} {f : I → J} (hf : Function.Injective f) :
    Measurable (pushProp f) := by
  refine measurable_pi_lambda _ fun j => ?_
  refine measurableSet_setOf.mp ?_
  by_cases hj : j ∈ Set.range f
  · obtain ⟨i, rfl⟩ := hj
    have : {ω : I → Bool | pushProp f ω (f i)} = (fun ω => ω i) ⁻¹' {true} := by
      ext ω
      simp [pushProp_apply hf ω i]
    rw [this]
    exact measurable_pi_apply _ (measurableSet_singleton true)
  · have : {ω : I → Bool | pushProp f ω j} = ∅ := by
      ext ω
      simp [pushProp_of_notMem_range ω hj]
    rw [this]
    exact MeasurableSet.empty

theorem measurable_push {I J : Type*} {f : I → J} (hf : Function.Injective f) : Measurable (push f) :=
  measurable_setOf.comp (measurable_pushProp hf)

/-- **Our coins, read as a random set.** If `w` is `p` along the injection `f` and `0` off its range, the product of
the coins `coin (p i)`, pushed to predicates on `J`, is the product of the two-point measures `ν (w j)`. -/
theorem map_pushProp {I J : Type*} {f : I → J} (hf : Function.Injective f) (p : I → Set.Icc (0 : ℝ) 1)
    (w : J → unitInterval) (hw : ∀ i, w (f i) = p i) (hw0 : ∀ j, j ∉ Set.range f → w j = 0) :
    (Measure.infinitePi fun i => coin (p i)).map (pushProp f) = Measure.infinitePi fun j => ν (w j) := by
  classical
  refine Measure.eq_infinitePi _ fun s t ht => ?_
  rw [Measure.map_apply (measurable_pushProp hf) (MeasurableSet.pi s.countable_toSet fun i _ => ht i)]
  by_cases C : ∀ j ∈ s, j ∉ Set.range f → False ∈ t j
  · -- the preimage is a box over the coordinates of `I` that land in `s`
    have hpre : pushProp f ⁻¹' (Set.pi ↑s t) =
        Set.pi ↑(s.preimage f hf.injOn) (fun i => (fun b : Bool => b = true) ⁻¹' t (f i)) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Finset.mem_preimage]
      constructor
      · intro h i hi
        have := h (f i) hi
        rwa [pushProp_apply hf] at this
      · intro h j hj
        by_cases hr : j ∈ Set.range f
        · obtain ⟨i, rfl⟩ := hr
          rw [pushProp_apply hf]
          exact h i hj
        · rw [pushProp_of_notMem_range ω hr]
          exact C j hj hr
    rw [hpre, Measure.infinitePi_pi _ (fun _ _ => MeasurableSet.of_discrete)]
    rw [← Finset.prod_preimage f s hf.injOn (fun j => ν (w j) (t j))]
    · refine Finset.prod_congr rfl fun i _ => ?_
      rw [← Measure.map_apply (measurable_of_countable _) (ht (f i)), coin_map, hw]
    · intro j hj hr
      rw [hw0 j hr, ν_zero]
      exact Measure.dirac_apply_of_mem (C j hj hr)
  · -- a coordinate off the range of `f` is asked to be open: the preimage is empty, and so is a factor
    push Not at C
    obtain ⟨j, hj, hr, hF⟩ := C
    have hpre : pushProp f ⁻¹' (Set.pi ↑s t) = (∅ : Set (I → Bool)) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Set.mem_empty_iff_false, iff_false]
      intro h
      have := h j hj
      rw [pushProp_of_notMem_range ω hr] at this
      exact hF this
    rw [hpre, measure_empty]
    refine (Finset.prod_eq_zero hj ?_).symm
    rw [hw0 j hr, ν_zero, Measure.dirac_apply, Set.indicator_of_notMem hF]

/-- **Our coins, read as a random set, have the set law.** -/
theorem map_push {I J : Type*} {f : I → J} (hf : Function.Injective f) (p : I → Set.Icc (0 : ℝ) 1)
    (w : J → unitInterval) (hw : ∀ i, w (f i) = p i) (hw0 : ∀ j, j ∉ Set.range f → w j = 0) :
    (Measure.infinitePi fun i => coin (p i)).map (push f) = setLaw w := by
  rw [setLaw_eq_map, ← map_pushProp hf p w hw hw0, Measure.map_map measurable_setOf (measurable_pushProp hf)]
  rfl

/-- A random set of `J`, read as a Bool-valued configuration on `I` along `f : I → J`. -/
noncomputable def pull {I J : Type*} (f : I → J) (ω : Set J) : I → Bool := fun i => bit (f i ∈ ω)

theorem measurable_pull {I J : Type*} (f : I → J) : Measurable (pull f) :=
  measurable_pi_lambda _ fun i => measurable_bit.comp (measurable_set_mem (f i))

/-- **The set law, read on a sub-family of coordinates, is our coin product.** No hypothesis on `w` off the range
of `f`: those coordinates are forgotten. -/
theorem map_pull {I J : Type*} {f : I → J} (hf : Function.Injective f) (w : J → unitInterval) :
    (setLaw w).map (pull f) = Measure.infinitePi fun i => coin (w (f i)) := by
  have h1 : Measurable (fun (x : J → Prop) (i : I) => x (f i)) := by fun_prop
  have h2 : Measurable (fun (x : I → Prop) (i : I) => bit (x i)) :=
    measurable_pi_lambda _ fun i => measurable_bit.comp (measurable_pi_apply i)
  rw [setLaw_eq_map, Measure.map_map (measurable_pull f) measurable_setOf]
  have hcomp : pull f ∘ (fun q : J → Prop => {j | q j}) =
      (fun (x : I → Prop) (i : I) => bit (x i)) ∘ (fun (x : J → Prop) (i : I) => x (f i)) := rfl
  rw [hcomp, ← Measure.map_map h2 h1, infinitePi_map_comp_injective (fun j => ν (w j)) f hf,
    Measure.infinitePi_map_pi _ (fun _ => measurable_bit)]
  congr 1
  funext i
  exact ν_map_bit (w (f i))

/-! ## 4. Connections: `SimpleGraph.fromEdgeSet … .Reachable` against `Joined` -/

/-- The edges of `G`, as unordered pairs of `W`, along a map of vertices `e : V → W`. -/
def edgeMap {V W : Type} (G : SimpleGraph V) (e : V → W) : G.edgeSet → Sym2 W := fun i => Sym2.map e i.1

theorem edgeMap_injective {V W : Type} (G : SimpleGraph V) {e : V → W} (he : Function.Injective e) :
    Function.Injective (edgeMap G e) :=
  fun _ _ hij => Subtype.ext (Sym2.map.injective he hij)

/-! ### From our encoding to the lab's (used for Lab → R0) -/

/-- The open edges of a configuration of `G`, relabelled by `e : V ≃ W`, are a set of pairs of `W`; `e x` and `e y`
are joined in it exactly when `x` and `y` are joined in the configuration. -/
theorem push_mem_conn {V W : Type} (G : SimpleGraph V) (e : V ≃ W) (ω : Config G) (x y : V) :
    push (edgeMap G e) ω ∈ conn (e x) (e y) ↔ Joined G ω x y := by
  have hadj : ∀ u v : V,
      (SimpleGraph.fromEdgeSet (push (edgeMap G e) ω)).Adj (e u) (e v) ↔ OpenStep G ω u v := by
    intro u v
    rw [SimpleGraph.fromEdgeSet_adj]
    constructor
    · rintro ⟨⟨⟨s, hs⟩, hi, hω⟩, -⟩
      have hi' : s = s(u, v) := Sym2.map.injective e.injective hi
      subst hi'
      exact ⟨hs, hω⟩
    · rintro ⟨h, hω⟩
      exact ⟨⟨⟨s(u, v), h⟩, rfl, hω⟩, fun huv => G.ne_of_adj h (e.injective huv)⟩
  show (SimpleGraph.fromEdgeSet (push (edgeMap G e) ω)).Reachable (e x) (e y) ↔ _
  rw [SimpleGraph.reachable_iff_reflTransGen, joined_iff_reflTransGen]
  constructor
  · intro h
    have h' : Relation.ReflTransGen (OpenStep G ω) (e.symm (e x)) (e.symm (e y)) := by
      refine Relation.ReflTransGen.lift e.symm (fun a b hab => ?_) _ _ h
      refine (hadj (e.symm a) (e.symm b)).1 ?_
      rw [e.apply_symm_apply, e.apply_symm_apply]
      exact hab
    rwa [e.symm_apply_apply, e.symm_apply_apply] at h'
  · intro h
    exact Relation.ReflTransGen.lift e (fun u v huv => (hadj u v).2 huv) _ _ h

theorem push_preimage_conn {V W : Type} (G : SimpleGraph V) (e : V ≃ W) (x y : V) :
    push (edgeMap G e) ⁻¹' conn (e x) (e y) = connEvent G x y := by
  ext ω
  exact push_mem_conn G e ω x y

/-- The weight function of the lab's encoding for a graph `G` with edge probabilities `p`, relabelled by `e`: `p` on
the images of the edges of `G`, and `0` on every other pair (non-edges and the diagonal). -/
noncomputable def weightOf {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V → W) :
    Sym2 W → unitInterval := fun j => by
  classical exact if h : ∃ i, edgeMap G e i = j then p h.choose else 0

theorem weightOf_apply {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) {e : V → W}
    (he : Function.Injective e) (i : G.edgeSet) : weightOf G p e (edgeMap G e i) = p i := by
  have h : ∃ i', edgeMap G e i' = edgeMap G e i := ⟨i, rfl⟩
  simp only [weightOf]
  rw [dif_pos h, edgeMap_injective G he h.choose_spec]

theorem weightOf_of_notMem_range {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (e : V → W) (j : Sym2 W) (hj : j ∉ Set.range (edgeMap G e)) : weightOf G p e j = 0 := by
  simp only [weightOf]
  rw [dif_neg (show ¬ ∃ i, edgeMap G e i = j from hj)]

/-! ### From the lab's encoding to ours (used for R0 → Lab, N3 → Lab, and for measurability) -/

/-- The complete graph on the image of `g : W → V`: two distinct vertices of the image are neighbours; a vertex off
the image is isolated. For `g = id` it is the complete graph. -/
def completeOn {W V : Type} (g : W → V) : SimpleGraph V :=
  SimpleGraph.fromRel fun a b => a ∈ Set.range g ∧ b ∈ Set.range g

theorem completeOn_adj {W V : Type} (g : W → V) (a b : V) :
    (completeOn g).Adj a b ↔ a ≠ b ∧ a ∈ Set.range g ∧ b ∈ Set.range g := by
  rw [completeOn, SimpleGraph.fromRel_adj]
  tauto

section Pull

variable {W V : Type} (g : W → V) (r : V → W) (hr : Function.LeftInverse r g)

include hr in
theorem map_map_of_mem_edgeSet {s : Sym2 V} (hs : s ∈ (completeOn g).edgeSet) :
    Sym2.map g (Sym2.map r s) = s := by
  induction s using Sym2.ind with
  | _ a b =>
    obtain ⟨-, ⟨a', rfl⟩, ⟨b', rfl⟩⟩ := (completeOn_adj g a b).1 hs
    show s(g (r (g a')), g (r (g b'))) = s(g a', g b')
    rw [hr a', hr b']

include hr in
theorem edgeMap_completeOn_injective : Function.Injective (edgeMap (completeOn g) r) := by
  intro i j hij
  refine Subtype.ext ?_
  rw [← map_map_of_mem_edgeSet g r hr i.2, ← map_map_of_mem_edgeSet g r hr j.2]
  exact congrArg (Sym2.map g) hij

include hr in
/-- A set `ω` of pairs of `W`, read as a configuration of the complete graph on the image of `g`: `g x` and `g y` are
joined in it exactly when `x` and `y` are joined in `SimpleGraph.fromEdgeSet ω`. The diagonal pairs of `ω` play no
part on either side. -/
theorem joined_pull_iff (ω : Set (Sym2 W)) (x y : W) :
    Joined (completeOn g) (pull (edgeMap (completeOn g) r) ω) (g x) (g y) ↔
      (SimpleGraph.fromEdgeSet ω).Reachable x y := by
  rw [SimpleGraph.reachable_iff_reflTransGen, joined_iff_reflTransGen]
  have h1 : ∀ u v : W, (SimpleGraph.fromEdgeSet ω).Adj u v →
      OpenStep (completeOn g) (pull (edgeMap (completeOn g) r) ω) (g u) (g v) := by
    intro u v huv
    rw [SimpleGraph.fromEdgeSet_adj] at huv
    have hE : s(g u, g v) ∈ (completeOn g).edgeSet :=
      (completeOn_adj g (g u) (g v)).2 ⟨fun h => huv.2 (hr.injective h), ⟨u, rfl⟩, ⟨v, rfl⟩⟩
    refine ⟨hE, ?_⟩
    show bit (s(r (g u), r (g v)) ∈ ω) = true
    rw [bit_eq_true, hr u, hr v]
    exact huv.1
  have h2 : ∀ a b : V, OpenStep (completeOn g) (pull (edgeMap (completeOn g) r) ω) a b →
      (SimpleGraph.fromEdgeSet ω).Adj (r a) (r b) := by
    rintro a b ⟨hE, hω⟩
    have hω' : s(r a, r b) ∈ ω := bit_eq_true.1 hω
    obtain ⟨hne, ⟨a', rfl⟩, ⟨b', rfl⟩⟩ := (completeOn_adj g a b).1 hE
    rw [SimpleGraph.fromEdgeSet_adj]
    refine ⟨hω', ?_⟩
    rw [hr a', hr b']
    exact fun h => hne (congrArg g h)
  constructor
  · intro h
    have h' : Relation.ReflTransGen (SimpleGraph.fromEdgeSet ω).Adj (r (g x)) (r (g y)) :=
      Relation.ReflTransGen.lift r h2 _ _ h
    rwa [hr x, hr y] at h'
  · intro h
    exact Relation.ReflTransGen.lift g h1 _ _ h

include hr in
/-- The lab's probability of `{x ↔ y}` under the weights `w` is our probability of `{g x ↔ g y}` in the complete
graph on the image of `g`, with the probabilities `w` on its edges. -/
theorem real_conn_eq_prob [Countable V] (w : Sym2 W → unitInterval) (x y : W) :
    (setLaw w).real (conn x y) =
      prob (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) (connEvent (completeOn g) (g x) (g y)) := by
  have hmap : (setLaw w).map (pull (edgeMap (completeOn g) r)) =
      percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) :=
    map_pull (edgeMap_completeOn_injective g r hr) w
  have hpre : pull (edgeMap (completeOn g) r) ⁻¹' connEvent (completeOn g) (g x) (g y) = conn x y := by
    ext ω
    exact joined_pull_iff g r hr ω x y
  show ((setLaw w) (conn x y)).toReal =
    ((percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)))
      (connEvent (completeOn g) (g x) (g y))).toReal
  rw [← hmap, Measure.map_apply (measurable_pull _) (measurableSet_connEvent _ _ _), hpre]

include hr in
/-- The same for the event `{x ↔ A}`. -/
theorem real_connSet_eq_prob [Countable V] (w : Sym2 W → unitInterval) (x : W) (A : Set W) :
    (setLaw w).real (⋃ a ∈ A, conn x a) =
      prob (completeOn g) (fun i => w (edgeMap (completeOn g) r i))
        (connSetEvent (completeOn g) (g x) (g '' A)) := by
  have hmap : (setLaw w).map (pull (edgeMap (completeOn g) r)) =
      percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) :=
    map_pull (edgeMap_completeOn_injective g r hr) w
  have hpre : pull (edgeMap (completeOn g) r) ⁻¹' connSetEvent (completeOn g) (g x) (g '' A) =
      ⋃ a ∈ A, conn x a := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion, exists_prop]
    constructor
    · rintro ⟨_, ⟨a, ha, rfl⟩, h⟩
      exact ⟨a, ha, (joined_pull_iff g r hr ω x a).1 h⟩
    · rintro ⟨a, ha, h⟩
      exact ⟨g a, ⟨a, ha, rfl⟩, (joined_pull_iff g r hr ω x a).2 h⟩
  show ((setLaw w) (⋃ a ∈ A, conn x a)).toReal =
    ((percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)))
      (connSetEvent (completeOn g) (g x) (g '' A))).toReal
  rw [← hmap, Measure.map_apply (measurable_pull _) (measurableSet_connSetEvent _ _ _), hpre]

end Pull

/-- On a countable vertex type the lab's event `{x ↔ y}` is measurable (it is the preimage of ours). -/
theorem measurableSet_conn {W : Type} [Countable W] (x y : W) : MeasurableSet (conn x y) := by
  have hpre : pull (edgeMap (completeOn (id : W → W)) id) ⁻¹' connEvent (completeOn id) x y = conn x y := by
    ext ω
    exact joined_pull_iff id id (fun _ => rfl) ω x y
  rw [← hpre]
  exact measurable_pull _ (measurableSet_connEvent _ _ _)

/-- Our probability of `{x ↔ y}` in `(G, p)` is the lab's probability of `{e x ↔ e y}` under the weights
`weightOf G p e`. -/
theorem prob_connEvent_eq_real {V W : Type} [Countable W] (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V ≃ W) (x y : V) :
    prob G p (connEvent G x y) = (setLaw (weightOf G p e)).real (conn (e x) (e y)) := by
  have hf := edgeMap_injective G e.injective
  have hmap : (percolationMeasure G p).map (push (edgeMap G e)) = setLaw (weightOf G p e) :=
    map_push hf p _ (weightOf_apply G p e.injective) (weightOf_of_notMem_range G p e)
  show ((percolationMeasure G p) (connEvent G x y)).toReal =
    ((setLaw (weightOf G p e)) (conn (e x) (e y))).toReal
  rw [← hmap, Measure.map_apply (measurable_push hf) (measurableSet_conn _ _), push_preimage_conn]

/-- The same for the event `{o ↔ A}`, with `A'` the finset of the images of `A`. -/
theorem prob_connSetEvent_eq_real {V W : Type} [Countable W] (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V ≃ W) (A : Set V) (A' : Finset W) (hA : ∀ a, e a ∈ A' ↔ a ∈ A)
    (o : V) :
    prob G p (connSetEvent G o A) = (setLaw (weightOf G p e)).real (⋃ a ∈ A', conn (e o) a) := by
  have hf := edgeMap_injective G e.injective
  have hmap : (percolationMeasure G p).map (push (edgeMap G e)) = setLaw (weightOf G p e) :=
    map_push hf p _ (weightOf_apply G p e.injective) (weightOf_of_notMem_range G p e)
  have hpre : push (edgeMap G e) ⁻¹' (⋃ a ∈ A', conn (e o) a) = connSetEvent G o A := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion, exists_prop]
    constructor
    · rintro ⟨a', ha', h⟩
      refine ⟨e.symm a', (hA _).1 (by rwa [e.apply_symm_apply]), ?_⟩
      rw [← e.apply_symm_apply a'] at h
      exact (push_mem_conn G e ω o (e.symm a')).1 h
    · rintro ⟨a, ha, h⟩
      exact ⟨e a, (hA a).2 ha, (push_mem_conn G e ω o a).2 h⟩
  show ((percolationMeasure G p) (connSetEvent G o A)).toReal =
    ((setLaw (weightOf G p e)) (⋃ a ∈ A', conn (e o) a)).toReal
  rw [← hmap, Measure.map_apply (measurable_push hf)
    (Finset.measurableSet_biUnion _ fun a _ => measurableSet_conn _ _), hpre]

/-! ## 5. The implications between the lab's form and R0, N3 -/

/-- **Lab → R0.** Relabel the finite vertex type by `Fin n`, give weight `0` to every pair that is not an edge. -/
theorem conjecture3_of_labForm (h : LabForm) : Conjecture3 := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro V _ G p A o b h₁ h₂
  classical
  obtain ⟨n, ⟨e⟩⟩ := Finite.exists_equiv_fin V
  have hA : ∀ a, e a ∈ (Finset.univ.filter fun i => e.symm i ∈ A) ↔ a ∈ A := fun a => by simp
  rw [prob_connEvent_eq_real G p e o b]
  refine H n (weightOf G p e) (Finset.univ.filter fun i => e.symm i ∈ A) (e o) (e b) ?_ ?_
  · rw [← prob_connSetEvent_eq_real G p e A _ hA o]
    exact h₁
  · intro a ha
    have ha' : e.symm a ∈ A := (hA (e.symm a)).1 (by rwa [e.apply_symm_apply])
    have h₃ := h₂ (e.symm a) ha'
    rw [prob_connEvent_eq_real G p e (e.symm a) b, e.apply_symm_apply] at h₃
    exact h₃

/-- **R0 → Lab.** The complete graph on `Fin n` with the probabilities `w` on its edges; the diagonal weights of
`w` are dropped (they change no connection). -/
theorem labForm_of_conjecture3 (h : Conjecture3) : LabForm := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro n w A o b h₁ h₂
  have hr : Function.LeftInverse (id : Fin n → Fin n) id := fun _ => rfl
  refine lt_of_lt_of_eq ?_ (real_conn_eq_prob id id hr w o b).symm
  refine H (Fin n) (completeOn id) _ (id '' (↑A : Set (Fin n))) o b ?_ ?_
  · exact lt_of_lt_of_eq h₁ (real_connSet_eq_prob id id hr w o ↑A)
  · rintro _ ⟨a, ha, rfl⟩
    exact lt_of_lt_of_eq (h₂ a ha) (real_conn_eq_prob id id hr w a b)

/-- **N3 → Lab.** One more vertex, isolated: the vertex type `Option (Fin n)`, the complete graph on the `some`
vertices. The image of `A` is then a proper subset, whatever `A` is. -/
theorem labForm_of_neighbour3 (h : Neighbour3_properSubset) : LabForm := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro n w A o b h₁ h₂
  have hr : Function.LeftInverse (fun v : Option (Fin n) => v.getD o) some := fun _ => rfl
  refine lt_of_lt_of_eq ?_ (real_conn_eq_prob some _ hr w o b).symm
  refine H (Option (Fin n)) (completeOn some) _ (some '' (↑A : Set (Fin n))) (some o) (some b) ?_ ?_ ?_
  · intro hA
    have hnone : (none : Option (Fin n)) ∈ some '' (↑A : Set (Fin n)) := hA ▸ Set.mem_univ _
    obtain ⟨a, -, ha⟩ := hnone
    exact Option.some_ne_none a ha
  · exact lt_of_lt_of_eq h₁ (real_connSet_eq_prob some _ hr w o ↑A)
  · rintro _ ⟨a, ha, rfl⟩
    exact lt_of_lt_of_eq (h₂ a ha) (real_conn_eq_prob some _ hr w a b)

/-- **Lab ↔ R0.** -/
theorem labForm_iff_conjecture3 : LabForm ↔ Conjecture3 :=
  ⟨conjecture3_of_labForm, labForm_of_conjecture3⟩

end KN3Transport
/-!
# Exhaustion.lean — R0 → RB: from finite graphs to countable graphs

A FRAGMENT (Mathlib + the sealed files + `Transport.lean`; nothing of the lab): compiled appended to
`… ++ Transport.lean`, or on the pod as the module `KN3.Exhaustion` behind `import KN3.Transport`.

`readingB_of_conjecture3 : Conjecture3 → Conjecture3_readingB`, with the SAME δ. This is not an encoding change:
it is the exhaustion argument that `READING.md` (A1) calls "a proof, not a reading". It uses σ-additivity
(continuity of a measure along a countable directed union) and the monotonicity of connection events in the
vertex set; it uses nothing about gluing.

For a countable graph `G`, edge probabilities `p`, a set `A` and vertices `o`, `b` with `P(o ↔ A) > 1 − δ` and
`P(a ↔ b) > 1 − δ` for all `a ∈ A`:

1. `{o ↔ A} = ⋃_B {o ↔ A ∩ B}` over the finite sets `B`: some finite `B` has `P(o ↔ A ∩ B) > 1 − δ`;
2. `{x ↔ y} = ⋃_S {x ↔ y by a path inside S}` over the finite vertex sets `S`: some `S₀` has
   `P(o ↔ A ∩ B inside S₀) > 1 − δ`, and each of the finitely many `a ∈ A ∩ B` has an `S_a` with
   `P(a ↔ b inside S_a) > 1 − δ` (the strict inequalities are what lets the same δ survive);
3. on `T := S₀ ∪ B ∪ {o, b} ∪ ⋃_{a ∈ B} S_a`, "joined inside `T`" is "joined in the induced graph on `T`", whose
   law is the restriction of the configuration (a sub-family of the independent coins): the finite statement
   applies and gives `P(o ↔ b inside T) > 1 − ε`;
4. `{o ↔ b inside T} ⊆ {o ↔ b}`.
-/

namespace KN3Exhaustion

open MeasureTheory KN3Printed

/-- Continuity from below along a countable directed family, in the form used here. -/
theorem exists_lt_of_lt_iUnion {Ω ι : Type*} [MeasurableSpace Ω] (μ : Measure Ω) [IsFiniteMeasure μ]
    [Countable ι] [Nonempty ι] (s : ι → Set Ω) (hd : Directed (· ⊆ ·) s) {c : ℝ}
    (h : c < (μ (⋃ i, s i)).toReal) : ∃ i, c < (μ (s i)).toReal := by
  rcases lt_or_ge c 0 with hc | hc
  · exact ⟨Classical.arbitrary ι, lt_of_lt_of_le hc ENNReal.toReal_nonneg⟩
  · have h' : ENNReal.ofReal c < μ (⋃ i, s i) :=
      (ENNReal.ofReal_lt_iff_lt_toReal hc (measure_ne_top _ _)).2 h
    rw [hd.measure_iUnion] at h'
    obtain ⟨i, hi⟩ := lt_iSup_iff.1 h'
    exact ⟨i, (ENNReal.ofReal_lt_iff_lt_toReal hc (measure_ne_top _ _)).1 hi⟩

section Induced

variable {V : Type} (G : SimpleGraph V)

/-- The graph induced by `G` on the finite vertex set `S`. -/
abbrev sub (S : Finset V) : SimpleGraph S := SimpleGraph.comap (Subtype.val : S → V) G

theorem map_val_mem_edgeSet {S : Finset V} {s : Sym2 S} (hs : s ∈ (sub G S).edgeSet) :
    Sym2.map Subtype.val s ∈ G.edgeSet := by
  induction s using Sym2.ind with
  | _ a b => exact hs

/-- An edge of the induced graph, as an edge of `G`. -/
def edgeIncl (S : Finset V) : (sub G S).edgeSet → G.edgeSet :=
  fun i => ⟨Sym2.map Subtype.val i.1, map_val_mem_edgeSet G i.2⟩

theorem edgeIncl_injective (S : Finset V) : Function.Injective (edgeIncl G S) :=
  fun _ _ h => Subtype.ext (Sym2.map.injective Subtype.val_injective (congrArg Subtype.val h))

/-- A configuration of `G`, restricted to the edges of the induced graph. -/
def restrict (S : Finset V) (ω : Config G) : Config (sub G S) := fun i => ω (edgeIncl G S i)

theorem measurable_restrict (S : Finset V) : Measurable (restrict G S) :=
  measurable_pi_lambda _ fun _ => measurable_pi_apply _

/-- The restriction of the percolation measure of `G` is the percolation measure of the induced graph. -/
theorem map_restrict (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) :
    (percolationMeasure G p).map (restrict G S) = percolationMeasure (sub G S) (fun i => p (edgeIncl G S i)) :=
  KN3Transport.infinitePi_map_comp_injective (fun e => coin (p e)) (edgeIncl G S) (edgeIncl_injective G S)

/-- `v` and `w` are joined by an open path of `G` all of whose vertices lie in `S`. -/
def JoinedIn (ω : Config G) (S : Finset V) (v w : V) : Prop :=
  ∃ (n : ℕ) (x : Fin (n + 1) → V), x 0 = v ∧ x (Fin.last n) = w ∧ (∀ i, x i ∈ S) ∧
    ∀ i : Fin n, ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet, ω ⟨s(x i.castSucc, x i.succ), h⟩ = true

theorem JoinedIn.joined {ω : Config G} {S : Finset V} {v w : V} (h : JoinedIn G ω S v w) : Joined G ω v w := by
  obtain ⟨n, x, h0, hl, -, hx⟩ := h
  exact ⟨n, x, h0, hl, hx⟩

theorem JoinedIn.mono {ω : Config G} {S T : Finset V} (hST : S ⊆ T) {v w : V} (h : JoinedIn G ω S v w) :
    JoinedIn G ω T v w := by
  obtain ⟨n, x, h0, hl, hS, hx⟩ := h
  exact ⟨n, x, h0, hl, fun i => hST (hS i), hx⟩

theorem JoinedIn.right_mem {ω : Config G} {S : Finset V} {v w : V} (h : JoinedIn G ω S v w) : w ∈ S := by
  obtain ⟨n, x, -, hl, hS, -⟩ := h
  exact hl ▸ hS (Fin.last n)

theorem joined_iff_exists_joinedIn (ω : Config G) (v w : V) :
    Joined G ω v w ↔ ∃ S : Finset V, JoinedIn G ω S v w := by
  classical
  constructor
  · rintro ⟨n, x, h0, hl, hx⟩
    exact ⟨Finset.univ.image x, n, x, h0, hl, fun i => Finset.mem_image_of_mem x (Finset.mem_univ i), hx⟩
  · rintro ⟨S, h⟩
    exact h.joined

/-- Inside `S`, "joined by a path inside `S`" is "joined in the induced graph, in the restricted configuration". -/
theorem joinedIn_iff (ω : Config G) (S : Finset V) {v w : V} (hv : v ∈ S) (hw : w ∈ S) :
    JoinedIn G ω S v w ↔ Joined (sub G S) (restrict G S ω) ⟨v, hv⟩ ⟨w, hw⟩ := by
  constructor
  · rintro ⟨n, x, h0, hl, hS, hx⟩
    refine ⟨n, fun i => ⟨x i, hS i⟩, Subtype.ext h0, Subtype.ext hl, fun i => ?_⟩
    obtain ⟨h, hω⟩ := hx i
    exact ⟨h, hω⟩
  · rintro ⟨n, x, h0, hl, hx⟩
    refine ⟨n, fun i => (x i).1, congrArg Subtype.val h0, congrArg Subtype.val hl, fun i => (x i).2, fun i => ?_⟩
    obtain ⟨h, hω⟩ := hx i
    exact ⟨h, hω⟩

/-- The event "`v ↔ w` inside `S`". -/
def connIn (S : Finset V) (v w : V) : Set (Config G) := {ω | JoinedIn G ω S v w}

/-- The event "`v ↔ A` inside `S`". -/
def connSetIn (S : Finset V) (v : V) (A : Set V) : Set (Config G) := {ω | ∃ a ∈ A, JoinedIn G ω S v a}

theorem connEvent_eq_iUnion (v w : V) : connEvent G v w = ⋃ S : Finset V, connIn G S v w := by
  ext ω
  simp only [connEvent, connIn, Set.mem_setOf_eq, Set.mem_iUnion]
  exact joined_iff_exists_joinedIn G ω v w

theorem connSetEvent_eq_iUnion (v : V) (A : Set V) :
    connSetEvent G v A = ⋃ S : Finset V, connSetIn G S v A := by
  ext ω
  simp only [connSetEvent, connSetIn, Set.mem_setOf_eq, Set.mem_iUnion]
  constructor
  · rintro ⟨a, ha, h⟩
    obtain ⟨S, hS⟩ := (joined_iff_exists_joinedIn G ω v a).1 h
    exact ⟨S, a, ha, hS⟩
  · rintro ⟨S, a, ha, h⟩
    exact ⟨a, ha, h.joined⟩

theorem connIn_mono {S T : Finset V} (hST : S ⊆ T) (v w : V) : connIn G S v w ⊆ connIn G T v w :=
  fun _ h => JoinedIn.mono G hST h

theorem connSetIn_mono {S T : Finset V} (hST : S ⊆ T) (v : V) (A : Set V) :
    connSetIn G S v A ⊆ connSetIn G T v A :=
  fun _ ⟨a, ha, h⟩ => ⟨a, ha, JoinedIn.mono G hST h⟩

theorem connIn_subset (S : Finset V) (v w : V) : connIn G S v w ⊆ connEvent G v w :=
  fun _ h => JoinedIn.joined G h

theorem directed_connIn (v w : V) : Directed (· ⊆ ·) (fun S : Finset V => connIn G S v w) := by
  classical
  exact directed_of_isDirected_le fun S T hST => connIn_mono G hST v w

theorem directed_connSetIn (v : V) (A : Set V) :
    Directed (· ⊆ ·) (fun S : Finset V => connSetIn G S v A) := by
  classical
  exact directed_of_isDirected_le fun S T hST => connSetIn_mono G hST v A

/-- The probability of "`v ↔ w` inside `S`" is the probability of `v ↔ w` in the induced graph. -/
theorem prob_connIn (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) {v w : V} (hv : v ∈ S) (hw : w ∈ S) :
    prob G p (connIn G S v w) =
      prob (sub G S) (fun i => p (edgeIncl G S i)) (connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩) := by
  have hpre : restrict G S ⁻¹' connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩ = connIn G S v w := by
    ext ω
    exact (joinedIn_iff G ω S hv hw).symm
  show ((percolationMeasure G p) (connIn G S v w)).toReal =
    ((percolationMeasure (sub G S) (fun i => p (edgeIncl G S i))) (connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩)).toReal
  rw [← map_restrict, Measure.map_apply (measurable_restrict G S) (measurableSet_connEvent _ _ _), hpre]

/-- The same for "`v ↔ A` inside `S`". -/
theorem prob_connSetIn (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) {v : V} (hv : v ∈ S) (A : Set V) :
    prob G p (connSetIn G S v A) =
      prob (sub G S) (fun i => p (edgeIncl G S i))
        (connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A)) := by
  have hpre : restrict G S ⁻¹' connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A) = connSetIn G S v A := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, connSetIn, Set.mem_setOf_eq]
    constructor
    · rintro ⟨a, ha, h⟩
      exact ⟨a.1, ha, (joinedIn_iff G ω S hv a.2).2 h⟩
    · rintro ⟨a, ha, h⟩
      exact ⟨⟨a, JoinedIn.right_mem G h⟩, ha, (joinedIn_iff G ω S hv (JoinedIn.right_mem G h)).1 h⟩
  show ((percolationMeasure G p) (connSetIn G S v A)).toReal =
    ((percolationMeasure (sub G S) (fun i => p (edgeIncl G S i)))
      (connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A))).toReal
  rw [← map_restrict, Measure.map_apply (measurable_restrict G S) (measurableSet_connSetEvent _ _ _), hpre]

end Induced

/-- **R0 → RB.** The finite-graph statement implies the countable-graph statement, with the same δ. -/
theorem readingB_of_conjecture3 (h : Conjecture3) : Conjecture3_readingB := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro V _ G p A o b h₁ h₂
  classical
  -- 1. a finite part of A is enough
  have hU1 : connSetEvent G o A = ⋃ B : Finset V, connSetEvent G o (A ∩ ↑B) := by
    ext ω
    simp only [connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion]
    constructor
    · rintro ⟨a, ha, hj⟩
      exact ⟨{a}, a, ⟨ha, by simp⟩, hj⟩
    · rintro ⟨B, a, ha, hj⟩
      exact ⟨a, ha.1, hj⟩
  have hd1 : Directed (· ⊆ ·) (fun B : Finset V => connSetEvent G o (A ∩ ↑B)) :=
    directed_of_isDirected_le fun B B' hBB' _ ⟨a, ha, hj⟩ =>
      ⟨a, ⟨ha.1, Finset.coe_subset.2 hBB' ha.2⟩, hj⟩
  obtain ⟨B, hB⟩ : ∃ B : Finset V, 1 - δ < prob G p (connSetEvent G o (A ∩ ↑B)) := by
    have h₁' : 1 - δ < prob G p (connSetEvent G o A) := h₁
    rw [hU1] at h₁'
    exact exists_lt_of_lt_iUnion (percolationMeasure G p) _ hd1 h₁'
  -- 2. finite vertex sets are enough, for o ↔ A ∩ B and for each a ↔ b
  obtain ⟨S₀, hS₀⟩ : ∃ S : Finset V, 1 - δ < prob G p (connSetIn G S o (A ∩ ↑B)) := by
    rw [connSetEvent_eq_iUnion] at hB
    exact exists_lt_of_lt_iUnion (percolationMeasure G p) _ (directed_connSetIn G o _) hB
  have hS2 : ∀ a : V, ∃ S : Finset V, a ∈ A → 1 - δ < prob G p (connIn G S a b) := by
    intro a
    by_cases ha : a ∈ A
    · have h₂' : 1 - δ < prob G p (connEvent G a b) := h₂ a ha
      rw [connEvent_eq_iUnion] at h₂'
      obtain ⟨S, hS⟩ := exists_lt_of_lt_iUnion (percolationMeasure G p) _ (directed_connIn G a b) h₂'
      exact ⟨S, fun _ => hS⟩
    · exact ⟨∅, fun ha' => (ha ha').elim⟩
  choose Sf hSf using hS2
  -- 3. one finite vertex set for all of them
  let T : Finset V := S₀ ∪ B ∪ {o, b} ∪ B.biUnion Sf
  have hS₀T : S₀ ⊆ T := fun x hx => by simp [T, hx]
  have hoT : o ∈ T := by simp [T]
  have hbT : b ∈ T := by simp [T]
  have hSfT : ∀ a ∈ B, Sf a ⊆ T := fun a ha x hx => by
    have : x ∈ B.biUnion Sf := Finset.mem_biUnion.2 ⟨a, ha, hx⟩
    simp [T, this]
  have key := H (↥T) (sub G T) (fun i => p (edgeIncl G T i)) (Subtype.val ⁻¹' (A ∩ ↑B)) ⟨o, hoT⟩ ⟨b, hbT⟩
    (by
      rw [← prob_connSetIn G p T hoT (A ∩ ↑B)]
      exact lt_of_lt_of_le hS₀ (prob_mono G p (connSetIn_mono G hS₀T o _)))
    (by
      rintro ⟨a, haT⟩ ⟨haA, haB⟩
      rw [← prob_connIn G p T haT hbT]
      exact lt_of_lt_of_le (hSf a haA) (prob_mono G p (connIn_mono G (hSfT a haB) a b)))
  -- 4. back up
  rw [← prob_connIn G p T hoT hbT] at key
  exact lt_of_lt_of_le key (prob_mono G p (connIn_subset G T o b))

end KN3Exhaustion
