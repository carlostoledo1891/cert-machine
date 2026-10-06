/* bands.js — Janela's own forecast band: the forecast times what the satellites
   say the forecast's error has been, per site and lead, with a coverage claim
   that is a counting theorem.
   apps/janela/audit · cert-machine

     node apps/janela/audit/bands.js       reads corpus/janela/matchups.json.gz, writes certs/janela-bands.json

   For each open-sea site and each 12 h lead bin, from the back-archive pairs:
     Hs     r = observed / forecast            (both exact rationals)
     wind   q = observed^2 / (u^2 + v^2)       (exact: the speed itself is irrational, its square is not)
   and the exact conformal interval of r (and of q) at miss-rate 1/10
   (instruments/forecast/conformal.js): IF the next ratio is exchangeable with
   the calibration ratios of its site and lead bin, THEN it falls inside with
   probability (u - l)/(n + 1) >= 9/10 exactly. The band a forecast f gets is
   [f * r_lo, f * r_hi] — the PROPOSAL the decider decides over, and the claim
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
  const gz = fs.readFileSync(path.join(ROOT, 'corpus', 'janela', 'matchups.json.gz'));
  const M = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
  const acc = {};
  for (const r of M.rows) {
    const [sid, , , , obs, , , lead, fc, , , wObs, w2] = r;
    const bin = Math.min(Math.floor(lead / BIN_H), MAX_H / BIN_H - 1);
    const k = sid + '|' + bin;
    acc[k] = acc[k] || { hs: [], wind: [] };
    const f = frac(fc), o = frac(obs);
    if (f[0] > 0n) acc[k].hs.push(div(o, f));
    if (wObs && w2) { const ow = frac(wObs), q2 = frac(w2); if (q2[0] > 0n) acc[k].wind.push(div([ow[0] * ow[0], ow[1] * ow[1]], q2)); }
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
    sites[sid].bins[bin * BIN_H] = { from: bin * BIN_H, to: (bin + 1) * BIN_H, hs: cell(v.hs), windSq: cell(v.wind) };
  }
  const out = {
    what: 'Janela\'s calibrated forecast band per open-sea site and 12 h lead bin: exact conformal intervals (miss-rate 1/10) of observed/forecast Hs and of observed^2/(u^2+v^2) for 10 m wind, from the back-archive pairs (ECMWF open data vs NOAA RADS NRT altimetry). The band for a forecast f is [f*lo, f*hi] (wind: speed^2 in [(u^2+v^2)*lo, (u^2+v^2)*hi]).',
    theorem: 'IF the next ratio is exchangeable with the calibration ratios of its site and lead bin, THEN P(lo <= next <= hi) = (u - l)/(n + 1) exactly (>= with ties) — instruments/forecast/conformal.js',
    hypothesis: 'exchangeability within a site and a 12 h lead bin, over 2023-07..2026-10 and all seasons; graded going forward by the ledger (exact binomial admission)',
    borrow: BORROW,
    source: { matchups: 'corpus/janela/matchups.json.gz', sha256: crypto.createHash('sha256').update(gz).digest('hex'), rows: M.rows.length },
    miss: MISS.join('/'), binHours: BIN_H, sites,
  };
  fs.writeFileSync(path.join(ROOT, 'certs', 'janela-bands.json'), JSON.stringify(out, null, 1) + '\n');
  for (const [sid, s] of Object.entries(sites)) {
    const b = s.bins[24] || s.bins[12];
    console.log(sid.padEnd(16), Object.keys(s.bins).length + ' bins', b ? 'Hs@24h n=' + b.hs.n + ' [' + (b.hs.loDec || '-') + ', ' + (b.hs.hiDec || '-') + ']' : '');
  }
}

main();
