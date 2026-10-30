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
2. Mark the page through `W = require('playground/warrant.js')`, using `W.attrs` for strokes, `W.val` for a number
   read from its record (the address and the format go into the span; `tools/check-marks.js` re-reads it from the
   built page — D10, 2026-10-29; `W.value` is the older unpointed form, counted by the census), `W.witness` and
   `W.legendHtml`. Reports and apps use the same calls as the instruments.
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
ground. Its two main arm colours, lineage #3d8ac8 and rules #9070c8, read ΔE 0.4 apart to a deuteranope. The law that came out of that:

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
| `--v-cert` · `--v-refu` · `--v-refd` | status | an app's decided state: allowed · refused by the rule · undetermined; `--v-refu` IS `--witness` since 2026-10-29 | the apps (design/app-shell.js) | 2026-10-28; the red folded 2026-10-29 |
| #3368c1 (print) | identity | the second series compared in a print figure, always with ■ | print only (design/print/tokens.js, kits/warrant-mpl) | 2026-10-29 |

Retired the same day: the Eleições page's party reds and blues. On the operator's ruling ("use between the ones the grammar
have"), its finalists are the categorical greys --c-1 and --c-3, and its maps are one ordered grey scale mixed between
--rule-strong and --ink. Its RLA 2026 points keep the word certified ("use certified"). Also retired: Machinidae's ochre
and amber (rule 6). Its "changed" becomes the blue ring, "live" becomes ink
weight, and the reference line becomes the guide pattern (2 3) in ink. The aleator arm and "the AI alone" lose their
hue and keep their diamond. Rose is retired; "stillborn" takes the ramp's darkest step.

**Resolved 2026-10-29:** `--v-refu` (#E06B62) and `--witness` (#e0574e) were one red to the eye (ΔE ~4) with two
meanings, against rule 2; `--v-refu` is now the witness (see the last section).

## The site pass (2026-10-28)

- **Tier 1, the pages people land on:** the home page and Method; Janela, Swell, explained, Uirapuru and the eleições
  dossier; and the eight reports most linked from GitHub (optconst-queue, optimization-constants, kissing,
  openai-math, gsm8k-audit, alphaevolve-community, time-horizon, curve-seeds).
- **Tier 2:** every other report, converted when it is next edited for another reason, never in a sweep.
- **Kept out (operator, 2026-10-28):** the submitted Petrobras material (Contraprova, Decidível, Abatimento). It
  stays exactly as submitted.

## Rulings, 2026-10-28 (late): the open questions, on "follow the recommended path"

- **A reading gets no rung.** Lanes graded proof steps that were read, not run, as `assumed`, and two reports
  (optconst, optq) carried a private gloss to say so. The ladder stays at four rungs, because a reading is where the
  machine's checking stopped. The `assumed` gloss now names it ("adopted from a source, chosen, or read; no machine
  here checked it"), and the private glosses are gone. Whether a verdict that crosses a read step must be PARTIAL
  everywhere (16a and 70a are CERTIFIED, C₁₆'s upper end is PARTIAL) is open for the operator; it would move a
  posted verdict.
- **The computed gloss covers printed numbers:** "float, or a number someone printed; nothing decided it".
- **Swell keeps the flag, not a refusal,** where the island model reads low (rule 16). A refusal would remove an
  exact statement; the flag says that it calls for more caution than the arithmetic shows.
- **Machinidae (relayed to its session):** a champion tied on the best training score is CHOSEN (rule 3; 209 of 236
  confirmatory champions are tied); inferential role (pilot, confirmatory, synthetic, trial) is carried by words
  only, never stroke or colour (rules 3 and 4 of v2.2); no darker grey for the blind-tree control: it is told apart by
  shape and weight (ink first, rule 1 of v2.2).
- **Deferred, not refused:** a live "now deciding" strip on the landing (a strip on a static build goes stale between
  builds) and a shorter H1 (D1 is not paraphrased).
- **Ruled 2026-10-29** (the operator: "follow the recommendations"):
  - **A read step does not cap a verdict.** CERTIFIED, PARTIAL, REFUTED and REFUSED keep the meaning their certificate
    gives them. Every proof step that was read and not run is listed, graded `assumed`, in the page's "what it rests
    on", and the chain's last line names it. A reader always sees where the machine stopped; the verdict word never
    hides a reading, and a reading never demotes a decision it does not touch.
  - **One red.** The apps' `--v-refu` is the witness red now (design/app-shell.js reads `--witness` from
    design/tokens.js). Its meaning in an app is the witness's: a decided state shown together with the datum that
    breaks the rule, always with its icon and its word. The submitted Petrobras pages (Contraprova, Decidível,
    Abatimento) never used it and are unchanged.

## v2.3: on paper (approved 2026-10-29)

Reports read on white paper and printed in greyscale take the print register (`design/print/tokens.js`); the site
stays dark (battery T3b). The stroke grammar does not change: the five patterns of design/grammar.js, each standing
in the class and the tone role it has on screen. On paper the anchor flips: the strongest mark is the darkest, ink is
#000000, and each weaker standing is a step lighter (computed #262626, chosen #4d4d4d, since D9 of 2026-10-29; before it the two
were the other way round, against the order); the dash carries the standing.

1. **Ink first, again.** Every print figure reads in greyscale as a mono laser prints it: each series has its own
   marker, the witness is a ×, a refusal is a hatch and ∅ in words.
2. **Identity on paper is a colour and a marker**, at one weight and full opacity: ● ink, ■ the print blue
   #3368c1, ▲ #4d4d4d. Never opacity: on paper it is a colour nobody validated.
3. **The witness is the one red, #e0574e**, a mark on white (3.72:1): only ever the × glyph beside words.
4. **The order ramp runs light to dark** with magnitude, neutral, five steps; ink reads on every step. A coloured
   mark over a field is drawn on a paper casing.
5. **A print figure is checked** by design/print/check-svg.js: grammar.js's dashes and the register's colours, no
   translucency, no raster. The kit for matplotlib is kits/warrant-mpl; its register is generated, never typed.

**Registered colours (paper)** · #3368c1 · identity · the second series compared in a print figure, with ■ · print ·
2026-10-29.

The operator approved all four of the proposal's decisions on 2026-10-29 ("all four approved"): the neutral register
as WARRANT on paper; the one red kept on paper (#e0574e, a mark, never text); the print blue #3368c1 for a second
series, print only; the paper casing under a coloured mark on a ramp field. Social cards and videos take this
register too ("Light for X", the same day); the site stays dark.

## Rulings, 2026-10-29

A review of the grammar against this file and five built pages returned candidate rules; ten findings on the built
site were verified before the rulings. The review is internal and is never cited on the site.
The operator ruled on 2026-10-29 ("Ask here, also pointing your recommendation"; every recommendation taken except
tracking):

- **D9, tone is monotone in standing.** The stroke tones are re-stepped so L(decided) ≥ L(computed) ≥ L(chosen) on
  screen and the reverse on paper (today chosen is `--ink-2`, brighter than computed's `--ink-3`; v2.3 inverted the
  same way with chosen #262626, computed #4d4d4d). A battery asserts the order from the tokens. No new colour.
- **D10, a standing is read from a typed value, never typed at a call site.** cert-unit's `{datum, kind, hyp}` is
  promoted into design/ as `{datum, standing, premises, record: {path, sha256, pointer}}`; `W.attrs`/`W.value` take
  it; the pointer goes into the markup (`data-rec`) and a `check-marks` gate re-reads every printed number from its
  record at outward rounding. Tier 1 migrates now; the census of standing literals ratchets down.
- **D11, a premise grade is a pair:** a verification bit and a validation rung (Roache; ASME V&V 20), `W.weakest`
  the componentwise minimum, "unverified" printed where the bit is off; the words and the glyph stay; the ordered
  key is printed wherever a grade appears.
- **D12, one hero figure per page** may take the full track; its witness is drawn as an event at the figure's scale
  before any inline ×; `check-measure` may ratchet up for the declared hero only.
- **D13, the landing's flow animation** (`.ed-f`, a dash offset on `5 90`) is redrawn as translated points; the dash
  channel carries standing only, on borders and in CSS motion too (no `transition`/`@keyframes` on a dash under a
  `w-*` selector; no dashed chip border; verdict word → chip shape is a function).
- **D14, the first handle** (a chosen input in italic that drags, the flip value drawn as a solid tick on its own
  ruler; under a drag only CHOSEN and COMPUTED marks may move) goes on the return-level check, after navier-stokes.
- **D15, the companion page:** the axioms and the candidate rules become a public page beside /grammar/ once the
  fixes below have landed, with the findings as before/after figures. (Folded into /grammar/ the same day: one page.)
- **D16, the review's note stays local.**

**The fixes ruled with them, each a finding with a gate:** 99 dashed non-guide SVG marks on 24 pages carry no `w-*`
class (`design/charts.js` still takes `dashed: true`); pixels round to nearest in `tools/build-grammar.js`
(`toFixed`), against rule 8 in pixels; `.tag.open` wears a dashed border; /eth/'s first screen reads "CERTIFIED"
and never says the verdict is absent; `tools/video-campos.js` slid a DECIDED tick. Also ruled, from the review's
agreed rules: the legend is derived from the figure (never an `exclude:` list) and drawn at the figure's widths; a
mark's reason is visible text at first use, never only a `title`; a figure's caption names its record and sha; a
page's standing is computed by the builder; a frame is a page (standing never tweens; a value appears or its
enclosure narrows, it never travels; a CHOSEN mark may cycle through its set one member per frame). These enter
as rules 17–31 when their gates exist; until then they bind new work.

## D11 applied (2026-10-29)

The grade is a pair. Verification (the code solves its own equations: a bit) and validation (how far the equations
were checked against the world: the rung assumed < compared < validated) are orthogonal in Roache and ASME V&V 20,
and the four-rung chain could not say "validated but never verified", which is Swell's open-sea band. A premise may
declare `verified: true | false`; left out, it draws as before and nothing is said about the bit. Declared, the glyph's
first bar is the bit and the next two the rung, and the word gains *unverified* on a second line where the bit is off
(`W.grade`, `W.pairWord`, `W.weakestPair`; the legacy rung VERIFIED is the pair (on, assumed)). The meet line names
both. Applied first to Swell's chain and the grammar page's specimen (the band and the island model: unverified);
/eth/'s premises are readings and proofs, no code to verify, so they declare no bit. The specimen the operator
approved ("follow the recommended path") is in the 10-29 chat. The stylesheet's site part is now re-baked at sync
(design/sheet.js, markers in every page's <style>), so this and every later grammar stylesheet change is one sync.

## D12 applied (2026-10-29): the hero

One figure per page may be the **hero**: its builder declares it (`C.figure({ hero: true })`), and its box draws past
the container into the room beside it, up to `LAYOUT.hero` (1440 px) wide and never past the gutter
(design/tokens.js, design/template.js). Its caption stays on the spine. On a phone the box runs edge to edge, and the
builder may give it a second drawing at a phone's scale (`svgNarrowRaw`), swapped in under 680 px: a 1000-unit drawing
read at 350 px is type at a third of its size. It is the one exception to "one container, two tracks, no breakouts",
and it is one box wide:

- **The ruler ratchets it up.** tools/check-measure.js does not count the hero's own edges as spines; it records the
  hero's width per viewport and refuses a hero that got narrower. Escapes and sideways scroll still count for it, and
  an ancestor that hides overflow and cuts the bleed counts as clipping (a red control each).
- **A witness is an event before it is a word.** On a page with a hero, the first × a reader meets is the hero's own
  mark (`W.witnessMark`, class `w-wx`), drawn no thinner than the hero's decided line, before any inline glyph.
  tools/check-wiring.js reads the order and the weights from the built page and refuses a second hero.

Applied first to the kissing ladder (the two panels, stacked on a phone) and to /grammar/, where the meet with its
witness became the hero under the title, drawn on x, y in [0, 5/4], the window where the chosen segments and the
float curve can be told apart; the halo key became one strip across the track. The rest of R28 (a refused cell keeps
the area its value would have had, with the hole's kind) is not built.


**Ruled back 2026-10-30 (the operator: "I do not like the hero big images/charts concept. It must have the same default
width of the content below").** The hero no longer draws past the container on any page: `LAYOUT.hero` and the bleed
are gone from design/tokens.js and design/template.js, and check-measure's width ratchet with them. What stays is the
witness rule (one hero per page, its × the first a reader meets, at weight) and the optional phone drawing.
## D14 applied (2026-10-29): the first handle

The return-level check (/instruments/return-level-check/) gains a fourth step, **a design height**: the claim "the
T-year wave is at most *H*", for an H the reader chooses. H is the page's first handle. It is named in italic (rule
6), typed in its field or dragged along its own ruler, and moves in whole centimetres.

- **The flip values are decided marks.** Each certified family's enclosure of the level puts a solid tick on H's
  ruler, at the centimetre where the claim's word changes: HOLDS at or past the enclosure's upper end, DOES NOT HOLD
  below its lower end, UNDECIDED inside it (the atlas's three words). The comparison is exact: c / 100 against the
  double's own dyadic value, in BigInt (`playground/return-level-check/design.js`; the double nearest 0.1 lies above
  0.1, so `Math.ceil(100 * hi)` would call 0.10 m enough, a red control).
- **Under a drag only CHOSEN marks move.** The ticks are drawn once per run, per T, per width; a drag redraws the
  dotted line at H, the handle and the words, and nothing else. `playground/return-level-check/drive.js` types,
  drags and steps H in Chrome on the certified Campos preset and refuses if any decided mark moved by a hundredth of
  a pixel (a red control moves one by hand). It runs in `make test` and the control build.
- **NEEDS DATA is a hollow handle.** Before a run the ruler carries no tick and the handle is hollow and inert.

The headline names the family Anderson–Darling decides and prints both flips ("holds from 5.85 m up and does not hold
at 5.84 m or below"): the incentive form of the app doctrine's "at X you turn green". On a phone the family's name and
its word share a line above each lane, so the ruler takes the full width.

## D15 applied, then folded (2026-10-29): one grammar page

The companion page was built beside /grammar/ and folded into it the same day on the operator's word: the grammar has ONE
page, and the review behind the rulings is internal, never cited on the site (its old URL redirects to /grammar/). What
the companion drew lives on /grammar/ as issues and their fixes:

- **The hero is the law.** Soundness is drawn at the one place the site is known to have broken it (F4). The staircase's top
  on [1, 3/2] was written to nearest, 7/180 of a pixel inside its record, and is now outward. Both rows are read from the
  pages (git at e310e071^, the build today) and compared in exact rationals.
- **The findings are counted, then and now, by one rule.** The site's HTML at e310e071^ is extracted at build time and
  measured by the same marks census that gates today's site (tools/check-grammar.js marksCensus, exported for it).
- **The candidate rules carry a status the build decides** from the code and the census: gated, partly gated, or open.
- **The builder refuses** when a finding it calls fixed stops reading as fixed, or when an open one stops being true.

## D12, batch 1 (2026-10-29): the Tier 1 reports' existing figures

The operator's ruling for the first batch was "existing figures": a hero is declared on a figure a page already draws,
and nothing new is drawn for it. A specimen on branch `heroes-tier1-batch1`, for the operator's look.

- **time-horizon:** §2's trend (certified horizons against release date, the exact least-squares line) is the hero, with
  a phone drawing. Every point, line and standing is the record's; only the frame moved (the rotated axis caption ran
  through "15 min" and now clears it; the phone drawing writes it above the frame). The page shows no ×.
- **gsm8k-audit:** the 1,319 test items as cells are the hero, under the header, because the tl;dr names the witnesses
  with inline ×s. `design/charts.js` strip() takes `marks: [{ index, label }]` and draws `W.witnessMark` on those cells,
  at a stroke no thinner than the kit's 2 px decided line (refused below it), on a casing of the figure's surface; each
  mark's words sit in a band opened under its row. The marks are the ledger's test rows with a witness, which the
  builder requires to be exactly the printed-step faults: items 501 and 1024. The legend's key for them is drawn as the
  figure draws the cell (kind `wx`). The strip's legend no longer overwrites its last rows when it wraps.
- **The rest of Tier 1 is registered** in `design/heroes.json`: page → `hero: true`, or `none` with a reason (the five
  table-only reports and Method), or `pending` with a reason, allowed for an app only (the landing and the five apps,
  batch 2). tools/check-wiring.js reads the Tier 1 line of "The site pass" above, so a page added there and not
  registered refuses, as do a row with no reason, a stale row, and a `pending` report (seven red controls).
- `.page > header + .hero` (the room under the title) moved into design/template.js from the two grammar pages' CSS.

## D12, batch 2 (2026-10-29): the landing and the apps

The same ruling as batch 1, existing figures only, applied to the six pages that waited: the landing and the five apps. A
specimen on branch `heroes-tier1-batch2`, for the operator's look. **Merged 2026-10-29 without the eleições change** (the
operator: "merge everything except the Eleições change and keep that page as it was"): the dossier stays paused and as
submitted to readers, and its row is `none` with that reason; the scoreboard hero stays on the branch as a proposal. The decisions were written down before any change:
one hero, five `none` with a reason, and three proposals for a later batch. No row in `design/heroes.json` is `pending`
now.

- **The eleições dossier:** the 2º turno scoreboard is the hero (the signed result, Lula against Flávio Bolsonaro, the
  50 % tick and the margin). It is the first figure a reader meets, under the header and its scope line, and a strip
  that gains from the width. The other candidate was the municipal map (§2), which at the container's width is already
  taller than a 1440 × 900 screen and would only grow past it. The phone drawing is the same scoreboard at 360 units:
  at 350 px the 900-unit drawing set its labels near 4 px, and the margin's note now takes its own line under the tick,
  where it would otherwise run into the two vote counts. The scope's rule ran into the scoreboard's top edge (gap 0, in
  the page before this batch too); the page gives a hero after the header's scope line the room the template gives one
  right under the title (`.page > header + .scope + .hero`, page-local while one page needs it). The page draws no ×, so
  no witness has to come first.
- **The landing:** `none`. It draws no figure: the one description, the register's four stats, the cards from outside.
  Proposed: the register's decided claims as cells by verdict (the gsm8k strip's form), each refuted claim's witness a ×
  on its own cell, which would make the landing's first × an event.
- **Janela and Swell:** `none`, and the hero rule stays out of `design/app-shell.js`. An app-shell page is its map: a
  surface 100 % × 100dvh with the map fixed under every panel, no container for a box to draw past, no `.figbox`, and
  drawings that are canvases over a basemap. A `.hero` rule there would change nothing a reader sees, and the ruler's
  hero width would read the viewport.
- **/explained/ and /uirapuru/:** `none`. Each page's natural hero is its cold open's stage, the claims flying through
  DECIDE, which is HTML and CSS motion labelled as only a picture, not an SVG in `.figbox`. /explained/'s one `.figbox`
  figure, the route of a claim, is a schematic held to 800 px (`.mach`), which a wider box would not widen; /uirapuru/
  has no `.figbox` figure, and its forests are drawn by the instruments in the browser, inside their panels. Proposed:
  the stage redrawn as a figure, its flight under D13's rule (points translated, never a dash), and on /uirapuru/ patch
  7 as a figure with the ringed bird as its event.

The ruler records the eleições hero at 1344 / 707 / 390 px. Swell @1440 read 10 spines against its recorded 9 again, the
known time-of-day flap on bytes this branch does not change; its recorded row is kept as it was, as is /eth/'s (out of
scope).
