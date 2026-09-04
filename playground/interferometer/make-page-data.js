/* make-page-data.js — the pipeline half of the visualisation.  MIT.

   ONE RULE, borrowed from find-the-planet: the pipeline does the science, the
   browser only draws.  Everything here is computed in node and frozen into a
   JSON; the page renders it and never re-derives it.

   WHAT IT PRODUCES.  Not an image of M87 — an ENSEMBLE of images, every one of
   which the data allow, so that the page can draw what they agree on as ink and
   what they disagree on as texture.  Two families:

     A.  amplitude-only.  Skies whose visibility amplitudes stay under the
         measured ones (+ noise + gain).  This family knows nothing about
         position: the constraint is invariant under translating the sky.
     B.  amplitudes + closure phases.  A closure phase is the sum of three
         visibility phases around a triangle of stations, in which every
         station's unknown phase cancels — the only phase information in these
         files that survives calibration.  Members are fitted to it with a
         weight, so the page can slide the phase information in and out and
         watch the picture go from a fog to a ring.

   node make-page-data.js  ->  out/page-data.json                             */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vis.js');
const L = require('./lab-vis.js');

const o = L.opts(process.argv.slice(2));
o.day = 111; o.band = 'b3'; o.pipe = 'hops'; o.bcut = 0.4; o.fov = 64; o.F = 2.0;
o.nsig = 3; o.gain = 0.05; o.N = 64; o.Nf = 512; o.rounds = 2; o.iters = 700;
/* FIELD OF VIEW.  The shortest baseline that survives the cut is 1.35 Glambda,
   so nothing larger than about 150 uas is constrained at all — and a fit given a
   128 uas box will happily park most of its flux in a broad pedestal the array
   cannot see, which then dominates every render.  An 80 uas field still holds a
   43 uas ring with room around it and leaves the fit nowhere to hide. */
o.fov = 40;
const SUB = 8;                          // keep every 8th TIMESTAMP, with all its baselines
const RADII = [6, 12, 20, 28];
const N = o.N, M = N * N;

const file = V.loadFile(o.day, o.band, o.pipe);
const kept = file.rows.filter(r => Math.hypot(r.u, r.v) >= o.bcut * 1e9);
/* Whole snapshots, not every-Nth row: decimating rows destroys the simultaneous
   triangles, and the triangles are the only gain-independent information there
   is. */
const times = [...new Set(kept.map(r => r.t.toFixed(6)))].sort();
const keepT = new Set(times.filter((_, i) => i % SUB === 0));
const rows = kept.filter(r => keepT.has(r.t.toFixed(6)));
const K = rows.length;
const stations = V.stations(rows);
console.log(`page set: ${file.rows.length} rows -> ${kept.length} above ${o.bcut} Gl -> ${K} from ${keepT.size} of ${times.length} snapshots`);

const ds = { rows, rowsFull: rows, fovRad: o.fov * V.UAS, Fhi: o.F, K, Kfull: K, o,
  amp: rows.map(r => r.amp + o.nsig * r.sigma + o.gain * r.amp),
  ampFull: rows.map(r => r.amp + o.nsig * r.sigma + o.gain * r.amp),
  eps: rows.map(r => o.nsig * r.sigma) };
const A = Float64Array.from(ds.amp);

/* ---- the sky grid and its kernels, built once ---- */
const R = o.fov * V.UAS;
const co = new Float64Array(N);
for (let i = 0; i < N; i++) co[i] = -R + (2 * R * i) / (N - 1);
const C = new Float32Array(M * K), S = new Float32Array(M * K);
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const base = (j * N + i) * K;
  for (let k = 0; k < K; k++) {
    const th = 2 * Math.PI * (rows[k].u * co[i] + rows[k].v * co[j]);
    C[base + k] = Math.cos(th); S[base + k] = Math.sin(th);
  }
}
const Re = new Float64Array(K), Im = new Float64Array(K);
const forward = (w) => { Re.fill(0); Im.fill(0); for (let i = 0; i < M; i++) { const wi = w[i]; if (wi <= 0) continue; const b = i * K; for (let k = 0; k < K; k++) { Re[k] += wi * C[b + k]; Im[k] -= wi * S[b + k]; } } };
const worstAmp = (mask) => { let z = 0; for (let k = 0; k < K; k++) { if (mask && !mask[k]) continue; z = Math.max(z, Math.hypot(Re[k], Im[k]) / A[k]); } return z; };

/* ---- closure triangles ---- */
const tri = { a: [], b: [], c: [], ca: [], cb: [], cc: [], psi: [], sig: [] };
{
  const byT = new Map();
  rows.forEach((r, i) => { const k = r.t.toFixed(6); if (!byT.has(k)) byT.set(k, []); byT.get(k).push(i); });
  const ang = i => Math.atan2(rows[i].im, rows[i].re);
  for (const [, idx] of byT) {
    const st = new Map();
    for (const i of idx) st.set(rows[i].t1 + '|' + rows[i].t2, i);
    const names = [...new Set(idx.flatMap(i => [rows[i].t1, rows[i].t2]))].sort();
    const find = (x, y) => st.has(x + '|' + y) ? { i: st.get(x + '|' + y), conj: 0 } : (st.has(y + '|' + x) ? { i: st.get(y + '|' + x), conj: 1 } : null);
    for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) for (let c = b + 1; c < names.length; c++) {
      const AB = find(names[a], names[b]), BC = find(names[b], names[c]), CA = find(names[c], names[a]);
      if (!AB || !BC || !CA) continue;
      const sg = t => (t.conj ? -1 : 1);
      const psi = sg(AB) * ang(AB.i) + sg(BC) * ang(BC.i) + sg(CA) * ang(CA.i);
      const sp = t => rows[t.i].sigma / Math.max(rows[t.i].amp, 1e-6);
      tri.a.push(AB.i); tri.b.push(BC.i); tri.c.push(CA.i);
      tri.ca.push(AB.conj); tri.cb.push(BC.conj); tri.cc.push(CA.conj);
      tri.psi.push(+Math.atan2(Math.sin(psi), Math.cos(psi)).toFixed(6));
      tri.sig.push(+Math.min(Math.hypot(sp(AB), sp(BC), sp(CA)), 1.5).toFixed(6));
    }
  }
}
const T = tri.a.length;
console.log(`closure triangles: ${T}`);

const closureChi = (mask) => {
  let s = 0, n = 0;
  for (let x = 0; x < T; x++) {
    const i = tri.a[x], j = tri.b[x], k = tri.c[x];
    if (mask && !(mask[i] && mask[j] && mask[k])) continue;
    const ph = (q, cj) => { const a = Math.atan2(Im[q], Re[q]); return cj ? -a : a; };
    let d = ph(i, tri.ca[x]) + ph(j, tri.cb[x]) + ph(k, tri.cc[x]) - tri.psi[x];
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const z = d / tri.sig[x]; s += z * z; n++;
  }
  return n ? s / n : NaN;
};

/* ---- one ensemble member ----------------------------------------------------
   THE MISTAKE THIS REPLACES.  The first ensemble was fitted against the
   amplitude CEILINGS only — |V| <= A_k — and drifted to smooth central blobs,
   because an over-resolved sky satisfies every upper bound trivially.  Nothing
   was asking it to reproduce the measured amplitudes, and the ring lives in
   exactly that: the deep null near 3.5 Glambda is what sets the diameter.  So a
   member is fitted TWO-SIDED,

       amp * chi2_amp(w)  +  phase * chi2_closure(w)  +  smooth * ||grad w||^2 ,

   over w >= 0.  The two-sided amplitude term is not convex and can never be part
   of the certified ceiling — that stays one-sided, and stays a theorem.  Here it
   is the right thing: the ensemble is a set of skies the data are consistent
   with, and consistency means matching the amplitudes, not hiding under them.

   The arc this produces is the honest one.  With the phases off, the amplitudes
   alone fix the ring's SIZE and leave its bright side undetermined; the members
   scatter their asymmetry around the annulus, and the render draws that scatter
   as texture.  Sliding the closure phases in picks a side.                    */
function member({ phase, smooth, l1, seed, drop, ampW }) {
  const mask = new Uint8Array(K);
  for (let k = 0; k < K; k++) mask[k] = (drop === null || (rows[k].t1 !== drop && rows[k].t2 !== drop)) ? 1 : 0;
  let nmask = 0; for (let k = 0; k < K; k++) nmask += mask[k];
  let rnd = seed * 9301 + 49297;
  const rand = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  const w = new Float64Array(M);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const l = co[i] / V.UAS, m = co[j] / V.UAS, r = Math.hypot(l, m);
    w[j * N + i] = Math.exp(-Math.pow(r / 30, 2)) * (0.3 + 1.4 * rand());
  }
  /* SCALE FIRST.  The old closure-only objective was scale-invariant, so the
     initial brightness never mattered and the seed sky was left a thousand
     times too bright.  A two-sided amplitude term sees that immediately, and a
     descent whose step is a fixed number of janskys per pixel cannot walk back
     three orders of magnitude — it just reports chi2 = 1e5 and looks like a
     modelling failure.  Fix the global scale analytically before descending. */
  {
    let t0 = 0; for (const x of w) t0 += x;
    for (let i = 0; i < M; i++) w[i] *= 0.5 / t0;
    let bestA = 1, bestC = Infinity;
    for (let e = -1.2; e <= 1.2; e += 0.05) {
      const a = Math.pow(10, e);
      for (let i = 0; i < M; i++) w[i] *= a;
      forward(w);
      let s2 = 0, n2 = 0;
      for (let k = 0; k < K; k++) { if (!mask[k]) continue; const d = (Math.hypot(Re[k], Im[k]) - rows[k].amp) / Math.max(rows[k].sigma, 0.02 * rows[k].amp); s2 += d * d; n2++; }
      if (s2 / n2 < bestC) { bestC = s2 / n2; bestA = a; }
      for (let i = 0; i < M; i++) w[i] /= a;
    }
    for (let i = 0; i < M; i++) w[i] *= bestA;
  }
  const amp0 = rows.map(r => r.amp), sg0 = rows.map(r => Math.max(r.sigma, 0.02 * r.amp));
  const gk = new Float64Array(K), gkr = new Float64Array(K), gki = new Float64Array(K), gr = new Float64Array(M);

  const chiAmp = () => { let s = 0, n = 0; for (let k = 0; k < K; k++) { if (!mask[k]) continue; const d = (Math.hypot(Re[k], Im[k]) - amp0[k]) / sg0[k]; s += d * d; n++; } return n ? s / n : 0; };
  const objective = () => {
    forward(w);
    let sm = 0;
    if (smooth) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = w[j * N + i];
      if (i + 1 < N) { const d = w[j * N + i + 1] - a; sm += d * d; }
      if (j + 1 < N) { const d = w[(j + 1) * N + i] - a; sm += d * d; }
    }
    let tt = 0; if (l1) for (let i = 0; i < M; i++) tt += w[i];
    return ampW * chiAmp() + (phase ? phase * closureChi(mask) : 0) + smooth * sm + l1 * tt;
  };
  let mw = 0; for (const x of w) mw += x; mw /= M;
  let step = 0.35 * mw, cur = objective();
  for (let it = 0; it < 1200; it++) {
    forward(w);
    gkr.fill(0); gki.fill(0);
    // two-sided amplitude term
    for (let k = 0; k < K; k++) {
      if (!mask[k]) continue;
      const mag = Math.hypot(Re[k], Im[k]) + 1e-12;
      const c0 = ampW * (2 / nmask) * (mag - amp0[k]) / (sg0[k] * sg0[k]) / mag;
      gkr[k] += c0 * Re[k]; gki[k] += c0 * Im[k];
    }
    // closure term
    if (phase) {
      gk.fill(0);
      for (let x = 0; x < T; x++) {
        const i = tri.a[x], j = tri.b[x], k = tri.c[x];
        if (!(mask[i] && mask[j] && mask[k])) continue;
        const ph = (q, cj) => { const a = Math.atan2(Im[q], Re[q]); return cj ? -a : a; };
        let d = ph(i, tri.ca[x]) + ph(j, tri.cb[x]) + ph(k, tri.cc[x]) - tri.psi[x];
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const c0 = phase * (2 / T) * d / (tri.sig[x] * tri.sig[x]);
        gk[i] += tri.ca[x] ? -c0 : c0; gk[j] += tri.cb[x] ? -c0 : c0; gk[k] += tri.cc[x] ? -c0 : c0;
      }
      for (let k = 0; k < K; k++) {
        const g = gk[k]; if (g === 0) continue;
        const n2 = Re[k] * Re[k] + Im[k] * Im[k] + 1e-18;
        gkr[k] += g * (-Im[k] / n2); gki[k] += g * (Re[k] / n2);
      }
    }
    // chain through dRe/dw = C, dIm/dw = -S
    gr.fill(0);
    for (let i = 0; i < M; i++) {
      const b = i * K; let acc = 0;
      for (let k = 0; k < K; k++) { const a = gkr[k], c = gki[k]; if (a === 0 && c === 0) continue; acc += a * C[b + k] - c * S[b + k]; }
      gr[i] = acc;
    }
    if (smooth) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const p = j * N + i; let lap = 0;
      if (i > 0) lap += w[p] - w[p - 1];
      if (i + 1 < N) lap += w[p] - w[p + 1];
      if (j > 0) lap += w[p] - w[p - N];
      if (j + 1 < N) lap += w[p] - w[p + N];
      gr[p] += 2 * smooth * lap;
    }
    if (l1) for (let i = 0; i < M; i++) gr[i] += l1;      // sparsity: the pedestal has to earn its place
    let gm = 0; for (let i = 0; i < M; i++) gm = Math.max(gm, Math.abs(gr[i]));
    if (gm === 0) break;
    const prev = Float64Array.from(w), sc = step / gm;
    for (let i = 0; i < M; i++) { w[i] -= sc * gr[i]; if (w[i] < 0) w[i] = 0; }
    const nx = objective();
    if (nx > cur) { w.set(prev); step *= 0.55; if (step < 1e-11) break; } else { cur = nx; step *= 1.09; }
  }
  forward(w);
  let tot = 0; for (const x of w) tot += x;
  /* DO NOT scale an ensemble member to the one-sided ceiling.  The ceilings are
     A_k = |V_k| + 3 sigma + gain, and near a null |V_k| is tiny, so a fitted sky
     that misses one null by a little has |V|/A of 2 or 3 THERE — and dividing the
     whole sky by that number to force it under the ceiling makes every other
     baseline 2.5x too faint.  Measured: it turned a chi2 = 5.9 amplitude fit into
     a 95.6 one, and turned the ring into a blob.  The two families mean different
     things and must be built differently: ENSEMBLE members fit the amplitudes
     two-sided, CEILING witnesses satisfy the one-sided bound.  Report the ratio,
     never impose it. */
  return { w, chi2: closureChi(null), chiAmp: chiAmp(), total: tot, worst: worstAmp(null) };
}

const q8 = (arr) => {
  let hi = 0; for (const v of arr) if (v > hi) hi = v;
  const b = Buffer.alloc(arr.length);
  for (let i = 0; i < arr.length; i++) b[i] = Math.max(0, Math.min(255, Math.round(255 * arr[i] / (hi || 1))));
  return { peak: hi, b64: b.toString('base64') };
};

const out = {
  meta: { src: 'EHT public release 2024-D01-01 (M87, April 2018), calibrated Stokes I',
    date: V.DAYS[o.day], band: o.band, pipe: o.pipe, freqGHz: file.freqGHz,
    rowsRaw: file.rows.length, rowsKept: kept.length, K, snapshots: keepT.size, sub: SUB,
    bcut: o.bcut, fov: o.fov, N, nsig: o.nsig, gain: o.gain, F: o.F,
    stations, baselines: V.baselines(rows).length, triangles: T,
    uvMax: V.uvMax(rows), uvMin: V.uvMin(rows), ringDiamUas: 43.3 },
  vis: { u: [], v: [], re: [], im: [], amp: [], sig: [], A: [], s1: [], s2: [] },
  members: [], ceiling: [], profileFull: null,
};
for (let k = 0; k < K; k++) {
  const r = rows[k];
  out.vis.u.push(+r.u.toFixed(1)); out.vis.v.push(+r.v.toFixed(1));
  out.vis.re.push(+r.re.toFixed(6)); out.vis.im.push(+r.im.toFixed(6));
  out.vis.amp.push(+r.amp.toFixed(6)); out.vis.sig.push(+r.sigma.toFixed(6));
  out.vis.A.push(+A[k].toFixed(6));
  out.vis.s1.push(stations.indexOf(r.t1)); out.vis.s2.push(stations.indexOf(r.t2));
}

/* ---- the ensemble ---- */
const PHASES = [0, 0.15, 1];              // none / partial / full use of the closure phases
const SEEDS = [1, 2, 3, 4, 5, 6];
let done = 0;
for (const phase of PHASES) for (const seed of SEEDS) {
  const drop = (seed % 3 === 0) ? stations[seed % stations.length] : null;   // some members drop a telescope
  const smooth = seed % 2 ? 1.5e-4 : 6e-5;
  const l1 = [0.4, 1.2, 3.5][seed % 3];        // three priors, deliberately different: the spread across them IS the ambiguity
  const t0 = Date.now();
  const m = member({ phase, smooth, l1, seed, drop, ampW: 1 });
  out.members.push(Object.assign({ phase, seed, smooth, l1, drop, chi2: m.chi2, chiAmp: m.chiAmp, total: m.total, worst: m.worst }, q8(m.w)));
  done++;
  console.log(`  member ${String(done).padStart(2)}/${PHASES.length * SEEDS.length}  phase ${phase}  l1 ${l1}  drop ${drop || '—'}  amp chi2 ${m.chiAmp.toFixed(2)}  closure chi2 ${m.chi2.toFixed(1)}  ${m.total.toFixed(3)} Jy  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

/* ---- the amplitude-only extremes: the brightest centre the data still allow ---- */
for (const r0 of RADII) {
  const pr = L.primalWitness(ds, 'disk', { r0 }, o, false);
  o.plow = pr.value;
  const du = L.dualBound(ds, 'disk', { r0 }, o, false);
  forward(pr.w);
  let tot = 0; for (const v of pr.w) tot += v;
  out.ceiling.push(Object.assign({ r0, value: pr.value, upper: du.bound, total: tot, chi2: closureChi(null) }, q8(pr.w)));
  console.log(`  extreme r<=${String(r0).padStart(2)}  ${pr.value.toFixed(4)} Jy inside, ceiling ${du.bound.toFixed(4)}, closure chi2 ${closureChi(null).toFixed(1)}`);
}

out.tri = { n: T };            // the page scores nothing, so it needs the count, not the table
const pf = path.join(__dirname, 'out', 'profile.json');
if (fs.existsSync(pf)) out.profileFull = JSON.parse(fs.readFileSync(pf, 'utf8'));
fs.writeFileSync(path.join(__dirname, 'out', 'page-data.json'), JSON.stringify(out));
console.log(`written out/page-data.json  ${(fs.statSync(path.join(__dirname, 'out', 'page-data.json')).size / 1024).toFixed(0)} KB  ${out.members.length} members + ${out.ceiling.length} extremes`);
