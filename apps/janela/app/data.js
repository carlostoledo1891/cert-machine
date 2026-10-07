/* data.js — the day's data for the app: every place's forecast steps, its bands
   rounded OUTWARD, and every published decision for the presets.
   apps/janela/app · cert-machine

   make({ feed, platforms, fieldSha }) -> { today, checks }

   The 12 measured sites come from the day's feed through apps/janela/audit/
   today.js (the same function the method page and the ledger read). The 181
   production units come from field.py's platforms-latest.json, turned into
   bands by THE SAME today.js: each unit borrows its measured site's interval
   (bandFrom) through the band record's borrow table, exactly as a terminal does.

   OUTWARD ROUNDING. The exact bands are long fractions; the published ones are
   decimals rounded OUTWARD — Hs to 0.001 m, wind to 0.01 kn, lower edge down and
   upper edge up — and so is the deterministic forecast, carried as the interval
   that holds it. Over a wider band a LIBERADA or a VETADA still holds over the
   exact one; only INDEFINIDA can grow. The build checks exactly that against the
   exact decisions of the terminal rules, and refuses if it ever fails.

   Nothing here is daily-committed to main: the output rides the janela-field
   branch (.github/workflows/janela-feed.yml).                            MIT */
'use strict';
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const Q = require('../../../instruments/window/q.js');
const DNV = require('../audit/dnv.js');
const C = require('../audit/criteria.js');
const TODAY = require('../audit/today.js');
const MODEL = require('./model.js');

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const KN_PER_MS = Q.norm(900n, 463n);
const out3 = (lo, hi) => [Q.dec(Q.parse(lo), 3, 'down'), Q.dec(Q.parse(hi), 3, 'up')];
const out2 = (lo, hi) => [Q.dec(Q.parse(lo), 2, 'down'), Q.dec(Q.parse(hi), 2, 'up')];

/* the wind's direction FROM, in whole degrees: a picture of the forecast, never decided on */
function fromDeg(u, v) {
  const a = Math.atan2(-Number(Q.dec(Q.parse(u), 4)), -Number(Q.dec(Q.parse(v), 4))) * 180 / Math.PI;
  return Math.round((a + 360) % 360) % 360;
}
const addH = (iso, h) => new Date(Date.parse(iso + ':00:00Z') + h * 3600e3).toISOString().slice(0, 13);

/* one published step: [t, lead] + the arrays the criteria read (criteria.js documents them) */
function pubStep(row, src) {
  const st = { t: row.t, lead: row.lead };
  if (src.hs) st.hd = out3(src.hs, src.hs);
  if (row.hs) st.hb = out3(row.hs.lo, row.hs.hi);
  if (src.u !== undefined && src.v !== undefined) {
    const u = Q.parse(src.u), v = Q.parse(src.v);
    const [lo, hi] = Q.sqrtEnc(Q.add(Q.mul(u, u), Q.mul(v, v)));
    st.wd = out2(Q.str(Q.mul(lo, KN_PER_MS)), Q.str(Q.mul(hi, KN_PER_MS)));
    st.wdir = fromDeg(src.u, src.v);
  }
  if (row.wind) st.wb = out2(row.wind.lo, row.wind.hi);
  if (row.gustKn !== undefined && Number(row.gustKn) > 0) st.g = row.gustKn;
  if (row.tp) st.tp = row.tp;
  if (row.mwd !== undefined) st.mwd = row.mwd;
  if (row.ens) st.ens = row.ens;
  return st;
}

function make({ feed, platforms, fieldSha, ledger, battery, git }) {
  const M = MODEL.load();
  const SITES = require('../scenario/sites.json').sites;
  const UNITS = require('../scenario/platforms.json').units;
  const OPS = require('../scenario/operations.json').operations;
  const bands = require('../../../certs/janela-bands.json');
  if (platforms.run !== feed.run) throw new Error('the units\' forecast (' + platforms.run + ') is not the feed\'s run (' + feed.run + ')');

  /* the measured sites, through today.js */
  const T = TODAY.compute(feed, bands, OPS, SITES);
  const steps = {};
  for (const s of SITES) {
    const t = T.sites[s.id], f = feed.sites[s.id];
    if (!t || !t.node) continue;
    steps[s.id] = { node: t.node, bandFrom: t.bandFrom || null, steps: t.steps.map((row, k) => {
      const src = f.steps[k];
      return pubStep(row, { hs: src.hs && src.hs.det, u: src.wind && src.wind.u, v: src.wind && src.wind.v });
    }) };
  }
  /* the units, through the same today.js: their forecast as a feed, their band borrowed by name */
  const ufeed = { run: feed.run, madeAt: feed.madeAt, sites: {} };
  const borrow = Object.assign({}, bands.borrow);
  for (const u of UNITS) {
    const p = platforms.units[u.id];
    if (!p) continue;
    if (u.bandFrom) borrow[u.id] = u.bandFrom;
    ufeed.sites[u.id] = { node: p.node, steps: p.steps.map((x) => {
      const st = { t: addH(feed.run, x.lead), lead: x.lead };
      if (x.hs !== undefined) st.hs = { det: x.hs };
      if (x.u !== undefined && x.v !== undefined) st.wind = Object.assign({ u: x.u, v: x.v }, x.gust !== undefined ? { gust: x.gust } : {});
      if (x.tp !== undefined) st.tp = x.tp;
      if (x.mwd !== undefined) st.mwd = x.mwd;
      return st;
    }) };
  }
  const UT = TODAY.compute(ufeed, Object.assign({}, bands, { borrow }), [], UNITS.map((u) => ({ id: u.id, name: u.name, kind: 'uep', lat: u.lat, lon: u.lon })));
  for (const u of UNITS) {
    const t = UT.sites[u.id], f = ufeed.sites[u.id];
    if (!t || !t.node) continue;
    steps[u.id] = { node: t.node, bandFrom: t.bandFrom || null, steps: t.steps.map((row, k) => {
      const src = f.steps[k];
      return pubStep(row, { hs: src.hs && src.hs.det, u: src.wind && src.wind.u, v: src.wind && src.wind.v });
    }) };
  }
  const tAxis = steps[SITES[0].id].steps.map((s) => s.t);
  for (const [id, s] of Object.entries(steps)) {
    if (s.steps.length !== tAxis.length || s.steps.some((x, k) => x.t !== tAxis[k])) throw new Error('place ' + id + ' does not share the run\'s 29 steps');
  }

  /* the published decisions: every place x preset x criterion x start, and every terminal rule (band, condition at the hour) */
  const dec = {};
  const canon = [];
  let n = 0;
  for (const p of M.places) {
    const s = steps[p.id];
    if (!s) continue;
    const r = C.place(p, s.steps, MODEL.ctxFor(M, p, DNV), M.presets, M.npcp, M.crits);
    dec[p.id] = r.row; n += r.n; canon.push(...r.lines);
  }
  const digest = sha(canon.join('\n'));

  /* the outward rounding is SOUND: against the exact decisions of today.js (the terminal rules, condition at
     the hour), a published LIBERADA or VETADA must be the exact one; only INDEFINIDA may differ */
  let sound = 0, grew = 0;
  for (const o of T.operations) {
    const codes = dec[o.site][o.id];
    o.steps.forEach((r, i) => {
      const pub = codes[i], ex = C.CODE[r.verdict];
      if ((pub === 'L' || pub === 'V') && pub !== ex) throw new Error('outward rounding is not sound at ' + o.id + ' ' + r.t + ': published ' + pub + ', exact ' + ex);
      if (pub === 'S' && ex !== 'S') throw new Error('outward rounding changed a SEM DADOS at ' + o.id + ' ' + r.t);
      if (pub !== ex) grew++; else sound++;
    });
  }

  const today = {
    v: 1, model: MODEL.fingerprint(M), git: git || null, run: feed.run, madeAt: feed.madeAt, t: tAxis, lead: steps[SITES[0].id].steps.map((s) => s.lead),
    feed: { file: feed.file, sha: feed.sha },
    inputs: Object.assign({}, M.records, { [feed.file]: feed.sha, 'corpus/janela/field/platforms-latest.json': platforms.sha }, fieldSha ? { 'field.bin': fieldSha } : {}),
    modules: Object.fromEntries(Object.values(MODEL.modules().pins).map((p) => [p.rel, p.sha])),
    battery, presets: M.presets.map((o) => ({ id: o.id, TR: o.TR, limits: o.limits })),
    rounding: { hs: '0.001 m', wind: '0.01 kn', direction: 'outward: lower edge down, upper edge up' },
    /* the steps without their time (it is the shared axis above) */
    places: Object.fromEntries(Object.entries(steps).map(([id, s]) => [id, { node: s.node, bandFrom: s.bandFrom,
      steps: s.steps.map(({ t, lead, ...rest }) => rest) }])),
    dec, decisions: n, digest, ledger
  };
  return { today, checks: { decisions: n, digest, sound, grew, places: Object.keys(steps).length } };
}

/* the reader's tab, in Node: from the PUBLISHED bytes alone (parsed fresh), every decision re-decided by the
   same modules in the same order — the codes and the digest must be the published ones, or the build refuses */
function redecide(json) {
  const T = JSON.parse(json);
  const M = MODEL.load();
  const canon = [];
  let n = 0, same = 0;
  for (const p of M.places) {
    const s = T.places[p.id];
    if (!s) continue;
    const steps = s.steps.map((x, k) => Object.assign({ t: T.t[k], lead: T.lead[k] }, x));
    const r = C.place(p, steps, MODEL.ctxFor(M, p, DNV), T.presets.map((o) => Object.assign({}, M.presets.find((q) => q.id === o.id), o)), M.npcp, M.crits);
    for (const [k, v] of Object.entries(r.row)) if (T.dec[p.id] && T.dec[p.id][k] === v) same += v.length;
    n += r.n; canon.push(...r.lines);
  }
  return { n, same, digest: sha(canon.join('\n')), published: T.digest, decisions: T.decisions };
}

module.exports = { make, pubStep, redecide };
