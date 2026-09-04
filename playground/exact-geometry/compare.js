/* compare.js — the model's geometry against the geometry we already knew.
   node experiments/exact-geometry/compare.js  ->  out/compare.json

   The model was asked for thirty separate integers, in calls that never saw one
   another, with no mention of dimension, embeddability or Euclidean anything.
   The question here is whether those integers nevertheless carry a fact about
   the shape they describe — and the fact in question cannot be read off any
   single answer, only off all of them at once. */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./decide.js');

const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'probe.json'), 'utf8'));
const extra = path.join(__dirname, 'out', 'probe-hexchord.json');
const subjects = [...(fs.existsSync(extra) ? JSON.parse(fs.readFileSync(extra, 'utf8')).subjects : []), ...P.subjects];
const seen = new Set(), uniq = subjects.filter(s => !seen.has(s.id) && seen.add(s.id));

const decide = (M, n) => {
  const gate = D.metricGate(M, n);
  if (!gate.ok) return { gate };
  const B = D.gram(M, n);
  return { gate, signature: D.signature(B, n), spectrum: D.spectrumOf(B, n), hyper: D.hyperbolicity(M, n), closure: D.closure(M, n) };
};

const out = { model: P.model, builtAt: new Date().toISOString(), rows: [] };
for (const S of uniq) {
  const n = S.items.length;
  /* symmetrise the two independent answers, exactly: integers, halved and
     rounded, so the decisions downstream stay arithmetic */
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
    i === j ? 0 : Math.round((S.raw[i][j] + S.raw[j][i]) / 2)));
  let amax = 0, asum = 0, k = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.abs(S.raw[i][j] - S.raw[j][i]); amax = Math.max(amax, d); asum += d; k++; }
  const model = decide(M, n), truth = decide(S.truth, n);
  out.rows.push({ id: S.id, items: S.items, n, M, asym: { max: amax, mean: asum / k, pairs: k }, model, truth });

  const f = (x) => x.gate.ok ? `eff ${x.spectrum.effRank}  neg ${(100 * x.spectrum.negMass).toFixed(2)}%  closure ${x.closure.ratio.toFixed(2)}×  δ/diam ${x.hyper.relative.toFixed(3)}` : 'REFUSED';
  console.log(`\n${S.id}`);
  console.log(`  asymmetry   max ${amax}, mean ${(asum / k).toFixed(2)} over ${k} pairs asked twice`);
  console.log(`  model       ${f(model)}`);
  console.log(`  exact       ${f(truth)}`);
}
fs.writeFileSync(path.join(__dirname, 'out', 'compare.json'), JSON.stringify(out));
console.log('\nwritten out/compare.json');
