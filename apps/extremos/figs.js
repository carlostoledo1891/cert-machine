/* figs.js — the figures of /extremos/ that come from the other instruments' records, in Portuguese.
   apps/extremos · cert-machine · 2026-11-04

   Drawn here (the operator, 2026-11-04: "more visual elements and possibilities, like the Grammar page … the Swell style
   maps? Janela? … stronger in both Math and Visualization"), each from its record, read at build and guarded by
   build.js's need():
     rlEmpirical   the Campos daily maxima at their plotting positions under the fitted return-level curves
                   (corpus/ww3-points through instruments/hseva/blocks.js; certs/hseva-ledger.json)
     board         a week of decided operating windows at the open-sea sites (certs/janela-decisions/)
     timeline      one of those rows over the band it was decided on, decided again here (certs/janela-ledger/)
     climate       how often a window opens, month by month, counted exactly over 32 years, and what DNV's alpha
                   factor does to it (certs/janela-workability.json)
     graded        two forecasts against the satellite passes that came later (certs/janela-ledger/)
     coast         Swell's island model: a swell's crests refracted round Florianópolis (apps/swell/data/)
     atlasWorld    the global atlas with Natural Earth's land under it (certs/hseva-atlas.json, corpus/basemap/)
   The shared drawing helpers are /grammar/'s (tools/grammar-scenes/maps.js and routes-time.js export them): one coast
   reader, one marching-squares contour, one PNG reader, one ledger reader. MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const MAPS = require(path.join(ROOT, 'tools', 'grammar-scenes', 'maps.js')).helpers;
const RT = require(path.join(ROOT, 'tools', 'grammar-scenes', 'routes-time.js')).helpers;
const D = require(path.join(ROOT, 'instruments', 'window', 'decide.js'));
const BL = require(path.join(ROOT, 'instruments', 'hseva', 'blocks.js'));
const { Q, qf, runsOf, dayOf } = RT;

module.exports = function figs(K) {
  const { need, br, int, v, hatch, f1, ln, legend, sw, LEG, voidSw, dual, GUIDE, esc } = K;
  const rect = (x, y, w, h, a) => '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" ' + a + '/>';
  const pathEl = (d, a) => '    <path d="' + d + '" ' + a + '/>';
  const dot = (x, y, r, a) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" ' + a + '/>';
  const pathD = (pts) => pts.map(([x, y], i) => (i ? 'L' : 'M') + f1(x) + ',' + f1(y)).join('');
  const T = (x, y, s, cls, anchor) => CH.txt(x, y, s, cls || 't-note', anchor || 'start');
  /* a chosen input named in italic, as /grammar/ names one */
  const ital = (x, y, s, anchor) => '    <text x="' + f1(x) + '" y="' + f1(y) + '" class="t-note ex-it"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>';
  const voidR = (h, x, y, w, hh) => rect(x, y, w, hh, 'class="w-void" fill="url(#' + h.id + ')" stroke="var(--rule-strong)" stroke-width="1"');
  /* a verdict's body, by shape: LIBERADA filled, VETADA outlined (both decided, so the edge is solid), INDEFINIDA a void */
  const FILLED = 'class="w-decided" fill="var(--ink-3)" stroke="var(--ink-3)" stroke-width="1"';
  const OUTLINED = 'class="w-decided" fill="none" stroke="var(--ink-2)" stroke-width="1.4"';
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const pct = (k, n) => br(Math.floor(1000 * k / n) / 10, 1);      /* an exact fraction, printed rounded down */
  const LEGS = {
    lib: sw('<rect x="3" y="2" width="22" height="8" ' + FILLED + '/>'),
    vet: sw('<rect x="3.7" y="2.7" width="20.6" height="6.6" ' + OUTLINED + '/>'),
  };

  /* =============================================================================================================
     1 · THE DATA UNDER THE CURVES — the 11,688 daily maxima at Campos, each at its empirical return period, under the
     three fitted curves; the decided levels as knots. A plotting position is a convention (Weibull's i/(n+1)), named.
     ============================================================================================================= */
  const HS = 'certs/hseva-ledger.json', WW3 = 'corpus/ww3-points/meta.json';
  const L = JSON.parse(fs.readFileSync(path.join(ROOT, HS), 'utf8'));
  const CPD = L.ww3.points.campos.blocks.daily;
  const S = BL.ww3Series('campos'), M = BL.blockMaxima(S, 'daily');
  need(M.n === CPD.n && Math.max(...M.x) === Number(CPD.max), 'the daily maxima read from the hindcast are not the ones the ledger fitted (count or largest)');
  const xs = M.x.slice().sort((a, b) => b - a), nD = xs.length, DPY = 8766 / 24;
  const Tof = (i) => (nD + 1) / ((i + 1) * DPY);                  /* the (i+1)-th largest: exceeded i+1 times in n+1 days */
  const pts = []; for (let i = 0; i < nD && Tof(i) >= 0.1; i++) pts.push([Tof(i), xs[i]]);
  need(pts.length > 200 && Tof(0) > 30 && Tof(0) < 34, 'the plotting positions no longer span a tenth of a year to the record\'s 32 years');
  function rlEmpirical({ w, short, QF, best, FAM_S, rl, mid, stat, cpMax }) {
    const h = short ? 380 : 420;
    const fr = CH.frame({ w, h, x0: 0.1, x1: 1000, y0: 2.5, y1: 8.5, padL: 44, padR: short ? 92 : 132, padT: 40, padB: 40, logX: true });
    const Hh = hatch();
    const o = [CH.open({ w, h, alt: 'Bacia de Campos: os ' + int(nD) + ' máximos diários de 1993 a 2024, os ' + int(pts.length) + ' maiores desenhados no seu período de retorno empírico (posição i/(n+1)), sob as curvas de nível de retorno de três distribuições ajustadas. As curvas são calculadas em ponto flutuante e passam pelos níveis decididos de 10, 100 e 1000 anos. Além de 32 anos, nenhum dado sustenta as curvas: é extrapolação.' }), Hh.def];
    const yt = short ? [3, 5, 7] : [3, 4, 5, 6, 7, 8];
    for (const t of yt) { o.push(ln(fr.L, fr.py(t), fr.L + fr.pw, fr.py(t), 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(T(fr.L - 8, fr.py(t) + 4, String(t), 't-ax', 'end')); }
    for (const t of [0.1, 1, 10, 100, 1000]) o.push(T(fr.px(t), h - 18, br(t, t < 1 ? 1 : 0), 't-ax', 'middle'));
    o.push(T(fr.L + fr.pw, h - 4, 'período de retorno (anos)', 't-note', 'end'));
    o.push(T(fr.L - 36, 22, 'Hs (m)', 't-note', 'start'));
    /* the stretch no datum reaches: past the record's 32 years every curve is an extrapolation */
    const xr = fr.px(Tof(0));
    o.push(ln(xr, fr.T, xr, fr.T + fr.ph, GUIDE));
    o.push(T(xr + 6, fr.T + 14, short ? 'além dos dados' : 'além dos 32 anos de dados: extrapolação', 't-note', 'start'));
    /* the data, decided: each a record value at a stated plotting position */
    const Ts = []; for (let i = 0; i <= 80; i++) Ts.push(Math.pow(10, -1 + 4 * i / 80));
    const CUR = ['expweibull', 'gev', 'gumbel'];
    CUR.forEach((f) => {
      const d = Ts.map((t, j) => (j ? 'L' : 'M') + f1(fr.px(t)) + ' ' + f1(fr.py(QF[f](t)))).join(' ');
      o.push('    <path d="' + d + '" ' + W.attrs(W.COMPUTED, { width: f === best ? 2.6 : 1.6 }) + (f === best ? '' : ' opacity="0.75"') + '/>');
      const yEnd = fr.py(QF[f](1000));
      o.push(T(fr.px(1000) + 6, yEnd + 4 + (f === 'gev' ? 9 : f === 'gumbel' ? -4 : 0), FAM_S[f], f === best ? 't-lab' : 't-note', 'start'));
    });
    for (const f of CUR) for (const t of [10, 100, 1000]) o.push(dot(fr.px(t), fr.py(mid(rl(f, t))), f === best ? 4.5 : 3.2, 'class="w-decided" fill="var(--ink)" stroke="' + CH.SURFACE + '" stroke-width="1.5"'));
    const sb = stat(best);
    o.push(ln(fr.px(100), fr.py(Number(sb.l100[0])), fr.px(100), fr.py(Number(sb.l100[1])), W.attrs(W.COMPUTED, { width: 1.6 })));
    o.push(ln(fr.px(1000), fr.py(Number(sb.l1000[0])), fr.px(1000), fr.py(Number(sb.l1000[1])), W.attrs(W.COMPUTED, { width: 1.6 })));
    /* the data last, over the curves: each a record value at its stated plotting position, ringed in the ground */
    const dd = pts.map(([t, x]) => 'M' + f1(fr.px(t)) + ',' + f1(fr.py(x)) + 'h0').join('');
    o.push(pathEl(dd, 'fill="none" stroke="' + CH.SURFACE + '" stroke-width="' + (short ? 5.4 : 6.4) + '" stroke-linecap="round"'));
    o.push(pathEl(dd, 'class="w-decided" fill="none" stroke="var(--ink)" stroke-width="' + (short ? 3.4 : 4.2) + '" stroke-linecap="round"'));
    o.push(ital(fr.L + fr.pw, 22, short ? 'posição i/(n+1)' : 'dado a posição de plotagem de Weibull, i/(n+1)', 'end'));
    o.push(CH.close);
    return o.join('\n');
  }

  /* =============================================================================================================
     2 · A WEEK OF WINDOWS — Janela's decision record for one run: at each open-sea site and each six-hour start, can a
     48-hour launch (Hs ≤ 2,0 m) start then, decided over the forecast's measured band
     ============================================================================================================= */
  const DEC = 'certs/janela-decisions/20261023.json';
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, DEC), 'utf8'));
  const OP = 'lancamento', NS = R.t.length, ci = R.crits.indexOf('band');
  const pre = R.presets.find((p) => p.id === OP), needS = Math.ceil(pre.TR / 6);
  const NAME = { 'foz-amazonas': 'Foz do Amazonas', potiguar: 'Potiguar', sergipe: 'Sergipe', 'espirito-santo': 'Espírito Santo', 'campos-p25': 'Campos, plataforma',
    campos: 'Campos', santos: 'Santos', floripa: 'Florianópolis', pelotas: 'Pelotas' };
  const rows = Object.entries(R.sites).map(([id, s]) => ({ id, lat: s.node[0], codes: s.dec[OP].slice(ci * NS, (ci + 1) * NS) })).sort((x, y) => y.lat - x.lat);
  need(pre.TR === 48 && pre.limits.length === 1 && pre.limits[0].var === 'hs' && pre.limits[0].op === '<=' && pre.limits[0].value === '2.0'
    && rows.length === Object.keys(NAME).length && rows.every((r) => NAME[r.id] && r.codes.length === NS && /^[LVI]+$/.test(r.codes.slice(0, NS - needS)) && /^-+$/.test(r.codes.slice(NS - needS))),
  'the decision record\'s week stopped being a 48-hour launch at Hs ≤ 2,0 m over nine sites, with every start a verdict or past the forecast');
  const cnt = (c) => rows.reduce((n, r) => n + r.codes.split('').filter((x) => x === c).length, 0);
  const nL = cnt('L'), nV = cnt('V'), nI = cnt('I');
  need(nL > 0 && nV > 0 && nI > 0, 'the week no longer holds all three verdicts');
  function board({ w, short }) {
    const GX0 = short ? 98 : 150, GX1 = w - 8, cw = (GX1 - GX0) / NS, GY0 = short ? 60 : 52, rh = short ? 24 : 30, bh = short ? 14 : 18;
    const cx = (i) => GX0 + i * cw, ry = (j) => GY0 + j * rh, h = GY0 + rows.length * rh + 48;
    const Hh = hatch();
    const o = [CH.open({ w, h, alt: 'Uma semana de janelas: nove pontos de mar aberto por passos de seis horas. Barra cheia, LIBERADA: o limite vale na borda desfavorável da faixa por 48 horas; contorno, VETADA: falha até na borda favorável; hachura, INDEFINIDA: a faixa cruza o limite; e as últimas partidas, cujas 48 horas passam do fim da previsão, são um vazio só. De ' + (nL + nV + nI) + ' partidas, ' + nL + ' liberadas, ' + nV + ' vetadas e ' + nI + ' indefinidas.' }), Hh.def];
    const days = R.t.map((x, i) => [x, i]).filter(([x]) => x.slice(11, 13) === '00');
    for (const [x, i] of days) {
      o.push(ln(cx(i), GY0 - 2, cx(i), ry(rows.length) + 2, 'stroke="' + CH.GRID + '" stroke-width="1"'));
      if (i < NS - 1) o.push(T(cx(i) + 3, ry(rows.length) + 16, (short ? '' : DIA[dayOf(x).getUTCDay()] + ' ') + (+x.slice(8, 10)), 't-ax'));
    }
    rows.forEach((r, j) => o.push(T(GX0 - 8, ry(j) + rh / 2 + 4, short ? NAME[r.id].replace('Foz do Amazonas', 'Foz Amazonas').replace('Campos, plataforma', 'Campos, plat.').replace('Espírito Santo', 'Esp. Santo').replace('Florianópolis', 'Florianóp.') : NAME[r.id], 't-note', 'end')));
    rows.forEach((r, j) => runsOf(r.codes.slice(0, NS - needS)).forEach((u) => {
      const x = cx(u.i0) + 0.5, ww = (u.i1 - u.i0 + 1) * cw - 1, y = ry(j) + (rh - bh) / 2;
      if (u.c === 'L') o.push(rect(x, y, ww, bh, FILLED));
      else if (u.c === 'V') o.push(rect(x + 0.7, y + 0.7, ww - 1.4, bh - 1.4, OUTLINED));
      else o.push(voidR(Hh, x, y, ww, bh));
    }));
    const vx = cx(NS - needS) + 0.5, vw = needS * cw - 1;
    o.push(voidR(Hh, vx, ry(0) + 2, vw, rows.length * rh - 4));
    o.push(rect(vx + vw / 2 - (short ? 22 : 34), ry(0) + rows.length * rh / 2 - 18, short ? 44 : 68, 34, 'fill="' + CH.SURFACE + '"'));
    o.push(T(vx + vw / 2, ry(0) + rows.length * rh / 2 - 4, '∅ além', 't-note', 'middle'), T(vx + vw / 2, ry(0) + rows.length * rh / 2 + 10, 'da previsão', 't-note', 'middle'));
    o.push(T(8, 20, short ? 'partida de 48 h com Hs ≤ 2,0 m?' : 'pode começar ali uma operação de 48 h com Hs ≤ 2,0 m?', 't-lab', 'start'));
    o.push(ital(short ? 8 : w - 8, short ? 38 : 20, 'rodada de ' + (+R.run.slice(8, 10)) + ' ' + MES[+R.run.slice(5, 7) - 1] + ', ' + R.run.slice(11, 13) + ' UTC', short ? 'start' : 'end'));
    o.push(CH.close);
    return o.join('\n');
  }

  /* =============================================================================================================
     3 · ONE ROW, OVER ITS BAND — Potiguar's band from the public ledger, decided again here by the same decider, and
     refused if the windows differ from the ones Janela published
     ============================================================================================================= */
  const SITE = 'potiguar', DOM = 'janela/hs-altimeter/union-v1';
  const byId = new Map(RT.ledger().filter((r) => r.type === 'commit').map((r) => [r.id, r]));
  const steps = [];
  for (let lead = 12; lead <= 168; lead += 6) {
    const c = byId.get('janela:' + SITE + ':' + R.run + ':+' + lead + 'h:union-v1');
    need(c && c.domain === DOM && c.forecast.lead === lead, 'the ledger lost Potiguar\'s band at +' + lead + ' h of the run');
    steps.push({ t: c.targetTime.slice(0, 13), lead, lo: Q.parse(c.forecast.lo), hi: Q.parse(c.forecast.hi), alpha: c.forecast.alpha });
  }
  const needH = needS * 6, CODE = { LIBERADA: 'L', VETADA: 'V', INDEFINIDA: 'I', 'SEM DADOS': 'n' };
  const codes = steps.map((st) => {
    const idx = steps.filter((x) => x.lead >= st.lead && x.lead <= st.lead + needH);
    if (idx[idx.length - 1].lead < st.lead + needH) return '-';
    const fc = { unit: { hs: 'm' }, steps: idx.map((x) => ({ t: x.t, vars: { hs: { lo: Q.str(x.lo), hi: Q.str(x.hi) } } })) };
    return CODE[D.decide({ id: OP, limits: pre.limits }, fc, [idx[0].t, idx[idx.length - 1].t]).verdict];
  }).join('');
  const pub = R.sites[SITE].dec[OP].slice(ci * NS, (ci + 1) * NS).slice(R.lead.indexOf(12));
  need(codes === pub, 'the windows decided here from the ledger\'s band (' + codes + ') are not the ones Janela published (' + pub + ')');
  const LIM = Q.parse(pre.limits[0].value), ru = runsOf(codes), clr = ru.find((u) => u.c === 'L');
  need(clr && ru.filter((u) => u.c === 'L').length === 1, 'Potiguar\'s row no longer has exactly one cleared run');
  const claim = steps[0].alpha;
  need(steps.every((st) => st.alpha[0] === claim[0] && st.alpha[1] === claim[1]), 'the band\'s claimed coverage changes along the row');
  const lbl = (st) => DIA[dayOf(st.t).getUTCDay()] + ' ' + st.t.slice(11, 13) + 'h';
  function timeline({ w, short }) {
    const h = short ? 340 : 360;
    const fr = CH.frame({ w, h, x0: 9, x1: 171, y0: 0.6, y1: 2.6, padL: 44, padR: 12, padT: 46, padB: short ? 120 : 108 });
    const Hh = hatch();
    const o = [CH.open({ w, h, alt: 'Potiguar, a faixa de previsão da onda significativa de 12 a 168 horas à frente, com a cobertura que ela afirma (' + (claim[1] - claim[0]) + ' em ' + claim[1] + '); as duas bordas tracejadas, calculadas; o limite de 2,0 m sólido, decidido. Abaixo, o veredito de cada horário de partida de uma operação de 48 horas: liberada de ' + lbl(steps[clr.i0]) + ' a ' + lbl(steps[clr.i1]) + ', indefinida onde a faixa cruza o limite, e vazio onde as 48 horas passam do fim da previsão.' }), Hh.def];
    const dayTicks = steps.filter((st) => st.t.slice(11, 13) === '00' && st.lead < 168).map((st) => ({ v: st.lead, t: (short ? '' : DIA[dayOf(st.t).getUTCDay()] + ' ') + (+st.t.slice(8, 10)) }));
    o.push(CH.axes(fr, { yTicks: [1, 1.5, 2, 2.5].map((y) => ({ v: y, t: br(y, 1) })), xTicks: dayTicks }));
    const band = steps.map((st) => [fr.px(st.lead), fr.py(qf(st.hi))]).concat(steps.slice().reverse().map((st) => [fr.px(st.lead), fr.py(qf(st.lo))]));
    o.push('    <path d="' + pathD(band) + 'Z" fill="var(--rule)" stroke="none"/>');
    o.push('    <polyline points="' + steps.map((st) => f1(fr.px(st.lead)) + ',' + f1(fr.py(qf(st.lo)))).join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.6 }) + '/>');
    o.push('    <polyline points="' + steps.map((st) => f1(fr.px(st.lead)) + ',' + f1(fr.py(qf(st.hi)))).join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.6 }) + '/>');
    o.push(ln(fr.px(9), fr.py(2), fr.px(171), fr.py(2), W.attrs(W.DECIDED, { width: 1.6 })));
    o.push(short ? ital(fr.L + fr.pw, fr.T - 14, 'dado Hs ≤ 2,0 m, 48 h', 'end') : ital(fr.px(110), fr.py(2) + 16, 'dado Hs ≤ 2,0 m por 48 h', 'middle'));
    o.push(T(fr.L, fr.T - 14, short ? 'Potiguar · Hs (m)' : 'Potiguar · faixa da previsão de Hs (m), de 12 a 168 h à frente', 't-lab', 'start'));
    const LY = fr.T + fr.ph + 44, LH = 16, strip = (i) => [fr.px(steps[i].lead - 3), fr.px(steps[i].lead + 3)];
    o.push(T(fr.L, LY - 6, 'começar uma operação de 48 h em', 't-note', 'start'));
    ru.forEach((u) => {
      const x0 = strip(u.i0)[0] + 1, x1 = strip(u.i1)[1] - 1;
      if (u.c === 'L') o.push(rect(x0, LY, x1 - x0, LH, FILLED));
      else if (u.c === 'V') o.push(rect(x0, LY, x1 - x0, LH, OUTLINED));
      else o.push(voidR(Hh, x0, LY, x1 - x0, LH));
    });
    const ty = LY + LH + 16;
    o.push(T(strip(clr.i0)[0] + 2, ty, 'LIBERADA: ' + lbl(steps[clr.i0]) + ' – ' + lbl(steps[clr.i1]), 't-lab', 'start'));
    o.push(T(strip(ru[ru.length - 1].i1)[1] - 1, ty + (short ? 32 : 16), short ? '∅ indefinida, depois além da previsão' : '∅ indefinida onde a faixa cruza o limite; no fim, além da previsão', 't-note', 'end'));
    o.push(CH.close);
    return o.join('\n');
  }

  /* =============================================================================================================
     4 · THE CLIMATE OF WINDOWS — 32 years of the hindcast, every start counted: workable / determined, an exact
     fraction, by month, at each basin; and the same with the limit cut by DNV's alpha factor
     ============================================================================================================= */
  const WK = 'certs/janela-workability.json';
  const WR = JSON.parse(fs.readFileSync(path.join(ROOT, WK), 'utf8'));
  const WSITES = ['foz-amazonas', 'potiguar', 'espirito-santo', 'campos', 'santos', 'pelotas'];
  need(JSON.stringify(Object.keys(WR.sites).slice().sort()) === JSON.stringify(WSITES.slice().sort()) && WR.hindcast.samples === 93504
    && /1993/.test(WR.hindcast.from) && /2024/.test(WR.hindcast.to), 'the workability record no longer covers the six basins over 1993–2024');
  const LIMS = WR.limits.slice(0, 3), PERS = WR.periods;
  need(JSON.stringify(LIMS) === '["1.5","2.0","2.5"]' && JSON.stringify(PERS) === '[12,24,48,72]', 'the workability record\'s limits or durations moved');
  const key = (lim, per) => lim + 'm/' + per + 'h';
  for (const s of WSITES) for (const lim of LIMS) for (const per of PERS) {
    const c = WR.sites[s].cells[key(lim, per)];
    need(c && c.oplim.length === 13 && c.opwfCells.length === 13 && c.oplim.every((x) => x[0] <= x[1]) && c.opwfCells.every((x, m) => x[0] <= c.oplim[m][0] && x[1] === c.oplim[m][1]),
      'a workability cell lost a month, or the alpha-cut count exceeds the plain one (' + s + ' ' + key(lim, per) + ')');
  }
  const WCL = [0, 0.2, 0.4, 0.6, 0.8];                              /* the five shades: k/n in [0,.2) … [.8,1] */
  const shade = (k, n) => { const r = k / n; let s = 0; for (let i = 0; i < WCL.length; i++) if (r >= WCL[i]) s = i; return s; };
  const WNAME = { 'foz-amazonas': 'Foz do Amazonas', potiguar: 'Potiguar', 'espirito-santo': 'Espírito Santo', campos: 'Campos', santos: 'Santos', pelotas: 'Pelotas' };
  const wsites = WSITES.map((id) => ({ id, lat: WR.sites[id].lat })).sort((a, b) => b.lat - a.lat);
  function climate({ w, short, lim, per }) {
    const GX0 = short ? 98 : 150, GX1 = w - (short ? 44 : 88), cw = (GX1 - GX0) / 12, GY0 = 40, rh = short ? 30 : 34;
    const h = GY0 + wsites.length * rh + 30;
    const o = [CH.open({ w, h, alt: 'Com que frequência abre uma janela de ' + per + ' horas com Hs ≤ ' + br(Number(lim), 1) + ' m, mês a mês, em seis bacias, contada exatamente em 32 anos de hindcast: cada célula é a fração de partidas viáveis, escrita em porcentagem arredondada para baixo; à direita, o ano todo.' })];
    for (let m = 0; m < 12; m++) o.push(T(GX0 + (m + 0.5) * cw, GY0 - 10, short ? MES[m][0].toUpperCase() : MES[m], 't-ax', 'middle'));
    o.push(T(GX1 + (w - GX1) / 2, GY0 - 10, 'ano', 't-ax', 'middle'));
    wsites.forEach((s, j) => {
      const y = GY0 + j * rh, c = WR.sites[s.id].cells[key(lim, per)].oplim;
      o.push(T(GX0 - 8, y + rh / 2 + 4, short ? WNAME[s.id].replace('Foz do Amazonas', 'Foz Amazonas').replace('Espírito Santo', 'Esp. Santo') : WNAME[s.id], 't-note', 'end'));
      for (let m = 0; m < 13; m++) {
        const [k, n] = c[m], x = m < 12 ? GX0 + m * cw : GX1 + 6, ww = m < 12 ? cw - 2 : w - GX1 - 10, sh = shade(k, n);
        o.push(rect(x, y + 2, ww, rh - 4, 'data-c="' + s.id + ',' + m + '" class="w-decided" fill="' + CH.SEQ[sh] + '" stroke="none"'));
        if (!short || m === 12) {
          /* the number on a chip of the figure's ground, so it reads on every shade in both themes */
          o.push(rect(x + ww / 2 - 19, y + rh / 2 - 7.5, 38, 15, 'rx="3" fill="' + CH.SURFACE + '"'));
          o.push(T(x + ww / 2, y + rh / 2 + 4, pct(k, n), 't-ax', 'middle').replace('<text ', '<text data-t="' + s.id + ',' + m + '" '));
        }
      }
    });
    o.push(CH.close);
    return o.join('\n');
  }
  /* the alpha factor, annual: the plain limit's count beside the alpha-cut one, at each basin (2,0 m, 48 h) */
  const AL = { lim: '2.0', per: 48 };
  function alphaFig({ w, short }) {
    const padL = short ? 98 : 112, top = 52, rh = short ? 34 : 36, h = top + wsites.length * rh + 40, padR = short ? 96 : 130;
    const fr = CH.frame({ w, h, x0: 0, x1: 100, y0: 0, y1: 1, padL, padR, padT: top, padB: 40 });
    const cA = w - padR + (short ? 44 : 58), cB = w - 6;
    const o = [CH.open({ w, h, alt: 'O fator alfa da DNV, no ano todo, para 48 horas com Hs ≤ 2,0 m: em cada bacia, a fração de partidas viáveis com o limite simples (ponto cheio) e com o limite reduzido por alfa (ponto vazado), ambas contadas exatamente.' })];
    for (const t of [0, 50, 100]) { o.push(ln(fr.px(t), top - 8, fr.px(t), h - 40, 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(T(fr.px(t), h - 18, t + (t === 100 ? ' %' : ''), 't-ax', 'middle')); }
    o.push(T(8, 18, short ? '48 h, Hs ≤ 2,0 m · ano' : '48 h com Hs ≤ 2,0 m, no ano todo', 't-lab', 'start'));
    o.push(T(cA, top - 14, 'simples', 't-note', 'end'), T(cB, top - 14, '× α', 't-note', 'end'));
    wsites.forEach((s, j) => {
      const y = top + j * rh + rh / 2, c = WR.sites[s.id].cells[key(AL.lim, AL.per)], a = c.oplim[12], b = c.opwfCells[12];
      const xa = fr.px(100 * a[0] / a[1]), xb = fr.px(100 * b[0] / b[1]);
      o.push(T(padL - 10, y + 4, short ? WNAME[s.id].replace('Foz do Amazonas', 'Foz Amazonas').replace('Espírito Santo', 'Esp. Santo') : WNAME[s.id], 't-note', 'end'));
      o.push(ln(xb, y, xa, y, 'stroke="var(--ink-4)" stroke-width="2"'));
      o.push(dot(xa, y, 5.5, 'class="w-decided" fill="var(--ink)" stroke="' + CH.SURFACE + '" stroke-width="1.5"'));
      o.push(dot(xb, y, 5.5, 'class="w-decided" fill="' + CH.SURFACE + '" stroke="var(--ink)" stroke-width="2"'));
      o.push(T(cA, y + 4, pct(a[0], a[1]), 't-ax', 'end'), T(cB, y + 4, pct(b[0], b[1]), 't-lab', 'end'));
    });
    o.push(CH.close);
    return o.join('\n');
  }
  const camposA = WR.sites.campos.cells[key(AL.lim, AL.per)];

  /* =============================================================================================================
     5 · A FORECAST, GRADED — the ECMWF ensemble and the band Janela decides on, at Potiguar, against every satellite
     pass that came later; every hit and miss re-decided here in exact arithmetic
     ============================================================================================================= */
  const DEF = 'certs/janela-ledger/DEFINITIONS.json';
  const PROP = [{ dom: 'janela/hs-altimeter/ens-c40of50', name: 'conjunto ECMWF, 40 centrais de 50' }, { dom: 'janela/hs-altimeter/union-v1', name: 'a faixa em que a janela é decidida' }];
  const com = new Map(), sco = new Map();
  for (const r of RT.ledger()) (r.type === 'commit' ? com : sco).set(r.id, r);
  const inside = (c, s) => Q.cmp(Q.parse(c.forecast.lo), Q.parse(s.outcome)) <= 0 && Q.cmp(Q.parse(s.outcome), Q.parse(c.forecast.hi)) <= 0;
  const tot = PROP.map((p) => { let n = 0, k = 0, bad = 0; for (const [id, s] of sco) { const c = com.get(id); if (!c || c.domain !== p.dom) continue; n++; if (s.covered) k++; if (s.covered !== inside(c, s)) bad++; } return { n, k, bad }; });
  need(tot.every((x) => x.n > 0 && x.bad === 0), 'a score in the ledger disagrees with its band and the satellite\'s height in exact arithmetic');
  const per2 = PROP.map((p) => { const by = new Map(); for (const [id, s] of sco) { const c = com.get(id); if (!c || c.domain !== p.dom || id.split(':')[1] !== SITE) continue; const cur = by.get(c.targetTime); if (!cur || c.forecast.lead < cur.c.forecast.lead) by.set(c.targetTime, { c, s }); } return by; });
  const TP = [...per2[0].keys()].filter((x) => per2[1].has(x)).sort();
  need(TP.length > 6 && TP.every((x) => per2[0].get(x).c.forecast.lead === per2[1].get(x).c.forecast.lead && per2[0].get(x).s.outcome.join('/') === per2[1].get(x).s.outcome.join('/')), 'the two forecasts are no longer graded on the same passes at Potiguar');
  const claims = PROP.map((_, j) => per2[j].get(TP[0]).c.forecast.alpha);
  const hits = PROP.map((_, j) => TP.filter((x) => per2[j].get(x).s.covered).length);
  function graded({ w, short }) {
    const X0 = 50, X1 = w - 12, sx = (i) => X0 + (i + 0.5) * (X1 - X0) / TP.length;
    const RY = [short ? 70 : 54, short ? 236 : 186], RH = short ? 96 : 92, Y0 = 0.8, Y1 = 2.4, yv = (j, y) => RY[j] + RH - (y - Y0) / (Y1 - Y0) * RH, h = RY[1] + RH + 40;
    const o = [CH.open({ w, h, alt: 'Potiguar: em cada passagem de satélite altímetro a até 100 km e 3 horas de um passo previsto, a previsão mais recente para esse passo, como gravada no registro público antes da passagem. Em cima, o conjunto do ECMWF (afirma ' + (claims[0][1] - claims[0][0]) + ' em ' + claims[0][1] + '), que acertou ' + hits[0] + ' de ' + TP.length + '; embaixo, a faixa da decisão (afirma ' + (claims[1][1] - claims[1][0]) + ' em ' + claims[1][1] + '), que acertou ' + hits[1] + ' de ' + TP.length + '. Barra cheia: o satélite caiu dentro; contorno: errou, e o erro é desenhado até a altura medida.' })];
    PROP.forEach((p, j) => {
      for (const y of [1, 2]) { o.push(ln(X0, yv(j, y), X1, yv(j, y), 'stroke="' + CH.GRID + '" stroke-width="1"')); o.push(T(X0 - 8, yv(j, y) + 4, br(y, 1), 't-ax', 'end')); }
      o.push(T(X0, RY[j] - (short ? 30 : 12), short ? (j ? 'faixa da decisão' : 'conjunto ECMWF') : p.name, 't-lab', 'start'));
      o.push(ital(short ? X0 : X1, RY[j] - 12, 'afirma ' + (claims[j][1] - claims[j][0]) + ' em ' + claims[j][1] + ' · acertou ' + hits[j] + ' de ' + TP.length, short ? 'start' : 'end'));
      TP.forEach((x, i) => {
        const { c, s } = per2[j].get(x), lo = qf(c.forecast.lo), hi = qf(c.forecast.hi), ob = qf(s.outcome), bw = Math.min(9, (X1 - X0) / TP.length - 3);
        const y0 = yv(j, hi), y1 = yv(j, lo);
        o.push(s.covered ? rect(sx(i) - bw / 2, y0, bw, Math.max(1.5, y1 - y0), 'class="w-computed" fill="var(--ink-4)" stroke="var(--ink-4)" stroke-width="1"')
          : rect(sx(i) - bw / 2 + 0.5, y0, bw - 1, Math.max(1.5, y1 - y0), 'class="w-computed" fill="none" stroke="var(--ink-3)" stroke-width="1"'));
        if (!s.covered) o.push(ln(sx(i), ob > hi ? y0 : y1, sx(i), yv(j, ob), W.attrs(W.DECIDED, { width: 1.4 })));
        o.push(dot(sx(i), yv(j, ob), 3, 'class="w-decided" fill="var(--ink)" stroke="none"'));
      });
    });
    const dd = (iso) => (+iso.slice(8, 10)) + ' ' + MES[+iso.slice(5, 7) - 1];
    o.push(T(sx(0), h - 14, dd(TP[0]), 't-ax', 'middle'), T(sx(TP.length - 1), h - 14, dd(TP[TP.length - 1]), 't-ax', 'middle'), T((X0 + X1) / 2, h - 14, TP.length + ' passagens, em ordem', 't-note', 'middle'));
    o.push(CH.close);
    return o.join('\n');
  }

  /* =============================================================================================================
     6 · FROM THE OPEN SEA TO THE COAST — Swell's island model: a 12 s swell from 135°, its crests refracted round
     Florianópolis by a linear solver, the strips the model refuses, the beaches by how far the model was checked
     ============================================================================================================= */
  const IDX = 'apps/swell/data/island/index.json', BEA = 'apps/swell/data/beaches.json', CMP = 'certs/swell-island-boussinesq.json', PINS = 'apps/swell/data/PINS.json';
  const SURF = require(path.join(ROOT, 'apps', 'swell', 'model', 'surf.js'));
  const I = MAPS.readJSON(IDX), BE = MAPS.readJSON(BEA), CM = MAPS.readJSON(CMP), PIN = MAPS.readJSON(PINS);
  const DIR = 135, PER = 12;
  const cs = I.cases.find((c) => c.dir === DIR && c.T === PER);
  need(!!cs, 'the island model has no case for a 12 s swell from 135°');
  const DEPTH = 'apps/swell/data/island/' + I.texture.depth, CASE = 'apps/swell/data/island/' + cs.file;
  for (const [rel, name] of [[DEPTH, 'island/' + I.texture.depth], [CASE, 'island/' + cs.file], [BEA, 'beaches.json'], [IDX, 'island/index.json']]) {
    const pn = PIN.files[name] && PIN.files[name].sha256;
    need(!!pn && pn === MAPS.sha(rel), 'the island model\'s ' + name + ' is not its pinned bytes');
  }
  const DP = MAPS.png(DEPTH), PC = MAPS.png(CASE);
  need(DP.w === I.texture.nx && DP.h === I.texture.ny && PC.w === DP.w && PC.h === DP.h, 'the island model\'s textures changed size');
  const [LO0, LO1] = I.texture.lon, [LA0, LA1] = I.texture.lat, NX = DP.w, NY = DP.h, DXm = I.texture.dx;
  const EDGE_KM = SURF.C.EDGE_KM, edgePx = EDGE_KM * 1000 / DXm;
  const long = CM.readings.swell.byBeachLong, compared = new Set(Object.keys(long));
  const low = Object.entries(long).filter(([, x]) => x.medianRatio < 1).sort((a, b) => a[1].medianRatio - b[1].medianRatio);
  const beachesAll = BE.beaches.map((b) => ({ b, refused: SURF.refused(b) }));
  need(beachesAll.length === 34 && beachesAll.filter((q) => q.refused).length === 1 && low.map(([n]) => n).join('|') === 'Pântano do Sul|Ingleses|Galheta',
    'the island model no longer refuses exactly one of its 34 beaches, or the comparison no longer names the three where it reads low');
  const nCmp = beachesAll.filter((q) => compared.has(q.b.name)).length, nAss = beachesAll.length - nCmp - 1;
  function coast({ w, short }) {
    const side = short ? 0 : 290, MX = 8, MY = 44, SC = (Math.min(w - side - 24, 560)) / Math.max(NX, NY), x1 = MX + NX * SC, y1 = MY + NY * SC;
    const h = Math.round(y1 + (short ? 180 : 24));
    const gx = (i) => MX + i * SC, gy = (j) => MY + j * SC;
    const lonX = (lon) => gx((lon - LO0) / (LO1 - LO0) * NX), latY = (lat) => gy((LA1 - lat) / (LA1 - LA0) * NY);
    const ST = 2, ccx = Math.ceil(NX / ST) + 2, ccy = Math.ceil(NY / ST) + 2;
    const seaAt = (i, j) => { const x = (i - 1) * ST, y = (j - 1) * ST; return x < 0 || y < 0 || x >= NX || y >= NY ? 255 : DP.px(x, y, 2); };
    const coastD = MAPS.contour(ccx, ccy, seaAt, () => true, 127.5).map((r) => MAPS.simplify(r.map(([i, j]) => [gx((i - 1) * ST), gy((j - 1) * ST)]), 0.5)).filter((r) => r.length > 3).map((r) => MAPS.dOf(r, true)).join('');
    const EVERY = 25, SP = 3, px3 = Math.ceil(NX / SP), py3 = Math.ceil(NY / SP);
    const ph = (i, j) => { const x = Math.min(NX - 1, i * SP), y = Math.min(NY - 1, j * SP); return (PC.px(x, y, 0) * 256 + PC.px(x, y, 1)) * cs.phiScale; };
    const reach = (i, j) => { const x = Math.min(NX - 1, i * SP), y = Math.min(NY - 1, j * SP); return DP.px(x, y, 2) > 127 && PC.px(x, y, 2) > 0; };
    const insideB = (i, j) => { const y = Math.min(NY - 1, j * SP); return y >= edgePx && y <= NY - 1 - edgePx; };
    let pmax = 0; for (let j = 0; j < py3; j++) for (let i = 0; i < px3; i++) if (reach(i, j)) pmax = Math.max(pmax, ph(i, j));
    const crest = []; for (let Lv = EVERY; Lv < pmax; Lv += EVERY)
      for (const c of MAPS.contour(px3, py3, ph, (i, j) => reach(i, j) && insideB(i, j), Lv)) { const s = MAPS.simplify(c.map(([i, j]) => [gx(i * SP), gy(j * SP)]), 0.45); if (s.length > 1) crest.push(MAPS.dOf(s, false)); }
    const Hh = hatch();
    const o = [CH.open({ w, h, alt: 'O modelo da ilha de Florianópolis, o caso de um swell de ' + PER + ' s vindo de ' + DIR + '°: cada vigésima quinta crista, uma linha de nível da fase resolvida, onde a onda alcança a água, tracejadas por serem um modelo; as faixas de ' + EDGE_KM + ' km junto às bordas norte e sul, onde o modelo é recusado, hachuradas; e as 34 praias, cheias onde o modelo foi comparado a uma solução de Boussinesq, vazadas onde não foi.' }), Hh.def];
    const eh = edgePx * SC;
    o.push(rect(MX, MY, x1 - MX, y1 - MY, 'fill="none" stroke="var(--rule-strong)" stroke-width="1"'));
    o.push(voidR(Hh, MX, MY, x1 - MX, eh), voidR(Hh, MX, y1 - eh, x1 - MX, eh));
    o.push(pathEl(coastD, MAPS.landFill + ' fill-rule="evenodd"'));
    o.push(pathEl(crest.join(''), W.attrs(W.COMPUTED, { width: short ? 1.2 : 1.6 }) + ' stroke-linejoin="round"'));
    const bs = beachesAll.map((q) => ({ ...q, x: lonX(q.b.lon), y: latY(q.b.lat) }));
    for (const q of bs) {
      if (q.refused) { o.push(dot(q.x, q.y, 3.6, 'fill="var(--sunk)" stroke="var(--ink-3)" stroke-width="1"')); continue; }
      const r = short ? 2.4 : 3;
      o.push(compared.has(q.b.name) ? rect(q.x - r, q.y - r, 2 * r, 2 * r, 'fill="var(--ink)" stroke="var(--sunk)" stroke-width="0.8"') : rect(q.x - r, q.y - r, 2 * r, 2 * r, 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1"'));
    }
    const named = bs.filter((q) => q.refused).map((q) => ({ q, l1: '∅ ' + q.b.name, l2: 'recusada: ' + br(q.b.edges.S, 1) + ' km da borda' }))
      .concat(low.map(([n, x]) => ({ q: bs.find((q) => q.b.name === n), l1: n, l2: 'o modelo lê baixo, ×' + br(x.medianRatio, 2) })));
    named.sort((a, b) => a.q.y - b.q.y);
    const KX = short ? MX : x1 + 22;
    if (!short) named.forEach((m, k) => { const ly = MY + 150 + k * 40; o.push(ln(m.q.x + 4, m.q.y, KX - 4, ly - 4, 'stroke="var(--ink-5)" stroke-width="1"'), T(KX, ly, m.l1, 't-ax'), T(KX, ly + 15, m.l2, 't-note')); });
    else named.forEach((m, k) => { const ly = y1 + 104 + k * 16; o.push(T(KX, ly, m.l1 + ' · ' + m.l2, 't-note')); });
    const ky = short ? y1 + 18 : MY + 8;
    o.push(rect(KX, ky, 9, 9, 'fill="var(--ink)"'), T(KX + 16, ky + 9, 'comparada a Boussinesq: ' + nCmp, 't-note'));
    o.push(rect(KX + 0.5, ky + 18.5, 8, 8, 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1"'), T(KX + 16, ky + 27, 'sem comparação: ' + nAss, 't-note'));
    o.push(voidR(Hh, KX, ky + 36, 9, 9), T(KX + 16, ky + 45, 'faixa recusada, ' + EDGE_KM + ' km', 't-note'));
    o.push(ln(KX, ky + 61, KX + 24, ky + 61, W.attrs(W.COMPUTED, { width: 1.6 })), T(KX + 30, ky + 65, 'crista, calculada', 't-note'));
    o.push(T(8, 20, short ? 'um retrato do modelo da ilha' : 'um retrato do modelo da ilha de Florianópolis', 't-lab', 'start'));
    o.push(ital(8, 36, 'dado um swell de ' + DIR + '° e ' + PER + ' s'));
    o.push(CH.close);
    return o.join('\n');
  }

  /* =============================================================================================================
     7 · THE ATLAS, WITH LAND — the existing world map of the decided 100-year daily level, over Natural Earth's land
     ============================================================================================================= */
  function landWorld(w, h, la0, la1) {
    const X = (lo) => (lo + 180) / 360 * w, Y = (la) => (la1 - la) / (la1 - la0) * h;
    return MAPS.land([-180, la0, 180, la1], (lo, la) => [X(lo), Y(la)], [0, 0, w, h], 0.9);
  }

  return {
    rlEmpirical, nD, nPts: pts.length, recordYears: Tof(0), WW3,
    board, DEC, R, nL, nV, nI, rows,
    timeline, steps, clr, lbl, claim, LEDGER: RT.LEDGER,
    climate, alphaFig, WK, WR, LIMS, PERS, key, camposA, AL, pct, WCL, WNAME, wsites,
    graded, tot, hits, TP, claims, DEF,
    coast, CASE, DEPTH, BEA, CMP, IDX, EDGE_KM, nCmp, nAss, low, DIR, PER,
    landWorld, landFill: MAPS.landFill, LEGS, FILLED, OUTLINED, voidR,
  };
};
