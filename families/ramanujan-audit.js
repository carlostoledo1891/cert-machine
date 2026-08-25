/* ramanujan-audit.js — the Ramanujan Machine's own conjectures, decided.

   The Machine publishes polynomial continued fractions for constants, found
   by matching truncated decimals and argued from collision probability —
   the approach this whole repository was built in contrast to. This family
   audits their published sheets: each conjecture is re-evaluated as a
   RIGOROUS enclosure (instruments/cf/) and compared with the claimed closed
   form exactly. Survival is certified to the enclosure's width; a
   refutation would be proved — and, since their claims are conjectures by
   construction, it would also be a discovery. (Unlike the OEIS corpus,
   nothing here is curated truth: this is the right kind of audit target.)

   THE CORPUS, transcribed 2026-08-25 from the Machine's published result
   sheets (ramanujanmachine.com/results/), each held in corpus/sources/ with
   its sha256 in PINS.json and re-hashed at certify time — the certificate
   is over a byte sequence, not "the row in that sheet" (review R3):
     results_e_4614_070418.pdf   — e conjectures
     results_pi_0101_060418.pdf  — pi conjectures
     rm_zeta3.pdf                — zeta(3) table, incl. TWO marked
                                   "new and unproven"
   Sign-normalized where needed: negating every b_n of a CF negates its
   value, so all-negative-denominator sheets are stored in positive form
   with the original recorded. The zeta(3) rows are MINUS-CFs (negative
   partial numerators); the positive-tail argument does not apply to them,
   and they are decided by instruments/cf/minus.js instead: a per-row TAIL
   BAND [L(n), U(n)] proved by shift-and-check coefficient positivity,
   convergence proved inside the certificate, zeta(3) bracketed exactly
   from its defining series — including the TWO rows the Machine marks
   "new and unproven", the flagship audit targets. The battery float-checks
   every normalization against its claimed value, so a transcription error
   cannot sit quietly. */
'use strict';

const { enclose, decide } = require('#instruments/cf/cf.js');
const MINUS = require('#instruments/cf/minus.js');
const Q = require('#instruments/interval/rational.js');
const PIN = require('#instruments/pin.js');

/* build a minus-row's tail-band certificate: integer coefficient arrays in
   the corpus, exact rationals at the checker */
const bandCert = (b) => ({ N0: b.N0, L: MINUS._poly.pOfInts(b.L), U: MINUS._poly.pOfInts(b.U), depth: b.depth });

const CORPUS = [
  {
    id: 'rm-e-a', source: 'results_e_4614_070418.pdf',
    original: 'e/(-2) + 1 = 1/(-2 + 4/(-4 + 8/(-6 + 12/(-8 + 16/(-10+...)))))',
    normalized: 'e/2 - 1 = 1/(2 + 4/(4 + 8/(6 + 12/(8 + 16/(10+...)))))',
    cf: { b0: 0, a: n => (n === 1 ? 1 : 4 * (n - 1)), b: n => 2 * n },
    form: { K: 'e', u: [-1, 1], v: [1, 2], text: 'e/2 - 1' }
  },
  {
    id: 'rm-e-b', source: 'results_e_4614_070418.pdf',
    original: 'e/(-2) + 1 = 1/(-2 + 3/(-3 + 4/(-4 + 5/(-5 + 6/(-6+...)))))',
    normalized: 'e/2 - 1 = 1/(2 + 3/(3 + 4/(4 + 5/(5 + 6/(6+...)))))',
    cf: { b0: 0, a: n => (n === 1 ? 1 : n + 1), b: n => n + 1 },
    form: { K: 'e', u: [-1, 1], v: [1, 2], text: 'e/2 - 1' }
  },
  {
    id: 'rm-e-c', source: 'results_e_4614_070418.pdf',
    original: 'e + -1 = 1 + 2/(2 + 3/(3 + 4/(4 + 5/(5+...))))',
    normalized: 'same (already positive)',
    cf: { b0: 1, a: n => n + 1, b: n => n + 1 },
    form: { K: 'e', u: [-1, 1], v: [1, 1], text: 'e - 1' }
  },
  {
    id: 'rm-pi-a', source: 'results_pi_0101_060418.pdf',
    original: 'pi/(-4) = 1/(-1 + 1/(-3 + 4/(-5 + 9/(-7 + 16/(-9+...)))))',
    normalized: 'pi/4 = 1/(1 + 1/(3 + 4/(5 + 9/(7 + 16/(9+...)))))  [Brouncker]',
    cf: { b0: 0, a: n => (n === 1 ? 1 : (n - 1) * (n - 1)), b: n => 2 * n - 1 },
    form: { K: 'pi', u: [0, 1], v: [1, 4], text: 'pi/4' }
  },
  {
    id: 'rm-pi-b', source: 'results_pi_0101_060418.pdf',
    original: '(1/2)(pi/(-2) + 1) = 1/(-3 + 3/(-5 + 8/(-7 + 15/(-9 + 24/(-11+...)))))',
    normalized: 'pi/4 - 1/2 = 1/(3 + 3/(5 + 8/(7 + 15/(9 + 24/(11+...)))))',
    cf: { b0: 0, a: n => (n === 1 ? 1 : n * n - 1), b: n => 2 * n + 1 },
    form: { K: 'pi', u: [-1, 2], v: [1, 4], text: 'pi/4 - 1/2' }
  },
  /* ---- the zeta(3) table: minus-CFs, decided by the tail-band evaluator ----
     (instruments/cf/minus.js). Each row carries its polynomial coefficient
     arrays (lowest power first), the claimed form r/zeta(3), and its TAIL
     BAND certificate {N0, L, U, depth}: [L(n), U(n)] is proved to confine
     every truncated tail for n >= N0 by shift-and-check coefficient
     positivity, and the evaluator's enclosure then contains every deep
     convergent AND their limit — convergence proved inside the certificate.
     rm-z3-inv's recursion has s_n = n^3 as an EXACT spurious solution (it
     yields CF value 0), which is why its band must exclude n^3 (L = n^3+2n^2
     is sharp) and why that CF converges slowly: its enclosure needs depth
     1e7 and still honestly reports ~2e-14, while the fast rows sit at
     machine precision by depth 80. */
  {
    /* the sheet's second row, found MISSING from the first transcription
       when the corpus was re-read against the pinned bytes (2026-08-25):
       a POSITIVE CF hiding in the minus table — their b_n = 4n^6 − 2n^5 is
       positive, so the existing positive-tail evaluator decides it and only
       the closed form needs the exact zeta(3) bracket. Sheet audit now 5/5. */
    id: 'rm-z3-pos', source: 'rm_zeta3.pdf', status: 'known',
    original: '5/(2 zeta(3)) = 2 + 2*1^5*1/(2+1*3*7 + 2*2^5*3/(2+1*4*10 + ...)) ; a_n = 2+n(2+n)(4+3n), b_n = 4n^6-2n^5',
    normalized: 'same (already positive: numerators 4n^6-2n^5 > 0, denominators 2+n(2+n)(4+3n) > 0)',
    cf: { b0: 2, a: n => 4 * n ** 6 - 2 * n ** 5, b: n => 2 + n * (2 + n) * (4 + 3 * n) },
    zetaForm: { r: [5n, 2n], text: '5/(2 zeta(3))' },
    depth: 120     /* 4n^6 passes 2^53 at n=129; 120 levels is ~72 digits of convergence anyway */
  },
  {
    id: 'rm-z3-inv', source: 'rm_zeta3.pdf', status: 'known',
    original: '1/zeta(3) = 1 - 1^6/(1^3+2^3 - 2^6/(2^3+3^3 - ...)) ; a_n = n^3+(n+1)^3, b_n = -n^6',
    minusCF: true,
    spec: { b0: 1, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [1, 3, 3, 2] },
    r: [1n, 1n], formText: '1/zeta(3)',
    band: { N0: 1, L: [0, 0, 2, 1], U: [1, 3, 3, 2], depth: 10000000 }
  },
  {
    id: 'rm-z3-apery', source: 'rm_zeta3.pdf', status: 'known (Apery)',
    original: '6/zeta(3) = 5 - 1/(117 - 64/(535 - ...)) ; a_n = (2n+1)(17n(n+1)+5), b_n = -n^6',
    minusCF: true,
    spec: { b0: 5, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [5, 27, 51, 34] },
    r: [6n, 1n], formText: '6/zeta(3)',
    band: { N0: 52, L: [0, 0, 0, 33], U: [0, 0, 0, 35], depth: 60 }
  },
  {
    id: 'rm-z3-new1', source: 'rm_zeta3.pdf', status: 'NEW AND UNPROVEN',
    original: '8/(7 zeta(3)) = 1 - 1/(21 - 64/(95 - ...)) ; a_n = (2n+1)(3n(n+1)+1), b_n = -n^6',
    minusCF: true,
    spec: { b0: 1, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [1, 5, 9, 6] },
    r: [8n, 7n], formText: '8/(7 zeta(3))',
    band: { N0: 10, L: [0, 0, 0, 5], U: [0, 0, 0, 7], depth: 60 }
  },
  {
    id: 'rm-z3-new2', source: 'rm_zeta3.pdf', status: 'NEW AND UNPROVEN',
    original: '12/(7 zeta(3)) = 2 - 16/(36 - 1024/(160 - ...)) ; a_n = (2n+1)(5n(n+1)+2), b_n = -16n^6',
    minusCF: true,
    spec: { b0: 2, aPoly: [0, 0, 0, 0, 0, 0, 16], bPoly: [2, 9, 15, 10] },
    r: [12n, 7n], formText: '12/(7 zeta(3))',
    band: { N0: 16, L: [0, 0, 0, 3], U: [0, 0, 0, 11], depth: 80 }
  }
];

const N = 4000;               /* backward evaluation depth; width bottoms out at ~1e-15 long before this */

module.exports = {
  name: 'ramanujan-audit',
  statement: 'a published Ramanujan Machine conjecture re-evaluated as a rigorous enclosure and decided against the claimed closed form — survival certified to the enclosure width, refutation proved (and, for their corpus, a discovery)',
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  /* float forward evaluation — the screen's sanity number, never a verdict */
  value(o) {
    if (o.minusCF) {
      const ev = (c, n) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * n + c[i]; return s; };
      let t = ev(o.spec.bPoly, 400);
      for (let n = 399; n >= 1; n--) t = ev(o.spec.bPoly, n) - ev(o.spec.aPoly, n + 1) / t;
      return o.spec.b0 - ev(o.spec.aPoly, 1) / t;
    }
    let t = 0;
    for (let n = 200; n >= 1; n--) t = o.cf.a(n) / (o.cf.b(n) + t);
    return o.cf.b0 + t;
  },
  interesting() { return true; },
  key: (o) => o.id,
  certify(o) {
    /* the transcription certifies against the pinned bytes of the sheet it
       was read from; a drifted source refuses everything downstream */
    const pv = PIN.verify(o.source);
    if (!pv.ok) return { verdict: 'REFUSED', why: 'source pin failed for ' + o.source + ': ' + pv.why };
    const sourcePin = { file: pv.file, sha256: pv.sha256 };
    if (o.minusCF) {
      const d = MINUS.decideMinus(o.spec, Q.R(o.r[0], o.r[1]), bandCert(o.band));
      if (d.verdict === 'REFUSED') return { verdict: 'REFUSED', why: o.id + ': ' + d.why };
      const flagship = /NEW AND UNPROVEN/.test(o.status || '');
      if (d.verdict === 'REFUTED') {
        return { verdict: 'REJECT', enclosure: [d.cf[0], d.cf[1]],
          text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' — the claimed form ' + o.formText
            + ' lies provably OUTSIDE the rigorous minus-CF enclosure. The Machine\'s conjecture is FALSE. Original: ' + o.original,
          extra: { id: o.id, source: o.source, sourcePin, transcription: o.original, cf: d.cf, zeta3: d.zeta3 } };
      }
      return {
        verdict: 'HIT',
        enclosure: [d.cf[0], d.cf[1]],
        text: o.id + (flagship ? ' — a row the Machine marks NEW AND UNPROVEN — ' : ': ')
          + o.formText + ' lies inside a rigorous minus-CF enclosure of width ' + d.cfWidth.toExponential(2)
          + ' — the conjecture SURVIVES an UNCONDITIONAL audit: tail band [L(n), U(n)] proved by shift-and-check '
          + 'coefficient positivity, convergence proved inside the certificate (monotone, bounded), zeta(3) '
          + 'bracketed exactly from its defining series; equality remains open, as it must',
        extra: {
          id: o.id, source: o.source, sourcePin, status: o.status,
          transcription: o.original,
          form: o.formText, width: d.cfWidth, depth: d.N,
          band: { N0: o.band.N0, L: o.band.L.join(','), U: o.band.U.join(','), inequalities: d.checks },
          zeta3: d.zeta3,
          method: 'minus-CF backward interval evaluation from a PROVED tail band; exact-rational final comparison; no convergence theorem consumed'
        }
      };
    }
    if (o.zetaForm) {
      /* a positive CF whose claimed form speaks zeta(3): the positive-tail
         evaluator encloses, the exact zeta(3) bracket decides */
      const e = enclose(o.cf, o.depth || N);
      if (!e.ok) return { verdict: 'REFUSED', why: o.id + ': ' + e.why };
      const f = MINUS.decideZeta3Form(e.enclosure, Q.R(o.zetaForm.r[0], o.zetaForm.r[1]));
      if (f.verdict) return { verdict: 'REFUSED', why: o.id + ': ' + f.why };
      if (f.disjoint) {
        return { verdict: 'REJECT', enclosure: [e.enclosure[0], e.enclosure[1]],
          text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' — the claimed form ' + o.zetaForm.text
            + ' lies provably OUTSIDE the rigorous CF enclosure. The Machine\'s conjecture is FALSE. Original: ' + o.original,
          extra: { id: o.id, source: o.source, sourcePin, transcription: o.original, cf: e.enclosure, zeta3: f.zeta3 } };
      }
      return {
        verdict: 'HIT',
        enclosure: [e.enclosure[0], e.enclosure[1]],
        text: o.id + ': ' + o.zetaForm.text + ' lies inside a rigorous enclosure of width ' + e.width.toExponential(2)
          + ' — the conjecture SURVIVES an unconditional audit (positive-CF tail seeded by proof; zeta(3) bracketed '
          + 'exactly from its defining series; the sheet row the first transcription MISSED, restored by re-reading '
          + 'the pinned bytes); equality remains open, as it must',
        extra: { id: o.id, source: o.source, sourcePin, status: o.status,
          transcription: o.original, normalized: o.normalized,
          form: o.zetaForm.text, width: e.width, depth: o.depth || N, zeta3: f.zeta3,
          method: 'positive-CF backward interval evaluation (tail in (0, a/b] proved) + exact-rational zeta(3) bracket comparison' }
      };
    }
    const d = decide(o.cf, o.form, N);
    if (d.verdict === 'REFUTED') {
      return { verdict: 'REJECT', enclosure: [d.cf[0], d.cf[1]],
        text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' — the claimed form ' + o.form.text
          + ' lies provably OUTSIDE the rigorous CF enclosure. The Machine\'s conjecture is FALSE. Original: ' + o.original,
        extra: { id: o.id, source: o.source, sourcePin, transcription: o.original, cf: d.cf, form: d.form } };
    }
    if (d.verdict !== 'SURVIVES') return { verdict: 'REFUSED', why: d.why };
    return {
      verdict: 'HIT',
      enclosure: [d.cf[0], d.cf[1]],
      text: o.id + ': ' + o.form.text + ' lies inside a rigorous enclosure of width ' + d.width.toExponential(2)
        + ' — the conjecture SURVIVES an unconditional interval audit (tail seeded by proof, not assumption); '
        + 'equality remains open, as it must',
      extra: {
        id: o.id, source: o.source, sourcePin,
        transcription: o.original, normalized: o.normalized,
        form: o.form.text, width: d.width, depth: N,
        method: 'positive-CF backward interval evaluation; tail in (0, a/b] proved; outward rounding throughout'
      }
    };
  }
};
