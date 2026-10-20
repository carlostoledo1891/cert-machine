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




open Nat Filter

namespace Erdos138

/--
The set of natural numbers that guarantee a monochromatic arithmetic progression.

A number `N` belongs to this set if, for a given number of colors `r` and an arithmetic
progression length `k`, any `r`-coloring of the integers `{1, ..., N}` must contain a
monochromatic arithmetic progression of length `k`.
-/
def monoAP_guarantee_set (r k : ℕ) : Set ℕ :=
  { N | ∀ coloring : Finset.Icc 1 N → Fin r, ContainsMonoAPofLength coloring k}

/--
The **van der Waerden number**, is the smallest integer `N` such that any `r`-coloring of
`{1, ..., N}` is guaranteed to contain a monochromatic arithmetic progression of
length `k`. It is defined as the infimum of the (non-empty) set of all such numbers `N`.
-/
noncomputable def monoAPNumber (r k : ℕ) : ℕ := sInf (monoAP_guarantee_set r k)

/--
An abbreviation for the van der Waerden number for 2 colors, commonly written as `W(k)`.
This represents the smallest integer `N` such that any 2-coloring of `{1, ..., N}`
must contain a monochromatic arithmetic progression of length `k`.
-/
noncomputable abbrev W : ℕ → ℕ := monoAPNumber 2

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
def HasMonoAP (c : ℕ → Fin 2) (N k : ℕ) : Prop :=
  ∃ a d, d > 0 ∧ a ≥ 1 ∧ a + (k - 1) * d ≤ N ∧ ∀ m < k, c (a + m * d) = c a






lemma ap_must_end (k i N : ℕ) (c : ℕ → Fin 2) (color : Fin 2)
  (h_no_ap_k1 : ¬ HasMonoAP c (N + i) (k + 1))
  (h_has : HasMonoAP (fun x => if x = N + i + 1 then color else c x) (N + i + 1) (k + 1)) :
  ∃ a d, d > 0 ∧ a ≥ 1 ∧ a + k * d = N + i + 1 ∧
         (∀ m < k, c (a + m * d) = color) := by
  rcases h_has with ⟨a, d, hd, ha1, had, h_mono⟩
  have h_k_eq : (k + 1 - 1) = k := by omega
  rw [h_k_eq] at had
  have h_eq : a + k * d = N + i + 1 := by
    by_contra h_neq
    have h_le : a + k * d ≤ N + i := by omega
    have h_ap : HasMonoAP c (N + i) (k + 1) := by
      use a, d
      have h_k_eq2 : (k + 1 - 1) = k := by omega
      rw [h_k_eq2]
      have h_mono_ap : ∀ m < k + 1, c (a + m * d) = c a := by
        intro m hm
        have hm_eval := h_mono m hm
        have h_m_neq : a + m * d ≠ N + i + 1 := by
          have : m * d ≤ k * d := Nat.mul_le_mul_right d (by omega)
          omega
        have h_0_neq : a ≠ N + i + 1 := by
          have : a ≤ a + k * d := Nat.le_add_right a (k * d)
          omega
        change (if a + m * d = N + i + 1 then color else c (a + m * d)) = (if a = N + i + 1 then color else c a) at hm_eval
        rw [if_neg h_m_neq, if_neg h_0_neq] at hm_eval
        exact hm_eval
      exact ⟨hd, ha1, h_le, h_mono_ap⟩
    exact h_no_ap_k1 h_ap
  use a, d
  have h_mono_ap_end : ∀ m < k, c (a + m * d) = color := by
    intro m hm
    have h_m_lt : m < k + 1 := by omega
    have hm_eval := h_mono m h_m_lt
    have h_m_neq : a + m * d ≠ N + i + 1 := by
      have : m * d < k * d := Nat.mul_lt_mul_of_pos_right hm hd
      omega
    change (if a + m * d = N + i + 1 then color else c (a + m * d)) = (if a = N + i + 1 then color else c a) at hm_eval
    have h_0_neq : a ≠ N + i + 1 := by
      have : 0 < k * d := Nat.mul_pos (by omega) hd
      omega
    rw [if_neg h_m_neq, if_neg h_0_neq] at hm_eval

    have h_k_lt : k < k + 1 := by omega
    have hk_eval := h_mono k h_k_lt
    change (if a + k * d = N + i + 1 then color else c (a + k * d)) = (if a = N + i + 1 then color else c a) at hk_eval
    rw [if_pos h_eq, if_neg h_0_neq] at hk_eval
    rw [hm_eval, hk_eval]
  exact ⟨hd, ha1, h_eq, h_mono_ap_end⟩

lemma extend_one_step (k i N : ℕ) (c : ℕ → Fin 2)
  (hk : k > 0)
  (hi : i < k)
  (h_no_ap_k : ¬ HasMonoAP c N k)
  (h_no_ap_k1 : ¬ HasMonoAP c (N + i) (k + 1)) :
  ∃ color : Fin 2, ¬ HasMonoAP (fun x => if x = N + i + 1 then color else c x) (N + i + 1) (k + 1) := by
  by_contra h_contra
  push_neg at h_contra
  have h0 := h_contra 0
  have h1 := h_contra 1
  have h_ap0 := ap_must_end k i N c 0 h_no_ap_k1 h0
  have h_ap1 := ap_must_end k i N c 1 h_no_ap_k1 h1
  rcases h_ap0 with ⟨a0, d0, hd0, ha0_1, ha0_eq, h_mono0⟩
  rcases h_ap1 with ⟨a1, d1, hd1, ha1_1, ha1_eq, h_mono1⟩
  have hd0_bound : d0 ≤ i := by
    by_contra h_gt
    push_neg at h_gt
    have h_mul : (k - 1) * d0 = k * d0 - d0 := by
      have h1 : (k - 1) * d0 = k * d0 - 1 * d0 := Nat.sub_mul k 1 d0
      have h2 : 1 * d0 = d0 := Nat.one_mul d0
      rw [h2] at h1
      exact h1
    have h_le : a0 + (k - 1) * d0 ≤ N := by
      rw [h_mul]
      have h_k_d0 : d0 ≤ k * d0 := by
        have : 1 * d0 ≤ k * d0 := Nat.mul_le_mul_right d0 hk
        omega
      have h_add : a0 + (k * d0 - d0) = a0 + k * d0 - d0 := by omega
      rw [h_add, ha0_eq]
      omega
    have h_ap : HasMonoAP c N k := by
      use a0, d0
      have h_c_a0 : c a0 = 0 := by
        have h0_lt : 0 < k := hk
        have h_eval := h_mono0 0 h0_lt
        have h_zero : a0 + 0 * d0 = a0 := by omega
        rwa [h_zero] at h_eval
      have h_mono_ap : ∀ m < k, c (a0 + m * d0) = c a0 := by
        intro m hm
        have h1 := h_mono0 m hm
        rw [h1, h_c_a0]
      exact ⟨hd0, ha0_1, h_le, h_mono_ap⟩
    exact h_no_ap_k h_ap
  have hd1_bound : d1 ≤ i := by
    by_contra h_gt
    push_neg at h_gt
    have h_mul : (k - 1) * d1 = k * d1 - d1 := by
      have h1 : (k - 1) * d1 = k * d1 - 1 * d1 := Nat.sub_mul k 1 d1
      have h2 : 1 * d1 = d1 := Nat.one_mul d1
      rw [h2] at h1
      exact h1
    have h_le : a1 + (k - 1) * d1 ≤ N := by
      rw [h_mul]
      have h_k_d1 : d1 ≤ k * d1 := by
        have : 1 * d1 ≤ k * d1 := Nat.mul_le_mul_right d1 hk
        omega
      have h_add : a1 + (k * d1 - d1) = a1 + k * d1 - d1 := by omega
      rw [h_add, ha1_eq]
      omega
    have h_ap : HasMonoAP c N k := by
      use a1, d1
      have h_c_a1 : c a1 = 1 := by
        have h0_lt : 0 < k := hk
        have h_eval := h_mono1 0 h0_lt
        have h_zero : a1 + 0 * d1 = a1 := by omega
        rwa [h_zero] at h_eval
      have h_mono_ap : ∀ m < k, c (a1 + m * d1) = c a1 := by
        intro m hm
        have h1_eval := h_mono1 m hm
        rw [h1_eval, h_c_a1]
      exact ⟨hd1, ha1_1, h_le, h_mono_ap⟩
    exact h_no_ap_k h_ap

  have h_m0 : k - d1 < k := by omega
  have h_m1 : k - d0 < k := by omega

  have h_z0 : c (a0 + (k - d1) * d0) = 0 := h_mono0 (k - d1) h_m0
  have h_z1 : c (a1 + (k - d0) * d1) = 1 := h_mono1 (k - d0) h_m1

  have h_eq_z : a0 + (k - d1) * d0 = a1 + (k - d0) * d1 := by
    have h_sub0 : a0 + (k - d1) * d0 = a0 + k * d0 - d1 * d0 := by
      have : (k - d1) * d0 = k * d0 - d1 * d0 := Nat.sub_mul k d1 d0
      rw [this]
      have : d1 * d0 ≤ k * d0 := Nat.mul_le_mul_right d0 (by omega)
      omega
    have h_sub1 : a1 + (k - d0) * d1 = a1 + k * d1 - d0 * d1 := by
      have : (k - d0) * d1 = k * d1 - d0 * d1 := Nat.sub_mul k d0 d1
      rw [this]
      have : d0 * d1 ≤ k * d1 := Nat.mul_le_mul_right d1 (by omega)
      omega
    have h_comm : d1 * d0 = d0 * d1 := Nat.mul_comm d1 d0
    rw [h_sub0, h_sub1, ha0_eq, ha1_eq, h_comm]

  rw [h_eq_z] at h_z0
  rw [h_z0] at h_z1
  contradiction

lemma has_mono_ap_ext (c1 c2 : ℕ → Fin 2) (N k : ℕ)
  (h_eq : ∀ x ≤ N, x ≥ 1 → c1 x = c2 x) :
  HasMonoAP c1 N k ↔ HasMonoAP c2 N k := by
  constructor
  · rintro ⟨a, d, hd, ha1, had, h_mono⟩
    use a, d
    refine ⟨hd, ha1, had, ?_⟩
    intro m hm
    have h_m_le : a + m * d ≤ N := by
      have : m ≤ k - 1 := by omega
      have : m * d ≤ (k - 1) * d := Nat.mul_le_mul_right d this
      omega
    have h_a_le : a ≤ N := by omega
    have h_m_ge : a + m * d ≥ 1 := by omega
    rw [← h_eq (a + m * d) h_m_le h_m_ge, ← h_eq a h_a_le ha1]
    exact h_mono m hm
  · rintro ⟨a, d, hd, ha1, had, h_mono⟩
    use a, d
    refine ⟨hd, ha1, had, ?_⟩
    intro m hm
    have h_m_le : a + m * d ≤ N := by
      have : m ≤ k - 1 := by omega
      have : m * d ≤ (k - 1) * d := Nat.mul_le_mul_right d this
      omega
    have h_a_le : a ≤ N := by omega
    have h_m_ge : a + m * d ≥ 1 := by omega
    rw [h_eq (a + m * d) h_m_le h_m_ge, h_eq a h_a_le ha1]
    exact h_mono m hm

lemma extend_j_steps (k N j : ℕ) (c : ℕ → Fin 2) (hk : k > 0)
  (hj : j ≤ k)
  (h_no_ap_k : ¬ HasMonoAP c N k) :
  ∃ c' : ℕ → Fin 2, (∀ x ≤ N, c' x = c x) ∧ ¬ HasMonoAP c' (N + j) (k + 1) := by
  induction j with
  | zero =>
    use c
    refine ⟨fun x hx => rfl, ?_⟩
    by_contra h_ap
    rcases h_ap with ⟨a, d, hd, ha1, had, h_mono⟩
    have h_ap_k : HasMonoAP c N k := by
      use a, d
      have h_k_eq : k + 1 - 1 = k := by omega
      rw [h_k_eq] at had
      have h_zero : N + 0 = N := by omega
      rw [h_zero] at had
      have h_le : a + (k - 1) * d ≤ N := by
        have : a + (k - 1) * d ≤ a + k * d := by
          have : (k - 1) * d ≤ k * d := Nat.mul_le_mul_right d (by omega)
          omega
        omega
      refine ⟨hd, ha1, h_le, ?_⟩
      intro m hm
      have h_m_lt : m < k + 1 := by omega
      exact h_mono m h_m_lt
    exact h_no_ap_k h_ap_k
  | succ j ih =>
    have hj_le : j ≤ k := by omega
    rcases ih hj_le with ⟨cj, h_eq_cj, h_no_ap_cj⟩
    have hj_lt : j < k := by omega
    have h_no_ap_k_cj : ¬ HasMonoAP cj N k := by
      intro h_ap
      have h_ap_c : HasMonoAP c N k := by
        have h_eq : ∀ x ≤ N, x ≥ 1 → cj x = c x := fun x hx _ => h_eq_cj x hx
        rw [← has_mono_ap_ext cj c N k h_eq]
        exact h_ap
      exact h_no_ap_k h_ap_c
    have h_ext := extend_one_step k j N cj hk hj_lt h_no_ap_k_cj h_no_ap_cj
    rcases h_ext with ⟨color, h_no_ap_cj1⟩
    use fun x => if x = N + j + 1 then color else cj x
    refine ⟨?_, ?_⟩
    · intro x hx
      have hx_neq : x ≠ N + j + 1 := by omega
      change (if x = N + j + 1 then color else cj x) = c x
      rw [if_neg hx_neq]
      exact h_eq_cj x hx
    · exact h_no_ap_cj1

def extend_coloring (N : ℕ) (c : Finset.Icc 1 N → Fin 2) : ℕ → Fin 2 :=
  fun x => if h : x ∈ Finset.Icc 1 N then c ⟨x, h⟩ else 0

def ap_equiv (a d k : ℕ) (hd : d > 0) : Fin k ≃ { x : ℕ | ∃ m < k, x = a + m * d } where
  toFun := fun m => ⟨a + m.val * d, by use m.val; exact ⟨m.isLt, rfl⟩⟩
  invFun := fun x => ⟨(x.val - a) / d, by
    rcases x.property with ⟨m, hm, h_eq⟩
    have h_sub : x.val - a = m * d := by omega
    have h_div : (x.val - a) / d = m := by
      rw [h_sub]
      exact Nat.mul_div_cancel m hd
    rw [h_div]
    exact hm⟩
  left_inv := fun m => by
    ext
    dsimp
    have h_sub : a + m.val * d - a = m.val * d := by omega
    rw [h_sub]
    exact Nat.mul_div_cancel m.val hd
  right_inv := fun x => by
    ext
    dsimp
    rcases x.property with ⟨m, hm, h_eq⟩
    have h_sub : x.val - a = m * d := by omega
    have h_div : (x.val - a) / d = m := by
      rw [h_sub]
      exact Nat.mul_div_cancel m hd
    rw [h_div]
    exact h_eq.symm

lemma card_ap_eq_k (a d k : ℕ) (hd : d > 0) (hk : k > 0) :
  ENat.card ↑{ x : ℕ | ∃ m < k, x = a + m * d } = k := by
  have h_equiv := ap_equiv a d k hd
  rw [← ENat.card_congr h_equiv]
  exact (ENat.card_eq_coe_fintype_card (α := Fin k)).trans (by simp)

lemma card_ap_pos_d (a d k : ℕ) (hk : k > 1) (h_card : ENat.card ↑{ x : ℕ | ∃ m < k, x = a + m * d } = k) :
  d > 0 := by
  by_contra h_zero
  have h_d : d = 0 := by omega
  have h_set : { x : ℕ | ∃ m < k, x = a + m * d } = {a} := by
    ext x
    simp only [Set.mem_setOf_eq, Set.mem_singleton_iff]
    constructor
    · rintro ⟨m, hm, rfl⟩
      rw [h_d]
      omega
    · rintro rfl
      use 0
      have : 0 < k := by omega
      exact ⟨this, by rw [h_d]; omega⟩
  have h_card_1 : ENat.card ↑{ x : ℕ | ∃ m < k, x = a + m * d } = 1 := by
    rw [h_set]
    exact Set.encard_singleton a
  have h_contra : (1 : ℕ∞) = (k : ℕ∞) := by
    rw [← h_card_1, h_card]
  have h_k_eq_1 : 1 = k := WithTop.coe_inj.mp h_contra
  omega


lemma contains_mono_ap_imp (N k : ℕ) (hk : k > 0) (c : Finset.Icc 1 N → Fin 2)
  (h : ContainsMonoAPofLength c k) :
  HasMonoAP (extend_coloring N c) N k := by
  unfold ContainsMonoAPofLength at h
  rcases h with ⟨c_color, ap, h_ap, h_mono⟩
  unfold Set.IsAPOfLength at h_ap
  rcases h_ap with ⟨a, d, h_ap_with⟩
  unfold Set.IsAPOfLengthWith at h_ap_with
  rcases h_ap_with with ⟨h_card, h_set⟩
  have h_set2 : (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap = {x : ℕ | ∃ m < k, x = a + m * d} := by
    have h_im : (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap = (fun x => ↑x) '' ap := rfl
    rw [h_im, h_set]
    ext x
    simp only [Set.mem_setOf_eq]
    constructor
    · rintro ⟨n, hn, hn_eq⟩
      have hn_lt : n < k := ENat.coe_lt_coe.mp hn
      use n, hn_lt
      exact (nsmul_eq_mul n d).symm ▸ hn_eq.symm
    · rintro ⟨m, hm, rfl⟩
      use m
      refine ⟨?_, ?_⟩
      · exact ENat.coe_lt_coe.mpr hm
      · exact (nsmul_eq_mul m d).symm ▸ rfl
  have h_card2 : ENat.card ↑{x : ℕ | ∃ m < k, x = a + m * d} = k := by
    have h_im : (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap = (fun x => ↑x) '' ap := rfl
    rw [← h_set2, h_im, h_card]
  have h_k_cases : k = 1 ∨ k > 1 := by omega
  rcases h_k_cases with (rfl | hk_gt)
  · have h_card_1 : ENat.card ↑{x : ℕ | ∃ m < 1, x = a + m * d} = 1 := h_card2
    have h_0_in : a ∈ {x : ℕ | ∃ m < 1, x = a + m * d} := by
      simp only [Set.mem_setOf_eq]
      use 0
      refine ⟨by omega, by omega⟩
    have h_0_LHS : a ∈ (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap := by
      rw [h_set2]
      exact h_0_in
    rcases h_0_LHS with ⟨x_0, h0_mem, h0_eq⟩
    change (x_0 : ℕ) = a at h0_eq
    have ha_ge1 : a ≥ 1 := by
      have h1 : 1 ≤ (x_0 : ℕ) := (Finset.mem_Icc.mp x_0.property).1
      omega
    have ha_leN : a ≤ N := by
      have hN : (x_0 : ℕ) ≤ N := (Finset.mem_Icc.mp x_0.property).2
      omega
    use a, 1
    refine ⟨by omega, ha_ge1, by omega, ?_⟩
    intro m hm
    have h_m_0 : m = 0 := by omega
    rw [h_m_0]
    have h_eq : a + 0 * 1 = a := by omega
    rw [h_eq]
  · have hd_pos : d > 0 := card_ap_pos_d a d k hk_gt h_card2
    have ha_ge1 : a ≥ 1 := by
      have h_in_RHS : a ∈ {x : ℕ | ∃ m < k, x = a + m * d} := by
        simp only [Set.mem_setOf_eq]
        use 0
        refine ⟨by omega, by omega⟩
      have h_in_LHS : a ∈ (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap := by
        rw [h_set2]
        exact h_in_RHS
      rcases h_in_LHS with ⟨x, hx_mem, hx_eq⟩
      change (x : ℕ) = a at hx_eq
      have h1 : 1 ≤ (x : ℕ) := (Finset.mem_Icc.mp x.property).1
      omega
    have h_end_le_N : a + (k - 1) * d ≤ N := by
      have h_in_RHS : a + (k - 1) * d ∈ {x : ℕ | ∃ m < k, x = a + m * d} := by
        simp only [Set.mem_setOf_eq]
        use k - 1
        refine ⟨by omega, rfl⟩
      have h_in_LHS : a + (k - 1) * d ∈ (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap := by
        rw [h_set2]
        exact h_in_RHS
      rcases h_in_LHS with ⟨x, hx_mem, hx_eq⟩
      change (x : ℕ) = a + (k - 1) * d at hx_eq
      have hN : (x : ℕ) ≤ N := (Finset.mem_Icc.mp x.property).2
      omega
    use a, d
    refine ⟨hd_pos, ha_ge1, h_end_le_N, ?_⟩
    intro m hm
    have h_in_RHS : a + m * d ∈ {x : ℕ | ∃ m' < k, x = a + m' * d} := by
      simp only [Set.mem_setOf_eq]
      use m
    have h_in_LHS : a + m * d ∈ (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap := by
      rw [h_set2]
      exact h_in_RHS
    rcases h_in_LHS with ⟨x_m, hxm_mem, hxm_eq⟩

    have h_0_RHS : a ∈ {x : ℕ | ∃ m' < k, x = a + m' * d} := by
      simp only [Set.mem_setOf_eq]
      use 0
      refine ⟨by omega, by omega⟩
    have h_0_LHS : a ∈ (fun (x : ↑(Finset.Icc 1 N)) => (x : ℕ)) '' ap := by
      rw [h_set2]
      exact h_0_RHS
    rcases h_0_LHS with ⟨x_0, h0_mem, h0_eq⟩

    unfold extend_coloring
    have h_in_m : a + m * d ∈ Finset.Icc 1 N := by
      rw [← hxm_eq]
      exact x_m.property
    have h_in_0 : a ∈ Finset.Icc 1 N := by
      rw [← h0_eq]
      exact x_0.property
    rw [dif_pos h_in_m, dif_pos h_in_0]
    have heq_m : (⟨a + m * d, h_in_m⟩ : Finset.Icc 1 N) = x_m := Subtype.ext hxm_eq.symm
    have heq_0 : (⟨a, h_in_0⟩ : Finset.Icc 1 N) = x_0 := Subtype.ext h0_eq.symm
    rw [heq_m, heq_0]
    have hc_m : c x_m = c_color := h_mono x_m hxm_mem
    have hc_0 : c x_0 = c_color := h_mono x_0 h0_mem
    rw [hc_m, hc_0]

lemma imp_contains_mono_ap (N k : ℕ) (hk : k > 0) (c : ℕ → Fin 2)
  (h : HasMonoAP c N k) :
  ContainsMonoAPofLength (fun (x : Finset.Icc 1 N) => c x.1) k := by
  rcases h with ⟨a, d, hd, ha1, han, hmono⟩
  unfold ContainsMonoAPofLength
  use c a
  let s_nat : Set ℕ := { x | ∃ m < k, x = a + m * d }
  have h_sub : s_nat ⊆ ↑(Finset.Icc 1 N) := by
    intro x hx
    rcases hx with ⟨m, hm, rfl⟩
    rw [Finset.mem_coe, Finset.mem_Icc]
    constructor
    · have : a ≤ a + m * d := Nat.le_add_right a (m * d)
      omega
    · have : m ≤ k - 1 := by omega
      have : m * d ≤ (k - 1) * d := Nat.mul_le_mul_right d this
      omega
  let ap : Set ↑(Finset.Icc 1 N) := { x | ↑x ∈ s_nat }
  use ap
  constructor
  · unfold Set.IsAPOfLength
    use a, d
    unfold Set.IsAPOfLengthWith
    have h_im : (fun (x : ↑(Finset.Icc 1 N)) => x.val) '' ap = s_nat := by
      ext x
      simp only [Set.mem_image, Subtype.exists, exists_and_right, exists_eq_right]
      constructor
      · rintro ⟨hx_mem, hx_eq⟩
        exact hx_eq
      · intro hx
        exact ⟨h_sub hx, hx⟩
    have h_card : ENat.card ↑s_nat = ↑k := card_ap_eq_k a d k hd hk
    have h_goal : ENat.card ↑s_nat = ↑k ∧ s_nat = {x | ∃ (n : ℕ), ∃ (_ : (n : ℕ∞) < (k : ℕ∞)), a + n • d = x} := by
      constructor
      · exact h_card
      · ext x
        simp only [Set.mem_setOf_eq]
        constructor
        · rintro ⟨m, hm, rfl⟩
          use m
          refine ⟨?_, ?_⟩
          · exact ENat.coe_lt_coe.mpr hm
          · exact (nsmul_eq_mul m d).symm ▸ rfl
        · rintro ⟨n, hn, hn_eq⟩
          have hn_lt : n < k := ENat.coe_lt_coe.mp hn
          use n, hn_lt
          have h_smul : n • d = n * d := nsmul_eq_mul n d
          rw [← hn_eq, h_smul]
    rw [← h_im] at h_goal
    exact h_goal
  · intro m hm
    change (m : ℕ) ∈ s_nat at hm
    rcases hm with ⟨m', hm', heq⟩
    change c (m : ℕ) = c a
    have heq' : (m : ℕ) = a + m' * d := heq
    have hmono' := hmono m' hm'
    rw [heq']
    exact hmono'

lemma not_guarantee_extend (k N : ℕ) (hk : k > 0) :
    N ∉ monoAP_guarantee_set 2 k → (N + k) ∉ monoAP_guarantee_set 2 (k + 1) := by
  intro hN
  unfold monoAP_guarantee_set at hN
  simp only [Set.mem_setOf_eq, not_forall] at hN
  rcases hN with ⟨c, hc⟩
  have h_no_ap : ¬ HasMonoAP (extend_coloring N c) N k := by
    intro h_ap
    have h_c_ap := imp_contains_mono_ap N k hk (extend_coloring N c) h_ap
    have h_eq_c : (fun (x : Finset.Icc 1 N) => extend_coloring N c x.1) = c := by
      ext x
      unfold extend_coloring
      have h_in : x.1 ∈ Finset.Icc 1 N := x.2
      rw [dif_pos h_in]
    rw [h_eq_c] at h_c_ap
    exact hc h_c_ap
  have h_ext := extend_j_steps k N k (extend_coloring N c) hk (by omega) h_no_ap
  rcases h_ext with ⟨c', hc'eq, hc'no⟩
  unfold monoAP_guarantee_set
  simp only [Set.mem_setOf_eq, not_forall]
  use (fun x => c' x.1)
  intro h_cont
  have h_has := contains_mono_ap_imp (N + k) (k + 1) (by omega) (fun x => c' x.1) h_cont
  have h_ext_eq : ∀ x ≤ N + k, x ≥ 1 → extend_coloring (N + k) (fun x => c' x.1) x = c' x := by
    intro x hx h_ge
    unfold extend_coloring
    have h_in : x ∈ Finset.Icc 1 (N + k) := by
      rw [Finset.mem_Icc]
      exact ⟨h_ge, hx⟩
    rw [dif_pos h_in]
  have h_has_c' : HasMonoAP c' (N + k) (k + 1) := by
    rw [← has_mono_ap_ext (extend_coloring (N + k) (fun x => c' x.1)) c' (N + k) (k + 1) h_ext_eq]
    exact h_has
  exact hc'no h_has_c'

lemma not_in_set_of_lt_sInf {s : Set ℕ} {n : ℕ} (h : n < sInf s) : n ∉ s := by
  intro hn
  have : sInf s ≤ n := csInf_le (OrderBot.bddBelow s) hn
  omega


noncomputable def U_limit_color (C : ℕ → ℕ → Fin 2) (U : Ultrafilter ℕ) (x : ℕ) : Fin 2 :=
  if {n | C n x = 0} ∈ U then 0 else 1

lemma U_limit_color_mem (C : ℕ → ℕ → Fin 2) (U : Ultrafilter ℕ) (x : ℕ) :
  {n | C n x = U_limit_color C U x} ∈ U := by
  unfold U_limit_color
  by_cases h0 : {n | C n x = 0} ∈ U
  · rw [if_pos h0]
    exact h0
  · rw [if_neg h0]
    have : {n | C n x = 0}ᶜ ∈ U := by
      have : {n | C n x = 0} ∪ {n | C n x = 0}ᶜ = Set.univ := Set.union_compl_self _
      have hu : Set.univ ∈ U := Filter.univ_mem
      rw [← this] at hu
      cases Ultrafilter.union_mem_iff.mp hu with
      | inl h1 => contradiction
      | inr h2 => exact h2
    have h_eq : {n | C n x = 0}ᶜ = {n | C n x = 1} := by
      ext n
      simp only [Set.mem_compl_iff, Set.mem_setOf_eq]
      constructor
      · intro h
        have h_cases : C n x = 0 ∨ C n x = 1 := by
          have h_lt : (C n x : ℕ) < 2 := (C n x).isLt
          have h_or : (C n x : ℕ) = 0 ∨ (C n x : ℕ) = 1 := by omega
          rcases h_or with h0 | h1
          · left; ext; exact h0
          · right; ext; exact h1
        rcases h_cases with h0_val | h1_val
        · contradiction
        · exact h1_val
      · intro h1 h0
        rw [h1] at h0
        revert h0
        decide
    rw [← h_eq]
    exact this

lemma U_inter_mem (C : ℕ → ℕ → Fin 2) (U : Ultrafilter ℕ) (a b k : ℕ) :
  {n | ∀ s < k, C n (a * s + b) = U_limit_color C U (a * s + b)} ∈ U := by
  induction k with
  | zero =>
    have h_eq : {n | ∀ s < 0, C n (a * s + b) = U_limit_color C U (a * s + b)} = Set.univ := by
      ext n
      simp only [Set.mem_setOf_eq, Set.mem_univ, iff_true]
      intro s hs
      omega
    rw [h_eq]
    exact Filter.univ_mem
  | succ k ih =>
    have h_k_mem := U_limit_color_mem C U (a * k + b)
    have h_inter := Filter.inter_mem ih h_k_mem
    have h_eq : {n | ∀ s < k, C n (a * s + b) = U_limit_color C U (a * s + b)} ∩ {n | C n (a * k + b) = U_limit_color C U (a * k + b)} = {n | ∀ s < k + 1, C n (a * s + b) = U_limit_color C U (a * s + b)} := by
      ext n
      simp only [Set.mem_inter_iff, Set.mem_setOf_eq]
      constructor
      · rintro ⟨h1, h2⟩ s hs
        have h_cases : s < k ∨ s = k := by omega
        rcases h_cases with hs_lt | rfl
        · exact h1 s hs_lt
        · exact h2
      · intro h
        constructor
        · intro s hs
          exact h s (by omega)
        · exact h k (by omega)
    rw [← h_eq]
    exact h_inter

lemma U_atTop_mem_large (U : Ultrafilter ℕ) (h_le : ↑U ≤ (Filter.atTop : Filter ℕ))
  (s : Set ℕ) (hs : s ∈ U) (M : ℕ) : ∃ n ∈ s, n ≥ M := by
  have hM : {n | n ≥ M} ∈ Filter.atTop := Filter.mem_atTop_sets.mpr ⟨M, fun _ h => h⟩
  have hM_U : {n | n ≥ M} ∈ U := h_le hM
  have h_inter : s ∩ {n | n ≥ M} ∈ U := Filter.inter_mem hs hM_U
  have h_ne_empty := Ultrafilter.nonempty_of_mem h_inter
  rcases h_ne_empty with ⟨n, hn⟩
  exact ⟨n, hn.1, hn.2⟩

lemma W_is_nonempty (k : ℕ) : (monoAP_guarantee_set 2 k).Nonempty := by
  by_cases hk : k = 0
  · use 0
    intro c
    unfold ContainsMonoAPofLength Set.IsAPOfLength Set.IsAPOfLengthWith
    use 0, ∅
    refine ⟨?_, ?_⟩
    · use 1, 1
      refine ⟨?_, ?_⟩
      · rw [hk]
        simp
      · ext x
        simp [hk]




    · intro m hm
      exfalso
      exact hm

  by_contra h_empty
  have h_forall : ∀ N, ∃ c : Finset.Icc 1 N → Fin 2, ¬ ContainsMonoAPofLength c k := by
    intro N
    have h_not_in : N ∉ monoAP_guarantee_set 2 k := by
      intro h_in
      exact h_empty ⟨N, h_in⟩
    unfold monoAP_guarantee_set at h_not_in
    simp only [Set.mem_setOf_eq, not_forall] at h_not_in
    exact h_not_in
  choose c hc using h_forall
  let C := fun n x => extend_coloring n (c n) x
  let U : Ultrafilter ℕ := Ultrafilter.of Filter.atTop
  let C_limit := U_limit_color C U
  have h_vdw := Combinatorics.exists_mono_homothetic_copy (Finset.range (k + 1)) C_limit
  rcases h_vdw with ⟨a, ha_pos, b, color, h_mono⟩
  have h_mono_eval : ∀ s < k + 1, C_limit (a * s + b) = color := by
    intro s hs
    have hs_mem : s ∈ Finset.range (k + 1) := Finset.mem_range.mpr hs
    have h_eq : a • s + b = a * s + b := by
      have : a • s = a * s := nsmul_eq_mul a s
      rw [this]
    have h_val := h_mono s hs_mem
    rw [h_eq] at h_val
    exact h_val

  have h_inter := U_inter_mem C U a b (k + 1)
  have h_sub : {n | ∀ s < k + 1, C n (a * s + b) = U_limit_color C U (a * s + b)} ⊆ {n | ∀ s < k + 1, C n (a * s + b) = color} := by
    intro n hn s hs
    have h_lim := h_mono_eval s hs
    rw [← h_lim]
    exact hn s hs
  have h_color_mem : {n | ∀ s < k + 1, C n (a * s + b) = color} ∈ U := Filter.mem_of_superset h_inter h_sub

  have h_le_U : ↑U ≤ (Filter.atTop : Filter ℕ) := Ultrafilter.of_le Filter.atTop

  have h_large := U_atTop_mem_large U h_le_U {n | ∀ s < k + 1, C n (a * s + b) = color} h_color_mem (a * (k + 1) + b + 1)
  rcases h_large with ⟨N, hN_mem, hN_ge⟩

  have hk_pos : k > 0 := by omega
  have h_ap : HasMonoAP (C N) N k := by
    use a + b, a
    have hb_ge1 : a + b ≥ 1 := by omega
    refine ⟨ha_pos, hb_ge1, ?_, ?_⟩
    · have h_k1 : a * (k + 1) = a * k + a := by
        calc a * (k + 1) = a * k + a * 1 := Nat.mul_add a k 1
        _ = a * k + a := by rw [Nat.mul_one]
      have h_k_1 : (k - 1) * a = k * a - a := by
        calc (k - 1) * a = k * a - 1 * a := Nat.sub_mul k 1 a
        _ = k * a - a := by rw [Nat.one_mul]
      have h_bound : a + b + (k - 1) * a ≤ a * k + a + b := by
        rw [h_k_1]
        have : k * a = a * k := Nat.mul_comm k a
        rw [this]
        omega
      have hN_ge_val : N ≥ a * (k + 1) + b + 1 := hN_ge
      rw [h_k1] at hN_ge_val
      omega
    · intro m hm
      have h1 := hN_mem (m + 1) (by omega)
      have h0 := hN_mem 1 (by omega)
      have h_add0 : a * 1 + b = a + b := by
        rw [Nat.mul_one]
      have h_addm : a * (m + 1) + b = a + b + m * a := by
        calc a * (m + 1) + b = a * m + a * 1 + b := by rw [Nat.mul_add]
        _ = a * m + a + b := by rw [Nat.mul_one]
        _ = m * a + a + b := by rw [Nat.mul_comm a m]
        _ = a + b + m * a := by omega
      rw [h_add0] at h0
      rw [h_addm] at h1
      rw [h1, h0]


  have h_c_ap := imp_contains_mono_ap N k (by omega) (C N) h_ap
  have h_eq_c : (fun (x : Finset.Icc 1 N) => C N x.1) = c N := by
    ext x
    unfold C extend_coloring
    have h_in : x.1 ∈ Finset.Icc 1 N := x.2
    rw [dif_pos h_in]
  rw [h_eq_c] at h_c_ap
  exact hc N h_c_ap

lemma Icc_subset_succ (N x : ℕ) (hx : x ∈ Finset.Icc 1 N) : x ∈ Finset.Icc 1 (N + 1) := by
  rw [Finset.mem_Icc] at hx ⊢
  omega

lemma guarantee_upward_closed (k r N : ℕ) :
    N ∈ monoAP_guarantee_set r k → (N + 1) ∈ monoAP_guarantee_set r k := by
  intro h_in c
  let c' : Finset.Icc 1 N → Fin r := fun x => c ⟨x.1, Icc_subset_succ N x.1 x.2⟩
  have h_ap := h_in c'
  unfold ContainsMonoAPofLength at h_ap ⊢
  rcases h_ap with ⟨color, ap, h_ap_len, h_mono⟩
  let ap' : Set (Finset.Icc 1 (N + 1)) := { x | (x : ℕ) ∈ (fun (y : ↑(Finset.Icc 1 N)) => (y : ℕ)) '' ap }
  use color, ap'
  constructor
  · unfold Set.IsAPOfLength at h_ap_len ⊢
    rcases h_ap_len with ⟨a, d, h_ap_with⟩
    use a, d
    unfold Set.IsAPOfLengthWith at h_ap_with ⊢
    rcases h_ap_with with ⟨h_card, h_set⟩
    constructor
    · have h_im_eq : (fun (x : Finset.Icc 1 (N + 1)) => (x : ℕ)) '' ap' = (fun (y : Finset.Icc 1 N) => (y : ℕ)) '' ap := by
        ext n
        simp only [Set.mem_image]
        constructor
        · rintro ⟨x, hx_mem, rfl⟩
          exact hx_mem
        · rintro ⟨y, hy_mem, rfl⟩
          have hy_in : (y : ℕ) ∈ Finset.Icc 1 (N + 1) := Icc_subset_succ N (y : ℕ) y.2
          exact ⟨⟨(y : ℕ), hy_in⟩, ⟨y, hy_mem, rfl⟩, rfl⟩
      change ENat.card ↑((fun (x : Finset.Icc 1 (N + 1)) => (x : ℕ)) '' ap') = (k : ℕ∞)
      rw [h_im_eq]
      exact h_card
    · have h_im_eq : (fun (x : Finset.Icc 1 (N + 1)) => (x : ℕ)) '' ap' = (fun (y : Finset.Icc 1 N) => (y : ℕ)) '' ap := by
        ext n
        simp only [Set.mem_image]
        constructor
        · rintro ⟨x, hx_mem, rfl⟩
          exact hx_mem
        · rintro ⟨y, hy_mem, rfl⟩
          have hy_in : (y : ℕ) ∈ Finset.Icc 1 (N + 1) := Icc_subset_succ N (y : ℕ) y.2
          exact ⟨⟨(y : ℕ), hy_in⟩, ⟨y, hy_mem, rfl⟩, rfl⟩
      change (fun (x : Finset.Icc 1 (N + 1)) => (x : ℕ)) '' ap' = {x | ∃ (n : ℕ), ∃ (_ : (n : ℕ∞) < (k : ℕ∞)), a + n • d = x}
      rw [h_im_eq]
      exact h_set
  · intro x hx
    change (x : ℕ) ∈ (fun (y : ↑(Finset.Icc 1 N)) => (y : ℕ)) '' ap at hx
    rcases hx with ⟨y, hy_mem, hy_eq⟩
    have hc' := h_mono y hy_mem
    change c ⟨(y : ℕ), Icc_subset_succ N (y : ℕ) y.2⟩ = color at hc'
    have h_x_eq : (x : ℕ) = (y : ℕ) := hy_eq.symm
    have h_x_subtype : x = ⟨(y : ℕ), Icc_subset_succ N (y : ℕ) y.2⟩ := Subtype.ext h_x_eq
    rw [h_x_subtype]
    exact hc'

lemma not_in_guarantee_lt_sInf (k N : ℕ) (hN : N ∉ monoAP_guarantee_set 2 k) :
    N < W k := by
  have h_nonempty := W_is_nonempty k
  have h_min_in : W k ∈ monoAP_guarantee_set 2 k := Nat.sInf_mem h_nonempty
  by_contra h_ge
  push_neg at h_ge
  have h_ge_diff : ∃ d, N = W k + d := ⟨N - W k, (Nat.add_sub_of_le h_ge).symm⟩
  rcases h_ge_diff with ⟨d, rfl⟩
  have h_in : W k + d ∈ monoAP_guarantee_set 2 k := by
    clear hN h_ge
    induction d with
    | zero => exact h_min_in
    | succ d ih =>
      have h_eq : W k + Nat.succ d = W k + d + 1 := by omega
      rw [h_eq]
      exact guarantee_upward_closed k 2 (W k + d) ih
  exact hN h_in

lemma W_not_guarantee (k : ℕ) (hW : W k ≠ 0) : W k - 1 ∉ monoAP_guarantee_set 2 k := by
  apply not_in_set_of_lt_sInf
  change W k - 1 < W k
  omega

lemma W_diff_bound_gt0 (k : ℕ) (hk : k > 0) (hW : W k ≠ 0) : W (k + 1) - W k ≥ k := by
  have h_not := W_not_guarantee k hW
  have h_ext := not_guarantee_extend k (W k - 1) hk h_not
  have h_W_gt : W k - 1 + k < W (k + 1) := not_in_guarantee_lt_sInf (k + 1) (W k - 1 + k) h_ext
  omega

lemma W_diff_ge_k (k : ℕ) : W (k + 1) - W k ≥ k := by
  by_cases hk : k = 0
  · subst hk; omega
  · by_cases hW : W k = 0
    · have h_not : 0 ∉ monoAP_guarantee_set 2 k := by
        intro h_in
        unfold monoAP_guarantee_set at h_in
        simp only [Set.mem_setOf_eq] at h_in
        have c0 : Finset.Icc 1 0 → Fin 2 := fun _ => 0
        have h_ap := h_in c0
        unfold ContainsMonoAPofLength at h_ap
        rcases h_ap with ⟨color, ap, h_ap_len, _⟩
        unfold Set.IsAPOfLength at h_ap_len
        rcases h_ap_len with ⟨a, d, h_with⟩
        unfold Set.IsAPOfLengthWith at h_with
        rcases h_with with ⟨h_card, h_set⟩
        have h_0_in : a + 0 • d ∈ {x : ℕ | ∃ n : ℕ, ∃ (_ : (n : ℕ∞) < (k : ℕ∞)), a + n • d = x} := by
          use 0
          exact ⟨ENat.coe_lt_coe.mpr (Nat.pos_of_ne_zero hk), rfl⟩
        rw [← h_set] at h_0_in
        rcases h_0_in with ⟨x, hx_mem, hx_eq⟩
        have hx_prop := x.property
        rw [Finset.mem_coe, Finset.mem_Icc] at hx_prop
        omega
      have h_ext := not_guarantee_extend k 0 (Nat.pos_of_ne_zero hk) h_not
      have h_W_gt : 0 + k < W (k + 1) := not_in_guarantee_lt_sInf (k + 1) (0 + k) h_ext
      omega
    · exact W_diff_bound_gt0 k (Nat.pos_of_ne_zero hk) hW
lemma W_diff_ge_k_all (k : ℕ) : W (k + 1) - W k ≥ k := by
  cases k with
  | zero => exact Nat.zero_le _
  | succ k => exact W_diff_ge_k (k + 1)

-- EVOLVE-BLOCK-END


theorem target_theorem_0
  : answer(
  -- EVOLVE-VALUE-START
  True
  -- EVOLVE-VALUE-END
  ) ↔ atTop.Tendsto (fun k => (W (k + 1) - W k)) atTop := by
  -- EVOLVE-BLOCK-START
  constructor
  · intro _
    exact Filter.tendsto_atTop_mono W_diff_ge_k_all Filter.tendsto_id
  · intro _
    trivial
  -- EVOLVE-BLOCK-END
