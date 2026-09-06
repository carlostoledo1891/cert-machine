# THE TRANSIT, WITHOUT A LAW FOR THE STAR — session 15 (2026-09-05)

`fetch.js` → `centre.js` → `bins.js` → `fit.js` → `enclose.js` → `out/*.json`
→ `tools/build-transit.js` → `site/transit/`

Third instance of the interferometer's instrument. There the slider asked how
much INFORMATION you use; on curveset how much you ASSUME; here the two are the
same question, because the thing assumed — a limb-darkening law — is the only
reason the published number is as narrow as it is.

## THE OBJECT, AND WHY IT IS OURS

A star of unit radius with surface brightness `I(r) >= 0`. Write

    dmu(r) = 2 pi r I(r) dr,     mu >= 0,     INT_0^1 dmu = 1

so `mu` is a NONNEGATIVE MEASURE on [0,1] and the normalisation is exactly the
statement that the light curve is 1 out of transit. A planet of radius
`k = Rp/R*` whose centre is at sky-plane distance `z` covers a fraction

    w(r; z, k) = acos(clamp((z^2 + r^2 - k^2)/(2 z r), -1, 1)) / pi

of the circle of radius r, so the missing flux is `INT w dmu` and **every datum
is a two-sided LINEAR constraint on a nonnegative measure**. The interferometer's
object, in one dimension, with circle geometry instead of a Fourier transform.

**The clamp is the whole case analysis.** `g <= -1` exactly when `z + r <= k`
(the circle is entirely behind the planet, w = 1) and `g >= 1` exactly when
`r + k <= z` or `r >= z + k` (they do not meet, w = 0). The three regimes are
the same conditions, so the clamped form IS the function and the interval
enclosure needs no branching. The same is true of the generalised lens area used
by the monotone rung: disjoint drives both cosines to 1 and the radical to 0,
containment drives one cosine to -1 and the radical to 0.

## FEASIBILITY IS A HULL QUESTION

Because `mu` is a probability measure, `INT W dmu` ranges over exactly
`conv{ W(r) : r in [0,1] }` — the convex hull of the kernel's moment curve. So k
is consistent with the light curve iff that curve meets the box `[l, u]`, and
Frank-Wolfe delivers both verdicts from one run: its linear oracle is a 1-D scan
of the kernel, its iterate is the convex combination (the atomic WITNESS), and
`p - q` at convergence is the separating direction (the FARKAS CERTIFICATE),

    min_r [ SUM a_j Wlo_j(r) - SUM b_j Whi_j(r) ]  >  SUM a_j u_j - SUM b_j l_j

which refutes k for every mu at once. Nothing in the optimiser is trusted: the
witness is re-checked as a measure against every bin, and the certificate's
minimum over the continuum is closed by interval subdivision.

## THE LADDER IS A CHANGE OF KERNEL, NOT OF MACHINERY

    'none'      I >= 0 and nothing else.               kernel w(r; z, k)
    'monotone'  I additionally non-increasing outward. Every such I is a mixture
                of uniform discs, I(r) = INT 1{r <= s} dnu(s); with
                dnu'(s) = s^2 dnu(s) the problem has the SAME shape in nu' and
                the kernel becomes the intersection AREA, lensArea(s,z,k)/pi s^2.

One rung is one kernel. That is the dial, and it is priced in the units of the
answer.

## THE RESULT

**The interval is one-sided, and the reason is exact.** The planet's centre never
comes closer to the star's centre than the impact parameter b, so a circle of
radius `r < b - k` and the planet disc never meet. Flux placed there is invisible
at EVERY epoch and only the normalisation notices it. A larger planet blocking a
smaller share of a dimmer annulus therefore reproduces the same depth — but it
cannot reproduce the same DURATION, because a larger planet reaches the limb
earlier and the visible annulus cannot be silent then.

So light can hide and cannot un-hide: **the photometry bounds the planet tightly
from below and loosely from above, and the entire upper bound is bought by an
assumption about the star's atmosphere.**

Numbers, the ladder and the comparison against every published value: `out/page.json`
and the page. All of them contain every published value for their planet.

## WHAT THE HARNESS SAID BEFORE ANY OF THIS MEANT ANYTHING

Three checks, in this order, because a uniform near-zero measures the harness:

1. **Are the mission's errors honest?** Out-of-transit scatter against the
   propagated PDCSAP errors: ratio 1.02. They are.
2. **Is the fold centred?** The archive ephemeris left Kepler-7 b asymmetric by
   135 ppm against a 56 ppm floor — its mid-transit is 248 s out. A mis-centred
   fold is a systematic that looks EXACTLY like a limb-darkening residual.
   `centre.js` fixes it on the transit's own mirror symmetry and nothing else:
   no law, no radius, no impact parameter, only `SUM [F(+t) - F(-t)]^2`.
3. **Does the pipeline reproduce the field?** A conventional quadratic-law fit of
   this extracted curve lands on k = 0.1253 for TrES-2 b, inside the published
   cluster 0.1239–0.1278, at chi2/dof ~ 0.9. It does.

**And the error budget is MEASURED, not chosen:** it is the smallest per-bin
allowance that does not refuse that conventional fit. A budget that refutes the
field's own answer is a broken budget, not a strong result.

## GOTCHAS PAID FOR (newest first)

- **An interval enclosure can be loose in a variable you are not subdividing.**
  `certifiedMin` refines the r-cell; the kernel's closed form mentions z five
  times, so over a geometry box only 0.0115 wide the terms stopped cancelling and
  the monotone kernel came back as [0.16, 1.00] where the true value was 0.997.
  A planet the size of its own star passed as admissible for an afternoon.
  The fix is adaptive subdivision in z as well, and only where the enclosure is
  actually wide.
- **A clamp is monotone, so it goes on each endpoint separately.**
  `[max(lo,-1), min(hi,1)]` INVERTS the interval whenever it lies wholly outside
  [-1,1], and `acos` then threw. `[clamp(lo), clamp(hi)]` is the correct form and
  it is also the one that makes every regime a single expression.
- **A cell anchored at r = 0 cannot be refined away.** The monotone kernel is a
  0/0 there; returning the sound hull [0,1] poisoned every certificate, because
  subdividing never removes the endpoint. It is decided by geometry instead: a
  disc of radius `s <= z - k` never reaches the planet.
- **Frank-Wolfe's 1/t is not good enough for a feasibility question.** At the true
  k of a synthetic curve plain FW stalled at ||p-q|| ~ 1e-3, thirty times the
  error bars, so a FEASIBLE k looked separated. The fix is not more iterations
  but a fully corrective step: re-optimise the weights over the whole active atom
  set after every addition.
- **A witness that lands ON the boundary fails its own re-check.** The search is
  repeated against a shrunk set, and the shrink ladder has to end FINE as well as
  start coarse — a near-atomic witness (a star with a bright ring) only landed
  inside once a 2% shrink was tried, because a large shrink moves the target off
  the hull entirely.
- **The single-block path existed only in the tests, and it was broken.** With a
  point kernel `buildGrid` emits m-long vectors while Frank-Wolfe read 2m, giving
  NaN. Real bins always carry a time span, so `single` is never true on real data
  and only `enclose.test.js` ever exercised it. That is the argument for the
  test, not against it.
- **HMI's disk-integrated keyword carries the Venus transit under a 2900 ppm
  drift.** `DATAMEAN` from `hmi.Ic_45s` does show the 2012 transit, but the known
  orbital-velocity/thermal artefact over the 9-hour window is three times the
  1000 ppm signal. Named fix: form the blocked-to-total ratio WITHIN each image,
  where a global gain cancels exactly — the interferometer's invariance trick.
  That needs an image pipeline and is not in this session.
- **A test's own closed form is as likely to be wrong as the code's.**
  `acos(1 - 2s^2) = 2 asin(s)`; asserting `asin(s)/pi` failed the kernel by
  exactly a factor of two and the kernel was right.

## WHAT IS NOT DONE

- **The fair budget.** A per-bin box at n sigma permits chi2/dof up to n^2, which
  is far looser than any published fit, so the comparison to a published error
  bar is unflattering by construction. The right budget is the SAME shape the
  published bars come from — an ell-2 ball, `SUM ((v-d)/sigma)^2 <= chi2 m` —
  which is convex and needs no new machinery, but needs a POINT kernel, and a
  bin's own time span makes every kernel interval-valued. Two ways out: project
  onto the interval-ball set (convex, no closed form), or carry the bin-smearing
  as a rigorous per-bin allowance. `makeProblem` refuses `shape: 'ball'` rather
  than falling back silently. **This is Stage 2 and it is the next thing.**
- **The metered truth.** SDO/HMI watched Venus cross the Sun in 2012: a real
  transit of a real star where the radius ratio is known from the ephemeris to
  0.1% and the intensity profile is measured by the same instrument. No other
  target in astronomy offers that. Blocked on the image pipeline above.
- Eccentricity is not carried. A fourth nuisance for no gain on a 2.5-day orbit.
- The star is taken circularly symmetric. Spots and gravity darkening would need
  a measure on the disc rather than on [0,1]; the machinery does not change, the
  kernel does.

## FILES

    fits.js            just enough FITS to read a Kepler light curve
    fetch.js           download, quality-mask, per-transit baseline, emit CSV
    transit.js         the kernel and the geometry, with interval forms
    centre.js          centre the fold on mirror symmetry alone
    bins.js            adaptive edges: fine where the curve is steep
    fit.js             the conventional analysis, for the two harness questions
    enclose.js         the hull question, the certificate, the witness, the ladder
    make-page-data.js  the pipeline -> out/page.json
    witness-curves.js  the extreme witnesses as drawable curves -> out/witness.json
    transit.test.js    36 cases      enclose.test.js  22 cases      reds.js  7 reds
    data/              the extracted curves and the archive's published table
