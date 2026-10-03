#!/usr/bin/env node
/* build-report-rerun.js — the rerun kit: reports/rerun.html and RERUN.md from ONE source.
   tools/ · cert-machine

   WHY. The claims register (certs/claims-ledger.json) is derived from records, and the records are
   re-derivable from this repository — but "re-derivable" was a sentence on a page, not a kit. An
   outside reader of the project (2026-10-02) put it plainly: a verification layer whose own verdicts
   nobody outside has re-run sells an independence it has not earned. The remedy is not more of the
   operator's tests; it is making someone else's rerun a one-line affair and recording it when it
   happens. This page is that kit, and the registry of reruns it reads is the measurement.

   WHAT IS DERIVED. For every record the register's rows are decided from, corpus/rerun-kit.json
   names the command that re-derives it, the standard-library verifier and the second implementation
   where they exist. The rows per record, their verdicts, the defect vocabulary and the schema are read
   from the register; each record's sha256 is computed here; the measured runtimes are read from
   certs/rerun-kit-run.json, which `--run` writes after executing every command and comparing the
   register's rows before and after. Prose never types a count.

   GATES. The register and the manifest must name the same records, both ways. Every path a command
   names must exist. Every row of corpus/external-reruns.json must carry who, date, what, kind (from
   the closed vocabulary below) and where. A run record whose rerun moved a register row refuses.

   usage: node tools/build-report-rerun.js            build the page and RERUN.md
          node tools/build-report-rerun.js --run      execute every command, time it, write the run record, then build
          node tools/build-report-rerun.js --run --only strassen,gnnw   a subset (substring match on the record) */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('RERUN KIT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('missing ' + p); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');
const argv = process.argv.slice(2);
const RUN = argv.includes('--run');
const ONLY = (() => { const i = argv.indexOf('--only'); return i >= 0 ? argv[i + 1].split(',') : null; })();

const GH = 'https://github.com/carlostoledo1891/cert-machine';
const ISSUE = GH + '/issues/new?template=rerun.yml';
const RUN_RECORD = 'certs/rerun-kit-run.json';

/* THE CLOSED VOCABULARY of how a rerun was done. A registry row names one. */
const RERUN_KINDS = {
  'own-code': 'the claim re-derived from the published statement with the reporter\'s own program; none of this repository\'s code ran',
  'detached-verifier': 'one of the standard-library verifiers run on a copy of the record; the sha256 it prints reported',
  'full-rederive': 'the record re-derived with the tool that writes it; the register\'s rows compared'
};

const R = J('certs/claims-ledger.json');
const KIT = J('corpus/rerun-kit.json');
const EXT = J('corpus/external-reruns.json');
const CORPUS = J('corpus/rerun-corpus.json');

/* ---- gates ---------------------------------------------------------------- */
const recOf = (s) => s.split(' ')[0];
const regRecords = [...new Set(R.rows.map((r) => recOf(r.decidedFrom)))].sort();
const kitRecords = KIT.entries.map((e) => e.record).sort();
if (regRecords.join('|') !== kitRecords.join('|'))
  die('the register and the kit name different records —\n  register only: ' + regRecords.filter((x) => !kitRecords.includes(x))
    + '\n  kit only: ' + kitRecords.filter((x) => !regRecords.includes(x)));
if (new Set(kitRecords).size !== kitRecords.length) die('a record appears twice in the kit');
const PATHISH = /(?:^|\s)((?:tools|certs|corpus|instruments|oracle|playground|apps)\/[\w./-]+)/g;
for (const e of KIT.entries) {
  if (!fs.existsSync(path.join(ROOT, e.record))) die('record not on disk: ' + e.record);
  for (const cmd of [e.rederive, e.verifier, e.second]) {
    if (!cmd) continue;
    for (const m of cmd.matchAll(PATHISH)) if (!fs.existsSync(path.join(ROOT, m[1]))) die('command names a missing file: ' + m[1] + ' in "' + cmd + '"');
  }
  if (!e.needs || !e.note) die('kit entry for ' + e.record + ' lacks needs/note');
}
const rowIds = new Set(R.rows.map((r) => r.id));
for (const x of EXT) {
  for (const k of ['who', 'date', 'what', 'kind', 'where']) if (!x[k]) die('external rerun row lacks ' + k + ': ' + JSON.stringify(x));
  if (!RERUN_KINDS[x.kind]) die('external rerun row has a kind outside the vocabulary: ' + x.kind);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date)) die('external rerun date is not ISO: ' + x.date);
  if (x.hash && !/^[0-9a-f]{64}$/.test(x.hash)) die('external rerun hash is not a sha256: ' + x.hash);
  for (const id of x.rows || []) if (!rowIds.has(id)) die('external rerun row names a register id that does not exist: ' + id);
}
/* THE CORPUS for outside reruns: ten register rows, five parties. A row must exist in the register and its party
   in the corpus's own list; a party COUNTS toward the milestone only when a registry row of theirs names one of
   the corpus ids — the milestone is read, never declared. */
if (!CORPUS.rows || !CORPUS.parties) die('corpus/rerun-corpus.json lacks rows or parties');
for (const c of CORPUS.rows) {
  if (!rowIds.has(c.id)) die('the corpus names a register row that does not exist: ' + c.id);
  if (!CORPUS.parties[c.party]) die('the corpus row ' + c.id + ' names an unlisted party: ' + c.party);
  if (!c.why) die('the corpus row ' + c.id + ' has no why');
}
if (new Set(CORPUS.rows.map((c) => c.id)).size !== CORPUS.rows.length) die('a corpus row is listed twice');
const corpusIds = new Set(CORPUS.rows.map((c) => c.id));
const rerunsOf = (id) => EXT.filter((x) => (x.rows || []).includes(id));
const partiesDone = new Set(EXT.filter((x) => (x.rows || []).some((id) => corpusIds.has(id))).map((x) => x.who));

/* ---- the register's rows per record ---------------------------------------- */
const rowsOf = (rec) => R.rows.filter((r) => recOf(r.decidedFrom) === rec);
const verdictSummary = (rows) => {
  const by = {}; for (const r of rows) by[r.verdict] = (by[r.verdict] || 0) + 1;
  return Object.entries(by).map(([k, v]) => v + ' ' + k).join(', ');
};

/* ---- --run: execute, time, compare ------------------------------------------ */
const snapshot = () => Object.fromEntries(R.rows.map((r) => [r.id, [r.verdict, r.scope, r.kind].join(' | ')]));
if (RUN) {
  const before = snapshot();
  const pyv = (() => { try { return cp.execSync('python3 --version').toString().trim(); } catch (e) { return 'python3 absent'; } })();
  const machine = { os: os.type() + ' ' + os.release(), cpu: (os.cpus()[0] || {}).model || 'unknown', node: process.version, python: pyv };
  const runs = [];
  for (const e of KIT.entries) {
    if (ONLY && !ONLY.some((s) => e.record.includes(s))) continue;
    for (const [kind, cmd] of [['rederive', e.rederive], ['verifier', e.verifier], ['second', e.second]]) {
      if (!cmd) continue;
      process.stderr.write('  ' + e.record + ' · ' + kind + ' · ' + cmd + ' … ');
      const t0 = Date.now();
      const r = cp.spawnSync('sh', ['-c', cmd], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
      const seconds = Math.round((Date.now() - t0) / 100) / 10;
      const ok = r.status === 0;
      process.stderr.write((ok ? 'ok' : 'FAILED (' + r.status + ')') + ' ' + seconds + ' s\n');
      if (!ok) process.stderr.write(String(r.stderr).slice(-2000) + '\n');
      runs.push({ record: e.record, kind, command: cmd, seconds, status: r.status, sha256After: fs.existsSync(path.join(ROOT, e.record)) ? sha(e.record) : null });
    }
  }
  /* the register, re-derived from the records as they stand after the reruns */
  const rl = cp.spawnSync('node', ['tools/run-claims-ledger.js'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  if (rl.status !== 0) die('the register would not rebuild after the reruns:\n' + String(rl.stderr).slice(-2000));
  const after = snapshot.call(null);
  const R2 = J('certs/claims-ledger.json');
  const after2 = Object.fromEntries(R2.rows.map((r) => [r.id, [r.verdict, r.scope, r.kind].join(' | ')]));
  const moved = Object.keys(before).filter((id) => before[id] !== after2[id]).concat(Object.keys(after2).filter((id) => !(id in before)));
  void after;
  const failed = runs.filter((r) => r.status !== 0).map((r) => r.record + ' (' + r.kind + ')');
  const prev = fs.existsSync(path.join(ROOT, RUN_RECORD)) ? J(RUN_RECORD) : null;
  const out = {
    what: 'The rerun kit, executed: every command of corpus/rerun-kit.json run from this repository, timed, the register\'s rows (verdict, scope, kind) compared before and after. Written by tools/build-report-rerun.js --run; the page reads the runtimes from here and never types one.',
    date: new Date().toISOString().slice(0, 10), git, machine,
    partial: !!ONLY, runs,
    registerRows: Object.keys(before).length, rowsMoved: moved, failed
  };
  /* a partial run keeps the previous record's other entries so the page stays whole */
  if (ONLY && prev) {
    const done = new Set(runs.map((r) => r.record + '|' + r.kind));
    out.runs = prev.runs.filter((r) => !done.has(r.record + '|' + r.kind)).concat(runs);
    out.partial = prev.partial && true;
  }
  fs.writeFileSync(path.join(ROOT, RUN_RECORD), JSON.stringify(out, null, 1) + '\n');
  if (moved.length) die('a rerun MOVED a register row — ' + moved.join(', ') + ' — recorded in ' + RUN_RECORD + '; the page refuses');
  if (failed.length) die('a rerun command failed — ' + failed.join(', ') + ' — recorded in ' + RUN_RECORD + '; the page refuses');
  console.log('rerun-kit-run.json written: ' + runs.length + ' commands, ' + out.registerRows + ' register rows unchanged');
}

/* ---- the run record, read ----------------------------------------------------- */
const RUNREC = fs.existsSync(path.join(ROOT, RUN_RECORD)) ? J(RUN_RECORD) : null;
if (RUNREC) {
  if (RUNREC.rowsMoved.length) die('the run record says a rerun moved a register row (' + RUNREC.rowsMoved.join(', ') + '); re-run or repair before publishing');
  if (RUNREC.failed.length) die('the run record holds failed commands (' + RUNREC.failed.join(', ') + '); re-run or repair before publishing');
}
const timed = (rec, kind) => { if (!RUNREC) return null; const r = RUNREC.runs.find((x) => x.record === rec && x.kind === kind); return r ? r.seconds : null; };
const secs = (s) => s === null ? 'not yet timed' : s < 1 ? '< 1 s' : s < 90 ? s + ' s' : Math.round(s / 6) / 10 + ' min';

/* ---- the counts, all derived ---------------------------------------------------- */
const N = {
  records: KIT.entries.length,
  rows: R.rows.length,
  decided: R.decided,
  withRederive: KIT.entries.filter((e) => e.rederive).length,
  withVerifier: KIT.entries.filter((e) => e.verifier).length,
  withSecond: KIT.entries.filter((e) => e.second).length,
  debts: KIT.entries.filter((e) => !e.rederive).length,
  external: EXT.length,
  externalOwnCode: EXT.filter((x) => x.kind === 'own-code').length,
  corpusRows: CORPUS.rows.length,
  corpusParties: Object.keys(CORPUS.parties).length,
  corpusPartiesDone: partiesDone.size,
  corpusRowsRerun: CORPUS.rows.filter((c) => rerunsOf(c.id).length).length,
  timed: RUNREC ? RUNREC.runs.length : 0
};
const verifierHref = (cmd) => { const m = /tools\/(verify_[\w]+\.py)/.exec(cmd); return m ? '/verify/' + m[1] : null; };

/* ---- the page ------------------------------------------------------------------ */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the rerun kit',
  title: 'Re-run any decided claim',
  deck: 'Every row of the claims register is derived from a record, and every record is re-derivable from this repository. '
    + 'This page is the kit: for each record, the command that re-derives it, the standard-library verifier where one exists, '
    + 'the independent second implementation where one exists, and the record\'s hash at this build — and the registry of '
    + 'who outside has re-run what, which is the only number here that measures the independence this machine claims.'
}));
B.push(C.scope('Published, not peer-reviewed. ' + N.external + ' independent rerun' + (N.external === 1 ? '' : 's') + ' recorded at this build, '
  + N.externalOwnCode + ' with no code of ours. Until that number is larger than the number of operators (one), the verdicts here rest on one '
  + 'machine and one person, and this page says so rather than implying otherwise.'));
B.push(C.tldr({
  findingRaw: '<b>' + N.records + ' records decide ' + N.decided + ' register rows.</b> ' + N.withRederive + ' of the ' + N.records + ' re-derive with one command, '
    + N.withVerifier + ' carry a verifier in the Python standard library with no engine code, ' + N.withSecond + ' carry a second implementation in another '
    + 'arithmetic. ' + N.debts + ' have no one-line re-derivation and are named as debts below. '
    + (RUNREC ? 'All ' + N.timed + ' commands were executed on ' + RUNREC.date + ' and the register\'s ' + RUNREC.registerRows + ' rows did not move.' : 'The commands have not yet been timed from this page.'),
  mechanismRaw: 'A rerun is one of three things, and the registry names which: <b>own code</b> (you re-derive the claim from the published statement '
    + 'and none of our code runs — the strongest), a <b>detached verifier</b> (our standard-library script on a copy of the record; it prints a '
    + 'sha256 you report), or a <b>full re-derivation</b> (the tool that writes the record, then the register compared). A disagreement is recorded '
    + 'exactly like an agreement, and whichever side is wrong is decided in public.',
  checkRaw: 'Clone <a href="' + GH + '">the repository</a>, run a line from the table, and file <a href="' + ISSUE + '">a rerun report</a> '
    + '(or write to <a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a>). The same kit is in the repository as '
    + '<span class="m">RERUN.md</span>, generated by the same build as this page.'
}));
B.push(C.stats([
  { k: 'records in the kit', v: String(N.records), n: 'One per record the register derives rows from; the register and the kit must name the same set or this page refuses.' },
  { k: 'register rows', v: String(N.decided), n: 'Decided claims, each read from its record at build.' },
  { k: 'stdlib verifiers', v: String(N.withVerifier), n: 'Python standard library only, zero code shared with the engine; each must refute a forgery before it exits green.' },
  { k: 'second implementations', v: String(N.withSecond), n: 'The same decision in another arithmetic or by another program.' },
  { k: 'independent reruns', v: String(N.external), role: 'held', n: 'Recorded from corpus/external-reruns.json. ' + N.externalOwnCode + ' with no code of ours.' },
  { k: 'the milestone', v: N.corpusPartiesDone + ' of ' + N.corpusParties, role: 'held', n: 'Parties who re-ran a row of the corpus in §3 (' + N.corpusRowsRerun + ' of its ' + N.corpusRows + ' rows re-run). Read from the registry, never declared. One operator, one machine until this moves.' }
]));

B.push(C.section({
  lab: '§1 · the protocol', title: 'What to run, what to report',
  bodyRaw: C.plainList([
    { b: '1. Pick a record.', text: 'The table in §2 lists every record the register is derived from, the rows it decides, and the record\'s sha256 at this build. Clone the repository and check the file you have hashes the same; if it does not, you have a later or earlier version, which is fine — report the hash you have.' },
    { b: '2. Run one line.', raw: 'The verifier column is the cheapest and the most independent of the engine: one Python file, standard library only, which re-derives the mathematics from the record, re-hashes the pinned sources it cites, refutes a built-in forgery, and prints the sha256 of the record it checked. The re-derive column runs the tool that wrote the record (<span class="m">--check</span> where the tool has it: re-derive, compare, write nothing). The second column is the same decision by another program.' },
    { b: '3. Or write your own.', text: 'The strongest rerun uses none of our code: take the claim as printed on the record\'s page, decide it with whatever you already trust, and report what you obtained. Our verdict is on the page; yours goes in the registry beside it, agreeing or not.' },
    { b: '4. Report it.', raw: 'File <a href="' + ISSUE + '">a rerun report</a>: the record, how you reran it (one of the three kinds), the verdict you obtained, the sha256 printed, where it ran, and the name to record. The row is added to <span class="m">corpus/external-reruns.json</span> and appears here, on <a href="/oracle/">the oracle</a> and on <a href="/machine/">the control page</a> at the next build.' }
  ])
}));

const kitRows = KIT.entries.map((e) => {
  const rows = rowsOf(e.record);
  const vh = e.verifier ? verifierHref(e.verifier) : null;
  const cmdCell = (cmd, kind) => cmd
    ? { raw: '<span class="m">' + C.esc(cmd) + '</span><br><small>' + C.esc(secs(timed(e.record, kind))) + '</small>' }
    : { raw: '<small>—</small>' };
  return [
    { raw: '<span class="m">' + C.esc(e.record) + '</span><br><small>' + C.esc(e.needs) + '</small>' },
    { raw: '<a href="' + C.escAttr(rows[0].page) + '">' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + '</a><br><small>' + C.esc(verdictSummary(rows)) + '</small>' },
    cmdCell(e.rederive, 'rederive'),
    e.verifier ? { raw: (vh ? '<a href="' + vh + '"><span class="m">' + C.esc(e.verifier) + '</span></a>' : '<span class="m">' + C.esc(e.verifier) + '</span>') + '<br><small>' + C.esc(secs(timed(e.record, 'verifier'))) + '</small>' } : { raw: '<small>—</small>' },
    cmdCell(e.second, 'second'),
    { raw: '<span class="m">' + sha(e.record).slice(0, 16) + '…</span>' }
  ];
});
B.push(C.section({
  lab: '§2 · the kit', title: N.records + ' records, ' + N.decided + ' rows, one line each', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'record · what it needs' }, { h: 'rows it decides' }, { h: 're-derive' }, { h: 'stdlib verifier' }, { h: 'second implementation' }, { h: 'sha256 at this build' }],
    rows: kitRows
  })
    + '<div class="col">' + C.pRaw('Runtimes are ' + (RUNREC ? 'measured: every command executed on ' + C.esc(RUNREC.date) + ' on ' + C.esc(RUNREC.machine.cpu) + ' (' + C.esc(RUNREC.machine.os) + ', ' + C.esc(RUNREC.machine.node) + ', ' + C.esc(RUNREC.machine.python) + '), the register\'s rows compared before and after'
      : 'not yet measured from this page') + '. The hash is of the record as this page was built; a clone at another commit may differ, and the report form asks for the hash you have.')
    + C.pRaw('<b>The debts.</b> ' + KIT.entries.filter((e) => !e.rederive).map((e) => '<span class="m">' + C.esc(e.record) + '</span>: ' + C.esc(e.note)).join(' ') + ' These are the records a reader cannot re-derive with one line yet; the page counts them rather than hiding them.')
    + '</div>'
}));

const partyRows = (key) => CORPUS.rows.filter((c) => c.party === key);
B.push(C.section({
  lab: '§3 · the corpus', title: N.corpusRows + ' rows for ' + N.corpusParties + ' outside parties', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The milestone of this program is one sentence: <b>' + C.esc(CORPUS.milestone) + '</b>. These rows were chosen for one property — '
    + 'someone outside this lab has a reason to re-derive them and the means to do it in a line. Each party\'s ask is drafted in the repository '
    + '(<span class="m">outreach/rerun-asks-2026-10-02.md</span>) and is sent only on the operator\'s word, one at a time; a party counts below when a '
    + 'row of theirs in the registry names one of these ids, and not before.') + '</div>'
    + C.table({
      cols: [{ h: 'party' }, { h: 'why them' }, { h: 'rows' }, { h: 'status' }],
      rows: Object.entries(CORPUS.parties).map(([key, p]) => [p.who, p.why,
        { raw: partyRows(key).map((c) => { const r = R.rows.find((x) => x.id === c.id); return '<a href="' + C.escAttr(r.page) + '"><span class="m">' + C.esc(c.id) + '</span></a> · ' + C.esc(r.verdict) + '<br><small>' + C.esc(c.why) + '</small>'; }).join('<br>') },
        { raw: partiesDone.has(p.who) ? '<b>re-run</b>' : partyRows(key).some((c) => rerunsOf(c.id).length) ? 're-run by another party' : 'open' }])
    })
}));

B.push(C.section({
  lab: '§4 · the row', title: 'What a register row is, and the closed vocabulary of what goes wrong',
  bodyRaw: C.pRaw('Every row of <a href="/reports/claims.html">the register</a> carries the same fields, filled from its record by '
    + '<span class="m">tools/run-claims-ledger.js</span> and never typed: <span class="m">id</span>, <span class="m">claim</span> (what the '
    + 'claimant printed), <span class="m">claimant</span>, <span class="m">source</span> (the bytes, pinned where they exist), '
    + '<span class="m">origin</span> (self-initiated or submitted), <span class="m">verdict</span>, <span class="m">scope</span> (what was actually '
    + 'decided), <span class="m">kind</span> (what went wrong, from the vocabulary below), <span class="m">decidedFrom</span> (the record), '
    + '<span class="m">page</span>, <span class="m">recordedOn</span> (the first commit whose record held the row). The three verdicts are '
    + 'CERTIFIED, REFUTED and REFUSED; PARTIAL, MIXED, REPAIRED and NEEDS DATA are compositions of those three and the register page says which.')
    + C.table({
      cols: [{ h: 'kind' }, { h: 'meaning' }, { h: 'rows' }],
      rows: Object.entries(R.kindsDefined).map(([k, d]) => [{ raw: '<span class="m">' + C.esc(k) + '</span>' }, d, String(R.byKind && R.byKind[k] ? R.byKind[k] : 0)])
    })
    + C.pRaw('The oracle\'s machine-readable contract — the claim a caller sends and the result it gets back — is a JSON schema in the repository: '
      + '<span class="m">oracle/claim-schema.json</span> and <span class="m">oracle/certificate-schema.json</span>, enforced by '
      + '<span class="m">oracle/battery.py</span> at every build of <a href="/oracle/">/oracle/</a>.')
}));

B.push(C.section({
  lab: '§5 · the registry', title: N.external + ' independent rerun' + (N.external === 1 ? '' : 's') + ', recorded', wide: true,
  bodyRaw: (EXT.length ? C.table({
    cols: [{ h: 'who' }, { h: 'date' }, { h: 'what was rerun' }, { h: 'how' }, { h: 'obtained' }, { h: 'hash · code' }],
    rows: EXT.map((x) => [x.who, x.date, { raw: C.esc(x.what) + ((x.rows || []).length ? '<br><small>register rows: ' + x.rows.map((id) => '<span class="m">' + C.esc(id) + '</span>').join(', ') + '</small>' : '<br><small>not a register row (a lab theorem)</small>') }, { raw: '<span class="m">' + C.esc(x.kind) + '</span>' }, x.outcome || '',
      { raw: (x.hash ? '<span class="m">' + x.hash.slice(0, 16) + '…</span><br>' : '') + '<a href="' + C.escAttr(x.where) + '">code</a>' + (x.posted ? ' · <a href="' + C.escAttr(x.posted) + '">posted</a>' : '') }])
  }) : '<div class="col">' + C.p('None recorded yet.') + '</div>')
    + '<div class="col">' + C.pRaw('Three kinds and no fourth: ' + Object.entries(RERUN_KINDS).map(([k, d]) => '<span class="m">' + C.esc(k) + '</span> — ' + C.esc(d)).join('; ') + '. '
      + 'The registry is <span class="m">corpus/external-reruns.json</span>; a row is added by hand from a rerun report, and the build refuses a row that lacks a field or names a kind outside these three.') + '</div>'
}));

B.push(C.section({
  lab: '§6 · the trust base', title: 'What you are trusting when you trust a verdict here',
  bodyRaw: C.p('V8\'s BigInt and IEEE-754 directed rounding in the engine; Python\'s fractions and decimal in the detached verifiers; a handful of '
    + 'named external theorems consumed and cross-checked, never machine-proved; the operating system\'s hashing; and one operator on one machine. '
    + 'Each item on that list is shrunk by a different thing: the verifiers shrink the engine, the second implementations shrink the verifiers, and '
    + 'only the registry above shrinks the last item.')
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-rerun.js from corpus/rerun-kit.json, certs/claims-ledger.json, corpus/external-reruns.json'
  + (RUNREC ? ' and certs/rerun-kit-run.json (' + RUNREC.date + ')' : '') + '; every count derived at build; the register and the kit must name the same records or the page refuses. Rebuild: node tools/build-report-rerun.js') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'rerun.html'), TPL.render({
  title: 'Re-run any decided claim · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The rerun kit: for every record the claims register is derived from, the command that re-derives it, the standard-library verifier and the second implementation where they exist, the record\'s hash at this build, and the registry of independent reruns.',
  path: '/reports/rerun.html'
}));

/* ---- RERUN.md, the same kit for a reader in the repository ------------------------ */
const md = [];
md.push('# Re-run any decided claim');
md.push('');
md.push('> Generated by `tools/build-report-rerun.js` — the same build as [/reports/rerun.html](https://carlostoledo.co/reports/rerun.html). Do not edit; edit `corpus/rerun-kit.json`.');
md.push('');
md.push('Every row of the claims register (`certs/claims-ledger.json`, ' + N.decided + ' decided rows) is derived from a record, and every record is re-derivable from this repository. ' + N.records + ' records; ' + N.withRederive + ' re-derive with one command; ' + N.withVerifier + ' carry a verifier in the Python standard library with no engine code; ' + N.withSecond + ' carry a second implementation. ' + N.external + ' independent rerun' + (N.external === 1 ? '' : 's') + ' recorded (' + N.externalOwnCode + ' with no code of ours).');
md.push('');
md.push('## The protocol');
md.push('');
md.push('1. **Pick a record** from the table. Hash the file you cloned (`shasum -a 256 <record>`); the table gives the hash at the build that wrote this file.');
md.push('2. **Run one line.** The verifier column is the cheapest and the most independent of the engine: one Python file, standard library only. The re-derive column runs the tool that wrote the record (`--check` re-derives, compares and writes nothing). The second column is the same decision by another program.');
md.push('3. **Or write your own.** Take the claim as printed on the record\'s page, decide it with whatever you already trust, and report what you obtained.');
md.push('4. **Report it:** [a rerun report](' + ISSUE + ') — the record, how (own code / detached verifier / full re-derivation), the verdict obtained, the sha256 printed, where it ran, the name to record. It is added to `corpus/external-reruns.json` and appears on the page at the next build.');
md.push('');
md.push('## The kit');
md.push('');
md.push('| record | needs | rows | re-derive | stdlib verifier | second implementation | sha256 at this build |');
md.push('|---|---|---|---|---|---|---|');
for (const e of KIT.entries) {
  const rows = rowsOf(e.record);
  const c = (cmd, kind) => cmd ? '`' + cmd + '` (' + secs(timed(e.record, kind)) + ')' : '—';
  md.push('| `' + e.record + '` | ' + e.needs + ' | ' + rows.length + ' (' + verdictSummary(rows) + ') | ' + c(e.rederive, 'rederive') + ' | ' + c(e.verifier, 'verifier') + ' | ' + c(e.second, 'second') + ' | `' + sha(e.record).slice(0, 16) + '…` |');
}
md.push('');
md.push(RUNREC ? 'Runtimes measured ' + RUNREC.date + ' on ' + RUNREC.machine.cpu + ' (' + RUNREC.machine.os + ', ' + RUNREC.machine.node + ', ' + RUNREC.machine.python + '); the register\'s ' + RUNREC.registerRows + ' rows compared before and after, none moved.' : 'Runtimes not yet measured from this kit.');
md.push('');
md.push('**Debts** (no one-line re-derivation yet): ' + KIT.entries.filter((e) => !e.rederive).map((e) => '`' + e.record + '` — ' + e.note).join(' '));
md.push('');
md.push('## The corpus for outside reruns');
md.push('');
md.push('Milestone: ' + CORPUS.milestone + '. ' + N.corpusPartiesDone + ' of ' + N.corpusParties + ' parties have re-run a row (' + N.corpusRowsRerun + ' of ' + N.corpusRows + ' rows), read from the registry below.');
md.push('');
md.push('| party | rows | status |');
md.push('|---|---|---|');
for (const [key, p] of Object.entries(CORPUS.parties)) md.push('| ' + p.who + ' | ' + partyRows(key).map((c) => '`' + c.id + '` (' + R.rows.find((x) => x.id === c.id).verdict + ')').join(', ') + ' | ' + (partiesDone.has(p.who) ? 're-run' : 'open') + ' |');
md.push('');
md.push('## The registry of independent reruns');
md.push('');
if (EXT.length) {
  md.push('| who | date | what | how | obtained | where |');
  md.push('|---|---|---|---|---|---|');
  for (const x of EXT) md.push('| ' + x.who + ' | ' + x.date + ' | ' + x.what.replace(/\|/g, '\\|') + ' | `' + x.kind + '` | ' + (x.outcome || '') + ' | [code](' + x.where + ')' + (x.posted ? ' · [posted](' + x.posted + ')' : '') + (x.hash ? ' · `' + x.hash.slice(0, 16) + '…`' : '') + ' |');
} else md.push('None recorded yet.');
md.push('');
md.push('Kinds: ' + Object.entries(RERUN_KINDS).map(([k, d]) => '`' + k + '` — ' + d).join('; ') + '.');
md.push('');
md.push('## The trust base');
md.push('');
md.push('V8\'s BigInt and IEEE-754 directed rounding in the engine; Python\'s fractions and decimal in the detached verifiers; a handful of named external theorems consumed and cross-checked, never machine-proved; the operating system\'s hashing; and one operator on one machine. The verifiers shrink the engine, the second implementations shrink the verifiers, and only the registry above shrinks the last item.');
md.push('');
md.push('git ' + git);
fs.writeFileSync(path.join(ROOT, 'RERUN.md'), md.join('\n') + '\n');

console.log('reports/rerun.html + RERUN.md written: ' + N.records + ' records, ' + N.decided + ' rows, ' + N.withVerifier + ' verifiers, ' + N.external + ' external reruns, corpus ' + N.corpusPartiesDone + '/' + N.corpusParties + ' parties @ git ' + git);
