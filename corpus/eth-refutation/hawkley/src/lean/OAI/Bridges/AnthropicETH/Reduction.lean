import OAI.Bridges.AnthropicETH.Lengths
import OAI.Bridges.AnthropicETH.Asymptotics

/-!
# RPI-378.3a: conditional reduction `¬ PositiveRateETH → MainResults.ETHIsFalse`

**What this file proves.** Given two named machine-transfer hypotheses, OpenAI ParityLifts'
`¬ PositiveRateETH` implies Anthropic's `MainResults.ETHIsFalse`:

```
ethIsFalse_of_not_positiveRateETH :
  SimulationHypothesis → ConverterHypothesis →
    ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse
```

The proof carries the quantifiers across (one machine per rate on both sides), the encoding-length
bounds (`Lengths.lean`), and the asymptotic absorption (`Asymptotics.lean`). It imports only the
two definition sets: ParityLifts' `SATChoice` closure and Anthropic's `MainResults.lean`, copied
byte for byte. Neither Anthropic's proof of `ethIsFalse` nor OpenAI's SAT theorem is in the
environment of this file.

**What stays conditional.** The two hypotheses below. Each is a statement about transforming
machines; neither mentions satisfiability, ETH, or any running-time bound for SAT.

* `SimulationHypothesis` (Patch 2): every ParityLifts multitape machine has a Mathlib `FinTM2`
  counterpart with finite alphabets that reaches Mathlib's halting convention (`haltList`: output
  stack `[b]`, all other stacks empty, state reset) within `K (|x| + s + 1)` steps whenever the
  original emits `b` at step `s`. The constant `K` may depend on the machine.
* `ConverterHypothesis` (Patch 3): one exponent `D`, the same for every machine, such that every
  ParityLifts machine `M` has a ParityLifts machine `M'` that reads Anthropic's word
  `encClauses 3 φ` and emits what `M` emits on `encodeFormula (toFormula φ)`, within
  `C (|encClauses 3 φ| + s + 1)^D` steps. The uniform `D` is essential: the machine supplied by
  `¬ PositiveRateETH` changes with the rate, and the rate is divided by `D + 1`. ParityLifts'
  `Machine.preprocess_run` provides exactly this shape (its degree `preprocessingDegree` is
  independent of the machine), so Patch 3 reduces to writing one `FCode` converter.
-/

namespace OAI.Bridges.AnthropicETH

open OAI.ParityWL.Complexity
open scoped NNReal

/-! ## The two machine-transfer hypotheses -/

/-- **Hypothesis H1 (Patch 2).** Linear-time simulation of ParityLifts' multitape machines by
Mathlib's `FinTM2`, in the input/output convention of `Turing.TM2OutputsInTime`. -/
def SimulationHypothesis : Prop :=
  ∀ M : Machine, ∃ (N : Turing.TM2ComputableAux Bool Bool) (K : ℕ), (∀ i, Finite (N.tm.Γ i)) ∧
    ∀ (x : List Bool) (s : ℕ) (b : Bool), Emits M x s b →
      Nonempty (Turing.TM2OutputsInTime N.tm (x.map N.inputAlphabet.invFun)
        (some ([b].map N.outputAlphabet.invFun)) (K * (x.length + s + 1)))

/-- **Hypothesis H2 (Patch 3).** Front end from Anthropic's input word to ParityLifts' input
word, composed with any machine, with polynomial overhead of one fixed degree `D`. -/
def ConverterHypothesis : Prop :=
  ∃ D : ℕ, ∀ M : Machine, ∃ (M' : Machine) (C : ℕ),
    ∀ (n : ℕ) (φ : MainResults.CNF n), MainResults.IsKCNF 3 φ →
      ∀ (s : ℕ) (b : Bool), Emits M (encodeFormula (toFormula φ)) s b →
        ∃ r, Emits M' (MainResults.encClauses 3 φ) r b ∧
          r ≤ C * ((MainResults.encClauses 3 φ).length + s + 1) ^ D

/-! ## Mathlib's time bound is monotone -/

/-- A run within `m` steps is a run within any `m' ≥ m` steps. (`TM2OutputsInTime` is data, a
`Type`, so this is a `def`.) -/
def outputsInTime_mono {tm : Turing.FinTM2} {l : List (tm.Γ tm.k₀)}
    {l' : Option (List (tm.Γ tm.k₁))} {m m' : ℕ} (h : Turing.TM2OutputsInTime tm l l' m)
    (hm : m ≤ m') : Turing.TM2OutputsInTime tm l l' m' :=
  { h with steps_le_m := h.steps_le_m.trans hm }

/-! ## The running-time chain -/

/-- The polynomial factor collected from the three stages, as a function of `n`. -/
noncomputable def chainFactor (K C₂ D d : ℕ) (C : ℝ) (n : ℕ) : ℝ :=
  K * ((4 * (2 * (n : ℝ) + 1) ^ 4 + 1) +
    C₂ * (4 * (2 * (n : ℝ) + 1) ^ 4 + C * (20 * (2 * (n : ℝ) + 1) ^ 4 + 1) ^ d + 1) ^ D)

theorem chainFactor_polyBound (K C₂ D d : ℕ) {C : ℝ} (hC : 0 ≤ C) :
    PolyBound (chainFactor K C₂ D d C) := by
  have pX : PolyBound fun n => 2 * (n : ℝ) + 1 :=
    (PolyBound.natCast.const_mul (by norm_num : (0 : ℝ) ≤ 2)).add (PolyBound.const zero_le_one)
  have pX4 := pX.pow 4
  have pQ := ((pX4.const_mul (by norm_num : (0 : ℝ) ≤ 4)).add
    ((((pX4.const_mul (by norm_num : (0 : ℝ) ≤ 20)).add (PolyBound.const zero_le_one)).pow d).const_mul
      hC)).add (PolyBound.const zero_le_one)
  have pF := (((pX4.const_mul (by norm_num : (0 : ℝ) ≤ 4)).add (PolyBound.const zero_le_one)).add
    ((pQ.pow D).const_mul (Nat.cast_nonneg C₂))).const_mul (Nat.cast_nonneg K)
  exact pF

/-- Real-arithmetic core: the three stage bounds compose to `chainFactor · E^D`, where
`E = 2^{δn} ≥ 1`. -/
theorem time_chain {K C₂ D d n : ℕ} {C E LA LP s r t : ℝ} (hC : 0 < C) (hE : 1 ≤ E)
    (hLA0 : 0 ≤ LA) (hLP0 : 0 ≤ LP) (hs0 : 0 ≤ s)
    (hLA : LA ≤ 4 * (2 * (n : ℝ) + 1) ^ 4) (hLP : LP ≤ 20 * (2 * (n : ℝ) + 1) ^ 4)
    (hs : s ≤ C * (LP + 1) ^ d * E) (hr : r ≤ C₂ * (LA + s + 1) ^ D)
    (ht : t ≤ K * (LA + r + 1)) :
    t ≤ chainFactor K C₂ D d C n * E ^ D := by
  set X4 := (2 * (n : ℝ) + 1) ^ 4
  set Q := 4 * X4 + C * (20 * X4 + 1) ^ d + 1
  have hX4 : 0 ≤ X4 := by positivity
  have hE0 : 0 ≤ E := by linarith
  have hED : 1 ≤ E ^ D := one_le_pow₀ hE
  have hK : (0 : ℝ) ≤ K := Nat.cast_nonneg K
  have hC₂ : (0 : ℝ) ≤ C₂ := Nat.cast_nonneg C₂
  -- stage 1: the ParityLifts machine
  have hs' : s ≤ C * (20 * X4 + 1) ^ d * E := by
    have : (LP + 1) ^ d ≤ (20 * X4 + 1) ^ d := pow_le_pow_left₀ (by linarith) (by linarith) d
    calc s ≤ C * (LP + 1) ^ d * E := hs
      _ ≤ C * (20 * X4 + 1) ^ d * E := by gcongr
  have hQE : LA + s + 1 ≤ Q * E := by
    have hP : 0 ≤ C * (20 * X4 + 1) ^ d := by positivity
    have : 4 * X4 + 1 ≤ (4 * X4 + 1) * E := by nlinarith
    nlinarith
  -- stage 2: the converter
  have hr' : r ≤ C₂ * Q ^ D * E ^ D := by
    have h0 : 0 ≤ LA + s + 1 := by linarith
    calc r ≤ C₂ * (LA + s + 1) ^ D := hr
      _ ≤ C₂ * (Q * E) ^ D := by gcongr
      _ = C₂ * Q ^ D * E ^ D := by rw [mul_pow, mul_assoc]
  -- stage 3: the simulation
  have hQD : 0 ≤ C₂ * Q ^ D := mul_nonneg hC₂ (pow_nonneg (by positivity) D)
  unfold chainFactor
  calc t ≤ K * (LA + r + 1) := ht
    _ ≤ K * ((4 * X4 + 1) * E ^ D + C₂ * Q ^ D * E ^ D) := by
        apply mul_le_mul_of_nonneg_left _ hK
        have : 4 * X4 + 1 ≤ (4 * X4 + 1) * E ^ D := by nlinarith
        linarith
    _ = K * ((4 * X4 + 1) + C₂ * Q ^ D) * E ^ D := by ring

/-! ## The reduction -/

/-- **Quantifier transfer.** Under H1 and H2, `¬ PositiveRateETH` gives Anthropic's `InTime 3 δ`
for every positive rate `δ`. -/
theorem inTime_of_not_positiveRateETH (hsim : SimulationHypothesis)
    (hconv : ConverterHypothesis) (hP : ¬ PositiveRateETH) :
    ∀ δ' : ℝ≥0, 0 < δ' → MainResults.InTime 3 δ' := by
  intro δ' hδ'
  obtain ⟨D, hD⟩ := hconv
  have hδ'r : (0 : ℝ) < δ' := by exact_mod_cast hδ'
  -- The ParityLifts rate: small enough that `D · δ ≤ δ' / 2`.
  set δ : ℝ := (δ' : ℝ) / (2 * ((D : ℝ) + 1))
  have hδ : 0 < δ := by positivity
  have hδD : δ * D ≤ (δ' : ℝ) / 2 := by
    have h1 : δ * ((D : ℝ) + 1) = (δ' : ℝ) / 2 := by
      simp only [δ]; field_simp
    nlinarith
  -- `¬ PositiveRateETH` at rate `δ`: a machine `M` with constants `C`, `d`.
  have hP' : ∃ (M : Machine) (C : ℝ) (d : ℕ), 0 < C ∧
      SATTimeBound M (fun N L => C * (L + 1 : ℝ) ^ d * (2 : ℝ) ^ (δ * N)) := by
    by_contra hcon
    exact hP ⟨δ, hδ, hcon⟩
  obtain ⟨M, C, d, hC, hM⟩ := hP'
  obtain ⟨M', C₂, hM'⟩ := hD M
  obtain ⟨N, K, hfin, hN⟩ := hsim M'
  -- Absorb the polynomial factor at rate `δ' / 2`.
  obtain ⟨c, hc⟩ := (chainFactor_polyBound K C₂ D d hC.le).absorb (half_pos hδ'r)
  refine ⟨N, c, hfin, fun n φ hφ => ?_⟩
  obtain ⟨s, b, hs, hb, hst⟩ := hM n (toFormula φ)
  obtain ⟨r, hr, hrle⟩ := hM' n φ hφ s b hs
  obtain ⟨hout⟩ := hN _ r b hr
  refine ⟨b, hb.trans (satisfiable_toFormula_iff hφ), ⟨outputsInTime_mono hout ?_⟩⟩
  apply Nat.le_floor
  -- the real-valued estimate
  set E : ℝ := (2 : ℝ) ^ (δ * n)
  have hE : 1 ≤ E := Real.one_le_rpow (by norm_num) (by positivity)
  have hLA := encClauses_length_le hφ
  have hLP := encodeFormula_toFormula_length_le hφ
  have hchain := time_chain (K := K) (C₂ := C₂) (D := D) (d := d) (n := n) (C := C) (E := E)
    (LA := ((MainResults.encClauses 3 φ).length : ℝ))
    (LP := ((encodeFormula (toFormula φ)).length : ℝ))
    (s := (s : ℝ)) (r := (r : ℝ))
    (t := ((K * ((MainResults.encClauses 3 φ).length + r + 1) : ℕ) : ℝ))
    hC hE (Nat.cast_nonneg _) (Nat.cast_nonneg _) (Nat.cast_nonneg _)
    (by exact_mod_cast hLA) (by exact_mod_cast hLP) hst (by exact_mod_cast hrle)
    (by push_cast; exact le_refl _)
  have hED : E ^ D ≤ (2 : ℝ) ^ (((δ' : ℝ) / 2) * n) := by
    simp only [E]
    rw [← Real.rpow_natCast, ← Real.rpow_mul (by norm_num)]
    apply Real.rpow_le_rpow_of_exponent_le (by norm_num)
    have hn : (0 : ℝ) ≤ n := Nat.cast_nonneg n
    nlinarith
  have hF0 : 0 ≤ chainFactor K C₂ D d C n := (chainFactor_polyBound K C₂ D d hC.le).1 n
  have hcn := hc n
  calc ((K * ((MainResults.encClauses 3 φ).length + r + 1) : ℕ) : ℝ)
      ≤ chainFactor K C₂ D d C n * E ^ D := hchain
    _ ≤ (c * (2 : ℝ) ^ (((δ' : ℝ) / 2) * n)) * (2 : ℝ) ^ (((δ' : ℝ) / 2) * n) :=
        mul_le_mul hcn hED (by positivity) (by positivity)
    _ = c * (2 : ℝ) ^ ((δ' : ℝ) * n) := by
        rw [mul_assoc, ← Real.rpow_add (by norm_num)]
        ring_nf

/-- **RPI-378.3a.** Under the simulation hypothesis H1 and the converter hypothesis H2, OpenAI
ParityLifts' `¬ PositiveRateETH` implies Anthropic's `MainResults.ETHIsFalse`. -/
theorem ethIsFalse_of_not_positiveRateETH (hsim : SimulationHypothesis)
    (hconv : ConverterHypothesis) :
    ¬ PositiveRateETH → MainResults.ETHIsFalse := fun hP =>
  ethIsFalse_of_forall_inTime (inTime_of_not_positiveRateETH hsim hconv hP)

end OAI.Bridges.AnthropicETH
