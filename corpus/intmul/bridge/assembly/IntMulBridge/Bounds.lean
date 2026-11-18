import Mathlib

/-!
# The bridge between two statements of one bound

`NatForm` and `BigOForm` are copied from two releases' statements and are kept
syntactically as they were written there. Three theorems, all UNCONDITIONAL
(no hypothesis was added to any of them):

* `natForm_iff_bigOForm`  : `NatForm t ↔ BigOForm t (1 / 2 ^ 46)`
* `bigOForm_mono`         : `κ' ≤ κ → BigOForm t κ → BigOForm t κ'` (any real `κ`, `κ'`)
* `community_to_natForm`  : `BigOForm t (4222422970 / 2 ^ 46) → NatForm t`

The exponent `2 ^ 46` is never evaluated: every lemma is proved for an arbitrary
`K ≥ 1` and specialised at the end.
-/

namespace IntMulBridge
open Asymptotics Filter

/-- One release's form of the bound, for a time function `t`. -/
def NatForm (t : ℕ → ℕ) : Prop :=
  ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
    (t L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)

/-- The other release's form of the bound, at saving `κ`. -/
def BigOForm (t : ℕ → ℕ) (κ : ℝ) : Prop :=
  (fun n : ℕ => (t n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)

/-! ## Helper lemmas, for an arbitrary `K ≥ 1` -/

theorem kappa_nonneg (K : ℕ) (hK : 0 < K) : 0 ≤ 1 - 1 / (K : ℝ) := by
  have hK1 : (1 : ℝ) ≤ K := by exact_mod_cast hK
  have h : 1 / (K : ℝ) ≤ 1 := by
    rw [div_le_one (by linarith)]
    exact hK1
  linarith

theorem kappa_le_one (K : ℕ) : 1 - 1 / (K : ℝ) ≤ 1 := by
  have h : 0 ≤ 1 / (K : ℝ) := by positivity
  linarith

/-- The `K`-th power of `x ^ (1 - 1/K)` is `x ^ (K - 1)`. -/
theorem rpow_pow_K (x : ℝ) (hx : 0 ≤ x) (K : ℕ) (hK : 0 < K) :
    (x ^ (1 - 1 / (K : ℝ))) ^ K = x ^ (K - 1) := by
  have hK0 : (K : ℝ) ≠ 0 := by exact_mod_cast hK.ne'
  have hexp : (1 - 1 / (K : ℝ)) * (K : ℝ) = ((K - 1 : ℕ) : ℝ) := by
    rw [Nat.cast_sub hK]
    field_simp
    simp
  rw [← Real.rpow_natCast, ← Real.rpow_mul hx, hexp, Real.rpow_natCast]

/-- Taking `K`-th roots of the natural-number inequality. -/
theorem root_bound (K : ℕ) (hK : 0 < K) (a C L g : ℕ)
    (h : a ^ K ≤ (C * L) ^ K * g ^ (K - 1)) :
    (a : ℝ) ≤ C * L * (g : ℝ) ^ (1 - 1 / (K : ℝ)) := by
  have hb : 0 ≤ (C : ℝ) * L * (g : ℝ) ^ (1 - 1 / (K : ℝ)) := by positivity
  rw [← pow_le_pow_iff_left₀ (Nat.cast_nonneg a) hb hK.ne']
  rw [mul_pow, rpow_pow_K _ (Nat.cast_nonneg g) K hK]
  exact_mod_cast h

/-- `⌊log₂ L⌋ ≤ 2 · ln L` for `L ≥ 1`. -/
theorem log2_cast_le (L : ℕ) (hL : 1 ≤ L) : (Nat.log2 L : ℝ) ≤ 2 * Real.log L := by
  rw [Nat.log2_eq_log_two]
  have hLpos : (0 : ℝ) < L := by exact_mod_cast (show 0 < L by omega)
  have h1 : (2 : ℝ) ^ (Nat.log 2 L) ≤ L := by
    exact_mod_cast Nat.pow_log_le_self 2 (by omega : L ≠ 0)
  have h2 : Real.log ((2 : ℝ) ^ (Nat.log 2 L)) ≤ Real.log L :=
    Real.log_le_log (by positivity) h1
  rw [Real.log_pow] at h2
  have h3 : (0.6931471803 : ℝ) < Real.log 2 := Real.log_two_gt_d9
  have h4 : (0 : ℝ) ≤ (Nat.log 2 L : ℝ) := Nat.cast_nonneg _
  nlinarith [mul_nonneg h4 (sub_nonneg.mpr h3.le)]

/-- `ln L ≤ 2 · ⌊log₂ L⌋` for `L ≥ 2`. -/
theorem log_le_log2 (L : ℕ) (hL : 2 ≤ L) : Real.log L ≤ 2 * (Nat.log2 L : ℝ) := by
  rw [Nat.log2_eq_log_two]
  have hLpos : (0 : ℝ) < L := by exact_mod_cast (show 0 < L by omega)
  have h0 : 1 ≤ Nat.log 2 L := Nat.log_pos (by norm_num) hL
  have h1 : (L : ℝ) ≤ (2 : ℝ) ^ (Nat.log 2 L + 1) := by
    exact_mod_cast (Nat.lt_pow_succ_log_self (by norm_num : 1 < 2) L).le
  have h2 : Real.log L ≤ Real.log ((2 : ℝ) ^ (Nat.log 2 L + 1)) :=
    Real.log_le_log hLpos h1
  rw [Real.log_pow] at h2
  have h3 : Real.log 2 < 0.6931471808 := Real.log_two_lt_d9
  have h4 : (1 : ℝ) ≤ (Nat.log 2 L : ℝ) := by exact_mod_cast h0
  push_cast at h2
  nlinarith [mul_nonneg (by linarith : (0 : ℝ) ≤ (Nat.log 2 L : ℝ) + 1)
    (by linarith : (0 : ℝ) ≤ 1 - Real.log 2)]

/-! ## The equivalence, for an arbitrary `K ≥ 1` -/

theorem natK_to_bigO (t : ℕ → ℕ) (K : ℕ) (hK : 0 < K)
    (h : ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (t L) ^ K ≤ (C * L) ^ K * (Nat.log2 L) ^ (K - 1)) :
    (fun n : ℕ => (t n : ℝ)) =O[atTop]
      fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - 1 / (K : ℝ)) := by
  obtain ⟨C, N₀, -, h⟩ := h
  have hκ0 : 0 ≤ 1 - 1 / (K : ℝ) := kappa_nonneg K hK
  refine IsBigO.of_bound ((C : ℝ) * 2 ^ (1 - 1 / (K : ℝ))) ?_
  filter_upwards [eventually_ge_atTop (max N₀ 1)] with L hL
  have hL0 : N₀ ≤ L := le_trans (le_max_left _ _) hL
  have hL1 : 1 ≤ L := le_trans (le_max_right _ _) hL
  have hlog : 0 ≤ Real.log (L : ℝ) := Real.log_nonneg (by exact_mod_cast hL1)
  rw [Real.norm_of_nonneg (Nat.cast_nonneg _),
    Real.norm_of_nonneg (mul_nonneg (Nat.cast_nonneg _) (Real.rpow_nonneg hlog _))]
  have h1 := root_bound K hK (t L) C L (Nat.log2 L) (h L hL0)
  have h2 := log2_cast_le L hL1
  have h3 : ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) ≤
      2 ^ (1 - 1 / (K : ℝ)) * Real.log L ^ (1 - 1 / (K : ℝ)) := by
    rw [← Real.mul_rpow (by norm_num) hlog]
    exact Real.rpow_le_rpow (Nat.cast_nonneg _) h2 hκ0
  calc (t L : ℝ) ≤ C * L * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) := h1
    _ ≤ C * L * (2 ^ (1 - 1 / (K : ℝ)) * Real.log L ^ (1 - 1 / (K : ℝ))) :=
        mul_le_mul_of_nonneg_left h3 (by positivity)
    _ = (C : ℝ) * 2 ^ (1 - 1 / (K : ℝ)) * ((L : ℝ) * Real.log L ^ (1 - 1 / (K : ℝ))) := by
        ring

theorem bigO_to_natK (t : ℕ → ℕ) (K : ℕ) (hK : 0 < K)
    (h : (fun n : ℕ => (t n : ℝ)) =O[atTop]
      fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - 1 / (K : ℝ))) :
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (t L) ^ K ≤ (C * L) ^ K * (Nat.log2 L) ^ (K - 1) := by
  obtain ⟨c, hc, hb⟩ := h.exists_pos
  obtain ⟨N, hN⟩ := eventually_atTop.mp hb.bound
  have hκ0 : 0 ≤ 1 - 1 / (K : ℝ) := kappa_nonneg K hK
  have hκ1 : 1 - 1 / (K : ℝ) ≤ 1 := kappa_le_one K
  obtain ⟨C, hCdef⟩ : ∃ C : ℕ, C = ⌈2 * c⌉₊ + 1 := ⟨_, rfl⟩
  have hC : 2 * c ≤ (C : ℝ) := by
    rw [hCdef]
    push_cast
    linarith [Nat.le_ceil (2 * c)]
  refine ⟨C, max N 2, by omega, fun L hL => ?_⟩
  have hLN : N ≤ L := le_trans (le_max_left _ _) hL
  have hL2 : 2 ≤ L := le_trans (le_max_right _ _) hL
  have hlog : 0 ≤ Real.log (L : ℝ) :=
    Real.log_nonneg (by exact_mod_cast (show 1 ≤ L by omega))
  have hb' := hN L hLN
  rw [Real.norm_of_nonneg (Nat.cast_nonneg _),
    Real.norm_of_nonneg (mul_nonneg (Nat.cast_nonneg _) (Real.rpow_nonneg hlog _))] at hb'
  have h2 := log_le_log2 L hL2
  have hg : 0 ≤ ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) :=
    Real.rpow_nonneg (Nat.cast_nonneg _) _
  have h3 : Real.log L ^ (1 - 1 / (K : ℝ)) ≤
      2 * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) := by
    calc Real.log L ^ (1 - 1 / (K : ℝ))
        ≤ (2 * ((Nat.log2 L : ℕ) : ℝ)) ^ (1 - 1 / (K : ℝ)) :=
          Real.rpow_le_rpow hlog h2 hκ0
      _ = 2 ^ (1 - 1 / (K : ℝ)) * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) :=
          Real.mul_rpow (by norm_num) (Nat.cast_nonneg _)
      _ ≤ 2 * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) := by
          refine mul_le_mul_of_nonneg_right ?_ hg
          calc (2 : ℝ) ^ (1 - 1 / (K : ℝ)) ≤ 2 ^ (1 : ℝ) :=
                Real.rpow_le_rpow_of_exponent_le (by norm_num) hκ1
            _ = 2 := Real.rpow_one 2
  have hLg : 0 ≤ (L : ℝ) * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) :=
    mul_nonneg (Nat.cast_nonneg _) hg
  have h4 : (t L : ℝ) ≤ (C : ℝ) * L * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) := by
    calc (t L : ℝ) ≤ c * ((L : ℝ) * Real.log L ^ (1 - 1 / (K : ℝ))) := hb'
      _ ≤ c * ((L : ℝ) * (2 * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)))) :=
          mul_le_mul_of_nonneg_left
            (mul_le_mul_of_nonneg_left h3 (Nat.cast_nonneg _)) hc.le
      _ = 2 * c * ((L : ℝ) * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ))) := by ring
      _ ≤ (C : ℝ) * ((L : ℝ) * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ))) :=
          mul_le_mul_of_nonneg_right hC hLg
      _ = (C : ℝ) * L * ((Nat.log2 L : ℕ) : ℝ) ^ (1 - 1 / (K : ℝ)) := by ring
  have h5 := pow_le_pow_left₀ (Nat.cast_nonneg (t L)) h4 K
  rw [mul_pow, rpow_pow_K _ (Nat.cast_nonneg _) K hK] at h5
  exact_mod_cast h5

theorem natK_iff_bigO (t : ℕ → ℕ) (K : ℕ) (hK : 0 < K) :
    (∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (t L) ^ K ≤ (C * L) ^ K * (Nat.log2 L) ^ (K - 1)) ↔
    ((fun n : ℕ => (t n : ℝ)) =O[atTop]
      fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - 1 / (K : ℝ))) :=
  ⟨natK_to_bigO t K hK, bigO_to_natK t K hK⟩

/-! ## The three theorems -/

theorem natForm_iff_bigOForm (t : ℕ → ℕ) : NatForm t ↔ BigOForm t (1 / 2 ^ 46) := by
  unfold NatForm BigOForm
  obtain ⟨K, hK⟩ : ∃ K : ℕ, K = 2 ^ 46 := ⟨_, rfl⟩
  have hK0 : 0 < K := by rw [hK]; exact Nat.two_pow_pos 46
  have hc : (2 : ℝ) ^ 46 = (K : ℝ) := by rw [hK]; norm_cast
  rw [hc, ← hK]
  exact natK_iff_bigO t K hK0

theorem bigOForm_mono (t : ℕ → ℕ) {κ κ' : ℝ} (h : κ' ≤ κ) :
    BigOForm t κ → BigOForm t κ' := by
  intro H
  unfold BigOForm at H ⊢
  refine H.trans (IsBigO.of_bound 1 ?_)
  filter_upwards [eventually_ge_atTop 3] with n hn
  have hlog : 1 ≤ Real.log (n : ℝ) := by
    have h3 : (3 : ℝ) ≤ n := by exact_mod_cast hn
    have he : Real.exp 1 < 3 := Real.exp_one_lt_d9.trans (by norm_num)
    rw [Real.le_log_iff_exp_le (by linarith)]
    linarith
  have hlog0 : 0 ≤ Real.log (n : ℝ) := by linarith
  rw [Real.norm_of_nonneg (mul_nonneg (Nat.cast_nonneg _) (Real.rpow_nonneg hlog0 _)),
    Real.norm_of_nonneg (mul_nonneg (Nat.cast_nonneg _) (Real.rpow_nonneg hlog0 _)),
    one_mul]
  exact mul_le_mul_of_nonneg_left
    (Real.rpow_le_rpow_of_exponent_le hlog (by linarith)) (Nat.cast_nonneg _)

theorem community_to_natForm (t : ℕ → ℕ) :
    BigOForm t (4222422970 / 2 ^ 46) → NatForm t := by
  intro H
  refine (natForm_iff_bigOForm t).mpr (bigOForm_mono t ?_ H)
  exact div_le_div_of_nonneg_right (by norm_num) (by positivity)

end IntMulBridge

#print axioms IntMulBridge.natForm_iff_bigOForm
#print axioms IntMulBridge.bigOForm_mono
#print axioms IntMulBridge.community_to_natForm
