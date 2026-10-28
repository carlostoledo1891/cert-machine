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
const { embedArt } = require(path.join(PG, 'design', 'components.js'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments/wiring/eval/rewire.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/instrument.css'), 'utf8');
const W = require(path.join(PG, 'warrant.js'));

/* WARRANT v2 (2026-10-28). Two standings on this page, and the graph already draws them: a wire out of a node that
   emits a deciding kind is solid, a wire out of a float grader dashed (instruments/cert-unit/render.mjs inkOf, the
   grammar's CLAIM pattern). The numbers now say the same thing. A count of a float grader's verdicts is exact
   arithmetic on a column of float decisions, and a mark's standing is the weakest on its path, so the tolerance
   grader's 17, the careful float's 12 and Python's 5 are COMPUTED and underlined dashed, here and in the live
   readout; only the exact predicate's count is DECIDED. The careful float is the case the grammar exists for: it
   agrees with the exact predicate on every instance and is still dashed — agreement is its verdict, the dash is
   what the number stands on. Nothing is red: the five instances the tolerance grader admits wrongly are a count
   on this page, never drawn one by one, and a count is not an exhibited object.

   The panel's sentences are universal claims about the record, so they are gated here: if rewire.json moves and
   one of them would be false, there is no page. */
const I = D.instances, over = (i) => i.n > D.cliff;
const tally = (k) => I.filter((i) => i[k] === 'ADMISSIBLE').length;
if (!I.every((i) => i.overflows === over(i))) throw new Error('rewire: the overflow flags do not sit exactly past the cliff');
if (tally('exact') !== D.exactAdmits || tally('naiveJS') !== D.naiveJSAdmits || tally('careful') !== D.carefulAdmits || tally('naive') !== D.naiveAdmits)
  throw new Error('rewire: the record\'s totals disagree with its own instances');
if (!I.every((i) => i.careful === i.exact)) throw new Error('rewire: the careful float no longer agrees with the exact predicate on every instance');
if (!I.filter(over).every((i) => i.naiveJS === 'ADMISSIBLE' && i.naive === 'OVERFLOW')) throw new Error('rewire: past the cliff, JS no longer admits every claim or Python no longer refuses every one');
if (!I.filter((i) => !over(i)).every((i) => i.naiveJS === i.exact && i.naive === i.exact)) throw new Error('rewire: below the cliff a naive grader disagrees with the exact predicate; the cliff is not the whole story');
const falseAdmit = (k) => I.filter((i) => i[k] === 'ADMISSIBLE' && i.exact !== 'ADMISSIBLE').length;
const falseRefuse = (k) => I.filter((i) => i[k] !== 'ADMISSIBLE' && i.exact === 'ADMISSIBLE').length;
if (!(falseAdmit('naiveJS') > 0 && falseRefuse('naiveJS') === 0 && falseRefuse('naive') > 0 && falseAdmit('naive') === 0))
  throw new Error('rewire: the two naive graders are no longer wrong in opposite directions');
const C = (t) => W.value(String(t), W.COMPUTED);
const LEGEND = W.legendHtml({ exclude: [W.REFUSED, W.CHOSEN], compact: true });

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

/* WARRANT v2: what came through a float grader is COMPUTED, whatever it agrees with */
const STAND = { exact: '', tol: ' w-val w-computed', careful: ' w-val w-computed' };
const mark = (el, src) => { el.className = 'v' + (src ? STAND[src] : ''); if (src && STAND[src]) el.title = D.computedGloss; else el.removeAttribute('title'); };
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
  mark($('rV'), v); mark($('rR'), r); mark($('rDelta'), shown && shown !== 'exact' ? shown : null);
  const fired = new Map();
  if (v) fired.set(v, v === 'exact' ? 'certified' : 'verdict');
  return fired;
}

/* PHONES (2026-10-28). Below 820 px the panel opened over the page and left the stage min(330px, 88vw) short: 60 px
   wide at 390, the whole graph drawn there at 7% scale. As on /instruments/navier-stokes, the panel starts hidden
   on a narrow screen (the controls button opens it), and the graph drops the 300-unit offset that keeps it clear of
   the title on a desk, so its own width fills the phone's. */
const NARROW = window.innerWidth < 820;
if (NARROW) document.body.classList.add('panel-hidden');
let view, keep = null;
function draw(msg, bad) {
  view = mount($('stage'), g, {
    fired: readout, minSpan: NARROW ? 0 : 860, offsetX: NARROW ? 0 : 300, positions: keep,
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
  <h1 class="mt3 ti">Rewire it yourself</h1>
  <p class="ti">${D.instances.length} lattice claims, each with an exact answer. Three graders are offered and only one may reach the verdict socket. Drag a different one and watch the number move &mdash; or find out why it is refused.</p>
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
      <b>tolerance grader</b> admits ${C(D.naiveJSAdmits)}. It converts the determinant to a double first, and past dimension ${D.cliff} that is <span class="mono">Infinity</span> &mdash; so the Gaussian heuristic is infinite and every claim clears it.<br><br>
      <b>careful float</b> admits ${C(D.carefulAdmits)}. Log domain, never converts the determinant, and it agrees with the exact predicate on every one of these. <b>Precision was never the vulnerability here.</b> Its ${C(D.carefulAdmits)} is underlined dashed all the same: it is right on all ${D.instances.length}, and nothing decided that. Agreement is its verdict; the dash is what the number stands on, as the dashed wire out of it is.
    </div>
    ${LEGEND}
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <span class="eyebrow">the same bug, two languages</span>
    <div class="note-sm">In JavaScript <span class="mono">Number(q)</span> is <span class="mono">Infinity</span> and the grader admits everything. In Python <span class="mono">float(q)</span> <em>raises</em>, and the same grader admits ${C(D.naiveAdmits)} instead &mdash; it refuses everything above the cliff. Both are wrong, in opposite directions, and only the crash gets noticed.</div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <div class="note-sm">The graph runtime, the port types and this editor are <a href="../lattice-claims/index.html">the same source the tests run</a>, inlined rather than re-implemented.</div>
  </div>
</aside>

<script id="rw-data" type="application/json">${JSON.stringify(Object.assign({}, D, { computedGloss: W.GLOSS[W.COMPUTED] })).replace(/</g, '\\u003c')}</script>
<script>${bundle()}</script>
<script>(function(){ 'use strict';
${PRELUDE}
${APP}
})();</script>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'rewire');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    /* A VIEWPORT, NOT A DOCUMENT (2026-09-15): html and body are height:100%
       with overflow hidden, so a document footer renders in the flow BEHIND the
       overlays — measured at top=108px on this page, its links showing through
       the title. The closing line lives inside the viewport (.ov-foot / the
       panel). Same ruling as /instruments/navier-stokes. */
    foot: null,
    title: 'Rewire it yourself — cert-machine',
    desc: 'Twenty-four lattice claims with exact answers, three graders, and one socket that only an exact one may reach. Drag a different certifier and watch the admitted count move.',
    path: '/instruments/rewire/',
    css: `${CSS}
/* the site nav floats over a full-viewport instrument, as on /instruments/interferometer */
.topnav { background: linear-gradient(var(--bg), rgba(10,10,12,0)); border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; }
body { padding-top: 0; }
/* the stage stops where the panel starts, or the last node in the graph sits
   underneath it */
/* width:auto is load-bearing: instrument.css sets #stage{width:100%}, and a
   percentage width beats the right inset, so the canvas ran under the panel */
#stage{position:absolute;top:0;bottom:0;left:0;right:min(330px,88vw);width:auto;height:auto;transition:right var(--dur-med) var(--ease-out);}
body.panel-hidden #stage{right:0;}
/* THE PANEL HIDES WITHOUT LEAVING THE PAGE (2026-10-28, as on /instruments/navier-stokes). It now starts hidden on a
   phone, and instrument.css slides it out with translateX(100%): a translated box outside the viewport widens <main>
   (the ruler read 720 px of scroll width in a 390 px main). So it fades out where it stands instead. */
body.panel-hidden .panel{transform:none;opacity:0;visibility:hidden;pointer-events:none;}
/* on a phone the controls button sits at the foot's right edge: the source line keeps clear of it; an opened panel
   covers the graph rather than squeezing it into the strip beside it, and its button stays on the screen */
@media (max-width: 760px) {
  .ov-foot .src{padding-right:var(--s-10);}
  #stage{right:0;}
  body:not(.panel-hidden) .pt{right:auto;left:var(--s-2);margin-right:0;}
}
#stage svg{width:100%;height:100%;}
.cap.bad{color:var(--ink);}
.note-sm b{color:var(--ink-2);font-weight:500;}`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, instances: D.instances.length, exact: D.exactAdmits, tol: D.naiveJSAdmits, careful: D.carefulAdmits, cliff: D.cliff };
}

function cardArt() { return embedArt(fs.readFileSync(path.join(HERE, 'out', 'graph.svg'), 'utf8')); }

module.exports = { build, cardArt, facts: { instances: D.instances.length, cliff: D.cliff, exact: D.exactAdmits, tol: D.naiveJSAdmits, careful: D.carefulAdmits } };
