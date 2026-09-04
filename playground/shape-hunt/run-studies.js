#!/usr/bin/env node
/* run-studies.js — the five studies that were proposed and not built.
   node playground/shape-hunt/run-studies.js

   No model calls. Everything is arithmetic on answers already on disk, plus two
   synthetic matrices whose answers are known.

     1  NAME THE ELEMENT       what the recovered symmetry actually is, in words
     2  CAYLEY-MENGER          a certificate of impossibility instead of a score
     3  THE NOISE LADDER       every defect on the page read in percent noise
     4  FULL AUTOMORPHISM      all n! permutations, not the 2n-1 predicted ones
     5  RATIO HUNTING          the numerology control, run so that it fails
*/
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./hunt.js');
const CM = require('./cm.js');
const NAME = require('./naming.js');
const AUT = require('./autos.js');
const LAD = require('./ladder.js');
const RAT = require('./ratios.js');
const { symmetry, configD } = require('./engine.js');
const HERE = __dirname;
const t0 = Date.now();
const S = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'shapes.json'), 'utf8'));
const rows = S.rows;
const say = (s) => process.stdout.write(s + '\n');
let TESTS = 0;

/* ════ 1 · NAME THE ELEMENT ═══════════════════════════════════════════════ */
/* Every dihedral candidate is re-scored and named, not only the winner. Two
   different bars are used and the difference is the point:
     · a SEARCH over 2n-1 candidates is judged against the matched null (best of
       the same number of random permutations), which is what the page does;
     · a PREDICTION — "an ordered list should be reversal-symmetric" — is named
       before looking and is judged against a single random draw, because only
       one permutation was ever tried. Using the search bar on a prediction
       throws away the entire advantage of having predicted. */
say('1 · naming the group elements');
const naming = rows.map((r) => {
  const cands = H.dihedral(r.n).map((c) => {
    const d = H.permDefect(r.D, c.perm);
    TESTS++;
    return { ...NAME.describe(c.kind, c.perm, r.items, r.shape), perm: c.perm, defect: d,
             exact: AUT.exactDefect(r.D, c.perm) ? Number(AUT.exactDefect(r.D, c.perm).n) / Number(AUT.exactDefect(r.D, c.perm).d) : null,
             beatsSingle: d < r.symmetry.nullP05, beatsMatched: d < r.symmetry.nullMatched };
  }).sort((a, b) => a.defect - b.defect);
  const pred = NAME.predictedFor(r.shape);
  let predicted = null;
  if (pred) {
    const perm = NAME.permFor(pred.canon, r.n);
    if (perm) {
      const d = H.permDefect(r.D, perm);
      TESTS++;
      const ex = AUT.exactDefect(r.D, perm);
      predicted = { ...pred, defect: d, exact: ex ? Number(ex.n) / Number(ex.d) : null,
                    nullSingle: r.symmetry.nullP05, beats: d < r.symmetry.nullP05,
                    ratio: r.symmetry.nullP05 / Math.max(d, 1e-9), rank: cands.findIndex((c) => c.canon === pred.canon) + 1 };
    }
  }
  return { set: r.set, model: r.model, shape: r.shape, n: r.n, synthetic: r.synthetic,
           best: cands[0], all: cands.map((c) => ({ canon: c.canon, kind: c.kind, defect: c.defect, beatsSingle: c.beatsSingle, beatsMatched: c.beatsMatched })),
           predicted, nullSingle: r.symmetry.nullP05, nullMatched: r.symmetry.nullMatched };
});
/* how often each named element wins, across sets of different sizes */
const canonCount = {};
for (const r of naming) if (!r.synthetic) canonCount[r.best.canon] = (canonCount[r.best.canon] || 0) + 1;
const agree = {};
for (const r of naming) {
  if (r.synthetic) continue;
  (agree[r.set] = agree[r.set] || { shape: r.shape, canons: [] }).canons.push(r.best.canon);
}
for (const k of Object.keys(agree)) {
  const c = agree[k].canons;
  agree[k].unanimous = c.every((x) => x === c[0]);
  agree[k].distinctLabels = new Set(naming.filter((r) => r.set === k).map((r) => r.best.kind)).size;
}
say(`  ${Object.keys(canonCount).length} distinct elements named · ` +
    Object.entries(canonCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));

/* ════ 2 · CAYLEY-MENGER, AND THE CERTIFICATE ═════════════════════════════ */
say('2 · the exact obstruction');
const cmRows = rows.map((r) => {
  const quads = H.comb(r.n, 4);
  const d = CM.decide(r.D, quads);
  TESTS += quads.length * 2;
  const wit = d.witness ? { ...d.witness, items: d.witness.v.map((x, i) => (x ? { item: r.items[i], w: x } : null)).filter(Boolean) } : null;
  return { set: r.set, model: r.model, shape: r.shape, n: r.n, synthetic: r.synthetic,
           euclidean: d.euclidean, inertia: d.inertia, dim: d.dim, floor: d.floor, gridStep: d.gridStep,
           refuted: d.refuted, witness: wit, quad: { impossible: d.quad.impossible, of: d.quad.of },
           cm: { negative: d.cm.negative, of: d.cm.of, worst: d.cm.worst },
           negtype: { best: d.negtype.best.s, violations: d.negtype.violations, of: d.negtype.of, quads: d.negtype.quads },
           ptolemy: r.ptolemy.violations };
});
const nEuclid = cmRows.filter((r) => !r.synthetic && r.euclidean).length;
const nRef = cmRows.filter((r) => !r.synthetic && r.refuted).length;
const gonCM = cmRows.find((r) => r.set === 'a perfect 12-gon');
say(`  ${nRef} of ${cmRows.filter((r) => !r.synthetic).length} refuted above a PROVED floor · ${nEuclid} exactly Euclidean · ` +
    `the perfect 12-gon: ${gonCM.cm.negative}/${gonCM.cm.of} Cayley-Menger dips from rounding, ${gonCM.quad.impossible} impossible quadruples`);

/* ════ 4 · FULL AUTOMORPHISM SEARCH ══════════════════════════════════════ */
/* run before the ladder because it is the cheap one */
say('4 · every permutation');
const NULLS_FOR = { 7: 4000, 8: 2000, 10: 400 };
const permCache = {};
const autos = [];
for (const r of rows) {
  const nn = r.n;
  if (!NULLS_FOR[nn]) continue;
  if (!permCache[nn]) permCache[nn] = AUT.allPerms(nn);
  const { perms, count } = permCache[nn];
  const diam = Math.max(...r.D.map((x) => Math.max(...x)));
  const res = AUT.searchAll(r.D, perms, count, nn);
  const perm = Array.from(perms.subarray(res.bestAt * nn, res.bestAt * nn + nn));
  TESTS += count;
  const trials = NULLS_FOR[nn];
  const rnd = H.seeded(20260904);
  const nul = [], cfg = [];
  for (let t = 0; t < trials; t++) { nul.push(AUT.searchAll(H.shuffledD(r.D, rnd), perms, count, nn).best / diam); TESTS += count; }
  for (let t = 0; t < trials; t++) {
    const C = configD(nn, rnd);
    cfg.push(AUT.searchAll(C, perms, count, nn).best / Math.max(...C.map((x) => Math.max(...x))));
    TESTS += count;
  }
  nul.sort((a, b) => a - b); cfg.sort((a, b) => a - b);
  const p05 = nul[Math.floor(0.05 * nul.length)];
  const c05 = cfg[Math.floor(0.05 * cfg.length)];
  const defect = res.best / diam;
  /* the permutations that beat the null, and whether they form a group */
  const under = AUT.collectUnder(r.D, perms, count, nn, p05 * diam).map((u) => u.perm);
  const small = under.length <= 300;
  const closed = small ? AUT.isClosed(under.filter((p) => p.some((x, i) => x !== i)), nn) : { closed: null, good: null, total: null };
  const gen = small && under.length ? AUT.generated(under, nn, 50000) : { order: null, capped: true };
  const dih = new Set(H.dihedral(nn).map((c) => c.perm.join(',')));
  const ex = AUT.exactDefect(r.D, perm);
  autos.push({ set: r.set, model: r.model, shape: r.shape, n: nn, synthetic: r.synthetic,
    perms: count, best: { perm, defect, exact: ex ? Number(ex.n) / Number(ex.d) : null,
      dihedral: dih.has(perm.join(',')), ...NAME.describe(dih.has(perm.join(',')) ? (H.dihedral(nn).find((c) => c.perm.join(',') === perm.join(','))).kind : 'not dihedral', perm, r.items, r.shape) },
    dihedralBest: { kind: r.symmetry.best.kind, defect: r.symmetry.best.defect },
    nullP05: p05, nullMedian: nul[Math.floor(0.5 * nul.length)], nullTrials: trials,
    configP05: c05, configMedian: cfg[Math.floor(0.5 * cfg.length)],
    beatsShuffled: defect < p05, beatsConfig: defect < c05,
    beats: defect < p05 && defect < c05,
    ratio: Math.min(p05, c05) / Math.max(defect, 1e-9), ratioShuffled: p05 / Math.max(defect, 1e-9), ratioConfig: c05 / Math.max(defect, 1e-9),
    under: under.length, closed: closed.closed, closedGood: closed.good, closedTotal: closed.total, generated: gen.order, capped: gen.capped });
  process.stdout.write(`\r  ${autos.length} searched · ${r.set} · n=${nn}          `);
}
process.stdout.write('\n');
const autoBeats = autos.filter((a) => !a.synthetic && a.beats).length;
const nonDih = autos.filter((a) => !a.synthetic && a.beats && !a.best.dihedral).length;
say(`  ${autos.length} sets searched exhaustively · ${autoBeats} beat BOTH nulls given the same tries · ` +
    `${autos.filter((a) => !a.synthetic && a.beatsShuffled).length} beat the shuffle alone, ${autos.filter((a) => !a.synthetic && a.beatsConfig).length} the configurations alone · ${nonDih} won by a NON-dihedral permutation`);

/* ════ 5 · RATIO HUNTING ═════════════════════════════════════════════════ */
say('5 · the numerology control');
const ratios = rows.map((r) => {
  const h = RAT.hunt(r.D);
  TESTS += h ? h.count * (RAT.TARGETS.length + h.nullTargets) : 0;
  return { set: r.set, model: r.model, shape: r.shape, synthetic: r.synthetic, ...h };
});
const phiOf = (x) => x.found.find((f) => /golden/.test(f.name));
const phiBest = ratios.filter((r) => r.found).sort((a, b) => phiOf(a).err - phiOf(b).err)[0];
const phiMedPct = (() => { const v = ratios.filter((r) => r.found).map((r) => phiOf(r).percentile).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; })();
say(`  best φ near-miss anywhere: ${phiOf(phiBest).err.toExponential(2)} (${phiBest.set}, ${phiOf(phiBest).num}/${phiOf(phiBest).den}) · median percentile of φ against arbitrary targets: ${(100 * phiMedPct).toFixed(0)}%`);

/* ════ 3 · THE NOISE LADDER ══════════════════════════════════════════════ */
say('3 · the noise ladder (the slow one)');
const LEVELS = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.13, 0.16, 0.20, 0.25, 0.30, 0.36, 0.44];
const TRIALS = 12;
const ladders = {};
for (const nn of [12, 10, 8]) {
  ladders[nn] = LAD.run(nn, LEVELS, TRIALS, 20260904, 'points');
  say(`  points ladder n=${nn}: ` + ['symmetry', 'catalogue', 'ring5', 'concyclic'].map((k) =>
    `${k} breaks at ${(100 * LAD.breakingPoint(ladders[nn].rows, k)).toFixed(0)}%`).join(' · '));
}
const ladderD = LAD.run(12, LEVELS, TRIALS, 20260904, 'distances');
say(`  distance ladder n=12: euclidean breaks at ${(100 * LAD.breakingPoint(ladderD.rows, 'euclidean')).toFixed(0)}%`);
for (const nn of [12, 10, 8]) TESTS += ladders[nn].rows.reduce((a, r) => a + r.tests, 0);
TESTS += ladderD.rows.reduce((a, r) => a + r.tests, 0);
const permTests = autos.reduce((a, r) => a + r.perms * (1 + 2 * r.nullTrials), 0);

/* where every real case sits on its own ladder */
const placements = rows.filter((r) => !r.synthetic && ladders[r.n]).map((r) => {
  const L = ladders[r.n].rows;
  const symR = r.symmetry.nullMatched / Math.max(r.symmetry.best.defect, 1e-9);
  const catR = r.nearest ? r.nearest.nullP05 / Math.max(r.nearest.best.d, 1e-12) : null;
  return { set: r.set, model: r.model, n: r.n, symRatio: symR, symNoise: LAD.noiseFor(L, 'symmetry', symR),
           catRatio: catR, catNoise: catR === null ? null : LAD.noiseFor(L, 'catalogue', catR) };
});

const out = { meta: { date: new Date().toISOString().slice(0, 10), cases: rows.length, tests: TESTS, permTests, shapeTests: TESTS - permTests,
                      seconds: Math.round((Date.now() - t0) / 1000), ladderLevels: LEVELS, ladderTrials: TRIALS, nullsFor: NULLS_FOR },
              naming: { rows: naming, canonCount, agree },
              cm: { rows: cmRows },
              autos: { rows: autos },
              ladder: { points: ladders, distances: ladderD, placements },
              ratios: { rows: ratios, targets: RAT.TARGETS.map((t) => ({ name: t.name, v: t.v, irrational: t.irrational })) } };
fs.writeFileSync(path.join(HERE, 'out', 'studies.json'), JSON.stringify(out) + '\n');
say(`\n${TESTS.toLocaleString('en-US')} further tests · ${out.meta.seconds} s · out/studies.json`);
