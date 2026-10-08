/* build-app.js — /swell/: the app shell. STATIC: it carries the island model's beaches, the places, the deciding
   modules as text (q.js, decide.js, surf.js — sha256 pinned, the tab re-checks them against the day) and the words
   of "Como sabemos" generated from the records; the DAY is fetched from the swell-field branch, the island textures
   and the basemap from the repository by the commit that holds their pinned bytes (data/PINS.json), so main does
   not grow by a day and Vercel never carries 40 MB of binaries.

   emit(git) -> { files, bytes } writes site/swell/{index.html, app.js, model.js, early.js, vendor/}; on a desk it
   also copies the textures and the tiles to site/swell/{island,tiles}/ (git-ignored) so a local server needs nothing
   else. Called by apps/swell/build.js after the gates.
   apps/swell/app · cert-machine                                                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..', '..');
const SITE = path.join(ROOT, 'site', 'swell');
const APP = path.join(__dirname, '..');
const { renderApp } = require(path.join(ROOT, 'design', 'app-shell.js'));
const S = require('../model/surf.js');
const DAY = require('../build-day.js');

const REPO = 'https://raw.githubusercontent.com/carlostoledo1891/cert-machine/';
const FIELD = REPO + 'swell-field/';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const die = (m) => { throw new Error('REFUSED: ' + m); };

/* the pinned data, re-hashed; and the commit the published page fetches it from (the newest commit that touched
   apps/swell/data, whose tree must equal the working tree's — a texture is served exactly as pinned or not at all) */
function pinned() {
  const P = J('apps/swell/data/PINS.json');
  for (const [rel, p] of Object.entries(P.files)) {
    const b = fs.readFileSync(path.join(APP, 'data', rel));
    if (sha(b) !== p.sha256) die('apps/swell/data/' + rel + ' does not hash to its pin');
  }
  let at = null;
  try {
    at = cp.execSync('git log -1 --format=%H -- apps/swell/data', { cwd: ROOT }).toString().trim();
    cp.execSync('git diff --quiet ' + at + ' -- apps/swell/data', { cwd: ROOT });
  } catch (e) { die('apps/swell/data differs from its last commit: commit and push it first (the page serves the data by that commit)'); }
  return { P, at };
}

function words(calib) {
  const R = S.RULES, pct = (x) => (100 * x).toFixed(1).replace('.', ',');
  const b24 = calib.bins[0], H = calib.heldOut;
  const rules = (lang) => '<table><thead><tr><th>' + (lang === 'pt' ? 'Atividade' : 'Activity') + '</th><th>' + (lang === 'pt' ? 'A regra' : 'The rule') + '</th></tr></thead><tbody>' +
    S.ACT_ORDER.map((a) => '<tr><td>' + { pt: { surf: 'Surfe', kite: 'Kite', sup: 'SUP', swim: 'Banho', fish: 'Pesca', boat: 'Barco' }, en: { surf: 'Surf', kite: 'Kite', sup: 'SUP', swim: 'Swim', fish: 'Fish', boat: 'Boat' } }[lang][a] +
      '</td><td>' + R[a].text[lang] + '</td></tr>').join('') + '</tbody></table>';
  const pt = `
<h3>O que é</h3>
<p>Para 34 praias de Florianópolis, o mar de cada uma no horário que você escolhe — a onda na beira e o vento — e, em seis ícones, o que esse mar quer dizer para surfar, velejar, remar, nadar, pescar e sair de barco; separado, o que está <b>decidido</b> e o que é só <b>previsão</b>. Escolher uma atividade só destaca as praias boas para ela: o horário, as ondas e o vento continuam os mesmos. Swell parte do mar aberto na borda leste da ilha: a previsão do ECMWF e da NOAA, lida uma vez por dia (rodada das 00 UTC, de 3 em 3 horas), com o <b>erro medido por satélite</b>. Um modelo das ondas da ilha inteira, sobre o fundo do mar da carta náutica 1902 da Marinha, leva cada ondulação até cada praia: dobra nas pontas, cresce no raso, perde força atrás das pontas e quebra.</p>
<h3>O que é decidido</h3>
<p>Só os limites de ondas, e sempre sobre a <b>faixa medida</b>. A faixa do mar aberto vem do erro que os satélites mediram nesta borda (${b24.ecmwf.n} passagens a 24 h de antecedência, 2023–2026, a faixa promete ${b24.ecmwf.coverage.replace('/', ' de ')}); a usada é a união da faixa do ECMWF com a da NOAA, que nos ${Math.round(15)} meses de teste que nunca viu cobriu ${pct(H.coverage)}% de ${H.n.toLocaleString('pt-BR')} medições de satélite. O modelo da ilha leva as duas bordas da faixa até cada praia (a altura de quebra cresce com o mar, então a faixa da praia é exata sobre o modelo). Se mesmo a borda baixa passa do limite: <b>PERIGO</b>, decidido. Se a faixa cruza o limite: <b>ATENÇÃO</b>, com quanto falta para virar. Se a faixa toda fica abaixo: abaixo do limite — o que <b>não quer dizer seguro</b>.</p>
<p>A conta é refeita no seu navegador com os mesmos arquivos que fizeram o dia publicado, e o resultado é comparado com ele (um sha256 sobre cada altura e cada decisão). O certificado de cada praia e horário pode ser baixado e refeito por qualquer um.</p>
${rules('pt')}
<h3>O que é previsão</h3>
<p>O <b>vento</b> (ECMWF a 10 m, na grade sobre a ilha: o erro dele nas praias ainda não foi medido), a nota que dá a cada atividade o seu ícone (bom, dá pra ir, fraco), as correntes ao longo da praia (pela altura e o ângulo das ondas), o risco de corrente de retorno (regra prática), a marola das baías (do vento), a maré e a temperatura da água (Copernicus). Avisos de previsão aparecem com borda tracejada; o que é decidido, com borda cheia e em maiúsculas.</p>
<p><b>Medido, nem previsão nem decisão</b>: quanto cada praia costuma quebrar, visto do espaço — em 190 passagens sem nuvens do Sentinel-2 (2022–2026), a parte da zona de arrebentação que estava branca de espuma. Diz como a praia é (larga e rasa espuma mais com o mesmo mar), não como o dia vai ser.</p>
<h3>O modelo das praias</h3>
<p>64 casos (16 direções × 4 períodos, 6 a 15 s) sobre uma grade de 30 m da ilha inteira: refração, empinamento e abrigo, linear. Em cada praia a altura é lida em sondas de 1 a 9–13 m de fundo; a onda quebra onde chega a ${S.C.GAMMA.toLocaleString('pt-BR')} vez a profundidade, marchando do fundo para a beira (e o maior valor de uma sonda da zona de arrebentação, quando um trecho da praia concentra a ondulação). No Swell original as sondas paravam em 4,5–6,5 m e 14 das 21 praias de mar aberto nunca passavam de 2,5 m, qualquer que fosse o mar; agora o limite é de 4,9 a 7,2 m.</p>
<h3>Limites</h3>
<p>O erro do próprio modelo da ilha na beira <b>não foi medido</b> (falta uma medida na praia: uma boia ou uma câmera). Os bancos de areia de hoje não estão no fundo do mar; até 10 m de fundo o perfil é ajustado à linha de 10 m da carta. <b>Guarda do Embaú</b> fica a 0,6 km da borda do modelo e é <b>recusada</b>: ali a onda que entra pela borda ainda não dobrou no fundo. O mar de vento mais curto que 6 s é lido como o caso de 6 s; uma ondulação mais longa que 15 s é lida como 15 s e avisada no cartão da praia. Só contam as horas de luz. Não serve para navegação.</p>
<h3>Fontes</h3>
<p>Mar e vento: ECMWF open data (CC BY 4.0) e NOAA WAVEWATCH III / GFS-Wave (domínio público). Erro medido: satélites altímetros (NOAA RADS), as faixas calibradas do Janela no ponto da borda da ilha. Maré e temperatura da água: Generated using E.U. Copernicus Marine Service Information (doi:10.48670/moi-00016). Espuma vista do espaço: contém dados modificados do Copernicus Sentinel 2022–2026. Fundo do mar: carta náutica 1902 da Marinha do Brasil (DHN/CHM; uso não comercial, não serve para navegação) e GMRT (CC BY 4.0). Mapa e locais: © OpenStreetMap, Protomaps. Modelo da ilha: o Swell original (frontier-apps), com os mesmos 64 casos. Código (MIT): <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/swell">apps/swell</a>.</p>`;
  const en = `
<h3>What it is</h3>
<p>For 34 beaches of Florianópolis, the sea at each one at the hour you choose — the waves at the shore and the wind — and, in six icons, what that sea means for surfing, sailing, paddling, swimming, fishing and boating; kept apart, what is <b>decided</b> and what is only <b>forecast</b>. Picking an activity only highlights the beaches good for it: the hour, the waves and the wind stay the same. Swell starts from the open sea at the island's eastern edge: ECMWF's and NOAA's forecast, read once a day (the 00 UTC run, every 3 hours), with its <b>error measured by satellites</b>. A wave model of the whole island, over the seafloor of the Brazilian Navy's chart 1902, carries each swell to each beach: it bends round the headlands, grows in the shallows, fades behind them and breaks.</p>
<h3>What is decided</h3>
<p>Only the wave limits, and always over the <b>measured band</b>. The open sea's band comes from the error the satellites measured at this edge (${b24.ecmwf.n} passes at 24 h lead, 2023–2026, the band claims ${b24.ecmwf.coverage.replace('/', ' of ')}); the one used is the union of ECMWF's band and NOAA's, which over the 15 test months it never saw covered ${(100 * H.coverage).toFixed(1)}% of ${H.n.toLocaleString('en')} satellite measurements. The island model carries both edges of the band to each beach (the breaking height grows with the sea, so the beach's band is exact over the model). If even the low edge is over the limit: <b>DANGER</b>, decided. If the band straddles it: <b>CAUTION</b>, with how far it is from turning. If the whole band is under it: under the limit — which <b>does not mean safe</b>.</p>
<p>The arithmetic is redone in your browser with the same files that made the published day, and compared with it (a sha256 over every height and every decision). Each beach and hour's certificate can be downloaded and redone by anyone.</p>
${rules('en')}
<h3>What is forecast</h3>
<p>The <b>wind</b> (ECMWF at 10 m, on the grid over the island: its error at the beaches has not been measured yet), the score that gives each activity its icon (good, doable, poor), the longshore currents (from the waves' height and angle), the rip-current risk (a rule of thumb), the bays' chop (from the wind), the tide and the water temperature (Copernicus). Forecast warnings carry a dashed border; what is decided, a solid one and capitals.</p>
<p><b>Measured, neither forecast nor decision</b>: how much each beach usually breaks, seen from space — in 190 cloud-free Sentinel-2 passes (2022–2026), the share of its surf zone that was white with foam. It says what the beach is like (wide and shallow foams more for the same sea), not what the day will be.</p>
<h3>The beach model</h3>
<p>64 cases (16 directions × 4 periods, 6 to 15 s) on a 30 m grid of the whole island: refraction, shoaling and shelter, linear. At each beach the height is read at probes from 1 to 9–13 m deep; the wave breaks where it reaches ${S.C.GAMMA} times the depth, marching in from deep water (and the largest value at a surf-zone probe, where one stretch of the beach focuses the swell). In the original Swell the probes stopped at 4.5–6.5 m and 14 of the 21 open-sea beaches could never read more than 2.5 m whatever the sea did; the limit is now 4.9 to 7.2 m.</p>
<h3>Limits</h3>
<p>The island model's own error at the shore <b>has not been measured</b> (a measurement at the beach is missing: a buoy or a camera). Today's sandbars are not in the seafloor; inside 10 m the profile is fitted to the chart's 10 m line. <b>Guarda do Embaú</b> lies 0.6 km from the model's edge and is <b>refused</b>: there the wave entering through the edge has not yet bent over the seafloor. A wind sea shorter than 6 s is read as the 6 s case; a swell longer than 15 s is read as 15 s and flagged on the beach's card. Only daylight hours count. Not for navigation.</p>
<h3>Sources</h3>
<p>Sea and wind: ECMWF open data (CC BY 4.0) and NOAA WAVEWATCH III / GFS-Wave (public domain). Measured error: satellite altimeters (NOAA RADS), Janela's calibrated bands at the island-edge point. Tide and water temperature: Generated using E.U. Copernicus Marine Service Information (doi:10.48670/moi-00016). Foam seen from space: contains modified Copernicus Sentinel data 2022–2026. Seafloor: Brazilian Navy chart 1902 (DHN/CHM; non-commercial use, not for navigation) and GMRT (CC BY 4.0). Map and places: © OpenStreetMap, Protomaps. Island model: the original Swell (frontier-apps), the same 64 cases. Code (MIT): <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/swell">apps/swell</a>.</p>`;
  const boardIntro = {
    pt: `<p>O placar do mar aberto de onde o Swell parte: cada dia, antes de acontecer, a faixa de cada previsão é gravada num registro que só cresce (certs/janela-ledger), e os satélites a conferem três dias depois. Uma faixa que promete 9 de 10 e erra mais do que isso deixa de decidir.</p><p>O que já está medido: nos 15 meses de teste que nunca viu, a faixa que decide (ECMWF ∪ NOAA) cobriu <b>${(100 * H.coverage).toFixed(1).replace('.', ',')}%</b> de ${H.n.toLocaleString('pt-BR')} medições de satélite (todas as áreas medidas do Janela). Nesta borda da ilha, a faixa do ECMWF foi cortada de ${b24.ecmwf.n} pares a 24 h.</p><h3>Nesta borda da ilha, ao vivo</h3>`,
    en: `<p>The scoreboard of the open sea Swell starts from: every day, before it happens, each forecast's band is written to an append-only record (certs/janela-ledger), and the satellites check it three days later. A band that claims 9 in 10 and misses more than that stops deciding.</p><p>What is already measured: over the 15 test months it never saw, the deciding band (ECMWF ∪ NOAA) covered <b>${(100 * H.coverage).toFixed(1)}%</b> of ${H.n.toLocaleString('en')} satellite measurements (every site Janela measures). At this island edge, ECMWF's band was cut from ${b24.ecmwf.n} pairs at 24 h.</p><h3>At this island edge, live</h3>`,
  };
  const boardFoot = {
    pt: '<p class="sw-note">As primeiras medidas ao vivo chegam três dias depois de cada previsão (as primeiras em 9 de outubro de 2026). A altura na beira de cada praia ainda não tem medida: o placar é do mar aberto.</p>',
    en: '<p class="sw-note">The first live scores arrive three days after each forecast (the first on 9 October 2026). The height at each beach has no measurement yet: the scoreboard is the open sea\'s.</p>',
  };
  return { how: { pt, en }, boardIntro, boardFoot };
}

function panel() {
  return `
<div class="sw-grab" aria-hidden="true"></div>
<div class="sw-phead">
  <div id="sw-when"></div>
  <p id="sw-sea">O mar de Florianópolis, praia por praia: a onda e o vento em cada praia, e o que isso quer dizer para surfar, velejar, remar, nadar, pescar e sair de barco — com o perigo decidido sobre o erro medido da previsão.</p>
  <div class="sw-cap" id="sw-cap"></div>
  <div class="sw-acts" id="sw-acts" role="group" aria-label="atividades"></div>
  <p id="sw-focus" hidden></p>
  <nav id="sw-days" aria-label="dia"></nav>
  <div class="sw-hourrow"><div class="sw-scrub"><canvas id="sw-daystrip"></canvas><input id="sw-hour" type="range" min="0" max="7" step="1" aria-label="horário"></div><span id="sw-hour-v"></span><button class="sw-btn" id="sw-now">agora</button></div>
</div>
<nav class="sw-tabs" role="tablist">
  <button class="sw-tab on" data-tab="beaches" role="tab">Praias</button>
  <button class="sw-tab" data-tab="week" role="tab">Semana</button>
  <button class="sw-tab" data-tab="map" role="tab">Mapa</button>
  <span class="ul"></span>
</nav>
<div class="sw-scroll">
  <section class="sw-pane on" data-pane="beaches">
    <div id="sw-legend"></div>
    <section id="sw-rank"></section>
    <section id="sw-card" hidden></section>
  </section>
  <section class="sw-pane" data-pane="week">
    <div id="sw-tl-line"></div>
    <canvas id="sw-tl-chart"></canvas>
    <div class="sw-tlb"><button class="sw-btn" id="sw-tl-prev">−3 h</button><button class="sw-btn" id="sw-tl-now">agora</button><button class="sw-btn" id="sw-tl-next">+3 h</button><span class="sp"></span><span class="sw-note" id="sw-tl-scope"></span></div>
    <h2 class="sw-sec" id="sw-grid-h"></h2>
    <canvas id="sw-tl-grid"></canvas>
    <p class="sw-note" id="sw-grid-n"></p>
    <div class="sw-legend" id="sw-tl-legend"></div>
  </section>
  <section class="sw-pane" data-pane="map">
    <div id="sw-layers-body"></div>
    <p class="sw-note" id="sw-map-note"></p>
  </section>
</div>`;
}
function extra() {
  return `<div id="sw-intro" aria-hidden="true"><div class="mark"><div class="word">SWELL</div><div class="line"><svg viewBox="0 0 420 28" preserveAspectRatio="none"><path d="M0 14 C 35 2, 70 2, 105 14 S 175 26, 210 14 S 280 2, 315 14 S 385 26, 420 14"/></svg></div><p class="sub" id="sw-intro-sub"></p></div></div>
<canvas id="sw-windfx"></canvas>
<div class="sw-layq" id="sw-layq" role="group"></div>
<canvas id="sw-flowfx"></canvas>
<div id="sw-toast" role="status"></div>
<div id="sw-tip" role="tooltip" hidden></div>
<section id="sw-sheet-how" class="sw-sheet" hidden><button class="sw-btn x" data-close></button><h2 id="sw-how-title"></h2><div id="sw-how-body"></div></section>
<section id="sw-sheet-board" class="sw-sheet" hidden><button class="sw-btn x" data-close></button><h2 id="sw-board-title"></h2><div id="sw-board-body"></div></section>
<section id="sw-sheet-sos" class="sw-sheet" hidden><button class="sw-btn x" data-close></button><h2 id="sw-sos-title"></h2><div id="sw-sos-body"></div></section>`;
}

/* the vendored map library (Janela's pinned copy and its declared patch rule — one definition) and pmtiles.js */
function vendor() {
  require('../../janela/app/build-app.js').vendor(SITE);
  const V = path.join(ROOT, 'apps', 'skyaudit', 'vendor');
  const pins = Object.fromEntries(fs.readFileSync(path.join(V, 'VENDOR-SHA256.txt'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse()));
  const b = fs.readFileSync(path.join(V, 'pmtiles.js'));
  if (sha(b) !== pins['pmtiles.js']) die('pmtiles.js is not the pinned bytes (apps/skyaudit/vendor/VENDOR-SHA256.txt)');
  fs.writeFileSync(path.join(SITE, 'vendor', 'pmtiles.js'), b);
}

function emit(git, opts) {
  opts = opts || {};
  const { P, at } = pinned();
  fs.mkdirSync(SITE, { recursive: true });
  vendor();
  /* on a desk: the textures and tiles beside the page (git-ignored), so a local server serves the same bytes */
  if (!opts.noLocal) {
    for (const [rel] of Object.entries(P.files)) {
      if (!/^(island|tiles)\//.test(rel)) continue;
      const to = path.join(SITE, rel); fs.mkdirSync(path.dirname(to), { recursive: true });
      if (!fs.existsSync(to) || sha(fs.readFileSync(to)) !== P.files[rel].sha256) fs.copyFileSync(path.join(APP, 'data', rel), to);
    }
  }
  const IDX = J('apps/swell/data/island/index.json');
  const BEACHES = J('apps/swell/data/beaches.json');
  const POIS = J('apps/swell/data/pois.json');
  const FOAM = J('apps/swell/data/foam.json');
  const mods = { src: {}, pins: {} };
  for (const rel of DAY.MODULES) { const t = fs.readFileSync(path.join(ROOT, rel), 'utf8'); mods.src[path.basename(rel)] = t; mods.pins[path.basename(rel)] = { rel, sha: sha(t) }; }
  const MODEL = 'Object.assign(window.SWELL,' + JSON.stringify({ beaches: BEACHES, pois: POIS, foam: FOAM, modules: mods }).replace(/</g, '\\u003c') + ');\n';
  fs.writeFileSync(path.join(SITE, 'model.js'), MODEL);
  const APPJS = fs.readFileSync(path.join(__dirname, 'client.js'));
  fs.writeFileSync(path.join(SITE, 'app.js'), APPJS);
  const EARLY = Buffer.from("(function(){var c=window.SWELL&&window.SWELL.data;if(!c||!window.fetch)return;"
    + "var local=/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)||location.protocol==='file:';"
    + "var h=new Date().toISOString().slice(0,13).replace(/[^0-9]/g,'');"
    + "var u=(local?c.today.slice().reverse():c.today).map(function(x){return /^https:/.test(x)?x+'?h='+h:x;});"
    + "var get=function(i){return fetch(u[i],{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})"
    + ".catch(function(e){if(i+1<u.length)return get(i+1);throw e;});};"
    + "window.SWELL_EARLY={today:get(0)};})();\n");
  fs.writeFileSync(path.join(SITE, 'early.js'), EARLY);

  /* the calibration facts the words quote, from the same records build-day.js reads */
  const calib = (() => {
    const B = J('certs/janela-bands.json'), N = J('certs/janela-bands-noaa.json'), EV = J('certs/janela-providers-eval.json');
    const c = (rec, bin) => { const x = rec.sites.floripa.bins[bin].hs; return { n: x.n, coverage: x.coverage }; };
    const U = EV.results.find((x) => x.option === 'U(E,N)' && x.miss === '1/10');
    return { bins: [{ lead: 24, ecmwf: c(B, '24'), noaa: c(N, '24') }], heldOut: { n: U.n, coverage: U.coverage } };
  })();
  const W = words(calib);
  const dataBase = REPO + at + '/apps/swell/data/';
  const cfg = {
    v: 1, git, data: { today: [FIELD + 'today.json', 'data/today.json'] },
    island: { lon: IDX.grid.lon, lat: IDX.grid.lat, texture: IDX.texture, dirs: IDX.dirs, periods: IDX.periods, cases: IDX.cases,
      base: dataBase + 'island/', local: 'island/', pins: Object.fromEntries(Object.entries(P.files).filter(([k]) => k.startsWith('island/')).map(([k, v]) => [k.slice(7), v.sha256])) },
    tiles: { url: dataBase + 'tiles/floripa.pmtiles', local: 'tiles/floripa.pmtiles', sha256: P.files['tiles/floripa.pmtiles'].sha256,
      attribution: '<a href="https://openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' },
    credit: 'ECMWF open data (CC BY 4.0) · NOAA · E.U. Copernicus Marine Service Information · carta DHN 1902 (não comercial, não serve para navegação)',
    dataAt: at, how: W.how, boardIntro: W.boardIntro, boardFoot: W.boardFoot,
    shas: { 'app.js': sha(APPJS), 'model.js': sha(MODEL), 'early.js': sha(EARLY) },
  };
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = renderApp({
    title: 'Swell — o mar de Florianópolis, praia por praia',
    description: 'Para 34 praias de Florianópolis: onde e quando está bom para surfar, velejar, remar, nadar, pescar e sair de barco nos próximos 7 dias — com o perigo decidido sobre o erro medido da previsão, e o resto dito como previsão.',
    path: '/swell/', lang: 'pt-BR', appName: 'Swell', brand: 'CERT-MACHINE', homeHref: '/',
    og: fs.existsSync(path.join(SITE, 'og.png')) ? { image: '/swell/og.png', alt: 'Swell: a ilha de Santa Catarina com as cristas das ondas desenhadas pelo modelo da ilha, e a melhor praia do dia para cada atividade' } : undefined,
    meta: '<span id="sw-run">—</span>',
    topHtml: '<div class="sw-topctl"><button class="sw-btn" id="sw-how"></button><button class="sw-btn" id="sw-boardb"></button><button class="sw-btn" id="sw-sos"></button><div class="sw-lang" role="group" aria-label="idioma / language"><button data-lang="pt">PT</button><button data-lang="en">EN</button></div></div>',
    navLinks: [{ href: 'https://github.com/carlostoledo1891/cert-machine/tree/main/apps/swell', label: 'código' }],
    mapAria: 'Mapa da ilha de Santa Catarina: as praias marcadas com a condição da atividade escolhida no horário escolhido; as ondas desenhadas como cristas, o vento como setas sobre a água',
    styles: ['vendor/maplibre-gl.css'],
    cssRaw: require('./style.js')(),
    noDock: true, noLeft: true,
    panelHtml: panel(),
    extraHtml: extra(),
    configGlobal: 'SWELL', configJson: json,
    scripts: ['early.js', 'vendor/maplibre-gl.js', 'vendor/pmtiles.js', 'model.js', 'app.js'],
  });
  fs.writeFileSync(path.join(SITE, 'index.html'), html);
  return { bytes: html.length, model: MODEL.length, app: APPJS.length, dataAt: at };
}

module.exports = { emit, words };
