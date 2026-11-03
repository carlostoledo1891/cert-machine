import OAI.Bridges.ETH.MachineInterface

/-!
# ETH correspondence, component C1a: translating a `PrimitiveMachine`

`toParityMachine : Computation.PrimitiveMachine → ParityWL.Complexity.Machine` translates OpenAI's
machine into the multitape model of `PositiveRateETH`, one step for one step.

**Conventions checked.**

* Cells. OpenAI: `Option Bool`, blank `none` (`default`). ParityLifts: `Fin (extraSymbols + 3)`,
  blank `0`, input bits `false ↦ 1`, `true ↦ 2` (`inputSymbol`). With `extraSymbols = 0`,
  `symCode : none ↦ 0, some false ↦ 1, some true ↦ 2`, and `symCode (some b) = inputSymbol _ b`.
* Tapes. OpenAI: Mathlib `Turing.Tape`, head-centred (`Tape.nth 0` is the head;
  `(T.move left).nth i = T.nth (i - 1)`). ParityLifts: absolute positions `ℤ`, a head `ℤ`,
  `Move.left` adds `-1`. `TapeRep T h f := ∀ z, f (h + z) = symCode (T.nth z)`.
* Tape indices. ParityLifts puts the input on tape `0`; OpenAI on `inputTape`. `tapeIndex` sends
  `inputTape ↦ 0` and every other `k ↦ k + 1` (injective); the translated machine has
  `tapeCount + 1` tapes, one of which is never used.
* States. Running state `q ↦ q`, halting `false ↦ stateCount`, `true ↦ stateCount + 1`;
  `output` is `some b` exactly on the two halting states, which ParityLifts' `step` keeps fixed.
* Steps. Every OpenAI step, including the halting step, is exactly one ParityLifts step: the
  transition acts on the scanned tape and writes back the read symbol, without moving, on all
  others.

**Results.** `init_rep` (initialization, every input), `step_rep` (one step: head movement,
writes, state change, halting), `iterate_rep` and `trace_rep` (finite runs), and
`emits_of_outputsInTime : M.OutputsInTime w b s → Emits (toParityMachine M) w s b`, with the
same `s` (no overhead).
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### Alphabet -/

/-- The cell code. -/
def symCode : Option Bool → Fin 3
  | none => 0
  | some false => 1
  | some true => 2

def symDecode (s : Fin 3) : Option Bool :=
  if s.val = 0 then none else if s.val = 1 then some false else some true

@[simp] theorem symDecode_symCode (a : Option Bool) : symDecode (symCode a) = a := by
  rcases a with _ | _ | _ <;> rfl

/-! ### The translation -/

section Translation

variable (M : Computation.PrimitiveMachine)

/-- OpenAI's tape `k` becomes ParityLifts tape `tapeIndex M k`; the input tape becomes `0`. -/
def tapeIndex (k : Fin M.tapeCount) : Fin (M.tapeCount + 1) :=
  if k = M.inputTape then 0 else k.succ

theorem tapeIndex_injective : Function.Injective (tapeIndex M) := by
  intro j k h
  unfold tapeIndex at h
  by_cases hj : j = M.inputTape <;> by_cases hk : k = M.inputTape
  · rw [hj, hk]
  · simp only [hj, hk, ite_true, ite_false] at h; exact absurd h.symm (Fin.succ_ne_zero _)
  · simp only [hj, hk, ite_true, ite_false] at h; exact absurd h (Fin.succ_ne_zero _)
  · simp only [hj, hk, ite_false] at h; exact Fin.succ_injective _ h

/-- State encoding. -/
def stateEnc : Bool ⊕ Fin M.stateCount → Fin (M.stateCount + 1 + 1)
  | .inr q => ⟨q.val, by omega⟩
  | .inl false => ⟨M.stateCount, by omega⟩
  | .inl true => ⟨M.stateCount + 1, by omega⟩

def moveOf : Turing.Dir → Move
  | .left => Move.left
  | .right => Move.right

/-- The translated transition. -/
def toTransition (s : Fin (M.stateCount + 1 + 1)) (r : Fin (M.tapeCount + 1) → Fin 3) :
    Fin (M.stateCount + 1 + 1) × (Fin (M.tapeCount + 1) → Fin 3 × Move) :=
  if h : s.val < M.stateCount then
    match M.transition ⟨s.val, h⟩ (symDecode (r (tapeIndex M (M.scan ⟨s.val, h⟩)))) with
    | .inl ans => (stateEnc M (.inl ans), fun j => (r j, Move.stay))
    | .inr (q', .move dir) => (stateEnc M (.inr q'), fun j =>
        (r j, if j = tapeIndex M (M.scan ⟨s.val, h⟩) then moveOf dir else Move.stay))
    | .inr (q', .write a) => (stateEnc M (.inr q'), fun j =>
        (if j = tapeIndex M (M.scan ⟨s.val, h⟩) then symCode a else r j, Move.stay))
  else (s, fun j => (r j, Move.stay))

/-- **The compiler.** -/
@[reducible] def toParityMachine : Machine where
  tapes := M.tapeCount
  extraSymbols := 0
  extraStates := M.stateCount + 1
  initial := stateEnc M (.inr M.start)
  output := fun s => if s.val = M.stateCount then some false
    else if s.val = M.stateCount + 1 then some true else none
  transition := toTransition M

theorem output_running (q : Fin M.stateCount) :
    (toParityMachine M).output (stateEnc M (.inr q)) = none := by
  have h1 : (stateEnc M (.inr q)).val = q.val := rfl
  have := q.isLt
  show (if (stateEnc M (.inr q)).val = M.stateCount then some false
    else if (stateEnc M (.inr q)).val = M.stateCount + 1 then some true else none) = none
  rw [ite_eq_right (by omega), ite_eq_right (by omega)]

theorem output_halting (b : Bool) :
    (toParityMachine M).output (stateEnc M (.inl b)) = some b := by
  cases b <;> simp [stateEnc]

end Translation

/-! ### Representation relation -/

/-- A ParityLifts tape `f` with head `h` represents the Mathlib tape `T`. -/
def TapeRep (T : Turing.Tape (Option Bool)) (h : ℤ) (f : ℤ → Fin 3) : Prop :=
  ∀ z : ℤ, f (h + z) = symCode (T.nth z)

/-- A ParityLifts configuration represents an OpenAI configuration. -/
def CfgRep (M : Computation.PrimitiveMachine) (c : M.Cfg)
    (x : Configuration (toParityMachine M)) : Prop :=
  x.state = stateEnc M c.state ∧
    ∀ k : Fin M.tapeCount, TapeRep (c.tapes k) (x.head (tapeIndex M k)) (x.tape (tapeIndex M k))

theorem TapeRep.head {T : Turing.Tape (Option Bool)} {h : ℤ} {f : ℤ → Fin 3}
    (hT : TapeRep T h f) : f h = symCode T.head := by
  simpa using hT 0

theorem TapeRep.move {T : Turing.Tape (Option Bool)} {h : ℤ} {f : ℤ → Fin 3}
    (hT : TapeRep T h f) (dir : Turing.Dir) : TapeRep (T.move dir) (h + (moveOf dir).offset) f := by
  intro z
  cases dir with
  | left =>
    rw [Turing.Tape.move_left_nth, ← hT]
    simp only [moveOf, Move.offset]
    congr 1
    ring
  | right =>
    rw [Turing.Tape.move_right_nth, ← hT]
    simp only [moveOf, Move.offset]
    congr 1
    ring

theorem TapeRep.write {T : Turing.Tape (Option Bool)} {h : ℤ} {f : ℤ → Fin 3}
    (hT : TapeRep T h f) (a : Option Bool) :
    TapeRep (T.write a) h (fun z => if z = h then symCode a else f z) := by
  intro z
  rw [Turing.Tape.write_nth]
  by_cases hz : z = 0
  · simp [hz]
  · have : h + z ≠ h := by omega
    simp [hz, this, hT z]

/-- Writing a cell's own value back, at any position `h₀`, changes nothing. -/
theorem TapeRep.rewrite {T : Turing.Tape (Option Bool)} {h : ℤ} {f : ℤ → Fin 3}
    (hT : TapeRep T h f) (h₀ : ℤ) : TapeRep T h (fun z => if z = h₀ then f h₀ else f z) := by
  have hf : (fun z => if z = h₀ then f h₀ else f z) = f := by
    funext z
    by_cases e : z = h₀
    · rw [ite_eq_left e, e]
    · rw [ite_eq_right e]
  rw [hf]
  exact hT

/-! ### Initialization -/

theorem mk₁_nth (l : List (Option Bool)) (z : ℤ) :
    (Turing.Tape.mk₁ l).nth z = if 0 ≤ z then l.getI z.toNat else none := by
  cases z with
  | ofNat n =>
    simp only [Int.ofNat_eq_natCast, Turing.Tape.mk₁, Turing.Tape.mk₂, Turing.Tape.mk'_nth_nat,
      Turing.ListBlank.nth_mk]
    simp
  | negSucc n =>
    simp [Turing.Tape.mk₁, Turing.Tape.mk₂, Turing.Tape.mk', Turing.Tape.nth,
      Turing.ListBlank.nth_mk, List.getI_nil]
    rfl

theorem getI_map_some (w : List Bool) (n : ℕ) :
    (w.map some).getI n = match w[n]? with | some b => some b | none => none := by
  rw [List.getI_eq_getElem?_getD]
  cases h : w[n]? <;> simp [h]
  rfl

/-- **Initialization correspondence**, for every binary input. -/
theorem init_rep (M : Computation.PrimitiveMachine) (w : List Bool) :
    CfgRep M (M.init w) (initialConfiguration (toParityMachine M) w) := by
  refine ⟨rfl, fun k z => ?_⟩
  simp only [initialConfiguration, zero_add, Computation.PrimitiveMachine.init]
  by_cases hk : k = M.inputTape
  · subst hk
    have hi : (tapeIndex M M.inputTape).val = 0 := by simp [tapeIndex]
    rw [ite_eq_left rfl, mk₁_nth]
    by_cases hz : 0 ≤ z
    · rw [ite_eq_left ⟨hi, hz⟩, ite_eq_left hz, getI_map_some]
      cases h : w[z.toNat]? with
      | none => rfl
      | some b => cases b <;> rfl
    · rw [ite_eq_right (fun hh => hz hh.2), ite_eq_right hz]
      rfl
  · have hi : (tapeIndex M k).val ≠ 0 := by simp [tapeIndex, hk]
    rw [ite_eq_right hk, ite_eq_right (fun hh => hi hh.1), mk₁_nth]
    split_ifs <;> rfl

/-! ### One step -/

theorem toTransition_running (M : Computation.PrimitiveMachine) (q : Fin M.stateCount)
    (r : Fin (M.tapeCount + 1) → Fin 3) :
    toTransition M (stateEnc M (.inr q)) r =
      match M.transition q (symDecode (r (tapeIndex M (M.scan q)))) with
      | .inl ans => (stateEnc M (.inl ans), fun j => (r j, Move.stay))
      | .inr (q', .move dir) => (stateEnc M (.inr q'), fun j =>
          (r j, if j = tapeIndex M (M.scan q) then moveOf dir else Move.stay))
      | .inr (q', .write a) => (stateEnc M (.inr q'), fun j =>
          (if j = tapeIndex M (M.scan q) then symCode a else r j, Move.stay)) := by
  unfold toTransition
  rw [dite_eq_left (by simp [stateEnc])]
  rfl

/-- A ParityLifts step from a non-output state, unfolded, for any machine. -/
theorem step_of_output_none {P : Machine} {x : Configuration P} (h : P.output x.state = none) :
    step P x =
      { state := (P.transition x.state (fun i => x.tape i (x.head i))).1
        head := fun i => x.head i + ((P.transition x.state (fun i => x.tape i (x.head i))).2 i).2.offset
        tape := fun i z => if z = x.head i then
          ((P.transition x.state (fun i => x.tape i (x.head i))).2 i).1 else x.tape i z } := by
  simp only [step, h]

/-- **Single-step correspondence.** -/
theorem step_rep (M : Computation.PrimitiveMachine) {c c' : M.Cfg}
    {x : Configuration (toParityMachine M)} (h : CfgRep M c x) (hs : M.step c = some c') :
    CfgRep M c' (step (toParityMachine M) x) := by
  obtain ⟨hstate, htapes⟩ := h
  rcases c with ⟨st, tapes⟩
  cases st with
  | inl b => simp [Computation.PrimitiveMachine.step] at hs
  | inr q =>
    simp only at hstate htapes
    have hread : x.tape (tapeIndex M (M.scan q)) (x.head (tapeIndex M (M.scan q))) =
        symCode (tapes (M.scan q)).head := (htapes (M.scan q)).head
    have hout : (toParityMachine M).output x.state = none := by
      rw [hstate]; exact output_running M q
    have htrans : (toParityMachine M).transition = toTransition M := rfl
    rw [step_of_output_none hout, hstate, htrans, toTransition_running]
    simp only [hread, symDecode_symCode]
    simp only [Computation.PrimitiveMachine.step] at hs
    rcases htr : M.transition q (tapes (M.scan q)).head with ans | ⟨q', act⟩
    · -- halting
      simp only [htr, Option.some.injEq] at hs
      subst hs
      refine ⟨rfl, fun k => ?_⟩
      simp only [Move.offset, add_zero]
      exact (htapes k).rewrite _
    · cases act with
      | move dir =>
        simp only [htr, Option.some.injEq] at hs
        subst hs
        refine ⟨rfl, fun k => ?_⟩
        by_cases hk : k = M.scan q
        · subst hk
          simp only [ite_true, Function.update_self]
          exact ((htapes _).move dir).rewrite _
        · have hne : tapeIndex M k ≠ tapeIndex M (M.scan q) :=
            fun e => hk (tapeIndex_injective M e)
          simp only [hne, ite_false, Move.offset, add_zero, Function.update_of_ne hk]
          exact (htapes k).rewrite _
      | write a =>
        simp only [htr, Option.some.injEq] at hs
        subst hs
        refine ⟨rfl, fun k => ?_⟩
        by_cases hk : k = M.scan q
        · subst hk
          simp only [ite_true, Move.offset, add_zero, Function.update_self]
          exact (htapes _).write a
        · have hne : tapeIndex M k ≠ tapeIndex M (M.scan q) :=
            fun e => hk (tapeIndex_injective M e)
          simp only [hne, ite_false, Move.offset, add_zero, Function.update_of_ne hk]
          exact (htapes k).rewrite _

/-! ### Finite runs -/

/-- **Run correspondence**, along any OpenAI trace. -/
theorem iterate_rep (M : Computation.PrimitiveMachine) {n : ℕ} {a c : M.Cfg}
    (ht : Computation.Trace M.step n a c) :
    ∀ x : Configuration (toParityMachine M), CfgRep M a x →
      CfgRep M c ((step (toParityMachine M))^[n] x) := by
  induction ht with
  | refl a => intro x hx; exact hx
  | cons hs _ ih =>
    intro x hx
    rw [Function.iterate_succ_apply]
    exact ih _ (step_rep M hx hs)

theorem trace_rep (M : Computation.PrimitiveMachine) {w : List Bool} {n : ℕ} {c : M.Cfg}
    (ht : Computation.Trace M.step n (M.init w) c) :
    CfgRep M c (run (toParityMachine M) w n) :=
  iterate_rep M ht _ (init_rep M w)

theorem emits_mono' {P : Machine} {bs : List Bool} {s t : ℕ} {b : Bool}
    (h : Emits P bs s b) (hst : s ≤ t) : Emits P bs t b := by
  induction t, hst using Nat.le_induction with
  | base => exact h
  | succ t _ ih =>
    unfold Emits run at *
    rw [Function.iterate_succ_apply']
    simp only [step, ih]

/-- **Output correspondence.** If OpenAI's machine outputs `b` within `s` steps, the translated
machine emits `b` at step `s`. -/
theorem emits_of_outputsInTime (M : Computation.PrimitiveMachine) {w : List Bool} {b : Bool}
    {s : ℕ} (h : M.OutputsInTime w b s) : Emits (toParityMachine M) w s b := by
  obtain ⟨c, ⟨n, hn, ht⟩, hc⟩ := h
  have hr := (trace_rep M ht).1
  have hemit : Emits (toParityMachine M) w n b := by
    unfold Emits
    rw [hr, hc]
    exact output_halting M b
  exact emits_mono' hemit hn

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.symCode
#print axioms OAI.Bridges.ETH.symDecode_symCode
#print axioms OAI.Bridges.ETH.tapeIndex
#print axioms OAI.Bridges.ETH.tapeIndex_injective
#print axioms OAI.Bridges.ETH.stateEnc
#print axioms OAI.Bridges.ETH.toTransition
#print axioms OAI.Bridges.ETH.toParityMachine
#print axioms OAI.Bridges.ETH.output_running
#print axioms OAI.Bridges.ETH.output_halting
#print axioms OAI.Bridges.ETH.TapeRep
#print axioms OAI.Bridges.ETH.CfgRep
#print axioms OAI.Bridges.ETH.TapeRep.head
#print axioms OAI.Bridges.ETH.TapeRep.move
#print axioms OAI.Bridges.ETH.TapeRep.write
#print axioms OAI.Bridges.ETH.TapeRep.rewrite
#print axioms OAI.Bridges.ETH.mk₁_nth
#print axioms OAI.Bridges.ETH.getI_map_some
#print axioms OAI.Bridges.ETH.init_rep
#print axioms OAI.Bridges.ETH.toTransition_running
#print axioms OAI.Bridges.ETH.step_of_output_none
#print axioms OAI.Bridges.ETH.step_rep
#print axioms OAI.Bridges.ETH.iterate_rep
#print axioms OAI.Bridges.ETH.trace_rep
#print axioms OAI.Bridges.ETH.emits_mono'
#print axioms OAI.Bridges.ETH.emits_of_outputsInTime
