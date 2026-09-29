#!/usr/bin/env node
/* build-report-monthly.js — the monthly ledger: reports/decided-YYYY-MM.html, one page per month from
   September 2026 (positioning decision D6, 2026-09-03; the register of notes/attack-plan-2026-09-29.md A5).

   A DATED DIFF, NEVER TYPED. Every row comes from certs/claims-ledger.json, the register, which derives each
   row from the record that decided it and dates it by the first commit whose record held it (recordedOn). A
   month's page is the rows recorded in that month; a month still running says "as of" the day it was built.
   The build refuses a row without a date, a kind outside the closed vocabulary, or a count that does not add up.

   usage: node tools/build-report-monthly.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));

const die = (m) => { console.error('MONTHLY LEDGER REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), 'utf8'));
const FIRST = '2026-09';                                   /* D6: the first instance is September 2026 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (m) => MONTHS[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4);
const tagOf = (v) => v === 'CERTIFIED' ? 'held' : (v === 'REFUTED' || v === 'REPAIRED' ? 'cert' : (v === 'NEEDS DATA' || v === 'QUEUED' ? 'open' : 'dep'));
for (const r of R.rows) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.recordedOn || '')) die('row ' + r.id + ' has no recordedOn date');
  if (!R.kindsDefined[r.kind]) die('row ' + r.id + ' has a kind outside the closed vocabulary');
}
if (Object.values(R.byMonth).reduce((a, b) => a + b, 0) !== R.count) die('the months do not add up to the rows');
const today = R.meta.date, thisMonth = today.slice(0, 7);
const months = Object.keys(R.byMonth).filter((m) => m >= FIRST).sort();
const count = (list, f) => list.reduce((o, r) => { const k = f(r); o[k] = (o[k] || 0) + 1; return o; }, {});
const words = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => v + ' ' + k.replace(/-/g, ' ')).join(', ');
const out = [];

for (const m of months) {
  const rows = R.rows.filter((r) => r.recordedOn.slice(0, 7) === m).sort((a, b) => a.recordedOn.localeCompare(b.recordedOn) || a.id.localeCompare(b.id));
  const before = R.rows.filter((r) => r.recordedOn.slice(0, 7) < m).length;
  const running = m === thisMonth;
  const decided = rows.filter((r) => r.verdict !== 'QUEUED');
  const byV = count(decided, (r) => r.verdict), defects = decided.filter((r) => r.kind !== 'none'), byK = count(defects, (r) => r.kind);
  const aggregates = decided.filter((r) => r.kinds).length;
  const B = [];
  B.push(C.header({
    eyebrow: 'cert-machine · the monthly ledger',
    title: 'Decided, ' + monthName(m),
    deck: 'Every published claim this machine decided in ' + monthName(m) + ', read from the register: what held, what did '
      + 'not, and what went wrong, in one closed vocabulary. The page is a dated diff of the records — nothing on it is typed.'
  }));
  B.push(C.scope((running ? 'The month is still running: this is ' + monthName(m) + ' as of ' + today + ' (git ' + git + '), and the page is rebuilt with every site build until the month closes. ' : 'The month is closed. ')
    + 'A row belongs to the month in which its deciding record first held it (the first commit, by git\'s pickaxe on the record). '
    + fmt(before) + ' claims were decided before ' + monthName(m) + ' and are on the claims desk, not here.'));
  B.push(C.tldr({
    findingRaw: '<b>' + decided.length + ' published claims decided in ' + monthName(m) + '</b>: ' + words(byV) + '. '
      + (defects.length ? defects.length + ' of them name something that went wrong — ' + words(byK) + '; the other ' + (decided.length - defects.length) + ' hold as printed.' : 'Every one holds as printed.')
      + (aggregates ? ' ' + aggregates + ' row' + (aggregates > 1 ? 's are' : ' is') + ' one audit of many items (a dataset\'s keys, a benchmark\'s counts); the row counts once and names its most frequent defect.' : ''),
    mechanismRaw: 'Each row is derived from the record that decided it; a claim with no record gets no row. CERTIFIED and REFUTED are '
      + 'theorems; PARTIAL, MIXED, REPAIRED and NEEDS DATA are compositions of the three verdicts, named on <a href="/reports/claims.html">the claims desk</a>.',
    checkRaw: C.m('node tools/run-claims-ledger.js && node tools/build-report-monthly.js') + ' — the register is <a href="https://github.com/carlostoledo1891/cert-machine/blob/main/certs/claims-ledger.json">certs/claims-ledger.json</a>.'
  }));
  B.push(C.stats([
    { k: 'decided this month', v: String(decided.length), n: words(byV) + '.' },
    { k: 'held as printed', v: String(decided.length - defects.length), n: 'The row names nothing that went wrong. Most published claims hold, and the ledger says so first.' },
    { k: 'something went wrong', v: String(defects.length), n: defects.length ? words(byK) + '.' : 'Nothing this month.' },
    { k: 'decided before', v: String(before), n: 'Carried on the claims desk; the register holds ' + R.count + ' rows in all.' }
  ]));
  B.push(C.section({
    lab: '§1 · the rows', title: 'What was decided, in the order it was decided', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'recorded' }, { h: 'claim' }, { h: 'claimant' }, { h: 'verdict' }, { h: 'what went wrong' }, { h: 'where' }],
      rows: rows.map((r) => [
        { raw: '<span class="mono">' + C.esc(r.recordedOn).replace(/-/g, '&#8209;') + '</span>' },
        { raw: C.esc(r.claim) },
        { raw: C.esc(r.claimant || '—') },
        { raw: C.tag(r.verdict, tagOf(r.verdict)) },
        { raw: r.kind === 'none' ? C.esc('—') : '<span title="' + C.escAttr(R.kindsDefined[r.kind]) + '">' + C.esc(r.kind.replace(/-/g, ' ')) + '</span>' },
        { raw: '<a href="' + C.escAttr(r.page) + '">the record</a>' }
      ])
    })
  }));
  const kindsUsed = Object.keys(byK);
  B.push(C.section({
    lab: '§2 · the vocabulary', title: 'What went wrong, in words',
    bodyRaw: (kindsUsed.length ? C.plainList(kindsUsed.map((k) => ({ b: k.replace(/-/g, ' ') + ' (' + byK[k] + ').', text: R.kindsDefined[k] + '.' }))) : '')
      + C.pRaw('The vocabulary is closed: ' + Object.keys(R.kindsDefined).length + ' kinds, defined once in tools/run-claims-ledger.js. A defect that fits none of them '
        + 'refuses the register until the vocabulary is decided on, never "other".')
  }));
  B.push(C.section({
    lab: '§3 · not here', title: 'What this page does not count',
    bodyRaw: C.plainList([
      { b: 'Refusals of our own.', text: 'What the instruments would not decide is on the refusals page, by kind and without a total.' },
      { b: 'Model proposals.', text: 'The eval board grades what models propose to it; a proposal is not a published claim.' },
      { b: 'Our own results.', text: 'Records, bounds and censuses this machine produced are not claims someone else published, and are not audited here.' }
    ])
  }));
  const f = 'decided-' + m + '.html';
  const foot = '<p>' + C.esc('Generated by tools/build-report-monthly.js from certs/claims-ledger.json (' + R.meta.date + ', git ' + R.meta.git + ').') + '</p><p>' + C.esc('git ' + git) + '</p>';
  fs.writeFileSync(path.join(ROOT, 'reports', f), TPL.render({
    title: 'Decided, ' + monthName(m) + ' · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
    desc: 'The monthly ledger: every published mathematical claim cert-machine decided in ' + monthName(m) + ' (' + decided.length + '), what held and what went wrong, read from the register — a dated diff of the records, nothing typed.',
    path: '/reports/' + f
  }));
  out.push(f + ' (' + decided.length + ' decided' + (running ? ', as of ' + today : '') + ')');
}
function fmt(x) { return Number(x).toLocaleString('en-US'); }
console.log('monthly ledger: ' + (out.length ? out.join(' · ') : 'no month since ' + FIRST) + ' @ git ' + git);
