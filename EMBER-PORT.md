# EMBER PORT PLAN — the certified hot-spots theorem into cert-machine

Written 2026-09-02 from a read-only survey of
/Users/carlostoledo/Documents/frontier-apps/experiments/ember (THEOREM.md,
REPORT.md, PHASE2.md, the six cert-* scripts, ivspecial.js + its falsifier
tests). Operator: "ember is finished on frontier, plan the port."
Targets row: ember-port. frontier-apps has NO git and is NOT a lift source;
the same regime as the terra port applies — candidate data and Carlos's own
fresh code cross with shas recorded, everything with proof force re-runs
here, and the public artifacts are THIS machine's report, no bench
archaeology (records keep full provenance; pages and papers do not).

## The finding (what is being ported)

**THEOREM (frontier bench, 2026-09-01).** For the convex trapezoid
A=(0,0), B=(1,0), C=(17/20, 9/10), D=(1/4, 9/10) — side slopes 6 and 18/5,
no symmetry axis, not a lip domain: outside every class for which the hot
spots conjecture was previously proven — the second Neumann eigenfunction
attains its maximum and minimum on the boundary ONLY. mu1 is SIMPLE, with
mu1 in [12.020976127, 12.022398359].

The certified chain (six stages, ~3 min total, deterministic):
1. SPECTRUM — interval Galerkin uppers + Crouzeix-Raviart/inertia lowers:
   mu1 in [11.892663, 12.04181916], mu2 >= 13.955936 => gap => simple.
2. TRIAL — MPS over four corner Fourier-Bessel fans (exact Helmholtz
   solutions), lambda~ = 12.021687243; ||d_nu u||_boundary <= 1.2369e-5
   by interval Taylor-jet edge quadrature.
3. EIGENPAIR — defect + rational trace constant C_tr = 2.6427 + the CR
   localization: the tight mu1 window and ||u - c1*phi1||_L2 <= 6.5353e-5.
4. POINTWISE — solid-mean lemma with EXACT kernel norm I0 = 5/48;
   interior witnesses; CORE (depth >= 0.075) has no interior extremum.
5. COLLAR — value argument with reflected bounds across open edges
   (certified single-layer <= sup|d_nu u| * 3R/pi); ZERO residual cells.
6. CORNER TIPS — per-sector Bessel expansions with certified b0, b1, b2;
   A killed by d_r phi < 0; B/D by value; C by a min-form gradient bound
   plus the BESSEL LADDER identity (d_t^2 = (mu/4)[J_{nu+2}cos((nu+2)t) +
   J_{nu-2}cos((nu-2)t) - 2 J_nu cos(nu t)]) giving phi_nn >= 13.04 on
   the wedge.

TRUST BASE, stated so nothing hides: eqcert's rigor model (ours);
ivspecial.js interval special functions (47 falsifier tests there);
TWO literature inputs — Liu's framework theorem and the CR constant
0.1893*h_K, quoted from arXiv:1808.08148 — plus classical facts (sector
Neumann separation + H^1 regularity, Green, spectral theorem, Courant).

HONEST FRAMING (mandatory): "to our knowledge the first certified
hot-spots domain outside every analytically proven class" — with the
fence list attached every time: Judge-Mondal proved triangles (Annals);
de Dios-Pardo et al. convex high-dimensional; lip domains (Atar-Burdzy);
symmetric quadrilateral subcases (arXiv:2604.19003). The claim is ONE
DOMAIN, not the quadrilateral conjecture; the census (P3) is future work
and is never counted before it runs. Race watch: arXiv weekly.

## Ranked port list (do in this order)

1. **instruments/ivspecial — the interval special-function layer**
   (0.5-1d, low risk, HIGHEST GENERIC VALUE). Interval Gamma (Spouge),
   Bessel J_nu / J'_nu at fractional order INCLUDING negative order,
   with exact falsifiers. This is the missing instrument for the whole
   spectral-geometry lane. Route: copy-with-sha (Carlos's own clean-room
   MIT; re-authoring 200 lines of delicate rounding risks new bugs),
   then CONDITIONS OF ENTRY: line-by-line review; the 47 falsifier tests
   promoted to a registered battery; NEW cross-check reds against
   instruments/bigfloat (directed-rounding big-float evaluation of
   J_nu/Gamma at the falsifier points — two implementations, one gate)
   and the half-integer closed forms in exact rationals.
2. **instruments/hotspots — the chain re-run HERE, records written**
   (2-4d). Adapt the six cert-* scripts to instruments/interval (same
   eqcert lineage — require-path work, not re-derivation), parameterized
   by the quadrilateral; runners write certs/ember-*.json per stage plus
   one assembled certs/ember-theorem.json (statement, chain, margins,
   trust base, exact-rational vertices). BATTERY with red controls per
   stage — the bench has falsifier tests for ivspecial but the cert
   chain itself has none. Reds that must fire: a mutated vertex breaks
   the spectrum gap; an inflated defect breaks the eigenpair window; a
   forged kernel norm (I0 != 5/48) caught in exact rationals; a dropped
   reflection layer breaks the collar; a sign-flipped ladder identity
   breaks the wedge; a witness moved into the core breaks the assembly;
   partition completeness re-verified in RATIONALS (core + collar + tips
   covers the interior — geometry, decided exactly, not assumed).
3. **INDEPENDENT CROSS-DERIVATIONS — the two-implementations bar**
   (1-2d). The terra standard: agreement between independent routes.
   (a) I0 = 5/48 re-derived in exact rationals (trivial, do first);
   (b) C_tr re-derived from the star-shape geometry in rationals;
   (c) mu1 upper bound re-derived with an INDEPENDENT basis/mesh (our
   own interval Galerkin, different discretization — agreement window);
   (d) the corner coefficients b0, b1, b2 re-extracted at a different
   annulus radius (the extraction is the chain's most delicate step —
   two radii must agree within their enclosures).
4. **PIN THE LITERATURE INPUTS** (0.5d). arXiv:1808.08148 (Liu) into
   corpus/sources with sha256; the exact statement of the framework
   theorem and the 0.1893*h_K constant transcribed beside the pin; every
   ember record carries `trustBase` naming them. Same for the MPS
   lineage citations used by the paper.
5. **reports/ember.html** (1d) — born from design/ in the house skin,
   structure mirroring site/ember/index.html AS THE OPERATOR'S REPORT
   (the terra treatment: no port narrative on the page; a build gate
   enforcing it). Content: theorem statement with exact-rational
   vertices; the zone-map figure (the trapezoid with core / collar /
   four tips drawn — a small custom SVG, new but simple); the
   certificate-chain table with every number from certs/ember-*.json;
   the ladder-identity moment; the six-lesson methods note; Reproduce.
   Build refuses without every stage VERIFIED.
6. **The paper** (1d) — tools/build-ember-writeup.js -> paper/
   ember-hotspots.md + PDF via the printToPDF pipeline. Structure per
   the bench's own outline: intro (Rauch 1974 -> holes counterexample ->
   lip domains -> Judge-Mondal triangles -> dDP convex high-d ->
   quadrilaterals open, cite 2604.19003); the specimen + theorem; the
   chain as sections; methods & the six-lesson ledger; MPS lineage
   (Fox-Henrici-Moler 1967, Moler-Payne 1968, Betcke-Trefethen 2005);
   reproducibility + trust base; open problems (P3 census, sharper mu1,
   other quadrilaterals). [OPERATOR] flags at author/venue/
   acknowledgments/disclosure. The claims-ledger wording from this
   file's honest-framing block, verbatim.
7. **P3 — THE CENSUS (the follow-on campaign, NOT this port).** The
   engine-shaped prize: sweep the convex-quadrilateral moduli space with
   interval-coefficient shape boxes toward "convex quadrilaterals have
   no hot spots." Everything item 1-3 builds is its instrument set. Own
   plan, own pricing, after the port lands.

## DO NOT PORT

- lib.js (float FEM lab) and run-p2a3-float.js / run-margin.js /
  run-collar.js / run-sweep.js — diagnostics and float scaffolding; the
  census may want lib.js later, priced then.
- site/ember/index.html bytes and ember-field.js — the page is a REBUILD
  from design/ (ECharts never crosses; our SVG forms).
- The bench's PDF — the paper is rebuilt from certs here.

## Port conditions (non-negotiable, inherited from the terra port)

- frontier-apps is NOT a lift source: code crossings are copy-with-sha of
  Carlos's own MIT work plus review, or fresh authorship; sin-mfg remains
  read-only; provenance lives in records, never on pages.
- Exact arithmetic through instruments/interval; every stage a record in
  certs/; batteries whose reds FIRE; pages born from design/; every
  displayed number from a gated record; honest counting (one domain, one
  theorem — the census is not pre-counted).
- The vertices are EXACT RATIONALS (17/20, 9/10, 1/4) — state them as
  such everywhere; no decimal drift.
- Sends stay held: page and paper live on disk until the operator
  releases them, alongside terra in the release-order decision.

## Red flags that must not travel

- No red controls anywhere on the cert chain (deliberate bench policy;
  ends here, as with terra).
- The two Liu inputs are ASSUMPTIONS, not certificates — named in every
  record's trust base, never silently absorbed.
- "First certified hot-spots domain" needs its fence list every time it
  appears; the race watch (arXiv weekly) is part of the claim's honesty.
- The corner-coefficient extraction is the most delicate stage —
  cross-derivation 3(d) is a condition of entry for the theorem record,
  not an optional extra.
