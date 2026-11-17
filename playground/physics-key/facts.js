/* facts.js — the ONE reading of certs/physics-key.json for pages. The instrument (playground/physics-key/build.js)
   and the report (tools/build-report-physics-key.js) both state things about the record in words; every such sentence
   is checked here, once, and both builders refuse when the record stops saying it.
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

const SCENES = ['fall', 'pendulum', 'top'];
const INTEGRATORS = ['euler', 'implicitfast', 'implicit', 'discrete', 'rk4'];
const STEPS = ['0.01', '0.005', '0.002', '0.001'];
const NAME = { euler: 'Euler', implicitfast: 'implicitfast', implicit: 'implicit', discrete: 'discrete', rk4: 'RK4' };
const HEAD_LAW = { fall: 'F-POS', pendulum: 'P-ENERGY', top: 'T-ENERGY' };
const DEFAULT = { scene: 'top', integrator: 'euler', timestep: '0.002' };
const byId = {};
for (const r of REC.runs) byId[r.id] = r;
const run = (s, i, h) => byId[s + '-' + i + '-h' + h] || die('no recorded run ' + s + ' ' + i + ' ' + h);
need(REC.runs.length === SCENES.length * INTEGRATORS.length * STEPS.length && REC.manifest.notRun.length === 0, 'the record does not hold exactly the 60 runs the pages draw');
for (const s of SCENES) for (const i of INTEGRATORS) for (const h of STEPS) {
  const r = run(s, i, h);
  need(r.status === 'ok', r.id + ' is not an ordinary run');
  for (const [name, law] of Object.entries(r.laws)) need(Object.values(law.tolerances).every((t) => t.verdict !== 'REFUSED'), 'the pages say nothing was refused and ' + r.id + ' ' + name + ' was');
}
need(REC.count.REFUSED === 0, 'the record counts a refusal');
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

/* integrators that wrote the same bytes at EVERY timestep of a scene share a row */
function rowsOf(s) {
  const rows = {};
  for (const i of INTEGRATORS) { const k = STEPS.map((h) => run(s, i, h).sha256).join(' '); (rows[k] = rows[k] || []).push(i); }
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
  const e = MAN.runs.find((r) => r.id === id) || die('no run ' + id);
  const bytes = require('zlib').gunzipSync(file('corpus/physics-key/runs/' + id + '.f64.gz')), t = {};
  need(sha(bytes) === e.sha256, id + ' is not the pinned file');
  PK.decideRun(e, bytes, e.sha256, t);
  return t[law];
}

module.exports = {
  trace,
  ROOT, REC, MAN, F, SCENES, INTEGRATORS, STEPS, NAME, HEAD_LAW, DEFAULT, DOC_INTEGRATORS, run, top, rowsOf, cell, need, die, sha,
  engine: 'MuJoCo ' + REC.engine.mujoco,
  docRuns: DOC_INTEGRATORS.length * STEPS.length,
  verdicts: REC.count.CERTIFIED + REC.count.REFUTED + REC.count.REFUSED,
  fallE, fallR,
};
