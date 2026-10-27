/* graphon-k4-second.js — the SECOND implementation of the registry's C_89 (K4) Ramsey-multiplicity graphon density
   (J. SK, teorth/optimizationproblems #255, constants/89a.md, [SK2026]), written 2026-10-27 by an AI agent from the
   registry's definition and the data schema. No code shared with the claimant's evaluators (exact_eval.py, float_eval.py,
   refine.py: pinned as text, never run) or with the first implementation (instruments/optq/graphon_k4.c: C, every block,
   modular arithmetic + CRT). What differs here — the language, the decomposition, the arithmetic:

   decomposition: N(X) = sum over ORDERED block pairs (i,j) of X_ij g_X(i,j),
                  g_X(i,j) = sum_{k,l} u_k X_kl u_l,  u_k = X_ik X_jk     (the six pairs: ij | ik jk | il jl | kl),
                  and, given permutations s of the blocks that are VERIFIED HERE to preserve R exactly (R[s i][s j] = R[i][j]
                  for all i, j), g and X are constant on each orbit of the generated group on ordered pairs, so
                  N(X) = sum over pair orbits P of |P| X_P g_X(P), one g per orbit. Without permutations (or for one
                  block): f_X(i) = sum_j X_ij g_X(i,j) directly, and N = sum_{i<=j} (2 - [i=j]) X_ij g_X(i,j).
   arithmetic:    EXACT integers, no modulus: with u = 2^20 uh + ul (uh, ul < 2^20 + 1), the two inner sums
                  sum_l X_kl uh_l and sum_l X_kl ul_l are below m 2^40 <= 2^52 and so exact in doubles; the outer sum
                  over k and everything after it is BigInt.

   value = (N(R) + N(D - R)) / (m^4 D^6); requires D <= 2^20 and m <= 4096 (asserted).
   usage: node instruments/optq/graphon-k4-second.js --selftest        brute force over all m^4 tuples vs both decompositions
          require(...): { parseStepGraphon, verifyAutomorphisms, orbitsOf, valueByOrbits, valueDirect, fDirect, gExact,
                          decodeGraph6, bruteN, reduce, decimals }                                                     MIT */
'use strict';
const zlib = require('zlib');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

/* ---- input ------------------------------------------------------------------------------------------------------- */
function parseStepGraphon(buf) {
  const text = (buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf) : buf).toString('utf8');
  const d = JSON.parse(text);
  if (d.schema !== 'rational-step-graphon-v1') throw new Error('an unexpected schema');
  const D = d.edge_probability_denominator, rows = d.red_probability_numerators, m = rows.length;
  if (!Number.isSafeInteger(D) || D < 1 || D > 1048576) throw new Error('D must be an integer in [1, 2^20]');
  if (m > 4096) throw new Error('m > 4096 is not handled');
  if (!Array.isArray(d.block_weights) || d.block_weights.length !== m || !d.block_weights.every((w) => JSON.stringify(w) === JSON.stringify(d.block_weights[0]))) throw new Error('the blocks are not of equal measure');
  const R = new Int32Array(m * m);
  for (let i = 0; i < m; i++) { if (rows[i].length !== m) throw new Error('R is not square'); for (let j = 0; j < m; j++) { const v = rows[i][j]; if (!Number.isSafeInteger(v) || v < 0 || v > D) throw new Error('an entry is outside [0, D]'); R[i * m + j] = v; } }
  for (let i = 0; i < m; i++) for (let j = 0; j < i; j++) if (R[i * m + j] !== R[j * m + i]) throw new Error('R is not symmetric');
  return { m, D, R };
}
const colour = (G, blue) => { const X = new Float64Array(G.m * G.m); for (let t = 0; t < X.length; t++) X[t] = blue ? G.D - G.R[t] : G.R[t]; return X; };

/* ---- exact g(i,j) ------------------------------------------------------------------------------------------------ */
const TWO20 = 1048576, TWO20n = 1048576n;
function gExact(X, m, i, j, scratch) {
  const T = scratch.T, uh = scratch.uh, ul = scratch.ul, u = scratch.u;
  let n = 0;
  for (let k = 0; k < m; k++) { const a = X[i * m + k], b = X[j * m + k]; if (a !== 0 && b !== 0) { const p = a * b; T[n] = k; u[n] = p; const h = Math.floor(p / TWO20); uh[n] = h; ul[n] = p - h * TWO20; n++; } }
  let g = 0n;
  for (let s = 0; s < n; s++) {
    const row = T[s] * m; let Sh = 0, Sl = 0;
    for (let t = 0; t < n; t++) { const x = X[row + T[t]]; Sh += x * uh[t]; Sl += x * ul[t]; }
    if (Sh > 9007199254740991 || Sl > 9007199254740991) throw new Error('an inner sum left the exact range');
    g += BigInt(u[s]) * ((BigInt(Sh) << 20n) + BigInt(Sl));
  }
  return g;
}
const scratchFor = (m) => ({ T: new Int32Array(m), uh: new Float64Array(m), ul: new Float64Array(m), u: new Float64Array(m) });

/* ---- the group: verify, then orbits on blocks and on ordered pairs ----------------------------------------------- */
function verifyAutomorphisms(G, gens) {
  const { m, R } = G;
  gens.forEach((s, k) => {
    if (s.length !== m) throw new Error('generator ' + k + ' has the wrong length');
    const seen = new Uint8Array(m); for (const v of s) { if (!Number.isInteger(v) || v < 0 || v >= m || seen[v]) throw new Error('generator ' + k + ' is not a permutation'); seen[v] = 1; }
    for (let i = 0; i < m; i++) { const si = s[i] * m; for (let j = 0; j < m; j++) if (R[si + s[j]] !== R[i * m + j]) throw new Error('generator ' + k + ' does not preserve R at (' + i + ',' + j + ')'); }
  });
  return true;
}
function unionFind(n) {
  const p = new Int32Array(n); for (let x = 0; x < n; x++) p[x] = x;
  const find = (x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
  return { p, find, union: (a, b) => { a = find(a); b = find(b); if (a !== b) p[a] = b; } };
}
function orbitsOf(m, gens) {
  const B = unionFind(m); for (const s of gens) for (let i = 0; i < m; i++) B.union(i, s[i]);
  const P = unionFind(m * m); for (const s of gens) for (let i = 0; i < m; i++) { const si = s[i] * m, im = i * m; for (let j = 0; j < m; j++) P.union(im + j, si + s[j]); }
  const blockRoot = new Int32Array(m), blockSize = new Map();
  for (let i = 0; i < m; i++) { const r = B.find(i); blockRoot[i] = r; blockSize.set(r, (blockSize.get(r) || 0) + 1); }
  const pairRoot = new Int32Array(m * m), pairSize = new Map();
  for (let t = 0; t < m * m; t++) { const r = P.find(t); pairRoot[t] = r; pairSize.set(r, (pairSize.get(r) || 0) + 1); }
  return { blockRoot, blockSize, pairRoot, pairSize };
}

/* ---- N by pair orbits; f per block by pair orbits ----------------------------------------------------------------- */
/* g(i,j) = g(j,i) (u is symmetric in i, j and so is u^T X u), so the orbit of (j,i) takes the g of the orbit of (i,j):
   only the smaller of the two roots is evaluated. The evaluations are spread over worker threads that share X. */
async function valueByOrbits(G, gens, opts = {}) {
  const log = opts.log, workers = Math.max(1, opts.workers || 1);
  verifyAutomorphisms(G, gens);
  const { m, D } = G, O = orbitsOf(m, gens), out = { blockOrbits: O.blockSize.size, pairOrbits: O.pairSize.size };
  for (const blue of [false, true]) {
    const X = new Float64Array(new SharedArrayBuffer(m * m * 8)); for (let t = 0; t < m * m; t++) X[t] = blue ? D - G.R[t] : G.R[t];
    const todo = [];
    for (const root of O.pairSize.keys()) {
      if (X[root] === 0) continue;
      const i = Math.floor(root / m), j = root - i * m, rT = O.pairRoot[j * m + i];
      if (root <= rT) todo.push(root);
    }
    const gOf = new Map(); let done = 0;
    const chunks = Array.from({ length: workers }, (_, w) => todo.filter((_, k) => k % workers === w));
    await Promise.all(chunks.map((roots) => new Promise((resolve, reject) => {
      const wk = new Worker(__filename, { workerData: { job: 'graphon-k4-g', m, X, roots: Int32Array.from(roots) } });
      wk.on('message', (msg) => {
        if (msg.progress) { done += msg.progress; if (log) log((blue ? 'blue' : 'red') + ': ' + done + ' of ' + todo.length + ' pair orbits'); return; }
        msg.g.forEach((gs, k) => gOf.set(roots[k], BigInt(gs))); resolve();
      });
      wk.on('error', reject); wk.on('exit', (c) => { if (c !== 0) reject(new Error('a worker exited with ' + c)); });
    })));
    for (const root of O.pairSize.keys()) {                           // the transposed orbits take their partner's g
      if (X[root] === 0 || gOf.has(root)) continue;
      const i = Math.floor(root / m), j = root - i * m, rT = O.pairRoot[j * m + i];
      if (!gOf.has(rT)) throw new Error('an orbit without its transpose');
      gOf.set(root, gOf.get(rT));
    }
    let N = 0n;
    for (const [root, size] of O.pairSize) { const x = X[root]; if (x !== 0) N += BigInt(size) * BigInt(x) * gOf.get(root); }
    /* the same N again as sum over block orbits of |O| f(rep), with f(rep) = sum_j X_rep,j g(orbit(rep, j)) */
    const fRep = new Map(); let N2 = 0n;
    for (const [root, size] of O.blockSize) {
      let f = 0n; for (let j = 0; j < m; j++) { const x = X[root * m + j]; if (x !== 0) f += BigInt(x) * gOf.get(O.pairRoot[root * m + j]); }
      fRep.set(root, f); N2 += BigInt(size) * f;
    }
    if (N2 !== N) throw new Error('the pair-orbit sum and the block-orbit sum differ');
    out[blue ? 'blue' : 'red'] = { N, evaluated: todo.length, fOfBlock: (i) => fRep.get(O.blockRoot[i]) };
    if (log) log((blue ? 'blue' : 'red') + ': ' + todo.length + ' pair orbits evaluated');
  }
  const r = reduce(out.red.N + out.blue.N, BigInt(m) ** 4n * BigInt(D) ** 6n);
  return Object.assign(out, { Nred: out.red.N, Nblue: out.blue.N, num: r.num, den: r.den });
}
function fDirect(G, i, blue) {
  const { m } = G, X = colour(G, blue), sc = scratchFor(m); let f = 0n;
  for (let j = 0; j < m; j++) { const x = X[i * m + j]; if (x !== 0) f += BigInt(x) * gExact(X, m, i, j, sc); }
  return f;
}
function valueDirect(G) {                    // no symmetry: sum over i <= j of (2 - [i=j]) X_ij g(i,j)
  const { m, D } = G, sc = scratchFor(m), N = {};
  for (const blue of [false, true]) {
    const X = colour(G, blue); let t = 0n;
    for (let i = 0; i < m; i++) for (let j = i; j < m; j++) { const x = X[i * m + j]; if (x !== 0) t += BigInt(i === j ? x : 2 * x) * gExact(X, m, i, j, sc); }
    N[blue ? 'blue' : 'red'] = t;
  }
  const r = reduce(N.red + N.blue, BigInt(m) ** 4n * BigInt(D) ** 6n);
  return { Nred: N.red, Nblue: N.blue, num: r.num, den: r.den };
}

/* ---- the oracle: every ordered 4-tuple, BigInt ---------------------------------------------------------------- */
function bruteN(G, blue) {
  const { m } = G, X = colour(G, blue), B = Array.from(X, (v) => BigInt(v)); let t = 0n;
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) for (let k = 0; k < m; k++) for (let l = 0; l < m; l++)
    t += B[i * m + j] * B[i * m + k] * B[i * m + l] * B[j * m + k] * B[j * m + l] * B[k * m + l];
  return t;
}

/* ---- arithmetic, graph6 ------------------------------------------------------------------------------------------ */
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const reduce = (num, den) => { const g = gcd(num, den); return { num: num / g, den: den / g }; };
function decimals(num, den, places, mode) {   // floor (mode 'down') or ceiling ('up') of num/den at `places` decimals, as text
  const q = 10n ** BigInt(places); let v = (num * q) / den; if (mode === 'up' && v * den !== num * q) v += 1n;
  const s = v.toString().padStart(places + 1, '0'); return s.slice(0, -places) + '.' + s.slice(-places);
}
function decodeGraph6(text) {                 // McKay's graph6: N(n) then the upper triangle column by column, 6 bits a byte
  let s = text.split('\n')[0].trim(); if (s.startsWith('>>graph6<<')) s = s.slice(10);
  const b = Array.from(s, (c) => c.charCodeAt(0) - 63);
  let n, pos;
  if (b[0] < 63) { n = b[0]; pos = 1; } else if (b[1] < 63) { n = (b[1] << 12) | (b[2] << 6) | b[3]; pos = 4; } else throw new Error('graph6: n >= 258048 not handled');
  const A = new Int32Array(n * n); let bit = 0;
  for (let j = 1; j < n; j++) for (let i = 0; i < j; i++) { const v = (b[pos + Math.floor(bit / 6)] >> (5 - (bit % 6))) & 1; bit++; A[i * n + j] = v; A[j * n + i] = v; }
  if (pos + Math.ceil(bit / 6) !== b.length) throw new Error('graph6: the length does not match n');
  return { m: n, D: 1, R: A };
}

if (!isMainThread && workerData && workerData.job === 'graphon-k4-g') {
  const { m, X, roots } = workerData, sc = scratchFor(m), g = []; let since = 0;
  for (const root of roots) { const i = Math.floor(root / m), j = root - i * m; g.push(gExact(X, m, i, j, sc).toString()); if (++since === 2000) { parentPort.postMessage({ progress: since }); since = 0; } }
  parentPort.postMessage({ g });
}

module.exports = { parseStepGraphon, verifyAutomorphisms, orbitsOf, valueByOrbits, valueDirect, fDirect, gExact, decodeGraph6, bruteN, reduce, decimals };

if (require.main === module && process.argv.includes('--selftest')) (async () => {
  let seed = 8989; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
  let ok = true;
  for (let trial = 0; trial < 8; trial++) {
    const m = 3 + (trial % 4) * 2, D = trial < 4 ? 5 : 1048576, R = new Int32Array(m * m);
    for (let i = 0; i < m; i++) for (let j = i; j < m; j++) { const c = rnd() % 4, v = c === 0 ? 0 : c === 1 ? D : rnd() % (D + 1); R[i * m + j] = v; R[j * m + i] = v; }
    const G = { m, D, R }, d = valueDirect(G);
    const br = bruteN(G, false), bb = bruteN(G, true);
    let fsum = 0n; for (let i = 0; i < m; i++) fsum += fDirect(G, i, false);
    if (d.Nred !== br || d.Nblue !== bb || fsum !== br) { ok = false; console.log('SELFTEST FAILED: trial ' + trial); }
  }
  /* a step graphon with a known symmetry: the cyclic shift on a circulant matrix; the orbit sum must equal the brute force */
  { const m = 9, D = 1048576, base = [0, 1048576, 77, 1048576, 0, 0, 1048576, 77, 1048576], R = new Int32Array(m * m);
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) R[i * m + j] = base[(j - i + m) % m];
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (R[i * m + j] !== R[j * m + i]) { ok = false; }
    const G = { m, D, R }, shift = Array.from({ length: m }, (_, i) => (i + 1) % m), refl = Array.from({ length: m }, (_, i) => (m - i) % m);
    const v = await valueByOrbits(G, [shift, refl], { workers: 2 });
    if (v.Nred !== bruteN(G, false) || v.Nblue !== bruteN(G, true)) { ok = false; console.log('SELFTEST FAILED: the orbit sum'); }
    let threw = false; try { verifyAutomorphisms(G, [Array.from({ length: m }, (_, i) => (i === 0 ? 1 : i === 1 ? 0 : i))]); } catch (e) { threw = true; }
    if (!threw) { ok = false; console.log('SELFTEST FAILED: a non-automorphism was accepted'); } }
  const half = valueDirect({ m: 5, D: 2, R: new Int32Array(25).fill(1) });
  const halfOk = half.num * 32n === half.den;
  console.log('graphon-k4-second selftest: ' + (ok && halfOk ? 'brute force over all ordered 4-tuples = the pair decomposition = the per-block sum on 8 random step graphons; = the orbit sum on a circulant (shift + reflection); a transposition that is not an automorphism refused; W = 1/2 gives 2^-5' : 'FAILED'));
  process.exit(ok && halfOk ? 0 : 1);
})();
