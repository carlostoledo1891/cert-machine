import R7ProductionP4
import R7CnfRead

namespace R7ProductionRead
open SimpleGraph R7Catalogue R7RecordModel R7CnfBridge R7Exchange R7ProductionData R310
open R7ProductionP4

set_option maxHeartbeats 1400000 in
/-- Every production record parses successfully and its returned clauses are refuted.
    The graph argument works at every level function. The ledger selects the actual files. -/
theorem no_r7_of_read_refutations
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (depth : RecordIndex cfg → Nat)
    (bad : ∀ i : RecordIndex cfg,
      let recInput := R7Cnf.inputOf coreLines cfg i.val
      ∃ vars count cs, R7Cnf.readCnf (R7Cnf.bytes recInput.2 recInput.1 i.val (depth i)) =
        some (vars, count, cs) ∧ Refuted cs) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (p q : Fin 40), p ≠ q ∧ ¬ G.Adj p q ∧
      (∀ v, (G.neighborSet v).ncard = 9) ∧ (G.neighborSet p ∩ G.neighborSet q).ncard = 7 ∧
      G.CliqueFree 3 ∧ G.indepNum ≤ 9 := by
  apply R7Closing.no_r7_plain p1 p2 slice cfg depth cover
  intro i
  obtain ⟨v,n,cs,read,refuted⟩ := bad i
  let e := R7Cnf.inputOf coreLines cfg i.val
  have heq := R7Cnf.readCnf_bytes_clauses e.2 e.1 i.val (depth i) v n cs read
  exact (refuted_iff_no_model _).mp (heq ▸ refuted)

/-- The production ledger instantiation, including the actual file header fields. -/
theorem no_r7_of_read_production_files
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (bad : ∀ i : RecordIndex cfg,
      let recInput := R7Cnf.inputOf coreLines cfg i.val
      ∃ vars count cs, R7Cnf.readCnf (R7Cnf.bytes recInput.2 recInput.1 i.val (level i)) =
        some (vars, count, cs) ∧ Refuted cs) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (p q : Fin 40), p ≠ q ∧ ¬ G.Adj p q ∧
      (∀ v, (G.neighborSet v).ncard = 9) ∧ (G.neighborSet p ∩ G.neighborSet q).ncard = 7 ∧
      G.CliqueFree 3 ∧ G.indepNum ≤ 9 :=
  no_r7_of_read_refutations p1 p2 slice cover level bad

#print axioms no_r7_of_read_refutations
#print axioms no_r7_of_read_production_files
end R7ProductionRead
