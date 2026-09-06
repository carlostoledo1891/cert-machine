/* witness-curves.js — turn the enclosure's extreme witnesses into drawable
 * curves. Runs after make-page-data.js and writes out/witness.json.
 *
 * This is pipeline, not builder. The page must be able to draw "here are two
 * stars, both consistent with this light curve, whose planets differ by X%"
 * without recomputing a single physical quantity, so the light curves and the
 * brightness profiles those witnesses imply are computed HERE, from the atoms
 * the enclosure actually exhibited.
 */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./transit.js'), E = require('./enclose.js');

const OUT = path.join(__dirname, 'out');
const D = JSON.parse(fs.readFileSync(path.join(OUT, 'page.json'), 'utf8'));

/* the depth a witness predicts, on a time grid, at the orbit it was found for */
function depthCurve(atoms, k, rungName, geom, P, tmax, n = 240) {
  const rung = E.RUNGS[rungName], out = [];
  for (let i = 0; i <= n; i++) {
    const t = -tmax + 2 * tmax * i / n;
    const z = T.zOf(t, 0.5 * (geom.aR[0] + geom.aR[1]), 0.5 * (geom.b[0] + geom.b[1]), P);
    let d = 0;
    for (const a of atoms) d += a.w * rung.f(a.x, z, k);
    out.push([+(t * 24).toFixed(5), +(1 - d).toFixed(7)]);
  }
  return out;
}

/* the cumulative fraction of the star's light inside radius r. An atomic
   measure has a staircase for this, which is the honest picture: the witness
   IS a finite set of bright rings, and saying otherwise would be drawing a
   smoothness nobody proved. */
function cumulative(atoms, rungName) {
  const pts = atoms.map(a => ({ x: a.x, w: a.w })).sort((p, q) => p.x - q.x);
  const out = [[0, 0]];
  let c = 0;
  for (const p of pts) { out.push([+p.x.toFixed(5), +c.toFixed(6)]); c += p.w; out.push([+p.x.toFixed(5), +c.toFixed(6)]); }
  out.push([1, +c.toFixed(6)]);
  return { steps: out, rung: rungName, atoms: pts.length };
}

/* how much of the star's light this witness put where the planet never goes.
   This is the hiding mechanism as a number, read off the exhibited measure. */
const coreFraction = (atoms, core) => atoms.reduce((a, x) => a + (x.x < core ? x.w : 0), 0);

const res = { built: D.built, targets: [] };
for (const t of D.targets) {
  const rec = { key: t.key, name: t.name, curves: [] };
  for (const r of t.results) {
    const geom = t.orbits[r.orbit];
    for (const side of ['lo', 'hi']) {
      const pr = r['profile_' + side];
      if (!pr) continue;
      const core = Math.max(0, 0.5 * (geom.b[0] + geom.b[1]) - pr.k);
      rec.curves.push({
        orbit: r.orbit, rung: r.rung, side, k: pr.k,
        core, coreFraction: +coreFraction(pr.atoms, core).toFixed(4),
        depth: depthCurve(pr.atoms, pr.k, r.rung, geom, t.P, t.key === 'tres2' ? 0.075 : 0.20),
        profile: cumulative(pr.atoms, r.rung)
      });
    }
  }
  res.targets.push(rec);
}
fs.writeFileSync(path.join(OUT, 'witness.json'), JSON.stringify(res));
console.log(`out/witness.json  ${res.targets.map(t => t.key + ':' + t.curves.length).join(' ')}`);
