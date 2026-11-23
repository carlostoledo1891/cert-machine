import R7RecordModel

/-! Closing implications. Adapted from the control room's checked P5cContra.lean. -/

namespace R7Closing
open SimpleGraph R7Composition R7Catalogue R7RecordModel R7CnfBridge R7Exchange R310

/-- Refuting every record at its assigned level excludes all rooted R(7) witnesses. -/
theorem no_r7_of_all_unsat
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cfg : ByteArray) (level : RecordIndex cfg → ℕ)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (unsat : ∀ idx : RecordIndex cfg,
      ¬ ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg idx.val).2 (level idx)).1) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (_ : DecidableRel G.Adj) (p q : Fin 40), Hypotheses G p q := by
  rintro ⟨G, inst, p, q, h⟩
  obtain ⟨j, r, τ, model⟩ := r7_record_file_model G p q h p1 p2 slice cfg level cover
  exact unsat r.1 ⟨τ, model⟩

/-- R(7) on 40 vertices in ordinary graph language, with no decidability hypothesis. -/
theorem no_r7_plain
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cfg : ByteArray) (level : RecordIndex cfg → ℕ)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (unsat : ∀ idx : RecordIndex cfg,
      ¬ ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg idx.val).2 (level idx)).1) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (p q : Fin 40), p ≠ q ∧ ¬ G.Adj p q ∧
      (∀ v, (G.neighborSet v).ncard = 9) ∧ (G.neighborSet p ∩ G.neighborSet q).ncard = 7 ∧
      G.CliqueFree 3 ∧ G.indepNum ≤ 9 := by
  classical
  rintro ⟨G, p, q, ne, apart, reg, common, tri, alpha⟩
  refine no_r7_of_all_unsat p1 p2 slice cfg level cover unsat ⟨G, inferInstance, p, q, ne, apart, ?_, ?_, tri, alpha⟩
  · rw [← common, ← Set.ncard_coe_finset]
    congr 1
    ext v
    simp
  · intro v
    rw [← reg v, ← card_neighborFinset_eq_degree, ← Set.ncard_coe_finset]
    congr 1
    ext w
    simp

#print axioms no_r7_of_all_unsat
#print axioms no_r7_plain

end R7Closing
