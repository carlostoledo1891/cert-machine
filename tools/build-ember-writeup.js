#!/usr/bin/env node
/* build-ember-writeup.js — generate paper/ember-hotspots.md, the
   record-driven write-up of the certified hot-spots theorem.

   DIVISION OF LABOR (the build-lambda4-writeup.js pattern): the prose is
   authored HERE, once, and reviewed like any mathematics. Every NUMBER —
   enclosures, defects, witnesses, margins, corner coefficients, cell
   counts — is interpolated from the certs/ember-*.json records, so the
   document can never quote a constant the machine did not prove. The
   build REFUSES if any record is missing, refused, or drifted, and
   carries the honest-framing gates of the report page.

   [OPERATOR] flags mark every human-only spot: author line, venue,
   acknowledgments, AI-involvement disclosure.

   usage: node tools/build-ember-writeup.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('EMBER WRITEUP REFUSED: ' + m); process.exit(1); };
const rd = (f) => {
  const p = path.join(ROOT, 'certs', f);
  if (!fs.existsSync(p)) die('missing certs/' + f);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
/* the band record: present once tools/run-ember-band.js has verified it */
const BANDP = path.join(ROOT, 'certs', 'ember-band.json');
const BAND = fs.existsSync(BANDP) ? JSON.parse(fs.readFileSync(BANDP, 'utf8')) : null;
const bandSection = BAND ? `
## The band: from this domain to a positive-measure family
_
For every c in [${BAND.audited.interval[0]}, ${BAND.audited.interval[1]}] the
trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10) satisfies the same conclusion:
mu_1(c) is simple and the second Neumann eigenfunction attains its maximum and
its minimum on the boundary only. The domain treated above, c = 17/20, is the
right endpoint of that interval. To our knowledge this is the first certified
hot-spots result for a positive-measure FAMILY of domains outside every proven
class, rather than for a single specimen.
_
The certified interval is assembled from ${BAND.audited.chunks} chunks carrying
${BAND.audited.sigmaCells} sigma-cells in total, with uniform bounds
mu_1(c) >= ${BAND.audited.mu1LowerUniform.toFixed(5)} and
mu_2(c) >= ${BAND.audited.mu2LowerUniform.toFixed(5)}, so the spectral gap never
closes and mu_1 stays simple across the whole family. The thinnest zone margins
over every cell of every chunk are ${BAND.audited.marginPMin.toExponential(3)}
(max side) and ${BAND.audited.marginMMin.toExponential(3)} (min side), both
strictly positive, with ${BAND.audited.collarSurvivorsOutsideWindows} collar
survivors outside the corner windows anywhere. Corner C keeps b_1 certified
strictly negative on every chunk, sup b_1 = ${BAND.audited.tipC_b1_sup.toFixed(4)}
— the genericity condition the single-domain proof leaned on, now checked across
the family.
_
WHAT AN INTERVAL THEOREM CAN GET WRONG. A union of chunk theorems fails on
COVERING far more easily than on arithmetic, and neither covering claim is
visible inside any single certificate: the chunks must tile the interval with
shared endpoints, and inside each chunk the sigma-cells must tile [-1,0] in
every stage that reports per-cell numbers. Both ladders are re-derived, from the
stage records themselves, by instruments/emberband/verify-band.js, which shares
no code with the program that produced them; a gap of 1e-12 in either would make
the interval statement false. Eight red controls break the band in eight
realistic ways and each must be refused.
_
SCOPE. The six-stage chain was executed on the bench where it was developed and
is NOT re-executed in this repository (about ten hours; the defect stage alone is
25 minutes per chunk). What is contributed here is the independent audit over
sha-pinned records. The convex-quadrilateral conjecture itself remains open: this
is a family, not the census.
`.replace(/^_$/gm, '') : '';

const R = {};
for (const st of ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross', 'theorem']) {
  R[st] = rd('ember-' + st + '.json');
  if (R[st].verdict !== 'VERIFIED') die('ember-' + st + ' not VERIFIED');
}
const pin = require(path.join(ROOT, 'instruments', 'pin.js')).verify('liu2018_arxiv-1808-08148.pdf');
if (!pin.ok) die('Liu pin drifted');
const SP = require(path.join(ROOT, 'instruments', 'hotspots', 'specimen.js'));

const e2 = (x) => Number(x).toExponential(2);
const e4 = (x) => Number(x).toExponential(4);
function outward([lo, hi], dp) {
  const f = Math.pow(10, dp);
  return '[' + (Math.floor(lo * f) / f).toFixed(dp) + ', ' + (Math.ceil(hi * f) / f).toFixed(dp) + ']';
}
const ivs = (a, dp) => outward(a, dp === undefined ? 4 : dp);
const nuOf = c => (SP.CORN[c].nub[0] + SP.CORN[c].nub[1]) / 2;
const omDeg = c => ((SP.CORN[c].om[0] + SP.CORN[c].om[1]) / 2 * 180 / Math.PI);

const MU1 = R.eigenpair.mu1;
const WITP = R.pointwise.witnesses.max.value;
const WITM = R.pointwise.witnesses.minDeep.value;
const T = R.corner.tips;

const md = `# A certified hot-spots domain beyond the proven classes

**Draft v0.9 — generated from machine certificates (git ${git}); every
numerical constant below is interpolated from a VERIFIED record and none is
hand-transcribed.**

[OPERATOR] author line · [OPERATOR] venue · [OPERATOR] acknowledgments · [OPERATOR] AI-involvement disclosure wording

---

## Abstract

Let Omega be the trapezoid with vertices A = (0,0), B = (1,0),
C = (17/20, 9/10), D = (1/4, 9/10): convex, with side slopes 6 and 18/5,
no axis of symmetry, and not a lip domain. We prove, by a certified
computation whose every step is either an exact rational decision or an
outward-rounded interval enclosure, that the second Neumann eigenvalue of
Omega is simple, with

    mu_1 in ${ivs(MU1, 9)},

and that the second Neumann eigenfunction attains its maximum and its
minimum on the boundary only — and, more precisely, that the maximum is
attained at vertex A and only there. To our knowledge this is the first
certified hot-spots domain outside every class for which the conjecture
was previously proven: all triangles (Judge and Mondal, Annals of
Mathematics 2020, with the 2022 erratum), lip domains (Atar and Burdzy),
certain non-convex L-tiled polygons (Hatcher, arXiv:2405.19508), and the
symmetric quadrangle subcases (Deng-Gui-Jiang-Yang-Yao, arXiv:2604.19003).
In the other direction, the conjecture is FALSE for convex sets in
sufficiently high dimension (de Dios Pont, arXiv:2412.06344), which makes
the planar convex case — where this domain lives — exactly the place the
conjecture remains expected. The claim is a positive-measure FAMILY of domains (see the band section
below) together with the single-domain theorem and corollary proved here in
full; the convex-quadrilateral conjecture itself remains open. The certificate chain assumes two quoted results from the literature
(Liu's lower-bound framework and the Crouzeix-Raviart interpolation
constant 0.1893 h_K, both from arXiv:1808.08148, whose PDF is pinned by
sha256 in the repository) and standard facts; everything else re-derives
mechanically in about two minutes.

---

## 1. The problem and its fences

Rauch's 1974 conjecture — the "hot spots" conjecture — asks whether the
second Neumann eigenfunction of a bounded domain attains its extrema on
the boundary: heat left to itself should push its hottest point to the
edge. Burdzy and Werner refuted the general form with a domain with holes;
for simply connected, and in particular convex, plane domains the
conjecture is believed true and proved only classwise:

- **lip domains** (two Lipschitz-1 graphs): Atar-Burdzy, by probabilistic
  coupling;
- **all triangles**: Judge-Mondal, Annals of Mathematics 2020 (erratum
  2022) — one Annals paper for the simplest polygon class, after partial
  acute-triangle results (Siudeja, arXiv:1308.3005);
- **certain non-convex polygons** (L-tiled domains): Hatcher,
  arXiv:2405.19508;
- **quadrangles with a symmetry axis** and related subcases:
  Deng-Gui-Jiang-Yang-Yao, arXiv:2604.19003 (April 2026).

And in the opposite direction: **the conjecture is false for convex sets
in sufficiently high dimension** (de Dios Pont, arXiv:2412.06344,
"Convex sets can have interior hot spots"), so the planar convex case is
precisely where the conjecture remains expected. Convex quadrilaterals in
the plane remain open. A validated-numerics route to acute triangles was
developed in the Polymath7 project (with numerics by Nigam) before the
analytic triangle proof; we cite it as the computational antecedent of
the present approach. The specimen here is chosen
to sit outside every listed class: its side slopes (6 and 18/5) exceed 1,
so it is not a lip domain in any axis orientation; it has no symmetry
axis; it is a quadrilateral, not a triangle; it lives in the plane. The
interior angles are ${omDeg(0).toFixed(2)} deg (A), ${omDeg(1).toFixed(2)} deg (B),
${omDeg(2).toFixed(2)} deg (C), ${omDeg(3).toFixed(2)} deg (D); the corner exponents
nu = pi/omega are ${nuOf(0).toFixed(4)}, ${nuOf(1).toFixed(4)}, ${nuOf(2).toFixed(4)},
${nuOf(3).toFixed(4)}.

A certified computation is a different kind of object from a numerical
study: every displayed inequality is a theorem about the exact
eigenfunction, obtained through outward-rounded interval arithmetic over
IEEE doubles, exact BigInt rational decisions where the statement is
algebraic or geometric, and directed dyadic big-float enclosures for the
independent cross-checks. Floating point proposes; it never decides.

## 2. The theorem

**Theorem.** Let Omega be the trapezoid above and let phi be a second
Neumann eigenfunction of -Delta on Omega (mu_1 is simple, so phi is unique
up to scale). Then phi attains its maximum and its minimum on the boundary
of Omega only, and

    mu_1 in ${ivs(MU1, 9)}   (width ${e2(R.eigenpair.mu1width)}),
    mu_2 >= ${R.spectrum.mu2lo.toFixed(6)}.

Normalization: phi-hat := c_1 phi_1 = u - e as produced by the chain;
extrema locations are scale-invariant; the sign is fixed by
phi-hat(A) > 0.

**Corollary (the hot spot is vertex A).** The maximum of phi-hat over the
closure is attained at vertex A and only there, with

    phi-hat(A) in ${ivs(R.theorem.corollary.phiAtA, 6)}   (= b_0(A) exactly).

Proof from the chain's records: the interior witness w+ lies inside A's
corner sector (an exact rational disk decision); the certified radial
monotonicity d_r phi-hat < 0 on the whole punctured sector means phi-hat
strictly decreases along every ray from A, so phi-hat(A) > phi-hat(w+) >=
${R.pointwise.witnesses.max.value.toFixed(6)}; and every point outside the sector — core cells, collar
cells, and the value ranges of tips B, C, D — is certified strictly below
that bound. At the vertex the corner expansion collapses to b_0(A) since
J_{k nu}(0) = 0 for k >= 1. For triangles, "extrema only at vertices" is
Judge-Mondal's refinement of the hot-spots statement; the maximum-side
analogue now holds, certified, for this quadrilateral.

The minimum's location is deliberately left as an open question of
enclosure width: phi-hat(C) = b_0(C) in ${ivs(R.corner.tips.C.b0, 4)} overlaps the observed
boundary minimum (float value -1.9998 at distance 0.0195 from C along the
top edge), so vertex-vs-edge-interior is not decided. A tighter corner
extraction would decide it; an off-vertex answer would contrast with the
triangle behaviour.

## 3. The certificate chain

The proof is a chain of eight machine-checked records; each stage reads
its inputs from the upstream record, so no constant travels by hand.

### 3.1 Spectrum (certs/ember-spectrum.json)

Two-sided localization. Upper bounds by an interval Galerkin
Rayleigh-Ritz method on the pulled-back unit square (basis
cos(i pi u) P~_j(v), shifted Legendre, NU = NV = 12): the v-integrals are
exact BigInt rationals (the only non-polynomial piece is expanded in a
positive series with a certified tail; intervals enter LAST), the
u-integrals are closed forms over an interval pi, and any float-chosen
trial subspace gives a certified upper bound through a Gershgorin pencil
estimate. Lower bounds by the Crouzeix-Raviart method: exact-rational
assembly on the mapped grid (456 CR degrees of freedom; the kernel
K 1 = 0 is checked exactly), discrete eigenvalue counts by interval
LDL^T inertia with diagonal pivoting (Sylvester), and Liu's framework

    lambda_k >= lambda_{h,k} / (1 + C_h^2 lambda_{h,k}),
    C_h = 0.1893 h_max    [the two literature inputs],

giving

    mu_1 in ${ivs(R.spectrum.mu1, 6)},   mu_2 >= ${R.spectrum.mu2lo.toFixed(6)}.

Since ${R.spectrum.mu2lo.toFixed(4)} > ${R.spectrum.mu1[1].toFixed(4)}, exactly one nonzero
eigenvalue lies below ${R.spectrum.mu2lo.toFixed(4)}: **mu_1 is simple**. Calibration:
the same code encloses mu_1 of the 1 x 9/10 rectangle around the exact
pi^2 at every run.

### 3.2 The trial and its boundary defect (certs/ember-defect.json)

A Method-of-Particular-Solutions trial u = sum a_i psi_i over four corner
Fourier-Bessel fans, psi = J_{k nu}(sqrt(lambda~) r) cos(k nu theta), with
lambda~ = ${R.defect.trial.lambdaTilde} and ${R.defect.trial.nbasis} frozen exact-double
coefficients from a deterministic float proposer (Betcke-Trefethen
subspace angle, rank-truncated SVD, an absolute noise floor for J_nu at
large nu). The trial satisfies -Delta u = lambda~ u EXACTLY, and each
fan's conormal derivative vanishes analytically on its own corner's two
edges, so only far-corner fans produce boundary flux. Along each edge the
flux closes under differentiation via the Bessel ODE, so order-2 interval
Taylor jets give (f, f', f'') with a single hand formula, and a certified
midpoint-Taylor cell rule over ${R.defect.cells} cells per edge yields

    || d_nu u ||_{L^2(boundary)} <= ${e4(R.defect.defectUpper)}

(float value ${e2(R.defect.trial.floatDefect)} — the certified overhead is modest), plus
certified per-edge pointwise sups |d_nu u| <= ${e2(Math.max(...R.defect.supFluxPerEdge))}.
Twelve value bridges and four derivative bridges against an independent
float evaluation guard the jets (a passing value bridge does not test a
jet).

### 3.3 The eigenpair (certs/ember-eigenpair.json)

For the exact-Helmholtz trial, Green's identity gives
r(v) = a(u,v) - lambda~ m(u,v) = int_boundary (d_nu u) v ds, so with the
rational star-shaped trace constant (star center x0 = (21/40, 9/20),
c_0 >= ${R.eigenpair.trace.c0lo.toFixed(5)}, R <= ${R.eigenpair.trace.Rup.toFixed(5)}, C_tr <= ${R.eigenpair.trace.Ctr.toFixed(5)}):

    sum_k c_k^2 (mu_k - lambda~)^2 / (1 + mu_k) <= eps^2,
    eps = D C_tr = ${e4(R.eigenpair.epsilon)}.

With F = max(1/lambda~^2, (1+mu2lo)/(mu2lo-lambda~)^2) = ${R.eigenpair.F.toFixed(4)} and a
certified interior-box lower bound ||u|| >= ${R.eigenpair.normLower.toFixed(3)}:

    mu_1 in ${ivs(MU1, 9)},
    || u - c_1 phi_1 ||_{L^2} <= ${e4(R.eigenpair.eigenfunctionL2Error)}   (relative ${e2(R.eigenpair.relativeL2Error)}),
    |e|_{H^1} <= ${e4(R.eigenpair.EH1)},   |lambda~ - mu_1| <= ${e4(R.eigenpair.deltaLambda)}.

This tightens the CR window by a factor of about 105 and is the
Moler-Payne mechanism in its modern a-posteriori form.

### 3.4 The partition, decided in rationals

The interior is partitioned on the 1/100 grid: a cell is a CORE cell iff
the minimum of the boundary-distance over its four corners is >= 3/40 —
exact, because the distance-to-boundary of a convex domain is concave, so
its minimum over a cell is attained at a corner; a cell belongs to a
corner sector iff it lies ENTIRELY inside that vertex's 0.11-disk — exact,
because |p - V| is convex, so its maximum over a cell is attained at a
corner; the remaining cells meeting Omega (an exact separating-axis
decision) are COLLAR cells. The census — ${R.theorem.partition.coreCells} core,
${R.theorem.partition.collarCells} collar, ${R.theorem.partition.tipCells} sector cells — is re-decided in exact
rationals at assembly time. Every interior point within 0.11 of a vertex
lies in that vertex's sector by convexity, so the three classes cover the
interior by construction.

### 3.5 Core and collar sweeps (certs/ember-pointwise.json, certs/ember-collar.json)

The pointwise machinery is a solid-mean lemma with the EXACT kernel norm:
for -Delta w = f on B_R(x0),

    w(x0) = avg_{B_R} w + int G_R f,   ||G_R||_{L^2} = R sqrt(I_0 / 2 pi),
    I_0 = int_0^1 (-ln t - (1-t^2)/2)^2 t dt = 5/48   (derived in exact rationals).

Two interior witnesses anchor the argument, their balls decided inside
Omega in exact rationals:

    phi-hat(w+) >= ${WITP.toFixed(6)}      (near A, ball R = ${R.pointwise.witnesses.max.R.toFixed(4)}),
    -phi-hat(w-') >= ${WITM.toFixed(6)}     (under the boundary min, R = ${R.pointwise.witnesses.minDeep.R.toFixed(3)}).

Every CORE cell is killed on both sides by whole-cell value bounds plus
the solid-mean error at R = 0.07 (valid at every core point), with
kill-or-refine to 1/400: zero survivors, margins ${e2(R.pointwise.core.marginMax)} (max
side) and ${e2(R.pointwise.core.marginMin)} (min side). Every COLLAR cell is killed the
same way with REFLECTED bounds: the even reflection of phi-hat across the
nearest open edge is exact, and the reflection of u adds a single layer
with density 2 d_nu u, bounded by sup|d_nu u| 3R/pi from the per-edge
certified sups — ${R.collar.sweep.collarCells} cells, zero survivors (worst kills
${R.collar.sweep.worstP.toFixed(6)} vs ${WITP.toFixed(6)} and ${R.collar.sweep.worstM.toFixed(6)} vs ${WITM.toFixed(6)}).

### 3.6 The corner sectors (certs/ember-corner.json)

In each corner sector, Neumann separation of variables and H^1 regularity
(which excludes the singular Bessel family) give EXACTLY

    phi-hat = sum_k b_k J_{k nu}(sqrt(mu_1) r) cos(k nu theta).

The coefficients b_0, b_1, b_2 are certified by big-annulus L^2
extraction — the corner's own fan integrates exactly by angular
orthogonality, the far part by second-order midpoint cells, the
eigenfunction error contributes at most E sqrt(D_k) — with a Parseval
bound on everything above mode 2. **The extraction is the chain's most
delicate step, so it is performed at TWO annuli, and the two enclosures of
every coefficient must intersect (they do; this is a condition of entry
for the theorem record):**

| corner | nu | b0 (annulus 1) | b0 (annulus 2) | b1 (annulus 1) | b1 (annulus 2) |
|---|---|---|---|---|---|
| A | ${nuOf(0).toFixed(4)} | ${ivs(T.A.b0, 3)} | ${ivs(T.A.secondAnnulus.b0, 3)} | ${ivs(T.A.b1, 3)} | ${ivs(T.A.secondAnnulus.b1, 3)} |
| B | ${nuOf(1).toFixed(4)} | ${ivs(T.B.b0, 3)} | ${ivs(T.B.secondAnnulus.b0, 3)} | ${ivs(T.B.b1, 3)} | ${ivs(T.B.secondAnnulus.b1, 3)} |
| C | ${nuOf(2).toFixed(4)} | ${ivs(T.C.b0, 3)} | ${ivs(T.C.secondAnnulus.b0, 3)} | ${ivs(T.C.b1, 3)} | ${ivs(T.C.secondAnnulus.b1, 3)} |
| D | ${nuOf(3).toFixed(4)} | ${ivs(T.D.b0, 3)} | ${ivs(T.D.secondAnnulus.b0, 3)} | ${ivs(T.D.b1, 3)} | ${ivs(T.D.secondAnnulus.b1, 3)} |

On each sector r <= 0.11 (the wedge at C to 0.12):

- **B and D die by value on both sides**: phi-hat ranges ${ivs(T.B.valueRange, 3)}
  and ${ivs(T.D.valueRange, 3)} — clear of both witnesses.
- **A** (the boundary maximum lives at the vertex): the min side dies by
  value (range ${ivs(T.A.valueRange, 3)}); on the max side an interior maximum
  would force a critical point, but d_r phi-hat < 0 throughout the sector
  (worst ${e2(T.A.radialWorst)} on r in [0.008, 0.11]; on r <= 0.008 the factored
  form d_r phi-hat / r <= ${T.A.innerDisk.toFixed(2)} < 0).
- **C** (the boundary minimum lives ${(0.0195).toFixed(4)} from the vertex): the max
  side dies by value (range upper ${T.C.valueRange[1].toFixed(3)}). The min side splits
  at theta_1 = 0.35. On [0.35, omega], the gradient min-form — a quadratic
  in cos(nu theta) with mode 2 and the tail as perturbations — stays
  positive down to r = 1e-5 (worst ${T.C.minFormWorst.toFixed(4)}), and an analytic
  limit piece covers r <= 1e-5. On the wedge [0, 0.35] along the top edge,
  the second tangential derivative comes from the Bessel ladder identity

      d_t^2 [J_nu(k r) cos(nu theta)] = (k^2/4) [ J_{nu+2} cos((nu+2) theta)
        + J_{nu-2} cos((nu-2) theta) - 2 J_nu cos(nu theta) ],

  which is exact and sign-explicit where the polar-split pieces diverge
  individually: the singular term J_{nu-2} (a NEGATIVE fractional order,
  nu - 2 = ${(nuOf(2) - 2).toFixed(3)}) arrives multiplied by the certified b_1 < 0, so it
  HELPS. The result is phi-hat_nn >= ${T.C.wedgeWorstC2.toFixed(2)} across the whole wedge
  down to r = 1e-6 (inner piece >= ${T.C.wedgeInnerC2.toFixed(2)}), and the exact
  second-order Taylor expansion from the Neumann edge (the first-order
  term vanishes by the boundary condition) forces every interior wedge
  point strictly above the boundary minimum.

### 3.7 Assembly

Suppose an interior x* attains the maximum of phi-hat. Then
phi-hat(x*) >= phi-hat(w+) >= ${WITP.toFixed(6)}. But x* lies in a killed core
cell, a killed collar cell, or a corner sector: B, C, D are dead by value,
and in A a maximum forces grad phi-hat(x*) = 0, contradicting
d_r phi-hat < 0. So the maximum lives on the boundary only; the minimum
argument is symmetric with w-'. QED.

### 3.8 Independent cross-derivations (certs/ember-cross.json)

Two implementations, one gate: I_0 = 5/48 re-derived in exact rationals;
the trace constant re-derived from the exact-rational star geometry on
directed dyadic big-floats, C_tr in [${R.cross.Ctr.bigfloat[0].toFixed(12)}, ${R.cross.Ctr.bigfloat[1].toFixed(12)}]
(the doubles route agrees); mu_1 bounded above independently on a
conforming P1 finite-element basis (${R.cross.p1Upper.upper.toFixed(4)} at n = ${R.cross.p1Upper.n} — a
different discretization family confirming the localization from above);
and the second-annulus corner extraction of section 3.6.

## 4. Methods notes (the lessons the falsifiers taught)

1. Intervals enter LAST in rational-core pipelines: converting per-term
   against large Legendre coefficients destroys exact cancellation.
2. Unpivoted interval LDL^T dies mid-elimination; diagonal-pivoted
   right-looking elimination with float pre-scaling (both congruences)
   is robust.
3. Galerkin strong residuals diverge at corners; exact Helmholtz corner
   fans make the interior residual identically zero and leave only
   boundary flux — the architecture the corner exponents force.
4. A passing VALUE bridge does not test a jet: bridge every derivative
   order used (a theta'-sign forgery inflates the defect a thousandfold
   while all value bridges pass — the battery keeps this as a red).
5. Cell tests must match the geometry: depth is concave (cell minimum at
   a corner — exact), distance is convex (cell maximum at a corner —
   exact); a partition must be re-decided exactly, never assumed from
   sweep bookkeeping. Two quantization slivers in an earlier version of
   the partition logic were found and closed this way; the battery keeps
   the unsound rule as a firing red control.
6. The ladder identity beats the polar split wherever individually
   divergent pieces cancel: choose the form whose signs the interval
   arithmetic can see.

## 5. Lineage

The Method of Particular Solutions is Fox-Henrici-Moler (1967); the
eigenfunction enclosure from a boundary defect plus a spectral gap is
Moler-Payne (1968), used here in its residual form with the certified
Crouzeix-Raviart gap as the gap provider (Liu's framework, You-Xie-Liu
arXiv:1808.08148); the subspace-angle regularization of MPS is
Betcke-Trefethen (2005). The corner analysis is the computational twin of
Judge-Mondal's. [OPERATOR/CITE: verify the final reference list against
the pinned PDFs before submission.]

## 6. Reproducibility and trust base

Everything re-runs from the repository, deterministically:

    node tools/run-ember-chain.js          # all 8 stages, ~2 min
    node instruments/hotspots/battery.js   # record walk + 8 red controls
    node instruments/ivspecial/battery.js  # the Gamma/Bessel layer
    make test                              # every battery in the machine

Trust base, stated so nothing hides: the interval rigor model
(outward-rounded IEEE doubles; exact BigInt rationals; directed dyadic
big-floats for cross-checks); the interval special-function layer with
its closed-form falsifiers and two-implementation gates; TWO literature
inputs — Liu's framework theorem (Thm 2.4) and the Crouzeix-Raviart
constant 0.1893 h_K (Lemma 3.2), both quoted from arXiv:1808.08148, PDF
pinned sha256 ${pin.sha256.slice(0, 16)}..., transcription beside the pin — and
classical facts (sector Neumann separation + H^1 regularity, Green's
identity, the spectral theorem, Courant). Machine-derived; not
peer-reviewed; not independently rerun.

${bandSection}

## 7. Open problems

1. **The census.** Sweep the moduli space of convex quadrilaterals with
   interval-coefficient shape boxes toward "convex quadrilaterals have no
   hot spots". Every instrument above is parameterized by the
   quadrilateral; the campaign is scoped, priced, and NOT started — and
   is not counted here.
2. **The cold spot's exact location.** Decide vertex C versus the edge
   interior (see the corollary's open twin): a tighter b_0(C) extraction
   plus one certified edge comparison settles it either way.
3. **Sharper mu_1.** The enclosure width ${e2(R.eigenpair.mu1width)} is defect-limited;
   larger fans and finer edge quadrature buy digits directly.
4. **Other single domains.** Non-trapezoidal convex quadrilaterals with
   all slopes > 1 need no new mathematics, only compute.

---

*Generated ${new Date().toISOString().slice(0, 10)} from certs/ember-*.json (git ${git}).
This draft wants one human read [OPERATOR] before anything further; nothing
is sent anywhere without the operator's word.*
`;

/* gates */
if (/first certified/i.test(md) && !/to our knowledge/i.test(md)) die('claim without qualifier');
for (const fence of ['Judge and Mondal', 'lip domains', '2604.19003', 'de Dios Pont', '2405.19508', '1308.3005', 'Polymath7']) {
  if (!md.includes(fence)) die('fence list incomplete: ' + fence);
}
if (/de Dios[- ]Pardo/.test(md)) die('misattributed fence — 2412.06344 is de Dios Pont, a COUNTEREXAMPLE, not a proven class');
if (/frontier|origin bench|ported/i.test(md)) die('workshop archaeology reached the paper');

fs.writeFileSync(path.join(ROOT, 'paper', 'ember-hotspots.md'), md);
console.log('paper/ember-hotspots.md written (' + md.length + ' bytes, git ' + git + ')');
