import ETHBridge

-- The axioms of every theorem of the bridge (generic file and OpenAI instantiation).
-- tools/eth-bridge-gates.js accepts only propext, Classical.choice and Quot.sound, and refuses a
-- theorem of ETHBridge/*.lean that is not printed here.

#print axioms ETHBridge.s_eq_zero_of_forall_inTime
#print axioms ETHBridge.not_eth_iff
#print axioms ETHBridge.not_eth_of_forall_inTime
#print axioms ETHBridge.sharpS_eq_zero_of_forall_countInTime
#print axioms ETHBridge.not_sharpEth_iff
#print axioms ETHBridge.not_sharpEth_of_forall_countInTime
#print axioms ETHBridge.OpenAI.count_pos_iff
#print axioms ETHBridge.OpenAI.monitor_config
#print axioms ETHBridge.OpenAI.locatedStep_config
#print axioms ETHBridge.OpenAI.trace_config
#print axioms ETHBridge.OpenAI.frame_length
#print axioms ETHBridge.OpenAI.encodeNat_length
#print axioms ETHBridge.OpenAI.encodeList_length_le
#print axioms ETHBridge.OpenAI.literalCode_lt
#print axioms ETHBridge.OpenAI.clauseNumbers_length_le
#print axioms ETHBridge.OpenAI.lt_of_mem_clauseNumbers
#print axioms ETHBridge.OpenAI.clauseWord_length_le
#print axioms ETHBridge.OpenAI.cnfNumbers_length_le
#print axioms ETHBridge.OpenAI.formulaBitLength_le
#print axioms ETHBridge.OpenAI.card_literal
#print axioms ETHBridge.OpenAI.clauseCount_le
#print axioms ETHBridge.OpenAI.bitLength_succ_le
#print axioms ETHBridge.OpenAI.tendsto_logsq_div_sqrt
#print axioms ETHBridge.OpenAI.tendsto_ratio
#print axioms ETHBridge.OpenAI.tendsto_log_div
#print axioms ETHBridge.OpenAI.eventually_le
#print axioms ETHBridge.OpenAI.bound_le
#print axioms ETHBridge.OpenAI.inTime_of_claim
#print axioms ETHBridge.OpenAI.s_eq_zero_of_claim
#print axioms ETHBridge.OpenAI.not_eth_of_claim
#print axioms ETHBridge.OpenAI.numSat_eq_count
#print axioms ETHBridge.OpenAI.runtime_le_floor
#print axioms ETHBridge.OpenAI.countInTime_of_claim
#print axioms ETHBridge.OpenAI.sharpS_eq_zero_of_claim
#print axioms ETHBridge.OpenAI.not_sharpEth_of_claim
