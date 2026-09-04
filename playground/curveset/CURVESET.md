# The line they published, and the lines that fit

`make-page-data.js` → `tools/build-curveset.js` → `site/curveset/`

Second instance of the interferometer's instrument, on something everyday. There
the slider asks **how much information do you use**; here it asks **how much do
you assume**, which is the same question from the other side.

## The subject

A calibration is run forwards (known standards in, response out) and used
backwards (response in, unknown out). Everyone reports the backwards number by
fitting a curve and inverting it. The fit is an assumption, and it is never
priced. This computes what the standards allow instead, under assumptions stated
one at a time.

## The math, and why there is no optimiser

Admissible f: passes within the stated error of every standard, slope in [m, M].
The envelope is **closed form** — no LP, no sampling:

```
U(x) = min_i [ hi_i + (x >= x_i ?  M(x-x_i) : -m(x_i-x)) ]
L(x) = max_i [ lo_i + (x >= x_i ?  m(x-x_i) : -M(x_i-x)) ]
```

Both are nondecreasing, so the backwards read is a bisection, exact to machine
precision. `envelope.js` is inlined **verbatim** into the page behind a
require/exports shim, so the browser runs the file the tests run.

**A global slope band is the wrong assertion for a curve that bends.** On the
assay the secants between adjacent standards already span 16×, so "slope between
the smallest and largest secant" constrains nothing and tightening it changes
nothing (7.8× → 6.9× across four orders of magnitude of tolerance). The claim
people actually make is **local**: between two adjacent standards the response
does not wander far from the line joining them. At t = 0 that is linear
interpolation, which is what many laboratories do by hand. That bound is an
*outer* one (each endpoint taken with its own error bar independently), so it is
conservative — wider than truth, never narrower, which is the direction this kind
of argument has to err in.

## Results

**Load cell — NIST StRD Pontius.** 20 loads applied twice, so repeatability is
*measured* (pooled s = 2.147e-4, against NIST's certified residual SD 2.052e-4 —
the quadratic's residuals are entirely repeatability, so the model is not
detectably wrong). Reading a deflection of 1.15:

| assuming | interval | vs reported ±568 lb |
|---|---|---|
| monotone only | 1,500,000 – 1,650,000 | **132×** |
| wander ≤ ±25% | 1,564,221 – 1,595,171 | 27× |
| join the dots | 1,580,276 – 1,581,463 | **1.0×** |

**The monotone-only width is 150,000 lb — exactly the ladder spacing.** Without a
functional form you can say which two calibration points you are between, and
nothing finer. And joining the dots *matches NIST exactly*: on a fine ladder with
small noise the functional form buys nothing, and the reported precision is
earned by the experiment rather than by the model.

**Rat IL-6 assay.** 8 standards on a doubling ladder, no replicates, so the error
budget is an assertion and stays a page control. Reading OD 0.90:

| assuming | interval | vs reported ±0.80 pg/mL |
|---|---|---|
| monotone only | 12.50 – 25.00 pg/mL | 7.8× |
| join the dots | 14.70 – 20.50 pg/mL | **3.6×** |

**The opposite conclusion.** Even linear interpolation — the tightest claim
available without a functional form — is 3.6× wider than the 4PL reports. That
precision is unreachable by any assumption weaker than the four-parameter form
itself. On a coarse ladder the model is doing the work.

Two calibrations, two different reasons the reported number is narrower than the
data allow. That pair is the point: the method does not say everyone is
overconfident, it says *you can tell which case you are in, and by how much*.

## Gotchas paid for

- `readBack` must report **unbounded**, not "refused", when a reading sits past
  the top standard: with bare monotonicity any amount above the ladder is
  consistent. That is what "over range" means, and it is a fact about the ladder
  rather than a failure of the arithmetic. My first test asserted the wrong thing.
- The answer comes back in the coordinate the envelope was computed in. Passing
  it through the forward transform again squares the log on the assay.
- Under bare monotonicity U = +infinity past the last standard, so the envelope
  fill must be clipped to the plot rect or it paints the whole corner.
- 24 cases in `envelope.test.js`, including "t = 0 is linear interpolation,
  exactly" and "a looser claim never narrows the interval". Written after
  `align()` shipped wrong on the neural-geometry pages and returned plausible
  numbers for two days.

## Next in the series

Deconvolution — smooth kernel, nonnegativity active, operator known, all three
axes green. Tomography stays out: `scan2`'s margin needs a smooth kernel and a
line-integral ray indicator is discontinuous, which blows up both the gradient
and the curvature term.
