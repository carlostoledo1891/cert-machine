import New.Main

/-!
# Control C2 of the grh-lean lane (corpus/grh-lean-check/PREREG.md): one proof replaced by `sorry`

A copy of the readable edition's `src/Main.lean` (lsernau/grh-lean 72fead10, `grh/src/Main.lean`, sha256
40da180aea415129d3f2c2f374c6ba4606be91a199871efc84a1d19a67a17c6d) with ONE change: the proof of
`LFunction_ne_zero_of_half_lt_re` (GRH in half-plane form, `New.grh` in the release) is replaced by `sorry`. No other
theorem of `Main.lean` uses that one, so the other four keep the release's proofs and only the planted theorem carries
`sorryAx`. It imports what `Main.lean` imports, so the control lives in the release's own environment. On the pod it is
the module `CertMachineCtl.GrhC2`, compiled after B1 (it needs `New.Main`).

It must be REFUSED by S1's check (Comparator against `CertMachine.Challenge`, the three permitted axioms; the expected
diagnostic is `Illegal axiom detected: 'sorryAx'`) and by K2's checks (con-leche `--verified` on this file's export, and
`--compare` of the challenge against it: con-leche rejects a `sorryAx` that is used).
-/

theorem riemannHypothesis : RiemannHypothesis := New.zeta_zeros_on_line New.grh

theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := riemannHypothesis

theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf := sorry

theorem LFunction_eq_zero_re : DirichletLZerosOnLine := New.zeros_on_line New.grh

theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine :=
  fun N _ χ _ ↦ LFunction_eq_zero_re N χ
