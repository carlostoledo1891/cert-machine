/-
Copyright (c) 2026 Google LLC. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
-/
module

public import Cryptids.Semantics.Riemann120.Backend

/-!
# Riemann104

104-state Turing machine halting-equivalent to the 120-state Riemann machine.
-/

@[expose] public section

set_option linter.style.setOption false
set_option maxRecDepth 200000

namespace ConjectureMachines.Riemann104

open Turing (Dir)
open StateTransition

/-- 120-state Riemann Hypothesis reference machine (`riemann_120`, Shunia 2026). -/
abbrev reference : BundledMachine 2 := Machines.riemann120.bundle

/-- 104-state Riemann Hypothesis candidate machine (`riemann_104`). -/
abbrev candidate : BundledMachine 2 := Machines.riemann104.bundle

/-- Alias for `Machines.riemann120`. -/
abbrev refM : Machine 120 2 := Machines.riemann120

/-- Alias for `Machines.riemann104`. -/
abbrev candM : Machine 104 2 := Machines.riemann104

theorem candidate_fewer_states : candidate.states < reference.states := by
  decide


section
open Turing (Dir)
open StateTransition ConjectureMachines
open ConjectureMachines.Riemann120
open ConjectureMachines.Riemann120.Layer2

def embed104To121 (q : Fin 104) : Fin 121 :=
  if q.val < 1 then ⟨11, by omega⟩
  else if q.val < 2 then ⟨q.val + 3, by omega⟩
  else if q.val < 7 then ⟨q.val + 4, by omega⟩
  else if q.val < 17 then ⟨q.val + 5, by omega⟩
  else if q.val < 19 then ⟨q.val + 6, by omega⟩
  else if q.val < 20 then ⟨q.val + 8, by omega⟩
  else if q.val < 28 then ⟨q.val + 9, by omega⟩
  else if q.val < 75 then ⟨q.val + 10, by omega⟩
  else if q.val < 79 then ⟨q.val + 11, by omega⟩
  else if q.val < 83 then ⟨q.val + 13, by omega⟩
  else if q.val < 92 then ⟨q.val + 15, by omega⟩
  else if q.val < 96 then ⟨q.val + 16, by omega⟩
  else ⟨q.val + 17, by omega⟩

def embedCfg (c : Cfg 104 2) : Cfg 121 2 :=
  ⟨embed104To121 c.state, c.tape⟩

set_option maxHeartbeats 400000 in
-- Finite state-table decision procedure.
theorem embed_transition_eq (q : Fin 104) (a : Fin 2) :
    edited121.transition (embed104To121 q) a =
      (candM.transition q a).map fun t => (t.1, t.2.1, embed104To121 t.2.2) := by
  revert q a; decide

theorem embedCfg_step (c : Cfg 104 2) :
    Option.map embedCfg (step candM c) = step edited121 (embedCfg c) := by
  obtain ⟨q, t⟩ := c
  dsimp only [step, embedCfg]
  rw [embed_transition_eq q t.head, Option.map_map, Option.map_map]
  rfl

theorem halts_candidate_iff_halts_edited121 :
    Halts candidate ↔ (StateTransition.eval (step edited121) ⟨11, default⟩).Dom := by
  have hrel : Respects (step candM) (step edited121)
      (fun c₁ c₂ => c₂ = embedCfg c₁) := by
    intro c₁ c₂ hc₂
    subst hc₂
    have hst := embedCfg_step c₁
    rcases hs : step candM c₁ with _ | c₁'
    · dsimp only
      rw [hs] at hst; simp only [Option.map_none] at hst; exact hst.symm
    · dsimp only
      rw [hs] at hst; simp only [Option.map_some] at hst
      exact ⟨embedCfg c₁', rfl, Relation.TransGen.single hst.symm⟩
  exact (tr_eval_dom' hrel rfl).symm


def inCompare (bits : List (Fin 2)) : Bool :=
  bits == [1, 1, 1, 1, 1] ||
  bits == [1, 1, 1, 1, 1, 0, 1] ||
  bits == [1, 1, 1, 1, 1, 0, 1, 0, 1] ||
  bits == [1, 1, 1, 1, 1, 0, 1, 1]

def inCompareStepOk (bits : List (Fin 2)) : Bool :=
  match evalStackOf false bits with
  | .halt => true
  | .jump s' => if inCompare s' then inCompare bits else true
  | .inc r s_succ => if inCompare s_succ then inCompare bits && decide (r ≠ 1) else true
  | .decnz r s_succ s_fail =>
    (if inCompare s_succ then inCompare bits && decide (r ≠ 1) else true) &&
    (if inCompare s_fail then inCompare bits || decide (r = 1) else true)

set_option maxHeartbeats 800000 in
-- Finite state-table decision procedure.
theorem inCompareStepOk_all :
    ∀ bits ∈ allValidStacks, inCompareStepOk bits = true := by
  decide

theorem getD_one_set_ne : ∀ (regs : List ℕ) (r : ℕ), r ≠ 1 → ∀ (v : ℕ),
    (regs.set r v).getD 1 0 = regs.getD 1 0
  | [], _, _, _ => rfl
  | _ :: [], r, _, _ => by cases r <;> rfl
  | _ :: _ :: _, 0, _, _ => rfl
  | _ :: _ :: _, 1, hr, _ => absurd rfl hr
  | _ :: _ :: _, _ + 2, _, _ => rfl

def RhRegInv (c : RhRegCfg) : Prop :=
  isValidStack c.stack = true ∧ (inCompare c.stack = true → c.regs.getD 1 0 = 0)

theorem rhRegInv_init : RhRegInv rhRegInit := by
  refine ⟨isValidStack_nil, ?_⟩
  intro h; cases h

theorem rhRegInv_step {c c' : RhRegCfg} (hinv : RhRegInv c)
    (hs : rhRegStepOf false c = some c') : RhRegInv c' := by
  obtain ⟨stack, regs⟩ := c
  obtain ⟨stack', regs'⟩ := c'
  obtain ⟨hv, hcmp⟩ := hinv
  have hv' := rhRegStepOf_valid false hv hs
  refine ⟨hv', ?_⟩
  have hmem : stack ∈ allValidStacks := List.contains_iff_mem.mp hv
  have hok := inCompareStepOk_all stack hmem
  unfold inCompareStepOk at hok
  have hstep_eq : rhRegStepOf false ⟨stack, regs⟩ =
      match evalStackOf false stack with
      | .halt => none
      | .jump s' => some ⟨s', regs⟩
      | .inc r s_succ => some ⟨s_succ, regs.set r (regs.getD r 0 + 1)⟩
      | .decnz r s_succ s_fail =>
        if regs.getD r 0 == 0 then some ⟨s_fail, regs⟩
        else some ⟨s_succ, regs.set r (regs.getD r 0 - 1)⟩ := rfl
  rw [hstep_eq] at hs
  rcases hev : evalStackOf false stack with _ | s' | ⟨r, s_succ⟩ | ⟨r, s_succ, s_fail⟩
  · rw [hev] at hs; cases hs
  · rw [hev] at hs hok
    rcases Option.some.inj hs with ⟨rfl, rfl⟩
    intro hc'
    dsimp only at hok hc' ⊢
    rw [hc', ite_eq_left rfl] at hok
    exact hcmp hok
  · rw [hev] at hs hok
    rcases Option.some.inj hs with ⟨rfl, rfl⟩
    intro hc'
    dsimp only at hok hc' ⊢
    rw [hc', ite_eq_left rfl, Bool.and_eq_true] at hok
    rw [getD_one_set_ne regs r (of_decide_eq_true hok.2)]
    exact hcmp hok.1
  · rw [hev] at hs hok
    dsimp only at hs hok
    rw [Bool.and_eq_true] at hok
    rcases hok with ⟨hok_succ, hok_fail⟩
    by_cases hz : (regs.getD r 0 == 0) = true
    · rw [hz, ite_eq_left rfl] at hs
      rcases Option.some.inj hs with ⟨rfl, rfl⟩
      intro hc'
      dsimp only at hc' ⊢
      rw [hc', ite_eq_left rfl, Bool.or_eq_true] at hok_fail
      rcases hok_fail with hc | hr1
      · exact hcmp hc
      · have hr_eq : r = 1 := of_decide_eq_true hr1
        subst hr_eq
        exact beq_iff_eq.mp hz
    · rw [ite_eq_right hz] at hs
      rcases Option.some.inj hs with ⟨rfl, rfl⟩
      intro hc'
      dsimp only at hc' ⊢
      rw [hc', ite_eq_left rfl, Bool.and_eq_true] at hok_succ
      rw [getD_one_set_ne regs r (of_decide_eq_true hok_succ.2)]
      exact hcmp hok_succ.1

theorem rhRegHalts_true_iff_false : RhRegHaltsOf true ↔ RhRegHaltsOf false := by
  have hrel : Respects (rhRegStepOf false) (rhRegStepOf true)
      (fun c₁ c₂ => RhRegInv c₁ ∧ c₁ = c₂) := by
    intro c₁ c₂ ⟨hinv, hc₂⟩
    cases hc₂
    by_cases h11 : (c₁.stack == [1, 1, 1, 1, 1, 0, 1, 1]) = true
    · have hstk : c₁.stack = [1, 1, 1, 1, 1, 0, 1, 1] := beq_iff_eq.mp h11
      have hcmp : inCompare c₁.stack = true := by rw [hstk]; decide
      have hj0 : c₁.regs.getD 1 0 = 0 := hinv.2 hcmp
      have hj0_beq : (c₁.regs.getD 1 0 == 0) = true := beq_iff_eq.mpr hj0
      have hs_false : rhRegStepOf false c₁ = some ⟨[1, 1, 1, 1, 1], c₁.regs⟩ := by
        obtain ⟨stk, rgs⟩ := c₁
        dsimp only at hstk ⊢
        subst hstk
        rfl
      have hs_true1 : rhRegStepOf true c₁ = some ⟨[1, 1, 1, 1], c₁.regs⟩ := by
        obtain ⟨stk, rgs⟩ := c₁
        dsimp only at hstk ⊢
        subst hstk
        rfl
      have hs_true2 : rhRegStepOf true ⟨[1, 1, 1, 1], c₁.regs⟩ =
          some ⟨[1, 1, 1, 1, 1], c₁.regs⟩ := by
        unfold rhRegStepOf
        have hev4 : evalStackOf true [1, 1, 1, 1] =
            .decnz 1 [1, 1, 1, 1, 0, 1] [1, 1, 1, 1, 1] := by decide
        dsimp only
        rw [hev4]
        dsimp only
        rw [hj0_beq, ite_eq_left rfl]
      rw [hs_false]
      dsimp only
      exact ⟨⟨[1, 1, 1, 1, 1], c₁.regs⟩, ⟨rhRegInv_step hinv hs_false, rfl⟩,
        Relation.TransGen.head' hs_true1 (Relation.ReflTransGen.single hs_true2)⟩
    · have h11_f : (c₁.stack == [1, 1, 1, 1, 1, 0, 1, 1]) = false :=
        Bool.eq_false_iff.mpr h11
      have heq_step : rhRegStepOf true c₁ = rhRegStepOf false c₁ := by
        unfold rhRegStepOf evalStackOf
        rw [h11_f]; rfl
      rcases hs : rhRegStepOf false c₁ with _ | c₁'
      · dsimp only
        rw [heq_step, hs]
      · dsimp only
        have hs_true : rhRegStepOf true c₁ = some c₁' := by rw [heq_step, hs]
        exact ⟨c₁', ⟨rhRegInv_step hinv hs, rfl⟩,
          Relation.TransGen.single hs_true⟩
  exact tr_eval_dom' hrel ⟨rhRegInv_init, rfl⟩


end

theorem candidate_equivalent : Halts candidate ↔ Halts reference :=
  halts_candidate_iff_halts_edited121
    |>.trans (ConjectureMachines.Riemann120.halts_tm_iff_rhRegHaltsOf true)
    |>.trans rhRegHalts_true_iff_false
    |>.trans (ConjectureMachines.Riemann120.halts_tm_iff_rhRegHaltsOf false).symm
    |>.trans ConjectureMachines.Riemann120.halts_riemann120_iff_halts_riemann121.symm

end ConjectureMachines.Riemann104
