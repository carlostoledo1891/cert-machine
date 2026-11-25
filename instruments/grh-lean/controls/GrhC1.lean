import New.Main

/-!
# Control C1 of the grh-lean lane (corpus/grh-lean-check/PREREG.md): a theorem proved by an added axiom

A copy of the readable edition's `src/Main.lean` (lsernau/grh-lean 72fead10, `grh/src/Main.lean`, sha256
40da180aea415129d3f2c2f374c6ba4606be91a199871efc84a1d19a67a17c6d) with ONE change: the fifth theorem,
`LFunction_eq_zero_re_of_isPrimitive`, is proved by an axiom this file adds, `CertMachine.plantedAxiomC1`. The other
four theorems keep the release's proofs (comments dropped). It imports what `Main.lean` imports, so the control lives in
the release's own environment. On the pod it is the module `CertMachineCtl.GrhC1`, compiled after B1 (it needs `New.Main`).

It must be REFUSED by S1's check (Comparator against `CertMachine.Challenge`, the three permitted axioms; the expected
diagnostic is `Illegal axiom detected: 'CertMachine.plantedAxiomC1'`) and by K2's checks (con-leche `--verified` on this
file's export, and `--compare` of the challenge against it: con-leche accepts only the three standard axioms).
-/

axiom CertMachine.plantedAxiomC1 : PrimitiveDirichletLZerosOnLine

theorem riemannHypothesis : RiemannHypothesis := New.zeta_zeros_on_line New.grh

theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := riemannHypothesis

theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf := New.grh

theorem LFunction_eq_zero_re : DirichletLZerosOnLine := New.zeros_on_line New.grh

theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine :=
  CertMachine.plantedAxiomC1
