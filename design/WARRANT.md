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

   When in doubt, use ink. Nothing else on the site is coloured.
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

## The site pass (2026-10-28)

- **Tier 1, the pages people land on:** the home page and Method; Janela, Swell, explained, Uirapuru and the eleições
  dossier; and the eight reports most linked from GitHub (optconst-queue, optimization-constants, kissing,
  openai-math, gsm8k-audit, alphaevolve-community, time-horizon, curve-seeds).
- **Tier 2:** every other report, converted when it is next edited for another reason, never in a sweep.
- **Not without the operator's word:** the submitted Petrobras material (Contraprova, Decidível, Abatimento).
