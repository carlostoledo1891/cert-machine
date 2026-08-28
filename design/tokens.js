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

   THE THREE-STATE THEME RULE, which is easy to get wrong and expensive to fix:
   a viewer is in one of three states — explicit light, explicit dark, or the
   default "system", which stamps nothing on the root element. So the full light
   palette is defined on bare `:root`; dark overrides appear TWICE, once under
   `prefers-color-scheme: dark` guarded by `:not([data-theme="light"])` and once
   under `[data-theme="dark"]`. A colour whose only definition lives inside a
   media query is a colour that is undefined for somebody.

   Provenance: the palette, type stack and scale are taken from the erdos-290
   research note, which is the house style this lab publishes in. */
'use strict';

/* ---------------------------------------------------------------- palette --
   Roles, not names. `--sig` is "the signature colour"; that it is currently
   plum is a decision recorded here and nowhere else. */
const LIGHT = {
  '--paper':     '#EDEBEE',   /* the page ground */
  '--surface':   '#FBFAFB',   /* raised: cards, figure boxes, table bodies */
  '--sunk':      '#F3F1F4',   /* recessed: notes, equations */

  '--ink':       '#16121A',   /* body text and headings */
  '--ink-2':     '#544C5B',   /* secondary prose, table cells, captions */
  '--ink-3':     '#867C8E',   /* labels, axis text, metadata */

  '--rule':      '#D2CBD6',   /* structural borders */
  '--rule-soft': '#E3DEE7',   /* internal dividers */

  '--sig':       '#6B2D5C',   /* signature: links, section labels, key figures */
  '--sig-2':     '#9A4E86',   /* signature underline / secondary strokes */
  '--sig-soft':  '#F2E4EE',   /* signature wash, for tag backgrounds */

  '--held':      '#2C6142',   /* the second voice: proved / green / confirmed */
  '--held-soft': '#DEEBE3',

  '--warn':      '#8A5212',   /* open questions, unpatched defects */
  '--warn-soft': '#F6E9D8',

  '--mark':      '#C9C0CE',   /* inert marks in figures */

  /* ---- chart marks ----
     Text tokens are tuned for READING: dark, low-chroma, high contrast on
     prose. As chart marks they fail — the trio (--sig, --held, --warn) sits
     outside the OKLCH lightness band, --held drops under the chroma floor, and
     green↔amber collapses to ΔE 5.4 under protanopia. So chart marks get their
     own steps, snapped from the SAME three hues: hue held, lightness and chroma
     moved until the categorical checks pass, then the passing candidate closest
     to the brand token wins. Measured with the dataviz validator against the
     figure surface (--surface), all-pairs, both modes:
       light  worst all-pairs ΔE 6.8 (deutan) · normal 15.3 · band/chroma/contrast PASS
       dark   worst all-pairs ΔE 6.4 (tritan) · normal 16.2 · band/chroma/contrast PASS
     (design/battery.js re-derives all of these at every run — they are
     measurements, and a measurement that is not re-run is a memory.)
     The published method calibrates its thresholds on protanopia and
     deuteranopia; design/battery.js gates on TRITANOPIA too, which is stricter
     than the standard and cost one search to satisfy — the first triple that
     passed the standard collapsed to ΔE 4.3 tritan in dark mode. The steps
     below clear all three, and they are CLOSER to the brand tokens than that
     first answer was, so nothing was traded away for it.
     CVD still lands in the 6–8 floor band, which is legal ONLY with secondary
     encoding — so every chart that uses more than one of them ships a labelled
     legend and direct labels. That is the same rule the app doctrine already
     states as "severity is never colour alone"; here it is load-bearing. */
  '--c-1':       '#6F3968',   /* the finding / the signal        (from --sig)  */
  '--c-2':       '#16724E',   /* proved / held / compliant       (from --held) */
  '--c-3':       '#885218',   /* open / undecided / over a limit (from --warn) */
  '--c-ctx':     'var(--ink-3)',    /* de-emphasised context series           */
  '--c-grid':    'var(--rule-soft)',/* hairline grid, one step off the surface */
  '--c-axis':    'var(--rule)',     /* the axis rules themselves              */

  /* Sequential ramp — ONE hue (the signature plum), light → dark, for
     magnitude. Validated with the ordinal checks: monotone L, adjacent ΔL ≥
     0.06, light end ≥ 2:1 on the figure surface, hue spread 1°. */
  '--c-s1':      '#C7A5BC',
  '--c-s2':      '#B982A9',
  '--c-s3':      '#A86195',
  '--c-s4':      '#953F80',
  '--c-s5':      '#7D2169'
};

const DARK = {
  '--paper':     '#0F0C12',
  '--surface':   '#181420',
  '--sunk':      '#130F18',

  '--ink':       '#EDE8F0',
  '--ink-2':     '#A79DAF',
  '--ink-3':     '#7E7386',

  '--rule':      '#2E2637',
  '--rule-soft': '#231C2B',

  '--sig':       '#D897C4',
  '--sig-2':     '#B36F9E',
  '--sig-soft':  '#2C1B27',

  '--held':      '#79C79B',
  '--held-soft': '#16281E',

  '--warn':      '#E0A860',
  '--warn-soft': '#2B2015',

  '--mark':      '#332B3C',

  /* chart marks, dark mode — SELECTED against the dark figure surface, not an
     automatic flip of the light steps; the sequential ramp's anchor flips with
     it (dark → light as magnitude grows). */
  '--c-1':       '#B67BAE',
  '--c-2':       '#46A971',
  '--c-3':       '#C77F35',
  '--c-ctx':     'var(--ink-3)',
  '--c-grid':    'var(--rule-soft)',
  '--c-axis':    'var(--rule)',
  '--c-s1':      '#663E5B',
  '--c-s2':      '#8A4E7A',
  '--c-s3':      '#AF619A',
  '--c-s4':      '#C97FB4',
  '--c-s5':      '#DCA3CB'
};

/* ------------------------------------------------------------------- type --
   Three faces with three jobs. Every one carries a real fallback stack: the
   page must be legible before a webfont lands, and the figures must not reflow
   when it does. */
const TYPE = {
  display: '"Fraunces",Georgia,serif',                        /* headings, key figures */
  body:    '"Spectral",Georgia,serif',                        /* prose */
  mono:    '"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace'  /* data, labels, code */
};

const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700' +
  '&family=IBM+Plex+Mono:wght@400;500&family=Spectral:wght@300;400;600&display=swap';

/* ------------------------------------------------------------------ scale --
   Fluid where a jump would be visible, fixed where stability matters more than
   proportion. Every clamp() is (floor, preferred, ceiling) on the viewport. */
const SCALE = {
  h1:      'clamp(40px,7.4vw,74px)',
  h2:      'clamp(25px,3.3vw,34px)',
  h3:      '19.5px',
  deck:    'clamp(19px,2.2vw,22px)',
  pull:    'clamp(23px,3.2vw,30px)',
  body:    '18px',
  section: 'clamp(50px,7.5vw,84px)',
  pagePadY:'clamp(28px,5vw,60px)',
  pagePadX:'clamp(18px,4vw,40px)',
  figPad:  'clamp(16px,3vw,28px)'
};

/* Measure: prose is capped in CHARACTERS, not pixels, because the limit is a
   reading limit. Figures and tables get their own wider track. */
const MEASURE = { prose: '64ch', wide: '900px', page: '1060px' };

/* ------------------------------------------------------------- emitters --- */

function block(vars, indent) {
  const pad = indent || '  ';
  return Object.keys(vars).map(k => pad + k + ':' + vars[k] + ';').join('\n');
}

/* The complete `:root` cascade, all three theme states. */
function rootCss() {
  return [
    ':root{',
    block(LIGHT),
    '}',
    '@media (prefers-color-scheme: dark){',
    '  :root:not([data-theme="light"]){',
    block(DARK, '    '),
    '  }',
    '}',
    ':root[data-theme="dark"]{',
    block(DARK),
    '}'
  ].join('\n');
}

/* Token names available to inline SVG as var(--x). Figures must use ONLY these
   — a literal hex in a figure is invisible in one theme, and this list is what
   the page battery checks figures against. */
const FIGURE_TOKENS = ['--ink', '--ink-2', '--ink-3', '--sig', '--sig-2', '--sig-soft',
  '--held', '--held-soft', '--warn', '--warn-soft', '--mark', '--rule', '--rule-soft',
  '--surface', '--sunk', '--paper',
  '--c-1', '--c-2', '--c-3', '--c-ctx', '--c-grid', '--c-axis',
  '--c-s1', '--c-s2', '--c-s3', '--c-s4', '--c-s5'];

/* The chart palette, by the JOB each colour does — the only names a chart may
   reach for. CAT is capped at three on purpose: a fourth hue in this system
   would have to be generated, and a generated hue is indistinguishable from an
   existing one under CVD. More than three series means folding the tail into
   "other", faceting into small multiples, or a table. */
const CHART = {
  CAT: ['var(--c-1)', 'var(--c-2)', 'var(--c-3)'],
  SEQ: ['var(--c-s1)', 'var(--c-s2)', 'var(--c-s3)', 'var(--c-s4)', 'var(--c-s5)'],
  CTX: 'var(--c-ctx)', GRID: 'var(--c-grid)', AXIS: 'var(--c-axis)', SURFACE: 'var(--surface)'
};

module.exports = { LIGHT, DARK, TYPE, GOOGLE_FONTS, SCALE, MEASURE, FIGURE_TOKENS, CHART, rootCss };
