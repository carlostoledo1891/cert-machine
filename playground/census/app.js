/* app.js — the census in your tab. The page is complete without it: the network
   and every number were written by make-facts.mjs. This makes the network a thing
   you can pull on: pick a preset, drag a direction of the face and watch the two
   populations trade an edge while the totals hold; click an edge to drop it and
   watch k, the shortcut and z re-decided in exact rationals by the same engine.

   IT DECIDES NOTHING ITSELF. Every k, z and split comes from CENSUS (engine.js);
   the app only draws what it returns. Standings: k is DECIDED (exact over Q, the
   readout is underlined solid); the flows are CHOSEN (one member of the face,
   dotted) — the same strokes the static page carries. */
(function () {
  'use strict';
  var E = window.CENSUS;
  var host = document.getElementById('ce-host');
  var spec = document.getElementById('ce-spec');
  if (!E || !host || !spec) return;
  var F = JSON.parse(spec.textContent);
  var sel = document.getElementById('ce-preset');
  var sliders = document.getElementById('ce-sliders');
  var read = document.getElementById('ce-read');
  var note = document.getElementById('ce-note');

  var presets = [{ id: 'paper', name: 'the paper’s network (15 edges, Table I)', edges: F.paper.edges, exits: F.paper.exits, ea: F.paper.ea, eb: F.paper.eb, pos: F.paper.pos, totals: true }];
  F.cycle.forEach(function (c) { presets.push({ id: 'cycle' + c.L, name: 'an exit-free shared ' + c.L + '-cycle (z = 1)', edges: c.edges, exits: c.exits, ea: c.ea, eb: c.eb }); });
  F.failing.forEach(function (f, i) { presets.push({ id: 'fail' + i, name: 'a network that fools the shortcut #' + (i + 1), edges: f.edges, exits: f.exits, ea: f.ea, eb: f.eb }); });
  presets.forEach(function (p) { var o = document.createElement('option'); o.value = p.id; o.textContent = p.name; sel.appendChild(o); });

  var st = { preset: presets[0], active: null, t: null, base: null, family: null };
  var Q = E.fromNum;

  function layout(p) {
    if (p.pos) return p.pos;
    var nodes = {}; p.edges.forEach(function (e) { nodes[e[0]] = 1; nodes[e[1]] = 1; });
    var ids = Object.keys(nodes).map(Number).sort(function (a, b) { return a - b; });
    var pos = {};
    ids.forEach(function (n, i) { var a = -Math.PI / 2 + 2 * Math.PI * i / ids.length; pos[n] = [0.5 + 0.42 * Math.cos(a), 0.5 + 0.42 * Math.sin(a)]; });
    return pos;
  }

  function activeEdges() { return st.preset.edges.filter(function (_, i) { return st.active[i]; }); }
  function activeIndex() { var m = []; st.active.forEach(function (a, i) { if (a) m.push(i); }); return m; }

  function recompute() {
    var edges = activeEdges();
    var face = E.face(edges, st.preset.exits, st.preset.ea, st.preset.eb);
    st.face = face;
    st.family = null;
    if (st.preset.totals && st.active.every(Boolean)) {
      var rp = E.repairTotals(edges, st.preset.exits, (function () { var o = {}; o[st.preset.ea] = F.paper.q1; o[st.preset.eb] = F.paper.q2; return o; })(), F.paper.table1);
      var fam = E.splitFamily(edges, st.preset.exits, st.preset.ea, st.preset.eb, rp.T, F.paper.q1);
      if (fam && fam.feasible) { st.family = fam; st.t = fam.basis.map(function () { return E.q0; }); }
    }
  }

  function currentSplit() {
    var fam = st.family; if (!fam) return null;
    var j1 = fam.base.slice();
    fam.basis.forEach(function (v, i) { v.forEach(function (vc, c) { j1[c] = E.add(j1[c], E.mul(st.t[i], vc)); }); });
    return j1;
  }
  function rangeAt(i) {
    var fam = st.family, j1 = currentSplit(), lo = null, hi = null;
    fam.basis[i].forEach(function (vc, c) {
      if (E.isZero(vc)) return;
      var a = E.div(E.neg(j1[c]), vc), b = E.div(E.sub(fam.T[fam.shared[c]], j1[c]), vc);
      var l = E.cmp(a, b) < 0 ? a : b, h = E.cmp(a, b) < 0 ? b : a;
      if (lo === null || E.cmp(l, lo) > 0) lo = l;
      if (hi === null || E.cmp(h, hi) < 0) hi = h;
    });
    return [lo, hi];
  }

  function draw() {
    var p = st.preset, pos = layout(p), W = 560, H = 380, pad = 34;
    var P = function (n) { return [pad + pos[n][0] * (W - 2 * pad), pad + (1 - pos[n][1]) * (H - 2 * pad)]; };
    var fam = st.family, j1 = fam ? currentSplit() : null;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="the network">'];
    s.push('<defs><marker id="ce-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--ink-3)"/></marker></defs>');
    p.edges.forEach(function (e, i) {
      var a = P(e[0]), b = P(e[1]);
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      var on = st.active[i];
      var shared = on && st.face.shared.indexOf(activeIndex().indexOf(i)) >= 0;
      s.push('<line class="ce-edge" data-i="' + i + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + (b[0] - dx / L * 9) + '" y2="' + (b[1] - dy / L * 9) + '" stroke="' + (on ? (shared ? 'var(--ink-2)' : 'var(--line)') : 'transparent') + '" stroke-width="' + (on ? 1.2 : 8) + '" ' + (on ? '' : 'stroke-dasharray="2 3" stroke="var(--line)"') + ' marker-end="url(#ce-arr)"/>');
      if (fam && on) {
        var c = fam.shared.indexOf(activeIndex().indexOf(i));
        var v1 = c >= 0 ? j1[c] : (st.face.a1.indexOf(i) >= 0 ? fam.T[i] : E.q0);
        var v2 = E.sub(fam.T[i], v1);
        var w1 = Math.max(0, E.toNum(v1) / 7), w2 = Math.max(0, E.toNum(v2) / 7);
        var off = (w1 + w2) / 4 + 2;
        if (w1 > 0.05) s.push('<line class="w-chosen" x1="' + (a[0] + nx * off) + '" y1="' + (a[1] + ny * off) + '" x2="' + (b[0] + nx * off) + '" y2="' + (b[1] + ny * off) + '" stroke="var(--ink)" stroke-width="' + w1.toFixed(2) + '" stroke-dasharray="1 5" stroke-linecap="round"><title>population 1 on edge ' + e[0] + '→' + e[1] + ': ' + E.str(v1) + '</title></line>');
        if (w2 > 0.05) s.push('<line class="w-chosen" x1="' + (a[0] - nx * off) + '" y1="' + (a[1] - ny * off) + '" x2="' + (b[0] - nx * off) + '" y2="' + (b[1] - ny * off) + '" stroke="var(--ink-2)" stroke-width="' + w2.toFixed(2) + '" stroke-dasharray="1 5" stroke-linecap="round"><title>population 2 on edge ' + e[0] + '→' + e[1] + ': ' + E.str(v2) + '</title></line>');
      }
    });
    Object.keys(pos).forEach(function (n) {
      var q = P(+n), exit = p.exits.indexOf(+n) >= 0, ent = (+n === p.ea || +n === p.eb);
      s.push('<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (ent ? 9 : 7) + '" fill="' + (exit ? 'var(--ink)' : 'var(--paper)') + '" stroke="var(--ink)" stroke-width="1.5"/>');
      s.push('<text x="' + (q[0] + 11) + '" y="' + (q[1] - 8) + '" font-size="11" fill="var(--ink-2)" font-family="var(--mono)">' + n + (ent ? (+n === p.ea ? ' · a' : ' · b') : '') + (exit ? ' · exit' : '') + '</text>');
    });
    s.push('</svg>');
    host.innerHTML = s.join('');
    Array.prototype.forEach.call(host.querySelectorAll('.ce-edge'), function (el) {
      el.addEventListener('click', function () { var i = +el.getAttribute('data-i'); st.active[i] = !st.active[i]; recompute(); render(); });
    });
  }

  function render() {
    draw();
    var f = st.face;
    read.innerHTML = '<div><div class="k">k, exact over Q</div><div class="v w-decided">' + f.k + '</div></div>'
      + '<div><div class="k">shortcut |shared| − cons</div><div class="v ' + (f.agree ? 'w-decided' : 'w-chosen') + '">' + f.shortcut + '</div></div>'
      + '<div><div class="k">z, exit-free shared components</div><div class="v w-decided">' + f.z + '</div></div>'
      + '<div><div class="k">|shared| · cons</div><div class="v">' + f.shared.length + ' · ' + f.cons + '</div></div>';
    sliders.innerHTML = '';
    if (st.family) {
      st.family.basis.forEach(function (v, i) {
        var r = rangeAt(i);
        var box = document.createElement('div'); box.className = 'ce-sl';
        var lab = document.createElement('label'); lab.textContent = 'direction ' + (i + 1) + ' of ' + st.family.basis.length; box.appendChild(lab);
        /* the grid is quarters, and only quarters inside the range are offered, so t = 0 sits on it and every stop is feasible */
        var lo = Math.ceil((E.toNum(r[0]) + E.toNum(st.t[i])) * 4) / 4, hi = Math.floor((E.toNum(r[1]) + E.toNum(st.t[i])) * 4) / 4;
        var inp = document.createElement('input'); inp.type = 'range'; inp.min = lo; inp.max = hi; inp.step = 0.25; inp.value = E.toNum(st.t[i]);
        inp.addEventListener('input', function () { st.t[i] = Q(Math.round(+inp.value * 4) / 4); render(); });
        box.appendChild(inp);
        var rr = document.createElement('div'); rr.className = 'r'; rr.innerHTML = '<span>' + (E.toNum(r[0]) + E.toNum(st.t[i])).toFixed(2) + '</span><span>t = ' + E.str(st.t[i]) + '</span><span>' + (E.toNum(r[1]) + E.toNum(st.t[i])).toFixed(2) + '</span>';
        box.appendChild(rr);
        sliders.appendChild(box);
      });
      note.textContent = 'Every slider moves the split along one direction of the face while every total holds and both populations conserve; the range shown is how far that direction goes before a flow would turn negative. Rationals throughout.';
    } else if (st.preset.totals) {
      note.textContent = 'An edge is dropped: Table I no longer applies, so no flow is drawn. k, the shortcut and z are re-decided on the network as it stands.';
    } else {
      note.textContent = f.z > 0 ? 'z = ' + f.z + ': the shared subgraph has ' + f.z + ' component' + (f.z > 1 ? 's' : '') + ' with no exit, and the shortcut undercounts k by exactly that.' : 'z = 0: the shortcut and the exact k agree here.';
    }
  }

  function load(id) {
    st.preset = presets.filter(function (p) { return p.id === id; })[0];
    st.active = st.preset.edges.map(function () { return true; });
    recompute(); render();
  }
  sel.addEventListener('change', function () { load(sel.value); });
  load('paper');
})();
