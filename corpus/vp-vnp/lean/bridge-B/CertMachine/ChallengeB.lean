import CertMachine.BlindB

/-! The challenge for Comparator, with OUR blind statement (BlindB, sealed in SEAL-1B, elaborated with no
repair): BlindB's five propositions stated as theorems with `sorry`, named exactly as in
CertMachine.BridgeB. This file imports CertMachine.BlindB alone, and that file imports Mathlib alone. -/

namespace CertMachine.BridgeB

theorem mainTheorem : BlindB.MainTheorem := by
  sorry

theorem mainTheoremApprox : BlindB.MainTheoremApprox := by
  sorry

theorem separation : BlindB.Separation := by
  sorry

theorem separationClosure : BlindB.SeparationClosure := by
  sorry

theorem permanentOverReal : BlindB.PermanentOverReal := by
  sorry

end CertMachine.BridgeB
