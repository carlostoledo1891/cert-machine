/* instruments/hseva/fit.js — the return-level table as a certificate.

   A maximum-likelihood fit is a zero of the score equations. Here it is
   CERTIFIED: a float Newton iteration finds a candidate, and the Krawczyk
   operator (instruments/interval/radii.js) proves that a box around it
   contains exactly one zero of the score — evaluated in outward-rounded
   interval arithmetic over every data point, with exp and log from the
   certified transcendental module. Everything downstream is an interval
   extension over that box:
     · the Anderson–Darling statistic A² = −n − (1/n) Σ (2i−1)[ln F(x_(i)) + ln(1 − F(x_(n+1−i)))]
       — the paper's chosen goodness-of-fit criterion, as an enclosure;
     · the T-year return level F⁻¹(1 − b/(T·8766)) for a block of b hours,
       as an enclosure (365.25 × 24 = 8766 hours a year, exactly).
   A ranking of families by A² is DECIDED when the best enclosure's upper end
   is below every other's lower end, and REFUSED otherwise, naming the tie.

   Two arithmetics, one formula set (families.js): `floatOps` for the
   candidate, `intervalOps` for the certificate. The float path is never
   trusted for a stated number. */
'use strict';
const path = require('path');
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { krawczyk } = require(path.join(__dirname, '..', 'interval', 'radii.js'));
const { FAMILIES, makePhi } = require('./families.js');

/* ---- the two arithmetics ---- */
const floatOps = {
  c: (v) => v, add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b,
  exp: Math.exp, log: Math.log, neg: (a) => -a, abs: Math.abs, sqrt: Math.sqrt,
  lo: (a) => a, hi: (a) => a, widen: (a) => a, hull: (a, b) => (a + b) / 2, max: Math.max, clampAbs: (a, m) => Math.max(-m, Math.min(m, a)),
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
};
/* Φ and Φ⁻¹ on each arithmetic. Φ⁻¹ by bisection on the certified Φ: in
   intervals the bracket tightens only where the sign is certain. */
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
  for (let i = 0; i < n; i++) { xi[i] = [IV.nextDown(xf[i]), IV.nextUp(xf[i])]; Li[i] = TR.log(xi[i]); }
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

/* ---- Nelder–Mead on the log-likelihood, in log-parameters for the positive ones ---- */
function nelderMead(fam, Df, th0, iters) {
  const pos = fam.names.map((nm) => nm !== 'mu');
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

/* ---- the float candidate: Nelder–Mead on ℓ, then damped Newton on the score ---- */
function newton(fam, Df, maxIter) {
  let th = fam.init(Df);
  if (fam.names.length > 2) th = nelderMead(fam, Df, th);
  const F = FAMILIES[fam.name] || fam;
  let last = Infinity;
  for (let it = 0; it < (maxIter || 200); it++) {
    const g = F.score(floatOps, th, Df), H = F.hess(floatOps, th, Df);
    const gn = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
    if (!Number.isFinite(gn)) return { ok: false, why: 'the score is not finite at ' + th.join(', ') };
    if (gn < 1e-11 * Math.max(1, Df.n)) return { ok: true, theta: th, iters: it, gnorm: gn };
    let step;
    try { const Hi = inverse(H); step = Hi.map((r) => r.reduce((s, v, j) => s + v * g[j], 0)); } catch (e) { step = g.map((v) => v * 1e-3); }
    /* damping: keep every parameter positive where it must be, and shrink the step while the score norm does not fall */
    let lam = 1;
    for (let k = 0; k < 40; k++) {
      const cand = th.map((v, i) => v - lam * step[i]);
      if (cand.every((v, i) => (F.names[i] === 'mu' ? true : v > 0))) {
        const g2 = F.score(floatOps, cand, Df); const gn2 = Math.sqrt(g2.reduce((s, v) => s + v * v, 0));
        if (Number.isFinite(gn2) && gn2 < gn) { th = cand; break; }
      }
      lam /= 2;
      if (k === 39) return { ok: false, why: 'no descending Newton step at ' + th.join(', ') };
    }
    last = gn;
  }
  return { ok: false, why: 'Newton did not converge; last score norm ' + last };
}

/* ---- the certificate: Krawczyk on the score over the interval data ---- */
function certify(famName, xs, opts) {
  const fam = Object.assign({ name: famName }, FAMILIES[famName]);
  const { Df, Di } = prepare(xs);
  const cand = newton(fam, Df, opts && opts.maxIter);
  if (!cand.ok) return { ok: false, family: famName, why: 'no candidate: ' + cand.why, n: xs.length };
  const th0 = cand.theta;
  let A;
  try { A = inverse(fam.hess(floatOps, th0, Df)); } catch (e) { return { ok: false, family: famName, why: 'singular Hessian at the candidate', theta: th0 }; }
  const Fi = (X) => fam.score(intervalOps, X, Di);
  const DFi = (X) => fam.hess(intervalOps, X, Di);
  let K;
  try { K = krawczyk(Fi, DFi, th0, A, { maxRounds: opts && opts.maxRounds || 12, radCap: opts && opts.radCap || 1 }); }
  catch (e) { return { ok: false, family: famName, why: 'Krawczyk: the box grew until the score was undefined on it (' + e.message + ')', theta: th0, n: xs.length, newtonIters: cand.iters }; }
  if (!K.ok) return { ok: false, family: famName, why: 'Krawczyk: ' + K.why, theta: th0, n: xs.length, newtonIters: cand.iters };
  return { ok: true, family: famName, names: fam.names, theta: th0, box: K.box, maxRad: K.maxRad, rounds: K.rounds, n: xs.length, newtonIters: cand.iters, fam, Di, Df };
}

/* ---- Anderson–Darling over the box, on the sorted data ---- */
function andersonDarling(cert) {
  const { fam, box, Di } = cert;
  const n = Di.n;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => Di.xf[a] - Di.xf[b]);
  let S = IV.iv(0);
  const one = IV.iv(1);
  for (let i = 0; i < n; i++) {
    const Fa = fam.cdf(intervalOps, box, Di.x[idx[i]]);            /* F(x_(i+1)) */
    const Fb = fam.cdf(intervalOps, box, Di.x[idx[n - 1 - i]]);    /* F(x_(n−i)) */
    const la = TR.log([Math.max(Fa[0], 1e-300), Math.max(Math.min(Fa[1], 1), 1e-300)]);
    const lb = TR.log([Math.max(1 - Fb[1], 1e-300), Math.max(Math.min(1 - Fb[0], 1), 1e-300)]);
    S = IV.add(S, IV.mul(IV.iv(2 * i + 1), IV.add(la, lb)));
  }
  return IV.sub(IV.neg(IV.iv(n)), IV.div(S, IV.iv(n)));
}
/* ---- return levels over the box ---- */
function returnLevel(cert, T, blockHours) {
  const p = IV.sub(IV.iv(1), IV.div(IV.iv(blockHours), IV.mul(IV.iv(T), IV.iv(8766))));
  if (!(p[0] > 0)) return null;                       /* fewer than one block per return period: no level to name */
  return cert.fam.quantile(intervalOps, cert.box, p);
}
/* ---- the ranking: decided or refused ---- */
function rank(entries) {
  const ok = entries.filter((e) => e.ad);
  if (!ok.length) return { verdict: 'REFUSED', why: 'no family certified' };
  const best = ok.reduce((m, e) => (e.ad[1] < m.ad[1] ? e : m));
  const tied = ok.filter((e) => e !== best && e.ad[0] <= best.ad[1]);
  return tied.length ? { verdict: 'REFUSED', best: best.family, tied: tied.map((e) => e.family), why: 'A² enclosures overlap' } : { verdict: 'DECIDED', best: best.family };
}

module.exports = { floatOps, intervalOps, prepare, newton, nelderMead, certify, andersonDarling, returnLevel, rank, inverse };
