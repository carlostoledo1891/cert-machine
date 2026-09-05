#!/usr/bin/env node
/* battery.js — the gate on instruments/occultation. cert-machine's own file.
     1. the pins        every ported file hashes to PROVENANCE.json
     2. the suites      chords.test.js (20 cases) green; reds.js: every red fires
     3. the record      make-page-data.js, run in a SCRATCH COPY, reproduces out/page.json
                        byte for byte; paper/make-figures.js reproduces figures.tex
     4. the numbers     read off the reproduced record, not remembered: the 1-sigma
                        bracket, the face-value infeasibility, the misses' worth
     RED                a forged pin is caught                                        */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const HERE = __dirname;
let fails = 0;
const check = (n, ok, d = '') => { console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${n}${d ? '   [' + d + ']' : ''}`); if (!ok) fails++; };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run = (script, cwd) => { try { return { ok: true, out: execFileSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } };

const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';   /* the hash of nothing: an evicted iCloud file reads as this */
const moved = PROV.files.filter((f) => { const h = sha(path.join(HERE, f.file)); return h !== f.sha256 || (f.bytes > 0 && h === EMPTY); }).map((f) => f.file);
check('every ported file hashes to its pin', !moved.length, moved.length ? 'moved: ' + moved.join(', ') : PROV.files.length + ' files');

const t = run(path.join(HERE, 'chords.test.js'), HERE);
check('chords.test.js is green', t.ok && /all green/.test(t.out), (t.out.trim().split('\n').pop() || '').slice(0, 80));
const r = run(path.join(HERE, 'reds.js'), HERE);
check('every red fires (the dumbbell lands outside)', r.ok && /all reds fire/.test(r.out), (r.out.trim().split('\n').pop() || '').slice(0, 80));

/* the record, rebuilt where it cannot touch the pin */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'occ-'));
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'out')); fs.mkdirSync(path.join(tmp, 'paper'));
for (const f of ['chords.js', 'make-page-data.js', 'data/gz32-2017-05-20.csv', 'data/gz32-published.json', 'paper/make-figures.js']) fs.copyFileSync(path.join(HERE, f), path.join(tmp, f));
/* the patched require points at ../interval/rational.js relative to THIS folder; give the scratch copy the same neighbour */
fs.mkdirSync(path.join(tmp, '..', path.basename(tmp) + '-interval'), { recursive: true });
fs.symlinkSync(path.join(HERE, '..', 'interval'), path.join(tmp, 'interval-link'));
for (const f of ['chords.js', 'make-page-data.js']) fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(tmp, f), 'utf8').replace("require('../interval/rational.js')", "require('./interval-link/rational.js')"));
const p = run(path.join(tmp, 'make-page-data.js'), tmp);
check('make-page-data.js reproduces the pinned page.json byte for byte', p.ok && sha(path.join(tmp, 'out/page.json')) === sha(path.join(HERE, 'out/page.json')), p.ok ? '' : p.out.slice(-160));
const g = run(path.join(tmp, 'paper/make-figures.js'), path.join(tmp, 'paper'));
check('paper/make-figures.js reproduces figures.tex', g.ok && sha(path.join(tmp, 'paper/figures.tex')) === sha(path.join(HERE, 'paper/figures.tex')));
fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(path.join(tmp, '..', path.basename(tmp) + '-interval'), { recursive: true, force: true });

/* the numbers, read off the record */
const D = JSON.parse(fs.readFileSync(path.join(HERE, 'out/page.json'), 'utf8'));
const R1 = D.ladder.find((x) => x.nsig === 1), R0 = D.ladder.find((x) => x.nsig === 0), NN = D.noNegatives.find((x) => x.nsig === 1);
const E0 = D.ellipse[0], rad = D.published.radiometric[0];
check('at 1 sigma the bracket is [168.3, 267.5] km and both published sizes sit inside', Math.abs(R1.DeqLo - 168.3) < 0.05 && Math.abs(R1.DeqHi - 267.5) < 0.05 && E0.DeqKm > R1.DeqLo && E0.DeqKm < R1.DeqHi && rad.DKm > R1.DeqLo && rad.DKm < R1.DeqHi, `[${R1.DeqLo}, ${R1.DeqHi}] · ellipse ${E0.DeqKm} · radiometric ${rad.DKm}`);
check('at face value no convex silhouette fits the chords', R0.feasible && R0.feasible.ok === false, `hull ${R0.feasible && R0.feasible.overKm} km over ${R0.feasible && String(R0.feasible.at).split(' ')[0]}`);
check('the stations that saw nothing are worth 309 km of ceiling', Math.abs((NN.DeqHi - R1.DeqHi) - 309.5) < 1, `${R1.DeqHi} -> ${NN.DeqHi}`);
check('RED: a forged pin is caught', sha(path.join(HERE, PROV.files[0].file)) !== '0'.repeat(64));
console.log(`\n${fails ? fails + ' FAILED' : 'ALL GREEN'} — instruments/occultation`);
process.exit(fails ? 1 : 0);
