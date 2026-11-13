import ContProof
-- RED 2a: the proof script of `theta_continuous`, pointed at Planted_constant. Must FAIL to elaborate.
theorem red2_script : TextbookPercolation.Planted_constant := by
  intro d hd
  rw [ContProof.θ_eq']
  exact ContProof.continuous_of_crit d
    ((BondPercolation.bridge d).1 (BondPercolation.percolation_continuity d hd))
