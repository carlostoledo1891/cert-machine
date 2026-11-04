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
  + C.p('Quando o bloco muda, o vencedor pode mudar. A tabela abaixo mostra cada decisão: nenhuma é um arredondamento.') + '</div>';
const s1Text = C.p('Ajustamos as seis distribuições usuais de extremos, e a GEV, à sua série. Cada máximo de verossimilhança vem com uma prova: uma caixa em que existe exatamente um máximo, e nenhum outro fora dela. Os critérios de aderência são calculados em intervalos, e a escolha só sai quando a melhor distribuição fica inteira abaixo de todas as outras.')
  + C.p('Quando a escolha não pode ser decidida, a resposta é RECUSADO, dizendo quais distribuições empatam. Quando uma família não tem máximo, como a gama generalizada em três dos quatro blocos de Campos, isso é provado, e ela não entra na disputa.');
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
  + C.p('Bibliotecas de ajuste param quando o otimizador para, não quando o máximo é atingido. Com a localização livre, a verossimilhança nem tem máximo, e o número que sai depende do ponto de partida.')
  + C.p('Conferimos a saída do seu software, ou qualquer ajuste publicado: os parâmetros entram, e sai PROVADO (é o máximo), REFUTADO (com o membro mais verossímil exibido) ou RECUSADO (a precisão impressa não decide).')
  + C.pRaw('<a href="../instruments/return-level-check/">Confira um ajuste no navegador →</a> <span class="ex-en">(em inglês; nada sai da sua máquina)</span>');

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
  + C.p('Tabelas de projeto, relatórios e artigos imprimem parâmetros com três ou quatro dígitos. Decidimos o que esses dígitos realmente afirmam sobre os seus dados: se o ajuste é o máximo, se fica abaixo dele, se nem pertence ao suporte da distribuição.')
  + C.p('Funciona com a tabela de um fornecedor, de um consultor ou de um artigo: o resultado é a distância entre dois registros, nunca uma acusação.');

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
const s4Fig = C.figure({ record: ATL, pins: false, svgRaw: mapSvg(),
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
  + C.p('Cada hora observada é classificada dentro, fora ou sobre o contorno em aritmética exata. Também conferimos a geometria: de ' + int(ecRows) + ' contornos submetidos ao benchmark, '
    + int(ecOpen) + ' não fecham e ' + int(ecCross) + ' cruzam a si mesmos.')
  + C.p('Hoje: a auditoria de qualquer contorno, o seu ou o de um fornecedor. Em desenvolvimento: contornos Hs–Tp com certificado, a partir do seu modelo conjunto e do seu método (IFORM, ISORM ou outro).');

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
const s6Text = C.p('Uma afirmação de projeto vira uma pergunta com resposta. Arraste a altura: o veredito muda exatamente no limiar, e o limiar é publicado. Abaixo dele, a resposta vem com o contraexemplo: a distribuição que passa da altura.')
  + C.p('O mesmo vale para uma carga, uma janela operacional ou um critério de norma: o número que inverte o veredito diz quanto dado falta, ou quanta margem sobra.');

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
   THE PAGE
   ================================================================================================================ */
const STAND = { live: ['Disponível', 'dep'], dev: ['Em desenvolvimento', 'open'] };
const chip = (s) => C.tag(STAND[s][0], STAND[s][1]);
const split = ({ id, lab, title, stand, textRaw, figRaw, flip }) => '<section' + (id ? ' id="' + id + '"' : '') + '>\n<div class="ex-split' + (flip ? ' flip' : '') + '">\n'
  + '<div class="ex-text"><div class="sec-head"><div class="lab">' + esc(lab) + '</div><h2>' + esc(title) + '</h2>' + (stand ? '<div class="ex-chips">' + [].concat(stand).map(chip).join('') + '</div>' : '') + '</div>\n' + textRaw + '\n</div>\n'
  + '<div class="ex-fig">\n' + figRaw + '\n</div>\n</div>\n</section>';
const sec = ({ id, lab, title, stand, raw }) => '<section' + (id ? ' id="' + id + '"' : '') + '>\n<div class="sec-head"><div class="lab">' + esc(lab) + '</div><h2>' + esc(title) + '</h2>' + (stand ? '<div class="ex-chips">' + chip(stand) + '</div>' : '') + '</div>\n' + raw + '\n</section>';
const panel = (k, title, raw, stand) => '<div class="ex-panel">' + '<div class="ex-ptop">' + (k ? '<span class="ex-pk">' + esc(k) + '</span>' : '<span></span>') + (stand ? chip(stand) : '') + '</div><h3>' + esc(title) + '</h3><p>' + raw + '</p></div>';
const MAILTO = (subject) => 'mailto:' + CT.MAIL + '?subject=' + encodeURIComponent(subject);
const cta = '<div class="ex-cta"><a class="ex-btn" href="' + C.escAttr(MAILTO('Extremos — uma tabela para conferir')) + '">Envie uma tabela para conferir →</a>'
  + '<a class="ex-btn ghost" href="' + C.escAttr(MAILTO('Extremos')) + '"><span class="m">' + esc(CT.MAIL) + '</span></a></div>';

const sections = [
  C.header({
    eyebrow: 'cert-machine · extremos de onda, vento e corrente',
    title: 'Qual onda de 100 anos você assina?',
    deck: 'Na Bacia de Campos, os mesmos ' + cpYears + ' anos de hindcast dão de ' + br(mid(lowF), 2) + ' a ' + br(mid(highF), 2) + ' m, conforme a distribuição. '
      + 'Nossas ferramentas decidem essa escolha em aritmética exata e entregam, com cada número de projeto, um certificado matemático que qualquer pessoa reexecuta.'
  }),
  '<div class="col ex-top">' + cta + '<p class="ex-jump"><a href="#ajuste">Ajustes</a><a href="#tabelas">Tabelas</a><a href="#atlas">Atlas</a><a href="#contornos">Contornos</a><a href="#limiar">Limiar</a><a href="#relatorios">Relatórios</a><a href="#proximos">Em desenvolvimento</a></p></div>',
  hero,
  stats,
  sec({ lab: 'três palavras', title: 'Toda resposta é uma de três',
    raw: '<div class="wide"><div class="ex-panels three">'
      + panel('', 'PROVADO', 'A afirmação vale para todos os valores da caixa declarada, e o certificado mostra por quê.')
      + panel('', 'REFUTADO', 'Não vale, e o contraexemplo vem junto: a distribuição, a hora ou o parâmetro que a quebra.')
      + panel('', 'RECUSADO', 'Os dados não decidem. A resposta diz o que falta e o limiar que mudaria o veredito.')
      + '</div></div>' }),
  '<section id="ajuste">\n<div class="ex-split">\n<div class="ex-text"><div class="sec-head"><div class="lab">solução 1 · ajustes</div><h2>A distribuição certa, decidida</h2><div class="ex-chips">' + chip('live') + '</div></div>\n' + s1Text + '\n</div>\n<div class="ex-fig">' + s1Big + '</div>\n</div>\n' + s1Fig + '\n</section>',
  split({ lab: 'solução 2 · conferência de software', title: 'O seu software parou antes do máximo?', stand: 'live', textRaw: s2Text, figRaw: s2Fig, flip: true }),
  split({ id: 'tabelas', lab: 'solução 3 · tabelas publicadas', title: 'O que os dígitos impressos afirmam', stand: 'live', textRaw: s3Text, figRaw: s3Fig }),
  sec({ id: 'atlas', lab: 'solução 4 · atlas global', title: 'Qualquer ponto do oceano, já certificado', stand: 'live',
    raw: '<div class="col">' + C.p('Cada célula oceânica do hindcast global de 1993 a 2024, nas seis distribuições e na GEV, em blocos diário, semanal e mensal. Clique numa célula: os dados, o histograma, os níveis de retorno e a decisão abrem no navegador, e qualquer célula pode ser recertificada ali mesmo.') + '</div>'
      + s4Fig + '<div class="col">' + C.pRaw('<a href="../instruments/return-level-atlas/">Abra o atlas →</a> <span class="ex-en">(em inglês)</span>') + '</div>' }),
  split({ id: 'contornos', lab: 'solução 5 · contornos ambientais', title: 'Contornos conferidos hora a hora', stand: ['live', 'dev'], textRaw: s5Text, figRaw: s5Fig, flip: true }),
  split({ id: 'limiar', lab: 'solução 6 · decisão de projeto', title: 'O número que vira o veredito', stand: 'live', textRaw: s6Text, figRaw: instrument }),
  sec({ id: 'relatorios', lab: 'solução 7 · relatórios', title: 'Gráficos que dizem quanto cada número vale', stand: 'live',
    raw: '<div class="col">' + C.p('Num relatório comum, a curva ajustada, o nível certificado e o intervalo estatístico têm o mesmo traço. Na gramática WARRANT, o traço carrega o que sustenta cada marca, e quem lê sabe na hora o que foi provado e o que foi estimado.') + '</div>'
      + s7Fig
      + '<div class="ex-kit"><div class="ex-kit-t"><h3>Uma linha no seu matplotlib</h3>' + C.p('O kit warrant-mpl aplica a gramática aos gráficos que vocês já fazem em Python, para relatórios lidos em papel branco e impressos em laser monocromática. A validação de cores passa nas três formas de daltonismo.') + '</div>' + kit + '</div>' }),
  sec({ id: 'proximos', lab: 'em desenvolvimento', title: 'O que vem a seguir',
    raw: '<div class="wide"><div class="ex-panels">'
      + panel('validação da base', 'Hindcast contra boias, com veredito', 'A concordância entre a base de reanálise e as medições vira uma afirmação decidida: “o viés acima do percentil 99 é menor que 0,30 m nesta boia” sai PROVADO, REFUTADO ou RECUSADO, e um registro curto demais diz quantos anos a mais decidiriam.', 'dev')
      + panel('no seu pipeline', 'O verificador em Python, onde estão os dados', 'Um verificador sem dependências que roda dentro do seu ambiente: os dados ficam com vocês, e sai um certificado de poucos kilobytes que qualquer pessoa reexecuta.', 'dev')
      + panel('contornos', 'Contornos Hs–Tp com certificado', 'O seu modelo conjunto e o seu método, e cada ponto do contorno com a garantia de que está na probabilidade declarada.', 'dev')
      + panel('cargas', 'Da onda de projeto à carga', 'A mesma decisão aplicada às cargas ambientais na estrutura: o limiar publicado entre subdimensionar e superdimensionar.', 'dev')
      + '</div></div>' }),
  sec({ lab: 'como funciona', title: 'O que acompanha cada número',
    raw: '<div class="wide"><div class="ex-panels">'
      + panel('1', 'Os dados ficam com vocês', 'O verificador vai até os dados, e não o contrário. Dados confidenciais nunca saem do seu ambiente; o certificado sai.')
      + panel('2', 'Código escrito à parte', 'Nada do código de quem fez a afirmação é executado. Um erro no ajuste não consegue se autocertificar.')
      + panel('3', 'Reexecutável por qualquer pessoa', 'Cada veredito volta com um comando que o refaz sem a nossa máquina: um revisor, um cliente ou um auditor chegam ao mesmo resultado.')
      + panel('4', 'Um certificado matemático', 'Não é certificação de classe nem laudo regulatório: é uma prova que qualquer um confere. Incerteza estatística aparece sempre separada, rotulada como calculada.')
      + '</div></div>' }),
  '<section id="contato">\n<div class="ex-close">\n<div class="sec-head"><div class="lab">comece por um caso</div><h2>Traga uma tabela. Devolvemos o certificado.</h2></div>\n'
    + C.p('Uma tabela de projeto, um ajuste do seu software ou um contorno. Antes de rodar qualquer coisa, você recebe o escopo: o que pode ser decidido, o que será recusado e por quê.')
    + cta + '</div>\n</section>',
];
let body = sections.join('\n\n');
body += CH.script() + instrumentJs;
need(!/\b(?:LabECO|AMEx|Petrobras|UFSC|Guimarães|Farina|Reis)\b/.test(body), 'it names a group, a project or a person (the operator\'s ruling: generic, no names)');
need(!/certifica[çc][aã]o(?! de classe)|certificadora/i.test(body), 'it says certificação or certificadora outside "não é certificação de classe" (offshore, those words are class societies and the regulator)');

const CSS = `/* /extremos/ (apps/extremos/build.js): /verify/'s rhythm, in tokens only */
.ex-n{display:none}
@media (max-width:680px){.ex-w{display:none}.ex-n{display:block}}
.page{--col-gap:calc(var(--s-7) + 1px)}
.ex-top + .wide{margin-top:var(--s-8)}
.ex-cta{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-3) var(--s-4);margin:var(--s-6) 0 0}
a.ex-btn{display:inline-flex;align-items:center;gap:var(--s-2);padding:var(--s-3) var(--s-5);border:1px solid var(--ink);border-radius:var(--radius-m);background:var(--ink);color:var(--paper);font-weight:var(--weight-medium);font-size:var(--text-body);line-height:var(--leading-snug);transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
a.ex-btn:hover{background:var(--ink-2);border-color:var(--ink-2)}
a.ex-btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule-strong)}
a.ex-btn.ghost:hover{border-color:var(--ink);background:transparent}
a.ex-btn .m{font-family:var(--f-mono);font-size:var(--text-small)}
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
.ex-close{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5)}
.ex-close h2{max-width:var(--title)}
.ex-close > p{max-width:var(--read);font-size:var(--text-3);line-height:var(--leading-body);color:var(--ink-3);margin:var(--s-4) 0 0}
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
