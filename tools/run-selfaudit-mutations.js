#!/usr/bin/env node
/* run-selfaudit-mutations.js — the self-audit of cert-machine, Phase 3: the mutation campaign → certs/selfaudit-mutations.json

   WHY. M1 of the pre-registration (notes/selfaudit-preregistration-2026-10-20.md): a mutant is a case derived from a
   register row's pinned input by ONE named transformation of the class table; its truth is fixed by construction —
   FALSE requires a WITNESS (a violated condition computed and printed by a script that shares no code with the decider
   under test), TRUE an INVARIANCE stated in the class, MALFORMED a shape the schema forbids. The decider under test is
   the row's own re-derive path with the mutant in place of the pinned bytes. Required words: FALSE → REFUTED, TRUE →
   CERTIFIED, MALFORMED → REFUSED; a REFUSED on a FALSE or TRUE mutant is a refusal with its reason. A FALSE-class
   mutant for which the witness finds no violation is DISCARDED and counted, never relabelled. Counted per family and
   in total: false certifications (CERTIFIED on FALSE), false refutations (REFUTED on TRUE), refusals, discards; a
   false certification is a defect, fixed and kept on the record. A TRUE mutant by invariance preserves the original's
   status, so its required word is the original's register word (a REPAIRED row's rigid motion is REPAIRED again) and
   the witness is expected to find the original's own violation on it; a TRUE mutant that is a true claim in its own
   right requires CERTIFIED. A row with no object (the QUEUED kissing row: no
   bytes) is listed with the reason and has no mutant. M5 beside it: a double-precision checker with a
   tolerance τ on every original and every mutant — the accept rate on witnessed FALSE mutants at τ = 1e-6, 1e-9,
   1e-12. The Phase 3 kill switch: fewer than half of the 119 mutable rows with at least one witnessed FALSE mutant →
   M1 is published as a partial with the count and the plan stops there.

   HOW. One module per family under instruments/selfaudit/ (its rows from the register and the record, its mutators,
   the decider as the register's own tools call it, the names of its witness and float-check scripts); this runner
   drives them: per row the original and every mutant are written to a scratch file, the witness script and the float
   checker run on the whole row in one Python process each, the decider run in-process on every claim; every mutant
   pinned by the sha256 of its canonical JSON (regenerable from the pinned record by the class), its outcome derived
   from (truth, witness, word). RED CONTROLS of the witness itself, every run: it finds no violation on any original
   and on any TRUE mutant, and it finds one on every coefficient-plus-one mutant; a miss refuses the run. A family the
   table names but no module implements yet is listed as pending and the record is PARTIAL until every family is
   built or its exclusion recorded.

   GATES. Every input at its Phase 1 pin (the note, the register, the inventory, every family record). --check reads
   the record on disk, verifies the pins against the files now, re-derives every outcome and every total from the
   stored per-mutant fields and refuses on drift; it never re-runs. Each family module names its witness red control
   (the FALSE class the witness must always flag: tensor coefficient-plus-one, kissing row-duplicated, erdos852
   truncation-plus-one-unit) or, where no class is universally witnessable (shapes), a controls() list of items the
   witness alone must flag, run beside the row (the bar moved far past the bytes), never decided, never counted; on an original the witness must find no violation when the register says CERTIFIED and
   must find one when it says REFUTED (the erdos852 row is a refuted claim).

   usage: node tools/run-selfaudit-mutations.js                 run every built family, write certs/selfaudit-mutations.json
          node tools/run-selfaudit-mutations.js --check         verify the record on disk, write nothing (exit 1 on drift)
          node tools/run-selfaudit-mutations.js --out p --only strassen-1969      a dry run on rows whose id contains the text  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const OUT = 'certs/selfaudit-mutations.json';
const NOTE = 'notes/selfaudit-preregistration-2026-10-20.md';
const INV = 'certs/selfaudit-inventory.json';
const REGISTER = 'certs/claims-ledger.json';
const TAUS = ['1e-6', '1e-9', '1e-12'];
const MUTABLE_ROWS = 119;
/* the families of the pre-registration's class table, in its order; a module under instruments/selfaudit/<family>.js builds one */
const FAMILIES = ['tensor', 'kissing', 'shapes', 'erdos852', 'polymaps', 'countex', 'entropy', 'turan', 'horizonmath', 'gnnw', 'sumproduct'];
/* the fixes the campaign forced, with the mutants each covered by id (instruments/selfaudit/fixes.json): a covered mutant that
   now comes out as required is marked fixedFrom; per fix the record says how many are as required now and which are not */
const FIXES = 'instruments/selfaudit/fixes.json';

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const outArg = arg('--out');
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const die = (m) => { console.error('SELF-AUDIT MUTATIONS REFUSED: ' + m); process.exit(1); };
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const shaBuf = (b) => crypto.createHash('sha256').update(b).digest('hex');
const sha = (rel) => shaBuf(fs.readFileSync(path.join(ROOT, rel)));
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const log = (s) => process.stderr.write(s + '\n');
if (ONLY && !outArg) die('--only is for dry runs: give --out');

/* ---- inputs and their pins -------------------------------------------------------------------------------------- */
const INVENTORY = J(INV);
const R = J(REGISTER);
const pins = { note: INVENTORY.preregistration.sha256, register: INVENTORY.inputs.register.sha256, records: Object.fromEntries(INVENTORY.records.map((x) => [x.record, x.sha256])) };
const stale = [];
if (sha(NOTE) !== pins.note) stale.push(NOTE);
if (sha(REGISTER) !== pins.register) stale.push(REGISTER);
const built = FAMILIES.filter((f) => fs.existsSync(path.join(ROOT, 'instruments', 'selfaudit', f + '.js')));
const pending = FAMILIES.filter((f) => !built.includes(f));
const MODS = Object.fromEntries(built.map((f) => [f, require(path.join(ROOT, 'instruments', 'selfaudit', f + '.js'))]));
for (const f of built) for (const rec of MODS[f].records) { if (!(rec in pins.records)) stale.push(rec + ' (not in the inventory)'); else if (sha(rec) !== pins.records[rec]) stale.push(rec); }

/* ---- the rules shared by the run and by --check ----------------------------------------------------------------- */
const REQUIRED = { FALSE: 'REFUTED', TRUE: 'CERTIFIED', MALFORMED: 'REFUSED' };
/* a TRUE mutant by invariance preserves the ORIGINAL's status: its required word is the original's register word (a
   REPAIRED row's rigid motion is REPAIRED again); a TRUE mutant that is a true claim in its own right (erdos852's
   digits coarsened) requires CERTIFIED — the module marks the former preservesOriginal */
const requiredOf = (m, rowVerdict) => (m.truth === 'TRUE' && m.preservesOriginal ? rowVerdict : REQUIRED[m.truth]);
const outcomeOf = (truth, witnessViolated, word, required) => {
  if (truth === 'FALSE' && witnessViolated !== true) return 'DISCARDED';
  if (word === required) return 'as required';
  if (truth === 'FALSE' && word === 'CERTIFIED') return 'FALSE CERTIFICATION';
  if (truth === 'TRUE' && word === 'REFUTED') return 'FALSE REFUTATION';
  if (word === 'REFUSED') return 'refused';
  return 'not as required (' + word + ')';
};
const derive = (families) => {
  const totals = {}, all = { rows: 0, originalsAsRequired: 0, mutants: 0, excluded: 0, byTruth: {}, byOutcome: {}, falseCertifications: 0, falseRefutations: 0, refusalsOnFalse: 0, refusalsOnTrue: 0, discards: 0, malformedNotRefused: 0, rowsWithWitnessedFalse: 0, float: {} };
  const floatInit = () => Object.fromEntries(TAUS.map((t) => [t, { witnessedFalseAccepted: 0, witnessedFalse: 0, originalsAccepted: 0, originals: 0, trueAccepted: 0, trueMutants: 0 }]));
  all.float = floatInit();
  for (const [fam, F] of Object.entries(families)) {
    const t = { rows: F.rows.length, originalsAsRequired: 0, mutants: 0, excluded: 0, byTruth: {}, byOutcome: {}, falseCertifications: 0, falseRefutations: 0, refusalsOnFalse: 0, refusalsOnTrue: 0, discards: 0, malformedNotRefused: 0, rowsWithWitnessedFalse: 0, float: floatInit() };
    for (const row of F.rows) {
      if (row.noObject) { t.rowsWithoutObject = (t.rowsWithoutObject || 0) + 1; continue; }
      if (row.original.asRequired) t.originalsAsRequired++;
      for (const tau of TAUS) { t.float[tau].originals++; if (row.original.float && row.original.float.accept[tau]) t.float[tau].originalsAccepted++; }
      t.excluded += row.excluded.length;
      let witnessed = false;
      for (const m of row.mutants) {
        t.mutants++; t.byTruth[m.truth] = (t.byTruth[m.truth] || 0) + 1; t.byOutcome[m.outcome] = (t.byOutcome[m.outcome] || 0) + 1;
        if (m.outcome === 'FALSE CERTIFICATION') t.falseCertifications++;
        if (m.outcome === 'FALSE REFUTATION') t.falseRefutations++;
        if (m.outcome === 'refused' && m.truth === 'FALSE') t.refusalsOnFalse++;
        if (m.outcome === 'refused' && m.truth === 'TRUE') t.refusalsOnTrue++;
        if (m.outcome === 'DISCARDED') t.discards++;
        if (m.truth === 'MALFORMED' && m.outcome !== 'as required') t.malformedNotRefused++;
        if (m.truth === 'FALSE' && m.witness && m.witness.violated === true) { witnessed = true; for (const tau of TAUS) { t.float[tau].witnessedFalse++; if (m.float && m.float.accept[tau]) t.float[tau].witnessedFalseAccepted++; } }
        if (m.truth === 'TRUE') for (const tau of TAUS) { t.float[tau].trueMutants++; if (m.float && m.float.accept[tau]) t.float[tau].trueAccepted++; }
      }
      if (witnessed) t.rowsWithWitnessedFalse++;
    }
    for (const tau of TAUS) t.float[tau].witnessedFalseAcceptRate = t.float[tau].witnessedFalse ? Math.round(1e4 * t.float[tau].witnessedFalseAccepted / t.float[tau].witnessedFalse) / 1e4 : null;
    totals[fam] = t;
    for (const k of ['rows', 'originalsAsRequired', 'mutants', 'excluded', 'falseCertifications', 'falseRefutations', 'refusalsOnFalse', 'refusalsOnTrue', 'discards', 'malformedNotRefused', 'rowsWithWitnessedFalse']) all[k] += t[k];
    for (const [k, v] of Object.entries(t.byTruth)) all.byTruth[k] = (all.byTruth[k] || 0) + v;
    for (const [k, v] of Object.entries(t.byOutcome)) all.byOutcome[k] = (all.byOutcome[k] || 0) + v;
    for (const tau of TAUS) for (const k of ['witnessedFalseAccepted', 'witnessedFalse', 'originalsAccepted', 'originals', 'trueAccepted', 'trueMutants']) all.float[tau][k] += t.float[tau][k];
  }
  for (const tau of TAUS) all.float[tau].witnessedFalseAcceptRate = all.float[tau].witnessedFalse ? Math.round(1e4 * all.float[tau].witnessedFalseAccepted / all.float[tau].witnessedFalse) / 1e4 : null;
  const fixesIn = J(FIXES).fixes;
  const covered = new Map(); for (const f of fixesIn) for (const id of f.mutants) covered.set(id, f.id);
  const outcomes = new Map(); for (const F of Object.values(families)) for (const row of F.rows) for (const m of row.mutants || []) outcomes.set(m.id, m.outcome);
  const fixes = fixesIn.map((f) => ({ id: f.id, finding: f.finding, found: f.found, fix: f.fix, mutants: f.mutants.length,
    asRequiredNow: f.mutants.filter((id) => outcomes.get(id) === 'as required').length,
    notAsRequired: f.mutants.filter((id) => outcomes.has(id) && outcomes.get(id) !== 'as required').map((id) => ({ id, outcome: outcomes.get(id) })),
    notInThisRun: f.mutants.filter((id) => !outcomes.has(id)).length }));
  const findings = [];
  for (const [fam, F] of Object.entries(families)) {
    const groups = {};
    for (const row of F.rows) {
      if (row.noObject) continue;
      if (!row.original.asRequired) (groups['original|' + row.original.decided.verdict] = groups['original|' + row.original.decided.verdict] || { family: fam, class: 'original', truth: null, outcome: 'decided ' + row.original.decided.verdict + ' where the register says ' + row.original.required, count: 0, rows: [], example: row.original.decided.why }).count++;
      for (const m of row.mutants) {
        if (m.outcome === 'as required') continue;
        const k = m.class + '|' + m.outcome;
        const g = groups[k] = groups[k] || { family: fam, class: m.class, truth: m.truth, outcome: m.outcome, count: 0, rows: [], example: m.decided.why };
        g.count++; if (g.rows.length < 6) g.rows.push(row.rowId);
      }
    }
    for (const g of Object.values(groups)) findings.push(g);
  }
  const killSwitch = { mutableRows: MUTABLE_ROWS, half: Math.ceil(MUTABLE_ROWS / 2), rowsWithWitnessedFalse: all.rowsWithWitnessedFalse, tripped: pending.length === 0 ? all.rowsWithWitnessedFalse < Math.ceil(MUTABLE_ROWS / 2) : null, note: pending.length ? 'decided when every family is built or its exclusion recorded; the count so far is reported' : 'decided: every family built or its exclusion recorded' };
  return { totals, all, killSwitch, findings, fixes, covered };
};

/* ---- --check ------------------------------------------------------------------------------------------------------- */
if (CHECK) {
  const checkPath = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
  if (!fs.existsSync(checkPath)) die('no mutations record on disk to check: ' + checkPath);
  if (stale.length) die('an input is not at its Phase 1 pin: ' + stale.join(', '));
  const have = JSON.parse(fs.readFileSync(checkPath, 'utf8'));
  if (have.preregistration.sha256 !== pins.note) die('the record was made against another pre-registration');
  if (have.inventory.sha256 !== sha(INV)) die('the record was made against another inventory');
  for (const [rec, h] of Object.entries(have.inputs.recordPins)) if (pins.records[rec] !== h) die('the record pins another ' + rec);
  for (const [fam, F] of Object.entries(have.families)) {
    if (!built.includes(fam)) die('the record holds a family with no module: ' + fam);
    if (F.redControl !== MODS[fam].redControl) die('the witness red control of ' + fam + ' is not the module\'s');
    for (const row of F.rows) {
      if (row.noObject) { if (row.mutants.length || row.original) die('a row with no object carries mutants: ' + row.rowId); continue; }
      if (F.redControl === null && !(row.controlsFired && row.controlsFired.length) && !(row.excluded || []).some((x) => /prints no value/.test(x.reason))) die('a row of a family without a red-control class fired no witness control: ' + row.rowId);
      if (row.original.asRequired !== (row.original.decided.verdict === row.original.required)) die('an original\'s asRequired does not re-derive: ' + row.rowId);
      if (row.verdict === 'CERTIFIED' && row.original.witness && row.original.witness.violated) die('the witness found a violation on a CERTIFIED original: ' + row.rowId);
      if (row.verdict === 'REFUTED' && !(row.original.witness && row.original.witness.violated)) die('the witness found no violation on a REFUTED original: ' + row.rowId);
      for (const m of row.mutants) {
        if (m.required !== requiredOf(m, row.verdict)) die('a required word does not re-derive: ' + m.id);
        if (m.outcome !== outcomeOf(m.truth, m.witness ? m.witness.violated : null, m.decided.verdict, m.required)) die('an outcome does not re-derive: ' + m.id);
        if (m.truth === 'TRUE' && m.witness && m.witness.violated && !(m.preservesOriginal && row.verdict !== 'CERTIFIED')) die('the witness found a violation on a TRUE mutant of a CERTIFIED row: ' + m.id);
        if (m.class === F.redControl && !(m.witness && m.witness.violated)) die('the witness red control did not fire: ' + m.id);
      }
    }
  }
  if (!have.partial && pending.length) die('the record says it is whole but a family has no module: ' + pending.join(', '));
  const d = derive(have.families);
  if (JSON.stringify(d.totals) !== JSON.stringify(have.totals) || JSON.stringify(d.all) !== JSON.stringify(have.all) || JSON.stringify(d.killSwitch) !== JSON.stringify(have.killSwitch) || JSON.stringify(d.findings) !== JSON.stringify(have.findings)) die('the totals or the findings do not re-derive from the rows');
  if (!have.fixesTable || have.fixesTable.sha256 !== sha(FIXES)) die('the record was made against another fixes table');
  if (JSON.stringify(d.fixes) !== JSON.stringify(have.fixes)) die('the fixes do not re-derive from the rows');
  for (const F of Object.values(have.families)) for (const row of F.rows) for (const m of row.mutants || []) {
    const fid = d.covered.get(m.id);
    if ((m.fixedFrom !== undefined) !== (!!fid && m.outcome === 'as required')) die('fixedFrom does not re-derive: ' + m.id);
  }
  console.log('selfaudit mutations hold: ' + Object.keys(have.families).join(', ') + (have.partial ? ' (PARTIAL; pending ' + have.pending.join(', ') + ')' : '') + ' — ' + have.all.rows + ' rows, ' + have.all.mutants + ' mutants, false certifications ' + have.all.falseCertifications + ', false refutations ' + have.all.falseRefutations + ', refusals ' + (have.all.refusalsOnFalse + have.all.refusalsOnTrue) + ', discards ' + have.all.discards + ', malformed not refused ' + have.all.malformedNotRefused + ', rows with a witnessed FALSE ' + have.all.rowsWithWitnessedFalse + ' of ' + MUTABLE_ROWS);
  process.exit(0);
}

/* ---- run ------------------------------------------------------------------------------------------------------------ */
if (stale.length) die('an input is not at its Phase 1 pin: ' + stale.join(', '));
const pyv = (() => { try { return cp.execSync('python3 --version').toString().trim(); } catch (e) { return 'python3 absent'; } })();
const machine = { os: os.type() + ' ' + os.release(), cpu: (os.cpus()[0] || {}).model || 'unknown', node: process.version, python: pyv };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'selfaudit-mutations-'));
const runPy = (script, items, label) => {
  const f = path.join(tmp, label + '.json');
  fs.writeFileSync(f, JSON.stringify(items));
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, script), f], { cwd: ROOT, maxBuffer: 1 << 28 });
  if (r.status !== 0) die(script + ' failed on ' + label + ': ' + String(r.stderr).slice(-800));
  const out = JSON.parse(r.stdout.toString());
  fs.unlinkSync(f);
  return Object.fromEntries(out.map((x) => [x.id, x]));
};
const canonical = (claim) => Buffer.from(JSON.stringify(claim));
const t00 = Date.now();
const FIXED_BY = new Map(); for (const f of J(FIXES).fixes) for (const id of f.mutants) FIXED_BY.set(id, f);
const families = {};
for (const fam of built) {
  const F = MODS[fam];
  let rows = F.rows(R, J);
  if (ONLY) rows = rows.filter((r) => ONLY.some((s) => r.rowId.includes(s)));
  log(fam + ': ' + rows.length + ' rows · decider ' + F.decider.slice(0, 80) + '…');
  const outRows = [];
  for (const row of rows) {
    const t0 = Date.now();
    if (!row.entry) { outRows.push({ rowId: row.rowId, record: row.record, entryId: row.entryId, verdict: row.verdict, noObject: row.noObject, mutants: [], excluded: [], ms: 0 }); log('  ' + row.rowId.padEnd(32) + 'no object: ' + row.noObject); continue; }
    const origClaim = F.claimOf(row.entry);
    const muts = F.mutants(row.entry);
    const items = [{ id: 'original', ...origClaim, layout: row.entry.layout }].concat(muts.filter((m) => !m.excluded).map((m) => ({ id: m.class, ...m.claim, layout: row.entry.layout })));
    const ctrls = F.controls ? F.controls(row.entry).map((c) => ({ id: c.id, ...c.claim, layout: row.entry.layout })) : [];
    const wit = runPy(F.witness, items.concat(ctrls), row.rowId.replace(/[^a-z0-9-]/gi, '_') + '-w');
    for (const c of ctrls) if (!(wit[c.id] && wit[c.id].violated)) die('RED CONTROL: the witness finds no violation on ' + row.rowId + '/' + c.id);
    const flo = runPy(F.floatcheck, items, row.rowId.replace(/[^a-z0-9-]/gi, '_') + '-f');
    /* the original: decided again, the word the register's */
    const od = F.decide(row.entryId, origClaim);
    const ow = wit.original;
    if (row.verdict === 'CERTIFIED' && ow.violated) die('RED CONTROL: the witness finds a violation on the CERTIFIED original ' + row.rowId + ': ' + JSON.stringify(ow.layouts || ow.violation).slice(0, 300));
    if (row.verdict === 'REFUTED' && !ow.violated) die('RED CONTROL: the witness finds no violation on the REFUTED original ' + row.rowId);
    const original = { required: row.verdict, decided: od, asRequired: od.verdict === row.verdict, witness: { violated: ow.violated, malformed: ow.malformed }, float: (({ id, ...rest }) => rest)(flo.original), sha256: shaBuf(canonical(origClaim)) };
    const mutants = [], excluded = [];
    for (const m of muts) {
      if (m.excluded) { excluded.push({ class: m.class, reason: m.excluded }); continue; }
      const w = wit[m.class], fl = flo[m.class];
      if (m.truth === 'TRUE' && w.violated && !(m.preservesOriginal && row.verdict !== 'CERTIFIED')) die('RED CONTROL: the witness finds a violation on the TRUE mutant ' + row.rowId + '/' + m.class + ' of a CERTIFIED row: ' + JSON.stringify(w.layouts || w.violation).slice(0, 400));
      if (m.class === F.redControl && !w.violated) die('RED CONTROL: the witness finds no violation on ' + row.rowId + '/' + F.redControl);
      const d = F.decide(row.entryId + '/' + m.class, m.claim);
      const bytes = canonical(m.claim);
      const required = requiredOf(m, row.verdict);
      const mid = row.rowId + '/' + m.class;
      const fixOf = FIXED_BY.get(mid);
      const outcome = outcomeOf(m.truth, w.violated, d.verdict, required);
      mutants.push({ id: mid, class: m.class, truth: m.truth, preservesOriginal: !!m.preservesOriginal, transformation: m.transformation, sha256: shaBuf(bytes), bytes: bytes.length,
        ...(fixOf && outcome === 'as required' ? { fixedFrom: fixOf.found.outcome, fix: fixOf.id, foundAt: fixOf.found.commit } : {}),
        witness: { violated: w.violated, malformed: w.malformed, reason: w.reason || null, firstViolation: w.layouts || w.violation || null, ...(w.exact !== undefined ? { exact: w.exact } : {}), ...(w.constraintsWitnessed === false ? { constraintsWitnessed: false } : {}) },
        decided: d, required, outcome,
        float: (({ id, ...rest }) => rest)(fl) });
    }
    outRows.push({ rowId: row.rowId, record: row.record, entryId: row.entryId, verdict: row.verdict, object: F.describe(row.entry), original, mutants, excluded, controlsFired: ctrls.map((c) => c.id), ms: Date.now() - t0 });
    const bad = mutants.filter((m) => m.outcome !== 'as required' && m.outcome !== 'DISCARDED');
    log('  ' + row.rowId.padEnd(32) + (original.asRequired ? 'original ' + od.verdict : 'ORIGINAL ' + od.verdict + ' (register ' + row.verdict + ')') + ' · ' + mutants.length + ' mutants' + (excluded.length ? ', ' + excluded.length + ' excluded' : '') + ' · ' + (bad.length ? bad.map((m) => m.class + ' → ' + m.outcome).join(', ') : 'all as required' + (mutants.some((m) => m.outcome === 'DISCARDED') ? ' (' + mutants.filter((m) => m.outcome === 'DISCARDED').length + ' discarded)' : '')) + ' · ' + (Date.now() - t0) + ' ms');
  }
  families[fam] = { decider: F.decider, witness: F.witness, floatcheck: F.floatcheck, redControl: F.redControl, records: F.records, classes: F.classes, rows: outRows };
}
fs.rmSync(tmp, { recursive: true, force: true });
const d = derive(families);
const out = {
  what: 'The self-audit of cert-machine, Phase 3 — the mutation campaign (M1 and M5 of the pre-registration): for every register row of a built family, mutants derived from the row\'s pinned record entry by one named transformation of the class table, each FALSE one witnessed by a standard-library script that shares no code with the decider, each decided by the row\'s own decider and by a double-precision checker at three tolerances; outcomes derived from (truth, witness, word); every mutant pinned by the sha256 of its canonical JSON, regenerable from the pinned record by its class. Written by tools/run-selfaudit-mutations.js; --check re-derives every outcome and total from the stored fields.',
  name: 'selfaudit', phase: 3,
  generated: new Date().toISOString(), git, machine, seconds: Math.round((Date.now() - t00) / 100) / 10,
  preregistration: { path: NOTE, sha256: sha(NOTE) },
  inventory: { path: INV, sha256: sha(INV) },
  inputs: { register: { path: REGISTER, sha256: pins.register, rows: R.rows.length }, recordPins: Object.fromEntries(built.flatMap((f) => MODS[f].records).map((rec) => [rec, pins.records[rec]])) },
  required: REQUIRED, taus: TAUS,
  partial: pending.length > 0 || !!ONLY, dryRun: !!ONLY, built, pending,
  totals: d.totals, all: d.all, killSwitch: d.killSwitch, findings: d.findings, fixes: d.fixes, fixesTable: { path: FIXES, sha256: sha(FIXES) }, families
};
const dest = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
if (d.findings.length) log('FINDINGS:\n' + d.findings.map((f) => '  ' + f.family + ' · ' + f.class + ' (' + f.truth + ') → ' + f.outcome + ' × ' + f.count + ' — e.g. ' + String(f.example).slice(0, 140)).join('\n'));
log('FIXES: ' + d.fixes.map((f) => f.id + ' found ' + f.found.count + ' at ' + f.found.commit + ' → as required now ' + f.asRequiredNow + ', not ' + f.notAsRequired.length).join('; '));
log('written ' + dest + ': ' + built.join(', ') + (pending.length ? ' (PARTIAL; pending ' + pending.join(', ') + ')' : '') + ' — ' + out.all.rows + ' rows, ' + out.all.mutants + ' mutants (' + JSON.stringify(out.all.byTruth) + '), outcomes ' + JSON.stringify(out.all.byOutcome) + '; rows with a witnessed FALSE ' + out.all.rowsWithWitnessedFalse + '; float accept on witnessed FALSE ' + TAUS.map((t) => t + ': ' + out.all.float[t].witnessedFalseAcceptRate).join(', ') + '; ' + out.seconds + ' s');
