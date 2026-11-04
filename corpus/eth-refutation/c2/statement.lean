namespace EthBridge.Anthropic

/-- **C2.** Anthropic's `ETHIsFalse` implies complexitylib's ¬ETH. -/
theorem not_eth_of_ethIsFalse (h : MainResults.ETHIsFalse) :
    ¬ ComplexityAbstracts.SubexponentialSATAbstract.ETH :=
