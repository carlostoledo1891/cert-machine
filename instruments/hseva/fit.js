/* instruments/hseva/fit.js — the return-level table as a certificate.

   A maximum-likelihood fit is a zero of the score equations. Here it is
   CERTIFIED: a float Newton iteration finds a candidate, and the Krawczyk
   operator (instruments/interval/radii.js) proves that a box around it
   contains exactly one zero of the score, and the Hessian is proved negative
   definite over the same box (secondOrder()), so that zero is the likelihood's
   maximum in the box — evaluated in outward-rounded
   interval arithmetic over every data point, with exp and log from the
   certified transcendental module and the gamma-function family from
   special.js. Everything downstream is an interval extension over that box:
     · the four goodness-of-fit criteria of the Ocean Engineering 2026 paper,
       each an enclosure (criteria()):
         A²  = −n − (1/n) Σ (2i−1)[ln F(x_(i)) + ln(1 − F(x_(n+1−i)))]   Anderson–Darling
         D   = max_i max(i/n − F(x_(i)), F(x_(i)) − (i−1)/n)              Kolmogorov–Smirnov
         MSE = (1/n) Σ [F(x_i) − F_n(x_i)]², F_n the empirical CDF (ties included)
         χ²  = Σ (O_j − E_j)²/E_j over Sturges bins (at least eight, equal width over
               [min, max], each datum binned EXACTLY in rationals), E_j = n[F(e_{j+1}) − F(e_j)],
               kept where E_j ≥ 5 — a bin whose E_j straddles 5 REFUSES the statistic;
               fewer than two kept bins leave it undefined, as the paper says;
     · the T-year return level F⁻¹(1 − b/(T·8766)) for a block of b hours
       (365.25 × 24 = 8766 hours a year, exactly).
   A ranking of families by any criterion is DECIDED when the best enclosure's
   upper end is below every other's lower end, and REFUSED otherwise, naming
   the tie. DECIDED ranks the criterion's arithmetic on this sample; it is not
   a test between models.

   PRINTED FITS. llAt() and levelAt() evaluate the full log-likelihood and a
   return level at parameters someone else printed — over the box their printed
   digits allow, with a location γ where the fit has one (x − γ is what the
   family sees). zeroDensity() counts the data the fit says cannot occur.

   Two arithmetics, one formula set (families.js): `floatOps` for the
   candidate, `intervalOps` for the certificate. The float path is never
   trusted for a stated number. */
'use strict';
const path = require('path');
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { krawczyk } = require(path.join(__dirname, '..', 'interval', 'radii.js'));
const { FAMILIES, makePhi } = require('./families.js');
const { makeGamma } = require('./special.js');

/* ---- sums over the data ----
   A running interval sum rounds outward at every one of n additions, so its
   width grows like n·ulp(S) ≈ n²·ulp(term): at n = 175,320 that is a thousand
   times the width the terms carry. Each endpoint stream is instead summed by
   Sum2 (cascaded TwoSum; Ogita, Rump & Oishi, SIAM J. Sci. Comput. 26, 2005,
   Prop. 4.5): |res − Σx| ≤ u|res| + γ²_{n−1} Σ|x|, u = 2⁻⁵³, γ_k = ku/(1 − ku),
   and that bound is added outward. In floats the same stream (Kahan–Babuška)
   sharpens the candidate. */
const U = Math.pow(2, -53);
function sum2() {
  let s = 0, sig = 0, ab = 0, n = 0;
  return {
    add(x) { const t = s + x, bb = t - s; sig += (s - (t - bb)) + (x - bb); s = t; ab += Math.abs(x); n++; },
    get() { return { res: s + sig, ab, n }; },
  };
}
function boundOf(r) {                                   /* u|res| + γ²_{n−1} Σ|x|, rounded up generously */
  const g = (r.n * U) / (1 - r.n * U);
  return IV.nextUp(IV.nextUp(U * Math.abs(r.res)) + IV.nextUp(IV.nextUp(g * g) * r.ab) * 2);
}
function ivAcc() {
  const L = sum2(), H = sum2();
  return {
    add(a) { L.add(a[0]); H.add(a[1]); },
    value() { const l = L.get(), h = H.get(); return [IV.nextDown(l.res - boundOf(l)), IV.nextUp(h.res + boundOf(h))]; },
  };
}
function flAcc() { const S = sum2(); return { add(x) { S.add(x); }, value() { return S.get().res; } }; }

/* ---- the two arithmetics ---- */
const floatOps = {
  c: (v) => v, add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b,
  exp: Math.exp, log: Math.log, neg: (a) => -a, abs: Math.abs, sqrt: Math.sqrt,
  lo: (a) => a, hi: (a) => a, widen: (a) => a, hull: (a, b) => (a + b) / 2, max: Math.max, clampAbs: (a, m) => Math.max(-m, Math.min(m, a)),
  pair: (l, h) => (l + h) / 2, PI: Math.PI, isInterval: false, acc: flAcc,
};
const sqrtIv = (a) => { if (!(a[0] >= 0)) throw new Error('sqrt below zero'); return [IV.nextDown(Math.sqrt(a[0])), IV.nextUp(Math.sqrt(a[1]))]; };
const intervalOps = {
  c: (v) => IV.iv(v), add: IV.add, sub: IV.sub, mul: IV.mul, div: IV.div,
  exp: TR.exp, log: TR.log, neg: IV.neg, abs: IV.abs, sqrt: sqrtIv,
  lo: (a) => a[0], hi: (a) => a[1],
  widen: (a, pad) => [IV.nextDown(a[0] - pad[1]), IV.nextUp(a[1] + pad[1])],
  hull: (a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])],
  max: (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  clampAbs: (a, m) => [Math.max(-m, a[0]), Math.min(m, a[1])],
  pair: (l, h) => [l, h], clamp01: (a) => [Math.max(0, a[0]), Math.min(1, a[1])],
  PI: TR.PI, isInterval: true, acc: ivAcc,
};
/* Φ and Φ⁻¹ on each arithmetic. Φ⁻¹ by bisection on the certified Φ: in
   intervals the bracket tightens only where the sign is certain. The gamma
   family (lnΓ, ψ, ψ′, P, P⁻¹) from special.js. */
for (const ops of [floatOps, intervalOps]) {
  const P = makePhi(ops);
  ops.Phi = P.Phi;
  ops.PhiInv = (p) => {
    const isIv = Array.isArray(p);
    const plo = isIv ? p[0] : p, phi = isIv ? p[1] : p;
    /* the sign of Φ(z) − p where certain: −1 below, +1 above, 0 undecided */
    const sign = (z) => { const v = intervalOps.Phi(IV.iv(z)); return v[1] < plo ? -1 : v[0] > phi ? 1 : 0; };
    if (!(sign(-12) < 0 && sign(12) > 0)) throw new Error('Φ⁻¹: p = [' + plo + ', ' + phi + '] is not certainly inside (Φ(−12), Φ(12))');
    let l = -12, u = 12;                                     /* the lower end: the edge of "certainly below" */
    for (let i = 0; i < 200 && u - l > 1e-14; i++) { const mid = (l + u) / 2; if (sign(mid) < 0) l = mid; else u = mid; }
    const lower = l;
    l = -12; u = 12;                                         /* the upper end: the edge of "certainly above" */
    for (let i = 0; i < 200 && u - l > 1e-14; i++) { const mid = (l + u) / 2; if (sign(mid) > 0) u = mid; else l = mid; }
    return isIv ? [lower, u] : (lower + u) / 2;
  };
  Object.assign(ops, makeGamma(ops));
}

/* ---- data as each arithmetic sees it ---- */
function prepare(xs) {
  const n = xs.length;
  const xf = Float64Array.from(xs), Lf = Float64Array.from(xs, Math.log);
  let sx = 0, sxx = 0, sL = 0, sLL = 0;
  for (let i = 0; i < n; i++) { sx += xf[i]; sxx += xf[i] * xf[i]; sL += Lf[i]; sLL += Lf[i] * Lf[i]; }
  const Df = { n, x: xf, L: Lf, xf, sxf: sx, sxxf: sxx, sLf: sL, sLLf: sLL };
  /* the interval data: each literal's double enclosed by its neighbours, ln x by the certified log */
  const xi = new Array(n), Li = new Array(n);
  for (let i = 0; i < n; i++) { xi[i] = [IV.nextDown(xf[i]), IV.nextUp(xf[i])]; Li[i] = xf[i] > 0 ? TR.log(xi[i]) : null; }
  const Di = { n, x: xi, L: Li, xf, sxf: sx, sxxf: sxx, sLf: sL, sLLf: sLL };
  return { Df, Di };
}

/* ---- linear algebra, small ---- */
function inverse(M) {
  const n = M.length, A = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c]; if (!d) throw new Error('singular');
    for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; }
  }
  return A.map((r) => r.slice(n));
}
const signedOf = (fam) => fam.signed || ['mu'];

/* ---- Nelder–Mead on the log-likelihood, in log-parameters for the positive ones ---- */
function nelderMead(fam, Df, th0, iters) {
  const sg = signedOf(fam);
  const pos = fam.names.map((nm) => !sg.includes(nm));
  const enc = (th) => th.map((v, i) => (pos[i] ? Math.log(v) : v)), dec = (u) => u.map((v, i) => (pos[i] ? Math.exp(v) : v));
  const f = (u) => { const v = fam.loglik(floatOps, dec(u), Df); return Number.isFinite(v) ? -v : Infinity; };
  const n = th0.length; let simplex = [enc(th0)];
  for (let i = 0; i < n; i++) { const p = enc(th0).slice(); p[i] += 0.1; simplex.push(p); }
  let vals = simplex.map(f);
  for (let it = 0; it < (iters || 2000); it++) {
    const order = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]); simplex = order.map((i) => simplex[i]); vals = order.map((i) => vals[i]);
    if (Math.abs(vals[n] - vals[0]) < 1e-12 * Math.max(1, Math.abs(vals[0])) && it > 50) break;
    const cen = Array.from({ length: n }, (_, j) => simplex.slice(0, n).reduce((s, p) => s + p[j], 0) / n);
    const refl = cen.map((c, j) => c + (c - simplex[n][j])), fr = f(refl);
    if (fr < vals[0]) { const exp = cen.map((c, j) => c + 2 * (c - simplex[n][j])), fe = f(exp); if (fe < fr) { simplex[n] = exp; vals[n] = fe; } else { simplex[n] = refl; vals[n] = fr; } continue; }
    if (fr < vals[n - 1]) { simplex[n] = refl; vals[n] = fr; continue; }
    const con = cen.map((c, j) => c + 0.5 * (simplex[n][j] - c)), fc = f(con);
    if (fc < vals[n]) { simplex[n] = con; vals[n] = fc; continue; }
    for (let i = 1; i <= n; i++) { simplex[i] = simplex[i].map((v, j) => simplex[0][j] + 0.5 * (v - simplex[0][j])); vals[i] = f(simplex[i]); }
  }
  const best = vals.indexOf(Math.min(...vals));
  return dec(simplex[best]);
}

/* ---- the float candidate: Nelder–Mead on ℓ, then Levenberg–Marquardt ascent ----
   A step is (−H + μ·diag|H|)⁻¹ g, taken only if the log-likelihood rises; μ
   shrinks after a success and grows after a failure, so far from the top the
   iteration climbs like scaled gradient ascent and near it it is Newton's. A
   family's `edge` stops the climb where the likelihood rises toward a
   boundary of the family instead of to a maximum inside it. */
function solve(M, g) {
  const Mi = inverse(M);
  return Mi.map((r) => r.reduce((s, v, j) => s + v * g[j], 0));
}
/* the Newton decrement gᵀ(−H)⁻¹g, or null when −H is not positive definite (Cholesky) */
function decrement(H, g) {
  const n = H.length, L = H.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = -H[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (!(s > 0)) return null; L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
  }
  const y = new Array(n); for (let i = 0; i < n; i++) { let s = g[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
  return y.reduce((s, v) => s + v * v, 0);
}
/* pure Newton on the score once the climb has flattened: on a long flat ridge ℓ stops
   rising measurably while the root still sits a visible distance along the ridge */
function polish(fam, Df, th) {
  const sg = signedOf(fam);
  let best = th, bestStep = Infinity;
  for (let it = 0; it < 40; it++) {
    const g = fam.score(floatOps, best, Df), H = fam.hess(floatOps, best, Df);
    let step; try { step = solve(H, g); } catch (e) { break; }
    const rel = Math.max(...step.map((v, i) => Math.abs(v) / Math.max(Math.abs(best[i]), 1e-300)));
    if (!(rel < bestStep)) break;                         /* the steps must shrink */
    const cand = best.map((v, i) => v - step[i]);
    if (!cand.every((v, i) => Number.isFinite(v) && (sg.includes(fam.names[i]) || v > 0))) break;
    best = cand; bestStep = rel;
    if (rel < 1e-15) break;
  }
  return best;
}
function newton(fam, Df, maxIter, start) {
  let th = start ? start.slice() : fam.init(Df);
  if (!start && fam.names.length > 2) th = nelderMead(fam, Df, th);
  if (fam.edge && fam.edge(th)) return { ok: false, edge: true, why: fam.edge(th), theta: th };
  const sg = signedOf(fam);
  const admissible = (t) => t.every((v, i) => Number.isFinite(v) && (sg.includes(fam.names[i]) || v > 0));
  let ll = fam.loglik(floatOps, th, Df), mu = 1e-3, last = Infinity;
  if (!Number.isFinite(ll)) return { ok: false, why: 'the log-likelihood is not finite at the start ' + th.join(', '), theta: th };
  const budget = maxIter || Math.max(400, Math.min(5000, Math.round(4e6 / Df.n)));   /* a long climb is cheap on short series */
  for (let it = 0; it < budget; it++) {
    const g = fam.score(floatOps, th, Df), H = fam.hess(floatOps, th, Df);
    const gn = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
    if (!Number.isFinite(gn)) return { ok: false, why: 'the score is not finite at ' + th.join(', '), theta: th };
    if (gn < 1e-11 * Math.max(1, Df.n)) return { ok: true, theta: th, iters: it, gnorm: gn };
    /* scale-free: the log-likelihood Newton would still gain is below the float noise of ℓ itself */
    const dec = decrement(H, g);
    if (dec !== null && dec / 2 < 1e-9) return { ok: true, theta: polish(fam, Df, th), iters: it, gnorm: gn, decrement: dec };
    last = gn;
    let moved = false;
    for (let k = 0; k < 60; k++) {
      const M = H.map((r, i) => r.map((v, j) => -v + (i === j ? mu * Math.max(Math.abs(H[i][i]), 1e-300) : 0)));
      let step; try { step = solve(M, g); } catch (e) { mu *= 4; continue; }
      const cand = th.map((v, i) => v + step[i]);
      if (admissible(cand)) {
        const l2 = fam.loglik(floatOps, cand, Df);
        if (Number.isFinite(l2) && l2 >= ll) {
          const same = cand.every((v, i) => v === th[i]);
          th = cand; ll = l2; mu = Math.max(mu / 3, 1e-12); moved = !same; break;
        }
      }
      mu *= 4;
    }
    if (fam.edge && fam.edge(th)) return { ok: false, edge: true, why: fam.edge(th), theta: th };
    if (!moved) {
      /* no step raises ℓ: either the top (then Newton's criterion above decides) or a flat float floor */
      const g2 = fam.score(floatOps, th, Df), gn2 = Math.sqrt(g2.reduce((s, v) => s + v * v, 0));
      const d2 = decrement(fam.hess(floatOps, th, Df), g2);
      if (gn2 < 1e-6 * Math.max(1, Df.n) || (d2 !== null && d2 / 2 < 1e-7)) return { ok: true, theta: polish(fam, Df, th), iters: it, gnorm: gn2, decrement: d2 };
      return { ok: false, why: 'no step raises the log-likelihood at ' + th.join(', ') + ' (score norm ' + gn2.toExponential(2) + ')', theta: th };
    }
  }
  return { ok: false, why: 'the ascent did not settle; last score norm ' + last, theta: th };
}

/* ---- the second order ----
   Krawczyk proves that the box X holds exactly one zero of the score; that zero
   is the likelihood's maximum in X when the Hessian is negative definite at every
   point of X. Two proofs; the first that succeeds is recorded:
     'box'    Sylvester's criterion on −H over X's interval Hessian: each leading
              principal minor enclosed, every lower end above zero. A Hessian is
              symmetric, so the two enclosures of an off-diagonal entry are
              intersected.
     'point'  Sylvester at the candidate alone (a thin box, so the minors are
              tight), and every Hessian over X nonsingular: with C = I − A·H(X),
              A the float inverse Krawczyk used and u > 0 the box's half-widths,
              |C|u < u componentwise gives ‖I − A·H‖_u < 1, so A·H and H are
              nonsingular, for each H in H(X). A continuous family of symmetric
              matrices none of which is singular keeps its signature over the
              connected X: negative definite at the candidate, negative definite
              on X.
   The first fails where the box's Hessian is too ill-conditioned for its minors
   (the generalized gamma's ridge); the second where the contraction has no room. */
function sylvester(H) {
  const n = H.length, M = [];
  for (let i = 0; i < n; i++) {
    M.push([]);
    for (let j = 0; j < n; j++) {
      const a = H[i][j], b = H[j][i], lo = Math.max(a[0], b[0]), hi = Math.min(a[1], b[1]);
      if (!(lo <= hi)) throw new Error('the Hessian\'s enclosures of one entry do not meet');
      M[i].push([-hi, -lo]);
    }
  }
  if (n > 3) throw new Error('sylvester: more than three parameters');
  const m = [M[0][0]];
  if (n >= 2) m.push(IV.sub(IV.mul(M[0][0], M[1][1]), IV.sqr(M[0][1])));
  if (n >= 3) {
    const a = IV.mul(M[0][0], IV.sub(IV.mul(M[1][1], M[2][2]), IV.sqr(M[1][2])));
    const b = IV.mul(M[0][1], IV.sub(IV.mul(M[0][1], M[2][2]), IV.mul(M[1][2], M[0][2])));
    const c = IV.mul(M[0][2], IV.sub(IV.mul(M[0][1], M[1][2]), IV.mul(M[1][1], M[0][2])));
    m.push(IV.add(IV.sub(a, b), c));
  }
  return m;
}
function secondOrder(fam, X, th0, A, Di) {
  const H = (B) => fam.hess(intervalOps, B, Di);
  const positive = (m) => m && m.every((q) => q[0] > 0);
  let mb = null, mp = null;
  try { mb = sylvester(H(X)); } catch (e) { mb = null; }
  if (positive(mb)) return { ok: true, how: 'box', minors: mb };
  try { mp = sylvester(H(th0.map((v) => IV.iv(v)))); } catch (e) { mp = null; }
  if (!positive(mp)) return { ok: false, minors: mb || mp };
  const J = H(X), n = X.length, u = X.map((b) => (b[1] - b[0]) / 2);
  for (let i = 0; i < n; i++) {
    let s = IV.iv(0);
    for (let j = 0; j < n; j++) {
      let c = IV.iv(i === j ? 1 : 0);
      for (let k = 0; k < n; k++) c = IV.sub(c, IV.mul(IV.iv(A[i][k]), J[k][j]));
      s = IV.add(s, IV.mul(IV.iv(Math.max(Math.abs(c[0]), Math.abs(c[1]))), IV.iv(u[j])));
    }
    if (!(s[1] < u[i])) return { ok: false, minors: mb || mp };
  }
  return { ok: true, how: 'point', minors: mp };
}

/* ---- the certificate: Krawczyk on the score over the interval data, then the second order ---- */
function certify(famName, xs, opts) {
  opts = opts || {};
  if (famName === 'gengamma') return certifyGG(xs, opts);
  const fam = Object.assign({ name: famName }, FAMILIES[famName]);
  const { Df, Di } = opts.prepared || prepare(xs);
  const cand = newton(fam, Df, opts.maxIter, opts.start);
  /* a climb stopped at a family's declared boundary is a refusal like any other: that the
     likelihood keeps rising past it is not proved, so it blocks a ranking (rankRule) */
  if (!cand.ok) return { ok: false, family: famName, edge: false, stoppedAtBoundary: !!cand.edge, why: cand.edge ? cand.why + ': no maximum found inside the family, and none proved absent' : 'no candidate: ' + cand.why, theta: cand.theta || null, n: Df.n };
  return certifyAt(fam, cand.theta, Df, Di, opts, cand.iters);
}
/* Krawczyk and the second order at a converged candidate */
function certifyAt(fam, th0, Df, Di, opts, iters) {
  const famName = fam.name;
  let A;
  try { A = inverse(fam.hess(floatOps, th0, Df)); } catch (e) { return { ok: false, family: famName, edge: false, why: 'singular Hessian at the candidate', theta: th0, n: Df.n }; }
  const Fi = (X) => fam.score(intervalOps, X, Di);
  const DFi = (X) => fam.hess(intervalOps, X, Di);
  let K;
  try { K = krawczyk(Fi, DFi, th0, A, { maxRounds: (opts && opts.maxRounds) || 12, radCap: (opts && opts.radCap) || 1 }); }
  catch (e) { return { ok: false, family: famName, edge: false, why: 'Krawczyk: the box grew until the score was undefined on it (' + e.message + ')', theta: th0, n: Df.n, newtonIters: iters }; }
  if (!K.ok) return { ok: false, family: famName, edge: false, why: 'Krawczyk: ' + K.why, theta: th0, n: Df.n, newtonIters: iters };
  const SO = secondOrder(fam, K.box, th0, A, Di);
  if (!SO.ok) return { ok: false, family: famName, edge: false, why: 'the box holds one zero of the score, but the Hessian is not proved negative definite over it' + (SO.minors ? ' (leading minors of −H: ' + SO.minors.map((m) => '[' + m[0].toPrecision(3) + ', ' + m[1].toPrecision(3) + ']').join(', ') + ')' : '') + ': not proved a maximum', theta: th0, n: Df.n, newtonIters: iters };
  return { ok: true, family: famName, names: fam.names, theta: th0, box: K.box, maxRad: K.maxRad, secondOrder: SO.how, minors: SO.minors, rounds: K.rounds, n: Df.n, newtonIters: iters, fam, Di, Df };
}

/* ---- the generalized gamma: a maximum inside the family, or its lognormal limit, decided ----
   As α → ∞ with c → 0 the family tends to the lognormal (Prentice's Q → 0), so its
   likelihood's supremum is at least the lognormal's maximum, and on many series the
   likelihood keeps rising all the way there. Three searches: the (α, c, λ) climb from the
   Weibull (α = 1), and two climbs in Prentice's (μ, σ, Q) — from where the first stopped,
   and from the lognormal fit at Q = 0.02, to find a maximum close to the limit. Each
   converged point is certified by Krawczyk and the second order (in Prentice's
   coordinates by their series form, where the (α, c, λ) ridge will not contract).
     · a certified maximum whose log-likelihood lies wholly above the lognormal's certified
       maximum is the fit;
     · otherwise, if THE BOUNDARY TEST holds, the family is refused AT ITS EDGE: over
       B × (0, q₁] — B the box μ̂ ± kσ̂/√n, σ̂(1 ± k/√(2n)) around the lognormal fit, the
       widest of k = 3, 1, 0.3, 0.1 that proves it, or the lognormal's own certified box
       (k = 0) — the Prentice score's Q-component is proved negative, so every member
       there is less likely than the lognormal at the same (μ, σ), hence than the
       lognormal's maximum: near its limit the family's likelihood is highest at the limit
       itself. Like a certified maximum, that is a local fact, and its neighbourhood is
       recorded; that no better point exists elsewhere in the family is the search's
       claim, as it is for every fit here. rankRule leaves such a family out, named: the
       lognormal, which is ranked, is what its likelihood reaches;
     · otherwise REFUSED, which blocks a ranking. */
const Q_START = 0.02;
function boundaryTest(Di, lim) {
  const P = FAMILIES.gengammaP, o = intervalOps, n = Di.n;
  const [mu, sg] = lim.theta;
  for (const k of [3, 1, 0.3, 0.1, 0]) {                     /* k = 0: the lognormal's own certified box */
    const B = [[IV.nextDown(Math.min(lim.box[0][0], mu - k * sg / Math.sqrt(n))), IV.nextUp(Math.max(lim.box[0][1], mu + k * sg / Math.sqrt(n)))],
      [IV.nextDown(Math.min(lim.box[1][0], sg * (1 - k / Math.sqrt(2 * n)))), IV.nextUp(Math.max(lim.box[1][1], sg * (1 + k / Math.sqrt(2 * n))))]];
    if (!(B[1][0] > 0)) continue;
    for (const q1 of [0.05, 0.02, 0.01, 0.005, 0.002]) {
      let dq = null;
      try { dq = P.score(o, [B[0], B[1], [0, q1]], Di)[2]; } catch (e) { dq = null; }
      if (dq && dq[1] < 0) return { ok: true, k, q1, mu: B[0], sigma: B[1], dq };
    }
  }
  let d0 = null;
  try { d0 = P.score(o, [lim.box[0], lim.box[1], [0, 0]], Di)[2]; } catch (e) { d0 = null; }
  return { ok: false, dq0: d0 };
}
function certifyGG(xs, opts) {
  const { Df, Di } = opts.prepared || prepare(xs);
  const S = Object.assign({ name: 'gengamma' }, FAMILIES.gengamma), P = Object.assign({ name: 'gengammaP' }, FAMILIES.gengammaP);
  const n = Df.n, notes = [], found = [];
  let uncertified = null;
  const lim = certify('lognormal', xs, { prepared: { Df, Di } });
  if (!lim.ok) return { ok: false, family: 'gengamma', edge: false, why: 'its lognormal limit could not be certified: ' + lim.why, theta: null, n };
  const llLim = FAMILIES.lognormal.loglik(intervalOps, lim.box, Di), llLimF = FAMILIES.lognormal.loglik(floatOps, lim.theta, Df);
  const withStacy = (c) => {                            /* a Prentice certificate carried back to (α, c, λ), as an enclosure */
    const [m, sgm, q] = c.box, o = intervalOps, a = o.div(o.c(1), o.mul(q, q)), cc = o.div(q, sgm);
    return Object.assign(c, { family: 'gengamma', coords: 'gengammaP', stacy: P.toStacy(c.theta), stacyBox: [a, cc, o.exp(o.sub(m, o.div(o.log(a), cc)))] });
  };
  const consider = (fam, cand, label) => {
    if (!cand.ok) { notes.push(label + ': ' + cand.why); return; }
    const c = certifyAt(fam, cand.theta, Df, Di, opts, cand.iters);
    if (c.ok) { c.ll = fam.loglik(intervalOps, c.box, Di); c.family = 'gengamma'; found.push(fam.name === 'gengammaP' ? withStacy(c) : c); return; }
    const llF = fam.loglik(floatOps, cand.theta, Df);
    notes.push(label + ': converged, not certified (' + c.why + ')');
    if (!uncertified || llF > uncertified.llF) uncertified = { llF, theta: cand.theta, coords: fam.name, why: c.why };
  };
  const c1 = newton(S, Df, opts.maxIter);
  consider(S, c1, 'in (α, c, λ) from α = 1');
  const starts = [];
  if (c1.theta) { const p = P.fromStacy(c1.theta); if (p.every(Number.isFinite) && p[1] > 0 && p[2] > 0.002) starts.push(['in (μ, σ, Q) from where that climb stopped', p]); }
  starts.push(['in (μ, σ, Q) from the lognormal fit at Q = ' + Q_START, [lim.theta[0], lim.theta[1], Q_START]]);
  for (const [label, st] of starts) consider(P, newton(P, Df, opts.maxIter, st), label);
  const best = found.reduce((m, c) => (!m || c.ll[0] > m.ll[0] ? c : m), null);
  if (best && best.ll[0] > llLim[1]) return Object.assign(best, { limit: { family: 'lognormal', ll: llLim } });
  if (uncertified && uncertified.llF > llLimF) return { ok: false, family: 'gengamma', edge: false, theta: uncertified.theta, n, why: 'the search found a stationary point inside the family more likely than the lognormal limit (' + uncertified.coords + ' ' + uncertified.theta.map((v) => Number(v).toPrecision(5)).join(', ') + ') and could not certify it: ' + uncertified.why };
  if (best && best.ll[1] >= llLim[0]) return { ok: false, family: 'gengamma', edge: false, theta: best.theta, n, why: 'a certified maximum inside the family and the lognormal limit have log-likelihoods the enclosures cannot order' };
  const bt = boundaryTest(Di, lim);
  if (bt.ok) {
    return { ok: false, family: 'gengamma', edge: true, theta: best ? best.theta : null, n, limit: { family: 'lognormal', ll: llLim }, boundary: bt,
      why: 'its likelihood is highest at the family\'s lognormal limit: over μ in [' + bt.mu[0].toPrecision(6) + ', ' + bt.mu[1].toPrecision(6) + '], σ in [' + bt.sigma[0].toPrecision(6) + ', ' + bt.sigma[1].toPrecision(6) + '] and 0 < Q ≤ ' + bt.q1 + ' the derivative of ℓ in Q is proved negative (at most ' + bt.dq[1].toPrecision(3) + '), so every member there is less likely than the lognormal\'s certified maximum ' + llLim[0].toFixed(3) + (best ? '; the one maximum inside the family the search certified lies below it (' + best.ll[1].toFixed(3) + ')' : '; the search found no maximum inside the family') };
  }
  return { ok: false, family: 'gengamma', edge: false, theta: best ? best.theta : null, n, why: 'no certified maximum inside the family above its lognormal limit, and the limit is not proved the likelihood\'s peak near it' + (bt.dq0 ? ' (∂ℓ/∂Q at the limit in [' + bt.dq0[0].toPrecision(3) + ', ' + bt.dq0[1].toPrecision(3) + '])' : '') + (notes.length ? '; ' + notes.join('; ') : '') };
}

/* ---- the fitted CDF (and survival function) at every sorted datum, once ----
   A family's own sf avoids the cancellation of 1 − F in the far upper tail
   (the normal's 1 − Φ at 12σ is 10⁻³³; as 1 − F it is 0). */
function sortedCdf(cert) {
  const { fam, box, Di } = cert;
  const n = Di.n;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => Di.xf[a] - Di.xf[b]);
  const F = new Array(n), S = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = Di.x[idx[i]];
    F[i] = intervalOps.clamp01(fam.cdf(intervalOps, box, x));
    S[i] = fam.sf ? intervalOps.clamp01(fam.sf(intervalOps, box, x)) : [IV.nextDown(1 - F[i][1]), IV.nextUp(1 - F[i][0])];
  }
  return { idx, F, S, xs: idx.map((i) => Di.xf[i]) };
}
function adFrom(F, Sv) {
  const n = F.length;
  let S = IV.iv(0);
  for (let i = 0; i < n; i++) {
    const Fa = F[i], Sb = Sv[n - 1 - i];
    if (!(Fa[0] > 0) || !(Sb[0] > 0)) return null;           /* a log of 0: the enclosure cannot be stated */
    S = IV.add(S, IV.mul(IV.iv(2 * i + 1), IV.add(TR.log(Fa), TR.log(Sb))));
  }
  return IV.sub(IV.neg(IV.iv(n)), IV.div(S, IV.iv(n)));
}
function ksFrom(F) {
  const n = F.length, N = IV.iv(n);
  let lo = -Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) {
    const a = IV.sub(IV.div(IV.iv(i + 1), N), F[i]), b = IV.sub(F[i], IV.div(IV.iv(i), N));
    lo = Math.max(lo, a[0], b[0]); hi = Math.max(hi, a[1], b[1]);
  }
  return [lo, hi];
}
function mseFrom(F, xs) {
  const n = F.length, N = IV.iv(n);
  let S = IV.iv(0);
  for (let i = 0; i < n; ) {
    let j = i; while (j + 1 < n && xs[j + 1] === xs[i]) j++;          /* a tie group: F_n = (j+1)/n on all of it */
    const En = IV.div(IV.iv(j + 1), N);
    for (let k = i; k <= j; k++) S = IV.add(S, IV.sqr(IV.sub(F[k], En)));
    i = j + 1;
  }
  return IV.div(S, N);
}
/* χ² as the paper computes it, with the binning exact: data are rationals num/den */
function chi2From(cert, xs, den) {
  const n = xs.length;
  if (!den) return { value: null, why: 'no exact denominator for the data' };
  if (!(den <= 1e22 && Number.isInteger(den))) return { value: null, why: 'the denominator ' + den + ' is not an exact double' };
  let k = 0; while (2 ** k < n) k++;                                   /* ⌈log2 n⌉ */
  k = Math.max(8, k + 1);                                              /* Sturges, at least eight bins */
  /* the binning is exact while k·|num| < 2⁵²: then x·den rounds to num, and k·num, j·span and their sums are exact */
  const cap = Math.pow(2, 52) / k;
  const nums = xs.map((x) => {
    const m = Math.round(x * den);
    if (!(Math.abs(m) < cap)) throw new Error('χ²: a datum times ' + den + ' is too large for the binning to stay exact in doubles');
    if (Math.abs(x * den - m) > 1e-6 * Math.max(1, Math.abs(m))) throw new Error('χ²: a datum is not a multiple of 1/' + den);
    return m;
  });
  const m0 = nums[0], m1 = nums[n - 1], span = m1 - m0;
  if (span <= 0) return { value: null, why: 'the data have no spread' };
  const O = new Array(k).fill(0);
  for (const m of nums) { let j = Math.floor((k * (m - m0)) / span); if (j >= k) j = k - 1; O[j]++; }   /* [e_j, e_{j+1}), the last bin closed */
  const kden = IV.mul(IV.iv(k), IV.iv(den));
  const edge = (j) => IV.div(IV.iv(k * m0 + j * span), kden);                    /* e_j = min + j·span/k, a rational */
  const Fe = []; for (let j = 0; j <= k; j++) Fe.push(intervalOps.clamp01(cert.fam.cdf(intervalOps, cert.box, edge(j))));
  let X = IV.iv(0), kept = 0;
  for (let j = 0; j < k; j++) {
    const E = IV.mul(IV.iv(n), IV.sub(Fe[j + 1], Fe[j]));
    if (E[0] >= 5) { X = IV.add(X, IV.div(IV.sqr(IV.sub(IV.iv(O[j]), E)), E)); kept++; }
    else if (E[1] >= 5) return { value: null, refused: true, why: 'bin ' + (j + 1) + ' of ' + k + ': its expected count [' + E[0].toFixed(6) + ', ' + E[1].toFixed(6) + '] straddles the keep-if-at-least-5 rule', bins: k };
  }
  if (kept < 2) return { value: null, why: 'fewer than two bins keep an expected count of 5 (undefined, as the paper has it)', bins: k, kept };
  return { value: X, bins: k, kept };
}
function criteria(cert, den) {
  const { F, S, xs } = sortedCdf(cert);
  const ad = adFrom(F, S), ks = ksFrom(F), mse = mseFrom(F, xs);
  let chi2;
  try { chi2 = chi2From(cert, xs, den); } catch (e) { chi2 = { value: null, refused: true, why: e.message }; }
  return { ad, ks, mse, chi2 };
}
/* the paper's selection statistic alone, for callers that need only it */
function andersonDarling(cert) { const s = sortedCdf(cert); return adFrom(s.F, s.S); }

/* ---- return levels over the box ---- */
function returnLevel(cert, T, blockHours) {
  const p = IV.sub(IV.iv(1), IV.div(IV.iv(blockHours), IV.mul(IV.iv(T), IV.iv(8766))));
  if (!(p[0] > 0)) return null;                       /* fewer than one block per return period: no level to name */
  return cert.fam.quantile(intervalOps, cert.box, p);
}
/* ---- a ranking under any criterion: decided or refused ---- */
function rankBy(entries, key) {
  const ok = entries.filter((e) => e[key] && Array.isArray(e[key]) && Number.isFinite(e[key][0]) && Number.isFinite(e[key][1]));
  if (!ok.length) return { verdict: 'REFUSED', why: 'no family has the statistic' };
  const best = ok.reduce((m, e) => (e[key][1] < m[key][1] ? e : m));
  const tied = ok.filter((e) => e !== best && e[key][0] <= best[key][1]);
  return tied.length ? { verdict: 'REFUSED', best: best.family, tied: tied.map((e) => e.family), why: 'enclosures overlap' } : { verdict: 'DECIDED', best: best.family };
}
const rank = (entries) => rankBy(entries, 'ad');
/* THE ranking rule, the one place it lives (the ledger and the tab both call it).
   entries: [{family, refused, edge, ad, ks, mse, chi2, chi2Refused, unstated}]. A
   family refused AT ITS EDGE — the generalized gamma whose likelihood is proved
   highest at its lognormal limit near it (certifyGG) — is left out, named, the
   lognormal being ranked; a family refused for any other reason makes the
   ranking REFUSED, since its maximum might exist and win. A statistic that could
   not be enclosed (a log of zero, a throw, a bound that is not finite) refuses
   the ranking; an undecided χ² bin rule refuses χ²; a χ² the paper leaves
   undefined (fewer than two kept bins) leaves that family out of χ², named. */
function rankRule(entries, k) {
  const blocked = entries.filter((e) => e.refused && !e.edge).map((e) => e.family);
  if (blocked.length) return { verdict: 'REFUSED', why: 'no certified fit for ' + blocked.join(', ') + ' — its maximum might exist and win' };
  const unstated = entries.filter((e) => !e.refused && ((e.unstated && e.unstated.includes(k)) || (e[k] && !(Number.isFinite(e[k][0]) && Number.isFinite(e[k][1]))) || (k !== 'chi2' && !e[k]))).map((e) => e.family);
  if (unstated.length) return { verdict: 'REFUSED', why: 'the statistic could not be enclosed for ' + unstated.join(', ') };
  const straddle = k === 'chi2' ? entries.filter((e) => e.chi2Refused).map((e) => e.family) : [];
  if (straddle.length) return { verdict: 'REFUSED', why: 'χ² is not decided for ' + straddle.join(', ') + ' (an expected count straddling 5, or data the exact binning cannot hold)' };
  const excluded = entries.filter((e) => e.refused).map((e) => e.family);
  const undefinedFor = entries.filter((e) => !e.refused && !e[k]).map((e) => e.family);
  const r = rankBy(entries.filter((e) => !e.refused && e[k]), k);
  if (excluded.length) r.excluded = excluded;
  if (undefinedFor.length) r.undefinedFor = undefinedFor;
  return r;
}

/* ---- printed fits: the box their digits allow, the likelihood and the levels over it ---- */
function printedBox(s) {                               /* "0.0634" → [0.06335, 0.06345]; plain decimals only */
  const t = String(s).trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw new Error('printedBox: "' + t + '" is not a plain decimal');
  const neg = t.startsWith('-'), u = neg ? t.slice(1) : t;
  const dot = u.indexOf('.'), d = dot < 0 ? 0 : u.length - dot - 1;
  const v = Number(t), h = 0.5 * Math.pow(10, -d);
  return [IV.nextDown(v - h), IV.nextUp(v + h)];
}
function shifted(Di, loc) {                            /* the data x − γ as the family sees them; null where x ≤ γ */
  const x = [], L = [];
  for (let i = 0; i < Di.n; i++) { const w = IV.sub(Di.x[i], loc); if (!(w[0] > 0)) return null; x.push(w); L.push(TR.log(w)); }
  return { n: Di.n, x, L };
}
function zeroDensity(xf, loc) {                        /* data at or below a location: [certainly, possibly] */
  let certain = 0, possible = 0;
  for (const x of xf) { if (x <= loc[0]) certain++; if (x <= loc[1]) possible++; }
  return [certain, possible];
}
function llAt(famName, theta, loc, Di) {
  const fam = FAMILIES[famName];
  const D = loc ? shifted(Di, loc) : Di;
  if (!D) return null;
  return fam.loglik(intervalOps, theta, D);
}
function levelAt(famName, theta, loc, T, blockHours) {
  const p = IV.sub(IV.iv(1), IV.div(IV.iv(blockHours), IV.mul(IV.iv(T), IV.iv(8766))));
  const q = FAMILIES[famName].quantile(intervalOps, theta, p);
  return loc ? IV.add(q, loc) : q;
}

module.exports = { floatOps, intervalOps, prepare, newton, nelderMead, certify, certifyAt, boundaryTest, sylvester, secondOrder, sortedCdf, criteria, andersonDarling, returnLevel, rank, rankBy, rankRule, inverse, printedBox, shifted, zeroDensity, llAt, levelAt };
