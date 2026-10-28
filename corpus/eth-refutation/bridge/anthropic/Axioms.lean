import ETHBridge

-- The axioms of every theorem of the bridge (generic file and Anthropic instantiation).
-- tools/eth-bridge-gates.js accepts only propext, Classical.choice and Quot.sound, and refuses a
-- theorem of ETHBridge/*.lean that is not printed here.

#print axioms ETHBridge.s_eq_zero_of_forall_inTime
#print axioms ETHBridge.not_eth_iff
#print axioms ETHBridge.not_eth_of_forall_inTime
#print axioms ETHBridge.Anthropic.decidesKSat_iff
#print axioms ETHBridge.Anthropic.inTime_iff
#print axioms ETHBridge.Anthropic.s_eq
#print axioms ETHBridge.Anthropic.eth_three_iff
#print axioms ETHBridge.Anthropic.ethIsFalse_iff
#print axioms ETHBridge.Anthropic.eth_of_eth
#print axioms ETHBridge.Anthropic.not_eth_of_ethIsFalse
