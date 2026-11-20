import ChallengeDeps
import CertMachine.BridgeConditional

/-!
# The statement bridge to Masullo's draft (cert-machine, 2026-11-20; pre-registration amendment A2)

Alessandro Maria Masullo, "The Music of the Primes" (draft, 940 pp., posted 2026-11-20 at
math216.wordpress.com, sha256 e039d3f6…). Its main theorem on the zeros, Theorem 13.3.1.2 (p. 522), is NOT yet
stated in the draft (its footnotes read "Insert statement." and "State and prove the Main Theorems"). The draft
describes what that theorem asserts in §14.1.2 (p. 532): "if ρ ∈ ℂ is a non-trivial zero of L(s, χ), then
ρ ∈ 1/2 + iℝ, and if, in addition, ρ ∉ ℝ, i.e. ρ ≠ 1/2, then N(ρ) ≤ [F : ℚ]", for the Hecke L-functions of every
number field F and every unitary Hecke character χ.

`ReadingQ` is cert-machine's reading of that description at F = ℚ (where [F : ℚ] = 1 and the unitary Hecke
characters are the primitive Dirichlet characters up to a twist |·|^{it}, which moves zeros vertically only). It is a
READING of a description, not a printed theorem, and it is re-checked against Theorem 13.3.1.2 once the draft states
it. Proved here, from Mathlib alone: the reading implies the zero statements of Alpöge's Lean release for primitive
characters (and for ζ), and it says MORE — every zero off the centre is simple — which neither Lean release states.
-/

namespace CertMachine.Masullo

open CertMachine.Bridge

/-- cert-machine's reading of the draft's §14.1.2 description of its Theorem 13.3.1.2, at F = ℚ. -/
def ReadingQ : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ ρ : ℂ, 0 < ρ.re → ρ.re < 1 → DirichletCharacter.LFunction χ ρ = 0 →
      ρ.re = 1 / 2 ∧ (ρ ≠ 1 / 2 → analyticOrderAt (DirichletCharacter.LFunction χ) ρ ≤ 1)

/-- The overlap: the reading implies the release's statement for primitive characters, written out. -/
theorem readingQ_zeros_on_line (h : ReadingQ) : PrimitiveZerosOnLine :=
  fun N _ χ hχ s h0 h1 hz => (h N χ hχ s h0 h1 hz).1

/-- For ζ (the character mod 1): every nontrivial zero off the real axis is on the line AND simple. -/
theorem readingQ_zeta (h : ReadingQ) {ρ : ℂ} (hρ : IsNontrivialZero ρ) (him : ρ.im ≠ 0) :
    ρ.re = 1 / 2 ∧ analyticOrderAt riemannZeta ρ ≤ 1 := by
  obtain ⟨hz, h0, h1⟩ := hρ
  have key := h 1 (1 : DirichletCharacter ℂ 1) DirichletCharacter.isPrimitive_one_level_one ρ h0 h1
    (by rw [DirichletCharacter.LFunction_modOne_eq]; exact hz)
  rw [DirichletCharacter.LFunction_modOne_eq] at key
  refine ⟨key.1, key.2 ?_⟩
  intro hc
  apply him
  rw [hc]
  simp

/-- What the reading adds beyond the overlap, for primitive characters: simplicity off the centre. -/
theorem readingQ_simple (h : ReadingQ) (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (hχ : χ.IsPrimitive)
    (ρ : ℂ) (h0 : 0 < ρ.re) (h1 : ρ.re < 1) (hz : DirichletCharacter.LFunction χ ρ = 0) (hc : ρ ≠ 1 / 2) :
    analyticOrderAt (DirichletCharacter.LFunction χ) ρ ≤ 1 :=
  (h N χ hχ ρ h0 h1 hz).2 hc

end CertMachine.Masullo
