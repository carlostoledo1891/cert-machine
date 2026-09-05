/* app.js — the browser half. The page is complete without it: the builder drew
   the graph server-side and the refusal is printed in the prose. This makes the
   graph a thing you can pull on, and the ONLY thing it adds is that the engine
   answers you itself.

   IT IMPLEMENTS NO VALIDITY RULE. Every attempted wire goes to graph.wire()
   inside a try, and whatever came back is what the page shows — verbatim, not
   paraphrased. That is the property editor.test.mjs checks over in
   instruments/cert-unit: the UI cannot disagree with the engine about what is
   legal, because it does not have an opinion. */
(function () {
  'use strict';
  var CU = window.CERTUNIT;
  var host = document.getElementById('ug-host');
  var node = document.getElementById('ug-spec');
  if (!CU || !host || !node) return;              /* the static page stands on its own */

  var S = JSON.parse(node.textContent);
  var say = document.getElementById('ug-say');
  var positions = null;

  function build() {
    var g = CU.graph('one certified cell');
    S.nodes.forEach(function (n) { g.add(CU.node(n)); });
    S.wires.forEach(function (w) { g.wire(w[0], w[1], w[2], w[3]); });
    return g;
  }

  var g = build();

  function report(msg, refused) {
    if (!say) return;
    say.textContent = msg;
    say.className = 'ug-say' + (refused ? ' refused' : ' ok');
  }

  function draw() {
    host.textContent = '';
    /* mount returns { svg, pos, repaint, graph }; pos is what a redraw needs so
       the reader's dragging is not undone every time the engine speaks */
    var m = CU.mount(host, g, {
      positions: positions,
      /* mount calls onChange(msg, bad) — the engine's own message and whether
         it was a refusal. The page repeats it and adds nothing. */
      onChange: function (msg, bad) { if (msg) report(msg, !!bad); },
    });
    positions = (m && m.pos) || positions;
  }

  draw();

  var btn = document.getElementById('ug-try');
  if (btn) {
    btn.addEventListener('click', function () {
      var f = S.forbidden;
      try {
        g.wire(f[0], f[1], f[2], f[3]);
        report('it built. That is a bug in the engine, not a feature of the page.', false);
      } catch (e) {
        report(e.message, true);                  /* the engine's words, not mine */
      }
      draw();
    });
  }

  var reset = document.getElementById('ug-reset');
  if (reset) reset.addEventListener('click', function () {
    g = build(); positions = null; report('back to the wiring that builds.', false); draw();
  });

  /* THE #hash DEV HOOK — design/CONTRACT.md.  #set=try:1  fires the refusal on
     load, so a screenshot can show the state a reader has to click to reach. */
  function applyHash() {
    var raw = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (/(?:^|[&;])set=([^&;]*)/.test(raw) && /try:1/.test(raw) && btn) btn.click();
  }
  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
