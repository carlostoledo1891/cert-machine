import KN3.DepWalk
import KN3.Cheat
import KN3.Proved

/-!
# Walk.lean — the dependency walks of K2, and red control KR2

Forbidden NAMES (reaching one is FLAGGED): the lab's proof of its Conjecture 3 and every theorem on its way that
proves, or concludes, `KozmaNitzan2024_conjecture3`, `NearOneGluing` or `AdditiveGluing` (which implies them); the
lab's Conjecture 1 for three relays (`kn_conj1_three`, the only theorem of the library whose statement is a case
of the paper's Conjectures 1, 2, 4, 6); and, although they are transports and not proofs, the lab's own
`nearOneGluing_iff_conjecture3` and `KozmaNitzan2024_conjecture3.{fintype, finSupp, openConn_set}`, so that the
record shows our implications use none of the lab's lemmas about the statement.
Forbidden STATEMENTS (`proofsOf`): any reached constant whose type is one of the three statements is FLAGGED,
whatever its name.

This file imports the whole library (through `KN3.Cheat`) only so that the forbidden names exist; what a
theorem of `KN3.Compare` reaches does not depend on what is imported here.
-/

#depwalk_expect CLEAN KN3Compare.lab_iff_nearOneGluing
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_iff_labForm
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_to_R0
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.R0_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_to_RB
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.RB_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_to_N2
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_to_N3
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.N3_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.lab_to_N4
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect CLEAN KN3Compare.N4_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

/-! ## KR2: the cheating proofs must be FLAGGED -/

#depwalk_expect FLAGGED KN3Cheat.cheat_R0_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect FLAGGED KN3Cheat.cheat_N2_to_lab
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

#depwalk_expect FLAGGED KN3Cheat.cheat_via_additive
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing

/-! ## K3 goes through the lab's proof, as it must: FLAGGED is the expected verdict here -/

#depwalk_expect FLAGGED conjecture3_as_printed
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
  Percolation.Continuity.CSH.conjecture3_of_csh
  Percolation.Continuity.CSH.additiveGluing_holds
  Percolation.Continuity.CSH.additiveGluing_of_csh
  Percolation.Continuity.CSH.cshHolds
  Percolation.Continuity.CSH.cshAll
  Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate
  Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate
  Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer
  Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank
  Percolation.Continuity.additiveGluingGlue_proof
  Percolation.Continuity.additiveGluingSuffices_proof
  Percolation.Continuity.nearOneGluing_iff_conjecture3
  Percolation.Continuity.CovTau.kn_conj1_three
  Percolation.Literature.KozmaNitzan2024_conjecture3.fintype
  Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp
  Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set
  proofsOf Percolation.Literature.KozmaNitzan2024_conjecture3 Percolation.Continuity.Statements.NearOneGluing Percolation.Continuity.Statements.AdditiveGluing
