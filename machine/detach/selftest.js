/* selftest.js — the detach library's own battery (M1 + M6).
   ENGINE SELFTEST — ships nowhere, mints nothing. Red directions demonstrated:
   start-while-alive REFUSED, stale lock taken over with a note, the watch burn
   landing on disk as a provenanced line. Stdout deterministic (no pids, no
   timings in the PASS lines). */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const D = require(path.join(__dirname, 'detach.js'));
const stats = require(path.join(__dirname, '..', 'funnel', 'stats.js'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'detach-test-'));
let pass = 0, fails = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('PASS  ' + msg); }
  else { fails++; console.log('FAIL  ' + msg); }
}

async function main() {
  const NODE = process.execPath;

  /* 1 — start detaches; status sees it alive; the log file exists */
  const r1 = D.start(tmp, 'sleeper', NODE, ['-e', 'setTimeout(function(){}, 4000)']);
  ok(!r1.refused && typeof r1.pid === 'number', 'start spawns a detached process and writes the lock');
  ok(D.status(tmp, 'sleeper').state === 'RUNNING', 'status reads RUNNING from the lock while alive');

  /* 2 — RED: never run while alive */
  const r2 = D.start(tmp, 'sleeper', NODE, ['-e', '1']);
  ok(r2.refused === 'ALREADY-RUNNING' && /never run while alive/.test(r2.why),
    'RED: second start under a live lock REFUSED (ALREADY-RUNNING) — concurrent writers race');

  /* 3 — stop kills only the pid in this tool's own lock */
  const r3 = D.stop(tmp, 'sleeper');
  await new Promise(r => setTimeout(r, 300));
  ok(typeof r3.stopped === 'number' && D.status(tmp, 'sleeper').state === 'NOT-RUNNING',
    'stop SIGTERMs the locked pid; status flips to NOT-RUNNING');

  /* 4 — RED: a stale lock (dead pid) is taken over, and the takeover is an ops line */
  const r4 = D.start(tmp, 'sleeper', NODE, ['-e', 'setTimeout(function(){}, 1200)']);
  ok(!r4.refused && r4.takeover === true, 'RED direction closed: stale lock taken over by a fresh start, noted');

  /* 5 — M6: watch blocks until exit and lands the burn on disk, provenanced */
  const w = await D.watch(tmp, 'sleeper', { intervalMs: 150 });
  ok(w.outcome === 'EXITED' && w.watchedSeconds >= 0, 'watch blocked until the process exited');
  const memo = stats.readMemo(path.join(tmp, 'ops-log.jsonl'));
  const burn = memo.records.filter(x => x.metric === 'watchSeconds');
  ok(burn.length === 1 && typeof burn[0].value === 'number'
    && /polling burn/.test(memo.metrics.watchSeconds),
    'the watch burn is ONE provenanced ops-log line with its definition (strict read passes)');
  ok(memo.records.some(x => x.metric === 'detachTakeover'), 'the takeover left its own ops line');

  /* 6 — the box4 fix, extracted: elapsed carries across a resume */
  const carrier = D.makeElapsedCarrier(120000);
  await new Promise(r => setTimeout(r, 60));
  const e = carrier.elapsedMs();
  ok(e >= 120050 && e < 125000, 'elapsed carrier: a resumed clock carries the killed run\'s 120s forward');

  /* 7 — watch --until-exists: the condition file ends the watch */
  const r7 = D.start(tmp, 'writer', NODE, ['-e',
    'setTimeout(function(){ require("fs").writeFileSync("done.flag", "1"); setTimeout(function(){}, 2000); }, 300)']);
  ok(!r7.refused, 'condition-watch subject started');
  const w7 = await D.watch(tmp, 'writer', { untilExists: 'done.flag', intervalMs: 100 });
  ok(w7.outcome === 'CONDITION-FILE', 'watch returned on the condition file, not on exit');
  D.stop(tmp, 'writer');

  console.log(fails === 0 ? 'detach: ' + pass + ' pass, 0 fail' : 'detach: RED — ' + fails + ' failure(s)');
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(fails === 0 ? 0 : 1);
}

main().catch(e => { console.error('detach selftest CRASHED:', e); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(1); });
