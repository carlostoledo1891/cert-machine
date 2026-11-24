import Statement

/-!
# Anchors on the release's definitions (row F3) and the red control R1 (row F4)

Author C, cert-machine VP ≠ VNP lane, 2026-11-24. Mathlib and `Statement` only.
-/

open MvPolynomial Statement Filter

namespace CertMachine.Anchors

universe u v

/-! ### Circuit toolkit (helpers, not anchors) -/

section Toolkit

variable {R : Type u} {V : Type} [CommSemiring R]

/-- The gate condition of `Statement.Computes` at position `k` of the list `l`. -/
def Gate (l : ℕ → MvPolynomial V R) (k : ℕ) : Prop :=
  (∃ v : V, l k = X v) ∨ (∃ a : R, l k = C a) ∨
    (∃ i < k, ∃ j < k, l k = l i + l j) ∨ (∃ i < k, ∃ j < k, l k = l i * l j)

/-- Every position below `n` is a gate. -/
def Valid (l : ℕ → MvPolynomial V R) (n : ℕ) : Prop := ∀ k < n, Gate l k

theorem computes_iff (f : MvPolynomial V R) (s : ℕ) :
    Computes f s ↔ ∃ l : ℕ → MvPolynomial V R, Valid l s ∧ ∃ k < s, l k = f := Iff.rfl

/-- A gate stays a gate when the list is shifted by `s` (and agrees on the shifted prefix). -/
theorem gate_shift {l l' : ℕ → MvPolynomial V R} {k : ℕ} (s : ℕ)
    (e : ∀ i ≤ k, l' (i + s) = l i) (h : Gate l k) : Gate l' (k + s) := by
  rcases h with ⟨w, hw⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, h⟩ | ⟨i, hi, j, hj, h⟩
  · exact Or.inl ⟨w, by rw [e k le_rfl, hw]⟩
  · exact Or.inr (Or.inl ⟨a, by rw [e k le_rfl, ha]⟩)
  · exact Or.inr (Or.inr (Or.inl ⟨i + s, by omega, j + s, by omega,
      by rw [e k le_rfl, e i hi.le, e j hj.le, h]⟩))
  · exact Or.inr (Or.inr (Or.inr ⟨i + s, by omega, j + s, by omega,
      by rw [e k le_rfl, e i hi.le, e j hj.le, h]⟩))

theorem gate_congr {l l' : ℕ → MvPolynomial V R} {k : ℕ}
    (e : ∀ i ≤ k, l' i = l i) (h : Gate l k) : Gate l' k :=
  gate_shift 0 (fun i hi => e i hi) h

/-- Two lists side by side. -/
def cat (l₁ l₂ : ℕ → MvPolynomial V R) (s : ℕ) : ℕ → MvPolynomial V R :=
  fun k => if k < s then l₁ k else l₂ (k - s)

theorem valid_cat {l₁ l₂ : ℕ → MvPolynomial V R} {s t : ℕ} (h₁ : Valid l₁ s) (h₂ : Valid l₂ t) :
    Valid (cat l₁ l₂ s) (s + t) := by
  intro k hk
  by_cases hks : k < s
  · exact gate_congr (fun i hi => by simp [cat, show i < s by omega]) (h₁ k hks)
  · have := gate_shift (l' := cat l₁ l₂ s) s
      (fun i _ => by simp [cat]) (h₂ (k - s) (by omega))
    rwa [Nat.sub_add_cancel (by omega)] at this

/-- One more gate at the end. -/
def snoc (l : ℕ → MvPolynomial V R) (n : ℕ) (g : MvPolynomial V R) : ℕ → MvPolynomial V R :=
  fun k => if k < n then l k else g

theorem valid_snoc {l : ℕ → MvPolynomial V R} {n : ℕ} {g : MvPolynomial V R} (h : Valid l n)
    (hg : Gate (snoc l n g) n) : Valid (snoc l n g) (n + 1) := by
  intro k hk
  by_cases hkn : k < n
  · exact gate_congr (fun i hi => by simp [snoc, show i < n by omega]) (h k hkn)
  · rwa [show k = n by omega]

theorem computes_of_valid {l : ℕ → MvPolynomial V R} {n i : ℕ} (h : Valid l n) (hi : i < n) :
    Computes (l i) n := ⟨l, h, i, hi, rfl⟩

theorem extend_add {l : ℕ → MvPolynomial V R} {n i j : ℕ} (h : Valid l n) (hi : i < n)
    (hj : j < n) : Computes (l i + l j) (n + 1) := by
  refine ⟨snoc l n (l i + l j), valid_snoc h ?_, n, by omega, by simp [snoc]⟩
  exact Or.inr (Or.inr (Or.inl ⟨i, hi, j, hj, by simp [snoc, hi, hj]⟩))

theorem extend_mul {l : ℕ → MvPolynomial V R} {n i j : ℕ} (h : Valid l n) (hi : i < n)
    (hj : j < n) : Computes (l i * l j) (n + 1) := by
  refine ⟨snoc l n (l i * l j), valid_snoc h ?_, n, by omega, by simp [snoc]⟩
  exact Or.inr (Or.inr (Or.inr ⟨i, hi, j, hj, by simp [snoc, hi, hj]⟩))

theorem computes_X (w : V) : Computes (X w : MvPolynomial V R) 1 :=
  ⟨fun _ => X w, fun _ _ => Or.inl ⟨w, rfl⟩, 0, by omega, rfl⟩

theorem computes_C (a : R) : Computes (C a : MvPolynomial V R) 1 :=
  ⟨fun _ => C a, fun _ _ => Or.inr (Or.inl ⟨a, rfl⟩), 0, by omega, rfl⟩

/-- Two circuits side by side. -/
theorem computes_pair {p q : MvPolynomial V R} {s t : ℕ} (hp : Computes p s) (hq : Computes q t) :
    ∃ l : ℕ → MvPolynomial V R, Valid l (s + t) ∧ ∃ i < s + t, ∃ j < s + t, l i = p ∧ l j = q := by
  obtain ⟨l₁, h₁, i, hi, rfl⟩ := hp
  obtain ⟨l₂, h₂, j, hj, rfl⟩ := hq
  exact ⟨cat l₁ l₂ s, valid_cat h₁ h₂, i, by omega, s + j, by omega, by simp [cat, hi],
    by simp [cat]⟩

theorem computes_add {p q : MvPolynomial V R} {s t : ℕ} (hp : Computes p s) (hq : Computes q t) :
    Computes (p + q) (s + t + 1) := by
  obtain ⟨l, hl, i, hi, j, hj, rfl, rfl⟩ := computes_pair hp hq
  exact extend_add hl hi hj

theorem computes_mul {p q : MvPolynomial V R} {s t : ℕ} (hp : Computes p s) (hq : Computes q t) :
    Computes (p * q) (s + t + 1) := by
  obtain ⟨l, hl, i, hi, j, hj, rfl, rfl⟩ := computes_pair hp hq
  exact extend_mul hl hi hj

/-- One squaring gate. -/
theorem computes_sq {p : MvPolynomial V R} {s : ℕ} (hp : Computes p s) :
    Computes (p * p) (s + 1) := by
  obtain ⟨l, hl, i, hi, rfl⟩ := hp
  exact extend_mul hl hi hi

/-- `k` squaring gates (the earlier results are reused). -/
theorem computes_pow_two_pow {p : MvPolynomial V R} {s : ℕ} (hp : Computes p s) (k : ℕ) :
    Computes (p ^ 2 ^ k) (s + k) := by
  induction k with
  | zero => simpa using hp
  | succ k ih =>
    have h := computes_sq ih
    rwa [← pow_two, ← pow_mul, ← pow_succ] at h

/-- Padding: a circuit with at most `s` gates is one with at most `t ≥ s` gates. -/
theorem computes_mono {f : MvPolynomial V R} {s t : ℕ} (h : Computes f s) (hst : s ≤ t) :
    Computes f t := by
  obtain ⟨l, hl, k, hk, rfl⟩ := h
  refine ⟨snoc l s (C 0), fun k' hk' => ?_, k, by omega, by simp [snoc, hk]⟩
  by_cases hks : k' < s
  · exact gate_congr (fun i hi => by simp [snoc, show i < s by omega]) (hl k' hks)
  · exact Or.inr (Or.inl ⟨0, by simp [snoc, hks]⟩)

/-- A ring homomorphism carries circuits to circuits of the same size. -/
theorem computes_map {S : Type v} [CommSemiring S] (φ : R →+* S) {f : MvPolynomial V R} {s : ℕ}
    (h : Computes f s) : Computes (map φ f) s := by
  obtain ⟨l, hl, k, hk, rfl⟩ := h
  refine ⟨fun i => map φ (l i), fun k' hk' => ?_, k, hk, rfl⟩
  rcases hl k' hk' with ⟨w, hw⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, h⟩ | ⟨i, hi, j, hj, h⟩
  · exact Or.inl ⟨w, by simp [hw]⟩
  · exact Or.inr (Or.inl ⟨φ a, by simp [ha]⟩)
  · exact Or.inr (Or.inr (Or.inl ⟨i, hi, j, hj, by simp [h]⟩))
  · exact Or.inr (Or.inr (Or.inr ⟨i, hi, j, hj, by simp [h]⟩))

/-- The sum of the variables in a nonempty finite set: the variables, then one addition fewer. -/
theorem computes_sum_X {s : Finset V} (hs : s.Nonempty) :
    Computes (∑ w ∈ s, X w : MvPolynomial V R) (2 * s.card - 1) := by
  induction hs using Finset.Nonempty.cons_induction with
  | singleton a => simpa using computes_X a
  | cons a s h hs ih =>
    rw [Finset.sum_cons, Finset.card_cons]
    have := computes_add (computes_X (R := R) a) ih
    have hc := hs.card_pos
    rwa [show 1 + (2 * s.card - 1) + 1 = 2 * (s.card + 1) - 1 by omega] at this

end Toolkit

/-! ### F3 — the anchors -/

/-- **A1** (any set of variables). Every polynomial has a circuit: the hypothesis of the main bound
can be met, so the bound is not vacuous. -/
theorem A1_any {R : Type u} [CommSemiring R] {V : Type} (f : MvPolynomial V R) :
    ∃ s : ℕ, Computes f s := by
  induction f using MvPolynomial.induction_on with
  | C a => exact ⟨1, computes_C a⟩
  | add p q hp hq =>
    obtain ⟨s, hs⟩ := hp
    obtain ⟨t, ht⟩ := hq
    exact ⟨s + t + 1, computes_add hs ht⟩
  | mul_X p w hp =>
    obtain ⟨s, hs⟩ := hp
    exact ⟨s + 1 + 1, computes_mul hs (computes_X w)⟩

/-- **A1.** Every polynomial over a commutative semiring in finitely many variables has a
circuit. -/
theorem A1 {R : Type u} [CommSemiring R] {V : Type} [Fintype V] (f : MvPolynomial V R) :
    ∃ s : ℕ, Computes f s :=
  A1_any f

/-- **A2.** Padding: a circuit with at most `s` gates is one with at most `s + 1`, so `Computes f s`
is monotone in `s` and the bound is about the smallest circuit. -/
theorem A2 {R : Type u} [CommSemiring R] {V : Type} {f : MvPolynomial V R} {s : ℕ}
    (h : Computes f s) : Computes f (s + 1) :=
  computes_mono h (Nat.le_succ s)

/-- **A3.** Reuse: `X v ^ 2 ^ k` has a circuit of `k + 1` gates (a variable gate and `k`
squarings), so `Computes` counts circuits, not formulas. -/
theorem A3 {R : Type u} [CommSemiring R] {V : Type} (w : V) (k : ℕ) :
    Computes (X w ^ 2 ^ k : MvPolynomial V R) (k + 1) := by
  rw [Nat.add_comm]
  exact computes_pow_two_pow (computes_X w) k

/-- **A4.** Over a field, an exact circuit is an approximating one (with the constant series). -/
theorem A4 {F : Type u} [Field F] {V : Type} {f : MvPolynomial V F} {s : ℕ}
    (h : Computes f s) : Approximates f s := by
  refine ⟨map (HahnSeries.C : F →+* LaurentSeries F) f, computes_map _ h, fun d i _ => ?_⟩
  rw [coeff_map, HahnSeries.C_apply, HahnSeries.coeff_single]
  split_ifs <;> rfl

/-- **A5** (real exponents). The bound `m ^ (c * (log₂ m) ^ (1/3))` eventually exceeds every
power `m ^ k`. -/
theorem A5_real (c : ℝ) (hc : 0 < c) (k : ℝ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) := by
  have h1 : Tendsto (fun m : ℕ => c * Real.logb 2 (m : ℝ) ^ (1 / 3 : ℝ)) atTop atTop :=
    ((tendsto_rpow_atTop (by norm_num : (0 : ℝ) < 1 / 3)).comp
      ((Real.tendsto_logb_atTop (by norm_num : (1 : ℝ) < 2)).comp
        tendsto_natCast_atTop_atTop)).const_mul_atTop hc
  obtain ⟨m₀, hm₀⟩ := eventually_atTop.mp ((h1.eventually_gt_atTop k).and (eventually_ge_atTop 2))
  refine ⟨m₀, fun m hm => ?_⟩
  obtain ⟨hk, h2⟩ := hm₀ m hm
  have hm1 : (1 : ℝ) < m := by exact_mod_cast (show 1 < m by omega)
  exact (Real.rpow_lt_rpow_left_iff hm1).mpr hk

/-- **A5.** The bound is superpolynomial: for every `c > 0` and every `k`, eventually
`m ^ k < m ^ (c * (log₂ m) ^ (1/3))`. -/
theorem A5 (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) := by
  obtain ⟨m₀, h⟩ := A5_real c hc k
  exact ⟨m₀, fun m hm => by simpa [Real.rpow_natCast] using h m hm⟩

/-- `n ^ a + a` gates are eventually within the bound. -/
theorem not_beyond_poly (c : ℝ) (hc : 0 < c) (a m₀ : ℕ) : ∃ n ≥ m₀, ¬ Beyond c n (n ^ a + a) := by
  obtain ⟨n₁, hn₁⟩ := A5 c hc (a + 1)
  refine ⟨max (max m₀ n₁) (a + 2), le_max_of_le_left (le_max_left _ _), ?_⟩
  set n := max (max m₀ n₁) (a + 2)
  have hn2 : a + 2 ≤ n := le_max_right _ _
  have h1 := hn₁ n (le_max_of_le_left (le_max_right _ _))
  have ha : a < n ^ a :=
    lt_of_lt_of_le Nat.lt_two_pow_self (Nat.pow_le_pow_left (by omega) a)
  have h2 : n ^ a + a ≤ n ^ (a + 1) := by
    calc n ^ a + a ≤ n ^ a * 2 := by omega
      _ ≤ n ^ a * n := Nat.mul_le_mul_left _ (by omega)
      _ = n ^ (a + 1) := (pow_succ n a).symm
  unfold Beyond
  rw [not_lt]
  calc ((n ^ a + a : ℕ) : ℝ) ≤ ((n ^ (a + 1) : ℕ) : ℝ) := by exact_mod_cast h2
    _ = (n : ℝ) ^ (a + 1) := by push_cast; rfl
    _ ≤ _ := h1.le

/-- **A6.** From `MainTheorem` alone: over every field the Hamiltonian-cycle family
(`vars n = Fin n × Fin n`, `poly n = hc F n`) is not in VP, and over every field of characteristic
`≠ 2` the permanent family (`poly n = perm F n`) is not in VP. -/
theorem A6 (h : MainTheorem.{u}) (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := fun n => hc F n } : Family F) ∉ VP F ∧
      (ringChar F ≠ 2 →
        ({ vars := fun n => Fin n × Fin n, poly := fun n => perm F n } : Family F) ∉ VP F) := by
  obtain ⟨c, hc, hmain⟩ := h
  obtain ⟨m₀, hm₀⟩ := hmain (ringChar F)
  have := ringChar.charP F
  refine ⟨fun ⟨a, ha⟩ => ?_, fun h2 ⟨a, ha⟩ => ?_⟩
  · obtain ⟨n, hn, hb⟩ := not_beyond_poly c hc a m₀
    exact hb ((hm₀ F n hn (n ^ a + a)).1 (ha n).2.2)
  · obtain ⟨n, hn, hb⟩ := not_beyond_poly c hc a m₀
    exact hb ((hm₀ F n hn (n ^ a + a)).2 h2 (ha n).2.2)

/-! ### F4 — the red control R1 -/

/-- The dense power `(Σ_{i,j} X (i, j)) ^ (2 ^ k)` has a circuit of `2 m² − 1 + k` gates,
`m = 2 ^ k`: the `m²` variables, `m² − 1` additions, then `k` squarings. -/
theorem dense_power_computes (R : Type u) [CommSemiring R] (k : ℕ) :
    Computes ((∑ i : Fin (2 ^ k), ∑ j : Fin (2 ^ k), X (i, j) :
      MvPolynomial (Fin (2 ^ k) × Fin (2 ^ k)) R) ^ (2 ^ k)) (2 * (2 ^ k) ^ 2 - 1 + k) := by
  have e : (∑ i : Fin (2 ^ k), ∑ j : Fin (2 ^ k), X (i, j) :
      MvPolynomial (Fin (2 ^ k) × Fin (2 ^ k)) R) = ∑ x ∈ Finset.univ, X x :=
    (Fintype.sum_prod_type _).symm
  have hpos : 0 < 2 ^ k := pow_pos (by norm_num) k
  have hne : (Finset.univ : Finset (Fin (2 ^ k) × Fin (2 ^ k))).Nonempty :=
    ⟨(⟨0, hpos⟩, ⟨0, hpos⟩), Finset.mem_univ _⟩
  have hs := computes_sum_X (R := R) hne
  rw [Finset.card_univ, Fintype.card_prod, Fintype.card_fin, ← pow_two] at hs
  rw [e]
  exact computes_pow_two_pow hs k

/-- The inequality behind R1: for every `c > 0` and `m₀` there is `k` with `m = 2 ^ k ≥ m₀` and
`2 m² − 1 + k ≤ m ^ (c * (log₂ m) ^ (1/3))`. -/
theorem exists_dense_size_le (c : ℝ) (hc : 0 < c) (m₀ : ℕ) : ∃ k : ℕ, m₀ ≤ 2 ^ k ∧
    ((2 * (2 ^ k) ^ 2 - 1 + k : ℕ) : ℝ) ≤
      ((2 ^ k : ℕ) : ℝ) ^ (c * Real.logb 2 ((2 ^ k : ℕ) : ℝ) ^ (1 / 3 : ℝ)) := by
  have h1 : Tendsto (fun k : ℕ => c * (k : ℝ) ^ (1 / 3 : ℝ)) atTop atTop :=
    ((tendsto_rpow_atTop (by norm_num : (0 : ℝ) < 1 / 3)).comp
      tendsto_natCast_atTop_atTop).const_mul_atTop hc
  obtain ⟨k, hk4, hk1, hkm⟩ :=
    ((h1.eventually_ge_atTop 4).and ((eventually_ge_atTop 1).and (eventually_ge_atTop m₀))).exists
  refine ⟨k, le_trans hkm Nat.lt_two_pow_self.le, ?_⟩
  have hlog : Real.logb 2 ((2 ^ k : ℕ) : ℝ) = k := by
    rw [Nat.cast_pow, Nat.cast_ofNat, Real.logb_pow, Real.logb_self_eq_one (by norm_num), mul_one]
  have hm : ((2 ^ k : ℕ) : ℝ) = (2 : ℝ) ^ (k : ℝ) := by
    rw [Real.rpow_natCast]; push_cast; rfl
  rw [hlog, hm, ← Real.rpow_mul (by norm_num)]
  have hB : k < 2 ^ (2 * k) :=
    lt_of_lt_of_le Nat.lt_two_pow_self (Nat.pow_le_pow_right (by norm_num) (by omega))
  have e1 : (2 ^ k) ^ 2 = 2 ^ (2 * k) := by rw [← pow_mul, mul_comm]
  have e2 : 2 ^ (2 * k + 2) = 4 * 2 ^ (2 * k) := by rw [pow_add]; ring
  have hnat : 2 * (2 ^ k) ^ 2 - 1 + k ≤ 2 ^ (2 * k + 2) := by rw [e1, e2]; omega
  have hk1' : (1 : ℝ) ≤ k := by exact_mod_cast hk1
  have hprod : (k : ℝ) * 4 ≤ k * (c * (k : ℝ) ^ (1 / 3 : ℝ)) :=
    mul_le_mul_of_nonneg_left hk4 (Nat.cast_nonneg k)
  calc ((2 * (2 ^ k) ^ 2 - 1 + k : ℕ) : ℝ) ≤ ((2 ^ (2 * k + 2) : ℕ) : ℝ) := by exact_mod_cast hnat
    _ = (2 : ℝ) ^ ((2 * k + 2 : ℕ) : ℝ) := by rw [Real.rpow_natCast]; push_cast; rfl
    _ ≤ (2 : ℝ) ^ ((k : ℝ) * (c * (k : ℝ) ^ (1 / 3 : ℝ))) :=
      Real.rpow_le_rpow_of_exponent_le (by norm_num) (by push_cast; linarith)

/-- The planted claim fails over every commutative semiring: for `m = 2 ^ k`, `k` large, the
repeated-squaring circuit has `2 m² − 1 + k ≤ m ^ (c * (log₂ m) ^ (1/3))` gates. -/
theorem R1_general (R : Type u) [CommSemiring R] : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) R) ^ m) s →
      Beyond c m s := by
  rintro ⟨c, hc, m₀, h⟩
  obtain ⟨k, hmk, hle⟩ := exists_dense_size_le c hc m₀
  exact absurd (h (2 ^ k) hmk _ (dense_power_computes R k)) (not_lt.mpr hle)

/-- **R1 (proved false).** The planted claim "the main bound holds over `ℚ` (characteristic 0)
for the dense power `(Σ_{i,j} X (i, j)) ^ m`" is false. -/
theorem R1 : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) s →
      Beyond c m s :=
  R1_general ℚ

/-- **R1, in `MainTheorem`'s own shape** (every characteristic `p`, every field of characteristic
`p`, the dense power in place of `hc`/`perm`): false, already at `p = 0` with the field
`ULift ℚ`. -/
theorem R1_shape : ¬ ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p],
    ∀ m ≥ m₀, ∀ s : ℕ,
      Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) F) ^ m) s →
        Beyond c m s := by
  rintro ⟨c, hc, h⟩
  obtain ⟨m₀, hm₀⟩ := h 0
  exact R1_general (ULift.{u} ℚ) ⟨c, hc, m₀, fun m hm s hs => hm₀ (ULift.{u} ℚ) m hm s hs⟩

end CertMachine.Anchors

#print axioms CertMachine.Anchors.A1
#print axioms CertMachine.Anchors.A2
#print axioms CertMachine.Anchors.A3
#print axioms CertMachine.Anchors.A4
#print axioms CertMachine.Anchors.A5
#print axioms CertMachine.Anchors.A6
#print axioms CertMachine.Anchors.R1
#print axioms CertMachine.Anchors.R1_general
#print axioms CertMachine.Anchors.R1_shape
#print axioms CertMachine.Anchors.A1_any
#print axioms CertMachine.Anchors.A5_real
