/-
Copyright 2025 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-/

import FormalConjectures.Util.ProblemImports

set_option maxHeartbeats 0
set_option maxRecDepth 4000
set_option synthInstance.maxHeartbeats 20000
set_option synthInstance.maxSize 128

set_option pp.fullNames true
set_option pp.structureInstances true

set_option relaxedAutoImplicit false
set_option autoImplicit false

set_option pp.coercions.types true
set_option pp.funBinderTypes true
set_option pp.letVarTypes true
set_option pp.piBinderTypes true

set_option maxHeartbeats 200000




open Nat Pointwise

namespace Erdos125

set_option quotPrecheck false

/--
Let $A$ be the set of integers which have only the digits $0, 1$ when written base 3,
-/
local notation "A" => { x : ℕ | (digits 3 x).toFinset ⊆ {0, 1} }

/--
and $B$ be the set of integers which have only the digits $0, 1$ when written base 4.
-/
local notation "B" => { x : ℕ | (digits 4 x).toFinset ⊆ {0, 1} }

open MeasureTheory

open Polynomial

open scoped BigOperators

open scoped Classical

open scoped ENNReal

open scoped EuclideanGeometry

open scoped InnerProductSpace

open scoped intervalIntegral

open scoped List

open scoped Matrix

open scoped Nat

open scoped NNReal

open scoped Pointwise

open scoped ProbabilityTheory

open scoped Real

open scoped symmDiff

open scoped Topology

-- EVOLVE-BLOCK-START
lemma zero_in_A : 0 ∈ A := by
  norm_num

lemma zero_in_B : 0 ∈ B := by
  bound

lemma zero_in_A_plus_B : 0 ∈ A + B := by
  have hA := zero_in_A
  have hB := zero_in_B
  use(0),hA,0

lemma A_max_k (k x : ℕ) (hx : x < 3^k) (hA : x ∈ A) : x ≤ (3^k - 1) / 2 := by
  norm_num[←geom_sum_mul_of_one_le, Finset.subset_iff]at*
  induction k generalizing x with | zero =>omega|succ=>_
  exact (geom_sum_succ).ge.trans' (not_lt.1 fun and=>absurd (‹∀ _ _ __, _› (x/3) · (by use(@hA · ∘by cases x with norm_num+contextual))) (by cases@hA (x%3) (by cases x with simp_all) with valid))

lemma B_max_m (m y : ℕ) (hy : y < 4^m) (hB : y ∈ B) : y ≤ (4^m - 1) / 3 := by
  use ((3).le_div_iff_mul_le (by decide)).2 (Nat.le_pred_of_lt (m.rec (by norm_num) (fun a s=>pow_succ 4 a▸? _) y hy hB))
  use fun and R M=>match and with|0=> R.pos|n + 1=> (by_contra fun and=>absurd (s ( (n + 1)/4) (by valid) (by simp_all+decide[ Finset.insert_subset_iff])) (?_ : ¬_<4^a):_<_*4)
  induction show (n + 1)%4=0 ∨ (n + 1)%4= 1 from(List.mem_cons.mp (M (by ·norm_num [n.succ_pos]))).imp_right ↑List.mem_singleton.1 with valid

lemma A_B_gap (k m x : ℕ) (hx_gt : (3^k - 1) / 2 + (4^m - 1) / 3 < x) (hx_lt_A : x < 3^k) (hx_lt_B : x < 4^m) : x ∉ A + B := by
  intro h
  rcases (Set.mem_add.mp h) with ⟨a, ha, b, hb, hab⟩
  have hak : a < 3^k ∨ 3^k ≤ a := by omega
  have hbm : b < 4^m ∨ 4^m ≤ b := by omega
  rcases hak with hak1 | hak2
  · rcases hbm with hbm1 | hbm2
    · have h1 := A_max_k k a hak1 ha
      have h2 := B_max_m m b hbm1 hb
      omega
    · omega
  · omega

lemma A_decomp (k a : ℕ) (ha : a ∈ A) : ∃ a1 a0 : ℕ, a1 ∈ A ∧ a0 ∈ A ∧ a0 < 3^k ∧ a = a1 * 3^k + a0 := by
  use a / 3^k, a % 3^k
  have h1 : a / 3^k ∈ A := by use k.rec (a.div_one.symm▸ha) (a.div_div_eq_div_mul (3^ _) (3)▸by cases a/3^. with cases a.eq_zero_or_pos with simp_all[ Finset.insert_subset_iff])
  have h2 : a % 3^k ∈ A := by use k.strongRec @?_ a ha.out
                              refine fun and R M α=>match and with|0=> M.mod_one.symm▸ fun and=>by·norm_num | S+1 =>pow_succ' (3) S▸Nat.mod_mul▸ if a : M%3=0 then(? _)else(? _)
                              · use (by cases M/3%_ with norm_num[a, Finset.insert_subset_iff] ∘R S (by constructor) (M/3)) (.trans (by cases M with norm_num) α)
                              · simp_all-contextual [ Finset.insert_subset_iff,Nat.add_mul_div_left, M.mod_lt _,(M.pos_of_ne_zero (a.comp (by rw [ ·]))), ↑pos_iff_ne_zero.eq]
  have h3 : a % 3^k < 3^k := by exact (a.mod_lt (by ·positivity) )
  have h4 : a = (a / 3^k) * 3^k + a % 3^k := by simp_rw [a.div_add_mod']
  exact ⟨h1, h2, h3, h4⟩

lemma B_decomp (m b : ℕ) (hb : b ∈ B) : ∃ b1 b0 : ℕ, b1 ∈ B ∧ b0 ∈ B ∧ b0 < 4^m ∧ b = b1 * 4^m + b0 := by
  use b / 4^m, b % 4^m
  have h1 : b / 4^m ∈ B := by exact (m.rec (b.div_one.symm▸hb) (b.div_div_eq_div_mul (4^ _) 4▸by cases b/4^. with cases b with simp_all[ Finset.insert_subset_iff]))
  have h2 : b % 4^m ∈ B := by use m.rec (by simp_all![b.mod_one]) fun and c=>Set.mem_setOf.2 ((pow_succ' 4 _)▸Nat.mod_mul▸(?_))
                              rcases (b /4%4^ and).eq_zero_or_pos
                              · exact (.trans (by cases(b%4).eq_zero_or_pos with cases b.eq_zero_or_pos with·norm_num[ *]) hb)
                              simp_all?-contextual[b.mod_lt,b.pos_of_ne_zero (by cases. with tauto),(4).digits_add, Finset.insert_subset_iff]
                              use (by valid:(b%4+4*(b/4%4^and))/4=b/4%4^and).symm▸.trans (↑(and.strongRec ?_ (b/4) (by valid:))) hb.2
                              use fun and h R M=>match and with|0=>by valid | S+1=>pow_succ' 4 S▸Nat.mod_mul▸ if a : R/4%4^S=0 then(? _)else(? _)
                              · cases(R%4).eq_zero_or_pos with norm_num[*, R.pos_of_ne_zero (by cases.▸M)]
                              norm_num[Nat.add_mul_div_left _,pos_of_ne_zero a, R.mod_lt, R.pos_of_ne_zero (a.comp (·.symm▸rfl)),(h _ _ _ _).trans, Finset.insert_subset_iff]
                              use (by cases S with|zero=>omega|succ=>norm_num[(R/4).pos_of_ne_zero (a.comp (·.symm▸rfl)),pow_add]),.trans (by norm_num[pos_of_ne_zero a]) (((h S (by constructor) _) ↑(pos_of_ne_zero a)).trans (by norm_num))
  have h3 : b % 4^m < 4^m := by exact (b.mod_lt (by bound))
  have h4 : b = (b / 4^m) * 4^m + b % 4^m := by simp_rw [b.div_add_mod']
  exact ⟨h1, h2, h3, h4⟩

lemma log_ratio_irrational : Irrational (Real.log 4 / Real.log 3) := by use(·.elim fun and x =>(eq_div_iff (by norm_num)).ne.2 (and.num_div_den▸ne_of_eq_of_ne (by rw [Rat.cast_div,div_mul_eq_mul_div]) ((div_eq_iff (by norm_num)).ne.2 fun and=>?_)) x)
                                                                        replace and: (3: ℝ)^‹ℚ›.1.natAbs=4^‹ℚ›.2
                                                                        · simp_all[Rat.cast_pos.1 (x.ge.trans_lt' (by positivity)),mul_comm,←@Rat.cast_inj ℝ,←Real.rpow_natCast,Real.rpow_def_of_pos,abs_of_pos]
                                                                        · use absurd and (mod_cast (by norm_num[Nat.pow_mod]) ∘congr_arg (.%2))

lemma exists_small_pos_lin_comb_help (α : ℝ) (hα : Irrational α) (hα_pos : 0 < α) (δ : ℝ) (hδ : 0 < δ) :
  ∃ m k : ℕ, 0 < m ∧ 0 < k ∧ 0 < (m : ℝ) * α - (k : ℝ) ∧ (m : ℝ) * α - (k : ℝ) < δ := by
  replace := (α).infinite_rat_abs_sub_lt_one_div_den_sq_of_irrational hα
  convert (by_contradiction fun and=>this.comp (tendsto_one_div_atTop_nhds_zero_nat.eventually_lt_const (lt_min hδ hα_pos)).exists_forall_of_atTop.elim _)
  refine fun a s=>(((Set.finite_Icc 0 @⌊α * a+1⌋).prod ↑(Set.finite_le_nat a)).image fun(x, y)=>x/ y).subset fun R L=> if a : R.2 ≤ a then(? _)else(? _)
  · field_simp[abs_lt, R.cast_def,div_lt_div_iff₀,sq]at L
    norm_num [abs_div, sub_div', ←mul_assoc, R.cast_def, false,sq] at ( s) L
    refine ⟨(_, _),⟨? _,a⟩, R.num_div_den⟩
    exists(Int.le_of_lt_add_one) (mod_cast (by linear_combination hα_pos * ↑R.2+lt_of_abs_lt ((le_mul_of_one_le_right (@norm_nonneg ℝ _ _) ((mod_cast R.pos ) )).trans_lt L):00 <(R.1 : ℝ) + 1))
    exact (Int.le_floor.2 (by linarith only[max_lt_iff.1.comp (le_mul_of_one_le_right (@norm_nonneg ℝ _ _)<|mod_cast R.pos).trans_lt L,mul_le_mul_of_nonneg_left (Nat.cast_le.2 a) (hα_pos).le]))
  field_simp [hα, R.cast_def, mul_comm]at and L(s)
  rcases lt_trichotomy (↑ R.2 * α) R.1 with a | S | S
  · apply and.elim ⟨⌊1/ (↑R.1-↑R.2* α)⌋₊*R.2,⌊1/ (↑R.1-↑R.2* α)⌋₊*R.1.natAbs-1, _⟩
    push_cast[lt_min_iff,mul_assoc, sub_pos, sub_div' (by norm_num:(R.2: ℝ)≠0),mul_comm α,sq, R.cast_def,Int.cast_natAbs,abs_of_neg (sub_neg.2 a),abs_of_pos (a.trans' (by positivity))] at ( s)L⊢
    use mul_pos (Nat.floor_pos.2.comp (one_le_div ↑(sub_pos.2 a)).2 (L.le.trans' ?_)) R.pos,tsub_pos_of_lt (one_lt_mul ((Nat.floor_pos.mpr.comp ( one_le_div ↑( sub_pos.mpr a)).mpr) ?_) ? _)
    · rw[Nat.cast_pred (mul_pos (Nat.floor_pos.2.comp (one_le_div ↑(sub_pos.2 a)).2 (L.le.trans' _)) (Int.natAbs_pos.2 (Int.cast_ne_zero.mp (a.trans' (by positivity)).ne')))]
      · rw[Nat.cast_mul,Int.cast_natAbs, sub_lt_comm,abs_of_pos (Int.cast_pos.1 (a.trans' (by positivity))),←mul_sub]
        use (by norm_num[*,Irrational.ne_nat _ _|>.lt_of_le',Nat.floor_le ∘le_of_lt,←lt_div_iff₀]),((lt_div_iff₀ (by positivity)).2 (L.trans' ? _)).trans (s R.2 (by valid)).1
        linear_combination↑R.2*((div_lt_iff₀ ↑( sub_pos.2 a)).mp ↑(Nat.lt_floor_add_one (1 /_) ) +neg_le_abs (α-R) *↑ R.2- (eq_div_iff (by. (norm_num))).mp (R.cast_def :(R: ℝ) = _))
      · exact (mul_le_mul le_sup_right (le_mul_of_one_le_left (by bound) (mod_cast R.pos)) (by bound) (abs_nonneg _)).trans' (by norm_num[mul_comm α,sub_mul, R.cast_def])
    · nlinarith only[a,neg_le_abs (α-R), (mod_cast R.pos : 1 ≤ (R.2: ℝ)), (eq_div_iff (by norm_num)).1 (R.cast_def:(R: ℝ) = _)]
    · nlinarith only[neg_le_abs (α-R), (mod_cast R.pos : 1 ≤(R.2 : ℝ)), (eq_div_iff (by norm_num)).1 (R.cast_def :(R : ℝ) = _), L.out]
    · use (by valid ∘Int.cast_lt.1).comp a.trans' (Int.cast_one.trans_lt ((div_lt_iff₀' (by positivity)).1 (s _ (by valid)).2))
  · norm_num[Irrational.ne_int, *] at S
  · rcases lt_trichotomy R 0 with a|rfl|a
    · nlinarith![le_abs_self (α-R), (div_lt_iff₀ (by positivity)).1 ↑(lt_min_iff.1 (s R.2 (by valid))).2, L.out, true, ↑(mod_cast R.pos: (1:ℝ) ≤R.2), (mod_cast a: ( R : ℝ)<0)]
    · exact ⟨0,by norm_num[Nat.eq_zero_of_not_pos a]⟩
    apply and.elim ⟨R.2, R.1.natAbs, R.pos,by positivity, _⟩
    simp_all-contextual[mul_comm α,abs_div, sub_div',abs_of_pos, R.cast_def, R.pos,←mul_assoc,((lt_div_iff₀ ↑ _).2 (L.out.trans_le' ↑ _)).trans ((s R.2 (by valid)).trans_le inf_le_left),sq, S.le]

lemma exists_small_pos_lin_comb (δ : ℝ) (hδ : 0 < δ) :
  ∃ m k : ℕ, 0 < m ∧ 0 < k ∧ 0 < (m : ℝ) * Real.log 4 - (k : ℝ) * Real.log 3 ∧ (m : ℝ) * Real.log 4 - (k : ℝ) * Real.log 3 < δ := by
  have h_irr : Irrational (Real.log 4 / Real.log 3) := log_ratio_irrational
  have h_pos : 0 < Real.log 4 / Real.log 3 := by positivity
  have h_delta_div : 0 < δ / Real.log 3 := by positivity
  have h_help := exists_small_pos_lin_comb_help (Real.log 4 / Real.log 3) h_irr h_pos (δ / Real.log 3) h_delta_div
  simp_all only [div_sub' (by·positivity:Real.log (3)≠0),div_pos_iff_of_pos_right, mul_div,div_lt_div_iff_of_pos_right, (by positivity:0 <Real.log 3),mul_comm]


lemma exists_small_pos_lin_comb_large_k (δ : ℝ) (hδ : 0 < δ) (K : ℝ) :
  ∃ m k : ℕ, 0 < m ∧ 0 < k ∧ K ≤ (3^k : ℝ) ∧ 0 < (m : ℝ) * Real.log 4 - (k : ℝ) * Real.log 3 ∧ (m : ℝ) * Real.log 4 - (k : ℝ) * Real.log 3 < δ := by
  have h_arch : ∃ N : ℕ, 0 < N ∧ K ≤ (3^N : ℝ) := by refine ⟨ _,Nat.succ_pos _,le_of_lt ((mod_cast ((Nat.lt_of_ceil_lt)) (Nat.lt_pow_self (by decide)).le))⟩
  rcases h_arch with ⟨N, hN_pos, hN_bound⟩
  have h_delta_div : 0 < δ / N := by bound
  have h_small := exists_small_pos_lin_comb (δ / N) h_delta_div
  rcases h_small with ⟨m0, k0, hm0, hk0, h_diff_pos, h_diff_lt⟩
  use N * m0, N * k0
  have h1 : 0 < N * m0 := by positivity
  have h2 : 0 < N * k0 := by positivity
  have h3 : K ≤ (3^(N * k0) : ℝ) := by use hN_bound.trans (pow_right_mono₀ (by norm_num) (le_mul_of_one_le_right' hk0))
  have h4 : 0 < ((N * m0 : ℕ) : ℝ) * Real.log 4 - ((N * k0 : ℕ) : ℝ) * Real.log 3 := by norm_num[*,mul_assoc,←mul_sub]
  have h5 : ((N * m0 : ℕ) : ℝ) * Real.log 4 - ((N * k0 : ℕ) : ℝ) * Real.log 3 < δ := by simp_all only [Nat.cast_mul, mul_assoc, Nat.cast_pos,lt_div_iff₀', mul_sub]
  exact ⟨h1, h2, h3, h4, h5⟩

lemma dirichlet_approx (ε : ℝ) (hε : 0 < ε) : ∃ k m : ℕ, 0 < k ∧ 0 < m ∧ (3^k : ℝ) ≤ 4^m ∧ (4^m : ℝ) ≤ (3^k : ℝ) * (1 + ε) ∧ (3^k : ℝ) * ε ≥ 3 := by
  have h_log_eps : 0 < Real.log (1 + ε) := by apply Real.log_pos (by·linarith!)
  have h_dense := exists_small_pos_lin_comb_large_k (Real.log (1 + ε)) h_log_eps (3 / ε)
  rcases h_dense with ⟨m, k, hm, hk, hk_large, h_diff_pos, h_diff_lt⟩
  use k, m
  have h_k_pos : 0 < k := hk
  have h_m_pos : 0 < m := hm
  have h_k_eps : 3 ≤ (3^k : ℝ) * ε := by rwa[←div_le_iff₀ hε]
  have h_log_bound1 : (k : ℝ) * Real.log 3 ≤ (m : ℝ) * Real.log 4 := by use(sub_pos.1 (by valid)).le
  have h_log_bound2 : (m : ℝ) * Real.log 4 ≤ (k : ℝ) * Real.log 3 + Real.log (1 + ε) := by use sub_le_iff_le_add'.1 h_diff_lt.le
  have h_pow_bound1 : (3^k : ℝ) ≤ 4^m := by norm_num[*,←@Nat.cast_le ℝ,←Real.log_le_log_iff]
  have h_pow_bound2 : (4^m : ℝ) ≤ (3^k : ℝ) * (1 + ε) := by rwa[←Real.log_le_log_iff (by positivity) (by positivity),Real.log_mul (by positivity) (by positivity),Real.log_pow,Real.log_pow]
  exact ⟨h_k_pos, h_m_pos, h_pow_bound1, h_pow_bound2, h_k_eps⟩

lemma hz_eq_lemma (x a b a1 a0 b1 b0 k m : ℕ)
  (h1 : 3^k ≤ 4^m) (h3 : x = a + b) (h4 : a = a1 * 3^k + a0) (h5 : b = b1 * 4^m + b0) :
  x = (a1 + b1) * 3^k + (a0 + b0 + b1 * (4^m - 3^k)) := by
  have h2 : 4^m = 3^k + (4^m - 3^k) := by omega
  have h6 : b1 * 4^m = b1 * 3^k + b1 * (4^m - 3^k) := by
    calc
      b1 * 4^m = b1 * (3^k + (4^m - 3^k)) := congrArg (fun u => b1 * u) h2
      _ = b1 * 3^k + b1 * (4^m - 3^k) := Nat.mul_add b1 (3^k) (4^m - 3^k)
  have h7 : (a1 + b1) * 3^k = a1 * 3^k + b1 * 3^k := Nat.add_mul a1 b1 (3^k)
  omega

lemma scale_step (N : ℕ) (hN : 0 < N) (C : ℝ) (hC : (((Finset.Ico 0 N).filter (· ∈ A + B)).card : ℝ) ≤ C * (N : ℝ)) :
  ∃ N' > 0, (((Finset.Ico 0 N').filter (· ∈ A + B)).card : ℝ) ≤ (11/12 : ℝ) * C * (N' : ℝ) := by
  have h_eps : ∃ ε : ℝ, 0 < ε ∧ ε ≤ 1 / (24 * N : ℝ) := by
    refine ⟨ _,by positivity,le_rfl⟩
  rcases h_eps with ⟨ε, hε_pos, hε_lt⟩
  have h_k_large : ∃ k m : ℕ, 0 < k ∧ 0 < m ∧ (3^k : ℝ) ≤ 4^m ∧ (4^m : ℝ) ≤ (3^k : ℝ) * (1 + ε) ∧ (3^k : ℝ) * ε ≥ 3 := dirichlet_approx ε hε_pos
  rcases h_k_large with ⟨k, m, hk, hm, hkm_le, hkm_ge, hk_large⟩
  use N * 3^k
  have hN_pos : 0 < N * 3^k := by
    positivity
  constructor
  · exact hN_pos
  · have h_decomp : ∀ x, x ∈ A + B → x < N * 3^k → ∃ y z : ℕ, y ∈ A + B ∧ y < N ∧ x = y * 3^k + z ∧ (z : ℝ) ≤ (3^k : ℝ) * (5/6 + ε * N + ε / 3) := by
      intro x hx hx_lt
      rcases (Set.mem_add.mp hx) with ⟨a, ha, b, hb, hab⟩
      rcases A_decomp k a ha with ⟨a1, a0, ha1, ha0, ha0_lt, ha_eq⟩
      rcases B_decomp m b hb with ⟨b1, b0, hb1, hb0, hb0_lt, hb_eq⟩
      use a1 + b1, a0 + b0 + b1 * (4^m - 3^k)
      have hy_in : a1 + b1 ∈ A + B := Set.add_mem_add ha1 hb1
      have hz_eq : x = (a1 + b1) * 3^k + (a0 + b0 + b1 * (4^m - 3^k)) := by
        have h1 : 3^k ≤ 4^m := by exact_mod_cast hkm_le
        exact hz_eq_lemma x a b a1 a0 b1 b0 k m h1 hab.symm ha_eq hb_eq
      have hy_lt : a1 + b1 < N := by exact (Nat.lt_of_mul_lt_mul_right ((hz_eq▸le_self_add).trans_lt (by assumption)))
      have hz_bound : ((a0 + b0 + b1 * (4^m - 3^k) : ℕ) : ℝ) ≤ (3^k : ℝ) * (5/6 + ε * N + ε / 3) := by
        have ha0_le : a0 ≤ (3^k - 1) / 2 := A_max_k k a0 ha0_lt ha0
        have hb0_le : b0 ≤ (4^m - 1) / 3 := B_max_m m b0 hb0_lt hb0
        have hb1_lt : b1 < N := by exact (le_add_self).trans_lt hy_lt
        push_cast[*,show a0+b0+b1*(4^m-3^k) ≤3^k*(5/6+ε*N+ε/3) from _,id]
        rcases eq_or_ne b1 0 with@rfl
        · nlinarith only[hkm_ge,hk_large,show (2 *a0+1:ℝ) ≤3^k∧ (3*b0: ℝ)<4^m∧ 1 ≤ (N: ℝ) from mod_cast (by valid), (le_div_iff₀ (by positivity)).1 hε_lt]
        push_cast[*] at hx_lt⊢
        rw[Nat.cast_sub]
        · norm_num[show a0+b0+b1*(4^m-3^k) ≤3^k*(5/6+ε*N+ε/3)by nlinarith only[hkm_ge,hk_large,show (N: ℝ)>b1 by norm_cast] + 1]
          rw[le_div_iff₀] at hε_lt
          · nlinarith[show (2*a0 : ℝ)+1≤3^k∧ (3*b0: ℝ)+1≤4^m∧ (N: ℝ)>b1 from mod_cast by valid]
          · nlinarith only[ (by bound:0< (N: ℝ))]
        · aesop
          norm_cast at*
      exact ⟨hy_in, hy_lt, hz_eq, hz_bound⟩
    have h_count_z : ∃ M : ℕ, (M : ℝ) ≤ (3^k : ℝ) * (5/6 + 2 * ε * N) ∧
      ∀ x ∈ A + B, x < N * 3^k → ∃ y z : ℕ, y ∈ A + B ∧ y < N ∧ z < M ∧ x = y * 3^k + z := by
      by_contra!
      choose _ _ _ _ using this _ (Nat.floor_le (by·positivity ) )
      obtain ⟨a,b,x,y,@c, _⟩:=(h_decomp _) (by valid) ‹_›
      use (by valid:) _ _ x y (Nat.le_floor (b.cast_succ.trans_le (by nlinarith[show 1 ≤ (N: ℝ)by bound]))) rfl
    rcases h_count_z with ⟨M, hM_bound, h_rep⟩
    have h_card_bound : (((Finset.Ico 0 (N * 3^k)).filter (· ∈ A + B)).card : ℝ) ≤
      (((Finset.Ico 0 N).filter (· ∈ A + B)).card : ℝ) * (M : ℝ) := by
      use Real.zero_lt_one.le.eq_or_lt.elim ↑((? _)) ?_
      · bound
      use fun and=>Real.zero_lt_one.le.eq_or_lt.elim (? _) fun and=>?_
      · bound
      use Real.zero_lt_one.le.eq_or_lt.elim (↑?_) ?_
      · bound
      use fun and=>.trans (Nat.cast_le.2 (( Finset.card_le_card_of_surjOn (Prod.rec (.*3^k+.) ) fun and=>?_).trans_eq (Finset.card_product _ _|>.trans.comp (congr_arg _) (Finset.card_range M)))) (Nat.cast_mul _ _).le
      exact ( Finset.mem_filter.1 ·|>.elim fun R M=>(h_rep and M (Finset.mem_Ico.1 R).2).elim fun and ⟨a, _⟩=>⟨ (and, a),by norm_num[ *]⟩)
    have hC_nonneg : 0 ≤ C := by
      exact (nonneg_of_mul_nonneg_left) (hC.trans' (by bound)) (Nat.cast_pos.mpr hN)
    have h_card_bound2 : (((Finset.Ico 0 (N * 3^k)).filter (· ∈ A + B)).card : ℝ) ≤
      (C * N : ℝ) * ((3^k : ℝ) * (5/6 + 2 * ε * N)) := by
      exact (h_card_bound.trans (mul_le_mul hC hM_bound M.cast_nonneg ((Nat.cast_nonneg _).trans ( (hC)))))
    have h_final_ineq : (C * N : ℝ) * ((3^k : ℝ) * (5/6 + 2 * ε * N)) ≤ (11/12 : ℝ) * C * (N * 3^k : ℝ) := by
      linear_combination N* C*3^k*(le_div_iff₀ (by positivity)).1 hε_lt/12
    exact (h_card_bound2).trans (by push_cast[*])

lemma density_multi_scale (d : ℕ) : ∃ N > 0, (((Finset.Ico 0 N).filter (· ∈ A + B)).card : ℝ) ≤ ((11/12 : ℝ)^d) * (N : ℝ) := by
  induction d with
  | zero =>
    use 1
    constructor
    · norm_num
    · simp only [pow_zero, one_mul]
      have h1 : (((Finset.Ico 0 1).filter (· ∈ A + B)).card : ℝ) ≤ ((Finset.Ico 0 1).card : ℝ) := by
        norm_cast
        exact Finset.card_filter_le _ _
      have h2 : (Finset.Ico 0 1).card = 1 := rfl
      rw [h2] at h1
      push_cast at h1 ⊢
      exact h1
  | succ d ih =>
    rcases ih with ⟨N, hN, h_bound⟩
    have h_step := scale_step N hN ((11/12 : ℝ)^d) h_bound
    rcases h_step with ⟨N', hN', h_bound'⟩
    use N'
    constructor
    · exact hN'
    · have h_mul : (11 / 12 : ℝ) ^ (d + 1) = (11 / 12 : ℝ) * (11 / 12 : ℝ) ^ d := by
        rw [pow_add, pow_one]
        ring
      rw [h_mul]
      linarith

lemma limit_11_12 (ε : ℝ) (hε : ε > 0) : ∃ d : ℕ, (11/12 : ℝ)^d ≤ ε := by
  exact (exists_pow_lt_of_lt_one hε (by norm_num)).imp fun and=>le_of_lt

lemma density_tends_to_zero (ε : ℝ) (hε : ε > 0) : ∃ N > 0, (((Finset.Ico 0 N).filter (· ∈ A + B)).card : ℝ) ≤ ε * (N : ℝ) := by
  have hd : ∃ d : ℕ, (11/12 : ℝ)^d ≤ ε := limit_11_12 ε hε
  rcases hd with ⟨d, hd2⟩
  have h_multi := density_multi_scale d
  rcases h_multi with ⟨N, hN, h_bound⟩
  use N
  use hN
  use h_bound.trans (by bound)
-- EVOLVE-BLOCK-END


theorem target_theorem_0
  : answer(
  -- EVOLVE-VALUE-START
  False
  -- EVOLVE-VALUE-END
  ) ↔ 0 < (A + B).lowerDensity := by
  -- EVOLVE-BLOCK-START
  have h_density : ∀ (ε : ℝ), ε > 0 → ∃ N > 0, ((Finset.Ico 0 N).filter (· ∈ A + B)).card ≤ ε * N := density_tends_to_zero
  have h_zero : (A + B).lowerDensity = 0 := by
    simp_all only[.>·,Set.mem_setOf,Set.lowerDensity,Nat.Ico_zero_eq_range]
    simp_all![Set.partialDensity,Filter.liminf_eq]
    simp_all[Set.partialDensity]
    use IsGreatest.csSup_eq ⟨⟨1,by bound⟩, fun and ⟨a, _⟩=>not_lt.1 fun and=>(((h_density _) ((half_pos and))).elim) ?_⟩
    absurd‹∀ (x _),_› (2^(a + 1)) (le_of_lt (Nat.lt_two_pow_self).le)
    use((h_density _) ((div_pos (half_pos and) (Nat.cast_pos.2 (a+1).two_pow_pos)))).elim fun and R M=> if I: a≤ and then(? _)else(? _)
    · use (not_lt.2 (by apply_rules) ( ((div_le_iff₀ (by bound)).2 (R.2.trans' ? _)).trans_lt (lt_of_le_of_lt (by bound) (half_lt_self (by assumption)))))
      exact (congr_arg _ ((Nat.card_eq_finsetCard _)▸congr_arg _ (Set.ext fun and=>and_comm.trans (symm (Finset.mem_filter.trans (and_congr_left' Finset.mem_range)))))).le
    use(((Nat.cast_le.2.comp Finset.card_pos.2 ⟨0,by norm_num[ R,Exists.intro 0,Set.mem_add]⟩).trans R.2).trans_lt ((mul_right_comm _ _ _).trans_lt ?_)).false
    norm_num[mul_inv_lt_iff₀ _,(mul_le_of_le_one_left _ _).trans_lt, M.trans.comp (div_le_one ↑ _).2 ∘(Nat.cast_le.2 (Nat.card_mono (.of_fintype _) Set.inter_subset_right)).trans,le_of_lt]
    use(mul_lt_mul' ((half_lt_self (by valid)).le.trans (M.trans ((div_le_one (by positivity)).2 (mod_cast(?_))))) (mod_cast (not_le.1 I).trans Nat.lt_two_pow_self.le) and.cast_nonneg one_pos).trans_eq (one_mul _)
    exact (Nat.card_mono (.of_fintype _) fun and=>And.right).trans_eq ((Nat.card_eq_fintype_card.trans ( Fintype.card_ofFinset _ _)).trans (by norm_num))
  constructor
  · intro h
    exfalso
    exact h
  · intro h
    rw [h_zero] at h
    exact lt_irrefl 0 h
  -- EVOLVE-BLOCK-END
