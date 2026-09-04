/* cert-cp.js — the certificate, solved properly.  MIT.  Floats; intervals are Stage 1.

   THE PROBLEM, exactly as it is:

       minimise   SUM_k A_k |y_k|  +  lambda F
       over       y in C^K,  lambda >= 0
       such that  h_y(x) + lambda  >=  f(x)   for every x in Omega,
       where      h_y(x) = Re SUM_k conj(y_k) exp(-2 pi i u_k . x).

   Any feasible (y, lambda) gives a valid ceiling; the optimum of this program
   equals, by conic duality, the true supremum of INT f dmu over the data-
   consistent set.  So how close the ceiling gets to the truth is entirely a
   question of how well this program is solved — and Stage 0 solved it badly.

   WHAT WENT WRONG BEFORE, and it is worth keeping written down:
     - Adam: its per-coordinate normalisation divides out the A_k weights that
       ARE the problem; the objective climbed above its own trivial value.
     - Polyak subgradient: converges, but slowly and only to a few digits of the
       right answer on a nonsmooth problem with 1700 variables.  Ceilings came
       out 2-73x above their own witnesses.
     - Sum-of-squares kernels (cert-sos.js): sound, and the nonnegativity check
       vanishes entirely — but the snapshots here have complete station cliques
       of only 3 to 5, the bound scales like F/n, and requiring h >= 0 over ALL
       of the plane when it is only needed on Omega is a real loss.  Measured:
       1.17 Jy at r = 12 where the free search already gave 0.47.

   CHAMBOLLE-POCK is the right tool: a primal-dual first-order method that
   handles BOTH nonsmooth pieces exactly through their proximal operators
   rather than smoothing them.  With w = (y, lambda) and (Kw)_i = h_y(x_i) +
   lambda,
       g(w)   = SUM_k A_k |y_k| + lambda F + [lambda >= 0]     prox: block
                                                               soft-threshold
       phi(z) = [ z >= f ]                                     prox of phi*:
                                                               clamp(v - sigma f, 0)
   and the iteration is exact for both.  The semi-infinite constraint is handled
   by cutting planes: solve on a working set, hunt violations on an independent
   fine scan, add the worst back, repeat.

   Usage: node cert-cp.js disk <r0_uas> [opts]
          node cert-cp.js sweep [opts]
   opts: day=111 band=b3 pipe=hops bcut=0.4 fov=40 F=2 nsig=3 gain=0.05 sub=8
         N=48 Nf=512 rounds=5 iters=4000                                     */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vis.js');
const L = require('./lab-vis.js');
const UAS = V.UAS;

const DEF = { day: 111, band: 'b3', pipe: 'hops', bcut: 0.4, fov: 40, F: 2, nsig: 3, gain: 0.05, perstation: 1,
  sub: 8, N: 48, Nf: 512, rounds: 5, iters: 4000, cuts: 400 };
function opts(argv) {
  const o = Object.assign({}, DEF);
  for (const a of argv) { const m = /^(\w+)=(.+)$/.exec(a); if (m && m[1] in o) o[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; }
  return o;
}

function dataset(o) {
  const file = V.loadFile(o.day, o.band, o.pipe);
  const kept = file.rows.filter(r => Math.hypot(r.u, r.v) >= o.bcut * 1e9);
  const times = [...new Set(kept.map(r => r.t.toFixed(6)))].sort();
  const keepT = new Set(times.filter((_, i) => i % o.sub === 0));
  const rows = kept.filter(r => keepT.has(r.t.toFixed(6)));
  /* THE CEILING HAS TO COVER AN AMPLITUDE **LOSS**, AND THE ADDITIVE FORM DOES
     NOT.  The measurement is |V_meas| = |g_a||g_b| |V_true| + noise, and in VLBI
     the residual gains are LOSSES: decoherence and pointing take amplitude away,
     they do not add it.  So |V_true| = |V_meas| / (|g_a||g_b|), and a ceiling
     written as |V_meas|(1 + gain) covers the truth only while
     gain >= 1/(|g_a||g_b|) - 1.  At the 5% used until now that is a 4.8% loss
     per BASELINE — smaller than the per-station amplitude uncertainties the EHT
     itself quotes, several of which are 10-26%.  The bound was therefore not
     sound against the calibration it claimed to be robust to.  The correct form
     divides:  A_k = ( |V_k| + nsig sigma_k ) / ( (1-d_a)(1-d_b) ). */
  const DELTA = { AA: 0.05, AX: 0.055, MG: 0.035, MM: 0.07, LM: 0.26, SW: 0.075, PV: 0.05, GL: 0.10 };
  const A = rows.map(r => {
    const num = r.amp + o.nsig * r.sigma;
    if (!o.perstation) return num / Math.max(1e-3, 1 - o.gain);
    const da = DELTA[r.t1] !== undefined ? DELTA[r.t1] : 0.10, db = DELTA[r.t2] !== undefined ? DELTA[r.t2] : 0.10;
    return num / ((1 - da) * (1 - db));
  });
  /* A WITNESS MUST FACE EVERY CONSTRAINT, NOT THE THINNED ONES.  `sub` exists
     to make the DUAL cheap, and dropping constraints only enlarges the feasible
     set, so a ceiling computed on a subset still bounds the whole problem.  The
     witness has no such licence: a measure that satisfies one row in eight is a
     witness for nothing.  This bench wrote that gotcha down in session 12, then
     reintroduced it in session 13 by rescaling the candidate measure against
     `rows` instead of `kept` — which inflated every reported witness by ~1.6x
     and made the brackets look 1.05x when they were 1.7x.  allRows/allA are
     what the witness is checked against, always. */
  const allA = kept.map(r => {
    const num = r.amp + o.nsig * r.sigma;
    if (!o.perstation) return num / Math.max(1e-3, 1 - o.gain);
    const da = DELTA[r.t1] !== undefined ? DELTA[r.t1] : 0.10, db = DELTA[r.t2] !== undefined ? DELTA[r.t2] : 0.10;
    return num / ((1 - da) * (1 - db));
  });
  return { file, kept, rows, A, allRows: kept, allA, K: rows.length, Kall: kept.length, fovRad: o.fov * UAS, delta: DELTA };
}

/* h_y and its adjoint on an explicit point list */
function kernels(rows, pts) {
  const K = rows.length, P = pts.length / 2;
  const C = new Float32Array(P * K), S = new Float32Array(P * K);
  for (let i = 0; i < P; i++) {
    const l = pts[2 * i], m = pts[2 * i + 1], b = i * K;
    for (let k = 0; k < K; k++) {
      const th = 2 * Math.PI * (rows[k].u * l + rows[k].v * m);
      C[b + k] = Math.cos(th); S[b + k] = Math.sin(th);
    }
  }
  return { C, S, P, K };
}

function chambollePock(ds, pts, fv, o, warm) {
  const { rows, A } = ds, K = ds.K;
  const { C, S, P } = kernels(rows, pts);
  const a = new Float64Array(K), b = new Float64Array(K);
  let lam = 0;
  if (warm) { a.set(warm.a); b.set(warm.b); lam = warm.lam; }
  const ab = new Float64Array(K), bb = new Float64Array(K); let lamb = lam;   // w-bar
  const z = new Float64Array(P);
  const Kw = new Float64Array(P), Kt_a = new Float64Array(K), Kt_b = new Float64Array(K);

  const applyK = (aa, bb2, ll, out) => {
    for (let i = 0; i < P; i++) {
      const base = i * K; let s = 0;
      for (let k = 0; k < K; k++) s += aa[k] * C[base + k] - bb2[k] * S[base + k];
      out[i] = s + ll;
    }
  };
  const applyKt = (zz) => {
    Kt_a.fill(0); Kt_b.fill(0); let sl = 0;
    for (let i = 0; i < P; i++) {
      const zi = zz[i]; if (zi === 0) continue;
      const base = i * K;
      for (let k = 0; k < K; k++) { Kt_a[k] += zi * C[base + k]; Kt_b[k] -= zi * S[base + k]; }
      sl += zi;
    }
    return sl;
  };
  /* ||K|| by power iteration */
  let nrm = 1;
  {
    const va = new Float64Array(K).fill(1 / Math.sqrt(K)), vb = new Float64Array(K), tmp = new Float64Array(P);
    let vl = 0.1;
    for (let t = 0; t < 25; t++) {
      applyK(va, vb, vl, tmp);
      const sl = applyKt(tmp);
      let n = sl * sl;
      for (let k = 0; k < K; k++) n += Kt_a[k] * Kt_a[k] + Kt_b[k] * Kt_b[k];
      n = Math.sqrt(n) || 1;
      for (let k = 0; k < K; k++) { va[k] = Kt_a[k] / n; vb[k] = Kt_b[k] / n; }
      vl = sl / n; nrm = Math.sqrt(n);
    }
  }
  const tau = 1 / nrm, sig = 1 / nrm, theta = 1;
  ab.set(a); bb.set(b); lamb = lam;
  let best = Infinity, bestW = null;
  for (let it = 0; it < o.iters; it++) {
    applyK(ab, bb, lamb, Kw);
    for (let i = 0; i < P; i++) { const v = z[i] + sig * Kw[i] - sig * fv[i]; z[i] = v > 0 ? 0 : v; }   // prox of phi*
    const sl = applyKt(z);
    const pa = new Float64Array(K), pb = new Float64Array(K);
    for (let k = 0; k < K; k++) { pa[k] = a[k] - tau * Kt_a[k]; pb[k] = b[k] - tau * Kt_b[k]; }
    let nl = lam - tau * (sl + o.F);
    if (nl < 0) nl = 0;                                                   // lambda >= 0
    for (let k = 0; k < K; k++) {                                         // block soft-threshold by tau*A_k
      const m = Math.hypot(pa[k], pb[k]), t = tau * A[k];
      if (m <= t) { pa[k] = 0; pb[k] = 0; }
      else { const s = (m - t) / m; pa[k] *= s; pb[k] *= s; }
    }
    for (let k = 0; k < K; k++) { ab[k] = pa[k] + theta * (pa[k] - a[k]); bb[k] = pb[k] + theta * (pb[k] - b[k]); }
    lamb = nl + theta * (nl - lam);
    a.set(pa); b.set(pb); lam = nl;
    if (it % 200 === 199 || it === o.iters - 1) {
      applyK(a, b, lam, Kw);
      let viol = 0; for (let i = 0; i < P; i++) { const d = fv[i] - Kw[i]; if (d > viol) viol = d; }
      let obj = lam * o.F; for (let k = 0; k < K; k++) obj += A[k] * Math.hypot(a[k], b[k]);
      const feas = obj + Math.max(0, viol) * o.F;      // repair by raising lambda
      if (feas < best) { best = feas; bestW = { a: Float64Array.from(a), b: Float64Array.from(b), lam: lam + Math.max(0, viol), z: Float64Array.from(z) }; }
    }
  }
  return { best, w: bestW || { a, b, lam, z } };
}

/* THE WITNESS COMES FREE.  In the Lagrangian
     SUM A_k |y_k| + lambda F + SUM_i z_i ( f_i - h_i - lambda ),
   the multiplier on each pointwise constraint IS a mass at that point, so the
   dual variable Chambolle-Pock is already carrying is a nonnegative measure on
   the working set — the primal witness, converging alongside the ceiling.  It
   costs nothing to read it off, it is far better than the separate FISTA search
   it replaces, and the gap between the two is then a certificate of how much of
   the remaining slack is the SOLVER's rather than the data's.
   Constraints are homogeneous in mu, so an infeasible iterate is repaired by a
   single scaling — no projection needed. */
function witnessFrom(ds, pts, z, fv, o) {
  const rows = ds.allRows || ds.rows, A = ds.allA || ds.A, K = rows.length, P = z.length;
  const mu = new Float64Array(P);
  for (let i = 0; i < P; i++) mu[i] = z[i] < 0 ? -z[i] : 0;
  const Re = new Float64Array(K), Im = new Float64Array(K);
  for (let i = 0; i < P; i++) {
    const m = mu[i]; if (m === 0) continue;
    const l = pts[2 * i], mm = pts[2 * i + 1];
    for (let k = 0; k < K; k++) {
      const th = 2 * Math.PI * (rows[k].u * l + rows[k].v * mm);
      Re[k] += m * Math.cos(th); Im[k] -= m * Math.sin(th);
    }
  }
  let worst = 0, tot = 0;
  for (let k = 0; k < K; k++) worst = Math.max(worst, Math.hypot(Re[k], Im[k]) / A[k]);
  for (let i = 0; i < P; i++) tot += mu[i];
  const s = Math.min(1 / Math.max(worst, 1e-30), o.F / Math.max(tot, 1e-30), 1e30);
  const scale = Math.min(1, s);
  let val = 0;
  for (let i = 0; i < P; i++) val += fv[i] * mu[i] * scale;
  return { value: val, total: tot * scale, worst: worst * scale };
}

/* SECOND-ORDER SCAN.  The pointwise inequality is checked at samples, and
   something has to cover what lies between them.  A global Lipschitz constant
   L = 2 pi SUM |y_k| |u_k| does cover it, but it is enormously pessimistic: it
   assumes every mode conspires at every point, and it was costing 9% of the
   ceiling.  The gradient of h can be evaluated EXACTLY at each sample for the
   price of two more accumulations, and the second derivative is bounded once
   and for all by L2 = (2 pi)^2 SUM |y_k| |u_k|^2.  Then on a cell of radius d
   around a sample,
       h(x) >= h(x_c) - |grad h(x_c)| d - (1/2) L2 d^2,
   which is a per-cell margin driven by the LOCAL slope — small almost
   everywhere, and only large where h is genuinely steep.  Same soundness, a
   fraction of the cost. */
function scan2(rows, a, b, R, Nf, fFun, topN, ol, om) {
  const K = rows.length, co = new Float64Array(Nf), cm2 = new Float64Array(Nf);
  const OL = ol || 0, OM = om || 0;
  for (let i = 0; i < Nf; i++) { co[i] = OL + (-R + (2 * R * i) / (Nf - 1)); cm2[i] = OM + (-R + (2 * R * i) / (Nf - 1)); }
  let L2 = 0;
  for (let k = 0; k < K; k++) { const uu = Math.hypot(rows[k].u, rows[k].v); L2 += Math.hypot(a[k], b[k]) * uu * uu; }
  L2 *= (2 * Math.PI) * (2 * Math.PI);
  const d = (R / (Nf - 1)) * Math.SQRT2;                  // half-diagonal of a cell
  const CA = new Float64Array(Nf * K), SA = new Float64Array(Nf * K);
  const CB = new Float64Array(Nf * K), SB = new Float64Array(Nf * K);
  for (let i = 0; i < Nf; i++) {
    const base = i * K;
    for (let k = 0; k < K; k++) {
      const A1 = 2 * Math.PI * rows[k].u * co[i], B1 = 2 * Math.PI * rows[k].v * cm2[i];
      CA[base + k] = Math.cos(A1); SA[base + k] = Math.sin(A1);
      CB[base + k] = Math.cos(B1); SB[base + k] = Math.sin(B1);
    }
  }
  const P = new Float64Array(K), Q = new Float64Array(K);
  let worst = -Infinity; const cand = [];
  for (let j = 0; j < Nf; j++) {
    const bj = j * K;
    for (let k = 0; k < K; k++) {
      const cb = CB[bj + k], sb = SB[bj + k];
      P[k] = a[k] * cb - b[k] * sb;
      Q[k] = -a[k] * sb - b[k] * cb;
    }
    const mm = cm2[j];
    for (let i = 0; i < Nf; i++) {
      const bi = i * K;
      let h = 0, gl = 0, gm = 0;
      for (let k = 0; k < K; k++) {
        const ca = CA[bi + k], sa = SA[bi + k];
        const term = ca * P[k] + sa * Q[k];
        h += term;
        /* d/dl of [a cos(th) - b sin(th)] = -2 pi u [a sin(th) + b cos(th)] */
        const dth = ca * Q[k] - sa * P[k];               // = -(a sin + b cos)
        gl += 2 * Math.PI * rows[k].u * dth;
        gm += 2 * Math.PI * rows[k].v * dth;
      }
      const margin = Math.hypot(gl, gm) * d + 0.5 * L2 * d * d;
      const v = fFun(co[i] / 4.84813681109536e-12, mm / 4.84813681109536e-12) - h + margin;
      if (v > worst) worst = v;
      if (topN && v > 0) cand.push([v, co[i], mm]);
    }
  }
  let pts = [];
  if (topN && cand.length) {
    cand.sort((x, y) => y[0] - x[0]);
    for (let i = 0; i < Math.min(topN, cand.length); i++) pts.push(cand[i][1], cand[i][2]);
  }
  return { max: worst, pts, L2 };
}

/* the full ceiling with cutting planes and an honest final check */
function ceiling(ds, r0, o, log = true) {
  const R = ds.fovRad;
  const fFun = (l, m) => (Math.hypot(l, m) <= r0 ? 1 : 0);
  const pts = [];
  for (let j = 0; j < o.N; j++) for (let i = 0; i < o.N; i++)
    pts.push(-R + (2 * R * i) / (o.N - 1), -R + (2 * R * j) / (o.N - 1));
  /* the target disk is where the constraint actually bites — sample it densely */
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 1200; i++) {
    const rr = r0 * Math.sqrt((i + 0.5) / 1200) * UAS, th = i * GA;
    pts.push(rr * Math.cos(th), rr * Math.sin(th));
  }
  let warm = null, rep = null;
  for (let round = 0; round < o.rounds; round++) {
    const flat = Float64Array.from(pts);
    const fv = new Float64Array(flat.length / 2);
    for (let i = 0; i < fv.length; i++) fv[i] = fFun(flat[2 * i] / UAS, flat[2 * i + 1] / UAS);
    const r = chambollePock(ds, flat, fv, o, warm);
    warm = r.w;
    const wit = r.w.z ? witnessFrom(ds, flat, r.w.z, fv, o) : { value: 0 };
    const scan = scan2(ds.rows, r.w.a, r.w.b, R, o.Nf, (l, m) => fFun(l, m) - r.w.lam, o.cuts);
    const extra = Math.max(0, scan.max);
    const margin = 0;
    let nrm = 0; for (let k = 0; k < ds.K; k++) nrm += ds.A[k] * Math.hypot(r.w.a[k], r.w.b[k]);
    rep = { ceiling: nrm + (r.w.lam + extra) * o.F, witness: wit.value, working: r.best, lam: r.w.lam, extra, margin, P: fv.length, nrm };
    if (log) console.log(`    round ${round + 1}/${o.rounds}  |set| ${fv.length}  witness ${wit.value.toFixed(5)}  ceiling ${rep.ceiling.toFixed(5)}  gap ${(rep.ceiling / Math.max(wit.value, 1e-9)).toFixed(2)}×  (working ${r.best.toFixed(5)}, lambda ${r.w.lam.toFixed(5)} + ${extra.toFixed(5)})`);
    if (!scan.pts.length) break;
    for (const v of scan.pts) pts.push(v);
  }
  return rep;
}

module.exports = { opts, dataset, ceiling, chambollePock, scan2, witnessFrom, ceilingAt };

/* ---------------- the red team for the certificate ---------------- */
/* A ceiling is a claim about EVERY measure in the set.  The cheapest way to be
   wrong is to be wrong about one we can write down ourselves, so the first red
   builds a sky, gives the certifier that sky's OWN amplitudes as the ceilings,
   and demands that the bound contain it.  Nothing here is believed until all of
   them fire. */
function reds(o) {
  const ds0 = dataset(o);
  let fails = 0;
  const say = (ok, name, detail) => { console.log(`  ${ok ? 'PASS' : '**FAIL**'}  ${name}${detail ? '  —  ' + detail : ''}`); if (!ok) fails++; };
  const withRows = (rows) => ({ rows, A: rows.map(r => r.amp + o.nsig * r.sigma + o.gain * r.amp), K: rows.length, fovRad: ds0.fovRad });

  console.log('RED 1 — a sky we built ourselves must be inside its own ceiling');
  for (const [name, model] of [
    ['ring 43.3 µas, 0.6 Jy, empty centre', V.ringModel(21.65, 0.6, 256, 0)],
    ['ring + 0.25 Jy central point', V.ringModel(21.65, 0.6, 256, 0.25)],
    ['point source 0.4 Jy at the centre', [{ l: 0, m: 0, flux: 0.4 }]],
  ]) {
    const rows = V.syntheticRows(ds0.rows, model);
    const ds = withRows(rows);
    for (const r0 of [8, 20]) {
      const c = ceiling(ds, r0, o, false);
      const truth = V.modelFluxWithin(model, r0);
      say(c.ceiling >= truth - 1e-9, `${name}, r<=${r0}`, `truth ${truth.toFixed(4)} <= ceiling ${c.ceiling.toFixed(4)} (witness ${c.witness.toFixed(4)})`);
    }
  }

  console.log('RED 2 — the witness must be a real measure: recompute its constraints from scratch');
  {
    const r0 = 12, R = ds0.fovRad;
    const pts = [];
    for (let j = 0; j < o.N; j++) for (let i = 0; i < o.N; i++) pts.push(-R + (2 * R * i) / (o.N - 1), -R + (2 * R * j) / (o.N - 1));
    const GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 1200; i++) { const rr = r0 * Math.sqrt((i + 0.5) / 1200) * UAS, th = i * GA; pts.push(rr * Math.cos(th), rr * Math.sin(th)); }
    const flat = Float64Array.from(pts);
    const fv = new Float64Array(flat.length / 2);
    for (let i = 0; i < fv.length; i++) fv[i] = Math.hypot(flat[2 * i], flat[2 * i + 1]) / UAS <= r0 ? 1 : 0;
    const r = chambollePock(ds0, flat, fv, o, null);
    const w = witnessFrom(ds0, flat, r.w.z, fv, o);
    say(w.worst <= 1 + 1e-9 && w.total <= o.F + 1e-9, 'witness satisfies every amplitude ceiling and the flux cap',
      `worst |V|/A ${w.worst.toFixed(6)}, total ${w.total.toFixed(4)} Jy <= ${o.F}, value ${w.value.toFixed(4)}`);
  }

  console.log('RED 3 — monotone in the radius');
  { const a = ceiling(ds0, 8, o, false), b = ceiling(ds0, 24, o, false);
    say(b.ceiling >= a.ceiling * 0.99, 'r=8 vs r=24', `${a.ceiling.toFixed(4)} <= ${b.ceiling.toFixed(4)}`); }

  console.log('RED 4 — a wider error budget may only loosen it');
  { const t = ceiling(dataset(Object.assign({}, o, { gain: 0.01 })), 12, Object.assign({}, o, { gain: 0.01 }), false);
    const l = ceiling(dataset(Object.assign({}, o, { gain: 0.20 })), 12, Object.assign({}, o, { gain: 0.20 }), false);
    say(l.ceiling >= t.ceiling * 0.99, 'gain 1% -> 20%', `${t.ceiling.toFixed(4)} -> ${l.ceiling.toFixed(4)}`); }

  console.log('RED 5 — deleting a telescope may only loosen it');
  { const full = ceiling(ds0, 12, o, false);
    const cut = ceiling(withRows(ds0.rows.filter(r => r.t1 !== 'GL' && r.t2 !== 'GL')), 12, o, false);
    say(cut.ceiling >= full.ceiling * 0.99, 'drop the Greenland Telescope', `${ds0.K} -> ${ds0.rows.filter(r => r.t1 !== 'GL' && r.t2 !== 'GL').length} rows: ${full.ceiling.toFixed(4)} -> ${cut.ceiling.toFixed(4)}`); }

  /* RED 6 — TRANSLATION, STATED CORRECTLY.  Two earlier versions of this test
     were wrong and both are worth keeping written down, because the error was
     mine and the red team is what caught it.

     (a) "the ceiling must not depend on where the disk is" — measured 24%
         spread and read as a failure.  But the bound is stated over a FINITE
         field of view, and translating a measure pushes part of its support out
         of that field.  The constraint set is translation-invariant on the
         plane; the field restriction is not.  So the ceiling is entitled to
         move when the disk moves inside a fixed field.
     (b) "an off-centre witness must fit under the centred ceiling" — this
         assumed sup(off-centre) <= sup(centred), justified by the centre being
         "most interior".  That is not a theorem: what the optimiser needs is
         room to place CANCELLING mass, and a disk near one edge has less room
         on that side and more on the other.  No ordering is provable, so the
         test could not fail meaningfully — and it duly reported a failure that
         meant nothing.

     What IS true, and is what this now tests: translate the disk AND the field
     together, and nothing changes at all. */
  console.log('RED 6 — translate the disk and the field together: the ceiling must not move');
  { const c0 = ceiling(ds0, 12, o, false);
    const c1 = ceilingAt(ds0, 12, 22, 0, o, true, true), c2 = ceilingAt(ds0, 12, -14, 16, o, true, true);
    const sp = (Math.max(c0.ceiling, c1.ceiling, c2.ceiling) - Math.min(c0.ceiling, c1.ceiling, c2.ceiling)) / c0.ceiling;
    say(sp < 0.05, 'field and disk both at (0,0) vs (22,0) vs (-14,16) µas',
      `${c0.ceiling.toFixed(4)} / ${c1.ceiling.toFixed(4)} / ${c2.ceiling.toFixed(4)} — spread ${(100 * sp).toFixed(1)}%`);
    const f0 = ceilingAt(ds0, 12, 22, 0, o, true, false);
    console.log(`         (with the field held fixed instead, the same disk gives ${f0.ceiling.toFixed(4)} — the difference is the field-of-view edge, not a broken invariance)`); }

  console.log(fails === 0 ? '\nALL REDS FIRED.' : `\n${fails} RED(S) FAILED.`);
}
function ceilingAt(ds, r0, cl, cm, o, wantWitness, moveField) {
  const R = ds.fovRad, fFun = (l, m) => (Math.hypot(l - cl, m - cm) <= r0 ? 1 : 0);
  const OL = moveField ? cl * UAS : 0, OM = moveField ? cm * UAS : 0;
  const pts = [];
  for (let j = 0; j < o.N; j++) for (let i = 0; i < o.N; i++) pts.push(OL + (-R + (2 * R * i) / (o.N - 1)), OM + (-R + (2 * R * j) / (o.N - 1)));
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 1200; i++) { const rr = r0 * Math.sqrt((i + 0.5) / 1200) * UAS, th = i * GA; pts.push(cl * UAS + rr * Math.cos(th), cm * UAS + rr * Math.sin(th)); }
  let warm = null, out = Infinity;
  for (let round = 0; round < o.rounds; round++) {
    const flat = Float64Array.from(pts);
    const fv = new Float64Array(flat.length / 2);
    for (let i = 0; i < fv.length; i++) fv[i] = fFun(flat[2 * i] / UAS, flat[2 * i + 1] / UAS);
    const r = chambollePock(ds, flat, fv, o, warm); warm = r.w;
    const wit = r.w.z ? witnessFrom(ds, flat, r.w.z, fv, o) : { value: 0 };
    const scan = scan2(ds.rows, r.w.a, r.w.b, R, o.Nf, (l, m) => fFun(l, m) - r.w.lam, o.cuts, OL, OM);
    let nrm = 0; for (let k = 0; k < ds.K; k++) nrm += ds.A[k] * Math.hypot(r.w.a[k], r.w.b[k]);
    out = { ceiling: nrm + (r.w.lam + Math.max(0, scan.max)) * o.F, witness: wit.value };
    if (!scan.pts.length) break;
    for (const v of scan.pts) pts.push(v);
  }
  return wantWitness ? out : out.ceiling;
}

if (require.main === module) {
  const cmd = process.argv[2] || 'disk';
  if (cmd === 'sweep') {
    const o = opts(process.argv.slice(3));
    const ds = dataset(o);
    console.log(`data  ${V.DAYS[o.day]} ${o.band} ${o.pipe}  ${ds.K} rows (every ${o.sub}th snapshot), bcut ${o.bcut} Gl, FOV ±${o.fov} µas, F<=${o.F}`);
    const out = [];
    for (const r0 of [6, 12, 20, 28]) {
      const t0 = Date.now();
      const c = ceiling(ds, r0, o, false);
      out.push({ r0, ceiling: c.ceiling, witness: c.witness, ratio: c.ceiling / Math.max(c.witness, 1e-9), secs: (Date.now() - t0) / 1000 });
      console.log(`  r <= ${String(r0).padStart(2)} µas :  witness ${c.witness.toFixed(4)}   ceiling ${c.ceiling.toFixed(4)}   gap ${(c.ceiling / Math.max(c.witness, 1e-9)).toFixed(2)}×   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    fs.writeFileSync(path.join(__dirname, 'out', 'cp-sweep.json'), JSON.stringify({ opts: o, rows: out }, null, 2));
    console.log('written out/cp-sweep.json');
  } else if (cmd === 'pagedata') {
    /* Patch out/page-data.json's ceiling entries with the Chambolle-Pock
       bracket, and rasterise the CP witness measure onto the page's own grid so
       the picture and the number are the same object. */
    const o = opts(process.argv.slice(3));
    const PD = path.join(__dirname, 'out', 'page-data.json');
    const D = JSON.parse(fs.readFileSync(PD, 'utf8'));
    o.fov = D.meta.fov; o.F = D.meta.F; o.nsig = D.meta.nsig; o.gain = D.meta.gain;
    o.bcut = D.meta.bcut; o.sub = D.meta.sub; o.day = D.meta.day; o.band = D.meta.band; o.pipe = D.meta.pipe;
    const ds = dataset(o);
    console.log(`pagedata  ${ds.K} rows (page ships ${D.meta.K}), FOV ±${o.fov} µas, F<=${o.F}`);
    const N = D.meta.N, R = ds.fovRad;
    const out = [];
    for (const ent of D.ceiling) {
      const r0 = ent.r0, t0 = Date.now();
      /* rebuild the working set so the witness measure can be rasterised */
      const pts = [];
      for (let j = 0; j < o.N; j++) for (let i = 0; i < o.N; i++) pts.push(-R + (2 * R * i) / (o.N - 1), -R + (2 * R * j) / (o.N - 1));
      const GA = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < 1200; i++) { const rr = r0 * Math.sqrt((i + 0.5) / 1200) * UAS, th = i * GA; pts.push(rr * Math.cos(th), rr * Math.sin(th)); }
      let warm = null, ceil = Infinity, wit = null, flatF = null, fvF = null;
      for (let round = 0; round < o.rounds; round++) {
        const flat = Float64Array.from(pts);
        const fv = new Float64Array(flat.length / 2);
        for (let i = 0; i < fv.length; i++) fv[i] = Math.hypot(flat[2 * i], flat[2 * i + 1]) / UAS <= r0 ? 1 : 0;
        const r = chambollePock(ds, flat, fv, o, warm); warm = r.w;
        const w = witnessFrom(ds, flat, r.w.z, fv, o);
        const scan = scan2(ds.rows, r.w.a, r.w.b, R, o.Nf, (l, m) => (Math.hypot(l, m) <= r0 ? 1 : 0) - r.w.lam, o.cuts);
        let nrm = 0; for (let k = 0; k < ds.K; k++) nrm += ds.A[k] * Math.hypot(r.w.a[k], r.w.b[k]);
        ceil = nrm + (r.w.lam + Math.max(0, scan.max)) * o.F;
        wit = w; flatF = flat; fvF = fv;
        if (!scan.pts.length) break;
        for (const v of scan.pts) pts.push(v);
      }
      /* rasterise mu onto the page grid */
      const img = new Float64Array(N * N);
      { const z = warm.z, P = flatF.length / 2;
        let worst = 0, tot = 0;
        const Re = new Float64Array(ds.K), Im = new Float64Array(ds.K), mu = new Float64Array(P);
        for (let i = 0; i < P; i++) mu[i] = z[i] < 0 ? -z[i] : 0;
        for (let i = 0; i < P; i++) { const m = mu[i]; if (!m) continue;
          for (let k = 0; k < ds.K; k++) { const th = 2 * Math.PI * (ds.rows[k].u * flatF[2 * i] + ds.rows[k].v * flatF[2 * i + 1]); Re[k] += m * Math.cos(th); Im[k] -= m * Math.sin(th); } }
        for (let k = 0; k < ds.K; k++) worst = Math.max(worst, Math.hypot(Re[k], Im[k]) / ds.A[k]);
        for (let i = 0; i < P; i++) tot += mu[i];
        const sc = Math.min(1, 1 / Math.max(worst, 1e-30), o.F / Math.max(tot, 1e-30));
        for (let i = 0; i < P; i++) {
          const gi = Math.round((flatF[2 * i] + R) / (2 * R) * (N - 1)), gj = Math.round((flatF[2 * i + 1] + R) / (2 * R) * (N - 1));
          if (gi >= 0 && gi < N && gj >= 0 && gj < N) img[gj * N + gi] += mu[i] * sc;
        } }
      let hi = 0; for (const v of img) if (v > hi) hi = v;
      const buf = Buffer.alloc(N * N);
      for (let i = 0; i < N * N; i++) buf[i] = Math.max(0, Math.min(255, Math.round(255 * img[i] / (hi || 1))));
      let tot2 = 0; for (const v of img) tot2 += v;
      out.push({ r0, value: wit.value, upper: ceil, total: tot2, chi2: ent.chi2, peak: hi, b64: buf.toString('base64') });
      console.log(`  r <= ${String(r0).padStart(2)} µas :  witness ${wit.value.toFixed(4)}   ceiling ${ceil.toFixed(4)}   gap ${(ceil / Math.max(wit.value, 1e-9)).toFixed(2)}×   (was ${ent.value.toFixed(4)} / ${ent.upper.toFixed(4)})   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    D.ceiling = out;
    D.meta.certifier = 'cert-cp.js (Chambolle-Pock, second-order scan margin, witness read off the dual variable)';
    fs.writeFileSync(PD, JSON.stringify(D));
    console.log('patched out/page-data.json');
  } else if (cmd === 'reds') {
    const o = opts(process.argv.slice(3));
    console.log(`reds  ${o.N}x${o.N} working grid, Nf=${o.Nf}, ${o.iters} CP iterations, ${o.rounds} rounds, sub=${o.sub}`);
    reds(o);
  } else {
    const r0 = +process.argv[3] || 12;
    const o = opts(process.argv.slice(4));
    const ds = dataset(o);
    console.log(`data  ${ds.K} rows, FOV ±${o.fov} µas, F<=${o.F}, disk r<=${r0} µas`);
    const t0 = Date.now();
    const c = ceiling(ds, r0, o);
    console.log(`\nCP CEILING  r <= ${r0} µas :  ${c.ceiling.toFixed(5)} Jy   (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}
