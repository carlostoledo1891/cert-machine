/* cert-sos.js — STAGE 0.5: the certificate, built out of nonnegative kernels.
   MIT, clean-room.  Floats still; the interval layer is Stage 1.

   WHY THIS EXISTS.  The Stage-0 dual searched for multipliers y directly and
   then had to CHECK, over the whole field, that
       h_y(x) = Re SUM_k conj(y_k) exp(-2 pi i u_k . x)  >=  f(x) - lambda
   which is a semi-infinite constraint over a two-dimensional continuum.  A
   subgradient method could only find weak y, and the resulting ceilings ran up
   to 73x above their own witnesses.

   THE STRUCTURE THAT FIXES IT.  A baseline is a DIFFERENCE of station
   positions, u_ab = p_a - p_b.  So for the stations observing simultaneously in
   one snapshot, with c_a(x) = exp(-2 pi i p_a . x),

       h(x)  =  c(x)* Q c(x)  =  SUM_a Q_aa  +  2 Re SUM_{a<b} Q_ab exp(2 pi i u_ab . x)

   is expressible in exactly our multipliers — y_k = 2 Q_ab for the baseline k,
   and lambda = tr Q — and if Q is positive semidefinite it is NONNEGATIVE
   EVERYWHERE, for free, with nothing to check.  The whole "h >= 0 off the
   target" half of the constraint disappears.  What remains is h >= 1 on the
   target disk, which is a small region and cheap to check finely.

   Sum over snapshots: h = SUM_t c_t(x)* Q_t c_t(x), each Q_t >= 0.  This is the
   two-dimensional sum-of-squares cone; in 2-D it is a RELAXATION of
   nonnegativity rather than an exact description (Fejer-Riesz is a 1-D
   theorem), which is exactly what we want here: every member of it is sound,
   so any Q we find gives a valid bound whether or not it is optimal.

   HOMOGENEITY.  Both the objective and h are positively homogeneous of degree
   one in Q, so the constraint "h >= 1 on the disk" never has to be imposed:
   for any Q with m = min_disk h > 0, the bound is simply

       ceiling  =  [ SUM_t ( F tr Q_t + 2 SUM_{a<b} A_ab |Q^t_ab| ) ]  /  m .

   Q is carried as Q_t = V_t V_t*, so semidefiniteness is structural and there
   is no projection step.

   Usage:  node cert-sos.js disk <r0_uas> [opts]
           node cert-sos.js compare <r0_uas> [opts]      (Stage 0 vs Stage 0.5)
   opts: day=111 band=b3 pipe=hops bcut=0.4 fov=40 F=2 nsig=3 gain=0.05
         sub=8 rank=2 iters=1500 P=6000 Pfine=40000                          */
'use strict';
const V = require('./vis.js');
const L = require('./lab-vis.js');
const UAS = V.UAS;

const DEF = { day: 111, band: 'b3', pipe: 'hops', bcut: 0.4, fov: 40, F: 2, nsig: 3, gain: 0.05,
  sub: 8, rank: 2, iters: 1500, P: 6000, Pfine: 40000, seed: 7, quiet: 0 };
function opts(argv) {
  const o = Object.assign({}, DEF);
  for (const a of argv) { const m = /^(\w+)=(.+)$/.exec(a); if (m && m[1] in o) o[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; }
  return o;
}

/* ---------- snapshots, cliques, station positions ---------- */
/* p_a is recovered from the baselines themselves: fix a reference station at the
   origin, then p_a = u_{a,ref}.  A global translation of p multiplies every
   c_a by one common phase, which cancels in c* Q c — so the gauge is free. */
function snapshots(rows, o) {
  const byT = new Map();
  rows.forEach((r, i) => { const k = r.t.toFixed(6); if (!byT.has(k)) byT.set(k, []); byT.get(k).push(i); });
  const out = [];
  for (const [tk, idx] of byT) {
    const names = [...new Set(idx.flatMap(i => [rows[i].t1, rows[i].t2]))].sort();
    if (names.length < 3) continue;
    const edge = new Map();
    for (const i of idx) edge.set([rows[i].t1, rows[i].t2].sort().join('|'), i);
    const has = (a, b) => edge.has([a, b].sort().join('|'));
    /* largest complete subgraph — n <= 8, so enumerate every subset */
    let best = [];
    for (let mask = 1; mask < (1 << names.length); mask++) {
      const S = [];
      for (let i = 0; i < names.length; i++) if (mask & (1 << i)) S.push(names[i]);
      if (S.length <= best.length) continue;
      let ok = true;
      for (let a = 0; a < S.length && ok; a++) for (let b = a + 1; b < S.length && ok; b++) if (!has(S[a], S[b])) ok = false;
      if (ok) best = S;
    }
    if (best.length < 3) continue;
    /* positions, gauge-fixed at best[0] */
    const ref = best[0], p = [[0, 0]];
    let good = true;
    for (let a = 1; a < best.length; a++) {
      const i = edge.get([best[a], ref].sort().join('|'));
      const r = rows[i];
      const sgn = (r.t1 === best[a]) ? 1 : -1;          // row holds u_{t1,t2} = p_t1 - p_t2
      p.push([sgn * r.u, sgn * r.v]);
      if (!isFinite(r.u)) good = false;
    }
    if (!good) continue;
    const pairs = [];
    for (let a = 0; a < best.length; a++) for (let b = a + 1; b < best.length; b++) {
      const i = edge.get([best[a], best[b]].sort().join('|'));
      pairs.push({ a, b, k: i, A: rows[i].amp + o.nsig * rows[i].sigma + o.gain * rows[i].amp });
    }
    out.push({ t: tk, names: best, n: best.length, p, pairs });
  }
  return out;
}

/* ---------- the target disk, sampled ---------- */
function diskPoints(r0, P, seed) {
  /* a sunflower lattice: even coverage, no lattice artefacts along the axes */
  const pts = new Float64Array(2 * P), GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < P; i++) {
    const rr = r0 * Math.sqrt((i + 0.5) / P) * UAS, th = (i + seed) * GA;
    pts[2 * i] = rr * Math.cos(th); pts[2 * i + 1] = rr * Math.sin(th);
  }
  return pts;
}

/* ---------- the certificate ---------- */
function sosCeiling(snaps, r0, o, log = true) {
  const T = snaps.length, r = o.rank;
  const off = [], dim = [];                    // flat offsets into the V array
  let NV = 0;
  for (const s of snaps) { off.push(NV); dim.push(s.n); NV += s.n * r; }
  const Pv = new Float64Array(NV), Qv = new Float64Array(NV);      // V = Pv + i Qv
  let rnd = o.seed * 2654435761 >>> 0;
  const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
  for (let i = 0; i < NV; i++) { Pv[i] = 1 + 0.35 * (rand() - 0.5); Qv[i] = 0.35 * (rand() - 0.5); }

  const build = (P) => {                        // cos/sin of 2 pi p_a . x at every sample
    const pts = diskPoints(r0, P, o.seed);
    const stride = [], C = [], S = [];
    let tot = 0;
    for (const s of snaps) { stride.push(tot); tot += s.n; }
    const CA = new Float32Array(tot * P), SA = new Float32Array(tot * P);
    for (let ti = 0; ti < T; ti++) {
      const s = snaps[ti];
      for (let a = 0; a < s.n; a++) {
        const base = (stride[ti] + a) * P, pu = s.p[a][0], pv = s.p[a][1];
        for (let q = 0; q < P; q++) {
          const th = 2 * Math.PI * (pu * pts[2 * q] + pv * pts[2 * q + 1]);
          CA[base + q] = Math.cos(th); SA[base + q] = Math.sin(th);
        }
      }
    }
    return { CA, SA, stride, P, pts };
  };

  const G = new Float64Array(NV);               // gradient buffers
  const Gq = new Float64Array(NV);
  const hbuf = { arr: null };

  function hAll(K) {                            // h(x) at every sample of kernel set K
    const { CA, SA, stride, P } = K;
    const h = hbuf.arr && hbuf.arr.length === P ? hbuf.arr : (hbuf.arr = new Float64Array(P));
    h.fill(0);
    for (let ti = 0; ti < T; ti++) {
      const s = snaps[ti], o0 = off[ti];
      for (let j = 0; j < r; j++) {
        for (let q = 0; q < P; q++) {
          let re = 0, im = 0;
          for (let a = 0; a < s.n; a++) {
            const c = CA[(stride[ti] + a) * P + q], sn = SA[(stride[ti] + a) * P + q];
            const pa = Pv[o0 + a * r + j], qa = Qv[o0 + a * r + j];
            re += pa * c - qa * sn;
            im -= pa * sn + qa * c;
          }
          h[q] += re * re + im * im;
        }
      }
    }
    return h;
  }

  function cost() {                             // F tr Q + 2 SUM A_ab |Q_ab|
    let g = 0;
    for (let ti = 0; ti < T; ti++) {
      const s = snaps[ti], o0 = off[ti];
      let tr = 0;
      for (let a = 0; a < s.n; a++) for (let j = 0; j < r; j++) { const p = Pv[o0 + a * r + j], q = Qv[o0 + a * r + j]; tr += p * p + q * q; }
      g += o.F * tr;
      for (const pr of s.pairs) {
        let Rab = 0, Iab = 0;
        for (let j = 0; j < r; j++) {
          const pa = Pv[o0 + pr.a * r + j], qa = Qv[o0 + pr.a * r + j];
          const pb = Pv[o0 + pr.b * r + j], qb = Qv[o0 + pr.b * r + j];
          Rab += pa * pb + qa * qb; Iab += qa * pb - pa * qb;
        }
        g += 2 * pr.A * Math.hypot(Rab, Iab);
      }
    }
    return g;
  }

  function grad(K, tau) {                       // d/dV of [ log cost - log softmin h ]
    const { CA, SA, stride, P } = K;
    const h = hAll(K);
    let mn = Infinity; for (let q = 0; q < P; q++) if (h[q] < mn) mn = h[q];
    let Z = 0; const w = new Float64Array(P);
    for (let q = 0; q < P; q++) { const e = Math.exp(-(h[q] - mn) / tau); w[q] = e; Z += e; }
    let msoft = 0; for (let q = 0; q < P; q++) { w[q] /= Z; msoft += w[q] * h[q]; }
    G.fill(0); Gq.fill(0);
    /* d(softmin)/dV, weighted */
    for (let ti = 0; ti < T; ti++) {
      const s = snaps[ti], o0 = off[ti];
      for (let j = 0; j < r; j++) {
        for (let q = 0; q < P; q++) {
          const wq = w[q]; if (wq < 1e-12) continue;
          let re = 0, im = 0;
          for (let a = 0; a < s.n; a++) {
            const c = CA[(stride[ti] + a) * P + q], sn = SA[(stride[ti] + a) * P + q];
            const pa = Pv[o0 + a * r + j], qa = Qv[o0 + a * r + j];
            re += pa * c - qa * sn; im -= pa * sn + qa * c;
          }
          for (let a = 0; a < s.n; a++) {
            const c = CA[(stride[ti] + a) * P + q], sn = SA[(stride[ti] + a) * P + q];
            G[o0 + a * r + j] += -wq * 2 * (re * c - im * sn) / msoft;
            Gq[o0 + a * r + j] += -wq * -2 * (re * sn + im * c) / msoft;
          }
        }
      }
    }
    /* d(cost)/dV */
    const g0 = cost();
    for (let ti = 0; ti < T; ti++) {
      const s = snaps[ti], o0 = off[ti];
      for (let a = 0; a < s.n; a++) for (let j = 0; j < r; j++) {
        G[o0 + a * r + j] += o.F * 2 * Pv[o0 + a * r + j] / g0;
        Gq[o0 + a * r + j] += o.F * 2 * Qv[o0 + a * r + j] / g0;
      }
      for (const pr of s.pairs) {
        let Rab = 0, Iab = 0;
        for (let j = 0; j < r; j++) {
          const pa = Pv[o0 + pr.a * r + j], qa = Qv[o0 + pr.a * r + j];
          const pb = Pv[o0 + pr.b * r + j], qb = Qv[o0 + pr.b * r + j];
          Rab += pa * pb + qa * qb; Iab += qa * pb - pa * qb;
        }
        const nrm = Math.hypot(Rab, Iab) + 1e-14, cf = 2 * pr.A / (nrm * g0);
        for (let j = 0; j < r; j++) {
          const pa = Pv[o0 + pr.a * r + j], qa = Qv[o0 + pr.a * r + j];
          const pb = Pv[o0 + pr.b * r + j], qb = Qv[o0 + pr.b * r + j];
          G[o0 + pr.a * r + j] += cf * (Rab * pb - Iab * qb);
          Gq[o0 + pr.a * r + j] += cf * (Rab * qb + Iab * pb);
          G[o0 + pr.b * r + j] += cf * (Rab * pa + Iab * qa);
          Gq[o0 + pr.b * r + j] += cf * (Rab * qa - Iab * pa);
        }
      }
    }
    return { mn, msoft, g0 };
  }

  const K = build(o.P);
  const evalR = (KK) => { const h = hAll(KK); let mn = Infinity; for (let q = 0; q < h.length; q++) if (h[q] < mn) mn = h[q]; return { R: cost() / mn, mn, g: cost() }; };
  let cur = evalR(K), step = 0.08;
  if (log) console.log(`    init  ceiling ${cur.R.toFixed(5)}   (cost ${cur.g.toFixed(4)}, min_disk h ${cur.mn.toFixed(4)})`);
  const bP = Float64Array.from(Pv), bQ = Float64Array.from(Qv);
  let best = cur.R;
  for (let it = 0; it < o.iters; it++) {
    const h = hAll(K);
    let mn = Infinity, mx = -Infinity;
    for (let q = 0; q < h.length; q++) { if (h[q] < mn) mn = h[q]; if (h[q] > mx) mx = h[q]; }
    const tau = Math.max(1e-9, 0.03 * (mx - mn) * Math.pow(0.05, it / o.iters));
    grad(K, tau);
    let gn = 0; for (let i = 0; i < NV; i++) gn += G[i] * G[i] + Gq[i] * Gq[i];
    gn = Math.sqrt(gn); if (gn < 1e-14) break;
    const sP = Float64Array.from(Pv), sQ = Float64Array.from(Qv);
    let ok = false;
    for (let ls = 0; ls < 12; ls++) {
      for (let i = 0; i < NV; i++) { Pv[i] = sP[i] - step * G[i] / gn; Qv[i] = sQ[i] - step * Gq[i] / gn; }
      const e = evalR(K);
      if (e.mn > 0 && e.R < cur.R) { cur = e; ok = true; break; }
      step *= 0.5;
    }
    if (!ok) { Pv.set(sP); Qv.set(sQ); step *= 0.5; if (step < 1e-9) break; }
    else step *= 1.25;
    if (cur.R < best) { best = cur.R; bP.set(Pv); bQ.set(Qv); }
    if (log && (it % 250 === 249 || it === o.iters - 1)) console.log(`    it ${String(it + 1).padStart(5)}  ceiling ${cur.R.toFixed(5)}  best ${best.toFixed(5)}  step ${step.toExponential(1)}`);
  }
  Pv.set(bP); Qv.set(bQ);
  /* honest final: re-check the minimum on a much finer sample of the disk, and
     add a Lipschitz margin for what lies between the samples */
  const KF = build(o.Pfine);
  const hf = hAll(KF);
  let mnF = Infinity; for (let q = 0; q < hf.length; q++) if (hf[q] < mnF) mnF = hf[q];
  let Lp = 0;                                   // |grad h| <= 4 pi SUM |Q_ab| |u_ab| + ... bounded crudely
  for (let ti = 0; ti < T; ti++) {
    const s = snaps[ti], o0 = off[ti];
    for (const pr of s.pairs) {
      let Rab = 0, Iab = 0;
      for (let j = 0; j < r; j++) {
        const pa = Pv[o0 + pr.a * r + j], qa = Qv[o0 + pr.a * r + j];
        const pb = Pv[o0 + pr.b * r + j], qb = Qv[o0 + pr.b * r + j];
        Rab += pa * pb + qa * qb; Iab += qa * pb - pa * qb;
      }
      const du = s.p[pr.a][0] - s.p[pr.b][0], dv = s.p[pr.a][1] - s.p[pr.b][1];
      Lp += 4 * Math.PI * Math.hypot(Rab, Iab) * Math.hypot(du, dv);
    }
  }
  const spacing = 2 * (r0 * UAS) / Math.sqrt(o.Pfine);      // sunflower nearest-neighbour scale
  const margin = Lp * spacing;
  const mSafe = mnF - margin;
  const g = cost();
  return { ceiling: mSafe > 0 ? g / mSafe : Infinity, ceilingGrid: g / mnF, cost: g, minFine: mnF, margin, Lp, T, NV,
    lambda: (() => { let tr = 0; for (let ti = 0; ti < T; ti++) { const s = snaps[ti], o0 = off[ti]; for (let a = 0; a < s.n; a++) for (let j = 0; j < r; j++) { tr += Pv[o0 + a * r + j] ** 2 + Qv[o0 + a * r + j] ** 2; } } return tr; })() };
}

module.exports = { opts, snapshots, sosCeiling, diskPoints };

if (require.main === module) {
  const cmd = process.argv[2] || 'disk';
  const r0 = +process.argv[3] || 12;
  const o = opts(process.argv.slice(4));
  const file = V.loadFile(o.day, o.band, o.pipe);
  const kept = file.rows.filter(r => Math.hypot(r.u, r.v) >= o.bcut * 1e9);
  const times = [...new Set(kept.map(r => r.t.toFixed(6)))].sort();
  const keepT = new Set(times.filter((_, i) => i % o.sub === 0));
  const rows = kept.filter(r => keepT.has(r.t.toFixed(6)));
  const snaps = snapshots(rows, o);
  const nst = snaps.reduce((s, x) => s + x.n, 0), npr = snaps.reduce((s, x) => s + x.pairs.length, 0);
  console.log(`data  ${V.DAYS[o.day]} ${o.band} ${o.pipe}  ${rows.length} rows -> ${snaps.length} usable snapshots, ${nst} station-slots, ${npr} baselines in complete cliques`);
  console.log(`      clique sizes: ${[...new Set(snaps.map(s => s.n))].sort().map(n => n + '×' + snaps.filter(s => s.n === n).length).join(' ')}`);
  console.log(`      F <= ${o.F} Jy, A_k = |V| + ${o.nsig}σ + ${(100 * o.gain).toFixed(0)}%, disk r <= ${r0} µas, rank ${o.rank}`);
  const t0 = Date.now();
  const res = sosCeiling(snaps, r0, o);
  console.log(`\nSOS CEILING  r <= ${r0} µas :  ${res.ceiling.toFixed(5)} Jy`);
  console.log(`  (grid ${res.ceilingGrid.toFixed(5)}, Lipschitz margin costs ${(res.ceiling - res.ceilingGrid).toFixed(5)};  cost ${res.cost.toFixed(4)}, min_disk h ${res.minFine.toFixed(4)}, lambda ${res.lambda.toFixed(4)})`);
  console.log(`  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
