module

public import MacMahon
public import MacMahon.Submission

@[expose] public section

/-!
Proof entry point. The declarations listed in comparator.json are proved in
MacMahon.Theorems, MacMahon.Rotations, and MacMahon.Submission. Challenge.lean
independently states the same results, importing only Mathlib.
-/
