/* build-app.js — /janela/: the app shell. STATIC: it carries the places, the
   presets, the published rules, the alpha tables, the month's exact counts and
   the deciding modules; the DAY (forecast, bands, decisions, the scoreboard) is
   fetched from the janela-field branch, so main does not grow by a day's data.

   emit(N, git) -> { files, bytes } writes site/janela/{index.html, app.js,
   geo.js, vendor/}. Called by apps/janela/build.js after the gates.
   apps/janela/app · cert-machine                                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const SITE = path.join(ROOT, 'site', 'janela');
const MODEL = require('./model.js');
const PLACAR = require('../audit/placar.js');
const { br } = require('../numbers.js');
const { renderApp } = require(path.join(ROOT, 'design', 'app-shell.js'));
const esc = require(path.join(ROOT, 'design', 'components.js')).esc;

const RAW = 'https://raw.githubusercontent.com/carlostoledo1891/cert-machine/janela-field/';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/* ---- the geography: land, the production fields, the pre-salt polygon, rounded and thinned for drawing ---- */
function ring(r, k) {
  const out = [];
  for (const p of r) {
    const q = [Math.round(p[0] * k) / k, Math.round(p[1] * k) / k];
    const a = out[out.length - 1], b = out[out.length - 2];
    if (a && a[0] === q[0] && a[1] === q[1]) continue;
    /* staircase polygons: drop the middle of three collinear points (exactly collinear on the rounded grid) */
    if (a && b && ((b[0] === a[0] && a[0] === q[0]) || (b[1] === a[1] && a[1] === q[1]))) out.pop();
    out.push(q);
  }
  return out.length >= 4 ? out : null;
}
function geo(places) {
  const pins = J('corpus/anp/PINS.json');
  const read = (name) => {
    const b = fs.readFileSync(path.join(ROOT, 'corpus', 'anp', name));
    if (sha(b) !== pins.files[name].sha256) throw new Error('REFUSED: corpus/anp/' + name + ' does not hash to its pin');
    return JSON.parse(b.toString('utf8'));
  };
  /* the whole ocean basin the map can show, so no clip edge is ever on screen (the map's maxBounds sit inside
     this box): full detail inside the Brazilian margin (basemap.js's own box), the coast beyond it thinned to one
     vertex per 0.1° — it is context, drawn small, and nothing is decided from it */
  const B = require('../audit/basemap.js');
  const land = B.land({ w: -100, e: 0, s: -56, n: 20 });
  const inMargin = (p) => p[0] >= B.BOX.w && p[0] <= B.BOX.e && p[1] >= B.BOX.s && p[1] <= B.BOX.n;
  const thin = (r) => {
    const out = [];
    for (const p of r) { const l = out[out.length - 1]; if (!l || inMargin(p) || Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) >= 0.1) out.push(p); }
    const a = out[0], z = out[out.length - 1];
    if (a[0] !== z[0] || a[1] !== z[1]) out.push(a);
    return out.length >= 4 ? out : null;
  };
  const g0 = land.features[0].geometry;
  g0.coordinates = g0.coordinates.map((poly) => poly.map(thin).filter(Boolean)).filter((poly) => poly.length);
  /* the fields drawn: offshore (a water depth) or served by a production unit on the map */
  const served = new Set();
  for (const p of places) if (p.serves) for (const m of String(p.serves).toUpperCase().matchAll(/([A-ZÀ-Ú][A-ZÀ-Ú0-9 '\-]+?)\s*\(/g)) served.add(m[1].trim());
  const fields = [];
  for (const f of read('campos.geojson').features) {
    const pr = f.properties;
    if (!(Number(pr.med_lamina) > 0) && !served.has(String(pr.name || '').toUpperCase().trim())) continue;
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    const coords = polys.map((poly) => poly.map((r) => ring(r, 1000)).filter(Boolean)).filter((p) => p.length);
    if (!coords.length) continue;
    fields.push({ type: 'Feature', properties: { n: String(pr.name || '').trim(), b: String(pr.nome_bacia || '').replace(/\s+/g, ' ').trim(), e: String(pr.etapa || '').trim() },
      geometry: { type: 'MultiPolygon', coordinates: coords } });
  }
  const ps = read('presal.geojson').features[0].geometry;
  const presal = { type: 'Feature', properties: { n: 'polígono do pré-sal' }, geometry: { type: ps.type, coordinates: ps.type === 'Polygon' ? ps.coordinates.map((r) => ring(r, 1000))
    : ps.coordinates.map((poly) => poly.map((r) => ring(r, 1000)).filter(Boolean)) } };
  return { land, fields: { type: 'FeatureCollection', features: fields }, presal: { type: 'FeatureCollection', features: [presal] },
    sources: { land: 'Natural Earth 1:10m (domínio público), corpus/basemap', anp: 'ANP — GeoMaps (dados abertos), corpus/anp, ' + pins.fetched } };
}

/* ---- the vendored map library, the pinned bytes or nothing ---- */
function vendor(dir) {
  const V = path.join(ROOT, 'apps', 'skyaudit', 'vendor');
  const pins = Object.fromEntries(fs.readFileSync(path.join(V, 'VENDOR-SHA256.txt'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse()));
  fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
  /* the stylesheet carries a DECLARED patch (its header, 2026-09-05: six light-scheme queries disabled by an
     unknown media feature). It is accepted only if reverting exactly that patch gives the pinned upstream bytes. */
  const unpatch = (b) => Buffer.from(b.toString('utf8').replace(/^\/\* VENDOR PATCH, cert-machine[\s\S]*?\*\/\n/, '').split(' and (min-cert-machine-dark-lock:0)').join(''), 'utf8');
  const patched = {};
  for (const f of ['maplibre-gl.js', 'maplibre-gl.css']) {
    const b = fs.readFileSync(path.join(V, f));
    if (sha(b) !== pins[f]) {
      if (!(f.endsWith('.css') && sha(unpatch(b)) === pins[f])) throw new Error('REFUSED: ' + f + ' is neither the pinned bytes nor the pinned bytes plus the declared patch (apps/skyaudit/vendor/VENDOR-SHA256.txt)');
      patched[f] = sha(b);
    }
    fs.writeFileSync(path.join(dir, 'vendor', f), b);
  }
  const vp = J('apps/skyaudit/vendor/VENDOR-PINS.json');
  fs.writeFileSync(path.join(dir, 'vendor', 'VENDOR-PINS.json'), JSON.stringify({ 'maplibre-gl': vp['maplibre-gl'], sha256: {
    'maplibre-gl.js': pins['maplibre-gl.js'], 'maplibre-gl.css': pins['maplibre-gl.css'] }, declaredPatch: patched,
    from: 'apps/skyaudit/vendor (checked at build: the upstream pin, or the upstream pin plus the patch the file declares)' }, null, 1) + '\n');
}

/* ---- the panel's skeleton: the script fills it; with scripts off it says what the app is ---- */
function panel(M, N) {
  const CRIT = [['band', 'Banda medida', 'erro medido'], ['table', 'DNV Tab. 4-1', 'α da tabela'], ['site', 'DNV α local', 'α estimado']];
  const seg = (attr, items) => items.map(([v, a, b], i) => `<button type="button" role="radio" ${attr}="${v}" aria-checked="${i ? 'false' : 'true'}">${esc(a)}${b ? '<small>' + esc(b) + '</small>' : ''}</button>`).join('');
  const W = N.work;
  const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const nUnits = M.places.filter((p) => p.kind === 'uep').length;
  /* THE USE CASES (apps/janela/uses.js, one definition): each one a door into the app's state, set by client.js */
  const USES = require('../uses.js').doors().map((u) => [u.door, u.label, u.sub]);
  return `
<button type="button" class="jn-grip" id="jn-grip" aria-controls="panel" aria-label="Mostrar mais do painel"><i></i></button>
<div class="jn-scroll" id="jn-scroll">
<section class="jn-pane" id="pane-semana" data-mode="semana" aria-label="A semana">
  <div class="jn-box jn-intro" id="jn-intro">
    <button type="button" class="jn-introt" id="jn-introt" aria-expanded="true" aria-controls="jn-introb"><span>A janela de cada operação offshore, decidida.</span><i aria-hidden="true"></i></button>
    <div id="jn-introb">
      <p class="jn-p">Para as ${nUnits} unidades de produção offshore do Brasil e os terminais com regra da Capitania: o mar dos próximos sete dias contra o limite da sua operação, sobre uma previsão cujo erro foi medido por satélite. Cada horário sai <b>LIBERADA</b>, <b>VETADA</b>, <b>INDEFINIDA</b> ou <b>SEM DADOS</b>, com o motivo e o limiar que o viraria.</p>
      <div class="jn-k">o que você precisa decidir?</div>
      <div class="jn-seg jn-uses" id="jn-uses">${USES.map(([v, a, b]) => `<button type="button" data-use="${v}">${esc(a)}<small>${esc(b)}</small></button>`).join('')}</div>
    </div>
  </div>
  <div class="jn-box" id="jn-opbox">
    <div class="jn-k">a operação</div>
    <div class="jn-chips" id="jn-ops" role="radiogroup" aria-label="Operação"></div>
    <div id="jn-edit"></div>
  </div>
  <div class="jn-answer" id="jn-answer">
    <p class="jn-late" id="jn-late" role="note" hidden></p>
    <div id="jn-ansl" aria-live="polite"><p class="jn-ans">A janela operacional de cada unidade offshore do Brasil, decidida contra o limite publicado.</p>
    <p class="jn-sub"><noscript>Este app decide no seu navegador e precisa de JavaScript. O método e as decisões publicadas estão em <a href="/janela/metodo/">/janela/metodo/</a>.</noscript><span id="jn-load">carregando a previsão de hoje…</span></p></div>
    <div class="jn-seg jn-crit" id="jn-crit" role="radiogroup" aria-label="Critério">${seg('data-crit', CRIT)}</div>
    <details class="jn-src jn-critd"><summary>como este critério decide</summary><span id="jn-critx"></span></details>
  </div>
  <div class="jn-box jn-time" id="jn-time">
    <div class="jn-timeh"><span class="jn-when" id="jn-when">—</span><span class="jn-lead" id="jn-lead"></span><span class="jn-grow"></span>
      <button type="button" class="jn-btn" id="jn-prev" aria-label="seis horas antes">‹</button><button type="button" class="jn-btn" id="jn-play" aria-pressed="false" aria-label="tocar a semana">▶</button><button type="button" class="jn-btn" id="jn-next" aria-label="seis horas depois">›</button></div>
    <div class="jn-days" id="jn-days" aria-hidden="true"></div>
    <div class="jn-strip" id="jn-strip" role="slider" tabindex="0" aria-label="Início da janela, horário de Brasília" aria-valuemin="0" aria-valuemax="28" aria-valuenow="0"></div>
  </div>
  <div class="jn-box jn-card" id="jn-card" hidden></div>
  <div class="jn-box" id="jn-listbox">
    <div class="jn-k" id="jn-listk">as unidades, pela próxima janela</div>
    <div class="jn-find"><input class="jn-in" id="jn-q" type="search" placeholder="Buscar unidade ou campo: P-75, Búzios" aria-label="Buscar unidade ou campo" autocomplete="off"></div>
    <div class="jn-seg three-l tight" id="jn-kind" role="radiogroup" aria-label="Que locais">${seg('data-kind', [['all', 'Todos', ''], ['uep', 'Unidades', ''], ['own', 'Bacias e terminais', '']])}</div>
    <div class="jn-rows" id="jn-rows"></div>
  </div>
</section>
<section class="jn-pane" id="pane-mes" data-mode="mes" aria-label="A campanha" hidden>
  <div class="jn-box">
    <div class="jn-k">a campanha · meses à frente</div>
    <p class="jn-p">Para planejar instalação, descomissionamento ou uma sequência de alívios: quantos dias N operações levam a partir de um mês, quais meses abrem janela e quanto o α da DNV fecha — contado em ${Number(W.to.slice(0, 4)) - Number(W.from.slice(0, 4)) + 1} anos de mar passado, sem nada ajustado.</p>
    <div class="jn-k jn-k2">área</div><div class="jn-seg three-l" id="jn-m-site" role="radiogroup" aria-label="Área">${seg('data-ms', Object.entries(W.sites).map(([k, s]) => [k, s.name.replace(/^Bacia d[eo] /, '').replace(/^Margem Equatorial — /, '').replace(/ — .*$/, ''), '']))}</div>
    <div class="jn-k jn-k2">limite de Hs (OPLIM)</div><div class="jn-seg six" id="jn-m-lim" role="radiogroup" aria-label="Limite de Hs">${seg('data-ml', W.limits.map((l) => [l, l.replace('.', ',') + ' m', '']))}</div>
    <div class="jn-k jn-k2">janela (TR)</div><div class="jn-seg four" id="jn-m-tr" role="radiogroup" aria-label="Janela">${seg('data-mt', W.periods.map((t) => [String(t), t + ' h', '']))}</div>
  </div>
  <div class="jn-box" id="jn-m-camp-b">
    <div class="jn-k">quantas operações</div><div class="jn-seg four" id="jn-m-n" role="radiogroup" aria-label="Operações">${seg('data-mn', [1, 5, 10, 20].map((k) => [String(k), String(k), '']))}</div>
    <div class="jn-k jn-k2">começando em 1º de</div><div class="jn-seg six" id="jn-m-start" role="radiogroup" aria-label="Mês de início">${seg('data-mm', MON.map((m, k) => [String(k + 1).padStart(2, '0'), m, '']))}</div>
    <div id="jn-m-camp"></div>
  </div>
  <div class="jn-box" id="jn-m-chart"></div>
  <div class="jn-box" id="jn-m-season"></div>
  <div class="jn-box" id="jn-m-table"></div>
  <div class="jn-box" id="jn-m-cost"></div>
  <div class="jn-box"><p class="jn-fine">Cada início de operação de 3 em 3 h em ${Number(W.to.slice(0, 4)) - Number(W.from.slice(0, 4)) + 1} anos de hindcast (${esc(W.from.slice(0, 4))}–${esc(W.to.slice(0, 4))}): cabe ou não cabe uma janela de TR horas com Hs abaixo do limite. Frações exatas de inteiros, nada ajustado.</p></div>
</section>
<section class="jn-pane" id="pane-placar" data-mode="placar" aria-label="O placar" hidden>
  <div class="jn-box"><div class="jn-k">o placar · a previsão contra o satélite</div>
    <p class="jn-p">Cada faixa é comprometida antes de o mar acontecer e avaliada depois contra o que um altímetro de satélite mediu. Uma previsão errada fica no registro para sempre.</p></div>
  ${N.heldOut ? `<div class="jn-box"><div class="jn-k">o que já está medido</div>
    <div class="jn-season"><div><div class="jn-k">cobertura da faixa que decide</div><div class="big">${(100 * N.heldOut.coverage).toFixed(1).replace('.', ',')}%</div><div class="s">em ${br.int(N.heldOut.pairs)} comparações com satélite que ela não viu (reivindica 90%)</div></div>
    <div><div class="jn-k">LIBERADA que o mar rompeu</div><div class="big">${(100 * N.heldOut.broke / N.heldOut.liberada).toFixed(2).replace('.', ',')}%</div><div class="s">${br.int(N.heldOut.broke)} de ${br.int(N.heldOut.liberada)} com Hs ≤ 2 m; só a faixa do ECMWF: ${(100 * N.heldOut.eBroke / N.heldOut.eLiberada).toFixed(2).replace('.', ',')}%</div></div></div>
    <p class="jn-fine">Medido em retrospecto: as faixas calibradas antes de ${esc(N.heldOut.from.slice(5, 7) + '/' + N.heldOut.from.slice(0, 4))} e julgadas só depois (certs/janela-providers-eval.json). Abaixo, o registro para a frente, que ninguém pode reescrever.</p></div>` : ''}
  <div id="jn-props" class="jn-pane"></div>
  <div class="jn-box"><div class="jn-k">a regra de admissão</div>
    <p class="jn-p">${esc(PLACAR.RULE_PT)} A admissão se perde por registro, nunca por opinião.</p></div>
</section>
<div class="jn-box jn-trust" id="jn-trust">
  <div class="jn-k">por que confiar</div>
  <p class="jn-p">O veredito é aritmética exata sobre o limite como impresso; a faixa é uma reivindicação que o placar audita em público. A faixa publicada é arredondada <b>para fora</b> (Hs a 0,001 m, vento a 0,01 nó): um LIBERADA ou VETADA sobre ela vale sobre a exata; só INDEFINIDA pode crescer. Não é aprovação de operação: é evidência que um vistoriador refaz. <a href="/janela/metodo/">O método ↗</a> · <a href="/janela/janela-apresentacao.pdf">a apresentação (PDF)</a></p>
  ${N.heldOut ? `<p class="jn-p">Em ${br.int(N.heldOut.pairs)} comparações com satélite que nenhuma faixa viu (desde ${esc(N.heldOut.from.slice(5, 7) + '/' + N.heldOut.from.slice(0, 4))}): quando a faixa que decide pôs Hs abaixo de 2 m, o mar passou do limite em <b>${(100 * N.heldOut.broke / N.heldOut.liberada).toFixed(2).replace('.', ',')}%</b> das vezes (${br.int(N.heldOut.broke)} de ${br.int(N.heldOut.liberada)}); só com a faixa do ECMWF, em ${(100 * N.heldOut.eBroke / N.heldOut.eLiberada).toFixed(2).replace('.', ',')}%.</p>` : ''}
  <p class="jn-check" id="jn-check">—</p>
  <p class="jn-fine">Previsão ECMWF open data (CC BY 4.0) e NOAA WAVEWATCH III (domínio público) · corrente: Generated using E.U. Copernicus Marine Service Information, <a href="https://doi.org/10.48670/moi-00016">doi:10.48670/moi-00016</a> · altimetria NOAA RADS · hindcast Ifremer WW3 (CC BY-SA 4.0) · unidades, campos e pré-sal: ANP — GeoMaps · costa: Natural Earth · código: <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/janela">apps/janela</a></p>
</div>
</div>`;
}

function extra() {
  return `<canvas id="jn-crest" class="jn-layer" aria-hidden="true"></canvas>
<canvas id="jn-wind" class="jn-layer" aria-hidden="true"></canvas>
<canvas id="jn-marks" class="jn-layer" aria-hidden="true"></canvas>
<div class="jn-clock" id="jn-clock" aria-hidden="true"><span id="jn-clockt">—</span><span class="jn-lead" id="jn-clockl"></span><button type="button" class="jn-btn jn-keybtn" id="jn-keybtn" aria-expanded="false" aria-controls="jn-legend" aria-label="Legenda do mapa">?</button></div>
<div class="jn-legend" id="jn-legend" role="note" aria-label="Legenda do mapa">
  <div class="row"><span><i class="jn-g L"></i>LIBERADA</span><span><i class="jn-g V"></i>VETADA</span><span><i class="jn-g I"></i>INDEFINIDA</span><span><i class="jn-g S"></i>SEM DADOS</span></div>
  <div class="row fc"><span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="cr" d="M5 10 Q11 4 17 10"/></svg>ondas: cristas, mais claras = maior Hs</span><span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="st" d="M2 8 L20 4"/></svg>vento a 10 m</span><span>previsão ECMWF, não decidida</span></div>
</div>
<div class="jn-tip" id="jn-tip" role="status"></div>
<div class="jn-status" id="jn-status" role="status"></div>
<article class="jn-nota" id="jn-nota" aria-hidden="true"></article>`;
}

function emit(N, git) {
  const M = MODEL.load();
  const mods = MODEL.modules();
  fs.mkdirSync(SITE, { recursive: true });
  vendor(SITE);
  const G = geo(M.places);
  const geoJs = 'window.JANELA_GEO=' + JSON.stringify(G) + ';\n';
  fs.writeFileSync(path.join(SITE, 'geo.js'), geoJs);
  const APPJS = fs.readFileSync(path.join(__dirname, 'client.js'));
  fs.writeFileSync(path.join(SITE, 'app.js'), APPJS);
  /* the day's data starts loading BEFORE the map library (276 KB) is fetched and parsed: the answer line waits for
     the data, never for the map. The same source order as app.js's loader (the published branch first, a local
     copy first on a desk); app.js falls back to its own loader if this fails. */
  const EARLY = Buffer.from("(function(){var c=window.JANELA&&window.JANELA.data;if(!c||!window.fetch)return;"
    + "var local=/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)||location.protocol==='file:';"
    + "var u=local?c.today.slice().reverse():c.today;"
    + "var get=function(i){return fetch(u[i],{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})"
    + ".catch(function(e){if(i+1<u.length)return get(i+1);throw e;});};"
    + "window.JANELA_EARLY={today:get(0)};})();\n");
  fs.writeFileSync(path.join(SITE, 'early.js'), EARLY);

  /* THE CAMPAIGN PLANNER's inputs: each hindcast node's 32-year series as little-endian int16 (Hs x 500, the
     hindcast's own packing; hindcast.js verifies every monthly file against its pin first), fetched by the tab
     only when the planner opens and checked against the sha256 below before it counts anything */
  const H = require('../audit/hindcast.js');
  const HD = path.join(SITE, 'hindcast');
  fs.mkdirSync(HD, { recursive: true });
  const hind = {};
  for (const node of Object.keys(N.work.sites)) {
    const s = H.load(node);
    const buf = Buffer.alloc(s.x.length * 2);
    s.x.forEach((v, k) => buf.writeInt16LE(v, 2 * k));
    fs.writeFileSync(path.join(HD, node + '.i16'), buf);
    hind[node] = { file: 'hindcast/' + node + '.i16', sha256: sha(buf), n: s.x.length, from: s.from, to: s.to, stepH: s.stepH, scale: s.scale, fill: s.fill };
  }
  const CAMP = fs.readFileSync(path.join(ROOT, 'instruments', 'window', 'campaign.js'));
  const W = N.work;
  const cfg = {
    v: 1, git, model: MODEL.fingerprint(M),
    data: { today: [RAW + 'today.json', 'data/today.json'], todayJs: 'data/today.js', field: [RAW + 'field.bin', 'data/field.bin'], fieldJs: 'data/field.js' },
    places: M.places, presets: M.presets, npcp: M.npcp, crits: M.crits, alphaT: M.alphaT, wind46: M.wind46,
    t41: M.t41, columns: M.columns, dnvSource: { title: M.dnvSource.title, sha256: M.dnvSource.sha256 },
    work: { from: W.from, to: W.to, samples: W.samples, source: W.source, limits: W.limits, periods: W.periods,
      sites: Object.fromEntries(Object.entries(W.sites).map(([k, s]) => [k, { name: s.name, cells: s.cells }])) },
    records: M.records, modules: mods, proposerNames: PLACAR.NAMES_PT,
    plan: { src: CAMP.toString('utf8'), sha256: sha(CAMP), hindcast: hind, source: W.source },
    shas: { 'app.js': sha(APPJS), 'geo.js': sha(geoJs), 'early.js': sha(EARLY) }
  };
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = renderApp({
    title: 'Janela — a janela operacional de cada unidade offshore, decidida',
    description: 'Para as unidades de produção offshore do Brasil: a próxima janela de alívio, carga de PSV, lançamento ou içamento, decidida contra o limite da operação sobre uma previsão com o erro medido por satélite — LIBERADA, VETADA, INDEFINIDA ou SEM DADOS, com o motivo.',
    path: '/janela/', lang: 'pt-BR', appName: 'Janela', brand: 'CERT-MACHINE', homeHref: '/', og: { image: '/janela/og.png', alt: 'Janela: o mapa da margem brasileira com as unidades offshore e a janela de cada operação, decidida' },
    meta: '<span id="jn-run">ECMWF · —</span>',
    topHtml: '<nav class="jn-modes" id="jn-modes" role="tablist" aria-label="Modo"><button type="button" role="tab" data-mode="semana" aria-selected="true">SEMANA</button><button type="button" role="tab" data-mode="mes" aria-selected="false">CAMPANHA</button><button type="button" role="tab" data-mode="placar" aria-selected="false">PLACAR</button></nav>',
    navLinks: [{ href: '/janela/metodo/', label: 'Método ↗' }, { href: 'https://github.com/carlostoledo1891/cert-machine/tree/main/apps/janela', label: 'código' }],
    mapAria: 'Mapa da margem brasileira: cada unidade de produção offshore marcada com o veredito da operação escolhida na hora escolhida; a previsão de ondas e vento desenhada por cima',
    styles: ['vendor/maplibre-gl.css'],
    cssRaw: require('./style.js')(),
    noDock: true, noLeft: true,
    panelHtml: panel(M, N),
    extraHtml: extra(),
    configGlobal: 'JANELA', configJson: json,
    scripts: ['early.js', 'vendor/maplibre-gl.js', 'geo.js', 'app.js']
  });
  fs.writeFileSync(path.join(SITE, 'index.html'), html);
  return { html, bytes: html.length, geo: geoJs.length, fields: G.fields.features.length, places: M.places.length };
}

module.exports = { emit, geo };
