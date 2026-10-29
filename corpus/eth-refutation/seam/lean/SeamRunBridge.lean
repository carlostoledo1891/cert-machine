/- eth-seam, Anthropic's project only: the statement of TSavo's bridge theorem as its challenge file states it
(BridgeChallenge), to confirm that its hypothesis is the constant Claim exported by SeamRunClaim. -/
import BridgeChallenge
import SeamExport

set_option maxHeartbeats 0

#eval SeamExport.run "bridge" #[] none #[``Bridge.ethIsFalse_of_claim]
