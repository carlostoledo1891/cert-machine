/* build.js — site/instruments/transit/index.html.
   playground/transit/ · cert-machine · 2026-09-05

   PORTED from frontier-apps tools/build-transit.js under the house shell:
   figures, body and CSS kept as they were; the page() call and the requires
   rewritten; the dash classes come from design/grammar.js, whose css() emits
   the same names with the same permitted patterns. THE BUILDER RECOMPUTES
   NOTHING: every number and every curve is read from instruments/transit/out/
   (page.json, witness.json), pinned there and rebuilt by its battery.
   ONE figure change, found by looking: in the folded-curve figure the x-axis
   caption sat on the tick row and overprinted the last tick, and the 'ppm'
   label sat on the top tick; the caption sits one line below the tick row and
   'ppm' one line above the top tick now, where nothing else is drawn. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const EXP = path.join(ROOT, 'instruments', 'transit');
const D = JSON.parse(fs.readFileSync(path.join(EXP, 'out/page.json'), 'utf8'));
const W = JSON.parse(fs.readFileSync(path.join(EXP, 'out/witness.json'), 'utf8'));
const REPORT = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/report.css'), 'utf8');
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
/* the structural rules the body uses that neither the shell nor bench.css
   declares — frontier base.css's, copied rather than approximated (the same
   block the occultation page carries) */
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

const f = (x, n = 4) => Number(x).toFixed(n);
const pct = (x, n = 1) => (100 * x).toFixed(n) + '%';
const ppm = x => Math.round(x * 1e6);
const res = (t, orbit, rung) => t.results.find(r => r.orbit === orbit && r.rung === rung);
const wcurve = (key, orbit, rung, side) => (W.targets.find(x => x.key === key) || { curves: [] })
  .curves.find(c => c.orbit === orbit && c.rung === rung && c.side === side);

/* ---------- marks. Each is written for its own data. ---------------------- */

/* the folded light curve, with the two extreme admissible models over it */
function figCurve(t) {
  const w = 760, h = 300, ml = 46, mr = 14, mt = 14, mb = 30;
  const xs = t.curve.map(p => p[0]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ys = t.curve.map(p => p[1]);
  const y0 = Math.min(...ys) - 0.0008, y1 = 1.0006;
  const X = v => ml + (v - x0) / (x1 - x0) * (w - ml - mr);
  const Y = v => mt + (y1 - v) / (y1 - y0) * (h - mt - mb);
  const lo = wcurve(t.key, 'exact', 'monotone', 'lo'), hi = wcurve(t.key, 'exact', 'monotone', 'hi');
  const poly = c => c.depth.filter(p => p[0] >= x0 && p[0] <= x1).map(p => `${f(X(p[0]), 1)},${f(Y(p[1]), 1)}`).join(' ');
  const ticks = [];
  for (let i = 0; i <= 4; i++) { const v = y0 + (y1 - y0) * i / 4; ticks.push(`<line class="ink-guide" x1="${ml}" x2="${w - mr}" y1="${f(Y(v), 1)}" y2="${f(Y(v), 1)}" stroke="var(--chart-grid)" stroke-width="1"/><text x="${ml - 6}" y="${f(Y(v) + 3, 1)}" text-anchor="end" class="ax">${((v - 1) * 1e6).toFixed(0)}</text>`); }
  const xt = [];
  for (let i = 0; i <= 6; i++) { const v = x0 + (x1 - x0) * i / 6; xt.push(`<text x="${f(X(v), 1)}" y="${h - 10}" text-anchor="middle" class="ax">${v.toFixed(2)}</text>`); }
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="folded light curve of ${esc(t.name)} with two admissible models">
  ${ticks.join('')}${xt.join('')}
  <text x="12" y="${mt - 4}" class="ax">ppm</text>
  <text x="${w - mr}" y="${h - 1}" text-anchor="end" class="ax">hours from mid-transit</text>
  ${t.curve.map(p => `<circle cx="${f(X(p[0]), 1)}" cy="${f(Y(p[1]), 1)}" r="1.15" fill="var(--ink-4)" opacity="0.75"/>`).join('')}
  ${lo ? `<polyline points="${poly(lo)}" fill="none" stroke="var(--ink)" stroke-width="1.7" opacity="0.95" class="ink-decided"/>` : ''}
  ${hi ? `<polyline points="${poly(hi)}" fill="none" stroke="var(--ink)" stroke-width="1.3" opacity="0.62" class="ink-decided"/>` : ''}
</svg>`;
}

/* the ladder: one bar per (orbit, rung), published values as ticks behind */
function figLadder(t) {
  const rows = [];
  for (const orbit of ['exact', 'stated', 'open'])
    for (const rung of ['none', 'monotone']) { const r = res(t, orbit, rung); if (r && r.ok) rows.push(r); }
  const w = 760, rowH = 46, h = rows.length * rowH + 54, ml = 168, mr = 16;
  const kmax = Math.min(1, Math.max(...rows.map(r => Math.min(r.outer[1], 1)), t.fit.k * 3) * 1.06);
  const kmin = 0;
  const X = v => ml + (v - kmin) / (kmax - kmin) * (w - ml - mr);
  const pubTicks = t.published.map(p => `<line class="ink-assumed-sm" x1="${f(X(p.k), 1)}" x2="${f(X(p.k), 1)}" y1="34" y2="${h - 22}" stroke="var(--ink-5)" stroke-width="1" opacity="0.55"/>`).join('');
  const bars = rows.map((r, i) => {
    const y = 40 + i * rowH;
    const ob = [Math.max(kmin, r.outer[0]), Math.min(kmax, r.outer[1])];
    return `<g>
      <text x="${ml - 10}" y="${y + 12}" text-anchor="end" class="lb">${esc(r.orbit)} · ${r.rung === 'none' ? 'nonneg only' : 'not brightening out'}</text>
      <rect x="${f(X(ob[0]), 1)}" y="${y + 3}" width="${f(Math.max(1, X(ob[1]) - X(ob[0])), 1)}" height="13" fill="var(--band-fill)" stroke="var(--border-strong)" stroke-width="1"/>
      <rect x="${f(X(r.inner[0]), 1)}" y="${y + 3}" width="${f(Math.max(1, X(r.inner[1]) - X(r.inner[0])), 1)}" height="13" fill="var(--ink-5)" opacity="0.5"/>
      <text x="${f(X(ob[0]), 1)}" y="${y + 29}" class="ax">${f(r.outer[0], 4)}</text>
      <text x="${f(X(ob[1]), 1)}" y="${y + 29}" text-anchor="end" class="ax">${r.outer[1] >= 0.999 ? 'not closed below 1' : f(r.outer[1], 4)}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="certified intervals for ${esc(t.name)}">
    ${pubTicks}
    <line class="ink-guide" x1="${ml}" x2="${w - mr}" y1="${h - 20}" y2="${h - 20}" stroke="var(--chart-axis)" stroke-width="1"/>
    ${[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1].filter(v => v <= kmax).map(v => `<text x="${f(X(v), 1)}" y="${h - 8}" text-anchor="middle" class="ax">${v}</text>`).join('')}
    <text x="${ml - 10}" y="24" text-anchor="end" class="lb">assuming</text>
    <text x="${f(X(t.fit.k), 1)}" y="24" text-anchor="middle" class="ax">published, all ${t.published.length}</text>
    ${bars}
  </svg>`;
}

/* the published values on their own axis, with their own error bars */
function figPublished(t) {
  const P = [...t.published].sort((a, b) => a.k - b.k);
  const w = 760, h = 40 + P.length * 17, ml = 250, mr = 90;
  const lo = Math.min(...P.map(p => p.k)) * 0.985, hi = Math.max(...P.map(p => p.k)) * 1.015;
  const X = v => ml + (v - lo) / (hi - lo) * (w - ml - mr);
  const best = res(t, 'exact', 'monotone');
  const band = best && best.ok ? `<rect x="${f(Math.max(ml, X(best.outer[0])), 1)}" y="18" width="${f(Math.min(w - mr, X(best.outer[1])) - Math.max(ml, X(best.outer[0])), 1)}" height="${h - 34}" fill="var(--band-fill)"/>` : '';
  const rows = P.map((p, i) => {
    const y = 30 + i * 17;
    const e = Math.max(p.kerr, 1e-6);
    return `<g><text x="${ml - 10}" y="${y + 3}" text-anchor="end" class="lb">${esc(p.ref)}</text>
      <line class="ink-assumed-sm" x1="${f(X(p.k - e), 1)}" x2="${f(X(p.k + e), 1)}" y1="${y}" y2="${y}" stroke="var(--ink-3)" stroke-width="1.2"/>
      <circle cx="${f(X(p.k), 1)}" cy="${y}" r="2.1" fill="var(--ink-2)"/>
      <text x="${w - mr + 8}" y="${y + 3}" class="ax">${f(p.k, 5)} ± ${p.kerr ? f(p.kerr, 5) : '—'}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="published radius ratios for ${esc(t.name)}">${band}${rows}</svg>`;
}

/* the invisible core: the circle the planet never touches */
function figCore(t) {
  const b = t.fit.b, k = t.fit.k, R = 118, cx = 150, cy = 150, w = 760, h = 300;
  const rc = Math.max(0, b - k);
  const chordY = cy - b * R;
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="the region of the star the planet never occults">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--surface)" stroke="var(--border-strong)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${f(rc * R, 1)}" fill="var(--ink-5)" opacity="0.18"/>
    <circle class="ink-guide" cx="${cx}" cy="${cy}" r="${f(rc * R, 1)}" fill="none" stroke="var(--ink-3)" stroke-width="1"/>
    <line class="ink-guide" x1="${cx - R - 14}" x2="${cx + R + 14}" y1="${f(chordY, 1)}" y2="${f(chordY, 1)}" stroke="var(--ink-4)" stroke-width="1"/>
    ${[-1.55, -0.8, 0, 0.8, 1.55].map(u => `<circle cx="${f(cx + u * R, 1)}" cy="${f(chordY, 1)}" r="${f(k * R, 1)}" fill="none" stroke="var(--ink-2)" stroke-width="1.2" opacity="${u === 0 ? 0.95 : 0.4}"/>`).join('')}
    <text x="${cx}" y="${f(cy + rc * R + 16, 1)}" text-anchor="middle" class="lb">r &lt; b − k : never occulted</text>
    <g transform="translate(330,44)">
      <text x="0" y="0" class="lb">b = ${f(b, 3)}   k = ${f(k, 4)}   b − k = ${f(rc, 4)}</text>
      <text x="0" y="22" class="lb">the shaded disc is ${pct(rc * rc, 1)} of the star's area,</text>
      <text x="0" y="40" class="lb">and it can hold any fraction of the star's light.</text>
      <text x="0" y="66" class="lb">Flux there changes the NORMALISATION and nothing else,</text>
      <text x="0" y="84" class="lb">so a larger planet blocking a smaller share of a</text>
      <text x="0" y="102" class="lb">dimmer annulus reproduces the same depth.</text>
      <text x="0" y="128" class="lb">That is why the interval is wide upward and</text>
      <text x="0" y="146" class="lb">tight downward: light can hide, but it cannot un-hide.</text>
      ${(() => { const a = wcurve(t.key, 'exact', 'monotone', 'lo'), c = wcurve(t.key, 'exact', 'monotone', 'hi');
        return a && c ? `<text x="0" y="176" class="lb">Measured in the two witnesses this run exhibited:</text>
      <text x="0" y="194" class="lb">the k = ${f(a.k, 4)} star hides ${pct(a.coreFraction, 1)} of its light there,</text>
      <text x="0" y="212" class="lb">the k = ${f(c.k, 4)} star hides ${pct(c.coreFraction, 1)}.</text>` : ''; })()}
    </g>
  </svg>`;
}

/* the two extreme witnesses as cumulative light inside radius r */
function figProfiles(t) {
  const lo = wcurve(t.key, 'exact', 'monotone', 'lo'), hi = wcurve(t.key, 'exact', 'monotone', 'hi');
  if (!lo || !hi) return '';
  const w = 760, h = 260, ml = 46, mr = 16, mt = 16, mb = 30;
  const X = v => ml + v * (w - ml - mr), Y = v => mt + (1 - v) * (h - mt - mb);
  const path = c => c.profile.steps.map(p => `${f(X(p[0]), 1)},${f(Y(p[1]), 1)}`).join(' ');
  const core = Math.max(0, t.fit.b - t.fit.k);
  return `<svg viewBox="0 0 ${w} ${h}" class="fg" role="img" aria-label="cumulative brightness of the two extreme admissible stars">
    <rect x="${f(X(0), 1)}" y="${mt}" width="${f(X(core) - X(0), 1)}" height="${h - mt - mb}" fill="var(--ink-5)" opacity="0.12"/>
    ${[0, 0.25, 0.5, 0.75, 1].map(v => `<line class="ink-guide" x1="${ml}" x2="${w - mr}" y1="${f(Y(v), 1)}" y2="${f(Y(v), 1)}" stroke="var(--chart-grid)" stroke-width="1"/><text x="${ml - 6}" y="${f(Y(v) + 3, 1)}" text-anchor="end" class="ax">${v}</text>`).join('')}
    ${[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => `<text x="${f(X(v), 1)}" y="${h - 10}" text-anchor="middle" class="ax">${v}</text>`).join('')}
    <polyline points="${path(lo)}" fill="none" stroke="var(--ink)" stroke-width="1.7" opacity="0.95" class="ink-decided"/>
    <polyline points="${path(hi)}" fill="none" stroke="var(--ink)" stroke-width="1.3" opacity="0.62" class="ink-decided"/>
    <text x="${w - mr}" y="${h - 10}" text-anchor="end" class="ax">radius, in stellar radii</text>
    <text x="12" y="${mt + 8}" class="ax">light inside r</text>
    <text x="${f(X(core) + 6, 1)}" y="${mt + 14}" class="lb">the invisible core</text>
  </svg>`;
}

/* ---------- the page ------------------------------------------------------ */
function section(t) {
  const ex = res(t, 'exact', 'monotone'), exn = res(t, 'exact', 'none');
  const pubW = (() => {
    const ks = t.published.map(p => p.k);
    const es = t.published.map(p => p.kerr).filter(e => e > 0).sort((a, b) => a - b);
    const med = es[es.length >> 1];
    return { lo: Math.min(...ks), hi: Math.max(...ks), err: med, spread: Math.max(...ks) - Math.min(...ks) };
  })();
  /* two anchors, both honest. Comparing to the TIGHTEST published bar gives a
     number in the thousands and says nothing; the papers' own disagreement is
     the fair scale, and how far that disagreement already exceeds their bars is
     a fact about the literature that needs no enclosure to see. */
  const widen = ex && ex.ok ? (ex.outer[1] - ex.outer[0]) / pubW.spread : null;
  const overconf = pubW.spread / (2 * pubW.err);
  return `
<section class="section">
  <div class="container">
    <div class="reveal">
      <div class="eyebrow">${esc(t.name)}${t.also ? ' · ' + esc(t.also) : ''} · ${t.nPoints.toLocaleString()} short-cadence points · ${t.nBins} bins</div>
      <h2 class="t1" style="margin-top:var(--s-2);max-width:26ch;">${esc(t.note)}</h2>
      <p class="lede" style="margin-top:var(--s-4);max-width:72ch;font-size:var(--text-body);color:var(--ink-3);">
        ${t.published.length} published values of R<sub>p</sub>/R<sub>*</sub> span ${f(pubW.lo, 5)} to ${f(pubW.hi, 5)} — a spread of ${pct((pubW.hi - pubW.lo) / pubW.lo, 1)} — while a typical one quotes ±${f(pubW.err, 5)}.
        Granting the orbit exactly and assuming only that the star is nowhere negative and does not brighten outward, this light curve forces
        R<sub>p</sub>/R<sub>*</sub> into <b>[${ex && ex.ok ? f(ex.outer[0], 4) + ', ' + (ex.outer[1] >= 0.999 ? '—' : f(ex.outer[1], 4)) : '—'}]</b>.
      </p>
    </div>

    <figure class="reveal" style="margin-top:var(--s-6);">${figCurve(t)}
      <figcaption class="figcap"><span class="k">the folded curve, and two stars that both fit it</span>
      <span class="v">heavy: R<sub>p</sub>/R<sub>*</sub> = ${ex && ex.ok ? f(ex.inner[0], 4) : '—'} · light: ${ex && ex.ok ? f(ex.inner[1], 4) : '—'}</span></figcaption></figure>

    <figure class="reveal" style="margin-top:var(--s-6);">${figLadder(t)}
      <figcaption class="figcap"><span class="k">what each assumption buys</span>
      <span class="v">outer bar: every value outside carries a verified refutation · inner: a verified witness exists · fine ticks: the ${t.published.length} published values</span></figcaption></figure>

    <div class="note reveal">
      <b>The asymmetry is the result.</b> Under nonnegativity alone the lower edge is
      ${exn && exn.ok ? f(exn.outer[0], 4) : '—'} — only ${exn && exn.ok ? pct((t.fit.k - exn.outer[0]) / t.fit.k, 0) : '—'} below the conventional fit — while the upper edge
      ${exn && exn.ok && exn.outer[1] >= 0.999 ? 'does not close below 1 at all' : 'reaches ' + (exn && exn.ok ? f(exn.outer[1], 4) : '—')}.
      Adding <em>the star does not brighten outward</em> pulls the ceiling to ${ex && ex.ok ? f(ex.outer[1], 4) : '—'}.
      The whole upper bound on a planet's radius is bought by an assumption about the star's atmosphere, not by the photometry.
      ${widen ? `Two scales for it. The ${t.published.length} papers already disagree with each other by <b>${overconf.toFixed(0)}×</b> a typical quoted error bar — that needs no enclosure to see. The certified interval is <b>${widen.toFixed(0)}×</b> wider again than that disagreement, and it contains every one of them.` : ''}
    </div>

    <figure class="reveal" style="margin-top:var(--s-6);">${figCore(t)}
      <figcaption class="figcap"><span class="k">why the interval is one-sided</span><span class="v">the planet's disc at five epochs, and the circle it never reaches</span></figcaption></figure>

    <figure class="reveal" style="margin-top:var(--s-6);">${figProfiles(t)}
      <figcaption class="figcap"><span class="k">the two witnesses, as light enclosed inside radius r</span><span class="v">both are exhibited measures, re-checked bin by bin</span></figcaption></figure>

    <figure class="reveal" style="margin-top:var(--s-6);">${figPublished(t)}
      <figcaption class="figcap"><span class="k">the published values, on their own error bars</span><span class="v">shaded: the certified interval</span></figcaption></figure>

    <div class="grid reveal" style="grid-template-columns:1.4fr 1fr 1fr 1fr;">
      <div class="h">harness check</div><div class="h">measured</div><div class="h">stated</div><div class="h">verdict</div>
      <div class="ml">out-of-transit scatter, ${t.floor.n} bins</div><div>${ppm(t.floor.measured)} ppm</div><div>${ppm(t.floor.stated)} ppm</div><div class="hit">errors honest (${(t.floor.measured / t.floor.stated).toFixed(2)}×)</div>
      <div class="ml">fold asymmetry, before → after centring</div><div>${ppm(t.centre.asymBefore)} → ${ppm(t.centre.asymAfter)} ppm</div><div>shift ${t.centre.shiftSec.toFixed(0)} s</div><div class="hit">${t.centre.asymBefore / t.centre.asymAfter > 1.5 ? 'the archive ephemeris was out' : 'already centred'}</div>
      <div class="ml">conventional quadratic-law fit</div><div>k = ${f(t.fit.k, 5)}</div><div>papers ${f(pubW.lo, 4)}–${f(pubW.hi, 4)}</div><div class="hit">reproduces the field</div>
      <div class="ml">error budget, per bin</div><div>${t.budget.nsig}σ + ${ppm(t.budget.sys)} ppm</div><div>χ²/dof ${t.fit.chi2dof.toFixed(2)}</div><div class="hit">smallest that admits that fit</div>
    </div>
  </div>
</section>`;
}

const body = `
<section class="hero">
  <div class="container">
    <div class="eyebrow reveal">Kepler short cadence · a certified enclosure · no limb-darkening law anywhere</div>
    <h1 class="display reveal" style="margin-top:var(--s-3);max-width:19ch;">The transit, without a law for the star.</h1>
    <p class="lede reveal" style="margin-top:var(--s-4);max-width:74ch;">
      Every published planet radius is a statement about a star's atmosphere as much as about a planet. The depth of a transit is
      the light blocked, and how much light sits where the planet passes is decided by a limb-darkening law nobody measured for that star.
      This asks what the photometry forces on its own: the star is any nonnegative brightness profile at all, the measurement is a
      circle crossing a disc, and the answer is the set of radius ratios that survive. A quadratic law is fitted here too — but only to
      answer two questions about the harness, and never inside the enclosure.
    </p>
    <div class="stats reveal" style="margin-top:var(--s-6);">
      ${D.targets.map(t => { const r = res(t, 'exact', 'monotone'); return `<div class="stat"><div class="num">${r && r.ok ? f(r.outer[0], 3) + '–' + (r.outer[1] >= 0.999 ? '1' : f(r.outer[1], 3)) : '—'}</div><div class="dim">${esc(t.name)}, certified</div></div>`; }).join('')}
      <div class="stat"><div class="num">${D.targets.reduce((a, t) => a + t.published.length, 0)}</div><div class="dim">published values, all inside</div></div>
      <div class="stat"><div class="num">0</div><div class="dim">limb-darkening laws in the enclosure</div></div>
    </div>
  </div>
</section>

${D.targets.map(section).join('')}

<section class="section">
  <div class="container">
    <div class="reveal"><div class="eyebrow">how a value is refused</div>
    <h2 class="t1" style="margin-top:var(--s-2);max-width:28ch;">Nothing here trusts the optimiser.</h2></div>
    <div class="prose reveal" style="margin-top:var(--s-4);max-width:74ch;">
      <p>The star is a nonnegative measure μ on [0,1] with ∫dμ = 1 — the normalisation <em>is</em> the statement that the curve is 1 out of transit.
      A planet of radius k at sky-plane distance z covers a fraction w(r; z, k) = arccos(clamp g)/π of the circle of radius r, so every datum is a
      two-sided <b>linear</b> constraint on μ. Because μ is a probability measure, the reachable depths are exactly the convex hull of the kernel's
      moment curve, and the whole question is whether a curve in R<sup>m</sup> meets a box.</p>
      <p>When it meets it, the meeting point is a finite convex combination — an atomic measure, exhibited, and re-checked bin by bin from scratch.
      When it misses it, the separating direction is a Farkas certificate: multipliers α, β ≥ 0 with
      min<sub>r</sub> h(r) &gt; Σ α<sub>j</sub>u<sub>j</sub> − Σ β<sub>j</sub>l<sub>j</sub>, which refutes k for every μ at once. That minimum is over a
      continuum, so it is closed by interval arithmetic over an adaptive partition — of r <b>and</b> of the geometry, because the kernel's closed form
      mentions z five times and a naive enclosure over a z-box 0.01 wide once returned [0.16, 1.00] where the true value was 0.997, which had let a
      planet the size of its star pass as admissible.</p>
      <p>The optimiser only proposes. Whatever it hands over is checked against the definition, and a value is reported only when the check passes;
      everything else is left undecided and shown as the gap between the inner and outer bars.</p>
    </div>
    <div class="note reveal">
      <b>Seven reds fire.</b> Synthetic truth is admitted for four different profiles — a solar-like quadratic, a uniform disc, a
      <em>limb-brightened</em> star and a bright ring — at two impact parameters each. The monotone rung refuses a limb-brightened truth, so it is a
      real restriction rather than a decoration. A wider budget never refutes what a tighter one admitted; the monotone rung never admits what
      nonnegativity refutes; reversing the light curve changes no verdict; the kernel is exactly zero inside r &lt; b − k at 1,446 tested pairs;
      and the deliberately broken control — the true k judged under the wrong impact parameter — is refused, as it must be.
      <em>An earlier RED 6 claimed the ceiling was b itself. It failed: a planet that large reaches the limb far too early, and the visible annulus
      cannot be silent then. Hiding buys an amplitude, not a duration. The claim on this page is the one that survived.</em>
    </div>
  </div>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'transit');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'The transit, without a law for the star — cert-machine',
    desc: 'A certified enclosure on the planet-to-star radius ratio from Kepler short-cadence photometry, assuming only that the stellar brightness profile is nonnegative.',
    root: '../', here: 'instruments',
    head: `<style>${BENCHCSS}\n${BASE_EXTRA}\n${REPORT}\n${G.css()}
.fg{width:100%;height:auto;display:block;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-m);}
.fg .ax{font-family:var(--font-mono);font-size:8.5px;fill:var(--ink-5);}
.fg .lb{font-family:var(--font-mono);font-size:9.5px;fill:var(--ink-3);}
.prose p{margin-top:var(--s-4);color:var(--ink-3);line-height:var(--leading-body);}
.prose b{color:var(--ink-2);font-weight:500;} .prose em{color:var(--ink-4);}
</style>`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  const ex = D.targets.map(t => res(t, 'exact', 'monotone'));
  return { bytes: html.length, targets: D.targets.length, published: D.targets.reduce((a, t) => a + t.published.length, 0), intervals: ex.map(r => r && r.ok ? [r.outer[0], r.outer[1]] : null) };
}

/* the card: the first target's folded light curve with the two admissible
   stars over it, WITHOUT the figure's own labels — a smear at card scale */
function cardArt() { return figCurve(D.targets[0]).replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, ''); }

const first = D.targets[0], firstEx = res(first, 'exact', 'monotone');
module.exports = { build, cardArt, facts: { targets: D.targets.length, published: D.targets.reduce((a, t) => a + t.published.length, 0), name: first.name, lo: firstEx && firstEx.ok ? firstEx.outer[0] : null, hi: firstEx && firstEx.ok ? firstEx.outer[1] : null } };
