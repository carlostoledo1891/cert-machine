# WARRANT on paper: the print register (proposal, 2026-10-29)

**Status: for the operator's approval. Nothing is applied, served or wired.** WARRANT.md is unchanged; design/battery.js
T3b (no light theme on the site) stays as it is; the site's pages and gates are untouched. The register lives in
`design/print/`, which Vercel never serves.

**Why.** UFSC LabECO (Pedro Guimarães) writes reports for Petrobras: PDFs and Word documents read on white paper and
printed on mono laser printers. WARRANT is dark-only, so it could not reach them. LabECO works in Python, so the kit is
matplotlib.

**What to look at.** `specimen.pdf` (colour) and `specimen-grey.pdf` (as a mono laser prints it), with their SVGs: the
standings, the void, the witness, the guide, the mood, the register, and two report figures redrawn from our records
(buoy A's design wave by block from certs/hseva-ledger.json; dataset A's 20-year contours from
certs/ecbench-ledger.json and the pinned corpus). Then `REPORT.md` (the validator) and `kits/warrant-mpl/`.

## What changes on paper, and why

| | screen (v2.2) | paper (proposed) | why |
|---|---|---|---|
| stroke patterns | five, design/grammar.js | **the same five**, read from grammar.js | the grammar does not change; P2/P3 check it |
| strongest mark | brightest (`--ink` #f6f6f8) | darkest: `--ink` **#000000** | the anchor flips on white; pure black is the one value a mono laser lays as solid toner, never a halftone |
| standing tones | decided ink, chosen ink-2, computed ink-3 | the same mapping: #000000, #262626, #4d4d4d | each weaker standing one step lighter, as it is one step dimmer on screen; the dash still carries it |
| identity | grey + weight + opacity | colour + a marker each (● ■ ▲), one weight | opacity on paper is a lighter colour no validator saw; a thinner line flips grammar.js to its short dashes |
| order ramp | grey, dim → bright | grey, light → dark, 5 steps | more is darker on paper; neutral, so greyscale keeps every step |
| witness | #e0574e | **#e0574e, unchanged** | one red in every project (v2.2 rule 2); on white it is a mark (3.72:1), not text, and it only paints the × |
| marks over a field | — | drawn on a paper casing | a coloured line over a grey field loses contrast (the blue falls to 1.94:1 on the darkest step) |
| what a figure SVG may contain | the site's gates | `check-svg.js`: grammar.js's dashes (via check-grammar's census), register colours, no translucency, no raster | a translucent register colour is a new colour on paper |

## The validator (REPORT.md, report.json)

**PASS: 9 of 9 checks, 13 of 13 red controls refused.** It runs the code design/battery.js runs (moved, byte for byte,
into `design/colour.js`; the battery's output is identical). Every pair of the seven colours that can share a figure
clears normal vision ≥ 15 and protan, deutan and tritan ≥ 8: worst normal **15.2** (ink-2 · ink-3), worst CVD **9.3**
(guide · witness, deutan). Text inks 21.00, 15.13 and 8.45:1; the blue 5.40:1; the guide 3.45:1; the witness 3.72:1. The
ramp: L 0.934 → 0.690, every step ≥ 0.060 in colour and in both greyscale conversions, light end 1.21:1, black over
every step ≥ 7.56:1. In greyscale two pairs fall below ΔE 8, by design (v2.2 rule 1, ink first): ink-3 · blue (7.6),
told apart by ▲ against ■ and the label; guide · witness (2.0), told apart by the × and its words.

## What needs approval (each colour and its reason), with my recommendation

1. **The register as a whole, as WARRANT on paper.** Neutral values only, each for a role WARRANT already has: ink
   #000000, ink-2 #262626, ink-3 #4d4d4d, guide #8a8a8a, grid #dcdcdc, ramp #e9e9e9 #d5d5d5 #c1c1c1 #aeaeae #9b9b9b.
   *Recommend: approve.* No hue, no new meaning.
2. **The witness on paper keeps #e0574e.** It clears 3:1 as a mark, not 4.5:1 as text: it may only ever be the × glyph,
   never a word in red. The alternative, a darker paper step of the same hue (#c53a31, 5.22:1), is a second red value
   (ΔE 8.1 from the site's) and fails protan against ink-3 (7.5). *Recommend: keep the one red.*
3. **The print blue #3368c1 (identity 2, ■), a NEW colour.** Paper figures compare series, and opacity cannot carry
   identity there. 5.40:1, OKLCH hue 260°, chroma 0.151 (moderate, so it should sit inside common CMYK gamuts; not
   verified against an ICC profile). Registered meaning: "the second series compared in one figure", always with ■ and
   a word. *Recommend: approve, for print only.* If declined, the kit draws the second series in ink-2 with ■
   (`use(identity_hue=False)`), as the site draws identity in greys.
4. **The casing rule**: a mark drawn over a ramp field is drawn on a paper casing. *Recommend: approve.*
5. **The kit's place**: `kits/warrant-mpl/` (MIT; generated register and styles; a pinned venv target
   `make warrant-mpl-venv`; its test outside `make test`). *Recommend: approve as is; wire its test into make test and
   build-control only when it ships.*

## Open questions

- **Word.** The kit writes SVG, PDF and PNG. Recent Word inserts SVG; older Word needs PNG (300 dpi) or EMF. Which
  Word does LabECO deliver in? (Ask Pedro.)
- **The first ramp step** (#e9e9e9, about a 9% tint) may drop out on some office lasers; a four-step ramp from #d5d5d5
  is the fallback if a test print shows it.
- **Fonts.** The sheets use Inter and JetBrains Mono; LabECO's machines will fall back to Arial or DejaVu Sans (the kit
  resolves the chain at `use()`, and DejaVu Sans carries ∅ and ×).
- **Two blues across projects.** The print blue sits ΔE 10.1 from Machinidae's violet #6744c5 and 24.3 from its blue
  #79b9d6. They never share a figure, but rule 2 is "one colour, one meaning, in every project".
- **A Python-native checker** for LabECO's own CI would be a second implementation of check-svg.js; it would need a
  concordance battery, as wiring has (JS vs Python).
- **The papers** stay as WARRANT says ("never in the papers" until ruled paper-ready); this proposal does not change
  that.

## Draft for WARRANT.md (not applied)

> ## v2.3: on paper (approved YYYY-MM-DD)
>
> Reports read on white paper and printed in greyscale take the print register (`design/print/tokens.js`); the site
> stays dark (battery T3b). The stroke grammar does not change: the five patterns of design/grammar.js, each standing
> in the class and the tone role it has on screen. On paper the anchor flips: the strongest mark is the darkest, ink is
> #000000, and each weaker standing is a step lighter (chosen #262626, computed #4d4d4d); the dash carries the standing.
>
> 1. **Ink first, again.** Every print figure reads in greyscale as a mono laser prints it: each series has its own
>    marker, the witness is a ×, a refusal is a hatch and ∅ in words.
> 2. **Identity on paper is a colour and a marker**, at one weight and full opacity: ● ink, ■ the print blue
>    #3368c1, ▲ #4d4d4d. Never opacity: on paper it is a colour nobody validated.
> 3. **The witness is the one red, #e0574e**, a mark on white (3.72:1): only ever the × glyph beside words.
> 4. **The order ramp runs light to dark** with magnitude, neutral, five steps; ink reads on every step. A coloured
>    mark over a field is drawn on a paper casing.
> 5. **A print figure is checked** by design/print/check-svg.js: grammar.js's dashes and the register's colours, no
>    translucency, no raster. The kit for matplotlib is kits/warrant-mpl; its register is generated, never typed.
>
> **Registered colours (paper)** · #3368c1 · identity · the second series compared in a print figure, with ■ · print ·
> YYYY-MM-DD.
