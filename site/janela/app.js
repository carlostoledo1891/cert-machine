/* client.js — Janela, the app (English since 2026-10-30). Served as /janela/app.js.
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
   stay in this browser's localStorage, never anywhere else; so does whether the
   intro (what this is, and the doors of uses.js) is folded.            MIT */
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
/* WARRANT (design/WARRANT.md, v2.1): the grammar's renderer and its closed dash set, shipped beside the deciding modules
   (not one of them: no pin). A forecast line is COMPUTED and dashed; the measured band is a decided extent, solid; a
   band the satellites have not validated where it is drawn (the wind band anywhere, the Hs band carried to a unit or a
   terminal) keeps its edges, on which the decision is made, and gains a halo: its error there has no edge to draw. A
   held-out statistic and a forecast value in text are computed (underlined dashed); a count over the site alpha's
   lower bound is chosen (dotted). Every verdict names the premises it rests on, each graded from its record (restsOn). */
var W = req('warrant.js'), PR = CFG.premises || null;
var cv = function (t, title) { return W.value(t, W.COMPUTED, { title: title || 'computed: a forecast or a statistic in floating point; nothing decided it' }); };
var chv = function (t) { return W.value(t, W.CHOSEN, { title: 'chosen: counted exactly over the site α at the lower end of its 90% interval, one member of the interval, chosen for caution' }); };
var ext = function (s, cls, w) { return W.extentAttrs(s, { width: w }).replace(/class="([^"]+)"/, 'class="$1 ' + cls + '"').replace(' fill="none"', ''); };
/* the campaign planner's engine (instruments/window/campaign.js): planning, not deciding — kept out of the pinned deciding modules */
if (CFG.plan && CFG.plan.src) MODS.src['campaign.js'] = CFG.plan.src;

/* ================================================================ words */
var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/* the verdict words in English (instruments/window/decide.js `en`); the records keep their own (VCODE below reads them) */
var WORD = { L: 'CLEARED', V: 'BLOCKED', I: 'UNDECIDED', S: 'NEEDS DATA', R: 'REFUSED', n: 'DOES NOT APPLY', '-': 'BEYOND THE FORECAST' };
var CNAME = { band: 'Measured band', table: 'DNV Table 4-1', site: 'DNV site α' };
var CSHORT = { band: 'measured band', table: 'DNV 4-1', site: 'site α' };
var VAR = { hs: 'Hs', wind_sustained: 'wind', wind_gust: 'gust', current: 'current', visibility: 'visibility', tp: 'period', draft: 'draft', loa: 'length', beam: 'beam', speed: 'speed', dwt: 'deadweight' };
var UNIT = { m: 'm', kn: 'kn', NM: 'NM', s: 's' };
var OPW = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
var KIND = { field: 'production area · measured node', coast: 'coast · measured node', terminal: 'terminal · Harbour Master rule', platform: 'platform', uep: 'production unit' };
/* THE PORTUGUESE THE TAB STILL MEETS (build-app.js enWords): the shell ships the model's names and notes in English, but
   a reason criteria.js returns (siteWhy among them: it is inside the day's digest), ANP's unit types and the scoreboard
   of a published day arrive in Portuguese, and are put in English here, for display only */
var EN = CFG.en || { types: {}, why: [], proposers: {}, pairs: {}, leads: {} };
/* a reason handed over in Portuguese (model.js siteWhy, criteria.js): its English, or the words as they came */
function whyEn(s) { for (var k = 0; k < EN.why.length; k++) { var re = new RegExp(EN.why[k][0]); if (re.test(s)) return String(s).replace(re, EN.why[k][1]); } return s; }
/* ANP's field stages (geo.js keeps ANP's words) */
var STAGE = { 'Produção': 'production', 'Em Devolução': 'being relinquished', 'Desenvolvimento': 'development', 'Fase de Reabilitação': 'rehabilitation phase' };
function typeOf(p) { return p.type ? (EN.types[p.type] || p.type) : ''; }
/* a site added to sites.json is forecast and ledgered from day one, but "measured" only once the bands record carries it */
function kindOf(p) { return (p.kind === 'field' || p.kind === 'coast') && T && STEPS[p.id] && !STEPS[p.id].some(function (x) { return x.hb; }) ? (p.kind === 'field' ? 'production area' : 'coast') + ' · tracked, not yet measured' : KIND[p.kind] || p.kind; }
var dc = function (s) { return String(s); };
var grp = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
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
  return { dow: DOW[d.getUTCDay()], d: String(d.getUTCDate()), dm: MON[d.getUTCMonth()] + ' ' + d.getUTCDate(), h: p2(d.getUTCHours()) + ':00', key: d.toISOString().slice(0, 10), ms: d.getTime() + 3 * 3600e3 };
}
function addH(t, h) { return new Date(Date.parse(t + ':00:00Z') + h * 3600e3).toISOString().slice(0, 13); }
var dupDow = {};
function wtxt(t, full) {
  var w = when(t);
  return w.dow + (full || dupDow[w.dow] ? ' ' + w.dm : '') + ' ' + w.h;
}
function utc(t) { return t.slice(0, 10) + ' ' + t.slice(11, 13) + ':00 UTC'; }

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
    return { op: { id: 'seu-limite', name: 'Your limit', limits: o.limits, TR: o.TR, own: true }, pub: false, name: 'Your limit' };
  }
  var p = preset(S.op) || CFG.presets[0];
  if (!S.edit) return { op: p, pub: true, name: p.name };
  return { op: Object.assign({}, p, { limits: S.edit.limits || p.limits, TR: S.edit.TR !== undefined ? S.edit.TR : p.TR, edited: true }), pub: false, name: p.name + ' (edited)' };
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
  if (cur.op.npcp && cur.op.site !== id) return { verdict: 'n/a', why: 'this Harbour Master rule belongs to another terminal' };
  return C.decideWindow(cur.op, STEPS[id], i, cur.op.TR, crit || S.crit, ctxOf(PL[id]));
}
var VCODE = { 'LIBERADA': 'L', 'VETADA': 'V', 'INDEFINIDA': 'I', 'SEM DADOS': 'S', 'RECUSADA': 'R', 'n/a': 'n' };
function vcode(r) { return r === null ? '-' : VCODE[r.verdict] || 'S'; }

/* ================================================================ names */
function short(p) {
  if (p.kind === 'uep') return p.name;
  return String(p.name).replace(/^Equatorial Margin — /, '').replace(/ — .*$/, '').replace(/ \(.*\)$/, '').replace(/ (Basin|Bay)$/, '');
}
function fieldsOf(p) {
  var out = [], re = /([^,(]+?)\s*\(/g, m;
  while ((m = re.exec(p.serves || ''))) out.push(m[1].trim().toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }));
  return out;
}
function subOf(p) {
  if (p.kind === 'uep') { var f = fieldsOf(p); return typeOf(p) + (f.length ? ' · ' + f.slice(0, 2).join(', ') + (f.length > 2 ? ' +' + (f.length - 2) : '') : ''); }
  return kindOf(p);
}
function inName(p) { return p.kind === 'uep' ? 'at ' + short(p) : p.kind === 'field' ? 'in the ' + short(p) + ' Basin' : 'at ' + short(p); }

/* ================================================================ glyphs */
function g(c) { return '<i class="jn-g ' + (c === '-' ? 'x' : c) + '" aria-hidden="true"></i>'; }
function chip(c) { return '<span class="jn-w ' + (c === '-' ? 'x' : c) + '">' + g(c) + WORD[c] + '</span>'; }

/* ================================================================ the answer line */
function nextL(c, from) { var k = c.indexOf('L', from); if (k < 0) return null; var j = k; while (j + 1 < c.length && c[j + 1] === 'L') j++; return { k: k, j: j }; }
function windowEnd(j, TR) { return addH(AX[j], C.trOf(TR)); }
/* a place's next window from NOW, in words: the answer line and the card's head say the same sentence */
function unitLine(p, cur) {
  var c = codes(p.id), op = cur.op, TR = C.trOf(op.TR), n = nextL(c, iNow), h, sub = [];
  if (n) {
    var end = windowEnd(n.j, op.TR), dur = LEAD[n.j] - LEAD[n.k] + TR, open = c[n.j + 1] === '-' || n.j === c.length - 1;
    var sn = nextL(c, S.i), m = sn && sn.k === n.k ? margin(p) : null;
    h = '<span class="jn-dim">next window</span> ' + chip('L') + ' <span class="jn-t">' + esc(wtxt(AX[n.k])) + ' → ' + esc(wtxt(end)) + '</span> <span class="jn-dim">(' + dur + ' h' + (open ? ', to the end of the forecast' : '') + ')</span>';
    sub.push(n.j > n.k ? 'start between ' + wtxt(AX[n.k]) + ' and ' + wtxt(AX[n.j]) : 'start ' + wtxt(AX[n.k]));
    sub.push(TR ? TR + ' h operation' : 'condition at the hour');
    if (m) sub.push('margin ' + dc(m.gap) + ' ' + (m.var === 'hs' ? 'm' : 'kn'));
  } else {
    var ki = c.indexOf('I', iNow), kv = c.indexOf('V', iNow), ks = c.indexOf('S', iNow);
    if (ki >= 0) {
      var r = full(p.id, ki), f = r && r.flip && r.flip[0];
      h = '<span class="jn-dim">no CLEARED window in this forecast. The nearest:</span> ' + chip('I') + ' <span class="jn-t">' + esc(wtxt(AX[ki])) + '</span>'
        + (f ? ' <span class="jn-dim">— ' + esc(VAR[f.var]) + ' must ' + (/^</.test(f.limit) ? 'drop ' : 'rise ') + esc(dc(f.gapDec)) + ' ' + esc(UNIT[f.unit] || f.unit) + ' at the unfavourable edge</span>' : '');
    } else if (kv >= 0) {
      var rv = full(p.id, kv), w = rv && rv.witness;
      h = chip('V') + ' <span class="jn-dim">at every start of this forecast' + (w ? ' — the first witness: ' + esc(VAR[w.var]) + ' ' + esc(edgeWord(w)) + ' ' + esc(wtxt(w.t)) : '') + '</span>';
    } else if (ks >= 0) {
      var rs = full(p.id, ks);
      h = chip('S') + ' <span class="jn-dim">— ' + esc(missingShort(p, rs, cur.op)) + '</span>';
    } else if (c.indexOf('n') >= 0) {
      var rn = full(p.id, c.indexOf('n'));
      h = '<span class="jn-dim">' + esc(CNAME[S.crit]) + ' does not apply: ' + esc(rn ? whyEn(rn.why) : '') + '</span>';
    } else h = '<span class="jn-dim">no whole window fits in what is left of the forecast.</span>';
  }
  sub.push(CNAME[S.crit]);
  return { h: h, sub: sub };
}
function answer() {
  var el = $('jn-ansl'), cur = current();
  if (!T) return;
  if (!cur) { el.innerHTML = '<p class="jn-ans">Choose a terminal to see its Harbour Master rules.</p>'; return; }
  var p = PL[S.site];
  if (!p || !STEPS[p.id]) { fleetAnswer(el, cur); return; }
  var op = cur.op, name = op.own ? 'Your limit' : (op.npcp ? 'The Harbour Master rule' : (preset(S.op) || {}).name || cur.name);
  var u = unitLine(p, cur);
  el.innerHTML = '<p class="jn-ans"><b>' + esc(name) + ' ' + esc(inName(p)) + ':</b> ' + u.h + '</p><p class="jn-sub"><span>' + u.sub.join(' · ') + '</span><a href="#" class="jn-notal" id="jn-nota-a">decision note</a></p>';
  var a = $('jn-nota-a'); if (a) a.onclick = function (e) { e.preventDefault(); nota(); };
}
function edgeWord(w) { var up = /^</.test(w.limit); return (up ? 'at least ' : 'at most ') + q2(w.edge, 2) + ' ' + (w.var === 'hs' ? 'm' : 'kn'); }
function fleetAnswer(el, cur) {
  var cnt = { L: 0, I: 0, V: 0, S: 0 }, tot = 0, out = 0, yes = [], no = [];
  /* the same set the list shows (its "All / Units / Basins and terminals" filter), so the two counts always agree */
  VIS.forEach(function (p) {
    if (!applies(cur.op, p)) { out++; return; }
    if ((S.kind === 'uep' && p.kind !== 'uep') || (S.kind === 'own' && p.kind === 'uep')) return;
    var c = codes(p.id); if (!c) return;
    var v = c[S.i]; if (v === '-' || v === 'n') return;
    if (v === 'R') v = 'S';
    tot++; cnt[v]++; (v === 'L' ? yes : no).push(p);
  });
  var TR = C.trOf(cur.op.TR);
  var noun = S.kind === 'own' ? ' basins and terminals' : S.kind === 'uep' ? (S.op === 'alivio' ? ' units with storage' : ' units') : ' places';
  var h = '<p class="jn-ans"><span class="jn-big">' + cnt.L + '</span> <span class="jn-dim">of ' + tot + noun + '</span> ' + chip('L') + '</p>'
    + '<p class="jn-sub"><span>' + esc(cur.name) + ' starting <b>' + esc(wtxt(AX[S.i])) + '</b>' + (TR ? ', a ' + TR + ' h window' : '') + ' · ' + esc(CSHORT[S.crit]) + '</span></p>'
    + '<p class="jn-mix">' + ['L', 'I', 'V', 'S'].map(function (k) { return '<span class="' + (cnt[k] ? '' : 'z') + '">' + g(k) + '<b>' + cnt[k] + '</b> ' + WORD[k] + '</span>'; }).join('') + '</p>';
  /* the minority, by name: on a calm day the few that cannot go, on a rough day the few that can */
  var few = !tot ? null : no.length && no.length <= yes.length ? { t: 'Out of the window', l: no } : yes.length && yes.length < no.length ? { t: 'In the window', l: yes } : null;
  if (few) {
    few.l.sort(function (a, b) { return (a.kind === 'uep') - (b.kind === 'uep') || short(a).localeCompare(short(b)); });
    h += '<p class="jn-few"><span>' + few.t + ' (' + few.l.length + '):</span> ' + few.l.slice(0, 5).map(function (p) {
      var c = codes(p.id); return '<button type="button" class="jn-linkb" data-site="' + esc(p.id) + '">' + g(c[S.i] === 'R' ? 'S' : c[S.i]) + esc(short(p)) + '</button>'; }).join(' ')
      + (few.l.length > 5 ? ' <span class="jn-dim">and ' + (few.l.length - 5) + ' more in the list</span>' : '') + '</p>';
  } else if (tot && cnt.L === tot) h += '<p class="jn-few"><span>All in the window at this hour.</span></p>';
  h += '<p class="jn-fine">' + (out ? esc(cur.op.appliesTo.why) + ': ' + out + ' units left out of this count. ' : '') + 'Tap a place, on the map or in the list, for its next window.</p>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-site]'), function (b) { b.onclick = function () { stop(); select(b.getAttribute('data-site')); }; });
}
function missingShort(p, r, op) {
  if (!r) return '';
  if (r.verdict === 'n/a') return whyEn(r.why);
  var nf = r.notForecast || [];
  if (nf.indexOf('hs') >= 0 && op.hsAt === 'berth') return 'the wave at the berth is not decided: the model node is the approach';
  if ((nf.indexOf('hs') >= 0 || nf.indexOf('wind_sustained') >= 0) && p.kind === 'uep' && !p.bandFrom) return 'a region not yet measured: no measured site within 350 km';
  var names = nf.map(function (v) { return VAR[v] || v; });
  if (nf.indexOf('current') >= 0 || nf.indexOf('visibility') >= 0) return names.join(' and ') + ': nobody forecasts it here';
  if (nf.indexOf('wind_gust') >= 0) return 'gust: forecast, but with no measured error, hence no band';
  return names.join(' and ') + ': no measured band at this lead';
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
  $('jn-lead').textContent = '+' + LEAD[S.i] + ' h'; $('jn-lead').title = 'forecast ' + LEAD[S.i] + ' h after the run'; $('jn-when').title = utc(t);
  $('jn-clockt').textContent = w.dow + ' ' + w.dm + ' ' + w.h;
  $('jn-clockl').textContent = 'forecast +' + LEAD[S.i] + ' h';
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
var OPS = CFG.presets.map(function (p) { return { id: p.id, label: p.name }; }).concat([{ id: 'npcp', label: 'Terminal' }, { id: 'own', label: 'Your limit' }]);
function drawOps() {
  $('jn-ops').innerHTML = OPS.map(function (o) {
    return '<button type="button" class="jn-chip-b" role="radio" data-op="' + o.id + '" aria-checked="' + (S.op === o.id) + '">' + esc(o.label) + '</button>';
  }).join('');
  var cur = current(), e = $('jn-edit');
  if (!cur) { e.innerHTML = '<p class="jn-fine">No terminal chosen.</p>'; return; }
  var op = cur.op, h = '';
  var lim = function (v) { for (var k = 0; k < op.limits.length; k++) if (op.limits[k].var === v) return op.limits[k]; return null; };
  if (op.npcp) {
    var list = npcpOf(S.site);
    h += '<div class="jn-edit"><label class="jn-grow">published rule<select class="jn-in" id="jn-npcp">' + list.map(function (o) {
      return '<option value="' + esc(o.id) + '"' + (o.id === op.id ? ' selected' : '') + '>' + esc(o.name) + '</option>'; }).join('') + '</select></label>'
      + '<label>window (h)<input class="jn-in" id="jn-tr" inputmode="numeric" value="' + op.TR + '"></label></div>';
    h += '<details class="jn-src cited"><summary><span class="jn-tag">published</span><b>' + esc(op.limits.map(limText).join(' · ')) + '</b> — ' + esc(op.source.act || '') + '</summary>' + esc(op.source.title || '') + ', ' + esc(op.page || '')
      + (op.quote ? '<br>the act\'s words: <i lang="pt-BR">“' + esc(op.quote) + '”</i>' : '') + (op.status === 'expired-experimental' ? '<br>experimental parameters, period ended' : '')
      + (op.hsAt === 'berth' ? '<br>the wave is limited at the berth: the model node is the approach, so the wave is NEEDS DATA by construction' : '')
      + '<br><a href="' + esc(op.source.url) + '">the act</a> · sha256 ' + esc(String(op.source.sha256 || '').slice(0, 12)) + '…</details>';
  } else {
    var hs = lim('hs'), w = lim('wind_sustained');
    /* the limits in force, said as a line first: what is being decided is always visible; editing them is one click down */
    var open = op.own || !!S.adj;
    h += '<p class="jn-lims"><b>' + esc(op.limits.map(function (l) { return (l.var === 'hs' ? 'Hs' : VAR[l.var]) + ' ' + OPW[l.op] + ' ' + dc(l.value) + ' ' + (UNIT[l.unit] || l.unit); }).concat([C.trOf(op.TR) ? C.trOf(op.TR) + ' h window' : 'condition at the hour']).join(' · ')) + '</b>'
      + (op.own ? '' : '<button type="button" class="jn-linkb" id="jn-adj" aria-expanded="' + open + '">' + (open ? 'close' : 'adjust') + '</button>')
      + (cur.op.edited && !open ? '<button type="button" class="jn-linkb" id="jn-reset">restore</button>' : '') + '</p>';
    if (open) h += '<div class="jn-edit"><label>Hs ≤ (m)<input class="jn-in" id="jn-hs" inputmode="decimal" value="' + (hs ? dc(hs.value) : '') + '" placeholder="—"></label>'
      + '<label>wind ≤ (kn)<input class="jn-in" id="jn-vento" inputmode="decimal" value="' + (w ? dc(w.value) : '') + '" placeholder="—"></label>'
      + '<label>window (h)<input class="jn-in" id="jn-tr" inputmode="numeric" value="' + op.TR + '"></label>'
      + (cur.pub || op.own ? '' : '<button type="button" class="jn-btn" id="jn-reset">restore</button>') + '</div>';
    var P = preset(S.op);
    if (op.own) h += '<p class="jn-src">' + (S.own ? '' : '<span class="jn-tag">example</span>the starting values (Hs 2.5 m, wind 25 kn, 12 h) are nobody\'s rule: type the ones from your procedure. ') + 'Your procedure, decided in this tab by the same modules. Nothing leaves your browser; the address keeps the numbers so you can share them.</p>';
    else if (P && P.kind === 'cited') h += '<details class="jn-src cited"><summary><span class="jn-tag">cited</span>offloading criterion cited in 2010 (OMAE2010-20147) — confirm against the procedure in force</summary>'
      + esc(P.source) + '. <a href="' + esc(P.sourceUrl) + '">source</a>'
      + '<br><b>Checked by whoever operates, not decided here:</b><ul>' + P.notDecided.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
    else h += '<p class="jn-src"><span class="jn-tag">example</span>use the limit from your procedure: the values above are a starting point, not a rule.</p>';
    if (cur.op.edited) h += '<p class="jn-fine">Edited: decided now, in this tab, by the same modules that made the published decisions.</p>';
  }
  e.innerHTML = h;
  var num = function (v) { v = String(v).trim().replace(/\s/g, '').replace(',', '.'); return v === '' ? '' : (/^\d+(\.\d+)?$/.test(v) ? v : null); };
  var apply = function () {
    var tr = $('jn-tr') ? Math.max(0, Math.min(120, parseInt($('jn-tr').value, 10) || 0)) : op.TR;
    if (op.npcp) { S.edit = tr === 0 ? null : { TR: tr }; return change(); }
    if (!$('jn-hs')) return;
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
  if ($('jn-reset')) $('jn-reset').onclick = function () { S.edit = null; S.adj = false; change(); };
  if ($('jn-adj')) $('jn-adj').onclick = function () { S.adj = !S.adj; drawOps(); };
}
$('jn-ops').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-op]'); if (!b) return;
  var id = b.getAttribute('data-op');
  S.edit = null; S.adj = false;
  if (id === 'npcp') {
    if (!PL[S.site] || PL[S.site].kind !== 'terminal') { var tt = terminals().filter(function (p) { return npcpOf(p.id).length; }); select(tt[0] ? tt[0].id : null, true); }
    S.npcp = (npcpOf(S.site)[0] || {}).id;
    if (S.crit !== 'band') S.crit = 'band';
  }
  S.op = id; change();
});
/* ================================================================ the doors: what the visitor came to decide */
/* the intro is open on a first visit and folds to its one line once a door is used or it is folded; the choice
   stays in this browser (a per-viewer convenience: a blocked store just shows it open) */
function intro(open, keep) {
  var b = $('jn-introt'), box = $('jn-intro');
  if (!b) return;
  b.setAttribute('aria-expanded', open ? 'true' : 'false'); box.classList.toggle('shut', !open);
  if (keep) store.set('intro', open ? 'open' : 'shut');
  if (phone.matches && S.sheet === 'peek') { measurePeek(); pad(); }
}
$('jn-introt').addEventListener('click', function () { intro(this.getAttribute('aria-expanded') !== 'true', true); });
$('jn-uses').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-use]'); if (!b) return;
  var u = b.getAttribute('data-use');
  if (u === 'metodo') { location.href = '/janela/metodo/'; return; }
  intro(false, true);
  if (u === 'placar') { setMode('placar'); return; }
  if (u === 'campanha') {
    /* a campaign: ten line-laying operations (Hs <= 2.0 m for 48 h, the Line laying preset) from the 1st of next month at
       the place in view (Santos by default) — the case where the sea, Table 4-1 and the site alpha all have a count */
    S.op = 'lancamento'; S.edit = null; S.adj = false; S.ms = null; S.ml = null; S.mt = null; S.mn = 10; S.mm = null; setMode('mes'); render(); return;
  }
  if (u === 'vistoria') {
    /* the surveyor's door: the first unit in a LIBERADA window, its card open at the certificate */
    S.op = S.op === 'npcp' || S.op === 'own' ? 'alivio' : S.op; S.edit = null; setMode('semana');
    var cur = current(), pick = null;
    VIS.forEach(function (p) { if (pick || p.kind !== 'uep' || !applies(cur.op, p)) return; var c = codes(p.id); if (c && c[S.i] === 'L') pick = p; });
    if (!pick) pick = VIS.filter(function (p) { return p.kind === 'uep'; })[0];
    if (pick) {
      select(pick.id); if (phone.matches) setSheet('full');
      var cb = document.querySelector('.jn-cert'), sc = $('jn-scroll');
      if (cb) sc.scrollTop += cb.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8;
    }
    return;
  }
  /* an operation door: the week, the units that can do it, ranked */
  S.op = u; S.edit = null; S.adj = false; S.kind = 'uep';
  [].forEach.call($('jn-kind').querySelectorAll('[data-kind]'), function (x) { x.setAttribute('aria-checked', x.getAttribute('data-kind') === 'uep' ? 'true' : 'false'); });
  if (S.site) select(null, true);
  setMode('semana'); change();
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
    if (p0) { var cc = codes(p0.id, k, cur0); var v = cc ? cc[S.i] : '-'; small.innerHTML = g(v) + esc(v === 'n' ? 'DOES NOT APPLY' : WORD[v]); small.className = 'v ' + v; }
    else { var nL = 0, nT = 0, nN = 0; VIS.forEach(function (p) { if (!applies(cur0.op, p)) return; var cc2 = codes(p.id, k, cur0); if (!cc2 || cc2[S.i] === '-') return; if (cc2[S.i] === 'n') { nN++; return; } nT++; if (cc2[S.i] === 'L') nL++; }); small.innerHTML = nT ? g('L') + nL + ' of ' + nT : 'does not apply'; small.className = 'v'; b.title = nN ? nN + ' places where this criterion does not apply to this limit' : ''; }
  });
  var cur = current(), x = '';
  if (!cur) { $('jn-critx').textContent = ''; return; }
  var p = PL[S.site] && STEPS[S.site] ? PL[S.site] : null;
  if (S.crit === 'band') {
    var hp = p && STEPS[p.id][S.i] && STEPS[p.id][S.i].hp;
    x = 'The forecast × the error measured against satellite at this site and lead, at the unfavourable edge, at every step of the window (claimed coverage 9/10, audited on the scoreboard).'
      + (hp === 'en' ? ' Here, the union of ECMWF\'s and NOAA\'s measured bands: it covers whenever either one covers.' : hp === 'n' ? ' Here, NOAA\'s measured band alone (ECMWF\'s does not decide at this lead).' : '');
  }
  else {
    var r = p ? full(p.id, S.i) : null;
    var al = r && r.alpha ? r.alpha : null;
    x = S.crit === 'table' ? 'The deterministic forecast ≤ α × limit (OPWF), α from Table 4-1 of DNV-OS-H101 with design Hs = the limit and TPOP = window ÷ 2'
      : 'The same, with the α estimated at the site: the lower end of the 90% interval (resampled by day), rounded down. The α is an estimate; the decision on it is exact';
    if (al) x += ' — here α ' + q2(al.hs, 4) + (al.wind ? ', wind α ' + q2(al.wind, 2) + ' (Table 4-6)' : '') + ', TPOP ' + al.TPOP + ' h.';
    else if (r && r.verdict === 'n/a') x += '. It does not apply here: ' + whyEn(r.why) + '.';
    else x += '.';
    /* the site alpha's reach, said once for the fleet: three years of satellite pairs hold Hs up to 2 m, rarely above */
    if (S.crit === 'site' && !p) {
      var hsL = cur.op.limits.filter(function (l) { return l.var === 'hs'; })[0];
      var by = PR && PR.alpha ? PR.alpha.bySite : {}, tops = {};
      Object.keys(by).forEach(function (k) { var m = by[k].maxHs; if (m !== null) (tops[m] = tops[m] || []).push(k); });
      var hsT = Object.keys(tops).map(Number).sort(function (a, b) { return a - b; }), base = hsT[0];
      var more = hsT.slice(1).map(function (h) { return 'up to ' + dc(String(h)) + ' m only at ' + tops[h].map(function (k) { return PL[k] ? short(PL[k]) : k; }).join(', '); }).join('; ');
      if (hsL && base !== undefined && Number(hsL.value) > base) x += ' The site α was estimated for design Hs up to ' + dc(String(base)) + ' m' + (more ? ' (' + more + ')' : '') + ': three years of forecast × satellite pairs hold fewer than ' + PR.alpha.minPairs + ' high-sea cases per cell, and it is not extrapolated. It decides the operations with Hs ≤ ' + dc(String(base)) + ' m: Line laying, Lifting, your own limit.';
    }
  }
  $('jn-critx').textContent = x;
}

/* ================================================================ the list */
/* the list's groups, read at the chosen start hour (ONE clock): in the window now (tightest margin first), opening
   later (soonest first), no window in what is left of the forecast, and where the operation does not apply */
function rank(p) {
  var c = codes(p.id); if (!c) return [3, 0];
  if (c[S.i] === 'L') return [0, 0];
  var n = nextL(c, S.i);
  if (n) return [1, n.k];
  return /[VISR]/.test(c.slice(S.i)) ? [2, 0] : [3, 0];
}
var GROUP = ['In the window now, smallest margin first', 'Opens later, earliest first', 'No window in the rest of the forecast', 'Does not apply, or beyond the forecast'];
/* the margin of a place's next LIBERADA window: the smallest distance, over the window's steps, between the
   unfavourable edge the criterion decides on and the limit it decides against (Hs in m, wind in knots) */
function margin(p) {
  var c = codes(p.id), cur = current(); if (!c || !cur) return null;
  var n = nextL(c, S.i); if (!n) return null;
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
  var cur = current(), n = nextL(c, S.i);
  if (n) {
    var open = !/[VISR]/.test(c.slice(n.j + 1)), m = margin(p);
    return (n.k === S.i ? 'now' : '<b>' + esc(wtxt(AX[n.k])) + '</b>') + ' · ' + (open ? 'to the end' : (LEAD[n.j] - LEAD[n.k] + C.trOf(cur.op.TR)) + ' h')
      + (m ? '<small>margin ' + dc(m.gap) + ' ' + (m.var === 'hs' ? 'm' : 'kn') + '</small>' : '');
  }
  var ki = c.indexOf('I', S.i); if (ki >= 0) return 'UNDECIDED ' + esc(wtxt(AX[ki]));
  if (c.indexOf('V', S.i) >= 0) return 'BLOCKED';
  if (c.indexOf('S', S.i) >= 0 || c.indexOf('R', S.i) >= 0) return 'NEEDS DATA';
  return 'does not apply';
}
/* THE SET the list, the board and the fleet answer show: the operation's places, the kind filter, the search —
   one definition, so the three never count differently */
function rowsFor(cur) {
  var q = fold(S.q), hidden = 0;
  var rows = VIS.filter(function (p) {
    if (!applies(cur.op, p)) { hidden++; return false; }
    if (S.kind === 'uep' && p.kind !== 'uep') return false;
    if (S.kind === 'own' && p.kind === 'uep') return false;
    if (!q) return true;
    return fold(p.name + ' ' + (p.full || '') + ' ' + (p.serves || '') + ' ' + (p.type || '') + ' ' + typeOf(p) + ' ' + (p.operator || '') + ' ' + (BASIN[p.id] || '')).indexOf(q) >= 0;
  });
  return { rows: rows, hidden: hidden };
}
/* THE ORDER the list and the board's "by next window" share (one definition, so the two never disagree): in the
   window now, smallest margin first; then the windows that open later, earliest first; then no window */
function nextOrder(rows) {
  var rk = {}, mg = {};
  rows.forEach(function (p) { rk[p.id] = rank(p); var m = margin(p); mg[p.id] = m ? m.rel : 9; });
  return { rk: rk, cmp: function (a, b) { var x = rk[a.id], y = rk[b.id]; return x[0] - y[0] || x[1] - y[1] || mg[a.id] - mg[b.id] || short(a).localeCompare(short(b)); } };
}
function drawList() {
  if (!T) return;
  var q = fold(S.q), cur = current();
  var R0 = rowsFor(cur), hidden = R0.hidden, rows = R0.rows;
  var NO = nextOrder(rows), rk = NO.rk;
  rows.sort(NO.cmp);
  var n = [0, 0, 0, 0]; rows.forEach(function (p) { n[rk[p.id][0]]++; });
  $('jn-listk').innerHTML = (q ? 'search: ' + rows.length + ' of ' + VIS.length : (S.kind === 'uep' ? 'The units' : S.kind === 'own' ? 'Basins and terminals' : 'All places')) + ' starting <b>' + esc(wtxt(AX[S.i])) + '</b>'
    + (hidden ? ' <span class="jn-dim" title="' + esc(cur.op.appliesTo.why) + '">· ' + hidden + ' without storage, left out</span>' : '');
  var shown = rows.slice(0, S.listN), last = -1;
  $('jn-rows').innerHTML = shown.map(function (p) {
    var c = codes(p.id) || repeat('-', AX.length), ms = '', gk = rk[p.id][0], head = '';
    if (gk !== last) { last = gk; head = '<div class="jn-grp">' + esc(GROUP[gk]) + ' <b>' + n[gk] + '</b></div>'; }
    for (var k = 0; k < c.length; k++) ms += '<i class="' + c[k] + (k === S.i ? ' cur' : '') + '"></i>';
    return head + '<button type="button" class="jn-row" data-site="' + esc(p.id) + '" aria-label="' + esc(short(p) + ', ' + WORD[c[S.i]] + ', next window ' + nxText(p).replace(/<[^>]+>/g, '')) + '">'
      + g(c[S.i]) + '<span class="nm">' + esc(short(p)) + '<small>' + esc(subOf(p)) + '</small></span><span class="nx">' + nxText(p) + '</span><span class="ms" aria-hidden="true">' + ms + '</span></button>';
  }).join('') + (rows.length > S.listN ? '<button type="button" class="jn-btn jn-more" id="jn-more">show ' + Math.min(60, rows.length - S.listN) + ' more (of ' + rows.length + ')</button>' : '')
    + (!rows.length ? '<p class="jn-fine">Nothing found. Try the name of the unit (P-75), the field (Búzios) or the terminal.</p>' : '');
  if ($('jn-more')) $('jn-more').onclick = function () { S.listN += 60; drawList(); };
}
$('jn-rows').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-site]'); if (b) select(b.getAttribute('data-site')); });
$('jn-q').addEventListener('input', function () { S.q = this.value; S.listN = 30; drawList(); });
$('jn-kind').addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-kind]'); if (!b) return;
  S.kind = b.getAttribute('data-kind'); S.listN = 30;
  [].forEach.call(this.querySelectorAll('[data-kind]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
  answer(); drawList();
});

/* ================================================================ THE BOARD: the fleet board
   The professional view a planner keeps open on a desk (2026-10-08 review): every place of the list's set, grouped
   by basin north to south (or ranked by the next window, as the list is), against the 29 starts of the week — the
   go/no-go matrix weather-window planners read, in the verdict glyphs' own grammar (filled · crossed · hatched ·
   dotted, never colour alone). ONE clock: the chosen start is the lit column; a cell sets the clock and the place.
   It decides nothing new: every cell is codes(), the same letters the map, the list and the card show. */
var BASIN = {};
var BASIN_ORDER = ['Foz do Amazonas', 'Ceará', 'Potiguar', 'Sergipe', 'Alagoas', 'Camamu', 'Cumuruxatiba', 'Espírito Santo', 'Campos', 'Santos', 'Pelotas', 'Coast and terminals'];
(function basins() {
  /* a unit's basin is the ANP basin of the fields it serves (geo.js, ANP — GeoMaps); a site's is its own */
  var byField = {}, SITEB = { santos: 'Santos', campos: 'Campos', 'campos-p25': 'Campos', 'espirito-santo': 'Espírito Santo', pelotas: 'Pelotas', potiguar: 'Potiguar', 'foz-amazonas': 'Foz do Amazonas', sergipe: 'Sergipe' };
  ((GEO && GEO.fields && GEO.fields.features) || []).forEach(function (f) { byField[String(f.properties.n || '').toUpperCase().trim()] = f.properties.b; });
  CFG.places.forEach(function (p) {
    var b = null;
    if (p.kind === 'uep') {
      var re = /([A-ZÀ-Ú][A-ZÀ-Ú0-9 '\-]+?)\s*\(/g, m, up = String(p.serves || '').toUpperCase();
      while (!b && (m = re.exec(up))) b = byField[m[1].trim()] || null;
      if (!b) b = SITEB[p.bandFrom] || SITEB[(p.near || {}).site] || null;
    } else b = SITEB[p.id] || 'Coast and terminals';
    BASIN[p.id] = b || 'Coast and terminals';
  });
})();
var BD = { open: store.get('board') !== '0', sort: store.get('bsort') === 'janela' ? 'janela' : 'bacia', hov: null, lastSel: null };
function boardOn() { return !!T && !phone.matches && window.innerWidth >= 1000 && S.mode === 'semana'; }
function boardState() {
  var on = boardOn(), el = $('jn-board');
  el.hidden = !on;
  el.classList.toggle('open', BD.open);
  document.documentElement.classList.toggle('jn-bd-open', on && BD.open);
  document.documentElement.classList.toggle('jn-bd-bar', on && !BD.open);
  $('jn-bt').setAttribute('aria-expanded', BD.open ? 'true' : 'false');
  return on;
}
function drawBoard() {
  if (!boardState()) return;
  var cur = current(); if (!cur) { $('jn-bgrid').innerHTML = ''; return; }
  var R0 = rowsFor(cur), rows = R0.rows, cnt = { L: 0, I: 0, V: 0, S: 0 }, tot = 0;
  rows.forEach(function (p) { var c = codes(p.id); if (!c) return; var v = c[S.i] === 'R' ? 'S' : c[S.i]; if (cnt[v] === undefined) return; cnt[v]++; tot++; });
  $('jn-bsum').innerHTML = '<b>' + esc(cur.name) + '</b> · ' + esc(CSHORT[S.crit]) + ' · <b>' + esc(wtxt(AX[S.i])) + '</b> · '
    + '<span class="mix">' + ['L', 'I', 'V', 'S'].map(function (k) { return '<span class="' + (cnt[k] ? '' : 'z') + '">' + g(k) + cnt[k] + '</span>'; }).join('') + '</span>'
    + ' <span class="jn-dim">of ' + tot + '</span>';
  [].forEach.call($('jn-bsort').querySelectorAll('[data-bsort]'), function (b) { b.setAttribute('aria-checked', b.getAttribute('data-bsort') === BD.sort ? 'true' : 'false'); });
  if (!BD.open) return;
  /* the head: the days over their starts, the hours under them (Brasília), now and the chosen start marked */
  var head = '<div class="jn-bhd" role="row"><span class="nm">' + (S.kind === 'uep' ? 'unit' : 'place') + '</span><span class="cells">'
    + DAYS.map(function (d) { return '<span class="day' + (d.k <= S.i && S.i < d.k + d.n ? ' on' : '') + '" style="--n:' + d.n + '">' + (d.n >= 2 ? esc(d.lab) : '') + '</span>'; }).join('')
    + '</span><span class="nx">next window</span></div>'
    + '<div class="jn-bhh" aria-hidden="true"><span class="nm">start · Brasília</span><span class="cells">' + AX.map(function (t, k) { return '<i class="' + (k === S.i ? 'cur' : '') + (k === iNow ? ' now' : '') + (k % 2 ? ' o' : '') + '" data-k="' + k + '">' + esc(when(t).h.slice(0, 2)) + '</i>'; }).join('') + '</span><span class="nx"></span></div>';
  var byRank = nextOrder(rows).cmp;
  var groups = [];
  if (BD.sort === 'bacia') {
    BASIN_ORDER.forEach(function (b) { var l = rows.filter(function (p) { return BASIN[p.id] === b; }).sort(function (a, c) { return (a.kind === 'uep') - (c.kind === 'uep') || byRank(a, c); }); if (l.length) groups.push({ t: b, l: l }); });
    var rest = rows.filter(function (p) { return BASIN_ORDER.indexOf(BASIN[p.id]) < 0; });
    if (rest.length) groups.push({ t: 'Others', l: rest.sort(byRank) });
  } else groups.push({ t: null, l: rows.slice().sort(byRank) });
  var body = groups.map(function (gr) {
    var gl = { L: 0, n: 0 }; gr.l.forEach(function (p) { var c = codes(p.id); if (c && c[S.i] !== '-' && c[S.i] !== 'n') { gl.n++; if (c[S.i] === 'L') gl.L++; } });
    return (gr.t ? '<div class="jn-bgh" role="row"><span class="nm">' + esc(gr.t) + '</span><span class="ct">' + gl.L + ' of ' + gl.n + ' ' + g('L') + '</span></div>' : '')
      + gr.l.map(function (p) {
        var c = codes(p.id) || repeat('-', AX.length), cells = '';
        for (var k = 0; k < c.length; k++) cells += '<i class="' + c[k] + (k === S.i ? ' cur' : '') + (k < iNow ? ' past' : '') + '" data-k="' + k + '" title="' + esc(short(p) + ' · ' + wtxt(AX[k], true) + ' · ' + (WORD[c[k]] || '')) + '"></i>';
        return '<div class="jn-brow' + (p.id === S.site ? ' sel' : '') + (p.kind !== 'uep' ? ' own' : '') + '" role="row" data-site="' + esc(p.id) + '">'
          + '<button type="button" class="nm" data-site="' + esc(p.id) + '">' + esc(short(p)) + '<small>' + esc(p.kind === 'uep' ? (typeOf(p) || 'unit') : KIND[p.kind] ? p.kind === 'terminal' ? 'terminal' : 'measured' : '') + '</small></button>'
          + '<span class="cells">' + cells + '</span><span class="nx">' + nxText(p) + '</span></div>';
      }).join('');
  }).join('');
  var grid = $('jn-bgrid'), top = grid.scrollTop;
  grid.innerHTML = head + '<div class="jn-bbody">' + (body || '<p class="jn-fine">No place in this filter.</p>') + '</div>';
  grid.scrollTop = top;
  /* the chosen place in view, once per selection */
  if (S.site && BD.lastSel !== S.site) {
    BD.lastSel = S.site;
    var r = grid.querySelector('.jn-brow.sel');
    if (r) { var gr2 = grid.getBoundingClientRect(), rr = r.getBoundingClientRect(); if (rr.top < gr2.top + 44 || rr.bottom > gr2.bottom) grid.scrollTop += rr.top - gr2.top - 60; }
  }
  if (!S.site) BD.lastSel = null;
}
/* the board as a spreadsheet: one row per place, one column per start (Brasília and UTC in the header), the verdict
   word in each cell — what a planner pastes into the week's plan; the operation, criterion, run and digest on top */
function boardCsv() {
  var cur = current(); if (!cur) return;
  var rows = rowsFor(cur).rows.slice().sort(function (a, b) { return BASIN_ORDER.indexOf(BASIN[a.id]) - BASIN_ORDER.indexOf(BASIN[b.id]) || short(a).localeCompare(short(b)); });
  var q = function (x) { x = String(x == null ? '' : x); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  var lines = [];
  lines.push(['# Janela — fleet board', cur.name, cur.op.limits.map(limText).join(' and ') + (C.trOf(cur.op.TR) ? ', ' + C.trOf(cur.op.TR) + ' h window' : ''), CNAME[S.crit], 'run ' + T.run, 'digest ' + String(T.digest || '').slice(0, 16)].map(q).join(';'));
  lines.push(['place', 'type', 'basin', 'next CLEARED window (start, BRT)'].concat(AX.map(function (t) { var w = when(t); return w.dm + ' ' + w.h + ' BRT (' + utc(t) + ')'; })).map(q).join(';'));
  rows.forEach(function (p) {
    var c = codes(p.id) || repeat('-', AX.length), n = nextL(c, iNow);
    lines.push([short(p), p.kind === 'uep' ? (typeOf(p) || 'unit') : (KIND[p.kind] || p.kind), BASIN[p.id], n ? wtxt(AX[n.k], true) : '—'].concat(c.split('').map(function (k) { return WORD[k] || k; })).map(q).join(';'));
  });
  var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'janela-board-' + (S.op) + '-' + T.run.slice(0, 10) + '.csv'; a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
}
(function boardInput() {
  var grid = $('jn-bgrid');
  grid.addEventListener('click', function (e) {
    var cell = e.target.closest && e.target.closest('.cells i[data-k]'), row = e.target.closest && e.target.closest('[data-site]');
    var hk = e.target.closest && e.target.closest('.jn-bhh i[data-k]');
    if (hk) { stop(); setI(+hk.getAttribute('data-k')); return; }
    if (!row) return;
    stop();
    var id = row.getAttribute('data-site');
    if (cell) { S.i = Math.max(0, Math.min(AX.length - 1, +cell.getAttribute('data-k'))); FIELD.target = S.i; }
    if (id !== S.site) select(id); else { render(); hash(); }
  });
  grid.addEventListener('mouseover', function (e) { var r = e.target.closest && e.target.closest('.jn-brow'); var id = r ? r.getAttribute('data-site') : null; if (id !== BD.hov) { BD.hov = id; drawMarks(); } });
  grid.addEventListener('mouseleave', function () { if (BD.hov) { BD.hov = null; drawMarks(); } });
  $('jn-bt').onclick = function () { BD.open = !BD.open; store.set('board', BD.open ? '1' : '0'); drawBoard(); pad(); };
  $('jn-bcsv').onclick = boardCsv;
  $('jn-bsort').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-bsort]'); if (!b) return; BD.sort = b.getAttribute('data-bsort'); store.set('bsort', BD.sort); drawBoard(); });
})();

/* ================================================================ the site card */
/* why the site alpha is silent here, in a tile's words: never "no alpha" where one was estimated for other limits */
function alphaUpTo(p) {
  var t = p.alphaFrom && CFG.alphaT[p.alphaFrom]; if (!t) return null;
  var top = null; Object.keys(t.rows).forEach(function (r) { t.rows[r].forEach(function (v, i) { if (v !== null && (top === null || t.columns[i] > top)) top = t.columns[i]; }); });
  return top;
}
/* r.why is read in the Portuguese criteria.js and the model's siteWhy write it (it is inside the day's digest) */
function siteShort(p, r) {
  if (/pares insuficientes/.test(r.why)) { var up = alphaUpTo(p); return up ? 'site α only up to Hs ' + dc(String(up)) + ' m' : 'site α not estimated here'; }
  if (/terminal/.test(r.why)) return 'does not apply at a terminal';
  if (/medição|estimado/.test(r.why)) return 'no site α in this region';
  return 'does not apply';
}
function prunedLine(p) {
  var src = p.kind === 'uep' ? p.bandFrom : p.id;
  var pr = (T.pruned || []).filter(function (x) { return x.sites.indexOf(src) >= 0; })[0];
  return pr ? 'The measured band here was PRUNED by the scoreboard' + (pr.at ? ' on ' + dmy(pr.at) : '') + ': it missed its own coverage claim, and until a recalibrated version it does not decide here (the band is NEEDS DATA; Table 4-1 decides).' : '';
}
function nodeLine0(p) {
  var s = T.places[p.id];
  var ll = function (a) { return dec(Math.abs(a[0]), 2) + '°' + (a[0] < 0 ? 'S' : 'N') + ' ' + dec(Math.abs(a[1]), 2) + '°' + (a[1] < 0 ? 'W' : 'E'); };
  var at = 'ECMWF forecast read at model node ' + ll(s.node);
  if (p.kind === 'uep') return at + ' (0.25°). ' + (p.caveat ? 'Caution: ' + p.caveat + ' ' : '') + (p.bandFrom ? 'The measured band and the site α come from ' + short(PL[p.bandFrom]) + ', the nearest measured site (' + p.near.km + ' km)' + (alphaUpTo(p) ? '; the α, estimated for design Hs up to ' + dc(String(alphaUpTo(p))) + ' m (above that, three years of satellite hold fewer than 30 pairs per cell).' : '.') : (p.tracked && PL[p.tracked.site] ? 'No measured band yet: the site ' + short(PL[p.tracked.site]) + ', ' + p.tracked.km + ' km away, has been tracked since ' + dmy(p.tracked.added) + ' and gets a band once its three years of forecast × satellite are read. Until then Table 4-1 decides.' : 'No measured band: no measured site within 350 km (the nearest, ' + short(PL[p.near.site]) + ', is ' + p.near.km + ' km away). The Table 4-1 criterion still decides.'));
  if (p.kind === 'terminal') return at + ': the open sea of the APPROACH, not the berth. The measured band comes from ' + short(PL[s.bandFrom] || { name: s.bandFrom || '—', kind: 'field' }) + ': an altimeter does not see inside a bay.';
  if (!(STEPS[p.id] || []).some(function (x) { return x.hb; })) return at + '. A site tracked since ' + dmy(p.added) + ': its forecast enters the scoreboard every day, but the measured band and the site α arrive only once three years of forecast × satellite for this sea are read. Until then the measured band is NEEDS DATA and DNV\'s Table 4-1 decides.';
  return at + '; the measured band and the α are this site\'s own (satellite × forecast pairs, 2023 to 2026).' + (p.caveat ? ' Caution: ' + p.caveat : '');
}
function dmy(iso) { return iso ? iso.slice(0, 10) : '—'; }
function explain(p, r, op, crit) {
  var st = STEPS[p.id];
  if (r === null) return 'The window runs past the forecast\'s last step: there is nothing to decide it with.';
  if (r.verdict === 'n/a') return 'Does not apply: ' + whyEn(r.why) + '.';
  var lims = crit === 'band' ? op.limits : (r.opwf || []).concat(op.limits.filter(function (l) { return l.var !== 'hs' && l.var !== 'wind_sustained'; }));
  var pick = function (v) { for (var k = 0; k < lims.length; k++) if (lims[k].var === v) return lims[k]; return null; };
  var span = C.span(st, S.i, op.TR) || [S.i];
  var arr = function (v, edge) {
    var key = crit === 'band' ? (v === 'hs' ? 'hb' : 'wb') : (v === 'hs' ? 'hd' : 'wd'), best = null;
    span.forEach(function (k) { var b = st[k][key]; if (!b) return; var x = Q.parse(b[edge]); if (!best || (edge === 1 ? Q.cmp(x, best) > 0 : Q.cmp(x, best) < 0)) best = x; });
    return best ? dc(Q.dec(best, v === 'hs' ? 2 : 1, edge === 1 ? 'up' : 'down')) : '—';
  };
  var lt = function (l) { return (OPW[l.op] || l.op) + ' ' + q2(l.value, l.var === 'hs' ? 2 : 1) + ' ' + (UNIT[l.unit] || l.unit); };
  var what = crit === 'band' ? 'the unfavourable edge of the measured band' : 'the deterministic forecast';
  if (r.verdict === 'LIBERADA') {
    return 'At all ' + span.length + ' steps of the window, ' + what + ' stays inside: ' + r.decidedOn.map(function (v) {
      var l = pick(v); return VAR[v] + ' at most ' + arr(v, 1) + ' ' + (v === 'hs' ? 'm' : 'kn') + ' (' + (crit === 'band' ? 'limit ' : 'OPWF ') + lt(l) + ')'; }).join('; ') + '.';
  }
  if (r.verdict === 'VETADA') {
    var w = r.witness, l2 = pick(w.var);
    return 'Even ' + (crit === 'band' ? 'the favourable edge of the measured band' : 'the deterministic forecast') + ' breaks ' + (crit === 'band' ? 'the limit' : 'the OPWF') + ' at ' + wtxt(w.t, true) + ': ' + VAR[w.var] + ' ' + edgeWord(w) + ', against ' + lt(l2) + '. The witness is that hour and that variable.';
  }
  if (r.verdict === 'INDEFINIDA') {
    return (crit === 'band' ? 'The measured band straddles the limit' : 'The forecast, rounded outward to 1 mm, touches the OPWF') + ': ' + r.flip.map(function (f) {
      var l3 = pick(f.var);
      return 'at ' + wtxt(f.t, true) + ', ' + VAR[f.var] + ' reaches ' + q2(f.edge, 2) + ' ' + (f.var === 'hs' ? 'm' : 'kn') + ' against ' + lt(l3) + '; to turn CLEARED, the unfavourable edge must ' + (/^</.test(f.limit) ? 'drop ' : 'rise ') + dc(f.gapDec) + ' ' + (f.var === 'hs' ? 'm' : 'kn');
    }).join('. ') + '. If the favourable edge goes over the limit, it turns BLOCKED.';
  }
  if (r.verdict === 'SEM DADOS') {
    return (r.decidedOn && r.decidedOn.length ? 'What has a measured band clears (' + r.decidedOn.map(function (v) { return VAR[v]; }).join(' and ') + '), but the rule limits more: ' : 'Nothing this rule limits has a band here: ')
      + missingShort(p, r, op) + '.';
  }
  return whyEn(r.why || '');
}
function drawCard() {
  var box = $('jn-card'), p = PL[S.site];
  if (!T || !p || !STEPS[p.id]) { box.hidden = true; return; }
  box.hidden = false;
  var cur = current(), op = cur.op, st = STEPS[p.id], TR = C.trOf(op.TR);
  var crits = CFG.crits, res = {}, cs = {};
  crits.forEach(function (k) { res[k] = full(p.id, S.i, k, cur); cs[k] = codes(p.id, k, cur); });
  var eyebrow = p.kind === 'uep' ? [typeOf(p), fieldsOf(p).slice(0, 3).join(', '), p.depth ? 'water depth ' + grp(p.depth) + ' m' : '', p.operator].filter(Boolean).join(' · ') : kindOf(p);
  var end = addH(AX[S.i], TR);
  var tile = function (k) {
    var r = res[k], c = vcode(r), e;
    if (r === null) e = 'beyond the forecast';
    else if (r.verdict === 'n/a') e = k === 'site' ? siteShort(p, r) : 'does not apply';
    else if (k === 'band') e = op.limits.filter(function (l) { return l.var === 'hs' || l.var === 'wind_sustained'; }).map(function (l) { return VAR[l.var] + ' ' + OPW[l.op] + ' ' + dc(l.value); }).join(' · ') || 'the rule\'s limits';
    else e = 'α ' + q2(r.alpha.hs, 3) + ' → ' + r.opwf.filter(function (l) { return l.var === 'hs'; }).map(function (l) { return 'Hs ≤ ' + q2(l.value, 2); }).join('');
    return '<div class="' + (k === S.crit ? 'on ' : '') + (k === 'site' ? 'est' : '') + '"><span class="h">' + esc(CSHORT[k]) + '</span><span class="w">' + chip(c) + '</span><span class="e">' + esc(e) + '</span></div>';
  };
  var mx = crits.map(function (k) {
    var c = cs[k] || repeat('-', AX.length), cells = '';
    for (var i = 0; i < c.length; i++) cells += '<i class="' + (i === S.i ? 'cur' : '') + '" data-k="' + i + '" title="' + esc(wtxt(AX[i], true) + ' · ' + WORD[c[i]]) + '">' + g(c[i]) + '</i>';
    return '<span class="l' + (k === S.crit ? ' on' : '') + '">' + esc(CSHORT[k]) + '</span><span class="ms" data-crit="' + k + '">' + cells + '</span>';
  }).join('');
  var isTank = p.kind === 'uep' && applies(preset('alivio'), p);
  /* THE CARD'S ORDER IS THE HIERARCHY (2026-10-07, outreach pass): who it is → when it can go → why, by the three
     criteria → the week → the sea charts → the user's own planning numbers → what is shown but never decided
     (folded) → the certificate → where the forecast was read */
  var u = unitLine(p, cur), pl = prunedLine(p);
  var h = '<div class="jn-ch"><div class="jn-grow"><div class="jn-k">' + esc(eyebrow) + '</div><h2>' + esc(p.name) + '</h2>'
    + (p.kind === 'uep' && p.full && p.full !== p.name ? '<div class="jn-fine">' + esc(p.full) + (p.oilBpd ? ' · processing capacity ' + grp(p.oilBpd) + ' bpd (ANP)' : '') + '</div>' : '')
    + '</div><button type="button" class="jn-x" id="jn-close" aria-label="Close the place (Esc)">×</button></div>'
    + '<div class="jn-unit"><p class="jn-ans">' + u.h + '</p><p class="jn-sub"><span>' + esc(u.sub.join(' · ')) + '</span></p></div>'
    + (pl ? '<div class="jn-note">' + esc(pl) + '</div>' : '')
    + '<div><div class="jn-k">' + esc(cur.name) + ' · starting <b>' + esc(wtxt(AX[S.i], true)) + '</b>' + (TR ? ' → ' + esc(wtxt(end)) : ', condition at the hour') + '</div>'
    + '<div class="jn-three">' + crits.map(tile).join('') + '</div></div>'
    + '<p class="jn-why">' + esc(explain(p, res[S.crit], op, S.crit)) + '</p>'
    + '<div><div class="jn-k">the week, by the three criteria</div><div class="jn-mx" id="jn-mx">' + mx + '</div></div>'
    + chartHs(p, cur) + chartWind(p, cur) + dirs(p)
    + (isTank && S.op === 'alivio' ? tank(p) : '')
    + waitCost(p)
    + '<details class="jn-src jn-fold"' + (S.fold ? ' open' : '') + ' id="jn-fold"><summary>the sea by parts and the current · shown, not decided</summary>' + seaParts(p) + '<div class="jn-note">' + currentNote(p) + '</div></details>'
    + certBlock(p) + restsOn(p)
    + '<div class="jn-from"><div class="jn-k">where this forecast comes from</div><p class="jn-node">' + esc(nodeLine0(p)) + '</p></div>';
  box.innerHTML = h;
  $('jn-close').onclick = function () { select(null); };
  $('jn-fold').addEventListener('toggle', function () { S.fold = this.open; });
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
  return '<b>Current and direction.</b> ' + (has
    ? 'Copernicus Marine\'s surface current (global model at 1/12°, with tide and wave drift) is shown, not yet decided: it still has to be measured against observed currents. In a channel or a bay the model does not see the channel\'s tidal current, and the terminals\' current rules stay NEEDS DATA.'
    : 'The current is not in this day\'s forecast: every rule that limits it stays NEEDS DATA.')
    + (eq ? ' On the Equatorial Margin the current is the variable that governs the operation, and it is not yet decided here.' : '')
    + (S.op === 'alivio' ? ' In offloading, the direction decides the shuttle tanker\'s green sector: the arrows above are the forecast, checked by whoever operates.' : '');
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
function poly(st, key, y, mid, halo) {
  var runs = [], cur = null;
  st.forEach(function (s, i) { if (s[key]) { if (!cur) { cur = []; runs.push(cur); } cur.push(i); } else cur = null; });
  return runs.map(function (r) {
    if (mid) return r.length > 1 ? '<polyline ' + W.attrs(W.COMPUTED, { width: 1.5 }) + ' points="' + r.map(function (i) { var b = st[i][key]; return xOf(i).toFixed(1) + ',' + y((+b[0] + +b[1]) / 2).toFixed(1); }).join(' ') + '"/>' : '';
    /* the decided band is filled; ECMWF's ensemble hatched; NOAA's ensemble an outline (providers-v1: forecast ink, never decided on) */
    var cls = key === 'ens' ? 'ens' : key === 'ensN' ? 'swr' : 'band';
    /* an extent carries its standing in words (the key), never in a dash: the band decided, the ensembles forecast */
    var A = ext(cls === 'band' ? W.DECIDED : W.COMPUTED, cls, cls === 'band' ? 1.5 : 1), hl = halo && cls === 'band';
    if (r.length === 1) {
      var b0 = st[r[0]][key], one = 'x="' + (xOf(r[0]) - 2).toFixed(1) + '" y="' + y(+b0[1]).toFixed(1) + '" width="4" height="' + Math.max(1, y(+b0[0]) - y(+b0[1])).toFixed(1) + '"';
      return (hl ? '<rect class="halo" filter="url(#' + halo + ')" ' + one + '/>' : '') + '<rect ' + A + ' ' + one + '/>';
    }
    var up = r.map(function (i) { return xOf(i).toFixed(1) + ',' + y(+st[i][key][1]).toFixed(1); });
    var dn = r.slice().reverse().map(function (i) { return xOf(i).toFixed(1) + ',' + y(+st[i][key][0]).toFixed(1); });
    var pts = ' points="' + up.concat(dn).join(' ') + '"';
    return (hl ? '<polygon class="halo" filter="url(#' + halo + ')"' + pts + '/>' : '') + '<polygon ' + A + (key === 'ens' ? ' fill="url(#jn-hatch)"' : '') + pts + '/>';
  }).join('');
}
function guides(op, p, v, y, cur) {
  var o = [], lab = [];
  op.limits.forEach(function (l) { if (l.var === v) lab.push({ v: +l.value, t: 'limit ' + OPW[l.op] + ' ' + dc(l.value), c: 'lim' }); });
  ['table', 'site'].forEach(function (k) {
    var r = full(p.id, S.i, k, cur);
    if (r && r.opwf) r.opwf.forEach(function (l) { if (l.var === v) lab.push({ v: Number(Q.dec(Q.parse(l.value), 3)), t: 'OPWF ' + (k === 'table' ? 'table ' : 'site ') + q2(l.value, v === 'hs' ? 2 : 1), c: 'opwf' }); });
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
  var carried = hasBand && (p.kind === 'uep' || p.kind === 'terminal'), from = carried ? PL[p.kind === 'uep' ? p.bandFrom : (T.places[p.id] || {}).bandFrom] : null;
  var svg = '<svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Hs at ' + short(p) + ', seven days: the measured band (decided) against ECMWF\'s deterministic forecast' + (hasEns ? ' and ensemble' : '') + (hasEnsN ? ', and NOAA\'s ensemble' : '') + ', with the limit and the OPWFs.') + '">'
    + '<defs><pattern id="jn-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="hl" x1="0" y1="0" x2="0" y2="5"/></pattern>' + HALO('jn-blur-h') + '</defs>'
    + winRect(p, op, H) + B.o.join('') + poly(st, 'ens', B.y) + poly(st, 'ensN', B.y) + poly(st, 'hb', B.y, false, carried ? 'jn-blur-h' : null) + poly(st, 'hd', B.y, true) + gd.o.join('') + '</svg>';
  var hasUnion = st.some(function (s) { return s.hp === 'en'; });
  var hasW = st.some(function (s) { return s.wb; });
  return '<figure class="jn-fig">' + svg + '<ul class="jn-key"><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect ' + ext(W.DECIDED, 'band', 1.5) + ' x="1" y="1.5" width="20" height="7"/></svg>measured band, decided' + (hasBand ? (hasUnion ? ', ECMWF ∪ NOAA' : '') : ' (no band here)') + '</li>'
    + (carried || hasW ? '<li><svg viewBox="0 0 22 10" aria-hidden="true"><defs>' + HALO('jn-blur-k') + '</defs><rect class="halo" filter="url(#jn-blur-k)" x="3" y="2.5" width="16" height="5"/><rect ' + ext(W.DECIDED, 'band', 1.5) + ' x="3" y="2.5" width="16" height="5"/></svg>halo: the band where it was not validated'
      + (carried && from ? ' (the Hs here, carried from ' + esc(short(from)) + ')' : '') + (hasW ? '; the wind\'s, everywhere' : '') + '</li>' : '')
    + '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><line ' + W.attrs(W.COMPUTED, { width: 1.5 }) + ' x1="1" y1="5" x2="21" y2="5"/></svg>deterministic forecast, dashed</li>'
    + (hasEns ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="swr" x="1" y="1.5" width="20" height="7"/><line class="hl" x1="4" y1="8.5" x2="9" y2="1.5"/><line class="hl" x1="10" y1="8.5" x2="15" y2="1.5"/><line class="hl" x1="16" y1="8.5" x2="21" y2="1.5"/></svg>ECMWF ensemble, 40 of 50</li>' : '')
    + (hasEnsN ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="swr" x="1" y="1.5" width="20" height="7"/></svg>NOAA ensemble, 25 of 31</li>' : '')
    + '<li><svg viewBox="0 0 22 10" aria-hidden="true"><line class="lim" x1="1" y1="5" x2="21" y2="5"/></svg>limit · OPWF</li></ul>'
    + (PR && PR.legend ? PR.legend.dc : '') + '</figure>';
}
/* the halo's blur: an unmeasured error has no edge to draw (WARRANT rule 13) */
function HALO(id) { return '<filter id="' + id + '" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>'; }
function chartWind(p, cur) {
  var st = STEPS[p.id], op = cur.op, H = 120, vals = [10];
  st.forEach(function (s) { if (s.wb) vals.push(+s.wb[1]); if (s.wd) vals.push(+s.wd[1]); });
  var gtmp = guides(op, p, 'wind_sustained', function () { return 0; }, cur); vals = vals.concat(gtmp.vals);
  var mx = Math.max.apply(null, vals), tick = mx <= 30 ? 5 : mx <= 60 ? 10 : 20, top = Math.max(2 * tick, Math.ceil(mx * 1.06 / tick) * tick);
  var B = chartBase(H, top, tick, 'wind (kn)');
  var gd = guides(op, p, 'wind_sustained', B.y, cur);
  var svg = '<svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Wind at 10 m at ' + short(p) + ', seven days: the measured band against the deterministic forecast, with the limit.') + '">'
    + '<defs>' + HALO('jn-blur-w') + '</defs>'
    + winRect(p, op, H) + B.o.join('') + poly(st, 'wb', B.y, false, 'jn-blur-w') + poly(st, 'wd', B.y, true) + gd.o.join('') + '</svg>';
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
  /* the long-period swell (ECMWF's Hs of the waves of 12 s and longer): what an FPSO's roll and a crane's load answer to */
  var hasLs = st.some(function (s) { return s.ls; });
  var ls = hasLs ? st.map(function (s, i) { return s.ls && i % 4 === 1 ? '<text class="ax" x="' + xOf(i).toFixed(1) + '" y="14" text-anchor="middle">' + dc(s.ls[1]) + '</text>' : ''; }).join('') : '';
  return '<div class="jn-dir"><span class="l">waves</span><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="Where the waves go, forecast by step">' + row('mwd', 'arr') + '</svg>'
    + '<span class="l">Tp (s)</span><svg viewBox="0 0 ' + CW + ' 18" role="img" aria-label="Forecast peak period">' + tp + '</svg>'
    + (hasLs ? '<span class="l">≥12 s (m)</span><svg viewBox="0 0 ' + CW + ' 18" role="img" aria-label="Significant height of the waves of 12 seconds or longer, forecast">' + ls + '</svg>' : '')
    + '<span class="l">wind</span><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="Where the wind blows, forecast by step">' + row('wdir', 'arrw') + '</svg></div>'
    + '<p class="jn-fine jn-fc">Arrows: where the wave and the wind go, ECMWF forecast by step (not decided): a drawing of the model.' + (hasLs ? ' ≥12 s: the significant height of the waves of 12 s or longer only (the long swell, the one that moves the hull and the load), from the same forecast.' : '') + '</p>';
}

/* ---- the sea by parts at the chosen hour: NOAA's wind sea and swells (forecast ink, never decided on) ---- */
var PONTOS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function seaParts(p) {
  var s = STEPS[p.id] && STEPS[p.id][S.i];
  if (!s || (!s.wp && !s.cu && !s.ls)) return '';
  var lsl = s.ls ? '<p class="jn-p">Long swell (ECMWF, by period band): Hs of the waves of 10 s or longer <b>' + cv(dc(s.ls[0]) + ' m') + '</b>, of 12 s or longer <b>' + cv(dc(s.ls[1]) + ' m') + '</b>, of 14 s or longer <b>' + cv(dc(s.ls[2]) + ' m') + '</b>.</p>' : '';
  var cur = s.cu ? '<p class="jn-p">Surface current: <b>' + cv(dc(s.cu[0].toFixed(1)) + ' kn') + '</b> towards ' + PONTOS[Math.round(s.cu[1] / 22.5) % 16] + ' (' + cv(s.cu[1] + '°') + ')'
    + (s.cu[2] !== null ? ', of which tide ' + cv(dc(s.cu[2].toFixed(1)) + ' kn') : '') + '.'
    + (s.cu.length > 4 ? ' At 15.8 m, mid-draft of a loaded FPSO or shuttle tanker: ' + cv(dc(s.cu[3].toFixed(1)) + ' kn') + ' towards ' + PONTOS[Math.round(s.cu[4] / 22.5) % 16] + ' (' + cv(s.cu[4] + '°') + ').' : '')
    + '</p><p class="jn-fine jn-fc">Copernicus Marine, global model at 1/12° (at the surface, with tide and wave drift): shown, not decided.</p>' : '';
  if (!s.wp) return '<div><div class="jn-k">the sea by parts · ' + esc(wtxt(AX[S.i], true)) + '</div>' + lsl + cur + '</div>';
  var name = { v: 'wind sea', 1: 'swell 1', 2: 'swell 2', 3: 'swell 3' };
  var rows = s.wp.map(function (x) {
    return '<tr><td>' + esc(name[x[0]] || x[0]) + '</td><td>' + cv(dc(x[1].toFixed(2))) + '</td><td>' + (x[2] === null ? '—' : cv(dc(x[2].toFixed(1)))) + '</td><td>'
      + (x[3] === null ? '—' : cv(x[3] + '°') + ' ' + PONTOS[Math.round(x[3] / 22.5) % 16]) + '</td></tr>';
  }).join('');
  return '<div><div class="jn-k">the sea by parts · ' + esc(wtxt(AX[S.i], true)) + '</div><div class="tw"><table class="jn-tbl"><thead><tr><th>part</th><th>Hs (m)</th><th>period (s)</th><th>from</th></tr></thead><tbody>'
    + rows + '</tbody></table></div><p class="jn-fine jn-fc">NOAA WAVEWATCH III (GFS-Wave), forecast by parts: shown, not decided.</p>' + lsl + cur + '</div>';
}

/* ---- CRITICAL OFFLOADING: the user's tanks against the next CLEARED offloading window ---- */
/* the codes a planning line counts on: the chosen criterion, or the measured band where the chosen one does not apply */
function planCodes(p) {
  var c = codes(p.id, S.crit);
  if (c && /[LVIS]/.test(c)) return { c: c, crit: S.crit, fell: false };
  return { c: codes(p.id, 'band') || '', crit: 'band', fell: S.crit !== 'band' };
}
function tank(p) {
  var v = {}; try { v = JSON.parse(store.get('tank.' + p.id) || '{}'); } catch (e) { v = {}; }
  var f = function (k, lab, ph) { return '<label>' + lab + '<input class="jn-in" data-tank="' + k + '" inputmode="numeric" value="' + esc(v[k] || '') + '" placeholder="' + ph + '"></label>'; };
  var h = '<div><div class="jn-k">critical offloading · <b>your numbers</b></div><div class="jn-tank">' + f('cap', 'storage (bbl)', '1,600,000') + f('inv', 'inventory now (bbl)', '1,200,000') + f('bpd', 'production (bpd)', '100,000') + '</div>'
    + '<div class="jn-tank">' + f('price', 'price (US$/bbl, optional)', '—') + '</div>';
  var num0 = function (x) { var s = String(x || '').trim().replace(/\s/g, ''); if (!s) return null; var n = Number(/^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s.replace(/,/g, '')); return isFinite(n) && n >= 0 ? n : null; };
  var num = function (x) { var n = num0(x); return n ? n : null; };
  var cap = num(v.cap), inv0 = num0(v.inv), bpd = num(v.bpd), price = num(v.price);
  var pc = planCodes(p), c = pc.c, n = nextL(c, iNow);
  var crit = CSHORT[pc.crit] + (pc.fell ? ', because the chosen criterion does not apply here' : '');
  /* the inventory was typed at v.at: production has run since (offloads, if any, are the user's to re-type) */
  var since = v.at ? Math.max(0, (Date.now() - v.at) / 3600e3) : 0;
  var inv = inv0 === null ? null : inv0 + (bpd ? bpd * since / 24 : 0);
  var ago = v.at && since >= 1 ? ' Inventory typed ' + Math.round(since) + ' h ago; counted with the production since then (no offloading in between), ~' + grp(inv) + ' bbl.' : '';
  if (cap && inv !== null && bpd && inv >= cap) {
    h += '<div class="jn-crit-a" role="alert"><span class="t">CRITICAL OFFLOADING</span><p>By your numbers the tanks are already full. ' + (n ? 'The next CLEARED window (' + esc(crit) + ') opens ' + esc(wtxt(AX[n.k])) + '.' : 'No CLEARED window (' + esc(crit) + ') in the 7 days of this forecast.') + esc(ago) + '</p></div>';
  } else if (cap && inv !== null && bpd) {
    var hours = (cap - inv) / bpd * 24, fullAt = Date.now() + hours * 3600e3;
    var fullT = new Date(fullAt).toISOString().slice(0, 13);
    var opens = n ? Date.parse(AX[n.k] + ':00:00Z') : null;
    var fullTxt = 'tanks full in ~' + Math.round(hours) + ' h (' + wtxt(fullT) + ')';
    if (opens === null || opens > fullAt) {
      var gap = opens === null ? null : (opens - fullAt) / 3600e3;
      var lost = gap === null ? null : gap / 24 * bpd;
      h += '<div class="jn-crit-a" role="alert"><span class="t">CRITICAL OFFLOADING</span><p>' + esc(fullTxt) + ', and ' + (n ? 'the next CLEARED window (' + esc(crit) + ') opens only ' + esc(wtxt(AX[n.k])) + ': ' + Math.round(gap) + ' h later.' : 'no CLEARED window (' + esc(crit) + ') in the 7 days of this forecast.')
        + (lost ? ' Deferred production, by your count: ~' + grp(lost) + ' bbl' + (price ? ' ≈ US$ ' + grp(lost * price) : '') + '.' : '') + esc(ago) + '</p></div>';
    } else h += '<p class="jn-crit-ok">' + esc(fullTxt) + '; the next CLEARED window (' + esc(crit) + ') opens ' + esc(wtxt(AX[n.k])) + ', ' + Math.round((fullAt - opens) / 3600e3) + ' h before.' + esc(ago) + '</p>';
  } else h += '<p class="jn-fine">Type storage, inventory and production: Janela puts "tanks full in X h" beside the next offloading window. The numbers stay in this browser only.</p>';
  return h + '</div>';
}
function waitCost(p) {
  var rate = rateOf();
  var h = '<div><div class="jn-k">the cost of waiting · <b>your day rate</b></div><div class="jn-edit"><label>day rate (R$/day)<input class="jn-in wide" id="jn-rate" inputmode="numeric" value="' + (rate ? grp(rate) : '') + '" placeholder="e.g. 250,000"></label></div>';
  var pc = planCodes(p), c = pc.c;
  var n = c ? nextL(c, iNow) : null;
  if (pc.fell) h += '<p class="jn-fine">By the measured band: the chosen criterion does not apply here.</p>';
  if (rate) {
    if (n) { var hrs = Math.max(0, (Date.parse(AX[n.k] + ':00:00Z') - Date.now()) / 3600e3); h += '<p class="jn-p">Waiting until ' + esc(wtxt(AX[n.k])) + ' (' + cv(Math.round(hrs) + ' h') + ') costs <b>' + cv(brl(hrs / 24 * rate)) + '</b> at your day rate.</p>'; }
    else { var last = Math.max(0, (Date.parse(AX[AX.length - 1] + ':00:00Z') - Date.now()) / 3600e3); h += '<p class="jn-p">No CLEARED window in this forecast: the wait runs past ' + cv(Math.round(last) + ' h') + ', more than <b>' + cv(brl(last / 24 * rate)) + '</b> at your day rate.</p>'; }
  } else h += '<p class="jn-fine">The value is yours: Janela does not invent a day rate. It stays in this browser only.</p>';
  return h + '</div>';
}
/* the day rate typed in this browser: an English entry (250,000) or one kept from the Portuguese page (250.000) */
function rateOf() { var s = String(store.get('diaria') || '').trim().replace(/\s/g, ''); return Number(/^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s.replace(/,/g, '')) || null; }
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
    notes.push(short(p) + ' has no hindcast node in its region: the month shows the area chosen below (Santos to begin with), not the unit\'s.');
    return 'santos';
  })();
  var lim = S.ml || (function () {
    var l = cur && cur.op.limits.filter(function (x) { return x.var === 'hs'; })[0]; if (!l) return '2.0';
    var v = Number(l.value), grid = W.limits.map(Number).sort(function (a, b) { return a - b; });
    var below = grid.filter(function (x) { return x <= v + 1e-9; }), g = below.length ? below[below.length - 1] : grid[0];
    if (Math.abs(g - v) > 1e-9) notes.push('Your limit, Hs ' + dc(l.value) + ' m, is not on the counted grid (' + grid.map(function (x) { return dc(x.toFixed(1)); }).join(', ') + ' m): the month shows ' + dc(g.toFixed(1)) + ' m, ' + (g < v ? 'the step below — it counts fewer windows than your limit would.' : 'the smallest step, ABOVE your limit — it counts more windows than your limit would.'));
    return g.toFixed(1);
  })();
  var tr = S.mt || (function () {
    var t = cur ? C.trOf(cur.op.TR) : 48, grid = W.periods.slice().sort(function (a, b) { return a - b; });
    var up = grid.filter(function (x) { return x >= t; }), g = up.length ? up[0] : grid[grid.length - 1];
    if (g !== t) notes.push('Your ' + t + ' h window is not on the grid (' + grid.join(', ') + ' h): the month shows ' + g + ' h, ' + (g > t ? 'the next longer one — it counts fewer windows.' : 'the longest counted — it counts more windows than yours.'));
    return g;
  })();
  S.ms = siteK; S.ml = lim; S.mt = tr;
  if (fresh) S.mnotes = notes;
  [['jn-m-site', 'data-ms', siteK], ['jn-m-lim', 'data-ml', lim], ['jn-m-tr', 'data-mt', String(tr)]].forEach(function (a) {
    [].forEach.call($(a[0]).querySelectorAll('[' + a[1] + ']'), function (b) { b.setAttribute('aria-checked', b.getAttribute(a[1]) === a[2] ? 'true' : 'false'); });
  });
  var s = W.sites[siteK], c = s.cells[lim + 'm/' + tr + 'h'], name = s.name;
  if (!c) { $('jn-m-season').innerHTML = '<p class="jn-p">No count for this combination.</p>'; return; }
  drawCampaign(siteK, lim, tr, c);
  var pct = function (w, n) { return n ? dc((Math.floor((w * 2000 + n) / (2 * n)) / 10).toFixed(1)) + '%' : '—'; };
  var sum = function (arr, ms) { var a = 0, b = 0; ms.forEach(function (m) { a += arr[m][0]; b += arr[m][1]; }); return [a, b]; };
  var WIN = [5, 6, 7], SUM = [11, 0, 1];
  var wo = sum(c.o, WIN), so = sum(c.o, SUM), wf = sum(c.f, WIN), sf = sum(c.f, SUM);
  var ws = c.s ? sum(c.s.c, WIN) : null, ss = c.s ? sum(c.s.c, SUM) : null;
  var ratio = so[0] / so[1] > 0 && wo[0] / wo[1] > 0 ? (1 - wo[0] / wo[1]) / Math.max(1e-9, 1 - so[0] / so[1]) : null;
  var mnote = S.mnotes && S.mnotes.length ? '<p class="jn-fine jn-mnote">' + S.mnotes.map(esc).join(' ') + '</p>' : '';
  $('jn-m-season').innerHTML = mnote + '<div class="jn-k">the month · the season · <b>' + esc(name.replace(/ — .*$/, '')) + ' · Hs ≤ ' + dc(lim) + ' m for ' + tr + ' h</b></div><div class="jn-season">'
    + '<div><div class="jn-k">winter · Jun–Aug</div><div class="big">' + pct(wo[0], wo[1]) + '</div><div class="s">of starts have a window (the sea allows). Table 4-1 leaves ' + pct(wf[0], wf[1]) + (ws ? '; the site α would leave ' + chv(pct(ws[0], ws[1])) : '') + '.</div></div>'
    + '<div><div class="jn-k">summer · Dec–Feb</div><div class="big">' + pct(so[0], so[1]) + '</div><div class="s">of starts have a window. Table 4-1 leaves ' + pct(sf[0], sf[1]) + (ss ? '; the site α would leave ' + chv(pct(ss[0], ss[1])) : '') + '.</div></div></div>'
    + '<p class="jn-fine">Exact counts (' + grp(wo[0]) + ' of ' + grp(wo[1]) + ' starts in winter, ' + grp(so[0]) + ' of ' + grp(so[1]) + ' in summer)' + (ratio && ratio > 1.15 ? '; the time stopped in winter is ' + dc(ratio.toFixed(1)) + '× summer\'s' : '') + '. ' + (c.s ? 'The site α is an estimate (90% interval); the count on it is exact.' : 'The site α has a count only where it was estimated (Hs 2.0 m in the measured basins).') + '</p>';
  /* the chart: 12 months, three bars */
  var H = 170, y = function (v) { return 14 + (H - 36) * (1 - v / 100); }, gw = (CW - PLft - PRt) / 12, three = !!c.s, bw = Math.min(9, gw * (three ? 0.26 : 0.36)), o = [];
  [0, 25, 50, 75, 100].forEach(function (t) { o.push('<line class="gl" x1="' + PLft + '" x2="' + (CW - PRt) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/><text class="ax" x="' + (PLft - 5) + '" y="' + (y(t) + 3.5).toFixed(1) + '" text-anchor="end">' + t + '%</text>'); });
  for (var m = 0; m < 12; m++) {
    var cx = PLft + gw * m + gw / 2;
    (three ? [[c.o[m], 'w1', cx - 1.5 * bw - 1], [c.f[m], 'w2', cx - bw / 2], [c.s.c[m], 'w3', cx + bw / 2 + 1]] : [[c.o[m], 'w1', cx - bw - 0.5], [c.f[m], 'w2', cx + 0.5]]).forEach(function (b) {
      var pv = b[0][1] ? 100 * b[0][0] / b[0][1] : 0, top = y(pv);
      o.push('<rect ' + (b[1] === 'w3' ? ext(W.CHOSEN, 'w3', 1) : 'class="' + b[1] + '"') + ' x="' + b[2].toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, y(0) - top).toFixed(1) + '" rx="1.5"/>');
    });
    o.push('<text class="ax" x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + MON[m].slice(0, 1).toUpperCase() + '</text>');
  }
  $('jn-m-chart').innerHTML = '<div class="jn-k">by month · starts with a window</div><figure class="jn-fig"><svg viewBox="0 0 ' + CW + ' ' + H + '" role="img" aria-label="' + esc('Windows by month at ' + name + ', Hs ≤ ' + dc(lim) + ' m for ' + tr + ' h: the sea allows, Table 4-1 leaves' + (three ? ', the site α would leave' : '') + '.') + '">' + o.join('') + '</svg>'
    + '<ul class="jn-key"><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="w1" x="1" y="1" width="20" height="8" rx="1.5"/></svg>the sea allows (Hs ≤ ' + dc(lim) + ' m)</li><li><svg viewBox="0 0 22 10" aria-hidden="true"><rect class="w2" x="1" y="1" width="20" height="8" rx="1.5"/></svg>Table 4-1 leaves (OPWF ' + dc(c.wf) + ' m)</li>'
    + (three ? '<li class="fc"><svg viewBox="0 0 22 10" aria-hidden="true"><rect ' + ext(W.CHOSEN, 'w3', 1) + ' x="1" y="1" width="20" height="8" rx="1.5"/></svg>the site α would leave (' + dc(c.s.wf) + ' m): chosen, the lower end of the estimated α; the count on it is exact</li>' : '') + '</ul>'
    + (three && PR && PR.legend ? PR.legend.dch : '') + '</figure>';
  /* the table: % and days of window per month, the mean wait */
  var DIM = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var days = function (r, mm) { return r[1] ? dc((r[0] / r[1] * DIM[mm]).toFixed(1)) : '—'; };
  var rows = '';
  for (var k = 0; k < 12; k++) rows += '<tr><td>' + MON[k] + '</td><td>' + pct(c.o[k][0], c.o[k][1]) + '</td><td>' + days(c.o[k], k) + '</td><td>' + pct(c.f[k][0], c.f[k][1]) + '</td><td>' + days(c.f[k], k) + '</td>' + (three ? '<td class="est">' + chv(days(c.s.c[k], k)) + '</td>' : '') + '<td>' + dc(c.o[k][2] || '—') + '</td><td>' + dc(c.f[k][2] || '—') + '</td></tr>';
  rows += '<tr class="y"><td>year</td><td>' + pct(c.o[12][0], c.o[12][1]) + '</td><td>' + dc((c.o[12][0] / c.o[12][1] * 365.25).toFixed(0)) + '</td><td>' + pct(c.f[12][0], c.f[12][1]) + '</td><td>' + dc((c.f[12][0] / c.f[12][1] * 365.25).toFixed(0)) + '</td>' + (three ? '<td class="est">' + chv(dc((c.s.c[12][0] / c.s.c[12][1] * 365.25).toFixed(0))) + '</td>' : '') + '<td>' + dc(c.wo) + '</td><td>' + dc(c.wfw) + '</td></tr>';
  $('jn-m-table').innerHTML = '<div class="jn-k">window days per month · mean wait (h)</div><div class="tw"><table class="jn-tbl"><thead><tr><th>month</th><th>sea</th><th>days</th><th>tab.</th><th>days</th>' + (three ? '<th>site α</th>' : '') + '<th>wait sea</th><th>wait tab.</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p class="jn-fine">Hindcast Ifremer WAVEWATCH III at the area\'s node, ' + esc(W.from.slice(0, 4)) + '–' + esc(W.to.slice(0, 4)) + '; days = exact fraction × days in the month; wait = hours from a start to the next start with a window. The table\'s wait uses the OPWF.</p>';
  var rate = rateOf();
  var lostDays = c.o[12][0] / c.o[12][1] * 365.25 - c.f[12][0] / c.f[12][1] * 365.25;
  var dWait = Number(c.wfw) - Number(c.wo);
  $('jn-m-cost').innerHTML = '<div class="jn-k">what Table 4-1 costs · <b>your day rate</b></div><div class="jn-edit"><label>day rate (R$/day)<input class="jn-in wide" id="jn-rate-m" inputmode="numeric" value="' + (rate ? grp(rate) : '') + '" placeholder="e.g. 250,000"></label></div>'
    + '<p class="jn-p">Per year, the table\'s α closes <b>' + cv(dc(lostDays.toFixed(0)) + ' days', 'computed: exact fractions times 365.25 days, in floating point') + '</b> of window that the sea opens, and the mean wait for the next window goes from ' + dc(c.wo) + ' h to ' + dc(c.wfw) + ' h (+' + dc(dWait.toFixed(1)) + ' h per operation).'
    + (rate ? ' At your day rate: <b>' + cv(brl(dWait / 24 * rate)) + '</b> more waiting per operation.' : '') + (c.s ? ' With the site α (chosen within the estimated interval), the wait would be ' + chv(dc(c.s.w) + ' h') + '.' : '') + '</p>';
  $('jn-m-rests').innerHTML = restsMonth(siteK, c);
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
      if (hex !== h.sha256) throw new Error('the hindcast of ' + node + ' does not match its sha256');
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
  el.innerHTML = '<p class="jn-fine">Counting ' + (CFG.plan.hindcast[siteK].to.slice(0, 4) - CFG.plan.hindcast[siteK].from.slice(0, 4) + 1) + ' campaigns, one per year…</p>';
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
    el.innerHTML = '<p class="jn-p">Starting on ' + mon + ' 1, <b>' + N + ' operation' + (N === 1 ? '' : 's') + ' of ' + tr + ' h with Hs ≤ ' + dc(lim) + ' m</b>: in half of the ' + sea.finished + ' years, done in <b>' + d(sea.q50) + ' days</b>; in 9 of every 10, in ' + d(sea.q90) + '; in the worst year (' + sea.worstYear + '), ' + d(sea.worst) + '.</p>'
      + '<div class="tw"><table class="jn-tbl"><thead><tr><th>days to finish</th><th>half the years</th><th>9 of 10</th><th>the worst</th></tr></thead><tbody>'
      + row('the sea (limit ' + dc(lim) + ' m)', sea) + (tab ? row('Table 4-1 (OPWF ' + dc(Q.dec(Q.parse(opwf), 2)) + ' m)', tab) : '')
      + (loc ? row('<i>site α (OPWF ' + dc(Q.dec(Q.parse(sopwf), 2)) + ' m)</i>', loc) : '') + '</tbody></table></div>'
      + '<p class="jn-fine">Every year of the hindcast runs the campaign: the first window after ' + mon + ' 1, the operation takes the window, the next one searches from its end (no transit, no wait for mobilisation). The quantiles are exact order statistics of the years that finish' + (sea.censored ? '; ' + sea.censored + ' year' + (sea.censored > 1 ? 's do' : ' does') + ' not finish before the record ends and ' + (sea.censored > 1 ? 'are' : 'is') + ' left out, counted' : '') + '. A hindcast is a model\'s past sea (' + esc(CFG.plan.source) + '); the arithmetic is exact over it, and only that.</p>';
  }).catch(function (e) { if (el) el.innerHTML = '<p class="jn-p">The campaign could not be counted: ' + esc(e.message) + '.</p>'; });
}

/* ================================================================ the scoreboard */
function drawPlacar() {
  var el = $('jn-props');
  if (!T || !T.ledger) { el.innerHTML = '<div class="jn-box"><p class="jn-p">The scoreboard comes with the day\'s data, which did not load.</p></div>'; return; }
  var NAMES = CFG.proposerNames || {};   /* the proposers' English names; the day carries them in Portuguese */
  var d = function (iso) { return iso ? iso.slice(0, 10) : '—'; };
  /* the admission as placar.js decided it in the day's build: trials are target days, the tail is read at 30·2^j days;
     a status word, never a verdict glyph (ADMITTED is not CLEARED) */
  var first = T.ledger.firstLook || 30;
  el.innerHTML = T.ledger.proposers.map(function (p) {
    var cut = p.status === 'DEADMITTED', st, line;
    if (p.pending === undefined) p.pending = !cut;      /* a day built before admission-v1 carried no looks: nothing tested */
    if (cut && p.prunedAt) { st = '<span class="jn-w jn-st cut">PRUNED</span>'; line = 'pruned on trial day ' + p.prunedAt.m + ' (' + d(p.prunedAt.through) + '): ' + p.prunedAt.covered + ' covered, exact tail ' + esc(p.prunedAt.tail) + ' ≤ ' + esc(p.prunedAt.bar) + '. This version does not come back; only a recalibrated one, with a new record.'; }
    else if (p.pending) { st = '<span class="jn-w jn-st pend">UNDER EVALUATION</span>'; line = (p.trials || 0) + ' of ' + first + ' trial days: nothing tested yet. The first reading of the tail is on day ' + first + '; ' + (p.decides === false ? (/ens-|gefs/.test(p.domain) ? 'a raw ensemble: shown and scored, it never decides.' : 'a band scored beside the deciding one: it does not decide yet.') : 'until then the band decides and the scoreboard only counts.'); }
    else { var lk = p.looks[p.looks.length - 1] || {}; st = '<span class="jn-w jn-st ok">ADMITTED</span>'; line = p.trialsCovered + ' of ' + p.trials + ' trial days covered; at the reading of ' + lk.m + ' days, exact tail ' + esc(lk.tail) + ' > ' + esc(lk.bar) + '; next reading at ' + p.next + ' days.'; }
    return '<div class="jn-box jn-prop"><div class="jn-k">' + esc(NAMES[p.domain] || p.name || p.domain) + '</div><div class="big">' + grp(p.commits) + '</div><p class="jn-p">bands committed before the target hour · '
      + p.scored + ' scored · ' + p.covered + ' covered · claim ' + esc(p.claim) + ' · ' + p.sites + ' open-sea sites · since ' + d(p.first) + '</p>'
      + '<div class="jn-adm">' + st + '</div><p class="jn-fine">' + line + '</p>' + breakdownHtml(p)
      + (p.scored === 0 ? '<p class="jn-fine">None scored yet: scoring starts when the satellites pass and the days close (three days later, when NOAA\'s archive is complete). The record is append-only.</p>' : '') + '</div>';
  }).join('') + h2hHtml(T.ledger.h2h) + decisionsHtml(T.ledger.decisions);
}

/* the providers HEAD TO HEAD on the same targets (placar.js headToHead): descriptive */
function h2hHtml(H) {
  if (!H) return '';
  var any = H.some(function (h) { return h.n; });
  var num = function (x) { return x === null ? '—' : cv(dc(x.toFixed(2)), 'computed: a mean in floating point'); };
  var rows = H.map(function (h) {
    return '<tr><td>' + esc(EN.pairs[h.a + '|' + h.b] || h.name) + '</td><td>' + grp(h.n) + '</td><td>' + h.onlyA + ' · ' + h.onlyB + '</td><td>' + num(h.widthA) + ' · ' + num(h.widthB) + '</td><td>' + (h.sameClaim ? num(h.winklerA) + ' · ' + num(h.winklerB) : 'different claims') + '</td></tr>';
  }).join('');
  return '<div class="jn-box"><div class="jn-k">Head to head · the same targets, the same satellites</div>'
    + (any ? '<div class="tw"><table class="jn-tbl"><thead><tr><th>pair</th><th>targets</th><th>only one covered</th><th>mean width (m)</th><th>Winkler score</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<p class="jn-p">No target scored yet: the head to head starts with the first scored passes, three days after the day closes.</p>')
    + '<p class="jn-fine">Each pair is judged only where both bet on the same target (same site, run and lead, hence the same pass). "Only one covered": how many times only the first · only the second was right. The Winkler score (the width plus the penalty for missing; lower is better) is compared only between bands with the same claim. Descriptive counts, not admission.</p></div>';
}

/* the published DECISIONS graded against the satellite (decision-level-v1): Hs only, descriptive counts */
function decisionsHtml(D) {
  if (!D) return '';
  var CN = { band: 'measured band', table: 'DNV Tab. 4-1', site: 'site α' };
  var rows = ['band', 'table', 'site'].map(function (c) {
    var b = D.byCrit[c];
    return '<tr><td>' + CN[c] + '</td><td>' + b.L.held + '</td><td>' + b.L.broke + '</td><td>' + b.V.confirmed + '</td><td>' + b.V.open + '</td><td>' + (b.L.unseen + b.V.unseen) + '</td></tr>';
  }).join('');
  var first = D.days && D.days.length ? D.days[0].slice(0, 10) : null;
  return '<div class="jn-box"><div class="jn-k">The decisions, checked by satellite</div>'
    + (D.graded ? '<div class="tw"><table class="jn-tbl"><thead><tr><th>criterion</th><th>CLEARED held</th><th>CLEARED broke</th><th>BLOCKED confirmed</th><th>BLOCKED opened</th><th>no pass</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + (D.brokeAll ? '<p class="jn-fine">CLEARED that the sea broke: ' + D.broke.map(function (x) { return esc(x.site + ' · ' + ((preset(x.preset) || {}).name || x.preset) + ' · ' + CN[x.crit] + ' · start ' + x.start.slice(0, 10) + ' ' + x.start.slice(11, 13) + ':00 · Hs ' + x.hs.map(function (h) { return dc(h[1]); }).join(', ') + ' m'); }).join('; ') + (D.brokeAll > D.broke.length ? '; …' : '') + '.</p>' : '')
      : '<p class="jn-p">No window checked yet' + (first ? ': the decisions are kept since ' + first + ', and each day is checked three days after it closes, when NOAA\'s archive is complete.' : '.') + '</p>')
    + '<p class="jn-fine">Hs only, the variable the altimeter measures as the decision means it, at the window\'s steps with a pass within 3 h. Descriptive counts: a day\'s windows overlap and share passes. Rule fixed on 2026-10-07, before the first check.</p></div>';
}

/* the scored rows per site and per lead: descriptive (a day's rows share their overflights) — the admission reads trials */
function breakdownHtml(p) {
  if (!p.scored || !p.bySite) return '';
  var cell = function (x) { return x[1] + '/' + x[0]; };
  var sites = Object.keys(p.bySite).sort().map(function (sid) { return '<tr><td>' + esc(PL[sid] ? short(PL[sid]) : sid) + '</td><td>' + cell(p.bySite[sid]) + '</td></tr>'; }).join('');
  var leads = Object.keys(p.byLead || {}).map(function (k) { return '<tr><td>' + esc(EN.leads[k] || k) + '</td><td>' + cell(p.byLead[k]) + '</td></tr>'; }).join('');
  return '<table class="jn-tbl jn-bd"><thead><tr><th>site</th><th>covered/scored</th></tr></thead><tbody>' + sites + '</tbody>'
    + (leads ? '<thead><tr><th>lead</th><th></th></tr></thead><tbody>' + leads + '</tbody>' : '') + '</table>'
    + '<p class="jn-fine">A descriptive count: the bands of one day share the same satellite passes; the admission reads the trial days.</p>';
}

/* ================================================================ modes, selection, render */
function setMode(m) {
  S.mode = m;
  [].forEach.call($('jn-modes').querySelectorAll('[data-mode]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
  ['semana', 'mes', 'placar'].forEach(function (k) { $('pane-' + k).hidden = k !== m; });
  if (m === 'mes') drawMonth();
  if (m === 'placar') drawPlacar();
  drawBoard(); pad();
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
  reveal(id);
}
/* the chosen place is brought into the clear part of the map (not under the rail, the board or the sheet) */
function reveal(id) {
  if (!id || !MAP.map || !PL[id]) return;
  var pt = MAP.map.project([PL[id].lon, PL[id].lat]), vis = viewRect(), m = 40;
  if (MAP.map.getZoom() < 6.2) MAP.map.easeTo({ center: [PL[id].lon, PL[id].lat], zoom: 6.6, duration: 700 });
  else if (pt.x < vis.l + m || pt.x > vis.r - m || pt.y < vis.t + m || pt.y > vis.b - m) MAP.map.easeTo({ center: [PL[id].lon, PL[id].lat], duration: 500 });
}
function change() { memo = memo || {}; S.ml = null; S.mt = null; render(); hash(); }
function render() {
  if (!T) return;
  answer(); drawClock(); drawOps(); drawCrit(); drawCard(); drawList(); drawBoard();
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
    else if (L.length) { S.edit = { limits: L, TR: tr }; S.adj = true; }
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
  else if ((e.key === 'q' || e.key === 'Q') && boardOn()) { BD.open = !BD.open; store.set('board', BD.open ? '1' : '0'); drawBoard(); pad(); }
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
  $('jn-grip').setAttribute('aria-label', st === 'full' ? 'Show less of the panel' : 'Show more of the panel');
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
function colors() { ['--paper', '--surface', '--surface2', '--ink', '--ink-2', '--ink-3', '--ink-4', '--ink-5', '--rule', '--rule-strong', '--v-cert', '--witness', '--v-refd', '--v-cert-soft', '--witness-soft', '--v-refd-soft'].forEach(function (k) { COL[k] = tok(k); }); }
colors();
var MONO = tok('--f-mono');
function viewRect() {
  var w = window.innerWidth, h = window.innerHeight, top = phone.matches ? 48 : 56;
  if (phone.matches) return { l: 0, r: w, t: top, b: h - sheetPx(S.sheet === 'full' ? 'half' : S.sheet) };
  var rail = $('panel').getBoundingClientRect(), bd = $('jn-board');
  var b = bd && !bd.hidden ? bd.getBoundingClientRect().top - 8 : h;
  return { l: 0, r: rail.left, t: top, b: b };
}
var BOUNDS = [[-53, -33.5], [-33, 4.5]], BOUNDS_PHONE = [[-51, -33], [-32.5, 4.5]];
function pad() {
  if (!MAP.map) return;
  boardState();                                    /* the board's height is part of the view, before any fit */
  var w = window.innerWidth, h = window.innerHeight, v = viewRect();
  var P = { top: v.t + (phone.matches ? 34 : 44), bottom: h - v.b + 8, left: phone.matches ? 8 : 12, right: w - v.r + (phone.matches ? 8 : 12) };
  if (T && !MAP.fitted && MAP.ready) { MAP.fitted = true; MAP.map.fitBounds(phone.matches ? BOUNDS_PHONE : BOUNDS, { padding: phone.matches ? Object.assign({}, P, { right: P.right + 34, left: P.left + 10 }) : P, duration: 0 }); reveal(S.site); return; }
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
  if (!window.maplibregl) { status('the map did not load; the panel works without it'); return; }
  var map;
  try {
    map = new maplibregl.Map({ container: 'map', style: mapStyle(), bounds: BOUNDS, maxBounds: [[-98, -54], [-2, 18]], minZoom: 2, maxZoom: 10.5,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0, renderWorldCopies: false, fadeDuration: 0,
      attributionControl: { compact: true, customAttribution: 'ECMWF open data (CC BY 4.0) · NOAA · E.U. Copernicus Marine Service Information · ANP — GeoMaps · Natural Earth' } });
  } catch (e) { status('the map did not open (' + e.message + '); the panel works without it'); return; }
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
  else if (v === 'V') { path(); c.lineWidth = 1.6; c.strokeStyle = COL['--witness']; c.stroke(); var k = r * 0.55; c.beginPath(); c.moveTo(x - k, y - k); c.lineTo(x + k, y + k); c.moveTo(x + k, y - k); c.lineTo(x - k, y + k); c.stroke(); }
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
  MK.drawn = []; PLACED = []; var LBL = [], BLBL = [], PILLS = [];
  /* the overlays drawn over the map are taken: no name or label hides under the clock chip */
  var ck = $('jn-clock'), cr = ck && ck.getBoundingClientRect(); if (cr && cr.width) { PLACED.push([cr.left - 4, cr.top - 4, cr.right + 4, cr.bottom + 4]); }
  /* the selected place's label is placed first, so nothing hides it */
  var selP = S.site && PL[S.site] && STEPS[S.site] ? PL[S.site] : null;
  var selBox = null;
  if (selP) { var sq = map.project([selP.lon, selP.lat]); selBox = [sq.x - 14, sq.y - 14, sq.x + 14 + short(selP).length * 8, sq.y + 14]; PLACED.push(selBox); }
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
    /* nor on the chosen place's name and ring, placed first: it steps down below them */
    if (selBox) { var sb = selBox; if (x0 < sb[2] && x0 + bw > sb[0] && y0 < sb[3] && y0 + bh > sb[1]) { y0 = sb[3] + 6; cy = y0 + bh / 2; } }
    /* nor under the top bar or the clock chip: like the screen's edge, they push it down */
    var yTop = parseFloat(tok('--jn-top')) + 4, y00 = y0; if (y0 < yTop) y0 = yTop;
    if (cr && cr.width && x0 < cr.right + 4 && x0 + bw > cr.left - 4 && y0 < cr.bottom + 4 && y0 + bh > cr.top - 4) y0 = cr.bottom + 6;
    /* a pill pushed off its place stacks under the pills already there, never on them */
    if (y0 !== y00) { for (var pk = 0; pk < PILLS.length; pk++) { var pb = PILLS[pk]; if (x0 < pb[2] && x0 + bw > pb[0] && y0 < pb[3] + 4 && y0 + bh > pb[1]) { y0 = pb[3] + 4; pk = -1; } } }
    cy = y0 + bh / 2;
    c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, bw, bh, 6); else c.rect(x0, y0, bw, bh);
    c.fillStyle = COL['--surface']; c.fill(); c.lineWidth = 1; c.strokeStyle = COL['--rule-strong']; c.stroke();
    c.restore();
    glyph(c, x0 + 10, cy - 1, 4.2, cnt.L ? 'L' : (cnt.I ? 'I' : cnt.V ? 'V' : 'S'), false, false);
    c.save(); c.font = '600 11px ' + MONO; c.textBaseline = 'middle'; c.fillStyle = COL['--ink']; c.fillText(txt, x0 + 18, cy - 1);
    /* the mix, as a hairline bar under the count: the count is the word, the bar the gist */
    var tot = gg.m.length, bx = x0 + 4, bwid = bw - 8, by = y0 + bh - 3.5, acc = 0;
    [['L', COL['--v-cert']], ['I', COL['--ink-2']], ['V', COL['--witness']], ['S', COL['--v-refd']], ['x', COL['--ink-5']]].forEach(function (s) {
      var ww = cnt[s[0]] / tot * bwid; if (!ww) return; c.fillStyle = s[1]; c.fillRect(bx + acc, by, Math.max(1, ww - 1), 2); acc += ww; });
    c.restore();
    PLACED.push([x0, y0, x0 + bw, y0 + bh]); PILLS.push([x0, y0, x0 + bw, y0 + bh]);
    /* the pill's basin, named above it once every pill is down (a reviewer reads "Campos 33/33", not a bare fraction) */
    var bc = {}, bb = null; gg.m.forEach(function (o) { var b = BASIN[o.p.id]; bc[b] = (bc[b] || 0) + 1; if (!bb || bc[b] > bc[bb]) bb = b; });
    if (bb && bb !== 'Coast and terminals') BLBL.push({ t: bb.toUpperCase(), cx: cx, y0: y0 });
    MK.drawn.push({ kind: 'cluster', members: gg.m.map(function (o) { return o.p; }), cnt: cnt, x: cx, y: cy, r: bw / 2 });
  });
  BLBL.forEach(function (l) {
    c.save(); c.font = '600 9.5px ' + tok('--f-sans'); c.textBaseline = 'bottom';
    var lw = c.measureText(l.t).width, lx = Math.min(Math.max(l.cx - lw / 2, 4), w - lw - 4), lb = [lx - 2, l.y0 - 14, lx + lw + 2, l.y0 - 2];
    if (!PLACED.some(function (q) { return lb[0] < q[2] && lb[2] > q[0] && lb[1] < q[3] && lb[3] > q[1]; })) {
      c.lineWidth = 3; c.strokeStyle = COL['--paper']; c.strokeText(l.t, lx, l.y0 - 3); c.fillStyle = COL['--ink-3']; c.fillText(l.t, lx, l.y0 - 3); PLACED.push(lb);
    }
    c.restore();
  });
  /* the board's hovered row, found on the map wherever it is (inside a pill or not): a ring and its name */
  if (BD.hov && PL[BD.hov] && BD.hov !== S.site) {
    var hp = PL[BD.hov], hq = map.project([hp.lon, hp.lat]);
    if (hq.x > -20 && hq.x < w + 20 && hq.y > -20 && hq.y < h + 20) {
      c.save(); c.beginPath(); c.arc(hq.x, hq.y, 11, 0, Math.PI * 2); c.lineWidth = 1.5; c.strokeStyle = COL['--ink']; c.stroke(); c.restore();
      label(c, hq.x + 16, hq.y, short(hp), true);
    }
  }
  /* the names last, each only where it collides with no glyph, pill or name already down */
  LBL.sort(function (a, b) { return (b[3] === 'own') - (a[3] === 'own'); }).forEach(function (l) { label(c, l[0], l[1], l[2], l[3]); });
}
function hit(pt, tol) {
  var best = null, bd = 1e9;
  MK.drawn.forEach(function (d) { var dd = Math.hypot(d.x - pt.x, d.y - pt.y) - (d.kind === 'cluster' ? d.r * 0.6 : d.r); if (dd < tol && dd < bd) { bd = dd; best = d; } });
  return best;
}
function boardLight(ids) {
  var grid = $('jn-bgrid'); if (!grid || $('jn-board').hidden) return;
  [].forEach.call(grid.querySelectorAll('.jn-brow.hov'), function (r) { r.classList.remove('hov'); });
  (ids || []).forEach(function (id) { var r = grid.querySelector('.jn-brow[data-site="' + id + '"]'); if (r) r.classList.add('hov'); });
}
function hover(pt) {
  var h = hit(pt, 12), map = MAP.map;
  map.getCanvas().style.cursor = h ? 'pointer' : '';
  boardLight(h ? (h.kind === 'place' ? [h.p.id] : h.members.map(function (p) { return p.id; })) : null);
  if (h && h.kind === 'place') {
    var p = h.p, c = codes(p.id), n = c ? nextL(c, iNow) : null;
    tip('<b>' + esc(short(p)) + '</b> ' + esc(subOf(p)) + '<br>' + chip(h.v) + ' ' + esc(current().name) + ', ' + esc(CSHORT[S.crit]) + ', ' + esc(wtxt(AX[S.i])) + '<br>' + (n ? 'next CLEARED window ' + esc(wtxt(AX[n.k])) : 'no CLEARED window in this forecast'), pt);
    return;
  }
  if (h) { tip('<b>' + h.members.length + ' places</b><br>' + h.cnt.L + ' CLEARED · ' + h.cnt.I + ' UNDECIDED · ' + h.cnt.V + ' BLOCKED · ' + h.cnt.S + ' NEEDS DATA<br>click to zoom in', pt); return; }
  var f = map.getLayer('fields-fill') ? map.queryRenderedFeatures(pt, { layers: ['fields-fill'] }) : [];
  if (f.length) { var pr = f[0].properties; tip('<b>Field ' + esc(pr.n) + '</b><br>' + esc(pr.b) + ' basin · ' + esc(STAGE[String(pr.e || '').trim()] || pr.e) + ' (ANP)', pt); return; }
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
function resize() { FIELD.dirty = true; FIELD.clear = true; if (MAP.map) MAP.map.resize(); drawBoard(); pad(); drawMarks(); }
window.addEventListener('resize', resize);

/* ================================================================ loading */
var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
function fetchFirst(urls, kind) {
  var i = 0;
  return new Promise(function (res, rej) {
    (function next() {
      if (i >= urls.length) { rej(new Error('no source answered')); return; }
      var u = urls[i++];
      fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return kind === 'json' ? r.json() : r.arrayBuffer(); }).then(res, next);
    })();
  });
}
function script(src, name) {
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = src; s.onload = function () { if (window[name]) res(window[name]); else rej(new Error('empty')); };
    s.onerror = function () { rej(new Error('no ' + src)); }; document.body.appendChild(s);
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
  if (kv.rodada && kv.rodada !== T.run) status('this link was made on the run of ' + kv.rodada.slice(0, 10) + ' ' + kv.rodada.slice(11, 13) + ' UTC; you see the current one, ' + T.run.slice(0, 10) + ' ' + T.run.slice(11, 13) + ' UTC');
  FIELD.target = S.i; FIELD.tf = S.i;
  var run = T.run.slice(0, 10) + ' ' + T.run.slice(11, 13) + ' UTC', made = T.madeAt.slice(0, 10) + ' ' + T.madeAt.slice(11, 16) + ' UTC';
  var mb = new Date(Date.parse(T.madeAt) - 3 * 3600e3).toISOString();
  $('jn-run').innerHTML = 'forecast <b>' + esc(run) + '</b><span class="jn-read"> · read ' + esc(MON[+mb.slice(5, 7) - 1] + ' ' + (+mb.slice(8, 10)) + ' ' + mb.slice(11, 16)) + ' BRT</span>';
  $('jn-run').title = 'ECMWF and NOAA, run of ' + run + '; read ' + made + ' and decided in the same build';
  var lb = $('jn-load'); if (lb) lb.textContent = '';
  if (stale) status('old forecast: the run ' + run + ' has already passed; today\'s has not arrived yet');
  var late = $('jn-late');
  if (late && ageH > 36) {
    late.hidden = false;
    late.innerHTML = '<b>Forecast of ' + esc(run) + ', ' + Math.floor(ageH / 24) + ' day' + (ageH >= 48 ? 's' : '') + ' old.</b> Today\'s run did not arrive (the daily fetch failed or is late). The windows below are decided on the older forecast, with the measured band for its lead: check before deciding.';
    $('jn-run').classList.add('late');
  }
  tieField();
  /* the intro: open on a first visit, folded when the visitor folded it (or used a door) or arrived on a shared PLACE.
     Not on op/modo alone: the address bar carries them from the first render, so a copied link would fold it for
     the colleague it was sent to — the reader who most needs it */
  intro(!(store.get('intro') === 'shut' || (kv.site && PL[kv.site])), false);
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
  if (!runOk) { FIELD.F = null; FIELD.dirty = true; status('the map\'s field is from another run (' + FIELD.run0 + '); not drawn — the decisions do not depend on it'); return; }
  if (pin && window.crypto && crypto.subtle && FIELD.buf) {
    crypto.subtle.digest('SHA-256', FIELD.buf).then(function (d) {
      var hex = Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      if (hex !== pin) { FIELD.F = null; FIELD.dirty = true; status('the map\'s field is not what today\'s data pins (sha256); not drawn'); }
    }, function () { /* no digest here: the run check stands */ });
  }
}
function fail(e) {
  $('jn-answer').innerHTML = '<p class="jn-ans">Today\'s data did not arrive.</p><p class="jn-sub">' + esc(e && e.message || '') + ' · the campaign works without it; the method and the last record are at <a href="/janela/metodo/">/janela/metodo/</a></p>';
  status('without today\'s data'); setMode(S.mode === 'semana' ? 'mes' : S.mode);
  $('jn-check').textContent = 'The deciding modules are on this page; without the day\'s data, there are no published decisions to redo.';
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
  if (!PUBOK) { out.textContent = 'Today\'s data was made by another version of the app (model ' + T.model.slice(0, 8) + (T.model === CFG.model ? ', different modules' : ' ≠ ' + CFG.model.slice(0, 8)) + '): the map, the list and the card decide here, with this page\'s modules, on the published forecast — they do not read the published decisions. The check returns when the two meet again.'; return; }
  out.textContent = 'Redoing the published decisions in your browser…';
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
    out.textContent = (okAll ? 'Redone just now in your browser, in ' + dec(ms / 1000, 1) + ' s: the ' + grp(n) + ' published decisions, equal to the record — verdict, witness and threshold (sha256 ' + digest.slice(0, 12) + '…).'
      : 'CAUTION: redone here, ' + grp(n - same) + ' of ' + grp(n) + ' decisions differ from the record' + (digest !== T.digest ? ' (the digest too)' : '') + '.')
      + ' ' + (modOk === modN ? 'The ' + modN + ' modules that decide on this page carry their pinned sha256 and are the ones that made today\'s data.' : 'Modules with a different sha256: ' + modBad.join(', ') + '.');
    window.__janela.check = { n: n, same: same, digest: digest, ok: okAll, mods: modOk + '/' + modN, ms: ms };
    if (S.site) drawCard();                                /* the card's certificate shows the result */
    var two = T.second && T.second.equal === T.second.decisions;
    var rc = $('jn-run'); if (rc && okAll && !rc.querySelector('.jn-ok')) rc.insertAdjacentHTML('beforeend', ' · <span class="jn-ok" title="' + esc('every published decision was redone in this browser' + (two ? ' and by a second program, written apart (' + T.second.equal + ' of ' + T.second.decisions + ' equal)' : '')) + '">✓ checked' + (two ? ' 2×' : '') + '</span>');
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
  if (!x) return { name: (CFG.proposerNames && CFG.proposerNames[d]) || d, claim: '9/10', st: 'enters the scoreboard with the next run (no band recorded yet)', cut: false };
  var claim = x.claim || '9/10', first = (T.ledger && T.ledger.firstLook) || 30;
  var st = x.status === 'DEADMITTED' ? 'PRUNED' : x.pending !== false ? 'under evaluation, ' + (x.trials || 0) + ' of ' + first + ' days' : 'admitted, ' + x.trialsCovered + ' of ' + x.trials + ' days covered';
  return { name: (CFG.proposerNames && CFG.proposerNames[d]) || x.name || d, claim: claim, st: st, cut: x.status === 'DEADMITTED' };
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
  return '<div class="jn-cert"><div class="jn-k">this decision\'s certificate</div><ul class="jn-certl">'
    + line(ck ? ck.ok : null, ck ? (ck.ok ? 'Redone in your browser: the day\'s ' + grp(ck.n) + ' decisions, equal to the record.' : 'Redone in your browser: ' + grp(ck.n - ck.same) + ' decisions DIFFER from the record.') : 'Redoing in your browser…')
    + line(sec ? sec.equal === sec.decisions : null, sec ? 'A second verifier, written without reading the first (Python, no code in common): ' + grp(sec.equal) + ' of ' + grp(sec.decisions) + ' equal.' : 'Second verifier: it did not run for this data.')
    + line(ps ? !ps.cut : null, ps ? 'The band is a claim (' + esc(ps.name) + ', covers ' + esc(ps.claim) + '), checked in public against satellite: ' + esc(ps.st) + '.' : 'No measured band here: only Table 4-1 decides.')
    + (ps && ps.second ? line(!ps.second.cut, 'With the second band (' + esc(ps.second.name) + ', covers ' + esc(ps.second.claim) + '), ' + esc(ps.second.st) + ': the union of the two decides, which covers whenever either covers.') : '')
    + (ps && ps.union ? line(!ps.union.cut, 'The union, the band that decides, is also checked as itself (covers ≥ 9/10' + unionHeld(p) + '): ' + esc(ps.union.st) + '.') : '')
    + line(true, 'Exact arithmetic, in rationals: no rounding decides; the published band is rounded outward.')
    + '</ul><div class="jn-certb"><button type="button" class="jn-btn" id="jn-nota-b">Decision note ↓</button><button type="button" class="jn-btn" id="jn-cert-b">Certificate .json ↓</button></div></div>';
}
/* the union's held-out record at this place's measured region (certs/janela-providers-eval*.json, via numbers.js) */
function heldAt(p) {
  if (!PR || !PR.heldOut) return null;
  var src = p.kind === 'uep' ? p.bandFrom : p.kind === 'terminal' ? (T.places[p.id] || {}).bandFrom : p.id;
  return PR.heldOut[(src && PR.regionOf[src]) || 'main'] || PR.heldOut.main;
}
function unionHeld(p) {
  var H = heldAt(p); if (!H) return '';
  var U = H.opt['U(E,N)'], E = H.wide, pc = function (x, k) { return cv(dc((100 * x).toFixed(k)) + '%', 'computed: a floating-point evaluation (' + H.file + ')'); };
  return '; over ' + H.months + ' months it had not seen, it covered ' + pc(U.coverage, 1) + ' of ' + grp(H.test) + ' passes, and of its CLEARED with Hs ≤ 2 m the sea broke ' + pc(U.broke / U.liberada, 2)
    + ', against ' + pc(E.broke / E.liberada, 2) + ' for ECMWF\'s band widened until it covers ' + pc(E.coverage, 1);
}

/* WHAT THIS RESTS ON (WARRANT v2.1, models as premises: design/WARRANT.md rule 11). The verdict above is exact arithmetic,
   and it is exact OVER premises, each checked to a different rung, each grade read from its record (numbers.js premises):
   the Hs band against satellite passes it never saw (validated); the wind band calibrated on the same pairs and never
   tested held out (assumed); a band carried from a measured site to a unit or a terminal (assumed: nothing measured it
   at that node); DNV's Table 4-1 alpha, adopted from the North Sea (assumed); the site-alpha method, reproducing Table
   4-1 (verified), and its estimate's extrapolated tail (assumed). The chain follows the chosen criterion and place, in
   the order the number travelled; the last line names the weakest and adds what the satellites have said, forward, about
   the published decisions of this criterion (decision-level-v1: Hs only, descriptive). */
function restsOn(p) {
  if (!PR || !T || !STEPS[p.id]) return '';
  var cur = current(); if (!cur) return '';
  var op = cur.op, has = function (v) { return op.limits.some(function (l) { return l.var === v; }); };
  var hasHs = has('hs') && op.hsAt !== 'berth', hasW = has('wind_sustained');
  if (!hasHs && !hasW) return '';
  var src = p.kind === 'uep' ? p.bandFrom : p.kind === 'terminal' ? (T.places[p.id] || {}).bandFrom || null : p.id;
  var H = heldAt(p), mm = H.split.slice(0, 7), A = PR.alpha, items = [];
  var pc = function (x, k) { return cv(dc((100 * x).toFixed(k)) + '%', 'computed: a floating-point evaluation (' + H.file + ')'); };
  var carry = function (what, from) {
    return { grade: W.ASSUMED, label: what + (p.kind === 'terminal' ? ', carried to the terminal\'s approach' : ', carried to this unit, ' + p.near.km + ' km away'),
      evidence: 'the forecast error at this node is assumed to be the one measured at ' + esc(short(PL[from] || { name: from })) + '; nothing measured it at this node.' + (p.kind === 'terminal' ? ' An altimeter does not see inside a bay.' : '') };
  };
  if (S.crit === 'band') {
    if (!src || !STEPS[p.id].some(function (x) { return x.hb || x.wb; })) return '';
    var st = STEPS[p.id][S.i], key = st && st.hp === 'en' ? 'U(E,N)' : st && st.hp === 'n' ? 'N' : 'E', o = H.opt[key];
    var who = key === 'U(E,N)' ? 'the ECMWF ∪ NOAA union' : key === 'N' ? 'NOAA\'s band' : 'ECMWF\'s band';
    if (hasHs) items.push({ grade: W.VALIDATED, label: 'The Hs band' + (src !== p.id ? ' measured at ' + esc(short(PL[src] || { name: src })) : ''),
      evidence: 'calibrated before ' + mm + ' and judged over ' + H.months + ' months it had not seen: ' + who + ' covered ' + pc(o.coverage, 1) + ' of ' + grp(H.test)
        + ' satellite passes (it claims 9 in 10); of the CLEARED with Hs ≤ 2 m, the sea broke ' + pc(o.broke / o.liberada, 2) + ' (' + grp(o.broke) + ' of ' + grp(o.liberada) + ').'
        + (p.caveat ? ' ' + esc(p.caveat) : '') });
    if (src !== p.id) items.push(carry('The measured error', src));
    if (hasW) items.push({ grade: W.ASSUMED, label: 'The wind band', evidence: 'measured on the same pairs (the altimeter\'s wind); it claims 9 in 10 by theorem, if the next error resembles the archive\'s. It was not tested outside the calibration: the scoreboard and the check of the decisions look only at Hs.' });
  } else {
    var af = p.alphaFrom, sa = af && A ? A.bySite[af] : null;
    if (!A) return '';
    if (S.crit === 'site') {
      if (!sa) return '';
      items.push({ grade: W.VERIFIED, label: 'The site α method', evidence: 'reproduces DNV\'s Table 4-1 in ' + A.within + ' of ' + A.of + ' cells (±' + dc(A.tol) + ') before looking at Brazil; it does not reproduce '
        + A.missed.map(function (m) { return 'Hs ' + dc(String(m.hs)) + ' m with TPOP ' + m.T + ' h'; }).join(', ') + '.' });
      items.push({ grade: W.ASSUMED, label: 'The α estimated at ' + esc(short(PL[af] || { name: af })), evidence: 'from ' + grp(sa.pairs) + ' forecast × satellite pairs, in floating point (resampled by day, 90% interval); it decides with the lower end, rounded down. The 1-in-' + grp(A.oneIn) + ' tail behind the α is extrapolated: three years of satellite do not observe it.' });
      if (af !== p.id) items.push(carry('The α', af));
    } else {
      items.push({ grade: W.ASSUMED, label: 'The α of Table 4-1 (DNV-OS-H101)', evidence: 'adopted from DNV, calibrated in the North Sea; the 1-in-' + grp(A.oneIn) + ' tail behind it is extrapolated: three years of satellite do not observe it.'
        + (sa && sa.est ? ' On the pairs of ' + esc(short(PL[af] || { name: af })) + ', the 90% interval of the estimated α lies above the table\'s in ' + sa.above + ' of ' + sa.est + ' cells' + (sa.below ? ' and below it in ' + sa.below : '') + '.' : '') });
    }
    if (hasW) items.push({ grade: W.ASSUMED, label: 'The wind α (Table 4-6)', evidence: 'adopted from DNV; not reproduced here.' });
  }
  if (!items.length) return '';
  var weakest = W.weakest.apply(null, items.map(function (x) { return x.grade; }));
  var D = T.ledger && T.ledger.decisions, b = D && D.graded && D.byCrit && D.byCrit[S.crit];
  var fwd = b ? ' Forward: since ' + dmy(D.days[0]) + ', of this criterion\'s CLEARED that a satellite saw at the open-sea sites, ' + grp(b.L.held) + ' held and ' + grp(b.L.broke) + ' broke (Hs only, a descriptive count).' : '';
  return '<div class="jn-rests"><div class="jn-k">what this decision rests on</div>' + W.premisesHtml(items, { words: PR.words, gloss: PR.gloss,
    meetLine: 'The arithmetic is exact; the weakest premise sits on the rung <b>' + PR.words[weakest] + '</b>.' + fwd }) + '</div>';
}
/* the planner's premises: the hindcast it counts on, the Table 4-1 alpha of the second bar, the site alpha of the third */
function restsMonth(siteK, c) {
  var Hc = PR && PR.hindcast; if (!Hc) return '';
  var at = Hc.buoysAt[siteK] || [], A = PR.alpha, name = short({ name: CFG.work.sites[siteK].name });
  var rnd = function (x, up) { var k = Math.pow(10, 2), v = up ? Math.ceil(x * k - 1e-9) / k : Math.floor(x * k + 1e-9) / k; return (v > 0 ? '+' : v < 0 ? '−' : '') + dc(Math.abs(v).toFixed(2)); };
  var items = [{ grade: at.length ? W.VALIDATED : W.ASSUMED, label: 'The hindcast (Ifremer WAVEWATCH III) at the node of ' + esc(name),
    evidence: (at.length ? 'checked at this node against ' + at.map(esc).join(', ') + '. ' : 'no buoy at this node. ') + 'Checked against ' + Hc.deployments + ' deployments of the Brazilian Navy\'s buoys (PNBOIA, ' + Hc.from + '–' + Hc.to + ') at '
      + Hc.nodes + ' other nodes of the margin, ' + grp(Hc.pairs) + ' pairs: bias from ' + rnd(Hc.bias[0], false) + ' to ' + rnd(Hc.bias[1], true) + ' m, RMS from ' + dc((Math.floor(Hc.rms[0] * 100 + 1e-9) / 100).toFixed(2)) + ' to ' + dc((Math.ceil(Hc.rms[1] * 100 - 1e-9) / 100).toFixed(2))
      + ' m; Hs ≤ 2 m ' + cv(dc((100 * Hc.le2.buoy / Hc.le2.n).toFixed(1)) + '%') + ' of the time at the buoys, ' + cv(dc((100 * Hc.le2.hind / Hc.le2.n).toFixed(1)) + '%') + ' in the hindcast.' },
    { grade: W.ASSUMED, label: 'The α of Table 4-1 (the second bar)', evidence: 'adopted from DNV, calibrated in the North Sea' + (A ? '; the 1-in-' + grp(A.oneIn) + ' tail behind it is extrapolated.' : '.') }];
  if (c.s && A) items.push({ grade: W.VERIFIED, label: 'The site α method (the third bar)', evidence: 'reproduces Table 4-1 in ' + A.within + ' of ' + A.of + ' cells (±' + dc(A.tol) + '); the value used is chosen, the lower end of the estimate\'s 90% interval, and carries the same extrapolated tail.' });
  var weakest = W.weakest.apply(null, items.map(function (x) { return x.grade; }));
  return '<div class="jn-k">what these counts rest on</div>' + W.premisesHtml(items, { words: PR.words, gloss: PR.gloss,
    meetLine: 'Every count is exact over the hindcast; the weakest premise sits on the rung <b>' + PR.words[weakest] + '</b>: the past sea is a model\'s' + (at.length ? '.' : ', and no buoy checked it at this node.') });
}
function certDownload(p) {
  var cur = current(), op = cur.op, st = STEPS[p.id], r = full(p.id, S.i), sp = C.span(st, S.i, op.TR) || [S.i];
  var dnv = S.crit !== 'band';
  var steps = sp.map(function (k) { var s = st[k]; return { t: AX[k] + ':00Z', lead: LEAD[k], hs: dnv ? s.hd || null : s.hb || null, wind_kn: dnv ? s.wd || null : s.wb || null }; });
  var P = preset(S.op), ps = proposerState(p);
  var cert = {
    certificate: 'Janela — one decision, with everything needed to redo it by hand',
    place: { id: p.id, name: p.full || p.name, type: typeOf(p) || p.kind, model_node: T.places[p.id] && T.places[p.id].node },
    operation: { id: op.id, name: cur.name, window_h: C.trOf(op.TR), limits: op.limits, source: op.npcp ? { act: op.source.act, page: op.page, sha256: op.source.sha256 } : op.own ? 'typed by whoever operates' : P && P.kind === 'cited' ? P.source : 'an example, not a published rule' },
    criterion: { band: 'measured band (forecast × error measured against satellite)', table: 'DNV-OS-H101 Table 4-1 (OPWF = α × OPLIM)', site: 'site α (estimated; lower end of the 90% interval)' }[S.crit],
    start: AX[S.i] + ':00Z', steps: steps,
    limits_decided: dnv && r && r.opwf ? r.opwf : op.limits, alpha: r && r.alpha ? r.alpha : null,
    verdict: WORD[vcode(r)], verdict_in_record: r === null ? null : r.verdict,
    why: r && r.verdict !== 'n/a' ? explain(p, r, op, S.crit) : r ? whyEn(r.why) : null,
    witness: r && r.witness || null, threshold: r && r.flip || null, not_forecast: r && r.notForecast || [],
    decision_rule: 'CLEARED (LIBERADA in the record): every limit holds at the band\'s unfavourable edge at every step; BLOCKED (VETADA): some limit fails already at the favourable edge; UNDECIDED (INDEFINIDA): the band straddles the limit; NEEDS DATA (SEM DADOS): the rule limits something with no forecast here',
    band: ps ? { proposer: ps.name, claim: ps.claim, scoreboard: ps.st,
      second: ps.second ? { proposer: ps.second.name, claim: ps.second.claim, scoreboard: ps.second.st, rule: 'the union of the two bands decides (providers-v1)' } : null,
      union: ps.union ? { proposer: ps.union.name, claim: ps.union.claim, scoreboard: ps.union.st, measured: 'certs/janela-providers-eval.json (providers-eval-v1)' } : null } : null,
    second_provider: T.noaa ? { source: 'NOAA WAVEWATCH III (GEFS-Wave, ' + T.noaa.band + ')', claim: T.noaa.claim, run: T.noaa.run + ':00Z', record: T.noaa.file, sha256: T.noaa.sha,
      role: 'shown beside, never decided on (providers-v1, certs/janela-ledger/DEFINITIONS.json); scored on the scoreboard against the same satellites' } : null,
    ecmwf_run: T.run + ':00Z', read: T.madeAt, code: T.git || null, day_digest: T.digest, modules: T.modules, records: T.inputs,
    check: { browser: window.__janela.check || null, second_verifier: T.second || null },
    redo: ['git clone https://github.com/carlostoledo1891/cert-machine', 'git checkout ' + (T.git ? T.git.replace(/\+dirty$/, '') : '<commit>'),
      'python apps/janela/audit/field.py ' + T.run.slice(0, 10), 'python apps/janela/audit/noaa.py --units ' + T.run.slice(0, 10), 'node apps/janela/build-today.js --feed ' + T.run.slice(0, 10).replace(/-/g, '') + '   (digest ' + T.digest + ')',
      'python3 instruments/window/verify/verify_day.py site/janela/data/today.json'],
    notice: 'Not an approval of an operation: it is evidence a surveyor can redo. The site α is an estimate; the decisions are exact over the published band.'
  };
  var blob = new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'janela-' + p.id + '-' + op.id + '-' + S.crit + '-' + AX[S.i].replace(/[-T:]/g, '') + '.json';
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

/* ================================================================ THE DECISION NOTE */
function nota() {
  var p = PL[S.site];
  if (!T || !p || !STEPS[p.id]) { select(S.site || 'santos'); p = PL[S.site]; if (!p) return; }
  var cur = current(), op = cur.op, st = STEPS[p.id], r = full(p.id, S.i), sp = C.span(st, S.i, op.TR) || [S.i];
  var end = addH(AX[S.i], C.trOf(op.TR)), v = vcode(r);
  var P = preset(S.op);
  var src = op.npcp ? (op.source.title + '. ' + op.source.act + ', ' + op.page + (op.quote ? ' — the act\'s words: “' + op.quote + '”' : '') + ' — sha256 ' + op.source.sha256)
    : op.own ? 'the procedure of whoever operates, typed in this tab' : P && P.kind === 'cited' ? P.source + ' — ' + P.sourceUrl : 'an example (not a published rule)';
  var bandCell = function (b) { return b ? dc(b[0]) + ' – ' + dc(b[1]) : '—'; };
  var rows = sp.map(function (k) { var s = st[k]; return '<tr><td>' + esc(wtxt(AX[k], true)) + '</td><td>' + esc(utc(AX[k])) + '</td><td>+' + LEAD[k] + '</td><td>' + bandCell(s.hd) + '</td><td>' + bandCell(s.hb) + '</td><td>' + bandCell(s.wd) + '</td><td>' + bandCell(s.wb) + '</td><td>' + (s.tp ? dc(s.tp) : '—') + '</td><td>' + (s.mwd !== undefined ? s.mwd + '°' : '—') + '</td></tr>'; }).join('');
  var mods = Object.keys(MODS.pins).map(function (k) { return '<tr><td>' + esc(MODS.pins[k].rel) + '</td><td class="mono">' + esc(MODS.pins[k].sha) + '</td></tr>'; }).join('');
  var recs = Object.keys(T.inputs || {}).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="mono">' + esc(T.inputs[k]) + '</td></tr>'; }).join('');
  var ck = window.__janela.check;
  $('jn-nota').innerHTML = '<h1>Decision note — Janela</h1>'
    + '<p><b>' + esc(cur.name) + '</b> · ' + esc(p.kind === 'uep' ? p.name + ' (' + (p.full || '') + ', ' + typeOf(p) + ')' : p.name) + ' · criterion: ' + esc(CNAME[S.crit]) + '</p>'
    + '<p>Window: start ' + esc(wtxt(AX[S.i], true)) + ' (' + esc(utc(AX[S.i])) + '), ' + C.trOf(op.TR) + ' h, until ' + esc(wtxt(end, true)) + ' · Brasília time (UTC−3)</p>'
    + '<p>Verdict: <span class="v">' + esc(WORD[v]) + '</span></p><p>' + esc(explain(p, r, op, S.crit)) + '</p>'
    + (r && r.alpha ? '<p>α ' + esc(q2(r.alpha.hs, 4)) + (r.alpha.wind ? ' (wind α ' + esc(q2(r.alpha.wind, 2)) + ', Table 4-6)' : '') + ', TPOP ' + r.alpha.TPOP + ' h; OPWF ' + esc(r.opwf.map(function (l) { return VAR[l.var] + ' ' + OPW[l.op] + ' ' + q2(l.value, 3) + ' ' + UNIT[l.unit]; }).join(', ')) + '</p>' : '')
    + '<h2>Limits and source</h2><p>' + esc(op.limits.map(limText).join(' · ')) + '</p><p>' + esc(src) + '</p>'
    + (P && P.notDecided && S.op === 'alivio' ? '<p>Checked by whoever operates, not decided here: ' + esc(P.notDecided.join('; ')) + '.</p>' : '')
    + '<h2>Forecast</h2><p>ECMWF open data, run ' + esc(T.run) + ' UTC, read ' + esc(T.madeAt) + '; node ' + esc(T.places[p.id].node.join(', ')) + (p.bandFrom ? '; measured band and α from ' + esc(PL[p.bandFrom].name) : '') + '. Bands rounded outward (Hs 0.001 m; wind 0.01 kn).'
      + (T.noaa ? ' NOAA ensemble (WAVEWATCH III, the central 25 of 31), same run: shown beside, never decided on.' : '') + '</p>'
    + '<table><thead><tr><th>start (BRT)</th><th>UTC</th><th>lead h</th><th>Hs det. (m)</th><th>Hs band (m)</th><th>wind det. (kn)</th><th>wind band (kn)</th><th>Tp (s)</th><th>from</th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<h2>Modules that decided (sha256)</h2><table><tbody>' + mods + '</tbody></table>'
    + '<h2>Records used (sha256)</h2><table><tbody>' + recs + '</tbody></table>'
    + '<p>Check in this tab: ' + esc(ck ? (ck.ok ? ck.n + ' published decisions redone, equal; modules ' + ck.mods : 'DIFFERENCES: ' + (ck.n - ck.same) + ' of ' + ck.n) : 'in progress') + '. Published digest ' + esc(T.digest) + '.</p>'
    + '<h2>Redo</h2><p class="mono">git clone https://github.com/carlostoledo1891/cert-machine · git checkout ' + esc(T.git ? T.git.replace(/\+dirty$/, '') : '(commit not recorded on this day)') + ' · python apps/janela/audit/field.py ' + esc(T.run.slice(0, 10)) + ' · python apps/janela/audit/noaa.py --units ' + esc(T.run.slice(0, 10)) + ' · node apps/janela/build-today.js --feed ' + esc(T.run.slice(0, 10).replace(/-/g, '')) + '</p>'
    + '<p>build-today re-runs the batteries, reads the same ECMWF run (the open archive is immutable) and prints the digest of every decision of the day: it must be ' + esc(T.digest) + '.' + (T.git && /\+dirty$/.test(T.git) ? ' Caution: this data was made from a tree with unrecorded changes.' : '') + '</p>'
    + '<p>Not an approval of an operation: marine warranty and the classification societies own that word. It is evidence a surveyor can redo. The site α is an estimate; the decisions are exact over the published band. Printed ' + esc(new Date().toISOString().slice(0, 16).replace('T', ' ')) + ' UTC.</p>';
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
  catch (e) { status('the wave and wind field did not open; the decisions do not depend on it'); }
}, function () { status('no wave and wind field for this run; the decisions do not depend on it'); setTimeout(function () { status(''); }, 6000); });
})();
