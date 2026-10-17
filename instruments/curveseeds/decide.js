#!/usr/bin/env node
/* decide.js — the NIST curve-seeds claim, decided in BigInt; the second decider, sharing no code with decide.py.
   cert-machine · 2026-10-16

   The same three specifications (POSIX drand48; ANSI X9.62 A.3.3 as FIPS 186-2 prints its intermediates, with the
   prime case's leftmost-bit rule; FreeLIP lip.c's zrstarts/zrandom/zrandomb), the same inputs (the claim table in
   corpus/curveseeds/preregistration.json, the published objects in corpus/curveseeds/published.json), the same output
   schema — the runner diffs the two JSON documents field by field and refuses on one difference.

   usage: node instruments/curveseeds/decide.js            the table
          node instruments/curveseeds/decide.js --json     the JSON the runner compares
          node instruments/curveseeds/decide.js --red      the red controls (each must fail)                          */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');

const A48 = 0x5DEECE66Dn, C48 = 0xBn, M48 = 1n << 48n;
const srand48State = (seed32) => ((BigInt(seed32) & 0xFFFFFFFFn) << 16n) | 0x330En;
const lcgNext = (x) => (A48 * x + C48) % M48;
const utc = (s) => { const m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)$/.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000; };
const hex = (n, width) => { let h = n.toString(16); if (width) h = h.padStart(width, '0'); return h; };

/* candidate n (1-based) of a prime-curve run: 20 lrand48 calls, byte = lrand48() >> shift (23 → the top 8 bits of the state) */
function seedPrime(t, n, shift = 23) {
  let x = srand48State(t), out = '';
  for (let i = 1; i <= 20 * n; i++) { x = lcgNext(x); if (i > 20 * (n - 1)) out += hex(((x >> 17n) >> BigInt(shift)) & 0xFFn, 2); }
  return out;
}
/* candidate n of a binary-curve run: srand48(⌊t/2⌋), 5 calls, each a 32-bit word of lrand48() (mrand48 when signed) */
function seedBinary(t, n, halve = true, signed = false) {
  let x = srand48State(halve ? Math.floor(t / 2) : t), out = '';
  for (let i = 1; i <= 5 * n; i++) { x = lcgNext(x); if (i > 5 * (n - 1)) out += hex(signed ? (x >> 16n) & 0xFFFFFFFFn : x >> 17n, 8); }
  return out;
}

/* X9.62 A.3.3: (rightmost v bits of SHA-1(seed)) ‖ SHA-1(seed+1) ‖ … ‖ SHA-1(seed+s); the prime case clears the leftmost bit of the first block */
const sha1Int = (buf) => BigInt('0x' + crypto.createHash('sha1').update(buf).digest('hex'));
const bufOf = (n, bytes) => Buffer.from(hex(n, 2 * bytes), 'hex');
function x962Chain(seedHex, t, step = 1, clearTop = false) {
  const seed = Buffer.from(seedHex, 'hex'), g = BigInt(8 * seed.length), S = BigInt('0x' + seedHex);
  const s = Math.floor((t - 1) / 160), v = BigInt(t - 160 * s);
  let w = sha1Int(seed) % (1n << v);
  if (clearTop) w &= (1n << (v - 1n)) - 1n;
  for (let i = 1; i <= s; i++) { const si = ((S + BigInt(step * i)) % (1n << g) + (1n << g)) % (1n << g); w = (w << 160n) | sha1Int(bufOf(si, seed.length)); }
  return w;
}
const mod = (a, m) => ((a % m) + m) % m;
function derivePrime(seedHex, p, bPub, cPub) {
  const c = x962Chain(seedHex, p.toString(2).length, 1, true);
  return { c: hex(c), cMatchesPublished: cPub === null ? null : c === cPub, congruence: mod(bPub * bPub * c + 27n, p) === 0n, cNonzero: c % p !== 0n, fourCplus27Nonzero: mod(4n * c + 27n, p) !== 0n };
}
function deriveBinary(seedHex, m, bNormalPub) {
  const b = x962Chain(seedHex, m);
  return { bNormal: hex(b), bMatchesPublished: b === bNormalPub };
}

/* FreeLIP: zrstarts(seed) sets zseed = seed and zprroot = 3^121 mod (2^107 − 1); zrandom(b) redraws while zseed ≥ zranp − (zranp mod b)
   and returns zseed mod b; zrandomb(bnd) draws (limbs of bnd) + 1 limbs of zrandom(RADIX), the first most significant, then reduces mod bnd */
const LIP_M = (1n << 107n) - 1n;
const powmod = (b, e, m) => { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
const LIP_A = powmod(3n, 121n, LIP_M);
class Lip {
  constructor(seed) { this.state = BigInt(seed); }
  zrandom(b) { const bound = LIP_M - (LIP_M % b); for (;;) { this.state = this.state * LIP_A % LIP_M; if (this.state < bound) break; } return this.state % b; }
  zrandomb(bnd, nbits) { const radix = 1n << BigInt(nbits); const limbs = Math.ceil(bnd.toString(2).length / nbits) + 1; let x = 0n; for (let i = 0; i < limbs; i++) x = x * radix + this.zrandom(radix); return x % bnd; }
}
function basePointX(lipSeed, p, b, nbits = 26, skip = 7, maxTries = 10000) {
  const g = new Lip(lipSeed);
  for (let i = 0; i < skip; i++) g.zrandom(1n << BigInt(nbits));
  for (let tries = 1; tries <= maxTries; tries++) {
    const x = g.zrandomb(p, nbits);
    if (powmod(mod(x * x * x - 3n * x + b, p), (p - 1n) / 2n, p) === 1n) return [x, tries];
  }
  return [null, maxTries];
}

/* ---- the claims --------------------------------------------------------------------------------------------- */
const load = () => ({ pre: JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'curveseeds', 'preregistration.json'), 'utf8')),
                      pub: JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'curveseeds', 'published.json'), 'utf8')) });
function publishedPrime(pub, name) {
  if (pub.fips186_2.prime[name]) { const f = pub.fips186_2.prime[name]; return { p: BigInt(f.p), b: BigInt('0x' + f.b), Gx: BigInt('0x' + f.Gx), Gy: BigInt('0x' + f.Gy), seed: f.seed, c: BigInt('0x' + f.c), from: 'FIPS 186-2' }; }
  const o = pub.openssl[name]; return { p: BigInt('0x' + o.p), b: BigInt('0x' + o.b), Gx: BigInt('0x' + o.x), Gy: BigInt('0x' + o.y), seed: o.seed, c: null, from: 'OpenSSL ec_curve.c (X9.62)' };
}
function decideAll() {
  const { pre, pub } = load(); const T = pre.claim.table;
  const out = { calibration: {}, S: {}, D: {}, G: {} };
  const f256 = pub.fips186_2.prime['P-256'];
  out.calibration['P-256 c from FIPS seed'] = x962Chain(f256.seed, BigInt(f256.p).toString(2).length, 1, true) === BigInt('0x' + f256.c);
  out.calibration['srand48 low 16 bits are 330E'] = (srand48State(871696354) & 0xFFFFn) === 0x330En;
  const f233 = pub.fips186_2.binary['B-233'];
  out.calibration['B-233 normal-basis b from FIPS s'] = x962Chain(f233.normalBasis.s, f233.m) === BigInt('0x' + f233.normalBasis.b);
  for (const [name, [when, n]] of Object.entries(T.prime)) {
    const P = publishedPrime(pub, name), t = utc(when), got = seedPrime(t, n);
    out.S[name] = { kind: 'prime', timestamp: when, unix: t, candidate: n, produced: got, published: P.seed, publishedFrom: P.from, verdict: got === P.seed ? 'CERTIFIED' : 'REFUTED' };
    const d = derivePrime(P.seed, P.p, P.b, P.c);
    const ok = d.congruence && d.cNonzero && d.fourCplus27Nonzero && (d.cMatchesPublished === true || d.cMatchesPublished === null);
    out.D[name] = Object.assign(d, { kind: 'prime', bits: P.p.toString(2).length, cPublished: P.c === null ? null : hex(P.c), verdict: ok ? 'CERTIFIED' : 'REFUTED' });
  }
  for (const [name, [when, n]] of Object.entries(T.binary)) {
    const f = pub.fips186_2.binary[name], t = utc(when), got = seedBinary(t, n);
    out.S[name] = { kind: 'binary', timestamp: when, unix: t, srand48Argument: Math.floor(t / 2), candidate: n, produced: got, published: f.normalBasis.s, publishedFrom: 'FIPS 186-2 (normal basis)', verdict: got === f.normalBasis.s ? 'CERTIFIED' : 'REFUTED' };
    const d = deriveBinary(f.normalBasis.s, f.m, BigInt('0x' + f.normalBasis.b));
    out.D[name] = Object.assign(d, { kind: 'binary', m: f.m, fieldPolynomial: f.fieldPolynomial, verdict: d.bMatchesPublished ? 'CERTIFIED' : 'REFUTED' });
  }
  for (const [name, lipSeed] of Object.entries(T.basePoints)) {
    const P = publishedPrime(pub, name); const [x, tries] = basePointX(lipSeed, P.p, P.b);
    const rhs = mod(P.Gx ** 3n - 3n * P.Gx + P.b, P.p), gyOk = (P.Gy * P.Gy) % P.p === rhs;
    out.G[name] = { lipSeed, nbits: 26, skipped: 7, tries, producedX: x === null ? null : hex(x), publishedGx: hex(P.Gx), GySquaresToCurve: gyOk, GyIsTheOddRoot: (P.Gy & 1n) === 1n, GyIsTheSmallerRoot: P.Gy < P.p - P.Gy, verdict: x === P.Gx && gyOk ? 'CERTIFIED' : 'REFUTED' };
  }
  return out;
}
function reds() {
  const { pre, pub } = load(); const T = pre.claim.table;
  const t256 = utc(T.prime['P-256'][0]), n256 = T.prime['P-256'][1]; const f = pub.fips186_2.prime['P-256'];
  const s256 = f.seed, p256 = BigInt(f.p), b256 = BigInt('0x' + f.b), c256 = BigInt('0x' + f.c);
  const t233 = utc(T.binary['B-233'][0]), n233 = T.binary['B-233'][1], f233 = pub.fips186_2.binary['B-233'];
  const P192 = publishedPrime(pub, 'P-192');
  const flipped = Buffer.from(s256, 'hex'); flipped[7] ^= 0x40; const fl = flipped.toString('hex');
  return {
    'timestamp + 1 s': seedPrime(t256 + 1, n256) === s256,
    'candidate + 1': seedPrime(t256, n256 + 1) === s256,
    'lrand48 >> 22 instead of >> 23': seedPrime(t256, n256, 22) === s256,
    'binary: clock not halved': seedBinary(t233, n233, false) === f233.normalBasis.s,
    'binary: mrand48 instead of lrand48': seedBinary(t233, n233, true, true) === f233.normalBasis.s,
    'one seed byte flipped: c': x962Chain(fl, 256, 1, true) === c256,
    'one seed byte flipped: congruence': mod(b256 * b256 * x962Chain(fl, 256, 1, true) + 27n, p256) === 0n,
    'SHA-1(seed − i) chain': x962Chain(s256, 256, -1, true) === c256,
    'prime chain without the leftmost bit cleared': x962Chain(s256, 256) === c256,
    'LIP seed 20001': basePointX(20001, P192.p, P192.b)[0] === P192.Gx,
    'NBITS 30': basePointX(20000, P192.p, P192.b, 30)[0] === P192.Gx,
    'no outputs skipped': basePointX(20000, P192.p, P192.b, 26, 0)[0] === P192.Gx,
  };
}
module.exports = { srand48State, lcgNext, utc, seedPrime, seedBinary, x962Chain, derivePrime, deriveBinary, Lip, basePointX, decideAll, reds, publishedPrime, load };

if (require.main === module) {
  if (process.argv.includes('--red')) {
    const r = reds(); let bad = 0;
    for (const [k, v] of Object.entries(r)) { console.log((v ? '  RED FAILED ' : '  RED ok    ') + k); if (v) bad++; }
    process.exit(bad ? 1 : 0);
  }
  const res = decideAll();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(res, null, 1)); process.exit(0); }
  for (const [k, v] of Object.entries(res.calibration)) console.log('  calibration', v ? 'ok  ' : 'FAIL', k);
  if (!Object.values(res.calibration).every(Boolean)) { console.log('CALIBRATION FAILED'); process.exit(1); }
  for (const sec of ['S', 'D', 'G']) for (const [name, r] of Object.entries(res[sec])) console.log('  ' + sec + '  ' + name.padEnd(11) + ' ' + r.verdict + (r.tries ? ' tries ' + r.tries : ''));
}
