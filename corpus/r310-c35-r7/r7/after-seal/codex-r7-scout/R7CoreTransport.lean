import R7Composition

/-! Core relabelling for D7. Unlike a D8 exchange this fixes every one of the
13 fixed vertices and maps the elements of each row, preserving its slot. -/

namespace R7Composition
open Finset SimpleGraph R7Independence R7Exchange

variable {X Y : Type*} {H : SimpleGraph X} {J : SimpleGraph Y}

def moveRows {n : ℕ} (f : H ≃g J) (rows : Fin n → Finset X) : Fin n → Finset Y :=
  fun i => (rows i).map f.toEquiv.toEmbedding

private theorem undo_rows {n : ℕ} (f : H ≃g J) (rows : Fin n → Finset X) :
    moveRows f.symm (moveRows f rows) = rows := by
  funext i
  ext x
  simp [moveRows]
  exact iff_of_eq (congrArg (fun y => y ∈ rows i) (f.symm.apply_symm_apply x))

private theorem move_ind (f : H ≃g J) {s : Finset X} (ind : H.IsIndepSet s) :
    J.IsIndepSet (s.map f.toEquiv.toEmbedding) := by
  intro a ha b hb ne
  obtain ⟨x,hx,rfl⟩ := mem_map.mp ha
  obtain ⟨y,hy,rfl⟩ := mem_map.mp hb
  exact fun edge => ind hx hy (fun eq => ne (congrArg f eq)) (f.map_adj_iff.mp edge)

private theorem move_pair (f : H ≃g J) {a b : Finset X} (pair : ValidPair H a b) :
    ValidPair J (a.map f.toEquiv.toEmbedding) (b.map f.toEquiv.toEmbedding) := by
  refine ⟨⟨(card_map _).trans pair.1.1, move_ind f pair.1.2⟩,
    ⟨(card_map _).trans pair.2.1.1, move_ind f pair.2.1.2⟩, ?_⟩
  intro I ind seven
  obtain ⟨x,hx,hit⟩ := pair.2.2 (I.map f.symm.toEquiv.toEmbedding) (move_ind f.symm ind)
    ((card_map _).trans seven)
  obtain ⟨y,hy,rfl⟩ := mem_map.mp hx
  exact ⟨y, hy, hit.imp (fun h => mem_map.mpr ⟨_,h,f.apply_symm_apply y⟩)
    (fun h => mem_map.mpr ⟨_,h,f.apply_symm_apply y⟩)⟩

private theorem move_section3 [DecidableEq X] [DecidableEq Y] (f : H ≃g J)
    {S : Fin 4 → Finset X} (hs : Section3 H S) : Section3 J (moveRows f S) := by
  refine ⟨move_pair f hs.1, move_pair f hs.2.1, ?_⟩
  change Disjoint ((S 0).map _ ∪ (S 1).map _) ((S 2).map _ ∪ (S 3).map _)
  simpa only [← map_union, disjoint_map] using hs.2.2

theorem section3_core_iso [DecidableEq X] [DecidableEq Y] (f : H ≃g J) (S : Fin 4 → Finset X) :
    Section3 H S ↔ Section3 J (moveRows f S) := by
  refine ⟨move_section3 f, fun h => ?_⟩
  simpa only [undo_rows] using move_section3 f.symm h

variable [Fintype X] [Fintype Y]

private theorem move_completion (f : H ≃g J) {K : ℕ} {R : Fin 7 → Finset X} {S : Fin 4 → Finset X}
    (h : Completes H K R S) : Completes J K (moveRows f R) (moveRows f S) := by
  obtain ⟨G, inst, layout, core, tri, reg, alpha, common, sides⟩ := h
  let b := Equiv.sumCongr f.toEquiv.symm (Equiv.refl Fixed)
  let L := G.comap b
  have lay : Layout L := ⟨layout.fixed, fun y s h => layout.roots (f.symm y) s h⟩
  obtain ⟨tri',reg',alpha'⟩ := transport_graph G b K tri reg alpha
  have core' : L.comap Sum.inl = J := by
    ext y z
    change (G.comap Sum.inl).Adj (f.symm y) (f.symm z) ↔ J.Adj y z
    rw [core]
    exact f.symm.map_adj_iff
  have rows (s : Fixed) : row L s = (row G s).map f.toEquiv.toEmbedding := by
    ext y
    simp only [row, mem_toLeft, mem_neighborFinset]
    change G.Adj (.inr s) (.inl (f.symm y)) ↔ y ∈ (row G s).map f.toEquiv.toEmbedding
    constructor
    · intro edge
      exact mem_map.mpr ⟨f.symm y, by simpa [row] using edge, f.apply_symm_apply y⟩
    · intro hy
      obtain ⟨x,hx,rfl⟩ := mem_map.mp hy
      simpa [row] using hx
  exact ⟨L,inferInstance,lay,core',tri',reg',alpha',fun c => by rw [rows, common]; rfl,
    fun j => by rw [rows, sides]; rfl⟩

theorem completes_core_iso (f : H ≃g J) (K : ℕ) (R : Fin 7 → Finset X) (S : Fin 4 → Finset X) :
    Completes H K R S ↔ Completes J K (moveRows f R) (moveRows f S) := by
  refine ⟨move_completion f, fun h => ?_⟩
  simpa only [undo_rows] using move_completion f.symm h

#print axioms section3_core_iso
#print axioms completes_core_iso

end R7Composition
