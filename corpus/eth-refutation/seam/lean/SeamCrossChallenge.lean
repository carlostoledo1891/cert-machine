/- eth-seam: the OTHER side's export of the challenge closure ($SEAM_IN/challenge.jsonl), read here and set beside
this side's constants of the same names (SeamCross). -/
import ComparatorChallenges.SubexponentialSAT
import SeamCross

set_option maxHeartbeats 400000
set_option maxRecDepth 1000000
set_option Elab.async false

#eval SeamCross.run "challenge"
