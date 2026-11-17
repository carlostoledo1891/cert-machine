#!/usr/bin/env node
/* build-report-physics-key.js — reports/physics-key.html: the physics answer key, two engines.

   One hundred recorded runs: sixty of MuJoCo (three scenes whose physics is known exactly, five integrators, four
   timesteps) and forty of Newton (the same scenes, two solvers each at its defaults and with the angular damping off,
   four timesteps), each decided in exact arithmetic against conservation laws: every float an engine writes is an
   exact fraction, so "within 1%" is a comparison of whole numbers. Two deciders that share no code
   (instruments/physicskey/decide.js and decide2.py) agree on every field; the rules (corpus/physics-key/RULES.md) were
   committed before the first step of each engine.

   NOTHING HERE IS A FAULT REPORT. MuJoCo's documentation states the behaviour its runs show, and its own tests assert
   it in floating point. Newton's angular damping is a documented argument with a documented default; the page sets one
   sentence of its class description beside what that default does, and says so in those words. What stays open comes
   first. Every number, verdict word and count on the page is read from certs/physics-key.json and
   certs/physics-key-newton.json through playground/physics-key/facts.js, the one reading the instrument page shares,
   and the build refuses when a record stops saying what the page states.

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
const { REC, RECN, F, STEPS, NAME, N_NAME, N_OF, run, top } = K;
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const tag = (v) => C.tag(v);
const REC_FILE = 'certs/physics-key.json', RECN_FILE = 'certs/physics-key-newton.json', RULES = 'corpus/physics-key/RULES.md';
/* fmt.js prints for HTML; these sentences go through C.esc, so take its entities back to characters */
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻' };
const plain = (html) => html.replace(/&times;/g, ' × ').replace(/&minus;/g, '−').replace(/&micro;/g, 'µ').replace(/<sup>(.*?)<\/sup>/g, (_, x) => x.replace(/./g, (ch) => SUP[ch] || ch));
const size = (s, kind) => plain(F.size(s, kind));
const signed = (L, kind) => plain(F.signed(L.last.lo, L.last.hi, kind));
const ENGINE = K.engine, ENGINE_N = K.engineN;
const DOCS = 'https://mujoco.readthedocs.io/en/stable/computation/index.html';
const NEWTON = 'https://github.com/newton-physics/newton';
const NSRC = NEWTON + '/blob/v' + RECN.engine.newton + '/newton/_src/solvers/';
K.need(K.all.runs === 100, 'the title says one hundred runs');

const dE = top('euler', '0.002'), dI = top('implicitfast', '0.002'), dR = top('rk4', '0.002');
const fall = (i, h) => run('fall', i, h).laws, pend = (i, h) => run('pendulum', i, h).laws;
const cal = REC.calibration;
K.need(cal.runs === REC.runs.length && cal.C0 === cal.runs && cal.C1max <= 1e-9 && cal.C2max <= 1e-9 && cal.C1plantedMin > 1e-3, 'the calibration no longer says what the page says');
/* a small positive number as one digit times a power of ten, rounded UP (a printed bound is never below the value) */
const e1 = (x) => { let e = Math.floor(Math.log10(x)), d = Math.ceil(x / Math.pow(10, e) - 1e-12); if (d === 10) { d = 1; e += 1; } return d + ' × 10' + String(e).replace(/./g, (ch) => SUP[ch === '-' ? '−' : ch] || ch); };
for (const i of K.INTEGRATORS) for (const h of STEPS) K.need(fall(i, h)['F-VEL'].tolerances['1e-9'].verdict === 'CERTIFIED', 'the page says the falling speed is right to a billionth of a metre per second in every run');

/* ---- the second engine, read once ---- */
const nD = (h) => top('semiimplicit', h), nD0 = (h) => top('semiimplicit-d0', h), nF = (h) => top('featherstone', h);
const calN = RECN.calibration;
K.need(calN.runs === RECN.runs.length && calN.N0 === calN.runs && calN.N1max <= 1e-5 && calN.N1plantedMin > 1e-3 && calN.N2max <= 1e-4 && calN.N2plantedRatioMin >= 10 && calN.N3max <= 1e-5, 'the Newton calibration no longer says what the page says');
const lossAt = (h) => size(nD(h)['T-ENERGY'].max.hi, 'rel');
const secs1pc = Math.max(...STEPS.map((h) => nD(h)['T-ENERGY'].tolerances['1e-2'].firstStep * Number(h)));
K.need(nD0('0.002')['T-ENERGY'].tolerances['1e-2'].verdict === 'REFUTED', 'the page says neither damping setting keeps the energy to 1% at 0.002 s');
const list4 = (f) => STEPS.map((h) => f(h) + ' at ' + h + ' s').join(', ');

/* ---- the hero: the same tumbling body in every configuration recorded at one timestep; one line is the point ---- */
const HERO_H = '0.002';
const OTHERS = K.rowsOf('top').map((g) => g[0]).concat(K.rowsOf('top', N_OF.top).map((g) => g[0]).filter((i) => i !== 'semiimplicit'));
const nOthers = K.INTEGRATORS.length + K.N_CONFIGS.length - 1;
const worstOther = OTHERS.map((i) => top(i, HERO_H)['T-ENERGY'].max.hi).sort((x, y) => parseFloat(y) - parseFloat(x))[0];
K.need(parseFloat(worstOther) < 0.025, 'the hero says every other configuration stays within 2.5% of level');
const hpts = (id) => { const t = K.trace(id, 'T-ENERGY'), n = 240, out = []; for (let j = 0; j <= n; j++) { const k = Math.round(j * (t.length - 1) / n); out.push([10 * k / (t.length - 1), 100 * t[k]]); } return out; };
const HERO_SERIES = OTHERS.map((i) => ({ name: i, token: CH.CTX, pts: hpts('top-' + i + '-h' + HERO_H) }))
  .concat([{ name: 'Newton SolverSemiImplicit at its defaults', pts: hpts('top-semiimplicit-h' + HERO_H) }]);
/* the same drawing twice: wide, and tall for a phone, where the wide one would be read at a third of its size */
const hero = (narrow) => CH.lines({
  w: narrow ? 440 : 900, h: narrow ? 430 : 380, x0: 0, x1: 10, y0: -70, y1: 8, hover: false,
  yTicks: [-60, -40, -20, 0].map((v) => ({ v, t: (v < 0 ? '−' : '') + Math.abs(v) + '%' })), xTicks: (narrow ? [0, 5, 10] : [0, 2, 4, 6, 8, 10]).map((v) => ({ v, t: String(v) })),
  xLabel: 'seconds', yLabel: narrow ? 'spin energy, change' : 'spin energy, change since the start',
  series: HERO_SERIES,
  keys: [
    { token: CH.CAT[0], kind: 'line', t: narrow ? 'Newton, SolverSemiImplicit, defaults: ' + signed(nD(HERO_H)['T-ENERGY'], 'rel') : 'Newton, SolverSemiImplicit at its defaults: ' + signed(nD(HERO_H)['T-ENERGY'], 'rel') + ' after 10 s' },
    { token: CH.CTX, kind: 'line', t: narrow ? 'the ' + nOthers + ' others: within ' + size(worstOther, 'rel') + ' of level' : 'the ' + nOthers + ' other configurations of both engines: none more than ' + size(worstOther, 'rel') + ' from level' }
  ],
  alt: 'Spin energy over ten seconds for a tumbling body with no force on it, in every configuration recorded at the timestep 0.002 seconds. Physics says it stays level. One line, Newton’s SolverSemiImplicit at its default settings, falls steadily to about minus 63 per cent. The other lines, MuJoCo’s integrators and Newton with the damping off, stay within about 2 per cent of the zero line.'
});
const HERO = hero(false), HERO_N = hero(true);

/* ---- the second figure: MuJoCo's three behaviours on a scale fifteen times finer ---- */
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
const cells = (s, i) => STEPS.map((h) => {
  const c = K.cell(s, i, h);
  return { raw: m(plain(c.max)) + (c.end === null ? '' : C.esc(' · ' + plain(c.end) + ' at the end')) + '<br>' + C.esc(c.held === null ? 'inside no tolerance tried' : 'inside ' + plain(c.held)) };
});
const table = (s) => C.table({
  cols: [{ h: ENGINE + ', integrator' }].concat(STEPS.map((h) => ({ h: h + ' s' + (h === '0.002' ? ' (the default)' : '') }))),
  rows: K.rowsOf(s).map((g) => [g.map((i) => NAME[i]).join(', ')].concat(cells(s, g[0])))
});
/* Newton has no default timestep: a step takes the one it is given */
const tableN = (s) => C.table({
  cols: [{ h: ENGINE_N + ', solver' }].concat(STEPS.map((h) => ({ h: h + ' s' }))),
  rows: K.rowsOf(s, N_OF[s]).map((g) => [g.length === N_OF[s].length && g.length > 2 ? 'all four configurations (the same bytes)' : g.map((i) => N_NAME[i]).join('; ')].concat(cells(s, g[0])))
});

const TITLE = 'The physics answer key: one hundred simulator runs, two engines, decided in exact arithmetic';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'A physics engine writes its state as floating-point numbers, and every one of those is an exact fraction. So whether a recorded run kept its energy, to a stated tolerance, can be decided with whole numbers and no rounding in the decision. '
    + 'With Claude (Anthropic’s AI model), I recorded ' + K.all.runs + ' runs of two engines built for simulating robots, ' + ENGINE + ' and ' + ENGINE_N + ', on three scenes whose physics is known exactly, and decided each recorded file that way. For MuJoCo, the documentation already describes what the runs show. For Newton, one solver’s default settings include an angular damping that its class description does not mention where it says the method preserves energy. What is added here is the exact decision, the step at which each tolerance first fails, and a page that decides the same bytes again in a browser tab.'
}));
O.push(C.figure({ hero: true, svgRaw: HERO, svgNarrowRaw: HERO_N, record: [RECN_FILE, REC_FILE],
  caption: 'A flat body tumbling in empty space, with no force and no torque on it, simulated for 10 seconds at a timestep of ' + HERO_H + ' s. Its spin energy should not change. The line that falls is Newton’s SolverSemiImplicit built with every argument at its default, which includes an angular damping of 0.05, a documented default. The grey lines beside the zero line are every other configuration recorded at this timestep. Each curve is drawn from the exactly decided value at every recorded step.',
  stop: 'a run file is not the pinned bytes, or the record no longer says that the default run loses between 60% and 63% of its spin energy without ever gaining any, or another configuration ends more than 2.5% from level' }));
O.push(C.stats([
  { k: 'recorded runs', v: String(K.all.runs), n: REC.runs.length + ' of ' + ENGINE + ', ' + RECN.runs.length + ' of ' + ENGINE_N },
  { k: 'verdicts', v: N(K.all.CERTIFIED + K.all.REFUTED + K.all.REFUSED), n: N(K.all.CERTIFIED) + ' certified, ' + N(K.all.REFUTED) + ' refuted, ' + K.all.REFUSED + ' refused' },
  { k: 'files on which two deciders agree', v: K.all.files + ' of ' + K.all.files, n: 'JavaScript and Python, no shared code, every field' },
  { k: 'planted files decided as planted', v: REC.planted.files.length + ' of ' + REC.planted.files.length, n: 'synthetic runs with a known answer' }
]));
O.push(C.scope('MuJoCo is Google DeepMind’s engine. Newton is a Linux Foundation project initiated by Disney Research, Google DeepMind and NVIDIA. Nothing on this page is a fault report on either: an integrator of finite order is expected to move away from the true motion, and a damping that is a documented argument with a documented default is a choice, not a bug. Each verdict is about one recorded file of bytes, never about an engine in general. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs under my direction.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw: C.plainList([
  { b: 'It is not a discovery about MuJoCo.', raw: C.esc('MuJoCo’s ') + a(DOCS, 'documentation') + C.esc(' says that integrating a spinning free body explicitly can gain energy, and that its implicit integrators damp a tumble instead. Its ') + a('https://github.com/google-deepmind/mujoco/blob/main/test/engine/engine_forward_test.cc', 'own tests') + C.esc(' check the energy of a tumbling free body, in floating point with a tolerance. Free fall and the same tumble were compared across four other engines in 2014 and 2015 (the ') + a('https://github.com/scpeters/benchmark', 'Gazebo “boxes” benchmark') + C.esc('), and energy and momentum across five engines in 2015 (') + a('https://roboti.us/lab/papers/ErezICRA15.pdf', 'Erez, Tassa and Todorov') + C.esc('). All of those plot or assert floating-point errors. I looked for an earlier case of conservation laws decided on an engine’s recorded output in exact arithmetic and found none; that is a search, not a proof that none exists.') },
  { b: 'It is not a fault report on Newton.', raw: C.esc('The angular damping is an argument of the solver’s constructor, and its documentation gives the default, 0.05. The words “preserves energy” are in the class description of the integration method; they are not a stated bound, and no sentence promises that the default settings keep a free body’s energy. Passing ') + m('angular_damping=0.0') + C.esc(' turns the damping off. Newton’s ') + a(NEWTON + '/blob/v' + RECN.engine.newton + '/newton/tests/test_physics_verification.py', 'own verification tests') + C.esc(' check free fall, a pendulum’s energy, momentum and torque-free angular momentum, and each of them builds its solver with the damping set to zero. I searched the project’s issues and pull requests for the argument’s name and for “preserves energy” on 17 November 2026 and found nothing on either point; that is a search, not a proof that nobody has raised it.') },
  { b: 'Two engines, one version of each, one machine.', text: 'The bytes were written by ' + ENGINE + ' and ' + ENGINE_N + ' (with Warp ' + RECN.engine.warp + ') on one ' + REC.engine.machine + ' Mac. Newton ran on its CPU device only; its GPU device may round differently, and so may another platform. The verdicts are about the pinned bytes.' },
  { b: 'Newton computes in 32-bit floats and keeps no clock.', text: 'Every 32-bit float is an exact fraction too, so nothing about the decision changes. The time attached to each Newton step is mine: the step number times the timestep. The falling body’s laws compare against that time, so part of what they measure for Newton is the engine’s 32-bit timestep.' },
  { b: 'One cause is attributed and not shown.', text: 'With the damping off, Newton’s SolverSemiImplicit gains a little more energy than its SolverFeatherstone, and the gap grows with the number of steps. I attribute it to 32-bit rounding. I have not shown that.' },
  { b: 'Newton’s pendulum was run under one solver only.', text: 'SolverSemiImplicit holds a hinge with a damped spring and has no hinge angle in its state, so the frictionless pendulum of this page is not that solver’s system. The pendulum runs are SolverFeatherstone’s.' },
  { b: 'The tolerances are mine.', text: 'Six per law, from 1% (or 1 cm) down to exactly zero, fixed before the first run. No sentence of either engine’s documentation promises any of them.' },
  { b: 'Only conserved quantities, and nothing a robot touches.', text: 'The pendulum’s timing and the tumbling body’s attitude are not compared with a closed form; only energy and angular momentum are. There is no contact and no friction in any scene, and those are where robots spend their time and where a single right answer stops existing.' },
  { b: 'Between the recorded steps, nothing is said.', text: 'A law that holds at every recorded step holds at those instants.' },
  { b: 'One law was added after the MuJoCo runs were decided.', raw: C.esc('The rules were committed before any simulation step. The law “the spin energy never rises” was added afterwards, when I read that MuJoCo’s documentation states it; I had by then seen the other MuJoCo verdicts and an informal count. It is marked as amendment 1 in ') + rec(RULES) + C.esc(' and is not pre-registered for MuJoCo. The Newton runs came later, under amendment 2, which was committed before any Newton step and already held that law.') },
  { b: 'The second decider is independent by procedure only.', text: 'It was written by a separate session of the same AI model, given the rules and nothing of the first decider. Both ran under one person. Exact programs decide here, not a model; you should still know that a model wrote both.' },
  { b: 'MuJoCo’s fifth integrator is new.', text: 'The documentation calls “discrete” new and subject to change. In all three scenes it wrote the same bytes as implicitfast.' }
]) }));

O.push(C.section({ lab: 'the idea', title: 'A float is a fraction', id: 'idea', bodyRaw:
  C.pRaw(C.esc('A floating-point number, 64-bit or 32-bit, is a whole number times a power of two. A simulator’s state is a list of them: the time, the positions, the velocities. Kinetic energy and angular momentum are sums of products of those numbers, so for a recorded step they are fractions too, with no error at all. “The energy at step 4,812 is within 1% of the energy at step 0” is then a comparison of two whole numbers.'))
  + C.pRaw(C.esc('That removes one layer of doubt. When a floating-point check says an error is 1.9%, the check itself carries rounding. Here the only rounding is the engine’s own, which is the thing being measured. The pendulum needs a cosine, which is not a fraction; it is trapped between two fractions, as tightly as each comparison needs.'))
}));

O.push(C.section({ lab: 'the scenes', title: 'Three motions with a known answer', id: 'scenes', bodyRaw: C.plainList([
  { b: 'A falling body.', text: 'Dropped from rest, nothing in its way, for 2 seconds. Its height at every instant is the starting height minus half of g times the time squared, and its speed is g times the time. Two laws: position and speed against those formulas.' },
  { b: 'A pendulum.', text: 'One weight on a frictionless hinge, let go from rest, for 10 seconds. One law: its total energy stays what it was.' },
  { b: 'A tumbling body.', text: 'A flat body in empty space, spinning about its middle axis with a small nudge, so it flips over and over (the tennis racket effect), for 10 seconds. Four laws: its spin energy stays what it was; its spin energy never rises; its angular momentum keeps its size; its angular momentum stays the same vector.' },
  { b: 'The MuJoCo runs.', text: 'Each scene with each of the five integrators ' + ENGINE + ' names (Euler, which is the default; implicitfast, which the documentation recommends; implicit; discrete; RK4) at four timesteps: 0.01, 0.005, 0.002 (the default) and 0.001 seconds. ' + REC.runs.length + ' files, each named by its sha256.' },
  { b: 'The Newton runs.', raw: C.esc('Two solvers of ' + ENGINE_N + ', SolverSemiImplicit and SolverFeatherstone, each built twice: with every argument at its default, and with ') + m('angular_damping=0.0') + C.esc('. The falling and the tumbling body under all four, the pendulum under the two SolverFeatherstone ones, at the same four timesteps. ' + RECN.runs.length + ' files. A step is the one the package’s own tests take.') }
]) }));

O.push(C.section({ lab: 'the falling body', title: 'The speed is right; the position lags', id: 'fall', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest distance between the recorded height and the formula over 2 seconds, rounded up, and the tightest tolerance the whole run stays inside. Four of MuJoCo’s five integrators wrote the same bytes, and so did all four Newton configurations.')) + '</div>'
  + table('fall') + tableN('fall')
  + '<div class="col">' + C.plainList([
    { b: 'In MuJoCo, at the default timestep,', raw: C.esc('the body ends ' + size(K.fallE.max.hi, 'm') + ' from the formula and first passes 1 cm at step ' + N(K.fallE.tolerances['1e-2'].firstStep) + '. ') + tag('REFUTED') + C.esc(' at 1 cm; at half the timestep the whole fall stays inside 1 cm.') },
    { b: 'Its speed in MuJoCo', raw: C.esc('is within a billionth of a metre per second at every step of every run. ') + tag('CERTIFIED') + C.esc(' The step updates the speed first and then moves the body with the new speed, so the position is always one step’s worth ahead: an error that grows in proportion to time and to the timestep.') },
    { b: 'With MuJoCo’s RK4', raw: C.esc('the position stays within ' + size(K.fallR.max.hi, 'm') + ' at the default timestep. ') + tag('CERTIFIED') + C.esc(' at a millionth of a millionth of a metre.') },
    { b: 'In Newton', raw: C.esc('the position lags the same way: ' + size(K.fallN.max.hi, 'm') + ' from the formula at 0.002 s, first past 1 cm at step ' + N(K.fallN.tolerances['1e-2'].firstStep) + '. The speed stays within a millimetre per second at every step of every run ') + tag('CERTIFIED') + C.esc(' and leaves a micrometre per second by step ' + Math.max(...STEPS.map((h) => run('fall', 'semiimplicit', h).laws['F-VEL'].tolerances['1e-6'].firstStep)) + ' at every timestep ') + tag('REFUTED') + C.esc(': it is at most ' + size(STEPS.map((h) => run('fall', 'semiimplicit', h).laws['F-VEL'].max.hi).sort((x, y) => parseFloat(y) - parseFloat(x))[0], 'mps') + ' off. MuJoCo, which computes in 64-bit floats, holds a billionth on the same law; Newton computes in 32-bit floats.') }
  ]) + '</div>'
}));

O.push(C.section({ lab: 'the pendulum', title: 'Energy wobbles, and comes back', id: 'pendulum', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest change of the total energy over 10 seconds, as a share of the weight times g times the length.')) + '</div>'
  + table('pendulum') + tableN('pendulum')
  + '<div class="col">' + C.pRaw(C.esc('With MuJoCo’s default integrator at its default timestep the energy is never more than ' + size(pend('euler', '0.002')['P-ENERGY'].max.hi, 'rel') + ' from its starting value, and ' + signed(pend('euler', '0.002')['P-ENERGY'], 'rel') + ' at the end. With RK4 it is never more than ' + size(pend('rk4', '0.002')['P-ENERGY'].max.hi, 'rel') + '. Newton’s SolverFeatherstone at the same timestep: never more than ' + size(pend('featherstone', '0.002')['P-ENERGY'].max.hi, 'rel') + '. It wrote the same bytes with and without the damping argument.')) + '</div>'
}));

O.push(C.section({ lab: 'the tumbling body', title: 'Some configurations make energy, some lose it, one loses most of it', id: 'top', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('Largest change of the spin energy over 10 seconds, with the change at the end. No force and no torque act in this scene.')) + '</div>'
  + table('top') + tableN('top')
  + C.figure({ svgRaw: FIG, record: [REC_FILE],
    caption: 'The same scene on a much finer scale, MuJoCo only, at its default timestep of 0.002 s: the three behaviours of its integrators.',
    stop: 'a run file is not the pinned bytes, or the record no longer says that the Euler run gains energy at its first step and that the implicit runs never gain any' })
  + '<div class="col">' + C.plainList([
    { b: 'MuJoCo, Euler (its default).', text: 'The spin energy rises at the first step of every run and ends at its largest value: ' + signed(dE['T-ENERGY'], 'rel') + ' at the default timestep. The largest rise within one step is ' + size(dE['T-MONO'].max.hi, 'rel') + ' of the starting energy.' },
    { b: 'MuJoCo, implicitfast, implicit and discrete.', text: 'The spin energy falls: ' + signed(dI['T-ENERGY'], 'rel') + ' at the default timestep, ' + STEPS.map((h) => signed(top('implicitfast', h)['T-ENERGY'], 'rel') + ' at ' + h + ' s').join(', ') + '.' },
    { b: 'MuJoCo, RK4.', text: 'Never more than ' + size(dR['T-ENERGY'].max.hi, 'rel') + ' from the start at the default timestep.' },
    { b: 'Newton, SolverSemiImplicit at its defaults.', raw: C.esc('The spin energy falls at every timestep: ' + list4((h) => signed(nD(h)['T-ENERGY'], 'rel')) + '. “Within 1% of its starting value” first fails within ' + secs1pc.toFixed(2) + ' s of the start in every run. ') + tag('REFUTED') + C.esc(' “Never rises” holds at every step of every run, with no tolerance. ') + tag('CERTIFIED') },
    { b: 'Newton, SolverSemiImplicit with the damping off.', text: 'The spin energy rises, as under MuJoCo’s Euler: ' + list4((h) => signed(nD0(h)['T-ENERGY'], 'rel')) + ' (MuJoCo’s Euler: ' + STEPS.map((h) => signed(top('euler', h)['T-ENERGY'], 'rel')).join(', ') + ').' },
    { b: 'Newton, SolverFeatherstone.', text: 'The same bytes with the default damping and with the damping off, at every timestep. The spin energy rises: ' + list4((h) => signed(nF(h)['T-ENERGY'], 'rel')) + '.' },
    { b: 'Angular momentum', text: 'changes with the energy, with no torque acting. At the timestep 0.002 s its squared size ends ' + signed(dE['T-LMAG'], 'rel') + ' under MuJoCo’s Euler, ' + signed(dI['T-LMAG'], 'rel') + ' under implicitfast, and ' + signed(nD('0.002')['T-LMAG'], 'rel') + ' under Newton’s SolverSemiImplicit at its defaults.' }
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

O.push(C.section({ lab: 'a second published sentence', title: 'A sentence and a default', id: 'newton', bodyRaw:
  C.quote({ text: 'Semi-implicit time integration is a variational integrator that preserves energy, however it not unconditionally stable, and requires a time-step small enough to support the required stiffness and damping forces.', cite: 'Newton ' + RECN.engine.newton + ', the class description of SolverSemiImplicit and, in the same words, of SolverFeatherstone; quoted as written' })
  + C.plainList([
    { b: 'What it says.', text: 'That the integration method keeps energy. It is a description of the method, with no bound and no tolerance.' },
    { b: 'The default beside it.', raw: C.esc('Both constructors take ') + m('angular_damping') + C.esc(', documented as “Angular damping factor”, default 0.05. In ') + a(NSRC + 'solver.py', 'the shared rigid-body step') + C.esc(' every step of a body ends by multiplying its angular velocity by one minus the damping times the timestep. So a body built with the defaults is damped, by design.') },
    { b: 'What was decided, at the defaults.', raw: C.esc('On the ' + STEPS.length + ' recorded runs of SolverSemiImplicit with every argument at its default, the tumbling body loses ' + lossAt('0.01') + ' to ' + lossAt('0.001') + ' of its spin energy in 10 seconds, with no force on it. “The spin energy stays within 1% of its starting value”: ') + tag('REFUTED') + C.esc(' in each, first within ' + secs1pc.toFixed(2) + ' s. “The spin energy never rises”: ') + tag('CERTIFIED') + C.esc(' in each, at every step, with no tolerance. The loss is the size the documented default predicts: a factor of about one minus 0.05 times the timestep on the angular velocity at every step is a loss of about 63% of the energy over 10 seconds.') },
    { b: 'With the damping off.', text: 'The same solver gains energy instead, as an explicit step does: ' + signed(nD0('0.002')['T-ENERGY'], 'rel') + ' at 0.002 s, against ' + signed(dE['T-ENERGY'], 'rel') + ' for MuJoCo’s Euler. Neither setting keeps the energy to 1% over 10 seconds at that timestep.' },
    { b: 'The other solver does not read the argument.', raw: C.esc('SolverFeatherstone has the same sentence and the same documented default. In ' + ENGINE_N + ' its constructor stores the value and, as far as I could find by reading ') + a(NEWTON + '/tree/v' + RECN.engine.newton + '/newton/_src/solvers/featherstone', 'its source') + C.esc(', nothing reads it. The bytes agree: with the default and with the damping off it wrote identical files, the same sha256, in all ' + K.pairsSame + ' pairs: three scenes at four timesteps.') },
    { b: 'What this is not.', text: 'A bug report. A user who wants a free body to keep spinning passes one argument, and Newton’s own tests do. What the page records is that the defaults and the sentence point in different directions, and by how much on these files.' }
  ])
}));

O.push(C.section({ lab: 'written before running', title: 'What I expected, and where I was wrong', id: 'expected', bodyRaw: C.plainList([
  { b: 'The falling body, MuJoCo.', text: 'I expected the position to fail at 1 cm within 2 seconds at the default timestep while the speed held, and RK4 to hold the position to rounding. That is what the bytes say.' },
  { b: 'The tumbling body, MuJoCo.', text: 'I expected the integrators that treat the spinning term implicitly to change the energy less than Euler does. They do not: at the default timestep they lose ' + size(dI['T-ENERGY'].max.hi, 'rel') + ' where Euler gains ' + size(dE['T-ENERGY'].max.hi, 'rel') + '. What differs is the direction, which is the property the documentation states. My expectation came from an older version of the documentation.' },
  { b: 'Newton at its defaults.', text: 'From the source, before any step: a loss of about 63% at every timestep, and no rise at any step, of which I was less sure at the largest timestep. The bytes: ' + lossAt('0.01') + ' to ' + lossAt('0.001') + ', and no rise at any step of any run.' },
  { b: 'Newton with the damping off.', text: 'I expected SolverSemiImplicit to reproduce the gains of MuJoCo’s Euler to about the size of 32-bit rounding. At the two larger timesteps it does (' + signed(nD0('0.01')['T-ENERGY'], 'rel') + ' and ' + signed(nD0('0.005')['T-ENERGY'], 'rel') + ' against ' + signed(top('euler', '0.01')['T-ENERGY'], 'rel') + ' and ' + signed(top('euler', '0.005')['T-ENERGY'], 'rel') + '). At the smallest it gains about a quarter more (' + signed(nD0('0.001')['T-ENERGY'], 'rel') + ' against ' + signed(top('euler', '0.001')['T-ENERGY'], 'rel') + '). There I was wrong.' },
  { b: 'SolverFeatherstone.', text: 'I expected identical files with and without the damping argument, because I had found nothing in the source that reads it. They are identical in every pair. I expected its gains to be close to MuJoCo’s Euler, with less confidence: they are (' + list4((h) => signed(nF(h)['T-ENERGY'], 'rel')) + ').' },
  { b: 'Newton’s falling body and pendulum.', text: 'I expected the position to lag as in MuJoCo, the speed to fail somewhere between a millimetre and a nanometre per second because the arithmetic is 32-bit (I did not know where), and the pendulum’s energy to wobble about as much as under MuJoCo’s Euler. All three are what the bytes say.' }
]) }));

O.push(C.section({ lab: 'how it was checked', title: 'Rules first, two deciders, planted files', id: 'method', bodyRaw: C.plainList([
  { b: 'The rules came first.', raw: rec(RULES) + C.esc(' was committed before the generator existed: the scenes, the laws, the six tolerances, the three verdict words, the exact form of every printed number, and what I expected. One law was added afterwards and is marked. The second engine is an amendment to the same file, committed before any Newton step, with what I expected of it.') },
  { b: 'Reading MuJoCo’s conventions.', text: 'Before any verdict was read, three floating-point checks of my reading of the engine: a second run with the engine’s own energy and angular-momentum outputs switched on wrote identical bytes (' + cal.C0 + ' of ' + cal.runs + ' runs); my angular momentum agrees with the engine’s to ' + e1(cal.C1max) + ' of its size, and a deliberately wrong reading of the velocity frame disagrees by more than ' + Math.floor(cal.C1plantedMin) + ' times its size; my energy change agrees with the engine’s to ' + e1(cal.C2max) + '.' },
  { b: 'Reading Newton’s conventions.', text: 'Newton has no energy or momentum output to compare with, so the checks are different. Every run was recorded twice from freshly built models and the two files are identical (' + calN.N0 + ' of ' + calN.runs + '). My angular momentum agrees with the one built from the engine’s own rotation function to ' + e1(calN.N1max) + ' of its size, and two deliberately wrong readings (the angular velocity taken in the body frame, the quaternion taken scalar-first) each disagree by more than ' + (Math.floor(calN.N1plantedMin * 10) / 10) + ' times its size. One step replayed in 64-bit floats from each recorded row lands on the next row to ' + e1(calN.N2max) + ' of the starting spin, and the replay with the damping fits the default solver’s files at least ' + Math.floor(calN.N2plantedRatioMin) + ' times better than the replay without it. The pendulum’s height and speed from the hinge angle agree with the body the engine reports to ' + e1(calN.N3max) + '.' },
  { b: 'Decider 1.', raw: rec(REC.deciders.one.path) + C.esc(': JavaScript, whole numbers only. The same file runs in the browser on the instrument page.') },
  { b: 'Decider 2.', raw: rec(REC.deciders.two.path) + C.esc(': Python fractions, written from the rules alone by a session that never saw decider 1.') },
  { b: 'They agree.', raw: C.esc('On all ' + K.all.files + ' files, every verdict, every first failing step and every printed digit is the same. The record is written only then. ') + tag('CERTIFIED') },
  { b: 'Planted files.', text: REC.planted.files.length + ' synthetic runs with a known answer: an exact parabola, a constant spin, one step nudged by two parts in a million, a single planted rise, a number that is not a number, a cut file, a file with one bit flipped, three pendulum cases that exercise the cosine, and one file read under both engines’ layouts, right under one and wrong under the other. Each was decided as planted by both.' }
]) }));

O.push(C.section({ lab: 'who did what', title: 'Each part is someone’s', id: 'roles', bodyRaw: C.plainList([
  { b: 'The engines and their documentation.', text: 'MuJoCo: Google DeepMind and its contributors. Newton: the Newton developers, a Linux Foundation project initiated by Disney Research, Google DeepMind and NVIDIA, built on NVIDIA Warp.' },
  { b: 'Earlier comparisons of engines against conservation laws.', text: 'The Gazebo “boxes” benchmark (free fall and the tumbling box across four engines); Erez, Tassa and Todorov (2015); MuJoCo’s own test suite; Newton’s own verification tests.' },
  { b: 'The checks on this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the generator, both deciders (the second in a separate session, from the rules alone) and this page’s builder under my direction. Recorded and decided on 17 November 2026.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'In a browser.', raw: a('/instruments/physics-key/', 'The instrument page') + C.esc(' fetches any of the ' + K.all.runs + ' files, checks its sha256 and decides it again in your tab with decider 1.') },
  { b: 'The record.', raw: m('node tools/record-physics-key.js --check') + C.esc(' runs both deciders on every file again and refuses on any difference from ') + rec(REC_FILE) + C.esc(' or ') + rec(RECN_FILE) + C.esc('. About two minutes; Python’s standard library and Node, nothing else.') },
  { b: 'The bytes.', raw: m('python instruments/physicskey/generate.py --check') + C.esc(' and ') + m('python instruments/physicskey/generate_newton.py --check') + C.esc(' run the engines again and compare every file’s sha256 with ') + rec('corpus/physics-key/runs/runs.json') + C.esc(' and ') + rec('corpus/physics-key/newton/runs.json') + C.esc('. They need MuJoCo ' + REC.engine.mujoco + ', Newton ' + RECN.engine.newton + ' and Warp ' + RECN.engine.warp + ' (') + rec('instruments/physicskey/requirements.txt') + C.esc('); on another platform the bytes may differ.') },
  { b: 'The scenes.', raw: rec('corpus/physics-key/scenes') + C.esc(': three short model files for MuJoCo. Newton’s are built in ') + rec('instruments/physicskey/generate_newton.py') + C.esc('.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-physics-key.js from ' + REC_FILE + ' and ' + RECN_FILE + '. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'physics-key.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/physics-key.html',
  desc: 'Every number a physics engine writes is an exact fraction, so conservation laws can be decided on a recorded run with whole numbers. One hundred runs of MuJoCo and Newton on three scenes with a known answer, decided by two programs that share no code. What stays open is said first.' }));
console.log('reports/physics-key.html written · ' + K.all.runs + ' runs (' + REC.runs.length + ' ' + ENGINE + ', ' + RECN.runs.length + ' ' + ENGINE_N + ') · ' + N(K.all.CERTIFIED + K.all.REFUTED + K.all.REFUSED) + ' verdicts (' + K.all.CERTIFIED + ' CERTIFIED, ' + K.all.REFUTED + ' REFUTED, ' + K.all.REFUSED + ' REFUSED) · two deciders agree on ' + K.all.files + ' files');
