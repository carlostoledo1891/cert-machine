#!/usr/bin/env node
/* run-selfaudit.js — the self-audit of cert-machine, Phase 2: the runner → certs/selfaudit-run.json

   WHY. The pre-registration (notes/selfaudit-preregistration-2026-10-20.md, M4 "Cost and reproducibility") fixes what is
   measured per record: wall seconds, user+sys CPU seconds, peak resident set in bytes (/usr/bin/time -l), the record's
   bytes, exit status, the word, the record's sha256 after the run; two runs per record, the second "warm", reported
   separately and never averaged; reproducible = the sha256 after both runs equals the pin, or differs only in fields the
   record declares as stamps. Two profiles on this laptop: PORTABLE, one process at a time, a 60 s wall ENFORCED by this
   runner (over the cap → REFUSED: resources, the row is not covered under portable), memory 4 GiB MEASURED as peak RSS
   and reported, never enforced; EXTENDED, the same laptop, no cap. The hosted rows (the 416 kernel challenges) are
   carried in by Phase 4 and never re-run here.

   HOW. For every command of the rerun kit (corpus/rerun-kit.json: the re-derive command, the standard-library verifier,
   the second implementation where they exist), per record, in order: portable cold, portable warm, extended cold,
   extended warm — one process at a time, each under /usr/bin/time -l in its own process group; under the cap the
   runner SIGKILLs every process of the group except the timer at the cap, so the timer still prints the resources the
   command used before it was stopped. After every run: the record's sha256 and bytes; the LEAF DIFF between the pinned
   record and the re-derived one (tools/selfaudit-common.js — the same walk Phase 1 ran by hand), split into the
   declared stamp paths and the rest; when the record changed, the register rebuilt from it (tools/run-claims-ledger.js)
   and the record's rows compared (verdict | scope | kind) — the kit's own rowsMoved rule; the per-row timing the
   re-derived record carries; then EVERY tracked file the run wrote restored to its pin (git checkout) and the restore
   verified by sha256, so the pre-registration's digests hold at every step. Cold and warm are also diffed against each
   other: a record that differs between its two runs outside its stamps is the Phase 2 FINDING of the kill-switch
   table — reported, not re-run.

   GATES. Every input at its Phase 1 pin before anything runs (the note, the register, the kit, every record — the
   inventory's digests); a dirty tracked record refuses. --check reads the record on disk and refuses when its inputs
   are not the files on disk now, when a run entry is malformed, or when the totals and findings do not re-derive from
   the runs; it never re-runs (hours). --only, --cap and --profiles exist for dry runs and require --out: the record in
   certs/ is always a whole run under the pre-registered profiles.

   usage: node tools/run-selfaudit.js                       run everything, write certs/selfaudit-run.json
          node tools/run-selfaudit.js --check               verify the record on disk, write nothing (exit 1 on drift)
          node tools/run-selfaudit.js --reclassify --why "…"  re-derive the DERIVED fields of the record on disk (the stamp
                                                            classification, reproducible, the cold/warm classification,
                                                            the totals, the findings) from the raw runs under the stamp
                                                            rule in tools/selfaudit-common.js; nothing re-run, no raw
                                                            measurement touched; the record keeps a dated reclassified
                                                            entry with the reason
          node tools/run-selfaudit.js --out p --only strassen,design-table --cap 3 --profiles portable   a dry run  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');
const { recordRows, timingOf, leafDiff, isStampPath, ROOT_STAMPS, LEAF_STAMPS } = require('./selfaudit-common.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = 'certs/selfaudit-run.json';
const NOTE = 'notes/selfaudit-preregistration-2026-10-20.md';
const INV = 'certs/selfaudit-inventory.json';
const REGISTER = 'certs/claims-ledger.json';
const KITPATH = 'corpus/rerun-kit.json';
const PORTABLE_WALL_S = 60;
const MEMORY_BYTES_REPORTED = 4 * 1024 * 1024 * 1024;
const PROFILES = { portable: { wallSecondsCap: PORTABLE_WALL_S, memoryBytesReported: MEMORY_BYTES_REPORTED, enforced: 'the wall, by this runner (SIGKILL at the cap); memory measured and reported only' }, extended: { wallSecondsCap: null, memoryBytesReported: MEMORY_BYTES_REPORTED, enforced: 'nothing' } };
const RUNS = ['cold', 'warm'];

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const RECLASSIFY = argv.includes('--reclassify');
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const outArg = arg('--out');
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const CAP = arg('--cap') ? Number(arg('--cap')) : PORTABLE_WALL_S;
const PROFILE_LIST = arg('--profiles') ? arg('--profiles').split(',') : Object.keys(PROFILES);
const die = (m) => { console.error('SELF-AUDIT RUNNER REFUSED: ' + m); process.exit(1); };
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const shaBuf = (b) => crypto.createHash('sha256').update(b).digest('hex');
const sha = (rel) => shaBuf(fs.readFileSync(path.join(ROOT, rel)));
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const log = (s) => process.stderr.write(s + '\n');

if (!CHECK && !RECLASSIFY && (ONLY || CAP !== PORTABLE_WALL_S || PROFILE_LIST.join() !== Object.keys(PROFILES).join()) && !outArg) die('--only, --cap and --profiles are for dry runs: give --out');
for (const p of PROFILE_LIST) if (!(p in PROFILES)) die('unknown profile ' + p);

/* ---- inputs and their pins ------------------------------------------------------------------------------------------ */
const INVENTORY = J(INV);
const KIT = J(KITPATH);
const R = J(REGISTER);
const recOf = (s) => s.split(' ')[0];
const pins = { note: INVENTORY.preregistration.sha256, register: INVENTORY.inputs.register.sha256, kit: INVENTORY.inputs.kit.sha256, records: Object.fromEntries(INVENTORY.records.map((x) => [x.record, x.sha256])) };
const stale = [];
if (sha(NOTE) !== pins.note) stale.push(NOTE);
if (sha(REGISTER) !== pins.register) stale.push(REGISTER);
if (sha(KITPATH) !== pins.kit) stale.push(KITPATH);
for (const [rec, h] of Object.entries(pins.records)) if (sha(rec) !== h) stale.push(rec);
const kitRecords = KIT.entries.map((e) => e.record);
for (const rec of kitRecords) if (!(rec in pins.records)) stale.push(rec + ' (not in the inventory)');

/* ---- the register's rows per record, for rowsMoved and per-row timing ---------------------------------------------- */
const snapshotRows = (reg, rec) => Object.fromEntries(reg.rows.filter((r) => recOf(r.decidedFrom) === rec).map((r) => [r.id, [r.verdict, r.scope, r.kind].join(' | ')]));
const registerIds = (rec) => R.rows.filter((r) => recOf(r.decidedFrom) === rec).map((r) => r.id);

/* ---- the totals, derived from the runs (shared by the run and by --check) ------------------------------------------ */
const derive = (runs, entries) => {
  const byKey = {};
  for (const r of runs) (byKey[[r.record, r.kind, r.profile].join('|')] = byKey[[r.record, r.kind, r.profile].join('|')] || {})[r.run] = r;
  const pairs = Object.entries(byKey).map(([k, v]) => { const [record, kind, profile] = k.split('|'); return { record, kind, profile, cold: v.cold || null, warm: v.warm || null }; });
  const rowsOf = (rec) => registerIds(rec).length;
  const totals = {};
  for (const profile of Object.keys(PROFILES)) {
    const P = pairs.filter((p) => p.profile === profile);
    if (!P.length) continue;
    const rr = P.filter((p) => p.kind === 'rederive');
    const ran = (x) => x && x.verdict === 'RAN';
    const refused = (x) => x && x.verdict.startsWith('REFUSED');
    const failed = (x) => x && x.verdict.startsWith('FAILED');
    const covered = rr.filter((p) => ran(p.cold) && ran(p.warm));
    const refusedRecs = rr.filter((p) => refused(p.cold) || refused(p.warm));
    const failedRecs = rr.filter((p) => failed(p.cold) || failed(p.warm));
    const reproducible = rr.filter((p) => ran(p.cold) && ran(p.warm) && p.cold.reproducible && p.warm.reproducible && p.cold.coldWarmNonStampPaths && p.cold.coldWarmNonStampPaths.length === 0);
    const R_ = runs.filter((r) => r.profile === profile);
    const sum = (xs, f) => Math.round(xs.reduce((a, x) => a + (f(x) || 0), 0) * 100) / 100;
    totals[profile] = {
      commands: R_.length / RUNS.length, runs: R_.length,
      byVerdict: R_.reduce((a, r) => { const w = r.verdict.split(':')[0]; a[w] = (a[w] || 0) + 1; return a; }, {}),
      recordsRederived: rr.length,
      recordsCovered: covered.map((p) => p.record), rowsCovered: covered.reduce((a, p) => a + rowsOf(p.record), 0),
      recordsRefused: refusedRecs.map((p) => ({ record: p.record, cold: p.cold && p.cold.verdict, warm: p.warm && p.warm.verdict, rows: rowsOf(p.record) })),
      rowsRefused: refusedRecs.reduce((a, p) => a + rowsOf(p.record), 0),
      recordsFailed: failedRecs.map((p) => p.record),
      recordsReproducible: reproducible.map((p) => p.record), rowsReproducible: reproducible.reduce((a, p) => a + rowsOf(p.record), 0),
      recordsNotReproducible: covered.filter((p) => !reproducible.includes(p)).map((p) => p.record),
      verifiersRan: P.filter((p) => p.kind === 'verifier' && ran(p.cold) && ran(p.warm)).map((p) => p.record),
      verifiersRefused: P.filter((p) => p.kind === 'verifier' && (refused(p.cold) || refused(p.warm))).map((p) => p.record),
      secondsRan: P.filter((p) => p.kind === 'second' && ran(p.cold) && ran(p.warm)).map((p) => p.record),
      secondsRefused: P.filter((p) => p.kind === 'second' && (refused(p.cold) || refused(p.warm))).map((p) => p.record),
      wallSecondsCold: sum(R_.filter((r) => r.run === 'cold'), (r) => r.wallSeconds), wallSecondsWarm: sum(R_.filter((r) => r.run === 'warm'), (r) => r.wallSeconds),
      cpuSecondsCold: sum(R_.filter((r) => r.run === 'cold'), (r) => r.cpuSeconds), cpuSecondsWarm: sum(R_.filter((r) => r.run === 'warm'), (r) => r.cpuSeconds),
      peakRssBytesMax: Math.max(0, ...R_.map((r) => r.peakRssBytes || 0)),
      peakRssOverReported: R_.filter((r) => r.peakRssBytes > MEMORY_BYTES_REPORTED).map((r) => ({ record: r.record, kind: r.kind, run: r.run, peakRssBytes: r.peakRssBytes })),
      rowsMoved: R_.filter((r) => r.rowsMoved && r.rowsMoved.length).map((r) => ({ record: r.record, run: r.run, rows: r.rowsMoved }))
    };
  }
  const findings = [];
  for (const p of pairs) {
    for (const r of [p.cold, p.warm]) {
      if (!r) continue;
      if (r.nonStampPaths && r.nonStampPaths.length) findings.push({ kind: 'differs from the pin outside the declared stamps', record: p.record, command: p.kind, profile: p.profile, run: r.run, paths: r.nonStampPaths });
      if (r.rowsMoved && r.rowsMoved.length) findings.push({ kind: 'a register row moved', record: p.record, command: p.kind, profile: p.profile, run: r.run, rows: r.rowsMoved });
      if (r.verdict.startsWith('FAILED')) findings.push({ kind: 'the command failed', record: p.record, command: p.kind, profile: p.profile, run: r.run, exit: r.exit, stderrTail: r.stderrTail });
      for (const s of r.sideEffects || []) if (s.nonStampPaths === null || s.nonStampPaths.length) findings.push({ kind: 'a tracked file outside the record written, outside the declared stamps', record: p.record, command: p.kind, profile: p.profile, run: r.run, path: s.path, paths: s.nonStampPaths });
      if (r.untrackedCreated && r.untrackedCreated.length) findings.push({ kind: 'untracked files created', record: p.record, command: p.kind, profile: p.profile, run: r.run, paths: r.untrackedCreated });
    }
    if (p.cold && p.cold.coldWarmNonStampPaths && p.cold.coldWarmNonStampPaths.length) findings.push({ kind: 'KILL SWITCH: the record differs between the two runs outside the declared stamps', record: p.record, command: p.kind, profile: p.profile, paths: p.cold.coldWarmNonStampPaths });
  }
  const expectedPairs = entries.reduce((a, e) => a + ['rederive', 'verifier', 'second'].filter((k) => e[k]).length, 0) * Object.keys(PROFILES).length;
  return { totals, findings, pairs: pairs.length, expectedPairs };
};

/* ---- --reclassify: the derived fields from the raw runs, under the rule in code ----------------------------------------- */
const STAMPS_FIELD = { root: [...ROOT_STAMPS], leaf: [...LEAF_STAMPS], rule: 'a differing path is a stamp when it is one of the root keys at the root, or a leaf keyed by one of the leaf keys (the root included); everything else is reported' };
if (RECLASSIFY) {
  const why = arg('--why');
  if (!why) die('--reclassify needs --why "…"');
  const recPath = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
  if (!fs.existsSync(recPath)) die('no run record on disk to reclassify: ' + recPath);
  if (stale.length) die('an input is not at its Phase 1 pin: ' + stale.join(', '));
  const have = JSON.parse(fs.readFileSync(recPath, 'utf8'));
  const recls = (paths) => (paths ? { stampPaths: paths.filter(isStampPath), nonStampPaths: paths.filter((p) => !isStampPath(p)) } : { stampPaths: null, nonStampPaths: null });
  for (const r of have.runs) {
    Object.assign(r, recls(r.diffPaths));
    r.reproducible = r.verdict === 'RAN' ? r.nonStampPaths.length === 0 && r.rowsMoved.length === 0 : null;
    const cw = recls(r.coldWarmDiffPaths); r.coldWarmStampPaths = cw.stampPaths; r.coldWarmNonStampPaths = cw.nonStampPaths;
    for (const s of r.sideEffects || []) Object.assign(s, recls(s.diffPaths));
  }
  const d = derive(have.runs, KIT.entries);
  have.totals = d.totals; have.findings = d.findings; have.stamps = STAMPS_FIELD;
  have.reclassified = (have.reclassified || []).concat([{ at: new Date().toISOString(), git, why }]);
  fs.writeFileSync(recPath, JSON.stringify(have, null, 1) + '\n');
  const t = have.totals;
  log('reclassified ' + recPath + ': ' + have.runs.length + ' runs; portable covered ' + t.portable.recordsCovered.length + ' / ' + t.portable.rowsCovered + ' rows, reproducible ' + t.portable.recordsReproducible.length + '; extended covered ' + t.extended.recordsCovered.length + ', reproducible ' + t.extended.recordsReproducible.length + '; findings ' + d.findings.length);
  if (d.findings.length) log('FINDINGS:\n' + d.findings.map((f) => '  ' + JSON.stringify(f)).join('\n'));
  process.exit(0);
}

/* ---- --check: the record on disk against the world now, and against itself ------------------------------------------ */
if (CHECK) {
  const checkPath = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
  if (!fs.existsSync(checkPath)) die('no run record on disk to check: ' + checkPath);
  const have = JSON.parse(fs.readFileSync(checkPath, 'utf8'));
  if (stale.length) die('an input is not at its Phase 1 pin: ' + stale.join(', '));
  if (have.preregistration.sha256 !== pins.note) die('the run record was made against another pre-registration');
  if (have.inventory.sha256 !== sha(INV)) die('the run record was made against another inventory');
  if (have.inputs.register.sha256 !== pins.register || have.inputs.kit.sha256 !== pins.kit) die('the run record was made against another register or kit');
  for (const [rec, h] of Object.entries(have.inputs.recordPins)) if (pins.records[rec] !== h) die('the run record pins another ' + rec);
  if (have.partial && !outArg) die('the run record is partial');
  const FIELDS = ['seq', 'record', 'kind', 'command', 'profile', 'run', 'startedAt', 'wallSeconds', 'cpuSeconds', 'peakRssBytes', 'exit', 'verdict', 'pinSha256', 'sha256After', 'bytesAfter', 'diffPaths', 'stampPaths', 'nonStampPaths', 'reproducible', 'rowsMoved'];
  for (const r of have.runs) for (const f of FIELDS) if (!(f in r)) die('a run entry lacks ' + f + ': ' + r.record + ' ' + r.kind + ' ' + r.profile + ' ' + r.run);
  for (const r of have.runs) if (r.verdict === 'RAN' && r.exit.code !== 0) die('a RAN entry with a non-zero exit: ' + r.record);
  for (const r of have.runs) if (r.profile === 'portable' && r.verdict === 'RAN' && r.wallSeconds > PORTABLE_WALL_S) die('a portable RAN over the cap: ' + r.record + ' ' + r.wallSeconds + ' s');
  for (const r of have.runs) if (r.profile === 'portable' && r.verdict.startsWith('REFUSED') && !r.exit.killedByRunner) die('a portable REFUSED the runner did not kill: ' + r.record);
  for (const r of have.runs) if (r.profile === 'extended' && r.verdict.startsWith('REFUSED')) die('an extended run REFUSED: ' + r.record);
  for (const r of have.runs) { const stamps = r.diffPaths.filter(isStampPath), rest = r.diffPaths.filter((p) => !isStampPath(p)); if (stamps.join() !== r.stampPaths.join() || rest.join() !== r.nonStampPaths.join()) die('a diff classification does not re-derive: ' + r.record); }
  for (const r of have.runs) if (r.verdict === 'RAN' && r.reproducible !== (r.nonStampPaths.length === 0 && r.rowsMoved.length === 0)) die('reproducible does not re-derive: ' + r.record + ' ' + r.profile + ' ' + r.run);
  const d = derive(have.runs, KIT.entries);
  if (!have.partial && d.pairs !== d.expectedPairs) die('the run record holds ' + d.pairs + ' command×profile pairs, the kit and the profiles give ' + d.expectedPairs);
  if (JSON.stringify(d.totals) !== JSON.stringify(have.totals)) die('the totals do not re-derive from the runs');
  if (JSON.stringify(d.findings) !== JSON.stringify(have.findings)) die('the findings do not re-derive from the runs');
  const t = have.totals;
  console.log('selfaudit run holds: ' + have.runs.length + ' runs; portable covered ' + t.portable.recordsCovered.length + ' records / ' + t.portable.rowsCovered + ' rows, refused ' + t.portable.recordsRefused.length + ' / ' + t.portable.rowsRefused + ' rows; extended covered '
    + t.extended.recordsCovered.length + ', reproducible ' + t.extended.recordsReproducible.length + '; findings ' + have.findings.length);
  process.exit(0);
}

/* ---- run ------------------------------------------------------------------------------------------------------------- */
if (stale.length) die('an input is not at its Phase 1 pin (git checkout it, or regenerate the inventory on purpose): ' + stale.join(', '));
const porcelain = () => cp.execSync('git status --porcelain --untracked-files=all', { cwd: ROOT }).toString().split('\n').filter(Boolean).map((l) => ({ status: l.slice(0, 2), path: l.slice(3).trim() }));
const baseline = porcelain();
const baselineModified = new Set(baseline.filter((x) => x.status !== '??').map((x) => x.path));
const baselineUntracked = new Set(baseline.filter((x) => x.status === '??').map((x) => x.path));
for (const rec of kitRecords) if (baselineModified.has(rec)) die('a record is modified in the working tree: ' + rec);
const headBytes = (p) => { const r = cp.spawnSync('git', ['show', 'HEAD:' + p], { cwd: ROOT, maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const power = () => { try { const b = cp.execSync('pmset -g batt').toString(); const m = b.match(/(\d+)%/); return (b.includes('AC Power') ? 'AC' : 'battery') + (m ? ' ' + m[1] + '%' : ''); } catch (e) { return 'unknown'; } };
const pyv = (() => { try { return cp.execSync('python3 --version').toString().trim(); } catch (e) { return 'python3 absent'; } })();
const machine = { os: os.type() + ' ' + os.release(), cpu: (os.cpus()[0] || {}).model || 'unknown', cores: os.cpus().length, memoryBytes: os.totalmem(), node: process.version, python: pyv, powerAtStart: power(), loadAtStart: os.loadavg()[0] };

const groupMembers = (leader) => cp.execSync('ps -axo pid,pgid').toString().split('\n').slice(1).map((l) => l.trim().split(/\s+/)).filter((f) => f.length === 2 && f[1] === String(leader) && f[0] !== String(leader)).map((f) => +f[0]);
const killGroupExcept = (leader) => {
  let killed = 0;
  for (let i = 0; i < 5; i++) {
    const m = groupMembers(leader);
    if (!m.length) break;
    for (const pid of m) { try { process.kill(pid, 'SIGKILL'); killed++; } catch (e) { /* gone */ } }
    cp.execSync('sleep 0.2');
  }
  return killed;
};
const sweepGroup = (leader) => { let n = 0; for (const pid of groupMembers(leader)) { try { process.kill(pid, 'SIGKILL'); n++; } catch (e) { /* gone */ } } return n; };

const execTimed = (cmd, capSeconds) => new Promise((resolve) => {
  const t0 = process.hrtime.bigint();
  const child = cp.spawn('/usr/bin/time', ['-l', 'sh', '-c', cmd], { cwd: ROOT, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  const tail = (s) => (s.length > 4000 ? s.slice(-4000) : s);
  child.stdout.on('data', (d) => { out = tail(out + d); });
  child.stderr.on('data', (d) => { err = tail(err + d); });
  let killedByRunner = false, killedProcesses = 0;
  const timer = capSeconds ? setTimeout(() => { killedByRunner = true; killedProcesses = killGroupExcept(child.pid); }, capSeconds * 1000) : null;
  child.on('close', (code, signal) => {
    if (timer) clearTimeout(timer);
    const wallSeconds = Number(process.hrtime.bigint() - t0) / 1e9;
    const orphans = sweepGroup(child.pid);
    const m = err.match(/^\s*([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/m);
    const rss = err.match(/(\d+)\s+maximum resident set size/);
    const abnormal = /command terminated abnormally/.test(err);
    const timeOut = err.replace(/^\s*[\d.]+ real[\s\S]*$/m, '').replace(/time: (command terminated abnormally|signal: [^\n]*)\n?/g, '');
    resolve({ wallSeconds: Math.round(wallSeconds * 1000) / 1000, realSeconds: m ? +m[1] : null, userSeconds: m ? +m[2] : null, sysSeconds: m ? +m[3] : null, cpuSeconds: m ? Math.round((+m[2] + +m[3]) * 100) / 100 : null, peakRssBytes: rss ? +rss[1] : null,
      exit: { code, signal, killedByRunner, killedProcesses, orphansKilled: orphans, abnormal }, stdoutTail: tail(out).slice(-600), stderrTail: timeOut.trim().slice(-1500) });
  });
});

const parse = (buf) => { try { return JSON.parse(buf.toString('utf8')); } catch (e) { return null; } };
const classify = (pinDoc, newDoc) => {
  if (!pinDoc || !newDoc) return { diffPaths: null, stampPaths: null, nonStampPaths: null };
  const diffPaths = [...leafDiff(pinDoc, newDoc)].sort();
  return { diffPaths, stampPaths: diffPaths.filter(isStampPath), nonStampPaths: diffPaths.filter((p) => !isStampPath(p)) };
};

const main = async () => {
  const runs = [];
  const rederived = {}; // record|kind|profile → { cold: doc, warm: doc } for the cold-vs-warm diff
  let seq = 0;
  const entries = KIT.entries.filter((e) => !ONLY || ONLY.some((s) => e.record.includes(s)));
  const commands = [];
  for (const e of entries) for (const kind of ['rederive', 'verifier', 'second']) if (e[kind]) commands.push({ record: e.record, kind, command: e[kind] });
  log('selfaudit runner: ' + commands.length + ' commands × ' + PROFILE_LIST.length + ' profiles × ' + RUNS.length + ' runs; portable cap ' + CAP + ' s; ' + machine.powerAtStart + '; load ' + machine.loadAtStart.toFixed(2));
  for (const c of commands) {
    const pinBuf = fs.readFileSync(path.join(ROOT, c.record));
    const pinDoc = parse(pinBuf);
    const pinSha = shaBuf(pinBuf);
    const pinRows = snapshotRows(R, c.record);
    const ids = registerIds(c.record);
    const writes = c.kind === 'rederive' && !/--check\b/.test(c.command);
    for (const profile of PROFILE_LIST) {
      const cap = profile === 'portable' ? CAP : null;
      for (const run of RUNS) {
        seq++;
        const startedAt = new Date().toISOString();
        const load = os.loadavg()[0];
        const pw = power();
        log('  [' + seq + '] ' + c.record + ' · ' + c.kind + ' · ' + profile + ' ' + run + (cap ? ' (cap ' + cap + ' s)' : '') + ' … ');
        const t = await execTimed(c.command, cap);
        /* what the command wrote (before the runner's own register rebuild below) */
        const now = porcelain();
        const wrote = now.filter((x) => x.status !== '??' && !baselineModified.has(x.path)).map((x) => x.path);
        const untrackedCreated = now.filter((x) => x.status === '??' && !baselineUntracked.has(x.path)).map((x) => x.path);
        const sideEffects = [];
        for (const p of wrote) {
          if (p === c.record) continue;
          const hb = headBytes(p); const nb = fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p)) : null;
          const hd = hb && parse(hb), nd = nb && parse(nb);
          const sc = hd && nd ? classify(hd, nd) : { diffPaths: null, stampPaths: null, nonStampPaths: null };
          sideEffects.push({ path: p, sha256After: nb ? shaBuf(nb) : null, ...sc });
        }
        /* the record after the run */
        const afterBuf = fs.existsSync(path.join(ROOT, c.record)) ? fs.readFileSync(path.join(ROOT, c.record)) : Buffer.alloc(0);
        const sha256After = shaBuf(afterBuf);
        const changed = sha256After !== pinSha;
        const afterDoc = changed ? parse(afterBuf) : pinDoc;
        const verdict = t.exit.killedByRunner ? 'REFUSED: resources (wall over ' + cap + ' s under portable)' : t.exit.code === 0 && !t.exit.abnormal ? 'RAN' : 'FAILED: exit ' + t.exit.code + (t.exit.signal ? ' ' + t.exit.signal : '') + (t.exit.abnormal ? ' (terminated abnormally)' : '');
        const cls = changed ? classify(pinDoc, afterDoc) : { diffPaths: [], stampPaths: [], nonStampPaths: [] };
        /* the word: the register rebuilt from the re-derived record, its rows compared (the kit's rowsMoved rule) */
        let rowsMoved = [], registerRebuiltSeconds = null, verdicts = null;
        if (changed && verdict === 'RAN' && afterDoc) {
          const t1 = Date.now();
          const rl = cp.spawnSync('node', ['tools/run-claims-ledger.js'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
          registerRebuiltSeconds = Math.round((Date.now() - t1) / 100) / 10;
          if (rl.status !== 0) rowsMoved = ['<the register would not rebuild: ' + String(rl.stderr).trim().slice(-300) + '>'];
          else { const R2 = J(REGISTER); const after = snapshotRows(R2, c.record); rowsMoved = ids.filter((id) => pinRows[id] !== after[id]); }
        }
        if (afterDoc && verdict === 'RAN') { const rows = recordRows(afterDoc); verdicts = {}; for (const id of ids) { const x = rows.find((r) => typeof r.id === 'string' && (id === r.id.replace(/\//g, '-') || id.endsWith('-' + r.id.replace(/\//g, '-')))); if (x && x.verdict) verdicts[x.verdict] = (verdicts[x.verdict] || 0) + 1; } }
        /* per-row timing the re-derived record carries */
        let perRow = null;
        if (writes && verdict === 'RAN' && afterDoc) { const rows = recordRows(afterDoc); const pr = {}; for (const id of ids) { const tm = timingOf(rows, id); if (tm.ms !== null) pr[id] = tm; } if (Object.keys(pr).length) perRow = pr; }
        /* everything the run wrote, and the register the runner rebuilt, restored to the pins */
        const toRestore = registerRebuiltSeconds !== null && !wrote.includes(REGISTER) ? wrote.concat([REGISTER]) : wrote;
        if (toRestore.length) cp.execSync('git checkout -- ' + toRestore.map((p) => JSON.stringify(p)).join(' '), { cwd: ROOT });
        for (const p of wrote) if (p in pins.records && sha(p) !== pins.records[p]) die('restore failed: ' + p + ' is not at its pin after git checkout');
        if (sha(REGISTER) !== pins.register) die('restore failed: the register is not at its pin');
        const entry = {
          seq, record: c.record, kind: c.kind, command: c.command, profile, run, startedAt, loadAtStart: Math.round(load * 100) / 100, power: pw,
          wallSeconds: t.wallSeconds, realSeconds: t.realSeconds, userSeconds: t.userSeconds, sysSeconds: t.sysSeconds, cpuSeconds: t.cpuSeconds, peakRssBytes: t.peakRssBytes,
          overMemoryReported: t.peakRssBytes !== null ? t.peakRssBytes > MEMORY_BYTES_REPORTED : null,
          exit: t.exit, verdict, writes, pinSha256: pinSha, pinBytes: pinBuf.length, sha256After, bytesAfter: afterBuf.length, changed,
          ...cls, rowsMoved, registerRebuiltSeconds, verdicts, perRow,
          reproducible: verdict === 'RAN' ? cls.nonStampPaths.length === 0 && rowsMoved.length === 0 : null,
          coldWarmDiffPaths: null, coldWarmStampPaths: null, coldWarmNonStampPaths: null,
          wrote, untrackedCreated, sideEffects, stdoutTail: t.stdoutTail, stderrTail: verdict === 'RAN' ? null : t.stderrTail
        };
        const key = [c.record, c.kind, profile].join('|');
        (rederived[key] = rederived[key] || {})[run] = verdict === 'RAN' ? afterDoc : null;
        if (run === 'warm') {
          const cold = runs.find((r) => r.record === c.record && r.kind === c.kind && r.profile === profile && r.run === 'cold');
          const a = rederived[key].cold, b = rederived[key].warm;
          if (cold && a && b) { const d = classify(a, b); cold.coldWarmDiffPaths = d.diffPaths; cold.coldWarmStampPaths = d.stampPaths; cold.coldWarmNonStampPaths = d.nonStampPaths; }
          else if (cold) { cold.coldWarmDiffPaths = null; cold.coldWarmStampPaths = null; cold.coldWarmNonStampPaths = null; }
        }
        runs.push(entry);
        log('      ' + verdict + ' · wall ' + t.wallSeconds + ' s · cpu ' + t.cpuSeconds + ' s · rss ' + (t.peakRssBytes === null ? '?' : Math.round(t.peakRssBytes / 1048576) + ' MiB') + (changed ? ' · changed: stamps ' + (cls.stampPaths || []).length + ', other ' + (cls.nonStampPaths || []).length : ' · unchanged') + (rowsMoved.length ? ' · ROWS MOVED ' + rowsMoved.length : '') + (wrote.length > 1 ? ' · also wrote ' + wrote.filter((p) => p !== c.record).join(', ') : ''));
        log('      ' + JSON.stringify({ seq, record: c.record, kind: c.kind, profile, run, verdict, wall: t.wallSeconds, cpu: t.cpuSeconds, rss: t.peakRssBytes, sha256After, stamps: cls.stampPaths, other: cls.nonStampPaths, rowsMoved, wrote, exit: t.exit }));
      }
    }
  }
  const d = derive(runs, entries);
  const out = {
    what: 'The self-audit of cert-machine, Phase 2 — the runner: every command of the rerun kit run on this laptop under /usr/bin/time -l, one process at a time, under two profiles (PORTABLE: a 60 s wall enforced by the runner, over the cap REFUSED: resources; EXTENDED: no cap), twice each (cold, then warm — reported separately, never averaged): wall seconds, user+sys CPU seconds, peak resident set in bytes, the record\'s bytes, the exit, the word (the register rebuilt from the re-derived record and its rows compared: the kit\'s rowsMoved rule), the sha256 after, the leaf diff between the pinned record and the re-derived one split into the declared stamps and the rest, the per-row timing the record carries, cold diffed against warm; every tracked file a run wrote restored to its pin and the restore verified. Reproducible = differs from the pin only at the declared stamps and moves no row. Written by tools/run-selfaudit.js; --check verifies the record against the files on disk and re-derives the totals and findings from the runs.',
    name: 'selfaudit', phase: 2,
    generated: new Date().toISOString(), git,
    preregistration: { path: NOTE, sha256: sha(NOTE) },
    inventory: { path: INV, sha256: sha(INV) },
    inputs: { register: { path: REGISTER, sha256: pins.register, rows: R.rows.length }, kit: { path: KITPATH, sha256: pins.kit, entries: KIT.entries.length }, recordPins: pins.records },
    machine, profiles: PROFILES, portableCapSecondsUsed: CAP, profilesRun: PROFILE_LIST, partial: !!ONLY,
    order: 'per command of the kit (the re-derive command, then the verifier, then the second implementation where they exist): portable cold, portable warm, extended cold, extended warm; one process at a time; cold = the first run under that profile in this session (the extended pass follows the portable pass of the same command, so its cold run finds the page cache the portable pass left)',
    stamps: STAMPS_FIELD,
    killSwitch: 'a record whose re-derived bytes differ between the cold and the warm run outside the declared stamps is a FINDING, reported here, not re-run',
    totals: d.totals, findings: d.findings, runs
  };
  const dest = outArg ? path.resolve(outArg) : path.join(ROOT, OUT);
  fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
  const t = d.totals;
  log('written ' + dest + ': ' + runs.length + ' runs' + (t.portable ? '; portable covered ' + t.portable.recordsCovered.length + ' records / ' + t.portable.rowsCovered + ' rows, refused ' + t.portable.recordsRefused.length + ' / ' + t.portable.rowsRefused + ' rows' : '') + (t.extended ? '; extended covered ' + t.extended.recordsCovered.length + ', reproducible ' + t.extended.recordsReproducible.length : '') + '; findings ' + d.findings.length);
  if (d.findings.length) log('FINDINGS:\n' + d.findings.map((f) => '  ' + JSON.stringify(f)).join('\n'));
};
main().catch((e) => die(e.stack || String(e)));
