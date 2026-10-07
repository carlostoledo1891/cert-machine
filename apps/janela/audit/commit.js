/* commit.js — today's ensemble bands go into the ledger BEFORE the sea happens.
   apps/janela/audit · cert-machine

     node apps/janela/audit/commit.js [YYYYMMDD]     (default: the newest feed)

   For every open-sea site (kind field, platform or coast — a satellite cannot
   see inside a bay) and every forecast step whose time is still in the future,
   one COMMIT row in certs/janela-ledger/YYYYMM.jsonl (instruments/forecast/
   ledger.js: append-only, refuses backdating, refuses a second commit of the
   same id). The commit pins:

     target   the significant wave height a satellite altimeter will measure:
              the exact mean of the NOAA RADS near-real-time 1 Hz values within
              100 km of the site, over the pass whose mid-time is nearest the
              target time and within 3 h of it (at least 5 points);
     band     [lo, hi] = the 6th and 45th of the 50 ECMWF ensemble members,
              exact rationals; the proposer claims 4/5 coverage (alpha 1/5).

   A target no satellite passes over is simply never scored — pass times do not
   depend on the forecast, so the scored set is not chosen by the outcome.

   MARGIN: a row is committed only when its target is at least an hour after
   madeAt. The outside proof of "before" is the git push that follows (the
   Action pushes right after this script); an hour keeps every row provably
   ahead of its sea even when the push is retried.

   A STALE PIN stops only its own proposer: when a bands record in force
   (bandset.js) is not the one its proposer version pins, the other proposers'
   rows are still committed and its own are skipped with a warning the Action's
   summary shows.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const L = require('../../../instruments/forecast/ledger.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const FEED = path.join(ROOT, 'corpus', 'janela', 'feed');
const LEDGER = path.join(ROOT, 'certs', 'janela-ledger');
const SCORED_KINDS = new Set(['field', 'platform', 'coast']);
const TARGET = 'Hs (m) measured by satellite altimeter: exact mean of NOAA RADS NRT 1 Hz values within 100 km of the site, '
  + 'over the pass whose mid-time is nearest the target time and within 3 h (>= 5 points)';
const PROPOSER = 'ECMWF ENS wave (open data, 50 members): order statistics 6 and 45 — the central 40 of 50';
/* the definitions above are versioned here and named in every row; a change of
   definition is a new TARGET_ID, never a silent edit of an old one */
const TARGET_ID = 'altimeter-hs-v1 (apps/janela/audit/commit.js)';
const DOMAIN_NOTE = { target: TARGET, proposer: PROPOSER, claim: '4/5', alpha: '1/5' };
/* the calibrated proposers: Janela's own band, one proposer per bands record in force (bandset.js: the record
   of 2026-10-06 and each measured region's), committed only from the record whose sha256 is PINNED HERE —
   a rebuilt record is a new proposer version, never a silent swap; a record with no pin commits nothing */
const CAL_PINS = {
  'janela/hs-altimeter/calibrated-v1': '1f14a51fac100bd1083468eb5cfda7bf13e5d9e864a0c200eb7cfcdd49316d8d',
  /* Sergipe-Alagoas, measured 2026-10-07 (certs/janela-bands-sergipe.json; regions.json states its footprint caveat) */
  'janela/hs-altimeter/calibrated-sergipe-v1': '175a5ce26d4a4945b05e3bb54e5f8a4da5256cc6df2e31c0b023ce18bcf22cb0'
};
/* v1's rows keep the id suffix they were born with */
const calSuffix = (domain) => (domain === 'janela/hs-altimeter/calibrated-v1' ? ':cal' : ':' + domain.split('/').pop());

const MARGIN_MS = 3600e3;     /* a target at least an hour after madeAt */
const frac = (s) => { const [n, d = '1'] = String(s).split('/'); return [n, d]; };

function main() {
  const files = fs.readdirSync(FEED).filter((f) => /^\d{8}\.json\.gz$/.test(f)).sort();
  const want = process.argv[2] ? process.argv[2] + '.json.gz' : files[files.length - 1];
  if (!files.includes(want)) throw new Error('REFUSED: no feed ' + want);
  const raw = zlib.gunzipSync(fs.readFileSync(path.join(FEED, want)));
  const feed = JSON.parse(raw.toString('utf8'));
  const feedSha = require('crypto').createHash('sha256').update(raw).digest('hex');
  fs.mkdirSync(LEDGER, { recursive: true });
  /* madeAt is the moment of THIS commit (the git push that follows is its outside proof),
     never the earlier moment the feed was read — a target between the two would look
     committed before it was */
  const madeAt = new Date().toISOString().slice(0, 19) + 'Z';
  let made = 0, past = 0, dup = 0;
  const cals = [];
  for (const r of require('./bandset.js').records()) {
    const buf = fs.readFileSync(path.join(ROOT, r.bands)), h = require('crypto').createHash('sha256').update(buf).digest('hex');
    const pin = CAL_PINS[r.proposer];
    /* a rebuilt bands record is a NEW proposer version: pin its sha under a new name, never swap it into an old one */
    if (!pin) { console.log('::warning title=janela ' + r.proposer + ' not pinned::' + r.bands + ' (' + h.slice(0, 16) + ') is in force but no proposer version pins it in commit.js: nothing committed from it'); continue; }
    if (h !== pin) { console.log('::warning title=janela ' + r.proposer + ' skipped::' + r.bands + ' is not the bands record ' + r.proposer + ' pins (' + pin.slice(0, 16) + ', found ' + h.slice(0, 16) + '): its rows are NOT committed today; the other proposers\' are.'); continue; }
    cals.push({ domain: r.proposer, sha: pin, rec: JSON.parse(buf.toString('utf8')) });
  }
  for (const [sid, site] of Object.entries(feed.sites)) {
    if (!SCORED_KINDS.has(site.kind) || !site.node) continue;
    for (const st of site.steps) {
      if (!st.hs || st.hs.lo === undefined) continue;
      const targetTime = st.t + ':00:00Z';
      const id = 'janela:' + sid + ':' + feed.run + ':+' + st.lead + 'h';
      const ledger = path.join(LEDGER, st.t.slice(0, 4) + st.t.slice(5, 7) + '.jsonl');
      if (!(Date.parse(targetTime) - Date.parse(madeAt) >= MARGIN_MS)) { past++; continue; }
      for (const cal of cals) {
        const bin = Math.min(Math.floor(st.lead / cal.rec.binHours), Math.floor(168 / cal.rec.binHours) - 1) * cal.rec.binHours;
        const cell = cal.rec.sites[sid] && cal.rec.sites[sid].bins[bin] && cal.rec.sites[sid].bins[bin].hs;
        if (!cell || cell.verdict !== 'CERTIFIED-COVERAGE') continue;
        const mul = (a, b) => { const [an, ad] = frac(a), [bn, bd] = frac(b); return [String(BigInt(an) * BigInt(bn)), String(BigInt(ad) * BigInt(bd))]; };
        try {
          L.commit(ledger, { id: id + calSuffix(cal.domain), domain: cal.domain, target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
            forecast: { lo: mul(st.hs.det, cell.lo), hi: mul(st.hs.det, cell.hi), alpha: [1, 10], det: st.hs.det, lead: st.lead,
              node: site.node, feed: want.slice(0, 8), bandsSha: cal.sha.slice(0, 16), coverage: cell.coverage, n: cell.n } });
          made++;
        } catch (e) { if (!/duplicate commit id/.test(e.message)) throw e; }
      }
      try {
        L.commit(ledger, { id, domain: 'janela/hs-altimeter/ens-c40of50', target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
          forecast: { lo: frac(st.hs.lo), hi: frac(st.hs.hi), alpha: [1, 5], det: st.hs.det, lead: st.lead,
            node: site.node, feed: want.slice(0, 8), feedSha: feedSha.slice(0, 16) } });
        made++;
      } catch (e) {
        if (/duplicate commit id/.test(e.message)) { dup++; continue; }
        throw e;
      }
    }
  }
  const readme = path.join(LEDGER, 'DEFINITIONS.json');
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, JSON.stringify({ [TARGET_ID]: DOMAIN_NOTE }, null, 1) + '\n');
  console.log('janela ledger: ' + made + ' committed, ' + past + ' skipped (target past or under an hour away), ' + dup + ' already committed — feed ' + want);
}

main();
