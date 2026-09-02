#!/usr/bin/env node
/* multiplicity.js — certified NON-uniqueness for the mfg-cap system, and the
   >=3-solutions corollary.  labs/mfg · cert-machine  (TERRA paper-2 content,
   evidence built on OUR lifted MIT kernel + validate.js.)

   THE CLAIM PER COUPLING c (sigma = 1/2, V = 0, past the monotonicity wall
   c* = -sigma^2 (2pi)^2 ~ -9.87): THREE numerical candidates — the constant
   solution, the symmetry-broken branch, and its half-shift mirror — are each
   enclosed by validate.js in a ball of certified radius with local uniqueness,
   the three balls are PAIRWISE DISJOINT in the same ell^1_nu norm (distance
   computed outward-rounded, gap stated), and the density is certified positive
   over every ball.  Three disjoint uniqueness balls = AT LEAST THREE distinct
   exact solutions of the PDE system at that coupling — the function-space
   companion to the census's truncation-level EXACTLY 3.

   THE HALF-SHIFT COROLLARY, made concrete: x -> x + 1/2 maps solutions to
   solutions (V = 0) and flips odd cosine coefficients; the mirror candidate IS
   that image of the branch, so once branch and mirror sit in disjoint balls
   the symmetry has been PROVED to produce a genuinely different solution, not
   a relabeling.

   THE HONEST BOUNDARY: at c = -9.5, INSIDE the Lasry-Lions monotone regime,
   the branch continuation collapses onto the constant and no multiplicity is
   claimed — recorded as a row, because an instrument that cannot decline a
   claim is not deciding anything.

   usage: node labs/mfg/multiplicity.js       -> certs/mfg-cap-multiplicity.json

   SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo          */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const V = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'validate.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));

const SIGMA = 0.5, NU = 1.02;
/* deeper couplings dig the density closer to vacuum — the truncation must
   resolve the dip before positivity can be certified over the ball */
const CS = [-11, -12, -14, -16, -20, -24];
const N_OF = { '-20': 24, '-24': 32 };
const nOf = (c) => N_OF[String(c)] || 16;
const TWO_PI_I = I.encloseFloat(2 * Math.PI);

/* ell^1_nu distance between two candidates in (rho, p, b) form, outward */
function distNu(x, y, n, nu) {
  const ux = M.unpack(x, n), uy = M.unpack(y, n);
  let d = [Math.abs(ux.rho - uy.rho), Math.abs(ux.rho - uy.rho)];
  d = [I.nextDown(d[0]), I.nextUp(d[1])];
  let nuk = [1, 1];
  const nuI = I.encloseFloat(nu);
  for (let k = 1; k <= n; k++) {
    nuk = I.mul(nuk, nuI);
    const dp = I.mul(I.mul(TWO_PI_I, I.iv(k)), I.iv(Math.abs(ux.a[k] - uy.a[k])));
    const db = I.iv(Math.abs(ux.b[k] - uy.b[k]));
    d = I.add(d, I.mul(I.iv(2), I.mul(nuk, I.add(dp, db))));
  }
  return d;
}

function branchCandidate(c, N) {
  /* the whole continuation runs at the TARGET truncation — projecting a
     coarser vector into a finer one mixes the a- and b-blocks (a real bug
     this file shipped for one run) */
  const c0 = -10.5;
  const seed = new Float64Array(2 * N + 1);
  seed[0] = c0; seed[1] = -SIGMA * 0.35; seed[N + 1] = 0.35;
  const st = M.solve(M.makeProblem({ sigma: SIGMA, c: c0, A: 0, N }), { x0: seed, maxIter: 200 });
  if (!st.ok) return null;
  const br = M.continueBranch(cc => M.makeProblem({ sigma: SIGMA, c: cc, A: 0, N }), c0, c, 48, st.x);
  const s = M.solve(M.makeProblem({ sigma: SIGMA, c, A: 0, N }), { x0: br.x, maxIter: 200 });
  return s.ok ? Float64Array.from(s.x) : null;
}

const mirrorOf = (x, N) => {
  const m = Float64Array.from(x);
  for (let k = 1; k <= N; k += 2) { m[k] = -m[k]; m[N + k] = -m[N + k]; }
  return m;
};

function certifyAt(c) {
  const N = nOf(c);
  const P = M.makeProblem({ sigma: SIGMA, c, A: 0, N });
  const xc = new Float64Array(2 * N + 1); xc[0] = c;              /* the constant */
  const xb = branchCandidate(c, N);
  if (!xb) return { c, claimed: false, why: 'branch candidate did not converge' };
  const xm = mirrorOf(xb, N);
  const sm = M.solve(P, { x0: xm, maxIter: 100 });
  const xmr = sm.ok ? Float64Array.from(sm.x) : xm;
  const out = { c, N, balls: {}, pairs: {}, claimed: false };
  const cands = { constant: xc, branch: xb, mirror: xmr };
  for (const [name, x] of Object.entries(cands)) {
    const r = V.validate(x, P, { nu: NU });
    if (!r.ok) return { c, claimed: false, why: name + ' enclosure refused: ' + r.why };
    const pos = V.certifyPositivity(x, P, r.r);
    if (!pos.positive) return { c, claimed: false, why: name + ' density not certified positive' };
    out.balls[name] = { r: r.r, Y0: r.Y0[1] !== undefined ? r.Y0[1] : r.Y0, Z1: r.Z1[1] !== undefined ? r.Z1[1] : r.Z1,
                        kappa: r.kappa, minM: pos.minM };
  }
  let allDisjoint = true;
  const names = Object.keys(cands);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      const d = distNu(cands[a], cands[b], N, NU);
      const gap = I.nextDown(d[0] - (out.balls[a].r + out.balls[b].r));
      out.pairs[a + '|' + b] = { distanceLo: d[0], radiiSum: out.balls[a].r + out.balls[b].r, gap, disjoint: gap > 0 };
      if (!(gap > 0)) allDisjoint = false;
    }
  }
  out.claimed = allDisjoint;
  out.conclusion = allDisjoint
    ? 'AT LEAST THREE distinct exact solutions at this coupling — three disjoint uniqueness balls'
    : 'multiplicity NOT claimed at this coupling';
  return out;
}

function boundaryRow() {
  /* inside the monotone regime the branch must collapse — the honest refusal */
  const c = -9.5;
  const N = nOf(c);
  const xb = branchCandidate(c, N);
  if (!xb) return { c, claimed: false, why: 'branch continuation did not converge (monotone regime)' };
  const xc = new Float64Array(2 * N + 1); xc[0] = c;
  const d = distNu(xb, xc, N, NU);
  const collapsed = d[1] < 1e-6;
  return { c, claimed: false, branchCollapsedToConstant: collapsed, distanceHi: d[1],
           why: collapsed ? 'the branch continuation lands ON the constant — no second solution to enclose'
                          : 'no disjointness established; multiplicity not claimed' };
}

function main() {
  const t0 = Date.now();
  const rows = CS.map(certifyAt);
  const bnd = boundaryRow();
  const ok = rows.every(r => r.claimed);
  const minMall = Math.min(...rows.filter(r => r.claimed).map(r => Math.min(...Object.values(r.balls).map(b => b.minM))));
  const cert = {
    what: 'certified non-uniqueness for the mfg-cap system: >= 3 distinct exact solutions per coupling',
    statement: ('For sigma = 1/2, V = 0, nu = ' + NU + ', at each coupling c in {' + CS.join(', ')
      + '} — past the Lasry-Lions monotonicity wall c* = -sigma^2 (2pi)^2 — the constant solution, the '
      + 'symmetry-broken branch and its half-shift mirror are enclosed in PAIRWISE DISJOINT ell^1_nu balls with '
      + 'local uniqueness (radii-polynomial, validate.js) and certified positive density: AT LEAST THREE distinct '
      + 'exact solutions of the system at every listed coupling. The half-shift corollary is thereby concrete: '
      + 'the symmetry provably produces a different solution, not a relabeling. At c = -9.5, inside the monotone '
      + 'regime, the branch collapses onto the constant and NO claim is made — the recorded boundary. '
      + 'Function-space companion to the truncation-level EXACTLY-3 census (certs/mfg-cap-census-*.json).'),
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    sigma: SIGMA, N: 'per coupling (16; 24 at c=-20; 32 at c=-24)', nu: NU, cStar: -(SIGMA * SIGMA) * Math.pow(2 * Math.PI, 2),
    couplings: rows,
    boundary: bnd,
    minMOverAllBalls: minMall,
    meta: {
      date: new Date().toISOString().slice(0, 10),
      git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
      ms: Date.now() - t0,
    },
  };
  const f = path.join(ROOT, 'certs', 'mfg-cap-multiplicity.json');
  fs.writeFileSync(f, JSON.stringify(cert, null, 1));
  for (const r of rows) {
    console.log('  c = ' + String(r.c).padStart(4) + '  ' + (r.claimed
      ? '>=3 solutions · worst gap ' + Math.min(...Object.values(r.pairs).map(p => p.gap)).toExponential(2)
        + ' · min m ' + Math.min(...Object.values(r.balls).map(b => b.minM)).toExponential(2)
      : 'NOT CLAIMED: ' + r.why));
  }
  console.log('  c = -9.5  boundary: ' + bnd.why);
  console.log('wrote certs/mfg-cap-multiplicity.json  verdict=' + cert.verdict);
  process.exit(ok ? 0 : 1);
}
main();
