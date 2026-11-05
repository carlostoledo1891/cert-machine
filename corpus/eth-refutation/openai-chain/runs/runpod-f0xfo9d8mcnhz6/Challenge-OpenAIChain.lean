import ComplexityAbstracts.SubexponentialSATAbstract

namespace EthBridge.OpenAIChain

/-- ETH (complexitylib's, on cslib's multitape Turing machine) is false, from OpenAI's own proof through Hawkley's two
links and C2. -/
theorem not_eth : ¬ ComplexityAbstracts.SubexponentialSATAbstract.ETH :=
  by sorry

end EthBridge.OpenAIChain
