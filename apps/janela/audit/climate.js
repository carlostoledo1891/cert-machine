/* climate.js — the 32-year workability of each basin, counted exactly.
   apps/janela/audit · cert-machine

     node apps/janela/audit/climate.js        writes certs/janela-workability.json

   For every Janela site on a pinned hindcast node (sites.json "ww3"), every
   wave limit OPLIM in LIMITS and every reference period TR in PERIODS: how
   often, month by month over 1993–2024, a window of TR hours begins in which
   the hindcast Hs stays at or below
     (a) OPLIM itself — what the sea allows, and
     (b) OPWF = alpha x OPLIM, DNV Table 4-1's alpha for TPOP = TR / 2 (B402's
         default when the contingency time is not assessed) — what a planner
         who obeys the table may start on, if the forecast were the hindcast.
   The gap between (a) and (b) is what forecast uncertainty costs, at the
   table's alpha. Every number is a count of 3-hourly start times
   (instruments/window/workability.js); the hindcast files are sha-checked.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const W = require('../../../instruments/window/workability.js');
const Q = require('../../../instruments/window/q.js');
const H = require('./hindcast.js');
const DNV = require('./dnv.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const SITES = require('../scenario/sites.json').sites.filter((s) => s.ww3);
const LIMITS = ['1.5', '2.0', '2.5', '3.0', '3.5', '4.0'];
const PERIODS = [12, 24, 48, 72];
const ALPHA_P = path.join(ROOT, 'certs', 'janela-alpha.json');
const ALPHA = fs.existsSync(ALPHA_P) ? JSON.parse(fs.readFileSync(ALPHA_P, 'utf8')) : null;
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');

function row(r) {
  return r.months.map((m) => [m.workable, m.starts, m.meanWaitH]).concat([[r.all.workable, r.all.starts, r.all.meanWaitH]]);
}

function main() {
  const out = {
    what: 'Workability of weather-restricted operations at the Janela basin sites, 1993–2024: the count of 3-hourly start times whose TR-hour window keeps the hindcast Hs at or below the limit, per calendar month (index 0-11) and over all months (index 12). Each cell is [workable, determined starts, mean wait to the next workable start in hours as an exact fraction]. "oplim" uses the limit itself; "opwf" uses DNV-OS-H101 Table 4-1 alpha x OPLIM with TPOP = TR/2. Exact counts; nothing fitted.',
    hindcast: null,
    rule: 'instruments/window/workability.js — window = samples k..k+TR/3 inclusive; workable iff all present and Hs <= limit (integer compare on the hindcast packing, Hs = raw/500 m)',
    modules: Object.fromEntries(['instruments/window/workability.js', 'instruments/window/q.js', 'apps/janela/audit/hindcast.js', 'apps/janela/audit/dnv.js', 'apps/janela/scenario/rules/dnv-alpha.json'].map((p) => [p, sha(p)])),
    limits: LIMITS, periods: PERIODS, sites: {},
    alphaRecord: ALPHA ? { path: 'certs/janela-alpha.json', sha256: sha('certs/janela-alpha.json') } : null,
  };
  for (const s of SITES) {
    const series = H.load(s.ww3);
    out.hindcast = { source: series.source, pinned: series.pinned, from: series.from, to: series.to, samples: series.x.length };
    const cells = {};
    for (const lim of LIMITS) {
      for (const TR of PERIODS) {
        const tpop = TR / 2;
        const a = DNV.alpha('4-1', lim, tpop);
        if (!a) throw new Error('REFUSED: no Table 4-1 alpha for ' + lim + ' m, TPOP ' + tpop + ' h');
        const opwf = Q.mul(a, Q.parse(lim));
        const A = W.workability(series, { limit: lim, TR });
        const B = W.workability(series, { limit: opwf, TR });
        cells[lim + 'm/' + TR + 'h'] = { TPOP: tpop, alpha: Q.str(a), opwf: Q.str(opwf), opwfDec: Q.dec(opwf, 3), oplim: row(A), opwfCells: row(B) };
      }
    }
    /* what the site's own alpha would give back: for each Table 4-1 row where certs/janela-alpha.json
       ESTIMATED a site alpha at design Hs 2 m, the same count at OPWF = alpha_site x 2.0 m, with
       alpha_site the LOWER end of its 90% bootstrap interval rounded down to two decimals (the
       conservative direction on both counts). The alpha is a statistical
       estimate; the count over it is exact — the two are never blurred on the page. */
    const siteAlpha = [];
    if (ALPHA && ALPHA.sites[s.id]) {
      for (const c of ALPHA.sites[s.id].cells) {
        if (c.verdict !== 'ESTIMATED' || c.designHs !== 2) continue;
        const TR = 2 * c.TPOP;
        if (!PERIODS.includes(TR)) continue;
        if (!c.ci90 || c.ci90[0] === null) continue;
        const a = Q.parse(String(Math.floor(c.ci90[0] * 100)) + '/100');
        const opwf = Q.mul(a, Q.parse('2.0'));
        const R = W.workability(series, { limit: opwf, TR });
        siteAlpha.push({ TPOP: c.TPOP, TR, alphaSite: Q.str(a), alphaSitePoint: c.alpha, alphaSiteCi90: c.ci90, rule: 'lower end of the 90% interval, rounded down to 0.01', alphaTable: cells['2.0m/' + TR + 'h'].alpha,
          opwf: Q.str(opwf), opwfDec: Q.dec(opwf, 3), cells: row(R) });
      }
    }
    out.sites[s.id] = { node: s.ww3, name: s.name, en: s.en, lat: s.lat, lon: s.lon, cells, siteAlpha };
    console.log(s.id + ': ' + Object.keys(cells).length + ' cells');
  }
  const dest = path.join(ROOT, 'certs', 'janela-workability.json');
  fs.writeFileSync(dest, JSON.stringify(out) + '\n');
  console.log('wrote certs/janela-workability.json (' + Math.round(fs.statSync(dest).size / 1024) + ' KB)');
}

main();
