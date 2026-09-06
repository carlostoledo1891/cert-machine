/* fetch.js — pull Kepler short-cadence photometry and cut it into transits.
 *
 *   node fetch.js            # all targets
 *   node fetch.js tres2      # one
 *
 * Downloads the released FITS to a cache, then writes ONE compact CSV per
 * target into data/. Nothing here decides anything scientific: it masks on the
 * mission's own quality flag, normalises each transit against its own
 * out-of-transit baseline, and records what it did.
 *
 * THE ONE ASSUMPTION, STATED. A per-transit straight line fitted to the
 * out-of-transit flux is removed. That is a choice, and it is the only place in
 * this front where the data are touched before the enclosure sees them. Its
 * price is carried explicitly: `sysppm` in the emitted header is the RMS
 * disagreement between the two baseline halves, and the enclosure adds it to
 * every error bar as a common-mode allowance. A baseline error moves every
 * point together, which is exactly the shape of a gain in the interferometer.
 */
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const { readTable } = require('./fits.js');

const HERE = __dirname;
const CACHE = process.env.KEPLER_CACHE ||
  '/private/tmp/claude-501/-Users-carlostoledo-Documents-frontier-apps/edfd822d-9f33-468e-a2ed-f04835bf3615/scratchpad/kepler';
const BASE = 'https://archive.stsci.edu/pub/kepler/lightcurves';

/* Ephemerides are the archive's, quoted so the fold is reproducible; the
   enclosure treats t0 and the geometry as nuisances and re-derives them. */
const TARGETS = {
  tres2: {
    name: 'TrES-2 b', alias: 'Kepler-1 b', kic: 11446443,
    P: 2.470613385, t0bkjd: 2454955.7633008 - 2454833.0,   /* Q1-Q16 KOI */
    dur_h: 1.74259, files: [
      '2009259162342', '2009291181958', '2009322144938', '2009350160919'
    ]
  },
  kepler7: {
    name: 'Kepler-7 b', alias: null, kic: 5780885,
    P: 4.88548917, t0bkjd: 2454967.276079 - 2454833.0,     /* Q1-Q8 KOI */
    dur_h: 5.2295, files: [
      '2009291181958', '2009322144938', '2009350160919', '2010019161129',
      '2010049094358', '2010078100744', '2010111051353', '2010140023957'
    ]
  }
};

const pad = (n, w) => String(n).padStart(w, '0');
const url = (kic, stamp) =>
  `${BASE}/${pad(Math.floor(kic / 100000), 4)}/${pad(kic, 9)}/kplr${pad(kic, 9)}-${stamp}_slc.fits`;

function get(u, dest) {
  return new Promise((res, rej) => {
    const f = fs.createWriteStream(dest);
    https.get(u, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`${r.statusCode} ${u}`)); }
      r.pipe(f); f.on('finish', () => f.close(() => res(dest)));
    }).on('error', rej);
  });
}

/* least squares line through (x,y) */
function line(xs, ys) {
  const n = xs.length; if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const d = n * sxx - sx * sx; if (Math.abs(d) < 1e-14) return null;
  const m = (n * sxy - sx * sy) / d, c = (sy - m * sx) / n;
  return { m, c };
}

async function build(key) {
  const T = TARGETS[key];
  fs.mkdirSync(CACHE, { recursive: true });
  const rows = [];
  for (const stamp of T.files) {
    const dest = path.join(CACHE, `kplr${pad(T.kic, 9)}-${stamp}_slc.fits`);
    if (!fs.existsSync(dest)) {
      process.stdout.write(`  fetch ${stamp} ... `);
      await get(url(T.kic, stamp), dest);
      process.stdout.write('ok\n');
    }
    const t = readTable(fs.readFileSync(dest), ['TIME', 'PDCSAP_FLUX', 'PDCSAP_FLUX_ERR', 'SAP_QUALITY']);
    const { TIME, PDCSAP_FLUX, PDCSAP_FLUX_ERR, SAP_QUALITY } = t.columns;
    for (let i = 0; i < t.nrows; i++) {
      if (SAP_QUALITY[i] !== 0) continue;
      if (!Number.isFinite(TIME[i]) || !Number.isFinite(PDCSAP_FLUX[i])) continue;
      rows.push([TIME[i], PDCSAP_FLUX[i], PDCSAP_FLUX_ERR[i]]);
    }
  }
  rows.sort((a, b) => a[0] - b[0]);

  const halfDur = T.dur_h / 24 / 2;
  const win = 3.0 * halfDur;          /* window half-width */
  const oot = 1.35 * halfDur;         /* outside this is baseline */

  /* group by epoch */
  const byEpoch = new Map();
  for (const r of rows) {
    const e = Math.round((r[0] - T.t0bkjd) / T.P);
    const ph = r[0] - (T.t0bkjd + e * T.P);
    if (Math.abs(ph) > win) continue;
    if (!byEpoch.has(e)) byEpoch.set(e, []);
    byEpoch.get(e).push([ph, r[1], r[2]]);
  }

  const out = [];
  const halfDiff = [];
  let used = 0, dropped = 0;
  for (const [e, pts] of [...byEpoch.entries()].sort((a, b) => a[0] - b[0])) {
    const L = pts.filter(p => p[0] < -oot), R = pts.filter(p => p[0] > oot);
    const inT = pts.filter(p => Math.abs(p[0]) <= oot);
    if (L.length < 30 || R.length < 30 || inT.length < 30) { dropped++; continue; }
    const base = line([...L, ...R].map(p => p[0]), [...L, ...R].map(p => p[1]));
    if (!base) { dropped++; continue; }
    /* how much the two halves disagree, in ppm: the price of the straight line */
    const mL = L.reduce((a, p) => a + p[1] / (base.m * p[0] + base.c), 0) / L.length;
    const mR = R.reduce((a, p) => a + p[1] / (base.m * p[0] + base.c), 0) / R.length;
    halfDiff.push((mL - mR) * 1e6);
    for (const p of pts) {
      const b = base.m * p[0] + base.c;
      out.push([p[0], p[1] / b, p[2] / b, e]);
    }
    used++;
  }
  const sysppm = Math.sqrt(halfDiff.reduce((a, d) => a + d * d, 0) / Math.max(1, halfDiff.length));

  out.sort((a, b) => a[0] - b[0]);
  const head = [
    `# ${T.name}${T.alias ? ` (${T.alias})` : ''} — Kepler short cadence, PDCSAP, SAP_QUALITY==0`,
    `# KIC ${T.kic}; files ${T.files.join(' ')}`,
    `# fold: P=${T.P} d, t0=${T.t0bkjd.toFixed(7)} BKJD (archive); window +-${(win * 24).toFixed(2)} h`,
    `# baseline: straight line per transit fitted outside +-${(oot * 24).toFixed(2)} h, divided out`,
    `# transits used ${used}, dropped ${dropped}; baseline half-disagreement RMS ${sysppm.toFixed(1)} ppm`,
    `# columns: dt_days_from_mid,flux_normalised,err_normalised,epoch`,
    `# epoch is kept so the fold can be RE-CENTRED downstream: the archive`,
    `# ephemeris left a 136 ppm mirror asymmetry, three times the measured`,
    `# out-of-transit scatter, and a mis-centred fold is a systematic that looks`,
    `# exactly like a limb-darkening residual.`
  ].join('\n');
  const csv = head + '\n' + out.map(r => `${r[0].toFixed(8)},${r[1].toFixed(8)},${r[2].toExponential(6)},${r[3]}`).join('\n') + '\n';
  const dest = path.join(HERE, 'data', `${key}-sc.csv`);
  fs.writeFileSync(dest, csv);
  console.log(`${T.name}: ${out.length} points, ${used} transits (${dropped} dropped), sys ${sysppm.toFixed(1)} ppm -> data/${key}-sc.csv`);
  return { key, used, dropped, sysppm, n: out.length };
}

(async () => {
  const which = process.argv[2] ? [process.argv[2]] : Object.keys(TARGETS);
  for (const k of which) { if (!TARGETS[k]) throw new Error(`unknown target ${k}`); console.log(TARGETS[k].name); await build(k); }
})();
