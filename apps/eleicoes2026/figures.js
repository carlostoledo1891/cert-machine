/* figures.js — the Eleições 2026 page's own figures, the ones design/charts.js has no form for. Pure functions: numbers
   in, SVG out, every colour a token from design/tokens.js FIGURE_TOKENS and every mark carrying a word beside it (colour is
   never the only channel). The house is monochrome on purpose here: no party colour appears anywhere on the page.

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
const esc = C.esc, escAttr = C.escAttr;
const nBR = (x) => Number(x).toLocaleString('pt-BR');
const pc = (x, d = 1) => (100 * x).toFixed(d).replace('.', ',');
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
    { k: 'Lula', fill: 'var(--c-2)' },
    { k: 'Flávio Bolsonaro', fill: 'var(--c-3)' },
    { k: 'outros candidatos', fill: 'var(--c-s2)' },
    { k: 'brancos e nulos', fill: 'var(--c-s1)' },
    { k: 'abstenção', fill: 'url(#el-hatch)', stroke: 'var(--ink-5)' }
  ];
  const rows = [{ t: '1º turno', y: 46, v: r1 }, { t: '2º turno', y: 150, v: r2 }];
  const out = [open(W, 268, 'O eleitorado inteiro em cada turno: votos de Lula, de Flávio Bolsonaro, de outros candidatos, brancos e nulos, e abstenção'), HATCH];
  for (const r of rows) {
    const tot = r.v.reduce((a, b) => a + b, 0);
    out.push(text(L - 14, r.y + BH / 2 + 5, r.t, 't-lab', 'end'));
    let x = L;
    r.v.forEach((v, i) => {
      const w = BW * v / tot;
      if (w <= 0) return;
      const p = parts[i];
      out.push('    <rect x="' + x.toFixed(1) + '" y="' + r.y + '" width="' + Math.max(1, w - 2).toFixed(1) + '" height="' + BH + '" rx="2" fill="' + p.fill + '"'
        + (p.stroke ? ' stroke="' + p.stroke + '" stroke-width="1"' : '') + hit(r.t + ' · ' + p.k, nBR(v) + ' (' + pc(v / tot) + '% do eleitorado)') + '/>');
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
  const out = [open(W, H, 'Quadrados de área proporcional: votos que inverteriam o resultado contra votos dados depois das 17h')];
  items.forEach((it) => {
    const s = Math.max(2.5, S * Math.sqrt(it.v / vmax));
    out.push('    <rect x="' + X0 + '" y="' + (Y1 - s).toFixed(1) + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" fill="' + it.fill + '"'
      + (it.stroke ? ' stroke="' + it.stroke + '" stroke-width="1.5"' : '') + hit(it.k, nBR(it.v) + ' votos') + '/>');
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
  const out = [open(W, H, 'Mapa em blocos: em cada estado, a parcela de Lula entre os dois finalistas no 2º turno e a variação desde o 1º')];
  for (const [uf, [c, r]] of Object.entries(GRID)) {
    const u = perUf[uf];
    if (!u) continue;
    const s1 = u.r1_lula / (u.r1_lula + u.r1_flavio), s2 = u.lula / (u.lula + u.flavio);
    const x = OX + c * (T + G), y = OY + r * (T + G);
    out.push('    <rect x="' + x + '" y="' + y + '" width="' + T + '" height="' + T + '" rx="4" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1"'
      + hit(uf, 'Lula ' + pc(s2) + '% · Flávio ' + pc(1 - s2) + '% · variação de Lula ' + (s2 >= s1 ? '+' : '') + pc(s2 - s1) + ' p.p.') + '/>');
    out.push(text(x + 8, y + 20, uf, 't-lab', 'start'));
    out.push(text(x + T - 8, y + 20, pc(s2) + '%', 't-ax', 'end'));
    /* the share as a horizontal bar inside the tile, with the 50% line */
    const bx = x + 8, bw = T - 16, by = y + 34;
    out.push('    <rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="10" rx="2" fill="var(--c-3)"/>');
    out.push('    <rect x="' + bx + '" y="' + by + '" width="' + (bw * s2).toFixed(1) + '" height="10" rx="2" fill="var(--c-2)"/>');
    out.push('    <line x1="' + (bx + bw / 2) + '" y1="' + (by - 4) + '" x2="' + (bx + bw / 2) + '" y2="' + (by + 14) + '" stroke="var(--ink)" stroke-width="1.5"/>');
    out.push(text(x + 8, y + 70, (s2 >= s1 ? '+' : '−') + pc(Math.abs(s2 - s1)) + ' p.p.', 't-lab', 'start'));
  }
  /* the key */
  const ky = OY + 8 * (T + G) + 14;
  out.push('    <rect x="' + OX + '" y="' + ky + '" width="60" height="10" rx="2" fill="var(--c-3)"/>');
  out.push('    <rect x="' + OX + '" y="' + ky + '" width="34" height="10" rx="2" fill="var(--c-2)"/>');
  out.push('    <line x1="' + (OX + 30) + '" y1="' + (ky - 4) + '" x2="' + (OX + 30) + '" y2="' + (ky + 14) + '" stroke="var(--ink)" stroke-width="1.5"/>');
  out.push(text(OX + 70, ky + 10, 'claro: Lula · escuro: Flávio · traço: 50% · abaixo: variação de Lula desde o 1º turno', 't-note', 'start'));
  out.push('  </svg>');
  return out.join('\n');
}

module.exports = { electorate, scale, tilemap };
