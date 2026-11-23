import OutsideSize

/-! The degree-4 corollary (cert-machine, 2026-11-21): in a (3,10;40)-graph no vertex has degree 4.

It is Theorem C35 plus one NAMED premise, the uniqueness of the (3,9;35)-graph (Goedgebeur–Radziszowski, EJC 20(1)
P30, 2013, Theorem 3: the circulant C35(1,7,11,16)), taken here as the hypothesis `unique35` and not proved.
If deg v = 4, the graph on the vertices outside N[v] has 35 vertices, no triangle and no independent 9-set (with v
it would be an independent 10-set), so it is the circulant; it is induced, so Theorem C35 caps the order at 39. -/

namespace RamseyScout.PathLemma
universe u

theorem no_degree_four {V : Type u} [Fintype V] [DecidableEq V] (G : SimpleGraph V) [DecidableRel G.Adj]
    (order : Fintype.card V = 40) (tri : G.CliqueFree 3) (noTen : ∀ s : Finset V, ¬ G.IsNIndepSet 10 s)
    (unique35 : ∀ (W : Type u) [Fintype W], Fintype.card W = 35 → ∀ H : SimpleGraph W, H.CliqueFree 3 →
      (∀ s : Finset W, ¬ H.IsNIndepSet 9 s) → Nonempty (core ≃g H))
    (v : V) : G.degree v ≠ 4 := by
  intro hdeg
  classical
  let s : Set V := {x | ¬ G.Adj v x ∧ x ≠ v}
  let H := G.induce s
  let inc : H ↪g G := SimpleGraph.Embedding.induce s
  -- 35 vertices outside the closed neighbourhood
  have hcard : Fintype.card s = 35 := by
    have hN : (Finset.univ.filter fun x => G.Adj v x ∨ x = v) = insert v (G.neighborFinset v) := by
      ext x; simp [SimpleGraph.mem_neighborFinset, or_comm, eq_comm]
    have hv : v ∉ G.neighborFinset v := by simp
    have h5 : (Finset.univ.filter fun x => G.Adj v x ∨ x = v).card = 5 := by
      rw [hN, Finset.card_insert_of_notMem hv, SimpleGraph.card_neighborFinset_eq_degree, hdeg]
    have hcompl := Finset.card_filter_add_card_filter_not
      (s := (Finset.univ : Finset V)) (fun x => G.Adj v x ∨ x = v)
    rw [Finset.card_univ, order, h5] at hcompl
    rw [Fintype.card_subtype]
    have : (Finset.univ.filter fun x => x ∈ s) = Finset.univ.filter fun x => ¬ (G.Adj v x ∨ x = v) := by
      ext x; simp [s, not_or]
    rw [this]
    omega
  have htri : H.CliqueFree 3 := tri.comap inc.isContained
  have hnine : ∀ t : Finset s, ¬ H.IsNIndepSet 9 t := by
    intro t ht
    apply noTen (insert v (t.map inc.toEmbedding))
    have hvt : v ∉ t.map inc.toEmbedding := by
      intro hm
      obtain ⟨x, _, hx⟩ := Finset.mem_map.mp hm
      exact x.2.2 hx
    refine ⟨?_, by rw [Finset.card_insert_of_notMem hvt, Finset.card_map, ht.card_eq]⟩
    intro a ha b hb hab hadj
    simp only [Finset.coe_insert, Set.mem_insert_iff, Finset.mem_coe] at ha hb
    rcases ha with rfl | ha <;> rcases hb with rfl | hb
    · exact hab rfl
    · obtain ⟨y, _, rfl⟩ := Finset.mem_map.mp hb
      exact y.2.1 hadj
    · obtain ⟨x, _, rfl⟩ := Finset.mem_map.mp ha
      exact x.2.1 hadj.symm
    · obtain ⟨x, hx, rfl⟩ := Finset.mem_map.mp ha
      obtain ⟨y, hy, rfl⟩ := Finset.mem_map.mp hb
      exact ht.isIndepSet hx hy (fun h => hab (by rw [h])) (inc.map_rel_iff.mp hadj)
  obtain ⟨φ⟩ := unique35 s hcard H htri hnine
  have := order_at_most_39 (φ.toEmbedding.trans inc) tri noTen
  omega

#print axioms no_degree_four
end RamseyScout.PathLemma
