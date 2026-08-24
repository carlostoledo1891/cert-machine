/* detach.js — THE STANDARD DETACH (machine upgrades M1 + M6, 2026-08-20).
   ENGINE TOOLING — research/_engine/detach · ships nowhere · mints nothing.

   EXTRACTED FROM FOUR HAND-ROLLED COPIES IN ONE DAY (process retro §2d):
   chowla box4.js (harness kill at ~13:55 −03 took the PIDs; the checkpoint
   held; relaunched nohup+disown with a one-line fix so resumed runs carry
   prior elapsed time forward), erdos sweep-a6.js, erdos sweep-b-fullrange.py
   ("DO NOT KILL" handoff), and the funnel's own kill-and-resume battery item.
   Plus the HANDOFF_FINISH guard: NEVER run while alive — concurrent writers
   race on shared files (best.json). Four bespoke implementations of the same
   survival pattern is a library asking to exist; this is it.

   WHAT IT DOES
     start <name> -- <cmd ...>   spawn fully detached (survives the parent and
                                 the harness), stdout+stderr appended to
                                 detach-<name>.log, lock written, REFUSED by
                                 named reason if the name is already alive.
                                 A stale lock (dead pid) is taken over, noted.
     status <name>               RUNNING <pid> (exit 0) · NOT-RUNNING (exit 1)
                                 · NO-LOCK (exit 1)
     watch <name> [--until-exists <file>] [--interval-ms N]
                                 M6: monitor, don't poll — ONE process blocks
                                 on cheap liveness checks instead of an agent
                                 re-reading logs on a timer; when the process
                                 exits (or the file appears) the WATCH BURN
                                 lands on disk as a provenanced ops-log line
                                 (metric watchSeconds), so the retro's "~200K
                                 tokens of idle polling, no on-disk record"
                                 cannot recur.
     stop <name>                 SIGTERM the pid in this tool's OWN lock only.

   Ops lines go to ops-log.jsonl via the machine's stats.js memoAppend — the
   burn record carries {seed, runId, generator, metric(+definition)} at write,
   per PROBES.md machine rule 3. Ops records carry wall-clock ISO times: they
   are operational history, not certified computation records.

   For SCRIPTS (require this module): makeElapsedCarrier(priorMs) — the box4
   fix, extracted: elapsedMs() returns prior + (now - construction), so a
   resumed run's clock carries what the killed run already spent. */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const stats = require(path.join(__dirname, '..', 'funnel', 'stats.js'));

const OPS_METRICS = {
  detachStart: 'a detached process was launched (value 1 per launch); the lock file names its pid and command',
  detachStop: 'a detached process was SIGTERMed by this tool (value 1 per stop)',
  detachTakeover: 'a stale lock (dead pid) was taken over by a new start (value 1 per takeover)',
  watchSeconds: 'wall-clock seconds one watcher spent monitoring a detached process — the polling burn, landed on disk (M6)'
};

function lockPath(dir, name) { return path.join(dir, 'detach-' + name + '.lock.json'); }
function logPath(dir, name) { return path.join(dir, 'detach-' + name + '.log'); }
function opsPath(dir) { return path.join(dir, 'ops-log.jsonl'); }

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function opsLine(dir, name, runId, metric, value, extra) {
  const rec = Object.assign({
    seed: name, runId, generator: 'detach',
    metric, value, ts: new Date().toISOString()
  }, extra || {});
  if (!(metric in OPS_METRICS)) throw new Error('detach: unknown ops metric ' + metric);
  rec.metricDefinition = OPS_METRICS[metric]; /* attached every line: cheap, and first-use-safe */
  stats.memoAppend(opsPath(dir), rec);
}

function readLock(dir, name) {
  const p = lockPath(dir, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function start(dir, name, cmd, args) {
  const existing = readLock(dir, name);
  if (existing && isAlive(existing.pid)) {
    return { refused: 'ALREADY-RUNNING', pid: existing.pid,
      why: 'lock ' + path.basename(lockPath(dir, name)) + ' names live pid ' + existing.pid
        + ' — never run while alive; concurrent writers race on shared files' };
  }
  const startedIso = new Date().toISOString();
  const runId = name + '@' + startedIso;
  if (existing) opsLine(dir, name, runId, 'detachTakeover', 1, { stalePid: existing.pid });
  const logFd = fs.openSync(logPath(dir, name), 'a');
  const child = spawn(cmd, args, { detached: true, stdio: ['ignore', logFd, logFd], cwd: dir });
  fs.closeSync(logFd);
  child.unref();
  fs.writeFileSync(lockPath(dir, name), JSON.stringify({
    name, pid: child.pid, cmd: [cmd].concat(args).join(' '), startedIso, runId
  }, null, 2) + '\n');
  opsLine(dir, name, runId, 'detachStart', 1, { pid: child.pid });
  return { pid: child.pid, runId, takeover: !!existing };
}

function status(dir, name) {
  const lock = readLock(dir, name);
  if (!lock) return { state: 'NO-LOCK' };
  return isAlive(lock.pid) ? { state: 'RUNNING', pid: lock.pid, lock } : { state: 'NOT-RUNNING', pid: lock.pid, lock };
}

function stop(dir, name) {
  const lock = readLock(dir, name);
  if (!lock) return { refused: 'NO-LOCK' };
  if (!isAlive(lock.pid)) return { refused: 'NOT-RUNNING', pid: lock.pid };
  process.kill(lock.pid, 'SIGTERM');
  opsLine(dir, name, lock.runId || name, 'detachStop', 1, { pid: lock.pid });
  return { stopped: lock.pid };
}

async function watch(dir, name, opts) {
  const o = opts || {};
  const intervalMs = o.intervalMs || 2000;
  const t0 = Date.now();
  const lock = readLock(dir, name);
  if (!lock) return { outcome: 'NO-LOCK', watchedSeconds: 0 };
  let outcome = 'EXITED';
  for (;;) {
    if (o.untilExists && fs.existsSync(path.join(dir, o.untilExists))) { outcome = 'CONDITION-FILE'; break; }
    if (!isAlive(lock.pid)) { outcome = 'EXITED'; break; }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  const watchedSeconds = Math.round((Date.now() - t0) / 1000);
  opsLine(dir, name, lock.runId || name, 'watchSeconds', watchedSeconds, { outcome, pid: lock.pid });
  return { outcome, watchedSeconds, pid: lock.pid };
}

/* the box4 fix, extracted: a resumed run's clock carries the killed run's spend */
function makeElapsedCarrier(priorMs) {
  const base = Number(priorMs) || 0;
  const t0 = Date.now();
  return { elapsedMs: () => base + (Date.now() - t0), priorMs: base };
}

module.exports = { start, status, stop, watch, makeElapsedCarrier, isAlive, readLock, OPS_METRICS };

/* ---------------- CLI ---------------- */
if (require.main === module) {
  const argv = process.argv.slice(2);
  const sub = argv[0];
  const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
  const dir = path.resolve(flag('--dir', '.'));
  const name = argv[1];
  const usage = 'usage: node detach.js start <name> [--dir D] -- <cmd ...> | status <name> | watch <name> [--until-exists F] [--interval-ms N] | stop <name>';
  if (!sub || !name) { console.log(usage); process.exit(2); }
  if (sub === 'start') {
    const dd = argv.indexOf('--');
    if (dd < 0 || dd === argv.length - 1) { console.error('start: command after -- is required'); process.exit(2); }
    const r = start(dir, name, argv[dd + 1], argv.slice(dd + 2));
    if (r.refused) { console.error('REFUSED ' + r.refused + ': ' + r.why); process.exit(1); }
    console.log('DETACHED ' + name + ' pid=' + r.pid + (r.takeover ? ' (stale lock taken over)' : '') + ' log=' + path.basename(logPath(dir, name)));
    process.exit(0);
  }
  if (sub === 'status') {
    const s = status(dir, name);
    console.log(s.state + (s.pid ? ' pid=' + s.pid : ''));
    process.exit(s.state === 'RUNNING' ? 0 : 1);
  }
  if (sub === 'stop') {
    const r = stop(dir, name);
    if (r.refused) { console.error('REFUSED ' + r.refused); process.exit(1); }
    console.log('STOPPED pid=' + r.stopped);
    process.exit(0);
  }
  if (sub === 'watch') {
    watch(dir, name, { untilExists: flag('--until-exists', null), intervalMs: Number(flag('--interval-ms', 2000)) })
      .then(r => { console.log('WATCH ' + r.outcome + ' after ' + r.watchedSeconds + 's'); process.exit(0); });
    return;
  }
  console.log(usage); process.exit(2);
}
