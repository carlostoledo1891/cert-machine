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
   Frontier's values under the house names. The correspondence used to be
   written out here as a comment, pair by pair — the hand-copied relation
   DESIGN.md warns about. It is the FRONTIER table further down now, it is
   executable, and site/instruments/design/tokens.css is generated from it, so the
   two name sets cannot disagree. The pairs it does NOT carry, because only the
   report side has names for them, are the ones below: --sig/--sig-2/--sig-soft
   (links and washes carry ink, not a hue), --held/--held-soft (the certified
   voice: BRIGHT, weight not hue), --warn/--warn-soft (the open voice: DIM),
   and --mark (inert marks in figures). Those are the voice tokens, and phase 4
   is where they meet warrant.js's four standings.                          */
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

/* The one drop shadow. It was written three times — a literal in template.js,
   a --shadow token in app-shell.js's light block and another in its dark
   block — so it is data here and every one of them derives it. */
const SHADOW = '0 8px 28px rgba(0,0,0,.55)';

/* ------------------------------------------- the rest of the scale, once ---
   Rhythm, shape and motion were declared ONLY in the instruments stylesheet
   and therefore governed only /instruments; the report side had no names for
   any of them and hand-wrote every value. They live here now because the
   generated instruments stylesheet is emitted from this file (2026-09-04,
   phase 1 of the one-seed pass) and because a component shared by both sides
   cannot be written while half the scale exists on one side only. */
const RHYTHM = {
  leading: { tight: '1.04', snug: '1.25', body: '1.65' },
  track:   { display: '-0.035em', title: '-0.02em', eyebrow: '0.16em' },
  weight:  { display: '550', title: '530', medium: '480', body: '400' },
};
/* 4px base. The names are the steps, not the pixels, so a step can be retuned
   in one place without a search for "1.5rem". */
const SPACE = { 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.5rem',
  6: '2rem', 7: '3rem', 8: '4rem', 9: '6rem', 10: '8rem' };
const SHAPE = { s: '6px', m: '10px', l: '16px', pill: '999px' };
const MOTION = { ease: 'cubic-bezier(0.22, 1, 0.36, 1)', fast: '160ms', med: '280ms', slow: '520ms' };

/* ------------------------------------------ the instruments' name table ---
   /instruments carries frontier's ORIGINAL token names (--bg, --border,
   --series-1) and the reports carry the house names (--paper, --rule, --c-1)
   for the same values. That correspondence used to live in a COMMENT at the
   top of this file — "the hand-copied relation that goes stale the first time
   a colour changes", which is the exact thing DESIGN.md warns about. It is a
   table now, and the instruments stylesheet is GENERATED from it, so the two
   name sets cannot drift: there is one value and two ways to say it.

   The audit that forced this (2026-09-04): 15 of the 16 mapped pairs were
   already byte-identical and the 16th differed only in the whitespace inside
   an rgba(). Nothing was wrong yet. Nothing was stopping it, either.

   The four verdict-chip colours are aliases too — every one of them is a
   palette value under another name, so the chip introduces no colour.       */
const FRONTIER = {
  '--bg': '--paper', '--bg-raised': '--sunk', '--surface': '--surface',
  '--surface-2': '--surface2', '--border': '--rule', '--border-strong': '--rule-strong',
  '--ink': '--ink', '--ink-2': '--ink-2', '--ink-3': '--ink-3',
  '--ink-4': '--ink-4', '--ink-5': '--ink-5',
  '--series-1': '--c-1', '--series-2': '--c-2', '--series-3': '--c-3',
  '--chart-grid': '--c-grid', '--chart-axis': '--c-axis', '--band-fill': '--band-fill',
  '--verdict-certified-bg': '--ink', '--verdict-certified-ink': '--paper',
  '--verdict-refuted-ink': '--ink', '--verdict-refused-ink': '--ink-3',
};

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
    '  --shadow:' + SHADOW + ';',
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

/* -------------------------------------------- the instruments stylesheet --
   playground/design/tokens.css USED TO BE A HAND-WRITTEN SECOND COPY of the
   palette under frontier's names. It is generated from the table above now, so
   the file on disk is an artifact: playground/build.js writes it into
   site/instruments/design/ at build time and there is no source copy to drift.

   Two things here are genuinely the instruments' own and not the reports':
   the VENDORED variable fonts (the pages ship woff2 beside themselves rather
   than asking Google, so a plate renders identically offline), and the local
   @font-face blocks that declare them. The FALLBACK STACK behind them is
   TYPE's, not a restatement — which is the one visible change this generation
   makes: the pre-webfont fallback order is now the same on both sides of the
   site instead of two orderings nobody chose.                               */
const VENDORED = { sans: "'Inter var'", mono: "'JetBrains Mono var'" };

function instrumentsCss() {
  const v = {};
  for (const [frontier, house] of Object.entries(FRONTIER)) {
    if (DARKONLY[house] === undefined) throw new Error('FRONTIER maps ' + frontier + ' to ' + house + ', which is not a palette name');
    v[frontier] = DARKONLY[house];
  }
  Object.assign(v, {
    '--font-sans': VENDORED.sans + ',' + TYPE.body,
    '--font-mono': VENDORED.mono + ',' + TYPE.mono,
    '--text-display': SCALE.h1, '--text-1': SCALE.h2, '--text-2': SCALE.h3,
    '--text-3': SCALE.deck, '--text-body': SCALE.body, '--text-small': SCALE.small,
    '--text-mono': SCALE.small, '--text-eyebrow': SCALE.eyebrow,
    '--leading-tight': RHYTHM.leading.tight, '--leading-snug': RHYTHM.leading.snug,
    '--leading-body': RHYTHM.leading.body,
    '--track-display': RHYTHM.track.display, '--track-title': RHYTHM.track.title,
    '--track-eyebrow': RHYTHM.track.eyebrow,
    '--weight-display': RHYTHM.weight.display, '--weight-title': RHYTHM.weight.title,
    '--weight-medium': RHYTHM.weight.medium, '--weight-body': RHYTHM.weight.body,
  });
  for (const [k, val] of Object.entries(SPACE)) v['--s-' + k] = val;
  v['--section-pad'] = SCALE.section;
  v['--container'] = MEASURE.page;
  v['--container-narrow'] = MEASURE.narrow;
  v['--gutter'] = SCALE.pagePadX;
  for (const [k, val] of Object.entries(SHAPE)) v['--radius-' + k] = val;
  v['--ease-out'] = MOTION.ease;
  v['--dur-fast'] = MOTION.fast; v['--dur-med'] = MOTION.med; v['--dur-slow'] = MOTION.slow;
  v['--shadow'] = SHADOW;

  const face = (family, file, wRange) =>
    `@font-face {\n  font-family: ${family};\n  src: url('../assets/fonts/${file}') format('woff2');\n`
    + `  font-weight: ${wRange};\n  font-style: normal;\n  font-display: swap;\n}`;

  return ['/* tokens.css — GENERATED from design/tokens.js. Do not edit.',
    '   Every value here is emitted from that file; the frontier names below and',
    '   the house names the reports use are two spellings of ONE palette, mapped',
    '   in its FRONTIER table. Editing this file changes nothing: the next',
    '   `make playground` overwrites it. Change design/tokens.js.',
    '',
    '   Dark-first, grayscale-only. Identity is never colour-alone — the chart',
    '   series are three greys, so the legend rule, the direct labels and the',
    '   stroke pattern are what separate them. design/battery.js re-derives the',
    '   contrast and CVD facts at every run, because a measurement that is not',
    '   re-run is a memory. */',
    '', face(VENDORED.sans, 'inter-var.woff2', '100 900'),
    face(VENDORED.mono, 'jetbrains-mono-var.woff2', '100 800'),
    '', ':root {', '  color-scheme: dark;',
    Object.entries(v).map(([k, val]) => '  ' + k + ': ' + val + ';').join('\n'),
    '}', ''].join('\n');
}

/* Kept exports: LIGHT/DARK aliases point at the one palette so any consumer
   still importing them keeps working while it migrates. */
module.exports = { LIGHT: DARKONLY, DARK: DARKONLY, DARKONLY, TYPE, GOOGLE_FONTS,
  SCALE, MEASURE, SHADOW, RHYTHM, SPACE, SHAPE, MOTION, FRONTIER, VENDORED,
  FIGURE_TOKENS, CHART, rootCss, fontBlock, instrumentsCss };
