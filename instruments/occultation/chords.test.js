/* chords.test.js — node experiments/occultation/chords.test.js
   Answers known before running. The envelope decides a published diameter, so
   it is checked against shapes whose areas are known exactly. */
'use strict';
const C = require('./chords.js');
const Q = require('../interval/rational.js');
let fail = 0;
const ok = (n, c, got) => { if (!c) fail++; console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${c ? '' : '   got ' + JSON.stringify(got)}`); };
const near = (a, b, t) => Math.abs(a - b) <= t;

/* ---- rational input is exact -------------------------------------------- */
{
  ok('q parses a decimal exactly', C.qs(C.q('102.5')) === '205/2', C.qs(C.q('102.5')));
  ok('q handles a negative and an integer', C.qs(C.q('-34.1')) === '-341/10' && C.qs(C.q('7')) === '7');
  ok('areaUnder is exact on a unit triangle',
    C.qs(C.areaUnder([[C.q(0), C.q(0)], [C.q(1), C.q(2)], [C.q(2), C.q(0)]])) === '2');
}

/* ---- THE ANCHOR: a convex polygon sampled at its own vertex heights ------
   For a convex body the chord length w(y) is piecewise linear between the
   heights of its vertices, so sampling there and joining the dots must give the
   area EXACTLY — and with zero measurement error the certified interval must
   collapse onto it. */
{
  /* a hexagon: w = 0 at y=0, 10 at y=2, 14 at y=5, 6 at y=8, 0 at y=9 */
  const chords = [{ y: '2', len: '10', err: '0' }, { y: '5', len: '14', err: '0' }, { y: '8', len: '6', err: '0' }];
  const P = C.prepare(chords, ['0', '9'], { nsig: 0 });
  const lo = C.lowerBound(P), hi = C.upperBound(P), jd = C.joinTheDots(P);
  /* true area of the polygon whose width function is that polyline */
  const truth = (2 * 10 / 2) + (3 * (10 + 14) / 2) + (3 * (14 + 6) / 2) + (1 * 6 / 2);
  ok('join the dots reproduces the polygon area exactly', C.qs(jd.area) === String(truth), [C.qs(jd.area), truth]);
  ok('  and the polyline is concave', jd.concave);
  ok('lower bound never exceeds the truth', C.qn(lo.area) <= truth + 1e-12, C.qn(lo.area));
  ok('upper bound is never below the truth', C.qn(hi.area) >= truth - 1e-12, C.qn(hi.area));
  /* THE FLOOR IS THE HULL OF THE CHORDS, NOT THE WHOLE POLYGON. Nothing forces
     the body to reach the negative stations: it may end flush with its outermost
     chord, giving a flat edge, which is a perfectly good convex body. So the
     floor omits the two tails, and "join the dots" — which draws them in — is
     NOT a lower bound but already an assumption. */
  const hullOnly = truth - (2 * 10 / 2) - (1 * 6 / 2);
  ok('the FLOOR is exactly the convex hull of the chords, tails excluded',
    near(C.qn(lo.area), hullOnly, 1e-9), [C.qn(lo.area), hullOnly]);
  ok('  join the dots is larger, because it assumes the body reaches the negatives',
    C.qn(jd.area) > C.qn(lo.area), [C.qn(jd.area), C.qn(lo.area)]);
  /* the ceiling is NOT tight here and must not be: sampling w at a set of
     heights does not pin it between them, and a convex body may bulge above the
     chord. Asserting tightness was this test's own error. */
  ok('  the ceiling is strictly above it, because a body may bulge between chords',
    C.qn(hi.area) > truth * 1.05, C.qn(hi.area) / truth);
}

/* ---- a circle: the envelope must contain pi R^2 -------------------------- */
{
  const R = 100;
  const ys = [-80, -50, -20, 0, 30, 60, 85];
  const chords = ys.map(y => ({ y: String(y), len: (2 * Math.sqrt(R * R - y * y)).toFixed(6), err: '0' }));
  const P = C.prepare(chords, ['-100', '100'], { nsig: 0 });
  const lo = C.lowerBound(P), hi = C.upperBound(P);
  const truth = Math.PI * R * R;
  ok('circle: the certified interval contains pi R^2',
    C.qn(lo.area) <= truth && truth <= C.qn(hi.area), [C.qn(lo.area), truth, C.qn(hi.area)]);
  /* 7 slices inscribe about 90% of a circle; the interesting fact is that
     refining the sampling drives the floor to the truth. */
  ok('  7 slices inscribe about 90% of the circle', C.qn(lo.area) / truth > 0.89 && C.qn(lo.area) / truth < 0.93, C.qn(lo.area) / truth);
  const fine = [];
  for (let i = -95; i <= 95; i += 5) fine.push({ y: String(i), len: (2 * Math.sqrt(R * R - i * i)).toFixed(6), err: '0' });
  const PF = C.prepare(fine, ['-100', '100'], { nsig: 0 });
  const lf = C.lowerBound(PF);
  /* the residual 1.4% is the two polar caps beyond the outermost chord, which
     no chord observes and no bound may assume */
  ok('  refining the sampling drives the floor to within the unobserved polar caps',
    C.qn(lf.area) / truth > 0.98 && C.qn(lf.area) / truth < 1, C.qn(lf.area) / truth);
  ok('  equivalent diameter brackets 2R',
    C.equivDiameter(lo.area) <= 2 * R && 2 * R <= C.equivDiameter(hi.area),
    [C.equivDiameter(lo.area), C.equivDiameter(hi.area)]);
}

/* ---- monotonicity in the error budget ----------------------------------- */
{
  const chords = [{ y: '2', len: '10', err: '1' }, { y: '5', len: '14', err: '1' }, { y: '8', len: '6', err: '1' }];
  const a = C.prepare(chords, ['0', '9'], { nsig: 1 }), b = C.prepare(chords, ['0', '9'], { nsig: 3 });
  ok('a wider budget never narrows the interval',
    C.qn(C.lowerBound(b).area) <= C.qn(C.lowerBound(a).area) &&
    C.qn(C.upperBound(b).area) >= C.qn(C.upperBound(a).area));
}

/* ---- the negatives are what bound it from outside ------------------------ */
{
  const chords = [{ y: '2', len: '10', err: '1' }, { y: '5', len: '14', err: '1' }, { y: '8', len: '6', err: '1' }];
  const tight = C.prepare(chords, ['0', '9'], { nsig: 1 });
  const loose = C.prepare(chords, ['-50', '60'], { nsig: 1 });
  ok('moving the negative stations away loosens the ceiling',
    C.qn(C.upperBound(loose).area) > C.qn(C.upperBound(tight).area),
    [C.qn(C.upperBound(tight).area), C.qn(C.upperBound(loose).area)]);
  ok('  and leaves the floor untouched — the floor is the positive chords alone',
    C.qs(C.lowerBound(loose).area) === C.qs(C.lowerBound(tight).area));
  let threw = false;
  try { C.upperBound(C.prepare(chords, ['0'], { nsig: 1 })); } catch (e) { threw = true; }
  ok('with no negative on one side the ceiling is refused, not guessed', threw);
}

/* ---- the concave hull is a hull ------------------------------------------ */
{
  const H = C.concaveHull([[C.q(0), C.q(0)], [C.q(1), C.q(1)], [C.q(2), C.q(0)], [C.q(1), C.q('0.5')]]);
  ok('a point under the hull is dropped', H.length === 3, H.map(p => [C.qn(p[0]), C.qn(p[1])]));
  const H2 = C.concaveHull([[C.q(0), C.q(0)], [C.q(1), C.q(1)], [C.q(2), C.q(3)]]);
  ok('collinear-or-convex points keep only the ends', H2.length === 2, H2.map(p => [C.qn(p[0]), C.qn(p[1])]));
}

/* ---- reflection: the sky has no preferred direction ---------------------- */
{
  const chords = [{ y: '2', len: '10', err: '1' }, { y: '5', len: '14', err: '2' }, { y: '8', len: '6', err: '1' }];
  const flip = chords.map(c => ({ ...c, y: String(-Number(c.y)) }));
  const a = C.prepare(chords, ['0', '9'], { nsig: 1 }), b = C.prepare(flip, ['0', '-9'], { nsig: 1 });
  ok('mirroring the event changes no area',
    C.qs(C.lowerBound(a).area) === C.qs(C.lowerBound(b).area) &&
    C.qs(C.upperBound(a).area) === C.qs(C.upperBound(b).area));
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
