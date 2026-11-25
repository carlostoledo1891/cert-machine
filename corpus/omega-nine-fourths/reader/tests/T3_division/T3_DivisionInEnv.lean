/-
Reader test T3, in-environment half (omega = 9/4 lane, row F4, item M1).
Build inside the release's lean/ at 92b516ef (Lean v4.34.1, Mathlib d13f23b7), e.g. as
lean/ReaderTests/T3_DivisionInEnv.lean, with `lake env lean ReaderTests/T3_DivisionInEnv.lean`.

DECIDES M1 (divisions, square case) together with the Comparator half (ReaderDivision.lean/.json):
  green = this file elaborates with no error and no `sorry`, and both `#print axioms` lines list only
          propext, Quot.sound, Classical.choice; AND Comparator accepts ReaderDivision.json
          AND refuses ReaderDivisionPlanted.json.
  Then the paper's Theorem 1.1 in its own model (division gates allowed, formal identity of rational
  functions, every field) is a checked theorem of the release, and M1 becomes IMMATERIAL.
  Any other outcome leaves M1 MATERIAL (the challenge's division-free statement is the weaker one).
-/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.DivisionExponent
import OAI.LinearAlgebra.MatrixExponent.FieldFormula

namespace OAI.LinearAlgebra.SpectralBooks

/-- The square exponent with division gates (DivisionModel.lean / DivisionExponent.lean). -/
theorem reader_divisionOmega_square (F : Type*) [Field F] :
    divisionOmega F 1 1 1 = (9 : ℝ) / 4 :=
  (divisionOmega_square_eq_formalOmega F).trans (square_exponent F)

/-- The square exponent of the set-based rational-circuit model (RationalCircuits.lean). -/
theorem reader_rational_omega (F : Type*) [Field F] :
    OAI.LinearAlgebra.MatrixExponent.omega F = 9 / 4 :=
  OAI.LinearAlgebra.MatrixExponent.omega_eq F

end OAI.LinearAlgebra.SpectralBooks

#print axioms OAI.LinearAlgebra.SpectralBooks.reader_divisionOmega_square
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_rational_omega
-- Which file defines the `omega` used above (must be MatrixExponent/RationalCircuits.lean):
#print OAI.LinearAlgebra.MatrixExponent.omega
#print OAI.LinearAlgebra.MatrixExponent.Build

/- NOT A TEST — a TARGET for item M2 (divisions for the dual and rectangular exponents).
   No such equality was found in the files the reader opened; it is stated here so the control room
   can search for it (CEN) or prove it. Until then M2 is OPEN.

theorem reader_division_rectangular (F : Type*) [Field F] (a b c : ℝ) :
    divisionOmega F a b c = formalOmega F a b c := by
  sorry
-/
