-- eth-c2-axioms.lean — OUR file for deciding C2 (claimbox lean/eth-bridge, notes/eth-model-gap-preregistration-2026-11-04.md).
import EthBridge
#print axioms EthBridge.Anthropic.not_eth_of_ethIsFalse
#print axioms EthBridge.Anthropic.Assemble.decidableInExpTime
#print axioms EthBridge.Anthropic.DegreeStep.stepTotalD
#print axioms EthBridge.Anthropic.DegreeRun.runBitD
#print axioms EthBridge.Anthropic.Words.prep_polyTime
#print axioms EthBridge.Anthropic.Prep.prep_spec
#print MainResults.ETHIsFalse
#print ComplexityAbstracts.SubexponentialSATAbstract.ETH
#check @EthBridge.Anthropic.not_eth_of_ethIsFalse
