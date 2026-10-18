/* instruments/optq/stepfun-exact.js — the JavaScript decider for the registry's step-function constants (family 1):
   exact rationals from IEEE doubles, "p/q" strings and decimals; the heights over one common denominator; products by
   Kronecker substitution (each sequence packed into one BigInt, multiplied once, unpacked). Written apart from the
   Python deciders (instruments/optq/stepfun.py for 1a/1b, instruments/optq/autocorr.py for 1c/1d) and sharing no code
   with them or with any claimant's scorer. Used by tools/replay-stepfun.js and tools/replay-autocorr.js.

     1a  f >= 0 on [-1/4, 1/4], n equal steps: max (f*f) / (∫f)^2 = 2n · max_k Σ a_i a_{k-i} / (Σ a)^2         (upper)
     1b  0 <= h <= 1 on [0, 2], Σh = n/2: (2/n) · max_m Σ a_i (D - a_{i+m}) / D^2                              (upper)
     1c  f = Σ w_i 1[i/K, (i+1)/K), w >= 0: K · min_{0<=k<=K} Σ w_i w_{i+k} / (Σ w)^2                          (lower)
     1d  f signed on [-1/4, 1/4], n cells: 2n · max_m |Σ_{i+j=m} v_i v_j| / (Σ v)^2, the convolution as
         P(v+, v+) + P(v-, v-) - P(v+, v-) - P(v-, v+) with v = v+ - v-                                          (upper)
   MIT */
'use strict';
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const bitlen = (x) => (x === 0n ? 0 : x.toString(2).length);
/* a double, exactly: sign · mantissa · 2^exponent, read from its IEEE-754 bits */
function exactDouble(x) {
  if (!Number.isFinite(x)) throw new Error('a non-finite height');
  if (x === 0) return [0n, 1n];
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x);
  const hi = dv.getUint32(0), lo = dv.getUint32(4), e = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), ex;
  if (e === 0) ex = -1074; else { m |= 1n << 52n; ex = e - 1075; }
  if (hi >>> 31) m = -m;
  return ex >= 0 ? [m << BigInt(ex), 1n] : [m, 1n << BigInt(-ex)];
}
/* "p/q", a decimal string, or a JSON number (a double) — each as a fraction of BigInts */
function exact(v) {
  if (typeof v === 'number') return exactDouble(v);
  const s = String(v).trim();
  if (s.includes('/')) { const [p, q] = s.split('/'); if (BigInt(q) <= 0n) throw new Error('a non-positive denominator'); return [BigInt(p), BigInt(q)]; }
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([-+]?\d+))?$/.exec(s); if (!m) throw new Error('not a number: ' + s.slice(0, 40));
  const f = m[3] || '', e = Number(m[4] || 0) - f.length, N = (m[1] ? -1n : 1n) * BigInt(m[2] + f);
  return e >= 0 ? [N * 10n ** BigInt(e), 1n] : [N, 10n ** BigInt(-e)];
}
/* the heights over one common denominator D */
function common(fr) {
  let D = 1n;
  for (const [, q] of fr) D = (D / gcd(D, q)) * q;
  return { D, a: fr.map(([p, q]) => p * (D / q)) };
}
/* the coefficients of (Σ a_i x^i)(Σ b_j x^j), a_i, b_j >= 0, by Kronecker substitution: K bits per slot, K a multiple
   of 4 so that the packing and the unpacking are plain hexadecimal strings */
function product(a, b) {
  let ma = 0n, mb = 0n; for (const x of a) if (x > ma) ma = x; for (const x of b) if (x > mb) mb = x;
  const K = Math.ceil((bitlen(BigInt(Math.min(a.length, b.length)) * ma * mb) + 1) / 4) * 4, w = K / 4;
  const pack = (s) => { const parts = new Array(s.length); for (let i = 0; i < s.length; i++) parts[s.length - 1 - i] = s[i].toString(16).padStart(w, '0'); return BigInt('0x' + (parts.join('') || '0')); };
  const hex = (pack(a) * pack(b)).toString(16), L = a.length + b.length - 1;
  if (hex.length > L * w) throw new Error('the product overran its slots: the packing bound was wrong');
  const h = hex.padStart(L * w, '0'), out = new Array(L);
  for (let k = 0; k < L; k++) out[k] = BigInt('0x' + h.slice((L - 1 - k) * w, (L - k) * w));
  return out;
}
const reduce = ([p, q]) => { const g = gcd(p, q) || 1n; return [p / g, q / g]; };
const dec = ([p, q], k) => { const ip = p / q, r = p - ip * q; return ip + '.' + ((r * 10n ** BigInt(k)) / q).toString().padStart(k, '0'); };
/* decide one construction: heights → verdict and exact value */
function decide(kind, heights, claim, opts = {}) {
  const { rescale, mutate } = opts;
  const fr = heights.map(exact);
  if (mutate) fr[mutate.index] = mutate.value !== undefined ? exact(mutate.value) : [fr[mutate.index][0] * BigInt(mutate.scale), fr[mutate.index][1]];
  let { D, a } = common(fr);
  const n = a.length, S = a.reduce((s, x) => s + x, 0n);
  if (kind === '1b' && rescale) {
    /* h_i' = h_i · (n/2) / Σh: over the denominator 2S the numerators are a_i · n; a scale-down keeps h' <= h <= 1 */
    if (!(2n * S > BigInt(n) * D)) return { verdict: 'REFUSED', why: 'the rescale is not a scale-down' };
    a = a.map((x) => x * BigInt(n)); D = 2n * S;
  }
  let r;
  if (kind === '1a') {
    if (a.some((x) => x < 0n)) return { verdict: 'REFUSED', why: 'a negative height' };
    const T = a.reduce((s, x) => s + x, 0n); if (T === 0n) return { verdict: 'REFUSED', why: 'the integral is zero' };
    const conv = product(a, a); let best = 0n, at = 0; conv.forEach((c, k) => { if (c > best) { best = c; at = k; } });
    r = { value: reduce([2n * BigInt(n) * best, T * T]), at };
  } else if (kind === '1c') {
    if (a.some((x) => x < 0n)) return { verdict: 'REFUSED', why: 'a negative weight' };
    const T = a.reduce((s, x) => s + x, 0n); if (T === 0n) return { verdict: 'REFUSED', why: 'the integral is zero' };
    const K = opts.K; if (!Number.isInteger(K) || K < 1) throw new Error('1c needs the grid K');
    /* Σ_i w_i w_{i+k} is the coefficient n-1-k of w · reverse(w) */
    const P = product(a, a.slice().reverse()); let best = null, at = 0;
    for (let k = 0; k <= K; k++) { const c = k < n ? P[n - 1 - k] : 0n; if (best === null || c < best) { best = c; at = k; } }
    r = { value: reduce([BigInt(K) * best, T * T]), at, lower: true };
  } else if (kind === '1d') {
    const T = a.reduce((s, x) => s + x, 0n); if (T === 0n) return { verdict: 'REFUSED', why: 'the integral is zero' };
    const pos = a.map((x) => (x > 0n ? x : 0n)), neg = a.map((x) => (x < 0n ? -x : 0n));
    const pp = product(pos, pos), nn = product(neg, neg), pn = product(pos, neg), np = product(neg, pos);
    let best = -1n, at = 0;
    for (let k = 0; k < pp.length; k++) { let c = pp[k] + nn[k] - pn[k] - np[k]; if (c < 0n) c = -c; if (c > best) { best = c; at = k; } }
    r = { value: reduce([2n * BigInt(n) * best, T * T]), at };
  } else {
    if (a.some((x) => x < 0n || x > D)) return { verdict: 'REFUSED', why: 'a height outside [0, 1]' };
    const T = a.reduce((s, x) => s + x, 0n); if (2n * T !== BigInt(n) * D) return { verdict: 'REFUSED', why: 'Σh − n/2 = ' + dec(reduce([2n * T - BigInt(n) * D, 2n * D]), 24) + ', not 0' };
    const c = a.map((x) => D - x).reverse(), corr = product(a, c); let best = -1n, at = 0; corr.forEach((x, k) => { if (x > best) { best = x; at = k; } });
    r = { value: reduce([2n * best, BigInt(n) * D * D]), at: at - (n - 1) };
  }
  const [cp_, cq] = exact(claim);
  const holds = r.lower ? r.value[0] * cq >= cp_ * r.value[1] : r.value[0] * cq <= cp_ * r.value[1];
  return { verdict: holds ? 'CERTIFIED' : 'REFUTED', value: r.value[0] + '/' + r.value[1], decimal: dec(r.value, 30), at: r.at, n };
}

module.exports = { exact, exactDouble, common, product, reduce, dec, gcd, decide };
