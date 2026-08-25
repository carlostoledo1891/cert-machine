/* fibers.js — certified preimage counting for polynomial maps, and with it
   collision DISCOVERY: non-injectivity found blind, not transcribed.

   keller.js decides claims that arrive with witnesses. This instrument makes
   its own: given a polynomial map F: R^n -> R^n (exact rational
   coefficients) and a rational target w, it

     1. hunts preimages with float multistart Newton — the float layer, which
        proves nothing and is allowed to miss and to hallucinate;
     2. certifies each candidate with the Krawczyk operator (strict interior
        containment — existence AND local uniqueness in an explicit box);
     3. dedups by certified box disjointness: boxes that provably do not
        intersect hold provably distinct preimages.

   The output "F has AT LEAST k preimages of w, each in a certified box" is a
   theorem; k >= 2 is a certificate of non-injectivity that owes nothing to
   anyone's published witnesses. It is a LOWER bound by construction — the
   float layer reaches what it reaches — which is exactly the honest shape:
   more preimages can exist, fewer cannot.

   Interval evaluation: every rational coefficient is enclosed by its nearest
   double widened one ulp each way, monomials by IV.pow — outward-rounded
   throughout, so the Krawczyk certificate stands on the exact map, not on a
   float approximation of it.

   MIT licensed. Part of cert-machine. */
'use strict';

const K = require('#instruments/keller/keller.js');
const Q = require('#instruments/interval/rational.js');
const IV = require('#instruments/interval/interval.js');
const { krawczyk } = require('#instruments/interval/radii.js');

/* a rational, enclosed: nearest double widened one ulp each way */
function qIV(c) {
  const d = Q.toDouble(c);
  return [IV.nextDown(d), IV.nextUp(d)];
}

/* interval evaluation of a Q-polynomial over an interval box */
function pevalIV(p, X) {
  let s = IV.iv(0);
  for (const [k, v] of p) {
    let t = qIV(v);
    const e = k.split(',').map(Number);
    for (let i = 0; i < e.length; i++) if (e[i]) t = IV.mul(t, IV.pow(X[i], e[i]));
    s = IV.add(s, t);
  }
  return s;
}

/* DAMPED Newton. Undamped Newton on degree-7 components diverges from almost
   every distant start — the first version found ZERO of Alpöge's three
   preimages from 120 starts while Krawczyk certified happily at the known
   root. Halving the step until the residual norm actually falls turns the
   same starts into reliable hunters. The float layer stays a hunter only:
   nothing it returns is believed until Krawczyk certifies it. */
function newtonF(Fp, Jp, v0, iters) {
  const n = v0.length;
  let v = v0.slice();
  let rn = Math.hypot.apply(null, Fp.map(p => K.pevalFloat(p, v)));
  for (let it = 0; it < (iters || 120); it++) {
    const r = Fp.map(p => K.pevalFloat(p, v));
    const J = Jp.map(row => row.map(p => K.pevalFloat(p, v)));
    const A = J.map((row, i) => row.concat([r[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let rr = c + 1; rr < n; rr++) if (Math.abs(A[rr][c]) > Math.abs(A[piv][c])) piv = rr;
      if (Math.abs(A[piv][c]) < 1e-14) return null;
      if (piv !== c) { const t = A[piv]; A[piv] = A[c]; A[c] = t; }
      for (let rr = 0; rr < n; rr++) {
        if (rr === c) continue;
        const f = A[rr][c] / A[c][c];
        if (f === 0) continue;
        for (let j = c; j <= n; j++) A[rr][j] -= f * A[c][j];
      }
    }
    const step = new Array(n);
    let mx = 0;
    for (let i = 0; i < n; i++) { step[i] = A[i][n] / A[i][i]; mx = Math.max(mx, Math.abs(step[i])); }
    if (!step.every(Number.isFinite)) return null;
    let lam = 1, accepted = false;
    for (let h = 0; h < 30; h++) {
      const cand = v.map((x, i) => x - lam * step[i]);
      const cn = Math.hypot.apply(null, Fp.map(p => K.pevalFloat(p, cand)));
      if (isFinite(cn) && cn < rn) { v = cand; rn = cn; accepted = true; break; }
      lam /= 2;
    }
    if (!accepted) return v;                    /* stalled — let the residual gate decide */
    if (mx * lam < 1e-13 || rn < 1e-14) return v;
  }
  return v.every(Number.isFinite) ? v : null;
}

const disjointBox = (A, B) => A.some((a, i) => a[1] < B[i][0] || a[0] > B[i][1]);

/* certifiedFiber(F, w, opts) — F: array of n Q-polynomials in n vars,
   w: array of n rationals. Returns { preimages, boxes, tried, certified } —
   every box holds exactly one preimage of w, and the boxes are pairwise
   disjoint, so `preimages` distinct preimages provably exist. */
function certifiedFiber(F, w, opts) {
  opts = opts || {};
  const n = F.length;
  const starts = opts.starts || 400;
  const L = opts.L || 4;
  /* G = F - w, exactly */
  const G = F.map((p, i) => {
    const out = new Map(p);
    const k0 = new Array(n).fill(0).join(',');
    const cur = out.get(k0) || Q.ZERO;
    const nv = Q.sub(cur, w[i]);
    if (Q.isZero(nv)) out.delete(k0); else out.set(k0, nv);
    return out;
  });
  const Jp = K.jacobian(G, n);
  const Fiv = (X) => G.map(p => pevalIV(p, X));
  const DFiv = (X) => Jp.map(row => row.map(p => pevalIV(p, X)));

  const boxes = [];
  const g = 0.6180339887498949;
  let certifiedCalls = 0;
  /* a SCALE LADDER, not one box: preimages of these maps sit anywhere from
     |x| ~ 1e-1 to |z| ~ 2e2 (the d=5 sweep's witnesses have z ~ 195, and a
     single L=4 box certified zero of them). Starts cycle through
     geometrically spaced radii so every decade gets its share of the hunt. */
  const LS = [L / 4, L, 4 * L, 16 * L, 64 * L, 256 * L];
  for (let s = 0; s < starts; s++) {
    const Ls = LS[s % LS.length];
    const v0 = new Array(n);
    for (let i = 0; i < n; i++) v0[i] = -Ls + 2 * Ls * (((s + 1) * g * (i + 1)) % 1);
    const v = newtonF(G, Jp, v0, 80);
    if (!v) continue;
    const res = Math.max.apply(null, G.map(p => Math.abs(K.pevalFloat(p, v))));
    if (res > 1e-9) continue;
    /* skip candidates provably inside an existing certified box */
    if (boxes.some(b => v.every((x, i) => b.box[i][0] <= x && x <= b.box[i][1]))) continue;
    /* certify: Krawczyk with a float-inverse preconditioner at v */
    const Jf = Jp.map(row => row.map(p => K.pevalFloat(p, v)));
    const A = (() => {           /* Gauss-Jordan inverse */
      const m = Jf.length;
      const M = Jf.map((row, i) => row.concat(Array.from({ length: m }, (_, j) => (i === j ? 1 : 0))));
      for (let c = 0; c < m; c++) {
        let piv = c;
        for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
        if (Math.abs(M[piv][c]) < 1e-14) return null;
        if (piv !== c) { const t = M[piv]; M[piv] = M[c]; M[c] = t; }
        const dd = M[c][c];
        for (let j = 0; j < 2 * m; j++) M[c][j] /= dd;
        for (let r = 0; r < m; r++) {
          if (r === c) continue;
          const f = M[r][c];
          if (f === 0) continue;
          for (let j = 0; j < 2 * m; j++) M[r][j] -= f * M[c][j];
        }
      }
      return M.map(row => row.slice(m));
    })();
    if (!A) continue;
    certifiedCalls++;
    let kr;
    try { kr = krawczyk(Fiv, DFiv, v, A, { maxRounds: 24 }); } catch (e) { continue; }
    if (!kr || !kr.ok) continue;
    /* dedup against certified boxes: overlap without containment -> drop the
       candidate (conservative: never count what is not proved distinct) */
    if (boxes.some(b => !disjointBox(kr.box, b.box))) continue;
    boxes.push({ center: v.slice(), box: kr.box.map(x => [x[0], x[1]]), maxRad: kr.maxRad });
  }
  return {
    preimages: boxes.length,
    boxes,
    starts,
    note: 'a LOWER bound: each box certified by Krawczyk strict interior containment on the exact map; boxes pairwise disjoint, so the preimages are provably distinct'
  };
}

module.exports = { certifiedFiber, pevalIV, qIV };
