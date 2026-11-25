/-
Reader test T2 (omega = 9/4 lane, row F4; items I19, I20, I21).
Uses the challenge's definitions, `rectangular_exponent`, `dual_exponent`, and ONE release lemma,
`formalOmega_one_one_zero` (DualExponent.lean, proved from the schoolbook algorithm and the
flattening bound, independently of the rectangular formula).
Build inside the release's lean/ at 92b516ef: `lake env lean ReaderTests/T2_AlphaOrientation.lean`.

The challenge's `formalAlpha F = dualExponent (formalOmega F 1 1)` puts the parameter t on w31, which
is the ROW count: ⌈N^t⌉ × N times N × N. The textbook and the paper (p. 2: "an n × ⌊n^β⌋ matrix by a
⌊n^β⌋ × n matrix") put β on the INNER dimension, which is w12. This file proves the two agree.

DECIDES: green = no error, no `sorry`, axioms only propext, Quot.sound, Classical.choice. Then
  * reader_alpha_inner: formalAlpha F is the supremum over the textbook (inner-dimension) format;
  * reader_alpha_textbook: every t ∈ [0,1] with ω(1,t,1) = 2 is ≤ 1/2, and such t come arbitrarily
    close to 1/2 from below — α = 1/2 in the textbook's orientation, with no sSup left;
  * reader_dual_nonjunk: the sSup is over a non-empty set bounded above (not Lean's junk 0).
If `readerRHS_swap13` fails, it is a tactic failure (the right side of rectangular_exponent is
symmetric by inspection: it reads A, B, C only through max, min and A + B + C); repair by case
analysis `rcases le_total a b` etc., and report it as a repair, not a finding.
-/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.DualExponent

namespace OAI.LinearAlgebra.SpectralBooks

/-- The right side of `rectangular_exponent`, verbatim (challenge lines 125–131). -/
noncomputable def readerRHS (a b c : ℝ) : ℝ :=
  let A := max a 0
  let B := max b 0
  let C := max c 0
  let x := max A (max B C)
  let z := min A (min B C)
  let y := A + B + C - x - z
  x + y + (max ((x + y) * z - x * y) 0) ^ 2 / (4 * x * y * z)

theorem reader_rect (F : Type*) [Field F] (a b c : ℝ) :
    formalOmega F a b c = readerRHS a b c :=
  rectangular_exponent F a b c

theorem readerRHS_swap13 (a b c : ℝ) : readerRHS a b c = readerRHS c b a := by
  simp only [readerRHS, max_comm, max_left_comm, min_comm, min_left_comm, add_comm, add_left_comm, add_assoc]

/-- Rows ⌈N^t⌉ (w31 = t) and inner dimension ⌈N^t⌉ (w12 = t) give the same exponent. -/
theorem reader_perm13 (F : Type*) [Field F] (t : ℝ) :
    formalOmega F 1 1 t = formalOmega F t 1 1 := by
  rw [reader_rect, reader_rect, readerRHS_swap13]

/-- formalAlpha is the textbook dual exponent: t on the inner dimension (w12). -/
theorem reader_alpha_inner (F : Type*) [Field F] :
    formalAlpha F = sSup {t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F t 1 1 = 2} := by
  unfold formalAlpha dualExponent
  simp_rw [reader_perm13]

theorem reader_dual_nonjunk (F : Type*) [Field F] :
    ({t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F 1 1 t = 2}).Nonempty ∧
      BddAbove {t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F 1 1 t = 2} :=
  ⟨⟨0, ⟨le_rfl, zero_le_one⟩, formalOmega_one_one_zero F⟩, ⟨1, fun _ ht => ht.1.2⟩⟩

/-- α = 1/2 in the textbook orientation, stated without sSup. -/
theorem reader_alpha_textbook (F : Type*) [Field F] :
    (∀ t ∈ Set.Icc (0 : ℝ) 1, formalOmega F t 1 1 = 2 → t ≤ 1 / 2) ∧
    (∀ s < (1 : ℝ) / 2, ∃ t ∈ Set.Icc (0 : ℝ) 1, formalOmega F t 1 1 = 2 ∧ s < t) := by
  have hS : sSup {t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F t 1 1 = 2} = 1 / 2 := by
    rw [← reader_alpha_inner]; exact dual_exponent F
  have hne : ({t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F t 1 1 = 2}).Nonempty :=
    ⟨0, ⟨le_rfl, zero_le_one⟩, by rw [← reader_perm13]; exact formalOmega_one_one_zero F⟩
  have hbdd : BddAbove {t : ℝ | t ∈ Set.Icc 0 1 ∧ formalOmega F t 1 1 = 2} :=
    ⟨1, fun _ ht => ht.1.2⟩
  refine ⟨fun t ht h => ?_, fun s hs => ?_⟩
  · rw [← hS]; exact le_csSup hbdd ⟨ht, h⟩
  · obtain ⟨t, ⟨ht, h⟩, hst⟩ := exists_lt_of_lt_csSup hne (by rw [hS]; exact hs)
    exact ⟨t, ht, h, hst⟩

end OAI.LinearAlgebra.SpectralBooks

#print axioms OAI.LinearAlgebra.SpectralBooks.reader_alpha_inner
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_dual_nonjunk
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_alpha_textbook
