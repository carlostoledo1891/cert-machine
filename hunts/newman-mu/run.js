/* run.js — the session driver for this hunt. Instance tooling; loaded by no
   engine code. It only sequences runFunnel calls with the budgets program.md
   pre-authorises. Every record it produces is the machine's own.

   Phases:
     node hunts/newman-mu/run.js controls    the start controls alone, nothing written
     node hunts/newman-mu/run.js box8        the declared box, audit 2% (fast, ~45 s)
     node hunts/newman-mu/run.js complete    the declared box, audit 1.0 — certifies
                                             EVERY screen-reject, which is what the
                                             machine requires before an enum run may
                                             carry a completeness certificate instead
                                             of the "best known to this search"
                                             downgrade. Measured price: 23.2 ms per
                                             certification, ~13 minutes for the box. */
'use strict';

const path = require('path');
const F = require('../../machine/funnel/funnel.js');

const DIR = __dirname;

function show(tag, r) {
  if (r.refused) {
    console.log('[' + tag + '] REFUSED: ' + r.refused.reason);
    r.refused.failures.forEach(f => console.log('   ' + f.control + ': ' + f.why));
    process.exitCode = 1; return;
  }
  if (r.aborted) {
    console.log('[' + tag + '] ABORTED: ' + r.aborted.reason + ' — ' + r.aborted.detail);
    process.exitCode = 1; return;
  }
  const s = r.summary;
  console.log('[' + tag + '] generated=' + s.counts.generated
    + ' screenPass=' + s.counts.screenPassed
    + ' HIT/REJ/REF=' + s.counts.certified.HIT + '/' + s.counts.certified.REJECT + '/' + s.counts.certified.REFUSED
    + ' newAdmitted=' + s.admitted
    + ' auditFN=' + s.rejectAudit.falseNegatives + '/' + s.rejectAudit.sampled
    + ' stop="' + s.governor.stopReason + '"');
  for (const c of (s.claims || [])) console.log('   [' + c.shape + '] ' + c.text);

  /* THE TRIPWIRE. A certified min|f| >= 2 carried by at most 18 terms would
     improve a certified record. It is announced loudly and called nothing. */
  const flagged = (s.boardEntries || []).filter(e => e.certificate && e.certificate.tripwire);
  if (flagged.length) {
    console.log('');
    console.log('*** TRIPWIRE: ' + flagged.length + ' certified enclosure(s) with min|f|^2 >= 4 at n <= 18 ***');
    for (const e of flagged) console.log('***   A=' + JSON.stringify(e.certificate.A) + ' modSq=' + JSON.stringify(e.certificate.modSq));
    console.log('*** NOT a result — no literature gate has run. The owner decides everything further. ***');
    console.log('');
  }
}

async function main() {
  const phase = process.argv[2] || 'box8';

  if (phase === 'controls') {
    const t = F.loadTarget(path.join(DIR, 'target.js'));
    const r = F.runStartControls(t);
    console.log('controls ok: ' + r.ok);
    console.log(JSON.stringify(r.report, null, 1));
    if (!r.ok) { r.failures.forEach(f => console.log('FAIL ' + f.control + ': ' + f.why)); process.exitCode = 1; }
    return;
  }

  if (phase === 'box8') {
    show('enum box8 audit-2%', await F.runFunnel(DIR, {
      seed: 'enum-box8-v2', generator: 'enum',
      decades: [2, 3, 4, 5], rejectAuditRate: 0.02,
      wallClockMs: 20 * 60 * 1000, env: {}, quiet: true
    }));
    return;
  }

  if (phase === 'complete') {
    /* audit 1.0: every screen-reject is certified, so the box carries exact
       verdicts end to end and the RECORD can be a completeness claim rather
       than a downgrade. Wall clock 60 min against a measured ~13. */
    show('enum box8 COMPLETE', await F.runFunnel(DIR, {
      seed: 'enum-box8-complete', generator: 'enum',
      decades: [2, 3, 4, 5], rejectAuditRate: 1,
      wallClockMs: 60 * 60 * 1000, env: {}, quiet: true
    }));
    return;
  }

  if (phase === 'frontier') {
    /* The 10 <= n <= 18 front, reachable only through the instance-local
       generator: the shipped engines read minItems as a fixed length and so
       search n = 6 exclusively. Non-enum, so the machine fires its own
       equal-budget enum baseline in the same session with no opt-out — which
       is the comparison that matters, because the shipped baseline cannot
       leave n = 6 and this generator can. That asymmetry is REAL and is the
       point; it is recorded here so the session summary is not misread as a
       like-for-like engine duel. */
    show('terms frontier 3000', await F.runFunnel(DIR, {
      seed: 'terms-frontier-1', generatorPath: path.join(DIR, 'gen-terms.js'),
      decades: [2, 3, 4], maxCandidates: 3000,
      rejectAuditRate: 0.03, wallClockMs: 40 * 60 * 1000,
      env: {}, quiet: true
    }));
    return;
  }

  console.log('usage: node hunts/newman-mu/run.js controls|box8|complete|frontier');
  process.exitCode = 2;
}

main().catch(e => { console.error(e); process.exit(1); });
