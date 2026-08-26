#!/usr/bin/env node
/* run-mercer-mu5.js — the certified mu(5) <= 1 + pi/m ladder (Mercer §6 at
   general m): run every rung, write certs/mercer-mu5.json.

   m = 5 and m = 6 are CALIBRATIONS (Mercer's Tables 5 and 6-7, plus the
   source lab's m = 6 record); m >= 7 are rungs nobody holds — each one a
   strictly better certified upper bound on mu(5), a lineage that runs
   Campbell-Ferguson-Forcade 1983 (mu(3)) -> Goddard 1992 (mu(4)) ->
   Mercer 2019 (mu(5) <= 1 + pi/6, sketched) -> here.

   usage: node tools/run-mercer-mu5.js [maxM]     (default 16) */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'instruments', 'trigmin', 'mercer6.js'));

const OUT = path.join(ROOT, 'certs', 'mercer-mu5.json');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const maxM = Number(process.argv[2] || 16);

const record = {
  what: 'mu(5) <= 1 + pi/m, certified per rung: component (i) — the reduction of the non-gcd-bounded tuples to a '
    + 'finite list — is CONSUMED from Mercer, INTEGERS 19 (2019) #A4 §6 (his Lemma 6.2; the general-m statement is '
    + 'his p. 16), the way Krawczyk\'s theorem is consumed elsewhere in this lab. Components (ii) the finite search '
    + 'and (iii) the case checks are certified here in exact rational arithmetic. mu is indexed by NUMBER OF TERMS. '
    + 'm = 5, 6 are calibrations against Mercer\'s printed tables (and, at 6, the source lab\'s record); m >= 7 are new.',
  sourcePdf: M.SOURCE_PDF,
  rows: {},
  generatedBy: 'tools/run-mercer-mu5.js @ git ' + git
};

for (let m = 5; m <= maxM; m++) {
  const r = M.runM(m);
  const cal = m === 5
    ? { printed: 'Mercer Table 5 conclusion', matches: JSON.stringify(r.search.rows) === JSON.stringify(M.PRINTED_M5.rows.map(x => x.join(' '))) && JSON.stringify(r.cases.map(c => c.tuple)) === JSON.stringify(M.PRINTED_M5.tuples) }
    : m === 6
      ? {
        printed: 'Mercer Tables 6 and 7',
        matches: r.search.rows.length === M.PRINTED_TABLE6.length
          && M.PRINTED_TABLE6.every(p => r.search.rows.includes(p.join(' ')))
          && r.cases.length === M.PRINTED_TABLE7.length
          && M.PRINTED_TABLE7.every(p => r.cases.some(c => c.tuple.join(',') === p.join(',')))
      }
      : undefined;
  if (cal && !cal.matches) throw new Error('CALIBRATION FAILED at m = ' + m + ' — do not trust either side; investigate');
  if (cal) r.calibration = cal;
  record.rows[m] = r;
  console.log('m=' + m + '  ' + r.verdict + '  bound 1+pi/' + m + ' = ' + r.bar.onePlusFloat.toFixed(9)
    + '  rows ' + r.conservation.rows + '  tuples ' + r.conservation.distinctTuples
    + '  discarded ' + r.conservation.discarded + (cal ? '  CALIBRATION ' + (cal.matches ? 'OK' : 'FAILED') : '')
    + '  ' + (r.elapsedMs / 1000).toFixed(1) + 's');
}

fs.writeFileSync(OUT, JSON.stringify(record, null, 1) + '\n');
console.log('certs/mercer-mu5.json written (m = 5..' + maxM + ')');
