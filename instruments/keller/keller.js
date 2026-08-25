/* keller.js — exact audit of Jacobian-conjecture counterexample claims.

   THE CLAIM SHAPE. A Keller counterexample in dimension n is one object with
   three decidable parts:

     (1) det J_F ≡ c, a NONZERO CONSTANT — a polynomial identity over Q;
     (2) k ≥ 2 distinct rational points with F(p_1) = ... = F(p_k) exactly;
     (3) the points are pairwise distinct.

   Together: F is a polynomial map with constant nonzero Jacobian determinant
   that is not injective, hence not an automorphism — the Jacobian conjecture
   is FALSE in dimension n. Every part reduces to finitely many exact rational
   facts, so the whole claim is decided, not sampled: the determinant is
   expanded SYMBOLICALLY over BigInt rationals and compared to the constant
   coefficient-by-coefficient, and the collisions are evaluated in exact
   arithmetic. No float participates in any verdict.

   Why this instrument exists: on 2026-07-19 Alpöge announced such a map in
   dimension 3 (found with Claude; Speyer's tangent-sweep geometry explains
   it), refuting a conjecture open since Keller 1939 for every n ≥ 3. The
   claim is world-changing and USER-CHECKABLE IN SECONDS — exactly the kind of
   published assertion this lab audits rather than trusts. It was verified
   in-session with throwaway code on 2026-08-24; this file is that check made
   into an instrument with a battery and red controls.

   Polynomials are maps  exponent-key -> rational , key = exponents joined by
   ','. Coefficients are exact BigInt fractions from instruments/interval/
   rational.js — the arithmetic that DECIDES, next to the intervals that
   bound. MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('#instruments/interval/rational.js');

/* ---------- exact multivariate polynomials over Q ---------- */
const keyOf = (e) => e.join(',');
const expOf = (k) => k.split(',').map(Number);

function pzero() { return new Map(); }
function pconst(c, nvars) { const p = new Map(); if (Q.sign(c) !== 0) p.set(keyOf(new Array(nvars).fill(0)), c); return p; }
function pvar(i, nvars) { const e = new Array(nvars).fill(0); e[i] = 1; const p = new Map(); p.set(keyOf(e), Q.R(1n)); return p; }

function padd(a, ...rest) {
  const out = new Map(a);
  for (const b of rest) {
    for (const [k, v] of b) {
      const s = out.has(k) ? Q.add(out.get(k), v) : v;
      if (Q.isZero(s)) out.delete(k); else out.set(k, s);
    }
  }
  return out;
}
function pscale(a, c) {
  const out = new Map();
  if (Q.sign(c) === 0) return out;
  for (const [k, v] of a) out.set(k, Q.mul(v, c));
  return out;
}
function pmul(a, b) {
  const out = new Map();
  for (const [ka, va] of a) {
    const ea = expOf(ka);
    for (const [kb, vb] of b) {
      const eb = expOf(kb);
      const k = keyOf(ea.map((x, i) => x + eb[i]));
      const s = out.has(k) ? Q.add(out.get(k), Q.mul(va, vb)) : Q.mul(va, vb);
      if (Q.isZero(s)) out.delete(k); else out.set(k, s);
    }
  }
  return out;
}
function ppow(a, n, nvars) {
  let r = pconst(Q.R(1n), nvars);
  for (let i = 0; i < n; i++) r = pmul(r, a);
  return r;
}
function pdiff(a, i) {
  const out = new Map();
  for (const [k, v] of a) {
    const e = expOf(k);
    if (e[i] === 0) continue;
    const c = Q.mul(v, Q.R(BigInt(e[i])));
    e[i] -= 1;
    out.set(keyOf(e), c);
  }
  return out;
}
function peval(a, pt) {
  let s = Q.ZERO;
  for (const [k, v] of a) {
    let t = v;
    const e = expOf(k);
    for (let i = 0; i < e.length; i++) for (let j = 0; j < e[i]; j++) t = Q.mul(t, pt[i]);
    s = Q.add(s, t);
  }
  return s;
}
const pIsConst = (a) => a.size === 0 || (a.size === 1 && [...a.keys()][0].split(',').every(x => x === '0'));
const pConstVal = (a) => (a.size === 0 ? Q.ZERO : [...a.values()][0]);
function pevalFloat(a, pt) {
  let s = 0;
  for (const [k, v] of a) {
    let t = Q.toDouble(v);
    const e = expOf(k);
    for (let i = 0; i < e.length; i++) t *= Math.pow(pt[i], e[i]);
    s += t;
  }
  return s;
}

/* ---------- symbolic determinant, with zero-pruned column recursion ----------
   n stays small (3..8, and padded identity blocks are mostly zeros), so
   expansion over columns with pruning is both exact and fast. */
function pdet(M) {
  const n = M.length;
  const nvars = (() => { for (const row of M) for (const p of row) for (const k of p.keys()) return k.split(',').length; return 1; })();
  const usedCols = new Array(n).fill(false);
  function rec(row) {
    if (row === n) return pconst(Q.R(1n), nvars);
    let acc = pzero();
    let sgn = 1;
    for (let c = 0; c < n; c++) {
      if (usedCols[c]) continue;
      const entry = M[row][c];
      if (entry.size !== 0) {
        usedCols[c] = true;
        const sub = rec(row + 1);
        usedCols[c] = false;
        const term = pmul(entry, sub);
        acc = padd(acc, sgn === 1 ? term : pscale(term, Q.R(-1n)));
      }
      sgn = -sgn;
    }
    return acc;
  }
  return rec(0);
}

function jacobian(F, nvars) {
  return F.map(f => Array.from({ length: nvars }, (_, j) => pdiff(f, j)));
}

/* ---------- the audit ----------
   claim: { F: [poly...] (n polynomials in n vars), det: rational,
            collisions: [[rational...]...], image: [rational...] }
   Every check is exact; the FIRST failure is the verdict. */
function audit(claim) {
  const n = claim.F.length;
  const checks = [];

  /* (1) the determinant identity, symbolically */
  const D = pdet(jacobian(claim.F, n));
  if (!pIsConst(D)) {
    const mono = [...D.keys()].find(k => !k.split(',').every(x => x === '0'));
    return { verdict: 'REFUTED', why: 'det J_F is NOT constant: it has a nonconstant monomial x^(' + mono + ') — the Keller hypothesis fails, so this map refutes nothing', checks };
  }
  const dv = pConstVal(D);
  if (Q.cmp(dv, claim.det) !== 0) {
    return { verdict: 'REFUTED', why: 'det J_F is the constant ' + Q.toString(dv) + ', not the claimed ' + Q.toString(claim.det), checks };
  }
  if (Q.sign(dv) === 0) {
    return { verdict: 'REFUTED', why: 'det J_F is identically ZERO — not a Keller map', checks };
  }
  checks.push('det J_F = ' + Q.toString(dv) + ' as a polynomial identity (' + n + 'x' + n + ' symbolic determinant over Q)');

  /* (2) every collision point maps exactly to the claimed image */
  for (const pt of claim.collisions) {
    for (let i = 0; i < n; i++) {
      const got = peval(claim.F[i], pt);
      if (Q.cmp(got, claim.image[i]) !== 0) {
        return { verdict: 'REFUTED', why: 'F(' + pt.map(Q.toString) + ') has coordinate ' + i + ' = ' + Q.toString(got) + ', claimed ' + Q.toString(claim.image[i]), checks };
      }
    }
  }
  checks.push(claim.collisions.length + ' collision points evaluated exactly, all equal to the claimed image');

  /* (3) pairwise distinctness */
  for (let a = 0; a < claim.collisions.length; a++) for (let b = a + 1; b < claim.collisions.length; b++) {
    if (claim.collisions[a].every((x, i) => Q.cmp(x, claim.collisions[b][i]) === 0)) {
      return { verdict: 'REFUTED', why: 'collision points ' + a + ' and ' + b + ' are the SAME point — no collision', checks };
    }
  }
  if (claim.collisions.length < 2) {
    return { verdict: 'REFUSED', why: 'fewer than two collision points — nothing to collide', checks };
  }
  checks.push('points pairwise distinct');

  return { verdict: 'VERIFIED', det: dv, points: claim.collisions.length, checks };
}

module.exports = {
  pzero, pconst, pvar, padd, pscale, pmul, ppow, pdiff, peval, pevalFloat,
  pIsConst, pConstVal, pdet, jacobian, audit
};
