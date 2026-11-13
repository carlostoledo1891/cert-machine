import KN1.K0.Required

/-!
# KN1.K0.Weakenings — one-way implications of OBLIGATIONS1.md §3–§4 (optional; none decides the word)

Mathlib only; statements from the SEALED `Printed1.lean` and `Planted1.lean` (no repaired copy).
Nothing here needs the Harris–FKG inequality: 3.2, 3.5, 4.10, 4.11 are not attempted.
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- 3.3 -/
theorem planted13_of_harris : Neighbour1_HarrisFKG → Planted13_pointInPlaceOfSet := by
  intro h V _ G p A o b hA
  obtain ⟨a, ha⟩ := hA
  exact ⟨a, ha, h V G p o a b⟩

/-- 3.4 -/
theorem planted15_of_harris : Neighbour1_HarrisFKG → Planted15_connectedToAllOfA := by
  intro h V _ G p A o b m hex hlow
  obtain ⟨a₀, ha₀, rfl⟩ := hex
  have hsub : {ω : Config G | ∀ a ∈ A, Joined G ω o a} ⊆ connEvent G o a₀ := fun ω hω => hω a₀ ha₀
  exact le_trans (mul_le_mul_of_nonneg_right (prob_mono G p hsub) (prob_nonneg G p _)) (h V G p o a₀ b)

/-- 4.1 — Conjecture 1 gives Conjecture 3 (as sealed in `Printed.lean`), with δ = min (ε/2) 1. -/
theorem conjecture3_of_conjecture1 : Conjecture1 → KN3Printed.Conjecture3 := by
  intro h ε hε
  have hδ0 : 0 < min (ε / 2) 1 := lt_min (by linarith) one_pos
  have hδ1 : min (ε / 2) 1 ≤ 1 := min_le_right _ _
  have hδ2 : min (ε / 2) 1 ≤ ε / 2 := min_le_left _ _
  refine ⟨min (ε / 2) 1, hδ0, ?_⟩
  generalize min (ε / 2) 1 = δ at hδ0 hδ1 hδ2 ⊢
  intro V _ G p A o b h₁ h₂
  rcases A.eq_empty_or_nonempty with hA | hA
  · exfalso
    rw [hA, prob_connSetEvent_empty] at h₁
    linarith
  · obtain ⟨a, ha, hineq⟩ := conjecture1_iff_existsForm.mp h V G p A o b hA
    have h3 := h₂ a ha
    have h4 : 0 ≤ prob G p (connSetEvent G o A) := prob_nonneg G p _
    have h5 := mul_le_mul (le_of_lt h₁) (le_of_lt h3) (by linarith : (0 : ℝ) ≤ 1 - δ) h4
    nlinarith [mul_pos hδ0 hδ0]

/-- 4.2 — A = {a}. -/
theorem harris_of_conjecture1 : Conjecture1 → Neighbour1_HarrisFKG := by
  intro h V _ G p o a b
  have h0 := h V G p {a} o b (prob G p (connEvent G a b)) ⟨a, Set.mem_singleton a, rfl⟩
    (fun a' ha' => le_of_eq (by rw [Set.mem_singleton_iff.mp ha']))
  rwa [connSetEvent_singleton] at h0

/-- 4.3 -/
theorem planted13_of_conjecture1 : Conjecture1 → Planted13_pointInPlaceOfSet := by
  intro h V _ G p A o b hA
  obtain ⟨a, ha, hineq⟩ := conjecture1_iff_existsForm.mp h V G p A o b hA
  have hsub : connEvent G o a ⊆ connSetEvent G o A := fun ω hω => ⟨a, ha, hω⟩
  exact ⟨a, ha, le_trans (mul_le_mul_of_nonneg_right (prob_mono G p hsub) (prob_nonneg G p _)) hineq⟩

/-- 4.4 — a product of numbers of [0, 1] over a finite set is at most each factor. -/
theorem planted14_of_conjecture1 : Conjecture1 → Planted14_productInPlaceOfMin := by
  intro h V _ G p A o b
  classical
  rcases A.eq_empty_or_nonempty with hA | hA
  · subst hA
    rw [Finset.coe_empty, prob_connSetEvent_empty, zero_mul]
    exact prob_nonneg G p _
  · obtain ⟨a, ha, hineq⟩ :=
      conjecture1_iff_existsForm.mp h V G p (A : Set V) o b (Finset.coe_nonempty.mpr hA)
    have ha' : a ∈ A := Finset.mem_coe.mp ha
    have hprod : ∏ x ∈ A, prob G p (connEvent G x b) ≤ prob G p (connEvent G a b) := by
      have e := Finset.mul_prod_erase A (fun x => prob G p (connEvent G x b)) ha'
      have h1 : ∏ x ∈ A.erase a, prob G p (connEvent G x b) ≤ 1 :=
        Finset.prod_le_one (fun i _ => prob_nonneg G p _) (fun i _ => prob_le_one G p _)
      have h0 : 0 ≤ prob G p (connEvent G a b) := prob_nonneg G p _
      calc ∏ x ∈ A, prob G p (connEvent G x b)
          = prob G p (connEvent G a b) * ∏ x ∈ A.erase a, prob G p (connEvent G x b) := e.symm
        _ ≤ prob G p (connEvent G a b) := mul_le_of_le_one_right h0 h1
    exact le_trans (mul_le_mul_of_nonneg_left hprod (prob_nonneg G p _)) hineq

/-- 4.5 -/
theorem planted15_of_conjecture1 : Conjecture1 → Planted15_connectedToAllOfA := by
  intro h V _ G p A o b m hex hlow
  have h0 := h V G p A o b m hex hlow
  obtain ⟨a₀, ha₀, rfl⟩ := hex
  have hsub : {ω : Config G | ∀ a ∈ A, Joined G ω o a} ⊆ connSetEvent G o A :=
    fun ω hω => ⟨a₀, ha₀, hω a₀ ha₀⟩
  exact le_trans (mul_le_mul_of_nonneg_right (prob_mono G p hsub) (prob_nonneg G p _)) h0

/-- 4.6 -/
theorem planted16_of_conjecture1 : Conjecture1 → Planted16_oneCommonProbability := by
  intro h V _ G q A o b m
  exact h V G (fun _ => q) A o b m

theorem neighbour8_of_conjecture1 : Conjecture1 → Neighbour8_probabilitiesStrictlyInside := by
  intro h V _ G p A o b m _
  exact h V G p A o b m

theorem neighbour9_of_conjecture1 : Conjecture1 → Neighbour9_allEdgesHalf := by
  intro h V _ G p A o b m _
  exact h V G p A o b m

theorem neighbour10_of_conjecture1 : Conjecture1 → Neighbour10_sideConditions := by
  intro h V _ G p A o b m _ _ _
  exact h V G p A o b m

theorem neighbour11_of_conjecture1 : Conjecture1 → Neighbour11_notAdjacent := by
  intro h V _ G p A o b m _
  exact h V G p A o b m

theorem neighbour12_of_conjecture1 : Conjecture1 → Neighbour12_levelSets := by
  intro h V _ G p o b t m _ _
  exact h V G p {x : V | prob G p (connEvent G x b) > t} o b m

/-- 4.7 -/
theorem planted17_of_conjecture1 : Conjecture1 → Planted17_constantHalf := by
  intro h V _ G p A o b m hex hlow
  have h0 := h V G p A o b m hex hlow
  obtain ⟨a₀, ha₀, rfl⟩ := hex
  have h1 := mul_nonneg (prob_nonneg G p (connSetEvent G o A)) (prob_nonneg G p (connEvent G a₀ b))
  linarith

/-- 4.8 — a finite type is countable. -/
theorem conjecture1_of_neighbour7 : Neighbour7_countableGraph → Conjecture1 := by
  intro h
  rw [conjecture1_iff_lowerBound]
  intro V _ G p A o b m hlow
  exact h V G p A o b m hlow

/-- 4.9 -/
theorem neighbour2_of_neighbour3 : Neighbour3_inequality3 → Neighbour2_Conjecture2_preFKG := by
  intro h V _ G p A o b m hex hlow
  exact le_trans (h V G p A o b m hex hlow) (prob_mono G p Set.inter_subset_left)

end KN1K0
