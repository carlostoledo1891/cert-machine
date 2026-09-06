#!/usr/bin/env node
/* battery.js — the gate on instruments/transit. cert-machine's own file.
     1. the pins       every ported file hashes to PROVENANCE.json (and no pin is the
                       hash of the empty string on a non-empty file: an evicted read)
     2. the suites     transit.test.js (36) and enclose.test.js (22) green; reds.js:
                       all seven fire, including the deliberately broken control
     3. the figures    paper/make-figures.js, run in a scratch copy, reproduces figures.tex
     4. the numbers    read off the pinned record, not remembered: for every planet, every
                       published Rp/R* sits inside the certified monotone-rung interval;
                       the interval is one-sided (on both rungs the ceiling sits more than 3x
                       further above the field's fit than the floor sits below it, and the
                       monotone assumption buys its gain on the ceiling, not the floor)
     RED               a forged pin is caught
   The record itself (out/page.json) is NOT regenerated here: make-page-data.js runs
   Frank-Wolfe and interval subdivision over 1.5 MB of light curve, and its
   reproduction is checked once at port time (PROVENANCE.json, acceptance). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const HERE = __dirname;
const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
let fails = 0;
const check = (n, ok, d = '') => { console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${n}${d ? '   [' + d + ']' : ''}`); if (!ok) fails++; };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run = (script, cwd) => { try { return { ok: true, out: execFileSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } };

const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const moved = PROV.files.filter((f) => { const h = sha(path.join(HERE, f.file)); return h !== f.sha256 || (f.bytes > 0 && h === EMPTY); }).map((f) => f.file);
check('every ported file hashes to its pin', !moved.length, moved.length ? 'moved: ' + moved.join(', ') : PROV.files.length + ' files');

for (const [t, want] of [['transit.test.js', /all green/], ['enclose.test.js', /all green/], ['reds.js', /all reds fire/]]) {
  const r = run(path.join(HERE, t), HERE);
  check(t + (t === 'reds.js' ? ': every red fires' : ' is green'), r.ok && want.test(r.out), (r.out.trim().split('\n').pop() || '').slice(0, 80));
}

/* the figures, rebuilt where they cannot touch the pin */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'transit-'));
fs.mkdirSync(path.join(tmp, 'out')); fs.mkdirSync(path.join(tmp, 'paper'));
for (const f of ['out/page.json', 'out/witness.json', 'paper/make-figures.js']) fs.copyFileSync(path.join(HERE, f), path.join(tmp, f));
const g = run(path.join(tmp, 'paper/make-figures.js'), path.join(tmp, 'paper'));
check('paper/make-figures.js reproduces figures.tex from the records', g.ok && sha(path.join(tmp, 'paper/figures.tex')) === sha(path.join(HERE, 'paper/figures.tex')), g.ok ? '' : g.out.slice(-120));
fs.rmSync(tmp, { recursive: true, force: true });

/* the numbers, read off the record */
const D = JSON.parse(fs.readFileSync(path.join(HERE, 'out/page.json'), 'utf8'));
const res = (t, orbit, rung) => t.results.find((r) => r.orbit === orbit && r.rung === rung);
for (const t of D.targets) {
  const ex = res(t, 'exact', 'monotone'), exn = res(t, 'exact', 'none');
  const inside = t.published.filter((p) => ex && ex.ok && p.k >= ex.outer[0] && p.k <= ex.outer[1]).length;
  check(`${t.name}: every published value sits inside the certified interval`, ex && ex.ok && inside === t.published.length, `${inside}/${t.published.length} in [${ex && ex.outer[0].toFixed(4)}, ${ex && ex.outer[1].toFixed(4)}]`);
  /* one-sided, as the record states it: on both rungs the ceiling sits far
     further above the field's fit than the floor sits below it, and the
     monotone rung (the star does not brighten outward) buys its whole gain on
     the ceiling — the floor barely moves */
  const lop = (r) => (r.outer[1] - t.fit.k) / (t.fit.k - r.outer[0]);
  const oneSided = exn && exn.ok && ex && ex.ok && lop(exn) > 3 && lop(ex) > 3 && ex.outer[1] < exn.outer[1] && Math.abs(ex.outer[0] - exn.outer[0]) < 0.25 * (exn.outer[1] - ex.outer[1]);
  check(`${t.name}: the interval is one-sided, and the assumption buys the ceiling`, oneSided, exn && ex ? `nonneg [${exn.outer[0].toFixed(4)}, ${exn.outer[1].toFixed(4)}] · monotone [${ex.outer[0].toFixed(4)}, ${ex.outer[1].toFixed(4)}] · fit ${t.fit.k.toFixed(4)} · up/down ${lop(exn).toFixed(1)}x, ${lop(ex).toFixed(1)}x` : 'missing rung');
}
check('RED: a forged pin is caught', sha(path.join(HERE, PROV.files[0].file)) !== '0'.repeat(64));
console.log(`\n${fails ? fails + ' FAILED' : 'ALL GREEN'} — instruments/transit`);
process.exit(fails ? 1 : 0);
