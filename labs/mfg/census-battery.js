#!/usr/bin/env node
/* census-battery.js — labs/mfg census: the selftest promoted to a registered
   battery (TERRA-PORT item 5 condition), the N=2 census re-run live, the
   record walk, and red controls that FIRE — including the measured 0.537
   off-center-split lesson as a red, not a memory.                          */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const CE = require(path.join(__dirname, 'census.js'));

let checks = 0, fails = 0;
const ok = (c, m) => { checks++; if (!c) fails++; console.log((c ? '  ok    ' : '  FAIL  ') + m); };
const red = (c, m) => { checks++; if (!c) fails++; console.log((c ? '  RED ok  ' : '  RED FAIL  ') + m); };

/* ---- green: the parity guard runs before anything is claimed ---- */
ok(CE.selftest(true), 'interval mirrors match the float kernel (selftest green)');

/* ---- green: the N=2 census re-proved live at every battery run ---- */
const c2 = CE.census({ N: 2, c: -12, sigma: 0.5, budget: 3e6, quiet: true });
ok(c2.ok && c2.count === 3, 'N=2 census: EXACTLY 3 solutions, re-proved this run');
ok(c2.oneToOne, 'N=2: constant/branch/mirror candidates match solution boxes one-to-one');
ok(c2.splitFrac === 0.537, 'N=2 ran with the off-center split');

/* ---- green: the record walk ---- */
for (const N of [2, 3, 4, 5]) {
  const p = path.join(ROOT, 'certs', `mfg-cap-census-N${N}-c-12.json`);
  ok(fs.existsSync(p), `certs/mfg-cap-census-N${N}-c-12.json exists`);
  if (!fs.existsSync(p)) continue;
  const c = JSON.parse(fs.readFileSync(p, 'utf8'));
  ok(c.verdict === 'VERIFIED' && c.count === 3 && c.oneToOne,
    `N=${N} record: EXACTLY 3, one-to-one matching, VERIFIED`);
  ok(/TRUNCATION on B/.test(c.statement) && /open problem/.test(c.statement),
    `N=${N} record states the honest box-bounded truncation scope`);
}

/* ---- red controls ---- */
// R1: the measured lesson — a MIDPOINT split parks the constant solution
// (a_k = 0 exactly) on child boundaries forever; the census must REFUSE,
// never silently miscount.
const r1 = CE.census({ N: 2, c: -12, sigma: 0.5, budget: 3e6, quiet: true, _splitFrac: 0.5 });
red(!r1.ok && /min width|budget/.test(r1.why || ''),
  `midpoint split refuses instead of miscounting (${r1.why || 'DID NOT REFUSE'})`);

// R2: a starved budget refuses by name
const r2 = CE.census({ N: 2, c: -12, sigma: 0.5, budget: 50, quiet: true });
red(!r2.ok && /budget/.test(r2.why || ''), `starved box budget refuses (${r2.why || 'DID NOT REFUSE'})`);

// R3: a corrupted kernel must turn the selftest red (the parity guard has teeth)
const origResidual = M.residual;
M.residual = (x, P) => { const R = origResidual(x, P); R[1] += 1e-3; return R; };
red(!CE.selftest(true), 'corrupted kernel residual turns the selftest red');
M.residual = origResidual;
ok(CE.selftest(true), 'selftest green again after restoring the kernel (no lasting mutation)');

console.log(`census battery: ${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
