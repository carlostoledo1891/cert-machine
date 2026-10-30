/* figures.js — the Eleições 2026 page's own figures, the ones design/charts.js has no form for. Pure functions: numbers
   in, SVG out, every colour a token from design/tokens.js FIGURE_TOKENS and every mark carrying a word beside it (colour is
   never the only channel). These figures are monochrome on purpose, and since 2026-10-28 so is the whole page: the party
   tokens (build.js, --el-*) are the grammar's greys, the finalists two categorical greys beside their names and the maps
   one ordered grey scale of Lula's share (design/WARRANT.md v2.2; the operator's ruling).

     electorate(r1, r2)      the whole electorate of each round as one bar: Lula, Flávio, other candidates, blank and null,
                             abstention, as shares of the voters registered in the sections that functioned
     scale({...})            area-true squares nested at one corner: what would reverse the result against what was cast
                             after 17:00, so a reader sees the ratio instead of reading it
     tilemap(perUf)          Brazil as a tile grid: each state's second-round share for Lula between the two finalists as a
                             filled bar against the 50% line, with the swing from round 1 in words
                                                                                                                      MIT */
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', '..', 'design', 'components.js'));
const WR = require(path.join(__dirname, '..', '..', 'playground', 'warrant.js'));
const esc = C.esc, escAttr = C.escAttr;
const nBR = (x) => Number(x).toLocaleString('en-US');   /* the name is history: English formats since 2026-10-30 */
const pc = (x, d = 1) => (100 * x).toFixed(d);
const hit = (label, value) => ' data-cm="' + escAttr(label) + '" data-cmv="' + escAttr(value) + '" tabindex="0"';
const open = (w, h, alt) => '  <svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(alt) + '">';
const text = (x, y, s, cls, anchor) => '    <text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '')
  + ' class="' + cls + '">' + esc(s) + '</text>';

const HATCH = '    <defs><pattern id="el-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
  + '<line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-5)" stroke-width="1.5"/></pattern></defs>';

/* ---- the electorate, both rounds ------------------------------------------------------------------------------ */
function electorate(r1, r2) {
  const W = 900, L = 120, R = 24, BW = W - L - R, BH = 34;
  const parts = [
    { k: 'Lula', fill: 'var(--el-lula)' },
    { k: 'Flávio Bolsonaro', fill: 'var(--el-flavio)' },
    { k: 'other candidates', fill: 'var(--c-s2)' },
    { k: 'blank and null', fill: 'var(--c-s1)' },
    { k: 'abstention', fill: 'url(#el-hatch)', stroke: 'var(--ink-5)' }
  ];
  const rows = [{ t: 'round 1', y: 46, v: r1 }, { t: 'round 2', y: 150, v: r2 }];
  const out = [open(W, 268, 'The whole electorate in each round: votes for Lula, for Flávio Bolsonaro, for other candidates, blank and null, and abstention'), HATCH];
  for (const r of rows) {
    const tot = r.v.reduce((a, b) => a + b, 0);
    out.push(text(L - 14, r.y + BH / 2 + 5, r.t, 't-lab', 'end'));
    let x = L;
    r.v.forEach((v, i) => {
      const w = BW * v / tot;
      if (w <= 0) return;
      const p = parts[i];
      out.push('    <rect x="' + x.toFixed(1) + '" y="' + r.y + '" width="' + Math.max(1, w - 2).toFixed(1) + '" height="' + BH + '" rx="2" fill="' + p.fill + '"'
        + (p.stroke ? ' stroke="' + p.stroke + '" stroke-width="1"' : '') + hit(r.t + ' · ' + p.k, nBR(v) + ' (' + pc(v / tot) + '% of the electorate)') + '/>');
      if (w > 78) {
        out.push(text(x + 2, r.y - 22, p.k, 't-note', 'start'));
        out.push(text(x + 2, r.y - 7, pc(v / tot) + '%', 't-lab', 'start'));
      } else if (w > 26) {
        out.push(text(x + w / 2, r.y + BH + 16, pc(v / tot, 0) + '%', 't-note', 'middle'));
      }
      x += w;
    });
  }
  /* the legend, every part named */
  let lx = L;
  for (const p of parts) {
    out.push('    <rect x="' + lx + '" y="236" width="12" height="12" rx="2" fill="' + p.fill + '"' + (p.stroke ? ' stroke="' + p.stroke + '" stroke-width="1"' : '') + '/>');
    out.push(text(lx + 18, 246, p.k, 't-note', 'start'));
    lx += 30 + p.k.length * 6.6;
  }
  out.push('  </svg>');
  return out.join('\n');
}

/* ---- the scale of the extension ----------------------------------------------------------------------------------- */
function scale(items) {
  /* items: [{k, v, fill, emph}] largest first; side ∝ √v, nested at the bottom-left corner of the largest */
  const W = 900, H = 330, X0 = 70, Y1 = 300, S = 270;
  const vmax = items[0].v;
  const out = [open(W, H, 'Squares of proportional area: the votes that would reverse the result against the votes cast after 17:00')];
  items.forEach((it) => {
    const s = Math.max(2.5, S * Math.sqrt(it.v / vmax));
    out.push('    <rect x="' + X0 + '" y="' + (Y1 - s).toFixed(1) + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" fill="' + it.fill + '"'
      + (it.stroke ? ' stroke="' + it.stroke + '" stroke-width="1.5"' : '') + hit(it.k, nBR(it.v) + ' votes') + '/>');
  });
  /* labels to the right, each joined to its square's top-right corner by a hairline */
  const LX = X0 + S + 70;
  items.forEach((it, i) => {
    const s = Math.max(2.5, S * Math.sqrt(it.v / vmax));
    const cy = Y1 - s, cx = X0 + s;
    const ly = 46 + i * 66;
    out.push('    <path d="M' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' L' + (LX - 12) + ' ' + (ly - 5) + '" stroke="var(--rule-strong)" stroke-width="1" fill="none"/>');
    out.push('    <circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.5" fill="var(--ink-3)"/>');
    out.push(text(LX, ly, nBR(it.v), it.emph ? 't-big' : 't-lab', 'start'));
    out.push(text(LX, ly + 18, it.k, 't-note', 'start'));
  });
  out.push('  </svg>');
  return out.join('\n');
}

/* ---- the tile map ------------------------------------------------------------------------------------------------- */
const GRID = { RR: [2, 0], AP: [4, 0], AM: [1, 1], PA: [3, 1], MA: [4, 1], CE: [5, 1], RN: [6, 1],
  AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PE: [5, 2], PB: [6, 2],
  MS: [2, 3], GO: [3, 3], DF: [4, 3], BA: [5, 3], AL: [6, 3],
  SP: [3, 4], MG: [4, 4], ES: [5, 4], SE: [6, 4], PR: [2, 5], RJ: [4, 5], SC: [2, 6], RS: [2, 7] };

function tilemap(perUf) {
  const T = 92, G = 6, OX = 12, OY = 16;
  const W = OX + 7 * (T + G) + 20, H = OY + 8 * (T + G) + 46;
  const out = [open(W, H, 'Tile map: in each state, Lula’s share between the two finalists in round 2 and its change since round 1')];
  for (const [uf, [c, r]] of Object.entries(GRID)) {
    const u = perUf[uf];
    if (!u) continue;
    const s1 = u.r1_lula / (u.r1_lula + u.r1_flavio), s2 = u.lula / (u.lula + u.flavio);
    const x = OX + c * (T + G), y = OY + r * (T + G);
    out.push('    <rect x="' + x + '" y="' + y + '" width="' + T + '" height="' + T + '" rx="4" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1"'
      + hit(uf, 'Lula ' + pc(s2) + '% · Flávio ' + pc(1 - s2) + '% · Lula’s change ' + (s2 >= s1 ? '+' : '') + pc(s2 - s1) + ' pp') + '/>');
    out.push(text(x + 8, y + 20, uf, 't-lab', 'start'));
    out.push(text(x + T - 8, y + 20, pc(s2) + '%', 't-ax', 'end'));
    /* the share as a horizontal bar inside the tile, with the 50% line */
    const bx = x + 8, bw = T - 16, by = y + 34;
    out.push('    <rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="10" rx="2" fill="var(--c-3)"/>');
    out.push('    <rect x="' + bx + '" y="' + by + '" width="' + (bw * s2).toFixed(1) + '" height="10" rx="2" fill="var(--c-2)"/>');
    out.push('    <line x1="' + (bx + bw / 2) + '" y1="' + (by - 4) + '" x2="' + (bx + bw / 2) + '" y2="' + (by + 14) + '" stroke="var(--ink)" stroke-width="1.5"/>');
    out.push(text(x + 8, y + 70, (s2 >= s1 ? '+' : '−') + pc(Math.abs(s2 - s1)) + ' pp', 't-lab', 'start'));
  }
  /* the key */
  const ky = OY + 8 * (T + G) + 14;
  out.push('    <rect x="' + OX + '" y="' + ky + '" width="60" height="10" rx="2" fill="var(--c-3)"/>');
  out.push('    <rect x="' + OX + '" y="' + ky + '" width="34" height="10" rx="2" fill="var(--c-2)"/>');
  out.push('    <line x1="' + (OX + 30) + '" y1="' + (ky - 4) + '" x2="' + (OX + 30) + '" y2="' + (ky + 14) + '" stroke="var(--ink)" stroke-width="1.5"/>');
  out.push(text(OX + 70, ky + 10, 'light: Lula · dark: Flávio · line: 50% · below: Lula’s change since round 1', 't-note', 'start'));
  out.push('  </svg>');
  return out.join('\n');
}

/* ---- the headline: the scoreboard every election night shows ------------------------------------------------------- */
function scoreboard({ lula, flavio, margin }) {
  const W = 900, H = 190, X0 = 10, BW = W - 20, Y = 100, BH = 40;
  const tot = lula + flavio, xl = BW * lula / tot;
  const out = [open(W, H, 'Round 2 scoreboard: Lula ' + pc(lula / tot, 2) + '% and Flávio Bolsonaro ' + pc(flavio / tot, 2) + '% of the valid votes')];
  out.push(text(X0, 18, 'LULA', 't-kick', 'start'));
  out.push(text(X0, 84, pc(lula / tot, 2) + '%', 't-score', 'start'));
  out.push(text(X0 + BW, 18, 'FLÁVIO BOLSONARO', 't-kick', 'end'));
  out.push(text(X0 + BW, 84, pc(flavio / tot, 2) + '%', 't-score', 'end'));
  out.push('    <rect x="' + X0 + '" y="' + Y + '" width="' + (xl - 1).toFixed(1) + '" height="' + BH + '" fill="var(--el-lula)"' + hit('Lula', nBR(lula) + ' votes') + '/>');
  out.push('    <rect x="' + (X0 + xl + 1).toFixed(1) + '" y="' + Y + '" width="' + (BW - xl - 1).toFixed(1) + '" height="' + BH + '" fill="var(--el-flavio)"' + hit('Flávio Bolsonaro', nBR(flavio) + ' votes') + '/>');
  out.push('    <line x1="' + (X0 + BW / 2) + '" y1="' + (Y - 8) + '" x2="' + (X0 + BW / 2) + '" y2="' + (Y + BH + 8) + '" stroke="var(--ink)" stroke-width="2"/>');
  out.push(text(X0, Y + BH + 24, nBR(lula) + ' votes', 't-lab', 'start'));
  out.push(text(X0 + BW, Y + BH + 24, nBR(flavio) + ' votes', 't-lab', 'end'));
  out.push(text(X0 + BW / 2, Y + BH + 24, '50% · a difference of ' + nBR(margin) + ' votes', 't-note', 'middle'));
  out.push('  </svg>');
  return out.join('\n');
}

/* ---- where the new votes came from, as a balance: the pool that opened between the rounds, and who took it -------------- */
function balance({ others, blankDrop, abstDrop, lulaGain, flavioGain }) {
  const W = 900, L = 170, BW = W - L - 30, BH = 34;
  const pool = others + blankDrop + abstDrop;
  const out = [open(W, 206, 'Where the finalists’ new votes in round 2 came from, and to whom they went')];
  const row = (y, title, parts) => {
    out.push(text(L - 14, y + BH / 2 + 5, title, 't-lab', 'end'));
    let x = L;
    for (const p of parts) {
      const w = BW * p.v / pool;
      out.push('    <rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + Math.max(1, w - 2).toFixed(1) + '" height="' + BH + '" rx="2" fill="' + p.fill + '"'
        + (p.stroke ? ' stroke="' + p.stroke + '" stroke-width="1"' : '') + hit(title + ' · ' + p.k, nBR(p.v) + ' votes') + '/>');
      /* narrow segments: one label below the bar, one hung from the bar's right end, so neighbours never collide */
      out.push(p.at === 'below' ? text(x + 2, y + BH + 16, p.k + ' · ' + nBR(p.v), 't-note', 'start')
        : p.at === 'end' ? text(x + w - 2, y - 7, p.k + ' · ' + nBR(p.v), 't-note', 'end') : text(x + 2, y - 7, p.k + ' · ' + nBR(p.v), 't-note', 'start'));
      x += w;
    }
  };
  row(36, 'available', [{ k: 'had gone to other candidates', v: others, fill: 'var(--c-s3)' }, { k: 'fewer blank and null', v: blankDrop, fill: 'var(--c-s2)', at: 'below' },
    { k: 'less abstention', v: abstDrop, fill: 'url(#el-hatch)', stroke: 'var(--ink-5)', at: 'end' }]);
  row(144, 'gained', [{ k: 'Lula', v: lulaGain, fill: 'var(--el-lula)' }, { k: 'Flávio', v: flavioGain, fill: 'var(--el-flavio)' }]);
  out.splice(1, 0, HATCH);
  out.push('  </svg>');
  return out.join('\n');
}

/* ---- labelled scatter for 28 named units (the mean-field lens) ---------------------------------------------------------- */
function labelled({ pts, x0, x1, y0, y1, xTicks, yTicks, xLabel, yLabel, alt, fit }) {
  const W = 900, H = 420, L = 74, R = 24, T = 18, Bm = 58;
  const px = (x) => L + (x - x0) / (x1 - x0) * (W - L - R), py = (y) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - Bm);
  const out = [open(W, H, alt)];
  for (const t of yTicks) { out.push('    <line x1="' + L + '" y1="' + py(t.v).toFixed(1) + '" x2="' + (W - R) + '" y2="' + py(t.v).toFixed(1) + '" stroke="var(--c-grid)" stroke-width="1"/>'); out.push(text(L - 9, py(t.v) + 4, t.t, 't-ax', 'end')); }
  for (const t of xTicks) out.push(text(px(t.v), H - Bm + 20, t.t, 't-ax', 'middle'));
  out.push('    <line x1="' + L + '" y1="' + (H - Bm) + '" x2="' + (W - R) + '" y2="' + (H - Bm) + '" stroke="var(--c-axis)" stroke-width="1"/>');
  /* a least-squares fit in floating point: computed, so its stroke is warrant.js's, never a dasharray written here */
  if (fit) out.push('    <path d="M' + px(fit[0][0]).toFixed(1) + ' ' + py(fit[0][1]).toFixed(1) + ' L' + px(fit[1][0]).toFixed(1) + ' ' + py(fit[1][1]).toFixed(1) + '" ' + WR.attrs(WR.COMPUTED, { width: 1.5 }) + '/>');
  /* a label goes left of its dot when another dot sits just to its right on the same line */
  const crowded = (p) => pts.some((q) => q !== p && Math.abs(py(q.y) - py(p.y)) < 12 && px(q.x) - px(p.x) > 0 && px(q.x) - px(p.x) < 44);
  for (const p of pts) {
    out.push('    <circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="5" fill="' + p.fill + '" stroke="var(--sunk)" stroke-width="1.5"' + hit(p.k, p.v) + '/>');
    out.push(crowded(p) ? text(px(p.x) - 8, py(p.y) + 4, p.label, 't-note', 'end') : text(px(p.x) + 8, py(p.y) + 4, p.label, 't-note', 'start'));
  }
  out.push(text(L + (W - L - R) / 2, H - 14, xLabel, 't-note', 'middle'));
  out.push('    <text x="14" y="' + (T + (H - T - Bm) / 2) + '" class="t-note" transform="rotate(-90 14 ' + (T + (H - T - Bm) / 2) + ')" text-anchor="middle">' + esc(yLabel) + '</text>');
  out.push('  </svg>');
  return out.join('\n');
}

module.exports = { electorate, scale, tilemap, scoreboard, balance, labelled };
