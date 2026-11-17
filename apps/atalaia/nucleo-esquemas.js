/* nucleo-esquemas.js — the schemas of the Atalaia Núcleo page (D36), redrawn in the house grammar from the brainstorm
   draft: the core inequality (R1), the architecture, the machine, the terrain-fix chart and the 12-month plan. Each
   returns a wide drawing and a narrow one (a phone gets its own layout, not a shrunken desk one). Only class names,
   never a colour: the page's stylesheet maps them to the template's tokens, so both themes hold. Computed curves are
   dashed; proposed bars are dashed; verdicts carry a word. apps/atalaia · cert-machine · 2026-11-16              MIT */
'use strict';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* each drawing gets its own arrowhead id: the desk and phone twins both sit in the page, and a marker defined inside
   the hidden twin does not paint in the visible one */
let SEQ = 0;
const svg = (w, h, aria, body) => { const id = 'nu-ah-' + (++SEQ); return '<svg class="nu-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(aria) + '">'
  + '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="nu-ahp" d="M0 0L10 5L0 10z"/></marker></defs>' + body.split('url(#nu-ah)').join('url(#' + id + ')') + '</svg>'; };
const T = (x, y, t, cls, anchor) => '<text class="' + cls + '" x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>';
/* a box: a title and up to two small lines under it */
function box(x, y, w, h, title, sub, cls) {
  const lines = [].concat(sub || []);
  const cy = y + h / 2 - (lines.length * 9);
  return '<rect class="nu-box' + (cls ? ' ' + cls : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7"/>'
    + T(x + w / 2, cy + 5, title, 'nu-bt', 'middle') + lines.map((l, i) => T(x + w / 2, cy + 24 + 17 * i, l, 'nu-bs', 'middle')).join('');
}
const arr = (x1, y1, x2, y2, cls) => '<line class="nu-arr' + (cls ? ' ' + cls : '') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" marker-end="url(#nu-ah)"/>';
const path = (d, cls) => '<path class="' + cls + '" d="' + d + '"/>';

/* ---- 1 · the core inequality: the geometry of R1, in Portuguese or (lang 'en', the landing's English mirror) English */
const R1_EN = { erro: 'undetected error', leg: ['the true position: somewhere in Rₜ', 'a fix the gate accepted', 'the region computed without GNSS', 'accepted only in here'],
  aria: 'The geometry of R1: the true position x lies in Rₜ; the accepted fix g lies within ε of Rₜ; so the undetected error, from x to g, is at most the diameter of Rₜ plus ε' };
function desigualdade(narrow, lang) {
  const EN = lang === 'en';
  /* the wide drawing is 812 across: at 780 the first legend line ended at 797 and was cut (measured in Chrome, 2026-11-17) */
  const W = narrow ? 360 : 812, H = narrow ? 430 : 340;
  const cx = narrow ? 175 : 230, cy = narrow ? 130 : 145, rx = narrow ? 120 : 150, ry = narrow ? 78 : 92, e = narrow ? 22 : 28;
  const x = [cx - rx * 0.78, cy + ry * 0.25], g = [cx + rx + e * 0.92, cy - 14];
  let b = '<ellipse class="nu-eps" cx="' + cx + '" cy="' + cy + '" rx="' + (rx + e) + '" ry="' + (ry + e) + '"/>'
    + '<ellipse class="nu-reg" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>'
    + T(cx - 10, cy - ry + 30, 'Rₜ', 'nu-lb', 'middle') + T(cx + rx - 8, cy - ry - e + 6, 'Rₜ ⊕ ε', 'nu-bs', 'end')
    + '<line class="nu-err" x1="' + x[0] + '" y1="' + x[1] + '" x2="' + g[0] + '" y2="' + g[1] + '"/>'
    + '<circle class="nu-x" cx="' + x[0] + '" cy="' + x[1] + '" r="6"/><circle class="nu-g" cx="' + g[0] + '" cy="' + g[1] + '" r="6"/>'
    + T(x[0] - 10, x[1] + 22, 'xₜ', 'nu-lb', 'start') + T(g[0] + 10, g[1] - 10, 'gₜ', 'nu-lb', 'start')
    + T((x[0] + g[0]) / 2, (x[1] + g[1]) / 2 - 12, EN ? R1_EN.erro : 'erro não detectado', 'nu-bs', 'middle');
  const yd = cy + ry + e + 22;
  b += '<line class="nu-dim" x1="' + (cx - rx) + '" y1="' + yd + '" x2="' + (cx + rx) + '" y2="' + yd + '"/>'
    + '<line class="nu-dim" x1="' + (cx - rx) + '" y1="' + (yd - 6) + '" x2="' + (cx - rx) + '" y2="' + (yd + 6) + '"/><line class="nu-dim" x1="' + (cx + rx) + '" y1="' + (yd - 6) + '" x2="' + (cx + rx) + '" y2="' + (yd + 6) + '"/>'
    + T(cx, yd + 20, 'diam Rₜ', 'nu-bs', 'middle')
    + '<line class="nu-dim" x1="' + (cx + rx) + '" y1="' + yd + '" x2="' + (cx + rx + e) + '" y2="' + yd + '"/><line class="nu-dim" x1="' + (cx + rx + e) + '" y1="' + (yd - 6) + '" x2="' + (cx + rx + e) + '" y2="' + (yd + 6) + '"/>'
    + T(cx + rx + e / 2, yd + 20, 'ε', 'nu-bs', 'middle');
  const leg = [['xₜ', 'a posição verdadeira: em algum ponto de Rₜ'], ['gₜ', 'uma correção que o portão aceitou'], ['Rₜ', 'a região calculada sem GNSS'], ['Rₜ ⊕ ε', 'só se aceita aqui dentro']]
    .map((l, i) => EN ? [l[0], R1_EN.leg[i]] : l);
  const lx = narrow ? 20 : 470, ly = narrow ? 300 : 70;
  b += leg.map((l, i) => T(lx, ly + 28 * i, l[0], 'nu-lb', 'start') + T(lx + 58, ly + 28 * i, l[1], 'nu-bs', 'start')).join('');
  b += T(narrow ? 20 : 470, narrow ? 420 : 210, '|gₜ − xₜ| ≤ diam(Rₜ) + ε', 'nu-lb', 'start');
  return svg(W, H, EN ? R1_EN.aria : 'A geometria do R1: a posição verdadeira x está em Rₜ; a correção aceita g está a no máximo ε de Rₜ; então o erro não detectado, de x a g, é no máximo o diâmetro de Rₜ mais ε', b);
}

/* ---- 2 · the architecture */
function arquitetura(narrow) {
  const fontes = [['Inércia', 'tática ou MEMS · carrossel'], ['Relevo', 'radar · modelo de elevação'], ['Modelo do veículo', 'arrasto · rotação dos motores'], ['Imagem × mapa', 'admitida sob cobertura'], ['Relógio', 'holdover · tempo do OSNMA']];
  if (!narrow) {
    let b = T(20, 26, 'A BORDO · ATALAIA BORDO', 'nu-sec', 'start') + T(20, 452, 'DEPOIS DO VOO · PERÍCIA', 'nu-sec', 'start')
      + T(20, 52, 'FONTES SEM GNSS', 'nu-sec2', 'start');
    fontes.forEach((f, i) => { b += box(20, 62 + 62 * i, 210, 52, f[0], f[1]); b += arr(230, 88 + 62 * i, 300, 180 + (i - 2) * 6); });
    b += T(262, 60, 'limites', 'nu-bs', 'middle');
    b += box(300, 120, 230, 120, 'Região sem GNSS, Rₜ', ['estimador de conjunto (grupo de Lie)', 'símbolos, não caixas', 'arredondamento para fora'], 'nu-key');
    b += box(300, 300, 230, 64, 'Receptor GNSS', ['X20P · OSNMA · dados brutos']);
    b += '<line class="nu-forbid" x1="415" y1="300" x2="415" y2="244"/>' + T(424, 278, 'nunca alimenta Rₜ', 'nu-bs', 'start');
    b += '<line class="nu-forbid" x1="404" y1="262" x2="426" y2="282"/><line class="nu-forbid" x1="426" y1="262" x2="404" y2="282"/>';
    b += box(600, 200, 190, 70, 'Portão', ['gₜ ∈ Rₜ ⊕ ε ?'], 'nu-key');
    b += arr(530, 180, 600, 225) + T(570, 188, 'limite Rₜ', 'nu-bs', 'middle') + arr(530, 332, 600, 250) + T(568, 312, 'correção gₜ', 'nu-bs', 'middle');
    b += box(850, 120, 170, 62, 'Usa a correção', ['fundida, para a precisão']) + arr(790, 220, 850, 160) + T(818, 176, 'dentro', 'nu-bs', 'middle');
    b += box(850, 280, 170, 62, 'Alarme · troca', ['padrão ASTM F3269-21'], 'nu-key') + arr(790, 250, 850, 305) + T(818, 300, 'fora', 'nu-bs', 'middle');
    b += box(640, 362, 180, 54, 'Via ArduPilot', ['EKF3 → Rₜ · conduz']) + box(840, 362, 180, 54, 'Via DJI', ['paira · pousa · avisa']);
    b += arr(900, 342, 730, 362) + arr(935, 342, 930, 362);
    b += '<line class="nu-rule" x1="20" y1="436" x2="1020" y2="436"/>';
    b += box(20, 466, 280, 58, 'Registro lacrado', ['assinado · encadeado · carimbado']) + box(370, 466, 290, 58, 'Reprodução', ['EKF3 e portão, bit a bit']) + box(730, 466, 290, 58, 'Verificador de fora', ['recalcula → laudo'], 'nu-key');
    b += arr(300, 495, 370, 495) + arr(660, 495, 730, 495) + T(335, 485, 'os mesmos bytes', 'nu-bs', 'middle') + T(695, 485, 'decisões', 'nu-bs', 'middle');
    return svg(1040, 540, 'A arquitetura: cinco fontes sem GNSS alimentam a região Rₜ; o GNSS só vai ao portão, nunca a Rₜ; dentro, usa-se a correção; fora, alarme e troca, conduzindo pela região no ArduPilot ou pairando e pousando num DJI; depois do voo, o registro lacrado é reproduzido e recalculado por um verificador de fora', b);
  }
  let b = T(12, 22, 'A BORDO · ATALAIA BORDO', 'nu-sec', 'start') + T(12, 44, 'FONTES SEM GNSS', 'nu-sec2', 'start');
  fontes.forEach((f, i) => { b += box(12, 52 + 52 * i, 336, 44, f[0], f[1]); });
  b += arr(180, 312, 180, 336) + T(190, 328, 'limites', 'nu-bs', 'start');
  b += box(12, 336, 336, 92, 'Região sem GNSS, Rₜ', ['estimador de conjunto num grupo de Lie', 'símbolos, não caixas · para fora'], 'nu-key');
  b += box(12, 470, 160, 70, 'Receptor GNSS', ['X20P · OSNMA'])
    + T(186, 452, 'nunca alimenta Rₜ', 'nu-bs', 'start') + '<line class="nu-forbid" x1="92" y1="470" x2="92" y2="432"/><line class="nu-forbid" x1="82" y1="446" x2="102" y2="458"/><line class="nu-forbid" x1="102" y1="446" x2="82" y2="458"/>';
  b += box(188, 470, 160, 70, 'Portão', ['gₜ ∈ Rₜ ⊕ ε ?'], 'nu-key') + arr(172, 505, 188, 505) + arr(268, 428, 268, 470);
  b += box(12, 574, 160, 60, 'Dentro: usa', ['fundida, precisão']) + box(188, 574, 160, 60, 'Fora: alarme', ['e troca'], 'nu-key') + arr(240, 540, 92, 574) + arr(268, 540, 268, 574);
  b += box(12, 654, 160, 56, 'Via ArduPilot', ['conduz por Rₜ']) + box(188, 654, 160, 56, 'Via DJI', ['paira · pousa']) + arr(268, 634, 92, 654) + arr(268, 634, 268, 654);
  b += '<line class="nu-rule" x1="12" y1="732" x2="348" y2="732"/>' + T(12, 756, 'DEPOIS DO VOO · PERÍCIA', 'nu-sec', 'start');
  b += box(12, 768, 336, 48, 'Registro lacrado', ['assinado · encadeado · carimbado']) + arr(180, 816, 180, 836)
    + box(12, 836, 336, 48, 'Reprodução', ['EKF3 e portão, bit a bit']) + arr(180, 884, 180, 904)
    + box(12, 904, 336, 48, 'Verificador de fora', ['recalcula → laudo'], 'nu-key');
  return svg(360, 966, 'A arquitetura, de cima para baixo: cinco fontes sem GNSS alimentam a região Rₜ; o GNSS vai só ao portão; dentro usa-se a correção, fora há alarme e troca; depois do voo, registro lacrado, reprodução e verificador de fora', b);
}

/* ---- 3 · the machine */
function maquina(narrow) {
  const E = [['A IA propõe', ['modelos · ataques', 'provas · rotas']], ['Filtra em ponto flutuante', ['SITL · logs públicos', 'gravações de ataque']], ['Certifica com exatidão', ['intervalos · SOS', 'dReal · Lean']], ['Decide as afirmações', ['claimbox contra', 'dados medidos']], ['O campo decide', ['gêmeo registrado', 'antes do voo']]];
  const fl = ['muitos', '', '', 'sólidos', 'para voar'];
  if (!narrow) {
    let b = '';
    E.forEach((e, i) => { const x = 20 + i * 205; b += box(x, 70, 180, 92, e[0], e[1], i === 2 || i === 4 ? 'nu-key' : ''); if (i < 4) b += arr(x + 180, 116, x + 205, 116); });
    b += T(110, 56, 'muitos candidatos', 'nu-bs', 'middle') + T(930, 56, 'poucos, sólidos, para voar', 'nu-bs', 'middle');
    b += path('M520 162 C520 190 520 190 520 196', 'nu-fb') + T(520, 214, 'falsificador: ataca cada limite certificado', 'nu-bs', 'middle');
    b += path('M930 162 C930 250 110 250 110 170', 'nu-fb') + '<line class="nu-arr" x1="110" y1="176" x2="110" y2="164" marker-end="url(#nu-ah)"/>'
      + T(520, 244, 'escape em campo → a fonte é rebaixada e volta a ser proposta', 'nu-bs', 'middle');
    return svg(1040, 262, 'A máquina: a IA propõe; filtra-se em ponto flutuante; certifica-se com exatidão; o claimbox decide as afirmações contra dados medidos; o campo decide com gêmeos registrados antes; um escape em campo rebaixa a fonte, que volta a ser proposta', b);
  }
  let b = T(180, 22, 'muitos candidatos', 'nu-bs', 'middle');
  E.forEach((e, i) => { const y = 34 + i * 112; b += box(20, y, 320, 84, e[0], e[1], i === 2 || i === 4 ? 'nu-key' : ''); if (i < 4) b += arr(180, y + 84, 180, y + 112); });
  void fl;
  b += T(180, 600, 'poucos, sólidos, para voar', 'nu-bs', 'middle');
  b += path('M340 524 C356 524 356 76 340 76', 'nu-fb') + T(180, 626, 'escape em campo → a fonte volta a ser proposta', 'nu-bs', 'middle');
  return svg(360, 640, 'A máquina, de cima para baixo: a IA propõe; filtra; certifica; decide as afirmações; o campo decide; um escape rebaixa a fonte', b);
}

/* ---- 4 · the terrain-fix width against slope (computed) */
function relevo(narrow, medidos) {
  const W = narrow ? 360 : 720, H = narrow ? 300 : 320, l = narrow ? 46 : 58, r = 14, t = 16, b = 52;
  const X = (s) => l + (W - l - r) * (s - 5) / 35, Y = (m) => H - b - (H - b - t) * Math.min(m, 200) / 200;
  let o = '';
  [5, 10, 20, 30, 40].forEach((s) => { o += '<line class="nu-grid" x1="' + X(s) + '" x2="' + X(s) + '" y1="' + t + '" y2="' + (H - b) + '"/>' + T(X(s), H - b + 18, s + '%', 'nu-ax', 'middle'); });
  [0, 50, 100, 150, 200].forEach((m) => { o += '<line class="nu-grid" x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(m) + '" y2="' + Y(m) + '"/>' + T(l - 8, Y(m) + 4, m, 'nu-ax', 'end'); });
  o += T((l + W - r) / 2, H - 10, 'inclinação do terreno', 'nu-axl', 'middle');
  [[10, 'nu-t10'], [5, 'nu-t5'], [2, 'nu-t2']].forEach(([dh, cls]) => {
    let d = ''; for (let s = 5; s <= 40; s += 0.5) d += (s === 5 ? 'M' : 'L') + X(s).toFixed(1) + ' ' + Y(dh / (s / 100)).toFixed(1);
    o += path(d, cls) + T(X(10) + 6, Y(dh / 0.1) - 8, 'δh ' + dh + ' m', 'nu-lb', 'start');
  });
  if (medidos) o += T(l + 8, t + 16, medidos, 'nu-bs', 'start');
  return svg(W, H, 'A largura de uma correção de relevo, δh dividido pela inclinação, para erros de altura de 10, 5 e 2 metros, de 5% a 40% de inclinação; calculada', o);
}

/* ---- 5 · the 12-month plan */
function plano(narrow, feitos) {
  const G = [['A proposta (indicativa)', false, [['WP1 ameaças · WP2 especificação', 1, 3], ['WP3 ambiente · bancada', 2, 8], ['WP4 validação independente', 6, 11], ['WP5 doutrina v1.0', 10, 12]]],
    ['A trilha do Núcleo (proposta)', true, [['Livro de larguras no SITL (G0)', 1, 2, 'larguras'], ['R1 e R4 em Lean', 1, 2, 'r1r4'], ['R3 carrossel: bancada, depois voos', 3, 8, 'r3'], ['R2 estimador num grupo de Lie', 3, 11, 'r2'], ['R5 modelo do veículo', 6, 11], ['R6 rota', 8, 12]]]];
  const W = narrow ? 360 : 1000, lw = narrow ? 0 : 300, rowH = narrow ? 44 : 30, top = 34;
  const X = (m) => (narrow ? 12 : lw + 10) + ((narrow ? W - 24 : W - lw - 20) * (m - 1) / 12);
  let y = top, o = '';
  for (let m = 1; m <= 12; m++) o += T((X(m) + X(m + 1)) / 2, 22, m, 'nu-ax', 'middle');
  for (const [title, prop, rows] of G) {
    o += T(12, y + 18, title.toUpperCase(), 'nu-sec2', 'start'); y += 28;
    for (const [lab, a, b2, key] of rows) {
      /* on a phone what was done gets its own line under the name: on one line the longest row ran to 377 of 360 */
      const feito = key && feitos && feitos[key] ? feitos[key] : '', own = narrow && feito ? 16 : 0;
      const ty = narrow ? y + 13 : y + 19, by = (narrow ? y + 20 : y + 6) + own;
      o += T(12, ty, lab + (feito && !narrow ? ' · ' + feito : ''), 'nu-gl', 'start');
      if (own) o += T(12, ty + 16, feito, 'nu-bs', 'start');
      o += '<rect class="nu-bar' + (prop ? ' prop' : '') + '" x="' + X(a).toFixed(1) + '" y="' + by + '" width="' + (X(b2 + 1) - X(a)).toFixed(1) + '" height="16" rx="3"/>';
      y += rowH + own;
    }
    y += 8;
  }
  return svg(W, y + 8, 'O plano de 12 meses: barras cheias, o cronograma indicativo da proposta; barras tracejadas, a trilha proposta do Núcleo', o);
}

/* the rules the R1 drawing needs, ONCE: the landing's "como funciona" and the Núcleo page (nucleo.js adds only the
   rules of its other drawings) both read this sheet. Class names only, every value a token. */
const CSS_DESIGUALDADE = `
.nu-svg{display:block;width:100%;height:auto}
.nu-nw{display:none}
@media (max-width:640px){.nu-w{display:none}.nu-nw{display:block}}
.nu-svg text{font-family:var(--f-sans)!important}
.nu-bs{font-size:var(--text-small);fill:var(--ink-3)}
.nu-reg{fill:var(--band-fill);stroke:var(--ink);stroke-width:2}
.nu-eps{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 4}
.nu-err{stroke:var(--ink);stroke-width:2.2}
.nu-x{fill:var(--ink);stroke:var(--paper);stroke-width:2}
.nu-g{fill:var(--paper);stroke:var(--ink);stroke-width:2.2}
.nu-dim{stroke:var(--ink-3);stroke-width:1.2}
.nu-lb{font-size:var(--text-small);font-weight:var(--weight-strong);fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
.nu-ahp{fill:var(--ink-3)}
`;

module.exports = { desigualdade, arquitetura, maquina, relevo, plano, CSS_DESIGUALDADE };
