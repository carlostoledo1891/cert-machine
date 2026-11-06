#!/usr/bin/env node
/* zq-finite.js — Track A lane 3 on the claim "Z is Diophantine in Q" (Glazer et al., 2026-11-05): the claimant's four
   finite arithmetic suites (construction/README.md, "What each check establishes"), re-derived clean-room.
   Writes certs/zq-finite.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. These suites check finite arithmetic facts the construction uses; their own README
   says they do not establish the zero projection, the global height or restricted-converse inputs, or the natural
   precision polynomial's semantics, and nothing here does either.

   TWO VERDICTS PER SUITE (pre-registration Amendment A2, committed before this file ran, 13c9e92e):
   replay      is THEIR case set reconstructed from their prose and data, and does it agree? REFUSED where the set is
               not stated, with the reason. Their checker code is never read.
   statements  the mathematics the suite is said to check, decided on OUR cases (ranges fixed in A2): CERTIFIED when
               every case agrees exactly, REFUTED with the failing case as witness, REFUSED when a red control does
               not come out as predicted.

   CLEAN ROOM: written from integer-compiler-spec.txt §§1-5, the TeX (lines 180-245, 377-560, 905-965) and the
   definition JSON's `definitions` block, with exact arithmetic of our own (tools/zq-k0.js: BigInt rationals, Q(√2)
   as pairs). Their data files are read (the definition JSON, their check report docs/construction-checks-r2.json,
   division-polynomial-checks.json, the reviewer's arithmetic.json); no line of their .js or .py is read, copied or
   ported. Their bytes stay in their clone ($ZQ_REPO, default ~/Projects/zq-scout/diophantine-z-q).

   usage: node tools/zq-finite.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Q, Q0, Q1, K, curve, psiTable, iotaByPsi, P, solveWitness, gcdSelfTest } = require('./zq-k0.js');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const OUT = path.join(ROOT, 'certs', 'zq-finite.json');
const L1 = path.join(ROOT, 'certs', 'zq-recount.json');
const die = (m) => { console.error('zq-finite: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q', commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
  definition: { path: 'construction/ordinary-integer-definition.json', sha256: '4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6' },
  readme: { path: 'construction/README.md', sha256: '94f1e289506baa1cd23d90da6ce83a1cdaf57a9c016f884bc87f0b9a049f784b' },
  spec: { path: 'construction/integer-compiler-spec.txt', sha256: '9a3a01fc78e922351cf4e6f47d1bc160c6f392d76279d71c9f0b9f2bc91d9eb1' },
  tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
  report: { path: 'docs/construction-checks-r2.json', sha256: '306a7c8fe8021b45a0e0d9e9838914b4f7269543c405ad1c22c13afe66bbf252' },
  divisionChecks: { path: 'construction/division-polynomial-checks.json', sha256: '8ec8233dd4be90bb95f12aea21de7f659a7abe9bf35c21346f437e676b51c24a' },
  reviewArithmetic: { path: 'docs/reviews/height-replacement/whole/arithmetic.json', sha256: null },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its proof is `sorry`) and nothing in this record decides it. This record re-derives the claimant\'s four finite arithmetic suites; by their own README those suites do not establish the zero projection, the global height or restricted-converse inputs, or the natural precision polynomial\'s semantics.';
const readPinned = (rel, want) => { const p = path.join(REPO, rel); if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing'); const b = fs.readFileSync(p); if (want && sha(b) !== want) die(rel + ' is not the pinned bytes; REFUSED, nothing computed'); return b; };

/* ---- rows and red controls ---- */
function ledger() {
  const rows = [], rc = [];
  const row = (id, statement, source, cases, failures, numbers) => { const r = { id, statement, source, cases, verdict: failures.length ? 'REFUTED' : 'CERTIFIED' }; if (failures.length) r.witness = failures.slice(0, 3); if (numbers) r.numbers = numbers; rows.push(r); return !failures.length; };
  const control = (id, mutation, prediction, outcome, passed) => rc.push({ id, mutation, prediction, outcome: String(outcome), passed: !!passed });
  return { rows, rc, row, control };
}
function verdicts(L, replay) {
  const bad = L.rows.filter((r) => r.verdict !== 'CERTIFIED'), rcBad = L.rc.filter((c) => !c.passed);
  const cases = L.rows.reduce((s, r) => s + r.cases, 0);
  const statements = rcBad.length ? { verdict: 'REFUSED', reason: 'a red control did not come out as predicted: ' + rcBad.map((c) => c.id).join(', ') }
    : bad.length ? { verdict: 'REFUTED', reason: 'stated facts failing on our cases: ' + bad.map((r) => r.id).join(', ') }
      : { verdict: 'CERTIFIED', reason: L.rows.length + ' stated facts on ' + cases.toLocaleString('en-US') + ' cases of ours, every one exact; ' + L.rc.length + ' red controls as predicted' };
  return { replay, statements, casesOurs: cases, rows: L.rows, redControls: L.rc };
}

/* ---- the curve, from the TeX (lines 256-262), checked against the JSON ---- */
const D_TEX = K.parse('75', '-53');
const A_TEX = K.neg(K.mul(D_TEX, D_TEX));
const P0 = { x: K.parse('1641/8', '-145'), y: K.parse('-15465/4', '87483/32') };   /* (1641-1160s)/8, (-123720+87483s)/32 */
const E = curve(A_TEX);
const codeEq = (a, b) => a.length === b.length && a.every((q, i) => Q.eq(q, b[i]));

/* ================================================================================================================
   SUITE 1: the integer compiler (integer-compiler-spec.txt §§1-5)
   ============================================================================================================== */
function suiteIC(report) {
  const L = ledger();
  const R13 = [...Array(13).keys()];
  /* §1 the formula conventions */
  {
    const leaves = [Q.int(-1), Q0, Q1, Q.int(2), Q.make(-1n, 2n)].map((v) => ({ v, t: Q.isZero(v) }));
    const conv = (op, kids) => (op === 'and' ? { v: kids.reduce((s, k) => Q.add(s, Q.mul(k.v, k.v)), Q0), t: kids.every((k) => k.t) } : { v: kids.reduce((s, k) => Q.mul(s, k.v), Q1), t: kids.some((k) => k.t) });
    const tuples = (xs, k) => (k === 0 ? [[]] : tuples(xs, k - 1).flatMap((t) => xs.map((x) => t.concat([x]))));
    const level = (xs) => { const out = []; for (const op of ['and', 'or']) for (let k = 0; k <= 2; k++) for (const t of tuples(xs, k)) out.push(conv(op, t)); return out; };
    const outer = level(level(leaves));
    L.row('IC1', 'Eq(A,B) ↦ A−B, And(F_i) ↦ Σ P_i², Or(F_i) ↦ Π P_i, empty And ↦ 0, empty Or ↦ 1: the polynomial vanishes exactly when the formula holds (over Q; leaves −1, 0, 1, 2, −1/2; And/Or of arity 0-2, two levels)', 'integer-compiler-spec.txt §1', outer.length, outer.filter((f) => Q.isZero(f.v) !== f.t).map((f) => Q.str(f.v)));
    const f2 = [], f3 = [], f4 = [];
    for (const a of R13) for (const b of R13) {
      if ((a < b) !== R13.some((d) => b === a + 1 + d)) f2.push([a, b]);
      if ((a === 0 ? b === 0 : b % a === 0) !== R13.some((d) => b === a * d)) f3.push([a, b]);
      for (const m of R13) if ((m === 0 ? a === b : (a - b) % m === 0) !== R13.some((u) => R13.some((v) => a + m * u === b + m * v))) f4.push([a, b, m]);
    }
    L.row('IC2', 'A < B ⟺ ∃d ∈ N: B = A+1+d (A, B ∈ [0,12])', 'spec §1', 169, f2);
    L.row('IC3', 'A | B ⟺ ∃d ∈ N: B = A·d, with 0 | B only for B = 0 (A, B ∈ [0,12])', 'spec §1', 169, f3);
    L.row('IC4', 'A ≡ B (mod M) ⟺ ∃u,v ∈ N: A + M·u = B + M·v, M = 0 meaning equality (A, B, M ∈ [0,12]; witnesses in [0,12], enough here)', 'spec §1', 2197, f4);
  }
  /* §2 the power macro (exp_repr): b = α_{Q+4}(R+1) + Q² + 2, m + Q² + 1 = bQ, P < m, P + b·α_b(R) ≡ Q·α_b(R) + α_b(R+1) (mod m) */
  const alpha = (b, n) => { if (n === 0) return 0n; let a0 = 0n, a1 = 1n; for (let i = 1; i < n; i++) { const t = b * a1 - a0; a0 = a1; a1 = t; } return a1; };
  const power = (q, R, mut) => {
    if (q === 0n) return true;                                            /* the macro handles 0^0 = 1, 0^R = 0 explicitly */
    const want = q ** BigInt(R);
    const b = (mut === 'no-alpha' ? 0n : alpha(q + 4n, R + 1)) + q * q + 2n;
    const m = mut === 'm-off-by-one' ? b * q - q * q : b * q - q * q - 1n;
    if (!(b > 3n) || !(m > 0n) || !(want < m)) return false;
    const res = (((q * alpha(b, R) + alpha(b, R + 1) - b * alpha(b, R)) % m) + m) % m;
    return res === want;                                                  /* P < m, so P is the unique residue */
  };
  const powFails = (mut) => { const f = []; for (let q = 0n; q <= 7n; q++) for (let R = 0; R <= 7; R++) if (!power(q, R, mut)) f.push([String(q), R]); return f; };
  L.row('IC5', 'the power macro: for Q > 0 the unique P ∈ [0, m) with P + b·α_b(R) ≡ Q·α_b(R) + α_b(R+1) (mod m) is Q^R, and Q^R < m (Q, R ∈ [0,7]; Q = 0 is handled explicitly by the macro)', 'spec §2', 64, powFails());
  const pc1 = powFails('m-off-by-one'), pc2 = powFails('no-alpha');
  L.control('PC1', 'm + Q² = bQ in place of m + Q² + 1 = bQ', 'fails on some (Q, R)', pc1.length + ' of 64 fail', pc1.length > 0);
  L.control('PC2', 'b = Q² + 2 (the α_{Q+4}(R+1) term dropped)', 'fails on some (Q, R): m no longer exceeds Q^R', pc2.length + ' of 64 fail', pc2.length > 0);
  /* §3 binomial digits and bits */
  const pas = [[1n]]; for (let n = 1; n <= 130; n++) { const r = [1n]; for (let k = 1; k < n; k++) r.push(pas[n - 1][k - 1] + pas[n - 1][k]); r.push(1n); pas.push(r); }
  const C = (n, k) => (k < 0 || k > n ? 0n : pas[n][k]);
  const digitFails = (mut) => { const f = []; for (let N = 0; N <= 20; N++) for (let Kk = 0; Kk <= 22; Kk++) { const base = 2n ** BigInt(mut === 'base-2^N' ? N : N + 1), total = (1n + base) ** BigInt(N), place = base ** BigInt(Kk); const c = (total / place) % base; let bounded = true; for (let j = 0; j <= N; j++) if (!(C(N, j) < base)) bounded = false; if (c !== C(N, Kk) || !bounded) f.push([N, Kk]); } return f; };
  L.row('IC6', 'base = 2^(N+1), total = (1+base)^N, place = base^K, total = place·(base·u + C) + r with C < base, r < place: the unique C is binomial(N,K), 0 for K > N, and every binomial(N,j) < base (N ∈ [0,20], K ∈ [0,22])', 'spec §3', 21 * 23, digitFails());
  const dg1 = digitFails('base-2^N');
  L.control('DG1', 'base = 2^N in place of 2^(N+1)', 'fails at N = 0 (binomial(0,0) = 1 is not < 1)', dg1.length + ' fail, first ' + JSON.stringify(dg1[0]), dg1.length > 0 && dg1[0][0] === 0);
  const odd = (n, k) => (C(n, k) & 1n) === 1n;
  const f7 = [], f8 = [], f9 = [], bt1 = [], bt2 = [];
  for (let a = 0; a < 64; a++) for (let b = 0; b < 64; b++) {
    if (odd(b, a) !== ((a & b) === a)) f7.push([a, b]);
    if (odd(a, b) !== ((a & b) === a)) bt2.push([a, b]);
    if (odd(a + b, a) !== ((a & b) === 0)) f8.push([a, b]);
    const sols = [], loose = [];
    for (let z = 0; z <= Math.min(a, b); z++) { const u = a - z, v = b - z, zu = odd(z + u, z), zv = odd(z + v, z); if (zu && zv && odd(u + v, u)) sols.push(z); if (zu && zv) loose.push(z); }
    if (sols.length !== 1 || sols[0] !== (a & b)) f9.push([a, b]);
    if (loose.length !== 1) bt1.push([a, b]);
  }
  L.row('IC7', 'A is a bitwise subset of B ⟺ binomial(B, A) is odd (A, B ∈ [0,63])', 'spec §3 (Lucas at 2)', 4096, f7);
  L.row('IC8', 'A and B have disjoint bits ⟺ binomial(A+B, A) is odd (A, B ∈ [0,63])', 'spec §3', 4096, f8);
  L.row('IC9', 'Z = X AND Y is the unique natural Z with X = Z+A, Y = Z+B and (Z,A), (Z,B), (A,B) pairwise disjoint, each disjointness by binomial parity (X, Y ∈ [0,63])', 'spec §3', 4096, f9);
  L.control('BT1', 'the AND decomposition without the (A,B) disjointness', 'some (X, Y) has more than one Z', bt1.length + ' pairs with more than one Z, first ' + JSON.stringify(bt1[0]), bt1.length > 0);
  L.control('BT2', 'subset read as binomial(A, B) odd (arguments swapped)', 'fails on some pair', bt2.length + ' pairs fail', bt2.length > 0);

  /* §§4-5 register machines and packed histories */
  const MACHINES = [
    { name: 'clear', n: 1, prog: [['sub', 0, 0, 1], ['halt']] },                                       /* accepts every a */
    { name: 'even', n: 1, prog: [['sub', 0, 1, 3], ['sub', 0, 0, 2], ['add', 0, 2], ['halt']] },      /* accepts even a; odd a loops */
    { name: 'move', n: 2, prog: [['sub', 0, 1, 2], ['add', 1, 0], ['sub', 1, 2, 3], ['halt']] },      /* moves r0 to r1, then clears r1 */
  ];
  for (const M of MACHINES) M.prog.forEach((ins, i) => { const last = i === M.prog.length - 1; if ((ins[0] === 'halt') !== last) die('machine ' + M.name + ': halt only at the final position'); for (const tgt of ins[0] === 'add' ? [ins[2]] : ins[0] === 'sub' ? [ins[2], ins[3]] : []) if (!(tgt >= 0 && tgt < M.prog.length)) die('machine ' + M.name + ': a jump out of range'); });
  const run = (M, a, limit) => {
    const regs = Array(M.n).fill(0); regs[0] = a; let s = 0; const states = [], hist = [];
    for (let t = 0; t <= limit; t++) {
      states.push(s); hist.push(regs.slice()); const ins = M.prog[s];
      if (ins[0] === 'halt') return { halted: true, accepted: regs.every((r) => r === 0), q: t, states, hist };
      if (ins[0] === 'add') { regs[ins[1]]++; s = ins[2]; } else if (regs[ins[1]] > 0) { regs[ins[1]]--; s = ins[2]; } else s = ins[3];
    }
    return { halted: false, accepted: false };
  };
  /* every equation of §5, for a candidate (q, c, state digits, register digits); returns the failing equations */
  const packed = (M, a, q, c, states, digits, mut, firstOnly) => {
    const m = M.prog.length, n = M.n, halt = m - 1, Kk = 1n << BigInt(c), B = 4n * Kk, T = B ** BigInt(q);
    const Bp = []; for (let t = 0; t <= q; t++) Bp.push(B ** BigInt(t));
    let F = 0n; for (const b of Bp) F += b;
    const D = (Kk - 1n) * F, KF = Kk * F;
    const pk = (f) => { let s = 0n; for (let t = 0; t <= q; t++) s += BigInt(f(t)) * Bp[t]; return s; };
    const R = []; for (let j = 0; j < n; j++) R.push(pk((t) => digits[j][t]));
    const S = []; for (let i = 0; i < m; i++) S.push(pk((t) => (states[t] === i ? 1 : 0)));
    const fails = [];
    const need = (ok, what) => { if (!ok) fails.push(what); return ok || !firstOnly; };
    if (!need(c > 0, 'c>0') || !need(B > BigInt(m), 'B>m') || !need(BigInt(a) < Kk, 'a<K')) return { fails };
    if (!need(B * F + 1n === F + B * T, 'BF+1=F+BT') || !need(D + F === Kk * F, 'D+F=KF')) return { fails };
    for (let j = 0; j < n; j++) if (!need((R[j] & D) === R[j], 'R' + j + '⊆D') || !need(R[j] < T, 'R' + j + '<T')) return { fails };
    for (let i = 0; i < m; i++) if (!need((S[i] & F) === S[i], 'S' + i + '⊆F')) return { fails };
    if (!need(S.reduce((x, y) => x + y, 0n) === F, 'ΣS=F') || !need(S[halt] === T, 'S_halt=T')) return { fails };
    const N = R.map((r, j) => { const rhs = (r + D) & KF; need(rhs % Kk === 0n, 'K|N' + j); return rhs / Kk; });
    const V = [], W = [];
    for (let i = 0; i < m; i++) { const ins = M.prog[i]; if (ins[0] === 'sub') { V[i] = S[i] & N[ins[1]]; W[i] = S[i] - V[i]; if (!need(W[i] >= 0n, 'W' + i + '≥0')) return { fails }; } }
    for (let j = 0; j < n; j++) {
      let Aj = 0n, Cj = 0n;
      for (let i = 0; i < m; i++) { const ins = M.prog[i]; if (ins[0] === 'add' && ins[1] === j) Aj += S[i]; if (ins[0] === 'sub' && ins[1] === j) Cj += V[i]; }
      const lhs = R[j] + (mut === 'drop-BC' ? 0n : B * Cj);
      if (!need(lhs === (j === 0 ? BigInt(a) : 0n) + B * R[j] + B * Aj, 'register' + j)) return { fails };
    }
    for (let d = 0; d < m; d++) {
      let Id = 0n;
      for (let i = 0; i < m; i++) { const ins = M.prog[i]; if (ins[0] === 'add' && ins[2] === d) Id += S[i]; if (ins[0] === 'sub') { if (ins[2] === d) Id += V[i]; if (ins[3] === d) Id += W[i]; } }
      if (!need(S[d] === (d === 0 ? 1n : 0n) + B * Id, 'state' + d)) return { fails };
    }
    return { fails, N, pk };
  };
  const chooseC = (M, a, hist) => { let mx = a; for (const h of hist) for (const r of h) if (r > mx) mx = r; let c = 1; while (!((1 << c) > mx && 4 * (1 << c) > M.prog.length)) c++; return c; };
  /* the mask decodings of §5, exhaustively on small boxes */
  {
    const f = []; let cases = 0;
    for (const c of [1, 2]) for (const q of [1, 2, 3]) {
      const Kk = 1n << BigInt(c), B = 4n * Kk, T = B ** BigInt(q); let F = 0n; for (let t = 0; t <= q; t++) F += B ** BigInt(t); const D = (Kk - 1n) * F;
      for (let r = 0n; r < T; r++) { cases++; let ok = true, x = r; for (let t = 0; t < q; t++) { if (x % B >= Kk) ok = false; x /= B; } if ((((r & D) === r) && r < T) !== ok) f.push([c, q, String(r)]); }
    }
    L.row('IC10', 'R ⊆ D and R < T ⟺ every base-B digit of R is < K and its digit q is 0 (c ∈ {1,2}, q ∈ {1,2,3}, every R < T)', 'spec §5', cases, f);
    const g = []; let cs = 0;
    for (const m of [2, 3]) for (const q of [1, 2]) {
      const c = 1, B = 8n, T = B ** BigInt(q); let F = 0n; for (let t = 0; t <= q; t++) F += B ** BigInt(t);
      const subsets = []; for (let mask = 0; mask < 1 << (q + 1); mask++) { let s = 0n; for (let t = 0; t <= q; t++) if (mask >> t & 1) s += B ** BigInt(t); subsets.push(s); }
      const rec = (i, acc) => {
        if (i === m) {
          cs++; const S = acc; const enc = S.reduce((x, y) => x + y, 0n) === F && S[m - 1] === T && S.every((s) => (s & F) === s);
          let dec = true; for (let t = 0; t <= q; t++) { const on = S.filter((s) => (s / B ** BigInt(t)) % B === 1n).length; if (on !== 1) dec = false; if (t < q && (S[m - 1] / B ** BigInt(t)) % B !== 0n) dec = false; if (t === q && (S[m - 1] / B ** BigInt(t)) % B !== 1n) dec = false; }
          if (enc !== dec) g.push([m, q]);
          return;
        }
        for (const s of subsets) rec(i + 1, acc.concat([s]));
      };
      if (c && B > BigInt(m)) rec(0, []);
    }
    L.row('IC11', 'S_i ⊆ F, Σ S_i = F and S_halt = T ⟺ exactly one state per slot and the halt state exactly at slot q (m ∈ {2,3} states, q ∈ {1,2}, every tuple of subsets of F)', 'spec §5', cs, g);
  }
  /* completeness: every accepting run on a ∈ [0,12] satisfies every equation, and N_j is the packed nonzero indicator */
  {
    const f = [], g = []; let runs = 0, rejected = 0;
    for (const M of MACHINES) for (let a = 0; a <= 12; a++) {
      const r = run(M, a, 2000); if (!r.accepted) { rejected++; continue; } runs++;
      const c = chooseC(M, a, r.hist), digits = [...Array(M.n).keys()].map((j) => r.hist.map((h) => h[j]));
      const out = packed(M, a, r.q, c, r.states, digits);
      if (out.fails.length) f.push([M.name, a, out.fails[0]]);
      else for (let j = 0; j < M.n; j++) if (out.N[j] !== out.pk((t) => (digits[j][t] > 0 ? 1 : 0))) g.push([M.name, a, j]);
    }
    L.row('IC12', 'completeness: for every accepting run (three machines of ours, inputs a ∈ [0,12]) with c chosen so that K exceeds every register value and B > m, every equation of §5 holds (BF+1 = F+BT, D+F = KF, the masks, K·N_j = (R_j+D) AND K·F, V_i = S_i AND N_j, S_i = V_i + W_i, the register and state equations)', 'spec §§4-6', runs, f, { acceptingRuns: runs, nonAcceptingInputs: rejected });
    L.row('IC13', 'K·N_j = (R_j + D) AND (K·F) gives exactly the packed nonzero indicator Σ_t [r_j(t) > 0]·B^t', 'spec §5', runs, g);
    /* red controls on a valid encoding */
    const M = MACHINES[2], a = 3, r = run(M, a, 2000), c = chooseC(M, a, r.hist), digits = [...Array(M.n).keys()].map((j) => r.hist.map((h) => h[j]));
    const d2 = digits.map((x) => x.slice()); d2[1][2] += 1;
    const s2 = r.states.slice(); const t0 = s2.findIndex((s, t) => t > 0 && s === 1); s2[t0] = 2;
    const pk1 = packed(M, a, r.q, c, r.states, d2), pk2 = packed(M, a, r.q, c, s2, digits);
    L.control('PK1', 'machine move, a = 3: register r1\'s digit at t = 2 raised by one', 'some equation fails (the register equation for r1)', pk1.fails.join(', ') || 'nothing fails', pk1.fails.includes('register1'));
    L.control('PK2', 'machine move, a = 3: the state at the first slot in state 1 replaced by state 2', 'some equation fails', pk2.fails.join(', ') || 'nothing fails', pk2.fails.length > 0);
    let pk3 = 0; for (let x = 0; x <= 12; x++) { const rr = run(MACHINES[0], x, 2000); const out = packed(MACHINES[0], x, rr.q, chooseC(MACHINES[0], x, rr.hist), rr.states, [rr.hist.map((h) => h[0])], 'drop-BC'); if (out.fails.length) pk3++; }
    L.control('PK3', 'the register equation without its B·C_j term', 'completeness fails for machine clear at every a ≥ 1 (12 of 13 inputs)', pk3 + ' of 13 inputs fail', pk3 === 12);
  }
  /* soundness: in a box, the solutions of the equations are exactly the actual accepting run of length q */
  {
    const boxes = [{ M: MACHINES[0], as: [0, 1, 2, 3], qs: [1, 2, 3, 4, 5], cs: [1, 2] }, { M: MACHINES[1], as: [0, 1, 2, 3], qs: [1, 2, 3, 4], cs: [1, 2] }, { M: MACHINES[2], as: [0, 1], qs: [1, 2, 3, 4, 5], cs: [1] }];
    const f = []; let cand = 0, sols = 0, boxesRun = 0;
    for (const bx of boxes) for (const a of bx.as) for (const q of bx.qs) for (const c of bx.cs) {
      const M = bx.M, m = M.prog.length, Kk = 1 << c; if (!(a < Kk) || !(4 * Kk > m)) continue; boxesRun++;
      const found = [];
      const nStates = (m - 1) ** q, nDigits = Kk ** (q * M.n);
      for (let si = 0; si < nStates; si++) {
        const states = []; let x = si; for (let t = 0; t < q; t++) { states.push(x % (m - 1)); x = Math.floor(x / (m - 1)); } states.push(m - 1);
        for (let di = 0; di < nDigits; di++) {
          cand++; const digits = []; let y = di;
          for (let j = 0; j < M.n; j++) { const row = []; for (let t = 0; t < q; t++) { row.push(y % Kk); y = Math.floor(y / Kk); } row.push(0); digits.push(row); }
          if (packed(M, a, q, c, states, digits, null, true).fails.length === 0) found.push({ states, digits });
        }
      }
      sols += found.length;
      const r = run(M, a, q), want = r.halted && r.accepted && r.q === q && r.hist.every((h) => h.every((v) => v < Kk)) ? [{ states: r.states, digits: [...Array(M.n).keys()].map((j) => r.hist.map((h) => h[j])) }] : [];
      const same = found.length === want.length && found.every((s, i) => JSON.stringify(s) === JSON.stringify(want[i]));
      if (!same) f.push([M.name, a, q, c, found.length, want.length]);
    }
    L.row('IC14', 'soundness in a box: over every state sequence (halt only at slot q) and every register digit sequence (digits < K, digit q = 0), the solutions of all §5 equations are exactly the actual accepting run of length q, or none (machines clear, even, move; a ≤ 3; q ≤ 5; c ≤ 2)', 'spec §6', cand, f, { boxes: boxesRun, candidates: cand, solutions: sols });
  }
  const theirs = report.checks.find((c) => c.check === 'verify-integer-compiler.js').result;
  const replay = { verdict: 'REFUSED', reason: 'their case sets are not in the prose: integer-compiler-spec.txt states the encodings and their proofs but no ranges for the ' + theirs.digitCases + ' digit cases, the ' + theirs.bitCases.toLocaleString('en-US') + ' bit cases or the ' + theirs.packedCases.toLocaleString('en-US') + ' packed cases (which machines, inputs, q and c), and the word "backend" (' + theirs.backendCases + ' cases) is not defined in it; their smoke circuit (' + theirs.smokeCircuit.variables.toLocaleString('en-US') + ' variables, ' + theirs.smokeCircuit.nodes.toLocaleString('en-US') + ' nodes) is their compiler\'s output on a program the prose does not name. Recovering any of these means reading verify-integer-compiler.js, which this lane does not do.' };
  const out = verdicts(L, replay);
  return Object.assign({ suite: 'integer compiler', checker: 'verify-integer-compiler.js', theirs: { digitCases: theirs.digitCases, bitCases: theirs.bitCases, packedCases: theirs.packedCases, backendCases: theirs.backendCases, smokeCircuit: theirs.smokeCircuit }, notChecked: 'the alpha system itself (AFP Alpha_Sequence.alpha_dioph, eight variables) is cited, not spelled out, in the prose; IC5 checks the power macro given α. The fixed interpreter and precision machines (spec §7) are not part of this suite.' }, out);
}

/* ================================================================================================================
   Template evaluation. A node's value is (Σ_k c_k w^k) / L^e with integer c_k, w the template's one witness and L
   the lcm of the input denominators: every node is a polynomial in the inputs, so no gcd is needed until the end.
   Constructor semantics from the JSON's definitions block: psi_component = coefficient 0 or 1 of ψ_n at
   (x0 + x1√2, y0 + y1√2) by the normalized recurrences; fixed_integer = the integer expression; finite_guard_product
   = the product over a, b, c ∈ [−T, T], ab ≠ c, of Σ_j (D·X_j − (D/B_j)·A_j)² with A_j/B_j the reduced coordinates
   of ι(a), ι(b), ι(c) and D = Π_j B_j.
   ============================================================================================================== */
function makeEvaluator(spec) {
  const fc = spec.library.fixedConstants, A = K.parse(...spec.definitions.quadraticField.A);
  const fixedExpr = (e, fix) => {
    const [op, ...a] = e;
    if (op === 'literal') return BigInt(a[0]);
    if (op === 'ref') { if (Object.prototype.hasOwnProperty.call(fix, a[0])) return BigInt(fix[a[0]]); if (fc[a[0]] && fc[a[0]][0] === 'literal' && fc[a[0]][1].length < 30) return BigInt(fc[a[0]][1]); throw new Error('the fixed constant ' + a[0] + ' is neither a fixture nor a small literal'); }
    if (op === 'add') return fixedExpr(a[0], fix) + fixedExpr(a[1], fix);
    if (op === 'mul') return fixedExpr(a[0], fix) * fixedExpr(a[1], fix);
    throw new Error('an index operation this evaluator was not told about: ' + op);
  };
  /* K0 as integers over a power of a fixed base Lb: {a, b, e} = (a + b√2)/Lb^e; only + − ×, so no gcd */
  const scaledRing = (Lb) => {
    const pw = [1n], P = (e) => { while (pw.length <= e) pw.push(pw[pw.length - 1] * Lb); return pw[e]; };
    const lift = (x, e) => (e === x.e ? x : { a: x.a * P(e - x.e), b: x.b * P(e - x.e), e });
    return {
      add: (x, y) => { const e = Math.max(x.e, y.e), u = lift(x, e), v = lift(y, e); return { a: u.a + v.a, b: u.b + v.b, e }; },
      sub: (x, y) => { const e = Math.max(x.e, y.e), u = lift(x, e), v = lift(y, e); return { a: u.a - v.a, b: u.b - v.b, e }; },
      neg: (x) => ({ a: -x.a, b: -x.b, e: x.e }),
      mul: (x, y) => ({ a: x.a * y.a + 2n * x.b * y.b, b: x.a * y.b + x.b * y.a, e: x.e + y.e }),
      smul: (x, k) => ({ a: x.a * BigInt(k), b: x.b * BigInt(k), e: x.e }),
      int: (k) => ({ a: BigInt(k), b: 0n, e: 0 }),
    };
  };
  if (A.some((q) => q.d !== 1n)) throw new Error('A is not integral');
  const Aint = { a: A[0].n, b: A[1].n, e: 0 };
  const psiCache = new Map();
  const psiAt = (co) => {
    const key = co.map(Q.str).join('|');
    if (!psiCache.has(key)) {
      let Lp = 1n; for (const q of co) Lp = (Lp / gcdB(Lp, q.d)) * q.d;
      const s = (q) => q.n * (Lp / q.d), R = scaledRing(Lp);
      psiCache.set(key, { Lp, tab: psiTable(Aint, { a: s(co[0]), b: s(co[1]), e: 1 }, { a: s(co[2]), b: s(co[3]), e: 1 }, undefined, R) });
    }
    return psiCache.get(key);
  };
  const iotaCache = new Map();
  const iota = (n) => { if (!iotaCache.has(n)) iotaCache.set(n, E.code(E.mul(n, P0))); return iotaCache.get(n); };
  const guard = (T, X) => {
    let prod = Q1;
    for (let a = -T; a <= T; a++) for (let b = -T; b <= T; b++) for (let c = -T; c <= T; c++) {
      if (a * b === c) continue;
      const codes = [...iota(a), ...iota(b), ...iota(c)];
      const Dd = codes.reduce((s, q) => s * q.d, 1n);
      let sum = Q0;
      for (let j = 0; j < 15; j++) { const t = Q.sub(Q.mul(Q.make(Dd), X[j]), Q.make((Dd / codes[j].d) * codes[j].n)); sum = Q.add(sum, Q.mul(t, t)); }
      prod = Q.mul(prod, sum);
    }
    return prod;
  };
  const byName = (name) => { const i = spec.library.templates.findIndex((t) => t.name === name); if (i < 0) throw new Error('no template ' + name); return i; };
  /* evaluate template `ti` at rational parameters; returns the polynomial (integer coefficients, positive scale dropped)
     whose rational roots are the witnesses: the root node's square root when the root is mul(k, k) */
  const evaluate = (ti, params, fix) => {
    const t = spec.library.templates[ti], pc = t.parameterCount, nw = t.variableCount - pc;
    if (params.length !== pc) throw new Error(t.name + ': ' + params.length + ' parameters for ' + pc);
    if (nw > 1) throw new Error(t.name + ' has ' + nw + ' witnesses; this evaluator solves one');
    let Lc = 1n; for (const q of params) Lc = (Lc / gcdB(Lc, q.d)) * q.d;
    const Lp = [1n]; const Lpow = (e) => { while (Lp.length <= e) Lp.push(Lp[Lp.length - 1] * Lc); return Lp[e]; };
    const fromQ = (q) => { let e = 0; while (Lpow(e) % q.d !== 0n) { e++; if (e > 4096) throw new Error('a denominator not dividing a power of L'); } return { c: [q.n * (Lpow(e) / q.d)], e }; };
    const trim = (c) => { let k = c.length; while (k > 0 && c[k - 1] === 0n) k--; return c.slice(0, k); };
    const lift = (x, e) => (x.e === e ? x.c : x.c.map((v) => v * Lpow(e - x.e)));
    const add = (x, y) => { const e = Math.max(x.e, y.e), a = lift(x, e), b = lift(y, e), c = []; for (let i = 0; i < Math.max(a.length, b.length); i++) c.push((a[i] || 0n) + (b[i] || 0n)); return { c: trim(c), e }; };
    const mul = (x, y) => { if (!x.c.length || !y.c.length) return { c: [], e: 0 }; const c = Array(x.c.length + y.c.length - 1).fill(0n); for (let i = 0; i < x.c.length; i++) for (let j = 0; j < y.c.length; j++) c[i + j] += x.c[i] * y.c[j]; return { c: trim(c), e: x.e + y.e }; };
    const constOf = (x) => { if (x.c.length > 1) throw new Error('a constructor argument depends on the witness'); return Q.make(x.c.length ? x.c[0] : 0n, Lpow(x.e)); };
    const v = [];
    for (const nd of t.nodes) {
      const a = nd.args; let r;
      switch (nd.op) {
        case 'var': if (a[0] < pc) r = fromQ(params[a[0]]); else if (a[0] === pc) r = { c: [0n, 1n], e: 0 }; else throw new Error('a variable index out of range'); break;
        case 'const': r = { c: trim([BigInt(a[0])]), e: 0 }; break;
        case 'add': r = add(v[a[0]], v[a[1]]); break;
        case 'mul': r = mul(v[a[0]], v[a[1]]); break;
        case 'psi_component': {
          if (a.length !== 6 || (a[5] !== 0 && a[5] !== 1)) throw new Error('a malformed psi_component binding');
          const n = fixedExpr(a[0], fix); if (n < -10000n || n > 10000n) throw new Error('a psi index outside [−10^4, 10^4]: ' + n);
          const { Lp, tab } = psiAt(a.slice(1, 5).map((k) => constOf(v[k])));
          if (Lc % Lp !== 0n) throw new Error('a psi base not dividing the evaluation base');
          const val = tab.psi(Number(n)), comp = a[5] === 0 ? val.a : val.b;
          r = { c: trim([comp * (Lc / Lp) ** BigInt(val.e)]), e: val.e }; break;
        }
        case 'fixed_integer': if (a.length !== 1) throw new Error('a malformed fixed_integer binding'); r = { c: trim([fixedExpr(a[0], fix)]), e: 0 }; break;
        case 'finite_guard_product': {
          if (a.length !== 16) throw new Error('a malformed finite_guard_product binding'); const T = fixedExpr(a[0], fix); if (T < 0n || T > 3n) throw new Error('a guard cutoff outside [0, 3]');
          r = fromQ(guard(Number(T), a.slice(1).map((k) => constOf(v[k])))); break;
        }
        default: throw new Error('a node this evaluator does not evaluate: ' + nd.op);
      }
      v.push(r);
    }
    const root = t.nodes[t.root];
    return root.op === 'mul' && root.args[0] === root.args[1] ? { poly: v[root.args[0]].c, squareRoot: true } : { poly: v[t.root].c, squareRoot: false };
  };
  /* rational witness? exact, from integer coefficients */
  const witness = ({ poly }) => {
    const c = poly;
    if (!c.length) return { kind: 'any' };
    if (c.length === 1) return { kind: 'none' };
    if (c.length === 2) return { kind: 'one' };                         /* a linear polynomial has its rational root */
    if (c.length === 3) {
      const [g, b, a] = c, disc = b * b - 4n * a * g;
      if (disc < 0n) return { kind: 'none', reason: 'discriminant < 0' };
      const s = isqrt(disc); return s * s === disc ? { kind: 'one', reason: disc === 0n ? 'double root' : 'two rational roots' } : { kind: 'none', reason: 'irrational roots only' };
    }
    const s = solveWitness(c.map((x) => Q.make(x)));
    if (s.kind === 'other') throw new Error('a witness polynomial of degree ' + (c.length - 1) + ' with real roots this module does not pin down');
    return { kind: s.kind };
  };
  return { evaluate, witness, byName, iota, fixedExpr, A, fc };
}
function gcdB(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }
function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); if (x === 0n) x = 1n; for (;;) { const y = (x + n / x) >> 1n; if (y >= x) { while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; } x = y; } }
const accepted = (w) => w.kind === 'one' || w.kind === 'any';

/* ================================================================================================================
   SUITE 2: division polynomials over Q(√2)
   ============================================================================================================== */
function suiteDP(spec, report, ev) {
  const L = ledger();
  const Aj = K.parse(...spec.definitions.quadraticField.A);
  const fp = spec.definitions.fixedPointCodes.P.map(Q.parse);
  L.row('DP0', 'the JSON\'s A (definitions.quadraticField.A) is −d² for d = 75 − 53√2 (TeX line 258), and its fixedPointCodes.P is the code of P_0 (TeX line 262), which lies on E', 'TeX 256-263; JSON definitions', 3, [K.eq(Aj, A_TEX) ? null : 'A', codeEq(fp, E.code(P0)) ? null : 'P', E.onCurve(P0) ? null : 'onCurve'].filter(Boolean));
  const T0 = { x: K.int(0), y: K.int(0) };
  const points = [['P0', P0], ['[2]P0', E.mul(2, P0)], ['[-3]P0', E.mul(-3, P0)], ['P0+(0,0)', E.add(P0, T0)]];
  const NS = []; for (let n = -10; n <= 10; n++) NS.push(n);
  const theirN = report.checks.find((c) => c.check === 'verify-division-polynomials.js').result.artifacts.map((a) => a.n);
  const f1 = [], f2 = [], f3 = [], f4 = [], f5 = [], f6 = [];
  let exact = 0, nonzero = 0, atTheirN = 0;
  const variantBad = { 'f4-without-2': 0, 'odd-parity-swapped': 0, 'omega-sign': 0 };
  for (const [label, Pt] of points) {
    const tab = psiTable(A_TEX, Pt.x, Pt.y);
    const mult = new Map([[0, null]]); let acc = null;
    for (let k = 1; k <= 10; k++) { acc = E.add(acc, Pt); mult.set(k, acc); mult.set(-k, E.neg(acc)); }
    for (const n of NS) {
      exact++; if (theirN.includes(n)) atTheirN++;
      const dd = E.code(mult.get(n)), js = iotaByPsi(A_TEX, Pt, n, undefined, tab);
      if (!codeEq(dd, js)) f1.push([label, n]);
      if (n === 0) continue;
      nonzero++;
      const g = tab.psi(n), g2 = K.mul(g, g), g3 = K.mul(g2, g), g4 = K.mul(g2, g2), X = mult.get(n).x, Y = mult.get(n).y;
      const phiNum = K.sub(K.mul(Pt.x, g2), K.mul(tab.psi(n + 1), tab.psi(n - 1)));
      const om = K.div(K.sub(K.mul(tab.psi(n + 2), K.mul(tab.psi(n - 1), tab.psi(n - 1))), K.mul(tab.psi(n - 2), K.mul(tab.psi(n + 1), tab.psi(n + 1)))), K.scale(Pt.y, Q.int(4)));
      if (!K.eq(K.div(phiNum, g2), X) || !K.eq(K.div(om, g3), Y)) f2.push([label, n]);
      if (!K.eq(K.scale(K.mul(Y, g4), Q.int(2)), tab.psi(2 * n))) f3.push([label, n]);
      if (!K.eq(K.mul(X, g2), phiNum)) f4.push([label, n]);
      if (K.eq(K.mul(K.add(X, K.int(1)), g2), phiNum)) f5.push([label, n]);
      if (K.eq(K.scale(K.mul(K.add(Y, K.int(1)), g4), Q.int(2)), tab.psi(2 * n))) f6.push([label, n]);
      if (label === 'P0' && n >= 1 && n <= 8) for (const vname of Object.keys(variantBad)) if (!codeEq(dd, iotaByPsi(A_TEX, Pt, n, vname))) variantBad[vname]++;
    }
  }
  L.row('DP1', 'ι(n) by the JSON\'s fixedPointCodes (x_n = x − ψ_{n+1}ψ_{n−1}/ψ_n², y_n = ψ_{2n}/(2ψ_n⁴), y negated for −n, ι(0) = (1,0,0,0,0)) with the normalized recurrences equals [n]P by independent affine double-and-add over Q(√2) (n ∈ [−10,10]; P ∈ {P0, [2]P0, [−3]P0, P0+(0,0)})', 'JSON definitions.psiNormalization, fixedPointCodes; TeX 206-233', exact, f1, { atTheirNValues: atTheirN, theirNValues: theirN });
  L.row('DP2', 'the TeX\'s Jacobian convention: x([n]P) = φ_n/ψ_n² with φ_n = xψ_n² − ψ_{n+1}ψ_{n−1}, and y([n]P) = ω_n/ψ_n³ with ω_n = (ψ_{n+2}ψ_{n−1}² − ψ_{n−2}ψ_{n+1}²)/(4y), the minus sign as printed', 'TeX 222-230', nonzero, f2);
  L.row('DP3', 'the fixed-scalar ordinate equation 2·y([n]P)·ψ_n(P)⁴ = ψ_{2n}(P)', 'TeX 231-232', nonzero, f3);
  L.row('DP4', 'the abscissa equation x([n]P)·ψ_n² = xψ_n² − ψ_{n+1}ψ_{n−1}', 'TeX 222-226', nonzero, f4);
  L.row('DP5', 'changed-x rejection: x([n]P) + 1 does not satisfy the abscissa equation', 'their "changed-x" class, on our cases', nonzero, f5);
  L.row('DP6', 'changed-y rejection: y([n]P) + 1 does not satisfy the ordinate equation', 'their "changed-y" class, on our cases', nonzero, f6);
  L.control('DV1', 'f_4 without its factor 2', 'disagrees with double-and-add for some n ∈ [1,8] at P0', variantBad['f4-without-2'] + ' of 8 disagree', variantBad['f4-without-2'] > 0);
  L.control('DV2', 'the odd recurrence\'s parity rule swapped (D·L − R for odd m)', 'disagrees for some n ∈ [1,8]', variantBad['odd-parity-swapped'] + ' of 8 disagree', variantBad['odd-parity-swapped'] > 0);
  L.control('DV3', 'ω_n with a plus sign (the sign TeX line 227 warns about)', 'disagrees for some n ∈ [1,8]', variantBad['omega-sign'] + ' of 8 disagree', variantBad['omega-sign'] > 0);

  /* the SAVED templates: multiply.scalar (fixed index cstar) and scalar.integer_constant_0/1/2, read from the JSON */
  const ms = ev.byName('multiply.scalar');
  const t9 = spec.library.templates[ms];
  if (JSON.stringify(t9.metadata.fixedIndex) !== JSON.stringify(['ref', 'cstar'])) die('multiply.scalar does not read cstar');
  const ka = [1, 2, -3];
  const g1 = [], g2 = [], g3 = [], g4 = [], g5 = [];
  let tcases = 0;
  const bump = (code, i) => code.map((q, j) => (j === i ? Q.add(q, Q1) : q));
  for (let c = 1; c <= 8; c++) for (const k of ka) {
    tcases++;
    const p = ev.iota(k), r = ev.iota(c * k), fx = { cstar: c };
    if (!accepted(ev.witness(ev.evaluate(ms, [...p, ...r], fx)))) g1.push([c, k]);
    if (accepted(ev.witness(ev.evaluate(ms, [...p, ...bump(r, 1)], fx)))) g2.push([c, k]);
    if (accepted(ev.witness(ev.evaluate(ms, [...p, ...bump(r, 3)], fx)))) g3.push([c, k]);
    if (accepted(ev.witness(ev.evaluate(ms, [...p, ...ev.iota((c + 1) * k)], fx)))) g4.push([c, k]);
  }
  const idA = accepted(ev.witness(ev.evaluate(ms, [...ev.iota(0), ...ev.iota(0)], { cstar: 3 })));
  const idR = accepted(ev.witness(ev.evaluate(ms, [...ev.iota(0), ...ev.iota(1)], { cstar: 3 })));
  L.row('DP7', 'the saved template multiply.scalar ("r=[fixed positive index]p") with c ∈ [1,8] for cstar, evaluated by our reader with our ψ semantics: at p = ι(k), r = ι(ck) it has a rational witness (k ∈ {1, 2, −3})', 'JSON template multiply.scalar', tcases, g1);
  L.row('DP8', 'the same template rejects (no rational witness) r with x0 + 1', 'their changed-x class, on the saved template', tcases, g2);
  L.row('DP9', 'the same template rejects r with y0 + 1', 'their changed-y class, on the saved template', tcases, g3);
  L.row('DP10', 'the same template rejects the wrong multiple r = ι((c+1)k)', 'the template\'s stated meaning', tcases, g4);
  L.row('DP11', 'its identity branch: p = r = ι(0) accepted, p = ι(0) with r = ι(1) rejected (cstar = 3)', 'JSON template multiply.scalar', 2, [idA ? null : 'identity rejected', idR ? 'ι(0) ↦ ι(1) accepted' : null].filter(Boolean));
  const scal = [];
  for (const j of [0, 1, 2]) {
    const ti = ev.byName('scalar.integer_constant_' + j), t = spec.library.templates[ti];
    if (JSON.stringify(t.metadata.fixedIndex) !== JSON.stringify(['ref', 'integer_constant_' + j])) die('scalar.integer_constant_' + j + ' does not read its own constant');
    const n = Number(ev.fixedExpr(['ref', 'integer_constant_' + j], {}));
    for (const k of ka) {
      const p = ev.iota(k), r = ev.iota(n * k);
      const ok = accepted(ev.witness(ev.evaluate(ti, [...p, ...r], {}))), cx = accepted(ev.witness(ev.evaluate(ti, [...p, ...bump(r, 1)], {}))), cy = accepted(ev.witness(ev.evaluate(ti, [...p, ...bump(r, 3)], {})));
      scal.push({ template: t.name, index: n, k, ok, cx, cy });
      if (!ok || cx || cy) g5.push([t.name, k]);
    }
  }
  L.row('DP12', 'the saved templates scalar.integer_constant_0/1/2 at their own indices (' + [...new Set(scal.map((s) => s.index))].join(', ') + '): ι(k) ↦ ι(nk) accepted, the changed-x and changed-y outputs rejected (k ∈ {1, 2, −3})', 'JSON templates scalar.integer_constant_*', scal.length * 3, g5);
  const dp = report.checks.find((c) => c.check === 'verify-division-polynomials.js').result;
  const replay = { verdict: 'REFUSED', reason: 'their ' + dp.exactCases + ' exact, ' + dp.changedXCases + ' changed-x and ' + dp.changedYCases + ' changed-y cases are evaluations of eleven graphs (n ∈ {' + theirN.join(', ') + '}, ' + dp.artifacts.map((a) => a.nodes).join('/') + ' nodes) that their code generates; the graphs are not in the saved JSON, and the prose states neither the evaluation points per n nor why 30 changed-y cases rather than 44. The n-values come from their report; our ' + exact + ' cases contain ' + atTheirN + ' at those n-values by our choice of four points, which is not a reproduction of their set.' };
  const out = verdicts(L, replay);
  return Object.assign({ suite: 'division polynomials', checker: 'verify-division-polynomials.js', theirs: { exactCases: dp.exactCases, changedXCases: dp.changedXCases, changedYCases: dp.changedYCases, nValues: theirN, graphNodes: dp.artifacts.map((a) => a.nodes) }, notRun: 'scalar.integer_constant_4 (index 1399), attempted as A2 pre-registered, NOT RUN: a scratch probe outside this tool computed ψ_1398, ψ_1399, ψ_1400 and ψ_2798 at P_0 with the same recurrence over integers on a power of 32 in 8 s (ψ_2798 has 51,680,860 bits), but the rest, [1399]P_0 by affine double-and-add with reduced rationals of ~10^7 bits and the template\'s 137 nodes over numbers near 10^8 bits, was not run within the lane\'s time budget on this Mac. integer_constant_3 has a 3,181,317-digit index and cannot be evaluated by anyone.', savedTemplateCases: scal }, out);
}

/* ================================================================================================================
   SUITE 3: finite polynomial expressions (fixtures cstar, ell, T)
   ============================================================================================================== */
function suiteFE(spec, report, ev, lane1) {
  const L = ledger();
  const fe = report.checks.find((c) => c.check === 'verify-finite-polynomial-expressions.js').result;
  /* (a) the variable counts */
  const f1 = [];
  for (const vc of fe.variableCounts) {
    const t = spec.library.templates[ev.byName(vc.name)], l1 = lane1.templates.find((x) => x.name === vc.name);
    const ours = { parameters: t.parameterCount, witnesses: Number(l1.witnesses), nodes: t.nodes.length, calls: t.nodes.filter((n) => n.op === 'call').length };
    for (const k of ['parameters', 'witnesses', 'nodes', 'calls']) if (ours[k] !== vc[k]) f1.push([vc.name, k, vc[k], ours[k]]);
  }
  L.row('FE1', 'the parameter, witness, node and call counts of multiply and natural equal their variableCounts (witnesses from lane 1\'s derived counts, certs/zq-recount.json)', 'their report; JSON templates', fe.variableCounts.length * 4, f1);
  /* (b) which fixture constants each named template reaches, against the equality pattern of their hashes */
  /* the fixed constants a template's constructor nodes read: its own nodes only (local), or through its calls too */
  const reach = (ti, through, seen = new Set()) => {
    if (seen.has(ti)) return new Set(); seen.add(ti);
    const out = new Set(), refs = (e) => { if (!Array.isArray(e)) return; if (e[0] === 'ref') out.add(e[1]); else e.slice(1).forEach(refs); };
    for (const nd of spec.library.templates[ti].nodes) {
      if (nd.op === 'fixed_integer' || nd.op === 'psi_component' || nd.op === 'finite_guard_product') refs(nd.args[0]);
      if (through && nd.op === 'call') for (const x of reach(nd.args[0], true, seen)) out.add(x);
    }
    return out;
  };
  const fixtures = [...new Set(fe.checks.map((c) => JSON.stringify(c.fixture)))].map((s) => JSON.parse(s));
  const differs = Object.keys(fixtures[0]).filter((k) => fixtures.some((f) => f[k] !== fixtures[0][k]));
  const f2 = [], reachRows = [];
  let transitiveFits = true;
  for (const name of [...new Set(fe.checks.map((c) => c.template))]) {
    const hs = fe.checks.filter((c) => c.template === name).map((c) => c.hash), equal = new Set(hs).size === 1;
    const own = [...reach(ev.byName(name), false)].filter((k) => differs.includes(k)), all = [...reach(ev.byName(name), true)].filter((k) => differs.includes(k));
    reachRows.push({ template: name, ownNodesRead: own, throughCallsRead: all, theirHashesEqual: equal });
    if (equal !== (own.length === 0)) f2.push([name, own, equal]);
    if (equal !== (all.length === 0)) transitiveFits = false;
  }
  L.row('FE2', 'the fixtures differ in ' + differs.join(', ') + '; their hashes are equal across the two fixtures exactly for the templates whose OWN nodes read none of these constants (natural), so their expansion hashes cover each template\'s own nodes with calls left unexpanded. Re-read after the first run: the reading through calls (natural reaches cstar, ell and T via multiply) ' + (transitiveFits ? 'also fits' : 'does not fit natural\'s equal hashes') + '. A finding about what their check covers, not a refutation: their natural checks do not exercise the fixture constants.', 'their report hashes; JSON constructor nodes and calls', reachRows.length, f2, { reach: reachRows, throughCallsReadingFits: transitiveFits });
  /* (c) multiply.guard at the fixture cutoffs T ∈ {0, 1}, on all 27 code triples in [−1,1]³ */
  const mg = ev.byName('multiply.guard');
  if (JSON.stringify(spec.library.templates[mg].metadata.cutoff) !== JSON.stringify(['ref', 'T'])) die('multiply.guard does not read T');
  const f3 = []; let gc = 0;
  for (const T of [0, 1]) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    gc++; const acc = accepted(ev.witness(ev.evaluate(mg, [...ev.iota(a), ...ev.iota(b), ...ev.iota(c)], { T })));
    const want = T === 0 ? true : a * b === c;
    if (acc !== want) f3.push([T, a, b, c, acc]);
  }
  L.row('FE3', 'the saved template multiply.guard (guard·w = 1) at T = 1 accepts exactly the 9 true triples ab = c among the 27 code triples in [−1,1]³ and rejects the 18 false ones; at T = 0 (the empty product, 1) it accepts all 27', 'JSON definitions.finiteGuard; template multiply.guard', gc, f3);
  const out1 = accepted(ev.witness(ev.evaluate(mg, [...ev.iota(2), ...ev.iota(1), ...ev.iota(1)], { T: 1 })));
  const out2 = accepted(ev.witness(ev.evaluate(mg, [...ev.iota(2), ...ev.iota(1), ...ev.iota(1)], { T: 2 })));
  L.row('FE4', 'the guard is a box guard: at T = 1 the false triple (2, 1, 1), outside [−1,1]³, is accepted; at T = 2, where it lies in the box, it is rejected (TeX lines 247-252: bounding T does not exclude every false triple)', 'TeX 247-252; template multiply.guard', 2, [out1 ? null : 'T=1 rejects', out2 ? 'T=2 accepts' : null].filter(Boolean));
  /* (d) multiply.scalar at the two fixture values of cstar */
  const ms = ev.byName('multiply.scalar'), f5 = []; let mc = 0;
  for (const c of [...new Set(fixtures.map((f) => Number(f.cstar)))]) for (const k of [1, 2, -3]) {
    mc++; const ok = accepted(ev.witness(ev.evaluate(ms, [...ev.iota(k), ...ev.iota(c * k)], { cstar: c }))), bad = accepted(ev.witness(ev.evaluate(ms, [...ev.iota(k), ...ev.iota(c * k + 1)], { cstar: c })));
    if (!ok || bad) f5.push([c, k]);
  }
  L.row('FE5', 'multiply.scalar at the fixture values cstar ∈ {4, 8}: ι(k) ↦ ι(c·k) accepted and ι(k) ↦ ι(c·k + 1) rejected (k ∈ {1, 2, −3})', 'their fixtures; JSON template multiply.scalar', mc, f5);
  /* red controls: malformed bindings must be refused by our reader */
  const planted = (ti, params, fix, mutate) => { const s2 = { library: { templates: spec.library.templates.slice(), fixedConstants: spec.library.fixedConstants }, definitions: spec.definitions }; const t = JSON.parse(JSON.stringify(spec.library.templates[ti])); mutate(t); s2.library.templates[ti] = t; try { makeEvaluator(s2).evaluate(ti, params, fix); return 'evaluated'; } catch (e) { return 'refused: ' + e.message; } };
  const psiNode = spec.library.templates[ms].nodes.findIndex((n) => n.op === 'psi_component');
  const guardNode = spec.library.templates[mg].nodes.findIndex((n) => n.op === 'finite_guard_product');
  const sp = [...ev.iota(1), ...ev.iota(4)], gp = [...ev.iota(1), ...ev.iota(1), ...ev.iota(1)];
  const m1 = planted(ms, sp, { cstar: 4 }, (t) => { t.nodes[psiNode].args[5] = 2; });
  const m2 = planted(ms, sp, { cstar: 4 }, (t) => { t.nodes[psiNode].args = t.nodes[psiNode].args.slice(0, 5); });
  const m3 = planted(ms, sp, { cstar: 4 }, (t) => { t.nodes[psiNode].args[0] = ['ref', 'M']; });
  const m4 = planted(mg, gp, { T: 1 }, (t) => { t.nodes[guardNode].args = t.nodes[guardNode].args.slice(0, 15); });
  L.control('FB1', 'a psi_component asking for component 2', 'our reader refuses it', m1, m1.startsWith('refused'));
  L.control('FB2', 'a psi_component with four arguments', 'our reader refuses it', m2, m2.startsWith('refused'));
  L.control('FB3', 'a psi_component whose index is the astronomically large fixedConstant M', 'our reader refuses it (not a fixture, not a small literal)', m3, m3.startsWith('refused'));
  L.control('FB4', 'a finite_guard_product with fourteen coordinate nodes', 'our reader refuses it (the definition names fifteen)', m4, m4.startsWith('refused'));
  const replay = { verdict: 'REFUSED', reason: 'their eight checks are sha256 hashes of their expander\'s output (' + fe.checks.length + ' template-fixture pairs over fixtures ' + fixtures.map((f) => JSON.stringify(f)).join(' and ') + '), and neither the serialization behind the hashes nor the four malformed bindings they reject is stated in prose or data. FB1-FB4 are four malformed bindings of OUR choosing that our reader refuses; they are not theirs.' };
  const out = verdicts(L, replay);
  return Object.assign({ suite: 'finite polynomial expressions', checker: 'verify-finite-polynomial-expressions.js', theirs: { checks: fe.checks.length, fixtures, invalidBindingsRejected: fe.invalidBindingsRejected, variableCounts: fe.variableCounts } }, out);
}

/* ================================================================================================================
   SUITE 4: the six-contact identities (TeX sec:height)
   ============================================================================================================== */
function suiteSC(report, review) {
  const L = ledger();
  const sc = report.checks.find((c) => c.check === 'verify-six-contact.js').result;
  /* integer polynomials, ascending BigInt arrays */
  const trim = (p) => { let k = p.length; while (k > 1 && p[k - 1] === 0n) k--; return p.slice(0, k); };
  const add = (a, b) => trim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0n) + (b[i] || 0n)));
  const mul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0n); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return trim(r); };
  const scl = (a, k) => trim(a.map((x) => x * k));
  const pw = (a, e) => { let r = [1n]; for (let i = 0; i < e; i++) r = mul(r, a); return r; };
  const eqp = (a, b) => JSON.stringify(trim(a).map(String)) === JSON.stringify(trim(b).map(String));
  const l1 = (a) => a.reduce((s, x) => s + (x < 0n ? -x : x), 0n);
  const strs = (a) => a.map(String);
  const der = (a) => trim(a.slice(1).map((x, i) => x * BigInt(i + 1)));
  /* determinant by fraction-free Bareiss */
  const det = (M) => { const n = M.length; const A = M.map((r) => r.slice()); let sign = 1n, prev = 1n; for (let k = 0; k < n - 1; k++) { if (A[k][k] === 0n) { const s = A.findIndex((r, i) => i > k && r[k] !== 0n); if (s < 0) return 0n; [A[k], A[s]] = [A[s], A[k]]; sign = -sign; } for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / prev; prev = A[k][k]; } return sign * A[n - 1][n - 1]; };
  const res = (f, g) => { const m = f.length - 1, n = g.length - 1, N = m + n, M = []; for (let i = 0; i < n; i++) { const r = Array(N).fill(0n); for (let k = 0; k <= m; k++) r[i + k] = f[m - k]; M.push(r); } for (let i = 0; i < m; i++) { const r = Array(N).fill(0n); for (let k = 0; k <= n; k++) r[i + k] = g[n - k]; M.push(r); } return det(M); };
  const disc = (f) => { const n = f.length - 1, r = res(f, der(f)), s = (n * (n - 1) / 2) % 2 ? -1n : 1n; return (s * r) / f[n]; };
  const support = (x) => { let v = x < 0n ? -x : x; const ex = {}; for (const p of [2n, 3n, 5n, 7n, 11n, 13n]) { let e = 0; while (v % p === 0n && v) { v /= p; e++; } if (e) ex[String(p)] = e; } return { ex, rest: v }; };
  /* the objects, typed from the TeX (lines 379-393, 510-514) */
  const contacts = [0n, -15n, -20n, -24n, -30n, -60n];
  const Fp = contacts.reduce((acc, c) => mul(acc, [-c, 1n]), [1n]);
  const G = [3600n, 300n, 7n], H1 = [-1800n, -60n, 1n], H2 = [3600n, 480n, 13n], H3 = [7200n, 600n, 11n], H = mul(mul(H1, H2), H3);
  const rep = [];
  const put = (what, theirs, ours) => rep.push({ what, theirs, ours, agree: JSON.stringify(theirs) === JSON.stringify(ours) });
  put('contacts', sc.contacts, strs(contacts));
  put('F (ascending)', sc.F, strs(Fp));
  put('G', sc.G, strs(G));
  put('H', sc.H, strs(H));
  const num = scl(mul(Fp, Fp), 57600n), den = pw(G, 6);
  put('numeratorNorm = ‖57600·F²‖₁', sc.numeratorNorm, String(l1(num)));
  put('denominatorNorm = ‖G⁶‖₁', sc.denominatorNorm, String(l1(den)));
  /* the quaternion algebra B = (2, −3), O = Z⟨1, i, (1+j)/2, (i+ij)/2⟩, μ = 2j + ij (TeX 405-412) */
  const al = Q.int(2), be = Q.int(-3);
  const qm = (x, y) => [
    Q.add(Q.add(Q.mul(x[0], y[0]), Q.mul(al, Q.mul(x[1], y[1]))), Q.sub(Q.mul(be, Q.mul(x[2], y[2])), Q.mul(Q.mul(al, be), Q.mul(x[3], y[3])))),
    Q.add(Q.add(Q.mul(x[0], y[1]), Q.mul(x[1], y[0])), Q.sub(Q.mul(be, Q.mul(x[3], y[2])), Q.mul(be, Q.mul(x[2], y[3])))),
    Q.add(Q.add(Q.mul(x[0], y[2]), Q.mul(x[2], y[0])), Q.sub(Q.mul(al, Q.mul(x[1], y[3])), Q.mul(al, Q.mul(x[3], y[1])))),
    Q.add(Q.add(Q.mul(x[0], y[3]), Q.mul(x[3], y[0])), Q.sub(Q.mul(x[1], y[2]), Q.mul(x[2], y[1]))),
  ];
  const qc = (x) => [x[0], Q.neg(x[1]), Q.neg(x[2]), Q.neg(x[3])];
  const nrd = (x) => qm(x, qc(x))[0];
  const trd = (x) => Q.mul(Q.int(2), x[0]);
  const h = Q.make(1n, 2n);
  const basis = [[Q1, Q0, Q0, Q0], [Q0, Q1, Q0, Q0], [h, Q0, h, Q0], [Q0, h, Q0, h]];
  const gram = (mu) => { const mi = qm(qc(mu), [Q.inv(nrd(mu)), Q0, Q0, Q0]); return basis.map((ea) => basis.map((eb) => trd(qm(mi, qm(ea, qc(eb)))))); };
  const mu = [Q0, Q0, Q.int(2), Q1];
  const gm = gram(mu).map((r) => r.map(Q.str));
  put('gram', sc.gram, gm);
  /* coordinates in the basis: x = a + bi + cj + dk = c0 + c1 i + c2 (1+j)/2 + c3 (i+ij)/2 ⇒ c2 = 2c, c3 = 2d, c0 = a − c, c1 = b − d */
  const coords = (x) => [Q.sub(x[0], x[2]), Q.sub(x[1], x[3]), Q.mul(Q.int(2), x[2]), Q.mul(Q.int(2), x[3])];
  const fromC = (c) => basis.reduce((s, e, i) => s.map((v, k) => Q.add(v, Q.mul(e[k], Q.int(c[i])))), [Q0, Q0, Q0, Q0]);
  const resultants = [];
  const quads = [['G', G], ['H1', H1], ['H2', H2], ['H3', H3]];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) resultants.push({ i, j, resultant: String(res(quads[i][1], quads[j][1])) });
  put('resultants of (G, H1, H2, H3) = (7u²+300u+3600, u²−60u−1800, 13u²+480u+3600, 11u²+600u+7200), the order of TeX lines 389 and 512', sc.resultants, resultants);
  /* O/3O */
  const elems = []; for (let a = 0; a < 81; a++) elems.push([a % 3, Math.floor(a / 3) % 3, Math.floor(a / 9) % 3, Math.floor(a / 27) % 3]);
  const mod3 = (c) => c.map((q) => { if (q.d !== 1n) throw new Error('a product left the order'); return Number(((q.n % 3n) + 3n) % 3n); });
  const prodC = (x, y) => mod3(coords(qm(fromC(x), fromC(y))));
  let units = 0, normOne = 0;
  for (const x of elems) { const isUnit = elems.some((y) => { const p = prodC(x, y); return p[0] === 1 && p[1] === 0 && p[2] === 0 && p[3] === 0; }); if (isUnit) { units++; const nn = nrd(fromC(x)); if (nn.d !== 1n) throw new Error('a non-integral reduced norm'); if (((nn.n % 3n) + 3n) % 3n === 1n) normOne++; } }
  put('levelThree.ringSize = |O/3O|', sc.levelThree.ringSize, elems.length);
  put('levelThree.unitCount = |(O/3O)*| (units found by search for an inverse)', sc.levelThree.unitCount, units);
  put('levelThree.normOneCount = #{units with nrd ≡ 1 (mod 3)}', sc.levelThree.normOneCount, normOne);
  const matchedOnly = [
    { what: 'levelThree.effectiveLevelIndexBound', theirs: sc.levelThree.effectiveLevelIndexBound, ours: normOne, reading: 'equals our normOneCount; the prose does not say what this field bounds' },
    { what: 'levelThree.effectiveNormalizerIndexBound', theirs: sc.levelThree.effectiveNormalizerIndexBound, ours: 4 * normOne, reading: 'equals 4 × normOneCount, with 4 = |N/(A_f* K_0)| of TeX line 429; the prose does not say what this field bounds' },
  ].map((m) => Object.assign(m, { agree: m.theirs === m.ours }));
  const repBad = rep.filter((r) => !r.agree);
  L.row('SC0', 'every value their report lists for the six-contact checker (' + rep.length + ' fields), recomputed from the manuscript\'s definitions', 'their report; TeX 377-560, 905-965', rep.length, repBad.map((r) => r.what));
  /* the manuscript's finite statements */
  const ident = add(pw(G, 6), scl(mul(Fp, Fp), -97200n));
  L.row('SC1', 'G⁶ − 97200·F² = H²', 'TeX line 514', 1, eqp(ident, mul(H, H)) ? [] : ['identity fails']);
  L.row('SC2', 'J(u) + 16/27 = 16H²/(27G⁶) for J = −57600F²/G⁶, i.e. 16G⁶ − 27·57600·F² = 16H², so J takes 0, ∞, −16/27 on F, G, H with indices 2, 6, 2', 'TeX lines 510-515', 1, eqp(add(scl(den, 16n), scl(num, -27n)), scl(mul(H, H), 16n)) ? [] : ['pullback fails']);
  const dF = disc(Fp), dG = disc(G), dH = disc(H), rFG = res(Fp, G), rFH = res(Fp, H), rGH = res(G, H);
  L.row('SC3', 'disc(G) = −10800 < 0', 'TeX line 542', 1, dG === -10800n ? [] : ['disc(G) = ' + dG]);
  const supp = [['disc F', dF], ['disc G', dG], ['disc H', dH], ['Res(F,G)', rFG], ['Res(F,H)', rFH], ['Res(G,H)', rGH], ...resultants.map((r) => ['Res(' + quads[r.i][0] + ',' + quads[r.j][0] + ')', BigInt(r.resultant)]), ['lc F', 1n], ['lc G', 7n], ['lc H', 143n]];
  L.row('SC4', 'the discriminants and resultants are nonzero (F, G, H squarefree and pairwise coprime) and have prime support at most 13', 'TeX lines 516-517', supp.length, supp.filter(([, v]) => v === 0n || support(v).rest !== 1n).map(([k]) => k), { factorizations: supp.map(([k, v]) => ({ what: k, sign: v < 0n ? -1 : 1, exponents: support(v).ex })) });
  const tame = [[4, 2], [6, 6], [2, 2]].map(([e, a]) => e / gcdN(e, a));
  L.row('SC5', 'tame normalization e/gcd(e, a) with branch indices (4, 6, 2) and pullback indices (2, 6, 2) leaves (2, 1, 1)', 'TeX lines 515-516', 1, JSON.stringify(tame) === '[2,1,1]' ? [] : ['got ' + tame]);
  const G0 = gram(mu); const detG = (() => { const M = G0.map((r) => r.map((q) => { if (q.d !== 1n) throw new Error('a non-integral Gram entry'); return q.n; })); return det(M); })();
  const texGram = [[0, 0, -1, 1], [0, 0, 1, -2], [1, -1, 0, 0], [-1, 2, 0, 0]].map((r) => r.map(String));
  L.row('SC6', 'Trd(μ⁻¹·x·ȳ), μ = 2j + ij, has the printed matrix in the basis (1, i, (1+j)/2, (i+ij)/2), and determinant one', 'TeX lines 405-412', 2, [JSON.stringify(gm) === JSON.stringify(texGram) ? null : 'matrix', detG === 1n ? null : 'det = ' + detG].filter(Boolean));
  let closed = true; for (const x of basis) for (const y of basis) if (coords(qm(x, y)).some((q) => q.d !== 1n)) closed = false;
  const discO = det(basis.map((x) => basis.map((y) => { const t = trd(qm(x, y)); if (t.d !== 1n) throw new Error('a non-integral trace'); return t.n; })));
  L.row('SC7', 'O = Z⟨1, i, (1+j)/2, (i+ij)/2⟩ is closed under multiplication and |det Trd(e_a e_b)| = 36 = 6², the square of the discriminant of B = (2, −3), so O is maximal', 'TeX line 405 ("the maximal order")', 2, [closed ? null : 'not closed', discO === 36n || discO === -36n ? null : 'disc ' + discO].filter(Boolean), { traceFormDeterminant: String(discO) });
  L.row('SC8', 'deg(Y_3 → P¹_j) ≤ 4·|(O/3O)*| ≤ 4·81 = 324, with |(O/3O)*| = ' + units, 'TeX line 440', 1, 4 * units <= 324 && 4 * 81 === 324 && units <= 81 ? [] : ['bound fails']);
  /* the Igusa normalization (TeX 905-930): ψ4 = J2² − 24·J4 = 144j, and 16·144⁵·(2^-14)²/(2^-2)⁵ = 3779136 */
  const J2 = [12n, 12n], J4 = [6n, 6n, 6n];
  const psi4 = add(mul(J2, J2), scl(J4, -24n));
  const igusa = Q.mul(Q.make(16n * 144n ** 5n), Q.make(2n ** 10n, 2n ** 28n));
  L.row('SC9', 'ψ4 = J2² − 24·J4 = 144j for J2 = 12(j+1), J4 = 6(j²+j+1); and 16·144⁵·χ10²/ψ4⁵ with the lny normalizations is 3779136·(Π z_m)⁴/(Σ z_m⁸)⁵, norms 3779136 and 10⁵ = 10 terms to the fifth, degree 40 = 4·10 = 8·5', 'TeX lines 910-927', 3, [eqp(psi4, [0n, 144n]) ? null : 'psi4', Q.eq(igusa, Q.int(3779136)) ? null : 'constant ' + Q.str(igusa), 4 * 10 === 40 && 8 * 5 === 40 ? null : 'degree'].filter(Boolean));
  /* exact exponential and logarithm bounds: e > Σ_{k≤12} 1/k!, ln 2 < 7/10 because e^(7/10) > 2 by its series */
  const eLow = (() => { let s = Q0, f = 1n; for (let k = 0; k <= 12; k++) { if (k) f *= BigInt(k); s = Q.add(s, Q.make(1n, f)); } return s; })();
  const expLow = (x, terms) => { let s = Q0, t = Q1; for (let k = 0; k <= terms; k++) { if (k) t = Q.div(Q.mul(t, x), Q.int(k)); s = Q.add(s, t); } return s; };
  const powQ = (x, e) => { let r = Q1; for (let i = 0; i < e; i++) r = Q.mul(r, x); return r; };
  const ln2lt = Q.lt(Q.int(2), expLow(Q.make(7n, 10n), 12));
  const cmA = l1(num) <= 4000n ** 6n && l1(den) <= 4000n ** 6n;
  const cmB = Q.lt(Q.int(2n * 4000n ** 6n), powQ(eLow, 74));
  L.row('SC10', 'the coefficient norm bound: ‖57600·F²‖₁ and ‖G⁶‖₁ are each ≤ 4000⁶, so −57600bF(X)² − aG(X)⁶ has norm ≤ 2·4000⁶·max(|a|,|b|), and log(2·4000⁶) < 74', 'TeX lines 949-955', 2, [cmA ? null : 'norm', cmB ? null : 'log'].filter(Boolean));
  const theta = 40n * 10000n * 2n ** 24n + 96n;
  L.row('SC11', 'log(3779136 + 10⁵) < 22 (so h(j) ≤ 40·h + 22); C_2 = 1000·2⁴·(log 2⁴)⁵ ≤ 1000·2²⁴ (by ln 2 < 7/10, an exact series bound); 40·10000·2²⁴ + 96 = ' + theta + ' < 10¹³', 'TeX lines 927-944, 963', 3, [Q.lt(Q.int(3779136 + 100000), powQ(eLow, 22)) ? null : 'h(j)', ln2lt && Q.lt(powQ(Q.make(28n, 10n), 5), Q.int(2 ** 20)) ? null : 'C2', theta < 10n ** 13n ? null : 'theta'].filter(Boolean));
  /* reconciliation with the independent reviewer's arithmetic.json (their repository, data) */
  const recon = [];
  if (review) for (const [k, v] of [['FG', rFG], ['FH', rFH], ['GH', rGH]]) { const s = support(v); recon.push({ what: 'Res(' + k[0] + ',' + k[1] + ')', reviewer: review.resultants[k], ours: Object.assign({}, s.ex, { remaining: String(s.rest) }) }); }
  if (review) for (const [k, v] of [['F', dF], ['G', dG], ['H', dH]]) { const s = support(v); recon.push({ what: 'disc ' + k, reviewer: review.discriminants[k], ours: Object.assign({}, s.ex, { remaining: String(s.rest) }) }); }
  for (const r of recon) { const pick = (o) => JSON.stringify(['2', '3', '5', 'remaining'].map((x) => String(o[x] === undefined ? (x === 'remaining' ? '1' : 0) : o[x]))); r.agreeOn235 = pick(r.reviewer) === pick(r.ours); }
  /* red controls */
  const rc1 = eqp(add(pw(G, 6), scl(mul(Fp, Fp), -97201n)), mul(H, H));
  L.control('SR1', '97201 in place of 97200', 'the identity G⁶ − c·F² = H² fails', rc1 ? 'holds' : 'fails', !rc1);
  const F2 = [0n, -15n, -20n, -25n, -30n, -60n].reduce((acc, c) => mul(acc, [-c, 1n]), [1n]);
  L.control('SR2', 'the contact −24 moved to −25', 'F differs from their F and the identity fails', (JSON.stringify(strs(F2)) === JSON.stringify(sc.F) ? 'F agrees' : 'F differs') + '; ' + (eqp(add(pw(G, 6), scl(mul(F2, F2), -97200n)), mul(H, H)) ? 'identity holds' : 'identity fails'), JSON.stringify(strs(F2)) !== JSON.stringify(sc.F) && !eqp(add(pw(G, 6), scl(mul(F2, F2), -97200n)), mul(H, H)));
  const g2 = gram([Q0, Q0, Q.int(2), Q.int(-1)]).map((r) => r.map(Q.str));
  L.control('SR3', 'μ = 2j − ij in place of 2j + ij', 'the Gram matrix differs from theirs', JSON.stringify(g2) === JSON.stringify(sc.gram) ? 'agrees' : 'differs', JSON.stringify(g2) !== JSON.stringify(sc.gram));
  const replay = repBad.length ? { verdict: 'REFUSED', reason: 'reported values we could not reproduce: ' + repBad.map((r) => r.what).join('; ') }
    : { verdict: 'CERTIFIED', reason: 'every one of the ' + rep.length + ' values their report lists for verify-six-contact.js is reproduced exactly from the manuscript\'s definitions (contacts, F, G, H, both coefficient norms, the Gram matrix, the six resultants, the three level-three counts). The checker\'s own list of assertions is in its code and is not reconstructed; what is certified is its reported output plus the manuscript\'s statements SC1-SC11. Two further fields (' + matchedOnly.map((m) => m.what.split('.')[1]).join(', ') + ') are matched as numbers only: the prose does not say what they bound.' };
  const out = verdicts(L, replay);
  return Object.assign({ suite: 'six contact', checker: 'verify-six-contact.js', theirs: { fields: rep.length + matchedOnly.length }, reportedValues: rep, matchedAsNumbersOnly: matchedOnly, reviewerReconciliation: { file: PIN.reviewArithmetic.path, rows: recon } }, out);
}
function gcdN(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

function build() {
  const raw = readPinned(PIN.definition.path, PIN.definition.sha256).toString('utf8');
  for (const k of ['readme', 'spec', 'tex', 'divisionChecks']) readPinned(PIN[k].path, PIN[k].sha256);
  const report = JSON.parse(readPinned(PIN.report.path, PIN.report.sha256).toString('utf8'));
  const reviewBytes = readPinned(PIN.reviewArithmetic.path, null);
  const pins = JSON.parse(JSON.stringify(PIN)); pins.reviewArithmetic.sha256 = sha(reviewBytes);
  const review = JSON.parse(reviewBytes.toString('utf8'));
  if (!fs.existsSync(L1)) die('no certs/zq-recount.json (lane 1) for the derived witness counts');
  const lane1 = JSON.parse(fs.readFileSync(L1, 'utf8'));
  if (lane1.verdict !== 'CERTIFIED' || lane1.pins.definition.sha256 !== PIN.definition.sha256) die('lane 1 is not CERTIFIED on the same bytes');
  const spec = JSON.parse(raw);
  const gst = gcdSelfTest(); if (gst.disagreements) die('the fast gcd of tools/zq-k0.js disagrees with Euclid; refusing');
  const ev = makeEvaluator(spec);
  const suites = [suiteIC(report), suiteDP(spec, report, ev), suiteFE(spec, report, ev, lane1), suiteSC(report, review)];
  const replayCertified = suites.filter((s) => s.replay.verdict === 'CERTIFIED').map((s) => s.suite);
  const stmt = suites.map((s) => s.statements.verdict);
  /* the headline says both halves (the coordinator, 2026-11-06): CERTIFIED only when the statements hold AND every suite's
     own case set was replayed; statements CERTIFIED with a replay refused anywhere is MIXED, so the word never reads as
     "their suites were reproduced" when three of four case sets are not in their prose */
  const verdict = stmt.includes('REFUTED') ? 'REFUTED' : stmt.includes('REFUSED') ? 'REFUSED'
    : suites.every((s) => s.replay.verdict === 'CERTIFIED') ? 'CERTIFIED' : 'MIXED';
  return {
    what: 'Track A lane 3 on the claim "Z is Diophantine in Q" (Glazer et al., announced 2026-11-05): the claimant\'s four finite arithmetic suites (integer compiler, division polynomials over Q(√2), finite polynomial expressions, six-contact identities), re-derived clean-room from their prose and data with exact arithmetic of our own; their checker code not read.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md (lane 3; Amendment A2, commit 13c9e92e)',
    pins, code: { 'tools/zq-finite.js': sha(fs.readFileSync(__filename)), 'tools/zq-k0.js': sha(fs.readFileSync(path.join(__dirname, 'zq-k0.js'))) },
    lane1: { record: 'certs/zq-recount.json', verdict: lane1.verdict, contentSha256: sha(JSON.stringify(Object.assign({}, lane1, { generated: null }))), note: 'sha256 of the record with its date nulled; used for the witness counts of multiply and natural' },
    arithmeticSelfTest: { gcd: gst, note: 'the Lehmer gcd of tools/zq-k0.js against plain Euclid' },
    verdict,
    verdictScope: 'the statements each suite is said to check, decided on our own cases (four suites, ' + suites.reduce((s, x) => s + x.casesOurs, 0).toLocaleString('en-US') + ' cases); the replay of THEIR case sets: ' + (replayCertified.length ? replayCertified.join(', ') + ' CERTIFIED, ' : '') + suites.filter((s) => s.replay.verdict !== 'CERTIFIED').map((s) => s.suite).join(', ') + ' REFUSED (the case sets are not in the prose)',
    summary: suites.map((s) => ({ suite: s.suite, checker: s.checker, replay: s.replay.verdict, statements: s.statements.verdict, casesOurs: s.casesOurs, rows: s.rows.length, redControls: s.redControls.length })),
    suites,
  };
}

const T0 = Date.now();
const Lrec = build();
const secs = Math.round((Date.now() - T0) / 1000);
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(Lrec)) die('certs/zq-finite.json is not what the pinned files and this code give now');
  console.log('zq-finite: re-derived, identical · ' + Lrec.verdict + ' · ' + Lrec.summary.map((s) => s.suite + ' replay ' + s.replay + ' / statements ' + s.statements).join(' · ') + ' · ' + secs + ' s');
} else {
  fs.writeFileSync(OUT, JSON.stringify(Lrec, null, 1) + '\n');
  console.log('zq-finite: ' + Lrec.verdict + ' · ' + Lrec.summary.map((s) => s.suite + ': replay ' + s.replay + ', statements ' + s.statements + ' (' + s.casesOurs + ' cases, ' + s.redControls + ' controls)').join(' · ') + ' · ' + secs + ' s');
}
