import R7Independence
import Mathlib.Combinatorics.SimpleGraph.Finite

/-! Forward degree and triangle constraints for a graph with the R(7) layout,
and the side configurations needed for list coverage. Rows are indexed by
vertices, so repetitions within a side require no special case. -/

namespace R7Independence
open Finset

variable {X : Type*} [Fintype X] (G : SimpleGraph (X ⊕ Fixed)) [DecidableRel G.Adj]

def row (s : Fixed) : Finset X := (G.neighborFinset (.inr s)).toLeft

private theorem mem_row {s : Fixed} {x : X} :
    x ∈ row G s ↔ G.Adj (.inr s) (.inl x) := by simp [row]

/-- The number of neighbours of each fixed vertex inside the fixed part. -/
private theorem fixed_degree_table : ∀ s : Fixed,
    (univ.filter fun t : Fixed => consecutive (block s) (block t)).card =
      if block s = C then 2 else if block s = A ∨ block s = B then 3 else 9 := by
  decide

theorem row_sizes (layout : Layout G) (reg : ∀ v, G.degree v = 9) (s : Fixed) :
    (row G s).card = if block s = C then 7 else if block s = A ∨ block s = B then 6 else 0 := by
  have fixed : (G.neighborFinset (.inr s)).toRight =
      univ.filter fun t : Fixed => consecutive (block s) (block t) := by
    ext t
    simpa using layout.fixed s t
  have degree := card_toLeft_add_card_toRight (u := G.neighborFinset (.inr s))
  rw [fixed, fixed_degree_table, SimpleGraph.card_neighborFinset_eq_degree, reg] at degree
  change (G.neighborFinset (.inr s)).toLeft.card = _
  split_ifs at degree ⊢ <;> omega

/-- All indexed rows are independent in the core. -/
theorem rows_independent (tri : G.CliqueFree 3) (s : Fixed) :
    CoreIndependent G (row G s) := by
  intro x hx y hy hxy edge
  exact G.isIndepSet_neighborSet_of_triangleFree tri (.inr s)
    ((mem_row G).mp hx) ((mem_row G).mp hy) (Sum.inl_injective.ne hxy) edge

/-- No core vertex lies in rows on opposite sides. -/
theorem opposite_disjoint (layout : Layout G) (tri : G.CliqueFree 3)
    {a b : Fixed} (ha : block a = A) (hb : block b = B) :
    Disjoint (row G a) (row G b) := by
  apply disjoint_left.mpr
  intro x hax hbx
  have joined : G.Adj (.inr a) (.inr b) :=
    (layout.fixed a b).2 (by rw [ha, hb]; decide)
  exact G.isIndepSet_neighborSet_of_triangleFree tri (.inl x)
    ((mem_row G).mp hax).symm ((mem_row G).mp hbx).symm joined.ne joined

/-- A mathematical side choice: two indexed independent six-sets whose union
meets every independent core set I with |I| + 3 > K (in particular each seven-set at K=9). -/
def SideChoice (K : ℕ) (i : Block) : Prop :=
  (indices i).card = 2 ∧
  (∀ s ∈ indices i, (row G s).card = 6 ∧ CoreIndependent G (row G s)) ∧
  ∀ I : Finset X, CoreIndependent G I → K < I.card + 3 →
    ∃ s ∈ indices i, ∃ x ∈ I, x ∈ row G s

theorem gives_configuration (layout : Layout G) (K : ℕ) (tri : G.CliqueFree 3)
    (reg : ∀ v, G.degree v = 9) (alpha : G.indepNum ≤ K) :
    SideChoice G K A ∧ SideChoice G K B ∧
    ∀ a ∈ indices A, ∀ b ∈ indices B, Disjoint (row G a) (row G b) := by
  have choice (i : Block) (hi : i = A ∨ i = B) : SideChoice G K i := by
    refine ⟨?_, ?_, ?_⟩
    · rcases hi with rfl | rfl <;> decide
    · intro s hs
      have tag := (mem_filter.mp hs).2
      refine ⟨?_, rows_independent G tri s⟩
      rw [row_sizes G layout reg, tag]
      rcases hi with rfl | rfl <;> decide
    · intro I hI hsize
      obtain ⟨s, hs, x, hx, h⟩ := side_hits_seven G layout K
        (fun _ independent => independent.card_le_indepNum.trans alpha) hI hsize hi
      exact ⟨s, hs, x, hx, (mem_row G).mpr h⟩
  exact ⟨choice A (Or.inl rfl), choice B (Or.inr rfl), fun _ ha _ hb =>
    opposite_disjoint G layout tri (mem_filter.mp ha).2 (mem_filter.mp hb).2⟩

/-- The degree of a core vertex counts its core neighbours, its side rows,
and its C rows. This yields the exact residual column sum used in (D). -/
theorem column_degree [DecidableEq X] (layout : Layout G) (reg : ∀ v, G.degree v = 9) (x : X) :
    (G.neighborFinset (.inl x)).toLeft.card +
      (univ.filter fun s : Fixed => (block s = A ∨ block s = B) ∧ x ∈ row G s).card +
      (univ.filter fun s : Fixed => block s = C ∧ x ∈ row G s).card = 9 := by
  let sides := univ.filter fun s : Fixed => (block s = A ∨ block s = B) ∧ x ∈ row G s
  let common := univ.filter fun s : Fixed => block s = C ∧ x ∈ row G s
  have tags : ∀ i : Block, i = u ∨ i = w ∨ i = A ∨ i = B ∨ i = C := by decide
  have fixed : (G.neighborFinset (.inl x)).toRight = sides ∪ common := by
    ext s
    simp only [mem_toRight, SimpleGraph.mem_neighborFinset, mem_union, sides, common,
      mem_filter, mem_univ, true_and, mem_row]
    constructor
    · intro edge
      rcases tags (block s) with h | h | h | h | h
      · exact False.elim (layout.roots x s (Or.inl h) edge.symm)
      · exact False.elim (layout.roots x s (Or.inr h) edge.symm)
      · exact Or.inl ⟨Or.inl h, edge.symm⟩
      · exact Or.inl ⟨Or.inr h, edge.symm⟩
      · exact Or.inr ⟨h, edge.symm⟩
    · rintro (⟨_, edge⟩ | ⟨_, edge⟩) <;> exact edge.symm
  have disj : Disjoint sides common := by
    apply disjoint_left.mpr
    intro s hs hc
    have side := (mem_filter.mp hs).2.1
    rw [(mem_filter.mp hc).2.1] at side
    exact (by decide : ¬ (C = A ∨ C = B)) side
  have degree := card_toLeft_add_card_toRight (u := G.neighborFinset (.inl x))
  rw [fixed, card_union_of_disjoint disj, SimpleGraph.card_neighborFinset_eq_degree, reg] at degree
  simpa only [sides, common, Nat.add_assoc] using degree

#print axioms row_sizes
#print axioms rows_independent
#print axioms opposite_disjoint
#print axioms gives_configuration
#print axioms column_degree

end R7Independence
