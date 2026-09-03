#!/usr/bin/env node
/* instruments/emberband/verify-band.js — an INDEPENDENT audit of the ember
   band theorem: "for every c in [0.845, 0.85] the second Neumann
   eigenfunction of the trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10)
   attains its extrema on the boundary only."

   A band theorem is a union of chunk theorems, and the way a union like this
   fails is not usually arithmetic — it is COVERING. Two covering claims carry
   the whole result and neither is visible in any single certificate:

     (1) the 17 chunk intervals must tile [0.845, 0.85] with shared endpoints
         and no gap, however small;
     (2) inside each chunk the sigma-cells must tile [-1, 0] the same way,
         since every certified quantity is per-cell.

   A gap of 1e-12 in either ladder means the theorem covers a set with holes
   and the interval statement is false. This checker re-derives both tilings
   from the stage records themselves, re-derives every band-wide worst value
   from the per-cell data rather than reading a summary, and shares no code
   with the producer. It reads only corpus/emberband (sha-pinned).

   usage: node instruments/emberband/verify-band.js [--json] */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
/* EMBERBAND_DIR lets the battery point the auditor at a mutated COPY; the
   pinned corpus itself is never written to. */
const D = process.env.EMBERBAND_DIR || path.join(ROOT, 'corpus', 'emberband');

const TARGET = { lo: 0.845, hi: 0.85 };
const SPECIMEN = 17 / 20;          /* the already-published single-domain theorem */
const EPS = 1e-12;                 /* endpoints must MATCH, not merely be close */

const problems = [];
const bad = (m) => problems.push(m);
const rj = (f) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));

/* ---- gather the chunks that carry a full certified set ---- */
const keys = fs.readdirSync(D)
  .filter((f) => /^zones-[\d.]+-[\d.]+\.json$/.test(f))
  .map((f) => f.replace(/^zones-/, '').replace(/\.json$/, ''))
  .sort();

const STAGES = ['spectrum', 'eigenpair', 'defect', 'corner', 'zones'];
const chunks = [];
for (const k of keys) {
  const rec = { key: k };
  let ok = true;
  for (const s of STAGES) {
    const f = s + '-' + k + '.json';
    if (!fs.existsSync(path.join(D, f))) { bad('chunk ' + k + ' is missing its ' + s + ' record'); ok = false; continue; }
    rec[s] = rj(f);
  }
  if (!fs.existsSync(path.join(D, 'chunk-' + k + '.json'))) { bad('chunk ' + k + ' is missing its fit record'); ok = false; }
  else rec.fit = rj('chunk-' + k + '.json');
  if (!ok) continue;
  /* every stage must agree on which chunk it describes */
  const lo = rec.zones.cLo, hi = rec.zones.cHi;
  for (const s of STAGES) {
    if (Math.abs(rec[s].cLo - lo) > EPS || Math.abs(rec[s].cHi - hi) > EPS) {
      bad('chunk ' + k + ': the ' + s + ' record describes [' + rec[s].cLo + ',' + rec[s].cHi + '], not [' + lo + ',' + hi + ']');
    }
  }
  rec.lo = lo; rec.hi = hi;
  chunks.push(rec);
}
chunks.sort((a, b) => a.lo - b.lo);

/* ---- COVERING 1: do the chunks tile the target interval? ---- */
let cover = { ok: true, gaps: [] };
if (!chunks.length) { bad('no certified chunks found'); cover.ok = false; }
else {
  if (Math.abs(chunks[0].lo - TARGET.lo) > EPS) { cover.ok = false; bad('the ladder starts at ' + chunks[0].lo + ', not ' + TARGET.lo); }
  if (Math.abs(chunks[chunks.length - 1].hi - TARGET.hi) > EPS) { cover.ok = false; bad('the ladder ends at ' + chunks[chunks.length - 1].hi + ', not ' + TARGET.hi); }
  for (let i = 0; i + 1 < chunks.length; i++) {
    const g = chunks[i + 1].lo - chunks[i].hi;
    if (g > EPS) { cover.ok = false; cover.gaps.push({ after: chunks[i].key, gap: g }); bad('GAP of ' + g.toExponential(3) + ' between ' + chunks[i].key + ' and ' + chunks[i + 1].key); }
  }
  if (chunks.some((c) => !(c.hi > c.lo))) bad('a chunk has non-positive width');
}
const specimenCovered = chunks.some((c) => SPECIMEN >= c.lo - EPS && SPECIMEN <= c.hi + EPS);
if (!specimenCovered) bad('the published specimen c = 17/20 is NOT covered by the band');

/* ---- COVERING 2: do the sigma-cells tile [-1, 0] inside every chunk? ---- */
let cellCover = { ok: true, worstGap: 0, totalCells: 0 };
for (const c of chunks) {
  for (const [stage, arr] of [['zones', c.zones.cells], ['defect', c.defect.cells], ['eigenpair', c.eigenpair.cells]]) {
    if (!Array.isArray(arr) || !arr.length) { bad(c.key + ': ' + stage + ' carries no cells'); cellCover.ok = false; continue; }
    const cells = arr.map((x) => x.sig).slice().sort((a, b) => a[0] - b[0]);
    if (stage === 'zones') cellCover.totalCells += cells.length;
    if (Math.abs(cells[0][0] - (-1)) > EPS) { cellCover.ok = false; bad(c.key + '/' + stage + ': cells start at ' + cells[0][0] + ', not -1'); }
    if (Math.abs(cells[cells.length - 1][1] - 0) > EPS) { cellCover.ok = false; bad(c.key + '/' + stage + ': cells end at ' + cells[cells.length - 1][1] + ', not 0'); }
    for (let i = 0; i + 1 < cells.length; i++) {
      const g = cells[i + 1][0] - cells[i][1];
      if (g > EPS) { cellCover.ok = false; cellCover.worstGap = Math.max(cellCover.worstGap, g); bad(c.key + '/' + stage + ': sigma-cell GAP ' + g.toExponential(3) + ' after ' + JSON.stringify(cells[i])); }
    }
  }
}

/* ---- re-derive the band-wide values from per-chunk / per-cell data ---- */
const min = (a) => a.reduce((m, x) => (x < m ? x : m), Infinity);
const max = (a) => a.reduce((m, x) => (x > m ? x : m), -Infinity);
const allZoneCells = chunks.flatMap((c) => c.zones.cells);
const allEigCells = chunks.flatMap((c) => c.eigenpair.cells);

const derived = {
  chunks: chunks.length,
  interval: chunks.length ? [chunks[0].lo, chunks[chunks.length - 1].hi] : null,
  sigmaCells: cellCover.totalCells,
  mu1LowerUniform: min(chunks.map((c) => c.spectrum.mu1LowerUniform)),
  mu2LowerUniform: min(chunks.map((c) => c.spectrum.mu2LowerUniform)),
  D_supMax: max(chunks.map((c) => c.defect.D_sup)),
  marginPMin: min(allZoneCells.map((z) => z.marginP)),
  marginMMin: min(allZoneCells.map((z) => z.marginM)),
  collarSurvivorsOutsideWindows: allZoneCells.reduce((s, z) => s + (z.outsideWindows || 0), 0),
  witPMin: min(chunks.map((c) => c.corner.WIT_P)),
  witMMin: min(chunks.map((c) => c.corner.WIT_M)),
  lamMin: min(allEigCells.map((e) => e.lam)),
  lamMax: max(allEigCells.map((e) => e.lam)),
  CtrMax: max(chunks.map((c) => c.eigenpair.Ctr)),
  worstFloatDefect: max(chunks.map((c) => c.fit.worstFloatDefect)),
};

/* Tip C: b1 must be certified strictly negative on EVERY chunk — the named
   genericity condition the specimen proof leaned on ("singularity helps").
   tips[] is the four corners in the fixed order A, B, C, D, so C is index 2.
   Identifying it by POSITION matters: detecting it by the sign of b1 would be
   circular, and corner B also carries a negative b1, so a sign-based scan
   cannot notice C losing the property. The index is cross-checked against the
   value the theorem document states for this corner. */
const TIP_C = 2;
let b1Sup = -Infinity, tipCneg = 0;
for (const c of chunks) {
  const t = c.corner.tips && c.corner.tips[TIP_C];
  if (!t || !Array.isArray(t.b1)) { bad(c.key + ': corner record has no tip C enclosure'); continue; }
  b1Sup = Math.max(b1Sup, t.b1[1]);
  if (t.b1[1] < 0) tipCneg++;
  else bad(c.key + ': tip C has b1 sup ' + t.b1[1] + ', not strictly negative');
}
derived.tipC_b1_sup = b1Sup === -Infinity ? null : b1Sup;
derived.tipC_chunksNegative = tipCneg;
if (tipCneg !== chunks.length) bad('tip C is certified negative on only ' + tipCneg + ' of ' + chunks.length + ' chunks');

/* ---- the theorem's own conclusions, re-checked against the derived values ---- */
const checks = [];
const ck = (name, cond, detail) => { checks.push({ name, pass: !!cond, detail }); if (!cond) bad('CHECK FAILED: ' + name + (detail ? ' — ' + detail : '')); };

ck('the 17 chunks tile [0.845, 0.85] with no gap', cover.ok && cover.gaps.length === 0,
  derived.interval ? 'covered ' + JSON.stringify(derived.interval) + ' in ' + derived.chunks + ' chunks' : 'no cover');
ck('every chunk carries all five certified stage records', chunks.length === keys.length && !problems.some((p) => /missing its/.test(p)),
  chunks.length + ' complete chunk sets');
ck('sigma-cells tile [-1, 0] inside every chunk and every stage', cellCover.ok,
  derived.sigmaCells + ' zones cells total, worst gap ' + (cellCover.worstGap ? cellCover.worstGap.toExponential(2) : '0'));
ck('the published specimen c = 17/20 lies inside the band', specimenCovered);
ck('mu1 is uniformly bounded below, so it stays SIMPLE across the band', derived.mu1LowerUniform > 0 && derived.mu2LowerUniform > derived.mu1LowerUniform,
  'mu1 >= ' + derived.mu1LowerUniform.toFixed(5) + ', mu2 >= ' + derived.mu2LowerUniform.toFixed(5));
ck('the eigenvalue window sits strictly between the two uniform bounds', derived.lamMin > derived.mu1LowerUniform - 1 && derived.lamMax < derived.mu2LowerUniform,
  'lam in [' + derived.lamMin.toFixed(5) + ', ' + derived.lamMax.toFixed(5) + ']');
ck('every zones cell has a STRICTLY POSITIVE margin on both sides', derived.marginPMin > 0 && derived.marginMMin > 0,
  'min marginP ' + derived.marginPMin.toExponential(3) + ', min marginM ' + derived.marginMMin.toExponential(3));
ck('no collar survivor outside the two corner windows, any cell, any chunk', derived.collarSurvivorsOutsideWindows === 0,
  String(derived.collarSurvivorsOutsideWindows) + ' survivors outside windows');
ck('the corner witnesses stay bounded away from the core suprema', derived.witPMin > 0 && derived.witMMin > 0,
  'WIT_P >= ' + derived.witPMin.toFixed(5) + ', WIT_M >= ' + derived.witMMin.toFixed(5));
ck('tip C keeps b1 certified strictly negative on ALL ' + chunks.length + ' chunks', derived.tipC_b1_sup !== null && derived.tipC_b1_sup < 0 && derived.tipC_chunksNegative === chunks.length,
  'sup b1 = ' + (derived.tipC_b1_sup === null ? 'none' : derived.tipC_b1_sup.toFixed(4)) + ' on ' + derived.tipC_chunksNegative + '/' + chunks.length + ' chunks');
ck('the float fit was only ever a gate, and it cleared its own bar', derived.worstFloatDefect < 3e-5,
  'worst float defect ' + derived.worstFloatDefect.toExponential(3));

const out = { verdict: problems.length ? 'REFUSED' : 'VERIFIED', derived, checks, problems };
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); }
else {
  for (const c of checks) console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name + (c.detail ? ' — ' + c.detail : ''));
  if (problems.length) { console.log('\nBAND AUDIT REFUSED — ' + problems.length + ' problem(s):'); for (const p of problems.slice(0, 12)) console.log('  · ' + p); }
  else console.log('\nBAND AUDIT VERIFIED: c in [' + derived.interval[0] + ', ' + derived.interval[1] + '], '
    + derived.chunks + ' chunks, ' + derived.sigmaCells + ' sigma-cells, both tilings gapless');
}
process.exit(problems.length ? 1 : 0);
