/* erdos290/kernel.js — certified enclosure of the constant c in van Doorn,
 * "On the non-monotonicity of the denominator of generalized harmonic sums"
 * (arXiv:2411.03073v2), Theorem 8 / Lemma 32, feeding Erdős problem #290
 * (github.com/teorth/erdosproblems issue #164).
 *
 *   c = Σ_{d≥1} δ(f_d) / (d(d+1)),   f_d(x) = Σ_{i=0}^d Π_{j≠i} (x−j)
 *
 * Structure of the enclosure (every piece exact rational, no floats in the bound):
 *   odd d:        δ(f_d) = 1 (paper Lemma 37, a proved identity: (2x−d) | f_d)
 *                 → the odd part is exactly Σ 1/((2l−1)2l) = log 2, enclosed here by
 *                   rational bounds from log 2 = 2 atanh(1/3) with a geometric tail bound,
 *                   and ANCHORED against a direct partial sum of the series itself plus
 *                   the hand-checkable telescoping identity O + T = Σ 1/(d(d+1)) = 1.
 *   even d=2l, l ≤ 30, l ∉ {4,12,24}:
 *                 δ(f_{2l}) = 1 − Σ_{i=0}^l (−1)^i/(2^i i!)   (paper Lemmas 38–40),
 *                 CONDITIONAL on the paper's computational facts: f_d irreducible and
 *                 Gal(f_d) ≅ S_l^+ (author: PARI + Magma). This file independently
 *                 re-certifies the IRREDUCIBILITY half for even d ≤ 60 via Rabin's
 *                 test over F_p (a mod-p irreducibility witness is a proof of
 *                 irreducibility over Q). The Galois-group half is NOT re-certified
 *                 here and stays attributed to the paper.
 *   even d ∈ {8,24,48}:
 *                 all three δ pinned EXACTLY — galois8.js (d=8, subgroup enumeration) and
 *                 galois-exceptions.js (d=24,48, five-candidate squeeze). The literals are
 *                 re-validated here against the index-2 closed form δ_hyp(l) − 1/(2^l l!)
 *                 on every run, so a mistranscribed digit refuses instead of certifying.
 *   tail l = 31…60:
 *                 exact δ read from tail-deltas.json (tail-sweep.js), each entry re-derived
 *                 from its declared group's closed form, and every ES0 entry gated by the
 *                 theorem: an index-2 group at a degree where d+1 is not a perfect square
 *                 contradicts theorem.js and REFUSES. A validation failure throws — it does
 *                 not silently widen. Absent file = no claims (δ stays [0,1]).
 *   tail l > 60:  δ ∈ [0, 1]; the weight Σ_{l>60} 1/(2l(2l+1)) is EXACT by telescoping
 *                 (Σ_{l≥1} = 1 − log 2), not a partial sum plus remainder — the earlier
 *                 5000-term partial gave away 7.5e-9 of the upper endpoint for nothing.
 *
 * OUTPUT: certified rational bounds c_lo < c < c_hi — printed BOTH as 12-digit outward
 * decimals and as the exact fractions they round from — and the derived Theorem-8
 * brackets 1/(1+c) and 1/(2c).
 *
 * Falsifiers at the bottom: each must go red under its planted mutation.
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

/* ---------- decimal printing: floor/ceil of a rational to k digits ---------- */
function decimals(a, k, mode /* 'floor' | 'ceil' */) {
  const neg = a.n < 0n; if (neg) a = Q.neg(a);
  const scale = 10n ** BigInt(k);
  let num = a.n * scale, q = num / a.d, r = num % a.d;
  if (mode === 'ceil' && r !== 0n) q += 1n;
  if (neg) q = -q; // (not used for our positive constants)
  const s = q.toString().padStart(k + 1, '0');
  return s.slice(0, -k) + '.' + s.slice(-k);
}

/* ---------- rational enclosure of log 2 = 2 atanh(1/3) ---------- */
/* 2 atanh(1/3) = 2 Σ_{k≥0} (1/(2k+1)) 3^{-(2k+1)}; positive terms, tail after
 * n terms bounded by first omitted term × Σ 9^{-j} = t_n × 9/8. */
function log2Enclosure(nTerms) {
  let s = ZERO;
  for (let k = 0; k < nTerms; k++) {
    const m = 2 * k + 1;
    s = add(s, R(2n, BigInt(m) * 3n ** BigInt(m)));
  }
  const m = 2 * nTerms + 1;
  const tail = mul(R(2n, BigInt(m) * 3n ** BigInt(m)), R(9n, 8n));
  return { lo: s, hi: add(s, tail) };
}

/* ---------- δ(f_{2l}) under Gal ≅ S_l^+ : 1 − Σ_{i=0}^l (−1)^i/(2^i i!) ---------- */
function deltaHyperoct(l) {
  let s = ZERO, fact = 1n;
  for (let i = 0; i <= l; i++) {
    if (i > 0) fact *= BigInt(i);
    const term = R(1n, (2n ** BigInt(i)) * fact);
    s = (i % 2 === 0) ? add(s, term) : sub(s, term);
  }
  return sub(ONE, s);
}
/* index-2 (even-weight) group: δ = δ_hyp(l) − 1/(2^l l!) for even l */
function deltaIndex2(l) {
  let lf = 1n; for (let i = 2; i <= l; i++) lf *= BigInt(i);
  return sub(deltaHyperoct(l), R(1n, (2n ** BigInt(l)) * lf));
}

/* The three exceptional densities, certified by galois8.js (l=4, enumeration) and
 * galois-exceptions.js (l=12,24, structural elimination). ONE copy at module scope — these
 * literals used to exist twice in this file and once more in narrowing.js, with nothing
 * tying any copy to the programs that certify them: a 27% error planted in δ(f_24) ran to
 * ALL PASS on 2026-08-03. main() now asserts each equals deltaIndex2(l) exactly, which is
 * the closed form both certifying programs derive, so that mutation goes red. */
const EXACT_DELTAS = [
  [4, R(75n, 192n)],
  [12, R(35090142217n, 89181388800n)],
  [24, R(12719809044827249231493399463n, 32327319418426498303918080000n)],
];

/* ---------- f_d integer coefficients (ascending) ---------- */
function fdCoeffs(d) {
  /* P(x) = Π_{j=0}^d (x−j); f_d = Σ_i P/(x−i) via synthetic division. */
  let P = [1n];
  for (let j = 0; j <= d; j++) {
    const nx = new Array(P.length + 1).fill(0n);
    for (let k = 0; k < P.length; k++) { nx[k + 1] += P[k]; nx[k] -= BigInt(j) * P[k]; }
    P = nx;
  }
  const f = new Array(d + 1).fill(0n);
  for (let i = 0; i <= d; i++) {
    /* synthetic division of P by (x − i), quotient degree d */
    const q = new Array(d + 1).fill(0n);
    let carry = 0n;
    for (let k = d + 1; k >= 1; k--) { carry = P[k] + BigInt(i) * carry; q[k - 1] = carry; }
    for (let k = 0; k <= d; k++) f[k] += q[k];
  }
  return f;
}

/* ---------- polynomial arithmetic over F_p (BigInt, dense, ascending) ---------- */
function pmod(a, p) { const r = a % p; return r < 0n ? r + p : r; }
function polyMulMod(a, b, f, p) {
  const n = f.length - 1, out = new Array(a.length + b.length - 1).fill(0n);
  for (let i = 0; i < a.length; i++) { if (a[i] === 0n) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] + a[i] * b[j]) % p; }
  /* reduce mod f (monic-normalize f first outside) */
  for (let k = out.length - 1; k >= n; k--) { const c = out[k]; if (c === 0n) continue;
    for (let j = 0; j <= n; j++) out[k - n + j] = pmod(out[k - n + j] - c * f[j], p);
    out[k] = 0n; }
  if (out.length > n) out.length = n;
  while (out.length < n) out.push(0n);          /* pad — a truncate-only here left undefined holes */
  while (out.length > 1 && out[out.length - 1] === 0n) out.pop();
  return out;
}
function powXMod(e, f, p) { /* x^e mod (f, p) */
  let base = [0n, 1n], acc = [1n];
  while (e > 0n) { if (e & 1n) acc = polyMulMod(acc, base, f, p);
    base = polyMulMod(base, base, f, p); e >>= 1n; }
  return acc;
}
function polyGcdMod(a, b, p) {
  const inv = (x) => { /* Fermat */ let r = 1n, e = p - 2n, base = pmod(x, p);
    while (e > 0n) { if (e & 1n) r = r * base % p; base = base * base % p; e >>= 1n; } return r; };
  a = a.slice(); b = b.slice();
  const deg = (u) => { let d = u.length - 1; while (d > 0 && u[d] === 0n) d--; return u[d] === 0n && d === 0 ? -1 : d; };
  while (deg(b) >= 0) {
    let da = deg(a), db = deg(b);
    if (da < db) { const t = a; a = b; b = t; da = deg(a); db = deg(b); continue; }
    const lc = inv(b[db]);
    while (da >= db) {
      const c = a[da] * lc % p;
      for (let j = 0; j <= db; j++) a[da - db + j] = pmod(a[da - db + j] - c * b[j], p);
      while (da > 0 && a[da] === 0n) da--;
      if (a[da] === 0n && da === 0) { da = -1; break; }
    }
    const t = a; a = b; b = t;
  }
  return a;
}
const primeFactors = (n) => { const out = []; for (let q = 2; q * q <= n; q++) { if (n % q === 0) { out.push(q); while (n % q === 0) n /= q; } } if (n > 1) out.push(n); return out; };

/* Rabin: f (degree n, monic over F_p) irreducible over F_p iff x^{p^n} ≡ x mod f
 * and gcd(x^{p^{n/q}} − x, f) = 1 for every prime q | n. Irreducible mod p (with
 * p ∤ lc·disc handled implicitly: any p where the test PASSES is a valid witness,
 * since the test itself works in F_p[x]/(f) with f monic-normalized). */
function irreducibleModP(coeffs, p) {
  const n = coeffs.length - 1;
  const lcInv = (() => { let r = 1n, e = p - 2n, b = pmod(coeffs[n], p);
    if (b === 0n) return null;
    while (e > 0n) { if (e & 1n) r = r * b % p; b = b * b % p; e >>= 1n; } return r; })();
  if (lcInv === null) return false;
  const f = coeffs.map(c => pmod(c, p) * lcInv % p);
  const xpn = powXMod(p ** BigInt(n), f, p);
  const xMinus = xpn.slice(); xMinus[1] = pmod((xMinus[1] ?? 0n) - 1n, p);
  if (xMinus.some(c => c !== 0n)) return false;
  for (const q of primeFactors(n)) {
    const e = p ** BigInt(n / q);
    const g = powXMod(e, f, p).slice(); g[1] = pmod((g[1] ?? 0n) - 1n, p);
    const gc = polyGcdMod(g.length ? g : [0n], f, p);
    const dg = (() => { let d = gc.length - 1; while (d > 0 && gc[d] === 0n) d--; return d; })();
    if (dg > 0) return false;
  }
  return true;
}
const PRIMES = (() => { const ps = []; for (let n = 2; ps.length < 400; n++) { let ok = true;
  for (const q of ps) { if (q * q > n) break; if (n % q === 0) { ok = false; break; } } if (ok) ps.push(n); } return ps; })();
function irreducibilityWitness(d) {
  const coeffs = fdCoeffs(d);
  for (const p of PRIMES) if (irreducibleModP(coeffs, BigInt(p))) return p;
  return null;
}

/* ---------- assemble the enclosure ---------- */
function enclosure(opts) {
  const o = Object.assign({ logTerms: 40, mutateDelta: false, mutateTailIdentity: false }, opts);
  const L = log2Enclosure(o.logTerms);

  const EXC = new Set([4, 12, 24]);            /* paper: Gal ≇ S_l^+ at d = 8, 24, 48 */
  let evenVerified = ZERO;
  for (let l = 1; l <= 30; l++) {
    if (EXC.has(l)) continue;
    let dl = deltaHyperoct(l);
    if (o.mutateDelta) dl = sub(ONE, dl);       /* planted mutation for the falsifier */
    evenVerified = add(evenVerified, div(dl, R(BigInt(2 * l) * BigInt(2 * l + 1), 1n)));
  }

  /* ALL THREE exceptions are pinned exactly (galois8.js for d=8 by subgroup enumeration;
   * galois-exceptions.js for d=24, 48 by the five-candidate squeeze — disc(f) a perfect
   * square ⇒ G ⊆ A_{2l} + kernel/Jordan certificates ⇒ the index-2 group ES0). The module-
   * level EXACT_DELTAS literals are asserted against deltaIndex2(l) in main(). */
  let excSum = ZERO;
  for (const [l, d0] of EXACT_DELTAS) {
    const dl = o.mutateDelta ? sub(ONE, d0) : d0;
    excSum = add(excSum, div(dl, R(BigInt(2 * l) * BigInt(2 * l + 1), 1n)));
  }
  const excLo = excSum, excHi = excSum;

  /* tail l ≥ 31: δ ∈ [0, 1] EXCEPT where tail-sweep.js certified an exact value
   * (tail-deltas.json, produced by the five-candidate squeeze; absent file = no claims).
   * ONLY a missing file is tolerated: a file that exists but fails validation THROWS.
   * The previous bare catch swallowed validation failures too, so a tampered entry
   * silently widened the interval while the header promised it would be refused. */
  let tailCert = new Map();
  let tdRaw = null;
  try { tdRaw = require('fs').readFileSync(require('path').join(__dirname, 'tail-deltas.json'), 'utf8'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; /* absent file: every tail δ stays [0,1] */ }
  if (tdRaw !== null) {
    const td = JSON.parse(tdRaw);           /* corrupt JSON throws — refusal, not widening */
    /* VALIDATE, never trust: the dominant improvement in the headline enclosure comes from
       this file, so each stored δ is re-checked against the closed form its own `name` claims
       — δ_hyp(l) for the full hyperoctahedral group B, δ_hyp(l) − 1/(2^l l!) for the index-2
       group ES0. A hand-edited or stale entry is refused rather than silently certified.
       And the THEOREM gates the names: ES0 ⊆ A_{2l} needs disc(f_d) square, which needs
       d+1 = 2l+1 a perfect square (theorem.js) — an ES0 entry anywhere else is refused. */
    for (const [ls, v] of Object.entries(td.deltas)) {
      const l = Number(ls), got = R(BigInt(v.n), BigInt(v.d));
      if (v.name !== 'B' && v.name !== 'ES0')
        throw new Error('tail-deltas.json: unknown group name ' + v.name + ' at l=' + l);
      if (v.name === 'ES0') {
        const s = 2 * l + 1, r = Math.round(Math.sqrt(s));
        if (r * r !== s)
          throw new Error('tail-deltas.json: ES0 declared at l=' + l + ' but d+1=' + s +
            ' is not a perfect square — contradicts the 4k(k+1) theorem');
      }
      const want = v.name === 'ES0' ? deltaIndex2(l) : deltaHyperoct(l);
      if (cmp(got, want) !== 0)
        throw new Error('tail-deltas.json: δ at l=' + l + ' does not match its declared group ' + v.name);
      tailCert.set(l, got);
    }
  }
  let tailLo = ZERO, tailHi = ZERO;
  for (let l = 31; l <= 60; l++) {
    const w = R(1n, BigInt(2 * l) * BigInt(2 * l + 1));
    if (tailCert.has(l)) { const dl = tailCert.get(l);
      tailLo = add(tailLo, mul(dl, w)); tailHi = add(tailHi, mul(dl, w)); }
    else tailHi = add(tailHi, w);
  }
  /* beyond the sweep, l > 60: δ ∈ [0, 1], and the weight is EXACT by telescoping:
   *   Σ_{l≥1} 1/(2l(2l+1)) = Σ_{l≥1} (1/(2l) − 1/(2l+1)) = 1 − log 2,
   * so Σ_{l>60} = (1 − log 2) − Σ_{l=1..60}, outward-rounded through the log 2 enclosure.
   * Until 2026-08-03 this was a 5000-term partial sum plus the remainder bound 1/(4N) —
   * valid, but 7.5e-9 looser than the identity, and the prose claim "the remaining width
   * is entirely the tail" was off by exactly that slack. Now it is the tail, exactly.
   * (The superseded remainder ALSO had a caught defect worth keeping on record: the first
   * draft bounded it by 1/(4(N+1)), which UNDER-bounds since 4l(l+1) > 2l(2l+1); falsifier
   * X2 caught it before anything shipped. X2 now plants the historical tail-identity bug —
   * log 2 where 1 − log 2 belongs — which this closed form makes plantable.) */
  let partial60 = ZERO;
  for (let l = 1; l <= 60; l++) partial60 = add(partial60, R(1n, BigInt(2 * l) * BigInt(2 * l + 1)));
  const beyondHi = o.mutateTailIdentity
    ? sub(L.hi, partial60)                 /* planted bug: the retracted identity's direction */
    : sub(sub(ONE, L.lo), partial60);      /* (1 − log2_lo) − partial: a certified UPPER bound */
  tailHi = add(tailHi, beyondHi);

  const cLo = add(add(add(L.lo, evenVerified), excLo), tailLo);
  const cHi = add(add(add(L.hi, evenVerified), excHi), tailHi);

  /* Theorem-8 brackets: liminf ∈ [1/(1+c), 1/(2c)] ⇒ certified outer bracket */
  const liminfLo = div(ONE, add(ONE, cHi));     /* lower bound needs c_hi */
  const liminfHi = div(ONE, mul(R(2n, 1n), cLo)); /* upper bound needs c_lo */

  return { L, evenVerified, excLo, excHi, tailLo, tailHi, cLo, cHi, liminfLo, liminfHi };
}

/* ---------- conditional high-precision value c* ----------
 * ASSUMPTION (labeled, not asserted): for every even d = 2l ≥ 62, Gal(f_d) is either
 * S_l^+ or its index-2 subgroup ES0 — i.e. δ_l ∈ [δ_hyp(l) − 1/(2^l l!), δ_hyp(l)].
 * This holds at EVERY degree where the group is certified (all even d ≤ 60: hyperoctahedral
 * off the exceptional set by the paper's Magma runs, ES0 at d = 8, 24, 48 by our kernels).
 * Under it, c* is enclosed to ~30 digits:
 *   c* = Σ_{l≤N} exact  +  Σ_{l>N} δ_l/(2l(2l+1)),
 *   Σ_{l>N} 1/(2l(2l+1)) = Σ_{m=1}^{2N+1} (−1)^{m+1}/m − log 2   (exact + log2 enclosure),
 *   δ_l ∈ [δ_∞ − dev − allow, δ_∞ + dev],  δ_∞ = 1 − e^{−1/2} (alternating series brackets),
 *   dev = 1/(2^{N+2}(N+2)!) (δ_hyp deviation) and allow = 1/(2^{N+1}(N+1)!) (index-2
 *   allowance) — both evaluated at l = N+1, where they are largest; both ~1e-241 at N=120. */
function conditionalCStar(N, logTerms) {
  const L = log2Enclosure(logTerms);
  /* finite part: odd contributions are inside log2; here sum the EVEN l ≤ N exactly.
     The exceptional densities come from the single module-level EXACT_DELTAS — this
     function carried its own copy of the three literals until 2026-08-03, which is one
     more place a transcription slip could hide. One constant, one home. */
  const excMap = new Map(EXACT_DELTAS);
  let finLo = ZERO, finHi = ZERO;
  for (let l = 1; l <= N; l++) {
    let s = ZERO, fc = 1n;
    for (let i = 0; i <= l; i++) { if (i > 0) fc *= BigInt(i);
      const t = R(1n, (2n ** BigInt(i)) * fc);
      s = (i % 2 === 0) ? add(s, t) : sub(s, t); }
    const hyp = sub(ONE, s);
    let lf = 1n; for (let i = 2; i <= l; i++) lf *= BigInt(i);
    const allowance = R(1n, (2n ** BigInt(l)) * lf);
    const w = R(1n, BigInt(2 * l) * BigInt(2 * l + 1));
    let dLo, dHi;
    if (excMap.has(l)) { dLo = dHi = excMap.get(l); }
    else if (2 * l <= 60) { dLo = dHi = hyp; }               /* paper-certified hyperoctahedral */
    else { dLo = sub(hyp, allowance); dHi = hyp; }           /* the labeled assumption */
    finLo = add(finLo, mul(dLo, w)); finHi = add(finHi, mul(dHi, w));
  }
  /* Tail weight T = Σ_{l>N} 1/(2l(2l+1)). Since 1/(2l(2l+1)) = 1/(2l) − 1/(2l+1), the tail is
     the alternating harmonic remainder STARTING AT THE EVEN TERM 1/(2N+2):
       T = 1/(2N+2) − 1/(2N+3) + …  =  Σ_{m=1}^{2N+1} (−1)^{m+1}/m  −  log 2.
     This read `log2 − Σ_{m=1}^{2N}` until 2026-08-03, which is a different quantity —
     1/(2N+1) − T, the remainder starting at the ODD term. It was wrong by 8.6e−6 at N = 120
     and, being N-dependent, made the "30-digit" value drift with the cutoff: N = 120 and
     N = 200 returned disjoint enclosures of the same constant. It survived because the only
     check on c* was that it lies inside [0.82911, 0.83323], which both values do. A check
     that cannot go red is not a check; the cutoff-agreement assertion below is the real one.
     Sanity anchor, checkable by hand: at N = 0 the identity must give 1 − log 2, not log 2. */
  let alt = ZERO;
  for (let m = 1; m <= 2 * N + 1; m++) { const t = R(1n, BigInt(m));
    alt = (m % 2 === 1) ? add(alt, t) : sub(alt, t); }
  const TLo = sub(alt, L.hi), THi = sub(alt, L.lo);
  /* δ_∞ = 1 − e^{−1/2}; alternating series partial sums bracket e^{−1/2} */
  let fc2 = 1n, lastTerm = ONE, s2 = ZERO;
  for (let i = 0; i <= 60; i++) { if (i > 0) fc2 *= BigInt(i);
    const t = R(1n, (2n ** BigInt(i)) * fc2);
    s2 = (i % 2 === 0) ? add(s2, t) : sub(s2, t); lastTerm = t; }
  const eLo = sub(s2, lastTerm), eHi = add(s2, lastTerm);
  const dInfLo = sub(ONE, eHi), dInfHi = sub(ONE, eLo);
  /* δ_l enclosure for l > N. Two distinct error terms, and they are NOT interchangeable:
     the ASSUMPTION allows δ_l as low as δ_hyp(l) − 1/(2^l l!) (index-2 allowance, largest
     at l = N+1), and δ_hyp(l) itself sits within 1/(2^{l+1}(l+1)!) of δ_∞ (alternating
     series, next term). The lower bound needs BOTH subtracted; the upper needs only the
     deviation added. The header used to name both while the code applied one — a 1e-241
     nothing at N = 120, but a stated bound and an implemented bound must be the same bound. */
  let nf = 1n; for (let i = 2; i <= N + 1; i++) nf *= BigInt(i);
  const aN1 = R(1n, (2n ** BigInt(N + 1)) * nf);                     /* index-2 allowance at l = N+1 */
  const devN1 = R(1n, (2n ** BigInt(N + 2)) * nf * BigInt(N + 2));   /* δ_hyp deviation at l = N+1 */
  const tailLo = mul(sub(dInfLo, add(aN1, devN1)), TLo), tailHi = mul(add(dInfHi, devN1), THi);
  /* tailWeight is exposed so the identity can be anchored on its own, independently of the
     δ enclosure it later gets multiplied by — see the T(0) = 1 − log 2 check in main(). */
  return { lo: add(add(L.lo, finLo), tailLo), hi: add(add(L.hi, finHi), tailHi),
           tailWeight: { lo: TLo, hi: THi } };
}

/* ---------- main ---------- */
function main() {
  const t0 = Date.now();
  let fails = 0;
  const check = (name, ok) => { console.log((ok ? '  ok   ' : '  FAIL ') + name); if (!ok) fails++; };

  const E = enclosure({});

  /* Section 1 — the certified enclosure. Every component is captured as its PRINTED STRING
     first, and the same string is printed and later parsed back for the column-sum check —
     because the printed column is what a sceptical reader adds up. (Once, the tail lower
     bound was hardcoded to 0 in the print while the internal identity held: the column
     visibly failed to sum, ~1.58e-3, and no internal check could see it. The check below
     operates on these strings, so re-planting that defect goes red.) */
  const P = {
    logLo: decimals(E.L.lo, 15, 'floor'), logHi: decimals(E.L.hi, 15, 'ceil'),
    even: decimals(E.evenVerified, 15, 'floor'),
    excLo: decimals(E.excLo, 15, 'floor'), excHi: decimals(E.excHi, 15, 'ceil'),
    tailLo: decimals(E.tailLo, 15, 'floor'), tailHi: decimals(E.tailHi, 15, 'ceil'),
    cLo: decimals(E.cLo, 12, 'floor'), cHi: decimals(E.cHi, 12, 'ceil'),
  };
  console.log('erdos290 kernel — certified enclosure of c (arXiv:2411.03073 Lemma 32)');
  console.log('  log 2       ∈ [' + P.logLo + ', ' + P.logHi + ']');
  console.log('  even l≤30   =  ' + P.even + '  (exact rational, conditional on paper Galois facts)');
  console.log('  exceptions  ∈ [' + P.excLo + ', ' + P.excHi + ']  (d = 8, 24, 48)');
  console.log('  tail l≥31   ∈ [' + P.tailLo + ', ' + P.tailHi + ']');
  console.log('  c           ∈ [' + P.cLo + ', ' + P.cHi + ']');
  /* the exact fractions the decimals round from, so a reader can re-derive every derived
     bracket without guessing the hidden digits (the 12-digit floor of c_lo does NOT
     reproduce the ceil of 1/(2c) — the exact endpoint does) */
  console.log('  c_lo exact  =  ' + Q.toString(E.cLo));
  console.log('  c_hi exact  =  ' + Q.toString(E.cHi));
  console.log('  liminf bracket (Thm 8):  [' + decimals(E.liminfLo, 12, 'floor') + ', ' + decimals(E.liminfHi, 12, 'ceil') + ']');

  /* Section 1b — conditional high-precision c* (labeled assumption, see function header) */
  const CS = conditionalCStar(120, 80);
  console.log('  c* CONDITIONAL ∈ [' + decimals(CS.lo, 34, 'floor') + ',');
  console.log('                    ' + decimals(CS.hi, 34, 'ceil') + ']');
  /* Every decimal that appears in a post is PRINTED HERE, floor/ceil explicit, so it is
     transcribed from output rather than recomputed by hand. The upper endpoint of 1/(1+c)
     was hand-rounded INWARD (…448 for …4480174…) in an earlier draft, which quietly
     contradicted the same paragraph's claim that no floating point enters any inequality. */
  console.log('  --- derived, for transcription ---');
  console.log('  1/(1+c)  ∈ [' + decimals(div(ONE, add(ONE, E.cHi)), 12, 'floor') + ', '
                                + decimals(div(ONE, add(ONE, E.cLo)), 12, 'ceil') + ']');
  console.log('  1/(2c)   ∈ [' + decimals(div(ONE, mul(R(2n, 1n), E.cHi)), 12, 'floor') + ', '
                                + decimals(div(ONE, mul(R(2n, 1n), E.cLo)), 12, 'ceil') + ']');
  console.log('  1/(1+c*) ∈ [' + decimals(div(ONE, add(ONE, CS.hi)), 33, 'floor') + ',');
  console.log('              ' + decimals(div(ONE, add(ONE, CS.lo)), 33, 'ceil') + ']  CONDITIONAL');
  /* THE COLUMN CHECK, on the printed strings. Its predecessor compared the internal
     rationals to themselves re-associated — exact addition is associative, so it could not
     go red on ANY input, including the printed-ZERO regression it cited as its reason to
     exist. Parsing the strings back closes that: the floor/ceil components each sit within
     1e-15 of their rational, the 12-digit c endpoints within 1e-12, so the parsed column
     must agree with the parsed c to 2e-12 — and a suppressed component misses by ~1.6e-3. */
  const parseDec = (s) => { const [ip, fp] = s.split('.'); return R(BigInt(ip + fp), 10n ** BigInt(fp.length)); };
  const ulp12 = R(2n, 10n ** 12n);
  const colLo = add(add(parseDec(P.logLo), parseDec(P.even)), add(parseDec(P.excLo), parseDec(P.tailLo)));
  const colHi = add(add(parseDec(P.logHi), parseDec(P.even)), add(parseDec(P.excHi), parseDec(P.tailHi)));
  check('the PRINTED column sums to the PRINTED c at display precision (strings parsed back)',
    cmp(Q.abs(sub(colLo, parseDec(P.cLo))), ulp12) < 0 &&
    cmp(Q.abs(sub(colHi, parseDec(P.cHi))), ulp12) < 0);
  /* the three exceptional literals vs the closed form both certifying programs derive —
     a single mistranscribed digit in EXACT_DELTAS ran to ALL PASS before this line */
  check('EXACT_DELTAS equal the index-2 closed form δ_hyp(l) − 1/(2^l l!) at l = 4, 12, 24',
    EXACT_DELTAS.every(([l, v]) => cmp(v, deltaIndex2(l)) === 0));
  check('conditional c* lies inside the unconditional certified bracket',
    cmp(E.cLo, CS.lo) <= 0 && cmp(CS.hi, E.cHi) <= 0);
  /* THE CHECK WITH TEETH. The bracket assertion above passes for the right value and for the
     wrong one alike — 0.8307 sits well inside [0.82911, 0.83323] either way — which is why a
     tail identity that was wrong by 8.6e-6 shipped under a green certificate. c* does not
     depend on the cutoff N, so two different cutoffs must produce INTERSECTING enclosures.
     The pre-2026-08-03 code returns disjoint intervals here and this check goes red. */
  const CS2 = conditionalCStar(200, 80);
  check('c* is cutoff-independent: N = 120 and N = 200 enclosures intersect',
    cmp(CS.lo, CS2.hi) <= 0 && cmp(CS2.lo, CS.hi) <= 0);
  /* and the hand-checkable anchor for the identity itself. At N = 0 the tail weight is the
     WHOLE sum Σ_{l≥1} 1/(2l(2l+1)), which telescopes (1/(2l) − 1/(2l+1)) to 1 − log 2 =
     0.30685…, NOT log 2 = 0.69315…. The bound is hardcoded on purpose: comparing against the
     kernel's own log2 enclosure would test the two against each other rather than against the
     mathematics, and the old code would have passed such a test. This is the cheapest check
     in the file and it alone rejects the pre-2026-08-03 identity. */
  const T0 = conditionalCStar(0, 80).tailWeight;
  check('tail identity anchor: T(0) = Σ_{l≥1} 1/(2l(2l+1)) ∈ [0.30685, 0.30686] (= 1 − log 2)',
    cmp(T0.lo, R(30685n, 100000n)) > 0 && cmp(T0.hi, R(30686n, 100000n)) < 0);

  /* Sensitivity of the conditional value, by INTERVAL CONTAINMENT — never by log10 of the
     move. If the tail assumption first fails at even d0, δ_{d0} ∈ [0,1] instead of the
     assumed sliver near δ_hyp ≈ δ∞: c falls by at most δ∞·w or rises by at most (1−δ∞)·w,
     w = 1/(d0(d0+1)), and the surviving digits of 1/(1+c*) are the longest common decimal
     prefix of the PERTURBED ENCLOSURE. A prose draft derived these counts from the move's
     magnitude alone and published seven digits at d0 = 1000; the true count is six — the
     value sits 1.04e-8 above the 0.5462293 boundary, closer than the move. Decimal
     boundaries do not care about magnitudes, so the counts are computed and asserted here
     and the prose transcribes them. */
  let fcS = 1n, ltS = ONE, sS = ZERO;                      /* δ∞ = 1 − e^{−1/2}, bracketed */
  for (let i = 0; i <= 40; i++) { if (i > 0) fcS *= BigInt(i);
    const t = R(1n, (2n ** BigInt(i)) * fcS); sS = (i % 2 === 0) ? add(sS, t) : sub(sS, t); ltS = t; }
  const dInfS = { lo: sub(ONE, add(sS, ltS)), hi: sub(ONE, sub(sS, ltS)) };
  const prefixDigits = (lo, hi) => { let k = 0;
    while (k < 33) { const sc = 10n ** BigInt(k + 1);
      if ((lo.n * sc) / lo.d !== (hi.n * sc) / hi.d) break; k++; } return k; };
  const surviving = (d0) => {
    const w = R(1n, BigInt(d0) * BigInt(d0 + 1));
    const cLo2 = sub(CS.lo, mul(dInfS.hi, w));            /* δ_{d0} drops all the way to 0 */
    const cHi2 = add(CS.hi, mul(sub(ONE, dInfS.lo), w));  /* δ_{d0} rises all the way to 1 */
    return prefixDigits(div(ONE, add(ONE, cHi2)), div(ONE, add(ONE, cLo2)));
  };
  const s122 = surviving(122), s500 = surviving(500), s1000 = surviving(1000);
  console.log('  sensitivity: digits of 1/(1+c*) surviving a first assumption failure at d0 = 122/500/1000 → '
    + s122 + '/' + s500 + '/' + s1000);
  check('sensitivity prefixes as published: 4 at d0 = 122, 5 at d0 = 500, 6 at d0 = 1000',
    s122 === 4 && s500 === 5 && s1000 === 6);

  /* The odd half of c — Σ_{d odd} 1/(d(d+1)) = log 2, ~83% of the constant — anchored on
     its OWN series, independently of the atanh machinery that encloses it. This was the
     one large component with no program behind it: every text asserts the identity, the
     kernel silently substitutes 2·atanh(1/3), and nothing tied the two together — the
     exact species of gap the retracted tail identity exploited on the even side.
       O(N) = Σ_{l≤N} 1/((2l−1)2l), remainder < Σ_{m≥2N+1} 1/(m(m+1)) = 1/(2N+1);
       T(N) = Σ_{l≤N} 1/(2l(2l+1)), remainder < 1/(4N);
       O + T = Σ_{d≥1} 1/(d(d+1)) = 1 EXACTLY — both telescope; checkable by hand. */
  const NODD = 2000;
  let Oser = ZERO, Tser = ZERO;
  for (let l = 1; l <= NODD; l++) {
    Oser = add(Oser, R(1n, BigInt(2 * l - 1) * BigInt(2 * l)));
    Tser = add(Tser, R(1n, BigInt(2 * l) * BigInt(2 * l + 1)));
  }
  const OserHi = add(Oser, R(1n, BigInt(2 * NODD + 1)));
  const TserHi = add(Tser, R(1n, 4n * BigInt(NODD)));
  check('odd-part anchor: the atanh log 2 enclosure sits inside the direct series bracket [O(2000), O(2000)+1/4001]',
    cmp(Oser, E.L.lo) <= 0 && cmp(E.L.hi, OserHi) <= 0);
  check('hand-checkable anchor: O + T encloses exactly 1 (Σ_{d≥1} 1/(d(d+1)) telescopes to 1)',
    cmp(add(Oser, Tser), ONE) < 0 && cmp(add(OserHi, TserHi), ONE) > 0);

  /* Section 2 — consistency with the paper's stated figures */
  check('paper Lemma 32: c > 0.82', cmp(E.cLo, R(82n, 100n)) > 0);
  check('paper Lemma 32: c < 0.85', cmp(E.cHi, R(85n, 100n)) < 0);
  check('paper: second sum ≈ 0.1281 (|Σ_even − 0.1281| < 2e-3)',
    cmp(Q.abs(sub(E.evenVerified, R(1281n, 10000n))), R(2n, 1000n)) < 0);
  check('paper Thm 8: bracket inside (0.54, 0.61)',
    cmp(E.liminfLo, R(54n, 100n)) > 0 && cmp(E.liminfHi, R(61n, 100n)) < 0);
  check('enclosure sane: c_lo < c_hi', cmp(E.cLo, E.cHi) < 0);

  /* Section 3 — independent irreducibility certificates, even d ≤ 60.
   * A single prime p with f_d irreducible mod p proves irreducibility over Q. */
  const noWitness = [];
  const witnesses = [];
  for (let d = 2; d <= 60; d += 2) {
    const p = irreducibilityWitness(d);
    witnesses.push(d + ':' + (p === null ? 'NONE' : p));
    if (p === null) noWitness.push(d);
  }
  console.log('  irreducibility witnesses (d:p) — ' + witnesses.join(' '));
  /* A mod-p witness exists only if Gal(f_d) contains a 2l-cycle. S_l^+ has one, the
   * paper's exceptional groups at d = 8, 24, 48 evidently do not — so the witness
   * search failing at EXACTLY {8,24,48} independently corroborates the paper's
   * exceptional set from a different computation (400 primes, Rabin over F_p),
   * while certifying irreducibility over Q for every other even d ≤ 60. */
  check('mod-p witness certifies irreducibility for even d ≤ 60 outside {8,24,48}, and the witnessless set is EXACTLY {8,24,48}',
    JSON.stringify(noWitness) === JSON.stringify([8, 24, 48]));

  /* Section 4 — falsifiers. Each planted mutation must make a check go red. */
  const M = enclosure({ mutateDelta: true });
  check('FALSIFIER X1 (δ ↦ 1−δ): paper-consistency must break',
    !(cmp(M.cLo, R(82n, 100n)) > 0 && cmp(M.cHi, R(85n, 100n)) < 0));
  /* X2 plants the RETRACTED tail identity — log 2 where 1 − log 2 belongs, the exact error
     that put a wrong constant on a live page — into the unconditional tail weight. Its
     previous form ("lazy partial must widen") tested the remainder bound the telescoping
     closed form retired. */
  const T = enclosure({ mutateTailIdentity: true });
  check('FALSIFIER X2 (tail telescoped to log 2 instead of 1 − log 2 — the identity that shipped wrong once): paper-consistency must break',
    !(cmp(T.cLo, R(82n, 100n)) > 0 && cmp(T.cHi, R(85n, 100n)) < 0));
  /* X3 exercises the machinery it names. Its previous form built a perturbed polynomial
     and never passed it to anything — patching irreducibleModP to `return true` left it
     green. Now the test must REJECT a reducible polynomial (x·f_6) at the very prime that
     certifies f_6, and must still accept f_6 there. */
  const p6 = irreducibilityWitness(6);
  check('FALSIFIER X3 (Rabin/DDF has teeth): x·f_6 is REJECTED at f_6\'s own witness prime, f_6 is accepted',
    p6 !== null &&
    irreducibleModP([0n].concat(fdCoeffs(6)), BigInt(p6)) === false &&
    irreducibleModP(fdCoeffs(6), BigInt(p6)) === true);

  console.log((Date.now() - t0) + ' ms · ' + (fails === 0
    ? 'ALL PASS — c and the Theorem-8 bracket are certified as printed; even-part conditional on the paper\'s Galois facts, irreducibility independently certified for even d ≤ 60.'
    : fails + ' CHECK(S) FAILED — nothing above may be quoted.'));
  process.exit(fails === 0 ? 0 : 1);
}

/* Exported so narrowing.js derives its conditional constant from THIS code path instead of
   hand-maintaining a third copy of the number, and so a referee can require() the pieces.
   The require.main guard keeps the import from running the full battery. */
module.exports = { enclosure, conditionalCStar, deltaHyperoct, deltaIndex2, EXACT_DELTAS, decimals };
if (require.main === module) main();
