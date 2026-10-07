/* today.js — the week ahead at every Janela site, as bands and verdicts.
   apps/janela/audit · cert-machine

   compute(feed, bands, operations, sites) -> the page's data object.

   For each site and each forecast step of the day's feed:
     Hs band    [f * r_lo, f * r_hi] — f the ECMWF deterministic forecast at the
                site's sea node, [r_lo, r_hi] the exact conformal ratio interval of
                the site's 12 h lead bin (certs/janela-bands.json; a terminal
                borrows its open-sea neighbour's, named);
     wind band  [s_lo + d_lo, s_hi + d_hi] m/s, floored at 0: [s_lo, s_hi] the
                outward enclosure of the forecast speed sqrt(u^2+v^2) (integer square
                roots, 1e-6 m/s), [d_lo, d_hi] the exact conformal interval of
                observed - forecast speed of the lead bin (additive: a ratio blows up
                at low forecast speeds); converted to knots exactly (1 kn = 463/900 m/s);
     ensemble   the ECMWF ensemble's central 40 of 50 (the ledger's first
                proposer), shown beside, never decided on.
     second     (providers-v1, certs/janela-ledger/DEFINITIONS.json) where a second
                provider's calibrated band exists at the step — NOAA's deterministic
                Hs (and wind) at its own node times the interval of ITS OWN satellite
                pairs (certs/janela-bands-noaa.json) — the step decides on the UNION
                [min lo, max hi]: it covers whenever either covers, so its coverage is
                at least the larger claim. row.hs.from names the providers that
                made the band (absent: ECMWF's alone).
   A lead bin whose interval was REFUSED (too few pairs) leaves that variable
   unforecast at that step: the decider then says SEM DADOS, never guesses.
   Each operation of operations.json is decided step by step (the condition at
   that hour) by instruments/window/decide.js. Where the operation's wave limit
   applies at a berth (hsAt 'berth'), the open-sea Hs band is withheld from the
   decider: the berth's sea is not the node's.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const Q = require('../../../instruments/window/q.js');
const D = require('../../../instruments/window/decide.js');

const sqrtEnc = Q.sqrtEnc;
const KN_PER_MS = Q.norm(900n, 463n);

function bandFor(bands, sid, lead) {
  const own = bands.sites[sid] ? sid : bands.borrow[sid];
  const s = own && bands.sites[own];
  if (!s) return { from: own || null };
  const bin = Math.min(Math.floor(lead / bands.binHours), Math.floor(168 / bands.binHours) - 1) * bands.binHours;
  return { from: own, cell: s.bins[bin] || null };
}

/* one provider's calibrated band at a step: Hs [f * r_lo, f * r_hi], wind [s_lo + d_lo, s_hi + d_hi] in knots
   floored at 0 — exact, or null where the provider has no forecast or its cell was REFUSED */
function calibrated(st, cell) {
  const out = { hs: null, wind: null };
  if (st.hs && st.hs.det !== undefined) {
    const c = cell && cell.hs;
    if (c && c.verdict === 'CERTIFIED-COVERAGE') {
      const det = Q.parse(st.hs.det);
      out.hs = { lo: Q.mul(det, Q.parse(c.lo)), hi: Q.mul(det, Q.parse(c.hi)), n: c.n, coverage: c.coverage };
    }
  }
  if (st.wind) {
    const c = cell && cell.windDiff;
    if (c && c.verdict === 'CERTIFIED-COVERAGE') {
      const u = Q.parse(st.wind.u), v = Q.parse(st.wind.v);
      const [slo, shi] = sqrtEnc(Q.add(Q.mul(u, u), Q.mul(v, v)));
      const ZERO = [0n, 1n];
      const lo = Q.max(ZERO, Q.add(slo, Q.parse(c.lo))), hi = Q.max(ZERO, Q.add(shi, Q.parse(c.hi)));
      out.wind = { lo: Q.mul(lo, KN_PER_MS), hi: Q.mul(hi, KN_PER_MS), n: c.n, coverage: c.coverage };
    }
  }
  return out;
}

/* the published form of a band, and the union of two (providers-v1); one band alone is itself */
const pub = (b, places) => ({ lo: Q.str(b.lo), hi: Q.str(b.hi), loDec: Q.dec(b.lo, places, 'down'), hiDec: Q.dec(b.hi, places, 'up'), n: b.n, coverage: b.coverage });
function joined(a, b, places) {
  if (!a && !b) return null;
  if (!b) return pub(a, places);
  if (!a) return Object.assign(pub(b, places), { from: ['noaa'] });
  return Object.assign(pub({ lo: Q.min(a.lo, b.lo), hi: Q.max(a.hi, b.hi), n: a.n, coverage: a.coverage }, places), { from: ['ecmwf', 'noaa'] });
}

/* compute(feed, bands, operations, sites[, second]) — second = { feed, bands }: the other provider's day (its
   deterministic forecast at its own node, same run) and its bands record; absent, every step is ECMWF's alone */
function compute(feed, bands, operations, sites, second) {
  const out = { run: feed.run, madeAt: feed.madeAt, sites: {}, operations: [] };
  for (const site of sites) {
    const f = feed.sites[site.id];
    if (!f || !f.node) { out.sites[site.id] = { name: site.name, en: site.en, kind: site.kind, node: null, steps: [] }; continue; }
    const steps = [];
    let borrowed = null;
    for (const st of f.steps) {
      const b = bandFor(bands, site.id, st.lead);
      if (b.from && b.from !== site.id) borrowed = b.from;
      const row = { t: st.t, lead: st.lead };
      const own = calibrated(st, b.cell);
      /* the second provider at the same hour, through ITS bands record (a terminal or unit borrows by the same table) */
      const s2 = second && second.feed.sites[site.id];
      const st2 = s2 && s2.node && s2.steps.find((x) => x.t === st.t);
      const other = st2 ? calibrated(st2, bandFor(second.bands, site.id, st.lead).cell) : { hs: null, wind: null };
      if (st.hs) {
        row.hsDet = Q.dec(Q.parse(st.hs.det), 2);
        if (st.hs.lo) row.ens = [Q.dec(Q.parse(st.hs.lo), 2), Q.dec(Q.parse(st.hs.hi), 2)];
        row.hs = joined(own.hs, other.hs, 2);
      }
      if (st.wind) {
        const u = Q.parse(st.wind.u), v = Q.parse(st.wind.v);
        const [slo] = sqrtEnc(Q.add(Q.mul(u, u), Q.mul(v, v)));
        row.windDetKn = Q.dec(Q.mul(slo, KN_PER_MS), 1);
        if (st.wind.gust) row.gustKn = Q.dec(Q.mul(Q.parse(st.wind.gust), KN_PER_MS), 1);
        row.wind = joined(own.wind, other.wind, 1);
      }
      if (st.tp) row.tp = Q.dec(Q.parse(st.tp), 1);
      if (st.mwd) row.mwd = Q.dec(Q.parse(st.mwd), 0);
      /* the long-period swell from ECMWF's Hs by period band (forecast ink, never decided): the Hs of the waves of
         10 s and longer, 12 s and longer, 14 s and longer — the root of the bands' summed squares, rounded down */
      if (st.pb && st.pb.length === 6) {
        const sq = st.pb.map((x) => { const q = Q.parse(x); return Q.mul(q, q); });
        const from = (k) => Q.dec(sqrtEnc(sq.slice(k).reduce((a, b) => Q.add(a, b), Q.parse('0')))[0], 2);
        row.ls = [from(0), from(1), from(2)];
      }
      steps.push(row);
    }
    out.sites[site.id] = { name: site.name, en: site.en, kind: site.kind, lat: site.lat, lon: site.lon, node: f.node, bandFrom: borrowed, steps };
  }
  for (const op of operations) {
    const s = out.sites[op.site];
    const per = [];
    for (const st of (s && s.steps) || []) {
      const vars = {};
      if (st.hs && op.hsAt !== 'berth') vars.hs = { lo: st.hs.lo, hi: st.hs.hi };
      if (st.wind) vars.wind_sustained = { lo: st.wind.lo, hi: st.wind.hi };
      const fc = { unit: { hs: 'm', wind_sustained: 'kn' }, coverage: '9/10 per variable (conformal, site and lead bin)', proposer: 'janela-calibrated-v1',
        steps: [{ t: st.t, vars }] };
      const v = D.decide({ id: op.id, limits: op.limits }, fc, [st.t, st.t]);
      per.push({ t: st.t, lead: st.lead, verdict: v.verdict, en: v.en, why: v.why, flip: v.flip || null, witness: v.witness || null,
        notForecast: v.notForecast, decidedOn: v.decidedOn });
    }
    out.operations.push({ id: op.id, site: op.site, name: op.name, en: op.en, rule: op.rule, hsAt: op.hsAt, status: op.status || 'in force',
      limits: op.limits, derivation: op.derivation, steps: per });
  }
  return out;
}

module.exports = { compute, sqrtEnc };
