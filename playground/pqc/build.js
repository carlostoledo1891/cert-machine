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

const W = require(path.join(PG, 'warrant.js'));   /* the grammar's words for the panel's numbers (WARRANT v2) */

const slim = HOF.map(r => ({ n: r.n, ratio: r.ratio, norm: r.norm, seed: r.seed }));
const aud = AUD.map(a => ({ n: a.n, seed: a.seed, norm: a.norm, ratio: a.ratio, window: a.window, vN: a.vN, vHi: a.vHi }));
const D = { reduce: R, hof: slim, audit: aud };
const open = AUD.filter(a => a.vN === 'ADMISSIBLE' && a.vHi !== 'ADMISSIBLE');

/* THE PANEL'S NUMBERS ARE READ, NOT TYPED (WARRANT v2, 2026-10-28). The ported panel carried five literals from
   frontier-apps, and two did not survive being read off the records. "Half a unit of norm is worth 1.7×10⁻⁴ here,
   which is the size of every apparent discrepancy": across the 37 decided records half a unit is worth 1.4–3.0×10⁻⁴
   (dimension 210 to dimension 40), and the discrepancies run from 0.13 to 2.8×10⁻⁴ — what holds is that each lies
   inside its OWN record's half unit, which is the sentence now printed. "Misses the measured profile by 0.15 decades
   and misses worst at the ends": 0.15 is the root mean square, and the worst miss is at the head of the basis only
   (0.28 decades, at i = 5–7), with a larger one mid-basis than at the tail. The rest — the published ceiling, the
   rounded-norm count, the modulus' digits — read the same as typed, and are now read. Every one is gated: if a
   record moves and the sentence would be false, the build stops.

   AND THE CAPTION'S RECORD IS ANOTHER LATTICE. pqc-app.js (pinned, byte for byte) closes the reduction with "The
   published record at this dimension is 1273". LLL ran on the seed-0 basis; 1273 is the dimension's best, on
   another seed's lattice, and the seed-0 lattice's own record is 1702. The app is not ours to edit, so the shell
   says it beside the run, and the gate below fails the build if the app's literal stops being the dimension's best.

   STANDING IN THE PANEL'S WORDS. The canvas already draws the grammar (solid = an exact integer decision, dashed = the
   heuristic); the panel's numbers now wear the same underline. δ₀ is the heuristic's own constant and the GSA miss is
   floating point on both sides, so both are COMPUTED, as is every published ratio (a six-figure float with no bound).
   Counts and windows are decided. Nothing is red: no published record is refuted by an object of its own — all 37
   are consistent, and the one open row is undecidable, which is a hole with its threshold, not a witness. */
const ATN = AUD.map(a => ({ a, at: Number(a.atN), half: (Number(a.window[1]) - Number(a.window[0])) / 2 }));
/* the obvious comparison: the ratio at the rounded norm against the published five decimals (audit.js's own eps) */
const atRounded = ATN.filter(x => Math.abs(x.at - x.a.ratio) > 5e-6);
if (!ATN.every(x => Math.abs(x.at - x.a.ratio) <= x.half + 5e-6)) throw new Error('pqc: a published ratio lies outside its own half unit; the sentence would be false');
const halfLo = Math.min(...ATN.map(x => x.half)), halfHi = Math.max(...ATN.map(x => x.half));
const discLo = Math.min(...atRounded.map(x => Math.abs(x.at - x.a.ratio))), discHi = Math.max(...atRounded.map(x => Math.abs(x.at - x.a.ratio)));
/* the tightest distance to the wall at the printed norm — what a careful float grader has to resolve; read by
   /instruments/lattice-claims, which used to type it */
const tightest = Math.min(...ATN.map(x => Math.abs(1.05 - x.at)));
const e4 = (x) => { if (!(x >= 1e-5 && x < 1e-3)) throw new Error('pqc: ' + x + ' is not of order 10⁻⁴; the sentence would be false'); return (x * 1e4).toFixed(x < 1e-4 ? 2 : 1); };
const ceiling = Math.max(...HOF.map(r => r.ratio));
if (!(ceiling < 1.05)) throw new Error('pqc: a published ratio exceeds 1.05; "the table is pressed against it" would be false');
/* the heuristic against the measured profile, at the last snapshot — floating point on both sides, so COMPUTED */
const LAST = R.snaps[R.snaps.length - 1].profile;
const miss = LAST.map((v, i) => v - R.gsa[i]);
const rms = Math.sqrt(miss.reduce((t, x) => t + x * x, 0) / miss.length);
const worstAt = miss.map(Math.abs).indexOf(Math.max(...miss.map(Math.abs)));
const worst = Math.abs(miss[worstAt]);
/* D10: the records the panel's numbers are read from; the GSA miss is computed from the last snapshot's profile and the GSA line */
const REDP = 'instruments/pqc/out/reduce-40.json', HOFP = 'instruments/pqc/out/hof.json';
const GSA_FROM = [REDP + '#/snaps/' + (R.snaps.length - 1) + '/profile', REDP + '#/gsa'];
if (!(worstAt < R.dim / 4)) throw new Error('pqc: the GSA no longer misses worst at the head of the basis; rewrite the note');
/* the caption's record, against the lattice the run is on */
const own = HOF.find(r => r.n === R.dim && r.seed === R.seed);
const best = HOF.filter(r => r.n === R.dim).reduce((b, r) => (r.norm < b.norm ? r : b));
if (!own) throw new Error('pqc: no published record for the reduced lattice (dim ' + R.dim + ', seed ' + R.seed + ')');
if (!APP.includes('The published record at this dimension is ' + best.norm + '.') || best.seed === R.seed) throw new Error('pqc: the app\'s caption no longer names the dimension\'s best on another seed; rewrite the note');
if (Number(R.final.ratioLo) <= own.ratio) throw new Error('pqc: LLL reached the seed-' + R.seed + ' record; rewrite the note');

const body = `
<canvas id="stage"></canvas>

<div class="ov ov-title">
  <div class="eyebrow">post-quantum cryptography · the geometry underneath</div>
  <h1 class="mt3 ti">Proved, or assumed</h1>
  <p class="ti">Lattice security rests on how short a vector you can find. The searching is heuristic and always will be; the claims about what was found do not have to be. Solid here was decided in exact integers. Dashed was asserted.</p>
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
      <div class="ctrl mt3"><label for="cT">step</label><output id="cTOut"></output><input type="range" id="cT" min="0" max="1" step="1"></div>
      <div class="note-sm">LLL on the real dimension-${R.dim} challenge basis, ${R.steps.toLocaleString()} steps and ${R.swaps.toLocaleString()} swaps in ${(R.ms / 1000).toFixed(1)} s. Every quantity is an integer: floating-point Gram&ndash;Schmidt does not survive a ${R.qDigits}-digit modulus sitting beside unit entries, so there is none here. The lattice is checked unchanged at the end &mdash; det² = q², exactly.<br><br>The basis is seed ${R.seed}&rsquo;s, whose own published record is norm ${own.norm} (${W.value(own.ratio.toFixed(5), W.COMPUTED, { claim: HOFP + '#/' + HOF.indexOf(own) + '/ratio', title: 'the published six-figure float, with no error bound' })} &times; GH). The ${best.norm} the closing caption names is the dimension&rsquo;s best, found on seed ${best.seed}&rsquo;s lattice &mdash; another lattice, so it is not this run&rsquo;s comparison; against its own record LLL still falls short.</div>
    </div>
    <hr class="hr-thin">
    <div class="grp">
      <span class="eyebrow">marks</span>
      <div class="row-btns">
        <button data-flag="gsa">the heuristic</button>
        <button data-flag="ghost">where it started</button>
      </div>
      <div class="note-sm">The geometric series assumption says a reduced profile is a straight line with root-Hermite factor ${W.val({ rec: { path: REDP, ptr: '/d0' }, standing: W.COMPUTED, fmt: 'raw', why: 'the textbook figure for LLL, measured on random lattices; asserted, never proved' })}. It is an empirical claim about random lattices, asserted everywhere and proved nowhere, so it is drawn dashed, and so is its number. Against this basis it misses the measured profile by ${W.value(rms.toFixed(2), W.COMPUTED, { derived: GSA_FROM, title: 'root mean square over the ' + R.dim + ' positions, in floating point' })} decades root mean square, and worst at the head of the basis, by ${W.value(worst.toFixed(2), W.COMPUTED, { derived: GSA_FROM, title: 'at position ' + worstAt + ' of ' + R.dim + ', in floating point' })}.</div>
    </div>
  </div>

  <div id="wallOnly">
    <div class="grp">
      <span class="eyebrow">marks</span>
      <div class="row-btns">
        <button data-flag="wall">the wall</button>
        <button data-flag="decided">decided exactly</button>
      </div>
      <div class="note-sm">${HOF.length} published records. Each prints ‖v‖/GH to six figures as a float with no error bound, and none exceeds ${W.value(ceiling.toFixed(5), W.COMPUTED, { claim: HOFP + '#/' + HOF.findIndex(r => r.ratio === ceiling) + '/ratio', title: 'the largest published six-figure float, with no error bound' })} &mdash; so 1.05 is a hard wall and the table is pressed against it.</div>
    </div>
    <hr class="hr-thin">
    <div class="grp">
      <span class="eyebrow">what was checked</span>
      <div class="note-sm">${AUD.length} records decided in exact rational arithmetic against ${new Set(AUD.map(a => a.n + ':' + a.seed)).size} determinants, dimensions ${Math.min(...AUD.map(a => a.n))}&ndash;${Math.max(...AUD.map(a => a.n))}. <b>All ${AUD.length} published ratios are consistent; none is wrong.</b><br><br>The bar on a decided record is every ratio consistent with a true norm that prints as the integer printed. Comparing against the ratio at the rounded norm instead &mdash; the obvious thing to do &mdash; reports ${atRounded.length} of ${AUD.length} as disagreeing, and that is an artefact of the rounding rather than a finding. Half a unit of norm is worth ${e4(halfLo)}&ndash;${e4(halfHi)}&times;10⁻⁴ of ratio across these records, and every apparent discrepancy (${e4(discLo)}&ndash;${e4(discHi)}&times;10⁻⁴) lies inside its own record&rsquo;s half unit.</div>
    </div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <div class="note-sm"><b>The one open row.</b> ${open.length ? `Dimension ${open[0].n}, seed ${open[0].seed}, norm ${open[0].norm}: admissible if the norm is exactly ${open[0].norm}, refused if it is half a unit more. Its window straddles the wall, so it cannot be decided from what is published &mdash; it needs the vector, and the vectors are not published.` : '—'}</div>
  </div>
  <hr class="hr-thin">
  <div class="grp">
    <span class="eyebrow">the ink</span>
    <div class="note-sm">One pattern per standing, on the canvas and under the numbers in this panel alike.</div>
    ${W.legendHtml({ compact: true })}
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
    /* A VIEWPORT, NOT A DOCUMENT (2026-09-15): html and body are height:100%
       with overflow hidden, so a document footer renders in the flow BEHIND the
       overlays — measured at top=108px on this page, its links showing through
       the title. The closing line lives inside the viewport (.ov-foot / the
       panel). Same ruling as /instruments/navier-stokes. */
    foot: null,
    title: 'Solid where it was proved — cert-machine',
    desc: 'Lattice reduction watched in exact integers, and every published SVP-challenge record near the acceptance wall decided exactly. Solid where certified, dashed where assumed.',
    path: '/instruments/pqc/',
    css: `${CSS}
/* the site nav floats over a full-viewport instrument, as on /instruments/interferometer */
.topnav { background: linear-gradient(var(--bg), rgba(10,10,12,0)); border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; }
body { padding-top: 0; }
.note-sm b { color: var(--ink-2); font-weight: 500; }`,
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
<line x1="${L}" y1="${B}" x2="${Rr}" y2="${B}" class="ax"/>
<line x1="${L}" y1="${Y(1.05).toFixed(1)}" x2="${Rr}" y2="${Y(1.05).toFixed(1)}" stroke="var(--ink)" stroke-width="1.4"/>
<text x="${L}" y="${(Y(1.05) - 7).toFixed(1)}" class="lb">the wall, 1.05 · GH</text>
<text x="${L}" y="${B + 32}" class="lb">dimension</text>${ticks}
${dots}${decided}${rings}
</svg>`;
}

/* atRounded, tightest: the audit's two numbers that /instruments/lattice-claims quotes in its lede — read here, once,
   so the two pages cannot print two different counts (the corpus.js lesson) */
module.exports = { build, cardArt, facts: { records: HOF.length, decided: AUD.length, open: open.length, dim: R.dim,
  atRounded: atRounded.length, tightest, e4 } };
