/-
Copyright 2026 Jonas J. Gebendorfer.
Licensed under the Apache License, Version 2.0.
-/
import FormalConjecturesForMathlib.Combinatorics.SimpleGraph.Domination
import Mathlib.Combinatorics.SimpleGraph.Acyclic
import Mathlib.Combinatorics.SimpleGraph.Metric
import Mathlib.Tactic

namespace WOWII360Proof
open SimpleGraph
set_option maxRecDepth 100000
set_option maxHeartbeats 0

def parent (v : Fin 41) : Fin 41 :=
  if v.val < 10 then ⟨v.val-1, by omega⟩
  else if v.val = 10 then 3 else if v.val = 11 then 6 else 1

def witness : SimpleGraph (Fin 41) where
  Adj v w := v ≠ w ∧ (parent v = w ∨ parent w = v)
  symm := ⟨fun _ _ h => ⟨h.1.symm,h.2.symm⟩⟩
  loopless := ⟨fun _ h => h.1 rfl⟩
instance : DecidableRel witness.Adj :=
  inferInstanceAs (DecidableRel fun v w => v ≠ w ∧ (parent v = w ∨ parent w = v))

def position (v : Fin 41) : ℕ :=
  if v.val < 10 then v.val else if v.val = 10 then 3 else if v.val = 11 then 6 else 1
def offset (v : Fin 41) : ℕ := if v.val < 10 then 0 else 1
def delta (u v : Fin 41) : ℕ :=
  if u = v then 0 else offset u + (position u - position v) +
    (position v - position u) + offset v

theorem delta_zero : ∀ u v : Fin 41, delta u v = 0 ↔ u = v := by decide
theorem delta_step : ∀ u v : Fin 41, u ≠ v →
    ∃ w, witness.Adj v w ∧ delta u w + 1 = delta u v := by decide
theorem parent_lipschitz : ∀ u v : Fin 41,
    delta u v ≤ delta u (parent v) + 1 ∧ delta u (parent v) ≤ delta u v + 1 := by decide
theorem delta_lipschitz (u v w : Fin 41) (h : witness.Adj v w) :
    delta u v ≤ delta u w + 1 := by
  rcases h.2 with he | he
  · simpa only [he] using (parent_lipschitz u v).1
  · simpa only [he] using (parent_lipschitz u w).2

/-- A decreasing distance label constructs a walk of exactly the claimed length. -/
theorem walk_certificate (u v : Fin 41) : ∃ p : witness.Walk v u, p.length = delta u v := by
  have aux : ∀ n : ℕ, ∀ v : Fin 41, delta u v = n →
      ∃ p : witness.Walk v u, p.length = delta u v := by
    intro n
    induction n using Nat.strong_induction_on with
    | h n ih =>
      intro v hv
      by_cases he : u = v
      · subst v
        exact ⟨.nil, (delta_zero u u).mpr rfl |>.symm⟩
      · obtain ⟨w,ha,hd⟩ := delta_step u v he
        obtain ⟨p,hp⟩ := ih (delta u w) (by omega) w rfl
        exact ⟨.cons ha p, by simp only [Walk.length_cons,hp]; omega⟩
  exact aux _ v rfl

theorem witness_connected : witness.Connected :=
  ⟨fun u v => (walk_certificate v u).elim fun p _ => p.reachable⟩

/-- The edge Lipschitz certificate bounds the label by every walk length. -/
theorem delta_le_length (u : Fin 41) {v w : Fin 41} (p : witness.Walk v w) :
    delta u v ≤ p.length + delta u w := by
  induction p with
  | nil => simp
  | @cons v w z ha p ih =>
    have hh := delta_lipschitz u v w ha
    simp only [Walk.length_cons]
    omega

theorem dist_eq_delta (u v : Fin 41) : witness.dist u v = delta u v := by
  apply Nat.le_antisymm
  · obtain ⟨p,hp⟩ := walk_certificate u v
    have h := SimpleGraph.dist_le p.reverse
    simpa only [Walk.length_reverse,hp] using h
  · obtain ⟨p,hp⟩ := witness_connected.exists_walk_length_eq_dist v u
    have h := delta_le_length u p
    rw [hp, witness.dist_comm] at h
    simpa only [(delta_zero u u).mpr rfl, Nat.add_zero] using h

theorem witness_tree : witness.IsTree := by
  apply SimpleGraph.isTree_iff_connected_and_card.mpr
  refine ⟨witness_connected, ?_⟩
  have he : witness.edgeFinset.card = 40 := by decide
  rw [Nat.card_eq_fintype_card, ← SimpleGraph.edgeFinset_card, he,
    Nat.card_eq_fintype_card]
  decide

def selected : Finset (Fin 41) := {1,2,3,6,7,8}
theorem selected_total : witness.IsTotalDominating (selected : Set (Fin 41)) := by
  change ∀ v : Fin 41, ∃ w ∈ selected, witness.Adj v w
  decide
theorem total_bound : witness.totalDominationNumber ≤ 6 := by
  exact Nat.sInf_le ⟨selected,selected_total,by decide⟩

noncomputable def centers {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) : Finset V := by
  classical
  exact Finset.univ.filter fun v => ∀ w,
    Finset.univ.sup (fun x => G.dist v x) ≤ Finset.univ.sup (fun x => G.dist w x)

noncomputable def positiveCenterAverage {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) : ℚ :=
  (∑ u ∈ centers G, ∑ v : V, G.dist u v : ℕ) /
    (((centers G).card * (Fintype.card V - 1) : ℕ) : ℚ)

def leafSupportVertices {V : Type*} [Fintype V] (G : SimpleGraph V)
    [DecidableRel G.Adj] : Set V :=
  {v | G.degree v = 1 ∨ ∃ w, G.degree w = 1 ∧ G.Adj v w}

def eccentricityTable : Fin 41 → ℕ :=
  ![9,8,7,6,5,5,6,7,8,9,7,7,9,9,9,9,9,9,9,9,9,
    9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]
theorem eccentricity_spec : ∀ v : Fin 41,
    Finset.univ.sup (fun w => delta v w) = eccentricityTable v := by decide

theorem center_spec : centers witness = {4,5} := by
  classical
  unfold centers
  simp_rw [dist_eq_delta,eccentricity_spec]
  decide

theorem average_eq : positiveCenterAverage witness = 321 / 80 := by
  unfold positiveCenterAverage
  rw [center_spec]
  simp_rw [dist_eq_delta]
  have hn : (∑ u ∈ ({4,5} : Finset (Fin 41)), ∑ v : Fin 41, delta u v) = 321 := by decide
  rw [hn]
  have hc : ({4,5} : Finset (Fin 41)).card = 2 := by decide
  rw [hc]
  norm_num

def active : Finset (Fin 41) := Finset.univ.filter fun v => v ≠ 2 ∧ v ≠ 4 ∧ v ≠ 5 ∧ v ≠ 7
theorem active_spec : ∀ v : Fin 41, v ∈ leafSupportVertices witness ↔ v ∈ active := by
  change ∀ v : Fin 41,
    (witness.degree v = 1 ∨ ∃ w, witness.degree w = 1 ∧ witness.Adj v w) ↔ v ∈ active
  decide

abbrev supportGraph := witness.induce (leafSupportVertices witness)
def componentLabel (v : Fin 41) : Fin 4 :=
  if v.val = 3 ∨ v.val = 10 then 1 else if v.val = 6 ∨ v.val = 11 then 2
  else if v.val = 8 ∨ v.val = 9 then 3 else 0

theorem label_constant : ∀ u ∈ active, ∀ v ∈ active,
    witness.Adj u v → componentLabel u = componentLabel v := by decide

theorem reachable_label {u v : leafSupportVertices witness} (h : supportGraph.Reachable u v) :
    componentLabel u.val = componentLabel v.val := by
  obtain ⟨p⟩ := h
  induction p with
  | nil => rfl
  | @cons u v w ha p ih =>
    exact (label_constant u ((active_spec u).mp u.property)
      v ((active_spec v).mp v.property) ha).trans ih

def representative (i : Fin 4) : leafSupportVertices witness :=
  ⟨(![1,3,6,8] : Fin 4 → Fin 41) i, by
    have h : ∀ j : Fin 4, (![1,3,6,8] : Fin 4 → Fin 41) j ∈ active := by decide
    exact (active_spec _).mpr (h i)⟩

theorem component_lower : 4 ≤ Nat.card supportGraph.ConnectedComponent := by
  let f : Fin 4 → supportGraph.ConnectedComponent := fun i =>
    supportGraph.connectedComponentMk (representative i)
  have hf : Function.Injective f := by
    intro i j hij
    have hh := reachable_label (SimpleGraph.ConnectedComponent.exact hij)
    have lab : ∀ i : Fin 4, componentLabel (representative i).val = i := by decide
    simpa only [lab] using hh
  simpa only [Nat.card_fin] using Nat.card_le_card_of_injective f hf

theorem counterexample : witness.IsTree ∧ 2 < Fintype.card (Fin 41) ∧
    (witness.totalDominationNumber : ℚ) <
      Nat.card supportGraph.ConnectedComponent + positiveCenterAverage witness / 2 := by
  refine ⟨witness_tree, by decide, ?_⟩
  rw [average_eq]
  have ht : (witness.totalDominationNumber : ℚ) ≤ 6 := by exact_mod_cast total_bound
  have hc : (4 : ℚ) ≤ Nat.card supportGraph.ConnectedComponent := by exact_mod_cast component_lower
  linarith

theorem conjecture360 : ¬ ∀ (V : Type) [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj], G.IsTree → 2 < Fintype.card V →
      (Nat.card (G.induce (leafSupportVertices G)).ConnectedComponent : ℚ) +
        positiveCenterAverage G / 2 ≤ G.totalDominationNumber := by
  intro h
  exact (not_le_of_gt counterexample.2.2) (h (Fin 41) witness witness_tree (by decide))

#print axioms dist_eq_delta
#print axioms witness_tree
#print axioms conjecture360
end WOWII360Proof
