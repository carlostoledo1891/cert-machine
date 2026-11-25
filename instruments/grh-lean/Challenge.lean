import Mathlib

/-!
# cert-machine's challenge for lsernau/grh-lean (2026-11-25)

The five statements of the release's `src/Main.lean`, with `sorry`, written from Mathlib alone, for the toolchain of
lsernau/grh-lean at commit 72fead102f663d5c7a407964a13dc0cf9d977207: `leanprover/lean4:v4.35.0` and Mathlib at commit
56a005855ea17e0b0958f73ec801ae140b0a1679 (both editions, `grh/` and `grh-compact/`, pin the same two). Nothing from the
release is imported. `RiemannHypothesis` is Mathlib's own definition (`Mathlib/NumberTheory/LSeries/RiemannZeta.lean`).
The four `def`s are the release's `src/Statements.lean` (sha256 79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf
in both editions, read through the GitHub API at the commit), kept as written so that the judges (Comparator, con-leche
`--compare`) can match them name for name; their meaning is decided by the earlier lane's reading (F1, F2) and by CHAR,
not by this file. The pre-registration is corpus/grh-lean-check/PREREG.md.

What changed from instruments/alpoge-grh/Challenge.lean (the challenge for the original Alpöge release, 2026-11-20):
- the pins named above: Lean v4.35.0 (was v4.33.1) and Mathlib 56a00585 (was the tag v4.33.1, commit 0df444a3);
- this header.
Nothing else. The four definitions and the five theorem lines are byte for byte those of the earlier challenge, because
the release's `Statements.lean` is byte-identical to the original release's and the five theorems of `Main.lean` keep
their names and types in both editions. On the pod this file is the module `CertMachine.Challenge`, built before any
module of the release is compiled on that machine (Comparator's assumption 2), in each edition's workspace.
-/

def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 2

def DirichletLNonvanishingRightOfHalf : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    1 / 2 < s.re → (χ ≠ 1 ∨ s ≠ 1) → DirichletCharacter.LFunction χ s ≠ 0

def DirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

def PrimitiveDirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

theorem riemannHypothesis : RiemannHypothesis := sorry

theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := sorry

theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf := sorry

theorem LFunction_eq_zero_re : DirichletLZerosOnLine := sorry

theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine := sorry
