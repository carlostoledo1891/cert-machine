/* reds.js — node experiments/occultation/reds.js
 * Ways the envelope could be wrong and still look right. One of them is a
 * control that must FAIL, because a suite where nothing can fail proves nothing.
 */
'use strict';
const C = require('./chords.js');
let fail = 0;
const ok = (n, c, got) => { if (!c) fail++; console.log(`  ${c ? 'RED OK  ' : 'RED FAIL'} ${n}${c ? '' : '   got ' + JSON.stringify(got)}`); };

/* sample a silhouette given by its chord-length function */
const sample = (w, ys, err = '0') => ys.map(y => ({ y: String(y), len: w(y).toFixed(6), err }));
const areaOf = (w, y0, y1, N = 400000) => { let a = 0; for (let i = 0; i < N; i++) a += w(y0 + (i + 0.5) * (y1 - y0) / N) * (y1 - y0) / N; return a; };

const SHAPES = {
  'circle R=100': { w: y => 2 * Math.sqrt(Math.max(0, 1e4 - y * y)), y0: -100, y1: 100 },
  'ellipse 150x60': { w: y => 2 * 150 * Math.sqrt(Math.max(0, 1 - (y / 60) ** 2)), y0: -60, y1: 60 },
  'triangle': { w: y => y < 0 ? 0 : (y > 90 ? 0 : 200 * (1 - y / 90)), y0: 0, y1: 90 },
  /* flat-sided then tapering. NOTE: a STEP in w is not a convex body — it is
     an L-shape — and writing one here was this file's own error, caught by its
     own containment red. w must be concave on the support. */
  'flat-sided, then tapering': { w: y => (y < -40 || y > 40) ? 0 : (y <= 0 ? 220 : 220 * (1 - y / 40)), y0: -40, y1: 40 },
  'very elongated, off-centre': { w: y => (y < -30 || y > 110) ? 0 : 320 * Math.sqrt(Math.max(0, 1 - ((y - 40) / 70) ** 2)), y0: -30, y1: 110 }
};

/* ---- RED 1. containment for real convex shapes -------------------------- */
console.log('RED 1 — the certified interval contains the truth, for five convex shapes');
for (const [name, S] of Object.entries(SHAPES)) {
  const span = S.y1 - S.y0;
  const ys = [1, 2, 3, 4, 5, 6].map(i => +(S.y0 + span * i / 7).toFixed(3));
  const P = C.prepare(sample(S.w, ys), [String(S.y0 - 5), String(S.y1 + 5)], { nsig: 0 });
  const lo = C.qn(C.lowerBound(P).area), hi = C.qn(C.upperBound(P).area);
  const truth = areaOf(S.w, S.y0 - 5, S.y1 + 5);
  ok(`${name}`, lo <= truth * (1 + 1e-9) && truth <= hi * (1 + 1e-9), [lo, truth, hi]);
}

/* ---- RED 2. THE CONTROL: convexity must be capable of being wrong ------- *
 * A dumbbell is not convex. Sampled where its waist is, the chords are not the
 * chord-length function of any convex body, and the envelope must NOT quietly
 * contain its area. If this passes, the convexity assumption is doing nothing.
 */
console.log('RED 2 — the control, which must NOT contain a non-convex truth');
{
  const w = y => Math.abs(y) > 100 ? 0 : (Math.abs(y) < 30 ? 40 : 200);   /* two lobes, thin waist */
  const ys = [-85, -60, -35, 0, 35, 60, 85];
  const P = C.prepare(sample(w, ys), ['-105', '105'], { nsig: 0 });
  const lo = C.qn(C.lowerBound(P).area), hi = C.qn(C.upperBound(P).area);
  const truth = areaOf(w, -105, 105);
  ok('a dumbbell silhouette falls OUTSIDE the convex interval', !(lo <= truth && truth <= hi), [lo, truth, hi]);
  const jd = C.joinTheDots(P);
  ok('  and the joined dots are flagged as not concave', jd.concave === false);
}

/* ---- RED 3. more data never widens the interval ------------------------- */
console.log('RED 3 — an extra chord can only tighten');
{
  const S = SHAPES['circle R=100'];
  const few = C.prepare(sample(S.w, [-70, -20, 30, 75]), ['-100', '100'], { nsig: 0 });
  const many = C.prepare(sample(S.w, [-70, -45, -20, 5, 30, 55, 75]), ['-100', '100'], { nsig: 0 });
  ok('the floor rises with more chords', C.qn(C.lowerBound(many).area) >= C.qn(C.lowerBound(few).area));
  ok('the ceiling falls with more chords', C.qn(C.upperBound(many).area) <= C.qn(C.upperBound(few).area),
    [C.qn(C.upperBound(few).area), C.qn(C.upperBound(many).area)]);
}

/* ---- RED 4. the negatives move the ceiling and nothing else ------------- */
console.log('RED 4 — the ceiling is bought by the stations that saw nothing');
{
  const S = SHAPES['circle R=100'];
  const ch = sample(S.w, [-70, -20, 30, 75], '2');
  const tight = C.prepare(ch, ['-102', '102'], { nsig: 1 });
  const loose = C.prepare(ch, ['-400', '400'], { nsig: 1 });
  ok('distant negatives raise the ceiling', C.qn(C.upperBound(loose).area) > C.qn(C.upperBound(tight).area));
  ok('and leave the floor identical', C.qs(C.lowerBound(loose).area) === C.qs(C.lowerBound(tight).area));
}

/* ---- RED 5. invariances the sky plane actually has --------------------- */
console.log('RED 5 — translation, reflection and scale');
{
  const S = SHAPES['ellipse 150x60'];
  const ys = [-45, -20, 5, 30, 50];
  const base = C.prepare(sample(S.w, ys), ['-62', '62'], { nsig: 0 });
  const shift = C.prepare(sample(S.w, ys).map(c => ({ ...c, y: String(Number(c.y) + 137) })), ['75', '199'], { nsig: 0 });
  ok('shifting the whole event changes no area',
    C.qs(C.lowerBound(base).area) === C.qs(C.lowerBound(shift).area) &&
    C.qs(C.upperBound(base).area) === C.qs(C.upperBound(shift).area));
  const k = 3;
  const scaled = C.prepare(ys.map(y => ({ y: String(k * y), len: (k * S.w(y)).toFixed(6), err: '0' })), [String(-62 * k), String(62 * k)], { nsig: 0 });
  const r = C.qn(C.lowerBound(scaled).area) / C.qn(C.lowerBound(base).area);
  ok(`scaling the event by ${k} scales the area by ${k * k}`, Math.abs(r - k * k) < 1e-6, r);
}

/* ---- RED 6. the published data are checked for consistency, not trusted - */
console.log('RED 6 — inconsistent chords are reported, never smoothed');
{
  /* a set that no concave function can pass through at zero error */
  const bad = [{ y: '0', len: '100', err: '0' }, { y: '10', len: '180', err: '0' }, { y: '20', len: '170', err: '0' }, { y: '30', len: '178', err: '0' }];
  const P = C.prepare(bad, ['-10', '40'], { nsig: 0 });
  ok('a non-concave chord set is flagged', C.joinTheDots(P).concave === false);
  const good = [{ y: '0', len: '100', err: '0' }, { y: '10', len: '180', err: '0' }, { y: '20', len: '190', err: '0' }, { y: '30', len: '150', err: '0' }];
  ok('a concave one is not', C.joinTheDots(C.prepare(good, ['-10', '40'], { nsig: 0 })).concave === true);
}

console.log(fail ? `\n${fail} RED(S) FAILED` : '\nall reds fire');
process.exit(fail ? 1 : 0);
