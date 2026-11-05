-- eth-openai-chain-axioms.lean — OUR file for deciding the OpenAI chain in one environment (claimbox lean/eth-bridge).
import EthBridge.OpenAIChain
#print axioms EthBridge.OpenAIChain.not_eth
#print axioms OAI.Bridges.ETH.not_positiveRateETH
#print axioms OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse
#print axioms OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat
#print axioms OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main
#print axioms EthBridge.Anthropic.not_eth_of_ethIsFalse
#check @OAI.Bridges.ETH.not_positiveRateETH
#check @OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse
#check @EthBridge.OpenAIChain.not_eth
#print MainResults.ETHIsFalse
