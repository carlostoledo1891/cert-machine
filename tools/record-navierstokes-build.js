#!/usr/bin/env node
/* record-navierstokes-build.js — corpus/navier-stokes/build.json: what happened when
   github.com/openai/NavierStokesAndEuler @ 8937a8f4 was built on THIS machine with the
   pinned toolchain, and what the kernel says the four main theorems depend on.

   Reads the build log written by the operator's background build (BUILD_LOG, default
   ~/Projects/navier-stokes-lean/build2.log), then asks Lean itself — `lake env lean` on a
   scratch file that imports the two solution modules and prints the axioms of the four
   declarations formalization.yaml names. Refuses if the log has no EXIT line, if the
   clone is not at the pinned commit, or if Lean cannot be asked.

   Optional: COMPARATOR_LOG (the output of `lake exe comparator …` run with the pass-through
   landrun stand-in in ~/Projects/navier-stokes-lean/bin) is recorded verbatim when present.

   usage: node tools/record-navierstokes-build.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();
const CLONE = process.env.LEAN_CLONE || path.join(HOME, 'Projects', 'navier-stokes-lean', 'NavierStokesAndEuler');
const LOG = process.env.BUILD_LOG || path.join(HOME, 'Projects', 'navier-stokes-lean', 'build2.log');
const PIN = '8937a8f4cbc7abaab5e9e97d1cc7f5d2319d9538';
const die = (m) => { console.error('BUILD RECORD REFUSED: ' + m); process.exit(1); };
if (!fs.existsSync(LOG)) die('no build log at ' + LOG);
const raw = fs.readFileSync(LOG, 'latin1').replace(/\r/g, '\n');
const exitLine = /^EXIT (\d+)$/m.exec(raw);
if (!exitLine) die('the build has not finished (no EXIT line)');
const head = cp.execSync('git rev-parse HEAD', { cwd: CLONE, encoding: 'utf8' }).trim();
if (head !== PIN) die('clone at ' + head + ', not ' + PIN);
const lines = raw.split('\n');
const built = lines.filter((l) => /Built /.test(l)).length;
const total = (() => { const m = [...raw.matchAll(/\[(\d+)\/(\d+)\]/g)]; return m.length ? Number(m[m.length - 1][2]) : null; })();
const errors = lines.filter((l) => /error:|✖/.test(l) && !/unknown (short|long) option/.test(l));
const dates = lines.filter((l) => /^\w{3} \w{3} +\d+ \d\d:\d\d:\d\d/.test(l));
const real = [...raw.matchAll(/^real\s+(\d+)m([\d.]+)s/gm)].map((m) => Number(m[1]) * 60 + Number(m[2]));
const buildSeconds = real.length ? real[real.length - 1] : null;
const slowest = lines.map((l) => /Built (\S+) \(([\d.]+)(s|m)\)/.exec(l)).filter(Boolean).map((m) => ({ module: m[1], seconds: m[3] === 'm' ? Number(m[2]) * 60 : Number(m[2]) })).sort((a, b) => b.seconds - a.seconds).slice(0, 8);

/* ask the kernel */
const DECLS = ['NavierStokes.Comparator.navier_stokes_breakdown_R3', 'NavierStokes.Comparator.navier_stokes_breakdown_periodic', 'Euler.euler_breakdown_R3', 'Euler.exists_compact_smooth_euler_singularity'];
const scratch = path.join(CLONE, 'AxiomsProbe.lean');
fs.writeFileSync(scratch, 'import NavierStokes.ComparatorSolution\nimport Euler.Solution\n' + DECLS.map((d) => '#print axioms ' + d).join('\n') + '\n');
let axOut = '';
try { axOut = cp.execSync('lake env lean AxiomsProbe.lean', { cwd: CLONE, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 20 * 60 * 1000 }); }
catch (e) { fs.unlinkSync(scratch); die('lake env lean failed: ' + String(e.stdout || '') + String(e.stderr || '')); }
fs.unlinkSync(scratch);
const axioms = {};
for (const m of axOut.matchAll(/'([^']+)' depends on axioms: \[([^\]]*)\]/g)) axioms[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean).sort();
for (const d of DECLS) if (!axioms[d]) die('no axiom line for ' + d + ' in:\n' + axOut);
const STANDARD = ['Classical.choice', 'Quot.sound', 'propext'];
const onlyStandard = DECLS.every((d) => axioms[d].every((a) => STANDARD.includes(a)));

const comparator = process.env.COMPARATOR_LOG && fs.existsSync(process.env.COMPARATOR_LOG)
  ? { ran: true, log: fs.readFileSync(process.env.COMPARATOR_LOG, 'utf8').split('\n').filter(Boolean).slice(-40), note: 'run with a pass-through stand-in for landrun (Landlock is Linux-only): statement equality, the axiom walk and the kernel replays were performed; the sandbox was not' }
  : { ran: false, note: 'not recorded at this build' };

const rec = {
  what: 'The Lean repository openai/NavierStokesAndEuler @ ' + PIN.slice(0, 8) + ' built on this machine with its pinned toolchain, and the axioms the kernel reports for the four main declarations.',
  machine: { model: (() => { try { return cp.execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim(); } catch (e) { return os.platform(); } })(), cpus: os.cpus().length, memoryGB: Math.round(os.totalmem() / 2 ** 30), os: os.platform() + ' ' + os.release(), arch: os.arch() },
  toolchain: /toolchain: (.*)/.exec(raw)?.[1] || null,
  commit: head, started: dates[0] || null, finished: dates[dates.length - 1] || null,
  jobsBuilt: built, jobsTotal: total, buildSeconds, exitCode: Number(exitLine[1]), errors: errors.slice(0, 20), slowest,
  verdict: Number(exitLine[1]) === 0 && errors.length === 0 ? 'PASS' : 'FAIL',
  axioms, onlyStandardAxioms: onlyStandard, standardAxioms: STANDARD,
  comparator,
  recorded: new Date().toISOString(),
};
fs.writeFileSync(path.join(ROOT, 'corpus', 'navier-stokes', 'build.json'), JSON.stringify(rec, null, 2) + '\n');
console.log('build.json: ' + rec.verdict + ', ' + built + '/' + total + ' jobs, ' + (buildSeconds ? Math.round(buildSeconds / 60) + ' min' : '?') + ', axioms standard: ' + onlyStandard + (comparator.ran ? ', comparator recorded' : ''));
