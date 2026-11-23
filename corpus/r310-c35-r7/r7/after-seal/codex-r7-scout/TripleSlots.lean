import GlobalCut

namespace RamseyScout

/-- In a graph with a maximum independent base D, three exterior vertices
whose base neighbours lie in two slots cannot be independent. When y
already misses x and z, the edge x-z is forced. -/
theorem triple_slot_edge {V : Type*} [DecidableEq V] (G : SimpleGraph V) (D : Finset V)
    (base : G.IsIndepSet D)
    (bound : ∀ S : Finset V, G.IsIndepSet S → S.card ≤ D.card)
    (x y z c d : V) (xy : x ≠ y) (xz : x ≠ z) (yz : y ≠ z) (cd : c ≠ d)
    (outside : Disjoint D {x,y,z}) (slots : ({c,d} : Finset V) ⊆ D)
    (confined : ∀ t ∈ ({x,y,z} : Finset V), ∀ v ∈ D, G.Adj t v → v ∈ ({c,d} : Finset V))
    (missXY : ¬G.Adj x y) (missYZ : ¬G.Adj y z) : G.Adj x z := by
  by_contra missXZ
  have ind : G.IsIndepSet (↑({x,y,z} : Finset V) : Set V) := by
    apply G.isIndepSet_iff.mpr
    intro u hu v hv ne edge
    simp only [Finset.mem_coe, Finset.mem_insert, Finset.mem_singleton] at hu hv
    rcases hu with rfl | rfl | rfl <;> rcases hv with rfl | rfl | rfl <;>
      first | exact ne rfl | exact missXY edge | exact missXY edge.symm |
              exact missYZ edge | exact missYZ edge.symm | exact missXZ edge | exact missXZ edge.symm
  have le := (independent_bound_iff_base_subsets G D base).mp bound
    {c,d} slots {x,y,z} outside ind confined
  have separate : x ∉ ({y,z} : Finset V) := by simp [xy,xz]
  rw [Finset.card_insert_of_notMem separate, Finset.card_pair yz, Finset.card_pair cd] at le
  omega

#print axioms triple_slot_edge

end RamseyScout
