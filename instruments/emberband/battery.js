#!/usr/bin/env node
/* instruments/emberband/battery.js — the band audit's own battery.

   Checks walk the shipped record. RED CONTROLS corrupt a COPY of the pinned
   corpus in the exact ways a band theorem fails in practice — a gap in the
   chunk ladder, a gap in the sigma-cell ladder, a margin that goes negative,
   a missing stage, a specimen that falls outside — and the auditor must
   REFUSE every one. A red that does not fire is a battery failure.

   The corpus is never modified: each control builds a temporary tree, points
   the auditor at it with EMBERBAND_DIR, and deletes it in a finally block. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(ROOT, 'corpus', 'emberband');
const AUDIT = path.join(__dirname, 'verify-band.js');

let pass = 0, fail = 0, reds = 0, fired = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('  ok   ' + n + (d ? ' — ' + d : '')); } else { fail++; console.error('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const red = (f, n) => { reds++; if (f) { fired++; pass++; console.log('  RED ok  ' + n); } else { fail++; console.error('  RED DID NOT FIRE  ' + n); } };

/* run the auditor against a mutated copy of the corpus; true == it refused */
function auditRefuses(mutate) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emberband-red-'));
  try {
    for (const f of fs.readdirSync(CORPUS)) fs.copyFileSync(path.join(CORPUS, f), path.join(tmp, f));
    mutate(tmp);
    const r = cp.spawnSync('node', [AUDIT], { cwd: ROOT, env: Object.assign({}, process.env, { EMBERBAND_DIR: tmp }), maxBuffer: 64 * 1024 * 1024 });
    return r.status !== 0;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const rw = (dir, f, fn) => { const p = path.join(dir, f); const j = JSON.parse(fs.readFileSync(p, 'utf8')); fn(j); fs.writeFileSync(p, JSON.stringify(j)); };
const zonesFiles = (dir) => fs.readdirSync(dir).filter((f) => /^zones-/.test(f)).sort();

console.log('ember band — the shipped record');
const REC = path.join(ROOT, 'certs', 'ember-band.json');
if (!fs.existsSync(REC)) { console.error('no certs/ember-band.json — run tools/run-ember-band.js'); process.exit(1); }
const R = JSON.parse(fs.readFileSync(REC, 'utf8'));
const d = R.audited;

ok(d.chunks === 17, 'the record carries all 17 chunks');
ok(d.interval[0] === 0.845 && d.interval[1] === 0.85, 'the certified interval is exactly [0.845, 0.85]');
ok(d.sigmaCells === 738, 'sigma-cell count is 738', '2 chunks at 39 cells + 15 at 44 = 738, matching the resolution note');
ok(d.marginPMin > 0 && d.marginMMin > 0, 'both zone margins are strictly positive band-wide',
  d.marginPMin.toExponential(3) + ' / ' + d.marginMMin.toExponential(3));
ok(d.collarSurvivorsOutsideWindows === 0, 'zero collar survivors outside the corner windows');
ok(d.mu2LowerUniform > d.mu1LowerUniform, 'the uniform spectral gap keeps mu1 simple across the band');
ok(d.tipC_b1_sup < 0, 'tip C keeps b1 strictly negative on every chunk', 'sup b1 = ' + d.tipC_b1_sup);
ok(R.checks.length === 11 && R.checks.every((c) => c.pass), 'all 11 audit checks pass in the record');
/* the fences and the honest scope must survive into the record */
for (const w of ['Judge', 'Burdzy', 'Hatcher', 'de Dios Pont']) ok(R.fences.includes(w), 'fence names ' + w);
ok(/counterexample, never a proven class/.test(R.fences), 'the de Dios Pont result is labelled a counterexample, not a class');
ok(/remains OPEN/.test(R.fences), 'the record states the quadrilateral conjecture itself is still open');
ok(/AUDIT, not re-derivation/.test(R.scope), 'the record states its scope honestly: audit, not re-derivation');

console.log('red controls');
red(auditRefuses((t) => {
  /* delete a middle chunk's zones record -> the chunk ladder must show a GAP */
  const zs = zonesFiles(t); fs.rmSync(path.join(t, zs[Math.floor(zs.length / 2)]));
}), 'X1 a chunk removed from the middle of the ladder opens a GAP and the audit refuses');

red(auditRefuses((t) => {
  /* widen one chunk's lower endpoint so it no longer meets its neighbour */
  const zs = zonesFiles(t); const f = zs[5];
  rw(t, f, (j) => { j.cLo = j.cLo + 1e-5; });
}), 'X2 a chunk endpoint nudged by 1e-5 breaks the tiling and the audit refuses');

red(auditRefuses((t) => {
  /* drop one sigma-cell from the interior of a zones ladder */
  const zs = zonesFiles(t); rw(t, zs[3], (j) => { j.cells.splice(20, 1); });
}), 'X3 a single missing sigma-cell (of 738) is caught as a cell-ladder gap');

red(auditRefuses((t) => {
  /* flip one cell margin negative — the hot spot would not be decided there */
  const zs = zonesFiles(t); rw(t, zs[7], (j) => { j.cells[10].marginP = -1e-9; });
}), 'X4 one margin of -1e-9 in one cell of one chunk is REFUSED');

red(auditRefuses((t) => {
  /* a collar survivor escapes the corner windows */
  const zs = zonesFiles(t); rw(t, zs[2], (j) => { j.cells[5].outsideWindows = 1; });
}), 'X5 a single collar survivor outside the corner windows is REFUSED');

red(auditRefuses((t) => {
  /* remove a whole stage from one chunk */
  const zs = zonesFiles(t); const key = zs[9].replace(/^zones-/, '').replace(/\.json$/, '');
  fs.rmSync(path.join(t, 'defect-' + key + '.json'));
}), 'X6 a chunk missing its defect stage is REFUSED');

red(auditRefuses((t) => {
  /* make tip C's b1 non-negative: the named genericity condition fails */
  const zs = zonesFiles(t); const key = zs[4].replace(/^zones-/, '').replace(/\.json$/, '');
  /* tips[2] IS corner C; flipping any other negative tip (B also is) proves nothing */
  rw(t, 'corner-' + key + '.json', (j) => { j.tips[2].b1 = [0.1, 0.2]; });
}), 'X7 tip C losing its negative b1 on one chunk is REFUSED');

red(auditRefuses((t) => {
  /* shift the whole ladder off the target interval */
  for (const f of zonesFiles(t)) rw(t, f, (j) => { j.cLo += 0.01; j.cHi += 0.01; });
}), 'X8 a ladder that tiles the wrong interval is REFUSED');

console.log(`ember band battery: ${pass} pass, ${fail} fail, ${fired}/${reds} red controls fired`);
process.exit(fail ? 1 : 0);
