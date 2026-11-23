import ControlC5Check
import LemmaPCert

/-! Control C5 (pre-registered): the same certificate on the perturbed core C35(1,7,11,15). The checker must refuse
it. Measured first by the Python mirror: refused at entry 0 (the first requirement is not independent there).
Lemma P itself also holds on C35(1,7,11,15) (d2/lp_search -s 1,7,11,15: 142,791 nodes), so the refusal is about the
certificate meeting the wrong graph, not about the lemma. -/

namespace RamseyScout.ControlC5
open RamseyScout.ControlC5.Check

theorem c5_refused : runAll RamseyScout.LemmaPCert.cert0 [initA, initE] = none := by decide +kernel

end RamseyScout.ControlC5
