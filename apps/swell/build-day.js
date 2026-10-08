/* build-day.js — the day's data for the Swell app, gated.
   apps/swell · cert-machine

   usage: node apps/swell/build-day.js [--feed YYYYMMDD] [--out DIR]
     default feed: the newest corpus/swell/feed/*.json.gz; default out: site/swell/data (git-ignored; the daily
     Action writes to a temporary directory and force-pushes it to the orphan branch swell-field).

   WHAT IT DOES, in order — every step refuses rather than guesses:
     1. reads Swell's feed (apps/swell/audit/feed.py: ECMWF and NOAA at the island box's open edge every 3 h,
        ECMWF's wind over the island, Copernicus' sea level and water temperature);
     2. the open sea's MEASURED band, by Janela's own definition (apps/janela/audit/today.js compute(), the bands
        apps/janela/audit/bandset.js forDecision() — ECMWF ∪ NOAA, less any proposer the ledger has pruned): the
        same function, the same records, the same site ('floripa'), at Swell's 3-hourly steps;
     3. the published inputs: the sea (size, band, NOAA's partitions), the wind grid, the ocean block — rounded
        once, here, and from then on the ONLY inputs both this build and the reader's tab compute from;
     4. model/surf.js over every beach and step (the same bytes the tab runs, sha256 pinned in the day), the
        digest over the canonical lines (heights and decided letters), a second pass from the WRITTEN bytes that
        must reproduce the digest;
     5. the scoreboard of the forecast Swell starts from: Janela's ledger at the 'floripa' site (placar.js).

   MIT licensed. Part of cert-machine.                                                                        */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const TODAY = require('../janela/audit/today.js');
const BS = require('../janela/audit/bandset.js');
const PLACAR = require('../janela/audit/placar.js');
const LEDGER = require('../../instruments/forecast/ledger.js');
const S = require('./model/surf.js');

const SITE = 'floripa';
const MODULES = ['instruments/window/q.js', 'instruments/window/decide.js', 'apps/swell/model/surf.js'];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const die = (m) => { console.error('build-day: REFUSED — ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

/* an exact fraction string "n/d" (or an integer) to a number */
const fr = (s) => { if (s == null) return null; const [n, d] = String(s).split('/'); return Number(n) / (d ? Number(d) : 1); };
const r = (x, k) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** k) / 10 ** k);

function load(feedDay) {
  const FD = path.join(ROOT, 'corpus', 'swell', 'feed');
  need(fs.existsSync(FD), 'no corpus/swell/feed — run apps/swell/audit/feed.py');
  const files = fs.readdirSync(FD).filter((f) => /^\d{8}\.json\.gz$/.test(f)).sort();
  const pick = feedDay ? feedDay + '.json.gz' : files[files.length - 1];
  need(pick && files.includes(pick), 'no feed ' + (feedDay || '(any)'));
  const gz = fs.readFileSync(path.join(FD, pick)), raw = zlib.gunzipSync(gz);
  const feed = JSON.parse(raw.toString('utf8'));
  need(feed.v === 'swell-feed-1', 'the feed is not swell-feed-1');
  need(feed.ecmwf && feed.ecmwf[SITE] && feed.noaa && feed.noaa[SITE] && feed.wind, 'the feed lost ecmwf/noaa/wind');
  return { feed, file: 'corpus/swell/feed/' + pick, sha: sha(raw), gzSha: sha(gz) };
}

function build(F) {
  const feed = F.feed;
  const steps = feed.ecmwf[SITE].steps.map((s) => ({ t: s.t, lead: s.lead }));
  need(steps.length === feed.steps.length && steps.every((s, i) => s.lead === feed.steps[i]), 'ECMWF steps differ from the feed\'s list');
  const nsteps = feed.noaa[SITE].steps;
  need(nsteps.length === steps.length && nsteps.every((s, i) => s.t === steps[i].t), 'NOAA steps differ from ECMWF\'s');

  /* 1. the ledger first: a pruned proposer stops deciding here exactly as in Janela */
  const LD = path.join(ROOT, 'certs', 'janela-ledger');
  const lfiles = fs.readdirSync(LD).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort();
  const rows = [].concat(...lfiles.map((f) => LEDGER.rows(path.join(LD, f))));
  const rec = PLACAR.record(rows);
  const DB = BS.forDecision(Object.values(rec).map((p) => ({ domain: p.domain, status: p.admission.status, prunedAt: p.admission.prunedAt })), true);
  need(DB.bands.sites[SITE], 'Janela\'s bands record has no ' + SITE + ' site');

  /* 2. the band, by today.js — the feed's floripa records ARE Janela feed steps (feed.py keeps the shape) */
  const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/sites.json'), 'utf8')).sites.find((s) => s.id === SITE);
  const eFeed = { run: feed.run, madeAt: feed.madeAt, sites: { [SITE]: feed.ecmwf[SITE] } };
  const nFeed = { run: feed.run, madeAt: feed.madeAt, sites: { [SITE]: feed.noaa[SITE] } };
  const T = TODAY.compute(eFeed, DB.bands, [], [site], DB.noaa ? { feed: nFeed, bands: DB.noaa } : undefined);
  const tsteps = T.sites[SITE].steps;
  need(tsteps.length === steps.length, 'today.js returned ' + tsteps.length + ' steps for ' + steps.length);

  /* 3. the published inputs */
  const sea = tsteps.map((st, i) => {
    const n = nsteps[i];
    const parts = [];
    if (n.sea && n.sea.hs != null) parts.push({ k: 'v', h: r(fr(n.sea.hs), 2), p: r(fr(n.sea.per), 1), d: r(fr(n.sea.dir), 0) });
    (n.swell || []).forEach((w, j) => { if (w && w.hs != null) parts.push({ k: String(j + 1), h: r(fr(w.hs), 2), p: r(fr(w.per), 1), d: r(fr(w.dir), 0) }); });
    return {
      size: st.hsDet != null ? Number(st.hsDet) : null,
      lo: st.hs ? Number(st.hs.loDec) : null, hi: st.hs ? Number(st.hs.hiDec) : null, from: st.hs ? (st.hs.from || ['ecmwf']) : null,
      tp: st.tp != null ? Number(st.tp) : null, mwd: st.mwd != null ? Number(st.mwd) : null,
      noaa: n.hs && n.hs.det != null ? r(fr(n.hs.det), 2) : null, parts,
    };
  });
  const W = feed.wind;
  const lats = [...new Set(W.nodes.map((n) => n[0]))].sort((a, b) => a - b), lons = [...new Set(W.nodes.map((n) => n[1]))].sort((a, b) => a - b);
  need(lats.length * lons.length === W.nodes.length, 'the wind nodes are not a full grid');
  const order = [];
  for (const la of lats) for (const lo of lons) order.push(W.nodes.findIndex((n) => n[0] === la && n[1] === lo));
  need(W.steps.length === steps.length, 'wind steps differ');
  let prevTp = null;
  const wind = { lats, lons, steps: W.steps.map((st, i) => {
    need(st.t === steps[i].t, 'wind step ' + i + ' is ' + st.t);
    const tp = st.tp ? order.map((k) => fr(st.tp[k])) : null;
    const rain = tp && prevTp ? tp.map((x, k) => r(Math.max(0, (x - prevTp[k]) * 1000), 1)) : null;
    prevTp = tp;
    return {
      u: order.map((k) => r(fr(st.u[k]), 2)), v: order.map((k) => r(fr(st.v[k]), 2)), g: order.map((k) => r(fr(st.gust[k]), 2)),
      t2: st.t2m ? order.map((k) => r(fr(st.t2m[k]) - 273.15, 1)) : null, rain,
    };
  }) };
  const ocean = feed.ocean ? { node: feed.ocean.node, times: feed.ocean.times, level: feed.ocean.level.map(Number), tide: feed.ocean.tide.map(Number),
    sst: feed.ocean.sst.map((x) => (x == null ? null : Number(x))), source: feed.ocean.source } : null;

  const modules = {};
  for (const rel of MODULES) modules[path.basename(rel)] = { rel, sha: sha(fs.readFileSync(path.join(ROOT, rel))) };
  const beachesRaw = fs.readFileSync(path.join(ROOT, 'apps/swell/data/beaches.json'));
  const inputs = { 'apps/swell/data/beaches.json': sha(beachesRaw) };
  for (const f of BS.files()) inputs[f] = sha(fs.readFileSync(path.join(ROOT, f)));
  for (const f of lfiles) inputs['certs/janela-ledger/' + f] = sha(fs.readFileSync(path.join(LD, f)));

  /* 5. the scoreboard at floripa: Janela's proposers, their record at this site */
  const board = Object.values(rec).map((p) => {
    const s = p.breakdown.bySite[SITE] || null;
    return { domain: p.domain, name: PLACAR.NAMES_PT[p.domain] || p.domain, claim: p.claim, status: p.admission.status,
      site: s, decides: (DB.bands && /calibrated-v1$|calibrated-noaa-v1$|union-v1$/.test(p.domain)) };
  }).filter((p) => p.site && p.site.scored);

  /* what is already MEASURED about the band Swell decides on: floripa's calibration cells (the pairs it was cut
     from, its exact coverage claim) and the union's held-out test (15 months it never saw, every main site) */
  const cell = (rec, bin) => { const c = rec.sites[SITE] && rec.sites[SITE].bins[bin] && rec.sites[SITE].bins[bin].hs; return c ? { n: c.n, coverage: c.coverage, lo: c.loDec, hi: c.hiDec } : null; };
  const EV = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs/janela-providers-eval.json'), 'utf8'));
  const U = EV.results.find((x) => x.option === 'U(E,N)' && x.miss === '1/10');
  const calib = { bins: [24, 72, 120].map((b) => ({ lead: b, ecmwf: cell(DB.bands, String(b)), noaa: DB.noaa ? cell(DB.noaa, String(b)) : null })),
    heldOut: U ? { option: 'U(E,N)', miss: U.miss, n: U.n, coverage: U.coverage, meanWidthM: U.meanWidthM, split: EV.pairs.split, record: 'certs/janela-providers-eval.json' } : null };

  const git = (() => { try { return require('child_process').execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })();
  return {
    v: 'swell-day-1', app: 'swell', run: feed.run, madeAt: feed.madeAt, builtAt: new Date().toISOString(), git,
    feed: { file: F.file, sha: F.sha }, licence: feed.licence,
    site: { id: SITE, node: T.sites[SITE].node, noaaNode: feed.noaa[SITE].node },
    band: { record: 'certs/janela-bands.json + certs/janela-bands-noaa.json', claim: '9/10', rule: 'providers-v1 (union where both)', pruned: DB.pruned.map((p) => p.domain || p) },
    steps, sea, wind, ocean, modules, inputs, board, calib, gust: feed.gust || null,
  };
}

function digestOf(day) {
  const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/swell/data/beaches.json'), 'utf8'));
  const all = S.computeAll(B, day);
  const lines = S.canon(all, day);
  const count = { V: 0, I: 0, L: 0, S: 0, R: 0 };
  for (const { rows } of all.beaches) for (const r0 of rows) for (const a of S.ACT_ORDER) {
    const j = r0.acts[a]; if (!j) continue; if (j.refused) { count.R++; continue; } for (const d of j.dec) count[d.letter] = (count[d.letter] || 0) + 1;
  }
  return { digest: sha(lines.join('\n')), lines: lines.length, count };
}

if (require.main === module) {
  const F = load(arg('--feed'));
  const day = build(F);
  const d1 = digestOf(day);
  Object.assign(day, { digest: d1.digest, canonLines: d1.lines, decided: d1.count });
  const out = arg('--out') || path.join(ROOT, 'site', 'swell', 'data');
  fs.mkdirSync(out, { recursive: true });
  const bytes = JSON.stringify(day);
  /* the second pass, from the written bytes: what the tab will read */
  const again = digestOf(JSON.parse(bytes));
  need(again.digest === d1.digest, 'the digest from the written bytes differs: ' + again.digest + ' vs ' + d1.digest);
  fs.writeFileSync(path.join(out, 'today.json'), bytes);
  if (!arg('--out')) fs.writeFileSync(path.join(out, 'today.js'), 'window.SWELL_TODAY=' + bytes.replace(/</g, '\\u003c') + ';\n');
  console.log('swell day ' + day.run + ': ' + day.steps.length + ' steps, ' + d1.lines + ' canonical lines, digest ' + d1.digest.slice(0, 12) +
    ', decided ' + JSON.stringify(d1.count) + ', ' + (bytes.length / 1024).toFixed(0) + ' KB -> ' + path.relative(ROOT, out));
}

module.exports = { load, build, digestOf, MODULES };
