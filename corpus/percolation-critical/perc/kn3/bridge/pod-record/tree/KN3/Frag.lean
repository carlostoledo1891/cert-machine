import Mathlib
import Printed

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
