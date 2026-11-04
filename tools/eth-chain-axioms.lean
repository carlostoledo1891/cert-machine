-- eth-chain-axioms.lean — OUR file for deciding the Anthropic chain in one environment (claimbox lean/eth-bridge).
import EthBridge.AnthropicChain
#print axioms EthBridge.AnthropicChain.not_eth
#print axioms MainResults.ethIsFalse
#print axioms MainResults.mainTheorem
#print axioms EthBridge.Anthropic.not_eth_of_ethIsFalse
#check @MainResults.ethIsFalse
#check @EthBridge.AnthropicChain.not_eth
#print MainResults.ETHIsFalse
