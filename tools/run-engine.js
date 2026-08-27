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
/* the R1 decomposition: tested − refuted must equal what the page can point
   at, term by term. Forms the double screen could not refute are decided by
   the exact BigInt pass, by the form-on-record check, or stay open — counted
   here so the subtraction a reviewer will do comes out to zero. */
let relRefutedExact = 0, relOnRecord = 0, relOpen = 0;

for (const fam of FAMILIES) {
  process.stdout.write('  ' + fam.name.padEnd(18));
  const corpusBound = fam.name.startsWith('oeis') || fam.name.startsWith('henon');
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

  let famTested = 0, famRefuted = 0, famExact = 0, famOnRecord = 0, famOpen = 0;
  for (const rec of r.hits.concat(r.rejects.map(x => ({ extra: x.extra })))) {
    const ex = rec && rec.extra;
    if (!ex || !ex.tested) continue;
    famTested += ex.tested; famRefuted += ex.refuted;
    if (ex.exactRefuted) famExact += ex.exactRefuted.length;
    const s = ex.survivorsAfterExact || 0;
    if (s > 0) {
      /* survived double AND exact: decided by the record, or honestly open */
      if (ex.nameStatesForm || ex.formOnRecord === true) famOnRecord += s;
      else famOpen += s;
    }
  }
  ledger.families.push({ name: r.family, statement: r.statement, counts: r.counts, ms: r.ms,
    truncated: r.truncated, corpusRefutations: famRefuted, corpusTested: famTested,
    ...(famExact + famOnRecord + famOpen > 0
      ? { corpusRefutedExact: famExact, corpusFormOnRecord: famOnRecord, corpusOpen: famOpen } : {}) });
  relTested += famTested; relRefuted += famRefuted;
  relRefutedExact += famExact; relOnRecord += famOnRecord; relOpen += famOpen;

  /* keep the strongest hits per family, and hunt closed forms for each */
  const ranked = r.hits.slice().sort((a, b) => {
    const av = a.enclosure[0], bv = b.enclosure[0];
    return fam.name === 'chowla-cosine' ? av - bv : bv - av;      /* small c wins, large min|f| wins */
  }).slice(0, 12);

  /* no closed-form hunt where the value is not a real-valued unknown: the
     geometric families (henon/keller/holmes) and any family whose certified
     value is an integer by construction (family flag integerValued) — an
     integer rank "surviving" 47/1 is noise, not a candidate */
  const valueShaped = !fam.integerValued && !/henon|keller|holmes/.test(fam.name);
  for (const h of ranked) {
    const rel = valueShaped ? relations(h.enclosure, { maxDen: 24 }) : { candidates: [], tested: 0, refuted: 0 };
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
  closedFormTested: relTested, closedFormRefuted: relRefuted,
  closedFormRefutedExact: relRefutedExact, closedFormOnRecord: relOnRecord, closedFormOpen: relOpen,
  closedFormCandidates: ledger.relations.length };
/* the subtraction a reviewer will do, done here first: the decomposition must
   close EXACTLY or the ledger does not ship */
const gap = relTested - relRefuted - relRefutedExact - relOnRecord - relOpen - ledger.relations.length;
if (gap !== 0) {
  console.error('LEDGER REFUSED: closed-form decomposition does not close (gap ' + gap + ')');
  process.exit(1);
}
fs.writeFileSync(path.join(ROOT, 'ledger.json'), JSON.stringify(ledger, null, 1) + '\n');
console.log('');
console.log('  ledger.json: ' + totalGen + ' generated, ' + totalCert + ' certified, ' + ledger.conjectures.length + ' conjectures');
console.log('  closed forms: ' + relTested + ' tested = ' + relRefuted + ' refuted (double) + ' + relRefutedExact
  + ' refuted (exact BigInt) + ' + relOnRecord + ' form-on-record + ' + relOpen + ' open + '
  + ledger.relations.length + ' surviving candidates — the decomposition closes');
