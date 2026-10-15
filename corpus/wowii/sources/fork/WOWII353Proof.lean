/-
Copyright 2026 Jonas J. Gebendorfer.
Licensed under the Apache License, Version 2.0.
-/
import FormalConjecturesForMathlib.Combinatorics.SimpleGraph.Domination
import Mathlib.Combinatorics.SimpleGraph.Acyclic
import Mathlib.Combinatorics.SimpleGraph.Connectivity.Subgraph
import Mathlib.Tactic

namespace WOWII353Proof
open SimpleGraph
set_option maxRecDepth 100000
set_option maxHeartbeats 0

/-- Largest component order, measured in vertices. -/
noncomputable def largestComponentOrder {V : Type*} [Fintype V] (G : SimpleGraph V) : ℕ :=
  Finset.univ.sup fun v => Nat.card (G.connectedComponentMk v).supp

def parent : Fin 25 → Fin 25 :=
  ![0, 0, 1, 1, 3, 0, 5, 6, 6, 8, 0, 10, 11, 11, 13,
    2, 15, 16, 16, 18, 2, 20, 21, 21, 23]

def witness : SimpleGraph (Fin 25) where
  Adj v w := v ≠ w ∧ (parent v = w ∨ parent w = v)
  symm := ⟨fun _ _ h => ⟨h.1.symm, h.2.symm⟩⟩
  loopless := ⟨fun _ h => h.1 rfl⟩

instance : DecidableRel witness.Adj :=
  inferInstanceAs (DecidableRel fun v w => v ≠ w ∧ (parent v = w ∨ parent w = v))

theorem parent_decreases : ∀ v : Fin 25, v ≠ 0 → (parent v).val < v.val := by decide

theorem reaches_root (v : Fin 25) : witness.Reachable v 0 := by
  have aux : ∀ n : ℕ, ∀ v : Fin 25, v.val = n → witness.Reachable v 0 := by
    intro n
    induction n using Nat.strong_induction_on with
    | h n ih =>
      intro v hv
      by_cases h0 : v = 0
      · subst v; exact .refl 0
      · have hp := parent_decreases v h0
        have he : witness.Adj v (parent v) := ⟨by intro e; have := congrArg Fin.val e; omega, Or.inl rfl⟩
        exact he.reachable.trans (ih (parent v).val (by omega) (parent v) rfl)
  exact aux v.val v rfl

theorem witness_connected : witness.Connected :=
  ⟨fun u v => (reaches_root u).trans (reaches_root v).symm⟩

theorem edge_count : witness.edgeFinset.card = 24 := by decide

theorem witness_tree : witness.IsTree := by
  apply SimpleGraph.isTree_iff_connected_and_card.mpr
  refine ⟨witness_connected, ?_⟩
  rw [Nat.card_eq_fintype_card, ← SimpleGraph.edgeFinset_card, edge_count,
    Nat.card_eq_fintype_card]
  decide

def selected : Finset (Fin 25) := {1, 3, 6, 8, 11, 13, 16, 18, 21, 23}

theorem selected_total : witness.IsTotalDominating (selected : Set (Fin 25)) := by
  change ∀ v : Fin 25, ∃ w ∈ selected, witness.Adj v w
  decide

theorem selected_card : selected.card = 10 := by decide

theorem total_bound : witness.totalDominationNumber ≤ 10 := by
  exact Nat.sInf_le ⟨selected, selected_total, selected_card⟩

def degreeTwo : Finset (Fin 25) := {3, 5, 8, 10, 13, 15, 18, 20, 23}

theorem degree_two_spec : ∀ v : Fin 25, witness.degree v = 2 ↔ v ∈ degreeTwo := by decide
theorem max_degree : witness.maxDegree = 3 := by decide
theorem degree_two_independent : ∀ u ∈ degreeTwo, ∀ v ∈ degreeTwo, ¬ witness.Adj u v := by decide

theorem degree_two_bot : witness.induce {v | witness.degree v = 2} = ⊥ := by
  ext u v
  simp only [SimpleGraph.induce_adj, SimpleGraph.bot_adj, iff_false]
  exact degree_two_independent u ((degree_two_spec u).mp u.property)
    v ((degree_two_spec v).mp v.property)

theorem degree_two_component_count :
    Nat.card (witness.induce {v | witness.degree v = 2}).ConnectedComponent = 9 := by
  rw [degree_two_bot]
  let f : {v : Fin 25 // witness.degree v = 2} →
      (⊥ : SimpleGraph {v : Fin 25 // witness.degree v = 2}).ConnectedComponent :=
    SimpleGraph.connectedComponentMk _
  have hf : Function.Bijective f := by
    constructor
    · intro u v h
      exact SimpleGraph.reachable_bot.mp (SimpleGraph.ConnectedComponent.exact h)
    · intro C
      exact Quot.exists_rep C
  rw [← Nat.card_congr (Equiv.ofBijective f hf)]
  have hset : {v : Fin 25 | witness.degree v = 2} = (degreeTwo : Set (Fin 25)) := by
    ext v; exact degree_two_spec v
  change Nat.card ↥({v : Fin 25 | witness.degree v = 2}) = 9
  rw [hset]
  simp only [Nat.card_eq_fintype_card]
  decide

abbrev MaxVertex := {v : Fin 25 // witness.degree v = witness.maxDegree}
abbrev maxGraph := witness.induce {v | witness.degree v = witness.maxDegree}

def a : MaxVertex := ⟨0, by decide⟩
def b : MaxVertex := ⟨1, by decide⟩
def c : MaxVertex := ⟨2, by decide⟩

theorem large_component : 3 ≤ largestComponentOrder maxGraph := by
  classical
  let C := maxGraph.connectedComponentMk a
  have ha : a ∈ C.supp := rfl
  have hb : b ∈ C.supp := C.mem_supp_of_adj_mem_supp ha (by decide)
  have hc : c ∈ C.supp := C.mem_supp_of_adj_mem_supp hb (by decide)
  let s : Finset MaxVertex := {a,b,c}
  have hcard : s.card = 3 := by decide
  have hsub : (s : Set MaxVertex) ⊆ C.supp := by
    intro v hv
    simp only [s, Finset.mem_coe, Finset.mem_insert, Finset.mem_singleton] at hv
    rcases hv with rfl | rfl | rfl <;> assumption
  have hle : s.card ≤ Nat.card C.supp := by
    have haux := Nat.card_le_card_of_injective
      (f := fun v : (s : Set MaxVertex) => (⟨v.val, hsub v.property⟩ : C.supp))
      (by
        intro u v h
        apply Subtype.ext
        exact congrArg (fun z : C.supp => z.val) h)
    simpa only [Nat.card_coe_set_eq, Set.ncard_coe_finset] using haux
  have hs : Nat.card C.supp ≤ largestComponentOrder maxGraph :=
    Finset.le_sup (f := fun v => Nat.card (maxGraph.connectedComponentMk v).supp)
      (Finset.mem_univ a)
  omega

theorem counterexample : witness.IsTree ∧ 2 < Fintype.card (Fin 25) ∧
    (witness.totalDominationNumber : ℚ) <
      Nat.card (witness.induce {v | witness.degree v = 2}).ConnectedComponent +
        (largestComponentOrder maxGraph : ℚ) / 2 := by
  refine ⟨witness_tree, by decide, ?_⟩
  rw [degree_two_component_count]
  have ht : (witness.totalDominationNumber : ℚ) ≤ 10 := by exact_mod_cast total_bound
  have hk : (3 : ℚ) ≤ largestComponentOrder maxGraph := by exact_mod_cast large_component
  norm_num only [Nat.cast_ofNat]
  linarith

#print axioms counterexample

/-- The negation of the full original universal statement; a single finite witness suffices. -/
theorem conjecture353 : ¬ ∀ (V : Type) [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj], G.IsTree → 2 < Fintype.card V →
    (Nat.card (G.induce {v | G.degree v = 2}).ConnectedComponent : ℚ) +
      (largestComponentOrder (G.induce {v | G.degree v = G.maxDegree}) : ℚ) / 2 ≤
        G.totalDominationNumber := by
  intro h
  exact (not_le_of_gt counterexample.2.2)
    (h (Fin 25) witness witness_tree (by decide))

#print axioms conjecture353
end WOWII353Proof
