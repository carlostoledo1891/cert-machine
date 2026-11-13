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
