/* pinned-at.js — does a record's sha256 pin of a source file hold? On disk, or at the commit the record was made at.

   WHY (2026-11-16). A frozen record keeps pinning the code that wrote it after that code moves on. The Petrobras
   submissions (apps/contraprova/data/gate-ledger.json, apps/decidivel/data/decidivel-ledger*.json) are frozen as
   submitted, by the operator's ruling of 2026-11-16: they keep pinning the interval kernel as it was, and the kernel
   changed that day (the ±∞ membership fix and the retirement of the padded platform cos/sin). A check that hashes
   only the file on disk would go red on every frozen record for a change that is not theirs; a check that accepts any
   hash would accept a forged one. This is the one rule both kinds of consumer use:

     a pin HOLDS ON DISK          when the file on disk hashes to it;
     a pin HOLDS AT ITS COMMIT    when, at the commit the record was made at — the newest commit whose bytes of the
                                  record are the bytes on disk — the file hashes to it (git show <commit>:<file>);
     otherwise it holds NOWHERE   and the record is refused: a pin that matches neither the code on disk nor the code
                                  the record was committed with names no version this repository can show.

   A record with uncommitted edits has no commit, so only the disk can hold its pins. Needs git (the history is the
   evidence); without it a pin that does not hold on disk holds nowhere.

   usage (as a module): const P = require('tools/pinned-at.js');
     P.check('apps/decidivel/data/decidivel-ledger.json', { 'instruments/interval/interval.js': '9891…' })
       -> { ok, commit, date, pins: [{ file, sha256, holds: 'disk' | 'commit' | null }] }
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const git = (args) => { try { return cp.execFileSync('git', args, { cwd: ROOT, maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const posix = (rel) => rel.split(path.sep).join('/');

/* the commit the record was made at: the newest commit that touched the record and whose blob of it equals the bytes on
   disk (null when the record is uncommitted or edited since, or when git is not there) */
function recordCommit(recordRel) {
  const rel = posix(recordRel);
  const disk = fs.existsSync(path.join(ROOT, rel)) ? sha(fs.readFileSync(path.join(ROOT, rel))) : null;
  if (!disk) return null;
  const log = git(['log', '--format=%H %cs', '--', rel]);
  if (!log) return null;
  for (const line of log.toString().trim().split('\n').filter(Boolean)) {
    const [commit, date] = line.split(' ');
    const blob = git(['show', commit + ':' + rel]);
    if (blob && sha(blob) === disk) return { commit, date };
  }
  return null;
}

/* the file as it was at a commit, hashed (null when it did not exist there) */
function shaAt(commit, fileRel) {
  const blob = git(['show', commit + ':' + posix(fileRel)]);
  return blob ? sha(blob) : null;
}

function check(recordRel, pins) {
  const at = recordCommit(recordRel);
  const out = Object.entries(pins).map(([file, want]) => {
    const p = path.join(ROOT, file);
    if (fs.existsSync(p) && sha(fs.readFileSync(p)) === want) return { file, sha256: want, holds: 'disk' };
    if (at && shaAt(at.commit, file) === want) return { file, sha256: want, holds: 'commit' };
    return { file, sha256: want, holds: null };
  });
  return { ok: out.every((x) => x.holds), onDisk: out.every((x) => x.holds === 'disk'), commit: at ? at.commit : null, date: at ? at.date : null, pins: out };
}

/* one line for a battery or a refusal */
function describe(r) {
  const nowhere = r.pins.filter((x) => !x.holds).map((x) => x.file);
  const atCommit = r.pins.filter((x) => x.holds === 'commit').map((x) => x.file);
  if (nowhere.length) return 'pins that hold NOWHERE (neither on disk nor at ' + (r.commit ? 'the commit the record was made at, ' + r.commit.slice(0, 8) : 'any commit: the record is not committed as it is') + '): ' + nowhere.join(', ');
  if (atCommit.length) return 'pins ' + atCommit.join(', ') + ' as at ' + r.commit.slice(0, 8) + ' (' + r.date + '), the commit it was made at, and the rest as on disk';
  return 'pins the code on disk';
}

module.exports = { check, describe, recordCommit, shaAt };
