/* deck.js — Janela's pitch deck (pt-BR, 16:9, 12 slides), printed to PDF by
   headless Chrome at site/janela/janela-apresentacao.pdf.

   ONE NUMBERS OBJECT. Every figure is read from numbers.js (the same N the
   method page reads), from uses.js (the use cases the app's doors and the page
   share), from the pinned rule files, or computed here by the SAME pinned
   instruments the app runs (instruments/window/campaign.js over the hindcast
   hindcast.js verifies); facts() throws when a record stops saying what a
   slide needs, and the build refuses. The stylesheet and the printer are the
   Contraprova deck's (one deck design for the products).

   THE PICTURES ARE THE APP. Two screenshots of the built app (the fleet at a
   desk, a unit's card on a phone) are taken from site/janela/ through a local
   server at print time — never drawn for the deck.

   build(N, shots) -> html   (shots null: the text-only form, whose sha256 is
                              the reprint pin — the screenshots move with the
                              animated sea, the slides' words do not)
   shots() -> { fleet, card } base64 PNGs
   print(html, out)          the Contraprova printer
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.join(__dirname, '..', '..');
const CP = require(path.join(ROOT, 'apps', 'contraprova', 'deck.js'));
const { APP_DARK } = require(path.join(ROOT, 'design', 'app-shell.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const { br, Q } = require('./numbers.js');
const USES = require('./uses.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const need = (c, m) => { if (!c) throw new Error('janela deck: ' + m); };
const pct = (w, n, k) => br.dec((100 * w / n).toFixed(k === undefined ? 1 : k)) + '%';
const d2 = (x) => br.dec(Number(x).toFixed(2));

/* ---- the facts a slide states that N does not already hold, each from its record ---- */
function facts(N) {
  const F = {};
  const SITES = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/sites.json'), 'utf8')).sites;
  const UNITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/platforms.json'), 'utf8')).units;
  const NPCP = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/rules/npcp.json'), 'utf8'));
  const DNV = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/rules/dnv-alpha.json'), 'utf8'));
  F.units = UNITS.length;
  /* the measured sites: every site a bands record calibrates (the 2026-10-06 record's eight + each region's) */
  const BR = require('./audit/bandset.js').bands().records;
  F.mainSites = BR[0].sites.length;
  F.sites = new Set([].concat(...BR.map((r) => r.sites))).size;
  F.rules = NPCP.rules.length; F.acts = Object.keys(NPCP.sources).length;
  F.b704 = JSON.stringify(DNV).match(/"B704":\s*"([^"]+)"/);
  need(F.b704, 'dnv-alpha.json lost the B704 quote'); F.b704 = F.b704[1];
  F.ecmwfPairs = N.bands.rows;
  const NB = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs/janela-bands-noaa.json'), 'utf8'));
  F.noaaPairs = NB.source && NB.source.rows; need(F.noaaPairs, 'certs/janela-bands-noaa.json lost source.rows');
  need(N.heldOut, 'certs/janela-providers-eval.json is missing: the deck states its held-out number');
  F.H = N.heldOut;

  /* the site alpha at design Hs 2 m over the offshore basins of the 2026-10-06 record (a region — Sergipe — and the
     coast point are said apart: their alpha sits at or under the table), every TPOP */
  need(N.alpha, 'certs/janela-alpha.json is missing');
  const BS = require('./audit/bandset.js');
  const off = Object.keys(N.alpha.sites).filter((sid) => { const s = SITES.find((x) => x.id === sid); return s && (s.kind === 'field' || s.kind === 'platform') && !BS.regionOf(sid); });
  const cells = [].concat(...off.map((sid) => N.alpha.sites[sid].cells.filter((c) => c.designHs === 2 && c.verdict === 'ESTIMATED')));
  need(cells.length >= 10, 'too few site-alpha cells at design Hs 2 m');
  F.alpha = { lo: Math.min(...cells.map((c) => c.alpha)), hi: Math.max(...cells.map((c) => c.alpha)), tLo: Math.min(...cells.map((c) => c.dnv['4-1'])), tHi: Math.max(...cells.map((c) => c.dnv['4-1'])),
    above: cells.filter((c) => c.ci90[0] > c.dnv['4-1']).length, n: cells.length, basins: off.length, cal: N.alpha.calibration };

  /* the month: Santos, Hs <= 2.0 m for 48 h — the sea, Table 4-1, the site alpha (exact counts, the record) */
  const c = N.work.sites.santos && N.work.sites.santos.cells['2.0m/48h'];
  need(c && c.s, 'the Santos 2.0 m / 48 h workability cell (with the site alpha) is gone');
  F.work = { sea: pct(c.o[12][0], c.o[12][1]), tab: pct(c.f[12][0], c.f[12][1]), loc: pct(c.s.c[12][0], c.s.c[12][1]), aT: c.ad, aS: c.s.a, wfT: c.wf, wfS: c.s.wf,
    from: N.work.from.slice(0, 4), to: N.work.to.slice(0, 4) };

  /* the campaign: ten 48 h operations at Hs <= 2.0 m from 1 November, run in every hindcast year by the pinned planner */
  const H = require('./audit/hindcast.js').load('santos');
  const CAMP = require(path.join(ROOT, 'instruments', 'window', 'campaign.js'));
  const run = (lim) => CAMP.campaign(H, { limit: lim, TR: 48, N: 10, start: '11-01' });
  const days = (h) => (h === null || h === undefined ? '—' : br.dec((Math.round(h / 2.4) / 10).toFixed(1)));
  const sea = run('2.0'), tab = run(Q.str(Q.mul(Q.parse(c.a), Q.parse('2.0')))), loc = run(Q.str(Q.mul(Q.parse(c.s.a), Q.parse('2.0'))));
  F.camp = [['o mar (Hs ≤ 2,0 m)', sea], ['α do local (OPWF ' + br.dec(c.s.wf) + ' m)', loc], ['Tabela 4-1 (OPWF ' + br.dec(c.wf) + ' m)', tab]]
    .map(([k, r]) => ({ k, q50: days(r.q50), q90: days(r.q90), worst: days(r.worst), wy: r.worstYear, fin: r.finished, cen: r.censored }));

  /* the third provider, measured (certs/janela-providers-eval-aifs.json, providers-eval-aifs-v1) */
  const AE = path.join(ROOT, 'certs', 'janela-providers-eval-aifs.json');
  if (fs.existsSync(AE)) {
    const R = JSON.parse(fs.readFileSync(AE, 'utf8')), r = Object.fromEntries(R.results.map((x) => [x.option, x.limits['2.0']]));
    need(r['U(E,N)'] && r['U(E,A)'], 'the AIFS evaluation lost its unions');
    F.aifs = { test: R.pairs.test, en: r['U(E,N)'], ea: r['U(E,A)'], from: R.pairs.split };
  }
  /* the hindcast against the Navy's buoys (certs/janela-pnboia-check.json): the time at or under 1.5 and 2.0 m, pooled */
  const PB = path.join(ROOT, 'certs', 'janela-pnboia-check.json');
  if (fs.existsSync(PB)) {
    const R = JSON.parse(fs.readFileSync(PB, 'utf8')), t = {};
    let dep = 0;
    for (const b of R.buoys) {
      if (!b.pointwise) continue;
      dep++;
      for (const k of ['1.5m', '2.0m']) {
        const c = b.pointwise[k], x = t[k] = t[k] || { n: 0, buoy: 0, hind: 0 };
        x.n += c.both + c.buoyOnly + c.hindcastOnly + c.neither; x.buoy += c.both + c.buoyOnly; x.hind += c.both + c.hindcastOnly;
      }
    }
    need(dep >= 5, 'too few buoy deployments compared');
    F.pnb = { deployments: dep, pairs: t['2.0m'].n, b20: pct(t['2.0m'].buoy, t['2.0m'].n), h20: pct(t['2.0m'].hind, t['2.0m'].n),
      b15: pct(t['1.5m'].buoy, t['1.5m'].n, 0), h15: pct(t['1.5m'].hind, t['1.5m'].n, 0),
      from: R.buoys.filter((b) => b.from).map((b) => b.from).sort()[0].slice(0, 4), to: R.buoys.filter((b) => b.to).map((b) => b.to).sort().slice(-1)[0].slice(0, 4) };
  }
  /* the day the app re-decides (the local copy build-today.js just wrote and gated), when it is on this disk */
  const TD = path.join(ROOT, 'site', 'janela', 'data', 'today.json');
  F.day = fs.existsSync(TD) ? (() => { const t = JSON.parse(fs.readFileSync(TD, 'utf8')); return { decisions: t.decisions, second: t.second, run: t.run, proposers: t.ledger ? t.ledger.proposers.length : null }; })() : null;
  F.month = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][+N.feed.run.slice(5, 7) - 1] + ' de ' + N.feed.run.slice(0, 4);
  return F;
}

function css() {
  return CP.css() + `
:root{${Object.entries(APP_DARK).map(([k, v]) => k + ':' + v).join(';')}}
.jn-c{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:13px;font-weight:600;letter-spacing:.1em;padding:.4em .9em;border-radius:8px;border:1px solid;white-space:nowrap;align-self:flex-start}
.jn-c i{display:inline-block;width:11px;height:11px;border-radius:2px}
.jn-c.L{color:var(--v-cert);border-color:var(--v-cert);background:var(--v-cert-soft)}.jn-c.L i{background:var(--v-cert)}
.jn-c.V{color:var(--v-refu);border-color:var(--v-refu);background:var(--v-refu-soft)}.jn-c.V i{border:1.5px solid var(--v-refu);background:linear-gradient(45deg,transparent 42%,var(--v-refu) 42% 58%,transparent 58%),linear-gradient(-45deg,transparent 42%,var(--v-refu) 42% 58%,transparent 58%)}
.jn-c.I{color:var(--ink-2);border-color:var(--ink-3);background:var(--surface2)}.jn-c.I i{border:1px solid var(--ink-2);background:repeating-linear-gradient(135deg,var(--ink-2) 0 1px,transparent 1px 3px)}
.jn-c.S{color:var(--v-refd);border-color:var(--v-refd);background:var(--v-refd-soft)}.jn-c.S i{background:radial-gradient(circle,var(--v-refd) 1px,transparent 1.2px) 0 0/3.5px 3.5px}
.gl{font-family:var(--f-mono);font-size:11px;color:var(--ink-3);margin-top:8px;max-width:27ch;line-height:1.4}
.shot{display:block;border:1px solid var(--rule-strong);border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,.45)}
.shot.ph{border-radius:22px}
.split{display:grid;grid-template-columns:1.62fr 1fr;gap:34px;align-items:start}
.split2{display:grid;grid-template-columns:300px 1fr;gap:40px;align-items:start}
.pts{display:flex;flex-direction:column;gap:14px}
.pt{border-left:2px solid var(--rule-strong);padding:2px 0 2px 16px}
.pt b{display:block;font-size:17px;margin-bottom:3px}
.pt p{font-size:14.5px;line-height:1.45}
.ph-empty,.fl-empty{display:flex;align-items:center;justify-content:center;border:1px dashed var(--rule-strong);border-radius:12px;color:var(--ink-4);font-family:var(--f-mono);font-size:12px}
.fl-empty{height:420px}.ph-empty{height:510px}
.qt{font-style:italic;color:var(--ink-3);font-size:14px;line-height:1.5;border-left:2px solid var(--ink-4);padding-left:14px}
td.n,th.n{text-align:right;font-family:var(--f-mono)}
.sm td{padding:9px 12px;font-size:13.5px}.sm th{padding:8px 12px}
`;
}

const CHIP = { L: 'LIBERADA', V: 'VETADA', I: 'INDEFINIDA', S: 'SEM DADOS' };
const chip = (k) => '<span class="jn-c ' + k + '"><i></i>' + CHIP[k] + '</span>';
const GLOSS = { L: 'todo limite vale na borda desfavorável da faixa medida, em cada passo da janela', V: 'um limite falha já na borda favorável; sai com a testemunha: a hora e a variável',
  I: 'a faixa atravessa o limite; sai com o limiar que viraria a decisão', S: 'a regra limita o que ninguém prevê ali (corrente, visibilidade), e diz o quê' };

function build(N, shots) {
  const F = facts(N), U = USES.cases(), S_ = [];
  const ft = (n) => '<div class="ft"><span>JANELA · carlostoledo.co/janela</span><span>a janela operacional, decidida · ' + esc(F.month) + '</span><span>' + n + '/12</span></div>';
  const img = (k, cls, w) => shots && shots[k] ? '<img class="shot ' + cls + '" style="width:' + w + 'px" src="data:image/png;base64,' + shots[k] + '" alt="">' : '<div class="' + (k === 'card' ? 'ph-empty' : 'fl-empty') + '">o app</div>';
  const H = F.H, broke = pct(H.broke, H.liberada, 2), eBroke = pct(H.eBroke, H.eLiberada, 2), cov = br.dec((100 * H.coverage).toFixed(1)) + '%';
  const since = H.from.slice(5, 7) + '/' + H.from.slice(0, 4);

  /* 1 · cover */
  S_.push('<section class="s"><div class="ey">Janela · energia offshore · janelas operacionais</div>'
    + '<div class="cover"><div><h1>A janela de cada operação offshore, decidida.</h1>'
    + '<p style="margin-top:26px;max-width:46ch">Para as ' + F.units + ' unidades de produção offshore do Brasil: o mar dos próximos sete dias contra o limite da sua operação — alívio, carga, lançamento, içamento, a regra da Capitania — sobre uma previsão cujo erro foi medido por satélite. Cada decisão sai com o motivo, e quem confere a refaz.</p></div>'
    + '<div class="card core"><div class="k">o que já está medido</div><div class="big">' + broke + '</div>'
    + '<p style="font-size:16px">das janelas LIBERADA com Hs ≤ 2 m que o mar rompeu, em ' + br.int(H.pairs) + ' comparações com satélite que a faixa nunca viu (desde ' + since + '): <b>' + br.int(H.broke) + ' de ' + br.int(H.liberada) + '</b>.</p>'
    + '<p style="font-size:14px">Com a faixa de um provedor só (ECMWF), no mesmo teste: ' + eBroke + '. A faixa que decide cobre ' + cov + ' do que o satélite viu; reivindica 90%.</p></div></div>'
    + '<div class="row" style="margin-top:auto;margin-bottom:34px;gap:22px">' + ['L', 'V', 'I', 'S'].map((k) => '<div>' + chip(k) + '<div class="gl">' + esc(GLOSS[k]) + '</div></div>').join('') + '</div>' + ft(1) + '</section>');

  /* 2 · the problem */
  S_.push('<section class="s"><div class="ey">1 · o problema</div><h2>A previsão é uma figura; a operação precisa de uma decisão que se defenda.</h2><div class="col3">'
    + '<div class="card claim"><div class="k">2,4 m previstos, limite 2,5 m</div><p>Uma previsão sem o seu erro medido no local não diz se a janela cabe. Quem decide arredonda pelo receio ou pela pressa — e uma janela rompida custa embarcação, e uma janela perdida custa diária e tanque.</p></div>'
    + '<div class="card claim"><div class="k">o α da DNV fecha janelas</div><p>A Tabela 4-1 (DNV-OS-H101), calibrada no Mar do Norte, encolhe o limite de previsão. Em Santos, Hs ≤ 2,0 m por 48 h: o mar abre <b>' + F.work.sea + '</b> dos inícios; a tabela deixa <b>' + F.work.tab + '</b>.</p></div>'
    + '<div class="card claim"><div class="k">o papel</div><p>Vistoria, seguradora e SMS pedem o argumento de tempo por escrito. Nenhum provedor publica o próprio placar contra o que o mar fez.</p></div>'
    + '</div><p class="qt" style="margin-top:28px">“' + esc(F.b704.split(' Guidance note')[0]) + '” — DNV-OS-H101, Seção 4, B704. A norma já pede o erro do local; ninguém o mede.</p>' + ft(2) + '</section>');

  /* 3 · the product */
  S_.push('<section class="s"><div class="ey">2 · o produto</div><h2 style="font-size:36px;margin-bottom:22px">A frota no mapa, a resposta primeiro.</h2><div class="split">'
    + '<div>' + img('fleet', '', 690) + '</div><div class="pts">'
    + '<div class="pt"><b>A resposta antes do gráfico</b><p>Quantas unidades podem começar a operação na hora escolhida, e quais não podem, pelo nome.</p></div>'
    + '<div class="pt"><b>O quadro da frota</b><p>Cada unidade contra os 29 inícios da semana, por bacia ou pela menor folga, ligado ao mapa; sai como planilha (CSV).</p></div>'
    + '<div class="pt"><b>Quatro vereditos, sempre com a palavra</b><p>Forma e palavra, nunca só a cor: LIBERADA, VETADA com a testemunha, INDEFINIDA com o limiar, SEM DADOS com o que falta.</p></div>'
    + '<div class="pt"><b>Três critérios lado a lado</b><p>A faixa medida, a Tabela 4-1 da DNV e o α do local, para a mesma janela.</p></div>'
    + '<div class="pt"><b>Refeito no seu navegador</b><p>' + (F.day ? 'As ' + br.int(F.day.decisions) + ' decisões publicadas do dia' : 'Todas as decisões publicadas do dia') + ', re-decididas na aba pelos mesmos módulos pinados, em segundos, e comparadas com o registro.</p></div>'
    + '</div></div>' + ft(3) + '</section>');

  /* 4 · who it is for */
  S_.push('<section class="s"><div class="ey">3 · para quem</div><h2 style="font-size:36px">Seis decisões, e a porta de cada uma no app.</h2><table class="sm"><thead><tr><th>quem</th><th>a pergunta</th><th>o que leva</th><th>horizonte</th></tr></thead><tbody>'
    + U.map((u) => '<tr><td>' + esc(u.who) + '</td><td>' + esc(u.q) + '</td><td>' + esc(u.gets) + '</td><td>' + esc(u.n.split(' · ')[1] || u.n) + '</td></tr>').join('')
    + '</tbody></table>' + ft(4) + '</section>');

  /* 5 · one decision, inside */
  S_.push('<section class="s"><div class="ey">4 · uma decisão, por dentro</div><div class="split2"><div>' + img('card', 'ph', 262) + '</div><div>'
    + '<h2 style="font-size:34px">Cada veredito com o motivo, a folga e o papel para refazê-lo.</h2><div class="pts">'
    + '<div class="pt"><b>A próxima janela e a folga</b><p>Quando começar, até quando, e quanto falta até o limite na borda desfavorável — a folga arredondada para baixo, nunca exagerada.</p></div>'
    + '<div class="pt"><b>ALÍVIO CRÍTICO, com os seus números</b><p>Capacidade, estoque e produção digitados ficam no navegador; a Janela põe “tanques cheios em X h” ao lado da próxima janela de alívio e avisa quando ela abre tarde demais.</p></div>'
    + '<div class="pt"><b>O custo da espera</b><p>À sua diária — a Janela não inventa diária — até a próxima janela LIBERADA.</p></div>'
    + '<div class="pt"><b>Nota de decisão e certificado .json</b><p>A regra citada com o ato e a página, a rodada, a faixa, o sha256 de cada módulo e registro, e os comandos para refazer à mão.</p></div>'
    + '</div></div></div>' + ft(5) + '</section>');

  /* 6 · the measured band */
  S_.push('<section class="s"><div class="ey">5 · a faixa medida</div><h2>A previsão com o erro medido contra satélite, local a local, prazo a prazo.</h2><div class="col3">'
    + '<div class="card"><div class="k">o arquivo</div><div class="big">' + br.int(F.ecmwfPairs) + '</div><p>pares previsão ECMWF × altímetro de satélite em ' + F.mainSites + ' locais, 2023–2026; mais ' + br.int(F.noaaPairs) + ' da NOAA WAVEWATCH III. Uma faixa calibrada por local e prazo, reivindicando 9/10.</p></div>'
    + '<div class="card"><div class="k">fora da amostra</div><div class="big">' + cov + '</div><p>de cobertura em ' + br.int(H.pairs) + ' comparações posteriores a ' + since + ', que nenhuma faixa viu na calibração.</p></div>'
    + '<div class="card core"><div class="k">a decisão que vale</div><div class="big">' + broke + '</div><p>das LIBERADA com Hs ≤ 2 m rompidas pelo mar (' + br.int(H.broke) + ' de ' + br.int(H.liberada) + '); só com o ECMWF, ' + eBroke + ' (' + br.int(H.eBroke) + ' de ' + br.int(H.eLiberada) + ').</p></div>'
    + '</div><p style="margin-top:22px;font-size:16px">Dois provedores, ECMWF e NOAA: decide a <b>união</b> das duas faixas calibradas, que cobre sempre que uma cobre — escolhida por medição, antes de decidir. Os ensembles brutos são mostrados e avaliados, nunca decidem.</p>'
    + (F.aifs ? '<p style="margin-top:10px;font-size:14px">Um terceiro, o modelo de IA do ECMWF (AIFS, em dados abertos desde maio de 2026), foi medido pela mesma regra, escrita antes: em ' + br.int(F.aifs.test) + ' comparações posteriores a ' + F.aifs.from.slice(8, 10) + '/' + F.aifs.from.slice(5, 7) + ', a união IFS ∪ AIFS liberou ' + F.aifs.ea.liberada + ' com ' + F.aifs.ea.brokeLiberada + ' rompida; IFS ∪ NOAA, ' + F.aifs.en.liberada + ' com ' + F.aifs.en.brokeLiberada + '. Sem diferença medida no que importa primeiro — ele é avaliado todo dia e ainda não decide.</p>' : '') + ft(6) + '</section>');

  /* 7 · the site alpha */
  const A = F.alpha;
  S_.push('<section class="s"><div class="ey">6 · o α do local</div><h2>Nas bacias offshore, o α medido fica acima da tabela do Mar do Norte em toda célula.</h2><div class="col3">'
    + '<div class="card"><div class="k">o método, calibrado antes</div><div class="big">' + A.cal.within + ' de ' + A.cal.of + '</div><p>células da Tabela 4-1 reproduzidas (±0,02) pelo método que a fez, antes de olhar o Brasil.</p></div>'
    + '<div class="card core"><div class="k">Hs de projeto 2 m · ' + A.basins + ' locais offshore</div><div class="big">' + d2(A.lo) + '–' + d2(A.hi) + '</div><p>o α do local, contra ' + d2(A.tLo) + '–' + d2(A.tHi) + ' da tabela; o intervalo de 90% acima da tabela em ' + A.above + ' de ' + A.n + ' células.</p></div>'
    + '<div class="card"><div class="k">Santos · Hs ≤ 2,0 m · 48 h</div><table class="sm" style="font-size:14px"><tbody><tr><td>o mar permite</td><td class="n">' + F.work.sea + '</td></tr><tr><td>Tabela 4-1 (α ' + br.dec(F.work.aT) + ')</td><td class="n">' + F.work.tab + '</td></tr><tr><td>α do local (' + br.dec(F.work.aS) + ')</td><td class="n">' + F.work.loc + '</td></tr></tbody></table><p style="font-size:13px">dos inícios de operação, ' + F.work.from + '–' + F.work.to + ', contados exatamente.</p></div>'
    + '</div><p style="margin-top:22px;font-size:15px">Uma estimativa estatística (intervalo de 90%, reamostragem por dia), usada pelo seu limite inferior; a cauda de 1 em 10.000 da norma é extrapolação de modelo. Na costa (Florianópolis) e em Sergipe-Alagoas o α do local fica na tabela ou abaixo dela — e a Janela diz isso também. Evidência para o vistoriador refazer, nunca uma aprovação.</p>' + ft(7) + '</section>');

  /* 8 · the campaign */
  S_.push('<section class="s"><div class="ey">7 · a campanha</div><h2>Dez lançamentos de 48 h em Santos a partir de 1º de novembro: quantos dias de embarcação?</h2>'
    + '<table><thead><tr><th>critério</th><th class="n">metade dos anos</th><th class="n">9 de cada 10</th><th class="n">o pior ano</th></tr></thead><tbody>'
    + F.camp.map((r) => '<tr><td>' + esc(r.k) + '</td><td class="n"><b>' + r.q50 + ' dias</b></td><td class="n">' + r.q90 + '</td><td class="n">' + r.worst + (r.wy ? ' (' + r.wy + ')' : '') + '</td></tr>').join('')
    + '</tbody></table><p style="margin-top:24px">Cada um dos ' + (F.camp[0].fin + F.camp[0].cen) + ' anos do hindcast roda a campanha: a primeira janela depois de 1º de novembro, a operação ocupa a janela, a seguinte procura a partir do fim dela. Os quantis são estatísticas de ordem exatas dos anos que terminam' + (F.camp.some((r) => r.cen) ? ' (' + F.camp.filter((r) => r.cen).map((r) => r.cen + ' ano na linha “' + r.k.split(' (')[0] + '”').join(' e ') + ' não termina antes do fim do registro: contado, fica de fora)' : '') + '. <b>A distância entre a tabela e o α do local, em dias de embarcação, é o argumento que o vistoriador avalia.</b></p>'
    + '<p style="margin-top:12px;font-size:14px">Sem trânsito nem espera de mobilização; um hindcast (Ifremer WAVEWATCH III) é o mar passado de um modelo, e a conta é exata sobre ele' + (F.pnb ? ' — e o hindcast foi conferido contra ' + F.pnb.deployments + ' implantações das boias da Marinha (PNBOIA, ' + F.pnb.from + '–' + F.pnb.to + ', ' + br.int(F.pnb.pairs) + ' pares): tempo com Hs ≤ 2,0 m, boias ' + F.pnb.b20 + ', hindcast ' + F.pnb.h20 + '; abaixo de 1,5 m o hindcast é conservador (' + F.pnb.h15 + ' contra ' + F.pnb.b15 + ')' : '') + '. No app, qualquer área, limite, janela, número de operações e mês.</p>' + ft(8) + '</section>');

  /* 9 · why trust it */
  const sec = F.day && F.day.second;
  S_.push('<section class="s"><div class="ey">8 · por que confiar</div><h2>Confiança que se confere, não que se pede.</h2><div class="col2" style="gap:22px">'
    + '<div class="pt"><b>Aritmética exata</b><p>Cada veredito é decidido em racionais sobre o limite como impresso; a faixa publicada é arredondada para fora, então LIBERADA e VETADA valem sobre a exata.</p></div>'
    + '<div class="pt"><b>Refeito no navegador de quem lê</b><p>Os módulos que decidem vão dentro da página, com sha256 pinado; a aba refaz todas as decisões publicadas do dia e compara com o registro.</p></div>'
    + '<div class="pt"><b>Um segundo verificador</b><p>Escrito a partir da especificação, sem ler o primeiro (Python, nenhum código em comum)' + (sec ? ': ' + br.int(sec.equal) + ' de ' + br.int(sec.decisions) + ' decisões iguais' : '') + '. O build recusa um dia em que os dois discordem.</p></div>'
    + '<div class="pt"><b>Um placar público</b><p>' + br.int(N.ledger.commits) + ' faixas comprometidas antes da hora-alvo desde ' + br.date(N.ledger.first) + ', avaliadas por satélite; a regra que poda uma faixa foi datada antes do primeiro dado. O registro só cresce.</p></div>'
    + '<div class="pt"><b>Entradas pinadas</b><p>A previsão, as faixas, as regras da Capitania e a tabela da DNV entram por sha256; a Nota diz qual commit fez o dia e como refazê-lo.</p></div>'
    + '<div class="pt"><b>O que é dito, e o que não é</b><p>Decide-se a faixa nos passos da previsão, no nó do modelo — não o mar entre passos, não o berço, não uma probabilidade.</p></div>'
    + '</div>' + ft(9) + '</section>');

  /* 10 · coverage and sources */
  S_.push('<section class="s"><div class="ey">9 · cobertura e fontes</div><h2>A margem brasileira inteira, com dados de uso comercial livre.</h2><div class="col3">'
    + '<div class="card"><div class="k">onde</div><div class="big">' + F.units + '</div><p>unidades de produção offshore da ANP (FPSO, FSO, plataformas), cada uma com a faixa do local medido mais perto; ' + F.sites + ' locais medidos contra satélite, de Pelotas à Foz do Amazonas.</p></div>'
    + '<div class="card"><div class="k">as regras</div><div class="big">' + F.rules + '</div><p>limites publicados de ' + F.acts + ' atos da Autoridade Marítima (NPCPs e portarias), com página e citação literal; o critério de alívio citado (OMAE2010-20147); a Tabela 4-1 da DNV.</p></div>'
    + '<div class="card"><div class="k">os dados</div><p style="font-size:15px">ECMWF open data (CC BY 4.0) · NOAA WAVEWATCH III (domínio público) · altimetria NOAA (domínio público) · corrente Copernicus Marine (mostrada, ainda não decidida) · hindcast Ifremer (CC BY-SA 4.0) · ANP GeoMaps.</p></div>'
    + '</div><p style="margin-top:22px;font-size:15px">Coleta diária automática; cada dia publicado com o commit que o fez. A Janela roda no navegador: nenhum número digitado (estoque, diária, limite) sai dele.</p>' + ft(10) + '</section>');

  /* 11 · honest limits */
  S_.push('<section class="s"><div class="ey">10 · o que a Janela não diz</div><h2>Os limites, ditos antes que alguém pergunte.</h2><ul style="font-size:17px">'
    + '<li><b>Não é aprovação de operação.</b> Garantia marítima e classificadoras são donas dessa palavra; a Janela é evidência que um vistoriador refaz.</li>'
    + '<li><b>O nó do modelo, não o berço.</b> Num terminal, a previsão é o mar aberto da aproximação: limites de onda no berço ficam SEM DADOS até existir a transferência costeira.</li>'
    + '<li><b>Corrente e visibilidade não decidem.</b> A corrente é mostrada e está sendo medida contra observação; uma regra que a limita fica SEM DADOS, e diz o que a fecharia.</li>'
    + '<li><b>O α do local é uma estimativa;</b> a cauda de 1 em 10.000 da norma é extrapolação. Em Sergipe-Alagoas a faixa tende a ser conservadora (o satélite vê o mar de 40–100 km da costa).</li>'
    + '<li><b>O placar para a frente está começando:</b> as primeiras faixas são avaliadas três dias depois de cada dia fechar; a primeira leitura de admissão vem com 30 dias-ensaio.</li>'
    + '<li><b>Os limites de carga, lançamento e içamento são exemplos</b> e dizem isso; o de alívio é citado. Use os do seu procedimento.</li>'
    + '</ul>' + ft(11) + '</section>');

  /* 12 · the next step */
  S_.push('<section class="s"><div class="ey">11 · o próximo passo</div><h2>Um piloto sobre as suas operações, avaliado pelo próprio placar.</h2><div class="col3">'
    + '<div class="card"><div class="k">pedimos</div><ul style="font-size:15px"><li>uma operação (alívio, carga de PSV, uma campanha)</li><li>os limites do seu procedimento</li><li>as unidades e um interlocutor de operação</li><li>se houver, o registro de espera por tempo, para comparar</li></ul></div>'
    + '<div class="card"><div class="k">entregamos</div><ul style="font-size:15px"><li>as janelas diárias dessas unidades, com Nota de decisão</li><li>as decisões conferidas por satélite, no placar</li><li>o argumento do α do local, para o vistoriador refazer</li><li>tudo reexecutável, com o código aberto</li></ul></div>'
    + '<div class="card core"><div class="k">contato</div><p><b>Carlos Toledo</b></p><p>carlos@carlostoledo.co</p><p>carlostoledo.co/janela</p><p style="font-size:13px">o método: carlostoledo.co/janela/metodo</p></div>'
    + '</div><p style="margin-top:22px;font-size:13px;color:var(--ink-4)">Evidência reexecutável sobre uma janela — não aprovação de operação nem certificação de classe; não substitui o procedimento nem a responsabilidade de quem assina. Os números deste documento são lidos dos registros do repositório no momento em que ele foi gerado.</p>' + ft(12) + '</section>');

  need(S_.length === 12, 'expected 12 slides, built ' + S_.length);
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Janela — apresentação</title>'
    + '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css() + '</style></head><body>' + S_.join('\n') + '</body></html>';
}

/* ---- the two pictures, from the built app, through a local server (the app's own loader, its own data) ---- */
function serve() {
  const SITE = path.join(ROOT, 'site');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.bin': 'application/octet-stream', '.i16': 'application/octet-stream' };
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let f = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(SITE)) { rsp.writeHead(400); rsp.end(); return; }
      try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* 404 below */ }
      fs.readFile(f, (err, b) => { if (err) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); rsp.end(b); });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
async function shots() {
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/janela/';
  const out = {};
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable');
      const go = async (url, w, h, scale, mobile, ev) => {
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile });
        await send('Page.navigate', { url: 'about:blank' }); await settle(300);
        await send('Page.navigate', { url });
        await settle(7000);                                                   /* real wait: the data, the map, the tab's re-check */
        const ok = await send('Runtime.evaluate', { expression: '!!(window.__janela && window.__janela.check && window.__janela.check.ok)', returnByValue: true });
        if (!ok.result.value) throw new Error('the app did not re-check its day in the tab before the screenshot (' + url + ')');
        if (ev) { await send('Runtime.evaluate', { expression: ev }); await settle(1500); }
        return (await send('Page.captureScreenshot', { format: 'png' })).data;
      };
      out.fleet = await go(base + '#op=alivio&modo=semana', 1440, 900, 1, false, "var t=document.getElementById('jn-introt');if(t.getAttribute('aria-expanded')==='true')t.click()");
      out.card = await go(base + '#site=uep-12446&op=alivio&modo=semana', 390, 760, 2, true, "window.__janela.setSheet('full');document.getElementById('jn-scroll').scrollTop=document.getElementById('jn-card').offsetTop-4");
    }, { port: 9243 });
  } finally { srv.close(); }
  return out;
}

/* ---- the link-preview card (site/janela/og.png, 1200x630): the same words as slide 1, the app's own picture ---- */
function ogHtml(N, shots) {
  const F = facts(N);
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css()
    + 'html,body{width:1200px;height:630px;overflow:hidden}.og{width:1200px;height:630px;display:grid;grid-template-columns:520px 1fr;gap:0;background:var(--paper)}'
    + '.og .t{padding:56px 22px 44px 56px;display:flex;flex-direction:column;gap:22px}.og h1{font-size:52px;max-width:none}.og p{font-size:19px}'
    + '.og .pic{position:relative;overflow:hidden;border-left:1px solid var(--rule)}.og .pic img{position:absolute;right:0;top:0;height:630px}'
    + '.og .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}.og .jn-c{font-size:11px;padding:.4em .6em;gap:6px}.og .u{font-family:var(--f-mono);font-size:13px;letter-spacing:.14em;color:var(--ink-4);text-transform:uppercase}</style></head><body>'
    + '<div class="og"><div class="t"><div class="u">Janela · energia offshore</div><h1>A janela de cada operação offshore, decidida.</h1>'
    + '<p>' + F.units + ' unidades de produção · previsão com o erro medido por satélite · o limite da sua operação</p>'
    + '<div class="chips">' + ['L', 'V', 'I', 'S'].map(chip).join('') + '</div></div>'
    + '<div class="pic">' + (shots && shots.fleet ? '<img src="data:image/png;base64,' + shots.fleet + '" alt="">' : '') + '</div></div></body></html>';
}
async function snap(html, w, h) {
  const os = require('os');
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const tmp = path.join(os.tmpdir(), 'janela-og-' + process.pid + '.html');
  fs.writeFileSync(tmp, html);
  try {
    return await withChrome(async (send) => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'file://' + tmp });
      await settle(3000);                                                    /* real wait: fonts */
      return Buffer.from((await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } })).data, 'base64');
    }, { port: 9244 });
  } finally { fs.unlinkSync(tmp); }
}
const og = (N, shots) => snap(ogHtml(N, shots), 1200, 630);

module.exports = { build, shots, print: CP.print, facts, og };
