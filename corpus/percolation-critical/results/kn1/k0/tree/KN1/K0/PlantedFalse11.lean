import KN1.K0.Basic

/-!
# KN1.K0.PlantedFalse11 — planted variant 11 proved FALSE (the instance needs a fractional probability)

Mathlib only; statement from the SEALED `Planted1.lean` (no repaired copy). Instance of OBLIGATIONS1.md 2.11, in
its second form: the path 0 — 1 — 2 on `Fin 3`, both edges open with probability 1/2, A = {1}, m = P(1 ↔ 2).
Proved here: P(0 ↔ 1) ≥ 1/2, P(1 ↔ 2) ≥ 1/2 and P(0 ↔ 2) ≤ 1/4 (the exact values 1/2, 1/2, 1/4 are not needed for
the refutation and are not proved).
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- The probability that the edges of a finite set `S` are all open is the product of their probabilities. -/
theorem prob_allOpen {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset G.edgeSet) :
    prob G p {ω : Config G | ∀ e ∈ S, ω e = true} = ∏ e ∈ S, (p e : ℝ) := by
  have hset : {ω : Config G | ∀ e ∈ S, ω e = true} = Set.pi (S : Set G.edgeSet) (fun _ => {true}) := by
    ext ω; simp
  rw [hset]
  unfold prob percolationMeasure
  rw [MeasureTheory.Measure.infinitePi_pi _ (fun _ _ => measurableSet_singleton _), ENNReal.toReal_prod]
  refine Finset.prod_congr rfl fun e _ => ?_
  rw [coin_singleton]
  simp [ENNReal.toReal_ofReal (p e).2.1]

/-- Two neighbours are joined with probability at least the probability of their edge. -/
theorem le_prob_connEvent_of_adj {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) {v w : V}
    (hvw : s(v, w) ∈ G.edgeSet) : (p ⟨s(v, w), hvw⟩ : ℝ) ≤ prob G p (connEvent G v w) := by
  have hsub : {ω : Config G | ∀ e ∈ ({⟨s(v, w), hvw⟩} : Finset G.edgeSet), ω e = true} ⊆ connEvent G v w := by
    intro ω hω
    exact (joined_iff_reflTransGen G ω v w).mpr
      (Relation.ReflTransGen.single ⟨hvw, hω _ (Finset.mem_singleton_self _)⟩)
  have h := prob_mono G p hsub
  rwa [prob_allOpen, Finset.prod_singleton] at h

/-- A set of vertices that no open edge leaves contains everything joined to one of its points. -/
theorem joined_mem_of_closed {V : Type} (G : SimpleGraph V) (ω : Config G) (S : Set V)
    (hS : ∀ x ∈ S, ∀ y, (∃ h : s(x, y) ∈ G.edgeSet, ω ⟨s(x, y), h⟩ = true) → y ∈ S)
    {v w : V} (hv : v ∈ S) (h : Joined G ω v w) : w ∈ S := by
  rw [joined_iff_reflTransGen] at h
  induction h with
  | refl => exact hv
  | tail _ hstep ih => exact hS _ ih _ hstep

/-- The path 0 — 1 — 2. -/
def path3 : SimpleGraph (Fin 3) := SimpleGraph.fromRel fun x y => x.val + 1 = y.val

theorem path3_adj (x y : Fin 3) : path3.Adj x y ↔ (x.val + 1 = y.val ∨ y.val + 1 = x.val) := by
  simp only [path3, SimpleGraph.fromRel_adj]
  constructor
  · exact fun h => h.2
  · intro h
    refine ⟨?_, h⟩
    rintro rfl
    omega

theorem path3_mem {x y : Fin 3} (h : x.val + 1 = y.val ∨ y.val + 1 = x.val) : s(x, y) ∈ path3.edgeSet := by
  rw [SimpleGraph.mem_edgeSet]
  exact (path3_adj x y).mpr h

theorem path3_of_mem {x y : Fin 3} (h : s(x, y) ∈ path3.edgeSet) : x.val + 1 = y.val ∨ y.val + 1 = x.val := by
  rw [SimpleGraph.mem_edgeSet] at h
  exact (path3_adj x y).mp h

theorem path3_from0 : ∀ y : Fin 3, ((0 : Fin 3).val + 1 = y.val ∨ y.val + 1 = (0 : Fin 3).val) → y = 1 := by
  decide

theorem path3_to2 : ∀ x y : Fin 3, (x.val + 1 = y.val ∨ y.val + 1 = x.val) → (x = 0 ∨ x = 1) → y ≠ 0 → y ≠ 1 →
    x = 1 ∧ y = 2 := by
  decide

/-- The edge probability 1/2. -/
noncomputable def half : Set.Icc (0 : ℝ) 1 := ⟨1 / 2, by constructor <;> norm_num⟩

/-- 2.11 — the path 0 — 1 — 2, both edges 1/2, A = {1}, m = P(1 ↔ 2):
P(0 ↔ 2) ≤ 1/4 < 1/2 ≤ min (P(0 ↔ 1)) (P(1 ↔ 2)). -/
theorem planted11_false : ¬ Planted11_minOfTheTwoFactors := by
  intro h
  have h01 : s((0 : Fin 3), (1 : Fin 3)) ∈ path3.edgeSet := path3_mem (Or.inl rfl)
  have h12 : s((1 : Fin 3), (2 : Fin 3)) ∈ path3.edgeSet := path3_mem (Or.inl rfl)
  have l01 : (1 / 2 : ℝ) ≤ prob path3 (fun _ => half) (connEvent path3 0 1) :=
    le_prob_connEvent_of_adj path3 (fun _ => half) h01
  have l12 : (1 / 2 : ℝ) ≤ prob path3 (fun _ => half) (connEvent path3 1 2) :=
    le_prob_connEvent_of_adj path3 (fun _ => half) h12
  have hne : (⟨s(0, 1), h01⟩ : path3.edgeSet) ≠ ⟨s(1, 2), h12⟩ := by
    intro he
    have h' : s((0 : Fin 3), (1 : Fin 3)) = s(1, 2) := congrArg Subtype.val he
    exact absurd (Sym2.eq_iff.mp h') (by decide)
  have hsub : connEvent path3 0 2 ⊆
      {ω : Config path3 | ∀ e ∈ ({⟨s(0, 1), h01⟩, ⟨s(1, 2), h12⟩} : Finset path3.edgeSet), ω e = true} := by
    intro ω hω e he
    by_contra hclosed
    rw [Finset.mem_insert, Finset.mem_singleton] at he
    rcases he with rfl | rfl
    · -- the edge {0, 1} is closed: nothing leaves {0}
      have h2 : (2 : Fin 3) ∈ ({0} : Set (Fin 3)) := by
        refine joined_mem_of_closed path3 ω {0} ?_ (Set.mem_singleton 0) hω
        rintro x hx y ⟨hE, hopen⟩
        rw [Set.mem_singleton_iff] at hx
        subst hx
        have hy : y = 1 := path3_from0 y (path3_of_mem hE)
        subst hy
        exact absurd hopen hclosed
      have h20 : (2 : Fin 3) = 0 := h2
      exact absurd h20 (by decide)
    · -- the edge {1, 2} is closed: nothing leaves {0, 1}
      have h2 : (2 : Fin 3) ∈ ({0, 1} : Set (Fin 3)) := by
        refine joined_mem_of_closed path3 ω {0, 1} ?_ (Or.inl rfl) hω
        rintro x hx y ⟨hE, hopen⟩
        have hx' : x = 0 ∨ x = 1 := hx
        by_cases hy0 : y = 0
        · exact Or.inl hy0
        by_cases hy1 : y = 1
        · exact Or.inr hy1
        obtain ⟨hx1, hy2⟩ := path3_to2 x y (path3_of_mem hE) hx' hy0 hy1
        subst hx1
        subst hy2
        exact absurd hopen hclosed
      have h201 : (2 : Fin 3) = 0 ∨ (2 : Fin 3) = 1 := h2
      exact absurd h201 (by decide)
  have u02 : prob path3 (fun _ => half) (connEvent path3 0 2) ≤ 1 / 2 * (1 / 2) := by
    have hm := prob_mono path3 (fun _ => half) hsub
    rw [prob_allOpen, Finset.prod_pair hne] at hm
    exact hm
  have key := h (Fin 3) path3 (fun _ => half) {1} 0 2 (prob path3 (fun _ => half) (connEvent path3 1 2))
    ⟨1, Set.mem_singleton 1, rfl⟩ (fun a ha => le_of_eq (by rw [Set.mem_singleton_iff.mp ha]))
  rw [connSetEvent_singleton] at key
  have hmin := le_min l01 l12
  linarith

end KN1K0
