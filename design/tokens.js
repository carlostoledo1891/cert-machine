/* tokens.js — THE design values, once, as data.
   design/ · cert-machine

   Every HTML touchpoint in this repository is generated, and every generated
   page gets its `:root` block from this file. Nothing hand-writes a colour.

   WHY DATA AND NOT A .css FILE. Two consumers need these values and they need
   them in different forms: the page needs a CSS custom-property block, and the
   SVG figures need the same names as `var(--x)` references that resolve inside
   an inline <svg>. A stylesheet serves the first and not the second, and a
   second copy for the figures is the drift C50 warns about. So the values live
   here as data and both forms are emitted from them.

   PROVENANCE (operator instruction, 2026-09-01): the palette, faces and scale
   below reproduce the FRONTIER design system — frontier-apps/site/design/
   tokens.css + base.css (the terra atlas skin) — verbatim where a value maps,
   under the house token NAMES so every consumer (components, charts, battery,
   check-wiring) keeps its contract. The reference bytes are snapshotted in
   design/frontier-ref/ (frontier-apps has no git):
     tokens.css sha256 15eb6f28cdd1e2e4deaf8826e8417c841a4aff8809340f42d7f0b06c711479b8
     base.css   sha256 91d8172f51788d8ec5fb7723044c5e6b8dab923d1f5b33733f06a5251e418f7f
   This replaces the erdos-290 plum/green/amber house style; reverting is
   `git revert` of the restyle commit and nothing else.

   ONE THEME, DELIBERATELY. Frontier is dark-first, grayscale-only ("accent
   hues reserved for a future version"), and the operator asked for exactly
   that. So there is ONE palette on bare `:root` with color-scheme:dark; no
   media queries, no [data-theme] blocks, nothing undefined for anybody. The
   three-state machinery this file used to carry is retired with it.

   IDENTITY IS NEVER COLOUR-ALONE — more load-bearing than ever in grayscale:
   the chart series are three GRAYS (validated below), so the legend rule, the
   direct labels, dash-for-predicted and the hatch are what separate series;
   verdicts separate by WEIGHT + SHAPE (filled / outlined / dashed chips). */
'use strict';

/* ---------------------------------------------------------------- palette --
   Frontier's values under the house names. Mapping recorded pair by pair so
   the correspondence is checkable against frontier's tokens.css:
     --paper   = --bg            --surface = --surface (cards)
     --sunk    = --bg-raised     --surface2= --surface-2 (hover/nested)
     --ink..3  = --ink..3        --ink-4/5 = --ink-4/5 (new, frontier)
     --rule    = --border        --rule-strong = --border-strong
     --rule-soft = --chart-grid  (recessive internal hairlines)
     --sig     = --ink (links/eyebrows carry ink, not a hue)
     --sig-2   = --ink-4 (the link underline at rest)
     --sig-soft= --surface-2 (washes)
     --held    = --ink   / --held-soft = --surface-2   (certified: WEIGHT)
     --warn    = --ink-3 / --warn-soft = --surface     (open: DIMNESS)
     --mark    = --border-strong (inert figure marks)                       */
const DARKONLY = {
  '--paper':        '#0a0a0c',   /* page ground            (frontier --bg) */
  '--surface':      '#141419',   /* cards                  (--surface)     */
  '--sunk':         '#101014',   /* charts, panels, code   (--bg-raised)   */
  '--surface2':     '#1a1a20',   /* hover / nested         (--surface-2)   */

  '--ink':          '#f6f6f8',   /* headlines, primary values */
  '--ink-2':        '#c9c9d2',   /* body */
  '--ink-3':        '#9a9aa6',   /* secondary, axis labels */
  '--ink-4':        '#6e6e7a',   /* muted, eyebrows at rest */
  '--ink-5':        '#4a4a55',   /* disabled, watermark numerals */

  '--rule':         '#232329',   /* hairlines              (--border) */
  '--rule-strong':  '#32323c',   /* emphasized, hover      (--border-strong) */
  '--rule-soft':    '#1c1c22',   /* recessive dividers     (--chart-grid) */

  '--sig':          '#f6f6f8',   /* links, section labels — ink, not a hue */
  '--sig-2':        '#6e6e7a',   /* link underline at rest */
  '--sig-soft':     '#1a1a20',   /* washes, tag backgrounds */

  '--held':         '#f6f6f8',   /* certified voice: BRIGHT (weight, not hue) */
  '--held-soft':    '#1a1a20',
  '--warn':         '#9a9aa6',   /* open/undecided voice: DIM */
  '--warn-soft':    '#141419',

  '--mark':         '#32323c',   /* inert marks in figures */
  '--band-fill':    'rgba(246,246,248,0.07)',  /* interval bands, area fills */

  /* ---- chart marks — frontier's validated categorical GRAYS ----
     (their record: worst-pair CVD dE 19.6, all >= 3:1 on the chart surface;
     design/battery.js re-derives both facts at every run, because a
     measurement that is not re-run is a memory. Grayscale is CVD-invariant BY
     CONSTRUCTION — the battery asserts zero chroma rather than simulating.) */
  '--c-1':          '#f6f6f8',   /* the finding / the signal  (--series-1) */
  '--c-2':          '#a9a9b4',   /*                           (--series-2) */
  '--c-3':          '#6e6e7a',   /*                           (--series-3) */
  '--c-ctx':        'var(--ink-5)',     /* de-emphasised context series */
  '--c-grid':       '#1c1c22',          /* (--chart-grid) */
  '--c-axis':       '#2a2a32',          /* (--chart-axis) */

  /* Sequential ramp — ONE track of gray, dim -> bright with magnitude on the
     dark ground. Measured (OKLab L): .413 / .542 / .641 / .738 / .974 —
     monotone, every gap >= 0.06, dim end 2.17:1 on the chart surface; the
     battery re-derives all of it at every run. */
  '--c-s1':         '#4a4a55',
  '--c-s2':         '#6e6e7a',
  '--c-s3':         '#8b8b97',
  '--c-s4':         '#a9a9b4',
  '--c-s5':         '#f6f6f8'
};

/* ------------------------------------------------------------------- type --
   Frontier's two faces, from Google Fonts with real local fallback stacks:
   the page must be legible before a webfont lands, and the figures must not
   reflow when it does. (Frontier vendors subsetted woff2 copies of the SAME
   faces; Google serves the full variable fonts — visually identical, and the
   pages stay light. Vendoring can be revisited at deploy time.) */
const TYPE = {
  display: '"Inter","Helvetica Neue",-apple-system,system-ui,sans-serif',
  body:    '"Inter","Helvetica Neue",-apple-system,system-ui,sans-serif',
  mono:    '"JetBrains Mono","SF Mono",ui-monospace,SFMono-Regular,Menlo,monospace'
};

const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;480;530;550;600' +
  '&family=JetBrains+Mono:wght@400;500;600;700&display=swap';

/* ------------------------------------------------------------------ scale --
   Frontier's fluid scale, carried under the house keys. */
const SCALE = {
  h1:      'clamp(2.75rem,1.2rem + 6vw,5.5rem)',      /* --text-display */
  h2:      'clamp(1.9rem,1.2rem + 2.4vw,3rem)',       /* --text-1 */
  h3:      'clamp(1.35rem,1.1rem + 1vw,1.75rem)',     /* --text-2 */
  deck:    '1.125rem',                                /* --text-3 (lede) */
  pull:    'clamp(1.35rem,1.1rem + 1vw,1.75rem)',
  body:    '0.9375rem',                               /* --text-body */
  small:   '0.8125rem',                               /* --text-small / mono */
  eyebrow: '0.6875rem',                               /* --text-eyebrow */
  section: 'clamp(5rem,12vh,9rem)',                   /* --section-pad */
  pagePadY:'clamp(28px,5vw,60px)',
  pagePadX:'clamp(1.25rem,4vw,3rem)',                 /* --gutter */
  figPad:  '1.5rem'                                   /* --s-5 */
};

/* Measure: frontier's containers. Prose capped in characters (reading limit);
   figures and tables get the wide track. */
const MEASURE = { prose: '68ch', wide: '900px', page: '1200px', narrow: '820px' };

/* ------------------------------------------------------------- emitters --- */

function block(vars, indent) {
  const pad = indent || '  ';
  return Object.keys(vars).map(k => pad + k + ':' + vars[k] + ';').join('\n');
}

/* The type stack ships as CUSTOM PROPERTIES, not as values interpolated into
   each rule, so that (a) both page shells get it from one place and (b) a
   literal font stack appearing anywhere OUTSIDE this :root block is a
   detectable defect rather than a matter of taste. tools/check-wiring.js
   asserts exactly that. */
function fontBlock(indent) {
  const pad = indent || '  ';
  return [pad + '--f-display:' + TYPE.display + ';',
          pad + '--f-sans:' + TYPE.body + ';',
          pad + '--f-mono:' + TYPE.mono + ';'].join('\n');
}

/* ONE theme state: the full palette on bare :root, dark by declaration. */
function rootCss() {
  return [
    ':root{',
    '  color-scheme:dark;',
    block(DARKONLY),
    fontBlock(),
    '}'
  ].join('\n');
}

/* Token names available to inline SVG as var(--x). Figures must use ONLY these
   — the page battery checks figures against this list. */
const FIGURE_TOKENS = ['--ink', '--ink-2', '--ink-3', '--ink-4', '--ink-5',
  '--sig', '--sig-2', '--sig-soft',
  '--held', '--held-soft', '--warn', '--warn-soft', '--mark', '--band-fill',
  '--rule', '--rule-soft', '--rule-strong',
  '--surface', '--surface2', '--sunk', '--paper',
  '--c-1', '--c-2', '--c-3', '--c-ctx', '--c-grid', '--c-axis',
  '--c-s1', '--c-s2', '--c-s3', '--c-s4', '--c-s5'];

/* The chart palette, by the JOB each colour does — the only names a chart may
   reach for. CAT stays capped at three: in grayscale a fourth step would crowd
   the lightness track below the separation the battery enforces. More than
   three series means folding the tail into "other", faceting, or a table. */
const CHART = {
  CAT: ['var(--c-1)', 'var(--c-2)', 'var(--c-3)'],
  SEQ: ['var(--c-s1)', 'var(--c-s2)', 'var(--c-s3)', 'var(--c-s4)', 'var(--c-s5)'],
  CTX: 'var(--c-ctx)', GRID: 'var(--c-grid)', AXIS: 'var(--c-axis)', SURFACE: 'var(--sunk)'
};

/* Kept exports: LIGHT/DARK aliases point at the one palette so any consumer
   still importing them keeps working while it migrates. */
module.exports = { LIGHT: DARKONLY, DARK: DARKONLY, DARKONLY, TYPE, GOOGLE_FONTS,
  SCALE, MEASURE, FIGURE_TOKENS, CHART, rootCss, fontBlock };
