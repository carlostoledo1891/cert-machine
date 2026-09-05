/* make-page-data.js — the pipeline. Emits out/page.json; the builder only reads.
     node experiments/occultation/make-page-data.js
 *
 * Reads the transcribed chord table, runs the envelope at a ladder of error
 * budgets and with the negative stations in place and moved away, and records
 * what each rung buys. There is no optimiser and nothing converges: every area
 * here is an exact rational, printed as a decimal only at the last step.
 */
'use strict';
const fs = require('fs'), path = require('path');
const C = require('./chords.js');
const Q = require('../interval/rational.js');
const HERE = __dirname;

function loadCsv(file) {
  const txt = fs.readFileSync(path.join(HERE, 'data', file), 'utf8');
  const meta = [], rows = [];
  for (const ln of txt.split('\n')) {
    if (!ln.trim()) continue;
    if (ln[0] === '#') { meta.push(ln.slice(1).trim()); continue; }
    const [site, status, y, len, err, note] = ln.split(',');
    rows.push({ site, status, y, len, err, note: note || '' });
  }
  return { meta, rows };
}

const D = loadCsv('gz32-2017-05-20.csv');
const PUB = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'gz32-published.json'), 'utf8'));

const positives = D.rows.filter(r => r.status === 'positive');
const excluded = D.rows.filter(r => r.status === 'excluded');
const negatives = D.rows.filter(r => r.status === 'negative').map(r => r.y);

/* is there a concave w through the intervals at all? The concave hull of the
   lower values is the smallest candidate; if it already exceeds some upper
   value, no convex silhouette fits the chords at this budget. */
function feasible(P) {
  const hull = C.concaveHull(P.pts.map(p => [p.y, p.lo]));
  let worst = -Infinity, at = null;
  for (const p of P.pts) {
    let v = null;
    for (let i = 0; i + 1 < hull.length; i++)
      if (Q.cmp(p.y, hull[i][0]) >= 0 && Q.cmp(p.y, hull[i + 1][0]) <= 0) {
        v = C.lineAt(hull[i][0], hull[i][1], hull[i + 1][0], hull[i + 1][1], p.y); break;
      }
    if (v === null) continue;
    const over = C.qn(Q.sub(v, p.hi));
    if (over > worst) { worst = over; at = p.site; }
  }
  return { ok: worst <= 0, overKm: worst, at };
}

function run(chords, negs, nsig) {
  const P = C.prepare(chords, negs, { nsig });
  const lo = C.lowerBound(P), hi = C.upperBound(P), jd = C.joinTheDots(P);
  return {
    nsig,
    capLo: C.qn(P.capLo), capHi: C.qn(P.capHi),
    feasible: feasible(P),
    areaLo: C.qn(lo.area), areaHi: C.qn(hi.area), areaDots: C.qn(jd.area),
    DeqLo: C.equivDiameter(lo.area), DeqHi: C.equivDiameter(hi.area), DeqDots: C.equivDiameter(jd.area),
    dotsConcave: jd.concave,
    polyLo: lo.poly.map(p => [C.qn(p[0]), C.qn(p[1])]),
    polyHi: hi.poly.map(p => [C.qn(p[0]), C.qn(p[1])]),
    polyDots: jd.poly.map(p => [C.qn(p[0]), C.qn(p[1])])
  };
}

const chords = positives.map(r => ({ site: r.site, y: r.y, len: r.len, err: r.err }));
const withExcluded = chords.concat(excluded.map(r => ({ site: r.site, y: r.y, len: r.len, err: r.err })));

const ladder = [0, 0.5, 1, 1.5, 2, 3].map(n => run(chords, negatives, n));
/* what the stations that saw nothing are worth: put them out of reach */
const noNegatives = [1, 2].map(n => run(chords, ['600', '-600'], n));
/* and the chord the authors set aside */
const withSetAside = run(withExcluded, negatives, 1);

const out = {
  built: new Date().toISOString().slice(0, 10),
  object: PUB.object, date: PUB.date, source: PUB.source,
  meta: D.meta, sites: D.rows, published: PUB,
  nPositive: positives.length, nNegative: negatives.length, nSites: D.rows.length,
  ladder, noNegatives, withSetAside,
  ellipse: PUB.fits.map(f => ({ ...f, areaKm2: C.ellipseArea(f.aKm, f.bKm) }))
};
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'page.json'), JSON.stringify(out, null, 1));

const r1 = ladder.find(r => r.nsig === 1);
console.log(`${PUB.object}, ${PUB.date}: ${positives.length} positive chords, ${negatives.length} negative stations`);
console.log(`  nearest negatives ${r1.capLo} .. ${r1.capHi} km`);
for (const r of ladder)
  console.log(`  nsig ${r.nsig}: Deq [${r.DeqLo.toFixed(1)}, ${r.DeqHi.toFixed(1)}] km` +
    `   feasible ${r.feasible.ok ? 'yes' : 'NO (' + r.feasible.overKm.toFixed(1) + ' km over at ' + r.feasible.at + ')'}`);
console.log(`  published ellipse ${PUB.fits[0].DeqKm} +- ${PUB.fits[0].DeqErrKm} km (original) / ${PUB.fits[1].DeqKm} +- ${PUB.fits[1].DeqErrKm} (shifted)`);
console.log(`  radiometric ${PUB.radiometric[0].DKm} +- ${PUB.radiometric[0].errKm} km`);
for (const r of noNegatives) console.log(`  negatives out of reach, nsig ${r.nsig}: ceiling ${r.DeqHi.toFixed(1)} km`);
console.log(`out/page.json  ${(fs.statSync(path.join(HERE, 'out', 'page.json')).size / 1024).toFixed(0)} kB`);
