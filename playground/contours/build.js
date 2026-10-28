/* build.js — site/instruments/contours/index.html.
   playground/contours/ · cert-machine · 2026-09-12

   The environmental-contour benchmark made touchable: every submitted contour
   drawn over the hourly data it was scored on, the exact counts from the
   ledger beside it, and a decider in the tab — the same bytes as
   instruments/ecbench/geometry.js — for any sea state the reader names.

   NO FICTION ON /instruments: every number below is read from
   certs/ecbench-ledger.json (re-derived by tools/run-ecbench-ledger.js and
   gated by the report), the contour vertices are the literal strings of the
   pinned files, and the density under them is counted here from the pinned
   datasets. What is computed in float — a crossing's position, a density
   cell — is drawn as computed.

   WARRANT v2 (2026-10-28). Two marks were drawn stronger than what they stand
   on, one number was voiced weaker than its standing, and two were cut short:
     · THE EDGE NOBODY DREW. 49 of the 150 files do not repeat their first
       vertex, and the benchmark's test (matplotlib's contains_points) closes
       the path itself. That closing edge is the test's default, not the
       author's — one closure of a vertex list that admits many — so it is
       CHOSEN and drawn dotted, and every count and verdict on such a contour
       holds GIVEN it. It was drawn solid, like the edges the file lists.
     · THE PRINTED COUNT is the organizers' float64 point-in-polygon count:
       COMPUTED, underlined dashed, also where it agrees — agreement is the
       verdict, said in words beside it, and never upgrades the number.
     · THE TABLE dimmed the exact counts of the self-crossing contours. A
       crossing polygon still has an even-odd inside, the winding rule agrees
       on every observation, and the count is decided; the † carries the fact
       about the file, and the number keeps the voice of a decided number.
     · Two expected counts were printed TRUNCATED, not rounded (11.994 as
       "11.9", 18262/36525 as "0.4999"): they are rounded here from the
       ledger's exact rational or certified enclosure, and a rounding the
       enclosure cannot fix refuses the build.
   Nothing here is red, and the page says so once: nobody claimed these files
   were simple polygons, and a printed count that does not reproduce is a
   scalar that differs, not an object that refutes. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const Lb = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const GEO = fs.readFileSync(path.join(ROOT, 'instruments', 'ecbench', 'geometry.js'), 'utf8');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ecbench-ledger.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ec-benchmark', 'claims.json'), 'utf8'));
const fmt = (x) => Number(x).toLocaleString('en-US');
const longT = (ch) => ('ABC'.includes(ch) ? 20 : 50);

/* ROUNDED, NOT TRUNCATED (WARRANT v2, 2026-10-28). The ledger carries each expected count twice: exactly (a rational,
   or an IFORM enclosure [lo, hi]) and as a decimal string, and this page used to print the decimal string cut short —
   `lo.slice(0, 4)` and `total.decimal` — which rounds DOWN: 11.994 printed as 11.9, 5.997 as 5.99, 18262/36525 as
   0.4999. A rational is rounded half-up here in BigInt; an enclosure is rounded only if both of its ends round to the
   same digits, and refuses the build otherwise rather than print a digit the enclosure does not decide. */
function roundRat(exact, k) {
  const [n, d = '1'] = String(exact).split('/'), N = BigInt(n), D = BigInt(d), S = 10n ** BigInt(k);
  if (N < 0n || D <= 0n) throw new Error('contours: roundRat expects a nonnegative rational, got ' + exact);
  const r = (2n * N * S + D) / (2n * D), s = String(r).padStart(k + 1, '0');
  return k ? s.slice(0, -k) + '.' + s.slice(-k) : s;
}
/* a rational printed to k decimals, with ≈ when the decimal is not the number itself */
const approx = (exact, k) => { const [n, d = '1'] = String(exact).split('/'); return ((BigInt(n) * 10n ** BigInt(k)) % BigInt(d) === 0n ? '' : '≈ ') + roundRat(exact, k); };
const decRat = (s) => { const [i, f = ''] = String(s).split('.'); return i + f + '/' + '1' + '0'.repeat(f.length); };
function roundEnc(lo, hi, k) {
  const a = roundRat(decRat(lo), k), b = roundRat(decRat(hi), k);
  if (a !== b) throw new Error('contours: the enclosure [' + lo + ', ' + hi + '] does not decide ' + k + ' decimals; print more, or print the enclosure');
  return a;
}

/* ---- the datasets: a density grid each, counted from the pinned files ---- */
const BOUNDS = { tz: { x0: 0, x1: 20, y0: 0, y1: 14 }, wind: { x0: 0, x1: 36, y0: 0, y1: 20 } };
const NX = 90, NY = 54;
const SOURCE = { A: 'NDBC buoy', B: 'NDBC buoy', C: 'NDBC buoy', D: 'coastDat hindcast', E: 'coastDat hindcast', F: 'coastDat hindcast' };
const datasets = {};
let clipped = 0;
for (const ch of ['A', 'B', 'C', 'D', 'E', 'F']) {
  const p = Lb.readDataset('datasets/' + ch + '.txt'), r = Lb.readDataset('datasets-retained/' + ch + 'r.txt');
  const b = BOUNDS[p.kind];
  const counts = new Array(NX * NY).fill(0);
  let max = 0;
  for (const ds of [p, r]) for (let i = 0; i < ds.n; i++) {
    let ix = Math.floor((ds.u[i] - b.x0) / (b.x1 - b.x0) * NX), iy = Math.floor((ds.h[i] - b.y0) / (b.y1 - b.y0) * NY);
    if (ix >= NX || iy >= NY) clipped++;
    ix = Math.max(0, Math.min(NX - 1, ix)); iy = Math.max(0, Math.min(NY - 1, iy));
    const c = ++counts[iy * NX + ix]; if (c > max) max = c;
  }
  const d = L.datasets[ch];
  datasets[ch] = { kind: p.kind, variables: d.variables, source: SOURCE[ch], n: d.full, provided: d.provided, retained: d.retained, maxHs: d.maxHs.full.hs, maxAt: d.maxHs.full.t,
    grid: { nx: NX, ny: NY, x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, counts, max },
    retainedExpected: { total: approx(L.retainedExpected[ch].total.exact, 4), iform: '≈ ' + roundEnc(L.retainedExpected[ch].iform.lo, L.retainedExpected[ch].iform.hi, 2) } };
}

/* ---- the contours: literal strings, straight from the pinned files ---- */
const contours = {};
const rows = [];
const cmpOf = (r, q) => L.comparisons.find((c) => c.contribution === r.contribution && c.returnPeriod === r.returnPeriod && c.quantity === q && (c.dataset === r.dataset || c.dataset.includes(r.dataset)));
for (const r of L.rows) {
  const K = Lb.readContour(r.file);
  contours[r.id] = { u: K.pts.map((p) => p.u.s), h: K.pts.map((p) => p.h.s) };
  /* crossing positions for the drawing: float, marked computed on the page */
  let crossings = [];
  if (!r.polygon.simple && r.polygon.selfCrossings) {
    const P = K.pts.map((p) => [p.u.v, p.h.v]);
    if (P.length > 1 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) P.pop();
    const n = P.length;
    const inter = (a, b, c, d) => {
      const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
      if (Math.abs(den) < 1e-18) return null;
      const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
      const u = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / den;
      if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    };
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const x = inter(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n]); if (x) crossings.push(x);
    }
    if (crossings.length !== r.polygon.selfCrossings) crossings = [];   /* a float drawing that disagrees with the decided count draws nothing */
  }
  let printed = null;
  if (r.returnPeriod === longT(r.dataset)) { const c = cmpOf(r, 'outside'); if (c) printed = { kind: 'each', value: c.printed, agrees: c.agrees }; }
  else if (r.returnPeriod === 1) { const c = cmpOf(r, 'meanOutside'); if (c) printed = { kind: 'mean', value: c.printed, agrees: c.agrees }; }
  rows.push({ id: r.id, contribution: r.contribution, method: r.method, class: r.class, dataset: r.dataset, returnPeriod: r.returnPeriod,
    counts: r.counts, polygon: { simple: r.polygon.simple, selfCrossings: r.polygon.selfCrossings, distinctVertices: r.polygon.distinctVertices, closed: r.polygon.closed, closingEdgeLength: r.polygon.closingEdgeLength, duplicates: r.polygon.duplicates, maxHs: r.polygon.maxHs },
    maxHsAboveObserved: r.maxHsAboveObserved, crossings: crossings.map((c) => [Number(c[0].toFixed(4)), Number(c[1].toFixed(4))]), on: (r.counts.full.onSample || []).map((o) => ({ u: o.u, h: o.h, t: o.t })), printed });
}
/* the crossing mark's stroke comes from the grammar, never typed: its position is COMPUTED. The closing edge of a file
   that does not repeat its first vertex is the test's default closure, not the author's: CHOSEN, dotted. */
const CROSS_ATTRS = W.attrs(W.COMPUTED, { width: 1.3 });
const CLOSING_ATTRS = W.attrs(W.CHOSEN, { width: 1.6 });
const SPEC = { marks: { cross: CROSS_ATTRS, closing: CLOSING_ATTRS }, order: { datasets: ['A', 'B', 'C', 'D', 'E', 'F'] }, contributions: claims.contributions.map((c) => ({ key: c.key, method: c.method, class: c.class, authors: c.authors })), datasets, contours, rows };

/* ---- the table of the long-return-period contours ---- */
const longRows = rows.filter((r) => r.returnPeriod === longT(r.dataset));
const TABLE = '<table class="ec-tbl"><thead><tr><th>contribution · method</th>' + ['A', 'B', 'C', 'D', 'E', 'F'].map((ch) => '<th>' + ch + ' · ' + longT(ch) + '-yr</th>').join('') + '</tr></thead><tbody>'
  + claims.contributions.map((c) => '<tr><td>' + esc(c.key + ' · ' + c.method + ' · ' + c.class) + '</td>' + ['A', 'B', 'C', 'D', 'E', 'F'].map((ch) => {
    const r = longRows.find((x) => x.contribution === c.key && x.dataset === ch);
    /* every cell is a decided count, in the voice of one: the † says the file crosses itself, the number is not dimmed for it */
    return '<td data-id="' + r.id + '" title="' + esc((r.polygon.simple ? 'a simple polygon' : r.polygon.selfCrossings + ' self-crossings; the count is still decided, and the winding rule agrees') + (r.polygon.closed ? '' : '; closed by the test, not the file')) + '">' + fmt(r.counts.full.out) + (r.counts.full.on ? '+' + r.counts.full.on : '') + (r.polygon.simple ? '' : ' †') + '</td>';
  }).join('') + '</tr>').join('') + '</tbody></table>';
/* the rows are clickable per cell: give each td's row the id through a data attribute on the cell, handled in app.js via closest() */

const S = L.summary;

/* the closing-edge and nearby-reading facts the prose states (WARRANT v2, 2026-10-28), derived here and gated */
const OPEN = L.rows.filter((r) => !r.polygon.closed);
if (OPEN.length !== S.notClosed) throw new Error('contours: ' + OPEN.length + ' open files against the summary\'s ' + S.notClosed + '; the sentence would be false');
const LONGEST_CLOSE = OPEN.reduce((a, r) => (Number(r.polygon.closingEdgeLength) > Number(a.polygon.closingEdgeLength) ? r : a));
if (S.rulesDisagreeTotal !== 0) throw new Error('contours: the even-odd and winding rules disagree on ' + S.rulesDisagreeTotal + ' observations; the page says they never do');
const UNREPRODUCED = S.comparisons - S.exactlyEqual;
const IFORM_ABC = roundEnc(L.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 20).iform.lo, L.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 20).iform.hi, 1);
const IFORM_DEF = roundEnc(L.expected.find((e) => e.dataset === 'D' && e.returnPeriod === 50).iform.lo, L.expected.find((e) => e.dataset === 'D' && e.returnPeriod === 50).iform.hi, 1);

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments &middot; contours &middot; every sea state decided against every contour, in your tab</div>
  <h1>Every hour of sea, against every contour.</h1>
  <p class="lede">An environmental contour is the line an offshore designer reads a fifty-year sea state off. Nine groups drew theirs for six metocean datasets in one
  <a href="https://github.com/ec-benchmark-organizers/ec-benchmark">benchmarking exercise</a>, and the organizers scored each by counting the hourly observations outside it.
  Here every submitted contour is drawn over the ${fmt(Object.values(datasets).reduce((a, d) => a + d.n, 0))} hours it was scored on, with the count re-decided exactly &mdash;
  ${S.exactlyEqual} of the paper's ${S.comparisons} printed numbers reproduce to the integer, ${S.notSimple} of the ${S.contours} contours cross themselves &mdash; and any sea state you click or type is decided
  INSIDE, OUTSIDE or ON by the same code that decided the ledger. The report is <a href="../../reports/ec-benchmark.html">re-decided to the last point</a>.</p>
</div></header>

<section class="wrap">
  <div class="ec-wrap">
    <div>
      <div class="ec-fig"><div class="ec-stage"><canvas id="ec-canvas" aria-hidden="true"></canvas><svg id="ec-svg" viewBox="0 0 ${900} ${540}" role="img" aria-label="The selected contour drawn over a density of the dataset's hourly sea states; click to decide a sea state"></svg></div></div>
      <p class="ec-note">The grey field is a ${NX}&times;${NY} count of the full dataset's hours (provided and retained), darker where more hours sit; it is a drawing. The solid line is the submitted contour, vertex to vertex in the file's order. ${OPEN.length} of the ${S.contours} files do not repeat their first vertex, and for those the benchmark's test closes the path itself, from the last vertex back to the first: an edge the author never listed, the test's default rather than the file's, so it is drawn dotted &mdash; chosen &mdash; and every count and verdict on such a contour holds <em>given</em> it. It runs up to ${Number(LONGEST_CLOSE.polygon.closingEdgeLength).toFixed(2)} m, on contribution ${esc(LONGEST_CLOSE.contribution)}&rsquo;s ${LONGEST_CLOSE.returnPeriod}-year contour for dataset ${LONGEST_CLOSE.dataset}${LONGEST_CLOSE.polygon.closingEdgeIsLongest ? ', where it is the longest edge of the polygon' : ''}. A dashed diamond is a self-crossing: its number is decided, its position is drawn in float. A ring is an observation exactly on the contour. Click anywhere to decide a sea state.</p>
      ${W.legendHtml({ exclude: [W.REFUSED], compact: true })}
    </div>
    <div class="ec-panel">
      <div><label for="ec-ds">dataset</label><select id="ec-ds"></select></div>
      <div><label for="ec-c">contribution</label><select id="ec-c"></select></div>
      <div><label for="ec-t">return period</label><select id="ec-t"></select></div>
      <div class="ec-read">
        <div><div class="k">outside, exact</div><div class="v w-decided" id="r-out"></div><div class="k" id="r-out-note"></div></div>
        <div><div class="k">printed</div><div class="v" id="r-printed"></div><div class="k" id="r-printed-note"></div></div>
        <div><div class="k">outside above threshold</div><div class="v w-decided" id="r-above"></div></div>
        <div><div class="k">retained / provided</div><div class="v w-decided ec-sm" id="r-ret"></div><div class="k" id="r-ret-note"></div></div>
        <div><div class="k">polygon</div><div class="v w-decided small" id="r-poly"></div><div class="k" id="r-poly-note"></div></div>
        <div><div class="k">max Hs on the contour</div><div class="v w-decided small" id="r-max"></div><div class="k" id="r-max-note"></div></div>
      </div>
      <div class="ec-pair">
        <div><label for="ec-h">Hs (m)</label><input id="ec-h" type="text" value="7.0994" inputmode="decimal"></div>
        <div><label for="ec-u">Tz (s) · u₁₀ (m/s)</label><input id="ec-u" type="text" value="9.0347" inputmode="decimal"></div>
        <button id="ec-go">decide</button>
      </div>
      <div class="ec-verdict" id="ec-verdict"></div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2 class="t2">The long-return-period contours, exact counts</h2>
  <p class="lede">Hourly observations outside each 20-year (A&ndash;C) or 50-year (D&ndash;F) contour in the full dataset, decided exactly; a &dagger; marks a contour that is not a simple polygon; +n counts observations exactly on the contour. Click a cell to draw it.</p>
  <div class="ec-scroll">${TABLE}</div>
  <p class="ec-note">For a total-exceedance contour (ISORM, IDSCM, HDCM) the paper's expected count on the full data is 1; for an IFORM contour about ${IFORM_ABC} on A&ndash;C and ${IFORM_DEF} on D&ndash;F &mdash; both certified on the report page. A contour that leaves the low-Hs region outside (the direct-sampling and declustered ones) is exceeded by every calm hour, which is why some cells run to five figures; the paper's threshold column, in the panel above, is the count that matters for a structure.</p>
</section>

<section class="section"><div class="wrap">
  <div class="prose">
    <h2 class="t2">What decides it, and what it is worth</h2>
    <p>The decider in this tab is <code>instruments/ecbench/geometry.js</code>, inlined byte for byte: the even-odd crossing count of a horizontal ray, every predicate the sign of a 2&times;2 determinant computed first in float64 and trusted only under a proved forward-error bound, otherwise re-decided in BigInt at a fixed decimal scale. A click becomes a literal at the data's own resolution (four decimals) and the verdict is about that literal. A point on an edge or a vertex is ON &mdash; the third answer a float test does not have, and the answer for the two observations the ledger found sitting exactly on a submitted contour. On a contour that crosses itself &ldquo;outside&rdquo; has a nearby reading, the nonzero-winding rule, and the ledger decided every observation under both: they disagree on none, on any contour, so no count here rests on the choice.</p>
    <p><strong>It decides geometry, not design.</strong> Which construction an offshore designer should use is a modelling question this page does not touch; a count of exceedances is the benchmark's own metric taken on its own terms; and a self-crossing polygon is a fact about a file, not necessarily about the method that produced the boundary it lists. Nobody claimed these files were simple polygons, so nothing on this page is red: the ${UNREPRODUCED} printed numbers that do not reproduce to the integer are numbers that differ, not objects that refute. The datasets are NDBC's and WDCC's and are drawn here only as a density.</p>
    <p class="mono ink-4 mt5 cmd">
    node tools/fetch-ec-benchmark.js<br>
    node tools/run-ecbench-ledger.js<br>
    node instruments/ecbench/battery.js<br>
    node playground/build.js</p>
  </div>
</div></section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'contours');
  fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(SPEC).replace(/</g, '\\u003c');
  const html = page({
    title: 'Every hour of sea, against every contour — cert-machine',
    desc: 'The environmental-contour benchmark made touchable: every submitted contour over the hourly data it was scored on, the exact counts beside it, and a decider in the tab for any sea state you name.',
    path: '/instruments/contours/',
    css: `${CSS}`,
    body: `<main>${body}</main>`,
    script: `<script id="ec-spec" type="application/json">${json}</script>\n<script>${GEO}</script>\n<script>${APP.replace(/\.ec-tbl tr\[data-id\]/g, '.ec-tbl td[data-id]')}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, contours: L.rows.length, exact: S.exactlyEqual, comparisons: S.comparisons, notSimple: S.notSimple, clipped };
}

/* the card: the many-crossing contour, drawn as its file lists it */
function cardArt() {
  const r = L.rows.find((x) => x.id === 'vanem_DirectSampling/A/20');
  const V = contours[r.id];
  const b = BOUNDS.tz, S0 = 560;
  const px = (u) => 30 + (u - b.x0) / (b.x1 - b.x0) * (S0 - 60), py = (h) => S0 - 30 - (h - b.y0) / (b.y1 - b.y0) * (S0 - 60);
  const d = V.u.map((u, i) => (i ? 'L' : 'M') + px(Number(u)).toFixed(1) + ' ' + py(Number(V.h[i])).toFixed(1)).join(' ') + ' Z';
  const cr = rows.find((x) => x.id === r.id).crossings;
  return `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="A submitted twenty-year contour drawn as its file lists its vertices: a loop that crosses itself ${r.polygon.selfCrossings} times, each crossing marked.">`
    + `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`
    + cr.map((c) => { const x = px(c[0]), y = py(c[1]); return `<path d="M${x.toFixed(1)} ${(y - 9).toFixed(1)} L${(x + 9).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 9).toFixed(1)} L${(x - 9).toFixed(1)} ${y.toFixed(1)} Z" ${W.attrs(W.COMPUTED, { width: 1.6 })}/>`; }).join('')
    + '</svg>';
}

module.exports = { build, cardArt, facts: { contours: L.rows.length, exact: S.exactlyEqual, comparisons: S.comparisons, notSimple: S.notSimple } };
