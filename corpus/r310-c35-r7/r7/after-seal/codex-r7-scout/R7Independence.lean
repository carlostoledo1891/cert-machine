import Mathlib.Combinatorics.SimpleGraph.Clique
import Mathlib.Data.Finset.Sum

/-! Independence in the labelled R(7) completion. The core graph and its incident
rows are arbitrary. The fixed vertices retain Chen's numbering: u=0, C=1..7,
A=8..9, w=10, B=11..12. The five blocks, in cyclic order, are u,A,B,w,C.
Adjacent blocks are completely joined. There are no edges within a block. -/

namespace R7Independence
open Finset

abbrev Block := Fin 5
abbrev Fixed := Fin 13
abbrev u : Block := 0
abbrev A : Block := 1
abbrev B : Block := 2
abbrev w : Block := 3
abbrev C : Block := 4

def block (s : Fixed) : Block :=
  if s = 0 then u else if s.val ≤ 7 then C else if s.val ≤ 9 then A
  else if s.val = 10 then w else B

abbrev consecutive (i j : Block) : Prop :=
  (i.val + 1) % 5 = j.val ∨ (j.val + 1) % 5 = i.val

def templates : Finset (Block × Block) := {(C,A), (C,B), (u,B), (w,A), (u,w)}

private theorem covers (S : Finset Block) (h : ∀ i ∈ S, ∀ j ∈ S, ¬ consecutive i j) :
    ∃ p ∈ templates, ∀ i ∈ S, i = p.1 ∨ i = p.2 := by
  revert S
  decide

private theorem template_ok : ∀ p ∈ templates, p.1 ≠ p.2 ∧
    ∀ i j : Block, (i = p.1 ∨ i = p.2) → (j = p.1 ∨ j = p.2) → ¬ consecutive i j := by
  decide

variable {X : Type*} (G : SimpleGraph (X ⊕ Fixed))

/-- Exact adjacency within the fixed part, and no root has a neighbour in the core. -/
structure Layout : Prop where
  fixed : ∀ s t : Fixed, G.Adj (.inr s) (.inr t) ↔ consecutive (block s) (block t)
  roots : ∀ (x : X) (s : Fixed), block s = u ∨ block s = w → ¬ G.Adj (.inr s) (.inl x)

def CoreIndependent (I : Finset X) : Prop := (G.comap Sum.inl).IsIndepSet I

/-- Count indexed rows with multiplicity, even if different vertices have identical rows. -/
noncomputable def missing (I : Finset X) (i : Block) : Finset Fixed := by
  classical
  exact univ.filter fun s => block s = i ∧ ∀ x ∈ I, ¬ G.Adj (.inr s) (.inl x)

private theorem mem_missing {I : Finset X} {i : Block} {s : Fixed} :
    s ∈ missing G I i ↔ block s = i ∧ ∀ x ∈ I, ¬ G.Adj (.inr s) (.inl x) := by
  classical
  simp [missing]

private theorem union_count (I : Finset X) {i j : Block} (hne : i ≠ j) :
    ((missing G I i) ∪ (missing G I j)).card =
      (missing G I i).card + (missing G I j).card := by
  apply card_union_of_disjoint
  exact disjoint_left.mpr fun _ hi hj =>
    hne ((mem_missing G |>.mp hi).1.symm.trans (mem_missing G |>.mp hj).1)

private theorem split_independent (I : Finset X) (T : Finset Fixed) :
    G.IsIndepSet (I.disjSum T) ↔ CoreIndependent G I ∧
    (∀ s ∈ T, ∀ t ∈ T, ¬ G.Adj (.inr s) (.inr t)) ∧
    ∀ s ∈ T, ∀ x ∈ I, ¬ G.Adj (.inr s) (.inl x) := by
  constructor
  · intro h
    have noEdge {a b : X ⊕ Fixed} (ha : a ∈ I.disjSum T) (hb : b ∈ I.disjSum T) :
        ¬ G.Adj a b := fun e => h ha hb e.ne e
    exact ⟨fun _ hx _ hy _ => noEdge (inl_mem_disjSum.mpr hx) (inl_mem_disjSum.mpr hy),
      fun _ hs _ ht => noEdge (inr_mem_disjSum.mpr hs) (inr_mem_disjSum.mpr ht),
      fun _ hs _ hx => noEdge (inr_mem_disjSum.mpr hs) (inl_mem_disjSum.mpr hx)⟩
  · rintro ⟨core, fixed, cross⟩
    apply G.isIndepSet_iff.mpr
    intro a ha b hb _ e
    cases a with
    | inl x =>
      cases b with
      | inl y =>
        exact core (inl_mem_disjSum.mp ha) (inl_mem_disjSum.mp hb)
          (fun he => e.ne (congrArg Sum.inl he)) e
      | inr t => exact cross t (inr_mem_disjSum.mp hb) x (inl_mem_disjSum.mp ha) e.symm
    | inr s =>
      cases b with
      | inl y => exact cross s (inr_mem_disjSum.mp ha) y (inl_mem_disjSum.mp hb) e
      | inr t => exact fixed s (inr_mem_disjSum.mp ha) t (inr_mem_disjSum.mp hb) e

/-- For each independent core set all five extensions are attainable; one of them
contains the fixed part of any independent extension. -/
theorem bound_iff_templates (layout : Layout G) (K : ℕ) :
    (∀ S : Finset (X ⊕ Fixed), G.IsIndepSet S → S.card ≤ K) ↔
    ∀ I : Finset X, CoreIndependent G I → ∀ p ∈ templates,
      I.card + (missing G I p.1).card + (missing G I p.2).card ≤ K := by
  classical
  constructor
  · intro bound I core p hp
    have properties := template_ok p hp
    let T := missing G I p.1 ∪ missing G I p.2
    have member {s} (hs : s ∈ T) :
        (block s = p.1 ∨ block s = p.2) ∧ ∀ x ∈ I, ¬ G.Adj (.inr s) (.inl x) := by
      rcases mem_union.mp hs with h | h
      · obtain ⟨h₁, h₂⟩ := (mem_missing G).mp h
        exact ⟨Or.inl h₁, h₂⟩
      · obtain ⟨h₁, h₂⟩ := (mem_missing G).mp h
        exact ⟨Or.inr h₁, h₂⟩
    have indep := (split_independent G I T).2 ⟨core, fun s hs t ht e =>
      properties.2 _ _ (member hs).1 (member ht).1 ((layout.fixed s t).1 e),
      fun _ hs => (member hs).2⟩
    simpa only [card_disjSum, T, union_count G I properties.1, Nat.add_assoc]
      using bound (I.disjSum T) indep
  · intro limits S indep
    have parts := (split_independent G S.toLeft S.toRight).1 (by
      rw [toLeft_disjSum_toRight]; exact indep)
    have support : ∀ i ∈ S.toRight.image block, ∀ j ∈ S.toRight.image block,
        ¬ consecutive i j := by
      intro i hi j hj
      obtain ⟨s, hs, rfl⟩ := mem_image.mp hi
      obtain ⟨t, ht, rfl⟩ := mem_image.mp hj
      exact fun edge => parts.2.1 _ hs _ ht ((layout.fixed s t).2 edge)
    obtain ⟨p, hp, contains⟩ := covers _ support
    have sub : S.toRight ⊆ missing G S.toLeft p.1 ∪ missing G S.toLeft p.2 := by
      intro s hs
      rcases contains _ (mem_image_of_mem block hs) with h | h
      · exact mem_union_left _ ((mem_missing G).2 ⟨h, parts.2.2 _ hs⟩)
      · exact mem_union_right _ ((mem_missing G).2 ⟨h, parts.2.2 _ hs⟩)
    have size := card_le_card sub
    rw [union_count G _ (template_ok p hp).1] at size
    have total := limits _ parts.1 p hp
    have split := card_toLeft_add_card_toRight (u := S)
    omega

/-- The indices in one block, regardless of their rows. -/
def indices (i : Block) : Finset Fixed := univ.filter fun s => block s = i

private theorem missing_subset (I : Finset X) (i : Block) :
    missing G I i ⊆ indices i :=
  fun _ hs => mem_filter.mpr ⟨mem_univ _, ((mem_missing G).mp hs).1⟩

private theorem root_count (layout : Layout G) (I : Finset X) (i : Block)
    (hi : i = u ∨ i = w) : (missing G I i).card = 1 := by
  have eq : missing G I i = indices i := by
    apply Subset.antisymm (missing_subset G I i)
    intro s hs
    have tag := (mem_filter.mp hs).2
    exact (mem_missing G).2 ⟨tag, fun x _ => layout.roots x s (tag ▸ hi)⟩
  rw [eq]
  rcases hi with rfl | rfl <;> decide

/-- The abstract disjunction emitted for every k-subset of the seven C indices.
Each positive literal says that a particular core vertex lies in a particular row. -/
def RowClauses (I : Finset X) (k : ℕ) : Prop :=
  ∀ T ⊆ indices C, T.card = k → ∃ s ∈ T, ∃ x ∈ I, G.Adj (.inr s) (.inl x)

theorem rowClauses_iff (I : Finset X) (k : ℕ) :
    RowClauses G I k ↔ (missing G I C).card < k := by
  classical
  constructor
  · intro clauses
    by_contra! h
    obtain ⟨T, sub, size⟩ := exists_subset_card_eq h
    obtain ⟨s, hs, x, hx, edge⟩ :=
      clauses T (sub.trans (missing_subset G I C)) size
    exact ((mem_missing G).mp (sub hs)).2 x hx edge
  · intro small T sub size
    by_contra! none
    have untouched : T ⊆ missing G I C := fun s hs =>
      (mem_missing G).2 ⟨(mem_filter.mp (sub hs)).2, none s hs⟩
    have := card_le_card untouched
    omega

/-- Subset threshold for a proposed independence bound K. -/
noncomputable def threshold (K : ℕ) (I : Finset X) : ℕ :=
  K + 1 - I.card - max (missing G I A).card (missing G I B).card

/-- Exact independence criterion on the graph itself. In addition to the two
root tests and the core bound, the only remaining tests are the row clauses.
The quantifier includes every independent core set, including non-maximal sets. -/
theorem bound_iff_rowClauses (layout : Layout G) (K : ℕ) :
    (∀ S : Finset (X ⊕ Fixed), G.IsIndepSet S → S.card ≤ K) ↔
    ∀ I : Finset X, CoreIndependent G I →
      I.card + 2 ≤ K ∧
      I.card + 1 + (missing G I A).card ≤ K ∧
      I.card + 1 + (missing G I B).card ≤ K ∧
      RowClauses G I (threshold G K I) := by
  rw [bound_iff_templates G layout]
  apply forall_congr'
  intro I
  apply forall_congr'
  intro _
  rw [rowClauses_iff, threshold]
  have hu := root_count G layout I u (Or.inl rfl)
  have hw := root_count G layout I w (Or.inr rfl)
  simp only [templates, mem_insert, mem_singleton]
  constructor
  · intro h
    have ca := h (C,A) (by simp)
    have cb := h (C,B) (by simp)
    have ub := h (u,B) (by simp)
    have wa := h (w,A) (by simp)
    have uw := h (u,w) (by simp)
    dsimp only at ca cb ub wa uw
    omega
  · rintro ⟨core, a, b, c⟩ p (rfl | rfl | rfl | rfl | rfl) <;> dsimp only <;> omega

/-- Every real graph with the independence bound satisfies the row clauses at
any cutoff, in particular 3, 4 and 7. -/
theorem clauses_at_cutoff (layout : Layout G) (K : ℕ)
    (bound : ∀ S : Finset (X ⊕ Fixed), G.IsIndepSet S → S.card ≤ K) (level : ℕ) :
    ∀ I : Finset X, CoreIndependent G I → I.card ≤ level → RowClauses G I (threshold G K I) :=
  fun I hI _ => ((bound_iff_rowClauses G layout K).mp bound I hI).2.2.2

/-- If an independent core set and the two side vertices plus the opposite root would exceed K, a side row hits it. At K=9 this applies to seven-sets. -/
theorem side_hits_seven (layout : Layout G) (K : ℕ)
    (bound : ∀ S : Finset (X ⊕ Fixed), G.IsIndepSet S → S.card ≤ K)
    {I : Finset X} (core : CoreIndependent G I) (large : K < I.card + 3)
    {i : Block} (side : i = A ∨ i = B) :
    ∃ s ∈ indices i, ∃ x ∈ I, G.Adj (.inr s) (.inl x) := by
  classical
  by_contra! none
  have allMissing : indices i = missing G I i := by
    apply Subset.antisymm _ (missing_subset G I i)
    exact fun s hs => (mem_missing G).mpr ⟨(mem_filter.mp hs).2, none s hs⟩
  have bounds := (bound_iff_rowClauses G layout K).mp bound I core
  have miss : (missing G I i).card = 2 := by
    rw [← allMissing]
    rcases side with rfl | rfl <;> decide
  rcases side with rfl | rfl
  · have := bounds.2.1; omega
  · have := bounds.2.2.1; omega

#print axioms bound_iff_templates
#print axioms rowClauses_iff
#print axioms side_hits_seven
#print axioms bound_iff_rowClauses
#print axioms clauses_at_cutoff

end R7Independence
