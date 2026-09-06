# FINDINGS_LIT — instruments/aag (run 2026-09-06, before minting)

**Question: occupancy of the exact claim** — the explicit solutions of
Alharbi–Ashrafyan–Gomes §3.2 (AMO 93:40, 2026; arXiv:2305.15952v4, read in
full 2026-09-06) certified cell by cell: the vanishing set decided with
refusal at the free boundary, the two value functions enclosed, the boundary
complementarity evaluated as intervals, case 2 over a γ box.

## What the paper does, verbatim where it matters

- The abstract: "as our examples show, contact does not necessarily imply
  that exit occurs." Case 1 (j₀ = 0) is that example: x = 1 is in the contact
  set with zero exit flux.
- §3.2, Case 1: "m(x) = V₊(x), u(x) = u(1) ± √2 ∫_x^1 √(V₋(z)) dz. Thus, if V
  changes sign, the MFG (3.5)–(3.6) admits at least two distinct solutions
  for u." Theorem 1.3(3): Du = Dv only on {m > 0}.
- §3.2, Case 2: the cubic m³ − V m² − j₀²/2 = 0, "exactly one is positive";
  u_x = −j₀/m; "a positive current guarantees that the density m remains
  strictly positive — regardless of the sign and amplitude of the potential V."
- Figures 1 and 2: V(x) = 0.5 sin(3π(x + 0.25)) with j₀ = 0, and
  V(x) = γ + 0.5 sin(3π(x + 0.25)) with j₀ = 0.1. **γ is not printed**; the
  figure's horizontal line sits near −0.4.
- The numerics: "a simple finite difference method in conjunction with
  Mathematica's built-in function FindMinimum" — no error bound, no table.

## Occupancy

The solutions are the paper's; the certificates are about them. The only
question is whether anyone has drawn a first-order MFG's empty region with the
undecided cells shown as undecided, or evaluated the contact-set complementarity
as a certified quantity. The target memory already rules on the figure
(corpus/targets.json, vis rows, 2026-09-04): a certified contour with explicitly
undecided cells is OCCUPIED mathematically (Plantinga–Vegter 2004 and the
isotopic-subdivision line — refine until decided, then draw clean) and OPEN
as a display convention (nobody ships the cells it could not decide, as
undecided, at a fixed budget). That ruling is followed here: the method is
cited, the figure is the contribution, and the page says so.

No validated-numerics treatment of a first-order MFG with mixed boundary
conditions was found (the search of the sibling gate, instruments/afg/
FINDINGS_LIT.md, covers first-order stationary MFG × validated numerics:
nothing at the intersection).

## Verdict: PARTIAL — a narrow claim is permitted

Write: "the paper's own explicit solutions, certified cell by cell: the empty
region decided exactly where V < 0, refused on the cells containing the three
roots, the two value functions enclosed and distinct, the contact set with and
without exit evaluated as intervals; case 2 certified for every γ in a box
because the paper prints none."

Do not write: "a certified contour" as a mathematical first (Plantinga–Vegter);
"the free boundary located" (it is exact: 1/12, 5/12, 3/4 — the refusal is a
display of budget, not a discovery); "reproduction of Figure 2" (γ unknown).
