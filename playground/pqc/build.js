/* build.js — site/instruments/pqc/index.html.
   playground/pqc/ · cert-machine · 2026-09-05

   PORTED from frontier-apps tools/build-pqc.js under the house shell: body,
   panel and app (pqc-app.js beside this file, pinned) kept as they were; the
   page() call and the requires rewritten; instrument.css inlined from
   design/frontier-ref/. THE BUILDER ONLY READS: the three records come from
   instruments/pqc/out/, pinned there and re-derived by its battery.

   THE CHARTER TRAVELS WITH THE PAGE: instruments/pqc/CHARTER.md — audit only,
   never design a primitive. The page says so in its own panel. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const EXP = path.join(ROOT, 'instruments', 'pqc');
const rd = f => JSON.parse(fs.readFileSync(path.join(EXP, 'out', f), 'utf8'));
const R = rd('reduce-40.json'), HOF = rd('hof.json'), AUD = rd('audit.json');
const APP = fs.readFileSync(path.join(HERE, 'pqc-app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/instrument.css'), 'utf8');

const slim = HOF.map(r => ({ n: r.n, ratio: r.ratio, norm: r.norm, seed: r.seed }));
const aud = AUD.map(a => ({ n: a.n, seed: a.seed, norm: a.norm, ratio: a.ratio, window: a.window, vN: a.vN, vHi: a.vHi }));
const D = { reduce: R, hof: slim, audit: aud };
const open = AUD.filter(a => a.vN === 'ADMISSIBLE' && a.vHi !== 'ADMISSIBLE');

const body = `
<canvas id="stage"></canvas>

<div class="ov ov-title">
  <div class="eyebrow">post-quantum cryptography · the geometry underneath</div>
  <h1 style="margin-top:var(--s-3); max-width:13ch;">Proved, or assumed</h1>
  <p style="max-width:34ch;">Lattice security rests on how short a vector you can find. The searching is heuristic and always will be; the claims about what was found do not have to be. Solid here was decided in exact integers. Dashed was asserted.</p>
</div>

<div class="ov ov-foot">
  <div class="rd">
    <span class="item"><span class="k" id="kA">progress</span><span class="v" id="rA">—</span></span>
    <span class="item"><span class="k">shortest ‖v‖</span><span class="v" id="rB">—</span></span>
    <span class="item"><span class="k">decided</span><span class="v" id="rC">—</span></span>
    <span class="item"><span class="k">lattice</span><span class="v" id="rD">—</span></span>
  </div>
  <div class="cap" id="rCap">&nbsp;</div>
  <div class="src">SVP Challenge, TU Darmstadt · determinants proved entry by entry · π bracketed by Machin · no floating point in any claim</div>
</div>

<button class="pt" id="panelToggle">controls</button>

<aside class="panel">
  <div class="grp">
    <span class="eyebrow">view</span>
    <div class="row-btns">
      <button data-view="reduce">the reduction</button>
      <button data-view="wall">the wall</button>
    </div>
  </div>
  <hr class="hr-thin">

  <div id="reduceOnly">
    <div class="grp">
      <span class="eyebrow">run it</span>
      <div class="row-btns"><button id="playBtn">play</button></div>
      <div class="ctrl" style="margin-top:var(--s-3);"><label for="cT">step</label><output id="cTOut"></output><input type="range" id="cT" min="0" max="1" step="1"></div>
      <div class="note-sm">LLL on the real dimension-${R.dim} challenge basis, ${R.steps.toLocaleString()} steps and ${R.swaps.toLocaleString()} swaps in ${(R.ms / 1000).toFixed(1)} s. Every quantity is an integer: floating-point Gram&ndash;Schmidt does not survive a 121-digit modulus sitting beside unit entries, so there is none here. The lattice is checked unchanged at the end &mdash; det² = q², exactly.</div>
    </div>
    <hr class="hr-thin">
    <div class="grp">
      <span class="eyebrow">marks</span>
      <div class="row-btns">
        <button data-flag="gsa">the heuristic</button>
        <button data-flag="ghost">where it started</button>
      </div>
      <div class="note-sm">The geometric series assumption says a reduced profile is a straight line with root-Hermite factor ${R.d0}. It is an empirical claim about random lattices, asserted everywhere and proved nowhere, so it is drawn dashed. Against this basis it misses the measured profile by 0.15 decades and misses worst at the ends.</div>
    </div>
  </div>

  <div id="wallOnly">
    <div class="grp">
      <span class="eyebrow">marks</span>
      <div class="row-btns">
        <button data-flag="wall">the wall</button>
        <button data-flag="decided">decided exactly</button>
      </div>
      <div class="note-sm">${HOF.length} published records. Each prints ‖v‖/GH to six figures as a float with no error bound, and none exceeds 1.04985 &mdash; so 1.05 is a hard wall and the table is pressed against it.</div>
    </div>
    <hr class="hr-thin">
    <div class="grp">
      <span class="eyebrow">what was checked</span>
      <div class="note-sm">${AUD.length} records decided in exact rational arithmetic against ${new Set(AUD.map(a => a.n + ':' + a.seed)).size} determinants, dimensions ${Math.min(...AUD.map(a => a.n))}&ndash;${Math.max(...AUD.map(a => a.n))}. <b>All ${AUD.length} published ratios are consistent; none is wrong.</b><br><br>The bar on a decided record is every ratio consistent with a true norm that prints as the integer printed. Comparing against the ratio at the rounded norm instead &mdash; the obvious thing to do &mdash; reports 32 of 37 as disagreeing, and that is an artefact of the rounding rather than a finding. Half a unit of norm is worth 1.7&times;10⁻⁴ here, which is the size of every apparent discrepancy.</div>
    </div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <div class="note-sm"><b>The one open row.</b> ${open.length ? `Dimension ${open[0].n}, seed ${open[0].seed}, norm ${open[0].norm}: admissible if the norm is exactly ${open[0].norm}, refused if it is half a unit more. Its window straddles the wall, so it cannot be decided from what is published &mdash; it needs the vector, and the vectors are not published.` : '—'}</div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <div class="note-sm">This folder audits. It does not propose a cryptosystem, a parameter set, or a variant of one, and it never will &mdash; that is written into its charter, not left to judgement.</div>
  </div>
</aside>

<script id="pqc-data" type="application/json">${JSON.stringify(D).replace(/</g, '\\u003c')}</script>
<script>${APP}</script>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'pqc');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'Solid where it was proved — cert-machine',
    desc: 'Lattice reduction watched in exact integers, and every published SVP-challenge record near the acceptance wall decided exactly. Solid where certified, dashed where assumed.',
    root: '../', here: 'instruments',
    head: `<style>${CSS}
/* the site nav floats over a full-viewport instrument, as on /instruments/interferometer */
.topnav { background: linear-gradient(var(--bg), rgba(10,10,12,0)); border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; }
body { padding-top: 0; }
.note-sm b { color: var(--ink-2); font-weight: 500; }</style>`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, records: HOF.length, decided: AUD.length, open: open.length, dim: R.dim, snaps: R.snaps.length };
}

/* THE CARD: the wall. Every published record as a faint dot (a float asserted
   with no error bound), the 37 decided exactly as solid marks, the one row the
   printed norm cannot decide ringed, and the wall at 1.05 as a solid line.
   House code, not frontier's; drawn from the same pinned records. */
function cardArt() {
  const W = 600, H = 420, L = 56, Rr = W - 24, T = 34, B = H - 46;
  const dims = HOF.map(r => r.n), lo = Math.min(...dims), hi = Math.max(...dims);
  const X = n => L + (n - lo) / (hi - lo) * (Rr - L);
  const yLo = 0.985, yHi = 1.053;
  const Y = v => B - (Math.min(yHi, Math.max(yLo, v)) - yLo) / (yHi - yLo) * (B - T);
  const dots = HOF.map(r => `<circle cx="${X(r.n).toFixed(1)}" cy="${Y(r.ratio).toFixed(1)}" r="1.6" fill="var(--ink)" fill-opacity=".22"/>`).join('');
  const decided = AUD.map(a => `<rect x="${(X(a.n) - 2.6).toFixed(1)}" y="${(Y(a.ratio) - 2.6).toFixed(1)}" width="5.2" height="5.2" fill="var(--ink)"/>`).join('');
  const rings = open.map(a => `<circle cx="${X(a.n).toFixed(1)}" cy="${Y(a.ratio).toFixed(1)}" r="7" fill="none" stroke="var(--ink)" stroke-width="1.2"/>`).join('');
  const ticks = [40, 80, 120, 160, 200].filter(n => n >= lo && n <= hi).map(n => `<text x="${X(n).toFixed(1)}" y="${B + 18}" class="lb" text-anchor="middle">${n}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="pqc-card">
<style>.pqc-card .lb{fill:var(--ink-3);font-family:var(--font-mono);font-size:10px}.pqc-card .ax{stroke:var(--ink);stroke-opacity:.16}</style>
<line x1="${L}" y1="${B}" x2="${Rr}" y2="${B}" class="ax"/>
<line x1="${L}" y1="${Y(1.05).toFixed(1)}" x2="${Rr}" y2="${Y(1.05).toFixed(1)}" stroke="var(--ink)" stroke-width="1.4"/>
<text x="${L}" y="${(Y(1.05) - 7).toFixed(1)}" class="lb">the wall, 1.05 · GH</text>
<text x="${L}" y="${B + 32}" class="lb">dimension</text>${ticks}
${dots}${decided}${rings}
</svg>`;
}

module.exports = { build, cardArt, facts: { records: HOF.length, decided: AUD.length, open: open.length, dim: R.dim } };
