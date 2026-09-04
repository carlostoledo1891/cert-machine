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
  ceiling at no cost. That is what took a 73× gap down to 5–9%.
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
