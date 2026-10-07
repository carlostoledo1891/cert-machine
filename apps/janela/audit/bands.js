/* bands.js — Janela's own forecast band: the forecast times what the satellites
   say the forecast's error has been, per site and lead, with a coverage claim
   that is a counting theorem.
   apps/janela/audit · cert-machine

     node apps/janela/audit/bands.js       reads corpus/janela/matchups.json.gz, writes certs/janela-bands.json
     node apps/janela/audit/bands.js --region sergipe    the region's matchups -> its bands (scenario/regions.json)
     node apps/janela/audit/bands.js --provider noaa     NOAA's matchups (matchups-noaa.json.gz) -> certs/janela-bands-noaa.json

   For each open-sea site and each 12 h lead bin, from the back-archive pairs:
     Hs     r = observed / forecast            (both exact rationals)
     wind   d = observed - forecast speed (m/s), additive — a ratio blows up at low
            forecast speeds; the forecast speed sqrt(u^2+v^2) is irrational, so each pair
            enters TWICE, outward: d against the enclosure's upper end for the lower
            quantile, against its lower end for the upper one (conservative by <= 1e-6)
   and the exact conformal interval of r (and of q) at miss-rate 1/10
   (instruments/forecast/conformal.js): IF the next ratio is exchangeable with
   the calibration ratios of its site and lead bin, THEN it falls inside with
   probability (u - l)/(n + 1) >= 9/10 exactly. The band a forecast f gets is
   [f * r_lo, f * r_hi] (wind: [s_lo + d_lo, s_hi + d_hi]) — the PROPOSAL the decider decides over, and the claim
   the ledger grades going forward. Exchangeability across three years and all
   seasons is the stated hypothesis; the admission rule is what catches it
   failing. A terminal site borrows the band of the open-sea site named in
   BORROW, and says so.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const C = require('../../../instruments/forecast/conformal.js');
const Q = require('../../../instruments/window/q.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const BIN_H = 12, MAX_H = 168;
const MISS = [1, 10];
/* terminal sites have no satellite pairs of their own (a footprint inside a bay is land-contaminated) */
const BORROW = { babitonga: 'floripa', 'sao-sebastiao': 'santos', 'ilha-grande': 'santos', sepetiba: 'santos' };

const frac = (s) => { const [n, d = '1'] = String(s).split('/'); return [BigInt(n), BigInt(d)]; };
const div = (a, b) => [a[0] * b[1], a[1] * b[0]];
const str = (a) => { let [n, d] = a; if (d < 0n) { n = -n; d = -d; } const g = (x, y) => { x = x < 0n ? -x : x; while (y) [x, y] = [y, x % y]; return x; }; const k = g(n, d) || 1n; return (n / k) + '/' + (d / k); };
const dec = (a, p) => (Number(a[0] * 10n ** BigInt(p) / a[1]) / 10 ** p).toFixed(p);

function main() {
  const ri = process.argv.indexOf('--region');
  const region = ri > 0 ? require('../scenario/regions.json').regions[process.argv[ri + 1]] : null;
  if (ri > 0 && !region) throw new Error('REFUSED: no region ' + process.argv[ri + 1] + ' in apps/janela/scenario/regions.json');
  const pi = process.argv.indexOf('--provider');
  const provider = pi > 0 ? process.argv[pi + 1] : 'ecmwf';
  if (provider !== 'ecmwf' && provider !== 'noaa') throw new Error('REFUSED: --provider ' + provider + ' (ecmwf or noaa)');
  if (provider === 'noaa' && region && !region.noaa) throw new Error('REFUSED: region ' + process.argv[ri + 1] + ' names no NOAA chain in regions.json');
  const IN = provider === 'noaa' ? (region ? region.noaa.matchups : 'corpus/janela/matchups-noaa.json.gz') : region ? region.matchups : 'corpus/janela/matchups.json.gz';
  const OUTF = provider === 'noaa' ? (region ? region.noaa.bands : 'certs/janela-bands-noaa.json') : region ? region.bands : 'certs/janela-bands.json';
  const SRC = provider === 'noaa' ? 'NOAA GFS-Wave (WAVEWATCH III)' : 'ECMWF open data';
  const gz = fs.readFileSync(path.join(ROOT, IN));
  const M = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
  if ((M.provider || 'ecmwf') !== provider) throw new Error('REFUSED: ' + IN + ' holds ' + (M.provider || 'ecmwf') + ' pairs, not ' + provider + '\'s');
  const acc = {};
  for (const r of M.rows) {
    const [sid, , , , obs, , , lead, fc, , , wObs, w2] = r;
    const bin = Math.min(Math.floor(lead / BIN_H), MAX_H / BIN_H - 1);
    const k = sid + '|' + bin;
    acc[k] = acc[k] || { hs: [], dLo: [], dHi: [] };
    const f = frac(fc), o = frac(obs);
    if (f[0] > 0n) acc[k].hs.push(div(o, f));
    if (wObs && w2) {
      const [slo, shi] = Q.sqrtEnc(Q.parse(w2)), ow = Q.parse(wObs);
      acc[k].dLo.push(Q.sub(ow, shi)); acc[k].dHi.push(Q.sub(ow, slo));
    }
  }
  const sites = {};
  for (const [k, v] of Object.entries(acc)) {
    const [sid, bin] = k.split('|');
    const cell = (vals) => {
      const c = C.interval(vals.map((x) => [String(x[0]), String(x[1])]), MISS[0], MISS[1]);
      if (c.verdict !== 'CERTIFIED-COVERAGE') return { n: vals.length, verdict: 'REFUSED', why: c.why };
      return { n: c.n, verdict: c.verdict, lo: str(c.lo), hi: str(c.hi), loDec: dec(c.lo, 3), hiDec: dec(c.hi, 3), l: c.l, u: c.u, coverage: c.coverageStr };
    };
    sites[sid] = sites[sid] || { bins: {} };
    /* wind: the lower edge from the pairs taken against the enclosure's upper end, the upper edge
       from the pairs against its lower end — the same order statistics, so the coverage count holds */
    const a = cell(v.dLo), b = cell(v.dHi);
    const wind = a.verdict === 'CERTIFIED-COVERAGE' && b.verdict === 'CERTIFIED-COVERAGE'
      ? { n: a.n, verdict: a.verdict, lo: a.lo, hi: b.hi, loDec: a.loDec, hiDec: b.hiDec, l: a.l, u: b.u, coverage: a.coverage, unit: 'm/s, observed - forecast speed' }
      : { n: v.dLo.length, verdict: 'REFUSED', why: a.why || b.why };
    sites[sid].bins[bin * BIN_H] = { from: bin * BIN_H, to: (bin + 1) * BIN_H, hs: cell(v.hs), windDiff: wind };
  }
  const out = {
    what: 'Janela\'s calibrated forecast band per open-sea site and 12 h lead bin: exact conformal intervals (miss-rate 1/10) of observed/forecast Hs and of observed - forecast 10 m wind speed (m/s), from the back-archive pairs (' + SRC + ' vs NOAA RADS NRT altimetry). The band for a forecast f is [f*lo, f*hi]; for a forecast wind (u, v), [s_lo + lo, s_hi + hi] with [s_lo, s_hi] the enclosure of sqrt(u^2+v^2), floored at 0.',
    theorem: 'IF the next ratio is exchangeable with the calibration ratios of its site and lead bin, THEN P(lo <= next <= hi) = (u - l)/(n + 1) exactly (>= with ties) — instruments/forecast/conformal.js',
    hypothesis: 'exchangeability within a site and a 12 h lead bin, over 2023-07..2026-10 and all seasons; graded going forward by the ledger (exact binomial admission)',
    ...(region ? { region: process.argv[ri + 1], caveat: region.caveat || null } : {}),
    ...(provider !== 'ecmwf' ? { provider } : {}),
    borrow: region ? {} : BORROW,
    source: { matchups: IN, sha256: crypto.createHash('sha256').update(gz).digest('hex'), rows: M.rows.length },
    miss: MISS.join('/'), binHours: BIN_H, sites,
  };
  fs.writeFileSync(path.join(ROOT, OUTF), JSON.stringify(out, null, 1) + '\n');
  for (const [sid, s] of Object.entries(sites)) {
    const b = s.bins[24] || s.bins[12];
    console.log(sid.padEnd(16), Object.keys(s.bins).length + ' bins', b ? 'Hs@24h n=' + b.hs.n + ' [' + (b.hs.loDec || '-') + ', ' + (b.hs.hiDec || '-') + ']' : '');
  }
}

main();
