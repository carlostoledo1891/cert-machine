# FINDINGS_LIT — instruments/maxval (run 2026-09-06, before minting)

**Question: occupancy of the exact claim** — Gomes–Üçer's maximal value
function (arXiv:2606.28378, Theorem 1.8, read in full through §2 on
2026-09-06; §§3–5 are the proofs) DRAWN on an explicit first-order
time-dependent MFG with a vacuum, with the maximal solution enclosed cell by
cell and a second, non-maximal MFG solution exhibited beneath it.

## What the paper does, and does not

- Theorem 1.8: for fixed m with U(m) ≠ ∅ there is a unique maximal u* ∈ U(m)
  dominating every admissible subsolution, and U(m) is exactly the set of
  subsolutions equal to u* on {m > 0} and, at t = 0, on {m₀ > 0}. Corollary
  1.9: under semi-strict monotonicity a unique maximal MFG solution.
- The paper carries NO worked example: §2.3 gives admissible Hamiltonians
  (Example 2.7, separable: H₀(p) − f(m) + g), no solution, no figure, no
  numerics. "The broader question of characterizing a maximal subsolution in
  viscosity or optimal control terms ... appears to be open" (§1). The
  identification used here — for continuous bounded m the maximal subsolution
  is the viscosity solution, i.e. the control value — is the classical one
  (Bardi–Capuzzo-Dolcetta) and applies because the instance has Lipschitz m;
  it is stated as an assumption on the page, not as a contribution.

## The instance is ours, and is said to be

The parabolic bump m = (A − Bx²)₊ with self-similar velocity is the
first-order analogue of the classical parabolic (Barenblatt-type) profiles of
gas dynamics; the MFG system with H = ½p² − m is, in 1-D, the isentropic Euler
system with negative pressure −m²/2 (elliptic in time), so a contracting
parabolic bump driven by a quadratic terminal cost is the expected explicit
family. No search was run for a prior appearance of this exact family in the
MFG literature; the page does not claim the family, it uses it. Falsifier: any
paper exhibiting this bump as an MFG solution — it would be cited, and nothing
on the page would change.

## Occupancy of the certificate

Nothing located at the intersection of "first-order time-dependent MFG" and
"validated numerics" in the sibling gates (instruments/afg/FINDINGS_LIT.md,
instruments/aag/FINDINGS_LIT.md); the maximal-subsolution theorem is three
months old and has no numerics attached. The rigorous branch-and-bound
enclosure of a Hopf–Lax minimum and the interval check that a straight path
avoids a moving set are standard interval-analysis moves and are not claimed.

## Verdict: PARTIAL — a narrow claim is permitted

Write: "an explicit first-order game with a vacuum, built here, on which the
maximal value function of Theorem 1.8 is enclosed cell by cell and a second
MFG value function is drawn beneath it, with the gap between them proved
positive on most of the vacuum."

Do not write: "the maximal subsolution characterised" (the identification is
classical and assumed); "the paper's example" (there is none); anything about
the cells the path check could not clear beyond the bracket they carry.
