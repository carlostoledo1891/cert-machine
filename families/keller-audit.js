/* keller-audit.js — certified audits of Jacobian-conjecture counterexamples.

   On 2026-07-19 Alpöge announced (on X, found with Claude; Gallagher's
   infinite family followed 07-20, Speyer's tangent-sweep geometry 07-23) an
   explicit polynomial map refuting the Jacobian conjecture — open since
   Keller 1939 — in dimension 3:

       P = (1+xy)^3 z + y^2 (1+xy)(4+3xy)
       Q = y + 3x(1+xy)^2 z + 3x y^2 (4+3xy)
       R = 2x - 3x^2 y - x^3 z

   det J = -2 identically, yet (0,0,-1/4), (1,-3/2,13/2), (-1,3/2,13/2) all
   map to (-1/4,0,0). Adjoining identity coordinates carries the refutation to
   every dimension n >= 3; the plane case remains open.

   A HIT here is the audit VERIFIED in dimension n: the determinant identity
   proved symbolically over exact rationals, every collision evaluated
   exactly, distinctness checked — a certificate that the Jacobian conjecture
   is false in that dimension, independent of anyone's announcement. The
   float layer only screens (a determinant sampled at one float point); the
   instrument decides. Nothing here is trusted from the literature: a claim
   that fails any exact check is REFUTED, which for THIS family would be the
   discovery. */
'use strict';

const K = require('#instruments/keller/keller.js');
const Q = require('#instruments/interval/rational.js');

const DIMS = [3, 4, 5, 6, 7, 8];

/* the Alpöge map in dimension n (identity-padded), built from exact ops */
function alpoge(n) {
  const x = K.pvar(0, n), y = K.pvar(1, n), z = K.pvar(2, n);
  const one = K.pconst(Q.R(1n), n);
  const c = (k) => K.pconst(Q.R(BigInt(k)), n);
  const s = K.padd(one, K.pmul(x, y));                       /* 1 + xy  */
  const t = K.padd(c(4), K.pscale(K.pmul(x, y), Q.R(3n)));   /* 4 + 3xy */

  const P = K.padd(K.pmul(K.ppow(s, 3, n), z), K.pmul(K.pmul(K.ppow(y, 2, n), s), t));
  const Qp = K.padd(y, K.pscale(K.pmul(K.pmul(x, K.ppow(s, 2, n)), z), Q.R(3n)),
    K.pscale(K.pmul(K.pmul(x, K.ppow(y, 2, n)), t), Q.R(3n)));
  const R = K.padd(K.pscale(x, Q.R(2n)), K.pscale(K.pmul(K.ppow(x, 2, n), y), Q.R(-3n)),
    K.pscale(K.pmul(K.ppow(x, 3, n), z), Q.R(-1n)));

  const F = [P, Qp, R];
  for (let i = 3; i < n; i++) F.push(K.pvar(i, n));          /* identity coordinates */

  const pad = (p3) => p3.concat(new Array(n - 3).fill(Q.ZERO));
  return {
    F,
    det: Q.R(-2n),
    collisions: [
      pad([Q.R(0n), Q.R(0n), Q.R(-1n, 4n)]),
      pad([Q.R(1n), Q.R(-3n, 2n), Q.R(13n, 2n)]),
      pad([Q.R(-1n), Q.R(3n, 2n), Q.R(13n, 2n)])
    ],
    image: pad([Q.R(-1n, 4n), Q.R(0n), Q.R(0n)])
  };
}

module.exports = {
  name: 'keller-audit',
  statement: 'an explicit polynomial map C^n -> C^n whose Jacobian determinant is proved constant by symbolic expansion over exact rationals, with certified distinct rational points sharing one image — the Jacobian conjecture refuted in dimension n, decided here and not trusted',
  enumerate(i) {
    if (i >= DIMS.length) return null;
    const n = DIMS[i];
    return { n, source: 'Alpöge 2026-07-19', claim: alpoge(n) };
  },
  /* float screen: the determinant sampled at ONE float point. May only prune —
     a map whose sampled det is far from the claim is not worth the symbolic
     expansion; nothing about a passing sample is believed. */
  value(o) {
    const pt = Array.from({ length: o.n }, (_, i) => 0.31 + 0.17 * i);
    const J = K.jacobian(o.claim.F, o.n).map(row => row.map(p => K.pevalFloat(p, pt)));
    const det = (function d(M) {
      if (M.length === 1) return M[0][0];
      let s = 0;
      for (let c = 0; c < M.length; c++) {
        if (M[0][c] === 0) continue;
        const minor = M.slice(1).map(r => r.filter((_, j) => j !== c));
        s += (c % 2 ? -1 : 1) * M[0][c] * d(minor);
      }
      return s;
    })(J);
    return Math.abs(det - Q.toDouble(o.claim.det));
  },
  interesting(o, v) {
    return isFinite(v) && v < 1e-6;
  },
  key: (o) => 'alpoge|' + o.n,
  certify(o) {
    const a = K.audit(o.claim);
    if (a.verdict === 'VERIFIED') {
      const d = Q.toDouble(a.det);
      return {
        verdict: 'HIT',
        enclosure: [d, d],                    /* the certified constant, exact */
        text: 'the Jacobian conjecture is FALSE in dimension ' + o.n + ': an explicit polynomial map with '
          + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, and ' + a.points
          + ' distinct rational points sharing one image, all decided in exact arithmetic (' + o.source + ', audited here)',
        extra: { n: o.n, source: o.source, det: Q.toString(a.det), points: a.points, checks: a.checks }
      };
    }
    if (a.verdict === 'REFUTED') {
      return { verdict: 'REJECT', enclosure: [0, 0],
        text: 'the published claim FAILS its exact audit in dimension ' + o.n + ': ' + a.why
          + ' — for this family, a refutation would be the discovery',
        extra: { n: o.n, source: o.source, why: a.why, checks: a.checks } };
    }
    return { verdict: 'REFUSED', why: a.why };
  }
};
