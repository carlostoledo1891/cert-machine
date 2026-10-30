/* inks.js — the screen's literal inks, re-pointed at the tokens, once.
   playground/design/ · cert-machine · 2026-10-30

   WHY. The lifted plates (plates/plates.js, affect, answer-shape, exact-geometry page.js) draw with the dark palette's
   VALUES written into their markup and their CSS — rgba(246,246,248,a) strokes, #f6f6f8 fills, a #0a0a0c hollow point
   — which no token can re-point, so the light theme could not reach them and their pages stayed dark (design/tokens.js
   DARK_ONLY_PAGES). Those files are crossed byte for byte (PROVENANCE.json, playground/pins.js), so they are not edited:
   each wrapper hands its finished markup and CSS through tokenInks() below, the operator's ruling of 2026-10-30
   ("redraw in tokens").

   EXACT IN THE DARK. Every literal maps to the token that holds that very value in design/tokens.js's palette, read
   from it here and checked, so the dark render does not move by a pixel: #f6f6f8 is var(--ink), and an alpha on the
   white ink, rgba(246,246,248,a), is color-mix(in srgb,var(--ink) a·100%,transparent), which in sRGB with
   premultiplied alpha is exactly (246,246,248,a). In the light theme the same expressions read the print register's
   ink (#000) at the same alpha: ink on paper, darker = stronger. No colour is added.

   One table, so the next lifted page with the same literals takes the same tokens: a rule defined twice diverges. A
   dark-palette literal this table does not know is a refusal, not a silent pass (assertNoLiterals). */
'use strict';
const path = require('path');
const T = require(path.join(__dirname, '..', '..', 'design', 'tokens.js'));

/* literal -> the token whose dark value it is. Text greys keep their text grades (ink-3, ink-4), never a chart grade,
   because in light a caption is text (design/tokens.js LIGHT_THEME's own note). */
const HEX = { '#f6f6f8': '--ink', '#c9c9d2': '--ink-2', '#9a9aa6': '--ink-3', '#6e6e7a': '--ink-4', '#4a4a55': '--ink-5', '#0a0a0c': '--paper' };
for (const [hex, tok] of Object.entries(HEX)) {
  if (String(T.DARKONLY[tok]).toLowerCase() !== hex) throw new Error('inks: ' + tok + ' is ' + T.DARKONLY[tok] + ' in the palette, not ' + hex + '; re-read design/tokens.js');
}
const WHITE = T.DARKONLY['--ink'].toLowerCase();
const [WR, WG, WB] = [1, 3, 5].map((i) => parseInt(WHITE.slice(i, i + 2), 16));
/* rgba(246,246,248,a), any spacing, any float spelling of a */
const RGBA_WHITE = new RegExp('rgba\\(\\s*' + WR + '\\s*,\\s*' + WG + '\\s*,\\s*' + WB + '\\s*,\\s*([0-9]*\\.?[0-9]+(?:e-?[0-9]+)?)\\s*\\)', 'gi');
const HEX_RE = new RegExp('(' + Object.keys(HEX).join('|') + ')(?![0-9a-f])', 'gi');

/* the percentage, written short and exact: a = 0.10500000000000001 (a float sum in the lifted code) is 10.5% to the
   precision Chrome keeps for an alpha; 12 significant digits drop only the float noise */
const pct = (a) => String(Number((Number(a) * 100).toPrecision(12)));

function tokenInks(s) {
  return String(s)
    .replace(RGBA_WHITE, (_, a) => 'color-mix(in srgb,var(--ink) ' + pct(a) + '%,transparent)')
    .replace(HEX_RE, (h) => 'var(' + HEX[h.toLowerCase()] + ')');
}

/* refuse a page that still carries a dark-palette literal on its drawing: the witness is one red in both themes and is
   not a screen ink, so it is never counted */
function assertNoLiterals(s, what) {
  const lits = new Set(Object.entries(T.DARKONLY).filter(([k, v]) => k !== '--witness' && /^#[0-9a-f]{6}$/i.test(v)).map(([, v]) => v.toLowerCase()));
  const found = (String(s).match(/#[0-9a-f]{6}(?![0-9a-f])|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi) || []).filter((x) => {
    if (x[0] === '#') return lits.has(x.toLowerCase());
    const [r, g, b] = x.match(/\d+/g).map(Number);
    const h = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
    return lits.has(h);
  });
  if (found.length) throw new Error('inks: ' + what + ' still draws ' + found.length + ' dark-palette literal(s) the light theme cannot reach: ' + [...new Set(found)].slice(0, 6).join(' '));
  return s;
}

module.exports = { tokenInks, assertNoLiterals, HEX };
