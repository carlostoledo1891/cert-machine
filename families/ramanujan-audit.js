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
   sheets (ramanujanmachine.com/results/):
     results_e_4614_070418.pdf   — e conjectures
     results_pi_0101_060418.pdf  — pi conjectures
     zeta3.pdf                   — zeta(3) table, incl. TWO marked
                                   "new and unproven"
   Sign-normalized where needed: negating every b_n of a CF negates its
   value, so all-negative-denominator sheets are stored in positive form
   with the original recorded. The zeta(3) rows are MINUS-CFs (negative
   partial numerators); the positive-tail argument does not apply to them,
   so they are REFUSED pending a verified tail-lemma evaluator — recorded
   work, not a silent gap. The battery float-checks every normalization
   against its claimed value, so a transcription error cannot sit quietly. */
'use strict';

const { enclose, decide } = require('#instruments/cf/cf.js');

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
  /* ---- the zeta(3) table: minus-CFs, the recorded next target ---- */
  {
    id: 'rm-z3-inv', source: 'zeta3.pdf', status: 'known',
    original: '1/zeta(3) = 1 - 1^6/(1^3+2^3 - 2^6/(2^3+3^3 - ...)) ; a_n = n^3+(n+1)^3, b_n = -n^6',
    minusCF: true
  },
  {
    id: 'rm-z3-apery', source: 'zeta3.pdf', status: 'known (Apery)',
    original: '6/zeta(3) = 5 - 1/(117 - 64/(535 - ...)) ; a_n = (2n+1)(17n(n+1)+5), b_n = -n^6',
    minusCF: true
  },
  {
    id: 'rm-z3-new1', source: 'zeta3.pdf', status: 'NEW AND UNPROVEN',
    original: '8/(7 zeta(3)) = 1 - 1/(21 - 64/(95 - ...)) ; a_n = (2n+1)(3n(n+1)+1), b_n = -n^6',
    minusCF: true
  },
  {
    id: 'rm-z3-new2', source: 'zeta3.pdf', status: 'NEW AND UNPROVEN',
    original: '12/(7 zeta(3)) = 2 - 16/(36 - 1024/(160 - ...)) ; a_n = (2n+1)(5n(n+1)+2), b_n = -16n^6',
    minusCF: true
  }
];

const N = 4000;               /* backward evaluation depth; width bottoms out at ~1e-15 long before this */

module.exports = {
  name: 'ramanujan-audit',
  statement: 'a published Ramanujan Machine conjecture re-evaluated as a rigorous enclosure and decided against the claimed closed form — survival certified to the enclosure width, refutation proved (and, for their corpus, a discovery)',
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  /* float forward evaluation — the screen's sanity number, never a verdict */
  value(o) {
    if (o.minusCF) return 0;
    let t = 0;
    for (let n = 200; n >= 1; n--) t = o.cf.a(n) / (o.cf.b(n) + t);
    return o.cf.b0 + t;
  },
  interesting() { return true; },
  key: (o) => o.id,
  certify(o) {
    if (o.minusCF) {
      return { verdict: 'REFUSED',
        why: o.id + ' (' + (o.status || '') + '): minus-CF — negative partial numerators; the positive-tail enclosure does not apply. Needs the verified tail-lemma evaluator (recorded next step). Original: ' + o.original };
    }
    const d = decide(o.cf, o.form, N);
    if (d.verdict === 'REFUTED') {
      return { verdict: 'REJECT', enclosure: [d.cf[0], d.cf[1]],
        text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' — the claimed form ' + o.form.text
          + ' lies provably OUTSIDE the rigorous CF enclosure. The Machine\'s conjecture is FALSE. Original: ' + o.original,
        extra: { id: o.id, source: o.source, cf: d.cf, form: d.form } };
    }
    if (d.verdict !== 'SURVIVES') return { verdict: 'REFUSED', why: d.why };
    return {
      verdict: 'HIT',
      enclosure: [d.cf[0], d.cf[1]],
      text: o.id + ': ' + o.form.text + ' lies inside a rigorous enclosure of width ' + d.width.toExponential(2)
        + ' — the conjecture SURVIVES an unconditional interval audit (tail seeded by proof, not assumption); '
        + 'equality remains open, as it must',
      extra: {
        id: o.id, source: o.source,
        original: o.original, normalized: o.normalized,
        form: o.form.text, width: d.width, depth: N,
        method: 'positive-CF backward interval evaluation; tail in (0, a/b] proved; outward rounding throughout'
      }
    };
  }
};
