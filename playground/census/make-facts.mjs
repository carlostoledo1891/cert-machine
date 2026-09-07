#!/usr/bin/env node
/* make-facts.mjs — run the census engine on the presets, cross-check it against
   the face-law record, and write out/facts.json + out/card.svg. build.js only reads.
   playground/census/ · cert-machine · 2026-09-07

   REFUSES when the JavaScript engine and the Python record disagree on any k, z
   or shortcut, when Table I turns out to conserve (it does not, and the page
   says so), or when the repaired totals leave the rounding box. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const E = require(path.join(HERE, 'engine.js'));
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'facelaw-theorem.json'), 'utf8'));

/* the paper's network: arXiv:2504.16028 Fig. 1a in Table I edge order, entrances 1 and 9, exits 8 and 10 */
const EDGES = [[1, 2], [2, 3], [9, 3], [2, 4], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6], [3, 7], [4, 7], [5, 7], [6, 7], [7, 8], [7, 10]];
const EXITS = [8, 10], EA = 1, EB = 9;
const TABLE1 = [100, 38, 100, 62, 24, 37, 12, 22, 10, 76, 54, 40, 31, 100, 100];   /* published TOTAL flows, rounded */
const POS = { 1: [0.05, 0.35], 2: [0.22, 0.35], 9: [0.05, 0.78], 3: [0.40, 0.62], 4: [0.40, 0.22], 5: [0.58, 0.55], 6: [0.58, 0.22], 7: [0.76, 0.42], 8: [0.94, 0.28], 10: [0.94, 0.58] };
const Q1 = 100, Q2 = 100;

const die = (m) => { console.error('census/make-facts REFUSES: ' + m); process.exit(1); };
const qs = (q) => E.str(q), qn = (q) => E.toNum(q);

/* ---- the paper's instance ---- */
const face = E.face(EDGES, EXITS, EA, EB);
if (face.k !== REC.originInstance.k) die('k on the paper network is ' + face.k + ', the record says ' + REC.originInstance.k);
if (face.z !== REC.originInstance.z) die('z on the paper network disagrees with the record');
if (face.k !== face.theoremK) die('null space and theorem disagree on the paper network');

const repair = E.repairTotals(EDGES, EXITS, { 1: Q1, 9: Q2 }, TABLE1);
if (!repair) die('the totals could not be repaired');
if (repair.residualBefore.every(r => r === '0')) die('Table I conserves exactly — the page says it does not');
if (E.cmp(repair.maxDev, E.Q(1)) >= 0) die('the repair moved a total by a whole unit or more: outside the rounding box');
const split = E.splitFamily(EDGES, EXITS, EA, EB, repair.T, Q1);
if (!split || !split.feasible) die('no feasible split on the repaired totals: ' + (split && split.why));
if (split.basis.length !== face.k) die('the split family has ' + split.basis.length + ' directions, k is ' + face.k);

/* ---- the cycle family and the failing instances, against the record ---- */
const cyc = (L) => { const c = []; for (let i = 0; i < L; i++) c.push([100 + i, 100 + (i + 1) % L]); return [[1, 100], [2, 100], [1, 3], [2, 3], [3, 4]].concat(c); };
const cycle = [];
for (const row of REC.cycleFamily) {
  const g = E.face(cyc(row.L), [4], 1, 2);
  if (g.k !== row.k || g.shortcut !== row.shortcut || g.z !== row.z) die('cycle family L = ' + row.L + ' disagrees with the record');
  cycle.push({ L: row.L, k: g.k, shortcut: g.shortcut, z: g.z, edges: cyc(row.L), exits: [4], ea: 1, eb: 2 });
}
const failing = [];
for (const inst of REC.failingInstances.origin.slice(0, 3)) {
  const g = E.face(inst.edges, inst.exits, inst.ea, inst.eb);
  if (g.k !== inst.k || g.shortcut !== inst.shortcut || g.z !== inst.z) die('a failing instance disagrees with the record');
  failing.push({ edges: inst.edges, exits: inst.exits, ea: inst.ea, eb: inst.eb, k: g.k, shortcut: g.shortcut, z: g.z, components: g.components });
}

/* ---- facts ---- */
const facts = {
  paper: {
    edges: EDGES, exits: EXITS, ea: EA, eb: EB, table1: TABLE1, pos: POS, q1: Q1, q2: Q2,
    face: { k: face.k, shortcut: face.shortcut, z: face.z, cons: face.cons, shared: face.shared, rank: face.rank,
      basis: face.basis.map(v => v.map(qs)) },
    repair: { T: repair.T.map(qs), Tnum: repair.T.map(qn), correction: repair.correction.map(qs), residualBefore: repair.residualBefore, rows: repair.rows, maxDev: qs(repair.maxDev), maxDevNum: qn(repair.maxDev) },
    split: { base: split.baseFull.map(qs), baseNum: split.baseFull.map(qn), basis: split.basis.map(v => v.map(qs)), shared: split.shared,
      ranges: split.ranges.map(r => ({ lo: qs(r.lo), hi: qs(r.hi), loNum: qn(r.lo), hiNum: qn(r.hi) })), minSlack: qs(split.minSlack), minSlackNum: qn(split.minSlack) }
  },
  cycle, failing,
  census: { origin: REC.originEnsemble, fresh: REC.freshEnsemble, failingTotal: REC.failingInstances.origin.length },
  record: 'certs/facelaw-theorem.json',
  checks: { paperK: true, cycleFamily: cycle.length, failingInstances: failing.length },
  generatedBy: 'node playground/census/make-facts.mjs'
};
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'facts.json'), JSON.stringify(facts, null, 1) + '\n');

/* ---- the card: the paper's network with the two populations' strokes at the base split ---- */
function cardSVG() {
  const W = 400, H = 400, pad = 30;
  const P = (n) => [pad + POS[n][0] * (W - 2 * pad), pad + (1 - POS[n][1]) * (H - 2 * pad)];
  const out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="the fifteen-edge network with two dotted strokes on every edge, one per population">'];
  EDGES.forEach(([u, v], i) => {
    const a = P(u), b = P(v);
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const j1 = split.baseFull[i], j2 = E.sub(repair.T[i], j1);
    const w1 = Math.max(0.6, qn(j1) / 8), w2 = Math.max(0.6, qn(j2) / 8);
    const off = (w1 + w2) / 4 + 1.5;
    out.push('<line x1="' + (a[0] + nx * off) + '" y1="' + (a[1] + ny * off) + '" x2="' + (b[0] + nx * off) + '" y2="' + (b[1] + ny * off) + '" stroke="var(--ink)" stroke-width="' + w1.toFixed(1) + '" stroke-dasharray="1 5" stroke-linecap="round"/>');
    out.push('<line x1="' + (a[0] - nx * off) + '" y1="' + (a[1] - ny * off) + '" x2="' + (b[0] - nx * off) + '" y2="' + (b[1] - ny * off) + '" stroke="var(--ink-2)" stroke-width="' + w2.toFixed(1) + '" stroke-dasharray="1 5" stroke-linecap="round"/>');
  });
  for (const n of Object.keys(POS)) { const p = P(+n); out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>'); }
  out.push('</svg>');
  return out.join('\n');
}
fs.writeFileSync(path.join(HERE, 'out', 'card.svg'), cardSVG());
console.log('census facts: k = ' + face.k + ' (record ' + REC.originInstance.k + '), z = ' + face.z + ', ' + cycle.length + ' cycle rows and ' + failing.length + ' failing instances agree with the record; Table I residuals ' + repair.residualBefore.join(' ') + ', repair ≤ ' + qs(repair.maxDev) + '; split base slack ' + qs(split.minSlack));
