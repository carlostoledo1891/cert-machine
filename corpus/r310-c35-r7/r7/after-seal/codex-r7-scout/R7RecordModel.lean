import R7CnfBridge
import R7Catalogue
import R7CoreTransport

/-! The same graph6 input preparation as R7CnfMain, applied to the production
file embedded by R7Catalogue. The record buffer and the ledger level are
parameters. The cover is formulated on bounded indices of this very buffer. -/

namespace R7RecordModel
open Finset SimpleGraph R7Exchange R7Independence R7Composition R7Catalogue R7CnfBridge R310

def coreLines : Array String :=
  ((filteredData.splitOn "\n").filter (fun l => l.length > 4)).toArray

set_option cbv.maxSteps 1000000 in
set_option maxRecDepth 8192 in
set_option maxHeartbeats 1000000 in
private theorem coreLines_value : coreLines =
  #["ZHoWE_JCd?sOACC?ccI?h?qf?_?GIWICJA?aAaSO`?`G`g?h_OAC?J@?I?OW",
    "ZHoWE_JCd?sOACC?ccI?h?af?o?GIWICJA?aAaSO`?`G`g?h_OAC?J@?I?OW",
    "ZHoWE_JCd@sOACC?ccG?h?qf?_?GIWICJA?aAaSO`?`G`g?h_OAC?J@?I?OW",
    "ZHoWE_JCd@sOACC?ccG?h?af?o?GIWICJA?aAaSO`?`G`g?h_OAC?J@?I?OW"] := by cbv

/-- Compare the two decoders on all 4 × 27 × 27 adjacency entries. -/
theorem lineGraph_eq (j : Fin 4) : lineGraph (coreLines[j.val]!) = graph j := by
  ext y z
  revert j y z
  rw [coreLines_value]
  decide +kernel

/-- A record for the specified numbered core, bounded by the number of whole
10-byte records in the buffer and tagged by the actual decoded first word. -/
abbrev CoreRecord (cfg : ByteArray) (j : Fin 4) :=
  {idx : RecordIndex cfg // (R7Cnf.record cfg idx.val).1 = j.val}

def recordSides (cfg : ByteArray) (idx : RecordIndex cfg) : SideRows :=
  R7Cnf.sideSet (R7Cnf.inputOf coreLines cfg idx.val).2

/-- The four little-endian six-set indices, in file order. -/
def sideWord (cfg : ByteArray) (idx : ℕ) : Fin 4 → ℕ :=
  let (_,a₁,a₂,b₁,b₂) := R7Cnf.record cfg idx
  ![a₁,a₂,b₁,b₂]

/-- Each of the four decoded sides is exactly the six-set at its recorded
ordinal in Claude's independent-set list. Duplicate indices are permitted. -/
theorem recordSides_eq (cfg : ByteArray) (idx : RecordIndex cfg) (j : Fin 4) :
    let inp := (R7Cnf.inputOf coreLines cfg idx.val).2
    let table := ((R7Cnf.indepSets inp.adj).filter (fun I => I.length == 6)).toArray
    recordSides cfg idx j = (table[sideWord cfg idx.val j]!).toFinset := by
  ext y
  fin_cases j <;> simp [recordSides, sideWord, R7Cnf.sideSet, R7Cnf.inputOf, getElem!_pos]

/-- Per record. Both the side sets used by the completion and the F it models
come from decoding this file index. The caller supplies no decoder equality. -/
theorem catalogue_record_model (cfg : ByteArray) (j : Fin 4) (r : CoreRecord cfg j)
    (R : CommonRows) (level : ℕ) (done : Completes (graph j) 9 R (recordSides cfg r.1)) :
    ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg r.1.val).2 level).1 := by
  apply record_file_model coreLines cfg r.1 level R
  rw [r.2, lineGraph_eq]
  exact done

/-- From an original rooted graph to a model at the level of a covered record.
P1, P2, C1 and file-indexed coverage are explicit. -/
theorem r7_record_file_model (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj] (p q : Fin 40)
    (h : Hypotheses G p q) (p1 : EdgeLowerBound 8 27 85)
    {census : Census} (p2 : P2 census) (slice : C1 census)
    (cfg : ByteArray) (level : RecordIndex cfg → ℕ)
    (cover : ∀ (j : Fin 4) T, Section3 (graph j) T →
      ∃ (r : CoreRecord cfg j) (im : Fin 8), T = recordSides cfg r.1 ∘ source im) :
    ∃ (j : Fin 4) (r : CoreRecord cfg j) (τ : ℕ → Bool),
      R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf coreLines cfg r.1.val).2 (level r.1)).1 := by
  obtain ⟨e,_,_,tri,alpha,edges,done,_,_⟩ := r7_gives_record G p q h p1
  obtain ⟨j,⟨f⟩⟩ := catalogue_iso_of_85 p2 slice _ tri alpha edges
  obtain ⟨r,complete⟩ := representative_completion (graph j) (fun r : CoreRecord cfg j => recordSides cfg r.1)
    (cover j) ((completes_core_iso f 9 _ _).mp done)
  obtain ⟨τ,model⟩ := catalogue_record_model cfg j r _ (level r.1) complete
  exact ⟨j,r,τ,model⟩

#print axioms lineGraph_eq
#print axioms recordSides_eq
#print axioms catalogue_record_model
#print axioms r7_record_file_model

end R7RecordModel
