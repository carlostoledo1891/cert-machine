/* bandset.js — the calibrated bands and the site alphas Janela decides with, ONE loader.
   apps/janela/audit · cert-machine

   The records of 2026-10-06 (certs/janela-bands.json, certs/janela-alpha.json: the
   eight open-sea sites, proposer calibrated-v1) and every measured REGION's
   (apps/janela/scenario/regions.json), merged by site. A region counts from the day
   its records are committed; until then its sites are tracked (forecast, ledgered by
   the ensemble) but lend no band and no alpha. Each site is carried by exactly one
   record — a site in two is refused, never resolved by order.

   Read by app/data.js and numbers.js (the bands), app/model.js (the alphas),
   audit/platforms.js (which sites are measured) and audit/commit.js (one calibrated
   proposer per bands record). A rule read in five places lives here once.

   THE SECOND PROVIDER (2026-10-07, providers-v1 in certs/janela-ledger/DEFINITIONS.json):
   a bands record calibrated on NOAA's forecasts (certs/janela-bands-noaa.json, proposer
   calibrated-noaa-v1) is a record of ANOTHER PROVIDER, never merged into ECMWF's —
   bands(provider) merges one provider's records; the product decides on the union of
   the providers' bands where a place has both (audit/today.js).

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..');
const MAIN = { bands: 'certs/janela-bands.json', alpha: 'certs/janela-alpha.json', proposer: 'janela/hs-altimeter/calibrated-v1' };
/* the providers beside ECMWF: a bands record per provider, calibrated on that provider's forecasts at the eight
   open-sea sites of 2026-10-06 (no alpha: the site alpha stays ECMWF's measurement) */
const PROVIDERS = [{ name: 'noaa', provider: 'noaa', bands: 'certs/janela-bands-noaa.json', proposer: 'janela/hs-altimeter/calibrated-noaa-v1' }];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const regions = () => Object.entries(require('../scenario/regions.json').regions).map(([name, r]) => Object.assign({ name }, r));

/* every bands record in force: the main one, then each region whose record exists (ECMWF's), then each other
   provider's whose record exists */
function records() {
  const out = [{ name: 'main', provider: 'ecmwf', bands: MAIN.bands, alpha: MAIN.alpha, proposer: MAIN.proposer }];
  for (const r of regions()) if (fs.existsSync(path.join(ROOT, r.bands))) out.push(Object.assign({ provider: 'ecmwf' }, r));
  for (const p of PROVIDERS) if (fs.existsSync(path.join(ROOT, p.bands))) out.push(Object.assign({}, p));
  /* a region's NOAA chain (regions.json r.noaa): NOAA calibrated on the region's own pairs */
  for (const r of regions()) if (r.noaa && fs.existsSync(path.join(ROOT, r.noaa.bands))) out.push({ name: r.name + '-noaa', provider: 'noaa', bands: r.noaa.bands, proposer: r.noaa.proposer });
  return out;
}

/* the merge, pure (the battery feeds it synthetic records): [{ name, file, rec, ...extra }] -> sites by record */
function merge(list, kind) {
  const sites = {};
  for (const { file, rec } of list) {
    for (const sid of Object.keys(rec.sites)) {
      if (sites[sid]) throw new Error('REFUSED: site ' + sid + ' is carried by two ' + kind + ' records (' + sites[sid].file + ', ' + file + ')');
      sites[sid] = { file, value: rec.sites[sid] };
    }
  }
  return Object.fromEntries(Object.entries(sites).map(([k, v]) => [k, v.value]));
}

/* the bands of ONE provider, merged: the main record's fields (its borrow table for the terminals), every record's
   sites, and which record carries which site. bands() is ECMWF's; bands('noaa') is null until its record exists. */
function bands(provider) {
  provider = provider || 'ecmwf';
  const main = JSON.parse(read(MAIN.bands).toString('utf8'));
  const mine = records().filter((r) => r.provider === provider);
  if (!mine.length) return null;
  const list = mine.map((r) => {
    const buf = read(r.bands), rec = r.name === 'main' ? main : JSON.parse(buf.toString('utf8'));
    if (rec.binHours !== main.binHours || rec.miss !== main.miss) throw new Error('REFUSED: ' + r.bands + ' is not cut like ' + MAIN.bands + ' (bins ' + rec.binHours + ', miss ' + rec.miss + ')');
    if ((rec.provider || 'ecmwf') !== provider) throw new Error('REFUSED: ' + r.bands + ' was calibrated on ' + (rec.provider || 'ecmwf') + ', not ' + provider);
    return { name: r.name, file: r.bands, rec, sha: sha(buf), proposer: r.proposer };
  });
  return Object.assign({}, main, { provider, sites: merge(list, 'bands'),
    records: list.map((x) => ({ name: x.name, file: x.file, sha: x.sha, proposer: x.proposer, sites: Object.keys(x.rec.sites) })) });
}

/* the site alphas, merged the same way (a region's alpha record may lag its bands: then it carries none yet) */
function alpha() {
  const main = JSON.parse(read(MAIN.alpha).toString('utf8'));
  const list = [{ name: 'main', file: MAIN.alpha, rec: main }];
  for (const r of records()) if (r.name !== 'main' && r.alpha && fs.existsSync(path.join(ROOT, r.alpha))) list.push({ name: r.name, file: r.alpha, rec: JSON.parse(read(r.alpha).toString('utf8')) });
  return Object.assign({}, main, { sites: merge(list, 'alpha'), records: list.map((x) => ({ name: x.name, file: x.file })) });
}

/* THE PRUNE, IN THE PRODUCT: a calibrated proposer the placar has pruned (placar.js admission, status
   DEADMITTED) stops deciding — its sites lend no band, so the band criterion there says SEM DADOS until a
   recalibrated version is pinned. proposers: the ledger's per-proposer verdicts ({domain, status, prunedAt}). */
function withoutPruned(B, proposers) {
  const cut = new Set((proposers || []).filter((p) => p.status === 'DEADMITTED').map((p) => p.domain));
  const pruned = B.records.filter((r) => cut.has(r.proposer)).map((r) => {
    const p = proposers.find((x) => x.domain === r.proposer);
    return { proposer: r.proposer, sites: r.sites, at: p.prunedAt ? p.prunedAt.through : null };
  });
  if (!pruned.length) return { bands: B, pruned: [] };
  const sites = Object.assign({}, B.sites);
  for (const r of pruned) for (const sid of r.sites) delete sites[sid];
  return { bands: Object.assign({}, B, { sites }), pruned };
}

/* THE BANDS THE PRODUCT DECIDES WITH — one definition, read by app/data.js (the app's day) and numbers.js (the
   method page), so the two never decide a step differently: ECMWF's records less any pruned proposer, and, when
   the second provider's day is at hand and its record exists, NOAA's less its pruned (providers-v1: today.js
   decides on the union). proposers: [{ domain, status, prunedAt }] from the placar. */
function forDecision(proposers, withNoaa) {
  const e = withoutPruned(bands(), proposers);
  const nb = withNoaa ? bands('noaa') : null;
  const n = nb ? withoutPruned(nb, proposers) : null;
  return { bands: e.bands, noaa: n ? n.bands : null, pruned: e.pruned.concat(n ? n.pruned : []) };
}

/* the region a site belongs to (its caveat travels with every band it lends), or null */
function regionOf(sid) { return regions().find((r) => r.sites.includes(sid)) || null; }

/* the record files in force, for the input shas a day's data names */
function files() {
  const out = [];
  for (const r of records()) { out.push(r.bands); if (r.alpha && fs.existsSync(path.join(ROOT, r.alpha))) out.push(r.alpha); }
  return out;
}

module.exports = { MAIN, PROVIDERS, regions, records, merge, bands, alpha, withoutPruned, forDecision, regionOf, files };
