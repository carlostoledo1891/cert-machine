/* pins.js — every file crossed into playground/ hashes to the sha256 its folder's PROVENANCE.json records.

   WHY (2026-10-28). Six folders here were crossed from the operator's bench with a PROVENANCE.json that pins each
   file at both ends, and their builders say "page.js is LIFTED (PROVENANCE.json pins it), so nothing below edits
   it". Nothing checked the pin. Nine crossed files had been edited in place by our own sessions (2026-09-04 to
   2026-10-27: tokens for hex, a shared label placer, classes for inline styles, a dead link) and none of the edits
   was declared, so a pin resolved to bytes that were no longer there, and `make drift` could not see it: it re-hashes
   the LIFT*.json manifests only. The edits are declared now, each in its folder's "patches", and the pins re-taken;
   this file holds them there.

   WHAT IT DOES. check() re-hashes every { file, sha256 } entry of every playground/<dir>/PROVENANCE.json and returns
   the ones that moved or vanished. playground/build.js calls refuse() first, so an undeclared edit to a crossed file
   stops the build and names the file (WARRANT v2 rule 10: a lifted file changes only through its shell or through a
   declared patch). `make drift` runs this file as a report beside the LIFT manifests.

   TO CHANGE A CROSSED FILE ON PURPOSE: edit it, add a line to its folder's "patches" saying what changed and why, and
   set that entry's sha256 and bytes to the new file's (node playground/pins.js prints both). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function manifests() {
  return fs.readdirSync(HERE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(HERE, e.name, 'PROVENANCE.json')))
    .map((e) => ({ dir: e.name, prov: JSON.parse(fs.readFileSync(path.join(HERE, e.name, 'PROVENANCE.json'), 'utf8')) }));
}

/* every pinned file, and whether it still is what its pin says; `tamper` (the red control) swaps one pin */
function check(tamper) {
  const rows = [];
  for (const { dir, prov } of manifests()) {
    for (const f of prov.files || []) {
      if (!f.sha256) continue;
      const want = tamper && tamper.dir === dir && tamper.file === f.file ? tamper.sha256 : f.sha256;
      const p = path.join(HERE, dir, f.file);
      if (!fs.existsSync(p)) { rows.push({ dir, file: f.file, want, got: null, bytes: null }); continue; }
      const buf = fs.readFileSync(p), got = sha(buf);
      rows.push({ dir, file: f.file, want, got, bytes: buf.length, ok: got === want });
    }
  }
  return rows;
}

function refuse() {
  const bad = check().filter((r) => !r.ok);
  if (!bad.length) return;
  throw new Error('playground/pins.js: ' + bad.length + ' crossed file(s) no longer hash to their PROVENANCE.json pin — '
    + bad.map((r) => `${r.dir}/${r.file} (${r.got ? 'now ' + r.got.slice(0, 12) + ', ' + r.bytes + ' bytes' : 'missing'})`).join('; ')
    + '. Declare the edit in that folder\'s "patches" and re-pin sha256 and bytes, or restore the bytes.');
}

module.exports = { check, refuse };

/* node playground/pins.js — the report `make drift` prints, and its red control */
if (require.main === module) {
  const rows = check(), bad = rows.filter((r) => !r.ok);
  for (const r of bad) console.log((r.got ? 'LOCAL EDITED  ' : 'MISSING       ') + 'playground/' + r.dir + '/' + r.file + (r.got ? `  (pin ${r.want.slice(0, 12)}, now ${r.got} · ${r.bytes} bytes)` : ''));
  const first = rows.find((r) => r.ok);
  const red = first && check({ dir: first.dir, file: first.file, sha256: '0'.repeat(64) }).some((r) => r.dir === first.dir && r.file === first.file && !r.ok);
  console.log('playground pins: ' + (rows.length - bad.length) + ' of ' + rows.length + ' crossed files hash to their pin across '
    + new Set(rows.map((r) => r.dir)).size + ' PROVENANCE.json · ' + bad.length + ' moved · red control ' + (red ? 'fired' : 'DID NOT FIRE'));
  if (!red) process.exit(1);
}
