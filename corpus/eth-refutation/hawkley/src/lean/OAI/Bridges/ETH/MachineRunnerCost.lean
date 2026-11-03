import OAI.Bridges.ETH.MachineRunner

/-!
# ETH correspondence, component C1b.2: the runner's polynomial bound

Over the runner of C1b.1, unchanged:

* **State sizes** (`runState_size`, `runStep_iterate_shape`): every state `(c, a, j, w)` has tree
  size at most `2j + 4|w| + 11`; after `i` iterations from `(true, false, 0, w)` the input is still
  `w` and the budget is at most `i`. This covers the continuing states `(true, false, j, w)` and
  the completed state `(false, b, k, w)` alike.
* **Iteration cost** (`loopTime_le`): `m` iterations whose states have size at most `Z` and whose
  `runnerStep` executions cost at most `B` take `loopTime ≤ m (B + 1) + Z`, matching the
  `BEval.loop_next` and `BEval.loop_stop` conventions exactly. Each step's cost comes from
  `(runnerStep M).bound`: `time x ≤ coefficient * (size x + 1) ^ degree`.
* **Runner time** (`runnerTime_le`): `runnerTime M w k ≤ runnerPoly M (k + |w| + 1)`, where
  `runnerPoly M Y = ci (14Y)^di + Y (cs (14Y)^ds + 1) + 14Y + ce (14Y)^de + 2` with the
  coefficients and degrees of `runnerInit`, `runnerStep M`, `runnerExtract`.
* **Uniform bound** (`primitiveRunner_poly`): constants `c, e` depending only on `M` with
  `PrimitiveSimulation M (primitiveRunner M) c e`; `simulationHypothesis_proved`.
* **Reduction from OpenAI's statement** (`not_positiveRateETH_of_mainTheorem`):
  `SqrtLog.Statement.MainTheorem → ¬ PositiveRateETH`, with no simulation premise left.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### State sizes -/

theorem runState_size (x : RunState) :
    (treeEncode x).size ≤ 2 * x.2.2.1 + 4 * x.2.2.2.length + 11 := by
  rcases x with ⟨c, a, j, w⟩
  have hc := bool_size_le c
  have ha := bool_size_le a
  have hw := treeEncode_bits_size w
  simp only [treeEncode_pair, DataTree.size, treeEncode_nat_size]
  omega

theorem runStep_shape (M : Computation.PrimitiveMachine) (x : RunState) :
    (runStep M x).2.2.2 = x.2.2.2 ∧ (runStep M x).2.2.1 ≤ x.2.2.1 + 1 := by
  unfold runStep
  split <;> simp

theorem runStep_iterate_shape (M : Computation.PrimitiveMachine) (w : List Bool) :
    ∀ i, ((runStep M)^[i] (true, false, 0, w)).2.2.2 = w ∧
      ((runStep M)^[i] (true, false, 0, w)).2.2.1 ≤ i := by
  intro i
  induction i with
  | zero => simp
  | succ i ih =>
    rw [Function.iterate_succ_apply']
    have h := runStep_shape M ((runStep M)^[i] (true, false, 0, w))
    exact ⟨h.1.trans ih.1, by omega⟩

theorem runStep_iterate_size (M : Computation.PrimitiveMachine) (w : List Bool) {i m : ℕ}
    (him : i ≤ m) :
    (treeEncode ((runStep M)^[i] (true, false, 0, w))).size ≤ 2 * m + 4 * w.length + 11 := by
  have hs := runState_size ((runStep M)^[i] (true, false, 0, w))
  have hshape := runStep_iterate_shape M w i
  rw [hshape.1] at hs
  omega

/-! ### Loop cost -/

/-- `m` iterations with states of size at most `Z` and steps of cost at most `B`. -/
theorem loopTime_le (M : Computation.PrimitiveMachine) :
    ∀ (m : ℕ) (x : RunState) (Z B : ℕ),
      (∀ i ≤ m, (treeEncode ((runStep M)^[i] x)).size ≤ Z) →
      (∀ i < m, (runnerStep M).program.time ((runStep M)^[i] x) ≤ B) →
      loopTime M x m ≤ m * (B + 1) + Z := by
  intro m
  induction m with
  | zero =>
    intro x Z B hs _
    have := hs 0 le_rfl
    simp only [loopTime, Function.iterate_zero, id_eq] at this ⊢
    omega
  | succ m ih =>
    intro x Z B hs hb
    have h0 : (runnerStep M).program.time x ≤ B := by simpa using hb 0 (by omega)
    have ht := ih (runStep M x) Z B
      (fun i hi => by simpa [Function.iterate_succ_apply] using hs (i + 1) (by omega))
      (fun i hi => by simpa [Function.iterate_succ_apply] using hb (i + 1) (by omega))
    simp only [loopTime]
    nlinarith

/-! ### Runner time -/

/-- The runner's polynomial, in `Y = k + |w| + 1`. -/
noncomputable def runnerPoly (M : Computation.PrimitiveMachine) (Y : ℕ) : ℕ :=
  runnerInit.coefficient * (14 * Y) ^ runnerInit.degree +
    Y * ((runnerStep M).coefficient * (14 * Y) ^ (runnerStep M).degree + 1) + 14 * Y +
    runnerExtract.coefficient * (14 * Y) ^ runnerExtract.degree + 2

/-- **Explicit runner time bound.** -/
theorem runnerTime_le (M : Computation.PrimitiveMachine) (w : List Bool) (k : ℕ) :
    runnerTime M w k ≤ runnerPoly M (k + w.length + 1) := by
  set Y := k + w.length + 1 with hY
  set Z := 2 * (k + 1) + 4 * w.length + 11 with hZ
  have hZY : Z + 1 ≤ 14 * Y := by omega
  -- loop
  have hloop : loopTime M (true, false, 0, w) (k + 1) ≤
      (k + 1) * ((runnerStep M).coefficient * (14 * Y) ^ (runnerStep M).degree + 1) + Z := by
    apply loopTime_le M (k + 1) _ Z
    · intro i hi
      exact runStep_iterate_size M w hi
    · intro i hi
      refine ((runnerStep M).bound _).trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
      have := runStep_iterate_size M w (show i ≤ k + 1 by omega)
      omega
  have hloop' : (k + 1) * ((runnerStep M).coefficient * (14 * Y) ^ (runnerStep M).degree + 1) ≤
      Y * ((runnerStep M).coefficient * (14 * Y) ^ (runnerStep M).degree + 1) :=
    Nat.mul_le_mul_right _ (by omega)
  -- initialization
  have hinit : runnerInit.program.time w ≤ runnerInit.coefficient * (14 * Y) ^ runnerInit.degree := by
    refine (runnerInit.bound w).trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
    have := treeEncode_bits_size w
    omega
  -- extraction
  have hext : runnerExtract.program.time ((runStep M)^[k + 1] (true, false, 0, w)) ≤
      runnerExtract.coefficient * (14 * Y) ^ runnerExtract.degree := by
    refine (runnerExtract.bound _).trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
    have := runStep_iterate_size M w (show k + 1 ≤ k + 1 from le_rfl)
    omega
  unfold runnerTime runnerPoly
  omega

/-! ### Uniform bound and the simulation property -/

theorem natPoly_runnerPoly (M : Computation.PrimitiveMachine) : NatPoly (runnerPoly M) := by
  unfold runnerPoly
  natpoly

/-- **Polynomial overhead.** -/
theorem primitiveRunner_poly (M : Computation.PrimitiveMachine) :
    ∃ c e : ℕ, PrimitiveSimulation M (primitiveRunner M) c e := by
  obtain ⟨_, C, _, d, hC⟩ := natPoly_runnerPoly M
  refine ⟨⌈C⌉₊ * 2 ^ d, d, fun w b s h => ?_⟩
  obtain ⟨k, hks, hr⟩ := primitiveRunner_rbeval M h
  refine hr.mono ?_
  have h1 := runnerTime_le M w k
  have h2 : (runnerPoly M (k + w.length + 1) : ℝ) ≤
      C * (((k + w.length + 1 : ℕ) : ℝ) + 1) ^ d := by
    simpa using hC (k + w.length + 1)
  have h3 : ((k + w.length + 1 : ℕ) : ℝ) + 1 ≤ 2 * ((s + w.length + 1 : ℕ) : ℝ) := by
    push_cast
    have : (k : ℝ) ≤ s := by exact_mod_cast hks
    linarith
  have h4 : (((k + w.length + 1 : ℕ) : ℝ) + 1) ^ d ≤ (2 * ((s + w.length + 1 : ℕ) : ℝ)) ^ d :=
    pow_le_pow_left₀ (by positivity) h3 d
  calc
    (runnerTime M w k : ℝ) ≤ runnerPoly M (k + w.length + 1) := by exact_mod_cast h1
    _ ≤ C * (((k + w.length + 1 : ℕ) : ℝ) + 1) ^ d := h2
    _ ≤ ⌈C⌉₊ * (2 * ((s + w.length + 1 : ℕ) : ℝ)) ^ d :=
      mul_le_mul (Nat.le_ceil C) h4 (by positivity) (by positivity)
    _ = (((⌈C⌉₊ * 2 ^ d * (s + w.length + 1) ^ d : ℕ)) : ℝ) := by
      rw [mul_pow]
      push_cast
      ring

/-- **The simulation hypothesis, proved.** -/
theorem simulationHypothesis_proved : SimulationHypothesis := by
  intro M
  obtain ⟨c, e, h⟩ := primitiveRunner_poly M
  exact ⟨primitiveRunner M, c, e, h⟩

/-! ### The reduction without a simulation premise -/

/-- `Feasible 3` alone implies `¬ PositiveRateETH`. -/
theorem not_positiveRateETH_of_feasible_three (h : SqrtLog.Statement.Feasible 3) :
    ¬ PositiveRateETH :=
  not_positiveRateETH_of_feasible_three_of_simulation h simulationHypothesis_proved

/-- OpenAI's main-theorem statement implies `¬ PositiveRateETH`. -/
theorem not_positiveRateETH_of_mainTheorem (h : SqrtLog.Statement.MainTheorem) :
    ¬ PositiveRateETH :=
  not_positiveRateETH_of_feasible_three (h 3 le_rfl)

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.runState_size
#print axioms OAI.Bridges.ETH.runStep_shape
#print axioms OAI.Bridges.ETH.runStep_iterate_shape
#print axioms OAI.Bridges.ETH.runStep_iterate_size
#print axioms OAI.Bridges.ETH.loopTime_le
#print axioms OAI.Bridges.ETH.runnerPoly
#print axioms OAI.Bridges.ETH.runnerTime_le
#print axioms OAI.Bridges.ETH.natPoly_runnerPoly
#print axioms OAI.Bridges.ETH.primitiveRunner_poly
#print axioms OAI.Bridges.ETH.simulationHypothesis_proved
#print axioms OAI.Bridges.ETH.not_positiveRateETH_of_feasible_three
#print axioms OAI.Bridges.ETH.not_positiveRateETH_of_mainTheorem
