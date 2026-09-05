# cert-unit — the sandbox

Read first: `~/Downloads/unit.zip` (certkit — the exact rational, the three-port
instrument, the refutation taxonomy, the graph viewer) and
`~/Documents/Aether Project/unit-custom` (a local fork of samuelmtimbo/unit).

## WHAT UNIT ACTUALLY IS, AND WHERE IT PAYS

Unit's units are Multi-Input Multi-Output finite state machines; a program is a
graph; a graph serialises to a `BundleSpec`; primitives are written as
`Functional<I,O>` with `{i:[...], o:[...]}` port lists and an `f(inputs, done,
fail)`. `dist/index.js` in the local fork is **3.2 MB** — that is the whole
system, editor included.

That number is the architecture decision. There are two very different things
inside Unit and only one of them is worth a beta dependency:

- **The runtime** — pushes values along wires and fires nodes. certkit already
  does this in one file with zero dependencies, and so do we. Taking 3.2 MB to
  get an animation is a bad trade.
- **The editor** — direct manipulation, rewiring, live graphs on a canvas. This
  is not something we have, it is genuinely hard, and it is the entire reason to
  care. **A reader who cannot rewire does not need Unit.**

So: **Unit is the editor and the interchange format. Our engine stays the
compute. The graph is the contract between them.**

Concretely, three layers, and each is useful without the one above it:

    layer 3   UNIT EDITOR          rewire, drag, live-play; the beta dependency,
                                    degrades to a static SVG if the bundle fails
    layer 2   GRAPH + BUNDLE       our own MIMO runtime, ~300 lines, zero deps;
                                    exports Unit's BundleSpec so a graph opens
                                    in unit.land without Unit being load-bearing
    layer 1   TYPED PORTS          the contribution; see below

## THE CONTRIBUTION IS AT LAYER 1, AND IT IS NOT THE RATIONAL

certkit's guard rail is that a Number never becomes an exact value by accident:
`Q(0.1)` raises, `valueOf()` throws. That is right, and it is table stakes —
it protects **numeric** exactness.

Our bench does not mostly fail on numeric exactness. It fails on **hypothesis
slippage**: the claim and the check drift apart while each stays internally
consistent. Today's session produced three in one day, all in code that was
individually correct:

- a witness validated against 838 constraint rows while its ceiling was computed
  against 6677 — both sound, the bracket meaningless, reported as 1.05x when it
  was 1.7x;
- an amplitude ceiling written `|V| + 3σ + 5%·|V|`, additive, while the error it
  had to cover was **multiplicative loss** — the bound was not a bound;
- a chi-squared read off thermal-only sigmas and reported as a fact about the
  data, when carrying the instrument's own systematics moved it from 6.13 to
  1.32.

None of those is a rounding error. Every one is two things wired together that
were about different problems. **So the port type must be the constraint set,
not the number type.**

    Value = { datum, kind, provenance }
      kind        Rational | Interval | Float          (certkit's axis)
      provenance  a hash of the HYPOTHESIS LIST that
                  makes this value mean what it says   (ours)

Connecting two ports whose provenance disagrees is refused at wire time, the way
`Q(0.1)` is refused at ingest. The witness/ceiling bug becomes a wire the editor
will not let you draw.

## FIVE NODE SHAPES OUR WORK NEEDS THAT CERTKIT DOES NOT HAVE

**1. THE BRACKET.** Every result this bench owns is two-sided, produced by two
independent routes that must meet: ERDŐS 1.828 ≤ inf ≤ 1.83443; the
interferometer 0.139 ≤ sup ≤ 0.243; EMBER's six stages that must all fire.
certkit's instrument has one verdict; ours has a *primal path that constructs*
and a *dual path that bounds*, joined at a comparator that emits the gap. The
gap is the live number — it is what says which side is loose, and it is what
turned 73x into 1.7x this session. Draw it and the looseness is visible.

**2. THE HYPOTHESIS RAIL.** Every number we publish is conditional: field of
view, flux ceiling, gain allowance, sigma multiple, baseline cut. In the graph
those are a bus every node reads from, and the verdict node prints the
conjunction rather than the headline. Move the rail and the whole graph
re-derives. That is not a nicety — the interferometer paper *needs* the ceiling
as a function of the field of view (0.21 to 0.75 Jy across half-FOV 20 to 80 µas)
and as a function of the flux budget, and a rail turns two required figures into
one control.

**3. THE FLOAT FIREBREAK.** The bench already separates `lab-*.js` (floats,
searches, no proof) from `cert-*.js` (intervals, decides). Make that a port type:
a Float output has no wire to a verdict input. "A fast screen may only prune"
stops being a convention in a filename and becomes a connection the editor
refuses. This is certkit's rule generalised from values to roles.

**4. THE PERTURBATION NODE — reds as graph rewrites.** certkit's battery mutates
*witnesses*. Ours mutate *graphs*: drop a telescope, widen a budget, translate a
region, thin a constraint set. Each is a rewrite plus an assertion on the
DIRECTION the verdict is allowed to move. Delete a station and the ceiling may
only loosen. That is a monotonicity a graph can check automatically on every
edit, and it is exactly the battery that caught the two soundness bugs above.

**5. THE CONCORD NODE.** Two independent implementations of the same decision,
one verdict port each, and a node that emits agreement or disagreement. certkit
ships Python and JS on purpose. We have `cert-force.js` and an independently
written `verify-force.js`; eqcert in JS and cert-machine's own. Cross-
implementation agreement is cheap evidence and nobody in this space publishes it.

## A SIXTH REFUTATION CLASS

certkit's taxonomy: precision-collapse, tolerance-masking, phantom-structure,
scope-drift, shape-error, unclassified. Our failures need one more, and it is the
one a graph is uniquely good at catching:

**hypothesis-slippage** — the claim and the check are each internally consistent
and are about different problems. Distinguishable from scope-drift (where the
witness is valid for a different *specification*) because here the witness and
the bound are valid for different *constraint sets of the same specification*,
which no amount of re-deriving either side alone will reveal. Its evidence is a
wiring mismatch, not a number.

## WHAT ACTUALLY COMPUTES IN A BROWSER

The honest limit: 1.4 billion boxes do not run in a visual graph, so most nodes
wrap calls. But not all of them, and the ones that do are the demo:

    live now        interval arithmetic and rational ops (eqcert)      microseconds
                    TERRA's spectral congestion solve, N=24            milliseconds
                    scan2's per-cell second-order margin               milliseconds
                    the interferometer's amplitude-fit check           milliseconds
    seconds         Chambolle-Pock on a small subproblem
    node only       the certified ladders, the band, the sweeps

## WHAT TO BUILD, IN ORDER

1. `port.mjs` — the typed value with provenance, and the refusal to connect.
   Small, and it is the contribution.
2. `graph.mjs` — a ~300-line MIMO runtime, zero dependencies, three verdict
   ports on every instrument, refusal drawn even when it does not fire.
3. `nodes.mjs` — our instruments wrapped: eqcert intervals, the TERRA solve, the
   bracket, the float screen, the naive grader for the canary.
4. `bundle.mjs` — export to Unit's `BundleSpec` so any graph opens in unit.land.
   Interop, not dependency.
5. The page, built by a builder like every other page here. Unit's editor loads
   only if the reader asks to rewire, and the page degrades to a static SVG.

## THE HONEST CAUTIONS, KEPT

- Unit is beta with one maintainer. Fine for a sandbox and a figure, wrong for
  anything load-bearing, and a hazard inside an archival artifact. Degrade
  gracefully or the paper dies with the library.
- The format can eat the substance. Budget the mathematics first.
- "Interactive HTML paper" is not a contribution. **"A paper whose central
  results the reader re-derives on their own machine, including the ones the
  authors got wrong"** is — and this bench can now ship that honestly, because
  it has a real bug from a real session to replay.

## The editor — decided, and built (option A)

Surveyed the alternatives with real numbers: Drawflow 64 KB and zero deps but
still v0.0.60; Rete 2 at 221 KB plus render/area/connection plugins; LiteGraph's
maintained fork **archived**; React Flow needs React, which nothing in this repo
uses; Cytoscape is 5.5 MB and is not a port editor at all. None is bad. All are
solving a different problem from ours.

Three reasons ours wins here specifically, and only the third is about size:

1. **Most of what we need is read-only.** Contact sheets, refutation subgraphs,
   inline figures — the reader looks and never drags. A library is pure cost on
   the majority of uses.
2. **The refusal message is the product.** Libraries offer an
   `isValidConnection` boolean. None carries a hypothesis-stamp diff that can
   say *these two values are about different problems* and name the fields.
3. **A styling API invites the wrong thing.** `toSVG` takes no style argument on
   purpose, so an author cannot draw a float as if it were decided.

### What exists

    render.mjs      115 lines. Static SVG, house grammar, layered layout.
    editor.mjs      the same picture with the wires in the reader's hands.
    editor.test.mjs 16 assertions.

**The editor implements no validity rule at all.** It calls `graph.wire()` in a
try and shows whatever came back, so the page can never disagree with the engine
about what is legal — there is one implementation and the UI is downstream of
it. Verified end to end through real pointer events (`#sim=from.port>to.port`
drives an actual drag): a legal drag adds a wire, and dragging a float output
into a deciding input leaves the graph untouched and prints

    THE FLOAT FIREBREAK: screen.shortlist carries floats and gh.norm decides.
    A fast screen may prune. It may never reach a verdict.

`inkOf` is the keystone in one line: solid when the source emits a DECIDING
kind, dashed when it emits FLOAT. The same field that refuses the wire at build
time chooses its ink at draw time, including on the ghost wire under the cursor,
so the picture and the guarantee cannot drift apart.

`toBundleSpec` stays, so any graph still opens in Unit at unit.land. Unit remains
the editor we did not have to write and the interchange format — an affordance,
not an embed. A reader who cannot rewire does not need Unit; a reader who can,
now rewires here.

## The contact sheet — the read-only payoff

`make-contact.mjs` → `out/contact.svg`, inlined by `tools/build-lattice-env.js`.
135 rollouts in one image, nine rows of fifteen.

A full node graph is unreadable at thumbnail size, so a rollout reduces to the
only topology that matters: the verdicts an instrument can fire, with the one
the model chose **filled** and the one that was true **ringed**.

    fill inside a ring   right
    fill, no ring        a wrong answer, and you can see which row it went to
    ring, nothing in it  the answer it missed
    dashed underline     the reference slipped

Two legibility findings, both only visible once it was drawn:

- **A white ring on a white fill is invisible** exactly where it matters, on the
  cells that got it right. The truth ring had to move OUTSIDE the square.
- **A vertical reference mark between columns reads as a separator** and starts
  organising the picture into a grid it is not. It became an underline.

The ink is still not chosen: the underline is solid or dashed off `wf`, the same
way `inkOf` reads `emits`. Nothing in `contactSheet` takes a style argument.

What the image says without a number: the `underspecified` band shows an empty
ring in `NEEDS_DATA` with a fill in `ADMISSIBLE` above it, repeatedly, for all
three models — that is answering confidently when a quantity is absent. And the
`printed` band separates the models on sight, Opus's fills sitting inside their
rings while the other two scatter into rows the truth was not in.

## The rewirable page — `site/rewire/`

`tools/build-rewire.js` inlines port/graph/render/editor verbatim as one module
script, so the rules the page enforces are the rules `node test.mjs` runs. Twenty
four minted lattice claims, three graders, one verdict socket.

    exact predicate      admits 12 of 24    integers and a certified pi bracket
    tolerance grader     admits 17 of 24    Number(q) is Infinity past dim 102
    careful float        admits 12 of 24    agrees with exact on every one

Wiring the tolerance grader to `report` inflates the count by five in front of
the reader. Wiring it to `verdict` is refused, by the engine, in the engine's
words. **Both on the same canvas** — the inflation and the thing that prevents
it — which is more than the original brief asked for.

The same bug in two languages, and it is on the page: JavaScript's `Number(q)` is
`Infinity` so the grader admits everything; Python's `float(q)` *raises*, so the
identical grader admits 5 instead and refuses everything above the cliff. Both
wrong, opposite directions, and only the crash gets noticed.

### Three bugs the sim hook caught, all of which would have hit a real reader

1. **`onChange` fired on pointerdown, and the app re-mounted the SVG** — which
   replaces the element the pointer is captured on, so every drag died on its
   first move. Status messages and graph changes now take separate paths, and
   `fired` may be a function so a repaint reflects new state without a remount.
2. **`location.hash` keeps URL encoding**, so `>` arrives as `%3E` and the sim
   parsed one field instead of two.
3. **`interferometer.css` sets `#stage{width:100%}`**, and a percentage width
   beats a `right:` inset — the canvas ran under the control panel and the last
   node in the graph was invisible. `width:auto` is load-bearing.

Node geometry shrank throughout: NW 176→112, ROW 19→13, HEAD 30→21, with type
scaled to match, plus a `minSpan` floor on the viewBox so a five-node graph is
not magnified to fill a 1400px page.

## Refutation as a subgraph — `make-refutations.mjs`

`environments/lattice-claims/eval/refutations.py` rebuilds four real failures
from the seed the eval ran, `refutation.mjs` turns each into the smallest graph
that refutes it, and the lattice-claims page renders them.

"Verdict ADMISSIBLE, decided REFUSED" is a fact without a reason. The subgraph
carries the reason, in the same grammar as everything else: what was DERIVED
arrives on a solid wire and what was merely ASSERTED arrives dashed, because the
node holding the model's answer emits FLOAT. No ink is chosen here either.

    a verdict the arithmetic refutes             solid in, dashed claim, they disagree
    a claim the quantities do not determine      N-1/2 and N+1/2 fire different ports
    a verdict with nothing wired to a port       the MISSING WIRE is the finding
    the right answer from the wrong quantity     two numbers into one socket

The third only works because every port is drawn whether or not anything reaches
it — abstention as visible topology, doing something a sentence cannot. The
fourth is our own error given a picture.

Two clipping bugs, both from drawing text inside a viewBox sized for the boxes:
the contact sheet's caption ran past its right edge, and a set of subgraphs of
different sizes rendered at different scales in equal-width cells. `note.length`
now widens the viewBox, and `toSVG` takes a `minWidth` floor.

## Reproduce, end to end

    python3 environments/lattice-claims/eval/run_models.py --n 15 --live
    python3 environments/lattice-claims/eval/page_data.py
    python3 environments/lattice-claims/eval/refutations.py
    python3 environments/lattice-claims/eval/rewire_data.py
    node experiments/cert-unit/make-contact.mjs
    node experiments/cert-unit/make-refutations.mjs
    node tools/build-lattice-env.js && node tools/build-rewire.js
