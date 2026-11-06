/-
  zq-trackb-statement.lean — cert-machine's statement module for the Track B decision on the claim "ℤ is Diophantine
  in ℚ" (Elliot Glazer with AI agents, 2026-11-05): claimbox's conditional theorem at 125509a1 (lean/zinq).
  Pre-registered in notes/zq-trackb-preregistration-2026-11-06.md (B4).

  THE THEOREM IS UNDECIDED HERE. These four theorems are stated by us: the conclusion is Glazer's frozen statement,
  taken by `type_of%` from his file (never retyped), and the hypotheses are claimbox's named Props. A proof here says the
  frozen statement follows from those Props in Lean; it says nothing about whether any of them is true.

  tools/runpod-zq-trackb.sh builds this file as the root of a `lean_lib CertMachineZQ` added to a copy of claimbox's
  project; tools/zq-lean-audit.lean then lists their axioms, and the kernel replays read them.
-/
import CondZQ
import Frozen.BoundedIntegerPolynomial

namespace CertMachineZQ

/-- The frozen statement from the eight hypotheses that remain (claimbox's T8). -/
theorem trackB_eight (hM : CondZQ.HypM) (hH : CondZQ.HypH) (hPC : CondZQ.HypPC) (hC : CondZQ.HypC)
    (hLT : CondZQ.HypLT) (hCC : CondZQ.HypCC) (hH1 : CondZQ.HypH1) (hH2 : CondZQ.HypH2) :
    type_of% @ZInQ.exists_bounded_integer_polynomial_defining_integers :=
  CondZQ.exists_bounded_integer_polynomial_defining_integers_of_eight_hypotheses hM hH hPC hC hLT hCC hH1 hH2

/-- The frozen statement from the nine hypotheses (claimbox's T9). -/
theorem trackB_nine (hG : CondZQ.HypG) (hM : CondZQ.HypM) (hH : CondZQ.HypH) (hPC : CondZQ.HypPC)
    (hC : CondZQ.HypC) (hLT : CondZQ.HypLT) (hCC : CondZQ.HypCC) (hH1 : CondZQ.HypH1) (hH2 : CondZQ.HypH2) :
    type_of% @ZInQ.exists_bounded_integer_polynomial_defining_integers :=
  CondZQ.exists_bounded_integer_polynomial_defining_integers_of_hypotheses hG hM hH hPC hC hLT hCC hH1 hH2

/-- G, discharged by claimbox. -/
theorem trackB_G : CondZQ.HypG := CondZQ.hypG_holds

/-- G read through Mathlib: `P0` is not of finite additive order. -/
theorem trackB_G_infinite : ¬ IsOfFinAddOrder CondZQ.P0 := addOrderOf_eq_zero_iff.mp CondZQ.hypG_holds

end CertMachineZQ
