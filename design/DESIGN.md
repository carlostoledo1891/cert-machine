# design/ — the one place a page comes from

**Every HTML file in this repository is generated.** Nothing is hand-written, nothing is
hand-edited, and `index.html` carries no exception. Editing a generated page is a change
that survives until the next build and then silently vanishes — which is worse than not
making it, because for a while it looked done.

```
design/
  tokens.js       THE values — palette, type, scale, measure. Data, not CSS.
  components.js   every visual element, as (data) -> markup
  template.js     the page shell: <head>, the stylesheet, <body>
  DESIGN.md       this file — what exists and how to add to it
tools/
  build-control.js  reads records → calls components → writes index.html
  test-control.js   the gate: determinism, derivation, and the design invariants
```

Build with `make control`. Gate with `make page`. Both are in `make selftest`'s
NOT-COVERED list only in the sense that a *campaign* is — the page battery itself runs.

---

## Why tokens are data and not a stylesheet

Two consumers need the same values in different forms. The page needs a CSS custom-property
block; the inline SVG figures need the same names as `var(--x)` references. A `.css` file
serves the first and not the second, and keeping a second copy for the figures is exactly
the hand-copied relation that goes stale the first time a colour changes.

So the values live in `tokens.js` as objects, and both forms are emitted from them.
`tokens.rootCss()` produces the whole `:root` cascade; `tokens.FIGURE_TOKENS` is the list a
figure may reference, and `test-control.js` fails the build if a figure paints with anything

## charts.js — everything that plots a number

`components.js` owns the page's blocks; `charts.js` owns the charts, because a
chart has rules prose does not and they are easier to keep in one place than to
remember at every call site. Forms: `lines` · `band` · `bars` · `dist` ·
`dumbbell` · `strip` · `intervals` · `segments` · `sparkline`, plus `legend`,
`script` (one delegated hover listener per page) and the log-axis tick helper.

What the kit enforces so a builder never has to re-derive it:

- **Colour by the job.** Magnitude takes the one-hue sequential ramp
  (`--c-s1..5`); identity takes at most THREE hues (`--c-1..3`) — a fourth would
  have to be generated, and a generated hue is indistinguishable from an
  existing one under colour-vision deficiency; context takes `--c-ctx` and is
  exempt from that cap, which is how the *emphasis* form works.
- **Colour is never the only channel.** `legend()` throws on a swatch with no
  word beside it. The chart trio's worst pair sits in the 6–8 CVD floor band,
  where secondary encoding is mandatory rather than nice.
- **Text never wears the data colour** — ink tokens only; identity comes from
  the coloured mark beside the text.
- **Marks and spacers:** 2px lines, ≥8px end markers with a 2px surface ring,
  bars ≤24px with a 4px rounded data-end and a 2px surface gap, hairline SOLID
  gridlines. Dashes are reserved for predicted/uncertified marks — never grid.
- **Labels are measured, not hoped:** legend advance comes from the label
  length, band captions centre only when they fit, callouts stack vertically
  rather than dodging sideways, and a log axis REFUSES a zero instead of
  clamping it to the floor.

`design/battery.js` is the gate: it re-derives the palette checks in OKLab with
the Machado 2009 CVD model (rather than quoting the day they were chosen), scans
every generated report for a literal colour inside an `<svg>`, checks every
figure has a text alternative, and fires four falsifiers. It runs in `make test`.

else.

### The three-state theme rule

A viewer is in one of **three** states, not two:

| state | what is on the root element | what applies |
|---|---|---|
| explicit light | `data-theme="light"` | the bare `:root` palette |
| explicit dark | `data-theme="dark"` | the `[data-theme="dark"]` block |
| **system (the default)** | **nothing** | `prefers-color-scheme`, guarded by `:not([data-theme="light"])` |

So the dark overrides are emitted **twice** — once inside the media query and once inside
the attribute selector. A colour whose only definition lives inside a media query is a
colour that is undefined for somebody. Three checks in the page battery hold this.

---

## Tokens

Roles, not names. That `--sig` is currently plum is a decision recorded in `tokens.js` and
nowhere else; a page never names a colour.

| token | role | light | dark |
|---|---|---|---|
| `--paper` | the page ground | `#EDEBEE` | `#0F0C12` |
| `--surface` | raised: cards, figure boxes, table bodies | `#FBFAFB` | `#181420` |
| `--sunk` | recessed: notes, equations | `#F3F1F4` | `#130F18` |
| `--ink` | body text and headings | `#16121A` | `#EDE8F0` |
| `--ink-2` | secondary prose, table cells, captions | `#544C5B` | `#A79DAF` |
| `--ink-3` | labels, axis text, metadata | `#867C8E` | `#7E7386` |
| `--rule` | structural borders | `#D2CBD6` | `#2E2637` |
| `--rule-soft` | internal dividers | `#E3DEE7` | `#231C2B` |
| `--sig` | **signature**: links, section labels, key figures | `#6B2D5C` | `#D897C4` |
| `--sig-2` | signature underline, secondary strokes | `#9A4E86` | `#B36F9E` |
| `--sig-soft` | signature wash, tag backgrounds | `#F2E4EE` | `#2C1B27` |
| `--held` | **the second voice**: proved, confirmed, green | `#2C6142` | `#79C79B` |
| `--held-soft` | its wash | `#DEEBE3` | `#16281E` |
| `--warn` | open questions, unpatched defects | `#8A5212` | `#E0A860` |
| `--warn-soft` | its wash | `#F6E9D8` | `#2B2015` |
| `--mark` | inert marks in figures | `#C9C0CE` | `#332B3C` |

**Three colours carry meaning and must not be used decoratively.** `--sig` means *this is
the thing*; `--held` means *this is settled*; `--warn` means *this is open*. A green tag on
something unproved is a lie told in a colour.

### Type

| face | job | stack |
|---|---|---|
| `TYPE.display` | headings, stat values | Fraunces → Georgia → serif |
| `TYPE.body` | prose | Spectral → Georgia → serif |
| `TYPE.mono` | **every number, id, path and hash** | IBM Plex Mono → ui-monospace → Menlo |

Every face has a real fallback. These pages are read locally, sometimes with no network, and
they must be legible before a webfont lands.

### Scale and measure

Fluid where a jump would be visible (`h1`, `h2`, `deck`, section rhythm), fixed where
stability matters more than proportion (`body`, `h3`). Prose is capped at **64ch** — a
reading limit, so expressed in characters. Figures and tables get a wider **900px** track;
the page itself caps at **1060px**.

A `.wide` element emitted inside a prose column (`.col .wide` — a table or card grid in a
non-wide section) **breaks out to the page-wide track**: `.col` and `.page` are both
centered, so the template recenters it on the viewport at
`min(900px, 100vw − 2·pagePadX)`. Prose keeps its measure, the table gets its track, and
the body never scrolls sideways — anything wider still scrolls inside its own `.tw`.
A figure's `figcaption` spans its figure's full track, not a 70ch block.

---

## Components

Each is `(data) -> string`. None reads a file, none knows what a hunt is, and **none
contains a number**. A builder passes data; the component decides markup.

| component | data | use |
|---|---|---|
| `header({eyebrow,title,deck})` | strings | the page head |
| `stats(items)` | `[{k,v,n,sm,role,vRaw}]` | the hero strip. `role`: `held`/`warn` colours the value; `sm` for long values |
| `scope(text)` | string | the rule under the hero: what this document is and is not |
| `section({lab,title,bodyRaw,wide})` | | a numbered section. `wide` puts the body in the 900px track |
| `p` / `pRaw` / `pull` / `eq` | | prose, prose-with-markup, a pull quote, a display equation |
| `code(text)` | string | a command / code block: recessed like `.eq`, left-aligned, 13px mono. Never an inline-styled `<pre>` |
| `note({lab,bodyRaw})` | | the recessed aside — caveats, scope lines, "why this is not what it looks like" |
| `tldr({findingRaw,mechanismRaw,checkRaw})` | markup strings | the ten-second block under a report's header: finding / mechanism / how a stranger re-checks it. Every report carries one; wraps its own `.col` |
| `quote({text,cite})` | | a source, quoted, with its citation |
| `table({cols,rows})` | `cols:[{h,cls}]`, cells are strings or `{raw}` | the ledger form. `cls: 'v'` for mono values, `'k'` for a display-face key, `'n'` for a right-aligned number |
| `plainList(items)` | `[{b,text}]` or `{raw}` | claim lists — a lead in bold, then the qualification |
| `cards(items)` | `[{href,k,title,desc,n}]` | a grid of link cards, the whole card the anchor: two columns on a desk, one on a phone. The report index and the landing's report list |
| `figure({svgRaw,caption})` | | wraps a figure. **`alt` on the svg is required** |
| `m(s)` | string | inline monospace — every number, path, id, hash |
| `tag(text,kind)` | `kind ∈ held·cert·open·dep` | a status chip |
| `categoryChart({cats,...})` | | value-per-named-bucket figure |
| `flow({w,h,alt,readout,nodes,edges,caption})` | `nodes:[{x,y,w,h,role,k,v,t,d}]`, `edges:[{d,lab,flow}]` | the interactive machine schematic: nodes as focusable buttons, animated flow along edges, a readout narrating the active node. Ships the design system's ONE inline script; with scripts off the default narration stands and hover still highlights. The drawing is geometry-agnostic; the machine's is drawn VERTICAL and DENSE at 800 design units (tools/machine-figure.js — families four across, instruments four across), and the template caps its rendered width at that same 800px so desktop renders near 1:1 |
| `numberLine({...})`, `band`, `vmark`, `label`, `legend` | | figure atoms |

The top bar (`nav`) is emitted by the template on every page, never by a builder. Its
GitHub link is the mark alone on desktop with an `aria-label`; on narrow viewports the
links fold into a drawer driven by a checkbox and its label — CSS state, no script, so
the system still ships exactly one scripted element (the flow readout).

### Escaping

Everything that can carry a value from disk goes through `esc()`. The exception is any
parameter named `…Raw`, which exists for markup these components themselves generated. The
naming is the point: an unescaped insertion is visible at the call site.

---

## Adding a page

1. Write a builder in `tools/` that **reads records and calls components**. It may not
   contain a literal number that belongs to the work — only paths and the code to read them.
2. Emit through `template.render({title, bodyRaw, footRaw})`.
3. Extend `tools/test-control.js` (or copy it) so the new page's headline numbers are
   cross-checked against the records they came from.
4. Add a `make` target.

## Adding a component

Add the function to `components.js` **and** the rule to `template.css()` **and** a row to
the table above, in one change. A class with no rule looks right on the day it ships and
wrong three pages later; a component with no row gets reinvented by the next builder.

## What the page battery holds

`tools/test-control.js`, 30 checks including 4 red controls:

- **Determinism** — built twice, byte-identical. This is why the battery table carries no
  timing column: a wall-clock number would make the page a function of the machine's mood.
- **Derivation** — every headline number is found, character for character, in the record it
  claims to come from. Not "approximately equal". Found.
- **Design invariants** — no literal colour outside the token block, no figure painting with
  a literal colour, all three theme states defined, every figure carrying a text
  alternative, no script, prose measure in `ch`.

The red controls inject a hand-typed number, a clock, a stray hex and a stripped `aria-label`
and confirm each is detected. A check nobody has seen go red is decoration.

## The app shell (second view, 2026-08-27)

`design/app-shell.js` renders the design system's SECOND page view: a
full-viewport application surface (100% × 100dvh) for `apps/` — fixed top
bar, lateral panel, bottom dock, no prose column. Same tokens, same type
stack, same three-state theme rule as `template.js`. It adds three app
tokens — `--v-cert` / `--v-refu` / `--v-refd` (the three-valued verdict
colors) — defined in both palettes inside the shell's own root block with
the standard dark guards; clients that need them in WebGL read the computed
custom properties at runtime, never literals. Components: `.as-top`,
`.as-panel`, `.as-dock`, `.as-chip`, `.as-btn`, `.as-bar`, `.as-kv`,
`.as-note`, `.as-h`. First consumer: apps/skyaudit.
