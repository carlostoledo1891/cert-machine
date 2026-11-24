import CertMachine.Anchors

open Statement CertMachine.Anchors

namespace CertMachine.N6

/-- A single power bounds the circuit size when both the matrix size and the variable count
are at most T. -/
theorem size_le_power {a n v T : ℕ} (hn : n ≤ T) (hv : v ≤ T) (ha : a ≤ T) (hT : 8 ≤ T) :
    (n ^ a + a) + n * n * (4 * v + 4) ≤ T ^ (a + 5) := by
  have hpos : 1 ≤ T := by omega
  have h₁ : n ^ a ≤ T ^ (a + 4) :=
    (Nat.pow_le_pow_left hn a).trans (Nat.pow_le_pow_right hpos (by omega))
  have h₂ : a ≤ T ^ (a + 4) := by
    calc a ≤ T := ha
      _ = T ^ 1 := (pow_one _).symm
      _ ≤ _ := Nat.pow_le_pow_right hpos (by omega)
  have hcost : 4 * v + 4 ≤ T * T := by
    calc 4 * v + 4 ≤ 8 * T := by omega
      _ ≤ _ := Nat.mul_le_mul_right T hT
  have h₃ : n * n * (4 * v + 4) ≤ T ^ (a + 4) := by
    calc n * n * (4 * v + 4) ≤ (T * T) * (T * T) :=
          Nat.mul_le_mul (Nat.mul_le_mul hn hn) hcost
      _ = T ^ 4 := by ring
      _ ≤ _ := Nat.pow_le_pow_right hpos (by omega)
  calc (n ^ a + a) + n * n * (4 * v + 4) ≤ T ^ (a + 4) * 3 := by omega
    _ ≤ T ^ (a + 4) * T := Nat.mul_le_mul_left _ (by omega)
    _ = _ := (pow_succ T (a + 4)).symm

/-- Shrinking the absolute exponent by a factor of a+5 absorbs the substitution cost. -/
theorem beyond_size_transfer (a : ℕ) (c : ℝ) (hc : 0 < c) :
    ∃ c' : ℝ, 0 < c' ∧ ∃ M : ℕ, ∀ m ≥ M, ∀ n : ℕ,
      Beyond c m ((n ^ a + a) + n * n * (4 * (m * m) + 4)) → Beyond c' m n := by
  let c' := c / ((a + 5 : ℕ) : ℝ)
  have hd : (0 : ℝ) < ((a + 5 : ℕ) : ℝ) := by positivity
  have hc' : 0 < c' := div_pos hc hd
  obtain ⟨m₁, hm₁⟩ := A5 c' hc' 2
  refine ⟨c', hc', max m₁ (a + 8), ?_⟩
  intro m hm n hsize
  have hm₁' : m₁ ≤ m := (le_max_left _ _).trans hm
  have hma : a + 8 ≤ m := (le_max_right _ _).trans hm
  let T := max n (m * m)
  let L := Real.logb 2 (m : ℝ) ^ (1 / 3 : ℝ)
  have hmT : m ≤ T := by
    calc m = m * 1 := (mul_one _).symm
      _ ≤ m * m := Nat.mul_le_mul_left _ (by omega)
      _ ≤ T := le_max_right _ _
  by_contra hn
  change ¬ (m : ℝ) ^ (c' * L) < n at hn
  have hn' := le_of_not_gt hn
  have hsq : ((m * m : ℕ) : ℝ) ≤ (m : ℝ) ^ (c' * L) := by
    rw [Nat.cast_mul, ← pow_two]
    exact (hm₁ m hm₁').le
  have hT : (T : ℝ) ≤ (m : ℝ) ^ (c' * L) := by
    simpa only [T, Nat.cast_max] using max_le hn' hsq
  have hnat := size_le_power (a := a) (le_max_left n (m*m)) (le_max_right n (m*m))
    (show a ≤ T by omega) (show 8 ≤ T by omega)
  apply (not_lt_of_ge ?_) hsize
  calc (((n ^ a + a) + n * n * (4 * (m * m) + 4) : ℕ) : ℝ) ≤ ((T ^ (a + 5) : ℕ) : ℝ) := by
          exact_mod_cast hnat
    _ = (T : ℝ) ^ (a + 5) := Nat.cast_pow _ _
    _ ≤ ((m : ℝ) ^ (c' * L)) ^ (a + 5) := pow_le_pow_left₀ (Nat.cast_nonneg T) hT _
    _ = (m : ℝ) ^ (c * L) := by
      rw [← Real.rpow_natCast, ← Real.rpow_mul (Nat.cast_nonneg m)]
      congr 1
      dsimp [c']
      field_simp [ne_of_gt hd] <;> ring

end CertMachine.N6
