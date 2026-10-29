/- eth-seam: OpenAI's pinned challenge (module ComparatorChallenges.SubexponentialSAT, the bytes of openai/math
7ef5c0cc, sha256 4183b205…a76685), the closure of exact_count_and_sat's statement. -/
import ComparatorChallenges.SubexponentialSAT
import SeamExport

set_option maxHeartbeats 0
set_option maxRecDepth 1000000

#eval SeamExport.run "challenge" #[``OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat] none #[]
