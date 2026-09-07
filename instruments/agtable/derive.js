/* derive.js — everything the record and the page state about Ashrafyan–Gomes Tables 1 and 2.
   instruments/agtable · cert-machine · 2026-09-07

   The exact solutions are enclosed (exact.js); the scheme is run as the paper specifies it
   (sl.js) on the paper's four meshes at the paper's tolerance and at a tight one; every
   error is an INTERVAL (the scheme's float against the enclosure), and every printed cell
   gets a verdict: REPRODUCED when its two printed digits' rounding box meets our interval,
   otherwise the factor between them. run.js writes; battery.js re-derives and checks;
   the report builder execs run.js --check. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require(path.join(__dirname, 'exact.js'));
const SL = require(path.join(__dirname, 'sl.js'));
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv } = I;
const ROOT = path.resolve(__dirname, '..', '..');
const TABLES = path.join(ROOT, 'corpus', 'ashrafyan-gomes-2403.02785', 'tables.json');

const MESHES = [[100, 25], [200, 50], [400, 100], [800, 200]];      /* ρ = 2/M, h = 1/N: the paper's (ρ, h) rows */
const TIGHT = 1e-8;
const KQUAD = { a0: 4096, bump: 2048, int2: 2048 };

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pair = (X) => [X[0], X[1]];
const mid = (X) => 0.5 * (X[0] + X[1]);

/* the printed value's rounding box: two significant digits */
function box(p) {
  const e = Math.floor(Math.log10(p)) - 1;
  const half = 0.5 * Math.pow(10, e);
  return [p - half, p + half];
}
/* sup-norm distance of a float array from an array of enclosures, as an interval; and the norm of the enclosures */
function supDist(vals, encl) {
  let elo = 0, ehi = 0, nlo = 0, nhi = 0;
  for (let k = 0; k < vals.length; k++) {
    const v = vals[k], X = encl[k];
    const dlo = Math.max(0, X[0] - v, v - X[1]), dhi = Math.max(Math.abs(v - X[0]), Math.abs(v - X[1]));
    if (dlo > elo) elo = dlo; if (dhi > ehi) ehi = dhi;
    const mg = I.mig(X), mx = I.mag(X);
    if (mg > nlo) nlo = mg; if (mx > nhi) nhi = mx;
  }
  return { abs: [elo, ehi], norm: [nlo, nhi], rel: [elo / nhi, ehi / nlo] };
}
/* REPRODUCED: our interval meets the two printed digits' rounding box; NEAR: within 15 % of the
   printed value (the port is an independent implementation, not the authors' code); DIFFERS otherwise */
function verdict(rel, printed) {
  const b = box(printed);
  const meets = rel[0] <= b[1] && b[0] <= rel[1];
  const factor = mid(rel) / printed;
  return { verdict: meets ? 'REPRODUCED' : (factor > 1 / 1.15 && factor < 1.15) ? 'NEAR' : 'DIFFERS', factor, box: b };
}

function derive() {
  const printed = JSON.parse(fs.readFileSync(TABLES, 'utf8'));
  /* ---- the exact objects ---- */
  const a0 = E.a0at0(KQUAD.a0), Z1 = E.bumpMass(1.1, KQUAD.bump), Z2 = E.bumpMass(1.2, KQUAD.bump), int2 = E.int2(KQUAD.int2);
  const exactPrice = (test, N) => { const out = []; for (let k = 0; k <= N; k++) out.push(pair(test === 1 ? E.price1(iv(k / N)) : E.price2(iv(k / N)))); return out; };
  const exactU = (test, xs) => xs.map(x => pair(test === 1 ? E.u1at0(iv(x), a0.value) : E.u2at0(iv(x), int2.value)));
  const exactM = (test, xs) => xs.map(x => pair(test === 1 ? E.m1atT(iv(x), Z1.value) : E.m2atT(iv(x), Z2.value)));
  const grid = (M) => { const xs = []; for (let i = 0; i <= M; i++) xs.push(-1 + 2 * i / M); return xs; };
  const finest = MESHES[MESHES.length - 1];
  const exact = {
    Q0: pair(E.Qiv(I.ZERO)), Q1: pair(E.Qiv(I.ONE)), K1: pair(E.Kiv(I.ONE)), J0: pair(E.Jiv(I.ZERO)),
    a0: { value: pair(a0.value), remainder: a0.remainder, K: KQUAD.a0 }, a1_0: pair(E.a1(I.ZERO)), a2_0: pair(E.a2(I.ZERO)), sigmaT: pair(E.sigmaT),
    Z1: { value: pair(Z1.value), remainder: Z1.remainder }, Z2: { value: pair(Z2.value), remainder: Z2.remainder }, int2: { value: pair(int2.value), remainder: int2.remainder },
    price: { 1: exactPrice(1, finest[1]), 2: exactPrice(2, finest[1]) },
    u0: { 1: exactU(1, grid(finest[0])), 2: exactU(2, grid(finest[0])) },
    mT: { 1: exactM(1, grid(finest[0])), 2: exactM(2, grid(finest[0])) },
    xs: grid(finest[0]), N: finest[1],
    Qgrid: Array.from({ length: finest[1] + 1 }, (_, k) => pair(E.Qiv(iv(k / finest[1])))),
    priceWidth: { 1: Math.max(...exactPrice(1, finest[1]).map(p => p[1] - p[0])), 2: Math.max(...exactPrice(2, finest[1]).map(p => p[1] - p[0])) },
    /* the clearing identity ϖ + a₁ + 2a₂K = −Q, decided at 21 times */
    clearing: Array.from({ length: 21 }, (_, j) => { const t = iv(j / 20); const r = I.add(I.add(I.add(E.price1(t), E.a1(t)), I.mul(I.mul(iv(2), E.a2(t)), E.Kiv(t))), E.Qiv(t)); return { t: j / 20, r: pair(r), zero: I.contains(r, 0) }; })
  };

  /* ---- the scheme on the paper's meshes ---- */
  const runs = { 1: [], 2: [] }, coarse = {};
  for (const test of [1, 2]) {
    const eps0 = printed['test' + test].eps;
    MESHES.forEach(([M, N], r) => {
      const xs = grid(M);
      const encW = exactPrice(test, N).slice(0, N), encU = exactU(test, xs), encM = exactM(test, xs);
      const row = printed['test' + test].rows[r];
      const at = (eps) => {
        const S = SL.solve({ test, M, N, eps, maxIter: 400 });
        const w = supDist(Array.from(S.w).slice(0, N), encW), u = supDist(S.u0, encU), m = supDist(S.mT, encM);
        const out = { eps, it: S.it, resid: S.resid, converged: S.converged, w, u, m,
          verdicts: { w: verdict(w.rel, row.w), u: verdict(u.rel, row.u), m: verdict(m.rel, row.m) } };
        if (r === 0 && eps === eps0) coarse[test] = { M, N, w: Array.from(S.w), u0: S.u0, mT: S.mT, m0: S.m0, xs, encW: exactPrice(test, N), encU, encM };
        return out;
      };
      runs[test].push({ M, N, rho: 2 / M, h: 1 / N, printed: row, theirs: at(eps0), tight: at(TIGHT) });
    });
  }
  /* orders at the tight tolerance, and the tolerance's share at the finest mesh */
  const orders = {};
  for (const test of [1, 2]) {
    orders[test] = {};
    for (const c of ['w', 'u', 'm']) orders[test][c] = runs[test].slice(1).map((R, i) => mid(runs[test][i].tight[c].rel) / mid(R.tight[c].rel));
  }
  const tolerance = {};
  for (const test of [1, 2]) {
    const R = runs[test][MESHES.length - 1];
    tolerance[test] = {};
    for (const c of ['w', 'u', 'm']) tolerance[test][c] = { theirs: mid(R.theirs[c].rel), tight: mid(R.tight[c].rel), change: (mid(R.theirs[c].rel) - mid(R.tight[c].rel)) / mid(R.tight[c].rel) };
  }
  const counts = {};
  for (const test of [1, 2]) { counts[test] = { reproduced: 0, near: 0, differs: 0 }; for (const R of runs[test]) for (const c of ['w', 'u', 'm']) counts[test][R.theirs.verdicts[c].verdict.toLowerCase()]++; }

  /* the printed density, as printed: a lower Riemann bound of its mass on [1/λ + δ, 1] */
  /* on 1/λ < x < 1 the printed exponent −1/(1 − (λx)²) is positive and decreases with x, so on the
     sliver [1/λ + δ, 1/λ + 2δ] the integrand is at least its value at the right end: mass ≥ δ · exp(that) */
  const asPrinted = {};
  for (const lam of [1.1, 1.2]) {
    const delta = 1e-3, from = 1 / lam + delta, to = 1 / lam + 2 * delta;
    const vt = I.sub(I.ONE, I.sqr(I.mul(iv(lam), iv(to)))), et = I.neg(I.div(I.ONE, vt));
    const lower = I.mul(iv(delta), T.exp(iv(et[0])));
    asPrinted[lam] = { from, to, exponentAtTo: pair(et), lowerMass: lower[0] };
  }

  return { pins: { tables: sha(TABLES) }, meshes: MESHES, tight: TIGHT, printed, exact, runs, coarse, orders, tolerance, counts, asPrinted };
}

module.exports = { derive, MESHES, TIGHT, KQUAD, box, supDist, verdict, sha };
