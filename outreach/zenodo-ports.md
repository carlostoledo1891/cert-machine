# Zenodo deposits for the two ported theorem programs (staged 2026-09-02)

STATUS 2026-09-04: THE PRIORITY STAMP EXISTS AND HAS MOVED ON ONCE. The
GitHub→Zenodo integration is on, so each tagged release mints a
repo-snapshot DOI automatically from .zenodo.json. The current archive is
**10.5281/zenodo.22285003** (version v2026.09.1, 2026-09-03); the first,
**10.5281/zenodo.22257596** (v2026.09, 2026-09-02), is superseded. Both sit
under concept DOI **10.5281/zenodo.22225860**, which resolves to the latest
and is what the site pages and the papers cite. Both theorem programs —
papers, records, code — are inside the archive.

THE DEPOSIT RECORD IS corpus/zenodo.json and check-wiring gates
CITATION.cff against it. It exists because CITATION.cff named v2026.09.1
and carried v2026.09's DOI for a day and a half: the version string and
the DOI were two facts nobody had written down together.

STILL OWED BY THE OPERATOR, since 2026-09-03: the three published records
carry the RETIRED title. .zenodo.json governs a new deposit; it does not
rewrite a published one. Metadata edits on a published record are allowed
and mint no new DOI — corpus/zenodo.json titleLag.howToClose has the
clicks.

WHAT REMAINS OPTIONAL: the two standalone per-result deposits below,
which buy citation granularity (their own titles, their own DOIs to
cite in the papers' front matter). They need the operator's account —
either the clicks, or a Zenodo personal access token
(zenodo.org → Applications → Personal access tokens, scopes
deposit:write + deposit:actions) handed to the machine, which will then
create both from these drafts and the prepared bundles in
outreach/zenodo-bundles/ (gitignored, rebuilt on demand).

BACKFILL STEP (machine's, if/when the per-result DOIs exist): add them
to CITATION.cff references and the papers; one commit + push.

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
    Annals 2020; lip domains: Atar-Burdzy; certain non-convex L-tiled polygons:
    Hatcher, arXiv:2405.19508; symmetric quadrangle subcases:
    arXiv:2604.19003 — while in sufficiently high dimension the
    conjecture is FALSE for convex sets, de Dios Pont arXiv:2412.06344,
    making the planar convex case the live one). One domain, one theorem; the convex-quadrilateral
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
    - arXiv:2412.06344 (references — de Dios Pont, high-dim counterexamples)
    - arXiv:2405.19508 (references — Hatcher, non-convex L-tiled polygons)
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
    To our knowledge the first validated-numerics equilibrium enclosures
    for a mean-field game, and the first certified equilibria whose exact
    peak count strictly exceeds the potential's well count: certified
    equilibria of a discounted congestion-averse mean-field game in a single-well cost landscape carrying TWO density peaks —
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
    potential (arXiv:1705.10741). The base congestion instance is the
    same author's companion enclosure (reports/mfg-congest.html), released
    together with the atlas; the two are one program and the priority
    claims are made by that joint release. Machine-derived with Claude (Anthropic) driving
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
