/- eth-seam: TSavo's statement file (module Bridge.OpenAIStatement, the bytes of TSavo/eth-bridge 34f9ca20, sha256
44ba68e7…6abc1), the closure of Claim, the proposition his bridge theorem takes as hypothesis, and Claim with ClaimAt
unfolded (one delta step, then beta), to set beside exact_count_and_sat's statement. -/
import Bridge.OpenAIStatement
import SeamExport

set_option maxHeartbeats 0
set_option maxRecDepth 1000000

#eval SeamExport.run "claim" #[``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim]
  (some (``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim, ``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.ClaimAt))
  #[]
