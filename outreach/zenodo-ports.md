# Zenodo deposits for the two ported theorem programs (staged 2026-09-02; clicks are the operator's)

Same doctrine as zenodo-plan.md: priority rests on immutable third-party
timestamps; deposits are earned insurance. The lambda(4) deposit exists
(10.5281/zenodo.22225861, in CITATION.cff). These two are drafted and
UNSENT. Recommended order: reserve both DOIs first (Zenodo lets you
reserve before publishing), hand the strings back to the machine so
CITATION.cff and the pages carry them, then push + publish the deposits
against the pushed state.

BACKFILL STEP (machine's, after DOIs exist): add both DOIs to
CITATION.cff (references), to the two report pages' footers, and to
HANDOFF; one follow-up commit + push.

---

## Deposit E — the hot-spots theorem (ember)

Contents to upload: paper/ember-hotspots.pdf + paper/ember-hotspots.md,
certs/ember-*.json (all 8), a README naming the one-command rerun
(`node tools/run-ember-chain.js`, ~2 min) and the battery
(`node instruments/hotspots/battery.js`). Optionally print
reports/ember.html to PDF at deposit time.

Metadata (paste-ready):

  Title:    A certified hot-spots domain beyond the proven classes: the
            second Neumann eigenfunction of a convex trapezoid with no
            symmetry axis attains its extrema on the boundary only
  Creators: Toledo, Carlos (ORCID)
  Upload type: software · License: MIT (code/records; text CC-BY-4.0 if
            split is offered)
  Description:
    A machine-derived, certificate-backed proof that the second Neumann
    eigenfunction of the trapezoid A=(0,0), B=(1,0), C=(17/20,9/10),
    D=(1/4,9/10) — convex, side slopes 6 and 18/5, no symmetry axis, not
    a lip domain — attains its maximum and minimum on the boundary only,
    with mu_1 simple in [12.020976137, 12.022398349]. To our knowledge
    the first certified hot-spots domain outside every class where the
    conjecture was previously proven (all triangles: Judge-Mondal,
    Annals 2020; lip domains: Atar-Burdzy; convex domains in high
    dimension: de Dios-Pardo et al.; symmetric quadrilateral subcases:
    arXiv:2604.19003). One domain, one theorem; the convex-quadrilateral
    conjecture itself remains open. Eight machine-checked records:
    two-sided spectrum localization (interval Galerkin uppers;
    exact-rational Crouzeix-Raviart + interval inertia lowers via Liu's
    framework), a certified Method-of-Particular-Solutions boundary
    defect by interval Taylor jets, the eigenpair enclosure, an interior
    partition DECIDED IN EXACT RATIONALS, solid-mean and reflected
    pointwise sweeps with zero surviving cells, and corner-tip
    certificates with Bessel-Fourier coefficients extracted at two
    independent annuli. Trust base: two quoted results of Liu
    (arXiv:1808.08148; PDF pinned by sha256 in the repository) and
    classical facts; everything else re-derives in ~2 minutes with red
    controls that fire. Machine-derived with Claude (Anthropic) driving
    certified-arithmetic instruments. NOT peer-reviewed; refutations and
    independent re-runs are invited.
  Related identifiers:
    - arXiv:1808.08148 (cites — You-Xie-Liu, the two quoted lemmas)
    - arXiv:2108.10386 (references — Judge-Mondal)  [OPERATOR: verify
      the canonical Annals DOI before deposit]
    - arXiv:2604.19003 (references — symmetric quadrilateral subcases)
    - math/9803030 (references — Burdzy-Werner counterexample)
    - https://carlostoledo.co/reports/ember.html (isSupplementTo)
    - https://github.com/carlostoledo1891/cert-machine (isSupplementTo)

## Deposit T — the MFG splitting program (terra)

Contents to upload: paper/terra-peaks.pdf + paper/terra-peaks.md,
certs/terra-recert-t{1..8}.json, certs/terra-peakcount-t{1..8}.json,
certs/terra-sigmastar.json, certs/terra-bracket-table.json,
certs/mfg-cap-census-N{2..5}-c-12.json, certs/mfg-cap-multiplicity.json,
a README naming the one-command reruns (run_recert.py, critcount,
sigmastar.py, census.js) and `make test`.

Metadata (paste-ready):

  Title:    The crowd splits: certified mean-field-game equilibria with
            more density peaks than potential wells, and the exact
            discount-free crossover 1/(8 pi^2)
  Creators: Toledo, Carlos (ORCID)
  Upload type: software · License: MIT (code/records; text CC-BY-4.0 if
            split is offered)
  Description:
    Certified equilibria of a discounted congestion-averse mean-field
    game in a single-well cost landscape carrying TWO density peaks —
    and, with the third harmonic in its predicted window, THREE. Two
    computer-assisted theorems plus a bracket table of certified
    instances whose interval-enclosure balls fix the exact peak count of
    the exact solution (peak counts derived from certified region signs
    only, never a float sign), bracketing every predicted threshold; the
    crossover sigma* = 1/(8 pi^2) is decided in exact rational
    arithmetic and is independent of the discount. Companion results:
    certified multiplicity (at least three distinct exact solutions in
    pairwise disjoint balls at each of six couplings, where
    Lasry-Lions monotonicity is silent) and a Krawczyk exhaustion census
    (EXACTLY three solutions of the truncated system, N = 2..5). The
    mechanism is linear response — the crowd re-weights a harmonic the
    potential already contains; distinguished from spontaneous
    instability (arXiv:2605.20213) and from peaks that mirror the
    potential (arXiv:1705.10741). The base congestion instance builds on
    the same author's unpublished validated-numerics computation, not on
    prior art. Machine-derived with Claude (Anthropic) driving
    certified-arithmetic instruments. NOT peer-reviewed; refutations and
    independent re-runs are invited.
  Related identifiers:
    - arXiv:1705.10741 (references — Cesaroni-Cirant)
    - arXiv:2605.20213 (references — Karuturi)
    - https://carlostoledo.co/reports/terra.html (isSupplementTo)
    - https://github.com/carlostoledo1891/cert-machine (isSupplementTo)

---

## Note on .zenodo.json (updated 2026-09-02)

.zenodo.json previously carried the lambda(4) metadata; that deposit is
minted (10.5281/zenodo.22225861), so the file now carries the
REPO-SNAPSHOT metadata from zenodo-plan.md's Deposit 1 — if the GitHub
integration is on, a tagged release mints a whole-repo DOI with correct
metadata instead of a stale lambda(4) copy. The per-result deposits
above are manual uploads with their own metadata, like lambda(4)'s.
