/* page.js — /janela/metodo/: the method page, the app's "por que confiar" layer
   (pt-BR; the app itself is /janela/, apps/janela/app/). Every number is read by
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
const { br } = require('./numbers.js');
const PLACAR = require('./audit/placar.js');

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
   ====================================================================== */
function lib(Q, D) {
  var DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var VAR = { hs: 'Hs', wind_sustained: 'vento', wind_gust: 'rajada', current: 'corrente', visibility: 'visibilidade', tp: 'período',
    draft: 'calado', loa: 'comprimento', beam: 'boca', speed: 'velocidade', dwt: 'porte' };
  var UNIT = { m: 'm', kn: 'nós', NM: 'MN', s: 's' };
  var OPW = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
  var CLS = { 'LIBERADA': 'lib', 'VETADA': 'vet', 'INDEFINIDA': 'ind', 'SEM DADOS': 'sem', 'RECUSADA': 'sem' };
  var MEANS = {
    'LIBERADA': 'todo limite vale na borda desfavorável da faixa',
    'VETADA': 'um limite falha mesmo na borda favorável',
    'INDEFINIDA': 'a faixa atravessa um limite',
    'SEM DADOS': 'a regra limita o que não tem faixa medida aqui',
    'RECUSADA': 'nenhum passo de previsão na janela'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function dc(s) { return String(s).replace('.', ','); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function grp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function hrs(s) { var p = String(s).split('.'); return grp(p[0]) + (p[1] ? ',' + p[1] : ''); }
  /* a forecast time "YYYY-MM-DDTHH" (UTC) in Brasília time, UTC-3 (no daylight time since 2019) */
  function when(t) {
    var d = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), +t.slice(11, 13)) - 3 * 3600000);
    return { dow: DOW[d.getUTCDay()], dm: p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1), d: p2(d.getUTCDate()),
      h: p2(d.getUTCHours()) + 'h', key: d.toISOString().slice(0, 10), utc: t.slice(11, 13) + 'h UTC' };
  }
  function whenText(t) { var w = when(t); return w.dow + ' ' + w.dm + ', ' + w.h + ' (' + w.utc + ')'; }
  function upper(op) { return op === '<' || op === '<='; }
  function sea(l) { return D.SEA.has(l.var); }
  function limText(l) { return (VAR[l.var] || l.var) + ' ' + (OPW[l.op] || l.op) + ' ' + dc(l.value) + ' ' + (UNIT[l.unit] || l.unit); }
  function limOf(op, v) { for (var i = 0; i < op.limits.length; i++) if (op.limits[i].var === v) return op.limits[i]; return null; }
  function chip(v, big) { return '<span class="jn-chip ' + (CLS[v] || 'sem') + (big ? ' big' : '') + '">' + esc(v) + '</span>'; }
  function glyph(v) { return '<span class="jn-v ' + (CLS[v] || 'sem') + '" aria-hidden="true"></span>'; }
  function latlon(p) {
    return dc(Math.abs(p[0]).toFixed(2)) + '°' + (p[0] < 0 ? 'S' : 'N') + ' ' + dc(Math.abs(p[1]).toFixed(2)) + '°' + (p[1] < 0 ? 'W' : 'E');
  }
  function short(name) {
    return String(name).replace(/^Bacia d[eo] /, '').replace(/^Margem Equatorial — /, '').replace(/^Baía d[ae] /, '')
      .replace(/ — .*$/, '').replace(/ \(.*\)$/, '');
  }
  function kicker(name) {
    var p = /\(([^)]*)\)/.exec(name);
    if (p) return p[1];
    var m = /^(.*) — (.*)$/.exec(name);
    if (m) return short(name) === m[2] ? m[1] : m[2];
    return /^Bacia/.test(name) ? 'bacia' : '';
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
  function customOp(limits) { return { id: 'seu-limite', name: 'Seu limite', limits: limits, hsAt: 'approach', own: true }; }
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

  /* ---- the plain-Portuguese reason for one verdict ---- */
  function bandOf(s, v) { return v === 'hs' ? s.hs : v === 'wind_sustained' ? s.wind : null; }
  function unitOf(v) { return v === 'hs' ? 'm' : 'nós'; }
  function missing(op, v, s) {
    if (v === 'hs') {
      if (op.hsAt === 'berth') return 'Hs no berço: o nó do modelo é o mar aberto da aproximação, não o berço, e a onda do berço não se decide por construção';
      return s.hsDet === undefined ? 'Hs: sem previsão neste nó' : 'Hs: faixa medida recusada neste prazo (pares satélite × previsão ainda insuficientes)';
    }
    if (v === 'wind_sustained') return s.windDetKn === undefined ? 'vento: sem previsão neste nó' : 'vento: faixa medida recusada neste prazo (pares insuficientes)';
    if (v === 'wind_gust') return 'rajada: prevista pelo ECMWF, mas sem erro medido, logo sem faixa';
    if (v === 'current') return 'corrente: ninguém a prevê aqui';
    if (v === 'visibility') return 'visibilidade: ninguém a prevê aqui';
    return (VAR[v] || v) + ': sem faixa medida';
  }
  function explain(op, r, s, claim) {
    var why;
    if (r.verdict === 'LIBERADA') {
      why = 'Todo limite vale na borda desfavorável da faixa medida: ' + r.decidedOn.map(function (v) {
        var l = limOf(op, v), b = bandOf(s, v);
        return VAR[v] + (upper(l.op) ? ' vai no máximo a ' + dc(b.hiDec) : ' fica no mínimo em ' + dc(b.loDec)) + ' ' + unitOf(v) + ', e o limite é ' + limText(l);
      }).join('; ') + '.';
    } else if (r.verdict === 'VETADA') {
      var w = r.witness, lw = limOf(op, w.var);
      why = 'Mesmo a borda favorável da faixa medida já quebra o limite: ' + VAR[w.var] + (upper(lw.op) ? ' de pelo menos ' : ' de no máximo ')
        + dc(Q.dec(Q.parse(w.edge), 2)) + ' ' + unitOf(w.var) + ', contra ' + limText(lw) + '. A testemunha é esta hora e esta variável.';
    } else if (r.verdict === 'INDEFINIDA') {
      why = 'A faixa medida atravessa o limite: ' + r.flip.map(function (f) {
        var l = limOf(op, f.var), b = bandOf(s, f.var);
        return VAR[f.var] + ' vai de ' + dc(b.loDec) + ' a ' + dc(b.hiDec) + ' ' + unitOf(f.var) + ', contra ' + limText(l)
          + '; para virar LIBERADA, a borda desfavorável precisa ' + (upper(l.op) ? 'baixar ' : 'subir ') + dc(f.gapDec) + ' ' + unitOf(f.var);
      }).join('. ') + '. Se a borda favorável passar do limite, vira VETADA.';
    } else if (r.verdict === 'SEM DADOS') {
      why = (r.decidedOn.length
        ? 'O que tem faixa medida libera (' + r.decidedOn.map(function (v) { return VAR[v]; }).join(' e ') + ', na borda desfavorável), mas a regra limita mais. '
        : 'Nada do que esta regra limita tem faixa medida aqui. ')
        + r.notForecast.map(function (v) { var t = missing(op, v, s); return t.charAt(0).toUpperCase() + t.slice(1); }).join('. ') + '.';
    } else why = 'Nenhum passo de previsão nesta janela.';
    var dcd = [];
    if (op.hsAt === 'berth' && limOf(op, 'hs')) dcd.push('Hs: não decidida no berço');
    else if (s.hs) dcd.push('Hs [' + dc(s.hs.loDec) + '; ' + dc(s.hs.hiDec) + '] m (' + s.hs.n + ' pares)');
    else if (s.hsDet !== undefined) dcd.push('Hs: recusada neste prazo');
    if (s.wind) dcd.push('vento [' + dc(s.wind.loDec) + '; ' + dc(s.wind.hiDec) + '] nós (' + s.wind.n + ' pares)');
    else if (s.windDetKn !== undefined) dcd.push('vento: recusada neste prazo');
    var fc = [];
    if (s.hsDet !== undefined) fc.push('Hs ' + dc(s.hsDet) + ' m');
    if (s.tp) fc.push('Tp ' + dc(s.tp) + ' s');
    if (s.mwd) fc.push('de ' + s.mwd + '°');
    if (s.windDetKn !== undefined) fc.push('vento ' + dc(s.windDetKn) + ' nós');
    if (s.gustKn !== undefined && Number(s.gustKn) > 0) fc.push('rajada ' + dc(s.gustKn) + ' nós');
    var vessel = op.limits.filter(function (l) { return !sea(l); });
    return '<div class="jn-ro-h">' + chip(r.verdict, true) + '<span class="jn-ro-t">' + esc(op.name) + ' · ' + esc(whenText(s.t))
      + ' · prazo +' + s.lead + ' h' + (s.past ? ' · antes da publicação' : '') + '</span></div>'
      + '<p class="jn-why">' + esc(why) + '</p>'
      + '<p class="jn-dc"><span class="jn-k">decidido sobre</span> faixa medida, reivindicação ' + esc(claim) + ': ' + esc(dcd.join(' · ') || 'nenhuma') + '</p>'
      + '<p class="jn-fc"><span class="jn-k">previsto</span> ECMWF determinística: ' + esc(fc.join(' · ') || 'nada neste nó')
      + (s.ens ? '. Ensemble, 40 centrais de 50: Hs ' + esc(dc(s.ens[0])) + ' a ' + esc(dc(s.ens[1])) + ' m' : '') + '.</p>'
      + (vessel.length ? '<p class="jn-op"><span class="jn-k">do operador</span> ' + esc(vessel.map(limText).join(' · ')) + ': atributos do navio, conferidos por quem opera, nunca decididos aqui.</p>' : '');
  }

  /* ---- the grid: operations × the 29 steps ---- */
  function rowLabel(op) {
    var seaL = op.limits.filter(sea);
    if (op.own) return '<b>Seu limite</b><span>' + esc(seaL.map(limText).join(' · ')) + '</span><span class="jn-own">decidido nesta aba</span>';
    return '<b>' + esc(op.name) + '</b><span>' + esc(seaL.map(limText).join(' · ')) + '</span>'
      + (op.status === 'expired-experimental' ? '<span class="jn-exp">parâmetros experimentais · período encerrado</span>' : '')
      + '<a class="jn-src" href="#regra-' + esc(op.id) + '">fonte</a>';
  }
  function grid(site, rows, sel) {
    var st = site.steps, groups = [];
    st.forEach(function (s, i) {
      var w = when(s.t), g = groups[groups.length - 1];
      if (!g || g.key !== w.key) groups.push({ key: w.key, lab: w.dow + ' ' + w.dm, d: w.d, n: 1, i: i }); else g.n++;
    });
    var starts = {}; groups.forEach(function (g) { starts[g.i] = 1; });
    var h = '<table class="jn-grid"><thead><tr><th class="jn-rl" rowspan="2" scope="col">operação · horário de Brasília</th>'
      + groups.map(function (g) { return '<th class="jn-day jn-d0" colspan="' + g.n + '" scope="colgroup">' + esc(g.n >= 3 ? g.lab : g.d) + '</th>'; }).join('')
      + '</tr><tr>' + st.map(function (s, i) {
        return '<th class="jn-hr' + (s.past ? ' past' : '') + (starts[i] ? ' jn-d0' : '') + '" scope="col">' + when(s.t).h + '</th>';
      }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (row, ri) {
      h += '<tr' + (row.op.own ? ' class="jn-ownr"' : '') + '><th class="jn-rl" scope="row">' + rowLabel(row.op) + '</th>' + row.steps.map(function (v, i) {
        var on = sel && sel.r === ri && sel.i === i;
        return '<td' + (starts[i] ? ' class="jn-d0"' : '') + '><button type="button" class="jn-c' + (on ? ' on' : '') + (st[i].past ? ' past' : '')
          + '" data-r="' + ri + '" data-i="' + i + '" aria-label="' + esc(v.verdict + ' · ' + row.op.name + ' · ' + whenText(st[i].t)) + '">' + glyph(v.verdict) + '</button></td>';
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
      by[k].forEach(function (g) { var t = (g.own ? 'seu ' : '') + OPW[g.op] + ' ' + dc(g.value) + ' ' + unitOf(v); if (!seen[t]) { seen[t] = 1; parts.push(t); } });
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
    var alt = (isHs ? 'Hs' : 'Vento') + ' em ' + site.name + ', sete dias de 6 em 6 horas: a faixa medida, que se decide, contra a previsão determinística'
      + (isHs ? ' e o ensemble' : ' e a rajada') + ' do ECMWF' + (guides.length ? '; limites ' + guides.map(function (g) { return g.text; }).join(', ') : '') + '.';
    o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '">');
    o.push('<defs><pattern id="' + uid + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="jn-hl" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>');
    for (var t = 0; t <= top + 1e-9; t += tick) {
      o.push('<line class="jn-gl" x1="' + PL + '" y1="' + f1(y(t)) + '" x2="' + (W - PR) + '" y2="' + f1(y(t)) + '"/>');
      o.push('<text class="t-ax" x="' + (PL - 8) + '" y="' + f1(y(t) + 4) + '" text-anchor="end">' + dc(String(Math.round(t * 10) / 10)) + '</text>');
    }
    o.push('<text class="t-note" x="' + PL + '" y="' + (H - 6) + '">' + (isHs ? 'Hs (m)' : 'vento a 10 m (nós)') + '</text>');
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
      o.push('<polygon class="jn-ens" fill="url(#' + uid + ')" points="' + up.concat(dn).join(' ') + '"/>');
    });
    /* decided: the measured band (solid) */
    var has = isHs ? function (s) { return s.hs; } : function (s) { return s.wind; };
    runs(st, has).forEach(function (r) {
      var b = function (i) { return isHs ? st[i].hs : st[i].wind; };
      if (r.length === 1) {
        var i0 = r[0];
        o.push('<rect class="jn-band" x="' + f1(x(i0) - 3) + '" y="' + f1(y(+b(i0).hiDec)) + '" width="6" height="' + f1(Math.max(1, y(+b(i0).loDec) - y(+b(i0).hiDec))) + '"/>');
        return;
      }
      var up = r.map(function (i) { return f1(x(i)) + ',' + f1(y(+b(i).hiDec)); });
      var dn = r.slice().reverse().map(function (i) { return f1(x(i)) + ',' + f1(y(+b(i).loDec)); });
      o.push('<polygon class="jn-band" points="' + up.concat(dn).join(' ') + '"/>');
    });
    /* forecast: the deterministic line (and the gust), dashed */
    var line = function (get, cls) {
      runs(st, function (s) { return get(s) !== undefined; }).forEach(function (r) {
        if (r.length < 2) return;
        o.push('<polyline class="' + cls + '" points="' + r.map(function (i) { return f1(x(i)) + ',' + f1(y(+get(st[i]))); }).join(' ') + '"/>');
      });
    };
    /* the gust at step 0 is 0: ECMWF's gust is a maximum since the previous step, and step 0 has none */
    if (!isHs) line(function (s) { return Number(s.gustKn) > 0 ? s.gustKn : undefined; }, 'jn-gust');
    line(isHs ? function (s) { return s.hsDet; } : function (s) { return s.windDetKn; }, 'jn-det');
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
  function stripKey(isHs, hasBand) {
    var sw = function (inner) { return '<svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true">' + inner + '</svg>'; };
    var k = [];
    k.push('<li>' + sw('<rect class="jn-band" x="1" y="2" width="26" height="8"/>') + '<span>faixa medida, o que se decide: '
      + (isHs ? 'a previsão × a razão observado/previsto medida no prazo' : 'a previsão ± o erro medido em m/s no prazo')
      + (hasBand ? '' : ' (recusada em todos os prazos desta rodada)') + '</span></li>');
    k.push('<li class="jn-fck">' + sw('<line class="jn-det" x1="1" y1="6" x2="27" y2="6"/>') + '<span>previsão determinística ECMWF</span></li>');
    if (isHs) k.push('<li class="jn-fck">' + sw('<rect class="jn-swr" x="1" y="2" width="26" height="8"/><line class="jn-hl" x1="4" y1="10" x2="10" y2="2"/><line class="jn-hl" x1="11" y1="10" x2="17" y2="2"/><line class="jn-hl" x1="18" y1="10" x2="24" y2="2"/>') + '<span>ensemble ECMWF, 40 centrais de 50</span></li>');
    else k.push('<li class="jn-fck">' + sw('<line class="jn-gust" x1="1" y1="6" x2="27" y2="6"/>') + '<span>rajada, determinística</span></li>');
    k.push('<li>' + sw('<line class="jn-lim" x1="1" y1="6" x2="27" y2="6"/>') + '<span>limite</span></li>');
    return '<ul class="jn-key">' + k.join('') + '</ul>';
  }

  /* ---- the site panel: header, grid, readout, strips ---- */
  function nodeLine(site, ops) {
    if (!site.node) return 'Sem nó de previsão para este local nesta rodada.';
    var at = 'Previsão lida no nó ' + latlon(site.node) + ' da grade de 0,25° do ECMWF';
    var dist = site.km ? ', a ' + site.km + ' km de ' + latlon([site.lat, site.lon]) : ', sobre o próprio local';
    if (site.kind === 'terminal') {
      var berth = ops.some(function (o) { return o.site === site.id && o.hsAt === 'berth'; });
      return at + dist + ': o mar aberto da APROXIMAÇÃO, não o berço.'
        + (berth ? ' Onde a regra limita a onda no berço, a onda não é decidida: SEM DADOS por construção.' : '')
        + (site.bandFrom ? ' A faixa medida vem de ' + site.bandFromName + ': um altímetro não enxerga dentro de uma baía.' : '');
    }
    return at + dist + '.' + (site.kind === 'field' && !site.km ? ' É o mesmo ponto do hindcast de “O mês”.' : '');
  }
  function panel(site, rows, sel, ctx, ops, custom, groupLabel) {
    var r = rows[sel.r], s = site.steps[sel.i];
    var hasHs = site.steps.some(function (x) { return x.hs; }), hasW = site.steps.some(function (x) { return x.wind; });
    return '<div class="jn-sh"><div class="jn-k">' + esc(groupLabel) + '</div><h3>' + esc(site.name) + '</h3>'
      + '<p class="jn-node">' + esc(nodeLine(site, ops)) + '</p></div>'
      + '<div class="jn-gw" tabindex="0" role="region" aria-label="Vereditos por operação e horário">' + grid(site, rows, sel) + '</div>'
      + '<div class="jn-ro" id="jn-ro" aria-live="polite">' + (r && s ? explain(r.op, r.steps[sel.i], s, ctx.claim)
        : '<p class="jn-why">Nenhuma operação com limite publicado neste local: decida o seu acima.</p>') + '</div>'
      + '<div class="jn-strips">'
      + '<figure class="jn-fig"><div class="figbox">' + strip(site, 'hs', guidesFor(site, ops, custom, 'hs')) + '</div>' + stripKey(true, hasHs) + '</figure>'
      + '<figure class="jn-fig"><div class="figbox">' + strip(site, 'wind', guidesFor(site, ops, custom, 'wind_sustained')) + '</div>' + stripKey(false, hasW) + '</figure>'
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
  function workSentence(name, lim, tr, c) {
    var worst = 0, wv = -1;
    for (var m = 0; m < 12; m++) { var g = c.o[m][1] && c.f[m][1] ? c.o[m][0] / c.o[m][1] - c.f[m][0] / c.f[m][1] : 0; if (g > wv) { wv = g; worst = m; } }
    return esc(name) + ', limite de onda <b>' + dc(lim) + ' m</b>, janela de <b>' + tr + ' h</b>: o mar permite <b>' + pct(c.o[12][0], c.o[12][1])
      + '</b> dos inícios de operação ao longo do ano (' + grp(c.o[12][0]) + ' de ' + grp(c.o[12][1]) + '). Com o α da Tabela 4-1 da DNV ('
      + dc(c.ad) + ' × ' + dc(lim) + ' m → OPWF ' + dc(c.wf) + ' m, TPOP ' + c.T + ' h) sobram <b>' + pct(c.f[12][0], c.f[12][1]) + '</b>. A diferença, '
      + gapPP(c.o[12], c.f[12]) + ' pontos, é o que o α da tabela custa se a previsão fosse perfeita. O mês que mais perde: ' + MON[worst]
      + ' (' + pct(c.o[worst][0], c.o[worst][1]) + ' → ' + pct(c.f[worst][0], c.f[worst][1]) + '). Espera média até a próxima janela: '
      + hrs(c.wo) + ' h → ' + hrs(c.wfw) + ' h.'
      + (c.s ? ' Se o vistoriador adotasse o α do local, ' + dc(c.s.a) + ' (o limite inferior do intervalo de 90% da estimativa ' + dc(Number(c.s.pt).toFixed(3))
        + '), o OPWF seria ' + dc(c.s.wf) + ' m e sobrariam <b>' + pct(c.s.c[12][0], c.s.c[12][1]) + '</b>, com espera média de ' + hrs(c.s.w) + ' h. O α do local é uma estimativa; a contagem sobre ele é exata.' : '');
  }
  /* the same operation, three ways: what the sea allows, what Table 4-1 leaves, what the
     site's alpha would leave. The third rests on an ESTIMATED alpha, so its card is dashed. */
  function workThree(name, lim, tr, c, cells) {
    if (!c.s) {
      var avail = Object.keys(cells).filter(function (k) { return cells[k].s; });
      return '<p class="jn-hint">' + (avail.length
        ? 'O α do local entra com ' + avail.map(function (k) { return k.replace(/^([\d.]+)m\/(\d+)h$/, function (_, l, t) { return dc(l) + ' m e janela de ' + t + ' h'; }); }).join(', ') + ': escolha uma dessas combinações para ver o que ele deixaria.'
        : 'Em ' + esc(name) + ' ainda não há pares satélite × previsão bastantes para estimar o α do local.') + '</p>';
    }
    return '<div class="jn-three">'
      + '<div><div class="jn-k">o mar permite</div><div class="big">' + pct(c.o[12][0], c.o[12][1]) + '</div><p>Hs ≤ ' + dc(lim) + ' m (OPLIM) a janela inteira de ' + tr + ' h</p></div>'
      + '<div><div class="jn-k">a Tabela 4-1 deixa</div><div class="big">' + pct(c.f[12][0], c.f[12][1]) + '</div><p>α ' + dc(c.ad) + ' → OPWF ' + dc(c.wf) + ' m</p></div>'
      + '<div class="est"><div class="jn-k">o alfa do local deixaria</div><div class="big">' + pct(c.s.c[12][0], c.s.c[12][1]) + '</div><p>α ' + dc(c.s.a) + ' → OPWF ' + dc(c.s.wf) + ' m; α estimado, contagem exata</p></div>'
      + '</div>';
  }
  function workChart(name, lim, tr, c) {
    var W = 960, H = 260, PL = 46, PR = 10, PT = 24, PB = 34;
    var three = !!c.s, gw = (W - PL - PR) / 12, bw = Math.min(24, gw * (three ? 0.25 : 0.34));
    var y = function (p) { return PT + (H - PT - PB) * (1 - p / 100); };
    var f1 = function (v) { return v.toFixed(1); };
    var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Janelas por mês em ' + name + ', limite ' + dc(lim) + ' m, janela de ' + tr
      + ' h, 1993–2024: com o limite (OPLIM), com o α da tabela (OPWF)' + (three ? ' e com o α estimado do local' : '') + '. No ano: ' + pct(c.o[12][0], c.o[12][1])
      + (three ? ', ' + pct(c.f[12][0], c.f[12][1]) + ' e ' + pct(c.s.c[12][0], c.s.c[12][1]) : ' e ' + pct(c.f[12][0], c.f[12][1])) + '.') + '">'];
    [0, 25, 50, 75, 100].forEach(function (t) {
      o.push('<line class="jn-gl" x1="' + PL + '" y1="' + f1(y(t)) + '" x2="' + (W - PR) + '" y2="' + f1(y(t)) + '"/>');
      o.push('<text class="t-ax" x="' + (PL - 8) + '" y="' + f1(y(t) + 4) + '" text-anchor="end">' + t + '%</text>');
    });
    for (var m = 0; m < 12; m++) {
      var cx = PL + gw * m + gw / 2;
      (three ? [[c.o[m], 'jn-w1', cx - 1.5 * bw - 2], [c.f[m], 'jn-w2', cx - bw / 2], [c.s.c[m], 'jn-w3', cx + bw / 2 + 2]]
        : [[c.o[m], 'jn-w1', cx - bw - 1], [c.f[m], 'jn-w2', cx + 1]]).forEach(function (b) {
        var p = b[0][1] ? 100 * b[0][0] / b[0][1] : 0, top = y(p);
        o.push('<rect class="' + b[1] + '" x="' + f1(b[2]) + '" y="' + f1(top) + '" width="' + f1(bw) + '" height="' + f1(Math.max(1, y(0) - top)) + '" rx="2"/>');
        o.push('<text class="jn-wv" x="' + f1(b[2] + bw / 2) + '" y="' + f1(top - 5) + '" text-anchor="middle">' + Math.floor((b[0][0] * 200 + b[0][1]) / (2 * b[0][1] || 1)) + '</text>');
      });
      o.push('<text class="t-ax" x="' + f1(cx) + '" y="' + (H - PB + 18) + '" text-anchor="middle">' + MON[m] + '</text>');
    }
    o.push('</svg>');
    return o.join('');
  }
  function workKey(lim, c) {
    return '<ul class="jn-key"><li><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect class="jn-w1" x="1" y="1" width="26" height="10" rx="2"/></svg><span>o mar permite: Hs ≤ '
      + dc(lim) + ' m (OPLIM) a janela inteira</span></li><li><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect class="jn-w2" x="1" y="1" width="26" height="10" rx="2"/></svg><span>com o α da tabela: Hs ≤ '
      + dc(c.wf) + ' m (OPWF)</span></li>'
      + (c.s ? '<li class="jn-fck"><svg class="jn-sw" viewBox="0 0 28 12" aria-hidden="true"><rect class="jn-w3" x="1" y="1" width="26" height="10" rx="2"/></svg><span>se o α do local fosse adotado: Hs ≤ '
        + dc(c.s.wf) + ' m (α estimado)</span></li>' : '') + '</ul>';
  }
  function workTable(c) {
    var rowsH = '';
    for (var m = 0; m <= 12; m++) {
      rowsH += '<tr><td class="k">' + (m === 12 ? 'ano' : MON[m]) + '</td><td class="n">' + pct(c.o[m][0], c.o[m][1]) + '</td><td class="n">' + grp(c.o[m][0]) + ' / ' + grp(c.o[m][1])
        + '</td><td class="n">' + pct(c.f[m][0], c.f[m][1]) + '</td><td class="n">' + grp(c.f[m][0]) + ' / ' + grp(c.f[m][1]) + '</td><td class="n">' + gapPP(c.o[m], c.f[m]) + '</td>'
        + (c.s ? '<td class="n">' + pct(c.s.c[m][0], c.s.c[m][1]) + '</td><td class="n">' + grp(c.s.c[m][0]) + ' / ' + grp(c.s.c[m][1]) + '</td>' : '') + '</tr>';
    }
    return '<div class="tw"><table><thead><tr><th>mês</th><th>OPLIM</th><th>inícios com janela / determinados</th><th>OPWF da tabela</th><th>inícios com janela / determinados</th><th>custo do alfa (pontos)</th>'
      + (c.s ? '<th>OPWF do alfa local</th><th>inícios com janela / determinados</th>' : '') + '</tr></thead><tbody>'
      + rowsH + '</tbody></table></div>';
  }

  return { esc: esc, dc: dc, when: when, whenText: whenText, limText: limText, chip: chip, glyph: glyph, short: short, kicker: kicker,
    decideStep: decideStep, same: same, customOp: customOp, rowsFor: rowsFor, defaultSel: defaultSel, explain: explain, grid: grid,
    guidesFor: guidesFor, strip: strip, panel: panel, pct: pct, workSentence: workSentence, workThree: workThree, workChart: workChart, workKey: workKey,
    workTable: workTable, MEANS: MEANS, CLS: CLS, latlon: latlon };
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
  var L = libFn(Q, D);
  var DATA = JSON.parse(document.getElementById('jn-data').textContent);
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
    if (hs === null || w === null) { msg.textContent = 'Digite números como 2,5 e 20; deixe em branco o que não limita.'; return null; }
    if (hs === '' && w === '') { msg.textContent = 'Digite ao menos um limite.'; return null; }
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
    msg.textContent = 'Decidido agora, nesta aba, em ' + Math.max(1, Math.round(performance.now() - t0)) + ' ms, pelos mesmos módulos do registro.';
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

  /* ---- a "fonte" link opens the fold it points into ---- */
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
  $('jn-check').textContent = 'Refeito agora no seu navegador, em ' + ms + ' ms: ' + ok + ' de ' + n + ' decisões publicadas '
    + (ok === n ? 'iguais ao registro.' : '— ' + (n - ok) + ' DIFERENTES do registro.');
  var out = $('jn-sha');
  if (out && self.crypto && crypto.subtle && self.TextEncoder) {
    var names = Object.keys(M.pins), done = 0, good = 0;
    names.forEach(function (k) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(M.src[k])).then(function (buf) {
        var hex = [].map.call(new Uint8Array(buf), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
        done++; if (hex === M.pins[k].sha) good++;
        if (done === names.length) out.textContent = good === names.length
          ? 'Conferido nesta aba: os ' + names.length + ' módulos que decidem aqui têm o sha256 pinado acima.'
          : 'ATENÇÃO: ' + (names.length - good) + ' módulo(s) com sha256 diferente do pinado.';
      });
    });
  }
}

/* ---------------------------------------------------------------- css --- */
function css() {
  return `
/* ---- Janela (apps/janela/page.js) ---- */
.jn-hero h1{font-size:var(--text-display);letter-spacing:var(--track-display)}
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
svg .jn-det{fill:none;stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
svg .jn-gust{fill:none;stroke:var(--ink-4);stroke-width:1.2;stroke-dasharray:1.5 2}
svg .jn-ens{stroke:none}
svg .jn-hl{stroke:var(--ink-4);stroke-width:1}
svg .jn-swr{fill:none;stroke:var(--ink-5);stroke-width:1}
svg .jn-lim{stroke:var(--ink-2);stroke-width:1.2;stroke-dasharray:2 3}
svg .jn-limt{fill:var(--ink-2);font-size:var(--text-small);paint-order:stroke;stroke:var(--sunk);stroke-width:4}
svg .jn-w1{fill:var(--c-1)}
svg .jn-w2{fill:var(--c-3)}
svg .jn-w3{fill:var(--c-2);stroke:var(--ink);stroke-width:1;stroke-dasharray:1.5 2}
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

/* ================================================================ build */
function build(N, B, git, battery) {
  const D = require(path.join(ROOT, 'instruments', 'window', 'decide.js'));
  const Q = require(path.join(ROOT, 'instruments', 'window', 'q.js'));
  const L = lib(Q, D);
  const out = [];
  const claim = (() => { const [a, b] = String(N.bands.miss).split('/').map(Number); return (b - a) + '/' + b; })();
  const groupOf = {};
  for (const g of N.groups) for (const s of N.sites) if (g.kinds.includes(s.kind)) groupOf[s.id] = g.k;

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
  const opsOut = N.ops.map((o) => ({ id: o.id, site: o.site, name: o.name, limits: o.limits, hsAt: o.hsAt, status: o.status,
    steps: o.steps.map((r) => ({ verdict: r.verdict, witness: r.witness, flip: r.flip, notForecast: r.notForecast, decidedOn: r.decidedOn })) }));
  const sitesOut = N.sites.map((s) => ({ id: s.id, name: s.name, kind: s.kind, lat: s.lat, lon: s.lon, node: s.node, km: s.km,
    bandFrom: s.bandFrom, bandFromName: s.bandFromName, steps: s.steps }));
  const defSite = sitesOut.find((s) => s.id === def);
  const defRows = L.rowsFor(defSite, opsOut, custom);
  const defSel = L.defaultSel(defSite, defRows);
  /* the month opens on the operation the site alpha speaks to, when the record has it */
  const work = { def: N.work.sites.santos.cells['2.0m/48h'] && N.work.sites.santos.cells['2.0m/48h'].s ? { s: 'santos', l: '2.0', t: 48 } : { s: 'santos', l: '2.5', t: 48 }, sites: N.work.sites };
  const wc = N.work.sites.santos.cells[work.def.l + 'm/' + work.def.t + 'h'];
  const yFrom = N.work.from.slice(0, 4), yTo = N.work.to.slice(0, 4), years = Number(yTo) - Number(yFrom) + 1;
  const pinM = /^(\d+) monthly files/.exec(N.work.pinned || '');
  const pinPt = pinM ? ' (' + pinM[1] + ' arquivos mensais, cada um conferido por sha256 contra corpus/ww3-points/meta.json)' : '';
  const run = br.date(N.feed.run) + ' ' + N.feed.run.slice(11, 13) + ' UTC';
  const made = br.date(N.feed.madeAt) + ' ' + br.hm(N.feed.madeAt) + ' UTC';
  const P = N.ledger.proposers;
  const NAMES = PLACAR.NAMES_PT;
  const STATUS = { ADMITTED: 'ADMITIDO', DEADMITTED: 'PODADO' };
  /* the admission in one line, from placar.js's verdict (trials = target days, looks at 30·2^j) */
  const admLine = (p) => p.pending
    ? p.trials + ' de ' + N.ledger.firstLook + ' dias-ensaio: nada testado ainda; a primeira leitura é no ' + N.ledger.firstLook + 'º dia'
    : p.status === 'DEADMITTED'
      ? 'podado no ' + p.prunedAt.m + 'º dia-ensaio (' + br.date(p.prunedAt.through) + '): ' + p.prunedAt.covered + ' cobertos, cauda exata ' + p.prunedAt.tail + ' ≤ ' + p.prunedAt.bar
      : p.trialsCovered + ' de ' + p.trials + ' dias-ensaio cobertos; na leitura de ' + p.looks[p.looks.length - 1].m + ' dias, cauda exata ' + p.tail + ' > ' + p.bar + '; próxima leitura em ' + p.next;
  const n = (k) => N.counted.byKind[k] || 0;

  /* ---- 0 · hero ---- */
  const quad = ['LIBERADA', 'VETADA', 'INDEFINIDA', 'SEM DADOS'];
  const QUAD = {
    'LIBERADA': 'Todo limite vale na borda desfavorável da faixa prevista, em cada passo da janela.',
    'VETADA': 'Um limite falha mesmo na borda favorável. Sai com a testemunha: a hora e a variável.',
    'INDEFINIDA': 'A faixa atravessa o limite. Sai com o limiar: quanto a borda precisa andar para virar.',
    'SEM DADOS': 'O previsto libera, mas a regra limita o que ninguém prevê aqui, como corrente e visibilidade, e diz o quê.'
  };
  out.push('<header class="col jn-hero">'
    + '<div class="eyebrow">Janela · energia offshore · janelas operacionais</div>'
    + '<h1>A janela operacional, decidida.</h1>'
    + '<p class="deck">Para áreas de produção, plataformas e terminais de petróleo e GNL: a previsão do mar com o seu erro medido contra satélites, decidida contra o limite publicado — o da Capitania, o da DNV ou o seu. Cada horário sai com um de quatro vereditos e o motivo.</p>'
    + '<div class="jn-quad">' + quad.map((v) => '<div>' + L.chip(v, true) + '<p>' + esc(QUAD[v]) + '</p></div>').join('') + '</div>'
    + '<div class="jn-cta"><a class="go" href="/janela/">Abrir o app ↗</a><a href="#semana">A semana ↓</a><a href="#mes">O mês ↓</a>' + (N.alpha ? '<a href="#alfa">O α do local ↓</a>' : '') + '<a href="#placar">O placar ↓</a><a href="#confiar">Por que confiar ↓</a></div>'
    + '</header>');
  out.push(C.stats([
    { k: 'locais', v: String(N.counted.sites), n: n('field') + ' áreas de produção, ' + n('platform') + ' plataforma, ' + n('terminal') + ' terminais e ' + n('coast') + ' ponto de costa; o nó do modelo de cada um, nomeado' },
    { k: 'limites publicados', v: N.ops.length + ' operações', n: 'de ' + N.acts.length + ' atos da Autoridade Marítima (NPCPs e portarias), com página e citação literal' },
    { k: years + ' anos contados', v: br.int(N.work.samples), n: 'estados de mar de 3 em 3 h por área, ' + yFrom + '–' + yTo + ': janelas contadas exatamente, nada ajustado' },
    { k: 'placar', v: br.int(N.ledger.commits), n: 'previsões comprometidas antes da hora-alvo desde ' + (N.ledger.first ? br.date(N.ledger.first) : '—') + '; ' + N.ledger.scored + ' avaliadas ainda' }
  ]));
  out.push('<div class="col">' + C.scope('Decide-se a faixa prevista nos passos da própria previsão, no nó do modelo: não o mar entre passos, não o berço, não uma probabilidade. Não é aprovação de operação; é evidência que um vistoriador refaz.') + '</div>');
  /* this page is a portrait of one run; the app is the live view (the daily Action rebuilds the app's day, not this page) */
  out.push('<div class="col">' + C.pRaw('<b>Retrato da rodada ECMWF de ' + esc(run) + '.</b> Os números desta página — a semana, as decisões, o placar — são os desse dia, para documentar o método. As janelas de hoje e o placar de hoje estão no app: <a href="/janela/">/janela/</a>.') + '</div>');

  /* ---- 1 · the week ---- */
  const picker = '<div class="jn-pick" role="group" aria-label="Local">' + N.groups.map((g) => {
    const ss = N.sites.filter((s) => g.kinds.includes(s.kind));
    if (!ss.length) return '';
    return '<div class="jn-pg"><div class="jn-k">' + esc(g.k) + '</div><div class="jn-bs">' + ss.map((s) => {
      const k = L.kicker(s.name);
      return '<button type="button" class="jn-b jn-site" data-s="' + esc(s.id) + '" aria-pressed="' + (s.id === def ? 'true' : 'false') + '">' + esc(L.short(s.name)) + (k ? '<small>' + esc(k) + '</small>' : '') + '</button>';
    }).join('') + '</div></div>';
  }).join('') + '</div>';
  const legend = '<ul class="jn-legend">' + quad.map((v) => '<li>' + L.glyph(v) + '<span><b>' + esc(v) + '</b> · ' + esc(L.MEANS[v]) + '</span></li>').join('') + '</ul>';
  const thin = N.bandSteps.withBand < N.bandSteps.withHs / 2;
  const cnt = N.counts;
  out.push('<section id="semana"><div class="col sec-head"><div class="lab">1 · a semana</div><h2>Sete dias, de 6 em 6 horas: cada operação decidida contra o seu limite.</h2></div>'
    + '<div class="col">' + C.pRaw('Previsão ECMWF de ' + esc(run) + ', lida em ' + esc(made) + '; horários de Brasília (UTC−3). Nesta rodada, ' + br.int(N.decisions) + ' decisões publicadas: '
      + quad.map((v) => cnt[v] + ' ' + esc(v)).join(', ') + '. Toque numa célula: o motivo, a testemunha ou o limiar que viraria o veredito.')
    + (thin ? C.note({ lab: 'por que quase tudo diz SEM DADOS hoje', bodyRaw: C.p('A faixa medida de cada local e prazo sai dos pares satélite × previsão do arquivo 2023–2026, e esse arquivo ainda está sendo montado: hoje são '
      + br.int(N.bands.rows) + ' pares, e ' + N.bands.okCells + ' de ' + N.bands.cells + ' combinações de local, prazo e variável já têm pares bastantes para afirmar cobertura de ' + claim
      + '. Onde não têm, a Janela não decide: diz SEM DADOS e por quê. Quando o arquivo fechar, a mesma página se refaz a partir dos mesmos registros.') }) : '')
    + '</div>'
    + '<div class="wide">' + picker
    + '<form class="jn-form" id="jn-form" autocomplete="off"><div class="jn-k">seu limite · decidido nesta aba</div>'
    + '<label>Hs até (m)<input name="hs" inputmode="decimal" value="' + L.dc(custom[0].value) + '"></label>'
    + '<label>vento até (nós)<input name="vento" inputmode="decimal" value="' + L.dc(custom[1].value) + '"></label>'
    + '<button type="submit">Decidir</button>'
    + '<p id="jn-form-msg">Exemplo; troque pelos limites do seu procedimento. A mesma faixa medida, os mesmos módulos do registro, decididos na sua máquina.</p></form>'
    + legend
    + '<div id="jn-panel">' + L.panel(defSite, defRows, defSel, ctx, opsOut, custom, groupOf[def]) + '</div>'
    + '<p class="jn-check" id="jn-check">' + esc('No build: ' + checked + ' de ' + checked + ' decisões publicadas refeitas pela função desta página, iguais ao registro.') + '</p>'
    + '</div></section>');

  /* ---- 2 · the month ---- */
  const wsites = Object.keys(N.work.sites);
  const segBtn = (attr, val, label, on) => '<button type="button" class="jn-b" ' + attr + '="' + esc(val) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(label) + '</button>';
  out.push('<section id="mes"><div class="col sec-head"><div class="lab">2 · o mês</div><h2>' + years + ' anos contados: quantas janelas o mar abre por mês, e quanto o α da tabela fecha.</h2></div>'
    + '<div class="col">' + C.p('Para as ' + wsites.length + ' áreas de produção, cada início de operação de 3 em 3 h, de ' + yFrom + ' a ' + yTo + ', é contado: cabe ou não cabe uma janela de TR horas com Hs abaixo do limite (OPLIM). A segunda barra refaz a conta com o limite de previsão que a DNV manda usar, OPWF = α × OPLIM (Tabela 4-1, TPOP = TR/2)' + (N.alpha ? '; onde há pares de satélite bastantes, a terceira usa o α estimado no próprio local (“O alfa do local”, abaixo)' : '') + '. Frações exatas de inteiros, nada ajustado.') + '</div>'
    + '<div class="wide"><div class="jn-ctl">'
    + '<div class="jn-seg"><div class="jn-k">área</div><div class="jn-bs">' + wsites.map((sid) => segBtn('data-ms', sid, L.short(N.work.sites[sid].name), sid === work.def.s)).join('') + '</div></div>'
    + '<div class="jn-seg"><div class="jn-k">limite de Hs (OPLIM)</div><div class="jn-bs">' + N.work.limits.map((l) => segBtn('data-ml', l, L.dc(l) + ' m', l === work.def.l)).join('') + '</div></div>'
    + '<div class="jn-seg"><div class="jn-k">janela (TR)</div><div class="jn-bs">' + N.work.periods.map((t) => segBtn('data-mt', String(t), t + ' h', t === work.def.t)).join('') + '</div></div>'
    + '</div>'
    + '<div id="jn-w3">' + L.workThree(N.work.sites.santos.name, work.def.l, work.def.t, wc, N.work.sites.santos.cells) + '</div>'
    + '<p class="jn-ws" id="jn-ws">' + L.workSentence(N.work.sites.santos.name, work.def.l, work.def.t, wc) + '</p>'
    + '<figure class="jn-wf"><div class="figbox" id="jn-wfig">' + L.workChart(N.work.sites.santos.name, work.def.l, work.def.t, wc) + '</div>'
    + '<div id="jn-wkey">' + L.workKey(work.def.l, wc) + '</div>'
    + '<figcaption>' + esc('Hindcast Ifremer WAVEWATCH III GLOBMULTI no nó de cada área, ' + yFrom + '–' + yTo + pinPt + '. Cada barra: inícios com janela ÷ inícios determinados no mês; a contagem é de instruments/window/workability.js, em inteiros. Espera média: horas de um início até o próximo início com janela.') + '</figcaption></figure>'
    + '<details class="more"><summary>as contagens exatas, mês a mês</summary><div id="jn-wtab">' + L.workTable(wc) + '</div></details>'
    + '</div></section>');

  /* ---- 3 · the site alpha (only once the record exists) ---- */
  let sec = 3;
  if (N.alpha) {
    const A = N.alpha;
    const NB = ' ';
    const f2 = (x) => L.dc(Number(x).toFixed(2));
    const minPairs = A.method && A.method.minPairs;
    /* the record's own reading, in three words; the sentence says what each means */
    const READ = (c) => /ABOVE/.test(c.reading || '') ? 'acima' : /BELOW/.test(c.reading || '') ? 'abaixo' : 'contém';
    const sitesA = Object.keys(A.sites);
    const nameA = (sid) => L.short((N.sites.find((x) => x.id === sid) || { name: sid }).name);
    const TP = [...new Set([].concat(...sitesA.map((sid) => A.sites[sid].cells.map((c) => c.TPOP))))].sort((a, b) => a - b);
    const HS = [...new Set([].concat(...sitesA.map((sid) => A.sites[sid].cells.map((c) => c.designHs))))].sort((a, b) => a - b);
    const cellOf = (s, h, t) => s.cells.find((c) => c.designHs === h && c.TPOP === t);
    const cellRaw = (c) => (c && c.verdict === 'ESTIMATED'
      ? '<span class="jn-a">' + f2(c.alpha) + '</span><span class="jn-ai">' + f2(c.ci90[0]) + '–' + f2(c.ci90[1]) + '</span><span class="jn-ar">tabela ' + f2(c.dnv['4-1']) + ' · ' + READ(c) + '</span>'
      : '<span class="jn-ar">' + br.int(c ? c.n : 0) + ' pares</span>');
    const hsLab = (h, i) => (i === HS.length - 1 ? '≥' + NB : '') + L.dc(String(h)) + NB + 'm';
    /* the headline: every site at the one design Hs the archive fills, side by side */
    const H2 = HS.includes(2) ? 2 : HS[0];
    const cross = C.table({ cols: [{ h: 'local · Hs de projeto ' + L.dc(String(H2)) + ' m' }, ...TP.map((t) => ({ h: 'TPOP ' + t + ' h' }))],
      rows: sitesA.map((sid) => [nameA(sid), ...TP.map((t) => ({ raw: cellRaw(cellOf(A.sites[sid], H2, t)) }))]) });
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
      return '<details class="more"><summary>' + esc(nameA(sid) + ' · ' + br.int(s.pairs) + ' pares em ' + br.int(s.days) + ' dias') + '</summary>'
        + (rg && rg.caveatPt ? C.p('Atenção: ' + rg.caveatPt) : '')
        + (live.length ? '<div class="jn-at">' + C.table({ cols: [{ h: 'Hs de projeto' }, ...TP.map((t) => ({ h: 'TPOP ' + t + ' h' }))],
          rows: live.map((h) => [hsLab(h, HS.indexOf(h)), ...TP.map((t) => ({ raw: cellRaw(cellOf(s, h, t)) }))]) }) + '</div>' : '')
        + (dead.length ? '<div class="col">' + C.p('Hs de projeto ' + dead.map((h) => L.dc(String(h))).join(' e ') + ' m: pares insuficientes em todos os prazos (no máximo '
          + br.int(deadMax) + (minPairs ? '; o mínimo é ' + minPairs : '') + ').') + '</div>' : '')
        + (order.length ? '<div class="col">' + C.p('Contagens exatas, somadas nos ' + TP.length + ' prazos (cada par cai em um só): quando a previsão ficou em ou abaixo do OPWF da Tabela 4-1, quantas vezes o satélite viu Hs acima do OPLIM.') + '</div>'
          + C.table({ cols: [{ h: 'OPLIM' }, { h: 'previsões ≤ OPWF', cls: 'n' }, { h: 'satélite > OPLIM', cls: 'n' }, { h: 'satélite > 1,5 × OPLIM', cls: 'n' }],
            rows: order.map((k) => [L.dc(Q.dec(Q.parse(k), 1)) + NB + 'm', br.int(agg[k].f), br.int(agg[k].a), br.int(agg[k].b)]) }) : '')
        + '</details>';
    }).join('');
    /* what the site alpha would leave, from the workability record: the same exact count at its OPWF */
    const pctOf = (x) => L.pct(x[0], x[1]);
    const wrows = [];
    for (const [sid, ws] of Object.entries(N.work.sites)) for (const [k, c] of Object.entries(ws.cells)) {
      if (!c.s) continue;
      const m = /^([\d.]+)m\/(\d+)h$/.exec(k);
      wrows.push([L.short(ws.name), L.dc(m[1]) + NB + 'm · ' + m[2] + NB + 'h', pctOf(c.o[12]), pctOf(c.f[12]) + ' (α ' + L.dc(c.ad) + ')', { raw: '<em>' + esc(pctOf(c.s.c[12]) + ' (α ' + L.dc(c.s.a) + ')') + '</em>' }]);
    }
    out.push('<section id="alfa"><div class="col sec-head"><div class="lab">' + sec + ' · o alfa do local</div><h2>O α que os satélites medem aqui, ao lado do α da tabela do Mar do Norte.</h2></div>'
      + '<div class="col">' + C.pRaw('O α da DNV encolhe o limite da previsão (OPWF = α × OPLIM) para cobrir o erro da previsão. A tabela foi calibrada no Mar do Norte; aqui o mesmo método é aplicado aos pares ECMWF × altímetro de cada local. <b>O método reproduz a Tabela 4-1 da DNV em ' + A.calibration.within + ' de ' + A.calibration.of + ' células</b> (±0,02) antes de olhar para o Brasil.')
      + C.note({ lab: 'o que isto é, e o que não é', bodyRaw: C.p('O α do local é uma estimativa estatística (ponto flutuante, reamostragem por dia, intervalo de 90%), não um intervalo decidido; as contagens ao lado dele são exatas. A cauda de 1 em 10.000 por trás do α é extrapolação de modelo: três anos de satélite não a observam. É evidência para o vistoriador refazer, nunca uma aprovação.') })
      + C.p('Em cada célula: o α do local, o intervalo de 90% e o α da Tabela 4-1. “acima”: o intervalo inteiro fica acima da tabela, e a tabela do Mar do Norte é conservadora aqui; “abaixo”: a tabela não é conservadora aqui; “contém”: não se distingue da tabela. Abaixo de ' + (minPairs || '—') + ' pares, a célula diz só quantos pares há.')
      + '</div><div class="jn-at">' + cross + '</div>'
      + (wrows.length ? '<div class="col">' + C.pRaw('<b>O que isso muda no mês.</b> A mesma contagem exata de “O mês”, refeita com o α do local no lugar do α da tabela: o limite inferior do intervalo de 90%, arredondado para baixo a 0,01, para não ganhar janela com a parte otimista da estimativa. É o que sobraria se o vistoriador adotasse o α do local.') + '</div>'
        + C.table({ cols: [{ h: 'área' }, { h: 'OPLIM · TR' }, { h: 'o mar permite', cls: 'n' }, { h: 'a Tabela 4-1 deixa', cls: 'n' }, { h: 'o alfa do local deixaria', cls: 'n' }], rows: wrows }) : '')
      + '<div class="wide">' + blocks + '</div></section>');
    sec++;
  }

  /* ---- the scoreboard ---- */
  const defs = N.ledger.defs, v1 = Object.keys(defs).some((k) => /altimeter-hs-v1/.test(k));
  out.push('<section id="placar"><div class="col sec-head"><div class="lab">' + sec + ' · o placar</div><h2>Cada faixa é comprometida antes de o mar acontecer, e avaliada depois contra o satélite.</h2></div>'
    + '<div class="wide"><div class="jn-ev">' + P.map((p) => '<div><div class="jn-k">' + esc(NAMES[p.domain] || p.domain) + '</div>'
      + '<div class="big">' + br.int(p.commits) + ' comprometidas</div>'
      + '<p>' + esc(p.scored + ' avaliadas, ' + p.covered + ' cobertas ainda. Reivindicação: a faixa contém a medida do satélite em ' + p.claim + ' dos casos. Alvos de '
        + br.date(p.tFirst) + ' ' + br.hm(p.tFirst) + ' a ' + br.date(p.tLast) + ' ' + br.hm(p.tLast) + ' UTC, em ' + p.sites + ' locais de mar aberto; primeira em ' + br.date(p.first) + '.') + '</p>'
      + '<p>' + C.tag(p.pending ? 'EM AVALIAÇÃO' : STATUS[p.status] || p.status, p.status === 'ADMITTED' ? 'held' : 'dep') + ' '
      + esc(admLine(p)) + '</p></div>').join('') + '</div></div>'
    + '<div class="col mt5">' + C.pRaw('<b>O que será avaliado.</b> ' + (v1
      ? 'A Hs que um altímetro de satélite medir: a média exata dos valores de 1 Hz do NOAA RADS a até 100 km do local, na passagem mais próxima da hora-alvo e a até 3 h dela, com pelo menos 5 pontos. Um alvo sem passagem nunca é avaliado; as passagens não dependem da previsão, então o conjunto avaliado não é escolhido pelo resultado.'
      : esc(Object.values(defs).map((d) => d.target).join(' '))))
      + C.pRaw('<b>A regra de admissão.</b> ' + esc(PLACAR.RULE_PT) + ' A admissão se perde por registro, nunca por opinião.')
      + C.pRaw('<b>Em ' + esc(br.date(N.feed.madeAt)) + ', a data deste retrato.</b> ' + esc(N.ledger.scored === 0 ? 'Nenhuma avaliada ainda: o placar começou em ' + (N.ledger.first ? br.date(N.ledger.first) : '—') + ' e a avaliação começa quando os satélites passam e os dias fecham. O registro é só de acréscimo: uma previsão errada fica para sempre.' : N.ledger.scored + ' faixas avaliadas até essa data.') + ' O placar de hoje está no app: <a href="/janela/#modo=placar">/janela/ → PLACAR</a>.')
      + '</div></section>');
  sec++;

  /* ---- why trust it ---- */
  const srcRows = [
    ['Previsão ECMWF aberta, 00 UTC: IFS 0,25°, ondas e ensemble de ondas (50 membros)', 'CC BY 4.0', 'a previsão do dia', { raw: C.m(N.feed.file) + ' <span class="jn-pin">sha256 ' + esc(N.feed.sha.slice(0, 16)) + '… do JSON; ' + N.feed.groups + ' arquivos GRIB, cada um com o seu sha256</span>' }],
    ['NOAA RADS, altimetria em tempo quase real', 'domínio público', 'o erro medido (pares satélite × previsão) e o placar', { raw: C.m('corpus/janela/matchups.json.gz') + ' <span class="jn-pin">sha256 ' + esc(String(N.bands.sha).slice(0, 16)) + '…, ' + br.int(N.bands.rows) + ' pares</span>' }],
    ['Ifremer WAVEWATCH III GLOBMULTI, hindcast ' + yFrom + '–' + yTo, 'CC BY-SA 4.0', 'as janelas de “O mês”', { raw: C.m('corpus/ww3-points') + ' <span class="jn-pin">' + esc(pinM ? pinM[1] + ' arquivos mensais, sha256 em corpus/ww3-points/meta.json' : N.work.pinned) + '</span>' }],
    ['Capitanias dos Portos: NPCPs e portarias', 'ato oficial', 'os limites publicados', { raw: '<span class="jn-pin">' + esc(N.acts.length + ' atos, cada PDF com o seu sha256 (abaixo)') + '</span>' }],
    ['DNV-OS-H101, out. 2011, Seção 4 B700, Tabelas 4-1 a 4-6', 'DNV; valores transcritos com a página', 'o α e o OPWF', { raw: '<span class="jn-pin">sha256 ' + esc(N.dnv.source.sha256.slice(0, 16)) + '… do PDF, não redistribuído</span>' }]
  ];
  const boundaries = [
    { b: 'O nó, não o berço.', text: 'A previsão é a do ECMWF, lida no nó de mar aberto mais próximo. Num terminal, é a aproximação: um limite de onda no berço fica SEM DADOS até existir a transferência para dentro da baía.' },
    { b: 'A faixa é uma reivindicação.', text: 'Hoje, o ensemble do ECMWF (40 centrais de 50) e a faixa medida da Janela; ambas avaliadas em público contra satélites, e o proponente que erra a própria reivindicação é podado pela regra binomial exata.' },
    { b: 'Os passos da previsão.', text: 'Decide-se a faixa nos passos da própria previsão: não o mar entre passos, não uma probabilidade.' },
    { b: 'A cauda do α.', text: 'A cauda de 1 em 10.000 por trás do α da DNV é extrapolação de modelo; três anos de pares com satélite não a observam.' },
    { b: 'Não é aprovação.', text: 'Garantia marítima e sociedades classificadoras são donas dessa palavra. A Janela entrega evidência que um vistoriador refaz.' }
  ];
  const ruleBlocks = N.ops.map((o) => '<div class="jn-rule" id="regra-' + esc(o.id) + '"><h3>' + esc(o.name) + '</h3>'
    + '<p>' + esc(o.source.title) + '. ' + esc(o.source.act) + '.</p>'
    + C.quote({ text: o.quote, cite: o.page })
    + '<p>' + esc('Como a Janela lê: ' + o.limits.map(L.limText).join(' · ') + (o.hsAt === 'berth' ? '. Onda limitada no berço: não decidida no nó.' : '.')) + '</p>'
    + '<p class="jn-pin">' + esc('vigência, como transcrita: ' + (o.ruleStatus || '—')) + '</p>'
    + (o.uncertain ? '<p class="jn-pin">' + esc('nota de transcrição (registrada em inglês): ' + o.uncertain) + '</p>' : '')
    + '<p class="jn-pin"><a href="' + esc(o.source.url) + '">o ato</a> · sha256 ' + esc(o.source.sha256) + ' · ' + esc(o.source.fetched || '') + '</p></div>').join('');
  const t41 = N.dnv.t41;
  const t41rows = Object.keys(t41.rows).map((T) => ['TPOP ≤ ' + T + ' h', ...t41.rows[T].map((x) => L.dc(x.toFixed(2)))]);
  out.push('<section id="confiar"><div class="col sec-head"><div class="lab">' + sec + ' · por que confiar</div><h2>O veredito é aritmética exata sobre o limite como impresso; a faixa é uma reivindicação que o placar audita.</h2></div>'
    + '<div class="col">'
    + C.pRaw('<b>Aritmética exata.</b> Toda comparação é feita em racionais exatos, inteiros sem arredondamento: a previsão sai dos inteiros empacotados do GRIB (valor = (R + X·2<sup>E</sup>)/10<sup>D</sup>), o vento em nós por 1 nó = 463/900 m/s, os limites como impressos, com a vírgula virada ponto. Nenhum ponto flutuante decide. A borda é exata: uma borda de exatamente 2,0 contra “&lt; 2,0” é INDEFINIDA, nunca LIBERADA.')
    + C.pRaw('<b>A faixa medida.</b> Hs: a previsão determinística × o intervalo exato da razão observado/previsto nos pares satélite × previsão do local e do prazo (blocos de ' + N.bands.binHours + ' h). Vento: a previsão ± o erro medido em m/s no prazo (observado − previsto), com piso em zero. Cada faixa reivindica cobertura de ' + claim + ', um teorema de contagem sob a hipótese de que o próximo erro se parece com os ' + br.int(N.bands.rows) + ' pares do arquivo no mesmo local e prazo; o placar audita essa hipótese em público.')
    + C.pRaw('<b>No app, a faixa arredondada para fora.</b> O app (<a href="/janela/">/janela/</a>) publica as faixas de cada local e de cada unidade de produção em decimais curtos, arredondados PARA FORA: Hs a 0,001 m e vento a 0,01 nó, a borda inferior para baixo e a superior para cima; a previsão determinística vai como o intervalo de 1 mm que a contém. Sobre uma faixa mais larga, um LIBERADA ou um VETADA continua valendo sobre a exata; só INDEFINIDA pode crescer. O build confere isso contra as decisões exatas desta página a cada dia e recusa se falhar. As unidades emprestam a faixa e o α do local medido mais perto, a até 350 km; mais longe, dizem SEM DADOS.')
    + C.pRaw('<b>A mesma conta, na sua aba.</b> A grade acima é decidida de novo no seu navegador pelos mesmos módulos que geraram o registro: ' + N.mods.map((m) => C.m(m.rel) + ' <span class="jn-pin">sha256 ' + esc(m.sha) + '</span>').join(' · ') + '. <span id="jn-sha" class="jn-pin">Com scripts desligados, a grade mostra o registro publicado.</span>')
    + C.pRaw('<b>A bateria.</b> ' + esc(battery.checks + ' verificações e ' + battery.reds + ' controles vermelhos a cada build') + ' — limites inclusivos e estritos na borda exata, a testemunha de um VETADA, o limiar de um INDEFINIDA, e recusas para unidade trocada, número em ponto flutuante, variável desconhecida e janela vazia.')
    + '<h3>Os limites honestos</h3>' + C.plainList(boundaries)
    + '</div>'
    + '<div class="wide"><details class="more"><summary>as fontes, as licenças e os pinos</summary>'
    + C.table({ cols: [{ h: 'fonte' }, { h: 'licença' }, { h: 'entra em' }, { h: 'pino' }], rows: srcRows })
    + '</details>'
    + '<details class="more"><summary>os limites publicados, como impressos (' + N.ops.length + ')</summary>' + ruleBlocks + '</details>'
    + '<details class="more"><summary>a Tabela 4-1 da DNV, transcrita</summary>'
    + C.table({ cols: [{ h: 'alfa (ondas)' }, ...N.dnv.columns.map((c, i) => ({ h: 'Hs de projeto ' + (i === N.dnv.columns.length - 1 ? '≥ ' : '') + c + ' m', cls: 'n' }))], rows: t41rows })
    + '<div class="col">' + C.p(N.dnv.source.title + '. Interpolação linear entre colunas; a janela TR vale o dobro do TPOP quando a contingência não é avaliada em detalhe (B402).') + '</div>'
    + '</details></div>'
    + '<div class="col">' + C.pRaw('<b>Refazer.</b> O código é aberto: <a href="' + REPO + '/tree/main/apps/janela">apps/janela</a> e <a href="' + REPO + '/tree/main/instruments/window">instruments/window</a>.')
    + C.code('node instruments/window/battery.js\nnode apps/janela/battery.js\nnode apps/janela/build.js\nnode apps/janela/build-today.js') + '</div>'
    + '</section>');

  const data = { def, sel: defSel, custom, ctx, sites: sitesOut, ops: opsOut, groupOf, work };
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');
  const script = '<script type="application/json" id="jn-mods">' + B.json + '</script>\n'
    + '<script type="application/json" id="jn-data">' + dataJson + '</script>\n'
    + '<script>(' + client.toString() + ')(' + lib.toString() + ');</script>';
  const foot = '<p>' + esc('Gerado por apps/janela/build.js a partir de ' + N.feed.file + ', certs/janela-bands.json, certs/janela-workability.json, '
    + (N.alpha ? 'certs/janela-alpha.json, ' : '') + 'certs/janela-ledger/, apps/janela/scenario/ e das suas regras; bateria do instrumento ' + battery.checks + ' verificações, ' + battery.reds + ' controles vermelhos.') + '</p><p>' + esc('git ' + git) + '</p>';
  const html = TPL.render({
    title: 'Janela — o método: a janela operacional, decidida', lang: 'pt-BR',
    desc: 'Janela decide janelas operacionais offshore no Brasil: a previsão ECMWF com o erro medido contra satélites, decidida contra o limite publicado (Capitania, DNV ou o seu): LIBERADA, VETADA, INDEFINIDA ou SEM DADOS, com o motivo.',
    path: '/janela/metodo/', bodyRaw: out.join('\n\n'), footRaw: foot, cssRaw: css(), scriptRaw: script
  });
  return { html, checked, def, data };
}

module.exports = { build, bundle, lib, MODS };
