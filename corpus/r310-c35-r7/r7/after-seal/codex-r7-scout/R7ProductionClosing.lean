import R7Closing
import R7ProductionData

/-! Conditional production conclusion for the embedded configs.bin and for the
level at each record index extracted from prod.tsv. -/

namespace R7ProductionClosing
open SimpleGraph R7Catalogue R7RecordModel R7CnfBridge R7Exchange R7ProductionData R310

theorem no_r7_production
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (unsat : ∀ idx : RecordIndex cfg,
      ¬ ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg idx.val).2 (level idx)).1) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (p q : Fin 40), p ≠ q ∧ ¬ G.Adj p q ∧
      (∀ v, (G.neighborSet v).ncard = 9) ∧ (G.neighborSet p ∩ G.neighborSet q).ncard = 7 ∧
      G.CliqueFree 3 ∧ G.indepNum ≤ 9 :=
  R7Closing.no_r7_plain p1 p2 slice cfg level cover unsat

#print axioms no_r7_production

end R7ProductionClosing
