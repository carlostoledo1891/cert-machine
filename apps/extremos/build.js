#!/usr/bin/env node
/* build.js — site/extremos/index.html: the tools and solutions cert-machine offers for metocean extremes, in Portuguese.
   A marketing touchpoint (design/marketing.js; the operator, 2026-11-04: "Build an unlisted pt-br page showing what are
   the solutions we can offer. Highly visual, examples on page. Do not talk about project structure, we are offering
   tools and solutions"). Unlisted: noindex, in no sitemap, linked from no page. Generic on the operator's word: no
   group, project or person is named on it.

   EVERY NUMBER IS READ HERE from a record and every figure is drawn from one: certs/hseva-ledger.json (the fits at the
   Campos hindcast node, the benchmark buoy A, SciPy's outputs, the benchmark's printed marginals), certs/hseva-atlas.json
   (the global atlas) and certs/ecbench-ledger.json with the pinned benchmark corpus (the contours). As on /verify/, the
   page prints no record line or stop sentence: the refusals below (need) stop the build and are not printed, every
   value carries its record address (W.value with `derived`, re-resolved by tools/check-marks.js) and every figure its
   records in data-record. Numbers are printed the Brazilian way (6,01 m); a bound is rounded outward.

   THE PAGE'S STANDING WORDS are Portuguese (PROVADO / REFUTADO / RECUSADO, as on the Petrobras pages) and its legend is
   its own, drawn with the grammar's own strokes (W.attrs) — the shared legend's English is not on it.

   usage: node apps/extremos/build.js            (make site runs it; make page R=apps/extremos for the edit loop)  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const CT = require(path.join(ROOT, 'design', 'contact.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const Lb = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const OUT = path.join(ROOT, 'site', 'extremos');

const need = (ok, why) => { if (!ok) { console.error('apps/extremos/build.js: REFUSED — the page refuses to build if ' + why); process.exit(1); } };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
need(MKT.isMarketing('extremos/index.html'), 'it is not on design/marketing.js\'s list of marketing pages, and it prints no record lines');

/* ---- numbers, the Brazilian way ---------------------------------------------------------------------------------- */
const br = (x, d) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const int = (n) => Number(n).toLocaleString('pt-BR');
const up = (x, d) => br(Math.ceil(Number(x) * 10 ** d - 1e-9) / 10 ** d, d);      /* an upper end, rounded outward */
const down = (x, d) => br(Math.floor(Number(x) * 10 ** d + 1e-9) / 10 ** d, d);   /* a lower end, rounded outward */
const mid = (e) => (Number(e.lo !== undefined ? e.lo : e[0]) + Number(e.hi !== undefined ? e.hi : e[1])) / 2;
const WORD = { [W.DECIDED]: 'decidido', [W.COMPUTED]: 'calculado', [W.CHOSEN]: 'escolhido', [W.REFUSED]: 'recusado' };
const v = (text, standing, derived) => W.value(text, standing, { derived, title: WORD[standing] });
const esc = C.esc;

/* ---- the records -------------------------------------------------------------------------------------------------- */
const HS = 'certs/hseva-ledger.json', ATL = 'certs/hseva-atlas.json', EC = 'certs/ecbench-ledger.json';
const L = J(HS), A = J(ATL), E = J(EC);
const FAM = { normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull', expweibull: 'Weibull exponenciada', gengamma: 'Gama generalizada', gumbel: 'Gumbel', gev: 'GEV' };
const FAM_S = { normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull', expweibull: 'Weibull exp.', gengamma: 'Gama gen.', gumbel: 'Gumbel', gev: 'GEV' };
const SIX = L.families;
need(JSON.stringify(SIX) === JSON.stringify(['normal', 'lognormal', 'weibull', 'expweibull', 'gengamma', 'gumbel']), 'the ledger\'s six families moved');

/* Campos: the hindcast node, the daily block */
const CP = L.ww3.points.campos, CPD = CP.blocks.daily;
const cpPtr = (b) => HS + '#/ww3/points/campos/blocks/' + b;
const DAY = cpPtr('daily');
const best = CPD.rankings.ad.best;
need(best === 'expweibull' && ['ad', 'ks', 'mse', 'chi2'].every((k) => CPD.rankings[k].verdict === 'DECIDED' && CPD.rankings[k].best === best)
  && CPD.seven.verdict === 'DECIDED' && CPD.seven.best === best, 'the four criteria and the seven-family rule no longer decide the exponentiated Weibull at Campos, daily');
need(!CPD.fits.gengamma.certified && /lognormal limit/.test(CPD.fits.gengamma.why || ''), 'the generalized gamma is no longer refused at its lognormal limit at Campos, daily');
const CERT = SIX.filter((f) => CPD.fits[f].certified);
need(CERT.length === 5 && CPD.gev.certified, 'Campos, daily, no longer certifies five of the six and the GEV');
const rl = (f, T) => (f === 'gev' ? CPD.gev : CPD.fits[f]).returnLevel[String(T)];
const rlPtr = (f, T) => DAY + (f === 'gev' ? '/gev' : '/fits/' + f) + '/returnLevel/' + T;
const stat = (f) => CPD.stat.fits[f];
const levels = CERT.concat(['gev']).map((f) => ({ f, lo: Number(rl(f, 100).lo), hi: Number(rl(f, 100).hi), s: stat(f).l100.map(Number) }));
const lowF = levels.slice().sort((a, b) => a.lo - b.lo)[0], highF = levels.filter((x) => x.f !== 'gev').sort((a, b) => b.hi - a.hi)[0];
need(lowF.f === 'weibull' && highF.f === 'gumbel', 'the lowest and highest 100-year levels at Campos, daily, are no longer the Weibull\'s and the Gumbel\'s');
const cpMax = Number(CPD.max);
need(cpMax < Number(rl(best, 100).lo), 'the record\'s largest daily maximum reaches the decided 100-year level');
const cpYears = CP.years;
need(cpYears === 32 && /^1993/.test(CP.first) && /^2024/.test(CP.last), 'the Campos series is no longer 1993–2024');

/* ---- figure kit: a hatch per drawing (an id inside a hidden drawing does not paint), the grammar's strokes ------- */
let hid = 0;
const hatch = () => { const id = 'exh' + (++hid); return { id, def: '    <defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse">'
  + '<rect width="6" height="6" fill="' + CH.SURFACE + '"/><path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="' + CH.CTX + '" stroke-width="0.7" fill="none"/></pattern></defs>' }; };
const f1 = (x) => (+x).toFixed(1);
const ln = (x1, y1, x2, y2, a) => '    <line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" ' + a + '/>';
const GUIDE = 'stroke="' + CH.AXIS + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"';
const dual = (wide, narrow) => '<div class="ex-w">\n' + wide + '\n</div><div class="ex-n">\n' + narrow + '\n</div>';
/* a small inline swatch for the page's own legend, drawn by the grammar's own call */
const sw = (inner) => '<svg class="ex-sw" viewBox="0 0 28 12" aria-hidden="true">' + inner + '</svg>';
const LEG = {
  decided: sw('<line x1="2" y1="6" x2="26" y2="6" ' + W.attrs(W.DECIDED, { width: 2 }) + '/>'),
  dot: sw('<circle cx="14" cy="6" r="4.5" fill="var(--c-1)"/>'),
  computed: sw('<line x1="2" y1="6" x2="26" y2="6" ' + W.attrs(W.COMPUTED, { width: 2 }) + '/>'),
  guide: sw('<line x1="2" y1="6" x2="26" y2="6" ' + GUIDE + '/>'),
  wx: sw(W.witnessMark(14, 6, { size: 4.5, width: 2.2, casing: CH.SURFACE })),
};
const voidSw = () => { const h = hatch(); return sw(h.def + '<rect x="3" y="1" width="22" height="10" fill="url(#' + h.id + ')"/>'); };
const legend = (items) => '<ul class="ex-leg w-legend">' + items.map(([s, t]) => '<li>' + s + '<span>' + esc(t) + '</span></li>').join('') + '</ul>';
/* the figures drawn from the other instruments' records (Janela, Swell, the hindcast's raw maxima): apps/extremos/figs.js */
const F = require(path.join(__dirname, 'figs.js'))({ need, br, int, v, hatch, f1, ln, legend, sw, LEG, voidSw, dual, GUIDE, esc });
/* a method block: what is computed and what is proved, in formulas (mono lines), and a feature list */
const method = (rows) => '<div class="ex-math"><div class="ex-mk">Método</div><dl>' + rows.map(([k, f, d]) => '<dt>' + esc(k) + '</dt><dd>' + (f ? '<code class="ex-f">' + f + '</code>' : '') + (d ? '<span>' + d + '</span>' : '') + '</dd>').join('') + '</dl></div>';
const feats = (items) => '<ul class="ex-feat">' + items.map(([k, d]) => '<li><b>' + esc(k) + '</b> ' + d + '</li>').join('') + '</ul>';

/* ================================================================================================================
   THE HERO — one hindcast node, seven answers. The 100-year daily-block level of every family at Campos, each a
   decided enclosure (a dot: its width is under a micrometre), the delta method's 95% interval behind it dashed
   (computed, never decided), the record's largest daily maximum as a guide, the generalized gamma as the void it is.
   ================================================================================================================ */
function heroSvg({ w, padL, short }) {
  const rows = levels.slice().sort((a, b) => a.lo - b.lo).concat([{ f: 'gengamma' }]);
  const rowH = short ? 46 : 44, top = 62, x0 = 4.0, x1 = 7.4;
  const h = top + rows.length * rowH + 40;
  const fr = CH.frame({ w, h, x0, x1, y0: 0, y1: 1, padL, padR: short ? 18 : 120, padT: top, padB: 40 });
  const H = hatch();
  const alt = 'Bacia de Campos, ' + cpYears + ' anos de hindcast, bloco diário: a onda significativa de 100 anos segundo cada distribuição. '
    + levels.map((x) => FAM[x.f] + ' ' + br(mid(x), 2) + ' m').join('; ') + '. A Weibull exponenciada é a escolhida pelos quatro critérios, decidida. '
    + 'A gama generalizada é recusada: não tem máximo de verossimilhança. A maior onda diária registrada é ' + br(cpMax, 2) + ' m.';
  const o = [CH.open({ w, h, alt }), H.def];
  const ticks = short ? [4, 5, 6, 7] : [4, 4.5, 5, 5.5, 6, 6.5, 7];
  for (const t of ticks) o.push(ln(fr.px(t), top - 6, fr.px(t), h - 40, 'stroke="' + CH.GRID + '" stroke-width="1"'));
  for (const t of ticks) o.push(CH.txt(fr.px(t), h - 18, br(t, 1) + (t === ticks[ticks.length - 1] ? ' m' : ''), 't-ax', 'middle'));
  o.push(CH.txt(short ? 12 : fr.L, 16, short ? 'onda de 100 anos (Hs)' : 'onda significativa de 100 anos (Hs), mesmos dados, por distribuição', 't-note', 'start'));
  /* the record, a guide */
  const gx = fr.px(cpMax);
  o.push(ln(gx, top - 6, gx, h - 40, GUIDE));
  o.push(CH.txt(gx - 6, top - 12, short ? 'maior registrada ' + br(cpMax, 2) : 'maior onda diária registrada, ' + br(cpMax, 2) + ' m', 't-note', 'end'));
  rows.forEach((r, i) => {
    const y = top + i * rowH + rowH / 2;
    const isBest = r.f === best;
    o.push(CH.txt(padL - 12, y + 4, short ? FAM_S[r.f] : FAM[r.f] + (r.f === 'gev' ? ' (7ª)' : ''), isBest ? 't-lab' : 't-note', 'end'));
    if (r.f === 'gengamma') {
      o.push('    <rect x="' + f1(fr.px(4.05)) + '" y="' + f1(y - 9) + '" width="' + f1(fr.px(x1) - fr.px(4.05)) + '" height="18" fill="url(#' + H.id + ')" class="w-void"/>');
      o.push('    <rect x="' + f1(fr.px(4.05) + 8) + '" y="' + f1(y - 8) + '" width="' + f1(short ? 190 : 470) + '" height="16" fill="' + CH.SURFACE + '"/>');
      o.push(CH.txt(fr.px(4.05) + 14, y + 4, short ? '∅ recusada: sem máximo' : '∅ recusada: a verossimilhança sobe até o limite lognormal, sem máximo', 't-note', 'start'));
      return;
    }
    /* the statistical interval, computed: dashed */
    o.push(ln(fr.px(r.s[0]), y, fr.px(r.s[1]), y, W.attrs(W.COMPUTED, { width: 2 })));
    /* the decided level: a dot */
    o.push('    <circle cx="' + f1(fr.px(mid(r))) + '" cy="' + f1(y) + '" r="' + (isBest ? 7 : 5.5) + '" fill="' + (isBest ? 'var(--c-1)' : 'var(--c-2)') + '" stroke="' + CH.SURFACE + '" stroke-width="2"/>');
    o.push('    <circle ' + CH.hit('cx="' + f1(fr.px(mid(r))) + '" cy="' + f1(y) + '" r="14" fill="transparent"', FAM[r.f], 'onda de 100 anos ' + br(mid(r), 2) + ' m · intervalo estatístico ' + br(r.s[0], 2) + '–' + br(r.s[1], 2) + ' m') + '/>');
    const lx = Math.max(fr.px(r.s[1]), fr.px(mid(r))) + 10;
    if (!short) o.push(CH.txt(lx, y + 4, br(mid(r), 2) + ' m' + (isBest ? '  ← a escolhida, decidida' : ''), isBest ? 't-lab' : 't-ax', 'start'));
    else o.push(CH.txt(Math.min(lx, w - 4), y - 9, br(mid(r), 2), isBest ? 't-lab' : 't-ax', lx > w - 40 ? 'end' : 'start'));
  });
  o.push(CH.close);
  return o.join('\n');
}
const HERO_SPREAD = br(mid(highF) - mid(lowF), 2);
/* drawn as the page's first figure, not as a D12 hero: its marks are decided levels, not a counterexample, and the
   first × on the page belongs to the software check below (check-wiring rule 11 reads a hero's × as the first) */
const hero = C.figure({
  record: HS, pins: false,
  svgRaw: dual(heroSvg({ w: 1000, padL: 230, short: false }), heroSvg({ w: 340, padL: 106, short: true })),
  captionRaw: 'Bacia de Campos, um ponto do hindcast WAVEWATCH III, ' + v(String(cpYears), W.DECIDED, [HS + '#/ww3/points/campos/years']) + ' anos, máximos diários. '
    + 'As seis distribuições usuais e a GEV, ajustadas pela máxima verossimilhança, discordam em ' + v(HERO_SPREAD + ' m', W.DECIDED, [rlPtr(highF.f, 100), rlPtr(lowF.f, 100)])
    + ' na onda de 100 anos. Cada ponto é um nível decidido; o traço, o intervalo estatístico de 95% (calculado). A escolha entre elas também é decidida: a Weibull exponenciada, '
    + v(br(mid(rl(best, 100)), 2) + ' m', W.DECIDED, [rlPtr(best, 100)]) + ', pelos quatro critérios.'
    + legend([[LEG.dot, 'nível decidido'], [LEG.computed, 'intervalo estatístico (calculado)'], [LEG.guide, 'referência'], [voidSw(), 'recusado']])
});

/* ---- the stats strip --------------------------------------------------------------------------------------------- */
let atlasFits = 0, atlasCells = A.cells.length;
for (const c of A.cells) for (const b of A.blocks) { const B = c.blocks[b]; if (!B) continue; for (const f of SIX) if (B.fits[f] && B.fits[f].c === 1) atlasFits++; if (B.gev && B.gev.c === 1) atlasFits++; }
need(atlasCells === 2589 && atlasFits > 40000, 'the atlas no longer holds 2,589 cells and more than forty thousand certified fits');
const ecRows = E.rows.length, ecOpen = E.rows.filter((r) => !r.polygon.closed).length, ecCross = E.rows.filter((r) => r.polygon.simple === false).length;
need(ecRows === E.summary.contours && ecOpen === E.summary.notClosed && ecCross === E.summary.notSimple, 'the contour ledger\'s summary disagrees with its rows');
const stats = C.stats([
  { k: 'ajustes certificados no atlas', vRaw: v(int(atlasFits), W.DECIDED, [ATL + '#/cells']), nRaw: 'seis distribuições e a GEV, três blocos, cada máximo de verossimilhança provado' },
  { k: 'pontos do oceano', vRaw: v(int(atlasCells), W.DECIDED, [ATL + '#/cells']), nRaw: 'cada célula do hindcast global 1993–2024, aberta no navegador' },
  { k: 'contornos ambientais conferidos', vRaw: v(int(ecRows), W.DECIDED, [EC + '#/rows']), nRaw: 'cada hora classificada dentro ou fora, em aritmética exata' },
  { k: 'contagens publicadas reproduzidas', vRaw: v(int(E.summary.agree) + ' de ' + int(E.summary.comparisons), W.DECIDED, [EC + '#/summary/agree', EC + '#/summary/comparisons']), nRaw: 'as outras duas, com a diferença exata' },
]);

/* ================================================================================================================
   1 · THE FIT, DECIDED — which family each criterion and block decides at Campos
   ================================================================================================================ */
const BLK = [['native', '3 horas'], ['daily', 'diário'], ['weekly', 'semanal'], ['monthly', 'mensal']];
const CRIT = [['ad', 'A²'], ['ks', 'KS'], ['mse', 'EQM'], ['chi2', 'χ²']];
const fitTable = C.table({
  cols: [{ h: 'bloco', cls: 'k' }].concat(CRIT.map(([, t]) => ({ h: t }))).concat([{ h: 'com a GEV' }]),
  rows: BLK.map(([b, t]) => {
    const B = CP.blocks[b];
    need(CRIT.every(([k]) => B.rankings[k].verdict === 'DECIDED') && B.seven.verdict === 'DECIDED', 'a criterion no longer decides at Campos, block ' + b);
    return [t].concat(CRIT.map(([k]) => ({ raw: v(esc(FAM_S[B.rankings[k].best]), W.DECIDED, [cpPtr(b) + '/rankings/' + k]) })))
      .concat([{ raw: v(esc(FAM_S[B.seven.best]), W.DECIDED, [cpPtr(b) + '/seven']) }]);
  })
});
const ggRefusedIn = BLK.filter(([b]) => !CP.blocks[b].fits.gengamma.certified).length;
need(ggRefusedIn === 3 && CP.blocks.monthly.fits.gengamma.certified, 'the generalized gamma\'s refusals at Campos moved (three blocks, certified only monthly)');
const s1Big = '<div class="ex-text"><p class="ex-big">' + v('4 de 4', W.DECIDED, CRIT.map(([k]) => DAY + '/rankings/' + k)) + '</p><p class="ex-big-k">critérios decidem a mesma distribuição no bloco diário de Campos</p>'
  + C.p('Com o bloco, o vencedor pode mudar: a tabela mostra cada decisão.') + '</div>';
const s1Text = C.p('Ajusta as seis distribuições usuais de extremos, e a GEV, a uma série de altura significativa, em blocos de 3 horas, diário, semanal ou mensal. Cada máximo de verossimilhança sai com uma caixa de parâmetros em que ele é provado único; os níveis de retorno e os quatro critérios de aderência são intervalos calculados sobre essa caixa.')
  + C.p('A escolha da distribuição é decidida quando o critério da melhor fica inteiro abaixo do de todas as outras; senão a resposta é RECUSADO, com as distribuições empatadas. Uma família sem máximo, como a gama generalizada em três dos quatro blocos de Campos, é provada sem máximo e sai da disputa.')
  + feats([['Entrada:', 'uma série de Hs (boia, hindcast ou reanálise), o bloco e os períodos de retorno.'], ['Saída:', 'parâmetros, níveis de retorno, os quatro critérios e a escolha, cada um como intervalo ou veredito, com o certificado.']]);
const s1Fig = '<div class="ex-tab">' + fitTable + '<p class="ex-cap col">Bacia de Campos, ' + cpYears + ' anos de hindcast; critérios Anderson–Darling (A²), Kolmogorov–Smirnov (KS), erro quadrático médio (EQM) e qui-quadrado (χ²). O vencedor muda com o bloco e com o critério; cada célula é uma decisão, não um arredondamento. '
  + 'A gama generalizada fica de fora onde não tem máximo (3 horas, diário, semanal).</p></div>';

/* ================================================================================================================
   2 · THE SOFTWARE THAT STOPPED SHORT — SciPy's default fit at the benchmark's buoy A, hourly
   ================================================================================================================ */
const SP = L.scipy.buoys.A.native.expweibull, SPC = L.buoys.A.blocks.native.fits.expweibull;
const SPP = HS + '#/scipy/buoys/A/native/expweibull', SPCP = HS + '#/buoys/A/blocks/native/fits/expweibull';
need(SP.default.verdict === 'BELOW_A_MEMBER' && SP.floc0.verdict === 'AGREES' && SPC.certified, 'SciPy\'s default exponentiated-Weibull fit at buoy A is no longer below a member, or its loc = 0 fit no longer agrees');
const spDef = Number(SP.default.level100), spFloc = Number(SP.floc0.level100), spCert = mid(SPC.returnLevel['100']);
const spRatio = spCert / spDef, spDeficit = Number(SP.default.deficit);
need(spRatio > 2 && spDeficit > 10000, 'the gap between SciPy\'s default and the certified maximum is no longer more than double, by more than ten thousand log-units');
const spYears = L.buoys.A.years;
function sciSvg({ w, short }) {
  const rowsS = [
    { k: 'SciPy, padrão', x: spDef, st: W.COMPUTED, wx: true },
    { k: 'SciPy, loc = 0', x: spFloc, st: W.COMPUTED },
    { k: short ? 'certificado' : 'máximo certificado', x: spCert, st: W.DECIDED },
  ];
  const padL = short ? 104 : 168, top = 36, rowH = short ? 62 : 58, h = top + rowsS.length * rowH + 40;
  const fr = CH.frame({ w, h, x0: 0, x1: 17, y0: 0, y1: 1, padL, padR: 16, padT: top, padB: 40 });
  const alt = 'Boia A, ' + spYears + ' anos de dados horários, Weibull exponenciada: o ajuste padrão do SciPy dá ' + br(spDef, 2) + ' m para a onda de 100 anos; com a localização em zero, '
    + br(spFloc, 2) + ' m; o máximo certificado, ' + br(spCert, 2) + ' m. O ajuste padrão está ' + int(Math.round(spDeficit)) + ' unidades de log-verossimilhança abaixo de um membro da família, que o refuta como máximo.';
  const o = [CH.open({ w, h, alt })];
  for (const t of [0, 5, 10, 15]) { o.push(ln(fr.px(t), top - 8, fr.px(t), h - 40, 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(CH.txt(fr.px(t), h - 18, t + (t === 15 ? ' m' : ''), 't-ax', 'middle')); }
  o.push(CH.txt(short ? 12 : padL, 18, 'onda de 100 anos (Hs), mesma série', 't-note', 'start'));
  rowsS.forEach((r, i) => {
    const y = top + i * rowH + rowH / 2;
    o.push(CH.txt(padL - 12, y + 4, r.k, r.st === W.DECIDED ? 't-lab' : 't-note', 'end'));
    o.push(ln(fr.px(0), y, fr.px(r.x), y, r.st === W.DECIDED ? W.attrs(W.DECIDED, { width: 3 }) : W.attrs(W.COMPUTED, { width: 3 })));
    if (r.wx) {
      o.push('    ' + W.witnessMark(fr.px(r.x), y, { size: 7, width: 3, casing: CH.SURFACE }));
      o.push(CH.txt(fr.px(r.x) + 14, y + 4, br(r.x, 2) + ' m', 't-lab', 'start'));
      o.push(CH.txt(fr.px(r.x) + 14, y + 22, 'refutado como máximo', 't-note', 'start'));
    } else {
      o.push('    <circle cx="' + f1(fr.px(r.x)) + '" cy="' + f1(y) + '" r="5.5" fill="' + (r.st === W.DECIDED ? 'var(--c-1)' : 'var(--c-2)') + '" stroke="' + CH.SURFACE + '" stroke-width="2"/>');
      o.push(CH.txt(Math.min(fr.px(r.x) + 12, w - 4), y - 10, br(r.x, 2) + ' m', r.st === W.DECIDED ? 't-lab' : 't-ax', fr.px(r.x) + 60 > w ? 'end' : 'start'));
    }
  });
  o.push(CH.close);
  return o.join('\n');
}
const s2Fig = C.figure({ record: HS, pins: false, wide: false,
  svgRaw: dual(sciSvg({ w: 480, short: false }), sciSvg({ w: 330, short: true })),
  captionRaw: 'Boia A do benchmark de contornos ambientais, ' + v(String(spYears), W.DECIDED, [HS + '#/buoys/A/years']) + ' anos de dados horários. O ajuste padrão do SciPy para a Weibull exponenciada para '
    + v(int(Math.round(spDeficit)), W.COMPUTED, [SPP + '/default/deficit']) + ' unidades de log-verossimilhança antes do máximo.'
    + legend([[LEG.decided, 'decidido'], [LEG.computed, 'saída do software (calculado)'], [LEG.wx, 'contraexemplo exibido']]) });
const s2Text = '<p class="ex-big">' + v(br(spRatio, 1).replace(',0', '') + '×', W.DECIDED, [SPP + '/default/level100', SPCP + '/returnLevel/100']) + '</p><p class="ex-big-k">a diferença entre a onda de 100 anos do software e a certificada</p>'
  + C.p('Otimizadores numéricos param por critério de tolerância, não no máximo. Com a localização livre, a verossimilhança da Weibull exponenciada nem tem máximo, e o resultado depende do ponto de partida.')
  + C.p('A conferência recebe os parâmetros que um software devolveu e decide: PROVADO, se estão na caixa do máximo certificado; REFUTADO, com um membro da família de verossimilhança maior; RECUSADO, se a precisão informada não decide.')
  + feats([['Entrada:', 'a série e os parâmetros de qualquer ajuste (SciPy, R, MATLAB, planilha).'], ['Saída:', 'o veredito, o déficit de log-verossimilhança e o membro exibido.']])
  + C.pRaw('<a href="../instruments/return-level-check/">Conferência no navegador →</a> <span class="ex-en">(em inglês; os dados não saem da máquina)</span>');

/* ================================================================================================================
   3 · PRINTED TABLES, DECIDED — the benchmark contributions' printed marginals at dataset A
   ================================================================================================================ */
const PR = L.printed, PRP = HS + '#/printed/rows';
const prA = PR.rows.filter((r) => r.buoy === 'A');
const pr = (id) => prA.find((r) => r.id === id) || need(false, 'printed row ' + id + ' at A is missing');
const c8 = pr('c8'), c9 = pr('c9'), c4 = pr('c4'), c3 = pr('c3'), c12 = pr('c12');
const refA = PR.reference.A.mle;
need(c9.ll === null && c9.belowLocation[0] > 10000 && /below the printed location/.test(c9.llWhy), 'contribution 9 no longer leaves more than ten thousand hours below its printed location');
need(Number(c8.rl100.lo) <= Number(refA.weibull.rl100.hi) && Number(refA.weibull.rl100.lo) <= Number(c8.rl100.hi), 'contribution 8\'s printed Weibull no longer reaches the certified Weibull maximum');
need(Number(c4.rl100.hi) < Number(refA.expweibull.rl100.lo) && c4.estimator === 'weighted least squares', 'contribution 4\'s least-squares exponentiated Weibull is no longer below the certified maximum');
need(c12.ll === null && /printed precision/.test(c12.llWhy), 'contribution 1 & 2\'s printed location is no longer undecided at the printed precision');
const nA = PR.reference.A.n;
const prRows = [
  { r: c8, k: 'contribuição 8 · Weibull', ref: refA.weibull.rl100, word: 'no máximo', st: 'ok' },
  { r: c12, k: 'contribuições 1 e 2 · Weibull 3p', word: 'a precisão impressa não decide', st: 'refused' },
  { r: c9, k: 'contribuição 9 · Weibull 3p', word: int(c9.belowLocation[0]) + ' horas abaixo da localização', st: 'wx' },
  { r: c4, k: 'contribuição 4 · Weibull exp.', ref: refA.expweibull.rl100, word: 'abaixo do máximo certificado', st: 'ref' },
  { r: c3, k: 'contribuição 3 · lognormal 3p', word: 'um máximo local, certificado', st: 'ok' },
];
function prSvg({ w, short }) {
  const padL = 12, top = 36, rowH = 64, h = top + prRows.length * rowH + 40;
  const fr = CH.frame({ w, h, x0: 4, x1: 17, y0: 0, y1: 1, padL, padR: 16, padT: top, padB: 40 });
  const H = hatch();
  const alt = 'Dataset A do benchmark, ' + int(nA) + ' horas: a onda horária de 100 anos que cada tabela impressa implica. ' + prRows.map((x) => x.k + ': ' + br(mid(x.r.rl100), 2) + ' m, ' + x.word).join('; ') + '.';
  const o = [CH.open({ w, h, alt }), H.def];
  for (const t of [5, 10, 15]) { o.push(ln(fr.px(t), top - 8, fr.px(t), h - 40, 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(CH.txt(fr.px(t), h - 18, t + (t === 15 ? ' m' : ''), 't-ax', 'middle')); }
  o.push(CH.txt(12, 18, short ? 'onda de 100 anos implicada (Hs)' : 'onda horária de 100 anos que a tabela impressa implica', 't-note', 'start'));
  prRows.forEach((x, i) => {
    const y = top + i * rowH + rowH / 2 + 8;
    o.push(CH.txt(12, y - 16, x.k, 't-note', 'start'));
    const lo = Number(x.r.rl100.lo), hi = Number(x.r.rl100.hi), cx = fr.px((lo + hi) / 2);
    if (x.ref) {
      const rx = fr.px(mid(x.ref));
      o.push(ln(Math.min(cx, rx), y, Math.max(cx, rx), y, GUIDE));
      o.push('    <circle cx="' + f1(rx) + '" cy="' + f1(y) + '" r="5.5" fill="none" stroke="var(--c-1)" stroke-width="2"/>');
    }
    if (x.st === 'refused') {
      o.push('    <rect x="' + f1(fr.px(lo) - 3) + '" y="' + f1(y - 7) + '" width="' + f1(fr.px(hi) - fr.px(lo) + 6) + '" height="14" fill="url(#' + H.id + ')" class="w-void"/>');
    } else if (x.st === 'wx') {
      o.push('    ' + W.witnessMark(cx, y, { size: 6.5, width: 3, casing: CH.SURFACE }));
    } else {
      o.push('    <rect x="' + f1(fr.px(lo) - 3) + '" y="' + f1(y - 5) + '" width="' + f1(Math.max(6, fr.px(hi) - fr.px(lo) + 6)) + '" height="10" rx="3" fill="' + (x.st === 'ok' ? 'var(--c-1)' : 'var(--c-2)') + '"/>');
    }
    /* the words beside the mark: right of it if they fit, else left of it, else on the label's line, right-aligned */
    const cls = x.st === 'wx' ? 't-lab' : 't-note', wd = CH.adv(x.word, cls);
    const rx = Math.max(cx, x.ref ? fr.px(mid(x.ref)) : 0) + 14, lx = Math.min(cx, x.ref ? fr.px(mid(x.ref)) : cx) - 14;
    if (rx + wd <= w - 4) o.push(CH.txt(rx, y + 4, x.word, cls, 'start'));
    else if (lx - wd >= 4) o.push(CH.txt(lx, y + 4, x.word, cls, 'end'));
    else o.push(CH.txt(w - 4, y - 16, x.word, cls, 'end'));
  });
  o.push(CH.close);
  return o.join('\n');
}
const s3Fig = C.figure({ record: HS, pins: false, wide: false,
  svgRaw: dual(prSvg({ w: 480, short: false }), prSvg({ w: 330, short: true })),
  captionRaw: 'As distribuições marginais impressas pelas contribuições ao benchmark de contornos ambientais, decididas sobre as mesmas '
    + v(int(nA), W.DECIDED, [HS + '#/printed/reference/A/n']) + ' horas em que foram ajustadas. Cada barra é a faixa de todos os valores que os dígitos impressos permitem; o anel, o máximo certificado da mesma família.'
    + legend([[LEG.dot, 'nível implicado pela tabela'], [sw('<circle cx="14" cy="6" r="4.5" fill="none" stroke="var(--c-1)" stroke-width="2"/>'), 'máximo certificado'], [LEG.wx, 'contraexemplo exibido'], [voidSw(), 'recusado']]) });
const s3Text = '<p class="ex-big">' + v(int(c9.belowLocation[0]), W.DECIDED, [PRP + '/' + PR.rows.indexOf(c9) + '/belowLocation']) + ' horas</p><p class="ex-big-k">abaixo da localização que uma tabela publicada imprime: a verossimilhança dela é menos infinito</p>'
  + C.p('Tabelas de projeto, relatórios e artigos imprimem parâmetros com três ou quatro dígitos. Os dígitos impressos definem uma caixa de parâmetros; a conferência decide o que a caixa inteira afirma sobre os dados em que a tabela foi ajustada: se contém o máximo, se fica abaixo dele, ou se põe dados fora do suporte da distribuição.')
  + feats([['Entrada:', 'a tabela impressa (distribuição, parâmetros, dígitos) e a série original.'], ['Saída:', 'o nível de retorno implicado, como faixa, e o veredito contra o máximo certificado da mesma família.']]);

/* ================================================================================================================
   4 · THE ATLAS — every open-sea cell of the global hindcast, the decided family's 100-year daily level
   ================================================================================================================ */
const CL = [[0, 3, '< 3 m'], [3, 6, '3–6 m'], [6, 10, '6–10 m'], [10, 15, '10–15 m'], [15, Infinity, '≥ 15 m']];
const atlasCellsDrawn = [];
let atlasRefused = 0, atlasNoLevel = 0;
for (const c of A.cells) {
  const [la, lo] = c.id.split('_').map(Number);
  const b = c.blocks.daily; const f = b.rank.ad;
  if (f === 'R') { atlasRefused++; atlasCellsDrawn.push({ la, lo, k: -1 }); continue; }
  const l = b.fits[f] && b.fits[f].l100;
  if (!l) { atlasNoLevel++; atlasCellsDrawn.push({ la, lo, k: -1 }); continue; }
  atlasCellsDrawn.push({ la, lo, k: CL.findIndex(([a, z]) => l[1] >= a && l[1] < z), id: c.id, f, l });
}
need(atlasCellsDrawn.every((x) => x.k >= -1 && x.k < CL.length), 'an atlas level falls outside the map\'s classes');
const cpCell = A.cells.find((c) => c.id === '-22_-40');
need(cpCell && cpCell.blocks.daily.rank.ad === 'expweibull', 'the atlas cell over Campos no longer decides the exponentiated Weibull, daily');
function mapSvg() {
  const w = 1000, la0 = -64, la1 = 72, h = Math.round(w * (la1 - la0) / 360);
  const X = (lo) => (lo + 180) / 360 * w, Y = (la) => (la1 - la) / (la1 - la0) * h;
  const H = hatch();
  const alt = 'Mapa-múndi do atlas: ' + int(atlasCells) + ' células oceânicas do hindcast global 1993–2024, cada uma pintada pela onda de 100 anos (bloco diário) da distribuição decidida; '
    + int(atlasRefused + atlasNoLevel) + ' células hachuradas onde a escolha ou o nível é recusado. A célula da Bacia de Campos está marcada.';
  const o = [CH.open({ w, h, alt }), H.def];
  o.push('    <rect x="0" y="0" width="' + w + '" height="' + h + '" fill="none" stroke="' + CH.GRID + '" stroke-width="1"/>');
  for (const la of [-60, -30, 0, 30, 60]) o.push(ln(0, Y(la), w, Y(la), 'stroke="' + CH.GRID + '" stroke-width="1"'));
  /* the land, Natural Earth 1:50m (corpus/basemap, pinned), under the cells: the cells are open sea, the land says where the coast is */
  o.push('    <path d="' + F.landWorld(w, h, la0, la1) + '" ' + F.landFill + '/>');
  /* the grid is finer along some coasts: each mark is sized to half the distance to its nearest neighbour, so none overlaps */
  const P = atlasCellsDrawn.map((x) => [X(x.lo), Y(x.la)]);
  const rad = P.map(([a, b], i) => { let d = Infinity; P.forEach(([c, e], j) => { if (j !== i) d = Math.min(d, Math.hypot(a - c, b - e)); }); return Math.min(3.6, d / 2 - 0.3); });
  atlasCellsDrawn.forEach((x, i) => {
    const [px, py] = P[i], r = rad[i];
    if (x.k < 0) o.push('    <rect x="' + f1(px - r) + '" y="' + f1(py - r) + '" width="' + f1(2 * r) + '" height="' + f1(2 * r) + '" fill="url(#' + H.id + ')"/>');
    else o.push('    <circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="' + f1(r) + '" fill="' + CH.SEQ[x.k] + '"/>');
  });
  const cx = X(-40), cy = Y(-22);
  o.push('    <circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="9" fill="none" stroke="var(--ink)" stroke-width="2"/>');
  o.push(ln(cx - 7, cy + 6, cx - 40, cy + 30, 'stroke="var(--ink)" stroke-width="1"'));
  o.push(CH.txt(cx - 44, cy + 36, 'Bacia de Campos', 't-lab', 'end'));
  o.push(CH.close);
  return o.join('\n');
}
const s4Fig = C.figure({ record: [ATL, 'corpus/basemap/ne_50m_land.geojson'], pins: false, svgRaw: mapSvg(),
  captionRaw: 'A onda de 100 anos (bloco diário) da distribuição decidida, em cada uma das ' + v(int(atlasCells), W.DECIDED, [ATL + '#/cells']) + ' células oceânicas do hindcast global. '
    + 'Hachuradas, as ' + v(int(atlasRefused + atlasNoLevel), W.DECIDED, [ATL + '#/cells']) + ' em que a escolha ou o nível é recusado, com o motivo.'
    + legend(CL.map(([, , t], i) => [sw('<circle cx="14" cy="6" r="5" fill="' + CH.SEQ[i] + '"/>'), t]).concat([[voidSw(), 'recusado']])) });

/* ================================================================================================================
   5 · ENVIRONMENTAL CONTOURS — dataset A's 20-year contours over the hours they were scored on
   ================================================================================================================ */
const CON = ['1', '6', '3'].map((id) => E.rows.find((r) => r.dataset === 'A' && r.returnPeriod === 20 && r.contribution === id));
need(CON.every(Boolean) && CON[0].class === 'total' && CON[1].class === 'marginal' && CON[2].class === 'total', 'the three dataset-A 20-year contours moved');
need(CON[0].polygon.closed && CON[1].polygon.closed && !CON[2].polygon.closed && CON.every((r) => r.polygon.simple), 'the closed/open pattern of the three contours moved');
const EXP = E.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 20);
need(EXP.total.exact === '1' && CON[0].counts.full.out > 100 && CON[2].counts.full.out > 50 && CON[1].counts.full.out > Number(EXP.iform.hi), 'the counted hours outside no longer exceed what each contour\'s own definition expects');
const ECP = (r) => EC + '#/rows/' + E.rows.indexOf(r);
Lb.ensureCorpus();
const pv = Lb.readDataset('datasets/A.txt'), rv = Lb.readDataset('datasets-retained/Ar.txt');
need(pv.sha256 === L.buoys.A.files[0].sha256 && rv.sha256 === L.buoys.A.files[1].sha256, 'dataset A\'s two files do not match their pins');
const polys = CON.map((r) => { const K = Lb.readContour(r.file); need(K.sha256 === r.sha256, 'contour ' + r.file + ' does not match its pin'); return K.pts.map((p) => [p.u.v, p.h.v]); });
const TZ1 = 20, HS1 = 12, DX = 0.5, DY = 0.5, NX = TZ1 / DX, NY = HS1 / DY;
const grid = new Array(NX * NY).fill(0); let hours = 0;
for (const ds of [pv, rv]) for (let i = 0; i < ds.n; i++) { const ix = Math.floor(ds.u[i] / DX), iy = Math.floor(ds.h[i] / DY); if (ix >= 0 && iy >= 0 && ix < NX && iy < NY) { grid[iy * NX + ix]++; hours++; } }
need(hours === E.datasets.A.full, 'the density field does not hold every one of dataset A\'s hours');
need(polys.every((P) => P.every(([u, hh]) => u >= 0 && u <= TZ1 && hh >= 0 && hh <= HS1)), 'a contour runs outside the drawn window');
const DCL = [[1, 9], [10, 99], [100, 999], [1000, 4999], [5000, Infinity]];
const ID = [{ tok: 'var(--c-1)', w: 2.5 }, { tok: 'var(--c-2)', w: 2 }, { tok: 'var(--c-3)', w: 2 }];
function conSvg({ w, short }) {
  const h = Math.round(w * (short ? 0.95 : 0.78)), padL = 44, padB = 40, padT = 26, padR = 12;
  const fr = CH.frame({ w, h, x0: 0, x1: TZ1, y0: 0, y1: HS1, padL, padR, padT, padB });
  const alt = 'Dataset A, ' + int(hours) + ' horas de Hs e Tz, como um campo de densidade; por cima, três contornos de 20 anos submetidos ao benchmark. '
    + CON.map((r) => 'Contribuição ' + r.contribution + ' (' + r.method + '): ' + int(r.counts.full.out) + ' horas fora').join('; ') + '. A definição de um contorno total de 20 anos espera 1 hora fora.';
  const o = [CH.open({ w, h, alt })];
  o.push(CH.axes(fr, { xTicks: [0, 5, 10, 15, 20].map((t) => ({ v: t, t: String(t) })), yTicks: [0, 4, 8, 12].map((t) => ({ v: t, t: String(t) })) }));
  o.push(CH.txt(fr.L + fr.pw, h - 6, 'período Tz (s)', 't-note', 'end'));
  o.push(CH.txt(fr.L - 30, 14, 'Hs (m)', 't-note', 'start'));
  const cw = fr.px(DX) - fr.px(0), chh = fr.py(0) - fr.py(DY);
  for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) {
    const n = grid[iy * NX + ix]; if (!n) continue;
    const k = DCL.findIndex(([a, z]) => n >= a && n <= z);
    o.push('    <rect x="' + f1(fr.px(ix * DX)) + '" y="' + f1(fr.py((iy + 1) * DY)) + '" width="' + f1(cw + 0.3) + '" height="' + f1(chh + 0.3) + '" fill="' + CH.SEQ[k] + '" opacity="0.55"/>');
  }
  polys.forEach((P, i) => {
    const d = P.map(([u, hh], j) => (j ? 'L' : 'M') + f1(fr.px(u)) + ' ' + f1(fr.py(hh))).join(' ') + (CON[i].polygon.closed ? ' Z' : '');
    o.push('    <path d="' + d + '" fill="none" stroke="' + CH.SURFACE + '" stroke-width="' + (ID[i].w + 3) + '" stroke-linejoin="round"/>');
    o.push('    <path d="' + d + '" ' + W.attrs(W.DECIDED, { width: ID[i].w }).replace('class="w-decided"', 'class="w-decided" style="stroke:' + ID[i].tok + '"') + ' stroke-linejoin="round"/>');
    const top = P.reduce((a, b) => (b[1] > a[1] ? b : a));
    o.push(CH.txt(fr.px(top[0]) + (i === 1 ? -8 : 8), fr.py(top[1]) - 8, String(CON[i].contribution), 't-lab', i === 1 ? 'end' : 'start'));
  });
  o.push(CH.close);
  return o.join('\n');
}
const s5Fig = C.figure({ record: EC, pins: false, wide: false,
  svgRaw: dual(conSvg({ w: 480, short: false }), conSvg({ w: 330, short: true })),
  captionRaw: 'Três contornos de 20 anos submetidos ao benchmark para o dataset A, sobre as ' + v(int(hours), W.DECIDED, [EC + '#/datasets/A/full']) + ' horas em que foram avaliados. '
    + CON.map((r) => 'Contribuição ' + r.contribution + ' (' + esc(r.method) + '): ' + v(int(r.counts.full.out), W.DECIDED, [ECP(r) + '/counts/full/out']) + ' horas fora').join('; ') + '.'
    + legend([[LEG.decided, 'contorno, como o arquivo o lista'], [sw('<rect x="3" y="1" width="22" height="10" fill="' + CH.SEQ[3] + '" opacity="0.55"/>'), 'horas observadas (densidade)']]) });
const s5Text = '<p class="ex-big">' + v(int(CON[0].counts.full.out), W.DECIDED, [ECP(CON[0]) + '/counts/full/out']) + ' horas</p><p class="ex-big-k">fora de um contorno de 20 anos cuja própria definição espera ' + v('1', W.DECIDED, [EC + '#/expected/' + E.expected.indexOf(EXP) + '/total/exact']) + '</p>'
  + C.p('Cada hora observada é classificada dentro, fora ou sobre o polígono do contorno, em aritmética exata, e a contagem é comparada com o que a definição do contorno espera. A geometria também é conferida: de ' + int(ecRows) + ' contornos submetidos ao benchmark, '
    + int(ecOpen) + ' não fecham e ' + int(ecCross) + ' cruzam a si mesmos.')
  + feats([['Entrada:', 'o contorno (lista de pontos), o período de retorno, o tipo (total ou marginal) e a série Hs–Tz.'], ['Saída:', 'as contagens exatas dentro, fora e sobre, o esperado pela definição e a geometria.']]);

/* ================================================================================================================
   6 · THE THRESHOLD THAT FLIPS THE VERDICT — an instrument over the Campos enclosures
   ================================================================================================================ */
const ENC = CERT.map((f) => ({ f, name: FAM[f], lo: rl(f, 100).lo, hi: rl(f, 100).hi }));
const thrBest = up(rl(best, 100).hi, 2), thrAll = up(Math.max(...ENC.map((e) => Number(e.hi))), 2);
const instrument = '<div class="ex-ins" id="ex-ins">'
  + '<p class="ex-claim">“A onda de 100 anos na Bacia de Campos não passa de <b id="ex-h">6,00</b> m.”</p>'
  + '<input type="range" id="ex-r" min="400" max="800" step="1" value="600" aria-label="Altura de projeto, em centímetros">'
  + '<div class="ex-out"><div class="ex-row"><span class="ex-k">com a distribuição decidida</span><span id="ex-v1" class="tag held">PROVADO</span><span class="ex-why" id="ex-w1"></span></div>'
  + '<div class="ex-row"><span class="ex-k">com qualquer uma das cinco certificadas</span><span id="ex-v2" class="tag dep">REFUTADO</span><span class="ex-why" id="ex-w2"></span></div></div>'
  + '<p class="ex-thr">Vira PROVADO a partir de ' + v(thrBest + ' m', W.DECIDED, [rlPtr(best, 100)]) + ' com a distribuição decidida, e a partir de ' + v(thrAll + ' m', W.DECIDED, CERT.map((f) => rlPtr(f, 100))) + ' com qualquer uma.</p>'
  + '</div>';
const instrumentJs = '<script>\n(function(){\'use strict\';\nvar E=' + JSON.stringify(ENC) + ',B=' + JSON.stringify(best) + ';\n'
  + 'var S=100000000n;function q(s){var p=String(s).split(\'.\'),f=(p[1]||\'\').padEnd(8,\'0\').slice(0,8);return BigInt(p[0])*S+BigInt(f);}\n'
  + 'var r=document.getElementById(\'ex-r\');if(!r)return;\n'
  + 'function br(c){return (c/100).toFixed(2).replace(\'.\',\',\');}\n'
  + 'function set(id,w,cls,why){var e=document.getElementById(id);e.textContent=w;e.className=\'tag \'+cls;document.getElementById(id.replace(\'v\',\'w\')).textContent=why;}\n'
  + 'function go(){var c=Number(r.value),H=BigInt(c)*1000000n;document.getElementById(\'ex-h\').textContent=br(c);\n'
  + ' var b=E.find(function(e){return e.f===B;});\n'
  + ' if(H>=q(b.hi))set(\'ex-v1\',\'PROVADO\',\'held\',b.name+\': \'+b.lo.slice(0,4).replace(\'.\',\',\')+\' m, inteira abaixo\');\n'
  + ' else if(H<q(b.lo))set(\'ex-v1\',\'REFUTADO\',\'dep\',b.name+\' passa de \'+br(c)+\' m\');\n'
  + ' else set(\'ex-v1\',\'RECUSADO\',\'open\',\'H cai dentro da caixa do nível\');\n'
  + ' var over=E.filter(function(e){return H<q(e.lo);}),edge=E.filter(function(e){return H>=q(e.lo)&&H<q(e.hi);});\n'
  + ' if(over.length){over.sort(function(a,b){return q(b.lo)>q(a.lo)?1:-1;});set(\'ex-v2\',\'REFUTADO\',\'dep\',\'contraexemplo: \'+over[0].name+\', \'+over[0].lo.slice(0,4).replace(\'.\',\',\')+\' m\');}\n'
  + ' else if(edge.length)set(\'ex-v2\',\'RECUSADO\',\'open\',\'H cai dentro da caixa de \'+edge[0].name);\n'
  + ' else set(\'ex-v2\',\'PROVADO\',\'held\',\'as cinco ficam abaixo\');}\n'
  + 'r.addEventListener(\'input\',go);go();})();\n</script>';
const s6Text = C.p('Uma afirmação de projeto, “a onda de 100 anos não passa de H”, é decidida contra os níveis certificados. O veredito muda exatamente no limiar, que é publicado; abaixo dele, o contraexemplo é a distribuição que passa da altura.')
  + C.p('A mesma construção vale para cargas, janelas operacionais e critérios de norma: o limiar diz quanta margem sobra, ou quanto dado falta.');

/* ================================================================================================================
   7 · REPORTS THAT SAY WHAT EACH NUMBER IS WORTH — one return-level figure, drawn the usual way and in WARRANT
   ================================================================================================================ */
const TH = (f) => (f === 'gev' ? CPD.gev : CPD.fits[f]).theta.map(Number);
const qd = (T) => 24 / (T * L.conventions.hoursPerYear);   /* 1 − p for a daily block */
const QF = {
  expweibull: (T) => { const [a, k, lam] = TH('expweibull'); return lam * Math.pow(-Math.log(-Math.expm1(Math.log1p(-qd(T)) / a)), 1 / k); },
  gumbel: (T) => { const [m, b] = TH('gumbel'); return m - b * Math.log(-Math.log1p(-qd(T))); },
  gev: (T) => { const [m, s, x] = TH('gev'); return m + s / x * (Math.pow(-Math.log1p(-qd(T)), -x) - 1); },
};
need(L.conventions.hoursPerYear === 8766, 'the ledger\'s year is no longer 8,766 hours');
for (const f of Object.keys(QF)) for (const T of [10, 100, 1000]) { const e = rl(f, T); need(Math.abs(QF[f](T) - mid(e)) < 1e-6, 'the float return-level curve of ' + f + ' misses its certified level at ' + T + ' years'); }
const CUR = ['expweibull', 'gev', 'gumbel'];
function rlPanel(o, { x, y, w, h, warrant, short, H }) {
  const fr = CH.frame({ w, h, x0: 1, x1: 1000, y0: 4, y1: 8.5, padL: 40, padR: short ? 96 : 104, padT: 34, padB: 34, logX: true });
  const X = (t) => x + fr.px(t), Y = (v_) => y + fr.py(v_);
  for (const t of [4, 5, 6, 7, 8]) { o.push(ln(x + fr.L, Y(t), x + fr.L + fr.pw, Y(t), 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(CH.txt(x + fr.L - 8, Y(t) + 4, String(t), 't-ax', 'end')); }
  for (const t of [1, 10, 100, 1000]) o.push(CH.txt(X(t), y + h - 12, t + (t === 1000 && !short ? ' anos' : ''), 't-ax', t === 1000 && !short ? 'end' : 'middle'));
  if (short) o.push(CH.txt(x + w - 4, y + h - 12, 'anos', 't-note', 'end'));
  o.push(CH.txt(x + fr.L, y + 16, warrant ? 'depois: na gramática WARRANT' : 'antes: o gráfico de sempre', 't-lab', 'start'));
  const Ts = []; for (let i = 0; i <= 60; i++) Ts.push(Math.pow(10, 3 * i / 60));
  CUR.forEach((f, i) => {
    const d = Ts.map((t, j) => (j ? 'L' : 'M') + f1(X(t)) + ' ' + f1(Y(QF[f](t)))).join(' ');
    if (warrant) o.push('    <path d="' + d + '" ' + W.attrs(W.COMPUTED, { width: f === best ? 2.5 : 1.6 }) + (f === best ? '' : ' opacity="0.7"') + '/>');
    else o.push('    <path d="' + d + '" fill="none" stroke="' + CH.CAT[i] + '" stroke-width="2"/>');
    o.push(CH.txt(X(1000) + 6, Y(QF[f](1000)) + 4 + (f === 'gev' ? 8 : 0), FAM_S[f], f === best && !short ? 't-lab' : 't-note', 'start'));
  });
  if (warrant) {
    /* the decided knots, and the best family's statistical intervals as computed whiskers */
    for (const f of CUR) for (const T of [10, 100, 1000]) o.push('    <circle cx="' + f1(X(T)) + '" cy="' + f1(Y(mid(rl(f, T)))) + '" r="' + (f === best ? 4.5 : 3.2) + '" fill="var(--ink)" stroke="' + CH.SURFACE + '" stroke-width="1.5"/>');
    const sb = stat(best);
    o.push(ln(X(100), Y(Number(sb.l100[0])), X(100), Y(Number(sb.l100[1])), W.attrs(W.COMPUTED, { width: 1.6 })));
    o.push(ln(X(1000), Y(Number(sb.l1000[0])), X(1000), Y(Number(sb.l1000[1])), W.attrs(W.COMPUTED, { width: 1.6 })));
    o.push(ln(x + fr.L, Y(cpMax), x + fr.L + fr.pw, Y(cpMax), GUIDE));
    o.push(CH.txt(x + fr.L + 4, Y(cpMax) - 6, 'maior registrada', 't-note', 'start'));
    o.push('    <rect x="' + f1(x + fr.L + 4) + '" y="' + f1(Y(8.4)) + '" width="' + (short ? 150 : 170) + '" height="18" fill="url(#' + H.id + ')" class="w-void"/>');
    o.push('    <rect x="' + f1(x + fr.L + 8) + '" y="' + f1(Y(8.4) + 2) + '" width="' + (short ? 142 : 162) + '" height="14" fill="' + CH.SURFACE + '"/>');
    o.push(CH.txt(x + fr.L + 12, Y(8.4) + 13, '∅ gama gen.: recusada', 't-note', 'start'));
  }
}
function rlSvg({ w, short }) {
  const pw = short ? w : (w - 40) / 2, ph = short ? 300 : 330, h = short ? ph * 2 + 20 : ph;
  const H = hatch();
  const alt = 'O mesmo gráfico de níveis de retorno da Bacia de Campos desenhado duas vezes. Antes: três curvas sólidas iguais, sem dizer o que é decidido. Depois: as curvas tracejadas (calculadas em ponto flutuante), os níveis de 10, 100 e 1000 anos como pontos decididos, o intervalo estatístico tracejado, a maior onda registrada como referência e a gama generalizada recusada como vazio hachurado.';
  const o = [CH.open({ w, h, alt }), H.def];
  rlPanel(o, { x: 0, y: 0, w: pw, h: ph, warrant: false, short, H });
  rlPanel(o, { x: short ? 0 : pw + 40, y: short ? ph + 20 : 0, w: pw, h: ph, warrant: true, short, H });
  o.push(CH.close);
  return o.join('\n');
}
const s7Fig = C.figure({ record: HS, pins: false,
  svgRaw: dual(rlSvg({ w: 1000, short: false }), rlSvg({ w: 340, short: true })),
  captionRaw: 'Bacia de Campos, bloco diário: três distribuições, o mesmo gráfico duas vezes. À direita, o traço diz o que sustenta cada marca: sólido é decidido, tracejado é calculado, pontilhado é escolhido, e o recusado é um vazio com o motivo escrito. Funciona em tons de cinza e em impressora laser.'
    + legend([[LEG.dot, 'nível decidido'], [LEG.computed, 'curva ou intervalo calculado'], [LEG.guide, 'referência'], [voidSw(), 'recusado']]) });
const kit = C.code('import warrant_mpl as wm\nwm.use()                      # ou wm.use(\'grey\'): como a laser imprime\n\nwm.line(ax, T, hs, wm.COMPUTED)   # a curva ajustada: tracejada\nwm.knot(ax, 100, h100)            # o nível decidido: um ponto\nwm.void(ax, 0, 1, 7.6, 8.0, words=\'gama gen.: recusada\')');

/* ================================================================================================================
   THE FIGURES FROM THE OTHER INSTRUMENTS (apps/extremos/figs.js), captioned here
   ================================================================================================================ */
const fRl = C.figure({ record: [HS, F.WW3], pins: false,
  svgRaw: dual(F.rlEmpirical({ w: 1000, short: false, QF, best, FAM_S, rl, mid, stat, cpMax }), F.rlEmpirical({ w: 340, short: true, QF, best, FAM_S, rl, mid, stat, cpMax })),
  captionRaw: 'Bacia de Campos: os ' + v(int(F.nD), W.DECIDED, [DAY + '/n']) + ' máximos diários de 1993 a 2024; os ' + int(F.nPts) + ' maiores no seu período de retorno empírico, pela posição de plotagem de Weibull i/(n+1), escolhida. '
    + 'As curvas da Weibull exponenciada, da GEV e da Gumbel são calculadas em ponto flutuante a partir dos parâmetros certificados e passam, a menos de 10⁻⁶ m, pelos níveis decididos de 10, 100 e 1000 anos (os pontos). À direita dos 32 anos de registro, toda curva é extrapolação.'
    + legend([[sw('<circle cx="14" cy="6" r="2.2" fill="var(--ink)"/>'), 'máximo diário registrado'], [LEG.computed, 'curva ou intervalo calculado'], [LEG.dot, 'nível decidido'], [LEG.guide, 'fim do registro']]) });

const fBoard = C.figure({ record: F.DEC, pins: false,
  svgRaw: dual(F.board({ w: 1000, short: false }), F.board({ w: 340, short: true })),
  captionRaw: 'Uma rodada do registro de decisões, ' + esc(F.R.run.slice(8, 10) + '/' + F.R.run.slice(5, 7) + '/' + F.R.run.slice(0, 4)) + ', ' + esc(F.R.run.slice(11, 13)) + ' UTC, escolhida: em cada ponto de mar aberto e a cada passo de seis horas, pode começar ali uma operação de 48 horas com Hs ≤ 2,0 m? '
    + 'De ' + v(int(F.nL + F.nV + F.nI), W.DECIDED, [F.DEC + '#/sites']) + ' partidas que a previsão alcança, ' + v(int(F.nL), W.DECIDED, [F.DEC + '#/sites']) + ' são liberadas, ' + v(int(F.nV), W.DECIDED, [F.DEC + '#/sites']) + ' vetadas e ' + v(int(F.nI), W.DECIDED, [F.DEC + '#/sites']) + ' indefinidas.'
    + legend([[F.LEGS.lib, 'LIBERADA'], [F.LEGS.vet, 'VETADA'], [voidSw(), 'INDEFINIDA, ou além da previsão']]) });
const fTime = C.figure({ record: [F.LEDGER, F.DEC], pins: false,
  svgRaw: dual(F.timeline({ w: 1000, short: false }), F.timeline({ w: 340, short: true })),
  captionRaw: 'Potiguar, uma linha da semana acima: a faixa de previsão gravada no registro público antes do mar acontecer (as previsões do ECMWF e da NOAA, cada uma alargada pelo erro medido contra satélites neste ponto, unidas; afirma ' + (F.claim[1] - F.claim[0]) + ' em ' + F.claim[1] + '). '
    + 'As janelas são decididas de novo aqui, a partir da faixa do registro, e o build recusa a página se diferirem das que foram publicadas naquela manhã.'
    + legend([[LEG.computed, 'bordas da faixa (calculadas)'], [LEG.decided, 'limite'], [F.LEGS.lib, 'LIBERADA'], [voidSw(), 'INDEFINIDA, ou além da previsão']]) });

const Q2 = (q) => { const [n, d] = String(q).split('/'); return Number(n) / Number(d || 1); };
const CA = F.camposA, CAp = F.WK + '#/sites/campos/cells/' + F.key(F.AL.lim, F.AL.per).replace('/', '~1');
const climData = {};
for (const lim of F.LIMS) for (const per of F.PERS) climData[lim + '/' + per] = Object.fromEntries(F.wsites.map((s) => [s.id, F.WR.sites[s.id].cells[F.key(lim, per)].oplim.map((x) => [x[0], x[1]])]));
const climCtl = '<div class="ex-ctl" id="ex-clim-ctl" role="group" aria-label="Limite e duração da operação">'
  + '<span class="ex-ck">limite de Hs</span>' + F.LIMS.map((l) => '<button type="button" data-lim="' + l + '" aria-pressed="' + (l === F.AL.lim) + '">' + br(Number(l), 1) + ' m</button>').join('')
  + '<span class="ex-ck">duração</span>' + F.PERS.map((d) => '<button type="button" data-per="' + d + '" aria-pressed="' + (d === F.AL.per) + '">' + d + ' h</button>').join('') + '</div>';
const fClim = C.figure({ record: F.WK, pins: false,
  svgRaw: climCtl + '<div class="ex-clim">' + dual(F.climate({ w: 1000, short: false, lim: F.AL.lim, per: F.AL.per }), F.climate({ w: 340, short: true, lim: F.AL.lim, per: F.AL.per })) + '</div>',
  captionRaw: 'Seis bacias, ' + v('32', W.DECIDED, [F.WK + '#/hindcast']) + ' anos de hindcast WAVEWATCH III a cada 3 horas: em cada mês, a fração exata de horários de partida em que a operação encontra a sua janela, viáveis sobre determinados, escrita em porcentagem arredondada para baixo. Escolha o limite e a duração; nada é ajustado nem suavizado.'
    + legend(CH.SEQ.map((c, i) => [sw('<rect x="3" y="1" width="22" height="10" fill="' + c + '"/>'), (i === 4 ? '≥ 80 %' : (i * 20) + '–' + (i * 20 + 20) + ' %')])) });
const fAlpha = C.figure({ record: F.WK, pins: false, wide: false,
  svgRaw: dual(F.alphaFig({ w: 480, short: false }), F.alphaFig({ w: 330, short: true })),
  captionRaw: 'O mesmo registro, no ano todo, para 48 horas com Hs ≤ 2,0 m: o ponto cheio com o limite simples; o vazado com o limite de previsão reduzido pelo fator α da DNV (DNV-ST-N001), em Campos α = ' + v(br(Number(Q2(CA.alpha)), 2), W.DECIDED, [CAp + '/alpha']) + ' e o limite ' + v(br(Number(CA.opwfDec), 2) + ' m', W.DECIDED, [CAp + '/opwfDec']) + '.'
    + legend([[sw('<circle cx="14" cy="6" r="4.5" fill="var(--ink)"/>'), 'limite simples'], [sw('<circle cx="14" cy="6" r="4" fill="var(--sunk)" stroke="var(--ink)" stroke-width="2"/>'), 'limite × α']]) });

const fGrade = C.figure({ record: [F.LEDGER, F.DEF], pins: false,
  svgRaw: dual(F.graded({ w: 1000, short: false }), F.graded({ w: 340, short: true })),
  captionRaw: 'Potiguar, de ' + esc(F.TP[0].slice(8, 10) + '/' + F.TP[0].slice(5, 7)) + ' a ' + esc(F.TP[F.TP.length - 1].slice(8, 10) + '/' + F.TP[F.TP.length - 1].slice(5, 7)) + ' de 2026: cada passagem de satélite altímetro a até 100 km e 3 horas de um passo previsto, e a previsão mais recente para esse passo, gravada antes da passagem. '
    + 'Em todos os pontos até agora, o conjunto do ECMWF acertou ' + int(F.tot[0].k) + ' de ' + int(F.tot[0].n) + ' passagens e a faixa da decisão ' + int(F.tot[1].k) + ' de ' + int(F.tot[1].n) + '; cada acerto e cada erro é decidido de novo aqui em aritmética exata. A nota admite ou poda um previsor; nunca decide uma janela.'
    + legend([[sw('<rect x="9" y="1" width="10" height="10" fill="var(--ink-4)"/>'), 'previsão que acertou (calculada)'], [sw('<rect x="9.5" y="1.5" width="9" height="9" fill="none" stroke="var(--ink-3)"/>'), 'previsão que errou'], [sw('<circle cx="14" cy="6" r="3" fill="var(--ink)"/>'), 'altura medida pelo satélite']]) });

const lowTxt = F.low.map(([n, x]) => esc(n) + ' (×' + br(x.medianRatio, 2) + ')').join(', ');
const fCoast = C.figure({ record: [F.CASE, F.DEPTH, F.BEA, F.CMP], pins: false,
  svgRaw: dual(F.coast({ w: 1000, short: false }), F.coast({ w: 340, short: true })),
  captionRaw: 'O modelo da ilha de Florianópolis, o caso de um swell de ' + F.PER + ' s vindo de ' + F.DIR + '°, escolhido: cada vigésima quinta crista, uma linha de nível da fase calculada por um modelo linear de refração, onde a onda alcança a água. A costa é a máscara de mar do próprio modelo, numa grade de 60 m. '
    + 'O modelo é recusado a ' + F.EDGE_KM + ' km das bordas norte e sul, onde entra a onda plana sem refração; das 34 praias, ' + v(String(F.nCmp), W.DECIDED, [F.CMP + '#/readings/swell/byBeachLong']) + ' foram comparadas a uma solução de Boussinesq, e em três o modelo lê baixo: ' + lowTxt + '.'
    + legend([[LEG.computed, 'crista (calculada)'], [sw('<rect x="9" y="1" width="10" height="10" fill="var(--ink)"/>'), 'praia comparada'], [sw('<rect x="9.5" y="1.5" width="9" height="9" fill="var(--sunk)" stroke="var(--ink)"/>'), 'praia sem comparação'], [voidSw(), 'recusado']]) });

const climJs = '<script>\n(function(){\'use strict\';\nvar D=' + JSON.stringify(climData) + ',S=' + JSON.stringify(CH.SEQ) + ',L=' + JSON.stringify(F.AL.lim) + ',P=' + JSON.stringify(String(F.AL.per)) + ';\n'
  + 'var c=document.getElementById(\'ex-clim-ctl\');if(!c)return;\n'
  + 'function sh(k,n){var r=[0,.2,.4,.6,.8],s=0;for(var i=0;i<r.length;i++)if(k*10>=r[i]*10*n)s=i;return s;}\n'
  + 'function pc(k,n){return (Math.floor(1000*k/n)/10).toFixed(1).replace(\'.\',\',\');}\n'
  + 'function draw(){var d=D[L+\'/\'+P];document.querySelectorAll(\'.ex-clim [data-c]\').forEach(function(e){var a=e.getAttribute(\'data-c\').split(\',\'),x=d[a[0]][+a[1]];e.setAttribute(\'fill\',S[sh(x[0],x[1])]);});\n'
  + ' document.querySelectorAll(\'.ex-clim [data-t]\').forEach(function(e){var a=e.getAttribute(\'data-t\').split(\',\'),x=d[a[0]][+a[1]];e.textContent=pc(x[0],x[1]);});\n'
  + ' c.querySelectorAll(\'button\').forEach(function(b){b.setAttribute(\'aria-pressed\',String(b.getAttribute(\'data-lim\')===L||b.getAttribute(\'data-per\')===P));});}\n'
  + 'c.addEventListener(\'click\',function(ev){var b=ev.target.closest(\'button\');if(!b)return;if(b.dataset.lim)L=b.dataset.lim;if(b.dataset.per)P=b.dataset.per;draw();});draw();})();\n</script>';

/* ================================================================================================================
   THE PAGE
   ================================================================================================================ */
const STAND = { live: ['Disponível', 'dep'], dev: ['Em desenvolvimento', 'open'] };
const chip = (s) => C.tag(STAND[s][0], STAND[s][1]);
const head = (lab, title, stand) => '<div class="sec-head"><div class="lab">' + esc(lab) + '</div><h2>' + esc(title) + '</h2>' + (stand ? '<div class="ex-chips">' + [].concat(stand).map(chip).join('') + '</div>' : '') + '</div>';
const split = ({ id, lab, title, stand, textRaw, figRaw, flip }) => '<section' + (id ? ' id="' + id + '"' : '') + '>\n<div class="ex-split' + (flip ? ' flip' : '') + '">\n'
  + '<div class="ex-text">' + head(lab, title, stand) + '\n' + textRaw + '\n</div>\n'
  + '<div class="ex-fig">\n' + figRaw + '\n</div>\n</div>\n</section>';
const sec = ({ id, lab, title, stand, raw }) => '<section' + (id ? ' id="' + id + '"' : '') + '>\n' + head(lab, title, stand) + '\n' + raw + '\n</section>';
const panel = (k, title, raw, stand) => '<div class="ex-panel">' + '<div class="ex-ptop">' + (k ? '<span class="ex-pk">' + esc(k) + '</span>' : '<span></span>') + (stand ? chip(stand) : '') + '</div><h3>' + esc(title) + '</h3><p>' + raw + '</p></div>';
const col = (raw) => '<div class="col">' + raw + '</div>';
const twoCol = (a, b) => '<div class="ex-two">' + a + b + '</div>';

const KRAW = 'K(X) = m − Y·∇ℓ(m) + (I − Y·J(X))·(X − m) ⊂ int X';
const M1 = method([
  ['máximo certificado', esc(KRAW), 'Newton em ponto flutuante dá o candidato m; o operador de Krawczyk, avaliado em aritmética intervalar com arredondamento para fora sobre todos os dados, prova que a caixa X tem exatamente um zero do escore ∇ℓ, e a Hessiana é provada negativa definida em X. O zero é o máximo na caixa.'],
  ['nível de retorno', esc('z_T = F⁻¹(1 − b / (8766·T)),  b = 24 h no bloco diário'), 'Avaliado sobre toda a caixa X: o intervalo contém o nível de retorno de todo parâmetro da caixa. 8766 horas = 365,25 × 24, exato.'],
  ['aderência', esc('A² = −n − (1/n)·Σ (2i−1)·[ln F(x₍ᵢ₎) + ln(1 − F(x₍ₙ₊₁₋ᵢ₎))]'), 'Com Kolmogorov–Smirnov, o erro quadrático médio e o χ² (dados agrupados exatamente em racionais), cada critério é um intervalo. Somas de n termos com Sum2 (Ogita, Rump e Oishi, 2005), com o erro limitado e somado para fora.'],
  ['escolha', esc('sup A²(melhor) < inf A²(outra), para toda outra'), 'Senão: RECUSADO, com o empate nomeado. A decisão ordena a aritmética do critério nesta amostra; não é um teste entre modelos.'],
]);
const M2 = method([
  ['refutação', esc('inf ℓ(θ′) − sup ℓ(θ_software) > 0'), 'Um membro θ′ da mesma família com log-verossimilhança provadamente maior refuta o ajuste do software como máximo; o déficit é a diferença, um intervalo.'],
]);
const M3 = method([
  ['dígitos impressos', esc('p ± ½·10⁻ᵈ  para cada parâmetro impresso com d casas'), 'A caixa de parâmetros que os dígitos permitem; a verossimilhança e o nível de retorno são avaliados sobre ela inteira.'],
  ['suporte', esc('x ≤ γ  ⇒  f(x) = 0  ⇒  ℓ = −∞'), 'Numa distribuição de três parâmetros, um dado abaixo da localização impressa γ tem densidade zero: a tabela é decidida incompatível com os dados, sem ajuste nenhum.'],
]);
const M5 = method([
  ['dentro ou fora', esc('orient(a, b, p) = (b_x − a_x)(p_y − a_y) − (b_y − a_y)(p_x − a_x)'), 'O sinal de cada determinante é decidido exatamente (um filtro com limite de erro provado, e aritmética racional quando o filtro não decide); a regra par-ímpar do benchmark classifica cada hora DENTRO, FORA ou SOBRE.'],
  ['o esperado', esc('α = 1 / (T · 8766) = 1/175320,  n·α = 1  (total, T = 20 anos)'), 'Para um contorno total de 20 anos, a definição espera n·α horas fora; para IFORM, com β = Φ⁻¹(1 − α) = 4,38861…, a tabela 1 do benchmark é certificada.'],
]);
const M6 = method([
  ['veredito', esc('H ≥ sup z₁₀₀ ⇒ PROVADO;  H < inf z₁₀₀ ⇒ REFUTADO;  senão RECUSADO'), 'A comparação é feita em inteiros (BigInt, em unidades de 10⁻⁸ m), no navegador, contra as caixas certificadas.'],
]);
const M7 = method([
  ['janela', esc('LIBERADA ⇔ ∀k ∈ janela: sup faixa_k ≤ limite;   VETADA ⇔ ∃k: inf faixa_k > limite'), 'Senão INDEFINIDA, com o limiar que mudaria o veredito. Comparação racional exata, passo a passo da previsão; uma regra que limita algo que ninguém prevê (corrente, visibilidade) dá SEM DADOS.'],
  ['faixa', esc('faixa = previsão ± erro medido contra satélites  (afirma 9 em 10)'), 'A faixa é a afirmação de um previsor, não o mar: é gravada no registro público antes da passagem e conferida depois (abaixo).'],
]);
const M8 = method([
  ['viável', esc('viável(k) ⇔ ∀j ∈ [k, k + TR/3]: x_j · den ≤ num · 500'), 'Hs do hindcast como inteiro (bruto/500 m) e o limite como fração num/den: a comparação é entre inteiros. Uma janela com amostra faltando é indeterminada, contada à parte, nunca estimada.'],
  ['frequência', esc('p_mês = viáveis / determinadas  (fração exata)'), 'Com o fator α da DNV, o limite de previsão é α × limite; a mesma contagem dá a frequência sob a regra de planejamento.'],
]);
const M9 = method([
  ['acerto', esc('inf faixa ≤ Hs_satélite ≤ sup faixa'), 'Decidido em racionais para cada passagem a até 100 km e 3 horas; a contagem de acertos é comparada com a cobertura que o previsor afirma. Um previsor que não cumpre a própria cobertura deixa de ser admitido até ser recalibrado.'],
]);

/* ---- related pages: the other pages of this site on sea, wind, energy and the method, grouped; generic labels (the
   page names no group, project or person), each target checked to exist in site/ at build ---------------------------- */
const REL = [
  ['Mar e ondas', [
    ['instruments/return-level-atlas/', 'Atlas de níveis de retorno', 'cada célula do oceano, 1993–2024, com certificado', 'en'],
    ['instruments/return-level-check/', 'Conferência de um ajuste', 'certifique um ajuste a partir do seu arquivo, no navegador', 'en'],
    ['reports/return-levels.html', 'Níveis de retorno de Hs como certificados', 'o relatório completo da ferramenta 1', 'en'],
    ['instruments/contours/', 'Contornos ambientais', 'cada hora de mar contra cada contorno', 'en'],
    ['reports/ec-benchmark.html', 'O benchmark de contornos, decidido', 'os 150 contornos e as contagens publicadas', 'en'],
    ['reports/breaking-geometry.html', 'Ondas arrebentando no Mar Negro', 'a geometria de 16.369 eventos, número a número', 'en'],
    ['instruments/stereo-reach/', 'Vídeo estéreo de ondas', 'o orçamento de erro de um sistema de câmeras', 'en'],
  ]],
  ['Previsão, janelas e costa', [
    ['janela/', 'Janela', 'janelas operacionais offshore, decididas sobre a previsão', 'en'],
    ['janela/metodo/', 'Janela: o método', 'a faixa medida contra satélites e os vereditos', 'en'],
    ['swell/', 'Swell', 'o mar de Florianópolis, praia a praia', 'en'],
  ]],
  ['Vento e ar', [
    ['reports/glide-band.html', 'Anel de planeio como banda certificada', 'alcance com vento, num voo real', 'en'],
    ['apps/skyaudit/', 'SkyAudit', 'um dia de voos, reserva de energia decidida voo a voo', 'en'],
  ]],
  ['Energia e clima', [
    ['contraprova/', 'Contraprova', 'verificação independente de números de engenharia e de IA', 'pt'],
    ['decidivel/', 'Decidível', 'sísmica 4D para injeção de gás e CO₂, detectabilidade garantida', 'pt'],
    ['abatimento/', 'Registro de abatimento', 'potenciais de abatimento de emissões, sem dupla contagem', 'pt'],
  ]],
  ['Método', [
    ['grammar/', 'A gramática visual WARRANT', 'o que cada traço de um gráfico afirma', 'en'],
    ['verify/', 'Verify', 'conferência independente de afirmações de IA', 'en'],
    ['reports/rerun.html', 'O kit de reexecução', 'refaça qualquer veredito sem a nossa máquina', 'en'],
  ]],
];
for (const [, links] of REL) for (const [href] of links) need(fs.existsSync(path.join(ROOT, 'site', href.endsWith('/') ? href + 'index.html' : href)), 'a related page does not exist in site/: ' + href);
const related = '<div class="wide"><div class="ex-rel">' + REL.map(([g, links]) => '<div class="ex-relg"><div class="ex-pk">' + esc(g) + '</div><ul>'
  + links.map(([href, t, d, lang]) => '<li><a href="../' + C.escAttr(href) + '">' + esc(t) + ' →</a><span>' + esc(d) + (lang === 'en' ? ' <span class="ex-en">(em inglês)</span>' : '') + '</span></li>').join('')
  + '</ul></div>').join('') + '</div></div>';

const sections = [
  C.header({
    eyebrow: 'cert-machine · extremos metoceânicos',
    title: 'Extremos metoceânicos: métodos e ferramentas',
    deck: 'Ajuste de distribuições, níveis de retorno, contornos ambientais, janelas operacionais e transferência para a costa. Cada número é decidido em aritmética exata e acompanhado de um certificado matemático reexecutável; o que é apenas calculado ou estimado aparece marcado como tal.'
  }),
  '<div class="col ex-top"><p class="ex-jump"><a href="#ler">Leitura</a><a href="#ajuste">Ajustes</a><a href="#software">Software</a><a href="#tabelas">Tabelas</a><a href="#atlas">Atlas</a><a href="#contornos">Contornos</a><a href="#janelas">Janelas</a><a href="#clima">Climatologia</a><a href="#previsao">Previsões</a><a href="#costa">Costa</a><a href="#limiar">Limiar</a><a href="#relatorios">Relatórios</a><a href="#proximos">Em desenvolvimento</a><a href="#relacionadas">Relacionadas</a></p></div>',
  hero,
  stats,
  sec({ id: 'ler', lab: 'leitura', title: 'Três vereditos e quatro traços',
    raw: '<div class="wide"><div class="ex-panels three">'
      + panel('', 'PROVADO', 'A afirmação vale para todos os valores da caixa declarada; o certificado mostra por quê.')
      + panel('', 'REFUTADO', 'Não vale; o contraexemplo vem junto: a distribuição, a hora ou o parâmetro que a quebra.')
      + panel('', 'RECUSADO', 'Os dados ou a precisão não decidem; a resposta diz o que falta e o limiar que mudaria o veredito.')
      + '</div>' + legend([[LEG.decided, 'sólido: decidido'], [LEG.computed, 'tracejado: calculado (ponto flutuante, modelo, previsão)'], [sw('<line x1="2" y1="6" x2="26" y2="6" ' + W.attrs(W.CHOSEN, { width: 2 }) + '/>'), 'pontilhado: escolhido'], [voidSw(), 'hachura: recusado, com o motivo'], [LEG.wx, '×: contraexemplo exibido']]) + '</div>' }),
  sec({ id: 'ajuste', lab: 'ferramenta 1 · ajuste', title: 'Ajuste de distribuições e níveis de retorno', stand: 'live',
    raw: '<div class="ex-split"><div class="ex-text">' + s1Text + '</div><div class="ex-fig">' + s1Big + '</div></div>' + '<div class="ex-gap"></div>' + fRl + s1Fig + col(M1) }),
  split({ id: 'software', lab: 'ferramenta 2 · conferência de software', title: 'Conferência de ajustes de software', stand: 'live', textRaw: s2Text + M2, figRaw: s2Fig, flip: true }),
  split({ id: 'tabelas', lab: 'ferramenta 3 · tabelas publicadas', title: 'Conferência de tabelas publicadas', stand: 'live', textRaw: s3Text + M3, figRaw: s3Fig }),
  sec({ id: 'atlas', lab: 'ferramenta 4 · atlas global', title: 'Atlas global de níveis de retorno', stand: 'live',
    raw: col(C.p('Cada célula oceânica do hindcast global de 1993 a 2024, nas seis distribuições e na GEV, em blocos diário, semanal e mensal, com o mesmo certificado da ferramenta 1. No navegador, cada célula abre com a série, o histograma, os níveis de retorno e a decisão, e pode ser recertificada ali.'))
      + s4Fig + col(C.pRaw('<a href="../instruments/return-level-atlas/">Atlas no navegador →</a> <span class="ex-en">(em inglês)</span>')) }),
  split({ id: 'contornos', lab: 'ferramenta 5 · contornos ambientais', title: 'Conferência de contornos ambientais', stand: ['live', 'dev'], textRaw: s5Text + M5, figRaw: s5Fig, flip: true }),
  sec({ id: 'janelas', lab: 'ferramenta 6 · janelas operacionais', title: 'Janelas operacionais decididas', stand: 'live',
    raw: col(C.p('Para uma operação com limite publicado (uma norma, o procedimento do operador, um limite próprio), cada horário de partida é decidido sobre a faixa de previsão, cujo erro foi medido: LIBERADA, VETADA ou INDEFINIDA, e para a indefinida, o limiar que a viraria.')
      + feats([['Entrada:', 'o ponto, a operação (limites e duração) e a previsão com o seu erro medido.'], ['Saída:', 'a semana em janelas, o veredito de cada partida e o motivo, e o registro que confere a previsão.']]))
      + fBoard + fTime + col(M7) }),
  sec({ id: 'clima', lab: 'ferramenta 7 · climatologia de janelas', title: 'Com que frequência a janela abre', stand: 'live',
    raw: col(C.p('A mesma pergunta sobre o passado: em 32 anos de hindcast, em que fração dos horários de partida de cada mês a operação teria encontrado a sua janela. É uma contagem, não um ajuste: cada partida é viável ou não, e a frequência é uma fração exata de inteiros.'))
      + fClim
      + twoCol('<div class="ex-text">' + C.pRaw('Com o fator α da DNV, que reduz o limite para compensar o erro da previsão, a frequência cai. Em Campos, para 48 horas com Hs ≤ 2,0 m, o ano passa de '
        + v(F.pct(CA.oplim[12][0], CA.oplim[12][1]) + ' %', W.DECIDED, [CAp + '/oplim/12']) + ' para ' + v(F.pct(CA.opwfCells[12][0], CA.opwfCells[12][1]) + ' %', W.DECIDED, [CAp + '/opwfCells/12']) + ' das partidas.')
        + C.p('Um α melhor vem de uma previsão com erro medido menor: a mesma contagem diz quanto a operação ganharia.') + M8 + '</div>', '<div class="ex-fig">' + fAlpha + '</div>') }),
  sec({ id: 'previsao', lab: 'ferramenta 8 · previsões conferidas', title: 'Previsões conferidas contra satélites', stand: 'live',
    raw: col(C.p('Cada faixa de previsão é gravada num registro público antes de o mar acontecer; três dias depois, as passagens de satélites altímetros dão a nota. O previsor é admitido enquanto cumpre a cobertura que afirma.'))
      + fGrade + col(M9) }),
  sec({ id: 'costa', lab: 'ferramenta 9 · do largo à costa', title: 'Transferência do largo para a costa', stand: 'live',
    raw: col(C.p('A onda de mar aberto, já com a sua faixa medida, é levada à costa por um modelo linear de refração sobre a batimetria da carta náutica, praia a praia. O mapa é um retrato do modelo: as cristas são tracejadas, as bordas onde o modelo não vale ficam vazias, e cada praia mostra até onde o modelo foi comparado.')
      + feats([['Entrada:', 'a onda ao largo (altura, período, direção) e a batimetria.'], ['Saída:', 'altura, direção e arrebentação em cada ponto da costa, com o trecho recusado declarado.']]))
      + fCoast + col(C.pRaw('<a href="../swell/">O modelo em uso, praia a praia →</a> <span class="ex-en">(em inglês)</span>')) }),
  split({ id: 'limiar', lab: 'ferramenta 10 · limiar de decisão', title: 'O limiar que vira o veredito', stand: 'live', textRaw: s6Text + M6, figRaw: instrument }),
  sec({ id: 'relatorios', lab: 'ferramenta 11 · relatórios', title: 'Relatórios na gramática WARRANT', stand: 'live',
    raw: col(C.p('Num relatório comum, a curva ajustada, o nível certificado e o intervalo estatístico têm o mesmo traço. Na gramática WARRANT, o traço diz o que sustenta cada marca: sólido é decidido, tracejado é calculado, pontilhado é escolhido, e o recusado é um vazio com o motivo escrito. Funciona em tons de cinza e em impressão a laser.'))
      + s7Fig
      + '<div class="ex-kit"><div class="ex-kit-t"><h3>warrant-mpl, para matplotlib</h3>' + C.p('Aplica a gramática aos gráficos feitos em Python, para relatórios lidos em papel branco e impressos em laser monocromática. A validação de cores passa nas três formas de daltonismo.') + '</div>' + kit + '</div>' }),
  sec({ id: 'proximos', lab: 'em desenvolvimento', title: 'Em desenvolvimento',
    raw: '<div class="wide"><div class="ex-panels">'
      + panel('validação da base', 'Hindcast contra boias, com veredito', 'A concordância entre a reanálise e as medições como afirmação decidida: “o viés acima do percentil 99 é menor que 0,30 m nesta boia” sai PROVADO, REFUTADO ou RECUSADO, e um registro curto demais diz quantos anos a mais decidiriam.', 'dev')
      + panel('no seu ambiente', 'Verificador em Python', 'Um verificador sem dependências que roda onde estão os dados: os dados não saem, e sai um certificado de poucos kilobytes que qualquer pessoa reexecuta.', 'dev')
      + panel('contornos', 'Contornos Hs–Tp com certificado', 'A partir de um modelo conjunto e de um método (IFORM, ISORM ou outro), cada ponto do contorno com a garantia de que está na probabilidade declarada.', 'dev')
      + panel('cargas', 'Da onda de projeto à carga', 'A mesma decisão aplicada às cargas ambientais na estrutura, com o limiar entre subdimensionar e superdimensionar publicado.', 'dev')
      + '</div></div>' }),
  sec({ lab: 'garantias', title: 'O que acompanha cada número',
    raw: '<div class="wide"><div class="ex-panels">'
      + panel('1', 'Os dados ficam onde estão', 'O verificador vai até os dados. Dados confidenciais não saem do ambiente de quem os tem; sai o certificado.')
      + panel('2', 'Código independente', 'Nenhum código de quem fez a afirmação é executado: um erro no ajuste não consegue se autocertificar.')
      + panel('3', 'Reexecutável', 'Cada veredito vem com o comando que o refaz sem a nossa máquina: um revisor, um cliente ou um auditor chegam ao mesmo resultado.')
      + panel('4', 'Certificado matemático', 'Não é certificação de classe nem laudo regulatório: é uma prova que qualquer um confere. A incerteza estatística aparece sempre separada, marcada como calculada.')
      + '</div></div>' }),
  '<section id="relacionadas">\n' + head('mais', 'Páginas relacionadas') + '\n' + related + '\n'
    + col(C.pRaw('Contato: <a href="' + C.escAttr('mailto:' + CT.MAIL + '?subject=' + encodeURIComponent('Extremos')) + '"><span class="m">' + esc(CT.MAIL) + '</span></a>')) + '\n</section>',
];
let body = sections.join('\n\n');
body += CH.script() + instrumentJs + climJs;
need(!/\b(?:LabECO|AMEx|Petrobras|UFSC|Guimarães|Farina|Reis)\b/.test(body), 'it names a group, a project or a person (the operator\'s ruling: generic, no names)');
need(!/certifica[çc][aã]o(?! de classe)|certificadora/i.test(body), 'it says certificação or certificadora outside "não é certificação de classe" (offshore, those words are class societies and the regulator)');

const CSS = `/* /extremos/ (apps/extremos/build.js): /verify/'s rhythm, in tokens only */
.ex-n{display:none}
@media (max-width:680px){.ex-w{display:none}.ex-n{display:block}}
.page{--col-gap:calc(var(--s-7) + 1px)}
.ex-top + .wide{margin-top:var(--s-8)}
.ex-it{font-style:italic}
.ex-feat{list-style:none;margin:var(--s-4) 0 0;padding:0;display:flex;flex-direction:column;gap:var(--s-2)}
.ex-feat li{margin:0;padding:0;font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
.ex-feat li::before{content:none}
.ex-feat b{color:var(--ink);font-weight:var(--weight-medium)}
.ex-math{border-top:1px solid var(--rule);margin:var(--s-5) 0 0;padding-top:var(--s-4)}
.ex-mk{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin-bottom:var(--s-3)}
.ex-math dl{margin:0;display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-3)}
.ex-math dt{font-size:var(--text-small);font-weight:var(--weight-medium);color:var(--ink);margin:0}
.ex-math dd{margin:0;display:flex;flex-direction:column;gap:var(--s-1)}
.ex-math dd span{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
code.ex-f{display:block;font-family:var(--f-mono);font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink);background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-s);padding:var(--s-2) var(--s-3);overflow-x:auto;white-space:pre-wrap;word-break:break-word}
.ex-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2);margin:0 0 var(--s-4)}
.ex-ck{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin-right:var(--s-1)}
.ex-ck + button{margin-left:0}
.ex-ctl button{font:inherit;font-size:var(--text-small);color:var(--ink-2);background:transparent;border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-1) var(--s-3);cursor:pointer}
.ex-ctl button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.ex-ctl button + .ex-ck{margin-left:var(--s-4)}
.ex-gap{height:var(--s-6)}
.col > .ex-feat{margin-bottom:var(--s-6)}
.ex-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-6) var(--col-gap);align-items:start;margin-top:var(--s-6)}
@media (max-width:1023px){.ex-two{grid-template-columns:minmax(0,1fr)}}
.ex-rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--s-5) var(--col-gap);align-items:start}
.ex-relg{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-3)}
.ex-relg ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-3)}
.ex-relg li{margin:0;padding:0;display:flex;flex-direction:column;gap:var(--s-1)}
.ex-relg li::before{content:none}
.ex-relg li > a{align-self:flex-start}
.ex-relg li > span{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
.ex-jump{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-4);margin:var(--s-5) 0 0;font-size:var(--text-small);color:var(--ink-4)}

.ex-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-6) var(--col-gap);align-items:center}
.ex-split.flip > .ex-text{order:2}
.ex-text > p{font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3)}
.ex-text .sec-head{margin-bottom:var(--s-5)}
.ex-chips{display:flex;flex-wrap:wrap;gap:var(--s-2);margin-top:var(--s-3)}
.sec-head .ex-chips{margin-bottom:0}
.ex-fig figcaption{margin-bottom:0}
.ex-text > p.ex-big{font-family:var(--f-display);font-size:calc(var(--text-1) * 1.25);line-height:var(--leading-tight);letter-spacing:var(--track-display);font-weight:var(--weight-title);color:var(--ink);margin:0;padding-bottom:var(--s-1)}
.ex-text > p.ex-big-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:var(--s-4) 0 var(--s-5);line-height:var(--leading-snug)}
.ex-en{font-size:var(--text-small);color:var(--ink-4)}
.ex-tab .wide{margin:0}
.ex-cap{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3);margin:var(--s-3) 0 0}
@media (max-width:1023px){.ex-split{grid-template-columns:minmax(0,1fr)}.ex-split.flip > .ex-text{order:0}}
ul.ex-leg.w-legend{list-style:none;display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:var(--s-3) 0 0;padding:0;max-width:none}
.ex-leg li{display:inline-flex;align-items:center;gap:var(--s-2);margin:0;padding:0;font-size:var(--text-small);color:var(--ink-3)}
.ex-leg li::before{content:none}
ul.ex-leg svg.ex-sw{width:calc(var(--s-6) + var(--s-1));height:var(--s-4);flex:none;display:inline-block;overflow:visible}
.ex-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5) var(--col-gap)}
.ex-panels.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.ex-panel{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-3)}
.ex-panel h3{margin:0}
.ex-panel p{margin:0;font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3)}
.ex-ptop{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--s-2) var(--s-3)}
.ex-pk{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4)}
@media (max-width:860px){.ex-panels,.ex-panels.three{grid-template-columns:minmax(0,1fr)}}
.ex-ins{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-4)}
.ex-claim{margin:0;font-size:var(--text-3);line-height:var(--leading-body);color:var(--ink)}
.ex-claim b{font-family:var(--f-mono);font-weight:var(--weight-medium)}
.ex-ins input[type=range]{width:100%;accent-color:var(--ink)}
.ex-out{display:flex;flex-direction:column;gap:var(--s-3)}
.ex-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--s-1) var(--s-3);align-items:center;border-top:1px solid var(--rule);padding-top:var(--s-3)}
.ex-row .ex-k{font-size:var(--text-small);color:var(--ink-3)}
.ex-row .ex-why{grid-column:1 / -1;font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2)}
.ex-thr{margin:0;font-size:var(--text-small);color:var(--ink-3)}
.ex-kit{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:var(--s-5) var(--col-gap);align-items:start;margin-top:var(--s-6)}
.ex-kit h3{margin:0 0 var(--s-3)}
.ex-kit p{font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3);margin:0}
.ex-kit pre.code{margin:0}
@media (max-width:860px){.ex-kit{grid-template-columns:minmax(0,1fr)}}
`;
const foot = '<p>Página em português para conversas sobre extremos metoceânicos. Cada número dela é lido de um registro público deste repositório; nada nela é ao vivo. MIT.</p>';
let html = TPL.render({ title: 'Extremos metoceânicos, decididos · cert-machine', bodyRaw: body, footRaw: foot, cssRaw: CSS, lang: 'pt-BR',
  desc: 'Ferramentas para extremos de onda, vento e corrente: ajustes de distribuição decididos em aritmética exata, conferência de software e de tabelas publicadas, um atlas global, contornos ambientais e relatórios na gramática WARRANT.',
  path: '/extremos/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
need(/name="robots" content="noindex/.test(html), 'it carries no noindex (it is unlisted)');
/* the marketing rule (design/marketing.js): a value's tooltip says its standing's word, not its reason */
html = html.replace(/(<span class="w-val (w-(decided|computed|chosen|refused))\b[^"]*"[^>]*?) title="[^"]*"/g, (m0, pre, cls, st) => pre + ' title="' + WORD[W[st.toUpperCase()]] + '"');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/extremos/index.html written (unlisted, ' + Math.round(html.length / 1024) + ' KB): Campos ' + FAM[best] + ' ' + br(mid(rl(best, 100)), 2) + ' m; atlas ' + int(atlasFits) + ' fits; contours ' + ecRows);
