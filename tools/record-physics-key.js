#!/usr/bin/env node
// The records of the physics answer key: certs/physics-key.json (MuJoCo) and
// certs/physics-key-newton.json (Newton, amendment 2 of the rules).
//
//   node tools/record-physics-key.js           decide everything, write the records
//   node tools/record-physics-key.js --check   decide everything again, compare with the
//                                              records on disk, write nothing
//
// It runs BOTH deciders on the recorded runs of each engine and on the planted files
// (instruments/physicskey/decide.js in this process; decide2.py through python3,
// standard library only), refuses unless they agree field for field, refuses unless
// every planted file gets the answer written beside it, and reads the floating-point
// calibration before any verdict: for MuJoCo (RULES.md section 8) it refuses unless
// every run passed; for Newton (A2.3) a run that fails N1, N2 or N3 keeps its row with
// the failure and without its laws, as the amendment says. It never runs an engine:
// the bytes are pinned in corpus/physics-key.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KEY = path.join(ROOT, 'corpus', 'physics-key');
const { decideManifest } = require(path.join(ROOT, 'instruments', 'physicskey', 'decide-cli.js'));

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = (msg) => { console.error('REFUSED: ' + msg); process.exit(1); };

function sorted(v) {
  if (Array.isArray(v)) return v.map(sorted);
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v).sort()) o[k] = sorted(v[k]); return o; }
  return v;
}
const canon = (v) => JSON.stringify(sorted(v));

// every field on which two outputs differ, as paths
function diff(a, b, at, out) {
  if (out.length > 20) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], at + '/' + k, out);
  } else if (canon(a) !== canon(b)) out.push(at + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
  return out;
}

function decider2(manifest) {
  const tmp = path.join(require('os').tmpdir(), 'physics-key-d2-' + process.pid + '-' + path.basename(path.dirname(manifest)) + '.json');
  execFileSync('python3', [path.join(ROOT, 'instruments', 'physicskey', 'decide2.py'), manifest, '--out', tmp], { stdio: ['ignore', 'inherit', 'inherit'] });
  const v = read(tmp);
  fs.unlinkSync(tmp);
  return v;
}

function both(manifest, label) {
  const t0 = Date.now();
  const d1 = decideManifest(manifest, null);
  const t1 = Date.now();
  const d2 = decider2(manifest);
  const t2 = Date.now();
  const d = diff(d1, d2, '', []);
  if (d.length) fail('the two deciders disagree on the ' + label + ':\n  ' + d.join('\n  '));
  return { decisions: d1, seconds: { decider1: (t1 - t0) / 1000, decider2: (t2 - t1) / 1000 } };
}

// a planted file's `expected` against what was decided
function checkPlanted(entry, r) {
  const e = entry.expected, bad = [];
  if (e.status && r.status !== e.status) bad.push('status ' + r.status + ', expected ' + e.status);
  if (e.nonFiniteStep !== undefined && r.nonFiniteStep !== e.nonFiniteStep) bad.push('nonFiniteStep ' + r.nonFiniteStep);
  if (e.all) {
    for (const law of Object.keys(r.laws)) for (const [t, v] of Object.entries(r.laws[law].tolerances)) {
      if (v.verdict !== e.all) bad.push(law + ' ' + t + ' ' + v.verdict + ', expected ' + e.all);
    }
  }
  for (const law of Object.keys(e)) {
    if (!r.laws[law]) continue;
    for (const [t, want] of Object.entries(e[law])) {
      const got = r.laws[law].tolerances[t];
      const [verdict, step] = Array.isArray(want) ? want : [want, null];
      if (!got || got.verdict !== verdict || got.firstStep !== step) bad.push(law + ' ' + t + ' ' + JSON.stringify(got) + ', expected ' + JSON.stringify(want));
    }
  }
  return bad;
}

// the calibration of RULES.md section 8 (MuJoCo), read before any verdict: every run must pass
function calMujoco(manifest, calibration) {
  const cal = { runs: 0, C0: 0, C1max: 0, C1plantedMin: Infinity, C2max: 0 };
  for (const r of manifest.runs) {
    if (r.notRun !== undefined) continue;
    const c = calibration[r.id];
    if (!c) fail('no calibration for ' + r.id);
    cal.runs++;
    if (c.C0 !== true) fail('C0 fails for ' + r.id + ': the instrumented run wrote different bytes');
    cal.C0++;
    if (!c.finite) continue;
    if (c.C1 !== undefined) {
      if (!(c.C1 <= 1e-9)) fail('C1 fails for ' + r.id + ': ' + c.C1);
      if (!(c.C1planted > 1e-3)) fail('the planted misreading was not caught for ' + r.id);
      cal.C1max = Math.max(cal.C1max, c.C1); cal.C1plantedMin = Math.min(cal.C1plantedMin, c.C1planted);
    }
    if (c.C2 !== undefined) {
      if (!(c.C2 <= 1e-9)) fail('C2 fails for ' + r.id + ': ' + c.C2);
      cal.C2max = Math.max(cal.C2max, c.C2);
    }
  }
  return { cal, notRead: {} };
}

// the calibration of amendment 2 (Newton), A2.3: N0 must hold; a run that fails N1, N2 or N3 is not read
function calNewton(manifest, calibration) {
  const cal = { runs: 0, N0: 0, N1max: 0, N1plantedMin: Infinity, N2max: 0, N2plantedRatioMin: Infinity, N3max: 0 };
  const notRead = {};
  for (const r of manifest.runs) {
    const c = calibration[r.id];
    if (!c) fail('no calibration for ' + r.id);
    cal.runs++;
    if (c.N0 !== true) fail('N0 fails for ' + r.id + ': the same run recorded twice wrote different bytes');
    cal.N0++;
    if (!c.finite) continue;
    const why = [];
    if (c.N1 !== undefined) {
      if (!(c.N1 <= 1e-5)) why.push('N1 ' + c.N1);
      if (!(c.N1plantedBody > 1e-3 && c.N1plantedFirst > 1e-3)) why.push('a planted misreading of the layout was not caught');
      cal.N1max = Math.max(cal.N1max, c.N1); cal.N1plantedMin = Math.min(cal.N1plantedMin, c.N1plantedBody, c.N1plantedFirst);
    }
    if (c.N2 !== undefined) {
      if (!(c.N2 <= 1e-4)) why.push('N2 ' + c.N2);
      cal.N2max = Math.max(cal.N2max, c.N2);
    }
    if (c.N2plantedRatio !== undefined) {
      if (!(c.N2plantedRatio >= 10)) why.push('the undamped replay fits the default file as well as the damped one');
      cal.N2plantedRatioMin = Math.min(cal.N2plantedRatioMin, c.N2plantedRatio);
    }
    if (c.N3z !== undefined) {
      if (!(c.N3z <= 1e-5)) why.push('N3 height ' + c.N3z);
      if (!(c.N3w <= 1e-5)) why.push('N3 rate ' + c.N3w);
      cal.N3max = Math.max(cal.N3max, c.N3z, c.N3w);
    }
    if (why.length) notRead[r.id] = why.join('; ');
  }
  return { cal, notRead };
}

const SETS = {
  mujoco: {
    dir: 'runs', out: 'certs/physics-key.json', name: 'physics-key', calibrate: calMujoco,
    what: 'The physics answer key, v0: conservation laws decided in exact arithmetic on the recorded output of a physics engine',
  },
  newton: {
    dir: 'newton', out: 'certs/physics-key-newton.json', name: 'physics-key-newton', calibrate: calNewton,
    what: 'The physics answer key, second engine (amendment 2 of the rules): the same laws decided in exact arithmetic on the recorded output of Newton',
  },
};

let plantedOnce = null;
function plantedFiles() {
  if (plantedOnce) return plantedOnce;
  const ctlPath = path.join(KEY, 'controls', 'runs.json'), controls = read(ctlPath);
  const planted = both(ctlPath, 'planted files');
  const rows = controls.runs.map((entry) => {
    const bad = checkPlanted(entry, planted.decisions.runs[entry.id]);
    if (bad.length) fail('planted file ' + entry.id + ' was not decided as written:\n  ' + bad.join('\n  '));
    return { id: entry.id, scene: entry.scene, expected: entry.expected, asExpected: true };
  });
  return (plantedOnce = { ctlPath, planted, rows });
}

function build(set) {
  const runsPath = path.join(KEY, set.dir, 'runs.json');
  const manifest = read(runsPath);
  const calibration = read(path.join(KEY, set.dir, 'calibration.json'));
  const env = read(path.join(KEY, set.dir, 'ENV.json'));
  const { cal, notRead } = set.calibrate(manifest, calibration);
  const { ctlPath, planted, rows: plantedRows } = plantedFiles();

  const real = both(runsPath, 'recorded runs (' + set.dir + ')');

  // which integrators wrote the same bytes
  const groups = {};
  for (const r of manifest.runs) {
    if (r.notRun !== undefined) continue;
    const k = r.scene + ' ' + r.timestep;
    (groups[k] = groups[k] || {});
    (groups[k][r.sha256] = groups[k][r.sha256] || []).push(r.integrator);
  }
  const sameBytes = {};
  for (const k of Object.keys(groups)) sameBytes[k] = Object.values(groups[k]).map((g) => g.join(' = '));

  const count = { CERTIFIED: 0, REFUTED: 0, REFUSED: 0 };
  for (const [id, r] of Object.entries(real.decisions.runs)) {
    if (notRead[id]) continue;
    for (const l of Object.values(r.laws)) for (const t of Object.values(l.tolerances)) count[t.verdict]++;
  }
  const runRow = (r) => {
    const row = { id: r.id, scene: r.scene, integrator: r.integrator, timestep: r.timestep, steps: r.steps, sha256: r.sha256 };
    if (notRead[r.id]) return Object.assign(row, { notRead: notRead[r.id] });
    return Object.assign(row, { status: real.decisions.runs[r.id].status, nonFiniteStep: real.decisions.runs[r.id].nonFiniteStep, laws: real.decisions.runs[r.id].laws });
  };

  return {
    record: {
      what: set.what,
      name: set.name,
      rules: { path: 'corpus/physics-key/RULES.md', sha256: sha(path.join(KEY, 'RULES.md')) },
      subject: 'Each verdict is about one pinned file of bytes (one recorded run), never about the engine as such.',
      engine: env,
      manifest: { path: 'corpus/physics-key/' + set.dir + '/runs.json', sha256: sha(runsPath), runs: manifest.runs.length, notRun: manifest.runs.filter((r) => r.notRun !== undefined).map((r) => r.id) },
      calibration: cal,
      planted: { path: 'corpus/physics-key/controls/runs.json', sha256: sha(ctlPath), files: plantedRows },
      deciders: {
        one: { path: 'instruments/physicskey/decide.js', sha256: sha(path.join(ROOT, 'instruments', 'physicskey', 'decide.js')), language: 'JavaScript, BigInt' },
        two: { path: 'instruments/physicskey/decide2.py', sha256: sha(path.join(ROOT, 'instruments', 'physicskey', 'decide2.py')), language: 'Python, fractions' },
        agree: true,
        comparedRuns: Object.keys(real.decisions.runs).length + Object.keys(planted.decisions.runs).length,
      },
      sameBytes,
      count,
      runs: manifest.runs.filter((r) => r.notRun === undefined).map(runRow),
    },
    seconds: { planted: planted.seconds, runs: real.seconds },
  };
}

const check = process.argv.includes('--check');
const only = process.argv.includes('--set') ? process.argv[process.argv.indexOf('--set') + 1] : null;
if (only && !SETS[only]) fail('no such set: ' + only);
for (const key of Object.keys(SETS)) {
  if (only && key !== only) continue;
  const set = SETS[key], OUT = path.join(ROOT, set.out);
  const { record, seconds } = build(set);
  const text = JSON.stringify(sorted(record), null, 1) + '\n';
  if (check) {
    if (!fs.existsSync(OUT)) fail('no record on disk at ' + set.out);
    if (fs.readFileSync(OUT, 'utf8') !== text) fail('the record on disk (' + set.out + ') differs from what the bytes decide now (nothing written)');
    console.log(set.name + ': the record is what the bytes decide; ' + record.deciders.comparedRuns + ' files, two deciders agree; ' +
      record.count.CERTIFIED + ' CERTIFIED, ' + record.count.REFUTED + ' REFUTED, ' + record.count.REFUSED + ' REFUSED');
  } else {
    fs.writeFileSync(OUT, text);
    console.log('wrote ' + set.out + ': ' + JSON.stringify(record.count) + '; seconds ' + JSON.stringify(seconds));
  }
}
