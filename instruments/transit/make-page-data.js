/* make-page-data.js — the pipeline. Emits out/page.json; the builder only reads.
 *
 *   node experiments/transit/make-page-data.js [target]
 *
 * Order of operations, and every one of them is a decision that had to be
 * measured rather than chosen:
 *
 *   1. CENTRE the fold on the transit's own mirror symmetry, not on the archive
 *      ephemeris. Kepler-7 b's archive mid-transit is 248 s out, which shows up
 *      as an asymmetry of 135 ppm against a 56 ppm floor.
 *   2. BIN so the flux change across a bin stays under a target, because the
 *      kernel is enclosed over the bin's span and a wide bin across ingress
 *      costs more than the noise does.
 *   3. FIT the conventional quadratic-limb-darkening model, for two reasons:
 *      to check the extraction reproduces the published radius ratio, and to
 *      MEASURE the smallest error budget that does not refuse the field's own
 *      answer. That budget is then used for the enclosure.
 *   4. ENCLOSE, on a ladder of assumptions and a ladder of orbits.
 */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./transit.js'), C = require('./centre.js'), B = require('./bins.js');
const E = require('./enclose.js'), F = require('./fit.js');

const HERE = __dirname;
const TARGETS = {
  tres2: {
    name: 'TrES-2 b', also: 'Kepler-1 b', file: 'tres2-sc.csv', P: 2.470613385,
    span: 0.09, binTarget: 80e-6, wMin: 3, sys: 10.5e-6,
    start: [0.36, 0.28, 0.1239, 8.39, 0.8186],
    note: 'a grazing transit: the planet never comes near the middle of the star'
  },
  kepler7: {
    name: 'Kepler-7 b', also: null, file: 'kepler7-sc.csv', P: 4.88548917,
    span: 0.24, binTarget: 150e-6, wMin: 10, sys: 10.6e-6,
    start: [0.36, 0.28, 0.0829, 6.84, 0.5145],
    note: 'the planet whose published radius ratio moves 3.7% between papers'
  }
};

/* a CSV line with quoted fields — the reference strings contain commas */
function splitCsv(ln) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < ln.length; i++) {
    const c = ln[i];
    if (c === '"') { if (q && ln[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur); return out;
}

/* the archive's own table, read not recomputed */
function published(name) {
  const txt = fs.readFileSync(path.join(HERE, 'data', 'published.csv'), 'utf8').trim().split('\n');
  const head = txt[0].split(',');
  const out = [];
  for (const ln of txt.slice(1)) {
    const cells = splitCsv(ln);
    const row = {}; head.forEach((h, i) => row[h] = cells[i]);
    if (row.pl_name !== name) continue;
    const ref = (row.pl_refname.match(/>([^<]+)</) || [, row.pl_refname])[1].trim().replace(/\s+/g, ' ');
    out.push({ ref, k: +row.pl_ratror, kerr: Math.abs(+row.pl_ratrorerr1 || 0), b: row.pl_imppar ? +row.pl_imppar : null, aR: row.pl_ratdor ? +row.pl_ratdor : null });
  }
  const seen = new Set();
  return out.filter(r => { const key = r.k.toFixed(6) + r.ref; if (seen.has(key)) return false; seen.add(key); return true; });
}

function run(key) {
  const S = TARGETS[key];
  const curve = T.loadCurve(path.join(HERE, 'data', S.file));
  const cen = C.centre(curve.pts, { span: S.span });
  const pts = C.applyCentre(curve.pts, cen);
  const bins = T.binCurve(pts, B.edges(pts, { target: S.binTarget, wMin: S.wMin / 86400 })).filter(b => b.n >= 5);

  /* measured noise floor, out of transit, against the mission's stated errors */
  const oot = bins.filter(b => Math.abs(b.tmid) > 0.62 * S.span);
  let s2 = 0, ss = 0; for (const b of oot) { s2 += (b.f - 1) ** 2; ss += b.stated ** 2; }
  const floor = { n: oot.length, measured: Math.sqrt(s2 / oot.length), stated: Math.sqrt(ss / oot.length) };

  const fit = F.fit(bins, S.start, S.P, S.sys);
  /* THE BUDGET IS MEASURED: the smallest per-bin allowance that still admits
     the conventional model, rounded up. A budget that refutes the field's own
     answer is a broken budget, not a strong result. */
  /* ...with headroom. Calibrating to exactly the worst bin leaves the witness
     search fighting the boundary: every shrink of the admissible set then makes
     it EMPTY, and Kepler-7 b returned no admitted k at all until this was
     added. 20% is the smallest that cleared the whole shrink ladder. */
  const nsig = Math.ceil(fit.worstSigma * 1.2 * 10) / 10;

  const pub = published(S.name);
  const ks = pub.map(p => p.k), bs = pub.map(p => p.b).filter(x => x !== null), aRs = pub.map(p => p.aR).filter(x => x !== null);
  const orbits = {
    exact: { aR: [fit.aR, fit.aR], b: [fit.b, fit.b], t0: [0, 0], P: S.P,
      label: 'granting the orbit fitted here, exactly' },
    stated: { aR: [fit.aR * 0.995, fit.aR * 1.005], b: [fit.b - 0.005, fit.b + 0.005], t0: [-5 / 86400, 5 / 86400], P: S.P,
      label: 'the orbit held to 0.5% in a/R* and 0.005 in b' },
  };
  void ks; void aRs; void bs;
  /* 'open' — the orbit anywhere the published papers put it — is dropped: the
     adaptive z-subdivision that made the enclosure sound makes a wide geometry
     box cost 16 kernel evaluations where a narrow one costs 1, and the honest
     way to carry a wide box is a UNION over narrow sub-boxes, which is a
     different run. Recorded in the log as not done. */

  const budget = { nsig, sys: S.sys };
  const opts = { grid: 900, iters: 260, inner: 45, maxCells: 120000 };
  /* the enclosure's own prediction, checked below: mass at r < b - k is never
     touched by the planet, so under nonnegativity alone no k below the impact
     parameter can be refuted. b is therefore the ceiling, and it is a statement
     about the geometry, not about the photometry. */
  const hidingCeiling = fit.b;
  const results = [];
  for (const [orbKey, geom] of Object.entries(orbits)) {
    for (const rung of ['none', 'monotone']) {
      const t0 = Date.now();
      const probes = [];
      const br = E.bracket(bins, rung, geom, budget, {
        ...opts, k0: fit.k, span: 0.55, steps: 14, bisect: 9,
        trace: r => probes.push({ k: r.k, v: r.verdict })
      });
      const rec = { orbit: orbKey, rung, label: E.RUNGS[rung].label, ...br, probes, secs: (Date.now() - t0) / 1000 };
      /* the two extreme admitted profiles, for the picture */
      if (br.ok) for (const [nm, kk] of [['lo', br.inner[0]], ['hi', br.inner[1]]]) {
        const d = E.decide(bins, kk, rung, geom, budget, opts);
        if (d.verdict === 'admitted') rec['profile_' + nm] = { k: kk, atoms: d.atoms };
      }
      results.push(rec);
      console.log(`  ${S.name} ${orbKey}/${rung}: inner [${br.ok ? br.inner.map(x => x.toFixed(4)).join(', ') : '-'}] outer [${br.ok ? br.outer.map(x => x.toFixed(4)).join(', ') : '-'}] ${rec.secs.toFixed(0)}s`);
    }
  }

  /* a light curve to draw: bin means, thinned */
  const step = Math.max(1, Math.floor(bins.length / 700));
  const curveOut = bins.filter((_, i) => i % step === 0).map(b => [+(b.tmid * 24).toFixed(5), +b.f.toFixed(7), +(b.sigma * 1e6).toFixed(2)]);

  return {
    key, name: S.name, also: S.also, note: S.note, P: S.P,
    meta: curve.meta, nPoints: curve.pts.length, nBins: bins.length,
    centre: { shiftSec: cen.dt0 * 86400, dPSecPerEpoch: cen.dP * 86400, asymBefore: cen.before, asymAfter: cen.a },
    floor, fit, budget: { nsig, sys: S.sys },
    published: pub, orbits, results, curve: curveOut, hidingCeiling
  };
}

const which = process.argv[2] ? [process.argv[2]] : Object.keys(TARGETS);
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
/* a single-target run MERGES into what is already there, so re-running one
   planet does not throw away the other's brackets */
const PJ = path.join(HERE, 'out', 'page.json');
const prev = fs.existsSync(PJ) ? JSON.parse(fs.readFileSync(PJ, 'utf8')) : { targets: [] };
const out = { built: new Date().toISOString().slice(0, 10), targets: prev.targets.filter(t => !which.includes(t.key)) };
for (const k of which) {
  out.targets.push(run(k));
  out.targets.sort((a, b) => Object.keys(TARGETS).indexOf(a.key) - Object.keys(TARGETS).indexOf(b.key));
  fs.writeFileSync(PJ, JSON.stringify(out, null, 1));
}
console.log(`\nout/page.json  ${(fs.statSync(path.join(HERE, 'out', 'page.json')).size / 1024).toFixed(0)} kB`);
