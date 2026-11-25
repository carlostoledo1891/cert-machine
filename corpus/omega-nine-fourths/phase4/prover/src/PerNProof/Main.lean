import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.SquareExponent
import OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization
import OAI.LinearAlgebra.SpectralBooks.BorderComparison
import OAI.LinearAlgebra.SpectralBooks.RankLimit
import OAI.LinearAlgebra.SpectralBooks.RationalDerivative
import PerNProof.PerN

/-!
# Phase 4: proofs of the sealed per-n statements (ω = 9/4 lane, cert-machine, 2026-11-25)

Proves the four propositions of the statement writer's sealed `PerN.lean` (amendment A14,
sha256 71a4378d…), imported here as the byte copy `PerNProof.PerN`, from the release
(openai/math 92b516ef) and lemmas of our own.

* `PerN.AsymptoticRank` (row G3c): the sealed `tensorRank`, `matMul`, `tpow` are the release's
  `tensorRank`, `matrixTensor F n n n`, `Tensor.power` (`tensorRank_eq`, `matMul_eq`); the limit is
  the release's `tendsto_tensorRank_power_root` (Fekete), the value
  `square_asymptoticRank_eq_rpow_formalOmega` with `square_exponent`.
* `PerN.BorderRankLower` (row G3d): the sealed Zariski closure (`zeroLocus` of `vanishingIdeal`) is
  the release's `GeometricBorderRankAtMost` (`mem_closure_iff`), so the sealed border rank is the
  release's `geometricBorderRank` (`geometricBorderRank_eq`), and the release proves
  `asymptoticRank_le_geometricBorderRank`.
* `PerN.GatesPerN` (row G3b): the paper's Lemma 2.4 in its NONSCALAR count is not in the release
  (it counts every multiplication: `matrixTensor_rank_le_twice_productQuotientCount`). We prove it
  here on the sealed circuit model (`mixed_mem`, `rank_le_nonscalar`): the formal mixed second
  partial derivatives (the release's `ratMixed` on the rational function field) of every gate lie
  in the span of two products of first derivatives per nonscalar gate; a multiplication with a
  constant operand and a division by a constant add no product, since a constant has zero first
  derivatives. The rank over the rational function field is then at most twice the nonscalar count,
  the release moves it to the algebraic closure (`matrix_tensorRank_algebraicClosure_le_fractionRing`)
  and bounds it below by `n ^ formalOmega` (`rpow_formalOmega_le_tensorRank`, `square_exponent`).
* `PerN.GatesPerNAll` (row G3a): from `GatesPerN`, every nonscalar gate being a multiplication or a
  division (`nonscalar_le_mulDiv`).
-/

noncomputable section

namespace PerNProof

open OAI.LinearAlgebra.SpectralBooks
open OAI.MatrixMultiplication.Foundation

/-! ## The sealed tensor definitions against the release's -/

theorem hasRankLE_iff {K ι₁ ι₂ ι₃ : Type} [Field K] (T : PerN.Tensor3 K ι₁ ι₂ ι₃) (r : ℕ) :
    PerN.HasRankLE T r ↔ Tensor.RankAtMost (K := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T r := by
  constructor
  · rintro ⟨u, v, w, h⟩
    refine ⟨u, v, w, ?_⟩
    funext a b c
    simp only [Tensor.rankOne]
    exact h a b c
  · rintro ⟨u, v, w, h⟩
    refine ⟨u, v, w, fun a b c => ?_⟩
    have h' := congrFun (congrFun (congrFun h a) b) c
    simpa only [Tensor.rankOne] using h'

theorem tensorRank_eq {K ι₁ ι₂ ι₃ : Type} [Field K] [Fintype ι₁] [Fintype ι₂]
    (T : PerN.Tensor3 K ι₁ ι₂ ι₃) :
    PerN.tensorRank T = tensorRank (F := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T := by
  have hmem : tensorRank (F := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T ∈
      {r : ℕ | PerN.HasRankLE T r} :=
    (hasRankLE_iff T _).mpr (rankAtMost_tensorRank _)
  have hne : {r : ℕ | PerN.HasRankLE T r}.Nonempty := ⟨_, hmem⟩
  apply le_antisymm
  · exact Nat.sInf_le hmem
  · apply tensorRank_le_of_rankAtMost
    exact (hasRankLE_iff T _).mp (Nat.sInf_mem hne)

theorem matMul_eq (K : Type) [Field K] (n : ℕ) : PerN.matMul K n = matrixTensor K n n n := by
  funext a b c
  rfl

theorem toAlgebraicClosure_matrixTensor (F : Type) [Field F] (n : ℕ) :
    toAlgebraicClosure (matrixTensor F n n n) = PerN.matMul (AlgebraicClosure F) n := by
  rw [matMul_eq]
  funext a b c
  simp only [toAlgebraicClosure, matrixTensor, Tensor.matrixCoefficients]
  split_ifs <;> simp

/-! ## Asymptotic rank (row G3c) -/

theorem asymptotic_eq (F : Type) [Field F] {n : ℕ} (hn : 2 ≤ n) :
    asymptoticRank (matrixTensor F n n n) = (n : ℝ) ^ ((9 : ℝ) / 4) := by
  rw [square_asymptoticRank_eq_rpow_formalOmega F hn, square_exponent F]

theorem rankRoot_eq (F : Type) [Field F] (n k : ℕ) :
    PerN.rankRoot (PerN.matMul F n) k =
      (tensorRank (Tensor.power (matrixTensor F n n n) k) : ℝ) ^ ((k : ℝ)⁻¹) := by
  unfold PerN.rankRoot
  rw [matMul_eq, tensorRank_eq]
  rfl

theorem asymptoticRank_main (F : Type) [Field F] (n : ℕ) (hn : 2 ≤ n) :
    Filter.Tendsto (fun k : ℕ => PerN.rankRoot (PerN.matMul F n) k) Filter.atTop
        (nhds ((n : ℝ) ^ ((9 : ℝ) / 4))) ∧
      PerN.asymptoticRank (PerN.matMul F n) = (n : ℝ) ^ ((9 : ℝ) / 4) := by
  refine ⟨?_, ?_⟩
  · have h := tendsto_tensorRank_power_root (matrixTensor F n n n)
    rw [asymptotic_eq F hn] at h
    exact h.congr (fun k => (rankRoot_eq F n k).symm)
  · rw [← asymptotic_eq F hn]
    unfold PerN.asymptoticRank OAI.LinearAlgebra.SpectralBooks.asymptoticRank
    congr 1
    funext k
    simp only [rankRoot_eq, Nat.cast_add, Nat.cast_one]

/-! ## Geometric border rank (row G3d) -/

theorem mem_closure_iff (F : Type) [Field F] (n r : ℕ) :
    PerN.flat (PerN.matMul (AlgebraicClosure F) n) ∈
        PerN.zariskiClosure (PerN.rankLESet (AlgebraicClosure F) (Fin n × Fin n) (Fin n × Fin n)
          (Fin n × Fin n) r) ↔
      GeometricBorderRankAtMost (matrixTensor F n n n) r := by
  unfold PerN.zariskiClosure GeometricBorderRankAtMost
  rw [toAlgebraicClosure_matrixTensor]
  constructor
  · intro h p hp
    exact (MvPolynomial.mem_zeroLocus_iff.mp h) p (MvPolynomial.mem_vanishingIdeal_iff.mpr
      (by
        rintro x ⟨S, hS, rfl⟩
        exact hp S ((hasRankLE_iff S r).mp hS)))
  · intro h
    refine MvPolynomial.mem_zeroLocus_iff.mpr (fun p hp => ?_)
    exact h p (fun S hS =>
      (MvPolynomial.mem_vanishingIdeal_iff.mp hp) (PerN.flat S) ⟨S, (hasRankLE_iff S r).mpr hS, rfl⟩)

theorem geometricBorderRank_eq (F : Type) [Field F] (n : ℕ) :
    PerN.geometricBorderRank (PerN.matMul (AlgebraicClosure F) n) =
      geometricBorderRank (matrixTensor F n n n) := by
  have hset : {r : ℕ | PerN.flat (PerN.matMul (AlgebraicClosure F) n) ∈
      PerN.zariskiClosure (PerN.rankLESet (AlgebraicClosure F) (Fin n × Fin n) (Fin n × Fin n)
        (Fin n × Fin n) r)} = {r : ℕ | GeometricBorderRankAtMost (matrixTensor F n n n) r} :=
    Set.ext (fun r => mem_closure_iff F n r)
  have hne : {r : ℕ | GeometricBorderRankAtMost (matrixTensor F n n n) r}.Nonempty :=
    ⟨_, geometricBorderRankAtMost_geometricBorderRank _⟩
  unfold PerN.geometricBorderRank
  rw [hset]
  apply le_antisymm
  · exact Nat.sInf_le (s := {r : ℕ | GeometricBorderRankAtMost (matrixTensor F n n n) r})
      (geometricBorderRankAtMost_geometricBorderRank _)
  · exact geometricBorderRank_le_of_atMost (Nat.sInf_mem hne)

theorem borderRankLower_main (F : Type) [Field F] (n : ℕ) (hn : 2 ≤ n) :
    (n : ℝ) ^ ((9 : ℝ) / 4) ≤
      (PerN.geometricBorderRank (PerN.matMul (AlgebraicClosure F) n) : ℝ) := by
  rw [geometricBorderRank_eq F n, ← asymptotic_eq F hn]
  exact asymptoticRank_le_geometricBorderRank _

/-! ## Nonscalar gates (row G3b): the paper's Lemma 2.4 on the sealed circuit model -/

section Gates

variable {F : Type} [Field F] {n : ℕ}

/-- The formal partial derivative in a left (first-matrix) entry. -/
def dL (p : PerN.RF F n) (x : Fin n × Fin n) : PerN.RF F n :=
  ratPartial (Sum.inl x : PerN.MatVar n) p

/-- The formal partial derivative in a right (second-matrix) entry. -/
def dR (p : PerN.RF F n) (y : Fin n × Fin n) : PerN.RF F n :=
  ratPartial (Sum.inr y : PerN.MatVar n) p

/-- The formal mixed second partial derivatives, as a function of the two entries. -/
def mixedFn (p : PerN.RF F n) : Fin n × Fin n → Fin n × Fin n → PerN.RF F n :=
  fun x y => ratMixed p x y

theorem dL_const {f : PerN.RF F n} (hf : PerN.IsConstRF F n f) (x : Fin n × Fin n) :
    dL f x = 0 := by
  obtain ⟨c, rfl⟩ := hf
  simp [dL, PerN.ratConst, ratPartial_polynomial]

theorem dR_const {f : PerN.RF F n} (hf : PerN.IsConstRF F n f) (y : Fin n × Fin n) :
    dR f y = 0 := by
  obtain ⟨c, rfl⟩ := hf
  simp [dR, PerN.ratConst, ratPartial_polynomial]

/-- The left factors of the two products a gate at position `m` may contribute. -/
def gateL (val : ℕ → PerN.RF F n) (m : ℕ) :
    PerN.Gate (PerN.MatVar n) F → Bool → Fin n × Fin n → PerN.RF F n
  | .mul a _, true => dL (val a)
  | .mul _ b, false => dL (val b)
  | .div _ _, true => dL (val m)
  | .div _ b, false => dL (val b)
  | _, _ => 0

/-- The right factors of the two products a gate at position `m` may contribute. -/
def gateR (val : ℕ → PerN.RF F n) (m : ℕ) :
    PerN.Gate (PerN.MatVar n) F → Bool → Fin n × Fin n → PerN.RF F n
  | .mul _ b, true => dR (val b)
  | .mul a _, false => dR (val a)
  | .div _ b, true => dR (val b)
  | .div _ _, false => dR (val m)
  | _, _ => 0

open scoped Classical in
/-- The nonscalar positions, filtered exactly as in the sealed `Circuit.nonscalarCount`. -/
def nsSet (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) : Finset (Fin C.size) :=
  Finset.univ.filter
    (fun m : Fin C.size => PerN.Gate.IsNonscalar (PerN.IsConstRF F n) val (C.gate m))

theorem nsSet_card (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) :
    (nsSet C val).card = C.nonscalarCount (PerN.IsConstRF F n) val := rfl

/-- Two products per nonscalar position. -/
abbrev NsIdx (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) : Type :=
  ↥(nsSet C val) × Bool

def famL (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) (i : NsIdx C val) :
    Fin n × Fin n → PerN.RF F n :=
  gateL val i.1.1.val (C.gate i.1.1) i.2

def famR (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) (i : NsIdx C val) :
    Fin n × Fin n → PerN.RF F n :=
  gateR val i.1.1.val (C.gate i.1.1) i.2

/-- The products of first derivatives contributed by the nonscalar gates. -/
def fam (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n) (i : NsIdx C val) :
    Fin n × Fin n → Fin n × Fin n → PerN.RF F n :=
  fun x y => famL C val i x * famR C val i y

/-- Every gate's mixed derivatives lie in the span of the nonscalar gates' products. -/
theorem mixed_mem (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n)
    (hWF : C.WellFormed) (hC : C.Consistent (PerN.ratVar F n) (PerN.ratConst F n) val) :
    ∀ m, m < C.size →
      mixedFn (val m) ∈ Submodule.span (PerN.RF F n) (Set.range (fam C val)) := by
  classical
  intro m
  induction m using Nat.strong_induction_on
  rename_i m ih
  intro hm
  have hg : PerN.Gate.Holds (PerN.ratVar F n) (PerN.ratConst F n) val m (C.gate ⟨m, hm⟩) :=
    hC ⟨m, hm⟩
  have hwf : ∀ a ∈ PerN.Gate.args (C.gate ⟨m, hm⟩), a < m := hWF ⟨m, hm⟩
  generalize hgate : C.gate ⟨m, hm⟩ = g at hg hwf
  cases g with
  | input v =>
    simp only [PerN.Gate.Holds] at hg
    have h0 : mixedFn (val m) = 0 := by
      funext x y
      simp only [mixedFn, hg, PerN.ratVar, Pi.zero_apply]
      exact ratMixed_X _ _ _
    rw [h0]
    exact Submodule.zero_mem _
  | const c =>
    simp only [PerN.Gate.Holds] at hg
    have h0 : mixedFn (val m) = 0 := by
      funext x y
      simp only [mixedFn, hg, PerN.ratConst, Pi.zero_apply]
      exact ratMixed_C _ _ _
    rw [h0]
    exact Submodule.zero_mem _
  | add a b =>
    simp only [PerN.Gate.Holds] at hg
    have ha : a < m := hwf a (by simp [PerN.Gate.args])
    have hb : b < m := hwf b (by simp [PerN.Gate.args])
    have he : mixedFn (val m) = mixedFn (val a) + mixedFn (val b) := by
      funext x y
      simp only [mixedFn, hg, Pi.add_apply]
      exact ratMixed_add _ _ _ _
    rw [he]
    exact add_mem (ih a ha (by omega)) (ih b hb (by omega))
  | sub a b =>
    simp only [PerN.Gate.Holds] at hg
    have ha : a < m := hwf a (by simp [PerN.Gate.args])
    have hb : b < m := hwf b (by simp [PerN.Gate.args])
    have he : mixedFn (val m) = mixedFn (val a) - mixedFn (val b) := by
      funext x y
      simp only [mixedFn, hg, Pi.sub_apply]
      exact ratMixed_sub _ _ _ _
    rw [he]
    exact sub_mem (ih a ha (by omega)) (ih b hb (by omega))
  | mul a b =>
    simp only [PerN.Gate.Holds] at hg
    have ha : a < m := hwf a (by simp [PerN.Gate.args])
    have hb : b < m := hwf b (by simp [PerN.Gate.args])
    have he : mixedFn (val m) = val b • mixedFn (val a) + val a • mixedFn (val b) +
        ((fun x y => dL (val a) x * dR (val b) y) + (fun x y => dL (val b) x * dR (val a) y)) := by
      funext x y
      simp only [mixedFn, hg, Pi.add_apply, Pi.smul_apply, smul_eq_mul, dL, dR]
      rw [ratMixed_mul]
      ring
    rw [he]
    refine add_mem (add_mem (Submodule.smul_mem _ _ (ih a ha (by omega)))
      (Submodule.smul_mem _ _ (ih b hb (by omega)))) ?_
    by_cases hns : ¬ PerN.IsConstRF F n (val a) ∧ ¬ PerN.IsConstRF F n (val b)
    · have hmem : (⟨m, hm⟩ : Fin C.size) ∈ nsSet C val := by
        unfold nsSet
        rw [Finset.mem_filter]
        refine ⟨Finset.mem_univ _, ?_⟩
        show PerN.Gate.IsNonscalar (PerN.IsConstRF F n) val (C.gate ⟨m, hm⟩)
        rw [hgate]
        exact hns
      have e1 : (fun x y => dL (val a) x * dR (val b) y) =
          fam C val ⟨⟨⟨m, hm⟩, hmem⟩, true⟩ := by
        funext x y
        simp only [fam, famL, famR, hgate, gateL, gateR]
      have e2 : (fun x y => dL (val b) x * dR (val a) y) =
          fam C val ⟨⟨⟨m, hm⟩, hmem⟩, false⟩ := by
        funext x y
        simp only [fam, famL, famR, hgate, gateL, gateR]
      rw [e1, e2]
      exact add_mem (Submodule.subset_span ⟨_, rfl⟩) (Submodule.subset_span ⟨_, rfl⟩)
    · have hz : (fun x y => dL (val a) x * dR (val b) y) +
          (fun x y => dL (val b) x * dR (val a) y) = 0 := by
        rcases not_and_or.mp hns with h | h
        · have h' := not_not.mp h
          funext x y
          simp [dL_const h', dR_const h']
        · have h' := not_not.mp h
          funext x y
          simp [dL_const h', dR_const h']
      rw [hz]
      exact Submodule.zero_mem _
  | div a b =>
    simp only [PerN.Gate.Holds] at hg
    obtain ⟨hb0, hval⟩ := hg
    have ha : a < m := hwf a (by simp [PerN.Gate.args])
    have hb : b < m := hwf b (by simp [PerN.Gate.args])
    have hmul : val m * val b = val a := by rw [hval, div_mul_cancel₀ _ hb0]
    have he : mixedFn (val m) = (val b)⁻¹ • (mixedFn (val a) - val m • mixedFn (val b) -
        ((fun x y => dL (val m) x * dR (val b) y) + (fun x y => dL (val b) x * dR (val m) y))) := by
      funext x y
      simp only [mixedFn, Pi.add_apply, Pi.sub_apply, Pi.smul_apply, smul_eq_mul, dL, dR]
      rw [eq_inv_mul_iff_mul_eq₀ hb0, ← hmul, ratMixed_mul]
      ring
    rw [he]
    refine Submodule.smul_mem _ _ (sub_mem (sub_mem (ih a ha (by omega))
      (Submodule.smul_mem _ _ (ih b hb (by omega)))) ?_)
    by_cases hns : ¬ PerN.IsConstRF F n (val b)
    · have hmem : (⟨m, hm⟩ : Fin C.size) ∈ nsSet C val := by
        unfold nsSet
        rw [Finset.mem_filter]
        refine ⟨Finset.mem_univ _, ?_⟩
        show PerN.Gate.IsNonscalar (PerN.IsConstRF F n) val (C.gate ⟨m, hm⟩)
        rw [hgate]
        exact hns
      have e1 : (fun x y => dL (val m) x * dR (val b) y) =
          fam C val ⟨⟨⟨m, hm⟩, hmem⟩, true⟩ := by
        funext x y
        simp only [fam, famL, famR, hgate, gateL, gateR]
      have e2 : (fun x y => dL (val b) x * dR (val m) y) =
          fam C val ⟨⟨⟨m, hm⟩, hmem⟩, false⟩ := by
        funext x y
        simp only [fam, famL, famR, hgate, gateL, gateR]
      rw [e1, e2]
      exact add_mem (Submodule.subset_span ⟨_, rfl⟩) (Submodule.subset_span ⟨_, rfl⟩)
    · have h' := not_not.mp hns
      have hz : (fun x y => dL (val m) x * dR (val b) y) +
          (fun x y => dL (val b) x * dR (val m) y) = 0 := by
        funext x y
        simp [dL_const h', dR_const h']
      rw [hz]
      exact Submodule.zero_mem _

/-- Lemma 2.4, nonscalar form, over the rational function field: the rank of `T_n` there is at
most twice the number of nonscalar multiplication and division gates. -/
theorem rank_le_nonscalar (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n)
    (out : Fin n → Fin n → Fin C.size) (hWF : C.WellFormed)
    (hC : C.Consistent (PerN.ratVar F n) (PerN.ratConst F n) val)
    (hout : ∀ i k : Fin n, val (out i k).val = ∑ j : Fin n, PerN.ratX F n i j * PerN.ratY F n j k) :
    tensorRank (matrixTensor (PerN.RF F n) n n n) ≤
      2 * C.nonscalarCount (PerN.IsConstRF F n) val := by
  classical
  have hslice : ∀ z : Fin n × Fin n,
      (fun x y => matrixTensor (PerN.RF F n) n n n x y z) ∈
        Submodule.span (PerN.RF F n) (Set.range (fam C val)) := by
    rintro ⟨k, i⟩
    have h := mixed_mem C val hWF hC (out i k).val (out i k).isLt
    have heq : mixedFn (val (out i k).val) =
        fun x y => matrixTensor (PerN.RF F n) n n n x y (k, i) := by
      funext x y
      simp only [mixedFn, hout i k, PerN.ratX, PerN.ratY, PerN.ratVar]
      exact ratMixed_matrixEntry i k x y
    rw [heq] at h
    exact h
  choose c hc using fun z =>
    (Submodule.mem_span_range_iff_exists_fun (PerN.RF F n)).mp (hslice z)
  let e := Fintype.equivFin (NsIdx C val)
  have hr : Tensor.RankAtMost (matrixTensor (PerN.RF F n) n n n) (Fintype.card (NsIdx C val)) := by
    refine ⟨fun t => famL C val (e.symm t), fun t => famR C val (e.symm t),
      fun t z => c z (e.symm t), ?_⟩
    funext x y z
    have h : (∑ i, c z i • fam C val i) x y = matrixTensor (PerN.RF F n) n n n x y z :=
      congrFun (congrFun (hc z) x) y
    rw [← h]
    simp only [Finset.sum_apply, Pi.smul_apply, smul_eq_mul, fam, Tensor.rankOne]
    exact Fintype.sum_equiv e _ _ (fun i => by simp only [Equiv.symm_apply_apply]; ring)
  have hcard : Fintype.card (NsIdx C val) = 2 * C.nonscalarCount (PerN.IsConstRF F n) val := by
    rw [Fintype.card_prod, Fintype.card_coe, Fintype.card_bool, nsSet_card]
    ring
  exact (tensorRank_le_of_rankAtMost hr).trans hcard.le

end Gates

/-- `GatesPerN`, for one field and one circuit. -/
theorem gatesPerN_main (F : Type) [Field F] (n : ℕ) (hn : 2 ≤ n)
    (C : PerN.Circuit (PerN.MatVar n) F) (val : ℕ → PerN.RF F n)
    (out : Fin n → Fin n → Fin C.size) (hWF : C.WellFormed)
    (hC : C.Consistent (PerN.ratVar F n) (PerN.ratConst F n) val)
    (hout : ∀ i k : Fin n, val (out i k).val = ∑ j : Fin n, PerN.ratX F n i j * PerN.ratY F n j k) :
    Nat.ceil ((n : ℝ) ^ ((9 : ℝ) / 4) / 2) ≤ C.nonscalarCount (PerN.IsConstRF F n) val := by
  have h1 : (n : ℝ) ^ ((9 : ℝ) / 4) ≤ tensorRank (matrixTensor (AlgebraicClosure F) n n n) := by
    have h := rpow_formalOmega_le_tensorRank (AlgebraicClosure F) hn
    rwa [square_exponent] at h
  have h2 : tensorRank (matrixTensor (AlgebraicClosure F) n n n) ≤
      tensorRank (matrixTensor (PerN.RF F n) n n n) :=
    matrix_tensorRank_algebraicClosure_le_fractionRing F (PerN.MatVar n) n n n
  have h3 := rank_le_nonscalar C val out hWF hC hout
  have h4 : (tensorRank (matrixTensor (AlgebraicClosure F) n n n) : ℝ) ≤
      2 * (C.nonscalarCount (PerN.IsConstRF F n) val : ℝ) := by
    exact_mod_cast h2.trans h3
  exact Nat.ceil_le.mpr (by linarith)


/-- Every nonscalar gate is a multiplication or a division gate. -/
theorem nonscalar_le_mulDiv {V F K : Type} (C : PerN.Circuit V F) (isConst : K → Prop)
    (val : ℕ → K) : C.nonscalarCount isConst val ≤ C.mulDivCount := by
  classical
  unfold PerN.Circuit.nonscalarCount PerN.Circuit.mulDivCount
  apply Finset.card_le_card
  intro m hm
  rw [Finset.mem_filter] at hm ⊢
  refine ⟨hm.1, ?_⟩
  have h := hm.2
  revert h
  cases C.gate m <;> simp [PerN.Gate.IsNonscalar, PerN.Gate.IsMulOrDiv]

end PerNProof

/-! ## The four sealed propositions -/

namespace PerN

theorem gatesPerNAll_holds : GatesPerNAll := by
  unfold GatesPerNAll
  intro F _ n hn C val out hWF hC hout
  exact (PerNProof.gatesPerN_main F n hn C val out hWF hC hout).trans
    (PerNProof.nonscalar_le_mulDiv C _ val)

theorem gatesPerN_holds : GatesPerN := by
  unfold GatesPerN
  intro F _ n hn C val out hWF hC hout
  exact PerNProof.gatesPerN_main F n hn C val out hWF hC hout

theorem asymptoticRank_holds : AsymptoticRank := by
  unfold AsymptoticRank
  intro F _ n hn
  exact PerNProof.asymptoticRank_main F n hn

theorem borderRankLower_holds : BorderRankLower := by
  unfold BorderRankLower
  intro F _ n hn
  exact PerNProof.borderRankLower_main F n hn

end PerN

end
