# /playground

Instruments made touchable. **Nothing here is certified, and that is the entire
permission.**

The rest of this repository proves things and gates itself accordingly: a page
in `reports/` cannot ship if a number on it has drifted from the record
underneath, if a certificate on disk has no row describing it, or if a claim has
gone stale against its source. Those gates are correct, and they are correct
*because those pages make claims*.

This folder makes none. So it has none of them.

```
node playground/build.js        # or: make playground
```

That script writes `site/playground/` and calls nothing else in this
repository. `tools/build-site.js` neither writes nor prunes under
`site/playground/` — the same arrangement `site/apps/` has, for the opposite
reason — and lists the pages in the sitemap, because a page nobody can find is
not free, it is hidden.

## The one rule

**No gates, but no fiction.** Every number on every page here comes out of a
record in this folder, and every record comes out of running the code beside it
on this machine. Freedom from ceremony is not freedom from arithmetic. Where a
thing is a float and not a proof, the page says so in the same breath as the
number — the interferometer's own limits section leads with it.

## What is here

### `interferometer/` — the black hole as a set, not a photograph

Ported from the frontier bench, 2026-09-04. The Event Horizon Telescope's public
M87 release, and the question *what do these data actually determine?*

- `vis.js` — the data layer; conventions fixed in one place
- `lab-vis.js` — Stage 0: the certificate-shaped dual, the witness, the reds
- `cert-cp.js` — **Stage 0.5, and the mathematics worth the port.** The program
  is `min Σ A_k|y_k| + λF` subject to a pointwise inequality over a continuum.
  Both nonsmooth pieces have exact proximal operators — a block soft-threshold on
  each complex `y_k`, a clamp for the constraint's conjugate — so a primal–dual
  method uses them directly instead of smoothing them. The multiplier on each
  pointwise constraint *is* a mass at that point, so the dual variable
  Chambolle–Pock already carries is the primal witness, converging alongside the
  ceiling at no cost. That took a 73× gap down to under a factor of two — and
  the sound bracket is **1.67–1.82×**, not the 1.05–1.09× an earlier run showed,
  because the error model had to be corrected first: an additive 5% allowance
  cannot cover a multiplicative LOSS, and a residual station gain in VLBI takes
  amplitude away rather than adding it. `perstation=1` divides instead, station
  by station, and every ceiling moved up. A tighter bracket against an error
  model that cannot cover the error is not a better result.
- `cert-sos.js` — the sum-of-squares kernel that should have won and did not.
  Kept, because on an array with full station cliques the argument reverses.
- `make-page-data.js` — the 18-member ensemble the page draws
- `app.js`, `page.css`, `build.js` — the instrument itself
- `data/` — the released CSVs, byte for byte, under the EHT's own terms; see
  `data/LICENSE-DATA.md`. **The code here is MIT and the data is not.**
- `out/` — the records every number on the page is read from
- `INTERFEROMETER.md` — the full log, including the corrections. Read the
  gotchas at the bottom; they cost real time.

**Verified running here, 2026-09-04.** `cert-cp.js reds` — the six adversarial
checks — all fired from this copy against the released CSVs: three synthetic
skies inside their own ceilings at two radii each, the witness re-checked from
scratch as a real measure (worst |V|/A exactly 1.000000), monotone in radius,
monotone in the error budget, dropping the Greenland Telescope loosens the bound
0.3637 → 0.3979, and translating the disk *and the field together* moves the
ceiling by 0.0% across three positions. 27 minutes on one laptop; the log is
`out/reds-2026-09-04.txt`.

The translation red is the one worth reading twice. It was wrong twice on the
bench, both times by stating the invariance without its hypothesis: amplitude
constraints are translation-invariant *on the plane*, and a stated field of view
is not. Hold the field fixed and the same disk gives 0.4354 — a 20% move that is
the field-of-view edge, not a broken invariance.

Re-run the mathematics:

```
node playground/interferometer/cert-cp.js sweep sub=8 iters=12000 N=52 Nf=768
node playground/interferometer/cert-cp.js reds
node playground/interferometer/make-page-data.js
node playground/build.js
```

### `simplex/` — an attention row is a point

Built 2026-09-04 on the frozen fixture from `sin-mfg/research/ml/attention-geometry`,
carried with its sha256 and **re-derived rather than quoted**.

Attention weights are nonnegative and sum to one, so a row is a point in Δⁿ⁻¹.
Everyone draws it as bars, which throws the geometry away. Three views of the
same point:

- **the fan** — the whole simplex affinely, 31 vertices on a regular 31-gon, the
  row as Σ pᵢvᵢ. A linear map, so uniform lands dead centre and a focused row
  lands on the position it attends to. No contours here, because a projection
  this lossy would make any contour a lie.
- **the face** — the row restricted to its three most-attended positions and
  renormalised: a genuine 2-face, where PR = 1/Σpᵢ² really is that, so its level
  sets are circles and can be drawn. They break into arcs where the circle
  leaves the triangle, which is why the corners look the way they do.
- **the ladder** — PR against β, the row against two planted mutants.

`decide.js` runs 9 checks and writes `out/decision.json`; the page reads it and
refuses to build if the record is red. The rational-kernel monotonicity is
decided on BigInt fractions in `rational.js` — not pedantry, since consecutive
PRs on this row differ in the fourteenth decimal and a float comparison of them
decides nothing. Softmax is transcendental and is drawn in float, calibrated
against the source pack's own stored rows to 1.4e-14 and labelled as a view.

**The honest proportion, and the page leads with it:** the decided grid reaches
β = 8, where the row still has 29.8 of 31 effective positions. The dashed trail
runs to β = 400 and PR 1.08 — essentially a vertex. Almost the whole journey you
can see is the part that is only drawn.

### `neural-geometry/` — the shapes a model will admit to from the outside

Goodfire finds geometry by **opening** the model — decompose the activations and
days of the week come out as a circle, colours as a surface. That needs the
weights. This asks from outside instead: every pair of items, one integer 0–100,
**one row at a time**, so the two halves of each pair come from calls that never
see each other and their agreement is a consistency test nobody requested.

**15 sets × 3 models, 436 calls, $0.65.** Seven wheels, four lines, a taxonomy,
a kinship grid, and two controls that are there to fail.

- `sets.js` — every set is a prediction, with `shape` and `order` declared
- `probe.js` — the elicitation, budget-capped; `--repair` re-asks only the rows
  that came back unparseable, because one fumbled row should not cost 435 calls
  and a dropped cell reads like a finding
- `decide.js` — asymmetry, closure ratio, the **triangle inequality**, Gromov's
  **δ** and the Gram **signature**, all exact on integers; then float coordinates
  for drawing, labelled as a view
- `plate.js` — one plate per set per model (every pair a chord; the item order a
  path where there is one, the minimum spanning tree where there is not), plus
  `mapPlate`, which puts all 44 cells in the plane of the two numbers

**The frame experiment.** Ten numerals, four frames, and nothing changes but one
sentence in front of the question — which names what they are *for* and never
what shape they make. Fit is Procrustes against the layout the frame implies,
against a 1,000-shuffle permutation null:

| frame | predicted | fit | null p95 | |
|---|---|---:|---:|---|
| bare digits | a line | 0.856 | 0.648 | holds |
| floors of a building | a line | 0.898 | 0.648 | holds — the frame that should do nothing does nothing |
| residues modulo 10 | a circle | **0.949** | 0.636 | holds — the line closes |
| keys on a telephone keypad | a 3×3 grid | **0.549** | 0.619 | **fails, below the null** |

So the frame is a real parameter and a bounded one: it bends a structure the
model already carries (an order into a cycle) and cannot conjure one it lacks.
The models have the keypad as a thing; they do not have it as a place.

**The pull.** Directional asymmetry, which the first pass symmetrised away and
called noise. `pull[i] = Σ(d(i,j) − d(j,i))` is high for an item everything else
is measured against — Tversky's direction, pointing at the prototype. All three
models independently make **Earth** the reference among the planets. On the seven
wheels it points at nothing (ρ ≈ 0.08), which is exactly right: a circle has no
privileged point.

**What it found**

- **Structure is curvature.** All 6 control cells have a positive semidefinite
  Gram — zero negative directions, for unrelated nouns and nonsense strings
  alike, in all three models. 38 of the 39 structured cells are not PSD.
- **The frame moves the geometry.** The same twelve numerals: as *digits* they
  lie on a line (closure 5.48× mean); named as *hours on a clock face* they close
  into a ring (0.97× mean, one model at exactly 1.00). Nothing changed but what
  they are for.
- **Octave equivalence is not in there.** B is a semitone below C, and the models
  do not close the chromatic scale (3.27× mean) — the worst-fitting set on the
  page in two dimensions. They hold the note names in alphabetical order, not the
  pitch class.
- **δ is not a tree detector, and the page says so.** It was brought in to tell a
  taxonomy from a wheel and it half works — cycles 0.343, taxonomy 0.182 — but
  the controls are *lower still* at 0.062, because unstructured answers are
  near-equilateral and near-equilateral is near-tree by this measure. δ measures
  how CLOSED a structure is, and only means anything once curvature has said
  there is one. **The prediction was sharper than the result and the result is
  what is drawn.**
- **Are they even distances?** Planets and scales of size never once violate the
  triangle inequality. The wheels do, and the smallest model does it most.

### `uv-art.js`, `index.css`, `build.js` — the gathering page

The card art is the real u–v coverage of 21 April 2018, read from the released
CSV at build time: every telescope pair's arc and its conjugate. Everything
between the arcs was never observed, which is the whole reason there is a set of
pictures rather than a picture.

### `shot.js` — look at it

```
node playground/shot.js site/playground/index.html /tmp/pg.png 1440 2400
```

Raw-socket CDP, because Node's `WebSocket` sends an `Origin` header the endpoint
refuses. Real waits rather than a virtual-time budget, which races the fonts and
then lies about it. Device-metrics emulation rather than `--window-size`, because
headless clamps windows to 500px and a narrow screenshot taken that way is
fiction.
