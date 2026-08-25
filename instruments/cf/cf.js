/* cf.js — rigorous enclosures for polynomial continued fractions, built to
   audit the Ramanujan Machine on its own corpus.

   The Machine emits conjectures of the form

       closed form  =  b0 + a1/(b1 + a2/(b2 + a3/(b3 + ...)))

   with a_n, b_n integer polynomials in n, checked to some decimal depth and
   argued from collision probability. This instrument DECIDES the comparison,
   for the class it covers, with an enclosure that assumes nothing:

   POSITIVE CFs (a_n > 0, b_n >= 1 beyond the head). The tail from level N+1
   satisfies  t = a_{N+1}/(b_{N+1} + rest)  with rest >= 0, so
   t IN (0, a_{N+1}/b_{N+1}] — a PROVED seed interval, no convergence theorem
   consumed. Backward interval iteration  T <- a_n/(b_n + T)  with outward
   rounding then encloses the value of the entire fraction unconditionally:
   if the fraction converges slowly the enclosure is honestly wide, and if
   the coefficients ever violate positivity the instrument REFUSES rather
   than iterating on a broken premise. Coefficient values are verified to be
   exactly representable (|value| < 2^53) so the thin intervals are exact.

   What this buys over the Machine's own check: a claimed equality is tested
   against a rigorous bracket, so a closed form OUTSIDE the enclosure is
   REFUTED — proved, not unlikely — and one inside SURVIVES with its slack
   reported. Minus-CFs (a_n < 0, the zeta(3) family) need verified tail
   lemmas and are refused HERE; they are decided by minus.js, whose tail
   bands are proved per-family by shift-and-check coefficient positivity.

   MIT licensed. Part of cert-machine. */
'use strict';

const IV = require('#instruments/interval/interval.js');

const EXACT = 9007199254740992;        /* 2^53 */

/* enclose({b0, a, b}, N) -> { ok, enclosure, width, N } — a, b are
   functions n -> integer (n >= 1); b0 an integer. */
function enclose(cf, N) {
  /* verify positivity and exactness over the whole range used */
  for (let n = 1; n <= N + 1; n++) {
    const an = cf.a(n), bn = cf.b(n);
    if (!Number.isInteger(an) || !Number.isInteger(bn))
      return { ok: false, why: 'coefficient not an integer at n=' + n };
    if (Math.abs(an) >= EXACT || Math.abs(bn) >= EXACT)
      return { ok: false, why: 'coefficient exceeds 2^53 at n=' + n + ' — exactness lost' };
    if (an <= 0) return { ok: false, why: 'a_' + n + ' = ' + an + ' <= 0 — not a positive CF; the tail-seed argument does not apply' };
    if (bn < 1) return { ok: false, why: 'b_' + n + ' = ' + bn + ' < 1 — not a positive CF; the tail-seed argument does not apply' };
  }
  /* tail seed: t_{N+1} in (0, a_{N+1}/b_{N+1}] — proved, not assumed */
  let T = [0, IV.nextUp(cf.a(N + 1) / cf.b(N + 1))];
  for (let n = N; n >= 1; n--) {
    T = IV.div(IV.iv(cf.a(n)), IV.add(IV.iv(cf.b(n)), T));
  }
  const enc = IV.add(IV.iv(cf.b0), T);
  return { ok: true, enclosure: enc, width: enc[1] - enc[0], N };
}

/* rigorous 1-ulp enclosures of the constants the corpus speaks about */
const CONST = {
  pi: [IV.nextDown(Math.PI), IV.nextUp(Math.PI)],
  e: [IV.nextDown(Math.E), IV.nextUp(Math.E)]
};

/* the closed forms in the corpus are rational-linear in one constant:
   u + v*K with u, v rationals given as [num, den] */
function formEnclosure(form) {
  const K = CONST[form.K];
  if (!K) return null;
  const u = IV.div(IV.iv(form.u[0]), IV.iv(form.u[1]));
  const v = IV.div(IV.iv(form.v[0]), IV.iv(form.v[1]));
  return IV.add(u, IV.mul(v, K));
}

/* decide(cf, form, N): REFUTED iff the two rigorous enclosures are disjoint;
   SURVIVES otherwise, with the slack that survival is worth. */
function decide(cf, form, N) {
  const e = enclose(cf, N);
  if (!e.ok) return { verdict: 'REFUSED', why: e.why };
  const f = formEnclosure(form);
  if (!f) return { verdict: 'REFUSED', why: 'no rigorous enclosure for constant ' + form.K };
  const disjoint = e.enclosure[1] < f[0] || f[1] < e.enclosure[0];
  if (disjoint) {
    return { verdict: 'REFUTED', cf: e.enclosure, form: f, width: e.width,
      why: 'the closed form lies OUTSIDE a rigorous enclosure of the continued fraction — the conjecture is false' };
  }
  return { verdict: 'SURVIVES', cf: e.enclosure, form: f, width: e.width,
    note: 'the claimed form lies inside a rigorous enclosure of width ' + e.width.toExponential(2)
      + ' — consistency certified to that slack, equality not proved' };
}

module.exports = { enclose, decide, formEnclosure, CONST };
