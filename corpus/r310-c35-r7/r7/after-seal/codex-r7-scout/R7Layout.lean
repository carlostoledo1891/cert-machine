import Mathlib.Logic.Equiv.Fin.Basic
import R7SideChoices
import R310.R7

/-! From the original R(7) hypotheses to the labelled completion. The partition
and its cardinalities follow Chen's R310.R7.r7_cover. We use his r7_count
directly, requiring only the lower-bound direction of P1. -/

namespace R7Independence
open Finset SimpleGraph R310 R310.R7

private def pack : Fin 27 ⊕ Fixed ≃ Fin 40 := (Equiv.sumComm _ _).trans finSumFinEquiv

private def partNumber : Block → Fin 6 := ![0,2,4,3,1]

private def role (G : SimpleGraph (Fin 40)) (p q x : Fin 40) : Block → Prop :=
  ![x = p, G.Adj p x ∧ ¬ G.Adj q x, G.Adj q x ∧ ¬ G.Adj p x, x = q, G.Adj p x ∧ G.Adj q x]

private theorem role_edges {G : SimpleGraph (Fin 40)} {p q x y : Fin 40}
    (tri : G.CliqueFree 3) (apart : ¬ G.Adj p q)
    (join : ∀ x y, G.Adj p x → ¬ G.Adj q x → G.Adj q y → ¬ G.Adj p y → G.Adj x y)
    (i j : Block) (hx : role G p q x i) (hy : role G p q y j) :
    G.Adj x y ↔ consecutive i j := by
  have same (r a b : Fin 40) (ha : G.Adj r a) (hb : G.Adj r b) : ¬ G.Adj a b :=
    fun e => tri {r,a,b} (is3Clique_triple_iff.mpr ⟨ha,hb,e⟩)
  have swap (a b : Fin 40) : G.Adj a b → G.Adj b a := fun h => h.symm
  have loop (a : Fin 40) : ¬ G.Adj a a := G.loopless.irrefl a
  fin_cases i <;> fin_cases j <;> norm_num [role, consecutive] at hx hy ⊢ <;>
    grind only

/-- The equivalence sends the named roots to the input roots, identifies all
27 core vertices with the actual outside, and transports the original graph.
The edge count and complete A–B join both follow from the explicit P1 premise. -/
theorem layout_of_r7 (G : SimpleGraph (Fin 40)) [DecidableRel G.Adj]
    (p q : Fin 40) (distinct : p ≠ q) (apart : ¬ G.Adj p q)
    (common : (G.neighborFinset p ∩ G.neighborFinset q).card = 7)
    (reg : ∀ v, G.degree v = 9) (tri : G.CliqueFree 3) (alpha : G.indepNum ≤ 9)
    (p1 : EdgeLowerBound 8 27 85) :
    ∃ e : Fin 27 ⊕ Fixed ≃ Fin 40, e (.inr 0) = p ∧ e (.inr 10) = q ∧
      (∀ y, y ∈ outside2 G p q ↔ ∃ x : Fin 27, e (.inl x) = y) ∧
      (G.edgeFinset.filter (fun edge => ∀ v ∈ edge, v ∈ outside2 G p q)).card = 85 ∧
      Layout (G.comap e) := by
  classical
  obtain ⟨joinBound, edges⟩ := r7_count tri alpha reg p1 distinct apart common
  have ho : q ∈ outside G p := by simp [mem_outside, Ne.symm distinct, apart]
  rw [card_nested p q ho] at edges
  have join (a b : Fin 40) (pa : G.Adj p a) (qa : ¬ G.Adj q a)
      (qb : G.Adj q b) (pb : ¬ G.Adj p b) : G.Adj a b := by
    have h : a ∈ G.neighborFinset p ∩ G.neighborFinset b := by
      rw [joinBound b qb pb]; simp [pa, qa]
    simp only [mem_inter, mem_neighborFinset] at h
    exact h.2.symm
  let P : Fin 6 → Finset (Fin 40) :=
    ![{p}, G.neighborFinset p ∩ G.neighborFinset q, G.neighborFinset p \ G.neighborFinset q, {q},
      G.neighborFinset q \ G.neighborFinset p, outside2 G p q]
  have hnu : ∀ x, G.Adj p x → x ≠ p := fun x h e => G.loopless.irrefl p (e ▸ h)
  have hnv : ∀ x, G.Adj q x → x ≠ q := fun x h e => G.loopless.irrefl q (e ▸ h)
  have hPc : ∀ x, ∃ i, x ∈ P i := by
    intro x
    by_cases h1 : x = p; · exact ⟨0, by simp [P, h1]⟩
    by_cases h2 : x = q; · exact ⟨3, by simp [P, h2]⟩
    by_cases hu : G.Adj p x
    · by_cases hv : G.Adj q x
      · exact ⟨1, by simp [P, hu, hv]⟩
      · exact ⟨2, by simp [P, hu, hv]⟩
    · by_cases hv : G.Adj q x
      · exact ⟨4, by simp [P, hu, hv]⟩
      · exact ⟨5, by simp [P, mem_outside2, h1, h2, hu, hv]⟩
  have hPd : ∀ i j, i ≠ j → Disjoint (P i) (P j) := by
    clear join hPc joinBound edges ho p1 reg tri alpha common
    intro i j hij
    rw [Finset.disjoint_left]
    intro x hi hj
    fin_cases i <;> fin_cases j <;> simp_all [P, mem_outside2] <;>
      first | exact apart hj.symm | exact apart hi.symm
  -- sizes
  have hcu : #(G.neighborFinset p) = 9 := by rw [card_neighborFinset_eq_degree, reg]
  have hcv : #(G.neighborFinset q) = 9 := by rw [card_neighborFinset_eq_degree, reg]
  have hA : #(G.neighborFinset p \ G.neighborFinset q) = 2 := by
    have := card_sdiff_add_card_inter (G.neighborFinset p) (G.neighborFinset q); omega
  have hB : #(G.neighborFinset q \ G.neighborFinset p) = 2 := by
    have := card_sdiff_add_card_inter (G.neighborFinset q) (G.neighborFinset p)
    rw [inter_comm] at this; omega
  have hXc : #(outside2 G p q) = 27 := by
    have := card_outside2_add (G := G) distinct apart; rw [reg, reg, common] at this; simp at this; omega
  have hTc := fun i => congrFun Tb_card i
  have hcard : ∀ i, #(P i) = #(Tb i) := by
    intro i; rw [hTc i]; fin_cases i <;> simp [P, common, hA, hB, hXc]
  obtain ⟨σ, hσ⟩ := exists_perm_partition P Tb hPc hPd Tb_disj hcard
  have hs : ∀ i y, y ∈ Tb i ↔ σ.symm y ∈ P i := fun i y => by rw [hσ]; simp
  let e := pack.trans σ.symm
  have fixedRole (s : Fixed) : role G p q (e (.inr s)) (block s) := by
    have label : ∀ t : Fixed, pack (.inr t) ∈ Tb (partNumber (block t)) := by decide
    have belong := (hs _ _).1 (label s)
    change e (.inr s) ∈ P (partNumber (block s)) at belong
    generalize block s = i at belong ⊢
    fin_cases i <;> simpa [P, partNumber, role] using belong
  have coreLabel (x : Fin 27) : e (.inl x) ∈ outside2 G p q := by
    have labels : ∀ t : Fin 27, pack (.inl t) ∈ Tb 5 := by decide
    exact (hs _ _).1 (labels x)
  have rootP : e (.inr 0) = p := fixedRole 0
  have rootQ : e (.inr 10) = q := fixedRole 10
  refine ⟨e, rootP, rootQ, ?_, edges, ?_⟩
  · intro y
    constructor
    · intro hy
      obtain ⟨x | s, rfl⟩ := e.surjective y
      · exact ⟨x,rfl⟩
      · have spec := fixedRole s
        obtain ⟨⟨hp,nu⟩,hq,nv⟩ := mem_outside2.mp hy
        generalize block s = i at spec
        fin_cases i <;> simp [role] at spec <;> tauto
    · rintro ⟨x,rfl⟩; exact coreLabel x
  · constructor
    · intro s t
      exact role_edges tri apart join _ _ (fixedRole s) (fixedRole t)
    · intro x s tag
      have spec := fixedRole s
      obtain ⟨⟨_,hp⟩,_,hq⟩ := mem_outside2.mp (coreLabel x)
      change ¬ G.Adj (e (.inr s)) (e (.inl x))
      rcases tag with h | h <;> rw [h] at spec
      · change e (.inr s) = p at spec; rwa [spec]
      · change e (.inr s) = q at spec; rwa [spec]

#print axioms layout_of_r7

end R7Independence
