/* build.js — site/instruments/rewire/index.html.
   playground/rewire/ · cert-machine · 2026-09-05

   PORTED from frontier-apps tools/build-rewire.js (session 17) under the house
   shell: body, panel and app kept as they were; the four cert-unit modules
   arrive through playground/graph/bundle.js as ONE classic script instead of a
   module script, because this site is reviewed from disk and Chrome refuses
   ESM imports over file:// (design/CONTRACT.md). The graph is the page: a
   reader rewires the certifier and the number changes in front of them.

   THE BUILDER ONLY READS: instruments/wiring/eval/rewire.json is the pinned
   record of 24 minted instances across the overflow cliff. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const { bundle } = require(path.join(PG, 'graph', 'bundle.js'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments/wiring/eval/rewire.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/instrument.css'), 'utf8');
const pct = (a, b) => `${Math.round(100 * a / b)}%`;

/* the runtime the bundle exposes, in the names the app was written against */
const PRELUDE = `var CU = window.CERTUNIT; var graph = CU.graph, node = CU.node, mount = CU.mount, GEOM = CU.GEOM,
  FLOAT = CU.FLOAT, INTERVAL = CU.INTERVAL, RATIONAL = CU.RATIONAL;
`;

const APP = `
const D = JSON.parse(document.getElementById('rw-data').textContent);
const $ = (id) => document.getElementById(id);

const g = graph('does this certifier deserve the verdict port?');
g.add(node({ id: 'src', title: 'instances', inputs: ['seed'], outputs: ['q', 'norm'],
  emits: INTERVAL, run: () => ({ port: 'q', value: null }) }));
g.add(node({ id: 'exact', title: 'exact predicate', instrument: true, inputs: ['q', 'norm'],
  deciding: ['q', 'norm'], emits: RATIONAL, run: () => ({ port: 'certified', value: null }) }));
g.add(node({ id: 'tol', title: 'tolerance grader', inputs: ['q', 'norm'], outputs: ['verdict'],
  deciding: [], emits: FLOAT, run: () => ({ port: 'verdict', value: null }) }));
g.add(node({ id: 'careful', title: 'careful float', inputs: ['q', 'norm'], outputs: ['verdict'],
  deciding: [], emits: FLOAT, run: () => ({ port: 'verdict', value: null }) }));
g.add(node({ id: 'tally', title: 'admitted', inputs: ['verdict', 'report'], outputs: ['count'],
  deciding: ['verdict'], emits: RATIONAL, run: () => ({ port: 'count', value: null }) }));
g.wire('src', 'q', 'exact', 'q'); g.wire('src', 'norm', 'exact', 'norm');
g.wire('src', 'q', 'tol', 'q');   g.wire('src', 'norm', 'tol', 'norm');
g.wire('src', 'q', 'careful', 'q'); g.wire('src', 'norm', 'careful', 'norm');
g.wire('exact', 'certified', 'tally', 'verdict');

/* the tally reads the wiring; nothing is precomputed for a particular answer */
const KEY = { exact: 'exact', tol: 'naiveJS', careful: 'careful' };
const admits = (k) => D.instances.filter((i) => i[KEY[k]] === 'ADMISSIBLE').length;
/* THE LAST WIRE IN, not the first (cert-machine, 2026-09-05). The report socket
   only reports, so the engine lets a second grader be wired onto it; the
   readout then showed the FIRST grader's count under a caption naming the
   second. Found by dragging: tol -> report read 17, careful -> report still
   read 17. The number now follows the caption. */
const sourceInto = (port) => {
  const ws = g.wires.filter((x) => x.toId === 'tally' && x.toPort === port);
  return ws.length ? ws[ws.length - 1].fromId : null;
};

function readout() {
  const v = sourceInto('verdict'), r = sourceInto('report');
  const N = D.instances.length;
  const base = admits('exact');
  $('rV').textContent = v ? \`\${admits(v)} of \${N}\` : 'nothing wired';
  $('rR').textContent = r ? \`\${admits(r)} of \${N}\` : 'nothing wired';
  const shown = r || v;
  $('rDelta').textContent = shown && shown !== 'exact'
    ? \`\${admits(shown) - base > 0 ? '+' : ''}\${admits(shown) - base} against the exact predicate\`
    : (v === 'exact' ? 'this is the exact answer' : '—');
  $('rWho').textContent = v ? ({ exact: 'exact predicate', careful: 'careful float', tol: 'tolerance grader' })[v] : '—';
  const fired = new Map();
  if (v) fired.set(v, v === 'exact' ? 'certified' : 'verdict');
  return fired;
}

let view, keep = null;
function draw(msg, bad) {
  view = mount($('stage'), g, {
    fired: readout, minSpan: 860, offsetX: 300, positions: keep,
    /* a status message must NOT re-mount: doing so replaces the element the
       pointer is captured on and the drag dies on its first move. */
    onChange: (m, b) => { note(m, b); readout(); view.repaint(); },
  });
  keep = view.pos;                 // a redraw must not undo a reader's drag
  readout();
  if (msg !== undefined) note(msg, bad);
}
function note(m, bad) {
  const el = $('rCap');
  el.textContent = m || 'Drag from a grader\\u2019s output onto a socket on “admitted”. The square sockets decide; the round one only reports.';
  el.className = 'cap' + (bad ? ' bad' : '');
}
draw();

$('reset').onclick = () => {
  g.wires = g.wires.filter((w) => w.toId !== 'tally');
  try { g.wire('exact', 'certified', 'tally', 'verdict'); } catch (e) {}
  draw('', false);
};
$('cut').onclick = () => { g.wires = g.wires.filter((w) => w.toId !== 'tally'); draw('every verdict wire cut — wire one yourself', false); };
$('panelToggle').onclick = () => { document.body.classList.toggle('panel-hidden'); };

/* #sim=from.port>to.port drives a real pointer drag, so the path under test is
   the path a reader uses. ON hashchange TOO (cert-machine, 2026-09-05): a
   navigation from the page to the same page with a hash is a same-document
   navigation, so a hook that only runs at load looks dead to any driver that
   opened the page first — which is how it was first reported dead here. */
function applySim() { if (location.hash.startsWith('#sim=')) try {
  const [a, b] = decodeURIComponent(location.hash.slice(5)).split('>');
  const [fn, fp] = a.split('.'), [tn, tp] = b.split('.');
  const at = (id, port, side) => {
    const box = view.pos.get(id), n = g.nodes.get(id);
    const list = side === 'out' ? n.outputs : n.inputs;
    const pt = view.svg.createSVGPoint();
    pt.x = side === 'out' ? box.x + box.w : box.x;
    pt.y = box.y + GEOM.HEAD + 7 + list.indexOf(port) * GEOM.ROW;
    const q2 = pt.matrixTransform(view.svg.getScreenCTM());
    return { x: q2.x, y: q2.y };
  };
  const P = at(fn, fp, 'out'), Q = at(tn, tp, 'in');
  view.svg.setPointerCapture = () => {};
  const ev = (t, p) => view.svg.dispatchEvent(new PointerEvent(t, {
    clientX: p.x, clientY: p.y, bubbles: true, pointerId: 1, isPrimary: true }));
  ev('pointerdown', P); ev('pointermove', Q); ev('pointerup', Q);
} catch (e) { note('SIM ERROR: ' + e.message, true); } }
window.addEventListener('hashchange', applySim);
applySim();
`;

const body = `
<div class="ov ov-title">
  <div class="eyebrow">environment &middot; the certifier is a wire</div>
  <h1 style="margin-top:var(--s-3); max-width:14ch;">Rewire it yourself</h1>
  <p style="max-width:36ch;">${D.instances.length} lattice claims, each with an exact answer. Three graders are offered and only one may reach the verdict socket. Drag a different one and watch the number move &mdash; or find out why it is refused.</p>
</div>

<div id="stage"></div>

<div class="ov ov-foot">
  <div class="rd">
    <span class="item"><span class="k">wired to verdict</span><span class="v" id="rWho">—</span></span>
    <span class="item"><span class="k">admitted</span><span class="v" id="rV">—</span></span>
    <span class="item"><span class="k">reported only</span><span class="v" id="rR">—</span></span>
    <span class="item"><span class="k">difference</span><span class="v" id="rDelta">—</span></span>
  </div>
  <div class="cap" id="rCap">&nbsp;</div>
  <div class="src">${D.instances.length} instances, dimensions ${D.dims.join(', ')} &middot; the determinant overflows a double past dimension ${D.cliff}</div>
</div>

<button class="pt" id="panelToggle">controls</button>

<aside class="panel">
  <div class="grp">
    <span class="eyebrow">the wiring</span>
    <div class="row-btns">
      <button id="cut">cut the verdict wire</button>
      <button id="reset">restore the exact one</button>
    </div>
    <div class="note-sm">Square sockets are <b>deciding</b>: a value that came from floating point may not enter one. Round sockets only report. The rule is not in this page &mdash; it is in the engine, and the page shows whatever the engine says.</div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <span class="eyebrow">what the numbers are</span>
    <div class="note-sm">
      <b>exact predicate</b> admits ${D.exactAdmits} of ${D.instances.length}. Integers and a certified &pi; bracket; no floating point anywhere.<br><br>
      <b>tolerance grader</b> admits ${D.naiveJSAdmits}. It converts the determinant to a double first, and past dimension ${D.cliff} that is <span class="mono">Infinity</span> &mdash; so the Gaussian heuristic is infinite and every claim clears it.<br><br>
      <b>careful float</b> admits ${D.carefulAdmits}. Log domain, never converts the determinant, and it agrees with the exact predicate on every one of these. <b>Precision was never the vulnerability here.</b>
    </div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <span class="eyebrow">the same bug, two languages</span>
    <div class="note-sm">In JavaScript <span class="mono">Number(q)</span> is <span class="mono">Infinity</span> and the grader admits everything. In Python <span class="mono">float(q)</span> <em>raises</em>, and the same grader admits ${D.naiveAdmits} instead &mdash; it refuses everything above the cliff. Both are wrong, in opposite directions, and only the crash gets noticed.</div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <div class="note-sm">The graph runtime, the port types and this editor are <a href="../lattice-claims/index.html">the same source the tests run</a>, inlined rather than re-implemented.</div>
  </div>
</aside>

<script id="rw-data" type="application/json">${JSON.stringify(D).replace(/</g, '\\u003c')}</script>
<script>${bundle()}</script>
<script>(function(){ 'use strict';
${PRELUDE}
${APP}
})();</script>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'rewire');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'Rewire it yourself — cert-machine',
    desc: 'Twenty-four lattice claims with exact answers, three graders, and one socket that only an exact one may reach. Drag a different certifier and watch the admitted count move.',
    root: '../', here: 'instruments',
    head: `<style>${CSS}
/* the site nav floats over a full-viewport instrument, as on /instruments/interferometer */
.topnav { background: linear-gradient(var(--bg), rgba(10,10,12,0)); border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; }
body { padding-top: 0; }
/* the stage stops where the panel starts, or the last node in the graph sits
   underneath it */
/* width:auto is load-bearing: instrument.css sets #stage{width:100%}, and a
   percentage width beats the right inset, so the canvas ran under the panel */
#stage{position:absolute;top:0;bottom:0;left:0;right:min(330px,88vw);width:auto;height:auto;transition:right var(--dur-med) var(--ease-out);}
body.panel-hidden #stage{right:0;}
#stage svg{width:100%;height:100%;}
.cap.bad{color:var(--ink);}
.note-sm b{color:var(--ink-2);font-weight:500;}</style>`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, instances: D.instances.length, exact: D.exactAdmits, tol: D.naiveJSAdmits, careful: D.carefulAdmits, cliff: D.cliff };
}

function cardArt() { return fs.readFileSync(path.join(HERE, 'out', 'graph.svg'), 'utf8'); }

module.exports = { build, cardArt, facts: { instances: D.instances.length, cliff: D.cliff, exact: D.exactAdmits, tol: D.naiveJSAdmits, careful: D.carefulAdmits } };
