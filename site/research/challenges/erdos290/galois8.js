/* galois8.js — certify δ(f₈) for the erdos290 enclosure, WITHOUT identifying Gal(f₈).
 *
 * Method (every step exact / certificate-grade):
 *  1. f₈ integer coefficients; disc(f₈) exact via Sylvester resultant (Bareiss, BigInt).
 *  2. For primes p ∤ disc: distinct-degree factorization of f₈ over F_p. By Dedekind,
 *     the degree pattern IS the cycle type of a Frobenius element of G = Gal(f₈) acting
 *     on the 8 roots. Each observed pattern is a CERTIFICATE that G contains an element
 *     of that cycle type. (For p | disc we simply skip — no claim.)
 *  3. Irreducibility of f₈ over Q certified from the patterns alone: a rational factor of
 *     degree k forces every mod-p pattern to contain a sub-multiset summing to k; if the
 *     only k in 1..7 consistent with ALL patterns is none, f₈ is irreducible.
 *  4. G ⊆ S₄⁺ (hyperoctahedral, order 384) by the paper's Lemma 39 — the roots pair as
 *     {4 ± y_i} since f₈(x+4) is even. We build S₄⁺ ≤ S₈ explicitly, enumerate ALL of
 *     its subgroups by closure, and keep candidates that are (a) transitive [step 3],
 *     (b) contain an element of every observed cycle type [step 2], (c) lie in A₈ iff
 *     disc is a perfect square [exact BigInt sqrt].
 *  5. δ(f₈) = (non-derangement proportion of G). If every candidate subgroup has the SAME
 *     proportion, δ(f₈) is CERTIFIED as that value; otherwise we report the exact interval
 *     spanned by the candidates — still a certified improvement over [tiny, 1].
 *
 * Falsifiers at the bottom; each must go red under its planted mutation.
 */
'use strict';

/* ---------- f_d coefficients (ascending BigInt), same as kernel.js ---------- */
function fdCoeffs(d) {
  let P = [1n];
  for (let j = 0; j <= d; j++) {
    const nx = new Array(P.length + 1).fill(0n);
    for (let k = 0; k < P.length; k++) { nx[k + 1] += P[k]; nx[k] -= BigInt(j) * P[k]; }
    P = nx;
  }
  const f = new Array(d + 1).fill(0n);
  for (let i = 0; i <= d; i++) {
    const q = new Array(d + 1).fill(0n);
    let carry = 0n;
    for (let k = d + 1; k >= 1; k--) { carry = P[k] + BigInt(i) * carry; q[k - 1] = carry; }
    for (let k = 0; k <= d; k++) f[k] += q[k];
  }
  return f;
}

/* ---------- exact discriminant via Sylvester matrix + Bareiss ---------- */
function discriminant(f) {
  const n = f.length - 1;
  const fp = []; for (let i = 1; i <= n; i++) fp.push(BigInt(i) * f[i]); /* f' ascending */
  const m = n + (n - 1);
  const S = Array.from({ length: m }, () => new Array(m).fill(0n));
  for (let r = 0; r < n - 1; r++) for (let k = 0; k <= n; k++) S[r][r + (n - k)] = f[k];
  for (let r = 0; r < n; r++) for (let k = 0; k <= n - 1; k++) S[n - 1 + r][r + (n - 1 - k)] = fp[k];
  /* Bareiss fraction-free elimination → determinant */
  let prev = 1n, sign = 1n;
  for (let k = 0; k < m - 1; k++) {
    if (S[k][k] === 0n) {
      let sw = -1;
      for (let r = k + 1; r < m; r++) if (S[r][k] !== 0n) { sw = r; break; }
      if (sw === -1) return 0n;
      const t = S[k]; S[k] = S[sw]; S[sw] = t; sign = -sign;
    }
    for (let i = k + 1; i < m; i++) {
      for (let j = k + 1; j < m; j++)
        S[i][j] = (S[i][j] * S[k][k] - S[i][k] * S[k][j]) / prev;
      S[i][k] = 0n;
    }
    prev = S[k][k];
  }
  const res = sign * S[m - 1][m - 1];
  /* disc = (-1)^{n(n-1)/2} Res(f, f') / lc(f) */
  const s = (n * (n - 1) / 2) % 2 === 0 ? 1n : -1n;
  return s * res / f[n];
}
function isPerfectSquare(v) {
  if (v < 0n) return false;
  if (v === 0n) return true;
  let x = 1n << BigInt(Math.ceil(v.toString(2).length / 2)); /* initial guess ≥ sqrt */
  let prev = 0n;
  while (x !== prev) { prev = x; x = (x + v / x) >> 1n; }
  while (x * x > v) x -= 1n;
  return x * x === v;
}

/* ---------- F_p polynomial helpers (dense ascending BigInt) ---------- */
function pmod(a, p) { const r = a % p; return r < 0n ? r + p : r; }
function pinv(x, p) { let r = 1n, e = p - 2n, b = pmod(x, p);
  while (e > 0n) { if (e & 1n) r = r * b % p; b = b * b % p; e >>= 1n; } return r; }
const pdeg = (u) => { let d = u.length - 1; while (d > 0 && u[d] === 0n) d--; return (d === 0 && u[0] === 0n) ? -1 : d; };
function ptrim(u) { const d = pdeg(u); return d < 0 ? [0n] : u.slice(0, d + 1); }
function pmul(a, b, p) { const out = new Array(a.length + b.length - 1).fill(0n);
  for (let i = 0; i < a.length; i++) { if (a[i] === 0n) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] + a[i] * b[j]) % p; }
  return ptrim(out); }
function pdivmod(a, b, p) {
  a = a.slice(); const db = pdeg(b), lb = pinv(b[db], p);
  let da = pdeg(a);
  const q = new Array(Math.max(0, da - db + 1)).fill(0n);
  while (da >= db && da >= 0) {
    const c = a[da] * lb % p; q[da - db] = c;
    for (let j = 0; j <= db; j++) a[da - db + j] = pmod(a[da - db + j] - c * b[j], p);
    da = pdeg(a);
  }
  return { q: ptrim(q), r: ptrim(a) };
}
function pgcd(a, b, p) { a = ptrim(a); b = ptrim(b);
  while (pdeg(b) >= 0) { const r = pdivmod(a, b, p).r; a = b; b = r; }
  const d = pdeg(a); if (d < 0) return [0n];
  const l = pinv(a[d], p); return a.map(c => c * l % p); }
function ppowXmod(e, f, p) { let base = [0n, 1n], acc = [1n];
  while (e > 0n) { if (e & 1n) acc = pdivmod(pmul(acc, base, p), f, p).r;
    base = pdivmod(pmul(base, base, p), f, p).r; e >>= 1n; }
  return acc; }

/* Dedekind cycle type: distinct-degree factorization degree pattern of monic f mod p.
 * Requires f squarefree mod p (guaranteed by p ∤ disc). Returns sorted degree multiset. */
function cycleTypeModP(coeffs, p) {
  const n = coeffs.length - 1, l = pinv(coeffs[n], p);
  let f = coeffs.map(c => pmod(c, p) * l % p);
  const type = [];
  let i = 0, xq = [0n, 1n]; /* x^{p^i} mod f, maintained by repeated p-powering */
  while (pdeg(f) > 0) {
    i += 1;
    xq = ppowXmod(p, f, p) && null; /* recompute cleanly below (f shrinks) */
    /* recompute x^{p^i} mod current f from scratch: exponent p^i */
    let e = 1n; for (let k = 0; k < i; k++) e *= p;
    const xpi = ppowXmod(e, f, p);
    const g = xpi.slice(); while (g.length < 2) g.push(0n); g[1] = pmod(g[1] - 1n, p);
    const d = pgcd(g, f, p);
    const dd = pdeg(d);
    if (dd > 0) { for (let k = 0; k < dd / i; k++) type.push(i); f = pdivmod(f, d, p).q; }
    if (i > pdeg(f)) { if (pdeg(f) > 0) type.push(pdeg(f)); break; }
  }
  return type.sort((a, b) => a - b);
}

/* ---------- irreducibility over Q from patterns (subset-sum exclusion) ---------- */
function possibleFactorDegrees(patterns) {
  /* degrees k ∈ 1..7 such that EVERY pattern has a sub-multiset summing to k */
  let possible = new Set([1, 2, 3, 4, 5, 6, 7]);
  for (const t of patterns) {
    const sums = new Set([0]);
    for (const part of t) for (const s of [...sums]) sums.add(s + part);
    possible = new Set([...possible].filter(k => sums.has(k)));
  }
  return [...possible].sort((a, b) => a - b);
}

/* ---------- S₄⁺ as an explicit subgroup of S₈, and ALL its subgroups ---------- */
/* points 0..7: pair i is {i, i+4}, i = 0..3 (root pair 4 ± y_i). */
function buildHyperoctahedral() {
  const id = [0, 1, 2, 3, 4, 5, 6, 7];
  const compose = (a, b) => id.map((_, x) => a[b[x]]);       /* (a∘b)(x) = a(b(x)) */
  const gens = [];
  /* 4-cycle on pairs */
  gens.push([1, 2, 3, 0, 5, 6, 7, 4]);
  /* transposition of pairs 0,1 */
  gens.push([1, 0, 2, 3, 5, 4, 6, 7]);
  /* sign flip on pair 0 */
  gens.push([4, 1, 2, 3, 0, 5, 6, 7]);
  const seen = new Map(); const elems = [];
  const key = (g) => g.join(',');
  const queue = [id]; seen.set(key(id), 0); elems.push(id);
  while (queue.length) {
    const g = queue.pop();
    for (const h of gens) {
      const gh = compose(g, h);
      const k = key(gh);
      if (!seen.has(k)) { seen.set(k, elems.length); elems.push(gh); queue.push(gh); }
    }
  }
  /* multiplication table + cycle data */
  const N = elems.length;
  const idx = (g) => seen.get(key(g));
  const mul = new Array(N);
  for (let a = 0; a < N; a++) { mul[a] = new Int16Array(N);
    for (let b = 0; b < N; b++) mul[a][b] = idx(compose(elems[a], elems[b])); }
  const cycleType = elems.map(g => {
    const vis = new Array(8).fill(false), t = [];
    for (let s = 0; s < 8; s++) { if (vis[s]) continue; let len = 0, x = s;
      while (!vis[x]) { vis[x] = true; x = g[x]; len++; } t.push(len); }
    return t.sort((a, b) => a - b).join('+');
  });
  const isDerangement = elems.map(g => g.every((v, i) => v !== i));
  const isEven = elems.map(g => { /* parity via cycle count */
    const vis = new Array(8).fill(false); let c = 0;
    for (let s = 0; s < 8; s++) { if (vis[s]) continue; let x = s;
      while (!vis[x]) { vis[x] = true; x = g[x]; } c++; }
    return (8 - c) % 2 === 0;
  });
  return { elems, mul, cycleType, isDerangement, isEven, N };
}

function allSubgroups(G) {
  /* progressive closure: every subgroup arises as ⟨H, g⟩ from a smaller one */
  const closure = (seed) => {
    const inSet = new Uint8Array(G.N); const list = [];
    const push = (e) => { if (!inSet[e]) { inSet[e] = 1; list.push(e); } };
    push(0); /* identity is index of id? ensure: elems[?]. find id index */
    for (const s of seed) push(s);
    for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      push(G.mul[list[i]][list[j]]);
      if (list.length > 384) break;
    }
    return list.sort((a, b) => a - b);
  };
  /* identity index: elems order-1 element */
  const found = new Map();
  const sig = (l) => l.join(',');
  const queue = [];
  for (let g = 0; g < G.N; g++) {
    const H = closure([g]); const s = sig(H);
    if (!found.has(s)) { found.set(s, H); queue.push(H); }
  }
  while (queue.length) {
    const H = queue.pop();
    if (H.length === G.N) continue;
    const inH = new Uint8Array(G.N); for (const e of H) inH[e] = 1;
    for (let g = 0; g < G.N; g++) {
      if (inH[g]) continue;
      const K = closure(H.concat([g])); const s = sig(K);
      if (!found.has(s)) { found.set(s, K); queue.push(K); }
    }
  }
  return [...found.values()];
}

const transitive = (G, H) => {
  /* orbit of point 0 under H must be all 8 points */
  const orb = new Set([0]); let grew = true;
  while (grew) { grew = false;
    for (const e of H) for (const x of [...orb]) { const y = G.elems[e][x];
      if (!orb.has(y)) { orb.add(y); grew = true; } } }
  return orb.size === 8;
};

/* ---------- main ---------- */
function main() {
  const t0 = Date.now();
  let fails = 0;
  const check = (name, ok) => { console.log((ok ? '  ok   ' : '  FAIL ') + name); if (!ok) fails++; };

  const f8 = fdCoeffs(8);
  console.log('f8 coeffs (ascending): ' + f8.join(', '));
  const disc = discriminant(f8);
  console.log('disc(f8) = ' + disc.toString());
  /* This fact anchors the entire upper-containment argument G ⊆ A_8. It was printed but
     never asserted until 2026-08-03 — a value the prose quotes must be a check, not a log. */
  check('disc(f8) is a positive perfect square (⇒ G ⊆ A_8)', disc > 0n && isPerfectSquare(disc));

  /* observed Frobenius cycle types over the first K good primes */
  const PRIMES = (() => { const ps = []; for (let n = 2; ps.length < 2000; n++) { let ok = true;
    for (const q of ps) { if (q * q > n) break; if (n % q === 0) { ok = false; break; } } if (ok) ps.push(n); } return ps; })();
  const observed = new Map(); let skipped = 0;
  for (const pp of PRIMES) {
    const p = BigInt(pp);
    if (pmod(disc, p) === 0n || pmod(f8[8], p) === 0n) { skipped++; continue; }
    const t = cycleTypeModP(f8, p).join('+');
    observed.set(t, (observed.get(t) || 0) + 1);
  }
  const total = [...observed.values()].reduce((a, b) => a + b, 0);
  console.log('observed cycle types over ' + total + ' good primes (skipped ' + skipped + '):');
  const obsSorted = [...observed.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t, c] of obsSorted) console.log('   ' + t.padEnd(16) + (c / total).toFixed(4) + '  (' + c + ')');

  /* irreducibility certificate over Q */
  const patterns = [...observed.keys()].map(s => s.split('+').map(Number));
  const possible = possibleFactorDegrees(patterns);
  check('irreducible over Q: no proper factor degree consistent with all patterns (found: [' + possible.join(',') + '])',
    possible.length === 0);

  /* group side */
  const G = buildHyperoctahedral();
  check('S4+ built: |G| = 384', G.N === 384);

  /* The Lemma-40 numbers and the (±) step, against the ENUMERATED group. Both drive the
     whole enclosure (the 0.1281 even block, all 30 tail values, the upper containment) and
     both were prose-only until 2026-08-03. Here they cost milliseconds:
     — non-derangement count of S_4^+ is 151 of 384 (the Lemma 40 closed form at l = 4);
     — sign-weight parity equals permutation parity ELEMENT BY ELEMENT (a signed
       permutation is even on the 2l points iff its flip-count is even), so
       A_8 ∩ S_4^+ = E, |E| = 192, with 75 non-derangements — δ(f_8)'s numerator. */
  const weight = (g) => { let w = 0; for (let i = 0; i < 4; i++) if (g[i] >= 4) w++; return w; };
  check('Lemma 40 at l=4, enumerated: S4+ has exactly 151 non-derangements of 384',
    G.elems.filter((g, e) => !G.isDerangement[e]).length === 151);
  check('(±) step, element-wise: permutation parity = sign-weight parity for ALL 384 elements',
    G.elems.every((g, e) => G.isEven[e] === (weight(g) % 2 === 0)));
  const evenIdx = G.elems.map((g, e) => e).filter(e => G.isEven[e]);
  check('A_8 ∩ S4+ = E has order 192 with exactly 75 non-derangements (δ = 75/192 = 25/64)',
    evenIdx.length === 192 && evenIdx.filter(e => !G.isDerangement[e]).length === 75);

  console.log('  enumerating all subgroups of S4+ …');
  const subs = allSubgroups(G);
  console.log('  subgroups found: ' + subs.length);
  /* 1659 is quoted in the write-up and the posts; a quoted number is an assertion */
  check('S4+ has exactly 1659 subgroups', subs.length === 1659);

  const obsTypes = new Set(observed.keys());
  const candidateFilter = (typeSet, discVal) => subs.filter(H => {
    if (!transitive(G, H)) return false;
    const types = new Set(H.map(e => G.cycleType[e]));
    for (const t of typeSet) if (!types.has(t)) return false;
    if (discVal > 0n && isPerfectSquare(discVal)) { if (!H.every(e => G.isEven[e])) return false; }
    else { if (H.every(e => G.isEven[e])) return false; }
    return true;
  });
  const candidates = candidateFilter(obsTypes, disc);
  console.log('  candidate groups (transitive, contain all observed types, parity-consistent): ' + candidates.length);
  const deltas = new Set(candidates.map(H => {
    const nonDer = H.filter(e => !G.isDerangement[e]).length;
    return nonDer + '/' + H.length;
  }));
  const deltaList = [...deltas].map(s => { const [a, b] = s.split('/').map(Number); return { s, v: a / b }; })
    .sort((x, y) => x.v - y.v);
  console.log('  candidate |H| values: ' + [...new Set(candidates.map(H => H.length))].sort((a, b) => a - b).join(', '));
  console.log('  candidate δ values:   ' + deltaList.map(d => d.s + ' = ' + d.v.toFixed(6)).join(' · '));
  let obsNonDer = 0; for (const [t, c] of observed) if (t.split('+').includes('1')) obsNonDer += c;
  const obsFreq = obsNonDer / total;
  /* the empirical frequency is displayed WITH its uncertainty, and the certified value must
     sit inside the 3σ band — an unexplained 0.3691 beside a certified 0.3906 invites exactly
     the doubt this file exists to close (Chebotarev convergence over ~2000 primes is slow) */
  const sigma = Math.sqrt(0.390625 * (1 - 0.390625) / total);
  console.log('  empirical non-derangement frequency: ' + obsFreq.toFixed(4) +
    ' ± ' + sigma.toFixed(4) + ' (1σ binomial; display, not evidence)');

  check('at least one candidate group exists', candidates.length > 0);
  check('δ(f8) pinned: all candidates share one non-derangement proportion', deltas.size === 1);
  /* the VALUE, not merely the agreement — a planted off-by-one in the numerator printed
     "CERTIFIED δ(f8) = 76/192 … ALL PASS" until this line existed (2026-08-03) */
  check('δ(f8) = 75/192 = 25/64, the published value exactly',
    deltas.size === 1 && deltaList[0].s === '75/192');
  check('certified value lies inside the empirical 3σ band',
    Math.abs(obsFreq - 0.390625) <= 3 * sigma);
  if (deltas.size === 1) {
    console.log('  ==> CERTIFIED  δ(f8) = ' + deltaList[0].s + ' = ' + deltaList[0].v);
  } else {
    console.log('  ==> NOT PINNED — certified interval [' + deltaList[0].s + ', ' + deltaList[deltaList.length - 1].s + ']');
  }

  /* falsifiers */
  const fake = new Set(obsTypes); fake.add('8');   /* an 8-cycle would force G = big; S4+ has 8-cycles?
     A full 8-cycle IS in S4+ (negative 4-cycle). Adding it as "observed" must change the candidate set
     or kill it — assert the candidate count strictly drops or δ changes. */
  const candFake = candidateFilter(fake, disc);
  check('FALSIFIER X1 (planted 8-cycle observation): candidate set must strictly shrink',
    candFake.length < candidates.length);
  /* X2 re-runs the ACTUAL parity gate on the mutated discriminant. Its previous form
     asserted isPerfectSquare(disc) !== isPerfectSquare(disc+1) — true for every positive
     square (n and n+1 are never both squares above 1), so it could not go red and never
     exercised the candidate filter. A falsifier that cannot fail is not a falsifier. */
  const sig = (H) => H.join(',');
  const candBad = candidateFilter(obsTypes, disc + 1n);
  check('FALSIFIER X2 (disc+1, a nonsquare, fed to the parity gate): the surviving set must change',
    JSON.stringify(candBad.map(sig).sort()) !== JSON.stringify(candidates.map(sig).sort()));
  const t97 = cycleTypeModP(f8, 97n);
  const mut2 = f8.slice(); mut2[0] += 1n;
  const t97m = cycleTypeModP(mut2, 97n);
  check('FALSIFIER X3 (perturbed polynomial changes some cycle type mod 97 — DDF has teeth)',
    t97.join('+') !== t97m.join('+') || cycleTypeModP(f8, 101n).join('+') !== cycleTypeModP(mut2, 101n).join('+'));

  console.log((Date.now() - t0) + ' ms · ' + (fails === 0 ? 'ALL PASS' : fails + ' CHECK(S) FAILED'));
  process.exit(fails === 0 ? 0 : 1);
}

/* The Bareiss/Sylvester discriminant is exported so theorem.js can cross-check it against
   galois-exceptions.js's CRT/Hadamard discExact — two implementations sharing no code, one
   answer. The require.main guard exists for exactly that import: requiring this file must
   not spend two minutes enumerating subgroups. */
module.exports = { fdCoeffs, discriminant, isPerfectSquare, buildHyperoctahedral };
if (require.main === module) main();
