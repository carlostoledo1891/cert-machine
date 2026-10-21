#!/usr/bin/env node
/* run-selfaudit-concord.js — the self-audit of cert-machine, Phase 4: concordance → certs/selfaudit-concord.json

   WHY. M2 of the pre-registration (notes/selfaudit-preregistration-2026-10-20.md): for every row whose kit entry names a
   second implementation, or whose record was decided by two programs — the same word; the same witness (first violating
   index or pair) where one exists; enclosures that overlap, each printed outward. Counted: rows with two implementations;
   rows where both agree on every field; every disagreement listed one by one. And the hosted profile of M4: the 416 kernel
   challenges of certs/openai-math-kernel.json CARRIED IN as recorded (GitHub's Linux runners, two kernels per run), their
   machine stated, never merged into the laptop table, never re-run.

   HOW. Everything is READ from the records on disk — nothing is re-run (the second implementations' own runs are on
   record: corpus/gnnw/second-run.json, certs/fei-second.json, the BigInt audit per mc100 tensor row, the full pass per mc100
   kissing row, both claimbox checkers per primitive object, the standard-library verifiers' exits on certs/rerun-kit-run.json).
   Each pair is compared field by field: the word (the register's vocabulary; VERIFIED and a clean full pass read as
   CERTIFIED, a violating pass as REFUTED of the kissing claim), the witness or count where one exists, the enclosure where
   one exists (two decimal intervals intersect). A row is CONCORDANT when every compared field agrees.

   GATES. Every input at its Phase 1 pin (the note, the inventory, the register); every record read is pinned by sha256 in
   the output. --check regenerates and compares, writing nothing.

   usage: node tools/run-selfaudit-concord.js            write certs/selfaudit-concord.json
          node tools/run-selfaudit-concord.js --check    regenerate, compare, write nothing (exit 1 on drift)          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = 'certs/selfaudit-concord.json';
const NOTE = 'notes/selfaudit-preregistration-2026-10-20.md';
const INV = 'certs/selfaudit-inventory.json';
const REGISTER = 'certs/claims-ledger.json';
const CHECK = process.argv.includes('--check');
const die = (m) => { console.error('SELF-AUDIT CONCORD REFUSED: ' + m); process.exit(1); };
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- pins ---------------------------------------------------------------------------------------------------------- */
const INVENTORY = J(INV);
if (sha(NOTE) !== INVENTORY.preregistration.sha256) die('the pre-registration is not at its Phase 1 pin');
if (sha(REGISTER) !== INVENTORY.inputs.register.sha256) die('the register is not at its Phase 1 pin');
const R = J(REGISTER);
const rowOf = (id) => { const r = R.rows.find((x) => x.id === id); if (!r) die('no register row ' + id); return r; };
const READ = {};
const read = (rel) => { READ[rel] = sha(rel); return J(rel); };

/* ---- decimal intervals ------------------------------------------------------------------------------------------------ */
const dec = (s) => { const t = String(s).trim(); const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t); if (!m) die('not a decimal: ' + s); const f = m[3] || ''; return [BigInt(m[1] + m[2] + f), 10n ** BigInt(f.length)]; };
const cmp = (a, b) => { const l = a[0] * b[1], r = b[0] * a[1]; return l < r ? -1 : l > r ? 1 : 0; };
const overlap = (A, B) => cmp(dec(A[0]), dec(B[1])) <= 0 && cmp(dec(B[0]), dec(A[1])) <= 0;

/* ---- the pairs ---------------------------------------------------------------------------------------------------------- */
const rows = [];
const pair = (id, implementations, fields, note) => {
  const reg = rowOf(id);
  const disagreements = fields.filter((f) => !f.agree).map((f) => f.field + ': ' + f.values.join(' vs '));
  rows.push({ id, registerVerdict: reg.verdict, implementations, fields, concordant: disagreements.length === 0, disagreements, ...(note ? { note } : {}) });
};
const F = (field, values, agree) => ({ field, values: values.map(String), agree });

/* gnnw: the standard-library verifier against the JavaScript second implementation */
{
  const g = read('certs/gnnw-certificate.json'), s = read('corpus/gnnw/second-run.json');
  const a = g.decided, b = s.result;
  pair('gnnw-gai-3782', ['tools/verify_gnnw_gai.py (Decimal intervals, a written derivative)', 'instruments/gnnw/second.js (bigfloat, monotone endpoint bounds, no written derivative; corpus/gnnw/second-run.json)'],
    [F('word', [a.verdict, b.verdict], a.verdict === b.verdict), F('enclosure of e^{F(1)}', [a.c.join('..'), b.steps[0].c.join('..')], overlap(a.c, b.steps[0].c))],
    'the second implementation re-decided the whole chain; step 1 is G_AI, the register\'s row; the kit timed it at 161 s (certs/rerun-kit-run.json)');
}
/* fei: fei.py against verify_fei.js, both on certs/fei-second.json */
{
  const f = read('certs/fei-second.json'), led = read('certs/fei-ledger.json');
  const py = f.py, js = f.js, row = led.rows[0];
  const agreementOk = Array.isArray(f.agreement) && f.agreement.every((x) => x.ok === true);
  pair('optconst-71', ['instruments/fei/fei.py (Decimal, 60 digits)', 'tools/verify_fei.js (BigInt, 512 bits)'],
    [F('word', [row.verdict, js.verdict], row.verdict === js.verdict), F('ratio enclosure', [py.ratio.join('..'), js.ratio.join('..')], overlap(py.ratio, js.ratio)),
     F('I', [py.I || row.I, js.I], String(py.I || row.I) === String(js.I)), F('the record\'s own agreement checks', [f.agreement.length + ' checks', agreementOk ? 'all ok' : 'NOT all ok'], agreementOk)]);
}
/* the mc100 tensor rows: the exact-double audit against the BigInt audit, both on the row */
for (const rec of ['certs/mc100-alphatensor-q.json', 'certs/mc100-alphatensor-f2.json', 'certs/mc100-alphaevolve-nb-matmul.json']) {
  const m = read(rec);
  for (const r of m.rows) {
    if (r.sameClaimAs) continue;
    const d = r.decision || {};
    const mm = /^(VERIFIED|REFUTED|REFUSED)(?: \(layout (\w+)\))?/.exec(String(d.bigInt || ''));
    const bigWord = mm ? (mm[1] === 'VERIFIED' ? 'CERTIFIED' : mm[1]) : 'not run';
    pair('mc100-' + r.id, ['instruments/strassen/tensor.js audit (exact doubles under the 2^53 bound)', 'instruments/strassen/tensor.js auditBig (BigInt, every equation)'],
      [F('word', [r.verdict, bigWord], r.verdict === bigWord), F('layout', [d.layout, mm ? mm[2] : '?'], !!mm && d.layout === mm[2])]);
  }
}
/* the kissing rows decided twice or more: the ledger's certify, the mc100 full pass, the two claimbox checkers */
{
  const e = read('certs/mc100-einstein-arena.json'), c = read('certs/claimbox-decisions.json');
  const cb = (id) => { const x = c.rows.find((y) => y.id === id); if (!x) die('no claimbox decision ' + id); const fo = x.fromObject.find(Boolean); return { word: fo.word, violations: fo.violations, seconds: x.seconds }; };
  const kissWord = (d) => (d.kissing ? 'CERTIFIED' : 'REFUTED');
  for (const r of e.rows) {
    if (!/kissing/.test(r.id)) continue;
    const d = r.decision;
    const impls = ['instruments/kissing/kissing.js certify', 'tools/run-mc100-einstein.js kissingFull (every pair, the penalty enclosed)'];
    const fields = [F('a kissing configuration', [kissWord(d), d.violations === 0 ? 'CERTIFIED' : 'REFUTED'], (d.kissing === true) === (d.violations === 0))];
    const regId = r.sameClaimAs || ('mc100-' + r.id);
    if (r.id === 'ea-best-kissing-number-d11-605') {
      const p = cb('prim-ea-605-kissing');
      impls.push('instruments/claimbox/check.py (Fractions)', 'instruments/claimbox/check.js (BigInt, no shared code)');
      fields.push(F('violating pairs', [d.violations, p.violations, 'check.js: the battery holds it to check.py'], d.violations === p.violations), F('word (the kissing claim)', [kissWord(d), p.word], kissWord(d) === p.word));
    }
    pair(regId, impls, fields, r.sameClaimAs ? 'the mc100 row names the register row it is the same object as' : 'the register row CERTIFIES the platform\'s score; the kissing claim itself is decided by the two passes beside it');
  }
  const p593 = cb('prim-ae-593-kissing'), kl = read('certs/kissing-ledger.json'), k593 = kl.rows.find((x) => x.id === 'alphaevolve-593');
  pair('kiss-alphaevolve-593', ['instruments/kissing/kissing.js certify (the ledger)', 'instruments/claimbox/check.py (Fractions)', 'instruments/claimbox/check.js (BigInt)'],
    [F('word', [k593.verdict, p593.word], k593.verdict === p593.word), F('violating pairs', [0, p593.violations], p593.violations === 0)]);
}
/* the standard-library verifiers of the kit: exit 0 = every entry of the record re-derived and the red control fired */
{
  const kit = read('corpus/rerun-kit.json'), run = read('certs/rerun-kit-run.json');
  for (const e of kit.entries) {
    if (!e.verifier) continue;
    const r = run.runs.find((x) => x.record === e.record && x.kind === 'verifier');
    const ids = R.rows.filter((x) => x.decidedFrom.split(' ')[0] === e.record).map((x) => x.id);
    for (const id of ids) {
      if (rows.some((x) => x.id === id && x.implementations.some((s) => /verify_|check\./.test(s)))) continue;
      pair(id, ['the record\'s decider (' + (e.rederive || 'the record') + ')', 'the standard-library verifier (' + e.verifier + ')'],
        [F('the verifier re-derives the record (exit)', ['the record', r ? (r.status === 0 ? 'exit 0: every entry verifies, the red control fired' : 'exit ' + r.status) : 'not run'], !!r && r.status === 0)],
        'a word-level concordance: the verifier certifies what the record certifies, read from certs/rerun-kit-run.json (' + (r ? r.seconds + ' s' : '—') + ')');
    }
  }
}

/* ---- the hosted profile, carried in ----------------------------------------------------------------------------------------- */
const K = read('certs/openai-math-kernel.json');
const runs = K.rows.flatMap((r) => r.runs.map((x) => ({ challenge: r.challenge, seconds: x.seconds, cacheSeconds: x.cacheSeconds, maxRssKB: x.maxRssKB, exit: x.exit, kernels: (x.kernels || []).length, word: x.decided && x.decided.word })));
const nums = (xs) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? { n: s.length, min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1] } : null; };
const hosted = {
  record: 'certs/openai-math-kernel.json', machine: 'GitHub-hosted Linux runners (.github/workflows/openai-math-kernel.yml), one job per challenge; the decider ' + String(K.decider).slice(0, 160) + '…',
  challenges: K.rows.length, runs: runs.length, words: K.counts.words, runsWithBothKernels: runs.filter((x) => x.kernels === 2).length,
  seconds: nums(runs.map((x) => x.seconds)), cacheSeconds: nums(runs.map((x) => x.cacheSeconds)), maxRssKB: nums(runs.map((x) => x.maxRssKB)),
  overPortableWall: runs.filter((x) => typeof x.seconds === 'number' && x.seconds > 60).length, overPortableMemory: runs.filter((x) => typeof x.maxRssKB === 'number' && x.maxRssKB * 1024 > 4 * 1024 * 1024 * 1024).length,
  rule: 'carried in as recorded; never merged into the laptop table (the portable and extended profiles of certs/selfaudit-run.json), never re-run; the 18 REFUSED are refusals for resources on the runner, kept'
};

/* ---- output --------------------------------------------------------------------------------------------------------- */
const concordant = rows.filter((r) => r.concordant);
const out = {
  what: 'The self-audit of cert-machine, Phase 4 — concordance (M2 of the pre-registration): every register row whose record was decided by two or more programs, compared field by field — the word, the witness or count where one exists, the enclosure where one exists — read from the records, nothing re-run; and the hosted profile of M4: the 416 kernel challenges carried in as recorded. Written by tools/run-selfaudit-concord.js; --check regenerates and compares.',
  name: 'selfaudit', phase: 4, generated: new Date().toISOString(), git,
  preregistration: { path: NOTE, sha256: sha(NOTE) }, inventory: { path: INV, sha256: sha(INV) }, register: { path: REGISTER, sha256: INVENTORY.inputs.register.sha256 },
  recordsRead: READ,
  counts: { comparisons: rows.length, rowsWithTwoOrMore: new Set(rows.map((r) => r.id)).size, concordant: concordant.length, disagreements: rows.flatMap((r) => r.disagreements.map((d) => r.id + ': ' + d)),
    byImplementationCount: rows.reduce((a, r) => { a[r.implementations.length] = (a[r.implementations.length] || 0) + 1; return a; }, {}),
    fieldLevel: rows.filter((r) => r.fields.some((f) => /enclosure|pairs|layout|^I$/.test(f.field))).length, wordLevelOnly: rows.filter((r) => r.fields.length === 1 && /verifier/.test(r.fields[0].field)).length },
  rows, hosted
};
const STAMPS = new Set(['generated', 'git']);
const strip = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !STAMPS.has(k))));
if (CHECK) {
  if (!fs.existsSync(path.join(ROOT, OUT))) die('no concordance record on disk to check');
  if (strip(J(OUT)) !== strip(out)) die('the concordance record on disk differs from what the records derive now');
  console.log('selfaudit concord holds: ' + out.counts.comparisons + ' comparisons on ' + out.counts.rowsWithTwoOrMore + ' rows, ' + out.counts.concordant + ' concordant, ' + out.counts.disagreements.length + ' disagreements; hosted ' + hosted.challenges + ' challenges carried in');
  process.exit(0);
}
fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(out, null, 1) + '\n');
console.log('written ' + OUT + ': ' + out.counts.comparisons + ' comparisons on ' + out.counts.rowsWithTwoOrMore + ' rows (' + JSON.stringify(out.counts.byImplementationCount) + ' by implementation count), ' + out.counts.concordant + ' concordant, disagreements ' + out.counts.disagreements.length + (out.counts.disagreements.length ? ':\n  ' + out.counts.disagreements.join('\n  ') : '') + '; hosted: ' + hosted.challenges + ' challenges, ' + hosted.runs + ' runs, words ' + JSON.stringify(hosted.words) + ', seconds ' + JSON.stringify(hosted.seconds) + ', RSS KB max ' + hosted.maxRssKB.max);
