/* galois-exceptions.js — certify δ(f_24) and δ(f_48) for the erdos290 enclosure.
 *
 * S_12^+ and S_24^+ are far too large to enumerate subgroups (galois8.js's route), so
 * this kernel uses structure instead of enumeration:
 *
 *   G = Gal(f_{2l}) ⊆ S_l^+ = C_2^l ⋊ S_l   (paper Lemma 39: f(x + l) = h(x^2), h deg l)
 *
 *   (K)  K = G ∩ C_2^l is an S_l-submodule of F_2^l. The only submodules are
 *        0, ⟨diag⟩, even-weight, full. A certified kernel vector of even weight 0<w<l
 *        forces K ⊇ even-weight (A_l-orbit of one such vector spans it); odd w forces full.
 *   (π)  π(G) = Gal(h) ≤ S_l. h irreducible ⇒ transitive; an observed h-type containing a
 *        PRIME part p exactly once, l/2 < p ≤ l−3, whose lcm-power is therefore a genuine
 *        p-cycle (2p > l forces multiplicity 1 and forbids any other part being a multiple
 *        of p — asserted, not assumed), gives primitivity + Jordan ⇒ π ⊇ A_l.
 *        disc(h) square ⇔ π ⊆ A_l.
 *   (±)  A cycle of a signed permutation is negative iff the sign-vector weight on it is
 *        odd, so wt(v) ≡ #negative cycles (mod 2), and the parity of (v,σ) as a
 *        permutation of the 2l roots is (−1)^{#neg}. Hence G ⊆ A_{2l} ⇔ disc(f) square
 *        ⇔ every element of G has even weight.
 *
 * With K ⊇ even and π ⊇ A_l certified, exactly FIVE candidate groups remain:
 *        B    = C_2^l ⋊ S_l (all of S_l^+)
 *        FA   = C_2^l ⋊ A_l
 *        ES0  = {(v,σ): wt v ≡ 0,       σ ∈ S_l}
 *        ESs  = {(v,σ): wt v ≡ sgn σ,   σ ∈ S_l}
 *        EA0  = {(v,σ): wt v ≡ 0,       σ ∈ A_l}
 * The list is COMPLETE, and here is the count: K ∈ {even-weight, full} (the kernel vector
 * killed 0 and ⟨diag⟩); π(G) ∈ {A_l, S_l} (π ⊇ A_l). K full lifts uniquely (B, FA). K =
 * even-weight leaves a coset choice per σ, i.e. a homomorphism π(G) → C_2 picking the
 * weight parity: on S_l the choices are trivial (ES0) or sgn (ESs); on A_l sgn is trivial,
 * so only EA0. That is 2 + 2 + 1 = 5. main() asserts the list has exactly these names.
 * Each has an exact δ (non-derangement density) computed here over the partition classes
 * of S_l with exact class sizes. Squeeze: disc(f) square kills every candidate containing
 * an odd-weight element (B, FA, ESs); disc(h) nonsquare kills π = A_l (FA, EA0).
 * Every observed signed type must be a member of the surviving candidate — checked.
 *
 * Dedekind data: for each good prime p (p ∤ disc f · disc h), the DDF degree pattern of
 * f mod p is the point cycle type and of h mod p the projected type; the negative-cycle
 * counts are the unique solution of  n_m = 2·pos_m + neg_{m/2},  pos_k + neg_k = a_k.
 *
 * CROSS-VALIDATION FALSIFIER: the same pipeline at l = 4 must reproduce galois8.js's
 * independently-enumerated answer δ(f_8) = 150/384 and select ES0.
 *
 * Discriminants are computed EXACTLY by CRT over word-size primes with a Hadamard bound
 * on the Sylvester determinant, then integer-sqrt-tested.
 */
'use strict';
const path = require('path');
/* rational.js is VENDORED into this directory on purpose: the page promises a stranger can
   download these ten files and run them with no dependencies, and that promise was false
   while this line climbed three levels into eqcert/. The vendored copy is byte-identical to
   core/interval/rational.js and is checked as a declared fork by tools/check-duplication.js. */
const Q = require(path.join(__dirname, 'rational.js'));
const R = Q.R, add = Q.add, sub = Q.sub, mul = Q.mul, div = Q.div, cmp = Q.cmp;
const ZERO = R(0n, 1n), ONE = R(1n, 1n);

/* ---------- exact integer polynomials ---------- */
function fdCoeffs(d) {
  let P = [1n];
  for (let j = 0; j <= d; j++) {
    const nx = new Array(P.length + 1).fill(0n);
    for (let k = 0; k < P.length; k++) { nx[k + 1] += P[k]; nx[k] -= BigInt(j) * P[k]; }
    P = nx;
  }
  const f = new Array(d + 1).fill(0n);
  for (let i = 0; i <= d; i++) {
    const q = new Array(d + 1).fill(0n); let carry = 0n;
    for (let k = d + 1; k >= 1; k--) { carry = P[k] + BigInt(i) * carry; q[k - 1] = carry; }
    for (let k = 0; k <= d; k++) f[k] += q[k];
  }
  return f;
}
function shift(coeffs, a) { /* g(x) = f(x + a), a BigInt — Horner in poly form: g := g·(x+a) + c_k */
  const n = coeffs.length - 1;
  let acc = [0n];
  for (let k = n; k >= 0; k--) {
    const nx = new Array(acc.length + 1).fill(0n);
    for (let j = 0; j < acc.length; j++) { nx[j + 1] += acc[j]; nx[j] += a * acc[j]; }
    nx[0] += coeffs[k];
    acc = nx.slice(0, n + 1);
  }
  return acc;
}
function pairPoly(f, l) { /* f(x + l) = h(x^2): return h (degree l), assert odd coeffs vanish */
  const g = shift(f, BigInt(l));
  for (let j = 1; j < g.length; j += 2)
    if (g[j] !== 0n) throw new Error('shifted f_' + (2 * l) + ' is not even at x^' + j);
  const h = [];
  for (let j = 0; j < g.length; j += 2) h.push(g[j]);
  return h;
}

/* ---------- F_p arithmetic on Numbers (p^2 * deg < 2^53 — asserted) ---------- */
function primesUpto(count) { const ps = []; for (let n = 2; ps.length < count; n++) { let ok = true;
  for (const q of ps) { if (q * q > n) break; if (n % q === 0) { ok = false; break; } } if (ok) ps.push(n); } return ps; }
const nmod = (a, p) => { const r = a % p; return r < 0 ? r + p : r; };
function npowmod(b, e, p) { let r = 1; b = nmod(b, p); while (e > 0) { if (e & 1) r = r * b % p; b = b * b % p; e = Math.floor(e / 2); } return r; }
const ninv = (x, p) => npowmod(x, p - 2, p);
const ndeg = (u) => { let d = u.length - 1; while (d > 0 && u[d] === 0) d--; return (d === 0 && u[0] === 0) ? -1 : d; };
const ntrim = (u) => { const d = ndeg(u); return d < 0 ? [0] : u.slice(0, d + 1); };
function nmul(a, b, p) { const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) { const ai = a[i]; if (!ai) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] + ai * b[j]) % p; }
  return ntrim(out); }
function ndivmod(a, b, p) { a = a.slice(); const db = ndeg(b), lb = ninv(b[db], p);
  let da = ndeg(a); const q = new Array(Math.max(1, da - db + 1)).fill(0);
  while (da >= db && da >= 0) { const c = a[da] * lb % p; q[da - db] = c;
    for (let j = 0; j <= db; j++) a[da - db + j] = nmod(a[da - db + j] - c * b[j], p);
    da = ndeg(a); }
  return { q: ntrim(q), r: ntrim(a) }; }
function ngcd(a, b, p) { a = ntrim(a); b = ntrim(b);
  while (ndeg(b) >= 0) { const r = ndivmod(a, b, p).r; a = b; b = r; }
  const d = ndeg(a); if (d < 0) return [0];
  const li = ninv(a[d], p); return a.map(c => c * li % p); }
function npolypow(base, e, f, p) { let acc = [1]; base = ndivmod(base, f, p).r;
  while (e > 0) { if (e & 1) acc = ndivmod(nmul(acc, base, p), f, p).r;
    base = ndivmod(nmul(base, base, p), f, p).r; e = Math.floor(e / 2); }
  return acc; }
/* DDF degree pattern; f must be squarefree mod p (caller guarantees p ∤ disc) */
function ddfPattern(coeffsBig, p) {
  const n = coeffsBig.length - 1, li = ninv(Number(coeffsBig[n] % BigInt(p)), p);
  let f = coeffsBig.map(c => nmod(Number(c % BigInt(p)), p) * li % p);
  f = ntrim(f);
  const type = [];
  let xq = [0, 1].slice(); /* x^{p^i} mod f, maintained incrementally */
  xq = ndivmod(xq, f, p).r;
  let i = 0;
  while (ndeg(f) > 0) {
    i += 1;
    xq = npolypow(xq, p, f, p);               /* (x^{p^{i-1}})^p = x^{p^i} mod f */
    const g = xq.slice(); while (g.length < 2) g.push(0); g[1] = nmod(g[1] - 1, p);
    const dpoly = ngcd(ntrim(g), f, p);
    const dd = ndeg(dpoly);
    if (dd > 0) {
      for (let k = 0; k < dd / i; k++) type.push(i);
      f = ndivmod(f, dpoly, p).q;
      xq = ndivmod(xq, f, p).r;
    }
    if (i > ndeg(f)) { if (ndeg(f) > 0) type.push(ndeg(f)); break; }
  }
  return type.sort((x, y) => x - y);
}
/* resultant(f, f') mod p → disc mod p (for CRT); Euclidean algorithm over F_p */
/* Two DIFFERENT failure modes, two DIFFERENT sentinels — they used to share `null`, and the
 * CRT caller folded both into residue 0, so a prime dividing the leading coefficient injected
 * a wrong residue instead of being skipped (unreachable for f_d, whose lc = d+1 is far below
 * the 2^20 prime floor, but discExact is exported and must not lie on other inputs):
 *   undefined  →  p | lc(f): this prime carries NO residue; the caller must skip it entirely.
 *   0          →  p | disc(f): a true residue of 0; the caller folds it into the CRT.       */
function discModP(coeffsBig, p) {
  const n = coeffsBig.length - 1;
  let a = ntrim(coeffsBig.map(c => nmod(Number(c % BigInt(p)), p)));
  if (ndeg(a) < n) return undefined; /* lc vanishes: SKIP this prime (no residue) */
  const fp = []; for (let i = 1; i <= n; i++) fp.push(i % p * a[i] % p);
  let b = ntrim(fp);
  let res = 1;
  while (true) {
    const da = ndeg(a), db = ndeg(b);
    if (db < 0) return 0;                      /* f' ≡ 0 mod p ⇒ p | disc: residue 0 */
    if (db === 0) { res = res * npowmod(b[0], da, p) % p; break; }
    const r = ndivmod(a, b, p).r;
    const dr = ndeg(r);
    if (dr < 0) return 0;                      /* p | resultant */
    res = res * ((da * db) % 2 === 1 ? p - 1 : 1) % p;
    res = res * npowmod(b[db], da - dr, p) % p;
    a = b; b = r;
  }
  /* disc = (-1)^{n(n-1)/2} res / lc */
  const s = (n * (n - 1) / 2) % 2 === 1 ? p - 1 : 1;
  return s * res % p * ninv(ntrim(coeffsBig.map(c => nmod(Number(c % BigInt(p)), p)))[n], p) % p;
}
/* exact discriminant via CRT + Hadamard bound */
function discExact(coeffsBig) {
  const n = coeffsBig.length - 1, m = 2 * n - 1;
  /* Hadamard bound on |Res(f,f')|: product of row 2-norms of Sylvester matrix */
  const rows = [];
  const fp = []; for (let i = 1; i <= n; i++) fp.push(BigInt(i) * coeffsBig[i]);
  for (let r = 0; r < n - 1; r++) rows.push(coeffsBig);
  for (let r = 0; r < n; r++) rows.push(fp);
  let bound = 1n;
  for (const row of rows) {
    let s = 0n; for (const c of row) s += c * c;
    if (s === 0n) continue;
    bound *= (bisqrtFloor(s) + 1n);
  }
  bound = 2n * bound + 1n;
  /* CRT over primes ~ 2^20 (p^2 * m < 2^53 safe). Primes are drawn until the product of the
   * primes that ACTUALLY CONTRIBUTED exceeds the bound — a prime dividing lc(f) contributes
   * no residue (discModP returns undefined) and is skipped without advancing M, so it can
   * never poison the reconstruction. */
  let x = 0n, M = 1n;
  for (let cand = 1048583; M < bound; cand += 2) {
    let isP = true; for (let q = 3; q * q <= cand; q += 2) if (cand % q === 0) { isP = false; break; }
    if (!isP) continue;
    const dp = discModP(coeffsBig, cand);
    if (dp === undefined) continue;            /* p | lc: no residue from this prime */
    const rp = BigInt(dp);
    /* CRT combine x mod M with rp mod p */
    const pb = BigInt(cand);
    const Minv = (() => { let r = 1n, e = pb - 2n, b = M % pb;
      while (e > 0n) { if (e & 1n) r = r * b % pb; b = b * b % pb; e >>= 1n; } return r; })();
    const t = ((rp - x % pb + pb) % pb) * Minv % pb;
    x = x + M * t; M *= pb;
  }
  if (x * 2n > M) x -= M; /* symmetric lift */
  return x;
}
/* Floor integer sqrt, TERMINATING form. The previous loop here — iterate until a fixed
 * point — enters the 2-cycle q → q+1 → q whenever v is one less than a perfect square
 * (e.g. v = 8: 2,3,2,3,…) and spins forever; found 2026-08-03 by an audit whose own
 * scripts hung on disc((x−1)²). Newton from a seed ≥ √v decreases strictly until it
 * first fails to decrease, at which point x = ⌊√v⌋; that is the guard used here and in
 * theorem.js's isSquare, and it cannot cycle. */
function bisqrtFloor(v) {
  let x = 1n << BigInt(Math.ceil(v.toString(2).length / 2)); /* seed ≥ √v */
  for (;;) { const y = (x + v / x) >> 1n; if (y >= x) break; x = y; }
  while (x * x > v) x -= 1n;
  return x;
}
function isqrtCheck(v) { if (v < 0n) return false; if (v === 0n) return true;
  const x = bisqrtFloor(v); return x * x === v; }

/* ---------- partitions of l with exact class data ---------- */
function partitions(l) {
  const out = [];
  const rec = (rem, maxPart, parts) => {
    if (rem === 0) { out.push(parts.slice()); return; }
    for (let k = Math.min(rem, maxPart); k >= 1; k--) { parts.push(k); rec(rem - k, k, parts); parts.pop(); }
  };
  rec(l, l, []);
  return out.map(parts => {
    const mult = {}; for (const m of parts) mult[m] = (mult[m] || 0) + 1;
    let denom = 1n;
    for (const [m, a] of Object.entries(mult)) {
      let f = 1n; for (let i = 2; i <= a; i++) f *= BigInt(i);
      denom *= (BigInt(m) ** BigInt(a)) * f;
    }
    let lfact = 1n; for (let i = 2; i <= l; i++) lfact *= BigInt(i);
    const size = lfact / denom;
    const fix = mult[1] || 0;
    const even = (l - parts.length) % 2 === 0;   /* sgn = (−1)^{l − #parts} */
    return { parts, size, fix, even };
  });
}

/* δ of the five candidates, exact. P(no fixed root | σ with f fixed pts) = 2^{−f},
 * EXCEPT σ = id in the even-weight-kernel candidates, where it is 2^{−(l−1)} (l even). */
function candidateDeltas(l) {
  const P = partitions(l);
  let lfact = 1n; for (let i = 2; i <= l; i++) lfact *= BigInt(i);
  const half = lfact / 2n;
  const mk = (restrictEven, idBoost) => {
    /* σ = id is the ONLY element where the even-weight subgroup differs from the full group.
       For f < l fixed points the l − f free coordinates mean exactly half the qualifying
       vectors have even weight, so P(no fixed root | σ) = 2^{−f} in both groups (see the ESs
       note below). At σ = id there are no free coordinates: the single qualifying vector is
       all-ones, of weight l, which lies in the even-weight subgroup iff l is EVEN. So
         P(no fixed root | id) = 1/2^{l−1}  for even l,   and  0  for odd l.
       This branch used to THROW on odd l rather than return the 0 — a guard placed inside
       eager candidate construction, so it fired for every odd l whatever survived, and
       tail-sweep.js then marked all 15 odd degrees open. The shipped code could not
       regenerate the tail-deltas.json shipped beside it. Computing the right value is
       strictly better than refusing to compute: the guard's own comment already knew it. */
    let noFix = ZERO, total = ZERO;
    for (const c of P) {
      if (restrictEven && !c.even) continue;
      const w = R(c.size, 1n);
      total = add(total, w);
      const isId = c.fix === l;
      const pn = isId && idBoost
        ? (l % 2 === 0 ? R(1n, 2n ** BigInt(l - 1)) : ZERO)
        : R(1n, 2n ** BigInt(c.fix));
      noFix = add(noFix, mul(w, pn));
    }
    return sub(ONE, div(noFix, total));
  };
  /* ESs (wt ≡ sgn σ): for σ = id (even), coset is wt≡0 — same boost as ES0. For σ odd with
     f = 0 fixed points nothing changes; general P(nofix|σ) = 2^{−f} regardless of coset when
     l − f ≥ 1, and f = l only at id. So ESs δ equals ES0 δ. */
  return {
    B: mk(false, false),
    FA: mk(true, false),
    ES0: mk(false, true),
    ESs: mk(false, true),
    EA0: mk(true, true),
  };
}

/* ---------- signed-type solver:  point type n_m + projected type a_k → neg_k ---------- */
function solveSigned(pointType, projType, l) {
  /* n_m = 2·pos_m + neg_{m/2};  pos_k + neg_k = a_k.  Descending k: pos_{2k} is already
   * known when k is processed (2k > k), and pos_m = 0 for m > l. Unique if consistent. */
  const n = {}, a = {};
  for (const m of pointType) n[m] = (n[m] || 0) + 1;
  for (const k of projType) a[k] = (a[k] || 0) + 1;
  const pos = {}, neg = {};
  for (let k = l; k >= 1; k--) {
    const pos2k = 2 * k <= l ? (pos[2 * k] || 0) : 0;
    neg[k] = (n[2 * k] || 0) - 2 * pos2k;
    pos[k] = (a[k] || 0) - neg[k];
    if (neg[k] < 0 || pos[k] < 0) return null;
  }
  for (let m = 1; m <= 2 * l; m++) {
    const expect = 2 * (m <= l ? pos[m] || 0 : 0) + (m % 2 === 0 ? (neg[m / 2] || 0) : 0);
    if ((n[m] || 0) !== expect) return null;
  }
  return { pos, neg };
}

/* ---------- per-degree pipeline ---------- */
function analyze(d, opts) {
  const o = Object.assign({ nPrimes: 900, mutateDisc: false }, opts);
  const l = d / 2;
  const t0 = Date.now();
  console.log('== d = ' + d + ' (l = ' + l + ') ==');
  const f = fdCoeffs(d);
  const h = pairPoly(f, l);
  console.log('  pair polynomial h degree ' + (h.length - 1) + ' computed; odd coefficients vanish (Lemma 39 structure confirmed)');

  let discF = discExact(f); if (o.mutateDisc) discF += 1n;
  const discH = discExact(h);
  const fSquare = isqrtCheck(discF), hSquare = isqrtCheck(discH);
  console.log('  disc(f) exact: ' + discF.toString().length + ' digits, perfect square: ' + fSquare);
  console.log('  disc(h) exact: ' + discH.toString().length + ' digits, perfect square: ' + hSquare);

  /* Dedekind sweep */
  const PR = primesUpto(o.nPrimes);
  const fTypes = new Map(), hTypes = new Map(), signedSeen = new Map();
  const witnesses = [];       /* certified (σ-parity, #neg-parity) pairs for membership filters */
  let good = 0, negParityOdd = 0;
  const kernelWeights = new Set();
  let jordanPrime = null;
  /* l = 4 ONLY. Jordan's window l/2 < p ≤ l−3 is (2,1] — EMPTY — so d = 8 had no structural
     route to π ⊇ A_4 and imported it from galois8.js's enumeration via externalPiCert. That
     made the enumeration an INPUT to this pipeline while the write-up called it an independent
     second computation: the two are not independent if one feeds the other. They are now.
     A transitive subgroup of S_4 has order divisible by 4; containing a 3-cycle makes it
     divisible by 12; the only such subgroups are A_4 and S_4, so π ⊇ A_4. disc(h) nonsquare
     then gives π = S_4, exactly as Jordan+disc does at every larger l. */
  let threeCycle = null;
  const jordanRange = []; for (let p2 = 2; p2 <= l - 3; p2++) { let isP = p2 > 1;
    for (let q = 2; q * q <= p2; q++) if (p2 % q === 0) { isP = false; break; }
    if (isP && p2 > l / 2) jordanRange.push(p2); }
  for (const pn of PR) {
    const p = BigInt(pn);
    if (discF % p === 0n || discH % p === 0n) continue;
    if (f[f.length - 1] % p === 0n || h[h.length - 1] % p === 0n) continue;
    if (pn * pn * (d + 1) > 2 ** 52) break;
    const tf = ddfPattern(f, pn), th = ddfPattern(h, pn);
    good++;
    fTypes.set(tf.join('+'), (fTypes.get(tf.join('+')) || 0) + 1);
    hTypes.set(th.join('+'), (hTypes.get(th.join('+')) || 0) + 1);
    for (const jp of jordanRange) if (th.includes(jp)) jordanPrime = jordanPrime || { p: pn, cycle: jp, parts: th.slice() };
    if (l === 4 && th.includes(3)) threeCycle = threeCycle || { p: pn, type: th.join('+') };
    const sol = solveSigned(tf, th, l);
    if (!sol) { console.log('  WARN inconsistent signed solve at p=' + pn); continue; }
    let negTotal = 0; for (const k in sol.neg) negTotal += sol.neg[k];
    if (negTotal % 2 === 1) negParityOdd++;
    signedSeen.set(tf.join('+') + '|' + th.join('+'), sol);
    const sigmaOdd = (l - th.length) % 2 === 1;   /* sgn σ = (−1)^{l − #parts} */
    witnesses.push({ sigmaOdd, negOdd: negTotal % 2 === 1 });
    /* power-trick kernel vector weight */
    let ord = 1; for (const k of new Set(th)) ord = lcm(ord, k);
    let w = 0; for (const k in sol.neg) if (sol.neg[k] > 0 && (ord / k) % 2 === 1) w += k * sol.neg[k];
    if (w > 0 && w < l) kernelWeights.add(w);
    /* early exit once every certificate ingredient is in hand */
    if (o.earlyExit && good >= 80 && (jordanPrime || threeCycle) &&
        [...kernelWeights].some(x => x % 2 === 0) &&
        possibleFactorDegreesEmpty(fTypes, d) && possibleFactorDegreesEmpty(hTypes, l)) break;
  }
  console.log('  good primes: ' + good + ' · distinct f-types: ' + fTypes.size + ' · h-types: ' + hTypes.size);

  /* certificates */
  const certs = [];
  const fIrr = possibleFactorDegreesEmpty(fTypes, d);
  const hIrr = possibleFactorDegreesEmpty(hTypes, l);
  certs.push(['f irreducible over Q (pattern exclusion)', fIrr]);
  certs.push(['h irreducible over Q (pattern exclusion) ⇒ π transitive', hIrr]);
  if (l === 4) {
    certs.push(['small-l: observed 3-cycle in h at p=' + (threeCycle ? threeCycle.p : 'NONE') +
      ' (type ' + (threeCycle ? threeCycle.type : '—') + ') + transitive ⇒ π ⊇ A_4 ' +
      '(Jordan window is empty at l=4)', threeCycle !== null]);
    /* An `externalPiCert` branch lived here — a hardcoded `true` importing galois8.js's
       enumeration. It was dead at l = 4 (this branch wins) and WRONG anywhere else, and a
       check that cannot go red is not a check. The 3-cycle argument above replaced it. */
  } else {
    /* The selected element need not BE a p-cycle — at l = 12 the first hit is p = 23 with
       h-type 1+1+3+7. Its lcm-power IS a genuine p-cycle, but only because the part p has
       multiplicity 1 and no other part is a multiple of p; both are forced by 2p > l, and
       both are ASSERTED here rather than relied on, so widening the window to plain
       p ≤ l−3 would go red instead of silently breaking two steps at once. */
    let powerOk = false;
    if (jordanPrime) {
      const mult = jordanPrime.parts.filter(k => k === jordanPrime.cycle).length;
      const others = jordanPrime.parts.filter(k => k !== jordanPrime.cycle);
      powerOk = mult === 1 && others.every(k => k % jordanPrime.cycle !== 0);
    }
    certs.push(['Jordan: observed h-type ' + (jordanPrime ? jordanPrime.parts.join('+') + ' at p=' + jordanPrime.p +
      ' has a power that is a genuine ' + jordanPrime.cycle + '-cycle (part multiplicity 1, no other part divisible by ' +
      jordanPrime.cycle + ')' : 'NONE') +
      ', prime cycle length in (l/2, l−3] ⇒ primitive, Jordan ⇒ π ⊇ A_' + l,
      jordanPrime !== null && powerOk]);
  }
  const evenKernel = [...kernelWeights].some(w => w % 2 === 0);
  const oddKernel = [...kernelWeights].some(w => w % 2 === 1);
  certs.push(['kernel: certified vector weights {' + [...kernelWeights].sort((a, b) => a - b).join(',') + '} (0<w<l) ⇒ K ⊇ even-weight (an odd w forces K = C_2^l outright)', evenKernel || oddKernel]);
  const allNegEven = negParityOdd === 0;
  certs.push(['disc(f) square ⇔ all observed #neg even — consistency', fSquare === allNegEven]);

  /* squeeze over the five candidates */
  const deltas = candidateDeltas(l);
  const alive = [];
  for (const [name, delta] of Object.entries(deltas)) {
    const hasOddWt = (name === 'B' || name === 'FA' || name === 'ESs'); /* contains odd-weight elements */
    const piA = (name === 'FA' || name === 'EA0');
    if (fSquare && hasOddWt) continue;          /* G ⊆ A_{2l} excludes odd weight */
    if (!fSquare && !hasOddWt) continue;
    if (hSquare !== piA) continue;              /* disc(h) square ⇔ π ⊆ A_l */
    if (oddKernel && (name === 'ES0' || name === 'ESs' || name === 'EA0')) continue; /* K full excludes even-kernel candidates */
    /* membership: every certified observed element must belong to the candidate */
    const member = (wtn) => {
      if (piA && wtn.sigmaOdd) return false;
      if (name === 'ES0' && wtn.negOdd) return false;
      if (name === 'ESs' && wtn.negOdd !== wtn.sigmaOdd) return false;
      if (name === 'EA0' && wtn.negOdd) return false;
      return true;
    };
    if (!witnesses.every(member)) continue;
    alive.push({ name, delta });
  }
  console.log('  surviving candidates: ' + alive.map(a => a.name).join(', '));
  for (const a of alive) console.log('    δ(' + a.name + ') = ' + Q.toString(a.delta) + ' ≈ ' + Q.toDouble(a.delta).toFixed(9));

  const ok = certs.every(c => c[1]);
  for (const [msg, val] of certs) console.log((val ? '  ok   ' : '  FAIL ') + msg);
  console.log('  ' + (Date.now() - t0) + ' ms');
  return { l, alive, certsOk: ok, fSquare, hSquare, deltas };

  function lcm(a, b) { const g = (x, y) => y ? g(y, x % y) : x; return a / g(a, b) * b; }
}
function possibleFactorDegreesEmpty(typeMap, degree) {
  let possible = new Set(); for (let k = 1; k < degree; k++) possible.add(k);
  for (const t of typeMap.keys()) {
    const parts = t.split('+').map(Number);
    const sums = new Set([0]);
    for (const part of parts) for (const s of [...sums]) sums.add(s + part);
    possible = new Set([...possible].filter(k => sums.has(k)));
  }
  return possible.size === 0;
}

/* pairPoly and shift are exported for theorem.js, which proves the 4k(k+1) law from the
   identity disc(f_d) = (d+1)·(2^l·l!·disc h)^2 and needs the same h this file builds. One
   definition of h, used by both — a second copy is how the two would drift apart. */
module.exports = { analyze, fdCoeffs, discModP, discExact, isqrtCheck, npowmod, nmod,
                   pairPoly, shift };

/* ---------- main ---------- */
function main() {
  let fails = 0;
  const check = (name, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + name); if (!ok) fails++; };

  /* the candidate deltas themselves, against hand-verifiable closed forms. These drive the
     0.1281 even block, all 30 tail values, and every exceptional density — and until
     2026-08-03 no direct value was asserted anywhere, only consistency between candidates.
     l=4: δ_hyp = 151/384 (Lemma 40), δ_E = 75/192 (galois8.js enumerates the same numbers
     independently). l=3 is the ODD-l branch — the correction term flips sign: 19/48 → 5/12
     — and odd l IS exercised by the sweep at l = 31, 33, …, 59, so it gets its own anchor. */
  const cd4 = candidateDeltas(4), cd3 = candidateDeltas(3);
  check('candidate list is exactly {B, EA0, ES0, ESs, FA} — a silently dropped candidate goes red',
    JSON.stringify(Object.keys(cd4).sort()) === '["B","EA0","ES0","ESs","FA"]');
  check('δ_hyp(4) = 151/384 (Lemma 40 closed form, even-l branch)', cmp(cd4.B, R(151n, 384n)) === 0);
  check('δ_ES0(4) = 75/192 = 25/64 (the value galois8.js enumerates independently)',
    cmp(cd4.ES0, R(75n, 192n)) === 0);
  check('δ_ES0(3) = 5/12 (odd-l branch: 19/48 RISES to 5/12 — the sign flip is real)',
    cmp(cd3.ES0, R(5n, 12n)) === 0 && cmp(cd3.B, R(19n, 48n)) === 0);

  /* cross-validation at l = 4 against galois8.js's enumeration */
  const v8 = analyze(8, { nPrimes: 600 });
  check('CROSS-VALIDATION d=8: unique survivor', v8.alive.length === 1);
  check('CROSS-VALIDATION d=8: survivor is ES0 with δ = 150/384 = 25/64 (matches galois8.js 75/192)',
    v8.alive.length === 1 && v8.alive[0].name === 'ES0' && cmp(v8.alive[0].delta, R(75n, 192n)) === 0);

  const v24 = analyze(24, { nPrimes: 900 });
  check('d=24: all certificates green', v24.certsOk);
  check('d=24: unique survivor, and it is ES0 — the name is the claim, so the name is asserted',
    v24.alive.length === 1 && v24.alive[0].name === 'ES0');

  const v48 = analyze(48, { nPrimes: 900 });
  check('d=48: all certificates green', v48.certsOk);
  check('d=48: unique survivor, and it is ES0',
    v48.alive.length === 1 && v48.alive[0].name === 'ES0');

  if (v24.alive.length === 1 && v48.alive.length === 1) {
    console.log('\n==> CERTIFIED  δ(f_24) = ' + Q.toString(v24.alive[0].delta) + '  (' + v24.alive[0].name + ')');
    console.log('==> CERTIFIED  δ(f_48) = ' + Q.toString(v48.alive[0].delta) + '  (' + v48.alive[0].name + ')');
    /* the index-2 prediction δ = δ_hyp − 1/(2^l l!) is the mechanism the posts and the page
       state, so a mismatch is a FAILURE with an exit code, not a console note (it was a
       console.log until 2026-08-03 — a mismatch would have shipped green). */
    for (const [lbl, v] of [['24', v24], ['48', v48]]) {
      const l = v.l;
      let s = ZERO, fact = 1n;
      for (let i = 0; i <= l; i++) { if (i > 0) fact *= BigInt(i);
        const t = R(1n, (2n ** BigInt(i)) * fact);
        s = (i % 2 === 0) ? add(s, t) : sub(s, t); }
      const hyp = sub(ONE, s);
      let lf = 1n; for (let i = 2; i <= l; i++) lf *= BigInt(i);
      const pred = sub(hyp, R(1n, (2n ** BigInt(l)) * lf));
      check('index-2 prediction d=' + lbl + ': certified δ equals δ_hyp − 1/(2^l l!) exactly',
        cmp(pred, v.alive[0].delta) === 0);
    }
  }

  /* falsifier: mutated disc(f)+1 must break the squeeze or the consistency gate */
  const vm = analyze(8, { nPrimes: 300, mutateDisc: true });
  check('FALSIFIER (disc(f)+1): certificates or squeeze must break',
    !(vm.certsOk && vm.alive.length === 1 && vm.alive[0].name === 'ES0'));

  console.log(fails === 0 ? 'ALL PASS' : fails + ' CHECK(S) FAILED');
  process.exit(fails === 0 ? 0 : 1);
}
if (require.main === module) main();
