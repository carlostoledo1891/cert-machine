/* estimates.js — the asymptotic half of Mercer's method, certified.
   instruments/lambda4 · cert-machine

   The dot-product argument closes a family or it does not; when it does not,
   Mercer's fallback is always the same three-lemma pattern, and this file is
   that pattern as one certified combinator.

     Lemma 3.1  Two equispaced sets S_e (order m_e, anchor xi_e) and S_o
                (order m_o, anchor xi_o) with g = gcd(m_e, m_o) contain
                points theta_e, theta_o with |theta_e - theta_o| <=
                pi*g/(m_e*m_o). Evaluating at that theta_e: m_e*theta_e =
                xi_e exactly, and |m_o*theta_e - xi_o| <= pi*g/m_e.
     Lemma 3.2  |theta - pi| = eps  =>  cos theta <= -1 + eps^2/2. (Global:
                cos(pi+eps) = -cos eps and cos eps >= 1 - eps^2/2.)
     Lemma 3.3  |theta - 2pi/3| = eps <= pi/6  =>  cos theta <= -1/2 +
                (3/pi)*eps; same at 4pi/3. The pi/6 VALIDITY RANGE is part
                of the lemma and is carried as a floor on the tail
                parameter — an estimate outside it certifies nothing.

   Every member of the set decomposes as k = u*m_e + v*m_o (forms.decompose,
   exact); at theta_e its angle is u*xi_e + v*xi_o up to |v|*pi*g/m_e. The
   total dip bound is then

       A  +  B * pi^2/N^2  +  C/N        N = value of m_e,

   with A, B, C exact rationals, B, C >= 0 (Lemma 3.3's 3/pi cancels the pi
   in eps — its contribution is rational). The threshold solver finds the
   least integer N_0, at or above every validity floor, whose bound clears
   the target, comparing through a directed rational enclosure of pi^2 built
   from the bigfloat instrument — never a floating-point pi.

   The gcd in Lemma 3.1 is not assumed: g = 1 is CERTIFIED by exhibiting
   every member of the gcd-reduced context as an integer combination of
   (m_e, m_o) — the same decomposition the estimate already needs — so a
   common divisor of the orders would divide gcd(A) = 1.

   MIT licensed. Part of cert-machine. */
'use strict';

const F = require('./forms.js');
const D = require('./dot.js');
const Q = require('#instruments/interval/rational.js');
const BF = require('#instruments/bigfloat/functions.js');

const q = D.q;

/* ---------------- pi and pi^2, as exact rational enclosures --------------- */
function bigfloatToQ(x) {
  /* {m, e} = m * 2^e exactly */
  if (x.e >= 0) return Q.R(x.m << BigInt(x.e), 1n);
  return Q.R(x.m, 1n << BigInt(-x.e));
}
let PI_ENC = null;
function piEnclosure() {
  if (!PI_ENC) {
    const p = BF.pi(120);
    PI_ENC = { lo: bigfloatToQ(p.lo), hi: bigfloatToQ(p.hi) };
    if (Q.cmp(PI_ENC.lo, PI_ENC.hi) > 0) throw new Error('estimates: pi enclosure inverted');
  }
  return PI_ENC;
}
function pi2Enclosure() {
  const p = piEnclosure();           /* pi > 0, so squaring is monotone */
  return { lo: Q.mul(p.lo, p.lo), hi: Q.mul(p.hi, p.hi) };
}

/* ---------------- bound expressions -------------------------------------- */
/* {A, B, C}: A + B*pi^2/N^2 + C/N, with B, C >= 0 required (monotone in N). */
function boundAt(expr, N) {
  if (Q.sign(expr.B) < 0 || Q.sign(expr.C) < 0)
    throw new Error('estimates: bound expression not monotone (B or C negative)');
  const n = q(N), n2 = q(N * N);
  const p2 = pi2Enclosure();
  const t = Q.add(expr.A, Q.div(expr.C, n));
  return { lo: Q.add(t, Q.div(Q.mul(expr.B, p2.lo), n2)), hi: Q.add(t, Q.div(Q.mul(expr.B, p2.hi), n2)) };
}

/* least integer N >= floorN with bound(N).hi strictly below target.lo;
   target is a rational enclosure {lo,hi} (an exact rational passes as
   {lo:x, hi:x}). The bound is decreasing in N, so the scan is sound. */
function threshold(expr, target, floorN, cap) {
  for (let N = Math.max(1, floorN); N <= (cap || 1000000); N++) {
    const b = boundAt(expr, N);
    if (Q.cmp(b.hi, target.lo) < 0) return N;
  }
  throw new Error('estimates.threshold: no N below cap clears the target');
}

/* ---------------- angle classes ------------------------------------------ */
/* u*xi_e + v*xi_o reduced mod 2pi as a rational multiple of pi, classified:
   'one' (cos <= 1, no lemma), 'pi' (Lemma 3.2), 'twothird' (Lemma 3.3). */
function angleClass(u, v, xiE, xiO) {
  /* angle = (u*pE/rE + v*pO/rO) * pi ; reduce the fraction mod 2 */
  let num = u * xiE.p * xiO.r + v * xiO.p * xiE.r;
  const den = xiE.r * xiO.r;
  num = ((num % (2n * den)) + 2n * den) % (2n * den);   /* in [0, 2den) */
  if (num === 0n) return { cls: 'one' };
  if (num === den) return { cls: 'pi' };
  const g6 = (x) => x * 6n;                              /* compare to 2pi/3, 4pi/3 */
  if (g6(num) === 4n * den || g6(num) === 8n * den) return { cls: 'twothird' };
  return { cls: 'other', frac: num + '/' + den + ' pi' };
}

/* ---------------- the combinator ----------------------------------------- */
/* anchoredBound(C, members, Se, So):
     C        gcd-reduced context; members: the member names of the set A
     Se, So   {order: form, xi} — evaluation set and companion set
   Every member k must decompose k = u*Se.order + v*So.order with integer
   u, v (this doubles as the g = 1 certificate). Members with v = 0 land
   exactly (cos(u*xi_e)); the rest go through Lemma 3.2/3.3 with
   eps = |v|*pi/N, N the value of m_e. Returns
     { expr: {A,B,C}, validityFloor, pieces } — pieces name every step. */
function anchoredBound(C, members, Se, So) {
  if (!F.certPos(Se.order) || !F.certPos(So.order))
    throw new Error('estimates: both orders must be certifiably >= 1');
  const pieces = [];
  let A = q(0), B = q(0), Cc = q(0);
  let validityFloor = 1;
  for (const nm of members) {
    const k = C.member[nm];
    if (!k) throw new Error('estimates: unknown member ' + nm);
    const dec = F.decompose(C, k, Se.order, So.order);
    if (!dec) throw new Error('estimates: member ' + nm + ' does not decompose over the anchors — no gcd certificate');
    const { u, v } = dec;
    if (v === 0n) {
      const val = D.cosOfMultiple(u, Se.xi);
      A = Q.add(A, val);
      pieces.push({ member: nm, kind: 'exact', u: String(u), value: Q.toString(val) });
      continue;
    }
    const cls = angleClass(u, v, Se.xi, So.xi);
    const av = v < 0n ? -v : v;                          /* eps = |v| pi / N */
    if (cls.cls === 'pi') {
      /* cos <= -1 + eps^2/2 = -1 + (|v|^2/2) pi^2/N^2 */
      A = Q.sub(A, q(1));
      B = Q.add(B, Q.R(av * av, 2n));
      pieces.push({ member: nm, kind: 'lemma3.2', u: String(u), v: String(v) });
    } else if (cls.cls === 'twothird') {
      /* cos <= -1/2 + (3/pi)eps = -1/2 + 3|v|/N ; valid for eps <= pi/6, i.e. N >= 6|v| */
      A = Q.sub(A, q(1, 2));
      Cc = Q.add(Cc, Q.R(3n * av, 1n));
      validityFloor = Math.max(validityFloor, Number(6n * av));
      pieces.push({ member: nm, kind: 'lemma3.3', u: String(u), v: String(v), floor: Number(6n * av) });
    } else if (cls.cls === 'one') {
      /* target angle 0: the trivial bound cos <= 1. Legal, and flagged —
         an estimate leaning on it is almost certainly not what was meant. */
      A = Q.add(A, q(1));
      pieces.push({ member: nm, kind: 'trivial', u: String(u), v: String(v), warn: 'target angle 0' });
    } else {
      throw new Error('estimates: member ' + nm + ' lands at unsupported angle ' + cls.frac);
    }
  }
  return { expr: { A, B, C: Cc }, validityFloor, pieces };
}

module.exports = { piEnclosure, pi2Enclosure, boundAt, threshold, angleClass, anchoredBound, bigfloatToQ };
