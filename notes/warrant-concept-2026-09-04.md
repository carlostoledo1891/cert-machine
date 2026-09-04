# WARRANT — a visual grammar for what a mark is standing on

*Concept and implementation plan, 2026-09-04. Scouted before written; the seven
`vis-*` rows in `corpus/targets.json` are the literature this rests on and the
three places where the first version of this idea was already occupied.*

---

## The trunk sentence

> **Charts and graders both assert things, and neither distinguishes what the
> data forces from what the renderer or the tolerance chose.**

One position, two demonstrations. Verification is the trunk. The grammar is a
branch that reaches people who will never open a certificate. Two competing
positions would dilute both; one position with two demonstrations makes the
design work evidence rather than a side project.

## What the scouting killed, and what survived

The pitch as first written — *nobody encodes epistemic status in line style* —
is false, and a reviewer would end it in one sentence. Three mature literatures
sit on top of it:

- **Uncertainty visualization.** Padilla, Kay & Hullman's 2022 survey; hypothetical
  outcome plots (Hullman, Resnick & Adar 2015; Kale et al. 2018); Hullman 2019
  measured *why* authors omit uncertainty at all.
- **Provenance visualization.** Ragan, Endert et al. (VAST 2015 / TVCG 2016) already
  taxonomise data, visualization, interaction, insight and rationale provenance.
- **Imputed-value encoding.** Song & Szafir, *Where's My Data?* (VIS 2018), and the
  2022 Northwestern study of uncertainty visualisations for imputations, which
  sorts encodings into highlight, downplay, annotation and removal.

And two more that bound the technical ideas:

- **Verifiable visualization** is a named subfield — Kirby & Silva 2008, Etiene
  et al. 2009, and Melquiond's Coq-verified 1D function plotting (F-IDE 2021).
  They verify the **algorithm**. Nobody asks what the individual stroke is standing on.
- **The lineup protocol** — Buja et al. 2009, Wickham et al. 2010, the `nullabor`
  package — is exactly what `/playground/shape-hunt` reinvented. **Cite it.**

**What survives all of that, and is the whole claim:**

> **Verification standing is not probabilistic uncertainty.**
> A value can be known to fourteen decimals and still be undecided. A value can be
> certified and have a wide bracket. The two axes are orthogonal, and no published
> grammar separates them.

## The grammar

Four **standings**, ordered by what backs the mark. The order is a lattice:

    REFUSED  <  CHOSEN  <  COMPUTED  <  DECIDED

| standing | what backs it | stroke | redundant channel |
|---|---|---|---|
| **DECIDED** | an exact decision — interval enclosure, exact rational comparison, proof | solid | enclosure band at the certified width |
| **COMPUTED** | arithmetic that was not verified — float, a solver at a tolerance, a fit | dashed | — |
| **CHOSEN** | one member of a set the data admits; a prior, regulariser, tie-break, default or seed picked it | dotted | the family drawn behind it where affordable |
| **REFUSED** | the instrument ran and declined — undecided at budget, out of domain, missing | **no mark**, and an explicit void | hatched cell / annotated gap, never interpolated across |

Standing is never colour alone (the Garmin rule already in CLAUDE.md): stroke
pattern plus a redundant annunciator, legible in greyscale.

### The decision rule — where the intellectual content is

**A mark's standing is the weakest standing of any input on its path to the pixel.**
Combination is the lattice **minimum**. Three consequences do all the work:

1. **The arithmetic demotes, never the author.** An operation keeps DECIDED only if
   the operation itself is certified. A float step takes DECIDED → COMPUTED
   automatically. Nobody gets to assert a standing.
2. **REFUSED is absorbing.** Anything downstream of a refused input is refused. It
   is not zero, not a gap to bridge, and not an average.
3. **Selection demotes to CHOSEN.** `argmin`/`argmax` over a set whose optimum is
   **not unique** yields CHOSEN, not DECIDED — and so does every tie-break, default
   parameter and random seed.

Rule 3 is the one nobody has written down, and it is the one that redraws the
most famous scientific image of the last decade. Every regularised inverse
problem is an argmax with a non-unique optimum.

### Two architecture decisions that matter more than the code

- **Standing is a property of the value, not the mark.** If the encoding is chosen at
  draw time, everyone will misapply it. If a value carries what it is standing on,
  the chart cannot lie by accident — the same architecture as the certificate trust
  base, so the grammar composes with `certkit` rather than sitting beside it.
- **Renderer-agnostic.** A grammar tied to one plotting library is a plugin; a spec
  with adapters is a standard. Ship **one** adapter (SVG — it is what every playground
  piece actually uses) and do not build three.

### What the grammar does not cover

The limits section is what makes the rest trustworthy, same as the limits page.

- It says nothing about whether the claim is **true**. A DECIDED mark can be decided
  from the wrong data.
- It is **not** a confidence encoding and must not be read as one. Width is encoded
  separately, by extent, so the two axes never collapse.
- **No empirical evaluation.** No user study shows readers decode solid/dashed/dotted
  as intended. That is the honest venue gap and it is stated up front.
- **No continuous mixtures.** A value is not 60% decided. Take the weakest.
- It does not adjudicate **aesthetics**: dash lengths, hatching and annunciator forms
  are ours, and any consistent set satisfying the redundancy rule conforms.

## The case where the grammar changed a reading

A spec with no finding attached is a proposal. Two candidates, both in hand:

1. **The interferometer (headline).** The published M87 image is an argmax under a
   prior whose optimum is not unique — **CHOSEN** by rule 3, and dotted. Our
   prior-free bracket is the DECIDED part. This is defensible because the EHT's own
   Feng et al. 2024 prior-sweep (arXiv:2406.02785) *measures* which features move with
   the prior: diameter, orientation and asymmetry hold, ring width and central
   brightness do not. Their paper is independent published evidence that the third
   state is load-bearing. What is ours is the **enclosure** over the whole admissible
   set rather than a posterior sample under one prior.
2. **Our own page, the same day (second, and the more credible of the two).**
   `/playground/shape-hunt` published *40 of 54 symmetries survive* against one null.
   Adding a second, differently-biased null cut it to **24 of 54**. Under the grammar,
   "40 of 54" was a **CHOSEN** number — chosen by one null out of several admissible
   ones — presented as DECIDED. A grammar that catches its author before it catches a
   stranger is worth more than one that only catches strangers.

## Sequencing

Two more instruments → the spec → the finding → the essay. Do not chase a venue.

---

# TODO

### Phase 0 · corrections and hygiene — cheap, do first
- [ ] **The review's "40 of 54" is stale.** As of 2026-09-04 the page says **24 of 54**
      under two nulls, with 0 of 6 controls. Every essay, deck and note uses 24.
- [ ] **Cite the lineup protocol on `/playground/shape-hunt`** — Buja et al. 2009,
      Wickham et al. 2010, `nullabor`. State what is ours: a machine observer instead
      of a human panel, an exact test statistic, and nulls matched to the search size.
- [x] Seven `vis-*` rows written to `corpus/targets.json`.

### Phase 1 · structure — cheap, high leverage
- [ ] **Promote the interferometer** to its own URL with its own launch. It is not the
      first of four cards; it is the widest-audience artifact on the site.
- [ ] **Shape-hunt first**, or as the playground's front matter. It debunks the other
      pieces before anyone else can, and that is what earns trust for them.
- [ ] **A front-page card for the playground.** Today it is a nav item plus one sentence
      below sixty certificate rows.

### Phase 2 · two more instruments (four is a set; six with a method is a body of work)
- [ ] **Phantom bifurcations.** One equation, two arithmetics, side by side: a fork the
      float panel shows and the exact panel does not. `instruments/census` already holds
      the pitchfork logic; `certs/entropy-henon.json` and `families/henon-census.js` are
      the data. The grammar does the caption's work. This is the one to show a lab.
- [ ] **The everyday inverse problem.** The interferometer template on a fitted line: the
      certified family of parameter vectors the data admits, with the least-squares answer
      dotted on top of it. Every field publishes a fitted line and nobody shows the family.
      More reach than the black hole, and it is the canonical CHOSEN demo.

### Phase 3 · the spec and the reference implementation — repo first, public last
- [ ] `warrant/SPEC.md`, **under 300 lines**: the four standings, the lattice, the three
      rules, six worked examples from our own instruments, and the limits section.
- [ ] `warrant/warrant.js` — value + standing, the meet, an encoder returning a style token.
      Core is renderer-agnostic; **one** SVG adapter.
- [ ] **Retrofit all six instruments** to the same grammar. Six applying it consistently is
      the bar, not four.
- [ ] **Dual licence.** MIT for the implementation and adapters, **CC0** for the spec text —
      CC0 because the goal is adoption and it removes any question about copying the
      definitions into someone else's docs. README says explicitly: the licence covers the
      grammar and the code, **not** any claim that a chart using it is correct.
- [ ] Keep borrowed example data out of the permissive umbrella (the EHT files are already
      handled correctly; apply the same care to anything new).

### Phase 4 · the finding, then the essay
- [ ] **Write the interferometer re-reading** as the documented case where the grammar
      changed a reading, citing Feng et al. 2024 and EHT Paper IV, and stating the
      difference in one sentence: a sampled ensemble under a prior versus a bracket over
      the whole admissible set.
- [ ] **Write our own 40 → 24 as the second case.**
- [ ] **The essay**, with the instruments as live evidence and the spec as a stable URL.
- [ ] **Only then** consider a venue — a design study over our own corpus, or alt-track.
      Never before the finding exists in writing.

### Standing constraint, unchanged
The binding constraint on every path, mathematical or visual, is still outward-facing:
the arXiv note, the merged PR, one person who has run the code. None of the above
substitutes for those.
