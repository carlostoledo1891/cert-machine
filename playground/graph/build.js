/* build.js — site/instruments/graph/index.html.
   playground/graph/ · cert-machine · 2026-09-05

   THE PIPELINE COMPUTES; THIS ONLY READS. Every number and both figures come
   out of playground/graph/out/, which make-figures.mjs writes by running the
   engine — including the refusal message, which is captured from the exception
   the engine actually raises rather than typed here. If the forbidden wire ever
   BUILDS, make-figures throws and there is no page.

   NO FICTION ON /instruments. Nothing here is gated, and this page does not
   pretend otherwise: the numbers below are a re-derivation of a record this
   repository already holds, and the page says which file it came from. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const { bundle } = require(path.join(HERE, 'bundle.js'));

const OUT = path.join(HERE, 'out');
const read = (f) => fs.readFileSync(path.join(OUT, f), 'utf8');
const F = JSON.parse(read('facts.json'));
const LEGAL = read('legal.svg');
const SPEC = read('spec.json').trim();
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');

if (F.disagreed !== 0) throw new Error('graph: the replay disagreed — refusing to build a page on it');
if (!F.refusal) throw new Error('graph: no refusal captured — refusing to build a page on it');

const firstLine = F.refusal.split('\n')[0];

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments &middot; graph &middot; ${F.reDerivedIdentically} cells re-derived at build time</div>
  <h1>The rule is a wire you cannot draw.</h1>
  <p class="lede">Every verifier has rules about what may decide what, and they are
  almost always prose in a README. Here two of them are <b>conditions on a
  connection</b>: a value that came from floating point has no wire into a port
  that decides, and a hypothesis stamp may not meet a different one. Break either
  and nothing scores badly &mdash; <b>it does not build</b>, and what you get back
  is the sentence the engine raised.</p>
</div></header>

<section class="wrap">
  <h2>One certified cell, wired</h2>
  <p>This is a real cell of TERRA's certified sigma-band, drawn as the graph that
  decides it. The band hands three exact intervals to the radii polynomial; the
  polynomial is the only thing here that may conclude anything, and its three
  verdict ports are drawn whether or not they fire. <b>That is the point of
  drawing them:</b> a one-sided method that can certify and refuse but never
  refute has a dark port, and the picture says so instead of the caption.</p>
  <figure class="fig">${LEGAL}
    <figcaption>Solid means the source emits a deciding kind; dashed means it
    emits floats. The ink is read off the port type, never chosen &mdash; see
    <span class="mono">design/CONTRACT.md</span> in the repository.</figcaption>
  </figure>
</section>

<section class="wrap">
  <h2>Now try to break it</h2>
  <p>Drag from the float screen's output to any input on the radii polynomial.
  The editor implements no validity rule of its own: it calls the same
  <span class="mono">wire()</span> the pipeline calls, inside a try, and shows
  you whatever came back. It cannot disagree with the engine, because it has no
  opinion.</p>
  <div class="ug-wrap">
    <div id="ug-host" class="ug-host"></div>
    <div class="ug-bar">
      <button id="ug-try" class="ug-btn" type="button">draw the forbidden wire</button>
      <button id="ug-reset" class="ug-btn" type="button">reset</button>
      <span id="ug-say" class="ug-say">drag a port to a port.</span>
    </div>
  </div>
  <p class="note">With scripting off this page still says everything it claims;
  the refusal below is captured at build time from the exception the engine
  raises, not written by hand:</p>
  <pre class="code refusal">${esc(F.refusal)}</pre>
</section>

<section class="wrap">
  <h2>Why the runtime is worth trusting</h2>
  <p>The graph is not a diagram of the arithmetic &mdash; it <em>is</em> the
  arithmetic's wiring, and it was checked against work this repository already
  holds. <span class="mono">replay.mjs</span> pushes every certified cell of the
  sigma-band back through the radii node, so the certificate re-derives itself
  instead of being quoted.</p>
  <div class="stats" data-n="4">
    <div class="stat"><div class="k">cells re-derived identically</div><div class="v">${F.reDerivedIdentically} of ${F.cellsCertified}</div>
      <div class="g">every certified cell on disk, pushed back through the graph</div></div>
    <div class="stat"><div class="k">worst relative difference</div><div class="v">${esc(F.worstRelativeDifference)}</div>
      <div class="g">not &ldquo;within tolerance&rdquo; &mdash; identical</div></div>
    <div class="stat"><div class="k">disagreed</div><div class="v">${F.disagreed}</div>
      <div class="g">disagreement is the headline; a pass rate says nothing</div></div>
    <div class="stat"><div class="k">verdict ports, always drawn</div><div class="v">${F.ports.length}</div>
      <div class="g">certified &middot; refuted &middot; refused &mdash; abstention as topology</div></div>
  </div>
  <p class="note">Ported from frontier-apps and pinned by sha256 in
  <span class="mono">corpus/frontier-port.json</span>. The same two rules exist a
  second time, in Python, as a grader where a model answers with a wiring and
  building the graph <em>is</em> the grading &mdash;
  <span class="mono">instruments/wiring/</span>. A cross-check requires both
  engines to refuse the same wiring in the same words.</p>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'graph');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'The rule is a wire you cannot draw — cert-machine',
    desc: 'Two verification rules as conditions on a connection: a float has no wire into a port that decides. '
      + F.reDerivedIdentically + ' certified cells re-derived through the graph, worst relative difference '
      + F.worstRelativeDifference + '.',
    root: '../', here: 'instruments',
    head: `<style>${CSS}</style>`,
    body,
    script: `<script id="ug-spec" type="application/json">${SPEC.replace(/</g, '\\u003c')}</script>\n`
      + `<script>${bundle()}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length };
}

function cardArt() { return LEGAL; }

module.exports = { build, cardArt, facts: F };
