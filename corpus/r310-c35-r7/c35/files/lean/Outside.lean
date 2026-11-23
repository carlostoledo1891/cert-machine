import PathLemma
import Mathlib.Combinatorics.SimpleGraph.CycleGraph

namespace RamseyScout.PathLemma
variable {V : Type*} (G : SimpleGraph V) (e : core ↪g G)

private def neighbors (u : K) : Finset K := Finset.univ.filter (core.Adj u)

set_option maxRecDepth 8192 in
private theorem eight_neighbors : ∀ u : K, (neighbors u).card = 8 := by decide +kernel

private theorem insert_independent [DecidableEq V] (s : Finset V) (a : V)
    (hs : G.IsIndepSet s) (ha : ∀ b ∈ s, ¬ G.Adj a b) :
    G.IsIndepSet (↑(insert a s) : Set V) := by
  intro i hi j hj hij
  by_cases hia : i = a
  · subst i
    exact ha j ((Finset.mem_insert.mp hj).resolve_left (Ne.symm hij))
  · have his := (Finset.mem_insert.mp hi).resolve_left hia
    rcases Finset.mem_insert.mp hj with hja | hjs
    · subst j
      exact fun h => ha _ his h.symm
    · exact hs his hjs hij

private theorem impossible_ten [DecidableEq V] (noTen : ∀ s : Finset V, ¬ G.IsNIndepSet 10 s)
    (s : Finset V) (card : s.card = 8) {a b : V} (ab : a ≠ b) (ha : a ∉ s) (hb : b ∉ s)
    (ind : G.IsIndepSet (↑(insert a (insert b s)) : Set V)) : False := by
  apply noTen (insert a (insert b s))
  exact ⟨ind, by simp [Finset.card_insert_of_notMem, ab, ha, hb, card]⟩

/-- A fork of two missing exterior edges would supply the three sets forbidden by Lemma P. -/
theorem outside_fork (tri : G.CliqueFree 3) (noTen : ∀ s : Finset V, ¬G.IsNIndepSet 10 s)
    (w : Fin 3 ↪ V) (out : ∀ i j, w i ≠ e j) :
    G.Adj (w 0) (w 1) ∨ G.Adj (w 1) (w 2) := by
  classical
  by_contra! bad
  let S (i : Fin 3) : Set K := {u | G.Adj (w i) (e u)}
  apply lemma_P S
  constructor
  · intro i u hu v hv ne adj
    exact G.isIndepSet_neighborSet_of_triangleFree tri (w i) hu hv (e.injective.ne ne)
      (e.map_rel_iff.mpr adj)
  · intro i j ij c h1 h2
    let s := (neighbors c).map e.toEmbedding
    have inCore (t : Fin 3) : w t ∉ s := by
      intro mem
      obtain ⟨u, _, eq⟩ := Finset.mem_map.mp mem
      exact out t u eq.symm
    apply impossible_ten G noTen s (by simpa [s] using eight_neighbors c)
      (w.injective.ne ij) (inCore i) (inCore j)
    apply (G.isIndepSet_neighborSet_of_triangleFree tri (e c)).mono
    intro x hx
    rcases Finset.mem_insert.mp hx with rfl | hx
    · exact (show G.Adj (w i) (e c) from h1).symm
    rcases Finset.mem_insert.mp hx with rfl | hx
    · exact (show G.Adj (w j) (e c) from h2).symm
    obtain ⟨v, hv, rfl⟩ := Finset.mem_map.mp hx
    exact e.map_rel_iff.mpr (Finset.mem_filter.mp hv).2
  · intro i E hE
    by_contra! missing
    let a := w i.castSucc
    let b := w i.succ
    have ne : a ≠ b := w.injective.ne (by fin_cases i <;> decide)
    have nonedge : ¬ G.Adj a b := by fin_cases i <;> first | exact bad.1 | exact bad.2
    let s := E.map e.toEmbedding
    have ext (t : Fin 3) : w t ∉ s := by
      intro mem
      obtain ⟨v, _, eq⟩ := Finset.mem_map.mp mem
      exact out t v eq.symm
    apply impossible_ten G noTen s (by simpa [s] using hE.card_eq) ne (ext _) (ext _)
    apply insert_independent
    · apply insert_independent
      · intro x hx y hy xy edge
        obtain ⟨u, hu, rfl⟩ := Finset.mem_map.mp hx
        obtain ⟨v, hv, rfl⟩ := Finset.mem_map.mp hy
        exact hE.isIndepSet hu hv (by rintro rfl; exact xy rfl) (e.map_rel_iff.mp edge)
      · intro x hx
        obtain ⟨v, hv, rfl⟩ := Finset.mem_map.mp hx
        exact (missing v hv).2
    · intro x hx
      rcases Finset.mem_insert.mp hx with rfl | hx
      · exact nonedge
      obtain ⟨v, hv, rfl⟩ := Finset.mem_map.mp hx
      exact (missing v hv).1

#print axioms outside_fork
end RamseyScout.PathLemma
