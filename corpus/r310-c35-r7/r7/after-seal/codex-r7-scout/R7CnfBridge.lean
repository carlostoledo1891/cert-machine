import R7Exchanges
import R7Cnf
import R7CnfSound

/-! From a graph completion to a model of Claude's unchanged executable F. -/

namespace R7CnfBridge
open Finset SimpleGraph R7Independence R7Exchange

abbrev Vertex := Fin 27

private def commonSlots : Fin 7 ↪ Fixed := ⟨commonVertex, by decide +kernel⟩
private def sideSlots : Fin 4 ↪ Fixed := ⟨sideVertex, by decide +kernel⟩

private theorem count_slots {n : ℕ} (e : Fin n ↪ Fixed) (tag test : Fixed → Prop)
    [DecidablePred tag] [DecidablePred test] (slots : univ.filter tag = univ.map e) :
    (univ.filter (fun s => tag s ∧ test s)).card =
      (univ.filter (fun j => test (e j))).card := by
  rw [← filter_filter, slots, filter_map, card_map]
  rfl

variable (G : SimpleGraph (Vertex ⊕ Fixed)) [DecidableRel G.Adj]

private theorem core_degree (y : Vertex) :
    (G.comap (Sum.inl : Vertex → Vertex ⊕ Fixed)).degree y =
      (G.neighborFinset (.inl y)).toLeft.card := by
  rw [← card_neighborFinset_eq_degree]
  congr 1
  ext z
  simp

private theorem missed (I : Finset Vertex) (i : Block) :
    missing G I i = (indices i).filter (fun s => Disjoint (row G s) I) := by
  classical
  ext s
  simp [missing, indices, Finset.disjoint_right, row]

private theorem miss_pair (I : Finset Vertex) (i : Block) (a b : Fixed)
    (distinct : a ≠ b) (slots : indices i = {a,b}) :
    (missing G I i).card = R7Cnf.missF (row G a) I + R7Cnf.missF (row G b) I := by
  rw [missed, slots]
  by_cases ha : Disjoint (row G a) I <;> by_cases hb : Disjoint (row G b) I <;>
    simp [Finset.filter_insert, Finset.filter_singleton, R7Cnf.missF, ha, hb, distinct]

/-- Every completion at K=9 supplies all three hypotheses of T1, at any level.
The existential assignment includes the sorted rows and the auxiliary variables. -/
theorem completion_model (H : SimpleGraph Vertex) [DecidableRel H.Adj]
    (R : Fin 7 → Finset Vertex) (S : Fin 4 → Finset Vertex) (level : ℕ)
    (h : Completes H 9 R S) : ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOfGraph H S) level).1 := by
  obtain ⟨G, inst, layout, core, tri, regular, alpha, common, sides⟩ := h
  have commonTag : ∀ c, block (commonVertex c) = C := by decide
  have cs : (univ.filter fun s => block s = C) = univ.map commonSlots := by decide
  have ss : (univ.filter fun s => block s = A ∨ block s = B) = univ.map sideSlots := by decide
  apply R7Cnf.T1 H S level R
  · intro c
    rw [← common c, ← core]
    refine ⟨rows_independent G tri _, ?_⟩
    simp only [row_sizes G layout regular, commonTag, ite_true]
  · intro y
    let f : (G.comap (Sum.inl : Vertex → Vertex ⊕ Fixed)) ≃g H :=
      { toEquiv := Equiv.refl _, map_rel_iff' := by intro x z; change H.Adj x z ↔ _; rw [core] }
    have hd : H.degree y = (G.comap (Sum.inl : Vertex → Vertex ⊕ Fixed)).degree y := f.degree_eq y
    have hcol := column_degree G layout regular y
    rw [count_slots sideSlots _ (fun s => y ∈ row G s) ss,
      count_slots commonSlots _ (fun s => y ∈ row G s) cs, ← core_degree, ← hd] at hcol
    simpa only [sideSlots, commonSlots, Function.Embedding.coeFn_mk, common, sides] using hcol
  · intro I _ ind
    have cind : CoreIndependent G I := by unfold CoreIndependent; rwa [core]
    have bound := (rowClauses_iff G I _).mp (clauses_at_cutoff G layout 9
      (fun _ hi => hi.card_le_indepNum.trans alpha) I.card I cind le_rfl)
    have mc : (missing G I C).card = (univ.filter fun c => Disjoint (R c) I).card := by
      rw [missed, indices, cs, filter_map, card_map]
      simp only [Function.comp_def, commonSlots, Function.Embedding.coeFn_mk, common]
    rw [threshold, mc, miss_pair G I A (sideVertex 0) (sideVertex 1) (by decide) (by decide),
      miss_pair G I B (sideVertex 2) (sideVertex 3) (by decide) (by decide)] at bound
    simpa only [sides] using bound

/-- The graph of a graph6 line, with exactly the adjacency predicate used by inputOf. -/
def lineGraph (s : String) : SimpleGraph Vertex where
  Adj y z := R7Cnf.adjOfGraph6 s y z = true
  symm := ⟨fun y z h => by simpa only [R7Cnf.adjOfGraph6, min_comm z.val y.val, max_comm z.val y.val] using h⟩
  loopless := ⟨fun y => by simp [R7Cnf.adjOfGraph6]⟩

instance (s : String) : DecidableRel (lineGraph s).Adj := fun y z =>
  inferInstanceAs (Decidable (R7Cnf.adjOfGraph6 s y z = true))

/-- Eliminates the two Array.ofFn lookup tables in the production decoder. -/
theorem decoded_adjacency (lines : Array String) (cfg : ByteArray) (i : ℕ) (y z : Vertex) :
    (R7Cnf.inputOf lines cfg i).2.adj y z =
      R7Cnf.adjOfGraph6 (lines[(R7Cnf.record cfg i).1]!) y z := by
  simp [R7Cnf.inputOf, getElem!_pos]

private theorem input_tables (H : SimpleGraph Vertex) [DecidableRel H.Adj] (inp : R7Cnf.Input)
    (adj : ∀ y z, decide (H.Adj y z) = inp.adj y z) :
    R7Cnf.inputOfGraph H (R7Cnf.sideSet inp) = inp := by
  obtain ⟨a,s⟩ := inp
  apply congrArg₂ R7Cnf.Input.mk (funext fun y => funext (adj y))
  funext j y
  simp [R7Cnf.sideSet]

/-- A record index lies inside the supplied byte buffer even when it has a partial last record. -/
abbrev RecordIndex (cfg : ByteArray) := Fin (cfg.size / 10)

/-- Use the same core line, side-table decoder, record index and level as the file writer.
The caller supplies a graph completion. No CNF or T1 hypothesis is an input. -/
theorem record_file_model (lines : Array String) (cfg : ByteArray) (idx : RecordIndex cfg)
    (level : ℕ) (R : Fin 7 → Finset Vertex)
    (h : Completes (lineGraph (lines[(R7Cnf.record cfg idx.val).1]!)) 9 R
      (R7Cnf.sideSet (R7Cnf.inputOf lines cfg idx.val).2)) :
    ∃ τ, R7Cnf.Sat τ (R7Cnf.F (R7Cnf.inputOf lines cfg idx.val).2 level).1 := by
  let inp := (R7Cnf.inputOf lines cfg idx.val).2
  let H := lineGraph (lines[(R7Cnf.record cfg idx.val).1]!)
  have heq := input_tables H inp fun y z => by
    change decide (R7Cnf.adjOfGraph6 _ y z = true) = (R7Cnf.inputOf lines cfg idx.val).2.adj y z
    rw [decoded_adjacency, Bool.decide_eq_true]
  change ∃ τ, R7Cnf.Sat τ (R7Cnf.F inp level).1
  rw [← heq]
  exact completion_model H R (R7Cnf.sideSet inp) level h

#print axioms completion_model
#print axioms decoded_adjacency
#print axioms record_file_model

end R7CnfBridge
