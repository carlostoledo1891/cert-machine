#!/usr/bin/env node
/* run-selfaudit-outside.js — the self-audit's outside mutants: sets someone else built to fool a decider here, each run
   through the decider's own path and recorded with what it was aimed at and what the decider said.

   WHY (2026-10-24). The self-audit's mutants (Phase 3) are this repository's own; run-selfaudit-mutations.js generates
   them from its class table and takes nothing from outside. maximusrufus (cert-machine#1) built the first outside set:
   seven boundary mutants of the two EinsteinArena circles-rectangle rows, each the smallest single-value nextafter move
   that breaks exactly one constraint (a pair or the box) under the strict reading, and passes the platform's former 1e-9
   rule. A decider that compares in floating point with a tolerance accepts them; an exact one must not. Pinned as
   received (corpus/selfaudit/outside/maximusrufus-2152f9e2, PINS.json), decided by instruments/easota/decide.js circles()
   — the path tools/run-easota-ledger.js takes — and recorded with the target each was aimed at.

   A mutant PASSES this audit when the decider does not certify it (WITNESSED) and locates the constraint it was aimed at:
   the box alone failing for a box mutant, exactly one overlapping pair and it the targeted one for a pair mutant. The two
   BASE files (the starting points) must be WITNESSED, or the set does not start where it says.

   usage: node tools/run-selfaudit-outside.js            write certs/selfaudit-outside.json
          node tools/run-selfaudit-outside.js --check    recompute and refuse unless identical (the battery)          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments', 'easota', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'easota', 'decide.js'));
const DIR = 'corpus/selfaudit/outside/maximusrufus-2152f9e2';
const OUT = path.join(ROOT, 'certs', 'selfaudit-outside.json');
const die = (m) => { console.error('selfaudit outside REFUSED: ' + m); process.exit(1); };
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

const P = JSON.parse(fs.readFileSync(path.join(ROOT, DIR, 'PINS.json'), 'utf8'));
for (const [f, h] of Object.entries(P.files)) if (sha(DIR + '/' + f) !== h) die(f + ' is not the pinned bytes');
const M = JSON.parse(fs.readFileSync(path.join(ROOT, DIR, 'MANIFEST.json'), 'utf8'));

const decide = (f) => {
  const r = D.circles(JSON.parse(fs.readFileSync(path.join(ROOT, DIR, f), 'utf8')).circles.map((c) => c.map(L.fromJsonNumber)));   /* the decimals as printed, the ledger's reading */
  return { word: r.witnessed ? 'WITNESSED' : (r.repair ? 'REPAIRED' : 'UNWITNESSED'), overlaps: r.overlaps, boxFails: L.Q.sign(r.boxSlack) < 0, worstPair: [r.worstPair.i, r.worstPair.j] };
};

const bases = ['circles__alphaevolve_2025__BASE.json', 'circles__ours_2026__BASE.json'].map((f) => Object.assign({ file: f }, decide(f)));
for (const b of bases) if (b.word !== 'WITNESSED') die(b.file + ' is not a witness: the set does not start where it says');

const rows = M.mutants.map((m) => {
  const file = m.id.replace('/', '__') + '.json';
  const d = decide(file);
  const pm = /^pair(\d+)-(\d+)$/.exec(m.constraint);
  const located = m.constraint === 'box'
    ? d.boxFails && d.overlaps === 0
    : !!pm && !d.boxFails && d.overlaps === 1 && d.worstPair[0] === Number(pm[1]) && d.worstPair[1] === Number(pm[2]);
  return { id: m.id, row: m.row, aimedAt: m.constraint, kind: m.kind, nextafterSteps: m.change.nextafterSteps, platformFormerRule: m['platformVerdict_1e-9_rule_2026-03-26_to_2026-08-24'],
    word: d.word, certified: d.word === 'WITNESSED', located, overlaps: d.overlaps, boxFails: d.boxFails, worstPair: d.worstPair, sha256: m.sha256 };
});
const pass = rows.filter((r) => !r.certified && r.located).length;
const L2 = {
  what: 'The self-audit\'s first outside mutant set: maximusrufus\'s seven boundary mutants of the EinsteinArena circles-rectangle rows, each the smallest nextafter move breaking exactly one constraint under the strict reading, decided by instruments/easota/decide.js circles() (the ledger\'s path). Written by tools/run-selfaudit-outside.js.',
  source: { by: 'maximusrufus (GitHub)', posted: 'https://github.com/carlostoledo1891/cert-machine/issues/1', repository: P.repository, commit: P.commit, dir: DIR },
  decider: 'instruments/easota/decide.js circles(), sha256 ' + sha('instruments/easota/decide.js'),
  bases, rows,
  counts: { mutants: rows.length, certified: rows.filter((r) => r.certified).length, located: rows.filter((r) => r.located).length, passed: pass },
};
if (process.argv.includes('--check')) {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (JSON.stringify(old) !== JSON.stringify(L2)) die('certs/selfaudit-outside.json is not what the pinned mutants and the decider give now');
  console.log('selfaudit outside: ' + rows.length + ' outside mutants, ' + L2.counts.certified + ' certified, ' + L2.counts.located + ' located, both bases witnessed');
  if (L2.counts.certified) process.exit(1);
} else {
  fs.writeFileSync(OUT, JSON.stringify(L2, null, 1) + '\n');
  console.log('certs/selfaudit-outside.json written: ' + pass + ' of ' + rows.length + ' not certified and located');
}
