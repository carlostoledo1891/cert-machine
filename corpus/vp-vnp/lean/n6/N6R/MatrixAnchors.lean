import CertMachine.N6Statement

open MvPolynomial

namespace CertMachine.N6

universe u

theorem approxByDet_det (F : Type u) [Field F] (n : ℕ) : ApproxByDet (det F n) n := by
  let G := Matrix.of fun i j : Fin n => (X (i, j) : MvPolynomial (Fin n × Fin n) F)
  let φ := MvPolynomial.map (σ := Fin n × Fin n) (HahnSeries.C : F →+* LaurentSeries F)
  refine ⟨φ.mapMatrix G, ?_, ?_⟩
  · intro i j
    change (φ (X (i, j))).totalDegree ≤ 1
    simp [φ]
  · intro d i _
    rw [← φ.map_det]
    change (coeff d (MvPolynomial.map (HahnSeries.C : F →+* LaurentSeries F) (det F n))).coeff i = _
    rw [coeff_map, HahnSeries.C_apply, HahnSeries.coeff_single]
    split_ifs <;> rfl

theorem approxByDet_mono {F : Type u} {V : Type} [Field F] {f : MvPolynomial V F} {n n' : ℕ}
    (h : ApproxByDet f n) (hn : n ≤ n') : ApproxByDet f n' := by
  classical
  obtain ⟨k, rfl⟩ := Nat.exists_eq_add_of_le hn
  obtain ⟨M, hdeg, hcoeff⟩ := h
  let Iₖ : Matrix (Fin k) (Fin k) (MvPolynomial V (LaurentSeries F)) := 1
  let B := Matrix.fromBlocks M 0 0 Iₖ
  let e : Fin n ⊕ Fin k ≃ Fin (n + k) := finSumFinEquiv
  refine ⟨Matrix.reindex e e B, ?_, ?_⟩
  · intro i j
    change (B (e.symm i) (e.symm j)).totalDegree ≤ 1
    cases e.symm i with
    | inl r =>
      cases e.symm j with
      | inl s => exact hdeg r s
      | inr s => simp [B]
    | inr r =>
      cases e.symm j with
      | inl s => simp [B]
      | inr s =>
        by_cases h : r = s <;> simp [B, Iₖ, h]
  · simpa only [Matrix.det_reindex_self, B, Matrix.det_fromBlocks_zero₂₁,
      Iₖ, Matrix.det_one, mul_one] using hcoeff

end CertMachine.N6
