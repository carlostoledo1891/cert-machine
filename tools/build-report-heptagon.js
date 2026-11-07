#!/usr/bin/env node
/* build-report-heptagon.js — reports/heptagon.html: Pálvölgyi's non-Ramsey heptagon and his appendix Theorem A.3,
   decided in Lean through OpenAI's classification and transported to Google DeepMind's statement of Graham's
   conjecture (formal-conjectures erdos_174.variants.graham; pull request #7706).

   Every number, statement and verdict word is read from certs/heptagon.json (tools/record-heptagon.js, which re-derives
   it from the runs' facts with --check); the build refuses when a verdict is not the one this page states, when the
   record no longer says first whose mathematics it is, or when the timeline falls out of order. What it does not decide
   comes first.

   usage: node tools/build-report-heptagon.js                                                                        MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-heptagon.png) */
const die = (m) => { console.error('HEPTAGON REPORT REFUSED: ' + m); process.exit(1); };
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'heptagon.json'), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const GB = (kb) => (kb / 1e6).toFixed(1) + ' GB';
const mins = (w) => { const p = String(w).split(':').map(Number); return p.length === 3 ? p[0] * 60 + p[1] + p[2] / 60 : p[0] + p[1] / 60; };
const dur = (w) => { const t = mins(w); return t < 1 ? Math.round(t * 60) + ' s' : t < 60 ? Math.round(t) + ' min' : Math.floor(t / 60) + ' h ' + Math.round(t % 60) + ' min'; };

/* the words this page states, each read back from the record */
const SAYS = { H1: 'CERTIFIED', H2: 'CERTIFIED', H3: 'CERTIFIED', H4: 'CERTIFIED', D: 'CERTIFIED', H5: 'READING', H6: '11/11 caught' };
for (const [k, v] of Object.entries(SAYS)) if (R.verdicts[k] !== v) die(k + ' is ' + R.verdicts[k] + ' in certs/heptagon.json, and this page states ' + v);
if (!/^The heptagon and Theorem A\.3 are Dömötör Pálvölgyi's, with ChatGPT/.test(R.undecided)) die('the record no longer says first whose mathematics it is');
const T = R.theorems, H1 = R.H1, H3 = R.H3, P = H3.published;
const STD = 'propext, Classical.choice, Quot.sound';
for (const t of Object.values(T)) if ([...t.axioms].sort().join() !== ['Classical.choice', 'Quot.sound', 'propext'].join()) die(t.name + ' rests on more than the three standard axioms');
const KERN = ['nanoda', 'con-ron', 'lean4lean', 'con-leche'];
if (!KERN.every((k) => R.H3.beforeRename.some((b) => b.kernel === k && b.exit === 0))) die('a second kernel is missing from the record');
const H6n = R.H6.length, H6c = R.H6.filter((r) => r.caught).length;
const TITLE = 'Pálvölgyi’s heptagon and the appendix theorem marked unchecked, decided in Lean';

/* figure A — the heptagon on its circle, drawn at r = e (transcendental, above 2): the seven points (0, 0) and
   (j, ±√(j(2r − j))) for j = 1, 3, 4, with the paper's weights by orbit. Built as the page is built. */
const RR = Math.E;
const PTS = [[0, 0, 2]].concat([[1, -2], [3, 2], [4, -1]].flatMap(([j, w]) => { const y = Math.sqrt(j * (2 * RR - j)); return [[j, y, w], [j, -y, w]]; }));
for (const [x, y] of PTS) if (Math.abs((x - RR) ** 2 + y * y - RR * RR) > 1e-9) die('a drawn point is off the circle');
if (PTS.reduce((s, p) => s + p[2], 0) !== 0) die('the drawn weights do not sum to zero');
const HY0 = -RR - 0.55, HY1 = RR + 0.55, HW = 900, HH = 480, HPL = 44, HPR = 20, HPT = 18, HPB = 50;
const HSPAN = (HW - HPL - HPR) * (HY1 - HY0) / (HH - HPT - HPB), HX0 = RR - HSPAN / 2, HX1 = RR + HSPAN / 2;   /* one unit is the same length on both axes; the circle centred */
const circle = []; for (let i = 0; i <= 240; i++) { const th = 2 * Math.PI * i / 240; circle.push([RR + RR * Math.cos(th), RR * Math.sin(th)]); }
const sgn = (w) => (w > 0 ? '+' : '−') + Math.abs(w);
const FIG_HEPT = CH.scatter({
  w: HW, h: HH, x0: HX0, x1: HX1, y0: HY0, y1: HY1, padL: HPL, padR: HPR, padT: HPT, padB: HPB,
  xTicks: [0, 1, 2, 3, 4, 5].map((v) => ({ v, t: String(v) })), yTicks: [-3, -2, -1, 0, 1, 2, 3].map((v) => ({ v, t: String(v) })),
  xLabel: 'x (the circle of centre (r, 0) and radius r, drawn at r = e)',
  curves: [{ pts: circle, token: 'var(--c-ctx)' }].concat(PTS.map(([x, y, w]) => ({ pts: [[x, y]], token: 'var(--c-ctx)', k: sgn(w), kAt: [x + (x === 0 ? -0.18 : 0.16), y + (y > 0 ? 0.32 : y < 0 ? -0.5 : 0.12), x === 0 ? 'end' : 'start'] }))),
  pts: PTS.map(([x, y, w]) => ({ x, y, token: 'var(--c-1)', k: x === 0 ? 'the origin' : 'j = ' + x, v: '(' + x + ', ' + (y === 0 ? '0' : (y > 0 ? '' : '−') + '√' + x + '(2r − ' + x + ')') + '), weight ' + sgn(w) })),
  alt: 'A circle through the origin, centred on the x axis at about 2.72, with seven dots on it: the origin, and a pair of dots mirrored across the x axis at x = 1, x = 3 and x = 4. Each dot carries its weight: +2 at the origin, −2 for the pair at 1, +2 for the pair at 3, −1 for the pair at 4. The weights add to zero.'
});

/* figure B — the order of events on one UTC clock (the record's timeline): the rules sealed before any run, the results
   sealed, the corollary's rules written before its run, the published code re-run, then the publications. Minutes
   from 04:00 UTC on 7 November. */
const TL = R.timeline, T0 = Date.parse('2026-11-07T04:00:00Z'), mn = (iso) => (Date.parse(iso) - T0) / 60000;
const hm = (x) => { const t = new Date(T0 + x * 60000); return String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0'); };
const S = Object.fromEntries(TL.seals.map((s) => [s.k.split(' · ')[0], mn(s.at)]));
const RUN = TL.run.map((e) => ({ k: e.k, x0: mn(e.from), x1: mn(e.to) }));
if (!(S['seal 5'] < RUN[0].x0)) die('the first run started before the rules were sealed');
if (!(RUN[0].x1 < S['seal 6'])) die('the results were sealed before their run ended');
if (!(mn(TL.written[0].at) < RUN[1].x0)) die('the corollary ran before its rules were written');
if (!(RUN[2].x1 < S['seal 7'] && TL.published.every((p) => mn(p.at) > S['seal 7']))) die('the timeline is out of order');
const seg = (e) => ({ x0: e.x0, x1: Math.max(e.x1, e.x0 + 4), token: 'var(--c-1)', k: e.k, v: hm(e.x0) + '–' + hm(e.x1) + ' UTC' });
const FIG_TIME = CH.segments({
  w: 900, x0: 0, x1: 960, padL: 150,
  xTicks: [0, 120, 240, 360, 480, 600, 720, 840, 960].map((v) => ({ v, t: hm(v) })), xLabel: 'time, UTC (7 November 2026)',
  rows: [
    { k: 'sealed', segs: [], marks: [{ x: S['seal 4'] }, { x: S['seal 5'], t: 'rules ' + hm(S['seal 5']) }, { x: S['seal 6'], t: 'results ' + hm(S['seal 6']) }, { x: S['seal 7'], t: 'the code as published ' + hm(S['seal 7']), anchor: 'end' }] },
    { k: 'H1–H4, kernels', segs: [seg(RUN[0])], marks: [] },
    { k: 'the corollary', segs: [seg(RUN[1])], marks: [{ x: mn(TL.written[0].at), t: 'its rules ' + hm(mn(TL.written[0].at)) }] },
    { k: 'the code, re-run', segs: [seg(RUN[2])], marks: [] },
    { k: 'published', segs: [], marks: TL.published.map((e, i, arr) => (i < arr.length - 1 ? { x: mn(e.at) } : { x: mn(e.at), anchor: 'end', t: 'repository, comment ' + hm(mn(arr[0].at)) + ' · linked ' + hm(mn(e.at)) })) }
  ],
  alt: 'Five rows on one clock in UTC, 04:00 to 20:00 on 7 November. Sealed: the target at 04:20, the rules at 04:29, the results at 07:19, the code as published at 16:54. The first run, H1 to H4 and the kernels, from 04:30 to 07:15. The corollary: its rules written at 12:06, its run from 12:07 to 12:48. The published code re-run from 15:29 to 16:47. Published: the repository and the comment at 19:25, the link added by the pull request’s author at 19:30.'
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'Graham conjectured that every finite set of points on a sphere is Ramsey. In September 2026 Dömötör Pálvölgyi, with ChatGPT, refuted it with seven points on a circle, and OpenAI classified exactly which finite sets are Ramsey, in Lean. '
    + 'Pálvölgyi’s appendix, labelled by its author as ChatGPT’s and unchecked, goes further: almost any seven points on a circle are not Ramsey. '
    + 'I decided both in Lean through OpenAI’s own theorem, with the rules sealed before any code ran, and the pull request that marks Graham’s conjecture solved in Google DeepMind’s list now links the proof.'
}));

O.push(C.tldr({
  findingRaw: 'The heptagon is not Ramsey, so formal-conjectures’ statement of Graham’s conjecture is false; and Theorem A.3 of the appendix holds as printed. Lean’s kernel accepts all six theorems from scratch, four independent kernels accept them, and nothing but ' + m(STD) + ' is used.',
  mechanismRaw: 'Pálvölgyi’s weights make a derivation’s “energy” come out as −24/((2r−1)(2r−3)(2r−4)), never zero, which fails OpenAI’s exact criterion; the necessity half of their classification then says the set is not Ramsey. One remark on the paper came out of it: the main text’s Equation (2) does not hold for A.3’s points, and the appendix’s proof, correctly, never needs it.',
  checkRaw: m('node tools/record-heptagon.js --check') + ' re-derives every verdict from the runs’ facts and re-runs one of the two exact deciders; the Lean is ' + a(R.pins.lean.repository, 'heptagon-ramsey-lean') + ', one command to rebuild.'
}));

O.push(C.stats([
  { k: 'Graham’s conjecture, as DeepMind states it', v: 'false, in Lean', sm: true, n: 'the pull request marking it solved links the proof' },
  { k: 'kernels', v: '5 accept', n: 'Lean from scratch, nanoda, con-ron, lean4lean, con-leche' },
  { k: 'axioms', v: '3 standard', n: 'under all six theorems, by two computations' },
  { k: 'planted fakes caught', v: H6c + ' of ' + H6n, n: 'a sorry, an axiom, a wrong weight, a forged export…' }
]));

O.push(C.scope('The heptagon and Theorem A.3 are Dömötör Pálvölgyi’s, with ChatGPT; the classification that decides them is OpenAI’s. This page decides them in Lean; it is not new mathematics. The Lean is mine, written by Claude (Anthropic’s AI model) under my direction.'));

O.push(C.section({
  lab: 'first, the limits', title: 'What this does not decide', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'The “almost every” clause of A.3.', text: 'The appendix concludes that almost every seven points of a circle are not Ramsey. That needs a measure-zero argument, not formalized here: the Lean theorem assumes the independence, as OpenAI’s nine-point theorem does.' },
    { b: 'The rest of the appendix.', text: 'Theorems A.7 and A.12 and every other appendix result except A.3.' },
    { b: 'That seven is the least.', text: 'Every six points on a circle are Ramsey: proved in Lean by JD Jones and by wstrinz (Will Strinz), not here.' },
    { b: 'The definitions.', text: 'The theorems are about OpenAI’s Ramsey and FieldCriterion and formal-conjectures’ IsRamsey. That these capture the informal notions is their authors’ formalization, taken as given; their proofs are inside what the kernels replay.' },
    { b: 'Formal-conjectures’ own environment.', text: 'The proof builds inside openai/math (Lean v4.34.1), where formal-conjectures’ IsRamsey and statement are copied byte for byte and checked against the pinned file. It does not build in formal-conjectures’ repository; a registry entry that does is in preparation.' },
    { b: 'What the second kernels see.', text: 'nanoda, con-ron, lean4lean and con-leche read an export of the environment: they check what the exporter wrote.' }
  ])
}));

O.push(C.section({
  lab: 'also first', title: 'Where the run differs from the plan', id: 'deviations',
  bodyRaw: C.pRaw('The rules were sealed before any code ran; four things differ from them, and the record keeps all four.')
    + C.plainList(R.deviations.map((d) => ({ b: { provenance: 'A correction about who checked A.3 first.', rename: 'The namespace renamed after the checks.', export: 'A void export, stopped.', paranoid: 'One Lean checker short.' }[d.id] || (d.id + '.'), text: d.text })))
}));

O.push(C.section({
  lab: 'the question', title: 'Is every set of points on a sphere Ramsey?', id: 'question',
  bodyRaw: C.pRaw('Take a finite set of points, like the corners of a triangle. It is <em>Ramsey</em> if, for any number of colours, once the dimension is high enough every colouring of space contains a copy of it, the same shape and size, all in one colour. '
      + 'In 1973 Erdős, Graham, Montgomery, Rothschild, Spencer and Straus proved that a Ramsey set must lie on a sphere. Graham conjectured the converse: every finite set on a sphere is Ramsey.')
    + C.figure({ svgRaw: FIG_HEPT, source: 'built: the seven points (0, 0) and (j, ±√(j(2r − j))), j = 1, 3, 4, drawn at r = e as the page is built, with the paper’s weights',
        stop: 'a drawn point leaves the circle, or the weights do not add to zero',
        caption: 'Pálvölgyi’s heptagon. For any transcendental r above 2, the seven points lie on the circle of centre (r, 0) and radius r; here r = e. The labels are the paper’s weights: +2 at the origin, −2 for the pair at x = 1, +2 for the pair at x = 3, −1 for the pair at x = 4. They add to zero, and so do their weighted positions and squared positions. Every set of six points on a circle is Ramsey; these seven are not.' })
    + C.pRaw('In DeepMind’s list the conjecture is ' + m(R.pins.entry.declaration) + ' in ' + m(R.pins.entry.path) + ', still marked open at commit ' + m(R.pins.entry.commit) + '.')
}));

O.push(C.section({
  lab: 'the claims', title: 'A counterexample, a classification, and an appendix marked unchecked', id: 'claims',
  bodyRaw: C.pRaw('On 20 September 2026 Pálvölgyi posted ' + a('https://arxiv.org/abs/2609.23327', 'A cyclic non-Ramsey heptagon') + '. Its Theorem 1 is the seven points above; its proofs are attributed to ChatGPT (“I contributed nothing to the proofs or ideas”), and its appendix, headed “Appendix by ChatGPT — unchecked”, states Theorem A.3: seven points on a circle whose parameters are generic are not Ramsey. '
      + 'Three days later OpenAI published a classification of finite Euclidean Ramsey configurations with its Lean in ' + a('https://github.com/openai/math', 'openai/math') + ': a set is Ramsey exactly when it passes an algebraic test, the field criterion. OpenAI cites the heptagon and says A.3 “already implies” its own nine-point counterexample.')
    + C.pRaw('No one had the heptagon in Lean. DeepMind’s entry for Graham’s conjecture stayed open; on 31 October Anas Khan opened ' + a(R.pins.entry.pr, 'pull request #7706') + ' to re-tag it as solved, with the statement ' + m('¬ (∀ …)') + ' and no proof.')
}));

const role = (r, whoRaw) => ({ b: r + '.', raw: whoRaw });
O.push(C.section({
  lab: 'who did what', title: 'Each step is a separate job', id: 'roles',
  bodyRaw: C.plainList([
    role('Find the counterexample and A.3', C.esc('Dömötör Pálvölgyi, with ChatGPT (OpenAI).')),
    role('Classify the Ramsey sets, in Lean', C.esc('OpenAI.')),
    role('State the conjecture formally', C.esc('Google DeepMind, in its list of open problems in Lean (formal-conjectures); the solved statement, Anas Khan.')),
    role('Write the Lean proofs', C.esc('Me, with Claude (Anthropic) writing the Lean, on OpenAI’s chain unchanged.')),
    role('Decide it, independently', C.esc('cert-machine: two exact deciders written from the paper alone, the axiom audit, the verbatim checks, the planted fakes.')),
    role('Check the proof', C.esc('Lean’s kernel from scratch, and nanoda, con-ron, lean4lean and con-leche, kernels written apart from Lean.')),
    role('Prove the dates', C.esc('Verify Seal: salted fingerprints in a public registry and in Bitcoin, before each step ran.'))
  ])
}));

const row = (q, did, v, kind) => [{ raw: C.esc(q) }, { raw: did }, { raw: C.tag(v, kind || 'held') }];
O.push(C.section({
  lab: 'the checks', title: 'Six questions and a corollary, written down and sealed before any code ran', id: 'checks', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'question' }, { h: 'what was done' }, { h: 'verdict' }],
    rows: [
      row('H1 · are the identities right?', C.esc('two clean-room deciders, written from the paper alone: ' + H1.A.identities + ' and ' + H1.B.identities + ' identities, exact, with r and the t’s symbolic'), R.verdicts.H1),
      row('H2 · is the heptagon not Ramsey, in Lean?', C.esc('through OpenAI’s criterion and theorem, transported to DeepMind’s statement copied byte for byte'), R.verdicts.H2),
      row('H3 · do the kernels accept it?', C.esc('Lean from scratch on three roots; nanoda, con-ron, lean4lean, con-leche on the closures and the whole environment'), R.verdicts.H3),
      row('H4 · is Theorem A.3 true as printed?', C.esc('its finite content by both deciders; then a Lean proof on the same chain'), R.verdicts.H4),
      row('D · the corollary in OpenAI’s nine-point shape?', C.esc('seven points with independent parameters, OpenAI’s statement token for token'), R.verdicts.D),
      row('H5 · who did what first?', C.esc('the dated sources'), 'a reading', 'open'),
      row('H6 · can the checks be fooled?', C.esc(H6n + ' planted fakes'), H6c + ' of ' + H6n + ' caught')
    ]
  })
}));

const M = H1.equation2.a3.M;
O.push(C.section({
  lab: 'H1 · the identities', title: 'Two deciders, written apart, agree on every identity', id: 'identities',
  bodyRaw: C.pRaw('Before any Lean, two programs decided the paper’s algebra exactly, each written from the paper’s text alone, neither reading the other: one in SymPy (' + H1.A.identities + ' identities, all ' + H1.A.certified + ' CERTIFIED, its ' + H1.A.controls + ' planted false identities all refused), one in the Python standard library with its own polynomial arithmetic (' + H1.B.identities + ' identities, all CERTIFIED; ' + H1.B.mutants.length + ' planted wrong versions of the heptagon and of A.3, each caught). '
      + 'For the heptagon: the moments vanish and the energy is ' + m('Σλ‖D(p)‖² = −24/((2r−1)(2r−3)(2r−4))') + '. For A.3, every finite identity of the proof holds for any seven distinct parameters; algebraic independence enters only where a derivation is chosen.')
    + C.pRaw('<b>One remark on the paper.</b> The main text’s Equation (2) asks the matrix ' + m('M = Σλ D(p) pᵀ') + ' to vanish, and for the heptagon it does. For A.3’s points it does not: at ' + m('t = ' + H1.equation2.a3.t) + ' it is ' + m('[[' + M[0].join(', ') + '], [' + M[1].join(', ') + ']]') + ', symmetric and not zero. '
      + 'The appendix’s proof goes through Lemma A.1, which asks only that M be symmetric, so A.3 is right as printed; it could not have been proved through Equation (2). The Lean proof carries the symmetric form too.')
}));

O.push(C.section({
  lab: 'H2 · the heptagon in Lean', title: 'Not Ramsey, through the other lab’s theorem', id: 'heptagon',
  bodyRaw: C.pRaw('On OpenAI’s chain, unchanged: a derivation D of the reals with D r = 1 (their ' + m('exists_real_derivation') + '), the pairing x ⊗ y ↦ D x · D y on their tensor ring, and Pálvölgyi’s weights give a nonzero trace, so the heptagon fails the criterion:')
    + C.code('theorem not_fieldCriterion : ' + T.not_fieldCriterion.type)
    + C.pRaw('The necessity half of their classification turns that into the theorem, and a transport carries it to DeepMind’s definition, with the zero-dimensional case handled as in ' + a('https://github.com/google-deepmind/formal-conjectures/issues/7517', 'issue #7517') + ':')
    + C.code('theorem not_ramsey : ' + T.not_ramsey.type + '\n\ntheorem graham_false\' : ' + T.graham_false2.type)
    + C.pRaw('The second statement is pull request #7706’s, token for token. DeepMind’s ' + m('IsRamsey') + ' and the conjecture’s statement are copied from the pinned file, ' + N(273) + ' and ' + N(113) + ' bytes, and a script refuses the build if one byte differs (it refuses a one-token change, as it must). The build: ' + N(R.H2.build.jobs) + ' jobs, no warning from our files.')
}));

O.push(C.section({
  lab: 'H4 · D · Theorem A.3', title: 'The appendix theorem, as printed, and its corollary', id: 'a3',
  bodyRaw: C.pRaw('A.3 says: if three of the parameters are distinct and the other four are algebraically independent over the field the three generate, the seven points ' + m('((1 − t²)/(1 + t²), 2t/(1 + t²))') + ' are not Ramsey. The Lean proof follows the appendix: Lemma A.1 in its symmetric form, a derivation vanishing on that field with prescribed values on the four (OpenAI’s construction generalised from ℚ to any base field), and the weighted moments by Lagrange interpolation.')
    + C.code('theorem generic_seven_not_ramsey : ' + T.a3.type)
    + C.pRaw('Its corollary in exactly the shape of OpenAI’s nine-point theorem, seven points whose parameters are algebraically independent over ℚ, in their literal parametrisation (a script checks it against their statement token for token, and refuses two planted changes):')
    + C.code('theorem seven_circle_configuration : ' + T.seven.type)
    + C.pRaw('wstrinz (Will Strinz) had certified one instance of A.3 exactly in October, three rational points and four independent ones. This is the first proof of the theorem as stated, and the first in Lean.')
}));

const kRows = [].concat(
  P.fresh.map((f) => [{ raw: C.esc('Lean, from scratch') }, { raw: m(f.root.replace('HeptagonRamsey.', '')) }, { raw: C.esc('the whole import closure replayed into an empty environment · ' + dur(f.wall) + ', ' + GB(f.peakKB)) }, { raw: C.tag('accepts', 'held') }]),
  [[{ raw: C.esc('nanoda') }, { raw: C.esc('the six theorems’ closure') }, { raw: C.esc(N(P.nanoda.declarations) + ' declarations, only the three axioms permitted') }, { raw: C.tag('accepts', 'held') }],
   [{ raw: C.esc('con-ron') }, { raw: C.esc('the six theorems’ closure') }, { raw: C.esc(N(P.conron.declarations) + ' declarations') }, { raw: C.tag('accepts', 'held') }]],
  R.H3.beforeRename.filter((b) => /whole environment|corollary/.test(b.on) || b.kernel === 'lean4lean' || b.kernel === 'con-leche').map((b) => [{ raw: C.esc(b.kernel) }, { raw: C.esc(b.on) }, { raw: C.esc(N(b.declarations) + ' declarations · ' + dur(b.wall) + ' · before the rename') }, { raw: C.tag('accepts', 'held') }])
);
O.push(C.section({
  lab: 'H3 · the kernels', title: 'Five kernels, nothing but the standard axioms', id: 'kernels', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('An audit that walks the dependency closure itself, and Lean’s own ' + m('#print axioms') + ', agree: all six theorems rest on ' + m(STD) + ' and nothing else, closures of ' + N(T.not_fieldCriterion.closureConstants) + ' to ' + N(T.seven.closureConstants) + ' constants. The audit refuses each of seven planted fakes (a sorry, an axiom, native_decide and four others) and passes a clean control.')
    + C.pRaw('Besides Lean’s own, the kernels below were each written apart from Lean. The rows marked “before the rename” ran on the same proofs before the library’s namespace was renamed for publication; the rename changed the name and nothing else, and the published code was re-run through Lean, nanoda and con-ron.') + '</div>'
    + C.table({ cols: [{ h: 'kernel' }, { h: 'on' }, { h: 'what' }, { h: 'verdict' }], rows: kRows })
    + '<div class="col">' + C.pRaw('A forged export, one theorem given another’s statement and its proof unchanged, is rejected by both kernels it was given to. Named gaps: ' + C.esc(H3.gaps.join(' ')) ) + '</div>'
}));

O.push(C.section({
  lab: 'H6 · the red team', title: H6c + ' fakes, ' + H6c + ' caught', id: 'redteam',
  bodyRaw: C.plainList(R.H6.map((r) => ({ b: (r.id.charAt(0).toUpperCase() + r.id.slice(1)) + '.', text: r.caught ? 'refused, as required' : 'NOT caught' })))
}));

const pct = (p) => Math.round(p * 100) + '%';
O.push(C.section({
  lab: 'the predictions', title: 'What I expected, sealed before the runs', id: 'predictions',
  bodyRaw: C.table({
    cols: [{ h: 'prediction' }, { h: 'prior' }, { h: 'outcome' }],
    rows: R.predictions.map((p) => [{ raw: C.esc(p.q) }, { raw: m(pct(p.prior)) }, { raw: C.esc(p.outcome ? 'yes' : 'no' + (p.how ? ': ' + p.how : '')) }])
  }) + C.pRaw('The Lean went faster than the rules budgeted: three weeks were allowed, and A.3 in Lean was given one chance in four. The priors are graded as written, not re-tuned.')
}));

O.push(C.section({
  lab: 'H5 · who did what first', title: 'The dated sources', id: 'provenance',
  bodyRaw: C.plainList(R.H5.sources.map((s) => ({ b: s.who + ', ' + s.date + '.', raw: C.esc(s.what.charAt(0).toUpperCase() + s.what.slice(1)) + ' (' + a(s.url, 'source') + ').' })))
    + C.pRaw(C.esc('This reading is ' + R.H5.reading + '.'))
}));

O.push(C.section({
  lab: 'the outcome', title: 'Linked from the pull request that marks the conjecture solved', id: 'outcome',
  bodyRaw: C.pRaw('I offered the proof on ' + a(R.outcome.pr, 'pull request #7706') + ', gaps first. Five minutes later its author, ' + C.esc(R.outcome.author.replace(/, the pull request's author$/, '')) + ', added the link as the entry’s formal proof. He checked the linked source himself: ' + m('IsRamsey') + ' byte-identical, the statement equal up to namespace and whitespace, no proof placeholders or custom axioms, his file building. He did not re-run the Lean 4.34.1 build or the kernels, and says so. The pull request is open, waiting on a maintainer.')
    + C.pRaw('He asked for an entry in Palomar, the registry formal-conjectures prefers for research results. It is in preparation; the link will move to it when it is listed.')
}));

O.push(C.section({
  lab: 'the method', title: 'Rules first, sealed, then the run', id: 'method',
  bodyRaw: C.pRaw('Every question, every verdict rule and every prediction was written and committed before any code ran (' + rec(R.preregistration) + ', with its dated amendments), and each stage was sealed: a salted fingerprint of the private work posted to a public registry and to Bitcoin through OpenTimestamps, proving the date without showing the content.')
    + C.plainList(R.seals.map((s) => ({ b: 'Seal ' + s.seal + ', ' + s.what + '.', raw: m(s.digest.slice(0, 16) + '…') + ' · ' + C.esc(s.anchors) })))
    + C.figure({ svgRaw: FIG_TIME, wide: true, record: ['certs/heptagon.json', 'corpus/heptagon/timeline.json'],
        stop: 'a run starts before its rules, a result is sealed before its run ends, or the events fall out of order',
        caption: 'The order of events. The rules were sealed at 04:29 UTC, a minute before the first machine was started; the results of H1 to H4 and the kernels were sealed at 07:19. The corollary’s rules were written at 12:06, before its run, and sealed later with the drafts. The published code was re-run from 15:29 and sealed at 16:54, before the repository went public at 19:25. Seal times are this repository’s public commits; the runs’ times come from their logs and the private plan’s commits; the publications’ from GitHub.' })
}));

O.push(C.section({
  lab: 'check it yourself', title: 'How to re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The Lean.', raw: a(R.pins.lean.repository, 'carlostoledo1891/heptagon-ramsey-lean') + ' at ' + m(R.pins.lean.tag) + ': ' + m('./REPRODUCE.sh') + ' on a Linux machine with 16 GB builds the three roots, runs the audit and its controls and the verbatim checks (about 15 minutes); ' + m('--kernels') + ' adds Lean from scratch, an export, nanoda and con-ron.' },
    { b: 'The record.', raw: m('node tools/record-heptagon.js --check') + ' re-derives every verdict from ' + rec('corpus/heptagon/runs') + ' and re-runs decider B and its mutants (standard library only); ' + m('--full') + ' re-runs decider A too (SymPy, a few minutes).' },
    { b: 'The deciders alone.', raw: rec('corpus/heptagon/h1/decider-a/decide_a.py') + ' and ' + rec('corpus/heptagon/h1/decider-b/decider_b.py') + '.' },
    { b: 'The paper.', raw: a('https://arxiv.org/abs/2609.23327', 'arXiv:2609.23327v1') + ', the TeX source pinned by sha256 ' + m(R.pins.paper.texSha256.slice(0, 16) + '…') + '. It is not copied here.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-heptagon.js from certs/heptagon.json (tools/record-heptagon.js --check). I did this with Claude agents (Anthropic); Claude wrote the Lean under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'heptagon.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/heptagon.html', og: { image: '/og-heptagon.png', alt: OG.alt('heptagon') },
    desc: 'Pálvölgyi’s seven-point counterexample to Graham’s conjecture and his appendix Theorem A.3, marked unchecked, decided in Lean through OpenAI’s classification: five kernels accept, only the standard axioms, eleven planted fakes caught; the open pull request marking the conjecture solved links the proof.' }));
console.log('reports/heptagon.html written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
