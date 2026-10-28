#!/usr/bin/env node
/* run-batteries.js — the control build's batteries, run side by side instead of one after another.

   WHY (2026-10-28). build-control.js ran its 172 batteries in a row: about 35 minutes on a free machine, and a session
   that changes a page and then waits for the record of a green build waited that long every time. The batteries are
   separate processes that read records; nothing makes them wait for each other. Here they run in a pool of JOBS
   processes (CONTROL_JOBS, default: the cores less two; CONTROL_JOBS=1 is the old row), the slowest first by the
   last run's clock, and three rules keep a parallel run as strict as the serial one:
     1. a battery that drives Chrome (its source requires design/cdp.js) waits until the pool is empty and runs alone,
        because the layout gates measure a page as laid out on a quiet machine;
     2. a battery that comes back red from the pool is run again ALONE, and that run is its verdict. A battery red in the
        pool and green alone shares state with another battery (two writers, a reader of a half-written record) — it is
        NAMED in the result, never hidden, so the race can be fixed. A Chrome gate red on its run alone gets one more
        run, for the same reason: on the first parallel run the ruler read /swell/ at 768 px with 9 spines against 7,
        and 7 on the next run — a page that loads its day over the network measured before it settled;
     3. the verdict of each battery is its exit status, as before; nothing is grepped.
   A HUNG BATTERY IS A RED ONE (2026-10-28). The first parallel run stalled for four and a half hours: the decidível
   battery's Python reference sat in read() on a stdin whose EOF never came, its parent waiting on it; alone, the same
   battery finishes in 10 s. So every battery runs under a clock: five times its last run (at least 3 minutes), or
   30 minutes when there is no last run. A battery past its clock is killed with its whole process group, counts as red,
   and gets rule 2's run alone, under twice the clock.

   usage: node tools/run-batteries.js <list.json>     list: [{ n, argv, py }], the control build's rows in order
   prints: JSON [{ ok, status, tail, secs, solo, raced }] in the same order. The clock of each battery goes to
   .battery-times.json (git-ignored: a measurement of this machine, not a record). */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const TIMES = path.join(ROOT, '.battery-times.json');

const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const JOBS = Math.max(1, Number(process.env.CONTROL_JOBS) || os.cpus().length - 2);
const past = (() => { try { return JSON.parse(fs.readFileSync(TIMES, 'utf8')); } catch (e) { return {}; } })();

const fileOf = (b) => b.argv.find((a) => /\.(m?js|py)$/.test(a)) || '';
const drivesChrome = (b) => { try { return /withChrome|cdp\.js/.test(fs.readFileSync(path.join(ROOT, fileOf(b)), 'utf8')); } catch (e) { return false; } };

const clock = (b) => (past[b.n] ? Math.max(180, 5 * past[b.n]) : 1800);

function run(b, cap) {
  return new Promise((resolve) => {
    const t = Date.now();
    /* detached: the battery leads its own process group, so a kill reaches the children it is waiting on */
    const ch = cp.spawn(b.py ? 'python3' : process.execPath, b.argv, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    let out = '', hung = false;
    const keep = (d) => { out += d; if (out.length > 65536) out = out.slice(-32768); };
    ch.stdout.on('data', keep); ch.stderr.on('data', keep);
    ch.on('error', (e) => { out += '\n' + e.message; });
    const kill = setTimeout(() => { hung = true; try { process.kill(-ch.pid, 'SIGKILL'); } catch (e) { ch.kill('SIGKILL'); } }, cap * 1000);
    ch.on('close', (status) => {
      clearTimeout(kill);
      resolve({ ok: !hung && status === 0, status: hung ? 'killed after ' + cap.toFixed(0) + ' s' : status,
        tail: out.trim().split('\n').slice(-8).join('\n      '), secs: (Date.now() - t) / 1000 });
    });
  });
}

async function pool(idx, jobs) {
  const res = {};
  const queue = idx.slice().sort((a, b) => (past[list[b].n] || 0) - (past[list[a].n] || 0));
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    while (queue.length) { const i = queue.shift(); res[i] = await run(list[i], clock(list[i])); }
  }));
  return res;
}

(async () => {
  const all = list.map((_, i) => i);
  const alone = all.filter((i) => drivesChrome(list[i]));
  const res = await pool(all.filter((i) => !alone.includes(i)), JOBS);
  for (const i of Object.keys(res).map(Number).filter((i) => !res[i].ok)) {   /* rule 2: a red is re-run alone */
    const solo = await run(list[i], 2 * clock(list[i]));
    res[i] = Object.assign(solo, { solo: true, raced: solo.ok });
  }
  for (const i of alone) {   /* rule 2 for the Chrome gates too: a red is run once more, and the second run is the verdict */
    let r = await run(list[i], 2 * clock(list[i]));
    if (!r.ok) { const again = await run(list[i], 2 * clock(list[i])); r = Object.assign(again, { raced: again.ok }); }
    res[i] = Object.assign(r, { solo: true });
  }
  const times = Object.assign({}, past);
  for (const i of all) if (res[i].ok) times[list[i].n] = +res[i].secs.toFixed(1);   /* a red's clock is not its time */
  try { fs.writeFileSync(TIMES, JSON.stringify(times, null, 1) + '\n'); } catch (e) { /* a clock, not a record */ }
  process.stdout.write(JSON.stringify(all.map((i) => res[i])));
})();
