import MainResults

/-!
# RPI-378.3a, part 2: asymptotic absorption and the rate `s₃`

Two unconditional facts used by the reduction.

* `PolyBound` and `PolyBound.absorb`: a nonnegative function of `n` bounded by a polynomial is at
  most `c · 2^{εn}` for every `ε > 0`, with a natural-number constant `c`. This is how the
  polynomial factors (input lengths, ParityLifts' `(L+1)^d`, converter and simulation overheads)
  disappear into Anthropic's bound `⌊c · 2^{δn}⌋₊`, which is stated in `n` alone.
* `ethIsFalse_of_forall_inTime`: if `InTime 3 δ` holds for every `δ > 0`, then
  `MainResults.ETHIsFalse`. This unfolds Anthropic's definition `ETH := 0 < s 3`, where `s 3` is
  the infimum of the admissible rates.

Only Mathlib and Anthropic's statement file are imported.
-/

namespace OAI.Bridges.AnthropicETH

open Filter Topology
open scoped NNReal ENNReal

/-! ## Polynomially bounded functions -/

/-- `f` is nonnegative and at most `A (n+1)^e` for some constants `A` and `e`. -/
def PolyBound (f : ℕ → ℝ) : Prop :=
  (∀ n, 0 ≤ f n) ∧ ∃ (A : ℝ) (e : ℕ), ∀ n, f n ≤ A * ((n : ℝ) + 1) ^ e

namespace PolyBound

theorem pow_le_pow_add_left (n : ℕ) (e e' : ℕ) :
    ((n : ℝ) + 1) ^ e ≤ ((n : ℝ) + 1) ^ (e + e') :=
  pow_le_pow_right₀ (by have : (0 : ℝ) ≤ n := Nat.cast_nonneg n; linarith) (Nat.le_add_right e e')

theorem pow_le_pow_add_right (n : ℕ) (e e' : ℕ) :
    ((n : ℝ) + 1) ^ e' ≤ ((n : ℝ) + 1) ^ (e + e') :=
  pow_le_pow_right₀ (by have : (0 : ℝ) ≤ n := Nat.cast_nonneg n; linarith) (Nat.le_add_left e' e)

theorem coeff_nonneg {f : ℕ → ℝ} {A : ℝ} {e : ℕ} (h0 : ∀ n, 0 ≤ f n)
    (h : ∀ n, f n ≤ A * ((n : ℝ) + 1) ^ e) : 0 ≤ A := by
  have := (h0 0).trans (h 0)
  simpa using this

theorem const {c : ℝ} (hc : 0 ≤ c) : PolyBound fun _ => c :=
  ⟨fun _ => hc, c, 0, fun _ => by simp⟩

theorem natCast : PolyBound fun n => (n : ℝ) :=
  ⟨fun n => Nat.cast_nonneg n, 1, 1, fun n => by simp⟩

theorem add {f g : ℕ → ℝ} (hf : PolyBound f) (hg : PolyBound g) : PolyBound fun n => f n + g n := by
  obtain ⟨hf0, A, e, hA⟩ := hf
  obtain ⟨hg0, B, e', hB⟩ := hg
  have hA0 := coeff_nonneg hf0 hA
  have hB0 := coeff_nonneg hg0 hB
  refine ⟨fun n => add_nonneg (hf0 n) (hg0 n), A + B, e + e', fun n => ?_⟩
  have h1 := mul_le_mul_of_nonneg_left (pow_le_pow_add_left n e e') hA0
  have h2 := mul_le_mul_of_nonneg_left (pow_le_pow_add_right n e e') hB0
  have := hA n
  have := hB n
  nlinarith

theorem mul {f g : ℕ → ℝ} (hf : PolyBound f) (hg : PolyBound g) : PolyBound fun n => f n * g n := by
  obtain ⟨hf0, A, e, hA⟩ := hf
  obtain ⟨hg0, B, e', hB⟩ := hg
  have hA0 := coeff_nonneg hf0 hA
  refine ⟨fun n => mul_nonneg (hf0 n) (hg0 n), A * B, e + e', fun n => ?_⟩
  calc f n * g n ≤ (A * ((n : ℝ) + 1) ^ e) * (B * ((n : ℝ) + 1) ^ e') :=
        mul_le_mul (hA n) (hB n) (hg0 n) (mul_nonneg hA0 (pow_nonneg (by positivity) _))
    _ = A * B * ((n : ℝ) + 1) ^ (e + e') := by ring

theorem pow {f : ℕ → ℝ} (hf : PolyBound f) (k : ℕ) : PolyBound fun n => f n ^ k := by
  induction k with
  | zero => simpa using const (c := 1) zero_le_one
  | succ k ih => simpa [pow_succ] using ih.mul hf

theorem const_mul {f : ℕ → ℝ} (hf : PolyBound f) {c : ℝ} (hc : 0 ≤ c) :
    PolyBound fun n => c * f n :=
  (const hc).mul hf

/-- For every `ε > 0` there is `B` with `(n+1)^e ≤ B · 2^{εn}` for all `n`. -/
theorem exists_pow_le_rpow (e : ℕ) {ε : ℝ} (hε : 0 < ε) :
    ∃ B : ℝ, ∀ n : ℕ, ((n : ℝ) + 1) ^ e ≤ B * (2 : ℝ) ^ (ε * n) := by
  set r : ℝ := (2 : ℝ) ^ ε
  have hr : 1 < r := Real.one_lt_rpow (by norm_num) hε
  have hr0 : 0 < r := by linarith
  have hpow : ∀ n : ℕ, (2 : ℝ) ^ (ε * n) = r ^ n := fun n => by
    rw [Real.rpow_mul (by norm_num), Real.rpow_natCast]
  -- `(n+1)^e / r^(n+1) → 0`, so the sequence `(n+1)^e / r^n` is bounded.
  have h0 := (tendsto_pow_const_div_const_pow_of_one_lt e hr).comp (tendsto_add_atTop_nat 1)
  have h1 : Tendsto (fun n : ℕ => r * (((n + 1 : ℕ) : ℝ) ^ e / r ^ (n + 1))) atTop (𝓝 (r * 0)) :=
    h0.const_mul r
  rw [mul_zero] at h1
  obtain ⟨B, hB⟩ := h1.bddAbove_range
  refine ⟨B, fun n => ?_⟩
  have hb := hB ⟨n, rfl⟩
  have hrn : 0 < r ^ n := pow_pos hr0 n
  have heq : r * (((n + 1 : ℕ) : ℝ) ^ e / r ^ (n + 1)) = ((n : ℝ) + 1) ^ e / r ^ n := by
    push_cast
    field_simp
    ring
  simp only [heq] at hb
  rw [hpow, ← div_le_iff₀ hrn]
  exact hb

/-- **Absorption.** A polynomially bounded function is at most `c · 2^{εn}` for every `ε > 0`,
with `c` a natural number. -/
theorem absorb {f : ℕ → ℝ} (hf : PolyBound f) {ε : ℝ} (hε : 0 < ε) :
    ∃ c : ℕ, ∀ n, f n ≤ c * (2 : ℝ) ^ (ε * n) := by
  obtain ⟨-, A, e, hA⟩ := hf
  obtain ⟨B, hB⟩ := exists_pow_le_rpow e hε
  refine ⟨⌈|A| * |B|⌉₊, fun n => ?_⟩
  have hE : 0 ≤ (2 : ℝ) ^ (ε * n) := by positivity
  have hp : 0 ≤ ((n : ℝ) + 1) ^ e := by positivity
  calc f n ≤ A * ((n : ℝ) + 1) ^ e := hA n
    _ ≤ |A| * ((n : ℝ) + 1) ^ e := mul_le_mul_of_nonneg_right (le_abs_self A) hp
    _ ≤ |A| * (B * (2 : ℝ) ^ (ε * n)) := mul_le_mul_of_nonneg_left (hB n) (abs_nonneg A)
    _ ≤ |A| * (|B| * (2 : ℝ) ^ (ε * n)) :=
        mul_le_mul_of_nonneg_left (mul_le_mul_of_nonneg_right (le_abs_self B) hE) (abs_nonneg A)
    _ = (|A| * |B|) * (2 : ℝ) ^ (ε * n) := by ring
    _ ≤ (⌈|A| * |B|⌉₊ : ℝ) * (2 : ℝ) ^ (ε * n) :=
        mul_le_mul_of_nonneg_right (Nat.le_ceil _) hE

end PolyBound

/-! ## From admissible rates to `ETHIsFalse` -/

/-- If Anthropic's `InTime 3 δ` holds for every positive rate `δ`, then `s 3 = 0`, which is
`MainResults.ETHIsFalse`. -/
theorem ethIsFalse_of_forall_inTime (h : ∀ δ : ℝ≥0, 0 < δ → MainResults.InTime 3 δ) :
    MainResults.ETHIsFalse := by
  intro hETH
  obtain ⟨r, hr0, hr⟩ := ENNReal.lt_iff_exists_nnreal_btwn.1 hETH
  have hrpos : 0 < r := by exact_mod_cast hr0
  have hle : MainResults.s 3 ≤ (r : ℝ≥0∞) := iInf₂_le r (h r hrpos)
  exact absurd hr (not_lt.2 hle)

end OAI.Bridges.AnthropicETH
