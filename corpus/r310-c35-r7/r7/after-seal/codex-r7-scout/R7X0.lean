import R7CoreTransport
import R7Catalogue
import R7Control

/-! First numbered D7 branch. P2, C1, and the X0 record cover are visible
hypotheses. No record cover is required on the three other branches. -/

namespace R7X0
open Finset SimpleGraph R7Independence R7Exchange R7Composition R7Catalogue R310

/-- A hypothetical graph reaches a covered record on X0 or a different
numbered core. On X0 the seven C rows come from the original graph in their
original order, with their elements relabelled by the displayed isomorphism. -/
theorem r7_X0_branch (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj] (p q : Fin 40)
    (h : Hypotheses G p q) (p1 : EdgeLowerBound 8 27 85)
    {lines : Census} (p2 : P2 lines) (slice : C1 lines)
    {ι : Type} (records0 : ι → SideRows)
    (cover0 : ∀ T, Section3 X0 T → ∃ r im, T = records0 r ∘ source im) :
    ∃ e : Core ⊕ Fixed ≃ Fin 40, e (.inr 0) = p ∧ e (.inr 10) = q ∧
      let L := G.comap e
      let H := L.comap Sum.inl
      let R := fun c => row L (commonVertex c)
      let S := fun j => row L (sideVertex j)
      ((X0Marker H ∧ ∃ f : H ≃g X0, Section3 X0 (moveRows f S) ∧
        ∃ r, Completes X0 9 (moveRows f R) (records0 r)) ∨
       (¬ X0Marker H ∧ ∃ j : Fin 4, j ≠ 0 ∧ Nonempty (H ≃g graph j))) := by
  obtain ⟨e,hp,hq,tri,alpha,edges,done,valid,_⟩ := r7_gives_record G p q h p1
  let H := (G.comap e).comap (Sum.inl : Core → Core ⊕ Fixed)
  refine ⟨e,hp,hq,?_⟩
  by_cases marker : X0Marker H
  · obtain ⟨f⟩ := (identify_X0 p2 slice H tri alpha edges).mp marker
    exact Or.inl ⟨marker,f,(section3_core_iso f _).mp valid,
      representative_completion X0 records0 cover0 ((completes_core_iso f 9 _ _).mp done)⟩
  · obtain ⟨j,iso⟩ := catalogue_iso_of_85 p2 slice H tri alpha edges
    have other : j ≠ 0 := by
      rintro rfl
      exact marker ((identify_X0 p2 slice H tri alpha edges).mpr iso)
    exact Or.inr ⟨marker,j,other,iso⟩

/-- Compare all adjacencies of the independent K=10 control with the exact
graph6 line that production calls X0. -/
theorem control_core_X0 : R7Control.graph.comap (Sum.inl : Core → Core ⊕ Fixed) = X0 := by
  ext a b
  exact (by decide +kernel : ∀ u v : Core,
    R7Control.graph.Adj (.inl u) (.inl v) ↔ X0.Adj u v) a b

private def swap01 : Equiv.Perm Core := Equiv.swap 0 1

/-- Positive control for core transport: swap labels 0 and 1. This changes
the labelled graph and at least one common row. The same graph completion
witness is transported at K=10. -/
theorem control_changes_labelling :
    let R := fun c => row R7Control.graph (commonVertex c)
    let S := fun j => row R7Control.graph (sideVertex j)
    let J := X0.comap swap01
    let f := (Iso.comap swap01 X0).symm
    J ≠ X0 ∧ (∃ c, moveRows f R c ≠ R c) ∧ Completes J 10 (moveRows f R) (moveRows f S) := by
  let R := fun c => row R7Control.graph (commonVertex c)
  let S := fun j => row R7Control.graph (sideVertex j)
  have done : Completes X0 10 R S := ⟨R7Control.graph, inferInstance, R7Control.layout,
    control_core_X0, R7Control.triangle_free, R7Control.regular, R7Control.alpha_eq_ten.le,
    fun _ => rfl, fun _ => rfl⟩
  refine ⟨?_, ?_, (completes_core_iso (Iso.comap swap01 X0).symm 10 R S).mp done⟩
  · intro eq
    have witness : ∃ a b, (X0.comap swap01).Adj a b ∧ ¬ X0.Adj a b := by decide +kernel
    obtain ⟨a,b,edge,missing⟩ := witness
    rw [eq] at edge
    exact missing edge
  · decide +kernel

#print axioms r7_X0_branch
#print axioms control_core_X0
#print axioms control_changes_labelling

end R7X0
