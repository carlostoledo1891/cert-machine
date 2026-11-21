import Mathlib

/-!
# An independently written Riemann Hypothesis, proved equivalent to Mathlib's (cert-machine, 2026-11-21)

Mathlib alone, at the release's pin (0df444a3). `RHStrip` is the textbook form "every zero of ζ in the open critical
strip lies on the critical line", written here without Mathlib's exclusions; `rhStrip_iff` proves it equivalent to
Mathlib's `RiemannHypothesis` (the statement Alpöge's release proves). The step that carries the content is
`re_mem_strip_of_nontrivial`: a zero of ζ that is neither a trivial zero −2(n+1) nor the point 1 lies in the open strip
— from the zero-free region Re s ≥ 1 (`riemannZeta_ne_zero_of_one_le_re`) and the functional equation
(`riemannZeta_one_sub`) with Γ and (2π)^(−s) nonzero, so that only cos(π s / 2) can vanish.
-/

namespace CertMachine.Spec

open Complex

/-- RH, written independently: every zero of ζ with 0 < Re s < 1 has Re s = 1/2. -/
def RHStrip : Prop :=
  ∀ s : ℂ, 0 < s.re → s.re < 1 → riemannZeta s = 0 → s.re = 1 / 2

/-- A zero of ζ that is not a trivial zero and not the point 1 lies in the open critical strip. -/
theorem re_mem_strip_of_nontrivial {s : ℂ} (hz : riemannZeta s = 0)
    (ht : ¬∃ n : ℕ, s = -2 * (n + 1)) (h1 : s ≠ 1) : 0 < s.re ∧ s.re < 1 := by
  refine ⟨?_, ?_⟩
  · by_contra hle
    push_neg at hle
    by_cases h0 : s = 0
    · subst h0
      rw [riemannZeta_zero] at hz
      norm_num at hz
    set w : ℂ := 1 - s with hw
    have hwre : 1 ≤ w.re := by
      simp only [hw, sub_re, one_re]
      linarith
    have hwn : ∀ n : ℕ, w ≠ -n := by
      intro n h
      have h' := congrArg Complex.re h
      simp only [neg_re, natCast_re] at h'
      have : (0 : ℝ) ≤ n := Nat.cast_nonneg n
      linarith
    have hw1 : w ≠ 1 := by
      intro h
      apply h0
      have : s = 1 - w := by rw [hw]; ring
      rw [this, h]
      ring
    have fe := riemannZeta_one_sub hwn hw1
    have hsw : 1 - w = s := by rw [hw]; ring
    rw [hsw, hz] at fe
    have hζw : riemannZeta w ≠ 0 := riemannZeta_ne_zero_of_one_le_re hwre
    have hΓ : Gamma w ≠ 0 := Complex.Gamma_ne_zero hwn
    have hπ : (Real.pi : ℂ) ≠ 0 := by exact_mod_cast Real.pi_ne_zero
    have h2π : (2 * (Real.pi : ℂ)) ≠ 0 := mul_ne_zero two_ne_zero hπ
    have hpow : (2 * (Real.pi : ℂ)) ^ (-w) ≠ 0 := by
      rw [Ne, cpow_eq_zero_iff]
      exact fun h => h2π h.1
    have hcos : cos ((Real.pi : ℂ) * w / 2) = 0 := by
      have h := fe.symm
      simp only [mul_eq_zero] at h
      rcases h with (((h | h) | h) | h) | h
      · exact absurd h two_ne_zero
      · exact absurd h hpow
      · exact absurd h hΓ
      · exact h
      · exact absurd h hζw
    obtain ⟨k, hk⟩ := cos_eq_zero_iff.mp hcos
    have hwk : w = 2 * (k : ℂ) + 1 := by
      apply mul_left_cancel₀ hπ
      linear_combination 2 * hk
    have hkre : (1 : ℝ) ≤ 2 * (k : ℝ) + 1 := by
      have h' := congrArg Complex.re hwk
      simp only [add_re, mul_re, intCast_re, intCast_im, one_re, re_ofNat, im_ofNat, mul_zero, sub_zero] at h'
      linarith
    have hk0 : (0 : ℤ) ≤ k := by
      have : (0 : ℝ) ≤ k := by linarith
      exact_mod_cast this
    have hkne : k ≠ 0 := by
      rintro rfl
      apply hw1
      rw [hwk]
      simp
    obtain ⟨m, rfl⟩ := Int.eq_ofNat_of_zero_le hk0
    obtain ⟨n, rfl⟩ : ∃ n, m = n + 1 := Nat.exists_eq_succ_of_ne_zero (by omega)
    apply ht
    refine ⟨n, ?_⟩
    have : s = 1 - w := by rw [hw]; ring
    rw [this, hwk]
    push_cast
    ring
  · by_contra hge
    push_neg at hge
    exact riemannZeta_ne_zero_of_one_le_re hge hz

/-- The independently written statement is equivalent to Mathlib's `RiemannHypothesis`. -/
theorem rhStrip_iff : RHStrip ↔ RiemannHypothesis := by
  constructor
  · intro h s hz ht h1
    obtain ⟨h0, h1'⟩ := re_mem_strip_of_nontrivial hz ht h1
    exact h s h0 h1' hz
  · intro h s h0 h1 hz
    refine h s hz ?_ ?_
    · rintro ⟨n, rfl⟩
      have hre : ((-2 : ℂ) * ((n : ℂ) + 1)).re = -2 * ((n : ℝ) + 1) := by simp
      rw [hre] at h0
      have : (0 : ℝ) ≤ n := Nat.cast_nonneg n
      linarith
    · rintro rfl
      simp at h1

end CertMachine.Spec
