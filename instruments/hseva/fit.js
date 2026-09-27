/* instruments/hseva/fit.js — the return-level table as a certificate.

   A maximum-likelihood fit is a zero of the score equations. Here it is
   CERTIFIED: a float Newton iteration finds a candidate, and the Krawczyk
   operator (instruments/interval/radii.js) proves that a box around it
   contains exactly one zero of the score — evaluated in outward-rounded
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
    const cert = (z, target, wantAbove) => { const v = intervalOps.Phi(IV.iv(z)); return wantAbove ? v[0] > target : v[1] < target; };
    let lo = -12, hi = 12;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (cert(mid, phi, true)) hi = mid; else if (cert(mid, plo, false)) lo = mid; else break;
      if (hi - lo < 1e-14) break;
    }
    return isIv ? [lo, hi] : (lo + hi) / 2;
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

/* ---- the certificate: Krawczyk on the score over the interval data ---- */
function certify(famName, xs, opts) {
  opts = opts || {};
  const fam = Object.assign({ name: famName }, FAMILIES[famName]);
  const { Df, Di } = opts.prepared || prepare(xs);
  const cand = newton(fam, Df, opts.maxIter, opts.start);
  /* THE LIMIT TEST. A family that tends to another at its boundary (the generalized gamma
     to the lognormal as α → ∞) has a likelihood whose supremum is at least that family's
     maximum. A candidate whose certified log-likelihood lies wholly below the limit family's
     certified maximum is therefore not the maximum of its family — whether the climb
     converged there or not — and no point inside the family that reaches the limit's was
     found: that is the edge, decided by two enclosures, and no Krawczyk is spent on it. */
  if (fam.limit && cand.theta && !cand.edge) {
    const lim = certify(fam.limit, xs, { prepared: { Df, Di } });
    if (lim.ok) {
      const llLim = FAMILIES[fam.limit].loglik(intervalOps, lim.box, Di);
      let llHere = null;
      try { llHere = fam.loglik(intervalOps, cand.theta.map((v) => IV.iv(v)), Di); } catch (e) { llHere = null; }
      if (llHere && llHere[1] < llLim[0]) {
        return { ok: false, family: famName, edge: true, theta: cand.theta, n: Df.n,
          why: 'the climb stopped at ' + fam.names.map((nm, i) => nm + ' ' + Number(cand.theta[i]).toPrecision(4)).join(', ') + ' with a log-likelihood of at most ' + llHere[1].toFixed(3) + ', below the ' + fam.limit + '\'s certified maximum ' + llLim[0].toFixed(3) + ': the family\'s supremum is at least its ' + fam.limit + ' limit, reached only as α → ∞, and no point inside the family reaches it',
          limit: { family: fam.limit, ll: llLim, llHere } };
      }
    }
  }
  /* where a family declares other coordinates for the same distribution (the generalized
     gamma's Prentice form), a candidate these coordinates could not certify is tried there
     before it is refused: the certificate is then in those coordinates, of the same fit */
  const viaFallback = (refusal) => {
    if (!fam.fallback || !refusal.theta || refusal.edge) return refusal;
    const P = FAMILIES[fam.fallback];
    const alt = certify(fam.fallback, xs, { prepared: { Df, Di }, start: P.fromStacy(refusal.theta) });
    if (alt.ok) {
      /* the certified box carried back to (α, c, λ), as an enclosure: α = Q⁻², c = Q/σ, λ = exp(μ − ln α / c) */
      const [m, sg, q] = alt.box, o = intervalOps, a = o.div(o.c(1), o.mul(q, q)), cc = o.div(q, sg);
      const stacyBox = [a, cc, o.exp(o.sub(m, o.div(o.log(a), cc)))];
      return Object.assign(alt, { family: famName, coords: fam.fallback, stacy: P.toStacy(alt.theta), stacyBox, firstTry: refusal.why });
    }
    return Object.assign(refusal, { why: refusal.why + '; in ' + fam.fallback + ' coordinates too: ' + alt.why });
  };
  if (!cand.ok) return viaFallback({ ok: false, family: famName, edge: !!cand.edge, why: (cand.edge ? '' : 'no candidate: ') + cand.why, theta: cand.theta || null, n: Df.n });
  const th0 = cand.theta;
  let A;
  try { A = inverse(fam.hess(floatOps, th0, Df)); } catch (e) { return viaFallback({ ok: false, family: famName, why: 'singular Hessian at the candidate', theta: th0, n: Df.n }); }
  const Fi = (X) => fam.score(intervalOps, X, Di);
  const DFi = (X) => fam.hess(intervalOps, X, Di);
  let K;
  try { K = krawczyk(Fi, DFi, th0, A, { maxRounds: opts.maxRounds || 12, radCap: opts.radCap || 1 }); }
  catch (e) { return viaFallback({ ok: false, family: famName, why: 'Krawczyk: the box grew until the score was undefined on it (' + e.message + ')', theta: th0, n: Df.n, newtonIters: cand.iters }); }
  if (!K.ok) return viaFallback({ ok: false, family: famName, why: 'Krawczyk: ' + K.why, theta: th0, n: Df.n, newtonIters: cand.iters });
  return { ok: true, family: famName, names: fam.names, theta: th0, box: K.box, maxRad: K.maxRad, rounds: K.rounds, n: Df.n, newtonIters: cand.iters, fam, Di, Df };
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
  const nums = xs.map((x) => { const m = Math.round(x * den); if (Math.abs(x * den - m) > 1e-6 * Math.max(1, Math.abs(m))) throw new Error('χ²: a datum is not a multiple of 1/' + den); return m; });
  let k = 0; while (2 ** k < n) k++;                                   /* ⌈log2 n⌉ */
  k = Math.max(8, k + 1);                                              /* Sturges, at least eight bins */
  const m0 = nums[0], m1 = nums[n - 1], span = m1 - m0;
  if (span <= 0) return { value: null, why: 'the data have no spread' };
  const O = new Array(k).fill(0);
  for (const m of nums) { let j = Math.floor((k * (m - m0)) / span); if (j >= k) j = k - 1; O[j]++; }   /* [e_j, e_{j+1}), the last bin closed */
  const edge = (j) => IV.div(IV.iv(k * m0 + j * span), IV.iv(k * den));          /* e_j = min + j·span/k, a rational */
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
  try { chi2 = chi2From(cert, xs, den); } catch (e) { chi2 = { value: null, why: e.message }; }
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
  const ok = entries.filter((e) => e[key] && Array.isArray(e[key]));
  if (!ok.length) return { verdict: 'REFUSED', why: 'no family has the statistic' };
  const best = ok.reduce((m, e) => (e[key][1] < m[key][1] ? e : m));
  const tied = ok.filter((e) => e !== best && e[key][0] <= best[key][1]);
  return tied.length ? { verdict: 'REFUSED', best: best.family, tied: tied.map((e) => e.family), why: 'enclosures overlap' } : { verdict: 'DECIDED', best: best.family };
}
const rank = (entries) => rankBy(entries, 'ad');
/* THE ranking rule, the one place it lives (the ledger and the tab both call it).
   entries: [{family, refused, edge, ad, ks, mse, chi2, chi2Refused}]. A family
   refused at its edge has no maximum-likelihood fit and is left out, named; a
   family refused for any other reason makes the ranking REFUSED, since its
   fit might exist and win; an undecided χ² bin rule refuses χ². */
function rankRule(entries, k) {
  const blocked = entries.filter((e) => e.refused && !e.edge).map((e) => e.family);
  if (blocked.length) return { verdict: 'REFUSED', why: 'no certified fit for ' + blocked.join(', ') + ' — its maximum might exist and win' };
  const straddle = k === 'chi2' ? entries.filter((e) => e.chi2Refused).map((e) => e.family) : [];
  if (straddle.length) return { verdict: 'REFUSED', why: 'the χ² bin rule is undecided for ' + straddle.join(', ') };
  const excluded = entries.filter((e) => e.refused).map((e) => e.family);
  const undefinedFor = entries.filter((e) => !e.refused && !e[k]).map((e) => e.family);
  const r = rankBy(entries.filter((e) => !e.refused && e[k]), k);
  if (excluded.length) r.excluded = excluded;
  if (undefinedFor.length) r.undefinedFor = undefinedFor;
  return r;
}

/* ---- printed fits: the box their digits allow, the likelihood and the levels over it ---- */
function printedBox(s) {                               /* "0.0634" → [0.06335, 0.06345] */
  const t = String(s).trim(), neg = t.startsWith('-'), u = neg ? t.slice(1) : t;
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

module.exports = { floatOps, intervalOps, prepare, newton, nelderMead, certify, sortedCdf, criteria, andersonDarling, returnLevel, rank, rankBy, rankRule, inverse, printedBox, shifted, zeroDensity, llAt, levelAt };
