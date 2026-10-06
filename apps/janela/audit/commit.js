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
/* the second proposer: Janela's own band (certs/janela-bands.json), committed only from a
   bands record whose sha256 is named here — a rebuilt record is a new proposer version */
const CAL = { domain: 'janela/hs-altimeter/calibrated-v1', bands: path.join(ROOT, 'certs', 'janela-bands.json'), sha: '1f14a51fac100bd1083468eb5cfda7bf13e5d9e864a0c200eb7cfcdd49316d8d',
  note: 'forecast x the exact conformal ratio interval of its site and 12 h lead bin (miss-rate 1/10) — certs/janela-bands.json' };

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
  const cal = CAL.sha && fs.existsSync(CAL.bands) ? JSON.parse(fs.readFileSync(CAL.bands, 'utf8')) : null;
  if (cal) {
    const h = require('crypto').createHash('sha256').update(fs.readFileSync(CAL.bands)).digest('hex');
    if (h !== CAL.sha) throw new Error('REFUSED: certs/janela-bands.json is not the bands record this proposer version names (' + CAL.sha.slice(0, 16) + ')');
  }
  for (const [sid, site] of Object.entries(feed.sites)) {
    if (!SCORED_KINDS.has(site.kind) || !site.node) continue;
    for (const st of site.steps) {
      if (!st.hs || st.hs.lo === undefined) continue;
      const targetTime = st.t + ':00:00Z';
      const id = 'janela:' + sid + ':' + feed.run + ':+' + st.lead + 'h';
      const ledger = path.join(LEDGER, st.t.slice(0, 4) + st.t.slice(5, 7) + '.jsonl');
      if (!(madeAt < targetTime)) { past++; continue; }
      if (CAL.sha && cal) {
        const bin = Math.min(Math.floor(st.lead / cal.binHours), Math.floor(168 / cal.binHours) - 1) * cal.binHours;
        const cell = cal.sites[sid] && cal.sites[sid].bins[bin] && cal.sites[sid].bins[bin].hs;
        if (cell && cell.verdict === 'CERTIFIED-COVERAGE') {
          const mul = (a, b) => { const [an, ad] = frac(a), [bn, bd] = frac(b); return [String(BigInt(an) * BigInt(bn)), String(BigInt(ad) * BigInt(bd))]; };
          try {
            L.commit(ledger, { id: id + ':cal', domain: CAL.domain, target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
              forecast: { lo: mul(st.hs.det, cell.lo), hi: mul(st.hs.det, cell.hi), alpha: [1, 10], det: st.hs.det, lead: st.lead,
                node: site.node, feed: want.slice(0, 8), bandsSha: CAL.sha.slice(0, 16), coverage: cell.coverage, n: cell.n } });
            made++;
          } catch (e) { if (!/duplicate commit id/.test(e.message)) throw e; }
        }
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
  console.log('janela ledger: ' + made + ' committed, ' + past + ' skipped (target already past), ' + dup + ' already committed — feed ' + want);
}

main();
