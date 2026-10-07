/* client.js — Janela, the app (pt-BR). Served as /janela/app.js.
   apps/janela/app · cert-machine

   ONE CLOCK. The selected start hour drives the map's annunciators, the list,
   the card and the forecast field; ←/→ move it, the strip scrubs it.

   WHAT DECIDES. Nothing in this file decides. Every verdict on screen is either
   a PUBLISHED decision (the day's data, made by apps/janela/build-today.js) or
   decided here, in the tab, by the same modules that made them — q.js,
   decide.js, dnv.js and its table, criteria.js — shipped as text in the page,
   required by name and hashed against their pins. The tab re-decides every
   published decision once the map is up, and says so in one quiet line.

   WHAT IS DRAWN. Decided ink: the verdict glyphs (filled · crossed · hatched ·
   dotted, always with a word on hover or tap) and the measured band. Forecast
   ink: the ECMWF field — wave crests across the mean direction, wind streaks
   along (u, v) — and the deterministic and ensemble lines. Colour is read from
   the design tokens at runtime; no colour is written here.

   WHAT IS STORED. The URL carries the view (#site, op, t, crit, modo and any
   edited limits). A day rate, tank inventories and an oil price the user types
   stay in this browser's localStorage, never anywhere else.            MIT */
(function () {
'use strict';
var CFG = window.JANELA, GEO = window.JANELA_GEO;
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

/* ================================================================ the modules */
var MODS = CFG.modules, cache = {};
function req(name) {
  var base = String(name).split('/').pop();
  if (base === 'path') return { join: function () { return [].slice.call(arguments).join('/'); } };
  if (cache[base]) return cache[base].exports;
  if (!Object.prototype.hasOwnProperty.call(MODS.src, base)) throw new Error('janela: no module ' + name);
  var m = { exports: {} };
  cache[base] = m;
  if (/\.json$/.test(base)) m.exports = JSON.parse(MODS.src[base]);
  else (new Function('module', 'exports', 'require', '__dirname', MODS.src[base]))(m, m.exports, req, '.');
  return m.exports;
}
var Q = req('q.js'), DNV = req('dnv.js'), C = req('criteria.js');
/* the campaign planner's engine (instruments/window/campaign.js): planning, not deciding — kept out of the pinned deciding modules */
if (CFG.plan && CFG.plan.src) MODS.src['campaign.js'] = CFG.plan.src;

/* ================================================================ words */
var DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
var MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
var WORD = { L: 'LIBERADA', V: 'VETADA', I: 'INDEFINIDA', S: 'SEM DADOS', R: 'RECUSADA', n: 'NÃO SE APLICA', '-': 'ALÉM DA PREVISÃO' };
var CNAME = { band: 'Banda medida', table: 'DNV Tabela 4-1', site: 'DNV α do local' };
var CSHORT = { band: 'banda medida', table: 'DNV 4-1', site: 'α local' };
var VAR = { hs: 'Hs', wind_sustained: 'vento', wind_gust: 'rajada', current: 'corrente', visibility: 'visibilidade', tp: 'período', draft: 'calado', loa: 'comprimento', beam: 'boca', speed: 'velocidade', dwt: 'porte' };
var UNIT = { m: 'm', kn: 'nós', NM: 'MN', s: 's' };
var OPW = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
var KIND = { field: 'área de produção · nó medido', coast: 'costa · nó medido', terminal: 'terminal · regra da Capitania', platform: 'plataforma', uep: 'unidade de produção' };
/* a site added to sites.json is forecast and ledgered from day one, but "medido" only once the bands record carries it */
function kindOf(p) { return (p.kind === 'field' || p.kind === 'coast') && T && STEPS[p.id] && !STEPS[p.id].some(function (x) { return x.hb; }) ? (p.kind === 'field' ? 'área de produção' : 'costa') + ' · acompanhada, ainda sem medição' : KIND[p.kind] || p.kind; }
var dc = function (s) { return String(s).replace('.', ','); };
var grp = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
var brl = function (x) { return 'R$ ' + grp(x); };
function dec(x, k) { return dc(Number(x).toFixed(k)); }
function limText(l) { return (VAR[l.var] || l.var) + ' ' + (OPW[l.op] || l.op) + ' ' + dc(l.value) + ' ' + (UNIT[l.unit] || l.unit); }
function q2(s, k) { return dc(Q.dec(Q.parse(s), k)); }
function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

/* ================================================================ state */
var S = { mode: 'semana', site: null, op: 'alivio', npcp: null, crit: 'band', i: 0, edit: null, own: null,
  q: '', kind: 'all', listN: 30, ms: null, ml: null, mt: null, sheet: 'peek', playing: false, legend: false };
var T = null, AX = [], LEAD = [], STEPS = {}, iNow = 0, PL = {}, VIS = [];
CFG.places.forEach(function (p) { PL[p.id] = p; });
var phone = window.matchMedia('(max-width: 720px)');
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var store = { get: function (k) { try { return window.localStorage.getItem('janela.' + k); } catch (e) { return null; } },
  set: function (k, v) { try { window.localStorage.setItem('janela.' + k, v); } catch (e) { /* private mode: the value lives in the field */ } } };

/* ================================================================ time */
function when(t) {
  var d = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), +t.slice(11, 13)) - 3 * 3600e3);
  return { dow: DOW[d.getUTCDay()], d: p2(d.getUTCDate()), dm: p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1), h: p2(d.getUTCHours()) + 'h', key: d.toISOString().slice(0, 10), ms: d.getTime() + 3 * 3600e3 };
}
function addH(t, h) { return new Date(Date.parse(t + ':00:00Z') + h * 3600e3).toISOString().slice(0, 13); }
var dupDow = {};
function wtxt(t, full) {
  var w = when(t);
  return w.dow + (full || dupDow[w.dow] ? ' ' + w.dm : '') + ' ' + w.h;
}
function utc(t) { return t.slice(8, 10) + '/' + t.slice(5, 7) + ' ' + t.slice(11, 13) + 'h UTC'; }

/* ================================================================ the operation in force */
function preset(id) { for (var k = 0; k < CFG.presets.length; k++) if (CFG.presets[k].id === id) return CFG.presets[k]; return null; }
function npcpOf(site) { return CFG.npcp.filter(function (o) { return o.site === site; }); }
function terminals() { return CFG.places.filter(function (p) { return p.kind === 'terminal'; }); }
/* { op, pub: true when the published decisions are this exact operation } */
function current() {
  if (S.op === 'npcp') {
    var list = npcpOf(S.site);
    var base = list.filter(function (o) { return o.id === S.npcp; })[0] || list[0];
    if (!base) return null;
    var tr = S.edit && S.edit.TR !== undefined ? S.edit.TR : base.TR;
    var op = Object.assign({}, base, { TR: tr });
    return { op: op, pub: tr === base.TR, name: base.name };
  }
  if (S.op === 'own') {
    var o = S.own || { limits: [{ var: 'hs', op: '<=', value: '2.5', unit: 'm' }, { var: 'wind_sustained', op: '<=', value: '25', unit: 'kn' }], TR: 12 };
    return { op: { id: 'seu-limite', name: 'Seu limite', limits: o.limits, TR: o.TR, own: true }, pub: false, name: 'Seu limite' };
  }
  var p = preset(S.op) || CFG.presets[0];
  if (!S.edit) return { op: p, pub: true, name: p.name };
  return { op: Object.assign({}, p, { limits: S.edit.limits || p.limits, TR: S.edit.TR !== undefined ? S.edit.TR : p.TR, edited: true }), pub: false, name: p.name + ' (editado)' };
}
function sig(op) { return op.id + '|' + op.TR + '|' + op.limits.map(function (l) { return l.var + l.op + l.value; }).join(','); }
function ctxOf(p) { return { dnv: DNV, wind46: CFG.wind46, site: p.alphaFrom ? CFG.alphaT[p.alphaFrom] : null, why: p.siteWhy }; }
var CIX = { band: 0, table: 1, site: 2 };
var memo = {};
/* PUBOK: the day's published codes are served only when it was made by this page's model AND modules;
   otherwise every code is decided here, so the map, the list and the card can never disagree */
var PUBOK = true;
/* where an operation applies (model.js PRESETS[].appliesTo, the one definition): offloading needs storage */
function applies(op, p) {
  var a = op && op.appliesTo; if (!a || !p) return true;
  return p.kind === 'uep' ? a.types.indexOf(p.type) >= 0 : a.kinds.indexOf(p.kind) >= 0;
}
/* the 29 letters for a place, the operation in force and a criterion: published, or decided here */
function codes(id, crit, cur) {
  cur = cur || current();
  if (!cur || !STEPS[id]) return null;
  crit = crit || S.crit;
  var op = cur.op;
  if (!applies(op, PL[id])) return repeat('n', AX.length);
  if (PUBOK && cur.pub && T.dec[id]) {
    var s = T.dec[id][op.id];
    if (s) return op.npcp ? (crit === 'band' ? s : repeat('n', AX.length)) : s.substr(CIX[crit] * AX.length, AX.length);
    if (op.npcp) return repeat('n', AX.length);
  }
  if (op.npcp && op.site !== id) return repeat('n', AX.length);
  var k = sig(op) + '|' + crit + '|' + id;
  if (!memo[k]) memo[k] = C.week(op, STEPS[id], op.TR, crit, ctxOf(PL[id])).codes;
  return memo[k];
}
function repeat(c, n) { var s = ''; while (s.length < n) s += c; return s; }
function full(id, i, crit, cur) {
  cur = cur || current();
  if (!cur || !STEPS[id]) return null;
  if (cur.op.npcp && cur.op.site !== id) return { verdict: 'n/a', why: 'esta regra da Capitania é de outro terminal' };
  return C.decideWindow(cur.op, STEPS[id], i, cur.op.TR, crit || S.crit, ctxOf(PL[id]));
}
var VCODE = { 'LIBERADA': 'L', 'VETADA': 'V', 'INDEFINIDA': 'I', 'SEM DADOS': 'S', 'RECUSADA': 'R', 'n/a': 'n' };
function vcode(r) { return r === null ? '-' : VCODE[r.verdict] || 'S'; }

/* ================================================================ names */
function short(p) {
  if (p.kind === 'uep') return p.name;
  return String(p.name).replace(/^Bacia d[eo] /, '').replace(/^Margem Equatorial — /, '').replace(/^Baía d[ae] /, '').replace(/ — .*$/, '').replace(/ \(.*\)$/, '');
}
function fieldsOf(p) {
  var out = [], re = /([^,(]+?)\s*\(/g, m;
  while ((m = re.exec(p.serves || ''))) out.push(m[1].trim().toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }));
  return out;
}
function subOf(p) {
  if (p.kind === 'uep') { var f = fieldsOf(p); return (p.type || '') + (f.length ? ' · ' + f.slice(0, 2).join(', ') + (f.length > 2 ? ' +' + (f.length - 2) : '') : ''); }
  return kindOf(p);
}
function inName(p) { return p.kind === 'uep' ? 'em ' + short(p) : p.kind === 'field' ? 'na Bacia de ' + short(p).replace(/^Margem Equatorial — /, '') : 'em ' + short(p); }

/* ================================================================ glyphs */
function g(c) { return '<i class="jn-g ' + (c === '-' ? 'x' : c) + '" aria-hidden="true"></i>'; }
function chip(c) { return '<span class="jn-w ' + (c === '-' ? 'x' : c) + '">' + g(c) + WORD[c] + '</span>'; }

/* ================================================================ the answer line */
function nextL(c, from) { var k = c.indexOf('L', from); if (k < 0) return null; var j = k; while (j + 1 < c.length && c[j + 1] === 'L') j++; return { k: k, j: j }; }
function windowEnd(j, TR) { return addH(AX[j], C.trOf(TR)); }
function answer() {
  var el = $('jn-ansl'), cur = current();
  if (!T) return;
  if (!cur) { el.innerHTML = '<p class="jn-ans">Escolha um terminal para ver as regras da Capitania dele.</p>'; return; }
  var p = PL[S.site];
  if (!p || !STEPS[p.id]) { fleetAnswer(el, cur); return; }
  var c = codes(p.id), op = cur.op, TR = C.trOf(op.TR), name = cur.op.own ? 'Seu limite' : (op.npcp ? 'A regra da Capitania' : (preset(S.op) || {}).name || cur.name);
  var head = '<b>' + esc(name) + ' ' + esc(inName(p)) + ':</b> ';
  var n = nextL(c, iNow), h, sub = [];
  if (n) {
    var end = windowEnd(n.j, op.TR), dur = LEAD[n.j] - LEAD[n.k] + TR, open = c[n.j + 1] === '-' || n.j === c.length - 1;
    h = head + '<span class="jn-dim">próxima janela</span> ' + chip('L') + ' <span class="jn-t">' + esc(wtxt(AX[n.k])) + ' → ' + esc(wtxt(end)) + '</span> <span class="jn-dim">(' + dur + ' h' + (open ? ', até o fim da previsão' : '') + ')</span>';
    sub.push(n.j > n.k ? 'começar entre ' + wtxt(AX[n.k]) + ' e ' + wtxt(AX[n.j]) : 'começar ' + wtxt(AX[n.k]));
    sub.push(TR ? 'operação de ' + TR + ' h' : 'condição na hora');
  } else {
    var ki = c.indexOf('I', iNow), kv = c.indexOf('V', iNow), ks = c.indexOf('S', iNow);
    if (ki >= 0) {
      var r = full(p.id, ki), f = r && r.flip && r.flip[0];
      h = head + '<span class="jn-dim">nenhuma janela LIBERADA nesta previsão. A mais perto:</span> ' + chip('I') + ' <span class="jn-t">' + esc(wtxt(AX[ki])) + '</span>'
        + (f ? ' <span class="jn-dim">— ' + esc(VAR[f.var]) + ' precisa ' + (/^</.test(f.limit) ? 'baixar ' : 'subir ') + esc(dc(f.gapDec)) + ' ' + esc(UNIT[f.unit] || f.unit) + ' na borda desfavorável</span>' : '');
    } else if (kv >= 0) {
      var rv = full(p.id, kv), w = rv && rv.witness;
      h = head + chip('V') + ' <span class="jn-dim">em todos os inícios desta previsão' + (w ? ' — a primeira testemunha: ' + esc(VAR[w.var]) + ' ' + esc(edgeWord(w)) + ' ' + esc(wtxt(w.t)) : '') + '</span>';
    } else if (ks >= 0) {
      var rs = full(p.id, ks);
      h = head + chip('S') + ' <span class="jn-dim">— ' + esc(missingShort(p, rs, cur.op)) + '</span>';
    } else if (c.indexOf('n') >= 0) {
      var rn = full(p.id, c.indexOf('n'));
      h = head + '<span class="jn-dim">' + esc(CNAME[S.crit]) + ' não se aplica: ' + esc(rn ? rn.why : '') + '</span>';
    } else h = head + '<span class="jn-dim">nenhuma janela inteira cabe no que resta da previsão.</span>';
  }
  sub.push(CNAME[S.crit]);
  el.innerHTML = '<p class="jn-ans">' + h + '</p><p class="jn-sub"><span>' + sub.join(' · ') + '</span><a href="#" class="jn-notal" id="jn-nota-a">nota de decisão</a></p>';
  var a = $('jn-nota-a'); if (a) a.onclick = function (e) { e.preventDefault(); nota(); };
}
function edgeWord(w) { var up = /^</.test(w.limit); return (up ? 'de pelo menos ' : 'de no máximo ') + q2(w.edge, 2) + ' ' + (w.var === 'hs' ? 'm' : 'nós'); }
function fleetAnswer(el, cur) {
  var cnt = { L: 0, I: 0, V: 0, S: 0, n: 0 }, tot = 0;
  var out = 0;
  VIS.forEach(function (p) { if (!applies(cur.op, p)) { out++; return; } var c = codes(p.id); if (!c) return; var v = c[S.i]; if (v === '-' || v === 'n') return; tot++; cnt[v === 'R' ? 'S' : v] = (cnt[v === 'R' ? 'S' : v] || 0) + 1; });
  el.innerHTML = '<p class="jn-ans"><b>' + esc(cur.name) + ', começando ' + esc(wtxt(AX[S.i])) + ':</b> <span class="jn-t">' + cnt.L + '</span> <span class="jn-dim">de ' + tot + ' locais</span> ' + chip('L') + '</p>'
    + '<p class="jn-sub"><span>' + cnt.I + ' INDEFINIDA · ' + cnt.V + ' VETADA · ' + cnt.S + ' SEM DADOS · toque num local para a próxima janela dele</span></p>'
    + (out ? '<p class="jn-fine">' + esc(cur.op.appliesTo.why) + ': ' + out + ' unidades fora desta conta.</p>' : '');
}
function missingShort(p, r, op) {
  if (!r) return '';
  if (r.verdict === 'n/a') return r.why;
  var nf = r.notForecast || [];
  if (nf.indexOf('hs') >= 0 && op.hsAt === 'berth') return 'a onda do berço não se decide: o nó do modelo é a aproximação';
  if ((nf.indexOf('hs') >= 0 || nf.indexOf('wind_sustained') >= 0) && p.kind === 'uep' && !p.bandFrom) return 'região ainda sem medição: nenhum local medido a menos de 350 km';
  var names = nf.map(function (v) { return VAR[v] || v; });
  if (nf.indexOf('current') >= 0 || nf.indexOf('visibility') >= 0) return names.join(' e ') + ': ninguém prevê aqui';
  if (nf.indexOf('wind_gust') >= 0) return 'rajada: prevista, mas sem erro medido, logo sem faixa';
  return names.join(' e ') + ': sem faixa medida neste prazo';
}

/* ================================================================ the clock */
var DAYS = [];
function buildClock() {
  DAYS = []; dupDow = {};
  var seen = {};
  AX.forEach(function (t, k) {
    var w = when(t);
    if (!DAYS.length || DAYS[DAYS.length - 1].key !== w.key) DAYS.push({ key: w.key, lab: w.dow + ' ' + w.d, k: k, n: 1 }); else DAYS[DAYS.length - 1].n++;
    if (seen[w.dow] && seen[w.dow] !== w.key) dupDow[w.dow] = 1; seen[w.dow] = seen[w.dow] || w.key;
  });
  var today = when(new Date(Date.now()).toISOString().slice(0, 13)).key;
  $('jn-days').innerHTML = DAYS.map(function (d) {
    return '<span class="' + (d.key === today ? 'today' : '') + '" style="--n:' + d.n + '">' + (d.n >= 2 ? esc(d.lab) : '') + '</span>';
  }).join('');
}
function drawClock() {
  if (!T) return;
  var t = AX[S.i], w = when(t), cur = current();
  $('jn-when').textContent = w.dow + ' ' + w.dm + ' · ' + w.h;
  $('jn-lead').textContent = 'previsão +' + LEAD[S.i] + ' h'; $('jn-when').title = utc(t);
  $('jn-clockt').textContent = w.dow + ' ' + w.dm + ' ' + w.h;
  $('jn-clockl').textContent = 'previsão +' + LEAD[S.i] + ' h';
  var strip = $('jn-strip'), p = PL[S.site], c = p && STEPS[p.id] ? codes(p.id) : null, html = '';
  var starts = {}; DAYS.forEach(function (d) { starts[d.k] = 1; });
  for (var k = 0; k < AX.length; k++) {
    var inner;
    if (c) inner = g(c[k]);
    else { var share = fleetShare(k); inner = '<b style="--f:' + share.toFixed(3) + '"></b>'; }
    html += '<i class="' + (starts[k] ? 'd0 ' : '') + (k < iNow ? 'past' : '') + '" data-k="' + k + '" title="' + esc(wtxt(AX[k], true) + (c ? ' · ' + WORD[c[k]] : '')) + '">' + inner + '</i>';
  }
  var sp = cur ? C.span(STEPS[S.site] || STEPS[VIS[0].id], S.i, cur.op.TR) : null;
  html += '<span class="jn-cur" style="--i:' + S.i + '"></span>';
  if (sp && sp.length > 1) html += '<span class="jn-span" style="--i:' + sp[0] + ';--w:' + (sp[sp.length - 1] - sp[0] + 1) + '"></span>';
  strip.innerHTML = html;
  strip.setAttribute('aria-valuenow', S.i);
  strip.setAttribute('aria-valuetext', wtxt(AX[S.i], true) + (c ? ', ' + WORD[c[S.i]] : ''));
}
function fleetShare(k) {
  var n = 0, l = 0;
  VIS.forEach(function (p) { var c = codes(p.id); if (!c || c[k] === '-' || c[k] === 'n') return; n++; if (c[k] === 'L') l++; });
  return n ? l / n : 0;
}
function setI(k, quiet) {
  if (!T) return;
  k = Math.max(0, Math.min(AX.length - 1, k));
  if (k === S.i && quiet) return;
  S.i = k; FIELD.target = k;
  if (!S.playing) FIELD.tf = FIELD.tf === null ? k : FIELD.tf;
  render(); hash();
}
(function clockInput() {
  var strip = $('jn-strip'), drag = false;
  function at(e) { var r = strip.getBoundingClientRect(); return Math.floor((e.clientX - r.left) / r.width * AX.length); }
  strip.addEventListener('pointerdown', function (e) { if (!T) return; drag = true; strip.setPointerCapture && strip.setPointerCapture(e.pointerId); stop(); setI(at(e)); });
  strip.addEventListener('pointermove', function (e) { if (drag) setI(at(e), true); });
  strip.addEventListener('pointerup', function () { drag = false; });
  strip.addEventListener('pointercancel', function () { drag = false; });
  strip.addEventListener('keydown', function (e) {
    if (e.key === 'Home') { e.preventDefault(); setI(0); } else if (e.key === 'End') { e.preventDefault(); setI(AX.length - 1); }
  });
  $('jn-prev').onclick = function () { stop(); setI(S.i - 1); };
  $('jn-next').onclick = function () { stop(); setI(S.i + 1); };
  $('jn-play').onclick = function () { if (S.playing) stop(); else play(); };
})();
function play() {
  if (!T) return;
  if (S.i >= AX.length - 1) S.i = iNow;
  S.playing = true; FIELD.tf = S.i;
  $('jn-play').setAttribute('aria-pressed', 'true'); $('jn-play').textContent = '❚❚';
}
function stop() {
  if (!S.playing) return;
  S.playing = false; $('jn-play').setAttribute('aria-pressed', 'false'); $('jn-play').textContent = '▶';
  FIELD.target = S.i;
}

/* ================================================================ the operation chips and editor */
var OPS = CFG.presets.map(function (p) { return { id: p.id, label: p.name.replace(' de linhas', '') }; }).concat([{ id: 'npcp', label: 'Terminal' }, { id: 'own', label: 'Seu limite' }]);
function drawOps() {
  $('jn-ops').innerHTML = OPS.map(function (o) {
    return '<button type="button" class="jn-chip-b" role="radio" data-op="' + o.id + '" aria-checked="' + (S.op === o.id) + '">' + esc(o.label) + '</button>';
  }).join('');
  var cur = current(), e = $('jn-edit');
  if (!cur) { e.innerHTML = '<p class="jn-fine">Nenhum terminal escolhido.</p>'; return; }
  var op = cur.op, h = '';
  var lim = function (v) { for (var k = 0; k < op.limits.length; k++) if (op.limits[k].var === v) return op.limits[k]; return null; };
  if (op.npcp) {
    var list = npcpOf(S.site);
    h += '<div class="jn-edit"><label class="jn-grow">regra publicada<select class="jn-in" id="jn-npcp">' + list.map(function (o) {
      return '<option value="' + esc(o.id) + '"' + (o.id === op.id ? ' selected' : '') + '>' + esc(o.name) + '</option>'; }).join('') + '</select></label>'
      + '<label>janela (h)<input class="jn-in" id="jn-tr" inputmode="numeric" value="' + op.TR + '"></label></div>';
    h += '<details class="jn-src cited"><summary><span class="jn-tag">publicado</span><b>' + esc(op.limits.map(limText).join(' · ')) + '</b> — ' + esc(op.source.act || '') + '</summary>' + esc(op.source.title || '') + ', ' + esc(op.page || '')
      + (op.quote ? '<br><i>“' + esc(op.quote) + '”</i>' : '') + (op.status === 'expired-experimental' ? '<br>parâmetros experimentais, período encerrado' : '')
      + (op.hsAt === 'berth' ? '<br>a onda é limitada no berço: o nó do modelo é a aproximação, então a onda fica SEM DADOS por construção' : '')
      + '<br><a href="' + esc(op.source.url) + '">o ato</a> · sha256 ' + esc(String(op.source.sha256 || '').slice(0, 12)) + '…</details>';
  } else {
    var hs = lim('hs'), w = lim('wind_sustained');
    h += '<div class="jn-edit"><label>Hs ≤ (m)<input class="jn-in" id="jn-hs" inputmode="decimal" value="' + (hs ? dc(hs.value) : '') + '" placeholder="—"></label>'
      + '<label>vento ≤ (nós)<input class="jn-in" id="jn-vento" inputmode="decimal" value="' + (w ? dc(w.value) : '') + '" placeholder="—"></label>'
      + '<label>janela (h)<input class="jn-in" id="jn-tr" inputmode="numeric" value="' + op.TR + '"></label>'
      + (cur.pub || op.own ? '' : '<button type="button" class="jn-btn" id="jn-reset">restaurar</button>') + '</div>';
    var P = preset(S.op);
    if (op.own) h += '<p class="jn-src">' + (S.own ? '' : '<span class="jn-tag">exemplo</span>os valores de partida (Hs 2,5 m, vento 25 nós, 12 h) não são regra de ninguém: digite os do seu procedimento. ') + 'O seu procedimento, decidido nesta aba pelos mesmos módulos. Nada sai do seu navegador; o endereço guarda os números para você compartilhar.</p>';
    else if (P && P.kind === 'cited') h += '<details class="jn-src cited"><summary><span class="jn-tag">citado</span>critério de alívio citado em 2010 (OMAE2010-20147) — confirme com o procedimento vigente</summary>'
      + esc(P.source) + '. <a href="' + esc(P.sourceUrl) + '">fonte</a>'
      + '<br><b>Conferido por quem opera, não decidido aqui:</b><ul>' + P.notDecided.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
    else h += '<p class="jn-src"><span class="jn-tag">exemplo</span>use o limite do seu procedimento: os valores acima são um ponto de partida, não uma regra.</p>';
    if (cur.op.edited) h += '<p class="jn-fine">Editado: decidido agora, nesta aba, pelos mesmos módulos que fizeram as decisões publicadas.</p>';
  }
  e.innerHTML = h;
  var num = function (v) { v = String(v).trim().replace(/\s/g, '').replace(',', '.'); return v === '' ? '' : (/^\d+(\.\d+)?$/.test(v) ? v : null); };
  var apply = function () {
    var tr = $('jn-tr') ? Math.max(0, Math.min(120, parseInt($('jn-tr').value, 10) || 0)) : op.TR;
    if (op.npcp) { S.edit = tr === 0 ? null : { TR: tr }; return change(); }
    var hv = num($('jn-hs').value), wv = num($('jn-vento').value);
    if (hv === null || wv === null || (hv === '' && wv === '')) return;
    var L = [];
    if (hv !== '') L.push({ var: 'hs', op: '<=', value: hv, unit: 'm' });
    if (wv !== '') L.push({ var: 'wind_sustained', op: '<=', value: wv, unit: 'kn' });
    if (op.own) S.own = { limits: L, TR: tr };
    else {
      var P0 = preset(S.op), same = tr === P0.TR && JSON.stringify(L) === JSON.stringify(P0.limits.map(function (l) { return { var: l.var, op: l.op, value: l.value, unit: l.unit }; }));
      S.edit = same ? null : { limits: L, TR: tr };
    }
    change();
  };
  ['jn-hs', 'jn-vento', 'jn-tr'].forEach(function (id) { var x = $(id); if (x) x.addEventListener('change', apply); });
  if ($('jn-npcp')) $('jn-npcp').onchange = function () { S.npcp = this.value; change(); };
  if ($('jn-reset')) $('jn-reset').onclick = function () { S.edit = null; change(); };
}
$('jn-ops').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-op]'); if (!b) return;
  var id = b.getAttribute('data-op');
  S.edit = null;
  if (id === 'npcp') {
    if (!PL[S.site] || PL[S.site].kind !== 'terminal') { var tt = terminals().filter(function (p) { return npcpOf(p.id).length; }); select(tt[0] ? tt[0].id : null, true); }
    S.npcp = (npcpOf(S.site)[0] || {}).id;
    if (S.crit !== 'band') S.crit = 'band';
  }
  S.op = id; change();
});
$('jn-crit').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-crit]'); if (!b) return;
  S.crit = b.getAttribute('data-crit'); change();
});
function drawCrit() {
  var cur0 = current(), p0 = PL[S.site] && STEPS[S.site] ? PL[S.site] : null;
  [].forEach.call($('jn-crit').querySelectorAll('[data-crit]'), function (b) {
    var k = b.getAttribute('data-crit'), small = b.querySelector('small');
    b.setAttribute('aria-checked', k === S.crit ? 'true' : 'false');
    if (!T || !cur0 || !small) return;
    if (p0) { var cc = codes(p0.id, k, cur0); var v = cc ? cc[S.i] : '-'; small.innerHTML = g(v) + esc(v === 'n' ? 'NÃO SE APLICA' : WORD[v]); small.className = 'v ' + v; }
    else { var nL = 0, nT = 0, nN = 0; VIS.forEach(function (p) { if (!applies(cur0.op, p)) return; var cc2 = codes(p.id, k, cur0); if (!cc2 || cc2[S.i] === '-') return; if (cc2[S.i] === 'n') { nN++; return; } nT++; if (cc2[S.i] === 'L') nL++; }); small.innerHTML = nT ? g('L') + nL + ' de ' + nT : 'não se aplica'; small.className = 'v'; b.title = nN ? nN + ' locais onde este critério não se aplica a este limite' : ''; }
  });
  var cur = current(), x = '';
  if (!cur) { $('jn-critx').textContent = ''; return; }
  var p = PL[S.site] && STEPS[S.site] ? PL[S.site] : null;
  if (S.crit === 'band') {
    var hp = p && STEPS[p.id][S.i] && STEPS[p.id][S.i].hp;
    x = 'A previsão × o erro medido contra satélite neste local e prazo, na borda desfavorável, em cada passo da janela (cobertura reivindicada 9/10, auditada no placar).'
      + (hp === 'en' ? ' Aqui, a união das faixas medidas do ECMWF e da NOAA: cobre sempre que uma delas cobre.' : hp === 'n' ? ' Aqui, só a faixa medida da NOAA (a do ECMWF não decide neste prazo).' : '');
  }
  else {
    var r = p ? full(p.id, S.i) : null;
    var al = r && r.alpha ? r.alpha : null;
    x = S.crit === 'table' ? 'A previsão determinística ≤ α × limite (OPWF), α da Tabela 4-1 da DNV-OS-H101 com Hs de projeto = o limite e TPOP = janela ÷ 2'
      : 'O mesmo, com o α estimado no local: o limite inferior do intervalo de 90% (reamostragem por dia), arredondado para baixo. O α é uma estimativa; a decisão sobre ele é exata';
    if (al) x += ' — aqui α ' + q2(al.hs, 4) + (al.wind ? ', vento α ' + q2(al.wind, 2) + ' (Tabela 4-6)' : '') + ', TPOP ' + al.TPOP + ' h.';
    else if (r && r.verdict === 'n/a') x += '. Aqui não se aplica: ' + r.why + '.';
    else x += '.';
    /* the site alpha's reach, said once for the fleet: three years of satellite pairs hold Hs up to 2 m, rarely above */
    if (S.crit === 'site' && !p) {
      var hsL = cur.op.limits.filter(function (l) { return l.var === 'hs'; })[0];
      if (hsL && Number(hsL.value) > 2) x += ' O α do local foi estimado para Hs de projeto até 2 m (até 4 m só em Pelotas): três anos de pares previsão × satélite têm menos de 30 casos de mar alto por célula, e não se extrapola. Ele decide as operações de Hs ≤ 2 m — Lançamento, Içamento, o seu limite.';
    }
  }
  $('jn-critx').textContent = x;
}

/* ================================================================ the list */
function rank(p) {
  var c = codes(p.id); if (!c) return [9e9, 0];
  var n = nextL(c, iNow);
  if (n) return [n.k, -(n.j - n.k)];
  var ki = c.indexOf('I', iNow); if (ki >= 0) return [1000 + ki, 0];
  if (c.indexOf('V', iNow) >= 0) return [2000, 0];
  if (c.indexOf('S', iNow) >= 0) return [3000, 0];
  return [4000, 0];
}
/* the margin of a place's next LIBERADA window: the smallest distance, over the window's steps, between the
   unfavourable edge the criterion decides on and the limit it decides against (Hs in m, wind in knots) */
function margin(p) {
  var c = codes(p.id), cur = current(); if (!c || !cur) return null;
  var n = nextL(c, iNow); if (!n) return null;
  var r = full(p.id, n.k); if (!r || r.verdict !== 'LIBERADA') return null;
  var band = S.crit === 'band', lims = band ? cur.op.limits : (r.opwf || []);
  var span = C.span(STEPS[p.id], n.k, cur.op.TR) || [n.k], best = null;
  lims.forEach(function (l) {
    if ((l.var !== 'hs' && l.var !== 'wind_sustained') || (l.op !== '<=' && l.op !== '<')) return;
    var key = band ? (l.var === 'hs' ? 'hb' : 'wb') : (l.var === 'hs' ? 'hd' : 'wd'), top = null;
    span.forEach(function (k) { var b = STEPS[p.id][k][key]; if (!b) return; var x = Q.parse(b[1]); if (top === null || Q.cmp(x, top) > 0) top = x; });
    if (top === null) return;
    /* exact gap, shown rounded DOWN: the margin is never overstated */
    var lim = Q.parse(l.value), gapQ = Q.sub(lim, top), rel = Number(Q.dec(Q.div(gapQ, lim), 4, 'down'));
    if (!best || rel < best.rel) best = { var: l.var, gap: Q.dec(gapQ, l.var === 'hs' ? 2 : 1, 'down'), rel: rel };
  });
  return best;
}
function nxText(p) {
  var c = codes(p.id); if (!c) return '';
  var cur = current(), n = nextL(c, iNow);
  if (n) {
    var open = !/[VISR]/.test(c.slice(n.j + 1)), m = margin(p);
    return '<b>' + esc(wtxt(AX[n.k])) + '</b> · ' + (open ? 'até o fim' : (LEAD[n.j] - LEAD[n.k] + C.trOf(cur.op.TR)) + ' h')
      + (m ? '<small>folga ' + dc(m.gap) + ' ' + (m.var === 'hs' ? 'm' : 'nós') + '</small>' : '');
  }
  var ki = c.indexOf('I', iNow); if (ki >= 0) return 'INDEFINIDA ' + esc(wtxt(AX[ki]));
  if (c.indexOf('V', iNow) >= 0) return 'VETADA';
  if (c.indexOf('S', iNow) >= 0) return 'SEM DADOS';
  return 'não se aplica';
}
function drawList() {
  if (!T) return;
  var q = fold(S.q), cur = current();
  var hidden = 0;
  var rows = VIS.filter(function (p) {
    if (!applies(cur.op, p)) { hidden++; return false; }
    if (S.kind === 'uep' && p.kind !== 'uep') return false;
    if (S.kind === 'own' && p.kind === 'uep') return false;
    if (!q) return true;
    return fold(p.name + ' ' + (p.full || '') + ' ' + (p.serves || '') + ' ' + (p.type || '') + ' ' + (p.operator || '')).indexOf(q) >= 0;
  });
  var rk = {}; rows.forEach(function (p) { rk[p.id] = rank(p); });
  var mg = {}; rows.forEach(function (p) { mg[p.id] = margin(p); });
  var mgv = function (id) { return mg[id] ? mg[id].rel : 9; };
  rows.sort(function (a, b) { var x = rk[a.id], y = rk[b.id]; return x[0] - y[0] || x[1] - y[1] || mgv(a.id) - mgv(b.id) || short(a).localeCompare(short(b)); });
  var cnt = { L: 0, I: 0, V: 0, S: 0 };
  rows.forEach(function (p) { var c = codes(p.id); var v = c ? c[S.i] : '-'; if (cnt[v === 'R' ? 'S' : v] !== undefined) cnt[v === 'R' ? 'S' : v]++; });
  $('jn-listk').innerHTML = (q ? 'busca: ' + rows.length + ' de ' + VIS.length : (S.kind === 'uep' ? 'as unidades' : S.kind === 'own' ? 'bacias e terminais' : 'todos os locais')) + ', <b>pela próxima janela</b>, menor folga primeiro';
  $('jn-fleet').innerHTML = 'em ' + esc(wtxt(AX[S.i])) + ': <span>' + g('L') + cnt.L + '</span><span>' + g('I') + cnt.I + '</span><span>' + g('V') + cnt.V + '</span><span>' + g('S') + cnt.S + '</span>'
    + (hidden ? '<span title="' + esc(cur.op.appliesTo.why) + '">+ ' + hidden + ' sem armazenagem, fora</span>' : '');
  var shown = rows.slice(0, S.listN);
  $('jn-rows').innerHTML = shown.map(function (p) {
    var c = codes(p.id) || repeat('-', AX.length), ms = '';
    for (var k = 0; k < c.length; k++) ms += '<i class="' + c[k] + (k === S.i ? ' cur' : '') + '"></i>';
    return '<button type="button" class="jn-row" data-site="' + esc(p.id) + '" aria-label="' + esc(short(p) + ', ' + WORD[c[S.i]] + ', próxima janela ' + nxText(p).replace(/<[^>]+>/g, '')) + '">'
      + g(c[S.i]) + '<span class="nm">' + esc(short(p)) + '<small>' + esc(subOf(p)) + '</small></span><span class="nx">' + nxText(p) + '</span><span class="ms" aria-hidden="true">' + ms + '</span></button>';
  }).join('') + (rows.length > S.listN ? '<button type="button" class="jn-btn jn-more" id="jn-more">mostrar mais ' + Math.min(60, rows.length - S.listN) + ' (de ' + rows.length + ')</button>' : '')
    + (!rows.length ? '<p class="jn-fine">Nada encontrado. Tente o nome da unidade (P-75), do campo (Búzios) ou do terminal.</p>' : '');
  if ($('jn-more')) $('jn-more').onclick = function () { S.listN += 60; drawList(); };
}
$('jn-rows').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-site]'); if (b) select(b.getAttribute('data-site')); });
$('jn-q').addEventListener('input', function () { S.q = this.value; S.listN = 30; drawList(); });
$('jn-kind').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-kind]'); if (!b) return;
  S.kind = b.getAttribute('data-kind'); S.listN = 30;
  [].forEach.call(this.querySelectorAll('[data-kind]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
  drawList();
});

/* ================================================================ the site card */
/* why the site alpha is silent here, in a tile's words: never "no alpha" where one was estimated for other limits */
function alphaUpTo(p) {
  var t = p.alphaFrom && CFG.alphaT[p.alphaFrom]; if (!t) return null;
  var top = null; Object.keys(t.rows).forEach(function (r) { t.rows[r].forEach(function (v, i) { if (v !== null && (top === null || t.columns[i] > top)) top = t.columns[i]; }); });
  return top;
}
function siteShort(p, r) {
  if (/pares insuficientes/.test(r.why)) { var up = alphaUpTo(p); return up ? 'α do local só até Hs ' + dc(String(up)) + ' m' : 'α do local não estimado aqui'; }
  if (/terminal/.test(r.why)) return 'não se aplica num terminal';
  if (/medição|estimado/.test(r.why)) return 'sem α do local nesta região';
  return 'não se aplica';
}
function nodeLine(p) {
  var src = p.kind === 'uep' ? p.bandFrom : p.id;
  var pr = (T.pruned || []).filter(function (x) { return x.sites.indexOf(src) >= 0; })[0];
  return (pr ? 'A faixa medida daqui foi PODADA pelo placar' + (pr.at ? ' em ' + dmy(pr.at) : '') + ': errou a própria reivindicação de cobertura, e até uma versão recalibrada ela não decide aqui (a banda fica SEM DADOS; a Tabela 4-1 decide). ' : '') + nodeLine0(p);
}
function nodeLine0(p) {
  var s = T.places[p.id];
  var ll = function (a) { return dec(Math.abs(a[0]), 2) + '°' + (a[0] < 0 ? 'S' : 'N') + ' ' + dec(Math.abs(a[1]), 2) + '°' + (a[1] < 0 ? 'W' : 'E'); };
  var at = 'Previsão ECMWF lida no nó ' + ll(s.node) + ' do modelo';
  if (p.kind === 'uep') return at + ' (0,25°). ' + (p.caveat ? 'Atenção: ' + p.caveat + ' ' : '') + (p.bandFrom ? 'A faixa medida e o α do local vêm de ' + short(PL[p.bandFrom]) + ', o local medido mais perto (' + p.near.km + ' km)' + (alphaUpTo(p) ? '; o α, estimado para Hs de projeto até ' + dc(String(alphaUpTo(p))) + ' m (acima disso, três anos de satélite têm menos de 30 pares por célula).' : '.') : (p.tracked && PL[p.tracked.site] ? 'Sem faixa medida ainda: o local ' + short(PL[p.tracked.site]) + ', a ' + p.tracked.km + ' km, é acompanhado desde ' + dmy(p.tracked.added) + ' e ganha faixa quando os três anos de previsão × satélite dele forem lidos. Até lá a Tabela 4-1 decide.' : 'Sem faixa medida: nenhum local medido a menos de 350 km (o mais perto, ' + short(PL[p.near.site]) + ', a ' + p.near.km + ' km). O critério da Tabela 4-1 ainda decide.'));
  if (p.kind === 'terminal') return at + ': o mar aberto da APROXIMAÇÃO, não o berço. A faixa medida vem de ' + short(PL[s.bandFrom] || { name: s.bandFrom || '—', kind: 'field' }) + ': um altímetro não enxerga dentro de uma baía.';
  if (!(STEPS[p.id] || []).some(function (x) { return x.hb; })) return at + '. Local acompanhado desde ' + dmy(p.added) + ': a previsão daqui entra no placar todos os dias, mas a faixa medida e o α do local só chegam quando os três anos de previsão × satélite deste mar forem lidos. Até lá a banda medida fica SEM DADOS e a Tabela 4-1 da DNV decide.';
  return at + '; a faixa medida e o α são deste local (pares satélite × previsão de 2023 a 2026).' + (p.caveat ? ' Atenção: ' + p.caveat : '');
}
function dmy(iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '—'; }
function explain(p, r, op, crit) {
  var st = STEPS[p.id];
  if (r === null) return 'A janela passa do último passo da previsão: não há com o que decidir.';
  if (r.verdict === 'n/a') return 'Não se aplica: ' + r.why + '.';
  var lims = crit === 'band' ? op.limits : (r.opwf || []).concat(op.limits.filter(function (l) { return l.var !== 'hs' && l.var !== 'wind_sustained'; }));
  var pick = function (v) { for (var k = 0; k < lims.length; k++) if (lims[k].var === v) return lims[k]; return null; };
  var span = C.span(st, S.i, op.TR) || [S.i];
  var arr = function (v, edge) {
    var key = crit === 'band' ? (v === 'hs' ? 'hb' : 'wb') : (v === 'hs' ? 'hd' : 'wd'), best = null;
    span.forEach(function (k) { var b = st[k][key]; if (!b) return; var x = Q.parse(b[edge]); if (!best || (edge === 1 ? Q.cmp(x, best) > 0 : Q.cmp(x, best) < 0)) best = x; });
    return best ? dc(Q.dec(best, v === 'hs' ? 2 : 1, edge === 1 ? 'up' : 'down')) : '—';
  };
  var lt = function (l) { return (OPW[l.op] || l.op) + ' ' + q2(l.value, l.var === 'hs' ? 2 : 1) + ' ' + (UNIT[l.unit] || l.unit); };
  var what = crit === 'band' ? 'a borda desfavorável da faixa medida' : 'a previsão determinística';
  if (r.verdict === 'LIBERADA') {
    return 'Em todos os ' + span.length + ' passos da janela, ' + what + ' fica dentro: ' + r.decidedOn.map(function (v) {
      var l = pick(v); return VAR[v] + ' no máximo ' + arr(v, 1) + ' ' + (v === 'hs' ? 'm' : 'nós') + ' (' + (crit === 'band' ? 'limite ' : 'OPWF ') + lt(l) + ')'; }).join('; ') + '.';
  }
  if (r.verdict === 'VETADA') {
    var w = r.witness, l2 = pick(w.var);
    return 'Mesmo ' + (crit === 'band' ? 'a borda favorável da faixa medida' : 'a previsão determinística') + ' quebra ' + (crit === 'band' ? 'o limite' : 'o OPWF') + ' em ' + wtxt(w.t, true) + ': ' + VAR[w.var] + ' ' + edgeWord(w) + ', contra ' + lt(l2) + '. A testemunha é essa hora e essa variável.';
  }
  if (r.verdict === 'INDEFINIDA') {
    return (crit === 'band' ? 'A faixa medida atravessa o limite' : 'A previsão, arredondada para fora a 1 mm, encosta no OPWF') + ': ' + r.flip.map(function (f) {
      var l3 = pick(f.var);
      return 'em ' + wtxt(f.t, true) + ', ' + VAR[f.var] + ' vai até ' + q2(f.edge, 2) + ' ' + (f.var === 'hs' ? 'm' : 'nós') + ' contra ' + lt(l3) + '; para virar LIBERADA, a borda desfavorável precisa ' + (/^</.test(f.limit) ? 'baixar ' : 'subir ') + dc(f.gapDec) + ' ' + (f.var === 'hs' ? 'm' : 'nós');
    }).join('. ') + '. Se a borda favorável passar do limite, vira VETADA.';
  }
  if (r.verdict === 'SEM DADOS') {
    return (r.decidedOn && r.decidedOn.length ? 'O que tem faixa medida libera (' + r.decidedOn.map(function (v) { return VAR[v]; }).join(' e ') + '), mas a regra limita mais: ' : 'Nada do que esta regra limita tem faixa aqui: ')
      + missingShort(p, r, op) + '.';
  }
  return r.why || '';
}
function drawCard() {
  var box = $('jn-card'), p = PL[S.site];
  if (!T || !p || !STEPS[p.id]) { box.hidden = true; return; }
  box.hidden = false;
  var cur = current(), op = cur.op, st = STEPS[p.id], TR = C.trOf(op.TR);
  var crits = CFG.crits, res = {}, cs = {};
  crits.forEach(function (k) { res[k] = full(p.id, S.i, k, cur); cs[k] = codes(p.id, k, cur); });
  var eyebrow = p.kind === 'uep' ? [p.type, fieldsOf(p).slice(0, 3).join(', '), p.depth ? 'lâmina ' + grp(p.depth) + ' m' : '', p.operator].filter(Boolean).join(' · ') : kindOf(p);
  var end = addH(AX[S.i], TR);
  var tile = function (k) {
    var r = res[k], c = vcode(r), e;
    if (r === null) e = 'além da previsão';
    else if (r.verdict === 'n/a') e = k === 'site' ? siteShort(p, r) : 'não se aplica';
    else if (k === 'band') e = op.limits.filter(function (l) { return l.var === 'hs' || l.var === 'wind_sustained'; }).map(function (l) { return VAR[l.var] + ' ' + OPW[l.op] + ' ' + dc(l.value); }).join(' · ') || 'limites da regra';
    else e = 'α ' + q2(r.alpha.hs, 3) + ' → ' + r.opwf.filter(function (l) { return l.var === 'hs'; }).map(function (l) { return 'Hs ≤ ' + q2(l.value, 2); }).join('');
    return '<div class="' + (k === S.crit ? 'on ' : '') + (k === 'site' ? 'est' : '') + '"><span class="h">' + esc(CSHORT[k]) + '</span><span class="w">' + chip(c) + '</span><span class="e">' + esc(e) + '</span></div>';
  };
  var mx = crits.map(function (k) {
    var c = cs[k] || repeat('-', AX.length), cells = '';
    for (var i = 0; i < c.length; i++) cells += '<i class="' + (i === S.i ? 'cur' : '') + '" data-k="' + i + '" title="' + esc(wtxt(AX[i], true) + ' · ' + WORD[c[i]]) + '">' + g(c[i]) + '</i>';
    return '<span class="l' + (k === S.crit ? ' on' : '') + '">' + esc(CSHORT[k]) + '</span><span class="ms" data-crit="' + k + '">' + cells + '</span>';
  }).join('');
  var isTank = p.kind === 'uep' && applies(preset('alivio'), p);
  var h = '<div class="jn-ch"><div class="jn-grow"><div class="jn-k">' + esc(eyebrow) + '</div><h2>' + esc(p.kind === 'uep' ? p.name : p.name) + '</h2>'
    + (p.kind === 'uep' && p.full && p.full !== p.name ? '<div class="jn-fine">' + esc(p.full) + (p.oilBpd ? ' · capacidade de processamento ' + grp(p.oilBpd) + ' bpd (ANP)' : '') + '</div>' : '')
    + '<p class="jn-node">' + esc(nodeLine(p)) + '</p></div><button type="button" class="jn-x" id="jn-close" aria-label="Fechar o local (Esc)">×</button></div>'
    + '<div><div class="jn-k">' + esc(cur.name) + ' · começando <b>' + esc(wtxt(AX[S.i], true)) + '</b>' + (TR ? ' → ' + esc(wtxt(end)) : ', condição na hora') + '</div>'
    + '<div class="jn-three">' + crits.map(tile).join('') + '</div></div>'
    + '<p class="jn-why">' + esc(explain(p, res[S.crit], op, S.crit)) + '</p>'
    + '<div><div class="jn-k">a semana, pelos três critérios</div><div class="jn-mx" id="jn-mx">' + mx + '</div></div>'
    + chartHs(p, cur) + chartWind(p, cur) + dirs(p) + seaParts(p)
    + '<div class="jn-note">' + currentNote(p) + '</div>'
    + (isTank && S.op === 'alivio' ? tank(p) : '')
    + waitCost(p)
    + certBlock(p);
  box.innerHTML = h;
  $('jn-close').onclick = function () { select(null); };
  $('jn-nota-b').onclick = nota;
  $('jn-cert-b').onclick = function () { certDownload(p); };
  $('jn-mx').addEventListener('click', function (e) {
    var cell = e.target.closest && e.target.closest('[data-k]'), row = e.target.closest && e.target.closest('[data-crit]');
    if (row && row.getAttribute('data-crit') !== S.crit) S.crit = row.getAttribute('data-crit');
    if (cell) { stop(); S.i = +cell.getAttribute('data-k'); FIELD.target = S.i; }
    change();
  });
  wireInputs();
}
function currentNote(p) {
  var eq = p.lat > -10, has = STEPS[p.id] && STEPS[p.id].some(function (s) { return s.cu; });
  return '<b>Corrente e direção.</b> ' + (has
    ? 'A corrente de superfície do Copernicus Marine (modelo global 1/12°, com maré e deriva de onda) é mostrada, ainda não decidida: falta medi-la contra correntes observadas. Num canal ou numa baía o modelo não vê a corrente de maré do canal, e as regras de corrente dos terminais seguem SEM DADOS.'
    : 'A corrente não está na previsão deste dia: toda regra que a limita fica SEM DADOS.')
    + (eq ? ' Na Margem Equatorial a corrente é a variável que governa a operação, e ainda não é decidida aqui.' : '')
    + (S.op === 'alivio' ? ' No alívio, a direção decide o setor verde do aliviador: as setas acima são a previsão, conferida por quem opera.' : '');
}

/* ---- charts: the measured band (decided, solid) against the forecast (dashed, hatched) ---- */
var CW = 372, PLft = 34, PRt = 8;
function xOf(i) { return PLft + i * (CW - PLft - PRt) / (AX.length - 1); }
function chartBase(H, top, tick, unit) {
  var o = [], y = function (v) { return 18 + (H - 38) * (1 - v / top); };
  for (var t = 0; t <= top + 1e-9; t += tick) {
    o.push('<line class="gl" x1="' + PLft + '" x2="' + (CW - PRt) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/>');
    o.push('<text class="ax" x="' + (PLft - 5) + '" y="' + (y(t) + 3.5).toFixed(1) + '" text-anchor="end">' + dc(String(Math.round(t * 10) / 10)) + '</text>');
  }
  DAYS.forEach(function (d) {
    if (d.k > 0) o.push('<line class="dl" x1="' + ((xOf(d.k) + xOf(d.k - 1)) / 2).toFixed(1) + '" x2="' + ((xOf(d.k) + xOf(d.k - 1)) / 2).toFixed(1) + '" y1="18" y2="' + (H - 20) + '"/>');
    if (d.n >= 3) o.push('<text class="ax" x="' + ((xOf(d.k) + xOf(d.k + d.n - 1)) / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(d.lab.split(' ')[0]) + '</text>');
  });
  o.push('<text class="ax" x="' + (CW - PRt) + '" y="9" text-anchor="end">' + esc(unit) + '</text>');
  return { o: o, y: y };
}
function poly(st, key, y, mid) {
  var runs = [], cur = null;
  st.forEach(function (s, i) { if (s[key]) { if (!cur) { cur = []; runs.push(cur); } cur.push(i); } else cur = null; });
  return runs.map(function (r) {
    if (mid) return r.length > 1 ? '<polyline class="det" points="' + r.map(function (i) { var b = st[i][key]; return xOf(i).toFixed(1) + ',' + y((+b[0] + +b[1]) / 2).toFixed(1); }).join(' ') + '"/>' : '';
    /* the decided band is filled; ECMWF's ensemble hatched; NOAA's ensemble an outline (providers-v1: forecast ink, never decided on) */
    var cls = key === 'ens' ? 'ens' : key === 'ensN' ? 'swr' : 'band';
    if (r.length === 1) { var b0 = st[r[0]][key]; return '<rect class="' + cls + '" x="' + (xOf(r[0]) - 2).toFixed(1) + '" y="' + y(+b0[1]).toFixed(1) + '" width="4" height="' + Math.max(1, y(+b0[0]) - y(+b0[1])).toFixed(1) + '"/>'; }
    var up = r.map(function (i) { return xOf(i).toFixed(1) + ',' + y(+st[i][key][1]).toFixed(1); });
    var dn = r.slice().reverse().map(function (i) { return xOf(i).toFixed(1) + ',' + y(+st[i][key][0]).toFixed(1); });
    return '<polygon class="' + cls + '"' + (key === 'ens' ? ' fill="url(#jn-hatch)"' : '') + ' points="' + up.concat(dn).join(' ') + '"/>';
  }).join('');
}
function guides(op, p, v, y, cur) {
  var o = [], lab = [];
  op.limits.forEach(function (l) { if (l.var === v) lab.push({ v: +l.value, t: (v === 'hs' ? 'limite ' : 'limite ') + OPW[l.op] + ' ' + dc(l.value), c: 'lim' }); });
  ['table', 'site'].forEach(function (k) {
    var r = full(p.id, S.i, k, cur);
    if (r && r.opwf) r.opwf.forEach(function (l) { if (l.var === v) lab.push({ v: Number(Q.dec(Q.parse(l.value), 3)), t: 'OPWF ' + (k === 'table' ? 'tabela ' : 'local ') + q2(l.value, v === 'hs' ? 2 : 1), c: 'opwf' }); });
  });
  var placed = [];
  lab.sort(function (a, b) { return b.v - a.v; }).forEach(function (L) {
    var gy = y(L.v), ty = gy - 3, tx = PLft + 4;
    placed.forEach(function (q) { if (Math.abs(q.y - ty) < 11 && tx < q.x1) { tx = q.x1 + 8; } });
    placed.push({ y: ty, x1: tx + L.t.length * 6.2 });
    o.push('<line class="' + L.c + '" x1="' + PLft + '" x2="' + (CW - PRt) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>');
    o.push('<text class="' + L.c + 't" x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '">' + esc(L.t) + '</text>');
  });
  return { o: o, vals: lab.map(function (L) { return L.v; }) };
}
function winRect(p, op, H) {
  var sp = C.span(STEPS[p.id], S.i, op.TR);
  var a = xOf(S.i), b = sp ? xOf(sp[sp.length - 1]) : xOf(AX.length - 1);
  return '<rect class="win" x="' + (a - 3).toFixed(1) + '" y="18" width="' + Math.max(6, b - a + 6).toFixed(1) + '" height="' + (H - 38) + '"/>'
    + '<line class="cur" x1="' + a.toFixed(1) + '" x2="' + a.toFixed(1) + '" y1="14" y2="' + (H - 20) + '"/>';
}
function chartHs(p, cur) {
  var st = STEPS[p.id], op = cur.op, H = 150, vals = [1];
  st.forEach(function (s) { if (s.hb) vals.push(+s.hb[1]); if (s.hd) vals.push(+s.hd[1]); if (s.ens) vals.push(+s.ens[1]); if (s.ensN) vals.push(+s.ensN[1]); });
  var gtmp = guides(op, p, 'hs', function () { return 0; }, cur); vals = vals.concat(gtmp.vals);
  var mx = Math.max.apply(null, vals), tick = mx <= 3 ? 0.5 : mx <= 6 ? 1 : 2, top = Math.max(2 * tick, Math.ceil(mx * 1.06 / tick) * tick);
  var B = chartBase(H, top, tick, 'Hs (m)');
  var gd = guides(op, p, 'hs', B.y, cur);
  var hasEns = st.some(function (s) { return s.ens; }), hasEnsN = st.some(function (s) { return s.ensN; }), hasBand = st.some(function (s) { return s.hb; });
  var svg = '<svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Hs em ' + short(p) + ', sete dias: a faixa medida (decidida) contra a previsão determinística' + (hasEns ? ' e o ensemble' : '') + ' do ECMWF' + (hasEnsN ? ' e o ensemble da NOAA' : '') + ', com o limite e os OPWF.') + '">'
    + '<defs><pattern id="jn-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="hl" x1="0" y1="0" x2="0" y2="5"/></pattern></defs>'
    + winRect(p, op, H) + B.o.join('') + poly(st, 'ens', B.y) + poly(st, 'ensN', B.y) + poly(st, 'hb', B.y) + poly(st, 'hd', B.y, true) + gd.o.join('') + '</svg>';
  var hasUnion = st.some(function (s) { return s.hp === 'en'; });
  return '<figure class="jn-fig">' + svg + '<ul class="jn-key"><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="band" x="1" y="1.5" width="20" height="7"/></svg>faixa medida' + (hasBand ? (hasUnion ? ', ECMWF ∪ NOAA' : '') : ' (sem faixa aqui)') + '</li>'
    + '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><line class="det" x1="1" y1="5" x2="21" y2="5"/></svg>previsão determinística</li>'
    + (hasEns ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="swr" x="1" y="1.5" width="20" height="7"/><line class="hl" x1="4" y1="8.5" x2="9" y2="1.5"/><line class="hl" x1="10" y1="8.5" x2="15" y2="1.5"/><line class="hl" x1="16" y1="8.5" x2="21" y2="1.5"/></svg>ensemble ECMWF, 40 de 50</li>' : '')
    + (hasEnsN ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="swr" x="1" y="1.5" width="20" height="7"/></svg>ensemble NOAA, 25 de 31</li>' : '')
    + '<li><svg viewBox="0 0 22 10" aria-hidden="true"><line class="lim" x1="1" y1="5" x2="21" y2="5"/></svg>limite · OPWF</li></ul></figure>';
}
function chartWind(p, cur) {
  var st = STEPS[p.id], op = cur.op, H = 120, vals = [10];
  st.forEach(function (s) { if (s.wb) vals.push(+s.wb[1]); if (s.wd) vals.push(+s.wd[1]); });
  var gtmp = guides(op, p, 'wind_sustained', function () { return 0; }, cur); vals = vals.concat(gtmp.vals);
  var mx = Math.max.apply(null, vals), tick = mx <= 30 ? 5 : mx <= 60 ? 10 : 20, top = Math.max(2 * tick, Math.ceil(mx * 1.06 / tick) * tick);
  var B = chartBase(H, top, tick, 'vento (nós)');
  var gd = guides(op, p, 'wind_sustained', B.y, cur);
  var svg = '<svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Vento a 10 m em ' + short(p) + ', sete dias: a faixa medida contra a previsão determinística, com o limite.') + '">'
    + winRect(p, op, H) + B.o.join('') + poly(st, 'wb', B.y) + poly(st, 'wd', B.y, true) + gd.o.join('') + '</svg>';
  return '<figure class="jn-fig">' + svg + '</figure>';
}
function dirs(p) {
  var st = STEPS[p.id], H = 22;
  var row = function (key, cls) {
    var o = '';
    st.forEach(function (s, i) {
      if (s[key] === undefined) return;
      var a = (Number(s[key]) + 180) % 360, x = xOf(i);
      o += '<g transform="translate(' + x.toFixed(1) + ' 11) rotate(' + a.toFixed(0) + ')"><path class="' + cls + '" d="M0 5 L0 -5 M-2.6 -2.2 L0 -5 L2.6 -2.2"/></g>';
    });
    return o;
  };
  var tp = st.map(function (s, i) { return s.tp && i % 4 === 1 ? '<text class="ax" x="' + xOf(i).toFixed(1) + '" y="14" text-anchor="middle">' + dc(s.tp) + '</text>' : ''; }).join('');
  return '<div class="jn-dir"><span class="l">ondas</span><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="Para onde as ondas vão, previsão por passo">' + row('mwd', 'arr') + '</svg>'
    + '<span class="l">Tp (s)</span><svg viewBox="0 0 ' + CW + ' 18" role="img" aria-label="Período de pico previsto">' + tp + '</svg>'
    + '<span class="l">vento</span><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="Para onde o vento sopra, previsão por passo">' + row('wdir', 'arrw') + '</svg></div>'
    + '<p class="jn-fine jn-fc">Setas: para onde a onda e o vento vão, previsão ECMWF por passo (não decidida).</p>';
}

/* ---- the sea by parts at the chosen hour: NOAA's wind sea and swells (forecast ink, never decided on) ---- */
var PONTOS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
function seaParts(p) {
  var s = STEPS[p.id] && STEPS[p.id][S.i];
  if (!s || (!s.wp && !s.cu)) return '';
  var cur = s.cu ? '<p class="jn-p">Corrente na superfície: <b>' + dc(s.cu[0].toFixed(1)) + ' nó</b> para ' + PONTOS[Math.round(s.cu[1] / 22.5) % 16] + ' (' + s.cu[1] + '°)'
    + (s.cu[2] !== null ? ', dos quais maré ' + dc(s.cu[2].toFixed(1)) + ' nó' : '') + '.</p><p class="jn-fine jn-fc">Copernicus Marine, modelo global 1/12° com maré e deriva de onda: mostrada, não decidida.</p>' : '';
  if (!s.wp) return '<div><div class="jn-k">o mar por partes · ' + esc(wtxt(AX[S.i], true)) + '</div>' + cur + '</div>';
  var name = { v: 'mar de vento', 1: 'ondulação 1', 2: 'ondulação 2', 3: 'ondulação 3' };
  var rows = s.wp.map(function (x) {
    return '<tr><td>' + esc(name[x[0]] || x[0]) + '</td><td>' + dc(x[1].toFixed(2)) + '</td><td>' + (x[2] === null ? '—' : dc(x[2].toFixed(1))) + '</td><td>'
      + (x[3] === null ? '—' : x[3] + '° ' + PONTOS[Math.round(x[3] / 22.5) % 16]) + '</td></tr>';
  }).join('');
  return '<div><div class="jn-k">o mar por partes · ' + esc(wtxt(AX[S.i], true)) + '</div><div class="tw"><table class="jn-tbl"><thead><tr><th>parte</th><th>Hs (m)</th><th>período (s)</th><th>vem de</th></tr></thead><tbody>'
    + rows + '</tbody></table></div><p class="jn-fine jn-fc">NOAA WAVEWATCH III (GFS-Wave), previsão por partes: mostrada, não decidida.</p>' + cur + '</div>';
}

/* ---- ALÍVIO CRÍTICO: the user's tanks against the next LIBERADA offloading window ---- */
/* the codes a planning line counts on: the chosen criterion, or the measured band where the chosen one does not apply */
function planCodes(p) {
  var c = codes(p.id, S.crit);
  if (c && /[LVIS]/.test(c)) return { c: c, crit: S.crit, fell: false };
  return { c: codes(p.id, 'band') || '', crit: 'band', fell: S.crit !== 'band' };
}
function tank(p) {
  var v = {}; try { v = JSON.parse(store.get('tank.' + p.id) || '{}'); } catch (e) { v = {}; }
  var f = function (k, lab, ph) { return '<label>' + lab + '<input class="jn-in" data-tank="' + k + '" inputmode="numeric" value="' + esc(v[k] || '') + '" placeholder="' + ph + '"></label>'; };
  var h = '<div><div class="jn-k">alívio crítico · <b>os seus números</b></div><div class="jn-tank">' + f('cap', 'armazenagem (bbl)', '1.600.000') + f('inv', 'estoque agora (bbl)', '1.200.000') + f('bpd', 'produção (bpd)', '100.000') + '</div>'
    + '<div class="jn-tank">' + f('price', 'preço (US$/bbl, opcional)', '—') + '</div>';
  var num0 = function (x) { var s = String(x || '').trim(); if (!s) return null; var n = Number(s.replace(/\./g, '').replace(',', '.')); return isFinite(n) && n >= 0 ? n : null; };
  var num = function (x) { var n = num0(x); return n ? n : null; };
  var cap = num(v.cap), inv0 = num0(v.inv), bpd = num(v.bpd), price = num(v.price);
  var pc = planCodes(p), c = pc.c, n = nextL(c, iNow);
  var crit = CSHORT[pc.crit] + (pc.fell ? ', porque o critério escolhido não se aplica aqui' : '');
  /* the inventory was typed at v.at: production has run since (offloads, if any, are the user's to re-type) */
  var since = v.at ? Math.max(0, (Date.now() - v.at) / 3600e3) : 0;
  var inv = inv0 === null ? null : inv0 + (bpd ? bpd * since / 24 : 0);
  var ago = v.at && since >= 1 ? ' Estoque digitado há ' + Math.round(since) + ' h; contado com a produção desde então (sem alívio no meio), ~' + grp(inv) + ' bbl.' : '';
  if (cap && inv !== null && bpd && inv >= cap) {
    h += '<div class="jn-crit-a" role="alert"><span class="t">ALÍVIO CRÍTICO</span><p>Pelos seus números os tanques já estão cheios. ' + (n ? 'A próxima janela LIBERADA (' + esc(crit) + ') abre ' + esc(wtxt(AX[n.k])) + '.' : 'Nenhuma janela LIBERADA (' + esc(crit) + ') nos 7 dias desta previsão.') + esc(ago) + '</p></div>';
  } else if (cap && inv !== null && bpd) {
    var hours = (cap - inv) / bpd * 24, fullAt = Date.now() + hours * 3600e3;
    var fullT = new Date(fullAt).toISOString().slice(0, 13);
    var opens = n ? Date.parse(AX[n.k] + ':00:00Z') : null;
    var fullTxt = 'tanques cheios em ~' + Math.round(hours) + ' h (' + wtxt(fullT) + ')';
    if (opens === null || opens > fullAt) {
      var gap = opens === null ? null : (opens - fullAt) / 3600e3;
      var lost = gap === null ? null : gap / 24 * bpd;
      h += '<div class="jn-crit-a" role="alert"><span class="t">ALÍVIO CRÍTICO</span><p>' + esc(fullTxt) + ', e ' + (n ? 'a próxima janela LIBERADA (' + esc(crit) + ') só abre ' + esc(wtxt(AX[n.k])) + ': ' + Math.round(gap) + ' h depois.' : 'nenhuma janela LIBERADA (' + esc(crit) + ') nos 7 dias desta previsão.')
        + (lost ? ' Produção adiada, pela sua conta: ~' + grp(lost) + ' bbl' + (price ? ' ≈ US$ ' + grp(lost * price) : '') + '.' : '') + esc(ago) + '</p></div>';
    } else h += '<p class="jn-crit-ok">' + esc(fullTxt) + '; a próxima janela LIBERADA (' + esc(crit) + ') abre ' + esc(wtxt(AX[n.k])) + ', ' + Math.round((fullAt - opens) / 3600e3) + ' h antes.' + esc(ago) + '</p>';
  } else h += '<p class="jn-fine">Digite armazenagem, estoque e produção: a Janela põe "tanques cheios em X h" ao lado da próxima janela de alívio. Os números ficam só neste navegador.</p>';
  return h + '</div>';
}
function waitCost(p) {
  var rate = Number(String(store.get('diaria') || '').replace(/\./g, '').replace(',', '.')) || null;
  var h = '<div><div class="jn-k">o custo da espera · <b>a sua diária</b></div><div class="jn-edit"><label>diária (R$/dia)<input class="jn-in wide" id="jn-rate" inputmode="numeric" value="' + (rate ? grp(rate) : '') + '" placeholder="ex. 250.000"></label></div>';
  var pc = planCodes(p), c = pc.c;
  var n = c ? nextL(c, iNow) : null;
  if (pc.fell) h += '<p class="jn-fine">Pela banda medida: o critério escolhido não se aplica aqui.</p>';
  if (rate) {
    if (n) { var hrs = Math.max(0, (Date.parse(AX[n.k] + ':00:00Z') - Date.now()) / 3600e3); h += '<p class="jn-p">Esperar até ' + esc(wtxt(AX[n.k])) + ' (' + Math.round(hrs) + ' h) custa <b>' + brl(hrs / 24 * rate) + '</b> à sua diária.</p>'; }
    else { var last = Math.max(0, (Date.parse(AX[AX.length - 1] + ':00:00Z') - Date.now()) / 3600e3); h += '<p class="jn-p">Nenhuma janela LIBERADA nesta previsão: a espera passa de ' + Math.round(last) + ' h, mais de <b>' + brl(last / 24 * rate) + '</b> à sua diária.</p>'; }
  } else h += '<p class="jn-fine">O valor é o seu: a Janela não inventa diária. Fica só neste navegador.</p>';
  return h + '</div>';
}
function wireInputs() {
  [].forEach.call(document.querySelectorAll('[data-tank]'), function (inp) {
    inp.addEventListener('change', function () {
      var v = { at: Date.now() }; [].forEach.call(document.querySelectorAll('[data-tank]'), function (x) { v[x.getAttribute('data-tank')] = x.value.trim(); });
      store.set('tank.' + S.site, JSON.stringify(v)); drawCard();
    });
  });
  var r = $('jn-rate'); if (r) r.addEventListener('change', function () { store.set('diaria', this.value.trim()); drawCard(); drawMonth(); });
}

/* ================================================================ the month */
function drawMonth() {
  var W = CFG.work, cur = current();
  /* the month's defaults come from the place and the operation, and say so whenever the grid cannot hold them exactly */
  var notes = [], fresh = !S.ms || !S.ml || !S.mt;
  var siteK = S.ms || (function () {
    var p = PL[S.site]; if (!p) return 'santos';
    var b = p.kind === 'uep' ? p.bandFrom : p.id;
    if (b === 'campos-p25') b = 'campos';                       /* P-25 sits in the Campos basin, whose hindcast node is Campos' */
    if (W.sites[b]) return b;
    notes.push(short(p) + ' não tem nó de hindcast na sua região: o mês mostra a área escolhida abaixo (Santos de início), não a da unidade.');
    return 'santos';
  })();
  var lim = S.ml || (function () {
    var l = cur && cur.op.limits.filter(function (x) { return x.var === 'hs'; })[0]; if (!l) return '2.0';
    var v = Number(l.value), grid = W.limits.map(Number).sort(function (a, b) { return a - b; });
    var below = grid.filter(function (x) { return x <= v + 1e-9; }), g = below.length ? below[below.length - 1] : grid[0];
    if (Math.abs(g - v) > 1e-9) notes.push('O seu limite, Hs ' + dc(l.value) + ' m, não está na grade contada (' + grid.map(function (x) { return dc(x.toFixed(1)); }).join(', ') + ' m): o mês mostra ' + dc(g.toFixed(1)) + ' m, ' + (g < v ? 'o degrau abaixo — conta menos janelas do que o seu limite daria.' : 'o menor degrau, ACIMA do seu limite — conta mais janelas do que ele daria.'));
    return g.toFixed(1);
  })();
  var tr = S.mt || (function () {
    var t = cur ? C.trOf(cur.op.TR) : 48, grid = W.periods.slice().sort(function (a, b) { return a - b; });
    var up = grid.filter(function (x) { return x >= t; }), g = up.length ? up[0] : grid[grid.length - 1];
    if (g !== t) notes.push('A sua janela de ' + t + ' h não está na grade (' + grid.join(', ') + ' h): o mês mostra ' + g + ' h, ' + (g > t ? 'a mais longa seguinte — conta menos janelas.' : 'a mais longa contada — conta mais janelas do que a sua.'));
    return g;
  })();
  S.ms = siteK; S.ml = lim; S.mt = tr;
  if (fresh) S.mnotes = notes;
  [['jn-m-site', 'data-ms', siteK], ['jn-m-lim', 'data-ml', lim], ['jn-m-tr', 'data-mt', String(tr)]].forEach(function (a) {
    [].forEach.call($(a[0]).querySelectorAll('[' + a[1] + ']'), function (b) { b.setAttribute('aria-checked', b.getAttribute(a[1]) === a[2] ? 'true' : 'false'); });
  });
  var s = W.sites[siteK], c = s.cells[lim + 'm/' + tr + 'h'], name = s.name;
  if (!c) { $('jn-m-season').innerHTML = '<p class="jn-p">Sem contagem para esta combinação.</p>'; return; }
  drawCampaign(siteK, lim, tr, c);
  var pct = function (w, n) { return n ? dc((Math.floor((w * 2000 + n) / (2 * n)) / 10).toFixed(1)) + '%' : '—'; };
  var sum = function (arr, ms) { var a = 0, b = 0; ms.forEach(function (m) { a += arr[m][0]; b += arr[m][1]; }); return [a, b]; };
  var WIN = [5, 6, 7], SUM = [11, 0, 1];
  var wo = sum(c.o, WIN), so = sum(c.o, SUM), wf = sum(c.f, WIN), sf = sum(c.f, SUM);
  var ws = c.s ? sum(c.s.c, WIN) : null, ss = c.s ? sum(c.s.c, SUM) : null;
  var ratio = so[0] / so[1] > 0 && wo[0] / wo[1] > 0 ? (1 - wo[0] / wo[1]) / Math.max(1e-9, 1 - so[0] / so[1]) : null;
  var mnote = S.mnotes && S.mnotes.length ? '<p class="jn-fine jn-mnote">' + S.mnotes.map(esc).join(' ') + '</p>' : '';
  $('jn-m-season').innerHTML = mnote + '<div class="jn-k">o mês · a estação · <b>' + esc(name.replace(/ — .*$/, '')) + ' · Hs ≤ ' + dc(lim) + ' m por ' + tr + ' h</b></div><div class="jn-season">'
    + '<div><div class="jn-k">inverno · jun–ago</div><div class="big">' + pct(wo[0], wo[1]) + '</div><div class="s">dos inícios têm janela (o mar permite). A Tabela 4-1 deixa ' + pct(wf[0], wf[1]) + (ws ? '; o α do local deixaria <i>' + pct(ws[0], ws[1]) + '</i>' : '') + '.</div></div>'
    + '<div><div class="jn-k">verão · dez–fev</div><div class="big">' + pct(so[0], so[1]) + '</div><div class="s">dos inícios têm janela. A Tabela 4-1 deixa ' + pct(sf[0], sf[1]) + (ss ? '; o α do local deixaria <i>' + pct(ss[0], ss[1]) + '</i>' : '') + '.</div></div></div>'
    + '<p class="jn-fine">Contagens exatas (' + grp(wo[0]) + ' de ' + grp(wo[1]) + ' inícios no inverno, ' + grp(so[0]) + ' de ' + grp(so[1]) + ' no verão)' + (ratio && ratio > 1.15 ? '; o tempo parado no inverno é ' + dc(ratio.toFixed(1)) + '× o do verão' : '') + '. ' + (c.s ? 'O α do local é uma estimativa (intervalo de 90%); a contagem sobre ele é exata.' : 'O α do local só tem contagem onde foi estimado (Hs 2,0 m nas bacias medidas).') + '</p>';
  /* the chart: 12 months, three bars */
  var H = 170, y = function (v) { return 14 + (H - 36) * (1 - v / 100); }, gw = (CW - PLft - PRt) / 12, three = !!c.s, bw = Math.min(9, gw * (three ? 0.26 : 0.36)), o = [];
  [0, 25, 50, 75, 100].forEach(function (t) { o.push('<line class="gl" x1="' + PLft + '" x2="' + (CW - PRt) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/><text class="ax" x="' + (PLft - 5) + '" y="' + (y(t) + 3.5).toFixed(1) + '" text-anchor="end">' + t + '%</text>'); });
  for (var m = 0; m < 12; m++) {
    var cx = PLft + gw * m + gw / 2;
    (three ? [[c.o[m], 'w1', cx - 1.5 * bw - 1], [c.f[m], 'w2', cx - bw / 2], [c.s.c[m], 'w3', cx + bw / 2 + 1]] : [[c.o[m], 'w1', cx - bw - 0.5], [c.f[m], 'w2', cx + 0.5]]).forEach(function (b) {
      var pv = b[0][1] ? 100 * b[0][0] / b[0][1] : 0, top = y(pv);
      o.push('<rect class="' + b[1] + '" x="' + b[2].toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, y(0) - top).toFixed(1) + '" rx="1.5"/>');
    });
    o.push('<text class="ax" x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + MON[m].slice(0, 1).toUpperCase() + '</text>');
  }
  $('jn-m-chart').innerHTML = '<div class="jn-k">por mês · inícios com janela</div><figure class="jn-fig"><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Janelas por mês em ' + name + ', Hs ≤ ' + dc(lim) + ' m por ' + tr + ' h: o mar permite, a Tabela 4-1 deixa' + (three ? ', o α do local deixaria' : '') + '.') + '">' + o.join('') + '</svg>'
    + '<ul class="jn-key"><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="w1" x="1" y="1" width="20" height="8" rx="1.5"/></svg>o mar permite (Hs ≤ ' + dc(lim) + ' m)</li><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="w2" x="1" y="1" width="20" height="8" rx="1.5"/></svg>a Tabela 4-1 deixa (OPWF ' + dc(c.wf) + ' m)</li>'
    + (three ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="w3" x="1" y="1" width="20" height="8" rx="1.5"/></svg>o α do local deixaria (' + dc(c.s.wf) + ' m, estimativa)</li>' : '') + '</ul></figure>';
  /* the table: % and days of window per month, the mean wait */
  var DIM = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var days = function (r, mm) { return r[1] ? dc((r[0] / r[1] * DIM[mm]).toFixed(1)) : '—'; };
  var rows = '';
  for (var k = 0; k < 12; k++) rows += '<tr><td>' + MON[k] + '</td><td>' + pct(c.o[k][0], c.o[k][1]) + '</td><td>' + days(c.o[k], k) + '</td><td>' + pct(c.f[k][0], c.f[k][1]) + '</td><td>' + days(c.f[k], k) + '</td>' + (three ? '<td class="est">' + days(c.s.c[k], k) + '</td>' : '') + '<td>' + dc(c.o[k][2] || '—') + '</td><td>' + dc(c.f[k][2] || '—') + '</td></tr>';
  rows += '<tr class="y"><td>ano</td><td>' + pct(c.o[12][0], c.o[12][1]) + '</td><td>' + dc((c.o[12][0] / c.o[12][1] * 365.25).toFixed(0)) + '</td><td>' + pct(c.f[12][0], c.f[12][1]) + '</td><td>' + dc((c.f[12][0] / c.f[12][1] * 365.25).toFixed(0)) + '</td>' + (three ? '<td class="est">' + dc((c.s.c[12][0] / c.s.c[12][1] * 365.25).toFixed(0)) + '</td>' : '') + '<td>' + dc(c.wo) + '</td><td>' + dc(c.wfw) + '</td></tr>';
  $('jn-m-table').innerHTML = '<div class="jn-k">dias de janela por mês · espera média (h)</div><div class="tw"><table class="jn-tbl"><thead><tr><th>mês</th><th>mar</th><th>dias</th><th>tab.</th><th>dias</th>' + (three ? '<th>α loc.</th>' : '') + '<th>esp. mar</th><th>esp. tab.</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p class="jn-fine">Hindcast Ifremer WAVEWATCH III no nó da área, ' + esc(W.from.slice(0, 4)) + '–' + esc(W.to.slice(0, 4)) + '; dias = fração exata × dias do mês; espera = horas de um início até o próximo início com janela. A espera da tabela usa o OPWF.</p>';
  var rate = Number(String(store.get('diaria') || '').replace(/\./g, '').replace(',', '.')) || null;
  var lostDays = c.o[12][0] / c.o[12][1] * 365.25 - c.f[12][0] / c.f[12][1] * 365.25;
  var dWait = Number(c.wfw) - Number(c.wo);
  $('jn-m-cost').innerHTML = '<div class="jn-k">o que a Tabela 4-1 custa · <b>a sua diária</b></div><div class="jn-edit"><label>diária (R$/dia)<input class="jn-in wide" id="jn-rate-m" inputmode="numeric" value="' + (rate ? grp(rate) : '') + '" placeholder="ex. 250.000"></label></div>'
    + '<p class="jn-p">Por ano, o α da tabela fecha <b>' + dc(lostDays.toFixed(0)) + ' dias</b> de janela que o mar abre, e a espera média até a próxima janela passa de ' + dc(c.wo) + ' h para ' + dc(c.wfw) + ' h (+' + dc(dWait.toFixed(1)) + ' h por operação).'
    + (rate ? ' À sua diária: <b>' + brl(dWait / 24 * rate) + '</b> a mais de espera por operação.' : '') + (c.s ? ' Com o α do local (estimado), a espera seria ' + dc(c.s.w) + ' h.' : '') + '</p>';
  var r2 = $('jn-rate-m'); if (r2) r2.addEventListener('change', function () { store.set('diaria', this.value.trim()); drawMonth(); });
}
[['jn-m-site', 'data-ms', 'ms'], ['jn-m-lim', 'data-ml', 'ml'], ['jn-m-tr', 'data-mt', 'mt'], ['jn-m-n', 'data-mn', 'mn'], ['jn-m-start', 'data-mm', 'mm']].forEach(function (a) {
  $(a[0]).addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[' + a[1] + ']'); if (!b) return; S[a[2]] = a[2] === 'mt' || a[2] === 'mn' ? +b.getAttribute(a[1]) : b.getAttribute(a[1]); S.mnotes = null; drawMonth(); hash(); });
});

/* ---- THE CAMPAIGN: N operations back to back from the 1st of a month, run in every year of the hindcast, in this tab ---- */
var HIND = {};
function hindSeries(node) {
  if (HIND[node]) return HIND[node];
  var h = CFG.plan.hindcast[node];
  HIND[node] = fetch(h.file).then(function (r) { if (!r.ok) throw new Error('hindcast ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
    var check = window.crypto && crypto.subtle ? crypto.subtle.digest('SHA-256', buf).then(function (d) {
      var hex = [].map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      if (hex !== h.sha256) throw new Error('o hindcast de ' + node + ' não confere com o seu sha256');
    }) : Promise.resolve();
    return check.then(function () {
      var v = new DataView(buf), x = new Array(h.n), times = new Array(h.n), t0 = Date.parse(h.from + ':00:00Z');
      for (var k = 0; k < h.n; k++) { x[k] = v.getInt16(2 * k, true); times[k] = new Date(t0 + k * h.stepH * 3600e3).toISOString().slice(0, 13); }
      return { x: x, times: times, stepH: h.stepH, scale: h.scale, fill: h.fill };
    });
  });
  return HIND[node];
}
function drawCampaign(siteK, lim, tr, cell) {
  var el = $('jn-m-camp'); if (!el || !CFG.plan || !CFG.plan.hindcast[siteK]) { if (el) el.innerHTML = ''; return; }
  var N = S.mn || 10, mm = S.mm || String(((new Date()).getUTCMonth() + 1) % 12 + 1).padStart(2, '0');
  S.mn = N; S.mm = mm;
  [['jn-m-n', 'data-mn', String(N)], ['jn-m-start', 'data-mm', mm]].forEach(function (a) {
    [].forEach.call($(a[0]).querySelectorAll('[' + a[1] + ']'), function (b) { b.setAttribute('aria-checked', b.getAttribute(a[1]) === a[2] ? 'true' : 'false'); });
  });
  el.innerHTML = '<p class="jn-fine">Contando ' + (CFG.plan.hindcast[siteK].to.slice(0, 4) - CFG.plan.hindcast[siteK].from.slice(0, 4) + 1) + ' campanhas, uma por ano…</p>';
  var key = [siteK, lim, tr, N, mm].join('|');
  hindSeries(siteK).then(function (ser) {
    if ([S.ms, S.ml, S.mt, S.mn, S.mm].join('|') !== key) return;          /* the user moved on */
    var CP = req('campaign.js');
    var opwf = cell && cell.a ? Q.str(Q.mul(Q.parse(cell.a), Q.parse(lim))) : null;
    var sea = CP.campaign(ser, { limit: lim, TR: tr, N: N, start: mm + '-01' });
    var tab = opwf ? CP.campaign(ser, { limit: opwf, TR: tr, N: N, start: mm + '-01' }) : null;
    var sopwf = cell && cell.s && cell.s.a ? Q.str(Q.mul(Q.parse(cell.s.a), Q.parse(lim))) : null;
    var loc = sopwf ? CP.campaign(ser, { limit: sopwf, TR: tr, N: N, start: mm + '-01' }) : null;
    var d = function (h) { return h === null ? '—' : dc((Math.round(h / 2.4) / 10).toFixed(1)); };
    var row = function (lab, r) { return '<tr><td>' + lab + '</td><td>' + d(r.q50) + '</td><td>' + d(r.q90) + '</td><td>' + d(r.worst) + (r.worstYear ? ' <small>(' + r.worstYear + ')</small>' : '') + '</td></tr>'; };
    var mon = MON[+mm - 1];
    el.innerHTML = '<p class="jn-p">Começando em 1º de ' + mon + ', <b>' + N + ' operaç' + (N === 1 ? 'ão' : 'ões') + ' de ' + tr + ' h com Hs ≤ ' + dc(lim) + ' m</b>: em metade dos ' + sea.finished + ' anos, prontas em <b>' + d(sea.q50) + ' dias</b>; em 9 de cada 10, em ' + d(sea.q90) + '; no pior ano (' + sea.worstYear + '), ' + d(sea.worst) + '.</p>'
      + '<div class="tw"><table class="jn-tbl"><thead><tr><th>dias até terminar</th><th>metade dos anos</th><th>9 de 10</th><th>o pior</th></tr></thead><tbody>'
      + row('o mar (limite ' + dc(lim) + ' m)', sea) + (tab ? row('Tabela 4-1 (OPWF ' + dc(Q.dec(Q.parse(opwf), 2)) + ' m)', tab) : '')
      + (loc ? row('<i>α do local (OPWF ' + dc(Q.dec(Q.parse(sopwf), 2)) + ' m)</i>', loc) : '') + '</tbody></table></div>'
      + '<p class="jn-fine">Cada ano do hindcast roda a campanha: a primeira janela depois de 1º de ' + mon + ', a operação ocupa a janela, a seguinte procura a partir do fim dela (sem trânsito nem espera de mobilização). Os quantis são estatísticas de ordem exatas dos anos que terminam' + (sea.censored ? '; ' + sea.censored + ' ano' + (sea.censored > 1 ? 's' : '') + ' não termina' + (sea.censored > 1 ? 'm' : '') + ' antes do fim do registro e fica' + (sea.censored > 1 ? 'm' : '') + ' de fora, contado' + (sea.censored > 1 ? 's' : '') : '') + '. Um hindcast é o mar passado de um modelo (' + esc(CFG.plan.source) + '); a conta é exata sobre ele, e só isso.</p>';
  }).catch(function (e) { if (el) el.innerHTML = '<p class="jn-p">A campanha não pôde ser contada: ' + esc(e.message) + '.</p>'; });
}

/* ================================================================ the scoreboard */
function drawPlacar() {
  var el = $('jn-props');
  if (!T || !T.ledger) { el.innerHTML = '<div class="jn-box"><p class="jn-p">O placar chega com os dados do dia, que não carregaram.</p></div>'; return; }
  var NAMES = CFG.proposerNames || {};   /* for a day built before proposers carried their name */
  var d = function (iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '—'; };
  /* the admission as placar.js decided it in the day's build: trials are target days, the tail is read at 30·2^j days;
     a status word, never a verdict glyph (ADMITIDO is not LIBERADA) */
  var first = T.ledger.firstLook || 30;
  el.innerHTML = T.ledger.proposers.map(function (p) {
    var cut = p.status === 'DEADMITTED', st, line;
    if (p.pending === undefined) p.pending = !cut;      /* a day built before admission-v1 carried no looks: nothing tested */
    if (cut && p.prunedAt) { st = '<span class="jn-w jn-st cut">PODADO</span>'; line = 'podado no ' + p.prunedAt.m + 'º dia-ensaio (' + d(p.prunedAt.through) + '): ' + p.prunedAt.covered + ' cobertos, cauda exata ' + esc(p.prunedAt.tail) + ' ≤ ' + esc(p.prunedAt.bar) + '. Esta versão não volta; só uma recalibrada, com registro novo.'; }
    else if (p.pending) { st = '<span class="jn-w jn-st pend">EM AVALIAÇÃO</span>'; line = (p.trials || 0) + ' de ' + first + ' dias-ensaio: nada testado ainda. A primeira leitura da cauda é no ' + first + 'º dia; ' + (p.decides === false ? 'um ensemble bruto: mostrado e avaliado, nunca decide.' : 'até lá a faixa decide e o placar só conta.'); }
    else { var lk = p.looks[p.looks.length - 1] || {}; st = '<span class="jn-w jn-st ok">ADMITIDO</span>'; line = p.trialsCovered + ' de ' + p.trials + ' dias-ensaio cobertos; na leitura de ' + lk.m + ' dias, cauda exata ' + esc(lk.tail) + ' > ' + esc(lk.bar) + '; próxima leitura em ' + p.next + ' dias.'; }
    return '<div class="jn-box jn-prop"><div class="jn-k">' + esc(p.name || NAMES[p.domain] || p.domain) + '</div><div class="big">' + grp(p.commits) + '</div><p class="jn-p">faixas comprometidas antes da hora-alvo · '
      + p.scored + ' avaliadas · ' + p.covered + ' cobertas · reivindicação ' + esc(p.claim) + ' · ' + p.sites + ' locais de mar aberto · desde ' + d(p.first) + '</p>'
      + '<div class="jn-adm">' + st + '</div><p class="jn-fine">' + line + '</p>' + breakdownHtml(p)
      + (p.scored === 0 ? '<p class="jn-fine">Nenhuma avaliada ainda: a avaliação começa quando os satélites passam e os dias fecham (três dias depois, quando o arquivo do NOAA está completo). O registro é só de acréscimo.</p>' : '') + '</div>';
  }).join('') + decisionsHtml(T.ledger.decisions);
}

/* the published DECISIONS graded against the satellite (decision-level-v1): Hs only, descriptive counts */
function decisionsHtml(D) {
  if (!D) return '';
  var CN = { band: 'faixa medida', table: 'DNV Tab. 4-1', site: 'α do local' };
  var rows = ['band', 'table', 'site'].map(function (c) {
    var b = D.byCrit[c];
    return '<tr><td>' + CN[c] + '</td><td>' + b.L.held + '</td><td>' + b.L.broke + '</td><td>' + b.V.confirmed + '</td><td>' + b.V.open + '</td><td>' + (b.L.unseen + b.V.unseen) + '</td></tr>';
  }).join('');
  var first = D.days && D.days.length ? D.days[0].slice(8, 10) + '/' + D.days[0].slice(5, 7) + '/' + D.days[0].slice(0, 4) : null;
  return '<div class="jn-box"><div class="jn-k">As decisões, conferidas por satélite</div>'
    + (D.graded ? '<div class="tw"><table class="jn-tbl"><thead><tr><th>critério</th><th>LIBERADA manteve</th><th>LIBERADA rompeu</th><th>VETADA confirmada</th><th>VETADA abriu</th><th>sem passagem</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + (D.brokeAll ? '<p class="jn-fine">LIBERADA que o mar rompeu: ' + D.broke.map(function (x) { return esc(x.site + ' · ' + x.preset + ' · ' + CN[x.crit] + ' · início ' + x.start.slice(8, 10) + '/' + x.start.slice(5, 7) + ' ' + x.start.slice(11, 13) + 'h · Hs ' + x.hs.map(function (h) { return dc(h[1]); }).join(', ') + ' m'); }).join('; ') + (D.brokeAll > D.broke.length ? '; …' : '') + '.</p>' : '')
      : '<p class="jn-p">Nenhuma janela conferida ainda' + (first ? ': as decisões são guardadas desde ' + first + ', e cada dia é conferido três dias depois de fechar, quando o arquivo do NOAA está completo.' : '.') + '</p>')
    + '<p class="jn-fine">Só a Hs, a variável que o altímetro mede como a decisão a entende, nos passos da janela com passagem a até 3 h. Contagens descritivas: as janelas de um dia se sobrepõem e dividem passagens. Regra fixada em 07/10/2026, antes da primeira conferência.</p></div>';
}

/* the scored rows per site and per lead: descriptive (a day's rows share their overflights) — the admission reads trials */
function breakdownHtml(p) {
  if (!p.scored || !p.bySite) return '';
  var cell = function (x) { return x[1] + '/' + x[0]; };
  var sites = Object.keys(p.bySite).sort().map(function (sid) { return '<tr><td>' + esc(PL[sid] ? short(PL[sid]) : sid) + '</td><td>' + cell(p.bySite[sid]) + '</td></tr>'; }).join('');
  var leads = Object.keys(p.byLead || {}).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + cell(p.byLead[k]) + '</td></tr>'; }).join('');
  return '<table class="jn-tbl jn-bd"><thead><tr><th>local</th><th>cobertas/avaliadas</th></tr></thead><tbody>' + sites + '</tbody>'
    + (leads ? '<thead><tr><th>prazo</th><th></th></tr></thead><tbody>' + leads + '</tbody>' : '') + '</table>'
    + '<p class="jn-fine">Contagem descritiva: as faixas de um mesmo dia dividem as mesmas passagens de satélite; a admissão lê os dias-ensaio.</p>';
}

/* ================================================================ modes, selection, render */
function setMode(m) {
  S.mode = m;
  [].forEach.call($('jn-modes').querySelectorAll('[data-mode]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
  ['semana', 'mes', 'placar'].forEach(function (k) { $('pane-' + k).hidden = k !== m; });
  if (m === 'mes') drawMonth();
  if (m === 'placar') drawPlacar();
  if (phone.matches && S.sheet === 'peek' && m !== 'semana') setSheet('half');
  $('jn-scroll').scrollTop = 0;
  hash();
}
$('jn-modes').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-mode]'); if (b) setMode(b.getAttribute('data-mode')); });
function select(id, quiet) {
  S.site = id;
  if (S.op === 'npcp' && (!id || !npcpOf(id).length)) { S.op = 'alivio'; S.edit = null; }
  if (S.op === 'npcp') S.npcp = (npcpOf(id)[0] || {}).id;
  S.ms = null;
  if (quiet) return;
  change();
  if (id && phone.matches) { if (S.sheet === 'peek') setSheet('half'); }
  if (id) { var c = $('jn-card'); if (c && !c.hidden) $('jn-scroll').scrollTop = Math.max(0, c.offsetTop - 8); }
  if (id && MAP.map && PL[id]) { var pt = MAP.map.project([PL[id].lon, PL[id].lat]), cv = MAP.map.getCanvas(); var vis = viewRect(); if (pt.x < vis.l || pt.x > vis.r || pt.y < vis.t || pt.y > vis.b) MAP.map.easeTo({ center: [PL[id].lon, PL[id].lat], duration: 500 }); if (MAP.map.getZoom() < 6.2) MAP.map.easeTo({ center: [PL[id].lon, PL[id].lat], zoom: 6.6, duration: 700 }); }
}
function change() { memo = memo || {}; S.ml = null; S.mt = null; render(); hash(); }
function render() {
  if (!T) return;
  answer(); drawClock(); drawOps(); drawCrit(); drawCard(); drawList();
  if (S.mode === 'mes') drawMonth();
  drawMarks();
  if (phone.matches && S.sheet === 'peek' && S.mode === 'semana') { var before = getComputedStyle(document.documentElement).getPropertyValue('--jn-peek'); measurePeek(); if (getComputedStyle(document.documentElement).getPropertyValue('--jn-peek') !== before) pad(); }
}

/* ================================================================ the URL */
var quiet = false;
function hash() {
  if (!T) return;
  quiet = true;
  var kv = ['site=' + (S.site || ''), 'op=' + S.op, 't=' + AX[S.i], 'crit=' + S.crit, 'modo=' + S.mode, 'rodada=' + T.run];
  if (S.op === 'npcp' && S.npcp) kv.push('npcp=' + S.npcp);
  var cur = current();
  if (cur && (S.edit || S.op === 'own')) {
    cur.op.limits.forEach(function (l) { if (l.var === 'hs') kv.push('hs=' + l.value); if (l.var === 'wind_sustained') kv.push('vento=' + l.value); });
    kv.push('tr=' + cur.op.TR);
  }
  try { history.replaceState(null, '', '#' + kv.join('&')); } catch (e) { /* a file:// page may refuse */ }
  quiet = false;
}
function readHash() {
  var kv = {};
  decodeURIComponent(location.hash.slice(1)).split('&').forEach(function (p) { var k = p.indexOf('='); if (k > 0) kv[p.slice(0, k)] = p.slice(k + 1); });
  if (kv.site !== undefined) S.site = PL[kv.site] ? kv.site : (kv.site === '' ? null : S.site);
  if (kv.op && (preset(kv.op) || kv.op === 'npcp' || kv.op === 'own')) S.op = kv.op;
  if (kv.npcp) S.npcp = kv.npcp;
  if (kv.crit && CIX[kv.crit] !== undefined) S.crit = kv.crit;
  if (kv.modo && ['semana', 'mes', 'placar'].indexOf(kv.modo) >= 0) S.mode = kv.modo;
  var num = function (v) { return /^\d+(\.\d+)?$/.test(String(v || '')) ? String(v) : null; };
  if (kv.hs || kv.vento || kv.tr) {
    var L = []; if (num(kv.hs)) L.push({ var: 'hs', op: '<=', value: num(kv.hs), unit: 'm' }); if (num(kv.vento)) L.push({ var: 'wind_sustained', op: '<=', value: num(kv.vento), unit: 'kn' });
    var tr = Math.max(0, Math.min(120, parseInt(kv.tr, 10) || 0));
    if (S.op === 'own') S.own = { limits: L.length ? L : null, TR: tr };
    else if (S.op === 'npcp') S.edit = { TR: tr };
    else if (L.length) S.edit = { limits: L, TR: tr };
    if (S.own && !S.own.limits) S.own = null;
  }
  return kv;
}
window.addEventListener('hashchange', function () { if (quiet || !T) return; var kv = readHash(); if (kv.t) { var k = AX.indexOf(kv.t); if (k >= 0) S.i = k; } FIELD.target = S.i; setMode(S.mode); render(); });

/* ================================================================ keyboard */
document.addEventListener('keydown', function (e) {
  var tag = (e.target && e.target.tagName) || '';
  if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (!T || S.mode !== 'semana') return;
    e.preventDefault(); stop(); setI(S.i + (e.key === 'ArrowLeft' ? -1 : 1));
  } else if (e.key === '1' || e.key === '2' || e.key === '3') setMode(['semana', 'mes', 'placar'][+e.key - 1]);
  else if (e.key === 'Escape') {
    if (S.legend) { toggleLegend(false); return; }
    if (S.site) { select(null); return; }
    if (phone.matches && S.sheet !== 'peek') setSheet('peek');
  }
});

/* ================================================================ the phone's sheet */
var panel = $('panel');
function measurePeek() {
  if (!phone.matches) return;
  var p = panel.getBoundingClientRect(), t = $('jn-time').getBoundingClientRect(), sc = $('jn-scroll').scrollTop;
  var want = Math.round(t.bottom + sc - p.top + 10), cap = Math.round(window.innerHeight * 0.4);
  document.documentElement.style.setProperty('--jn-peek', Math.min(cap, Math.max(160, want)) + 'px');
}
function sheetPx(st) { var vh = window.innerHeight, top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--jn-top')) || 48;
  return st === 'full' ? vh - top - 8 : st === 'half' ? Math.round(vh * 0.58) : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--jn-peek')) || 206; }
function setSheet(st) {
  S.sheet = st; panel.setAttribute('data-sheet', st);
  $('jn-grip').setAttribute('aria-label', st === 'full' ? 'Mostrar menos do painel' : 'Mostrar mais do painel');
  if (st === 'peek') $('jn-scroll').scrollTop = 0;
  pad();
}
(function sheet() {
  panel.setAttribute('data-sheet', 'peek');
  var y0 = null, t0 = 0, h0 = 0, moved = false, src = null;
  function start(e) {
    if (!phone.matches) return;
    if (e.target.closest && e.target.closest('a,input,select,button:not(#jn-grip)')) return;
    y0 = e.clientY; t0 = performance.now(); h0 = sheetPx(S.sheet); moved = false; src = e.currentTarget;
  }
  function move(e) {
    if (y0 === null) return;
    var dy = e.clientY - y0;
    if (!moved && Math.abs(dy) < 6) return;
    if (!moved) { moved = true; panel.classList.add('drag'); src.setPointerCapture && src.setPointerCapture(e.pointerId); }
    panel.style.height = Math.max(120, Math.min(window.innerHeight - 52, h0 - dy)) + 'px';
  }
  function end(e) {
    if (y0 === null) return;
    var dy = e.clientY - y0, v = dy / Math.max(1, performance.now() - t0);
    y0 = null; panel.classList.remove('drag'); panel.style.height = '';
    var ord = ['peek', 'half', 'full'], k = ord.indexOf(S.sheet);
    if (!moved) { if (src === $('jn-grip')) setSheet(ord[k === 2 ? 0 : k + 1]); else if (S.sheet === 'peek') setSheet('half'); return; }
    var h = h0 - dy, best = ord.reduce(function (a, s) { return Math.abs(sheetPx(s) - h) < Math.abs(sheetPx(a) - h) ? s : a; }, 'peek');
    if (v < -0.5) best = ord[Math.min(2, k + 1)]; else if (v > 0.5) best = ord[Math.max(0, k - 1)];
    setSheet(best);
  }
  [$('jn-grip'), $('jn-answer')].forEach(function (el) {
    el.addEventListener('pointerdown', start); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });
  $('jn-grip').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var ord = ['peek', 'half', 'full'], k = ord.indexOf(S.sheet); setSheet(ord[k === 2 ? 0 : k + 1]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSheet(S.sheet === 'peek' ? 'half' : 'full'); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSheet(S.sheet === 'full' ? 'half' : 'peek'); }
  });
  phone.addEventListener('change', function () { setSheet('peek'); resize(); });
})();
function toggleLegend(on) { S.legend = on; $('jn-legend').classList.toggle('open', on); $('jn-keybtn').setAttribute('aria-expanded', on ? 'true' : 'false'); }
$('jn-keybtn').onclick = function () { toggleLegend(!S.legend); };

/* ================================================================ the map */
var MAP = { map: null };
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function rgba(hex, a) { var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
var COL = {};
function colors() { ['--paper', '--surface', '--surface2', '--ink', '--ink-2', '--ink-3', '--ink-4', '--ink-5', '--rule', '--rule-strong', '--v-cert', '--v-refu', '--v-refd', '--v-cert-soft', '--v-refu-soft', '--v-refd-soft'].forEach(function (k) { COL[k] = tok(k); }); }
colors();
var MONO = tok('--f-mono');
function viewRect() {
  var w = window.innerWidth, h = window.innerHeight, top = phone.matches ? 48 : 56;
  if (phone.matches) return { l: 0, r: w, t: top, b: h - sheetPx(S.sheet === 'full' ? 'half' : S.sheet) };
  var rail = $('panel').getBoundingClientRect();
  return { l: 0, r: rail.left, t: top, b: h };
}
var BOUNDS = [[-53, -33.5], [-33, 4.5]], BOUNDS_PHONE = [[-51, -33], [-32.5, 4.5]];
function pad() {
  if (!MAP.map) return;
  var w = window.innerWidth, h = window.innerHeight, v = viewRect();
  var P = { top: v.t + (phone.matches ? 34 : 44), bottom: h - v.b + 8, left: phone.matches ? 8 : 12, right: w - v.r + (phone.matches ? 8 : 12) };
  if (T && !MAP.fitted && MAP.ready) { MAP.fitted = true; MAP.map.fitBounds(phone.matches ? BOUNDS_PHONE : BOUNDS, { padding: phone.matches ? Object.assign({}, P, { right: P.right + 34, left: P.left + 10 }) : P, duration: 0 }); return; }
  MAP.map.easeTo({ padding: P, duration: 300 });
}
function mapStyle() {
  return { version: 8, sources: { land: { type: 'geojson', data: GEO.land }, fields: { type: 'geojson', data: GEO.fields }, presal: { type: 'geojson', data: GEO.presal } },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': COL['--paper'] } },
      { id: 'fields-fill', type: 'fill', source: 'fields', paint: { 'fill-color': COL['--ink-5'], 'fill-opacity': 0.07 } },
      { id: 'fields', type: 'line', source: 'fields', paint: { 'line-color': COL['--ink-5'], 'line-width': 0.8, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.55, 7, 1] } },
      { id: 'presal', type: 'line', source: 'presal', paint: { 'line-color': COL['--ink-4'], 'line-width': 1, 'line-opacity': 0.6 } },
      { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': COL['--surface2'] } },
      { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': COL['--ink-5'], 'line-width': 0.8 } }
    ] };
}
function initMap() {
  if (!window.maplibregl) { status('o mapa não carregou; o painel funciona sem ele'); return; }
  var map;
  try {
    map = new maplibregl.Map({ container: 'map', style: mapStyle(), bounds: BOUNDS, maxBounds: [[-98, -54], [-2, 18]], minZoom: 2, maxZoom: 10.5,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0, renderWorldCopies: false, fadeDuration: 0,
      attributionControl: { compact: true, customAttribution: 'ECMWF open data (CC BY 4.0) · NOAA · E.U. Copernicus Marine Service Information · ANP — GeoMaps · Natural Earth' } });
  } catch (e) { status('o mapa não abriu (' + e.message + '); o painel funciona sem ele'); return; }
  map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation();
  MAP.map = map;
  map.on('load', function () { MAP.ready = true; pad(); drawMarks(); FIELD.dirty = true; });
  map.on('move', function () { drawMarks(); FIELD.dirty = true; FIELD.moving = true; });
  map.on('moveend', function () { FIELD.moving = false; FIELD.clear = true; });
  map.on('movestart', function () { FIELD.clear = true; });
  map.on('mousemove', function (e) { hover(e.point, false); });
  map.on('mouseout', function () { tip(null); });
  map.on('click', function (e) { var h = hit(e.point, phone.matches ? 22 : 14); if (!h) { tip(null); return; }
    if (h.kind === 'cluster') { var b = new maplibregl.LngLatBounds(); h.members.forEach(function (p) { b.extend([p.lon, p.lat]); }); map.fitBounds(b, { padding: 80, maxZoom: 8, duration: 700 }); tip(null); }
    else { tip(null); stop(); select(h.p.id); } });
}
function status(t) { var s = $('jn-status'); s.textContent = t; s.classList.toggle('on', !!t); }

/* ---- the annunciators, on their own canvas ---- */
var MK = { cv: $('jn-marks'), drawn: [] };
function fit(cv) { var d = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight; if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); } var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
function glyph(c, x, y, r, v, square, sel) {
  var path = function () { c.beginPath(); if (square) { var s = r * 0.92; c.rect(x - s, y - s, 2 * s, 2 * s); } else c.arc(x, y, r, 0, Math.PI * 2); };
  c.save();
  path(); c.fillStyle = COL['--paper']; c.fill();
  if (v === 'L') { path(); c.fillStyle = COL['--v-cert']; c.fill(); }
  else if (v === 'V') { path(); c.lineWidth = 1.6; c.strokeStyle = COL['--v-refu']; c.stroke(); var k = r * 0.55; c.beginPath(); c.moveTo(x - k, y - k); c.lineTo(x + k, y + k); c.moveTo(x + k, y - k); c.lineTo(x - k, y + k); c.stroke(); }
  else if (v === 'I') { path(); c.lineWidth = 1.2; c.strokeStyle = COL['--ink-2']; c.stroke(); path(); c.clip(); c.lineWidth = 1; c.beginPath(); for (var d = -2 * r; d <= 2 * r; d += 3) { c.moveTo(x + d - r, y + r); c.lineTo(x + d + r, y - r); } c.stroke(); }
  else if (v === 'S' || v === 'R') { c.fillStyle = COL['--v-refd']; var n = Math.max(8, Math.round(r * 2.2)); for (var j = 0; j < n; j++) { var a = j / n * Math.PI * 2, px, py; if (square) { var t = j / n * 4, side = Math.floor(t), f = t - side, s2 = r * 0.92; px = side === 0 ? x - s2 + 2 * s2 * f : side === 1 ? x + s2 : side === 2 ? x + s2 - 2 * s2 * f : x - s2; py = side === 0 ? y - s2 : side === 1 ? y - s2 + 2 * s2 * f : side === 2 ? y + s2 : y + s2 - 2 * s2 * f; } else { px = x + Math.cos(a) * r; py = y + Math.sin(a) * r; } c.beginPath(); c.arc(px, py, 0.95, 0, Math.PI * 2); c.fill(); } }
  else { c.beginPath(); c.arc(x, y, Math.max(1.6, r * 0.32), 0, Math.PI * 2); c.fillStyle = COL['--ink-5']; c.fill(); }
  c.restore();
  if (sel) { c.save(); c.beginPath(); c.arc(x, y, r + 5, 0, Math.PI * 2); c.lineWidth = 1.5; c.strokeStyle = COL['--ink']; c.stroke(); c.restore(); }
}
var PLACED = [];
function label(c, x, y, t, strong) {
  c.save(); c.font = (strong === true ? '600 ' : '500 ') + '11px ' + MONO;
  var w = c.measureText(t).width, box = [x - 2, y - 8, x + w + 2, y + 8];
  for (var k = 0; k < PLACED.length; k++) { var q = PLACED[k]; if (strong !== true && !(strong === 'own' && !q.name) && box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1]) { c.restore(); return; } }
  box.name = true; PLACED.push(box); c.restore();
  c.save(); c.font = (strong ? '600 ' : '500 ') + '11px ' + MONO; c.textBaseline = 'middle';
  c.lineWidth = 3; c.strokeStyle = COL['--paper']; c.strokeText(t, x, y); c.fillStyle = strong === true ? COL['--ink'] : strong === 'own' ? COL['--ink-2'] : COL['--ink-3']; c.fillText(t, x, y); c.restore();
}
function drawMarks() {
  if (!MAP.map || !T) return;
  var c = fit(MK.cv), map = MAP.map, z = map.getZoom(), w = window.innerWidth, h = window.innerHeight;
  c.clearRect(0, 0, w, h);
  MK.drawn = []; PLACED = []; var LBL = [];
  /* the selected place's label is placed first, so nothing hides it */
  var selP = S.site && PL[S.site] && STEPS[S.site] ? PL[S.site] : null;
  if (selP) { var sq = map.project([selP.lon, selP.lat]); PLACED.push([sq.x - 14, sq.y - 14, sq.x + 14 + short(selP).length * 8, sq.y + 14]); }
  var opNow = current();
  var pts = VIS.filter(function (p) { return !opNow || applies(opNow.op, p); }).map(function (p) { var q = map.project([p.lon, p.lat]); var cd = codes(p.id); return { p: p, x: q.x, y: q.y, v: cd ? cd[S.i] : '-' }; })
    .filter(function (o) { return o.x > -20 && o.x < w + 20 && o.y > -20 && o.y < h + 20; });
  var R = z < 4.5 ? 46 : z < 5.5 ? 34 : z < 6.5 ? 22 : 0;
  var groups = [];
  pts.sort(function (a, b) { return (b.p.id === S.site) - (a.p.id === S.site) || (a.p.kind === 'uep') - (b.p.kind === 'uep'); });
  pts.forEach(function (o) {
    if (R && o.p.id !== S.site) for (var k = 0; k < groups.length; k++) { var gg = groups[k]; if (!gg.lock && Math.hypot(gg.x - o.x, gg.y - o.y) < R) { gg.m.push(o); return; } }
    groups.push({ x: o.x, y: o.y, m: [o], lock: o.p.id === S.site });
  });
  groups.sort(function (a, b) { return a.lock - b.lock; });
  groups.forEach(function (gg) {
    if (gg.m.length === 1) {
      var o = gg.m[0], own = o.p.kind !== 'uep', r = own ? 7 : 5.5;
      glyph(c, o.x, o.y, r, o.v, own, o.p.id === S.site);
      MK.drawn.push({ kind: 'place', p: o.p, x: o.x, y: o.y, r: r, v: o.v });
      if (o.p.id === S.site) { label(c, o.x + r + 8, o.y, short(o.p), true); return; }
      PLACED.push([o.x - r - 1, o.y - r - 1, o.x + r + 1, o.y + r + 1]);
      if ((own && z >= 4.2) || (!own && z >= 7.2)) LBL.push([o.x + r + 5, o.y, short(o.p), own ? 'own' : false]);
      return;
    }
    var cnt = { L: 0, I: 0, V: 0, S: 0, x: 0 };
    gg.m.forEach(function (o) { var v = o.v === 'R' ? 'S' : o.v; if (cnt[v] !== undefined) cnt[v]++; else cnt.x++; });
    var cx = gg.m.reduce(function (a, o) { return a + o.x; }, 0) / gg.m.length, cy = gg.m.reduce(function (a, o) { return a + o.y; }, 0) / gg.m.length;
    var txt = cnt.L + '/' + gg.m.length;
    c.save(); c.font = '600 11px ' + MONO;
    var tw = c.measureText(txt).width, bw = tw + 26, bh = 22, x0 = Math.min(Math.max(cx - bw / 2, 4), w - bw - 4), y0 = cy - bh / 2;
    cx = x0 + bw / 2;                                  /* a pill at the edge slides inside the screen, never off it */
    c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, bw, bh, 6); else c.rect(x0, y0, bw, bh);
    c.fillStyle = COL['--surface']; c.fill(); c.lineWidth = 1; c.strokeStyle = COL['--rule-strong']; c.stroke();
    c.restore();
    glyph(c, x0 + 10, cy - 1, 4.2, cnt.L ? 'L' : (cnt.I ? 'I' : cnt.V ? 'V' : 'S'), false, false);
    c.save(); c.font = '600 11px ' + MONO; c.textBaseline = 'middle'; c.fillStyle = COL['--ink']; c.fillText(txt, x0 + 18, cy - 1);
    /* the mix, as a hairline bar under the count: the count is the word, the bar the gist */
    var tot = gg.m.length, bx = x0 + 4, bwid = bw - 8, by = y0 + bh - 3.5, acc = 0;
    [['L', COL['--v-cert']], ['I', COL['--ink-2']], ['V', COL['--v-refu']], ['S', COL['--v-refd']], ['x', COL['--ink-5']]].forEach(function (s) {
      var ww = cnt[s[0]] / tot * bwid; if (!ww) return; c.fillStyle = s[1]; c.fillRect(bx + acc, by, Math.max(1, ww - 1), 2); acc += ww; });
    c.restore();
    PLACED.push([x0, y0, x0 + bw, y0 + bh]);
    MK.drawn.push({ kind: 'cluster', members: gg.m.map(function (o) { return o.p; }), cnt: cnt, x: cx, y: cy, r: bw / 2 });
  });
  /* the names last, each only where it collides with no glyph, pill or name already down */
  LBL.sort(function (a, b) { return (b[3] === 'own') - (a[3] === 'own'); }).forEach(function (l) { label(c, l[0], l[1], l[2], l[3]); });
}
function hit(pt, tol) {
  var best = null, bd = 1e9;
  MK.drawn.forEach(function (d) { var dd = Math.hypot(d.x - pt.x, d.y - pt.y) - (d.kind === 'cluster' ? d.r * 0.6 : d.r); if (dd < tol && dd < bd) { bd = dd; best = d; } });
  return best;
}
function hover(pt) {
  var h = hit(pt, 12), map = MAP.map;
  map.getCanvas().style.cursor = h ? 'pointer' : '';
  if (h && h.kind === 'place') {
    var p = h.p, c = codes(p.id), n = c ? nextL(c, iNow) : null;
    tip('<b>' + esc(short(p)) + '</b> ' + esc(subOf(p)) + '<br>' + chip(h.v) + ' ' + esc(current().name) + ', ' + esc(CSHORT[S.crit]) + ', ' + esc(wtxt(AX[S.i])) + '<br>' + (n ? 'próxima janela LIBERADA ' + esc(wtxt(AX[n.k])) : 'nenhuma janela LIBERADA nesta previsão'), pt);
    return;
  }
  if (h) { tip('<b>' + h.members.length + ' locais</b><br>' + h.cnt.L + ' LIBERADA · ' + h.cnt.I + ' INDEFINIDA · ' + h.cnt.V + ' VETADA · ' + h.cnt.S + ' SEM DADOS<br>clique para aproximar', pt); return; }
  var f = map.getLayer('fields-fill') ? map.queryRenderedFeatures(pt, { layers: ['fields-fill'] }) : [];
  if (f.length) { var pr = f[0].properties; tip('<b>Campo ' + esc(pr.n) + '</b><br>bacia ' + esc(pr.b) + ' · ' + esc(pr.e) + ' (ANP)', pt); return; }
  tip(null);
}
function tip(html, pt) {
  var t = $('jn-tip');
  if (!html) { t.classList.remove('on'); return; }
  t.innerHTML = html; t.classList.add('on');
  var x = pt.x + 14, y = pt.y + 14, w = t.offsetWidth, h = t.offsetHeight;
  if (x + w > window.innerWidth - 8) x = pt.x - w - 14;
  if (y + h > window.innerHeight - 8) y = pt.y - h - 14;
  t.style.left = x + 'px'; t.style.top = y + 'px';
}

/* ---- the forecast field: crests and streaks, forecast ink ---- */
var FIELD = { F: null, tf: null, target: 0, dirty: true, clear: false, moving: false, crests: [], parts: [], last: 0 };
function parseField(buf) {
  var dv = new DataView(buf);
  var magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'JNF1') throw new Error('not a JNF1 field');
  var rows = dv.getUint16(4, true), cols = dv.getUint16(6, true), steps = dv.getUint16(8, true);
  return { rows: rows, cols: cols, steps: steps, lat0: dv.getInt16(10, true) / 100, lon0: dv.getInt16(12, true) / 100, d: dv.getUint16(14, true) / 1000,
    run: dv.getUint32(16, true), b: new Uint8Array(buf, 20), i8: new Int8Array(buf, 20) };
}
/* bilinear in space, linear in time; returns null over land (any corner) for the waves */
function sampleAt(lon, lat, tf) {
  var F = FIELD.F; if (!F) return null;
  var r = (F.lat0 - lat) / F.d, c = (lon - F.lon0) / F.d;
  if (r < 0 || c < 0 || r > F.rows - 1 || c > F.cols - 1) return null;
  var r0 = Math.floor(r), c0 = Math.floor(c), r1 = Math.min(r0 + 1, F.rows - 1), c1 = Math.min(c0 + 1, F.cols - 1), fr = r - r0, fc = c - c0;
  var s0 = Math.max(0, Math.min(F.steps - 1, Math.floor(tf))), s1 = Math.min(F.steps - 1, s0 + 1), ft = Math.max(0, Math.min(1, tf - s0));
  /* the grid's own edge fades over its last four nodes (2°), so the picture never ends in a line */
  var out = { hs: 0, tx: 0, ty: 0, u: 0, v: 0, land: false, fade: Math.min(1, Math.min(r, c, F.rows - 1 - r, F.cols - 1 - c) / 4) };
  var W = [[r0, c0, (1 - fr) * (1 - fc)], [r0, c1, (1 - fr) * fc], [r1, c0, fr * (1 - fc)], [r1, c1, fr * fc]];
  [[s0, 1 - ft], [s1, ft]].forEach(function (st) {
    if (!st[1]) return;
    W.forEach(function (n) {
      var o = ((st[0] * F.rows + n[0]) * F.cols + n[1]) * 4, w = n[2] * st[1];
      var hs = F.b[o];
      if (hs === 255) { out.land = true; } else {
        var dir = F.b[o + 1] * 360 / 256, a = (dir + 180) * Math.PI / 180;
        out.hs += hs * 0.05 * w; out.tx += Math.sin(a) * w; out.ty += Math.cos(a) * w;
      }
      out.u += F.i8[o + 2] * 0.5 * w; out.v += F.i8[o + 3] * 0.5 * w;
    });
  });
  return out;
}
var crestCv = $('jn-crest'), windCv = $('jn-wind');
function buildCrests() {
  var map = MAP.map, v = viewRect(), sp = phone.matches ? 24 : 28, list = [];
  for (var y = v.t + sp / 2; y < v.b; y += sp) for (var x = sp / 2; x < v.r; x += sp) {
    var hsh = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, jit = hsh - Math.floor(hsh);
    var px = x + (jit - 0.5) * sp * 0.6, py = y + ((jit * 7) % 1 - 0.5) * sp * 0.6;
    var ll = map.unproject([px, py]);
    list.push({ x: px, y: py, lon: ll.lng, lat: ll.lat, seed: jit });
  }
  FIELD.crests = list; FIELD.sp = sp;
}
function spawn(p) {
  var map = MAP.map, v = viewRect();
  for (var k = 0; k < 4; k++) {
    var x = v.l + Math.random() * (v.r - v.l), y = v.t + Math.random() * (v.b - v.t), ll = map.unproject([x, y]), s = sampleAt(ll.lng, ll.lat, FIELD.tf);
    if (s && !s.land) { p.lon = ll.lng; p.lat = ll.lat; p.x = x; p.y = y; p.age = 0; p.max = 40 + Math.random() * 70; return; }
  }
  p.age = 1e9; p.max = 0; p.lon = null; p.lat = null;
}
function frame(now) {
  requestAnimationFrame(frame);
  var map = MAP.map;
  if (!map || !FIELD.F || !T || document.hidden) return;
  var dt = Math.min(0.1, (now - (FIELD.last || now)) / 1000); FIELD.last = now;
  /* the clock: playing runs the week; otherwise ease toward the chosen step */
  if (FIELD.tf === null) FIELD.tf = S.i;
  if (S.playing) {
    FIELD.tf += dt / 0.9;
    if (FIELD.tf >= AX.length - 1) { FIELD.tf = AX.length - 1; S.i = AX.length - 1; stop(); render(); hash(); }
    else if (Math.floor(FIELD.tf) !== S.i) { S.i = Math.floor(FIELD.tf); render(); hash(); }
  } else {
    var d = FIELD.target - FIELD.tf;
    FIELD.tf = Math.abs(d) < 0.01 ? FIELD.target : FIELD.tf + d * Math.min(1, dt * 7);
  }
  var w = window.innerWidth, h = window.innerHeight;
  if (FIELD.dirty) { buildCrests(); FIELD.dirty = false; }
  /* crests: short strokes across the mean direction; brighter and heavier with Hs; drifting with the waves */
  var c = fit(crestCv); c.clearRect(0, 0, w, h);
  var sp = FIELD.sp, t = reduced ? 0 : now / 1000, ink = COL['--ink'];
  c.lineCap = 'round'; c.strokeStyle = ink;
  FIELD.crests.forEach(function (q) {
    var s = sampleAt(q.lon, q.lat, FIELD.tf);
    if (!s || s.land || s.hs <= 0.05) return;
    var n = Math.hypot(s.tx, s.ty) || 1, dx = s.tx / n, dy = -s.ty / n;
    var ph = reduced ? 0 : (((t * 7 + q.seed * sp) % sp) + sp) % sp - sp / 2;
    var fade = reduced ? 1 : 1 - Math.abs(ph) / (sp / 2);
    var hs = Math.min(s.hs, 6), L = 6 + hs * 3;
    var x = q.x + dx * ph, y = q.y + dy * ph, px = -dy, py = dx;
    c.globalAlpha = (0.16 + 0.62 * Math.min(1, hs / 4)) * fade * s.fade;
    c.lineWidth = 0.8 + hs * 0.22;
    c.beginPath(); c.moveTo(x - px * L / 2, y - py * L / 2); c.quadraticCurveTo(x + dx * L * 0.3, y + dy * L * 0.3, x + px * L / 2, y + py * L / 2); c.stroke();
  });
  c.globalAlpha = 1;
  /* wind: streak particles advected along (u, v), projected through the map each frame */
  var wc = fit(windCv);
  if (FIELD.clear) { wc.clearRect(0, 0, w, h); FIELD.clear = false; FIELD.parts.forEach(function (p) { if (p.lon === null || p.lon === undefined) return; var q = map.project([p.lon, p.lat]); p.x = q.x; p.y = q.y; }); }
  if (reduced) return;
  wc.globalCompositeOperation = 'destination-out'; wc.fillStyle = 'rgba(0,0,0,0.16)'; wc.fillRect(0, 0, w, h); wc.globalCompositeOperation = 'source-over';
  var want = Math.round(Math.min(phone.matches ? 220 : 520, (w * h) / (phone.matches ? 1700 : 2400)));
  while (FIELD.parts.length < want) { var np = {}; spawn(np); FIELD.parts.push(np); }
  if (FIELD.parts.length > want) FIELD.parts.length = want;
  if (FIELD.moving) return;
  var ppd = 512 * Math.pow(2, map.getZoom()) / 360, k = 0.09 / ppd, col = COL['--ink-3'];
  wc.lineWidth = 1; wc.lineCap = 'round'; wc.strokeStyle = col;
  FIELD.parts.forEach(function (p) {
    if (p.lon === null || p.lon === undefined || !(p.age <= p.max)) { spawn(p); return; }
    var s = sampleAt(p.lon, p.lat, FIELD.tf);
    if (!s) { p.age = 1e9; return; }
    var sp2 = Math.hypot(s.u, s.v);
    p.lon += s.u * k / Math.cos(p.lat * Math.PI / 180) * 60 * dt; p.lat += s.v * k * 60 * dt;
    var q = map.project([p.lon, p.lat]);
    wc.globalAlpha = Math.min(0.5, 0.06 + sp2 / 40) * s.fade;
    wc.beginPath(); wc.moveTo(p.x, p.y); wc.lineTo(q.x, q.y); wc.stroke();
    p.x = q.x; p.y = q.y; p.age++;
    if (s.land) p.age = 1e9;
  });
  wc.globalAlpha = 1;
}
function resize() { FIELD.dirty = true; FIELD.clear = true; if (MAP.map) MAP.map.resize(); pad(); drawMarks(); }
window.addEventListener('resize', resize);

/* ================================================================ loading */
var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
function fetchFirst(urls, kind) {
  var i = 0;
  return new Promise(function (res, rej) {
    (function next() {
      if (i >= urls.length) { rej(new Error('nenhuma fonte respondeu')); return; }
      var u = urls[i++];
      fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return kind === 'json' ? r.json() : r.arrayBuffer(); }).then(res, next);
    })();
  });
}
function script(src, name) {
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = src; s.onload = function () { if (window[name]) res(window[name]); else rej(new Error('vazio')); };
    s.onerror = function () { rej(new Error('sem ' + src)); }; document.body.appendChild(s);
  });
}
function order(list) { return local ? list.slice().reverse() : list; }
function loadToday() {
  var early = window.JANELA_EARLY && window.JANELA_EARLY.today;
  var rest = function () { return fetchFirst(order(CFG.data.today), 'json').catch(function () { return script(CFG.data.todayJs, 'JANELA_TODAY'); }); };
  return early ? early.catch(rest) : rest();
}
function loadField() {
  return fetchFirst(order(CFG.data.field), 'bin').catch(function () {
    return script(CFG.data.fieldJs, 'JANELA_FIELD').then(function (b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var k = 0; k < s.length; k++) u[k] = s.charCodeAt(k); return u.buffer; });
  });
}
function start(today) {
  T = today;
  AX = T.t; LEAD = T.lead;
  Object.keys(T.places).forEach(function (id) { STEPS[id] = T.places[id].steps.map(function (x, k) { return Object.assign({ t: AX[k], lead: LEAD[k] }, x); }); });
  VIS = CFG.places.filter(function (p) { return !p.hidden && STEPS[p.id]; });
  var now = Date.now();
  iNow = 0; while (iNow < AX.length - 1 && Date.parse(AX[iNow] + ':00:00Z') < now) iNow++;
  var stale = Date.parse(AX[AX.length - 1] + ':00:00Z') < now;
  if (stale) iNow = 0;
  /* the day's codes are served only when this page's model and modules made them */
  PUBOK = T.model === CFG.model && Object.keys(MODS.pins).every(function (k) { return !T.modules || T.modules[MODS.pins[k].rel] === MODS.pins[k].sha; });
  /* the next run is read ~34 h after this one's 00 UTC (09:40 UTC the next day, a retry at 11:40): past 36 h, today's did not come */
  var ageH = (now - Date.parse(T.run + ':00:00Z')) / 3600e3;
  buildClock();
  var kv = readHash();
  S.i = iNow; if (kv.t) { var k = AX.indexOf(kv.t); if (k >= 0) S.i = k; }
  /* a shared link names the run it was decided on: a newer run is said, never silently swapped in */
  if (kv.rodada && kv.rodada !== T.run) status('este link foi feito sobre a rodada ' + kv.rodada.slice(8, 10) + '/' + kv.rodada.slice(5, 7) + ' ' + kv.rodada.slice(11, 13) + ' UTC; você vê a de agora, ' + T.run.slice(8, 10) + '/' + T.run.slice(5, 7) + ' ' + T.run.slice(11, 13) + ' UTC');
  FIELD.target = S.i; FIELD.tf = S.i;
  var run = T.run.slice(8, 10) + '/' + T.run.slice(5, 7) + ' ' + T.run.slice(11, 13) + ' UTC', made = T.madeAt.slice(8, 10) + '/' + T.madeAt.slice(5, 7) + ' ' + T.madeAt.slice(11, 16) + ' UTC';
  $('jn-run').innerHTML = 'ECMWF <b>' + esc(run) + '</b> · lida ' + esc(made);
  var lb = $('jn-load'); if (lb) lb.textContent = '';
  if (stale) status('previsão antiga: a rodada ' + run + ' já passou; a de hoje ainda não chegou');
  var late = $('jn-late');
  if (late && ageH > 36) {
    late.hidden = false;
    late.innerHTML = '<b>Previsão de ' + esc(run) + ', de ' + Math.floor(ageH / 24) + ' dia' + (ageH >= 48 ? 's' : '') + ' atrás.</b> A rodada de hoje não chegou (a coleta diária falhou ou atrasou). As janelas abaixo são decididas sobre a previsão mais velha, com a faixa medida para o prazo dela: confira antes de decidir.';
    $('jn-run').classList.add('late');
  }
  tieField();
  setMode(S.mode);
  render();
  if (phone.matches) setSheet('peek'); else pad();
  setTimeout(recheck, 600);
}
/* the map field is the day's own run, or it is not drawn: the run in its header and its sha256 against today.json */
function tieField() {
  if (!T || !FIELD.F || FIELD.tied !== undefined) return;
  var want = T.run.slice(0, 10).replace(/-/g, '') + T.run.slice(11, 13);
  var runOk = String(FIELD.F.run).slice(0, 8) === want.slice(0, 8);
  var pin = T.inputs && T.inputs['field.bin'];
  FIELD.tied = runOk;
  if (!runOk) { FIELD.F = null; FIELD.dirty = true; status('o campo do mapa é de outra rodada (' + FIELD.run0 + '); não desenhado — as decisões não dependem dele'); return; }
  if (pin && window.crypto && crypto.subtle && FIELD.buf) {
    crypto.subtle.digest('SHA-256', FIELD.buf).then(function (d) {
      var hex = Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      if (hex !== pin) { FIELD.F = null; FIELD.dirty = true; status('o campo do mapa não é o que os dados de hoje pinam (sha256); não desenhado'); }
    }, function () { /* no digest here: the run check stands */ });
  }
}
function fail(e) {
  $('jn-answer').innerHTML = '<p class="jn-ans">Os dados de hoje não chegaram.</p><p class="jn-sub">' + esc(e && e.message || '') + ' · o Mês funciona sem eles; o método e o último registro estão em <a href="/janela/metodo/">/janela/metodo/</a></p>';
  status('sem os dados de hoje'); setMode(S.mode === 'semana' ? 'mes' : S.mode);
  $('jn-check').textContent = 'Os módulos de decisão estão nesta página; sem os dados do dia, não há decisões publicadas para refazer.';
}

/* ================================================================ the re-check: every published decision, decided again here */
function sha256hex(str) {
  /* a plain SHA-256, for pages opened where crypto.subtle is not offered (file://) */
  var b = new TextEncoder().encode(str), K = [], H = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
  for (var n = 2, cnt = 0; cnt < 64; n++) { var pr = true; for (var d = 2; d * d <= n; d++) if (n % d === 0) { pr = false; break; } if (pr) { K.push((Math.pow(n, 1 / 3) % 1) * 4294967296 | 0); cnt++; } }
  var l = b.length, padL = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(padL); m.set(b); m[l] = 0x80;
  var bits = l * 8; for (var q = 0; q < 8; q++) m[padL - 1 - q] = (bits / Math.pow(2, 8 * q)) & 255;
  var w = new Int32Array(64);
  for (var o = 0; o < padL; o += 64) {
    for (var t = 0; t < 16; t++) w[t] = (m[o + 4 * t] << 24) | (m[o + 4 * t + 1] << 16) | (m[o + 4 * t + 2] << 8) | m[o + 4 * t + 3];
    for (t = 16; t < 64; t++) { var x = w[t - 15], y = w[t - 2]; w[t] = (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + w[t - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)) + w[t - 16] | 0; }
    var a = H[0], bb = H[1], c = H[2], dd = H[3], e = H[4], f = H[5], g2 = H[6], hh = H[7];
    for (t = 0; t < 64; t++) {
      var t1 = hh + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g2)) + K[t] + w[t] | 0;
      var t2 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & bb) ^ (a & c) ^ (bb & c)) | 0;
      hh = g2; g2 = f; f = e; e = dd + t1 | 0; dd = c; c = bb; bb = a; a = t1 + t2 | 0;
    }
    H[0] = H[0] + a | 0; H[1] = H[1] + bb | 0; H[2] = H[2] + c | 0; H[3] = H[3] + dd | 0; H[4] = H[4] + e | 0; H[5] = H[5] + f | 0; H[6] = H[6] + g2 | 0; H[7] = H[7] + hh | 0;
  }
  return H.map(function (v) { return ('00000000' + (v >>> 0).toString(16)).slice(-8); }).join('');
}
function recheck() {
  var out = $('jn-check');
  if (!PUBOK) { out.textContent = 'Os dados de hoje foram feitos por outra versão do app (modelo ' + T.model.slice(0, 8) + (T.model === CFG.model ? ', módulos diferentes' : ' ≠ ' + CFG.model.slice(0, 8)) + '): o mapa, a lista e o card decidem aqui, com os módulos desta página, sobre a previsão publicada — não leem as decisões publicadas. A conferência volta quando os dois se encontrarem.'; return; }
  out.textContent = 'Refazendo no seu navegador as decisões publicadas…';
  var presets = T.presets.map(function (o) { return Object.assign({}, preset(o.id), o); });
  var idx = 0, lines = [], n = 0, same = 0, t0 = performance.now(), places = CFG.places;
  (function step() {
    var until = performance.now() + 30;
    while (idx < places.length && performance.now() < until) {
      var p = places[idx++];
      if (!STEPS[p.id]) continue;
      var r = C.place(p, STEPS[p.id], ctxOf(p), presets, CFG.npcp, CFG.crits);
      Object.keys(r.row).forEach(function (k) { if (T.dec[p.id] && T.dec[p.id][k] === r.row[k]) same += r.row[k].length; });
      n += r.n; for (var j = 0; j < r.lines.length; j++) lines.push(r.lines[j]);
    }
    if (idx < places.length) { setTimeout(step, 0); return; }
    var ms = performance.now() - t0, digest = sha256hex(lines.join('\n'));
    var modOk = 0, modN = 0, modBad = [];
    Object.keys(MODS.pins).forEach(function (k) { modN++; var h = sha256hex(MODS.src[k]), rel = MODS.pins[k].rel; if (h === MODS.pins[k].sha && (!T.modules || T.modules[rel] === h)) modOk++; else modBad.push(rel); });
    var okAll = same === n && n === T.decisions && digest === T.digest;
    out.textContent = (okAll ? 'Refeito agora no seu navegador, em ' + dec(ms / 1000, 1) + ' s: as ' + grp(n) + ' decisões publicadas, iguais ao registro — veredito, testemunha e limiar (sha256 ' + digest.slice(0, 12) + '…).'
      : 'ATENÇÃO: refeitas aqui, ' + grp(n - same) + ' de ' + grp(n) + ' decisões diferem do registro' + (digest !== T.digest ? ' (o digest também)' : '') + '.')
      + ' ' + (modOk === modN ? 'Os ' + modN + ' módulos que decidem nesta página têm o sha256 pinado e são os que fizeram os dados de hoje.' : 'Módulos com sha256 diferente: ' + modBad.join(', ') + '.');
    window.__janela.check = { n: n, same: same, digest: digest, ok: okAll, mods: modOk + '/' + modN, ms: ms };
    if (S.site) drawCard();                                /* the card's certificate shows the result */
    var rc = $('jn-run'); if (rc && okAll && !rc.querySelector('.jn-ok')) rc.insertAdjacentHTML('beforeend', ' · <span class="jn-ok">conferido' + (T.second && T.second.equal === T.second.decisions ? ' 2×' : '') + '</span>');
  })();
}

/* ================================================================ THE CERTIFICATE
   What makes a verdict here different from a forecast elsewhere, on the card in four lines: the arithmetic re-done
   in this tab, the second verifier that shares no code with the first, the band's own record on the scoreboard,
   and the file with every number a surveyor needs to re-check this one decision by hand. */
function domainState(d) {
  var L = T.ledger && T.ledger.proposers, x = null;
  for (var k = 0; L && k < L.length; k++) if (L[k].domain === d) x = L[k];
  /* a proposer pinned but not yet on the ledger: its first rows come with the next daily run */
  if (!x) return { name: (CFG.proposerNames && CFG.proposerNames[d]) || d, claim: '9/10', st: 'entra no placar com a próxima rodada (nenhuma faixa registrada ainda)', cut: false };
  var claim = x.claim || '9/10', first = (T.ledger && T.ledger.firstLook) || 30;
  var st = x.status === 'DEADMITTED' ? 'PODADA' : x.pending !== false ? 'em avaliação, ' + (x.trials || 0) + ' de ' + first + ' dias' : 'admitida, ' + x.trialsCovered + ' de ' + x.trials + ' dias cobertos';
  return { name: x.name || d, claim: claim, st: st, cut: x.status === 'DEADMITTED' };
}
/* the band's proposer at a place, and — where the chosen step decides on the union (providers-v1) — the second provider's */
function proposerState(p) {
  if (!p.proposer) return null;
  var r = domainState(p.proposer), s = STEPS[p.id] && STEPS[p.id][S.i];
  if (p.proposer2 && s && s.hp === 'en') { r.second = domainState(p.proposer2); if (p.union) r.union = domainState(p.union); }
  return r;
}
function certBlock(p) {
  var ck = window.__janela.check, sec = T.second, ps = proposerState(p);
  var line = function (ok, txt) { return '<li class="' + (ok === true ? 'ok' : ok === false ? 'no' : 'na') + '"><i aria-hidden="true"></i><span>' + txt + '</span></li>'; };
  return '<div class="jn-cert"><div class="jn-k">certificado desta decisão</div><ul class="jn-certl">'
    + line(ck ? ck.ok : null, ck ? (ck.ok ? 'Refeita no seu navegador: as ' + grp(ck.n) + ' decisões do dia, iguais ao registro.' : 'Refeita no seu navegador: ' + grp(ck.n - ck.same) + ' decisões DIFEREM do registro.') : 'Refazendo no seu navegador…')
    + line(sec ? sec.equal === sec.decisions : null, sec ? 'Segundo verificador, escrito sem ler o primeiro (Python, nenhum código em comum): ' + grp(sec.equal) + ' de ' + grp(sec.decisions) + ' iguais.' : 'Segundo verificador: não rodou para estes dados.')
    + line(ps ? !ps.cut : null, ps ? 'A faixa é uma reivindicação (' + esc(ps.name) + ', cobre ' + esc(ps.claim) + '), conferida em público contra satélite: ' + esc(ps.st) + '.' : 'Sem faixa medida aqui: só a Tabela 4-1 decide.')
    + (ps && ps.second ? line(!ps.second.cut, 'Com a segunda faixa (' + esc(ps.second.name) + ', cobre ' + esc(ps.second.claim) + '), ' + esc(ps.second.st) + ': decide-se a união das duas, que cobre sempre que uma cobre.') : '')
    + (ps && ps.union ? line(!ps.union.cut, 'A união, a faixa que decide, também é conferida como ela mesma (cobre ≥ 9/10; medida 0,965 em 15 meses que não viu, e as LIBERADA dela romperam menos da metade das vezes): ' + esc(ps.union.st) + '.') : '')
    + line(true, 'Contas exatas, em racionais: nenhum arredondamento decide; a faixa publicada é arredondada para fora.')
    + '</ul><div class="jn-certb"><button type="button" class="jn-btn" id="jn-nota-b">Nota de decisão ↓</button><button type="button" class="jn-btn" id="jn-cert-b">Certificado .json ↓</button></div></div>';
}
function certDownload(p) {
  var cur = current(), op = cur.op, st = STEPS[p.id], r = full(p.id, S.i), sp = C.span(st, S.i, op.TR) || [S.i];
  var dnv = S.crit !== 'band';
  var steps = sp.map(function (k) { var s = st[k]; return { t: AX[k] + ':00Z', lead: LEAD[k], hs: dnv ? s.hd || null : s.hb || null, vento_kn: dnv ? s.wd || null : s.wb || null }; });
  var P = preset(S.op), ps = proposerState(p);
  var cert = {
    certificado: 'Janela — uma decisão, com tudo o que é preciso para refazê-la à mão',
    local: { id: p.id, nome: p.full || p.name, tipo: p.type || p.kind, no_do_modelo: T.places[p.id] && T.places[p.id].node },
    operacao: { id: op.id, nome: cur.name, janela_h: C.trOf(op.TR), limites: op.limits, fonte: op.npcp ? { ato: op.source.act, pagina: op.page, sha256: op.source.sha256 } : op.own ? 'digitado por quem opera' : P && P.kind === 'cited' ? P.source : 'exemplo, não regra publicada' },
    criterio: { band: 'faixa medida (previsão × erro medido contra satélite)', table: 'DNV-OS-H101 Tabela 4-1 (OPWF = α × OPLIM)', site: 'α do local (estimado; limite inferior do intervalo de 90%)' }[S.crit],
    inicio: AX[S.i] + ':00Z', passos: steps,
    limites_decididos: dnv && r && r.opwf ? r.opwf : op.limits, alfa: r && r.alpha ? r.alpha : null,
    veredito: r === null ? 'ALÉM DA PREVISÃO' : r.verdict === 'n/a' ? 'NÃO SE APLICA' : r.verdict,
    por_que: r && r.verdict !== 'n/a' ? explain(p, r, op, S.crit) : r ? r.why : null,
    testemunha: r && r.witness || null, limiar: r && r.flip || null, sem_previsao: r && r.notForecast || [],
    regra_de_decisao: 'LIBERADA: todo limite vale na borda desfavorável da faixa em todos os passos; VETADA: algum limite falha já na borda favorável; INDEFINIDA: a faixa atravessa o limite; SEM DADOS: a regra limita algo sem previsão aqui',
    faixa: ps ? { proponente: ps.name, reivindicacao: ps.claim, placar: ps.st,
      segunda: ps.second ? { proponente: ps.second.name, reivindicacao: ps.second.claim, placar: ps.second.st, regra: 'decide-se a união das duas faixas (providers-v1)' } : null,
      uniao: ps.union ? { proponente: ps.union.name, reivindicacao: ps.union.claim, placar: ps.union.st, medida: 'certs/janela-providers-eval.json (providers-eval-v1)' } : null } : null,
    segundo_provedor: T.noaa ? { fonte: 'NOAA WAVEWATCH III (GEFS-Wave, ' + T.noaa.band + ')', reivindicacao: T.noaa.claim, rodada: T.noaa.run + ':00Z', registro: T.noaa.file, sha256: T.noaa.sha,
      papel: 'mostrado ao lado, nunca decidido (providers-v1, certs/janela-ledger/DEFINITIONS.json); avaliado no placar contra os mesmos satélites' } : null,
    rodada_ecmwf: T.run + ':00Z', lida: T.madeAt, codigo: T.git || null, digest_do_dia: T.digest, modulos: T.modules, registros: T.inputs,
    conferencia: { navegador: window.__janela.check || null, segundo_verificador: T.second || null },
    refazer: ['git clone https://github.com/carlostoledo1891/cert-machine', 'git checkout ' + (T.git ? T.git.replace(/\+dirty$/, '') : '<commit>'),
      'python apps/janela/audit/field.py ' + T.run.slice(0, 10), 'python apps/janela/audit/noaa.py --units ' + T.run.slice(0, 10), 'node apps/janela/build-today.js --feed ' + T.run.slice(0, 10).replace(/-/g, '') + '   (digest ' + T.digest + ')',
      'python3 instruments/window/verify/verify_day.py site/janela/data/today.json'],
    aviso: 'Não é aprovação de operação: é evidência que um vistoriador refaz. O α do local é uma estimativa; as decisões são exatas sobre a faixa publicada.'
  };
  var blob = new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'janela-' + p.id + '-' + op.id + '-' + S.crit + '-' + AX[S.i].replace(/[-T:]/g, '') + '.json';
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

/* ================================================================ NOTA DE DECISÃO */
function nota() {
  var p = PL[S.site];
  if (!T || !p || !STEPS[p.id]) { select(S.site || 'santos'); p = PL[S.site]; if (!p) return; }
  var cur = current(), op = cur.op, st = STEPS[p.id], r = full(p.id, S.i), sp = C.span(st, S.i, op.TR) || [S.i];
  var end = addH(AX[S.i], C.trOf(op.TR)), v = vcode(r);
  var P = preset(S.op);
  var src = op.npcp ? (op.source.title + '. ' + op.source.act + ', ' + op.page + (op.quote ? ' — “' + op.quote + '”' : '') + ' — sha256 ' + op.source.sha256)
    : op.own ? 'o procedimento de quem opera, digitado nesta aba' : P && P.kind === 'cited' ? P.source + ' — ' + P.sourceUrl : 'exemplo (não é regra publicada)';
  var bandCell = function (b) { return b ? dc(b[0]) + ' – ' + dc(b[1]) : '—'; };
  var rows = sp.map(function (k) { var s = st[k]; return '<tr><td>' + esc(wtxt(AX[k], true)) + '</td><td>' + esc(utc(AX[k])) + '</td><td>+' + LEAD[k] + '</td><td>' + bandCell(s.hd) + '</td><td>' + bandCell(s.hb) + '</td><td>' + bandCell(s.wd) + '</td><td>' + bandCell(s.wb) + '</td><td>' + (s.tp ? dc(s.tp) : '—') + '</td><td>' + (s.mwd !== undefined ? s.mwd + '°' : '—') + '</td></tr>'; }).join('');
  var mods = Object.keys(MODS.pins).map(function (k) { return '<tr><td>' + esc(MODS.pins[k].rel) + '</td><td class="mono">' + esc(MODS.pins[k].sha) + '</td></tr>'; }).join('');
  var recs = Object.keys(T.inputs || {}).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="mono">' + esc(T.inputs[k]) + '</td></tr>'; }).join('');
  var ck = window.__janela.check;
  $('jn-nota').innerHTML = '<h1>Nota de decisão — Janela</h1>'
    + '<p><b>' + esc(cur.name) + '</b> · ' + esc(p.kind === 'uep' ? p.name + ' (' + (p.full || '') + ', ' + (p.type || '') + ')' : p.name) + ' · critério: ' + esc(CNAME[S.crit]) + '</p>'
    + '<p>Janela: começar ' + esc(wtxt(AX[S.i], true)) + ' (' + esc(utc(AX[S.i])) + '), ' + C.trOf(op.TR) + ' h, até ' + esc(wtxt(end, true)) + ' · horário de Brasília (UTC−3)</p>'
    + '<p>Veredito: <span class="v">' + esc(WORD[v]) + '</span></p><p>' + esc(explain(p, r, op, S.crit)) + '</p>'
    + (r && r.alpha ? '<p>α ' + esc(q2(r.alpha.hs, 4)) + (r.alpha.wind ? ' (vento α ' + esc(q2(r.alpha.wind, 2)) + ', Tabela 4-6)' : '') + ', TPOP ' + r.alpha.TPOP + ' h; OPWF ' + esc(r.opwf.map(function (l) { return VAR[l.var] + ' ' + OPW[l.op] + ' ' + q2(l.value, 3) + ' ' + UNIT[l.unit]; }).join(', ')) + '</p>' : '')
    + '<h2>Limites e fonte</h2><p>' + esc(op.limits.map(limText).join(' · ')) + '</p><p>' + esc(src) + '</p>'
    + (P && P.notDecided && S.op === 'alivio' ? '<p>Conferido por quem opera, não decidido aqui: ' + esc(P.notDecided.join('; ')) + '.</p>' : '')
    + '<h2>Previsão</h2><p>ECMWF open data, rodada ' + esc(T.run) + ' UTC, lida ' + esc(T.madeAt) + '; nó ' + esc(T.places[p.id].node.join(', ')) + (p.bandFrom ? '; faixa medida e α de ' + esc(PL[p.bandFrom].name) : '') + '. Faixas arredondadas para fora (Hs 0,001 m; vento 0,01 nó).'
      + (T.noaa ? ' Ensemble da NOAA (WAVEWATCH III, 25 centrais de 31), mesma rodada: mostrado ao lado, nunca decidido.' : '') + '</p>'
    + '<table><thead><tr><th>início (BRT)</th><th>UTC</th><th>prazo h</th><th>Hs det. (m)</th><th>Hs faixa (m)</th><th>vento det. (nós)</th><th>vento faixa (nós)</th><th>Tp (s)</th><th>de</th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<h2>Módulos que decidiram (sha256)</h2><table><tbody>' + mods + '</tbody></table>'
    + '<h2>Registros usados (sha256)</h2><table><tbody>' + recs + '</tbody></table>'
    + '<p>Conferência nesta aba: ' + esc(ck ? (ck.ok ? ck.n + ' decisões publicadas refeitas, iguais; módulos ' + ck.mods : 'DIFERENÇAS: ' + (ck.n - ck.same) + ' de ' + ck.n) : 'em andamento') + '. Digest publicado ' + esc(T.digest) + '.</p>'
    + '<h2>Refazer</h2><p class="mono">git clone https://github.com/carlostoledo1891/cert-machine · git checkout ' + esc(T.git ? T.git.replace(/\+dirty$/, '') : '(commit não registrado neste dia)') + ' · python apps/janela/audit/field.py ' + esc(T.run.slice(0, 10)) + ' · python apps/janela/audit/noaa.py --units ' + esc(T.run.slice(0, 10)) + ' · node apps/janela/build-today.js --feed ' + esc(T.run.slice(0, 10).replace(/-/g, '')) + '</p>'
    + '<p>O build-today refaz as baterias, lê a mesma rodada do ECMWF (o arquivo aberto é imutável) e imprime o digest de todas as decisões do dia: tem de ser ' + esc(T.digest) + '.' + (T.git && /\+dirty$/.test(T.git) ? ' Atenção: estes dados foram feitos de uma árvore com alterações não registradas.' : '') + '</p>'
    + '<p>Não é aprovação de operação: garantia marítima e sociedades classificadoras são donas dessa palavra. É evidência que um vistoriador refaz. O α do local é uma estimativa; as decisões são exatas sobre a faixa publicada. Impresso ' + esc(new Date().toISOString().slice(0, 16).replace('T', ' ')) + ' UTC.</p>';
  $('jn-nota').setAttribute('aria-hidden', 'false');
  window.print();
}

/* ================================================================ go */
window.__janela = { S: S, render: render, select: select, setMode: setMode, setSheet: setSheet, setI: setI, nota: nota, field: function () { return FIELD; }, map: function () { return MAP.map; }, check: null, codes: codes };
readHash();
initMap();
loadToday().then(start, fail);
loadField().then(function (buf) {
  try { FIELD.F = parseField(buf); FIELD.buf = buf; FIELD.run0 = String(FIELD.F.run); tieField(); requestAnimationFrame(frame); }
  catch (e) { status('o campo de ondas e vento não abriu; as decisões não dependem dele'); }
}, function () { status('sem o campo de ondas e vento desta rodada; as decisões não dependem dele'); setTimeout(function () { status(''); }, 6000); });
})();
