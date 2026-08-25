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
const PIN = require('#instruments/pin.js');

/* TWO Alpöge rows, not six. Rows n=4..8 were one theorem repeated by
   identity-padding, and a knowledgeable reader saw five rows of padding
   (an outside review said so in a minute). What remains is the honest
   shape: n=3 is the mathematics; n=8 is ONE padded representative that
   states the stabilization — adjoining identity coordinates carries det J
   and the witnesses unchanged to every n >= 3 — and exercises the audit's
   8x8 symbolic determinant while it is at it. */
const DIMS = [3, 8];

/* what was transcribed, wired into the certificate (outside review R3):
   the exact formula strings the family was built from, next to the byte
   pin of the source where one is held. Alpöge's map arrived as a tweet
   (2026-07-19) and Meng–Yang as an arXiv page — no canonical byte
   sequence is held for those; the compensation is that both were verified
   here by two independent exact routes before this family existed. */
const TRANSCRIBED = {
  alpoge: 'P = (1+xy)^3 z + y^2(1+xy)(4+3xy); Q = y + 3x(1+xy)^2 z + 3xy^2(4+3xy); R = 2x - 3x^2y - x^3z; '
    + 'det J = -2; witnesses (0,0,-1/4), (1,-3/2,13/2), (-1,3/2,13/2) -> (-1/4,0,0)',
  mengYang: 'Psi = A^2 + 13A + 2B (42 monomials, total degree 14) with A, B from the Schur descent of '
    + 'phi = y.F in x3; det Hess Psi = 128; grad Psi identifies (1,-3/2,0,0,0) and (-1,3/2,0,0,0)',
  gallagherFamily: 'seed gauge p(0)=0, p(1)=-c, INT_0^1 p = 0; q from c q\' = w p\'; kappa = p\'(1)/c; '
    + 'a = -(1+kappa)/(2+kappa); gamma = 1 + a xy + b x^2 z; F = (alpha/x^2, beta/x, x gamma); det J = bc; '
    + 'family seed p_d = 2w - 3w^2 + w(1-w)(w^{d-2} - 6/(d(d+1))), c = 1',
  gallagherDistinct: 'the paper\'s genuinely distinct member: p = w - 2w^3, b = -1, giving a = -4/3 and det J = -1'
};

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
      return { n, source: 'Alpöge 2026-07-19', claim: alpoge(n), padded: n > 3, transcription: TRANSCRIBED.alpoge };
    }
    const j = i - DIMS.length;
    if (j < SWEEP_DEGREES.length) {
      const d = SWEEP_DEGREES[j];
      const g = SW.generate(d);
      if (!g.ok) return { n: 3, source: 'tangent-sweep d=' + d + ' (generator refused: ' + g.why + ')', claim: null };
      /* R4: these are NEW CURVES pushed through the PUBLISHED tangent-sweep
         mechanism — new instances, not a new mechanism, and not checked for
         coordinate-equivalence against Gallagher's members. The label must
         say exactly that, everywhere it surfaces. */
      return { n: 3, source: 'tangent-sweep d=' + d + ' (new curve through the published mechanism), generated+certified here', claim: g.claim, meta: g.meta };
    }
    if (j === SWEEP_DEGREES.length) {
      return { n: 5, source: 'Meng–Yang arXiv:2607.22198', hessian: true, claim: mengYang().claim, transcription: TRANSCRIBED.mengYang };
    }
    /* Gallagher's family (Zenodo 10.5281/zenodo.21479195): seeds p_d give
       det J == 1 with generic fiber degree d+1 — every degree >= 3 occurs —
       plus the paper's "genuinely distinct" member p = w - 2w^3, b = -1.
       The preprint's bytes are held and pinned: certify re-hashes them. */
    const k = j - SWEEP_DEGREES.length - 1;
    const GAL = [2, 3, 4, 5];
    if (k < GAL.length) {
      const d = GAL[k];
      const g = SW.fromSeed({ pCoeffs: SW.gallagherSeed(d) });
      if (!g.ok) return { n: 3, source: 'Gallagher seed d=' + d + ' (refused: ' + g.why + ')', claim: null };
      return { n: 3, source: 'Gallagher zenodo.21479195 d=' + d + ', fiber degree ' + (d + 1), claim: g.claim, meta: g.meta, published: true,
        pin: 'gallagher2026.pdf', transcription: TRANSCRIBED.gallagherFamily };
    }
    if (k === GAL.length) {
      const g = SW.fromSeed({ pCoeffs: [Q.R(1n), Q.ZERO, Q.R(-2n)], b: Q.R(-1n) });
      if (!g.ok) return { n: 3, source: 'Gallagher distinct member (refused: ' + g.why + ')', claim: null };
      return { n: 3, source: 'Gallagher zenodo.21479195 distinct member (w-2w^3), not coordinate-equivalent to Alpöge', claim: g.claim, meta: g.meta, published: true,
        pin: 'gallagher2026.pdf', transcription: TRANSCRIBED.gallagherDistinct };
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
    /* R3: a transcription certifies against a byte sequence. If the pinned
       source has drifted, there is nothing the transcription points at. */
    let sourcePin = null;
    if (o.pin) {
      const pv = PIN.verify(o.pin);
      if (!pv.ok) return { verdict: 'REFUSED', why: 'source pin failed for ' + o.pin + ': ' + pv.why };
      sourcePin = { file: pv.file, sha256: pv.sha256 };
    }
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
          : o.padded
          ? 'the STABILIZATION, stated once: adjoining identity coordinates carries the n=3 counterexample to every '
            + 'dimension n >= 3 with det J and the witnesses unchanged — audited here at n=' + o.n + ' as the one padded '
            + 'representative (det J = ' + Q.toString(a.det) + ' through the ' + o.n + 'x' + o.n + ' symbolic determinant, '
            + a.points + ' collisions re-evaluated); identity padding, not new mathematics'
          : o.published && o.meta
          ? 'the Jacobian conjecture is FALSE in dimension 3: ' + o.source.split(',')[0] + ' reconstructed from its seed — '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, generic fiber degree ' + o.meta.geometricDegree
            + ', ' + a.points + ' distinct rational points sharing one image, every claim decided in exact arithmetic'
          : generated
          ? 'a NEW instance through the PUBLISHED tangent-sweep mechanism: our own degree-' + o.meta.d + ' curve '
            + '(coefficients [' + o.meta.p.join(', ') + ']) gives geometric degree ' + o.meta.geometricDegree + ', '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, ' + a.points
            + ' distinct rational points sharing one image — a new curve, not a new mechanism, and not '
            + 'coordinate-equivalence-checked against Gallagher\'s members; generated AND decided in exact arithmetic'
          : 'the Jacobian conjecture is FALSE in dimension ' + o.n + ': an explicit polynomial map with '
            + 'det J = ' + Q.toString(a.det) + ' proved as a polynomial identity, and ' + a.points
            + ' distinct rational points sharing one image, all decided in exact arithmetic (' + o.source + ', audited here)',
        extra: { n: o.n, source: o.source, det: Q.toString(a.det), points: a.points, checks: a.checks,
                 ...(o.padded ? { padded: 'identity coordinates adjoined to the n=3 object; one representative row standing for all n >= 4' } : {}),
                 ...(o.transcription ? { transcription: o.transcription } : {}),
                 ...(sourcePin ? { sourcePin } : {}),
                 ...(o.meta && !o.published ? { mechanism: 'published tangent-sweep (Speyer 2026-07-23, Gao arXiv:2608.00222); new curve, not a new mechanism; coordinate-equivalence vs Gallagher unchecked' } : {}),
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
