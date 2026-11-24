/-
Reader tests (Author D, VP ≠ VNP lane, cert-machine, 2026-11-24): the Lean tests T4–T23 proposed in
corpus/vp-vnp/reader/REPORT.md section C, elaborated against the release (Lean v4.33.1, Mathlib 0df444a3).
T1, T2, T3, T7s, T11a, T12 are Author C's (anchors) and are not here. Each theorem is named after its test;
helper lemmas carry plain names. Statements are the reader's, except where WORKLOG.md says how and why.
-/
import Solution

open Statement MvPolynomial

universe u

namespace CertMachine.ReaderTests

/-! ## T21: the bridges Solution relies on are definitional -/

theorem T21_VP {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ Solution.toNc f ∈ Nc.VP F := Iff.rfl
theorem T21_VNP {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VNP F ↔ Solution.toNc f ∈ Nc.VNP F := Iff.rfl
theorem T21_VPBar {F : Type u} [Field F] (f : Family F) : f ∈ VPBar F ↔ Solution.toNc f ∈ Paper.VPBar F := Iff.rfl
theorem T21_hc {F : Type u} [Field F] (m : ℕ) : hc F m = Nc.genHC F m := rfl
theorem T21_perm {F : Type u} [Field F] (m : ℕ) : perm F m = Nc.genPerm F m := rfl


theorem T21_Computes {R : Type u} {V : Type} [CommSemiring R] (f : MvPolynomial V R) (s : ℕ) :
    Computes f s ↔ Nc.Computes f s := Iff.rfl
theorem T21_Approximates {F : Type u} {V : Type} [Field F] (f : MvPolynomial V F) (s : ℕ) :
    Approximates f s ↔ Nc.Approximates f s := Iff.rfl
theorem T21_ofNc_toNc {F : Type u} [CommSemiring F] (f : Family F) : Solution.ofNc (Solution.toNc f) = f := rfl
theorem T21_VP' {F : Type u} [CommSemiring F] (g : Nc.Family F) : Solution.ofNc g ∈ VP F ↔ g ∈ Nc.VP F := Iff.rfl
theorem T21_VNP' {F : Type u} [CommSemiring F] (g : Nc.Family F) : Solution.ofNc g ∈ VNP F ↔ g ∈ Nc.VNP F :=
  Iff.rfl
theorem T21_VPBar' {F : Type u} [Field F] (g : Nc.Family F) : Solution.ofNc g ∈ VPBar F ↔ g ∈ Paper.VPBar F :=
  Iff.rfl
theorem T21_permanent_over_real :
    (∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ, Computes (perm ℝ m) s → Beyond c m s) ↔
    (∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
      Nc.Computes (∑ σ : Equiv.Perm (Fin m), ∏ i, MvPolynomial.X (σ i, i) : MvPolynomial (Fin m × Fin m) ℝ) s →
        (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) < s) := Iff.rfl

/-! ## T19: ⊂ is proper inclusion -/

theorem T19 {α : Type*} (A B : Set α) : A ⊂ B ↔ A ⊆ B ∧ ¬ B ⊆ A := ssubset_iff_subset_not_subset

/-! ## T14: `.coeff` is the coefficient of ε ^ i -/

theorem T14a {F : Type} [Field F] (a : LaurentSeries F) (i : ℤ) : a.coeff i = HahnSeries.coeff a i := rfl

theorem T14b {F : Type} [Field F] : (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 1 = 1 ∧
    (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 0 = 0 :=
  ⟨HahnSeries.coeff_single_same _ _, HahnSeries.coeff_single_of_ne (by norm_num)⟩

/-! ## T6: hc is HC_m -/

theorem T6a (F : Type u) [CommSemiring F] (k : ℕ) : hc F (k + 1) =
    ∑ π : Equiv.Perm (Fin (k + 1)) with π 0 = 0, ∏ i, X (π i, π (finRotate (k + 1) i)) :=
  Nc.Hc.sum_cycles_eq_sum_orders (fun a b => (X (a, b) : MvPolynomial (Fin (k + 1) × Fin (k + 1)) F))

open Classical in
theorem T6b (k : ℕ) : (Finset.univ.filter fun σ : Equiv.Perm (Fin (k + 1)) => σ.IsCycleOn Set.univ).card
    = k.factorial := by
  have h := Nc.Hc.sum_cycles_eq_sum_orders (R := ℕ) (k := k) (fun _ _ => 1)
  unfold Nc.Hc.hcSum at h
  simp only [Finset.prod_const_one, Finset.sum_const, smul_eq_mul, mul_one] at h
  rw [h]
  have e : {x : Fin (k + 1) × Equiv.Perm (Fin k) // x.1 = 0} ≃ {π : Equiv.Perm (Fin (k + 1)) // π 0 = 0} :=
    Equiv.subtypeEquiv Equiv.Perm.decomposeFin.symm fun x => by
      obtain ⟨p, e⟩ := x
      simp [Equiv.Perm.decomposeFin_symm_apply_zero]
  have e2 : {x : Fin (k + 1) × Equiv.Perm (Fin k) // x.1 = 0} ≃ Equiv.Perm (Fin k) :=
    { toFun := fun x => x.1.2
      invFun := fun σ => ⟨(0, σ), rfl⟩
      left_inv := fun x => by obtain ⟨⟨p, σ⟩, hp⟩ := x; simp only at hp; subst hp; rfl
      right_inv := fun σ => rfl }
  rw [← Fintype.card_subtype, ← Fintype.card_congr e, Fintype.card_congr e2, Fintype.card_perm,
    Fintype.card_fin]

theorem T6_value (F : Type) [Field F] : hc F 2 = X (0, 1) * X (1, 0) := by
  show hc F (1 + 1) = _
  rw [T6a]
  have hS : (Finset.univ.filter fun π : Equiv.Perm (Fin (1 + 1)) => π 0 = 0) = {1} := by
    decide
  rw [hS, Finset.sum_singleton]
  simp [Fin.prod_univ_two]

theorem T6_planted_refuted (F : Type) [Field F] : hc F 2 ≠ X (0, 0) * X (1, 1) := by
  rw [T6_value]
  intro h
  have := congrArg (MvPolynomial.eval fun p : Fin 2 × Fin 2 => if p.1 = p.2 then (1 : F) else 0) h
  simp at this

/-! ## T7: Beyond at m = 0, 1, and monotone in c -/

theorem T7_zero (c : ℝ) (s : ℕ) : Beyond c 0 s ↔ 1 < s := by simp [Beyond]
theorem T7_one (c : ℝ) (s : ℕ) : Beyond c 1 s ↔ 1 < s := by simp [Beyond]

theorem T7m {c c' : ℝ} (h : c' ≤ c) {m s : ℕ} (hm : 2 ≤ m) : Beyond c m s → Beyond c' m s := by
  unfold Beyond
  intro hs
  have hm1 : (1 : ℝ) ≤ m := by exact_mod_cast (by omega : 1 ≤ m)
  refine lt_of_le_of_lt (Real.rpow_le_rpow_of_exponent_le hm1 ?_) hs
  exact mul_le_mul_of_nonneg_right h (Real.rpow_nonneg (Real.logb_nonneg (by norm_num) hm1) _)

/-! ## T5: perm is PERM_m of §1 -/

theorem T5 (F : Type u) [CommSemiring F] (m : ℕ) :
    perm F m = ∑ σ : Equiv.Perm (Fin m), ∏ i, X (i, σ i) := by
  unfold perm
  refine Fintype.sum_equiv (Equiv.inv (Equiv.Perm (Fin m))) _ _ fun σ => ?_
  show ∏ i, X (σ i, i) = ∏ i, X (i, σ⁻¹ i)
  rw [← Equiv.prod_comp σ (fun j => (X (j, σ⁻¹ j) : MvPolynomial (Fin m × Fin m) F))]
  simp

/-! ## T8: p neither 0 nor prime is vacuous -/

theorem T8 (p : ℕ) (hp : ¬ (p = 0 ∨ p.Prime)) (F : Type u) [Field F] : ¬ CharP F p :=
  fun _ => hp (CharP.char_is_prime_or_zero F p).symm

/-! ## T10: Theorem L.1 is an instance of MainTheorem -/

theorem T10 : ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ, Computes (perm ℝ m) s → Beyond c m s := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheorem.{0}
  obtain ⟨m₀, h⟩ := h 0
  exact ⟨c, hc, m₀, fun m hm s hs => (h ℝ m hm s).2 (by norm_num) hs⟩

/-! ## Helpers, then T13, T16, T17, T11b -/

/-- Helper: padding, from the release's own lemma (the bodies of `Computes` and `Nc.Computes` agree). -/
theorem computes_mono {R : Type u} {V : Type} [CommSemiring R] {f : MvPolynomial V R} {s t : ℕ}
    (h : Computes f s) (hst : s ≤ t) : Computes f t :=
  Nc.Computes.mono h hst

theorem approximates_mono {F : Type u} {V : Type} [Field F] {f : MvPolynomial V F} {s t : ℕ}
    (h : Approximates f s) (hst : s ≤ t) : Approximates f t := by
  obtain ⟨q, hq, hc⟩ := h
  exact ⟨q, computes_mono hq hst, hc⟩

theorem pow_add_self_mono {a b : ℕ} (h : a ≤ b) (n : ℕ) : n ^ a + a ≤ n ^ b + b := by
  rcases Nat.eq_zero_or_pos n with rfl | hn
  · rcases Nat.eq_zero_or_pos a with rfl | ha
    · rcases Nat.eq_zero_or_pos b with rfl | hb
      · simp
      · simp [hb.ne']
        omega
    · rw [zero_pow ha.ne', zero_pow (by omega : b ≠ 0)]
      omega
  · have := Nat.pow_le_pow_right hn h
    omega

-- T13
theorem T13 {F : Type u} {V : Type} [Field F] (f : MvPolynomial V F) (s : ℕ) : Approximates f s ↔
    ∃ g : MvPolynomial V (PowerSeries F), Computes (map HahnSeries.C f +
      C (HahnSeries.single (1 : ℤ) (1 : F)) * map (HahnSeries.ofPowerSeries ℤ F) g) s := by
  -- the coefficient of `ε * g` at `i` is that of `g` at `i - 1`, and nothing at `i ≤ 0`
  have key : ∀ (p : PowerSeries F) (i : ℤ),
      (HahnSeries.single (1 : ℤ) (1 : F) * HahnSeries.ofPowerSeries ℤ F p).coeff i =
        if i ≤ 0 then 0 else PowerSeries.coeff (i - 1).natAbs p := by
    intro p i
    rw [HahnSeries.coeff_single_mul, one_mul]
    have := PowerSeries.coeff_coe p (i - 1)
    rw [this]
    by_cases hi : i ≤ 0
    · rw [if_pos (by omega), if_pos hi]
    · rw [if_neg (by omega), if_neg hi]
  have hC : ∀ (a : F) (i : ℤ), (HahnSeries.C a : LaurentSeries F).coeff i = if i = 0 then a else 0 := by
    intro a i
    by_cases hi : i = 0
    · subst hi
      simp [HahnSeries.C_apply]
    · rw [if_neg hi, HahnSeries.C_apply, HahnSeries.coeff_single_of_ne hi]
  constructor
  · rintro ⟨q, hq, hc⟩
    let φ : LaurentSeries F → PowerSeries F := fun a => PowerSeries.mk fun n => a.coeff (n + 1)
    have hφ0 : φ 0 = 0 := by
      ext n
      simp [φ]
    let g : MvPolynomial V (PowerSeries F) := ∑ d ∈ q.support, monomial d (φ (coeff d q))
    have hg : ∀ d, coeff d g = φ (coeff d q) := by
      intro d
      classical
      simp only [g, coeff_sum, coeff_monomial]
      rw [Finset.sum_ite_eq']
      by_cases hd : d ∈ q.support
      · rw [if_pos hd]
      · rw [if_neg hd, show coeff d q = 0 by simpa using hd, hφ0]
    refine ⟨g, ?_⟩
    convert hq using 1
    ext d i
    rw [coeff_add, coeff_map, coeff_C_mul, coeff_map, hg, HahnSeries.coeff_add, hC, key]
    by_cases hi : i ≤ 0
    · rw [if_pos hi, add_zero, hc d i hi]
    · rw [if_neg hi, if_neg (by omega), zero_add]
      obtain ⟨n, rfl⟩ : ∃ n : ℕ, i = n + 1 := ⟨(i - 1).toNat, by omega⟩
      simp [φ, PowerSeries.coeff_mk]
  · rintro ⟨g, hg⟩
    refine ⟨_, hg, fun d i hi => ?_⟩
    rw [coeff_add, coeff_map, coeff_C_mul, coeff_map, HahnSeries.coeff_add, hC, key, if_pos hi, add_zero]

-- T16a: a degree lemma first
theorem totalDegree_aeval_le {σ τ R : Type*} [CommSemiring R] (φ : σ → MvPolynomial τ R)
    (hφ : ∀ v, (φ v).totalDegree ≤ 1) (p : MvPolynomial σ R) : (aeval φ p).totalDegree ≤ p.totalDegree := by
  conv_lhs => rw [p.as_sum]
  rw [map_sum]
  refine (totalDegree_finsetSum _ _).trans (Finset.sup_le fun d hd => ?_)
  rw [aeval_monomial]
  refine (totalDegree_mul _ _).trans ?_
  rw [algebraMap_eq, totalDegree_C, zero_add]
  refine le_trans ?_ (le_totalDegree hd)
  simp only [Finsupp.prod, Finsupp.sum]
  refine (totalDegree_finsetProd _ _).trans (Finset.sum_le_sum fun v _ => (totalDegree_pow _ _).trans ?_)
  exact (Nat.mul_le_mul_left _ (hφ v)).trans (by simp)

theorem T16a {F : Type u} [Field F] {f : Family F} (hf : f ∈ VNP F) :
    ∃ a : ℕ, ∀ n, Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a := by
  obtain ⟨r, g, ⟨a, ha⟩, hfg⟩ := hf
  refine ⟨a, fun n => ⟨?_, ?_⟩⟩
  · have h1 := (ha n).1
    change Fintype.card (f.vars n ⊕ Fin (r n)) ≤ _ at h1
    rw [Fintype.card_sum] at h1
    omega
  · rw [hfg n]
    refine (totalDegree_finsetSum _ _).trans (Finset.sup_le fun e _ => ?_)
    refine (totalDegree_aeval_le _ ?_ _).trans (ha n).2.1
    intro v
    cases v with
    | inl x => exact (totalDegree_X (R := F) x).le
    | inr i =>
      simp only [Sum.elim_inr]
      split_ifs <;> simp

def VPBar' (F : Type u) [Field F] : Set (Family F) := {f | ∃ a : ℕ, ∀ n, Approximates (f.poly n) (n ^ a + a)}

theorem T16 (F : Type u) [Field F] : VNP F ⊆ VPBar F ↔ VNP F ⊆ VPBar' F := by
  constructor
  · intro h f hf
    obtain ⟨a, ha⟩ := h hf
    exact ⟨a, fun n => (ha n).2.2⟩
  · intro h f hf
    obtain ⟨a1, h1⟩ := h hf
    obtain ⟨a2, h2⟩ := T16a hf
    refine ⟨a1 + a2, fun n => ⟨?_, ?_, ?_⟩⟩
    · exact (h2 n).1.trans (pow_add_self_mono (by omega) n)
    · exact (h2 n).2.trans (pow_add_self_mono (by omega) n)
    · exact approximates_mono (h1 n) (pow_add_self_mono (by omega) n)

-- T17
theorem shift_bound (c k : ℕ) : ∃ a, ∀ n, (n + c) ^ k ≤ n ^ a + a := by
  have h2k : 1 ≤ 2 ^ k := Nat.one_le_two_pow
  refine ⟨k + 1 + (2 ^ k + c + c) ^ k, fun n => ?_⟩
  rcases lt_or_ge n (2 ^ k + c) with h | h
  · have : (n + c) ^ k ≤ (2 ^ k + c + c) ^ k := Nat.pow_le_pow_left (by omega) k
    calc (n + c) ^ k ≤ (2 ^ k + c + c) ^ k := this
      _ ≤ k + 1 + (2 ^ k + c + c) ^ k := by omega
      _ ≤ _ := Nat.le_add_left _ _
  · have hn : 1 ≤ n := by omega
    calc (n + c) ^ k ≤ (2 * n) ^ k := Nat.pow_le_pow_left (by omega) k
      _ = 2 ^ k * n ^ k := Nat.mul_pow 2 n k
      _ ≤ n * n ^ k := Nat.mul_le_mul_right _ (by omega)
      _ = n ^ (k + 1) := (pow_succ' n k).symm
      _ ≤ n ^ (k + 1 + (2 ^ k + c + c) ^ k) := Nat.pow_le_pow_right hn (by omega)
      _ ≤ _ := Nat.le_add_right _ _

theorem poly_bound (P : Polynomial ℕ) : ∃ a, ∀ n, P.eval n ≤ n ^ a + a := by
  obtain ⟨a, ha⟩ := shift_bound (P.eval 1 + 1) (P.natDegree + 1)
  refine ⟨a, fun n => le_trans ?_ (ha n)⟩
  have h1 : P.eval n ≤ P.eval 1 * (n + 1) ^ P.natDegree := by
    rw [Polynomial.eval_eq_sum_range, Polynomial.eval_eq_sum_range (x := 1), Finset.sum_mul]
    refine Finset.sum_le_sum fun i hi => ?_
    rw [one_pow, mul_one]
    refine Nat.mul_le_mul_left _ ((Nat.pow_le_pow_left (Nat.le_succ n) i).trans ?_)
    exact Nat.pow_le_pow_right (by omega) (Nat.lt_succ_iff.1 (Finset.mem_range.1 hi))
  refine h1.trans ?_
  rw [pow_succ']
  exact Nat.mul_le_mul (by omega) (Nat.pow_le_pow_left (by omega) _)

theorem T17 {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ ∃ P : Polynomial ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ P.eval n ∧ (f.poly n).totalDegree ≤ P.eval n ∧
      Computes (f.poly n) (P.eval n) := by
  constructor
  · rintro ⟨a, ha⟩
    refine ⟨Polynomial.X ^ a + Polynomial.C a, fun n => ?_⟩
    simpa using ha n
  · rintro ⟨P, hP⟩
    obtain ⟨a, ha⟩ := poly_bound P
    exact ⟨a, fun n => ⟨(hP n).1.trans (ha n), (hP n).2.1.trans (ha n), computes_mono (hP n).2.2 (ha n)⟩⟩

-- T11b
section T11b

variable {F : Type} [Field F] {m : ℕ}

/-- The point that puts 1 on the edges `(i, finRotate m i)` with `i ∈ S`, and 0 elsewhere. -/
def rotPoint (m : ℕ) (S : Finset (Fin m)) : Fin m × Fin m → F :=
  fun p => if p.2 = finRotate m p.1 ∧ p.1 ∈ S then 1 else 0

theorem finRotate_isCycleOn (hm : 2 ≤ m) : (finRotate m).IsCycleOn Set.univ := by
  have h := (isCycle_finRotate_of_le hm).isCycleOn
  have e : {x | finRotate m x ≠ x} = Set.univ := by
    ext x
    simp only [Set.mem_ofPred_eq, Set.mem_univ, iff_true]
    exact Equiv.Perm.mem_support.1 (by rw [support_finRotate_of_le hm]; exact Finset.mem_univ x)
  rwa [e] at h

theorem eval_hc_univ (hm : 2 ≤ m) : eval (rotPoint (F := F) m Finset.univ) (hc F m) = 1 := by
  classical
  unfold hc
  rw [map_sum]
  rw [Finset.sum_eq_single (finRotate m)]
  · rw [map_prod]
    exact Finset.prod_eq_one fun i _ => by simp [rotPoint]
  · intro σ _ hσ
    obtain ⟨i, hi⟩ : ∃ i, σ i ≠ finRotate m i := by
      by_contra h
      push Not at h
      exact hσ (Equiv.ext h)
    rw [map_prod]
    exact Finset.prod_eq_zero (Finset.mem_univ i) (by simp only [eval_X, rotPoint, Finset.mem_univ, and_true, if_neg hi])
  · intro h
    exfalso
    apply h
    rw [Finset.mem_filter]
    exact ⟨Finset.mem_univ _, finRotate_isCycleOn hm⟩

theorem eval_hc_miss {S : Finset (Fin m)} {i₀ : Fin m} (hi₀ : i₀ ∉ S) :
    eval (rotPoint (F := F) m S) (hc F m) = 0 := by
  unfold hc
  rw [map_sum]
  refine Finset.sum_eq_zero fun σ _ => ?_
  rw [map_prod]
  exact Finset.prod_eq_zero (Finset.mem_univ i₀) (by simp [rotPoint, hi₀])

theorem hc_ne_C (hm : 2 ≤ m) (a : F) : hc F m ≠ C a := by
  intro h
  have h1 := eval_hc_univ (F := F) hm
  have h0 := eval_hc_miss (F := F) (m := m) (S := ∅) (i₀ := ⟨0, by omega⟩) (Finset.notMem_empty _)
  rw [h, eval_C] at h1 h0
  exact one_ne_zero (h1.symm.trans h0)

theorem hc_ne_X (hm : 2 ≤ m) (v : Fin m × Fin m) : hc F m ≠ X v := by
  intro h
  have h1 := eval_hc_univ (F := F) hm
  rw [h, eval_X] at h1
  have hv : v.2 = finRotate m v.1 := by
    unfold rotPoint at h1
    by_contra hv
    rw [if_neg (fun h => hv h.1)] at h1
    exact zero_ne_one h1
  have hne : finRotate m v.1 ≠ v.1 :=
    Equiv.Perm.mem_support.1 (by rw [support_finRotate_of_le hm]; exact Finset.mem_univ _)
  have h0 := eval_hc_miss (F := F) (S := Finset.univ.erase (finRotate m v.1)) (i₀ := finRotate m v.1)
    (Finset.notMem_erase _ _)
  rw [h, eval_X] at h0
  unfold rotPoint at h0
  rw [if_pos ⟨hv, Finset.mem_erase.2 ⟨hne.symm, Finset.mem_univ _⟩⟩] at h0
  exact one_ne_zero h0

theorem T11b : ∀ (F : Type) [Field F] (m : ℕ), 2 ≤ m → ∀ s, Computes (hc F m) s → Beyond 0 m s := by
  intro F _ m hm s hs
  unfold Beyond
  rw [zero_mul, Real.rpow_zero]
  obtain ⟨l, hl, k, hk, hlk⟩ := hs
  by_contra hs1
  have hs1 : s ≤ 1 := by
    by_contra h
    exact hs1 (by exact_mod_cast (by omega : 1 < s))
  obtain rfl : k = 0 := by omega
  rcases hl 0 hk with ⟨v, hv⟩ | ⟨a, ha⟩ | ⟨i, hi, _⟩ | ⟨i, hi, _⟩
  · exact hc_ne_X hm v (hlk.symm.trans hv)
  · exact hc_ne_C hm a (hlk.symm.trans ha)
  · omega
  · omega

end T11b

/-! ## T18i, T9 (universes), T20, T15 -/

theorem computes_map {R : Type u} {S : Type*} {V : Type} [CommSemiring R] [CommSemiring S] (φ : R →+* S)
    {f : MvPolynomial V R} {s : ℕ} (h : Computes f s) : Computes (MvPolynomial.map φ f) s :=
  Nc.Computes.map φ h

-- T18i
theorem T18i {F : Type u} [CommSemiring F] (g : Family F) (hg : g ∈ VP F) (t : ℕ → ℕ) (b : ℕ)
    (ht : ∀ n, t n ≤ n ^ b + b) :
    ({ vars := fun n => g.vars (t n), poly := fun n => g.poly (t n) } : Family F) ∈ VP F := by
  obtain ⟨a, ha⟩ := hg
  have key : ∀ x y : ℕ, 1 ≤ x → 2 ≤ y → x + y ≤ x * y * y := by
    intro x y hx hy
    calc x + y ≤ x * y + x * y :=
          Nat.add_le_add (Nat.le_mul_of_pos_right x (by omega)) (Nat.le_mul_of_pos_left y (by omega))
      _ = x * y * 2 := by ring
      _ ≤ x * y * y := Nat.mul_le_mul_left _ hy
  have hB : ∀ n, t n ^ a + a ≤ (n + (b + a + 2)) ^ ((b + 2) * a + 2) := by
    intro n
    have hW2 : 2 ≤ n + (b + a + 2) := by omega
    have h1 : n ^ b + b ≤ (n + (b + a + 2)) ^ (b + 2) := by
      have := key ((n + (b + a + 2)) ^ b) (n + (b + a + 2)) (Nat.one_le_pow _ _ (by omega)) hW2
      calc n ^ b + b ≤ (n + (b + a + 2)) ^ b + (n + (b + a + 2)) :=
            Nat.add_le_add (Nat.pow_le_pow_left (by omega) b) (by omega)
        _ ≤ (n + (b + a + 2)) ^ b * (n + (b + a + 2)) * (n + (b + a + 2)) := this
        _ = (n + (b + a + 2)) ^ (b + 2) := by ring
    have h2 : t n ^ a ≤ (n + (b + a + 2)) ^ ((b + 2) * a) := by
      calc t n ^ a ≤ (n ^ b + b) ^ a := Nat.pow_le_pow_left (ht n) a
        _ ≤ ((n + (b + a + 2)) ^ (b + 2)) ^ a := Nat.pow_le_pow_left h1 a
        _ = (n + (b + a + 2)) ^ ((b + 2) * a) := (pow_mul _ (b + 2) a).symm
    have := key ((n + (b + a + 2)) ^ ((b + 2) * a)) (n + (b + a + 2)) (Nat.one_le_pow _ _ (by omega)) hW2
    calc t n ^ a + a ≤ (n + (b + a + 2)) ^ ((b + 2) * a) + (n + (b + a + 2)) := Nat.add_le_add h2 (by omega)
      _ ≤ (n + (b + a + 2)) ^ ((b + 2) * a) * (n + (b + a + 2)) * (n + (b + a + 2)) := this
      _ = (n + (b + a + 2)) ^ ((b + 2) * a + 2) := by ring
  obtain ⟨a', ha'⟩ := shift_bound (b + a + 2) ((b + 2) * a + 2)
  refine ⟨a', fun n => ?_⟩
  have hb := (hB n).trans (ha' n)
  obtain ⟨h1, h2, h3⟩ := ha (t n)
  exact ⟨h1.trans hb, h2.trans hb, computes_mono h3 hb⟩

-- T9a
theorem map_perm {R S : Type*} [CommSemiring R] [CommSemiring S] (φ : R →+* S) (m : ℕ) :
    MvPolynomial.map φ (perm R m) = perm S m := by
  simp only [perm, map_sum, map_prod, map_X]

theorem map_hc {R S : Type*} [CommSemiring R] [CommSemiring S] (φ : R →+* S) (m : ℕ) :
    MvPolynomial.map φ (hc R m) = hc S m := by
  simp only [hc, map_sum, map_prod, map_X]

theorem T9a : MainTheorem.{u} → MainTheorem.{0} := by
  rintro ⟨c, hc, h⟩
  refine ⟨c, hc, fun p => ?_⟩
  obtain ⟨m₀, hm⟩ := h p
  refine ⟨m₀, fun F _ _ m hm' s => ?_⟩
  have hG := hm (ULift.{u} F) m hm' s
  have e : F →+* ULift.{u} F := (ULift.ringEquiv (R := F)).symm.toRingHom
  refine ⟨fun hs => hG.1 ?_, fun hp hs => hG.2 hp ?_⟩
  · have := computes_map e hs
    rwa [map_hc] at this
  · have := computes_map e hs
    rwa [map_perm] at this

-- T9b
theorem T9b (c : ℝ) (p m₀ : ℕ)
    (h : ∀ (F : Type) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s) :
    ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s := by
  intro F _ _ m hm s hs
  obtain ⟨K, _, _, _⟩ := Paper.exists_closed p (CharP.char_is_prime_or_zero F p).symm
  have hs' : Computes (MvPolynomial.map (Int.castRingHom F) (hc ℤ m)) s := by
    rw [map_hc]
    exact hs
  have := Paper.lem_transfer (KK := K) p (Nc.genHC ℤ m) hs'
  rw [Paper.map_genHC] at this
  exact h K m hm s this

/-- Extension of T9b (not in the reader's list): the whole of MainTheorem passes from universe 0 to every
universe, with the same `c` and the same `m₀`, through the release's `Paper.lem_transfer`. -/
theorem T9c : MainTheorem.{0} → MainTheorem.{u} := by
  rintro ⟨c, hc, h⟩
  refine ⟨c, hc, fun p => ?_⟩
  obtain ⟨m₀, hM0⟩ := h p
  refine ⟨m₀, fun F _ _ m hm' s => ⟨fun hs => ?_, fun hp hs => ?_⟩⟩
  · exact T9b c p m₀ (fun K _ _ k hk t => (hM0 K k hk t).1) F m hm' s hs
  · obtain ⟨K, _, _, _⟩ := Paper.exists_closed p (CharP.char_is_prime_or_zero F p).symm
    have hs' : Computes (MvPolynomial.map (Int.castRingHom F) (Paper.permInt m)) s := by
      rw [Paper.map_permInt]
      exact hs
    have := Paper.lem_transfer (KK := K) p (Paper.permInt m) hs'
    rw [Paper.map_permInt] at this
    exact (hM0 K m hm' s).2 hp this

-- T20
theorem T20a (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := hc F } : Family F) ∈ VNP F :=
  Paper.hc_mem_VNP F

theorem T20b : MainTheorem.{u} → Separation.{u} := by
  intro hM F _
  refine ⟨fun f hf => (Paper.vp_subset_vnp F (hf : Solution.toNc f ∈ Nc.VP F) : Solution.toNc f ∈ Nc.VNP F),
    fun h => ?_⟩
  obtain ⟨C, hC⟩ := h (T20a F)
  obtain ⟨p, _⟩ := CharP.exists F
  obtain ⟨c, hc, hall⟩ := hM
  obtain ⟨m₀, hlow⟩ := hall p
  obtain ⟨m, hm1, hm2⟩ := Paper.exists_beyond_poly hc m₀ C
  exact hm2 ((hlow F m hm1 _).1 (hC m).2.2)

theorem T20c : MainTheoremApprox.{u} → SeparationClosure.{u} := by
  intro hM F _ h
  obtain ⟨C, hC⟩ := h (T20a F)
  obtain ⟨p, _⟩ := CharP.exists F
  obtain ⟨c, hc, hall⟩ := hM
  obtain ⟨m₀, hlow⟩ := hall p
  obtain ⟨m, hm1, hm2⟩ := Paper.exists_beyond_poly hc m₀ C
  exact hm2 ((hlow F m hm1 _).1 (hC m).2.2)

-- T15
def ApproxRat {F : Type} [Field F] {V : Type} (f : MvPolynomial V F) (s : ℕ) : Prop :=
  ∃ g : MvPolynomial V (Polynomial F), Computes (map (algebraMap (Polynomial F) (RatFunc F)) g) s ∧
    map (Polynomial.evalRingHom 0) g = f

open scoped RatFunc in
theorem T15 {F : Type} [Field F] {V : Type} {f : MvPolynomial V F} {s : ℕ} :
    ApproxRat f s → Approximates f s := by
  rintro ⟨g, hg, rfl⟩
  refine ⟨map (algebraMap (RatFunc F) (LaurentSeries F)) (map (algebraMap (Polynomial F) (RatFunc F)) g),
    computes_map _ hg, fun d i hi => ?_⟩
  rw [coeff_map, coeff_map, ← IsScalarTower.algebraMap_apply, Polynomial.algebraMap_hahnSeries_apply, coeff_map]
  have := PowerSeries.coeff_coe ((coeff d g : Polynomial F) : PowerSeries F) i
  rw [this]
  rcases eq_or_lt_of_le hi with rfl | hlt
  · simp [Polynomial.coeff_zero_eq_eval_zero]
  · rw [if_pos hlt, if_neg hlt.ne]

/-! ## T18ii: the separation is by circuit size alone -/

theorem T18ii : Separation.{u} → ∀ (F : Type u) [Field F], ∃ f ∈ VNP F, (∃ a : ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a) ∧
    ∀ a : ℕ, ∃ n, ¬ Computes (f.poly n) (n ^ a + a) := by
  intro hS F _
  obtain ⟨f, hf, hnot⟩ := Set.exists_of_ssubset (hS F)
  obtain ⟨b, hb⟩ := T16a hf
  refine ⟨f, hf, ⟨b, hb⟩, fun a => ?_⟩
  by_contra h
  simp only [not_exists, not_not] at h
  exact hnot ⟨a + b, fun n => ⟨(hb n).1.trans (pow_add_self_mono (by omega) n),
    (hb n).2.trans (pow_add_self_mono (by omega) n), computes_mono (h n) (pow_add_self_mono (by omega) n)⟩⟩

/-! ## T23: renaming the variables along an equivalence preserves VP, VNP and VPBar -/

section T23

/-- The family `f` with its variables renamed along `e n : f.vars n ≃ W n`. -/
noncomputable def renameFamily {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) : Family F :=
  { vars := W, poly := fun n => rename (e n) (f.poly n) }

theorem rename_symm_rename {R : Type u} [CommSemiring R] {α β : Type} (e : α ≃ β) (p : MvPolynomial α R) :
    rename e.symm (rename e p) = p := by
  rw [rename_rename]
  simp

theorem vp_rename {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) (hf : f ∈ VP F) : renameFamily f W e ∈ VP F := by
  obtain ⟨a, ha⟩ := hf
  refine ⟨a, fun n => ⟨?_, ?_, ?_⟩⟩
  · show Fintype.card (W n) ≤ _
    rw [← Fintype.card_congr (e n)]
    exact (ha n).1
  · exact (totalDegree_rename_le _ _).trans (ha n).2.1
  · exact Nc.Computes.rename _ (ha n).2.2

theorem vp_of_rename {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) (h : renameFamily f W e ∈ VP F) : f ∈ VP F := by
  obtain ⟨a, ha⟩ := h
  refine ⟨a, fun n => ⟨?_, ?_, ?_⟩⟩
  · have h1 : Fintype.card (W n) ≤ _ := (ha n).1
    rwa [← Fintype.card_congr (e n)] at h1
  · have h2 := (totalDegree_rename_le (e n).symm (rename (e n) (f.poly n))).trans (ha n).2.1
    rwa [rename_symm_rename] at h2
  · have h3 : Computes (rename (e n).symm (rename (e n) (f.poly n))) _ := Nc.Computes.rename (e n).symm (ha n).2.2
    rwa [rename_symm_rename] at h3

theorem T23_VP {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) : renameFamily f W e ∈ VP F ↔ f ∈ VP F :=
  ⟨vp_of_rename f W e, vp_rename f W e⟩

theorem rename_aeval_bits {F : Type u} [CommSemiring F] {α β : Type} {r : ℕ} (e : α ≃ β) (b : Fin r → Bool)
    (p : MvPolynomial (α ⊕ Fin r) F) :
    rename e (aeval (Sum.elim X fun i => if b i then 1 else 0 : α ⊕ Fin r → MvPolynomial α F) p) =
      aeval (Sum.elim X fun i => if b i then 1 else 0 : β ⊕ Fin r → MvPolynomial β F)
        (rename (Equiv.sumCongr e (Equiv.refl (Fin r))) p) := by
  rw [aeval_rename, ← AlgHom.comp_apply, comp_aeval]
  refine congrArg (fun φ => aeval φ p) (funext fun i => ?_)
  cases i with
  | inl x => simp
  | inr i =>
    simp only [Function.comp_apply, Equiv.sumCongr_apply, Sum.map_inr, Equiv.refl_apply, Sum.elim_inr]
    split_ifs <;> simp

theorem vnp_rename {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) (hf : f ∈ VNP F) : renameFamily f W e ∈ VNP F := by
  obtain ⟨r, g, hg, hfg⟩ := hf
  refine ⟨r, fun n => rename (Equiv.sumCongr (e n) (Equiv.refl (Fin (r n)))) (g n), ?_, fun n => ?_⟩
  · obtain ⟨a, ha⟩ := hg
    refine ⟨a, fun n => ⟨?_, ?_, ?_⟩⟩
    · show Fintype.card (W n ⊕ Fin (r n)) ≤ _
      have h1 : Fintype.card (f.vars n ⊕ Fin (r n)) ≤ _ := (ha n).1
      rw [Fintype.card_sum] at h1 ⊢
      rw [← Fintype.card_congr (e n)]
      exact h1
    · exact (totalDegree_rename_le _ _).trans (ha n).2.1
    · exact Nc.Computes.rename _ (ha n).2.2
  · show rename (e n) (f.poly n) = _
    rw [hfg n, map_sum]
    exact Finset.sum_congr rfl fun x _ => rename_aeval_bits (e n) x (g n)

theorem renameFamily_symm {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) : renameFamily (renameFamily f W e) f.vars (fun n => (e n).symm) = f := by
  obtain ⟨vars, poly⟩ := f
  have h : (fun n => rename (e n).symm (rename (e n) (poly n))) = poly :=
    funext fun n => rename_symm_rename _ _
  simp only [renameFamily]
  congr 1

theorem T23_VNP {F : Type u} [CommSemiring F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) : renameFamily f W e ∈ VNP F ↔ f ∈ VNP F := by
  refine ⟨fun h => ?_, vnp_rename f W e⟩
  have := vnp_rename (renameFamily f W e) f.vars (fun n => (e n).symm) h
  rwa [renameFamily_symm] at this

theorem approximates_rename {F : Type u} [Field F] {α β : Type} (e : α ≃ β) {p : MvPolynomial α F} {s : ℕ}
    (h : Approximates p s) : Approximates (rename e p) s := by
  obtain ⟨q, hq, hc⟩ := h
  refine ⟨rename e q, Nc.Computes.rename _ hq, fun d i hi => ?_⟩
  have hd : d = (d.mapDomain e.symm).mapDomain e := by
    rw [← Finsupp.mapDomain_comp]
    simp
  rw [hd, coeff_rename_mapDomain _ e.injective, coeff_rename_mapDomain _ e.injective]
  exact hc _ i hi

theorem vpbar_rename {F : Type u} [Field F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) (hf : f ∈ VPBar F) : renameFamily f W e ∈ VPBar F := by
  obtain ⟨a, ha⟩ := hf
  refine ⟨a, fun n => ⟨?_, ?_, ?_⟩⟩
  · show Fintype.card (W n) ≤ _
    rw [← Fintype.card_congr (e n)]
    exact (ha n).1
  · exact (totalDegree_rename_le _ _).trans (ha n).2.1
  · exact approximates_rename _ (ha n).2.2

theorem T23_VPBar {F : Type u} [Field F] (f : Family F) (W : ℕ → Type) [∀ n, Fintype (W n)]
    (e : ∀ n, f.vars n ≃ W n) : renameFamily f W e ∈ VPBar F ↔ f ∈ VPBar F := by
  refine ⟨fun h => ?_, vpbar_rename f W e⟩
  have := vpbar_rename (renameFamily f W e) f.vars (fun n => (e n).symm) h
  rwa [renameFamily_symm] at this

/-- The reader's instance: variables renamed to `Fin k` along `Fintype.equivFin`. -/
theorem T23_fin {F : Type u} [Field F] (f : Family F) :
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VP F ↔ f ∈ VP F) ∧
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VNP F ↔ f ∈ VNP F) ∧
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VPBar F ↔
      f ∈ VPBar F) :=
  ⟨T23_VP _ _ _, T23_VNP _ _ _, T23_VPBar _ _ _⟩

end T23


/-! ## T4: operation counts (inputs and constants free, operations +, −, ×) -/

section T4

variable {R : Type u} {V : Type} [CommRing R]

/-- `p` may be read by operation `k`: an earlier result, a variable or a constant (inputs are free). -/
def IsOperand (l : ℕ → MvPolynomial V R) (k : ℕ) (p : MvPolynomial V R) : Prop :=
  (∃ i < k, p = l i) ∨ (∃ v, p = X v) ∨ (∃ a, p = C a)

/-- A straight-line program with `L` operations `+`, `−`, `×` computes `f`: each operation reads two operands
(earlier results, variables or constants), and `f` is an operand after the last one. -/
def ComputesOps (f : MvPolynomial V R) (L : ℕ) : Prop :=
  ∃ l : ℕ → MvPolynomial V R,
    (∀ k < L, ∃ p q, IsOperand l k p ∧ IsOperand l k q ∧ (l k = p + q ∨ l k = p - q ∨ l k = p * q)) ∧
      IsOperand l L f

theorem T4b {f : MvPolynomial V R} {s : ℕ} (h : Computes f s) : ComputesOps f s := by
  obtain ⟨l, hl, k, hk, hlk⟩ := h
  refine ⟨l, fun k hk => ?_, Or.inl ⟨k, hk, hlk.symm⟩⟩
  rcases hl k hk with ⟨v, hv⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, e⟩ | ⟨i, hi, j, hj, e⟩
  · exact ⟨X v, C 0, Or.inr (Or.inl ⟨v, rfl⟩), Or.inr (Or.inr ⟨0, rfl⟩), Or.inl (by rw [hv, C_0, add_zero])⟩
  · exact ⟨C a, C 0, Or.inr (Or.inr ⟨a, rfl⟩), Or.inr (Or.inr ⟨0, rfl⟩), Or.inl (by rw [ha, C_0, add_zero])⟩
  · exact ⟨l i, l j, Or.inl ⟨i, hi, rfl⟩, Or.inl ⟨j, hj, rfl⟩, Or.inl e⟩
  · exact ⟨l i, l j, Or.inl ⟨i, hi, rfl⟩, Or.inl ⟨j, hj, rfl⟩, Or.inr (Or.inr e)⟩

open Classical in
/-- An input gate for `x` if `x` is a variable or a constant, and the constant 0 otherwise. -/
noncomputable def inGate (x : MvPolynomial V R) : MvPolynomial V R :=
  if (∃ v, x = X v) ∨ (∃ a, x = C a) then x else C 0

theorem inGate_step (x : MvPolynomial V R) : (∃ v, inGate x = X v) ∨ (∃ a, inGate x = C a) := by
  unfold inGate
  split_ifs with h
  · exact h
  · exact Or.inr ⟨0, rfl⟩

theorem inGate_eq {x : MvPolynomial V R} (h : (∃ v, x = X v) ∨ (∃ a, x = C a)) : inGate x = x := by
  unfold inGate
  rw [if_pos h]

theorem T4a {f : MvPolynomial V R} {L : ℕ} (h : ComputesOps f L) : Computes f (5 * L + 1) := by
  obtain ⟨l, hl, hf⟩ := h
  choose! p q hp hq hop using hl
  let M : ℕ → MvPolynomial V R := fun n =>
    if n % 5 = 0 then (if n / 5 < L then inGate (p (n / 5)) else inGate f)
    else if n % 5 = 1 then inGate (q (n / 5))
    else if n % 5 = 2 then C (-1)
    else if n % 5 = 3 then C (-1) * q (n / 5)
    else l (n / 5)
  have M0 : ∀ k < L, M (5 * k) = inGate (p k) := fun k hk => by
    simp only [M, show 5 * k % 5 = 0 by omega, show 5 * k / 5 = k by omega, if_pos hk, if_true]
  have M0' : M (5 * L) = inGate f := by
    simp only [M, show 5 * L % 5 = 0 by omega, show 5 * L / 5 = L by omega, lt_irrefl, if_false, if_true]
  have M1 : ∀ k, M (5 * k + 1) = inGate (q k) := fun k => by
    simp only [M, show (5 * k + 1) % 5 = 1 by omega, show (5 * k + 1) / 5 = k by omega]
    rfl
  have M2 : ∀ k, M (5 * k + 2) = C (-1) := fun k => by
    simp only [M, show (5 * k + 2) % 5 = 2 by omega]
    rfl
  have M3 : ∀ k, M (5 * k + 3) = C (-1) * q k := fun k => by
    simp only [M, show (5 * k + 3) % 5 = 3 by omega, show (5 * k + 3) / 5 = k by omega]
    rfl
  have M4 : ∀ k, M (5 * k + 4) = l k := fun k => by
    simp only [M, show (5 * k + 4) % 5 = 4 by omega, show (5 * k + 4) / 5 = k by omega]
    rfl
  -- an operand of operation `k` sits at an earlier gate: its input gate `5 k + t`, or the result `5 i + 4`
  have pos : ∀ k t x, IsOperand l k x → M (5 * k + t) = inGate x → ∃ j, j < 5 * k + t + 1 ∧ M j = x := by
    intro k t x hx hM
    by_cases hin : (∃ v, x = X v) ∨ (∃ a, x = C a)
    · exact ⟨5 * k + t, by omega, by rw [hM, inGate_eq hin]⟩
    · rcases hx with ⟨i, hi, rfl⟩ | hx | hx
      · exact ⟨5 * i + 4, by omega, M4 i⟩
      · exact absurd (Or.inl hx) hin
      · exact absurd (Or.inr hx) hin
  refine ⟨M, fun n hn => ?_, ?_⟩
  · obtain ⟨k, t, ht, rfl⟩ : ∃ k t, t < 5 ∧ n = 5 * k + t := ⟨n / 5, n % 5, Nat.mod_lt _ (by norm_num), by omega⟩
    interval_cases t
    · rcases Nat.lt_or_ge k L with hk | hk
      · rw [add_zero, M0 k hk]
        rcases inGate_step (p k) with h | h
        · exact Or.inl h
        · exact Or.inr (Or.inl h)
      · obtain rfl : k = L := by omega
        rw [add_zero, M0']
        rcases inGate_step f with h | h
        · exact Or.inl h
        · exact Or.inr (Or.inl h)
    · rw [M1]
      rcases inGate_step (q k) with h | h
      · exact Or.inl h
      · exact Or.inr (Or.inl h)
    · exact Or.inr (Or.inl ⟨-1, M2 k⟩)
    · have hk : k < L := by omega
      obtain ⟨j, hj, hMj⟩ := pos k 1 (q k) (hq k hk) (M1 k)
      exact Or.inr (Or.inr (Or.inr ⟨5 * k + 2, by omega, j, by omega, by rw [M3, M2, hMj]⟩))
    · have hk : k < L := by omega
      obtain ⟨jp, hjp, hMp⟩ := pos k 0 (p k) (hp k hk) (by rw [add_zero, M0 k hk])
      obtain ⟨jq, hjq, hMq⟩ := pos k 1 (q k) (hq k hk) (M1 k)
      rcases hop k hk with e | e | e
      · exact Or.inr (Or.inr (Or.inl ⟨jp, by omega, jq, by omega, by rw [M4, hMp, hMq, e]⟩))
      · refine Or.inr (Or.inr (Or.inl ⟨jp, by omega, 5 * k + 3, by omega, ?_⟩))
        rw [M4, hMp, M3, e, C_neg, C_1, neg_one_mul, sub_eq_add_neg]
      · exact Or.inr (Or.inr (Or.inr ⟨jp, by omega, jq, by omega, by rw [M4, hMp, hMq, e]⟩))
  · obtain ⟨j, hj, hMj⟩ := pos L 0 f hf (by rw [add_zero, M0'])
    exact ⟨j, by omega, hMj⟩

theorem T4c : MainTheorem.{u} → ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p],
    ∀ m ≥ m₀, ∀ L : ℕ, (ComputesOps (hc F m) L → Beyond c m L) ∧
      (p ≠ 2 → ComputesOps (perm F m) L → Beyond c m L) := by
  rintro ⟨c, hc, h⟩
  refine ⟨c / 2, half_pos hc, fun p => ?_⟩
  obtain ⟨m₁, hm₁⟩ := h p
  have ht : Filter.Tendsto (fun m : ℕ => c / 2 * Real.logb 2 m ^ (1 / 3 : ℝ)) Filter.atTop Filter.atTop :=
    ((tendsto_rpow_atTop (by norm_num)).comp
      ((Real.tendsto_logb_atTop (by norm_num)).comp tendsto_natCast_atTop_atTop)).const_mul_atTop (half_pos hc)
  obtain ⟨m₂, hm₂⟩ := Filter.eventually_atTop.1 (ht.eventually_ge_atTop 3)
  refine ⟨m₁ + m₂ + 2, fun F _ _ m hm L => ?_⟩
  have hm2 : (2 : ℝ) ≤ m := by exact_mod_cast (by omega : 2 ≤ m)
  set X := (m : ℝ) ^ (c / 2 * Real.logb 2 m ^ (1 / 3 : ℝ)) with hX
  have hX6 : 6 ≤ X := by
    have h3 : (3 : ℝ) ≤ c / 2 * Real.logb 2 m ^ (1 / 3 : ℝ) := hm₂ m (by omega)
    calc (6 : ℝ) ≤ 2 ^ (3 : ℝ) := by norm_num
      _ ≤ (m : ℝ) ^ (3 : ℝ) := Real.rpow_le_rpow (by norm_num) hm2 (by norm_num)
      _ ≤ X := Real.rpow_le_rpow_of_exponent_le (by linarith) h3
  have hXX : (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) = X ^ 2 := by
    rw [hX, ← Real.rpow_natCast, ← Real.rpow_mul (by linarith)]
    congr 1
    push_cast
    ring
  have key : ∀ L : ℕ, Beyond c m (5 * L + 1) → Beyond (c / 2) m L := by
    intro L hL
    unfold Beyond at hL ⊢
    rw [hXX] at hL
    rw [← hX]
    push_cast at hL
    nlinarith [mul_le_mul_of_nonneg_left hX6 (by linarith : (0 : ℝ) ≤ X)]
  exact ⟨fun hs => key L ((hm₁ F m (by omega) _).1 (T4a hs)),
    fun hp hs => key L ((hm₁ F m (by omega) _).2 hp (T4a hs))⟩

end T4

end CertMachine.ReaderTests
