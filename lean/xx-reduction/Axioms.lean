import XXReduction

-- The axioms of every theorem of XXReduction.lean. tools/xx-reduction-gates.js accepts only propext,
-- Classical.choice and Quot.sound, and refuses a theorem of XXReduction.lean that is not printed here.

#print axioms XXReduction.selfpow_le_one
#print axioms XXReduction.selfpow_strictMonoOn
#print axioms XXReduction.one_lt_of_selfpow_eq
#print axioms XXReduction.exists_selfpow_eq
#print axioms XXReduction.existsUnique_selfpow_eq
#print axioms XXReduction.existsUnique_root
#print axioms XXReduction.frac_selfpow_pow
#print axioms XXReduction.frac_selfpow_lt_iff
#print axioms XXReduction.frac_selfpow_le_iff
#print axioms XXReduction.lt_root_iff
#print axioms XXReduction.le_root_iff
#print axioms XXReduction.root_lt_iff
#print axioms XXReduction.root_le_iff
#print axioms XXReduction.natCast_le_root_iff
#print axioms XXReduction.root_le_natCast_iff
