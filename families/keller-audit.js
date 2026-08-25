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
const SW = require('#instruments/keller/sweep.js');

const DIMS = [3, 4, 5, 6, 7, 8];

/* beyond the audit: counterexamples GENERATED here by the tangent-sweep
   (instruments/keller/sweep.js) from curves of our own choosing — each an
   explicit map of geometric degree d+1 with det J == -2 proved symbolically
   and two exact rational collision witnesses. The d=2 output reproduces
   Alpöge's map exactly (the generator's calibration, checked in the battery);
   d >= 3 are new certified objects, not transcribed from anywhere. */
const SWEEP_DEGREES = [3, 4, 5];

/* Meng–Yang (arXiv:2607.22198): the HESSIAN conjecture is false in five
   variables. Psi = A^2 + 13A + 2B has 42 monomials, total degree 14, and
   det Hess Psi == 128 identically, while grad Psi identifies
   (1,-3/2,0,0,0) and (-1,3/2,0,0,0). The gradient map IS the object our
   audit decides — a Hessian counterexample is a Keller-map counterexample
   whose map happens to be a gradient. Obtained upstream from the
   six-variable doubling phi = y·F of Alpöge's map (det Hess phi == -4 =
   -(det J F)^2, an identity the battery checks) by Schur descent in x3. */
function mengYang() {
  const n = 5;
  const [x1, x2, y1, y2, y3] = [0, 1, 2, 3, 4].map(i => K.pvar(i, n));
  const one = K.pconst(Q.R(1n), n);
  const c = (k) => K.pconst(Q.R(BigInt(k)), n);
  const u = K.padd(one, K.pmul(x1, x2));
  const u2 = K.pmul(u, u), u3 = K.pmul(u2, u);
  const T = K.padd(c(4), K.pscale(K.pmul(x1, x2), Q.R(3n)));
  const A = K.padd(K.pmul(y1, u3),
    K.pscale(K.pmul(K.pmul(x1, y2), u2), Q.R(3n)),
    K.pscale(K.pmul(K.pmul(K.pmul(x1, x1), x1), y3), Q.R(-1n)));
  const x2sq = K.pmul(x2, x2);
  const B = K.padd(
    K.pmul(K.pmul(K.pmul(y1, x2sq), u), T),
    K.pmul(y2, K.padd(x2, K.pscale(K.pmul(K.pmul(x1, x2sq), T), Q.R(3n)))),
    K.pmul(y3, K.padd(K.pscale(x1, Q.R(2n)), K.pscale(K.pmul(K.pmul(x1, x1), x2), Q.R(-3n)))));
  const Psi = K.padd(K.pmul(A, A), K.pscale(A, Q.R(13n)), K.pscale(B, Q.R(2n)));
  const grad = [0, 1, 2, 3, 4].map(i => K.pdiff(Psi, i));
  const Pp = [Q.R(1n), Q.R(-3n, 2n), Q.ZERO, Q.ZERO, Q.ZERO];
  const Pm = [Q.R(-1n), Q.R(3n, 2n), Q.ZERO, Q.ZERO, Q.ZERO];
  return {
    Psi,
    claim: {
      F: grad, det: Q.R(128n),
      collisions: [Pp, Pm],
      image: [Q.ZERO, Q.ZERO, Q.R(-1n, 2n), Q.ZERO, Q.ZERO]
    }
  };
}

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
    if (i < DIMS.length) {
      const n = DIMS[i];
      return { n, source: 'Alpöge 2026-07-19', claim: alpoge(n) };
    }
    const j = i - DIMS.length;
    if (j < SWEEP_DEGREES.length) {
      const d = SWEEP_DEGREES[j];
      const g = SW.generate(d);
      if (!g.ok) return { n: 3, source: 'tangent-sweep d=' + d + ' (generator refused: ' + g.why + ')', claim: null };
      return { n: 3, source: 'tangent-sweep d=' + d + ', generated+certified here', claim: g.claim, meta: g.meta };
    }
    if (j === SWEEP_DEGREES.length) {
      return { n: 5, source: 'Meng–Yang arXiv:2607.22198', hessian: true, claim: mengYang().claim };
    }
    /* Gallagher's family (Zenodo 10.5281/zenodo.21479195): seeds p_d give
       det J == 1 with generic fiber degree d+1 — every degree >= 3 occurs —
       plus the paper's "genuinely distinct" member p = w - 2w^3, b = -1. */
    const k = j - SWEEP_DEGREES.length - 1;
    const GAL = [2, 3, 4, 5];
    if (k < GAL.length) {
      const d = GAL[k];
      const g = SW.fromSeed({ pCoeffs: SW.gallagherSeed(d) });
      if (!g.ok) return { n: 3, source: 'Gallagher seed d=' + d + ' (refused: ' + g.why + ')', claim: null };
      return { n: 3, source: 'Gallagher zenodo.21479195 d=' + d + ', fiber degree ' + (d + 1), claim: g.claim, meta: g.meta, published: true };
    }
    if (k === GAL.length) {
      const g = SW.fromSeed({ pCoeffs: [Q.R(1n), Q.ZERO, Q.R(-2n)], b: Q.R(-1n) });
      if (!g.ok) return { n: 3, source: 'Gallagher distinct member (refused: ' + g.why + ')', claim: null };
      return { n: 3, source: 'Gallagher zenodo.21479195 distinct member (w-2w^3), not coordinate-equivalent to Alpöge', claim: g.claim, meta: g.meta, published: true };
    }
    return null;
  },
  /* float screen: the determinant sampled at ONE float point. May only prune —
     a map whose sampled det is far from the claim is not worth the symbolic
     expansion; nothing about a passing sample is believed. */
  value(o) {
    if (!o.claim) return 0;              /* generator refusal — surfaces as REFUSED in certify */
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
  key: (o) => o.source.split(',')[0] + '|' + o.n,
  certify(o) {
    if (!o.claim) return { verdict: 'REFUSED', why: o.source };
    const a = K.audit(o.claim);
    if (a.verdict === 'VERIFIED') {
      const d = Q.toDouble(a.det);
      const generated = !!o.meta && !o.published;
      return {
        verdict: 'HIT',
        enclosure: [d, d],                    /* the certified constant, exact */
        text: o.hessian
          ? 'the HESSIAN conjecture is FALSE in ' + o.n + ' variables: an explicit degree-14 integer polynomial whose '
            + 'Hessian determinant is ' + Q.toString(a.det) + ' as a polynomial identity while its gradient identifies '
            + a.points + ' distinct rational points, all decided in exact arithmetic (' + o.source + ', audited here)'
          : o.published && o.meta
          ? 'the Jacobian conjecture is FALSE in dimension 3: ' + o.source.split(',')[0] + ' reconstructed from its seed — '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, generic fiber degree ' + o.meta.geometricDegree
            + ', ' + a.points + ' distinct rational points sharing one image, every claim decided in exact arithmetic'
          : generated
          ? 'a NEW certified counterexample to the Jacobian conjecture, generated here by the tangent-sweep: '
            + 'geometric degree ' + o.meta.geometricDegree + ' (curve p(w) with coefficients [' + o.meta.p.join(', ') + ']), '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, ' + a.points
            + ' distinct rational points sharing one image — generated AND decided in exact arithmetic'
          : 'the Jacobian conjecture is FALSE in dimension ' + o.n + ': an explicit polynomial map with '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, and ' + a.points
            + ' distinct rational points sharing one image, all decided in exact arithmetic (' + o.source + ', audited here)',
        extra: { n: o.n, source: o.source, det: Q.toString(a.det), points: a.points, checks: a.checks,
                 ...(o.meta ? { sweep: o.meta } : {}) }
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
