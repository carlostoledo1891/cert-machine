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
/* The build ran in two legs on 2026-09-09: build2.log (8 parallel lean processes, ~14 GB resident,
   9 GB of swap, ~1 file per minute) and build3.log (restarted with LEAN_NUM_THREADS=4 after the
   swap thrash; Lake resumed from the artifacts already built). Both legs are read; the exit code
   and the end time come from the last one. */
const LOGS = (process.env.BUILD_LOGS || ['build2.log', 'build3.log'].map((f) => path.join(HOME, 'Projects', 'navier-stokes-lean', f)).join(',')).split(',');
const LOG = LOGS[LOGS.length - 1];
const PIN = '8937a8f4cbc7abaab5e9e97d1cc7f5d2319d9538';
const die = (m) => { console.error('BUILD RECORD REFUSED: ' + m); process.exit(1); };
for (const l of LOGS) if (!fs.existsSync(l)) die('no build log at ' + l);
const raw = LOGS.map((l) => fs.readFileSync(l, 'latin1').replace(/\r/g, '\n')).join('\n');
const lastRaw = fs.readFileSync(LOG, 'latin1').replace(/\r/g, '\n');
const exitLine = /^EXIT (\d+)$/m.exec(lastRaw);
if (!exitLine) die('the build has not finished (no EXIT line in ' + LOG + ')');
const head = cp.execSync('git rev-parse HEAD', { cwd: CLONE, encoding: 'utf8' }).trim();
if (head !== PIN) die('clone at ' + head + ', not ' + PIN);
const lines = raw.split('\n');
const built = lines.filter((l) => /Built /.test(l)).length;
const total = (() => { const m = [...raw.matchAll(/\[(\d+)\/(\d+)\]/g)]; return m.length ? Number(m[m.length - 1][2]) : null; })();
const errors = lines.filter((l) => /error:|✖/.test(l) && !/unknown (short|long) option/.test(l));
const legs = LOGS.map((l) => ({ log: path.basename(l), threads: (/LEAN_NUM_THREADS=(\d+)/.exec(fs.readFileSync(l, 'latin1')) || [])[1] || String(os.cpus().length) + ' (default)', built: fs.readFileSync(l, 'latin1').replace(/\r/g, '\n').split('\n').filter((x) => /Built /.test(x)).length }));
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

/* Comparator: the Lean FRO's judge. It exports the challenge and the solution with lean4export,
   compares every constant reachable from the theorem's type for EXACT equality, walks the axioms,
   and replays the proof through Lean's kernel and (here) nanoda, an independent Rust kernel.
   On macOS its landrun sandbox (Linux Landlock) does not exist, so bin/landrun is a pass-through:
   the comparison, the axiom walk and both kernel replays are performed; the isolation is not. */
const CLOG = process.env.COMPARATOR_LOG || path.join(HOME, 'Projects', 'navier-stokes-lean', 'comparator.log');
const comparator = (() => {
  if (!fs.existsSync(CLOG)) return { ran: false, note: 'not recorded at this build' };
  const t = fs.readFileSync(CLOG, 'utf8');
  const cfgs = [...t.matchAll(/== lake exe comparator (\S+) ==/g)].map((m) => m[1]);
  const exits = [...t.matchAll(/COMPARATOR EXIT (\d+) for (\S+)/g)].map((m) => ({ config: m[2], exit: Number(m[1]) }));
  const okLines = (t.match(/Your solution is okay!/g) || []).length;
  const kernels = [...t.matchAll(/^(?:Running )?(.+?) kernel (accepts|rejects) the solution/gim)].map((m) => m[1].replace(/^Running /, '').trim() + ': ' + m[2]);
  const times = [...t.matchAll(/^real\s+(\d+)m([\d.]+)s/gm)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  return { ran: true, configs: cfgs, exits, solutionsAccepted: okLines, kernels, secondsPerConfig: times,
    landrun: 'pass-through stand-in (bin/landrun): Landlock is Linux-only; statement equality, the axiom walk and both kernel replays were performed, the process isolation was not',
    nanoda: 'ammkrn/nanoda_lib built from source at this build — a kernel written independently of Lean\'s, in Rust',
    lines: t.split('\n').filter((l) => /kernel (accepts|rejects)|Your solution is okay|COMPARATOR EXIT|Exporting|Illegal axiom|do not match|Const not found/.test(l)).slice(-24) };
})();

const rec = {
  what: 'The Lean repository openai/NavierStokesAndEuler @ ' + PIN.slice(0, 8) + ' built on this machine with its pinned toolchain, and the axioms the kernel reports for the four main declarations.',
  machine: { model: (() => { try { return cp.execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim(); } catch (e) { return os.platform(); } })(), cpus: os.cpus().length, memoryGB: Math.round(os.totalmem() / 2 ** 30), os: os.platform() + ' ' + os.release(), arch: os.arch() },
  toolchain: /toolchain: (.*)/.exec(raw)?.[1] || null,
  commit: head, started: dates[0] || null, finished: dates[dates.length - 1] || null,
  jobsBuilt: built, jobsTotal: total, buildSeconds, legs, exitCode: Number(exitLine[1]), errors: errors.slice(0, 20), slowest,
  verdict: Number(exitLine[1]) === 0 && errors.length === 0 ? 'PASS' : 'FAIL',
  axioms, onlyStandardAxioms: onlyStandard, standardAxioms: STANDARD,
  comparator,
  recorded: new Date().toISOString(),
};
fs.writeFileSync(path.join(ROOT, 'corpus', 'navier-stokes', 'build.json'), JSON.stringify(rec, null, 2) + '\n');
console.log('build.json: ' + rec.verdict + ', ' + built + '/' + total + ' jobs, ' + (buildSeconds ? Math.round(buildSeconds / 60) + ' min' : '?') + ', axioms standard: ' + onlyStandard + (comparator.ran ? ', comparator recorded' : ''));
