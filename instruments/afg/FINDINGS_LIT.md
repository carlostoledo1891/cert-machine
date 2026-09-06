# FINDINGS_LIT — the literature gate for instruments/afg

**Run 2026-09-06, before minting. Question: OCCUPANCY of the exact instance —
a validated interval enclosure of the stationary triple (u, m, H̄) for the
FIRST-ORDER system (1.1) of Almulla–Ferreira–Gomes, in the case ∫b ≠ 0, by the
one-dimensional current reduction.** Feasibility was not gated; it was built
(this folder) and is therefore known.

This gate stands on the one of 2026-07-27 (sin-mfg
`missions/FINDINGS_LIT_FERREIRA.md`, verdict PARTIAL: tier 1 "check a solver
against the closed form" OCCUPIED and near-folklore; tier 2 "error bounds for a
scheme" OCCUPIED and crowded; tier 3 "an enclosure of (u, m, H̄)" NOT LOCATED
externally, self-shadowed by mfg-cap). That gate had NOT read §§4–5 of the
paper. This one did (the full PDF, 18 pages, read 2026-09-06).

## What the full text settles

- **§2.1, verbatim:** "If ∫ b dx ≠ 0, we are not aware of any closed-form
  solution." The paper's own numerical example with ∫b ≠ 0 is b = cos²(2πx)
  (Figures 7–8, monotone flow, N = 100). ∫b = 1/2.
- **§4 carries no table.** Every numerical result is a figure. There is nothing
  to reproduce within its rounding; the honest word is ENCLOSURE, never
  REPRODUCTION.
- **§4 congestion example** uses b = 0 and "admits the same explicit solution
  as (1.1) with b = 0" — the trivial current. It is NOT the instance here, so
  the internal collision the July gate feared (with mfg-congest's congestion
  target) does not arise.
- **No error bound, no a-posteriori estimate, no enclosure** anywhere in the
  paper. §5 names "a general theory of convergence for monotone schemes" as
  future work.
- **Lemma 2.3** proves the operator monotone in L²×L², from which uniqueness
  follows (their citation of Lasry–Lions). This is the global-uniqueness
  hypothesis our certificate ASSUMES and cites.

## The reduction is theirs and is cited as such

The current formulation — integrate the transport equation once, m(u_x + b) = j,
and reduce the one-dimensional stationary game to scalar equations — is the
method of Gomes, Nurbekyan and Prazeres: *One-dimensional stationary mean-field
games with local coupling*, Dynamic Games and Applications 8 (2018),
arXiv:1611.08161 (abstract verified at source 2026-09-06: "we drop that
assumption and construct explicit solutions for one-dimensional MFGs"), and
*Explicit solutions of one-dimensional, first-order, stationary mean-field games
with congestion*, CDC 2016 (search-listing level: "using the current formulation
of one-dimensional first-order stationary mean-field games"). Their bodies were
not read this pass; the attribution is to the method, which the abstracts
state. Nothing here claims the reduction.

## Occupancy queries this pass (literal)

1. `one-dimensional stationary mean-field games current "first-order" explicit
   solutions Gomes Nurbekyan Prazeres` — the two GNP papers above; Nurbekyan's
   Fourier approach to non-local first-order congestion; forward-forward MFG
   with congestion (arXiv:1703.10029). All explicit or numerical; **no
   enclosure**.
2. `"mean-field game" first-order stationary "validated numerics" OR
   "computer-assisted proof" OR "interval arithmetic" enclosure` — the families
   do not meet: first-order stationary MFG numerics on one side (semi-discrete
   approximation arXiv:2111.11972; the partial-differential-inclusion analysis
   arXiv:2209.00303; Dirichlet weak solutions arXiv:1804.07175), validated
   numerics generalities on the other (vncap.org, the ICMS workshop). **No
   paper at the intersection.**
3. Fetched: arXiv:2606.19611 (Al Abdulaziz, Ashrafyan, Gevorgyan, Gomes,
   *Bregman-projected mirror methods for regularized stationary mean-field
   games*, June 2026) — the group's newest word on stationary systems: strong
   convergence of a mirror iteration for each fixed regularization; a
   convergence theorem, **not an enclosure**. The nearest neighbour; cited on
   the page.

## Verdict: PARTIAL (unchanged), and the claim it permits

Tier 3 is not located externally. It is shadowed internally by mfg-cap (the
first MFG enclosure with a validated ergodic constant, second-order, quadratic)
and by mfg-congest (one certified point of a congestion system). Both are
different systems: this one is FIRST-ORDER, which neither of those kernels can
reach (both take their approximate inverse from the viscous symbol), and it is
enclosed by a different mechanism (the current reduction plus rigorous
quadrature, not a radii polynomial in sequence space).

**Write:** "A validated interval enclosure of the stationary triple (u, m, H̄)
for the first-order mean-field game of Almulla, Ferreira and Gomes (DGA 7(4)
2017) in the case ∫b ≠ 0, for which the authors state no closed form is known."

**Do not write:** "the first computer-assisted proof for a mean-field game"
(mfg-cap holds it); "a certified reproduction" (no table exists); "the first
enclosure of a first-order MFG" (true as far as this search reaches, and a
search is not a proof — say "to our knowledge", with the query log above as the
evidence base and one paper we have not read as the falsifier).

## Unverified — not cited as fact

- The body of either GNP paper (attribution is to their abstracts).
- The Springer page of the AFG paper (303 to an authorization endpoint in July;
  the venue data is Crossref's).
