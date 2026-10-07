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

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..');
const MAIN = { bands: 'certs/janela-bands.json', alpha: 'certs/janela-alpha.json', proposer: 'janela/hs-altimeter/calibrated-v1' };

const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const regions = () => Object.entries(require('../scenario/regions.json').regions).map(([name, r]) => Object.assign({ name }, r));

/* every bands record in force: the main one, then each region whose record exists */
function records() {
  const out = [{ name: 'main', bands: MAIN.bands, alpha: MAIN.alpha, proposer: MAIN.proposer }];
  for (const r of regions()) if (fs.existsSync(path.join(ROOT, r.bands))) out.push(r);
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

/* the bands, merged: the main record's fields, every record's sites, and which record carries which site */
function bands() {
  const main = JSON.parse(read(MAIN.bands).toString('utf8'));
  const list = records().map((r) => {
    const buf = read(r.bands), rec = r.name === 'main' ? main : JSON.parse(buf.toString('utf8'));
    if (rec.binHours !== main.binHours || rec.miss !== main.miss) throw new Error('REFUSED: ' + r.bands + ' is not cut like ' + MAIN.bands + ' (bins ' + rec.binHours + ', miss ' + rec.miss + ')');
    return { name: r.name, file: r.bands, rec, sha: sha(buf), proposer: r.proposer };
  });
  return Object.assign({}, main, { sites: merge(list, 'bands'),
    records: list.map((x) => ({ name: x.name, file: x.file, sha: x.sha, proposer: x.proposer, sites: Object.keys(x.rec.sites) })) });
}

/* the site alphas, merged the same way (a region's alpha record may lag its bands: then it carries none yet) */
function alpha() {
  const main = JSON.parse(read(MAIN.alpha).toString('utf8'));
  const list = [{ name: 'main', file: MAIN.alpha, rec: main }];
  for (const r of records()) if (r.name !== 'main' && fs.existsSync(path.join(ROOT, r.alpha))) list.push({ name: r.name, file: r.alpha, rec: JSON.parse(read(r.alpha).toString('utf8')) });
  return Object.assign({}, main, { sites: merge(list, 'alpha'), records: list.map((x) => ({ name: x.name, file: x.file })) });
}

/* the region a site belongs to (its caveat travels with every band it lends), or null */
function regionOf(sid) { return regions().find((r) => r.sites.includes(sid)) || null; }

/* the record files in force, for the input shas a day's data names */
function files() {
  const out = [];
  for (const r of records()) { out.push(r.bands); if (fs.existsSync(path.join(ROOT, r.alpha))) out.push(r.alpha); }
  return out;
}

module.exports = { MAIN, regions, records, merge, bands, alpha, regionOf, files };
