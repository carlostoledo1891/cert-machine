#!/usr/bin/env node
/* replay-c82.js — the registry's C_82 rows (the essential minimum of the Zhang–Zagier height) decided from the cited
   constructions, twice, by two implementations that share no code with each other or with the claimants' checkers
   (kept as text, never run): this file (JavaScript: BigInt Gaussian integers for the roots, eqcert's outward-rounded
   intervals for everything transcendental) and instruments/optq/c82.py (Python: int and a priori rounding-error bounds).

   What a construction is (Doche's limit-point method, J. Théor. Nombres Bordeaux 13 (2001), eq. (9)): denominator
   factors R_j in Z[x] with positive integer multiplicities m_j, numerator factors S_i in Z[x] with rational exponents
   q_i >= 0. With T(z) = z(1 - z), Q = Π R_j^m_j, D = deg Q and log|A| = Σ q_i log|S_i|, it bounds
        C_82 <= B = ( log M(Q∘T) + ∫_0^1 max(0, log|A∘T(e^{2πit})| - log|Q∘T(e^{2πit})|) dt ) / D.
   What is DECIDED here:
     X1 each R_j has integer coefficients and leading coefficient ±1; each m_j is a positive integer; each q_i is a
        rational >= 0; each S_i has integer coefficients                                                        exact
     X2 deg A = Σ q_i deg S_i < D                                                                               exact
     X3 gcd(S_i, R_j) = 1 whenever q_i > 0 (a constant gcd modulo a prime that divides neither leading coefficient
        implies a constant gcd over Q, by Gauss's lemma)                                                         exact
     X4 every root of every composed factor P∘T enclosed in a disk: approximations by Aberth's iteration in doubles,
        refined by Weierstrass steps in Gaussian integers at 2^-192, then CERTIFIED by Gershgorin's theorem on the
        Weierstrass matrix diag(z) - W 1^T, whose characteristic polynomial is P∘T / lc: the disks D(z_i, n|W_i|),
        W_i computed EXACTLY, are pairwise disjoint, so each holds exactly one root                              exact
     X5 log M(Q∘T) = Σ_j m_j Σ_roots log max(1, |r|), the roots in their disks                                 enclosure
     X6 the integral, over [0, 1/2] and doubled (real coefficients: the integrand is symmetric under t -> 1 - t), on
        dyadic panels: g = log|A∘T| - log|Q∘T| = Σ_k w_k log|u - r_k| + const; on a panel of width w around t_c
        a zeroth-order upper bound from |u(t) - u(t_c)| <= πw; where every root is away from the panel, a second-order
        Taylor form at t_c with |g''| <= 4π² Σ |w_k| |r_k| / dist_k² — the panel's integral of max(0, g) bounded
        above (and below) exactly as written in panelBounds; the panels refined until the slack is small        enclosure
     X7 B = (X5 + 2·X6) / D, decided against the bound the registry prints: CERTIFIED when the upper end is below it,
        REFUTED when the lower end is at or above it (a refutation of the CERTIFICATE's bound, not of the row's
        number), REFUSED otherwise                                                                               decision
   The step from B to C_82 <= B is Doche's limit-point theorem, which the claimant's README also proves directly
   (U^n - W^n over the primes, Jensen, coprimality); it is read and not re-derived here: the record says so.

   usage: node tools/replay-c82.js            both implementations, the rows, the controls → certs/c82-replay.json
          node tools/replay-c82.js --check    the battery: the JavaScript decider re-derives every row and every
                                              control and compares with the record; nothing written
          node tools/replay-c82.js --decide <construction.json> <bound>      one construction, printed, nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const T = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const OUT = path.join(ROOT, 'certs', 'c82-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('C82 REPLAY REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const DIR = 'corpus/optconst-queue/c82-2026-10-19';
const up = I.nextUp, dn = I.nextDown;

class Refusal extends Error {}
const refuse = (m) => { throw new Refusal(m); };

/* ---- exact parsing ---------------------------------------------------------------------------------------------- */
function bigInt(v, what) {
  if (typeof v === 'number' && Number.isSafeInteger(v)) return BigInt(v);
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return BigInt(v);
  return refuse(what + ' is not an exact integer: ' + JSON.stringify(v).slice(0, 40));
}
const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
function rational(v, what) {                           // "n/d", an integer, or a terminating decimal string — each exact
  if (typeof v !== 'string' && !(typeof v === 'number' && Number.isSafeInteger(v))) refuse(what + ' is not written exactly (a string n/d or decimal, or an integer): ' + JSON.stringify(v).slice(0, 40));
  const s = String(v), m = /^(\d+)(?:\/(\d+))?$/.exec(s), dec = /^(\d+)\.(\d+)$/.exec(s);
  if (!m && !dec) refuse(what + ' is not a rational >= 0: ' + JSON.stringify(v).slice(0, 40));
  const n = m ? BigInt(m[1]) : BigInt(dec[1] + dec[2]), d = m ? (m[2] ? BigInt(m[2]) : 1n) : 10n ** BigInt(dec[2].length);
  if (d === 0n) refuse(what + ' has a zero denominator');
  const g = bgcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
function polyAsc(coeffs, what) {                       // the certificate writes coefficients highest degree first
  if (!Array.isArray(coeffs) || !coeffs.length) refuse(what + ' has no coefficients');
  const p = coeffs.map((c, i) => bigInt(c, what + ' coefficient ' + i)).reverse();
  while (p.length > 1 && p[p.length - 1] === 0n) p.pop();
  if (p.length === 1 && p[0] === 0n) refuse(what + ' is the zero polynomial');
  return p;
}
function compose(p) {                                  // P(T(z)), T(z) = z - z^2, ascending
  let r = [0n];
  for (let k = p.length - 1; k >= 0; k--) {
    const s = new Array(r.length + 2).fill(0n);
    for (let i = 0; i < r.length; i++) { if (r[i]) { s[i + 1] += r[i]; s[i + 2] -= r[i]; } }
    s[0] += p[k]; r = s;
  }
  while (r.length > 1 && r[r.length - 1] === 0n) r.pop();
  return r;
}

/* ---- X3: coprimality modulo primes ------------------------------------------------------------------------------ */
const PRIMES = [1000003, 1000033, 1000037, 1000039, 1000081, 1000099, 1000117, 1000121, 1000133, 1000151, 1000159, 1000171];
const modp = (a, p) => { const r = Number(a % BigInt(p)); return r < 0 ? r + p : r; };
function powmod(b, e, p) { let r = 1n, x = BigInt(b), P = BigInt(p), E = BigInt(e); while (E) { if (E & 1n) r = (r * x) % P; x = (x * x) % P; E >>= 1n; } return Number(r); }
const mulmod = (a, b, p) => Number((BigInt(a) * BigInt(b)) % BigInt(p));
function gcdDegModP(a, b, p) {                         // degree of gcd(a mod p, b mod p); a, b ascending BigInt
  let A = a.map((c) => modp(c, p)), B = b.map((c) => modp(c, p));
  const trim = (x) => { while (x.length > 1 && x[x.length - 1] === 0) x.pop(); return x; };
  A = trim(A); B = trim(B);
  while (!(B.length === 1 && B[0] === 0)) {
    const inv = powmod(B[B.length - 1], p - 2, p);
    while (A.length >= B.length && !(A.length === 1 && A[0] === 0)) {
      const c = mulmod(A[A.length - 1], inv, p), k = A.length - B.length;
      for (let i = 0; i < B.length; i++) A[k + i] = (A[k + i] - mulmod(c, B[i], p) + p) % p;
      A.pop(); if (!A.length) A = [0]; trim(A);
    }
    [A, B] = [B, A];
  }
  return A.length - 1;
}
function coprime(s, r) {
  for (const p of PRIMES) {
    if (modp(s[s.length - 1], p) === 0 || modp(r[r.length - 1], p) === 0) continue;
    if (gcdDegModP(s, r, p) === 0) return p;
  }
  return 0;
}

/* ---- X4: roots — Aberth in doubles, Weierstrass in Gaussian integers, Gershgorin certified --------------------- */
function aberth(c) {                                   // c ascending BigInt; returns approximations [re, im]
  const n = c.length - 1, a = c.map(Number), lc = a[n];
  const z = [];
  let rad = 0; for (let k = 0; k < n; k++) rad = Math.max(rad, Math.pow(Math.abs(a[k] / lc), 1 / (n - k)));
  rad = Math.min(Math.max(rad, 0.5), 4);
  for (let k = 0; k < n; k++) { const th = 2 * Math.PI * k / n + 0.37; z.push([rad * Math.cos(th), rad * Math.sin(th)]); }
  for (let it = 0; it < 2000; it++) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      const [x, y] = z[i];
      let pr = a[n], pi = 0, dr = 0, di = 0;
      for (let k = n - 1; k >= 0; k--) { const tr = dr * x - di * y + pr, ti = dr * y + di * x + pi; dr = tr; di = ti; const sr = pr * x - pi * y + a[k], si = pr * y + pi * x; pr = sr; pi = si; }
      const dd = dr * dr + di * di; if (dd === 0) continue;
      const qr = (pr * dr + pi * di) / dd, qi = (pi * dr - pr * di) / dd;          // p/p'
      let sr = 0, si = 0;
      for (let j = 0; j < n; j++) { if (j === i) continue; const ex = x - z[j][0], ey = y - z[j][1], e2 = ex * ex + ey * ey; sr += ex / e2; si -= ey / e2; }
      const br = 1 - (qr * sr - qi * si), bi = -(qr * si + qi * sr), b2 = br * br + bi * bi;
      const wr = (qr * br + qi * bi) / b2, wi = (qi * br - qr * bi) / b2;
      z[i] = [x - wr, y - wi];
      moved = Math.max(moved, Math.hypot(wr, wi) / Math.max(1, Math.hypot(x, y)));
    }
    if (moved < 1e-15) break;
  }
  return z;
}
const K = 192n, ONEK = 1n << K;
const toFix = (x) => BigInt(Math.round(x * 2 ** 60)) << (K - 60n);
const shr = (a, s) => (a >= 0n ? a >> s : -((-a) >> s));
const bitlen = (a) => (a === 0n ? 0 : babs(a).toString(2).length);
function weierstrassStep(c, Z) {                       // one simultaneous step in fixed point (truncated), returns max |W| bits
  const n = c.length - 1, lc = c[n];
  const W = [];
  let worst = -Infinity;
  for (let i = 0; i < n; i++) {
    const [A, B] = Z[i];
    let pr = c[n] << K, pi = 0n;
    for (let k = n - 1; k >= 0; k--) { const tr = shr(pr * A - pi * B, K) + (c[k] << K), ti = shr(pr * B + pi * A, K); pr = tr; pi = ti; }
    let qr = ONEK * lc, qi = 0n;
    for (let j = 0; j < n; j++) { if (j === i) continue; const er = A - Z[j][0], ei = B - Z[j][1]; const tr = shr(qr * er - qi * ei, K), ti = shr(qr * ei + qi * er, K); qr = tr; qi = ti; }
    const q2 = qr * qr + qi * qi; if (q2 === 0n) refuse('two approximations coincide');
    const wr = ((pr * qr + pi * qi) << K) / q2, wi = ((pi * qr - pr * qi) << K) / q2;
    W.push([wr, wi]);
    worst = Math.max(worst, bitlen(babs(wr) + babs(wi)) - Number(K));
  }
  for (let i = 0; i < n; i++) Z[i] = [Z[i][0] - W[i][0], Z[i][1] - W[i][1]];
  return worst;
}
function ratioUpper(num, den) {                        // a double >= num/den, num >= 0, den > 0 (BigInt)
  if (num === 0n) return 0;
  const e = bitlen(num) - bitlen(den) - 64;
  if (e < -1000) return 2 ** -900;                     // far below anything used; 2^e would underflow
  const q = e >= 0 ? num / (den << BigInt(e)) : (num << BigInt(-e)) / den;
  return up(up(Number(q + 1n)) * Math.pow(2, e));      // (q + 1) 2^e >= num/den; the scaling by 2^e is exact
}
function csqrt(x, y) {                                 // the principal square root of x + iy, in doubles
  const m = Math.hypot(x, y); if (m === 0) return [0, 0];
  const a = Math.sqrt((m + Math.abs(x)) / 2);
  return x >= 0 ? [a, y / (2 * a)] : [Math.abs(y) / (2 * a), y >= 0 ? a : -a];
}
function certifyRoots(c, what, base) {
  /* approximations: Aberth on the factor itself (degree <= 42, small coefficients), each root rho mapped through
     z^2 - z + rho = 0 to the two roots (1 ± sqrt(1 - 4 rho)) / 2 of P∘T; refined on P∘T and certified there */
  const n = c.length - 1, lc = c[n];
  if (n < 1) return { disks: [], maxRad: 0, minGap: Infinity };
  const approx = [];
  for (const [x, y] of aberth(base)) { const [sx, sy] = csqrt(1 - 4 * x, -4 * y); approx.push([(1 + sx) / 2, sy / 2], [(1 - sx) / 2, -sy / 2]); }
  if (approx.length !== n) refuse(what + ': the composed degree is not twice the factor\'s');
  const Z = approx.map(([x, y]) => [toFix(x), toFix(y)]);
  /* the fixed point at 2^-192 floors the corrections near 2^-160; the radii are decided below, exactly, whatever this
     loop reached, so it only has to get the approximations well inside their roots' basins */
  let worst = 0, iters = 0;
  for (; iters < 40; iters++) { worst = weierstrassStep(c, Z); if (worst < -140) break; }
  if (!(worst < -100)) refuse(what + ': the Weierstrass refinement did not converge (|W| ~ 2^' + worst + ')');
  /* exact certification: P_i = p(z_i) 2^{Kn}, Π_i = Π_{j≠i} (Z_i - Z_j), W_i = P_i / (lc Π_i 2^K) */
  const disks = [];
  for (let i = 0; i < n; i++) {
    const [A, B] = Z[i];
    let pr = c[n], pi = 0n;
    for (let k = n - 1; k >= 0; k--) { const tr = pr * A - pi * B + (c[k] << (K * BigInt(n - k))), ti = pr * B + pi * A; pr = tr; pi = ti; }
    let qr = 1n, qi = 0n;
    for (let j = 0; j < n; j++) { if (j === i) continue; const er = A - Z[j][0], ei = B - Z[j][1]; const tr = qr * er - qi * ei, ti = qr * ei + qi * er; qr = tr; qi = ti; }
    const q2 = qr * qr + qi * qi; if (q2 === 0n) refuse(what + ': two approximations coincide');
    const w2 = ratioUpper(pr * pr + pi * pi, lc * lc * q2 << (2n * K));      // |W_i|^2 upper
    const rho = up(n * up(Math.sqrt(w2)));
    const cx = Number(A) / Number(ONEK), cy = Number(B) / Number(ONEK);    // nearest doubles; ONEK is a power of two
    const ulp = (x) => up(Math.abs(x)) - Math.abs(x) || Number.MIN_VALUE;
    const del = up(up(rho + ulp(cx)) + ulp(cy));                           // the true root within del of (cx, cy)
    disks.push({ cx, cy, del, rho });
  }
  let minGap = Infinity, maxRad = 0;
  for (let i = 0; i < n; i++) {
    maxRad = Math.max(maxRad, disks[i].del);
    for (let j = i + 1; j < n; j++) {
      const ax = Math.max(0, dn(Math.abs(disks[i].cx - disks[j].cx))), ay = Math.max(0, dn(Math.abs(disks[i].cy - disks[j].cy)));
      const dist = dn(Math.sqrt(dn(dn(ax * ax) + dn(ay * ay))));
      const gap = dn(dist - up(disks[i].del + disks[j].del));
      if (!(gap > 0)) refuse(what + ': two root disks are not disjoint (a repeated root, or approximations not separated)');
      minGap = Math.min(minGap, gap);
    }
  }
  return { disks, maxRad, minGap, worstWbits: worst };
}

/* ---- intervals on scalars --------------------------------------------------------------------------------------- */
const PIu = T.PI[1], TWOPI = T.TWO_PI, FOURPI2u = up(up(4 * PIu) * PIu);
const mulLo = (a, b) => dn(a * b), mulHi = (a, b) => up(a * b);
function ivMulW(wl, wh, a, b) {                        // [wl, wh] (one sign) times [a, b], b may be ±Infinity
  if (wl >= 0) return [a >= 0 ? mulLo(wl, a) : mulLo(wh, a), b >= 0 ? mulHi(wh, b) : mulHi(wl, b)];
  return [b >= 0 ? mulLo(wl, b) : mulLo(wh, b), a >= 0 ? mulHi(wh, a) : mulHi(wl, a)];   // wh <= 0
}
const LN2 = T.LN2;
function logIv(mlo, elo, mhi, ehi) {                   // log of [mlo 2^elo, mhi 2^ehi]; mlo may be 0
  const L = mlo > 0 ? dn(T.logPoint(mlo)[0] + (elo >= 0 ? dn(elo * LN2[0]) : dn(elo * LN2[1]))) : -Infinity;
  const H = up(T.logPoint(mhi)[1] + (ehi >= 0 ? up(ehi * LN2[1]) : up(ehi * LN2[0])));
  return [L, H];
}

/* ---- the decision of one construction ----------------------------------------------------------------------------- */
function decide(cons, boundStr, opts = {}) {
  const tauRel = opts.tauRel || 2e-8, WMIN = 2 ** -44, N0 = 1 << 10;
  const t0 = Date.now();
  const res = { bound: boundStr, checks: {} };
  try {
    if (!cons || !Array.isArray(cons.denominator) || !Array.isArray(cons.numerator) || !cons.denominator.length) refuse('not a construction: denominator and numerator lists are needed');
    /* X1 */
    const den = cons.denominator.map((r, j) => {
      const what = 'denominator ' + (r.name || j);
      const p = polyAsc(r.coeffs, what);
      if (p.length < 2) refuse(what + ' is constant');
      if (babs(p[p.length - 1]) !== 1n) refuse(what + ' is not monic up to sign');
      const m = bigInt(r.multiplicity, what + ' multiplicity'); if (m <= 0n) refuse(what + ' multiplicity is not positive');
      return { name: r.name || 'R' + j, p, m };
    });
    const num = cons.numerator.map((s, i) => {
      const what = 'numerator ' + (s.name || i);
      return { name: s.name || 'S' + i, p: polyAsc(s.coeffs, what), q: rational(s.q_rational, what + ' exponent') };
    }).filter((s) => s.q.n > 0n);
    res.checks.X1 = { ok: true, denominators: den.length, numeratorsActive: num.length };
    /* X2 */
    const D = den.reduce((s, r) => s + r.m * BigInt(r.p.length - 1), 0n);
    let an = 0n, ad = 1n;
    for (const s of num) { an = an * s.q.d + s.q.n * BigInt(s.p.length - 1) * ad; ad *= s.q.d; const g = bgcd(an, ad); an /= g; ad /= g; }
    if (!(an < D * ad)) refuse('deg A = ' + an + '/' + ad + ' is not below deg Q = ' + D);
    res.checks.X2 = { ok: true, degQ: D.toString(), degA: an + '/' + ad };
    /* X3 */
    const primes = [];
    for (const s of num) for (const r of den) { const p = coprime(s.p, r.p); if (!p) refuse('gcd(' + s.name + ', ' + r.name + ') is not shown to be 1 modulo any of ' + PRIMES.length + ' primes'); primes.push(p); }
    res.checks.X3 = { ok: true, pairs: primes.length, primesUsed: [...new Set(primes)].length };
    /* X4 */
    const factors = [];
    let maxRad = 0, minGap = Infinity, nroots = 0;
    for (const [side, list] of [['den', den], ['num', num]]) for (const f of list) {
      const c = compose(f.p);
      const cr = certifyRoots(c, f.name, f.p);
      maxRad = Math.max(maxRad, cr.maxRad); minGap = Math.min(minGap, cr.minGap); nroots += cr.disks.length;
      const lcAbs = babs(c[c.length - 1]);
      const w = side === 'den' ? [-Number(f.m), -Number(f.m)] : [dn(Number(f.q.n) / Number(f.q.d)), up(Number(f.q.n) / Number(f.q.d))];
      if (side === 'den' && !Number.isSafeInteger(Number(f.m))) refuse('a multiplicity beyond 2^53');
      if (side === 'num' && (f.q.n > 2n ** 53n || f.q.d > 2n ** 53n)) refuse('an exponent with a numerator or denominator beyond 2^53');
      const loglc = lcAbs === 1n ? [0, 0] : (() => { const x = Number(lcAbs); if (!Number.isSafeInteger(x)) refuse('a leading coefficient beyond 2^53'); return T.logPoint(x); })();
      factors.push({ name: f.name, side, w, loglc, disks: cr.disks, deg: c.length - 1 });
    }
    res.checks.X4 = { ok: true, roots: nroots, maxRadius: maxRad, minGap };
    /* X5: log M(Q∘T) */
    let lmLo = 0, lmHi = 0, minDistCircleDen = Infinity;
    for (const f of factors) if (f.side === 'den') {
      let sLo = 0, sHi = 0;
      for (const d of f.disks) {
        const r2l = dn(dn(d.cx * d.cx) + dn(d.cy * d.cy)), r2h = up(up(d.cx * d.cx) + up(d.cy * d.cy));
        const rLo = dn(dn(Math.sqrt(r2l)) - d.del), rHi = up(up(Math.sqrt(r2h)) + d.del);
        minDistCircleDen = Math.min(minDistCircleDen, rLo > 1 ? rLo - 1 : rHi < 1 ? 1 - rHi : 0);
        if (rHi > 1) sHi = up(sHi + T.logPoint(rHi)[1]);
        if (rLo > 1) sLo = dn(sLo + T.logPoint(rLo)[0]);
      }
      sLo = dn(sLo + f.loglc[0]); sHi = up(sHi + f.loglc[1]);
      const m = -f.w[0];
      lmLo = dn(lmLo + mulLo(m, sLo)); lmHi = up(lmHi + mulHi(m, sHi));
    }
    res.checks.X5 = { ok: true, logM: [lmLo, lmHi], minDistanceToCircleDenominator: minDistCircleDen };
    /* X6: the integral */
    const NR = nroots, CX = new Float64Array(NR), CY = new Float64Array(NR), DEL = new Float64Array(NR), RAD = new Float64Array(NR), FAC = new Int32Array(NR);
    const WAB = new Float64Array(NR);
    let k = 0;
    factors.forEach((f, fi) => { for (const d of f.disks) { CX[k] = d.cx; CY[k] = d.cy; DEL[k] = d.del; RAD[k] = up(up(Math.sqrt(up(up(d.cx * d.cx) + up(d.cy * d.cy)))) + d.del); FAC[k] = fi; WAB[k] = Math.max(Math.abs(f.w[0]), Math.abs(f.w[1])); k++; } });
    const NF = factors.length;
    const Pclo = new Float64Array(NF), Pchi = new Float64Array(NF), Pplo = new Float64Array(NF), Pphi = new Float64Array(NF);
    const Eclo = new Int32Array(NF), Echi = new Int32Array(NF), Eplo = new Int32Array(NF), Ephi = new Int32Array(NF);
    const S600 = 2 ** 600;
    function panelBounds(tL, w) {
      const tc = tL + w / 2;                                               // dyadic, exact
      const ang = I.mul(TWOPI, I.iv(tc, tc)), C = T.cos(ang), Sn = T.sin(ang);
      const ux = (C[0] + C[1]) / 2, uy = (Sn[0] + Sn[1]) / 2;
      const eu = up(up(C[1] - C[0]) + up(Sn[1] - Sn[0]));                 // |u(t_c) - (ux, uy)| <= eu
      const pw = up(PIu * w);                                              // |u(t) - u(t_c)| <= πw on the panel
      Pclo.fill(1); Pchi.fill(1); Pplo.fill(1); Pphi.fill(1); Eclo.fill(0); Echi.fill(0); Eplo.fill(0); Ephi.fill(0);
      let gpLo = 0, gpHi = 0, Msum = 0, taylor = true;
      for (let i = 0; i < NR; i++) {
        const dx = ux - CX[i], dy = uy - CY[i];
        const dxl = dn(dx), dxh = up(dx), dyl = dn(dy), dyh = up(dy);
        const sxl = dxl > 0 ? dn(dxl * dxl) : dxh < 0 ? dn(dxh * dxh) : 0, sxh = up(Math.max(dxl * dxl, dxh * dxh));
        const syl = dyl > 0 ? dn(dyl * dyl) : dyh < 0 ? dn(dyh * dyh) : 0, syh = up(Math.max(dyl * dyl, dyh * dyh));
        const d2l = dn(sxl + syl), d2h = up(sxh + syh);
        const dl = dn(Math.sqrt(d2l)), dh = up(Math.sqrt(d2h));
        const Dk = up(DEL[i] + eu);
        const cl = dn(dl - Dk), ch = up(dh + Dk), pl = dn(cl - pw), ph = up(ch + pw);
        const f = FAC[i];
        let v = cl > 0 ? dn(Pclo[f] * cl) : 0; Pclo[f] = v; if (v > 0 && v < 2 ** -600) { Pclo[f] = v * S600; Eclo[f] -= 600; }
        v = up(Pchi[f] * ch); Pchi[f] = v; if (v < 2 ** -600) { Pchi[f] = v * S600; Echi[f] -= 600; }
        v = pl > 0 ? dn(Pplo[f] * pl) : 0; Pplo[f] = v; if (v > 0 && v < 2 ** -600) { Pplo[f] = v * S600; Eplo[f] -= 600; }
        v = up(Pphi[f] * ph); Pphi[f] = v; if (v < 2 ** -600) { Pphi[f] = v * S600; Ephi[f] -= 600; }
        if (!taylor) continue;
        if (!(pl > 0) || !(cl > 0)) { taylor = false; continue; }
        /* τ = Re(i u / (u - r)) at (ux, uy) and the disk centre: (-uy dx + ux dy) / |dx + i dy|^2, then the perturbation */
        const a1 = uy >= 0 ? [dn(uy * dxl), up(uy * dxh)] : [dn(uy * dxh), up(uy * dxl)];
        const a2 = ux >= 0 ? [dn(ux * dyl), up(ux * dyh)] : [dn(ux * dyh), up(ux * dyl)];
        const nl = dn(a2[0] - a1[1]), nh = up(a2[1] - a1[0]);
        let tl = nl >= 0 ? dn(nl / d2h) : dn(nl / d2l), th = nh >= 0 ? up(nh / d2l) : up(nh / d2h);
        const pert = up(up(up(eu * dh) + up(up(1 + eu) * Dk)) / dn(dn(dl - Dk) * dl));
        tl = dn(tl - pert); th = up(th + pert);
        const fw = factors[f].w;
        const [ql, qh] = ivMulW(fw[0], fw[1], tl, th);
        gpLo = dn(gpLo + ql); gpHi = up(gpHi + qh);
        Msum = up(Msum + up(up(WAB[i] * RAD[i]) / dn(pl * pl)));
      }
      /* the factor logs */
      let gl = 0, gh = 0, Gup = 0;
      for (let f = 0; f < NF; f++) {
        const fw = factors[f].w, lc = factors[f].loglc;
        const Lc = logIv(Pclo[f], Eclo[f], Pchi[f], Echi[f]), Lp = logIv(Pplo[f], Eplo[f], Pphi[f], Ephi[f]);
        const c = ivMulW(fw[0], fw[1], Lc[0] === -Infinity ? -Infinity : dn(Lc[0] + lc[0]), up(Lc[1] + lc[1]));
        const p = ivMulW(fw[0], fw[1], Lp[0] === -Infinity ? -Infinity : dn(Lp[0] + lc[0]), up(Lp[1] + lc[1]));
        gl = dn(gl + c[0]); gh = up(gh + c[1]); Gup = up(Gup + p[1]);
      }
      if (Number.isNaN(Gup)) Gup = Infinity;
      let hi = Gup <= 0 ? 0 : (Gup === Infinity ? Infinity : up(w * Gup)), lo = 0;
      if (taylor && hi > 0 && Number.isFinite(gl) && Number.isFinite(gh)) {
        const gp = I.mul(TWOPI, I.iv(gpLo, gpHi));                       // d/dt = 2π d/dθ
        const L = Math.max(Math.abs(gp[0]), Math.abs(gp[1])), M = up(FOURPI2u * Msum), h = w / 2;
        const quad = up(up(up(M * h) * h) / 2);                          // M h^2 / 2
        const Lg = dn(dn(gl - up(L * h)) - quad), Ug = up(up(gh + up(L * h)) + quad);
        const rem = up(up(up(up(M * w) * w) * w) / 24);                  // M w^3 / 24
        if (Ug <= 0) hi = 0;
        else if (Lg > 0) { hi = Math.min(hi, up(up(w * gh) + rem)); lo = Math.max(0, dn(dn(w * gl) - rem)); }
        else hi = Math.min(hi, up(up(up(w * Math.max(0, gh)) + up(up(L * w) * w) / 4) + rem));
      }
      return [lo, hi];
    }
    const Dn = Number(D), tol = tauRel * Dn;
    let ILo = 0, IHi = 0, panels = 0, evaluated = 0, narrowest = 0.5;
    const stack = [];
    for (let i = N0 - 1; i >= 0; i--) stack.push([i * (0.5 / N0), 0.5 / N0]);
    while (stack.length) {
      const [tL, w] = stack.pop();
      const [lo, hi] = panelBounds(tL, w); evaluated++;
      if (!(hi - lo <= tol * w)) {
        if (w > WMIN) { stack.push([tL + w / 2, w / 2], [tL, w / 2]); continue; }
        if (!Number.isFinite(hi)) refuse('a panel of width 2^-44 near t = ' + tL + ' is not bounded (a denominator root on the circle?)');
      }
      ILo = dn(ILo + lo); IHi = up(IHi + hi); panels++; narrowest = Math.min(narrowest, w);
    }
    res.checks.X6 = { ok: true, integralHalf: [ILo, IHi], panels, evaluated, narrowest, tauRel };
    /* X7 */
    const BDlo = dn(lmLo + dn(2 * ILo)), BDhi = up(lmHi + up(2 * IHi));
    const Dlo = dn(Dn), Dhi = up(Dn);                                        // Dn exact below 2^53; kept honest anyway
    if (!(Dn < 2 ** 53)) refuse('deg Q beyond 2^53');
    const Blo = dn(BDlo / Dhi), Bhi = up(BDhi / Dlo);
    res.B = [Blo, Bhi];
    const bar = Number(boundStr), barLo = dn(bar), barHi = up(bar);   // the decimal string's double, widened
    res.verdict = Bhi < barLo ? 'CERTIFIED' : Blo >= barHi ? 'REFUTED' : 'REFUSED';
    res.why = res.verdict === 'CERTIFIED' ? 'B < ' + boundStr : res.verdict === 'REFUTED' ? 'the certificate\'s B is at least ' + boundStr : 'the enclosure of B straddles ' + boundStr;
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    res.verdict = 'REFUSED'; res.why = e.message;
  }
  res.seconds = (Date.now() - t0) / 1000;
  return res;
}

module.exports = { decide, compose, coprime, certifyRoots, polyAsc, aberth, weierstrassStep, toFix };

/* ---- the command line ------------------------------------------------------------------------------------------ */
if (require.main !== module) return;
if (process.argv[2] === '--decide') {
  const r = decide(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), process.argv[4] || '0', { tauRel: Number(process.argv[5]) || undefined });
  console.log(JSON.stringify(r, null, 1));
  process.exit(0);
}

/* ---- the inputs and the registry's words, each against its pin ------------------------------------------------- */
const PINS = JSON.parse(rd(DIR + '/PINS.json'));
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS.files[rel] || sha(buf) !== PINS.files[rel].sha256) die(rel + ' does not match its pin'); return buf; };
const JP = (rel) => JSON.parse(pinned(rel).toString('utf8'));
for (const rel of ['rpinho/verify.py', 'rpinho/independent_check.py']) pinned(rel);             // present and pinned; never run
const page = pinned('upstream/82a.md').toString('utf8'), readme = pinned('upstream/README.md').toString('utf8');
const rowOf = (ref) => {
  const line = page.split('\n').find((x) => x.startsWith('|') && x.includes('| [' + ref + '] |')) || die('no [' + ref + '] row on the 82a page');
  const m = /^\|\s*([0-9.]+)(\\\*)?\s*\|/.exec(line) || die('no bound in the [' + ref + '] row');
  return { printed: m[1], asterisked: !!m[2] };
};
const readmeRow = readme.split('\n').find((x) => x.startsWith('| [82](')) || die('no row 82 in the README');
const readmeUpper = /\| ([0-9.]+) \(([0-9.]+)\*\) \|\s*$/.exec(readmeRow) || die('the README row 82 no longer carries an asterisked upper bound');
const PIN26 = rowOf('Pin26'), EPI26 = rowOf('Epi26'), DOC01B = rowOf('Doc01b'), GRI26 = rowOf('Gri26');
if (!PIN26.asterisked || !EPI26.asterisked) die('the [Pin26] and [Epi26] rows are no longer asterisked at the pin');
if (readmeUpper[2] !== PIN26.printed) die('the README and the 82a page print different asterisked bounds');
const EPI_RESULT = JP('epi/result.json');
if (EPI_RESULT.artifact_sha256 !== PINS.files['epi/construction.json'].sha256) die('Épi\'s construction is not the artifact its result names');
if (String(EPI_RESULT.result) !== EPI26.printed) die('Épi\'s result and the registry row print different bounds');
const sameConstruction = (a, b) => JSON.stringify([a.denominator.map((d) => [d.coeffs, d.multiplicity]), a.numerator.map((n) => [n.coeffs, n.q_rational])]) === JSON.stringify([b.denominator.map((d) => [d.coeffs, d.multiplicity]), b.numerator.map((n) => [n.coeffs, n.q_rational])]);
const epiTranscribedExactly = sameConstruction(JP('epi/construction.json'), JP('rpinho/controls/epi2026.json'));

/* ---- the cases: the two asterisked rows, three controls of known truth, six planted red controls ------------------ */
const EPI = JP('epi/construction.json');
const clone = (x) => JSON.parse(JSON.stringify(x));
const mutate = (f) => { const c = clone(EPI); f(c); return c; };
const square = (coeffs) => { const p = coeffs.map(BigInt), r = new Array(2 * p.length - 1).fill(0n); p.forEach((x, i) => p.forEach((y, j) => { r[i + j] += x * y; })); return r.map((x) => Number(x)); };
const CASES = [
  { id: 'pin26', kind: 'row', what: 'the [Pin26] row: R. Pinho\'s certificate (#229), 7 denominator and 31 numerator factors, deg Q = 999,999,992', file: 'rpinho/certificate.json', bound: PIN26.printed, expect: 'CERTIFIED' },
  { id: 'epi26', kind: 'row', what: 'the [Epi26] row: Épi\'s construction (BakeLab/Epi-results @ 97fa6a42), 6 denominator and 7 numerator factors', file: 'epi/construction.json', bound: EPI26.printed, expect: 'CERTIFIED' },
  { id: 'doche2001', kind: 'control', what: 'Doche (2001b)\'s construction as the claimant transcribed it, against the [Doc01b] row', file: 'rpinho/controls/doche2001.json', bound: DOC01B.printed, expect: 'CERTIFIED' },
  { id: 'grinsztajn2026', kind: 'control', what: 'Grinsztajn\'s construction as the claimant transcribed it, against the [Gri26] row', file: 'rpinho/controls/grinsztajn2026.json', bound: GRI26.printed, expect: 'CERTIFIED' },
  { id: 'mutated-v3', kind: 'control', what: 'the claimant\'s own planted failure: the certificate with Q1\'s multiplicity doubled, against the [Pin26] bound', file: 'rpinho/controls/mutated_v3_should_fail.json', bound: PIN26.printed, expect: 'REFUTED', tauRel: 1e-4 },
  { id: 'bar-below-B', kind: 'red', what: 'Épi\'s construction against 0.25356, below its B: the certificate\'s B is shown to be at least the bar', cons: EPI, bound: '0.25356', expect: 'REFUTED', tauRel: 1e-6 },
  { id: 'shared-factor', kind: 'red', what: 'a numerator factor equal to a denominator factor (exponent 1/2): U and W are not coprime', cons: mutate((c) => c.numerator.push({ coeffs: c.denominator[0].coeffs, q_rational: '1/2' })), bound: EPI26.printed, expect: 'REFUSED', stage: /gcd\(/ },
  { id: 'not-monic', kind: 'red', what: 'a denominator factor with its coefficients doubled: not monic up to sign', cons: mutate((c) => { c.denominator[0].coeffs = c.denominator[0].coeffs.map((x) => 2 * x); }), bound: EPI26.printed, expect: 'REFUSED', stage: /not monic/ },
  { id: 'degree', kind: 'red', what: 'every exponent doubled: deg A no longer below deg Q', cons: mutate((c) => c.numerator.forEach((n) => { const [a, b] = n.q_rational.split('/'); n.q_rational = (2n * BigInt(a)) + '/' + b; })), bound: EPI26.printed, expect: 'REFUSED', stage: /deg A/ },
  { id: 'repeated-root', kind: 'red', what: 'a denominator factor squared into one polynomial: its roots are double and cannot be isolated', cons: mutate((c) => { c.denominator[0].coeffs = square(c.denominator[0].coeffs); }), bound: EPI26.printed, expect: 'REFUSED', stage: /not disjoint|did not converge|coincide/ },
  { id: 'float-exponent', kind: 'red', what: 'an exponent written as a JSON float (0.5): not an exact rational', cons: mutate((c) => { c.numerator[0].q_rational = 0.5; }), bound: EPI26.printed, expect: 'REFUSED', stage: /not written exactly/ },
];
const consOf = (c) => (c.file ? JP(c.file) : c.cons);

function runPy(c) {
  const tmp = path.join(ROOT, 'out', 'c82'); fs.mkdirSync(tmp, { recursive: true });
  const inp = path.join(tmp, c.id + '.json'), outp = path.join(tmp, 'py-' + c.id + '.json');
  fs.writeFileSync(inp, JSON.stringify(consOf(c)));
  const args = ['-I', path.join(ROOT, 'instruments', 'optq', 'c82.py'), inp, c.bound, '--json', outp];
  if (c.tauRel) args.push('--tau', String(c.tauRel));
  const r = cp.spawnSync('python3', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) die('c82.py failed on ' + c.id + ': ' + (r.stderr || '').slice(-500));
  return JSON.parse(fs.readFileSync(outp, 'utf8'));
}
const okCase = (c, r) => r.verdict === c.expect && (!c.stage || c.stage.test(r.why || ''));

console.log('C_82: the registry prints ' + PIN26.printed + '* [Pin26] and ' + EPI26.printed + '* [Epi26] on the 82a page (pinned at ' + PINS.registryCommit.slice(0, 8) + ')');
const results = CASES.map((c) => {
  const js = decide(consOf(c), c.bound, { tauRel: c.tauRel });
  const row = { id: c.id, kind: c.kind, what: c.what, source: c.file ? DIR + '/' + c.file : 'planted (a mutation of epi/construction.json, written by this file)', bound: c.bound, expect: c.expect, js };
  row.jsAsExpected = okCase(c, js);
  console.log('  ' + c.kind.padEnd(7) + c.id.padEnd(16) + ' expect ' + c.expect.padEnd(9) + ' js ' + js.verdict.padEnd(9) + (js.B ? ' B in [' + js.B[0] + ', ' + js.B[1] + ']' : ' ' + js.why) + '  ' + js.seconds + ' s' + (row.jsAsExpected ? '' : '  NOT AS EXPECTED'));
  return row;
});
const deciders = { js: sha(rd('tools/replay-c82.js')), py: sha(rd('instruments/optq/c82.py')), eqcertInterval: sha(rd('instruments/interval/interval.js')), eqcertTranscendental: sha(rd('instruments/interval/transcendental.js')) };
if (!results.every((r) => r.jsAsExpected)) die('a case came out other than expected in the JavaScript decider');
if (CHECK) {
  const was = JSON.parse(rd('certs/c82-replay.json'));
  for (const r of results) {
    const w = was.cases.find((x) => x.id === r.id) || die('the record has no case ' + r.id);
    if (w.js.verdict !== r.js.verdict || JSON.stringify(w.js.B || null) !== JSON.stringify(r.js.B || null)) die(r.id + ' does not re-derive as recorded');
  }
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('c82 replay: ' + results.length + ' cases re-derived as recorded (the JavaScript decider; the record holds both)');
} else {
  for (const r of results) {
    const c = CASES.find((x) => x.id === r.id);
    const py = runPy(c); r.py = py; r.pyAsExpected = okCase(c, py);
    r.agree = py.verdict === r.js.verdict && (!r.js.B || (py.B[0] <= r.js.B[1] && r.js.B[0] <= py.B[1]));
    console.log('  py ' + r.id.padEnd(16) + py.verdict.padEnd(9) + (py.B ? ' B in [' + py.B[0] + ', ' + py.B[1] + ']' : ' ' + py.why) + '  ' + py.seconds + ' s' + (r.agree && r.pyAsExpected ? '' : '  DISAGREES OR NOT AS EXPECTED'));
  }
  if (!results.every((r) => r.agree && r.pyAsExpected)) die('the two implementations disagree, or a case came out other than expected');
  const rows = results.filter((r) => r.kind === 'row');
  const rec = {
    what: 'The registry\'s two asterisked C_82 upper bounds (the essential minimum of the Zhang–Zagier height, page 82a) decided from the cited constructions by two implementations that share no code with each other or with the claimants\' checkers (never run): Doche\'s limit-point bound B = (log M(Q∘T) + ∫ max(0, log|A∘T| - log|Q∘T|)) / D with every root of every composed factor certified by Gershgorin\'s theorem on exact Weierstrass corrections, and the integral bounded on dyadic panels by a second-order Taylor form. Three controls of known truth and six planted red controls beside them. Doche\'s step from B to C_82 <= B is read, not re-derived.',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: +((Date.now() - T0) / 1000).toFixed(1), node: process.version, platform: process.platform + ' ' + process.arch,
    python: cp.execFileSync('python3', ['-I', '-c', 'import sys; print(sys.version.split()[0])'], { encoding: 'utf8' }).trim(),
    deciders, pins: DIR + '/PINS.json', registryCommit: PINS.registryCommit, certificateCommit: PINS.certificateCommit, epiCommit: PINS.epiCommit,
    rows: rows.map((r) => ({ id: r.id, claim: 'C_82 <= ' + r.bound, asteriskedAtPin: true, verdict: r.js.verdict, agree: r.agree, B: { js: r.js.B, py: r.py.B }, sha256: PINS.files[CASES.find((c) => c.id === r.id).file].sha256 })),
    facts: {
      claimantPrintedCertified: 'the [Pin26] row prints a certified upper bound 0.2534446873… and the README 0.25344468733362658 (verify.py) and 0.25344468733741928 (independent_check.py); the field numeric_unverified of the certificate is 0.2534446872174579',
      claimantUpperInsideOurs: rows[0].js.B[0] <= 0.25344468733362658 && 0.25344468733362658 <= rows[0].js.B[1],
      numericUnverifiedBelowB: 0.2534446872174579 < rows[0].js.B[0],
      epiRowAboveB: 'the [Epi26] row prints 0.2535744749068227; the construction\'s B is 0.2535689301…, about 5.5e-6 below it (a weaker bound than the construction gives, the safe side); the row\'s comment quotes the claimant\'s re-evaluation 0.25356893…',
      epiTranscribedExactly,
    },
    cases: results,
    limits: [
      'Doche\'s theorem (the limit-point argument, also proved in the claimant\'s README: U^n - W^n over the primes, Jensen\'s formula, coprimality) is read, not re-derived: what is decided is the certificate\'s B < the printed bound, with the theorem\'s hypotheses (integer factors, monic denominators, deg A < deg Q, coprimality) checked exactly',
      'the symmetry of the integrand under t -> 1 - t (real coefficients) halves the interval; it is a fact about conjugation, not computed',
      'the Doche and Grinsztajn controls are the claimant\'s transcriptions, not the original authors\' bytes; the Épi row is decided from Épi\'s own bytes, and the claimant\'s transcription of it is compared with them exactly',
      'a REFUTED here refutes the certificate\'s B against a bar, not the constant: C_82 may still be below the bar'
    ],
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/c82-replay.json — both rows ' + rows.map((r) => r.js.verdict).join(', ') + ' in both implementations; ' + results.length + ' cases; ' + rec.seconds + ' s');
}
