import Mathlib

/-!
# Control C3 of the grh-lean lane (corpus/grh-lean-check/PREREG.md): a planted change of the challenge

instruments/grh-lean/Challenge.lean with ONE change: in `DirichletLZerosOnLine` the conclusion `s.re = 1 / 2` reads
`s.re = 1 / 3`. Everything else is byte for byte the challenge. The release's `LFunction_eq_zero_re` proves the
`1 / 2` statement, so no judge may match it against this file: S1's check (Comparator, all five theorem names) and
K2's check (con-leche `--compare` of this file's export against the release's export) must each REFUSE, naming
`DirichletLZerosOnLine` or `LFunction_eq_zero_re`. On the pod this file is the module `CertMachine.ChallengeC3`, built
with the challenge before any module of the release is compiled there.
-/

def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 2

def DirichletLNonvanishingRightOfHalf : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    1 / 2 < s.re → (χ ≠ 1 ∨ s ≠ 1) → DirichletCharacter.LFunction χ s ≠ 0

def DirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 3

def PrimitiveDirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

theorem riemannHypothesis : RiemannHypothesis := sorry

theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := sorry

theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf := sorry

theorem LFunction_eq_zero_re : DirichletLZerosOnLine := sorry

theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine := sorry
