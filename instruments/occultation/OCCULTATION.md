# THE OCCULTATION, WITHOUT THE ELLIPSE — session 15 (2026-09-05)

`data/*.csv` → `chords.js` → `make-page-data.js` → `out/page.json`
→ `tools/build-occultation.js` → `site/occultation/`

Front 5 of the astronomy dig, and the companion to `experiments/transit/`. Both
turn out to say the same thing in different domains, which was not planned:
**the data bound one side and the model buys the other.**

## THE FACT THAT MAKES IT ONE-DIMENSIONAL

Occultation chords are PARALLEL — the shadow sweeps one way and every station
cuts the silhouette along that direction. Put the chord direction along x and
let y be the cross-track coordinate. A convex silhouette has slices
[L(y), R(y)] with R concave and L convex, so

    w(y) = R(y) - L(y)   is CONCAVE on the support and zero outside it,

every measured chord is a value of w, every station that saw nothing is a y
where w vanishes, and the area is INT w. That is the whole problem. It is the
curveset envelope again with `concave` where that one had `monotone with a slope
band`, and like that one it is CLOSED FORM — no optimiser, nothing converges.

**The only assumption is convexity.** It is weaker than the ellipse every
occultation paper fits, and it is what a single ingress and a single egress per
station already asserts.

## THE TWO BOUNDS, AND WHY THEY ARE ASYMMETRIC

    FLOOR    the concave hull of (y_i, len_i - err_i), between the OUTERMOST
             CHORDS ONLY. The negatives play no part. Nothing forces the body to
             extend past its outermost chord: it may end flush with it, a flat
             edge, which is a perfectly good convex body.

    CEILING  concavity read backwards. For y beyond two samples y_i < y_j,
                 w(y) <= w(y_j) + [w(y_j) - w(y_i)](y - y_j)/(y_j - y_i)
             and the coefficient of w(y_i) is NEGATIVE, so the bound is taken
             with hi_j at the near sample and lo_i at the far one. Minimum over
             every ordered pair, clipped at zero and at the nearest station that
             saw nothing.

So the floor is bought by the chords and **the ceiling is bought by the
telescopes that recorded nothing at all** — the part of a campaign least often
published.

## THE DATA, AND WHY THIS EVENT

(95626) 2002 GZ32, 2017 May 20 (Santos-Sanz et al. 2021, arXiv:2012.06621).
Its Table A1 publishes, per site, the **projected distance on the sky plane to
the reconstructed centerline in km** and the detection status. That column IS
the cross-track coordinate, already reduced by the authors, so the sky-plane
geometry needs no ephemeris, no station projection and no Earth rotation on this
bench. Table 5 gives the chord sizes in km. 5 positive chords, 23 negative
stations, one chord the authors set aside.

Every other candidate published timings only, from which chords cannot be
recovered without redoing the whole reduction — Leona (19 chords, the Betelgeuse
asteroid) and 2003 VS2 among them. That is the reason this event and not a
better-covered one.

**A chord LENGTH is invariant under the timing shifts the paper debates.** A
shift slides a chord along its own line and does not change how long it is, so
nothing here depends on whether one prefers their "original" or "shifted" fit.

## THE RESULT

At the published 1-sigma chord errors, convexity alone forces the
area-equivalent diameter into **[168.3, 267.5] km**. The published ellipse is
206 +- 15 km (chi2 = 29.5) or 211 +- 12 km after shifting three chords
(chi2 = 4.0). Both are inside. So is the radiometric 237 +- 8 km from Herschel,
Spitzer and ALMA — **which the paper reports as NOT in agreement with its own
mean 3-D estimate.** That tension is between two models, not two measurements.

**AT FACE VALUE THE CHORDS ADMIT NO CONVEX SILHOUETTE.** With zero error the
concave hull of the measured lengths runs 5.5 km above Javalambre's own chord.
About half of one stated error bar is enough to admit one. The published
analysis meets the same fact from the other side and calls it chi2 = 29.5.

**What the misses are worth:** move the 23 negative stations out of reach and
the ceiling goes from 267.5 km to 577.0 km. The stations that saw nothing are
worth 309 km of upper bound, more than the object's own diameter.

## GOTCHAS PAID FOR

- **A negative station is a ZERO of w, not a sample of it.** w is concave ON ITS
  SUPPORT and zero outside; a function that is zero on two rays and concave
  between them is not concave anywhere. Feeding the nearest negatives into the
  pair list as ordinary samples of value 0 was tried here and is UNSOUND: on a
  triangular silhouette it produced a ceiling of 7529 against a true area of
  9000, because the far cap dragged the envelope down through the real body. The
  negatives clip the DOMAIN of integration and nothing else, and that is already
  the whole of what they buy. Caught by the containment red, not by inspection.
- **The ceiling is DISCONTINUOUS at every chord.** The constraints anchored at a
  sample are valid only up to it, so the bound jumps the moment y passes. A
  polyline integration across those jumps understated the ceiling by 16% and
  made it FALL when chords were removed. Between breakpoints the envelope is
  affine, so the midpoint rule is exact and blind to the jumps.
- **A STEP in w is not a convex body**, it is an L-shape. Writing one as a test
  shape ("trapezoid, flat-topped") made the containment red fail for the right
  reason: w must be concave on the support, and a step is not.
- **"Join the dots" is not a lower bound here.** It draws the tails down to the
  negative stations, which already assumes the body reaches them. The floor is
  the convex hull of the chords, tails excluded — 66 against 79 on the test
  hexagon.
- The floor of a circle sampled at 7 heights is 90% of pi R^2, not 97%. Refining
  drives it to within the polar caps beyond the outermost chord, which no chord
  observes and no bound may assume.

## WHAT IS NOT DONE

- **A second event.** The pair is what makes a curveset-shaped result, and there
  is only one here. Any event whose paper publishes a distance-to-centerline
  column would drop straight in; converting a timings-only campaign needs the
  station projection and Earth rotation, which is a real piece of geometry with
  a real chance of a silent error, and it has a built-in check (the computed
  chord lengths must reproduce the published ones).
- **The central-symmetry rung.** For a centrally symmetric body w is symmetric
  about the centre, which is a genuine extra constraint and a genuine test —
  these bodies are not symmetric and it might be refuted, which would be the
  interesting outcome.
- Chord POSITION along its own line is not used at all. It is not published for
  this event, and the area bound does not need it — but it would tighten the
  ceiling, because it constrains L and R separately rather than only w.

## FILES

    data/gz32-2017-05-20.csv    the chords and every station, transcribed
    data/gz32-published.json    the paper's own ellipse fits and radiometry
    chords.js                   the envelope, exact in rationals
    chords.test.js              20 cases      reds.js  6 reds
    make-page-data.js           the pipeline -> out/page.json
