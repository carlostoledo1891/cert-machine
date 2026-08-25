#!/usr/bin/env node
/* run-engine.js — run every family through the conjecture engine and write the
   ledger the control page reads.  usage: node tools/run-engine.js [limit] */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { run, relations } = require(path.join(ROOT, 'machine/engine.js'));

const LIMIT = Number(process.argv[2] || 300000);
const FAMILIES = fs.readdirSync(path.join(ROOT, 'families'))
  .filter(f => f.endsWith('.js'))
  .map(f => require(path.join(ROOT, 'families', f)));

const ledger = { generatedAt: null, families: [], conjectures: [], relations: [] };
let totalGen = 0, totalCert = 0, relTested = 0, relRefuted = 0;

for (const fam of FAMILIES) {
  process.stdout.write('  ' + fam.name.padEnd(18));
  const corpusBound = fam.name.startsWith('oeis');
  const r = run(fam, corpusBound
    ? { limit: 100000, maxCertify: 100000 }        /* audit the whole corpus, not a sample */
    : { limit: LIMIT, maxCertify: Number(process.env.CERT_CAP || 300) });
  totalGen += r.counts.generated; totalCert += r.counts.certified;
  console.log('generated ' + String(r.counts.generated).padStart(7)
    + '  screened ' + String(r.counts.screened).padStart(6)
    + '  certified ' + String(r.counts.certified).padStart(4)
    + '  HIT ' + String(r.counts.hits).padStart(4)
    + '  ' + (r.ms / 1000).toFixed(1) + ' s'
    + (r.truncated ? '  [certify cap reached]' : ''));

  let famTested = 0, famRefuted = 0;
  for (const rec of r.hits.concat(r.rejects.map(x => ({ extra: x.extra })))) {
    if (rec && rec.extra && rec.extra.tested) { famTested += rec.extra.tested; famRefuted += rec.extra.refuted; }
  }
  ledger.families.push({ name: r.family, statement: r.statement, counts: r.counts, ms: r.ms,
    truncated: r.truncated, corpusRefutations: famRefuted, corpusTested: famTested });
  relTested += famTested; relRefuted += famRefuted;

  /* keep the strongest hits per family, and hunt closed forms for each */
  const ranked = r.hits.slice().sort((a, b) => {
    const av = a.enclosure[0], bv = b.enclosure[0];
    return fam.name === 'chowla-cosine' ? av - bv : bv - av;      /* small c wins, large min|f| wins */
  }).slice(0, 12);

  for (const h of ranked) {
    const rel = relations(h.enclosure, { maxDen: 24 });
    relTested += rel.tested; relRefuted += rel.refuted;
    ledger.conjectures.push({
      family: r.family, key: h.key, text: h.text,
      enclosure: h.enclosure, width: h.enclosure[1] - h.enclosure[0],
      extra: h.extra,
      closedForm: { tested: rel.tested, refuted: rel.refuted, candidates: rel.candidates.length }
    });
    for (const x of rel.candidates) ledger.relations.push({ family: r.family, key: h.key, enclosure: h.enclosure, ...x });
  }
}

ledger.totals = { generated: totalGen, certified: totalCert, conjectures: ledger.conjectures.length,
  closedFormTested: relTested, closedFormRefuted: relRefuted, closedFormCandidates: ledger.relations.length };
fs.writeFileSync(path.join(ROOT, 'ledger.json'), JSON.stringify(ledger, null, 1) + '\n');
console.log('');
console.log('  ledger.json: ' + totalGen + ' generated, ' + totalCert + ' certified, ' + ledger.conjectures.length + ' conjectures');
console.log('  closed forms: ' + relTested + ' relations tested, ' + relRefuted + ' REFUTED exactly by enclosure, '
  + ledger.relations.length + ' surviving candidates');
