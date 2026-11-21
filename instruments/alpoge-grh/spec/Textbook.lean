import Mathlib
import Spec
import Challenge

/-!
# The textbook statements of RH and GRH, proved equivalent to the release's (cert-machine, 2026-11-21, amendment A12)

Mathlib alone, at the release's pin (0df444a3), beside `Spec.lean` (SPEC) and cert-machine's `Challenge.lean` (used
for its definition `DirichletLZerosOnLine` only, the constant Comparator matches in S1; its `sorry` theorems are never
used, as `#print axioms` shows).

ζ and L(·, χ) are characterised here WITHOUT Mathlib's `riemannZeta` and `DirichletCharacter.LFunction`: a function
holomorphic on ℂ ∖ {1} that equals the Dirichlet series Σ_{n ≥ 1} n^{-s} (resp. Σ_{n ≥ 1} χ(n) n^{-s}) wherever
Re s > 1, the series summed as `HasSum` (unconditional convergence, no junk value). The file proves that Mathlib's
functions meet the characterisations (so the statements are not vacuous), that the characterisations determine the
function on ℂ ∖ {1} (the identity theorem), and that the release's statements are equivalent to the textbook ones.
-/

namespace CertMachine.Textbook

open Complex

/-- The textbook ζ: holomorphic on ℂ ∖ {1}, equal to Σ_{n ≥ 1} n^{-s} for Re s > 1. -/
def IsTextbookZeta (f : ℂ → ℂ) : Prop :=
  DifferentiableOn ℂ f {1}ᶜ ∧
    ∀ s : ℂ, 1 < s.re → HasSum (fun n : ℕ => 1 / ((n + 1 : ℕ) : ℂ) ^ s) (f s)

/-- The textbook Dirichlet L-function of χ: holomorphic on ℂ ∖ {1}, equal to Σ_{n ≥ 1} χ(n) n^{-s} for Re s > 1. -/
def IsTextbookL {N : ℕ} (χ : DirichletCharacter ℂ N) (f : ℂ → ℂ) : Prop :=
  DifferentiableOn ℂ f {1}ᶜ ∧
    ∀ s : ℂ, 1 < s.re → HasSum (fun n : ℕ => χ ((n + 1 : ℕ) : ZMod N) / ((n + 1 : ℕ) : ℂ) ^ s) (f s)

/-- RH, textbook form: every zero of ζ in the critical strip 0 < Re s < 1 lies on Re s = 1/2. -/
def TextbookRH : Prop :=
  ∀ f : ℂ → ℂ, IsTextbookZeta f → ∀ s : ℂ, 0 < s.re → s.re < 1 → f s = 0 → s.re = 1 / 2

/-- GRH for Dirichlet L-functions, textbook form: for every modulus N ≥ 1 and every character χ mod N, every zero of
L(s, χ) in the critical strip lies on Re s = 1/2. -/
def TextbookGRH : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (f : ℂ → ℂ), IsTextbookL χ f →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → f s = 0 → s.re = 1 / 2

/-- An L-series sum, written over n ≥ 1 as in the statements above. -/
private lemma hasSum_succ {f : ℕ → ℂ} {s a : ℂ} (h : LSeriesHasSum f s a) :
    HasSum (fun n : ℕ => f (n + 1) / ((n + 1 : ℕ) : ℂ) ^ s) a := by
  have h' : HasSum (fun n : ℕ => LSeries.term f s (n + 1)) (a - ∑ i ∈ Finset.range 1, LSeries.term f s i) :=
    (hasSum_nat_add_iff' 1).mpr h
  rw [Finset.sum_range_one, LSeries.term_zero, sub_zero] at h'
  convert h' using 2 with n
  rw [LSeries.term_of_ne_zero (Nat.succ_ne_zero n)]

/-- Two functions holomorphic on ℂ ∖ {1} with the same series sum on Re s > 1 agree on ℂ ∖ {1}. -/
private lemma eqOn_of_hasSum (a : ℕ → ℂ → ℂ) {f g : ℂ → ℂ}
    (hf : DifferentiableOn ℂ f {1}ᶜ) (hg : DifferentiableOn ℂ g {1}ᶜ)
    (hfs : ∀ s : ℂ, 1 < s.re → HasSum (fun n => a n s) (f s))
    (hgs : ∀ s : ℂ, 1 < s.re → HasSum (fun n => a n s) (g s)) : Set.EqOn f g {1}ᶜ := by
  have hU : IsOpen ({1}ᶜ : Set ℂ) := isOpen_compl_singleton
  have hpc : IsPreconnected ({1}ᶜ : Set ℂ) :=
    (isConnected_compl_singleton_of_one_lt_rank
      (by rw [Complex.rank_real_complex]; exact_mod_cast Nat.one_lt_two) (1 : ℂ)).isPreconnected
  have h2 : (2 : ℂ) ∈ ({1}ᶜ : Set ℂ) := Set.mem_compl_singleton_iff.mpr (by norm_num)
  refine (hf.analyticOnNhd hU).eqOn_of_preconnected_of_eventuallyEq (hg.analyticOnNhd hU) hpc h2 ?_
  have hV : IsOpen {s : ℂ | 1 < s.re} := isOpen_lt continuous_const Complex.continuous_re
  have h2V : (2 : ℂ) ∈ {s : ℂ | 1 < s.re} := by simp only [Set.mem_setOf_eq]; norm_num
  filter_upwards [hV.mem_nhds h2V] with s hs
  exact (hfs s hs).unique (hgs s hs)

/-- Mathlib's ζ meets the characterisation. -/
theorem isTextbookZeta_riemannZeta : IsTextbookZeta riemannZeta := by
  refine ⟨fun s hs => (differentiableAt_riemannZeta (Set.mem_compl_singleton_iff.mp hs)).differentiableWithinAt,
    fun s hs => ?_⟩
  simpa using hasSum_succ (LSeriesHasSum_one hs)

/-- Mathlib's L(·, χ) meets the characterisation, for every modulus N ≥ 1 and every character. -/
theorem isTextbookL_LFunction (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) :
    IsTextbookL χ (DirichletCharacter.LFunction χ) := by
  refine ⟨fun s hs => (DirichletCharacter.differentiableAt_LFunction χ s
    (Or.inl (Set.mem_compl_singleton_iff.mp hs))).differentiableWithinAt, fun s hs => ?_⟩
  have h1 := (DirichletCharacter.LSeriesSummable_of_one_lt_re χ hs).LSeriesHasSum
  have h2 := hasSum_succ h1
  rw [DirichletCharacter.LFunction_eq_LSeries χ hs]
  exact h2

/-- The characterisation determines ζ on ℂ ∖ {1}. -/
theorem eqOn_riemannZeta {f : ℂ → ℂ} (hf : IsTextbookZeta f) : Set.EqOn f riemannZeta {1}ᶜ :=
  eqOn_of_hasSum (fun n s => 1 / ((n + 1 : ℕ) : ℂ) ^ s) hf.1 isTextbookZeta_riemannZeta.1 hf.2
    isTextbookZeta_riemannZeta.2

/-- The characterisation determines L(·, χ) on ℂ ∖ {1}. -/
theorem eqOn_LFunction {N : ℕ} [NeZero N] {χ : DirichletCharacter ℂ N} {f : ℂ → ℂ} (hf : IsTextbookL χ f) :
    Set.EqOn f (DirichletCharacter.LFunction χ) {1}ᶜ :=
  eqOn_of_hasSum (fun n s => χ ((n + 1 : ℕ) : ZMod N) / ((n + 1 : ℕ) : ℂ) ^ s) hf.1
    (isTextbookL_LFunction N χ).1 hf.2 (isTextbookL_LFunction N χ).2

/-- Mathlib's `RiemannHypothesis` (the release's `riemannHypothesis`) gives the textbook RH. -/
theorem textbookRH_of_riemannHypothesis (h : RiemannHypothesis) : TextbookRH := by
  intro f hf s h0 h1 hz
  have hs1 : s ≠ 1 := by rintro rfl; norm_num at h1
  have hzeta : riemannZeta s = 0 := by
    rw [← eqOn_riemannZeta hf (Set.mem_compl_singleton_iff.mpr hs1)]; exact hz
  exact (CertMachine.Spec.rhStrip_iff.mpr h) s h0 h1 hzeta

/-- The challenge's `DirichletLZerosOnLine` (the release's `LFunction_eq_zero_re`) gives the textbook GRH. -/
theorem textbookGRH_of (h : DirichletLZerosOnLine) : TextbookGRH := by
  intro N hN χ f hf s h0 h1 hz
  have hs1 : s ≠ 1 := by rintro rfl; norm_num at h1
  have hL : DirichletCharacter.LFunction χ s = 0 := by
    rw [← eqOn_LFunction hf (Set.mem_compl_singleton_iff.mpr hs1)]; exact hz
  exact @h N hN χ s h0 h1 hL

/-- The textbook RH gives Mathlib's `RiemannHypothesis` (so the two are equivalent). -/
theorem riemannHypothesis_of_textbookRH (h : TextbookRH) : RiemannHypothesis :=
  CertMachine.Spec.rhStrip_iff.mp fun s h0 h1 hz => h riemannZeta isTextbookZeta_riemannZeta s h0 h1 hz

/-- The textbook GRH gives the challenge's `DirichletLZerosOnLine` (so the two are equivalent). -/
theorem dirichletLZerosOnLine_of_textbookGRH (h : TextbookGRH) : DirichletLZerosOnLine := by
  intro N hN χ s h0 h1 hz
  exact @h N hN χ _ (isTextbookL_LFunction N χ) s h0 h1 hz

end CertMachine.Textbook
