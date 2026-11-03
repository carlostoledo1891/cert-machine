import OAI.Bridges.ETH.MachineTranslation
import OAI.Combinatorics.ParityLifts.RaceStage

/-!
# ETH correspondence, component C1b.1: the runner and its correctness

`primitiveRunner M : FCode` runs the translated machine `P = toParityMachine M` on an input `w`
with step budgets `n = 0, 1, 2, …` until a bounded run reaches an output state, then returns that
output. It is one fixed `FCode` per machine `M`.

**What `boundedAnswer` returns.** `boundedAnswer P n w : Bool × Bool` is
`(decide (output state reached within n steps), output or false)`. So `(false, _)` means not yet
halted, `(true, false)` halted with `false`, `(true, true)` halted with `true`; the flag and the
answer are separate components (`boundedAnswer_of_emits`, `boundedAnswer_emits`).

**Structure.** `primitiveRunner M = .seq init (.seq (.loop step) extract)` with
* `runnerInit : PolyProgram (List Bool) RunState`, `w ↦ (true, false, 0, w)`;
* `runnerStep M : PolyProgram RunState RunState (runStep M)`, built from
  `PolyProgram.boundedAnswer P`; the state is `(continue, answer, budget, input)`, and
  `.loop` continues while `continue = true` (its left child is not `nil`);
* `runnerExtract : PolyProgram RunState Bool`, the answer component.

**Correctness.** `primitiveRunner_correct`: if `M.OutputsInTime w b s`, then for the first budget
`k ≤ s` at which the bounded run halts, the runner's code evaluates `treeEncode w` to
`treeEncode b` within `runnerTime M w k`, an explicit cost. `primitiveRunner_rbeval` is the
`RBEval` form.

**Cost data kept for C1b.2.** `loopTime M x k` is the loop's exact `BEval` budget, defined by
recursion on the number of iterations from each step's `runnerStep` time;
`runnerTime M w k` adds the initialization and extraction times. `runStep_iterate_prefix` gives
every intermediate state, `(true, false, j, w)` for `j ≤ k`. No polynomial bound is proved here.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-- The loop state: `(continue, answer, budget, input)`. -/
abbrev RunState := Bool × (Bool × (ℕ × List Bool))

section Runner

variable (M : Computation.PrimitiveMachine)

/-- One loop iteration: run the translated machine with the current budget; stop if it halted,
otherwise raise the budget. -/
noncomputable def runStep (x : RunState) : RunState :=
  if (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).1 then
    (false, (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).2, x.2.2)
  else (true, x.2.1, x.2.2.1 + 1, x.2.2.2)

/-- `x ↦ (budget, input)`. -/
def runnerProj : PolyProgram RunState (ℕ × List Bool) (fun x => x.2.2) :=
  (PolyProgram.snd Bool (Bool × (ℕ × List Bool))).comp (PolyProgram.snd Bool (ℕ × List Bool))

/-- The bounded run on the current budget. -/
noncomputable def runnerProbe :
    PolyProgram RunState (Bool × Bool)
      (fun x => boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2) :=
  (runnerProj.comp (PolyProgram.boundedAnswer (toParityMachine M))).congr (by intro x; rfl)

/-- **The loop body**, as a polynomial program in the state's size. -/
noncomputable def runnerStep : PolyProgram RunState RunState (runStep M) := by
  let found : PolyProgram RunState RunState
      (fun x => (false, (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).2, x.2.2)) :=
    ((PolyProgram.const false).pair
      (((runnerProbe M).comp (PolyProgram.snd Bool Bool)).pair runnerProj)).congr
        (by intro x; rfl)
  let budget : PolyProgram RunState ℕ (fun x => x.2.2.1 + 1) :=
    ((runnerProj.comp (PolyProgram.fst ℕ (List Bool))).comp PolyProgram.natSucc).congr
      (by intro x; rfl)
  let input : PolyProgram RunState (List Bool) (fun x => x.2.2.2) :=
    runnerProj.comp (PolyProgram.snd ℕ (List Bool))
  let answer : PolyProgram RunState Bool (fun x => x.2.1) :=
    (PolyProgram.snd Bool (Bool × (ℕ × List Bool))).comp (PolyProgram.fst Bool (ℕ × List Bool))
  let next : PolyProgram RunState RunState (fun x => (true, x.2.1, x.2.2.1 + 1, x.2.2.2)) :=
    ((PolyProgram.const true).pair (answer.pair (budget.pair input))).congr (by intro x; rfl)
  refine (((runnerProbe M).comp (PolyProgram.fst Bool Bool)).ite found next).congr ?_
  intro x
  rfl

/-- `w ↦ (true, false, 0, w)`. -/
def runnerInit : PolyProgram (List Bool) RunState (fun w => (true, false, 0, w)) :=
  ((PolyProgram.const true).pair
    ((PolyProgram.const false).pair ((PolyProgram.const (0 : ℕ)).pair (PolyProgram.id _)))).congr
      (by intro w; rfl)

/-- The answer component. -/
def runnerExtract : PolyProgram RunState Bool (fun x => x.2.1) :=
  (PolyProgram.snd Bool (Bool × (ℕ × List Bool))).comp (PolyProgram.fst Bool (ℕ × List Bool))

/-- **The runner.** One fixed `FCode` per machine. -/
noncomputable def primitiveRunner : FCode :=
  .seq runnerInit.program.code (.seq (.loop (runnerStep M).program.code) runnerExtract.program.code)

/-- The loop's explicit `BEval` budget for `k` iterations from `x`. -/
noncomputable def loopTime : RunState → ℕ → ℕ
  | x, 0 => (treeEncode x).size
  | x, k + 1 => (runnerStep M).program.time x + loopTime (runStep M x) k + 1

/-- The runner's explicit `BEval` budget when the loop runs `k + 1` iterations. -/
noncomputable def runnerTime (w : List Bool) (k : ℕ) : ℕ :=
  runnerInit.program.time w +
    (loopTime M (true, false, 0, w) (k + 1) +
      runnerExtract.program.time ((runStep M)^[k + 1] (true, false, 0, w)) + 1) + 1

end Runner

/-! ### Single iteration -/

theorem runStep_found (M : Computation.PrimitiveMachine) {x : RunState}
    (h : (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).1 = true) :
    runStep M x = (false, (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).2, x.2.2) := by
  simp [runStep, h]

theorem runStep_continue (M : Computation.PrimitiveMachine) {x : RunState}
    (h : (boundedAnswer (toParityMachine M) x.2.2.1 x.2.2.2).1 = false) :
    runStep M x = (true, x.2.1, x.2.2.1 + 1, x.2.2.2) := by
  simp [runStep, h]

/-- **Single-iteration correctness**: the body's code computes `runStep` within its time. -/
theorem runnerStep_run (M : Computation.PrimitiveMachine) (x : RunState) :
    BEval (runnerStep M).program.code (treeEncode x) ((runnerStep M).program.time x)
      (treeEncode (runStep M x)) :=
  (runnerStep M).program.run x

/-! ### The loop -/

theorem continue_ne_nil (x : RunState) (h : x.1 = true) : (treeEncode x).child false ≠ .nil := by
  rcases x with ⟨c, rest⟩
  simp only at h
  subst h
  simp [DataTree.child]

theorem stop_eq_nil (x : RunState) (h : x.1 = false) : (treeEncode x).child false = .nil := by
  rcases x with ⟨c, rest⟩
  simp only at h
  subst h
  simp [DataTree.child]

/-- The loop runs `k` iterations and returns the `k`-th state, within `loopTime`. -/
theorem loop_run (M : Computation.PrimitiveMachine) :
    ∀ (k : ℕ) (x : RunState), (∀ j < k, ((runStep M)^[j] x).1 = true) →
      ((runStep M)^[k] x).1 = false →
      BEval (.loop (runnerStep M).program.code) (treeEncode x) (loopTime M x k)
        (treeEncode ((runStep M)^[k] x)) := by
  intro k
  induction k with
  | zero =>
    intro x _ hstop
    exact BEval.loop_stop _ _ (stop_eq_nil x hstop)
  | succ k ih =>
    intro x hcont hstop
    have h0 : x.1 = true := by simpa using hcont 0 (by omega)
    have htail := ih (runStep M x)
      (fun j hj => by simpa [Function.iterate_succ_apply] using hcont (j + 1) (by omega))
      (by simpa [Function.iterate_succ_apply] using hstop)
    rw [Function.iterate_succ_apply]
    exact BEval.loop_next (continue_ne_nil x h0) (runnerStep_run M x) htail

/-! ### The search over budgets -/

/-- **Loop invariant.** Before the first budget at which the bounded run halts, the state after
`j` iterations is `(true, false, j, w)`. -/
theorem runStep_iterate_prefix (M : Computation.PrimitiveMachine) (w : List Bool) (k : ℕ)
    (hk : ∀ i < k, (boundedAnswer (toParityMachine M) i w).1 = false) :
    ∀ j ≤ k, (runStep M)^[j] (true, false, 0, w) = (true, false, j, w) := by
  intro j
  induction j with
  | zero => intro _; rfl
  | succ j ih =>
    intro hj
    rw [Function.iterate_succ_apply', ih (by omega), runStep_continue M (hk j (by omega))]

/-- **Correctness for terminating source runs.** -/
theorem primitiveRunner_correct (M : Computation.PrimitiveMachine) {w : List Bool} {b : Bool}
    {s : ℕ} (h : M.OutputsInTime w b s) :
    ∃ k ≤ s, BEval (primitiveRunner M) (treeEncode w) (runnerTime M w k) (treeEncode b) := by
  have he := emits_of_outputsInTime M h
  have hex : ∃ n, (boundedAnswer (toParityMachine M) n w).1 = true :=
    ⟨s, by rw [boundedAnswer_of_emits he le_rfl]⟩
  classical
  let k := Nat.find hex
  have hk : (boundedAnswer (toParityMachine M) k w).1 = true := Nat.find_spec hex
  have hmin : ∀ i < k, (boundedAnswer (toParityMachine M) i w).1 = false := by
    intro i hi
    simpa using Nat.find_min hex hi
  have hks : k ≤ s := Nat.find_min' hex (by rw [boundedAnswer_of_emits he le_rfl])
  -- the halted bounded run reports `b`
  have hans : (boundedAnswer (toParityMachine M) k w).2 = b :=
    Emits.unique (boundedAnswer_emits hk) he
  have hpre := runStep_iterate_prefix M w k hmin
  have hlast : (runStep M)^[k + 1] (true, false, 0, w) = (false, b, k, w) := by
    rw [Function.iterate_succ_apply', hpre k le_rfl, runStep_found M hk, hans]
  refine ⟨k, hks, ?_⟩
  have hloop := loop_run M (k + 1) (true, false, 0, w)
    (fun j hj => by rw [hpre j (by omega)])
    (by rw [hlast])
  have hext := runnerExtract.program.run ((runStep M)^[k + 1] (true, false, 0, w))
  rw [hlast] at hext
  have hinit := runnerInit.program.run w
  have hrun := hinit.seq (hloop.seq (by rw [hlast]; exact hext))
  unfold runnerTime primitiveRunner
  rw [hlast]
  exact hrun

/-- The `RBEval` form, with the explicit budget. -/
theorem primitiveRunner_rbeval (M : Computation.PrimitiveMachine) {w : List Bool} {b : Bool}
    {s : ℕ} (h : M.OutputsInTime w b s) :
    ∃ k ≤ s, RBEval (primitiveRunner M) (treeEncode w) (runnerTime M w k : ℝ) (treeEncode b) := by
  obtain ⟨k, hk, hrun⟩ := primitiveRunner_correct M h
  exact ⟨k, hk, hrun.real⟩

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.runStep
#print axioms OAI.Bridges.ETH.runnerProj
#print axioms OAI.Bridges.ETH.runnerProbe
#print axioms OAI.Bridges.ETH.runnerStep
#print axioms OAI.Bridges.ETH.runnerInit
#print axioms OAI.Bridges.ETH.runnerExtract
#print axioms OAI.Bridges.ETH.primitiveRunner
#print axioms OAI.Bridges.ETH.loopTime
#print axioms OAI.Bridges.ETH.runnerTime
#print axioms OAI.Bridges.ETH.runStep_found
#print axioms OAI.Bridges.ETH.runStep_continue
#print axioms OAI.Bridges.ETH.runnerStep_run
#print axioms OAI.Bridges.ETH.continue_ne_nil
#print axioms OAI.Bridges.ETH.stop_eq_nil
#print axioms OAI.Bridges.ETH.loop_run
#print axioms OAI.Bridges.ETH.runStep_iterate_prefix
#print axioms OAI.Bridges.ETH.primitiveRunner_correct
#print axioms OAI.Bridges.ETH.primitiveRunner_rbeval
