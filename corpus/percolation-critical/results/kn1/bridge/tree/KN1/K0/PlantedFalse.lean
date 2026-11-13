import KN1.K0.Basic

/-!
# KN1.K0.PlantedFalse — planted variants 1–9 proved FALSE (red control KR0)

K0 of PREREG-KN1.md, step 2 (e). Mathlib only; statements from the SEALED `Planted1.lean` (no repaired copy).
Each proof uses the instance given in OBLIGATIONS1.md §2 (2.1–2.9): graphs with no edge on `Bool` or `Unit`.
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- 2.1 — V = Bool, G = ⊥, A = univ, o = false, b = true, m = 1: 0 ≥ 1 · 1 fails. -/
theorem planted1_false : ¬ Planted1_maxInPlaceOfMin := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) Set.univ false true 1
    ⟨true, Set.mem_univ true, prob_connEvent_of_eq _ _ rfl⟩
    (fun a _ => prob_le_one _ _ _)
  rw [KN3Planted.prob_connEvent_bot _ (show false ≠ true by decide),
    prob_connSetEvent_of_mem _ _ (Set.mem_univ false)] at key
  linarith

/-- 2.2 — the same instance, a = true: 0 ≥ 1 · 1 fails. -/
theorem planted2_false : ¬ Planted2_forAllAInPlaceOfMin := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) Set.univ false true true (Set.mem_univ true)
  rw [KN3Planted.prob_connEvent_bot _ (show false ≠ true by decide),
    prob_connSetEvent_of_mem _ _ (Set.mem_univ false),
    prob_connEvent_of_eq _ _ (rfl : true = true)] at key
  linarith

/-- 2.3 — V = Bool, G = ⊥, A = {true}, o = b = false, m = 0: 1 ≤ 0 · 0 fails. -/
theorem planted3_false : ¬ Planted3_inequalityReversed := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) {true} false false 0
    ⟨true, Set.mem_singleton true, KN3Planted.prob_connEvent_bot _ (show true ≠ false by decide)⟩
    (fun a _ => prob_nonneg _ _ _)
  rw [prob_connEvent_of_eq _ _ (rfl : false = false), mul_zero] at key
  linarith

/-- 2.4 — V = Unit, G = ⊥, A = {()}, o = b = (), m = 1: 1 > 1 · 1 fails. -/
theorem planted4_false : ¬ Planted4_strictInequality := by
  intro h
  have key := h Unit ⊥ (fun _ => ⟨0, by simp⟩) {()} () () 1
    ⟨(), Set.mem_singleton (), prob_connEvent_of_eq _ _ rfl⟩
    (fun a _ => le_of_eq (prob_connEvent_of_eq _ _ rfl).symm)
  rw [prob_connEvent_of_eq _ _ (rfl : () = ()),
    prob_connSetEvent_of_mem _ _ (Set.mem_singleton ())] at key
  linarith

/-- 2.5 — V = Bool, G = ⊥, A = Finset.univ, o = false, b = true: the sum is 1 + 0; 0 ≥ 1 · 1 fails. -/
theorem planted5_false : ¬ Planted5_sumInPlaceOfMin := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) Finset.univ false true
  rw [Fintype.sum_bool,
    KN3Planted.prob_connEvent_bot _ (show false ≠ true by decide),
    prob_connEvent_of_eq _ _ (rfl : true = true),
    prob_connSetEvent_of_mem _ _ (show false ∈ ((Finset.univ : Finset Bool) : Set Bool) by simp)] at key
  linarith

/-- 2.6 — V = Unit, G = ⊥, A = ∅: there is no witness. -/
theorem planted6_false : ¬ Planted6_existsWithoutNonempty := by
  intro h
  obtain ⟨a, ha, -⟩ := h Unit ⊥ (fun _ => ⟨0, by simp⟩) ∅ () ()
  exact Set.notMem_empty a ha

/-- 2.7 — V = Bool, G = ⊥, A = {true}, o = false, b = true, m = 1: 0 ≥ 1 fails. -/
theorem planted7_false : ¬ Planted7_factorDropped := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) {true} false true 1
    ⟨true, Set.mem_singleton true, prob_connEvent_of_eq _ _ rfl⟩
    (fun a ha => le_of_eq (prob_connEvent_of_eq _ _ (Set.mem_singleton_iff.mp ha)).symm)
  rw [KN3Planted.prob_connEvent_bot _ (show false ≠ true by decide)] at key
  linarith

/-- 2.8 — V = Bool, G = ⊥, A = {false}, o = false, b = true, m = 1 (= P(false ↔ false)): 0 ≥ 1 · 1 fails. -/
theorem planted8_false : ¬ Planted8_minOverWrongEvent := by
  intro h
  have key := h Bool ⊥ (fun _ => ⟨0, by simp⟩) {false} false true 1
    ⟨false, Set.mem_singleton false, prob_connEvent_of_eq _ _ rfl⟩
    (fun a ha => le_of_eq (prob_connEvent_of_eq _ _ (Set.mem_singleton_iff.mp ha).symm).symm)
  rw [KN3Planted.prob_connEvent_bot _ (show false ≠ true by decide),
    prob_connSetEvent_of_mem _ _ (Set.mem_singleton false)] at key
  linarith

/-- 2.9 — V = Unit, G = ⊥, A = {()}, o = b = (), m = 1: 1 ≥ 2 · (1 · 1) fails. -/
theorem planted9_false : ¬ Planted9_constantTwo := by
  intro h
  have key := h Unit ⊥ (fun _ => ⟨0, by simp⟩) {()} () () 1
    ⟨(), Set.mem_singleton (), prob_connEvent_of_eq _ _ rfl⟩
    (fun a _ => le_of_eq (prob_connEvent_of_eq _ _ rfl).symm)
  rw [prob_connEvent_of_eq _ _ (rfl : () = ()),
    prob_connSetEvent_of_mem _ _ (Set.mem_singleton ())] at key
  linarith

end KN1K0
