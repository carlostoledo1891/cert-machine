#!/usr/bin/env node
// The record of the physics answer key: certs/physics-key.json.
//
//   node tools/record-physics-key.js           decide everything, write the record
//   node tools/record-physics-key.js --check   decide everything again, compare with the
//                                              record on disk, write nothing
//
// It runs BOTH deciders on the 60 recorded runs and on the planted files
// (instruments/physicskey/decide.js in this process; decide2.py through python3,
// standard library only), refuses unless they agree field for field, refuses unless
// every planted file gets the answer written beside it, and refuses unless the
// floating-point calibration of RULES.md section 8 passed on every run. It never runs
// the engine: the bytes are pinned in corpus/physics-key.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KEY = path.join(ROOT, 'corpus', 'physics-key');
const OUT = path.join(ROOT, 'certs', 'physics-key.json');
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

function build() {
  const runsPath = path.join(KEY, 'runs', 'runs.json'), ctlPath = path.join(KEY, 'controls', 'runs.json');
  const manifest = read(runsPath), controls = read(ctlPath);
  const calibration = read(path.join(KEY, 'runs', 'calibration.json'));
  const env = read(path.join(KEY, 'runs', 'ENV.json'));

  // the calibration of RULES.md section 8, read before any verdict
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

  const planted = both(ctlPath, 'planted files');
  const plantedRows = controls.runs.map((entry) => {
    const bad = checkPlanted(entry, planted.decisions.runs[entry.id]);
    if (bad.length) fail('planted file ' + entry.id + ' was not decided as written:\n  ' + bad.join('\n  '));
    return { id: entry.id, scene: entry.scene, expected: entry.expected, asExpected: true };
  });

  const real = both(runsPath, 'recorded runs');

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
  for (const r of Object.values(real.decisions.runs)) for (const l of Object.values(r.laws)) for (const t of Object.values(l.tolerances)) count[t.verdict]++;

  return {
    record: {
      what: 'The physics answer key, v0: conservation laws decided in exact arithmetic on the recorded output of a physics engine',
      name: 'physics-key',
      rules: { path: 'corpus/physics-key/RULES.md', sha256: sha(path.join(KEY, 'RULES.md')) },
      subject: 'Each verdict is about one pinned file of bytes (one recorded run), never about the engine as such.',
      engine: env,
      manifest: { path: 'corpus/physics-key/runs/runs.json', sha256: sha(runsPath), runs: manifest.runs.length, notRun: manifest.runs.filter((r) => r.notRun !== undefined).map((r) => r.id) },
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
      runs: manifest.runs.filter((r) => r.notRun === undefined).map((r) => ({
        id: r.id, scene: r.scene, integrator: r.integrator, timestep: r.timestep, steps: r.steps, sha256: r.sha256,
        status: real.decisions.runs[r.id].status, nonFiniteStep: real.decisions.runs[r.id].nonFiniteStep,
        laws: real.decisions.runs[r.id].laws,
      })),
    },
    seconds: { planted: planted.seconds, runs: real.seconds },
  };
}

const check = process.argv.includes('--check');
const { record, seconds } = build();
const text = JSON.stringify(sorted(record), null, 1) + '\n';
if (check) {
  if (!fs.existsSync(OUT)) fail('no record on disk at certs/physics-key.json');
  if (fs.readFileSync(OUT, 'utf8') !== text) fail('the record on disk differs from what the bytes decide now (nothing written)');
  console.log('physics-key: the record is what the bytes decide; ' + record.deciders.comparedRuns + ' files, two deciders agree; ' +
    record.count.CERTIFIED + ' CERTIFIED, ' + record.count.REFUTED + ' REFUTED, ' + record.count.REFUSED + ' REFUSED');
} else {
  fs.writeFileSync(OUT, text);
  console.log('wrote certs/physics-key.json: ' + JSON.stringify(record.count) + '; seconds ' + JSON.stringify(seconds));
}
