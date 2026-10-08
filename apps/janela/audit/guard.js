/* guard.js — the record only grows: checked on the staged commit, before every push.
   apps/janela/audit · cert-machine

     node apps/janela/audit/guard.js      (exit 1 and nothing is pushed if any check fails)

   ledger.js refuses a rewrite when IT writes; this refuses one however it was
   made, on the bytes about to leave. Against HEAD, for the staged changes:

     certs/janela-ledger/*.jsonl         added, or the old file is a byte prefix of
                                         the new one (rows appended, none touched)
     certs/janela-ledger/DEFINITIONS.json  every old key kept with the same value
     corpus/janela/feed/*                added only (a day's feed is written once)
     corpus/janela/feed-noaa/*           added only (NOAA's day, written once the same way)
     corpus/janela/feed-aifs/*           added only (ECMWF AIFS's day, written once the same way)
     corpus/janela/observed/*            added only (a day is observed once)
     certs/janela-decisions/*            added only (a day's published decisions are kept once)
     corpus/janela/currents/*            added only (a day's surface currents are kept once)
     corpus/janela/currents-observed/*   added only (a day of GlobCurrent is observed once)
     corpus/swell/feed/*                 added only (Swell's day of forecasts, written once — apps/swell/audit/feed.py)

   Anything deleted or renamed under these paths is refused.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const cp = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const git = (args, enc) => cp.execFileSync('git', args, { cwd: ROOT, encoding: enc === null ? null : 'utf8', maxBuffer: 1 << 30 });
const LEDGER = 'certs/janela-ledger/', FEED = 'corpus/janela/feed/', NOAA = 'corpus/janela/feed-noaa/', AIFS = 'corpus/janela/feed-aifs/', OBS = 'corpus/janela/observed/', DEC = 'certs/janela-decisions/', CUR = 'corpus/janela/currents/', CUO = 'corpus/janela/currents-observed/', SWF = 'corpus/swell/feed/';

function check() {
  const bad = [];
  const lines = git(['diff', '--cached', '--name-status', '--no-renames', '--', LEDGER, FEED, NOAA, AIFS, OBS, DEC, CUR, CUO, SWF]).split('\n').filter(Boolean);
  for (const l of lines) {
    const [st, file] = l.split('\t');
    if (st === 'A') continue;
    if (st !== 'M') { bad.push(st + ' ' + file + ': only additions are allowed here'); continue; }
    if (file.startsWith(FEED) || file.startsWith(NOAA) || file.startsWith(AIFS) || file.startsWith(OBS) || file.startsWith(DEC) || file.startsWith(CUR) || file.startsWith(CUO) || file.startsWith(SWF)) { bad.push(file + ': written once, never modified'); continue; }
    const old = git(['show', 'HEAD:' + file], null), now = git(['show', ':' + file], null);
    if (file === LEDGER + 'DEFINITIONS.json') {
      const a = JSON.parse(old.toString('utf8')), b = JSON.parse(now.toString('utf8'));
      for (const k of Object.keys(a)) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) bad.push(file + ': definition "' + k + '" changed or removed');
    } else if (/\.jsonl$/.test(file)) {
      if (now.length < old.length || !now.subarray(0, old.length).equals(old)) bad.push(file + ': not an append — an existing row was changed or removed');
    } else bad.push(file + ': modified');
  }
  return { checked: lines.length, bad };
}

if (require.main === module) {
  const r = check();
  if (r.bad.length) { for (const b of r.bad) console.error('janela guard REFUSED: ' + b); process.exit(1); }
  console.log('janela guard: ' + r.checked + ' staged change(s) under the ledger, feed and observed — append-only, ok');
}

module.exports = { check };
