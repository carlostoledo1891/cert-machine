import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.SquareExponent
import OAI.LinearAlgebra.SpectralBooks.FormalRecursion
import OAI.LinearAlgebra.SpectralBooks.Flattening
import OAI.LinearAlgebra.SpectralBooks.BorderComparison
import OAI.LinearAlgebra.SpectralBooks.RankLimit
import OAI.LinearAlgebra.SpectralBooks.FormalPadding
import OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization
import OAI.LinearAlgebra.SpectralBooks.RationalDerivative
import OAI.LinearAlgebra.MatrixExponent.FieldExtension
import OAI.LinearAlgebra.MatrixExponent.FieldFormula

/-!
# Phase 5 (ω = 9/4 lane, cert-machine, 2026-11-25): lemmas on the release's own objects

Nothing here mentions the sealed statement file; these are the release-side facts the proofs
of `Rect.lean` use.

* `rect_cube`, `rect_asymptotic_lower`: the paper's proof of Corollary 1.3 for asymptotic rank
  over every field `K`. The three one-factor flattenings (the release's
  `matrix_flattening_le_asymptoticRank`) give `max {ab, bc, ca}`; for `(abc)^{3/4}`, a rank-`R`
  decomposition of the `k`-th power of `T_{a,b,c}` gives decompositions of the same rank of its two
  cyclic relabelings (`matrixCoefficients_cyclic_rank`), their product has rank `≤ R³`
  (`matrixCoefficients_product_rank`), and after grouping the factors it is `T_{(abc)^k}`, whose rank
  is `≥ ((abc)^k)^{9/4}` (`rpow_formalOmega_le_tensorRank`, `square_exponent`).
* `rect_border_lower`: the same bound for the release's geometric border rank, through
  `asymptoticRank_le_geometricBorderRank`.
* `rank_lower_U`: a rank decomposition at one size `n ≥ 2` of the format (rows `≥ n`, columns `≥ n`,
  inner `≥ ⌈n^c⌉`) over ANY field has at least `n^{U(1,1,c)}` terms (the release's rational-circuit
  rectangular exponent: `exponent_lt_of_rank`, `Rectangle.exponent_eq`).
* `upper_programs`: division-free programs of cost `O(n^{2+ε})` for `n × ⌊n^β⌋` by `⌊n^β⌋ × n`
  when `β ≤ 1/2` (`rectangular_exponent` at weights `(1/2, 1, 1)`, `formalOmega_admissible`,
  zero padding `FormalCorrect.pad`).
-/

noncomputable section

namespace RectProof

open OAI.LinearAlgebra.SpectralBooks
open OAI.MatrixMultiplication.Foundation
open OAI.MatrixMultiplication

/-! ## Reindexing a matrix coefficient tensor along bijections of its three wire sets -/

theorem mc_reindex {K : Type*} [CommSemiring K] {P Q S P' Q' S' : Type*}
    [DecidableEq P] [DecidableEq Q] [DecidableEq S]
    [DecidableEq P'] [DecidableEq Q'] [DecidableEq S']
    (eP : P' ≃ P) (eQ : Q' ≃ Q) (eS : S' ≃ S) {r : ℕ}
    (h : Tensor.RankAtMost (Tensor.matrixCoefficients (K := K) P Q S) r) :
    Tensor.RankAtMost (Tensor.matrixCoefficients (K := K) P' Q' S') r := by
  have h' := h.pullback (fun x : P' × Q' => (eP x.1, eQ x.2))
    (fun y : Q' × S' => (eQ y.1, eS y.2)) (fun z : S' × P' => (eS z.1, eP z.2))
  have heq : Tensor.pullback (fun x : P' × Q' => (eP x.1, eQ x.2))
      (fun y : Q' × S' => (eQ y.1, eS y.2)) (fun z : S' × P' => (eS z.1, eP z.2))
      (Tensor.matrixCoefficients (K := K) P Q S) =
      Tensor.matrixCoefficients (K := K) P' Q' S' := by
    funext x y z
    simp only [Tensor.pullback, Tensor.matrixCoefficients, Equiv.apply_eq_iff_eq]
  rw [heq] at h'
  exact h'

/-! ## Corollary 1.3 for asymptotic rank, over every field -/

section Cube

variable (K : Type*) [Field K]

/-- Three cyclic copies of the `k`-th power of `T_{a,b,c}` give `T_{(abc)^k}`:
`((abc)^k)^{9/4} ≤ R(T_{a,b,c}^{⊗k})³`. (`matrixTensor K b c a` is `T_{a,b,c}`: rows `a`,
inner `b`, columns `c`.) -/
theorem rect_cube {a b c : ℕ} (h2 : 2 ≤ a * b * c) (k : ℕ) (hk : 1 ≤ k) :
    ((((a * b * c) ^ k : ℕ) : ℝ)) ^ ((9 : ℝ) / 4) ≤
      (tensorRank (Tensor.power (matrixTensor K b c a) k) : ℝ) ^ 3 := by
  classical
  set R := tensorRank (Tensor.power (matrixTensor K b c a) k) with hR
  have h0 : Tensor.RankAtMost (Tensor.matrixCoefficients (K := K)
      (Fin k → Fin a) (Fin k → Fin b) (Fin k → Fin c)) R :=
    matrix_power_rankAtMost K (n12 := b) (n23 := c) (n31 := a) k
  have h1 := Tensor.matrixCoefficients_cyclic_rank h0
  have h2' := Tensor.matrixCoefficients_cyclic_rank h1
  have h01 := Tensor.matrixCoefficients_product_rank h0 h1
  have h012 := Tensor.matrixCoefficients_product_rank h01 h2'
  set M := (a * b * c) ^ k with hM
  have c1 : Fintype.card (((Fin k → Fin a) × (Fin k → Fin b)) × (Fin k → Fin c)) = M := by
    simp only [Fintype.card_prod, Fintype.card_fun, Fintype.card_fin, hM, mul_pow]
  have c2 : Fintype.card (((Fin k → Fin b) × (Fin k → Fin c)) × (Fin k → Fin a)) = M := by
    simp only [Fintype.card_prod, Fintype.card_fun, Fintype.card_fin, hM, mul_pow]
    ring
  have c3 : Fintype.card (((Fin k → Fin c) × (Fin k → Fin a)) × (Fin k → Fin b)) = M := by
    simp only [Fintype.card_prod, Fintype.card_fun, Fintype.card_fin, hM, mul_pow]
    ring
  have hMr : Tensor.RankAtMost (Tensor.matrixCoefficients (K := K) (Fin M) (Fin M) (Fin M))
      (R * R * R) :=
    mc_reindex (Fintype.equivFinOfCardEq c1).symm (Fintype.equivFinOfCardEq c2).symm
      (Fintype.equivFinOfCardEq c3).symm h012
  have hrank : tensorRank (matrixTensor K M M M) ≤ R * R * R := tensorRank_le_of_rankAtMost hMr
  have hM2 : 2 ≤ M := h2.trans (Nat.le_self_pow (by omega) _)
  have hlow := rpow_formalOmega_le_tensorRank K hM2
  rw [square_exponent] at hlow
  calc ((M : ℕ) : ℝ) ^ ((9 : ℝ) / 4) ≤ (tensorRank (matrixTensor K M M M) : ℝ) := hlow
    _ ≤ ((R * R * R : ℕ) : ℝ) := by exact_mod_cast hrank
    _ = (R : ℝ) ^ 3 := by push_cast; ring

/-- Taking `3k`-th roots: `(abc)^{3/4} ≤ R(T_{a,b,c}^{⊗k})^{1/k}` for every `k ≥ 1`. -/
theorem rect_root {a b c : ℕ} (h2 : 2 ≤ a * b * c) (k : ℕ) (hk : 1 ≤ k) :
    (((a * b * c : ℕ) : ℝ)) ^ ((3 : ℝ) / 4) ≤
      (tensorRank (Tensor.power (matrixTensor K b c a) k) : ℝ) ^ ((k : ℝ)⁻¹) := by
  have h := rect_cube K h2 k hk
  set X : ℝ := ((a * b * c : ℕ) : ℝ) with hX
  set R : ℝ := (tensorRank (Tensor.power (matrixTensor K b c a) k) : ℝ) with hR
  have hX0 : 0 ≤ X := Nat.cast_nonneg _
  have hR0 : 0 ≤ R := Nat.cast_nonneg _
  have hk0 : (k : ℝ) ≠ 0 := by exact_mod_cast (show k ≠ 0 by omega)
  have hpow : (((a * b * c) ^ k : ℕ) : ℝ) = X ^ k := by rw [hX, Nat.cast_pow]
  rw [hpow] at h
  have hmono := Real.rpow_le_rpow (by positivity) h (by positivity : (0 : ℝ) ≤ (3 * (k : ℝ))⁻¹)
  have e1 : ((X ^ k) ^ ((9 : ℝ) / 4)) ^ ((3 * (k : ℝ))⁻¹) = X ^ ((3 : ℝ) / 4) := by
    rw [← Real.rpow_natCast, ← Real.rpow_mul hX0, ← Real.rpow_mul hX0]
    congr 1
    field_simp
    ring
  have e2 : (R ^ 3) ^ ((3 * (k : ℝ))⁻¹) = R ^ ((k : ℝ)⁻¹) := by
    rw [← Real.rpow_natCast, ← Real.rpow_mul hR0]
    congr 1
    push_cast
    field_simp
  rw [e1, e2] at hmono
  exact hmono

/-- Corollary 1.3, asymptotic rank over `K`: `max {ab, bc, ca, (abc)^{3/4}} ≤ R̃_K(T_{a,b,c})`
(the release's `asymptoticRank`, the infimum over `k ≥ 1`, which is also the limit). -/
theorem rect_asymptotic_lower {a b c : ℕ} (ha : 0 < a) (hb : 0 < b) (hc : 0 < c) :
    max (max (max ((a : ℝ) * b) ((b : ℝ) * c)) ((c : ℝ) * a)) (((a : ℝ) * b * c) ^ ((3 : ℝ) / 4)) ≤
      asymptoticRank (matrixTensor K b c a) := by
  have hflat := matrix_flattening_le_asymptoticRank K (n12 := b) (n23 := c) (n31 := a) hb hc ha
  have hab : ((a * b : ℕ) : ℝ) ≤ asymptoticRank (matrixTensor K b c a) :=
    le_trans (Nat.cast_le.mpr (le_max_left (a * b) (max (b * c) (c * a)))) hflat
  have hbc : ((b * c : ℕ) : ℝ) ≤ asymptoticRank (matrixTensor K b c a) :=
    le_trans (Nat.cast_le.mpr ((le_max_left (b * c) (c * a)).trans (le_max_right (a * b) _))) hflat
  have hca : ((c * a : ℕ) : ℝ) ≤ asymptoticRank (matrixTensor K b c a) :=
    le_trans (Nat.cast_le.mpr ((le_max_right (b * c) (c * a)).trans (le_max_right (a * b) _))) hflat
  have hcube : (((a * b * c : ℕ) : ℝ)) ^ ((3 : ℝ) / 4) ≤ asymptoticRank (matrixTensor K b c a) := by
    by_cases h2 : 2 ≤ a * b * c
    · apply le_ciInf
      intro k
      have h := rect_root K h2 (k + 1) (by omega)
      push_cast at h ⊢
      exact h
    · have h1 : a * b * c = 1 := by
        have : 0 < a * b * c := Nat.mul_pos (Nat.mul_pos ha hb) hc
        omega
      have hab1 : a * b = 1 := Nat.eq_one_of_mul_eq_one_right h1
      have hv : (((a * b * c : ℕ) : ℝ)) ^ ((3 : ℝ) / 4) = ((a * b : ℕ) : ℝ) := by
        rw [h1, hab1]
        simp
      rw [hv]
      exact hab
  push_cast at hab hbc hca hcube
  exact max_le (max_le (max_le hab hbc) hca) hcube

/-- Corollary 1.3, geometric border rank: the same bound for the release's geometric border rank
(over the algebraic closure of `K`). -/
theorem rect_border_lower {a b c : ℕ} (ha : 0 < a) (hb : 0 < b) (hc : 0 < c) :
    max (max (max ((a : ℝ) * b) ((b : ℝ) * c)) ((c : ℝ) * a)) (((a : ℝ) * b * c) ^ ((3 : ℝ) / 4)) ≤
      (geometricBorderRank (matrixTensor K b c a) : ℝ) :=
  (rect_asymptotic_lower K ha hb hc).trans (asymptoticRank_le_geometricBorderRank _)

end Cube

/-! ## A per-size rank lower bound from the release's rectangular exponent with division -/

section RankU

open OAI.LinearAlgebra.MatrixExponent

/-- The release's rectangular-model decompositions from ours: `T_{a,b,c}` (rows `a`, inner `b`,
columns `c`) is `Rectangle.RankLE K a c b` (rows, columns, inner), the output index transposed. -/
theorem rankLE_of_rankAtMost (K : Type*) [Field K] {a b c r : ℕ}
    (h : Tensor.RankAtMost (matrixTensor K b c a) r) : Rectangle.RankLE K a c b r := by
  obtain ⟨u, v, w, hT⟩ := h
  refine ⟨u, v, fun l z => w l (z.2, z.1), fun x y z => ?_⟩
  have hxyz := congrFun (congrFun (congrFun hT x) y) (z.2, z.1)
  simp only [Tensor.rankOne] at hxyz
  show ∑ l : Fin r, u l x * v l y * w l (z.2, z.1) = _
  rw [← hxyz]
  simp only [matrixTensor, Tensor.matrixCoefficients]
  exact if_congr ⟨fun ⟨h1, h2, h3⟩ => ⟨h3.symm, h1, h2⟩, fun ⟨h1, h2, h3⟩ => ⟨h2, h3, h1.symm⟩⟩
    rfl rfl

/-- `U(1,1,c)` on `[1/2, 1]`: `2 + (c - 1/2)² / c`. -/
theorem U_one_one {c : ℝ} (_hc : 0 < c) (hc1 : c ≤ 1) :
    Rectangle.U 1 1 c = 2 + (max (2 * c - 1) 0) ^ 2 / (4 * c) := by
  have hcond : c ≤ min (1 : ℝ) 1 := by rw [min_self]; exact hc1
  unfold Rectangle.U
  rw [ite_eq_left_of_eq_true _ _ (eq_true hcond)]
  unfold Rectangle.benchmark
  rw [show ((1 : ℝ) + 1) * c - 1 * 1 = 2 * c - 1 by ring, show (4 : ℝ) * 1 * 1 * c = 4 * c by ring]
  ring

/-- A decomposition at one size `n ≥ 2`, over any field, of a format with at least `n` rows,
`n` columns and `⌈n^c⌉` inner indices has at least `n^{U(1,1,c)}` terms. -/
theorem rank_lower_U (K : Type*) [Field K] {n i j k r : ℕ} {c : ℝ} (hn : 2 ≤ n) (hc0 : 0 ≤ c)
    (hi : n ≤ i) (hj : n ≤ j) (hk : Rectangle.side n c ≤ k) (hr : Rectangle.RankLE K i j k r) :
    (n : ℝ) ^ Rectangle.U 1 1 c ≤ r := by
  by_contra! h
  have hcut : Rectangle.RankLE K (Rectangle.side n 1) (Rectangle.side n 1) (Rectangle.side n c) r :=
    hr.cut (by rw [Rectangle.side_one]; exact hi) (by rw [Rectangle.side_one]; exact hj) hk
  have hlt := Rectangle.exponent_lt_of_rank zero_le_one zero_le_one hc0 hn hcut h
  rw [Rectangle.exponent_eq K zero_le_one zero_le_one hc0] at hlt
  exact lt_irrefl _ hlt

end RankU

/-! ## Division-free programs at inner dimension `⌊n^β⌋`, `β ≤ 1/2` -/

section Upper

open Arithmetic

theorem formalOmega_half (F : Type*) [Field F] : formalOmega F (1 / 2) 1 1 = 2 := by
  rw [rectangular_exponent]
  norm_num [max_def, min_def]

theorem upper_programs (F : Type*) [Field F] {β : ℝ} (hβ : β ≤ 1 / 2) {ε : ℝ} (hε : 0 < ε) :
    ∃ C : ℝ, 0 < C ∧ ∀ n : ℕ, 1 ≤ n → ∃ P : MatrixAlgorithm F n ⌊(n : ℝ) ^ β⌋₊ n,
      FormalCorrect P ∧ (P.cost : ℝ) ≤ C * (n : ℝ) ^ (2 + ε) := by
  have hadm := formalOmega_admissible F (w12 := 1 / 2) (w23 := 1) (w31 := 1)
    (by norm_num) (by norm_num) (by norm_num)
  rw [formalOmega_half] at hadm
  obtain ⟨C, hC, hb⟩ := hadm ε hε
  refine ⟨C, hC, fun n hn => ?_⟩
  obtain ⟨P, hP, hcost⟩ := hb n hn
  have h1 : wireDimension n 1 = n := by simp [wireDimension]
  have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
  have hle : ⌊(n : ℝ) ^ β⌋₊ ≤ wireDimension n (1 / 2) := by
    unfold wireDimension
    have hpos : 0 ≤ (n : ℝ) ^ β := by positivity
    have hfl : (⌊(n : ℝ) ^ β⌋₊ : ℝ) ≤ ⌈(n : ℝ) ^ ((1 : ℝ) / 2)⌉₊ :=
      calc (⌊(n : ℝ) ^ β⌋₊ : ℝ) ≤ (n : ℝ) ^ β := Nat.floor_le hpos
        _ ≤ (n : ℝ) ^ ((1 : ℝ) / 2) := Real.rpow_le_rpow_of_exponent_le hn1 hβ
        _ ≤ _ := Nat.le_ceil _
    exact_mod_cast hfl
  refine ⟨P.pad h1.symm.le hle h1.symm.le, hP.pad _ _ _, ?_⟩
  rw [OAI.MatrixMultiplication.Arithmetic.MatrixAlgorithm.pad_cost_eq]
  exact hcost

end Upper

end RectProof
