#!/usr/bin/env node
/* run.js — produce the record: certs/frontier-measurement.json (the page reads only this).
   usage: node instruments/frontier/run.js            writes
          node instruments/frontier/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const F = require(path.join(__dirname, 'frontier.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'frontier-measurement.json');

const R = F.derive();
if (!F.allOK(R)) { console.error('frontier: a derived statement failed — see battery'); process.exit(1); }
const rec = {
  what: 'the concentration frontier of the congestion-MFG enclosure (reports/mfg-congest.html), MEASURED in the source lab on 2026-07-28 and re-derived on 2026-08-21: where the certifier stops certifying as the potential amplitude A grows, at six viscosities and four truncation orders, and the N-free ceiling behind it',
  statement: 'At N = 14 every σ ladder is monotone (certified up to A⋆, refused beyond, the first refusal always Z1 ≥ 1); A⋆ is bracketed by the last certified and first refused amplitude and bisected to ≤ 0.1 %. A⋆ RISES with N at every σ (' + R.rise.map(r => 'σ = ' + r.sigma + ': +' + r.movePct.toFixed(1) + '% from N = 14 to 40').join('; ') + '), so the fixed-N boundary is a lower bound on the method\'s frontier, not the frontier. The N-free ceiling A_rec(σ), where the one N-independent coefficient of the Z1 tail bound reaches 1, is bit-identical across N at every σ, and A⋆(N)/A_rec rises toward but stays below 1 at every N evaluated. Whether A⋆(N) → A_rec is NOT established; the a-axis is unevaluated; nothing here bounds where solutions exist.',
  verdict: 'VERIFIED',
  pins: R.pins, instance: R.instance, ladders: R.ladders, refine: R.refine, rise: R.rise, ceiling: R.ceiling,
  provenance: { code: 'instruments/frontier/frontier.js', sha256: F.sha256File(path.join(__dirname, 'frontier.js')),
    data: 'corpus/refusal-frontier/ — lifted from sin-mfg research/mfg-congest/docs/refusal-frontier/ (LIFT.json, PROVENANCE.json, make drift); the note REFUSAL_FRONTIER.md travels beside the files',
    kernel: 'sin-mfg research/mfg-congest/kernel/validate-congest.js (sha256 3fb85f00…, printed by every script that produced the data) — NOT re-run here; the one published point is re-run by reports/mfg-congest.html' },
  generatedBy: 'node instruments/frontier/run.js'
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('frontier record: the live re-derivation differs'); process.exit(1); }
  console.log('frontier record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const l of R.ladders) console.log('σ = ' + l.sigma + '  ' + l.pattern + '  A⋆ ∈ [' + l.bisected + ']  first refusal ' + l.firstMode);
  for (const c of R.ceiling) console.log('σ = ' + c.sigma + '  A_rec ∈ [' + c.Arec + ']  ratios ' + c.ratios.map(r => r.ratio.toFixed(4)).join(' → '));
  console.log('wrote ' + path.relative(ROOT, OUT));
}
