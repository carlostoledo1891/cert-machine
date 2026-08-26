#!/usr/bin/env node
// Lane B independent re-verification — Mathieu property for compact connected Lie groups
// (octonion/mathematics mc/, commit 7573e57a16fe85177d8a4dab9d98a681923af918)
//
// Exact BigInt-rational multivariate Laurent-polynomial arithmetic. No floats, no SymPy.
// Verifies the SUPPORTING IDENTITIES claimed in the manuscript and mirrored by the
// author's verify_mathieu_classification_updated.py — NOT the classification theorem.

'use strict';
const t0 = Date.now();

// ---------- exact rationals ----------
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; }
class Q {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('div0');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Q(this.n * o.n, this.d * o.d); }
  isZero() { return this.n === 0n; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
const Q0 = new Q(0n), Q1 = new Q(1n);

// ---------- multivariate Laurent polynomials ----------
// vars: fixed array of names; monomial key = exponents joined by ','; integer exponents may be negative.
class Poly {
  constructor(vars) { this.vars = vars; this.terms = new Map(); } // key -> Q
  static zero(vars) { return new Poly(vars); }
  static con(vars, q) { const p = new Poly(vars); if (!q.isZero()) p.terms.set(vars.map(() => 0).join(','), q); return p; }
  static mono(vars, name, exp = 1, q = Q1) {
    const e = vars.map(v => (v === name ? exp : 0));
    const p = new Poly(vars); p.terms.set(e.join(','), q); return p;
  }
  addTerm(key, q) {
    const cur = this.terms.get(key) || Q0; const s = cur.add(q);
    if (s.isZero()) this.terms.delete(key); else this.terms.set(key, s);
  }
  add(o) { const p = new Poly(this.vars); for (const [k, q] of this.terms) p.addTerm(k, q); for (const [k, q] of o.terms) p.addTerm(k, q); return p; }
  sub(o) { const p = new Poly(this.vars); for (const [k, q] of this.terms) p.addTerm(k, q); for (const [k, q] of o.terms) p.addTerm(k, q.mul(new Q(-1n))); return p; }
  mul(o) {
    const p = new Poly(this.vars);
    for (const [k1, q1] of this.terms) {
      const e1 = k1.split(',').map(Number);
      for (const [k2, q2] of o.terms) {
        const e2 = k2.split(',').map(Number);
        p.addTerm(e1.map((e, i) => e + e2[i]).join(','), q1.mul(q2));
      }
    }
    return p;
  }
  pow(n) { let r = Poly.con(this.vars, Q1), b = this; while (n > 0) { if (n & 1) r = r.mul(b); b = b.mul(b); n >>= 1; } return r; }
  scale(q) { const p = new Poly(this.vars); for (const [k, c] of this.terms) if (!c.mul(q).isZero()) p.terms.set(k, c.mul(q)); return p; }
  isZero() { return this.terms.size === 0; }
  // coefficient of var^e as a Poly in remaining structure (same var set, that var's exponent set to 0)
  coeffOf(name, e) {
    const i = this.vars.indexOf(name);
    const p = new Poly(this.vars);
    for (const [k, q] of this.terms) {
      const ex = k.split(',').map(Number);
      if (ex[i] === e) { ex[i] = 0; p.addTerm(ex.join(','), q); }
    }
    return p;
  }
  exponentsOf(name) {
    const i = this.vars.indexOf(name); const s = new Set();
    for (const k of this.terms.keys()) s.add(Number(k.split(',')[i]));
    return [...s].sort((a, b) => a - b);
  }
  // substitute each variable by a Poly over target vars (map name -> Poly); all vars must be mapped.
  subst(map, tvars) {
    let r = Poly.zero(tvars);
    for (const [k, q] of this.terms) {
      const ex = k.split(',').map(Number);
      let m = Poly.con(tvars, q);
      for (let i = 0; i < this.vars.length; i++) {
        const e = ex[i];
        if (e === 0) continue;
        const img = map[this.vars[i]];
        if (e < 0) {
          // only allow negative powers when image is a single monomial
          if (img.terms.size !== 1) throw new Error(`negative power of non-monomial image for ${this.vars[i]}`);
          const [[ik, iq]] = [...img.terms.entries()];
          if (iq.n !== 1n && iq.n !== -1n || iq.d !== 1n) throw new Error('non-unit monomial coeff inversion');
          const inv = new Poly(tvars);
          inv.terms.set(ik.split(',').map(Number).map(x => -x).join(','), iq); // 1/±1 = ±1
          m = m.mul(inv.pow(-e));
        } else {
          m = m.mul(img.pow(e));
        }
      }
      r = r.add(m);
    }
    return r;
  }
  eqP(o) { return this.sub(o).isZero(); }
}

// Reduce variable 'i' modulo i^2 = -1 (exponents assumed >= 0)
function reduceI(p) {
  const idx = p.vars.indexOf('i');
  const r = new Poly(p.vars);
  for (const [k, q] of p.terms) {
    const ex = k.split(',').map(Number);
    const e = ex[idx];
    const rem = ((e % 4) + 4) % 4;
    let coeff = q, ni = 0;
    if (rem === 1) ni = 1;
    else if (rem === 2) coeff = q.mul(new Q(-1n));
    else if (rem === 3) { ni = 1; coeff = q.mul(new Q(-1n)); }
    ex[idx] = ni;
    r.addTerm(ex.join(','), coeff);
  }
  return r;
}

// ∫_0^1 p(x,...) * x dx  where p is a polynomial in x (nonneg powers of x) with no other free vars
function integrateXweighted(p) {
  // p must involve only variable 'x' with nonneg exponents
  const xi = p.vars.indexOf('x');
  let s = Q0;
  for (const [k, q] of p.terms) {
    const ex = k.split(',').map(Number);
    ex.forEach((e, i) => { if (i !== xi && e !== 0) throw new Error('stray var in x-integral'); });
    if (ex[xi] < 0) throw new Error('negative x power');
    s = s.add(q.mul(new Q(1n, BigInt(ex[xi] + 2)))); // ∫ x^k · x dx = 1/(k+2)
  }
  return s;
}
// ∫_0^1 p(t) dt
function integrateT(p) {
  const ti = p.vars.indexOf('t');
  let s = Q0;
  for (const [k, q] of p.terms) {
    const ex = k.split(',').map(Number);
    ex.forEach((e, i) => { if (i !== ti && e !== 0) throw new Error('stray var in t-integral'); });
    s = s.add(q.mul(new Q(1n, BigInt(ex[ti] + 1))));
  }
  return s;
}
function binom(n, k) { if (k < 0 || k > n) return new Q(0n); let r = 1n; for (let i = 0; i < k; i++) r = r * BigInt(n - i) / BigInt(i + 1); return new Q(r); }
// c_m = ∫_0^1 (1-t^2)^m dt  exactly
function cM(m) { let s = Q0; for (let k = 0; k <= m; k++) s = s.add(binom(m, k).mul(new Q(BigInt((-1) ** k), BigInt(2 * k + 1)))); return s; }

let nChecks = 0, failures = [];
function check(name, ok, detail = '') { nChecks++; if (!ok) failures.push(`${name} ${detail}`); }

// =====================================================================
// Block 1 — weighted xz(1,1) witness: f = (1 - w^-1)((1-x^2) + x^2 w)
// pure moments vanish; marked moments = (-1)^(m-1)/(2(m+1)) for m=1..6
// (convention: CT_w then ∫_0^1 · x dx)
// =====================================================================
{
  const V = ['x', 'w'];
  const x = Poly.mono(V, 'x'), w = Poly.mono(V, 'w'), winv = Poly.mono(V, 'w', -1), one = Poly.con(V, Q1);
  const x2 = x.mul(x);
  const f = one.sub(winv).mul(one.sub(x2).add(x2.mul(w)));
  for (let m = 1; m <= 6; m++) {
    const fm = f.pow(m);
    const pure = integrateXweighted(fm.coeffOf('w', 0));
    const marked = integrateXweighted(fm.coeffOf('w', 1)); // CT_w(w^-1 f^m) = coeff of w^1 in f^m
    check(`B1 pure m=${m}`, pure.isZero(), `got ${pure}`);
    const exp = new Q(BigInt((-1) ** (m - 1)), BigInt(2 * (m + 1)));
    check(`B1 marked m=${m}`, marked.eq(exp), `got ${marked} want ${exp}`);
  }
}

// =====================================================================
// Block 2 — explicit abelian pair: U=2x(1-x^2)w, V=2x/w, T=1-2x^2,
// P=(1+U)(V-(2+U)T^2); claimed expansion, w-spectrum {-1,0,1,2},
// UV+T^2-1=0, U·P=(1+U)(1-(1+U)^2 T^2)
// =====================================================================
let P_ab, Q_ab, ABV;
{
  const V = ['x', 'w']; ABV = V;
  const x = Poly.mono(V, 'x'), w = Poly.mono(V, 'w'), winv = Poly.mono(V, 'w', -1), one = Poly.con(V, Q1);
  const two = Poly.con(V, new Q(2n));
  const x2 = x.mul(x);
  const U = two.mul(x).mul(one.sub(x2)).mul(w);
  const Vp = two.mul(x).mul(winv);
  const T = one.sub(two.mul(x2));
  P_ab = one.add(U).mul(Vp.sub(two.add(U).mul(T.mul(T))));
  Q_ab = U;

  // claimed expansion (as printed in manuscript / python)
  const c0 = one.sub(x2.scale(new Q(6n))).add(x2.mul(x2).scale(new Q(6n))).scale(new Q(-2n)); // -2(6x^4-6x^2+1)
  const cm1 = two.mul(x).mul(winv);
  const t2m1 = two.mul(x2).sub(one); // 2x^2-1
  const c1 = x.mul(x2.sub(one)).mul(t2m1).mul(t2m1).scale(new Q(6n)).mul(w);
  const c2 = x2.mul(x2.sub(one).pow(2)).mul(t2m1.pow(2)).scale(new Q(-4n)).mul(w.mul(w));
  const claimed = cm1.add(c0).add(c1).add(c2);
  check('B2 expansion', P_ab.eqP(claimed));
  check('B2 spectrum', JSON.stringify(P_ab.exponentsOf('w')) === JSON.stringify([-1, 0, 1, 2]), JSON.stringify(P_ab.exponentsOf('w')));
  check('B2 UV+T^2-1', U.mul(Vp).add(T.mul(T)).sub(one).isZero());
  const lhs = U.mul(P_ab);
  const rhs = one.add(U).mul(one.sub(one.add(U).pow(2).mul(T.mul(T))));
  check('B2 U*P identity', lhs.eqP(rhs));
}

// =====================================================================
// Block 3 — matrix-entry representatives + torus invariance + sqrt-free B(x,w)
// A0=ad-bc, U0=-2ab, V0=2cd, T0=ad+bc, P0=(A0+U0)(A0^2 V0-(2A0+U0)T0^2), Q0=U0
// torus: a->az, b->b/z, c->cz, d->d/z leaves all invariant.
// B: a=iw(1-x^2), b=ix, c=ix, d=-i/w maps (A0,U0,V0,T0,P0,Q0)->(1,U,V,T,P_ab,Q_ab)
// =====================================================================
{
  const V = ['a', 'b', 'c', 'd', 'z'];
  const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(n => Poly.mono(V, n));
  const A0 = a.mul(d).sub(b.mul(c));
  const U0 = a.mul(b).scale(new Q(-2n));
  const V0 = c.mul(d).scale(new Q(2n));
  const T0 = a.mul(d).add(b.mul(c));
  const P0 = A0.add(U0).mul(A0.pow(2).mul(V0).sub(A0.scale(new Q(2n)).add(U0).mul(T0.pow(2))));
  const Q0p = U0;

  const z = Poly.mono(V, 'z'), zinv = Poly.mono(V, 'z', -1);
  const tor = { a: a.mul(z), b: b.mul(zinv), c: c.mul(z), d: d.mul(zinv), z: z };
  for (const [nm, e] of [['A0', A0], ['U0', U0], ['V0', V0], ['T0', T0], ['P0', P0], ['Q0', Q0p]]) {
    check(`B3 torus-inv ${nm}`, e.subst(tor, V).eqP(e));
  }

  // sqrt-free substitution over Q[i]/(i^2+1): target vars x,w,i
  const W = ['x', 'w', 'i'];
  const xW = Poly.mono(W, 'x'), wW = Poly.mono(W, 'w'), iW = Poly.mono(W, 'i'), oneW = Poly.con(W, Q1);
  const wInv = Poly.mono(W, 'w', -1);
  const Bsub = {
    a: iW.mul(wW).mul(oneW.sub(xW.mul(xW))),
    b: iW.mul(xW),
    c: iW.mul(xW),
    d: iW.mul(wInv).scale(new Q(-1n)),
    z: Poly.con(W, Q1),
  };
  // images of the abelian pair lifted into W (i-exponent 0)
  const lift = { x: xW, w: wW };
  const liftP = p => p.subst(lift, W);
  const targets = [
    ['A0->1', A0, oneW],
    ['U0->U', U0, liftP(Q_ab)],
    ['V0->V', V0, Poly.mono(W, 'x').scale(new Q(2n)).mul(wInv)],
    ['T0->T', T0, oneW.sub(xW.mul(xW).scale(new Q(2n)))],
    ['P0->P', P0, liftP(P_ab)],
    ['Q0->Q', Q0p, liftP(Q_ab)],
  ];
  for (const [nm, src, img] of targets) {
    check(`B3 Bsub ${nm}`, reduceI(src.subst(Bsub, W)).eqP(img));
  }
}

// =====================================================================
// Block 4 — exact moment checks for the printed abelian witness:
// for m=1..5, s=0..m+2:  2∫_0^1 CT_w(Q^s P^m)·x dx = 0 (s=0)  else c_m·C(m-1,s-1)
// =====================================================================
{
  for (let m = 1; m <= 5; m++) {
    const cm = cM(m);
    const Pm = P_ab.pow(m);
    let Qs = Poly.con(ABV, Q1);
    for (let s = 0; s <= m + 2; s++) {
      const integrand = Qs.mul(Pm);
      const lhs = integrateXweighted(integrand.coeffOf('w', 0)).mul(new Q(2n));
      const rhs = s === 0 ? Q0 : cm.mul(binom(m - 1, s - 1));
      check(`B4 m=${m} s=${s}`, lhs.eq(rhs), `got ${lhs} want ${rhs}`);
      Qs = Qs.mul(Q_ab);
    }
  }
}

// =====================================================================
// Block 5 — independent reduced Hopf coefficient check through m=8:
// CT_u( u^(s-m) (1+u)^m (1-(1+u)^2 t^2)^m ) integrated dt over [0,1]
//  = 0 (s=0) else c_m·C(m-1,s-1);  CT picks coeff of u^(m-s).
// =====================================================================
{
  const V = ['u', 't'];
  const u = Poly.mono(V, 'u'), t = Poly.mono(V, 't'), one = Poly.con(V, Q1);
  for (let m = 1; m <= 8; m++) {
    const cm = cM(m);
    const base = one.add(u).pow(m).mul(one.sub(one.add(u).pow(2).mul(t.mul(t))).pow(m));
    for (let s = 0; s <= m + 2; s++) {
      const ct = base.coeffOf('u', m - s); // coeff of u^(m-s), a poly in t
      const lhs = integrateT(ct);
      const rhs = s === 0 ? Q0 : cm.mul(binom(m - 1, s - 1));
      check(`B5 m=${m} s=${s}`, lhs.eq(rhs), `got ${lhs} want ${rhs}`);
    }
  }
}

// =====================================================================
// Block 6 — closed form c_m = 4^m (m!)^2 / (2m+1)!  (abstract/eq. line 166)
// =====================================================================
{
  const fact = n => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };
  for (let m = 1; m <= 8; m++) {
    const closed = new Q(4n ** BigInt(m) * fact(BigInt(m)) ** 2n, fact(BigInt(2 * m + 1)));
    check(`B6 c_${m} closed form`, cM(m).eq(closed), `${cM(m)} vs ${closed}`);
  }
}

// =====================================================================
// Mutation controls — each MUST be rejected
// =====================================================================
let mutOK = 0;
{
  // M1: perturb a coefficient in the claimed expansion (6x^4 -> 7x^4 in the w^0 term)
  const V = ABV;
  const x = Poly.mono(V, 'x'), w = Poly.mono(V, 'w'), winv = Poly.mono(V, 'w', -1), one = Poly.con(V, Q1);
  const two = Poly.con(V, new Q(2n)); const x2 = x.mul(x);
  const c0bad = one.sub(x2.scale(new Q(6n))).add(x2.mul(x2).scale(new Q(7n))).scale(new Q(-2n));
  const t2m1 = two.mul(x2).sub(one);
  const claimedBad = two.mul(x).mul(winv).add(c0bad)
    .add(x.mul(x2.sub(one)).mul(t2m1.pow(2)).scale(new Q(6n)).mul(w))
    .add(x2.mul(x2.sub(one).pow(2)).mul(t2m1.pow(2)).scale(new Q(-4n)).mul(w.pow(2)));
  if (!P_ab.eqP(claimedBad)) mutOK++; else failures.push('MUTATION M1 not caught');

  // M2: flip a sign — T -> 1 + 2x^2 breaks UV + T^2 - 1 = 0
  const U = two.mul(x).mul(one.sub(x2)).mul(w);
  const Vp = two.mul(x).mul(winv);
  const Tbad = one.add(two.mul(x2));
  if (!U.mul(Vp).add(Tbad.mul(Tbad)).sub(one).isZero()) mutOK++; else failures.push('MUTATION M2 not caught');

  // M3: wrong RHS convention — marked moment with binom(m,s-1) instead of binom(m-1,s-1) at m=3,s=2
  const m = 3, s = 2;
  const lhs = integrateXweighted(Q_ab.pow(s).mul(P_ab.pow(m)).coeffOf('w', 0)).mul(new Q(2n));
  if (!lhs.eq(cM(m).mul(binom(m, s - 1)))) mutOK++; else failures.push('MUTATION M3 not caught');
}

const dt = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`checks: ${nChecks}, failures: ${failures.length}, mutation controls rejected: ${mutOK}/3, runtime: ${dt}s`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
if (mutOK !== 3) process.exit(1);
console.log('ALL SUPPORTING IDENTITIES VERIFIED EXACTLY (BigInt rationals).');
