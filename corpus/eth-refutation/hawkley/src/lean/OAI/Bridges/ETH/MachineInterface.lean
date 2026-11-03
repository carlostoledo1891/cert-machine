import OAI.Bridges.ETH.ConverterPoly
import OAI.Bridges.ETH.RuntimeAsymptotics
import OAI.Algorithms.SubexponentialSAT.SqrtLog.StatementCanonical
import OAI.Combinatorics.ParityLifts.FixedBridge

/-!
# ETH correspondence, component C0: the machine-model interface

## What each side provides and requires

* **OpenAI.** `SqrtLog.Statement.Feasible 3` supplies one
  `Computation.PrimitiveMachine` (finitely many states and tapes, cells `Option Bool`, each state
  scanning one Mathlib `Turing.Tape`), and constants `C A > 0`, `d > 0`, with
  `DecidesWithBound M 3 C A d`: on every width-3 `SAT.CNF (Fin n)`, started on
  `Encoding.encodeCNF F`, the machine reaches a state `Sum.inl answer`
  (`PrimitiveMachine.OutputsInTime`) within `runtimeBound C A d (formulaBitLength F) n` steps,
  with `answer = true ↔ SAT.Satisfiable F`. Time is the number of `step`s; space is implicit.
* **ParityLifts.** `PositiveRateETH` quantifies over `ParityWL.Complexity.Machine`. The bridge
  `sat_code_rate` asks for one fixed `FCode p`, one budget `R : ℕ → ℝ` with `ExpBound R r`,
  and for every `F : Formula N` a Boolean `b` with
  `RBEval p (treeEncode (minimizeList F.bitList)) (R N) (treeEncode b)` and
  `b = true ↔ F.Satisfiable`. Termination is part of `RBEval`; no separate space hypothesis.

## The missing statement

`PrimitiveSimulation M q c e`: the fixed `FCode q` runs `M` on `w` within
`c * (s + w.length + 1) ^ e` whenever `M.OutputsInTime w b s`, and returns `treeEncode b`. No
space hypothesis appears: each step changes one cell next to a head, so after `s` steps every
tape holds at most `w.length + s + 1` relevant cells, and a simulator's cost may depend on that.
`SimulationHypothesis` asks for this for every `PrimitiveMachine`.

## The conditional reduction

`not_positiveRateETH_of_decider` proves, from `DecidesWithBound M 3 C A d` and
`PrimitiveSimulation M q c e` for that same `M`, that `¬ PositiveRateETH`. The proof uses
component A (`runtimeFactor_expBound`), component B (`converter_seq`,
`canonicalWordProgram_time_le`, `bitCanonical_width`, `bitCanonical_satisfiable`,
`bitCanonical_varBound_le`, `convTime_expBound`) and `sat_code_rate`, `SATTimeBound.rate_mono`.
`not_positiveRateETH_of_feasible_three_of_simulation` packages it with `Feasible 3`.

These theorems take the simulation as a hypothesis. They do not prove it, and they do not prove
`¬ PositiveRateETH` outright.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT
open OAI.Algorithms.SubexponentialSAT.SqrtLog.Statement (runtimeBound runtimeScale)

/-! ### The named simulation obligations -/

/-- **The missing simulation, for one machine.** `q` simulates `M` with polynomial overhead in
the machine's time and the input length. -/
def PrimitiveSimulation (M : Computation.PrimitiveMachine) (q : FCode) (c e : ℕ) : Prop :=
  ∀ (w : List Bool) (b : Bool) (s : ℕ), M.OutputsInTime w b s →
    RBEval q (treeEncode w) ((c * (s + w.length + 1) ^ e : ℕ) : ℝ) (treeEncode b)

/-- **The missing simulation, for every machine.** -/
def SimulationHypothesis : Prop :=
  ∀ M : Computation.PrimitiveMachine, ∃ (q : FCode) (c e : ℕ), PrimitiveSimulation M q c e

/-! ### Interface lemma -/

/-- The canonical input word for the verified machine is no longer than the converter's time
budget. -/
theorem encodeCNF_length_le_convTime {N : ℕ} (F : Formula N) :
    (Encoding.encodeCNF (canonicalCNF (bitCanonical F))).length ≤ convTime N := by
  have hb := (canonicalWordProgram_encodeCNF (minimizeList F.bitList)).bounds.2.1
  have hl := treeEncode_list_length (Encoding.encodeCNF (canonicalCNF (bitCanonical F)))
  have ht := canonicalWordProgram_time_le F
  change (Encoding.encodeCNF (canonicalCNF (bitCanonical F))).length ≤ convTime N
  have : (treeEncode (Encoding.encodeCNF (canonicalCNF (bitCanonical F)))).size ≤
      canonicalWordProgram.time (minimizeList F.bitList) := hb
  omega

/-! ### The conditional reduction -/

/-- **Conditional reduction.** A width-3 decider in OpenAI's sense, together with a
polynomial-overhead simulation of that machine, refutes `PositiveRateETH`. -/
theorem not_positiveRateETH_of_decider {M : Computation.PrimitiveMachine} {C A : ℝ} {d : ℕ}
    (hC : 0 ≤ C) (hdec : SqrtLog.Statement.DecidesWithBound M 3 C A d)
    {q : FCode} {c e : ℕ} (hsim : PrimitiveSimulation M q c e) :
    ¬ PositiveRateETH := by
  rintro ⟨δ, hδ, hno⟩
  -- the rate given to component A
  set r' : ℝ := δ / (4 * ((e : ℝ) + 1)) with hr'
  have hr'pos : 0 < r' := by positivity
  have her : (e : ℝ) * r' ≤ δ / 4 := by
    rw [hr', mul_div_assoc', div_le_div_iff₀ (by positivity) (by norm_num)]
    nlinarith
  -- component A: the exponential factor of the verified bound at rate `r'`
  obtain ⟨-, K, hK, D', hKb⟩ := runtimeFactor_expBound 1 A 0 zero_le_one hr'pos
  -- the time budget of the verified machine, as a function of `N`
  let S : ℕ → ℝ := fun N =>
    C * ((convTime N : ℝ) + 1) ^ d * (K * ((N : ℝ) + 1) ^ D' * (2 : ℝ) ^ (r' * N))
  let R : ℕ → ℝ := fun N => (convTime N : ℝ) + (c : ℝ) * (S N + (convTime N : ℝ) + 1) ^ e + 1
  -- `R` is subexponential at rate `e * r'`
  have hconv : ExpBound (fun N => (convTime N : ℝ)) 0 := convTime_expBound
  have hconv1 : ExpBound (fun N => (convTime N : ℝ) + 1) 0 :=
    hconv.add_same (ExpBound.const 1 zero_le_one)
  have hS : ExpBound S r' := by
    have h := ((ExpBound.const C hC).mul (hconv1.pow d)).mul
      (((ExpBound.const K hK.le).mul (ExpBound.poly D')).mul (ExpBound.exp r'))
    convert h using 1
    simp
  have hT : ExpBound (fun N => S N + (convTime N : ℝ) + 1) r' :=
    (hS.add_same (hconv.mono_rate hr'pos.le)).add_same
      ((ExpBound.const 1 zero_le_one).mono_rate hr'pos.le)
  have hP : ExpBound (fun N => (c : ℝ) * (S N + (convTime N : ℝ) + 1) ^ e) ((e : ℝ) * r') := by
    have h := (ExpBound.const (c : ℝ) (Nat.cast_nonneg c)).mul (hT.pow e)
    simpa using h
  have her0 : 0 ≤ (e : ℝ) * r' := by positivity
  have hR : ExpBound R ((e : ℝ) * r') :=
    ((hconv.mono_rate her0).add_same hP).add_same ((ExpBound.const 1 zero_le_one).mono_rate her0)
  -- every conventional formula is decided by the two-stage code within `R N`
  have hp : ∀ {N : ℕ} (F : Formula N), ∃ b,
      RBEval (.seq canonicalWordProgram.code q) (treeEncode (minimizeList F.bitList)) (R N)
        (treeEncode b) ∧ (b = true ↔ F.Satisfiable) := by
    intro N F
    obtain ⟨b, s, hout, hb, hs⟩ := hdec _ (canonicalCNF (bitCanonical F)) (bitCanonical_width F)
    refine ⟨b, ?_, hb.trans (bitCanonical_satisfiable F)⟩
    have hL := encodeCNF_length_le_convTime F
    have hn := bitCanonical_varBound_le F
    -- the verified machine's time, bounded in `N`
    have hexp : (2 : ℝ) ^ (A * runtimeScale (varBound (bitCanonical F))) ≤
        K * ((N : ℝ) + 1) ^ D' * (2 : ℝ) ^ (r' * N) := by
      have h := hKb (varBound (bitCanonical F))
      simp only [pow_zero, mul_one, one_mul] at h
      refine h.trans ?_
      have hnR : (varBound (bitCanonical F) : ℝ) ≤ N := by exact_mod_cast hn
      gcongr
      · norm_num
    have hsS : (s : ℝ) ≤ S N := by
      refine hs.trans ?_
      unfold runtimeBound Encoding.formulaBitLength
      have hLR : ((Encoding.encodeCNF (canonicalCNF (bitCanonical F))).length : ℝ) ≤
          convTime N := by exact_mod_cast hL
      show _ ≤ C * ((convTime N : ℝ) + 1) ^ d * (K * ((N : ℝ) + 1) ^ D' * (2 : ℝ) ^ (r' * N))
      gcongr
    have hLR : ((Encoding.encodeCNF (canonicalCNF (bitCanonical F))).length : ℝ) ≤
        convTime N := by exact_mod_cast hL
    refine (converter_seq (S := fun _ =>
        ((c * (s + (Encoding.encodeCNF (canonicalCNF (bitCanonical F))).length + 1) ^ e : ℕ) : ℝ))
        F (hsim _ b s hout)).mono ?_
    show _ ≤ (convTime N : ℝ) + (c : ℝ) * (S N + (convTime N : ℝ) + 1) ^ e + 1
    push_cast
    gcongr
  -- `sat_code_rate` with rate `2 (e r') + δ/2 ≤ δ`
  obtain ⟨C', hC', hSAT⟩ := sat_code_rate _ R ((e : ℝ) * r') her0 hR hp (δ / 2) (by positivity)
  exact hno ⟨(satCode (.seq canonicalWordProgram.code q)).decision, C',
    2 * normalizeProgram.degree + 2, hC', hSAT.rate_mono hC'.le (by linarith)⟩

/-- **Conditional reduction from `Feasible 3`.** -/
theorem not_positiveRateETH_of_feasible_three_of_simulation
    (h : SqrtLog.Statement.Feasible 3) (hsim : SimulationHypothesis) : ¬ PositiveRateETH := by
  obtain ⟨M, C, A, d, hC, -, -, hdec⟩ := h
  obtain ⟨q, c, e, hq⟩ := hsim M
  exact not_positiveRateETH_of_decider hC.le hdec hq

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.PrimitiveSimulation
#print axioms OAI.Bridges.ETH.SimulationHypothesis
#print axioms OAI.Bridges.ETH.encodeCNF_length_le_convTime
#print axioms OAI.Bridges.ETH.not_positiveRateETH_of_decider
#print axioms OAI.Bridges.ETH.not_positiveRateETH_of_feasible_three_of_simulation
