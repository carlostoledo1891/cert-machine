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
  (s_k > 0 for every k ≥ 3) fails in this model;
* the #ETH bridge `not_sharpEth_of_mainTheorem`: Anthropic's `MainTheorem` (one machine counts the
  satisfying assignments) implies that the counting hypothesis #ETH (`ETHBridge.SharpETH`) fails in
  Anthropic's counting model (`countModel`), where the count is read as Anthropic writes it, in
  `binary n`, on the formulas `MainTheorem` speaks of.
-/

namespace ETHBridge.Anthropic

open Filter Topology
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

/-! ### #ETH: Anthropic's counting model

`MainTheorem` is a counting statement: one machine outputs `numSat φ`, the number of satisfying
assignments (`CountsWithin`). Anthropic's convention for it, followed here:

* a machine is a `TM2ComputableAux Bool Bool` with every stack alphabet finite, as in `model`;
* the input word is `encInput k φ`: 1ᵏ 0 followed by `encClauses k φ` (k is a part of the input);
* "halts within t steps with the number c written on its output" is `TM2OutputsInTime` with output
  `binary n c`, the lowest n + 1 bits of c, lowest bit first, written through the machine's output
  alphabet (a count of assignments of n variables is at most 2ⁿ, so nothing of it is lost);
* the #k-SAT instances are the formulas `MainTheorem` speaks of: `IsKCNF k φ` (clauses of at most k
  literals, none written twice), at least two clauses, at least four variables, and every variable
  occurring (`AllOccur`). `MainResults.lean` says of every other input word that "nothing is said",
  so this is the class on which its machine is claimed to count. The other k-CNFs (fewer than four
  variables, fewer than two clauses, a variable that does not occur) reduce to these by standard
  steps (a finite table for each fixed k; a closed form; a variable that occurs nowhere doubles the
  count) that are NOT formalized here: #ETH in this model is #ETH on that class.

The analysis: `timeMin C k m n` is at most ⌊2^{C·expN k n}⌋, and C·expN k n =
C·k²·n·lg lg n/√(lg n) ≤ δ·n for all large n (`eventually_expN_le`), so one c ∈ ℕ gives
2^{C·expN k n} ≤ c·2^{δn} for every n (`bound_le`).
-/

/-- Anthropic's counting model: `FinTM2` machines with finite alphabets, list formulas on the class
`MainTheorem` speaks of, `encInput`, the count in `binary n`. -/
def countModel : ETHBridge.CountModel where
  Machine := Turing.TM2ComputableAux Bool Bool
  CNF n := MainResults.CNF n
  IsKCNF := fun k n (φ : MainResults.CNF n) =>
    MainResults.IsKCNF k φ ∧ 2 ≤ φ.length ∧ 4 ≤ n ∧ MainResults.AllOccur φ
  Satisfies := fun n (φ : MainResults.CNF n) (a : Fin n → Bool) => ∀ C ∈ φ, ∃ l ∈ C, a l.1 = l.2
  encode k _ φ := MainResults.encInput k φ
  Admissible := fun (M : Turing.TM2ComputableAux Bool Bool) => ∀ i, Finite (M.tm.Γ i)
  OutputsCountInTime := fun (M : Turing.TM2ComputableAux Bool Bool) n w c t =>
    Nonempty (Turing.TM2OutputsInTime M.tm (w.map M.inputAlphabet.invFun)
      (some ((MainResults.binary n c).map M.outputAlphabet.invFun)) t)

/-- In Anthropic's counting model the number of satisfying assignments is Anthropic's `numSat`. -/
theorem numSat_eq {n : ℕ} (φ : MainResults.CNF n) :
    ETHBridge.numSat countModel n φ = MainResults.numSat φ := by
  classical
  unfold ETHBridge.numSat MainResults.numSat
  rw [Nat.card_eq_fintype_card, Fintype.card_subtype]
  exact congrArg Finset.card (Finset.filter_congr fun a _ => Iff.rfl)

/-- The generic `CountsKSat` in this model is Anthropic's `CountsWithin`, on the formulas
`MainTheorem` speaks of. -/
theorem countsKSat_iff (k : ℕ) (M : Turing.TM2ComputableAux Bool Bool) (t : ℕ → ℕ) :
    ETHBridge.CountsKSat countModel k M t ↔ ∀ (n : ℕ) (φ : MainResults.CNF n),
      MainResults.IsKCNF k φ ∧ 2 ≤ φ.length ∧ 4 ≤ n ∧ MainResults.AllOccur φ →
        MainResults.CountsWithin M k φ (t n) := by
  constructor
  · intro h n φ hφ
    have h' := h n φ hφ
    rw [numSat_eq φ] at h'
    exact h'
  · intro h n φ hφ
    show countModel.OutputsCountInTime M n (countModel.encode k n φ)
      (ETHBridge.numSat countModel n φ) (t n)
    rw [numSat_eq φ]
    exact h n φ hφ

/-- lg u/√u → 0 as u → ∞ (lg is log₂, Anthropic's `lg`). -/
theorem tendsto_lg_div_sqrt :
    Tendsto (fun u : ℝ => MainResults.lg u / Real.sqrt u) atTop (𝓝 0) := by
  have h := ((isLittleO_log_rpow_atTop (by norm_num : (0 : ℝ) < 1 / 2)).tendsto_div_nhds_zero).div_const
    (Real.log 2)
  rw [zero_div] at h
  refine h.congr fun u => ?_
  show Real.log u / u ^ (1 / 2 : ℝ) / Real.log 2 = MainResults.lg u / Real.sqrt u
  rw [Real.sqrt_eq_rpow]
  unfold MainResults.lg Real.logb
  exact div_right_comm _ _ _

/-- lg(lg n)/√(lg n) → 0 along the natural numbers. -/
theorem tendsto_lg_ratio : Tendsto (fun n : ℕ => MainResults.lg (MainResults.lg n) /
    Real.sqrt (MainResults.lg n)) atTop (𝓝 0) := by
  have hlg : Tendsto (fun n : ℕ => MainResults.lg n) atTop atTop :=
    (Real.tendsto_logb_atTop (by norm_num : (1 : ℝ) < 2)).comp tendsto_natCast_atTop_atTop
  exact tendsto_lg_div_sqrt.comp hlg

/-- For every δ > 0, from some n on, C·k²·n·lg lg n/√(lg n) ≤ δ·n. -/
theorem eventually_expN_le (C k : ℕ) {δ : ℝ} (hδ : 0 < δ) :
    ∃ N : ℕ, ∀ n : ℕ, N ≤ n → (C : ℝ) * MainResults.expN k n ≤ δ * n := by
  have hT := tendsto_lg_ratio.const_mul ((C : ℝ) * (k : ℝ) ^ 2)
  rw [mul_zero] at hT
  obtain ⟨N, hN⟩ := Metric.tendsto_atTop.1 hT δ hδ
  refine ⟨N, fun n hn => ?_⟩
  have h := hN n hn
  rw [Real.dist_eq, sub_zero] at h
  have hlt := (le_abs_self _).trans_lt h
  have heq : (C : ℝ) * MainResults.expN k n = (n : ℝ) * ((C : ℝ) * (k : ℝ) ^ 2 *
      (MainResults.lg (MainResults.lg n) / Real.sqrt (MainResults.lg n))) := by
    unfold MainResults.expN
    ring
  rw [heq, mul_comm δ]
  exact mul_le_mul_of_nonneg_left hlt.le (Nat.cast_nonneg n)

/-- For every δ > 0 there is c ∈ ℕ with 2^{C·expN k n} ≤ c·2^{δn} for EVERY n: past the threshold
of `eventually_expN_le`, c ≥ 1 suffices, and c also exceeds the finitely many values below it. -/
theorem bound_le (C k : ℕ) {δ : ℝ} (hδ : 0 < δ) :
    ∃ c : ℕ, ∀ n : ℕ, (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k n) ≤ c * (2 : ℝ) ^ (δ * n) := by
  obtain ⟨N, hN⟩ := eventually_expN_le C k hδ
  obtain ⟨S, hS⟩ : ∃ S : ℝ, S = ∑ i ∈ Finset.range N,
      (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k i) := ⟨_, rfl⟩
  refine ⟨⌈S + 1⌉₊, fun n => ?_⟩
  have hc : S + 1 ≤ (⌈S + 1⌉₊ : ℝ) := Nat.le_ceil _
  have hS0 : 0 ≤ S := by
    rw [hS]
    exact Finset.sum_nonneg fun i _ => by positivity
  have hpow1 : (1 : ℝ) ≤ (2 : ℝ) ^ (δ * n) :=
    Real.one_le_rpow (by norm_num) (mul_nonneg hδ.le (Nat.cast_nonneg n))
  by_cases hn : N ≤ n
  · calc (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k n)
        ≤ (2 : ℝ) ^ (δ * n) := Real.rpow_le_rpow_of_exponent_le (by norm_num) (hN n hn)
      _ = 1 * (2 : ℝ) ^ (δ * n) := (one_mul _).symm
      _ ≤ (⌈S + 1⌉₊ : ℝ) * (2 : ℝ) ^ (δ * n) :=
          mul_le_mul_of_nonneg_right (by linarith) (by positivity)
  · have hmem : n ∈ Finset.range N := Finset.mem_range.2 (not_le.1 hn)
    have hfn : (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k n) ≤ S := by
      rw [hS]
      exact Finset.single_le_sum (f := fun i : ℕ => (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k i))
        (fun i _ => by positivity) hmem
    calc (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k n)
        ≤ S := hfn
      _ ≤ (⌈S + 1⌉₊ : ℝ) := by linarith
      _ ≤ (⌈S + 1⌉₊ : ℝ) * (2 : ℝ) ^ (δ * n) := le_mul_of_one_le_right (Nat.cast_nonneg _) hpow1

/-- If Anthropic's `MainTheorem` holds, then for every k ≥ 1 and every δ > 0, #k-SAT has an
O(2^{δn}) algorithm in Anthropic's counting model: the theorem's machine, with a constant c ∈ ℕ. -/
theorem countInTime_of_mainTheorem (h : MainResults.MainTheorem) (k : ℕ) (hk : 1 ≤ k) (δ : ℝ≥0)
    (hδ : 0 < δ) : ETHBridge.CountInTime countModel k δ := by
  obtain ⟨M, C, hfin, hM⟩ := h
  have hδ' : (0 : ℝ) < (δ : ℝ) := by exact_mod_cast hδ
  obtain ⟨c, hc⟩ := bound_le C k hδ'
  refine ⟨M, c, hfin,
    (countsKSat_iff k M fun n => ⌊(c : ℝ) * (2 : ℝ) ^ ((δ : ℝ) * n)⌋₊).mpr fun n φ hφ => ?_⟩
  obtain ⟨hK, hm, hn, hocc⟩ := hφ
  obtain ⟨hrun⟩ := hM k n φ hk hK hm hn hocc
  refine ⟨⟨hrun.toEvalsTo, hrun.steps_le_m.trans ?_⟩⟩
  show MainResults.timeMin C k φ.length n ≤ ⌊(c : ℝ) * (2 : ℝ) ^ ((δ : ℝ) * n)⌋₊
  unfold MainResults.timeMin
  refine Nat.floor_mono ?_
  calc (2 : ℝ) ^ ((C : ℝ) * min (MainResults.expM k φ.length) (MainResults.expN k n))
      ≤ (2 : ℝ) ^ ((C : ℝ) * MainResults.expN k n) :=
        Real.rpow_le_rpow_of_exponent_le (by norm_num)
          (mul_le_mul_of_nonneg_left (min_le_right _ _) (Nat.cast_nonneg C))
    _ ≤ c * (2 : ℝ) ^ ((δ : ℝ) * n) := hc n

/-- If Anthropic's `MainTheorem` holds, then s#_k = 0 in Anthropic's counting model, for every
k ≥ 1. -/
theorem sharpS_eq_zero_of_mainTheorem (h : MainResults.MainTheorem) (k : ℕ) (hk : 1 ≤ k) :
    ETHBridge.sharpS countModel k = 0 :=
  ETHBridge.sharpS_eq_zero_of_forall_countInTime countModel k fun δ hδ =>
    countInTime_of_mainTheorem h k hk δ hδ

/-- **The #ETH bridge, Anthropic.** If Anthropic's `MainTheorem` holds, then the counting
Exponential Time Hypothesis `ETHBridge.SharpETH` (s#_k > 0 for every k ≥ 3) is false in Anthropic's
own counting model: `FinTM2` machines with finite alphabets on `encInput`, the count written in
`binary n` (n + 1 bits, lowest first), on the formulas `MainTheorem` speaks of. -/
theorem not_sharpEth_of_mainTheorem (h : MainResults.MainTheorem) :
    ¬ ETHBridge.SharpETH countModel :=
  ETHBridge.not_sharpEth_of_forall_countInTime countModel 3 le_rfl fun δ hδ =>
    countInTime_of_mainTheorem h 3 (by norm_num) δ hδ

end ETHBridge.Anthropic
