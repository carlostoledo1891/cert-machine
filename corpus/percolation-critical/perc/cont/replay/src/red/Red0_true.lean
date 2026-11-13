import ContProof
-- POSITIVE control of the red harness: the same two proofs, pointed at the TRUE statement. Must elaborate (exit 0).
theorem red0_script : TextbookPercolation.ContinuityStatement := by
  intro d hd
  rw [ContProof.θ_eq']
  exact ContProof.continuous_of_crit d
    ((BondPercolation.bridge d).1 (BondPercolation.percolation_continuity d hd))
theorem red0_term : TextbookPercolation.ContinuityStatement := theta_continuous
