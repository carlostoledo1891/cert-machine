/* rays.js — Kerr null geodesics traced backward from an observer at infinity: the lensing maps of Phase 1.
   instruments/kerr · cert-machine · 2026-10-31 (pre-registered in notes/black-hole-phase0-preregistration-2026-10-31.md,
   § Phase 1, before any ray was traced).

   COMPUTED, NOT DECIDED. Everything here is double precision with error control, never an enclosure. It is the
   picture layer; kerr.js (the decided curve) is what it is checked against, never the other way round.

   THE EQUATIONS (M = 1; Mino time τ, dτ = dλ_affine / Σ). For a photon of energy 1, angular momentum λ and Carter
   constant η, with u = cos θ, Δ = r² − 2r + a², A = r² + a² − aλ, Q = η + (λ − a)²:
     R(r) = A² − Δ Q = r⁴ + (a² − λ² − η) r² + 2Q r − a²η        (dr/dτ)² = R(r)
     G(u) = η − (η + λ² − a²) u² − a² u⁴                          (du/dτ)² = G(u)
     dφ/dτ = a A/Δ − a + λ/(1 − u²)                                (forward in time)
   Integrated in the second-order form r'' = R′(r)/2, u'' = G′(u)/2: polynomial right-hand sides, regular through
   every radial and polar turning point (no sign bookkeeping) and at the poles. φ is integrated alongside. The ray
   runs BACKWARD from the observer: r decreases first, and dφ/dτ changes sign. Far from a radial turning point
   (R(r) > r⁴/100) dr/dτ is projected back onto −√R or +√R after each step, so R stays conserved where the
   second-order form is ill-conditioned (pr² ≈ r⁴ ≫ R − r⁴).

   THE IMAGE PLANE (Bardeen 1973): α to the right, β up (β along the projection of the spin axis);
     λ = −α sin θo,  η = (α² − a²) cos²θo + β²,  and at the observer du/dτ (backward) = β sin θo.
   φ = 0 is the observer's azimuth (the near side of the disk); the prograde disk turns counter-clockwise in the image,
   its approaching side on the left (α < 0, λ > 0).

   THE START: the ray enters the integration at r₀ = 200 M at the Mino time I₀ = ∫_{r₀}^∞ dr/√R from infinity
   (Gauss–Legendre on the regular integrand in x = 1/r). In Mino time the polar motion is decoupled from r, so u and
   du/dτ at I₀ come from integrating u'' = G′(u)/2 alone from the observer (u = cos θo at τ = 0), together with the
   polar part of φ; the radial part of φ, ∫ a(2r − aλ)/(Δ √R) dr, is a second Gauss–Legendre quadrature. No ray in a
   field of ±20√2 M at 17° crosses the equator beyond 200 M on its way in (asserted per ray).

   THE INTEGRATOR: Dormand–Prince 5(4) with the standard step control, local tolerance `tol` (relative and absolute,
   per component, max norm). Each equatorial crossing (u = 0) is located by re-stepping the integrator itself from
   the last accepted point (Illinois secant on the step length). Only + − × ÷ and √ are used per ray (cos θo and
   sin θo come in as doubles), so the result is bit-reproducible on any IEEE-754 machine.

   Termination: CAPTURED when r < r₊ + 10⁻⁶ (r₊ = 1 + √(1 − a²)). ESCAPED when outgoing past r₀: the crossings left
   between r₀ and infinity are counted from the decoupled polar motion over the remaining Mino time (their radii,
   all beyond 200 M, are recorded as +∞). */
'use strict';

const R_START = 200, CAPTURE_EPS = 1e-6, MAX_STEPS = 400000;

/* Dormand–Prince 5(4) tableau */
const A21 = 1 / 5;
const A31 = 3 / 40, A32 = 9 / 40;
const A41 = 44 / 45, A42 = -56 / 15, A43 = 32 / 9;
const A51 = 19372 / 6561, A52 = -25360 / 2187, A53 = 64448 / 6561, A54 = -212 / 729;
const A61 = 9017 / 3168, A62 = -355 / 33, A63 = 46732 / 5247, A64 = 49 / 176, A65 = -5103 / 18656;
const B1 = 35 / 384, B3 = 500 / 1113, B4 = 125 / 192, B5 = -2187 / 6784, B6 = 11 / 84;
const E1 = 71 / 57600, E3 = -71 / 16695, E4 = 71 / 1920, E5 = -17253 / 339200, E6 = 22 / 525, E7 = -1 / 40;

/* the constants of one ray */
function rayConsts(a, cosO, sinO, alpha, beta) {
  const lam = -alpha * sinO;
  const eta = (alpha * alpha - a * a) * cosO * cosO + beta * beta;
  const Qc = eta + (lam - a) * (lam - a);
  return { a, a2: a * a, lam, eta, Qc, kU: eta + lam * lam - a * a, cosO, sinO, alpha, beta };
}

const Rpoly = (k, r) => { const A = r * r + k.a2 - k.a * k.lam; return A * A - (r * r - 2 * r + k.a2) * k.Qc; };
const Gpoly = (k, u) => k.eta - k.kU * u * u - k.a2 * u * u * u * u;

/* the full right-hand side, backward in time: y = [r, pr, u, pu, φ] */
function rhsFull(k, y, f) {
  const r = y[0], u = y[2];
  const A = r * r + k.a2 - k.a * k.lam;
  const Dl = r * r - 2 * r + k.a2;
  f[0] = y[1];
  f[1] = 2 * r * A - (r - 1) * k.Qc;                     /* R'(r)/2 = 2rA − (r − 1)Q */
  f[2] = y[3];
  f[3] = -k.kU * u - 2 * k.a2 * u * u * u;               /* G'(u)/2 */
  f[4] = -(k.a * A / Dl - k.a + k.lam / (1 - u * u));    /* −dφ/dτ: the ray runs backward */
}
/* the polar subsystem alone (it is decoupled in Mino time): y = [0, 0, u, pu, φ_θ] with dφ_θ/dτ = −λ/(1 − u²) */
function rhsPolar(k, y, f) {
  const u = y[2];
  f[0] = 0; f[1] = 0; f[2] = y[3];
  f[3] = -k.kU * u - 2 * k.a2 * u * u * u;
  f[4] = -k.lam / (1 - u * u);
}

/* one Dormand–Prince step of size h from y (with f0 = rhs(y)); writes y5 and returns the error norm */
function dpStep(rhs, k, y, f0, h, tol, ws, y5) {
  const { k2, k3, k4, k5, k6, k7, yt } = ws;
  for (let i = 0; i < 5; i++) yt[i] = y[i] + h * A21 * f0[i];
  rhs(k, yt, k2);
  for (let i = 0; i < 5; i++) yt[i] = y[i] + h * (A31 * f0[i] + A32 * k2[i]);
  rhs(k, yt, k3);
  for (let i = 0; i < 5; i++) yt[i] = y[i] + h * (A41 * f0[i] + A42 * k2[i] + A43 * k3[i]);
  rhs(k, yt, k4);
  for (let i = 0; i < 5; i++) yt[i] = y[i] + h * (A51 * f0[i] + A52 * k2[i] + A53 * k3[i] + A54 * k4[i]);
  rhs(k, yt, k5);
  for (let i = 0; i < 5; i++) yt[i] = y[i] + h * (A61 * f0[i] + A62 * k2[i] + A63 * k3[i] + A64 * k4[i] + A65 * k5[i]);
  rhs(k, yt, k6);
  for (let i = 0; i < 5; i++) y5[i] = y[i] + h * (B1 * f0[i] + B3 * k3[i] + B4 * k4[i] + B5 * k5[i] + B6 * k6[i]);
  rhs(k, y5, k7);
  let err = 0;
  for (let i = 0; i < 5; i++) {
    const e = h * (E1 * f0[i] + E3 * k3[i] + E4 * k4[i] + E5 * k5[i] + E6 * k6[i] + E7 * k7[i]);
    const sc = tol * (1 + Math.max(Math.abs(y[i]), Math.abs(y5[i])));
    const q = Math.abs(e) / sc;
    if (q > err) err = q;
  }
  return err;
}
const grow = err => Math.min(5, Math.max(0.2, 0.9 / Math.sqrt(Math.sqrt(Math.max(err, 1e-30)))));   /* err^(−1/4): √ only */
const shrink = err => (err === err ? Math.max(0.2, 0.9 / Math.sqrt(Math.sqrt(err))) : 0.25);
const workspace = () => ({ k2: new Float64Array(5), k3: new Float64Array(5), k4: new Float64Array(5), k5: new Float64Array(5),
  k6: new Float64Array(5), k7: new Float64Array(5), yt: new Float64Array(5) });

/* the polar subsystem from y over a Mino-time span T (exactly), counting the u = 0 crossings on the way */
function polarSpan(k, y0, T, tol, ws) {
  let y = Float64Array.from(y0), y5 = new Float64Array(5), f0 = new Float64Array(5);
  let t = 0, h = Math.min(T, 0.05), crossings = 0;
  rhsPolar(k, y, f0);
  for (let it = 0; it < 100000 && t < T; it++) {
    const last = t + h >= T;
    const hh = last ? T - t : h;
    const err = dpStep(rhsPolar, k, y, f0, hh, tol, ws, y5);
    if (!(err <= 1)) { h = hh * shrink(err); continue; }
    if ((y[2] > 0 && y5[2] <= 0) || (y[2] < 0 && y5[2] >= 0)) crossings++;
    t = last ? T : t + hh;
    const s = y; y = y5; y5 = s;
    rhsPolar(k, y, f0);
    h = hh * grow(err);
  }
  return { y, crossings };
}

/* Gauss–Legendre, 8 points on [-1, 1] */
const GL8 = [[0.1834346424956498, 0.3626837833783620], [0.5255324099163290, 0.3137066458778873],
  [0.7966664774136267, 0.2223810344533745], [0.9602898564975363, 0.1012285362903763]];
function gl8(f, lo, hi) {
  const c = (lo + hi) / 2, hw = (hi - lo) / 2;
  let s = 0;
  for (const [x, w] of GL8) s += w * (f(c - hw * x) + f(c + hw * x));
  return s * hw;
}
/* x⁴ R(1/x) = 1 + (a² − λ² − η)x² + 2Q x³ − a²η x⁴ */
const Px = (k, x) => 1 + (k.a2 - k.lam * k.lam - k.eta) * x * x + 2 * k.Qc * x * x * x - k.a2 * k.eta * x * x * x * x;
/* the Mino time from r0 to infinity, and the radial part of φ over it: ∫ a(2r − aλ)/(Δ √R) dr = ∫ a x (2 − aλx)/((1 − 2x + a²x²) √P) dx */
function farLeg(k, r0) {
  const x0 = 1 / r0;
  const I = gl8(x => 1 / Math.sqrt(Px(k, x)), 0, x0 / 2) + gl8(x => 1 / Math.sqrt(Px(k, x)), x0 / 2, x0);
  const fr = x => k.a * x * (2 - k.a * k.lam * x) / ((1 - 2 * x + k.a2 * x * x) * Math.sqrt(Px(k, x)));
  const Phi = gl8(fr, 0, x0 / 2) + gl8(fr, x0 / 2, x0);
  return { I, Phi };
}

const rPlus = a => 1 + Math.sqrt(1 - a * a);

/* the Keplerian prograde redshift factor at radius r for a photon of angular momentum λ (Bardeen–Press–Teukolsky) */
function gKepler(a, r, lam) {
  const sr = Math.sqrt(r), r32 = r * sr;
  const ut = (r32 + a) / (Math.sqrt(r32) * Math.sqrt(r32 - 3 * sr + 2 * a));
  return 1 / (ut * (1 - lam / (r32 + a)));
}

/* trace one ray. opts: { tol, maxCross (crossings recorded, default 3), stopAfter (stop once that many are seen) }
   returns { fate: 'captured' | 'escaped' | 'stopped' | 'stuck', crossings: [{ r, phi, tau, pr }], count, steps, rmin, k } */
function trace(a, cosO, sinO, alpha, beta, opts = {}) {
  const tol = opts.tol || 1e-12, maxCross = opts.maxCross === undefined ? 3 : opts.maxCross;
  const stopAfter = opts.stopAfter || Infinity;
  const k = rayConsts(a, cosO, sinO, alpha, beta);
  const rH = rPlus(a) + CAPTURE_EPS;
  const ws = workspace();
  const crossings = []; let count = 0;
  const done = (fate, steps, rmin) => ({ fate, crossings, count, steps, rmin, k });
  /* the far leg, infinity → r0 */
  const far = farLeg(k, R_START);
  const pol = polarSpan(k, [0, 0, cosO, beta * sinO, 0], far.I, tol, ws);
  if (pol.crossings) return done('far-crossing', 0, Infinity);       /* never in the field (asserted by the caller) */
  let y = new Float64Array(5), y5 = new Float64Array(5), f0 = new Float64Array(5), yc = new Float64Array(5);
  y[0] = R_START; y[1] = -Math.sqrt(Rpoly(k, R_START)); y[2] = pol.y[2]; y[3] = pol.y[3]; y[4] = pol.y[4] - far.Phi;
  let tau = far.I, h = 0.01 * far.I, steps = 0, rmin = Infinity;
  rhsFull(k, y, f0);
  for (;;) {
    if (++steps > MAX_STEPS) return done('stuck', steps, rmin);
    const err = dpStep(rhsFull, k, y, f0, h, tol, ws, y5);
    if (!(err <= 1)) { h *= shrink(err); continue; }
    /* accepted: a crossing inside the step? */
    if ((y[2] > 0 && y5[2] <= 0) || (y[2] < 0 && y5[2] >= 0)) {
      let s0 = 0, u0s = y[2], s1 = h, u1s = y5[2], side = 0, s = h;
      for (let it = 0; it < 60; it++) {                             /* Illinois on the step length */
        s = s1 - u1s * (s1 - s0) / (u1s - u0s);
        if (!(s > Math.min(s0, s1) && s < Math.max(s0, s1))) s = (s0 + s1) / 2;
        dpStep(rhsFull, k, y, f0, s, tol, ws, yc);
        const us = yc[2];
        if (us === 0 || Math.abs(s1 - s0) < 1e-15 * (tau + h)) break;
        if ((us > 0) === (u1s > 0)) { s1 = s; u1s = us; if (side === -1) u0s /= 2; side = -1; }
        else { s0 = s; u0s = us; if (side === 1) u1s /= 2; side = 1; }
      }
      count++;
      if (crossings.length < maxCross) {
        let phi = yc[4] % (2 * Math.PI); if (phi < 0) phi += 2 * Math.PI;
        crossings.push({ r: yc[0], phi, tau: tau + s, pr: yc[1] });
      }
      if (count >= stopAfter) return done('stopped', steps, rmin);
    }
    tau += h;
    const t = y; y = y5; y5 = t;
    /* projection onto R conserved, far from a radial turning point */
    const Rr = Rpoly(k, y[0]), r2 = y[0] * y[0];
    if (Rr > r2 * r2 / 100) y[1] = y[1] < 0 ? -Math.sqrt(Rr) : Math.sqrt(Rr);
    if (y[0] < rmin) rmin = y[0];
    rhsFull(k, y, f0);
    if (y[0] < rH) return done('captured', steps, rmin);
    if (y[1] > 0 && y[0] > R_START) {
      /* the crossings left between here and infinity, from the decoupled polar motion over the remaining Mino time */
      const rest = farLeg(k, y[0]);
      const tailPol = polarSpan(k, [0, 0, y[2], y[3], 0], rest.I, tol, ws);
      for (let i = 0; i < tailPol.crossings; i++) {
        count++;
        if (crossings.length < maxCross) crossings.push({ r: Infinity, phi: NaN, tau: NaN, pr: NaN });
      }
      return done('escaped', steps, rmin);
    }
    h *= grow(err);
  }
}

/* ---------- the closed form (Gralla & Lupsasca 2020), used only to CHECK the integration ---------- */

/* Carlson's R_F(x, y, z), duplication, double */
function carlsonRF(x, y, z) {
  for (let i = 0; i < 100; i++) {
    const sx = Math.sqrt(x), sy = Math.sqrt(y), sz = Math.sqrt(z);
    const l = sx * (sy + sz) + sy * sz;
    x = (x + l) / 4; y = (y + l) / 4; z = (z + l) / 4;
    const m = (x + y + z) / 3;
    const dx = (m - x) / m, dy = (m - y) / m, dz = (m - z) / m;
    if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) < 1e-4) {
      const e2 = dx * dy - dz * dz, e3 = dx * dy * dz;
      return (1 - e2 / 10 + e3 / 14 + e2 * e2 / 24 - 3 * e2 * e3 / 44) / Math.sqrt(m);
    }
  }
  return NaN;
}
/* the incomplete elliptic integral F(arcsin s | m) for s ∈ [0, 1], and K(m) */
const ellF = (s, m) => s * carlsonRF(1 - s * s, 1 - m * s * s, 1);
const ellK = m => carlsonRF(0, 1 - m, 1);

/* the Mino time from infinity of the n-th equatorial crossing (n = 0, 1, …), from the angular closed form.
   G(u) = a²(u₊² − u²)(u² − u₋²), u±² = Δθ ± √(Δθ² + η/a²), Δθ = (1 − (η + λ²)/a²)/2; with m = u₊²/u₋² < 0,
   ∫_0^u du/√G = F(arcsin(u/u₊) | m) / (a √(−u₋²)). At a = 0, G = η − (η + λ²)u² and the arcsine is elementary.
   Defined for η > 0 (rays that cross the equator). */
function angularCrossingTimes(k, nMax) {
  const c = k.cosO, sgn = k.beta * k.sinO;              /* backward du/dτ at the observer */
  let Fo, Kq;
  if (k.a === 0) {
    const w = Math.sqrt(k.eta + k.lam * k.lam), up = Math.sqrt(k.eta / (k.eta + k.lam * k.lam));
    Fo = Math.asin(Math.min(1, c / up)) / w; Kq = (Math.PI / 2) / w;
  } else {
    const dth = (1 - (k.eta + k.lam * k.lam) / k.a2) / 2, sq = Math.sqrt(dth * dth + k.eta / k.a2);
    const up2 = dth + sq, um2 = dth - sq, m = up2 / um2, sc = k.a * Math.sqrt(-um2);
    Fo = ellF(Math.min(1, c / Math.sqrt(up2)), m) / sc; Kq = ellK(m) / sc;
  }
  const t1 = sgn < 0 ? Fo : 2 * Kq - Fo;
  const out = [];
  for (let n = 0; n <= nMax; n++) out.push(t1 + 2 * n * Kq);
  return out;
}

/* adaptive Gauss–Kronrod (7, 15) on [lo, hi] to absolute tolerance eps */
const XK = [0.991455371120812639, 0.949107912342758525, 0.864864423359769073, 0.741531185599394440,
  0.586087235467691130, 0.405845151377397167, 0.207784955007898468, 0];
const WK = [0.022935322010529225, 0.063092092629978553, 0.104790010322250184, 0.140653259715525919,
  0.169004726639267903, 0.190350578064785410, 0.204432940075298892, 0.209482141084727828];
const WG = [0.129484966168869693, 0.279705391489276668, 0.381830050505118945, 0.417959183673469388];
function gk15(f, lo, hi) {
  const c = (lo + hi) / 2, hw = (hi - lo) / 2;
  let k = WK[7] * f(c), g = WG[3] * f(c);
  for (let i = 0; i < 7; i++) {
    const fx = f(c - hw * XK[i]) + f(c + hw * XK[i]);
    k += WK[i] * fx;
    if (i % 2 === 1) g += WG[(i - 1) / 2] * fx;
  }
  return [k * hw, Math.abs((k - g) * hw)];
}
/* globally adaptive: split the interval with the largest error estimate until the sum is below eps (at most 2000) */
function integrate(f, lo, hi, eps) {
  const parts = [[lo, hi, ...gk15(f, lo, hi)]];
  for (let it = 0; it < 2000; it++) {
    let tot = 0, w = 0;
    for (let i = 0; i < parts.length; i++) { tot += parts[i][3]; if (parts[i][3] > parts[w][3]) w = i; }
    if (tot <= eps) break;
    const [a, b] = parts[w], m = (a + b) / 2;
    parts.splice(w, 1, [a, m, ...gk15(f, a, m)], [m, b, ...gk15(f, m, b)]);
  }
  let v = 0; for (const p of parts) v += p[2];
  return v;
}

/* the largest real root of R above the horizon, Newton from a seed (the ray's smallest r), or null if none */
function turningPoint(k, seed) {
  let r = seed;
  for (let i = 0; i < 100; i++) {
    const A = r * r + k.a2 - k.a * k.lam, R = A * A - (r * r - 2 * r + k.a2) * k.Qc;
    const Rp = 4 * r * A - (2 * r - 2) * k.Qc;
    const d = R / Rp; r -= d;
    if (Math.abs(d) < 1e-15 * r) break;
  }
  return r;
}

/* the Mino time from infinity to r_s along the ray, by quadrature (independent of the integrator):
   ingoing: ∫_{r_s}^∞ dr/√R; after the turning point r_t: 2∫_{r_t}^∞ − ∫_{r_s}^∞ (the master equation's I_r).
   Near r_t the substitution r = r_t + s² removes the square-root singularity (R = (r − r_t) R̃(r)). */
function radialMino(k, rs, outgoing, rt) {
  const P = x => 1 + (k.a2 - k.lam * k.lam - k.eta) * x * x + 2 * k.Qc * x * x * x - k.a2 * k.eta * x * x * x * x;
  const tail = r0 => integrate(x => 1 / Math.sqrt(P(x)), 0, 1 / r0, 1e-14);       /* ∫_{r0}^∞ */
  if (rt === null) return tail(rs);
  /* R̃(r) = R(r)/(r − r_t) by synthetic division of R = r⁴ + c2 r² + c1 r + c0 */
  const c2 = k.a2 - k.lam * k.lam - k.eta, c1 = 2 * k.Qc;
  const b3 = 1, b2 = rt, b1 = c2 + rt * b2, b0 = c1 + rt * b1;
  const Rt = r => ((b3 * r + b2) * r + b1) * r + b0;
  const near = (r1) => integrate(s => 2 / Math.sqrt(Rt(rt + s * s)), 0, Math.sqrt(r1 - rt), 1e-14);   /* ∫_{r_t}^{r1} */
  const full = near(2 * rt) + tail(2 * rt);                                                         /* ∫_{r_t}^∞ */
  const toRs = rs <= 2 * rt ? full - near(rs) : tail(rs);                                            /* ∫_{r_s}^∞ */
  return outgoing ? 2 * full - toRs : toRs;
}

/* the Lyapunov exponent of the photon orbit at radius rt (Gralla & Lupsasca 2020, float): printed, never judged */
function lyapunov(a, rt) {
  if (a === 0) return Math.PI;
  const D = rt * rt - 2 * rt + a * a;
  const lam = a + rt / a * (rt - 2 * D / (rt - 1));
  const eta = rt * rt * rt / (a * a) * (4 * D / ((rt - 1) * (rt - 1)) - rt);
  const dth = (1 - (eta + lam * lam) / (a * a)) / 2, sq = Math.sqrt(dth * dth + eta / (a * a));
  const up = dth + sq, um = dth - sq;
  const chi = 1 - D / (rt * (rt - 1) * (rt - 1));
  return 4 * rt * Math.sqrt(chi) / Math.sqrt(-um * a * a) * ellK(up / um);
}

/* ---------- IEEE half floats ---------- */

/* 2^e, exact (repeated doubling or halving) */
function P2(e) { let x = 1; if (e >= 0) for (let i = 0; i < e; i++) x *= 2; else for (let i = 0; i < -e; i++) x /= 2; return x; }
function toHalf(x) {
  if (x !== x) return 0x7e00;
  const sgn = x < 0 || (x === 0 && 1 / x < 0) ? 0x8000 : 0;
  const v = Math.abs(x);
  if (v === 0) return sgn;
  if (v >= 65520) return sgn | 0x7c00;
  let e = 0;
  while (P2(e) > v) e--;
  while (P2(e + 1) <= v) e++;
  const rnd = q => { const f = Math.floor(q), d = q - f; return d > 0.5 || (d === 0.5 && f % 2 === 1) ? f + 1 : f; };
  if (e < -14) return sgn | rnd(v / P2(-24));                   /* subnormal (1024 rounds up into the first normal) */
  let m = rnd(v / P2(e - 10));
  if (m === 2048) { m = 1024; e++; }
  if (e > 15) return sgn | 0x7c00;
  return sgn | ((e + 15) << 10) | (m - 1024);
}
function fromHalf(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * P2(-24);
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1024 + m) * P2(e - 25);
}

module.exports = {
  R_START, CAPTURE_EPS, rayConsts, farLeg, Px, Rpoly, Gpoly, trace, rPlus, gKepler,
  carlsonRF, ellF, ellK, angularCrossingTimes, radialMino, turningPoint, lyapunov, toHalf, fromHalf
};
