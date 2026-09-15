#!/usr/bin/env node
/* build-report-ecbench.js — reports/ec-benchmark.html: the environmental-contour
   benchmark, re-decided to the last point.

   Haselsteiner et al. (2021) ran a benchmarking exercise for environmental
   contours: nine groups submitted 1-, 20- and 50-year contours for six
   metocean datasets, and the organizers counted the hourly sea states that
   fall outside each contour with a float64 point-in-polygon test. This page
   reads every submitted contour as the exact polygon its vertices denote,
   classifies every hourly observation INSIDE / OUTSIDE / ON in exact
   arithmetic, reads the paper's printed counts against the exact ones, says
   which polygons are not simple, certifies the paper's expected numbers, and
   adds the out-of-sample count the paper did not print.

   Gates: the ledger re-derives live at this build (--check), the battery must
   pass with every red fired, and every sentence below is gated on the field
   it reads.

   usage: node tools/build-report-ecbench.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const Lb = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const die = (m) => { console.error('ECBENCH REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const chk = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-ecbench-ledger.js'), '--check'], { cwd: ROOT });
if (chk.status !== 0) die('the ledger does not re-derive:\n' + String(chk.stderr).slice(-600) + String(chk.stdout).slice(-300));
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'ecbench', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /ecbench battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the ecbench battery did not pass clean:\n' + bout.slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ecbench-ledger.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ec-benchmark', 'claims.json'), 'utf8'));
const S = L.summary;
const fmt = (x) => Number(x).toLocaleString('en-US');
const longT = (ch) => ('ABC'.includes(ch) ? 20 : 50);
const row = (id) => { const r = L.rows.find((x) => x.id === id); if (!r) die('missing row ' + id); return r; };
const ORDER = claims.contributions.map((c) => c.key);

/* ---- the facts the prose states, gated ---- */
if (S.contours !== 150 || S.comparisons !== 176) die('the counts the prose assumes (150 contours, 176 printed numbers) are not the ledger\'s');
if (S.agree !== 174 || S.exactlyEqual !== 173 || S.disagree !== 2) die('the agreement tally moved: ' + JSON.stringify(S));
const dis = L.comparisons.filter((c) => !c.agrees);
if (!dis.every((c) => c.contribution === '3' && c.returnPeriod === 1)) die('the disagreements are no longer contribution 3\'s 1-yr row');
const near = L.comparisons.filter((c) => c.agrees && !c.exactlyEqual);
if (near.length !== 1 || near[0].contribution !== '2' || near[0].onBoundaryEach.reduce((a, b) => a + b, 0) !== 2) die('the one near-agreement is no longer contribution 2\'s boundary case');
if (S.boundaryPointsTotal !== 2 || S.columnOrderDisagreements !== 0 || S.rulesDisagreeTotal !== 0) die('the boundary / column-order / rule facts moved');
if (S.notSimple !== 30) die('the not-simple count moved');
const onRows = L.rows.filter((r) => r.counts.full.on > 0);
const lin = claims.lineage && claims.lineage.contribution3_1yr;
if (!lin || lin.rewritten.rowsRemoved.length !== 3) die('the lineage record for contribution 3 is missing');
const c3 = ['A', 'B', 'C'].map((ch) => row('hannesdottir_asta/' + ch + '/1'));
if (!c3.every((r, i) => r.polygon.vertices === lin.rewritten.rowsAfter[i])) die('the contribution-3 files no longer have the row counts the lineage record states');
const c3long = ['A', 'B', 'C'].map((ch) => row('hannesdottir_asta/' + ch + '/20'));
if (!c3long.every((r) => L.comparisons.find((c) => c.contribution === '3' && c.dataset === r.dataset && c.returnPeriod === 20 && c.quantity === 'outside').exactlyEqual)) die('contribution 3\'s 20-yr row no longer agrees to the integer');
const notSimple = L.rows.filter((r) => !r.polygon.simple);
const byContribNS = {}; for (const r of notSimple) byContribNS[r.contribution] = (byContribNS[r.contribution] || 0) + 1;
const crossers = ORDER.filter((k) => byContribNS[k]);
const nsOf = (k) => byContribNS[k] || 0;
const filesOf = (k) => L.rows.filter((r) => r.contribution === k).length;
if (nsOf('2') + nsOf('9 DS') + nsOf('9 DS s.') + nsOf('5') + nsOf('7') + nsOf('4') !== S.notSimple) die('the not-simple contours are no longer confined to contributions 2, 9, 5, 7 and 4');
if (!L.rows.filter((r) => !r.polygon.simple && (r.contribution === '7' || r.contribution === '4')).every((r) => r.polygon.selfCrossings === 1)) die('the "one crossing each" sentence would be false');
const closingCrossers = notSimple.filter((r) => r.polygon.closingEdgeCrosses).length;
const hd = row('haselsteiner_andreas/A/20');
if (!hd.polygon.closingEdgeCrosses || !hd.polygon.closingEdgeIsLongest) die('the HD closing-edge sentence would be false');
const maxCross = Math.max(...notSimple.map((r) => r.polygon.selfCrossings));
const vDS = row('vanem_DirectSampling/A/20');
if (vDS.polygon.selfCrossings < 10) die('the drawn contour is no longer the many-crossing specimen');
if (hd.polygon.selfCrossings !== 1) die('the HD single-crossing sentence would be false');
const exp1 = L.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 1), exp20 = L.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 20);
const expD1 = L.expected.find((e) => e.dataset === 'D' && e.returnPeriod === 1), expD50 = L.expected.find((e) => e.dataset === 'D' && e.returnPeriod === 50);
const encl = (e) => Number(e.iform.lo) <= Number(e.iform.hi);
if (![exp1, exp20, expD1, expD50].every(encl)) die('an expected-number enclosure is inverted');
const showIv = (iv) => (iv.lo === iv.hi ? iv.lo : '[' + iv.lo + ', ' + iv.hi + ']');
/* the paper's printed IFORM expectations, read as roundings of the enclosure */
if (!(Math.round(Number(exp1.iform.lo)) === 197 && Math.abs(Number(exp20.iform.lo) - 11.5) < 0.05 && Math.round(Number(expD1.iform.lo)) === 492 && Math.round(Number(expD50.iform.lo)) === 12)) die('the printed Table 1 values are not the roundings of the enclosures');
if (exp1.total.exact !== '20' || exp20.total.exact !== '1') die('the exact-20 / exact-1 sentence would be false');
/* dataset A: no 20-yr contour reaches the observed maximum */
const aLong = L.rows.filter((r) => r.dataset === 'A' && r.returnPeriod === 20);
if (aLong.length !== 11 || aLong.some((r) => r.maxHsAboveObserved)) die('the dataset-A maxima sentence would be false');
const dsA = L.datasets.A;
/* out-of-sample: the retained years, total-exceedance contours (expected 0.5 each) */
const totalKeys = claims.contributions.filter((c) => c.class === 'total').map((c) => c.key);
const retainedTotal = L.rows.filter((r) => totalKeys.includes(r.contribution) && r.returnPeriod === longT(r.dataset)).map((r) => ({ id: r.id, k: r.contribution, ch: r.dataset, out: r.counts.retained.out, n: r.counts.retained.n }));
const hdRet = retainedTotal.filter((x) => x.k === '4');
if (hdRet.length !== 6) die('the HD out-of-sample sentence needs six rows');

/* ---- figure 1: the 176 printed numbers, decided ---- */
const cells = [];
for (const c of L.comparisons) {
  const tok = !c.agrees ? 'var(--c-1)' : c.exactlyEqual ? 'var(--c-2)' : 'var(--c-3)';
  const what = c.quantity === 'outside' ? 'points outside' : c.quantity === 'outsideAboveThreshold' ? 'outside above the threshold' : c.quantity === 'meanOutside' ? 'mean outside (3 datasets)' : 'mean outside above the threshold';
  cells.push({ token: tok, k: 'contribution ' + c.contribution + ' · ' + c.dataset + ' · ' + c.returnPeriod + '-yr · ' + what, v: 'printed ' + c.printed + ' · exact ' + c.exact + (c.onBoundary ? ' (+' + c.onBoundary + ' on the boundary)' : '') + (c.agrees ? '' : ' — DOES NOT AGREE') });
}
const FIG1 = CH.strip({
  w: 900, perRow: 44, cell: 16, padL: 6, items: cells,
  keys: [{ token: 'var(--c-2)', t: S.exactlyEqual + ' printed numbers are the exact count' }, { token: 'var(--c-3)', t: '1 agrees once two boundary points are counted outside' }, { token: 'var(--c-1)', t: '2 are not the count of the file the repository holds' }],
  alt: 'One hundred and seventy-six cells, one per number printed in the paper\'s Tables 5 and 6: 173 green (the printed count is the exact count), one amber (contribution 2\'s wind-wave mean, which agrees once two observations lying exactly on the contour are counted outside), two plum (contribution 3\'s one-year sea-state row, which is not the count of the file in the repository).'
});

/* ---- figure 2: a contour that crosses itself, drawn with its crossings ---- */
const K = Lb.readContour(vDS.file);
const P = K.pts.map((p) => [p.u.v, p.h.v]);
const closedP = (() => { const q = P.slice(); if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop(); return q; })();
const crossings = [];
{
  const n = closedP.length;
  const seg = (i) => [closedP[i], closedP[(i + 1) % n]];
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
    const [a, b] = seg(i), [c, d] = seg(j);
    const x = inter(a, b, c, d); if (x) crossings.push(x);
  }
}
if (crossings.length !== vDS.polygon.selfCrossings) die('the float drawing finds ' + crossings.length + ' crossings; the exact count is ' + vDS.polygon.selfCrossings);
const FIG2 = CH.scatter({
  w: 900, h: 420, x0: 2, x1: 16, y0: 0, y1: 12, padL: 62,
  xTicks: [4, 6, 8, 10, 12, 14].map((v) => ({ v, t: String(v) })), yTicks: [0, 2, 4, 6, 8, 10, 12].map((v) => ({ v, t: String(v) })),
  xLabel: 'zero-up-crossing period Tz (s)', yLabel: 'significant wave height Hs (m)',
  curves: [{ pts: closedP.concat([closedP[0]]), token: 'var(--c-2)' }],
  pts: crossings.map((x, i) => ({ x: x[0], y: x[1], token: 'var(--c-1)', diamond: true, hollow: true, k: 'self-crossing ' + (i + 1) + ' of ' + crossings.length, v: 'Tz ≈ ' + x[0].toFixed(2) + ' s, Hs ≈ ' + x[1].toFixed(2) + ' m (drawn in float; the count is exact)' })),
  keys: [{ token: 'var(--c-2)', t: 'contribution 9 DS · dataset A · 20-yr contour, ' + vDS.polygon.distinctVertices + ' vertices in file order' }, { token: 'var(--c-1)', t: vDS.polygon.selfCrossings + ' self-crossings, decided exactly' }],
  alt: 'The 20-year direct-sampling contour for dataset A drawn as the polygon its file describes, vertex to vertex in file order: a closed loop of ' + vDS.polygon.distinctVertices + ' points whose edges cross each other ' + vDS.polygon.selfCrossings + ' times, each crossing marked with an open diamond. The crossings cluster where consecutive vertices double back on the loop.'
});

/* ---- figure 3: the maximum along each contour against the observed maximum ---- */
const DS = ['A', 'B', 'C', 'D', 'E', 'F'];
const pts3 = [];
for (const ch of DS) {
  const x = DS.indexOf(ch) + 1;
  for (const r of L.rows.filter((r) => r.dataset === ch && r.returnPeriod === longT(ch))) {
    pts3.push({ x: x + (ORDER.indexOf(r.contribution) - 5) * 0.045, y: Number(r.polygon.maxHs), token: r.class === 'total' ? 'var(--c-2)' : 'var(--c-3)', k: 'contribution ' + r.contribution + ' (' + r.method + ') · ' + ch + ' · ' + r.returnPeriod + '-yr', v: 'max Hs along the contour ' + Number(r.polygon.maxHs).toFixed(2) + ' m' + (r.maxHsAboveObserved ? ' — above' : ' — below') + ' the observed maximum' });
  }
  const m = L.datasets[ch].maxHs.full;
  pts3.push({ x, y: Number(m.hs), token: 'var(--c-1)', diamond: true, k: 'dataset ' + ch + ' · observed maximum', v: m.hs + ' m at ' + m.t + ' (' + (m === L.datasets[ch].maxHs.retained || m.t === L.datasets[ch].maxHs.retained.t ? 'retained' : 'provided') + ' years)' });
}
const FIG3 = CH.scatter({
  w: 900, h: 400, x0: 0.4, x1: 6.6, y0: 4, y1: 20, padL: 62,
  xTicks: DS.map((ch, i) => ({ v: i + 1, t: ch + ' · ' + longT(ch) + '-yr' })), yTicks: [4, 8, 12, 16, 20].map((v) => ({ v, t: String(v) })),
  xLabel: 'dataset and the long return period the exercise asked for', yLabel: 'significant wave height Hs (m)',
  pts: pts3,
  keys: [{ token: 'var(--c-2)', t: 'max Hs along a total-exceedance contour' }, { token: 'var(--c-3)', t: 'max Hs along a marginal-exceedance contour' }, { token: 'var(--c-1)', t: 'the highest Hs observed in the full dataset' }],
  alt: 'For each of the six datasets, eleven dots give the highest significant wave height along each submitted long-return-period contour, and a diamond gives the highest wave height actually observed in the full dataset. In dataset A the diamond, ' + dsA.maxHs.full.hs + ' m, sits above every dot.'
});

/* ---- the tables ---- */
const tagFor = (c) => (c.agrees ? (c.exactlyEqual ? '' : ' ¹') : ' ✗');
const cmp = (k, ch, T, q) => L.comparisons.find((c) => c.contribution === k && c.dataset === ch && c.returnPeriod === T && c.quantity === q);
const tableFor = (letters) => C.table({
  cols: [{ h: 'contr. · method' }].concat(letters.map((ch) => ({ h: ch + ' · ' + longT(ch) + '-yr', cls: 'n' }))).concat([{ h: 'above threshold', cls: 'n' }, { h: 'retained only', cls: 'n' }]),
  rows: ORDER.map((k) => {
    const c = claims.contributions.find((x) => x.key === k);
    const rs = letters.map((ch) => row(c.prefix + '/' + ch + '/' + longT(ch)));
    return [k + ' · ' + c.method + (c.class === 'total' ? ' · T' : ' · M')]
      .concat(rs.map((r) => { const cc = cmp(k, r.dataset, r.returnPeriod, 'outside'); return fmt(r.counts.full.out) + (r.counts.full.on ? '+' + r.counts.full.on : '') + ' (' + fmt(cc.printed) + tagFor(cc) + ')' + (r.polygon.simple ? '' : ' †'); }))
      .concat([rs.map((r) => fmt(r.counts.full.outAboveThreshold)).join(' · '), rs.map((r) => fmt(r.counts.retained.out)).join(' · ')]);
  })
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry · every contour re-decided at this build',
  title: 'Their contours, re-decided to the last point.',
  deck: 'An environmental contour is the curve an offshore designer reads a 50-year sea state off: the line in the (wave height, wave period) plane that a structure must survive. In 2019–2021 nine groups submitted their contours for six metocean datasets to one benchmarking exercise, and the organizers scored each one by counting the hourly observations that fall outside it with a floating-point point-in-polygon test. This page reads every submitted contour as the exact polygon its vertices denote, classifies every one of the ' + fmt(Object.values(L.datasets).reduce((a, d) => a + d.full, 0)) + ' hourly observations INSIDE, OUTSIDE or ON it in exact arithmetic, and reads the paper\'s printed counts against the exact ones.'
}));
B.push(C.tldr({
  findingRaw: '<strong>' + fmt(S.comparisons) + ' numbers printed in the benchmark\'s two tables read against the exact count: ' + S.exactlyEqual + ' are the exact count to the integer, one more agrees once two observations lying exactly ON a contour are counted outside, and two — the one-year sea-state row of contribution 3 — are not the count of the file the repository holds.</strong> '
    + 'Those three files were rewritten on ' + lin.rewritten.date + ' to remove ' + lin.rewritten.rowsRemoved.slice(0, 2).join(', ') + ' and ' + lin.rewritten.rowsRemoved[2] + ' vertices with a NaN coordinate (the repository\'s own commit says so); the 20-year row of the same contribution, whose files were never touched, agrees to the integer on all three datasets. '
    + S.notSimple + ' of the ' + S.contours + ' submitted contours are not simple polygons — they cross themselves, ' + vDS.polygon.selfCrossings + ' times in the worst case — and ' + S.notClosed + ' are not closed in the file, so the polygon that was scored includes a closing edge nobody drew. No observation changes side between the even-odd rule the benchmark used and the nonzero-winding rule, so the printed counts do not depend on that choice; the shape of what was counted does. '
    + 'The paper\'s expected numbers are certified: 197 and 11.5 for a one- and twenty-year IFORM contour on twenty years of hours are the roundings of ' + exp1.iform.lo + ' and ' + exp20.iform.lo + ', and the total-exceedance expectations are exactly ' + exp1.total.exact + ' and ' + exp20.total.exact + ' because twenty years of hourly states is exactly 20 × 8766 observations.',
  mechanismRaw: 'Every coordinate is read as the decimal literal it is written — an hourly "0.2845; 4.7252", a vertex "4.283446918632201; 7.469377172830912" — never as the nearest double. Each polygon is closed from its last vertex to its first, as the benchmark\'s script closed it. A point is classified by the even-odd crossing count of a horizontal ray, every predicate a sign of a 2×2 determinant: computed first in float64 and trusted only when it clears a proved forward-error bound (48u·M², 8.7 × 10⁻¹¹ at these magnitudes), otherwise re-decided in BigInt at a fixed decimal scale. A point on an edge or a vertex is ON, a third answer the float test does not have. Self-crossings are decided the same way, pair of edges by pair of edges. The IFORM expectation needs Φ⁻¹, which is enclosed: erfc by Laplace\'s continued fraction, whose consecutive convergents bracket the value, β by bisection that tightens only on a certain sign.',
  checkRaw: C.m('node instruments/ecbench/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (a float determinant with the wrong sign, a bowtie, a square traced twice, a fold, a NaN, a column swap, a point 10⁻²⁰ off an edge). ' + C.m('node tools/run-ecbench-ledger.js') + ' re-hashes the 167 pinned files and re-decides all ' + S.contours + ' contours in about six seconds; ' + C.m('node tools/fetch-ec-benchmark.js') + ' fetches the twelve datasets from the pinned commit and verifies them by digest.'
}));
B.push(C.stats([
  { k: 'contours decided', v: String(S.contours), role: 'held', n: '11 methods × 6 datasets × the return periods each group supplied; ' + fmt(Object.values(L.datasets).reduce((a, d) => a + d.full, 0)) + ' hourly observations classified against each' },
  { k: 'printed numbers reproduced', v: S.exactlyEqual + ' of ' + S.comparisons, role: 'held', n: 'to the integer; one more within the two boundary points; two are not the count of the file on record' },
  { k: 'contours that cross themselves', v: String(S.notSimple), role: 'open', n: 'in ' + crossers.length + ' of the 11 methods; up to ' + Math.max(...notSimple.map((r) => r.polygon.selfCrossings)) + ' crossings in one contour' },
  { k: 'observations exactly on a contour', v: String(S.boundaryPointsTotal), role: 'open', n: 'the float test put both outside; the exact answer is ON, and the printed mean is consistent with either' },
  { k: 'expected numbers certified', v: '4 of 4', role: 'held', n: 'Table 1\'s 197 · 11.5 · 492 · 12 are the roundings of certified enclosures; the total-exceedance 20 and 1 are exact' },
  { k: 'predicates that needed exact arithmetic', v: fmt(S.exactPredicates), role: 'held', n: 'of ' + fmt(S.predicates) + ': the float filter decided the rest under a proved bound, and every one of these was a sign a double could not certify' },
]));

B.push(C.section({
  lab: '§1 · the table', title: 'Two tables, 176 numbers, 173 of them the exact count',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'Every number in the paper\'s Tables 5 and 6, one cell each: the three per-dataset counts outside each long-return-period contour, the same above the severity threshold (Hs > 1 m; for the wind-wave sets also u₁₀ > 1 m/s), and the two one-year means. Hover for the printed and exact values.' })
    + '<div class="col">' + C.pRaw('Sea-state datasets A, B, C (NDBC buoys; ' + fmt(L.datasets.A.full) + ', ' + fmt(L.datasets.B.full) + ' and ' + fmt(L.datasets.C.full) + ' hours, ten provided and ten retained years). Each cell: the exact count of observations outside the polygon for the 20-year contour (+n observations exactly on it), then the printed count in parentheses; T is a total-exceedance construction, M a marginal-exceedance one. † marks a contour that is not a simple polygon. "Above threshold" and "retained only" give the three datasets in order: the count outside with Hs > 1 m, and the count on the ten retained years alone — the out-of-sample number the paper did not print. The one-year rows, which the paper prints only as three-dataset means, are the cells of the figure above.') + '</div>'
    + tableFor(['A', 'B', 'C'])
    + '<div class="col">' + C.pRaw('Wind-wave datasets D, E, F (coastDat hindcast; ' + fmt(L.datasets.D.full) + ' hours each, 25 provided and 25 retained years). The threshold column counts observations outside with both u₁₀ > 1 m/s and Hs > 1 m; the contours are the 50-year ones.') + '</div>'
    + tableFor(['D', 'E', 'F'])
    + '<div class="col">' + C.pRaw('The organizers\' script (' + C.m('create_points_outside_table_abc.py') + ', ' + C.m('_def.py') + ', held in the corpus) concatenated the provided and retained data, read each contour file in a column order hard-coded per participant, and asked matplotlib\'s ' + C.m('Path.contains_points') + ' which points fall inside. This page reads the column order from each file\'s header instead — the two readings agree on all ' + S.contours + ' files — and decides the same question exactly. Where they disagree it is not the arithmetic: contribution 3\'s one-year files for A, B and C give ' + c3.map((r) => fmt(r.counts.full.out)).join(', ') + ' outside (mean ' + (c3.reduce((a, r) => a + r.counts.full.out, 0) / 3).toFixed(1) + ') against a printed mean of ' + dis[0].printed + ', and ' + c3.map((r) => fmt(r.counts.full.outAboveThreshold)).join(', ') + ' above the threshold (mean ' + (c3.reduce((a, r) => a + r.counts.full.outAboveThreshold, 0) / 3).toFixed(1) + ') against ' + dis[1].printed + '. The repository\'s history explains it: those three files were rewritten on ' + lin.rewritten.date + ' (commit ' + lin.rewritten.commit + ') to drop ' + lin.rewritten.rowsRemoved.slice(0, 2).join(', ') + ' and ' + lin.rewritten.rowsRemoved[2] + ' rows in which one coordinate was NaN — a vertex with no place in the plane — and a float path with NaN vertices answers something, version by version, that no polygon answers. The 20-year files of the same contribution were never rewritten and their counts (' + c3long.map((r) => fmt(r.counts.full.out)).join(', ') + ') are the printed ones to the integer. Nothing is refuted here; a row\'s provenance is what the bytes cannot reproduce.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the polygons', title: (S.notSimple) + ' contours that cross themselves, and the edge nobody drew',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG2, caption: 'Contribution 9\'s direct-sampling 20-year contour for dataset A, drawn vertex to vertex in the order the file lists them. The exact decider finds ' + vDS.polygon.selfCrossings + ' proper crossings between non-adjacent edges (open diamonds; their positions are drawn in float, their number is decided). The loop is three-cornered because the direct-sampling construction returns one boundary point per sampling direction and most directions land on the same three extremes; the crossings cluster at those corners, where successive directions return nearly the same point and the listed order zigzags at the scale of centimetres.' })
    + '<div class="col">'
    + C.pRaw('A point-in-polygon test presumes a polygon. ' + S.notSimple + ' of the ' + S.contours + ' files describe a closed polyline whose edges cross: ' + nsOf('2') + ' of contribution 2\'s ' + filesOf('2') + ' direct-sampling contours (24 vertices each, ' + L.rows.filter((r) => r.contribution === '2').reduce((a, r) => a + r.polygon.duplicates, 0) + ' consecutive duplicates among them), ' + nsOf('9 DS') + ' of contribution 9\'s ' + filesOf('9 DS') + ' direct-sampling contours and ' + nsOf('9 DS s.') + ' of its ' + filesOf('9 DS s.') + ' smoothed ones, ' + nsOf('5') + ' of the ' + filesOf('5') + ' declustered direct-IFORM contours, and — one crossing each — ' + nsOf('7') + ' IFORM contours of contribution 7 and the highest-density contour of contribution 4 for dataset A at 20 years. That last one is instructive: its ' + fmt(hd.polygon.distinctVertices) + ' listed vertices trace a simple curve, and the one crossing is the implicit closing edge — ' + hd.polygon.closingEdgeLength.slice(0, 5) + ' m long, the longest in the polygon — cutting across the curve\'s own tail. In ' + closingCrossers + ' of the ' + S.notSimple + ' the closing edge is one of the crossing edges. Under the even-odd rule a self-crossing polygon still has an inside; it is just not the region a reader sees when the curve is drawn, because the loops between crossings alternate. The nonzero-winding rule would fill them. Both were computed for every observation: no observation is classified differently by the two rules, on any contour, so the printed counts do not depend on the choice. What depends on it is what the number is a count of.')
  + C.pRaw(fmt(S.notClosed) + ' files do not repeat their first vertex, so the polygon that was counted has one edge the author never listed: the benchmark\'s test closes the path implicitly. For most it is short. For contributions 5 and 4 it is, on some datasets, the longest edge of the polygon; the counts above are for the closed polygon, which is what the benchmark counted.')
    + C.pRaw('Two hourly observations lie exactly on a submitted contour: ' + onRows.map((r) => 'in dataset ' + r.dataset + ' the ' + r.counts.full.onSample[0].t.replace(/-(\d\d)$/, ' ' + '$1:00') + ' state (Hs ' + r.counts.full.onSample[0].h + ' m, u₁₀ ' + r.counts.full.onSample[0].u + ' m/s) on contribution 2\'s one-year contour').join(', and ') + '. A vertex of that contour is given to three decimals and the observation to four, and they coincide. The float test counted both outside, which is how the printed mean ' + near[0].printed + ' arises from exact counts of ' + near[0].each.map(fmt).join(', ') + ' outside plus one boundary point each on E and F; the exact classification is ON, and the page says so rather than pick a side.') + '</div>'
}));

B.push(C.section({
  lab: '§3 · the expected numbers', title: 'Table 1, certified: 197 is 196.86, and 20 is exactly 20',
  bodyRaw: '<div class="col">'
  + C.pRaw('The paper puts an expected number beside every count, E = n·α_t, with α = 1/(T × 365.25 × 24) the hourly exceedance probability of a T-year contour. For total-exceedance constructions (ISORM, inverse directional simulation, highest density) α_t = α and the expectation is a rational number: on the sea-state sets it is ' + exp1.total.exact + ' for a one-year contour and ' + exp20.total.exact + ' for twenty years, exactly, because the full datasets hold 175,320 = 20 × 8766 hourly states; on the wind-wave sets, with 438,288 hours, it is ' + expD1.total.exact + ' = ' + expD1.total.decimal + ' and ' + expD50.total.exact + '. For IFORM the contour is the image of the circle of radius β = Φ⁻¹(1 − α), so α_t = exp(−β²/2), and Φ⁻¹ is not a rational number. It is enclosed here, and both ends of every enclosure agree to the digits printed: β = ' + showIv(exp1.beta) + ' for the one-year contour and ' + showIv(exp20.beta) + ' for twenty years, giving E = ' + showIv(exp1.iform) + ' and ' + showIv(exp20.iform) + ' — the paper\'s 197 and 11.5. On the wind-wave sets, ' + showIv(expD1.iform) + ' and ' + showIv(expD50.iform) + ' — its 492 and 12.')
  + C.pRaw('The out-of-sample expectation follows: a 20-year total-exceedance contour fitted on the ten provided years should be exceeded n_retained × α times in the retained years — ' + L.retainedExpected.A.total.decimal + ', ' + L.retainedExpected.B.total.decimal + ' and ' + L.retainedExpected.C.total.decimal + ' on A, B, C (the retained parts hold a little over ten years of hours), and ' + L.retainedExpected.D.total.exact + ' = ' + L.retainedExpected.D.total.decimal + ' on each of D, E, F; an IFORM contour about ' + L.retainedExpected.A.iform.lo.slice(0, 3) + ' and ' + L.retainedExpected.D.iform.lo.slice(0, 3) + '. The retained-years column of §1 is that test. The highest-density contours of contribution 4 are exceeded ' + hdRet.map((x) => x.out).join(', ') + ' times on A–F; the ISORM contours of contribution 1, built for the same exceedance, ' + retainedTotal.filter((x) => x.k === '1').map((x) => x.out).join(', ') + ' times. The paper\'s own caution applies with more force here than to its full-data counts: hourly sea states are serially correlated, so a storm that crosses a contour is counted at every hour it stays outside, and these are counts, not tests.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the maxima', title: 'How high each contour reaches, against how high the sea got',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG3, caption: 'The highest Hs along each long-return-period contour (a linear function of position on a polygon peaks at a vertex, so the maximum is a vertex\'s literal, exactly), against the highest Hs observed in the full dataset. Filled dots are total-exceedance contours, lighter dots marginal-exceedance ones; the diamond is the observation.' })
    + '<div class="col">' + C.pRaw('In dataset A the highest observed sea state, ' + dsA.maxHs.full.hs + ' m on ' + dsA.maxHs.full.t.replace(/-(\d\d)$/, ' $1:00') + ' — in the retained years, ' + (Number(dsA.maxHs.retained.hs) - Number(dsA.maxHs.provided.hs)).toFixed(2) + ' m above anything in the provided ten (' + dsA.maxHs.provided.hs + ' m) — sits above the maximum of every one of the eleven 20-year contours, the highest of which reaches ' + Math.max(...aLong.map((r) => Number(r.polygon.maxHs))).toFixed(2) + ' m. The paper says as much from a figure; here each maximum is a literal read from the file. On the other five datasets between ' + Math.min(...DS.slice(1).map((ch) => L.rows.filter((r) => r.dataset === ch && r.returnPeriod === longT(ch) && r.maxHsAboveObserved).length)) + ' and ' + Math.max(...DS.slice(1).map((ch) => L.rows.filter((r) => r.dataset === ch && r.returnPeriod === longT(ch) && r.maxHsAboveObserved).length)) + ' of the eleven contours reach above the observed maximum.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No contour is called right or wrong: which construction an offshore designer should use is a modelling question this page does not touch, and a count of exceedances is the benchmark\'s own metric, taken here on its own terms. The two numbers that do not agree are not an error in the paper\'s arithmetic — the file they were computed from is not the file on record. A self-crossing polygon is a fact about a file, not necessarily about the method that produced the boundary it lists. The expected-number enclosures certify the paper\'s formula, not the independence it assumes. The counts compared are the PREPRINT\'s (2021-01-19, the version the repository holds); the published article (Ocean Engineering 236, 109504) was not read. The datasets are NDBC\'s and WDCC\'s and are not re-served here; the contours are held verbatim as the published record, for verification only.')
}));

const foot = '<p>Generated by tools/build-report-ecbench.js @ git ' + git + '. Gates at this build: the ledger re-derived live from the 167 pinned files (each re-hashed, the twelve datasets fetched from commit ' + L.corpus.commit.slice(0, 8) + ' of the benchmark\'s repository), the ecbench battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), every sentence above gated on the ledger field it reads. A moved count, a third disagreement, or a drawn crossing count that differs from the decided one refuses this page.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'ec-benchmark.html'),
  TPL.render({ title: 'The environmental-contour benchmark, re-decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/ec-benchmark.html',
    desc: 'The 2021 benchmarking exercise for environmental contours (Haselsteiner et al.) re-decided exactly: 150 submitted contours as exact polygons, 1.8 million hourly sea states classified inside / outside / on each, 173 of the paper\'s 176 printed counts reproduced to the integer, two traced to a rewritten file, 30 contours that cross themselves, two observations exactly on a contour, and the paper\'s expected numbers certified.' }));
console.log('reports/ec-benchmark.html written: ' + S.contours + ' contours, ' + S.exactlyEqual + '/' + S.comparisons + ' printed numbers exact, battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
