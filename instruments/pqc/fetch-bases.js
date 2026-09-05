/* fetch-bases.js — get the determinant for selected records, politely.
 *   node experiments/pqc-geometry/fetch-bases.js [--n 16]
 *
 * One request per (dimension, seed), three seconds apart, cached on disk and
 * never refetched. This is a university server hosting a public challenge; 926
 * requests to enumerate a table would be rude and is not how the question gets
 * answered anyway — the records that can flip a verdict are the ones near the
 * wall, and a spread of dimensions tests whether the published arithmetic drifts
 * with n. Sixteen requests answer both.
 *
 * Only the verified determinant is kept. The full basis is a few hundred
 * kilobytes, is reproducible from (dimension, seed), and its only role here is
 * to PROVE det = q — which basis.js does on arrival, entry by entry, before the
 * bulk is discarded.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parse, determinant } = require('./basis.js');
const { recs } = require('./hof.js');

const OUT = path.join(__dirname, 'out');
const STORE = path.join(OUT, 'dets.json');
fs.mkdirSync(OUT, { recursive: true });
const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? +process.argv[i + 1] : d; };
const LIMIT = arg('--n', 16);

/* the targets: everything close to the wall, then the extremes of dimension */
const near = recs.slice(0, 12);
const byDim = {};
for (const r of recs) if (!byDim[r.n] || r.ratio > byDim[r.n].ratio) byDim[r.n] = r;
const dims = Object.keys(byDim).map(Number).sort((a, b) => a - b);
const spread = [dims[0], dims[Math.floor(dims.length / 3)], dims[Math.floor(2 * dims.length / 3)], dims[dims.length - 1]].map(d => byDim[d]);
const key = r => `${r.n}:${r.seed}`;
const targets = [];
for (const r of near.concat(spread)) if (!targets.some(t => key(t) === key(r))) targets.push(r);

async function one(r) {
  const body = new FormData();
  body.set('dimension', String(r.n)); body.set('seed', String(r.seed)); body.set('sent', 'true');
  const res = await fetch('https://www.latticechallenge.org/svp-challenge/generator.php', { method: 'POST', body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim().startsWith('[')) throw new Error(`not a basis (${text.slice(0, 40).replace(/\s+/g, ' ')})`);
  const d = determinant(parse(text));
  return {
    n: r.n, seed: r.seed, ok: d.ok, why: d.why,
    dim: d.n, q: d.ok ? d.q.toString() : null,
    sha256: crypto.createHash('sha256').update(text).digest('hex'),
    bytes: text.length, fetchedAt: new Date().toISOString(),
  };
}

(async () => {
  let got = 0, skipped = 0;
  for (const r of targets.slice(0, LIMIT)) {
    const k = key(r);
    if (store[k]) { skipped++; continue; }
    try {
      const rec = await one(r);
      if (!rec.ok) { console.log(`  dim ${r.n} seed ${r.seed}  STRUCTURE REFUSED — ${rec.why}`); }
      else console.log(`  dim ${String(r.n).padStart(3)} seed ${String(r.seed).padStart(5)}  q has ${rec.q.length} digits  (${(rec.bytes / 1024).toFixed(0)} KB, det proved)`);
      store[k] = rec; got++;
      fs.writeFileSync(STORE, JSON.stringify(store, null, 1));
    } catch (e) {
      console.log(`  dim ${r.n} seed ${r.seed}  FAILED — ${e.message}`);
      store[k] = { n: r.n, seed: r.seed, ok: false, why: e.message };
      fs.writeFileSync(STORE, JSON.stringify(store, null, 1));
    }
    await new Promise(z => setTimeout(z, 3000));       // be a good guest
  }
  console.log(`\n${got} fetched, ${skipped} already cached, ${Object.keys(store).length} determinants on disk`);
})();
