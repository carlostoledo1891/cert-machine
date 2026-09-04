# THE INTERFEROMETER — Stage 0 log (session 11, 2026-09-03)

The black hole as a SET, not a photograph. What follows is floats only; there
is no proof on disk yet. What there is: a constraint set with no prior in it, a
certificate-shaped upper bound, an exhibited witness, and six reds.

## THE DATA

Event Horizon Telescope public release `2024-D01-01` (M87, April 2018),
calibrated Stokes I, exactly as published: 24 CSVs, 7.2 MB, in
`experiments/interferometer/data/`. Three nights x four bands x **two
independent calibration pipelines** (CASA and HOPS — a free cross-check nobody
has to be asked for). Columns, from the file's own header:

    time(UTC), T1, T2, U(lambda), V(lambda), Iamp(Jy), Iphase(d), Isigma(Jy)

April 21 band 3 is the best night: 7317 rows, 8 stations, 26 baselines, uv out
to 7.35 Glambda — a 28 uas fringe spacing.

## THE OBJECT

mu is any nonnegative measure on Omega, a stated field of view. No pixel basis,
no smoothness, no prior, no total-variation, no entropy. The constraint set is

    S = { mu >= 0 on Omega :  |V_mu(u_k)| <= A_k  for all k,   mu(Omega) <= F }

with A_k = |V_k| + nsig*sigma_k + gain*|V_k|, and we bound  sup_{mu in S} INT f dmu.

**Why amplitudes and not the complex visibilities.** Measured, not assumed: a
nonnegative image confined to 128 uas fits the released COMPLEX visibilities no
better than chi2/dof = 4.8, worst residual 33 released sigmas, needing 0.127 Jy
of absolute slack on top of 3 sigma before the set is even nonempty. That is
not a bug — these data are network-calibrated (which fixes AMPLITUDES) but not
self-calibrated, so residual per-station phases are still in the file, and every
published image of them is made WITH self-calibration. An upper bound on |V| is
invariant under every station phase and needs only a gain-amplitude allowance.
So the enclosure uses the part of the data that survives calibration and uses
nothing else. Feasibility becomes automatic (mu = 0 is in S) and the question
sharpens to: **do the amplitude ceilings alone forbid a bright centre?**

## THE CERTIFICATE (ERDOS-1038's shape, with cosines)

For complex y_k and lambda >= 0, IF the pointwise inequality

    f(x)  <=  Re SUM_k conj(y_k) exp(-2 pi i (u_k l + v_k m))  +  lambda      (*)

holds for EVERY x in Omega, then for every mu in S, since
Re(conj(y_k) V_mu(u_k)) <= |y_k| |V_mu(u_k)| <= |y_k| A_k,

    INT f dmu   <=   SUM_k |y_k| A_k  +  lambda F.

Nonnegative multipliers, one pointwise inequality over a continuum, verified by
boxing x: `cert-force.js` with cos/sin instead of a log-potential. The optimiser
only PROPOSES (y, lambda) — the bound is valid for whatever it proposes, so
nothing in the optimiser has to be trusted. **The measured phases never appear
in the bound.**

Stage 0 checks (*) by cutting planes (optimise on a working set, hunt violations
on an independent fine scan, add the worst back) and closes the gaps between
scan samples with a Lipschitz margin, |grad h| <= 2 pi SUM_k |y_k| |(u_k,v_k)|.
Stage 1 replaces that margin with interval boxes and `lib/eqcert`.

The witness side is easier and owes no apology: a nonnegative grid measure IS a
measure, so anything exhibited there is a genuine lower bound on the sup.

## FILES

    vis.js         data layer; conventions fixed in one place; synthetic skies
    lab-vis.js     Stage 0: dual (certificate-shaped), primal (witness), reds
    data/          the 24 released CSVs, untouched
    out/           dirty images, profile.json

    node lab-vis.js coverage
    node lab-vis.js dirty   Nf=512
    node lab-vis.js bound   disk 10 [opts]
    node lab-vis.js profile [opts]           # the ceiling profile
    node lab-vis.js reds    [opts]

## WHAT STAGE 0 MEASURED

**The reds all fire** (`node lab-vis.js reds sub=10 N=48 Nf=384 rounds=2 iters=350`):
a ring we built ourselves, a ring with a bright centre, and a point source are
each inside their own bound; the certificate dominates the witness; deleting the
Greenland Telescope loosens the bound (0.940 -> 1.410); widening the gain
allowance never tightens it; the bound is monotone in the radius; and the two
independent calibration pipelines agree to 13.8%.

**RED 7 is not a formality, it is the result.** The amplitude-only constraint
set is invariant under translating mu — a shift multiplies every V_mu(u) by a
phase and leaves |V_mu(u)| alone — so the ceiling for a disk of radius r cannot
depend on where that disk is. Measured: 0.9400 / 0.9231 / 0.9383 Jy for disks at
(0,0), (22,0) and (-14,16) uas, a 1.8% spread. **The amplitudes carry no
positional information whatsoever.** Every number below is therefore a statement
about EVERY location in the field at once, which is stronger than a map — and it
says the famous ring is not forced by the amplitudes. Where the ring sits, and
where the hole sits, comes from the closure phases and the imaging prior. The
amplitudes forbid only CONCENTRATION.

**The concentration profile** (April 21 2018, band 3, HOPS; 6677 rows kept above
0.4 Glambda, of which 1670 are given to the dual and ALL 6677 to the witness;
A_k = |V_k| + 3 sigma_k + 5% gain; mu(Omega) <= 2 Jy inside a 128 uas field;
working set 48x48, fine scan 512x512, 2 cutting-plane rounds):

| r (uas) | witness (Jy) | ceiling (Jy) | ceiling / witness | Lipschitz share |
|---|---|---|---|---|
|  4 | 0.0066 | 0.4846 | 73x | 10.1% |
| 12 | 0.0856 | 0.8379 | 9.8x | 5.8% |
| 20 | 0.2142 | 1.1938 | 5.6x | 6.2% |
| 32 | 0.5509 | 1.5781 | 2.9x | 3.2% |

Read the top row as: no nonnegative sky in the stated field, with at most 2 Jy in
it, whose amplitudes stay under the measured ones, can put more than 0.485 Jy
inside ANY 4 uas disk — and one that puts 0.0066 Jy there exists. `out/profile.json`.

A first pass of this table (`out/profile-witness-invalid.json`, kept as the
evidence) reported witnesses 2-3x higher, because `sub` — the switch that thins
the constraint set — was thinning it for the WITNESS as well as the dual. That
is sound for the ceiling and silently wrong for the witness: dropping
constraints enlarges the feasible set, so a measure that satisfies half of them
is not a witness for the whole problem. The ceilings in that first pass stand
(and are slightly TIGHTER, 0.4554 at r=4, because it ran on a finer grid).

**WHICH SIDE IS LOOSE, AND WHY.** The witness sits below a natural
scale: the smallest ceiling in the kept data is min_k A_k = 0.0153 Jy, and a
4 uas blob is nearly unresolved even at 7.35 Glambda (form factor 0.90), so a
blob brighter than the tightest single constraint must be cancelled by the rest
of the sky at all 6677 points at once. The witness finds 0.0066 Jy, below that
floor and dropping as constraints are added — the behaviour of a quantity near
its true value, not of a stalled solver. So **the ceiling is the loose side, by
up to 73x**, and it is the dual optimiser that is loose, not the mathematics —
LP duality leaves no gap to hide in.

**The named fix, with its mechanism.** A good certificate needs h_y to be a
NONNEGATIVE kernel that peaks on the disk, and the measured frequencies are
exactly the right alphabet for one: u_ab = p_a - p_b is a difference of station
positions, so for stations observing simultaneously,
    h(x) = |SUM_a c_a exp(-2 pi i p_a . x)|^2  =  SUM_a |c_a|^2  +  (measured exponentials)
is expressible with our y and is nonnegative by construction. The data have 101
timestamps with 7 simultaneous stations (21 simultaneous baselines). A single
snapshot with c_a = 1 gives lambda = 1/n = 1/7, hence lambda*F = 0.29 Jy — most
of the current ceiling already — so the win is not more subgradient steps but
combining snapshots and solving for the c_a, i.e. a real conic solver on the
finite SOCP. **That is Stage 0.5, and it is what stands between this and a
theorem.**

**And the complex visibilities are a dead end without self-calibration**, which
is worth having measured: best nonnegative fit inside the field reaches only
chi2/dof = 4.8, worst residual 33 released sigmas, and needs 0.127 Jy of
absolute slack on top of 3 sigma before the set is nonempty at all.

## WHAT THE RENDER DOES AND DOES NOT SHOW (be honest about this)

The ensemble members are the bench's own crude RML fits — a hand-written
gradient descent with a sparsity and a smoothness term — not eht-imaging output.
They reach amp chi2 ~ 6 and closure chi2 ~ 2 at 0.46-0.59 Jy of compact flux,
which is where the literature puts the compact flux; they are also smoother and
more extended than the published reconstructions, and the render shows a bright
asymmetric structure inside the published ring circle rather than a clean photon
ring. **Do not claim this page reproduces the EHT image.** What it demonstrates
is the enclosure idea on real data, and the two measured facts underneath it:
the amplitudes prefer a ring over a disk by an order of magnitude, and the
closure phases and nothing else pick which side is bright.

## WHAT IS NOT DONE

- Stage 1: no interval arithmetic anywhere yet. The Lipschitz margin is a float
  safeguard, not a proof; it is 2-7% of each ceiling, so the certified numbers
  will not move much when `lib/eqcert` replaces it — but they are not certified
  now and are not written down as if they were.
- Stage 0.5 (above): the conic solve that would make the ceiling worth quoting.
- The tool: nothing is on the site. The page is the next session's work, and it
  now has a clear shape — station toggles, an error-budget slider, the
  concentration profile as the live object, and the imaging game scored by
  chi-squared against the complex data.

## THE TOOL (session 12)

`site/interferometer/index.html`, built by `tools/build-interferometer.js` from
`tools/interferometer-app.js` + `tools/interferometer.css` + `out/page-data.json`.
A full-viewport instrument, 100vw x 100vh, no scrolling: the render fills the
screen, the controls float over it, and the argument lives in a sheet behind a
button. The page shell is still `site/design/template.js` — one navbar, two
buttons — and this page hides the footer because it does not scroll.

**It renders an ENSEMBLE, not an image.** `make-page-data.js` fits 18 skies to
the released data under deliberately different priors (three sparsity weights,
two smoothness weights, three closure-phase weights, six seeds, some with a
telescope dropped) and ships them quantised to 8 bits with their metadata. The
page draws their weighted mean as brightness and their disagreement as texture.
Four render modes — contour, field, stipple, scan — and the controls FILTER and
ADJUST: phase weight, restoring beam, gamma, black point, contour levels,
texture density, disagreement gain, zoom, closure-fit cut, flux cut, telescope
toggles, registration, overlays. Dev hook: `#mode=field&phase=0&beam=6`.

**The one control that matters** is the phase-information slider. At zero the
render is drawn only from skies fitted to the amplitudes, which cannot see
position at all; sliding it in brings the closure phases, and position returns.

**Two families, two meanings, and they must not be mixed.** The ENSEMBLE fits
the amplitudes TWO-SIDED (chi2 on |V|), because consistency means reproducing
the measured amplitudes, and that term is not convex. The CEILING witnesses
satisfy the ONE-SIDED bound |V| <= A_k, which is convex and is what the
certificate is about. Same data, different objects.

**Measured, and it is the page's argument.** Template skies scored against
these 838 rows and 544 triangles: a 43.3 uas ring beats a uniform disk or a
Gaussian on the AMPLITUDES by an order of magnitude (amp chi2 23.6 against
148-236), and the CLOSURE PHASES then pick the bright side — the same ring with
its asymmetry at one position angle scores 2.27, and at the opposite one 39.9.
Fitted members reach amp chi2 6.1 with closure chi2 1.6, at 0.46-0.53 Jy of
compact flux, which is where the literature puts it.

## STAGE 0.5 — THE CERTIFICATE, SOLVED PROPERLY (session 13)

`cert-cp.js`.  The looseness was never the mathematics; LP duality leaves no gap
to hide in, so a ceiling 73x above its own witness was a statement about the
solver and nothing else.  Three attempts, in order, and the two failures are as
useful as the success:

**Sum-of-squares kernels (`cert-sos.js`) — sound, and worse.**  A baseline is a
difference of station positions, u_ab = p_a - p_b, so for the stations observing
simultaneously in one snapshot h(x) = c(x)* Q c(x) is expressible in exactly our
multipliers (y_k = 2 Q_ab, lambda = tr Q) and is NONNEGATIVE EVERYWHERE for free
when Q >= 0.  The whole "h >= 0 off the target" half of the semi-infinite
constraint disappears with nothing left to check.  It should have won.  It did
not: the complete station cliques in these snapshots are only 3 to 5 wide, the
bound scales like F/n, and requiring h >= 0 over the whole PLANE when it is
needed only on Omega is a real loss.  Measured: 1.17 Jy at r = 12 where the free
search already gave 0.47.  Kept on disk, because on an array with full cliques
the argument reverses.

**Chambolle-Pock — the answer.**  The program is
min SUM A_k|y_k| + lambda F  s.t.  h_y(x) + lambda >= f(x) on Omega, and both
nonsmooth pieces have exact proximal operators: a block soft-threshold on each
complex y_k, and a clamp for the constraint's conjugate.  A primal-dual method
uses them directly instead of smoothing them, which is what Adam and Polyak were
both doing badly.

**The witness comes free.**  The multiplier on each pointwise constraint IS a
mass at that point, so the dual variable Chambolle-Pock already carries is a
nonnegative measure on the working set — the primal witness, converging
alongside the ceiling, at no cost.  It replaced a separate FISTA search that was
the worse half of the old bracket by a factor of thirty.

**A second-order scan margin.**  The continuum between samples was covered by a
global Lipschitz constant 2 pi SUM |y_k||u_k|, which assumes every mode conspires
everywhere and was costing 9% of the ceiling.  The gradient of h can be evaluated
EXACTLY at each sample for two more accumulations, so the margin becomes
|grad h(x_c)| d + (1/2) L2 d^2 with L2 = (2 pi)^2 SUM |y_k||u_k|^2 — local, and
about 4% of the ceiling.

**MEASURED, 838 rows, 80 uas field, F <= 2 Jy, flat 5% gain allowance:**

| r (uas) | witness | ceiling | gap | (was, session 12) |
|---|---|---|---|---|
|  6 | 0.1772 | 0.1898 | **1.07x** | 0.1403 / 0.3297 = 2.35x |
| 12 | 0.2639 | 0.2780 | **1.05x** | 0.1935 / 0.4701 = 2.43x |
| 20 | 0.4393 | 0.4610 | **1.05x** | 0.2872 / 0.7458 = 2.60x |
| 28 | 0.5478 | 0.5945 | **1.09x** | 0.4407 / 0.9541 = 2.16x |

A five-to-nine per cent bracket, prior-free and phase-free.  `out/cp-sweep.json`.
The flux hypothesis is nearly inactive: F = 1, 2 and 10 give 0.275, 0.283 and
0.331 at r = 12, so a tenfold weaker assumption costs 17%.

**SIX REDS FIRE** (`node cert-cp.js reds`): three synthetic skies are inside
their own ceilings at two radii each; the witness is re-checked from scratch as a
real measure; monotone in radius; monotone in the error budget; dropping the
Greenland Telescope loosens it 0.30 -> 0.43; and translation.

**THE TRANSLATION RED WAS WRONG TWICE, BOTH TIMES MINE.**  First form, "the
ceiling must not depend on where the disk is": measured 24% and read as a
failure.  But the bound is stated over a FINITE field, and translating a measure
pushes part of its support out of that field — the constraint set is
translation-invariant on the plane, the field restriction is not.  Second form,
"an off-centre witness must fit under the centred ceiling": this assumed
sup(off-centre) <= sup(centred) because the centre is "most interior", which is
not a theorem — what the optimiser needs is room to place CANCELLING mass, and a
disk near one edge has less room on one side and more on the other.  No ordering
is provable.  The correct test translates the disk AND the field together, and
gives **0.0% spread — 0.2995 three times over**.  Held fixed instead, the same
disk gives 0.3711, and that 24% is the field-of-view edge, not a broken
invariance.  The page said the stronger thing and has been corrected.

## TWO CORRECTIONS THAT MATTER MORE THAN THE IMPROVEMENT

**1. The ceiling was NOT SOUND against the calibration it claimed to survive.**
A_k was written |V_k| + n sigma + gain |V_k|.  But a residual station gain in
VLBI TAKES amplitude away — decoherence and pointing lose it, they do not add
it — so |V_true| = |V_meas| / (|g_a||g_b|), and an ADDITIVE allowance of 5%
covers a loss of only 4.8% per baseline.  The EHT's own per-station amplitude
uncertainties run from 3.5% to 26%.  The correct form DIVIDES:
A_k = (|V_k| + n sigma) / ((1-d_a)(1-d_b)), station by station.  It inflates the
ceilings by 9-50% (mean 19%) and it is the difference between a bound and a
plausible-looking number.  `perstation=1` is now the default.

**2. "These data resist a nonnegative fit" was mostly OUR OWN ERROR BUDGET.**
The log and the page both led with chi2 = 4.8-6.5 as though the data were the
problem.  The released sigmas are thermal only; carrying the per-station
amplitude uncertainties instead takes the SAME fitted sky from chi2 6.13 to
**1.32**, verified independently here.  The empty-set result for the COMPLEX
visibilities stands — that one is about the phases — but the amplitude claim does
not, and both files have been corrected.

## THE ENSEMBLE ALREADY CONTAINS RINGS; THE AVERAGE WAS HIDING THEM

Measured over all 18 members (radial profile about each flux centroid,
f_c = central brightness / peak brightness): members 13, 10 and 7 have f_c =
0.018, 0.135 and 0.294 — real rings with empty centres — and every one of them
carries the STRONGEST sparsity weight, l1 = 3.5.  Members at l1 = 1.2 give f_c
0.44 to 1.00, and the three l1 = 0.4 members that drop LMT carry 7.0 Jy, fourteen
times the compact flux.  Their ring diameters are 20-25 uas against a published
43.3, so they are rings at the wrong scale, which is what an under-regularised
fit does.  The page's flux filter already excludes the 7 Jy members; weighting the
rest by data consistency is free and has not been done yet.

## PAID-FOR GOTCHAS (newest first)

- **Thinning the constraint set is sound for the CEILING and silently wrong for
  the WITNESS.** Fewer constraints means a larger feasible set: the bound from a
  subset still bounds the whole problem, but a measure satisfying only the
  subset is not a witness for anything. Measured on the same radius: 0.394 Jy at
  sub=12 against 0.161 at sub=2 against 0.086 with every row. A "lower bound"
  that RISES when you look at less data is not a lower bound.

- **An additive error allowance cannot cover a multiplicative LOSS.** If the
  measurement is |V_meas| = |g| |V_true| with |g| < 1, then the truth is the
  measurement DIVIDED by the gain, and a ceiling written as measured x (1 + d)
  covers only d/(1+d) of loss. At 5% that is 4.8%, against per-station
  uncertainties up to 26%. Write the allowance as a division or the bound is not
  a bound.
- **A stated sigma that carries no systematic is a claim about the instrument,
  not about the data.** Reading chi2 = 6 off thermal-only sigmas and concluding
  "these data resist a nonnegative fit" was wrong by a factor of five; the same
  sky scores 1.32 once per-station amplitude uncertainties are carried.
- **State an invariance with its hypothesis or the red team will fail you for
  the right reason.** Amplitude constraints are translation-invariant on the
  plane; a stated field of view is not. Translate the region and the field
  together and the ceiling is identical to five decimals; translate only the
  region and it moves a quarter.
- **Adam divides out the very weights that make it an optimisation.** The dual
  objective is SUM A_k |y_k| + lambda F; Adam's per-coordinate RMS
  normalisation removes exactly the A_k weighting that makes one multiplier
  cheaper than another, and the objective climbed to 5.4 where y = 0 already
  gives 2.0. Polyak subgradient, with the primal witness as the target value,
  converges instead. **A first-order method that ignores the metric of the
  problem is not a solver, it is a random walk with momentum.**
- **Plain projected gradient stalls on a dirty beam, and a stall is
  indistinguishable from an empty feasible set.** chi2/dof 50 where FISTA
  reaches 4.8 on identical data. This nearly ended the experiment: the stall was
  read as "no image fits the data", which was the wrong conclusion from the
  right observation.
- **Coherent averaging decoheres.** chi2/dof at the best fit: 10 s -> 5.2,
  30 s -> 10.9, 60 s -> 19.6, 300 s -> 45. Atmospheric coherence at 230 GHz is
  seconds. Never average these data past the released cadence, and be suspicious
  of any pipeline that offers to.
- **A semi-infinite constraint checked on the grid it was optimised against is
  not checked at all.** Measured: -2.47 Jy for a quantity that cannot be
  negative, at N = 64. The optimiser puts its violations between the samples,
  every time, because that is free. Cutting planes plus an independent fine scan
  plus a Lipschitz margin.
- **The short-baseline / field-of-view trap.** The shortest PROJECTED baselines
  reach 0.12 Mlambda — a 1.7 arcsecond fringe spacing — so their 1.10 Jy is the
  flux of the galaxy's inner arcsecond, not of anything inside a 128 uas box. By
  1 Glambda the amplitude has fallen to 0.30 Jy, which a 40 uas source cannot
  do. Feeding the short baselines to a model confined to Omega asks it to put an
  arcsecond of flux inside 128 uas; the set goes empty and the dual runs to
  minus infinity. **An infeasible primal looks exactly like a broken optimiser
  from the dual side.** Keep baselines above a stated cut, and carry the
  compact-flux ceiling as a stated hypothesis.
