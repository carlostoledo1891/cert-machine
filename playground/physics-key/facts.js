/* facts.js — the ONE reading of the two records of the physics answer key for pages: certs/physics-key.json
   (MuJoCo) and certs/physics-key-newton.json (Newton, amendment 2 of the rules). The instrument
   (playground/physics-key/build.js) and the report (tools/build-report-physics-key.js) both state things about the
   records in words; every such sentence is checked here, once, and both builders refuse when a record stops saying it.
   playground/physics-key/ · cert-machine · 2026-11-17 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require(path.join(__dirname, 'fmt.js'));
const die = (m) => { throw new Error('physics key: ' + m); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const file = (rel) => fs.readFileSync(path.join(ROOT, rel));

const REC = JSON.parse(file('certs/physics-key.json'));
const MAN = JSON.parse(file('corpus/physics-key/runs/runs.json'));
/* the record names what it was made from; the page is only as good as those files still being the ones on disk
   (the full re-derivation, both deciders on every byte, is tools/record-physics-key.js --check, a battery) */
need(sha(file(REC.manifest.path)) === REC.manifest.sha256, 'the manifest is not the one the record decided');
need(sha(file(REC.rules.path)) === REC.rules.sha256, 'the rules are not the ones the record names');
need(sha(file(REC.deciders.one.path)) === REC.deciders.one.sha256, 'decide.js is not the decider the record was made with: node tools/record-physics-key.js');
need(sha(file(REC.deciders.two.path)) === REC.deciders.two.sha256, 'decide2.py is not the decider the record was made with');
need(sha(file(REC.planted.path)) === REC.planted.sha256, 'the planted files are not the ones the record names');
need(REC.deciders.agree === true, 'the record does not say the two deciders agree');
need(REC.planted.files.every((p) => p.asExpected === true), 'a planted file was not decided as planted');

/* the second engine's record, held to the same files: one set of rules, the same two deciders, the same planted files */
const RECN = JSON.parse(file('certs/physics-key-newton.json'));
const MANN = JSON.parse(file('corpus/physics-key/newton/runs.json'));
need(sha(file(RECN.manifest.path)) === RECN.manifest.sha256, 'the Newton manifest is not the one the record decided');
need(RECN.rules.sha256 === REC.rules.sha256 && RECN.deciders.one.sha256 === REC.deciders.one.sha256 && RECN.deciders.two.sha256 === REC.deciders.two.sha256
  && RECN.planted.sha256 === REC.planted.sha256, 'the two records were not made with the same rules, deciders and planted files');
need(RECN.deciders.agree === true, 'the Newton record does not say the two deciders agree');
need(RECN.planted.files.every((p) => p.asExpected === true) && RECN.planted.files.length === REC.planted.files.length, 'a planted file was not decided as planted in the Newton record');

const SCENES = ['fall', 'pendulum', 'top'];
const INTEGRATORS = ['euler', 'implicitfast', 'implicit', 'discrete', 'rk4'];
const STEPS = ['0.01', '0.005', '0.002', '0.001'];
const NAME = { euler: 'Euler', implicitfast: 'implicitfast', implicit: 'implicit', discrete: 'discrete', rk4: 'RK4' };
const HEAD_LAW = { fall: 'F-POS', pendulum: 'P-ENERGY', top: 'T-ENERGY' };
const DEFAULT = { scene: 'top', integrator: 'euler', timestep: '0.002' };
const byId = {};
for (const r of REC.runs) byId[r.id] = r;
/* Newton's four configurations (amendment 2, A2.1): each solver at its defaults and with angular_damping = 0 */
const N_CONFIGS = ['semiimplicit', 'semiimplicit-d0', 'featherstone', 'featherstone-d0'];
const N_NAME = { semiimplicit: 'SolverSemiImplicit, defaults', 'semiimplicit-d0': 'SolverSemiImplicit, damping off', featherstone: 'SolverFeatherstone, defaults', 'featherstone-d0': 'SolverFeatherstone, damping off' };
const N_OF = { fall: N_CONFIGS, pendulum: ['featherstone', 'featherstone-d0'], top: N_CONFIGS };
for (const r of RECN.runs) { need(byId[r.id] === undefined, 'a run id is used by both engines: ' + r.id); byId[r.id] = r; }
const run = (s, i, h) => byId[s + '-' + i + '-h' + h] || die('no recorded run ' + s + ' ' + i + ' ' + h);
need(REC.runs.length === SCENES.length * INTEGRATORS.length * STEPS.length && REC.manifest.notRun.length === 0, 'the record does not hold exactly the 60 runs the pages draw');
for (const s of SCENES) for (const i of INTEGRATORS) for (const h of STEPS) {
  const r = run(s, i, h);
  need(r.status === 'ok', r.id + ' is not an ordinary run');
  for (const [name, law] of Object.entries(r.laws)) need(Object.values(law.tolerances).every((t) => t.verdict !== 'REFUSED'), 'the pages say nothing was refused and ' + r.id + ' ' + name + ' was');
}
need(REC.count.REFUSED === 0, 'the record counts a refusal');
need(RECN.runs.length === SCENES.reduce((n, s) => n + N_OF[s].length, 0) * STEPS.length && RECN.manifest.notRun.length === 0, 'the Newton record does not hold exactly the 40 runs the pages draw');
for (const s of SCENES) for (const i of N_OF[s]) for (const h of STEPS) {
  const r = run(s, i, h);
  need(r.status === 'ok', r.id + ' is not an ordinary run');
  for (const [name, law] of Object.entries(r.laws)) need(Object.values(law.tolerances).every((t) => t.verdict !== 'REFUSED'), 'the pages say nothing was refused and ' + r.id + ' ' + name + ' was');
}
need(RECN.count.REFUSED === 0, 'the Newton record counts a refusal');
const sgn = (L) => F.sign(L.last.lo, L.last.hi);

/* ---- the sentences ---- */
const top = (i, h) => run('top', i, h).laws;
/* the documentation states its property for `implicit` and `implicitfast`; `discrete` is decided too */
const DOC_INTEGRATORS = ['implicit', 'implicitfast'];
for (const i of [...DOC_INTEGRATORS, 'discrete']) for (const h of STEPS) {
  need(top(i, h)['T-MONO'].tolerances['0'].verdict === 'CERTIFIED', 'the pages say the energy never rises under ' + i + ' and the record does not (h = ' + h + ')');
  need(top(i, h)['T-MONO'].max.hi === '0', 'the pages say the largest rise under ' + i + ' is zero');
  need(sgn(top(i, h)['T-ENERGY']) === -1, 'the pages say ' + i + ' loses energy and the record does not');
}
for (const h of STEPS) {
  need(top('euler', h)['T-MONO'].tolerances['0'].firstStep === 1, 'the pages say the energy rises at the first Euler step and the record does not');
  need(sgn(top('euler', h)['T-ENERGY']) === 1 && top('euler', h)['T-ENERGY'].max.step === run('top', 'euler', h).steps, 'the pages say the Euler run ends at its largest gain and the record does not');
  need(run('top', 'discrete', h).sha256 === run('top', 'implicitfast', h).sha256, 'the pages say discrete wrote the bytes of implicitfast on the tumbling body');
  need(run('fall', 'euler', h).sha256 === run('fall', 'implicit', h).sha256 && run('fall', 'euler', h).sha256 === run('fall', 'implicitfast', h).sha256 && run('fall', 'euler', h).sha256 === run('fall', 'discrete', h).sha256, 'the pages say four integrators wrote the same bytes for the falling body');
  need(run('fall', 'euler', h).laws['F-VEL'].tolerances['1e-9'].verdict === 'CERTIFIED', 'the pages say the falling speed is right to a billionth of a metre per second');
}
const fallE = run('fall', 'euler', '0.002').laws['F-POS'], fallR = run('fall', 'rk4', '0.002').laws['F-POS'];
need(fallE.tolerances['1e-2'].verdict === 'REFUTED' && fallR.tolerances['1e-12'].verdict === 'CERTIFIED', 'the falling body no longer says what the pages say');
need(run('fall', 'euler', '0.001').laws['F-POS'].tolerances['1e-2'].verdict === 'CERTIFIED', 'the pages say halving the default timestep keeps the fall inside 1 cm');

/* ---- the sentences about the second engine ---- */
const num = (x) => parseFloat(x);
for (const h of STEPS) {
  const d = top('semiimplicit', h), d0 = top('semiimplicit-d0', h), fe = top('featherstone', h);
  need(d['T-MONO'].tolerances['0'].verdict === 'CERTIFIED' && d['T-MONO'].max.hi === '0', 'the pages say the energy never rises under SolverSemiImplicit at its defaults (h = ' + h + ')');
  need(sgn(d['T-ENERGY']) === -1 && d['T-ENERGY'].max.step === run('top', 'semiimplicit', h).steps, 'the pages say that run ends at its largest loss');
  need(num(d['T-ENERGY'].max.lo) > 0.6 && num(d['T-ENERGY'].max.hi) < 0.63, 'the pages say that loss is between 60% and 63% at every timestep (h = ' + h + ')');
  need(d['T-ENERGY'].tolerances['1e-2'].verdict === 'REFUTED' && d['T-ENERGY'].tolerances['1e-2'].firstStep * num(h) <= 0.11 + 1e-9, 'the pages say the loss passes 1% within 0.11 s');
  need(sgn(d0['T-ENERGY']) === 1 && sgn(fe['T-ENERGY']) === 1, 'the pages say both Newton solvers gain energy with the damping off');
  need(num(d0['T-ENERGY'].last.lo) > num(fe['T-ENERGY'].last.hi), 'the pages say SolverSemiImplicit with the damping off gains more than SolverFeatherstone (h = ' + h + ')');
  need(new Set(N_CONFIGS.map((i) => run('fall', i, h).sha256)).size === 1, 'the pages say the four Newton configurations wrote the same bytes for the falling body');
  const fv = run('fall', 'semiimplicit', h).laws['F-VEL'].tolerances;
  need(fv['1e-3'].verdict === 'CERTIFIED' && fv['1e-6'].verdict === 'REFUTED', 'the pages say Newton\u2019s falling speed holds to a millimetre per second and not to a micrometre per second');
  for (const s of SCENES) need(run(s, 'featherstone', h).sha256 === run(s, 'featherstone-d0', h).sha256, 'the pages say SolverFeatherstone wrote the same bytes with and without the damping argument (' + s + ', h = ' + h + ')');
  need(run('top', 'semiimplicit', h).sha256 !== run('top', 'semiimplicit-d0', h).sha256, 'the pages say the damping argument changes what SolverSemiImplicit writes');
}
const fallN = run('fall', 'semiimplicit', '0.002').laws['F-POS'];
need(fallN.tolerances['1e-2'].verdict === 'REFUTED', 'the pages say Newton\u2019s falling body passes 1 cm at the timestep 0.002 s');
const pairsSame = SCENES.length * STEPS.length;               /* (scene, timestep) pairs in which Featherstone's two files are one */

/* integrators that wrote the same bytes at EVERY timestep of a scene share a row */
function rowsOf(s, list) {
  const rows = {};
  for (const i of (list || INTEGRATORS)) { const k = STEPS.map((h) => run(s, i, h).sha256).join(' '); (rows[k] = rows[k] || []).push(i); }
  return Object.values(rows);
}
/* one cell of a table: the largest distance, the end value for the tumbling body, the tightest tolerance held */
function cell(s, i, h) {
  const law = HEAD_LAW[s], kind = F.KIND[law], L = run(s, i, h).laws[law], t = F.tightest(L);
  return { max: F.size(L.max.hi, kind), end: s === 'top' ? F.signed(L.last.lo, L.last.hi, kind) : null, held: t === null ? null : F.TOL[kind][t] };
}

/* every step's decided deviation of one law of one run, rounded once for drawing (decide.js fills it) */
function trace(id, law) {
  const PK = require(path.join(ROOT, 'instruments', 'physicskey', 'decide.js'));
  const mine = MAN.runs.find((r) => r.id === id), e = mine || MANN.runs.find((r) => r.id === id) || die('no run ' + id);
  const bytes = require('zlib').gunzipSync(file('corpus/physics-key/' + (mine ? 'runs/' : 'newton/') + id + '.f64.gz')), t = {};
  need(sha(bytes) === e.sha256, id + ' is not the pinned file');
  PK.decideRun(e, bytes, e.sha256, t);
  return t[law];
}

module.exports = {
  trace,
  ROOT, REC, MAN, F, SCENES, INTEGRATORS, STEPS, NAME, HEAD_LAW, DEFAULT, DOC_INTEGRATORS, run, top, rowsOf, cell, need, die, sha,
  RECN, MANN, N_CONFIGS, N_NAME, N_OF, fallN, pairsSame,
  engine: 'MuJoCo ' + REC.engine.mujoco,
  engineN: 'Newton ' + RECN.engine.newton,
  docRuns: DOC_INTEGRATORS.length * STEPS.length,
  verdicts: REC.count.CERTIFIED + REC.count.REFUTED + REC.count.REFUSED,
  verdictsN: RECN.count.CERTIFIED + RECN.count.REFUTED + RECN.count.REFUSED,
  /* both engines together */
  all: { runs: REC.runs.length + RECN.runs.length, CERTIFIED: REC.count.CERTIFIED + RECN.count.CERTIFIED, REFUTED: REC.count.REFUTED + RECN.count.REFUTED, REFUSED: REC.count.REFUSED + RECN.count.REFUSED,
    files: REC.runs.length + RECN.runs.length + REC.planted.files.length },
  fallE, fallR,
};
