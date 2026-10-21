#!/usr/bin/env node
/* run-selfaudit-inventory.js — the self-audit of cert-machine, Phase 1: the inventory → certs/selfaudit-inventory.json

   WHY. The self-audit (pre-registered 2026-10-20, notes/selfaudit-preregistration-2026-10-20.md; named selfaudit 2026-10-21 on
   the operator's "decide bench") measures this instrument on the frozen register: soundness under mutation, concordance,
   coverage and refusal, cost and reproducibility, and a float check on the same mutants. Before any of that is run, the
   inventory says, per register row and per record, what exists: the command that re-derives the record, the
   standard-library verifier and the second implementation where they exist, the measured seconds of each command from
   the rerun kit's run, whether the record carries a per-row timing, and whether the row can be mutated under the
   pre-registration's class table — or why not. Every field is DERIVED from the register, the kit, the kit's run record
   and the records themselves; the only thing typed here is the class table, which is the pre-registration's own table,
   and a register record that the table does not name refuses the build.

   GATES. The register and the kit name the same records; the run record is whole (not partial), moved no row and
   holds no failed command; every register row maps to its record; every record is in the class table. --check
   regenerates the inventory and refuses when it differs from the file on disk in anything but the two stamps.

   usage: node tools/run-selfaudit-inventory.js            write certs/selfaudit-inventory.json
          node tools/run-selfaudit-inventory.js --check    regenerate, compare, write nothing (exit 1 on drift)
          node tools/run-selfaudit-inventory.js --out p    write to another path (a dry run)                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = 'certs/selfaudit-inventory.json';
const NOTE = 'notes/selfaudit-preregistration-2026-10-20.md';
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const outArg = (() => { const i = argv.indexOf('--out'); return i >= 0 ? argv[i + 1] : null; })();
const die = (m) => { console.error('SELF-AUDIT INVENTORY REFUSED: ' + m); process.exit(1); };
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* THE CLASS TABLE — the pre-registration's "Mutation classes per record", one line per record the register derives
   from. family null = not mutated in v0, with the reason. A record missing here refuses: a new record must be classified
   before the inventory counts it. */
const TENSOR = 'a tensor decomposition — FALSE: one coefficient +1; one coefficient × (1 + 10⁻⁹) as the exact decimal; a rank-1 term dropped; a term duplicated; an F₂ scheme asserted over Q (with a witness, else discarded). TRUE: the factor columns permuted together; one term\'s (u, v) signs flipped together. MALFORMED: a short row';
const SHAPES = 'an EinsteinArena shape — FALSE: the printed value moved one unit in its last digit past the bytes; a coordinate perturbed by 10⁻¹² (with a witness, else discarded). TRUE: a rigid motion the problem admits, stated per problem. MALFORMED: a coordinate missing';
const PHASE3 = 'classes written in Phase 3 under the rule (FALSE with a witness, TRUE by invariance, MALFORMED by shape); a family with no admissible class is reported as not mutated';
const CLASSES = {
  'certs/strassen-certificate.json': ['tensor', TENSOR],
  'certs/mc100-alphatensor-q.json': ['tensor', TENSOR],
  'certs/mc100-alphatensor-f2.json': ['tensor', TENSOR],
  'certs/mc100-alphaevolve-nb-matmul.json': ['tensor', TENSOR],
  'certs/kissing-ledger.json': ['kissing', 'the seven planted classes of certs/method-eval.json (a row duplicated, doubled, a 30° sum, the zero vector = FALSE; negation, a coordinate permutation = TRUE; mixed dimensions = MALFORMED) on the register\'s own configurations'],
  'certs/easota-ledger.json': ['shapes', SHAPES],
  'certs/mc100-einstein-arena.json': ['shapes', SHAPES],
  'certs/erdos852-certificate.json': ['erdos852', 'FALSE: the published digit string; the corrected enclosure\'s upper end raised by one unit. TRUE: the enclosure widened outward. MALFORMED: a non-numeric digit'],
  'certs/polymaps-ledger.json': ['polymaps', PHASE3],
  'certs/countex-ledger.json': ['countex', PHASE3],
  'certs/sumdiff-ledger.json': ['entropy', PHASE3 + ' (the three planted entropy classes of certs/method-eval.json exist already)'],
  'certs/fei-ledger.json': ['entropy', PHASE3],
  'certs/turan-ledger.json': ['turan', PHASE3],
  'certs/horizonmath-ledger.json': ['horizonmath', PHASE3],
  'certs/gnnw-certificate.json': ['gnnw', PHASE3],
  'certs/sumproduct-ledger.json': ['sumproduct', PHASE3],
  'certs/mc100-station-v2.json': ['polymaps', PHASE3],
  'certs/ai-claims-summary.json': [null, 'an aggregate of six audit lanes with no single object to mutate'],
  'corpus/navier-stokes/audit.json': [null, 'a reading beside a kernel verdict; no object to mutate'],
  'certs/ecbench-ledger.json': [null, 'an aggregate row (a benchmark\'s counts); no object to mutate'],
  'certs/gsm8k-ledger.json': [null, 'an aggregate row (an answer key re-decided); no object to mutate'],
  'certs/horizon-ledger.json': [null, 'an aggregate row (a time-horizon fit); no object to mutate'],
  'certs/hseva-ledger.json': [null, 'an aggregate row (a benchmark\'s marginals); no object to mutate'],
  'certs/design-table-audit.json': [null, 'a NEEDS DATA row whose pin cannot resolve; no object to mutate'],
  'ledger.json': [null, 'the engine\'s own ledger (the Ramanujan-audit row); an aggregate, no object to mutate']
};

/* ---- inputs --------------------------------------------------------------------------------------------------- */
const R = J('certs/claims-ledger.json');
const KIT = J('corpus/rerun-kit.json');
const RUN = J('certs/rerun-kit-run.json');
if (!fs.existsSync(path.join(ROOT, NOTE))) die('the pre-registration is missing: ' + NOTE);
const recOf = (s) => s.split(' ')[0];
const regRecords = [...new Set(R.rows.map((r) => recOf(r.decidedFrom)))].sort();
const kitRecords = KIT.entries.map((e) => e.record).sort();
if (regRecords.join('|') !== kitRecords.join('|')) die('the register and the kit name different records');
for (const rec of regRecords) if (!(rec in CLASSES)) die('a register record is not in the class table: ' + rec + ' — classify it in the pre-registration first');
if (RUN.partial) die('the run record is partial; run the whole kit first');
if (RUN.rowsMoved.length) die('the run record says a rerun moved a register row: ' + RUN.rowsMoved.join(', '));
if (RUN.failed.length) die('the run record holds failed commands: ' + RUN.failed.join(', '));

/* ---- the record's own rows, for per-row timing ------------------------------------------------------------------- */
const recordRows = (rec) => {
  const d = J(rec);
  let rows = d.rows || d.entries || d.claims || d.decisions || [];
  if (!Array.isArray(rows) && typeof rows === 'object') rows = Object.values(rows);
  return Array.isArray(rows) ? rows.filter((x) => x && typeof x === 'object') : [];
};
const rowsByRecord = Object.fromEntries(regRecords.map((rec) => [rec, recordRows(rec)]));
const TIMING_FIELDS = ['ms', 'seconds'];
const findRecordRow = (rec, id) => {
  const cands = rowsByRecord[rec].filter((x) => typeof x.id === 'string').map((x) => [x, String(x.id).replace(/\//g, '-')]);
  const hits = cands.filter(([, n]) => id === n || id.endsWith('-' + n));
  if (!hits.length) return null;
  hits.sort((a, b) => b[1].length - a[1].length);
  return hits[0][0];
};
const timingOf = (rec, id) => {
  const x = findRecordRow(rec, id);
  if (!x) return { field: null, ms: null };
  for (const f of TIMING_FIELDS) if (typeof x[f] === 'number') return { field: f, ms: f === 'ms' ? x[f] : Math.round(x[f] * 1000) };
  return { field: null, ms: null };
};

/* ---- per record --------------------------------------------------------------------------------------------------- */
const timed = (rec, kind) => { const r = RUN.runs.find((x) => x.record === rec && x.kind === kind); return r ? { seconds: r.seconds, status: r.status, sha256After: r.sha256After } : null; };
const PORTABLE_WALL_S = 60;
const records = KIT.entries.map((e) => {
  const rows = R.rows.filter((r) => recOf(r.decidedFrom) === e.record);
  const byVerdict = {}; for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
  const t = { rederive: e.rederive ? timed(e.record, 'rederive') : null, verifier: e.verifier ? timed(e.record, 'verifier') : null, second: e.second ? timed(e.record, 'second') : null };
  const [family, classes] = CLASSES[e.record];
  const perRow = rows.map((r) => timingOf(e.record, r.id).field).filter(Boolean);
  /* a re-derive command with --check compares and WRITES NOTHING (the kit's own convention), so byte identity after it
     is trivial; the flag is kept only for commands that write the record */
  const writes = !!e.rederive && !/--check\b/.test(e.rederive);
  const identical = writes && t.rederive && t.rederive.sha256After ? t.rederive.sha256After === sha(e.record) : null;
  return {
    record: e.record, sha256: sha(e.record), rows: rows.length, byVerdict,
    rederive: e.rederive, verifier: e.verifier, second: e.second, needs: e.needs,
    timed: t,
    rederiveSeconds: t.rederive ? t.rederive.seconds : null,
    untimed: !!e.rederive && !t.rederive,
    overPortable: t.rederive ? t.rederive.seconds > PORTABLE_WALL_S : null,
    rederiveWrites: writes,
    rederiveByteIdentical: identical,
    perRowTimingField: perRow.length ? perRow[0] : null,
    mutation: { family, classes }
  };
});

/* ---- per row ------------------------------------------------------------------------------------------------------ */
const rows = R.rows.map((r) => {
  const rec = recOf(r.decidedFrom);
  const [family, reason] = CLASSES[rec];
  const t = timingOf(rec, r.id);
  return { id: r.id, record: rec, verdict: r.verdict, kind: r.kind, page: r.page, timingMs: t.ms, timingField: t.field, mutable: !!family, family: family || null, notMutatedBecause: family ? null : reason };
});

/* ---- totals, all derived --------------------------------------------------------------------------------------------- */
const count = (xs, f) => xs.filter(f).length;
const byFamily = {}; for (const r of rows) if (r.family) byFamily[r.family] = (byFamily[r.family] || 0) + 1;
const totals = {
  records: records.length, rows: rows.length, rowsDecided: R.decided, rowsPending: R.pending,
  byVerdict: R.byVerdict, byKind: R.byKind,
  recordsWithRederive: count(records, (x) => x.rederive), recordsWithVerifier: count(records, (x) => x.verifier), recordsWithSecond: count(records, (x) => x.second),
  recordsWithoutRederive: records.filter((x) => !x.rederive).map((x) => x.record),
  rowsWithRederive: rows.filter((r) => records.find((x) => x.record === r.record).rederive).length,
  rowsWithVerifier: rows.filter((r) => records.find((x) => x.record === r.record).verifier).length,
  rowsWithSecond: rows.filter((r) => records.find((x) => x.record === r.record).second).length,
  commandsTimed: RUN.runs.length, recordsTimed: count(records, (x) => x.timed.rederive), recordsUntimed: records.filter((x) => x.untimed).map((x) => x.record),
  portableWallSeconds: PORTABLE_WALL_S,
  recordsOverPortable: records.filter((x) => x.overPortable).map((x) => ({ record: x.record, seconds: x.rederiveSeconds, rows: x.rows })),
  rowsOverPortable: rows.filter((r) => records.find((x) => x.record === r.record).overPortable).length,
  rederiveChecksOnly: records.filter((x) => x.rederive && !x.rederiveWrites).map((x) => x.record),
  rederiveWrites: records.filter((x) => x.rederiveWrites).map((x) => x.record),
  rederiveByteIdentical: records.filter((x) => x.rederiveByteIdentical === true).map((x) => x.record),
  rederiveNotByteIdentical: records.filter((x) => x.rederiveByteIdentical === false).map((x) => x.record),
  rowsWithPerRowTiming: count(rows, (r) => r.timingMs !== null),
  rowsMutable: count(rows, (r) => r.mutable), rowsNotMutated: count(rows, (r) => !r.mutable), byFamily,
  refusals: rows.filter((r) => r.verdict === 'NEEDS DATA' || r.verdict === 'QUEUED').map((r) => ({ id: r.id, verdict: r.verdict, kind: r.kind, scope: R.rows.find((x) => x.id === r.id).scope })),
  compositions: Object.fromEntries(['PARTIAL', 'MIXED', 'REPAIRED'].map((v) => [v, count(rows, (r) => r.verdict === v)]))
};

const out = {
  what: 'The self-audit of cert-machine, Phase 1 — the inventory: per register row and per record, what exists before anything is measured (the re-derive command, the standard-library verifier, the second implementation, the rerun kit\'s measured seconds, the per-row timing field, and whether the row is mutable under the pre-registration\'s class table or why not). Every field derived from the register, the kit, the kit\'s run record and the records; the class table is the pre-registration\'s. Written by tools/run-selfaudit-inventory.js.',
  name: 'selfaudit', phase: 1,
  generated: new Date().toISOString(), git,
  preregistration: { path: NOTE, sha256: sha(NOTE) },
  inputs: {
    register: { path: 'certs/claims-ledger.json', sha256: sha('certs/claims-ledger.json'), rows: R.rows.length, meta: R.meta },
    kit: { path: 'corpus/rerun-kit.json', sha256: sha('corpus/rerun-kit.json'), entries: KIT.entries.length },
    run: { path: 'certs/rerun-kit-run.json', sha256: sha('certs/rerun-kit-run.json'), date: RUN.date, git: RUN.git, machine: RUN.machine, registerRows: RUN.registerRows }
  },
  totals, records, rows
};

/* ---- write or check ---------------------------------------------------------------------------------------------------- */
const STAMPS = new Set(['generated', 'git']);
const strip = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !STAMPS.has(k))));
if (CHECK) {
  if (!fs.existsSync(path.join(ROOT, OUT))) die('no inventory on disk to check');
  const have = J(OUT);
  if (strip(have) !== strip(out)) die('the inventory on disk differs from what the register, the kit and the run record derive now');
  console.log('selfaudit inventory holds: ' + totals.records + ' records, ' + totals.rows + ' rows, ' + totals.recordsWithRederive + ' re-derive, '
    + totals.recordsWithVerifier + ' stdlib verifiers, ' + totals.recordsWithSecond + ' second, ' + totals.recordsTimed + ' timed ('
    + totals.recordsOverPortable.length + ' over ' + PORTABLE_WALL_S + ' s), ' + totals.rowsMutable + ' mutable rows');
  process.exit(0);
}
const dest = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.log('written ' + dest + ': ' + totals.records + ' records, ' + totals.rows + ' rows; re-derive ' + totals.recordsWithRederive + ', verifier '
  + totals.recordsWithVerifier + ', second ' + totals.recordsWithSecond + '; timed ' + totals.recordsTimed + ', untimed ' + totals.recordsUntimed.length
  + ', over portable ' + totals.recordsOverPortable.length + '; per-row timing ' + totals.rowsWithPerRowTiming + ' rows; mutable ' + totals.rowsMutable + ' of ' + totals.rows);
