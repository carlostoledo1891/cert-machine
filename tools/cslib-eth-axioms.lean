-- cslib-eth-axioms.lean — OUR file for D1 of the ETH model-gap lane (notes/eth-model-gap-preregistration-2026-11-04.md):
-- the axioms and statements of complexitylib's native ETH refutation (PR #1338) and its word-RAM simulation (PR #2027),
-- at cslib-community/complexitylib 1b7d62a8. Run on the pod from the repository's root with `lake env lean <this file>`;
-- the repository's own audit is not used.
import ComplexityAbstracts.SubexponentialSATAbstract
import Complexity.Computability.WordRAM.OfTuring

#print axioms ComplexityAbstracts.SubexponentialSATAbstract.not_eth
#print axioms ComplexityAbstracts.SubexponentialSATAbstract.not_seth
#print axioms ComplexityAbstracts.SubexponentialSATAbstract.exact_count
#print axioms ComplexityAbstracts.SubexponentialSATAbstract.satExponent_eq_zero
#print axioms ComplexityAbstracts.SubexponentialSATAbstract.length_encCNF
#print axioms Cslib.WordRAM.OfTuring.executes_simProgram
#print axioms Turing.MultiTapeTM.ComputableInPolyTime.exists_wordRAM
#print ComplexityAbstracts.SubexponentialSATAbstract.ETH
#print ComplexityAbstracts.SubexponentialSATAbstract.DecidableInExpTime
#print ComplexityAbstracts.SubexponentialSATAbstract.DecidableInTimeO
#print Turing.MultiTapeTM.DecidableInTimeAndSpace
#print Turing.MultiTapeTM
#check @Cslib.WordRAM.OfTuring.executes_simProgram
