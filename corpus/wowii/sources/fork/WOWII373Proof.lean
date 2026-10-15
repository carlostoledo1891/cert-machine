/-
Copyright 2026 Jonas J. Gebendorfer.
Licensed under the Apache License, Version 2.0.
-/
import FormalConjecturesForMathlib.Combinatorics.SimpleGraph.Domination
import Mathlib.Combinatorics.SimpleGraph.Acyclic
import Mathlib.Combinatorics.SimpleGraph.Metric
import Mathlib.Tactic

namespace WOWII373Proof
open SimpleGraph
set_option maxRecDepth 100000
set_option maxHeartbeats 0

def parent (v : Fin 150) : Fin 150 :=
  if v.val < 22 then ⟨v.val-1, by omega⟩
  else if v.val < 32 then 0 else if v.val = 32 then 21 else 20

def witness : SimpleGraph (Fin 150) where
  Adj v w := v ≠ w ∧ (parent v = w ∨ parent w = v)
  symm := ⟨fun _ _ h => ⟨h.1.symm,h.2.symm⟩⟩
  loopless := ⟨fun _ h => h.1 rfl⟩
instance : DecidableRel witness.Adj :=
  inferInstanceAs (DecidableRel fun v w => v ≠ w ∧ (parent v = w ∨ parent w = v))

def position (v : Fin 150) : ℕ :=
  if v.val < 22 then v.val else if v.val < 32 then 0 else if v.val = 32 then 21 else 20
def offset (v : Fin 150) : ℕ := if v.val < 22 then 0 else 1
def delta (u v : Fin 150) : ℕ :=
  if u = v then 0 else offset u + (position u - position v) +
    (position v - position u) + offset v

theorem delta_zero : ∀ u v : Fin 150, delta u v = 0 ↔ u = v := by
  intro u v
  constructor
  · intro hz
    by_contra huv
    rw [delta,if_neg huv] at hz
    have hu0 : offset u = 0 := by omega
    have hv0 : offset v = 0 := by omega
    have hu : u.val < 22 := by by_contra h; simp [offset,h] at hu0
    have hv : v.val < 22 := by by_contra h; simp [offset,h] at hv0
    simp [position,hu,hv,hu0,hv0] at hz
    exact huv (Fin.ext (by omega))
  · intro h
    simp [delta,h]

theorem position_bound (v : Fin 150) : position v ≤ 21 := by
  simp only [position]
  split_ifs <;> omega

theorem parent_leaf_val (v : Fin 150) (hv : 22 ≤ v.val) :
    (parent v).val = position v ∧ (parent v).val < 22 := by
  simp only [parent,position,show ¬v.val < 22 by omega,if_false]
  split_ifs <;> decide

theorem delta_to_path (u v : Fin 150) (hv : v.val < 22) :
    delta u v = offset u + (position u-v.val) + (v.val-position u) := by
  by_cases h : u = v
  · subst u
    simp [delta,position,offset,hv]
  · simp [delta,h,position,offset,hv]

theorem delta_step : ∀ u v : Fin 150, u ≠ v →
    ∃ w, witness.Adj v w ∧ delta u w + 1 = delta u v := by
  intro u v huv
  by_cases hv : 22 ≤ v.val
  · have hp := parent_leaf_val v hv
    refine ⟨parent v, ?_, ?_⟩
    · change v ≠ parent v ∧ (parent v = parent v ∨ parent (parent v) = v)
      refine ⟨?_, Or.inl rfl⟩
      intro he
      have hh := congrArg Fin.val he
      omega
    · rw [delta_to_path u (parent v) hp.2, hp.1,delta,if_neg huv]
      simp [offset,show ¬v.val < 22 by omega]
  · have hv' : v.val < 22 := by omega
    by_cases hp : position u = v.val
    · have hu : 22 ≤ u.val := by
        by_contra h
        have hu' : u.val < 22 := by omega
        have he : u.val = v.val := by simpa [position,hu'] using hp
        exact huv (Fin.ext he)
      refine ⟨u, ?_, ?_⟩
      · change v ≠ u ∧ (parent v = u ∨ parent u = v)
        refine ⟨huv.symm, Or.inr ?_⟩
        apply Fin.ext
        exact (parent_leaf_val u hu).1.trans hp
      · rw [delta_to_path u v hv']
        simp [delta,hp,offset,show ¬u.val < 22 by omega]
    · by_cases hlt : position u < v.val
      · let w : Fin 150 := ⟨v.val-1,by omega⟩
        have hw : w.val = v.val-1 := rfl
        have hw' : w.val < 22 := by omega
        refine ⟨w, ?_, ?_⟩
        · change v ≠ w ∧ (parent v = w ∨ parent w = v)
          refine ⟨?_, Or.inl ?_⟩
          · intro he; have hh := congrArg Fin.val he; omega
          · apply Fin.ext; simp [parent,hv',hw]
        · rw [delta_to_path u v hv',delta_to_path u w hw',hw]
          omega
      · let w : Fin 150 := ⟨v.val+1,by have := position_bound u; omega⟩
        have hw : w.val = v.val+1 := rfl
        have hw' : w.val < 22 := by have := position_bound u; omega
        refine ⟨w, ?_, ?_⟩
        · change v ≠ w ∧ (parent v = w ∨ parent w = v)
          refine ⟨?_, Or.inr ?_⟩
          · intro he; have hh := congrArg Fin.val he; omega
          · apply Fin.ext
            have hw'' : v.val+1 < 22 := by omega
            simp [parent,hw,hw'']
        · rw [delta_to_path u v hv',delta_to_path u w hw',hw]
          omega

theorem parent_lipschitz : ∀ u v : Fin 150,
    delta u v ≤ delta u (parent v) + 1 ∧ delta u (parent v) ≤ delta u v + 1 := by
  intro u v
  simp only [delta, parent, position, offset]
  split_ifs <;> simp_all <;> omega
theorem delta_lipschitz (u v w : Fin 150) (h : witness.Adj v w) :
    delta u v ≤ delta u w + 1 := by
  rcases h.2 with he | he
  · simpa only [he] using (parent_lipschitz u v).1
  · simpa only [he] using (parent_lipschitz u w).2

/-- A decreasing distance label constructs a walk of exactly the claimed length. -/
theorem walk_certificate (u v : Fin 150) : ∃ p : witness.Walk v u, p.length = delta u v := by
  have aux : ∀ n : ℕ, ∀ v : Fin 150, delta u v = n →
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
theorem delta_le_length (u : Fin 150) {v w : Fin 150} (p : witness.Walk v w) :
    delta u v ≤ p.length + delta u w := by
  induction p with
  | nil => simp
  | @cons v w z ha p ih =>
    have hh := delta_lipschitz u v w ha
    simp only [Walk.length_cons]
    omega

theorem dist_eq_delta (u v : Fin 150) : witness.dist u v = delta u v := by
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
  have he : witness.edgeFinset.card = 149 := by decide
  rw [Nat.card_eq_fintype_card, ← SimpleGraph.edgeFinset_card, he,
    Nat.card_eq_fintype_card]
  decide

def selected : Finset (Fin 150) := {0,1,4,5,8,9,12,13,16,17,20,21}
theorem selected_total : witness.IsTotalDominating (selected : Set (Fin 150)) := by
  change ∀ v : Fin 150, ∃ w ∈ selected, witness.Adj v w
  decide
theorem total_bound : witness.totalDominationNumber ≤ 12 := by
  exact Nat.sInf_le ⟨selected,selected_total,by decide⟩

noncomputable def periphery {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) : Finset V := by
  classical
  exact Finset.univ.filter fun v => ∀ w,
    Finset.univ.sup (fun x => G.dist w x) ≤ Finset.univ.sup (fun x => G.dist v x)

noncomputable def positivePeripheralAverage {V : Type*} [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) : ℚ :=
  (∑ u ∈ periphery G, ∑ v : V, G.dist u v : ℕ) /
    (((periphery G).card * (Fintype.card V - 1) : ℕ) : ℚ)

def eccentricityTable (v : Fin 150) : ℕ :=
  offset v + max (position v + 1) (22 - position v)
theorem eccentricity_spec : ∀ v : Fin 150,
    Finset.univ.sup (fun w => delta v w) = eccentricityTable v := by
  intro v
  apply Nat.le_antisymm
  · apply Finset.sup_le
    intro w _
    simp only [delta, eccentricityTable, position, offset]
    split_ifs <;> omega
  · by_cases h : 22-position v ≤ position v+1
    · have hh : eccentricityTable v ≤ delta v 22 := by
        simp only [delta, eccentricityTable, position, offset] at *
        split_ifs at * <;> omega
      exact le_trans hh (Finset.le_sup (f := fun w => delta v w) (Finset.mem_univ 22))
    · have hh : eccentricityTable v ≤ delta v 32 := by
        simp only [delta, eccentricityTable, position, offset] at *
        split_ifs at * <;> omega
      exact le_trans hh (Finset.le_sup (f := fun w => delta v w) (Finset.mem_univ 32))

def peripheralVertices : Finset (Fin 150) := Finset.univ.filter fun v => 22 ≤ v.val ∧ v.val ≤ 32
theorem periphery_spec : periphery witness = peripheralVertices := by
  classical
  unfold periphery
  simp_rw [dist_eq_delta,eccentricity_spec]
  decide

theorem average_eq : positivePeripheralAverage witness = 29514 / 1639 := by
  unfold positivePeripheralAverage
  rw [periphery_spec]
  simp_rw [dist_eq_delta]
  have hn : (∑ u ∈ peripheralVertices, ∑ v : Fin 150, delta u v) = 29514 := by decide
  rw [hn]
  have hc : peripheralVertices.card = 11 := by decide
  rw [hc]
  norm_num

theorem counterexample : witness.IsTree ∧ 2 < Fintype.card (Fin 150) ∧
    (witness.totalDominationNumber : ℚ) < (2 / 3 : ℚ) * positivePeripheralAverage witness := by
  refine ⟨witness_tree, by decide, ?_⟩
  rw [average_eq]
  have ht : (witness.totalDominationNumber : ℚ) ≤ 12 := by exact_mod_cast total_bound
  linarith

theorem conjecture373 : ¬ ∀ (V : Type) [Fintype V] [DecidableEq V]
    (G : SimpleGraph V) [DecidableRel G.Adj], G.IsTree → 2 < Fintype.card V →
      (2 / 3 : ℚ) * positivePeripheralAverage G ≤ G.totalDominationNumber := by
  intro h
  exact (not_le_of_gt counterexample.2.2) (h (Fin 150) witness witness_tree (by decide))

#print axioms dist_eq_delta
#print axioms witness_tree
#print axioms conjecture373
end WOWII373Proof
