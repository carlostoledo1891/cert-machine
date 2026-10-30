/* page.js — /janela/metodo/: the method page, the app's "why trust it" layer
   (English since 2026-10-30, the operator: no more pt-BR pages; the app itself is
   /janela/, apps/janela/app/; the deck stays Portuguese, it was sent). Every number is read by
   numbers.js from the record that holds it. The week, its explanations and the
   charts are drawn by ONE function set, lib(), which the build runs in Node and
   the reader's tab runs from the page — serialised with toString(), so the grid
   a crawler reads and the grid a reader re-decides cannot be two designs. The
   tab decides with instruments/window/q.js and decide.js, shipped as the same
   bytes the record used and hash-checked in the tab.
   INK: what is DECIDED (the measured band, the verdicts) is solid, roman, mono;
   what is FORECAST (the ECMWF deterministic line, the ensemble) is dashed or
   hatched and set in italic. They never share a stroke or a type style.
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
/* the English number words (numbers.js `en`); `br` stays the deck's */
const { en: nf } = require('./numbers.js');
const PLACAR = require('./audit/placar.js');
const RK = require(path.join(ROOT, 'design', 'record.js')).key;
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
/* the site names in English, from the one definition (scenario/sites.json `en`); the records keep their Portuguese names */
const SITES_EN = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', 'janela', 'scenario', 'sites.json'), 'utf8')).sites.map((s) => [s.id, s.en || s.name]));
const siteEn = (id, fallback) => SITES_EN[id] || fallback || id;
/* the picker's groups by site kind (numbers.js N.groups carries the deck's Portuguese words) */
const GROUP_EN = { field: 'Production areas', platform: 'Platform', terminal: 'Terminals', coast: 'Florianópolis' };

const esc = C.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';
const MODS = ['instruments/window/q.js', 'instruments/window/decide.js'];
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

/* the modules the tab decides with: their source text, and its sha256 */
function bundle() {
  const src = {}, pins = {};
  for (const rel of MODS) {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    src[path.basename(rel)] = t;
    pins[path.basename(rel)] = { rel, sha: sha(t) };
  }
  return { src, pins, json: JSON.stringify({ src, pins }).replace(/</g, '\\u003c') };
}

/* ======================================================================
   lib(Q, D) — pure string builders, shared by the build and the tab.
   Self-contained on purpose: it is serialised into the page, so it may not
   reach for anything outside its own body. Q = q.js, D = decide.js.
   K = the INK (WARRANT, design/WARRANT.md): the grammar's attribute strings and
   value wrappers, made by playground/warrant.js in the build and carried to the
   tab as data, so the crawler's grid and the reader's grid draw the same marks.
   ====================================================================== */
function lib(Q, D, K) {
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var VAR = { hs: 'Hs', wind_sustained: 'wind', wind_gust: 'gust', current: 'current', visibility: 'visibility', tp: 'period',
    draft: 'draft', loa: 'length', beam: 'beam', speed: 'speed', dwt: 'deadweight' };
  var UNIT = { m: 'm', kn: 'kn', NM: 'NM', s: 's' };
  var OPW = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
  /* the record's verdict words are the instrument's Portuguese bytes (instruments/window/decide.js); the page prints the
     instrument's own English beside each one (its `en`), keyed by the record's word */
  var CLS = { 'LIBERADA': 'lib', 'VETADA': 'vet', 'INDEFINIDA': 'ind', 'SEM DADOS': 'sem', 'RECUSADA': 'sem' };
  var VERD = { 'LIBERADA': 'CLEARED', 'VETADA': 'BLOCKED', 'INDEFINIDA': 'UNDECIDED', 'SEM DADOS': 'NEEDS DATA', 'RECUSADA': 'REFUSED' };
  var MEANS = {
    'LIBERADA': 'every limit holds at the band\'s unfavourable edge',
    'VETADA': 'a limit fails even at the favourable edge',
    'INDEFINIDA': 'the band straddles a limit',
    'SEM DADOS': 'the rule limits something with no measured band here',
    'RECUSADA': 'no forecast step in the window'
  };
  function vw(v) { return VERD[v] || v; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /* a value in text with its standing: a forecast or an estimate is computed, a count over a chosen alpha is chosen.
     `a`, when given, is where it was read: one <file>#<pointer> or a list of them (D10, data-derived) */
  function voiced(v, t, a) {
    if (a == null) return v[0] + esc(t) + v[1];
    return v[2] + esc([].concat(a).join(' ')) + v[3] + esc(t) + v[4];
  }
  function cw(t, a) { return voiced(K.comp, t, a); }
  function chw(t, a) { return voiced(K.chosen, t, a); }
  function dc(s) { return String(s); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function grp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function hrs(s) { var p = String(s).split('.'); return grp(p[0]) + (p[1] ? '.' + p[1] : ''); }
  /* a forecast time "YYYY-MM-DDTHH" (UTC) in Brasília time, UTC-3 (no daylight time since 2019) */
  function when(t) {
    var d = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), +t.slice(11, 13)) - 3 * 3600000);
    return { dow: DOW[d.getUTCDay()], dm: MON[d.getUTCMonth()] + ' ' + d.getUTCDate(), d: String(d.getUTCDate()),
      h: p2(d.getUTCHours()) + ':00', hh: p2(d.getUTCHours()), key: d.toISOString().slice(0, 10), utc: t.slice(11, 13) + ':00 UTC' };
  }
  function whenText(t) { var w = when(t); return w.dow + ' ' + w.dm + ', ' + w.h + ' (' + w.utc + ')'; }
  function upper(op) { return op === '<' || op === '<='; }
  function sea(l) { return D.SEA.has(l.var); }
  function limText(l) { return (VAR[l.var] || l.var) + ' ' + (OPW[l.op] || l.op) + ' ' + dc(l.value) + ' ' + (UNIT[l.unit] || l.unit); }
  function limOf(op, v) { for (var i = 0; i < op.limits.length; i++) if (op.limits[i].var === v) return op.limits[i]; return null; }
  function chip(v, big) { return '<span class="jn-chip ' + (CLS[v] || 'sem') + (big ? ' big' : '') + '">' + esc(vw(v)) + '</span>'; }
  function glyph(v) { return '<span class="jn-v ' + (CLS[v] || 'sem') + '" aria-hidden="true"></span>'; }
  function latlon(p) {
    return dc(Math.abs(p[0]).toFixed(2)) + '°' + (p[0] < 0 ? 'S' : 'N') + ' ' + dc(Math.abs(p[1]).toFixed(2)) + '°' + (p[1] < 0 ? 'W' : 'E');
  }
  /* the site's English name (scenario/sites.json `en`), shortened for a button: "Santos Basin — pre-salt" -> Santos / pre-salt */
  function short(name) {
    return String(name).replace(/ Basin\b/, '').replace(/^Equatorial Margin — /, '').replace(/ Bay\b/, '')
      .replace(/ — .*$/, '').replace(/ \(.*\)$/, '');
  }
  function kicker(name) {
    var p = /\(([^)]*)\)/.exec(name);
    if (p) return p[1];
    var m = /^(.*) — (.*)$/.exec(name);
    if (m) return short(name) === m[2] ? m[1] : m[2];
    return / Basin$/.test(name) ? 'basin' : '';
  }

  /* ONE step, ONE operation: the forecast band at that step, decided by
     instruments/window/decide.js exactly as apps/janela/audit/today.js builds
     it. The build refuses if this ever disagrees with the record. */
  function decideStep(op, st) {
    var vars = {};
    if (st.hs && op.hsAt !== 'berth') vars.hs = { lo: st.hs.lo, hi: st.hs.hi };
    if (st.wind) vars.wind_sustained = { lo: st.wind.lo, hi: st.wind.hi };
    var fc = { unit: { hs: 'm', wind_sustained: 'kn' }, coverage: '9/10 per variable (conformal, site and lead bin)',
      proposer: 'janela-calibrated-v1', steps: [{ t: st.t, vars: vars }] };
    var v = D.decide({ id: op.id, limits: op.limits }, fc, [st.t, st.t]);
    return { verdict: v.verdict, witness: v.witness || null, flip: v.flip || null, notForecast: v.notForecast || [], decidedOn: v.decidedOn || [] };
  }
  function same(a, b) {
    var k = function (r) { return JSON.stringify([r.verdict, r.witness, r.flip, r.notForecast, r.decidedOn]); };
    return k(a) === k(b);
  }
  function customOp(limits) { return { id: 'seu-limite', name: 'Your limit', limits: limits, hsAt: 'approach', own: true }; }
  function rowsFor(site, ops, custom) {
    var rows = ops.filter(function (o) { return o.site === site.id; }).map(function (o) { return { op: o, steps: o.steps }; });
    if (custom && custom.length) {
      var op = customOp(custom);
      rows.push({ op: op, steps: site.steps.map(function (st) { return decideStep(op, st); }) });
    }
    return rows;
  }
  /* the cell the readout opens on: the first step after publication, first row */
  function defaultSel(site, rows) {
    var i = 0;
    while (i < site.steps.length - 1 && site.steps[i].past) i++;
    return { r: 0, i: rows.length ? i : -1 };
  }

  /* ---- the plain-English reason for one verdict ---- */
  function bandOf(s, v) { return v === 'hs' ? s.hs : v === 'wind_sustained' ? s.wind : null; }
  function unitOf(v) { return v === 'hs' ? 'm' : 'kn'; }
  function missing(op, v, s) {
    if (v === 'hs') {
      if (op.hsAt === 'berth') return 'Hs at the berth: the model node is the open sea of the approach, not the berth, and the berth\'s wave is not decided, by construction';
      return s.hsDet === undefined ? 'Hs: no forecast at this node' : 'Hs: measured band refused at this lead (not enough satellite × forecast pairs yet)';
    }
    if (v === 'wind_sustained') return s.windDetKn === undefined ? 'wind: no forecast at this node' : 'wind: measured band refused at this lead (not enough pairs)';
    if (v === 'wind_gust') return 'gust: forecast by ECMWF, but with no measured error, so no band';
    if (v === 'current') return 'current: nobody forecasts it here';
    if (v === 'visibility') return 'visibility: nobody forecasts it here';
    return (VAR[v] || v) + ': no measured band';
  }
  function explain(op, r, s, claim) {
    var why;
    if (r.verdict === 'LIBERADA') {
      why = 'Every limit holds at the unfavourable edge of the measured band: ' + r.decidedOn.map(function (v) {
        var l = limOf(op, v), b = bandOf(s, v);
        return VAR[v] + (upper(l.op) ? ' reaches at most ' + dc(b.hiDec) : ' stays at least at ' + dc(b.loDec)) + ' ' + unitOf(v) + ', and the limit is ' + limText(l);
      }).join('; ') + '.';
    } else if (r.verdict === 'VETADA') {
      var w = r.witness, lw = limOf(op, w.var);
      why = 'Even the favourable edge of the measured band already breaks the limit: ' + VAR[w.var] + (upper(lw.op) ? ' of at least ' : ' of at most ')
        + dc(Q.dec(Q.parse(w.edge), 2)) + ' ' + unitOf(w.var) + ', against ' + limText(lw) + '. The witness is this hour and this variable.';
    } else if (r.verdict === 'INDEFINIDA') {
      why = 'The measured band straddles the limit: ' + r.flip.map(function (f) {
        var l = limOf(op, f.var), b = bandOf(s, f.var);
        return VAR[f.var] + ' runs from ' + dc(b.loDec) + ' to ' + dc(b.hiDec) + ' ' + unitOf(f.var) + ', against ' + limText(l)
          + '; to turn CLEARED, the unfavourable edge must ' + (upper(l.op) ? 'come down ' : 'go up ') + dc(f.gapDec) + ' ' + unitOf(f.var);
      }).join('. ') + '. If the favourable edge crosses the limit, it turns BLOCKED.';
    } else if (r.verdict === 'SEM DADOS') {
      why = (r.decidedOn.length
        ? 'What has a measured band clears (' + r.decidedOn.map(function (v) { return VAR[v]; }).join(' and ') + ', at the unfavourable edge), but the rule limits more. '
        : 'Nothing this rule limits has a measured band here. ')
        + r.notForecast.map(function (v) { var t = missing(op, v, s); return t.charAt(0).toUpperCase() + t.slice(1); }).join('. ') + '.';
    } else why = 'No forecast step in this window.';
    var dcd = [];
    if (op.hsAt === 'berth' && limOf(op, 'hs')) dcd.push('Hs: not decided at the berth');
    else if (s.hs) dcd.push('Hs [' + dc(s.hs.loDec) + ', ' + dc(s.hs.hiDec) + '] m (' + s.hs.n + ' pairs)');
    else if (s.hsDet !== undefined) dcd.push('Hs: refused at this lead');
    if (s.wind) dcd.push('wind [' + dc(s.wind.loDec) + ', ' + dc(s.wind.hiDec) + '] kn (' + s.wind.n + ' pairs)');
    else if (s.windDetKn !== undefined) dcd.push('wind: refused at this lead');
    var fc = [];
    if (s.hsDet !== undefined) fc.push('Hs ' + cw(dc(s.hsDet) + ' m'));
    if (s.tp) fc.push('Tp ' + cw(dc(s.tp) + ' s'));
    if (s.mwd) fc.push('from ' + cw(s.mwd + '°'));
    if (s.windDetKn !== undefined) fc.push('wind ' + cw(dc(s.windDetKn) + ' kn'));
    if (s.gustKn !== undefined && Number(s.gustKn) > 0) fc.push('gust ' + cw(dc(s.gustKn) + ' kn'));
    var vessel = op.limits.filter(function (l) { return !sea(l); });
    return '<div class="jn-ro-h">' + chip(r.verdict, true) + '<span class="jn-ro-t">' + esc(op.name) + ' · ' + esc(whenText(s.t))
      + ' · lead +' + s.lead + ' h' + (s.past ? ' · before publication' : '') + '</span></div>'
      + '<p class="jn-why">' + esc(why) + '</p>'
      + '<p class="jn-dc"><span class="jn-k">decided over</span> the measured band, claim ' + esc(claim) + ': ' + esc(dcd.join(' · ') || 'none') + '</p>'
      + '<p class="jn-fc"><span class="jn-k">forecast</span> ECMWF deterministic: ' + (fc.join(' · ') || 'nothing at this node')
      + (s.ens ? '. Ensemble, the central 40 of 50: Hs ' + cw(dc(s.ens[0])) + ' to ' + cw(dc(s.ens[1]) + ' m') : '') + '.</p>'
      + (vessel.length ? '<p class="jn-op"><span class="jn-k">the operator\'s</span> ' + esc(vessel.map(limText).join(' · ')) + ': vessel attributes, checked by whoever operates, never decided here.</p>' : '');
  }

  /* ---- the grid: operations × the 29 steps ---- */
  function rowLabel(op) {
    var seaL = op.limits.filter(sea);
    if (op.own) return '<b>Your limit</b><span>' + esc(seaL.map(limText).join(' · ')) + '</span><span class="jn-own">decided in this tab</span>';
    return '<b>' + esc(op.name) + '</b><span>' + esc(seaL.map(limText).join(' · ')) + '</span>'
      + (op.status === 'expired-experimental' ? '<span class="jn-exp">experimental parameters · period ended</span>' : '')
      + '<a class="jn-src" href="#regra-' + esc(op.id) + '">source</a>';
  }
  function grid(site, rows, sel) {
    var st = site.steps, groups = [];
    st.forEach(function (s, i) {
      var w = when(s.t), g = groups[groups.length - 1];
      if (!g || g.key !== w.key) groups.push({ key: w.key, lab: w.dow + ' ' + w.dm, d: w.d, n: 1, i: i }); else g.n++;
    });
    var starts = {}; groups.forEach(function (g) { starts[g.i] = 1; });
    var h = '<table class="jn-grid"><thead><tr><th class="jn-rl" rowspan="2" scope="col">operation · Brasília time</th>'
      + groups.map(function (g) { return '<th class="jn-day jn-d0" colspan="' + g.n + '" scope="colgroup">' + esc(g.n >= 3 ? g.lab : g.d) + '</th>'; }).join('')
      + '</tr><tr>' + st.map(function (s, i) {
        return '<th class="jn-hr' + (s.past ? ' past' : '') + (starts[i] ? ' jn-d0' : '') + '" scope="col">' + when(s.t).hh + '</th>';
      }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (row, ri) {
      h += '<tr' + (row.op.own ? ' class="jn-ownr"' : '') + '><th class="jn-rl" scope="row">' + rowLabel(row.op) + '</th>' + row.steps.map(function (v, i) {
        var on = sel && sel.r === ri && sel.i === i;
        return '<td' + (starts[i] ? ' class="jn-d0"' : '') + '><button type="button" class="jn-c' + (on ? ' on' : '') + (st[i].past ? ' past' : '')
          + '" data-r="' + ri + '" data-i="' + i + '" aria-label="' + esc(vw(v.verdict) + ' · ' + row.op.name + ' · ' + whenText(st[i].t)) + '">' + glyph(v.verdict) + '</button></td>';
      }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  }

  /* ---- the forecast strip: the measured band (decided) against the ECMWF
     deterministic line and ensemble (forecast), with the limits as guides ---- */
  function guidesFor(site, ops, custom, v) {
    var all = [];
    ops.forEach(function (o) {
      if (o.site !== site.id || (v === 'hs' && o.hsAt === 'berth')) return;
      o.limits.forEach(function (l) { if (l.var === v) all.push({ value: l.value, op: l.op, own: false }); });
    });
    (custom || []).forEach(function (l) { if (l.var === v) all.push({ value: l.value, op: l.op, own: true }); });
    var by = {}, order = [];
    all.forEach(function (g) { var k = String(Number(g.value)); if (!by[k]) { by[k] = []; order.push(k); } by[k].push(g); });
    return order.map(function (k) {
      var seen = {}, parts = [];
      by[k].forEach(function (g) { var t = (g.own ? 'yours ' : '') + OPW[g.op] + ' ' + dc(g.value) + ' ' + unitOf(v); if (!seen[t]) { seen[t] = 1; parts.push(t); } });
      return { value: Number(k), text: parts.join(' · ') };
    });
  }
  function runs(st, has) {
    var out = [], cur = null;
    st.forEach(function (s, i) { if (has(s)) { if (!cur) { cur = []; out.push(cur); } cur.push(i); } else cur = null; });
    return out;
  }
  function strip(site, kind, guides) {
    var st = site.steps, n = st.length, isHs = kind === 'hs';
    var W = 960, H = isHs ? 230 : 200, PL = 50, PR = 16, PT = 14, PB = 40;
    var vals = [0];
    st.forEach(function (s) {
      if (isHs) { if (s.hsDet !== undefined) vals.push(+s.hsDet); if (s.ens) vals.push(+s.ens[1]); if (s.hs) vals.push(+s.hs.hiDec); }
      else { if (s.windDetKn !== undefined) vals.push(+s.windDetKn); if (s.gustKn !== undefined) vals.push(+s.gustKn); if (s.wind) vals.push(+s.wind.hiDec); }
    });
    guides.forEach(function (g) { vals.push(g.value); });
    var mx = Math.max.apply(null, vals);
    var tick = isHs ? (mx <= 3 ? 0.5 : mx <= 6 ? 1 : 2) : (mx <= 30 ? 5 : 10);
    var top = Math.max(2 * tick, Math.ceil(mx * 1.08 / tick) * tick);
    var x = function (i) { return PL + i * (W - PL - PR) / Math.max(1, n - 1); };
    var y = function (v) { return PT + (H - PT - PB) * (1 - v / top); };
    var f1 = function (v) { return v.toFixed(1); };
    var o = [], uid = 'jn-h-' + site.id + '-' + kind;
    var alt = (isHs ? 'Hs' : 'Wind') + ' at ' + site.name + ', seven days in 6-hour steps: the measured band, which is decided, against ECMWF\'s deterministic forecast'
      + (isHs ? ' and ensemble' : ' and gust') + (guides.length ? '; limits ' + guides.map(function (g) { return g.text; }).join(', ') : '') + '.';
    o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '">');
    /* THE HALO (WARRANT rule 13): a band the satellites have not validated where it is drawn (the wind band anywhere; a
       terminal's Hs band, borrowed from its open-sea neighbour) keeps its edges, on which the decision is made, and
       gains a blur: its error there has no edge to draw */
    var halo = isHs ? !!site.bandFrom : true;
    o.push('<defs><pattern id="' + uid + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="jn-hl" x1="0" y1="0" x2="0" y2="6"/></pattern>'
      + '<filter id="' + uid + '-b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="3"/></filter></defs>');
    for (var t = 0; t <= top + 1e-9; t += tick) {
      o.push('<line class="jn-gl" x1="' + PL + '" y1="' + f1(y(t)) + '" x2="' + (W - PR) + '" y2="' + f1(y(t)) + '"/>');
      o.push('<text class="t-ax" x="' + (PL - 8) + '" y="' + f1(y(t) + 4) + '" text-anchor="end">' + dc(String(Math.round(t * 10) / 10)) + '</text>');
    }
    o.push('<text class="t-note" x="' + PL + '" y="' + (H - 6) + '">' + (isHs ? 'Hs (m)' : 'wind at 10 m (kn)') + '</text>');
    /* days: a hairline where a Brasília day begins, its name under its steps */
    var day = null, first = 0;
    st.forEach(function (s, i) {
      var w = when(s.t);
      if (day === null) { day = w; first = i; return; }
      if (w.key !== day.key) {
        if (i - first >= 2) o.push('<text class="t-ax" x="' + f1((x(first) + x(i - 1)) / 2) + '" y="' + (H - PB + 18) + '" text-anchor="middle">' + day.dow + ' ' + day.d + '</text>');
        o.push('<line class="jn-dl" x1="' + f1((x(i - 1) + x(i)) / 2) + '" y1="' + PT + '" x2="' + f1((x(i - 1) + x(i)) / 2) + '" y2="' + (H - PB) + '"/>');
        day = w; first = i;
      }
    });
    if (day && n - first >= 2) o.push('<text class="t-ax" x="' + f1((x(first) + x(n - 1)) / 2) + '" y="' + (H - PB + 18) + '" text-anchor="middle">' + day.dow + ' ' + day.d + '</text>');
    /* forecast: the ensemble (hatched) */
    if (isHs) runs(st, function (s) { return s.ens; }).forEach(function (r) {
      var up = r.map(function (i) { return f1(x(i)) + ',' + f1(y(+st[i].ens[1])); });
      var dn = r.slice().reverse().map(function (i) { return f1(x(i)) + ',' + f1(y(+st[i].ens[0])); });
      if (r.length === 1) return;
      o.push('<polygon ' + K.ens + ' fill="url(#' + uid + ')" points="' + up.concat(dn).join(' ') + '"/>');
    });
    /* decided: the measured band (solid) */
    var has = isHs ? function (s) { return s.hs; } : function (s) { return s.wind; };
    runs(st, has).forEach(function (r) {
      var b = function (i) { return isHs ? st[i].hs : st[i].wind; };
      if (r.length === 1) {
        var i0 = r[0];
        var one = 'x="' + f1(x(i0) - 3) + '" y="' + f1(y(+b(i0).hiDec)) + '" width="6" height="' + f1(Math.max(1, y(+b(i0).loDec) - y(+b(i0).hiDec))) + '"';
        if (halo) o.push('<rect class="jn-halo" filter="url(#' + uid + '-b)" ' + one + '/>');
        o.push('<rect ' + K.band + ' ' + one + '/>');
        return;
      }
      var up = r.map(function (i) { return f1(x(i)) + ',' + f1(y(+b(i).hiDec)); });
      var dn = r.slice().reverse().map(function (i) { return f1(x(i)) + ',' + f1(y(+b(i).loDec)); });
      if (halo) o.push('<polygon class="jn-halo" filter="url(#' + uid + '-b)" points="' + up.concat(dn).join(' ') + '"/>');
      o.push('<polygon ' + K.band + ' points="' + up.concat(dn).join(' ') + '"/>');
    });
    /* forecast: the deterministic line (and the gust), dashed */
    var line = function (get, ink) {
      runs(st, function (s) { return get(s) !== undefined; }).forEach(function (r) {
        if (r.length < 2) return;
        o.push('<polyline ' + ink + ' points="' + r.map(function (i) { return f1(x(i)) + ',' + f1(y(+get(st[i]))); }).join(' ') + '"/>');
      });
    };
    /* the gust at step 0 is 0: ECMWF's gust is a maximum since the previous step, and step 0 has none */
    if (!isHs) line(function (s) { return Number(s.gustKn) > 0 ? s.gustKn : undefined; }, K.gust);
    line(isHs ? function (s) { return s.hsDet; } : function (s) { return s.windDetKn; }, K.det);
    /* the limits, as guides, labels kept apart */
    /* each label sits just above its own line; when two lines are too close
       for two rows of text, the lower one's label joins the upper one's row,
       to its right — it carries its own value, so it cannot be misread */
    var placed = [];
    guides.slice().sort(function (a, b) { return b.value - a.value; }).forEach(function (g) {
      var gy = y(g.value), ty = gy - 5, lx = PL + 6, wd = g.text.length * 8;
      placed.forEach(function (p) { if (Math.abs(p.y - ty) < 14 && lx < p.x1) { ty = p.y; lx = p.x1 + 16; } });
      placed.push({ y: ty, x1: lx + wd });
      o.push('<line class="jn-lim" x1="' + PL + '" y1="' + f1(gy) + '" x2="' + (W - PR) + '" y2="' + f1(gy) + '"/>');
      o.push('<text class="jn-limt" x="' + f1(lx) + '" y="' + f1(ty) + '">' + esc(g.text) + '</text>');
    });
    o.push('</svg>');
    return o.join('');
  }
  function stripKey(isHs, hasBand, from) {
    var sw = function (inner) { return '<svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true">' + inner + '</svg>'; };
    var k = [];
    k.push('<li>' + sw('<rect ' + K.band + ' x="1" y="2" width="26" height="8"/>') + '<span>measured band, what is decided: '
      + (isHs ? 'the forecast × the observed/forecast ratio measured at the lead' : 'the forecast ± the error measured in m/s at the lead')
      + (hasBand ? '' : ' (refused at every lead of this run)') + '</span></li>');
    if (hasBand && (!isHs || from)) k.push('<li>' + sw('<defs><filter id="jn-kb-' + (isHs ? 'h' : 'w') + '" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2"/></filter></defs>'
      + '<rect class="jn-halo" filter="url(#jn-kb-' + (isHs ? 'h' : 'w') + ')" x="3" y="3" width="22" height="6"/><rect ' + K.band + ' x="3" y="3" width="22" height="6"/>')
      + '<span>halo: ' + (isHs ? 'the band is ' + esc(from) + '\'s, carried here, and nothing measured the error at this node' : 'the wind band was not validated outside calibration, here or anywhere') + '</span></li>');
    k.push('<li class="jn-fck">' + sw('<line ' + K.det + ' x1="1" y1="6" x2="27" y2="6"/>') + '<span>ECMWF deterministic forecast, dashed</span></li>');
    if (isHs) k.push('<li class="jn-fck">' + sw('<rect ' + K.swr + ' x="1" y="2" width="26" height="8"/><line class="jn-hl" x1="4" y1="10" x2="10" y2="2"/><line class="jn-hl" x1="11" y1="10" x2="17" y2="2"/><line class="jn-hl" x1="18" y1="10" x2="24" y2="2"/>') + '<span>ECMWF ensemble, the central 40 of 50</span></li>');
    else k.push('<li class="jn-fck">' + sw('<line ' + K.gust + ' x1="1" y1="6" x2="27" y2="6"/>') + '<span>gust, deterministic, dashed</span></li>');
    k.push('<li>' + sw('<line class="jn-lim" x1="1" y1="6" x2="27" y2="6"/>') + '<span>limit</span></li>');
    return '<ul class="jn-key">' + k.join('') + '</ul>';
  }

  /* ---- the site panel: header, grid, readout, strips ---- */
  function nodeLine(site, ops) {
    if (!site.node) return 'No forecast node for this site in this run.';
    var at = 'Forecast read at node ' + latlon(site.node) + ' of ECMWF\'s 0.25° grid';
    var dist = site.km ? ', ' + site.km + ' km from ' + latlon([site.lat, site.lon]) : ', on the site itself';
    if (site.kind === 'terminal') {
      var berth = ops.some(function (o) { return o.site === site.id && o.hsAt === 'berth'; });
      return at + dist + ': the open sea of the APPROACH, not the berth.'
        + (berth ? ' Where the rule limits the wave at the berth, the wave is not decided: NEEDS DATA by construction.' : '')
        + (site.bandFrom ? ' The measured band comes from ' + site.bandFromName + ': an altimeter cannot see inside a bay.' : '');
    }
    return at + dist + '.' + (site.kind === 'field' && !site.km ? ' It is the same point as the hindcast of “The month”.' : '');
  }
  function panel(site, rows, sel, ctx, ops, custom, groupLabel) {
    var r = rows[sel.r], s = site.steps[sel.i];
    var hasHs = site.steps.some(function (x) { return x.hs; }), hasW = site.steps.some(function (x) { return x.wind; });
    return '<div class="jn-sh"><div class="jn-k">' + esc(groupLabel) + '</div><h3>' + esc(site.name) + '</h3>'
      + '<p class="jn-node">' + esc(nodeLine(site, ops)) + '</p></div>'
      + '<div class="jn-gw" tabindex="0" role="region" aria-label="Verdicts by operation and time">' + grid(site, rows, sel) + '</div>'
      + '<div class="jn-ro" id="jn-ro" aria-live="polite">' + (r && s ? explain(r.op, r.steps[sel.i], s, ctx.claim)
        : '<p class="jn-why">No operation with a published limit at this site: decide your own above.</p>') + '</div>'
      + '<div class="jn-strips">'
      + '<figure class="jn-fig"><div class="figbox">' + strip(site, 'hs', guidesFor(site, ops, custom, 'hs')) + '</div>' + stripKey(true, hasHs, site.bandFrom ? site.bandFromName : null) + K.capStrip + '</figure>'
      + '<figure class="jn-fig"><div class="figbox">' + strip(site, 'wind', guidesFor(site, ops, custom, 'wind_sustained')) + '</div>' + stripKey(false, hasW, null) + K.legend + K.capStrip + '</figure>'
      + '</div>';
  }

  /* ---- the month: exact counts shown as percentages ---- */
  /* a fraction w/s as a percentage with one decimal, rounded half up in integers */
  function pct(w, s) { if (!s) return '—'; var pm = Math.floor((w * 2000 + s) / (2 * s)); return dc((pm / 10).toFixed(1)) + '%'; }
  function gapPP(o, f) {
    var num = o[0] * f[1] - f[0] * o[1], den = o[1] * f[1];
    if (!den) return '—';
    var pm = Math.floor((num * 2000 + den) / (2 * den));
    return dc((pm / 10).toFixed(1));
  }
  /* the record cells under a site-alpha row (c.s.at, its address, set by build()); null when the row carries none */
  function cellsAt(c) {
    if (!c.s || !c.s.at) return null;
    var out = [];
    for (var i = 1; i < arguments.length; i++) out.push(c.s.at + arguments[i]);
    return out;
  }
  function workSentence(name, lim, tr, c) {
    var worst = 0, wv = -1;
    for (var m = 0; m < 12; m++) { var g = c.o[m][1] && c.f[m][1] ? c.o[m][0] / c.o[m][1] - c.f[m][0] / c.f[m][1] : 0; if (g > wv) { wv = g; worst = m; } }
    return esc(name) + ', wave limit <b>' + dc(lim) + ' m</b>, window of <b>' + tr + ' h</b>: the sea allows <b>' + pct(c.o[12][0], c.o[12][1])
      + '</b> of operation starts over the year (' + grp(c.o[12][0]) + ' of ' + grp(c.o[12][1]) + '). With the α of DNV\'s Table 4-1 ('
      + dc(c.ad) + ' × ' + dc(lim) + ' m → OPWF ' + dc(c.wf) + ' m, TPOP ' + c.T + ' h), <b>' + pct(c.f[12][0], c.f[12][1]) + '</b> remain. The difference, '
      + gapPP(c.o[12], c.f[12]) + ' points, is what the table\'s α costs if the forecast were perfect. The month that loses most: ' + MON[worst]
      + ' (' + pct(c.o[worst][0], c.o[worst][1]) + ' → ' + pct(c.f[worst][0], c.f[worst][1]) + '). Mean wait until the next window: '
      + hrs(c.wo) + ' h → ' + hrs(c.wfw) + ' h.'
      + (c.s ? ' If the surveyor adopted the site\'s α, ' + chw(dc(c.s.a), cellsAt(c, '/alphaSite')) + ' (the lower end of the 90% interval of the estimate ' + cw(dc(Number(c.s.pt).toFixed(3)), cellsAt(c, '/alphaSitePoint'))
        + '), the OPWF would be ' + chw(dc(c.s.wf) + ' m', cellsAt(c, '/opwfDec')) + ' and <b>' + chw(pct(c.s.c[12][0], c.s.c[12][1]), cellsAt(c, '/cells/12/0', '/cells/12/1')) + '</b> would remain, with a mean wait of ' + chw(hrs(c.s.w) + ' h', cellsAt(c, '/cells/12/2')) + '. The site\'s α is an estimate and its lower end a choice; the count over it is exact.' : '');
  }
  /* the same operation, three ways: what the sea allows, what Table 4-1 leaves, what the
     site's alpha would leave. The third rests on an ESTIMATED alpha, so its card is dashed. */
  function workThree(name, lim, tr, c, cells) {
    if (!c.s) {
      var avail = Object.keys(cells).filter(function (k) { return cells[k].s; });
      return '<p class="jn-hint">' + (avail.length
        ? 'The site\'s α comes in with ' + avail.map(function (k) { return k.replace(/^([\d.]+)m\/(\d+)h$/, function (_, l, t) { return dc(l) + ' m and a window of ' + t + ' h'; }); }).join(', ') + ': pick one of these combinations to see what it would leave.'
        : 'At ' + esc(name) + ' there are not yet enough satellite × forecast pairs to estimate the site\'s α.') + '</p>';
    }
    return '<div class="jn-three">'
      + '<div><div class="jn-k">the sea allows</div><div class="big">' + pct(c.o[12][0], c.o[12][1]) + '</div><p>Hs ≤ ' + dc(lim) + ' m (OPLIM) for the whole ' + tr + ' h window</p></div>'
      + '<div><div class="jn-k">Table 4-1 leaves</div><div class="big">' + pct(c.f[12][0], c.f[12][1]) + '</div><p>α ' + dc(c.ad) + ' → OPWF ' + dc(c.wf) + ' m</p></div>'
      + '<div class="est"><div class="jn-k">the site\'s alpha would leave</div><div class="big">' + chw(pct(c.s.c[12][0], c.s.c[12][1]), cellsAt(c, '/cells/12/0', '/cells/12/1')) + '</div><p>α ' + chw(dc(c.s.a), cellsAt(c, '/alphaSite')) + ' → OPWF ' + dc(c.s.wf) + ' m; α chosen in the estimated interval, exact count</p></div>'
      + '</div>';
  }
  function workChart(name, lim, tr, c) {
    var W = 960, H = 260, PL = 46, PR = 10, PT = 24, PB = 34;
    var three = !!c.s, gw = (W - PL - PR) / 12, bw = Math.min(24, gw * (three ? 0.25 : 0.34));
    var y = function (p) { return PT + (H - PT - PB) * (1 - p / 100); };
    var f1 = function (v) { return v.toFixed(1); };
    var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Windows per month at ' + name + ', limit ' + dc(lim) + ' m, window of ' + tr
      + ' h, 1993–2024: with the limit (OPLIM), with the table\'s α (OPWF)' + (three ? ' and with the site\'s estimated α' : '') + '. Over the year: ' + pct(c.o[12][0], c.o[12][1])
      + (three ? ', ' + pct(c.f[12][0], c.f[12][1]) + ' and ' + pct(c.s.c[12][0], c.s.c[12][1]) : ' and ' + pct(c.f[12][0], c.f[12][1])) + '.') + '">'];
    [0, 25, 50, 75, 100].forEach(function (t) {
      o.push('<line class="jn-gl" x1="' + PL + '" y1="' + f1(y(t)) + '" x2="' + (W - PR) + '" y2="' + f1(y(t)) + '"/>');
      o.push('<text class="t-ax" x="' + (PL - 8) + '" y="' + f1(y(t) + 4) + '" text-anchor="end">' + t + '%</text>');
    });
    for (var m = 0; m < 12; m++) {
      var cx = PL + gw * m + gw / 2;
      (three ? [[c.o[m], 'jn-w1', cx - 1.5 * bw - 2], [c.f[m], 'jn-w2', cx - bw / 2], [c.s.c[m], 'jn-w3', cx + bw / 2 + 2]]
        : [[c.o[m], 'jn-w1', cx - bw - 1], [c.f[m], 'jn-w2', cx + 1]]).forEach(function (b) {
        var p = b[0][1] ? 100 * b[0][0] / b[0][1] : 0, top = y(p);
        o.push('<rect ' + (b[1] === 'jn-w3' ? K.w3 : 'class="' + b[1] + '"') + ' x="' + f1(b[2]) + '" y="' + f1(top) + '" width="' + f1(bw) + '" height="' + f1(Math.max(1, y(0) - top)) + '" rx="2"/>');
        o.push('<text class="jn-wv" x="' + f1(b[2] + bw / 2) + '" y="' + f1(top - 5) + '" text-anchor="middle">' + Math.floor((b[0][0] * 200 + b[0][1]) / (2 * b[0][1] || 1)) + '</text>');
      });
      o.push('<text class="t-ax" x="' + f1(cx) + '" y="' + (H - PB + 18) + '" text-anchor="middle">' + MON[m] + '</text>');
    }
    o.push('</svg>');
    return o.join('');
  }
  function workKey(lim, c) {
    return '<ul class="jn-key"><li><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect class="jn-w1" x="1" y="1" width="26" height="10" rx="2"/></svg><span>the sea allows: Hs ≤ '
      + dc(lim) + ' m (OPLIM) for the whole window</span></li><li><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect class="jn-w2" x="1" y="1" width="26" height="10" rx="2"/></svg><span>with the table\'s α: Hs ≤ '
      + dc(c.wf) + ' m (OPWF)</span></li>'
      + (c.s ? '<li class="jn-fck"><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect ' + K.w3 + ' x="1" y="1" width="26" height="10" rx="2"/></svg><span>if the site\'s α were adopted: Hs ≤ '
        + dc(c.s.wf) + ' m (chosen: the lower end of the estimated α; the count over it is exact)</span></li>' : '') + '</ul>' + (c.s ? K.legendChosen : '');
  }
  function workTable(c) {
    var rowsH = '';
    for (var m = 0; m <= 12; m++) {
      rowsH += '<tr><td class="k">' + (m === 12 ? 'year' : MON[m]) + '</td><td class="n">' + pct(c.o[m][0], c.o[m][1]) + '</td><td class="n">' + grp(c.o[m][0]) + ' / ' + grp(c.o[m][1])
        + '</td><td class="n">' + pct(c.f[m][0], c.f[m][1]) + '</td><td class="n">' + grp(c.f[m][0]) + ' / ' + grp(c.f[m][1]) + '</td><td class="n">' + gapPP(c.o[m], c.f[m]) + '</td>'
        + (c.s ? '<td class="n">' + chw(pct(c.s.c[m][0], c.s.c[m][1]), cellsAt(c, '/cells/' + m + '/0', '/cells/' + m + '/1')) + '</td><td class="n">' + grp(c.s.c[m][0]) + ' / ' + grp(c.s.c[m][1]) + '</td>' : '') + '</tr>';
    }
    return '<div class="tw"><table><thead><tr><th>month</th><th>OPLIM</th><th>starts with a window / determined</th><th>the table\'s OPWF</th><th>starts with a window / determined</th><th>cost of the alpha (points)</th>'
      + (c.s ? '<th>the site alpha\'s OPWF</th><th>starts with a window / determined</th>' : '') + '</tr></thead><tbody>'
      + rowsH + '</tbody></table></div>';
  }

  return { esc: esc, dc: dc, when: when, whenText: whenText, limText: limText, chip: chip, glyph: glyph, short: short, kicker: kicker,
    decideStep: decideStep, same: same, customOp: customOp, rowsFor: rowsFor, defaultSel: defaultSel, explain: explain, grid: grid,
    guidesFor: guidesFor, strip: strip, panel: panel, pct: pct, workSentence: workSentence, workThree: workThree, workChart: workChart, workKey: workKey,
    workTable: workTable, MEANS: MEANS, CLS: CLS, VERD: VERD, vw: vw, latlon: latlon, cw: cw, chw: chw };
}

/* ======================================================================
   client(libFn) — the reader's tab. Serialised into the page.
   ====================================================================== */
function client(libFn) {
  var M = JSON.parse(document.getElementById('jn-mods').textContent);
  var cache = {};
  function req(name) {
    var base = String(name).split('/').pop();
    if (cache[base]) return cache[base].exports;
    if (!Object.prototype.hasOwnProperty.call(M.src, base)) throw new Error('janela: no module ' + name);
    var m = { exports: {} };
    cache[base] = m;
    (new Function('module', 'exports', 'require', M.src[base]))(m, m.exports, req);
    return m.exports;
  }
  var Q = req('q.js'), D = req('decide.js');
  var DATA = JSON.parse(document.getElementById('jn-data').textContent);
  var L = libFn(Q, D, DATA.ink);
  var $ = function (id) { return document.getElementById(id); };
  var S = { site: DATA.def, custom: DATA.custom.slice(), sel: null, rows: null, ms: DATA.work.def.s, ml: DATA.work.def.l, mt: DATA.work.def.t };
  var siteOf = function (id) { for (var i = 0; i < DATA.sites.length; i++) if (DATA.sites[i].id === id) return DATA.sites[i]; return null; };

  /* ---- the week ---- */
  function drawWeek(keep) {
    var s = siteOf(S.site);
    S.rows = L.rowsFor(s, DATA.ops, S.custom);
    if (!keep || !S.sel || S.sel.r >= S.rows.length) S.sel = L.defaultSel(s, S.rows);
    $('jn-panel').innerHTML = L.panel(s, S.rows, S.sel, DATA.ctx, DATA.ops, S.custom, DATA.groupOf[s.id]);
    [].forEach.call(document.querySelectorAll('.jn-site'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-s') === S.site ? 'true' : 'false'); });
  }
  function show(r, i) {
    var s = siteOf(S.site), row = S.rows[r];
    if (!row || !s.steps[i]) return;
    S.sel = { r: r, i: i };
    $('jn-ro').innerHTML = L.explain(row.op, row.steps[i], s.steps[i], DATA.ctx.claim);
    [].forEach.call($('jn-panel').querySelectorAll('.jn-c.on'), function (c) { c.classList.remove('on'); });
    var c = $('jn-panel').querySelector('.jn-c[data-r="' + r + '"][data-i="' + i + '"]');
    if (c) c.classList.add('on');
  }
  var panelEl = $('jn-panel');
  var pick = function (e) { var c = e.target.closest && e.target.closest('.jn-c'); if (c) show(+c.getAttribute('data-r'), +c.getAttribute('data-i')); };
  panelEl.addEventListener('click', pick);
  panelEl.addEventListener('mouseover', pick);
  panelEl.addEventListener('focusin', pick);
  [].forEach.call(document.querySelectorAll('.jn-site'), function (b) {
    b.addEventListener('click', function () { S.site = b.getAttribute('data-s'); drawWeek(false); hash(); });
  });
  var form = $('jn-form'), msg = $('jn-form-msg');
  function num(v) { v = String(v).trim().replace(/\s/g, '').replace(',', '.'); return v === '' ? '' : (/^\d+(\.\d+)?$/.test(v) ? v : null); }
  function readForm() {
    var hs = num(form.hs.value), w = num(form.vento.value);
    if (hs === null || w === null) { msg.textContent = 'Type numbers such as 2.5 and 20; leave blank what does not limit.'; return null; }
    if (hs === '' && w === '') { msg.textContent = 'Type at least one limit.'; return null; }
    var lims = [];
    if (hs !== '') lims.push({ var: 'hs', op: '<=', value: hs, unit: 'm' });
    if (w !== '') lims.push({ var: 'wind_sustained', op: '<=', value: w, unit: 'kn' });
    return lims;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var lims = readForm(); if (!lims) return;
    var t0 = performance.now();
    S.custom = lims; drawWeek(true);
    msg.textContent = 'Decided now, in this tab, in ' + Math.max(1, Math.round(performance.now() - t0)) + ' ms, by the same modules as the record.';
    hash();
  });

  /* ---- the month ---- */
  function drawMonth() {
    var c = DATA.work.sites[S.ms].cells[S.ml + 'm/' + S.mt + 'h'];
    var name = DATA.work.sites[S.ms].name;
    $('jn-ws').innerHTML = L.workSentence(name, S.ml, S.mt, c);
    $('jn-w3').innerHTML = L.workThree(name, S.ml, S.mt, c, DATA.work.sites[S.ms].cells);
    $('jn-wfig').innerHTML = L.workChart(name, S.ml, S.mt, c);
    $('jn-wkey').innerHTML = L.workKey(S.ml, c);
    $('jn-wtab').innerHTML = L.workTable(c);
    [['data-ms', S.ms], ['data-ml', S.ml], ['data-mt', String(S.mt)]].forEach(function (p) {
      [].forEach.call(document.querySelectorAll('[' + p[0] + ']'), function (b) { b.setAttribute('aria-pressed', b.getAttribute(p[0]) === p[1] ? 'true' : 'false'); });
    });
  }
  [['data-ms', 'ms'], ['data-ml', 'ml'], ['data-mt', 'mt']].forEach(function (p) {
    [].forEach.call(document.querySelectorAll('[' + p[0] + ']'), function (b) {
      b.addEventListener('click', function () { S[p[1]] = p[1] === 'mt' ? +b.getAttribute(p[0]) : b.getAttribute(p[0]); drawMonth(); hash(); });
    });
  });

  /* ---- a "source" link opens the fold it points into ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#regra-"]');
    if (!a) return;
    var t = document.getElementById(a.getAttribute('href').slice(1));
    for (var d = t; d; d = d.parentElement) if (d.tagName === 'DETAILS') d.open = true;
  });

  /* ---- the dev hook: #local=..&hs=..&vento=..&mes=sid,lim,tr&celula=r,i drive the same paths the controls use ---- */
  var quiet = false;
  function hash() {
    quiet = true;
    var c = S.custom, hs = '', w = '';
    c.forEach(function (l) { if (l.var === 'hs') hs = l.value; if (l.var === 'wind_sustained') w = l.value; });
    history.replaceState(null, '', '#local=' + S.site + '&hs=' + hs + '&vento=' + w + '&mes=' + S.ms + ',' + S.ml + ',' + S.mt);
    quiet = false;
  }
  function fromHash() {
    if (quiet) return;
    var h = decodeURIComponent(location.hash.slice(1)), kv = {};
    h.split('&').forEach(function (p) { var i = p.indexOf('='); if (i > 0) kv[p.slice(0, i)] = p.slice(i + 1); });
    if (kv.local && siteOf(kv.local)) S.site = kv.local;
    if ('hs' in kv || 'vento' in kv) {
      if ('hs' in kv) form.hs.value = L.dc(kv.hs);
      if ('vento' in kv) form.vento.value = L.dc(kv.vento);
      var lims = readForm(); if (lims) S.custom = lims;
    }
    if (kv.mes) {
      var m = kv.mes.split(',');
      if (DATA.work.sites[m[0]] && DATA.work.sites[m[0]].cells[m[1] + 'm/' + m[2] + 'h']) { S.ms = m[0]; S.ml = m[1]; S.mt = +m[2]; }
    }
    drawWeek(false); drawMonth();
    if (kv.celula) { var ci = kv.celula.split(','); show(+ci[0], +ci[1]); }
  }
  fromHash();
  addEventListener('hashchange', fromHash);

  /* ---- the re-check: every published decision re-decided here, and the modules' bytes hashed ---- */
  var t0 = performance.now(), n = 0, ok = 0;
  DATA.ops.forEach(function (op) {
    var s = siteOf(op.site);
    op.steps.forEach(function (r, i) { n++; if (L.same(L.decideStep(op, s.steps[i]), r)) ok++; });
  });
  var ms = Math.max(1, Math.round(performance.now() - t0));
  $('jn-check').textContent = 'Redone now in your browser, in ' + ms + ' ms: ' + ok + ' of ' + n + ' published decisions '
    + (ok === n ? 'equal to the record.' : '— ' + (n - ok) + ' DIFFERENT from the record.');
  var out = $('jn-sha');
  if (out && self.crypto && crypto.subtle && self.TextEncoder) {
    var names = Object.keys(M.pins), done = 0, good = 0;
    names.forEach(function (k) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(M.src[k])).then(function (buf) {
        var hex = [].map.call(new Uint8Array(buf), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
        done++; if (hex === M.pins[k].sha) good++;
        if (done === names.length) out.textContent = good === names.length
          ? 'Checked in this tab: the ' + names.length + ' modules that decide here have the sha256 pinned above.'
          : 'WARNING: ' + (names.length - good) + ' module(s) with a sha256 different from the pin.';
      });
    });
  }
}

/* ---------------------------------------------------------------- css --- */
function css() {
  return `
/* ---- Janela (apps/janela/page.js) ---- */
/* a tool's documentation, not a manifesto: the hero at the report's section size (operator 2026-10-07: "big texts") */
.jn-hero h1{font-size:var(--text-1);letter-spacing:var(--track-title)}
.jn-hero .deck{max-width:var(--read)}
.jn-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4)}
.jn-quad{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden;margin:var(--s-7) 0 0}
.jn-quad > div{background:var(--sunk);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-3)}
.jn-quad p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-body)}
@media (max-width:1000px){.jn-quad{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.jn-quad{grid-template-columns:minmax(0,1fr)}}
.jn-cta{display:flex;flex-wrap:wrap;gap:var(--s-3);margin:var(--s-6) 0 0}
.jn-cta a{border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:var(--s-2) var(--s-4);
  font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.jn-cta a.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.jn-cta a:hover{border-color:var(--ink)}

/* verdicts: WEIGHT + SHAPE, never colour alone — filled, outlined with a cross,
   dashed and half-filled, dotted and empty */
.jn-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:var(--text-eyebrow);font-weight:var(--weight-strong);
  letter-spacing:var(--track-loose);text-transform:uppercase;padding:var(--s-1) var(--s-3);border-radius:var(--radius-pill);
  white-space:nowrap;border:1px solid transparent;align-self:flex-start}
.jn-chip.big{font-size:var(--text-small)}
.jn-chip.lib{background:var(--ink);color:var(--paper)}
.jn-chip.vet{border:2px solid var(--ink);color:var(--ink)}
.jn-chip.ind{border:1px dashed var(--ink-3);color:var(--ink-2)}
.jn-chip.sem{border:1px dotted var(--ink-4);color:var(--ink-3)}
.jn-v{display:block;width:16px;height:16px;border-radius:3px;margin:0 auto}
.jn-v.lib{background:var(--ink)}
.jn-v.vet{border:2px solid var(--ink);background:linear-gradient(45deg,transparent 40%,var(--ink) 40% 60%,transparent 60%),
  linear-gradient(-45deg,transparent 40%,var(--ink) 40% 60%,transparent 60%)}
.jn-v.ind{border:1px dashed var(--ink-2);background:linear-gradient(135deg,var(--ink-4) 0 50%,transparent 50%)}
.jn-v.sem{border:1px dotted var(--ink-4)}
.jn-legend{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-5);margin:0 0 var(--s-4);padding:0;list-style:none}
.jn-legend li{display:flex;align-items:center;gap:var(--s-2);font-size:var(--text-small);color:var(--ink-3)}
.jn-legend .jn-v{margin:0}

/* the site picker */
.jn-pick{display:flex;flex-wrap:wrap;gap:var(--s-4) var(--s-6);margin:var(--s-5) 0}
.jn-pg{display:flex;flex-direction:column;gap:var(--s-2)}
.jn-bs{display:flex;flex-wrap:wrap;gap:var(--s-2)}
.jn-b{font:inherit;cursor:pointer;background:var(--surface);color:var(--ink-3);border:1px solid var(--rule);border-radius:var(--radius-s);
  padding:var(--s-2) var(--s-3);display:flex;flex-direction:column;align-items:flex-start;gap:var(--s-1);text-align:left;
  font-size:var(--text-small);line-height:var(--leading-snug);transition:border-color var(--dur-fast) var(--ease-out)}
.jn-b small{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.jn-b:hover{border-color:var(--rule-strong)}
.jn-b[aria-pressed="true"]{border-color:var(--ink-3);background:var(--surface2);color:var(--ink)}
.jn-b:focus-visible{outline:2px solid var(--ink);outline-offset:2px}

/* your limit */
.jn-form{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--s-3) var(--s-4);margin:0 0 var(--s-5);padding:var(--s-4);
  border:1px solid var(--rule-strong);border-radius:var(--radius-m);background:var(--surface)}
.jn-form .jn-k{flex-basis:100%}
.jn-form label{display:flex;flex-direction:column;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.jn-form input{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);width:110px;background:var(--sunk);color:var(--ink);
  border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-2) var(--s-3)}
.jn-form button{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);cursor:pointer;background:var(--ink);color:var(--paper);
  border:0;border-radius:var(--radius-pill);padding:var(--s-2) var(--s-4)}
.jn-form p{flex-basis:100%;margin:0;color:var(--ink-4);font-size:var(--text-small)}

/* the site panel */
.jn-sh{margin:0 0 var(--s-4)}
.jn-sh h3{margin:var(--s-1) 0 var(--s-2)}
.jn-node{margin:0;max-width:var(--read);color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-body)}
.jn-gw{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--rule);border-radius:var(--radius-m);background:var(--sunk)}
.jn-gw:focus-visible{outline:2px solid var(--ink-3);outline-offset:2px}
table.jn-grid{border-collapse:separate;border-spacing:0;width:100%;min-width:0;font-family:var(--f-mono);font-size:var(--text-eyebrow)}
.jn-grid th,.jn-grid td{padding:0;border-bottom:1px solid var(--rule);text-align:center;vertical-align:middle;white-space:nowrap;
  text-transform:none;letter-spacing:normal}
.jn-grid thead th{color:var(--ink-4);font-weight:var(--weight-mono);letter-spacing:var(--track-slight);text-transform:none;padding:var(--s-2) 0}
.jn-grid thead th.jn-day{color:var(--ink-3)}
.jn-grid .jn-hr.past{color:var(--ink-5)}
.jn-grid .jn-d0{border-left:1px solid var(--rule-strong)}
.jn-grid .jn-rl{position:sticky;left:0;z-index:1;background:var(--sunk);text-align:left;white-space:normal;
  width:250px;min-width:250px;max-width:250px;padding:var(--s-3) var(--s-4);border-right:1px solid var(--rule-strong)}
.jn-grid thead .jn-rl{text-transform:uppercase;letter-spacing:var(--track-loose)}
.jn-rl b{display:block;color:var(--ink);font-family:var(--f-sans);font-size:var(--text-small);font-weight:var(--weight-medium);line-height:var(--leading-snug)}
.jn-rl span{display:block;color:var(--ink-4);margin-top:var(--s-1);line-height:var(--leading-snug)}
.jn-rl .jn-exp,.jn-rl .jn-own{color:var(--ink-3)}
.jn-rl .jn-src{display:inline-block;margin-top:var(--s-1);color:var(--ink-3)}
.jn-ownr .jn-rl{background:var(--surface)}
.jn-c{display:block;width:100%;min-width:28px;height:44px;padding:0;background:transparent;border:0;cursor:pointer}
.jn-c.past .jn-v{opacity:.55}
.jn-c:hover,.jn-c.on{background:var(--surface2)}
.jn-c.on{box-shadow:inset 0 0 0 1px var(--ink-3)}
.jn-c:focus-visible{outline:2px solid var(--ink);outline-offset:-2px}
@media (max-width:700px){.jn-grid .jn-rl{width:150px;min-width:150px;max-width:150px;padding:var(--s-2) var(--s-3)}
  .jn-rl span{display:none}.jn-rl .jn-src{display:none}}

/* the readout: DECIDED in mono roman, FORECAST in italic — never the same type */
.jn-ro{margin:var(--s-4) 0 0;border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-4) var(--s-5);background:var(--surface)}
.jn-ro-h{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) var(--s-3);margin:0 0 var(--s-3)}
.jn-ro-t{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-3)}
.jn-ro p{margin:0 0 var(--s-2);font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2);max-width:var(--read)}
.jn-ro p:last-child{margin-bottom:0}
.jn-ro .jn-why{color:var(--ink);font-size:var(--text-body)}
.jn-ro .jn-k{margin-right:var(--s-2)}
.jn-dc{font-family:var(--f-mono);color:var(--ink)}
.jn-fc{font-style:italic;color:var(--ink-3)}
.jn-fc .jn-k{font-style:normal}
.jn-check{margin:var(--s-3) 0 0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}

/* the strips and the month chart */
.jn-strips{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-5);margin:var(--s-6) 0 0}
.jn-fig .figbox{padding:var(--s-4)}
.jn-fig .figbox svg,.jn-wf .figbox svg{min-width:640px}
.jn-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:var(--s-3) 0 0;padding:0;list-style:none}
.jn-key li{display:flex;align-items:center;gap:var(--s-2);font-size:var(--text-small);color:var(--ink-2)}
.jn-key li.jn-fck{font-style:italic;color:var(--ink-3)}
svg.jn-sw{width:28px;height:12px;flex:none}
svg .jn-gl{stroke:var(--rule-strong);stroke-width:1}
svg .jn-dl{stroke:var(--rule-strong);stroke-width:1}
svg .jn-band{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
/* the forecast lines are drawn by playground/warrant.js attrs(COMPUTED); their dash comes from design/grammar.js */
svg .jn-halo{fill:var(--ink-2);stroke:var(--ink-2);stroke-width:5;stroke-linejoin:round;opacity:.3}
svg .jn-ens{stroke:none}
svg .jn-hl{stroke:var(--ink-4);stroke-width:1}
svg .jn-swr{fill:none;stroke:var(--ink-5);stroke-width:1}
svg .jn-lim{stroke:var(--ink-2);stroke-width:1.2;stroke-dasharray:${G.GUIDE}}
svg .jn-limt{fill:var(--ink-2);font-size:var(--text-small);paint-order:stroke;stroke:var(--sunk);stroke-width:4}
svg .jn-w1{fill:var(--c-1)}
svg .jn-w2{fill:var(--c-3)}
svg .jn-w3{fill:var(--c-2)}
.jn-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-4);margin:0 0 var(--s-5)}
@media (max-width:700px){.jn-three{grid-template-columns:minmax(0,1fr)}}
.jn-three > div{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-4) var(--s-5);display:flex;flex-direction:column;gap:var(--s-1)}
.jn-three > div.est{border-style:dashed;border-color:var(--ink-4)}
.jn-three .big{font-family:var(--f-display);font-size:var(--text-2);color:var(--ink);letter-spacing:var(--track-title);line-height:var(--leading-tight)}
.jn-three p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-snug)}
.jn-three > div.est p{font-style:italic}
.jn-hint{margin:0 0 var(--s-4);color:var(--ink-4);font-size:var(--text-small);max-width:var(--read)}
.jn-at td{white-space:nowrap}
.jn-a{display:block;color:var(--ink);font-weight:var(--weight-strong)}
.jn-ai{display:block;color:var(--ink-3)}
.jn-ar{display:block;color:var(--ink-4);font-size:var(--text-eyebrow)}
svg .jn-wv{fill:var(--ink-3);font-size:var(--text-eyebrow)}

/* the month controls */
.jn-ctl{display:flex;flex-wrap:wrap;gap:var(--s-4) var(--s-6);margin:0 0 var(--s-5)}
.jn-seg{display:flex;flex-direction:column;gap:var(--s-2)}
.jn-ws{font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-2);max-width:var(--read);margin:0 0 var(--s-5)}
.jn-ws b{color:var(--ink);font-weight:var(--weight-medium);font-family:var(--f-mono)}
.jn-wf{margin:0}

/* the scoreboard and the trust layer */
.jn-ev{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5);margin:var(--s-5) 0 0}
@media (max-width:760px){.jn-ev{grid-template-columns:minmax(0,1fr)}}
.jn-ev>:last-child:nth-child(odd){grid-column:1/-1} /* FULL-ROW RULE */
.jn-ev > div{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-2)}
.jn-ev p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-body)}
.jn-ev .big{font-family:var(--f-display);font-size:var(--text-2);color:var(--ink);letter-spacing:var(--track-title);line-height:var(--leading-tight)}
.jn-rule{border-top:1px solid var(--rule);padding:var(--s-5) 0 0;margin:var(--s-5) 0 0}
.jn-rule h3{margin:0 0 var(--s-2);font-size:var(--text-3)}
.jn-rule p{margin:0 0 var(--s-2);font-size:var(--text-small);color:var(--ink-3);max-width:var(--read)}
.jn-rule blockquote{font-size:var(--text-small)}
.jn-pin{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);word-break:break-all}
`;
}

/* ======================================================================
   WHAT EACH NUMBER RESTS ON (WARRANT v2.1, design/WARRANT.md rules 11-12).
   The verdicts are exact arithmetic; they are exact OVER premises, and each
   premise was checked to a different rung of the verification-and-validation
   ladder (Roache 1998; Oberkampf & Roy 2010; ASME V&V 20). Every grade below is
   read by numbers.js premises() from the record that earns it, and the build
   refuses when a record stops saying what the grade needs. A grade is where the
   checking stopped, never a probability.
   ====================================================================== */
function restsSection(N, L, sec, borrowKm) {
  const P = N.premises, H = P.heldOut.main, A = P.alpha, Hc = P.hindcast, D = N.ledger.decisions;
  /* the ladder's own English words (playground/warrant.js GRADE, GRADE_GLOSS) */
  const GW = W.GRADE;
  /* `from`: the record cells the value is computed from (numbers.js N.at, D10) */
  const fl = (txt, rec, from) => W.value(txt, W.COMPUTED, { title: 'computed — a floating-point evaluation (' + rec + ')', derived: from });
  const pc = (x, k, rec, from) => fl(L.dc((100 * x).toFixed(k)) + '%', rec, from);
  const EV = N.at.eval, L2 = '/limits/2.0';
  const mm = (iso) => iso.slice(0, 7);
  const chain = (items, meetLine) => W.premisesHtml(items, { meetLine });
  const weakest = (items) => GW[W.weakest(...items.map((x) => x.grade))];
  const fwd = (crit) => {
    const b = D && D.graded && D.byCrit && D.byCrit[crit];
    return b ? ' Going forward: since ' + nf.date(D.days[0]) + ', of this criterion\'s CLEARED windows that a satellite saw at the open-sea sites, ' + nf.int(b.L.held) + ' held and ' + nf.int(b.L.broke) + ' broke (Hs only; a descriptive count, the one-day windows overlap).' : '';
  };
  const U = H.opt['U(E,N)'], Ua = EV[H.file].opt['U(E,N)'];
  const hsBand = { grade: W.VALIDATED, label: 'The Hs band, at the measured sites', evidence: 'calibrated before ' + mm(H.split) + ' and judged over ' + H.months + ' months it did not see: the union ECMWF ∪ NOAA covered '
    + pc(U.coverage, 1, H.file, Ua + '/coverage') + ' of ' + nf.int(H.test) + ' satellite passes (it claims 9 in 10); of the CLEARED windows with Hs ≤ 2 m, the sea broke ' + pc(U.broke / U.liberada, 2, H.file, [Ua + L2 + '/brokeLiberada', Ua + L2 + '/liberada'])
    + ' (' + nf.int(U.broke) + ' of ' + nf.int(U.liberada) + ').'
    + Object.entries(P.heldOut).filter(([k]) => k !== 'main').map(([k, R]) => ' At ' + esc(k === 'sergipe' ? 'Sergipe-Alagoas' : k) + ', judged separately (' + nf.int(R.test) + ' passes): the union covered '
      + pc(R.opt['U(E,N)'].coverage, 1, R.file, EV[R.file].opt['U(E,N)'] + '/coverage') + '; ECMWF\'s band alone, ' + pc(R.opt.E.coverage, 1, R.file, EV[R.file].opt.E + '/coverage') + (R.opt.E.coverage < 0.9 ? ', below what it claims' : '') + '.').join('') };
  const windBand = { grade: W.ASSUMED, label: 'The wind band', evidence: 'measured on the same ' + nf.int(P.wind.rows) + ' pairs (the altimeter\'s wind); it claims 9 in 10 by theorem, if the next error resembles the archive\'s. That was not tested outside calibration: the scoreboard and the check of the decisions look at Hs only.' };
  const hsShort = { grade: W.VALIDATED, label: 'The Hs band, at the measured site it comes from', evidence: 'the same band validated above, at the measured sites.' };
  const carried = { grade: W.ASSUMED, label: 'The band carried to a unit or a terminal', evidence: 'each unit uses the band and the α of the nearest measured site, up to ' + borrowKm + ' km away; a terminal, its open-sea neighbour\'s. The forecast error there is assumed to hold here; nothing measured it at the unit\'s node, and an altimeter cannot see inside a bay.' };
  const sum = (k) => Object.values(A.bySite).reduce((a, s) => a + s[k], 0);
  const t41 = { grade: W.ASSUMED, label: 'The α of Table 4-1 (DNV-OS-H101)', evidence: 'adopted from DNV, calibrated in the North Sea; the 1-in-' + nf.int(A.oneIn) + ' tail behind it is extrapolated: three years of satellite data do not observe it. On the pairs here, the 90% interval of the estimated α lies above the table\'s in '
    + sum('above') + ' of ' + sum('est') + ' estimated cells and below it in ' + sum('below') + ': the table is conservative for the most part, if the Gaussian tail model holds.' };
  const t46 = { grade: W.ASSUMED, label: 'The wind α (Table 4-6)', evidence: 'adopted from DNV; not redone here.' };
  const method = { grade: W.VERIFIED, label: 'The site-α method', evidence: 'reproduces DNV\'s Table 4-1 in ' + A.within + ' of ' + A.of + ' cells (±' + L.dc(A.tol) + ') before looking at Brazil; it does not reproduce '
    + A.missed.map((m) => 'Hs ' + L.dc(String(m.hs)) + ' m with TPOP ' + m.T + ' h').join(', ') + '.' };
  const est = { grade: W.ASSUMED, label: 'The α estimated at each site', evidence: 'from three years of forecast × satellite pairs, in floating point (resampled by day, 90% interval); the decision uses the lower end, rounded down, a choice made for caution. The same 1-in-' + nf.int(A.oneIn) + ' tail, extrapolated.' };
  const rnd = (x, up) => { const v = up ? Math.ceil(x * 100 - 1e-9) / 100 : Math.floor(x * 100 + 1e-9) / 100; return (v > 0 ? '+' : v < 0 ? '−' : '') + L.dc(Math.abs(v).toFixed(2)); };
  const at = Object.values(Hc.buoysAt).filter((b) => b.length).length, nodes = Object.keys(Hc.buoysAt).length;
  const hind = { grade: at === nodes ? W.VALIDATED : W.ASSUMED, label: 'The hindcast (Ifremer WAVEWATCH III) at the areas\' ' + nodes + ' nodes',
    evidence: (at ? at + ' of the ' + nodes + ' nodes have a buoy. ' : 'No buoy at any of the areas\' nodes. ') + 'Checked against ' + Hc.deployments + ' deployments of the Brazilian Navy\'s buoys (PNBOIA, the Navy\'s buoy network, ' + Hc.from + '–' + Hc.to + ') at ' + Hc.nodes + ' other nodes of the margin, '
      + nf.int(Hc.pairs) + ' pairs: bias from ' + rnd(Hc.bias[0], false) + ' to ' + rnd(Hc.bias[1], true) + ' m, RMS from ' + L.dc((Math.floor(Hc.rms[0] * 100 + 1e-9) / 100).toFixed(2)) + ' to ' + L.dc((Math.ceil(Hc.rms[1] * 100 - 1e-9) / 100).toFixed(2))
      + ' m; Hs ≤ 2 m for ' + pc(Hc.le2.buoy / Hc.le2.n, 1, 'certs/janela-pnboia-check.json', N.at.hindcast.le2) + ' of the time at the buoys and ' + pc(Hc.le2.hind / Hc.le2.n, 1, 'certs/janela-pnboia-check.json', N.at.hindcast.le2) + ' in the hindcast (certs/janela-pnboia-check.json).' };
  const cur = { grade: W.ASSUMED, label: 'The current (Copernicus Marine, 1/12°)', evidence: 'shown, never decided. The truth it will be checked against (GlobCurrent, rule current-truth-v1, fixed on ' + nf.date(P.currents.since) + ') is being gathered; no comparison recorded yet.' };
  const block = (h, items, meet) => '<h3>' + esc(h) + '</h3>' + chain(items, meet);
  return '<section id="premissas"><div class="col sec-head"><div class="lab">' + sec + ' · what each number rests on</div><h2>The arithmetic is exact; the premises were checked to different rungs, and the decision is worth the weakest.</h2></div>'
    + '<div class="col">' + C.pRaw('Each premise has a rung, from the verification and validation ladder of modelling (Roache 1998; Oberkampf and Roy 2010; ASME V&amp;V 20): <b>validated</b>, checked against the sea itself, held out of calibration; <b>compared</b>, against a model that keeps more of the physics; <b>verified</b>, the code against a reference solution of its own equations; <b>assumed</b>, adopted from a source or chosen. The rung is where the checking stopped, never a probability.')
    + block('By the measured band, at a measured site', [hsBand, windBand], 'With an Hs-only limit, the weakest premise sits at the rung <b>' + weakest([hsBand]) + '</b>; with a wind limit, at the rung <b>' + weakest([hsBand, windBand]) + '</b>.' + fwd('band'))
    + block('At a production unit or a terminal', [hsShort, carried], 'The weakest premise sits at the rung <b>' + weakest([hsShort, carried]) + '</b>: on the chart, the carried band has a halo.')
    + block('By DNV\'s Table 4-1', [t41, t46], 'The weakest premise sits at the rung <b>' + weakest([t41, t46]) + '</b>.' + fwd('table'))
    + block('By the site\'s α', [method, est, t46], 'The weakest premise sits at the rung <b>' + weakest([method, est, t46]) + '</b>.' + fwd('site'))
    + block('The month and the campaign', [hind, t41], 'Each count is exact over the hindcast; the weakest premise sits at the rung <b>' + weakest([hind, t41]) + '</b>: the past sea is a model\'s' + (at === nodes ? '.' : ', and no buoy checked it at the areas\' nodes.'))
    + block('What is shown and never decided', [cur], null)
    + '</div></section>';
}

/* ================================================================ build */
function build(N, B, git, battery) {
  const D = require(path.join(ROOT, 'instruments', 'window', 'decide.js'));
  const Q = require(path.join(ROOT, 'instruments', 'window', 'q.js'));
  /* THE INK (WARRANT, design/WARRANT.md): the grammar's strokes and voices, from playground/warrant.js and nowhere else;
     lib() draws with them here and in the reader's tab (data.ink), so the two grids are one design */
  const ext = (s, cls, w) => W.extentAttrs(s, { width: w }).replace(/class="([^"]+)"/, 'class="$1 ' + cls + '"').replace(' fill="none"', '');
  /* a voice is [open, close] for an unaddressed value and, after them, [open, between, close] around the address list
     for a value read from records (W.value's data-derived, D10) — both made by W.value, so the tab writes the same span */
  const voice = (s, title) => W.value('\u0000', s, { title }).split('\u0000').concat(W.value('\u0000', s, { title, derived: '\u0001' }).split(/\u0000|\u0001/));
  /* A FIGURE NAMES ITS RECORD AND THE SENTENCE THAT WOULD STOP IT (R23, R30): the caption is design/components.js's own
     (figure({ record, stop })), cut out of it so the tab, which redraws the figures, carries the same bytes as data */
  const capOf = (record, stop) => {
    const m = /<figcaption[\s\S]*?<\/figcaption>/.exec(C.figure({ svgRaw: '', record, stop }));
    if (!m) throw new Error('janela page: design/components.js figure() made no caption');
    return m[0];
  };
  const bandRecs = require('./audit/bandset.js').files().filter((f) => /janela-bands/.test(f));
  const INK = { det: W.attrs(W.COMPUTED, { width: 2 }), gust: W.attrs(W.COMPUTED, { width: 1.2 }) + ' opacity="' + G.IDENTITY[1].opacity + '"',
    band: ext(W.DECIDED, 'jn-band', 1.5), ens: ext(W.COMPUTED, 'jn-ens', 1), swr: ext(W.COMPUTED, 'jn-swr', 1), w3: ext(W.CHOSEN, 'jn-w3', 1),
    comp: voice(W.COMPUTED, 'computed — a forecast or an estimate in floating point; nothing decided it'),
    chosen: voice(W.CHOSEN, 'chosen — counted exactly over the site\'s α at the lower end of its 90% interval, one member of the interval, chosen for caution'),
    legend: '', legendChosen: '',
    /* the strips: the day's feed(s) and the measured bands; the stop is the gate below (every published decision
       re-decided by this page's own function equals the record) */
    capStrip: capOf([N.feed.file].concat(N.noaa ? [N.noaa.file] : [], bandRecs),
      'a published decision, re-decided by this page\'s own function over the band drawn here, differs from the record'),
    /* the month: the workability record; the stop is apps/janela/battery.js (run by gates.js before this build) */
    capWork: capOf('certs/janela-workability.json',
      'the battery (apps/janela/battery.js) re-derives a workability cell from the pinned hindcast unequal to the record, or a module the record was written with has changed') };
  /* each legend derived from the marks its figure draws (R20): the band with the forecast lines, the band with the chosen α */
  INK.legend = W.legendHtml({ compact: true, from: INK.band + INK.det });
  INK.legendChosen = W.legendHtml({ compact: true, from: INK.band + INK.w3 });
  const L = lib(Q, D, INK);
  const out = [];
  const claim = (() => { const [a, b] = String(N.bands.miss).split('/').map(Number); return (b - a) + '/' + b; })();
  const groupOf = {};
  for (const g of N.groups) for (const s of N.sites) if (g.kinds.includes(s.kind)) groupOf[s.id] = g.kinds.map((k) => GROUP_EN[k] || k).join(', ');

  /* the gate the page itself owes: every published decision re-decided by the
     page's own function must equal the record — or the build refuses */
  let checked = 0;
  for (const op of N.ops) {
    const s = N.sites.find((x) => x.id === op.site);
    op.steps.forEach((r, i) => {
      checked++;
      if (!L.same(L.decideStep(op, s.steps[i]), r)) throw new Error('janela page: the page decides ' + op.id + ' at ' + r.t + ' differently from the record');
    });
  }

  /* the default site: the terminal whose week says the most (most decided cells), else the first terminal */
  const decidedCells = (sid) => N.ops.filter((o) => o.site === sid).reduce((a, o) => a + o.steps.filter((r) => r.verdict !== 'SEM DADOS').length, 0);
  const terms = N.sites.filter((s) => s.kind === 'terminal');
  const def = (terms.slice().sort((a, b) => decidedCells(b.id) - decidedCells(a.id))[0] || N.sites[0]).id;
  const custom = [{ var: 'hs', op: '<=', value: '2.5', unit: 'm' }, { var: 'wind_sustained', op: '<=', value: '20', unit: 'kn' }];
  const ctx = { claim, madeAt: N.feed.madeAt };
  /* the names the page prints are the English ones (operations.json and sites.json `en`); N is not touched (the deck reads it) */
  const opName = (o) => o.en || o.name;
  const opsOut = N.ops.map((o) => ({ id: o.id, site: o.site, name: opName(o), limits: o.limits, hsAt: o.hsAt, status: o.status,
    steps: o.steps.map((r) => ({ verdict: r.verdict, witness: r.witness, flip: r.flip, notForecast: r.notForecast, decidedOn: r.decidedOn })) }));
  const sitesOut = N.sites.map((s) => ({ id: s.id, name: siteEn(s.id, s.name), kind: s.kind, lat: s.lat, lon: s.lon, node: s.node, km: s.km,
    bandFrom: s.bandFrom, bandFromName: s.bandFrom ? siteEn(s.bandFrom, s.bandFromName) : null, steps: s.steps }));
  const defSite = sitesOut.find((s) => s.id === def);
  const defRows = L.rowsFor(defSite, opsOut, custom);
  const defSel = L.defaultSel(defSite, defRows);
  /* the month opens on the operation the site alpha speaks to, when the record has it */
  const workSites = Object.fromEntries(Object.entries(N.work.sites).map(([sid, ws]) => [sid, Object.assign({}, ws, { name: siteEn(sid, ws.name), cells: Object.fromEntries(Object.entries(ws.cells).map(([k, c]) =>
    [k, c.s ? Object.assign({}, c, { s: Object.assign({}, c.s, { at: N.at.siteAlpha[sid][k] }) }) : c])) })]));
  const work = { def: workSites.santos.cells['2.0m/48h'] && workSites.santos.cells['2.0m/48h'].s ? { s: 'santos', l: '2.0', t: 48 } : { s: 'santos', l: '2.5', t: 48 }, sites: workSites };
  const wc = workSites.santos.cells[work.def.l + 'm/' + work.def.t + 'h'];
  const yFrom = N.work.from.slice(0, 4), yTo = N.work.to.slice(0, 4), years = Number(yTo) - Number(yFrom) + 1;
  const pinM = /^(\d+) monthly files/.exec(N.work.pinned || '');
  const pinEn = pinM ? ' (' + pinM[1] + ' monthly files, each checked by sha256 against corpus/ww3-points/meta.json)' : '';
  const run = nf.date(N.feed.run) + ' ' + N.feed.run.slice(11, 13) + ' UTC';
  const made = nf.date(N.feed.madeAt) + ' ' + nf.hm(N.feed.madeAt) + ' UTC';
  const P = N.ledger.proposers;
  const STATUS = { ADMITTED: 'ADMITTED', DEADMITTED: 'PRUNED' };
  /* the admission in one line, from placar.js's verdict (trials = target days, looks at 30·2^j) */
  const admLine = (p) => p.pending
    ? p.trials + ' of ' + N.ledger.firstLook + ' trial days: nothing tested yet; the first reading is on day ' + N.ledger.firstLook
    : p.status === 'DEADMITTED'
      ? 'pruned on trial day ' + p.prunedAt.m + ' (' + nf.date(p.prunedAt.through) + '): ' + p.prunedAt.covered + ' covered, exact tail ' + p.prunedAt.tail + ' ≤ ' + p.prunedAt.bar
      : p.trialsCovered + ' of ' + p.trials + ' trial days covered; at the ' + p.looks[p.looks.length - 1].m + '-day reading, exact tail ' + p.tail + ' > ' + p.bar + '; next reading at ' + p.next;
  const n = (k) => N.counted.byKind[k] || 0;

  /* ---- 0 · hero ---- */
  const quad = ['LIBERADA', 'VETADA', 'INDEFINIDA', 'SEM DADOS'];
  const QUAD = {
    'LIBERADA': 'Every limit holds at the unfavourable edge of the forecast band, at every step of the window.',
    'VETADA': 'A limit fails even at the favourable edge. It comes with the witness: the hour and the variable.',
    'INDEFINIDA': 'The band straddles the limit. It comes with the threshold: how far the edge must move to flip.',
    'SEM DADOS': 'The forecast clears, but the rule limits something nobody forecasts here, such as current and visibility, and it says what.'
  };
  out.push('<header class="col jn-hero">'
    + '<div class="eyebrow">Janela · offshore energy · operational windows</div>'
    + '<h1>The operational window, decided.</h1>'
    + '<p class="deck">For production areas, platforms and oil and LNG terminals: the sea forecast with its error measured against satellites, decided against the published limit — the Harbour Master\'s (Capitania dos Portos), DNV\'s or yours. Each hour comes out with one of four verdicts and the reason.</p>'
    + '<div class="jn-quad">' + quad.map((v) => '<div>' + L.chip(v, true) + '<p>' + esc(QUAD[v]) + '</p></div>').join('') + '</div>'
    + '<div class="jn-cta"><a class="go" href="/janela/">Open the app ↗</a><a href="/janela/janela-apresentacao.pdf">The deck, in Portuguese (PDF)</a><a href="#para-quem">Who it is for ↓</a><a href="#semana">The week ↓</a><a href="#mes">The month ↓</a>' + (N.alpha ? '<a href="#alfa">The site\'s α ↓</a>' : '') + '<a href="#placar">The scoreboard ↓</a><a href="#confiar">Why trust it ↓</a></div>'
    + '</header>');
  out.push(C.stats([
    { k: 'sites', v: String(N.counted.sites), n: n('field') + ' production areas, ' + n('platform') + ' platform, ' + n('terminal') + ' terminals and ' + n('coast') + ' coastal point; the model node of each one, named' },
    { k: 'published limits', v: N.ops.length + ' operations', n: 'from ' + N.acts.length + ' acts of the Maritime Authority (NPCPs, the Harbour Masters\' local rules, and ordinances), with page and literal quote' },
    { k: years + ' years counted', v: nf.int(N.work.samples), n: '3-hourly sea states per area, ' + yFrom + '–' + yTo + ': windows counted exactly, nothing fitted' },
    { k: 'scoreboard', v: nf.int(N.ledger.commits), n: 'forecasts committed before the target hour since ' + (N.ledger.first ? nf.date(N.ledger.first) : '—') + '; ' + N.ledger.scored + ' scored so far' }
  ]));
  out.push('<div class="col">' + C.scope('What is decided is the forecast band at the forecast\'s own steps, at the model node: not the sea between steps, not the berth, not a probability. It is not an approval of an operation; it is evidence a surveyor can redo.') + '</div>');
  /* this page is a portrait of one run; the app is the live view (the daily Action rebuilds the app's day, not this page) */
  out.push('<div class="col">' + C.pRaw('<b>A portrait of the ECMWF run of ' + esc(run) + '.</b> The numbers on this page — the week, the decisions, the scoreboard — are that day\'s, to document the method. Today\'s windows and today\'s scoreboard are in the app: <a href="/janela/">/janela/</a>.') + '</div>');

  /* ---- who it is for: the use cases (PRODUCT.md, "who opens it"), each a door into the app's state ---- */
  out.push('<section id="para-quem"><div class="col sec-head"><div class="lab">who it is for</div><h2>Six decisions, and the door to each one in the app.</h2></div>'
    + '<div class="col">' + C.p('Each card opens the app on the question already: the right operation, mode and criterion. The example limits say they are examples; replace them with your procedure\'s, and they stay in your browser only.') + '</div>'
    + C.cards(require('./uses.js').cases('en').map((u) => ({ k: u.who, title: u.q, desc: u.gets, n: u.n, href: u.href }))) + '</section>');

  /* ---- 1 · the week ---- */
  const picker = '<div class="jn-pick" role="group" aria-label="Site">' + N.groups.map((g) => {
    const ss = sitesOut.filter((s) => g.kinds.includes(s.kind));
    if (!ss.length) return '';
    return '<div class="jn-pg"><div class="jn-k">' + esc(g.kinds.map((k) => GROUP_EN[k] || k).join(', ')) + '</div><div class="jn-bs">' + ss.map((s) => {
      const k = L.kicker(s.name);
      return '<button type="button" class="jn-b jn-site" data-s="' + esc(s.id) + '" aria-pressed="' + (s.id === def ? 'true' : 'false') + '">' + esc(L.short(s.name)) + (k ? '<small>' + esc(k) + '</small>' : '') + '</button>';
    }).join('') + '</div></div>';
  }).join('') + '</div>';
  const legend = '<ul class="jn-legend">' + quad.map((v) => '<li>' + L.glyph(v) + '<span><b>' + esc(L.vw(v)) + '</b> · ' + esc(L.MEANS[v]) + '</span></li>').join('') + '</ul>';
  const thin = N.bandSteps.withBand < N.bandSteps.withHs / 2;
  const cnt = N.counts;
  out.push('<section id="semana"><div class="col sec-head"><div class="lab">1 · the week</div><h2>Seven days in 6-hour steps: each operation decided against its limit.</h2></div>'
    + '<div class="col">' + C.pRaw('ECMWF forecast of ' + esc(run) + ', read at ' + esc(made) + '; Brasília time (UTC−3). In this run, ' + nf.int(N.decisions) + ' published decisions: '
      + quad.map((v) => cnt[v] + ' ' + esc(L.vw(v))).join(', ') + '. Tap a cell: the reason, the witness or the threshold that would flip the verdict.')
    + (thin ? C.note({ lab: 'why almost everything says NEEDS DATA today', bodyRaw: C.p('Each site\'s and lead\'s measured band comes from the satellite × forecast pairs of the 2023–2026 archive, and that archive is still being assembled: today there are '
      + nf.int(N.bands.rows) + ' pairs, and ' + N.bands.okCells + ' of ' + N.bands.cells + ' combinations of site, lead and variable already have enough pairs to claim coverage of ' + claim
      + '. Where they do not, Janela does not decide: it says NEEDS DATA and why. When the archive is complete, the same page rebuilds from the same records.') }) : '')
    + '</div>'
    + '<div class="wide">' + picker
    + '<form class="jn-form" id="jn-form" autocomplete="off"><div class="jn-k">your limit · decided in this tab</div>'
    + '<label>Hs up to (m)<input name="hs" inputmode="decimal" value="' + L.dc(custom[0].value) + '"></label>'
    + '<label>wind up to (kn)<input name="vento" inputmode="decimal" value="' + L.dc(custom[1].value) + '"></label>'
    + '<button type="submit">Decide</button>'
    + '<p id="jn-form-msg">An example; replace it with your procedure\'s limits. The same measured band, the same modules as the record, decided on your machine.</p></form>'
    + legend
    + '<div id="jn-panel">' + L.panel(defSite, defRows, defSel, ctx, opsOut, custom, groupOf[def]) + '</div>'
    + '<p class="jn-check" id="jn-check">' + esc('At build: ' + checked + ' of ' + checked + ' published decisions redone by this page\'s function, equal to the record.') + '</p>'
    + '</div></section>');

  /* ---- 2 · the month ---- */
  const wsites = Object.keys(N.work.sites);
  const segBtn = (attr, val, label, on) => '<button type="button" class="jn-b" ' + attr + '="' + esc(val) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(label) + '</button>';
  out.push('<section id="mes"><div class="col sec-head"><div class="lab">2 · the month</div><h2>' + years + ' years counted: how many windows the sea opens each month, and how many the table\'s α closes.</h2></div>'
    + '<div class="col">' + C.p('For the ' + wsites.length + ' production areas, every 3-hourly operation start from ' + yFrom + ' to ' + yTo + ' is counted: a window of TR hours with Hs under the limit (OPLIM) fits or does not. The second bar redoes the count with the forecast limit DNV says to use, OPWF = α × OPLIM (Table 4-1, TPOP = TR/2)' + (N.alpha ? '; where there are enough satellite pairs, the third uses the α estimated at the site itself (“The site\'s alpha”, below)' : '') + '. Exact fractions of integers, nothing fitted.') + '</div>'
    + '<div class="wide"><div class="jn-ctl">'
    + '<div class="jn-seg"><div class="jn-k">area</div><div class="jn-bs">' + wsites.map((sid) => segBtn('data-ms', sid, L.short(workSites[sid].name), sid === work.def.s)).join('') + '</div></div>'
    + '<div class="jn-seg"><div class="jn-k">Hs limit (OPLIM)</div><div class="jn-bs">' + N.work.limits.map((l) => segBtn('data-ml', l, L.dc(l) + ' m', l === work.def.l)).join('') + '</div></div>'
    + '<div class="jn-seg"><div class="jn-k">window (TR)</div><div class="jn-bs">' + N.work.periods.map((t) => segBtn('data-mt', String(t), t + ' h', t === work.def.t)).join('') + '</div></div>'
    + '</div>'
    + '<div id="jn-w3">' + L.workThree(workSites.santos.name, work.def.l, work.def.t, wc, workSites.santos.cells) + '</div>'
    + '<p class="jn-ws" id="jn-ws">' + L.workSentence(workSites.santos.name, work.def.l, work.def.t, wc) + '</p>'
    + '<figure class="jn-wf"><div class="figbox" id="jn-wfig">' + L.workChart(workSites.santos.name, work.def.l, work.def.t, wc) + '</div>'
    + '<div id="jn-wkey">' + L.workKey(work.def.l, wc) + '</div>'
    + INK.capWork.replace(/^<figcaption([^>]*)>/, '<figcaption$1>' + esc('Hindcast Ifremer WAVEWATCH III GLOBMULTI at each area\'s node, ' + yFrom + '–' + yTo + pinEn + '. Each bar: starts with a window ÷ starts determined in the month; the count is instruments/window/workability.js\'s, in integers. Mean wait: hours from a start to the next start with a window.') + ' ') + '</figure>'
    + '<details class="more"><summary>the exact counts, month by month</summary><div id="jn-wtab">' + L.workTable(wc) + '</div></details>'
    + '</div></section>');

  /* ---- 3 · the site alpha (only once the record exists) ---- */
  let sec = 3;
  if (N.alpha) {
    const A = N.alpha;
    const NB = ' ';
    const f2 = (x) => L.dc(Number(x).toFixed(2));
    const minPairs = A.method && A.method.minPairs;
    /* the record's own reading, in three words; the sentence says what each means */
    const READ = (c) => /ABOVE/.test(c.reading || '') ? 'above' : /BELOW/.test(c.reading || '') ? 'below' : 'contains';
    const sitesA = Object.keys(A.sites);
    const nameA = (sid) => L.short(siteEn(sid));
    const TP = [...new Set([].concat(...sitesA.map((sid) => A.sites[sid].cells.map((c) => c.TPOP))))].sort((a, b) => a - b);
    const HS = [...new Set([].concat(...sitesA.map((sid) => A.sites[sid].cells.map((c) => c.designHs))))].sort((a, b) => a - b);
    const cellOf = (s, h, t) => s.cells.find((c) => c.designHs === h && c.TPOP === t);
    const cellAt = (sid, c) => N.at.alpha[sid] + '#/sites/' + RK(sid) + '/cells/' + A.sites[sid].cells.indexOf(c);
    const cellRaw = (c, sid) => (c && c.verdict === 'ESTIMATED'
      ? '<span class="jn-a">' + L.cw(f2(c.alpha), cellAt(sid, c) + '/alpha') + '</span><span class="jn-ai">' + L.cw(L.dc(Q.dec(Q.parse(String(c.ci90[0])), 2, 'down')) + '–' + L.dc(Q.dec(Q.parse(String(c.ci90[1])), 2, 'up')), [cellAt(sid, c) + '/ci90/0', cellAt(sid, c) + '/ci90/1']) + '</span><span class="jn-ar">table ' + f2(c.dnv['4-1']) + ' · ' + READ(c) + '</span>'
      : '<span class="jn-ar">' + nf.int(c ? c.n : 0) + ' pairs</span>');
    const hsLab = (h, i) => (i === HS.length - 1 ? '≥' + NB : '') + L.dc(String(h)) + NB + 'm';
    /* the headline: every site at the one design Hs the archive fills, side by side */
    const H2 = HS.includes(2) ? 2 : HS[0];
    const cross = C.table({ cols: [{ h: 'site · design Hs ' + L.dc(String(H2)) + ' m' }, ...TP.map((t) => ({ h: 'TPOP ' + t + ' h' }))],
      rows: sitesA.map((sid) => [nameA(sid), ...TP.map((t) => ({ raw: cellRaw(cellOf(A.sites[sid], H2, t), sid) }))]) });
    /* per site: the full matrix, rows that are refused at every TPOP folded into one line */
    const blocks = sitesA.map((sid) => {
      const s = A.sites[sid];
      const live = HS.filter((h) => TP.some((t) => { const c = cellOf(s, h, t); return c && c.verdict === 'ESTIMATED'; }));
      const dead = HS.filter((h) => !live.includes(h));
      const deadMax = Math.max(0, ...dead.map((h) => Math.max(0, ...TP.map((t) => (cellOf(s, h, t) || { n: 0 }).n))));
      const agg = {}, order = [];
      for (const e of (s.exceedance || [])) {
        if (!agg[e.OPLIM]) { agg[e.OPLIM] = { f: 0, a: 0, b: 0 }; order.push(e.OPLIM); }
        agg[e.OPLIM].f += e.forecastsAtOrBelowOPWF; agg[e.OPLIM].a += e.observedAboveOPLIM; agg[e.OPLIM].b += e['observedAbove1.5xOPLIM'];
      }
      const rg = require('./audit/bandset.js').regionOf(sid);
      return '<details class="more"><summary>' + esc(nameA(sid) + ' · ' + nf.int(s.pairs) + ' pairs over ' + nf.int(s.days) + ' days') + '</summary>'
        + (rg && rg.caveat ? C.p('Caution: ' + rg.caveat) : '')
        + (live.length ? '<div class="jn-at">' + C.table({ cols: [{ h: 'design Hs' }, ...TP.map((t) => ({ h: 'TPOP ' + t + ' h' }))],
          rows: live.map((h) => [hsLab(h, HS.indexOf(h)), ...TP.map((t) => ({ raw: cellRaw(cellOf(s, h, t), sid) }))]) }) + '</div>' : '')
        + (dead.length ? '<div class="col">' + C.p('Design Hs ' + dead.map((h) => L.dc(String(h))).join(' and ') + ' m: not enough pairs at any lead (at most '
          + nf.int(deadMax) + (minPairs ? '; the minimum is ' + minPairs : '') + ').') + '</div>' : '')
        + (order.length ? '<div class="col">' + C.p('Exact counts, summed over the ' + TP.length + ' leads (each pair falls in one only): when the forecast was at or below Table 4-1\'s OPWF, how many times the satellite saw Hs above OPLIM.') + '</div>'
          + C.table({ cols: [{ h: 'OPLIM' }, { h: 'forecasts ≤ OPWF', cls: 'n' }, { h: 'satellite > OPLIM', cls: 'n' }, { h: 'satellite > 1.5 × OPLIM', cls: 'n' }],
            rows: order.map((k) => [L.dc(Q.dec(Q.parse(k), 1)) + NB + 'm', nf.int(agg[k].f), nf.int(agg[k].a), nf.int(agg[k].b)]) }) : '')
        + '</details>';
    }).join('');
    /* what the site alpha would leave, from the workability record: the same exact count at its OPWF */
    const pctOf = (x) => L.pct(x[0], x[1]);
    const wrows = [];
    for (const [sid, ws] of Object.entries(workSites)) for (const [k, c] of Object.entries(ws.cells)) {
      if (!c.s) continue;
      const m = /^([\d.]+)m\/(\d+)h$/.exec(k);
      wrows.push([L.short(ws.name), L.dc(m[1]) + NB + 'm · ' + m[2] + NB + 'h', pctOf(c.o[12]), pctOf(c.f[12]) + ' (α ' + L.dc(c.ad) + ')', { raw: L.chw(pctOf(c.s.c[12]) + ' (α ' + L.dc(c.s.a) + ')', [c.s.at + '/cells/12/0', c.s.at + '/cells/12/1', c.s.at + '/alphaSite']) }]);
    }
    out.push('<section id="alfa"><div class="col sec-head"><div class="lab">' + sec + ' · the site\'s alpha</div><h2>The α the satellites measure here, beside the α of the North Sea table.</h2></div>'
      + '<div class="col">' + C.pRaw('DNV\'s α shrinks the forecast limit (OPWF = α × OPLIM) to cover the forecast\'s error. The table was calibrated in the North Sea; here the same method is applied to each site\'s ECMWF × altimeter pairs. <b>The method reproduces DNV\'s Table 4-1 in ' + N.premises.alpha.within + ' of ' + N.premises.alpha.of + ' cells</b> (±' + L.dc(N.premises.alpha.tol) + ') before looking at Brazil.')
      + C.note({ lab: 'what this is, and what it is not', bodyRaw: C.p('The site\'s α is a statistical estimate (floating point, resampled by day, 90% interval), not a decided interval; the counts beside it are exact. The 1-in-' + nf.int(N.premises.alpha.oneIn) + ' tail behind the α is a model extrapolation: three years of satellite data do not observe it. It is evidence for the surveyor to redo, never an approval.') })
      + C.p('In each cell: the site\'s α, the 90% interval (rounded outward) and the α of Table 4-1. “above”: the whole interval lies above the table, and the North Sea table is conservative here; “below”: the table is not conservative here; “contains”: it cannot be told apart from the table. Under ' + (minPairs || '—') + ' pairs, the cell says only how many pairs there are.')
      + '</div><div class="jn-at">' + cross + '</div>'
      + (wrows.length ? '<div class="col">' + C.pRaw('<b>What this changes in the month.</b> The same exact count as “The month”, redone with the site\'s α in place of the table\'s: the lower end of the 90% interval, rounded down to 0.01, so as not to gain windows from the optimistic part of the estimate. It is what would remain if the surveyor adopted the site\'s α.') + '</div>'
        + C.table({ cols: [{ h: 'area' }, { h: 'OPLIM · TR' }, { h: 'the sea allows', cls: 'n' }, { h: 'Table 4-1 leaves', cls: 'n' }, { h: 'the site\'s alpha would leave', cls: 'n' }], rows: wrows }) : '')
      + '<div class="wide">' + blocks + '</div></section>');
    sec++;
  }

  /* ---- the scoreboard ---- */
  const defs = N.ledger.defs, v1 = Object.keys(defs).some((k) => /altimeter-hs-v1/.test(k));
  out.push('<section id="placar"><div class="col sec-head"><div class="lab">' + sec + ' · the scoreboard</div><h2>Every band is committed before the sea happens, and scored afterwards against the satellite.</h2></div>'
    + '<div class="wide"><div class="jn-ev">' + P.map((p) => '<div><div class="jn-k">' + esc(PLACAR.NAMES_EN[p.domain] || p.domain) + '</div>'
      + '<div class="big">' + nf.int(p.commits) + ' committed</div>'
      + '<p>' + esc(p.scored + ' scored, ' + p.covered + ' covered so far. Claim: the band contains the satellite\'s measurement in ' + p.claim + ' of cases. Targets from '
        + nf.date(p.tFirst) + ' ' + nf.hm(p.tFirst) + ' to ' + nf.date(p.tLast) + ' ' + nf.hm(p.tLast) + ' UTC, at ' + p.sites + ' open-sea sites; first on ' + nf.date(p.first) + '.') + '</p>'
      + '<p>' + C.tag(p.pending ? 'UNDER EVALUATION' : STATUS[p.status] || p.status, p.status === 'ADMITTED' ? 'held' : 'dep') + ' '
      + esc(admLine(p)) + '</p></div>').join('') + '</div></div>'
    + '<div class="col mt5">' + C.pRaw('<b>What will be scored.</b> ' + (v1
      ? 'The Hs a satellite altimeter measures: the exact mean of NOAA RADS\'s 1 Hz values within 100 km of the site, on the pass nearest the target hour and within 3 h of it, with at least 5 points. A target with no pass is never scored; the passes do not depend on the forecast, so the scored set is not chosen by the outcome.'
      : esc(Object.values(defs).map((d) => d.target).join(' '))))
      + C.pRaw('<b>The admission rule.</b> ' + esc(PLACAR.RULE_EN) + ' Admission is lost by record, never by opinion.')
      + C.pRaw('<b>On ' + esc(nf.date(N.feed.madeAt)) + ', the date of this portrait.</b> ' + esc(N.ledger.scored === 0 ? 'None scored yet: the scoreboard began on ' + (N.ledger.first ? nf.date(N.ledger.first) : '—') + ' and scoring begins when the satellites pass and the days close. The record is append-only: a wrong forecast stays forever.' : N.ledger.scored + ' bands scored up to that date.') + ' Today\'s scoreboard is in the app: <a href="/janela/#modo=placar">/janela/ → SCOREBOARD</a>.')
      + '</div></section>');
  sec++;

  /* ---- what each number rests on (WARRANT v2.1, models as premises) ---- */
  const borrowKm = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', 'janela', 'scenario', 'platforms.json'), 'utf8')).borrowKm;
  if (!(borrowKm > 0)) throw new Error('janela page: apps/janela/scenario/platforms.json lost borrowKm');
  out.push(restsSection(N, L, sec, borrowKm));
  sec++;

  /* ---- why trust it ---- */
  const srcRows = [
    ['ECMWF open forecast, 00 UTC: IFS 0.25°, waves and the wave ensemble (50 members)', 'CC BY 4.0', 'the day\'s forecast', { raw: C.m(N.feed.file) + ' <span class="jn-pin">sha256 ' + esc(N.feed.sha.slice(0, 16)) + '… of the JSON; ' + N.feed.groups + ' GRIB files, each with its sha256</span>' }],
    ['NOAA WAVEWATCH III, 00 UTC: GEFS-Wave (31 members) and GFS-Wave, since 2026-10-07', 'public domain', 'NOAA\'s band (in the union) and the ensemble (shown)',
      { raw: N.noaa ? C.m(N.noaa.file) + ' <span class="jn-pin">sha256 ' + esc(N.noaa.sha.slice(0, 16)) + '… of the JSON; ' + N.noaa.groups + ' GRIB groups, each with its sha256</span>'
        : C.m('corpus/janela/feed-noaa') + ' <span class="jn-pin">one file a day, each step with its sha256; redone by noaa.py --verify</span>' }],
    ['Copernicus Marine, surface current 1/12°, since 2026-10-07', 'free, with credit', 'the current shown (not decided)',
      { raw: '<span class="jn-pin">Generated using E.U. Copernicus Marine Service Information, doi:10.48670/moi-00016</span>' }],
    ['NOAA GFS-Wave, 00 UTC, 2023-07 to 2026-10 (historical)', 'public domain', 'NOAA\'s measured band: the same satellites and rule',
      { raw: C.m('corpus/janela/noaa') + ' <span class="jn-pin">40 monthly files, sha256 in corpus/janela/noaa/MANIFEST.json; pairs in corpus/janela/matchups-noaa.json.gz</span>' }],
    ['NOAA RADS, near-real-time altimetry', 'public domain', 'the measured error (satellite × forecast pairs) and the scoreboard', { raw: C.m('corpus/janela/matchups.json.gz') + ' <span class="jn-pin">sha256 ' + esc(String(N.bands.sha).slice(0, 16)) + '…, ' + nf.int(N.bands.rows) + ' pairs</span>' }],
    ['Ifremer WAVEWATCH III GLOBMULTI, hindcast ' + yFrom + '–' + yTo, 'CC BY-SA 4.0', 'the windows of “The month”', { raw: C.m('corpus/ww3-points') + ' <span class="jn-pin">' + esc(pinM ? pinM[1] + ' monthly files, sha256 in corpus/ww3-points/meta.json' : N.work.pinned) + '</span>' }],
    ['The Harbour Masters (Capitanias dos Portos): NPCPs and ordinances', 'official act', 'the published limits', { raw: '<span class="jn-pin">' + esc(N.acts.length + ' acts, each PDF with its sha256 (below)') + '</span>' }],
    ['DNV-OS-H101, Oct 2011, Section 4 B700, Tables 4-1 to 4-6', 'DNV; values transcribed with the page', 'the α and the OPWF', { raw: '<span class="jn-pin">sha256 ' + esc(N.dnv.source.sha256.slice(0, 16)) + '… of the PDF, not redistributed</span>' }]
  ];
  const boundaries = [
    { b: 'The node, not the berth.', text: 'The forecast is ECMWF\'s, read at the nearest open-sea node. At a terminal, it is the approach: a wave limit at the berth stays NEEDS DATA until the transfer into the bay exists.' },
    { b: 'The band is a claim.', text: 'Today, ECMWF\'s ensemble (the central 40 of 50), NOAA\'s (WAVEWATCH III, the central 25 of 31) and Janela\'s measured bands over each provider; all scored in public against the same satellites, and the proposer that misses its own claim is pruned by the exact binomial rule. A raw ensemble is shown and scored, never decided. Where both measured bands exist, their union decides, checked as itself.', raw: '' },
    { b: 'The forecast\'s steps.', text: 'What is decided is the band at the forecast\'s own steps: not the sea between steps, not a probability.' },
    { b: 'The tail of the α.', text: 'The 1-in-10,000 tail behind DNV\'s α is a model extrapolation; three years of satellite pairs do not observe it.' },
    { b: 'Not an approval.', text: 'Marine warranty and the classification societies own that word. Janela delivers evidence a surveyor can redo.' }
  ];
  {
    /* the union's held-out record, read and gated (it used to be typed: 0.33% · 1.10% · 0.72% · 15 months) */
    const H = N.premises.heldOut.main, U = H.opt['U(E,N)'], E = H.opt.E, Wd = H.wide;
    const EA = N.at.eval[H.file], L2 = '/limits/2.0';
    const pcv = (a, b, row) => W.value(L.dc((100 * a / b).toFixed(2)) + '%', W.COMPUTED, { title: 'computed — a floating-point evaluation (' + H.file + ')', derived: [row + L2 + '/brokeLiberada', row + L2 + '/liberada'] });
    const bq = boundaries.find((x) => x.b === 'The band is a claim.');
    if (!bq) throw new Error('janela page: the boundary on the band\'s claim is gone');
    bq.raw = esc(bq.text) + ' Over ' + H.months + ' months no band saw, the union\'s CLEARED windows broke ' + pcv(U.broke, U.liberada, EA.opt['U(E,N)']) + ' of the time (Hs ≤ 2 m), against '
      + pcv(E.broke, E.liberada, EA.opt.E) + ' for ECMWF\'s band alone and ' + pcv(Wd.broke, Wd.liberada, EA.wide) + ' for it widened until it covered ' + W.value(L.dc((100 * Wd.coverage).toFixed(1)) + '%', W.COMPUTED, { title: 'computed — a floating-point evaluation', derived: EA.wide + '/coverage' })
      + ' (' + C.m(H.file) + ').';
  }
  const ruleBlocks = N.ops.map((o) => '<div class="jn-rule" id="regra-' + esc(o.id) + '"><h3>' + esc(opName(o)) + '</h3>'
    + '<p>' + esc(o.source.title) + '. ' + esc(o.source.act) + '.</p>'
    + C.quote({ text: o.quote, cite: o.page })
    + '<p>' + esc('How Janela reads it: ' + o.limits.map(L.limText).join(' · ') + (o.hsAt === 'berth' ? '. Wave limited at the berth: not decided at the node.' : '.')) + '</p>'
    + '<p class="jn-pin">' + esc('in force, as transcribed: ' + (o.ruleStatus || '—')) + '</p>'
    + (o.uncertain ? '<p class="jn-pin">' + esc('transcription note: ' + o.uncertain) + '</p>' : '')
    + '<p class="jn-pin"><a href="' + esc(o.source.url) + '">the act</a> · sha256 ' + esc(o.source.sha256) + ' · ' + esc(o.source.fetched || '') + '</p></div>').join('');
  const t41 = N.dnv.t41;
  const t41rows = Object.keys(t41.rows).map((T) => ['TPOP ≤ ' + T + ' h', ...t41.rows[T].map((x) => L.dc(x.toFixed(2)))]);
  out.push('<section id="confiar"><div class="col sec-head"><div class="lab">' + sec + ' · why trust it</div><h2>The verdict is exact arithmetic over the limit as printed; the band is a claim the scoreboard audits.</h2></div>'
    + '<div class="col">'
    + C.pRaw('<b>Exact arithmetic.</b> Every comparison is made in exact rationals, integers with no rounding: the forecast comes from the GRIB\'s packed integers (value = (R + X·2<sup>E</sup>)/10<sup>D</sup>), the wind in knots by 1 knot = 463/900 m/s, the limits as printed, with the decimal comma read as a point. No floating point decides. The edge is exact: an edge of exactly 2.0 against “&lt; 2.0” is UNDECIDED, never CLEARED.')
    + C.pRaw('<b>The measured band.</b> Hs: the deterministic forecast × the exact interval of the observed/forecast ratio in the satellite × forecast pairs of the site and the lead (blocks of ' + N.bands.binHours + ' h). Wind: the forecast ± the error measured in m/s at the lead (observed − forecast), floored at zero. Each band claims coverage of ' + claim + ', a counting theorem under the assumption that the next error resembles the archive\'s ' + nf.int(N.bands.rows) + ' pairs at the same site and lead; the scoreboard audits that assumption in public.')
    + C.pRaw('<b>In the app, the band rounded outward.</b> The app (<a href="/janela/">/janela/</a>) publishes the bands of each site and each production unit in short decimals, rounded OUTWARD: Hs to 0.001 m and wind to 0.01 kn, the lower edge down and the upper edge up; the deterministic forecast goes as the 1 mm interval that contains it. Over a wider band, a CLEARED or a BLOCKED still holds over the exact one; only UNDECIDED can grow. The build checks this against this page\'s exact decisions every day and refuses if it fails. The units borrow the band and the α of the nearest measured site, up to ' + borrowKm + ' km away; farther, they say NEEDS DATA.')
    + C.pRaw('<b>The same arithmetic, in your tab.</b> The grid above is decided again in your browser by the same modules that produced the record: ' + N.mods.map((m) => C.m(m.rel) + ' <span class="jn-pin">sha256 ' + esc(m.sha) + '</span>').join(' · ') + '. <span id="jn-sha" class="jn-pin">With scripts off, the grid shows the published record.</span>')
    + C.pRaw('<b>The battery.</b> ' + esc(battery.checks + ' checks and ' + battery.reds + ' red controls at every build') + ' — inclusive and strict limits at the exact edge, the witness of a BLOCKED, the threshold of an UNDECIDED, and refusals for a swapped unit, a floating-point number, an unknown variable and an empty window.')
    + '<h3>The honest boundaries</h3>' + C.plainList(boundaries)
    + '</div>'
    + '<div class="wide"><details class="more"><summary>the sources, the licences and the pins</summary>'
    + C.table({ cols: [{ h: 'source' }, { h: 'licence' }, { h: 'used for' }, { h: 'pin' }], rows: srcRows })
    + '</details>'
    + '<details class="more"><summary>the published limits, as printed, in Portuguese (' + N.ops.length + ')</summary>' + ruleBlocks + '</details>'
    + '<details class="more"><summary>DNV\'s Table 4-1, transcribed</summary>'
    + C.table({ cols: [{ h: 'alpha (waves)' }, ...N.dnv.columns.map((c, i) => ({ h: 'design Hs ' + (i === N.dnv.columns.length - 1 ? '≥ ' : '') + c + ' m', cls: 'n' }))], rows: t41rows })
    + '<div class="col">' + C.p(N.dnv.source.title + '. Linear interpolation between columns; the window TR is twice the TPOP when the contingency is not assessed in detail (B402).') + '</div>'
    + '</details></div>'
    + '<div class="col">' + C.pRaw('<b>Redo it.</b> The code is open: <a href="' + REPO + '/tree/main/apps/janela">apps/janela</a> and <a href="' + REPO + '/tree/main/instruments/window">instruments/window</a>.')
    + C.code('node instruments/window/battery.js\nnode apps/janela/battery.js\nnode apps/janela/build.js\nnode apps/janela/build-today.js') + '</div>'
    + '</section>');

  const data = { def, sel: defSel, custom, ctx, sites: sitesOut, ops: opsOut, groupOf, work, ink: INK };
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');
  const script = '<script type="application/json" id="jn-mods">' + B.json + '</script>\n'
    + '<script type="application/json" id="jn-data">' + dataJson + '</script>\n'
    + '<script>(' + client.toString() + ')(' + lib.toString() + ');</script>';
  const foot = '<p>' + esc('Built by apps/janela/build.js from ' + N.feed.file + ', certs/janela-bands.json, certs/janela-workability.json, '
    + (N.alpha ? 'certs/janela-alpha.json, ' : '') + 'certs/janela-ledger/, apps/janela/scenario/ and its rules; the instrument\'s battery ' + battery.checks + ' checks, ' + battery.reds + ' red controls.') + '</p><p>' + esc('git ' + git) + '</p>';
  const html = TPL.render({
    title: 'Janela — the method: the operational window, decided', lang: 'en',
    desc: 'Janela decides offshore operational windows in Brazil: the ECMWF forecast with its error measured against satellites, decided against the published limit (the Harbour Master\'s, DNV\'s or yours): CLEARED, BLOCKED, UNDECIDED or NEEDS DATA, with the reason.',
    path: '/janela/metodo/', bodyRaw: out.join('\n\n'), footRaw: foot, cssRaw: css(), scriptRaw: script, og: { image: '/janela/og.png', alt: 'Janela: the map of the Brazilian margin with the offshore units and each operation\'s window, decided' }
  });
  return { html, checked, def, data };
}

module.exports = { build, bundle, lib, MODS };
