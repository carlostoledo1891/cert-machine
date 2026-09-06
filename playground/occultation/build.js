/* build.js — site/instruments/occultation/index.html.
   playground/occultation/ · cert-machine · 2026-09-05

   PORTED from frontier-apps tools/build-occultation.js under the house shell:
   figures, body and CSS kept as they were; the page() call and the requires
   rewritten; the dash classes come from design/grammar.js, whose css() emits
   the same names with the same permitted patterns. THE BUILDER ONLY READS:
   instruments/occultation/out/page.json, pinned there and rebuilt byte for
   byte by its battery. The link to the transit page is prose until that page
   is ported (it is, since later the same evening). ONE figure
   change, found by looking: the x-axis caption of the envelope figure sat on
   the tick row (y = h - 12) and overprinted the 100 km tick and the right
   'saw nothing' label; it sits one line lower now. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments/occultation/out/page.json'), 'utf8'));
const REPORT = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/report.css'), 'utf8');
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
/* the structural rules the body uses that neither the shell nor bench.css
   declares — frontier base.css's, copied rather than approximated */
const BASE_EXTRA = `
.section-head { display:flex; justify-content:space-between; align-items:baseline; gap:var(--s-4); flex-wrap:wrap; margin-bottom:var(--s-4); }
.mono { font-family:var(--font-mono); font-size:0.92em; color:var(--ink-2); }
.t1 { font-size:clamp(1.5rem,1rem+1.6vw,2.1rem); line-height:1.12; } .t2 { font-size:clamp(1.25rem,1rem+1vw,1.6rem); }
.section { padding:clamp(2.5rem,6vh,4.5rem) 0; border-top:1px solid var(--border); }
.small { font-size:var(--text-small); color:var(--ink-3); } .dim { color:var(--ink-4); } .num { font-variant-numeric:tabular-nums; }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; }
.stat { background:var(--bg-raised); padding:var(--s-5); }
.stat .num { font-family:var(--font-mono); font-size:clamp(1.3rem,1rem+1vw,1.9rem); color:var(--ink); }
.stat .dim { margin-top:var(--s-2); font-family:var(--font-mono); font-size:var(--text-eyebrow); }
`;

const f = (x, n = 1) => Number(x).toFixed(n);
const R1 = D.ladder.find(r => r.nsig === 1);
const R0 = D.ladder.find(r => r.nsig === 0);
const NN = D.noNegatives.find(r => r.nsig === 1);
const pos = D.sites.filter(s => s.status === 'positive');
const neg = D.sites.filter(s => s.status === 'negative');
const E0 = D.ellipse[0], E1 = D.ellipse[1];
const rad = D.published.radiometric[0];

/* ---------- FIGURE 1: the chord-length function and its two envelopes ----- */
function figEnvelope() {
  const w = 760, h = 380, ml = 52, mr = 16, mt = 18, mb = 34;
  const y0 = R1.capLo - 12, y1 = R1.capHi + 12;
  const wmax = Math.max(...R1.polyHi.map(p => p[1])) * 1.06;
  const X = v => ml + (v - y0) / (y1 - y0) * (w - ml - mr);
  const Y = v => h - mb - v / wmax * (h - mt - mb);
  const poly = P => P.map(p => `${f(X(p[0]))},${f(Y(p[1]))}`).join(' ');
  const grid = [];
  for (let v = 0; v <= wmax; v += 50) grid.push(`<line class="ink-guide" x1="${ml}" x2="${w - mr}" y1="${f(Y(v))}" y2="${f(Y(v))}" stroke="var(--chart-grid)" stroke-width="1"/><text x="${ml - 6}" y="${f(Y(v) + 3)}" text-anchor="end" class="ax">${v}</text>`);
  const xt = [];
  for (let v = -150; v <= 150; v += 50) if (v > y0 && v < y1) xt.push(`<text x="${f(X(v))}" y="${h - 12}" text-anchor="middle" class="ax">${v}</text>`);
  const negMarks = neg.filter(s => +s.y > y0 && +s.y < y1).map(s =>
    `<line class="ink-decided" x1="${f(X(+s.y))}" x2="${f(X(+s.y))}" y1="${f(Y(0)) - 7}" y2="${f(Y(0)) + 7}" stroke="var(--ink-4)" stroke-width="1.4"/>`).join('');
  const bars = pos.map(s => {
    const y = +s.y, L = +s.len, e = +s.err;
    return `<g><line class="ink-decided" x1="${f(X(y))}" x2="${f(X(y))}" y1="${f(Y(L - e))}" y2="${f(Y(L + e))}" stroke="var(--ink-2)" stroke-width="1.3"/>
      <circle cx="${f(X(y))}" cy="${f(Y(L))}" r="2.6" fill="var(--ink)"/>
      <text x="${f(X(y))}" y="${f(Y(L + e)) - 8}" text-anchor="middle" class="lb">${esc(s.site.replace(/ Observatory.*/, ''))}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="chord length against cross-track position, with the certified envelopes">
    ${grid.join('')}${xt.join('')}
    <polyline points="${poly(R1.polyHi)}" fill="none" stroke="var(--ink-3)" stroke-width="1.5" class="ink-decided"/>
    <polyline points="${poly(R1.polyLo)}" fill="none" stroke="var(--ink-3)" stroke-width="1.5" class="ink-decided"/>
    <polyline points="${poly(R1.polyDots)}" fill="none" stroke="var(--ink-4)" stroke-width="1.2" class="ink-assumed" opacity="0.85"/>
    ${negMarks}${bars}
    <text x="14" y="${mt + 8}" class="ax">chord, km</text>
    <text x="${w - mr}" y="${h - 2}" text-anchor="end" class="ax">cross-track position on the sky plane, km</text>
    <text x="${f(X(R1.capLo))}" y="${f(Y(0)) + 22}" text-anchor="middle" class="lb">saw nothing</text>
    <text x="${f(X(R1.capHi))}" y="${f(Y(0)) + 22}" text-anchor="middle" class="lb">saw nothing</text>
  </svg>`;
}

/* ---------- FIGURE 2: two silhouettes, both consistent -------------------- */
function figSilhouettes() {
  const w = 760, h = 330, cx1 = 200, cx2 = 545, cy = 165, s = 0.52;
  const shape = (P, cx) => {
    const top = P.map(p => `${f(cx + p[1] / 2 * s)},${f(cy - p[0] * s)}`);
    const bot = P.slice().reverse().map(p => `${f(cx - p[1] / 2 * s)},${f(cy - p[0] * s)}`);
    return top.concat(bot).join(' ');
  };
  const ell = (cx, a, b, pa) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${f(a * s)}" ry="${f(b * s)}" transform="rotate(${-(pa - 90)} ${cx} ${cy})" fill="none" stroke="var(--ink-4)" stroke-width="1.2" class="ink-assumed"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="the smallest and largest silhouettes the chords allow">
    <polygon points="${shape(R1.polyLo, cx1)}" fill="var(--band-fill)" stroke="var(--ink-2)" stroke-width="1.4" class="ink-decided"/>
    ${ell(cx1, E0.aKm, E0.bKm, E0.posAngleDeg)}
    <polygon points="${shape(R1.polyHi, cx2)}" fill="var(--band-fill)" stroke="var(--ink-2)" stroke-width="1.4" class="ink-decided"/>
    ${ell(cx2, E0.aKm, E0.bKm, E0.posAngleDeg)}
    <text x="${cx1}" y="${h - 40}" text-anchor="middle" class="lb">the smallest allowed — ${f(R1.DeqLo)} km</text>
    <text x="${cx2}" y="${h - 40}" text-anchor="middle" class="lb">the largest allowed — ${f(R1.DeqHi)} km</text>
    <text x="${w / 2}" y="${h - 16}" text-anchor="middle" class="lb">dashed: the published ellipse, ${f(E0.DeqKm, 0)} ± ${f(E0.DeqErrKm, 0)} km · drawn centred, because chords fix widths and not offsets</text>
  </svg>`;
}

/* ---------- FIGURE 3: the ladder of budgets, against what is published ---- */
function figLadder() {
  const rows = D.ladder;
  const w = 760, rowH = 40, h = rows.length * rowH + 66, ml = 132, mr = 20;
  const lo = 130, hi = 320;
  const X = v => ml + (v - lo) / (hi - lo) * (w - ml - mr);
  const tick = (v, lab, cls) => `<line class="${cls}" x1="${f(X(v))}" x2="${f(X(v))}" y1="28" y2="${h - 26}" stroke="var(--ink-5)" stroke-width="1"/><text x="${f(X(v))}" y="22" text-anchor="middle" class="lb">${lab}</text>`;
  const bars = rows.map((r, i) => {
    const y = 36 + i * rowH;
    const bad = !r.feasible.ok;
    return `<g>
      <text x="${ml - 10}" y="${y + 12}" text-anchor="end" class="lb">${r.nsig === 0 ? 'as published' : r.nsig + 'σ of chord error'}</text>
      <rect x="${f(X(r.DeqLo))}" y="${y + 3}" width="${f(Math.max(1, X(r.DeqHi) - X(r.DeqLo)))}" height="13" fill="var(--band-fill)" stroke="${bad ? 'var(--verdict-refuted-ink)' : 'var(--border-strong)'}" stroke-width="1" class="${bad ? 'ink-assumed' : 'ink-decided'}"/>
      <text x="${f(X(r.DeqLo)) - 6}" y="${y + 13}" text-anchor="end" class="ax">${f(r.DeqLo)}</text>
      <text x="${f(X(r.DeqHi)) + 6}" y="${y + 13}" class="ax">${f(r.DeqHi)}</text>
      ${bad ? `<text x="${f(X(r.DeqHi)) + 46}" y="${y + 13}" class="lb">no convex body fits</text>` : ''}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="certified equivalent diameter against the error budget">
    ${tick(E0.DeqKm, 'ellipse ' + E0.DeqKm, 'ink-assumed-sm')}
    ${tick(rad.DKm, 'radiometric ' + rad.DKm, 'ink-assumed-sm')}
    ${bars}
    <line class="ink-guide" x1="${ml}" x2="${w - mr}" y1="${h - 24}" y2="${h - 24}" stroke="var(--chart-axis)" stroke-width="1"/>
    ${[150, 200, 250, 300].map(v => `<text x="${f(X(v))}" y="${h - 10}" text-anchor="middle" class="ax">${v}</text>`).join('')}
    <text x="${w - mr}" y="${h - 10}" text-anchor="end" class="ax">area-equivalent diameter, km</text>
  </svg>`;
}

const body = `
<section class="hero">
  <div class="container">
    <div class="eyebrow reveal">${esc(D.object)} · ${esc(D.date)} · ${D.nPositive} chords, ${D.nNegative} stations that saw nothing</div>
    <h1 class="display reveal" style="margin-top:var(--s-3);max-width:20ch;">The occultation, without the ellipse.</h1>
    <p class="lede reveal" style="margin-top:var(--s-4);max-width:74ch;">
      A star winks out behind a small body and a handful of telescopes each measure one chord across its silhouette. Every published
      size is then an ellipse fitted to those chords. This asks what the chords force on their own — the silhouette is any convex
      shape at all — and the whole question turns out to be one-dimensional and closed form.
    </p>
    <div class="stats reveal" style="margin-top:var(--s-6);">
      <div class="stat"><div class="num">${f(R1.DeqLo, 0)}–${f(R1.DeqHi, 0)}</div><div class="dim">km, certified from convexity</div></div>
      <div class="stat"><div class="num">${E0.DeqKm} ± ${E0.DeqErrKm}</div><div class="dim">km, the published ellipse</div></div>
      <div class="stat"><div class="num">${f(NN.DeqHi - R1.DeqHi, 0)}</div><div class="dim">km of ceiling bought by the misses</div></div>
      <div class="stat"><div class="num">0</div><div class="dim">optimisers; every area is exact</div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="reveal">
      <div class="eyebrow">why this is one-dimensional</div>
      <h2 class="t1" style="margin-top:var(--s-2);max-width:30ch;">A convex silhouette has a concave chord.</h2>
    </div>
    <div class="prose reveal" style="margin-top:var(--s-4);max-width:74ch;">
      <p>Occultation chords are parallel: the shadow sweeps one way and every station cuts the silhouette along that direction. Put the
      chord direction along <i>x</i> and let <i>y</i> be the cross-track coordinate. A convex silhouette has slices
      [<i>L</i>(y), <i>R</i>(y)] with <i>R</i> concave and <i>L</i> convex, so the chord length <b>w(y) = R(y) − L(y) is concave</b> on
      the body's support and zero outside it. Every measured chord is a value of w, every station that saw nothing is a y where w
      vanishes, and the silhouette's area is ∫w. That is the whole problem, and it is the calibration envelope again with
      <em>concave</em> where that one had <em>monotone with a slope band</em>.</p>
      <p>So the two bounds are read off, not searched for. The <b>floor</b> is the concave hull of the measured lengths between the
      outermost chords — the negatives play no part in it, and nothing forces the body to extend past its outermost chord. The
      <b>ceiling</b> is concavity read backwards: beyond two samples, w is capped by their extrapolated secant, taken with an upper
      value at the near sample and a lower one at the far, and that envelope is then clipped where the nearest station saw nothing.</p>
      <p><b>The asymmetry is structural.</b> The floor is bought by the chords; the ceiling is bought by the telescopes that recorded
      nothing at all. Move this campaign's ${D.nNegative} negative stations out of reach and the ceiling goes from ${f(R1.DeqHi)} km to
      ${f(NN.DeqHi)} km — the misses are worth ${f(NN.DeqHi - R1.DeqHi, 0)} km of upper bound, more than the object's own diameter, and
      they are the part of a campaign least often published.</p>
    </div>

    <figure class="reveal" style="margin-top:var(--s-6);">${figEnvelope()}
      <figcaption class="figcap"><span class="k">the chords, and every concave function that fits them</span>
      <span class="v">solid: the certified floor and ceiling · dashed: joining the dots, which is an assumption, not a bound</span></figcaption></figure>

    <figure class="reveal" style="margin-top:var(--s-6);">${figSilhouettes()}
      <figcaption class="figcap"><span class="k">two silhouettes the same five chords allow</span>
      <span class="v">${f(R1.DeqLo)} km and ${f(R1.DeqHi)} km across</span></figcaption></figure>

    <figure class="reveal" style="margin-top:var(--s-6);">${figLadder()}
      <figcaption class="figcap"><span class="k">what the error budget buys</span>
      <span class="v">the top row is the chords at face value</span></figcaption></figure>

    <div class="note reveal">
      <b>At face value the chords are not consistent with any convex silhouette.</b> Taken with zero error, the concave hull of the
      measured lengths runs ${f(R0.feasible.overKm)} km above ${esc(R0.feasible.at.replace(/ Observatory.*/, ''))}'s own chord — no convex body passes through all five.
      About half of one stated error bar is enough to admit one, which is why the row above is drawn open. The published analysis meets the
      same fact from the other side: its fit to the chords as timed scores χ² = ${E0.chi2}, and only after shifting three chords in time does it
      reach ${E1.chi2}. <em>This page does not take a side in that debate: a timing shift slides a chord along its own line and does not change how
      long it is, so nothing here depends on which fit one prefers.</em>
    </div>

    <div class="note reveal">
      <b>And a disagreement in the literature dissolves.</b> The paper reports an occultation diameter of ${E0.DeqKm} ± ${E0.DeqErrKm} km and notes that its
      mean 3-D estimate is <em>not in agreement</em> with the radiometric ${rad.DKm} ± ${rad.errKm} km from Herschel, Spitzer and ALMA. Both numbers sit
      inside [${f(R1.DeqLo)}, ${f(R1.DeqHi)}] km. The tension is between two models, not between two measurements.
    </div>

    <div class="grid reveal" style="grid-template-columns:2fr 1fr 1fr 1.2fr;">
      <div class="h">station</div><div class="h">cross-track, km</div><div class="h">chord, km</div><div class="h">status</div>
      ${D.sites.filter(s => s.status !== 'negative' || Math.abs(+s.y) < 230).map(s => `
        <div class="ml">${esc(s.site)}</div><div>${f(+s.y)}</div>
        <div>${s.len ? f(+s.len) + ' ± ' + f(+s.err) : '—'}</div>
        <div class="${s.status === 'positive' ? 'hit' : ''}">${esc(s.status)}${s.note ? ' — ' + esc(s.note) : ''}</div>`).join('')}
    </div>
    <p class="small reveal" style="margin-top:var(--s-3);color:var(--ink-5);">${D.nNegative - neg.filter(s => Math.abs(+s.y) < 230).length} further negative stations between 268 and 731 km from the centerline are omitted from this table; they are in the data file and change nothing.</p>

    <div class="note reveal">
      <b>Every number on this page is exact.</b> The published values are decimals, so they are exact rationals, and the areas are
      exact rationals too — there is no optimiser here and nothing converges. The envelope is discontinuous at every chord, because the
      constraints anchored at a chord stop applying the moment you pass it; integrating it as a polyline understated the ceiling by 16%
      and made it <em>fall</em> when chords were removed. Between breakpoints the envelope is affine, so the midpoint rule is exact and
      blind to the jumps. Twenty cases and six reds, including a control that must fail: a dumbbell silhouette, which is not convex, has to
      land outside the interval — and does.
    </div>

    <p class="small reveal" style="margin-top:var(--s-5);color:var(--ink-5);">
      Data transcribed from ${esc(D.source)}. Companion to <a href="../transit/index.html" style="color:inherit;">the transit page</a>,
      which finds the same asymmetry in exoplanet photometry, and to <a href="../curveset/index.html" style="color:inherit;">the calibration envelope</a>,
      whose closed form this is.
    </p>
  </div>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'occultation');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'The occultation, without the ellipse — cert-machine',
    desc: 'What a stellar occultation forces about a small body’s size, assuming only that its silhouette is convex.',
    root: '../', here: 'instruments',
    head: `<style>${BENCHCSS}\n${BASE_EXTRA}\n${REPORT}\n${G.css()}
.fg{width:100%;height:auto;display:block;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-m);}
.fg .ax{font-family:var(--font-mono);font-size:8.5px;fill:var(--ink-5);}
.fg .lb{font-family:var(--font-mono);font-size:9.5px;fill:var(--ink-3);}
.prose p{margin-top:var(--s-4);color:var(--ink-3);line-height:var(--leading-body);}
.prose b{color:var(--ink-2);font-weight:500;} .prose em{color:var(--ink-4);} .prose i{color:var(--ink-3);}
</style>`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, chords: D.nPositive, misses: D.nNegative, lo: R1.DeqLo, hi: R1.DeqHi, worth: NN.DeqHi - R1.DeqHi };
}

/* the card: the two silhouettes the same five chords allow, WITHOUT the
   figure's own labels — at card scale a 9.5px label is a smear (the plates
   card learned this first), and the plate label carries the numbers. */
function cardArt() { return figSilhouettes().replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, ''); }

module.exports = { build, cardArt, facts: { chords: D.nPositive, misses: D.nNegative, lo: R1.DeqLo, hi: R1.DeqHi, ellipse: E0.DeqKm, ellipseErr: E0.DeqErrKm, worth: Math.round(NN.DeqHi - R1.DeqHi) } };
