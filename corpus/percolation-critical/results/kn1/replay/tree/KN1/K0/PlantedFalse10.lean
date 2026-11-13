import KN1.K0.Basic

/-!
# KN1.K0.PlantedFalse10 — planted variant 10 proved FALSE (the instance needs an edge)

Mathlib only; statement from the SEALED `Planted1.lean` (no repaired copy). Instance of OBLIGATIONS1.md 2.10:
V = Bool, G = ⊤ (one edge), edge probability 1, A = Finset.univ, o = b = false, m = 1.
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- If every edge is open with probability 1, two neighbours are joined with probability 1. -/
theorem prob_connEvent_of_adj_of_one {V : Type} [Finite V] (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (hp : ∀ e, (p e : ℝ) = 1) {v w : V} (hvw : s(v, w) ∈ G.edgeSet) :
    prob G p (connEvent G v w) = 1 := by
  haveI : Fintype G.edgeSet := Fintype.ofFinite _
  have hsub : ({fun _ => true} : Set (Config G)) ⊆ connEvent G v w := by
    intro ω hω
    rw [Set.mem_singleton_iff] at hω
    subst hω
    exact (joined_iff_reflTransGen G (fun _ => true) v w).mpr (Relation.ReflTransGen.single ⟨hvw, rfl⟩)
  have h1 : percolationMeasure G p {fun _ => true} = 1 := by
    rw [percolationMeasure_singleton]
    simp [hp]
  have h2 : prob G p {fun _ => true} = 1 := by simp [prob, h1]
  have h3 := prob_mono G p hsub
  have h4 := prob_le_one G p (connEvent G v w)
  linarith

/-- 2.10 — V = Bool, G = ⊤, every edge probability 1, A = Finset.univ, o = b = false, m = 1:
the sum is 1 + 1 = 2 and 1 ≥ 2 · 1 fails. -/
theorem planted10_false : ¬ Planted10_sumInPlaceOfSetEvent := by
  intro h
  have hall : ∀ v w : Bool, prob (⊤ : SimpleGraph Bool) (fun _ => ⟨1, by simp⟩) (connEvent ⊤ v w) = 1 := by
    intro v w
    by_cases hvw : v = w
    · exact prob_connEvent_of_eq _ _ hvw
    · exact prob_connEvent_of_adj_of_one _ _ (fun _ => rfl) (by simpa using hvw)
  have key := h Bool ⊤ (fun _ => ⟨1, by simp⟩) Finset.univ false false 1
    ⟨false, Finset.mem_univ false, hall false false⟩
    (fun a _ => le_of_eq (hall a false).symm)
  rw [Fintype.sum_bool, hall false true, hall false false] at key
  linarith

end KN1K0
