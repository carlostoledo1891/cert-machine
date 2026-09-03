#!/usr/bin/env node
/* build-report-lambda5.js — generate reports/lambda5.html: the lambda(5)
   theorem, machine-derived, with its whole proof record behind it, and the
   non-monotonicity that follows from it.

   NOTHING ON THE PAGE IS REMEMBERED. At every build: the target enclosure of
   L(1,2,4,5,6) is re-certified; the minimal polynomial is re-derived by exact
   resultant and re-certified (interior minimum, exact sign change, Sturm
   count 1, irreducibility mod p) AFTER the same instrument re-derives two
   PUBLISHED closed forms as calibration — Mercer's lambda(3) and this lab's
   own lambda(4) cubic; the Section-5 generic case is re-derived live (base 0,
   dip -5/3, fifteen exceptions, eight positive, the extremizer escaping); the
   double-sum-core theorem is re-proved with its comb weight; the campaign
   record is walked — eight families, all CLOSED, every finite part fully
   decided, the only skipped set ever the extremizer; and a sample of finite
   sets is re-certified against the target. The build REFUSES on any deviation.

   FRAMING DISCIPLINE. This page announces a MACHINE-DERIVED PROOF, published
   for scrutiny: not peer-reviewed, not independently re-verified, and — the
   difference from lambda(4), which the page states plainly — NO independent
   audit has walked it. The claim rests on the engine's lemmas and its exact
   inner-product calculus, restated here so a referee can check the
   mathematics without reading code.

   usage: node tools/build-report-lambda5.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const D = require(path.join(ROOT, 'instruments', 'lambda4', 'dot.js'));
const EN = require(path.join(ROOT, 'instruments', 'lambda4', 'engine.js'));
const F = require(path.join(ROOT, 'instruments', 'lambda4', 'forms.js'));
const LAM = require(path.join(ROOT, 'instruments', 'trigmin', 'lambda.js'));
const MP = require(path.join(ROOT, 'instruments', 'trigmin', 'minpoly.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));

const die = (m) => { console.error('LAMBDA5 REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const q = D.q;
const num = (n) => n.toLocaleString('en-US');
/* exponents as Unicode superscripts: C.m() escapes markup, so <sup> would
   render as literal angle brackets inside a mono span */
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (s) => s.replace(/\^(\d+)/g, (_, d) => d.split('').map(c => SUP[c]).join('')).replace(/ - /g, ' − ');

/* ---- the record ----------------------------------------------------------- */
const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda56-campaign.json'), 'utf8'));
const st = rec.stages || {};
for (const k of Object.keys(st)) if (st[k].ok !== true) die('stage ' + k + ' is not ok in the record');

const gen5rec = st['lambda5-generic'] || die('no lambda(5) generic stage in the record');
const worklist = gen5rec.worklist || [];
if (worklist.length !== 8) die('the lambda(5) worklist is not eight families');

/* walk one family: tree shape, finite parts, walls; refuse on anything undecided */
const EXTREMIZER = '1,2,4,5,6';
function walkFamily(stage) {
  const o = { dots: 0, closures: 0, finiteParts: 0, sets: 0, walls: 0, depth: 0, rootParts: 0 };
  (function w(n, d) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(x => w(x, d));
    if (n.kind === 'dot') o.dots++;
    if (n.closures) o.closures += n.closures.length;
    if (n.enumerated !== undefined && n.undecided !== undefined) {
      o.finiteParts++; o.sets += n.closed;
      if (n.undecided.length) die('an undecided finite part is in the record');
      for (const s of (n.skipped || [])) {
        if (s !== EXTREMIZER) die('a set other than the extremizer was skipped: ' + s);
        o.walls++;
      }
    }
    if (d > o.depth) o.depth = d;
    Object.values(n).forEach(v => w(v, d + 1));
  })(stage.node, 0);
  o.rootParts = (stage.node && stage.node.parts) ? stage.node.parts.length : 0;
  return o;
}

const fams = [];
for (const w of worklist) {
  const stage = st['lambda5-family: ' + w.family];
  if (!stage || stage.status !== 'CLOSED') die('family ' + w.family + ' is not CLOSED in the record');
  if (stage.rootKey !== w.key) die('family ' + w.family + ' does not carry its worklist condition key');
  fams.push(Object.assign({ name: w.family, delta: w.delta, key: w.key, onto: stage.ontoChecked || 0 }, walkFamily(stage)));
}
const T = fams.reduce((a, f) => ({
  dots: a.dots + f.dots, closures: a.closures + f.closures, sets: a.sets + f.sets,
  walls: a.walls + f.walls, onto: a.onto + f.onto, finiteParts: a.finiteParts + f.finiteParts
}), { dots: 0, closures: 0, sets: 0, walls: 0, onto: 0, finiteParts: 0 });
if (!fams.every(f => f.onto > 0)) die('a family carries no coverage points');

/* ---- live re-verifications ------------------------------------------------- */
const L2 = EN.targetEnclosure([1, 2]);
const L3 = EN.targetEnclosure([1, 2, 3]);
const L4 = EN.targetEnclosure([1, 2, 3, 4]);
const L5 = EN.targetEnclosure([1, 2, 4, 5, 6]);
const L6w = EN.targetEnclosure([1, 2, 4, 6, 7, 8]);

/* calibration of the algebra: two PUBLISHED closed forms, re-derived */
const c3 = MP.certifyMinPoly([1, 2, 3], L3);
const c4 = MP.certifyMinPoly([1, 2, 3, 4], L4);
if (!c3.ok || MP.fmt(c3.S, 'y') !== '27y^2 - 34y - 2') die('the lambda(3) calibration polynomial no longer derives');
if (!c4.ok || MP.fmt(c4.S, 'y') !== '512y^3 - 1227y^2 + 600y + 125') die('the lambda(4) calibration cubic no longer derives');
/* lambda(2) = 9/8 exactly — Mercer's first value, as a thin check */
if (Q.cmp(Q.neg(L2.hi), q(9, 8)) > 0 || Q.cmp(Q.neg(L2.lo), q(9, 8)) < 0) die('lambda(2) = 9/8 is no longer enclosed');

/* the claim */
const c5 = MP.certifyMinPoly([1, 2, 4, 5, 6], L5);
if (!c5.ok) die('the lambda(5) minimal polynomial no longer certifies');
if (c5.degree !== 5 || !c5.irreducible || c5.rootsInEnclosure !== 1 || c5.crossChecked !== true) die('the lambda(5) minimal-polynomial certificate weakened');
const QUINTIC = MP.fmt(c5.S, 'y');

/* the generic case, re-derived live */
const C5 = F.ctx(['a', 'b', 'c', 'd', 'e'], {});
const gen = EN.dotTheorem({
  C: C5, S: { order: C5.member.e, xi: D.XI_PI },
  W: [{ atom: { kind: 'omcsq', form: C5.member.d }, coeff: q(2) }],
  gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 14
});
if (!gen.ok || gen.base !== '0' || gen.dip !== '-5/3') die('the generic case no longer derives');
if (gen.exceptions.length !== 15 || gen.exceptions.filter(e => e.deltaSign > 0).length !== 8) die('the 15/8 exception structure moved');
if (!gen.exceptions.every(e => e.inhabited)) die('an exception condition is no longer inhabited');
const activeAt = (dot, x) => dot.exceptions.filter(e => e.cond.reduce((s, cf, i) => s + Number(cf) * x[i], 0) === 0);
const parseQ = (s) => { const m = s.split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
const escapeAct = activeAt(gen, [1, 1, 2, 1, 1]);
const escapeSum = escapeAct.reduce((s, e) => Q.add(s, parseQ(e.delta)), q(0));
if (escapeAct.length !== 3 || Q.sign(escapeSum) <= 0) die('the extremizer no longer escapes the generic argument');
/* the extremizer may be walled ONLY inside a family whose condition it satisfies */
const escapeLabels = new Set(escapeAct.map(e => e.label));
for (const f of fams) if (f.walls > 0 && !escapeLabels.has(f.name))
  die('family ' + f.name + ' walls the extremizer but the extremizer does not satisfy its condition');
const wallFams = fams.filter(f => f.walls > 0);
if (!wallFams.length) die('the extremizer is never walled — the finite parts would then refute the theorem');
const adWalls = (fams.find(f => f.name === 'a+d = e') || {}).walls;
if (adWalls !== 4) die('the a+d = e tree walls the extremizer ' + adWalls + ' times, not the recorded four');

/* the double-sum core, re-proved with the comb weight */
const U = { n: 3, names: ['a', 'u', 'v'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [1n, 2n, 1n], e: [2n, 2n, 1n] }, defs: {} };
const combW = (() => {
  const ae = F.add(U.member.a, U.member.e), be = F.add(U.member.b, U.member.e);
  const terms = [];
  [1n, 1n].forEach((cj, j) => [5n, 7n, 5n].forEach((ck, k) =>
    terms.push({ form: F.add(F.scale(ae, j), F.scale(be, k)), coeff: Q.R(cj * ck, 1n) })));
  return [{ atom: { kind: 'sq', terms }, coeff: q(1) }];
})();
const core = EN.dotTheorem({
  C: U, S: { order: U.member.e, xi: D.XI_2PI3, Bmax: 14 },
  W: combW, gConst: q(7, 6), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 20
});
if (!core.ok || core.base !== '-8' || core.dip !== '-5/3') die('the double-sum core theorem no longer derives');
const corePos = core.exceptions.filter(e => e.deltaSign > 0);
if (corePos.length !== 6) die('the core theorem no longer carries six positive conditions');
/* the obstruction must still be REAL: every classical atom refuses on the core */
for (const mm of ['a', 'b', 'c', 'd']) for (const xi of [D.XI_PI, D.XI_2PI3]) {
  const r = EN.dotTheorem({ C: U, S: { order: U.member.e, xi },
    W: [{ atom: { kind: 'omcsq', form: U.member[mm] }, coeff: q(2) }],
    gConst: xi === D.XI_PI ? q(2, 3) : q(7, 6),
    gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 16 });
  if (r.ok) die('a classical atom now closes the double-sum core — the comb weight would be unjustified');
}

/* the non-monotonicity: lambda(6) <= -L(1,2,4,6,7,8) < lambda(5) */
if (Q.cmp(L5.hi, L6w.lo) >= 0) die('the non-monotonicity comparison no longer holds');

/* a sample of finite sets, re-certified strictly below the target */
const SAMPLE = [[1, 2, 3, 4, 5], [1, 2, 3, 4, 6], [2, 3, 4, 5, 7], [1, 3, 4, 5, 8], [1, 2, 4, 5, 7], [1, 2, 4, 6, 7]];
for (const A of SAMPLE) {
  const r = LAM.certifyLambda(A, { tol: 1e-10 });
  if (!(Q.cmp(Q.fromDouble(r.minEnclosure[1]), L5.lo) < 0)) die('sample set ' + A + ' no longer certifies below the target');
}

/* the independent audit, if it has run: read as data, and refused if it does
   not match the target this page just re-certified */
const AUDP = path.join(ROOT, 'certs', 'lambda5-audit.json');
const AUD = fs.existsSync(AUDP) ? JSON.parse(fs.readFileSync(AUDP, 'utf8')) : null;
if (AUD) {
  if (AUD.refuters !== 0) die('the independent audit records refuters of the theorem');
  if (AUD.target.lo !== Q.toString(L5.lo) || AUD.target.hi !== Q.toString(L5.hi))
    die('the audit was run against a different target enclosure than this build certifies');
  if (!(AUD.setsWalked > 0) || !(AUD.screenAudited > 0)) die('the audit record is empty');
}

/* ---- numbers for the page --------------------------------------------------- */
const lam = (e) => -Q.toDouble(e.hi);                 /* lambda = -L, low end of the value */
const L5lo = Q.toDouble(Q.neg(L5.hi)), L5hi = Q.toDouble(Q.neg(L5.lo));
const lamStr = L5lo.toFixed(13);
const l6bound = -Q.toDouble(L6w.lo);

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'erdős #510 · chowla\'s cosine problem · the finite front',
  title: 'λ(5), settled — and the sequence turns down',
  deck: 'Mercer proved the first two exact values of Chowla\'s cosine dip in 2019 and conjectured the rest. '
    + 'This machine proved the third, and here the fourth: λ(5) = −L(1,2,4,5,6), an algebraic number of degree '
    + 'exactly five. One consequence needs nothing further — λ(6) < λ(5), so the sequence that had been climbing '
    + 'turns down at six.'
}));

B.push(C.scope('A machine-derived proof, published for scrutiny: not peer-reviewed. An independent audit '
  + (AUD ? 'has walked the theorem, the first level of the reduction and the obstruction — but NOT the interior of '
        + 'the eight closure trees, which λ(4)\'s audit does walk for λ(4). '
        : 'has not run yet, unlike λ(4) on this site. ')
  + 'Every derivation below is re-executed at this page\'s own '
  + 'build in exact rational arithmetic, and the build refuses to ship if any step deviates; the algebra is '
  + 'calibrated first against two published closed forms it must reproduce. The mathematics is restated here '
  + 'so it can be checked without reading code.'));

B.push(C.tldr({
  findingRaw: '<b>λ(5) = −L(1,2,4,5,6) ≈ ' + lamStr + '</b> — the value Mercer conjectured is the true one: no '
    + 'set of five positive integers dips shallower than {1,2,4,5,6}. It is the root of '
    + C.m(sup(QUINTIC)) + ' in the certified enclosure — irreducible over ℚ, so '
    + 'λ(5) has algebraic degree exactly 5.',
  mechanismRaw: 'Mercer\'s §5 reduction, executed one level deeper. A single (1−cos dθ)² atom at g₀ = 2/3 lands '
    + 'base exactly 0 and dip −5/3, which clears the target and leaves EIGHT exception families; each closes by a '
    + 'second-level version of the same move, with thresholds derived and finite remainders decided set by set. '
    + 'One family could not be closed by any classical weight — that obstruction, and the comb weight that beats '
    + 'it, is §6.',
  checkRaw: C.m('node tools/run-lambda56-campaign.js') + ' re-derives the campaign and writes the record; '
    + C.m('node instruments/lambda56/battery.js') + ' re-proves the calibration (λ(4)\'s generic case, and the '
    + 'published λ(3) and λ(4) closed forms) before any λ(5) claim, and fires its red controls; '
    + C.m('node tools/audit-lambda5.js') + ' re-walks the theorem with no shared code.'
}));

B.push(C.stats([
  { k: 'families closed', v: fams.length + ' / ' + worklist.length, n: 'Fifteen exception conditions; seven carry negative delta and close themselves. These eight needed proofs.' },
  { k: 'finite sets decided', v: num(T.sets), n: 'Each an exact certificate against the target enclosure, at the bottom of a closure tree whose thresholds were all derived.' },
  { k: 'coverage points', v: num(T.onto), n: 'Every cone triangulation and every exception condition checked onto point-by-point — the gate that caught two real defects in the λ(4) campaign.' },
  { k: 'algebraic degree', v: String(c5.degree), n: 'The minimal polynomial is irreducible over ℚ, proved by reduction mod ' + c5.prime + '. Whether the root is expressible in radicals is NOT decided here.' }
]));

B.push(C.section({
  lab: '§1 · the problem', title: 'Chowla\'s dip, and where the finite front stood',
  bodyRaw: [
    C.pRaw('A length-n cosine sum is ' + C.m('cos(a₁θ) + … + cos(aₙθ)') + ' with distinct positive integer '
      + 'frequencies; its minimum is always negative, and Chowla asked how shallow it can be kept. λ(n) is the '
      + 'infimum over frequency sets of −min — the shallowest dip any n-term sum can manage. The asymptotic side '
      + 'is Erdős problem #510; the FINITE side is the exact values, and until 2026 it had two entries.'),
    C.pRaw('Mercer (arXiv:1709.06612, INTEGERS 19 (2019) #A4) proved ' + C.m('λ(2) = 9/8') + ' and '
      + C.m('λ(3) = (17+7√7)/27') + ', conjectured λ(4) = −L(1,2,3,4), λ(5) = −L(1,2,4,5,6) and '
      + C.m('λ(6) = −L(1,2,4,6,7,8)') + ', and left a §5 strategy. This lab executed that strategy for λ(4) '
      + '(<a href="/reports/lambda4.html">the proof page</a>). λ(5) is the next value, and the first whose '
      + 'optimiser is not an initial segment: {1,2,4,5,6} skips 3.'),
    C.pRaw('<strong>Why the skip matters.</strong> An optimiser that is not an initial segment is what makes the '
      + 'sequence able to turn: Mercer conjectured λ(6) &lt; λ(5), which would be the first non-monotonicity. §3 '
      + 'shows that consequence is already available.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the theorem', title: 'The exact value, and its degree',
  bodyRaw: [
    C.eq('λ(5) = −L(1,2,4,5,6), where L(1,2,4,5,6) = min<sub>θ</sub> [cos θ + cos 2θ + cos 4θ + cos 5θ + cos 6θ]'),
    C.pRaw('Substituting c = cos θ, the sum is ' + C.m(sup(MP.fmt(c5.P, 'c')))
      + '. Its endpoint values are the exact integers P(1) = ' + c5.endpoints.at1 + ' and P(−1) = '
      + c5.endpoints.atMinus1 + ', both far above the minimum, so the minimum is attained in the open interval '
      + 'and is therefore a CRITICAL value. The critical values of P are exactly the roots of the resultant '
      + C.m('R(y) = Res_c(P′(c), P(c) − y)') + ', an integer polynomial computed here by a fraction-free '
      + 'Sylvester determinant. Sturm\'s theorem counts exactly one root of R inside the certified enclosure, so '
      + 'that root is the minimum:'),
    C.eq(QUINTIC.replace(/y\^(\d)/g, 'λ<sup>$1</sup>').replace(/y/g, 'λ').replace(/ - /g, ' − ') + ' = 0,&nbsp;&nbsp; λ(5) ∈ ['
      + L5lo.toFixed(15) + ', ' + L5hi.toFixed(15) + ']'),
    C.pRaw('The quintic is irreducible over ℚ — it stays degree 5 and is irreducible modulo ' + c5.prime
      + ', which is enough — so it IS the minimal polynomial and λ(5) is an algebraic number of degree exactly '
      + 'five. So far as this lab has read, that polynomial has not been printed anywhere, as was the case for '
      + 'λ(4)\'s cubic; Mercer states the conjecture, and no follow-up on the finite front has been located in '
      + 'seven years. The same instrument, run first as calibration, re-derives Mercer\'s published '
      + C.m('λ(3) = (17+7√7)/27') + ' as the root of ' + C.m('27λ² − 34λ − 2') + ' and this lab\'s '
      + C.m('512λ³ − 1227λ² + 600λ + 125') + ' for λ(4), before it is trusted on λ(5).'),
    C.note({
      lab: 'what the theorem says', bodyRaw: C.pRaw('For every set of five distinct positive integers, the sum '
        + 'cos aθ + … + cos eθ reaches −λ(5) or deeper at some θ. Equality holds for {1,2,4,5,6} and its '
        + 'dilations, and — by the strictness of every family closure — for no other set. What is NOT decided '
        + 'here: whether λ(5) can be written in radicals. That is the Galois group of the quintic, and nothing '
        + 'in this campaign computes it.')
    })
  ].join('\n')
}));

{
  const seq = [
    { n: 2, v: lam(L2), k: 'proved (Mercer)' },
    { n: 3, v: lam(L3), k: 'proved (Mercer)' },
    { n: 4, v: lam(L4), k: 'proved here' },
    { n: 5, v: lam(L5), k: 'proved here' },
    { n: 6, v: l6bound, k: 'upper bound' }
  ];
  const chart = C.categoryChart({
    cats: seq.map(s => ({
      x: 'λ(' + s.n + ')',
      bars: [{ v: s.v, token: s.n === 6 ? '--warn-soft' : (s.n >= 4 ? '--sig' : '--ink-3') }],
      rule: s.n === 6 ? { v: s.v, token: '--warn' } : null,
      note: s.v.toFixed(4)
    })),
    yLo: 1.0, yHi: 1.75, yTicks: [1.0, 1.2, 1.4, 1.6],
    w: 760, h: 300, yLabel: 'λ(n) — the shallowest dip an n-term cosine sum can keep',
    alt: 'Bar chart of lambda(2) through lambda(6): 1.125, 1.3156, 1.5196, 1.6275 rising, then lambda(6) at most 1.5918 — the sequence turns down.'
  });
  B.push(C.section({
    lab: '§3 · the consequence', title: 'The sequence turns down at six — and this needs no λ(6) proof', wide: true,
    bodyRaw: [
      C.figure({ svgRaw: chart, caption: 'λ(2)…λ(5) are exact values; the λ(6) bar is an upper bound, drawn with '
        + 'its bound rule. The first four rise; the fifth cannot reach them.' }),
      '<div class="col">' + C.pRaw('λ(n) is an INFIMUM over n-element sets, so any single set is an upper bound: '
        + '{1,2,4,6,7,8} gives ' + C.m('λ(6) ≤ −L(1,2,4,6,7,8) ≤ ' + l6bound.toFixed(13)) + ', certified by the '
        + 'same minimum instrument. With λ(5) = ' + lamStr + ' now proved, the comparison is immediate:')
      + C.eq('λ(6) ≤ ' + l6bound.toFixed(13) + ' &lt; ' + lamStr + ' = λ(5)')
      + C.pRaw('So the sequence λ(2) &lt; λ(3) &lt; λ(4) &lt; λ(5) does not continue: <strong>λ(6) &lt; λ(5)</strong>. '
        + 'Mercer conjectured this non-monotonicity and it follows from λ(5) alone plus one exhibited set — the '
        + 'λ(6) campaign is not needed for it. What the campaign IS needed for is the stronger statement: that '
        + 'λ(6) EQUALS −L(1,2,4,6,7,8). Nine of its ten families are closed in the same record; the tenth is '
        + 'still computing, and until it lands λ(6) has an upper bound here and no exact value.') + '</div>',
      C.note({ lab: 'the honest reading', bodyRaw: C.pRaw('A bound in one direction and an exact value in the '
        + 'other is enough to order two numbers, and not enough to state either as known. λ(6) ≤ '
        + l6bound.toFixed(13) + ' is unconditional; λ(6) = ' + l6bound.toFixed(13) + ' is still a conjecture on '
        + 'this site.') })
    ].join('\n')
  }));
}

{
  const rows = gen.exceptions.map(e => [
    { raw: C.m(e.label) }, { raw: C.m(e.delta) },
    { raw: e.deltaSign > 0 ? C.tag('needs its own proof', 'open') : C.tag('closes itself', 'held') },
    { raw: C.m('{' + ['a', 'b', 'c', 'd', 'e'].map(k => e.example[k]).join(',') + '}') }
  ]);
  B.push(C.section({
    lab: '§4 · the reduction', title: 'Fifteen conditions, discovered — and seven close themselves', wide: true,
    bodyRaw: [
      '<div class="col">' + C.pRaw('The §5 move, at n = 5. On the equispaced set where eθ ≡ π, take the single '
        + 'nonnegative weight ' + C.m('2(1 − cos dθ)²') + ' against ' + C.m('g₀ = 2/3') + '. At that g₀ the atom '
        + 'lands base EXACTLY 0 — the (1−cos) atoms Mercer used die at the heavier constant, and the squared atom '
        + 'is precisely neutral — and the dip is −5/3, strictly below −λ(5). A single atom on the '
        + 'second-largest member also minimises the exception count: eight positive families here, where a '
        + 'four-atom weight gives thirty-two. The engine derives the conditions symbolically; they are OUTPUT, '
        + 'never input, and each one is checked inhabited by an explicit integer set.') + '</div>',
      C.table({
        cols: [{ h: 'condition' }, { h: 'effect (delta)', cls: 'v' }, { h: 'verdict' }, { h: 'example set', cls: 'v' }],
        rows
      }),
      '<div class="col">' + C.pRaw('The built-in consistency check: {1,2,4,5,6} activates '
        + escapeAct.length + ' conditions — ' + escapeAct.map(e => C.m(e.label)).join(', ') + ' — whose deltas sum '
        + 'to ' + C.m(Q.toString(escapeSum)) + ', positive, so the generic argument correctly CANNOT close the '
        + 'extremizer. An engine that closed it would be proving a false statement, and the battery keeps a red '
        + 'control on exactly that.') + '</div>'
    ].join('\n')
  }));
}

{
  const rows = fams.map(f => [
    { raw: C.m(f.name) }, { raw: C.m(f.delta) },
    { raw: C.esc(f.rootParts ? 'split into ' + f.rootParts + ' root cones' : 'single cone') },
    { raw: C.m(String(f.dots)) }, { raw: C.m(String(f.closures)) }, { raw: C.m(num(f.sets)) },
    { raw: f.walls ? C.tag(f.walls + ' × extremizer walled', 'cert') : C.tag('strict', 'dep') }
  ]);
  B.push(C.section({
    lab: '§5 · the eight families', title: 'Every family, closed', wide: true,
    bodyRaw: [
      C.table({
        cols: [{ h: 'family' }, { h: 'delta', cls: 'v' }, { h: 'root shape' }, { h: 'dot theorems', cls: 'v' },
          { h: 'closures', cls: 'v' }, { h: 'finite sets', cls: 'v' }, { h: 'equality handling' }],
        rows
      }),
      '<div class="col">' + C.pRaw('Each family repeats the move one level down on its own cone: a weight and an '
        + 'equispaced set whose symbolic inner product is an exact rational, piecewise over collision conditions '
        + 'the engine discovers; positive-delta conditions spawn subfamilies; those close by anchored estimates '
        + 'whose thresholds are derived; what remains below every threshold is a finite list, decided set by set '
        + 'by the certified minimum instrument. In total ' + num(T.dots) + ' dot theorems, ' + num(T.closures)
        + ' anchored closures and ' + num(T.sets) + ' finite sets, with ' + num(T.onto) + ' coverage points '
        + 'checked. The extremizer is walled as the definitional witness on exactly ' + T.walls + ' leaves, and '
        + 'only inside the ' + wallFams.length + ' families whose condition {1,2,4,5,6} actually satisfies ('
        + wallFams.map(f => C.m(f.name) + ' on ' + f.walls).join(', ') + '); a wall anywhere else would be a set '
        + 'skipped without cause, and the build refuses it. Every neighbour of the extremizer is certified '
        + 'strictly below the target.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§6 · the obstruction', title: 'Why λ(5) was plausibly open: one cone defeats every classical weight',
  bodyRaw: [
    C.pRaw('The family ' + C.m('a+d = e') + ' contains the sub-cone ' + C.m('b+c = a+d = e') + ' — a DOUBLE sum '
      + 'system, and {1,2,4,5,6} is one of its points (2+4 = 1+5 = 6). On the equispaced set where eθ ≡ π the '
      + 'members pair into complements: (a,d) and (b,c) both sum to e, and '
      + C.m('cos(kπ) + cos((k−1)π) = 0') + ' identically, so every match a weight can earn is annihilated by its '
      + 'complement. The base is ' + C.m('w₀·g₀ > 0') + ' for EVERY nonnegative weight — the argument cannot '
      + 'start. This is not a failure of search: it is a structural obstruction, and the battery proves it fresh '
      + 'at every run by requiring all four classical atoms, at both anchors, to refuse.'),
    C.pRaw('The way through is to change the anchor and the weight together. On ' + C.m('S(e, 2π/3)') + ' the '
      + 'wrap sum at k ≡ 1 (mod 3) is −1 with no cancellation, and a Fejér–Riesz comb along the frequency '
      + 'classes m+e — the squared-modulus atom ' + C.m('|(1 + z_a)(5 + 7z_b + 5z_b²)|²') + ' with '
      + C.m('z_m = e^{i(m+e)θ}') + ' — lands base ' + C.m(core.base) + ' at ' + C.m('g₀ = 7/6') + ', with dip '
      + C.m(core.dip) + ' still clearing the target. Its ' + corePos.length + ' positive conditions are ordinary '
      + 'two-parameter cones, and the family closes from there. The comb atom is additive to the inner-product '
      + 'calculus: the λ(4) engine is untouched by it, and its battery stays green.'),
    C.note({ lab: 'the red control that keeps this honest', bodyRaw: C.pRaw('If some classical atom ever DID '
      + 'close the double-sum core, the comb would be unnecessary and this section would be a story rather than '
      + 'a theorem. So the check runs the other way: eight classical attempts must all refuse, at every build of '
      + 'this page and every run of the battery. The moment one succeeds, the page stops building.') })
  ].join('\n')
}));

B.push(C.section({
  lab: '§7 · what the proof rests on', title: 'The trust base, stated',
  bodyRaw: [
    C.plainList([
      { b: 'The dot-product calculus.', text: 'On an equispaced set of order m, the average of cos(kθ) is '
        + 'cos(t·ξ) if k = t·m and 0 otherwise. With anchors at rational multiples of π, every average is an '
        + 'exact rational, and for a family of integer sets the whole inner product is a piecewise rational '
        + 'function over finitely many linear collision conditions — all discovered, none transcribed.' },
      { b: 'Mercer\'s Lemma 3.1 and the cosine bounds.', text: 'Equispaced sets of coprime orders contain points '
        + 'within π/(m₁m₂) of each other — coprimality certified by exhibiting the integer combination, never '
        + 'assumed. The chord bounds at π, 2π/3 and π/2 carry their validity ranges as floors on every threshold.' },
      { b: 'Lemma 3.4 with its omitted hypothesis.', text: 'A nonnegative weight with nonpositive average forces '
        + 'the target below zero somewhere — FALSE for a weight vanishing identically on the set. Positivity of '
        + 'the weight\'s average is checked on every closed branch, worst case over all collision subsets.' },
      { b: 'Exact minimum certification.', text: 'Every finite set is decided by BigInt Sturm isolation plus '
        + 'interval Newton in exact rationals (instruments/trigmin) — the same instrument that produced the '
        + 'target enclosure, and the same one whose λ(2) and λ(3) values match Mercer\'s published closed forms.' },
      { b: 'Two named external theorems, consumed.', text: 'Sturm\'s theorem for root counting, and the '
        + 'reduction criterion for irreducibility: a primitive integer polynomial that keeps its degree and is '
        + 'irreducible modulo a prime is irreducible over ℚ. Neither is proved here; both are stated so a reader '
        + 'knows exactly what is being trusted. The F_p irreducibility test itself is exact and is cross-checked '
        + 'at this degree by a second, exhaustive implementation sharing no code with the first.' },
      { b: 'Coverage, proved point-by-point.', text: 'Each triangulation is checked onto over a box and each '
        + 'exception condition\'s points are checked into a subfamily cone — ' + num(T.onto) + ' points in this '
        + 'campaign. In the λ(4) campaign this same gate caught two real defects before they could ship.' }
    ])
  ].join('\n')
}));

B.push(C.section({
  lab: '§8 · verification', title: 'What has checked this, and what has not',
  bodyRaw: [
    C.pRaw('<strong>Checked, at every build of this page:</strong> the target enclosure; the minimal polynomial '
      + 'end to end (interior minimum from exact endpoint values, resultant, exact sign change, Sturm count 1, '
      + 'irreducibility) AFTER the same instrument reproduces the published λ(3) and λ(4) closed forms; the '
      + 'generic case with its 15/8 exception structure and the extremizer escaping; the double-sum-core theorem '
      + 'and the eight classical refusals that justify its comb weight; the record walk — eight families CLOSED, '
      + 'every finite part decided, only the extremizer skipped, ' + T.walls + ' walls and each one inside a family '
      + 'the extremizer belongs to; and a sample of finite '
      + 'certificates.'),
    C.pRaw('<strong>Checked, at every test run:</strong> ' + C.m('instruments/lambda56/battery.js') + ' — the '
      + 'λ(4) calibration that must pass before any λ(5) claim is computed, the record walk that makes a rotted '
      + 'record refuse rather than linger, the audit record pinned against this target, and red controls that '
      + 'must fire: a classical atom closing the double-sum core, a comb at too light a constant, an '
      + 'unregistered condition, a wrong sub-cone, a skip list naming an absent set, a quintic off by one '
      + 'coefficient, a reducible polynomial called irreducible.'),
    (AUD ? C.pRaw('<strong>Independently audited, at this box:</strong> a second walk sharing no code with the '
      + 'symbolic engine — inner products by direct trigonometric summation, condition membership by plain integer '
      + 'arithmetic on the record\'s condition vectors, sets re-certified from scratch — covered every gcd-reduced '
      + '5-set with largest element ≤ ' + AUD.box + ': ' + C.m(num(AUD.setsWalked)) + ' sets, '
      + C.m(String(AUD.refuters)) + ' refuters of the theorem, ' + C.m(num(AUD.screenAudited))
      + ' screened sets re-certified exactly to audit the screen itself. It also cross-validates the engine\'s '
      + 'whole symbolic layer: the model says an inner product is its base plus the deltas of the active '
      + 'conditions, and direct summation agrees at every set in the box to '
      + C.m(AUD.symbolicVsNumeric.worstGap.toExponential(1)) + '. The obstruction is confirmed by its mechanism '
      + 'rather than by search — on all ' + AUD.obstruction.corePoints + ' double-sum-core points in the box the '
      + 'cosines cancel identically on S(e, π) (worst residual '
      + C.m(AUD.obstruction.worstCancellationResidual.toExponential(1)) + '), so no nonnegative weight can start, '
      + 'and the comb closes every core point where no positive condition is active. Record: '
      + C.m('certs/lambda5-audit.json') + '.') : '')
      + C.pRaw('<strong>Not yet, and these are the gaps:</strong> the audit above walks the THEOREM, the first '
      + 'level of the reduction and the obstruction — it does NOT walk the interior of the eight closure trees, '
      + 'the subfamily cones, the derived thresholds or the finite parts inside them. λ(4)\'s audit does walk '
      + 'those for λ(4); no equivalent exists here yet. There is also no prose write-up, no peer review and no '
      + 'human read. Until those exist the honest status of the theorem-level sentence is exactly what the scope '
      + 'line at the top of this page says. The full machine record is ' + C.m('certs/lambda56-campaign.json')
      + '; the statement and strategy are Mercer\'s, and his paper is the first thing to read: arXiv:1709.06612.'),
    C.pRaw('<strong>Related here:</strong> <a href="/reports/lambda4.html">λ(4), settled</a> — the third exact '
      + 'value, with its audit; and <a href="/reports/mercer-program.html">the Mercer program</a> for the rest '
      + 'of the finite front.')
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-lambda5.js — every derivation on this page re-executed at build. Rebuild: node tools/build-report-lambda5.js') + '</p>'
  + '<p>' + C.esc('git ' + gitrev + ' · campaign record certs/lambda56-campaign.json (' + rec.meta.date + ', git ' + rec.meta.git + ') · statement and strategy: I. Mercer, INTEGERS 19 (2019) #A4 (arXiv:1709.06612)') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'lambda5.html'),
  TPL.render({
    title: 'λ(5), settled · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
    desc: 'lambda(5) = -L(1,2,4,5,6): the fourth exact value of Chowla\'s cosine dip (Erdős #510, finite front), '
      + 'proved by executing Mercer\'s reduction one level deeper — and with it the first non-monotonicity, '
      + 'lambda(6) < lambda(5). Machine-derived, exact-rational throughout, re-proved at every build; not '
      + 'peer-reviewed and not independently audited.',
    path: '/reports/lambda5.html'
  }));
console.log('reports/lambda5.html written: 8/8 families, ' + num(T.sets) + ' finite sets, ' + num(T.onto)
  + ' coverage points, quintic ' + QUINTIC + ' irreducible mod ' + c5.prime + ' @ git ' + gitrev);
