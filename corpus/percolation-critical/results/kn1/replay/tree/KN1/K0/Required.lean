import KN1.K0.Basic

/-!
# KN1.K0.Required — the REQUIRED relations between the primary and its required readings

K0 of PREREG-KN1.md, step 2 (a)–(d). Mathlib only; statements from the SEALED `Printed1.lean` (no repaired copy)
and the sealed sibling fragment `Planted.lean` pasted in `KN1.K0.Frag`.

* (a) `conjecture1_iff_existsForm`      R0 ↔ RE
* (b) `conjecture1_iff_lowerBound`      R0 ↔ RL
* (c) `onFin_of_conjecture1`            R0 → RF
* (d) `existsForm_iff_sealedNeighbour1` RE ↔ the sealed N1 of seal 26, by `Iff.rfl`
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- (a) OBLIGATIONS1 1.1: the primary is the "for some a ∈ A" form. -/
theorem conjecture1_iff_existsForm : Conjecture1 ↔ Conjecture1_existsForm := by
  constructor
  · intro h V _ G p A o b hA
    obtain ⟨a, ha, hmin⟩ := exists_minimiser G p A b hA
    exact ⟨a, ha, h V G p A o b _ ⟨a, ha, rfl⟩ hmin⟩
  · intro h V _ G p A o b m hex hlow
    obtain ⟨a₀, ha₀, -⟩ := hex
    obtain ⟨a, ha, hineq⟩ := h V G p A o b ⟨a₀, ha₀⟩
    have h1 : m ≤ prob G p (connEvent G a b) := hlow a ha
    have h2 : 0 ≤ prob G p (connSetEvent G o A) := prob_nonneg G p _
    exact le_trans (mul_le_mul_of_nonneg_left h1 h2) hineq

/-- (b) OBLIGATIONS1 1.4: the primary is the "every lower bound" form. -/
theorem conjecture1_iff_lowerBound : Conjecture1 ↔ Conjecture1_lowerBound := by
  constructor
  · intro h V _ G p A o b m hlow
    rcases A.eq_empty_or_nonempty with hA | hA
    · subst hA
      rw [prob_connSetEvent_empty, zero_mul]
      exact prob_nonneg G p _
    · obtain ⟨a, ha, hmin⟩ := exists_minimiser G p A b hA
      have h0 := h V G p A o b _ ⟨a, ha, rfl⟩ hmin
      have h1 : m ≤ prob G p (connEvent G a b) := hlow a ha
      have h2 : 0 ≤ prob G p (connSetEvent G o A) := prob_nonneg G p _
      exact le_trans (mul_le_mul_of_nonneg_left h1 h2) h0
  · intro h V _ G p A o b m _ hlow
    exact h V G p A o b m hlow

/-- (c) OBLIGATIONS1 1.8 (→): `Fin n` is a finite type. -/
theorem onFin_of_conjecture1 : Conjecture1 → Conjecture1_onFin := by
  intro h n G p A o b m hex hlow
  exact h (Fin n) G p A o b m hex hlow

/-- (d) OBLIGATIONS1 1.2: the "for some a ∈ A" reading is, term for term, the neighbour N1 sealed in seal 26
(`KN3Planted.Neighbour1_Conjecture1`, pasted byte-exact in `KN1.K0.Frag`). -/
theorem existsForm_iff_sealedNeighbour1 :
    KN1Printed.Conjecture1_existsForm ↔ KN3Planted.Neighbour1_Conjecture1 :=
  Iff.rfl

end KN1K0
