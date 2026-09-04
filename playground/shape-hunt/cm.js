/* cm.js — the exact obstruction. Not "84% violate an inequality": a certificate
   of impossibility, in integers, that a reader can check by hand.

   THE UPGRADE OVER PTOLEMY. Ptolemy's inequality is one necessary condition on
   four points. The Cayley-Menger determinant is the WHOLE condition: for m
   points in any Euclidean space,

       (-1)^m · CM_m  >=  0,                                       (Menger)

   because that determinant is the squared volume of the simplex they span, up
   to a positive constant. Four distances are realisable in R^3 exactly when the
   four triangle inequalities hold and CM_4 >= 0 — necessary AND sufficient, so
   a negative CM_4 is not a near-miss to be scored, it is a proof that those four
   answers came from no arrangement of points anywhere.

   AND THE WHOLE SET AT ONCE. Schoenberg: the matrix is Euclidean iff the form

       Q(v) = SUM_ij v_i v_j d_ij^2      restricted to    SUM_i v_i = 0

   is negative semidefinite. The reason is one line of algebra — if the points
   exist and SUM v_i = 0 then

       SUM_ij v_i v_j |p_i - p_j|^2  =  -2 | SUM_i v_i p_i |^2  <=  0

   — so a single rational vector v summing to zero with Q(v) > 0 refutes every
   embedding into every Euclidean space of every dimension at once. That vector
   is the object this file produces. It is checkable with a pencil.

   INTEGERS THROUGHOUT. The answers arrive on a 0-100 grid in halves, so
   E_ij = (2 d_ij)^2 is a whole number and every determinant here is an integer
   determinant of an integer matrix, by Bareiss. Scaling the configuration by 2
   multiplies CM_m by 2^(2m-2) > 0 and cannot move a sign.
*/
'use strict';
const R = require('../rational.js');

/* integer squared distances of the doubled configuration */
function intE(D) {
  const n = D.length;
  const E = Array.from({ length: n }, () => Array(n).fill(0n));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const t = BigInt(Math.round(2 * D[i][j]));
    E[i][j] = t * t;
  }
  return E;
}
const maxE = (E) => E.reduce((a, r) => r.reduce((b, x) => (x > b ? x : b), a), 0n);

/* ---- exact determinant, fraction-free ------------------------------------ */
/* Bareiss: every intermediate entry stays an integer because it is itself a
   minor of the original matrix. No rationals, no growth beyond the answer. */
function detBareiss(M0) {
  const n = M0.length;
  const M = M0.map((r) => r.slice());
  let sign = 1n, prev = 1n;
  for (let k = 0; k < n - 1; k++) {
    if (M[k][k] === 0n) {
      let s = -1;
      for (let i = k + 1; i < n; i++) if (M[i][k] !== 0n) { s = i; break; }
      if (s < 0) return 0n;
      [M[k], M[s]] = [M[s], M[k]];
      sign = -sign;
    }
    for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) {
      M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) / prev;
    }
    prev = M[k][k];
  }
  return sign * M[n - 1][n - 1];
}

/* the Cayley-Menger determinant of a subset, exactly */
function cmDet(E, sub) {
  const m = sub.length;
  const M = Array.from({ length: m + 1 }, () => Array(m + 1).fill(0n));
  for (let i = 1; i <= m; i++) { M[0][i] = 1n; M[i][0] = 1n; }
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) M[i + 1][j + 1] = E[sub[i]][sub[j]];
  return detBareiss(M);
}
/* scale-free: CM_m is homogeneous of degree 2m-2 in the distances, so dividing
   by (2·diam)^(2m-2) = Emax^(m-1) leaves a number that does not care what the
   grid was. Sign is untouched; only the reading changes. */
function cmNorm(E, sub, Emax) {
  const d = cmDet(E, sub);
  let den = 1n;
  for (let i = 1; i < sub.length; i++) den *= Emax;
  return { det: d, norm: Number(d) / Number(den), ok: (sub.length % 2 ? -d : d) >= 0n };
}

/* ---- the readable witness: four items, two plus and two minus ------------- */
/* v = e_a + e_b - e_c - e_d sums to zero, so Q(v) <= 0 is forced in Euclidean
   space. Q(v)/2 = E_ab + E_cd - E_ac - E_ad - E_bc - E_bd. This is the classical
   negative-type inequality, and it is the smallest certificate there is. */
function negTypeQuad(E, [a, b, c, d]) {
  return E[a][b] + E[c][d] - E[a][c] - E[a][d] - E[b][c] - E[b][d];
}
/* strength, scale free and comparable across cases: Q(v) over its own worst
   case, |Q(v)| <= Emax * (SUM |v_i|)^2. */
const strength = (Q, l1, Emax) => Number(Q) / (Number(Emax) * l1 * l1);

function bestNegType(E, quads, Emax, floor) {
  let best = null, count = 0;
  const seen = new Set();
  for (const q of quads) {
    for (const [a, b, c, d] of [[q[0], q[1], q[2], q[3]], [q[0], q[2], q[1], q[3]], [q[0], q[3], q[1], q[2]]]) {
      const h = negTypeQuad(E, [a, b, c, d]);            /* = Q(v)/2 */
      const s = strength(2n * h, 4, Emax);
      if (s > floor) { count++; seen.add(q.join(',')); }
      if (!best || s > best.s) best = { s, sub: [a, b, c, d], half: h.toString() };
    }
  }
  return { best, violations: count, of: quads.length * 3, quads: seen.size };
}

/* ---- the floor, and this one is PROVED rather than sampled ---------------- */
/* Everywhere else on this page the instrument's floor is measured: run the test
   on a shape that is right by construction and refuse to count anything
   shallower than what its own rounding produces. Here the floor can be derived
   instead, which is better, because a measured floor is only as good as the
   family it was measured on.
   The answers arrive on a grid of step h, so each is within h/2 of whatever real
   number it stands for. With E = (2d)^2 that displaces every entry by at most
   4h·diam + h^2, and for any v the form moves by at most that times (SUM |v|)^2.
   A true Euclidean configuration has Q <= 0. Therefore ANY set of answers whose
   normalised strength exceeds
       (4·h·diam + h^2) / (4·diam^2)
   is not the rounding of any Euclidean configuration, in any dimension — no
   sampling, no percentile, no appeal to a null. */
function gridStep(D) {
  for (const row of D) for (const x of row) if (Math.abs(2 * x - Math.round(2 * x)) > 1e-9 || Math.round(2 * x) % 2 !== 0) return 0.5;
  return 1;
}
function provedFloor(D) {
  const h = gridStep(D);
  const diam = Math.max(...D.map((r) => Math.max(...r)));
  return diam > 0 ? (4 * h * diam + h * h) / (4 * diam * diam) : Infinity;
}

/* ---- the whole set: exact inertia of the Schoenberg form ------------------ */
/* Basis b_k = e_k - e_{n-1}, k = 0..n-2, which spans SUM v = 0 exactly. On it
   the form -Q has matrix S_kl = E[k][n-1] + E[l][n-1] - E[k][l], and the set is
   Euclidean iff S is positive semidefinite. Symmetric elimination over exact
   rationals gives the inertia by Sylvester's law, and the first negative pivot
   gives a direction back-substituted into a witness. */
function schoenberg(E) {
  const n = E.length, m = n - 1;
  const S = Array.from({ length: m }, (_, k) => Array.from({ length: m }, (_, l) =>
    R.int(Number(E[k][n - 1] + E[l][n - 1] - E[k][l]))));
  return S;
}
function inertiaWitness(S0) {
  const m = S0.length;
  const S = S0.map((r) => r.slice());
  const live = Array.from({ length: m }, (_, i) => i);
  /* T maps the CURRENT working coordinates back to the original ones */
  let T = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => R.int(i === j ? 1 : 0)));
  let p = 0, q = 0, z = 0, witness = null;

  const colOf = (k) => T.map((row) => row[k]);           /* original vector of working axis k */

  while (live.length) {
    let k = live.find((i) => R.sign(S[i][i]) !== 0);
    if (k === undefined) {
      /* every live diagonal is zero. If an off-diagonal survives, that pair is
         a hyperbolic plane: e_i + e_j has value 2S_ij and e_i - e_j has -2S_ij,
         so it contributes one positive and one negative and the witness is
         immediate. Rotate the basis and carry on. */
      let hit = null;
      for (const i of live) for (const j of live) if (i < j && R.sign(S[i][j]) !== 0) { hit = [i, j]; break; }
      if (!hit) { z += live.length; break; }
      const [i, j] = hit;
      const sgn = R.sign(S[i][j]);
      /* new axis i := e_i + s·e_j with s = -sign(S_ij) makes S_ii = -2|S_ij| < 0 */
      const s = R.int(-sgn);
      for (const a of live) S[a][i] = S[i][a] = R.add(S[i][a], R.mul(s, S[j][a]));
      S[i][i] = R.add(S[i][i], R.mul(s, S[j][i]));       /* the (i,i) entry needs the second pass */
      for (let r = 0; r < m; r++) T[r][i] = R.add(T[r][i], R.mul(s, T[r][j]));
      k = i;
      if (R.sign(S[k][k]) === 0) { z += live.length; break; }   /* defensive; cannot happen */
    }
    const piv = S[k][k];
    if (R.sign(piv) > 0) p++; else { q++; if (!witness) witness = colOf(k); }
    /* complete the square: u_k = y_k - SUM_{j != k} (S_kj/S_kk) y_j, which is a
       change of basis on the ORIGINAL coordinates, so T absorbs it. */
    const rest = live.filter((i) => i !== k);
    for (const j of rest) {
      const c = R.div(S[k][j], piv);
      if (R.sign(c) === 0) continue;
      for (let r = 0; r < m; r++) T[r][j] = R.sub(T[r][j], R.mul(c, T[r][k]));
    }
    for (const i of rest) for (const j of rest) S[i][j] = R.sub(S[i][j], R.div(R.mul(S[i][k], S[k][j]), piv));
    live.splice(live.indexOf(k), 1);
  }
  return { p, q, z, witness };
}

/* clear denominators and the common factor: the witness is published as whole
   numbers or it is not readable */
function integerize(vec) {
  let L = 1n;
  const g2 = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; };
  for (const v of vec) L = (L * v.d) / g2(L, v.d);
  const out = vec.map((v) => (v.n * L) / v.d);
  let g = 0n;
  for (const x of out) g = g2(g, x);
  return g > 1n ? out.map((x) => x / g) : out;
}

/* the full decision for one matrix */
function decide(D, quads) {
  const E = intE(D), n = D.length, Emax = maxE(E);
  const floor = provedFloor(D);
  const { p, q, z, witness } = inertiaWitness(schoenberg(E));

  const asWitness = (u, idx) => {
    const v = Array(n).fill(0n);
    let s = 0n;
    for (let k = 0; k < idx.length - 1; k++) { v[idx[k]] = u[k]; s += u[k]; }
    v[idx[idx.length - 1]] = -s;
    let Q = 0n, l1 = 0n;
    for (let i = 0; i < n; i++) { l1 += (v[i] < 0n ? -v[i] : v[i]); for (let j = 0; j < n; j++) Q += v[i] * v[j] * E[i][j]; }
    return { v: v.map(Number), Q: Q.toString(), l1: Number(l1), s: strength(Q, Number(l1), Emax), support: v.filter((x) => x !== 0n).length };
  };
  const full = witness ? asWitness(integerize(witness), Array.from({ length: n }, (_, i) => i)) : null;

  const nt = bestNegType(E, quads, Emax, floor);
  /* the ±1 witness on four items, promoted to a full vector so every candidate
     is quoted in the same units */
  const ntFull = (() => {
    if (!nt.best) return null;
    const [a, b, c, d] = nt.best.sub;
    const v = Array(n).fill(0n);
    v[a] = 1n; v[b] = 1n; v[c] = -1n; v[d] = -1n;
    let Q = 0n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Q += v[i] * v[j] * E[i][j];
    return { v: v.map(Number), Q: Q.toString(), l1: 4, s: strength(Q, 4, Emax), support: 4, sub: nt.best.sub };
  })();

  /* every quadruple decided completely: Cayley-Menger for the classical
     statement, and the 4-point Schoenberg form for the verdict, which is the
     same instrument as the global one restricted to four items */
  let cmBad = 0, cmWorst = 0, cmWorstSub = null, quadBad = 0, quadWorst = null;
  for (const qd of quads) {
    const c = cmNorm(E, qd, Emax);
    if (c.norm < cmWorst) { cmWorst = c.norm; cmWorstSub = qd; }
    if (c.det < 0n) cmBad++;
    const S4 = Array.from({ length: 3 }, (_, k) => Array.from({ length: 3 }, (_, l) =>
      R.int(Number(E[qd[k]][qd[3]] + E[qd[l]][qd[3]] - E[qd[k]][qd[l]]))));
    const iw = inertiaWitness(S4);
    if (iw.witness) {
      const w = asWitness(integerize(iw.witness), qd);
      if (w.s > floor) { quadBad++; if (!quadWorst || w.s > quadWorst.s) quadWorst = { ...w, sub: qd }; }
    }
  }

  /* THE PUBLISHED CERTIFICATE IS THE STRONGEST OF THE THREE, and it is called
     the strongest FOUND, never the strongest that exists: maximising Q over the
     hyperplane is its own problem and this page does not solve it. Any single
     one of them refutes on its own — the choice is about readability. */
  const cands = [full, ntFull, quadWorst].filter(Boolean);
  const clearing = cands.filter((c) => c.s > floor).sort((a, b) => (a.support - b.support) || (b.s - a.s));
  const cert = clearing[0] || cands.sort((a, b) => b.s - a.s)[0] || null;
  return {
    n, floor, gridStep: gridStep(D),
    euclidean: q === 0, inertia: { p, q, z }, dim: q === 0 ? p : null,
    witness: cert, witnessAll: { global: full, negtype: ntFull, quad: quadWorst },
    refuted: !!(cert && cert.s > floor),
    negtype: nt,
    quad: { impossible: quadBad, of: quads.length, worst: quadWorst },
    cm: { negative: cmBad, of: quads.length, worst: cmWorst, worstSub: cmWorstSub },
  };
}

module.exports = { intE, maxE, detBareiss, cmDet, cmNorm, negTypeQuad, bestNegType, schoenberg, inertiaWitness, integerize, decide, strength, gridStep, provedFloor };
