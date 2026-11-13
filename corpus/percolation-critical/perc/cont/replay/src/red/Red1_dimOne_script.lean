import ContProof
-- RED 1a: the proof script of `theta_continuous`, pointed at Planted_dimOne. Must FAIL to elaborate.
theorem red1_script : TextbookPercolation.Planted_dimOne := by
  intro d hd
  rw [ContProof.θ_eq']
  exact ContProof.continuous_of_crit d
    ((BondPercolation.bridge d).1 (BondPercolation.percolation_continuity d hd))
