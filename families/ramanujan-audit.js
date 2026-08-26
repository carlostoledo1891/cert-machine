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

/* ==== the 2020-2022 sheets: Catalan G (23 rows), pi^2 (12), ln 2 (1) ======
   Transcribed 2026-08-25 from the pinned PDFs rm_catalan.pdf, rm_zeta2.pdf,
   rm_other.pdf (each re-hashed at certify time). Claimed forms are Möbius
   in ONE constant, (p + qK)/(s + tK), decided exactly by
   instruments/cf/forms.js against certified constant brackets from
   instruments/bigfloat/constants.js (pi^2 and acosh(2) at 2e-47, ln 2 at
   7e-49, Catalan's G from its defining series with a PROVED convexity tail
   at 1.2e-18). Every minus row carries a proved tail band with U(n) = b(n)
   — terminal containment and (I+) are then identities — and a searched
   quadratic L(n), both re-proved by shift-and-check at certify time.

   kind 'headshift': three pi^2 rows have a(1) < 0 (e.g. 16/(4+pi^2) =
   1 - (-1)/(7 - 8/(...))), outside the minus-CF hypotheses. Exact algebra
   moves the head aside: with x = b0 + c/y, c = -a(1) > 0, the shifted
   spec for y satisfies the hypotheses and the claimed form transforms to
   another Möbius (forms.headShiftMobius); deciding y decides x.

   kind 'pos': two pi^2 rows are positive CFs, evaluated by cf.js.

   SIGN-DEFINITE NEGATIVE HEADS: six Catalan rows have genuinely negative
   head tails (2/(2G-1) = 1 - 4/y forces y < 0). The minus evaluator now
   certifies sign-definiteness instead of positivity at head levels —
   see the argument note in minus.js; the battery pins both directions. */
const S2 = (id, source, status, K, form, b0, a, b, band, kind) =>
  ({ sheet: 2, id, source, status, K, form, b0, a, b, band, kind });
const CAT = (id, form, b0, b, a, band) => S2(id, 'rm_catalan.pdf', 'NEW AND UNPROVEN', 'G', form, b0, a, b, band);
const Z2 = (id, status, form, b0, b, a, band, kind) => S2(id, 'rm_zeta2.pdf', status, 'pi2', form, b0, a, b, band, kind);

const SHEET2 = [
  /* Catalan: the known two-constant row, then the 22 new ones */
  S2('rm-cat-known', 'rm_catalan.pdf', 'known', 'catalanE', { p: 6, t: 1 },
    2, [0, -2, 12, -24, 16], [2, 7, 10], { N0: 1, L: [5, -12, 8], depth: 60 }),
  CAT('rm-cat-01', { p: 1, t: 2 },          1, [1, 3, 3],   [0, 0, 0, 0, 2],    { N0: 1, L: [0, -1, 2], depth: 60 }),
  CAT('rm-cat-02', { p: 2, s: -1, t: 2 },   1, [1, 3, 3],   [0, 0, 0, 2, 2],    { N0: 3, L: [-9, 0, 2], depth: 240 }),
  CAT('rm-cat-03', { p: 24, s: -11, t: 18 },1, [1, 3, 3],   [0, 0, 0, 4, 2],    { N0: 12, L: [-12, -5, 2], depth: 240 }),
  CAT('rm-cat-04', { p: 720, s: -299, t: 450 }, 1, [1, 3, 3], [0, 0, 0, 6, 2],  { N0: 20, L: [-12, -9, 2], depth: 240 }),
  CAT('rm-cat-05', { p: 2, s: -1, t: 2 },   3, [3, 7, 3],   [0, 0, 0, 4, 2],    { N0: 1, L: [6, -3, 2], depth: 60 }),
  CAT('rm-cat-06', { p: 4, s: 1, t: 2 },    3, [3, 7, 3],   [0, 0, 4, 6, 2],    { N0: 1, L: [-2, 1, 2], depth: 60 }),
  CAT('rm-cat-07', { p: 16, s: -1, t: 6 },  3, [3, 7, 3],   [0, 0, 8, 8, 2],    { N0: 4, L: [-11, 2, 2], depth: 240 }),
  CAT('rm-cat-08', { p: 288, s: -31, t: 90 }, 3, [3, 7, 3], [0, 0, 12, 10, 2],  { N0: 14, L: [-12, -4, 2], depth: 240 }),
  CAT('rm-cat-09', { p: 1, s: 2, t: -2 },   7, [7, 9, 3],   [0, 2, 6, 6, 2],    { N0: 1, L: [9, -4, 2], depth: 60 }),
  CAT('rm-cat-10', { p: 24, s: -11, t: 18 },5, [5, 11, 3],  [0, 0, 0, 8, 2],    { N0: 1, L: [7, -4, 2], depth: 60 }),
  CAT('rm-cat-11', { p: 16, s: -1, t: 6 },  5, [5, 11, 3],  [0, 0, 8, 10, 2],   { N0: 1, L: [6, -1, 2], depth: 60 }),
  CAT('rm-cat-12', { p: 64, s: 13, t: 18 }, 5, [5, 11, 3],  [0, 0, 16, 12, 2],  { N0: 1, L: [-2, 3, 2], depth: 60 }),
  CAT('rm-cat-13', { p: 4, s: -5, t: 6 },   9, [9, 11, 3],  [0, 0, 8, 8, 2],    { N0: 1, L: [8, -4, 2], depth: 60 }),
  CAT('rm-cat-14', { p: 8, s: 3, t: -2 },   9, [9, 11, 3],  [0, 8, 16, 10, 2],  { N0: 1, L: [6, -1, 2], depth: 60 }),
  CAT('rm-cat-15', { p: 32, s: 5, t: 2 },   9, [9, 11, 3],  [0, 16, 24, 12, 2], { N0: 1, L: [2, 3, 2], depth: 60 }),
  CAT('rm-cat-16', { p: 192, s: 13, t: 18 },9, [9, 11, 3],  [0, 24, 32, 14, 2], { N0: 7, L: [-12, 3, 2], depth: 240 }),
  CAT('rm-cat-17', { p: 6, s: 17, t: -18 }, 13, [13, 13, 3],[0, 6, 14, 10, 2],  { N0: 1, L: [9, -4, 2], depth: 60 }),
  CAT('rm-cat-18', { p: 48, s: -79, t: 90 },15, [15, 15, 3],[0, 0, 16, 12, 2],  { N0: 1, L: [8, -4, 2], depth: 60 }),
  CAT('rm-cat-19', { p: 32, s: 19, t: -18 },15, [15, 15, 3],[0, 16, 28, 14, 2], { N0: 1, L: [10, -3, 2], depth: 60 }),
  CAT('rm-cat-20', { p: 128, s: 17, t: -6 },15, [15, 15, 3],[0, 32, 40, 16, 2], { N0: 1, L: [6, 1, 2], depth: 60 }),
  CAT('rm-cat-21', { p: 8, s: -49, t: 54 }, 19, [19, 15, 3],[0, 16, 24, 12, 2], { N0: 1, L: [10, -4, 2], depth: 60 }),
  CAT('rm-cat-22', { p: 12, s: 83, t: -90 },23, [23, 17, 3],[0, 18, 30, 14, 2], { N0: 1, L: [10, -4, 2], depth: 60 }),
  /* pi^2 */
  Z2('rm-z2-known', 'known', { p: 30, t: 1 }, 3, [3, 11, 11], [0, 0, 0, 0, 1], null, 'pos'),
  Z2('rm-z2-proven1', 'new and PROVEN (Kadyrov-Orynbassar arXiv:2103.03554)', { p: 8, t: 1 },
    1, [1, 3, 3], [0, 0, 0, -1, 2], { N0: 1, L: [2, -3, 2], depth: 60 }),
  Z2('rm-z2-new1', 'NEW AND UNPROVEN', { p: 16, s: 4, t: 1 }, 1, [1, 3, 3], [0, 0, 0, -3, 2],
    { N0: 1, L: [6, -4, 2], depth: 60 }, 'headshift'),
  Z2('rm-z2-new2', 'NEW AND UNPROVEN', { p: 24, t: 1 }, 2, [2, 7, 7], [0, 0, 0, 0, 8], null, 'pos'),
  Z2('rm-z2-proven2', 'new and PROVEN (Kadyrov-Orynbassar arXiv:2103.03554)', { p: 18, t: 1 },
    2, [2, 6, 5], [0, 0, 0, -2, 4], { N0: 1, L: [5, -8, 4], depth: 60 }),
  Z2('rm-z2-new3', 'NEW AND UNPROVEN', { p: 16, s: -4, t: 1 }, 3, [3, 7, 3], [0, 0, -2, 3, 2], { N0: 1, L: [5, -4, 2], depth: 60 }),
  Z2('rm-z2-new4', 'NEW AND UNPROVEN', { p: 32, t: 1 }, 3, [3, 7, 3], [0, 0, -6, 1, 2],
    { N0: 1, L: [6, -4, 2], depth: 60 }, 'headshift'),
  Z2('rm-z2-new5', 'NEW AND UNPROVEN', { p: 16, s: -8, t: 1 }, 9, [9, 11, 3], [0, -4, 4, 7, 2], { N0: 1, L: [5, -4, 2], depth: 60 }),
  Z2('rm-z2-new6', 'NEW AND UNPROVEN', { p: 16, s: 12, t: -1 }, 9, [9, 11, 3], [0, 4, 12, 9, 2], { N0: 1, L: [8, -3, 2], depth: 60 }),
  Z2('rm-z2-new7', 'NEW AND UNPROVEN', { p: 32, s: 32, t: -3 }, 15, [15, 15, 3], [0, 8, 22, 13, 2], { N0: 1, L: [8, -3, 2], depth: 60 }),
  Z2('rm-z2-new8', 'NEW AND UNPROVEN', { p: 16, q: 3, s: 16, t: -1 }, 7, [7, 9, 3], [-3, -7, -3, 3, 2],
    { N0: 1, L: [7, -4, 2], depth: 60 }, 'headshift'),
  Z2('rm-z2-new9', 'NEW AND UNPROVEN', { p: 18, s: -8, t: 1 }, 10, [10, 14, 5], [0, 0, 0, 6, 4], { N0: 1, L: [5, -8, 4], depth: 60 }),
  /* ln 2 */
  S2('rm-ln2', 'rm_other.pdf', 'NEW AND UNPROVEN', 'ln2', { p: 1, s: 1, t: -1 },
    4, [0, 0, 2, 4, 2], [4, 7, 3], { N0: 1, L: [6, -3, 2], depth: 60 })
];

/* ==== sheet 3: the mixed-zeta-orders table (July 2022) =====================
   Transcribed 2026-08-26 from the pinned rm_zeta_orders.pdf — five rows, all
   "new and unproven", all minus-CFs with a_n = -n^{2k} (RM sign convention;
   stored here as positive minus-CF numerators n^{2k}) and deg b = k. Every
   row has the (c-1)^2 DOUBLE ROOT (b ~ 2n^k, a ~ n^{2k}), the rm-z3-inv
   pathology: the tail ansatz s_n = n^k + alpha n^{k-1} + ... leaves alpha
   undetermined at first order and a QUADRATIC at second order — for these
   rows alpha^2 - (k-1) alpha + (C(k,2) - b_{k-2}) = 0 factors over Z, giving
   a true branch alpha+ and a spurious branch alpha-:
       row 1: (4, -1) | rows 2, 3: (6, -2) | row 4: (8, -4) | row 5: (8, -2).
   The proved band is SHARP from below at the true branch: L = n^k +
   alpha+ n^{k-1}, U = b(n), N0 = 1 — shift-and-check passes for all five.

   THE SHEET'S ROW 3 IS FALSE AS PRINTED. Its printed LHS 2/(2z(5)-2z(3)-1)
   is ~ -1.5035, but the CF defined by the row's own polynomials converges to
   ~ 2.98623 = 2/(2z(5)-2z(3)+1): a sign slip in the printed constant term.
   (The printed convergent display also shows a_1 = 275 where the row's own
   a_n polynomial gives 75, and reuses n^8 numerators on rows whose b_n is
   -n^10/-n^14 — the polynomial column is the object; the display is not.)
   Both directions are recorded: the row AS PRINTED (expected REJECT — a
   certified refutation of a printed Ramanujan Machine row) and the CORRECTED
   identity (expected HIT).

   Constants: zeta(3) from its defining series (zeta3Bracket, K = 6000);
   zeta(5), zeta(7) from the SAME convexity-tail argument generalized
   (zetaBracket, K = 2000; widths 3.3e-21 / 1.1e-27); zeta(2) = pi^2/6 and
   zeta(4) = pi^4/90 via the certified bigfloat Machin enclosure — Euler's
   proved identities, consumed the way acosh(2) is in sheet 2, and the
   battery holds the series route and the pi route in mutual containment. */
const S3 = (id, status, form, b0, b, k, alphaPlus, expect) => ({
  sheet: 3, id, source: 'rm_zeta_orders.pdf', status, form, b0, b, k, alphaPlus, expect,
  band: { N0: 1, depth: 200000 }
});
/* form: value = p / (sum of c*zeta(s) + c0); terms = [[c, s], ...] */
const SHEET3 = [
  S3('rm-zo-z4z2', 'NEW AND UNPROVEN', { p: -1, terms: [[1, 4], [4, 2]], c0: -8, text: '-1/(zeta(4) + 4 zeta(2) - 8)' },
    3, [3, 8, 10, 4, 2], 4, 4),
  S3('rm-zo-z5z3a', 'NEW AND UNPROVEN', { p: 2, terms: [[2, 5], [6, 3]], c0: -9, text: '2/(2 zeta(5) + 6 zeta(3) - 9)' },
    7, [7, 23, 28, 22, 5, 2], 5, 6),
  S3('rm-zo-z5z3b-printed', 'NEW AND UNPROVEN — AS PRINTED', { p: 2, terms: [[2, 5], [-2, 3]], c0: -1, text: '2/(2 zeta(5) - 2 zeta(3) - 1)  [as printed]' },
    3, [3, 15, 28, 22, 5, 2], 5, 6, 'REJECT'),
  S3('rm-zo-z5z3b-corrected', 'NEW AND UNPROVEN — SIGN-CORRECTED', { p: 2, terms: [[2, 5], [-2, 3]], c0: 1, text: '2/(2 zeta(5) - 2 zeta(3) + 1)  [corrected: printed -1 is a sign slip]' },
    3, [3, 15, 28, 22, 5, 2], 5, 6),
  S3('rm-zo-z5z3c', 'NEW AND UNPROVEN', { p: 64, terms: [[64, 5], [176, 3]], c0: -273, text: '64/(64 zeta(5) + 176 zeta(3) - 273)' },
    13, [13, 45, 58, 42, 5, 2], 5, 8),
  S3('rm-zo-z7z3', 'NEW AND UNPROVEN', { p: 1, terms: [[1, 7], [-4, 3]], c0: 4, text: '1/(zeta(7) - 4 zeta(3) + 4)' },
    5, [5, 31, 77, 99, 75, 37, 7, 2], 7, 8)
];

/* exact rational bracket of one zeta value, by source */
function zetaValueBracket(s) {
  if (s === 3) { const z = MINUS.zeta3Bracket(6000); return { lo: z.lo, hi: z.hi, how: 'defining series, K=6000, convexity tail' }; }
  if (s === 5 || s === 7) { const z = MINUS.zetaBracket(s, 2000); return { lo: z.lo, hi: z.hi, how: 'defining series, K=2000, convexity tail' }; }
  if (s === 2 || s === 4) {
    const B = require('#instruments/bigfloat/bigfloat.js');
    const F = require('#instruments/bigfloat/functions.js');
    const pi = F.pi(192);
    const iv = s === 2 ? B.div(B.mul(pi, pi, 192), B.fromInt(6), 192)
      : B.div(B.mul(B.mul(pi, pi, 192), B.mul(pi, pi, 192), 192), B.fromInt(90), 192);
    const toF = (v) => (v.e >= 0 ? [v.m << BigInt(v.e), 1n] : [v.m, 1n << BigInt(-v.e)]);
    return { lo: toF(iv.lo), hi: toF(iv.hi), how: 'pi^' + s + '/' + (s === 2 ? 6 : 90) + ' from the certified Machin enclosure (Euler, proved)' };
  }
  throw new Error('zetaValueBracket: unsupported s = ' + s);
}

function certifySheet3(o, sourcePin) {
  const FR = MINUS._frac;
  const P = MINUS._poly;
  /* the CF enclosure: sharp lower band at the true branch, U(n) = b(n) */
  const aPoly = new Array(2 * o.k + 1).fill(0); aPoly[2 * o.k] = 1;
  const L = new Array(o.k + 1).fill(0); L[o.k] = 1; L[o.k - 1] = o.alphaPlus;
  const spec = { b0: o.b0, aPoly, bPoly: o.b };
  const cert = { N0: o.band.N0, L: P.pOfInts(L), U: P.pOfInts(o.b) };
  const e = MINUS.encloseMinus(spec, cert, o.band.depth);
  if (!e.ok) return { verdict: 'REFUSED', why: o.id + ': ' + e.why };

  /* the claimed value, bracketed in exact rationals: p / (sum c*zeta(s) + c0) */
  let Dlo = [BigInt(o.form.c0), 1n], Dhi = [BigInt(o.form.c0), 1n];
  const constants = [];
  for (const [c, s] of o.form.terms) {
    const z = zetaValueBracket(s);
    constants.push({ s, how: z.how, width: FR.fToDouble(FR.fSub(z.hi, z.lo)) });
    const C = [BigInt(c), 1n];
    if (c >= 0) { Dlo = FR.fAdd(Dlo, [C[0] * z.lo[0], z.lo[1]]); Dhi = FR.fAdd(Dhi, [C[0] * z.hi[0], z.hi[1]]); }
    else { Dlo = FR.fAdd(Dlo, [C[0] * z.hi[0], z.hi[1]]); Dhi = FR.fAdd(Dhi, [C[0] * z.lo[0], z.lo[1]]); }
  }
  const sgn = (x) => (x[0] < 0n ? -1 : x[0] > 0n ? 1 : 0);
  if (sgn(Dlo) * sgn(Dhi) <= 0) return { verdict: 'REFUSED', why: o.id + ': denominator bracket straddles 0 — no finite form value certifiable' };
  const p = BigInt(o.form.p);
  /* p/D over a sign-definite D: endpoints are p/Dhi and p/Dlo, ordered by sign */
  const inv = (x) => [x[0] < 0n ? -x[1] : x[1], x[0] < 0n ? -x[0] : x[0]];   /* 1/x with positive denominator */
  const cands = [[p * inv(Dlo)[0], inv(Dlo)[1]], [p * inv(Dhi)[0], inv(Dhi)[1]]];
  const formLo = FR.fCmp(cands[0], cands[1]) <= 0 ? cands[0] : cands[1];
  const formHi = FR.fCmp(cands[0], cands[1]) <= 0 ? cands[1] : cands[0];

  const cfLoQ = Q.fromDouble(e.enclosure[0]), cfHiQ = Q.fromDouble(e.enclosure[1]);
  const disjoint = FR.fCmp([cfHiQ.n, cfHiQ.d], formLo) < 0 || FR.fCmp(formHi, [cfLoQ.n, cfLoQ.d]) < 0;
  const formWidth = FR.fToDouble(FR.fSub(formHi, formLo));
  const flagship = /NEW AND UNPROVEN/.test(o.status || '');
  const extra = {
    id: o.id, source: o.source, sourcePin, status: o.status,
    form: o.form.text, cf: e.enclosure, width: e.width, formWidth,
    band: { N0: o.band.N0, L: L.join(','), U: 'b(n)', depth: o.band.depth, inequalities: e.checks },
    doubleRoot: 'b ~ 2n^' + o.k + ', a ~ n^' + (2 * o.k) + ' => (c-1)^2; sub-leading quadratic factors over Z, true branch alpha+ = ' + o.alphaPlus,
    constants,
    method: 'minus-CF backward interval evaluation from a PROVED sharp tail band; claimed value bracketed in exact rationals from certified zeta brackets; final comparison exact'
  };
  if (disjoint) {
    return { verdict: 'REJECT', enclosure: [e.enclosure[0], e.enclosure[1]],
      text: 'CERTIFIED REFUTATION of a printed Ramanujan Machine row: ' + o.id + ' — the printed form ' + o.form.text
        + ' lies provably OUTSIDE the rigorous minus-CF enclosure [' + e.enclosure[0] + ', ' + e.enclosure[1] + ']. '
        + (o.id === 'rm-zo-z5z3b-printed'
          ? 'Mechanism identified: a sign slip in the printed constant term — the CF defined by the row\'s own polynomials equals 2/(2 zeta(5) - 2 zeta(3) + 1), certified as rm-zo-z5z3b-corrected; the printed convergent display (a_1 = 275) also contradicts the row\'s own a_n polynomial (a_1 = 75).'
          : 'The Machine\'s printed identity is false.'),
      extra };
  }
  if (o.expect === 'REJECT') {
    return { verdict: 'REFUSED', why: o.id + ': expected a refutation but the form bracket intersects the enclosure — transcription or expectation is wrong; investigate before recording anything' };
  }
  return { verdict: 'HIT', enclosure: [e.enclosure[0], e.enclosure[1]],
    text: o.id + (flagship ? ' — a row the Machine marks NEW AND UNPROVEN — ' : ': ') + o.form.text
      + ' lies inside a rigorous minus-CF enclosure of width ' + e.width.toExponential(2)
      + ' (form bracket width ' + formWidth.toExponential(2) + ') — the conjecture SURVIVES an UNCONDITIONAL audit: '
      + 'sharp tail band at the true (c-1)^2 branch proved by shift-and-check, convergence proved inside the certificate, '
      + 'zeta values bracketed exactly; final comparison in exact rationals; equality remains open, as it must',
    extra };
}

const KSYM = { pi2: 'pi^2', G: 'G', ln2: 'log(2)', catalanE: '(8G - pi*acosh(2))' };
function fmtForm(f, K) {
  const sym = KSYM[K];
  const lin = (c0, c1) => {
    const parts = [];
    if (c1) parts.push((c1 === 1 ? '' : c1 === -1 ? '-' : c1) + sym);
    if (c0) parts.push((c0 > 0 && parts.length ? '+ ' : '') + c0);
    return parts.join(' ') || '0';
  };
  const num = lin(f.p || 0, f.q || 0), den = lin(f.s || 0, f.t || 0);
  return ((f.q || 0) !== 0 ? '(' + num + ')' : num) + '/(' + den + ')';
}

const evalIntPoly = (c, n) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * n + c[i]; return s; };
const shiftInt = (arr) => MINUS._poly.pShift(MINUS._poly.pOfInts(arr), 1).map(q => {
  if (q.d !== 1n) throw new Error('shifted polynomial not integer');
  return Number(q.n);
});

function sheet2Value(o) {
  const pos = o.kind === 'pos';
  let t = evalIntPoly(o.b, 501);
  for (let n = 500; n >= 1; n--) t = pos ? evalIntPoly(o.b, n) + evalIntPoly(o.a, n + 1) / t
                                         : evalIntPoly(o.b, n) - evalIntPoly(o.a, n + 1) / t;
  return pos ? o.b0 + evalIntPoly(o.a, 1) / t : o.b0 - evalIntPoly(o.a, 1) / t;
}

function certifySheet2(o, sourcePin) {
  const FORMS = require('#instruments/cf/forms.js');
  const CONSTS = require('#instruments/bigfloat/constants.js');
  const P = MINUS._poly;
  const KB = CONSTS.bracket(o.K, 192);
  const K = { lo: KB.lo, hi: KB.hi };
  const formText = fmtForm(o.form, o.K);
  const flagship = /NEW AND UNPROVEN/.test(o.status || '');

  let enc, width, method, checks = null, decidedForm = o.form, decidedAgainst = 'x';
  if (o.kind === 'pos') {
    const e = enclose({ b0: o.b0, a: (n) => evalIntPoly(o.a, n), b: (n) => evalIntPoly(o.b, n) }, N);
    if (!e.ok) return { verdict: 'REFUSED', why: o.id + ': ' + e.why };
    enc = e.enclosure; width = e.width;
    method = 'positive-CF backward interval evaluation (tail in (0, a/b] proved)';
  } else if (o.kind === 'headshift') {
    const a1 = evalIntPoly(o.a, 1);
    if (a1 >= 0) return { verdict: 'REFUSED', why: o.id + ': headshift row but a(1) >= 0' };
    const as = shiftInt(o.a), bs = shiftInt(o.b);
    const spec = { b0: bs[0], aPoly: as, bPoly: bs };
    const cert = { N0: o.band.N0, L: P.pOfInts(o.band.L), U: P.pOfInts(bs) };
    const e = MINUS.encloseMinus(spec, cert, o.band.depth);
    if (!e.ok) return { verdict: 'REFUSED', why: o.id + ': ' + e.why };
    enc = e.enclosure; width = e.width; checks = e.checks;
    decidedForm = FORMS.headShiftMobius(o.form, o.b0, -a1);
    decidedAgainst = 'y (x = ' + o.b0 + ' + ' + (-a1) + '/y — a(1) < 0 moved aside by exact algebra; deciding y decides x)';
    method = 'head-shifted minus-CF: shifted spec satisfies a(n) > 0, tail band proved, claimed form transformed exactly';
  } else {
    const spec = { b0: o.b0, aPoly: o.a, bPoly: o.b };
    const cert = { N0: o.band.N0, L: P.pOfInts(o.band.L), U: P.pOfInts(o.b) };
    const e = MINUS.encloseMinus(spec, cert, o.band.depth);
    if (!e.ok) return { verdict: 'REFUSED', why: o.id + ': ' + e.why };
    enc = e.enclosure; width = e.width; checks = e.checks;
    method = 'minus-CF backward interval evaluation from a PROVED tail band (U(n) = b(n): terminal containment and (I+) are identities)';
  }

  const d = FORMS.decideForm(enc, decidedForm, K);
  if (d.verdict === 'REFUSED') return { verdict: 'REFUSED', why: o.id + ': ' + d.why };
  const extra = {
    id: o.id, source: o.source, sourcePin, status: o.status,
    form: formText, K: o.K, Kwidth: KB.width, cf: enc, width,
    band: o.band ? { N0: o.band.N0, L: o.band.L.join(','), U: 'b(n)', depth: o.band.depth, inequalities: checks } : null,
    decidedAgainst, method,
    constant: o.K === 'G' ? 'Catalan G from its defining series; convexity tail PROVED (96k^2+288k+184 >= 0)' :
      o.K === 'catalanE' ? '8G - pi*acosh(2), each factor a certified bracket' :
      o.K === 'pi2' ? 'pi^2 from the Machin enclosure, squared' : 'ln 2 from the atanh series'
  };
  if (d.disjoint) {
    return { verdict: 'REJECT', enclosure: [enc[0], enc[1]],
      text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' — the claimed form ' + formText
        + ' lies provably OUTSIDE the rigorous CF enclosure. The Machine\'s conjecture is FALSE.',
      extra };
  }
  return { verdict: 'HIT', enclosure: [enc[0], enc[1]],
    text: o.id + (flagship ? ' — a row the Machine marks NEW AND UNPROVEN — ' : ': ') + formText
      + ' lies inside a rigorous enclosure of width ' + width.toExponential(2)
      + ' — the conjecture SURVIVES an UNCONDITIONAL audit (' + method + '; constant bracket width '
      + KB.width.toExponential(1) + '; final comparison in exact rationals); equality remains open, as it must',
    extra };
}

module.exports = {
  name: 'ramanujan-audit',
  statement: 'a published Ramanujan Machine conjecture re-evaluated as a rigorous enclosure and decided against the claimed closed form — survival certified to the enclosure width, refutation proved (and, for their corpus, a discovery)',
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i]
    : i < CORPUS.length + SHEET2.length ? SHEET2[i - CORPUS.length]
    : i < CORPUS.length + SHEET2.length + SHEET3.length ? SHEET3[i - CORPUS.length - SHEET2.length] : null),
  /* float forward evaluation — the screen's sanity number, never a verdict */
  value(o) {
    if (o.sheet === 3) {
      let t = evalIntPoly(o.b, 2001);
      for (let n = 2000; n >= 1; n--) t = evalIntPoly(o.b, n) - Math.pow(n + 1, 2 * o.k) / t;
      return o.b0 - 1 / t;
    }
    if (o.sheet === 2) return sheet2Value(o);
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
    if (o.sheet === 3) return certifySheet3(o, sourcePin);
    if (o.sheet === 2) return certifySheet2(o, sourcePin);
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
