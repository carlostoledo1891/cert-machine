/* today.js — the week ahead at every Janela site, as bands and verdicts.
   apps/janela/audit · cert-machine

   compute(feed, bands, operations, sites) -> the page's data object.

   For each site and each forecast step of the day's feed:
     Hs band    [f * r_lo, f * r_hi] — f the ECMWF deterministic forecast at the
                site's sea node, [r_lo, r_hi] the exact conformal ratio interval of
                the site's 12 h lead bin (certs/janela-bands.json; a terminal
                borrows its open-sea neighbour's, named);
     wind band  speed^2 in [(u^2+v^2) * q_lo, (u^2+v^2) * q_hi], carried as an
                outward enclosure of the speed (integer square roots, 1e-6 m/s),
                converted to knots exactly (1 kn = 463/900 m/s);
     ensemble   the ECMWF ensemble's central 40 of 50 (the ledger's first
                proposer), shown beside, never decided on.
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

/* sqrt enclosure of a non-negative rational at 1e-6: [lo, hi] */
function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; }
function sqrtEnc(a) {
  const [p, q] = a; const S = 10n ** 6n;
  const r = isqrt(p * q * S * S);
  const lo = Q.norm(r, q * S);
  const hi = r * r === p * q * S * S ? lo : Q.norm(r + 1n, q * S);
  return [lo, hi];
}
const KN_PER_MS = Q.norm(900n, 463n);

function bandFor(bands, sid, lead) {
  const own = bands.sites[sid] ? sid : bands.borrow[sid];
  const s = own && bands.sites[own];
  if (!s) return { from: own || null };
  const bin = Math.min(Math.floor(lead / bands.binHours), Math.floor(168 / bands.binHours) - 1) * bands.binHours;
  return { from: own, cell: s.bins[bin] || null };
}

function compute(feed, bands, operations, sites) {
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
      if (st.hs) {
        const det = Q.parse(st.hs.det);
        row.hsDet = Q.dec(det, 2);
        if (st.hs.lo) row.ens = [Q.dec(Q.parse(st.hs.lo), 2), Q.dec(Q.parse(st.hs.hi), 2)];
        const c = b.cell && b.cell.hs;
        if (c && c.verdict === 'CERTIFIED-COVERAGE') {
          const lo = Q.mul(det, Q.parse(c.lo)), hi = Q.mul(det, Q.parse(c.hi));
          row.hs = { lo: Q.str(lo), hi: Q.str(hi), loDec: Q.dec(lo, 2, 'down'), hiDec: Q.dec(hi, 2, 'up'), n: c.n, coverage: c.coverage };
        } else row.hs = null;
      }
      if (st.wind) {
        const u = Q.parse(st.wind.u), v = Q.parse(st.wind.v);
        const w2 = Q.add(Q.mul(u, u), Q.mul(v, v));
        const [slo, shi] = sqrtEnc(w2);
        row.windDetKn = Q.dec(Q.mul(slo, KN_PER_MS), 1);
        if (st.wind.gust) row.gustKn = Q.dec(Q.mul(Q.parse(st.wind.gust), KN_PER_MS), 1);
        const c = b.cell && b.cell.windSq;
        if (c && c.verdict === 'CERTIFIED-COVERAGE') {
          const lo = sqrtEnc(Q.mul(w2, Q.parse(c.lo)))[0], hi = sqrtEnc(Q.mul(w2, Q.parse(c.hi)))[1];
          const loK = Q.mul(lo, KN_PER_MS), hiK = Q.mul(hi, KN_PER_MS);
          row.wind = { lo: Q.str(loK), hi: Q.str(hiK), loDec: Q.dec(loK, 1, 'down'), hiDec: Q.dec(hiK, 1, 'up'), n: c.n, coverage: c.coverage };
        } else row.wind = null;
      }
      if (st.tp) row.tp = Q.dec(Q.parse(st.tp), 1);
      if (st.mwd) row.mwd = Q.dec(Q.parse(st.mwd), 0);
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
