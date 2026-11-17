#!/usr/bin/env node
/* build-report-physics-key.js — reports/physics-key.html: the physics answer key, v0.

   Sixty recorded runs of MuJoCo (three scenes whose physics is known exactly, five integrators, four timesteps), each
   decided in exact arithmetic against conservation laws: every binary64 the engine writes is an exact fraction, so
   "within 1%" is a comparison of whole numbers. Two deciders that share no code (instruments/physicskey/decide.js and
   decide2.py) agree on every field; the rules (corpus/physics-key/RULES.md) were committed before the first step.

   NOTHING HERE IS A FAULT REPORT AND NOTHING IS A DISCOVERY ABOUT THE ENGINE. MuJoCo's documentation states the
   behaviour the runs show, and its own tests assert it in floating point. What stays open comes first. Every number,
   verdict word and count on the page is read from certs/physics-key.json through playground/physics-key/facts.js, the
   one reading the instrument page shares, and the build refuses when the record stops saying what the page states.

   usage: node tools/build-report-physics-key.js                                                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const K = require(path.join(ROOT, 'playground', 'physics-key', 'facts.js'));   /* refuses here when a sentence below is no longer true */
const { REC, F, STEPS, NAME, run, top } = K;
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const tag = (v) => C.tag(v);
const REC_FILE = 'certs/physics-key.json', RULES = 'corpus/physics-key/RULES.md';
/* fmt.js prints for HTML; these sentences go through C.esc, so take its entities back to characters */
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻' };
const plain = (html) => html.replace(/&times;/g, ' × ').replace(/&minus;/g, '−').replace(/&micro;/g, 'µ').replace(/<sup>(.*?)<\/sup>/g, (_, x) => x.replace(/./g, (ch) => SUP[ch] || ch));
const size = (s, kind) => plain(F.size(s, kind));
const signed = (L, kind) => plain(F.signed(L.last.lo, L.last.hi, kind));
const ENGINE = K.engine;
const DOCS = 'https://mujoco.readthedocs.io/en/stable/computation/index.html';

const dE = top('euler', '0.002'), dI = top('implicitfast', '0.002'), dR = top('rk4', '0.002');
const fall = (i, h) => run('fall', i, h).laws, pend = (i, h) => run('pendulum', i, h).laws;
const cal = REC.calibration;
K.need(cal.runs === REC.runs.length && cal.C0 === cal.runs && cal.C1max <= 1e-9 && cal.C2max <= 1e-9 && cal.C1plantedMin > 1e-3, 'the calibration no longer says what the page says');
/* a small positive number as one digit times a power of ten, rounded UP (a printed bound is never below the value) */
const e1 = (x) => { let e = Math.floor(Math.log10(x)), d = Math.ceil(x / Math.pow(10, e) - 1e-12); if (d === 10) { d = 1; e += 1; } return d + ' × 10' + String(e).replace(/./g, (ch) => SUP[ch === '-' ? '−' : ch] || ch); };
for (const i of K.INTEGRATORS) for (const h of STEPS) K.need(fall(i, h)['F-VEL'].tolerances['1e-9'].verdict === 'CERTIFIED', 'the page says the falling speed is right to a billionth of a metre per second in every run');

/* ---- the figure: the spin energy of a body with no force on it, at the default timestep, as decided ---- */
const pts = (id) => { const t = K.trace(id, 'T-ENERGY'), n = 240, out = []; for (let j = 0; j <= n; j++) { const k = Math.round(j * (t.length - 1) / n); out.push([10 * k / (t.length - 1), 100 * t[k]]); } return out; };
const FIG = CH.lines({
  w: 900, h: 360, x0: 0, x1: 10, y0: -2.2, y1: 2.2, hover: false,
  yTicks: [-2, -1, 0, 1, 2].map((v) => ({ v, t: (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%' })), xTicks: [0, 2, 4, 6, 8, 10].map((v) => ({ v, t: String(v) })),
  xLabel: 'seconds', yLabel: 'spin energy, change since the start',
  series: [
    { name: 'Euler, the engine’s default: ' + signed(dE['T-ENERGY'], 'rel') + ' after 10 s', pts: pts('top-euler-h0.002') },
    { name: 'implicitfast, the one its documentation recommends: ' + signed(dI['T-ENERGY'], 'rel'), pts: pts('top-implicitfast-h0.002') },
    { name: 'RK4: never more than ' + size(dR['T-ENERGY'].max.hi, 'rel') + ' away', pts: pts('top-rk4-h0.002') }
  ],
  alt: 'Three curves over ten seconds for a tumbling body with no force on it. Physics says its spin energy stays level. Under Euler it climbs in steps to about plus 1.9 per cent; under implicitfast it falls in steps to about minus 1.8 per cent; under RK4 it stays on the zero line.'
});

/* ---- the three tables, one per scene: its headline law for every integrator at every timestep ---- */
const table = (s) => C.table({
  cols: [{ h: 'integrator' }].concat(STEPS.map((h) => ({ h: h + ' s' + (h === '0.002' ? ' (the default)' : '') }))),
  rows: K.rowsOf(s).map((g) => [g.map((i) => NAME[i]).join(', ')].concat(STEPS.map((h) => {
    const c = K.cell(s, g[0], h);
    return { raw: m(plain(c.max)) + (c.end === null ? '' : C.esc(' · ' + plain(c.end) + ' at the end')) + '<br>' + C.esc(c.held === null ? 'inside no tolerance tried' : 'inside ' + plain(c.held)) };
  })))
});

const TITLE = 'The physics answer key: sixty simulator runs decided in exact arithmetic';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'A physics engine writes its state as floating-point numbers, and every one of those is an exact fraction. So whether a recorded run kept its energy, to a stated tolerance, can be decided with whole numbers and no rounding in the decision. '
    + 'With Claude (Anthropic’s AI model), I recorded ' + REC.runs.length + ' runs of ' + ENGINE + ' on three scenes whose physics is known exactly and decided each recorded file that way. The engine’s own documentation already describes what the runs show. What is added here is the exact decision, the step at which each tolerance first fails, and a page that decides the same bytes again in a browser tab.'
}));
O.push(C.figure({ hero: true, svgRaw: FIG, record: [REC_FILE],
  caption: 'A flat body tumbling in empty space, with no force and no torque on it, simulated for 10 seconds at the engine’s default timestep of 0.002 s. Its spin energy should not change. Each curve is drawn from the exactly decided value at every recorded step.',
  stop: 'a run file is not the pinned bytes, or the record no longer says that the Euler run gains energy at its first step and that the implicit runs never gain any' }));
O.push(C.stats([
  { k: 'recorded runs', v: String(REC.runs.length), n: 'three scenes, five integrators, four timesteps' },
  { k: 'verdicts', v: N(K.verdicts), n: N(REC.count.CERTIFIED) + ' certified, ' + N(REC.count.REFUTED) + ' refuted, ' + REC.count.REFUSED + ' refused' },
  { k: 'files on which two deciders agree', v: REC.deciders.comparedRuns + ' of ' + REC.deciders.comparedRuns, n: 'JavaScript and Python, no shared code, every field' },
  { k: 'planted files decided as planted', v: REC.planted.files.length + ' of ' + REC.planted.files.length, n: 'synthetic runs with a known answer' }
]));
O.push(C.scope('MuJoCo is Google DeepMind’s engine. Nothing on this page is a fault in it: an integrator of finite order is expected to move away from the true motion, and the documentation says so. Each verdict is about one recorded file of bytes, never about the engine in general. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs under my direction.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList([
  { b: 'It is not a discovery about the engine.', raw: C.esc('MuJoCo’s ') + a(DOCS, 'documentation') + C.esc(' says that integrating a spinning free body explicitly can gain energy, and that its implicit integrators damp a tumble instead. Its ') + a('https://github.com/google-deepmind/mujoco/blob/main/test/engine/engine_forward_test.cc', 'own tests') + C.esc(' check the energy of a tumbling free body, in floating point with a tolerance. Free fall and the same tumble were compared across four other engines in 2014 and 2015 (the ') + a('https://github.com/scpeters/benchmark', 'Gazebo “boxes” benchmark') + C.esc('), and energy and momentum across five engines in 2015 (') + a('https://roboti.us/lab/papers/ErezICRA15.pdf', 'Erez, Tassa and Todorov') + C.esc('). All of those plot or assert floating-point errors. I looked for an earlier case of conservation laws decided on an engine’s recorded output in exact arithmetic and found none; that is a search, not a proof that none exists.') },
  { b: 'One engine, one version, one machine.', text: 'The bytes were written by ' + ENGINE + ' on one ' + REC.engine.machine + ' Mac. Another platform may write different last bits. The verdicts are about the pinned bytes.' },
  { b: 'The tolerances are mine.', text: 'Six per law, from 1% (or 1 cm) down to exactly zero, fixed before the first run. No sentence of the engine’s documentation promises any of them.' },
  { b: 'Only conserved quantities, and nothing a robot touches.', text: 'The pendulum’s timing and the tumbling body’s attitude are not compared with a closed form; only energy and angular momentum are. There is no contact and no friction in any scene, and those are where robots spend their time and where a single right answer stops existing.' },
  { b: 'Between the recorded steps, nothing is said.', text: 'A law that holds at every recorded step holds at those instants.' },
  { b: 'One law was added after the runs were decided.', raw: C.esc('The rules were committed before any simulation step. The law “the spin energy never rises” was added afterwards, when I read that the documentation states it; I had by then seen the other verdicts and an informal count. It is marked as an amendment in ') + rec(RULES) + C.esc(' and is not pre-registered.') },
  { b: 'The second decider is independent by procedure only.', text: 'It was written by a separate session of the same AI model, given the rules and nothing of the first decider. Both ran under one person. Exact programs decide here, not a model; you should still know that a model wrote both.' },
  { b: 'The fifth integrator is new.', text: 'The documentation calls “discrete” new and subject to change. In all three scenes it wrote the same bytes as implicitfast.' }
]) }));

O.push(C.section({ lab: 'the idea', title: 'A float is a fraction', id: 'idea', bodyRaw:
  C.pRaw(C.esc('A 64-bit floating-point number is a whole number times a power of two. A simulator’s state is a list of them: the time, the positions, the velocities. Kinetic energy and angular momentum are sums of products of those numbers, so for a recorded step they are fractions too, with no error at all. “The energy at step 4,812 is within 1% of the energy at step 0” is then a comparison of two whole numbers.'))
  + C.pRaw(C.esc('That removes one layer of doubt. When a floating-point check says an error is 1.9%, the check itself carries rounding. Here the only rounding is the engine’s own, which is the thing being measured. The pendulum needs a cosine, which is not a fraction; it is trapped between two fractions, as tightly as each comparison needs.'))
}));

O.push(C.section({ lab: 'the scenes', title: 'Three motions with a known answer', id: 'scenes', bodyRaw: C.plainList([
  { b: 'A falling body.', text: 'Dropped from rest, nothing in its way, for 2 seconds. Its height at every instant is the starting height minus half of g times the time squared, and its speed is g times the time. Two laws: position and speed against those formulas.' },
  { b: 'A pendulum.', text: 'One weight on a frictionless hinge, let go from rest, for 10 seconds. One law: its total energy stays what it was.' },
  { b: 'A tumbling body.', text: 'A flat body in empty space, spinning about its middle axis with a small nudge, so it flips over and over (the tennis racket effect), for 10 seconds. Four laws: its spin energy stays what it was; its spin energy never rises; its angular momentum keeps its size; its angular momentum stays the same vector.' },
  { b: 'The runs.', text: 'Each scene with each of the five integrators ' + ENGINE + ' names (Euler, which is the default; implicitfast, which the documentation recommends; implicit; discrete; RK4) at four timesteps: 0.01, 0.005, 0.002 (the default) and 0.001 seconds. ' + REC.runs.length + ' files, each named by its sha256.' }
]) }));

O.push(C.section({ lab: 'the falling body', title: 'The speed is right; the position lags', id: 'fall', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest distance between the recorded height and the formula over 2 seconds, rounded up, and the tightest tolerance the whole run stays inside. Four of the five integrators wrote the same bytes.')) + '</div>'
  + table('fall')
  + '<div class="col">' + C.plainList([
    { b: 'At the default timestep', raw: C.esc('the body ends ' + size(K.fallE.max.hi, 'm') + ' from the formula and first passes 1 cm at step ' + N(K.fallE.tolerances['1e-2'].firstStep) + '. ') + tag('REFUTED') + C.esc(' at 1 cm; at half the timestep the whole fall stays inside 1 cm.') },
    { b: 'Its speed', raw: C.esc('is within a billionth of a metre per second at every step of every run. ') + tag('CERTIFIED') + C.esc(' The step updates the speed first and then moves the body with the new speed, so the position is always one step’s worth ahead: an error that grows in proportion to time and to the timestep.') },
    { b: 'With RK4', raw: C.esc('the position stays within ' + size(K.fallR.max.hi, 'm') + ' at the default timestep. ') + tag('CERTIFIED') + C.esc(' at a millionth of a millionth of a metre.') }
  ]) + '</div>'
}));

O.push(C.section({ lab: 'the pendulum', title: 'Energy wobbles, and comes back', id: 'pendulum', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest change of the total energy over 10 seconds, as a share of the weight times g times the length.')) + '</div>'
  + table('pendulum')
  + '<div class="col">' + C.pRaw(C.esc('With the default integrator at the default timestep the energy is never more than ' + size(pend('euler', '0.002')['P-ENERGY'].max.hi, 'rel') + ' from its starting value, and ' + signed(pend('euler', '0.002')['P-ENERGY'], 'rel') + ' at the end. With RK4 it is never more than ' + size(pend('rk4', '0.002')['P-ENERGY'].max.hi, 'rel') + '.')) + '</div>'
}));

O.push(C.section({ lab: 'the tumbling body', title: 'One integrator makes energy, three lose it', id: 'top', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest change of the spin energy over 10 seconds, with the change at the end. No force and no torque act in this scene.')) + '</div>'
  + table('top')
  + '<div class="col">' + C.plainList([
    { b: 'Euler, the default.', text: 'The spin energy rises at the first step of every run and ends at its largest value: ' + signed(dE['T-ENERGY'], 'rel') + ' at the default timestep. The largest rise within one step is ' + size(dE['T-MONO'].max.hi, 'rel') + ' of the starting energy.' },
    { b: 'implicitfast, implicit and discrete.', text: 'The spin energy falls: ' + signed(dI['T-ENERGY'], 'rel') + ' at the default timestep, ' + STEPS.map((h) => signed(top('implicitfast', h)['T-ENERGY'], 'rel') + ' at ' + h + ' s').join(', ') + '.' },
    { b: 'RK4.', text: 'Never more than ' + size(dR['T-ENERGY'].max.hi, 'rel') + ' from the start at the default timestep.' },
    { b: 'Angular momentum', text: 'changes with the energy: its squared size ends ' + signed(dE['T-LMAG'], 'rel') + ' under Euler and ' + signed(dI['T-LMAG'], 'rel') + ' under implicitfast at the default timestep, with no torque acting.' }
  ]) + '</div>'
}));

O.push(C.section({ lab: 'a published sentence, decided', title: 'The documentation’s own property holds exactly', id: 'documented', bodyRaw:
  C.quote({ text: 'The kinetic energy of a spinning free body is non-increasing in the absence of applied force. Steady spins about principal axes are conserved almost exactly; tumbling motion is mildly damped […]. Systems requiring long-horizon energy conservation of tumbling bodies should use the RK4 integrator.', cite: 'MuJoCo documentation, Computation, Numerical integration, “Gyroscopic derivatives for free bodies”, read 17 November 2026' })
  + C.plainList([
    { b: 'What it says.', text: 'Under the implicit and implicitfast integrators, the spin energy of a free body with no force on it never increases.' },
    { b: 'What was decided.', raw: C.esc('On each of the ' + K.docRuns + ' recorded runs it covers, the spin energy at every step is less than or equal to the step before, as fractions, with no tolerance. ') + tag('CERTIFIED') + C.esc(' The engine’s own test of the same property allows a small tolerance for rounding; on these runs none is needed.') },
    { b: 'What it does not say.', text: 'That energy is kept. It is not: these are the runs that lose it. And it covers the bodies and settings recorded here, not every free body.' },
    { b: 'For contrast.', raw: C.esc('Under Euler the same statement fails at step 1 of every run. ') + tag('REFUTED') }
  ])
}));

O.push(C.section({ lab: 'written before running', title: 'What I expected, and where I was wrong', id: 'expected', bodyRaw: C.plainList([
  { b: 'The falling body.', text: 'I expected the position to fail at 1 cm within 2 seconds at the default timestep while the speed held, and RK4 to hold the position to rounding. That is what the bytes say.' },
  { b: 'The tumbling body.', text: 'I expected the integrators that treat the spinning term implicitly to change the energy less than Euler does. They do not: at the default timestep they lose ' + size(dI['T-ENERGY'].max.hi, 'rel') + ' where Euler gains ' + size(dE['T-ENERGY'].max.hi, 'rel') + '. What differs is the direction, which is the property the documentation states. My expectation came from an older version of the documentation.' }
]) }));

O.push(C.section({ lab: 'how it was checked', title: 'Rules first, two deciders, planted files', id: 'method', bodyRaw: C.plainList([
  { b: 'The rules came first.', raw: rec(RULES) + C.esc(' was committed before the generator existed: the scenes, the laws, the six tolerances, the three verdict words, the exact form of every printed number, and what I expected. One law was added afterwards and is marked.') },
  { b: 'Reading the engine’s conventions.', text: 'Before any verdict was read, three floating-point checks of my reading of the engine: a second run with the engine’s own energy and angular-momentum outputs switched on wrote identical bytes (' + cal.C0 + ' of ' + cal.runs + ' runs); my angular momentum agrees with the engine’s to ' + e1(cal.C1max) + ' of its size, and a deliberately wrong reading of the velocity frame disagrees by more than ' + Math.floor(cal.C1plantedMin) + ' times its size; my energy change agrees with the engine’s to ' + e1(cal.C2max) + '.' },
  { b: 'Decider 1.', raw: rec(REC.deciders.one.path) + C.esc(': JavaScript, whole numbers only. The same file runs in the browser on the instrument page.') },
  { b: 'Decider 2.', raw: rec(REC.deciders.two.path) + C.esc(': Python fractions, written from the rules alone by a session that never saw decider 1.') },
  { b: 'They agree.', raw: C.esc('On all ' + REC.deciders.comparedRuns + ' files, every verdict, every first failing step and every printed digit is the same. The record is written only then. ') + tag('CERTIFIED') },
  { b: 'Planted files.', text: REC.planted.files.length + ' synthetic runs with a known answer: an exact parabola, a constant spin, one step nudged by two parts in a million, a single planted rise, a number that is not a number, a cut file, a file with one bit flipped, and three pendulum cases that exercise the cosine. Each was decided as planted by both.' }
]) }));

O.push(C.section({ lab: 'who did what', title: 'Each part is someone’s', id: 'roles', bodyRaw: C.plainList([
  { b: 'The engine and its documentation.', text: 'MuJoCo: Google DeepMind and its contributors.' },
  { b: 'Earlier comparisons of engines against conservation laws.', text: 'The Gazebo “boxes” benchmark (free fall and the tumbling box across four engines); Erez, Tassa and Todorov (2015); MuJoCo’s own test suite.' },
  { b: 'The checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the generator, both deciders (the second in a separate session, from the rules alone) and this page’s builder under my direction. Recorded and decided on 17 November 2026.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'In a browser.', raw: a('/instruments/physics-key/', 'The instrument page') + C.esc(' fetches any of the ' + REC.runs.length + ' files, checks its sha256 and decides it again in your tab with decider 1.') },
  { b: 'The record.', raw: m('node tools/record-physics-key.js --check') + C.esc(' runs both deciders on every file again and refuses on any difference from ') + rec(REC_FILE) + C.esc('. About two minutes; Python’s standard library and Node, nothing else.') },
  { b: 'The bytes.', raw: m('python instruments/physicskey/generate.py --check') + C.esc(' runs the engine again and compares every file’s sha256 with ') + rec('corpus/physics-key/runs/runs.json') + C.esc('. It needs MuJoCo ' + REC.engine.mujoco + '; on another platform the bytes may differ.') },
  { b: 'The scenes.', raw: rec('corpus/physics-key/scenes') + C.esc(': three short model files.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-physics-key.js from ' + REC_FILE + '. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'physics-key.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/physics-key.html',
  desc: 'Every number a physics engine writes is an exact fraction, so conservation laws can be decided on a recorded run with whole numbers. Sixty MuJoCo runs of three scenes with a known answer, decided by two programs that share no code; the engine’s documentation already describes what they show, and what stays open is said first.' }));
console.log('reports/physics-key.html written · ' + REC.runs.length + ' runs · ' + N(K.verdicts) + ' verdicts (' + REC.count.CERTIFIED + ' CERTIFIED, ' + REC.count.REFUTED + ' REFUTED, ' + REC.count.REFUSED + ' REFUSED) · two deciders agree on ' + REC.deciders.comparedRuns + ' files');
