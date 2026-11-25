/-
Reader test T4 (omega = 9/4 lane, row F4; items M3, M4; PREREG gap G3, row CEN/P2).
Corollary 1.2 of the paper is NOT in the Comparator challenge. This file derives two of its three
sentences from the challenge theorem `square_exponent` plus three release lemmas:
  rpow_formalOmega_le_tensorRank                       (SpectralBooks/FormalRecursion.lean l.95)
  square_asymptoticRank_eq_rpow_formalOmega            (SpectralBooks/SquareExponent.lean l.75)
  algebraicClosure_rank_le_twice_productQuotientCount  (SpectralBooks/CircuitRankSpecialization.lean l.45)
Build inside the release's lean/ at 92b516ef: `lake env lean ReaderTests/T4_PerN.lean`.

DECIDES (green = no error, no `sorry`, axioms only propext, Quot.sound, Classical.choice):
  * reader_asymptoticRank: "the asymptotic rank of T_n over F equals n^{9/4}" for every n ≥ 2, every field;
  * reader_rank_per_n: rank_F(T_n) ≥ n^{9/4} for every n ≥ 2;
  * reader_gates_per_n: every correct circuit with division over F for n × n has at least
    ⌈n^{9/4}/2⌉ multiplication-or-division gates.
LIMITS, even when green:
  (a) `productQuotientCount` counts EVERY `mul` gate, scalar ones included (DivisionModel.lean l.38–42).
      The paper's count (Lemma 2.4, p. 8; Corollary 1.2, p. 2) is NONSCALAR only, which is stronger.
      The nonscalar form stays OPEN unless a lemma for it is found.
  (b) The meaning rests on release definitions that no Comparator challenge pins:
      RationalMatrixAlgorithm, RationalProgram.{value, Valid, productQuotientCount}, RationalMatrixAlgorithm.Correct
      (read by the reader: DivisionModel.lean, faithful), and tensorRank, matrixTensor, asymptoticRank
      (NOT read by the reader). A Comparator challenge with those bodies copied is the full test.
  (c) Geometric border rank (the first sentence of Corollary 1.2) is not touched here: OPEN (CEN).
-/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.SquareExponent
import OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization

namespace OAI
namespace LinearAlgebra
namespace SpectralBooks

open OAI.MatrixMultiplication
open Foundation

theorem reader_rank_per_n (F : Type*) [Field F] {n : ℕ} (hn : 2 ≤ n) :
    (n : ℝ) ^ ((9 : ℝ) / 4) ≤ tensorRank (matrixTensor F n n n) := by
  have h := rpow_formalOmega_le_tensorRank F hn
  rwa [square_exponent F] at h

theorem reader_asymptoticRank (F : Type*) [Field F] {n : ℕ} (hn : 2 ≤ n) :
    asymptoticRank (matrixTensor F n n n) = (n : ℝ) ^ ((9 : ℝ) / 4) := by
  rw [square_asymptoticRank_eq_rpow_formalOmega F hn, square_exponent F]

theorem reader_gates_per_n (F : Type*) [Field F] {n : ℕ} (hn : 2 ≤ n)
    (P : RationalMatrixAlgorithm F n n n) (hP : P.Correct) :
    ⌈(n : ℝ) ^ ((9 : ℝ) / 4) / 2⌉₊ ≤ P.program.productQuotientCount := by
  have h1 := reader_rank_per_n (AlgebraicClosure F) hn
  have h2 : (tensorRank (matrixTensor (AlgebraicClosure F) n n n) : ℝ) ≤
      2 * (P.program.productQuotientCount : ℝ) := by
    exact_mod_cast algebraicClosure_rank_le_twice_productQuotientCount hP
  exact Nat.ceil_le.mpr (by linarith)

end SpectralBooks
end LinearAlgebra
end OAI

#print axioms OAI.LinearAlgebra.SpectralBooks.reader_rank_per_n
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_asymptoticRank
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_gates_per_n
-- The definitions the meaning rests on (to be read and, for a full test, pinned by Comparator):
#print OAI.LinearAlgebra.SpectralBooks.RationalProgram.productQuotientCount
#print OAI.LinearAlgebra.SpectralBooks.RationalMatrixAlgorithm.Correct
