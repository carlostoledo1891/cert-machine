#!/usr/bin/env node
/* run-ember-band.js — consolidate the EMBER BAND into certs/ember-band.json.

   The band extends this repository's published single-domain hot-spots theorem
   (reports/ember.html, one trapezoid at c = 17/20) to a POSITIVE-MEASURE
   FAMILY: every c in [0.845, 0.85]. The six-stage certified chain was executed
   on the operator's own bench; what happens here is an INDEPENDENT AUDIT of
   its 85 certified stage records by instruments/emberband/verify-band.js,
   which shares no code with the producer and re-derives both covering ladders
   and every band-wide value from per-cell data.

   Scope stated plainly, because it differs from the erdos1038 port: the chain
   itself is NOT re-executed in this tree (about 10 h; the defect stage alone
   is 25 min per chunk). This record is an audit of certificates, in the genre
   of reports/tensor-rank-bounds.html, not a re-derivation.

   usage: node tools/run-ember-band.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('EMBER BAND REFUSED: ' + m); process.exit(1); };

const r = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'emberband', 'verify-band.js'), '--json'],
  { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
if (r.status !== 0) die('the independent band audit REFUSED:\n' + (String(r.stdout) + String(r.stderr)).slice(-1200));
const audit = JSON.parse(String(r.stdout));
if (audit.verdict !== 'VERIFIED') die('audit verdict is ' + audit.verdict);
const d = audit.derived;
if (d.chunks !== 17) die('expected 17 chunks, the audit found ' + d.chunks);
if (!(d.interval[0] === 0.845 && d.interval[1] === 0.85)) die('the audited interval is not [0.845, 0.85]');

const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'emberband', 'PINS.json'), 'utf8'));
const out = {
  what: 'THE EMBER BAND. For every c in [0.845, 0.85], the trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10) '
    + 'is a convex quadrilateral with no axis of symmetry, outside every class for which the hot spots '
    + 'conjecture was previously proven; its second Neumann eigenvalue is simple and its second Neumann '
    + 'eigenfunction attains its maximum and minimum on the boundary only. To our knowledge this is the first '
    + 'certified hot-spots result for a POSITIVE-MEASURE FAMILY of such domains rather than a single specimen.',
  extends: 'reports/ember.html — the published single-domain theorem at c = 17/20, which the band covers at its '
    + 'right endpoint and which the audit checks for containment.',
  fences: 'Previously proven classes, unchanged: all triangles (Judge–Mondal, Annals 2020 + 2022 erratum), lip '
    + 'domains (Atar–Burdzy), certain non-convex L-tiled polygons (Hatcher arXiv:2405.19508), symmetric '
    + 'quadrangle subcases (Deng–Gui–Jiang–Yang–Yao arXiv:2604.19003). In the other direction the conjecture is '
    + 'FALSE for convex sets in sufficiently high dimension (de Dios Pont, arXiv:2412.06344) — a counterexample, '
    + 'never a proven class. The planar convex quadrilateral conjecture itself remains OPEN; this is a family, '
    + 'not the census.',
  scope: 'AUDIT, not re-derivation. The six-stage chain ran on the operator\'s frontier bench; this record is an '
    + 'independent audit of its 85 certified stage records, sha-pinned in corpus/emberband. The audit shares no '
    + 'code with the producer and re-derives the two covering ladders and every band-wide value from per-cell '
    + 'data. The chain is not re-executed here (~10 h).',
  theCoveringClaims: 'What an interval theorem can silently get wrong is COVERING, not arithmetic. Both ladders '
    + 'are re-derived here and are gapless: the 17 chunks tile [0.845, 0.85] with shared endpoints, and inside '
    + 'every chunk the sigma-cells tile [-1, 0] in each of the zones, defect and eigenpair stages. A gap of 1e-12 '
    + 'in either would make the interval statement false.',
  audited: d,
  checks: audit.checks,
  provenance: { source: pins.source, crossed: pins.crossed, files: Object.keys(pins.files).length,
    ledger: 'corpus/emberband/ledger.jsonl', theoremDoc: 'corpus/emberband/THEOREM-BAND.source.md' },
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
};
fs.writeFileSync(path.join(ROOT, 'certs', 'ember-band.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote certs/ember-band.json — c in [' + d.interval[0] + ', ' + d.interval[1] + '], '
  + d.chunks + ' chunks, ' + d.sigmaCells + ' sigma-cells, ' + audit.checks.length + ' checks all passing');
