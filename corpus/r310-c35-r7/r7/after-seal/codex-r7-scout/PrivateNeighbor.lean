import GlobalCut

/-! Outside vertices with a unique neighbour in a maximum independent set
must have distinct such neighbours in a triangle-free graph. In R(7), use
the nine vertices of C and one side as D, and use the seven vertices of C as W. -/

namespace RamseyScout

theorem private_neighbor_capacity {V : Type*} (G : SimpleGraph V)
    (D W L : Finset V) (f : V → V) (tri : G.CliqueFree 3)
    (base : G.IsIndepSet D)
    (bound : ∀ S : Finset V, G.IsIndepSet S → S.card ≤ D.card)
    (targets : W ⊆ D) (outside : Disjoint D L)
    (maps : ∀ x ∈ L, f x ∈ W)
    (privateEdge : ∀ x ∈ L, ∀ d ∈ D, G.Adj x d ↔ d = f x) :
    L.card ≤ W.card := by
  classical
  apply Finset.card_le_card_of_injOn f maps
  intro x hx y hy same
  by_contra distinct
  have dx : f x ∈ D := targets (maps x hx)
  have pairL : ({x, y} : Finset V) ⊆ L :=
    Finset.insert_subset hx (Finset.singleton_subset_iff.mpr hy)
  have adjacent : ∀ t ∈ ({x, y} : Finset V), G.Adj (f x) t := by
    intro t ht
    rcases Finset.mem_insert.mp ht with rfl | ht
    · exact ((privateEdge _ hx _ dx).mpr rfl).symm
    · obtain rfl := Finset.mem_singleton.mp ht
      exact ((privateEdge _ hy _ dx).mpr same).symm
  have ind : G.IsIndepSet (↑({x, y} : Finset V) : Set V) :=
    (G.isIndepSet_neighborSet_of_triangleFree tri (f x)).mono adjacent
  have le := (independent_bound_iff_base_subsets G D base).mp bound
    {f x} (Finset.singleton_subset_iff.mpr dx) {x, y}
    (outside.mono_right pairL) ind
  have h := le (by
    intro t ht d hd edge
    have eq := (privateEdge t (pairL ht) d hd).mp edge
    rcases Finset.mem_insert.mp ht with rfl | ht
    · simpa using eq
    · obtain rfl := Finset.mem_singleton.mp ht
      simpa using eq.trans same.symm)
  rw [Finset.card_pair distinct, Finset.card_singleton] at h
  omega

#print axioms private_neighbor_capacity

end RamseyScout
