import R7Layout
import R7Exchanges

/-! Composition on the original rooted graph. The control room's P5bCompose
scratch proof supplied the three transports. Chen's R310 library is imported
by R7Layout and R7Exchanges. -/

namespace R7Composition
open Finset SimpleGraph R7Independence R7Exchange R310

abbrev Core := Fin 27
abbrev CommonRows := Fin 7 → Finset Core
abbrev SideRows := Fin 4 → Finset Core

structure Hypotheses (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj] (p q : Fin 40) : Prop where
  distinct : p ≠ q
  apart : ¬ G.Adj p q
  common : (G.neighborFinset p ∩ G.neighborFinset q).card = 7
  regular : ∀ v, G.degree v = 9
  tri : G.CliqueFree 3
  alpha : G.indepNum ≤ 9

/-- These hold for the very same pulled-back graph which satisfies Layout. -/
theorem transport_graph {V W : Type*} [Fintype V] [Fintype W] (G : SimpleGraph W)
    [DecidableRel G.Adj] (e : V ≃ W) (K : ℕ)
    (tri : G.CliqueFree 3) (regular : ∀ v, G.degree v = 9) (alpha : G.indepNum ≤ K) :
    (G.comap e).CliqueFree 3 ∧ (∀ v, (G.comap e).degree v = 9) ∧ (G.comap e).indepNum ≤ K := by
  let φ := Iso.comap e G
  exact ⟨tri.comap φ.isContained, fun v => (φ.degree_eq v).symm.trans (regular _),
    (indepNum_le_of_embedding φ.toEmbedding).trans alpha⟩

private theorem core_edge_count (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj]
    (p q : Fin 40) (e : Core ⊕ Fixed ≃ Fin 40)
    (outside : ∀ v, v ∈ outside2 G p q ↔ ∃ x : Core, e (.inl x) = v)
    (edges : (G.edgeFinset.filter (fun edge => ∀ v ∈ edge, v ∈ outside2 G p q)).card = 85) :
    ((G.comap e).comap Sum.inl).edgeFinset.card = 85 := by
  let D := outside2 G p q
  let f (x : Core) : (D : Set (Fin 40)) := ⟨e (.inl x), (outside _).2 ⟨x,rfl⟩⟩
  let b : Core ≃ (D : Set (Fin 40)) := Equiv.ofBijective f ⟨fun _ _ h =>
    Sum.inl_injective (e.injective (congrArg Subtype.val h)), fun y => by
      obtain ⟨x, hx⟩ := (outside y).1 y.property
      exact ⟨x, Subtype.ext hx⟩⟩
  let φ : (G.comap e).comap Sum.inl ≃g G.induce (D : Set (Fin 40)) :=
    { toEquiv := b, map_rel_iff' := Iff.rfl }
  rw [φ.card_edgeFinset_eq, ← G.card_filter_edgeFinset_toFinset_subset D]
  simpa only [Finset.subset_iff, Sym2.mem_toFinset, D] using edges

/-- The core, its rows, and its eligibility for D7 belong to the *same* labelling.
The final implication takes a mathematical record cover for this particular H. -/
theorem r7_gives_record (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj] (p q : Fin 40)
    (h : Hypotheses G p q) (p1 : EdgeLowerBound 8 27 85) :
    ∃ e : Core ⊕ Fixed ≃ Fin 40, e (.inr 0) = p ∧ e (.inr 10) = q ∧
      let L := G.comap e
      let H := L.comap Sum.inl
      let R := fun c => row L (commonVertex c)
      let S := fun j => row L (sideVertex j)
      H.CliqueFree 3 ∧ H.indepNum ≤ 7 ∧ H.edgeFinset.card = 85 ∧
      Completes H 9 R S ∧ Section3 H S ∧
      ∀ (ι : Type) (records : ι → SideRows),
        (∀ T, Section3 H T → ∃ r im, T = records r ∘ source im) →
        ∃ r, Completes H 9 R (records r) := by
  obtain ⟨e,hp,hq,outside,edges,lay⟩ :=
    layout_of_r7 G p q h.distinct h.apart h.common h.regular h.tri h.alpha p1
  obtain ⟨tri,regular,alpha⟩ := transport_graph G e 9 h.tri h.regular h.alpha
  let L := G.comap e
  let H := L.comap (Sum.inl : Core → Core ⊕ Fixed)
  have triH : H.CliqueFree 3 :=
    tri.comap (Embedding.comap (Function.Embedding.inl : Core ↪ Core ⊕ Fixed) L).isContained
  have alphaH : H.indepNum ≤ 7 := by
    obtain ⟨I,hI⟩ := H.exists_isNIndepSet_indepNum
    have cut := ((bound_iff_rowClauses L lay 9).mp
      (fun _ ind => ind.card_le_indepNum.trans alpha) I hI.isIndepSet).1
    rw [hI.card_eq] at cut
    omega
  have done : Completes H 9 (fun c => row L (commonVertex c)) (fun j => row L (sideVertex j)) :=
    ⟨L, inferInstance, lay, rfl, tri, regular, alpha, fun _ => rfl, fun _ => rfl⟩
  exact ⟨e, hp, hq, triH, alphaH, core_edge_count G p q e outside edges, done,
    section3_of_graph L lay tri regular alpha,
    fun _ records cover => representative_completion H records cover done⟩

#print axioms transport_graph
#print axioms r7_gives_record

end R7Composition
