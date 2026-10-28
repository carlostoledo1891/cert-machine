# WARRANT v2 — how a mark is drawn on the public pages (frozen 2026-10-28)

v2 is frozen. The operator ruled on 2026-10-28 that it is mature enough to apply across the site. To change it, add a
dated section at the end of this file and re-check the pages the change touches; never edit it silently. The
machinery is `playground/warrant.js`: the four standings, the meet, the legend, the witness glyph and the CSS behind
them. The five permitted dashes are in `design/grammar.js`. This file holds the house rules for using them on a page.
They were learned on the 23 instruments, and every one was found on a page of ours that broke it. The brainstorm
behind v2 is `notes/visual-grammar-2026-10-27.md`; read it for the why, never as the rules.

**Never in the papers.** The manuscripts in `paper/` follow their journals' conventions: the journal's own class, figures
drawn the conventional way, and the publisher's required statements. WARRANT v2 is not used there (operator,
2026-10-27). It goes into a paper only when the operator rules it paper-ready.

## The marks

| standing | what it rests on | a line in a figure | a value in text |
|---|---|---|---|
| DECIDED | an exact decision: an enclosure, an exact rational comparison, a proof | solid | plain (`w-decided`) |
| COMPUTED | float, a solver stopped at a tolerance, a fit, a number a claimant printed | dashed `5 4` (`1.5 2` under 1.5 px) | underlined dashed (`w-computed`) |
| CHOSEN | one member of a set the data admit, picked by something that is not the data: a tie-break, a default, a seed, a prior, a sample | dotted `1 5` (`1 3`), round caps | underlined dotted (`w-chosen`) |
| REFUSED | the instrument declined, or the input is missing | no mark: ∅ and words | `w-refused` (prints ∅) |

`2 3` is a guide (an axis, a ruler, a ghost) and says nothing. No other dash pattern may appear on a built page
(`tools/check-grammar.js`). A mark's standing is the weakest standing on its path (`W.meet`). So a knot computed
exactly is solid, and the line interpolated between two such knots is dotted.

## The rules

1. **Standing is not a verdict.** A refutation proved here is drawn solid. Verdicts are words and chips; standing
   is stroke and underline. The two never share a channel.
2. **A pick must be a member of the set it was picked from**, and the build checks that it is. Three of our picks
   were not:
   - census's least-squares totals left Table I's ±½ box (now a boxed fit with exact KKT checks);
   - occultation's joined dots were not concave;
   - navier-stokes' drawn core was not incompressible (the build now refuses |div u| ≥ 1e-6).
3. **A tie is CHOSEN.** When the optimum is not unique, draw the shown one dotted and say "one of several". On
   neural-geometry, 9 of the 15 spanning trees are tied.
4. **Dash is for standing only.** Identity (which model, which series) is carried by weight and opacity, never by a dash.
5. **The one accent.** The `--witness` red goes only on a × (`W.witness()`) beside words. It marks an EXHIBITED
   counterexample to a claim someone made about that object's own record. It never marks:
   - a verdict word or a region;
   - a scalar comparison (a box clearing a box has no witness point);
   - a refutation reached by deduction;
   - an object taken from another record.

   When in doubt, use ink. Every other colour follows v2.2 (colour, by rule), below.
6. **Mood.** A verdict that holds given a chosen input names that input in italic: *given h = 3/50*. A hypothesis
   that was read but not machine-checked is named the same way.
7. **An empty set is ∅.** It gets ∅ and a word, never a zero-height bar or a zero.
8. **Read our own prose against the record.** Every number typed on a page comes from a record and is gated by its
   builder; a headline with no record behind it ("fourteen million") is the failure this rule exists for. Round a
   printed bound outward, never truncate it.
9. **A legend wherever a w-* mark is.** Use `W.legendHtml`, with `compact: true` beside a figure.
   `tools/check-wiring.js` refuses a page that has the marks without the legend.
10. **Lifted files are never edited.** A lifted page changes only through its shell (anchored, gated replacements)
    or through a patch declared in LIFT.json.

## Decided 2026-10-28 (the operator, on the session's recommendation)

- **D4, nested ink: not in v2.** The five patterns above stay, so no dash changes site-wide.
- **D2: the bottom standing keeps the name REFUSED.**
- **A layout placed by a float solver** (an embedding, an eigenvector map) is a chosen picture. Say so once, in the
  caption. Each mark keeps the standing of what it asserts: an edge that exists is solid.
- **A model's answer is a claim someone made: COMPUTED, dashed.** cert-unit already draws it that way and stays.

## Applying it to a page

1. Read the page's records and every one of its sentences. For each mark and each number, write down what it rests on.
2. Mark the page through `W = require('playground/warrant.js')`, using `W.attrs` for strokes, `W.value` for numbers
   in text, `W.witness` and `W.legendHtml`. Reports and apps use the same calls as the instruments.
3. Fix whatever is false at its source, and gate the fix in the builder, so the build refuses when the record no
   longer supports the sentence.
4. **The loop:**
   - While editing, run `make page R=<builder> MEASURE=0`. Render drives only the pages whose bytes moved since the
     last green run.
   - Before the commit, run `make page R=<builder>`.
   - Run `make control` once per batch; its batteries now run side by side.
5. When a figure honestly got thinner or a spine honestly fell, accept it with `check-render`/`check-measure
   --accept` and say why in the commit.

## v2.1: models as premises (2026-10-28)

The operator directed that physical models be carried inside the grammar, starting with Swell, keeping "the academic
view on how it works". Swell decides every wave limit in exact arithmetic over a measured band. The band reaches the
beach through a linear island model whose own error at the shore has never been measured. Calling the result
DECIDED is true, but read alone it misleads. So v2.1 gives the grammar a second axis.

- **Standing**, carried by the stroke, says how a number was computed.
- **Premises** say what the number rests on and how far each was checked.

**The premise ladder** is the verification-and-validation ladder of the modelling literature (Roache 1998; Oberkampf
& Roy 2010; ASME V&V 20-2009), cut to four rungs:

| grade | what was checked | on Swell |
|---|---|---|
| validated | the premise against observations of the thing itself, held out | the open sea's band: it covered 96.5% of 21,259 satellite passes it had not seen |
| compared | the premise against a model that keeps more of the physics, with the number | the island model against a Boussinesq model at 12 beaches (certs/swell-island-boussinesq.json) |
| verified | the code against an exact solution of its own equations | none yet: the island solver was never lifted here |
| assumed | nothing; adopted from a source or chosen | breaking at 0.55 h (Thornton & Guza 1982), no sandbars, the profile inside 10 m |

A conclusion is as checked as its weakest premise (`W.weakest`). A grade is where the checking stopped: never a
probability, never a confidence. It is carried by a word first and a three-step ladder glyph second (`W.grade`,
`W.premisesHtml`). It never uses colour.

11. **A number that rests on a model names its premises.** List them in the order the number travelled through them,
    each with its grade and the record behind it, and end with a line that names the weakest. Put the chain where
    trust is explained: beside the certificate, and on the method page.
12. **A grade comes from a record, and a comparison is calibrated first.** The builder re-derives the comparison
    and gates it. Before it was trusted, Swell's comparison had to reproduce frontier's published one, and it did
    exactly: N 556, r 0.49, bias +0.25 m.
13. **The halo.** An extent carried to a place by a model that is not validated there keeps its crisp edges, because
    the decision is made on them given the model. It gains a halo outside them: the model's own error there has no
    edge to draw. A validated extent has no halo. Blur is the most readily understood sign of uncertainty
    (MacEachren et al. 2012).
14. **A forecast line is COMPUTED and dashed**, on canvas too: `setLineDash` takes `G.claim(width)`. Swell's
    forecast lines were drawn solid until 2026-10-28.
15. **A field drawn from a model is a picture of the model.** For crests or streamlines, the legend says so once.
16. **Where a comparison says the model reads low at a place,** any "under the limit" there is flagged as calling
    for more caution than the arithmetic shows. On Swell this applies to Pântano do Sul (0.39×), Ingleses (0.43×)
    and Galheta (0.99×), on swells of 11 s and longer.

**The apps' verdict register** (`--v-cert`, `--v-refu`, `--v-refd`, design/app-shell.js) is the status kind of
v2.2: decided states only, always with a shape and a word; forecast states stay in ink. It was ruled with the colour law
on 2026-10-28, below.

## v2.2: colour, by rule (approved 2026-10-28)

The operator's approval ("approved all", 2026-10-28) came after Machinidae's palette was run through the dataviz
validator: OKLab ΔE×100 with the Machado colour-vision model, every pair that shares a figure, on the figure's own
ground. Its two main arm colours read ΔE 0.4 apart to a deuteranope. The law that came out of that:

1. **Ink first.** Every figure reads completely in greyscale; a colour always comes with a shape and a word.
2. **One colour, one meaning, in every project built on WARRANT.** Each colour is registered below with its meaning
   and the date the operator approved it.
3. **Colour never carries standing** (the stroke does), and it never stands in for a verdict word.
4. **Four kinds of colour only:**
   - the witness: one red, for a shown counterexample;
   - identity: at most three hues for series compared in one figure, each with its own shape;
   - order: one hue in lightness steps, for an ordered scale;
   - status: the apps' decided states, always with an icon and a word.
5. **Every set of colours that shares a figure passes the validator on every pair**: CVD ΔE ≥ 8 and normal vision
   ≥ 15, not only neighbours in a list.
6. **No yellow and no orange** (operator, 2026-10-28).
7. **A new colour enters only with the validator's report and the operator's approval**, recorded here.

**Registered colours**

| colour | kind | meaning | where | approved |
|---|---|---|---|---|
| `--witness` #e0574e | witness | a shown counterexample; the only red on the site and in Machinidae (rose retired) | every project | 2026-10-27, as the only red 2026-10-28 |
| #79b9d6 | identity | lineage (the arm, and the accent: not in the founder; filled = new, ringed = changed) | Machinidae | 2026-10-28 |
| #6744c5 | identity | the rules arm (re-stepped from #9070c8; ΔE 28 against the blue for a deuteranope) | Machinidae | 2026-10-28 |
| #9fd0bb · #5f9a83 · #335e4e | order | how far a birth got: lived · died · stillborn | Machinidae | 2026-10-28 |
| `--v-cert` · `--v-refu` · `--v-refd` | status | an app's decided state: allowed · refused by the rule · undetermined | the apps (design/app-shell.js) | 2026-10-28 |

Retired on the same day: Machinidae's ochre and amber (rule 6). Its "changed" becomes the blue ring, "live" becomes ink
weight, and the reference line becomes the guide pattern (2 3) in ink. The aleator arm and "the AI alone" lose their
hue and keep their diamond. Rose is retired; "stillborn" takes the ramp's darkest step.

**Open:** `--v-refu` (#E06B62) and `--witness` (#e0574e) are one red to the eye (ΔE ~4) with two meanings, against
rule 2. Until the operator rules, they never share a figure.

## The site pass (2026-10-28)

- **Tier 1, the pages people land on:** the home page and Method; Janela, Swell, explained, Uirapuru and the eleições
  dossier; and the eight reports most linked from GitHub (optconst-queue, optimization-constants, kissing,
  openai-math, gsm8k-audit, alphaevolve-community, time-horizon, curve-seeds).
- **Tier 2:** every other report, converted when it is next edited for another reason, never in a sweep.
- **Kept out (operator, 2026-10-28):** the submitted Petrobras material (Contraprova, Decidível, Abatimento). It
  stays exactly as submitted.
