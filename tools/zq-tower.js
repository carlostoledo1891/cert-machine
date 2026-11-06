#!/usr/bin/env node
/* zq-tower.js — Track A lane 2 on the claim "Z is Diophantine in Q" (Glazer et al., 2026-11-05): the tower bounds
   deg P_* < 2↑↑7 and |coefficient| < 2↑↑8, decided by exact integer comparison from the pinned fixed constants.
   Writes certs/zq-tower.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. This tool decides the arithmetic chain from named premises to the two towers;
   it does not decide the premises, and it decides nothing about the zero set.

   THE CLAIM (diophantine_zq.tex @ cb1148cd, prop:cutoff lines 6283-6296 and lines 6428-6438): R = D,
   T = (96·10^13)^13·D^(2210·G0²·D³) < 2^(2^(2^9013)), deg P_* ≤ (T+1)^2048 < 2↑↑7, |c| ≤ 2^((T+1)^2048) < 2↑↑8,
   with B = T+1 (ordinary-integer-polynomial-size-bounds.json: degree_bound "B^2048", simplified_B "T+1").

   METHOD. The fixedConstants are READ from the pinned definition JSON and evaluated by a generic interpreter of
   their expression language that carries, for every constant, an exact BigInt when it is small and otherwise
   outward-rounded integer bounds on log2 x and on log2 log2 x (bit lengths; log2 of a small base from the bit
   length of base^(2^20)). Every comparison below is then a comparison of integers. The three quantities the
   artifact never evaluates — the prime catalogue's maximum and product and the least formal multiple — enter ONLY
   through the named premises H1 and H2; without them the tower is undetermined and the record says so.

   PREMISES (named, never decided here): H1 the explicit primes-in-progressions estimate of Bennett, Martin,
   O'Bryant and Rechnitzer [bmor Thm 1.2, (1.10)-(1.11), Cor. 6.17, A = 1] as the manuscript applies it at
   X = 2^(W³): |ϑ(X;W,a) − X/φ(W)| ≤ X/(160·ln X) for every unit class a mod W; H2 M_0 ≤ N_s^10 (the formal-group
   and Hasse-bound argument, Silverman VII.2.1 and V.1.1); M the B^(8h) degree and log-norm majorant lemma (TeX
   lines 6398-6430); L1 the root height 256, CERTIFIED in certs/zq-recount.json.

   usage: node tools/zq-tower.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const OUT = path.join(ROOT, 'certs', 'zq-tower.json');
const L1 = path.join(ROOT, 'certs', 'zq-recount.json');
const die = (m) => { console.error('zq-tower: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q', commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
  definition: { path: 'construction/ordinary-integer-definition.json', sha256: '4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6' },
  bounds: { path: 'construction/ordinary-integer-polynomial-size-bounds.json', sha256: 'dfef3ff3da641814edf62f9992cb7a27aa0a770deccc95b084a65751289dbd9e' },
  tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its proof is `sorry`) and nothing in this record decides it. This record decides the exact arithmetic from the named premises H1, H2, M and L1 to the two stated tower bounds; it does not decide the premises.';
const readPinned = (rel, want) => { const p = path.join(REPO, rel); if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing'); const b = fs.readFileSync(p); if (sha(b) !== want) die(rel + ' is not the pinned bytes; REFUSED, nothing computed'); return b; };

/* ---- integer helpers ---- */
const BL = (x) => (x <= 0n ? 0n : BigInt(x.toString(2).length));        /* bit length: 2^(BL-1) ≤ x < 2^BL */
const maxB = (...xs) => xs.reduce((a, b) => (a === null || b === null ? null : a > b ? a : b));
const maxLo = (...xs) => xs.reduce((a, b) => (a === null ? b : b === null ? a : a > b ? a : b));
const ceilDiv = (a, b) => (a + b - 1n) / b;
const SMALL = 1n << 20n;                                                  /* keep exact values below 2^(2^20) */
const L1CAP = 1n << 17n;                                                  /* keep log2 bounds below 2^(2^17) */
const N_REF = 1n << 20n;
const refined = new Map();
/* log2 a ∈ [lo/N, hi/N] from the bit length of a^N, N = 2^20 */
const log2Of = (a) => { const k = a.toString(); if (!refined.has(k)) { const b = BL(a ** N_REF); refined.set(k, [b - 1n, b]); } return refined.get(k); };

/* a value: ex (exact BigInt or null), l1 = [lo, hi] bounds on log2 x (hi null = unbounded), l2 = same on log2 log2 x
   (lo null = no useful lower bound). All values here are ≥ 1. */
const l2From = (l1) => (l1 ? [l1[0] >= 1n ? BL(l1[0]) - 1n : null, l1[1] === null ? null : l1[1] >= 1n ? BL(l1[1]) : 0n] : [null, null]);
const meet = (a, b) => [maxLo(a[0], b[0]), a[1] === null ? b[1] : b[1] === null ? a[1] : a[1] < b[1] ? a[1] : b[1]];
const cap = (v) => { if (v.l1 && ((v.l1[1] !== null && BL(v.l1[1]) > L1CAP) || BL(v.l1[0]) > L1CAP)) v.l1 = null; return v; };
const exact = (e) => { if (e < 1n) throw new Error('exact value below 1 in a log context: ' + e); const l1 = [BL(e) - 1n, BL(e)]; return { ex: e, l1, l2: l2From(l1) }; };
const V = {
  mul(x, y) {
    if (x.ex !== null && y.ex !== null && BL(x.ex) + BL(y.ex) < SMALL) return exact(x.ex * y.ex);
    const l1 = x.l1 && y.l1 ? [x.l1[0] + y.l1[0], x.l1[1] === null || y.l1[1] === null ? null : x.l1[1] + y.l1[1]] : null;
    const l2 = [maxLo(x.l2[0], y.l2[0]), x.l2[1] === null || y.l2[1] === null ? null : maxB(x.l2[1], y.l2[1]) + 1n];
    return cap({ ex: null, l1, l2: l1 ? meet(l2, l2From(l1)) : l2 });
  },
  add(x, y) {
    if (y.ex !== null && y.ex < 0n) {                                     /* x − c, c small: ≤ x, ≥ x/2 when x ≥ 2c */
      if (x.ex !== null) return exact(x.ex + y.ex);
      const ok = x.l1 && x.l1[0] > BL(-y.ex) + 1n;
      const l1 = x.l1 ? [ok ? x.l1[0] - 1n : 0n, x.l1[1]] : null;
      return cap({ ex: null, l1, l2: l1 ? meet([null, x.l2[1]], l2From(l1)) : [null, x.l2[1]] });
    }
    if (x.ex !== null && y.ex !== null && maxB(BL(x.ex), BL(y.ex)) < SMALL) return exact(x.ex + y.ex);
    const l1 = x.l1 && y.l1 ? [maxB(x.l1[0], y.l1[0]), x.l1[1] === null || y.l1[1] === null ? null : maxB(x.l1[1], y.l1[1]) + 1n] : null;
    const l2 = [maxLo(x.l2[0], y.l2[0]), x.l2[1] === null || y.l2[1] === null ? null : maxB(x.l2[1], y.l2[1]) + 1n];
    return cap({ ex: null, l1, l2: l1 ? meet(l2, l2From(l1)) : l2 });
  },
  pow(x, y) {
    if (x.ex !== null && y.ex !== null && y.ex * BL(x.ex) < SMALL) return exact(x.ex ** y.ex);
    let l1 = null;
    if (y.ex !== null) {
      if (x.ex !== null) { const [lo, hi] = log2Of(x.ex); l1 = [(y.ex * lo) / N_REF, ceilDiv(y.ex * hi, N_REF)]; }
      else if (x.l1) l1 = [y.ex * x.l1[0], x.l1[1] === null ? null : y.ex * x.l1[1]];
    }
    if (!y.l1) throw new Error('an exponent without log2 bounds needs a third level');
    /* log2 log2 x^y = log2 y + log2 log2 x */
    const l2 = [y.l1[0] !== null && x.l2[0] !== null ? y.l1[0] + x.l2[0] : null, y.l1[1] === null || x.l2[1] === null ? null : y.l1[1] + x.l2[1]];
    return cap({ ex: null, l1, l2: l1 ? meet(l2, l2From(l1)) : l2 });
  },
  max(xs) {
    if (xs.every((x) => x.ex !== null)) return exact(xs.reduce((a, b) => (a.ex > b.ex ? a : b)).ex);
    const l1 = xs.every((x) => x.l1) ? [maxB(...xs.map((x) => x.l1[0])), xs.some((x) => x.l1[1] === null) ? null : maxB(...xs.map((x) => x.l1[1]))] : null;
    const l2 = [maxLo(...xs.map((x) => x.l2[0])), xs.some((x) => x.l2[1] === null) ? null : maxB(...xs.map((x) => x.l2[1]))];
    return cap({ ex: null, l1, l2: l1 ? meet(l2, l2From(l1)) : l2 });
  },
};
const primesUpTo = (n) => { const s = new Uint8Array(n + 1), p = []; for (let i = 2; i <= n; i++) if (!s[i]) { p.push(i); for (let j = i * i; j <= n; j += i) s[j] = 1; } return p; };

/* evaluate the fixedConstants; premises = { H1: bool, H2: bool } and the exact facts the premises need */
function evaluate(fc, premises, facts) {
  const memo = {}, used = { H1: 0, H2: 0 }, busy = new Set();
  const ev = (e) => {
    if (!Array.isArray(e)) throw new Error('not an expression: ' + JSON.stringify(e).slice(0, 80));
    const [op, ...a] = e;
    switch (op) {
      case 'literal': { const v = BigInt(a[0]); return v < 1n ? { ex: v, l1: null, l2: [null, null] } : exact(v); }
      case 'ref': return get(a[0]);
      case 'mul': return V.mul(ev(a[0]), ev(a[1]));
      case 'add': return V.add(ev(a[0]), ev(a[1]));
      case 'pow': return V.pow(ev(a[0]), ev(a[1]));
      case 'max': return V.max(a.map(ev));
      case 'factorial': { const n = ev(a[0]).ex; if (n === null || n > 100000n) throw new Error('factorial of a non-small value'); let f = 1n; for (let i = 2n; i <= n; i++) f *= i; return exact(f); }
      case 'catalogue_max': case 'catalogue_product': {
        const W = ev(a[0]).ex, k = ev(a[1]).ex, b = ev(a[2]).ex;
        if (W === null || k === null || b === null) throw new Error(op + ' with a non-exact parameter');
        if (W !== facts.W || k !== 22n || b !== 324n) throw new Error(op + ' is not the catalogue H1 speaks of');
        /* the catalogue has exactly k·φ(W) primes, all > b; under H1 every one is < X = 2^(W³) */
        const lo = op === 'catalogue_max' ? BL(b) - 1n : 0n;
        if (!premises.H1) return { ex: null, l1: [lo, null], l2: l2From([lo, null]) };
        used.H1++;
        const hi = op === 'catalogue_max' ? W ** 3n : k * facts.phiW * W ** 3n;
        return cap({ ex: null, l1: [lo, hi], l2: l2From([lo, hi]) });
      }
      case 'least_formal_multiple': {
        const N = ev(a[0]);
        if (!premises.H2 || !N.l1 || N.l1[1] === null) return { ex: null, l1: [0n, null], l2: [null, null] };
        used.H2++;
        const hi = 10n * N.l1[1];                                         /* H2: M_0 ≤ N_s^10 */
        return cap({ ex: null, l1: [0n, hi], l2: l2From([0n, hi]) });
      }
      default: throw new Error('an operation this evaluator was not told about: ' + op);
    }
  };
  const get = (k) => { if (memo[k]) return memo[k]; if (!(k in fc)) throw new Error('no fixedConstant ' + k); if (busy.has(k)) throw new Error('cycle at ' + k); busy.add(k); memo[k] = ev(fc[k]); busy.delete(k); return memo[k]; };
  for (const k of Object.keys(fc)) get(k);
  return { memo, used, ev };
}

function build() {
  const raw = readPinned(PIN.definition.path, PIN.definition.sha256).toString('utf8');
  readPinned(PIN.bounds.path, PIN.bounds.sha256); readPinned(PIN.tex.path, PIN.tex.sha256);
  if (!fs.existsSync(L1)) die('no certs/zq-recount.json (lane 1) to take the height from');
  const lane1 = JSON.parse(fs.readFileSync(L1, 'utf8'));
  if (lane1.verdict !== 'CERTIFIED' || lane1.numbers.rootHeight !== 256 || lane1.pins.definition.sha256 !== PIN.definition.sha256) die('lane 1 is not CERTIFIED at height 256 on the same bytes');
  const spec = JSON.parse(raw), fc = spec.library.fixedConstants;
  const rows = [];
  const row = (id, statement, source, holds, numbers, premises) => { rows.push({ id, statement, source, verdict: holds ? 'CERTIFIED' : 'REFUTED', premises: premises || [], numbers: numbers || {} }); return holds; };

  /* ---- exact, unconditional ---- */
  const lit = (k) => { const e = fc[k]; if (e[0] !== 'literal') die(k + ' is not a literal'); return BigInt(e[1]); };
  const P0 = lit('P0'), W = lit('W'), G0 = lit('G0');
  const primes = primesUpTo(324).map(BigInt), primorial = primes.reduce((a, b) => a * b, 1n);
  row('E1', 'P0 is the product of the primes ≤ 324 (the manuscript\'s P_s)', 'TeX sec:size line 6276', P0 === primorial, { primes: primes.length, P0Bits: String(BL(P0)) });
  row('E2', 'W = 4·∏_{p≤324} p', 'TeX sec:syntax (the catalogue modulus)', W === 4n * primorial);
  row('E3', '10^5 < W < 2^512', 'TeX prop:cutoff proof', W > 10n ** 5n && W < 1n << 512n, { WBits: String(BL(W)) });
  const F = (() => { let f = 1n; for (let i = 2n; i <= 324n; i++) f *= i; return f; })();
  row('E4', '2^2000 < F0 = 324! < 2^2250', 'TeX prop:cutoff proof', F > 1n << 2000n && F < 1n << 2250n, { FBits: String(BL(F)) });
  const pr3 = log2Of(3n)[1];
  row('E5', 'log2 3 ∈ [(b−1)/2^20, b/2^20] with b = ' + pr3 + ' the bit length of 3^(2^20) (no constant typed in)', 'arithmetic (bit length)', (1n << (pr3 - 1n)) <= 3n ** N_REF && 3n ** N_REF < 1n << pr3, { b: String(pr3), lower: String((pr3 - 1n) * 10n ** 9n / N_REF) + 'e-9', upper: String(ceilDiv(pr3 * 10n ** 9n, N_REF)) + 'e-9' });
  /* φ(W) from the verified factorization W = 2^3·∏_{3≤p≤324} p */
  const phiW = primes.reduce((a, p) => a * (p === 2n ? 4n : p - 1n), 1n);
  row('E6', 'every prime ≤ 324 divides W (so no unit class mod W contains one), φ(W) = 4·∏_{3≤p≤324}(p−1)', 'TeX prop:cutoff proof', primes.every((p) => W % p === 0n) && W % 8n === 0n && (W / 8n) % 2n === 1n, { phiWBits: String(BL(phiW)) });
  /* BMOR's hypothesis at q = W, x = X = 2^(W³): q ≥ 10^5 and 0.03·√q·(ln q)³ < ln X = (ln 2)·W³.
     Bounds: ln W < 0.7·b, √W < 2^ceil(b/2) (b = bit length of W); ln 2 > 0.69, W³ ≥ 2^(3(b−1)). */
  const bW = BL(W);
  const lhs = 3n * (1n << ((bW + 1n) / 2n)) * (7n * bW) ** 3n * 100n;      /* 0.03·2^c·(0.7b)³ scaled by 10^5·100 */
  const rhs = 69n * (1n << (3n * (bW - 1n))) * 100000n;                      /* 0.69·2^(3(b−1)) scaled the same */
  row('E7', 'BMOR\'s hypothesis holds at q = W, x = 2^(W³): q ≥ 10^5 and 0.03·√q·(ln q)³ < (ln 2)·W³', 'TeX prop:cutoff proof; [bmor] Thm 1.2', W >= 10n ** 5n && lhs < rhs);
  /* from H1's error bound to the catalogue: ϑ ≥ X/φ(W) − X/(160 ln X) > X/(2W) needs 160·ln X > 2W, i.e. 80·(ln 2)·W³ > W;
     then #primes ≤ X in the class > ϑ/ln X > X/(2W·W³) = X/(2W⁴) > 22 needs 2^(W³) > 44·W⁴, i.e. W³ > BL(44·W⁴). */
  row('E8', 'given H1: ϑ(X;W,a) > X/(2W) and more than 22 primes ≤ X in every unit class, so H_max < X = 2^(W³)', 'TeX prop:cutoff proof', 80n * 69n * W ** 3n > 100n * W && W ** 3n > BL(44n * W ** 4n) && phiW < W, {}, ['H1']);

  /* ---- the generic evaluation, without and with the premises ---- */
  const facts = { W, phiW };
  const bare = evaluate(fc, { H1: false, H2: false }, facts);
  const prem = evaluate(fc, { H1: true, H2: true }, facts);
  const m = prem.memo, b = bare.memo;
  const D = m.D;
  if (!D.l1 || D.l1[1] === null) die('D has no log2 bounds');
  const [LDlo, LDhi] = D.l1;
  row('E9', '2^(2^8008) < D < 2^(2^9010)', 'TeX prop:cutoff proof', LDlo > 1n << 8008n && LDhi < 1n << 9010n, { log2DLowerBits: String(BL(LDlo)), log2DUpperBits: String(BL(LDhi)), relativeWidth: 'below 2^-' + String(BL(LDlo) - BL(LDhi - LDlo)) });
  row('E10', 'G0 < 2^37', 'TeX prop:cutoff proof', G0 < 1n << 37n);
  /* B = T+1 also holds without H1/H2 (size-bound proof §3): ell ≤ R^(2917+16104W), T ≥ R^(221·R·E0) and R ≥ D, so the exponent comparison 2917+16104W < D suffices */
  row('E11', 'the size-bound proof §3 exponent comparison, unconditional: 2917 + 16104·W < D (≤ 221·R·E0, as R ≥ D by its definition as a maximum)', 'size-bound proof §3', BL(2917n + 16104n * W) <= LDlo);
  const unboundedWithout = ['Hmax', 'Hproduct', 'Ns', 'M', 'cstar', 'ell', 'R', 'Q', 'Aheight', 'T'].filter((k) => b[k].l2[1] === null);

  /* ---- conditional on H1, H2 ---- */
  const Ns = m.Ns, cstar = m.cstar, Hmax = m.Hmax;
  row('C1', 'log2 N_s < 2^2054', 'TeX prop:cutoff proof', Ns.l1[1] < 1n << 2054n, { log2NsUpperBits: String(BL(Ns.l1[1])) }, ['H1']);
  row('C2', 'c_* = 4·M_0 < 2^(2^2059)', 'TeX prop:cutoff proof', cstar.l1[1] < 1n << 2059n, { log2CstarUpperBits: String(BL(cstar.l1[1])) }, ['H1', 'H2']);
  const R = m.R, tenTo12 = exact(10n ** 12n);
  row('C3', 'R = max(D, H_max, c_*, 10^12) = D', 'TeX prop:cutoff', Hmax.l1[1] < LDlo && cstar.l1[1] < LDlo && tenTo12.l1[1] < LDlo && R.l1[0] === LDlo && R.l1[1] === LDhi, {}, ['H1', 'H2']);
  const Ccm = m.Ccm, Q = m.Q, Q17 = V.pow(Q, exact(17n));
  /* the manuscript's own comparison: log2 Q^17 = 170·G0²·D³·log2 D > 50000·D² > log2 C_cm; we compare the log2 log2 bounds */
  row('C4', 'the maximum in A_ht = 2·10^13·max(1, C_cm, Q^17) is Q^17', 'TeX prop:cutoff proof', Q17.l2[0] !== null && Q17.l2[0] > Ccm.l2[1], { log2log2Q17LowerBits: String(BL(Q17.l2[0])), log2log2CcmUpperBits: String(BL(Ccm.l2[1])) }, ['H1', 'H2']);
  /* the closed form: read the expression SHAPES from the JSON and do the coefficient arithmetic */
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const shapes = same(fc.T, ['pow', ['mul', ['literal', '48'], ['ref', 'Aheight']], ['literal', '13']])
    && same(fc.Aheight, ['mul', ['mul', ['literal', '2'], ['pow', ['literal', '10'], ['literal', '13']]], ['max', ['literal', '1'], ['ref', 'Ccm'], ['pow', ['ref', 'Q'], ['literal', '17']]]])
    && same(fc.Q, ['pow', ['ref', 'R'], ['mul', ['ref', 'R'], ['ref', 'E0']]])
    && same(fc.E0, ['mul', ['literal', '10'], ['pow', ['mul', ['ref', 'D'], ['ref', 'G0']], ['literal', '2']]]);
  /* T = (48·2·10^13·Q^17)^13 = (96·10^13)^13·Q^221; with R = D, Q = D^(D·10·D²·G0²) = D^(10·G0²·D³); so Q^221 = D^(2210·G0²·D³) */
  row('C5', 'T = (96·10^13)^13·D^(2210·G0²·D³) (the closed form their Lean helper ExplicitCutoffBounds.t bounds)', 'TeX prop:cutoff', shapes && 48n * 2n * 10n ** 13n === 96n * 10n ** 13n && 13n * 17n === 221n && 221n * 10n === 2210n, {}, ['H1', 'H2']);
  const T = m.T;
  /* T < 2^(2^(2^9013)) ⟸ log2 log2 T < 2^9013; the manuscript's route: log2 T < D^8 (log2 log2 T < 8·log2 D) and D^8 < 2^(2^9013) */
  row('C6', 'log2 T < D^8 < 2^(2^9013), so T+1 ≤ U = 2^(2^(2^9013))', 'TeX prop:cutoff proof; lines 6431-6432', T.l2[1] !== null && T.l2[1] < 8n * LDlo && 8n * LDhi < 1n << 9013n && T.l2[1] < 1n << 9013n, { log2log2TUpperBits: String(BL(T.l2[1])) }, ['H1', 'H2']);
  /* B = T+1: every literal, constant node, psi index and the fixed_integer ell is below T */
  const nodesConst = []; const psiIdx = []; const fixedInts = [];
  for (const t of spec.library.templates) for (const nd of t.nodes) { if (nd.op === 'const') nodesConst.push(BigInt(nd.args[0])); else if (nd.op === 'psi_component') psiIdx.push(nd.args[0]); else if (nd.op === 'fixed_integer') fixedInts.push(nd.args[0]); }
  const maxConstBits = nodesConst.reduce((a, c) => maxB(a, BL(c < 0n ? -c : c)), 0n);
  const below = (v) => v.l2[1] !== null && T.l2[0] !== null && v.l2[1] < T.l2[0];
  /* Constants on T's own chain share D's uncertainty with T, so their bounds cannot be separated from T's; for them
     use STRUCTURE: walk T's expression tree through operations whose result is ≥ each argument (mul and add of
     values ≥ 1, max, pow with exponent ≥ 1 for its base and base ≥ 2 for its exponent, n ≤ n!). Every constant
     reached is ≤ T. The catalogue and least-formal-multiple operators dominate nothing. */
  const dominated = new Set();
  /* x ≥ 1: an exact value ≥ 1, or log2 x ≥ 0; x ≥ 2: log2 x ≥ 1, or log2 log2 x ≥ 0 */
  const ge1 = (e) => { const v = prem.ev(e); return v.ex !== null ? v.ex >= 1n : (v.l1 && v.l1[0] >= 0n) || (v.l2[0] !== null && v.l2[0] >= 0n); };
  const ge2 = (e) => { const v = prem.ev(e); return v.ex !== null ? v.ex >= 2n : (v.l1 && v.l1[0] >= 1n) || (v.l2[0] !== null && v.l2[0] >= 0n); };
  const walk = (e) => {
    const [op, ...a] = e;
    if (op === 'ref') { if (!dominated.has(a[0])) { dominated.add(a[0]); walk(fc[a[0]]); } }
    else if ((op === 'mul' || op === 'add') && a.every(ge1)) a.forEach(walk);
    else if (op === 'max') a.forEach(walk);
    else if (op === 'pow') { if (ge1(a[1])) walk(a[0]); if (ge2(a[0])) walk(a[1]); }
    else if (op === 'factorial') walk(a[0]);
  };
  walk(fc.T);
  const others = Object.keys(fc).filter((k) => k !== 'T');
  const byStructure = others.filter((k) => dominated.has(k)), byBounds = others.filter((k) => !dominated.has(k));
  const psiVals = psiIdx.map((e) => prem.ev(e)), fixedVals = fixedInts.map((e) => prem.ev(e));
  const Bholds = byBounds.every((k) => below(m[k])) && maxConstBits < LDlo && psiVals.every(below) && fixedVals.every(below) && T.l2[0] !== null && T.l2[0] > 5n;
  row('C7', 'B = max(2^20, T+1, 1+|c| over every fixedConstant, constant node, psi index and fixed_integer) = T+1', 'bounds JSON "B", "simplified_B"; size-bound proof §3', Bholds, { belowTByStructure: byStructure, belowTByBounds: byBounds, constantNodes: nodesConst.length, maxConstantNodeBits: String(maxConstBits), psiIndices: psiIdx.length, fixedIntegers: fixedInts.length, log2log2TLowerBits: String(BL(T.l2[0])) }, ['H1', 'H2']);
  /* the towers: 2↑↑4 = 65536, 2↑↑7 = 2^(2^(2^65536)); deg ≤ (T+1)^2048 */
  const tow4 = 2n ** (2n ** (2n ** 2n));
  const T1 = V.add(T, exact(1n)), deg = V.pow(T1, exact(2048n));
  row('C8', '(T+1)^2048 ≤ U^2048 = 2^(2^(2^9013+11)) < 2^(2^(2^9014))', 'TeX lines 6433-6435', (1n << 9013n) + 11n < 1n << 9014n && deg.l2[1] < 1n << 9014n, { log2log2DegreeBoundUpperBits: String(BL(deg.l2[1])) }, ['H1', 'H2']);
  row('C9', '9014 < 65536 = 2↑↑4, so the degree bound (T+1)^2048 < 2↑↑7 = 2^(2^(2^65536))', 'TeX lines 6437-6438', tow4 === 65536n && 9014n < tow4 && deg.l2[1] < 1n << tow4, { log2log2log2DegreeBoundAtMost: String(BL(deg.l2[1])), log2log2log2TowerSeven: '65536' }, ['H1', 'H2']);
  row('C10', 'the coefficient bound 2^((T+1)^2048) < 2^(2↑↑7) = 2↑↑8', 'TeX lines 6437-6438', deg.l2[1] < 1n << tow4, {}, ['H1', 'H2']);

  const allExact = rows.every((r) => r.verdict === 'CERTIFIED');
  const conclusions = [
    { claim: 'deg P_* < 2↑↑7', verdict: allExact ? 'CERTIFIED' : 'REFUTED', conditionalOn: ['H1', 'H2', 'M', 'L1'], reading: 'deg P_* ≤ B^(8·256) = (T+1)^2048 by M and L1; B = T+1 (C7); (T+1)^2048 < 2↑↑7 (C9).' },
    { claim: '|[X^α]P_*| < 2↑↑8 for every α', verdict: allExact ? 'CERTIFIED' : 'REFUTED', conditionalOn: ['H1', 'H2', 'M', 'L1'], reading: '|c| ≤ ‖P_*‖₁ ≤ 2^(B^2048) = 2^((T+1)^2048) by M and L1; < 2↑↑8 (C10).' },
    { claim: 'the same two bounds with no premise', verdict: 'REFUSED', conditionalOn: [], reading: 'Without H1 and H2 the artifact gives no upper bound on H_max or M_0: ' + unboundedWithout.join(', ') + ' are unbounded above in our evaluation. H1 and H2 are applications of published theorems (BMOR; Silverman) and M is a mathematical lemma; none is decided here.' },
  ];
  /* red controls for this lane (added after the pre-registration, which fixed controls for lane 1 only) */
  const towerOf = (fcX, premX) => { const r = evaluate(fcX, premX, facts).memo; const d2 = V.pow(V.add(r.T, exact(1n)), exact(2048n)); return { log2log2DegreeUpper: d2.l2[1], log2log2DegreeLower: d2.l2[0], below2upup7: d2.l2[1] !== null && d2.l2[1] < 1n << tow4, atLeast2upup7: d2.l2[0] !== null && d2.l2[0] >= 1n << tow4 }; };
  const planted = JSON.parse(JSON.stringify(fc)); planted.F = ['factorial', ['literal', '2000']];
  const tc2 = towerOf(planted, { H1: true, H2: true });
  const tc3 = towerOf(fc, { H1: true, H2: false });
  const redControls = [
    { id: 'TC1', mutation: 'no premise (H1 and H2 both absent)', prediction: 'T unbounded above: the tower undetermined', outcome: String(towerOf(fc, { H1: false, H2: false }).log2log2DegreeUpper), passed: towerOf(fc, { H1: false, H2: false }).log2log2DegreeUpper === null },
    { id: 'TC2', mutation: 'a planted copy with F0 = 2000! in place of 324!', prediction: 'the planted degree bound (T+1)^2048 is ≥ 2↑↑7 by a LOWER bound (C9 would refute)', outcome: 'log2 log2 log2 of the planted degree bound ≥ ' + String(tc2.log2log2DegreeLower === null ? 'nothing' : BL(tc2.log2log2DegreeLower) - 1n) + ' > 65536', passed: tc2.atLeast2upup7 === true },
    { id: 'TC3', mutation: 'H2 absent, H1 present', prediction: 'c_* and so R, T unbounded: the tower undetermined', outcome: String(tc3.log2log2DegreeUpper), passed: tc3.log2log2DegreeUpper === null },
  ];
  if (!redControls.every((c) => c.passed)) die('a lane-2 red control did not come out as predicted: ' + redControls.filter((c) => !c.passed).map((c) => c.id).join(', '));
  const digest = sha(JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ex: v.ex === null ? null : String(v.ex).length > 64 ? sha(String(v.ex)) : String(v.ex), l1: v.l1 && v.l1.map((x) => (x === null ? null : sha(String(x)))), l2: v.l2.map((x) => (x === null ? null : String(x))) }]))));
  return {
    what: 'Track A lane 2 on the claim "Z is Diophantine in Q" (Glazer et al., announced 2026-11-05): the stated tower bounds on the degree and coefficients of the saved polynomial P_*, decided by exact integer comparison from the fixedConstants of the pinned definition JSON, evaluated by a generic interpreter of their expression language with outward-rounded bounds on log2 and log2 log2. Conditional on four named premises; unconditional form REFUSED.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md',
    pins: PIN, code: { 'tools/zq-tower.js': sha(fs.readFileSync(__filename)) },
    lane1: { record: 'certs/zq-recount.json', verdict: lane1.verdict, rootHeight: lane1.numbers.rootHeight, contentSha256: sha(JSON.stringify(Object.assign({}, lane1, { generated: null }))), note: 'sha256 of the record with its date nulled' },
    premises: {
      H1: 'BMOR [bmor] Thm 1.2, (1.10)-(1.11), Cor. 6.17 with A = 1, as applied in the proof of prop:cutoff: at X = 2^(W³), |ϑ(X;W,a) − X/φ(W)| ≤ X/(160·ln X) for every unit class a mod W, including the possible exceptional-zero case. Used ' + prem.used.H1 + ' times (catalogue_max, catalogue_product).',
      H2: 'M_0 ≤ N_s^10: the reduction-order and formal-subgroup argument in the proof of prop:cutoff (Silverman VII.2.1, V.1.1). Used ' + prem.used.H2 + ' time (least_formal_multiple).',
      M: 'the degree and log-norm majorant B^(8h) at syntax height h (TeX lines 6386-6430; size-bound proof §§1-2). A mathematical induction, read and not decided.',
      L1: 'root height 256, CERTIFIED by certs/zq-recount.json on the same bytes.',
    },
    verdict: allExact ? 'CERTIFIED' : 'REFUTED',
    verdictScope: 'the exact chain from H1, H2, M, L1 to deg < 2↑↑7 and |c| < 2↑↑8; the unconditional claim REFUSED',
    rows, conclusions, redControls,
    redControlsNote: 'Added after the pre-registration (which fixed red controls for lane 1 only), so they are a check of this tool, not a pre-registered test.',
    margin: 'Under the premises, log2 log2 log2 of the degree bound is at most ' + String(BL(deg.l2[1])) + ' (the claim needs < 65536; the manuscript states < 2^9014 at the same level).',
    evaluationDigest: digest,
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-tower.json is not what the pinned constants and this code give now');
  console.log('zq-tower: re-derived, identical · ' + L.verdict + ' (' + L.verdictScope + ')');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-tower: ' + L.verdict + ' · ' + L.rows.map((r) => r.id + ' ' + (r.verdict === 'CERTIFIED' ? 'ok' : 'FAILS')).join(' ') + ' · ' + L.margin);
}
