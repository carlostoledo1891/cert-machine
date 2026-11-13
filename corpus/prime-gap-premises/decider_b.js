/* decider_b.js — Phase 2, step 2, decider B (PREREGISTRATION.md, sealed 6f1e6d11…). Shares no code with decider A.

   The 182's IncidenceRankFourBound on every prime p < P (default 2000) and every c in (Z/p)^x, by complex INTERVAL
   arithmetic on values (cert-machine's instruments/interval: outward-rounded doubles, sound cos/sin):
     psi(k) = cos(2 pi k/p) + i sin(2 pi k/p)                         (enclosed)
     K2(b) = sum_w psi(w + b/w);  K3(a) = sum_v psi(v) K2(a/v);  K4(c) = sum_u psi(u) K3(c/u)
   HOLDS when the upper bound of |K4(c)|^2 <= coef^2 p^3 (coef = 4; the planted controls 3 and 2), FAILS when its lower
   bound exceeds it, UNDECIDED otherwise. coef^2 p^3 < 2^53 for p < 2000, so the bound is an exact double.
   node decider_b.js [P] [--values out.jsonl]   one JSON line per prime, then a summary line                        */
'use strict';
const I = require(require('path').join(__dirname, '..', '..', 'instruments', 'interval', 'interval.js'));
const T = require(require('path').join(__dirname, '..', '..', 'instruments', 'interval', 'transcendental.js'));
const fs = require('fs');
const { add, sub, mul, div } = I;
const P = (x) => [x, x];

function primesBelow(n) { const r = []; for (let p = 2; p < n; p++) { let ok = true; for (let d = 2; d * d <= p; d++) if (p % d === 0) { ok = false; break; } if (ok) r.push(p); } return r; }
function modpow(b, e, m) { let r = 1n, x = BigInt(b) % BigInt(m), E = BigInt(e); const M = BigInt(m); while (E > 0n) { if (E & 1n) r = r * x % M; x = x * x % M; E >>= 1n; } return Number(r); }
const cmul = (a, b) => [sub(mul(a[0], b[0]), mul(a[1], b[1])), add(mul(a[0], b[1]), mul(a[1], b[0]))];
const cadd = (a, b) => [add(a[0], b[0]), add(a[1], b[1])];
const mag = (J) => Math.max(Math.abs(J[0]), Math.abs(J[1]));
const mig = (J) => (J[0] <= 0 && J[1] >= 0 ? 0 : Math.min(Math.abs(J[0]), Math.abs(J[1])));

function decide(p) {
  const psi = [];
  for (let k = 0; k < p; k++) {
    const ang = div(mul(T.TWO_PI, P(k)), P(p));
    psi.push([T.cos(ang), T.sin(ang)]);
  }
  const inv = [0]; for (let x = 1; x < p; x++) inv.push(p === 2 ? 1 : modpow(x, p - 2, p));
  const Z = () => [P(0), P(0)];
  const K2 = [Z()];
  for (let b = 1; b < p; b++) { let s = Z(); for (let w = 1; w < p; w++) s = cadd(s, psi[(w + b * inv[w]) % p]); K2.push(s); }
  const K3 = [Z()];
  for (let a = 1; a < p; a++) { let s = Z(); for (let v = 1; v < p; v++) s = cadd(s, cmul(psi[v], K2[(a * inv[v]) % p])); K3.push(s); }
  const res = { p, instances: p - 1, holds: 0, fails: 0, undecided: 0, fails3: 0, fails2: 0, max_ratio_hi: 0, argmax_c: null, witness3: null, witness2: null };
  const vals = [];
  for (let c = 1; c < p; c++) {
    let s = Z();
    for (let u = 1; u < p; u++) s = cadd(s, cmul(psi[u], K3[(c * inv[u]) % p]));
    const hi = I.nextUp(I.nextUp(mag(s[0]) ** 2) + I.nextUp(mag(s[1]) ** 2));
    const lo = I.nextDown(I.nextDown(mig(s[0]) ** 2) + I.nextDown(mig(s[1]) ** 2));
    const verdict = (coef) => { const B = coef * coef * p * p * p; return hi <= B ? 'holds' : (lo > B ? 'fails' : null); };
    res[verdict(4) || 'undecided']++;
    if (verdict(3) === 'fails') { res.fails3++; res.witness3 = res.witness3 || { c }; }
    if (verdict(2) === 'fails') { res.fails2++; res.witness2 = res.witness2 || { c }; }
    const r = Math.sqrt(hi) / p ** 1.5;
    if (r > res.max_ratio_hi) { res.max_ratio_hi = r; res.argmax_c = c; }
    vals.push([c, s[0][0], s[0][1], s[1][0], s[1][1]]);
  }
  return { res, vals };
}

const args = process.argv.slice(2);
const PMAX = args[0] && !args[0].startsWith('--') ? Number(args[0]) : 2000;
const VAL = args.includes('--values') ? fs.openSync(args[args.indexOf('--values') + 1], 'w') : null;
const t0 = Date.now();
const tot = { primes: 0, instances: 0, holds: 0, fails: 0, undecided: 0, fails3: 0, fails2: 0, max_ratio_hi: 0, at: null };
for (const p of primesBelow(PMAX)) {
  const { res, vals } = decide(p);
  if (VAL) fs.writeSync(VAL, JSON.stringify({ p, values: vals }) + '\n');
  console.log(JSON.stringify(res));
  tot.primes++;
  for (const k of ['instances', 'holds', 'fails', 'undecided', 'fails3', 'fails2']) tot[k] += res[k];
  if (res.max_ratio_hi > tot.max_ratio_hi) { tot.max_ratio_hi = res.max_ratio_hi; tot.at = [p, res.argmax_c]; }
}
tot.seconds = Math.round((Date.now() - t0) / 100) / 10;
tot.decider_b_sha256 = require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
console.log(JSON.stringify({ summary: tot }));
