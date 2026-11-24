import CertMachine.BridgeB

/-! Lean tests for the differences between BlindB's and the release's definitions that the bridge
report names. Not part of the bridge; nothing imports this file. -/

namespace CertMachine.DiffsB

open MvPolynomial

/-- At `m = 0` BlindB's Hamiltonian cycle polynomial is `0` (no starting index exists). -/
theorem HC_zero (K : Type) [Field K] : BlindB.HC K 0 = 0 := by
  unfold BlindB.HC
  refine Finset.sum_eq_zero (fun σ _ => ?_)
  rw [if_neg]
  rintro ⟨i, _⟩
  exact i.elim0

/-- At `m = 0` the release's Hamiltonian cycle polynomial is `1` (the empty permutation is a cycle on
the empty set, and its product is empty). -/
theorem hc_zero (K : Type) [Field K] : Statement.hc K 0 = 1 := by
  classical
  unfold Statement.hc
  rw [Finset.filter_true_of_mem (fun σ _ => ⟨Set.bijOn_univ.2 σ.bijective, fun x => x.elim0⟩)]
  simp

/-- So the two differ at `m = 0` (and agree for `m ≥ 1`: `CertMachine.BridgeB.HC_eq`). -/
theorem HC_ne_hc_zero (K : Type) [Field K] : BlindB.HC K 0 ≠ Statement.hc K 0 := by
  rw [HC_zero, hc_zero]
  exact zero_ne_one

/-- The size measures coincide exactly: a BlindB circuit with `s` vertices for `f` exists iff the
release's `Computes f s` holds (given `s` is the size; `Computes` is monotone in `s`). -/
theorem sizes_agree {K V : Type} [Field K] (f : MvPolynomial V K) (s : ℕ) :
    Statement.Computes f s ↔ ∃ D : BlindB.Circuit K V, D.size ≤ s ∧ D.Computes f := by
  constructor
  · intro h
    obtain ⟨D, hD, hc⟩ := CertMachine.BridgeB.circuit_of_computes h
    exact ⟨D, hD.le, hc⟩
  · rintro ⟨D, hD, hc⟩
    exact CertMachine.BridgeB.computes_mono (CertMachine.BridgeB.computes_of_circuit hc) hD

end CertMachine.DiffsB
