import KN1.K0.Required

/-!
# KN1.K0.Readings — the OTHER sealed readings (optional; none decides the word)

K0 of PREREG-KN1.md, step 2, optional part: OBLIGATIONS1.md §1.3, 1.5, 1.6, 1.7, 1.9, 1.10, 1.11, 1.12.
Mathlib only; statements from the SEALED `Printed1.lean` (no repaired copy).
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- 1.3 — the "for the minimiser" reading. -/
theorem conjecture1_iff_minimiser : Conjecture1 ↔ Conjecture1_minimiser := by
  constructor
  · intro h V _ G p A o b a ha hmin
    exact h V G p A o b _ ⟨a, ha, rfl⟩ hmin
  · intro h V _ G p A o b m hex hlow
    obtain ⟨a, ha, rfl⟩ := hex
    exact h V G p A o b a ha hlow

/-- 1.5 — "the minimum of the empty set is c", for every real c. -/
theorem conjecture1_iff_emptyMinIs (c : ℝ) : Conjecture1 ↔ Conjecture1_emptyMinIs c := by
  constructor
  · intro h V _ G p A o b m hm
    rcases hm with ⟨hex, hlow⟩ | ⟨hA, -⟩
    · exact h V G p A o b m hex hlow
    · subst hA
      rw [prob_connSetEvent_empty, zero_mul]
      exact prob_nonneg G p _
  · intro h V _ G p A o b m hex hlow
    exact h V G p A o b m (Or.inl ⟨hex, hlow⟩)

/-- 1.6 — "two vertices" read as two distinct vertices. -/
theorem conjecture1_iff_distinct : Conjecture1 ↔ Conjecture1_distinct := by
  constructor
  · intro h V _ G p A o b m _ hex hlow
    exact h V G p A o b m hex hlow
  · intro h V _ G p A o b m hex hlow
    by_cases hob : o = b
    · obtain ⟨a, ha, rfl⟩ := hex
      have h1 : prob G p (connSetEvent G o A) ≤ 1 := prob_le_one G p _
      have h2 : prob G p (connEvent G a b) ≤ 1 := prob_le_one G p _
      have h4 : 0 ≤ prob G p (connEvent G a b) := prob_nonneg G p _
      have h5 := mul_le_mul h1 h2 h4 zero_le_one
      rw [prob_connEvent_of_eq G p hob]
      linarith
    · exact h V G p A o b m hob hex hlow

/-- 1.7 — "A ⊂ G" read as a proper subset. -/
theorem conjecture1_iff_properSubset : Conjecture1 ↔ Conjecture1_properSubset := by
  constructor
  · intro h V _ G p A o b m _ hex hlow
    exact h V G p A o b m hex hlow
  · intro h V _ G p A o b m hex hlow
    by_cases hA : A = Set.univ
    · subst hA
      rw [prob_connSetEvent_of_mem G p (Set.mem_univ o), one_mul]
      exact hlow o (Set.mem_univ o)
    · exact h V G p A o b m hA hex hlow

/-- 1.9 — the two hypotheses on m packed into `IsLeast`. -/
theorem conjecture1_iff_isLeast : Conjecture1 ↔ Conjecture1_isLeast := by
  constructor
  · intro h V _ G p A o b m hm
    exact h V G p A o b m hm.1 (fun a ha => hm.2 ⟨a, ha, rfl⟩)
  · intro h V _ G p A o b m hex hlow
    refine h V G p A o b m ⟨hex, ?_⟩
    rintro x ⟨a, ha, rfl⟩
    exact hlow a ha

/-- 1.10 — the minimum as `sInf` of the set of values. -/
theorem conjecture1_iff_sInf : Conjecture1 ↔ Conjecture1_sInf := by
  constructor
  · intro h V _ G p A o b
    rcases A.eq_empty_or_nonempty with hA | hA
    · subst hA
      rw [prob_connSetEvent_empty, zero_mul]
      exact prob_nonneg G p _
    · obtain ⟨a, ha, hmin⟩ := exists_minimiser G p A b hA
      have hl : IsLeast {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x} (prob G p (connEvent G a b)) :=
        ⟨⟨a, ha, rfl⟩, by rintro x ⟨a', ha', rfl⟩; exact hmin a' ha'⟩
      rw [hl.csInf_eq]
      exact h V G p A o b _ ⟨a, ha, rfl⟩ hmin
  · intro h V _ G p A o b m hex hlow
    have hl : IsLeast {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x} m :=
      ⟨hex, by rintro x ⟨a', ha', rfl⟩; exact hlow a' ha'⟩
    have h0 := h V G p A o b
    rwa [hl.csInf_eq] at h0

/-- The real `⨅` over the SUBTYPE of A is the value at a minimiser. -/
theorem iInf_subtype_eq {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b a₀ : V) (ha₀ : a₀ ∈ A)
    (hmin : ∀ a' ∈ A, prob G p (connEvent G a₀ b) ≤ prob G p (connEvent G a' b)) :
    (⨅ a : A, prob G p (connEvent G (a : V) b)) = prob G p (connEvent G a₀ b) := by
  haveI : Nonempty A := ⟨⟨a₀, ha₀⟩⟩
  have hbdd : BddBelow (Set.range fun a : A => prob G p (connEvent G (a : V) b)) :=
    ⟨0, by rintro x ⟨a, rfl⟩; exact prob_nonneg G p _⟩
  exact le_antisymm (ciInf_le hbdd ⟨a₀, ha₀⟩) (le_ciInf fun a => hmin a a.2)

/-- 1.11 — the minimum as `⨅` over the subtype of the points of A. -/
theorem conjecture1_iff_iInf : Conjecture1 ↔ Conjecture1_iInf := by
  constructor
  · intro h V _ G p A o b
    rcases A.eq_empty_or_nonempty with hA | hA
    · subst hA
      rw [prob_connSetEvent_empty, zero_mul]
      exact prob_nonneg G p _
    · obtain ⟨a, ha, hmin⟩ := exists_minimiser G p A b hA
      rw [iInf_subtype_eq G p A b a ha hmin]
      exact h V G p A o b _ ⟨a, ha, rfl⟩ hmin
  · intro h V _ G p A o b m hex hlow
    obtain ⟨a, ha, rfl⟩ := hex
    have h0 := h V G p A o b
    rwa [iInf_subtype_eq G p A b a ha hlow] at h0

/-- 1.12 — the inequality between the measures in `ℝ≥0∞`, with the lattice infimum (`⨅` over ∅ is ⊤). -/
theorem conjecture1_iff_ennreal : Conjecture1 ↔ Conjecture1_ennreal := by
  constructor
  · intro h V _ G p A o b
    rcases A.eq_empty_or_nonempty with hA | hA
    · subst hA
      have : connSetEvent G o ∅ = ∅ := by ext ω; simp [connSetEvent]
      rw [this, MeasureTheory.measure_empty, zero_mul]
      exact zero_le
    · obtain ⟨a, ha, hmin⟩ := exists_minimiser G p A b hA
      have h0 := h V G p A o b _ ⟨a, ha, rfl⟩ hmin
      have hle : (⨅ a ∈ A, percolationMeasure G p (connEvent G a b)) ≤ percolationMeasure G p (connEvent G a b) :=
        iInf₂_le a ha
      refine le_trans (mul_le_mul' le_rfl hle) ?_
      have hfin : percolationMeasure G p (connSetEvent G o A) * percolationMeasure G p (connEvent G a b) ≠ ⊤ :=
        ENNReal.mul_ne_top (MeasureTheory.measure_ne_top _ _) (MeasureTheory.measure_ne_top _ _)
      rw [← ENNReal.toReal_le_toReal hfin (MeasureTheory.measure_ne_top _ _), ENNReal.toReal_mul]
      exact h0
  · intro h V _ G p A o b m hex hlow
    obtain ⟨a, ha, rfl⟩ := hex
    have h0 := h V G p A o b
    have hle : percolationMeasure G p (connEvent G a b) ≤ ⨅ a ∈ A, percolationMeasure G p (connEvent G a b) :=
      le_iInf₂ fun a' ha' =>
        (ENNReal.toReal_le_toReal (MeasureTheory.measure_ne_top _ _) (MeasureTheory.measure_ne_top _ _)).mp
          (hlow a' ha')
    have h1 : percolationMeasure G p (connSetEvent G o A) * percolationMeasure G p (connEvent G a b)
        ≤ percolationMeasure G p (connEvent G o b) := le_trans (mul_le_mul' le_rfl hle) h0
    have h2 := ENNReal.toReal_mono (MeasureTheory.measure_ne_top _ _) h1
    rwa [ENNReal.toReal_mul] at h2

end KN1K0
