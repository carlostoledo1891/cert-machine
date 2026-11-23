import R7SideChoices
import R310.EdgeBound

/-! D8. Each labelled image of a side record has exactly the same possible
ordered seven common-neighbour rows on the very same labelled core. -/

namespace R7Exchange
open R7Independence Finset SimpleGraph

/-- Output slot to input slot, in the image order used by cover7.
Bits 0 and 1 reverse the original A and B pair, then bit 2 exchanges the pairs. -/
def source : Fin 8 → Fin 4 → Fin 4 :=
  ![![0,1,2,3], ![1,0,2,3], ![0,1,3,2], ![1,0,3,2],
    ![2,3,0,1], ![2,3,1,0], ![3,2,0,1], ![3,2,1,0]]

def sideVertex : Fin 4 → Fixed := ![8,9,11,12]
def commonVertex (c : Fin 7) : Fixed := ⟨c.val + 1, by omega⟩

private def exchangeSides : Equiv.Perm Fixed :=
  ((Equiv.swap 0 10).trans (Equiv.swap 8 11)).trans (Equiv.swap 9 12)

/-- Pullback acts in reverse order on vertex indices. Whole-side exchange
includes the two roots, whereas a within-side reversal fixes them. -/
def fixedPerm (im : Fin 8) : Equiv.Perm Fixed :=
  let ab := if im.val.testBit 2 then exchangeSides else Equiv.refl _
  let a := if im.val.testBit 0 then Equiv.swap 8 9 else Equiv.refl _
  let b := if im.val.testBit 1 then Equiv.swap 11 12 else Equiv.refl _
  (ab.trans a).trans b

theorem slot_action : ∀ im j, fixedPerm im (sideVertex j) = sideVertex (source im j) := by decide
theorem common_fixed : ∀ im c, fixedPerm im (commonVertex c) = commonVertex c := by decide

private theorem fixed_edges : ∀ im s t, consecutive (block (fixedPerm im s)) (block (fixedPerm im t)) ↔
    consecutive (block s) (block t) := by decide +kernel

private theorem roots : ∀ im s, block s = u ∨ block s = w →
    block (fixedPerm im s) = u ∨ block (fixedPerm im s) = w := by decide

private def inverseImage : Fin 8 → Fin 8 := ![0,1,2,3,4,6,5,7]

private theorem undo : ∀ im j, source im (source (inverseImage im) j) = j := by decide

variable {X : Type*}

def vertexPerm (X : Type*) (im : Fin 8) : Equiv.Perm (X ⊕ Fixed) :=
  Equiv.sumCongr (Equiv.refl X) (fixedPerm im)

theorem layout_image (G : SimpleGraph (X ⊕ Fixed)) (layout : Layout G) (im : Fin 8) :
    Layout (G.comap (vertexPerm X im)) where
  fixed s t := (layout.fixed _ _).trans (fixed_edges im s t)
  roots x s h := layout.roots x _ (roots im s h)

/-- Mathematical section 3 side choice with indexed rows, allowing repetition. -/
def ValidPair (H : SimpleGraph X) (a b : Finset X) : Prop :=
  (a.card = 6 ∧ H.IsIndepSet a) ∧ (b.card = 6 ∧ H.IsIndepSet b) ∧
  ∀ I : Finset X, H.IsIndepSet I → I.card = 7 → ∃ x ∈ I, x ∈ a ∨ x ∈ b

def Section3 [DecidableEq X] (H : SimpleGraph X) (S : Fin 4 → Finset X) : Prop :=
  ValidPair H (S 0) (S 1) ∧ ValidPair H (S 2) (S 3) ∧
    Disjoint (S 0 ∪ S 1) (S 2 ∪ S 3)

private theorem validPair_comm (H : SimpleGraph X) (a b : Finset X) :
    ValidPair H a b ↔ ValidPair H b a := by
  unfold ValidPair
  constructor <;> rintro ⟨h₁,h₂,hit⟩ <;> refine ⟨h₂,h₁,?_⟩ <;>
    intro I ind size <;> obtain ⟨x,hx,h⟩ := hit I ind size <;> exact ⟨x,hx,h.symm⟩

theorem section3_image_iff [DecidableEq X] (H : SimpleGraph X) (S : Fin 4 → Finset X) (im : Fin 8) :
    Section3 H (S ∘ source im) ↔ Section3 H S := by
  fin_cases im <;> simp [Section3, source, validPair_comm, union_comm,
    disjoint_comm, and_left_comm, and_comm, and_assoc]

/-- These are the side-dependent inputs to the mathematical production constraints:
column multiplicity, worst missing-side count, and the opposite-side overlap guard. -/
structure SideInputs (X : Type*) where
  columnUses : X → ℕ
  maxMisses : Finset X → ℕ
  oppositeDisjoint : Prop

private def total (v : Fin 4 → ℕ) := v 0 + v 1 + v 2 + v 3
private def largerPair (v : Fin 4 → ℕ) := max (v 0 + v 1) (v 2 + v 3)

def sideInputs [DecidableEq X] (S : Fin 4 → Finset X) : SideInputs X where
  columnUses x := total (fun j => if x ∈ S j then 1 else 0)
  maxMisses I := largerPair (fun j => if Disjoint (S j) I then 1 else 0)
  oppositeDisjoint := Disjoint (S 0 ∪ S 1) (S 2 ∪ S 3)

private theorem total_image (v : Fin 4 → ℕ) (im : Fin 8) :
    total (v ∘ source im) = total v := by
  fin_cases im <;> simp [source, total, Nat.add_comm, Nat.add_left_comm, Nat.add_assoc]

private theorem largerPair_image (v : Fin 4 → ℕ) (im : Fin 8) :
    largerPair (v ∘ source im) = largerPair v := by
  fin_cases im <;> simp [source, largerPair, Nat.add_comm, max_comm]

theorem sideInputs_image [DecidableEq X] (S : Fin 4 → Finset X) (im : Fin 8) :
    sideInputs (S ∘ source im) = sideInputs S := by
  unfold sideInputs
  congr 1
  · funext x
    exact total_image (fun j => if x ∈ S j then 1 else 0) im
  · funext I
    exact largerPair_image (fun j => if Disjoint (S j) I then 1 else 0) im
  · fin_cases im <;> simp [source, union_comm, disjoint_comm]

variable [Fintype X]

/-- Every putative R(7) completion supplies an assignment in the mathematical
domain covered by P3. No sufficiency of the side conditions is assumed. -/
theorem section3_of_graph [DecidableEq X] (G : SimpleGraph (X ⊕ Fixed)) [DecidableRel G.Adj]
    (layout : Layout G) (tri : G.CliqueFree 3) (reg : ∀ v, G.degree v = 9)
    (alpha : G.indepNum ≤ 9) : Section3 (G.comap Sum.inl) (fun j => row G (sideVertex j)) := by
  obtain ⟨ha,hb,hcross⟩ := gives_configuration G layout 9 tri reg alpha
  have pair (i : Block) (a b : Fixed) (side : SideChoice G 9 i) (labels : indices i = {a,b}) :
      ValidPair (G.comap Sum.inl) (row G a) (row G b) := by
    refine ⟨side.2.1 a (by simp [labels]), side.2.1 b (by simp [labels]), ?_⟩
    intro I ind seven
    obtain ⟨s,hs,x,hx,hit⟩ := side.2.2 I ind (by omega)
    rw [labels] at hs
    rcases mem_insert.mp hs with rfl | hs
    · exact ⟨x,hx,Or.inl hit⟩
    · obtain rfl := mem_singleton.mp hs
      exact ⟨x,hx,Or.inr hit⟩
  refine ⟨pair A _ _ ha (by decide), pair B _ _ hb (by decide), ?_⟩
  simp only [disjoint_union_left, disjoint_union_right]
  exact ⟨⟨hcross _ (by decide) _ (by decide), hcross _ (by decide) _ (by decide)⟩,
    ⟨hcross _ (by decide) _ (by decide), hcross _ (by decide) _ (by decide)⟩⟩

/-- R and H are parameters so the equivalence compares exactly the same
ordered C rows and exactly the same labelled core, for any independence bound. -/
def Completes (H : SimpleGraph X) (K : ℕ) (R : Fin 7 → Finset X) (S : Fin 4 → Finset X) : Prop :=
  ∃ G : SimpleGraph (X ⊕ Fixed), ∃ _ : DecidableRel G.Adj,
    Layout G ∧ G.comap Sum.inl = H ∧ G.CliqueFree 3 ∧ (∀ v, G.degree v = 9) ∧ G.indepNum ≤ K ∧
    (∀ c, row G (commonVertex c) = R c) ∧ ∀ j, row G (sideVertex j) = S j

private theorem to_image {H : SimpleGraph X} {K : ℕ} {R : Fin 7 → Finset X} {S : Fin 4 → Finset X}
    (h : Completes H K R S) (im : Fin 8) : Completes H K R (S ∘ source im) := by
  obtain ⟨G, inst, layout, core, tri, degree, alpha, common, sides⟩ := h
  let p := vertexPerm X im
  let iso := Iso.comap p G
  have rows (s : Fixed) : row (G.comap p) s = row G (fixedPerm im s) := by
    ext x
    simp only [row, mem_toLeft, mem_neighborFinset]
    rfl
  refine ⟨G.comap p, inferInstance, layout_image G layout im, core, tri.comap iso.toEmbedding.isContained,
    fun v => (iso.degree_eq v).symm.trans (degree _),
    (R310.indepNum_le_of_embedding iso.toEmbedding).trans alpha, ?_, ?_⟩
  · intro c
    rw [rows, common_fixed, common]
  · intro j
    rw [rows, slot_action, sides]
    rfl

theorem completes_image_iff (H : SimpleGraph X) (K : ℕ) (R : Fin 7 → Finset X)
    (S : Fin 4 → Finset X) (im : Fin 8) :
    Completes H K R (S ∘ source im) ↔ Completes H K R S := by
  refine ⟨fun h => ?_, fun h => to_image h im⟩
  have back := to_image h (inverseImage im)
  have eq : (S ∘ source im) ∘ source (inverseImage im) = S := by
    funext j
    simp only [Function.comp_apply, undo]
  rwa [eq] at back

/-- The interface to P3: a covered, hypothetical completion on this labelled
core supplies a completion of a record with the identical ordered C rows. -/
theorem representative_completion [DecidableEq X] {ι : Type*} (H : SimpleGraph X)
    (records : ι → Fin 4 → Finset X)
    (cover : ∀ S, Section3 H S → ∃ r im, S = records r ∘ source im)
    {R : Fin 7 → Finset X} {S : Fin 4 → Finset X} (h : Completes H 9 R S) :
    ∃ r, Completes H 9 R (records r) := by
  have necessary : Section3 H S := by
    obtain ⟨G, inst, layout, core, tri, degree, alpha, _, sides⟩ := h
    have valid := section3_of_graph G layout tri degree alpha
    rwa [core, show (fun j => row G (sideVertex j)) = S from funext sides] at valid
  obtain ⟨r, im, rfl⟩ := cover S necessary
  exact ⟨r, (completes_image_iff H 9 R _ im).mp h⟩

#print axioms slot_action
#print axioms common_fixed
#print axioms layout_image
#print axioms section3_image_iff
#print axioms sideInputs_image
#print axioms section3_of_graph
#print axioms completes_image_iff
#print axioms representative_completion

end R7Exchange
