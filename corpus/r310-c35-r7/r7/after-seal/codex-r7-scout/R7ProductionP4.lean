import R7CnfSound
import R7ProductionClosing

/-! Semantic interface for checked production records. The premise concerns the
actual clause list of the embedded record and level. DIMACS and LRAT enter only
when an external result is used to supply that premise. -/

namespace R7ProductionP4
open SimpleGraph R7Catalogue R7RecordModel R7CnfBridge R7Exchange R7ProductionData R310

/-- Each Boolean assignment falsifies a whole clause of the given list. -/
def Refuted (cs : List R7Cnf.Clause) : Prop :=
  ∀ τ : Nat → Bool, ∃ c ∈ cs, ∀ a ∈ c, R7Cnf.lit τ a = false

theorem refuted_iff_no_model (cs : List R7Cnf.Clause) :
    Refuted cs ↔ ¬ ∃ τ, R7Cnf.Sat τ cs := by
  classical
  constructor
  · rintro bad ⟨τ, sat⟩
    obtain ⟨c, member, allFalse⟩ := bad τ
    obtain ⟨a, ha, yes⟩ := sat c member
    simp [allFalse a ha] at yes
  · intro noModel τ
    by_contra! good
    apply noModel
    refine ⟨τ, ?_⟩
    intro c member
    obtain ⟨a, ha, yes⟩ := good c member
    exact ⟨a, ha, by simpa using yes⟩

/-- The semantic reading at precisely the index, sides and depth of no_r7_production. -/
theorem production_refutations_iff :
    (∀ i : RecordIndex cfg, Refuted (R7Cnf.F (R7Cnf.inputOf coreLines cfg i.val).2 (level i)).1) ↔
    (∀ i : RecordIndex cfg, ¬ ∃ τ, R7Cnf.Sat τ
      (R7Cnf.F (R7Cnf.inputOf coreLines cfg i.val).2 (level i)).1) :=
  forall_congr' fun _ => refuted_iff_no_model _

theorem no_r7_of_production_refutations
    (p1 : EdgeLowerBound 8 27 85) {census : Census} (p2 : P2 census) (slice : C1 census)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im)
    (bad : ∀ i : RecordIndex cfg, Refuted (R7Cnf.F (R7Cnf.inputOf coreLines cfg i.val).2 (level i)).1) :
    ¬ ∃ (G : SimpleGraph (Fin 40)) (p q : Fin 40), p ≠ q ∧ ¬ G.Adj p q ∧
      (∀ v, (G.neighborSet v).ncard = 9) ∧ (G.neighborSet p ∩ G.neighborSet q).ncard = 7 ∧
      G.CliqueFree 3 ∧ G.indepNum ≤ 9 :=
  R7ProductionClosing.no_r7_production p1 p2 slice cover (production_refutations_iff.mp bad)

#print axioms refuted_iff_no_model
#print axioms production_refutations_iff
#print axioms no_r7_of_production_refutations

end R7ProductionP4
