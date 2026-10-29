/- eth-seam: the OTHER side's export of Claim's closure ($SEAM_IN/claim.jsonl), read here and set beside this side's
constants of the same names, and its unfolded Claim beside this side's (SeamCross). -/
import Bridge.OpenAIStatement
import SeamCross

set_option maxHeartbeats 400000
set_option maxRecDepth 1000000
set_option Elab.async false

#eval SeamCross.run "claim"
  (some (``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim, ``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.ClaimAt))
