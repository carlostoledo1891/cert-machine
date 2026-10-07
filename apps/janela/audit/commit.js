/* commit.js — today's ensemble bands go into the ledger BEFORE the sea happens.
   apps/janela/audit · cert-machine

     node apps/janela/audit/commit.js [YYYYMMDD]          (default: the newest feed)
     node apps/janela/audit/commit.js --noaa [YYYYMMDD]   NOAA's band, from corpus/janela/feed-noaa (noaa.py)

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

   THE SECOND PROVIDER (--noaa, from 2026-10-07): NOAA's GEFS-Wave, order
   statistics 4 and 28 of its 31 members (the central 25; the exchangeable claim
   24/32 = 3/4), committed under its own proposer name with the SAME target, the
   same margin and the same ledger files, so the PLACAR grades both providers on
   the same satellite passes. Its own step in the Action, after the ECMWF push:
   NOAA can never hold up or break the ECMWF day.

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
/* NOAA's ensemble (noaa.py): its band and claim are the feed's own, checked here against the definition */
const NOAA = { domain: 'janela/hs-altimeter/noaa-gefs-c25of31', alpha: [1, 4], members: 31, band: 'order statistics 4 and 28 of 31 sorted members (the central 25)' };
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
  'janela/hs-altimeter/calibrated-sergipe-v1': '175a5ce26d4a4945b05e3bb54e5f8a4da5256cc6df2e31c0b023ce18bcf22cb0',
  /* NOAA, calibrated on its own pairs 2026-10-07 (certs/janela-bands-noaa.json); committed by --noaa from GFS-Wave's own Hs */
  'janela/hs-altimeter/calibrated-noaa-v1': 'beaf366df295ba48aacb5e52f7c47f57de3676153f7efc8820beb67407b995af',
  /* NOAA at Sergipe-Alagoas, calibrated on the region's own pairs 2026-10-07 (certs/janela-bands-noaa-sergipe.json) */
  'janela/hs-altimeter/calibrated-noaa-sergipe-v1': '991211a94b70aa44e142c91475d4fe7197a0f65ca013164aace8f2c0c8f439c1'
};
/* v1's rows keep the id suffix they were born with */
const calSuffix = (domain) => (domain === 'janela/hs-altimeter/calibrated-v1' ? ':cal' : ':' + domain.split('/').pop());

const MARGIN_MS = 3600e3;     /* a target at least an hour after madeAt */
const frac = (s) => { const [n, d = '1'] = String(s).split('/'); return [n, d]; };

/* the calibrated proposers of one provider whose bands record is in force AND pinned here (bandset.js records) */
function pinnedCals(provider) {
  const cals = [];
  for (const r of require('./bandset.js').records().filter((x) => x.provider === provider)) {
    const buf = fs.readFileSync(path.join(ROOT, r.bands)), h = require('crypto').createHash('sha256').update(buf).digest('hex');
    const pin = CAL_PINS[r.proposer];
    /* a rebuilt bands record is a NEW proposer version: pin its sha under a new name, never swap it into an old one */
    if (!pin) { console.log('::warning title=janela ' + r.proposer + ' not pinned::' + r.bands + ' (' + h.slice(0, 16) + ') is in force but no proposer version pins it in commit.js: nothing committed from it'); continue; }
    if (h !== pin) { console.log('::warning title=janela ' + r.proposer + ' skipped::' + r.bands + ' is not the bands record ' + r.proposer + ' pins (' + pin.slice(0, 16) + ', found ' + h.slice(0, 16) + '): its rows are NOT committed today; the other proposers\' are.'); continue; }
    cals.push({ domain: r.proposer, sha: pin, rec: JSON.parse(buf.toString('utf8')) });
  }
  return cals;
}

/* the calibrated band of one pinned proposer at a step: [det * r_lo, det * r_hi] of the site's lead bin, or null */
const mulFr = (a, b) => { const [an, ad] = frac(a), [bn, bd] = frac(b); return [String(BigInt(an) * BigInt(bn)), String(BigInt(ad) * BigInt(bd))]; };
function calCell(cal, sid, lead) {
  const bin = Math.min(Math.floor(lead / cal.rec.binHours), Math.floor(168 / cal.rec.binHours) - 1) * cal.rec.binHours;
  const cell = cal.rec.sites[sid] && cal.rec.sites[sid].bins[bin] && cal.rec.sites[sid].bins[bin].hs;
  return cell && cell.verdict === 'CERTIFIED-COVERAGE' ? cell : null;
}

/* the newest (or the named) feed of a directory, gunzipped and hashed as read */
function readFeed(dir, day) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^\d{8}\.json\.gz$/.test(f)).sort() : [];
  const want = day ? day + '.json.gz' : files[files.length - 1];
  if (!files.includes(want)) throw new Error('REFUSED: no feed ' + want + ' in ' + path.relative(ROOT, dir));
  const raw = zlib.gunzipSync(fs.readFileSync(path.join(dir, want)));
  return { want, feed: JSON.parse(raw.toString('utf8')), feedSha: require('crypto').createHash('sha256').update(raw).digest('hex') };
}

/* NOAA's rows, pure (the battery feeds it synthetic feeds): one per open-sea site and step that carries a band
   and whose target is at least the margin ahead; a feed whose band is not the definition's is refused whole */
function noaaRows(feed, feedSha, want, madeAt, cals) {
  const e = feed.ensemble || {};
  if (e.source !== 'GEFS-Wave' || (e.members || []).length !== NOAA.members || e.band !== NOAA.band || e.claim !== '3/4') {
    throw new Error('REFUSED: ' + want + ' does not carry the band ' + NOAA.domain + ' is defined by (' + NOAA.band + ', claim 3/4)');
  }
  const rows = [];
  let past = 0;
  for (const [sid, site] of Object.entries(feed.sites)) {
    if (!SCORED_KINDS.has(site.kind) || !site.node) continue;
    for (const st of site.steps) {
      if (!st.hs) continue;
      const targetTime = st.t + ':00:00Z';
      if (!(Date.parse(targetTime) - Date.parse(madeAt) >= MARGIN_MS)) { past++; continue; }
      const ledger = st.t.slice(0, 4) + st.t.slice(5, 7) + '.jsonl', base = 'janela:' + sid + ':' + feed.run + ':+' + st.lead + 'h:';
      /* NOAA's calibrated band (calibrated-noaa-v1): GFS-Wave's deterministic Hs x the ratio interval of NOAA's own pairs */
      for (const cal of (st.hs.det !== undefined ? cals || [] : [])) {
        const cell = calCell(cal, sid, st.lead);
        if (!cell) continue;
        rows.push({ ledger, c: { id: base + cal.domain.split('/').pop(), domain: cal.domain, target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
          forecast: { lo: mulFr(st.hs.det, cell.lo), hi: mulFr(st.hs.det, cell.hi), alpha: [1, 10], det: st.hs.det, lead: st.lead,
            node: site.node, feed: 'noaa/' + want.slice(0, 8), bandsSha: cal.sha.slice(0, 16), coverage: cell.coverage, n: cell.n } } });
      }
      if (st.hs.lo === undefined) continue;
      rows.push({ ledger, c: {
        id: base + NOAA.domain.split('/').pop(), domain: NOAA.domain,
        target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
        forecast: { lo: frac(st.hs.lo), hi: frac(st.hs.hi), alpha: NOAA.alpha, det: st.hs.det === undefined ? null : st.hs.det, lead: st.lead,
          node: site.node, feed: 'noaa/' + want.slice(0, 8), feedSha: feedSha.slice(0, 16) } } });
    }
  }
  return { rows, past };
}

/* THE BAND THAT DECIDES, graded as itself (union-v1, from 2026-10-07): where both providers' calibrated bands exist at a
   site and step — ECMWF's deterministic Hs x calibrated-v1's interval, NOAA's x calibrated-noaa-v1's — their union
   [min lo, max hi], the band the app decides on (providers-v1). Claim 9/10: the union covers whenever either covers,
   so the provable claim is the components' (measured on 15 held-out months: 0.965, certs/janela-providers-eval.json).
   Pure; the battery feeds it synthetic feeds. */
const UNION = 'janela/hs-altimeter/union-v1';
/* each union names its two components; a band of one record is never joined with another record's (main never with a region) */
const UNIONS = {
  'janela/hs-altimeter/calibrated-v1|janela/hs-altimeter/calibrated-noaa-v1': UNION,
  'janela/hs-altimeter/calibrated-sergipe-v1|janela/hs-altimeter/calibrated-noaa-sergipe-v1': 'janela/hs-altimeter/union-sergipe-v1'
};
function unionRows(feedE, wantE, feedN, wantN, madeAt, calsE, calsN) {
  const rows = [];
  if (feedE.run !== feedN.run) throw new Error('REFUSED: the union needs one run of both providers (' + feedE.run + ' vs ' + feedN.run + ')');
  for (const [sid, site] of Object.entries(feedN.sites)) {
    const siteE = feedE.sites[sid];
    if (!SCORED_KINDS.has(site.kind) || !site.node || !siteE || !siteE.node) continue;
    for (const st of site.steps) {
      const stE = siteE.steps.find((x) => x.t === st.t);
      if (!stE || !stE.hs || !st.hs || stE.hs.det === undefined || st.hs.det === undefined) continue;
      const targetTime = st.t + ':00:00Z';
      if (!(Date.parse(targetTime) - Date.parse(madeAt) >= MARGIN_MS)) continue;
      const ce = calsE.map((c) => [c, calCell(c, sid, st.lead)]).find((x) => x[1]), cn = calsN.map((c) => [c, calCell(c, sid, st.lead)]).find((x) => x[1]);
      if (!ce || !cn) continue;
      const domain = UNIONS[ce[0].domain + '|' + cn[0].domain];
      if (!domain) continue;
      const a = [mulFr(stE.hs.det, ce[1].lo), mulFr(stE.hs.det, ce[1].hi)], b = [mulFr(st.hs.det, cn[1].lo), mulFr(st.hs.det, cn[1].hi)];
      const le = (x, y) => BigInt(x[0]) * BigInt(y[1]) <= BigInt(y[0]) * BigInt(x[1]);
      rows.push({ ledger: st.t.slice(0, 4) + st.t.slice(5, 7) + '.jsonl', c: {
        id: 'janela:' + sid + ':' + feedN.run + ':+' + st.lead + 'h:' + domain.split('/').pop(), domain, target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
        forecast: { lo: le(a[0], b[0]) ? a[0] : b[0], hi: le(a[1], b[1]) ? b[1] : a[1], alpha: [1, 10], lead: st.lead,
          det: { ecmwf: stE.hs.det, noaa: st.hs.det }, node: { ecmwf: siteE.node, noaa: site.node }, feed: { ecmwf: wantE.slice(0, 8), noaa: 'noaa/' + wantN.slice(0, 8) },
          bandsSha: { [ce[0].domain]: ce[0].sha.slice(0, 16), [cn[0].domain]: cn[0].sha.slice(0, 16) } } } });
    }
  }
  return rows;
}

function commitNoaa(day, madeAt) {
  const { want, feed, feedSha } = readFeed(path.join(ROOT, 'corpus', 'janela', 'feed-noaa'), day);
  const { rows, past } = noaaRows(feed, feedSha, want, madeAt, pinnedCals('noaa'));
  /* the union needs ECMWF's feed of the same run (pushed by the step before); without it, no union rows today */
  try {
    const E = readFeed(FEED, want.slice(0, 8));
    rows.push(...unionRows(E.feed, E.want, feed, want, madeAt, pinnedCals('ecmwf'), pinnedCals('noaa')));
  } catch (err) {
    if (!/no feed/.test(err.message)) throw err;
    console.log('::warning title=janela union-v1 skipped::no ECMWF feed for ' + want.slice(0, 8) + ': no union rows today');
  }
  let made = 0, dup = 0;
  for (const r of rows) {
    try { L.commit(path.join(LEDGER, r.ledger), r.c); made++; } catch (err) { if (/duplicate commit id/.test(err.message)) { dup++; continue; } throw err; }
  }
  console.log('janela ledger (NOAA): ' + made + ' committed, ' + past + ' skipped (target past or under an hour away), ' + dup + ' already committed — feed-noaa ' + want);
}

function main() {
  const args = process.argv.slice(2);
  /* madeAt is the moment of THIS commit (the git push that follows is its outside proof),
     never the earlier moment the feed was read — a target between the two would look
     committed before it was */
  const madeAt = new Date().toISOString().slice(0, 19) + 'Z';
  fs.mkdirSync(LEDGER, { recursive: true });
  if (args[0] === '--noaa') return commitNoaa(args[1], madeAt);
  const { want, feed, feedSha } = readFeed(FEED, args[0]);
  let made = 0, past = 0, dup = 0;
  const cals = pinnedCals('ecmwf');
  for (const [sid, site] of Object.entries(feed.sites)) {
    if (!SCORED_KINDS.has(site.kind) || !site.node) continue;
    for (const st of site.steps) {
      if (!st.hs || st.hs.lo === undefined) continue;
      const targetTime = st.t + ':00:00Z';
      const id = 'janela:' + sid + ':' + feed.run + ':+' + st.lead + 'h';
      const ledger = path.join(LEDGER, st.t.slice(0, 4) + st.t.slice(5, 7) + '.jsonl');
      if (!(Date.parse(targetTime) - Date.parse(madeAt) >= MARGIN_MS)) { past++; continue; }
      for (const cal of cals) {
        const cell = calCell(cal, sid, st.lead);
        if (!cell) continue;
        try {
          L.commit(ledger, { id: id + calSuffix(cal.domain), domain: cal.domain, target: sid + ' · ' + TARGET_ID, targetTime, madeAt,
            forecast: { lo: mulFr(st.hs.det, cell.lo), hi: mulFr(st.hs.det, cell.hi), alpha: [1, 10], det: st.hs.det, lead: st.lead,
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

if (require.main === module) main();

module.exports = { NOAA, UNION, UNIONS, TARGET_ID, MARGIN_MS, noaaRows, unionRows };
