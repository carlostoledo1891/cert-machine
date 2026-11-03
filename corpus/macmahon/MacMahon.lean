module

public import MacMahon.Theorems

@[expose] public section

-- This audit fails if an additional axiom (including sorryAx) enters a theorem.

/-- info: 'MacMahon.minimum_size' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.minimum_size

/-- info: 'MacMahon.physical_exactly_ten' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.physical_exactly_ten

/-- info: 'MacMahon.physical_iff_two_triangles' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.physical_iff_two_triangles

/-- info: 'MacMahon.minimum_has_no_repeats' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.minimum_has_no_repeats

/-- info: 'MacMahon.all_colourings' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.all_colourings

/-- info: 'MacMahon.proper_rotation_iff' depends on axioms: [propext, Classical.choice, Quot.sound] -/
#guard_msgs in
#print axioms MacMahon.proper_rotation_iff
