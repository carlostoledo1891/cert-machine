#!/usr/bin/env node
/* census.js — EXACTLY-N: a Krawczyk exhaustion census for the even Galerkin
   truncation of the mfg-cap system (V ≡ 0).  labs/mfg · cert-machine

   THE STATEMENT IT PRODUCES (TERRA-PORT item 5; authored fresh — the
   frontier-apps census was read for its lessons, its code has no git and is
   not a lift source; the kernel below is OUR lifted MIT mfg1d).  For the
   N-mode even Galerkin system of

       −σ u'' + ½(u')² + ρ = c·m          −σ m'' − (m u')' = 0
       ∫m = 1, ∫u = 0                     (unknowns  ρ, a_1..a_N, b_1..b_N)

   with 2π carried as an ENCLOSURE (the theorem is about the true Galerkin
   system, not its float shadow), and an explicit printed box B ⊂ R^{2N+1}:
   EITHER a proof that the system has EXACTLY n solutions in B — every subbox
   eliminated by an interval-residual or Krawczyk exclusion, every solution
   isolated by Moore–Krawczyk K(X) ⊂ int(X) (existence AND uniqueness per
   box, Rump) — OR a refusal naming what it could not decide.  Nothing in
   between.  The claim is BOX-BOUNDED and about the TRUNCATION: the
   PDE-level count is the stated open problem, not an implication.

   PARITY GUARD (the S5 lesson, checked not remembered): the interval
   residual/Jacobian mirror the float kernel and are selftested against it
   at random thin points before any census runs.

   OFF-CENTER SPLIT (0.537, a measured lesson): midpoint splits on a
   symmetric box park the constant solution (a_k = 0 exactly) on child
   boundaries forever — the N=2 pilot at the origin lab refused at exactly
   that point.  The battery keeps a red control on it.

   usage:  node labs/mfg/census.js --selftest
           node labs/mfg/census.js --N 3 --c -12 [--sigma 0.5] [--budget 3e6]
   writes: certs/mfg-cap-census-N<N>-c<c>.json

   SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo          */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { iv, add, sub, mul, neg, sqr, ZERO, ONE } = I;

const TPI = I.encloseFloat(2 * Math.PI);          /* encloses the real 2π */

/* ---- interval mirrors of the kernel's parity conventions ---- */
const ivAt = (f, j) => { const a = j < 0 ? -j : j; return a < f.length ? f[a] : ZERO; };
const ivAtOdd = (f, j) => { const a = j < 0 ? -j : j; if (a >= f.length) return ZERO; return j < 0 ? neg(f[a]) : f[a]; };

function ivConv(f, g, K, pf, pg) {
  const gf = pf === 'o' ? ivAtOdd : ivAt, gg = pg === 'o' ? ivAtOdd : ivAt;
  const Jf = f.length - 1, Jg = g.length - 1;
  const out = new Array(K + 1);
  for (let k = 0; k <= K; k++) {
    let s = ZERO;
    for (let j = -Jf; j <= Jf; j++) {
      const gk = k - j;
      if (gk < -Jg || gk > Jg) continue;
      const a = gf(f, j), b = gg(g, gk);
      if ((a[0] === 0 && a[1] === 0) || (b[0] === 0 && b[1] === 0)) continue;
      s = add(s, mul(a, b));
    }
    out[k] = s;
  }
  return out;
}

/* state layout mirrors the kernel: X = [rho, a_1..a_N, b_1..b_N] (intervals) */
function splitX(X, N) {
  const b = [ONE], p = [ZERO];
  for (let k = 1; k <= N; k++) {
    b.push(X[N + k]);
    p.push(mul(mul(TPI, iv(k)), X[k]));
  }
  return { rho: X[0], b, p };
}

const lamI = (sigma, k) => mul(iv(sigma), sqr(mul(TPI, iv(k))));

/* residual [H_0, H_1..H_N, F_1..F_N], V = 0 — mirrors M.residual exactly */
function ivResidual(X, P) {
  const { sigma, c, N } = P;
  const { rho, b, p } = splitX(X, N);
  const pp = ivConv(p, p, N, 'o', 'o');
  const bp = ivConv(b, p, N, 'e', 'o');
  const R = new Array(2 * N + 1);
  R[0] = sub(add(mul(iv(-0.5), pp[0]), rho), iv(c));                    /* b_0 = 1 */
  for (let k = 1; k <= N; k++) {
    R[k] = sub(sub(mul(lamI(sigma, k), X[k]), mul(iv(0.5), pp[k])), mul(iv(c), X[N + k]));
    R[N + k] = add(mul(lamI(sigma, k), X[N + k]), mul(mul(TPI, iv(k)), bp[k]));
  }
  return R;
}

/* interval Jacobian — the kernel's analytic formulas, entrywise intervals */
function ivJacobian(X, P) {
  const { sigma, c, N } = P;
  const { b, p } = splitX(X, N);
  const n = 2 * N + 1;
  const J = Array.from({ length: n }, () => new Array(n).fill(ZERO));
  J[0][0] = ONE;
  for (let m = 1; m <= N; m++) {
    J[0][m] = mul(mul(iv(-0.5), mul(iv(2), mul(TPI, iv(m)))), sub(ivAtOdd(p, -m), ivAtOdd(p, m)));
  }
  for (let k = 1; k <= N; k++) {
    const l = lamI(sigma, k);
    for (let m = 1; m <= N; m++) {
      let v = mul(mul(iv(-0.5), mul(iv(2), mul(TPI, iv(m)))), sub(ivAtOdd(p, k - m), ivAtOdd(p, k + m)));
      if (m === k) { v = add(v, l); J[k][N + m] = iv(-c); }
      J[k][m] = v;
    }
  }
  for (let k = 1; k <= N; k++) {
    const l = lamI(sigma, k), tk = mul(TPI, iv(k));
    for (let m = 1; m <= N; m++) {
      J[N + k][m] = mul(mul(tk, mul(TPI, iv(m))), sub(ivAt(b, k - m), ivAt(b, k + m)));
      let v = mul(tk, add(ivAtOdd(p, k - m), ivAtOdd(p, k + m)));
      if (m === k) v = add(v, l);
      J[N + k][N + m] = v;
    }
  }
  return J;
}

/* ---- selftest: interval mirrors vs the float kernel at random thin points ---- */
function selftest(quiet) {
  const N = 4, P = M.makeProblem({ sigma: 0.5, c: -12, A: 0, N });
  const rng = (s => () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)(42);
  let allR = true, allJ = true, thin = true;
  for (let t = 0; t < 50; t++) {
    const x = new Float64Array(2 * N + 1);
    x[0] = -12 + 8 * (rng() - 0.5);
    for (let i = 1; i < x.length; i++) x[i] = 1.4 * (rng() - 0.5);
    const Rf = M.residual(x, P);
    const Xi = Array.from(x, v => iv(v));
    const Ri = ivResidual(Xi, P);
    const Ji = ivJacobian(Xi, P);
    const Jf = M.jacobian(x, P);
    for (let i = 0; i < Rf.length; i++) {
      if (Math.abs(Rf[i] - (Ri[i][0] + Ri[i][1]) / 2) > 1e-9 + 1e-9 * Math.abs(Rf[i])) allR = false;
      if (I.width(Ri[i]) > 1e-9) thin = false;
    }
    const n = 2 * N + 1;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const e = Jf[i * n + j], w = Ji[i][j];
      if (Math.abs(e - (w[0] + w[1]) / 2) > 1e-9 + 1e-9 * Math.abs(e)) allJ = false;
    }
  }
  if (!quiet) {
    console.log((allR ? '  GREEN ' : '  RED   ') + 'interval residual matches the float kernel at 50 random thin points');
    console.log((thin ? '  GREEN ' : '  RED   ') + 'thin-point residual enclosures are tight (< 1e-9)');
    console.log((allJ ? '  GREEN ' : '  RED   ') + 'interval Jacobian matches the kernel analytic Jacobian');
    console.log(allR && thin && allJ ? 'SELFTEST GREEN' : 'SELFTEST RED');
  }
  return allR && thin && allJ;
}

/* ---- the census ---- */
function census(opts) {
  const N = opts.N, c = opts.c, sigma = opts.sigma;
  const splitFrac = opts._splitFrac || 0.537;      /* battery red overrides to 0.5 */
  const P = M.makeProblem({ sigma, c, A: 0, N });
  const n = 2 * N + 1;
  const log = opts.quiet ? () => {} : (...a) => console.log(...a);

  if (!selftest(true)) return { ok: false, why: 'selftest failed - mirrors diverge from the kernel' };

  /* the three physical candidates (floats — box design + final matching only) */
  const cands = [];
  { const x = new Float64Array(n); x[0] = c; cands.push({ name: 'constant', x }); }
  {
    const c0 = -10.5, Nc = 20;
    const seed = new Float64Array(2 * Nc + 1); seed[0] = c0; seed[1] = -sigma * 0.35; seed[Nc + 1] = 0.35;
    const st = M.solve(M.makeProblem({ sigma, c: c0, A: 0, N: Nc }), { x0: seed, maxIter: 200 });
    const br = M.continueBranch(cc => M.makeProblem({ sigma, c: cc, A: 0, N: Nc }), c0, c, 32, st.x);
    const proj = new Float64Array(n); proj[0] = br.x[0];
    for (let k = 1; k <= N; k++) { proj[k] = br.x[k]; proj[N + k] = br.x[Nc + k]; }
    const s = M.solve(P, { x0: proj, maxIter: 200 });
    if (!s.ok) return { ok: false, why: 'branch candidate did not converge at census N' };
    cands.push({ name: 'branch', x: Float64Array.from(s.x) });
    const mir = Float64Array.from(s.x);
    for (let k = 1; k <= N; k += 2) { mir[k] = -mir[k]; mir[N + k] = -mir[N + k]; }
    const sm = M.solve(P, { x0: mir, maxIter: 200 });
    if (!sm.ok) return { ok: false, why: 'mirror candidate did not converge' };
    cands.push({ name: 'mirror', x: Float64Array.from(sm.x) });
  }
  for (const cd of cands) {
    let r = 0; for (const v of M.residual(cd.x, P)) r = Math.max(r, Math.abs(v));
    log(`  candidate ${cd.name}: resNorm=${r.toExponential(1)}  rho=${cd.x[0].toFixed(4)} a1=${cd.x[1].toFixed(4)}`);
  }

  /* the box B: hull of the candidates + generous margins (printed = the claim) */
  const lo = new Float64Array(n).fill(Infinity), hi = new Float64Array(n).fill(-Infinity);
  for (const cd of cands) for (let i = 0; i < n; i++) { lo[i] = Math.min(lo[i], cd.x[i]); hi[i] = Math.max(hi[i], cd.x[i]); }
  const B = [];
  for (let i = 0; i < n; i++) B.push([lo[i] - (i === 0 ? 2.5 : 0.35), hi[i] + (i === 0 ? 2.5 : 0.35)]);
  const initW = B.map(x => x[1] - x[0]);
  log(`  box B: rho in [${B[0][0].toFixed(3)}, ${B[0][1].toFixed(3)}], a/b margins 0.35 beyond the candidate hull`);

  /* branch & bound: residual prefilter -> Krawczyk exclude/isolate/contract -> bisect */
  const t0 = Date.now();
  const queue = [B.map(x => x.slice())];
  const sols = [];
  let processed = 0, dropRes = 0, dropK = 0, contracted = 0, bisected = 0;
  const budget = opts.budget || 3e6, minRel = 1e-9;
  let refused = null;

  while (queue.length) {
    if (++processed > budget) { refused = 'box budget exceeded'; break; }
    const X = queue.pop();
    const Xi = X.map(x => iv(x[0], x[1]));

    const R = ivResidual(Xi, P);
    let out = false;
    for (let i = 0; i < n; i++) if (R[i][0] > 0 || R[i][1] < 0) { out = true; break; }
    if (out) { dropRes++; continue; }

    const mid = X.map(x => (x[0] + x[1]) / 2);
    const Jt = ivJacobian(mid.map(v => iv(v)), P);
    const Jmid = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Jmid[i * n + j] = (Jt[i][j][0] + Jt[i][j][1]) / 2;
    const A = M.inverse(Jmid, n);
    if (A) {
      const Fm = ivResidual(mid.map(v => iv(v)), P);
      const J = ivJacobian(Xi, P);
      const K = new Array(n);
      for (let i = 0; i < n; i++) {
        let acc = iv(mid[i]);
        let d = ZERO;
        for (let j = 0; j < n; j++) d = add(d, mul(iv(A[i * n + j]), Fm[j]));
        acc = sub(acc, d);
        for (let j = 0; j < n; j++) {
          let s = ZERO;
          for (let k = 0; k < n; k++) {
            const jk = J[k][j];
            if (jk[0] === 0 && jk[1] === 0) continue;
            s = add(s, mul(iv(A[i * n + k]), jk));
          }
          let m2 = [-s[1], -s[0]];
          if (i === j) m2 = add(ONE, m2);
          if (m2[0] === 0 && m2[1] === 0) continue;
          acc = add(acc, mul(m2, sub(Xi[j], iv(mid[j]))));
        }
        K[i] = acc;
      }
      let disj = false, inter = true;
      for (let i = 0; i < n; i++) {
        if (K[i][0] > X[i][1] || K[i][1] < X[i][0]) { disj = true; break; }
        if (!(K[i][0] > X[i][0] && K[i][1] < X[i][1])) inter = false;
      }
      if (disj) { dropK++; continue; }
      if (inter) { sols.push({ X: X.map(x => x.slice()), K: K.map(k => [k[0], k[1]]) }); continue; }
      const Xn = X.map((x, i) => [Math.max(x[0], K[i][0]), Math.min(x[1], K[i][1])]);
      let relW = 0, relWold = 0;
      for (let i = 0; i < n; i++) {
        relW = Math.max(relW, (Xn[i][1] - Xn[i][0]) / initW[i]);
        relWold = Math.max(relWold, (X[i][1] - X[i][0]) / initW[i]);
      }
      if (relW < 0.75 * relWold) { contracted++; queue.push(Xn); continue; }
      X.length = 0; Array.prototype.push.apply(X, Xn);      /* keep the tightening for bisection */
    }
    let bd = 0, bw = 0;
    for (let i = 0; i < n; i++) { const w = (X[i][1] - X[i][0]) / initW[i]; if (w > bw) { bw = w; bd = i; } }
    if (bw < minRel) { refused = 'min width reached without decision near [' + X.map(x => ((x[0] + x[1]) / 2).toFixed(4)).join(',') + ']'; break; }
    const m3 = X[bd][0] + splitFrac * (X[bd][1] - X[bd][0]);
    const L = X.map(x => x.slice()), Rt = X.map(x => x.slice());
    L[bd][1] = m3; Rt[bd][0] = m3;
    queue.push(L, Rt); bisected++;
  }
  const dt = (Date.now() - t0) / 1000;

  if (refused) {
    log(`  REFUSED: ${refused} (processed ${processed})`);
    return { ok: false, why: refused, processed };
  }

  /* one-to-one matching of the physical candidates to the solution boxes */
  const contains = (S, x) => S.every((s, i) => s[0] <= x[i] && x[i] <= s[1]);
  const matches = cands.map(cd => sols.findIndex(s => contains(s.X, Array.from(cd.x))));
  const oneToOne = matches.every(m => m >= 0) && new Set(matches).size === cands.length;

  log(`  CENSUS COMPLETE: ${sols.length} solution boxes · ${processed} boxes in ${dt.toFixed(1)}s`);
  log(`    dropped: residual ${dropRes} · Krawczyk ${dropK} · contracted ${contracted} · bisected ${bisected}`);
  log(`    matching: ${cands.map((cd, i) => cd.name + '->box' + matches[i]).join(' · ')}  ${oneToOne ? 'ONE-TO-ONE' : 'MISMATCH'}`);
  log(`  THEOREM (box-bounded, truncation-level): the N=${N} even Galerkin system (sigma=${sigma}, c=${c}, V=0) has EXACTLY ${sols.length} solutions in B.`);

  return {
    ok: true,
    what: `EXACTLY-${sols.length}: Krawczyk exhaustion census of the N=${N} even Galerkin mfg-cap system`,
    statement: `The ${N}-mode even Galerkin truncation of the mfg-cap system (sigma=${sigma}, c=${c}, `
      + `V=0, 2pi enclosed) has EXACTLY ${sols.length} solutions in the printed box B: every subbox `
      + `was eliminated by an interval-residual or Krawczyk exclusion, and each solution box is `
      + `isolated by Moore-Krawczyk K(X) in int(X) (existence and uniqueness per box). The claim `
      + `is about the TRUNCATION on B — the PDE-level count is an open problem, not an implication.`,
    verdict: 'VERIFIED',
    sigma, c, N, box: B, count: sols.length,
    solutions: sols.map((s, i) => ({
      box: s.X, image: s.K,
      candidate: matches.indexOf(i) >= 0 ? cands[matches.indexOf(i)].name : null,
    })),
    matching: cands.map((cd, i) => ({ name: cd.name, solutionBox: matches[i] })),
    oneToOne,
    splitFrac,
    stats: { processed, dropRes, dropK, contracted, bisected, seconds: dt },
    meta: {
      date: new Date().toISOString().slice(0, 10),
      git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
    },
  };
}

module.exports = { ivResidual, ivJacobian, ivConv, selftest, census };

/* ---- cli ---- */
if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) process.exit(selftest(false) ? 0 : 1);
  const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? parseFloat(argv[i + 1]) : d; };
  const cert = census({ N: arg('--N', 3), c: arg('--c', -12), sigma: arg('--sigma', 0.5), budget: arg('--budget', 3e6) });
  if (!cert.ok) process.exit(2);
  const f = path.join(ROOT, 'certs', `mfg-cap-census-N${cert.N}-c${cert.c}.json`);
  fs.writeFileSync(f, JSON.stringify(cert, null, 1));
  console.log('  record: ' + path.relative(ROOT, f));
}
