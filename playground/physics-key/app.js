/* app.js — the physics answer key in the tab. playground/physics-key/ · cert-machine · 2026-11-17
   Runs instruments/physicskey/decide.js (inlined before this file as #pk-decide, window.PhysicsKey) in a worker on the
   bytes of the run the reader picks, and draws what it decided. Every element whose content changes has its size
   reserved in page.css. The curve is drawn from the exactly decided deviation of each step, rounded once for the
   screen; no verdict reads a rounded number. */
(function () {
  'use strict';
  var F = window.PKF, $ = function (id) { return document.getElementById(id); };
  var SPEC = JSON.parse($('pk-spec').textContent);
  var runs = {}; SPEC.runs.forEach(function (r) { runs[r.id] = r; });
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fmt = function (x) { return Number(x).toLocaleString('en-US'); };
  var sel = { engine: SPEC.default.engine, scene: SPEC.default.scene, integrator: SPEC.default.integrator, timestep: SPEC.default.timestep }, law = null;
  var ENG = SPEC.engines;
  /* a choice the engine did not record for this scene falls to the nearest one it did (same damping setting) */
  function settle() {
    var ok = ENG[sel.engine].of[sel.scene];
    if (ok.indexOf(sel.integrator) >= 0) return;
    var twin = sel.integrator.replace('semiimplicit', 'featherstone');
    sel.integrator = ok.indexOf(twin) >= 0 ? twin : ok[0];
  }
  var cache = {}, cur = null, token = 0, playing = !reduce, k = 0, t0 = 0, raf = 0;
  var idOf = function (s) { return s.scene + '-' + s.integrator + '-h' + s.timestep; };
  var LAWS = { fall: ['F-POS', 'F-VEL'], pendulum: ['P-ENERGY'], top: ['T-ENERGY', 'T-MONO', 'T-LMAG', 'T-LVEC'] };
  var PLAIN = {
    m: { '1e-2': '1 cm', '1e-3': '1 mm', '1e-6': '1 µm', '1e-9': '1 nm', '1e-12': '1 pm' },
    mps: { '1e-2': '1 cm/s', '1e-3': '1 mm/s', '1e-6': '1 µm/s', '1e-9': '1 nm/s', '1e-12': '1 pm/s' },
    rel: { '1e-2': '1%', '1e-4': '0.01%', '1e-6': '10⁻⁶', '1e-9': '10⁻⁹', '1e-12': '10⁻¹²' }
  };
  PLAIN.sq = PLAIN.rel;
  var AXIS = { m: 'distance from the formula, in metres', mps: 'distance from the formula, in metres per second',
    rel: 'change since the start, as a share of the starting value', sq: 'squared distance from the starting vector, as a share of its squared size' };
  var AXIS_MONO = 'rise within one step, as a share of the starting energy';

  /* ---- the decider, in a worker made from the inlined source; in the page itself if a worker cannot start ---- */
  var worker = null, waiting = {};
  try {
    var src = $('pk-decide').textContent + '\nself.onmessage=function(e){var t={},a=Date.now(),r=self.PhysicsKey.decideRun(e.data.entry,new Uint8Array(e.data.bytes),e.data.sha,t);self.postMessage({id:e.data.entry.id,r:r,trace:t,ms:Date.now()-a});};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = function (e) { var w = waiting[e.data.id]; if (w) { delete waiting[e.data.id]; w(e.data); } };
    worker.onerror = function () { worker = null; Object.keys(waiting).forEach(function (id) { var w = waiting[id]; delete waiting[id]; w(null); }); };
  } catch (err) { worker = null; }
  function decide(entry, raw, sha) {
    var here = function () { var t = {}, a = Date.now(), r = window.PhysicsKey.decideRun(entry, new Uint8Array(raw), sha, t); return { id: entry.id, r: r, trace: t, ms: Date.now() - a }; };
    if (!worker) return new Promise(function (ok) { setTimeout(function () { ok(here()); }, 20); });
    return new Promise(function (ok) {
      waiting[entry.id] = function (d) { ok(d || here()); };
      var copy = raw.slice(0);
      worker.postMessage({ entry: entry, bytes: copy, sha: sha }, [copy]);
    });
  }
  function gunzip(bytes) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('this browser cannot unpack the recorded file (no DecompressionStream)'));
    return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  function digest(buf) {
    if (!(window.crypto && window.crypto.subtle)) return Promise.resolve(null);
    return window.crypto.subtle.digest('SHA-256', buf).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join(''); });
  }
  function load(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    var e = runs[id];
    return fetch(SPEC.dir + id + '.f64.gz').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' for the recorded file'); return r.arrayBuffer(); })
      .then(function (buf) { var b = new Uint8Array(buf); return (b[0] === 0x1f && b[1] === 0x8b ? gunzip(b) : Promise.resolve(buf)).then(function (raw) { return { raw: raw, fetched: b.length }; }); })
      .then(function (o) { return digest(o.raw).then(function (d) { o.unchecked = d === null; o.sha = d === null ? e.sha256 : d; return o; }); })
      .then(function (o) {
        return decide(e, o.raw, o.sha).then(function (d) {
          return (cache[id] = { entry: e, view: new DataView(o.raw), fetched: o.fetched, unchecked: o.unchecked, pinned: o.sha === e.sha256, r: d.r, trace: d.trace, ms: d.ms });
        });
      });
  }

  /* ---- reading a recorded row, for the picture only ---- */
  function val(c, step, col) { return c.view.getFloat64(8 * (step * (1 + c.entry.nq + c.entry.nv) + col), true); }

  /* ---- the picture of the scene at step k ---- */
  function picture(c, step) {
    var s = c.entry.scene, h = '';
    if (s === 'fall') {
      var z = val(c, step, 3), y = 34 + (-z / 20) * 252;
      for (var m = 0; m <= 20; m += 5) h += '<line class="pk-g" x1="120" x2="136" y1="' + (34 + m / 20 * 252) + '" y2="' + (34 + m / 20 * 252) + '"/><text class="pk-tx" x="112" y="' + (38 + m / 20 * 252) + '" text-anchor="end">' + m + ' m</text>';
      h += '<line class="pk-g" x1="160" x2="160" y1="34" y2="286"/><circle class="pk-body" cx="160" cy="' + y.toFixed(2) + '" r="10"/>';
    } else if (s === 'pendulum') {
      var th = val(c, step, 1), px = 160, py = 165, len = 118, th0 = val(c, 0, 1);
      var yr = py + len * Math.cos(th0);
      h += '<line class="pk-g" x1="20" x2="300" y1="' + yr.toFixed(1) + '" y2="' + yr.toFixed(1) + '"/><text class="pk-tx" x="300" y="' + (yr - 6).toFixed(1) + '" text-anchor="end">the height it was let go from</text>';
      h += '<line class="pk-rod" x1="' + px + '" y1="' + py + '" x2="' + (px + len * Math.sin(th)).toFixed(2) + '" y2="' + (py + len * Math.cos(th)).toFixed(2) + '"/>'
        + '<circle class="pk-pivot" cx="' + px + '" cy="' + py + '" r="3"/><circle class="pk-body" cx="' + (px + len * Math.sin(th)).toFixed(2) + '" cy="' + (py + len * Math.cos(th)).toFixed(2) + '" r="11"/>';
    } else {
      /* the recorded quaternion: scalar first, or scalar last under the "world" layout (RULES.md, A2.2) */
      var wl = c.entry.layout === 'world', w = val(c, step, wl ? 7 : 4), x = val(c, step, wl ? 4 : 5), yq = val(c, step, wl ? 5 : 6), zq = val(c, step, wl ? 6 : 7), n = w * w + x * x + yq * yq + zq * zq;
      var R = [[(w * w + x * x - yq * yq - zq * zq) / n, 2 * (x * yq - w * zq) / n, 2 * (x * zq + w * yq) / n],
        [2 * (x * yq + w * zq) / n, (w * w - x * x + yq * yq - zq * zq) / n, 2 * (yq * zq - w * x) / n],
        [2 * (x * zq - w * yq) / n, 2 * (yq * zq + w * x) / n, (w * w - x * x - yq * yq + zq * zq) / n]];
      /* a fixed camera: turn about the vertical, tip toward the viewer, drop the depth */
      var ca = Math.cos(0.6), sa = Math.sin(0.6), cb = Math.cos(0.42), sb = Math.sin(0.42);
      var proj = function (p) {
        var X = R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2], Y = R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2], Z = R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2];
        var x1 = ca * X - sa * Y, y1 = sa * X + ca * Y;
        return [160 + 74 * x1, 160 - 74 * (cb * Z - sb * y1), sb * Z + cb * y1];
      };
      var A = 1.414, B = 1, pts = [[A, B, 0], [-A, B, 0], [-A, -B, 0], [A, -B, 0]].map(proj);
      var nrm = proj([0, 0, 1]), org = proj([0, 0, 0]), front = nrm[2] - org[2] < 0;
      var a1 = proj([0, 1.55, 0]), a2 = proj([0, -1.55, 0]), mark = proj([0, B, 0]);
      h += '<line class="pk-g" x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) + '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '"/>'
        + '<polygon class="pk-plate' + (front ? ' front' : '') + '" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>'
        + '<circle class="pk-mark' + (front ? ' front' : '') + '" cx="' + mark[0].toFixed(1) + '" cy="' + mark[1].toFixed(1) + '" r="5"/>';
    }
    $('pk-anim').innerHTML = h;
  }

  /* ---- the chart: the decided deviation of every step, on a scale of powers of ten ---- */
  var CH = { W: 640, H: 300, L: 64, R: 14, T: 14, B: 30 };
  function chart(c) {
    var e = c.entry, kind = F.KIND[law], tr = c.trace[law], L = c.r.laws[law], n = e.steps + 1, mono = law === 'T-MONO';
    var pw = CH.W - CH.L - CH.R, ph = CH.H - CH.T - CH.B, cols = Math.min(600, n), env = new Float64Array(cols);
    var lo = Infinity, hi = -Infinity, i, j;
    for (i = 0; i < n; i++) { var v = mono ? Math.max(tr[i], 0) : Math.abs(tr[i]); j = Math.min(cols - 1, Math.floor(i * cols / n)); if (v > env[j]) env[j] = v; if (v > 0) { var g = Math.log10(v); if (g < lo) lo = g; if (g > hi) hi = g; } }
    var sq = kind === 'sq', yMin = Math.max(-34, Math.min(Math.floor(lo === Infinity ? -13 : lo) - 1, sq ? -25 : -13)), yMax = Math.max(0, Math.ceil(hi === -Infinity ? 0 : hi));
    var X = function (step) { return CH.L + step / e.steps * pw; }, Y = function (g) { return CH.T + (yMax - Math.max(yMin, g)) / (yMax - yMin) * ph; };
    var d = '', s = '';
    for (j = 0; j < cols; j++) d += (j ? 'L' : 'M') + (CH.L + (j + 0.5) / cols * pw).toFixed(1) + ' ' + Y(env[j] > 0 ? Math.log10(env[j]) : yMin).toFixed(1);
    F.ORDER(Object.keys(L.tolerances)).forEach(function (key) {
      if (key === '0') return;
      var g = -(+key.slice(3)) * (sq ? 2 : 1), y = Y(g).toFixed(1), t = L.tolerances[key];
      s += '<line class="pk-rung" x1="' + CH.L + '" x2="' + (CH.W - CH.R) + '" y1="' + y + '" y2="' + y + '"/><text class="pk-tx" x="' + (CH.L - 8) + '" y="' + (+y + 4) + '" text-anchor="end">' + PLAIN[kind][key] + '</text>';
      if (t.verdict === 'REFUTED') {
        var cx = X(t.firstStep), cy = +y;
        s += '<g class="pk-x"><title>first outside ' + PLAIN[kind][key] + ' at step ' + fmt(t.firstStep) + '</title><line x1="' + (cx - 4.5).toFixed(1) + '" y1="' + (cy - 4.5) + '" x2="' + (cx + 4.5).toFixed(1) + '" y2="' + (cy + 4.5) + '"/><line x1="' + (cx - 4.5).toFixed(1) + '" y1="' + (cy + 4.5) + '" x2="' + (cx + 4.5).toFixed(1) + '" y2="' + (cy - 4.5) + '"/></g>';
      }
    });
    var secs = SPEC.scene[e.scene].seconds;
    s += '<line class="pk-base" x1="' + CH.L + '" x2="' + (CH.W - CH.R) + '" y1="' + (CH.T + ph) + '" y2="' + (CH.T + ph) + '"/>'
      + '<text class="pk-tx" x="' + CH.L + '" y="' + (CH.H - 8) + '">0 s</text><text class="pk-tx" x="' + (CH.W - CH.R) + '" y="' + (CH.H - 8) + '" text-anchor="end">' + secs + ' s</text>'
      + '<path class="pk-line" d="' + d + '"/><line class="pk-cursor" id="pk-cursor" x1="' + CH.L + '" x2="' + CH.L + '" y1="' + CH.T + '" y2="' + (CH.T + ph) + '"/>';
    $('pk-chart').innerHTML = s;
    var cap = (mono ? AXIS_MONO : AXIS[kind]) + '. Each cross is the first step outside that tolerance. ';
    cap += L.max.hi === '0' ? (mono ? 'In this run it never rises.' : 'In this run it never moves.')
      : 'Largest: ' + F.size(L.max.hi, kind) + ' at step ' + fmt(L.max.step) + '. ' + (mono ? '' : 'At the end: ' + F.signed(L.last.lo, L.last.hi, kind) + '.');
    $('pk-cap').innerHTML = cap.charAt(0).toUpperCase() + cap.slice(1);
  }
  function cursor() {
    var el = $('pk-cursor'); if (!el || !cur) return;
    var x = (CH.L + k / cur.entry.steps * (CH.W - CH.L - CH.R)).toFixed(1); el.setAttribute('x1', x); el.setAttribute('x2', x);
  }

  /* ---- the verdicts of the law in view ---- */
  var VK = { CERTIFIED: 'held', REFUTED: 'dep', REFUSED: 'open' }, WORD = { CERTIFIED: 'Certified', REFUTED: 'Refuted', REFUSED: 'Refused' };
  function verdicts(c) {
    var e = c.entry, kind = F.KIND[law], L = c.r.laws[law], h = +e.timestep;
    $('pk-verdicts').innerHTML = F.ORDER(Object.keys(L.tolerances)).map(function (key) {
      var t = L.tolerances[key];
      var why = t.verdict === 'REFUTED' ? 'first fails at step ' + fmt(t.firstStep) + ', ' + (t.firstStep * h).toFixed(3) + ' s'
        : t.verdict === 'CERTIFIED' ? 'holds at all ' + fmt(e.steps + 1) + ' recorded steps' : 'not decided';
      return '<div class="pk-v"><span class="pk-tol">' + (key === '0' ? 'exactly' : 'within ' + F.TOL[kind][key]) + '</span><span class="tag ' + VK[t.verdict] + '">' + WORD[t.verdict] + '</span><span class="pk-why">' + why + '</span></div>';
    }).join('');
  }
  function same(a, b) { return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b)); }
  function sortKeys(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) { var o = {}; Object.keys(v).sort().forEach(function (x) { o[x] = sortKeys(v[x]); }); return o; }
    return v;
  }
  function status(c) {
    var agree = same(c.r, SPEC.record[c.entry.id]);
    var pin = c.unchecked ? 'this connection offers no digest, so the file was not checked against its pin here' : c.pinned ? 'its sha256 is the pinned one, checked in this tab' : 'its sha256 is NOT the pinned one';
    $('pk-status').textContent = 'Your tab fetched ' + fmt(Math.round(c.fetched / 1024)) + ' KB (' + pin + ') and decided ' + fmt(c.entry.steps + 1) + ' steps in ' + fmt(c.ms) + ' ms with whole numbers. '
      + (agree ? 'It reached the same verdicts, steps and digits as the record.' : 'It did NOT reach what the record says: this page is not what its record says.');
    $('pk-status').classList.toggle('bad', !agree || (!c.unchecked && !c.pinned));
  }

  /* ---- the controls ---- */
  function marks() {
    document.querySelectorAll('.pk-step').forEach(function (b) { var on = b.getAttribute('data-scene') === sel.scene; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    var E = ENG[sel.engine], ok = E.of[sel.scene];
    document.querySelectorAll('[data-engine]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-engine') === sel.engine)); });
    document.querySelectorAll('.pk-layer').forEach(function (d) {
      var on = d.getAttribute('data-for') === sel.engine;
      d.classList.toggle('off', !on);
      d.querySelectorAll('[data-integrator]').forEach(function (b) {
        var i = b.getAttribute('data-integrator');
        b.setAttribute('aria-pressed', String(on && i === sel.integrator));
        b.disabled = !on || ok.indexOf(i) < 0;
      });
    });
    document.querySelectorAll('[data-timestep]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-timestep') === sel.timestep)); });
    $('pk-what').textContent = SPEC.scene[sel.scene].what;
    var mine = runs[idOf(sel)].sha256, twins = ok.filter(function (i) { return i !== sel.integrator && runs[sel.scene + '-' + i + '-h' + sel.timestep].sha256 === mine; }).map(function (i) { return E.names[i]; });
    var and = function (a) { return a.length < 2 ? a[0] : a.slice(0, -1).join('; ') + ' and ' + a[a.length - 1]; };
    $('pk-same').textContent = (twins.length ? 'In this scene at this timestep, ' + and(twins) + ' wrote the same bytes as ' + E.names[sel.integrator] + ', so the verdicts are the same.' : 'No other configuration of ' + E.name + ' wrote these bytes.')
      + (ok.length < E.list.length && E.absent ? ' ' + E.absent : '');
    if (LAWS[sel.scene].indexOf(law) < 0) law = LAWS[sel.scene][0];
    $('pk-laws').innerHTML = LAWS[sel.scene].map(function (l) { return '<button type="button" class="pk-opt" data-law="' + l + '" aria-pressed="' + (l === law) + '">' + F.LAW[l] + '</button>'; }).join('');
    document.querySelectorAll('[data-law]').forEach(function (b) { b.addEventListener('click', function () { law = b.getAttribute('data-law'); marks(); if (cur) { chart(cur); verdicts(cur); cursor(); } }); });
  }
  function show() {
    var id = idOf(sel), mine = ++token;
    marks();
    document.querySelector('.pk-machine').classList.add('busy');
    $('pk-status').classList.remove('bad');
    $('pk-status').textContent = cache[id] ? '' : 'Fetching the recorded bytes and deciding them…';
    try { history.replaceState(null, '', '#' + id); } catch (err) { /* a file:// page may refuse */ }
    load(id).then(function (c) {
      if (mine !== token) return;
      cur = c; k = reduce ? c.entry.steps : 0; t0 = performance.now();
      $('pk-scrub').max = c.entry.steps;
      document.querySelector('.pk-machine').classList.remove('busy');
      chart(c); verdicts(c); status(c); frame(true);
    }).catch(function (err) {
      if (mine !== token) return;
      $('pk-status').textContent = 'Not decided: ' + err.message + '.'; $('pk-status').classList.add('bad');
    });
  }
  function frame(force) {
    if (!cur) return;
    var e = cur.entry, secs = SPEC.scene[e.scene].seconds;
    if (playing && !force) {
      var t = (performance.now() - t0) / 1000;
      if (t > secs + 0.8) { t0 = performance.now(); t = 0; }
      k = Math.min(e.steps, Math.round(t / secs * e.steps));
    }
    picture(cur, k); cursor();
    $('pk-scrub').value = k;
    $('pk-clock').textContent = 'step ' + fmt(k) + ' · ' + (k * (+e.timestep)).toFixed(3) + ' s';
    $('pk-playb').textContent = playing ? 'Pause' : 'Play';
  }
  function loop() { if (playing) frame(false); raf = requestAnimationFrame(loop); }
  $('pk-playb').addEventListener('click', function () { playing = !playing; if (playing && cur) t0 = performance.now() - k / cur.entry.steps * SPEC.scene[cur.entry.scene].seconds * 1000; frame(true); });
  $('pk-scrub').addEventListener('input', function () { playing = false; k = +$('pk-scrub').value; frame(true); });
  document.querySelectorAll('.pk-step').forEach(function (b) { b.addEventListener('click', function () { sel.scene = b.getAttribute('data-scene'); settle(); show(); }); });
  document.querySelectorAll('[data-engine]').forEach(function (b) { b.addEventListener('click', function () {
    var e = b.getAttribute('data-engine'); if (e === sel.engine) return;
    sel.engine = e; sel.integrator = ENG[e].first; settle(); show();
  }); });
  document.querySelectorAll('[data-integrator]').forEach(function (b) { b.addEventListener('click', function () { if (b.disabled) return; sel.integrator = b.getAttribute('data-integrator'); show(); }); });
  document.querySelectorAll('[data-timestep]').forEach(function (b) { b.addEventListener('click', function () { sel.timestep = b.getAttribute('data-timestep'); show(); }); });
  function fromHash() {
    var m = /^#(fall|pendulum|top)-([a-z0-9-]+)-h([0-9.]+)$/.exec(location.hash), r = m && runs[m[1] + '-' + m[2] + '-h' + m[3]];
    if (r) { sel = { engine: r.engine, scene: m[1], integrator: m[2], timestep: m[3] }; return true; }
    return false;
  }
  window.addEventListener('hashchange', function () { if (fromHash() && (!cur || cur.entry.id !== idOf(sel))) show(); });
  fromHash(); show(); loop();
  window.__pk = { spec: SPEC, cache: cache, state: function () { return { sel: sel, law: law, k: k, id: cur && cur.entry.id }; } };
})();
