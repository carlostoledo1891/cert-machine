#!/usr/bin/env node
/* instruments/optq/twolaw.js — a TWO-LAW entropy certificate for C_3c (registry 3c; PR #221, Jaswal 2026), decided
   with instruments/sumdiff (exact pushforwards, directed-rounding interval entropies) and nothing of the claimant's.

   THE CLAIM. n = c_1 + c_2 independent digits (x_i, y_i), c_k of them drawn from law μ_k on Z² (finitely supported,
   positive rational weights summing to 1); (X, Y) = Σ_i base^i (x_i, y_i). For a linear form L with max |L| over the
   supports of both laws at most (base − 1)/2, the map (L(x_i, y_i))_i ↦ L(X, Y) = Σ base^i L(x_i, y_i) is injective
   (a balanced base-b expansion is unique), so H(L(X, Y)) = Σ_i H(L(x_i, y_i)) = c_1 H_L(μ_1) + c_2 H_L(μ_2). Hence
       ρ = H(X−Y) / max(H(X), H(Y), H(X+Y), H(X+2Y)) = (w_1 H_{X−Y}(μ_1) + w_2 H_{X−Y}(μ_2)) / max_L (w_1 H_L(μ_1) + w_2 H_L(μ_2)),
   w_k = c_k / n, and C_3c ≥ ρ (the entropy formulation of 3c; registry; Green–Ruzsa). The claim "C_3c ≥ c" is
   CERTIFIED when the interval enclosure of ρ lies above c.

   THE DOOR. Every weight positive, each law's weights summing to 1 exactly, integer points, the injectivity bound
   checked for every form on both supports, the counts positive integers. Precision doubles while the verdict straddles.

   usage: node instruments/optq/twolaw.js certificate.json [claimed-decimal]                                  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const SD = require(path.join(__dirname, '..', 'sumdiff', 'sumdiff.js'));
const B = require(path.join(__dirname, '..', 'bigfloat', 'bigfloat.js'));

const big = (v) => (typeof v === 'bigint' ? v : BigInt(String(v)));
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };

function readTwoLaw(obj) {
  if (!/3c/i.test(String(obj.problem))) throw new Error('not a 3c certificate: ' + obj.problem);
  const base = big(obj.base);
  const counts = obj.counts.map(big);
  if (counts.length !== obj.laws.length || counts.some((c) => c <= 0n)) throw new Error('REFUSED: counts and laws disagree or a count is not positive');
  const laws = obj.laws.map((law) => {
    if (law.points.length !== law.weights.length) throw new Error('REFUSED: points and weights of unequal length');
    let den = 1n; for (const [, d] of law.weights) { const dd = big(d); den = den / gcd(den, dd) * dd; }
    const pts = law.points.map(([x, y], i) => [big(x), big(y), big(law.weights[i][0]) * (den / big(law.weights[i][1]))]);
    return SD.door({ problem: '3c', pts, den });      /* positive weights, no repeated point, Σ = den */
  });
  /* the injectivity bound: max |L| over both supports <= (base - 1) / 2 for every form and the target */
  const forms = SD.FORMS['3c'].concat([SD.TARGET]);
  let maxAbs = 0n;
  for (const law of laws) for (const [x, y] of law.pts) for (const [a, b] of forms) { const v = x * BigInt(a) + y * BigInt(b); const av = v < 0n ? -v : v; if (av > maxAbs) maxAbs = av; }
  const injective = 2n * maxAbs <= base - 1n;
  return { base, counts, n: counts.reduce((s, c) => s + c, 0n), laws, maxAbs, injective };
}

function decide(cert, claimed, precisions) {
  if (!cert.injective) return { verdict: 'REFUSED', why: 'max |L| = ' + cert.maxAbs + ' exceeds (base - 1)/2: the digit map is not shown injective, so the entropies do not add' };
  const q = SD.decimal(claimed);
  let last = null;
  for (const P of precisions || SD.PRECISIONS) {
    const w = cert.counts.map((c) => B.fromRatio(c, cert.n, P));
    const mix = (form) => cert.laws.reduce((s, law, k) => B.add(s, B.mul(w[k], SD.entropy(law, form, P), P), P), B.fromInt(0));
    const Hs = SD.FORMS['3c'].map(mix); const HT = mix(SD.TARGET);
    const mx = { lo: Hs.map((x) => x.lo).reduce((a, b) => (B.cmp(a, b) >= 0 ? a : b)), hi: Hs.map((x) => x.hi).reduce((a, b) => (B.cmp(a, b) >= 0 ? a : b)) };
    const rho = B.div(HT, mx, P); const Q = B.fromRatio(q.n, q.d, P);
    last = { P, rho, HT, Hs };
    if (B.cmp(rho.lo, Q.hi) > 0) return { verdict: 'CERTIFIED', P, rho, HT, Hs };
    if (B.cmp(rho.hi, Q.lo) < 0) return { verdict: 'REFUTED', P, rho, HT, Hs };
  }
  return { verdict: 'REFUSED', why: 'the enclosure straddles the claim at ' + last.P + ' bits', ...last };
}

if (require.main === module) {
  const obj = SD.parseExact(fs.readFileSync(process.argv[2], 'utf8'));
  const cert = readTwoLaw(obj);
  const claimed = process.argv[3] || (obj.claimed_lower_bound ? (BigInt(obj.claimed_lower_bound[0]) * 10n ** 30n / BigInt(obj.claimed_lower_bound[1])).toString().replace(/^(\d)(\d{30})$/, '$1.$2') : null);
  const t0 = Date.now();
  const r = decide(cert, claimed);
  const out = { verdict: r.verdict, why: r.why, P: r.P, claimed, laws: cert.laws.map((l) => l.pts.length), counts: cert.counts.map(String), base: String(cert.base), maxAbsForm: String(cert.maxAbs), injective: cert.injective,
    rho: r.rho ? [SD.digits ? SD.digits(r.rho, 30) : B.toDecimal(r.rho.lo, 30, 'down') + '..' + B.toDecimal(r.rho.hi, 30, 'up')] : null,
    HT: r.HT ? B.toDecimal(r.HT.lo, 25, 'down') + '..' + B.toDecimal(r.HT.hi, 25, 'up') : null,
    Hs: r.Hs ? r.Hs.map((h) => B.toDecimal(h.lo, 25, 'down') + '..' + B.toDecimal(h.hi, 25, 'up')) : null, ms: Date.now() - t0 };
  console.log(JSON.stringify(out));
  process.exit(r.verdict === 'CERTIFIED' ? 0 : 1);
}
module.exports = { readTwoLaw, decide };
