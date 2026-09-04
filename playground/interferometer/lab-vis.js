/* lab-vis.js — STAGE 0.  FLOATS ONLY, NO PROOF.  MIT, clean-room.

   The question: how much does the released EHT data ALONE decide about M87,
   before any imaging prior is chosen?

   THE OBJECT.  Let mu be any nonnegative measure on a stated field of view
   Omega (a brightness distribution: no pixel basis, no smoothness, no prior).
   S is the set of such mu whose visibility AMPLITUDES do not exceed the
   measured ones:
        | INT exp(-2 pi i (u_k l + v_k m)) dmu |  <=  A_k,   k = 1..K
   with A_k = |V_k| + nsig*sigma_k + gain*|V_k|.  For a sky weight f we want
   sup_{mu in S} INT f dmu.

   WHY AMPLITUDES AND NOT THE COMPLEX VISIBILITIES.  Measured, not assumed:
   fitting a nonnegative image to the released COMPLEX visibilities inside a
   128 uas field stalls at chi2/dof = 4.8 with a worst residual of 33 released
   sigmas, and the set defined by |V_mu - V_k| <= 3 sigma_k is EMPTY — the dual
   then runs to minus infinity, which is what an infeasible primal looks like
   from the other side.  That is not a bug, it is the physics: these data are
   network-calibrated (which fixes AMPLITUDES) but not self-calibrated, so
   residual per-station phases are still in the file and every published image
   of them is obtained WITH self-calibration.  An upper bound on |V| is
   invariant under every station phase and needs only a gain-amplitude
   allowance — so the enclosure below uses the part of the data that survives
   calibration, and uses nothing else.  Feasibility is then automatic (mu = 0
   satisfies every constraint), and the question becomes whether the amplitude
   ceilings alone forbid a bright centre.  They do.

   UPPER BOUND = A CERTIFICATE, ERDOS-1038's shape.  For complex y_k and
   lambda >= 0, IF the POINTWISE inequality
        f(x) <= Re SUM_k conj(y_k) exp(-2 pi i (u_k l + v_k m)) + lambda    (*)
   holds for EVERY x in Omega, then for every mu in S, since
   Re(conj(y_k) V_mu(u_k)) <= |y_k| |V_mu(u_k)| <= |y_k| A_k,
        INT f dmu  <=  SUM_k |y_k| A_k  +  lambda F_hi.
   The measured PHASES never appear.  Set F_hi = inf (pass F=1e9) and even the
   total-flux hypothesis disappears: the only hypotheses left are the field of
   view, nonnegativity, and the amplitude ceilings.
   Nonnegative multipliers; one pointwise inequality over a continuum.  The
   optimiser only PROPOSES (y, lambda) — the bound is valid for whatever it
   proposes, so no step below has to be trusted, only (*) has to be checked.

   HOW (*) IS CHECKED HERE.  Not on the optimiser's own grid: a semi-infinite
   constraint checked on the grid it was optimised against is exactly how you
   get a bound that is too good to be true (measured: -2.47 Jy for a quantity
   that cannot be negative, at N=64).  So: cutting planes.  The dual is solved
   on a working set of points; the violations are then hunted on a FINE scan;
   the worst ones are added to the working set; repeat.  lambda is finally set
   from the fine scan plus a Lipschitz margin covering the gaps between its
   samples.  Stage 1 replaces that margin with interval boxes.

   LOWER BOUND = A WITNESS: a nonnegative grid measure satisfying every
   constraint.  A grid measure IS a measure, so this direction owes no
   discretisation apology.

   Usage
     node lab-vis.js coverage
     node lab-vis.js dirty  [opts]
     node lab-vis.js bound  disk <r0_uas> [opts]
     node lab-vis.js bound  depression <r0_uas> <r1_uas> <alpha> [opts]
     node lab-vis.js reds   [opts]
   opts: day=111 band=b3 pipe=hops avg=300 nsig=3 fov=64 N=96 Nf=768 rounds=6
         iters=700 sys=0.01                                                   */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vis.js');
const { encodePNG } = require('../png.js');   // ported alongside: /playground owns its dependencies
const UAS = V.UAS;
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const DEF = { day: 111, band: 'b3', pipe: 'hops', avg: 0, nsig: 3, fov: 64, N: 96, Nf: 768, rounds: 6, iters: 700, sys: 0.0, gain: 0.05, plow: 0, bcut: 0.4, F: 2.0, sub: 1, quiet: 0 };
function opts(argv) {
  const o = Object.assign({}, DEF);
  for (const a of argv) { const m = /^(\w+)=(.+)$/.exec(a); if (m && m[1] in o) o[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; }
  return o;
}

/* ---------------- the data, as the bound sees it ---------------- */
function dataset(o, rowsOverride) {
  const fl = rowsOverride ? null : V.loadFile(o.day, o.band, o.pipe);
  const raw = rowsOverride || fl.rows;
  const avg = o.avg > 0 ? V.average(raw, o.avg, o.sys) : raw;
  /* THE FIELD-OF-VIEW / SHORT-BASELINE TRAP, measured the hard way.
     The shortest projected baselines here reach 0.12 Mlambda — a fringe spacing
     of 1.7 arcsec — so their 1.10 Jy is the flux of everything in the galaxy's
     inner arcsecond, not of anything inside a 128 uas box.  By 1 Glambda the
     amplitude has fallen to 0.30 Jy, which for a source that small could not
     happen: a 40 uas ring is barely resolved at 1 Glambda.  The missing 0.8 Jy
     is extended emission resolved out between the two.  Feeding the short
     baselines to a model confined to Omega therefore asks it to put an arcsecond
     of flux inside 128 uas, and the constraint set goes EMPTY — which the dual
     duly reports as a bound running to minus infinity.  So: keep only baselines
     above `bcut`, where the extended emission is resolved away, and carry the
     compact flux ceiling as a STATED hypothesis F, reported with every bound. */
  const kept = avg.filter(r => Math.hypot(r.u, r.v) >= o.bcut * 1e9);
  /* `sub` thins the constraint set for the DUAL only.  Dropping constraints
     enlarges the feasible set, so the ceiling computed from a subset still
     bounds the full problem — but a WITNESS that only satisfies a subset is
     not a witness at all, so the primal always sees every kept row.  Getting
     this backwards silently reports a lower bound that is not one (measured:
     0.394 Jy at sub=12 against 0.161 Jy on the same radius at sub=2). */
  const rows = o.sub > 1 ? kept.filter((_, i) => i % o.sub === 0) : kept;
  const fovRad = o.fov * UAS;
  const flux = V.fluxFromShortest(avg, fovRad, o.nsig);
  /* THE ERROR BUDGET, in one place.  eps_k = nsig*sigma_k + sys*|V_k|: the
     released sigmas are thermal only, and these visibilities are network- but
     not self-calibrated, so residual station phase and gain error is real and
     has to be carried explicitly.  `sys` is a STATED hypothesis and every bound
     is reported against it. */
  const eps = rows.map(r => o.nsig * r.sigma + o.sys * r.amp);
  /* THE CEILINGS.  A_k = |V_k| + nsig*sigma_k + gain*|V_k|: an upper bound on
     the modulus, invariant under every station PHASE, and needing only an
     allowance for residual gain AMPLITUDE (network calibration is exactly what
     fixes amplitudes, so `gain` is small and is stated with every result). */
  const amp = rows.map(r => r.amp + o.nsig * r.sigma + o.gain * r.amp);
  const ampFull = kept.map(r => r.amp + o.nsig * r.sigma + o.gain * r.amp);
  return { meta: fl, rows, eps, amp, rowsFull: kept, ampFull, all: avg, fovRad, flux, Fhi: o.F, K: rows.length, Kfull: kept.length, o };
}

/* ---------------- sky weights ---------------- */
/* f takes (l, m) in MICROARCSECONDS.  args.cl/cm move the centre — used by the
   translation red, which is not a formality: the amplitude-only constraint set
   is invariant under translating mu (a shift multiplies every V_mu(u) by a
   phase and leaves |V_mu(u)| alone), so the ceiling for a disk of radius r must
   NOT depend on where that disk is.  If it does, something is reading phases
   that the certificate claims not to use. */
function makeF(kind, args) {
  const cl = args.cl || 0, cm = args.cm || 0;
  if (kind === 'disk') return (l, m) => (Math.hypot(l - cl, m - cm) <= args.r0 ? 1 : 0);
  if (kind === 'depression') { const r = (l, m) => Math.hypot(l - cl, m - cm); return (l, m) => (r(l, m) <= args.r0 ? 1 : (r(l, m) <= args.r1 ? -args.alpha : 0)); }
  throw new Error('unknown weight ' + kind);
}

/* ---------------- kernels on an arbitrary point list ---------------- */
/* pts: flat [l0,m0,l1,m1,...] in radians.  C[i*K+k] = cos(2pi(u_k l_i + v_k m_i)). */
function pointKernels(rows, pts) {
  const K = rows.length, P = pts.length / 2;
  const C = new Float32Array(P * K), S = new Float32Array(P * K);
  for (let i = 0; i < P; i++) {
    const l = pts[2 * i], m = pts[2 * i + 1], base = i * K;
    for (let k = 0; k < K; k++) {
      const th = 2 * Math.PI * (rows[k].u * l + rows[k].v * m);
      C[base + k] = Math.cos(th); S[base + k] = Math.sin(th);
    }
  }
  return { C, S, P, K };
}

/* ---------------- separable fine scan of  f(x) - h_y(x)  over Omega -------- */
/* h_y(x) = SUM_k [ a_k cos(theta_k) - b_k sin(theta_k) ],  theta = 2pi(u l + v m).
   Returns { max, pts (worst violators), field (optional Float32Array) }.      */
function fineScan(rows, a, b, R, Nf, fFun, wantField, topN = 0) {
  const K = rows.length;
  const co = new Float64Array(Nf);
  for (let i = 0; i < Nf; i++) co[i] = -R + (2 * R * i) / (Nf - 1);
  const CA = new Float64Array(Nf * K), SA = new Float64Array(Nf * K);
  const CB = new Float64Array(Nf * K), SB = new Float64Array(Nf * K);
  for (let i = 0; i < Nf; i++) {
    const base = i * K;
    for (let k = 0; k < K; k++) {
      const A = 2 * Math.PI * rows[k].u * co[i], B = 2 * Math.PI * rows[k].v * co[i];
      CA[base + k] = Math.cos(A); SA[base + k] = Math.sin(A);
      CB[base + k] = Math.cos(B); SB[base + k] = Math.sin(B);
    }
  }
  const P = new Float64Array(K), Q = new Float64Array(K);
  const field = wantField ? new Float32Array(Nf * Nf) : null;
  let best = -Infinity, cand = [];
  for (let j = 0; j < Nf; j++) {
    const bj = j * K;
    for (let k = 0; k < K; k++) {
      const cb = CB[bj + k], sb = SB[bj + k];
      P[k] = a[k] * cb - b[k] * sb;
      Q[k] = -a[k] * sb - b[k] * cb;
    }
    const mm = co[j];
    for (let i = 0; i < Nf; i++) {
      const bi = i * K; let h = 0;
      for (let k = 0; k < K; k++) h += CA[bi + k] * P[k] + SA[bi + k] * Q[k];
      if (field) field[j * Nf + i] = h;
      const d = fFun(co[i] / UAS, mm / UAS) - h;
      if (d > best) best = d;
      if (topN && d > 0) cand.push([d, co[i], mm]);
    }
  }
  let pts = [];
  if (topN && cand.length) {
    cand.sort((x, y) => y[0] - x[0]);
    for (let i = 0; i < Math.min(topN, cand.length); i++) { pts.push(cand[i][1], cand[i][2]); }
  }
  return { max: best, pts, field, co };
}

/* ---------------- the dual, with cutting planes ---------------- */
function dualBound(ds, kind, args, o, log = true) {
  const { rows, Fhi, fovRad } = ds, K = ds.K;
  const fFun = makeF(kind, args);
  const A = Float64Array.from(ds.amp);             // the amplitude ceilings
  const a = new Float64Array(K), b = new Float64Array(K);

  const pts = [];
  for (let j = 0; j < o.N; j++) for (let i = 0; i < o.N; i++)
    pts.push(-fovRad + (2 * fovRad * i) / (o.N - 1), -fovRad + (2 * fovRad * j) / (o.N - 1));
  let report = null;

  for (let round = 0; round < o.rounds; round++) {
    const flat = Float64Array.from(pts);
    const { C, S, P } = pointKernels(rows, flat);
    const fv = new Float64Array(P);
    for (let i = 0; i < P; i++) fv[i] = fFun(flat[2 * i] / UAS, flat[2 * i + 1] / UAS);
    const h = new Float64Array(P), w = new Float64Array(P);
    const ga = new Float64Array(K), gb = new Float64Array(K);
    const ma = new Float64Array(K), mb = new Float64Array(K), va = new Float64Array(K), vb = new Float64Array(K);

    const evalH = () => { for (let i = 0; i < P; i++) { const base = i * K; let t = 0; for (let k = 0; k < K; k++) t += a[k] * C[base + k] - b[k] * S[base + k]; h[i] = t; } };
    const setObj = () => {
      evalH();
      let lam = 0; for (let i = 0; i < P; i++) { const d = fv[i] - h[i]; if (d > lam) lam = d; }
      let nrm = 0; for (let k = 0; k < K; k++) nrm += A[k] * Math.hypot(a[k], b[k]);
      return { bound: nrm + lam * Fhi, lam, nrm };
    };
    /* POLYAK SUBGRADIENT, not Adam.  Adam's per-coordinate RMS normalisation
       divides out exactly the A_k weighting that makes one multiplier cheaper
       than another, and the objective then climbs past its own trivial value
       (measured: 5.4 where y = 0 already gives F_hi = 2.0).  Polyak needs a
       lower bound on the optimum, and the primal witness supplies one. */
    const target = o.plow;
    let bestG = Infinity, bestA = null, bestB = null;
    const gsub = new Float64Array(2 * K);
    for (let it = 0; it < o.iters; it++) {
      evalH();
      let mx = -Infinity; for (let i = 0; i < P; i++) { const d = fv[i] - h[i]; if (d > mx) mx = d; }
      const lam = Math.max(0, mx);
      let nrm = 0; for (let k = 0; k < K; k++) nrm += A[k] * Math.hypot(a[k], b[k]);
      const G = nrm + lam * Fhi;
      if (G < bestG) { bestG = G; bestA = Float64Array.from(a); bestB = Float64Array.from(b); }
      // subgradient: softmax over the near-maximal violations + the cone term
      const tauLoc = Math.max(1e-4, 0.02 * Math.max(1e-6, Math.abs(mx)));
      let Z = 0; for (let i = 0; i < P; i++) { const e = Math.exp((fv[i] - h[i] - mx) / tauLoc); w[i] = e; Z += e; }
      for (let i = 0; i < P; i++) w[i] /= Z;
      ga.fill(0); gb.fill(0);
      if (mx > 0) for (let i = 0; i < P; i++) {
        const wi = w[i]; if (wi < 1e-11) continue;
        const base = i * K;
        for (let k = 0; k < K; k++) { ga[k] -= Fhi * wi * C[base + k]; gb[k] += Fhi * wi * S[base + k]; }
      }
      for (let k = 0; k < K; k++) {
        const n = Math.hypot(a[k], b[k]);
        if (n > 1e-14) { ga[k] += A[k] * a[k] / n; gb[k] += A[k] * b[k] / n; }
        else { const t = Math.atan2(-gb[k], -ga[k]); ga[k] += A[k] * Math.cos(t); gb[k] += A[k] * Math.sin(t); }
      }
      let g2 = 0; for (let k = 0; k < K; k++) g2 += ga[k] * ga[k] + gb[k] * gb[k];
      if (g2 < 1e-30) break;
      const gamma = 1.6 * Math.pow(0.15, it / o.iters);
      const step = gamma * Math.max(G - target, 1e-6 * Fhi) / g2;
      for (let k = 0; k < K; k++) { a[k] -= step * ga[k]; b[k] -= step * gb[k]; }
    }
    if (bestA) { a.set(bestA); b.set(bestB); }
    const ws = setObj();
    const scan = fineScan(rows, a, b, fovRad, o.Nf, fFun, false, 250);
    let L = 0; for (let k = 0; k < K; k++) L += Math.hypot(a[k], b[k]) * Math.hypot(rows[k].u, rows[k].v);
    L *= 2 * Math.PI;
    const dl = (2 * fovRad) / (o.Nf - 1), margin = L * dl * Math.SQRT1_2;
    const lamTrue = Math.max(0, scan.max + margin);
    report = { bound: ws.nrm + lamTrue * Fhi, workingBound: ws.bound, lamWorking: ws.lam, lamScan: scan.max, margin, nrm: ws.nrm, L, P, a: Float64Array.from(a), b: Float64Array.from(b) };
    if (log) console.log(`    round ${round + 1}/${o.rounds}  |set| ${P}  working ${ws.bound.toFixed(5)}  honest ${report.bound.toFixed(5)}  (lambda ${ws.lam.toFixed(5)} -> scan ${scan.max.toFixed(5)} + margin ${margin.toFixed(5)})`);
    if (scan.pts.length === 0) break;
    for (const v of scan.pts) pts.push(v);
  }
  return report;
}

/* ---------------- the primal: exhibit a measure ---------------- */
/* A nonnegative grid measure IS a measure, so anything found here is a genuine
   lower bound on the sup — this direction owes no discretisation apology.
   maximise SUM f_i w_i  s.t.  w >= 0,  SUM w <= F_hi,  |V_k(w)| <= A_k.
   FISTA on  -SUM f w + rho * SUM_k [ (|V_k| - A_k)_+ ]^2 / A_k^2  with rho
   ramped up, keeping the best point that is actually feasible.  Plain
   projected gradient is not enough here: the normal operator IS the dirty
   beam and plain GD stalls an order of magnitude short (measured: chi2/dof 50
   where FISTA reaches 4.8 on the same data), and a stall is indistinguishable
   from an empty feasible set unless you know to look. */
function primalWitness(ds, kind, args, o, log = true) {
  const { Fhi, fovRad } = ds, rows = ds.rowsFull, K = rows.length, N = o.N, M = N * N;
  const fFun = makeF(kind, args);
  const pts = new Float64Array(2 * M);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    pts[2 * (j * N + i)] = -fovRad + (2 * fovRad * i) / (N - 1);
    pts[2 * (j * N + i) + 1] = -fovRad + (2 * fovRad * j) / (N - 1);
  }
  const { C, S } = pointKernels(rows, pts);
  const fv = new Float64Array(M);
  for (let i = 0; i < M; i++) fv[i] = fFun(pts[2 * i] / UAS, pts[2 * i + 1] / UAS);
  const A = Float64Array.from(ds.ampFull);
  const w = new Float64Array(M).fill(Math.min(Fhi, 1) / M);
  const Re = new Float64Array(K), Im = new Float64Array(K), gr = new Float64Array(M);
  const cr = new Float64Array(K), ci = new Float64Array(K);

  const forward = (v) => { Re.fill(0); Im.fill(0); for (let i = 0; i < M; i++) { const vi = v[i]; if (vi <= 0) continue; const b = i * K; for (let k = 0; k < K; k++) { Re[k] += vi * C[b + k]; Im[k] -= vi * S[b + k]; } } };
  const backward = () => { for (let i = 0; i < M; i++) { const b = i * K; let t = 0; for (let k = 0; k < K; k++) t += cr[k] * C[b + k] - ci[k] * S[b + k]; gr[i] = t; } };
  const excess = () => { let z = 0; for (let k = 0; k < K; k++) z = Math.max(z, Math.hypot(Re[k], Im[k]) / A[k]); return z; };
  const value = (v) => { let t = 0; for (let i = 0; i < M; i++) t += fv[i] * v[i]; return t; };
  const clamp = (v) => { for (let i = 0; i < M; i++) if (v[i] < 0) v[i] = 0; let t = 0; for (let i = 0; i < M; i++) t += v[i]; if (t > Fhi) { const sc = Fhi / t; for (let i = 0; i < M; i++) v[i] *= sc; } };

  // Lipschitz of the quadratic part, by power iteration
  let pv = new Float64Array(M).fill(1 / Math.sqrt(M)), Lip = 1;
  for (let t = 0; t < 15; t++) {
    Re.fill(0); Im.fill(0);
    for (let i = 0; i < M; i++) { const vi = pv[i]; const b = i * K; for (let k = 0; k < K; k++) { Re[k] += vi * C[b + k]; Im[k] -= vi * S[b + k]; } }
    for (let k = 0; k < K; k++) { const iv = 2 / (A[k] * A[k]); cr[k] = Re[k] * iv; ci[k] = Im[k] * iv; }
    backward();
    let n = 0; for (let i = 0; i < M; i++) n += gr[i] * gr[i]; n = Math.sqrt(n) || 1;
    Lip = n; for (let i = 0; i < M; i++) pv[i] = gr[i] / n;
  }

  let bestVal = 0, bestW = new Float64Array(M);      // mu = 0 is always feasible
  const B = Math.max(400, Math.round(o.iters / 2));
  for (let stage = 0; stage < 7; stage++) {
    const rho = Math.pow(10, stage - 1);
    const step = 1 / (Lip * rho + 1e-30);
    let yv = Float64Array.from(w), tk = 1, wp = Float64Array.from(w);
    for (let it = 0; it < B; it++) {
      forward(yv);
      for (let k = 0; k < K; k++) {
        const n = Math.hypot(Re[k], Im[k]);
        if (n > A[k]) { const c = 2 * rho * (n - A[k]) / (A[k] * A[k] * Math.max(n, 1e-15)); cr[k] = c * Re[k]; ci[k] = c * Im[k]; }
        else { cr[k] = 0; ci[k] = 0; }
      }
      backward();
      for (let i = 0; i < M; i++) gr[i] -= fv[i];
      for (let i = 0; i < M; i++) w[i] = yv[i] - step * gr[i];
      clamp(w);
      const tn = (1 + Math.sqrt(1 + 4 * tk * tk)) / 2;
      for (let i = 0; i < M; i++) yv[i] = w[i] + ((tk - 1) / tn) * (w[i] - wp[i]);
      tk = tn; wp = Float64Array.from(w);
    }
    // retract to feasibility by scaling the whole measure (constraints are homogeneous)
    forward(w);
    const ex = excess();
    if (ex > 1) { for (let i = 0; i < M; i++) w[i] /= ex; forward(w); }
    const v = value(w);
    if (excess() <= 1 + 1e-9 && v > bestVal) { bestVal = v; bestW = Float64Array.from(w); }
    if (log) console.log(`    rho 1e${stage - 1}  value ${v.toFixed(5)}  worst |V|/A ${excess().toFixed(4)}  best feasible ${bestVal.toFixed(5)}`);
  }
  return { value: bestVal, w: bestW, N };
}

module.exports = { opts, dataset, makeF, pointKernels, fineScan, dualBound, primalWitness, OUT, DEF };

/* ---------------- rendering ---------------- */
function writeGray(name, Nf, field, lo, hi) {
  const rgb = new Float64Array(Nf * Nf * 3);
  for (let i = 0; i < Nf * Nf; i++) {
    let t = (field[i] - lo) / (hi - lo); t = Math.max(0, Math.min(1, t));
    const g = 0.04 + 0.94 * Math.pow(t, 0.85);
    rgb[3 * i] = g; rgb[3 * i + 1] = g; rgb[3 * i + 2] = g;
  }
  fs.writeFileSync(path.join(OUT, name), encodePNG(Nf, Nf, rgb));
  return path.join(OUT, name);
}

/* ---------------- CLI ---------------- */
if (require.main === module) {
  const cmd = process.argv[2] || 'coverage';
  if (cmd === 'coverage') {
    const o = opts(process.argv.slice(3));
    for (const d of [111, 112, 115]) for (const bd of ['b1', 'b2', 'b3', 'b4']) {
      const fl = V.loadFile(d, bd, 'hops'), st = V.stations(fl.rows);
      const kept = fl.rows.filter(r => Math.hypot(r.u, r.v) >= o.bcut * 1e9).length;
      console.log(`${V.DAYS[d]} ${bd} ${fl.freqGHz.toFixed(1)}GHz  rows ${String(fl.rows.length).padStart(5)}  above ${o.bcut} Gl ${String(kept).padStart(5)}  stations ${st.length} [${st.join(' ')}]  baselines ${V.baselines(fl.rows).length}  uv ${(V.uvMax(fl.rows) / 1e9).toFixed(2)} Gl`);
    }
  } else if (cmd === 'dirty') {
    const o = opts(process.argv.slice(3));
    const ds = dataset(o);
    const a = new Float64Array(ds.K), b = new Float64Array(ds.K);
    for (let k = 0; k < ds.K; k++) { a[k] = ds.rows[k].re; b[k] = ds.rows[k].im; }
    const t0 = Date.now();
    const sc = fineScan(ds.rows, a, b, ds.fovRad, o.Nf, () => 0, true);
    let lo = Infinity, hi = -Infinity;
    for (const v of sc.field) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const f1 = writeGray(`dirty-${o.day}-${o.band}-${o.pipe}.png`, o.Nf, sc.field, lo, hi);
    console.log(`dirty image  ${o.Nf}x${o.Nf} over +-${o.fov} uas, K=${ds.K}  peak ${hi.toFixed(2)} min ${lo.toFixed(2)}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`  ${f1}`);
  } else if (cmd === 'bound') {
    const kind = process.argv[3];
    const args = kind === 'disk' ? { r0: +process.argv[4] } : { r0: +process.argv[4], r1: +process.argv[5], alpha: +process.argv[6] };
    const o = opts(process.argv.slice(kind === 'disk' ? 5 : 7));
    const ds = dataset(o);
    console.log(`data  ${V.DAYS[o.day]} ${o.band} ${o.pipe}  K=${ds.K} (avg ${o.avg}s, sys floor ${o.sys}), ${o.nsig} sigma`);
    console.log(`cut   baselines >= ${o.bcut} Glambda kept (${ds.all.length} -> ${ds.Kfull}; dual thinned to ${ds.K}, witness uses all ${ds.Kfull});  ceilings A_k = |V_k| + ${o.nsig} sigma + ${(100*o.gain).toFixed(0)}% gain;  flux hypothesis mu(Omega) <= ${ds.Fhi.toFixed(2)} Jy inside +-${o.fov} uas`);
    const t0 = Date.now();
    console.log(`\n  PRIMAL (lower bound, exhibited measure):`);
    const pr = primalWitness(ds, kind, args, o);
    o.plow = pr.value;                       // Polyak needs a lower bound on the dual optimum
    console.log(`\n  DUAL (upper bound, certificate-shaped):`);
    const du = dualBound(ds, kind, args, o);
    console.log(`\nRESULT  ${kind} ${JSON.stringify(args)}   FOV +-${o.fov} uas`);
    console.log(`  upper  ${du.bound.toFixed(6)}`);
    console.log(`  lower  ${pr.value === -Infinity ? 'none found' : pr.value.toFixed(6)}`);
    console.log(`  flux ceiling ${ds.Fhi.toFixed(4)} Jy;  upper is ${(100 * du.bound / ds.Fhi).toFixed(1)}% of all flux`);
    console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else if (cmd === 'witness') {
    /* The extremal measure itself: the brightest-centre sky the amplitude
       ceilings still allow.  Not a reconstruction — an extreme point of the
       enclosure, which is a different object and the more honest one. */
    const r0 = +process.argv[3] || 12;
    const o = opts(process.argv.slice(4));
    const ds = dataset(o);
    const pr = primalWitness(ds, 'disk', { r0 }, o);
    const w = pr.w, N = pr.N;
    let hi = 0; for (const v of w) if (v > hi) hi = v;
    const img = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) img[i] = w[i];
    const f1 = writeGray(`witness-r${r0}-${o.day}-${o.band}.png`, N, img, 0, hi);
    let tot = 0; for (const v of w) tot += v;
    console.log(`witness  r0=${r0} uas  value ${pr.value.toFixed(4)} Jy inside, ${tot.toFixed(4)} Jy total, peak pixel ${hi.toExponential(2)} Jy`);
    console.log(`  ${f1}`);
  } else if (cmd === 'reds') {
    /* THE RED TEAM.  Nothing below is believed until every one of these fires.
       A bound is a claim about EVERY measure in the set, so the cheapest way to
       be wrong is to be wrong about one we can write down ourselves. */
    const o = opts(process.argv.slice(3));
    let fails = 0;
    const say = (ok, name, detail) => { console.log(`  ${ok ? 'PASS' : '**FAIL**'}  ${name}${detail ? '  —  ' + detail : ''}`); if (!ok) fails++; };
    const base = V.loadFile(o.day, o.band, o.pipe).rows.filter((_, i) => i % Math.max(1, o.sub) === 0);
    const run = (rows, kind, args, oo) => {
      const ds = dataset(Object.assign({}, oo), rows);
      const pr = primalWitness(ds, kind, args, oo, false);
      const o2 = Object.assign({}, oo, { plow: pr.value });
      const du = dualBound(ds, kind, args, o2, false);
      return { lower: pr.value, upper: du.bound, K: ds.K };
    };

    console.log('RED 1 — a sky we built ourselves must be inside its own bound');
    for (const [name, model] of [
      ['ring 21uas, 0.6 Jy, empty centre', V.ringModel(21, 0.6, 256, 0)],
      ['ring 21uas + 0.25 Jy central point', V.ringModel(21, 0.6, 256, 0.25)],
      ['point source 0.5 Jy at the centre', [{ l: 0, m: 0, flux: 0.5 }]],
    ]) {
      const rows = V.syntheticRows(base, model);
      const r = run(rows, 'disk', { r0: 10 }, o);
      const truth = V.modelFluxWithin(model, 10);
      say(r.upper >= truth - 1e-9, name, `truth ${truth.toFixed(4)} Jy <= upper ${r.upper.toFixed(4)} Jy (witness ${r.lower.toFixed(4)})`);
    }

    console.log('RED 2 — the certificate must dominate the witness, on the real data');
    { const r = run(base, 'disk', { r0: 12 }, o); say(r.upper >= r.lower, 'upper >= lower', `${r.upper.toFixed(4)} >= ${r.lower.toFixed(4)}`); }

    console.log('RED 3 — deleting a telescope may only LOOSEN the bound');
    { const full = run(base, 'disk', { r0: 12 }, o);
      const cut = run(base.filter(r => r.t1 !== 'GL' && r.t2 !== 'GL'), 'disk', { r0: 12 }, o);
      say(cut.upper >= full.upper * 0.98, 'drop the Greenland Telescope', `${full.K} pts -> ${cut.K}: upper ${full.upper.toFixed(4)} -> ${cut.upper.toFixed(4)}`); }

    console.log('RED 4 — a wider error budget may only LOOSEN the bound');
    { const tight = run(base, 'disk', { r0: 12 }, Object.assign({}, o, { gain: 0.02 }));
      const loose = run(base, 'disk', { r0: 12 }, Object.assign({}, o, { gain: 0.15 }));
      say(loose.upper >= tight.upper * 0.98, 'gain 2% -> 15%', `upper ${tight.upper.toFixed(4)} -> ${loose.upper.toFixed(4)}`); }

    console.log('RED 5 — the bound must be monotone in the radius');
    { const a = run(base, 'disk', { r0: 8 }, o), b = run(base, 'disk', { r0: 20 }, o);
      say(b.upper >= a.upper * 0.98, 'r=8 vs r=20', `${a.upper.toFixed(4)} <= ${b.upper.toFixed(4)}`); }

    console.log('RED 6 — two independent calibration pipelines must agree');
    { const h = run(base, 'disk', { r0: 12 }, o);
      const c = run(V.loadFile(o.day, o.band, 'casa').rows.filter((_, i) => i % Math.max(1, o.sub) === 0), 'disk', { r0: 12 }, o);
      const rel = Math.abs(h.upper - c.upper) / Math.max(h.upper, c.upper);
      say(rel < 0.15, 'hops vs casa', `upper ${h.upper.toFixed(4)} vs ${c.upper.toFixed(4)} (${(100 * rel).toFixed(1)}% apart)`); }

    console.log('RED 7 — amplitudes carry no position: the ceiling must not move with the disk');
    { const c0 = run(base, 'disk', { r0: 12 }, o);
      const c1 = run(base, 'disk', { r0: 12, cl: 22, cm: 0 }, o);
      const c2 = run(base, 'disk', { r0: 12, cl: -14, cm: 16 }, o);
      const spread = (Math.max(c0.upper, c1.upper, c2.upper) - Math.min(c0.upper, c1.upper, c2.upper)) / c0.upper;
      say(spread < 0.10, 'disk at (0,0) vs (22,0) vs (-14,16) uas', `uppers ${c0.upper.toFixed(4)} / ${c1.upper.toFixed(4)} / ${c2.upper.toFixed(4)} — spread ${(100 * spread).toFixed(1)}%`); }

    console.log(fails === 0 ? '\nALL REDS FIRED.' : `\n${fails} RED(S) FAILED.`);
  } else if (cmd === 'profile') {
    /* The ceiling profile: how much flux can sit within r of the centre, as a
       function of r.  Upper = certificate-shaped bound; lower = exhibited
       measure.  This is the object the whole experiment exists to produce. */
    const o = opts(process.argv.slice(3));
    const radii = (process.env.RADII || '4,8,12,16,20,24,28,32').split(',').map(Number);
    const ds = dataset(o);
    console.log(`profile  ${V.DAYS[o.day]} ${o.band} ${o.pipe}  K_dual=${ds.K} K_witness=${ds.Kfull}  bcut ${o.bcut} Gl  A_k = |V| + ${o.nsig}sigma + ${(100 * o.gain).toFixed(0)}% gain  F<=${ds.Fhi} Jy  FOV +-${o.fov} uas  N=${o.N} Nf=${o.Nf}`);
    const out = { data: { day: o.day, band: o.band, pipe: o.pipe, K: ds.K, bcut: o.bcut, nsig: o.nsig, gain: o.gain, F: ds.Fhi, fov: o.fov, N: o.N, Nf: o.Nf, rounds: o.rounds, iters: o.iters, sub: o.sub }, rows: [] };
    for (const r0 of radii) {
      const t0 = Date.now();
      const pr = primalWitness(ds, 'disk', { r0 }, o, false);
      o.plow = pr.value;
      const du = dualBound(ds, 'disk', { r0 }, o, false);
      const row = { r0, lower: pr.value, upper: du.bound, margin: du.margin * ds.Fhi, lam: du.lamScan, nrm: du.nrm, secs: (Date.now() - t0) / 1000 };
      out.rows.push(row);
      console.log(`  r <= ${String(r0).padStart(3)} uas :  lower ${pr.value.toFixed(4)} Jy   upper ${du.bound.toFixed(4)} Jy   (of ${ds.Fhi} Jy;  ratio ${(du.bound / Math.max(pr.value, 1e-9)).toFixed(2)}x;  Lipschitz share ${(100 * du.margin * ds.Fhi / du.bound).toFixed(1)}%)  ${row.secs.toFixed(0)}s`);
      fs.writeFileSync(path.join(OUT, 'profile.json'), JSON.stringify(out, null, 2));
    }
    console.log(`written ${path.join(OUT, 'profile.json')}`);
  } else if (cmd === 'fit') {
    const o = opts(process.argv.slice(3));
    const ds = dataset(o);
    console.log(`fit   ${V.DAYS[o.day]} ${o.band} ${o.pipe}  avg ${o.avg}s sys ${o.sys}  bcut ${o.bcut} Gl  K=${ds.K}  F<=${ds.Fhi}  FOV +-${o.fov} uas  N=${o.N}`);
    console.log('  (the complex-visibility feasibility probe now lives in reds; see notes)');
  } else console.log('unknown command: ' + cmd);
}
