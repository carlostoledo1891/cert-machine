/-
Copyright 2026 Jonas J. Gebendorfer.
Licensed under the Apache License, Version 2.0.
-/
import FormalConjecturesForMathlib.Combinatorics.SimpleGraph.Domination
import Mathlib.Combinatorics.SimpleGraph.Connectivity.Connected
import Mathlib.Tactic

namespace WOWII395bProof
open SimpleGraph
set_option maxRecDepth 100000
set_option maxHeartbeats 0

def IsTwoDominating {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] (D : Finset V) : Prop :=
  ∀ v ∉ D, 2 ≤ (D.filter fun w => G.Adj v w).card

noncomputable def twoDominationNumber {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : ℕ :=
  sInf {n | ∃ D : Finset V, IsTwoDominating G D ∧ D.card = n}

def degreeFrequency {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] (j : ℕ) : ℕ :=
  (Finset.univ.filter fun v => G.degree v = j).card

def maximumFrequency {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : ℕ :=
  (Finset.range (Fintype.card V + 1)).sup (degreeFrequency G)

def degreeModes {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : Finset ℕ :=
  (Finset.range (Fintype.card V + 1)).filter fun j => degreeFrequency G j = maximumFrequency G

def smallestMode {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : ℕ :=
  WithTop.untopD 0 (degreeModes G).min

def minimumVertices {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : Finset V :=
  Finset.univ.filter fun v => G.degree v = G.minDegree

def remaining {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : Finset V :=
  Finset.univ \ minimumVertices G

def proposedBound {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] : ℕ :=
  degreeFrequency G (smallestMode G) +
    (G.induce (remaining G : Set V)).minDegree +
    (Finset.univ.filter fun v => G.degree v < 3).card

/-- All modal degrees have the same frequency, including the smallest one. -/
theorem frequency_of_mode {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj] {j : ℕ} (hj : j ∈ degreeModes G) :
    degreeFrequency G j = maximumFrequency G := (Finset.mem_filter.mp hj).2

def block (v : Fin 15) : Fin 3 :=
  if v.val < 4 then 0 else if v.val < 9 then 1 else 2

def bridges : Finset (Fin 15 × Fin 15) :=
  {(0,4),(4,9),(5,10),(5,11),(6,9),(6,11),(6,12)}

def witness : SimpleGraph (Fin 15) where
  Adj v w := v ≠ w ∧ (block v = block w ∨ (v,w) ∈ bridges ∨ (w,v) ∈ bridges)
  symm := ⟨by intro v w h; exact ⟨h.1.symm, by rcases h.2 with h|h|h; exact Or.inl h.symm; exact Or.inr (Or.inr h); exact Or.inr (Or.inl h)⟩⟩
  loopless := ⟨fun _ h => h.1 rfl⟩

instance : DecidableRel witness.Adj :=
  inferInstanceAs (DecidableRel fun v w => v ≠ w ∧
    (block v = block w ∨ (v,w) ∈ bridges ∨ (w,v) ∈ bridges))

def parent : Fin 15 → Fin 15 :=
  ![0,0,0,0,0,4,4,4,4,4,9,9,9,9,9]
def height : Fin 15 → ℕ :=
  ![0,1,1,1,1,2,2,2,2,2,3,3,3,3,3]

theorem parent_certificate : ∀ v : Fin 15, v ≠ 0 →
    witness.Adj v (parent v) ∧ height (parent v) < height v := by decide

theorem reaches_root (v : Fin 15) : witness.Reachable v 0 := by
  have aux : ∀ n : ℕ, ∀ v : Fin 15, height v = n → witness.Reachable v 0 := by
    intro n
    induction n using Nat.strong_induction_on with
    | h n ih =>
      intro v hv
      by_cases h0 : v = 0
      · subst v; exact .refl 0
      · obtain ⟨he,hd⟩ := parent_certificate v h0
        exact he.reachable.trans (ih _ (by omega) _ rfl)
  exact aux _ v rfl

theorem witness_connected : witness.Connected :=
  ⟨fun u v => (reaches_root u).trans (reaches_root v).symm⟩

def degreeTable : Fin 15 → ℕ :=
  ![4,3,3,3,6,6,7,4,4,7,6,7,6,5,5]
theorem degree_spec : ∀ v, witness.degree v = degreeTable v := by decide

theorem maximum_frequency : maximumFrequency witness = 4 := by
  unfold maximumFrequency degreeFrequency
  simp_rw [degree_spec]
  decide

theorem modes : degreeModes witness = {6} := by
  unfold degreeModes
  rw [maximum_frequency]
  unfold degreeFrequency
  simp_rw [degree_spec]
  decide

theorem minimum_degree : witness.minDegree = 3 := by decide

theorem remaining_eq : remaining witness = {0,4,5,6,7,8,9,10,11,12,13,14} := by
  unfold remaining minimumVertices
  rw [minimum_degree]
  simp_rw [degree_spec]
  decide

theorem induced_minimum_degree : (witness.induce (remaining witness : Set (Fin 15))).minDegree = 1 := by
  rw [remaining_eq]
  decide

theorem bound_eq : proposedBound witness = 5 := by
  unfold proposedBound smallestMode
  rw [modes, induced_minimum_degree]
  norm_num
  unfold degreeFrequency
  simp_rw [degree_spec]
  decide

def privateP : Fin 3 → Fin 15 := ![2,7,13]
def privateQ : Fin 3 → Fin 15 := ![3,8,14]

theorem private_certificate : ∀ i : Fin 3,
    block (privateP i) = i ∧ block (privateQ i) = i ∧ privateP i ≠ privateQ i ∧
    (∀ v, witness.Adj (privateP i) v → block v = i) ∧
    (∀ v, witness.Adj (privateQ i) v → block v = i) := by decide

theorem two_per_block (D : Finset (Fin 15)) (hD : IsTwoDominating witness D) (i : Fin 3) :
    2 ≤ (D.filter fun v => block v = i).card := by
  obtain ⟨hp,hq,hne,hpn,hqn⟩ := private_certificate i
  by_cases hP : privateP i ∈ D
  · by_cases hQ : privateQ i ∈ D
    · have hsub : {privateP i,privateQ i} ⊆ D.filter (fun v => block v = i) := by
        intro v hv
        simp only [Finset.mem_insert, Finset.mem_singleton] at hv
        rcases hv with rfl|rfl <;> exact Finset.mem_filter.mpr ⟨by assumption,by assumption⟩
      have hc : ({privateP i,privateQ i} : Finset (Fin 15)).card = 2 := by simp [hne]
      simpa [hc] using Finset.card_le_card hsub
    · have hd := hD (privateQ i) hQ
      have hs : D.filter (fun v => witness.Adj (privateQ i) v) ⊆
          D.filter (fun v => block v = i) := by
        intro v hv
        obtain ⟨hv,ha⟩ := Finset.mem_filter.mp hv
        exact Finset.mem_filter.mpr ⟨hv,hqn v ha⟩
      exact hd.trans (Finset.card_le_card hs)
  · have hd := hD (privateP i) hP
    have hs : D.filter (fun v => witness.Adj (privateP i) v) ⊆
        D.filter (fun v => block v = i) := by
      intro v hv
      obtain ⟨hv,ha⟩ := Finset.mem_filter.mp hv
      exact Finset.mem_filter.mpr ⟨hv,hpn v ha⟩
    exact hd.trans (Finset.card_le_card hs)

theorem selected_lower (D : Finset (Fin 15)) (hD : IsTwoDominating witness D) : 6 ≤ D.card := by
  have hs : D.card = ∑ i : Fin 3, (D.filter fun v => block v = i).card :=
    Finset.card_eq_sum_card_fiberwise (fun _ _ => Finset.mem_univ _)
  rw [hs]
  calc
    6 = ∑ _i : Fin 3, 2 := by decide
    _ ≤ _ := Finset.sum_le_sum fun i _ => two_per_block D hD i

theorem total_lower : 6 ≤ twoDominationNumber witness := by
  have hne : {n | ∃ D : Finset (Fin 15), IsTwoDominating witness D ∧ D.card = n}.Nonempty := by
    refine ⟨15, Finset.univ, ?_, by decide⟩
    intro v hv; exact False.elim (hv (Finset.mem_univ _))
  obtain ⟨D,hD,hc⟩ := Nat.sInf_mem hne
  simpa [twoDominationNumber, hc] using selected_lower D hD

def selected : Finset (Fin 15) := {0,1,4,5,9,10}

theorem selected_certificate : IsTwoDominating witness selected ∧ selected.card = 6 := by
  constructor
  · change ∀ v ∉ selected, 2 ≤ (selected.filter fun w => witness.Adj v w).card
    decide
  · decide

theorem two_domination_eq : twoDominationNumber witness = 6 := by
  apply Nat.le_antisymm _ total_lower
  exact Nat.sInf_le ⟨selected, selected_certificate⟩

theorem counterexample : witness.Connected ∧ 2 < Fintype.card (Fin 15) ∧
    proposedBound witness < twoDominationNumber witness := by
  refine ⟨witness_connected, by decide, ?_⟩
  rw [bound_eq]
  exact lt_of_lt_of_le (by decide : 5 < 6) total_lower

theorem conjecture395b : ¬ ∀ (V : Type) [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj], G.Connected → 2 < Fintype.card V →
      (remaining G).Nonempty → twoDominationNumber G ≤ proposedBound G := by
  intro h
  exact (not_le_of_gt counterexample.2.2) (h (Fin 15) witness witness_connected (by decide) (by rw [remaining_eq]; decide))

#print axioms conjecture395b
end WOWII395bProof
