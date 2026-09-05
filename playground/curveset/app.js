/* app.js — the dial, and nothing else.

   The page is complete without this file: the server rendered the plots, the
   readouts and the table, and a reader with no JavaScript sees the widest true
   answer and the whole table underneath it. This only moves the dial.

   It redraws with plot.js — the same function that rendered the page on disk —
   so there is no second opinion about where the envelope goes.
*/
(function () {
  'use strict';
  var node = document.getElementById('curveset-data');
  if (!node) return;
  var P = JSON.parse(node.textContent);
  var PLOT, E;
  try { PLOT = require('./plot.js'); E = require('./envelope.js'); }
  catch (err) { return; }                      /* the static page stands on its own */

  var byId = {};
  P.sets.forEach(function (s) { byId[s.id] = s; });

  function fmt(v) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    return Math.abs(v) >= 1e4 ? Math.round(v).toLocaleString('en-US') : Number(v).toPrecision(4);
  }
  function label(g) {
    return g.kind === 'monotone' ? 'monotone only'
      : g.kind === 'interpolate' ? 'join the dots'
        : 'wander ≤ ±' + (100 * g.tol).toFixed(0) + '%';
  }

  function render(id, i) {
    var s = byId[id], g = s.rungs[i];
    var fig = document.querySelector('[data-plot="' + id + '"]');
    var lad = document.querySelector('[data-ladder="' + id + '"]');
    if (fig) fig.innerHTML = PLOT.calibrationPlot(E, s, i);
    if (lad) lad.innerHTML = PLOT.ladderPlot(s, i);
    var st = document.querySelector('[data-state="' + id + '"]');
    if (st) st.textContent = label(g);
    var out = document.querySelector('[data-out="' + id + '"]');
    if (out) out.textContent = (g.r && g.r.bounded) ? fmt(g.r.lo) + ' – ' + fmt(g.r.hi) : 'unbounded';
    var rat = document.querySelector('[data-ratio="' + id + '"]');
    if (rat) {
      var v = (g.r && g.r.bounded) ? g.r.width / (2 * s.reported.uFit) : null;
      rat.textContent = v === null ? '∞' : (v >= 10 ? v.toFixed(0) : v.toFixed(1)) + '×';
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-dial]'), function (el) {
    el.addEventListener('input', function () { render(el.getAttribute('data-dial'), +el.value); });
  });

  /* THE #hash DEV HOOK — see design/CONTRACT.md. A screenshot only ever sees
     the state a page loads in, and every dial here loads at the same end of its
     range, so the interesting half of this instrument is unreachable to a
     reviewer with a camera.

         #set=dial:4            every dial to step 4
         #set=<data-dial>:4     one dial by name

     It moves the real input and dispatches the real event, so it exercises the
     listener above rather than a parallel path. Decoded first: location.hash
     keeps URL encoding. */
  function applyHash() {
    var raw = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var m = /(?:^|[&;])set=([^&;]*)/.exec(raw);
    if (!m) return;
    m[1].split(',').forEach(function (pair) {
      var kv = pair.split(':'), k = kv[0], v = Number(kv[1]);
      if (!k || kv[1] === undefined || isNaN(v)) return;
      var sel = k === 'dial' ? '[data-dial]' : '[data-dial="' + k + '"]';
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }
  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
