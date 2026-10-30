/* tokens.js — THE PRINT REGISTER: WARRANT's roles in ink on white paper. A PROPOSAL (2026-10-29), not applied.
   design/print/ · cert-machine

   WHY. UFSC LabECO writes reports for Petrobras as PDFs and Word documents read on white paper, and printed on mono
   laser printers. WARRANT was dark-only on the site, so it could not reach those documents. This file is the same
   grammar with the ink values a white page needs. Since 2026-10-30 the site's light theme is made of these values
   (design/tokens.js LIGHT_THEME reads them from here; the operator's word), and nothing else on the site reads it.

   WHAT CHANGES ON PAPER AND WHAT DOES NOT.
     · The stroke grammar does not change. Every dash pattern below is READ from design/grammar.js and the role each
       standing takes is the one playground/warrant.js css() gives it on screen (.w-decided → --ink, .w-computed →
       --ink-2, .w-chosen → --ink-3: tone monotone in standing, D9 of 2026-10-29); design/print/validate.js checks
       both, so this file cannot drift from them.
     · The anchor flips. On a dark ground the strongest mark is the brightest; on paper it is the darkest. So --ink is
       black (#000000: the one value a mono laser lays as solid toner, never a halftone screen), and each weaker
       standing's tone is a step lighter, exactly as each is a step dimmer on screen. The tone only supports; the dash
       carries the standing (WARRANT rule 4 of v2.2: colour never carries standing).
     · The order ramp flips with it: more is darker on paper. It is neutral, so a greyscale copy keeps every step.
     · The witness keeps the one red, read from design/tokens.js and never retyped here (WARRANT v2.2 rule 2: one
       colour, one meaning, in every project). On white it is a MARK (3.72:1), not text: it only ever paints the × glyph.
     · One identity hue is PROPOSED, a print blue, because paper figures compare series and opacity (the screen's
       identity ladder) turns into a lighter colour on paper that no validator has seen. It needs the operator's
       approval (v2.2 rule 7); without it identity is ink, --ink-3 and --ink-2 with a marker each, as on screen.
     · No yellow, no orange (v2.2 rule 6), and no new meaning: every token below maps a role WARRANT already has.

   Every number this file's values are judged by is computed by design/print/validate.js with design/colour.js, the
   code design/battery.js runs; the report is design/print/REPORT.md. MIT licensed. Part of cert-machine. */
'use strict';

const path = require('path');
const T = require(path.join(__dirname, '..', 'tokens.js'));
const G = require(path.join(__dirname, '..', 'grammar.js'));
const CL = require(path.join(__dirname, '..', 'colour.js'));

/* the one red, read from the screen register: a print copy of the value would be the second red the 2026-10-29
   ruling removed */
const WITNESS = T.DARKONLY['--witness'];

/* --------------------------------------------------------------- the register --
   kind: ground · ink · structure · witness · identity · order (v2.2's four kinds of colour plus the inks and the
   ground every figure has). grade: what the value must clear on paper: text 4.5:1, mark 3:1, hairline (a grid is
   never a mark). screen: the token whose role this one takes on the site. status: neutral (a grey for a role WARRANT
   already has: no hue, so no new colour, approved with the register as a whole), registered (the value WARRANT v2.2
   already registers, unchanged), or proposed (a colour WARRANT has not registered: it needs its own approval). */
const REGISTER = [
  { name: '--paper', hex: '#ffffff', kind: 'ground', grade: 'ground', screen: '--paper', status: 'neutral',
    role: 'the page and every figure ground: white paper' },
  { name: '--ink', hex: '#000000', kind: 'ink', grade: 'text', screen: '--ink', status: 'neutral',
    role: 'text and values; DECIDED strokes (solid); the first series compared (identity 1, ●)' },
  { name: '--ink-2', hex: '#262626', kind: 'ink', grade: 'text', screen: '--ink-2', status: 'neutral',
    role: 'COMPUTED strokes (dashed 5 4); a second text voice' },
  { name: '--ink-3', hex: '#4d4d4d', kind: 'ink', grade: 'text', screen: '--ink-3', status: 'neutral',
    role: 'CHOSEN strokes (dotted 1 5, round caps); axes, ticks, axis labels, captions, glosses; the third series (identity 3, ▲)' },
  { name: '--guide', hex: '#8a8a8a', kind: 'structure', grade: 'mark', screen: '--ink-5', status: 'neutral',
    role: 'the guide pattern (2 3): rulers, reference ghosts; the void\'s hatch and edge. Never text, never a datum' },
  { name: '--grid', hex: '#dcdcdc', kind: 'structure', grade: 'hairline', screen: '--c-grid', status: 'neutral',
    role: 'hairline grid and table rules, drawn under everything; never a mark' },
  { name: '--witness', hex: WITNESS, kind: 'witness', grade: 'mark', screen: '--witness', status: 'registered', shape: '×',
    role: 'an exhibited counterexample, only ever on the × glyph beside words (WARRANT rule 5); the same red as the site' },
  { name: '--id-2', hex: '#3368c1', kind: 'identity', grade: 'text', screen: null, status: 'proposed', shape: '■',
    role: 'the second series compared in one figure, always with its own marker (■) and a word; never standing, never a verdict' },
  /* the order ramp, light → dark with magnitude; neutral, so greyscale keeps it (v2.2 rule 4, order) */
  { name: '--o-1', hex: '#e9e9e9', kind: 'order', grade: 'field', screen: '--c-s1', status: 'neutral', role: 'order ramp, step 1 (least)' },
  { name: '--o-2', hex: '#d5d5d5', kind: 'order', grade: 'field', screen: '--c-s2', status: 'neutral', role: 'order ramp, step 2' },
  { name: '--o-3', hex: '#c1c1c1', kind: 'order', grade: 'field', screen: '--c-s3', status: 'neutral', role: 'order ramp, step 3' },
  { name: '--o-4', hex: '#aeaeae', kind: 'order', grade: 'field', screen: '--c-s4', status: 'neutral', role: 'order ramp, step 4' },
  { name: '--o-5', hex: '#9b9b9b', kind: 'order', grade: 'field', screen: '--c-s5', status: 'neutral', role: 'order ramp, step 5 (most)' },
];
const BY = Object.fromEntries(REGISTER.map((t) => [t.name, t]));
const hex = (name) => { if (!BY[name]) throw new Error('print register: no token ' + name); return BY[name].hex; };
const RAMP = REGISTER.filter((t) => t.kind === 'order').map((t) => t.name);

/* ------------------------------------------------------------ the standings --
   The class each standing wears is the screen's (warrant.js stroke()); the token each class strokes in is the
   screen's (warrant.js css()); the dash is grammar.js's, chosen by its own width rule. validate.js re-reads all three
   and refuses a difference. REFUSED has no stroke: the void is a hatch in --guide with an edge in --guide, and ∅. */
const STANDINGS = [
  { standing: 'DECIDED', cls: 'w-decided', token: '--ink', dash: (w) => G.SOLID, cap: null },
  { standing: 'COMPUTED', cls: 'w-computed', token: '--ink-2', dash: (w) => G.claim(w), cap: null },
  { standing: 'CHOSEN', cls: 'w-chosen', token: '--ink-3', dash: (w) => G.pick(w), cap: 'round' },
  { standing: 'REFUSED', cls: 'w-void', token: null, dash: null, cap: null, void: { hatch: '--guide', edge: '--guide', glyph: '∅' } },
];
/* the guide is not a standing ("says nothing") and has its own pattern */
const GUIDE = { token: '--guide', dash: G.GUIDE };

/* ------------------------------------------------------------- identity ------
   At most three series compared in one figure (v2.2 rule 4), each with its own marker so greyscale loses nothing.
   On screen identity is weight and opacity (grammar.js IDENTITY). On paper opacity becomes a lighter colour that no
   validator has seen, and a thinner line flips grammar.js to its small dash variant, so the print register carries
   identity in a validated colour plus a marker, at one weight. If --id-2 is not approved, the second series takes
   --ink-2 and keeps its square. */
const IDENTITY = [
  { token: '--ink', marker: 'o', glyph: '●' },
  { token: '--id-2', marker: 's', glyph: '■', fallback: '--ink-2' },
  { token: '--ink-3', marker: '^', glyph: '▲' },
];
/* the one stroke weight of a print figure, in points: at 1.5 grammar.js keeps the full patterns (5 4, 1 5); a line
   drawn thinner takes the small ones by grammar.js's own rule, never by scaling */
const LINE_PT = G.SMALL_BELOW;

/* ------------------------------------------------------------ greyscale -------
   What a mono laser (or "print in greyscale") keeps of a colour is its lightness. Two conversions are in use, and the
   validator runs both and keeps the worse: CIE relative luminance Y (what a colour-managed conversion keeps, and what
   WCAG contrast is defined on), and Rec. 601 luma on the encoded values (what most drivers and office suites do). */
const enc = (y) => { const v = y <= 0.0031308 ? 12.92 * y : 1.055 * Math.pow(y, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255); };
const greyHex = (v) => '#' + v.toString(16).padStart(2, '0').repeat(3);
function monoY(h) { return greyHex(enc(CL.relLum(h))); }
function mono601(h) { const [r, g, b] = CL.hex2srgb(h); return greyHex(Math.round(Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b)) * 255)); }
/* the specimen's greyscale sheet prints with the CIE-Y conversion; the validator checks both */
const mono = monoY;

module.exports = { REGISTER, BY, hex, RAMP, STANDINGS, GUIDE, IDENTITY, LINE_PT, WITNESS, mono, monoY, mono601 };
