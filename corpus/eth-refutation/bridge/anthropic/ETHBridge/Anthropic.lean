import MainResults
import ETHBridge.Generic

/-!
# Instantiation A: Anthropic's machine and encoding

cert-machine, `corpus/eth-refutation/bridge`. Written here; nothing in it is taken from Anthropic's
proof. The model is the one Anthropic's trusted file defines (`MainResults.lean`, the pinned bytes
of `eth/MainResults.lean` at 16a5ce41): a machine is Mathlib's `Turing.TM2ComputableAux Bool Bool`,
the admissible ones have every stack alphabet finite, a formula is a `MainResults.CNF n`, the k-SAT
instances are those of `MainResults.IsKCNF k`, the input word is `MainResults.encClauses k`, and
"halts within t steps with answer b" is `Turing.TM2OutputsInTime` with output `[b]`.

What is proved:

* the generic definitions, instantiated with this model, ARE Anthropic's: `DecidesKSat`, `InTime`
  and `s` agree with theirs by definition (`decidesKSat_iff`, `inTime_iff`, `s_eq`), and their
  `ETH` is the k = 3 instance of the textbook quantifier (`eth_three_iff`);
* `ETHIsFalse` says exactly s₃ = 0 for the generic s (`ethIsFalse_iff`);
* the bridge `not_eth_of_ethIsFalse`: Anthropic's `ETHIsFalse` implies that the textbook ETH
  (s_k > 0 for every k ≥ 3) fails in this model.
-/

namespace ETHBridge.Anthropic

open scoped NNReal ENNReal

/-- Anthropic's model: `FinTM2` machines with finite alphabets, list formulas, `encClauses`. -/
def model : ETHBridge.Model where
  Machine := Turing.TM2ComputableAux Bool Bool
  CNF n := MainResults.CNF n
  IsKCNF k _ φ := MainResults.IsKCNF k φ
  Satisfiable _ φ := MainResults.Satisfiable φ
  encode k _ φ := MainResults.encClauses k φ
  Admissible := fun (M : Turing.TM2ComputableAux Bool Bool) => ∀ i, Finite (M.tm.Γ i)
  OutputsInTime := fun (M : Turing.TM2ComputableAux Bool Bool) w b t =>
    Nonempty (Turing.TM2OutputsInTime M.tm (w.map M.inputAlphabet.invFun)
      (some ([b].map M.outputAlphabet.invFun)) t)

/-- The generic `DecidesKSat` in this model is Anthropic's, by definition. -/
theorem decidesKSat_iff (k : ℕ) (M : Turing.TM2ComputableAux Bool Bool) (t : ℕ → ℕ) :
    ETHBridge.DecidesKSat model k M t ↔ MainResults.DecidesKSat k M t := Iff.rfl

/-- The generic `InTime` in this model is Anthropic's, by definition. -/
theorem inTime_iff (k : ℕ) (δ : ℝ≥0) :
    ETHBridge.InTime model k δ ↔ MainResults.InTime k δ := Iff.rfl

/-- The generic s_k in this model is Anthropic's s_k, by definition. -/
theorem s_eq (k : ℕ) : ETHBridge.s model k = MainResults.s k := rfl

/-- Anthropic's `ETH` is the k = 3 instance of the textbook quantifier. -/
theorem eth_three_iff : MainResults.ETH ↔ 0 < ETHBridge.s model 3 := Iff.rfl

/-- Anthropic's `ETHIsFalse` says exactly s₃ = 0. -/
theorem ethIsFalse_iff : MainResults.ETHIsFalse ↔ ETHBridge.s model 3 = 0 := by
  show ¬ (0 < MainResults.s 3) ↔ _
  rw [s_eq, not_lt, nonpos_iff_eq_zero]

/-- The textbook ETH (every k ≥ 3) implies Anthropic's (k = 3). -/
theorem eth_of_eth : ETHBridge.ETH model → MainResults.ETH := fun h => h 3 le_rfl

/-- **The bridge, Anthropic.** Anthropic's `ETHIsFalse` implies that the Exponential Time
Hypothesis, in the textbook form `ETHBridge.ETH` (s_k > 0 for every k ≥ 3), is false in Anthropic's
own model of computation and encoding. -/
theorem not_eth_of_ethIsFalse (h : MainResults.ETHIsFalse) : ¬ ETHBridge.ETH model :=
  fun hE => h (eth_of_eth hE)

end ETHBridge.Anthropic
